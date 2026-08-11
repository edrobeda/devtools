// Gerador de loaders/spinners CSS puros.
//
// Cada tipo emite uma classe `.loading-spinner` pronta para colar, com
// keyframes de nome único para evitar colisão quando várias regras coexistem
// na mesma folha de estilo.

function parseColor(color) {
  if (!color) return '#1677ff'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function alphaColor(color, alpha) {
  const c = parseColor(color)
  // Se já for rgb(...) ou rgba(...), não tentamos parsear; fallback para
  // a cor sólida. Para hex simples (#RGB ou #RRGGBB) derivamos o rgba.
  if (c.startsWith('#')) {
    let hex = c.slice(1)
    if (hex.length === 3) {
      hex = hex.split('').map((ch) => ch + ch).join('')
    }
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return c
}

function indent(lines, spaces = 2) {
  return lines.map((l) => (l ? ' '.repeat(spaces) + l : l)).join('\n')
}

const TYPES = ['border', 'dual-ring', 'pulse', 'dots', 'bars', 'rolling']

function buildBorderSpinner({ size, width, color, duration }) {
  const c = parseColor(color)
  const track = alphaColor(c, 0.2)
  return [
    `.loading-spinner {`,
    `width: ${size}px;`,
    `height: ${size}px;`,
    `border-radius: 50%;`,
    `border: ${width}px solid ${track};`,
    `border-top-color: ${c};`,
    `animation: spinner-spin ${duration}s linear infinite;`,
    `}`,
    `@keyframes spinner-spin {`,
    `0% { transform: rotate(0deg); }`,
    `100% { transform: rotate(360deg); }`,
    `}`,
  ].join('\n')
}

function buildDualRingSpinner({ size, width, color, secondaryColor, duration }) {
  const c = parseColor(color)
  const c2 = parseColor(secondaryColor)
  const innerSize = Math.max(0, size - width * 3)
  return [
    `.loading-spinner {`,
    `width: ${size}px;`,
    `height: ${size}px;`,
    `border-radius: 50%;`,
    `border: ${width}px solid transparent;`,
    `border-top-color: ${c};`,
    `border-bottom-color: ${c};`,
    `animation: spinner-dual ${duration}s linear infinite;`,
    `}`,
    `.loading-spinner::after {`,
    `content: '';`,
    `display: block;`,
    `width: ${innerSize}px;`,
    `height: ${innerSize}px;`,
    `border-radius: 50%;`,
    `border: ${width}px solid transparent;`,
    `border-top-color: ${c2};`,
    `border-bottom-color: ${c2};`,
    `animation: spinner-dual ${duration}s linear infinite reverse;`,
    `}`,
    `@keyframes spinner-dual {`,
    `0% { transform: rotate(0deg); }`,
    `100% { transform: rotate(360deg); }`,
    `}`,
  ].join('\n')
}

function buildPulseSpinner({ size, color, duration }) {
  const c = parseColor(color)
  return [
    `.loading-spinner {`,
    `width: ${size}px;`,
    `height: ${size}px;`,
    `border-radius: 50%;`,
    `background: ${c};`,
    `animation: spinner-pulse ${duration}s ease-in-out infinite;`,
    `}`,
    `@keyframes spinner-pulse {`,
    `0%, 100% { transform: scale(0); opacity: 0.5; }`,
    `50% { transform: scale(1); opacity: 1; }`,
    `}`,
  ].join('\n')
}

function buildDotsSpinner({ size, color, duration, count }) {
  const c = parseColor(color)
  const dotSize = Math.max(2, Math.round(size / 5))
  const gap = Math.max(2, Math.round(dotSize * 0.75))
  const delays = []
  for (let i = 0; i < count; i += 1) {
    const delay = -(duration * ((count - i) / count) * 0.5).toFixed(2)
    delays.push(`  .loading-spinner span:nth-child(${i + 1}) { animation-delay: ${delay}s; }`)
  }
  return [
    `.loading-spinner {`,
    `display: inline-flex;`,
    `align-items: center;`,
    `justify-content: center;`,
    `gap: ${gap}px;`,
    `width: ${size}px;`,
    `height: ${size}px;`,
    `}`,
    `.loading-spinner span {`,
    `width: ${dotSize}px;`,
    `height: ${dotSize}px;`,
    `border-radius: 50%;`,
    `background: ${c};`,
    `animation: spinner-bounce ${duration}s ease-in-out infinite both;`,
    `}`,
    ...delays,
    `@keyframes spinner-bounce {`,
    `0%, 80%, 100% { transform: scale(0); }`,
    `40% { transform: scale(1); }`,
    `}`,
  ].join('\n')
}

function buildBarsSpinner({ size, color, duration, count }) {
  const c = parseColor(color)
  const barWidth = Math.max(2, Math.round(size / 10))
  const barHeight = Math.round(size * 0.28)
  const radius = Math.round(barWidth / 2)
  const rules = []
  for (let i = 0; i < count; i += 1) {
    const deg = (360 / count) * i
    const delay = -(duration * (i / count)).toFixed(3)
    rules.push([
      `.loading-spinner div:nth-child(${i + 1}) {`,
      `transform: translate(-50%, -50%) rotate(${deg}deg);`,
      `animation-delay: ${delay}s;`,
      `}`,
    ].join('\n'))
  }
  return [
    `.loading-spinner {`,
    `position: relative;`,
    `width: ${size}px;`,
    `height: ${size}px;`,
    `}`,
    `.loading-spinner div {`,
    `position: absolute;`,
    `top: 50%;`,
    `left: 50%;`,
    `width: ${barWidth}px;`,
    `height: ${barHeight}px;`,
    `background: ${c};`,
    `border-radius: ${radius}px;`,
    `transform-origin: 50% ${Math.round(size / 2)}px;`,
    `animation: spinner-fade ${duration}s linear infinite;`,
    `}`,
    ...rules,
    `@keyframes spinner-fade {`,
    `0% { opacity: 1; }`,
    `100% { opacity: 0.15; }`,
    `}`,
  ].join('\n')
}

function buildRollingSpinner({ size, width, color, duration }) {
  const c = parseColor(color)
  const track = alphaColor(c, 0.2)
  return [
    `.loading-spinner {`,
    `position: relative;`,
    `width: ${size}px;`,
    `height: ${size}px;`,
    `animation: spinner-roll ${duration}s linear infinite;`,
    `}`,
    `.loading-spinner::before {`,
    `content: '';`,
    `position: absolute;`,
    `inset: 0;`,
    `border-radius: 50%;`,
    `border: ${width}px solid ${track};`,
    `}`,
    `.loading-spinner::after {`,
    `content: '';`,
    `position: absolute;`,
    `inset: 0;`,
    `border-radius: 50%;`,
    `border: ${width}px solid transparent;`,
    `border-top-color: ${c};`,
    `}`,
    `@keyframes spinner-roll {`,
    `0% { transform: rotate(0deg); }`,
    `100% { transform: rotate(360deg); }`,
    `}`,
  ].join('\n')
}

export function buildSpinnerCss({
  type = 'border',
  size = 40,
  width = 4,
  color = '#1677ff',
  secondaryColor = '#13c2c2',
  duration = 1,
  count = 12,
} = {}) {
  const opts = {
    size: Math.max(8, Number(size) || 40),
    width: Math.max(1, Number(width) || 4),
    color,
    secondaryColor,
    duration: Math.max(0.1, Number(duration) || 1),
    count: Math.max(2, Math.min(24, Number(count) || 12)),
  }

  switch (type) {
    case 'border':
      return buildBorderSpinner(opts)
    case 'dual-ring':
      return buildDualRingSpinner(opts)
    case 'pulse':
      return buildPulseSpinner(opts)
    case 'dots':
      return buildDotsSpinner(opts)
    case 'bars':
      return buildBarsSpinner(opts)
    case 'rolling':
      return buildRollingSpinner(opts)
    default:
      return buildBorderSpinner(opts)
  }
}

export function getSpinnerTypes() {
  return TYPES
}

export function getSpinnerDefaults(type = 'border') {
  const defaults = {
    border: { size: 40, width: 4, color: '#1677ff', secondaryColor: '#13c2c2', duration: 1, count: 12 },
    'dual-ring': { size: 48, width: 4, color: '#1677ff', secondaryColor: '#13c2c2', duration: 1.2, count: 12 },
    pulse: { size: 40, width: 4, color: '#1677ff', secondaryColor: '#13c2c2', duration: 1, count: 3 },
    dots: { size: 40, width: 4, color: '#1677ff', secondaryColor: '#13c2c2', duration: 1.4, count: 3 },
    bars: { size: 40, width: 4, color: '#1677ff', secondaryColor: '#13c2c2', duration: 1.2, count: 12 },
    rolling: { size: 40, width: 4, color: '#1677ff', secondaryColor: '#13c2c2', duration: 2, count: 12 },
  }
  return defaults[type] || defaults.border
}
