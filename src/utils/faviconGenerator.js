const SIZES = [16, 32, 180, 192, 512]

export const DEFAULTS = {
  mode: 'text',
  text: '🔧',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  bgColor: '#1677ff',
  textColor: '#ffffff',
  fontSizeRatio: 0.55,
  borderRadius: 0.22,
  fit: 'cover',
  imageBgColor: '#ffffff',
  themeColor: '#1677ff',
  appName: 'My App',
  appShortName: 'MyApp',
}

export const FIT_OPTIONS = ['cover', 'contain', 'fill']

export function getSizes() {
  return [...SIZES]
}

function createCanvas(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export function drawTextIcon({
  text,
  size,
  bgColor,
  textColor,
  fontFamily,
  fontSizeRatio,
  borderRadius,
}) {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bgColor || '#1677ff'
  if (borderRadius > 0) {
    roundRect(ctx, 0, 0, size, size, Math.min(size * borderRadius, size / 2))
    ctx.fill()
  } else {
    ctx.fillRect(0, 0, size, size)
  }

  ctx.fillStyle = textColor || '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const fontSize = Math.max(1, Math.floor(size * (fontSizeRatio || 0.55)))
  const face = fontFamily || 'sans-serif'
  ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", ${face}`

  const label = String(text || '?').slice(0, 2)
  const x = size / 2
  const y = size / 2 + fontSize * 0.05
  ctx.fillText(label, x, y)

  return canvas.toDataURL('image/png')
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

export async function drawImageIcon({ image, size, fit, bgColor }) {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bgColor || '#ffffff'
  ctx.fillRect(0, 0, size, size)

  const img = await loadImage(image)
  let scale
  if (fit === 'contain') {
    scale = Math.min(size / img.width, size / img.height)
  } else if (fit === 'cover') {
    scale = Math.max(size / img.width, size / img.height)
  } else {
    scale = size / Math.max(img.width, img.height)
  }

  const dw = img.width * scale
  const dh = img.height * scale
  const dx = (size - dw) / 2
  const dy = (size - dh) / 2

  if (fit === 'fill') {
    ctx.drawImage(img, 0, 0, size, size)
  } else {
    ctx.drawImage(img, dx, dy, dw, dh)
  }

  return canvas.toDataURL('image/png')
}

export async function buildIcons(config, imageSrc) {
  const sizes = getSizes()
  const results = []
  const isImageMode = config.mode === 'image' && imageSrc

  for (const size of sizes) {
    let dataUrl
    if (isImageMode) {
      dataUrl = await drawImageIcon({
        image: imageSrc,
        size,
        fit: config.fit,
        bgColor: config.imageBgColor,
      })
    } else {
      dataUrl = drawTextIcon({
        text: config.text,
        size,
        bgColor: config.bgColor,
        textColor: config.textColor,
        fontFamily: config.fontFamily,
        fontSizeRatio: config.fontSizeRatio,
        borderRadius: config.borderRadius,
      })
    }
    results.push({ size, dataUrl })
  }

  return results
}

function slugName(name) {
  return String(name || 'app')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function buildHtmlLinks(config) {
  const name = slugName(config.appName)
  return [
    `<link rel="icon" type="image/png" sizes="16x16" href="/${name}-16x16.png">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/${name}-32x32.png">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/${name}-180x180.png">`,
    `<link rel="icon" type="image/png" sizes="192x192" href="/${name}-192x192.png">`,
    `<link rel="icon" type="image/png" sizes="512x512" href="/${name}-512x512.png">`,
    `<link rel="manifest" href="/site.webmanifest">`,
    config.themeColor ? `<meta name="theme-color" content="${config.themeColor}">` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildManifest(config) {
  const name = config.appName || 'My App'
  const short = config.appShortName || name
  const shortSlug = slugName(short)
  return JSON.stringify(
    {
      name,
      short_name: short,
      icons: [
        {
          src: `/${shortSlug}-192x192.png`,
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: `/${shortSlug}-512x512.png`,
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      theme_color: config.themeColor,
      background_color: config.mode === 'image' ? config.imageBgColor : config.bgColor,
      display: 'standalone',
    },
    null,
    2
  )
}

export function estimateSizeKb(dataUrl) {
  const base64 = dataUrl.split(',')[1] || ''
  const bytes = Math.ceil((base64.length * 3) / 4)
  return (bytes / 1024).toFixed(1)
}
