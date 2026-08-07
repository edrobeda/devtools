// Cópia profunda e comparação profunda, do zero, sem JSON.stringify.
// deepClone: cria cópias recursivas de objetos/arrays, preservando Date,
// RegExp, Map e Set (não clonados por JSON). deepEqual: compara estruturas
// recursivamente, tratando Date por timestamp, Map/Set por conteúdo e
// ignorando chaves indefinidas como o `==` de objetos não faz.
export function deepClone(value, seen = new Map()) {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value) // referência cíclica

  seen.set(value, value)
  let out
  if (Array.isArray(value)) {
    out = []
    for (const item of value) out.push(deepClone(item, seen))
  } else if (value instanceof Date) {
    out = new Date(value.getTime())
  } else if (value instanceof RegExp) {
    out = new RegExp(value.source, value.flags)
  } else if (value instanceof Map) {
    out = new Map()
    for (const [k, v] of value) out.set(k, deepClone(v, seen))
  } else if (value instanceof Set) {
    out = new Set()
    for (const v of value) out.add(deepClone(v, seen))
  } else {
    out = {}
    for (const key of Object.keys(value)) out[key] = deepClone(value[key], seen)
  }
  seen.set(value, out)
  return out
}

export function deepEqual(a, b) {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== 'object' || typeof b !== 'object') return a === b

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp && a.source === b.source && a.flags === b.flags
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map)) return false
    if (a.size !== b.size) return false
    for (const [k, v] of a) {
      if (!b.has(k) || !deepEqual(v, b.get(k))) return false
    }
    return true
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set)) return false
    if (a.size !== b.size) return false
    const arr = [...a]
    return arr.every((v) => [...b].some((bv) => deepEqual(v, bv)))
  }

  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (!deepEqual(a[k], b[k])) return false
  }
  return true
}

// Retorna o caminho (ex.: 'a.b[0].c') até a primeira diferença entre duas
// estruturas, ou null se forem iguais. Usado na página de demonstração.
export function firstDiff(a, b, path = '$') {
  if (a === b) return null
  if (a === null || b === null) return { path, a: a, b: b }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b ? null : { path, a, b }
  }
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
      ? null
      : { path, a, b }
  }
  if (Array.isArray(a) !== Array.isArray(b)) return { path, a, b }

  const keys = Array.isArray(a)
    ? a.map((_, i) => String(i))
    : Object.keys(a)
  for (const key of keys) {
    const childPath = Array.isArray(a) ? `${path}[${key}]` : `${path}.${key}`
    const diff = firstDiff(a[key], b[key], childPath)
    if (diff) return diff
  }
  if (!Array.isArray(a) && !Array.isArray(b)) {
    const bKeys = Object.keys(b)
    for (const key of bKeys) {
      if (!Object.prototype.hasOwnProperty.call(a, key)) {
        return { path: `${path}.${key}`, a: undefined, b: b[key] }
      }
    }
  }
  return null
}