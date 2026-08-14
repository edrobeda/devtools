// Calculadora de hashes de arquivo 100% client-side.
// MD5 é implementado em JavaScript puro (não faz parte da Web Crypto API).
// SHA-1/256/384/512 usam crypto.subtle.digest nativo.

export const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function formatHex(hash, uppercase = false) {
  const hex = uppercase ? hash.toUpperCase() : hash.toLowerCase()
  return hex
}

// ---------- MD5 puro ----------

function leftRotate(x, c) {
  return (((x << c) | (x >>> (32 - c))) >>> 0)
}

function bytesToWords(bytes) {
  const words = []
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= (bytes[i] << ((i % 4) * 8))
  }
  return words
}

export function md5FromBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  const bitLen = (bytes.length * 8) >>> 0
  const bitLenHi = (bytes.length * 8) / 2 ** 32

  // Padding
  const padLen = (bytes.length % 64) < 56 ? 56 - (bytes.length % 64) : 120 - (bytes.length % 64)
  const totalLen = bytes.length + 1 + padLen + 8
  const padded = new Uint8Array(totalLen)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  // Length em bits como 64 bits little-endian
  const view = new DataView(padded.buffer)
  view.setUint32(bytes.length + 1 + padLen, bitLen >>> 0, true)
  view.setUint32(bytes.length + 1 + padLen + 4, Math.floor(bitLenHi) >>> 0, true)

  let a = 0x67452301
  let b = 0xEFCDAB89
  let c = 0x98BADCFE
  let d = 0x10325476

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]

  const K = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0
  }

  for (let offset = 0; offset < totalLen; offset += 64) {
    const chunk = new Uint32Array(padded.buffer, offset, 16)
    const M = Array.from(chunk)

    let A = a
    let B = b
    let C = c
    let D = d

    for (let i = 0; i < 64; i++) {
      let f
      let g
      if (i < 16) {
        f = (B & C) | ((~B >>> 0) & D)
        g = i
      } else if (i < 32) {
        f = (D & B) | ((~D >>> 0) & C)
        g = ((5 * i + 1) % 16)
      } else if (i < 48) {
        f = B ^ C ^ D
        g = ((3 * i + 5) % 16)
      } else {
        f = C ^ (B | ((~D >>> 0)))
        g = ((7 * i) % 16)
      }

      const temp = D >>> 0
      D = C >>> 0
      C = B >>> 0
      B = ((B + leftRotate((A + f + K[i] + M[g]) >>> 0, S[i])) >>> 0)
      A = temp
    }

    a = (a + A) >>> 0
    b = (b + B) >>> 0
    c = (c + C) >>> 0
    d = (d + D) >>> 0
  }

  return [a, b, c, d].map((v) => v.toString(16).padStart(8, '0')).join('')
}

// ---------- SHA via Web Crypto ----------

export async function shaFromBuffer(buffer, algorithm) {
  const algo = algorithm.replace(/-/g, '-').toUpperCase()
  const digest = await crypto.subtle.digest(algo, buffer)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------- API pública ----------

export async function hashBuffer(buffer, algorithms = ALGORITHMS, onProgress) {
  const result = {}
  const total = algorithms.length
  for (let i = 0; i < total; i++) {
    const algo = algorithms[i]
    if (algo === 'MD5') {
      result[algo] = md5FromBuffer(buffer)
    } else {
      result[algo] = await shaFromBuffer(buffer, algo)
    }
    if (onProgress) {
      onProgress({ algorithm: algo, index: i, total })
    }
  }
  return result
}

export async function hashFile(file, algorithms = ALGORITHMS, onProgress) {
  const buffer = await file.arrayBuffer()
  const hashes = await hashBuffer(buffer, algorithms, onProgress)
  return {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
    hashes,
  }
}

export function verifyHash(computed, expected) {
  const a = computed.toLowerCase().replace(/\s+/g, '')
  const b = String(expected).toLowerCase().replace(/\s+/g, '')
  return a === b
}
