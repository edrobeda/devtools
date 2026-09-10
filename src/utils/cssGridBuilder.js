export const TRACK_TYPES = ['fr', 'px', '%', 'auto']

export const JUSTIFY_CONTENTS = ['normal', 'start', 'center', 'end', 'space-between', 'space-around', 'space-evenly', 'stretch']
export const ALIGN_CONTENTS = ['normal', 'start', 'center', 'end', 'space-between', 'space-around', 'space-evenly', 'stretch']
export const JUSTIFY_ITEMS = ['stretch', 'start', 'center', 'end']
export const ALIGN_ITEMS = ['stretch', 'start', 'center', 'end']
export const AUTO_FLOWS = ['row', 'column', 'row dense', 'column dense']

export const DEFAULT_SETTINGS = {
  columns: [
    { type: 'fr', value: 1 },
    { type: 'fr', value: 1 },
    { type: 'fr', value: 1 },
  ],
  rows: [
    { type: 'auto', value: 0 },
    { type: 'auto', value: 0 },
    { type: 'auto', value: 0 },
  ],
  gap: 12,
  justifyContent: 'normal',
  alignContent: 'normal',
  justifyItems: 'stretch',
  alignItems: 'stretch',
  autoFlow: 'row',
  itemCount: 6,
  spanFirst: false,
}

export const PRESETS = [
  {
    key: 'thirds',
    settings: {
      ...DEFAULT_SETTINGS,
      columns: [{ type: 'fr', value: 1 }, { type: 'fr', value: 1 }, { type: 'fr', value: 1 }],
      rows: [{ type: 'auto', value: 0 }],
    },
  },
  {
    key: 'sidebar',
    settings: {
      ...DEFAULT_SETTINGS,
      columns: [{ type: 'px', value: 220 }, { type: 'fr', value: 1 }],
      rows: [{ type: 'auto', value: 0 }, { type: 'auto', value: 0 }],
      itemCount: 4,
      spanFirst: true,
    },
  },
  {
    key: 'asymmetric',
    settings: {
      ...DEFAULT_SETTINGS,
      columns: [{ type: 'fr', value: 1 }, { type: 'fr', value: 2 }, { type: 'fr', value: 1 }],
      rows: [{ type: 'auto', value: 0 }, { type: 'px', value: 120 }],
      itemCount: 6,
    },
  },
  {
    key: 'holy',
    settings: {
      ...DEFAULT_SETTINGS,
      columns: [{ type: 'fr', value: 1 }, { type: 'px', value: 200 }, { type: 'fr', value: 1 }],
      rows: [{ type: 'px', value: 60 }, { type: 'fr', value: 1 }, { type: 'px', value: 60 }],
      itemCount: 6,
      spanFirst: true,
    },
  },
  {
    key: 'gallery',
    settings: {
      ...DEFAULT_SETTINGS,
      columns: [{ type: 'px', value: 120 }, { type: 'px', value: 120 }, { type: 'px', value: 120 }],
      rows: [{ type: 'px', value: 90 }, { type: 'px', value: 90 }],
      gap: 12,
    },
  },
]

export function trackToCss(track) {
  if (!track) return 'auto'
  switch (track.type) {
    case 'fr':
      return `${track.value || 1}fr`
    case 'px':
      return `${track.value || 0}px`
    case '%':
      return `${track.value || 0}%`
    case 'auto':
    default:
      return 'auto'
  }
}

export function buildColumnsCss(settings) {
  const cols = settings.columns.length ? settings.columns : [{ type: 'auto', value: 0 }]
  const last = cols[cols.length - 1]
  const repeated = last.type === 'fr' && cols.length > 1
    && cols.every((c) => c.type === 'fr' && c.value === last.value)
  if (repeated && last.value === 1) {
    return `repeat(${cols.length}, 1fr)`
  }
  return cols.map(trackToCss).join(' ')
}

export function buildRowsCss(settings) {
  const rows = settings.rows.length ? settings.rows : [{ type: 'auto', value: 0 }]
  if (rows.length === 1 && rows[0].type === 'auto') {
    return 'auto'
  }
  return rows.map(trackToCss).join(' ')
}

export function buildGridCss(settings) {
  const lines = [
    'display: grid;',
    `grid-template-columns: ${buildColumnsCss(settings)};`,
    `grid-template-rows: ${buildRowsCss(settings)};`,
    `gap: ${settings.gap}px;`,
  ]
  if (settings.justifyContent !== 'normal') lines.push(`justify-content: ${settings.justifyContent};`)
  if (settings.alignContent !== 'normal') lines.push(`align-content: ${settings.alignContent};`)
  if (settings.justifyItems !== 'stretch') lines.push(`justify-items: ${settings.justifyItems};`)
  if (settings.alignItems !== 'stretch') lines.push(`align-items: ${settings.alignItems};`)
  if (settings.autoFlow !== 'row') lines.push(`grid-auto-flow: ${settings.autoFlow};`)
  return lines.join('\n  ')
}

export function buildContainerStyle(settings) {
  const style = {
    display: 'grid',
    gridTemplateColumns: buildColumnsCss(settings),
    gridTemplateRows: buildRowsCss(settings),
    gap: `${settings.gap}px`,
  }
  if (settings.justifyContent !== 'normal') style.justifyContent = settings.justifyContent
  if (settings.alignContent !== 'normal') style.alignContent = settings.alignContent
  if (settings.justifyItems !== 'stretch') style.justifyItems = settings.justifyItems
  if (settings.alignItems !== 'stretch') style.alignItems = settings.alignItems
  if (settings.autoFlow !== 'row') style.gridAutoFlow = settings.autoFlow
  return style
}

export function buildItemStyles(settings) {
  return Array.from({ length: settings.itemCount }, (_, i) => {
    if (i === 0 && settings.spanFirst) return { gridColumn: 'span 2' }
    return {}
  })
}

export function buildFullDemo(settings) {
  const colors = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2',
    '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911', '#fadb14', '#39c5bb']
  const items = []
  for (let i = 0; i < settings.itemCount; i++) {
    const span = i === 0 && settings.spanFirst ? ' style="grid-column: span 2"' : ''
    const color = colors[i % colors.length]
    items.push(`  <div class="item"${span} style="background:${color}">${i + 1}</div>`)
  }
  return (
`<style>
  .grid {
    ${buildGridCss(settings)}
  }
  .grid>div { border-radius: 6px; padding: 16px; color: #fff; }
</style>

<div class="grid">
${items.join('\n')}
</div>`
  )
}

export function buildSummary(settings) {
  return {
    colsLabel: buildColumnsCss(settings),
    rowsLabel: buildRowsCss(settings),
  }
}
