// Simulação de daltonismo aplicada em cores sRGB.
//
// As matrizes abaixo partem do modelo clássico de projeção no plano dos
// cones funcionais (Brettel, Viénot & Mollon, 1997) e são as versões
// pré-computadas, amplamente usadas em ferramentas de acessibilidade.
//
// O pipeline correto exige trabalhar em RGB linear, não no espaço sRGB
// comprimido — por isso fazemos gamma expansion, multiplicamos pela matriz
// e voltamos com gamma compression antes de arredondar.

import { hexToRgb, rgbToHex } from './colorConvert'

export { hexToRgb }

export const CVD_TYPES = {
  protanopia: {
    key: 'protanopia',
    matrix: [
      [0.567, 0.433, 0.0],
      [0.558, 0.442, 0.0],
      [0.0, 0.242, 0.758],
    ],
  },
  deuteranopia: {
    key: 'deuteranopia',
    matrix: [
      [0.625, 0.375, 0.0],
      [0.7, 0.3, 0.0],
      [0.0, 0.3, 0.7],
    ],
  },
  tritanopia: {
    key: 'tritanopia',
    matrix: [
      [0.95, 0.05, 0.0],
      [0.0, 0.433, 0.567],
      [0.0, 0.475, 0.525],
    ],
  },
  achromatopsia: {
    key: 'achromatopsia',
    // Monocromacia total — escala de cinzos pela luminância relativa.
    // Usamos os mesmos coeficientes da fórmula WCAG de luminância.
    luminance: [0.2126, 0.7152, 0.0722],
  },
}

function gammaExpand(channel) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function gammaCompress(channel) {
  const c = channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
  return Math.round(c * 255)
}

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value))
}

export function simulate(rgb, type) {
  if (!rgb) return null
  const cvd = CVD_TYPES[type]
  if (!cvd) return rgb

  const linear = [rgb.r, rgb.g, rgb.b].map(gammaExpand)
  let out

  if (type === 'achromatopsia') {
    const y = linear[0] * cvd.luminance[0]
          + linear[1] * cvd.luminance[1]
          + linear[2] * cvd.luminance[2]
    out = [y, y, y]
  } else {
    const m = cvd.matrix
    out = [
      linear[0] * m[0][0] + linear[1] * m[0][1] + linear[2] * m[0][2],
      linear[0] * m[1][0] + linear[1] * m[1][1] + linear[2] * m[1][2],
      linear[0] * m[2][0] + linear[1] * m[2][1] + linear[2] * m[2][2],
    ]
  }

  const [r, g, b] = out.map(gammaCompress).map((v) => clamp(v))
  return { r, g, b }
}

const hexOf = (color) => rgbToHex(color.r, color.g, color.b)

export function simulateHex(hex, type) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return hexOf(simulate(rgb, type))
}

export function simulateAll(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return {
    original: hexOf(rgb),
    protanopia: hexOf(simulate(rgb, 'protanopia')),
    deuteranopia: hexOf(simulate(rgb, 'deuteranopia')),
    tritanopia: hexOf(simulate(rgb, 'tritanopia')),
    achromatopsia: hexOf(simulate(rgb, 'achromatopsia')),
  }
}
