// Gerador de badges/shields em SVG no estilo shields.io
// 100% client-side: a página mede os textos via <canvas> e passa as larguras
// para buildBadgeSvg, que monta a string SVG pura.

const FONT_FAMILY = 'Verdana,Geneva,DejaVu Sans,sans-serif'

export const STYLE_CONFIG = {
  flat: {
    height: 20,
    padX: 6,
    fontSize: 11,
    fontWeight: 'bold',
    textYOffset: 14,
    uppercase: false,
    shadow: false,
    gradient: false,
  },
  'flat-square': {
    height: 20,
    padX: 6,
    fontSize: 11,
    fontWeight: 'bold',
    textYOffset: 14,
    uppercase: false,
    shadow: false,
    gradient: false,
  },
  plastic: {
    height: 18,
    padX: 6,
    fontSize: 11,
    fontWeight: 'bold',
    textYOffset: 13,
    uppercase: false,
    shadow: true,
    gradient: true,
  },
  'for-the-badge': {
    height: 28,
    padX: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textYOffset: 19,
    uppercase: true,
    shadow: false,
    gradient: false,
  },
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  }
}

function darken(hex, amount = 20) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const clamp = (v) => Math.max(0, Math.min(255, v - amount))
  return `rgb(${clamp(rgb.r)}, ${clamp(rgb.g)}, ${clamp(rgb.b)})`
}

function prepareText(text, style) {
  const t = String(text ?? '')
  return style.uppercase ? t.toUpperCase() : t
}

function buildGradient(id, color) {
  const top = color
  const bottom = darken(color, 25)
  return `<linearGradient id="${id}" x2="0%" y2="100%">
  <stop offset="0%" stop-color="${top}"/>
  <stop offset="100%" stop-color="${bottom}"/>
</linearGradient>`
}

function buildShadowFilter(id) {
  return `<filter id="${id}" width="200%" height="200%" x="-50%" y="-50%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur"/>
  <feOffset in="blur" dx="0" dy="0.5" result="offsetBlur"/>
  <feMerge>
    <feMergeNode in="offsetBlur"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>`
}

// Path de um retângulo com cantos arredondados apenas nos lados especificados.
// left=true arredonda os cantos esquerdos; right=true arredonda os direitos.
function roundedRectPath(x, y, w, h, r, left, right) {
  const rx = Math.min(r, w / 2, h / 2)
  let d = `M${x + rx} ${y}`
  if (right) {
    d += ` h${w - 2 * rx} a${rx} ${rx} 0 0 1 ${rx} ${rx}`
    d += ` v${h - 2 * rx} a${rx} ${rx} 0 0 1 -${rx} ${rx}`
  } else {
    d += ` h${w - rx} v${h} h-${w - rx}`
  }
  if (left) {
    d += ` h-${w - 2 * rx} a${rx} ${rx} 0 0 1 -${rx} -${rx}`
    d += ` v-${h - 2 * rx} a${rx} ${rx} 0 0 1 ${rx} -${rx}`
  } else {
    d += ` h-${w - rx} v-${h} h${w - rx}`
  }
  d += ' z'
  return d
}

export function measureTexts(label, message, styleKey, logo, canvasCtx) {
  const style = STYLE_CONFIG[styleKey] || STYLE_CONFIG.flat
  const font = `${style.fontWeight} ${style.fontSize}px ${FONT_FAMILY}`
  canvasCtx.font = font
  const labelW = label ? canvasCtx.measureText(prepareText(label, style)).width : 0
  const messageW = message ? canvasCtx.measureText(prepareText(message, style)).width : 0
  const logoW = logo ? style.height - 4 : 0
  return {
    labelWidth: Math.ceil(labelW),
    messageWidth: Math.ceil(messageW),
    logoWidth: Math.ceil(logoW),
  }
}

export function computeDimensions(measurements, styleKey, hasLabel) {
  const style = STYLE_CONFIG[styleKey] || STYLE_CONFIG.flat
  const logoW = measurements.logoWidth
  const labelW = hasLabel ? measurements.labelWidth + style.padX * 2 + logoW : 0
  const messageW = measurements.messageWidth + style.padX * 2
  const totalW = labelW + messageW
  return {
    width: totalW,
    height: style.height,
    labelWidth: labelW,
    messageWidth: messageW,
    splitX: labelW,
    logoWidth: logoW,
  }
}

export function buildBadgeSvg(measurements, options) {
  const {
    label = '',
    message = '',
    labelColor = '#555',
    color = '#4c1',
    style: styleKey = 'flat',
    logo = '',
    logoColor = '#fff',
    textColor = '#fff',
  } = options

  const style = STYLE_CONFIG[styleKey] || STYLE_CONFIG.flat
  const hasLabel = Boolean(label)
  const dims = computeDimensions(measurements, styleKey, hasLabel)
  const w = dims.width
  const h = dims.height
  const split = dims.splitX
  const r = styleKey === 'for-the-badge' ? 0 : 3

  const labelText = prepareText(label, style)
  const messageText = prepareText(message, style)

  const gradientId = 'g'
  const shadowId = 's'
  const defs = []
  if (style.gradient) defs.push(buildGradient(gradientId, color))
  if (style.shadow) defs.push(buildShadowFilter(shadowId))
  const defsBlock = defs.length ? `  <defs>\n${defs.map((d) => '    ' + d.split('\n').join('\n    ')).join('\n')}\n  </defs>` : ''

  const messageFill = style.gradient ? `url(#${gradientId})` : color

  const labelRect = hasLabel
    ? `  <path fill="${labelColor}" d="${roundedRectPath(0, 0, split, h, r, true, false)}"/>`
    : ''

  const msgRect = `  <path fill="${messageFill}" ${style.shadow ? `filter="url(#${shadowId})"` : ''} d="${roundedRectPath(split, 0, w - split, h, r, false, true)}"/>`

  const logoEl = logo
    ? `  <g transform="translate(${style.padX - 1}, ${Math.round((h - dims.logoWidth) / 2)})">
    <rect x="0" y="0" width="${dims.logoWidth}" height="${dims.logoWidth}" rx="2" fill="rgba(255,255,255,0.2)"/>
    <text x="${dims.logoWidth / 2}" y="${(dims.logoWidth / 2 + style.fontSize * 0.35).toFixed(1)}" font-size="${Math.max(9, style.fontSize - 2)}px" font-weight="bold" text-anchor="middle" fill="${logoColor}" font-family="${FONT_FAMILY}">${escapeXml(logo)}</text>
  </g>`
    : ''

  const labelX = dims.logoWidth + style.padX + (hasLabel ? measurements.labelWidth / 2 : 0)
  const messageX = split + measurements.messageWidth / 2 + style.padX

  const labelTextEl = hasLabel
    ? `  <text x="${labelX.toFixed(1)}" y="${style.textYOffset}" font-size="${style.fontSize}px" font-weight="${style.fontWeight}" font-family="${FONT_FAMILY}" text-anchor="middle" fill="${textColor}">${escapeXml(labelText)}</text>`
    : ''
  const messageTextEl = `  <text x="${messageX.toFixed(1)}" y="${style.textYOffset}" font-size="${style.fontSize}px" font-weight="${style.fontWeight}" font-family="${FONT_FAMILY}" text-anchor="middle" fill="${textColor}">${escapeXml(messageText)}</text>`

  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" role="img" aria-label="${escapeXml(label + ': ' + message)}">`,
    '  <title>' + escapeXml(label + ': ' + message) + '</title>',
    defsBlock,
    labelRect,
    msgRect,
    logoEl,
    labelTextEl,
    messageTextEl,
    '</svg>',
  ].filter(Boolean)

  return lines.join('\n')
}

export function buildBadgeMarkdown(label, message, svgCode) {
  const dataUri = `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svgCode))) : ''}`
  const alt = `${label} ${message}`
  return `![${alt}](${dataUri})`
}

export function buildBadgeHtml(svgCode) {
  return svgCode
}

export function buildBadgeRst(label, message, svgCode) {
  const dataUri = `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svgCode))) : ''}`
  return `.. image:: ${dataUri}\n   :alt: ${label} ${message}`
}

export { FONT_FAMILY }
