// Gerador de radio button customizado CSS puro.
//
// Usa o mesmo truque do checkbox: esconde o input real e estiliza um span
// decorativo como a bolha do radio. O marcador é desenhado no ::after do
// span e só aparece quando input:checked + .radio-box dispara.
//
// O esqueleto compartilhado (container, input oculto, bolha e estados) vem
// de src/utils/cssNativeControlCss.js, que também é usado pelo gerador de
// checkbox. Aqui ficam só o que é específico do radio: os presets, o cálculo
// da geometria e a construção do marcador (ponto, anel ou check).

import { parseColor, toPx, clamp } from './cssColor.js'
import {
  buildToggleControlCss,
  buildToggleControlHtml,
  buildCheckMarkerLines,
  buildDotMarkerLines,
  buildRingMarkerLines,
} from './cssNativeControlCss.js'

const DEFAULTS = {
  size: 24,
  borderRadius: 50,
  activeColor: '#1677ff',
  inactiveColor: '#ffffff',
  markerColor: '#1677ff',
  borderColor: '#d9d9d9',
  borderWidth: 2,
  markerSize: 42,
  markerStyle: 'dot',
  transitionDuration: 180,
  shadow: 'none',
}

const PRESETS = {
  default: {
    size: 24,
    borderRadius: 50,
    activeColor: '#1677ff',
    inactiveColor: '#ffffff',
    markerColor: '#1677ff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    markerSize: 42,
    markerStyle: 'dot',
    transitionDuration: 180,
    shadow: 'none',
  },
  minimal: {
    size: 20,
    borderRadius: 50,
    activeColor: 'transparent',
    inactiveColor: 'transparent',
    markerColor: '#1677ff',
    borderColor: '#8c8c8c',
    borderWidth: 2,
    markerSize: 50,
    markerStyle: 'dot',
    transitionDuration: 160,
    shadow: 'none',
  },
  ring: {
    size: 26,
    borderRadius: 50,
    activeColor: '#ffffff',
    inactiveColor: '#ffffff',
    markerColor: '#52c41a',
    borderColor: '#b7eb8f',
    borderWidth: 3,
    markerSize: 60,
    markerStyle: 'ring',
    transitionDuration: 200,
    shadow: '0 2px 4px rgba(82,196,26,0.25)',
  },
  square: {
    size: 22,
    borderRadius: 6,
    activeColor: '#000000',
    inactiveColor: '#ffffff',
    markerColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    markerSize: 40,
    markerStyle: 'dot',
    transitionDuration: 150,
    shadow: 'none',
  },
  check: {
    size: 24,
    borderRadius: 50,
    activeColor: '#fa8c16',
    inactiveColor: '#ffffff',
    markerColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 2,
    markerSize: 55,
    markerStyle: 'check',
    transitionDuration: 180,
    shadow: 'none',
  },
}

export { PRESETS, DEFAULTS }

export function buildRadioButtonCss(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const size = clamp(Number(opts.size) || DEFAULTS.size, 12, 96)
  const borderRadius = clamp(Number(opts.borderRadius) || DEFAULTS.borderRadius, 0, 50)
  const active = parseColor(opts.activeColor)
  const inactive = parseColor(opts.inactiveColor)
  const marker = parseColor(opts.markerColor)
  const border = parseColor(opts.borderColor)
  const borderWidth = clamp(Number(opts.borderWidth) || DEFAULTS.borderWidth, 0, 12)
  const markerSize = clamp(Number(opts.markerSize) || DEFAULTS.markerSize, 10, 90)
  const markerStyle = opts.markerStyle || 'dot'
  const duration = clamp(Number(opts.transitionDuration) || DEFAULTS.transitionDuration, 0, 2000)
  const shadow = opts.shadow || 'none'
  const radius = borderRadius >= 50 ? '50%' : toPx(borderRadius)

  const markerPx = Math.round(size * (markerSize / 100))

  let markerLines = []
  if (markerStyle === 'dot') {
    markerLines = buildDotMarkerLines({
      rootClass: 'custom-radio',
      boxClass: 'radio-box',
      duration,
      color: marker,
      markerPx,
    })
  } else if (markerStyle === 'ring') {
    markerLines = buildRingMarkerLines({
      rootClass: 'custom-radio',
      boxClass: 'radio-box',
      duration,
      color: marker,
      markerPx,
    })
  } else if (markerStyle === 'check') {
    markerLines = buildCheckMarkerLines({
      rootClass: 'custom-radio',
      boxClass: 'radio-box',
      duration,
      borderWidth: Math.max(2, Math.round(size * 0.1)),
      borderColor: `transparent transparent ${marker} ${marker}`,
      left: size * 0.22,
      top: size * 0.25,
      width: size * 0.22,
      height: size * 0.42,
      comment: 'Marcador como check centralizado',
    })
  }

  return buildToggleControlCss({
    rootClass: 'custom-radio',
    boxClass: 'radio-box',
    controlNoun: 'radio',
    boxNoun: 'bolha',
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

export function buildRadioButtonHtml(options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const nameAttr = opts.name ? ` name="${opts.name}"` : ' name="custom-radio"'
  const valueAttr = opts.value ? ` value="${opts.value}"` : ''

  return buildToggleControlHtml({
    rootClass: 'custom-radio',
    boxClass: 'radio-box',
    inputType: 'radio',
    inputAttrs: `${nameAttr}${valueAttr}`,
    labelText: String(opts.labelText || ''),
    checked: opts.checked,
    disabled: opts.disabled,
  })
}

export function buildRadioButtonFullDemo(options = {}) {
  return `${buildRadioButtonCss(options)}\n\n${buildRadioButtonHtml(options)}`
}
