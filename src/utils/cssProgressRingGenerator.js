// Gerador de progress ring CSS puro.
//
// Cria anéis de progresso circulares usando SVG + CSS: círculo de fundo
// (track), círculo de preenchimento com stroke-dasharray/dashoffset e label
// central opcional. Tudo renderiza sem JavaScript no uso final.

function parseColor(color) {
  if (!color) return '#ffffff'
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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const DEFAULTS = {
  className: 'progress-ring',
  size: 160,
  strokeWidth: 14,
  value: 65,
  max: 100,
  trackColor: '#f0f0f0',
  fillColor: '#1677ff',
  textColor: '#262626',
  holeColor: '#ffffff',
  showLabel: true,
  labelTemplate: '{value}%',
  roundedCap: true,
  strokeLinecap: 'round',
  startAngle: -90,
  direction: 'clockwise',
  animationDuration: 600,
  easing: 'ease-out',
  shadow: 'none',
}

const PRESETS = {
  default: {
    size: 160,
    strokeWidth: 14,
    trackColor: '#f0f0f0',
    fillColor: '#1677ff',
    textColor: '#262626',
    holeColor: '#ffffff',
    roundedCap: true,
  },
  success: {
    size: 160,
    strokeWidth: 14,
    trackColor: '#f6ffed',
    fillColor: '#52c41a',
    textColor: '#135200',
    holeColor: '#ffffff',
    roundedCap: true,
  },
  warning: {
    size: 160,
    strokeWidth: 14,
    trackColor: '#fffbe6',
    fillColor: '#faad14',
    textColor: '#613400',
    holeColor: '#ffffff',
    roundedCap: true,
  },
  danger: {
    size: 160,
    strokeWidth: 14,
    trackColor: '#fff1f0',
    fillColor: '#ff4d4f',
    textColor: '#820014',
    holeColor: '#ffffff',
    roundedCap: true,
  },
  minimal: {
    size: 140,
    strokeWidth: 6,
    trackColor: '#e5e5ea',
    fillColor: '#000000',
    textColor: '#000000',
    holeColor: '#ffffff',
    roundedCap: false,
  },
  neon: {
    size: 180,
    strokeWidth: 16,
    trackColor: '#111827',
    fillColor: '#22d3ee',
    textColor: '#22d3ee',
    holeColor: '#0b1220',
    roundedCap: true,
    shadow: '0 0 20px rgba(34, 211, 238, 0.45)',
  },
}

export { DEFAULTS, PRESETS }

export function buildProgressRingCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || DEFAULTS.className
  const size = clamp(Number(opts.size) || DEFAULTS.size, 40, 400)
  const strokeWidth = clamp(Number(opts.strokeWidth) || DEFAULTS.strokeWidth, 2, 60)
  const value = Number(opts.value) || 0
  const max = Math.max(1, Number(opts.max) || DEFAULTS.max)
  const percent = clamp((value / max) * 100, 0, 100)
  const trackColor = parseColor(opts.trackColor)
  const fillColor = parseColor(opts.fillColor)
  const textColor = parseColor(opts.textColor)
  const holeColor = parseColor(opts.holeColor)
  const roundedCap = Boolean(opts.roundedCap)
  const strokeLinecap = roundedCap ? 'round' : 'butt'
  const startAngle = Number(opts.startAngle) || -90
  const direction = opts.direction === 'counter-clockwise' ? -1 : 1
  const duration = clamp(Number(opts.animationDuration) || DEFAULTS.animationDuration, 0, 5000)
  const easing = opts.easing || DEFAULTS.easing
  const shadow = opts.shadow || 'none'

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent / 100)
  const center = size / 2

  const rotate = `rotate(${startAngle} ${center} ${center})`
  const scale = direction === -1 ? `scale(-1, 1) translate(-${size}, 0)` : ''

  const lines = [
    '/* Progress ring container */',
    `.${cn} {`,
    `  --value: ${percent.toFixed(2)};`,
    `  width: ${toPx(size)};`,
    `  height: ${toPx(size)};`,
    `  position: relative;`,
    `  display: inline-flex;`,
    `  align-items: center;`,
    `  justify-content: center;`,
    `}`,
    '',
    '/* SVG canvas */',
    `.${cn}__svg {`,
    `  width: 100%;`,
    `  height: 100%;`,
    `  transform: ${rotate};`,
    shadow !== 'none' ? `  filter: drop-shadow(${shadow});` : null,
    '}',
    '',
    '/* Track circle */',
    `.${cn}__track {`,
    `  fill: ${holeColor};`,
    `  stroke: ${trackColor};`,
    `  stroke-width: ${strokeWidth};`,
    `  stroke-linecap: ${strokeLinecap};`,
    '}',
    '/* Progress circle */',
    `.${cn}__circle {`,
    `  fill: transparent;`,
    `  stroke: ${fillColor};`,
    `  stroke-width: ${strokeWidth};`,
    `  stroke-linecap: ${strokeLinecap};`,
    `  stroke-dasharray: ${circumference.toFixed(2)};`,
    `  stroke-dashoffset: ${dashOffset.toFixed(2)};`,
    `  transition: stroke-dashoffset ${duration}ms ${easing};`,
    `  transform-origin: center;`,
    direction === -1 ? `  transform: scaleX(-1);` : null,
    '}',
    '/* Center label */',
    `.${cn}__label {`,
    `  position: absolute;`,
    `  inset: 0;`,
    `  display: flex;`,
    `  align-items: center;`,
    `  justify-content: center;`,
    `  color: ${textColor};`,
    `  font-size: ${Math.max(12, Math.round(size * 0.22))}px;`,
    `  font-weight: 600;`,
    `  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`,
    `  pointer-events: none;`,
    '}',
    '/* Reduced motion preference */',
    `@media (prefers-reduced-motion: reduce) {`,
    `  .${cn}__circle {`,
    `    transition: none;`,
    `  }`,
    '}',
  ]

  return lines.filter(Boolean).join('\n')
}

export function buildProgressRingHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || DEFAULTS.className
  const size = clamp(Number(opts.size) || DEFAULTS.size, 40, 400)
  const strokeWidth = clamp(Number(opts.strokeWidth) || DEFAULTS.strokeWidth, 2, 60)
  const value = Number(opts.value) || 0
  const max = Math.max(1, Number(opts.max) || DEFAULTS.max)
  const percent = clamp((value / max) * 100, 0, 100)
  const roundedCap = Boolean(opts.roundedCap)
  const strokeLinecap = roundedCap ? 'round' : 'butt'
  const startAngle = Number(opts.startAngle) || -90
  const direction = opts.direction === 'counter-clockwise' ? -1 : 1

  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const roundedPercent = Math.round(percent)
  const label = String(opts.labelTemplate || '{value}%').replace(/\{value\}/g, roundedPercent)
  const showLabel = opts.showLabel !== false

  const rotateAttr = `transform="rotate(${startAngle} ${center} ${center})"`

  return `<div class="${cn}" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}">
  <svg class="${cn}__svg" viewBox="0 0 ${size} ${size}" ${rotateAttr}>
    <circle
      class="${cn}__track"
      cx="${center}"
      cy="${center}"
      r="${radius}"
    />
    <circle
      class="${cn}__circle"
      cx="${center}"
      cy="${center}"
      r="${radius}"
    />
  </svg>
  ${showLabel ? `<span class="${cn}__label">${escapeHtml(label)}</span>` : ''}
</div>`
}

export function buildProgressRingFullDemo(options = {}) {
  const css = buildProgressRingCss(options)
  const html = buildProgressRingHtml(options)
  return `<!-- HTML -->
${html}

/* CSS */
${css}`
}
