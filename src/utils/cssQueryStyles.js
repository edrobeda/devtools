export const STYLE_KEYS = [
  'backgroundColor',
  'color',
  'fontSize',
  'padding',
  'borderRadius',
  'display',
  'flexDirection',
  'gap',
]

export const STYLE_KEYS_CONTAINER = [
  'backgroundColor',
  'color',
  'fontSize',
  'padding',
  'flexDirection',
  'gap',
  'borderRadius',
]

export function toKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export function formatStyleValue(key, value) {
  if (value == null || value === '') return null
  if (['fontSize', 'padding', 'borderRadius', 'gap'].includes(key)) {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num}px`
  }
  return value
}
