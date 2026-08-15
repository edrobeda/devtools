/**
 * Gerador de PKCE (Proof Key for Code Exchange) para fluxos OAuth2.
 * 100% client-side: usa crypto.getRandomValues para aleatoriedade e
 * crypto.subtle.digest para o SHA-256 do code_challenge.
 *
 * Especificação: RFC 7636
 */

function getCrypto() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto
  if (typeof window !== 'undefined' && window.crypto) return window.crypto
  return null
}

function getSubtle() {
  const c = getCrypto()
  return c ? c.subtle : null
}

export function isCryptoSupported() {
  return !!getSubtle()
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateRandomString(length) {
  const crypto = getCrypto()
  if (!crypto) throw new Error('Crypto API not available')
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('Length must be a positive integer')
  }
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bufferToBase64Url(bytes).slice(0, length)
}

export function generateCodeVerifier(length = 128) {
  if (!Number.isInteger(length) || length < 43 || length > 128) {
    throw new Error('code_verifier length must be an integer between 43 and 128')
  }
  return generateRandomString(length)
}

export async function generateCodeChallenge(verifier, method = 'S256') {
  if (method === 'plain') return verifier
  if (method !== 'S256') throw new Error('Unsupported code challenge method: use S256 or plain')
  const subtle = getSubtle()
  if (!subtle) throw new Error('Web Crypto API not available')
  const data = new TextEncoder().encode(verifier)
  const hash = await subtle.digest('SHA-256', data)
  return bufferToBase64Url(hash)
}

export function generateState(length = 32) {
  return generateRandomString(length)
}

export function generateNonce(length = 32) {
  return generateRandomString(length)
}

export function buildAuthorizationUrl(endpoint, params) {
  const url = new URL(endpoint)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

export const PKCE_METHODS = ['S256', 'plain']
export const DEFAULT_VERIFIER_LENGTH = 128

export const SOURCE_CODE = `function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=+$/, '')
}

function generateRandomString(length) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bufferToBase64Url(bytes).slice(0, length)
}

export function generateCodeVerifier(length = 128) {
  return generateRandomString(length)
}

export async function generateCodeChallenge(verifier, method = 'S256') {
  if (method === 'plain') return verifier
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return bufferToBase64Url(hash)
}`
