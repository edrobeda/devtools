// Gera pares de chaves assimétricas (RSA e EC) 100% no navegador usando a
// Web Crypto API. As chaves nunca saem do ambiente local: a geração, a
// exportação e a conversão para PEM acontecem inteiramente via
// crypto.subtle.

export const KEY_PRESETS = {
  rsa2048: {
    label: 'RSA 2048 (RS256)',
    algorithm: {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    usages: ['sign', 'verify'],
  },
  rsa3072: {
    label: 'RSA 3072 (RS256)',
    algorithm: {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    usages: ['sign', 'verify'],
  },
  rsa4096: {
    label: 'RSA 4096 (RS256)',
    algorithm: {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    usages: ['sign', 'verify'],
  },
  ecP256: {
    label: 'EC P-256 (ES256)',
    algorithm: {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    usages: ['sign', 'verify'],
  },
  ecP384: {
    label: 'EC P-384 (ES384)',
    algorithm: {
      name: 'ECDSA',
      namedCurve: 'P-384',
    },
    usages: ['sign', 'verify'],
  },
  ecP521: {
    label: 'EC P-521 (ES512)',
    algorithm: {
      name: 'ECDSA',
      namedCurve: 'P-521',
    },
    usages: ['sign', 'verify'],
  },
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function toPem(buffer, type) {
  const base64 = arrayBufferToBase64(buffer)
  const lines = base64.match(/.{1,64}/g).join('\n')
  return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function computeFingerprint(publicKey) {
  const spki = await crypto.subtle.exportKey('spki', publicKey)
  const digest = await crypto.subtle.digest('SHA-256', spki)
  return bufferToHex(digest).replace(/(.{2})(?=.)/g, '$1:').toUpperCase()
}

export function isCryptoSupported() {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

export async function generateAsymmetricKeyPair(presetKey) {
  if (!isCryptoSupported()) {
    throw new Error('Web Crypto API não está disponível neste contexto.')
  }

  const preset = KEY_PRESETS[presetKey]
  if (!preset) {
    throw new Error(`Algoritmo desconhecido: ${presetKey}`)
  }

  const keyPair = await crypto.subtle.generateKey(preset.algorithm, true, preset.usages)

  const [publicSpki, privatePkcs8, publicJwk, privateJwk] = await Promise.all([
    crypto.subtle.exportKey('spki', keyPair.publicKey),
    crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
    crypto.subtle.exportKey('jwk', keyPair.publicKey),
    crypto.subtle.exportKey('jwk', keyPair.privateKey),
  ])

  const fingerprint = await computeFingerprint(keyPair.publicKey)

  return {
    algorithm: preset.label,
    publicPem: toPem(publicSpki, 'PUBLIC KEY'),
    privatePem: toPem(privatePkcs8, 'PRIVATE KEY'),
    publicJwk,
    privateJwk,
    fingerprint,
  }
}

export function formatJwk(jwk) {
  return JSON.stringify(jwk, null, 2)
}
