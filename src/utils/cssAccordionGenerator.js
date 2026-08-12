const DEFAULTS = {
  className: 'accordion',
  items: [
    { title: 'Primeira seção', content: 'Conteúdo da primeira seção do accordion.' },
    { title: 'Segunda seção', content: 'Conteúdo da segunda seção do accordion.' },
    { title: 'Terceira seção', content: 'Conteúdo da terceira seção do accordion.' },
  ],
  headerBg: '#ffffff',
  headerColor: '#262626',
  headerActiveBg: '#f0f0ff',
  headerActiveColor: '#2f2f2f',
  contentBg: '#ffffff',
  contentColor: '#434343',
  borderColor: '#d9d9d9',
  borderWidth: 1,
  borderRadius: 8,
  paddingHeader: 16,
  paddingContent: 16,
  fontSizeHeader: 16,
  fontSizeContent: 14,
  icon: 'chevron',
  iconPosition: 'right',
  animation: 'slide',
  duration: 250,
  easing: 'ease-out',
  gap: 8,
  allowMultiple: true,
  exclusiveName: 'accordion-group',
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function iconContent(kind, state) {
  if (kind === 'chevron') return state === 'open' ? '❮' : '❯'
  if (kind === 'arrow') return state === 'open' ? '▲' : '▼'
  if (kind === 'plus-minus') return state === 'open' ? '−' : '+'
  return ''
}

function iconTransform(kind, state) {
  if (kind === 'chevron') return state === 'open' ? 'rotate(-90deg)' : 'rotate(90deg)'
  if (kind === 'arrow') return 'none'
  return 'none'
}

function buildIconRules(opts, pseudo) {
  const kind = opts.icon
  if (kind === 'none') return ''
  const position = opts.iconPosition
  const base = kind === 'chevron'
    ? `  content: '${iconContent(kind, 'closed')}';
  display: inline-block;
  transition: transform ${opts.duration}ms ${opts.easing};`
    : `  content: '${iconContent(kind, 'closed')}';
  display: inline-block;`

  const open = `details[open] > summary::${pseudo} {
  content: '${iconContent(kind, 'open')}';
${kind === 'chevron' ? `  transform: ${iconTransform(kind, 'open')};` : ''}
}`

  return `.${opts.className}-item summary::${pseudo} {
${base}
${position === 'left' ? '  margin-right: 12px;' : '  margin-left: 12px;'}
}

${open}`
}

export function buildAccordionCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const border = `${opts.borderWidth}px solid ${opts.borderColor}`
  const radius = `${opts.borderRadius}px`
  const headerPadding = `${opts.paddingHeader}px`
  const contentPadding = `${opts.paddingContent}px`
  const pseudo = opts.iconPosition === 'left' ? 'before' : 'after'
  const iconRules = buildIconRules(opts, pseudo)

  const animationBlock = opts.animation === 'slide'
    ? `.${cn}-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows ${opts.duration}ms ${opts.easing};
}

details[open] > .${cn}-content {
  grid-template-rows: 1fr;
}

.${cn}-inner {
  overflow: hidden;
}`
    : opts.animation === 'fade'
      ? `.${cn}-content {
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity ${opts.duration}ms ${opts.easing}, transform ${opts.duration}ms ${opts.easing};
}

details[open] > .${cn}-content {
  opacity: 1;
  transform: translateY(0);
}`
      : `.${cn}-content {
  display: block;
}`

  return `.${cn} {
  display: flex;
  flex-direction: column;
  gap: ${opts.gap}px;
}

.${cn}-item {
  border: ${border};
  border-radius: ${radius};
  overflow: hidden;
  background: ${opts.contentBg};
}

.${cn}-item summary {
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: ${headerPadding};
  background: ${opts.headerBg};
  color: ${opts.headerColor};
  font-size: ${opts.fontSizeHeader}px;
  font-weight: 500;
  user-select: none;
}

.${cn}-item summary::-webkit-details-marker {
  display: none;
}

.${cn}-item summary:hover {
  background: ${opts.headerActiveBg};
}

details[open] > summary {
  background: ${opts.headerActiveBg};
  color: ${opts.headerActiveColor};
}

.${cn}-item .${cn}-content {
  color: ${opts.contentColor};
  font-size: ${opts.fontSizeContent}px;
  background: ${opts.contentBg};
}

.${cn}-item .${cn}-inner {
  padding: ${contentPadding};
}

${animationBlock}

${iconRules}`
}

export function buildAccordionHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const nameAttr = opts.allowMultiple ? '' : ` name="${opts.exclusiveName}"`

  const items = opts.items
    .map((item, idx) => {
      const title = escapeHtml(item.title)
      const content = escapeHtml(item.content)
      return `  <details class="${cn}-item"${nameAttr}>
    <summary>${title}</summary>
    <div class="${cn}-content">
      <div class="${cn}-inner">
        ${content}
      </div>
    </div>
  </details>`
    })
    .join('\n')

  return `<div class="${cn}">
${items}
</div>`
}

export function buildAccordionFullDemo(options = {}) {
  const css = buildAccordionCss(options)
  const html = buildAccordionHtml(options)
  return `<!-- HTML -->
${html}

/* CSS */
${css}`
}

export const ACCORDION_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: {
      headerBg: '#ffffff',
      headerColor: '#262626',
      headerActiveBg: '#f0f0ff',
      headerActiveColor: '#2f2f2f',
      contentBg: '#ffffff',
      contentColor: '#434343',
      borderColor: '#d9d9d9',
      icon: 'chevron',
      animation: 'slide',
      gap: 8,
    },
  },
  {
    key: 'filled',
    name: { pt: 'Preenchido', en: 'Filled' },
    opts: {
      headerBg: '#f5f5f5',
      headerColor: '#262626',
      headerActiveBg: '#e6e6ff',
      headerActiveColor: '#1a1a1a',
      contentBg: '#fafafa',
      contentColor: '#434343',
      borderColor: '#bfbfbf',
      icon: 'plus-minus',
      animation: 'slide',
      gap: 12,
      paddingHeader: 18,
      paddingContent: 18,
    },
  },
  {
    key: 'minimal',
    name: { pt: 'Minimalista', en: 'Minimal' },
    opts: {
      headerBg: '#ffffff',
      headerColor: '#262626',
      headerActiveBg: '#ffffff',
      headerActiveColor: '#000000',
      contentBg: '#ffffff',
      contentColor: '#595959',
      borderColor: '#d9d9d9',
      borderWidth: 0,
      borderRadius: 0,
      icon: 'arrow',
      animation: 'fade',
      gap: 0,
      paddingHeader: 14,
      paddingContent: 14,
    },
  },
  {
    key: 'rounded-cards',
    name: { pt: 'Cards arredondados', en: 'Rounded cards' },
    opts: {
      headerBg: '#ffffff',
      headerColor: '#262626',
      headerActiveBg: '#fff7e6',
      headerActiveColor: '#262626',
      contentBg: '#ffffff',
      contentColor: '#434343',
      borderColor: '#ffd8bf',
      borderRadius: 16,
      icon: 'chevron',
      iconPosition: 'left',
      animation: 'slide',
      gap: 16,
      shadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
  },
]
