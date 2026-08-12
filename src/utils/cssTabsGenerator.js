const DEFAULTS = {
  className: 'tabs',
  orientation: 'horizontal',
  variant: 'underline',
  fontSize: 14,
  gap: 8,
  paddingX: 16,
  paddingY: 10,
  borderRadius: 6,
  borderWidth: 2,
  contentPadding: 16,
  color: '#595959',
  activeColor: '#1677ff',
  bgColor: 'transparent',
  hoverBgColor: '#f5f5f5',
  activeBgColor: '#e6f4ff',
  borderColor: '#d9d9d9',
  activeBorderColor: '#1677ff',
  contentBg: '#ffffff',
  transitionDuration: 200,
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeCssString(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

export function buildTabsCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const isHorizontal = opts.orientation === 'horizontal'
  const isPills = opts.variant === 'pills'
  const isCards = opts.variant === 'cards'
  const isBorder = opts.variant === 'border'

  let labelBase = ''
  let labelActive = ''
  let labelHover = ''
  let panelBase = ''
  let containerExtra = ''
  let labelContainer = ''

  const commonLabel = `  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${opts.paddingY}px ${opts.paddingX}px;
  font-size: ${opts.fontSize}px;
  color: ${opts.color};
  background: ${opts.bgColor};
  cursor: pointer;
  transition: all ${opts.transitionDuration}ms ease;
  border-radius: ${isPills ? `${opts.borderRadius}px` : isCards ? `${opts.borderRadius}px ${opts.borderRadius}px 0 0` : '0'};`

  if (opts.variant === 'underline') {
    labelBase = `${commonLabel}
  border-bottom: ${opts.borderWidth}px solid transparent;`
    labelActive = `  color: ${opts.activeColor};
  border-bottom-color: ${opts.activeBorderColor};
  background: ${opts.activeBgColor};`
    labelHover = `  color: ${opts.activeColor};
  background: ${opts.hoverBgColor};`
    containerExtra = isHorizontal
      ? `  border-bottom: ${opts.borderWidth}px solid ${opts.borderColor};`
      : `  border-right: ${opts.borderWidth}px solid ${opts.borderColor};`
    labelContainer = isHorizontal
      ? `  display: flex;
  flex-wrap: wrap;
  gap: ${opts.gap}px;`
      : `  display: flex;
  flex-direction: column;
  gap: ${opts.gap}px;`
    panelBase = isHorizontal
      ? `  padding: ${opts.contentPadding}px 0;
  background: ${opts.contentBg};`
      : `  padding: 0 ${opts.contentPadding}px;
  background: ${opts.contentBg};`
  } else if (isPills) {
    labelBase = `${commonLabel}`
    labelActive = `  color: ${opts.activeColor};
  background: ${opts.activeBgColor};
  font-weight: 600;`
    labelHover = `  background: ${opts.hoverBgColor};
  color: ${opts.activeColor};`
    labelContainer = isHorizontal
      ? `  display: flex;
  flex-wrap: wrap;
  gap: ${opts.gap}px;`
      : `  display: flex;
  flex-direction: column;
  gap: ${opts.gap}px;`
    panelBase = `  padding: ${opts.contentPadding}px 0;
  background: ${opts.contentBg};`
  } else if (isCards) {
    labelBase = `${commonLabel}
  border: 1px solid ${opts.borderColor};
  border-bottom: none;
  margin-bottom: -${opts.borderWidth}px;`
    labelActive = `  color: ${opts.activeColor};
  background: ${opts.contentBg};
  border-color: ${opts.activeBorderColor};
  border-bottom: 1px solid ${opts.contentBg};
  z-index: 1;
  position: relative;`
    labelHover = `  color: ${opts.activeColor};
  background: ${opts.hoverBgColor};`
    containerExtra = isHorizontal
      ? `  border-bottom: ${opts.borderWidth}px solid ${opts.borderColor};`
      : `  border-right: ${opts.borderWidth}px solid ${opts.borderColor};`
    labelContainer = isHorizontal
      ? `  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding-left: ${opts.gap}px;`
      : `  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: ${opts.gap}px;`
    panelBase = isHorizontal
      ? `  padding: ${opts.contentPadding}px;
  background: ${opts.contentBg};
  border: 1px solid ${opts.borderColor};
  border-top: none;
  border-radius: 0 0 ${opts.borderRadius}px ${opts.borderRadius}px;`
      : `  padding: ${opts.contentPadding}px;
  background: ${opts.contentBg};
  border: 1px solid ${opts.borderColor};
  border-left: none;
  border-radius: 0 ${opts.borderRadius}px ${opts.borderRadius}px 0;`
  } else if (isBorder) {
    labelBase = `${commonLabel}
  border: 1px solid ${opts.borderColor};
  border-radius: ${opts.borderRadius}px;`
    labelActive = `  color: ${opts.activeColor};
  border-color: ${opts.activeBorderColor};
  background: ${opts.activeBgColor};
  font-weight: 600;`
    labelHover = `  color: ${opts.activeColor};
  border-color: ${opts.activeBorderColor};
  background: ${opts.hoverBgColor};`
    labelContainer = isHorizontal
      ? `  display: flex;
  flex-wrap: wrap;
  gap: ${opts.gap}px;`
      : `  display: flex;
  flex-direction: column;
  gap: ${opts.gap}px;`
    panelBase = isHorizontal
      ? `  margin-top: ${opts.gap}px;
  padding: ${opts.contentPadding}px;
  background: ${opts.contentBg};
  border: 1px solid ${opts.borderColor};
  border-radius: ${opts.borderRadius}px;`
      : `  margin-left: ${opts.gap}px;
  padding: ${opts.contentPadding}px;
  background: ${opts.contentBg};
  border: 1px solid ${opts.borderColor};
  border-radius: ${opts.borderRadius}px;`
  }

  const flexDirection = isHorizontal ? 'column' : 'row'
  const tabWrapper = isHorizontal
    ? `  display: flex;
  flex-direction: column;`
    : `  display: flex;
  flex-direction: row;`

  return `.${cn} {
${tabWrapper}
${containerExtra}}

.${cn} input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
  margin: 0;
}

.${cn} .tab-labels {
${labelContainer}}

.${cn} .tab-labels label {
${labelBase}}

.${cn} .tab-labels label:hover {
${labelHover}}
${buildCheckedRules(cn, opts)}

.${cn} .tab-panels {
  flex: 1;
}

.${cn} .tab-panel {
${panelBase}
  display: none;
}

.${cn} .tab-panel:focus-visible {
  outline: 2px solid ${opts.activeBorderColor};
  outline-offset: 2px;
}`
}

function buildCheckedRules(cn, opts) {
  const count = 6
  const lines = []
  for (let i = 1; i <= count; i++) {
    lines.push(`.${cn} input:nth-of-type(${i}):checked ~ .tab-labels label:nth-of-type(${i}) {
${getActiveStyles(opts)}
}`)
    lines.push(`.${cn} input:nth-of-type(${i}):checked ~ .tab-panels .tab-panel:nth-of-type(${i}) {
  display: block;
}`)
  }
  return lines.join('\n\n')
}

function getActiveStyles(opts) {
  const isPills = opts.variant === 'pills'
  const isCards = opts.variant === 'cards'
  const isBorder = opts.variant === 'border'
  const isUnderline = opts.variant === 'underline'

  const activeColor = `  color: ${opts.activeColor};`
  const activeBg = `  background: ${opts.activeBgColor};`
  const fontWeight = `  font-weight: 600;`

  if (isUnderline) {
    return `${activeColor}
  border-bottom-color: ${opts.activeBorderColor};
${activeBg}`
  }
  if (isPills) {
    return `${activeColor}
${activeBg}
${fontWeight}`
  }
  if (isCards) {
    return `${activeColor}
  background: ${opts.contentBg};
  border-color: ${opts.activeBorderColor};
  border-bottom: 1px solid ${opts.contentBg};
  z-index: 1;
  position: relative;`
  }
  if (isBorder) {
    return `${activeColor}
  border-color: ${opts.activeBorderColor};
${activeBg}
${fontWeight}`
  }
  return activeColor
}

export function buildTabsHtml(items = [], options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const safeItems = items.length > 0 ? items : ['Tab 1', 'Tab 2', 'Tab 3']
  const group = `${cn}-group`

  const inputs = safeItems
    .map((_, i) => {
      const checked = i === 0 ? ' checked' : ''
      return `  <input type="radio" name="${group}" id="${group}-${i}"${checked}>`
    })
    .join('\n')

  const labels = safeItems
    .map((label, i) => {
      const escaped = escapeHtml(label)
      return `  <label for="${group}-${i}">${escaped}</label>`
    })
    .join('\n')

  const panels = safeItems
    .map((label, i) => {
      const escaped = escapeHtml(label)
      return `  <div class="tab-panel" role="tabpanel" aria-labelledby="${group}-${i}" tabindex="0">${escaped} content</div>`
    })
    .join('\n')

  return `<div class="${cn}">
${inputs}
  <div class="tab-labels" role="tablist">
${labels}
  </div>
  <div class="tab-panels">
${panels}
  </div>
</div>`
}

export function buildTabsFullDemo(options = {}, items = []) {
  const css = buildTabsCss(options)
  const html = buildTabsHtml(items, options)
  return `<!-- HTML -->
${html}

/* CSS */
${css}`
}

export const TABS_PRESETS = [
  {
    key: 'default',
    name: { pt: 'Padrão', en: 'Default' },
    opts: { variant: 'underline' },
  },
  {
    key: 'pills',
    name: { pt: 'Pills', en: 'Pills' },
    opts: {
      variant: 'pills',
      borderRadius: 999,
      activeBgColor: '#1677ff',
      activeColor: '#ffffff',
      hoverBgColor: '#f0f5ff',
      paddingX: 18,
      paddingY: 8,
    },
  },
  {
    key: 'cards',
    name: { pt: 'Cards', en: 'Cards' },
    opts: {
      variant: 'cards',
      borderColor: '#d9d9d9',
      activeBorderColor: '#1677ff',
      activeBgColor: '#ffffff',
      contentBg: '#ffffff',
      borderRadius: 8,
      gap: 4,
    },
  },
  {
    key: 'border',
    name: { pt: 'Borda', en: 'Border' },
    opts: {
      variant: 'border',
      borderColor: '#d9d9d9',
      activeBorderColor: '#1677ff',
      activeBgColor: '#f0f5ff',
      borderRadius: 6,
      paddingX: 20,
      paddingY: 10,
    },
  },
]
