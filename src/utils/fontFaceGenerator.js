// Gerador de blocos CSS @font-face.
//
// Monta regras @font-face a partir de uma família, pesos, estilos,
// formatos de arquivo e opções de display/fallback. 100% client-side:
// só concatena strings, nenhuma chamada de rede.

export const FONT_DISPLAYS = ['auto', 'block', 'swap', 'fallback', 'optional']

export const FONT_STYLES = ['normal', 'italic']

export const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

export const FALLBACK_STACKS = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  cursive: "cursive",
  fantasy: "fantasy",
  system: "system-ui, sans-serif",
  none: "",
}

// Formato CSS por extensão/convenção usado em src.
const FORMAT_BY_EXT = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
  eot: 'embedded-opentype',
}

const WEIGHT_LABELS = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
}

// Sugere um nome de arquivo canônico baseado no peso/estilo.
export function suggestFilename(family, weight, style, ext) {
  const base = family.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '') || 'font'
  const suffix = style === 'italic' ? 'Italic' : WEIGHT_LABELS[weight] || weight
  return `${base}-${suffix}.${ext}`
}

// Monta a URL completa (caminho base + caminho relativo/absoluto).
function fullUrl(basePath, path) {
  const base = (basePath || '').trim().replace(/\/$/, '')
  const p = (path || '').trim().replace(/^\//, '')
  if (!p) return ''
  if (!base) return p.startsWith('http') || p.startsWith('data:') ? p : `/${p}`
  return `${base}/${p}`
}

// Monta uma única regra @font-face.
function buildSingleFace(family, weight, style, display, files, basePath, unicodeRange) {
  const lines = []
  lines.push('@font-face {')
  lines.push(`  font-family: '${family}';`)
  lines.push(`  font-style: ${style};`)
  lines.push(`  font-weight: ${weight};`)

  const srcs = []
  // eot precisa vir primeiro no suporte antigo do IE, com ?#iefix pro resto.
  if (files.eot) {
    const url = fullUrl(basePath, files.eot)
    srcs.push(`url('${url}')`)
  }

  const modern = []
  ;['woff2', 'woff', 'ttf', 'otf'].forEach((ext) => {
    if (files[ext]) {
      const url = fullUrl(basePath, files[ext])
      modern.push(`url('${url}') format('${FORMAT_BY_EXT[ext]}')`)
    }
  })
  if (modern.length) {
    srcs.push(...modern)
  }

  if (srcs.length) {
    lines.push(`  src: ${srcs.join(',\n       ')};`)
  }

  if (FONT_DISPLAYS.includes(display)) {
    lines.push(`  font-display: ${display};`)
  }

  const ur = (unicodeRange || '').trim()
  if (ur) {
    lines.push(`  unicode-range: ${ur};`)
  }

  lines.push('}')
  return lines.join('\n')
}

// Fallback font-family pronto pra usar.
export function buildFamilyFallback(family, fallbackKey) {
  const stack = (FALLBACK_STACKS[fallbackKey] || '').trim()
  if (!stack) return `'${family}'`
  return `'${family}', ${stack}`
}

// Gera o CSS completo: blocos @font-face + classe utilitária + preconnect opcional.
export function buildFontFace(config) {
  const {
    family = 'Font',
    weights = [400],
    styles = ['normal'],
    display = 'swap',
    files = {},
    basePath = '',
    unicodeRange = '',
    fallbackKey = 'sans',
    includeUsageClass = true,
    usageClassName = 'font-custom',
    includePreconnect = false,
    preconnectDomains = [],
  } = config

  const blocks = []

  if (includePreconnect && Array.isArray(preconnectDomains) && preconnectDomains.length) {
    preconnectDomains.forEach((domain) => {
      const d = (domain || '').trim()
      if (d) blocks.push(`<link rel="preconnect" href="${d}" crossorigin />`)
    })
    if (blocks.length) blocks.push('')
  }

  weights.forEach((weight) => {
    styles.forEach((style) => {
      const wf = files[weight] || {}
      const block = buildSingleFace(family, weight, style, display, wf, basePath, unicodeRange)
      blocks.push(block)
    })
  })

  const css = blocks.join('\n\n')

  let usage = ''
  if (includeUsageClass) {
    const familyValue = buildFamilyFallback(family, fallbackKey)
    usage = `.${usageClassName} {\n  font-family: ${familyValue};\n}`
  }

  return {
    css,
    usage,
    full: [css, usage].filter(Boolean).join('\n\n'),
    familyFallback: buildFamilyFallback(family, fallbackKey),
  }
}
