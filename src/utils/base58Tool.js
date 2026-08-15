/**
 * Base58 / Base58Check encode/decode utilities — 100% client-side.
 *
 * Base58 removes visually ambiguous characters (0, O, I, l) and is used by
 * Bitcoin, IPFS, Ripple and many other systems. Base58Check adds a 4-byte
 * double-SHA256 checksum, commonly seen in Bitcoin addresses and WIF keys.
 */

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const CHAR_TO_VALUE = new Map([...ALPHABET].map((c, i) => [c, BigInt(i)]))
const BASE = BigInt(58)
const ZERO = BigInt(0)

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

async function sha256(bytes) {
  const buffer = await crypto.subtle.digest('SHA-256', bytes)
  return new Uint8Array(buffer)
}

/**
 * Compute the 4-byte checksum used by Base58Check.
 */
export async function base58checkChecksum(payload) {
  const hash1 = await sha256(payload)
  const hash2 = await sha256(hash1)
  return hash2.slice(0, 4)
}

/**
 * Encode arbitrary bytes as Base58.
 */
export function encodeBase58(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error('encodeBase58 expects a Uint8Array')
  }
  if (bytes.length === 0) return ''

  let value = ZERO
  for (const byte of bytes) {
    value = (value << BigInt(8)) | BigInt(byte)
  }

  let out = ''
  if (value === ZERO) {
    out = ALPHABET[0]
  } else {
    while (value > ZERO) {
      out = ALPHABET[Number(value % BASE)] + out
      value = value / BASE
    }
  }

  // Preserve leading zero bytes as leading '1' chars.
  for (const byte of bytes) {
    if (byte === 0) {
      out = ALPHABET[0] + out
    } else {
      break
    }
  }

  return out
}

/**
 * Decode a Base58 string back to bytes.
 */
export function decodeBase58(input) {
  const cleaned = input.replace(/\s+/g, '')
  if (!cleaned) return new Uint8Array(0)

  let value = ZERO
  for (const c of cleaned) {
    const v = CHAR_TO_VALUE.get(c)
    if (v === undefined) {
      throw new Error(`Invalid base58 character: "${c}"`)
    }
    value = value * BASE + v
  }

  // Count leading '1' chars (which represent leading zero bytes).
  let leadingZeros = 0
  for (const c of cleaned) {
    if (c === ALPHABET[0]) {
      leadingZeros += 1
    } else {
      break
    }
  }

  // Convert big integer back to bytes.
  const bytes = []
  if (value === ZERO) {
    // All characters were leading zeros.
  } else {
    while (value > ZERO) {
      bytes.unshift(Number(value & BigInt(0xff)))
      value = value >> BigInt(8)
    }
  }

  const result = new Uint8Array(leadingZeros + bytes.length)
  result.set(bytes, leadingZeros)
  return result
}

/**
 * Encode a UTF-8 string as standard Base58.
 */
export function encodeBase58String(str) {
  return encodeBase58(utf8ToBytes(String(str)))
}

/**
 * Decode a Base58 string back to a UTF-8 string.
 */
export function decodeBase58String(input) {
  return bytesToUtf8(decodeBase58(input))
}

/**
 * Returns true if the input contains only valid Base58 characters
 * (ignoring whitespace).
 */
export function isValidBase58(input) {
  if (!input) return false
  const cleaned = input.replace(/\s+/g, '')
  if (!cleaned) return false
  return [...cleaned].every((c) => CHAR_TO_VALUE.has(c))
}

/**
 * Encode bytes as Base58Check (payload + 4-byte double-SHA256 checksum).
 * If a version byte (number 0-255) is provided, it is prepended to the
 * payload before the checksum is computed.
 */
export async function encodeBase58Check(bytes, versionByte) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error('encodeBase58Check expects a Uint8Array')
  }

  let payload = bytes
  if (typeof versionByte === 'number') {
    payload = new Uint8Array(bytes.length + 1)
    payload[0] = versionByte & 0xff
    payload.set(bytes, 1)
  }

  const checksum = await base58checkChecksum(payload)
  const full = new Uint8Array(payload.length + checksum.length)
  full.set(payload)
  full.set(checksum, payload.length)

  return encodeBase58(full)
}

/**
 * Decode a Base58Check string. Returns an object with:
 *   - payload: the payload bytes (without version byte and checksum)
 *   - versionByte: the version byte if one was expected, otherwise null
 *   - checksumValid: whether the embedded checksum matches the payload
 * You can pass a known version byte to validate Bitcoin-style addresses.
 */
export async function decodeBase58Check(input, expectedVersionByte) {
  const bytes = decodeBase58(input)
  if (bytes.length < 4) {
    throw new Error('Base58Check input is too short')
  }

  const payload = bytes.slice(0, bytes.length - 4)
  const checksum = bytes.slice(bytes.length - 4)
  const computed = await base58checkChecksum(payload)
  const checksumValid = checksum.every((b, i) => b === computed[i])

  let versionByte = null
  let resultPayload = payload

  if (typeof expectedVersionByte === 'number') {
    if (payload.length < 1 || payload[0] !== (expectedVersionByte & 0xff)) {
      throw new Error(`Expected version byte ${expectedVersionByte}, got ${payload[0] ?? 'none'}`)
    }
    versionByte = payload[0]
    resultPayload = payload.slice(1)
  } else if (payload.length > 0) {
    // Best-effort: if the caller did not specify a version byte, still
    // expose the first byte separately for inspection.
    versionByte = payload[0]
    resultPayload = payload.slice(1)
  }

  return {
    payload: resultPayload,
    fullPayload: payload,
    versionByte,
    checksum,
    checksumValid,
  }
}

/**
 * Encode a UTF-8 string as Base58Check with an optional version byte.
 */
export async function encodeBase58CheckString(str, versionByte) {
  return encodeBase58Check(utf8ToBytes(String(str)), versionByte)
}

/**
 * Decode a Base58Check string back to a UTF-8 string.
 */
export async function decodeBase58CheckString(input, expectedVersionByte) {
  const result = await decodeBase58Check(input, expectedVersionByte)
  return {
    ...result,
    text: bytesToUtf8(result.payload),
  }
}

/**
 * Simple byte/char statistics for the page UI.
 */
export function base58Stats(input) {
  const bytes = utf8ToBytes(String(input))
  return {
    chars: input.length,
    bytes: bytes.length,
    bits: bytes.length * 8,
  }
}
