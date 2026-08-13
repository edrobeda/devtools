// TOTP (Time-based One-Time Password) generator — RFC 6238.
// 100% client-side: decodes the base32 secret and computes HMAC-SHA1 via
// Web Crypto. No data leaves the browser.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Normalise a base32 secret: remove spaces/dashes, uppercase.
 */
export function normalizeSecret(secret) {
  return secret.replace(/[\s-]/g, '').toUpperCase()
}

/**
 * Returns true if the string looks like a valid base32 secret.
 */
export function isValidBase32(secret) {
  if (!secret || typeof secret !== 'string') return false
  const cleaned = normalizeSecret(secret)
  if (cleaned.length === 0) return false
  return [...cleaned].every((c) => BASE32_ALPHABET.includes(c))
}

/**
 * Decode a base32 string into a Uint8Array.
 */
export function base32ToBytes(secret) {
  const cleaned = normalizeSecret(secret)
  if (!isValidBase32(cleaned)) {
    throw new Error('Invalid base32 secret')
  }

  let bits = ''
  for (const char of cleaned) {
    const value = BASE32_ALPHABET.indexOf(char)
    bits += value.toString(2).padStart(5, '0')
  }

  const bytes = []
  for (let i = 0; i < bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8)
    if (chunk.length < 8) break
    bytes.push(parseInt(chunk, 2))
  }

  return new Uint8Array(bytes)
}

/**
 * Encode a 64-bit unsigned integer as an 8-byte big-endian buffer.
 */
export function counterToBytes(counter) {
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setUint32(0, Math.floor(counter / 0x100000000), false)
  view.setUint32(4, counter & 0xffffffff, false)
  return new Uint8Array(buffer)
}

/**
 * Compute HMAC-SHA1 of `message` using `key` via crypto.subtle.
 */
async function hmacSha1(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message)
  return new Uint8Array(signature)
}

/**
 * Generate a TOTP code from a base32 secret.
 *
 * @param {string} secret — base32-encoded shared secret
 * @param {object} options
 * @param {number} options.digits — code length (default 6)
 * @param {number} options.step — time step in seconds (default 30)
 * @param {number} options.epoch — Unix epoch offset in seconds (default 0)
 * @returns {Promise<string>} zero-padded TOTP code
 */
export async function generateTotp(secret, options = {}) {
  const { digits = 6, step = 30, epoch = 0 } = options
  const key = base32ToBytes(secret)
  const nowSeconds = Math.floor(Date.now() / 1000)
  const counter = Math.floor((nowSeconds - epoch) / step)
  const message = counterToBytes(counter)
  const hmac = await hmacSha1(key, message)

  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const code = binary % Math.pow(10, digits)
  return String(code).padStart(digits, '0')
}

/**
 * Generate a TOTP code for an explicit counter (useful for tests / HOTP).
 */
export async function generateHotp(secret, counter, options = {}) {
  const { digits = 6 } = options
  const key = base32ToBytes(secret)
  const message = counterToBytes(counter)
  const hmac = await hmacSha1(key, message)

  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const code = binary % Math.pow(10, digits)
  return String(code).padStart(digits, '0')
}

/**
 * Build the current counter value for a given configuration.
 */
export function getCurrentCounter(step = 30, epoch = 0) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return Math.floor((nowSeconds - epoch) / step)
}

/**
 * Seconds remaining in the current time-step window.
 */
export function getRemainingSeconds(step = 30, epoch = 0) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return step - ((nowSeconds - epoch) % step)
}

/**
 * Build an otpauth:// URI that can be rendered as a QR code or imported
 * into an authenticator app.
 */
export function buildOtpauthUri(secret, account, issuer, options = {}) {
  const { digits = 6, step = 30 } = options
  const label = issuer ? `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}` : encodeURIComponent(account)
  const params = new URLSearchParams({
    secret: normalizeSecret(secret),
    issuer: issuer || '',
    algorithm: 'SHA1',
    digits: String(digits),
    period: String(step),
  })
  if (issuer) {
    params.set('issuer', issuer)
  } else {
    params.delete('issuer')
  }
  return `otpauth://totp/${label}?${params.toString()}`
}

/**
 * Returns both the current TOTP code and the seconds left in the window.
 */
export async function getTotpWithRemaining(secret, options = {}) {
  const { step = 30, epoch = 0 } = options
  const code = await generateTotp(secret, options)
  return { code, remaining: getRemainingSeconds(step, epoch) }
}
