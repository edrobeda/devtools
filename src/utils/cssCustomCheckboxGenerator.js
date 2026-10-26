// Gerador de checkbox customizado CSS puro.
//
// Usa o truque clássico: esconde o input real com opacity/clip e estiliza o
// pseudo-elemento ::before do label (ou do span decorativo) como a caixa. O
// estado checked desenha o "check" via ::after com clip-path, transform ou
// bordas em L.
//
// O esqueleto compartilhado (container, input oculto, caixa e estados) vem
// de src/utils/cssNativeControlCss.js, que também é usado pelo gerador de
// radio button. Aqui ficam só o que é específico do checkbox: os presets, o
// cálculo da geometria e a construção do marcador (check em L ou traço).

import { parseColor, toPx, clamp } from './cssColor.js'
import {
  buildToggleControlCss,
  buildToggleControlHtml,
  buildCheckMarkerLines,
  buildDashMarkerLines,
} from './cssNativeControlCss.js'

const DEFAULTS = {
  style: 'rounded',
  size: 24,
  borderRadius: 6,
  activeColor: '#1677ff',
  inactiveColor: '#ffffff',
  checkColor: '#ffffff',
  borderColor: '#d9d9d9',
  borderWidth: 2,
  checkWidth: 3,
  transitionDuration: 180,
  checkStyle: 'check',
  shadow: 'none',
}

const PRESETS = {
  rounded: {
    style: 'rounded',
    size: 24,
    borderRadius: 6,
    activeColor: '#1677ff',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 180,
    checkStyle: 'check',
    shadow: 'none',
  },
  circle: {
    style: 'circle',
    size: 26,
    borderRadius: 50,
    activeColor: '#52c41a',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#b7eb8f',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 200,
    checkStyle: 'check',
    shadow: '0 2px 4px rgba(82,196,26,0.25)',
  },
  square: {
    style: 'square',
    size: 22,
    borderRadius: 0,
    activeColor: '#000000',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 150,
    checkStyle: 'check',
    shadow: 'none',
  },
  minimal: {
    style: 'rounded',
    size: 20,
    borderRadius: 4,
    activeColor: 'transparent',
    inactiveColor: 'transparent',
    checkColor: '#1677ff',
    borderColor: '#8c8c8c',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 160,
    checkStyle: 'check',
    shadow: 'none',
  },
  dash: {
    style: 'rounded',
    size: 24,
    borderRadius: 6,
    activeColor: '#faad14',
    inactiveColor: '#ffffff',
    checkColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    checkWidth: 3,
    transitionDuration: 180,
    checkStyle: 'dash',
    shadow: 'none',
  },
}

export { PRESETS, DEFAULTS }

export function buildCustomCheckboxCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const size = clamp(Number(opts.size) || DEFAULTS.size, 12, 96)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, size / 2)
  const active = parseColor(opts.activeColor)
  const inactive = parseColor(opts.inactiveColor)
  const check = parseColor(opts.checkColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || DEFAULTS.borderWidth, 0, 12)
  const checkWidth = clamp(Number(opts.checkWidth) || DEFAULTS.checkWidth, 1, 12)
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 2000)
  const shadow = opts.shadow || 'none'
  const style = opts.style || 'rounded'
  const checkStyle = opts.checkStyle || 'check'

  const radius = style === 'circle' ? '50%' : toPx(borderRadius)

  const markerLines =
    checkStyle === 'check'
      ? buildCheckMarkerLines({
          rootClass: 'custom-checkbox',
          boxClass: 'box',
          duration,
          borderWidth: checkWidth,
          borderColor: `transparent ${check} ${check} transparent`,
          left: size * 0.18,
          top: size * 0.22,
          width: size * 0.22,
          height: size * 0.45,
          comment: 'Símbolo de check em L usando bordas',
        })
      : buildDashMarkerLines({
          rootClass: 'custom-checkbox',
          boxClass: 'box',
          size,
          duration,
          color: check,
          thickness: checkWidth,
        })

  return buildToggleControlCss({
    rootClass: 'custom-checkbox',
    boxClass: 'box',
    controlNoun: 'checkbox',
    boxNoun: 'caixa',
    size,
    radius,
    active,
    inactive,
    border,
    borderWidth,
    shadow,
    duration,
    markerLines,
  })
}

export function buildCustomCheckboxHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }

  return buildToggleControlHtml({
    rootClass: 'custom-checkbox',
    boxClass: 'box',
    inputType: 'checkbox',
    labelText: String(opts.labelText || ''),
    checked: opts.checked,
    disabled: opts.disabled,
  })
}

export function buildCustomCheckboxFullDemo(options = {}) {
  return `${buildCustomCheckboxCss(options)}\n\n${buildCustomCheckboxHtml(options)}`
}
