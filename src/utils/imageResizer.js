// Redimensionador / compressor de imagem — 100% client-side.
//
// O motor é dividido em duas partes:
//   1. computeTargetSize — lógica pura de dimensionamento (modo porcentagem,
//      largura, altura ou "maior lado"), sem tocar em canvas. É o que os
//      testes de função cobrem.
//   2. drawResizedToCanvas — desenha a imagem na tela no tamanho calculado
//      (preenchendo fundo branco quando o destino é JPEG, pra não estourar o
//      canal alpha) e devolve o blob já re-encodado.
//
// O encode/decode de fato é feito pelo navegador via <canvas>/toBlob; aqui
// ficam só as regras de negócio, fáceis de testar e reutilizar.

export const MIN_DIMENSION = 1
export const MAX_DIMENSION = 8192

export const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
}

// Modos de redimensionamento:
//   'percent' — escala por porcentagem do tamanho original
//   'width'   — largura fixa, mantém proporção
//   'height'  — altura fixa, mantém proporção
//   'max'     — maior lado vira `value` (a outra dimensão acompanha a
//               proporção), o modo mais usado pra otimizar pro web
export const MODES = ['percent', 'width', 'height', 'max']

// Calcula a dimensão de destino. Retorna sempre inteiros >= 1 e <= MAX_DIMENSION.
// `w`/`h` são a largura/altura originais (deve vir > 0).
export function computeTargetSize({ w, h, mode = 'percent', value = 100, maxWidth = MAX_DIMENSION, maxHeight = MAX_DIMENSION }) {
  const W = Math.max(1, Number(w))
  const H = Math.max(1, Number(h))
  let width = W
  let height = H

  const v = Number(value)
  switch (mode) {
    case 'width': {
      width = clamp(Math.round(v), MIN_DIMENSION, maxWidth)
      height = Math.round(H * (width / W))
      break
    }
    case 'height': {
      height = clamp(Math.round(v), MIN_DIMENSION, maxHeight)
      width = Math.round(W * (height / H))
      break
    }
    case 'max': {
      // maior lado vira `v`; o menor acompanha a proporção
      const longest = Math.max(W, H)
      const scale = clamp(v, MIN_DIMENSION, Math.max(W, H)) / longest
      width = Math.round(W * scale)
      height = Math.round(H * scale)
      break
    }
    case 'percent':
    default: {
      const scale = clamp(v, 1, 1000) / 100
      width = Math.round(W * scale)
      height = Math.round(H * scale)
      break
    }
  }

  width = clamp(width, MIN_DIMENSION, maxWidth)
  height = clamp(height, MIN_DIMENSION, maxHeight)
  return { width, height }
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

// Desenha `img` num canvas no tamanho alvo e chama onDone(blob). Quando o
// formato final não tem canal alpha (JPEG), pinta o fundo de branco antes.
// `img` pode ser HTMLImageElement ou HTMLCanvasElement (naturalWidth cai fora).
export function drawResizedToCanvas({ img, width, height, mime, quality }, onDone) {
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height
  if (!srcW || !srcH) {
    onDone(null)
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    onDone(null)
    return
  }

  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // PNG não usa qualidade; o parâmetro é ignorado pelo navegador.
  canvas.toBlob(onDone, mime, mime === 'image/png' ? undefined : quality)
}

// Nome de arquivo de saída: "<base>.<ext>" trocando a extensão original.
export function outputFileName(originalName, mime) {
  const base = String(originalName || 'image').replace(/\.[a-z0-9]+$/i, '')
  return `${base}.${MIME_EXT[mime] || 'png'}`
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const v = bytes / 1024 ** i
  const s = v >= 100 || i === 0 ? String(Math.round(v)) : v.toFixed(1)
  return `${s} ${units[i]}`
}

// Quanto o arquivo novo é menor que o original, em % (negativo = aumentou).
export function sizeDeltaPercent(originalBytes, newBytes) {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0) return null
  return ((newBytes - originalBytes) / originalBytes) * 100
}

export function getEngineSource() {
  return [
    '// imageResizer.js — regras de dimensionamento, sem depender de API.',
    'export function computeTargetSize({ w, h, mode, value, maxWidth, maxHeight }) {',
    '  const W = Math.max(1, Number(w))',
    '  const H = Math.max(1, Number(h))',
    '  let width = W, height = H',
    '  const v = Number(value)',
    '  switch (mode) {',
    "    case 'width':",
    '      width  = clamp(Math.round(v), 1, maxWidth)',
    '      height = Math.round(H * (width / W))',
    '      break',
    "    case 'height':",
    '      height = clamp(Math.round(v), 1, maxHeight)',
    '      width  = Math.round(W * (height / H))',
    '      break',
    "    case 'max': // maior lado vira `value`",
    '      const scale = clamp(v, 1, Math.max(W, H)) / Math.max(W, H)',
    '      width  = Math.round(W * scale)',
    '      height = Math.round(H * scale)',
    '      break',
    "    case 'percent':",
    '    default:',
    '      const scale = clamp(v, 1, 1000) / 100',
    '      width  = Math.round(W * scale)',
    '      height = Math.round(H * scale)',
    '  }',
    '  return { width: clamp(width, 1, maxWidth), height: clamp(height, 1, maxHeight) }',
    '}',
    '',
    'function clamp(n, min, max) { return Math.min(Math.max(n, min), max) }',
    '',
    '// Desenho + re-encode ficam no navegador (canvas.toBlob).',
    'export function drawResizedToCanvas({ img, width, height, mime, quality }, onDone) {',
    '  const canvas = document.createElement("canvas")',
    '  canvas.width = width',
    '  canvas.height = height',
    '  const ctx = canvas.getContext("2d")',
    "  if (mime === 'image/jpeg') { // JPEG não tem alpha",
    '    ctx.fillStyle = "#ffffff"',
    '    ctx.fillRect(0, 0, canvas.width, canvas.height)',
    '  }',
    '  ctx.imageSmoothingQuality = "high"',
    '  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)',
    '  canvas.toBlob(onDone, mime, mime === "image/png" ? undefined : quality)',
    '}',
  ].join('\n')
}
