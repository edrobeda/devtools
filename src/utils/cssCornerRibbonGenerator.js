// Gerador de corner ribbon CSS puro.
//
// Produz uma faixa diagonal ("ribbon") para cantos de cards, boxes ou páginas,
// usando só CSS. Útil para selos "New", "Beta", "Sale", "Hot", etc.

function parseColor(color) {
  if (!color) return '#1677ff'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function toPx(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}px` : '0px'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function hexToRgb(hex) {
  const clean = parseColor(hex).replace('#', '')
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(bigint)) return { r: 22, g: 119, b: 255 }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function autoTextColor(hex) {
  return relativeLuminance(hex) > 0.5 ? '#000000' : '#ffffff'
}

const POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

const DEFAULTS = {
  position: 'top-right',
  text: 'NEW',
  bgColor: '#ff4d4f',
  textColor: '#ffffff',
  width: 150,
  height: 36,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  shadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  zIndex: 10,
  className: 'ribbon',
  fold: true,
  containerClassName: 'ribbon-box',
  containerWidth: 280,
  containerHeight: 180,
  containerRadius: 12,
  containerBg: '#f5f5f5',
}

const PRESETS = {
  default: { ...DEFAULTS },
  sale: {
    ...DEFAULTS,
    text: 'SALE',
    bgColor: '#ff4d4f',
    textColor: '#ffffff',
    position: 'top-left',
    width: 160,
  },
  new: {
    ...DEFAULTS,
    text: 'NEW',
    bgColor: '#52c41a',
    textColor: '#ffffff',
    position: 'top-right',
    width: 140,
  },
  beta: {
    ...DEFAULTS,
    text: 'BETA',
    bgColor: '#1677ff',
    textColor: '#ffffff',
    position: 'top-right',
    width: 150,
  },
  hot: {
    ...DEFAULTS,
    text: 'HOT',
    bgColor: '#fa541c',
    textColor: '#ffffff',
    position: 'top-left',
    width: 140,
  },
  dark: {
    ...DEFAULTS,
    text: 'PRO',
    bgColor: '#1f1f1f',
    textColor: '#ffd700',
    position: 'top-right',
    width: 150,
    shadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
    containerBg: '#e6e6e6',
  },
  minimal: {
    ...DEFAULTS,
    text: 'Free',
    bgColor: '#ffffff',
    textColor: '#262626',
    position: 'top-right',
    width: 130,
    shadow: 'none',
    fold: false,
    fontWeight: 600,
  },
}

export { DEFAULTS, PRESETS, POSITIONS }

function getTransform(position) {
  switch (position) {
    case 'top-left':
      return 'translate(-50%, -50%) rotate(-45deg)'
    case 'top-right':
      return 'translate(50%, -50%) rotate(45deg)'
    case 'bottom-left':
      return 'translate(-50%, 50%) rotate(45deg)'
    case 'bottom-right':
      return 'translate(50%, 50%) rotate(-45deg)'
    default:
      return 'translate(50%, -50%) rotate(45deg)'
  }
}

function getPlacement(position) {
  switch (position) {
    case 'top-left':
      return { top: '0', left: '0', right: 'auto', bottom: 'auto' }
    case 'top-right':
      return { top: '0', right: '0', left: 'auto', bottom: 'auto' }
    case 'bottom-left':
      return { bottom: '0', left: '0', top: 'auto', right: 'auto' }
    case 'bottom-right':
      return { bottom: '0', right: '0', top: 'auto', left: 'auto' }
    default:
      return { top: '0', right: '0', left: 'auto', bottom: 'auto' }
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildRibbonCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'ribbon'
  const containerClass = opts.containerClassName || 'ribbon-box'
  const position = opts.position || 'top-right'
  const bgColor = parseColor(opts.bgColor)
  const textColor = parseColor(opts.textColor) || autoTextColor(bgColor)
  const width = clamp(Number(opts.width) || 150, 60, 400)
  const height = clamp(Number(opts.height) || 36, 16, 120)
  const fontSize = clamp(Number(opts.fontSize) || 13, 8, 32)
  const fontWeight = clamp(Number(opts.fontWeight) || 700, 100, 900)
  const letterSpacing = clamp(Number(opts.letterSpacing) || 1, 0, 8)
  const shadow = opts.shadow || 'none'
  const zIndex = clamp(Number(opts.zIndex) || 10, 0, 9999)
  const fold = !!opts.fold
  const placement = getPlacement(position)
  const transform = getTransform(position)

  const foldColor = rgba(bgColor, 0.35)

  const lines = [
    `.${containerClass} {`,
    '  position: relative;',
    '  overflow: hidden;',
    '  display: inline-block;',
    `  width: ${toPx(opts.containerWidth || 280)};`,
    `  height: ${toPx(opts.containerHeight || 180)};`,
    `  background: ${parseColor(opts.containerBg)};`,
    `  border-radius: ${toPx(opts.containerRadius || 12)};`,
    '}',
    '',
    `.${cn} {`,
    '  position: absolute;',
    `  top: ${placement.top};`,
    `  right: ${placement.right};`,
    `  bottom: ${placement.bottom};`,
    `  left: ${placement.left};`,
    `  width: ${toPx(width)};`,
    `  height: ${toPx(height)};`,
    `  line-height: ${toPx(height)};`,
    '  text-align: center;',
    `  background: ${bgColor};`,
    `  color: ${textColor};`,
    `  font-size: ${toPx(fontSize)};`,
    `  font-weight: ${fontWeight};`,
    `  letter-spacing: ${toPx(letterSpacing)};`,
    '  text-transform: uppercase;',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    `  box-shadow: ${shadow};`,
    `  transform: ${transform};`,
    '  transform-origin: center;',
    `  z-index: ${zIndex};`,
    '}',
  ]

  if (fold) {
    lines.push(
      '',
      `.${cn}::before {`,
      "  content: '';",
      '  position: absolute;',
      '  inset: 0;',
      `  background: linear-gradient(90deg, ${foldColor} 0%, transparent 20%, transparent 80%, ${foldColor} 100%);`,
      '  pointer-events: none;',
      '}',
      '',
      `.${cn}::after {`,
      "  content: '';",
      '  position: absolute;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  bottom: 0;',
      `  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1);`,
      '  pointer-events: none;',
      '}'
    )
  }

  return lines.join('\n')
}

export function buildRibbonHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'ribbon'
  const containerClass = opts.containerClassName || 'ribbon-box'
  const text = escapeHtml(opts.text || 'NEW')
  return `<div class="${containerClass}">\n  <div class="${cn}">${text}</div>\n  <!-- seu conteúdo aqui -->\n</div>`
}

export function buildRibbonFullDemo(options = {}) {
  const css = buildRibbonCss(options)
  const html = buildRibbonHtml(options)
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Corner Ribbon</title>\n  <style>\n${css.split('\n').map((l) => '    ' + l).join('\n')}\n  </style>\n</head>\n<body>\n\n${html.split('\n').map((l) => '  ' + l).join('\n')}\n\n</body>\n</html>`
}
