// Gerador de divider/separador CSS puro.
//
// Produz classes .divider para separar conteúdo com vários estilos visuais:
// linha sólida, tracejada, pontilhada, dupla, gradiente, sombra e divisor com
// texto ou ícone no centro. Suporta orientação horizontal e vertical.

function parseColor(color) {
  if (!color) return '#d9d9d9'
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
  if (Number.isNaN(bigint)) return { r: 217, g: 217, b: 217 }
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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const ICON_SVGS = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  diamond: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>',
}

const DEFAULTS = {
  type: 'solid',
  orientation: 'horizontal',
  width: 100,
  widthUnit: '%',
  thickness: 1,
  color: '#d9d9d9',
  color2: '#1677ff',
  align: 'center',
  marginY: 24,
  marginX: 0,
  borderRadius: 0,
  text: 'or',
  icon: 'star',
  className: 'divider',
}

const PRESETS = {
  default: { ...DEFAULTS },
  dashed: {
    ...DEFAULTS,
    type: 'dashed',
    thickness: 2,
  },
  dotted: {
    ...DEFAULTS,
    type: 'dotted',
    thickness: 4,
  },
  double: {
    ...DEFAULTS,
    type: 'double',
    thickness: 4,
  },
  gradient: {
    ...DEFAULTS,
    type: 'gradient',
    thickness: 3,
    color: '#1677ff',
    color2: '#52c41a',
    borderRadius: 2,
  },
  shadow: {
    ...DEFAULTS,
    type: 'shadow',
    thickness: 8,
    color: '#000000',
    borderRadius: 4,
  },
  text: {
    ...DEFAULTS,
    type: 'text',
    thickness: 1,
    color: '#d9d9d9',
    text: 'OR',
  },
  icon: {
    ...DEFAULTS,
    type: 'icon',
    thickness: 1,
    color: '#d9d9d9',
    icon: 'star',
  },
  vertical: {
    ...DEFAULTS,
    orientation: 'vertical',
    type: 'solid',
    thickness: 1,
    width: 24,
    widthUnit: 'px',
    marginY: 0,
    marginX: 16,
  },
  minimal: {
    ...DEFAULTS,
    type: 'solid',
    thickness: 1,
    color: '#f0f0f0',
    marginY: 16,
  },
}

export { DEFAULTS, PRESETS, ICON_SVGS }

export function buildDividerCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'divider'
  const type = opts.type || 'solid'
  const orientation = opts.orientation || 'horizontal'
  const isHorizontal = orientation === 'horizontal'
  const thickness = clamp(Number(opts.thickness) || 1, 1, 32)
  const color = parseColor(opts.color)
  const color2 = parseColor(opts.color2)
  const align = opts.align || 'center'
  const marginY = clamp(Number(opts.marginY) || 0, 0, 120)
  const marginX = clamp(Number(opts.marginX) || 0, 0, 120)
  const borderRadius = clamp(Number(opts.borderRadius) || 0, 0, 32)

  let widthValue
  const widthUnit = opts.widthUnit || '%'
  if (widthUnit === '%') {
    widthValue = `${clamp(Number(opts.width) || 100, 1, 100)}%`
  } else if (widthUnit === 'px') {
    widthValue = `${clamp(Number(opts.width) || 100, 1, 800)}px`
  } else {
    widthValue = '100%'
  }

  let borderProperty
  if (type === 'dashed') {
    borderProperty = isHorizontal
      ? `border-top: ${toPx(thickness)} dashed ${color};`
      : `border-left: ${toPx(thickness)} dashed ${color};`
  } else if (type === 'dotted') {
    borderProperty = isHorizontal
      ? `border-top: ${toPx(thickness)} dotted ${color};`
      : `border-left: ${toPx(thickness)} dotted ${color};`
  } else if (type === 'double') {
    borderProperty = isHorizontal
      ? `border-top: ${toPx(thickness)} double ${color};`
      : `border-left: ${toPx(thickness)} double ${color};`
  } else if (type === 'gradient') {
    borderProperty = isHorizontal
      ? `height: ${toPx(thickness)}; background: linear-gradient(90deg, ${color}, ${color2}); border: none;`
      : `width: ${toPx(thickness)}; background: linear-gradient(180deg, ${color}, ${color2}); border: none;`
  } else if (type === 'shadow') {
    borderProperty = isHorizontal
      ? `height: ${toPx(Math.max(thickness, 2))}; background: ${color}; border: none; box-shadow: 0 0 ${toPx(thickness)} ${rgba(color, 0.6)};`
      : `width: ${toPx(Math.max(thickness, 2))}; background: ${color}; border: none; box-shadow: 0 0 ${toPx(thickness)} ${rgba(color, 0.6)};`
  } else {
    // solid
    borderProperty = isHorizontal
      ? `border-top: ${toPx(thickness)} solid ${color};`
      : `border-left: ${toPx(thickness)} solid ${color};`
  }

  const isFillType = type === 'gradient' || type === 'shadow'

  const alignSelf = align === 'start' || align === 'left' || align === 'top'
    ? 'flex-start'
    : align === 'end' || align === 'right' || align === 'bottom'
      ? 'flex-end'
      : 'center'

  const sizeProp = isHorizontal ? 'width' : 'height'
  const crossSizeProp = isHorizontal ? 'height' : 'width'
  const marginProp = isHorizontal ? 'margin-top' : 'margin-left'
  const marginCrossProp = isHorizontal ? 'margin-bottom' : 'margin-right'

  const lines = [
    `.${cn} {`,
    '  display: flex;',
    `  align-items: center;`,
    `  align-self: ${alignSelf};`,
    `  justify-content: center;`,
    `  ${sizeProp}: ${widthValue};`,
    isFillType ? `  ${crossSizeProp}: ${toPx(thickness)};` : `  ${crossSizeProp}: auto;`,
    `  ${marginProp}: ${toPx(marginY)};`,
    `  ${marginCrossProp}: ${toPx(marginY)};`,
    `  margin-left: ${toPx(marginX)};`,
    `  margin-right: ${toPx(marginX)};`,
    borderRadius > 0 && isFillType ? `  border-radius: ${toPx(borderRadius)};` : null,
    `  ${borderProperty}`,
    '  box-sizing: border-box;',
    '}',
    '',
  ]

  if (type === 'text') {
    const text = escapeHtml(opts.text || '')
    lines.push(
      `.${cn}::before, .${cn}::after {`,
      `  content: "";`,
      '  flex: 1 1 auto;',
      `  border-top: ${toPx(thickness)} solid ${color};`,
      '  min-width: 0;',
      '}',
      '',
      `.${cn}__text {`,
      '  flex-shrink: 0;',
      `  padding: 0 12px;`,
      `  color: ${color};`,
      '  font-size: inherit;',
      '  font-weight: 500;',
      '  line-height: 1;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.05em;',
      '}',
      ''
    )
  }

  if (type === 'icon') {
    const iconKey = ICON_SVGS[opts.icon] ? opts.icon : 'star'
    lines.push(
      `.${cn}::before, .${cn}::after {`,
      `  content: "";`,
      '  flex: 1 1 auto;',
      `  border-top: ${toPx(thickness)} solid ${color};`,
      '  min-width: 0;',
      '}',
      '',
      `.${cn}__icon {`,
      '  flex-shrink: 0;',
      `  width: ${toPx(Math.max(16, thickness * 4))};`,
      `  height: ${toPx(Math.max(16, thickness * 4))};`,
      `  padding: 0 12px;`,
      `  color: ${color};`,
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '}',
      '',
      `.${cn}__icon svg {`,
      '  width: 100%;',
      '  height: 100%;',
      '}',
      ''
    )
  }

  return lines.filter((line) => line !== null).join('\n')
}

export function buildDividerHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'divider'
  const type = opts.type || 'solid'

  if (type === 'text') {
    return `<div class="${cn}" role="separator" aria-label="${escapeHtml(opts.text || '')}">\n  <span class="${cn}__text">${escapeHtml(opts.text || '')}</span>\n</div>`
  }

  if (type === 'icon') {
    const iconKey = ICON_SVGS[opts.icon] ? opts.icon : 'star'
    return `<div class="${cn}" role="separator" aria-label="${iconKey}">\n  <span class="${cn}__icon" aria-hidden="true">${ICON_SVGS[iconKey]}</span>\n</div>`
  }

  return `<div class="${cn}" role="separator"></div>`
}

export function buildDividerFullDemo(options = {}) {
  return `${buildDividerCss(options)}\n\n${buildDividerHtml(options)}`
}
