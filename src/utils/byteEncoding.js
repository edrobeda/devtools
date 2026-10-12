/**
 * Shared byte/string conversion helpers used by the Base32, Base58 and
 * Base85 utilities — 100% client-side.
 *
 * These are the generic pieces (UTF-8 <-> bytes, hex <-> bytes and the
 * char/byte/bit stats shown in the UI) that were previously copy-pasted
 * byte-for-byte into each encoding util. Encoding-specific logic stays in
 * its own util.
 *
 * Note: hexDump.js and protobuf.js have richer hex parsers (they accept
 * xxd-style dumps with offsets) and intentionally do not reuse these.
 */

export function utf8ToBytes(str) {
  return new TextEncoder().encode(str)
}

export function bytesToUtf8(bytes) {
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
 * Simple byte/char statistics for the page UI.
 */
export function byteStats(input) {
  const bytes = utf8ToBytes(String(input))
  return {
    chars: input.length,
    bytes: bytes.length,
    bits: bytes.length * 8,
  }
}
