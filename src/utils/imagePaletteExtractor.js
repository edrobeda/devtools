export function rgbToHex(r, g, b) {
  const toHex = (v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase()
}

export function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  if (!/^([0-9a-fA-F]{6})$/.test(clean)) return null
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

export function isGray(r, g, b, threshold = 15) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min <= threshold
}

export function isNearWhite(r, g, b, threshold = 20) {
  return (r + g + b) / 3 >= 255 - threshold
}

export function isNearBlack(r, g, b, threshold = 20) {
  return (r + g + b) / 3 <= threshold
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem / Could not load image'))
    img.src = src
  })
}

function getAnalysisDimensions(img, maxDimension) {
  const ratio = img.naturalWidth / img.naturalHeight
  if (img.naturalWidth > img.naturalHeight) {
    const width = Math.min(img.naturalWidth, maxDimension)
    return { width, height: Math.round(width / ratio) || 1 }
  }
  const height = Math.min(img.naturalHeight, maxDimension)
  return { width: Math.round(height * ratio) || 1, height }
}

export async function extractPalette(
  source,
  {
    colorCount = 8,
    ignoreGrays = false,
    ignoreNearWhiteBlack = false,
    maxDimension = 120,
    grayThreshold = 15,
    wbThreshold = 20,
  } = {}
) {
  const img = await loadImage(source)
  const dims = getAnalysisDimensions(img, maxDimension)

  const canvas = document.createElement('canvas')
  canvas.width = dims.width
  canvas.height = dims.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, dims.width, dims.height)

  const { data } = ctx.getImageData(0, 0, dims.width, dims.height)
  const buckets = new Map()
  let total = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a < 128) continue

    if (ignoreNearWhiteBlack && (isNearWhite(r, g, b, wbThreshold) || isNearBlack(r, g, b, wbThreshold))) {
      continue
    }
    if (ignoreGrays && isGray(r, g, b, grayThreshold)) {
      continue
    }

    total += 1

    const br = r >> 3
    const bg = g >> 3
    const bb = b >> 3
    const key = `${br},${bg},${bb}`

    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { r: 0, g: 0, b: 0, count: 0 }
      buckets.set(key, bucket)
    }
    bucket.r += r
    bucket.g += g
    bucket.b += b
    bucket.count += 1
  }

  if (total === 0) {
    return []
  }

  const sorted = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, colorCount))

  return sorted.map((bucket) => {
    const color = {
      r: Math.round(bucket.r / bucket.count),
      g: Math.round(bucket.g / bucket.count),
      b: Math.round(bucket.b / bucket.count),
    }
    return {
      ...color,
      hex: rgbToHex(color.r, color.g, color.b),
      count: bucket.count,
      percent: bucket.count / total,
    }
  })
}

export const QUALITY_OPTIONS = {
  low: 80,
  medium: 120,
  high: 200,
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function createSampleImage(type = 'gradient') {
  const width = 400
  const height = 300
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  if (type === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#ef4444')
    gradient.addColorStop(0.2, '#f97316')
    gradient.addColorStop(0.4, '#eab308')
    gradient.addColorStop(0.6, '#22c55e')
    gradient.addColorStop(0.8, '#3b82f6')
    gradient.addColorStop(1, '#a855f7')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  } else if (type === 'shapes') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    const shapes = [
      { x: 20, y: 20, w: 120, h: 120, color: '#ef4444' },
      { x: 160, y: 40, w: 100, h: 100, color: '#3b82f6' },
      { x: 280, y: 30, w: 90, h: 90, color: '#eab308' },
      { x: 80, y: 160, w: 110, h: 110, color: '#22c55e' },
      { x: 220, y: 170, w: 130, h: 100, color: '#a855f7' },
    ]
    shapes.forEach(({ x, y, w, h, color }) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2)
      ctx.fill()
    })
  } else if (type === 'landscape') {
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.6)
    sky.addColorStop(0, '#0ea5e9')
    sky.addColorStop(1, '#bae6fd')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, width, height * 0.6)

    ctx.fillStyle = '#facc15'
    ctx.beginPath()
    ctx.arc(width * 0.75, height * 0.2, 35, 0, Math.PI * 2)
    ctx.fill()

    const grass = ctx.createLinearGradient(0, height * 0.6, 0, height)
    grass.addColorStop(0, '#4ade80')
    grass.addColorStop(1, '#14532d')
    ctx.fillStyle = grass
    ctx.fillRect(0, height * 0.6, width, height * 0.4)

    ctx.fillStyle = '#166534'
    for (let i = 0; i < 5; i += 1) {
      const x = 40 + i * 70
      const y = height * 0.65
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 25, y - 70)
      ctx.lineTo(x + 50, y)
      ctx.fill()
    }
  }

  return canvas.toDataURL('image/png')
}
