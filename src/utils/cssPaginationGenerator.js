// Gerador de paginação CSS puro.
//
// Produz uma barra de paginação semântica usando <nav>, <ul>, <li> e <a>,
// com estilos filled, outline e minimal, e estados active/hover/disabled.

function parseColor(color) {
  if (!color) return '#1677ff'
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

const DEFAULTS = {
  variant: 'filled',
  shape: 'rounded',
  activeColor: '#1677ff',
  inactiveColor: '#ffffff',
  hoverColor: '#e6f4ff',
  textColor: '#ffffff',
  borderColor: '#d9d9d9',
  borderWidth: 1,
  borderRadius: 8,
  itemSize: 40,
  gap: 8,
  fontSize: 14,
  fontWeight: 500,
  transitionDuration: 150,
  shadow: '0 2px 4px rgba(0,0,0,0.15)',
  showPrevNext: true,
  showFirstLast: false,
  showEllipsis: true,
  prevLabel: '‹',
  nextLabel: '›',
  firstLabel: '«',
  lastLabel: '»',
  totalPages: 10,
  currentPage: 1,
  ariaLabel: 'Pagination',
}

const PRESETS = {
  default: {
    variant: 'filled',
    shape: 'rounded',
    activeColor: '#1677ff',
    inactiveColor: '#ffffff',
    hoverColor: '#e6f4ff',
    textColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 1,
    borderRadius: 8,
    itemSize: 40,
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    transitionDuration: 150,
    shadow: '0 2px 4px rgba(0,0,0,0.15)',
    showPrevNext: true,
    showFirstLast: false,
    showEllipsis: true,
    prevLabel: '‹',
    nextLabel: '›',
    firstLabel: '«',
    lastLabel: '»',
  },
  outline: {
    variant: 'outline',
    shape: 'rounded',
    activeColor: '#ffffff',
    inactiveColor: '#ffffff',
    hoverColor: '#f6ffed',
    textColor: '#52c41a',
    borderColor: '#b7eb8f',
    borderWidth: 1,
    borderRadius: 8,
    itemSize: 40,
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    transitionDuration: 150,
    shadow: 'none',
    showPrevNext: true,
    showFirstLast: false,
    showEllipsis: true,
    prevLabel: '‹',
    nextLabel: '›',
    firstLabel: '«',
    lastLabel: '»',
  },
  minimal: {
    variant: 'minimal',
    shape: 'square',
    activeColor: '#1677ff',
    inactiveColor: 'transparent',
    hoverColor: '#f0f0f0',
    textColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    itemSize: 36,
    gap: 0,
    fontSize: 14,
    fontWeight: 500,
    transitionDuration: 120,
    shadow: 'none',
    showPrevNext: true,
    showFirstLast: false,
    showEllipsis: true,
    prevLabel: '‹',
    nextLabel: '›',
    firstLabel: '«',
    lastLabel: '»',
  },
  pills: {
    variant: 'filled',
    shape: 'pill',
    activeColor: '#722ed1',
    inactiveColor: '#f9f0ff',
    hoverColor: '#efdbff',
    textColor: '#ffffff',
    borderColor: '#d3adf7',
    borderWidth: 1,
    borderRadius: 50,
    itemSize: 40,
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    transitionDuration: 180,
    shadow: '0 2px 6px rgba(114,46,209,0.25)',
    showPrevNext: true,
    showFirstLast: false,
    showEllipsis: true,
    prevLabel: '‹',
    nextLabel: '›',
    firstLabel: '«',
    lastLabel: '»',
  },
  dark: {
    variant: 'filled',
    shape: 'rounded',
    activeColor: '#ffffff',
    inactiveColor: '#141414',
    hoverColor: '#262626',
    textColor: '#000000',
    borderColor: '#434343',
    borderWidth: 1,
    borderRadius: 6,
    itemSize: 40,
    gap: 6,
    fontSize: 14,
    fontWeight: 500,
    transitionDuration: 150,
    shadow: '0 0 0 1px #434343',
    showPrevNext: true,
    showFirstLast: false,
    showEllipsis: true,
    prevLabel: '‹',
    nextLabel: '›',
    firstLabel: '«',
    lastLabel: '»',
  },
}

export { PRESETS, DEFAULTS }

export function buildPaginationCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const variant = opts.variant || 'filled'
  const shape = opts.shape || 'rounded'
  const active = parseColor(opts.activeColor)
  const inactive = parseColor(opts.inactiveColor)
  const hover = parseColor(opts.hoverColor)
  const text = parseColor(opts.textColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || DEFAULTS.borderWidth, 0, 8)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, 50)
  const itemSize = clamp(Number(opts.itemSize) || DEFAULTS.itemSize, 24, 64)
  const gap = clamp(Number(opts.gap) || DEFAULTS.gap, 0, 32)
  const fontSize = clamp(Number(opts.fontSize) || DEFAULTS.fontSize, 10, 24)
  const fontWeight = clamp(Number(opts.fontWeight) || DEFAULTS.fontWeight, 100, 900)
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 1000)
  const shadow = opts.shadow || 'none'

  const radius = shape === 'pill' ? '9999px' : shape === 'square' ? '0' : `${Math.round(borderRadius)}px`
  const borderStyle = borderWidth > 0 ? `${toPx(borderWidth)} solid ${border}` : 'none'

  let activeBg
  let activeText
  let activeBorder
  let itemBg
  let itemText
  let itemBorder

  if (variant === 'outline') {
    activeBg = inactive
    activeText = text
    activeBorder = borderWidth > 0 ? `${toPx(borderWidth)} solid ${text}` : 'none'
    itemBg = inactive
    itemText = text
    itemBorder = borderStyle
  } else if (variant === 'minimal') {
    activeBg = active
    activeText = text
    activeBorder = 'none'
    itemBg = 'transparent'
    itemText = active
    itemBorder = 'none'
  } else {
    activeBg = active
    activeText = text
    activeBorder = borderWidth > 0 ? `${toPx(borderWidth)} solid ${active}` : 'none'
    itemBg = inactive
    itemText = active
    itemBorder = borderStyle
  }

  const paddingX = Math.max(8, Math.round(itemSize * 0.35))

  const lines = [
    '/* Container da paginação */',
    '.pagination {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  list-style: none;',
    `  gap: ${toPx(gap)};`,
    '  margin: 0;',
    '  padding: 0;',
    '  font-family: inherit;',
    '}',
    '',
    '/* Cada item da lista */',
    '.pagination__item {',
    '  flex-shrink: 0;',
    '}',
    '',
    '/* Links e spans de página */',
    '.pagination__link {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    `  min-width: ${toPx(itemSize)};`,
    `  height: ${toPx(itemSize)};`,
    `  padding: 0 ${toPx(paddingX)};`,
    `  background: ${itemBg};`,
    `  color: ${itemText};`,
    `  border: ${itemBorder};`,
    `  border-radius: ${radius};`,
    `  box-shadow: none;`,
    `  font-size: ${toPx(fontSize)};`,
    `  font-weight: ${fontWeight};`,
    '  line-height: 1;',
    '  text-decoration: none;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    `  transition: background ${duration}ms ease, color ${duration}ms ease, border-color ${duration}ms ease, box-shadow ${duration}ms ease, transform ${duration}ms ease;`,
    '}',
    '',
    '/* Hover/foco em links clicáveis */',
    '.pagination__link:hover:not([aria-current="page"]):not([aria-disabled="true"]) {',
    `  background: ${hover};`,
    `  color: ${active};`,
    variant === 'minimal' ? null : `  border-color: ${active};`,
    '  text-decoration: none;',
    '}',
    '',
    '.pagination__link:focus-visible {',
    `  outline: 2px solid ${active};`,
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Item ativo */',
    '.pagination__item--active .pagination__link {',
    `  background: ${activeBg};`,
    `  color: ${activeText};`,
    `  border: ${activeBorder};`,
    `  box-shadow: ${shadow};`,
    '  cursor: default;',
    '}',
    '',
    '/* Itens desabilitados (primeira/última página) */',
    '.pagination__item--disabled .pagination__link {',
    '  opacity: 0.5;',
    '  cursor: not-allowed;',
    `  background: ${itemBg};`,
    `  color: ${itemText};`,
    variant === 'minimal' ? null : `  border-color: ${border};`,
    '}',
    '',
    '/* Ellipsis: não clicável */',
    '.pagination__item .pagination__link[aria-hidden="true"] {',
    '  cursor: default;',
    `  background: ${itemBg};`,
    '  border: none;',
    `  color: ${itemText};`,
    '}',
  ]

  return lines.filter(Boolean).join('\n')
}

function buildPageList(total, current, showEllipsis) {
  const totalPages = clamp(Number(total) || 1, 1, 999)
  const currentPage = clamp(Number(current) || 1, 1, totalPages)
  if (totalPages <= 7 || !showEllipsis) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = [1]
  let start = Math.max(2, currentPage - 1)
  let end = Math.min(totalPages - 1, currentPage + 1)
  if (currentPage <= 3) {
    start = 2
    end = 4
  } else if (currentPage >= totalPages - 2) {
    start = totalPages - 3
    end = totalPages - 1
  }
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push('…')
  pages.push(totalPages)
  return pages
}

export function buildPaginationHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const totalPages = clamp(Number(opts.totalPages) || DEFAULTS.totalPages, 1, 999)
  const currentPage = clamp(Number(opts.currentPage) || DEFAULTS.currentPage, 1, totalPages)
  const showPrevNext = !!opts.showPrevNext
  const showFirstLast = !!opts.showFirstLast
  const showEllipsis = !!opts.showEllipsis
  const prevLabel = String(opts.prevLabel ?? DEFAULTS.prevLabel)
  const nextLabel = String(opts.nextLabel ?? DEFAULTS.nextLabel)
  const firstLabel = String(opts.firstLabel ?? DEFAULTS.firstLabel)
  const lastLabel = String(opts.lastLabel ?? DEFAULTS.lastLabel)
  const ariaLabel = String(opts.ariaLabel || DEFAULTS.ariaLabel)

  const pages = buildPageList(totalPages, currentPage, showEllipsis)

  const link = (label, page, disabled = false, active = false) => {
    const liClass = ['pagination__item', active ? 'pagination__item--active' : '', disabled ? 'pagination__item--disabled' : '']
      .filter(Boolean)
      .join(' ')
    if (active) {
      return `    <li class="${liClass}"><span class="pagination__link" aria-current="page">${label}</span></li>`
    }
    if (disabled) {
      return `    <li class="${liClass}"><span class="pagination__link" aria-disabled="true">${label}</span></li>`
    }
    return `    <li class="${liClass}"><a class="pagination__link" href="?page=${page}">${label}</a></li>`
  }

  const parts = [`<nav aria-label="${ariaLabel}">`, '  <ul class="pagination">']
  if (showFirstLast) parts.push(link(firstLabel, 1, currentPage === 1))
  if (showPrevNext) parts.push(link(prevLabel, currentPage - 1, currentPage === 1))
  pages.forEach((p) => {
    if (p === '…') {
      parts.push(`    <li class="pagination__item"><span class="pagination__link" aria-hidden="true">${p}</span></li>`)
    } else {
      parts.push(link(String(p), p, false, p === currentPage))
    }
  })
  if (showPrevNext) parts.push(link(nextLabel, currentPage + 1, currentPage === totalPages))
  if (showFirstLast) parts.push(link(lastLabel, totalPages, currentPage === totalPages))
  parts.push('  </ul>', '</nav>')

  return parts.join('\n')
}

export function buildPaginationFullDemo(options = {}) {
  return `${buildPaginationCss(options)}\n\n${buildPaginationHtml(options)}`
}
