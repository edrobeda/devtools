// Primitivas de conversão de cor (hex ↔ rgb ↔ hsl) e contraste WCAG 2.x,
// compartilhadas pelas páginas e utilitários de cor.
//
// Extraído para eliminar as cópias reescritas em ColorConverterPage,
// PaletteGeneratorPage, CssColorNamesPage, ContrastCheckerPage,
// colorBlindness, imagePaletteExtractor, qrRenderer e cssColor.
//
// A conversão HSL devolve a s/l "cruas" (0–100, float) — cada consumidor
// arredonda onde precisa. A fórmula de luminância é a WCAG 2.x (linearização
// sRGB + pesos 0.2126/0.7152/0.0722).

export const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

// Canonicaliza para "#rrggbb" minúsculo. Devolve null para entrada inválida.
export function normalizeHex(hex) {
  const match = HEX_RE.exec((hex || '').trim())
  if (!match) return null
  let value = match[1]
  if (value.length === 3) value = value.split('').map((c) => c + c).join('')
  return `#${value.toLowerCase()}`
}

// Estrito: aceita #rgb e #rrggbb (com ou sem "#"), tolerando espaços em volta.
// Devolve null quando a entrada não é um hex válido.
export function hexToRgb(hex) {
  const clean = String(hex).trim().replace(/^#/, '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

// {r,g,b} (0–255) → "#rrggbb" minúsculo, arredondando e limitando cada canal.
export function rgbToHex(r, g, b) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// {r,g,b} (0–255) → { h (0–360, inteiro), s (0–100, float), l (0–100, float) }.
export function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return { h, s: s * 100, l: l * 100 }
}

// hex → mesma forma de rgbToHsl, ou null se o hex for inválido.
export function hexToHsl(hex) {
  const rgb = hexToRgb(hex)
  return rgb ? rgbToHsl(rgb) : null
}

// h (0–360), s/l (0–100) → "#rrggbb" minúsculo.
export function hslToHex(h, s, l) {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.min(100, Math.max(0, s)) / 100
  const ll = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0; let g = 0; let b = 0
  if (hh < 60) { r = c; g = x; b = 0 }
  else if (hh < 120) { r = x; g = c; b = 0 }
  else if (hh < 180) { r = 0; g = c; b = x }
  else if (hh < 240) { r = 0; g = x; b = c }
  else if (hh < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Luminância relativa (WCAG 2.x) de um {r,g,b}.
export function relativeLuminanceRgb({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Razão de contraste WCAG 2.x entre dois {r,g,b} válidos.
export function contrastRatioRgb(a, b) {
  const la = relativeLuminanceRgb(a)
  const lb = relativeLuminanceRgb(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

// Razão de contraste WCAG entre dois hex; null se algum for inválido.
export function contrastRatio(hexA, hexB) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  if (!a || !b) return null
  return contrastRatioRgb(a, b)
}
