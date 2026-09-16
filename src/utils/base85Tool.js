/**
 * Base85 encode/decode utilities — 100% client-side.
 *
 * Implements three common Base85 dialects:
 *   - Ascii85 (Adobe): all printable chars '!'..'u' (33..117), optional
 *     <~ ~> delimiters, 'z' abbreviation for groups of 4 zero bytes and
 *     support for partial trailing groups.
 *   - RFC 1924 Base85 (B85): 0-9 A-Z a-z plus "!#$%&()*+-;<=>?@^_`{|}~",
 *     with partial trailing group support.
 *   - Z85 (ZeroMQ): binary-safe alphabet, requires output length to be an
 *     exact multiple of 4 bytes (encoded as a multiple of 5 chars).
 */

export const ASCII85_ALPHABET = (() => {
  let s = ''
  for (let i = 33; i <= 117; i++) s += String.fromCharCode(i)
  return s
})()

export const RFC1924_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~'

export const Z85_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#'

// 85^4..85^0 — used to split a 32-bit value into 5 base-85 digits.
const POW85 = [
  Math.pow(85, 4),
  Math.pow(85, 3),
  Math.pow(85, 2),
  85,
  1,
]

const TWO_32 = Math.pow(2, 32)

function utf8ToBytes(str) {
  return new TextEncoder().encode(str)
}

function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes)
}

/**
 * Convert a Uint8Array to a lowercase hex string.
 */
export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert a lowercase/uppercase hex string to a Uint8Array.
 */
export function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, '').toLowerCase()
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const bytes = []
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16))
  }
  return new Uint8Array(bytes)
}

/**
 * Read up to 4 bytes (big-endian, zero-padded on the right) as an unsigned
 * 32-bit value. This is the value that gets expanded into 5 base-85 digits.
 */
function groupValue(bytes, offset, count) {
  let n = 0
  for (let j = 0; j < count; j++) {
    n |= bytes[offset + j] << (24 - 8 * j)
  }
  return n >>> 0
}

/**
 * Expand one unsigned 32-bit value into 5 base-85 characters.
 */
function toChars(n, alphabet) {
  let out = ''
  for (const p of POW85) {
    const d = Math.floor(n / p)
    out += alphabet[d]
    n -= d * p
  }
  return out
}

/**
 * Encode bytes as Base85.
 *
 * opts:
 *   ascii85: enable Ascii85 rules (default false)
 *   zAbbrev: emit 'z' for groups of 4 zero bytes (Ascii85 only, default true)
 *   delims:  wrap the output in <~ ~> (Ascii85 only, default false)
 */
export function encodeBase85(bytes, alphabet = RFC1924_ALPHABET, opts = {}) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error('encodeBase85 expects a Uint8Array')
  }
  const ascii85 = opts.ascii85 === true
  const zAbbrev = opts.zAbbrev !== false
  const delims = opts.delims === true

  if (bytes.length === 0) {
    return ascii85 && delims ? '<~~>' : ''
  }

  let out = ''
  let i = 0
  for (; i + 4 <= bytes.length; i += 4) {
    const n = groupValue(bytes, i, 4)
    if (ascii85 && zAbbrev && n === 0) {
      out += 'z'
    } else {
      out += toChars(n, alphabet)
    }
  }

  const rest = bytes.length - i
  if (rest > 0) {
    // Partial trailing group: pad with zero bytes, keep the leading digits.
    const n = groupValue(bytes, i, rest)
    out += toChars(n, alphabet).slice(0, rest + 1)
  }

  return ascii85 && delims ? `<~${out}~>` : out
}

/**
 * Decode a Base85 string back to bytes.
 *
 * opts:
 *   ascii85: strip <~ ~> delimiters and expand 'z' (default false)
 *   exact:   require the encoded length to be an exact multiple of 5 chars,
 *            rejecting partial trailing groups (Z85, default false)
 */
export function decodeBase85(input, alphabet = RFC1924_ALPHABET, opts = {}) {
  const ascii85 = opts.ascii85 === true
  const exact = opts.exact === true

  let clean = String(input).replace(/\s+/g, '')
  if (ascii85) {
    if (clean.startsWith('<~')) clean = clean.slice(2)
    if (clean.endsWith('~>')) clean = clean.slice(0, -2)
    else if (clean.endsWith('~')) clean = clean.slice(0, -1)
  }
  if (!clean) return new Uint8Array(0)
  if (exact && clean.length % 5 !== 0) {
    throw new Error('Invalid base85 input: encoded length must be a multiple of 5 characters')
  }

  const bytes = []
  let group = []

  const flushGroup = (values) => {
    if (values.length === 5) {
      let n = 0
      for (const g of values) n = n * 85 + g
      if (n >= TWO_32) throw new Error('Invalid base85 group (value out of range)')
      bytes.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff)
      return
    }
    if (values.length === 1) {
      throw new Error('Invalid base85 trailing group (single character)')
    }
    // Partial trailing group: the real 4-byte value ends in (5-k) zero bytes,
    // so pick the unique multiple of 2^(8*(5-k)) inside the valid digit window.
    const k = values.length
    let v = 0
    for (const g of values) v = v * 85 + g
    const scale = POW85[k - 1]
    const low = v * scale
    const mod = Math.pow(2, 8 * (5 - k))
    const n = Math.ceil(low / mod) * mod
    if (n < low || n - low >= scale || n >= TWO_32) {
      throw new Error('Invalid base85 trailing group')
    }
    for (let j = 0; j < k - 1; j++) {
      bytes.push((n >>> (24 - 8 * j)) & 0xff)
    }
  }

  for (const c of clean) {
    if (ascii85 && c === 'z') {
      if (group.length > 0) throw new Error('Invalid base85: "z" must be a complete group')
      bytes.push(0, 0, 0, 0)
      continue
    }
    const v = alphabet.indexOf(c)
    if (v === -1) throw new Error(`Invalid base85 character: "${c}"`)
    group.push(v)
    if (group.length === 5) {
      flushGroup(group)
      group = []
    }
  }
  if (group.length > 0) flushGroup(group)

  return new Uint8Array(bytes)
}

/**
 * Encode a UTF-8 string as Ascii85.
 */
export function encodeAscii85String(str, opts) {
  return encodeBase85(utf8ToBytes(String(str)), ASCII85_ALPHABET, {
    ascii85: true,
    ...opts,
  })
}

/**
 * Decode an Ascii85 string back to UTF-8.
 */
export function decodeAscii85String(input) {
  return bytesToUtf8(decodeBase85(input, ASCII85_ALPHABET, { ascii85: true }))
}

/**
 * Encode a UTF-8 string as RFC 1924 Base85.
 */
export function encodeB85String(str) {
  return encodeBase85(utf8ToBytes(String(str)), RFC1924_ALPHABET)
}

/**
 * Decode an RFC 1924 Base85 string back to UTF-8.
 */
export function decodeB85String(input) {
  return bytesToUtf8(decodeBase85(input, RFC1924_ALPHABET))
}

/**
 * Encode a UTF-8 string as Z85. Input length must be a multiple of 4 bytes.
 */
export function encodeZ85String(str) {
  return encodeBase85(utf8ToBytes(String(str)), Z85_ALPHABET)
}

/**
 * Decode a Z85 string back to UTF-8.
 */
export function decodeZ85String(input) {
  return bytesToUtf8(decodeBase85(input, Z85_ALPHABET, { exact: true }))
}

/**
 * Returns true if the input decodes cleanly under the given alphabet/opts.
 */
export function isValidBase85(input, alphabet = RFC1924_ALPHABET, opts = {}) {
  try {
    decodeBase85(input, alphabet, opts)
    return true
  } catch {
    return false
  }
}

/**
 * Simple byte/char statistics for the page UI.
 */
export function base85Stats(input) {
  const bytes = utf8ToBytes(String(input))
  return {
    chars: input.length,
    bytes: bytes.length,
    bits: bytes.length * 8,
  }
}