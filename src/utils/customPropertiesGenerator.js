// Gerador de CSS Custom Properties (design tokens) — 100% client-side.
// Converte cores em hex para HSL, clareia/escurece e emite um bloco :root
// pronto para usar em qualquer projeto CSS.

export const COLOR_NAMES = [
  'primary',
  'secondary',
  'success',
  'warning',
  'error',
  'info',
  'background',
  'surface',
  'text',
]

export const DEFAULT_SETTINGS = {
  prefix: 'dt',
  colors: {
    primary: '#1677ff',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#13c2c2',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#262626',
  },
  lightFactor: 0.28,
  darkFactor: -0.22,
  includeShades: true,
  spacingUnit: 0.25,
  spacingSteps: 6,
  radius: {
    sm: 0.25,
    md: 0.5,
    lg: 1,
  },
  shadows: {
    enabled: true,
    color: 'rgba(0, 0, 0, 0.1)',
    sm: '0 1px 2px 0',
    md: '0 4px 6px -1px',
    lg: '0 10px 15px -3px',
  },
  typography: {
    xs: 0.75,
    sm: 0.875,
    md: 1,
    lg: 1.25,
    xl: 1.5,
  },
}

export const PRESETS = [
  {
    key: 'default',
    colors: {
      primary: '#1677ff',
      secondary: '#722ed1',
      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      info: '#13c2c2',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#262626',
    },
  },
  {
    key: 'dark',
    colors: {
      primary: '#4c9aff',
      secondary: '#b37feb',
      success: '#7fd13b',
      warning: '#ffc53d',
      error: '#ff7875',
      info: '#36cfc9',
      background: '#141414',
      surface: '#1f1f1f',
      text: '#f0f0f0',
    },
  },
  {
    key: 'pastel',
    colors: {
      primary: '#7fb3ff',
      secondary: '#c9a0dc',
      success: '#a8e6a3',
      warning: '#ffe082',
      error: '#ff9e9e',
      info: '#80deea',
      background: '#fffefc',
      surface: '#f8f6f1',
      text: '#4a4a4a',
    },
  },
  {
    key: 'forest',
    colors: {
      primary: '#2e7d32',
      secondary: '#558b2f',
      success: '#43a047',
      warning: '#f9a825',
      error: '#c62828',
      info: '#00897b',
      background: '#f1f8e9',
      surface: '#dcedc8',
      text: '#1b5e20',
    },
  },
]

// ─── Conversão de cores hex ↔ rgb ↔ hsl ───────────────────────────

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function hexToRgb(hex) {
  const cleaned = (hex || '').replace('#', '')
  if (cleaned.length === 3) {
    const [r, g, b] = cleaned.split('').map((c) => parseInt(c + c, 16))
    return { r, g, b }
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    return { r, g, b }
  }
  return { r: 0, g: 0, b: 0 }
}

function rgbToHsl(r, g, b) {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case R:
        h = (G - B) / d + (G < B ? 6 : 0)
        break
      case G:
        h = (B - R) / d + 2
        break
      case B:
        h = (R - G) / d + 4
        break
      default:
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToRgb(h, s, l) {
  const H = h / 360
  const S = s / 100
  const L = l / 100
  let r, g, b

  if (S === 0) {
    r = g = b = L
  } else {
    const hue2rgb = (p, q, t) => {
      let T = t
      if (T < 0) T += 1
      if (T > 1) T -= 1
      if (T < 1 / 6) return p + (q - p) * 6 * T
      if (T < 1 / 2) return q
      if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6
      return p
    }
    const q = L < 0.5 ? L * (1 + S) : L + S - L * S
    const p = 2 * L - q
    r = hue2rgb(p, q, H + 1 / 3)
    g = hue2rgb(p, q, H)
    b = hue2rgb(p, q, H - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function componentToHex(c) {
  const hex = c.toString(16)
  return hex.length === 1 ? `0${hex}` : hex
}

export function rgbToHex(r, g, b) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`
}

export function adjustHexLightness(hex, factor) {
  const { r, g, b } = hexToRgb(hex)
  let { h, s, l } = rgbToHsl(r, g, b)
  l = clamp(l + Math.round(factor * 100), 5, 95)
  // Cores muito acinzentadas ganham um pouco de saturação ao clarear,
  // evitando que fiquem "mortas" demais.
  if (s < 15 && factor > 0) s = clamp(s + 8, 0, 100)
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

// ─── Geração dos tokens ─────────────────────────────────────────

function sanitizePrefix(prefix) {
  const safe = (prefix || 'dt').trim().replace(/[^a-zA-Z0-9_-]/g, '-')
  return safe ? `${safe}-` : ''
}

export function buildColorScale(baseHex, lightFactor, darkFactor) {
  return {
    light: adjustHexLightness(baseHex, lightFactor),
    DEFAULT: baseHex,
    dark: adjustHexLightness(baseHex, darkFactor),
  }
}

function line(prefix, name, value) {
  return `  --${prefix}${name}: ${value};`
}

export function buildCustomPropertiesCss(settings) {
  const prefix = sanitizePrefix(settings.prefix)
  const lines = []

  lines.push(':root {')

  // Cores semânticas
  lines.push('  /* Cores semânticas */')
  for (const name of COLOR_NAMES) {
    const base = settings.colors[name] || '#000000'
    const scale = buildColorScale(base, settings.lightFactor, settings.darkFactor)
    if (settings.includeShades) {
      lines.push(line(prefix, `color-${name}-light`, scale.light))
      lines.push(line(prefix, `color-${name}`, scale.DEFAULT))
      lines.push(line(prefix, `color-${name}-dark`, scale.dark))
    } else {
      lines.push(line(prefix, `color-${name}`, scale.DEFAULT))
    }
  }

  // Escala de espaçamento
  lines.push('')
  lines.push('  /* Espaçamento */')
  const spacingLabels = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const steps = clamp(settings.spacingSteps || 0, 1, 8)
  for (let i = 0; i < steps; i += 1) {
    const label = spacingLabels[i] || `${i + 1}`
    const value = ((i + 1) * (settings.spacingUnit || 0.25)).toFixed(2).replace(/\.00$/, '')
    lines.push(line(prefix, `space-${label}`, `${value}rem`))
  }

  // Border radius
  lines.push('')
  lines.push('  /* Bordas arredondadas */')
  const { radius } = settings
  lines.push(line(prefix, 'radius-sm', `${radius.sm}rem`))
  lines.push(line(prefix, 'radius-md', `${radius.md}rem`))
  lines.push(line(prefix, 'radius-lg', `${radius.lg}rem`))

  // Sombras
  if (settings.shadows.enabled) {
    lines.push('')
    lines.push('  /* Sombras */')
    const { color, sm, md, lg } = settings.shadows
    lines.push(line(prefix, 'shadow-sm', `${sm} ${color}`))
    lines.push(line(prefix, 'shadow-md', `${md} ${color}, 0 2px 4px -2px ${color}`))
    lines.push(line(prefix, 'shadow-lg', `${lg} ${color}, 0 4px 6px -4px ${color}`))
  }

  // Tipografia
  lines.push('')
  lines.push('  /* Tipografia */')
  const { typography } = settings
  lines.push(line(prefix, 'font-size-xs', `${typography.xs}rem`))
  lines.push(line(prefix, 'font-size-sm', `${typography.sm}rem`))
  lines.push(line(prefix, 'font-size-md', `${typography.md}rem`))
  lines.push(line(prefix, 'font-size-lg', `${typography.lg}rem`))
  lines.push(line(prefix, 'font-size-xl', `${typography.xl}rem`))

  lines.push('}')

  return lines.join('\n')
}

export function buildPreviewHtml(css) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
${css}
</style>
</head>
<body style="background:var(--dt-color-background);color:var(--dt-color-text);font-family:system-ui,sans-serif;padding:var(--dt-space-lg)">
  <div style="background:var(--dt-color-surface);padding:var(--dt-space-lg);border-radius:var(--dt-radius-lg);box-shadow:var(--dt-shadow-md);max-width:420px">
    <h2 style="margin:0 0 var(--dt-space-sm);color:var(--dt-color-text)">Preview</h2>
    <p style="margin:0 0 var(--dt-space-md);color:var(--dt-color-text-light)">Este card usa os tokens gerados.</p>
    <button style="background:var(--dt-color-primary);color:#fff;border:0;padding:var(--dt-space-sm) var(--dt-space-md);border-radius:var(--dt-radius-md);box-shadow:var(--dt-shadow-sm);font-size:var(--dt-font-size-md);cursor:pointer">Primary</button>
    <button style="background:var(--dt-color-secondary);color:#fff;border:0;padding:var(--dt-space-sm) var(--dt-space-md);border-radius:var(--dt-radius-md);margin-left:var(--dt-space-sm);font-size:var(--dt-font-size-md);cursor:pointer">Secondary</button>
  </div>
</body>
</html>`
}
