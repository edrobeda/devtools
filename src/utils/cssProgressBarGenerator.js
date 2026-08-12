const DEFAULTS = {
  className: 'progress',
  type: 'linear',
  direction: 'horizontal',
  width: 320,
  height: 16,
  thickness: 12,
  size: 120,
  value: 65,
  max: 100,
  showLabel: true,
  labelInside: false,
  rounded: true,
  roundedCap: true,
  trackColor: '#f0f0f0',
  fillColor: '#1677ff',
  borderColor: '#d9d9d9',
  borderWidth: 0,
  textColor: '#595959',
  animation: false,
  animationDuration: 1000,
}

export function buildProgressBarCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const percent = Math.max(0, Math.min(100, (opts.value / Math.max(opts.max, 1)) * 100))
  const radius = opts.rounded ? `${opts.height / 2}px` : '0'

  if (opts.type === 'linear') {
    const isVertical = opts.direction === 'vertical'
    const sizeProp = isVertical ? 'height' : 'width'
    const crossProp = isVertical ? 'width' : 'height'
    const mainSize = isVertical ? opts.height : opts.width
    const crossSize = isVertical ? opts.width : opts.height

    let css = `.${cn} {
  ${sizeProp}: ${mainSize}px;
  ${crossProp}: ${crossSize}px;
  background: ${opts.trackColor};
  border: ${opts.borderWidth}px solid ${opts.borderColor};
  border-radius: ${radius};
  overflow: hidden;
  position: relative;
}

.${cn} .progress-fill {
  ${isVertical ? 'width' : 'height'}: 100%;
  ${isVertical ? 'height' : 'width'}: ${percent.toFixed(2)}%;
  ${isVertical ? 'position: absolute;\n  bottom: 0;\n  left: 0;' : ''}
  background: ${opts.fillColor};
  border-radius: ${opts.rounded ? 'inherit' : '0'};
  transition: ${isVertical ? 'height' : 'width'} ${opts.animationDuration}ms ease;
}

.${cn} .progress-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${opts.textColor};
  font-size: ${Math.max(10, Math.round(crossSize * 0.5))}px;
  font-weight: 600;
  pointer-events: none;
}`

    if (opts.animation) {
      css += `

.${cn} .progress-fill.animated {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
  animation: ${cn}-stripes 1s linear infinite;
}

@keyframes ${cn}-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}`
    }
    return css
  }

  // circular
  const stroke = opts.thickness
  const center = opts.size / 2
  const radiusCircle = center - stroke / 2
  const circumference = 2 * Math.PI * radiusCircle
  const dashOffset = circumference * (1 - percent / 100)

  let css = `.${cn} {
  --value: ${percent.toFixed(2)};
  width: ${opts.size}px;
  height: ${opts.size}px;
  border-radius: 50%;
  background: conic-gradient(${opts.fillColor} calc(var(--value) * 1%), ${opts.trackColor} 0);
  display: grid;
  place-items: center;
  position: relative;
}

.${cn}::before {
  content: '';
  position: absolute;
  inset: ${stroke}px;
  border-radius: 50%;
  background: #ffffff;
}

.${cn} .progress-label {
  position: relative;
  color: ${opts.textColor};
  font-size: ${Math.max(12, Math.round(opts.size * 0.18))}px;
  font-weight: 600;
}`

  if (opts.roundedCap) {
    css = css.replace(
      `background: conic-gradient(${opts.fillColor} calc(var(--value) * 1%), ${opts.trackColor} 0);`,
      `background: radial-gradient(circle, #ffffff calc(50% - ${stroke}px), transparent calc(50% - ${stroke}px + 1px)), conic-gradient(${opts.fillColor} calc(var(--value) * 1%), ${opts.trackColor} 0);`
    )
  }

  if (opts.animation) {
    css += `

.${cn}.animated {
  animation: ${cn}-spin ${opts.animationDuration}ms linear infinite;
}

.${cn}.animated .progress-label {
  animation: ${cn}-spin-reverse ${opts.animationDuration}ms linear infinite;
}

@keyframes ${cn}-spin {
  to { transform: rotate(360deg); }
}

@keyframes ${cn}-spin-reverse {
  to { transform: rotate(-360deg); }
}`
  }
  return css
}

export function buildProgressBarHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className
  const percent = Math.round(Math.max(0, Math.min(100, (opts.value / Math.max(opts.max, 1)) * 100)))
  const animClass = opts.animation ? ' animated' : ''
  const label = `${percent}%`

  if (opts.type === 'linear') {
    return `<div class="${cn}">
  <div class="progress-fill${animClass}" style="${opts.direction === 'vertical' ? 'height' : 'width'}: ${percent}%" aria-valuenow="${opts.value}" aria-valuemin="0" aria-valuemax="${opts.max}" role="progressbar"></div>
  ${opts.showLabel ? `<span class="progress-label">${label}</span>` : ''}
</div>`
  }

  return `<div class="${cn}${animClass}" role="progressbar" aria-valuenow="${opts.value}" aria-valuemin="0" aria-valuemax="${opts.max}">
  ${opts.showLabel ? `<span class="progress-label">${label}</span>` : ''}
</div>`
}

export function buildProgressBarFullDemo(options = {}) {
  const css = buildProgressBarCss(options)
  const html = buildProgressBarHtml(options)
  return `<!-- HTML -->
${html}

/* CSS */
${css}`
}

export const PROGRESS_PRESETS = [
  {
    key: 'linear',
    name: { pt: 'Linear padrão', en: 'Default linear' },
    opts: { type: 'linear', direction: 'horizontal', fillColor: '#1677ff' },
  },
  {
    key: 'success',
    name: { pt: 'Sucesso', en: 'Success' },
    opts: { type: 'linear', fillColor: '#52c41a', trackColor: '#f6ffed', value: 80 },
  },
  {
    key: 'warning',
    name: { pt: 'Aviso', en: 'Warning' },
    opts: { type: 'linear', fillColor: '#faad14', trackColor: '#fffbe6', value: 45, animation: true },
  },
  {
    key: 'vertical',
    name: { pt: 'Vertical', en: 'Vertical' },
    opts: { type: 'linear', direction: 'vertical', width: 32, height: 180, fillColor: '#722ed1' },
  },
  {
    key: 'circular',
    name: { pt: 'Circular', en: 'Circular' },
    opts: { type: 'circular', fillColor: '#1677ff', value: 65 },
  },
  {
    key: 'donut',
    name: { pt: 'Donut', en: 'Donut' },
    opts: { type: 'circular', fillColor: '#eb2f96', trackColor: '#fff0f6', thickness: 18, value: 75, roundedCap: true },
  },
]
