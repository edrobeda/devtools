// Gerador de toggle switch CSS puro (checkbox + label).
//
// Usa o truque clássico: esconde o input real, estiliza o label como a
// "trilha" e o pseudo-elemento ::after do label como o "thumb". O estado
// checked movimenta o thumb via input:checked + label::after.

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

const DEFAULTS = {
  style: 'ios',
  width: 52,
  height: 28,
  activeColor: '#34c759',
  inactiveColor: '#e5e5ea',
  thumbColor: '#ffffff',
  borderColor: 'transparent',
  borderWidth: 0,
  thumbShadow: '0 2px 4px rgba(0,0,0,0.25)',
  transitionDuration: 250,
  showLabels: false,
  labelOn: '',
  labelOff: '',
  disabled: false,
  checked: false,
}

const PRESETS = {
  ios: {
    width: 52,
    height: 28,
    activeColor: '#34c759',
    inactiveColor: '#e5e5ea',
    thumbColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    thumbShadow: '0 2px 4px rgba(0,0,0,0.25)',
    transitionDuration: 250,
    showLabels: false,
  },
  material: {
    width: 48,
    height: 24,
    activeColor: '#6200ee',
    inactiveColor: '#b0b0b0',
    thumbColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    thumbShadow: '0 1px 3px rgba(0,0,0,0.35)',
    transitionDuration: 200,
    showLabels: false,
  },
  rounded: {
    width: 60,
    height: 30,
    activeColor: '#1677ff',
    inactiveColor: '#d9d9d9',
    thumbColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    thumbShadow: '0 2px 6px rgba(0,0,0,0.2)',
    transitionDuration: 200,
    showLabels: true,
    labelOn: 'ON',
    labelOff: 'OFF',
  },
  square: {
    width: 56,
    height: 28,
    activeColor: '#52c41a',
    inactiveColor: '#f0f0f0',
    thumbColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 1,
    thumbShadow: 'none',
    transitionDuration: 150,
    showLabels: false,
  },
}

export { PRESETS, DEFAULTS }

export function buildToggleSwitchCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const style = opts.style || 'ios'
  const width = clamp(Number(opts.width) || DEFAULTS.width, 24, 200)
  const height = clamp(Number(opts.height) || DEFAULTS.height, 12, 100)
  const padding = Math.max(2, Math.round(height * 0.08))
  const thumbSize = height - padding * 2
  const travel = width - thumbSize - padding * 2
  const trackRadius = style === 'square' ? Math.min(4, Math.round(height * 0.15)) : height / 2
  const thumbRadius = style === 'square' ? Math.min(2, Math.round(thumbSize * 0.12)) : thumbSize / 2

  const active = parseColor(opts.activeColor)
  const inactive = parseColor(opts.inactiveColor)
  const thumb = parseColor(opts.thumbColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || 0, 0, 8)
  const duration = clamp(Number(opts.transitionDuration) || 200, 0, 2000)
  const shadow = opts.thumbShadow || 'none'
  const disabled = Boolean(opts.disabled)

  const showLabels = Boolean(opts.showLabels) && (style === 'rounded' || style === 'square')
  const labelOn = String(opts.labelOn || '')
  const labelOff = String(opts.labelOff || '')

  const innerTrackHeight = height - borderWidth * 2
  const innerTrackWidth = width - borderWidth * 2
  const innerThumbSize = thumbSize - borderWidth * 2

  const lines = [
    '/* Container alinha input + label */',
    '.toggle-switch {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '',
    '/* Esconde o checkbox real mas mantém acessibilidade */',
    '.toggle-switch input {',
    '  position: absolute;',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '}',
    '',
    '/* Track (a "trilha" visual) */',
    '.toggle-switch .track {',
    `  position: relative;`,
    `  width: ${toPx(width)};`,
    `  height: ${toPx(height)};`,
    `  background: ${inactive};`,
    `  border: ${borderWidth > 0 ? `${toPx(borderWidth)} solid ${border}` : 'none'};`,
    `  border-radius: ${toPx(trackRadius)};`,
    `  transition: background ${duration}ms ease, border-color ${duration}ms ease;`,
    `  ${disabled ? 'opacity: 0.6; cursor: not-allowed;' : 'cursor: pointer;'}`,
    '}',
    '',
    '/* Thumb (o "botão" deslizante) */',
    '.toggle-switch .track::after {',
    '  content: "";',
    `  position: absolute;`,
    `  top: ${toPx(padding)};`,
    `  left: ${toPx(padding)};`,
    `  width: ${toPx(thumbSize)};`,
    `  height: ${toPx(thumbSize)};`,
    `  background: ${thumb};`,
    `  border-radius: ${toPx(thumbRadius)};`,
    `  box-shadow: ${shadow};`,
    `  transition: transform ${duration}ms ease, background ${duration}ms ease;`,
    '}',
  ]

  if (showLabels) {
    lines.push(
      '',
      '/* Labels ON/OFF dentro da trilha */',
      '.toggle-switch .track::before {',
      '  content: attr(data-off);',
      `  position: absolute;`,
      `  inset: 0;`,
      `  display: flex;`,
      `  align-items: center;`,
      `  justify-content: center;`,
      `  padding: 0 ${toPx(Math.max(4, Math.round(thumbSize * 0.35)))};`,
      `  font-size: ${toPx(Math.max(8, Math.round(height * 0.35)))};`,
      `  font-weight: 700;`,
      `  color: ${inactive};`,
      `  letter-spacing: 0.02em;`,
      `  transition: color ${duration}ms ease;`,
      `  white-space: nowrap;`,
      '}'
    )
  }

  lines.push(
    '',
    '/* Estado checked */',
    '.toggle-switch input:checked + .track {',
    `  background: ${active};`,
    borderWidth > 0 ? `  border-color: ${active};` : null,
    '}',
    '',
    '.toggle-switch input:checked + .track::after {',
    `  transform: translateX(${toPx(travel)});`,
    '}'
  )

  if (showLabels) {
    lines.push(
      '',
      '.toggle-switch input:checked + .track::before {',
      `  content: attr(data-on);`,
      `  color: ${thumb};`,
      '}'
    )
  }

  lines.push(
    '',
    '/* Foco via teclado */',
    '.toggle-switch input:focus-visible + .track {',
    `  outline: 2px solid ${active};`,
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Estado desabilitado */',
    '.toggle-switch input:disabled + .track {',
    '  opacity: 0.55;',
    '  cursor: not-allowed;',
    '}',
    '',
    '/* Texto auxiliar ao lado */',
    '.toggle-switch .label-text {',
    '  font-size: 14px;',
    '  color: #262626;',
    '}'
  )

  return lines.filter(Boolean).join('\n')
}

export function buildToggleSwitchHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const showLabels = Boolean(opts.showLabels) && (opts.style === 'rounded' || opts.style === 'square')
  const labelOn = String(opts.labelOn || '')
  const labelOff = String(opts.labelOff || '')
  const labelText = String(opts.labelText || '')
  const checkedAttr = opts.checked ? ' checked' : ''
  const disabledAttr = opts.disabled ? ' disabled' : ''
  const dataAttrs = showLabels
    ? ` data-on="${labelOn}" data-off="${labelOff}"`
    : ''

  return [
    '<label class="toggle-switch">',
    `  <input type="checkbox" role="switch"${checkedAttr}${disabledAttr}>`,
    `  <span class="track"${dataAttrs}></span>`,
    labelText ? `  <span class="label-text">${labelText}</span>` : '',
    '</label>',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildToggleSwitchFullDemo(options = {}) {
  return `${buildToggleSwitchCss(options)}\n\n${buildToggleSwitchHtml(options)}`
}
