// Validador de assinaturas de webhook via HMAC.
// 100% client-side: tudo é calculado com crypto.subtle no navegador.
// Suporta Stripe (Stripe-Signature), GitHub (X-Hub-Signature-256),
// Shopify (X-Shopify-Hmac-Sha256) e um modo genérico configurável.

const ALGORITHMS = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-384': 'SHA-384',
  'SHA-512': 'SHA-512',
}

export const PROVIDERS = {
  stripe: {
    key: 'stripe',
    name: 'Stripe',
    header: 'Stripe-Signature',
    algorithm: 'SHA-256',
    payloadFormat: 'timestamp.payload',
    signatureKey: 'v1',
    signatureSeparator: ',',
    keyValueSeparator: '=',
    timestampKey: 't',
    timestampTolerance: 300,
    signaturePrefix: '',
  },
  github: {
    key: 'github',
    name: 'GitHub',
    header: 'X-Hub-Signature-256',
    algorithm: 'SHA-256',
    payloadFormat: 'raw',
    signaturePrefix: 'sha256=',
  },
  shopify: {
    key: 'shopify',
    name: 'Shopify',
    header: 'X-Shopify-Hmac-Sha256',
    algorithm: 'SHA-256',
    payloadFormat: 'raw',
    signaturePrefix: '',
  },
  generic: {
    key: 'generic',
    name: 'Generic',
    header: 'X-Signature',
    algorithm: 'SHA-256',
    payloadFormat: 'raw',
    signaturePrefix: '',
  },
}

function encodeText(text) {
  return new TextEncoder().encode(text)
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function computeHmac(secret, message, algorithm = 'SHA-256') {
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API não está disponível neste contexto.')
  }
  const key = await crypto.subtle.importKey(
    'raw',
    encodeText(secret),
    { name: 'HMAC', hash: ALGORITHMS[algorithm] || algorithm },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encodeText(message))
  return bufferToHex(signature)
}

function parseStripeHeader(value) {
  const parts = value.split(',').reduce((acc, part) => {
    const [k, v] = part.trim().split('=')
    if (k && v) acc[k.trim()] = v.trim()
    return acc
  }, {})

  const timestamp = parts[PROVIDERS.stripe.timestampKey]
  const signature = parts[PROVIDERS.stripe.signatureKey]
  return { timestamp, signature }
}

function parseSignature(provider, signatureHeader) {
  const config = typeof provider === 'string' ? PROVIDERS[provider] : provider
  const raw = String(signatureHeader || '').trim()

  if (config.key === 'stripe') {
    return parseStripeHeader(raw)
  }

  let signature = raw
  if (config.signaturePrefix && signature.startsWith(config.signaturePrefix)) {
    signature = signature.slice(config.signaturePrefix.length)
  }
  return { signature }
}

function buildSignedPayload(provider, payload, timestamp) {
  const config = typeof provider === 'string' ? PROVIDERS[provider] : provider
  if (config.payloadFormat === 'timestamp.payload') {
    return `${timestamp}.${payload}`
  }
  return payload
}

export async function verifyWebhookSignature({
  provider,
  payload,
  secret,
  signatureHeader,
}) {
  const config = typeof provider === 'string' ? PROVIDERS[provider] : provider
  if (!config) {
    return { valid: false, reason: 'providerNotFound', computedSignature: '' }
  }

  if (!payload || !secret || !signatureHeader) {
    return { valid: false, reason: 'missingFields', computedSignature: '' }
  }

  try {
    const { signature, timestamp } = parseSignature(config, signatureHeader)

    if (!signature) {
      return { valid: false, reason: 'signatureNotFound', computedSignature: '' }
    }

    const signedPayload = buildSignedPayload(config, payload, timestamp)
    const computedSignature = await computeHmac(secret, signedPayload, config.algorithm)

    if (!constantTimeEquals(computedSignature, signature.toLowerCase())) {
      return {
        valid: false,
        reason: 'signatureMismatch',
        computedSignature,
        timestamp,
      }
    }

    if (config.timestampTolerance && timestamp) {
      const now = Math.floor(Date.now() / 1000)
      const ts = Number.parseInt(timestamp, 10)
      if (!Number.isNaN(ts) && Math.abs(now - ts) > config.timestampTolerance) {
        return {
          valid: false,
          reason: 'timestampToleranceExceeded',
          computedSignature,
          timestamp,
        }
      }
    }

    return { valid: true, reason: 'valid', computedSignature, timestamp }
  } catch (err) {
    return { valid: false, reason: 'error', computedSignature: '', error: err.message }
  }
}

export async function generateExample(providerKey) {
  const config = PROVIDERS[providerKey]
  const secret = 'whsec_devtools_example_secret_32bytes!'
  const payload = JSON.stringify(
    {
      id: `evt_${Math.random().toString(36).slice(2, 10)}`,
      object: 'event',
      type: 'example.created',
      created_at: new Date().toISOString(),
    },
    null,
    2,
  )

  if (providerKey === 'stripe') {
    const timestamp = Math.floor(Date.now() / 1000)
    const signedPayload = `${timestamp}.${payload}`
    const signature = await computeHmac(secret, signedPayload, config.algorithm)
    const signatureHeader = `t=${timestamp},v1=${signature}`
    return { secret, payload, signatureHeader }
  }

  if (providerKey === 'github') {
    const signature = await computeHmac(secret, payload, config.algorithm)
    const signatureHeader = `sha256=${signature}`
    return { secret, payload, signatureHeader }
  }

  // shopify e generic
  const signature = await computeHmac(secret, payload, config.algorithm)
  const prefix = providerKey === 'generic' ? 'sha256=' : ''
  return { secret, payload, signatureHeader: `${prefix}${signature}` }
}

export const SOURCE = `
const ALGORITHMS = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-384': 'SHA-384',
  'SHA-512': 'SHA-512',
}

function encodeText(text) {
  return new TextEncoder().encode(text)
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function computeHmac(secret, message, algorithm = 'SHA-256') {
  const key = await crypto.subtle.importKey(
    'raw',
    encodeText(secret),
    { name: 'HMAC', hash: ALGORITHMS[algorithm] || algorithm },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encodeText(message))
  return bufferToHex(signature)
}

export async function verifyWebhookSignature({
  provider,
  payload,
  secret,
  signatureHeader,
}) {
  const config = PROVIDERS[provider]
  const { signature, timestamp } = parseSignature(config, signatureHeader)
  const signedPayload = config.payloadFormat === 'timestamp.payload'
    ? \`\${timestamp}.\${payload}\`
    : payload
  const computed = await computeHmac(secret, signedPayload, config.algorithm)
  return constantTimeEquals(computed, signature.toLowerCase())
}
`
