/**
 * Gerador de chaves simétricas (AES) 100% client-side.
 *
 * Usa a Web Crypto API (`crypto.subtle.generateKey` + `exportKey`) para
 * criar chaves AES-128, AES-192 e AES-256 nos formatos raw, jwk e derivados
 * hex/base64. Também gera IVs/nonces aleatórios para os modos comuns
 * (12 bytes para GCM/CTR, 16 bytes para CBC).
 */

export const AES_SIZES = [128, 192, 256]

export const OUTPUT_FORMATS = ['raw', 'hex', 'base64', 'jwk']

export const IV_SIZES = {
  none: 0,
  gcm: 12,
  cbc: 16,
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return typeof window !== 'undefined' && window.btoa
    ? window.btoa(binary)
    : Buffer.from(buffer).toString('base64')
}

export async function generateSymmetricKey({ size = 256, format = 'hex' } = {}) {
  if (!AES_SIZES.includes(size)) {
    throw new Error(`Tamanho de chave inválido: ${size}. Use 128, 192 ou 256.`)
  }
  if (!OUTPUT_FORMATS.includes(format)) {
    throw new Error(`Formato de saída inválido: ${format}`)
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: size },
    true,
    ['encrypt', 'decrypt']
  )

  if (format === 'jwk') {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    return { value: JSON.stringify(jwk, null, 2), size, format }
  }

  const raw = await crypto.subtle.exportKey('raw', key)

  if (format === 'raw') {
    return { value: new Uint8Array(raw), size, format }
  }

  if (format === 'hex') {
    return { value: bufferToHex(raw), size, format }
  }

  return { value: bufferToBase64(raw), size, format }
}

export function generateIv(mode = 'gcm') {
  const size = IV_SIZES[mode] || 0
  if (size === 0) return null
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  return {
    hex: bufferToHex(bytes),
    base64: bufferToBase64(bytes),
    size,
  }
}

export function getKeyExample(size = 256, format = 'hex') {
  const length = size / (format === 'hex' ? 4 : format === 'base64' ? 8 / 6 : 8)
  if (format === 'jwk') {
    return JSON.stringify(
      {
        kty: 'oct',
        k: '<base64url-encoded-key>',
        alg: `A${size / 8}GCM`,
        ext: true,
        key_ops: ['encrypt', 'decrypt'],
      },
      null,
      2
    )
  }
  if (format === 'raw') {
    return `Uint8Array(${size / 8}) [ ... ]`
  }
  return 'x'.repeat(Math.ceil(length))
}
