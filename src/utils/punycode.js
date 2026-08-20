// Motor do "Conversor IDN / Punycode" — 100% client-side.
//
// Converte domínios entre a forma legível (Unicode com acentos, emoji,
// scripts CJK/árabe/etc.) e a forma ASCII que o DNS realmente aceita
// (punycode, RFC 3492, com o prefixo "xn--"). O núcleo é o algoritmo do
// RFC 3492 implementado do zero (sem dependência externa); por cima dele,
// helpers de domínio cuidam de: normalização (NFC + minúsculas), split por
// rótulo (label), ponto terminal, porta opcional e limites de tamanho
// (63 caracteres por rótulo / 253 no domínio completo). Nenhum dado sai do
// navegador.

const BASE = 36
const TMIN = 1
const TMAX = 26
const SKEW = 38
const DAMP = 700
const INITIAL_BIAS = 72
const INITIAL_N = 128
const DELIMITER = 0x2d // '-'

// Conjunto básico aceitável num rótulo de host ASCII (DNS é case-insensitive;
// "_" aceito por tolerância com DNS-SRV e afins).
const ASCII_HOST_RE = /^[a-z0-9_-]+$/

// Um rótulo já em ACE (ASCII Compatible Encoding) começa com "xn--".
const ACE_RE = /^xn--[a-z0-9-]*$/i

// --- núcleo RFC 3492 --------------------------------------------------------

// Adaptação de bias do RFC 3492 (arítmetica inteira, arredondando pra baixo).
function adapt(delta, numpoints, firsttime) {
  let d = firsttime ? Math.floor(delta / DAMP) : delta >> 1
  d += Math.floor(d / numpoints)
  let k = 0
  while (d > Math.floor(((BASE - TMIN) * TMAX) / 2)) {
    d = Math.floor(d / (BASE - TMIN))
    k += BASE
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW))
}

// dígito 0..35 -> ponto de código ASCII (a-z, depois 0-9)
function digitToCodePoint(d) {
  return d < 26 ? d + 0x61 : d - 26 + 0x30
}

// ponto de código ASCII (a-z ou 0-9) -> dígito 0..35; -1 se não é dígito
function codePointToDigit(cp) {
  if (cp >= 0x30 && cp <= 0x39) return cp - 0x30 + 26
  if (cp >= 0x61 && cp <= 0x7a) return cp - 0x61
  return -1
}

// Codifica um array de code points num string punycode (SEM o prefixo xn--).
export function encodePunycode(cps) {
  const out = []
  let n = INITIAL_N
  let delta = 0
  let bias = INITIAL_BIAS

  const basic = []
  for (const cp of cps) {
    if (cp < 0x80) basic.push(cp)
  }
  out.push(...basic)
  const b = basic.length
  if (b > 0) out.push(DELIMITER)

  let h = b
  const h0 = b
  while (h < cps.length) {
    let m = Infinity
    for (const cp of cps) {
      if (cp >= n && cp < m) m = cp
    }
    if (m === Infinity) break
    delta += (m - n) * (h + 1)
    n = m
    for (const cp of cps) {
      if (cp < n) {
        delta += 1
      } else if (cp === n) {
        let q = delta
        let k = BASE
        for (;;) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias
          if (q < t) break
          out.push(digitToCodePoint(t + ((q - t) % (BASE - t))))
          q = Math.floor((q - t) / (BASE - t))
          k += BASE
        }
        out.push(digitToCodePoint(q))
        bias = adapt(delta, h + 1, h === h0)
        delta = 0
        h += 1
      }
    }
    delta += 1
    n += 1
  }
  return String.fromCodePoint(...out)
}

// Decodifica um string punycode (SEM prefixo xn--) num string Unicode.
// Lança Error quando a sequência está malformada.
export function decodePunycode(input) {
  const cps = [...input].map((c) => c.codePointAt(0))
  let n = INITIAL_N
  let i = 0
  let bias = INITIAL_BIAS
  const output = []

  let lastDelim = -1
  for (let j = cps.length - 1; j >= 0; j--) {
    if (cps[j] === DELIMITER) {
      lastDelim = j
      break
    }
  }

  let pos = 0
  if (lastDelim >= 0) {
    for (let j = 0; j < lastDelim; j++) {
      if (cps[j] >= 0x80) throw new Error('basic code point above 0x7f')
      output.push(cps[j])
      pos += 1
    }
    pos += 1 // pula o delimitador
  }

  while (pos < cps.length) {
    const oldi = i
    let w = 1
    let k = BASE
    for (;;) {
      if (pos >= cps.length) throw new Error('input underflow')
      const digit = codePointToDigit(cps[pos])
      if (digit < 0) throw new Error('non-digit code point')
      pos += 1
      i += digit * w
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias
      if (digit < t) break
      w *= BASE - t
      k += BASE
    }
    const outLen = output.length + 1
    bias = adapt(i - oldi, outLen, oldi === 0)
    n += Math.floor(i / outLen)
    i %= outLen
    output.splice(i, 0, n)
    i += 1
  }
  return String.fromCodePoint(...output)
}

// --- helpers de domínio -----------------------------------------------------

function hasNonAscii(s) {
  return [...s].some((c) => c.codePointAt(0) >= 0x80)
}

// Normalização aplicada antes de codificar: NFC + minúsculas (DNS ignora
// maiúsc./minúsc.; acentos combinados são compostos).
function normalizeForEncode(s) {
  return s.normalize('NFC').toLowerCase()
}

// Converte UM rótulo para a forma ASCII (direção Unicode -> punycode).
export function encodeLabel(raw) {
  const norm = normalizeForEncode(raw)
  if (!hasNonAscii(norm)) {
    if (!ASCII_HOST_RE.test(norm)) return { ok: false, error: 'badchars' }
    return { ok: true, kind: 'ascii', value: norm, changed: norm !== raw, raw }
  }
  let value
  try {
    value = 'xn--' + encodePunycode([...norm].map((c) => c.codePointAt(0)))
  } catch {
    return { ok: false, error: 'badencode' }
  }
  if (value.length > 63) return { ok: false, error: 'toolong', value }
  return { ok: true, kind: 'encoded', value, changed: true, raw }
}

// Converte UM rótulo para a forma Unicode (direção punycode -> Unicode).
// Rótulos que não começam com "xn--" são ASCII "comuns" e passam intactos.
export function decodeLabel(raw) {
  if (ACE_RE.test(raw)) {
    if (raw.length <= 4) return { ok: false, error: 'badencode' }
    const ace = raw.toLowerCase()
    let value
    try {
      value = decodePunycode(ace.slice(4))
    } catch {
      return { ok: false, error: 'badencode' }
    }
    if (!value) return { ok: false, error: 'badencode' }
    return { ok: true, kind: 'decoded', value, changed: true, raw }
  }
  if (hasNonAscii(raw)) return { ok: false, error: 'nonascii' }
  if (!ASCII_HOST_RE.test(raw.toLowerCase())) return { ok: false, error: 'badchars' }
  return { ok: true, kind: 'unchanged', value: raw, changed: false, raw }
}

// Converte uma linha (um domínio) na direção pedida.
//   direction 'toAscii'  -> Unicode → punycode
//   direction 'toUnicode'-> punycode → Unicode
// Devolve null quando a linha está vazia, ou um objeto:
//   { input, output?, error?, labels?, warnings?, port?, trailing? }
export function convertLine(rawLine, direction) {
  const raw = String(rawLine || '').trim()
  if (!raw) return null
  if (/\s/.test(raw)) return { input: raw, error: 'whitespace' }
  if (raw.includes('/') || raw.includes('?') || raw.includes('#')) {
    return { input: raw, error: 'slashes' }
  }

  let trailing = false
  let body = raw
  if (body.endsWith('.')) {
    trailing = true
    body = body.slice(0, -1)
  }

  let port = ''
  const pm = body.match(/^(.+):(\d{1,5})$/)
  if (pm) {
    body = pm[1]
    port = `:${pm[2]}`
  }
  if (!body) return { input: raw, error: 'empty' }

  const rawLabels = body.split('.')
  if (rawLabels.some((l) => l === '')) return { input: raw, error: 'emptylabel' }

  const results = rawLabels.map((l) => (direction === 'toAscii' ? encodeLabel(l) : decodeLabel(l)))
  const bad = results.find((r) => !r.ok)
  if (bad) return { input: raw, error: bad.error, port, trailing }

  const value = results.map((r) => r.value).join('.')

  const warnings = []
  results.forEach((r) => {
    if (r.value.length > 63) warnings.push({ code: 'labellen', label: r.value })
  })
  if (value.length > 253) warnings.push({ code: 'domainlen', len: value.length })
  if (direction === 'toAscii' && results.every((r) => r.kind === 'ascii')) {
    warnings.push({ code: 'plainascii' })
  }
  if (
    direction === 'toAscii' &&
    results.some((r) => r.kind === 'ascii' && (r.changed && r.raw !== r.value))
  ) {
    warnings.push({ code: 'lowercased' })
  }

  return {
    input: raw,
    output: value + port + (trailing ? '.' : ''),
    error: null,
    labels: results.map((r) => ({ from: r.raw, to: r.value, kind: r.kind })),
    warnings,
    port,
    trailing,
  }
}

// Converte o texto inteiro (uma linha por domínio) e agrega estatísticas.
export function convertAll(text, direction) {
  const lines = String(text || '').split('\n')
  const results = []
  for (const line of lines) {
    const r = convertLine(line, direction)
    if (r) results.push(r)
  }
  const okLines = results.filter((r) => !r.error)
  return {
    results,
    total: results.length,
    ok: okLines.length,
    errors: results.length - okLines.length,
    labelsConverted: okLines.reduce(
      (sum, r) => sum + r.labels.filter((l) => l.kind === 'encoded' || l.kind === 'decoded').length,
      0
    ),
    output: okLines.map((r) => r.output).join('\n'),
  }
}

// Código-fonte exibido na página (referência). Array de linhas pra não
// precisar escapar backtick/${ dentro de template literal.
export function getEngineSource() {
  return [
    '// Núcleo do RFC 3492 (punycode), implementado do zero. O algoritmo',
    '// traduz cada code point extra-ASCII em dígitos base-36 com "biased',
    '// adaptation": os primeiros dígitos absorvem quase toda a variação de',
    '// tamanho, os seguintes refinam a posição no alfabeto Unicode.',
    '',
    'function adapt(delta, numpoints, firsttime) {',
    '  let d = firsttime ? Math.floor(delta / 700) : delta >> 1',
    '  d += Math.floor(d / numpoints)',
    '  let k = 0',
    '  while (d > Math.floor((35 * 26) / 2)) {',
    '    d = Math.floor(d / 35)',
    '    k += 36',
    '  }',
    '  return k + Math.floor((36 * d) / (d + 38))',
    '}',
    '',
    '// encode(input) — entrada: array de code points',
    '// 1. copia os básicos (< 0x80) e põe o delimitador "-" depois deles',
    '// 2. para cada nível n, conta quantos pontos ainda faltam (delta)',
    '// 3. delta é serializado em dígitos base-36; o bias é reajustado',
    '//    a cada code point para comprimir tamanhos típicos',
    '',
    '// decode(input) — entrada: string punycode',
    '// 1. copia os básicos antes do último "-" (falha se houver não-ASCII)',
    '// 2. relê os dígitos base-36 reconstruindo delta, bias e n',
    '// 3. insere cada code point descoberto na posição i do output',
    '',
    '// Por cima do núcleo: normalização NFC + minúsculas, split por rótulo,',
    '// prefixo "xn--", porta opcional e limites 63 por rótulo / 253 total.',
    '// Domínios já ASCII (incl. IPs) passam intactos.',
  ].join('\n')
}

// Amostras prontas pra página começar com conteúdo útil.
// (Valores "xn--..." do punycode RFC 3492, cruzados com o codec `punycode`
// do Python — mesma implementação de referência.)
export const SAMPLES = {
  toAscii: [
    'münchen.de',
    'bücher.de',
    'mañana.com',
    'café.example.com',
    'españa.es',
    '日本語.jp',
    '💩.la',
  ].join('\n'),
  toUnicode: [
    'xn--mnchen-3ya.de',
    'xn--bcher-kva.de',
    'xn--maana-pta.com',
    'xn--caf-dma.example.com',
    'xn--espaa-rta.es',
    'xn--wgv71a119e.jp',
    'xn--ls8h.la',
  ].join('\n'),
}