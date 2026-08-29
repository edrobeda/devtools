// JSON Patch (RFC 6902) + JSON Pointer (RFC 6901) — implementação do zero,
// 100% client-side. Nenhum dado sai do navegador.

// ─── JSON Pointer (RFC 6901) ──────────────────────────────────────
// Um ponteiro é "" (raiz) ou "/foo/0/bar" (segmentos separados por '/').
// Escapes: "~1" -> "/" e "~0" -> "~" (nesta ordem, pra que "~01" vire "~1").

export function parsePointer(pointer) {
  if (typeof pointer !== 'string') {
    throw new Error('JSON Pointer deve ser uma string')
  }
  if (pointer === '') return []
  if (pointer[0] !== '/') {
    throw new Error(`JSON Pointer inválido: "${pointer}" deve começar com "/" ou ser "" (raiz)`)
  }
  return pointer.slice(1).split('/').map(unescapeToken)
}

function unescapeToken(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~')
}

export function escapeToken(token) {
  return String(token).replace(/~/g, '~0').replace(/\//g, '~1')
}

// ─── utilidades ───────────────────────────────────────────────────

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

function describe(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

// Valida um token de índice de array ("0", "7", ...). "-" é tratado à parte.
function arrayIndexStrict(token) {
  if (!/^(0|[1-9][0-9]*)$/.test(token)) {
    throw new Error(`Índice de array inválido: "${token}"`)
  }
  return parseInt(token, 10)
}

// Navega até o PAI do último segmento. Retorna { parent, key, isRoot }.
// Para raiz (segs.length === 0), parent/key são null e isRoot = true.
function navigateToParent(doc, segs, pointer) {
  if (segs.length === 0) return { isRoot: true, parent: null, key: null }
  let cur = doc
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]
    if (Array.isArray(cur)) {
      const idx = arrayIndexStrict(seg)
      if (idx < 0 || idx >= cur.length) {
        throw new Error(`caminho "${pointer}" não encontrado: índice ${seg} fora dos limites (length ${cur.length})`)
      }
      cur = cur[idx]
    } else if (cur !== null && typeof cur === 'object') {
      if (!Object.prototype.hasOwnProperty.call(cur, seg)) {
        throw new Error(`caminho "${pointer}" não encontrado: chave "${seg}" ausente`)
      }
      cur = cur[seg]
    } else {
      throw new Error(`caminho "${pointer}" não encontrado: não dá pra descer em ${describe(cur)}`)
    }
  }
  return { isRoot: false, parent: cur, key: segs[segs.length - 1] }
}

// Navega até o alvo completo (todos os segmentos). Lança se não existir.
function navigateToTarget(doc, segs, pointer) {
  let cur = doc
  for (const seg of segs) {
    if (Array.isArray(cur)) {
      if (seg === '-') {
        throw new Error(`caminho "${pointer}" não encontrado: "-" é posição de append (não existe)`)
      }
      const idx = arrayIndexStrict(seg)
      if (idx < 0 || idx >= cur.length) {
        throw new Error(`caminho "${pointer}" não encontrado: índice ${seg} fora dos limites (length ${cur.length})`)
      }
      cur = cur[idx]
    } else if (cur !== null && typeof cur === 'object') {
      if (!Object.prototype.hasOwnProperty.call(cur, seg)) {
        throw new Error(`caminho "${pointer}" não encontrado: chave "${seg}" ausente`)
      }
      cur = cur[seg]
    } else {
      throw new Error(`caminho "${pointer}" não encontrado: não dá pra descer em ${describe(cur)}`)
    }
  }
  return cur
}

// ─── operações (cada uma retorna o novo documento; raiz pode mudar) ──

function opAdd(doc, pointer, value) {
  const segs = parsePointer(pointer)
  if (segs.length === 0) return deepClone(value)
  const { parent, key } = navigateToParent(doc, segs, pointer)
  if (Array.isArray(parent)) {
    if (key === '-') {
      parent.push(deepClone(value))
    } else {
      const idx = arrayIndexStrict(key)
      if (idx < 0 || idx > parent.length) {
        throw new Error(`índice ${idx} fora dos limites pra add (length ${parent.length}; permitido 0..${parent.length})`)
      }
      parent.splice(idx, 0, deepClone(value))
    }
  } else if (parent !== null && typeof parent === 'object') {
    parent[key] = deepClone(value)
  } else {
    throw new Error(`não dá pra adicionar em ${describe(parent)} em "${pointer}"`)
  }
  return doc
}

function opRemove(doc, pointer) {
  const segs = parsePointer(pointer)
  if (segs.length === 0) return { doc: null, removed: deepClone(doc) }
  const { parent, key } = navigateToParent(doc, segs, pointer)
  let removed
  if (Array.isArray(parent)) {
    if (key === '-') {
      throw new Error(`não dá pra remover "-" (posição de append) em "${pointer}"`)
    }
    const idx = arrayIndexStrict(key)
    if (idx < 0 || idx >= parent.length) {
      throw new Error(`índice ${idx} fora dos limites pra remove (length ${parent.length})`)
    }
    removed = parent.splice(idx, 1)[0]
  } else if (parent !== null && typeof parent === 'object') {
    if (!Object.prototype.hasOwnProperty.call(parent, key)) {
      throw new Error(`chave "${key}" não existe em "${pointer}"`)
    }
    removed = parent[key]
    delete parent[key]
  } else {
    throw new Error(`não dá pra remover de ${describe(parent)} em "${pointer}"`)
  }
  return { doc, removed }
}

function opReplace(doc, pointer, value) {
  const segs = parsePointer(pointer)
  if (segs.length === 0) return deepClone(value)
  const { parent, key } = navigateToParent(doc, segs, pointer)
  if (Array.isArray(parent)) {
    if (key === '-') {
      throw new Error(`não dá pra substituir "-" (posição de append) em "${pointer}"`)
    }
    const idx = arrayIndexStrict(key)
    if (idx < 0 || idx >= parent.length) {
      throw new Error(`índice ${idx} fora dos limites pra replace (length ${parent.length})`)
    }
    parent[idx] = deepClone(value)
  } else if (parent !== null && typeof parent === 'object') {
    if (!Object.prototype.hasOwnProperty.call(parent, key)) {
      throw new Error(`chave "${key}" não existe em "${pointer}" (replace exige alvo existente)`)
    }
    parent[key] = deepClone(value)
  } else {
    throw new Error(`não dá pra substituir em ${describe(parent)} em "${pointer}"`)
  }
  return doc
}

const VALID_OPS = ['add', 'remove', 'replace', 'move', 'copy', 'test']

// Aplica UMA operação. Retorna { doc, detail } em sucesso ou { error }.
function applyOp(doc, op) {
  if (!op || typeof op !== 'object' || Array.isArray(op)) {
    return { error: 'Operação deve ser um objeto' }
  }
  const opType = op.op
  if (!VALID_OPS.includes(opType)) {
    return { error: `op desconhecida: "${opType}" (válidas: ${VALID_OPS.join(', ')})` }
  }
  if (typeof op.path !== 'string') {
    return { error: `op "${opType}" exige "path" (string)` }
  }
  try {
    if (opType === 'add') {
      const has = Object.prototype.hasOwnProperty.call(op, 'value')
      if (!has) return { error: 'op "add" exige "value"' }
      return { doc: opAdd(doc, op.path, op.value), detail: `add em ${op.path}` }
    }
    if (opType === 'remove') {
      const out = opRemove(doc, op.path)
      return { doc: out.doc, detail: `remove de ${op.path}` }
    }
    if (opType === 'replace') {
      const has = Object.prototype.hasOwnProperty.call(op, 'value')
      if (!has) return { error: 'op "replace" exige "value"' }
      return { doc: opReplace(doc, op.path, op.value), detail: `replace em ${op.path}` }
    }
    if (opType === 'move') {
      if (typeof op.from !== 'string') return { error: 'op "move" exige "from" (string)' }
      // RFC 6902 §4.4: "from" não pode ser prefixo de "path" (mover pra dentro de si)
      if (op.path !== '' && op.path !== op.from && op.path.startsWith(op.from + '/')) {
        return { error: `"move": "from" (${op.from}) não pode ser prefixo de "path" (${op.path})` }
      }
      const out = opRemove(doc, op.from)
      const newDoc = opAdd(out.doc, op.path, out.removed)
      return { doc: newDoc, detail: `move de ${op.from} -> ${op.path}` }
    }
    if (opType === 'copy') {
      if (typeof op.from !== 'string') return { error: 'op "copy" exige "from" (string)' }
      const value = navigateToTarget(doc, parsePointer(op.from), op.from)
      return { doc: opAdd(doc, op.path, deepClone(value)), detail: `copy de ${op.from} -> ${op.path}` }
    }
    if (opType === 'test') {
      const has = Object.prototype.hasOwnProperty.call(op, 'value')
      if (!has) return { error: 'op "test" exige "value"' }
      const current = navigateToTarget(doc, parsePointer(op.path), op.path)
      if (!deepEqual(current, op.value)) {
        return { error: `test falhou em ${op.path}: valor atual não bate com o esperado` }
      }
      return { doc, detail: `test passou em ${op.path}` }
    }
  } catch (err) {
    return { error: err.message }
  }
}

// ─── API principal ────────────────────────────────────────────────
// Aplica um patch (array de ops) ao documento. Retorna:
//   { ok: boolean, result, log: [{index, op, status, detail}], failedIndex }
// O documento original NUNCA é mutado — trabalhamos sobre um clone.
export function applyPatch(doc, patch) {
  if (!Array.isArray(patch)) {
    return {
      ok: false,
      result: undefined,
      log: [],
      failedIndex: null,
      error: 'JSON Patch deve ser um array de operações',
    }
  }
  let result = deepClone(doc)
  const log = []
  for (let i = 0; i < patch.length; i++) {
    const op = patch[i]
    const outcome = applyOp(result, op)
    if (outcome.error) {
      log.push({ index: i, op, status: 'failed', detail: outcome.error })
      return { ok: false, result, log, failedIndex: i }
    }
    result = outcome.doc
    log.push({ index: i, op, status: 'ok', detail: outcome.detail })
  }
  return { ok: true, result, log, failedIndex: null }
}

// ─── presets de exemplo ───────────────────────────────────────────

export const PRESETS = [
  {
    key: 'add-object',
    doc: '{\n  "name": "devtools",\n  "version": 1\n}',
    patch: '[\n  { "op": "add", "path": "/author", "value": "agent" },\n  { "op": "add", "path": "/tags", "value": ["react", "vite"] },\n  { "op": "replace", "path": "/version", "value": 2 }\n]',
  },
  {
    key: 'array-ops',
    doc: '{\n  "todos": [\n    { "id": 1, "text": "ler email" },\n    { "id": 2, "text": "subir deploy" }\n  ]\n}',
    patch: '[\n  { "op": "add", "path": "/todos/-", "value": { "id": 3, "text": "escrever changelog" } },\n  { "op": "replace", "path": "/todos/0/text", "value": "ler email e responder" },\n  { "op": "remove", "path": "/todos/1" }\n]',
  },
  {
    key: 'move-copy',
    doc: '{\n  "user": { "name": "ada", "role": "admin" },\n  "draft": { "title": "hello" }\n}',
    patch: '[\n  { "op": "copy", "from": "/user/role", "path": "/draft/role" },\n  { "op": "move", "from": "/draft/title", "path": "/user/title" },\n  { "op": "test", "path": "/user/name", "value": "ada" }\n]',
  },
  {
    key: 'test-fail',
    doc: '{\n  "status": "ok",\n  "count": 5\n}',
    patch: '[\n  { "op": "test", "path": "/status", "value": "error" },\n  { "op": "replace", "path": "/count", "value": 99 }\n]',
  },
  {
    key: 'root-replace',
    doc: '{\n  "old": true\n}',
    patch: '[\n  { "op": "replace", "path": "", "value": { "new": true } }\n]',
  },
]
