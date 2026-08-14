// Gerador de efeitos de hover em imagens usando só CSS.
//
// Produz uma classe `.img-hover` (customizável) com `overflow: hidden`, aplica
// transformações e filtros na imagem no hover, e opcionalmente um overlay
// via pseudo-elemento `::before` + `::after` para título e descrição.

function parseColor(color) {
  if (!color) return '#000000'
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

function pct(n) {
  return `${clamp(Number(n) || 0, 0, 100)}%`
}

const DEFAULT_IMAGE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%236678ef'/%3E%3Cstop offset='100%25' stop-color='%23f767c1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='260' fill='url(%23g)'/%3E%3Ccircle cx='320' cy='60' r='40' fill='rgba(255,255,255,0.25)'/%3E%3Cpath d='M0 260 L120 140 L220 220 L320 110 L400 180 L400 260 Z' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E`

const DEFAULTS = {
  className: 'img-hover',
  width: 320,
  height: 220,
  borderRadius: 12,
  borderRadiusHover: 12,
  borderWidth: 0,
  borderColor: '#d9d9d9',
  objectFit: 'cover',
  objectPosition: 'center',
  scale: 1.1,
  rotate: 0,
  translateX: 0,
  translateY: 0,
  grayscale: 0,
  sepia: 0,
  blur: 0,
  brightness: 1,
  contrast: 1,
  saturate: 1,
  hueRotate: 0,
  grayscaleHover: 0,
  sepiaHover: 0,
  blurHover: 0,
  brightnessHover: 1,
  contrastHover: 1,
  saturateHover: 1,
  hueRotateHover: 0,
  shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  shadowHover: '0 12px 28px rgba(0, 0, 0, 0.18)',
  overlay: false,
  overlayColor: '#000000',
  overlayOpacity: 0.45,
  overlayTitle: 'Título',
  overlayText: 'Descrição curta',
  overlayTextColor: '#ffffff',
  overlayPosition: 'bottom',
  transitionDuration: 350,
  transitionEasing: 'ease',
  imageUrl: DEFAULT_IMAGE,
}

const PRESETS = {
  default: { ...DEFAULTS },
  zoom: {
    ...DEFAULTS,
    scale: 1.2,
    shadowHover: '0 16px 32px rgba(0, 0, 0, 0.2)',
  },
  lift: {
    ...DEFAULTS,
    scale: 1.05,
    translateY: -6,
    shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    shadowHover: '0 16px 32px rgba(0, 0, 0, 0.16)',
  },
  grayscale: {
    ...DEFAULTS,
    grayscale: 100,
    saturate: 0,
    grayscaleHover: 0,
    saturateHover: 1,
    scale: 1.08,
  },
  blur: {
    ...DEFAULTS,
    blur: 5,
    brightness: 0.85,
    blurHover: 0,
    brightnessHover: 1.05,
    scale: 1.05,
  },
  overlay: {
    ...DEFAULTS,
    overlay: true,
    overlayOpacity: 0.55,
    overlayTitle: 'Saiba mais',
    overlayText: 'Passe o mouse para ver',
    overlayPosition: 'center',
    scale: 1.08,
  },
  circle: {
    ...DEFAULTS,
    borderRadius: 50,
    borderRadiusHover: 50,
    width: 240,
    height: 240,
    scale: 1.12,
    shadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    shadowHover: '0 12px 32px rgba(0, 0, 0, 0.22)',
  },
  vintage: {
    ...DEFAULTS,
    sepia: 80,
    contrast: 1.1,
    brightness: 0.9,
    sepiaHover: 0,
    brightnessHover: 1.05,
    scale: 1.06,
    borderRadius: 4,
    borderRadiusHover: 8,
    shadow: '0 4px 12px rgba(80, 50, 20, 0.15)',
    shadowHover: '0 14px 28px rgba(80, 50, 20, 0.25)',
  },
}

export { DEFAULTS, PRESETS, DEFAULT_IMAGE }

function buildFilter(opts, hover = false) {
  const parts = []
  const g = hover ? opts.grayscaleHover : opts.grayscale
  const s = hover ? opts.sepiaHover : opts.sepia
  const b = hover ? opts.blurHover : opts.blur
  const br = hover ? opts.brightnessHover : opts.brightness
  const c = hover ? opts.contrastHover : opts.contrast
  const sat = hover ? opts.saturateHover : opts.saturate
  const h = hover ? opts.hueRotateHover : opts.hueRotate

  if (g) parts.push(`grayscale(${pct(g)})`)
  if (s) parts.push(`sepia(${pct(s)})`)
  if (b) parts.push(`blur(${toPx(b)})`)
  if (br !== 1) parts.push(`brightness(${br})`)
  if (c !== 1) parts.push(`contrast(${c})`)
  if (sat !== 1) parts.push(`saturate(${sat})`)
  if (h) parts.push(`hue-rotate(${clamp(Number(h) || 0, 0, 360)}deg)`)

  return parts.length ? parts.join(' ') : 'none'
}

export function buildImageHoverCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'img-hover'
  const width = clamp(Number(opts.width) || 320, 50, 800)
  const height = clamp(Number(opts.height) || 220, 50, 800)
  const borderRadius = clamp(Number(opts.borderRadius) || 0, 0, 50)
  const borderRadiusHover = clamp(Number(opts.borderRadiusHover) || borderRadius, 0, 50)
  const borderWidth = clamp(Number(opts.borderWidth) || 0, 0, 16)
  const borderColor = parseColor(opts.borderColor)
  const scale = clamp(Number(opts.scale) || 1, 0.5, 2)
  const rotate = clamp(Number(opts.rotate) || 0, -180, 180)
  const translateX = Number(opts.translateX) || 0
  const translateY = Number(opts.translateY) || 0
  const duration = clamp(Number(opts.transitionDuration) || 350, 0, 2000)
  const easing = String(opts.transitionEasing || 'ease')
  const objectFit = opts.objectFit || 'cover'
  const objectPosition = opts.objectPosition || 'center'
  const shadow = opts.shadow || 'none'
  const shadowHover = opts.shadowHover || 'none'
  const overlay = !!opts.overlay
  const overlayColor = parseColor(opts.overlayColor)
  const overlayOpacity = clamp(Number(opts.overlayOpacity) || 0, 0, 1)
  const overlayTextColor = parseColor(opts.overlayTextColor)
  const overlayPosition = opts.overlayPosition || 'bottom'

  const baseFilter = buildFilter(opts, false)
  const hoverFilter = buildFilter(opts, true)

  const hasTransform = scale !== 1 || rotate !== 0 || translateX !== 0 || translateY !== 0
  const transform = hasTransform
    ? `scale(${scale.toFixed(2)}) rotate(${rotate}deg) translate(${toPx(translateX)}, ${toPx(translateY)})`
    : 'scale(1.001)'

  const lines = [
    `.${cn} {`,
    '  position: relative;',
    '  display: inline-block;',
    `  width: ${toPx(width)};`,
    `  height: ${toPx(height)};`,
    `  border-radius: ${borderRadius}%;`,
    `  box-shadow: ${shadow};`,
    borderWidth > 0 ? `  border: ${toPx(borderWidth)} solid ${borderColor};` : null,
    '  overflow: hidden;',
    '  cursor: pointer;',
    `  transition: box-shadow ${duration}ms ${easing}, border-radius ${duration}ms ${easing};`,
    '}',
    '',
    `.${cn} img {`,
    '  display: block;',
    '  width: 100%;',
    '  height: 100%;',
    `  object-fit: ${objectFit};`,
    `  object-position: ${objectPosition};`,
    baseFilter !== 'none' ? `  filter: ${baseFilter};` : null,
    `  transform: scale(1) rotate(0deg) translate(0, 0);`,
    `  transition: transform ${duration}ms ${easing}, filter ${duration}ms ${easing};`,
    '}',
    '',
    `.${cn}:hover {`,
    `  border-radius: ${borderRadiusHover}%;`,
    `  box-shadow: ${shadowHover};`,
    '}',
    '',
    `.${cn}:hover img {`,
    `  transform: ${transform};`,
    hoverFilter !== 'none' ? `  filter: ${hoverFilter};` : null,
    '}',
  ]

  if (overlay) {
    lines.push('', `.${cn}::before {`)
    lines.push('  content: "";')
    lines.push('  position: absolute;')
    lines.push('  inset: 0;')
    lines.push(`  background: ${overlayColor};`)
    lines.push(`  opacity: 0;`)
    lines.push('  z-index: 1;')
    lines.push(`  transition: opacity ${duration}ms ${easing};`)
    lines.push('}')
    lines.push('', `.${cn}:hover::before {`)
    lines.push(`  opacity: ${overlayOpacity.toFixed(2)};`)
    lines.push('}')

    let alignItems = 'center'
    let justifyContent = 'center'
    let textAlign = 'center'
    let padding = '24px'
    if (overlayPosition === 'top') {
      alignItems = 'flex-start'
      justifyContent = 'center'
      padding = '20px 24px'
    } else if (overlayPosition === 'bottom') {
      alignItems = 'flex-end'
      justifyContent = 'center'
      padding = '20px 24px'
    } else if (overlayPosition === 'left') {
      alignItems = 'center'
      justifyContent = 'flex-start'
      textAlign = 'left'
      padding = '24px'
    } else if (overlayPosition === 'right') {
      alignItems = 'center'
      justifyContent = 'flex-end'
      textAlign = 'right'
      padding = '24px'
    }

    lines.push('', `.${cn}::after {`)
    lines.push('  content: attr(data-overlay);')
    lines.push('  position: absolute;')
    lines.push('  inset: 0;')
    lines.push('  display: flex;')
    lines.push('  flex-direction: column;')
    lines.push(`  align-items: ${alignItems};`)
    lines.push(`  justify-content: ${justifyContent};`)
    lines.push(`  text-align: ${textAlign};`)
    lines.push(`  padding: ${padding};`)
    lines.push(`  color: ${overlayTextColor};`)
    lines.push('  font-family: inherit;')
    lines.push('  white-space: pre-line;')
    lines.push('  opacity: 0;')
    lines.push('  z-index: 2;')
    lines.push('  pointer-events: none;')
    lines.push(`  transition: opacity ${duration}ms ${easing}, transform ${duration}ms ${easing};`)
    lines.push('}')
    lines.push('', `.${cn}:hover::after {`)
    lines.push('  opacity: 1;')
    if (overlayPosition === 'top' || overlayPosition === 'bottom') {
      lines.push('  transform: translateY(0);')
    } else if (overlayPosition === 'left' || overlayPosition === 'right') {
      lines.push('  transform: translateX(0);')
    } else {
      lines.push('  transform: scale(1);')
    }
    lines.push('}')
  }

  return lines.filter((line) => line !== null).join('\n')
}

export function buildImageHoverHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'img-hover'
  const overlay = !!opts.overlay
  const title = String(opts.overlayTitle || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const text = String(opts.overlayText || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const overlayAttr = overlay ? `${title}${text ? `\n${text}` : ''}` : ''
  const imageUrl = String(opts.imageUrl || DEFAULT_IMAGE).replace(/"/g, '&quot;')
  const attrs = [`class="${cn}"`]
  if (overlay) attrs.push(`data-overlay="${overlayAttr.replace(/"/g, '&quot;')}"`)
  return `<figure ${attrs.join(' ')}>\n  <img src="${imageUrl}" alt="Hover demo" />\n</figure>`
}

export function buildImageHoverFullDemo(options = {}) {
  return `${buildImageHoverCss(options)}\n\n${buildImageHoverHtml(options)}`
}
