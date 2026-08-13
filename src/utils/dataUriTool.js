/**
 * Utilitários client-side para criar e decodificar Data URIs (RFC 2397).
 * Nenhum dado sai do navegador.
 */

const COMMON_MIMES = {
  txt: 'text/plain',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  zip: 'application/zip',
  gz: 'application/gzip',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'audio/ogg',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
}

export function guessMimeType(fileName) {
  if (!fileName) return 'application/octet-stream'
  const ext = String(fileName).split('.').pop().toLowerCase()
  return COMMON_MIMES[ext] || 'application/octet-stream'
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Codifica texto simples em data URI.
 * Tenta usar o modo raw quando seguro; caso contrário usa base64.
 */
export function textToDataUri(text, mimeType = 'text/plain', charset = 'UTF-8') {
  const safe = /^[\x20-\x7E\t\n\r]*$/.test(text)
  if (safe && mimeType.startsWith('text/')) {
    const encoded = encodeURIComponent(text)
      .replace(/%20/g, ' ')
      .replace(/%0A/g, '\n')
      .replace(/%0D/g, '\r')
      .replace(/%09/g, '\t')
    return `data:${mimeType};charset=${charset},${encoded}`
  }
  const bytes = new TextEncoder().encode(text)
  const base64 = bytesToBase64(bytes)
  return `data:${mimeType};charset=${charset};base64,${base64}`
}

/**
 * Codifica SVG em data URI. Usa encoding URI quando possível (compatível com CSS background-image).
 */
export function svgToDataUri(svgText) {
  const trimmed = svgText.trim()
  if (!trimmed) return ''
  const encoded = encodeURIComponent(trimmed)
    .replace(/%20/g, ' ')
    .replace(/%0A/g, '\n')
    .replace(/%0D/g, '\r')
    .replace(/%09/g, '\t')
  return `data:image/svg+xml,${encoded}`
}

/**
 * Converte Uint8Array em base64.
 */
export function bytesToBase64(bytes) {
  if (typeof window !== 'undefined' && window.btoa) {
    let binary = ''
    const len = bytes.byteLength
    for (let i = 0; i < len; i += 1) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
  // Fallback seguro para ambientes sem btoa (raro no navegador).
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let base64 = ''
  let i = 0
  while (i < bytes.length) {
    const a = bytes[i++]
    const b = bytes[i++]
    const c = bytes[i++]
    base64 += chars[a >> 2]
    base64 += chars[((a & 3) << 4) | ((b ?? 0) >> 4)]
    base64 += b !== undefined ? chars[((b & 15) << 2) | ((c ?? 0) >> 6)] : '='
    base64 += c !== undefined ? chars[c & 63] : '='
  }
  return base64
}

/**
 * Converte base64 em Uint8Array.
 */
export function base64ToBytes(base64) {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '')
  if (typeof window !== 'undefined' && window.atob) {
    const binary = window.atob(clean)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  // Fallback JS puro.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const map = new Map(chars.split('').map((c, idx) => [c, idx]))
  const len = clean.length
  const bytes = []
  for (let i = 0; i < len; i += 4) {
    const a = map.get(clean[i]) ?? 0
    const b = map.get(clean[i + 1]) ?? 0
    const c = clean[i + 2] === '=' ? 0 : (map.get(clean[i + 2]) ?? 0)
    const d = clean[i + 3] === '=' ? 0 : (map.get(clean[i + 3]) ?? 0)
    bytes.push((a << 2) | (b >> 4))
    if (clean[i + 2] !== '=') bytes.push(((b & 15) << 4) | (c >> 2))
    if (clean[i + 3] !== '=') bytes.push(((c & 3) << 6) | d)
  }
  return new Uint8Array(bytes)
}

/**
 * Codifica um arquivo (Uint8Array) em data URI base64.
 */
export function binaryToDataUri(bytes, mimeType = 'application/octet-stream') {
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`
}

const DATA_URI_RE = /^data:([^,;]*)(;charset=([^,;]*))?(;base64)?,(.*)$/i

/**
 * Faz o parsing de uma data URI sem decodificar o payload.
 */
export function parseDataUri(dataUri) {
  const match = String(dataUri).match(DATA_URI_RE)
  if (!match) return null
  return {
    mimeType: match[1] || 'text/plain',
    charset: match[3] || '',
    isBase64: !!match[4],
    data: match[5] || '',
  }
}

/**
 * Decodifica uma data URI, retornando metadados e os dados decodificados.
 */
export function decodeDataUri(dataUri) {
  const parsed = parseDataUri(dataUri)
  if (!parsed) return null

  const { mimeType, charset, isBase64, data: rawData } = parsed
  let text = ''
  let bytes = null
  let error = null

  if (isBase64) {
    try {
      bytes = base64ToBytes(rawData)
      text = new TextDecoder(charset || 'UTF-8', { fatal: false }).decode(bytes)
    } catch (e) {
      error = e.message
    }
  } else {
    try {
      text = decodeURIComponent(rawData)
      bytes = new TextEncoder().encode(text)
    } catch (e) {
      text = rawData
      bytes = new TextEncoder().encode(rawData)
      error = e.message
    }
  }

  return {
    ...parsed,
    text,
    bytes,
    error,
    byteLength: bytes?.length ?? 0,
  }
}

/**
 * Verifica se um MIME type parece ser uma imagem renderizável.
 */
export function isImageMime(mimeType) {
  return /^image\//i.test(mimeType)
}

/**
 * Cria um object URL a partir de bytes decodificados (para preview de binários).
 */
export function bytesToObjectUrl(bytes, mimeType) {
  if (!bytes || !mimeType) return ''
  try {
    const blob = new Blob([bytes], { type: mimeType })
    return URL.createObjectURL(blob)
  } catch {
    return ''
  }
}
