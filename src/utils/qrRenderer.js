import QRCode from 'qrcode'

// Níveis de correção de erro do QR Code (nome → % de dados redundantes).
// Quanto maior a redundância, mais dano físico o QR aguenta antes de ficar
// ilegível — mas mais densa fica a matriz (mesmo conteúdo em versão maior).
export const ECC_LEVELS = ['L', 'M', 'Q', 'H']
export const ECC_PCT = { L: 7, M: 15, Q: 25, H: 30 }

// Codifica o texto e devolve a matriz booleana de módulos dark (true),
// além de metadados da versão. `QRCode.create` é síncrono e determinístico.
// Se o conteúdo não couber no maior QR (versão 40), lança erro — capturado
// aqui e devolvido no campo `error` pra página exibir de forma amigável.
export function encodeQr(text, ecc) {
  if (!text) return null
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: ecc })
    const size = qr.modules.size
    const matrix = []
    let dark = 0
    for (let row = 0; row < size; row++) {
      const line = []
      for (let col = 0; col < size; col++) {
        const bit = !!qr.modules.get(row, col)
        line.push(bit)
        if (bit) dark++
      }
      matrix.push(line)
    }
    return { matrix, size, dark, version: qr.version }
  } catch {
    return { error: true }
  }
}

// Monta o SVG do QR do zero a partir da matriz — sem recorrer ao renderer do
// módulo. Path único com runs por linha (cada raia horizontal de módulos
// dark vira um `M x y h w v c h -w z`) pra o SVG ficar compacto mesmo em
// versões altas. `margin` é a zona de silêncio (spec exige ≥ 4 módulos).
export function qrToSvg(text, { ecc, scale, margin, fg, bg }) {
  const enc = encodeQr(text, ecc)
  if (!enc || enc.error) return ''
  const { matrix, size } = enc
  const cell = Math.max(1, scale | 0)
  const m = Math.max(0, margin | 0)
  const view = (size + 2 * m) * cell
  const origin = m * cell
  let d = ''
  for (let r = 0; r < size; r++) {
    const y = (r + m) * cell
    let c = 0
    while (c < size) {
      while (c < size && !matrix[r][c]) c++
      if (c >= size) break
      const start = c
      while (c < size && matrix[r][c]) c++
      const w = (c - start) * cell
      d += `M${origin + start * cell} ${y}h${w}v${cell}h-${w}z`
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${view}" height="${view}" ` +
    `viewBox="0 0 ${view} ${view}" role="img" aria-label="QR Code">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    (d ? `<path d="${d}" fill="${fg}"/>` : '') +
    `</svg>`
  )
}

function parseHex(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

// Luminância relativa (WCAG) de uma cor hex #rrggbb.
export function hexLuminance(hex) {
  const { r, g, b } = parseHex(hex)
  const norm = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2]
}

export function contrastRatio(hexA, hexB) {
  const la = hexLuminance(hexA)
  const lb = hexLuminance(hexB)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function utf8Bytes(text) {
  return new TextEncoder().encode(text).length
}