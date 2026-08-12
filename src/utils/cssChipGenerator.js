// Gerador de chip/badge CSS puro.
//
// Produz a classe .chip com variações sólida, outline e soft, indicador de
// status, ícone e botão de remover — tudo com HTML semântico e CSS pronto
// para copiar.

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

const ICON_SVGS = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-5 5c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>',
}

const DISMISS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'

const DEFAULTS = {
  text: 'Chip',
  variant: 'solid',
  shape: 'pill',
  size: 'md',
  color: '#1677ff',
  textColor: '#ffffff',
  autoText: true,
  borderColor: '#1677ff',
  borderWidth: 1,
  hasDot: false,
  dotColor: '#52c41a',
  hasIcon: false,
  iconType: 'star',
  hasDismiss: false,
  dismissColor: '#8c8c8c',
  shadow: 'none',
  fontSize: 14,
  fontWeight: 500,
  paddingX: 12,
  paddingY: 6,
  gap: 6,
  hoverScale: 1,
  transitionDuration: 150,
}

const SIZE_OVERRIDES = {
  sm: { fontSize: 12, paddingX: 8, paddingY: 4 },
  md: { fontSize: 14, paddingX: 12, paddingY: 6 },
  lg: { fontSize: 16, paddingX: 16, paddingY: 8 },
}

const PRESETS = {
  default: {
    text: 'Chip',
    variant: 'solid',
    shape: 'pill',
    size: 'md',
    color: '#1677ff',
    textColor: '#ffffff',
    autoText: true,
    borderColor: '#1677ff',
    borderWidth: 1,
    hasDot: false,
    dotColor: '#52c41a',
    hasIcon: false,
    iconType: 'star',
    hasDismiss: false,
    dismissColor: '#8c8c8c',
    shadow: 'none',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1,
    transitionDuration: 150,
  },
  success: {
    text: 'Success',
    variant: 'solid',
    shape: 'pill',
    size: 'md',
    color: '#52c41a',
    textColor: '#ffffff',
    autoText: true,
    borderColor: '#52c41a',
    borderWidth: 1,
    hasDot: true,
    dotColor: '#ffffff',
    hasIcon: true,
    iconType: 'check',
    hasDismiss: false,
    dismissColor: '#ffffff',
    shadow: 'none',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1,
    transitionDuration: 150,
  },
  warning: {
    text: 'Warning',
    variant: 'soft',
    shape: 'pill',
    size: 'md',
    color: '#faad14',
    textColor: '#613400',
    autoText: false,
    borderColor: '#faad14',
    borderWidth: 1,
    hasDot: true,
    dotColor: '#faad14',
    hasIcon: false,
    iconType: 'bell',
    hasDismiss: true,
    dismissColor: '#613400',
    shadow: 'none',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1,
    transitionDuration: 150,
  },
  error: {
    text: 'Error',
    variant: 'outline',
    shape: 'rounded',
    size: 'md',
    color: '#ff4d4f',
    textColor: '#ff4d4f',
    autoText: false,
    borderColor: '#ff4d4f',
    borderWidth: 1,
    hasDot: true,
    dotColor: '#ff4d4f',
    hasIcon: false,
    iconType: 'bell',
    hasDismiss: true,
    dismissColor: '#ff4d4f',
    shadow: 'none',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1,
    transitionDuration: 150,
  },
  info: {
    text: 'Info',
    variant: 'soft',
    shape: 'pill',
    size: 'md',
    color: '#1677ff',
    textColor: '#0958d9',
    autoText: false,
    borderColor: '#1677ff',
    borderWidth: 1,
    hasDot: true,
    dotColor: '#1677ff',
    hasIcon: true,
    iconType: 'bell',
    hasDismiss: false,
    dismissColor: '#0958d9',
    shadow: 'none',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1,
    transitionDuration: 150,
  },
  outline: {
    text: 'Outline',
    variant: 'outline',
    shape: 'pill',
    size: 'md',
    color: '#595959',
    textColor: '#595959',
    autoText: false,
    borderColor: '#d9d9d9',
    borderWidth: 1,
    hasDot: false,
    dotColor: '#52c41a',
    hasIcon: false,
    iconType: 'star',
    hasDismiss: true,
    dismissColor: '#8c8c8c',
    shadow: 'none',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1,
    transitionDuration: 150,
  },
  soft: {
    text: 'Soft',
    variant: 'soft',
    shape: 'pill',
    size: 'md',
    color: '#722ed1',
    textColor: '#531dab',
    autoText: false,
    borderColor: '#722ed1',
    borderWidth: 1,
    hasDot: false,
    dotColor: '#722ed1',
    hasIcon: true,
    iconType: 'heart',
    hasDismiss: false,
    dismissColor: '#531dab',
    shadow: 'none',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1,
    transitionDuration: 150,
  },
  dark: {
    text: 'Dark',
    variant: 'solid',
    shape: 'rounded',
    size: 'md',
    color: '#262626',
    textColor: '#ffffff',
    autoText: true,
    borderColor: '#262626',
    borderWidth: 1,
    hasDot: false,
    dotColor: '#52c41a',
    hasIcon: false,
    iconType: 'star',
    hasDismiss: true,
    dismissColor: '#bfbfbf',
    shadow: '0 2px 4px rgba(0,0,0,0.2)',
    fontSize: 14,
    fontWeight: 500,
    paddingX: 12,
    paddingY: 6,
    gap: 6,
    hoverScale: 1.02,
    transitionDuration: 150,
  },
}

export { PRESETS, DEFAULTS, ICON_SVGS, DISMISS_SVG }

export function buildChipCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const variant = opts.variant || 'solid'
  const shape = opts.shape || 'pill'
  const color = parseColor(opts.color)
  const textColor = opts.autoText ? autoTextColor(color) : parseColor(opts.textColor)
  const borderColor = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || DEFAULTS.borderWidth, 0, 8)
  const dotColor = parseColor(opts.dotColor)
  const dismissColor = parseColor(opts.dismissColor)
  const shadow = opts.shadow || 'none'
  const fontSize = clamp(Number(opts.fontSize) || DEFAULTS.fontSize, 10, 32)
  const fontWeight = clamp(Number(opts.fontWeight) || DEFAULTS.fontWeight, 100, 900)
  const paddingX = clamp(Number(opts.paddingX) || DEFAULTS.paddingX, 0, 48)
  const paddingY = clamp(Number(opts.paddingY) || DEFAULTS.paddingY, 0, 32)
  const gap = clamp(Number(opts.gap) || DEFAULTS.gap, 0, 24)
  const hoverScale = clamp(Number(opts.hoverScale) || 1, 0.8, 1.2)
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 1000)

  let background
  let text
  let border

  if (variant === 'outline') {
    background = 'transparent'
    text = textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${borderColor}` : 'none'
  } else if (variant === 'soft') {
    background = rgba(color, 0.15)
    text = textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${rgba(color, 0.2)}` : 'none'
  } else {
    background = color
    text = textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${borderColor}` : 'none'
  }

  const radius = shape === 'pill' ? '9999px' : shape === 'square' ? '0' : `${Math.round(Math.min(paddingY * 1.5, fontSize * 0.7))}px`
  const iconSize = Math.round(fontSize * 1.15)
  const dotSize = Math.round(fontSize * 0.5)

  const lines = [
    '/* Container do chip */',
    '.chip {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    `  gap: ${toPx(gap)};`,
    `  padding: ${toPx(paddingY)} ${toPx(paddingX)};`,
    `  background: ${background};`,
    `  color: ${text};`,
    `  border: ${border};`,
    `  border-radius: ${radius};`,
    `  box-shadow: ${shadow};`,
    `  font-size: ${toPx(fontSize)};`,
    `  font-weight: ${fontWeight};`,
    '  line-height: 1;',
    '  font-family: inherit;',
    '  white-space: nowrap;',
    '  cursor: default;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    `  transition: transform ${duration}ms ease, background ${duration}ms ease, color ${duration}ms ease, border-color ${duration}ms ease, box-shadow ${duration}ms ease;`,
    '}',
    '',
    '/* Ícone */',
    '.chip .chip-icon,',
    '.chip .chip-dot,',
    '.chip .chip-dismiss {',
    '  flex-shrink: 0;',
    '}',
    '',
    '.chip .chip-icon,',
    '.chip .chip-dismiss {',
    `  width: ${toPx(iconSize)};`,
    `  height: ${toPx(iconSize)};`,
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '}',
    '',
    '.chip .chip-icon svg,',
    '.chip .chip-dismiss svg {',
    '  width: 100%;',
    '  height: 100%;',
    '}',
    '',
    '/* Indicador de status */',
    '.chip .chip-dot {',
    `  width: ${toPx(dotSize)};`,
    `  height: ${toPx(dotSize)};`,
    `  background: ${dotColor};`,
    '  border-radius: 50%;',
    '}',
    '',
    '/* Botão de remover */',
    '.chip .chip-dismiss {',
    '  padding: 0;',
    '  margin: 0;',
    '  border: none;',
    '  background: transparent;',
    `  color: ${dismissColor};`,
    '  cursor: pointer;',
    '  line-height: 1;',
    `  transition: color ${duration}ms ease, transform ${duration}ms ease;`,
    '}',
    '',
    '.chip .chip-dismiss:hover {',
    '  opacity: 0.75;',
    hoverScale !== 1 ? `  transform: scale(${hoverScale});` : null,
    '}',
    '',
    '/* Hover sutil no chip inteiro (quando interativo) */',
    hoverScale !== 1 ? 'button.chip:hover,\na.chip:hover {' : 'button.chip:hover,\na.chip:hover {',
    hoverScale !== 1 ? `  transform: scale(${hoverScale});` : '  opacity: 0.9;',
    '}',
  ]

  return lines.filter(Boolean).join('\n')
}

export function buildChipHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const color = parseColor(opts.color)
  const textColor = opts.autoText ? autoTextColor(color) : parseColor(opts.textColor)
  const dotColor = parseColor(opts.dotColor)
  const dismissColor = opts.hasDismiss ? parseColor(opts.dismissColor) : textColor
  const iconSvg = ICON_SVGS[opts.iconType] || ICON_SVGS.star
  const tag = opts.interactive ? 'button' : 'span'
  const typeAttr = opts.interactive ? ' type="button"' : ''

  const parts = [`<${tag} class="chip"${typeAttr}>`]
  if (opts.hasDot) parts.push('  <span class="chip-dot"></span>')
  if (opts.hasIcon) parts.push(`  <span class="chip-icon">${iconSvg}</span>`)
  parts.push(`  <span class="chip-text">${String(opts.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`)
  if (opts.hasDismiss) {
    parts.push(`  <button class="chip-dismiss" type="button" aria-label="Remove" style="color: ${dismissColor};">${DISMISS_SVG}</button>`)
  }
  parts.push(`</${tag}>`)

  return parts.join('\n')
}

export function buildChipFullDemo(options = {}) {
  return `${buildChipCss(options)}\n\n${buildChipHtml(options)}`
}
