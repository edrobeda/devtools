const DEFAULTS = {
  className: 'timeline',
  layout: 'center', // 'center' | 'left' | 'right'
  lineColor: '#d9d9d9',
  lineWidth: 2,
  lineStyle: 'solid', // 'solid' | 'dashed' | 'dotted'
  dotSize: 16,
  dotColor: '#1677ff',
  dotBorderWidth: 3,
  dotBorderColor: '#ffffff',
  dotStyle: 'filled', // 'filled' | 'outline' | 'number'
  dotNumberColor: '#ffffff',
  itemGap: 24,
  cardBg: '#f6ffed',
  cardBorderColor: '#b7eb8f',
  cardBorderWidth: 1,
  cardRadius: 8,
  cardPadding: 16,
  cardShadow: '0 1px 2px rgba(0,0,0,0.06)',
  titleColor: '#262626',
  dateColor: '#8c8c8c',
  textColor: '#595959',
  connectorOffset: 24,
  alternate: true,
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function lineStyleValue(style) {
  if (style === 'dashed') return 'dashed'
  if (style === 'dotted') return 'dotted'
  return 'solid'
}

export function buildTimelineCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const lineCss = `${opts.lineWidth}px ${lineStyleValue(opts.lineStyle)} ${opts.lineColor}`
  const halfDot = opts.dotSize / 2
  const centerLeft = `calc(50% - ${opts.lineWidth / 2}px)`

  // Base container
  let css = `.${cn} {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 800px;
}

.${cn}::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: ${opts.lineWidth}px;
  background: ${opts.lineColor};
}`

  if (opts.layout === 'center') {
    css += `
.${cn}::before {
  left: 50%;
  transform: translateX(-50%);
}

.${cn}__item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: ${opts.itemGap}px;
  min-height: ${opts.dotSize}px;
}

.${cn}__item:last-child {
  margin-bottom: 0;
}

.${cn}__dot {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: ${opts.dotSize}px;
  height: ${opts.dotSize}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${Math.max(10, opts.dotSize * 0.45)}px;
  font-weight: 600;
  line-height: 1;
  z-index: 1;
  border: ${opts.dotBorderWidth}px solid ${opts.dotBorderColor};
  background: ${opts.dotStyle === 'outline' ? 'transparent' : opts.dotColor};
  color: ${opts.dotStyle === 'outline' ? opts.dotColor : opts.dotNumberColor};
  box-shadow: 0 0 0 2px ${opts.lineColor}33;
}

.${cn}__content {
  width: calc(50% - ${halfDot + 8}px);
  background: ${opts.cardBg};
  border: ${opts.cardBorderWidth}px solid ${opts.cardBorderColor};
  border-radius: ${opts.cardRadius}px;
  padding: ${opts.cardPadding}px;
  box-shadow: ${opts.cardShadow};
}

.${cn}__item:nth-child(odd) .${cn}__content {
  margin-right: auto;
}

.${cn}__item:nth-child(even) .${cn}__content {
  margin-left: auto;
}

.${cn}__title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: ${opts.titleColor};
}

.${cn}__date {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: ${opts.dateColor};
}

.${cn}__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${opts.textColor};
}`

    if (!opts.alternate) {
      css += `

.${cn}__item:nth-child(even) .${cn}__content {
  margin-left: 0;
  margin-right: auto;
}`
    }
  } else if (opts.layout === 'left') {
    const offset = opts.connectorOffset
    css += `
.${cn}::before {
  left: ${offset}px;
}

.${cn}__item {
  position: relative;
  padding-left: ${offset + halfDot + 16}px;
  margin-bottom: ${opts.itemGap}px;
  min-height: ${opts.dotSize}px;
}

.${cn}__item:last-child {
  margin-bottom: 0;
}

.${cn}__dot {
  position: absolute;
  left: ${offset - halfDot + opts.lineWidth / 2}px;
  top: 0;
  width: ${opts.dotSize}px;
  height: ${opts.dotSize}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${Math.max(10, opts.dotSize * 0.45)}px;
  font-weight: 600;
  line-height: 1;
  z-index: 1;
  border: ${opts.dotBorderWidth}px solid ${opts.dotBorderColor};
  background: ${opts.dotStyle === 'outline' ? 'transparent' : opts.dotColor};
  color: ${opts.dotStyle === 'outline' ? opts.dotColor : opts.dotNumberColor};
  box-shadow: 0 0 0 2px ${opts.lineColor}33;
}

.${cn}__content {
  background: ${opts.cardBg};
  border: ${opts.cardBorderWidth}px solid ${opts.cardBorderColor};
  border-radius: ${opts.cardRadius}px;
  padding: ${opts.cardPadding}px;
  box-shadow: ${opts.cardShadow};
}

.${cn}__title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: ${opts.titleColor};
}

.${cn}__date {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: ${opts.dateColor};
}

.${cn}__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${opts.textColor};
}`
  } else if (opts.layout === 'right') {
    const offset = opts.connectorOffset
    css += `
.${cn}::before {
  right: ${offset}px;
}

.${cn}__item {
  position: relative;
  padding-right: ${offset + halfDot + 16}px;
  margin-bottom: ${opts.itemGap}px;
  min-height: ${opts.dotSize}px;
  text-align: right;
}

.${cn}__item:last-child {
  margin-bottom: 0;
}

.${cn}__dot {
  position: absolute;
  right: ${offset - halfDot + opts.lineWidth / 2}px;
  top: 0;
  width: ${opts.dotSize}px;
  height: ${opts.dotSize}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${Math.max(10, opts.dotSize * 0.45)}px;
  font-weight: 600;
  line-height: 1;
  z-index: 1;
  border: ${opts.dotBorderWidth}px solid ${opts.dotBorderColor};
  background: ${opts.dotStyle === 'outline' ? 'transparent' : opts.dotColor};
  color: ${opts.dotStyle === 'outline' ? opts.dotColor : opts.dotNumberColor};
  box-shadow: 0 0 0 2px ${opts.lineColor}33;
}

.${cn}__content {
  background: ${opts.cardBg};
  border: ${opts.cardBorderWidth}px solid ${opts.cardBorderColor};
  border-radius: ${opts.cardRadius}px;
  padding: ${opts.cardPadding}px;
  box-shadow: ${opts.cardShadow};
}

.${cn}__title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: ${opts.titleColor};
}

.${cn}__date {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: ${opts.dateColor};
}

.${cn}__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${opts.textColor};
}`
  }

  // Responsive fallback for center layout: stack on narrow screens
  if (opts.layout === 'center') {
    css += `

@media (max-width: 600px) {
  .${cn}::before {
    left: ${opts.connectorOffset}px;
    transform: none;
  }
  .${cn}__dot {
    left: ${opts.connectorOffset - halfDot + opts.lineWidth / 2}px;
    transform: none;
  }
  .${cn}__content {
    width: auto;
    margin-left: ${opts.connectorOffset + halfDot + 16}px !important;
    margin-right: 0 !important;
    text-align: left;
  }
}`
  }

  return css
}

export function buildTimelineHtml(items = [], options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const safeItems = items.length > 0 ? items : [
    { title: 'Início', date: '2026-01-01', text: 'Primeiro marco do projeto.' },
    { title: 'Meio', date: '2026-06-01', text: 'Etapa intermediária com entregas importantes.' },
    { title: 'Fim', date: '2026-12-01', text: 'Conclusão e lançamento oficial.' },
  ]

  const listItems = safeItems
    .map((it, idx) => {
      const number = idx + 1
      const dotContent = opts.dotStyle === 'number' ? number : ''
      const title = escapeHtml(it.title ?? '')
      const date = escapeHtml(it.date ?? '')
      const text = escapeHtml(it.text ?? '')
      return [
        '  <li class="timeline__item">',
        `    <div class="timeline__dot">${dotContent}</div>`,
        '    <div class="timeline__content">',
        `      <h3 class="timeline__title">${title}</h3>`,
        date ? `      <time class="timeline__date">${date}</time>` : '',
        text ? `      <p class="timeline__text">${text}</p>` : '',
        '    </div>',
        '  </li>',
      ].filter(Boolean).join('\n')
    })
    .join('\n')

  return `<ul class="${cn}">\n${listItems}\n</ul>`
}

export function buildTimelineFullDemo(items = [], options = {}) {
  const css = buildTimelineCss(options)
  const html = buildTimelineHtml(items, options)
  return `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
}

export const TIMELINE_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: {},
  },
  {
    key: 'minimal',
    name: { pt: 'Minimalista', en: 'Minimal' },
    opts: {
      layout: 'left',
      lineColor: '#bfbfbf',
      lineWidth: 1,
      dotSize: 10,
      dotBorderWidth: 0,
      dotColor: '#595959',
      cardBg: 'transparent',
      cardBorderWidth: 0,
      cardRadius: 0,
      cardPadding: 0,
      cardShadow: 'none',
      titleColor: '#262626',
      textColor: '#595959',
      itemGap: 20,
    },
  },
  {
    key: 'colorful',
    name: { pt: 'Colorido', en: 'Colorful' },
    opts: {
      layout: 'center',
      lineColor: '#1677ff',
      dotColor: '#1677ff',
      dotBorderColor: '#ffffff',
      cardBg: '#e6f4ff',
      cardBorderColor: '#91caff',
      cardBorderWidth: 1,
      cardRadius: 12,
      cardPadding: 18,
      cardShadow: '0 4px 12px rgba(22,119,255,0.12)',
      titleColor: '#0958d9',
      dateColor: '#1677ff',
      textColor: '#434343',
      itemGap: 32,
    },
  },
  {
    key: 'dark',
    name: { pt: 'Escuro', en: 'Dark' },
    opts: {
      layout: 'left',
      lineColor: '#434343',
      lineWidth: 2,
      dotSize: 18,
      dotColor: '#fa8c16',
      dotBorderColor: '#1f1f1f',
      dotNumberColor: '#1f1f1f',
      cardBg: '#1f1f1f',
      cardBorderColor: '#434343',
      cardBorderWidth: 1,
      cardRadius: 8,
      cardPadding: 16,
      cardShadow: '0 2px 8px rgba(0,0,0,0.45)',
      titleColor: '#ffffff',
      dateColor: '#a6a6a6',
      textColor: '#bfbfbf',
      itemGap: 28,
      connectorOffset: 20,
    },
  },
  {
    key: 'outline',
    name: { pt: 'Contorno', en: 'Outline' },
    opts: {
      layout: 'center',
      dotStyle: 'outline',
      lineStyle: 'dashed',
      lineColor: '#8c8c8c',
      dotColor: '#1677ff',
      dotBorderColor: '#1677ff',
      dotBorderWidth: 2,
      cardBg: '#ffffff',
      cardBorderColor: '#d9d9d9',
      cardBorderWidth: 1,
      cardRadius: 8,
      cardPadding: 16,
      cardShadow: 'none',
      titleColor: '#262626',
      dateColor: '#8c8c8c',
      textColor: '#595959',
      itemGap: 28,
    },
  },
]
