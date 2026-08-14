// Gerador de cursor personalizado via CSS + data URI SVG.
//
// Cria regras CSS que usam imagens SVG embutidas como cursor customizado,
// com controle de hotspot (ponto de clique) e cursor de fallback.
// Tudo é feito no navegador — nenhum dado sai do cliente.

function parseColor(color) {
  if (!color) return '#1677ff'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function toPx(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}px` : '0px'
}

const SHAPES = {
  arrow: {
    hotspot: { x: 0, y: 0 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="{COLOR}" d="M4 4 L4 24 L10 18 L16 28 L20 26 L14 16 L24 16 Z"/></svg>`,
  },
  pointer: {
    hotspot: { x: 8, y: 4 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="{COLOR}" d="M9 3 L9 22 C9 23.1 9.9 24 11 24 H13 L15 28 L17 27 L15 23 H19 V20 H23 V17 H27 V13 L9 3 Z"/></svg>`,
  },
  crosshair: {
    hotspot: { x: 16, y: 16 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke="{COLOR}" stroke-width="2" stroke-linecap="round"><line x1="16" y1="4" x2="16" y2="12"/><line x1="16" y1="20" x2="16" y2="28"/><line x1="4" y1="16" x2="12" y2="16"/><line x1="20" y1="16" x2="28" y2="16"/></g><circle cx="16" cy="16" r="2" fill="{COLOR}"/></svg>`,
  },
  text: {
    hotspot: { x: 16, y: 16 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke="{COLOR}" stroke-width="2" stroke-linecap="round"><line x1="16" y1="5" x2="16" y2="27"/><line x1="10" y1="5" x2="22" y2="5"/><line x1="10" y1="27" x2="22" y2="27"/></g></svg>`,
  },
  move: {
    hotspot: { x: 16, y: 16 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="{COLOR}" d="M16 4 L12 10 H14 V14 H10 V12 L4 16 L10 20 V18 H14 V22 H12 L16 28 L20 22 H18 V18 H22 V20 L28 16 L22 12 V14 H18 V10 H20 Z"/></svg>`,
  },
  help: {
    hotspot: { x: 16, y: 16 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="{COLOR}" stroke-width="2"/><text x="16" y="22" text-anchor="middle" fill="{COLOR}" font-size="16" font-weight="bold" font-family="system-ui, sans-serif">?</text></svg>`,
  },
  'zoom-in': {
    hotspot: { x: 14, y: 14 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="14" cy="14" r="9" fill="none" stroke="{COLOR}" stroke-width="2"/><line x1="20" y1="20" x2="28" y2="28" stroke="{COLOR}" stroke-width="3" stroke-linecap="round"/><line x1="10" y1="14" x2="18" y2="14" stroke="{COLOR}" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="10" x2="14" y2="18" stroke="{COLOR}" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  heart: {
    hotspot: { x: 16, y: 16 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="{COLOR}" d="M16 28 C16 28 4 20 4 12 C4 7 7 4 12 4 C14 4 16 5 16 7 C16 5 18 4 20 4 C25 4 28 7 28 12 C28 20 16 28 16 28 Z"/></svg>`,
  },
}

const FALLBACK_OPTIONS = [
  'auto',
  'default',
  'pointer',
  'crosshair',
  'text',
  'move',
  'help',
  'wait',
  'not-allowed',
  'zoom-in',
  'grab',
  'none',
]

const DEFAULTS = {
  shape: 'arrow',
  color: '#1677ff',
  customSvg: '',
  size: 32,
  hotspotX: 0,
  hotspotY: 0,
  fallback: 'auto',
  className: 'custom-cursor',
}

const PRESETS = {
  default: { ...DEFAULTS },
  pointer: {
    ...DEFAULTS,
    shape: 'pointer',
    color: '#1677ff',
    hotspotX: 8,
    hotspotY: 4,
    fallback: 'pointer',
  },
  crosshair: {
    ...DEFAULTS,
    shape: 'crosshair',
    color: '#262626',
    hotspotX: 16,
    hotspotY: 16,
    fallback: 'crosshair',
  },
  text: {
    ...DEFAULTS,
    shape: 'text',
    color: '#262626',
    hotspotX: 16,
    hotspotY: 16,
    fallback: 'text',
  },
  move: {
    ...DEFAULTS,
    shape: 'move',
    color: '#52c41a',
    hotspotX: 16,
    hotspotY: 16,
    fallback: 'move',
  },
  help: {
    ...DEFAULTS,
    shape: 'help',
    color: '#faad14',
    hotspotX: 16,
    hotspotY: 16,
    fallback: 'help',
  },
  'zoom-in': {
    ...DEFAULTS,
    shape: 'zoom-in',
    color: '#722ed1',
    hotspotX: 14,
    hotspotY: 14,
    fallback: 'zoom-in',
  },
  heart: {
    ...DEFAULTS,
    shape: 'heart',
    color: '#eb2f96',
    hotspotX: 16,
    hotspotY: 16,
    fallback: 'pointer',
  },
}

export { SHAPES, FALLBACK_OPTIONS, DEFAULTS, PRESETS }

export function buildSvgString(shapeKey, color, customSvg, size) {
  const raw = customSvg && customSvg.trim() ? customSvg : (SHAPES[shapeKey]?.svg || SHAPES.arrow.svg)
  const filled = raw.replace(/\{COLOR\}/g, parseColor(color))
  const s = clamp(Number(size) || 32, 8, 128)
  // Garante width/height/viewBox consistentes com o tamanho escolhido.
  const withSize = filled
    .replace(/width="[^"]*"/, `width="${s}"`)
    .replace(/height="[^"]*"/, `height="${s}"`)
    .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${s} ${s}"`)
  return withSize
}

export function svgToDataUri(svg) {
  const minified = svg.replace(/>\s+</g, '><').trim()
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(minified)}`
}

export function buildCursorValue(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const svg = buildSvgString(opts.shape, opts.color, opts.customSvg, opts.size)
  const dataUri = svgToDataUri(svg)
  const hx = clamp(Number(opts.hotspotX) || 0, 0, 999)
  const hy = clamp(Number(opts.hotspotY) || 0, 0, 999)
  const fallback = opts.fallback || 'auto'
  return `url("${dataUri}") ${hx} ${hy}, ${fallback}`
}

export function buildCursorCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'custom-cursor'
  const cursorValue = buildCursorValue(opts)
  return `.${cn} {\n  cursor: ${cursorValue};\n}`
}

export function buildCursorHtml(options = {}) {
  const cn = (options && options.className) || 'custom-cursor'
  return `<div class="${cn}">\n  <!-- passe o mouse aqui para ver o cursor personalizado -->\n  Hover here to see the custom cursor\n</div>`
}

export function buildCursorFullDemo(options = {}) {
  const css = buildCursorCss(options)
  const html = buildCursorHtml(options)
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Custom Cursor</title>\n  <style>\n${css.split('\n').map((l) => '    ' + l).join('\n')}\n\n    .demo {\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      min-height: 100vh;\n      background: #f5f5f5;\n    }\n  </style>\n</head>\n<body>\n  <div class="demo custom-cursor">\n    Hover me!\n  </div>\n</body>\n</html>`
}
