// Markdown Table of Contents generator.
//
// Pipeline:
//   1) stripFences: remove blocos de código fenceados (``` e ~~~) e
//      comentários HTML <!-- ... --> pra que # dentro deles não seja
//      confundido com heading.
//   2) extractHeadings: varre linha a linha, reconhece os 2 formatos
//      (ATX com # e Setext com ===/---) e captura { level, text, line }.
//   3) slugify + assignSlugs: anchor no estilo GitHub/GFM com sufixos
//      -1, -2... pra duplicatas.
//   4) buildTree: monta a árvore aninhada via pilha de ancestrais.
//   5) assignNumbers (opcional): prefixa 1.2.3 etc.
//   6) renderToc: emite a lista markdown (com indentação 2/nível).
//   7) insertTocInto: insere o bloco no documento.
//
// Tudo client-side — regex + parser de linha, zero deps.

// ─── 1. Pré-processamento ──────────────────────────────────────────
// Remove blocos de código fenceados ```/~~~ e comentários HTML <!-- -->
// pra que # dentro deles não seja confundido com heading. A função devolve
// o texto limpo — números de linha na saída se referem a esse texto
// processado, não ao original.
function stripFences(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const lineEnd = text.indexOf('\n', i)
    const lineEndIdx = lineEnd === -1 ? text.length : lineEnd
    const line = text.slice(i, lineEndIdx)
    // Fence de código (``` ou ~~~)?
    const fenceMatch = /^( {0,3})(`{3,}|~{3,})([^\n]*)$/.exec(line)
    if (fenceMatch) {
      const fenceChar = fenceMatch[2][0]
      const minRun = fenceMatch[2].length
      // Procura a próxima linha que começa só com o fenceChar (≥ minRun
      // ocorrências), com whitespace depois e nenhum outro caractere.
      let j = lineEndIdx + 1
      let closed = false
      while (j < text.length) {
        const nextEnd = text.indexOf('\n', j)
        const nextEndIdx = nextEnd === -1 ? text.length : nextEnd
        const trimmed = text.slice(j, nextEndIdx).replace(/^ {0,3}/, '')
        let runLen = 0
        while (runLen < trimmed.length && trimmed[runLen] === fenceChar) runLen++
        if (runLen >= minRun && /^[ \t]*$/.test(trimmed.slice(runLen))) {
          closed = true
          i = nextEndIdx + 1
          break
        }
        j = nextEndIdx + 1
      }
      if (!closed) {
        // Sem fechamento — ignora o resto.
        return out
      }
      continue
    }
    // Comentário HTML <!-- ... --> (pode atravessar linhas)
    if (/^ {0,3}<!--/.test(line)) {
      const closeIdx = text.indexOf('-->', i)
      if (closeIdx === -1) return out
      const endIdx = closeIdx + 3
      const nl = text.indexOf('\n', endIdx)
      i = nl === -1 ? text.length : nl + 1
      continue
    }
    // Linha normal: emite como está
    out += text.slice(i, Math.min(lineEndIdx + 1, text.length))
    i = lineEndIdx + 1
  }
  return out
}

// ─── 2. Extração de headings ─────────────────────────────────────
// Devolve [{ level, text, line (1-indexed) }] na ordem em que aparecem.
// ATX: 0-3 espaços + 1-6 # + espaço + texto + (opcional) # de fechamento.
// Setext: linha de heading + linha de === (h1) ou --- (h2).
function extractHeadings(text) {
  const safe = stripFences(text)
  const lines = safe.split('\n')
  const headings = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // ATX
    const atx = /^( {0,3})(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line)
    if (atx) {
      headings.push({
        level: atx[2].length,
        text: stripInline(atx[3]),
        line: i + 1,
      })
      continue
    }
    // Setext
    if (line.trim().length > 0 && i + 1 < lines.length) {
      const next = lines[i + 1]
      if (/^[ \t]{0,3}=+[ \t]*$/.test(next)) {
        headings.push({ level: 1, text: stripInline(line), line: i + 1 })
        i++ // consome o underline
        continue
      }
      // - sozinho é bullet; exige ≥ 2 traços
      if (/^[ \t]{0,3}-{2,}[ \t]*$/.test(next)) {
        headings.push({ level: 2, text: stripInline(line), line: i + 1 })
        i++
        continue
      }
    }
  }
  return headings
}

// Remove formatação inline (ênfase, links preservando texto, código,
// imagens, html simples) e retorna o texto plain.
function stripInline(text) {
  return text
    // ![alt](src) → alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // [text](href) → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // [text][id] → text
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    // <https://...> → igual; <foo@bar> → igual
    .replace(/<((?:https?:\/\/[^>\s]+|[^>@\s]+@[^@\s>]+))>/g, '$1')
    // **bold**, *italic*, ~~strike~~ → texto
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // `code` → code (sem backticks)
    .replace(/`+([^`]+)`+/g, '$1')
    // Tags HTML simples → mantém o nome da tag
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .trim()
}

// ─── 3. Slugify estilo GitHub ───────────────────────────────────
// Lowercase, sem pontuação, espaços viram -, acentos viram transliteração
// simples, sufixos -1, -2... pra duplicatas.
const ACCENT_MAP = {
  'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n',
  'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
  'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
  'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
  'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
  'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
  'Ç': 'C', 'Ñ': 'N',
}

function slugifyBase(text) {
  let s = ''
  for (const c of text) {
    const repl = ACCENT_MAP[c]
    s += repl != null ? repl : c
  }
  s = s
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'section'
}

function assignSlugs(headings) {
  const counts = {}
  return headings.map((h) => {
    const base = slugifyBase(h.text)
    const n = counts[base] || 0
    counts[base] = n + 1
    return { ...h, slug: n === 0 ? base : `${base}-${n}` }
  })
}

// ─── 4. Construção da árvore ─────────────────────────────────────
// Pilha de ancestrais: pra cada heading novo, desempilha ancestrais com
// level >= o do novo e empilha o novo como filho do topo.
function buildTree(headings) {
  const root = { level: 0, children: [] }
  const stack = [root]
  for (const h of headings) {
    const node = { ...h, children: [] }
    while (stack[stack.length - 1].level >= h.level) stack.pop()
    const parent = stack[stack.length - 1]
    parent.children.push(node)
    stack.push(node)
  }
  return root
}

// ─── 5. Numeração opcional ──────────────────────────────────────
// Atribui "1.2.3" ou só "1" por nível, mutando contadores ao descer e
// subindo na hierarquia.
function assignNumbers(root) {
  function recurse(nodes) {
    const counters = []
    for (const node of nodes) {
      counters[node.level - 1] = (counters[node.level - 1] || 0) + 1
      // Zera contadores mais profundos (subindo de nível)
      for (let i = node.level; i < counters.length; i++) counters[i] = 0
      const parts = []
      for (let i = 0; i < node.level; i++) {
        parts.push(String(counters[i] || 1))
      }
      node.number = parts.join('.')
      recurse(node.children)
    }
  }
  recurse(root.children)
}

// ─── 6. Render do TOC ────────────────────────────────────────────
// Nodes fora da faixa (minLevel..maxLevel) são pulados mas seus filhos
// ainda são renderizados no mesmo nível visual — útil pra minLevel=2
// mostrar ## Seções planas sem o # Título pai.
function renderToc(root, opts = {}) {
  const {
    numbered = false,
    minLevel = 1,
    maxLevel = 6,
    indentUnit = 2,
    bullet = '-',
  } = opts
  const lines = []
  function recurse(nodes, depth) {
    for (const node of nodes) {
      if (node.level < minLevel || node.level > maxLevel) {
        recurse(node.children, depth)
        continue
      }
      const indent = ' '.repeat(indentUnit * depth)
      const prefix = numbered ? `${node.number} ` : ''
      lines.push(`${indent}${bullet} ${prefix}[${node.text}](#${node.slug})`)
      recurse(node.children, depth + 1)
    }
  }
  recurse(root.children, 0)
  return lines.join('\n')
}

// ─── 7. Inserção do TOC no documento ─────────────────────────────
// Estratégia:
//   - 'top': insere no começo, antes de qualquer conteúdo.
//   - 'after-first-heading': insere logo após a primeira heading
//     (ATX `#` ou setext `===`/`---`). Comportamento clássico de
//     gh-md-toc: heading, blank line, TOC, blank line, resto.
//   - 'before-line': insere antes da linha N (1-indexed).
//
// Se não houver heading e 'after-first-heading' for pedido, cai pra
// 'top' — não é razoável inserir entre dois parágrafos.
//
// Trabalha com listas de linhas. Após inserir, garante exatamente uma
// linha em branco antes e depois do bloco TOC.
function insertTocInto(document, tocMarkdown, opts = {}) {
  const { position = 'after-first-heading', beforeLine = 0 } = opts
  const srcLines = document.split('\n')
  let insertIdx = 0
  if (position === 'top') {
    insertIdx = 0
  } else if (position === 'after-first-heading') {
    // Encontra a primeira heading — ATX (#...) ou Setext (linha antes
    // de === ou --- só de espaços+hífen/igual). Usar stripFences seria
    // mais rigoroso mas aqui basta um regex em cada linha — se houver
    // fence no caminho, o regex também erra mas o resultado ainda é
    // "insert at top", o que é aceitável.
    let headingIdx = -1
    for (let i = 0; i < srcLines.length; i++) {
      const line = srcLines[i]
      if (/^( {0,3}#{1,6})[ \t]+/.test(line)) {
        headingIdx = i
        break
      }
      // Setext: heading aqui, underline na próxima
      if (i + 1 < srcLines.length && line.trim().length > 0) {
        const next = srcLines[i + 1]
        if (/^[ \t]{0,3}=+[ \t]*$/.test(next) || /^[ \t]{0,3}-{2,}[ \t]*$/.test(next)) {
          headingIdx = i
          break
        }
      }
    }
    if (headingIdx === -1) {
      insertIdx = 0
    } else {
      // Insere após a linha da heading (ou após o underline se Setext).
      const line = srcLines[headingIdx]
      const next = headingIdx + 1 < srcLines.length ? srcLines[headingIdx + 1] : ''
      if (/^[ \t]{0,3}={2,}[ \t]*$/.test(next) || /^[ \t]{0,3}-{2,}[ \t]*$/.test(next)) {
        insertIdx = headingIdx + 2
      } else {
        insertIdx = headingIdx + 1
      }
    }
  } else if (position === 'before-line') {
    insertIdx = Math.max(0, Math.min(srcLines.length, beforeLine - 1))
  }
  const beforeLines = srcLines.slice(0, insertIdx)
  const afterLines = srcLines.slice(insertIdx)
  const tocLines = tocMarkdown.split('\n')
  const trimRight = (arr) => {
    let i = arr.length
    while (i > 0 && arr[i - 1].trim() === '') i--
    return arr.slice(0, i)
  }
  const trimLeft = (arr) => {
    let i = 0
    while (i < arr.length && arr[i].trim() === '') i++
    return arr.slice(i)
  }
  const cleanBefore = trimRight(beforeLines)
  const cleanAfter = trimLeft(afterLines)
  const parts = []
  if (cleanBefore.length > 0) parts.push(...cleanBefore, '')
  parts.push(...tocLines)
  if (cleanAfter.length > 0) parts.push('', ...cleanAfter)
  return parts.join('\n')
}

// ─── 8. Stats ────────────────────────────────────────────────────
function extractHeadingsStats(headings) {
  const byLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  for (const h of headings) byLevel[h.level]++
  return { total: headings.length, byLevel }
}

// ─── API pública ────────────────────────────────────────────────
export function generate(markdown, options = {}) {
  const opts = {
    minLevel: 1,
    maxLevel: 6,
    numbered: false,
    indentUnit: 2,
    bullet: '-',
    insertPosition: 'after-first-heading',
    ...options,
  }
  const headingsRaw = extractHeadings(markdown || '')
  const headings = assignSlugs(headingsRaw)
  const tree = buildTree(headings)
  if (opts.numbered) assignNumbers(tree)
  const tocMarkdown = renderToc(tree, opts)
  const stats = extractHeadingsStats(headings)
  const documentWithToc =
    opts.insertPosition === 'none' || !tocMarkdown
      ? markdown || ''
      : insertTocInto(markdown || '', tocMarkdown, opts)
  return { headings, tree, tocMarkdown, documentWithToc, stats }
}

export {
  extractHeadings,
  assignSlugs,
  buildTree,
  renderToc,
  insertTocInto,
  stripInline,
  slugifyBase,
  extractHeadingsStats,
}