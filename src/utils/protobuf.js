// ─────────────────────────────────────────────────────────────────────────────
// Decodificador / codificador do formato binário do Protocol Buffers
// (protobuf wire format) — 100% client-side, sem dependências.
//
// O que o motor faz:
//   • lê bytes (hex, base64, base64 url-safe, dump xxd) e monta a árvore de
//     campos com número, wire type, offset, tamanho e valor interpretado;
//   • interpreta length-delimited nos três formatos possíveis — string,
//     message aninhado e packed repeated — sempre mostrando as alternativas;
//   • monta bytes a partir de uma lista de campos (texto → protobuf) para
//     crafting de payloads de teste;
//   • envelopa/desenvelopa o frame de 5 bytes do gRPC.
//
// Referência: https://protobuf.dev/programming-guides/encoding/
// ─────────────────────────────────────────────────────────────────────────────

export const WIRE_TYPES = {
  0: { name: 'varint', proto: 'int32, int64, uint32, uint64, sint32, sint64, bool, enum' },
  1: { name: 'fixed64', proto: 'sfixed64, fixed64, double' },
  2: { name: 'length-delimited', proto: 'string, bytes, message, packed repeated' },
  3: { name: 'start group', proto: 'group (obsoleto, não usar)' },
  4: { name: 'end group', proto: 'group (obsoleto, não usar)' },
  5: { name: 'fixed32', proto: 'sfixed32, fixed32, float' },
}

export const MAX_FIELD_NUMBER = 536870911 // 2^29 - 1
export const MAX_DEPTH = 8

// ── Conversões de bytes ──────────────────────────────────────────────────────

export function bytesToHex(bytes, sep = ' ', uppercase = false) {
  const out = []
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, '0')
    out.push(uppercase ? h.toUpperCase() : h)
  }
  return out.join(sep)
}

export function bytesToBase64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = bytes[i + 1]
    const b2 = bytes[i + 2]
    out += B64[(b0 >> 2) & 0x3f]
    out += B64[((b0 & 0x03) << 4) | ((b1 === undefined ? 0 : b1) >> 4)]
    out += b1 === undefined ? '=' : B64[((b1 & 0x0f) << 2) | ((b2 === undefined ? 0 : b2) >> 6)]
    out += b2 === undefined ? '=' : B64[b2 & 0x3f]
  }
  return out
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const B64_MAP = (() => {
  const m = new Map()
  for (let i = 0; i < B64.length; i++) m.set(B64[i], i)
  m.set('-', 62)
  m.set('_', 63)
  return m
})()

export function base64ToBytes(str) {
  const clean = str.replace(/[^A-Za-z0-9+/_-]/g, '')
  const out = []
  let buffer = 0
  let bits = 0
  for (let i = 0; i < clean.length; i++) {
    const v = B64_MAP.get(clean[i])
    if (v === undefined) throw new Error(`caractere inválido na base64: "${clean[i]}"`)
    buffer = (buffer << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out.push((buffer >> bits) & 0xff)
    }
  }
  return new Uint8Array(out)
}

// Parser tolerante de hex: aceita "08 2a", "0x080x2a", "\x08\x2a" e dumps do
// xxd — em cada linha "com offset" o prefixo ("00000000:") é descartado e
// tudo depois de 2+ espaços (a coluna ASCII, que pode conter hex!) é ignorado.
const DUMP_LINE = /^\s*[0-9a-fA-F]{4,8}\s*:/

export function hexToBytes(text) {
  const noOffsets = text
    .split('\n')
    .map((line) => {
      if (!DUMP_LINE.test(line)) return line
      const body = line.replace(DUMP_LINE, '')
      const ascii = body.search(/\s{2,}/)
      return ascii === -1 ? body : body.slice(0, ascii)
    })
    .join('\n')
  const cleaned = noOffsets
    .replace(/0[xX]/g, '')
    .replace(/\\x/g, '')
    .replace(/[^0-9a-fA-F]/g, '')
  if (cleaned.length % 2 !== 0) {
    throw new Error('número ímpar de dígitos hex (1 byte = 2 dígitos)')
  }
  const out = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(cleaned.substr(i * 2, 2), 16)
  }
  return out
}

export function textToBytes(str) {
  return new TextEncoder().encode(str)
}

export function bytesToText(bytes) {
  return new TextDecoder('utf-8').decode(bytes)
}

// ── Entrada: hex ou base64 → bytes ───────────────────────────────────────────

export function parseInput(text, format) {
  const raw = (text || '').trim()
  if (!raw) return { bytes: null, error: null }
  try {
    if (format === 'base64') return { bytes: base64ToBytes(raw), error: null }
    return { bytes: hexToBytes(raw), error: null }
  } catch (err) {
    return { bytes: null, error: err.message || String(err) }
  }
}

// ── Varint ───────────────────────────────────────────────────────────────────

export function decodeVarint(bytes, pos, end = bytes.length) {
  let result = 0n
  let shift = 0n
  let i = pos
  while (i < end) {
    const b = bytes[i]
    result |= BigInt(b & 0x7f) << shift
    i++
    if ((b & 0x80) === 0) return { value: result, length: i - pos, next: i }
    shift += 7n
    if (shift > 63n) {
      return { error: 'varint-too-long', length: i - pos, next: i }
    }
  }
  return { error: 'truncated-varint', length: i - pos, next: i }
}

export function encodeVarint(value) {
  let v = typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value) || 0))
  if (v < 0n) v = BigInt.asUintN(64, v)
  const out = []
  do {
    let byte = Number(v & 0x7fn)
    v >>= 7n
    if (v > 0n) byte |= 0x80
    out.push(byte)
  } while (v > 0n)
  return new Uint8Array(out)
}

export function zigzagDecode(value, bits) {
  // sint32/sint64 usam zigzag: (n << 1) ^ (n >> 63)
  const mask = bits === 32 ? 32n : 64n
  const v = BigInt.asUintN(Number(mask), value)
  return (v >> 1n) ^ -(v & 1n)
}

export function zigzagEncode(value, bits) {
  const width = BigInt(bits)
  const signed = BigInt.asIntN(Number(width), BigInt(value))
  return BigInt.asUintN(Number(width), (signed << 1n) ^ (signed >> (width - 1n)))
}

export function toSigned64(value) {
  return BigInt.asIntN(64, value)
}

export function toSigned32(value) {
  return BigInt.asIntN(32, value)
}

// ── Utilidades de leitura de bytes ───────────────────────────────────────────

const view = new DataView(new ArrayBuffer(8))

export function readFixed32(bytes, pos) {
  view.setUint8(0, bytes[pos])
  view.setUint8(1, bytes[pos + 1])
  view.setUint8(2, bytes[pos + 2])
  view.setUint8(3, bytes[pos + 3])
  return {
    float: view.getFloat32(0, true),
    uint32: view.getUint32(0, true),
    int32: view.getInt32(0, true),
  }
}

export function readFixed64(bytes, pos) {
  for (let i = 0; i < 8; i++) view.setUint8(i, bytes[pos + i])
  return {
    double: view.getFloat64(0, true),
    uint64: view.getBigUint64(0, true),
    int64: view.getBigInt64(0, true),
  }
}

export function writeFixed32(bytes, pos, value) {
  if (typeof value === 'number') view.setFloat32(0, value, true)
  else view.setUint32(0, Number(BigInt(value) & 0xffffffffn), true)
  for (let i = 0; i < 4; i++) bytes[pos + i] = view.getUint8(i)
}

export function writeFixed64(bytes, pos, value) {
  if (typeof value === 'number') view.setFloat64(0, value, true)
  else view.setBigUint64(0, BigInt.asUintN(64, BigInt(value)), true)
  for (let i = 0; i < 8; i++) bytes[pos + i] = view.getUint8(i)
}

export function concatBytes(chunks) {
  let total = 0
  for (const c of chunks) total += c.length
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

// ── Texto: UTF-8 válido e "imprimível" ───────────────────────────────────────

const utf8Strict = new TextDecoder('utf-8', { fatal: true })

export function decodeTextIfPrintable(bytes) {
  let text
  try {
    text = utf8Strict.decode(bytes)
  } catch {
    return null
  }
  for (const ch of text) {
    const code = ch.codePointAt(0)
    const ok = code === 9 || code === 10 || code === 13 || (code >= 0x20 && code !== 0x7f)
    if (!ok) return null
  }
  return text
}

// ── Decodificação ────────────────────────────────────────────────────────────

const WIDTHS = { 0: null, 1: 8, 2: null, 3: null, 4: 0, 5: 4 }

// attemptMessage tenta ler o payload como uma mensagem aninhada — só é
// considerado válido se consumir exatamente todos os bytes sem erro algum
// (heurística: o tipo do campo é desconhecido, já que não temos o .proto).
function attemptMessage(bytes, depth, budget) {
  if (depth >= MAX_DEPTH || bytes.length < 2 || budget.count > 20000) return null
  const fields = []
  let pos = 0
  while (pos < bytes.length) {
    const res = readField(bytes, pos, bytes.length, depth + 1, budget)
    if (!res || res.error) return null
    // número de campo inválido, payload cortado ou end group solto = não é
    // uma mensagem (é o que acontece quando um texto ASCII qualquer "casa"
    // por acidente com o formato binário).
    if (res.field.warnings.length > 0 || res.field.wireType === 4) return null
    fields.push(res.field)
    pos = res.next
    budget.count++
    if (budget.count > 20000) return null
  }
  return fields.length > 0 ? fields : null
}

// attemptPacked tenta ler o payload como um campo repeated empacotado
// (packed repeated: vários valores em sequência, sem a chave do campo). Sem
// o .proto não dá pra saber o tipo — devolve TODAS as leituras plausíveis
// (varint é sempre a primeira, packed é o caso mais comum).
function attemptPacked(bytes) {
  if (bytes.length === 0) return null
  const candidates = []

  const varints = []
  let p = 0
  let ok = true
  while (p < bytes.length) {
    const v = decodeVarint(bytes, p, bytes.length)
    if (v.error) {
      ok = false
      break
    }
    varints.push(v.value)
    p = v.next
  }
  if (ok && varints.length > 1) candidates.push({ kind: 'varint', values: varints })

  if (bytes.length % 4 === 0) {
    const values = []
    for (let i = 0; i < bytes.length; i += 4) values.push(readFixed32(bytes, i).float)
    candidates.push({ kind: 'float', values })
  }
  if (bytes.length % 8 === 0) {
    const values = []
    for (let i = 0; i < bytes.length; i += 8) values.push(readFixed64(bytes, i).double)
    candidates.push({ kind: 'double', values })
  }

  return candidates.length > 0 ? { candidates } : null
}

function readField(bytes, pos, end, depth, budget) {
  const res = readFieldRaw(bytes, pos, end, depth, budget)
  if (res && res.field) res.field.size = res.next - res.field.offset
  return res
}

function readFieldRaw(bytes, pos, end, depth, budget) {
  const start = pos
  const key = decodeVarint(bytes, pos, end)
  if (key.error) return { error: key.error, offset: start, next: end }
  pos = key.next

  const number = Number(key.value >> 3n)
  const wireType = Number(key.value & 7n)

  const field = {
    number,
    wireType,
    wireName: WIRE_TYPES[wireType] ? WIRE_TYPES[wireType].name : `wire-type ${wireType}`,
    offset: start,
    keyLen: pos - start,
    depth,
    children: null,
    warnings: [],
  }

  if (number === 0 || number > MAX_FIELD_NUMBER) {
    field.warnings.push('invalid-field-number')
  }
  if (number >= 19000 && number <= 19999) {
    field.warnings.push('reserved-field-number')
  }

  if (wireType === 0) {
    const v = decodeVarint(bytes, pos, end)
    if (v.error) return { error: v.error, offset: start, next: end }
    field.varint = v.value
    field.zigzag = zigzagDecode(v.value, 64)
    field.signed64 = toSigned64(v.value)
    field.next = v.next
    return { field, next: v.next }
  }

  if (wireType === 1 || wireType === 5) {
    const width = WIDTHS[wireType]
    if (pos + width > end) return { error: 'truncated-fixed', offset: start, next: end }
    field.fixed = wireType === 1 ? readFixed64(bytes, pos) : readFixed32(bytes, pos)
    field.next = pos + width
    return { field, next: pos + width }
  }

  if (wireType === 2) {
    const len = decodeVarint(bytes, pos, end)
    if (len.error) return { error: len.error, offset: start, next: end }
    const payloadStart = len.next
    const size = Number(len.value)
    if (payloadStart + size > end) {
      field.length = size
      field.payload = bytes.slice(payloadStart, end)
      field.warnings.push('truncated-length-delimited')
      return { field, next: end }
    }
    const payload = bytes.slice(payloadStart, payloadStart + size)
    field.length = size
    field.payload = payload
    field.text = decodeTextIfPrintable(payload)
    // Texto ASCII legível ganha da leitura como mensagem aninhada: sem o
    // .proto não dá pra saber, e string é muito mais comum que um submensagem
    // cujos bytes sejam todos imprimíveis.
    const nested = field.text == null ? attemptMessage(payload, depth, budget) : null
    const packed = attemptPacked(payload)
    if (nested) field.children = nested
    if (packed) field.packed = packed
    field.next = payloadStart + size
    return { field, next: payloadStart + size }
  }

  if (wireType === 3) {
    // group (obsoleto no proto3): campos aninhados até um end group (4) com
    // o mesmo número — o conteúdo começa logo depois da chave.
    const children = []
    let p = pos
    let closed = false
    while (p < end) {
      const res = readField(bytes, p, end, depth + 1, budget)
      if (!res || res.error) {
        return { error: res ? res.error : 'truncated-group', offset: start, next: end }
      }
      if (res.field.wireType === 4) {
        if (res.field.number !== number) {
          return { error: 'mismatched-end-group', offset: start, next: end }
        }
        closed = true
        p = res.next
        break
      }
      children.push(res.field)
      p = res.next
      budget.count++
      if (budget.count > 20000) return { error: 'too-many-fields', offset: start, next: end }
    }
    if (!closed) return { error: 'unterminated-group', offset: start, next: end }
    field.children = children
    field.next = p
    return { field, next: p }
  }

  if (wireType === 4) {
    // end group — só faz sentido dentro de um start group (tratado acima);
    // quem chama decide se é erro.
    field.children = []
    field.next = pos
    return { field, next: pos }
  }

  return { error: 'invalid-wire-type', offset: start, next: end }
}

export function decodeMessage(bytes) {
  const budget = { count: 0 }
  const fields = []
  const errors = []
  let pos = 0
  const end = bytes.length

  while (pos < end) {
    const res = readField(bytes, pos, end, 0, budget)
    if (!res || res.error) {
      errors.push({ code: res ? res.error : 'invalid-field', offset: res ? res.offset : pos })
      break
    }
    if (res.field.wireType === 4) {
      errors.push({ code: 'unexpected-end-group', offset: res.field.offset })
      break
    }
    fields.push(res.field)
    pos = res.next
  }

  const stats = { varint: 0, fixed64: 0, length: 0, group: 0, fixed32: 0 }
  for (const f of fields) {
    if (f.wireType === 3 || f.wireType === 4) stats.group++
    else if (stats[f.wireName] !== undefined) stats[f.wireName]++
  }

  return {
    fields,
    errors,
    stats,
    consumed: pos,
    trailing: end - pos,
  }
}

// ── Escolha da interpretação de um length-delimited ──────────────────────────

export function pickInterpretation(field, mode = 'auto') {
  const has = (n) => field[n] != null
  if (mode === 'text') return has('text') ? 'text' : 'bytes'
  if (mode === 'message') return has('children') ? 'message' : 'bytes'
  if (mode === 'packed') return has('packed') ? 'packed' : 'bytes'
  if (has('text')) return 'text'
  if (has('children')) return 'message'
  if (has('packed')) return 'packed'
  return 'bytes'
}

// ── Codificação: lista de campos → bytes ─────────────────────────────────────

function parseNumeric(raw) {
  const str = String(raw ?? '').trim()
  if (str === '') return { error: 'valor vazio' }
  if (str.toLowerCase().startsWith('0x')) {
    try {
      return { value: BigInt(str) }
    } catch {
      return { error: `número inválido: ${str}` }
    }
  }
  if (!/^[+-]?\d+$/.test(str)) return { error: `número inválido: ${str}` }
  return { value: BigInt(str) }
}

function encodeTag(number, wireType) {
  const n = BigInt(Math.trunc(Number(number) || 0))
  if (n < 1n || n > BigInt(MAX_FIELD_NUMBER)) return { error: `número de campo inválido: ${number}` }
  return { bytes: encodeVarint((n << 3n) | BigInt(wireType)) }
}

export function encodeFields(rows) {
  const chunks = []
  for (const row of rows) {
    const tag = encodeTag(row.number, row.wireType)
    if (tag.error) return { error: tag.error }
    chunks.push(tag.bytes)
    const wt = Number(row.wireType)

    if (wt === 0) {
      if (row.encoding === 'zigzag32') {
        const n = parseNumeric(row.value)
        if (n.error) return { error: n.error }
        chunks.push(encodeVarint(zigzagEncode(n.value, 32)))
      } else if (row.encoding === 'zigzag64') {
        const n = parseNumeric(row.value)
        if (n.error) return { error: n.error }
        chunks.push(encodeVarint(zigzagEncode(n.value, 64)))
      } else {
        const n = parseNumeric(row.value)
        if (n.error) return { error: n.error }
        chunks.push(encodeVarint(n.value))
      }
      continue
    }

    if (wt === 1) {
      const bytes = new Uint8Array(8)
      const n = parseNumeric(row.value)
      if (row.encoding === 'double') {
        const f = Number(row.value)
        if (!Number.isFinite(f)) return { error: `número inválido: ${row.value}` }
        writeFixed64(bytes, 0, f)
      } else {
        if (n.error) return { error: n.error }
        writeFixed64(bytes, 0, n.value)
      }
      chunks.push(bytes)
      continue
    }

    if (wt === 5) {
      const bytes = new Uint8Array(4)
      const n = parseNumeric(row.value)
      if (row.encoding === 'float') {
        const f = Number(row.value)
        if (!Number.isFinite(f)) return { error: `número inválido: ${row.value}` }
        writeFixed32(bytes, 0, f)
      } else {
        if (n.error) return { error: n.error }
        writeFixed32(bytes, 0, n.value)
      }
      chunks.push(bytes)
      continue
    }

    if (wt === 2) {
      let payload
      try {
        if (row.encoding === 'hex') payload = hexToBytes(row.value || '')
        else if (row.encoding === 'base64') payload = base64ToBytes(row.value || '')
        else payload = textToBytes(row.value || '')
      } catch (err) {
        return { error: err.message || String(err) }
      }
      chunks.push(encodeVarint(payload.length))
      chunks.push(payload)
      continue
    }

    if (wt === 3) {
      chunks.push(encodeTag(row.number, 4).bytes)
      continue
    }

    return { error: `wire type ${wt} não pode ser codificado por aqui` }
  }

  return { bytes: concatBytes(chunks), error: null }
}

// ── Frame gRPC (5 bytes: 1 flag + 4 bytes big-endian do tamanho) ─────────────

export function grpcFrame(payload, compressed = false) {
  const frame = new Uint8Array(5 + payload.length)
  frame[0] = compressed ? 1 : 0
  frame[1] = (payload.length >> 24) & 0xff
  frame[2] = (payload.length >> 16) & 0xff
  frame[3] = (payload.length >> 8) & 0xff
  frame[4] = payload.length & 0xff
  frame.set(payload, 5)
  return frame
}

export function stripGrpcFrame(bytes) {
  if (bytes.length < 5) return { payload: bytes, header: null, valid: false }
  const size = (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4]
  const valid = bytes[0] <= 1 && size + 5 === bytes.length
  return {
    payload: valid ? bytes.slice(5) : bytes,
    header: { compressed: bytes[0] === 1, size },
    valid,
  }
}

// ── Formatação ───────────────────────────────────────────────────────────────

export function formatVarintViews(value) {
  return {
    uint: value.toString(10),
    signed: toSigned64(value).toString(10),
    hex: '0x' + value.toString(16).toUpperCase(),
  }
}

export function truncateHex(bytes, limit = 48) {
  const hex = bytesToHex(bytes)
  if (bytes.length <= limit) return hex
  return `${bytesToHex(bytes.slice(0, limit))} … (+${bytes.length - limit} bytes)`
}

export function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── Amostras ─────────────────────────────────────────────────────────────────
// Cada amostra é gerada de um .proto real; o hex foi montado na mão e é
// verificado pelo round-trip (ver testes em .scratch/protobuf-check.mjs).
export const SAMPLES = [
  {
    key: 'pessoa',
    hex: '08 2a 12 03 41 6e 61 1a 0f 61 6e 61 40 65 78 65 6d 70 6c 6f 2e 64 65 76 20 01 29 00 00 00 00 00 00 12 40',
    proto: `message Pessoa {
  uint32 id = 1;
  string nome = 2;
  string email = 3;
  bool ativo = 4;
  double score = 5;
}`,
  },
  {
    key: 'pedido',
    hex: '0a 03 41 6e 61 12 03 02 04 05 1a 14 0a 0a 41 76 2e 20 42 72 61 73 69 6c 12 06 52 65 63 69 66 65 20 0d 2a 03 de ad be',
    proto: `message Pedido {
  string cliente = 1;
  repeated sint32 itens = 2;   // packed
  Endereco entrega = 3;        // mensagem aninhada
  sint32 delta = 4;            // zigzag
  bytes assinatura = 5;
}
message Endereco {
  string rua = 1;
  string cidade = 2;
}`,
  },
  {
    key: 'telemetria',
    hex: '0a 10 00 00 00 00 00 00 f8 3f 00 00 00 00 00 00 04 40 15 00 00 50 40',
    proto: `message Telemetria {
  repeated double samples = 1;  // packed
  float media = 2;
}`,
  },
]

export function grpcFramedSample(hex) {
  const bytes = hexToBytes(hex)
  return bytesToHex(grpcFrame(bytes))
}
