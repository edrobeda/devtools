const DEFAULTS = {
  className: 'stepper',
  orientation: 'horizontal',
  align: 'center',
  shape: 'circle',
  size: 32,
  borderWidth: 2,
  connectorWidth: 2,
  connectorStyle: 'solid',
  gap: 24,
  titleSize: 14,
  descSize: 12,
  showDescription: true,
  showCheckOnComplete: true,
  pendingBg: '#ffffff',
  pendingBorder: '#d9d9d9',
  pendingText: '#595959',
  activeBg: '#1677ff',
  activeBorder: '#1677ff',
  activeText: '#ffffff',
  completedBg: '#52c41a',
  completedBorder: '#52c41a',
  completedText: '#ffffff',
  titleColor: '#262626',
  descColor: '#8c8c8c',
  connectorColor: '#d9d9d9',
  connectorActiveColor: '#1677ff',
}

function toPx(value) {
  return `${value}px`
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markerShape(radius) {
  return radius === 999 ? '9999px' : toPx(radius)
}

export function buildStepperCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const borderRadius = opts.shape === 'square' ? '4px' : markerShape(opts.shape === 'circle' ? opts.size / 2 : opts.shape === 'rounded' ? opts.size / 4 : 999)
  const isHorizontal = opts.orientation === 'horizontal'

  const connectorRule = isHorizontal
    ? `  position: absolute;
  top: calc(${toPx(opts.size / 2)} - ${toPx(opts.connectorWidth / 2)});
  left: 50%;
  width: calc(100% - ${toPx(opts.size)});
  margin-left: ${toPx(opts.size / 2)};
  height: ${toPx(opts.connectorWidth)};
  border-top: ${toPx(opts.connectorWidth)} ${opts.connectorStyle} ${opts.connectorColor};`
    : `  position: absolute;
  left: calc(${toPx(opts.size / 2)} - ${toPx(opts.connectorWidth / 2)});
  top: ${toPx(opts.size)};
  width: ${toPx(opts.connectorWidth)};
  height: calc(100% - ${toPx(opts.size)});
  border-left: ${toPx(opts.connectorWidth)} ${opts.connectorStyle} ${opts.connectorColor};`

  const alignItems = isHorizontal
    ? opts.align === 'start' ? 'flex-start' : opts.align === 'end' ? 'flex-end' : 'center'
    : 'flex-start'
  const textAlign = isHorizontal ? (opts.align === 'start' ? 'left' : opts.align === 'end' ? 'right' : 'center') : 'left'

  return `.${cn} {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  flex-direction: ${isHorizontal ? 'row' : 'column'};
  gap: ${isHorizontal ? '0' : toPx(opts.gap)};
}

.${cn}__item {
  flex: ${isHorizontal ? '1' : '0 0 auto'};
  display: flex;
  position: relative;
  flex-direction: ${isHorizontal ? 'column' : 'row'};
  align-items: ${alignItems};
  ${isHorizontal ? `text-align: ${textAlign};` : ''}
  min-width: ${isHorizontal ? toPx(opts.size + opts.gap) : 'auto'};
}

.${cn}__item:not(:last-child)::after {
  content: "";
  ${connectorRule}
  transition: border-color 0.2s ease;
}

.${cn}__item--active:not(:last-child)::after,
.${cn}__item--completed:not(:last-child)::after {
  border-color: ${opts.connectorActiveColor};
}

.${cn}__marker {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${toPx(opts.size)};
  height: ${toPx(opts.size)};
  font-size: ${toPx(Math.round(opts.size * 0.44))};
  font-weight: 600;
  line-height: 1;
  border: ${toPx(opts.borderWidth)} solid ${opts.pendingBorder};
  border-radius: ${borderRadius};
  background: ${opts.pendingBg};
  color: ${opts.pendingText};
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.${cn}__item--active .${cn}__marker {
  background: ${opts.activeBg};
  border-color: ${opts.activeBorder};
  color: ${opts.activeText};
  box-shadow: 0 0 0 4px ${opts.activeBg}33;
}

.${cn}__item--completed .${cn}__marker {
  background: ${opts.completedBg};
  border-color: ${opts.completedBorder};
  color: ${opts.completedText};
}

.${cn}__content {
  display: flex;
  flex-direction: column;
  ${isHorizontal ? `margin-top: ${toPx(opts.gap / 2)};` : `margin-left: ${toPx(opts.gap / 2)};`}
}

.${cn}__title {
  font-size: ${toPx(opts.titleSize)};
  font-weight: 600;
  color: ${opts.titleColor};
  line-height: 1.3;
}

.${cn}__desc {
  font-size: ${toPx(opts.descSize)};
  color: ${opts.descColor};
  line-height: 1.4;
  margin-top: 2px;
}

.${cn}__item--active .${cn}__title,
.${cn}__item--completed .${cn}__title {
  color: ${opts.titleColor};
}

.${cn}__item--active .${cn}__desc,
.${cn}__item--completed .${cn}__desc {
  color: ${opts.descColor};
}

.${cn}__item--active .${cn}__title {
  color: ${opts.activeBg};
}
${opts.showCheckOnComplete ? `
.${cn}__item--completed .${cn}__marker span {
  opacity: 0;
}

.${cn}__item--completed .${cn}__marker::before {
  content: "✓";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${opts.completedText};
}` : ''}`
}

export function buildStepperHtml(items = [], options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const safeItems = items
    .map((it) => (typeof it === 'string' ? { title: it, desc: '' } : { title: String(it.title || ''), desc: String(it.desc || '') }))
    .filter((it) => it.title.trim())

  if (safeItems.length === 0) {
    return `<ol class="${cn}" aria-label="Progress">\n  <li class="${cn}__item ${cn}__item--active" aria-current="step">\n    <span class="${cn}__marker"><span>1</span></span>\n    <span class="${cn}__content">\n      <span class="${cn}__title">Step 1</span>\n    </span>\n  </li>\n</ol>`
  }

  const listItems = safeItems
    .map((it, idx) => {
      const isLast = idx === safeItems.length - 1
      const stateClass = idx === 0 ? `${cn}__item--active` : ''
      const ariaCurrent = idx === 0 ? ' aria-current="step"' : ''
      const descHtml = opts.showDescription && it.desc.trim()
        ? `\n      <span class="${cn}__desc">${escapeHtml(it.desc)}</span>`
        : ''
      return `  <li class="${cn}__item ${stateClass}"${ariaCurrent}>\n    <span class="${cn}__marker"><span>${idx + 1}</span></span>\n    <span class="${cn}__content">\n      <span class="${cn}__title">${escapeHtml(it.title)}</span>${descHtml}\n    </span>\n  </li>${isLast ? '' : '\n'}`
    })
    .join('')

  return `<ol class="${cn}" aria-label="Progress">\n${listItems}\n</ol>`
}

export function buildStepperFullDemo(items = [], options = {}) {
  const css = buildStepperCss(options)
  const html = buildStepperHtml(items, options)
  return `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
}

export const STEPPER_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: {},
  },
  {
    key: 'minimal',
    name: { pt: 'Minimalista', en: 'Minimal' },
    opts: {
      borderWidth: 1,
      connectorWidth: 1,
      size: 24,
      titleSize: 13,
      descSize: 11,
      gap: 16,
      pendingBg: 'transparent',
      pendingBorder: '#bfbfbf',
      pendingText: '#595959',
      activeBg: '#1677ff',
      activeBorder: '#1677ff',
      activeText: '#ffffff',
      completedBg: 'transparent',
      completedBorder: '#52c41a',
      completedText: '#52c41a',
      connectorColor: '#e0e0e0',
      connectorActiveColor: '#52c41a',
      showCheckOnComplete: true,
    },
  },
  {
    key: 'colorful',
    name: { pt: 'Colorido', en: 'Colorful' },
    opts: {
      pendingBg: '#fff2e8',
      pendingBorder: '#ffbb96',
      pendingText: '#873800',
      activeBg: '#fa541c',
      activeBorder: '#fa541c',
      activeText: '#ffffff',
      completedBg: '#52c41a',
      completedBorder: '#52c41a',
      completedText: '#ffffff',
      connectorColor: '#ffd8bf',
      connectorActiveColor: '#52c41a',
      titleColor: '#434343',
      descColor: '#8c8c8c',
    },
  },
  {
    key: 'dark',
    name: { pt: 'Escuro', en: 'Dark' },
    opts: {
      pendingBg: '#1f1f1f',
      pendingBorder: '#434343',
      pendingText: '#a6a6a6',
      activeBg: '#177ddc',
      activeBorder: '#177ddc',
      activeText: '#ffffff',
      completedBg: '#49aa19',
      completedBorder: '#49aa19',
      completedText: '#ffffff',
      titleColor: '#e0e0e0',
      descColor: '#8c8c8c',
      connectorColor: '#434343',
      connectorActiveColor: '#49aa19',
    },
  },
  {
    key: 'rounded',
    name: { pt: 'Arredondado', en: 'Rounded' },
    opts: {
      shape: 'rounded',
      size: 36,
      borderWidth: 0,
      connectorWidth: 3,
      gap: 28,
      titleSize: 15,
      descSize: 12,
      pendingBg: '#f0f0f0',
      pendingText: '#595959',
      activeBg: '#722ed1',
      activeText: '#ffffff',
      completedBg: '#b37feb',
      completedText: '#ffffff',
      connectorColor: '#e6e6e6',
      connectorActiveColor: '#b37feb',
    },
  },
]
