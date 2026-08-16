// Gerador de badges Shields.io — 100% client-side.
// Monta URLs, Markdown, HTML e reStructuredText a partir de parâmetros
// de formulário. Nenhuma requisição é feita; apenas monta a string do badge.

export const STYLES = [
  { value: 'flat', pt: 'flat', en: 'flat' },
  { value: 'flat-square', pt: 'flat-square', en: 'flat-square' },
  { value: 'plastic', pt: 'plastic', en: 'plastic' },
  { value: 'for-the-badge', pt: 'for-the-badge', en: 'for-the-badge' },
  { value: 'social', pt: 'social', en: 'social' },
]

export const COLORS = [
  { value: 'brightgreen', pt: 'brightgreen', en: 'brightgreen' },
  { value: 'green', pt: 'green', en: 'green' },
  { value: 'yellowgreen', pt: 'yellowgreen', en: 'yellowgreen' },
  { value: 'yellow', pt: 'yellow', en: 'yellow' },
  { value: 'orange', pt: 'orange', en: 'orange' },
  { value: 'red', pt: 'red', en: 'red' },
  { value: 'blue', pt: 'blue', en: 'blue' },
  { value: 'lightgrey', pt: 'lightgrey', en: 'lightgrey' },
  { value: 'blueviolet', pt: 'blueviolet', en: 'blueviolet' },
  { value: 'ff69b4', pt: 'ff69b4', en: 'ff69b4' },
  { value: 'black', pt: 'black', en: 'black' },
  { value: 'white', pt: 'white', en: 'white' },
]

export const DEFAULTS = {
  label: 'build',
  message: 'passing',
  color: 'brightgreen',
  style: 'flat',
  logo: '',
  logoColor: '',
  labelColor: '',
  cacheSeconds: '',
  linkLeft: '',
  linkRight: '',
}

export const PRESETS = {
  buildPassing: {
    label: { pt: 'Build passing', en: 'Build passing' },
    data: {
      label: 'build',
      message: 'passing',
      color: 'brightgreen',
      style: 'flat',
      logo: 'github',
      logoColor: 'white',
      labelColor: '',
      cacheSeconds: '',
      linkLeft: '',
      linkRight: '',
    },
  },
  coverage: {
    label: { pt: 'Cobertura de testes', en: 'Test coverage' },
    data: {
      label: 'coverage',
      message: '85%',
      color: 'green',
      style: 'flat',
      logo: 'vitest',
      logoColor: 'white',
      labelColor: '',
      cacheSeconds: '',
      linkLeft: '',
      linkRight: '',
    },
  },
  version: {
    label: { pt: 'Versão npm', en: 'npm version' },
    data: {
      label: 'npm',
      message: 'v1.2.3',
      color: 'blue',
      style: 'flat',
      logo: 'npm',
      logoColor: 'white',
      labelColor: '',
      cacheSeconds: '',
      linkLeft: '',
      linkRight: '',
    },
  },
  license: {
    label: { pt: 'Licença MIT', en: 'MIT license' },
    data: {
      label: 'license',
      message: 'MIT',
      color: 'yellow',
      style: 'flat',
      logo: 'open-source-initiative',
      logoColor: 'white',
      labelColor: '',
      cacheSeconds: '',
      linkLeft: '',
      linkRight: '',
    },
  },
  docker: {
    label: { pt: 'Pulls do Docker', en: 'Docker pulls' },
    data: {
      label: 'docker',
      message: 'pulls',
      color: 'blue',
      style: 'flat',
      logo: 'docker',
      logoColor: 'white',
      labelColor: '',
      cacheSeconds: '',
      linkLeft: '',
      linkRight: '',
    },
  },
  custom: {
    label: { pt: 'Personalizado', en: 'Custom' },
    data: { ...DEFAULTS },
  },
}

function trim(s) {
  return String(s ?? '').trim()
}

function escapeShieldsPart(s) {
  // https://shields.io/badges
  // '-' separa label/message/color; escape com '--'
  // '_' é espaço; escape com '__'
  // Espaços reais também são convertidos para '_'.
  return s
    .replace(/_/g, '__')
    .replace(/-/g, '--')
    .replace(/ /g, '_')
}

function normalizeColor(c) {
  const v = trim(c).toLowerCase()
  if (!v) return ''
  if (v.startsWith('#')) return v.slice(1)
  return v
}

export function buildBadgeUrl(o) {
  const label = trim(o.label)
  const message = trim(o.message)
  const rawColor = trim(o.color)
  const color = normalizeColor(rawColor) || 'lightgrey'

  if (!label && !message) return ''

  const parts = [escapeShieldsPart(label || ' '), escapeShieldsPart(message || ' '), color]
  const base = `https://img.shields.io/badge/${parts.join('-')}`

  const params = new URLSearchParams()

  const style = trim(o.style)
  if (style) params.set('style', style)

  const logo = trim(o.logo)
  if (logo) params.set('logo', logo)

  const logoColor = normalizeColor(o.logoColor)
  if (logoColor) params.set('logoColor', logoColor)

  const labelColor = normalizeColor(o.labelColor)
  if (labelColor) params.set('labelColor', labelColor)

  const cacheSeconds = trim(o.cacheSeconds)
  if (cacheSeconds && !Number.isNaN(Number(cacheSeconds))) {
    params.set('cacheSeconds', cacheSeconds)
  }

  const linkLeft = trim(o.linkLeft)
  const linkRight = trim(o.linkRight)
  if (linkLeft || linkRight) {
    if (linkLeft) params.set('link', linkLeft)
    if (linkRight) params.append('link', linkRight)
  }

  const query = params.toString()
  return query ? `${base}?${query}` : base
}

export function buildMarkdown(url, alt) {
  if (!url) return ''
  const a = alt || 'badge'
  return `![${a}](${url})`
}

export function buildHtml(url, alt) {
  if (!url) return ''
  const a = alt || 'badge'
  return `<img src="${url}" alt="${a}" />`
}

export function buildRst(url, alt) {
  if (!url) return ''
  const a = alt || 'badge'
  return `.. image:: ${url}\n   :alt: ${a}`
}

export function buildAsciiDoc(url, alt) {
  if (!url) return ''
  const a = alt || 'badge'
  return `image:${url}[${a}]`
}

export function validateBadge(o) {
  const warnings = []
  if (!trim(o.label) && !trim(o.message)) {
    warnings.push('empty')
  }
  return warnings
}
