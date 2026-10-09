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

// YAML parser compartilhado (mais robusto)

// ═════════════════════════════════════════════════════════════════════════════
// Utilidades comuns
// ═════════════════════════════════════════════════════════════════════════════

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isScalar(v) {
  return v === null || typeof v !== 'object'
}

// YAML parser compartilhado (mais robusto)
import { parseYaml as parseYamlShared } from './yamlFormatter.js'

// ═════════════════════════════════════════════════════════════════════════════
// YAML (emissor mantido)
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
  const keepNull = opts.keepNull || false
  const lines = []
  if (docStart) lines.push('---')

  const scalar = (v) => {
    if (v === null && keepNull) return ''
    return yamlScalar(v)
  }

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
        lines.push(head + ' ' + scalar(v))
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
        lines.push(' '.repeat(col) + '- ' + scalar(item))
      }
    }
  }

  function emitObjectAsListItem(obj, col) {
    const keys = Object.keys(obj)
    keys.forEach((k, i) => {
      const v = obj[k]
      const pre = i === 0 ? ' '.repeat(col) + '- ' : ' '.repeat(col + 2)
      if (isScalar(v)) {
        lines.push(pre + yamlKey(k) + ': ' + scalar(v))
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
  else lines.push(scalar(value))

  return lines.join('\n')
}

export function parseYaml(text) {
  try {
    const result = parseYamlShared(String(text))
    if (!result.ok) return result
    return { ok: true, value: result.value }
  } catch (e) {
    return { ok: false, error: e.message || String(e) }
  }
}
// ═════════════════════════════════════════════════════════════════════════════
// TOML
// ═════════════════════════════════════════════════════════════════════════════

// TOML parser compartilhado (mais robusto)
import { parseToml as parseTomlShared } from './tomlFormatter.js'

export function parseToml(text) {
  try {
    const result = parseTomlShared(String(text))
    if (!result.ok) return result
    return { ok: true, value: result.value }
  } catch (e) {
    return { ok: false, error: e.message || String(e) }
  }
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
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'nan'
    if (v === Infinity) return 'inf'
    if (v === -Infinity) return '-inf'
    return String(v)
  }
  // TOML não tem strings "bare": todo valor de texto precisa de aspas.
  if (typeof v === 'string') return '"' + tomlEscape(v) + '"'
  if (Array.isArray(v)) return '[' + v.map(tomlValue).join(', ') + ']'
  return tomlValue(String(v))
}

function tomlKey(k) {
  if (/^[A-Za-z0-9_-]+$/.test(k)) return k
  return '"' + tomlEscape(k) + '"'
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
