// Flatten / unflatten de JSON 100% client-side.
// As chaves são notação "dot" (a.b.c) e arrays viram índices numéricos
// (a.0, a.1). Chaves que contêm o delimitador são escapadas com backslash.

function escapeKey(key, delimiter) {
  if (typeof key !== 'string') return String(key)
  return key.replace(/\\/g, '\\\\').replaceAll(delimiter, `\\${delimiter}`)
}

function unescapeKey(key, delimiter) {
  let out = ''
  let i = 0
  while (i < key.length) {
    const ch = key[i]
    if (ch === '\\' && key[i + 1] === delimiter) {
      out += delimiter
      i += 2
    } else if (ch === '\\' && key[i + 1] === '\\') {
      out += '\\'
      i += 2
    } else {
      out += ch
      i += 1
    }
  }
  return out
}

function splitKey(key, delimiter) {
  const parts = []
  let current = ''
  let i = 0
  while (i < key.length) {
    const ch = key[i]
    if (ch === '\\') {
      const next = key[i + 1]
      if (next === delimiter || next === '\\') {
        current += next
        i += 2
      } else {
        current += ch
        i += 1
      }
    } else if (ch === delimiter) {
      parts.push(current)
      current = ''
      i += 1
    } else {
      current += ch
      i += 1
    }
  }
  parts.push(current)
  return parts.map((p) => unescapeKey(p, delimiter))
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function flatten(value, opts = {}) {
  const delimiter = opts.delimiter || '.'
  const result = {}

  function walk(node, prefix) {
    if (!isObject(node) && !Array.isArray(node)) {
      result[prefix] = node
      return
    }
    if (Array.isArray(node)) {
      if (node.length === 0) {
        result[prefix] = node
        return
      }
      node.forEach((item, idx) => {
        const next = prefix ? `${prefix}${delimiter}${idx}` : String(idx)
        walk(item, next)
      })
      return
    }
    const keys = Object.keys(node)
    if (keys.length === 0) {
      result[prefix] = node
      return
    }
    keys.forEach((key) => {
      const safe = escapeKey(key, delimiter)
      const next = prefix ? `${prefix}${delimiter}${safe}` : safe
      walk(node[key], next)
    })
  }

  if (!isObject(value) && !Array.isArray(value)) {
    return value
  }
  walk(value, '')
  return result
}

export function unflatten(value, opts = {}) {
  const delimiter = opts.delimiter || '.'
  if (!isObject(value)) return value

  const result = {}

  Object.keys(value).forEach((key) => {
    const parts = splitKey(key, delimiter)
    let current = result

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1
      const nextPart = parts[idx + 1]
      const nextIsNumber = nextPart !== undefined && /^\d+$/.test(String(nextPart))

      if (isLast) {
        current[part] = value[key]
        return
      }

      if (current[part] === undefined) {
        current[part] = nextIsNumber ? [] : {}
      }
      current = current[part]
    })
  })

  return result
}

// Lista curta de caminhos para preview em tabela.
export function flattenEntries(value, opts = {}) {
  const flat = flatten(value, opts)
  return Object.keys(flat).map((k) => ({ path: k, value: flat[k] }))
}
