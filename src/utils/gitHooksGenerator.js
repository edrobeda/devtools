// Gerador de scripts de Git Hooks (pre-commit, prepare-commit-msg,
// commit-msg e pre-push) 100% client-side. O motor monta scripts bash a
// partir de um conjunto configurável de checagens e opções.
//
// ATENÇÃO: os scripts gerados contêm "$", "${}" e "$()" — dentro dos
// template literals abaixo eles são escapados como \${} sempre que precisam
// aparecer literalmente (são sintaxe do bash sendo emitida). Não "limpe" os
// escapes, senão o bundler interpretaria a interpolação do próprio JS.

const CONVENTIONAL_TYPES = [
  'feat', 'fix', 'chore', 'docs', 'style',
  'refactor', 'test', 'perf', 'build', 'ci', 'revert',
]

const NAME = (pt, en) => ({ pt, en })

// ── Metadados dos hooks ───────────────────────────────────────────
export const HOOKS = {
  'pre-commit': {
    value: 'pre-commit',
    name: NAME('Pre-commit', 'Pre-commit'),
    desc: NAME(
      'Roda antes de cada commit — valida o que está staged.',
      'Runs before every commit — validates what is staged.'
    ),
    defaultChecks: [
      'trailingWhitespace',
      'conflictMarkers',
      'secrets',
      'blacklist',
      'largeFiles',
      'jsonSyntax',
      'nodeSyntax',
      'debuggerStatements',
    ],
  },
  'prepare-commit-msg': {
    value: 'prepare-commit-msg',
    name: NAME('Prepare-commit-msg', 'Prepare-commit-msg'),
    desc: NAME(
      'Roda antes do editor abrir — pode pré-preencher a mensagem a partir do branch.',
      'Runs before the editor opens — can pre-fill the message from the branch name.'
    ),
    defaultChecks: [],
  },
  'commit-msg': {
    value: 'commit-msg',
    name: NAME('Commit-msg', 'Commit-msg'),
    desc: NAME(
      'Valida a mensagem de commit depois de escrita.',
      'Validates the commit message after it is written.'
    ),
    defaultChecks: [],
  },
  'pre-push': {
    value: 'pre-push',
    name: NAME('Pre-push', 'Pre-push'),
    desc: NAME(
      'Roda antes do push — testes, lint e proteção de branches.',
      'Runs before pushing — tests, lint and branch protection.'
    ),
    defaultChecks: [],
  },
}

// ── Metadados das checagens (o pre-commit tem lista selecionável) ──
const CHECK_META = {
  trailingWhitespace: {
    name: NAME('Whitespace no fim das linhas', 'Trailing whitespace'),
    desc: NAME('Bloqueia linhas com espaços/tabs no final.', 'Blocks lines ending with spaces/tabs.'),
  },
  conflictMarkers: {
    name: NAME('Marcadores de conflito', 'Merge conflict markers'),
    desc: NAME('Detecta <<<<<<< / ======= / >>>>>>> do git.', 'Detects <<<<<<< / ======= / >>>>>>> markers.'),
  },
  secrets: {
    name: NAME('Segredos (chaves e tokens)', 'Secrets (keys & tokens)'),
    desc: NAME(
      'Bloqueia padrões de AWS, GitHub, Stripe e chaves privadas.',
      'Blocks AWS, GitHub, Stripe patterns and private keys.'
    ),
  },
  blacklist: {
    name: NAME('Arquivos sensíveis (.env, chaves)', 'Blocked files (.env, keys)'),
    desc: NAME('Proíbe comitar arquivos sensíveis (glob por linha).', 'Forbids committing sensitive files (one glob per line).'),
  },
  largeFiles: {
    name: NAME('Arquivos grandes', 'Large files'),
    desc: NAME('Bloqueia arquivos acima do tamanho máximo.', 'Blocks files above the max size.'),
  },
  jsonSyntax: {
    name: NAME('Sintaxe de JSON', 'JSON syntax'),
    desc: NAME('Valida JSON staged com python3 -m json.tool.', 'Validates staged JSON with python3 -m json.tool.'),
  },
  nodeSyntax: {
    name: NAME('Sintaxe de JS (node --check)', 'JS syntax (node --check)'),
    desc: NAME('Checa sintaxe de JS/MJS/CJS staged.', 'Checks the syntax of staged JS/MJS/CJS.'),
  },
  debuggerStatements: {
    name: NAME('debugger / console.log', 'debugger / console.log'),
    desc: NAME('Bloqueia depuração esquecida em JS/TS.', 'Blocks leftover debugging in JS/TS.'),
  },
  lint: {
    name: NAME('Lint nos arquivos staged', 'Lint staged files'),
    desc: NAME('Roda seu comando de lint apenas nos staged.', 'Runs your lint command on staged files only.'),
  },
  formatCheck: {
    name: NAME('Format check (ex.: prettier)', 'Format check (e.g.: prettier)'),
    desc: NAME('Roda o formatador em modo --check nos staged.', 'Runs the formatter in --check mode on staged files.'),
  },
}

export function getHooks(lang) {
  return Object.values(HOOKS).map((h) => ({
    value: h.value,
    name: h.name[lang] || h.name.en,
    desc: h.desc[lang] || h.desc.en,
  }))
}

export function getChecksForHook(hook, lang) {
  if (hook !== 'pre-commit') return []
  return Object.keys(CHECK_META).map((key) => {
    const c = CHECK_META[key]
    return {
      key,
      name: c.name[lang] || c.name.en,
      desc: c.desc[lang] || c.desc.en,
    }
  })
}

export function getPresets(lang) {
  const p = (pt, en) => ({ pt, en })[lang] || en
  return [
    {
      key: 'minimo',
      name: p('Mínimo', 'Minimal'),
      desc: p('Duas checagens leves que cabem em qualquer repo.', 'Two lightweight checks that fit any repo.'),
      config: { hook: 'pre-commit', checks: ['trailingWhitespace', 'conflictMarkers'] },
    },
    {
      key: 'padrao',
      name: p('Padrão', 'Standard'),
      desc: p('Conjunto equilibrado para a maioria dos projetos.', 'Balanced set for most projects.'),
      config: { hook: 'pre-commit', checks: [...HOOKS['pre-commit'].defaultChecks] },
    },
    {
      key: 'frontend',
      name: p('Front-end com lint', 'Frontend + lint'),
      desc: p('Sintaxe, debug e lint/prettier nos staged.', 'Syntax checks, debug and lint/prettier on staged files.'),
      config: {
        hook: 'pre-commit',
        checks: ['trailingWhitespace', 'conflictMarkers', 'jsonSyntax', 'nodeSyntax', 'debuggerStatements', 'lint', 'formatCheck'],
      },
    },
    {
      key: 'seguranca',
      name: p('Segurança', 'Security'),
      desc: p('Foco em segredos, arquivos sensíveis e binários grandes.', 'Focus on secrets, sensitive files and large binaries.'),
      config: {
        hook: 'pre-commit',
        checks: ['secrets', 'blacklist', 'largeFiles', 'trailingWhitespace', 'conflictMarkers'],
      },
    },
    {
      key: 'conventional',
      name: p('Conventional commits', 'Conventional commits'),
      desc: p('Valida mensagens de commit no padrão Conventional Commits.', 'Enforces the Conventional Commits format.'),
      config: { hook: 'commit-msg', checks: [] },
    },
    {
      key: 'prepush',
      name: p('Pre-push com testes', 'Pre-push with tests'),
      desc: p('Testes e lint antes de empurrar + protege main/master.', 'Runs tests and lint before pushing, protects main/master.'),
      config: { hook: 'pre-push', checks: [] },
    },
  ]
}

export function getDefaultOptions() {
  return {
    lintCommand: 'npm run lint',
    formatCommand: 'npx prettier --check',
    testCommand: 'npm test',
    maxMB: 5,
    blockedFiles: '.env*\n*.pem\n*.key\nid_rsa\nid_dsa\ncredentials.json',
    enforceConventional: true,
    minLength: 10,
    maxLength: 72,
    blockWip: true,
    conventionalPrefix: true,
    appendIssue: true,
    runTests: true,
    runLint: true,
    blockProtectedBranches: true,
  }
}

export function getDefaultConfig() {
  return {
    hook: 'pre-commit',
    checks: [...HOOKS['pre-commit'].defaultChecks],
    options: getDefaultOptions(),
  }
}

export function getHookDefaultConfig(hook) {
  const h = HOOKS[hook]
  return {
    hook,
    checks: h ? [...h.defaultChecks] : [],
    options: getDefaultOptions(),
  }
}

// ── Fragmentos compartilhados ─────────────────────────────────────
function stagedFn() {
  return [
    '# Lista os arquivos staged (modificados/criados/copiados/renomeados)',
    'staged() {',
    '  git diff --cached --name-only --diff-filter=ACM --no-ext-diff',
    '}',
    '',
  ]
}

function header(hookName, lang) {
  const t = lang === 'pt'
    ? 'Script bash gerado pelo DevTools - Git Hooks Generator.'
    : 'Bash script generated by the DevTools - Git Hooks Generator.'
  return [
    '#!/usr/bin/env bash',
    `# ${t}`,
    '# Instale: copie para .git/hooks/' + hookName + ' e torne executável: chmod +x',
    `#          (ou aponte git config core.hooksPath para uma pasta de hooks versionada)`,
    'set -euo pipefail',
    '',
  ]
}

function endLine(lang) {
  return lang === 'pt' ? '✔ hook finalizado sem problemas' : '✔ hook finished with no issues'
}

// ── Checagens do pre-commit ───────────────────────────────────────
const CHECKS = {
  trailingWhitespace() {
    return [
      'echo "  → whitespace no fim das linhas"',
      'WS="$(git diff --cached --check)"',
      'if [ -n "$WS" ]; then',
      '  echo "✗ linhas com espaço/tab no final entre os arquivos staged:"',
      '  echo "$WS"',
      '  exit 1',
      'fi',
      '',
    ]
  },
  conflictMarkers() {
    return [
      'echo "  → marcadores de conflito"',
      "if git diff --cached | grep -nE '^(<<<<<<<|=======|>>>>>>>)' >/dev/null; then",
      '  echo "✗ conflitos de merge pendentes nos arquivos staged:"',
      "  git diff --cached | grep -nE '^(<<<<<<<|=======|>>>>>>>)' || true",
      '  exit 1',
      'fi',
      '',
    ]
  },
  secrets() {
    return [
      'echo "  → segredos/chaves"',
      "SECRET_PATTERNS='(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|AIza[0-9A-Za-z_-]{35}|sk_live_[A-Za-z0-9]{24})'",
      'while IFS= read -r file; do',
      '  if grep -nE "$SECRET_PATTERNS" "$file" >/dev/null 2>&1; then',
      '    echo "✗ possível segredo em $file:"',
      '    grep -nE "$SECRET_PATTERNS" "$file" || true',
      '    exit 1',
      '  fi',
      'done < <(staged)',
      '',
    ]
  },
  blacklist(opts) {
    const items = (opts.blockedFiles || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const lines = ['echo "  → arquivos sensíveis"', 'BLOCKED=(']
    items.forEach((it) => lines.push(`    "${it.replace(/"/g, '\\"')}"`))
    lines.push(
      ')',
      'while IFS= read -r file; do',
      '  base="$(basename "$file")"',
      '  for pat in "${BLOCKED[@]}"; do',
      '    case "$base" in',
      '      $pat)',
      '        echo "✗ arquivo bloqueado: $file"',
      '        exit 1',
      '        ;;',
      '    esac',
      '  done',
      'done < <(staged)',
      '',
    )
    return lines
  },
  largeFiles(opts) {
    const maxBytes = Math.max(1, Number(opts.maxMB) || 5) * 1024 * 1024
    return [
      'echo "  → arquivos grandes"',
      `MAX_BYTES='${maxBytes}'`,
      'while IFS= read -r file; do',
      '  [ -f "$file" ] || continue',
      '  size=$(stat -c%s "$file" 2>/dev/null || echo 0)',
      '  if [ "$size" -gt "$MAX_BYTES" ]; then',
      '    echo "✗ arquivo grande: $file ($(printf "%d MB" $(( size / 1024 / 1024 )) ))"',
      '    exit 1',
      '  fi',
      'done < <(staged)',
      '',
    ]
  },
  jsonSyntax() {
    return [
      'echo "  → sintaxe de JSON"',
      'while IFS= read -r file; do',
      '  case "$file" in',
      '    *.json)',
      '      python3 -m json.tool "$file" >/dev/null 2>&1 || {',
      '        echo "✗ JSON inválido: $file"',
      '        exit 1',
      '      }',
      '      ;;',
      '  esac',
      'done < <(staged)',
      '',
    ]
  },
  nodeSyntax() {
    return [
      'echo "  → sintaxe de JS (node --check)"',
      'while IFS= read -r file; do',
      '  case "$file" in',
      '    *.js|*.mjs|*.cjs)',
      '      node --check "$file" >/dev/null 2>&1 || {',
      '        echo "✗ erro de sintaxe em $file"',
      '        exit 1',
      '      }',
      '      ;;',
      '  esac',
      'done < <(staged)',
      '',
    ]
  },
  debuggerStatements() {
    return [
      'echo "  → debugger / console.log"',
      "DBG_PATTERN='(^|[;[:space:]])debugger([;[:space:]]|$)|console\\.log'",
      'while IFS= read -r file; do',
      '  case "$file" in',
      '    *.js|*.jsx|*.ts|*.tsx)',
      '      if grep -nE "$DBG_PATTERN" "$file" >/dev/null 2>&1; then',
      '        echo "✗ possível código de debug em $file:"',
      '        grep -nE "$DBG_PATTERN" "$file" || true',
      '        exit 1',
      '      fi',
      '      ;;',
      '  esac',
      'done < <(staged)',
      '',
    ]
  },
  lint(opts) {
    const cmd = (opts.lintCommand || 'npm run lint').replace(/"/g, '\\"')
    return [
      'echo "  → lint nos arquivos staged"',
      'STAGED_JS=()',
      'while IFS= read -r file; do',
      '  case "$file" in',
      '    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.vue) STAGED_JS+=("$file") ;;',
      '  esac',
      'done < <(staged)',
      `LINT_CMD="${cmd}"`,
      'if [ ${#STAGED_JS[@]} -gt 0 ]; then',
      '  echo "  →  lint: ${#STAGED_JS[@]} arquivo(s)"',
      '  $LINT_CMD "${STAGED_JS[@]}" || { echo "✗ lint falhou"; exit 1; }',
      'else',
      '  echo "  →  nenhum arquivo de código staged; pulando lint"',
      'fi',
      '',
    ]
  },
  formatCheck(opts) {
    const cmd = (opts.formatCommand || 'npx prettier --check').replace(/"/g, '\\"')
    return [
      'echo "  → format check"',
      `FORMAT_CMD="${cmd}"`,
      'if [ ${#STAGED_JS[@]} -gt 0 ]; then',
      '  echo "  →  format check em ${#STAGED_JS[@]} arquivo(s)"',
      '  $FORMAT_CMD "${STAGED_JS[@]}" || { echo "✗ formatação incorreta"; exit 1; }',
      'fi',
      '',
    ]
  },
}

// ── Hooks de mensagem (prepare-commit-msg / commit-msg) ───────────
function buildPrepareCommitMsg(opts) {
  const lines = [
    '# $1 = caminho do arquivo temporário com a mensagem do commit',
    '[ $# -ge 1 ] || exit 0',
    'MSG_FILE="$1"',
    'branch="$(git symbolic-ref --short HEAD 2>/dev/null || echo "")"',
    '',
  ]
  if (opts.conventionalPrefix) {
    lines.push(
      '# Adiciona o prefixo conventional commit a partir do nome do branch',
      'if [ -n "$branch" ]; then',
      '  case "$branch" in',
      '    feat/*) prefix="feat" ;;',
      '    fix/*) prefix="fix" ;;',
      '    chore/*) prefix="chore" ;;',
      '    docs/*) prefix="docs" ;;',
      '    style/*) prefix="style" ;;',
      '    refactor/*) prefix="refactor" ;;',
      '    test/*) prefix="test" ;;',
      '    perf/*) prefix="perf" ;;',
      '    build/*) prefix="build" ;;',
      '    ci/*) prefix="ci" ;;',
      '    revert/*) prefix="revert" ;;',
      '    *) prefix="" ;;',
      '  esac',
      "  if [ -n \"${prefix:-}\" ] && ! grep -qE '^(feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert)(\\([^)]*\\))?: ' \"$MSG_FILE\"; then",
      '    first="$(head -n1 "$MSG_FILE")"',
      '    rest="$(tail -n +2 "$MSG_FILE" || true)"',
      '    printf "%s: %s\\n" "$prefix" "$first" > "$MSG_FILE"',
      '    if [ -n "$rest" ]; then printf "\\n%s\\n" "$rest" >> "$MSG_FILE"; fi',
      '  fi',
      'fi',
      '',
    )
  }
  if (opts.appendIssue) {
    lines.push(
      '# Anexa (#número) extraído do fim do branch à primeira linha',
      'if [ -n "$branch" ]; then',
      "  issue=\"$(echo \"$branch\" | grep -oE '[0-9]+$' | head -n1 || true)\"",
      '  if [ -n "$issue" ] && ! grep -qE "\\(#$issue\\)" "$MSG_FILE"; then',
      '    first="$(head -n1 "$MSG_FILE")"',
      '    rest="$(tail -n +2 "$MSG_FILE" || true)"',
      '    printf "%s (#%s)\\n" "$first" "$issue" > "$MSG_FILE"',
      '    if [ -n "$rest" ]; then printf "\\n%s\\n" "$rest" >> "$MSG_FILE"; fi',
      '  fi',
      'fi',
      '',
    )
  }
  return lines
}

function buildCommitMsg(opts) {
  const lines = ['[ $# -ge 1 ] || exit 0', 'MSG_FILE="$1"', 'first="$(head -n1 "$MSG_FILE")"', '']
  if (opts.enforceConventional) {
    lines.push(
      "# Valida o padrão Conventional Commits (tipo(escopo)?: mensagem)",
      "PATTERN='^(feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert)(\\([^)]*\\))?: .+'",
      'if ! grep -qE "$PATTERN" "$MSG_FILE"; then',
      '  echo "✗ mensagem de commit não segue Conventional Commits:"',
      '  echo "  Ex.: feat(cart): adiciona cupom de desconto"',
      '  echo "  Tipos: feat fix chore docs style refactor test perf build ci revert"',
      '  exit 1',
      'fi',
      '',
    )
  }
  const minLen = Math.max(0, Number(opts.minLength) || 0)
  const maxLen = Math.max(1, Number(opts.maxLength) || 72)
  lines.push(
    `MIN_LEN='${minLen}'`,
    `MAX_LEN='${maxLen}'`,
    '#limita o tamanho da primeira linha (assunto)',
    'len="${#first}"',
    'if [ "$len" -lt "$MIN_LEN" ]; then',
    '  echo "✗ assunto muito curto (${len} chars < ${MIN_LEN})"',
    '  exit 1',
    'fi',
    'if [ "$len" -gt "$MAX_LEN" ]; then',
    '  echo "✗ assunto longo demais (${len} chars > ${MAX_LEN})"',
    '  exit 1',
    'fi',
    '',
  )
  if (opts.blockWip) {
    lines.push(
      '# Bloqueia assuntos WIP/draft',
      "if grep -qiE '^(wip|draft)[: ]' \"$MSG_FILE\"; then",
      '  echo "✗ commits WIP não são permitidos"',
      '  exit 1',
      'fi',
      '',
    )
  }
  return lines
}

// ── Hook de push ──────────────────────────────────────────────────
function buildPrePush(opts) {
  const lines = []
  if (opts.runTests) {
    const cmd = (opts.testCommand || 'npm test').replace(/"/g, '\\"')
    lines.push(
      'echo "→ rodando testes..."',
      `TEST_CMD="${cmd}"`,
      '$TEST_CMD || { echo "✗ testes falharam; aborte o push"; exit 1; }',
      '',
    )
  }
  if (opts.runLint) {
    const cmd = (opts.lintCommand || 'npm run lint').replace(/"/g, '\\"')
    lines.push(
      'echo "→ rodando lint..."',
      `LINT_CMD="${cmd}"`,
      '$LINT_CMD || { echo "✗ lint falhou; aborte o push"; exit 1; }',
      '',
    )
  }
  if (opts.blockProtectedBranches) {
    lines.push(
      '# Bloqueia push direto para as branches protegidas',
      'while read -r local_ref local_sha remote_ref remote_sha; do',
      '  [ -n "$remote_ref" ] || continue',
      '  case "$remote_ref" in',
      '    refs/heads/main|refs/heads/master)',
      '      echo "✗ push direto para ${remote_ref#refs/heads/} bloqueado pelo hook"',
      '      exit 1',
      '      ;;',
      '  esac',
      'done',
      '',
    )
  }
  return lines
}

// ── Pipe principal ────────────────────────────────────────────────
export function buildScript(config, lang) {
  const { hook, checks, options } = config
  const lines = header(hook, lang)

  if (hook === 'pre-commit') {
    const hasLint = checks.includes('lint')
    const hasFormat = checks.includes('formatCheck')
    const collectJs = hasLint || hasFormat
    lines.push(...stagedFn())
    if (collectJs) {
      lines.push(
        'STAGED_JS=()',
        'while IFS= read -r file; do',
        '  case "$file" in',
        '    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.vue) STAGED_JS+=("$file") ;;',
        '  esac',
        'done < <(staged)',
        '',
      )
    }
    checks.forEach((key) => {
      if (!CHECKS[key]) return
      lines.push(`echo "▶ ${key}"`)
      if (key === 'blacklist') lines.push(...CHECKS[key](options))
      else if (key === 'largeFiles') lines.push(...CHECKS[key](options))
      else if (key === 'lint') lines.push(...CHECKS[key](options))
      else if (key === 'formatCheck') lines.push(...CHECKS[key](options))
      else lines.push(...CHECKS[key]())
    })
  } else if (hook === 'prepare-commit-msg') {
    lines.push(...buildPrepareCommitMsg(options))
  } else if (hook === 'commit-msg') {
    lines.push(...buildCommitMsg(options))
  } else if (hook === 'pre-push') {
    lines.push(...buildPrePush(options))
  }

  const warn = lang === 'pt'
    ? '# Dica: não use cru. Adapte os comandos (npm/pip/uv/...) ao seu projeto.'
    : '# Tip: tweak the commands (npm/pip/uv/...) to match your project.'
  lines.push(warn)
  lines.push(`echo "${endLine(lang)}"`)
  return lines.join('\n') + '\n'
}

export function getEngineSource() {
  return [
    "export function buildScript(config, lang) {",
    "  const { hook, checks, options } = config",
    "  const lines = header(hook, lang) // shebang + comentário de instalação",
    "",
    "  if (hook === 'pre-commit') {",
    "    lines.push(...stagedFn())",
    "    checks.forEach((key) => {",
    "      const fn = CHECKS[key]",
    "      if (!fn) return",
    "      lines.push('echo \"▶ ' + key + '\"')",
    "      lines.push(...fn(options))",
    "    })",
    "  } else if (hook === 'prepare-commit-msg') {",
    "    lines.push(...buildPrepareCommitMsg(options))",
    "  } else if (hook === 'commit-msg') {",
    "    lines.push(...buildCommitMsg(options))",
    "  } else if (hook === 'pre-push') {",
    "    lines.push(...buildPrePush(options))",
    "  }",
    "",
    "  return lines.join('\\n') + '\\n'",
    "}",
    "",
    "// Cada checagem (CHECKS.trailingWhitespace, CHECKS.secrets, ...) é uma",
    "// função que devolve linhas bash; opções de comando (lint, format, test)",
    "// entram por `options` e são injetadas no script final.",
  ].join('\n')
}