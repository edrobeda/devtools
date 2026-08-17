/**
 * Motor do gerador de CSS @layer (Cascade Layers).
 * Tudo roda 100% client-side; não há comunicação com servidor.
 */

export const DEFAULT_LAYERS = [
  { id: 'base', name: 'base', css: ':root {\n  --color-text: #333;\n  --font-base: system-ui, sans-serif;\n}\n\nbody {\n  font-family: var(--font-base);\n  color: var(--color-text);\n}' },
  { id: 'components', name: 'components', css: '.btn {\n  padding: 0.5rem 1rem;\n  border: 1px solid #ccc;\n  background: #fff;\n  color: #333;\n  border-radius: 4px;\n}' },
  { id: 'utilities', name: 'utilities', css: '.btn-primary {\n  background: #1677ff;\n  color: #fff;\n  border-color: #1677ff;\n}' },
]

export const PRESETS = [
  {
    key: 'itcss',
    labelKey: 'presetItcss',
    layers: [
      { id: 'settings', name: 'settings', css: ':root {\n  --color-text: #333;\n  --font-base: system-ui, sans-serif;\n}' },
      { id: 'generic', name: 'generic', css: '* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  line-height: 1.5;\n}' },
      { id: 'elements', name: 'elements', css: 'body {\n  font-family: var(--font-base);\n  color: var(--color-text);\n}' },
      { id: 'components', name: 'components', css: '.btn {\n  padding: 0.5rem 1rem;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n}' },
      { id: 'utilities', name: 'utilities', css: '.btn-primary {\n  background: #1677ff;\n  color: #fff;\n  border-color: #1677ff;\n}' },
    ],
  },
  {
    key: 'framework',
    labelKey: 'presetFramework',
    layers: [
      { id: 'vendor', name: 'vendor', css: '.btn {\n  background: #f0f0f0;\n  color: #000;\n}' },
      { id: 'theme', name: 'theme', css: '.btn {\n  border-radius: 8px;\n}' },
      { id: 'overrides', name: 'overrides', css: '.btn.active {\n  background: #1677ff;\n  color: #fff;\n}' },
    ],
  },
  {
    key: 'darkmode',
    labelKey: 'presetDarkmode',
    layers: [
      { id: 'light', name: 'light', css: ':root {\n  --bg: #fff;\n  --fg: #111;\n}\n\n.demo {\n  background: var(--bg);\n  color: var(--fg);\n}' },
      { id: 'dark', name: 'dark', css: ':root {\n  --bg: #111;\n  --fg: #fff;\n}\n\n.demo {\n  background: var(--bg);\n  color: var(--fg);\n}' },
    ],
  },
  {
    key: 'specificity',
    labelKey: 'presetSpecificity',
    layers: [
      { id: 'base', name: 'base', css: '#demo .text {\n  color: #ff4d4f;\n  font-weight: bold;\n}' },
      { id: 'theme', name: 'theme', css: '.text {\n  color: #1677ff;\n  font-weight: normal;\n}' },
    ],
  },
  {
    key: 'minimal',
    labelKey: 'presetMinimal',
    layers: [
      { id: 'reset', name: 'reset', css: '* {\n  margin: 0;\n  padding: 0;\n}' },
      { id: 'layout', name: 'layout', css: '.stack > * + * {\n  margin-top: 1rem;\n}' },
    ],
  },
]

const IDENTIFIER_RE = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/

export function isValidLayerName(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return false
  return IDENTIFIER_RE.test(trimmed)
}

export function normalizeLayerName(name) {
  return (name || '').trim().replace(/\s+/g, '-')
}

export function makeLayer(name = 'nova-camada') {
  const id = `${name}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  return { id, name, css: '' }
}

export function buildLayerDeclaration(layers) {
  const names = (layers || [])
    .map((l) => normalizeLayerName(l.name))
    .filter(Boolean)
  if (names.length === 0) return ''
  return `@layer ${names.join(', ')};`
}

export function buildLayerBlocks(layers) {
  const valid = (layers || []).filter((l) => isValidLayerName(l.name))
  if (valid.length === 0) return ''
  return valid
    .map((l) => {
      const name = normalizeLayerName(l.name)
      const body = (l.css || '').trim()
      if (!body) return `@layer ${name} {\n}`
      const indented = body
        .split('\n')
        .map((line) => (line.trim() ? `  ${line}` : line))
        .join('\n')
      return `@layer ${name} {\n${indented}\n}`
    })
    .join('\n\n')
}

export function buildFullCss(layers) {
  const declaration = buildLayerDeclaration(layers)
  const blocks = buildLayerBlocks(layers)
  const parts = [declaration, blocks].filter(Boolean)
  return parts.join('\n\n')
}

export function buildHtmlExample(layers) {
  const valid = (layers || []).filter((l) => isValidLayerName(l.name))
  if (valid.length === 0) return '<!-- Adicione pelo menos uma camada -->'
  const names = valid.map((l) => normalizeLayerName(l.name)).join(' ')
  return `<!-- As camadas são aplicadas em ordem: ${names} -->\n<div class="demo">\n  <button class="btn btn-primary">Botão de exemplo</button>\n</div>`
}

export function buildPreviewDocument(layers, extraHtml) {
  const css = buildFullCss(layers)
  const html = extraHtml || `<div class="demo" style="padding: 1.5rem;">\n  <button class="btn btn-primary">Botão de exemplo</button>\n</div>`
  return `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n</body>\n</html>`
}

export function getLayerSummary(layers) {
  const valid = (layers || []).filter((l) => isValidLayerName(l.name)).length
  const invalid = (layers || []).length - valid
  return { total: (layers || []).length, valid, invalid }
}

export function reorderLayers(layers, fromIndex, toIndex) {
  if (!Array.isArray(layers)) return []
  const copy = [...layers]
  const [moved] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, moved)
  return copy
}
