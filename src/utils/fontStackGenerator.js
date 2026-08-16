/**
 * Gerador de font stacks CSS.
 *
 * Monta declarações font-family a partir de listas de fontes, com stacks
 * pré-definidas, detecção client-side de fontes instaladas e regras de
 * fallback genéricas (sans-serif, serif, monospace etc.).
 */

export const GENERIC_FAMILIES = [
  { key: 'sans-serif', label: 'sans-serif' },
  { key: 'serif', label: 'serif' },
  { key: 'monospace', label: 'monospace' },
  { key: 'cursive', label: 'cursive' },
  { key: 'fantasy', label: 'fantasy' },
  { key: 'system-ui', label: 'system-ui' },
  { key: 'ui-sans-serif', label: 'ui-sans-serif' },
  { key: 'ui-serif', label: 'ui-serif' },
  { key: 'ui-monospace', label: 'ui-monospace' },
  { key: 'ui-rounded', label: 'ui-rounded' },
  { key: 'emoji', label: 'emoji' },
  { key: 'math', label: 'math' },
  { key: 'fangsong', label: 'fangsong' },
]

// Stacks populares usadas por produtos e frameworks conhecidos.
export const PRESETS = [
  {
    key: 'system',
    name: 'System UI (moderno)',
    nameEn: 'System UI (modern)',
    stack: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
  },
  {
    key: 'github',
    name: 'GitHub / Mona Sans',
    nameEn: 'GitHub / Mona Sans',
    stack: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji'],
  },
  {
    key: 'tailwind',
    name: 'Tailwind CSS',
    nameEn: 'Tailwind CSS',
    stack: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  },
  {
    key: 'bootstrap',
    name: 'Bootstrap 5',
    nameEn: 'Bootstrap 5',
    stack: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Liberation Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  },
  {
    key: 'medium',
    name: 'Medium / Sohne',
    nameEn: 'Medium / Sohne',
    stack: ['sohne', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  },
  {
    key: 'geist',
    name: 'Vercel / Geist',
    nameEn: 'Vercel / Geist',
    stack: ['Geist', 'Geist Fallback', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  },
  {
    key: 'atkinson',
    name: 'Atkinson Hyperlegible',
    nameEn: 'Atkinson Hyperlegible',
    stack: ['Atkinson Hyperlegible', 'Verdana', 'Tahoma', 'sans-serif'],
  },
  {
    key: 'serif',
    name: 'Serif clássico',
    nameEn: 'Classic serif',
    stack: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
  },
  {
    key: 'serif-editorial',
    name: 'Serif editorial',
    nameEn: 'Editorial serif',
    stack: ['Merriweather', 'Lora', 'Libre Baskerville', 'Georgia', 'serif'],
  },
  {
    key: 'mono',
    name: 'Monospace para código',
    nameEn: 'Code monospace',
    stack: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },
  {
    key: 'mono-modern',
    name: 'Monospace moderna',
    nameEn: 'Modern monospace',
    stack: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', 'Consolas', 'monospace'],
  },
  {
    key: 'dyslexia',
    name: 'Dislexia / OpenDyslexic',
    nameEn: 'Dyslexia / OpenDyslexic',
    stack: ['OpenDyslexic', 'Comic Sans MS', 'Verdana', 'sans-serif'],
  },
]

// Lista de fontes comuns para o picker rápido.
export const COMMON_FONTS = [
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Candara',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'Fira Code',
  'Fira Sans',
  'Georgia',
  'Helvetica',
  'Helvetica Neue',
  'Inter',
  'JetBrains Mono',
  'Lato',
  'Lucida Grande',
  'Menlo',
  'Monaco',
  'Noto Sans',
  'Open Sans',
  'OpenDyslexic',
  'Oxygen',
  'Poppins',
  'Roboto',
  'Segoe UI',
  'SF Pro Display',
  'SFMono-Regular',
  'Source Code Pro',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Ubuntu',
  'Verdana',
]

// Fontes que precisam de aspas por conterem espaço, número ou caractere especial.
function needsQuotes(name) {
  if (!name || typeof name !== 'string') return false
  // Palavras genéricas CSS nunca levam aspas.
  const generics = new Set(GENERIC_FAMILIES.map((g) => g.label))
  if (generics.has(name)) return false
  // Nomes com espaço, hífen seguido de dígito ou começando por dígito precisam de aspas.
  if (/\s/.test(name)) return true
  if (/^\d/.test(name)) return true
  if (name.startsWith('-')) return true
  return false
}

export function quoteFontName(name) {
  if (needsQuotes(name)) return `"${name.replace(/"/g, '\\"')}"`
  return name
}

export function buildFontStackCSS(stack) {
  if (!Array.isArray(stack) || stack.length === 0) return ''
  const cleaned = stack.map((f) => String(f).trim()).filter(Boolean)
  if (cleaned.length === 0) return ''
  return `font-family: ${cleaned.map(quoteFontName).join(', ')};`
}

export function buildFontFamilyValue(stack) {
  if (!Array.isArray(stack) || stack.length === 0) return ''
  const cleaned = stack.map((f) => String(f).trim()).filter(Boolean)
  if (cleaned.length === 0) return ''
  return cleaned.map(quoteFontName).join(', ')
}

/**
 * Testa se uma fonte está disponível no sistema comparando dimensões de
 * texto renderizado com uma fonte de referência (serif). Baseado na ideia
 * clássica de font-detect, mas implementado com Canvas 2D.
 */
export function isFontAvailable(fontName) {
  if (typeof document === 'undefined') return null
  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const measure = (family) => {
    ctx.font = `${testSize} ${family}, serif`
    return ctx.measureText(testString).width
  }

  const referenceWidth = measure('__impossible_font__')
  const withFont = measure(fontName)
  // Se as medidas forem diferentes, a fonte existe (ou caiu em outra fallback).
  // Para reduzir falsos positivos, medimos também sem a fonte de teste.
  const withoutFont = measure('')
  return withFont !== referenceWidth && withFont !== withoutFont
}

export function detectAvailableFonts(fontNames) {
  const result = {}
  fontNames.forEach((name) => {
    result[name] = isFontAvailable(name)
  })
  return result
}

export function getPresetByKey(key, lang = 'pt') {
  const preset = PRESETS.find((p) => p.key === key)
  if (!preset) return null
  return {
    ...preset,
    displayName: lang === 'pt' ? preset.name : preset.nameEn,
  }
}

export function defaultStack() {
  return [...PRESETS[0].stack]
}
