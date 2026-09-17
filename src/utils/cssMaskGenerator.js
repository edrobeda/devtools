const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export function buildMaskImage(s) {
  const width = clamp(Number(s.width) || 50, 0, 100)
  if (s.type === 'radial') {
    if (s.shape === 'vignette') {
      return `radial-gradient(circle, transparent 0%, transparent ${100 - width}%, black 100%)`
    }
    if (s.shape === 'ring') {
      const half = clamp(width / 2, 0, 50)
      return `radial-gradient(circle, transparent 0%, black ${50 - half}%, black ${50 + half}%, transparent 100%)`
    }
    return `radial-gradient(circle, black 0%, black ${100 - width}%, transparent 100%)`
  }
  const direction = s.direction || 'to right'
  if (direction === 'both-horizontal' || direction === 'both-vertical') {
    const w2 = clamp(width / 2, 0, 45)
    return `linear-gradient(${direction}, transparent 0%, black ${w2}%, black ${100 - w2}%, transparent 100%)`
  }
  return `linear-gradient(${direction}, black 0%, black ${100 - width}%, transparent 100%)`
}

export function buildMaskStyle(s) {
  const image = buildMaskImage(s)
  const size = s.repeat ? `${clamp(Number(s.tileSize) || 25, 10, 90)}%` : '100%'
  const repeat = s.repeat ? 'repeat' : 'no-repeat'
  return {
    WebkitMaskImage: image,
    maskImage: image,
    WebkitMaskSize: size,
    maskSize: size,
    WebkitMaskRepeat: repeat,
    maskRepeat: repeat,
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  }
}

export function buildMaskCss(s, className = '.mask-fade') {
  const image = buildMaskImage(s)
  const size = s.repeat ? `${clamp(Number(s.tileSize) || 25, 10, 90)}%` : '100%'
  const repeat = s.repeat ? 'repeat' : 'no-repeat'
  const lines = [
    `${className} {`,
    `  -webkit-mask-image: ${image};`,
    `  mask-image: ${image};`,
    `  -webkit-mask-size: ${size};`,
    `  mask-size: ${size};`,
    `  -webkit-mask-repeat: ${repeat};`,
    `  mask-repeat: ${repeat};`,
    `  -webkit-mask-position: center;`,
    `  mask-position: center;`,
    `}`,
  ]
  return lines.join('\n')
}