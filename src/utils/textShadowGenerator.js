export function hexToRgba(hex, opacityPercent) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${(opacityPercent / 100).toFixed(2)})`
}

export function buildLayerCss(layer) {
  const color = hexToRgba(layer.color, layer.opacity)
  return `${layer.x}px ${layer.y}px ${layer.blur}px ${color}`
}

export function buildTextShadow(layers) {
  if (!layers || layers.length === 0) return 'none'
  return layers.map(buildLayerCss).join(', ')
}

export function buildClassCss(layers, className = 'text-shadow', fontSize = 48) {
  const value = buildTextShadow(layers)
  return `.${className} {
  font-size: ${fontSize}px;
  text-shadow: ${value};
}`
}

export const PRESETS = {
  soft: [
    { x: 0, y: 4, blur: 12, color: '#000000', opacity: 25 },
  ],
  glow: [
    { x: 0, y: 0, blur: 16, color: '#1677ff', opacity: 80 },
  ],
  neon: [
    { x: 0, y: 0, blur: 8, color: '#13c2c2', opacity: 90 },
    { x: 0, y: 0, blur: 24, color: '#13c2c2', opacity: 60 },
  ],
  retro: [
    { x: 2, y: 2, blur: 0, color: '#eb2f96', opacity: 100 },
    { x: 4, y: 4, blur: 0, color: '#722ed1', opacity: 100 },
  ],
  depth: [
    { x: 1, y: 1, blur: 0, color: '#595959', opacity: 100 },
    { x: 2, y: 2, blur: 0, color: '#595959', opacity: 100 },
    { x: 3, y: 3, blur: 0, color: '#595959', opacity: 100 },
    { x: 4, y: 4, blur: 0, color: '#595959', opacity: 100 },
    { x: 5, y: 5, blur: 0, color: '#595959', opacity: 100 },
  ],
  outline: [
    { x: -1, y: -1, blur: 0, color: '#000000', opacity: 100 },
    { x: 1, y: -1, blur: 0, color: '#000000', opacity: 100 },
    { x: -1, y: 1, blur: 0, color: '#000000', opacity: 100 },
    { x: 1, y: 1, blur: 0, color: '#000000', opacity: 100 },
  ],
}
