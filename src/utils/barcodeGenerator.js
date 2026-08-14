// Gerador de códigos de barras 100% client-side.
// Suporta Code 128 (subconjunto B, ASCII imprimível 32-126) e EAN-13.
// A saída é um SVG que pode ser copiado, baixado ou embutido.

// Padrões Code 128 (valores 0-106). Cada string tem 11 caracteres onde
// '1' = barra escura e '0' = espaço em branco. O stop code (106) tem 13.
const CODE128_PATTERNS = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
  '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
  '11010011100', '1100011101011',
]

// Code 128 conjunto B: valores 0-94 correspondem aos caracteres ASCII 32-126.
const CODE128_START_B = 104
const CODE128_STOP = 106
const CODE128_MAX_PRINTABLE = 126
const CODE128_MIN_PRINTABLE = 32

function charToCode128B(char) {
  const code = char.charCodeAt(0)
  if (code >= CODE128_MIN_PRINTABLE && code <= CODE128_MAX_PRINTABLE) {
    return code - CODE128_MIN_PRINTABLE
  }
  return -1
}

function buildCode128Chain(values) {
  let checksum = CODE128_START_B
  values.forEach((v, idx) => {
    checksum += v * (idx + 1)
  })
  checksum %= 103
  return [CODE128_START_B, ...values, checksum, CODE128_STOP]
}

function chainToBits(chain) {
  return chain.map((v) => CODE128_PATTERNS[v]).join('')
}

export function validateCode128(text) {
  if (!text) return { ok: false, reason: 'empty' }
  for (let i = 0; i < text.length; i++) {
    if (charToCode128B(text[i]) === -1) {
      return { ok: false, reason: 'invalid-char', char: text[i], index: i }
    }
  }
  return { ok: true }
}

export function generateCode128(text, opts = {}) {
  const validation = validateCode128(text)
  if (!validation.ok) {
    return { error: validation.reason }
  }
  const values = Array.from(text).map(charToCode128B)
  const chain = buildCode128Chain(values)
  const bits = chainToBits(chain)
  const { width = 320, height = 100, fg = '#000000', bg = '#ffffff', showText = true } = opts
  const moduleWidth = width / bits.length
  const quietZone = Math.max(10, moduleWidth * 10)
  const totalWidth = width + quietZone * 2
  const barHeight = showText ? height * 0.75 : height
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="Barcode ${text}">`
  svg += `<rect width="100%" height="100%" fill="${bg}"/>`
  let x = quietZone
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      svg += `<rect x="${x.toFixed(2)}" y="0" width="${moduleWidth.toFixed(2)}" height="${barHeight}" fill="${fg}"/>`
    }
    x += moduleWidth
  }
  if (showText) {
    svg += `<text x="${(totalWidth / 2).toFixed(2)}" y="${(height - 8).toFixed(2)}" text-anchor="middle" font-family="monospace" font-size="14" fill="${fg}">${escapeXml(text)}</text>`
  }
  svg += '</svg>'
  return { svg, text, type: 'CODE128', modules: bits.length }
}

// EAN-13: tabelas de codificação L (odd), G (even) e R.
const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']

// Primeiro dígito define a paridade dos 6 dígitos da metade esquerda.
const EAN_PARITY = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
]

function normalizeEan13(input) {
  const digitsOnly = input.replace(/\D/g, '')
  if (digitsOnly.length === 12) {
    return digitsOnly + computeEanChecksum(digitsOnly)
  }
  if (digitsOnly.length === 13) {
    return digitsOnly
  }
  return null
}

export function computeEanChecksum(digits12) {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const d = parseInt(digits12[i], 10)
    sum += d * (i % 2 === 0 ? 1 : 3)
  }
  const mod = sum % 10
  return String((10 - mod) % 10)
}

export function validateEan13(input) {
  if (!input) return { ok: false, reason: 'empty' }
  const digitsOnly = input.replace(/\D/g, '')
  if (digitsOnly.length !== 12 && digitsOnly.length !== 13) {
    return { ok: false, reason: 'length', got: digitsOnly.length }
  }
  if (digitsOnly.length === 13) {
    const expected = computeEanChecksum(digitsOnly.slice(0, 12))
    if (expected !== digitsOnly[12]) {
      return { ok: false, reason: 'checksum', expected, got: digitsOnly[12] }
    }
  }
  return { ok: true, normalized: normalizeEan13(digitsOnly) }
}

function generateEanBits(digits13) {
  const first = parseInt(digits13[0], 10)
  const left = digits13.slice(1, 7)
  const right = digits13.slice(7, 13)
  const parity = EAN_PARITY[first]
  let bits = '101' // left guard
  for (let i = 0; i < 6; i++) {
    const d = parseInt(left[i], 10)
    bits += parity[i] === 'L' ? EAN_L[d] : EAN_G[d]
  }
  bits += '01010' // center guard
  for (let i = 0; i < 6; i++) {
    const d = parseInt(right[i], 10)
    bits += EAN_R[d]
  }
  bits += '101' // right guard
  return bits
}

export function generateEan13(input, opts = {}) {
  const validation = validateEan13(input)
  if (!validation.ok) {
    return { error: validation.reason, details: validation }
  }
  const digits = validation.normalized
  const bits = generateEanBits(digits)
  const { width = 320, height = 120, fg = '#000000', bg = '#ffffff', showText = true } = opts
  const moduleWidth = width / bits.length
  const quietZone = Math.max(10, moduleWidth * 10)
  const totalWidth = width + quietZone * 2
  const barHeight = showText ? height * 0.78 : height
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="EAN-13 ${digits}">`
  svg += `<rect width="100%" height="100%" fill="${bg}"/>`
  let x = quietZone
  for (let i = 0; i < bits.length; i++) {
    const isGuard = i < 3 || (i >= 45 && i < 50) || i >= bits.length - 3
    const h = isGuard ? height : barHeight
    if (bits[i] === '1') {
      svg += `<rect x="${x.toFixed(2)}" y="0" width="${moduleWidth.toFixed(2)}" height="${h}" fill="${fg}"/>`
    }
    x += moduleWidth
  }
  if (showText) {
    const firstDigitX = quietZone - moduleWidth * 8
    const leftGroupX = quietZone + moduleWidth * 25
    const rightGroupX = quietZone + moduleWidth * 73
    const textY = height - 8
    svg += `<text x="${firstDigitX.toFixed(2)}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="16" fill="${fg}">${digits[0]}</text>`
    svg += `<text x="${leftGroupX.toFixed(2)}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="16" letter-spacing="3" fill="${fg}">${digits.slice(1, 7)}</text>`
    svg += `<text x="${rightGroupX.toFixed(2)}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="16" letter-spacing="3" fill="${fg}">${digits.slice(7)}</text>`
  }
  svg += '</svg>'
  return { svg, text: digits, type: 'EAN-13', modules: bits.length }
}

function escapeXml(text) {
  return text.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]))
}

export function generateBarcode(type, text, opts = {}) {
  if (type === 'ean13') return generateEan13(text, opts)
  if (type === 'code128') return generateCode128(text, opts)
  return { error: 'unknown-type' }
}

export const BARCODE_TYPES = ['code128', 'ean13']

export const BARCODE_DEFAULTS = {
  code128: 'DEVTOOLS-128',
  ean13: '7891000315507',
}
