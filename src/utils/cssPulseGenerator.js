// Motor do Gerador de Efeito Pulse CSS
// Gera animações de pulsação usando box-shadow expansivo e scale transform.

function toRgba(hex, alpha) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const DEFAULTS = {
  color: '#1677ff',
  size: 64,
  borderRadius: 50,
  duration: 1.5,
  scale: 1.15,
  startOpacity: 0.6,
  finalOpacity: 0,
  waves: 2,
  infinite: true,
  easing: 'ease-out',
  className: 'pulse',
}

export const PRESETS = {
  default: { ...DEFAULTS, color: '#1677ff' },
  'soft-blue': { ...DEFAULTS, color: '#1677ff', size: 80, duration: 2, scale: 1.08, startOpacity: 0.4 },
  success: { ...DEFAULTS, color: '#52c41a', size: 56, duration: 1.2, scale: 1.2, startOpacity: 0.7 },
  warning: { ...DEFAULTS, color: '#faad14', size: 72, duration: 1.8, scale: 1.1, startOpacity: 0.55 },
  error: { ...DEFAULTS, color: '#ff4d4f', size: 60, duration: 1, scale: 1.25, startOpacity: 0.8 },
  ripple: {
    ...DEFAULTS,
    color: '#13c2c2',
    size: 40,
    borderRadius: 50,
    duration: 2.5,
    scale: 2.5,
    startOpacity: 0.5,
    finalOpacity: 0,
    waves: 3,
  },
}

export function buildPulseCss(settings) {
  const {
    color,
    size,
    borderRadius,
    duration,
    scale,
    startOpacity,
    finalOpacity,
    waves,
    infinite,
    easing,
    className,
  } = { ...DEFAULTS, ...settings }

  const iteration = infinite ? 'infinite' : `${Math.max(1, Math.round(waves))}`
  const waveCount = Math.max(1, Math.round(waves))
  const stepOpacity = (startOpacity - finalOpacity) / waveCount

  // Constrói keyframes com paradas distribuídas para cada onda.
  const keyframes = []
  keyframes.push(`  0% {`)
  keyframes.push(`    transform: scale(1);`)
  keyframes.push(`    box-shadow: 0 0 0 0 ${toRgba(color, startOpacity)};`)
  keyframes.push(`  }`)

  for (let i = 1; i <= waveCount; i++) {
    const progress = (i / waveCount) * 100
    const waveScale = 1 + (scale - 1) * (i / waveCount)
    const opacity = Math.max(0, startOpacity - stepOpacity * i)
    keyframes.push(`  ${progress.toFixed(1)}% {`)
    keyframes.push(`    transform: scale(${waveScale.toFixed(3)});`)
    keyframes.push(`    box-shadow: 0 0 0 ${Math.round(size * (i / waveCount))}px ${toRgba(color, opacity.toFixed(2))};`)
    keyframes.push(`  }`)
  }

  return [
    `.${className} {`,
    `  width: ${size}px;`,
    `  height: ${size}px;`,
    `  border-radius: ${borderRadius}%;`,
    `  background: ${color};`,
    `  box-shadow: 0 0 0 0 ${toRgba(color, startOpacity)};`,
    `  animation: ${className}-animation ${duration}s ${easing} ${iteration};`,
    `}`,
    ``,
    `@keyframes ${className}-animation {`,
    ...keyframes,
    `}`,
  ].join('\n')
}

export function buildPulseHtml(settings) {
  const { className } = { ...DEFAULTS, ...settings }
  return `<div class="${className}"></div>`
}

export function buildPulseFullDemo(settings) {
  const css = buildPulseCss(settings)
  const html = buildPulseHtml(settings)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulse Effect</title>
  <style>
${css.split('\n').map((line) => (line ? `    ${line}` : '')).join('\n')}
  </style>
</head>
<body>
  ${html}
</body>
</html>`
}

export function buildPreviewStyle(settings) {
  const {
    color,
    size,
    borderRadius,
    duration,
    scale,
    startOpacity,
    finalOpacity,
    waves,
    infinite,
    easing,
  } = { ...DEFAULTS, ...settings }

  const waveCount = Math.max(1, Math.round(waves))
  const stepOpacity = (startOpacity - finalOpacity) / waveCount

  return {
    width: size,
    height: size,
    borderRadius: `${borderRadius}%`,
    background: color,
    boxShadow: `0 0 0 0 ${toRgba(color, startOpacity)}`,
    animation: `pulse-preview-animation ${duration}s ${easing} ${infinite ? 'infinite' : Math.max(1, Math.round(waves))}`,
  }
}

export function buildPreviewKeyframes(settings) {
  const {
    color,
    size,
    scale,
    startOpacity,
    finalOpacity,
    waves,
  } = { ...DEFAULTS, ...settings }

  const waveCount = Math.max(1, Math.round(waves))
  const stepOpacity = (startOpacity - finalOpacity) / waveCount
  const steps = []

  steps.push(`0% { transform: scale(1); box-shadow: 0 0 0 0 ${toRgba(color, startOpacity)}; }`)
  for (let i = 1; i <= waveCount; i++) {
    const progress = (i / waveCount) * 100
    const waveScale = 1 + (scale - 1) * (i / waveCount)
    const opacity = Math.max(0, startOpacity - stepOpacity * i)
    steps.push(
      `${progress.toFixed(1)}% { transform: scale(${waveScale.toFixed(3)}); box-shadow: 0 0 0 ${Math.round(size * (i / waveCount))}px ${toRgba(color, opacity.toFixed(2))}; }`
    )
  }

  return `@keyframes pulse-preview-animation { ${steps.join(' ')} }`
}
