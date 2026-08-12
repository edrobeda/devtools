// Gerador de texto com gradiente CSS (background-clip: text)
// 100% client-side — nenhum dado sai do navegador.

export const PRESETS = {
  sunset: ['#ff6b6b', '#f9ca24', '#f0932b'],
  ocean: ['#22a6b3', '#3c6382', '#0c2461'],
  forest: ['#6ab04c', '#badc58', '#2f855a'],
  berry: ['#eb2f96', '#9b59b6', '#5f27cd'],
  midnight: ['#1e3799', '#4a69bd', '#0c2461'],
  citrus: ['#f9ca24', '#f0932b', '#badc58'],
  neon: ['#00d2d3', '#5f27cd', '#ff9ff3'],
  fire: ['#ff4757', '#ff6b6b', '#ffa502'],
}

export function buildGradientTextCss({
  gradient,
  fontSize = 64,
  fontWeight = 700,
  textAlign = 'center',
  fallbackColor = '#333333',
  className = 'gradient-text',
}) {
  const { type, angle, stops } = gradient
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const stopsCss = sorted.map((s) => `${s.color} ${s.position}%`).join(', ')
  const gradientValue = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stopsCss})`
    : `radial-gradient(circle, ${stopsCss})`

  return `.${className} {
  font-size: ${fontSize}px;
  font-weight: ${fontWeight};
  text-align: ${textAlign};
  color: ${fallbackColor};
  background: ${gradientValue};
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}`
}

export function buildPreviewStyle({
  gradient,
  fallbackColor = '#333333',
}) {
  const { type, angle, stops } = gradient
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const stopsCss = sorted.map((s) => `${s.color} ${s.position}%`).join(', ')
  return {
    backgroundImage: type === 'linear'
      ? `linear-gradient(${angle}deg, ${stopsCss})`
      : `radial-gradient(circle, ${stopsCss})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: fallbackColor,
  }
}
