// JSON Merge Patch (RFC 7396) — implementação do zero, 100% client-side.
// Contraste com o irmão mais próximo, o json-patch (RFC 6902): lá o patch é
// uma LISTA de operações (add/remove/replace/move/copy/test) com JSON
// Pointer; aqui o patch é ELE PRÓPRIO um documento JSON — objetos são
// mesclados recursivamente, null apaga uma chave e qualquer outro valor
// substitui. Arrays são sempre tratados como um todo (nunca mesclados)
// — essa é a maior diferença prática entre os dois RFCs.

// ├── utilidades ───────────────────────────────────────────────────

export function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function deepClone(v) {
  if (v === undefined) return undefined
  return JSON.parse(JSON.stringify(v))
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

// ├── gerar patch a partir de dois documentos ──────────────────────
// diffValue(original, modified) retorna:
//   { none: true }           se iguais (chave não vira entrada no patch)
//   { patch: <valor> }       se diferentes
// Quando AMBOS são objetos, desce recursivamente: chave adicionada vira o
// valor novo, chave removida vira null, e chave alterada carrega o sub-patch
// (ou o valor inteiro, quando o tipo muda ou a mudança é numa folha/array).

function diffValue(original, modified) {
  if (deepEqual(original, modified)) return { none: true }
  if (isPlainObject(original) && isPlainObject(modified)) {
    const patch = {}
    for (const key of Object.keys(modified)) {
      if (Object.prototype.hasOwnProperty.call(original, key)) {
        const sub = diffValue(original[key], modified[key])
        if (!sub.none) patch[key] = sub.patch
      } else {
        patch[key] = deepClone(modified[key])
      }
    }
    for (const key of Object.keys(original)) {
      if (!Object.prototype.hasOwnProperty.call(modified, key)) {
        patch[key] = null
      }
    }
    return { patch }
  }
  return { patch: deepClone(modified) }
}

// Gera o JSON Merge Patch que transforma `original` em `modified`.
// Documentos iguais => {} (patch vazio — nenhuma mudança).
export function generateMergePatch(original, modified) {
  if (deepEqual(original, modified)) return {}
  return diffValue(original, modified).patch
}

// ├── aplicar patch (RFC 7396 §2) ──────────────────────────────────
// - patch não-objeto: substitui o alvo inteiro por um clone do patch.
// - patch objeto: se o alvo não for objeto, começa de {}; para cada chave,
//   null apaga e qualquer outro valor é mesclado (recursivo).
// O alvo original NUNCA é mutado — trabalhamos sobre um clone.
export function applyMergePatch(target, patch) {
  if (!isPlainObject(patch)) return deepClone(patch)
  const result = isPlainObject(target) ? deepClone(target) : {}
  for (const key of Object.keys(patch)) {
    if (patch[key] === null) {
      delete result[key]
    } else {
      result[key] = applyMergePatch(
        Object.prototype.hasOwnProperty.call(result, key) ? result[key] : undefined,
        patch[key]
      )
    }
  }
  return result
}

// ├── presets de exemplo ───────────────────────────────────────────

export const PRESETS = [
  {
    key: 'card',
    original: '{\n  "title": "Login",\n  "status": "active",\n  "owner": "ada"\n}',
    modified: '{\n  "title": "SSO Login",\n  "status": "archived",\n  "owner": "ada",\n  "priority": 2\n}',
  },
  {
    key: 'nested',
    original: '{\n  "user": {\n    "name": "Ada",\n    "email": "ada@mid.com",\n    "settings": {\n      "theme": "dark",\n      "digest": true\n    }\n  },\n  "plan": "free"\n}',
    modified: '{\n  "user": {\n    "name": "Ada Lovelace",\n    "email": "ada@mid.com",\n    "settings": {\n      "theme": "light"\n    }\n  },\n  "plan": "pro"\n}',
  },
  {
    key: 'arrays',
    original: '{\n  "tags": ["react", "vite"],\n  "features": { "a": 1, "b": 2 }\n}',
    modified: '{\n  "tags": ["react", "vite", "antd"],\n  "features": { "a": 9, "b": 2 }\n}',
  },
  {
    key: 'leaf-root',
    original: '{\n  "enabled": true,\n  "count": 3\n}',
    modified: '{\n  "enabled": false\n}',
  },
  {
    key: 'identical',
    original: '{\n  "a": 1,\n  "b": { "c": [1, 2] }\n}',
    modified: '{\n  "b": { "c": [1, 2] },\n  "a": 1\n}',
  },
]