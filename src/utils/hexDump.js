// ─────────────────────────────────────────────────────────────
// Hex Dump / xxd — 100% client-side.
//
// Gera um hexdump estilo `xxd`/`hexdump -C` a partir de texto ou
// bytes, e faz o caminho inverso (dump/hex → bytes → texto).
//
// createHexDump(bytes, opts)
//   - bytesPerLine: bytes por linha (8/16/32)
//   - group:       bytes agrupados por bloco (1/2/4)
//   - uppercase:   hex maiúsculo ou minúsculo
//   - showOffset:  prefixo de 8 dígitos (off:)
//   - showAscii:   coluna ASCII à direita (. para não imprimível)
//
// hexToBytes(input)
//   Aceita hex puro ("48656c6c6f"), com separadores ("48 65 6c"),
//   escapes "\x48"/"0x48" OU um dump completo com offsets e coluna
//   ASCII (linha "00000000: 4865 6c6c ...  |Hell|" também funciona,
//   offsets e a coluna ASCII são descartados automaticamente).
//   Reporta o primeiro caractere inválido com linha/coluna.
// ─────────────────────────────────────────────────────────────

const HEX_RE = /[0-9a-fA-F]/
const SEP = /[\s:_.,-]/

export function strToBytes(text) {
  return new TextEncoder().encode(String(text ?? ''))
}

export function hexToBytes(input) {
  const src = String(input ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\\[xX]/g, '')
    .replace(/0[xX]/g, '')

  let hex = ''
  const invalids = []
  const lines = src.split('\n')

  for (let li = 0; li < lines.length; li++) {
    let s = lines[li].trim()
    if (!s) continue
    // remove prefixo de offset: "00000000: " (xxd) ou "00000000  " (hexdump -C)
    s = s.replace(/^[0-9a-fA-F]{8}: +/, '').replace(/^[0-9a-fA-F]{8} {2,}/, '')
    // a coluna ASCII começa depois de 2+ espaços — descarta tudo a partir dela
    const region = s.split(/ {2,}/)[0]
    for (let ci = 0; ci < region.length; ci++) {
      const c = region[ci]
      if (HEX_RE.test(c)) hex += c
      else if (!SEP.test(c)) invalids.push({ line: li + 1, char: c, col: ci + 1 })
    }
  }

  if (invalids.length) {
    const first = invalids[0]
    return {
      ok: false,
      bytes: null,
      error: { line: first.line, char: first.char, col: first.col, count: invalids.length },
    }
  }
  if (hex.length % 2 !== 0) {
    return { ok: false, bytes: null, error: { line: -1, char: '', col: -1, count: 0, odd: true } }
  }

  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return { ok: true, bytes, hex }
}

export function createHexDump(bytes, options = {}) {
  const {
    bytesPerLine = 16,
    group = 2,
    uppercase = false,
    showOffset = true,
    showAscii = true,
  } = options

  const hexByte = (b) => {
    const s = b.toString(16).padStart(2, '0')
    return uppercase ? s.toUpperCase() : s
  }

  const groupsPerLine = Math.max(1, Math.ceil(bytesPerLine / Math.max(1, group)))
  const fullHexWidth = groupsPerLine * group * 2 + (groupsPerLine - 1)

  const lines = []
  for (let off = 0; off < bytes.length; off += bytesPerLine) {
    const chunk = bytes.slice(off, off + bytesPerLine)
    let hex = ''
    for (let g = 0; g < chunk.length; g += group) {
      if (g > 0) hex += ' '
      const grp = chunk.slice(g, g + group)
      let s = ''
      for (let k = 0; k < grp.length; k++) s += hexByte(grp[k])
      hex += s
    }

    let line = ''
    if (showOffset) line += off.toString(16).padStart(8, '0') + ': '
    line += hex.padEnd(fullHexWidth)

    if (showAscii) {
      let ascii = ''
      for (let k = 0; k < chunk.length; k++) {
        const c = chunk[k]
        ascii += c >= 0x20 && c <= 0x7e ? String.fromCharCode(c) : '.'
      }
      line += '  ' + ascii
    }
    lines.push(line)
  }

  return lines.join('\n')
}

// hex separado (ex.: "48 65 6c 6c 6f") para cópia rápida em outros contextos.
export function toHexString(bytes, { sep = ' ', uppercase = false } = {}) {
  const out = []
  for (let i = 0; i < bytes.length; i++) {
    const s = bytes[i].toString(16).padStart(2, '0')
    out.push(uppercase ? s.toUpperCase() : s)
  }
  return out.join(sep)
}

export const utf8DecodeErrors = (bytes) => {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { fatal: false, errors: 0 }
  } catch {
    const rebuilt = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    let errors = 0
    for (const ch of rebuilt) if (ch === '\ufffd') errors++
    return { fatal: true, errors }
  }
}

export function bytesToText(bytes, encoding = 'utf8') {
  if (encoding === 'latin1') {
    let out = ''
    for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
    return out
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

export function byteStats(bytes) {
  let printable = 0
  let nul = 0
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (b >= 0x20 && b <= 0x7e) printable++
    if (b === 0) nul++
  }
  const validUtf8 = !utf8DecodeErrors(bytes).fatal
  return { bytes: bytes.length, printable, printablePct: bytes.length ? (printable / bytes.length) * 100 : 0, nul, validUtf8 }
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

export function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const SAMPLES = {
  multilang: 'Olá, mundo! 🌍\nhello 世界\ntab\tinside + CRLF routing.',
  json: '{"service":"devtools","status":"ok","latency_ms":42}',
  http: 'GET /api/items HTTP/1.1\r\nHost: devtools.eventifylab.com\r\nAccept: */*\r\n\r\n',
}

// dump de exemplo para experimentar o caminho inverso (hex → texto)
export const SAMPLE_DUMP = [
  '00000000: 4865 6c6c 6f20 776f 726c 6421 0a50 756e  Hello world!.Pun',
  '00000010: 7963 6f64 6520 6973 2061 7765 736f 6d65  ycode is awesome',
  '00000020: 207c 0a                                  |.',
].join('\n')