// Gerador de alert/notification CSS puro.
//
// Produz a classe .alert com variações filled, outlined, soft e subtle,
// ícone, título, mensagem, botão de fechar e animação de entrada.

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

const TYPE_COLORS = {
  info: '#1677ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
}

const ICON_SVGS = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
}

const DEFAULTS = {
  type: 'info',
  variant: 'filled',
  title: 'Did you know?',
  message: 'This alert was built with pure CSS — no JavaScript required for the styling.',
  showIcon: true,
  showClose: true,
  borderLeft: false,
  borderLeftWidth: 4,
  borderRadius: 8,
  padding: 16,
  gap: 12,
  fontSize: 14,
  iconSize: 22,
  titleFontWeight: 600,
  shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  animation: 'slide',
  animationDuration: 300,
  className: 'alert',
}

const PRESETS = {
  default: { ...DEFAULTS },
  info: {
    ...DEFAULTS,
    type: 'info',
    title: 'Information',
    message: 'This is an informational alert.',
  },
  success: {
    ...DEFAULTS,
    type: 'success',
    title: 'Success',
    message: 'Your changes have been saved successfully.',
  },
  warning: {
    ...DEFAULTS,
    type: 'warning',
    title: 'Warning',
    message: 'Please review your input before continuing.',
  },
  error: {
    ...DEFAULTS,
    type: 'error',
    title: 'Error',
    message: 'Something went wrong. Please try again later.',
  },
  outline: {
    ...DEFAULTS,
    variant: 'outlined',
    title: 'Outlined',
    message: 'A clean outlined alert for subtle emphasis.',
    shadow: 'none',
  },
  soft: {
    ...DEFAULTS,
    variant: 'soft',
    title: 'Soft',
    message: 'A soft background keeps the page breathable.',
    shadow: 'none',
  },
  subtle: {
    ...DEFAULTS,
    variant: 'subtle',
    title: 'Subtle',
    message: 'Minimal visual weight for low-priority messages.',
    shadow: 'none',
    borderLeft: true,
    borderLeftWidth: 3,
  },
  minimal: {
    ...DEFAULTS,
    variant: 'outlined',
    title: 'Minimal',
    message: 'No icon, no shadow, just a thin border.',
    showIcon: false,
    showClose: false,
    shadow: 'none',
    borderRadius: 4,
  },
}

export { DEFAULTS, PRESETS, ICON_SVGS, TYPE_COLORS }

export function buildAlertCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'alert'
  const type = opts.type || 'info'
  const variant = opts.variant || 'filled'
  const color = TYPE_COLORS[type] || opts.color || '#1677ff'
  const borderRadius = clamp(Number(opts.borderRadius) || 8, 0, 32)
  const padding = clamp(Number(opts.padding) || 16, 0, 48)
  const gap = clamp(Number(opts.gap) || 12, 0, 32)
  const fontSize = clamp(Number(opts.fontSize) || 14, 10, 32)
  const iconSize = clamp(Number(opts.iconSize) || 22, 12, 64)
  const titleFontWeight = clamp(Number(opts.titleFontWeight) || 600, 100, 900)
  const borderLeftWidth = clamp(Number(opts.borderLeftWidth) || 4, 0, 16)
  const shadow = opts.shadow || 'none'
  const animation = opts.animation || 'none'
  const duration = clamp(Number(opts.animationDuration) || 300, 0, 2000)
  const showClose = !!opts.showClose

  let background
  let textColor
  let border
  let iconColor

  if (variant === 'outlined') {
    background = 'transparent'
    textColor = color
    border = `1px solid ${color}`
    iconColor = color
  } else if (variant === 'soft') {
    background = rgba(color, 0.15)
    textColor = color
    border = 'none'
    iconColor = color
  } else if (variant === 'subtle') {
    background = rgba(color, 0.06)
    textColor = '#262626'
    border = 'none'
    iconColor = color
  } else {
    // filled
    background = color
    textColor = autoTextColor(color)
    border = 'none'
    iconColor = textColor
  }

  const borderLeft = opts.borderLeft && borderLeftWidth > 0
    ? `${toPx(borderLeftWidth)} solid ${color}`
    : 'none'

  const animationClass = animation !== 'none' ? ` ${cn}--${animation}` : ''

  const lines = [
    `.${cn} {`,
    '  position: relative;',
    '  display: flex;',
    '  align-items: flex-start;',
    `  gap: ${toPx(gap)};`,
    `  padding: ${toPx(padding)};`,
    `  background: ${background};`,
    `  color: ${textColor};`,
    `  border: ${border};`,
    `  border-left: ${borderLeft};`,
    `  border-radius: ${toPx(borderRadius)};`,
    `  box-shadow: ${shadow};`,
    `  font-size: ${toPx(fontSize)};`,
    '  line-height: 1.5;',
    '  font-family: inherit;',
    '  text-align: left;',
    animation !== 'none' && duration > 0 ? `  animation: ${cn}-${animation} ${duration}ms ease-out;` : null,
    '  --alert-color: ' + color + ';',
    '}',
    '',
    `.${cn}__icon {`,
    '  flex-shrink: 0;',
    `  width: ${toPx(iconSize)};`,
    `  height: ${toPx(iconSize)};`,
    `  color: ${iconColor};`,
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  margin-top: 0.1em;',
    '}',
    '',
    `.${cn}__icon svg {`,
    '  width: 100%;',
    '  height: 100%;',
    '}',
    '',
    `.${cn}__content {`,
    '  flex: 1 1 auto;',
    '  min-width: 0;',
    '}',
    '',
    `.${cn}__title {`,
    '  display: block;',
    `  font-weight: ${titleFontWeight};`,
    `  margin-bottom: ${toPx(Math.max(2, Math.round(fontSize * 0.15)))};`,
    '}',
    '',
    `.${cn}__message {`,
    '  margin: 0;',
    '  opacity: 0.9;',
    '}',
    '',
  ]

  if (showClose) {
    lines.push(
      `.${cn}__close {`,
      '  flex-shrink: 0;',
      `  width: ${toPx(Math.round(iconSize * 0.9))};`,
      `  height: ${toPx(Math.round(iconSize * 0.9))};`,
      '  padding: 0;',
      '  margin: 0;',
      '  border: none;',
      '  background: transparent;',
      `  color: ${textColor};`,
      '  cursor: pointer;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  opacity: 0.6;',
      '  transition: opacity 150ms ease;',
      '}',
      '',
      `.${cn}__close:hover {`,
      '  opacity: 1;',
      '}',
      '',
      `.${cn}__close svg {`,
      '  width: 100%;',
      '  height: 100%;',
      '}',
      ''
    )
  }

  if (animation !== 'none' && duration > 0) {
    if (animation === 'fade') {
      lines.push(
        `@keyframes ${cn}-fade {`,
        '  from { opacity: 0; }',
        '  to { opacity: 1; }',
        '}',
        ''
      )
    } else if (animation === 'slide') {
      lines.push(
        `@keyframes ${cn}-slide {`,
        '  from { opacity: 0; transform: translateY(-12px); }',
        '  to { opacity: 1; transform: translateY(0); }',
        '}',
        ''
      )
    } else if (animation === 'scale') {
      lines.push(
        `@keyframes ${cn}-scale {`,
        '  from { opacity: 0; transform: scale(0.96); }',
        '  to { opacity: 1; transform: scale(1); }',
        '}',
        ''
      )
    }
  }

  return lines.filter((line) => line !== null).join('\n')
}

export function buildAlertHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'alert'
  const type = opts.type || 'info'
  const title = String(opts.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const message = String(opts.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const showIcon = !!opts.showIcon
  const showClose = !!opts.showClose

  const parts = [`<div class="${cn} ${cn}--${type}" role="alert">`]
  if (showIcon) parts.push(`  <span class="${cn}__icon" aria-hidden="true">${ICON_SVGS[type]}</span>`)
  parts.push(`  <div class="${cn}__content">`)
  if (title) parts.push(`    <strong class="${cn}__title">${title}</strong>`)
  if (message) parts.push(`    <p class="${cn}__message">${message}</p>`)
  parts.push('  </div>')
  if (showClose) {
    parts.push(`  <button type="button" class="${cn}__close" aria-label="Close">`)
    parts.push(`    ${ICON_SVGS.close}`)
    parts.push(`  </button>`)
  }
  parts.push('</div>')

  return parts.join('\n')
}

export function buildAlertFullDemo(options = {}) {
  return `${buildAlertCss(options)}\n\n${buildAlertHtml(options)}`
}
