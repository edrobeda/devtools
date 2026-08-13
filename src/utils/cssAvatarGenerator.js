// Gerador de avatar CSS puro.
//
// Produz a classe .avatar com variações filled, gradient, outline e soft,
// formas circle/square/rounded/hexagon, anel de status, badge e grupo.

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

function hexToRgb(hex) {
  const clean = parseColor(hex).replace('#', '')
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  if (Number.isNaN(bigint)) return { r: 22, g: 119, b: 255 }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function autoTextColor(hex) {
  return relativeLuminance(hex) > 0.5 ? '#000000' : '#ffffff'
}

const STATUS_COLORS = {
  online: '#52c41a',
  offline: '#bfbfbf',
  away: '#faad14',
  busy: '#ff4d4f',
}

const ICON_SVGS = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
}

const DEFAULTS = {
  shape: 'circle',
  size: 64,
  variant: 'filled',
  background: '#1677ff',
  background2: '#722ed1',
  textColor: 'auto',
  content: 'initials',
  initials: 'JD',
  fontSize: 24,
  fontWeight: 600,
  borderWidth: 0,
  borderColor: '#ffffff',
  borderStyle: 'solid',
  status: 'none',
  statusPosition: 'bottom-right',
  statusSize: 14,
  statusRingWidth: 2,
  shadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  badge: 'none',
  badgeNumber: 3,
  badgeColor: '#ff4d4f',
  badgeTextColor: '#ffffff',
  group: false,
  groupCount: 3,
  groupOverlap: 12,
  className: 'avatar',
}

const PRESETS = {
  default: { ...DEFAULTS },
  material: {
    ...DEFAULTS,
    shape: 'circle',
    variant: 'filled',
    background: '#1677ff',
    initials: 'AB',
    fontSize: 26,
    shadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  slack: {
    ...DEFAULTS,
    shape: 'rounded',
    variant: 'gradient',
    background: '#36c5f0',
    background2: '#e01e5a',
    initials: 'S',
    fontSize: 28,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  discord: {
    ...DEFAULTS,
    shape: 'circle',
    variant: 'soft',
    background: '#5865f2',
    textColor: '#5865f2',
    content: 'icon',
    fontSize: 28,
    borderWidth: 0,
    shadow: 'none',
  },
  minimal: {
    ...DEFAULTS,
    shape: 'circle',
    variant: 'outline',
    background: '#ffffff',
    textColor: '#262626',
    initials: 'M',
    fontSize: 22,
    borderWidth: 2,
    borderColor: '#d9d9d9',
    shadow: 'none',
  },
  square: {
    ...DEFAULTS,
    shape: 'square',
    variant: 'filled',
    background: '#52c41a',
    initials: 'SQ',
    fontSize: 20,
    borderRadius: 8,
    shadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  hexagon: {
    ...DEFAULTS,
    shape: 'hexagon',
    variant: 'gradient',
    background: '#fa8c16',
    background2: '#eb2f96',
    initials: 'H',
    fontSize: 26,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadow: '0 4px 10px rgba(0,0,0,0.18)',
  },
}

export { DEFAULTS, PRESETS, ICON_SVGS, STATUS_COLORS }

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function statusPositionOffsets(position, size, statusSize) {
  const inset = Math.round(size * 0.04)
  const map = {
    'bottom-right': { right: `${inset}px`, bottom: `${inset}px` },
    'bottom-left': { left: `${inset}px`, bottom: `${inset}px` },
    'top-right': { right: `${inset}px`, top: `${inset}px` },
    'top-left': { left: `${inset}px`, top: `${inset}px` },
  }
  return map[position] || map['bottom-right']
}

function clipPathForShape(shape) {
  if (shape === 'hexagon') {
    return 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
  }
  return null
}

export function buildAvatarCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'avatar'
  const shape = opts.shape || 'circle'
  const size = clamp(Number(opts.size) || 64, 24, 256)
  const variant = opts.variant || 'filled'
  const bg = parseColor(opts.background) || '#1677ff'
  const bg2 = parseColor(opts.background2) || '#722ed1'
  const textColor = opts.textColor === 'auto' ? autoTextColor(bg) : parseColor(opts.textColor)
  const fontSize = clamp(Number(opts.fontSize) || 24, 8, 96)
  const fontWeight = clamp(Number(opts.fontWeight) || 600, 100, 900)
  const borderWidth = clamp(Number(opts.borderWidth) || 0, 0, 16)
  const borderColor = parseColor(opts.borderColor) || '#ffffff'
  const borderStyle = opts.borderStyle || 'solid'
  const shadow = opts.shadow || 'none'
  const status = opts.status || 'none'
  const statusSize = clamp(Number(opts.statusSize) || 14, 6, 48)
  const statusRingWidth = clamp(Number(opts.statusRingWidth) || 2, 0, 8)
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.online
  const badge = opts.badge || 'none'
  const badgeColor = parseColor(opts.badgeColor) || '#ff4d4f'
  const badgeTextColor = parseColor(opts.badgeTextColor) || '#ffffff'

  let background
  let color
  let border

  if (variant === 'outline') {
    background = 'transparent'
    color = textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} ${borderStyle} ${borderColor}` : 'none'
  } else if (variant === 'soft') {
    background = rgba(bg, 0.15)
    color = textColor === autoTextColor(bg) ? bg : textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} ${borderStyle} ${borderColor}` : 'none'
  } else if (variant === 'gradient') {
    background = `linear-gradient(135deg, ${bg}, ${bg2})`
    color = autoTextColor(bg)
    border = borderWidth > 0 ? `${toPx(borderWidth)} ${borderStyle} ${borderColor}` : 'none'
  } else {
    // filled
    background = bg
    color = textColor
    border = borderWidth > 0 ? `${toPx(borderWidth)} ${borderStyle} ${borderColor}` : 'none'
  }

  const borderRadius = shape === 'circle'
    ? '50%'
    : shape === 'square'
      ? '0'
      : shape === 'rounded'
        ? `${Math.round(size * 0.22)}px`
        : '0'

  const clipPath = clipPathForShape(shape)

  const lines = [
    `.${cn} {`,
    '  position: relative;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    `  width: ${toPx(size)};`,
    `  height: ${toPx(size)};`,
    `  background: ${background};`,
    `  color: ${color};`,
    `  border: ${border};`,
    `  border-radius: ${borderRadius};`,
    clipPath ? `  clip-path: ${clipPath};` : null,
    `  box-shadow: ${shadow};`,
    `  font-size: ${toPx(fontSize)};`,
    `  font-weight: ${fontWeight};`,
    '  line-height: 1;',
    '  font-family: inherit;',
    '  text-transform: uppercase;',
    '  user-select: none;',
    '  vertical-align: middle;',
    '}',
    '',
    `.${cn}__image,`,
    `.${cn} svg {`,
    '  width: 55%;',
    '  height: 55%;',
    '}',
    '',
  ]

  if (status !== 'none') {
    const offsets = statusPositionOffsets(opts.statusPosition, size, statusSize)
    lines.push(
      `.${cn}__status {`,
      '  position: absolute;',
      `  width: ${toPx(statusSize)};`,
      `  height: ${toPx(statusSize)};`,
      `  background: ${statusColor};`,
      `  border: ${toPx(statusRingWidth)} solid ${borderColor};`,
      '  border-radius: 50%;',
      '  box-sizing: border-box;',
      '  z-index: 1;',
      offsets.right ? `  right: ${offsets.right};` : null,
      offsets.left ? `  left: ${offsets.left};` : null,
      offsets.top ? `  top: ${offsets.top};` : null,
      offsets.bottom ? `  bottom: ${offsets.bottom};` : null,
      '}',
      ''
    )
  }

  if (badge !== 'none') {
    lines.push(
      `.${cn}__badge {`,
      '  position: absolute;',
      `  min-width: ${toPx(badge === 'dot' ? 10 : 18)};`,
      `  height: ${toPx(badge === 'dot' ? 10 : 18)};`,
      `  padding: ${badge === 'dot' ? '0' : '0 5px'};`,
      `  background: ${badgeColor};`,
      `  color: ${badgeTextColor};`,
      '  border-radius: 999px;',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  line-height: 1;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  top: 0;',
      '  right: 0;',
      '  transform: translate(35%, -35%);',
      '  z-index: 2;',
      '  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);',
      '}',
      ''
    )
  }

  return lines.filter((line) => line !== null).join('\n')
}

export function buildAvatarHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'avatar'
  const content = opts.content || 'initials'
  const initials = escapeHtml(opts.initials || '')
  const status = opts.status || 'none'
  const badge = opts.badge || 'none'
  const badgeNumber = clamp(Number(opts.badgeNumber) || 0, 0, 999)

  const parts = [`<span class="${cn}">`]
  if (content === 'icon') {
    parts.push(`  ${ICON_SVGS.user}`)
  } else {
    parts.push(`  <span class="${cn}__text">${initials}</span>`)
  }
  if (status !== 'none') {
    parts.push(`  <span class="${cn}__status" aria-label="Status: ${status}"></span>`)
  }
  if (badge !== 'none') {
    parts.push(`  <span class="${cn}__badge" aria-label="${badgeNumber} notifications">${badge === 'dot' ? '' : badgeNumber}</span>`)
  }
  parts.push('</span>')

  return parts.join('\n')
}

export function buildAvatarGroupCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'avatar'
  const overlap = clamp(Number(opts.groupOverlap) || 12, 0, 64)

  return [
    `.${cn}-group {`,
    '  display: inline-flex;',
    '  align-items: center;',
    `  margin-left: ${toPx(overlap)};`,
    '}',
    '',
    `.${cn}-group .${cn} {`,
    `  margin-left: -${toPx(overlap)};`,
    '  transition: transform 150ms ease, box-shadow 150ms ease;',
    '}',
    '',
    `.${cn}-group .${cn}:hover {`,
    '  transform: translateY(-3px);',
    '  z-index: 1;',
    '}',
    '',
  ].join('\n')
}

export function buildAvatarGroupHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const cn = opts.className || 'avatar'
  const count = clamp(Number(opts.groupCount) || 2, 2, 8)
  const initialsPool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  const parts = [`<div class="${cn}-group">`]
  for (let i = 0; i < count; i += 1) {
    const initials = `${initialsPool[i % initialsPool.length]}${initialsPool[(i + 1) % initialsPool.length]}`
    parts.push(`  <span class="${cn}"><span class="${cn}__text">${initials}</span></span>`)
  }
  parts.push('</div>')

  return parts.join('\n')
}

export function buildAvatarFullDemo(options = {}) {
  const css = [buildAvatarCss(options)]
  const opts = { ...DEFAULTS, ...options }
  if (opts.group) css.push(buildAvatarGroupCss(options))
  return `${css.join('\n\n')}\n\n${opts.group ? buildAvatarGroupHtml(options) : buildAvatarHtml(options)}`
}
