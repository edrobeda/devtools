// Gerador de segmented control CSS puro.
//
// Usa radio buttons escondidos + labels clicaveis e um indicador deslizante
// posicionado absolutamente. A posicao do indicador e trocada com :has()
// conforme o input checked, produzindo a animacao de slide.

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
  options: ['Opcao 1', 'Opcao 2', 'Opcao 3'],
  orientation: 'horizontal',
  padding: 4,
  gap: 4,
  borderRadius: 8,
  background: '#f0f0f0',
  indicatorBackground: '#ffffff',
  indicatorBorderRadius: 6,
  indicatorShadow: '0 1px 3px rgba(0,0,0,0.12)',
  activeTextColor: '#262626',
  inactiveTextColor: '#595959',
  fontSize: 14,
  fontWeight: 500,
  itemPaddingX: 16,
  itemPaddingY: 8,
  transitionDuration: 200,
  fullWidth: false,
}

const PRESETS = {
  default: {
    padding: 4,
    gap: 4,
    borderRadius: 8,
    background: '#f0f0f0',
    indicatorBackground: '#ffffff',
    indicatorBorderRadius: 6,
    indicatorShadow: '0 1px 3px rgba(0,0,0,0.12)',
    activeTextColor: '#262626',
    inactiveTextColor: '#595959',
    fontSize: 14,
    fontWeight: 500,
    itemPaddingX: 16,
    itemPaddingY: 8,
    transitionDuration: 200,
    fullWidth: false,
  },
  ios: {
    padding: 2,
    gap: 0,
    borderRadius: 10,
    background: '#e5e5ea',
    indicatorBackground: '#ffffff',
    indicatorBorderRadius: 8,
    indicatorShadow: '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)',
    activeTextColor: '#000000',
    inactiveTextColor: '#8e8e93',
    fontSize: 13,
    fontWeight: 600,
    itemPaddingX: 20,
    itemPaddingY: 7,
    transitionDuration: 240,
    fullWidth: true,
  },
  material: {
    padding: 0,
    gap: 0,
    borderRadius: 24,
    background: '#e3e9f0',
    indicatorBackground: '#1677ff',
    indicatorBorderRadius: 24,
    indicatorShadow: 'none',
    activeTextColor: '#ffffff',
    inactiveTextColor: '#4a5c6e',
    fontSize: 14,
    fontWeight: 600,
    itemPaddingX: 24,
    itemPaddingY: 10,
    transitionDuration: 220,
    fullWidth: false,
  },
  dark: {
    padding: 4,
    gap: 4,
    borderRadius: 10,
    background: '#1f1f1f',
    indicatorBackground: '#333333',
    indicatorBorderRadius: 8,
    indicatorShadow: '0 1px 4px rgba(0,0,0,0.5)',
    activeTextColor: '#ffffff',
    inactiveTextColor: '#a6a6a6',
    fontSize: 14,
    fontWeight: 500,
    itemPaddingX: 18,
    itemPaddingY: 9,
    transitionDuration: 200,
    fullWidth: false,
  },
  minimal: {
    padding: 0,
    gap: 0,
    borderRadius: 0,
    background: 'transparent',
    indicatorBackground: '#1677ff',
    indicatorBorderRadius: 0,
    indicatorShadow: 'none',
    activeTextColor: '#1677ff',
    inactiveTextColor: '#8c8c8c',
    fontSize: 14,
    fontWeight: 500,
    itemPaddingX: 12,
    itemPaddingY: 6,
    transitionDuration: 180,
    fullWidth: false,
  },
}

export { PRESETS, DEFAULTS }

export function buildSegmentedControlCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const list = Array.isArray(opts.options) && opts.options.length > 0
    ? opts.options.map(String)
    : DEFAULTS.options
  const count = clamp(list.length, 2, 8)
  const orientation = opts.orientation === 'vertical' ? 'vertical' : 'horizontal'
  const padding = clamp(Number(opts.padding) || 0, 0, 32)
  const gap = clamp(Number(opts.gap) || 0, 0, 24)
  const borderRadius = clamp(Number(opts.borderRadius) || 0, 0, 999)
  const indicatorBorderRadius = clamp(Number(opts.indicatorBorderRadius) || 0, 0, 999)
  const background = parseColor(opts.background)
  const indicatorBackground = parseColor(opts.indicatorBackground)
  const activeTextColor = parseColor(opts.activeTextColor)
  const inactiveTextColor = parseColor(opts.inactiveTextColor)
  const fontSize = clamp(Number(opts.fontSize) || DEFAULTS.fontSize, 10, 32)
  const fontWeight = clamp(Number(opts.fontWeight) || DEFAULTS.fontWeight, 100, 900)
  const itemPaddingX = clamp(Number(opts.itemPaddingX) || 0, 0, 64)
  const itemPaddingY = clamp(Number(opts.itemPaddingY) || 0, 0, 48)
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 2000)
  const shadow = opts.indicatorShadow || 'none'
  const fullWidth = Boolean(opts.fullWidth)

  const isHorizontal = orientation === 'horizontal'
  const axis = isHorizontal ? 'X' : 'Y'
  const sizeVar = isHorizontal ? 'width' : 'height'

  const baseSize = `calc((100% - ${toPx(padding * 2)} - ${toPx(gap * (count - 1))}) / ${count})`

  const lines = [
    '/* Container com fundo neutro e indicador absoluto */',
    '.segmented-control {',
    `  position: relative;`,
    `  display: ${fullWidth ? 'flex' : 'inline-flex'};`,
    `  flex-direction: ${isHorizontal ? 'row' : 'column'};`,
    `  background: ${background};`,
    `  padding: ${toPx(padding)};`,
    `  border-radius: ${toPx(borderRadius)};`,
    `  gap: 0;`,
    `  box-sizing: border-box;`,
    `  user-select: none;`,
    `  -webkit-tap-highlight-color: transparent;`,
    `  --seg-gap: ${toPx(gap)};`,
    `  --seg-count: ${count};`,
    '}',
    '',
    '/* Cada opcao ocupa a mesma fracao do container */',
    '.segmented-control label {',
    `  position: relative;`,
    `  z-index: 1;`,
    `  display: flex;`,
    `  align-items: center;`,
    `  justify-content: center;`,
    `  ${sizeVar}: ${baseSize};`,
    `  padding: ${toPx(itemPaddingY)} ${toPx(itemPaddingX)};`,
    `  font-size: ${toPx(fontSize)};`,
    `  font-weight: ${fontWeight};`,
    `  line-height: 1.4;`,
    `  text-align: center;`,
    `  cursor: pointer;`,
    `  transition: color ${duration}ms ease;`,
    `  box-sizing: border-box;`,
    '  flex-shrink: 0;',
    '  flex-grow: 0;',
    '  overflow: hidden;',
    '  white-space: nowrap;',
    '  text-overflow: ellipsis;',
    '}',
    '',
    '/* Texto da opcao, muda de cor quando selecionado */',
    '.segmented-control .option-text {',
    `  color: ${inactiveTextColor};`,
    `  transition: color ${duration}ms ease;`,
    '  pointer-events: none;',
    '  position: relative;',
    '  z-index: 2;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 6px;',
    '  width: 100%;',
    '  overflow: hidden;',
    '  white-space: nowrap;',
    '  text-overflow: ellipsis;',
    '}',
    '',
    '/* Quando a opcao esta selecionada, o texto fica ativo */',
    '.segmented-control input:checked ~ .option-text {',
    `  color: ${activeTextColor};`,
    '}',
    '',
    '/* Esconde o radio real mas mantem acessibilidade */',
    '.segmented-control input {',
    '  position: absolute;',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '  margin: 0;',
    '  pointer-events: none;',
    '}',
    '',
    '/* Indicador deslizante que marca a opcao ativa */',
    '.segmented-indicator {',
    `  position: absolute;`,
    isHorizontal
      ? `  top: ${toPx(padding)}; bottom: ${toPx(padding)}; left: ${toPx(padding)};`
      : `  left: ${toPx(padding)}; right: ${toPx(padding)}; top: ${toPx(padding)};`,
    `  ${sizeVar}: ${baseSize};`,
    `  background: ${indicatorBackground};`,
    `  border-radius: ${toPx(indicatorBorderRadius)};`,
    `  box-shadow: ${shadow};`,
    `  transition: transform ${duration}ms ease;`,
    `  z-index: 0;`,
    `  pointer-events: none;`,
    '  box-sizing: border-box;',
    '}',
  ]

  for (let i = 0; i < count; i += 1) {
    lines.push(
      '',
      `.segmented-control:has(label:nth-child(${i + 1}) input:checked) .segmented-indicator {`,
      `  transform: translate${axis}(calc(${i} * (100% + var(--seg-gap))));`,
      '}'
    )
  }

  lines.push(
    '',
    '/* Foco via teclado */',
    '.segmented-control input:focus-visible ~ .option-text {',
    `  outline: 2px solid ${activeTextColor};`,
    '  outline-offset: 2px;',
    '  border-radius: 2px;',
    '}',
    '',
    '/* Estado desabilitado */',
    '.segmented-control input:disabled ~ .option-text {',
    '  opacity: 0.5;',
    '  cursor: not-allowed;',
    '}'
  )

  return lines.filter(Boolean).join('\n')
}

export function buildSegmentedControlHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const list = Array.isArray(opts.options) && opts.options.length > 0
    ? opts.options.map(String)
    : DEFAULTS.options
  const count = clamp(list.length, 2, 8)
  const disabled = Boolean(opts.disabled)
  const defaultIndex = clamp(Number(opts.defaultIndex) || 0, 0, count - 1)
  const name = String(opts.name || 'segmented-control')

  const labels = list.map((text, i) => {
    const checked = i === defaultIndex ? ' checked' : ''
    const dis = disabled ? ' disabled' : ''
    return [
      '  <label>',
      `    <input type="radio" name="${name}" value="${i}"${checked}${dis}>`,
      `    <span class="option-text">${text}</span>`,
      '  </label>',
    ].join('\n')
  })

  return [
    `<div class="segmented-control" role="radiogroup" aria-label="${opts.ariaLabel || 'Segmented control'}">`,
    '  <span class="segmented-indicator" aria-hidden="true"></span>',
    ...labels,
    '</div>',
  ].join('\n')
}

export function buildSegmentedControlFullDemo(options = {}) {
  return `${buildSegmentedControlCss(options)}\n\n${buildSegmentedControlHtml(options)}`
}
