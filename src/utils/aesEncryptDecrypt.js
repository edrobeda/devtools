/**
 * Criptografia / descriptografia AES 100% client-side com a Web Crypto API.
 *
 * A chave é derivada de uma senha via PBKDF2-HMAC-SHA256 com salt aleatório.
 * Suporta AES-GCM (IV de 12 bytes) e AES-CBC (IV de 16 bytes) em três
 * tamanhos de chave: 128, 192 e 256 bits. Nenhum dado sai do navegador.
 */

export const AES_ALGORITHMS = [
  'AES-GCM-256',
  'AES-GCM-192',
  'AES-GCM-128',
  'AES-CBC-256',
  'AES-CBC-192',
  'AES-CBC-128',
]

export const KEY_SIZES = [128, 192, 256]
export const DEFAULT_ITERATIONS = 100_000
export const SALT_BYTES = 16

const enc = new TextEncoder()
const dec = new TextDecoder()

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return typeof window !== 'undefined' && window.btoa
    ? window.btoa(binary)
    : Buffer.from(buffer).toString('base64')
}

function base64ToBuffer(base64) {
  const normalized = base64.replace(/\s/g, '')
  const binary = typeof window !== 'undefined' && window.atob
    ? window.atob(normalized)
    : Buffer.from(normalized, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function parseAlgorithmOption(option) {
  const parts = option.split('-')
  const size = parseInt(parts[parts.length - 1], 10)
  const mode = parts.slice(0, parts.length - 1).join('-')
  if (!['AES-GCM', 'AES-CBC'].includes(mode)) {
    throw new Error(`Algoritmo AES não suportado: ${option}`)
  }
  if (!KEY_SIZES.includes(size)) {
    throw new Error(`Tamanho de chave inválido: ${size}`)
  }
  return { mode, size }
}

export function isCryptoSupported() {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  )
}

async function deriveKey(password, salt, mode, keySize, iterations = DEFAULT_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: mode, length: keySize },
    false,
    ['encrypt', 'decrypt']
  )
}

function buildAlgorithm(mode, iv) {
  if (mode === 'AES-GCM') {
    return { name: 'AES-GCM', iv, tagLength: 128 }
  }
  if (mode === 'AES-CBC') {
    return { name: 'AES-CBC', iv }
  }
  throw new Error(`Modo não suportado: ${mode}`)
}

export async function encryptAES({
  algorithm = 'AES-GCM-256',
  password,
  plaintext,
  iterations = DEFAULT_ITERATIONS,
} = {}) {
  if (!isCryptoSupported()) {
    throw new Error('Web Crypto API não está disponível neste contexto.')
  }
  if (!password) throw new Error('Informe uma senha para derivar a chave.')
  if (typeof plaintext !== 'string') throw new Error('O texto plano deve ser uma string.')

  const { mode, size } = parseAlgorithmOption(algorithm)
  const ivLength = mode === 'AES-GCM' ? 12 : 16

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(ivLength))
  const key = await deriveKey(password, salt, mode, size, iterations)
  const cipherBuffer = await crypto.subtle.encrypt(
    buildAlgorithm(mode, iv),
    key,
    enc.encode(plaintext)
  )

  const saltB64 = bufferToBase64(salt)
  const ivB64 = bufferToBase64(iv)
  const cipherB64 = bufferToBase64(cipherBuffer)

  return {
    algorithm: mode,
    keySize: size,
    iterations,
    salt: saltB64,
    iv: ivB64,
    ciphertext: cipherB64,
    payload: `${mode}:${size}:${iterations}:${saltB64}:${ivB64}:${cipherB64}`,
  }
}

export async function decryptAES({ payload, password } = {}) {
  if (!isCryptoSupported()) {
    throw new Error('Web Crypto API não está disponível neste contexto.')
  }
  if (!payload || !password) throw new Error('Informe o payload cifrado e a senha.')

  const parts = payload.split(':')
  if (parts.length !== 6) {
    throw new Error('Formato de payload inválido. Esperado: modo:tamanho:iterações:salt:iv:ciphertext.')
  }

  const [mode, sizeStr, iterationsStr, saltB64, ivB64, cipherB64] = parts
  const size = parseInt(sizeStr, 10)
  const iterations = parseInt(iterationsStr, 10)

  if (!['AES-GCM', 'AES-CBC'].includes(mode)) {
    throw new Error(`Modo não suportado: ${mode}`)
  }
  if (!Number.isFinite(iterations) || iterations < 1) {
    throw new Error('Número de iterações inválido.')
  }

  const salt = base64ToBuffer(saltB64)
  const iv = base64ToBuffer(ivB64)
  const ciphertext = base64ToBuffer(cipherB64)

  const key = await deriveKey(password, salt, mode, size, iterations)
  const plainBuffer = await crypto.subtle.decrypt(
    buildAlgorithm(mode, iv),
    key,
    ciphertext
  )

  return dec.decode(plainBuffer)
}
