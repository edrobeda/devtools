// Gerador de ícone hambúrguer CSS puro (checkbox + label).
//
// Três barras horizontais dentro de um botão; ao marcar o checkbox elas
// transformam em X, seta para a esquerda/direita ou traço (minus) usando
// apenas transições CSS.

function parseColor(color) {
  if (!color) return '#333333'
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
  animation: 'x',
  width: 32,
  barHeight: 4,
  gap: 6,
  barRadius: 2,
  color: '#333333',
  activeColor: '#333333',
  background: 'transparent',
  padding: 8,
  buttonBorderRadius: 4,
  borderWidth: 0,
  borderColor: '#d9d9d9',
  transitionDuration: 250,
  easing: 'ease',
  hoverScale: 1,
  ariaLabel: '',
  checked: false,
}

const PRESETS = {
  default: {
    animation: 'x',
    width: 32,
    barHeight: 4,
    gap: 6,
    barRadius: 2,
    color: '#333333',
    activeColor: '#333333',
    background: 'transparent',
    padding: 8,
    buttonBorderRadius: 4,
    borderWidth: 0,
    borderColor: '#d9d9d9',
    transitionDuration: 250,
    easing: 'ease',
    hoverScale: 1,
  },
  minimal: {
    animation: 'x',
    width: 24,
    barHeight: 2,
    gap: 5,
    barRadius: 1,
    color: '#000000',
    activeColor: '#000000',
    background: 'transparent',
    padding: 6,
    buttonBorderRadius: 0,
    borderWidth: 0,
    borderColor: '#d9d9d9',
    transitionDuration: 200,
    easing: 'ease-in-out',
    hoverScale: 1,
  },
  thick: {
    animation: 'x',
    width: 40,
    barHeight: 6,
    gap: 8,
    barRadius: 3,
    color: '#262626',
    activeColor: '#1677ff',
    background: '#f0f0f0',
    padding: 10,
    buttonBorderRadius: 8,
    borderWidth: 0,
    borderColor: '#d9d9d9',
    transitionDuration: 300,
    easing: 'ease',
    hoverScale: 1.05,
  },
  rounded: {
    animation: 'x',
    width: 36,
    barHeight: 5,
    gap: 6,
    barRadius: 4,
    color: '#595959',
    activeColor: '#52c41a',
    background: '#ffffff',
    padding: 10,
    buttonBorderRadius: 50,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    transitionDuration: 250,
    easing: 'ease',
    hoverScale: 1.05,
  },
  'arrow-left': {
    animation: 'arrow-left',
    width: 32,
    barHeight: 4,
    gap: 6,
    barRadius: 2,
    color: '#333333',
    activeColor: '#1677ff',
    background: 'transparent',
    padding: 8,
    buttonBorderRadius: 4,
    borderWidth: 0,
    borderColor: '#d9d9d9',
    transitionDuration: 280,
    easing: 'ease-in-out',
    hoverScale: 1,
  },
  'arrow-right': {
    animation: 'arrow-right',
    width: 32,
    barHeight: 4,
    gap: 6,
    barRadius: 2,
    color: '#333333',
    activeColor: '#1677ff',
    background: 'transparent',
    padding: 8,
    buttonBorderRadius: 4,
    borderWidth: 0,
    borderColor: '#d9d9d9',
    transitionDuration: 280,
    easing: 'ease-in-out',
    hoverScale: 1,
  },
  minus: {
    animation: 'minus',
    width: 32,
    barHeight: 4,
    gap: 6,
    barRadius: 2,
    color: '#333333',
    activeColor: '#333333',
    background: 'transparent',
    padding: 8,
    buttonBorderRadius: 4,
    borderWidth: 0,
    borderColor: '#d9d9d9',
    transitionDuration: 250,
    easing: 'ease',
    hoverScale: 1,
  },
}

export { PRESETS, DEFAULTS }

export function buildHamburgerCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const animation = opts.animation || 'x'
  const width = clamp(Number(opts.width) || DEFAULTS.width, 12, 120)
  const barHeight = clamp(Number(opts.barHeight) || DEFAULTS.barHeight, 1, 30)
  const gap = clamp(Number(opts.gap) || DEFAULTS.gap, 0, 60)
  const barRadius = clamp(Number(opts.barRadius) || DEFAULTS.barRadius, 0, barHeight / 2)
  const padding = clamp(Number(opts.padding) || DEFAULTS.padding, 0, 40)
  const buttonBorderRadius = clamp(Number(opts.buttonBorderRadius) || DEFAULTS.buttonBorderRadius, 0, 200)
  const borderWidth = clamp(Number(opts.borderWidth) || DEFAULTS.borderWidth, 0, 10)
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 2000)
  const easing = opts.easing || 'ease'
  const hoverScale = Number(opts.hoverScale) || 1

  const color = parseColor(opts.color)
  const activeColor = parseColor(opts.activeColor || opts.color)
  const background = parseColor(opts.background)
  const borderColor = parseColor(opts.borderColor)

  const linesWidth = width
  const linesHeight = barHeight * 3 + gap * 2
  const boxWidth = linesWidth + padding * 2
  const boxHeight = linesHeight + padding * 2
  const centerOffset = gap + barHeight // distância do centro de uma barra extrema ao centro da barra do meio

  const borderRule =
    borderWidth > 0
      ? `${toPx(borderWidth)} solid ${borderColor}`
      : 'none'

  const lines = [
    '/* Container clicável */',
    '.hamburger {',
    '  display: inline-block;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '',
    '/* Checkbox invisível mas acessível */',
    '.hamburger input {',
    '  position: absolute;',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '  pointer-events: none;',
    '}',
    '',
    '/* Botão ao redor das barras */',
    '.hamburger-box {',
    `  position: relative;`,
    `  display: flex;`,
    `  align-items: center;`,
    `  justify-content: center;`,
    `  width: ${toPx(boxWidth)};`,
    `  height: ${toPx(boxHeight)};`,
    `  background: ${background};`,
    `  border: ${borderRule};`,
    `  border-radius: ${toPx(buttonBorderRadius)};`,
    `  transition: transform ${duration}ms ${easing};`,
    '}',
    '',
    '/* Foco via teclado no botão */',
    '.hamburger input:focus-visible ~ .hamburger-box {',
    `  outline: 2px solid ${activeColor};`,
    '  outline-offset: 2px;',
    '}',
  ]

  if (hoverScale > 1 && hoverScale <= 2) {
    lines.push(
      '',
      '/* Efeito hover no botão */',
      '.hamburger:hover .hamburger-box {',
      `  transform: scale(${hoverScale.toFixed(2)});`,
      '}'
    )
  }

  lines.push(
    '',
    '/* Área das três barras */',
    '.hamburger-lines {',
    `  position: relative;`,
    `  width: ${toPx(linesWidth)};`,
    `  height: ${toPx(linesHeight)};`,
    '}',
    '',
    '/* Cada barra */',
    '.hamburger-line {',
    `  position: absolute;`,
    `  left: 0;`,
    `  width: 100%;`,
    `  height: ${toPx(barHeight)};`,
    `  background: ${color};`,
    `  border-radius: ${toPx(barRadius)};`,
    `  transition: all ${duration}ms ${easing};`,
    `  transform-origin: center;`,
    '}',
    '',
    '.hamburger-line:nth-child(1) {',
    '  top: 0;',
    '}',
    '',
    `.hamburger-line:nth-child(2) {`,
    `  top: ${toPx(barHeight + gap)};`,
    '}',
    '',
    `.hamburger-line:nth-child(3) {`,
    `  top: ${toPx((barHeight + gap) * 2)};`,
    '}'
  )

  const offset = toPx(centerOffset)

  if (animation === 'x') {
    lines.push(
      '',
      '/* Animação para X */',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(1) {',
      `  transform: translateY(${offset}) rotate(45deg);`,
      `  background: ${activeColor};`,
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(2) {',
      '  opacity: 0;',
      '  transform: scale(0);',
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(3) {',
      `  transform: translateY(-${offset}) rotate(-45deg);`,
      `  background: ${activeColor};`,
    '}'
    )
  } else if (animation === 'arrow-left') {
    lines.push(
      '',
      '/* Animação para seta à esquerda */',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(1) {',
      `  transform: translateY(${offset}) rotate(45deg);`,
      `  background: ${activeColor};`,
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(2) {',
      `  transform: translateX(-25%) scaleX(0.5);`,
      `  background: ${activeColor};`,
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(3) {',
      `  transform: translateY(-${offset}) rotate(-45deg);`,
      `  background: ${activeColor};`,
    '}'
    )
  } else if (animation === 'arrow-right') {
    lines.push(
      '',
      '/* Animação para seta à direita */',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(1) {',
      `  transform: translateY(${offset}) rotate(-45deg);`,
      `  background: ${activeColor};`,
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(2) {',
      `  transform: translateX(25%) scaleX(0.5);`,
      `  background: ${activeColor};`,
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(3) {',
      `  transform: translateY(-${offset}) rotate(45deg);`,
      `  background: ${activeColor};`,
    '}'
    )
  } else if (animation === 'minus') {
    lines.push(
      '',
      '/* Animação para traço (minus) */',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(1) {',
      `  transform: translateY(${offset});`,
      '  opacity: 0;',
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(3) {',
      `  transform: translateY(-${offset});`,
      '  opacity: 0;',
    '}',
      '.hamburger input:checked ~ .hamburger-box .hamburger-line:nth-child(2) {',
      `  background: ${activeColor};`,
    '}'
    )
  }

  return lines.join('\n')
}

export function buildHamburgerHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const checkedAttr = opts.checked ? ' checked' : ''
  const ariaLabel = String(opts.ariaLabel || '').trim()
  const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : ''

  return [
    '<label class="hamburger"' + (ariaLabel ? ` aria-label="${ariaLabel}">` : '>'),
    `  <input type="checkbox"${checkedAttr}>`,
    '  <span class="hamburger-box">',
    '    <span class="hamburger-lines">',
    '      <span class="hamburger-line"></span>',
    '      <span class="hamburger-line"></span>',
    '      <span class="hamburger-line"></span>',
    '    </span>',
    '  </span>',
    '</label>',
  ].join('\n')
}

export function buildHamburgerFullDemo(options = {}) {
  return `${buildHamburgerCss(options)}\n\n${buildHamburgerHtml(options)}`
}
