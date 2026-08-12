// Gerador de radio button customizado CSS puro.
//
// Usa o mesmo truque do checkbox: esconde o input real e estiliza um span
// decorativo como a bolha do radio. O marcador é desenhado no ::after do
// span e só aparece quando input:checked + .radio-box dispara.

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
  size: 24,
  borderRadius: 50,
  activeColor: '#1677ff',
  inactiveColor: '#ffffff',
  markerColor: '#1677ff',
  borderColor: '#d9d9d9',
  borderWidth: 2,
  markerSize: 42,
  markerStyle: 'dot',
  transitionDuration: 180,
  shadow: 'none',
}

const PRESETS = {
  default: {
    size: 24,
    borderRadius: 50,
    activeColor: '#1677ff',
    inactiveColor: '#ffffff',
    markerColor: '#1677ff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    markerSize: 42,
    markerStyle: 'dot',
    transitionDuration: 180,
    shadow: 'none',
  },
  minimal: {
    size: 20,
    borderRadius: 50,
    activeColor: 'transparent',
    inactiveColor: 'transparent',
    markerColor: '#1677ff',
    borderColor: '#8c8c8c',
    borderWidth: 2,
    markerSize: 50,
    markerStyle: 'dot',
    transitionDuration: 160,
    shadow: 'none',
  },
  ring: {
    size: 26,
    borderRadius: 50,
    activeColor: '#ffffff',
    inactiveColor: '#ffffff',
    markerColor: '#52c41a',
    borderColor: '#b7eb8f',
    borderWidth: 3,
    markerSize: 60,
    markerStyle: 'ring',
    transitionDuration: 200,
    shadow: '0 2px 4px rgba(82,196,26,0.25)',
  },
  square: {
    size: 22,
    borderRadius: 6,
    activeColor: '#000000',
    inactiveColor: '#ffffff',
    markerColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    markerSize: 40,
    markerStyle: 'dot',
    transitionDuration: 150,
    shadow: 'none',
  },
  check: {
    size: 24,
    borderRadius: 50,
    activeColor: '#fa8c16',
    inactiveColor: '#ffffff',
    markerColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    markerSize: 55,
    markerStyle: 'check',
    transitionDuration: 180,
    shadow: 'none',
  },
}

export { PRESETS, DEFAULTS }

export function buildRadioButtonCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const size = clamp(Number(opts.size) || DEFAULTS.size, 12, 96)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, 50)
  const active = parseColor(opts.activeColor)
  const inactive = parseColor(opts.inactiveColor)
  const marker = parseColor(opts.markerColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || DEFAULTS.borderWidth, 0, 12)
  const markerSize = clamp(Number(opts.markerSize) || DEFAULTS.markerSize, 10, 90)
  const markerStyle = opts.markerStyle || 'dot'
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 2000)
  const shadow = opts.shadow || 'none'
  const radius = borderRadius >= 50 ? '50%' : toPx(borderRadius)

  const markerPx = Math.round(size * (markerSize / 100))

  const lines = [
    '/* Container alinha input + label */',
    '.custom-radio {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '',
    '/* Esconde o radio real mas mantém acessibilidade */',
    '.custom-radio input {',
    '  position: absolute;',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '}',
    '',
    '/* Bolha visual */',
    '.custom-radio .radio-box {',
    `  position: relative;`,
    `  width: ${toPx(size)};`,
    `  height: ${toPx(size)};`,
    `  background: ${inactive};`,
    `  border: ${borderWidth > 0 ? `${toPx(borderWidth)} solid ${border}` : 'none'};`,
    `  border-radius: ${radius};`,
    `  box-shadow: ${shadow};`,
    `  transition: background ${duration}ms ease, border-color ${duration}ms ease, box-shadow ${duration}ms ease;`,
    '  flex-shrink: 0;',
    '}',
    '',
    '/* Hover na bolha */',
    '.custom-radio:hover .radio-box {',
    `  border-color: ${active};`,
    '}',
    '',
    '/* Estado checked: fundo e borda ativos */',
    '.custom-radio input:checked + .radio-box {',
    `  background: ${active};`,
    borderWidth > 0 ? `  border-color: ${active};` : null,
    '}',
  ]

  if (markerStyle === 'dot') {
    lines.push(
      '',
      '/* Marcador como círculo sólido no centro */',
      '.custom-radio .radio-box::after {',
      '  content: "";',
      '  position: absolute;',
      '  display: block;',
      `  width: ${toPx(markerPx)};`,
      `  height: ${toPx(markerPx)};`,
      `  background: ${marker};`,
      '  border-radius: 50%;',
      '  left: 50%;',
      '  top: 50%;',
      '  transform: translate(-50%, -50%) scale(0);',
      '  transform-origin: center;',
      `  transition: transform ${duration}ms ease;`,
      '}',
      '',
      '.custom-radio input:checked + .radio-box::after {',
      '  transform: translate(-50%, -50%) scale(1);',
      '}'
    )
  } else if (markerStyle === 'ring') {
    lines.push(
      '',
      '/* Marcador como anel interno */',
      '.custom-radio .radio-box::after {',
      '  content: "";',
      '  position: absolute;',
      '  display: block;',
      `  width: ${toPx(markerPx)};`,
      `  height: ${toPx(markerPx)};`,
      '  background: transparent;',
      `  border: ${toPx(Math.max(2, Math.round(markerPx * 0.18)))} solid ${marker};`,
      '  border-radius: 50%;',
      '  left: 50%;',
      '  top: 50%;',
      '  transform: translate(-50%, -50%) scale(0);',
      '  transform-origin: center;',
      `  transition: transform ${duration}ms ease;`,
      '}',
      '',
      '.custom-radio input:checked + .radio-box::after {',
      '  transform: translate(-50%, -50%) scale(1);',
      '}'
    )
  } else if (markerStyle === 'check') {
    lines.push(
      '',
      '/* Marcador como check centralizado */',
      '.custom-radio .radio-box::after {',
      '  content: "";',
      '  position: absolute;',
      '  display: block;',
      `  left: ${toPx(size * 0.22)};`,
      `  top: ${toPx(size * 0.25)};`,
      `  width: ${toPx(size * 0.22)};`,
      `  height: ${toPx(size * 0.42)};`,
      '  border: solid transparent;',
      `  border-width: 0 ${toPx(Math.max(2, Math.round(size * 0.1)))} ${toPx(Math.max(2, Math.round(size * 0.1)))} 0;`,
      `  border-color: transparent transparent ${marker} ${marker};`,
      '  transform: rotate(45deg) scale(0);',
      '  transform-origin: center;',
      `  transition: transform ${duration}ms ease;`,
      '}',
      '',
      '.custom-radio input:checked + .radio-box::after {',
      '  transform: rotate(45deg) scale(1);',
      '}'
    )
  }

  lines.push(
    '',
    '/* Foco via teclado */',
    '.custom-radio input:focus-visible + .radio-box {',
    `  outline: 2px solid ${active};`,
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Estado desabilitado */',
    '.custom-radio input:disabled + .radio-box,',
    '.custom-radio input:disabled ~ .label-text {',
    '  opacity: 0.55;',
    '  cursor: not-allowed;',
    '}',
    '',
    '/* Texto ao lado */',
    '.custom-radio .label-text {',
    '  font-size: 14px;',
    '  color: #262626;',
    '  line-height: 1.4;',
    '}'
  )

  return lines.filter(Boolean).join('\n')
}

export function buildRadioButtonHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const checkedAttr = opts.checked ? ' checked' : ''
  const disabledAttr = opts.disabled ? ' disabled' : ''
  const nameAttr = opts.name ? ` name="${opts.name}"` : ' name="custom-radio"'
  const valueAttr = opts.value ? ` value="${opts.value}"` : ''
  const labelText = String(opts.labelText || '')

  return [
    '<label class="custom-radio">',
    `  <input type="radio"${nameAttr}${valueAttr}${checkedAttr}${disabledAttr}>`,
    '  <span class="radio-box"></span>',
    labelText ? `  <span class="label-text">${labelText}</span>` : '',
    '</label>',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildRadioButtonFullDemo(options = {}) {
  return `${buildRadioButtonCss(options)}\n\n${buildRadioButtonHtml(options)}`
}
