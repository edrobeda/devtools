// Gerador de pricing table CSS puro.
//
// Monta uma grade de planos/preços usando só CSS: container responsivo,
// cards de plano, header, preço, lista de features, botão CTA e badge
// "Mais popular" no plano destacado.

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
  columns: 3,
  maxWidth: 1200,
  gap: 24,
  padding: 32,
  borderRadius: 16,
  bgColor: '#ffffff',
  textColor: '#262626',
  borderColor: '#e5e5ea',
  borderWidth: 1,
  shadow: '0 4px 20px rgba(0,0,0,0.06)',
  headerBg: '#ffffff',
  headerTextColor: '#262626',
  priceColor: '#1677ff',
  periodColor: '#8c8c8c',
  featureColor: '#595959',
  featureIconColor: '#52c41a',
  featureDisabledIconColor: '#bfbfbf',
  buttonBg: '#1677ff',
  buttonColor: '#ffffff',
  buttonRadius: 8,
  highlightedBg: '#ffffff',
  highlightedBorderColor: '#1677ff',
  highlightedShadow: '0 12px 40px rgba(22,119,255,0.25)',
  highlightedScale: 1.04,
  badgeBg: '#1677ff',
  badgeColor: '#ffffff',
  badgeText: 'Mais popular',
  badgeTextEn: 'Most popular',
  align: 'center',
  showFeatures: true,
  showButton: true,
  showDescription: true,
  featureIcon: 'check',
  plans: [
    {
      name: 'Starter',
      price: 'R$ 29',
      period: '/mês',
      description: 'Para iniciantes e projetos pequenos.',
      highlighted: false,
      features: ['1 usuário', '10 GB de armazenamento', 'Suporte por email', 'Relatórios básicos'],
    },
    {
      name: 'Pro',
      price: 'R$ 79',
      period: '/mês',
      description: 'Para equipes que precisam de mais poder.',
      highlighted: true,
      features: ['5 usuários', '100 GB de armazenamento', 'Suporte prioritário', 'Relatórios avançados', 'API access'],
    },
    {
      name: 'Enterprise',
      price: 'R$ 199',
      period: '/mês',
      description: 'Para organizações com necessidades escaláveis.',
      highlighted: false,
      features: ['Usuários ilimitados', 'Armazenamento ilimitado', 'Suporte 24/7', 'SSO e audit logs', 'SLA garantido'],
    },
  ],
  buttonText: 'Escolher plano',
  buttonTextEn: 'Choose plan',
}

const PRESETS = {
  clean: {
    variant: 'clean',
    bgColor: '#ffffff',
    textColor: '#262626',
    borderColor: '#e5e5ea',
    borderWidth: 1,
    shadow: '0 4px 20px rgba(0,0,0,0.06)',
    headerBg: '#ffffff',
    headerTextColor: '#262626',
    priceColor: '#1677ff',
    periodColor: '#8c8c8c',
    featureColor: '#595959',
    featureIconColor: '#52c41a',
    featureDisabledIconColor: '#bfbfbf',
    buttonBg: '#1677ff',
    buttonColor: '#ffffff',
    highlightedBg: '#ffffff',
    highlightedBorderColor: '#1677ff',
    highlightedShadow: '0 12px 40px rgba(22,119,255,0.25)',
    highlightedScale: 1.04,
    badgeBg: '#1677ff',
    badgeColor: '#ffffff',
  },
  outline: {
    variant: 'outline',
    bgColor: '#ffffff',
    textColor: '#262626',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    shadow: 'none',
    headerBg: '#ffffff',
    headerTextColor: '#262626',
    priceColor: '#262626',
    periodColor: '#8c8c8c',
    featureColor: '#595959',
    featureIconColor: '#1677ff',
    featureDisabledIconColor: '#bfbfbf',
    buttonBg: 'transparent',
    buttonColor: '#1677ff',
    highlightedBg: '#f0f5ff',
    highlightedBorderColor: '#1677ff',
    highlightedShadow: 'none',
    highlightedScale: 1.02,
    badgeBg: '#1677ff',
    badgeColor: '#ffffff',
  },
  gradient: {
    variant: 'gradient',
    bgColor: '#ffffff',
    textColor: '#262626',
    borderColor: '#e5e5ea',
    borderWidth: 0,
    shadow: '0 8px 30px rgba(0,0,0,0.08)',
    headerBg: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
    headerTextColor: '#ffffff',
    priceColor: '#1677ff',
    periodColor: '#8c8c8c',
    featureColor: '#595959',
    featureIconColor: '#52c41a',
    featureDisabledIconColor: '#bfbfbf',
    buttonBg: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
    buttonColor: '#ffffff',
    highlightedBg: '#ffffff',
    highlightedBorderColor: '#722ed1',
    highlightedShadow: '0 16px 48px rgba(114,46,209,0.25)',
    highlightedScale: 1.04,
    badgeBg: '#722ed1',
    badgeColor: '#ffffff',
  },
  dark: {
    variant: 'dark',
    bgColor: '#1f1f1f',
    textColor: '#f5f5f7',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    shadow: '0 8px 24px rgba(0,0,0,0.35)',
    headerBg: '#1f1f1f',
    headerTextColor: '#f5f5f7',
    priceColor: '#69b1ff',
    periodColor: '#a6a6a6',
    featureColor: '#d9d9d9',
    featureIconColor: '#95de64',
    featureDisabledIconColor: '#595959',
    buttonBg: '#69b1ff',
    buttonColor: '#1f1f1f',
    highlightedBg: '#2c2c2c',
    highlightedBorderColor: '#69b1ff',
    highlightedShadow: '0 16px 40px rgba(0,0,0,0.55)',
    highlightedScale: 1.04,
    badgeBg: '#69b1ff',
    badgeColor: '#1f1f1f',
  },
  colorful: {
    variant: 'colorful',
    bgColor: '#fff7e6',
    textColor: '#262626',
    borderColor: '#ffd591',
    borderWidth: 0,
    shadow: '0 4px 20px rgba(250,140,22,0.12)',
    headerBg: '#fff7e6',
    headerTextColor: '#d46b08',
    priceColor: '#d46b08',
    periodColor: '#8c8c8c',
    featureColor: '#595959',
    featureIconColor: '#fa8c16',
    featureDisabledIconColor: '#bfbfbf',
    buttonBg: '#fa8c16',
    buttonColor: '#ffffff',
    highlightedBg: '#fff1b8',
    highlightedBorderColor: '#fa8c16',
    highlightedShadow: '0 12px 40px rgba(250,140,22,0.25)',
    highlightedScale: 1.04,
    badgeBg: '#fa8c16',
    badgeColor: '#ffffff',
  },
}

export { PRESETS, DEFAULTS }

export function buildPricingTableCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const variant = opts.variant || 'clean'
  const columns = clamp(Number(opts.columns) || 3, 1, 4)
  const maxWidth = clamp(Number(opts.maxWidth) || 1200, 320, 1600)
  const gap = clamp(Number(opts.gap) || 24, 0, 80)
  const padding = clamp(Number(opts.padding) || 32, 8, 80)
  const borderRadius = clamp(Number(opts.borderRadius) || 16, 0, 64)
  const bg = parseColor(opts.bgColor)
  const text = parseColor(opts.textColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || 0, 0, 8)
  const shadow = opts.shadow || 'none'
  const headerBg = opts.headerBg || bg
  const headerText = parseColor(opts.headerTextColor)
  const price = parseColor(opts.priceColor)
  const period = parseColor(opts.periodColor)
  const feature = parseColor(opts.featureColor)
  const featureIcon = parseColor(opts.featureIconColor)
  const featureDisabledIcon = parseColor(opts.featureDisabledIconColor)
  const buttonBg = parseColor(opts.buttonBg)
  const buttonColor = parseColor(opts.buttonColor)
  const buttonRadius = clamp(Number(opts.buttonRadius) || 8, 0, 32)
  const highlightedBg = parseColor(opts.highlightedBg)
  const highlightedBorder = parseColor(opts.highlightedBorderColor)
  const highlightedShadow = opts.highlightedShadow || shadow
  const highlightedScale = clamp(Number(opts.highlightedScale) || 1.04, 1, 1.15)
  const badgeBg = parseColor(opts.badgeBg)
  const badgeColor = parseColor(opts.badgeColor)
  const align = ['left', 'center', 'right'].includes(opts.align) ? opts.align : 'center'
  const showFeatures = Boolean(opts.showFeatures)
  const showButton = Boolean(opts.showButton)
  const showDescription = Boolean(opts.showDescription)
  const featureIconStyle = ['check', 'dot', 'none'].includes(opts.featureIcon) ? opts.featureIcon : 'check'

  const isGradientHeader = String(headerBg).includes('gradient')
  const isGradientButton = String(buttonBg).includes('gradient')
  const isOutlineButton = variant === 'outline'

  const checkSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.13l-3-3a.75.75 0 0 1 1.06-1.06l2.378 2.377 4.462-6.692a.75.75 0 0 1 1.046-.208Z'/%3E%3C/svg%3E"

  const crossSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z'/%3E%3C/svg%3E"

  const dotSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='4' fill='currentColor'/%3E%3C/svg%3E"

  const lines = [
    '/* Pricing table container */',
    '.pricing {',
    `  --pricing-bg: ${bg};`,
    `  --pricing-text: ${text};`,
    `  --pricing-border: ${border};`,
    `  --pricing-price: ${price};`,
    `  --pricing-period: ${period};`,
    `  --pricing-feature: ${feature};`,
    `  --pricing-feature-icon: ${featureIcon};`,
    `  --pricing-feature-disabled-icon: ${featureDisabledIcon};`,
    `  --pricing-button-bg: ${buttonBg};`,
    `  --pricing-button-color: ${buttonColor};`,
    `  --pricing-highlighted-bg: ${highlightedBg};`,
    `  --pricing-highlighted-border: ${highlightedBorder};`,
    `  --pricing-badge-bg: ${badgeBg};`,
    `  --pricing-badge-color: ${badgeColor};`,
    '',
    '  display: grid;',
    `  grid-template-columns: repeat(${columns}, minmax(0, 1fr));`,
    `  gap: ${toPx(gap)};`,
    `  max-width: ${toPx(maxWidth)};`,
    '  margin: 0 auto;',
    '  align-items: start;',
    '  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '}',
    '',
    '/* Responsive: empilha em telas estreitas */',
    '@media (max-width: 768px) {',
    '  .pricing {',
    '    grid-template-columns: 1fr;',
    '  }',
    '}',
    '',
    '/* Card de plano */',
    '.pricing__plan {',
    `  position: relative;`,
    `  display: flex;`,
    `  flex-direction: column;`,
    `  background: var(--pricing-bg);`,
    `  color: var(--pricing-text);`,
    `  border-radius: ${toPx(borderRadius)};`,
    borderWidth > 0 ? `  border: ${toPx(borderWidth)} solid var(--pricing-border);` : '  border: none;',
    `  box-shadow: ${shadow};`,
    `  overflow: hidden;`,
    `  text-align: ${align};`,
    `  transition: transform 250ms ease, box-shadow 250ms ease;`,
    '}',
    '',
    '/* Plano destacado */',
    '.pricing__plan--highlight {',
    `  background: var(--pricing-highlighted-bg);`,
    borderWidth > 0 ? `  border-color: var(--pricing-highlighted-border);` : `  border: 2px solid var(--pricing-highlighted-border);`,
    `  box-shadow: ${highlightedShadow};`,
    `  transform: scale(${highlightedScale.toFixed(3)});`,
    `  z-index: 1;`,
    '}',
    '',
    '.pricing__plan--highlight:hover {',
    `  transform: scale(${(highlightedScale + 0.02).toFixed(3)});`,
    '}',
    '',
    '/* Badge "Mais popular" */',
    '.pricing__badge {',
    `  position: absolute;`,
    `  top: 12px;`,
    `  right: 12px;`,
    `  background: var(--pricing-badge-bg);`,
    `  color: var(--pricing-badge-color);`,
    `  font-size: 0.75rem;`,
    `  font-weight: 600;`,
    `  padding: 4px 10px;`,
    `  border-radius: 9999px;`,
    `  line-height: 1;`,
    `  z-index: 2;`,
    '}',
    '',
    '/* Header do plano */',
    '.pricing__header {',
    `  padding: ${toPx(padding)} ${toPx(padding)} ${toPx(Math.max(8, Math.round(padding * 0.5)))};`,
    isGradientHeader ? `  background: ${headerBg};` : `  background: ${parseColor(headerBg)};`,
    `  color: ${headerText};`,
    '}',
    '',
    '.pricing__name {',
    `  margin: 0 0 8px;`,
    `  font-size: 1.125rem;`,
    `  font-weight: 600;`,
    '}',
    '',
    '.pricing__description {',
    `  margin: 0;`,
    `  font-size: 0.875rem;`,
    `  line-height: 1.5;`,
    `  opacity: 0.8;`,
    '}',
    '',
    '/* Preço */',
    '.pricing__price {',
    `  padding: 0 ${toPx(padding)} ${toPx(Math.max(8, Math.round(padding * 0.5)))};`,
    `  background: ${isGradientHeader ? 'transparent' : parseColor(headerBg)};`,
    `  color: ${headerText};`,
    '}',
    '',
    '.pricing__amount {',
    `  display: inline-flex;`,
    `  align-items: baseline;`,
    `  gap: 4px;`,
    `  color: ${isGradientHeader ? 'inherit' : 'var(--pricing-price)'};`,
    `  font-size: 2.5rem;`,
    `  font-weight: 700;`,
    `  line-height: 1;`,
    '}',
    '',
    '.pricing__period {',
    `  font-size: 1rem;`,
    `  font-weight: 400;`,
    `  color: ${isGradientHeader ? 'rgba(255,255,255,0.85)' : 'var(--pricing-period)'};`,
    '}',
    '',
    '/* Corpo / features */',
    '.pricing__body {',
    `  padding: ${toPx(Math.max(8, Math.round(padding * 0.75)))} ${toPx(padding)};`,
    `  flex: 1 1 auto;`,
    '}',
    '',
    '.pricing__features {',
    `  list-style: none;`,
    `  margin: 0;`,
    `  padding: 0;`,
    `  display: flex;`,
    `  flex-direction: column;`,
    `  gap: 12px;`,
    '}',
    '',
    '.pricing__feature {',
    `  display: flex;`,
    `  align-items: center;`,
    `  gap: 10px;`,
    `  color: var(--pricing-feature);`,
    `  font-size: 0.9375rem;`,
    `  line-height: 1.4;`,
    align === 'center' ? '  justify-content: center;' : align === 'right' ? '  justify-content: flex-end;' : '  justify-content: flex-start;',
    '}',
    '',
    '.pricing__feature--disabled {',
    `  opacity: 0.55;`,
    `  text-decoration: line-through;`,
    '}',
    '',
    '.pricing__feature::before {',
    `  content: "";`,
    `  flex: 0 0 auto;`,
    `  width: 18px;`,
    `  height: 18px;`,
    `  background-color: var(--pricing-feature-icon);`,
    `  -webkit-mask-image: url('${featureIconStyle === 'dot' ? dotSvg : checkSvg}');`,
    `  mask-image: url('${featureIconStyle === 'dot' ? dotSvg : checkSvg}');`,
    `  -webkit-mask-size: contain;`,
    `  mask-size: contain;`,
    `  -webkit-mask-repeat: no-repeat;`,
    `  mask-repeat: no-repeat;`,
    `  -webkit-mask-position: center;`,
    `  mask-position: center;`,
    '}',
    '',
    '.pricing__feature--disabled::before {',
    `  background-color: var(--pricing-feature-disabled-icon);`,
    `  -webkit-mask-image: url('${crossSvg}');`,
    `  mask-image: url('${crossSvg}');`,
    '}',
    '',
    '/* Footer / botão */',
    '.pricing__footer {',
    `  padding: ${toPx(Math.max(8, Math.round(padding * 0.75)))} ${toPx(padding)} ${toPx(padding)};`,
    '}',
    '',
    '.pricing__button {',
    `  display: inline-flex;`,
    `  align-items: center;`,
    `  justify-content: center;`,
    `  width: 100%;`,
    `  padding: 12px 20px;`,
    `  border-radius: ${toPx(buttonRadius)};`,
    `  background: var(--pricing-button-bg);`,
    `  color: var(--pricing-button-color);`,
    `  font-size: 1rem;`,
    `  font-weight: 600;`,
    `  text-decoration: none;`,
    `  cursor: pointer;`,
    `  border: none;`,
    `  transition: filter 200ms ease, transform 150ms ease;`,
    isOutlineButton ? `  box-shadow: inset 0 0 0 2px var(--pricing-button-bg);` : null,
    '}',
    '',
    '.pricing__button:hover {',
    `  filter: brightness(1.1);`,
    '}',
    '',
    '.pricing__button:active {',
    `  transform: scale(0.98);`,
    '}',
  ]

  if (!showDescription) {
    lines.push(
      '',
      '.pricing__description {',
      '  display: none;',
      '}'
    )
  }

  if (!showFeatures) {
    lines.push(
      '',
      '.pricing__body {',
      '  display: none;',
      '}'
    )
  }

  if (!showButton) {
    lines.push(
      '',
      '.pricing__footer {',
      '  display: none;',
      '}'
    )
  }

  if (featureIconStyle === 'none') {
    lines.push(
      '',
      '.pricing__feature::before {',
      '  display: none;',
      '}'
    )
  }

  return lines.filter((line) => line !== null).join('\n')
}

export function buildPricingTableHtml(options = {}, lang = 'pt') {
  const opts = { ...DEFAULTS, ...options }
  const showFeatures = Boolean(opts.showFeatures)
  const showButton = Boolean(opts.showButton)
  const showDescription = Boolean(opts.showDescription)
  const buttonText = String(lang === 'en' ? opts.buttonTextEn || DEFAULTS.buttonTextEn : opts.buttonText || DEFAULTS.buttonText)
  const badgeText = String(lang === 'en' ? opts.badgeTextEn || DEFAULTS.badgeTextEn : opts.badgeText || DEFAULTS.badgeText)
  const plans = Array.isArray(opts.plans) && opts.plans.length ? opts.plans : DEFAULTS.plans

  const renderFeature = (feature) => {
    const raw = String(feature)
    const disabled = raw.startsWith('-') || raw.startsWith('×') || raw.toLowerCase().startsWith('x ')
    const text = disabled ? raw.replace(/^[-×x]\s?/, '') : raw
    const cls = disabled ? 'pricing__feature pricing__feature--disabled' : 'pricing__feature'
    return `        <li class="${cls}">${escapeHtml(text)}</li>`
  }

  const renderPlan = (plan, index) => {
    const name = escapeHtml(plan.name || `Plano ${index + 1}`)
    const price = escapeHtml(plan.price || 'R$ 0')
    const period = escapeHtml(plan.period || '/mês')
    const description = escapeHtml(plan.description || '')
    const highlighted = Boolean(plan.highlighted)
    const features = Array.isArray(plan.features) ? plan.features : []
    const cls = highlighted ? 'pricing__plan pricing__plan--highlight' : 'pricing__plan'

    return [
      `    <article class="${cls}">`,
      highlighted ? `      <span class="pricing__badge">${escapeHtml(badgeText)}</span>` : '',
      `      <div class="pricing__header">`,
      `        <h3 class="pricing__name">${name}</h3>`,
      showDescription ? `        <p class="pricing__description">${description}</p>` : '',
      `      </div>`,
      `      <div class="pricing__price">`,
      `        <span class="pricing__amount">${price}<span class="pricing__period">${period}</span></span>`,
      `      </div>`,
      showFeatures
        ? [
            `      <div class="pricing__body">`,
            `        <ul class="pricing__features">`,
            ...features.map(renderFeature),
            `        </ul>`,
            `      </div>`,
          ].join('\n')
        : '',
      showButton
        ? [
            `      <div class="pricing__footer">`,
            `        <button class="pricing__button" type="button">${escapeHtml(buttonText)}</button>`,
            `      </div>`,
          ].join('\n')
        : '',
      `    </article>`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  return [
    '<section class="pricing" aria-label="Pricing">',
    ...plans.map(renderPlan),
    '</section>',
  ].join('\n')
}

export function buildPricingTableFullDemo(options = {}, lang = 'pt') {
  return `${buildPricingTableCss(options)}\n\n${buildPricingTableHtml(options, lang)}`
}
