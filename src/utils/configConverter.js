/**
 * Motor do Conversor de Arquivos de Configuração.
 * Converte entre JSON, YAML, TOML, INI e Properties 100% no navegador.
 * Implementação própria e simplificada: cobre o dia a dia de configs
 * (objetos, arrays, strings, números, booleanos, null) sem depender de
 * bibliotecas externas. Nenhum dado sai do navegador.
 */

export const FORMATS = ['json', 'yaml', 'toml', 'ini', 'properties']

export const FORMAT_LABELS = {
  pt: {
    json: 'JSON',
    yaml: 'YAML',
    toml: 'TOML',
    ini: 'INI',
    properties: 'Properties',
  },
  en: {
    json: 'JSON',
    yaml: 'YAML',
    toml: 'TOML',
    ini: 'INI',
    properties: 'Properties',
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// Utilidades comuns
// ═════════════════════════════════════════════════════════════════════════════

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isScalar(v) {
  return v === null || typeof v !== 'object'
}

function trimTrailingEmpty(lines) {
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()
  return lines
}

function inferIndent(lines) {
  for (const line of lines) {
    const m = line.match(/^( +)[^ ]/)
    if (m && m[1].length > 0) return m[1].length
  }
  return 2
}

// ═════════════════════════════════════════════════════════════════════════════
// YAML
// ═════════════════════════════════════════════════════════════════════════════

function yamlNeedsQuotes(s) {
  if (typeof s !== 'string') return false
  if (s === '') return true
  if (/^\s|\s$/.test(s)) return true
  if (/[\x00-\x08\x0A-\x1F\x7F]/.test(s)) return true
  if (s.includes('\n')) return true
  if (/^[\-\?:,\[\]{}#&*!|>'"%@`]/.test(s)) return true
  if (/#(\s|$)|:(\s|$)/.test(s)) return true
  if (/^[-+]?[0-9]/.test(s)) return true
  if (/^(true|True|TRUE|false|False|FALSE|null|Null|NULL|~|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF)$/.test(s)) return true
  return false
}

function yamlScalar(v) {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') {
    const s = String(v)
    if (!Number.isFinite(v)) return JSON.stringify(s)
    return /^[0-9.eE+-]+$/.test(s) ? s : JSON.stringify(s)
  }
  return yamlNeedsQuotes(v) ? JSON.stringify(v) : v
}

function yamlKey(k) {
  return yamlNeedsQuotes(k) ? JSON.stringify(k) : k
}

function flowYamlValue(v) {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return yamlScalar(v)
  if (typeof v === 'string') return yamlScalar(v)
  if (Array.isArray(v)) return '[' + v.map(flowYamlValue).join(', ') + ']'
  return '{ ' + Object.keys(v).map((k) => yamlKey(k) + ': ' + flowYamlValue(v[k])).join(', ') + ' }'
}

export function stringifyYaml(value, opts = {}) {
  const indent = opts.indent || 2
  const docStart = opts.docStart || false
  const lines = []
  if (docStart) lines.push('---')

  function emitObject(obj, col) {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      lines.push(' '.repeat(col) + '{}')
      return
    }
    for (const k of keys) {
      const v = obj[k]
      const head = ' '.repeat(col) + yamlKey(k) + ':'
      if (isScalar(v)) {
        lines.push(head + ' ' + yamlScalar(v))
      } else if (Array.isArray(v)) {
        if (v.length === 0) lines.push(head + ' []')
        else {
          lines.push(head)
          emitArray(v, col + indent)
        }
      } else {
        if (Object.keys(v).length === 0) lines.push(head + ' {}')
        else {
          lines.push(head)
          emitObject(v, col + indent)
        }
      }
    }
  }

  function emitArray(arr, col) {
    if (arr.length === 0) {
      lines.push(' '.repeat(col) + '[]')
      return
    }
    for (const item of arr) {
      if (!isScalar(item)) {
        if (Array.isArray(item)) {
          lines.push(' '.repeat(col) + '- ' + flowYamlValue(item))
        } else if (Object.keys(item).length === 0) {
          lines.push(' '.repeat(col) + '- {}')
        } else {
          emitObjectAsListItem(item, col)
        }
      } else {
        lines.push(' '.repeat(col) + '- ' + yamlScalar(item))
      }
    }
  }

  function emitObjectAsListItem(obj, col) {
    const keys = Object.keys(obj)
    keys.forEach((k, i) => {
      const v = obj[k]
      const pre = i === 0 ? ' '.repeat(col) + '- ' : ' '.repeat(col + 2)
      if (isScalar(v)) {
        lines.push(pre + yamlKey(k) + ': ' + yamlScalar(v))
      } else if (Array.isArray(v)) {
        if (v.length === 0) lines.push(pre + yamlKey(k) + ': []')
        else {
          lines.push(pre + yamlKey(k) + ':')
          emitArray(v, col + 2 + indent)
        }
      } else {
        if (Object.keys(v).length === 0) lines.push(pre + yamlKey(k) + ': {}')
        else {
          lines.push(pre + yamlKey(k) + ':')
          emitObject(v, col + 2 + indent)
        }
      }
    })
  }

  if (Array.isArray(value)) emitArray(value, 0)
  else if (isPlainObject(value)) emitObject(value, 0)
  else lines.push(yamlScalar(value))

  return lines.join('\n')
}

function tokenizeYaml(text) {
  const lines = trimTrailingEmpty(text.split('\n'))
  const out = []
  for (let raw of lines) {
    let line = raw
    // remove comentário fora de string
    let inQuotes = false
    let quoteChar = null
    let commentIdx = -1
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (!inQuotes && (c === '"' || c === "'")) {
        inQuotes = true
        quoteChar = c
      } else if (inQuotes && c === quoteChar && line[i - 1] !== '\\') {
        inQuotes = false
      } else if (!inQuotes && c === '#') {
        commentIdx = i
        break
      }
    }
    if (commentIdx >= 0) line = line.slice(0, commentIdx)
    if (line.trim() === '' && raw.trim() === '') continue
    const indent = line.search(/\S/)
    out.push({ indent: indent < 0 ? 0 : indent, content: line.trimEnd() })
  }
  return out
}

function unquoteYaml(s) {
  s = s.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    const q = s[0]
    const inner = s.slice(1, -1)
    if (q === "'") return inner.replace(/''/g, "'")
    return inner
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
  return s
}

function parseYamlScalar(s) {
  s = s.trim()
  if (s === '' || s === '~' || s === 'null' || s === 'Null' || s === 'NULL') return null
  if (/^(true|True|TRUE|yes|Yes|YES|on|On|ON)$/.test(s)) return true
  if (/^(false|False|FALSE|no|No|NO|off|Off|OFF)$/.test(s)) return false
  if (/^[-+]?\d+$/.test(s)) return Number(s)
  if (/^[-+]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s)
  return unquoteYaml(s)
}

function parseBlockScalar(tokens, startIdx, baseIndent) {
  const first = tokens[startIdx]
  const literal = first.content.startsWith('|')
  const folded = first.content.startsWith('>')
  if (!literal && !folded) return { value: parseYamlScalar(first.content), nextIdx: startIdx + 1 }

  const lines = []
  let i = startIdx + 1
  while (i < tokens.length && tokens[i].indent > baseIndent) {
    const line = tokens[i].content
    if (literal) {
      lines.push(line.slice(baseIndent + 1))
    } else {
      const trimmed = line.trim()
      if (trimmed === '') lines.push('\n')
      else if (lines.length > 0 && !lines[lines.length - 1].endsWith('\n')) lines[lines.length - 1] += ' ' + trimmed
      else lines.push(trimmed)
    }
    i++
  }
  let value = literal ? lines.join('\n') : lines.join('').replace(/\n\n/g, '\n')
  if (first.content.includes('|-')) value = value.replace(/\n+$/, '')
  return { value, nextIdx: i }
}

function findUnquotedColon(s) {
  let inQuotes = false
  let quoteChar = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === quoteChar && s[i - 1] !== '\\') inQuotes = false
    } else if (c === '"' || c === "'") {
      inQuotes = true
      quoteChar = c
    } else if (c === ':') {
      return i
    }
  }
  return -1
}

function splitTopLevel(text, delimiter) {
  const parts = []
  let current = ''
  let depth = 0
  let inQuotes = false
  let quoteChar = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === quoteChar && text[i - 1] !== '\\') inQuotes = false
      current += c
    } else if (c === '"' || c === "'") {
      inQuotes = true
      quoteChar = c
      current += c
    } else if (c === '[' || c === '{' || c === '(') {
      depth++
      current += c
    } else if (c === ']' || c === '}' || c === ')') {
      depth--
      current += c
    } else if (c === delimiter && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

function parseYamlInlineArray(text) {
  const inner = text.trim().slice(1, -1).trim()
  if (!inner) return []
  return splitTopLevel(inner, ',').map((p) => parseYamlScalar(p.trim()))
}

function parseYamlInlineObject(text) {
  const inner = text.trim().slice(1, -1).trim()
  if (!inner) return {}
  const obj = {}
  const parts = splitTopLevel(inner, ',')
  for (const part of parts) {
    const colonIdx = part.indexOf(':')
    if (colonIdx > 0) {
      const key = unquoteYaml(part.slice(0, colonIdx).trim())
      const val = parseYamlScalar(part.slice(colonIdx + 1).trim())
      obj[key] = val
    }
  }
  return obj
}

// Parser YAML recursivo baseado em indentação.
// baseIndent é o nível de indentação esperado para este nó.
function parseYamlNode(tokens, idx, baseIndent) {
  const token = tokens[idx]
  if (!token) return { value: null, nextIdx: idx }

  // bloco literal/dobrado
  if (token.indent === baseIndent && (/^\|[-+]?/.test(token.content) || /^>[-+]?/.test(token.content))) {
    return parseBlockScalar(tokens, idx, baseIndent)
  }

  // array: itens começam com "- " e podem estar em qualquer nível >= baseIndent
  // usamos o nível do primeiro item como nível do array
  if (token.content.trimStart().startsWith('- ')) {
    const arr = []
    let i = idx
    const arrayIndent = token.indent
    while (i < tokens.length && tokens[i].indent === arrayIndent && tokens[i].content.trimStart().startsWith('- ')) {
      const rest = tokens[i].content.trimStart().slice(2).trim()
      if (rest === '') {
        // filho aninhado nas próximas linhas
        const next = tokens[i + 1]
        const childIndent = next ? next.indent : arrayIndent + 2
        const child = parseYamlNode(tokens, i + 1, childIndent)
        arr.push(child.value)
        i = child.nextIdx
      } else if (/^\[/.test(rest)) {
        arr.push(parseYamlInlineArray(rest))
        i++
      } else if (/^\{/.test(rest)) {
        arr.push(parseYamlInlineObject(rest))
        i++
      } else {
        const colonIdx = findUnquotedColon(rest)
        if (colonIdx > 0) {
          const key = unquoteYaml(rest.slice(0, colonIdx).trim())
          const after = rest.slice(colonIdx + 1).trim()
          if (after === '') {
            const next = tokens[i + 1]
            const childIndent = next ? next.indent : arrayIndent + 2
            const child = parseYamlNode(tokens, i + 1, childIndent)
            arr.push({ [key]: child.value })
            i = child.nextIdx
          } else {
            arr.push({ [key]: parseYamlScalar(after) })
            i++
          }
        } else {
          arr.push(parseYamlScalar(rest))
          i++
        }
      }
    }
    return { value: arr, nextIdx: i }
  }

  // objeto: chaves no mesmo nível de baseIndent, terminando quando encontrar
  // linha com indentação < baseIndent
  if (findUnquotedColon(token.content) >= 0) {
    const obj = {}
    let i = idx
    while (i < tokens.length && tokens[i].indent === baseIndent) {
      const content = tokens[i].content
      const colonIdx = findUnquotedColon(content)
      if (colonIdx <= 0) break
      const key = unquoteYaml(content.slice(0, colonIdx).trim())
      const after = content.slice(colonIdx + 1).trim()
      if (after === '') {
        if (i + 1 < tokens.length && tokens[i + 1].indent > baseIndent) {
          const childIndent = tokens[i + 1].indent
          const child = parseYamlNode(tokens, i + 1, childIndent)
          obj[key] = child.value
          i = child.nextIdx
        } else {
          obj[key] = null
          i++
        }
      } else if (/^\[/.test(after)) {
        obj[key] = parseYamlInlineArray(after)
        i++
      } else if (/^\{/.test(after)) {
        obj[key] = parseYamlInlineObject(after)
        i++
      } else {
        obj[key] = parseYamlScalar(after)
        i++
      }
    }
    return { value: obj, nextIdx: i }
  }

  // scalar puro
  return { value: parseYamlScalar(token.content), nextIdx: idx + 1 }
}

export function parseYaml(text) {
  const tokens = tokenizeYaml(text)
  if (tokens.length === 0) return { ok: true, value: null }
  let idx = 0
  if (tokens[0].content === '---') idx++
  const res = parseYamlNode(tokens, idx, tokens[idx]?.indent || 0)
  return { ok: true, value: res.value }
}

// ═════════════════════════════════════════════════════════════════════════════
// TOML
// ═════════════════════════════════════════════════════════════════════════════

function tomlNeedsQuotes(s) {
  if (typeof s !== 'string') return false
  if (s === '') return true
  if (/^[\x00-\x08\x0A-\x1F\x7F]/.test(s)) return true
  if (/^(true|false|[+-]?\d|[+-]?\d\.\d|[+-]?\d[eE]|[+-]?\d\.\d[eE]|\[|\{)/i.test(s)) return true
  if (/[\x00-\x1F\x7F#\[\]=\"]/.test(s)) return true
  return false
}

function tomlEscape(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
}

function tomlValue(v) {
  if (v === null) return '""'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return tomlNeedsQuotes(v) ? '"' + tomlEscape(v) + '"' : v
  if (Array.isArray(v)) return '[' + v.map(tomlValue).join(', ') + ']'
  return tomlValue(String(v))
}

function tomlKey(k) {
  if (/^[A-Za-z0-9_-]+$/.test(k)) return k
  return '"' + tomlEscape(k) + '"'
}

function setPath(obj, path, value) {
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i]
    if (!(k in cur) || !isPlainObject(cur[k])) cur[k] = {}
    cur = cur[k]
  }
  const last = path[path.length - 1]
  if (last in cur && !Array.isArray(cur[last]) && !isPlainObject(cur[last])) {
    // repetida vira array
    cur[last] = [cur[last], value]
  } else if (last in cur && Array.isArray(cur[last])) {
    cur[last].push(value)
  } else {
    cur[last] = value
  }
}

function parseTomlInlineArray(text) {
  const inner = text.trim().slice(1, -1).trim()
  if (!inner) return []
  return splitTopLevel(inner, ',').map(parseTomlScalar)
}

function parseTomlInlineObject(text) {
  const inner = text.trim().slice(1, -1).trim()
  if (!inner) return {}
  const obj = {}
  const parts = splitTopLevel(inner, ',')
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq > 0) {
      const key = unquoteToml(part.slice(0, eq).trim())
      obj[key] = parseTomlScalar(part.slice(eq + 1).trim())
    }
  }
  return obj
}

function unquoteToml(s) {
  s = s.trim()
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
  if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'")
  return s
}

function parseTomlScalar(s) {
  s = s.trim()
  if (s === '') return ''
  if (/^"/.test(s) || /^'/.test(s)) return unquoteToml(s)
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true'
  if (/^[+-]?\d+$/.test(s)) return Number(s)
  if (/^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s)
  if (/^\[/.test(s)) return parseTomlInlineArray(s)
  if (/^\{/.test(s)) return parseTomlInlineObject(s)
  return s
}

export function parseToml(text) {
  const obj = {}
  let currentPath = []
  let currentTarget = obj
  const lines = trimTrailingEmpty(text.split('\n'))

  for (let raw of lines) {
    let line = raw
    const hash = line.indexOf('#')
    if (hash >= 0) line = line.slice(0, hash)
    line = line.trim()
    if (line === '') continue

    // seção
    const secMatch = line.match(/^\[([^\]]+)\]$/)
    if (secMatch) {
      const path = secMatch[1].split('.').map(unquoteToml)
      currentPath = path
      currentTarget = obj
      for (let i = 0; i < path.length; i++) {
        const k = path[i]
        if (!(k in currentTarget) || !isPlainObject(currentTarget[k])) currentTarget[k] = {}
        currentTarget = currentTarget[k]
      }
      continue
    }

    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const rawKey = line.slice(0, eq).trim()
    const rawVal = line.slice(eq + 1).trim()
    const key = unquoteToml(rawKey)
    const value = parseTomlScalar(rawVal)

    if (currentPath.length > 0) {
      setPath(obj, [...currentPath, key], value)
    } else {
      setPath(obj, [key], value)
    }
  }

  return { ok: true, value: obj }
}

export function stringifyToml(value, opts = {}) {
  if (!isPlainObject(value)) return tomlValue(value)
  const lines = []

  function emitScalarPairs(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (isScalar(v) || Array.isArray(v)) {
        lines.push(tomlKey(k) + ' = ' + tomlValue(v))
      }
    }
  }

  function emitTables(obj, prefix = []) {
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if (isPlainObject(v)) {
        const path = [...prefix, k]
        lines.push('[' + path.map(tomlKey).join('.') + ']')
        emitScalarPairs(v)
        emitTables(v, path)
      }
    }
  }

  emitScalarPairs(value)
  emitTables(value)
  return lines.join('\n')
}

// ═════════════════════════════════════════════════════════════════════════════
// INI
// ═════════════════════════════════════════════════════════════════════════════

function setNestedIni(obj, keyPath, value) {
  let cur = obj
  for (let i = 0; i < keyPath.length - 1; i++) {
    const k = keyPath[i]
    if (!(k in cur) || !isPlainObject(cur[k])) cur[k] = {}
    cur = cur[k]
  }
  const last = keyPath[keyPath.length - 1]
  if (last.endsWith('[]')) {
    const clean = last.slice(0, -2)
    if (!Array.isArray(cur[clean])) cur[clean] = []
    cur[clean].push(value)
  } else if (last in cur && !Array.isArray(cur[last]) && !isPlainObject(cur[last])) {
    cur[last] = [cur[last], value]
  } else if (last in cur && Array.isArray(cur[last])) {
    cur[last].push(value)
  } else {
    cur[last] = value
  }
}

function tryParseValue(v) {
  v = v.trim()
  if (v === '') return ''
  if (/^(true|yes|on)$/i.test(v)) return true
  if (/^(false|no|off)$/i.test(v)) return false
  if (/^(null|none|nil)$/i.test(v)) return null
  if (/^[+-]?\d+$/.test(v)) return Number(v)
  if (/^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?$/.test(v)) return Number(v)
  return v
}

export function parseIni(text) {
  const obj = {}
  let currentPath = []
  const lines = text.split('\n')
  for (let raw of lines) {
    const semi = raw.indexOf(';')
    const hash = raw.indexOf('#')
    let cut = -1
    if (semi >= 0 && hash >= 0) cut = Math.min(semi, hash)
    else if (semi >= 0) cut = semi
    else if (hash >= 0) cut = hash
    if (cut >= 0) raw = raw.slice(0, cut)
    const line = raw.trim()
    if (line === '') continue

    const secMatch = line.match(/^\[([^\]]+)\]$/)
    if (secMatch) {
      currentPath = secMatch[1].split('.')
      continue
    }

    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    setNestedIni(obj, [...currentPath, key], tryParseValue(value))
  }
  return { ok: true, value: obj }
}

export function stringifyIni(value, opts = {}) {
  const lines = []
  function emitScalarPair(k, v) {
    if (isScalar(v)) lines.push(k + ' = ' + String(v === null ? '' : v))
    else if (Array.isArray(v)) {
      for (const item of v) lines.push(k + '[] = ' + String(item === null ? '' : item))
    }
  }
  function emit(obj, prefix = []) {
    const keys = Object.keys(obj)
    const scalarKeys = keys.filter((k) => isScalar(obj[k]) || Array.isArray(obj[k]))
    const tableKeys = keys.filter((k) => isPlainObject(obj[k]))
    if (prefix.length > 0 && scalarKeys.length > 0) {
      lines.push('[' + prefix.join('.') + ']')
    }
    for (const k of scalarKeys) emitScalarPair(k, obj[k])
    for (const k of tableKeys) emit(obj[k], [...prefix, k])
  }
  emit(value)
  return lines.join('\n')
}

// ═════════════════════════════════════════════════════════════════════════════
// Properties
// ═════════════════════════════════════════════════════════════════════════════

function escapeProperties(s) {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
}

function unescapeProperties(s) {
  return s.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\\\/g, '\\')
}

function setNestedProperties(obj, keyPath, value) {
  let cur = obj
  for (let i = 0; i < keyPath.length - 1; i++) {
    const k = keyPath[i]
    if (!(k in cur) || !isPlainObject(cur[k])) cur[k] = {}
    cur = cur[k]
  }
  const last = keyPath[keyPath.length - 1]
  if (last in cur && !Array.isArray(cur[last]) && !isPlainObject(cur[last])) {
    cur[last] = [cur[last], value]
  } else if (last in cur && Array.isArray(cur[last])) {
    cur[last].push(value)
  } else {
    cur[last] = value
  }
}

export function parseProperties(text) {
  const obj = {}
  const lines = text.split('\n')
  for (let raw of lines) {
    const hash = raw.indexOf('#')
    const excl = raw.indexOf('!')
    let cut = -1
    if (hash >= 0 && excl >= 0) cut = Math.min(hash, excl)
    else if (hash >= 0) cut = hash
    else if (excl >= 0) cut = excl
    if (cut >= 0) raw = raw.slice(0, cut)
    const line = raw.trimEnd()
    if (line.trim() === '') continue
    const eq = line.indexOf('=')
    const colon = line.indexOf(':')
    const sep = eq >= 0 && (colon < 0 || eq < colon) ? eq : colon
    if (sep <= 0) continue
    const key = unescapeProperties(line.slice(0, sep).trim())
    const value = tryParseValue(unescapeProperties(line.slice(sep + 1).trim()))
    setNestedProperties(obj, key.split('.'), value)
  }
  return { ok: true, value: obj }
}

export function stringifyProperties(value, opts = {}) {
  const lines = []
  function emit(obj, prefix = '') {
    const keys = Object.keys(obj)
    const scalars = keys.filter((k) => isScalar(obj[k]) || Array.isArray(obj[k]))
    const tables = keys.filter((k) => isPlainObject(obj[k]))
    for (const k of scalars) {
      const full = prefix ? prefix + '.' + k : k
      const v = obj[k]
      if (Array.isArray(v)) {
        for (const item of v) lines.push(full + ' = ' + escapeProperties(String(item === null ? '' : item)))
      } else {
        lines.push(full + ' = ' + escapeProperties(String(v === null ? '' : v)))
      }
    }
    for (const k of tables) {
      const full = prefix ? prefix + '.' + k : k
      emit(obj[k], full)
    }
  }
  emit(value)
  return lines.join('\n')
}

// ═════════════════════════════════════════════════════════════════════════════
// JSON
// ═════════════════════════════════════════════════════════════════════════════

export function parseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export function stringifyJson(value, opts = {}) {
  try {
    return { ok: true, text: JSON.stringify(value, null, opts.indent || 2) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// API pública
// ═════════════════════════════════════════════════════════════════════════════

const PARSERS = {
  json: parseJson,
  yaml: parseYaml,
  toml: parseToml,
  ini: parseIni,
  properties: parseProperties,
}

const SERIALIZERS = {
  json: stringifyJson,
  yaml: stringifyYaml,
  toml: stringifyToml,
  ini: stringifyIni,
  properties: stringifyProperties,
}

export function parseConfig(text, format) {
  if (!FORMATS.includes(format)) return { ok: false, error: `Formato desconhecido: ${format}` }
  try {
    const result = PARSERS[format](text)
    if (!result.ok) return result
    return { ok: true, value: result.value }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export function serializeConfig(value, format, opts = {}) {
  if (!FORMATS.includes(format)) return { ok: false, error: `Formato desconhecido: ${format}` }
  try {
    const fn = SERIALIZERS[format]
    if (format === 'json') return fn(value, opts)
    return { ok: true, text: fn(value, opts) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export function convertConfig(text, from, to, opts = {}) {
  const parsed = parseConfig(text, from)
  if (!parsed.ok) return parsed
  return serializeConfig(parsed.value, to, opts)
}
