// Gerador de truncamento de texto com CSS puro.
//
// Produz classes .line-clamp para dois cenários:
//   - linha única: white-space: nowrap + overflow: hidden + text-overflow: ellipsis
//   - múltiplas linhas: display: -webkit-box + -webkit-line-clamp + -webkit-box-orient
//
// Opcionalmente adiciona um fade-out via ::after com gradiente transparente → fundo,
// útil quando se quer uma transição suave ao final do texto cortado.

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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const DEFAULTS = {
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  mode: 'multi-line',
  lines: 3,
  lineHeight: 1.5,
  maxWidth: 320,
  widthUnit: 'px',
  fontSize: 16,
  textAlign: 'left',
  color: '#262626',
  backgroundColor: '#ffffff',
  useFadeOut: false,
  className: 'line-clamp',
}

export const PRESETS = {
  default: { ...DEFAULTS },
  'single-line': {
    ...DEFAULTS,
    mode: 'single-line',
    text: 'Este título longo será truncado em uma única linha com reticências.',
    maxWidth: 280,
    fontSize: 18,
  },
  card: {
    ...DEFAULTS,
    lines: 2,
    lineHeight: 1.4,
    maxWidth: 260,
    fontSize: 15,
    text: 'Cartões de conteúdo costumam precisar de no máximo duas linhas para manter a altura consistente no grid.',
  },
  paragraph: {
    ...DEFAULTS,
    lines: 4,
    lineHeight: 1.65,
    maxWidth: 480,
    fontSize: 16,
  },
  'fade-out': {
    ...DEFAULTS,
    lines: 3,
    lineHeight: 1.5,
    maxWidth: 300,
    useFadeOut: true,
    backgroundColor: '#f6ffed',
    color: '#135200',
  },
}

export function buildLineClampCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'line-clamp'
  const mode = opts.mode || 'multi-line'
  const lines = clamp(Number(opts.lines) || 1, 1, 20)
  const lineHeight = clamp(Number(opts.lineHeight) || 1.2, 0.8, 3)
  const fontSize = clamp(Number(opts.fontSize) || 16, 10, 120)
  const textAlign = opts.textAlign || 'left'
  const color = parseColor(opts.color)
  const backgroundColor = parseColor(opts.backgroundColor)
  const useFadeOut = Boolean(opts.useFadeOut)

  let widthValue
  const widthUnit = opts.widthUnit || 'px'
  if (widthUnit === '%') {
    widthValue = `${clamp(Number(opts.maxWidth) || 100, 1, 100)}%`
  } else if (widthUnit === 'rem') {
    widthValue = `${clamp(Number(opts.maxWidth) || 20, 1, 80)}rem`
  } else if (widthUnit === 'ch') {
    widthValue = `${clamp(Number(opts.maxWidth) || 40, 1, 200)}ch`
  } else {
    widthValue = `${clamp(Number(opts.maxWidth) || 320, 50, 1200)}px`
  }

  const rules = [
    `.${cn} {`,
    `  max-width: ${widthValue};`,
    `  font-size: ${toPx(fontSize)};`,
    `  line-height: ${lineHeight};`,
    `  text-align: ${textAlign};`,
    `  color: ${color};`,
    '  overflow: hidden;',
  ]

  if (mode === 'single-line') {
    rules.push('  white-space: nowrap;')
    rules.push('  text-overflow: ellipsis;')
  } else {
    rules.push('  display: -webkit-box;')
    rules.push(`  -webkit-line-clamp: ${lines};`)
    rules.push('  -webkit-box-orient: vertical;')
  }

  if (useFadeOut) {
    rules.push('  position: relative;')
    rules.push('}')
    rules.push('')

    if (mode === 'single-line') {
      const fadeWidth = Math.round(fontSize * 2.5)
      rules.push(`.${cn}::after {`)
      rules.push('  content: "";')
      rules.push('  position: absolute;')
      rules.push('  top: 0;')
      rules.push('  right: 0;')
      rules.push(`  width: ${toPx(fadeWidth)};`)
      rules.push('  height: 100%;')
      rules.push(`  background: linear-gradient(to right, transparent, ${backgroundColor});`)
      rules.push('  pointer-events: none;')
      rules.push('}')
    } else {
      const fadeHeight = Math.round(fontSize * lineHeight * 0.9)
      rules.push(`.${cn}::after {`)
      rules.push('  content: "";')
      rules.push('  position: absolute;')
      rules.push('  left: 0;')
      rules.push('  right: 0;')
      rules.push('  bottom: 0;')
      rules.push(`  height: ${toPx(fadeHeight)};`)
      rules.push(`  background: linear-gradient(to top, ${backgroundColor}, transparent);`)
      rules.push('  pointer-events: none;')
      rules.push('}')
    }
  } else {
    rules.push('}')
  }

  return rules.join('\n')
}

export function buildLineClampHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'line-clamp'
  const tag = opts.mode === 'single-line' ? 'span' : 'p'
  return `<${tag} class="${cn}">\n  ${escapeHtml(opts.text || '')}\n</${tag}>`
}

export function buildLineClampFullDemo(options = {}) {
  const css = buildLineClampCss(options)
  const html = buildLineClampHtml(options)
  const backgroundColor = parseColor(options.backgroundColor || DEFAULTS.backgroundColor)
  const color = parseColor(options.color || DEFAULTS.color)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Line Clamp</title>
  <style>
    body {
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      background: ${backgroundColor};
      color: ${color};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
${css.split('\n').map((l) => `    ${l}`).join('\n')}
  </style>
</head>
<body>
  ${html.replace(/\n/g, '\n  ')}
</body>
</html>`
}

export function buildPreviewStyle(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const mode = opts.mode || 'multi-line'
  const lines = clamp(Number(opts.lines) || 1, 1, 20)
  const lineHeight = clamp(Number(opts.lineHeight) || 1.2, 0.8, 3)
  const fontSize = clamp(Number(opts.fontSize) || 16, 10, 120)
  const textAlign = opts.textAlign || 'left'
  const color = parseColor(opts.color)

  let widthValue
  const widthUnit = opts.widthUnit || 'px'
  if (widthUnit === '%') {
    widthValue = `${clamp(Number(opts.maxWidth) || 100, 1, 100)}%`
  } else if (widthUnit === 'rem') {
    widthValue = `${clamp(Number(opts.maxWidth) || 20, 1, 80)}rem`
  } else if (widthUnit === 'ch') {
    widthValue = `${clamp(Number(opts.maxWidth) || 40, 1, 200)}ch`
  } else {
    widthValue = `${clamp(Number(opts.maxWidth) || 320, 50, 1200)}px`
  }

  const style = {
    maxWidth: widthValue,
    fontSize: toPx(fontSize),
    lineHeight,
    textAlign,
    color,
    overflow: 'hidden',
  }

  if (mode === 'single-line') {
    style.whiteSpace = 'nowrap'
    style.textOverflow = 'ellipsis'
  } else {
    style.display = '-webkit-box'
    style.WebkitLineClamp = lines
    style.WebkitBoxOrient = 'vertical'
  }

  return style
}

export function buildFadeOverlayStyle(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const mode = opts.mode || 'multi-line'
  const lineHeight = clamp(Number(opts.lineHeight) || 1.2, 0.8, 3)
  const fontSize = clamp(Number(opts.fontSize) || 16, 10, 120)
  const backgroundColor = parseColor(opts.backgroundColor)

  if (mode === 'single-line') {
    return {
      position: 'absolute',
      top: 0,
      right: 0,
      width: toPx(Math.round(fontSize * 2.5)),
      height: '100%',
      background: `linear-gradient(to right, transparent, ${backgroundColor})`,
      pointerEvents: 'none',
    }
  }

  return {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: toPx(Math.round(fontSize * lineHeight * 0.9)),
    background: `linear-gradient(to top, ${backgroundColor}, transparent)`,
    pointerEvents: 'none',
  }
}
