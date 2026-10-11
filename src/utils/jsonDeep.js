// Utilidades profundas para o "flavor JSON": clonagem e comparação estrutural
// de valores que vieram de JSON.parse (null/boolean/number/string/array/objeto).
// Compartilhado por json-patch (RFC 6902) e json-merge-patch (RFC 7396).
// NÃO confundir com src/utils/deep.js — aquela é a implementação exibida pelo
// snippet /snippets/deep-clone-deep-equal e lida com ciclos/Date/RegExp/Map/Set.

export function deepClone(value) {
  if (value === undefined) return undefined
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (_) {
      // structuredClone rejeita funções etc. — não aparecem em JSON, mas
      // o fallback abaixo resolve o caso comum.
    }
  }
  return JSON.parse(JSON.stringify(value))
}

// Igualdade estrutural profunda (chaves de objeto em qualquer ordem).
export function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  const aArr = Array.isArray(a)
  const bArr = Array.isArray(b)
  if (aArr !== bArr) return false
  if (aArr) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  if (typeof a !== 'object') return false
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (!deepEqual(a[k], b[k])) return false
  }
  return true
}
