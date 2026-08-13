// Gerador de formulário de login CSS puro.
//
// Produz um formulário de login/registro estilizado usando só CSS,
// com estados de foco, erro e sucesso, ícones inline e variações de layout.

function parseColor(color) {
  if (!color) return '#000000'
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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const DEFAULTS = {
  variant: 'card',
  maxWidth: 420,
  padding: 32,
  gap: 20,
  borderRadius: 12,
  borderWidth: 1,
  bgColor: '#ffffff',
  textColor: '#262626',
  borderColor: '#d9d9d9',
  inputBg: '#ffffff',
  inputBorderColor: '#d9d9d9',
  inputFocusColor: '#1677ff',
  primaryColor: '#1677ff',
  primaryTextColor: '#ffffff',
  linkColor: '#1677ff',
  errorColor: '#ff4d4f',
  successColor: '#52c41a',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  fontSize: 16,
  titleSize: 24,
  showRemember: true,
  showForgot: true,
  showSignup: true,
  showIcons: true,
  showErrorState: true,
  showSuccessState: true,
  title: 'Bem-vindo de volta',
  subtitle: 'Entre com sua conta para continuar',
  submitText: 'Entrar',
  rememberText: 'Lembrar-me',
  forgotText: 'Esqueceu a senha?',
  signupText: 'Não tem uma conta? Cadastre-se',
  emailPlaceholder: 'seu@email.com',
  passwordPlaceholder: '••••••••',
  className: 'login-form',
}

const PRESETS = {
  default: { ...DEFAULTS },
  minimal: {
    ...DEFAULTS,
    variant: 'minimal',
    padding: 0,
    borderRadius: 0,
    borderWidth: 0,
    bgColor: 'transparent',
    shadow: 'none',
    title: 'Login',
    subtitle: '',
  },
  dark: {
    ...DEFAULTS,
    bgColor: '#141414',
    textColor: '#ffffff',
    borderColor: '#434343',
    inputBg: '#1f1f1f',
    inputBorderColor: '#434343',
    inputFocusColor: '#177ddc',
    primaryColor: '#177ddc',
    linkColor: '#177ddc',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
  },
  outline: {
    ...DEFAULTS,
    bgColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1677ff',
    shadow: 'none',
    primaryColor: 'transparent',
    primaryTextColor: '#1677ff',
  },
  soft: {
    ...DEFAULTS,
    bgColor: '#f0f5ff',
    inputBg: '#ffffff',
    primaryColor: '#0958d9',
    linkColor: '#0958d9',
    borderColor: '#d6e4ff',
    inputBorderColor: '#d6e4ff',
    shadow: 'none',
  },
}

export { DEFAULTS, PRESETS }

export function buildLoginFormCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = escapeHtml(opts.className || 'login-form')
  const variant = opts.variant || 'card'
  const maxWidth = clamp(Number(opts.maxWidth) || 420, 280, 800)
  const padding = clamp(Number(opts.padding) || 32, 0, 80)
  const gap = clamp(Number(opts.gap) || 20, 8, 64)
  const borderRadius = clamp(Number(opts.borderRadius) || 12, 0, 64)
  const borderWidth = clamp(Number(opts.borderWidth) || 1, 0, 8)
  const fontSize = clamp(Number(opts.fontSize) || 16, 12, 32)
  const titleSize = clamp(Number(opts.titleSize) || 24, 16, 64)

  const bgColor = parseColor(opts.bgColor)
  const textColor = parseColor(opts.textColor)
  const borderColor = parseColor(opts.borderColor)
  const inputBg = parseColor(opts.inputBg)
  const inputBorderColor = parseColor(opts.inputBorderColor)
  const inputFocusColor = parseColor(opts.inputFocusColor)
  const primaryColor = parseColor(opts.primaryColor)
  const primaryTextColor = parseColor(opts.primaryTextColor)
  const linkColor = parseColor(opts.linkColor)
  const errorColor = parseColor(opts.errorColor)
  const successColor = parseColor(opts.successColor)

  const lines = [
    `.${cn} {`,
    '  box-sizing: border-box;',
    `  width: 100%;`,
    `  max-width: ${toPx(maxWidth)};`,
    `  margin: 0 auto;`,
    `  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`,
    `  font-size: ${toPx(fontSize)};`,
    `  color: ${textColor};`,
    '  line-height: 1.5;',
    '}', '',
  ]

  if (variant === 'card') {
    lines.push(
      `.${cn}__box {`,
      `  background: ${bgColor};`,
      `  border: ${toPx(borderWidth)} solid ${borderColor};`,
      `  border-radius: ${toPx(borderRadius)};`,
      `  padding: ${toPx(padding)};`,
      `  box-shadow: ${opts.shadow || 'none'};`,
      '  width: 100%;',
      '}',
      ''
    )
  } else if (variant === 'split') {
    lines.push(
      `.${cn} {`,
      '  display: flex;',
      '  max-width: 720px;',
      '  overflow: hidden;',
      `  border-radius: ${toPx(borderRadius)};`,
      `  box-shadow: ${opts.shadow || 'none'};`,
      '  background: transparent;',
      '}',
      '',
      `.${cn}__side {`,
      '  flex: 0 0 40%;',
      `  background: linear-gradient(135deg, ${primaryColor}, ${inputFocusColor});`,
      '  color: #fff;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      `  padding: ${toPx(padding)};`,
      '  min-height: 280px;',
      '}',
      '',
      `.${cn}__side h2 {`,
      '  margin: 0;',
      `  font-size: ${toPx(titleSize)};`,
      '  text-align: center;',
      '}',
      '',
      `.${cn}__box {`,
      '  flex: 1;',
      `  background: ${bgColor};`,
      `  padding: ${toPx(padding)};`,
      '  display: flex;',
      '  flex-direction: column;',
      '  justify-content: center;',
      '}',
      '',
      `@media (max-width: 600px) {`,
      `  .${cn} { flex-direction: column; }`,
      `  .${cn}__side { min-height: 120px; flex: auto; }`,
      '}',
      ''
    )
  } else if (variant === 'centered') {
    lines.push(
      `.${cn} {`,
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  min-height: 100vh;',
      `  padding: ${toPx(24)};`,
      '}',
      '',
      `.${cn}__box {`,
      `  background: ${bgColor};`,
      `  border: ${toPx(borderWidth)} solid ${borderColor};`,
      `  border-radius: ${toPx(borderRadius)};`,
      `  padding: ${toPx(padding)};`,
      `  box-shadow: ${opts.shadow || 'none'};`,
      '  width: 100%;',
      '}',
      ''
    )
  } else {
    lines.push(
      `.${cn}__box {`,
      `  background: ${bgColor};`,
      `  padding: ${toPx(padding)};`,
      '  width: 100%;',
      '}',
      ''
    )
  }

  lines.push(
    `.${cn}__header {`,
    '  margin-bottom: 24px;',
    '  text-align: center;',
    '}',
    '',
    `.${cn}__title {`,
    '  margin: 0 0 8px;',
    `  font-size: ${toPx(titleSize)};`,
    '  font-weight: 700;',
    `  color: ${textColor};`,
    '}',
    '',
    `.${cn}__subtitle {`,
    '  margin: 0;',
    `  font-size: ${toPx(fontSize)};`,
    '  opacity: 0.75;',
    `  color: ${textColor};`,
    '}',
    '',
    `.${cn}__form {`,
    '  display: flex;',
    '  flex-direction: column;',
    `  gap: ${toPx(gap)};`,
    '}',
    '',
    `.${cn}__group {`,
    '  display: flex;',
    '  flex-direction: column;',
    `  gap: ${toPx(6)};`,
    '}',
    '',
    `.${cn}__label {`,
    '  font-weight: 500;',
    `  font-size: ${toPx(Math.max(12, fontSize - 2))};`,
    `  color: ${textColor};`,
    '}',
    '',
    `.${cn}__input-wrap {`,
    '  position: relative;',
    '  display: flex;',
    '  align-items: center;',
    '}',
    '',
    `.${cn}__input {`,
    '  width: 100%;',
    `  padding: ${toPx(12)} ${opts.showIcons ? toPx(40) : toPx(12)};`,
    `  font-size: ${toPx(fontSize)};`,
    `  color: ${textColor};`,
    `  background: ${inputBg};`,
    `  border: 1px solid ${inputBorderColor};`,
    `  border-radius: ${toPx(Math.max(0, borderRadius / 2))};`,
    '  outline: none;',
    '  transition: border-color 0.2s ease, box-shadow 0.2s ease;',
    '  box-sizing: border-box;',
    '}',
    '',
    `.${cn}__input:focus {`,
    `  border-color: ${inputFocusColor};`,
    `  box-shadow: 0 0 0 3px ${inputFocusColor}33;`,
    '}',
    '',
    `.${cn}__input::placeholder {`,
    '  color: #bfbfbf;',
    '}',
    '',
    `.${cn}__icon {`,
    '  position: absolute;',
    `  left: ${toPx(12)};`,
    '  width: 18px;',
    '  height: 18px;',
    '  color: #8c8c8c;',
    '  pointer-events: none;',
    '}',
    '',
    `.${cn}__input:focus ~ .${cn}__icon {`,
    `  color: ${inputFocusColor};`,
    '}',
    ''
  )

  if (opts.showErrorState) {
    lines.push(
      `.${cn}__group--error .${cn}__input {`,
      `  border-color: ${errorColor};`,
      `  background: ${errorColor}0a;`,
      '}',
      '',
      `.${cn}__group--error .${cn}__input:focus {`,
      `  box-shadow: 0 0 0 3px ${errorColor}33;`,
      '}',
      '',
      `.${cn}__error {`,
      `  color: ${errorColor};`,
      `  font-size: ${toPx(Math.max(11, fontSize - 3))};`,
      '  margin-top: 4px;',
      '}',
      ''
    )
  }

  if (opts.showSuccessState) {
    lines.push(
      `.${cn}__group--success .${cn}__input {`,
      `  border-color: ${successColor};`,
      `  background: ${successColor}0a;`,
      '}',
      '',
      `.${cn}__group--success .${cn}__input:focus {`,
      `  box-shadow: 0 0 0 3px ${successColor}33;`,
      '}',
      ''
    )
  }

  lines.push(
    `.${cn}__row {`,
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  flex-wrap: wrap;',
    `  gap: ${toPx(8)};`,
    '}',
    '',
    `.${cn}__checkbox {`,
    '  display: flex;',
    '  align-items: center;',
    `  gap: ${toPx(8)};`,
    '  cursor: pointer;',
    '  font-size: inherit;',
    `  color: ${textColor};`,
    '}',
    '',
    `.${cn}__checkbox input {`,
    '  width: 16px;',
    '  height: 16px;',
    `  accent-color: ${primaryColor};`,
    '  cursor: pointer;',
    '}',
    '',
    `.${cn}__link {`,
    `  color: ${linkColor};`,
    '  text-decoration: none;',
    `  font-size: ${toPx(Math.max(12, fontSize - 2))};`,
    '  transition: opacity 0.2s ease;',
    '}',
    '',
    `.${cn}__link:hover {`,
    '  text-decoration: underline;',
    '  opacity: 0.85;',
    '}',
    '',
    `.${cn}__submit {`,
    '  width: 100%;',
    `  padding: ${toPx(12)} ${toPx(16)};`,
    `  font-size: ${toPx(fontSize)};`,
    '  font-weight: 600;',
    `  color: ${primaryTextColor};`,
    `  background: ${primaryColor};`,
    '  border: none;',
    `  border-radius: ${toPx(Math.max(0, borderRadius / 2))};`,
    '  cursor: pointer;',
    '  transition: transform 0.15s ease, opacity 0.2s ease, box-shadow 0.2s ease;',
    '}',
    '',
    `.${cn}__submit:hover {`,
    '  opacity: 0.92;',
    `  box-shadow: 0 4px 12px ${primaryColor}40;`,
    '}',
    '',
    `.${cn}__submit:active {`,
    '  transform: translateY(1px);',
    '}',
    '',
    `.${cn}__submit:focus-visible {`,
    `  outline: 3px solid ${inputFocusColor};`,
    '  outline-offset: 2px;',
    '}',
    '',
    `.${cn}__footer {`,
    '  margin-top: 20px;',
    '  text-align: center;',
    `  font-size: ${toPx(Math.max(12, fontSize - 2))};`,
    `  color: ${textColor};`,
    '  opacity: 0.85;',
    '}',
    ''
  )

  return lines.join('\n')
}

export function buildLoginFormHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = escapeHtml(opts.className || 'login-form')
  const variant = opts.variant || 'card'
  const showRemember = Boolean(opts.showRemember)
  const showForgot = Boolean(opts.showForgot)
  const showSignup = Boolean(opts.showSignup)
  const showIcons = Boolean(opts.showIcons)
  const showErrorState = Boolean(opts.showErrorState)

  const title = escapeHtml(opts.title || '')
  const subtitle = escapeHtml(opts.subtitle || '')
  const submitText = escapeHtml(opts.submitText || 'Entrar')
  const rememberText = escapeHtml(opts.rememberText || 'Lembrar-me')
  const forgotText = escapeHtml(opts.forgotText || 'Esqueceu a senha?')
  const signupText = escapeHtml(opts.signupText || 'Não tem uma conta? Cadastre-se')
  const emailPlaceholder = escapeHtml(opts.emailPlaceholder || 'seu@email.com')
  const passwordPlaceholder = escapeHtml(opts.passwordPlaceholder || '••••••••')

  const emailIcon = showIcons ? EMAIL_ICON : ''
  const lockIcon = showIcons ? LOCK_ICON : ''

  const header = [
    '  <div class="' + cn + '__header">',
    title ? `    <h1 class="${cn}__title">${title}</h1>` : '',
    subtitle ? `    <p class="${cn}__subtitle">${subtitle}</p>` : '',
    '  </div>',
  ].filter(Boolean)

  const emailGroup = [
    `  <div class="${cn}__group${showErrorState ? ' ' + cn + '__group--error' : ''}">`,
    `    <label class="${cn}__label" for="${cn}-email">Email</label>`,
    '    <div class="' + cn + '__input-wrap">',
    `      <input class="${cn}__input" id="${cn}-email" type="email" name="email" placeholder="${emailPlaceholder}" autocomplete="email" required>`,
    showIcons ? `      <span class="${cn}__icon" aria-hidden="true">${emailIcon}</span>` : '',
    '    </div>',
    showErrorState ? `    <span class="${cn}__error">Email inválido</span>` : '',
    '  </div>',
  ].filter(Boolean)

  const passwordGroup = [
    `  <div class="${cn}__group">`,
    `    <label class="${cn}__label" for="${cn}-password">Senha</label>`,
    '    <div class="' + cn + '__input-wrap">',
    `      <input class="${cn}__input" id="${cn}-password" type="password" name="password" placeholder="${passwordPlaceholder}" autocomplete="current-password" required>`,
    showIcons ? `      <span class="${cn}__icon" aria-hidden="true">${lockIcon}</span>` : '',
    '    </div>',
    '  </div>',
  ].filter(Boolean)

  const rowItems = []
  if (showRemember) {
    rowItems.push(
      `    <label class="${cn}__checkbox">`,
      `      <input type="checkbox" name="remember">`,
      `      <span>${rememberText}</span>`,
      '    </label>'
    )
  }
  if (showForgot) {
    rowItems.push(`    <a class="${cn}__link" href="#">${forgotText}</a>`)
  }

  const row = rowItems.length ? [
    '  <div class="' + cn + '__row">',
    ...rowItems,
    '  </div>',
  ] : []

  const submit = [
    '  <button class="' + cn + '__submit" type="submit">',
    `    ${submitText}`,
    '  </button>',
  ]

  const footer = showSignup ? [
    '  <div class="' + cn + '__footer">',
    `    ${signupText.replace(/Cadastre-se|Sign up/, `<a class="${cn}__link" href="#">$&</a>`)}`,
    '  </div>',
  ] : []

  const formContent = [
    ...header,
    '  <form class="' + cn + '__form" action="#" method="post" novalidate>',
    ...emailGroup.map((l) => '    ' + l),
    ...passwordGroup.map((l) => '    ' + l),
    ...row.map((l) => '    ' + l),
    ...submit.map((l) => '    ' + l),
    '  </form>',
    ...footer,
  ]

  if (variant === 'split') {
    return [
      `<div class="${cn}">`,
      '  <div class="' + cn + '__side">',
      `    <h2>${title || 'Bem-vindo'}</h2>`,
      '  </div>',
      '  <div class="' + cn + '__box">',
      ...formContent.filter(Boolean).map((l) => '    ' + l),
      '  </div>',
      '</div>',
    ].join('\n')
  }

  return [
    `<div class="${cn}">`,
    '  <div class="' + cn + '__box">',
    ...formContent.filter(Boolean).map((l) => '    ' + l),
    '  </div>',
    '</div>',
  ].join('\n')
}

const EMAIL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
const LOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'

export function buildLoginFormFullDemo(options = {}) {
  return `${buildLoginFormCss(options)}\n\n${buildLoginFormHtml(options)}`
}
