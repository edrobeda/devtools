const SEPARATORS = {
  slash: '/',
  arrow: '>',
  chevron: '›',
  pipe: '|',
  bullet: '•',
  gt: '»',
  'double-slash': '//',
  tilde: '~',
  arrowhead: '→',
}

const DEFAULTS = {
  className: 'breadcrumbs',
  separator: 'slash',
  direction: 'ltr',
  color: '#595959',
  activeColor: '#1677ff',
  separatorColor: '#bfbfbf',
  bgColor: 'transparent',
  hoverBgColor: '#f0f5ff',
  activeBgColor: '#e6f4ff',
  borderRadius: 6,
  paddingX: 10,
  paddingY: 6,
  fontSize: 14,
  gap: 8,
  underlineOnHover: false,
  lastAsActive: true,
}

function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

export function getSeparatorChar(kind) {
  return SEPARATORS[kind] ?? SEPARATORS.slash
}

export function buildBreadcrumbsCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const sep = escapeString(getSeparatorChar(opts.separator))
  const cn = opts.className

  return `.${cn} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${opts.gap}px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: ${opts.fontSize}px;
  direction: ${opts.direction};
}

.${cn} li {
  display: flex;
  align-items: center;
}

.${cn} li:not(:last-child)::after {
  content: "${sep}";
  margin-inline-start: ${opts.gap}px;
  color: ${opts.separatorColor};
}

.${cn} a,
.${cn} [aria-current="page"] {
  display: inline-flex;
  align-items: center;
  padding: ${opts.paddingY}px ${opts.paddingX}px;
  border-radius: ${opts.borderRadius}px;
  text-decoration: none;
  color: ${opts.color};
  background: ${opts.bgColor};
  transition: background 0.2s ease, color 0.2s ease, text-decoration 0.2s ease;
}

.${cn} a:hover {
  color: ${opts.activeColor};
  background: ${opts.hoverBgColor};
  ${opts.underlineOnHover ? 'text-decoration: underline;' : 'text-decoration: none;'}
}

.${cn} [aria-current="page"] {
  color: ${opts.activeColor};
  background: ${opts.activeBgColor};
  font-weight: 600;
  cursor: default;
}`
}

export function buildBreadcrumbsHtml(items = []) {
  const safeItems = items.filter((it) => it && String(it).trim())
  if (safeItems.length === 0) {
    return '<nav aria-label="breadcrumb">\n  <ol class="breadcrumbs">\n    <li aria-current="page">Home</li>\n  </ol>\n</nav>'
  }
  const lastIndex = safeItems.length - 1
  const listItems = safeItems
    .map((label, idx) => {
      const escaped = String(label).replace(/</g, '&lt;').replace(/>/g, '&gt;')
      if (idx === lastIndex) {
        return `    <li aria-current="page">${escaped}</li>`
      }
      return `    <li><a href="#">${escaped}</a></li>`
    })
    .join('\n')
  return `<nav aria-label="breadcrumb">\n  <ol class="breadcrumbs">\n${listItems}\n  </ol>\n</nav>`
}

export function buildBreadcrumbsFullDemo(options = {}, items = []) {
  const css = buildBreadcrumbsCss(options)
  const html = buildBreadcrumbsHtml(items)
  return `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
}

export function buildPreviewStyle(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const sep = getSeparatorChar(opts.separator)

  return {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: opts.gap,
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontSize: opts.fontSize,
    direction: opts.direction,
    li: {
      display: 'flex',
      alignItems: 'center',
    },
    link: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: `${opts.paddingY}px ${opts.paddingX}px`,
      borderRadius: opts.borderRadius,
      textDecoration: 'none',
      color: opts.color,
      background: opts.bgColor,
      transition: 'background 0.2s ease, color 0.2s ease, text-decoration 0.2s ease',
    },
    linkHover: {
      color: opts.activeColor,
      background: opts.hoverBgColor,
      textDecoration: opts.underlineOnHover ? 'underline' : 'none',
    },
    current: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: `${opts.paddingY}px ${opts.paddingX}px`,
      borderRadius: opts.borderRadius,
      textDecoration: 'none',
      color: opts.activeColor,
      background: opts.activeBgColor,
      fontWeight: 600,
      cursor: 'default',
    },
    separator: {
      marginInlineStart: opts.gap,
      color: opts.separatorColor,
      userSelect: 'none',
    },
    separatorChar: sep,
  }
}

export const BREADCRUMBS_PRESETS = [
  { key: 'default', name: { pt: 'Padrão', en: 'Default' }, opts: {} },
  { key: 'pills', name: { pt: 'Pills', en: 'Pills' }, opts: { bgColor: '#f5f5f5', hoverBgColor: '#e6e6e6', activeBgColor: '#1677ff', activeColor: '#ffffff', color: '#595959', borderRadius: 999, paddingX: 14, paddingY: 8, separator: 'chevron' } },
  { key: 'minimal', name: { pt: 'Minimalista', en: 'Minimal' }, opts: { separator: 'arrow', bgColor: 'transparent', hoverBgColor: 'transparent', activeBgColor: 'transparent', activeColor: '#1677ff', underlineOnHover: true, paddingX: 4, paddingY: 0, gap: 6 } },
  { key: 'folder', name: { pt: 'Pasta', en: 'Folder' }, opts: { separator: 'gt', color: '#8c8c8c', activeColor: '#fa8c16', separatorColor: '#d9d9d9', bgColor: 'transparent', hoverBgColor: '#fff7e6', activeBgColor: '#fff7e6', borderRadius: 4 } },
]
