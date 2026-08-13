// Gerador de botão CSS puro.
//
// Produz a classe .btn com variações sólida, outline, soft, ghost e gradiente,
// ícones inline, estados hover/active/disabled e largura total opcional.

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
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  spinner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="btn-spinner"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
}

const DEFAULTS = {
  text: 'Button',
  variant: 'solid',
  shape: 'rounded',
  color: '#1677ff',
  textColor: '#ffffff',
  autoText: true,
  borderColor: '#1677ff',
  borderWidth: 1,
  fontSize: 14,
  fontWeight: 500,
  paddingX: 20,
  paddingY: 10,
  shadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
  hoverShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  hoverLift: true,
  transitionDuration: 180,
  activeScale: 0.98,
  fullWidth: false,
  leftIcon: 'none',
  rightIcon: 'none',
  className: 'btn',
  disabled: false,
  loading: false,
}

const PRESETS = {
  default: { ...DEFAULTS },
  primary: {
    ...DEFAULTS,
    text: 'Primary',
    color: '#1677ff',
    borderColor: '#1677ff',
  },
  success: {
    ...DEFAULTS,
    text: 'Success',
    color: '#52c41a',
    borderColor: '#52c41a',
  },
  danger: {
    ...DEFAULTS,
    text: 'Danger',
    color: '#ff4d4f',
    borderColor: '#ff4d4f',
  },
  warning: {
    ...DEFAULTS,
    text: 'Warning',
    color: '#faad14',
    borderColor: '#faad14',
  },
  outline: {
    ...DEFAULTS,
    text: 'Outline',
    variant: 'outline',
    color: '#1677ff',
    borderColor: '#1677ff',
    borderWidth: 1,
    shadow: 'none',
    hoverShadow: 'none',
  },
  soft: {
    ...DEFAULTS,
    text: 'Soft',
    variant: 'soft',
    color: '#722ed1',
    borderColor: '#722ed1',
    shadow: 'none',
    hoverShadow: 'none',
  },
  ghost: {
    ...DEFAULTS,
    text: 'Ghost',
    variant: 'ghost',
    color: '#595959',
    borderColor: 'transparent',
    borderWidth: 0,
    shadow: 'none',
    hoverShadow: 'none',
    hoverLift: false,
  },
  dark: {
    ...DEFAULTS,
    text: 'Dark',
    color: '#262626',
    borderColor: '#262626',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    hoverShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
  },
  gradient: {
    ...DEFAULTS,
    text: 'Gradient',
    variant: 'gradient',
    color: '#1677ff',
    borderColor: '#1677ff',
    shadow: '0 2px 8px rgba(22, 119, 255, 0.25)',
    hoverShadow: '0 6px 16px rgba(22, 119, 255, 0.35)',
  },
}

export { DEFAULTS, PRESETS, ICON_SVGS }

export function buildButtonCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'btn'
  const variant = opts.variant || 'solid'
  const shape = opts.shape || 'rounded'
  const color = parseColor(opts.color)
  const textColor = opts.autoText ? autoTextColor(color) : parseColor(opts.textColor)
  const borderColor = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || 0, 0, 8)
  const fontSize = clamp(Number(opts.fontSize) || 14, 10, 40)
  const fontWeight = clamp(Number(opts.fontWeight) || 500, 100, 900)
  const paddingX = clamp(Number(opts.paddingX) || 20, 0, 64)
  const paddingY = clamp(Number(opts.paddingY) || 10, 0, 40)
  const duration = clamp(Number(opts.transitionDuration) || 180, 0, 1000)
  const activeScale = clamp(Number(opts.activeScale) || 0.98, 0.8, 1)
  const shadow = opts.shadow || 'none'
  const hoverShadow = opts.hoverShadow || 'none'
  const hoverLift = !!opts.hoverLift
  const fullWidth = !!opts.fullWidth
  const radius = shape === 'pill' ? '9999px' : shape === 'square' ? '0' : `${Math.round(Math.min(paddingY * 1.2, fontSize * 0.8))}px`

  let background
  let colorValue
  let border
  let hoverBackground
  let hoverColor
  let hoverBorder

  if (variant === 'outline') {
    background = 'transparent'
    colorValue = borderColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${borderColor}` : 'none'
    hoverBackground = rgba(color, 0.1)
    hoverColor = color
    hoverBorder = border
  } else if (variant === 'soft') {
    background = rgba(color, 0.15)
    colorValue = color
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${rgba(color, 0.25)}` : 'none'
    hoverBackground = rgba(color, 0.25)
    hoverColor = color
    hoverBorder = border
  } else if (variant === 'ghost') {
    background = 'transparent'
    colorValue = color
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${borderColor}` : 'none'
    hoverBackground = rgba(color, 0.08)
    hoverColor = color
    hoverBorder = border
  } else if (variant === 'gradient') {
    const c = rgba(color, 1)
    const c2 = rgba(color, 0.65)
    background = `linear-gradient(135deg, ${c} 0%, ${c2} 100%)`
    colorValue = textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${borderColor}` : 'none'
    hoverBackground = `linear-gradient(135deg, ${c} 0%, ${c2} 100%)`
    hoverColor = textColor
    hoverBorder = border
  } else {
    // solid
    background = color
    colorValue = textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} solid ${borderColor}` : 'none'
    hoverBackground = color
    hoverColor = textColor
    hoverBorder = border
  }

  const iconSize = Math.round(fontSize * 1.15)
  const transitionProps = duration > 0
    ? `transform ${duration}ms ease, background ${duration}ms ease, color ${duration}ms ease, border-color ${duration}ms ease, box-shadow ${duration}ms ease${hoverLift ? ', translateY' : ''}`
    : 'none'

  const lines = [
    `.${cn} {`,
    '  position: relative;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    `  gap: ${toPx(Math.round(fontSize * 0.4))};`,
    `  padding: ${toPx(paddingY)} ${toPx(paddingX)};`,
    `  background: ${background};`,
    `  color: ${colorValue};`,
    `  border: ${border};`,
    `  border-radius: ${radius};`,
    `  box-shadow: ${shadow};`,
    `  font-size: ${toPx(fontSize)};`,
    `  font-weight: ${fontWeight};`,
    '  line-height: 1;',
    '  font-family: inherit;',
    '  text-align: center;',
    '  text-decoration: none;',
    '  white-space: nowrap;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    fullWidth ? '  width: 100%;' : null,
    duration > 0 ? `  transition: ${transitionProps};` : null,
    '}',
    '',
    `.${cn}:hover {`,
    `  background: ${hoverBackground};`,
    `  color: ${hoverColor};`,
    `  border: ${hoverBorder};`,
    `  box-shadow: ${hoverShadow};`,
    hoverLift ? '  transform: translateY(-2px);' : null,
    variant === 'solid' || variant === 'gradient' ? '  filter: brightness(0.95);' : null,
    '}',
    '',
    `.${cn}:active {`,
    activeScale < 1 ? `  transform: scale(${activeScale})${hoverLift ? ' translateY(-2px)' : ''};` : null,
    duration === 0 || activeScale >= 1 ? '  transform: none;' : null,
    '}',
    '',
    `.${cn}:focus-visible {`,
    `  outline: 2px solid ${color};`,
    '  outline-offset: 2px;',
    '}',
    '',
    `.${cn}:disabled,`,
    `.${cn}[aria-disabled="true"] {`,
    '  opacity: 0.6;',
    '  cursor: not-allowed;',
    '  box-shadow: none;',
    '  transform: none;',
    '  filter: none;',
    '}',
    '',
    `/* Ícones e spinner de loading do .${cn} */`,
    `.${cn} .${cn}__icon,`,
    `.${cn} .${cn}__spinner {`,
    '  flex-shrink: 0;',
    `  width: ${toPx(iconSize)};`,
    `  height: ${toPx(iconSize)};`,
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '}',
    '',
    `.${cn} .${cn}__icon svg,`,
    `.${cn} .${cn}__spinner svg {`,
    '  width: 100%;',
    '  height: 100%;',
    '}',
    '',
    `.${cn} .${cn}__spinner {`,
    '  animation: btn-spin 0.8s linear infinite;',
    '}',
    '',
    '@keyframes btn-spin {',
    '  to { transform: rotate(360deg); }',
    '}',
  ]

  return lines.filter((line) => line !== null).join('\n')
}

export function buildButtonHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'btn'
  const text = String(opts.text || 'Button').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const leftIcon = opts.leftIcon && opts.leftIcon !== 'none' ? ICON_SVGS[opts.leftIcon] : ''
  const rightIcon = opts.rightIcon && opts.rightIcon !== 'none' ? ICON_SVGS[opts.rightIcon] : ''
  const loading = !!opts.loading
  const disabled = !!opts.disabled

  const attrs = [`class="${cn}"`]
  if (disabled) attrs.push('disabled')
  if (loading) attrs.push('aria-busy="true"')

  const parts = [`<button ${attrs.join(' ')}>`]
  if (loading) parts.push(`  <span class="${cn}__spinner">${ICON_SVGS.spinner}</span>`)
  if (leftIcon) parts.push(`  <span class="${cn}__icon">${leftIcon}</span>`)
  parts.push(`  <span class="${cn}__text">${text}</span>`)
  if (rightIcon) parts.push(`  <span class="${cn}__icon">${rightIcon}</span>`)
  parts.push(`</button>`)

  return parts.join('\n')
}

export function buildButtonFullDemo(options = {}) {
  return `${buildButtonCss(options)}\n\n${buildButtonHtml(options)}`
}
