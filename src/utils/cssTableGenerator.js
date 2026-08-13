// Gerador de tabela de dados CSS puro.
//
// Monta uma <table> estilizada usando só CSS: variantes visuais,
// cabeçalho fixo, listras, hover, responsividade (scroll ou cards)
// e paginação visual.

function parseColor(color) {
  if (!color) return '#ffffff'
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const DEFAULTS = {
  variant: 'clean',
  maxWidth: 960,
  fontSize: 14,
  headerFontWeight: 600,
  padding: 12,
  borderWidth: 1,
  borderRadius: 8,
  align: 'left',
  stickyHeader: false,
  striped: false,
  hover: true,
  compact: false,
  responsiveMode: 'scroll',
  showPagination: false,
  headerBg: '#f5f5f7',
  headerText: '#262626',
  rowBg: '#ffffff',
  rowAltBg: '#fafafa',
  textColor: '#262626',
  borderColor: '#e5e5ea',
  hoverBg: '#f0f5ff',
  accentColor: '#1677ff',
}

const PRESETS = {
  clean: {
    variant: 'clean',
    headerBg: '#f5f5f7',
    headerText: '#262626',
    rowBg: '#ffffff',
    rowAltBg: '#fafafa',
    textColor: '#262626',
    borderColor: '#e5e5ea',
    hoverBg: '#f0f5ff',
    accentColor: '#1677ff',
    striped: false,
    hover: true,
    borderWidth: 1,
  },
  bordered: {
    variant: 'bordered',
    headerBg: '#ffffff',
    headerText: '#262626',
    rowBg: '#ffffff',
    rowAltBg: '#ffffff',
    textColor: '#262626',
    borderColor: '#d9d9d9',
    hoverBg: '#f5f5f7',
    accentColor: '#1677ff',
    striped: false,
    hover: true,
    borderWidth: 1,
  },
  striped: {
    variant: 'striped',
    headerBg: '#1677ff',
    headerText: '#ffffff',
    rowBg: '#ffffff',
    rowAltBg: '#f0f5ff',
    textColor: '#262626',
    borderColor: '#d6e4ff',
    hoverBg: '#e6f4ff',
    accentColor: '#1677ff',
    striped: true,
    hover: true,
    borderWidth: 0,
  },
  hover: {
    variant: 'hover',
    headerBg: '#ffffff',
    headerText: '#262626',
    rowBg: '#ffffff',
    rowAltBg: '#ffffff',
    textColor: '#262626',
    borderColor: '#f0f0f0',
    hoverBg: '#f0f5ff',
    accentColor: '#1677ff',
    striped: false,
    hover: true,
    borderWidth: 0,
  },
  dark: {
    variant: 'dark',
    headerBg: '#1f1f1f',
    headerText: '#f5f5f7',
    rowBg: '#262626',
    rowAltBg: '#2c2c2c',
    textColor: '#d9d9d9',
    borderColor: '#3a3a3a',
    hoverBg: '#3a3a3a',
    accentColor: '#69b1ff',
    striped: false,
    hover: true,
    borderWidth: 1,
  },
  compact: {
    variant: 'compact',
    headerBg: '#fafafa',
    headerText: '#262626',
    rowBg: '#ffffff',
    rowAltBg: '#fafafa',
    textColor: '#262626',
    borderColor: '#f0f0f0',
    hoverBg: '#f5f5f7',
    accentColor: '#262626',
    striped: false,
    hover: false,
    borderWidth: 0,
  },
}

export { PRESETS, DEFAULTS }

export function buildTableCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const variant = opts.variant || 'clean'
  const maxWidth = clamp(Number(opts.maxWidth) || 960, 320, 1600)
  const fontSize = clamp(Number(opts.fontSize) || 14, 10, 24)
  const headerFontWeight = clamp(Number(opts.headerFontWeight) || 600, 300, 900)
  const padding = clamp(Number(opts.padding) || 12, 4, 32)
  const borderWidth = clamp(Number(opts.borderWidth) || 1, 0, 8)
  const borderRadius = clamp(Number(opts.borderRadius) || 8, 0, 32)
  const align = ['left', 'center', 'right'].includes(opts.align) ? opts.align : 'left'
  const stickyHeader = Boolean(opts.stickyHeader)
  const striped = Boolean(opts.striped)
  const hover = Boolean(opts.hover)
  const compact = Boolean(opts.compact)
  const responsiveMode = opts.responsiveMode === 'cards' ? 'cards' : 'scroll'
  const showPagination = Boolean(opts.showPagination)

  const headerBg = parseColor(opts.headerBg)
  const headerText = parseColor(opts.headerText)
  const rowBg = parseColor(opts.rowBg)
  const rowAltBg = parseColor(opts.rowAltBg)
  const textColor = parseColor(opts.textColor)
  const borderColor = parseColor(opts.borderColor)
  const hoverBg = parseColor(opts.hoverBg)
  const accentColor = parseColor(opts.accentColor)

  const compactPadding = Math.max(4, Math.round(padding * 0.6))
  const cellPadding = compact ? toPx(compactPadding) : toPx(padding)

  const lines = [
    '/* Container da tabela */',
    '.table-wrapper {',
    `  width: 100%;`,
    `  max-width: ${toPx(maxWidth)};`,
    `  margin: 0 auto;`,
    `  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`,
    '  color: var(--table-text);',
    '  --table-text: ' + textColor + ';',
    '  --table-header-bg: ' + headerBg + ';',
    '  --table-header-text: ' + headerText + ';',
    '  --table-row-bg: ' + rowBg + ';',
    '  --table-row-alt: ' + rowAltBg + ';',
    '  --table-border: ' + borderColor + ';',
    '  --table-hover: ' + hoverBg + ';',
    '  --table-accent: ' + accentColor + ';',
    '}',
    '',
    '/* Wrapper responsivo */',
    '.table-scroll {',
    `  width: 100%;`,
    `  overflow-x: auto;`,
    `  -webkit-overflow-scrolling: touch;`,
    `  border-radius: ${toPx(borderRadius)};`,
    borderWidth > 0 ? `  border: ${toPx(borderWidth)} solid var(--table-border);` : '  border: none;',
    '}',
    '',
    '/* Tabela base */',
    '.data-table {',
    `  width: 100%;`,
    `  border-collapse: collapse;`,
    `  font-size: ${toPx(fontSize)};`,
    `  text-align: ${align};`,
    `  background: var(--table-row-bg);`,
    '}',
    '',
    '.data-table caption {',
    `  caption-side: top;`,
    `  padding: ${cellPadding};`,
    `  font-weight: 600;`,
    `  text-align: left;`,
    `  color: var(--table-text);`,
    '}',
    '',
    '/* Cabeçalho */',
    '.data-table thead {',
    `  background: var(--table-header-bg);`,
    `  color: var(--table-header-text);`,
    stickyHeader ? '  position: sticky;' : null,
    stickyHeader ? '  top: 0;' : null,
    stickyHeader ? '  z-index: 2;' : null,
    '}',
    '',
    '.data-table th {',
    `  padding: ${cellPadding};`,
    `  font-weight: ${headerFontWeight};`,
    `  white-space: nowrap;`,
    borderWidth > 0 ? `  border-bottom: ${toPx(borderWidth)} solid var(--table-border);` : null,
    '}',
    '',
    '/* Indicador visual de ordenação */',
    '.data-table th[aria-sort] {',
    `  cursor: pointer;`,
    `  user-select: none;`,
    '}',
    '',
    '.data-table th[aria-sort]::after {',
    `  content: " ▲";`,
    `  font-size: 0.75em;`,
    `  opacity: 0.35;`,
    `  margin-left: 0.4em;`,
    '}',
    '',
    '.data-table th[aria-sort="descending"]::after {',
    `  content: " ▼";`,
    `  opacity: 1;`,
    `  color: var(--table-accent);`,
    '}',
    '',
    '.data-table th[aria-sort="ascending"]::after {',
    `  content: " ▲";`,
    `  opacity: 1;`,
    `  color: var(--table-accent);`,
    '}',
    '',
    '/* Células */',
    '.data-table td {',
    `  padding: ${cellPadding};`,
    borderWidth > 0 ? `  border-bottom: ${toPx(borderWidth)} solid var(--table-border);` : null,
    '}',
    '',
    '/* Listas (zebra) */',
  ]

  if (striped) {
    lines.push(
      '.data-table tbody tr:nth-child(even) {',
      `  background: var(--table-row-alt);`,
      '}',
      ''
    )
  }

  if (hover) {
    lines.push(
      '.data-table tbody tr:hover {',
      `  background: var(--table-hover);`,
      '}',
      ''
    )
  }

  lines.push(
    '/* Linha de destaque */',
    '.data-table tbody tr.is-selected {',
    `  background: var(--table-hover);`,
    `  box-shadow: inset 3px 0 0 0 var(--table-accent);`,
    '}',
    '',
    '/* Status/cores semânticas para linhas */',
    '.data-table tbody tr.is-success { background: rgba(82, 196, 26, 0.08); }',
    '.data-table tbody tr.is-warning { background: rgba(250, 140, 22, 0.08); }',
    '.data-table tbody tr.is-error { background: rgba(255, 77, 79, 0.08); }',
    '',
    '/* Paginação visual */',
    '.table-pagination {',
    `  display: flex;`,
    `  align-items: center;`,
    `  justify-content: space-between;`,
    `  gap: ${toPx(Math.max(8, padding))};`,
    `  margin-top: ${toPx(Math.max(8, padding))};`,
    `  font-size: ${toPx(fontSize)};`,
    `  color: var(--table-text);`,
    `  flex-wrap: wrap;`,
    '}',
    '',
    '.table-pagination__info {',
    `  opacity: 0.7;`,
    '}',
    '',
    '.table-pagination__actions {',
    `  display: flex;`,
    `  gap: ${toPx(Math.max(4, Math.round(padding * 0.5)))};`,
    '}',
    '',
    '.table-pagination__btn {',
    `  padding: ${compact ? '4px 10px' : '6px 14px'};`,
    `  border: ${toPx(borderWidth)} solid var(--table-border);`,
    `  border-radius: ${toPx(Math.max(4, Math.round(borderRadius * 0.5)))};`,
    `  background: var(--table-row-bg);`,
    `  color: var(--table-text);`,
    `  font-size: inherit;`,
    `  cursor: pointer;`,
    `  transition: background 150ms ease;`,
    '}',
    '',
    '.table-pagination__btn:hover {',
    `  background: var(--table-hover);`,
    '}',
    '',
    '.table-pagination__btn:disabled {',
    `  opacity: 0.45;`,
    `  cursor: not-allowed;`,
    '}',
    '',
    '.table-pagination__btn.is-active {',
    `  background: var(--table-accent);`,
    `  border-color: var(--table-accent);`,
    `  color: #ffffff;`,
    '}',
    '',
    '/* Responsivo: scroll horizontal */',
    '@media (max-width: 640px) {',
    '  .table-scroll {',
    `    border-radius: ${toPx(Math.max(0, borderRadius - 2))};`,
    '  }',
    '  .data-table th,',
    '  .data-table td {',
    `    white-space: nowrap;`,
    '  }',
    '}',
    ''
  )

  if (responsiveMode === 'cards') {
    lines.push(
      '/* Responsivo: cards em telas estreitas */',
      '@media (max-width: 640px) {',
      '  .table-scroll {',
      '    border: none;',
      '    overflow: visible;',
      '  }',
      '  .data-table,',
      '  .data-table thead,',
      '  .data-table tbody,',
      '  .data-table th,',
      '  .data-table td,',
      '  .data-table tr {',
      '    display: block;',
      '  }',
      '  .data-table thead {',
      '    position: absolute;',
      '    width: 1px;',
      '    height: 1px;',
      '    padding: 0;',
      '    margin: -1px;',
      '    overflow: hidden;',
      '    clip: rect(0, 0, 0, 0);',
      '    border: 0;',
      '  }',
      '  .data-table tbody tr {',
      `    margin-bottom: ${toPx(Math.max(8, padding))};`,
      `    padding: ${cellPadding};`,
      `    background: var(--table-row-bg);`,
      `    border: ${toPx(borderWidth)} solid var(--table-border);`,
      `    border-radius: ${toPx(borderRadius)};`,
      `    box-shadow: 0 2px 8px rgba(0,0,0,0.04);`,
      '  }',
      '  .data-table tbody tr.is-selected {',
      '    box-shadow: inset 3px 0 0 0 var(--table-accent), 0 2px 8px rgba(0,0,0,0.04);',
      '  }',
      '  .data-table td {',
      '    display: flex;',
      '    justify-content: space-between;',
      '    align-items: center;',
      `    padding: ${toPx(Math.max(4, Math.round(compact ? compactPadding * 0.6 : padding * 0.6)))} 0;`,
      '    border: none;',
      '    border-bottom: 1px solid var(--table-border);',
      '    text-align: right;',
      '  }',
      '  .data-table td:last-child {',
      '    border-bottom: none;',
      '  }',
      '  .data-table td::before {',
      `    content: attr(data-label);`,
      '    font-weight: 600;',
      '    text-align: left;',
      '    color: var(--table-header-text);',
      '    margin-right: 1rem;',
      '  }',
      '}'
    )
  }

  if (!showPagination) {
    lines.push(
      '',
      '/* Paginação oculta */',
      '.table-pagination {',
      '  display: none;',
      '}'
    )
  }

  return lines.filter((line) => line !== null).join('\n')
}

export function buildTableHtml(options = {}, lang = 'pt') {
  const opts = { ...DEFAULTS, ...options }
  const showPagination = Boolean(opts.showPagination)
  const responsiveMode = opts.responsiveMode === 'cards' ? 'cards' : 'scroll'

  const columns = Array.isArray(opts.columns) && opts.columns.length
    ? opts.columns
    : ['ID', lang === 'en' ? 'Name' : 'Nome', lang === 'en' ? 'Role' : 'Cargo', lang === 'en' ? 'Status' : 'Status', lang === 'en' ? 'Joined' : 'Desde']

  const rows = Array.isArray(opts.rows) && opts.rows.length
    ? opts.rows
    : [
        ['#1001', 'Ana Souza', 'Engineer', 'Active', '2023-04-12'],
        ['#1002', 'Bruno Lima', 'Designer', 'Active', '2022-11-05'],
        ['#1003', 'Carla Dias', 'Manager', 'Away', '2021-08-22'],
        ['#1004', 'Diego Rocha', 'Engineer', 'Offline', '2023-01-18'],
        ['#1005', 'Elisa Moraes', 'Analyst', 'Active', '2022-06-30'],
      ]

  const statusClass = (status) => {
    const s = String(status).toLowerCase()
    if (s === 'active' || s === 'ativo') return 'is-success'
    if (s === 'away' || s === 'ausente') return 'is-warning'
    if (s === 'offline' || s === 'inativo') return 'is-error'
    return ''
  }

  const ths = columns
    .map((col, i) => `      <th scope="col" ${i === 0 ? 'aria-sort="ascending"' : ''}>${escapeHtml(col)}</th>`)
    .join('\n')

  const trs = rows
    .map((row, ri) => {
      const cells = row.map((cell, ci) => {
        const label = escapeHtml(columns[ci] || '')
        const cls = ci === 3 ? statusClass(cell) : ''
        const cellCls = cls ? `class="${cls}"` : ''
        return `        <td data-label="${label}" ${cellCls}>${escapeHtml(cell)}</td>`
      }).join('\n')
      const rowCls = ri === 1 ? 'is-selected' : ''
      return [
        `    <tr ${rowCls ? `class="${rowCls}"` : ''}>`,
        cells,
        '    </tr>',
      ].join('\n')
    })
    .join('\n')

  const pagination = showPagination
    ? [
        '  <nav class="table-pagination" aria-label="Table pagination">',
        `    <span class="table-pagination__info">${lang === 'en' ? 'Showing 1-5 of 24' : 'Mostrando 1-5 de 24'}</span>`,
        '    <div class="table-pagination__actions">',
        `      <button class="table-pagination__btn" type="button" disabled>${lang === 'en' ? 'Previous' : 'Anterior'}</button>`,
        '      <button class="table-pagination__btn is-active" type="button">1</button>',
        '      <button class="table-pagination__btn" type="button">2</button>',
        '      <button class="table-pagination__btn" type="button">3</button>',
        `      <button class="table-pagination__btn" type="button">${lang === 'en' ? 'Next' : 'Próximo'}</button>`,
        '    </div>',
        '  </nav>',
      ].join('\n')
    : ''

  return [
    '<div class="table-wrapper">',
    '  <div class="table-scroll">',
    '    <table class="data-table">',
    '      <caption>',
    lang === 'en' ? 'Team members' : 'Membros da equipe',
    '      </caption>',
    '      <thead>',
    '        <tr>',
    ths,
    '        </tr>',
    '      </thead>',
    '      <tbody>',
    trs,
    '      </tbody>',
    '    </table>',
    '  </div>',
    pagination,
    '</div>',
  ].join('\n')
}

export function buildTableFullDemo(options = {}, lang = 'pt') {
  return `${buildTableCss(options)}\n\n${buildTableHtml(options, lang)}`
}
