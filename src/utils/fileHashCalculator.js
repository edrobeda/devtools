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

export function md5FromBuffer(buffer) {
  const src = new Uint8Array(buffer)
  const bitLen64 = BigInt(src.length) * 8n

  const padTotal = (src.length % 64) < 56 ? 56 - (src.length % 64) : 120 - (src.length % 64)
  const msg = new Uint8Array(src.length + padTotal + 8)
  msg.set(src)
  msg[src.length] = 0x80
  const view = new DataView(msg.buffer)
  view.setBigUint64(src.length + padTotal, bitLen64, true)

  let a0 = 0x67452301
  let b0 = 0xEFCDAB89
  let c0 = 0x98BADCFE
  let d0 = 0x10325476

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

  for (let offset = 0; offset < msg.length; offset += 64) {
    const M = new Array(16)
    for (let i = 0; i < 16; i++) {
      M[i] = view.getUint32(offset + i * 4, true)
    }

    let A = a0
    let B = b0
    let C = c0
    let D = d0

    for (let i = 0; i < 64; i++) {
      let f
      let g
      if (i < 16) {
        f = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        f = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        f = C ^ (B | ~D)
        g = (7 * i) % 16
      }

      f = (f + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + leftRotate(f, S[i])) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  return [a0, b0, c0, d0]
    .map((v) => {
      const out = new Uint8Array(4)
      new DataView(out.buffer).setUint32(0, v >>> 0, true)
      return Array.from(out, (x) => x.toString(16).padStart(2, '0')).join('')
    })
    .join('')
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
