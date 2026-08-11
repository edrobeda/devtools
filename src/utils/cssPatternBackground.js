// Gerador de padrões de fundo CSS usando apenas gradientes nativos.
//
// Cada padrão é uma função pura que recebe (color1, color2, size) e devolve
// um objeto { backgroundColor, backgroundImage, backgroundSize } compatível
// com a shorthand `background`. O output final é uma classe pronta pra colar.

function parseColor(c) {
  if (!c) return '#1677ff'
  if (typeof c === 'string') return c
  if (c && typeof c.toHexString === 'function') return c.toHexString()
  return String(c)
}

function toPx(v) {
  const n = Math.max(0, Number(v) || 0)
  return n === 0 ? '0' : `${n}px`
}

function replaceAlpha(color, alpha) {
  const hex6 = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
  const hex3 = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i
  const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i

  if (hex6.test(color)) {
    const [, r, g, b] = color.match(hex6)
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`
  }
  if (hex3.test(color)) {
    const [, r, g, b] = color.match(hex3)
    return `rgba(${parseInt(r + r, 16)}, ${parseInt(g + g, 16)}, ${parseInt(b + b, 16)}, ${alpha})`
  }
  if (rgb.test(color)) {
    const [, r, g, b] = color.match(rgb)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (hsl.test(color)) {
    const [, h, s, l] = color.match(hsl)
    return `hsla(${h}, ${s}%, ${l}%, ${alpha})`
  }
  return color
}

function withOpacity(color, opacity) {
  const a = Math.max(0, Math.min(1, Number.isFinite(Number(opacity)) ? Number(opacity) : 1))
  if (a === 1) return color
  return replaceAlpha(color, a)
}

const PATTERNS = {
  'stripes-horizontal'(c1, c2, size) {
    const half = size / 2
    return {
      backgroundColor: c1,
      backgroundImage: `repeating-linear-gradient(180deg, ${c1} 0, ${c1} ${toPx(half)}, ${c2} ${toPx(half)}, ${c2} ${toPx(size)})`,
      backgroundSize: null,
    }
  },

  'stripes-vertical'(c1, c2, size) {
    const half = size / 2
    return {
      backgroundColor: c1,
      backgroundImage: `repeating-linear-gradient(90deg, ${c1} 0, ${c1} ${toPx(half)}, ${c2} ${toPx(half)}, ${c2} ${toPx(size)})`,
      backgroundSize: null,
    }
  },

  'stripes-diagonal'(c1, c2, size, angle) {
    const half = size / 2
    return {
      backgroundColor: c1,
      backgroundImage: `repeating-linear-gradient(${angle}deg, ${c1} 0, ${c1} ${toPx(half)}, ${c2} ${toPx(half)}, ${c2} ${toPx(size)})`,
      backgroundSize: null,
    }
  },

  crosshatch(c1, c2, size) {
    const line = Math.max(1, Math.round(size / 16))
    return {
      backgroundColor: c1,
      backgroundImage: [
        `repeating-linear-gradient(45deg, ${c2} 0, ${c2} ${toPx(line)}, transparent ${toPx(line)}, transparent ${toPx(size / 2)})`,
        `repeating-linear-gradient(-45deg, ${c2} 0, ${c2} ${toPx(line)}, transparent ${toPx(line)}, transparent ${toPx(size / 2)})`,
      ].join(', '),
      backgroundSize: null,
    }
  },

  dots(c1, c2, size) {
    const dot = Math.max(1, size / 8)
    return {
      backgroundColor: c2,
      backgroundImage: `radial-gradient(circle, ${c1} ${toPx(dot)}, transparent ${toPx(dot + 1)})`,
      backgroundSize: `${toPx(size)} ${toPx(size)}`,
    }
  },

  'polka-dots'(c1, c2, size) {
    const dot = Math.max(1, size / 3)
    return {
      backgroundColor: c2,
      backgroundImage: `radial-gradient(circle at center, ${c1} 24%, transparent 25%)`,
      backgroundSize: `${toPx(size)} ${toPx(size)}`,
    }
  },

  checkerboard(c1, c2, size) {
    const half = size / 2
    return {
      backgroundColor: c2,
      backgroundImage: [
        `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%, ${c1})`,
        `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%, ${c1})`,
      ].join(', '),
      backgroundSize: `${toPx(size)} ${toPx(size)}`,
      backgroundPosition: `0 0, ${toPx(half)} ${toPx(half)}`,
    }
  },

  grid(c1, c2, size) {
    const line = Math.max(1, Math.round(size / 16))
    return {
      backgroundColor: c1,
      backgroundImage: [
        `linear-gradient(${c2} ${toPx(line)}, transparent ${toPx(line)})`,
        `linear-gradient(90deg, ${c2} ${toPx(line)}, transparent ${toPx(line)})`,
      ].join(', '),
      backgroundSize: `${toPx(size)} ${toPx(size)}`,
    }
  },

  'graph-paper'(c1, c2, size) {
    const thin = Math.max(1, Math.round(size / 24))
    return {
      backgroundColor: c1,
      backgroundImage: [
        `radial-gradient(circle, ${c2} ${toPx(thin)}, transparent ${toPx(thin + 1)})`,
        `linear-gradient(${c2} ${toPx(thin)}, transparent ${toPx(thin)})`,
        `linear-gradient(90deg, ${c2} ${toPx(thin)}, transparent ${toPx(thin)})`,
      ].join(', '),
      backgroundSize: `${toPx(size)} ${toPx(size)}`,
    }
  },

  diamonds(c1, c2, size) {
    const half = size / 2
    return {
      backgroundColor: c2,
      backgroundImage: [
        `linear-gradient(135deg, ${c1} 25%, transparent 25%)`,
        `linear-gradient(225deg, ${c1} 25%, transparent 25%)`,
        `linear-gradient(315deg, ${c1} 25%, transparent 25%)`,
        `linear-gradient(45deg, ${c1} 25%, transparent 25%)`,
      ].join(', '),
      backgroundSize: `${toPx(size)} ${toPx(size)}`,
      backgroundPosition: `${toPx(half)} 0, ${toPx(half)} 0, 0 0, 0 0`,
    }
  },

  chevron(c1, c2, size) {
    const half = size / 2
    return {
      backgroundColor: c1,
      backgroundImage: [
        `linear-gradient(135deg, ${c2} 25%, transparent 25%)`,
        `linear-gradient(225deg, ${c2} 25%, transparent 25%)`,
        `linear-gradient(315deg, ${c2} 25%, transparent 25%)`,
        `linear-gradient(45deg, ${c2} 25%, transparent 25%)`,
      ].join(', '),
      backgroundSize: `${toPx(size)} ${toPx(size)}`,
      backgroundPosition: `${toPx(half)} 0, ${toPx(half)} 0, 0 0, 0 0`,
    }
  },
}

export const PATTERN_KEYS = Object.keys(PATTERNS)

export function buildPattern({ pattern = 'stripes-horizontal', color1 = '#e6f4ff', color2 = '#1677ff', size = 40, angle = 45, opacity = 1 } = {}) {
  const fn = PATTERNS[pattern] || PATTERNS['stripes-horizontal']
  const c1 = withOpacity(parseColor(color1), opacity)
  const c2 = withOpacity(parseColor(color2), opacity)
  const s = Math.max(4, Number.isFinite(Number(size)) ? Number(size) : 40)
  const a = Number.isFinite(Number(angle)) ? Number(angle) : 45

  const result = fn(c1, c2, s, a)
  return {
    pattern,
    color1: c1,
    color2: c2,
    size: s,
    angle: a,
    opacity,
    ...result,
  }
}

export function buildPatternCss(options = {}, className = 'pattern-bg') {
  const p = buildPattern(options)
  const lines = []
  lines.push(`  background-color: ${p.backgroundColor};`)
  if (p.backgroundImage) lines.push(`  background-image: ${p.backgroundImage};`)
  if (p.backgroundSize) lines.push(`  background-size: ${p.backgroundSize};`)
  if (p.backgroundPosition) lines.push(`  background-position: ${p.backgroundPosition};`)

  return {
    pattern: p,
    css: lines.map((l) => l.trim()).join('\n'),
    classCss: `.${className} {\n${lines.join('\n')}\n}`,
  }
}
