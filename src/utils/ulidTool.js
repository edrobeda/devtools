// ULID (Universally Unique Lexicographically Sortable Identifier) — spec
// from https://github.com/ulid/spec. 100% client-side: uses crypto.getRandomValues
// for the random component and BigInt for the 128-bit arithmetic. No data
// leaves the browser.

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const CROCKFORD_MAP = Object.fromEntries([...CROCKFORD].map((c, i) => [c, BigInt(i)]))

const MASK_80 = (1n << 80n) - 1n
const MASK_128 = (1n << 128n) - 1n
const MAX_TIMESTAMP = (1n << 48n) - 1n
const ULID_LENGTH = 26

/**
 * Encode a non-negative BigInt as a Crockford base32 string with a fixed
 * number of characters, left-padded with '0' when needed.
 */
function encodeBase32(value, length = ULID_LENGTH) {
  if (value < 0n) throw new Error('Value cannot be negative')
  let chars = ''
  let remaining = value
  while (remaining > 0n) {
    chars = CROCKFORD[Number(remaining % 32n)] + chars
    remaining = remaining / 32n
  }
  return chars.padStart(length, '0')
}

/**
 * Decode a Crockford base32 string into a BigInt.
 */
function decodeBase32(str) {
  let value = 0n
  for (const char of str) {
    const mapped = CROCKFORD_MAP[char]
    if (mapped === undefined) {
      throw new Error(`Invalid ULID character: ${char}`)
    }
    value = value * 32n + mapped
  }
  return value
}

/**
 * Generate 80 random bits as a BigInt using the Web Crypto API.
 */
function random80Bits() {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  let value = 0n
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte)
  }
  return value & MASK_80
}

/**
 * Build a 16-byte big-endian Uint8Array from a 128-bit BigInt.
 */
function toBytes(value) {
  const hex = value.toString(16).padStart(32, '0')
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Build a 128-bit BigInt from a 16-byte big-endian buffer.
 */
function fromBytes(bytes) {
  let value = 0n
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte)
  }
  return value
}

/**
 * Convert a canonical UUID string (8-4-4-4-12) into a 128-bit BigInt.
 */
function uuidToBigInt(uuid) {
  const cleaned = uuid.replace(/-/g, '')
  if (!/^[0-9a-fA-F]{32}$/.test(cleaned)) {
    throw new Error('Invalid UUID format')
  }
  return BigInt('0x' + cleaned)
}

/**
 * Convert a 128-bit BigInt into canonical UUID string format.
 */
function bigIntToUuid(value) {
  const hex = value.toString(16).padStart(32, '0').toLowerCase()
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Validate whether a string is a syntactically correct ULID.
 */
export function isValidUlid(value) {
  if (!value || typeof value !== 'string') return false
  const upper = value.toUpperCase()
  if (upper.length !== ULID_LENGTH) return false
  try {
    decodeBase32(upper)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a single ULID from an optional timestamp and random component.
 *
 * @param {number} [timestampMs] — Unix epoch in milliseconds (default Date.now())
 * @param {bigint} [random] — 80-bit random component (default crypto random)
 * @returns {string} 26-character ULID
 */
export function generateUlid(timestampMs = Date.now(), random) {
  const timestamp = BigInt(timestampMs) & MAX_TIMESTAMP
  const randomPart = random === undefined ? random80Bits() : random & MASK_80
  const value = ((timestamp << 80n) | randomPart) & MASK_128
  return encodeBase32(value)
}

/**
 * Generate a batch of ULIDs.
 *
 * @param {number} count — how many ULIDs to generate
 * @param {object} options
 * @param {number} [options.timestampMs] — fixed timestamp (default Date.now())
 * @param {boolean} [options.monotonic] — keep same timestamp and increment
 *   the random component for each ULID, guaranteeing lexicographic sort order
 *   even when generated in the same millisecond
 * @returns {string[]}
 */
export function generateUlids(count, options = {}) {
  const { timestampMs = Date.now(), monotonic = false } = options
  const timestamp = BigInt(timestampMs) & MAX_TIMESTAMP
  const result = []

  let currentTimestamp = timestamp
  let currentRandom = random80Bits()

  for (let i = 0; i < count; i++) {
    result.push(encodeBase32(((currentTimestamp << 80n) | currentRandom) & MASK_128))

    if (monotonic) {
      currentRandom = (currentRandom + 1n) & MASK_80
      // If the 80-bit random space overflows, bump the timestamp and reset.
      if (currentRandom === 0n) {
        currentTimestamp = (currentTimestamp + 1n) & MAX_TIMESTAMP
        currentRandom = random80Bits()
      }
    } else {
      currentRandom = random80Bits()
      currentTimestamp = timestamp
    }
  }

  return result
}

/**
 * Parse a ULID into its timestamp and random components.
 *
 * @returns {object} { valid, timestampMs, random, uuid, error }
 */
export function parseUlid(ulid) {
  if (!ulid || typeof ulid !== 'string') {
    return { valid: false, error: 'Missing ULID' }
  }
  const upper = ulid.toUpperCase().trim()
  if (upper.length !== ULID_LENGTH) {
    return { valid: false, error: `ULID must have exactly ${ULID_LENGTH} characters` }
  }

  let value
  try {
    value = decodeBase32(upper)
  } catch (err) {
    return { valid: false, error: err.message }
  }

  const timestampMs = Number(value >> 80n)
  const random = value & MASK_80
  return {
    valid: true,
    timestampMs,
    random,
    uuid: bigIntToUuid(value),
    value,
  }
}

/**
 * Convert a ULID into its equivalent UUID (both represent the same 128 bits).
 */
export function ulidToUuid(ulid) {
  const parsed = parseUlid(ulid)
  if (!parsed.valid) throw new Error(parsed.error)
  return parsed.uuid
}

/**
 * Convert a UUID into its equivalent ULID.
 */
export function uuidToUlid(uuid) {
  const value = uuidToBigInt(uuid) & MASK_128
  return encodeBase32(value)
}

/**
 * Format a millisecond timestamp into a human-readable string.
 */
export function formatUlidTimestamp(timestampMs, locale = 'pt-BR') {
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
 * Export the alphabet and core helpers for tests / UI.
 */
export { CROCKFORD, MASK_80, MASK_128, MAX_TIMESTAMP }
