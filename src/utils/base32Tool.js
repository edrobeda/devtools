/**
 * Base32 encode/decode utilities (RFC 4648) — 100% client-side.
 *
 * This is the standard Base32 alphabet used by TOTP secrets, DNS records,
 * and many RFCs. Crockford base32 lives in ulidTool.js and is not mixed
 * here to keep the semantics predictable.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const LOWER_ALPHABET = ALPHABET.toLowerCase()
const CHAR_TO_VALUE = new Map([...ALPHABET].map((c, i) => [c, i]))

function utf8ToBytes(str) {
  return new TextEncoder().encode(str)
}

function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes)
}

/**
 * Normalize user input before decoding: remove padding, whitespace and
 * common separators, then uppercase so the lookup map works.
 */
export function normalizeBase32(input) {
  return input
    .replace(/=+$/g, '')
    .replace(/[\s\-]+/g, '')
    .toUpperCase()
}

/**
 * Returns true if the input contains only valid Base32 characters
 * (ignoring whitespace, dashes and padding).
 */
export function isValidBase32(input) {
  if (!input) return false
  const cleaned = normalizeBase32(input)
  if (!cleaned) return false
  return [...cleaned].every((c) => CHAR_TO_VALUE.has(c))
}

/**
 * Encode a UTF-8 string as RFC 4648 Base32.
 *
 * Options:
 *   - padding: append '=' to reach a multiple of 8 (default true)
 *   - lowercase: use lowercase alphabet (default false)
 *   - groupSize: insert a space every N chars, 0 disables (default 0)
 */
export function encodeBase32(str, options = {}) {
  const { padding = true, lowercase = false, groupSize = 0 } = options
  const alphabet = lowercase ? LOWER_ALPHABET : ALPHABET
  const bytes = utf8ToBytes(String(str))

  let out = ''
  let bits = 0
  let value = 0

  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    out += alphabet[(value << (5 - bits)) & 31]
  }

  if (padding) {
    while (out.length % 8 !== 0) out += '='
  }

  if (groupSize > 0) {
    out = out.match(new RegExp(`.{1,${groupSize}}`, 'g')).join(' ')
  }

  return out
}

/**
 * Decode a Base32 string back to a UTF-8 string.
 * Throws on invalid characters or malformed input.
 */
export function decodeBase32(input) {
  const cleaned = normalizeBase32(input)
  if (!cleaned) return ''

  let bits = 0
  let value = 0
  const bytes = []

  for (let i = 0; i < cleaned.length; i += 1) {
    const c = cleaned[i]
    const v = CHAR_TO_VALUE.get(c)
    if (v === undefined) {
      throw new Error(`Invalid base32 character: "${c}"`)
    }
    value = (value << 5) | v
    bits += 5
    while (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return bytesToUtf8(new Uint8Array(bytes))
}

/**
 * Count how many padding chars a Base32 string would need for its length.
 */
export function expectedPaddingLength(base32LengthWithoutPadding) {
  const remainder = base32LengthWithoutPadding % 8
  return remainder === 0 ? 0 : 8 - remainder
}

/**
 * Simple byte/char statistics for the page UI.
 */
export function base32Stats(input) {
  const bytes = utf8ToBytes(String(input))
  return {
    chars: input.length,
    bytes: bytes.length,
    bits: bytes.length * 8,
  }
}
