// UUID v7 (RFC 9562) — 100% client-side generator/decoder.
// Structure:
//   - 48 bits: Unix timestamp in milliseconds (big-endian)
//   -  4 bits: version = 0b0111 (7)
//   - 12 bits: rand_a
//   -  2 bits: variant = 0b10
//   - 62 bits: rand_b
// Uses crypto.getRandomValues for the random component. No data leaves the browser.

const UUID_V7_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const UUID_HEX_RE = /^[0-9a-fA-F]{32}$/

/**
 * Format a 16-byte buffer as a canonical UUID string (8-4-4-4-12).
 */
function formatUuid(bytes) {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Parse a UUID string (with or without dashes) into a 16-byte buffer.
 */
function parseUuid(uuid) {
  const cleaned = uuid.replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(cleaned)) {
    throw new Error('Invalid UUID format')
  }
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Generate a single UUID v7.
 *
 * @param {number} [timestampMs] — Unix epoch in milliseconds (default Date.now())
 * @returns {string} canonical UUID v7
 */
export function generateUuidV7(timestampMs = Date.now()) {
  const now = Math.max(0, Math.floor(timestampMs))
  const rand = crypto.getRandomValues(new Uint8Array(10))
  const bytes = new Uint8Array(16)

  bytes[0] = (now >> 40) & 0xff
  bytes[1] = (now >> 32) & 0xff
  bytes[2] = (now >> 24) & 0xff
  bytes[3] = (now >> 16) & 0xff
  bytes[4] = (now >> 8) & 0xff
  bytes[5] = now & 0xff

  bytes[6] = (rand[0] & 0x0f) | 0x70 // version 7
  bytes[7] = rand[1]
  bytes[8] = (rand[2] & 0x3f) | 0x80 // variant 10
  bytes[9] = rand[3]
  bytes[10] = rand[4]
  bytes[11] = rand[5]
  bytes[12] = rand[6]
  bytes[13] = rand[7]
  bytes[14] = rand[8]
  bytes[15] = rand[9]

  return formatUuid(bytes)
}

/**
 * Generate a batch of UUID v7 identifiers.
 *
 * @param {number} count — how many UUIDs to generate (max 1000)
 * @param {object} options
 * @param {boolean} [options.monotonic] — ensure sort order within the same millisecond
 *   by incrementing the random component; defaults to false
 * @returns {string[]}
 */
export function generateUuidV7Batch(count, options = {}) {
  const { monotonic = false } = options
  const n = Math.min(1000, Math.max(1, Math.floor(Number(count) || 1)))
  const result = []
  const now = Date.now()
  const rand = crypto.getRandomValues(new Uint8Array(10))
  let current = rand.slice()

  for (let i = 0; i < n; i++) {
    result.push(buildUuidV7(now, current))

    if (monotonic) {
      // Increment 74-bit random component as a big-endian integer.
      for (let j = 9; j >= 0; j--) {
        if (j === 2) {
          // preserve variant bits in byte 8 (index 2 maps there)
          const masked = current[j] & 0x3f
          const next = masked + 1
          current[j] = (next & 0x3f) | 0x80
          if ((next & 0x40) === 0) break // no overflow
        } else if (j === 0) {
          // preserve version bits in byte 6 (index 0 maps there)
          const masked = current[j] & 0x0f
          const next = masked + 1
          current[j] = (next & 0x0f) | 0x70
          if ((next & 0x10) === 0) break // no overflow
        } else {
          current[j] = (current[j] + 1) & 0xff
          if (current[j] !== 0) break // no overflow
        }
      }
    } else {
      crypto.getRandomValues(current)
    }
  }

  return result
}

function buildUuidV7(timestampMs, rand10) {
  const now = Math.max(0, Math.floor(timestampMs))
  const bytes = new Uint8Array(16)

  bytes[0] = (now >> 40) & 0xff
  bytes[1] = (now >> 32) & 0xff
  bytes[2] = (now >> 24) & 0xff
  bytes[3] = (now >> 16) & 0xff
  bytes[4] = (now >> 8) & 0xff
  bytes[5] = now & 0xff

  bytes[6] = (rand10[0] & 0x0f) | 0x70
  bytes[7] = rand10[1]
  bytes[8] = (rand10[2] & 0x3f) | 0x80
  bytes[9] = rand10[3]
  bytes[10] = rand10[4]
  bytes[11] = rand10[5]
  bytes[12] = rand10[6]
  bytes[13] = rand10[7]
  bytes[14] = rand10[8]
  bytes[15] = rand10[9]

  return formatUuid(bytes)
}

/**
 * Validate whether a string is a syntactically correct UUID (any version).
 */
export function isValidUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return false
  return UUID_RE.test(uuid)
}

/**
 * Validate whether a string is a syntactically correct UUID v7.
 */
export function isValidUuidV7(uuid) {
  if (!uuid || typeof uuid !== 'string') return false
  return UUID_V7_RE.test(uuid)
}

/**
 * Decode a UUID v7 into its components.
 *
 * @returns {object} { valid, version, variant, timestampMs, date, randA, randB, bytes, error }
 */
export function decodeUuidV7(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'Missing UUID' }
  }

  let bytes
  try {
    bytes = parseUuid(uuid)
  } catch (err) {
    return { valid: false, error: err.message }
  }

  const version = (bytes[6] >> 4) & 0x0f
  const variant = (bytes[8] >> 6) & 0x03

  if (version !== 7) {
    return { valid: false, error: `Expected UUID version 7, got ${version}` }
  }
  if (variant !== 2) {
    return { valid: false, error: `Expected variant 10 (2), got ${variant}` }
  }

  const timestampMs =
    (BigInt(bytes[0]) << 40n) |
    (BigInt(bytes[1]) << 32n) |
    (BigInt(bytes[2]) << 24n) |
    (BigInt(bytes[3]) << 16n) |
    (BigInt(bytes[4]) << 8n) |
    BigInt(bytes[5])

  const randA = ((bytes[6] & 0x0f) << 8) | bytes[7]
  const randB =
    (BigInt(bytes[8] & 0x3f) << 56n) |
    (BigInt(bytes[9]) << 48n) |
    (BigInt(bytes[10]) << 40n) |
    (BigInt(bytes[11]) << 32n) |
    (BigInt(bytes[12]) << 24n) |
    (BigInt(bytes[13]) << 16n) |
    (BigInt(bytes[14]) << 8n) |
    BigInt(bytes[15])

  return {
    valid: true,
    version,
    variant,
    timestampMs: Number(timestampMs),
    date: new Date(Number(timestampMs)),
    randA,
    randB,
    bytes,
  }
}

/**
 * Format a millisecond timestamp into a human-readable object.
 */
export function formatUuidV7Timestamp(timestampMs, locale = 'pt-BR') {
  const date = new Date(timestampMs)
  return {
    iso: date.toISOString(),
    local: new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date),
    relativeMs: timestampMs,
  }
}

/**
 * Accept a UUID with or without dashes and normalize it.
 */
export function normalizeUuid(uuid) {
  const cleaned = uuid.replace(/-/g, '').toLowerCase()
  if (!UUID_HEX_RE.test(cleaned)) return null
  return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20, 32)}`
}
