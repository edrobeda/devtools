/**
 * Motor do Gerador de color-mix() CSS.
 * 100% client-side — nenhuma cor sai do navegador.
 */

export const COLOR_SPACES = [
  'srgb',
  'srgb-linear',
  'lab',
  'oklab',
  'xyz',
  'xyz-d50',
  'xyz-d65',
  'hsl',
  'hwb',
  'lch',
  'oklch',
]

export const DEFAULTS = {
  space: 'oklch',
  color1: '#3b82f6',
  percent1: 50,
  color2: '#ec4899',
}

export const PRESETS = [
  { key: 'tint', labelKey: 'tint', color1: '#3b82f6', percent1: 60, color2: '#ffffff', space: 'oklab' },
  { key: 'shade', labelKey: 'shade', color1: '#3b82f6', percent1: 60, color2: '#000000', space: 'oklab' },
  { key: 'warm', labelKey: 'warm', color1: '#f59e0b', percent1: 50, color2: '#ef4444', space: 'oklch' },
  { key: 'cool', labelKey: 'cool', color1: '#06b6d4', percent1: 50, color2: '#8b5cf6', space: 'oklch' },
  { key: 'pastel', labelKey: 'pastel', color1: '#a855f7', percent1: 40, color2: '#fef3c7', space: 'hsl' },
  { key: 'contrast', labelKey: 'contrast', color1: '#10b981', percent1: 50, color2: '#f43f5e', space: 'lch' },
]

export function isValidHex(value) {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(value)
}

export function buildColorMix({ space, color1, percent1, color2 }) {
  if (!space || !color1 || !color2) return ''
  return `color-mix(in ${space}, ${color1} ${percent1}%, ${color2})`
}

export function buildFullCss({ space, color1, percent1, color2, property = 'background-color' }) {
  const mix = buildColorMix({ space, color1, percent1, color2 })
  return `${property}: ${mix};`
}

export function buildHtmlExample(css) {
  return `<div style="${css} width: 120px; height: 120px; border-radius: 12px;"></div>`
}

export function buildPresetLabel(preset, t) {
  return t[preset.labelKey] || preset.key
}
