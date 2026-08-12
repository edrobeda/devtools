// Gerador de checkbox customizado CSS puro.
//
// Usa o truque clássico: esconde o input real com opacity/clip e estiliza o
// pseudo-elemento ::before do label (ou do span decorativo) como a caixa. O
// estado checked desenha o "check" via ::after com clip-path, transform ou
// bordas em L.

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
  style: 'rounded',
  size: 24,
  borderRadius: 6,
  activeColor: '#1677ff',
  inactiveColor: '#ffffff',
  checkColor: '#ffffff',
  borderColor: '#d9d9d9',
  borderWidth: 2,
  checkWidth: 3,
  transitionDuration: 180,
  checkStyle: 'check',
  shadow: 'none',
}

const PRESETS = {
  rounded: {
    style: 'rounded',
    size: 24,
    borderRadius: 6,
    activeColor: '#1677ff',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 180,
    checkStyle: 'check',
    shadow: 'none',
  },
  circle: {
    style: 'circle',
    size: 26,
    borderRadius: 50,
    activeColor: '#52c41a',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#b7eb8f',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 200,
    checkStyle: 'check',
    shadow: '0 2px 4px rgba(82,196,26,0.25)',
  },
  square: {
    style: 'square',
    size: 22,
    borderRadius: 0,
    activeColor: '#000000',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 150,
    checkStyle: 'check',
    shadow: 'none',
  },
  minimal: {
    style: 'rounded',
    size: 20,
    borderRadius: 4,
    activeColor: 'transparent',
    inactiveColor: 'transparent',
    checkColor: '#1677ff',
    borderColor: '#8c8c8c',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 160,
    checkStyle: 'check',
    shadow: 'none',
  },
  dash: {
    style: 'rounded',
    size: 24,
    borderRadius: 6,
    activeColor: '#faad14',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 180,
    checkStyle: 'dash',
    shadow: 'none',
  },
}

export { PRESETS, DEFAULTS }

export function buildCustomCheckboxCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const size = clamp(Number(opts.size) || DEFAULTS.size, 12, 96)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, size / 2)
  const active = parseColor(opts.activeColor)
  const inactive = parseColor(opts.inactiveColor)
  const check = parseColor(opts.checkColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || DEFAULTS.borderWidth, 0, 12)
  const checkWidth = clamp(Number(opts.checkWidth) || DEFAULTS.checkWidth, 1, 12)
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 2000)
  const shadow = opts.shadow || 'none'
  const style = opts.style || 'rounded'
  const checkStyle = opts.checkStyle || 'check'

  const radius = style === 'circle' ? '50%' : toPx(borderRadius)

  const lines = [
    '/* Container alinha input + label */',
    '.custom-checkbox {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '',
    '/* Esconde o checkbox real mas mantém acessibilidade */',
    '.custom-checkbox input {',
    '  position: absolute;',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '}',
    '',
    '/* Caixa visual */',
    '.custom-checkbox .box {',
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
    '/* Hover na caixa */',
    '.custom-checkbox:hover .box {',
    `  border-color: ${active};`,
    '}',
    '',
    '/* Estado checked: fundo e borda ativos */',
    '.custom-checkbox input:checked + .box {',
    `  background: ${active};`,
    borderWidth > 0 ? `  border-color: ${active};` : null,
    '}',
  ]

  if (checkStyle === 'check') {
    lines.push(
      '',
      '/* Símbolo de check em L usando bordas */',
      '.custom-checkbox .box::after {',
      '  content: "";',
      '  position: absolute;',
      '  display: block;',
      `  left: ${toPx(size * 0.18)};`,
      `  top: ${toPx(size * 0.22)};`,
      `  width: ${toPx(size * 0.22)};`,
      `  height: ${toPx(size * 0.45)};`,
      '  border: solid transparent;',
      `  border-width: 0 ${toPx(checkWidth)} ${toPx(checkWidth)} 0;`,
      `  border-color: transparent transparent ${check} ${check};`,
      '  transform: rotate(45deg) scale(0);',
      '  transform-origin: center;',
      `  transition: transform ${duration}ms ease;`,
      '}',
      '',
      '.custom-checkbox input:checked + .box::after {',
      '  transform: rotate(45deg) scale(1);',
      '}'
    )
  } else {
    lines.push(
      '',
      '/* Símbolo de traço (dash) */',
      '.custom-checkbox .box::after {',
      '  content: "";',
      '  position: absolute;',
      '  display: block;',
      `  left: ${toPx(size * 0.18)};`,
      `  top: 50%;`,
      `  width: ${toPx(size * 0.55)};`,
      `  height: ${toPx(checkWidth)};`,
      `  background: ${check};`,
      '  border-radius: 999px;',
      '  transform: translateY(-50%) scaleX(0);',
      '  transform-origin: left center;',
      `  transition: transform ${duration}ms ease;`,
      '}',
      '',
      '.custom-checkbox input:checked + .box::after {',
      '  transform: translateY(-50%) scaleX(1);',
      '}'
    )
  }

  lines.push(
    '',
    '/* Foco via teclado */',
    '.custom-checkbox input:focus-visible + .box {',
    `  outline: 2px solid ${active};`,
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Estado desabilitado */',
    '.custom-checkbox input:disabled + .box,',
    '.custom-checkbox input:disabled ~ .label-text {',
    '  opacity: 0.55;',
    '  cursor: not-allowed;',
    '}',
    '',
    '/* Texto ao lado */',
    '.custom-checkbox .label-text {',
    '  font-size: 14px;',
    '  color: #262626;',
    '  line-height: 1.4;',
    '}'
  )

  return lines.filter(Boolean).join('\n')
}

export function buildCustomCheckboxHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const checkedAttr = opts.checked ? ' checked' : ''
  const disabledAttr = opts.disabled ? ' disabled' : ''
  const labelText = String(opts.labelText || '')

  return [
    '<label class="custom-checkbox">',
    `  <input type="checkbox"${checkedAttr}${disabledAttr}>`,
    '  <span class="box"></span>',
    labelText ? `  <span class="label-text">${labelText}</span>` : '',
    '</label>',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildCustomCheckboxFullDemo(options = {}) {
  return `${buildCustomCheckboxCss(options)}\n\n${buildCustomCheckboxHtml(options)}`
}
