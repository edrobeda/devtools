// Gerador de Neumorfismo / Soft UI em CSS puro.
//
// Cria efeitos de elevação e pressão usando sombras duplas e gradientes
// suaves a partir de uma cor base. Funciona 100% no cliente.

function parseColor(color) {
  if (!color) return '#e0e5ec'
  if (typeof color === 'string') return color
  if (color && typeof color.toHexString === 'function') return color.toHexString()
  return String(color)
}

function hexToRgb(hex) {
  const clean = parseColor(hex).replace('#', '')
  if (clean.length === 3) {
    const [r, g, b] = clean.split('').map((c) => parseInt(c + c, 16))
    return { r, g, b }
  }
  const bigint = parseInt(clean, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function shadeColor(hex, percent) {
  const { r, g, b } = hexToRgb(hex)
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent) / 100
  return rgbToHex(
    r + (t - r) * p,
    g + (t - g) * p,
    b + (t - b) * p
  )
}

function toPx(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}px` : '0px'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

const DEFAULTS = {
  bgColor: '#e0e5ec',
  textColor: '#4a5568',
  direction: 'top-left',
  depth: 12,
  blur: 24,
  intensity: 18,
  borderRadius: 24,
  width: 220,
  height: 140,
  shape: 'raised',
  transitionDuration: 250,
  showButton: true,
  buttonText: 'Button',
}

const PRESETS = {
  lightSoft: {
    bgColor: '#e0e5ec',
    textColor: '#4a5568',
    direction: 'top-left',
    depth: 10,
    blur: 20,
    intensity: 14,
    borderRadius: 24,
    shape: 'raised',
  },
  lightStrong: {
    bgColor: '#f0f3f8',
    textColor: '#2d3748',
    direction: 'top-left',
    depth: 16,
    blur: 32,
    intensity: 22,
    borderRadius: 20,
    shape: 'raised',
  },
  darkSoft: {
    bgColor: '#2b2f38',
    textColor: '#e2e8f0',
    direction: 'top-left',
    depth: 10,
    blur: 20,
    intensity: 14,
    borderRadius: 24,
    shape: 'raised',
  },
  darkStrong: {
    bgColor: '#1a202c',
    textColor: '#edf2f7',
    direction: 'top-left',
    depth: 16,
    blur: 32,
    intensity: 22,
    borderRadius: 20,
    shape: 'raised',
  },
  minimal: {
    bgColor: '#f7fafc',
    textColor: '#4a5568',
    direction: 'top-left',
    depth: 6,
    blur: 12,
    intensity: 10,
    borderRadius: 16,
    shape: 'raised',
  },
  pressed: {
    bgColor: '#e0e5ec',
    textColor: '#4a5568',
    direction: 'top-left',
    depth: 8,
    blur: 16,
    intensity: 16,
    borderRadius: 24,
    shape: 'pressed',
  },
  concave: {
    bgColor: '#e0e5ec',
    textColor: '#4a5568',
    direction: 'top-left',
    depth: 12,
    blur: 24,
    intensity: 16,
    borderRadius: 24,
    shape: 'concave',
  },
  convex: {
    bgColor: '#e0e5ec',
    textColor: '#4a5568',
    direction: 'top-left',
    depth: 12,
    blur: 24,
    intensity: 16,
    borderRadius: 24,
    shape: 'convex',
  },
}

const DIRECTIONS = {
  'top-left': { x: 1, y: 1 },
  'top-right': { x: -1, y: 1 },
  'bottom-left': { x: 1, y: -1 },
  'bottom-right': { x: -1, y: -1 },
}

export { DEFAULTS, PRESETS }

export function buildNeumorphismCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const bg = parseColor(opts.bgColor)
  const text = parseColor(opts.textColor)
  const direction = DIRECTIONS[opts.direction] || DIRECTIONS['top-left']
  const depth = clamp(Number(opts.depth) || 12, 0, 64)
  const blur = clamp(Number(opts.blur) || 24, 0, 128)
  const intensity = clamp(Number(opts.intensity) || 18, 0, 80)
  const borderRadius = clamp(Number(opts.borderRadius) || 24, 0, 128)
  const width = clamp(Number(opts.width) || 220, 80, 600)
  const height = clamp(Number(opts.height) || 140, 40, 600)
  const shape = ['raised', 'pressed', 'concave', 'convex'].includes(opts.shape) ? opts.shape : 'raised'
  const duration = clamp(Number(opts.transitionDuration) || 250, 0, 2000)

  const darkColor = shadeColor(bg, -intensity)
  const lightColor = shadeColor(bg, intensity)

  const dx = Math.round(depth * direction.x)
  const dy = Math.round(depth * direction.y)
  const darkX = dx >= 0 ? `${toPx(dx)}` : `${toPx(Math.abs(dx))}`
  const darkY = dy >= 0 ? `${toPx(dy)}` : `${toPx(Math.abs(dy))}`
  const lightX = dx >= 0 ? `${toPx(-dx)}` : `${toPx(Math.abs(dx))}`
  const lightY = dy >= 0 ? `${toPx(-dy)}` : `${toPx(Math.abs(dy))}`

  const darkShadow = `${darkX} ${darkY} ${toPx(blur)} ${darkColor}`
  const lightShadow = `${lightX} ${lightY} ${toPx(blur)} ${lightColor}`

  let boxShadow = ''
  if (shape === 'raised') {
    boxShadow = `${darkShadow}, ${lightShadow}`
  } else if (shape === 'pressed') {
    boxShadow = `inset ${darkShadow}, inset ${lightShadow}`
  } else if (shape === 'concave' || shape === 'convex') {
    boxShadow = `inset ${darkShadow}, inset ${lightShadow}`
  }

  let gradient = ''
  if (shape === 'concave') {
    gradient = `linear-gradient(145deg, ${darkColor}, ${lightColor})`
  } else if (shape === 'convex') {
    gradient = `linear-gradient(145deg, ${lightColor}, ${darkColor})`
  }

  const transition = `box-shadow ${duration}ms ease, transform ${duration}ms ease`

  const lines = [
    '/* Neumorphism container */',
    '.neu {',
    `  --neu-bg: ${bg};`,
    `  --neu-text: ${text};`,
    `  --neu-light: ${lightColor};`,
    `  --neu-dark: ${darkColor};`,
    '',
    `  width: ${toPx(width)};`,
    `  height: ${toPx(height)};`,
    `  background: ${gradient || 'var(--neu-bg)'};`,
    `  border-radius: ${toPx(borderRadius)};`,
    `  color: var(--neu-text);`,
    `  box-shadow: ${boxShadow};`,
    `  transition: ${transition};`,
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '  text-align: center;',
    '  padding: 20px;',
    '  box-sizing: border-box;',
    '}',
    '',
    '/* Hover sutil para estados raised/convex */',
    shape === 'raised' || shape === 'convex'
      ? `.neu:hover {\n  transform: translateY(-2px);\n}`
      : null,
    '',
    '/* Estado pressionado ao clicar */',
    `.neu:active {`,
    `  box-shadow: inset ${darkShadow}, inset ${lightShadow};`,
    `  transform: translateY(0);`,
    '}',
    '',
    '/* Elemento de exemplo interno */',
    '.neu__content {',
    '  display: flex;',
    '  flex-direction: column;',
    '  align-items: center;',
    '  gap: 8px;',
    '}',
    '',
    '.neu__title {',
    '  margin: 0;',
    '  font-size: 1.125rem;',
    '  font-weight: 600;',
    '}',
    '',
    '.neu__button {',
    `  background: ${bg};`,
    `  color: var(--neu-text);`,
    '  border: none;',
    `  border-radius: ${toPx(Math.max(4, borderRadius / 2))};`,
    '  padding: 8px 16px;',
    '  font-weight: 600;',
    '  cursor: pointer;',
    `  box-shadow: ${darkShadow}, ${lightShadow};`,
    `  transition: ${transition};`,
    '}',
    '',
    '.neu__button:hover {',
    '  transform: translateY(-1px);',
    '}',
    '',
    '.neu__button:active {',
    `  box-shadow: inset ${darkShadow}, inset ${lightShadow};`,
    '  transform: translateY(0);',
    '}',
    '',
    '/* Wrapper para o preview */',
    '.neu-wrapper {',
    `  background: ${bg};`,
    '  padding: 40px;',
    '  border-radius: 8px;',
    '  display: inline-block;',
    '}',
  ]

  return lines.filter((line) => line !== null).join('\n')
}

export function buildNeumorphismHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const showButton = Boolean(opts.showButton)
  const buttonText = String(opts.buttonText || 'Button')
  const title = String(opts.title || 'Soft UI')
  const body = String(opts.body || 'Neumorphism card')

  return [
    '<div class="neu-wrapper">',
    '  <div class="neu">',
    '    <div class="neu__content">',
    `      <div class="neu__title">${title}</div>`,
    `      <div>${body}</div>`,
    showButton ? `      <button class="neu__button">${buttonText}</button>` : '',
    '    </div>',
    '  </div>',
    '</div>',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildNeumorphismFullDemo(options = {}) {
  return `${buildNeumorphismCss(options)}\n\n${buildNeumorphismHtml(options)}`
}
