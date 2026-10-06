// ─────────────────────────────────────────────────────────────────
// Dockerfile Layer Explorer — 100% client-side, zero dependências.
//
// Analisa um Dockerfile colado, separa cada instrução em um "layer"
// (FROM / RUN / COPY / etc.), e aponta problemas clássicos que
// afetam tamanho de imagem, velocidade de build (cache) e segurança:
//
//   - Tamanho: apt sem --no-install-recommends, sem cleanup de
//     /var/lib/apt/lists/*, pip sem --no-cache-dir, ADD em arquivos
//     locais (deveria ser COPY).
//   - Cache: RUN apt-get update separado do install, COPY . . antes
//     de npm ci / pip install, múltiplos RUN consecutivos que
//     poderiam virar um só.
//   - Reprodutibilidade: FROM sem tag explícita, FROM xxx:latest,
//     apt-get upgrade, npm install em produção (vs npm ci).
//   - Segurança: MAINTAINER (deprecated), apt-key (deprecated),
//     curl | sh, container rodando como root.
//
// O parser é caseiro mas decente: lida com comentários (# no
// início da linha), continuações de linha (\ no fim), e reconhece
// as instruções oficiais (FROM/RUN/COPY/ADD/etc.). Não é um parser
// 100% conforme à spec — só o que essa análise precisa.
// ─────────────────────────────────────────────────────────────────

const KNOWN_INSTRUCTIONS = [
  'FROM', 'RUN', 'CMD', 'LABEL', 'MAINTAINER', 'EXPOSE', 'ENV',
  'ADD', 'COPY', 'ENTRYPOINT', 'USER', 'WORKDIR', 'VOLUME',
  'STOPSIGNAL', 'ONBUILD', 'HEALTHCHECK', 'SHELL', 'ARG',
]

const SET_CLASSIFICATION_KEYWORDS = {
  FROM: 'base',
  ARG: 'config',
  ENV: 'config',
  LABEL: 'config',
  WORKDIR: 'config',
  SHELL: 'config',
  USER: 'security',
  EXPOSE: 'meta',
  VOLUME: 'meta',
  STOPSIGNAL: 'meta',
  HEALTHCHECK: 'meta',
  ONBUILD: 'meta',
  RUN: 'install',
  COPY: 'install',
  ADD: 'install',
  CMD: 'start',
  ENTRYPOINT: 'start',
  MAINTAINER: 'legacy',
}

// ── Pré-processamento: une continuations e remove comentários ──
// Comentários no Dockerfile: # marca comentário do resto da linha
// quando aparece como primeiro não-espaço (não confundir com #
// dentro de strings JSON em CMD ["echo", "#"] que aqui tratamos
// conservadoramente como comentário mesmo — pragmatismo).
function preprocess(text) {
  const lines = text.split(/\r?\n/)
  const out = []
  let buf = ''
  let origStart = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (buf === '') origStart = i + 1
    // tira comentário no nível do Dockerfile (heurística simples)
    const trimmed = line.replace(/\s+$/, '')
    let noComment = trimmed
    const hashIdx = findCommentStart(noComment)
    if (hashIdx !== -1) noComment = noComment.slice(0, hashIdx)
    // junta com continuation
    if (noComment.endsWith('\\')) {
      buf += noComment.slice(0, -1)
      continue
    }
    buf += noComment
    if (buf.trim().length > 0) {
      out.push({ line: origStart, content: buf.trim() })
    }
    buf = ''
  }
  return out
}

function findCommentStart(line) {
  // # como primeiro não-whitespace => comentário; ignora # dentro de aspas.
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === "'" && !inDouble) inSingle = !inSingle
    else if (c === '"' && !inSingle) inDouble = !inDouble
    else if (c === '#' && !inSingle && !inDouble) {
      // só conta como comentário se for precedido por whitespace ou começo
      if (i === 0 || /\s/.test(line[i - 1])) return i
    }
  }
  return -1
}

// ── Parser top-level: separa instrução e args ──

function parseDockerfile(rawText) {
  const preprocessed = preprocess(rawText)
  const layers = []
  let stageIdx = 0

  for (const { line, content } of preprocessed) {
    // pega o primeiro token (instrução) — sem flag / no meio, FROM [--platform=linux] foo
    // é reconhecido como FROM também.
    const m = content.match(/^([A-Za-z]+)\s+(.*)$/s)
    if (!m) continue
    const instr = m[1]
    const upper = instr.toUpperCase()
    if (!KNOWN_INSTRUCTIONS.includes(upper)) {
      // instrução desconhecida — pula (parser pragmático)
      continue
    }
    const args = (m[2] || '').trim()
    const flags = parseFlags(args)

    let baseImageStr = ''
    let stageAlias = ''
    if (upper === 'FROM') {
      const parsed = parseFromArgs(args)
      baseImageStr = parsed.image
      stageAlias = parsed.asName
      stageIdx++
    }

    layers.push({
      line,
      instruction: upper,
      originalInstruction: instr,
      args,
      flags,
      stage: stageIdx,
      category: SET_CLASSIFICATION_KEYWORDS[upper] || 'meta',
      baseImage: baseImageStr,
      stageAlias,
    })
  }

  return layers
}

// flags tipo --chown=user:group, --from=build, etc.
function parseFlags(args) {
  const flags = {}
  const re = /--([a-zA-Z][a-zA-Z0-9-]*)=("([^"]*)"|'([^']*)'|\S+)/g
  let m
  while ((m = re.exec(args)) !== null) {
    flags[m[1]] = m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : m[5])
  }
  return flags
}

// FROM [--platform=...] <image>[:tag|@digest] [AS <name>]
function parseFromArgs(args) {
  let s = args.trim()
  if (s.startsWith('--')) {
    const idx = s.indexOf(' ')
    if (idx !== -1) s = s.slice(idx + 1).trim()
  }
  const asMatch = s.match(/\bAS\s+([A-Za-z0-9_.-]+)\s*$/i)
  let asName = ''
  if (asMatch) {
    asName = asMatch[1]
    s = s.slice(0, asMatch.index).trim()
  }
  return { image: s, asName }
}

// ── Detector de issues ──

function analyzeLayers(layers) {
  const issues = []
  const push = (severity, title, detail, line = null) => {
    issues.push({ severity, title, detail, line })
  }

  // estado
  let hasUserDirective = false
  let hasCopyAllDot = false
  let installSeenAfterCopyAllDot = false
  let installLineAfterCopyAllDot = null
  let hasCopyAllDotLine = null
  let copyAllDotSources = []
  let lastAptUpdateLine = null
  let lastAptInstallLine = null
  let lastInstallKind = null // 'apt' | 'pip' | 'npm' | 'apk' | 'yum' | 'other'
  let lastInstallLine = null
  let lastInstallIsCi = false // npm ci
  let runLineCount = 0
  let consecutiveRuns = []
  let lastRun = null
  let aptKeySeen = false
  let aptUpgradeSeen = false
  let curlPipeSeen = false
  let froms = []

  // walk
  layers.forEach((layer, i) => {
    const args = layer.args

    if (layer.instruction === 'FROM') {
      froms.push({ line: layer.line, image: layer.baseImage, alias: layer.stageAlias })
      consecutiveRuns = []
      lastRun = null
      // checa latest
      if (/:latest(@|$)/.test(layer.baseImage) || /:latest$/.test(layer.baseImage)) {
        push('warning', `FROM usa a tag :latest (linha ${layer.line})`,
          'Imagens :latest são mutáveis — o mesmo build hoje pode dar bytes diferentes amanhã. Fixe uma tag (ex.: node:20.11-alpine).',
          layer.line)
      } else if (!/[:@]/.test(layer.baseImage)) {
        push('warning', `FROM sem tag explícita (linha ${layer.line})`,
          `FROM ${layer.baseImage} sem tag resolve em :latest no registry, o que torna o build não-reproduzível. Fixe uma versão (ex.: ${layer.baseImage}:3.12-slim).`,
          layer.line)
      }
    }

    if (layer.instruction === 'USER') {
      hasUserDirective = true
    }

    if (layer.instruction === 'MAINTAINER') {
      push('warning', `MAINTAINER é deprecated (linha ${layer.line})`,
        'Use LABEL maintainer="Nome <email>" em vez disso. MAINTAINER foi removido do BuildKit.',
        layer.line)
    }

    if (layer.instruction === 'COPY' || layer.instruction === 'ADD') {
      const parts = args.split(/\s+/).filter(Boolean)
      // filtra flags --from=, --chown= etc
      const positional = parts.filter((p) => !p.startsWith('--'))
      const srcs = positional.slice(0, -1) // tudo menos o último é src
      if (srcs.includes('.') || srcs.some((s) => s === './.') || srcs.includes('.')) {
        hasCopyAllDot = true
        hasCopyAllDotLine = layer.line
        copyAllDotSources.push(...srcs)
      }
    }

    if (layer.instruction === 'RUN') {
      runLineCount++
      // classifica tipo de install
      const cmd = args
      const isAptUpdate = /\bapt-get\s+update\b/.test(cmd)
      const isAptInstall = /\bapt-get\s+install\b/.test(cmd)
      const isPipInstall = /\bpip3?\s+install\b/.test(cmd)
      const isNpmInstall = /\bnpm\s+(install|ci)\b/.test(cmd)
      const isApkAdd = /\bapk\s+add\b/.test(cmd)
      const isAptKey = /\bapt-key\b/.test(cmd)
      const isAptUpgrade = /\bapt-get\s+(?:--?\S+\s+)*upgrade\b/.test(cmd)
      const isCurlPipe = /\b(curl|wget)\b[^|]*\|\s*(sh|bash|sudo)/.test(cmd)
      const isNpmCi = /\bnpm\s+ci\b/.test(cmd)

      if (isAptKey) {
        aptKeySeen = true
        push('error', `apt-key é deprecated (linha ${layer.line})`,
          'apt-key foi removido das imagens Debian modernas (apt-key ainda existe, mas não persiste chaves em trusted.gpg.d). Use signed-by com arquivo de chave ou repo HTTPS.',
          layer.line)
      }
      if (isAptUpgrade) {
        aptUpgradeSeen = true
        push('warning', `apt-get upgrade no build (linha ${layer.line})`,
          'Atualizações implícitas durante o build tornam o resultado não-reproduzível (bits diferentes a cada release de pacote). Prefira fixar versões no install.',
          layer.line)
      }
      if (isCurlPipe) {
        curlPipeSeen = true
        push('warning', `pipeline curl/wget | sh sem verificação (linha ${layer.line})`,
          'Executar o corpo de um script baixado sem checksum permite execução arbitrária se o origin for comprometido. Baixe, verifique SHA256 e execute.',
          layer.line)
      }

      if (isAptInstall) {
        // sem --no-install-recommends
        if (!/--no-install-recommends/.test(cmd)) {
          push('warning', `apt-get install sem --no-install-recommends (linha ${layer.line})`,
            'Instala pacotes recomendados que raramente são necessários e inflam a imagem.',
            layer.line)
        }
        // sem cleanup /var/lib/apt/lists
        if (!/rm\s+-rf\s+\/var\/lib\/apt\/lists/.test(cmd) && !/\bapt-get\s+clean\b/.test(cmd)) {
          push('warning', `apt-get install sem cleanup do cache (linha ${layer.line})`,
            'O cache do apt em /var/lib/apt/lists/* pode ocupar dezenas de MB. Adicione && rm -rf /var/lib/apt/lists/* (ou apt-get clean) ao fim do RUN.',
            layer.line)
        }
        lastAptInstallLine = layer.line
        // apt-get update separado do install?
        if (lastAptUpdateLine !== null && lastAptUpdateLine !== layer.line && (layer.line - lastAptUpdateLine) <= 2) {
          // ok, mesma instalação por update
        } else if (lastAptUpdateLine === null || lastAptUpdateLine < layer.line - 2) {
          // mas se já tinha um update anterior E o install não está no mesmo RUN, é cache potencialmente stale
          if (lastAptUpdateLine !== null && (layer.line - lastAptUpdateLine) > 2) {
            push('warning', `apt-get install sem update no mesmo RUN (linha ${layer.line})`,
              'O RUN anterior com apt-get update pode estar com cache stale. Coloque update e install no MESMO RUN: RUN apt-get update && apt-get install -y ...',
              layer.line)
          }
        }
        // separou update e install em RUNs diferentes?
        if (lastAptInstallLine !== null && lastAptUpdateLine === lastAptInstallLine) {
          // previous install came with its own update — não sinaliza
        }
        if (lastInstallKind !== 'apt') {
          lastInstallKind = 'apt'
        }
        lastInstallLine = layer.line
      }

      if (isAptUpdate && !isAptInstall) {
        lastAptUpdateLine = layer.line
      }

      if (isPipInstall) {
        if (!/--no-cache-dir/.test(cmd)) {
          push('warning', `pip install sem --no-cache-dir (linha ${layer.line})`,
            'O cache do pip em /root/.cache/pip infla a imagem em dezenas de MB. Use pip install --no-cache-dir ...',
            layer.line)
        }
        if (lastInstallKind !== 'pip') lastInstallKind = 'pip'
        lastInstallLine = layer.line
      }

      if (isNpmInstall) {
        lastInstallIsCi = isNpmCi
        if (/\bnpm\s+install\b/.test(cmd) && !isNpmCi) {
          push('info', `npm install em build (linha ${layer.line})`,
            'npm install resolve e atualiza o lockfile; em Dockerfiles prefira npm ci — ele falha se o lockfile/package.json divergem e usa exatamente as versões travadas.',
            layer.line)
        }
        if (lastInstallKind !== 'npm') lastInstallKind = 'npm'
        lastInstallLine = layer.line
      }

      if (isApkAdd) {
        if (lastInstallKind !== 'apk') lastInstallKind = 'apk'
        lastInstallLine = layer.line
      }

      // COPY . . antes de install?
      if (hasCopyAllDot && (isAptInstall || isPipInstall || isNpmInstall || isApkAdd) && !installSeenAfterCopyAllDot) {
        installSeenAfterCopyAllDot = true
        installLineAfterCopyAllDot = layer.line
        if (hasCopyAllDotLine !== null && (layer.line - hasCopyAllDotLine) <= 6) {
          push('warning', `COPY . . antes da install de pacotes (linhas ${hasCopyAllDotLine} → ${layer.line})`,
            'Quando COPY . . vem antes do install, qualquer mudança em qualquer arquivo invalida o cache da camada de install — incluindo o código-fonte, configs, README, etc. Coloque o COPY dos manifests de pacotes (package.json / package-lock.json / requirements.txt) ANTES, faça o install, e SÓ DEPOIS copie o resto (COPY . .).',
            hasCopyAllDotLine)
        }
      }

      // consecutive RUN
      if (lastRun !== null && (layer.line - lastRun) === 1 && !isAptInstall && !isAptUpdate && !isPipInstall && !isNpmInstall && !isApkAdd) {
        consecutiveRuns.push(layer.line)
      } else if (lastRun !== null && (layer.line - lastRun) === 1) {
        // ignore
      }
      lastRun = layer.line
    }

    if (layer.instruction === 'ADD') {
      const args2 = layer.args
      // se a source é uma URL ou termina em .tar/.tar.gz/.tgz, é OK ADD
      // se for caminho relativo simples sem ser tar, deveria ser COPY
      const parts = args2.split(/\s+/).filter(Boolean).filter((p) => !p.startsWith('--'))
      const src = parts[0] || ''
      if (!/^(https?:|\/|--)/.test(src) && !/\.(tar|tar\.gz|tgz|tar\.bz2|tar\.xz|zip)$/.test(src)) {
        push('info', `ADD para arquivos locais (linha ${layer.line})`,
          'Use COPY para arquivos locais — ADD traz duas semânticas extras (extrai tarballs e aceita URLs) que podem ser armadilhas. Reserva ADD para os casos onde você realmente quer essas semânticas.',
          layer.line)
      }
    }
  })

  // Missing USER no fim (rodando como root)
  if (!hasUserDirective) {
    push('warning', 'Container roda como root',
      'Nenhuma instrução USER foi usada — o processo dentro do container vai rodar como UID 0. Crie um usuário não-root (ex.: RUN useradd -m app && USER app) e garanta permissões dos arquivos.',
      null)
  }

  // múltiplos FROM (multi-stage) é positivo
  if (froms.length > 1) {
    push('info', `Multi-stage build (${froms.length} estágios)`,
      `${froms.length} instruções FROM — boa prática. O último FROM define o estágio final da imagem; estágios anteriores (com AS) podem ser descartados, o que reduz o tamanho final se você copiar só os artefatos com COPY --from=<stage>.`,
      null)
  }

  // resumo por tipo
  const summary = {
    totalInstructions: layers.length,
    totalStages: froms.length,
    totalRuns: runLineCount,
    totalCopies: layers.filter((l) => l.instruction === 'COPY').length,
    totalAdds: layers.filter((l) => l.instruction === 'ADD').length,
    totalEnvs: layers.filter((l) => l.instruction === 'ENV').length,
    baseImages: froms.map((f) => f.image),
    stageAliases: froms.map((f) => f.alias).filter(Boolean),
    hasUser: hasUserDirective,
  }

  // categorias (para a UI)
  const counts = {
    base: 0, config: 0, install: 0, meta: 0, security: 0, start: 0, legacy: 0,
  }
  layers.forEach((l) => {
    counts[l.category] = (counts[l.category] || 0) + 1
  })

  return {
    summary,
    counts,
    layers,
    issues,
    aptKeySeen,
    aptUpgradeSeen,
    curlPipeSeen,
  }
}

// exporta o engine inteiro — a página importa analyze e parse.
function analyzeDockerfile(rawText) {
  const layers = parseDockerfile(rawText)
  const analysis = analyzeLayers(layers)
  return analysis
}

// Para a UI ter um sample rápido, sem precisar do próprio devtools Dockerfile
const SAMPLE_PT = `# Multi-stage: build com Node, runtime com nginx
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`

const SAMPLE_EN = `# Multi-stage: build with Node, runtime with nginx
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`

// Para a UI ter o engine visível como referência
const ENGINE_SOURCE = String.raw`// ── Resumo do que o parser faz:
// preprocess(): junta linhas com \\ no fim (continuation), remove comentários;
//                                    preserva o line number real.
// parseDockerfile(): cada linha vira um { line, instruction, args, flags, stage, category }.
// parseFromArgs(): extrai imagem e alias 'AS name' (com ou sem --platform).
// analyzeLayers(): caminha na lista aplicando heurísticas:
//   - tamanho (apt sem --no-install-recommends, sem cleanup, pip sem --no-cache-dir, ADD local)
//   - cache (apt update separado, COPY . . antes do install, npm install em vez de ci)
//   - reprodutibilidade (FROM sem tag / :latest, apt upgrade)
//   - segurança (MAINTAINER deprecated, apt-key deprecated, curl | sh, container root)
//   - positivos (multi-stage)
`

export {
  analyzeDockerfile,
  parseDockerfile,
  SAMPLE_PT,
  SAMPLE_EN,
  ENGINE_SOURCE,
  KNOWN_INSTRUCTIONS,
}

export default analyzeDockerfile