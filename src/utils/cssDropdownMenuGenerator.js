// Gerador de dropdown menu CSS puro.
//
// Produz um menu suspenso funcional sem JavaScript usando :hover,
// :focus-within ou o checkbox hack. O HTML gerado é semântico e acessível,
// com roles ARIA e seta indicativa opcional.

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

function rgba(hex, alpha) {
  const clean = parseColor(hex).replace('#', '')
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(bigint)) return `rgba(22, 119, 255, ${alpha})`
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const DEFAULTS = {
  triggerMode: 'hover',
  position: 'bottom',
  align: 'start',
  minWidth: 180,
  gap: 6,
  paddingX: 0,
  paddingY: 6,
  itemPaddingX: 16,
  itemPaddingY: 10,
  borderRadius: 8,
  itemRadius: 4,
  background: '#ffffff',
  textColor: '#262626',
  hoverBackground: '#f5f5f5',
  hoverTextColor: '#1677ff',
  triggerBackground: '#ffffff',
  triggerTextColor: '#262626',
  triggerBorderColor: '#d9d9d9',
  triggerBorderWidth: 1,
  borderColor: '#d9d9d9',
  borderWidth: 1,
  shadow: '0 4px 12px rgba(0,0,0,0.15)',
  fontSize: 14,
  transitionDuration: 200,
  animation: 'fade',
  hasArrow: true,
  hasDivider: true,
  itemCount: 4,
}

const PRESETS = {
  default: { ...DEFAULTS },
  dark: {
    ...DEFAULTS,
    background: '#1f1f1f',
    textColor: '#ffffff',
    hoverBackground: 'rgba(255,255,255,0.1)',
    hoverTextColor: '#ffffff',
    triggerBackground: '#1f1f1f',
    triggerTextColor: '#ffffff',
    triggerBorderColor: '#434343',
    borderColor: '#434343',
    shadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  minimal: {
    ...DEFAULTS,
    borderRadius: 0,
    itemRadius: 0,
    shadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderWidth: 0,
    triggerBorderWidth: 0,
    hasArrow: false,
    hasDivider: false,
    paddingY: 4,
  },
  material: {
    ...DEFAULTS,
    borderRadius: 4,
    itemRadius: 0,
    shadow: '0 8px 24px rgba(0,0,0,0.15)',
    borderWidth: 0,
    triggerBorderWidth: 0,
    triggerBackground: '#e3f2fd',
    triggerTextColor: '#1565c0',
    hoverBackground: '#e3f2fd',
    hoverTextColor: '#1565c0',
  },
  rounded: {
    ...DEFAULTS,
    borderRadius: 16,
    itemRadius: 12,
    paddingY: 8,
    shadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderWidth: 0,
  },
}

export { DEFAULTS, PRESETS }

function positionRules(position, align, gap) {
  const g = toPx(gap)
  const isVertical = position === 'bottom' || position === 'top'
  const mainProp = isVertical ? 'left' : 'top'
  const crossProp = isVertical ? 'top' : 'left'
  const crossValue = position === 'bottom' || position === 'right' ? `calc(100% + ${g})` : 'auto'
  const oppositeCross = position === 'bottom' || position === 'right' ? 'auto' : `calc(100% + ${g})`

  const alignments = {
    start: isVertical ? { [mainProp]: 0, transform: 'none' } : { [mainProp]: 0, transform: 'none' },
    center: isVertical
      ? { [mainProp]: '50%', transform: 'translateX(-50%)' }
      : { [mainProp]: '50%', transform: 'translateY(-50%)' },
    end: isVertical
      ? { [mainProp]: 'auto', right: 0, transform: 'none' }
      : { [mainProp]: 'auto', bottom: 0, transform: 'none' },
  }

  const base = {
    [crossProp]: crossValue,
    ...(oppositeCross !== 'auto' ? { [crossProp === 'top' ? 'bottom' : 'right']: oppositeCross } : {}),
  }

  // Remove a propriedade oposta conflitante quando o valor principal é usado
  delete base[crossProp === 'top' ? 'bottom' : 'right']

  return { ...base, ...alignments[align] }
}

function triggerSelector(triggerMode) {
  if (triggerMode === 'hover') return '.dropdown:hover .dropdown-menu'
  if (triggerMode === 'focus') return '.dropdown:focus-within .dropdown-menu'
  return '.dropdown input[type="checkbox"]:checked ~ .dropdown-menu'
}

function arrowSelector(triggerMode) {
  if (triggerMode === 'hover') return '.dropdown:hover .dropdown-arrow'
  if (triggerMode === 'focus') return '.dropdown:focus-within .dropdown-arrow'
  return '.dropdown input[type="checkbox"]:checked ~ .dropdown-toggle .dropdown-arrow'
}

function openTransform(animation, position) {
  if (animation === 'slide') {
    const offset = toPx(8)
    if (position === 'bottom') return `translateY(0)`
    if (position === 'top') return `translateY(0)`
    if (position === 'left') return `translateX(0)`
    if (position === 'right') return `translateX(0)`
  }
  if (animation === 'scale') return 'scale(1)'
  return 'none'
}

function closedTransform(animation, position) {
  if (animation === 'slide') {
    if (position === 'bottom') return `translateY(-8px)`
    if (position === 'top') return `translateY(8px)`
    if (position === 'left') return `translateX(8px)`
    if (position === 'right') return `translateX(-8px)`
  }
  if (animation === 'scale') return 'scale(0.96)'
  return 'none'
}

function origin(animation, position) {
  if (animation === 'scale') {
    if (position === 'bottom') return 'top left'
    if (position === 'top') return 'bottom left'
    if (position === 'left') return 'top right'
    if (position === 'right') return 'top left'
  }
  return undefined
}

export function buildDropdownMenuCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const triggerMode = opts.triggerMode || 'hover'
  const position = opts.position || 'bottom'
  const align = opts.align || 'start'
  const minWidth = clamp(Number(opts.minWidth) || DEFAULTS.minWidth, 80, 500)
  const gap = clamp(Number(opts.gap) || DEFAULTS.gap, 0, 48)
  const paddingX = clamp(Number(opts.paddingX) || DEFAULTS.paddingX, 0, 48)
  const paddingY = clamp(Number(opts.paddingY) || DEFAULTS.paddingY, 0, 48)
  const itemPaddingX = clamp(Number(opts.itemPaddingX) || DEFAULTS.itemPaddingX, 0, 48)
  const itemPaddingY = clamp(Number(opts.itemPaddingY) || DEFAULTS.itemPaddingY, 0, 32)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, 40)
  const itemRadius = clamp(Number(opts.itemRadius) || DEFAULTS.itemRadius, 0, 40)
  const fontSize = clamp(Number(opts.fontSize) || DEFAULTS.fontSize, 10, 32)
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 1000)
  const animation = opts.animation || 'fade'
  const hasArrow = Boolean(opts.hasArrow)
  const hasDivider = Boolean(opts.hasDivider)

  const background = parseColor(opts.background)
  const textColor = parseColor(opts.textColor)
  const hoverBackground = parseColor(opts.hoverBackground)
  const hoverTextColor = parseColor(opts.hoverTextColor)
  const triggerBackground = parseColor(opts.triggerBackground)
  const triggerTextColor = parseColor(opts.triggerTextColor)
  const triggerBorderColor = parseColor(opts.triggerBorderColor)
  const triggerBorderWidth = clamp(Number(opts.triggerBorderWidth) ?? DEFAULTS.triggerBorderWidth, 0, 8)
  const borderColor = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) ?? DEFAULTS.borderWidth, 0, 8)
  const shadow = opts.shadow || DEFAULTS.shadow

  const pos = positionRules(position, align, gap)
  const animOrigin = origin(animation, position)
  const closedT = closedTransform(animation, position)
  const openT = openTransform(animation, position)

  const posLines = Object.entries(pos).map(([k, v]) => `  ${k}: ${v};`)

  const lines = [
    '/* Container do dropdown */',
    '.dropdown {',
    '  position: relative;',
    '  display: inline-block;',
    '}',
    '',
    '/* Botão de acionamento */',
    '.dropdown-toggle {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    `  gap: ${toPx(8)};`,
    `  min-width: ${toPx(minWidth)};`,
    `  padding: ${toPx(itemPaddingY)} ${toPx(itemPaddingX)};`,
    `  background: ${triggerBackground};`,
    `  color: ${triggerTextColor};`,
    `  border: ${triggerBorderWidth > 0 ? `${toPx(triggerBorderWidth)} solid ${triggerBorderColor}` : 'none'};`,
    `  border-radius: ${toPx(borderRadius)};`,
    `  font-size: ${toPx(fontSize)};`,
    '  font-family: inherit;',
    '  line-height: 1.4;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    `  transition: background ${duration}ms ease, color ${duration}ms ease, border-color ${duration}ms ease, box-shadow ${duration}ms ease;`,
    '}',
    '',
    '.dropdown-toggle:hover {',
    `  background: ${rgba(hoverBackground, 0.5)};`,
    '}',
    '',
    '.dropdown-toggle:focus-visible {',
    '  outline: 2px solid currentColor;',
    '  outline-offset: 2px;',
    '}',
    '',
    hasArrow ? '/* Seta indicadora */' : null,
    hasArrow ? '.dropdown-arrow {' : null,
    hasArrow ? `  width: ${toPx(Math.round(fontSize * 0.7))};` : null,
    hasArrow ? `  height: ${toPx(Math.round(fontSize * 0.7))};` : null,
    hasArrow ? '  display: inline-flex;' : null,
    hasArrow ? '  align-items: center;' : null,
    hasArrow ? '  justify-content: center;' : null,
    hasArrow ? `  transition: transform ${duration}ms ease;` : null,
    hasArrow ? '}' : null,
    hasArrow ? '' : null,
    hasArrow ? '.dropdown-arrow svg {' : null,
    hasArrow ? '  width: 100%;' : null,
    hasArrow ? '  height: 100%;' : null,
    hasArrow ? '}' : null,
    hasArrow ? '' : null,
    '/* Lista do menu */',
    '.dropdown-menu {',
    '  position: absolute;',
    `  z-index: 1000;`,
    `  min-width: ${toPx(minWidth)};`,
    `  margin: 0;`,
    `  padding: ${toPx(paddingY)} ${toPx(paddingX)};`,
    `  list-style: none;`,
    `  background: ${background};`,
    `  color: ${textColor};`,
    `  border: ${borderWidth > 0 ? `${toPx(borderWidth)} solid ${borderColor}` : 'none'};`,
    `  border-radius: ${toPx(borderRadius)};`,
    `  box-shadow: ${shadow};`,
    ...posLines,
    `  opacity: 0;`,
    `  visibility: hidden;`,
    `  pointer-events: none;`,
    animOrigin ? `  transform-origin: ${animOrigin};` : null,
    `  transform: ${closedT};`,
    `  transition: opacity ${duration}ms ease, transform ${duration}ms ease, visibility ${duration}ms ease;`,
    '}',
    '',
    '/* Estado aberto */',
    `${triggerSelector(triggerMode)} {`,
    '  opacity: 1;',
    '  visibility: visible;',
    '  pointer-events: auto;',
    `  transform: ${openT};`,
    '}',
    '',
    hasArrow ? `/* Rotação da seta no estado aberto */` : null,
    hasArrow ? `${arrowSelector(triggerMode)} {` : null,
    hasArrow ? '  transform: rotate(180deg);' : null,
    hasArrow ? '}' : null,
    hasArrow ? '' : null,
    '/* Itens do menu */',
    '.dropdown-item {',
    '  display: block;',
    `  padding: ${toPx(itemPaddingY)} ${toPx(itemPaddingX)};`,
    `  color: ${textColor};`,
    '  text-decoration: none;',
    `  border-radius: ${toPx(itemRadius)};`,
    `  font-size: ${toPx(fontSize)};`,
    '  line-height: 1.4;',
    '  white-space: nowrap;',
    '  cursor: pointer;',
    `  transition: background ${duration}ms ease, color ${duration}ms ease;`,
    '}',
    '',
    '.dropdown-item:hover,',
    '.dropdown-item:focus {',
    `  background: ${hoverBackground};`,
    `  color: ${hoverTextColor};`,
    '  outline: none;',
    '}',
    '',
    hasDivider ? '/* Divisores entre itens */' : null,
    hasDivider ? '.dropdown-menu li + li {' : null,
    hasDivider ? `  border-top: 1px solid ${rgba(borderColor, 0.25)};` : null,
    hasDivider ? '}' : null,
    hasDivider ? '' : null,
    '/* Checkbox hack (quando o modo é "click") */',
    '.dropdown input[type="checkbox"] {',
    '  position: absolute;',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '  pointer-events: none;',
    '}',
    '',
    '/* Esconde outline do checkbox invisível */',
    '.dropdown input[type="checkbox"]:focus {',
    '  outline: none;',
    '}',
    '',
    '/* Mantém o botão acessível quando controlado por checkbox */',
    '.dropdown input[type="checkbox"]:focus-visible ~ .dropdown-toggle {',
    '  outline: 2px solid currentColor;',
    '  outline-offset: 2px;',
    '}',
  ]

  return lines.filter(Boolean).join('\n')
}

const ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'

export function buildDropdownMenuHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const triggerMode = opts.triggerMode || 'hover'
  const hasArrow = Boolean(opts.hasArrow)
  const itemCount = clamp(Number(opts.itemCount) || DEFAULTS.itemCount, 1, 12)
  const label = String(opts.triggerText || 'Menu')

  const arrow = hasArrow ? `\n    <span class="dropdown-arrow" aria-hidden="true">${ARROW_SVG}</span>` : ''

  const items = []
  for (let i = 1; i <= itemCount; i += 1) {
    items.push(`  <li role="none"><a href="#" class="dropdown-item" role="menuitem">Item ${i}</a></li>`)
  }

  if (triggerMode === 'click') {
    return [
      '<div class="dropdown">',
      '  <input type="checkbox" id="dropdown-toggle" aria-haspopup="true" aria-controls="dropdown-menu" />',
      `  <label class="dropdown-toggle" for="dropdown-toggle" aria-expanded="false">`,
      `    ${label}${arrow}`,
      '  </label>',
      '  <ul class="dropdown-menu" id="dropdown-menu" role="menu">',
      ...items,
      '  </ul>',
      '</div>',
    ].join('\n')
  }

  return [
    '<div class="dropdown">',
    `  <button class="dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false">`,
    `    ${label}${arrow}`,
    '  </button>',
    '  <ul class="dropdown-menu" role="menu">',
    ...items,
    '  </ul>',
    '</div>',
  ].join('\n')
}

export function buildDropdownMenuFullDemo(options = {}) {
  return `${buildDropdownMenuCss(options)}\n\n${buildDropdownMenuHtml(options)}`
}
