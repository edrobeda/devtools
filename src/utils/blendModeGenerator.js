export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
  'plus-darker',
  'plus-lighter',
]

export const BLEND_MODE_TYPES = ['mix-blend-mode', 'background-blend-mode']

export const DEFAULTS = {
  type: 'mix-blend-mode',
  mode: 'multiply',
  backColor: '#ff7e5f',
  frontColor: '#351c75',
  text: 'Blend',
  useGradientBack: false,
  gradientBackStart: '#ff7e5f',
  gradientBackEnd: '#feb47b',
  gradientAngle: 135,
  frontOpacity: 100,
}

export const PRESETS = [
  {
    key: 'multiply',
    labelKey: 'presetMultiply',
    state: {
      type: 'mix-blend-mode',
      mode: 'multiply',
      backColor: '#ff7e5f',
      frontColor: '#351c75',
      useGradientBack: true,
      gradientBackStart: '#ff7e5f',
      gradientBackEnd: '#feb47b',
      text: 'Multiply',
    },
  },
  {
    key: 'screen',
    labelKey: 'presetScreen',
    state: {
      type: 'mix-blend-mode',
      mode: 'screen',
      backColor: '#1a1a2e',
      frontColor: '#e94560',
      useGradientBack: false,
      text: 'Screen',
    },
  },
  {
    key: 'overlay',
    labelKey: 'presetOverlay',
    state: {
      type: 'mix-blend-mode',
      mode: 'overlay',
      backColor: '#2c3e50',
      frontColor: '#e67e22',
      useGradientBack: true,
      gradientBackStart: '#2c3e50',
      gradientBackEnd: '#3498db',
      text: 'Overlay',
    },
  },
  {
    key: 'difference',
    labelKey: 'presetDifference',
    state: {
      type: 'mix-blend-mode',
      mode: 'difference',
      backColor: '#f1c40f',
      frontColor: '#ffffff',
      useGradientBack: false,
      text: 'Difference',
    },
  },
  {
    key: 'backgroundGradient',
    labelKey: 'presetBackgroundGradient',
    state: {
      type: 'background-blend-mode',
      mode: 'overlay',
      backColor: '#833ab4',
      frontColor: '#fd1d1d',
      useGradientBack: true,
      gradientBackStart: '#833ab4',
      gradientBackEnd: '#fcb045',
      text: 'BG Blend',
    },
  },
]

export function isValidHex(value) {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(value)
}

export function buildBackground(state) {
  if (state.useGradientBack) {
    return `linear-gradient(${state.gradientAngle}deg, ${state.gradientBackStart}, ${state.gradientBackEnd})`
  }
  return state.backColor
}

export function buildCss(state) {
  const { type, mode } = state
  if (type === 'background-blend-mode') {
    return `background-blend-mode: ${mode};\nbackground: ${buildBackground(state)}, ${state.frontColor};`
  }
  return `mix-blend-mode: ${mode};\nbackground: ${state.frontColor};\nopacity: ${state.frontOpacity / 100};`
}

export function buildHtmlExample(state) {
  if (state.type === 'background-blend-mode') {
    return `<div style="background-blend-mode: ${state.mode}; background: ${buildBackground(state)}, ${state.frontColor};\n            width: 300px; height: 200px; border-radius: 12px;"></div>`
  }
  return `<div style="background: ${buildBackground(state)}; padding: 40px; border-radius: 12px;">\n  <h1 style="mix-blend-mode: ${state.mode}; color: ${state.frontColor}; opacity: ${state.frontOpacity / 100};\n              font-size: 4rem; margin: 0;">${state.text}</h1>\n</div>`
}
