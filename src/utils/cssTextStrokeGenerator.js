// Gerador de texto com contorno/outlined CSS puro.
//
// Produz efeitos de contorno em texto usando três técnicas:
//   - webkit-text-stroke (contorno centrado no glifo)
//   - text-shadow em 8/16/24 direções (contorno "por fora")
//   - paint-order: stroke fill combinado com webkit-text-stroke
//     (preenchimento por cima do contorno, dando aparência interna)

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

function buildTextShadowOutline(width, color, precision = 'medium') {
  const w = clamp(Number(width) || 1, 0, 20)
  const c = parseColor(color)
  if (w <= 0) return 'none'

  const steps = { low: 4, medium: 8, high: 16 }[precision] || 8
  const shadows = []
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    const x = Math.cos(angle) * w
    const y = Math.sin(angle) * w
    shadows.push(`${toPx(x)} ${toPx(y)} 0 ${c}`)
  }
  return shadows.join(', ')
}

function buildTextShadowStack(width, color) {
  // Versão mais densa em camadas para simular contorno contínuo.
  const w = clamp(Number(width) || 1, 0, 20)
  const c = parseColor(color)
  if (w <= 0) return 'none'

  const layers = []
  for (let r = 1; r <= w; r += Math.max(1, w / 4)) {
    const radius = Math.min(r, w)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      layers.push(`${toPx(x)} ${toPx(y)} 0 ${c}`)
    }
  }
  return layers.join(', ')
}

export const DEFAULTS = {
  text: 'Outline',
  fontSize: 72,
  fontWeight: 800,
  letterSpacing: 2,
  lineHeight: 1.1,
  textTransform: 'uppercase',
  textAlign: 'center',
  fillColor: '#ffffff',
  strokeColor: '#1677ff',
  strokeWidth: 3,
  strokePosition: 'center', // center | outside | inside
  useShadowStack: false,
  shadowBlur: 0,
  shadowColor: 'transparent',
  backgroundColor: '#0f172a',
  className: 'outlined-text',
}

export const PRESETS = {
  default: { ...DEFAULTS, text: 'Outline' },
  neon: {
    ...DEFAULTS,
    text: 'NEON',
    fillColor: '#ffffff',
    strokeColor: '#00f2ff',
    strokeWidth: 2,
    strokePosition: 'center',
    shadowColor: '#00f2ff',
    shadowBlur: 16,
    backgroundColor: '#0a0a0a',
  },
  poster: {
    ...DEFAULTS,
    text: 'POSTER',
    fillColor: '#ff4d4f',
    strokeColor: '#ffffff',
    strokeWidth: 4,
    strokePosition: 'outside',
    fontSize: 90,
    letterSpacing: 6,
    backgroundColor: '#1a1a1a',
  },
  hollow: {
    ...DEFAULTS,
    text: 'Hollow',
    fillColor: 'transparent',
    strokeColor: '#000000',
    strokeWidth: 2,
    strokePosition: 'center',
    backgroundColor: '#f6ffed',
  },
  retro: {
    ...DEFAULTS,
    text: 'RETRO',
    fillColor: '#ffe58f',
    strokeColor: '#cf1322',
    strokeWidth: 3,
    strokePosition: 'outside',
    letterSpacing: 8,
    shadowColor: 'rgba(207, 19, 34, 0.4)',
    shadowBlur: 0,
    backgroundColor: '#fffbe6',
  },
  elegant: {
    ...DEFAULTS,
    text: 'Elegant',
    fontWeight: 400,
    fontSize: 64,
    textTransform: 'none',
    fillColor: '#ffffff',
    strokeColor: '#d4af37',
    strokeWidth: 1,
    strokePosition: 'inside',
    letterSpacing: 0,
    backgroundColor: '#1f1f1f',
  },
}

export function buildTextStrokeCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const {
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    textTransform,
    textAlign,
    fillColor,
    strokeColor,
    strokeWidth,
    strokePosition,
    useShadowStack,
    shadowBlur,
    shadowColor,
    className,
  } = opts

  const rules = []
  rules.push(`.${className} {`)
  rules.push(`  font-size: ${toPx(fontSize)};`)
  rules.push(`  font-weight: ${fontWeight};`)
  rules.push(`  line-height: ${lineHeight};`)
  rules.push(`  letter-spacing: ${toPx(letterSpacing)};`)
  rules.push(`  text-transform: ${textTransform};`)
  rules.push(`  text-align: ${textAlign};`)
  rules.push(`  color: ${parseColor(fillColor)};`)

  if (strokePosition === 'outside') {
    rules.push(`  -webkit-text-fill-color: ${parseColor(fillColor)};`)
    rules.push(`  -webkit-text-stroke: 0 ${parseColor(strokeColor)};`)
    const shadow = useShadowStack
      ? buildTextShadowStack(strokeWidth, strokeColor)
      : buildTextShadowOutline(strokeWidth, strokeColor)
    rules.push(`  text-shadow: ${shadow};`)
  } else if (strokePosition === 'inside') {
    rules.push(`  -webkit-text-fill-color: ${parseColor(fillColor)};`)
    rules.push(`  -webkit-text-stroke: ${toPx(strokeWidth)} ${parseColor(strokeColor)};`)
    rules.push(`  paint-order: stroke fill;`)
  } else {
    // center
    rules.push(`  -webkit-text-fill-color: ${parseColor(fillColor)};`)
    rules.push(`  -webkit-text-stroke: ${toPx(strokeWidth)} ${parseColor(strokeColor)};`)
  }

  if (shadowBlur > 0 && parseColor(shadowColor) !== 'transparent') {
    const baseShadow = strokePosition === 'outside'
      ? `, 0 0 ${toPx(shadowBlur)} ${parseColor(shadowColor)}`
      : `0 0 ${toPx(shadowBlur)} ${parseColor(shadowColor)}`
    if (strokePosition === 'outside') {
      // Já existe text-shadow; adiciona glow ao final.
      const existing = useShadowStack
        ? buildTextShadowStack(strokeWidth, strokeColor)
        : buildTextShadowOutline(strokeWidth, strokeColor)
      rules[rules.length - 1] = `  text-shadow: ${existing}${baseShadow};`
    } else {
      rules.push(`  text-shadow: ${baseShadow};`)
    }
  }

  rules.push('}')
  return rules.join('\n')
}

export function buildTextStrokeHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const { text, className } = opts
  return `<h1 class="${className}">${text}</h1>`
}

export function buildTextStrokeFullDemo(options = {}) {
  const css = buildTextStrokeCss(options)
  const html = buildTextStrokeHtml(options)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Outlined Text</title>
  <style>
    body {
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
      background: ${parseColor(options.backgroundColor || DEFAULTS.backgroundColor)};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
${css.split('\n').map((l) => `    ${l}`).join('\n')}
  </style>
</head>
<body>
  ${html}
</body>
</html>`
}

export function buildPreviewStyle(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const {
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    textTransform,
    textAlign,
    fillColor,
    strokeColor,
    strokeWidth,
    strokePosition,
    useShadowStack,
    shadowBlur,
    shadowColor,
  } = opts

  const style = {
    fontSize: toPx(fontSize),
    fontWeight,
    lineHeight,
    letterSpacing: toPx(letterSpacing),
    textTransform,
    textAlign,
    color: parseColor(fillColor),
    WebkitTextFillColor: parseColor(fillColor),
  }

  if (strokePosition === 'outside') {
    style.WebkitTextStroke = `0 ${parseColor(strokeColor)}`
    style.textShadow = useShadowStack
      ? buildTextShadowStack(strokeWidth, strokeColor)
      : buildTextShadowOutline(strokeWidth, strokeColor)
  } else if (strokePosition === 'inside') {
    style.WebkitTextStroke = `${toPx(strokeWidth)} ${parseColor(strokeColor)}`
    style.paintOrder = 'stroke fill'
  } else {
    style.WebkitTextStroke = `${toPx(strokeWidth)} ${parseColor(strokeColor)}`
  }

  if (shadowBlur > 0 && parseColor(shadowColor) !== 'transparent') {
    const glow = `0 0 ${toPx(shadowBlur)} ${parseColor(shadowColor)}`
    if (strokePosition === 'outside') {
      style.textShadow = `${style.textShadow}, ${glow}`
    } else {
      style.textShadow = glow
    }
  }

  return style
}
