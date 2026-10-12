// Helpers genéricos de parsing e emissão de linhas YAML compartilhados pelos
// geradores /devops/github-actions-workflow-generator e
// /devops/gitlab-ci-config-generator. Cada gerador mantém a sua própria
// estrutura de documento; aqui vive só o bloco que era copiado byte a byte.

export function clone(o) {
  try {
    return JSON.parse(JSON.stringify(o))
  } catch {
    return o
  }
}

export function parseLines(raw) {
  const text = Array.isArray(raw) ? raw.join('\n') : String(raw || '')
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseVariables(raw) {
  return parseLines(raw).map((line) => {
    const idx = line.indexOf('=')
    if (idx === -1) return { key: line, value: '' }
    return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
  })
}

export function yamlScalar(s) {
  return JSON.stringify(String(s))
}

export function indent(level) {
  return '  '.repeat(level)
}

// addScalar emite `key: "value"` com 2 espaços de indentação por nível.
export function addScalar(lines, key, value, level = 0) {
  const v = String(value || '').trim()
  if (v !== '') lines.push(`${indent(level)}${key}: ${yamlScalar(v)}`)
}

// addList emite `key:` seguido de `- "item"` num nível abaixo do key; aceita
// string crua ou array já parseado (parseLines é idempotente nesse caso).
export function addList(lines, key, raw, level = 0) {
  const items = parseLines(raw)
  if (!items.length) return
  lines.push(`${indent(level)}${key}:`)
  for (const item of items) {
    lines.push(`${indent(level + 1)}- ${yamlScalar(item)}`)
  }
}
