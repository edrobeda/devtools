// Gera chaves secretas criptograficamente seguras para assinatura JWT
// (HMAC-SHA256/384/512) e as formata em Base64, Base64URL, Hex e ASCII.
// 100% client-side via crypto.getRandomValues.

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function bytesToBase64(bytes, alphabet) {
  let result = ''
  const len = bytes.length
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < len ? bytes[i + 1] : 0
    const b3 = i + 2 < len ? bytes[i + 2] : 0
    const idx1 = b1 >> 2
    const idx2 = ((b1 & 0x03) << 4) | (b2 >> 4)
    const idx3 = ((b2 & 0x0f) << 2) | (b3 >> 6)
    const idx4 = b3 & 0x3f
    result += alphabet[idx1] + alphabet[idx2]
    result += i + 1 < len ? alphabet[idx3] : '='
    result += i + 2 < len ? alphabet[idx4] : '='
  }
  return result
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function bytesToAscii(bytes) {
  // Apenas caracteres ASCII imprimíveis (33-126), descartando os demais
  // para evitar caracteres de controle na string.
  const chars = []
  for (const b of bytes) {
    const c = b % 95 + 33
    chars.push(String.fromCharCode(c))
  }
  return chars.join('')
}

export function generateJwtSecret(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return {
    bytes: byteLength,
    base64: bytesToBase64(bytes, BASE64_ALPHABET),
    base64url: bytesToBase64(bytes, BASE64URL_ALPHABET).replace(/=+$/, ''),
    hex: bytesToHex(bytes),
    ascii: bytesToAscii(bytes),
    entropy: byteLength * 8,
  }
}

export function formatForCopy(secret, format) {
  return secret[format] ?? ''
}

export const HMAC_BYTE_LENGTHS = {
  HS256: 32,
  HS384: 48,
  HS512: 64,
}
