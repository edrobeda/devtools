/**
 * Motor do Gerador de Layout Masonry CSS.
 * Tudo roda no cliente — nenhuma chamada de rede.
 */

export const MODES = ['columns', 'grid']
export const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6]
export const GAPS = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
export const RADII = [0, 4, 6, 8, 12, 16, 24, 32]
export const PADDINGS = [0, 8, 12, 16, 20, 24, 32]

export const DEFAULT_SETTINGS = {
  mode: 'columns',
  columns: 3,
  gap: 16,
  itemRadius: 8,
  itemPadding: 16,
  itemBackground: '#e6f7ff',
  breakInside: true,
  itemCount: 12,
  responsive: true,
}

export const PRESETS = [
  {
    key: 'pinterest',
    label: { pt: 'Estilo Pinterest (colunas)', en: 'Pinterest-like (columns)' },
    settings: {
      mode: 'columns',
      columns: 4,
      gap: 16,
      itemRadius: 12,
      itemPadding: 16,
      itemBackground: '#f0f5ff',
      breakInside: true,
      itemCount: 16,
      responsive: true,
    },
  },
  {
    key: 'photos',
    label: { pt: 'Galeria de fotos (grid masonry)', en: 'Photo gallery (grid masonry)' },
    settings: {
      mode: 'grid',
      columns: 3,
      gap: 12,
      itemRadius: 4,
      itemPadding: 0,
      itemBackground: '#f6ffed',
      breakInside: true,
      itemCount: 12,
      responsive: true,
    },
  },
  {
    key: 'minimal',
    label: { pt: 'Minimalista', en: 'Minimal' },
    settings: {
      mode: 'columns',
      columns: 2,
      gap: 24,
      itemRadius: 0,
      itemPadding: 24,
      itemBackground: '#f5f5f5',
      breakInside: true,
      itemCount: 8,
      responsive: true,
    },
  },
  {
    key: 'cards',
    label: { pt: 'Cards coloridos', en: 'Colorful cards' },
    settings: {
      mode: 'columns',
      columns: 3,
      gap: 20,
      itemRadius: 16,
      itemPadding: 20,
      itemBackground: '#fff7e6',
      breakInside: true,
      itemCount: 15,
      responsive: true,
    },
  },
]

/** Gera alturas determinísticas para os itens de preview. */
export function generateItems(count) {
  const items = []
  for (let i = 0; i < count; i += 1) {
    // altura entre 80 e 240 px, variando por índice
    const height = 80 + (((i * 37 + 61) % 9) * 20)
    items.push({ id: i + 1, height })
  }
  return items
}

/** Cor de destaque por índice para o preview (paleta fixa, leve). */
export function itemBackgroundByIndex(index, base) {
  const tints = ['#e6f7ff', '#f6ffed', '#fff7e6', '#fff0f6', '#f9f0ff', '#e6fffb', '#fff2e8', '#f0f5ff']
  if (base && base !== DEFAULT_SETTINGS.itemBackground) return base
  return tints[index % tints.length]
}

export function buildContainerStyle(settings) {
  const style = {}
  if (settings.mode === 'columns') {
    style.columnCount = settings.columns
    style.columnGap = `${settings.gap}px`
  } else {
    style.display = 'grid'
    style.gridTemplateColumns = `repeat(${settings.columns}, 1fr)`
    style.gridTemplateRows = 'masonry'
    style.gap = `${settings.gap}px`
    style.alignItems = 'start'
  }
  return style
}

export function buildItemStyle(settings) {
  const style = {
    background: settings.itemBackground,
    borderRadius: `${settings.itemRadius}px`,
    padding: `${settings.itemPadding}px`,
  }
  if (settings.mode === 'columns') {
    style.breakInside = settings.breakInside ? 'avoid' : 'auto'
    style.marginBottom = `${settings.gap}px`
  }
  return style
}

function mediaQueries(settings) {
  if (!settings.responsive) return ''
  const lines = []
  if (settings.mode === 'columns') {
    lines.push(`
@media (max-width: 768px) {
  .masonry {
    column-count: ${Math.max(1, settings.columns - 1)};
  }
}

@media (max-width: 480px) {
  .masonry {
    column-count: 1;
  }
}`)
  } else {
    lines.push(`
@media (max-width: 768px) {
  .masonry {
    grid-template-columns: repeat(${Math.max(1, settings.columns - 1)}, 1fr);
  }
}

@media (max-width: 480px) {
  .masonry {
    grid-template-columns: 1fr;
  }
}`)
  }
  return lines.join('\n')
}

export function buildMasonryCss(settings) {
  const lines = []
  lines.push('.masonry {')
  if (settings.mode === 'columns') {
    lines.push(`  column-count: ${settings.columns};`)
    lines.push(`  column-gap: ${settings.gap}px;`)
  } else {
    lines.push('  display: grid;')
    lines.push(`  grid-template-columns: repeat(${settings.columns}, 1fr);`)
    lines.push('  grid-template-rows: masonry;')
    lines.push(`  gap: ${settings.gap}px;`)
    lines.push('  align-items: start;')
  }
  lines.push('}')
  lines.push('')
  lines.push('.masonry-item {')
  lines.push(`  background: ${settings.itemBackground};`)
  lines.push(`  border-radius: ${settings.itemRadius}px;`)
  lines.push(`  padding: ${settings.itemPadding}px;`)
  if (settings.mode === 'columns') {
    lines.push('  break-inside: avoid;')
    lines.push(`  margin-bottom: ${settings.gap}px;`)
  }
  lines.push('}')

  const mq = mediaQueries(settings)
  if (mq) {
    lines.push('')
    lines.push(mq.trim())
  }

  return lines.join('\n')
}

export function buildHtml(settings, items) {
  const itemTags = (items || generateItems(settings.itemCount))
    .map((it) => `  <div class="masonry-item">${it.id}</div>`)
    .join('\n')
  return `<div class="masonry">\n${itemTags}\n</div>`
}

export function buildFullDemo(settings, items) {
  return `${buildMasonryCss(settings)}\n\n${buildHtml(settings, items)}`
}

export function buildSummary(settings) {
  const parts = []
  parts.push(settings.mode === 'columns' ? 'CSS columns' : 'CSS grid masonry')
  parts.push(`${settings.columns} cols`)
  if (settings.gap > 0) parts.push(`gap ${settings.gap}px`)
  if (settings.itemRadius > 0) parts.push(`radius ${settings.itemRadius}px`)
  if (settings.responsive) parts.push('responsive')
  return parts.join(' · ')
}
