// Motor 100% client-side para comparação visual de duas imagens.
// Toda a análise acontece em canvas local — nenhuma imagem sai do navegador.

export const VIEW_MODES = {
  SIDE_BY_SIDE: 'side-by-side',
  OVERLAY: 'overlay',
  DIFF: 'diff',
  BLEND: 'blend',
  ONION_SKIN: 'onion-skin',
}

export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem / Could not load image'))
    img.src = source
  })
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(String(e.target.result))
    reader.onerror = () => reject(new Error('Erro ao ler arquivo / Error reading file'))
    reader.readAsDataURL(file)
  })
}

function getFitDimensions(a, b, maxDimension = 800) {
  const width = Math.max(a.naturalWidth || a.width, b.naturalWidth || b.width)
  const height = Math.max(a.naturalHeight || a.height, b.naturalHeight || b.height)
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  }
}

export function getImageData(img, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

function colorDistance(r1, g1, b1, a1, r2, g2, b2, a2) {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  const da = a1 - a2
  return Math.sqrt(dr * dr + dg * dg + db * db + da * da)
}

export function computeDiff(dataA, dataB, options = {}) {
  const {
    threshold = 0,
    ignoreAlpha = false,
    maskColor = { r: 255, g: 0, b: 0, a: 255 },
    background = { r: 0, g: 0, b: 0, a: 0 },
  } = options

  const length = Math.min(dataA.length, dataB.length)
  const diff = new Uint8ClampedArray(length)
  let different = 0
  let minX = Infinity
  let minY = Infinity
  let maxX = -1
  let maxY = -1
  const size = length / 4
  const width = Math.floor(Math.sqrt(size)) || 1

  for (let i = 0; i < length; i += 4) {
    const r1 = dataA[i]
    const g1 = dataA[i + 1]
    const b1 = dataA[i + 2]
    const a1 = dataA[i + 3]
    const r2 = dataB[i]
    const g2 = dataB[i + 1]
    const b2 = dataB[i + 2]
    const bA = dataB[i + 3]

    const dist = colorDistance(r1, g1, b1, ignoreAlpha ? 255 : a1, r2, g2, b2, ignoreAlpha ? 255 : bA)
    const pixelThreshold = (threshold / 100) * 441.67 // max distance perceptual aproximado

    if (dist > pixelThreshold) {
      different += 1
      const pixel = i / 4
      const x = pixel % width
      const y = Math.floor(pixel / width)
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y

      diff[i] = maskColor.r
      diff[i + 1] = maskColor.g
      diff[i + 2] = maskColor.b
      diff[i + 3] = maskColor.a
    } else {
      diff[i] = background.r
      diff[i + 1] = background.g
      diff[i + 2] = background.b
      diff[i + 3] = background.a
    }
  }

  return {
    diff,
    different,
    totalPixels: length / 4,
    percentage: length ? (different / (length / 4)) * 100 : 0,
    boundingBox:
      minX === Infinity
        ? null
        : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
  }
}

export function renderComparison(imgA, imgB, options = {}) {
  const {
    mode = VIEW_MODES.SIDE_BY_SIDE,
    threshold = 0,
    opacity = 0.5,
    ignoreAlpha = false,
    diffMaskColor = '#ff0000',
    maxDimension = 800,
  } = options

  const dims = getFitDimensions(imgA, imgB, maxDimension)
  const { width, height } = dims

  const dataA = getImageData(imgA, width, height).data
  const dataB = getImageData(imgB, width, height).data

  if (mode === VIEW_MODES.DIFF) {
    const hexToRgb = (hex) => {
      const v = hex.replace('#', '')
      const bigint = parseInt(v, 16)
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
        a: 255,
      }
    }
    const result = computeDiff(dataA, dataB, {
      threshold,
      ignoreAlpha,
      maskColor: hexToRgb(diffMaskColor),
      background: { r: 0, g: 0, b: 0, a: 0 },
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(new ImageData(result.diff, width, height), 0, 0)
    return { canvas, stats: result, width, height }
  }

  if (mode === VIEW_MODES.BLEND) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.globalAlpha = 1
    ctx.drawImage(imgA, 0, 0, width, height)
    ctx.globalAlpha = opacity
    ctx.drawImage(imgB, 0, 0, width, height)
    ctx.globalAlpha = 1
    const result = computeDiff(dataA, dataB, { threshold, ignoreAlpha })
    return { canvas, stats: result, width, height }
  }

  if (mode === VIEW_MODES.ONION_SKIN) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.globalAlpha = 1
    ctx.drawImage(imgB, 0, 0, width, height)
    ctx.globalAlpha = opacity
    ctx.drawImage(imgA, 0, 0, width, height)
    ctx.globalAlpha = 1
    const result = computeDiff(dataA, dataB, { threshold, ignoreAlpha })
    return { canvas, stats: result, width, height }
  }

  if (mode === VIEW_MODES.OVERLAY) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imgA, 0, 0, width, height)
    ctx.globalAlpha = opacity
    ctx.drawImage(imgB, 0, 0, width, height)
    ctx.globalAlpha = 1
    const result = computeDiff(dataA, dataB, { threshold, ignoreAlpha })
    return { canvas, stats: result, width, height }
  }

  // SIDE_BY_SIDE
  const canvas = document.createElement('canvas')
  canvas.width = width * 2
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imgA, 0, 0, width, height)
  ctx.drawImage(imgB, width, 0, width, height)
  const result = computeDiff(dataA, dataB, { threshold, ignoreAlpha })
  return { canvas, stats: result, width: width * 2, height }
}

export function createSamplePair(type = 'shapes') {
  const size = 320
  const a = document.createElement('canvas')
  a.width = size
  a.height = size
  const ctxA = a.getContext('2d')

  const b = document.createElement('canvas')
  b.width = size
  b.height = size
  const ctxB = b.getContext('2d')

  // Fundo comum
  ctxA.fillStyle = '#f6f8fa'
  ctxA.fillRect(0, 0, size, size)
  ctxB.fillStyle = '#f6f8fa'
  ctxB.fillRect(0, 0, size, size)

  if (type === 'shapes') {
    ctxA.fillStyle = '#1677ff'
    ctxA.beginPath()
    ctxA.arc(size / 2, size / 2, 80, 0, Math.PI * 2)
    ctxA.fill()
    ctxA.fillStyle = '#52c41a'
    ctxA.fillRect(40, 180, 100, 80)

    ctxB.fillStyle = '#1677ff'
    ctxB.beginPath()
    ctxB.arc(size / 2, size / 2, 80, 0, Math.PI * 2)
    ctxB.fill()
    ctxB.fillStyle = '#faad14'
    ctxB.fillRect(180, 180, 100, 80)
    ctxB.fillStyle = '#ff4d4f'
    ctxB.beginPath()
    ctxB.arc(80, 80, 30, 0, Math.PI * 2)
    ctxB.fill()
  } else {
    // text / label diff
    ctxA.fillStyle = '#262626'
    ctxA.font = 'bold 32px sans-serif'
    ctxA.fillText('v1.0.0', 80, 170)
    ctxB.fillStyle = '#262626'
    ctxB.font = 'bold 32px sans-serif'
    ctxB.fillText('v1.1.0', 80, 170)
    ctxB.fillStyle = '#1677ff'
    ctxB.font = '16px sans-serif'
    ctxB.fillText('+ novo recurso', 80, 210)
  }

  return { a: a.toDataURL(), b: b.toDataURL() }
}

export function downloadCanvas(canvas, fileName = 'image-diff.png') {
  const link = document.createElement('a')
  link.download = fileName
  link.href = canvas.toDataURL('image/png')
  link.click()
}
