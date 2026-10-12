// Helpers de cor/CSS compartilhados entre os geradores de componente CSS.
//
// Bloco canônico (antes copiado byte-a-byte em cssChipGenerator,
// cssButtonGenerator, cssAvatarGenerator, cssAlertGenerator e
// cssCornerRibbonGenerator): normalização de cores, conversão para px,
// clamp, hex->rgb, rgba, luminância relativa e escolha automática de cor
// de texto.

import { relativeLuminanceRgb } from './colorConvert'

export function parseColor(color) {
  if (!color) return '#1677ff'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

export function toPx(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}px` : '0px'
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function hexToRgb(hex) {
  const clean = parseColor(hex).replace('#', '')
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(bigint)) return { r: 22, g: 119, b: 255 }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function relativeLuminance(hex) {
  return relativeLuminanceRgb(hexToRgb(hex))
}

export function autoTextColor(hex) {
  return relativeLuminance(hex) > 0.5 ? '#000000' : '#ffffff'
}
