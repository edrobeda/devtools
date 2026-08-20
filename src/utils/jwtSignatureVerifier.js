// Verificador de assinatura de JWT — 100% client-side via WebCrypto.
//
// Verifica a assinatura de um JWT (JWS compacto `header.payload.signature`)
// contra uma chave fornecida pelo usuário: PEM (SPKI "PUBLIC KEY" ou PKCS#8
// "PRIVATE KEY"), um JWK individual, um JWKS (`{ "keys": [...] }`) ou — para
// algoritmos HMAC — a chave secreta em texto puro. Suporta HS256/384/512,
// RS256/384/512, PS256/384/512, ES256/384/512 e EdDSA (Ed25519).
//
// Nada sai do navegador: a verificação roda com `crypto.subtle.verify`.

const SHA_BITS = { 256: 'SHA-256', 384: 'SHA-384', 512: 'SHA-512' }

const CURVE_BITS = { 'P-256': 256, 'P-384': 384, 'P-521': 521, Ed25519: 256, Ed448: 448 }

const B64URL_MISSING = /[{}\s=]/
const B64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export function bytesToB64url(bytes) {
  let result = ''
  const len = bytes.length
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < len ? bytes[i + 1] : 0
    const b3 = i + 2 < len ? bytes[i + 2] : 0
    result += B64URL_ALPHABET[b1 >> 2] + B64URL_ALPHABET[((b1 & 0x03) << 4) | (b2 >> 4)]
    result +=
      (i + 1 < len ? B64URL_ALPHABET[((b2 & 0x0f) << 2) | (b3 >> 6)] : '') +
      (i + 2 < len ? B64URL_ALPHABET[b3 & 0x3f] : '')
  }
  return result
}

export function b64urlToBytes(str) {
  let s = String(str == null ? '' : str).replace(/=+$/, '')
  if (B64URL_MISSING.test(s)) throw new Error('base64url inválido')
  const mod = s.length % 4
  if (mod === 1) throw new Error('base64url inválido')
  if (mod) s += '='.repeat(4 - mod)
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function utf8(text) {
  return new TextEncoder().encode(String(text))
}

function pemToDer(pem, label) {
  const re = new RegExp(`-----BEGIN ${label}-----([\\s\\S]*?)-----END ${label}-----`)
  const m = String(pem).match(re)
  if (!m) throw new Error('PEM inválido')
  const body = m[1].replace(/[\r\n\s]/g, '')
  if (!/^[A-Za-z0-9+/=]+$/.test(body)) throw new Error('PEM inválido')
  const bin = atob(body)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// Resolve o perfil do algoritmo a partir do `alg` do header do token.
// Retorna null para algs não suportados (ex.: 'none').
export function algConfig(alg) {
  if (!alg || typeof alg !== 'string') return null
  const bits = alg.slice(-3)
  if (!/^(HS|RS|PS|ES)/.test(alg) || !SHA_BITS[bits]) {
    if (alg === 'EdDSA') return { family: 'OKP', name: 'Ed25519', hash: null, saltLength: null }
    return null
  }
  const hash = SHA_BITS[bits]
  if (alg.startsWith('HS')) return { family: 'HMAC', name: 'HMAC', hash, saltLength: null }
  if (alg.startsWith('RS')) return { family: 'RSA', name: 'RSASSA-PKCS1-v1_5', hash, saltLength: null }
  if (alg.startsWith('PS')) return { family: 'RSA', name: 'RSA-PSS', hash, saltLength: parseInt(bits, 10) / 8 }
  if (alg.startsWith('ES')) {
    const curve = { 256: 'P-256', 384: 'P-384', 512: 'P-521' }[bits]
    return { family: 'EC', name: 'ECDSA', hash, saltLength: null, curve }
  }
  return null
}

function importAlgo(cfg, jwk) {
  if (cfg.family === 'HMAC') return { name: 'HMAC', hash: cfg.hash }
  if (cfg.family === 'RSA') return { name: cfg.name, hash: cfg.hash }
  if (cfg.family === 'EC') return { name: 'ECDSA', namedCurve: cfg.curve }
  return { name: 'Ed25519' }
}

function verifyAlgo(cfg) {
  if (cfg.family === 'HMAC') return { name: 'HMAC' }
  if (cfg.family === 'RSA' && cfg.name === 'RSA-PSS') return { name: 'RSA-PSS', saltLength: cfg.saltLength }
  if (cfg.family === 'RSA') return { name: 'RSASSA-PKCS1-v1_5' }
  if (cfg.family === 'EC') return { name: 'ECDSA', hash: cfg.hash }
  return { name: 'Ed25519' }
}

// Cria um JSON canônico para o thumbprint do JWK (RFC 7638): só os membros
// requeridos pelo tipo, em ordem ASCII, sem espaços.
function canonicalJwk(jwk) {
  const members = {
    RSA: ['e', 'kty', 'n'],
    EC: ['crv', 'kty', 'x', 'y'],
    OKP: ['crv', 'kty', 'x'],
    oct: ['k', 'kty'],
  }[jwk.kty]
  if (!members) return null
  const canon = {}
  const sorted = [...members].sort()
  for (const k of sorted) {
    if (jwk[k] == null) return null
    canon[k] = jwk[k]
  }
  return JSON.stringify(canon)
}

export async function jwkThumbprint(jwk) {
  const canon = canonicalJwk(jwk)
  if (!canon) return null
  const digest = await globalThis.crypto.subtle.digest('SHA-256', utf8(canon))
  return bytesToB64url(new Uint8Array(digest))
}

function jwkBits(jwk) {
  if (jwk.kty === 'RSA') {
    try {
      return b64urlToBytes(jwk.n).length * 8
    } catch {
      return 0
    }
  }
  if (jwk.kty === 'EC' || jwk.kty === 'OKP') return CURVE_BITS[jwk.crv] || 0
  if (jwk.kty === 'oct') {
    try {
      return b64urlToBytes(jwk.k).length * 8
    } catch {
      return 0
    }
  }
  return 0
}

// Importa uma chave JWK seguindo o algoritmo exigido pelo cabeçalho.
async function importJwk(cfg, jwk) {
  const algo = importAlgo(cfg, jwk)
  if (cfg.family === 'HMAC') {
    if (jwk.kty !== 'oct') return { error: 'key_algorithm_mismatch', detail: 'HMAC precisa de kty "oct"' }
    const raw = b64urlToBytes(jwk.k)
    const key = await globalThis.crypto.subtle.importKey('raw', raw, algo, false, ['verify'])
    return { key, jwk, from: 'jwk' }
  }
  if (cfg.family === 'RSA') {
    if (jwk.kty !== 'RSA') return { error: 'key_algorithm_mismatch', detail: 'RSA precisa de kty "RSA"' }
  } else if (cfg.family === 'EC') {
    if (jwk.kty !== 'EC') return { error: 'key_algorithm_mismatch', detail: 'ECDSA precisa de kty "EC"' }
  } else if (cfg.family === 'OKP') {
    if (jwk.kty !== 'OKP') return { error: 'key_algorithm_mismatch', detail: 'EdDSA precisa de kty "OKP"' }
  }
  const key = await globalThis.crypto.subtle.importKey('jwk', jwk, algo, false, ['verify'])
  return { key, jwk, from: 'jwk' }
}

// Tira os membros privados de um JWK (d, p, q, oth…) deixando só o público,
// pra reimportar como chave de verificação.
function stripPrivateJwkMembers(jwk) {
  const publicKeys = {
    RSA: ['kty', 'n', 'e'],
    EC: ['kty', 'crv', 'x', 'y'],
    OKP: ['kty', 'crv', 'x'],
  }[jwk.kty]
  if (!publicKeys) return jwk
  const out = {}
  for (const k of publicKeys) {
    if (jwk[k] != null) out[k] = jwk[k]
  }
  if (jwk.kid != null) out.kid = jwk.kid
  return out
}

export async function describeKey(jwk) {
  const thumb = await jwkThumbprint(jwk)
  return {
    kty: jwk.kty,
    kid: jwk.kid || null,
    bits: jwkBits(jwk),
    crv: jwk.crv || null,
    thumb,
  }
}

// Deriva os candidatos de chave a partir do texto de entrada (PEM / JWK /
// JWKS / segredo). Retorna { candidates } ou { error, detail }.
async function deriveCandidates(cfg, keyInput) {
  const input = String(keyInput == null ? '' : keyInput).trim()
  if (!input) return { error: 'empty_key' }

  if (input.startsWith('{') || input.startsWith('[')) {
    let parsed
    try {
      parsed = JSON.parse(input)
    } catch {
      return { error: 'invalid_jwk', detail: 'JSON não pôde ser interpretado' }
    }
    const list = Array.isArray(parsed) ? parsed : parsed.keys ? parsed.keys : [parsed]
    if (!list.length) return { error: 'invalid_jwk', detail: 'sem chaves no JWKS' }
    const candidates = []
    for (let i = 0; i < list.length; i++) {
      const jwk = list[i]
      if (!jwk || typeof jwk !== 'object' || !jwk.kty) {
        candidates.push({ error: 'invalid_jwk', detail: `chave #${i + 1} não é um JWK válido`, index: i })
        continue
      }
      const res = await importJwk(cfg, jwk)
      if (res.error) {
        candidates.push({ error: res.error, detail: res.detail, index: i })
        continue
      }
      candidates.push({ key: res.key, jwk: res.jwk, index: i, label: jwk.kid ? `kid "${jwk.kid}"` : `chave #${i + 1}` })
    }
    return { candidates }
  }

  const pemLabel = input.includes('-----BEGIN PUBLIC KEY-----')
    ? 'PUBLIC KEY'
    : input.includes('-----BEGIN PRIVATE KEY-----')
      ? 'PRIVATE KEY'
      : input.includes('-----BEGIN RSA PRIVATE KEY-----') || input.includes('-----BEGIN EC PRIVATE KEY-----')
        ? 'LEGACY'
        : null

  if (pemLabel === 'LEGACY') {
    return { error: 'unsupported_pem', detail: 'use o formato PKCS#8 ("BEGIN PRIVATE KEY") ou "BEGIN PUBLIC KEY"' }
  }
  if (pemLabel) {
    if (cfg.family === 'HMAC') {
      return { error: 'key_algorithm_mismatch', detail: 'HMAC não usa chaves PEM — cole o segredo em texto puro' }
    }
    try {
      const der = pemToDer(input, pemLabel)
      const algo = importAlgo(cfg)
      let key
      if (pemLabel === 'PRIVATE KEY') {
        const priv = await globalThis.crypto.subtle.importKey('pkcs8', der, algo, true, ['sign'])
        const privJwk = await globalThis.crypto.subtle.exportKey('jwk', priv)
        // Descarta os membros privados e importa só a parte pública (verify).
        const pubJwk = stripPrivateJwkMembers(privJwk)
        key = await globalThis.crypto.subtle.importKey('jwk', pubJwk, algo, true, ['verify'])
        return { candidates: [{ key, jwk: pubJwk, label: 'chave privada (PKCS#8)' }] }
      }
      if (cfg.family === 'EC') {
        key = await globalThis.crypto.subtle.importKey('spki', der, { name: 'ECDSA', namedCurve: cfg.curve }, true, ['verify'])
      } else if (cfg.family === 'OKP') {
        key = await globalThis.crypto.subtle.importKey('spki', der, { name: 'Ed25519' }, true, ['verify'])
      } else {
        key = await globalThis.crypto.subtle.importKey('spki', der, algo, true, ['verify'])
      }
      const jwk = await globalThis.crypto.subtle.exportKey('jwk', key)
      return { candidates: [{ key, jwk, label: 'chave pública (SPKI)' }] }
    } catch (e) {
      if (e && e.name === 'DataError') {
        return { error: 'key_algorithm_mismatch', detail: 'o tipo de chave não bate com o algoritmo do token' }
      }
      return { error: 'invalid_key', detail: String((e && e.message) || e) }
    }
  }

  // Tudo mais é tratado como segredo (HMAC).
  if (cfg.family !== 'HMAC') {
    return { error: 'key_algorithm_mismatch', detail: `${cfg.name} precisa de uma chave pública (PEM/JWK)` }
  }
  const raw = utf8(input)
  const key = await globalThis.crypto.subtle.importKey(
    'raw', raw, { name: 'HMAC', hash: cfg.hash }, false, ['verify']
  )
  return { candidates: [{ key, label: 'segredo (texto puro)', secretBytes: raw.length }] }
}

export function parseToken(token) {
  const text = String(token == null ? '' : token).trim()
  if (!text) return { ok: false, error: 'empty_token' }
  const parts = text.split('.')
  if (parts.length !== 3) return { ok: false, error: 'invalid_token', detail: `esperava 3 segmentos, encontrei ${parts.length}` }
  const [h, p, s] = parts
  let header = null
  let payload = null
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)))
  } catch {
    return { ok: false, error: 'invalid_token', detail: 'header não é um JSON válido (base64url)' }
  }
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)))
  } catch {
    return { ok: false, error: 'invalid_token', detail: 'payload não é um JSON válido (base64url)' }
  }
  return { ok: true, parts, header, payload, payloadRaw: new TextDecoder().decode(b64urlToBytes(p)), signatureB64: s }
}

// Verifica a assinatura do token contra a chave. Nunca lança: retorna
// { ok, verified, error, detail, ... }.
export async function verifyJwtSignature(token, keyInput) {
  const parsed = parseToken(token)
  if (!parsed.ok) return { ok: false, verified: false, error: parsed.error, detail: parsed.detail }
  if (parsed.header.alg === 'none') return { ok: false, verified: false, error: 'alg_none', detail: 'tokens com alg "none" não têm assinatura' }

  const cfg = algConfig(parsed.header.alg)
  if (!cfg) return { ok: false, verified: false, error: 'unsupported_alg', detail: parsed.header.alg }

  const sigBytes = b64urlToBytes(parsed.parts[2])
  const dataBytes = utf8(`${parsed.parts[0]}.${parsed.parts[1]}`)

  const derived = await deriveCandidates(cfg, keyInput)
  if (derived.error) return { ok: false, verified: false, error: derived.error, detail: derived.detail }

  const algo = verifyAlgo(cfg)
  let lastErr = 'signature_invalid'
  let lastDetail = null
  let verifiedKey = null
  for (const cand of derived.candidates) {
    if (cand.error) {
      lastErr = cand.error
      lastDetail = cand.detail
      continue
    }
    let match = false
    try {
      match = await globalThis.crypto.subtle.verify(algo, cand.key, sigBytes, dataBytes)
    } catch (e) {
      lastErr = 'verify_error'
      lastDetail = String((e && e.message) || e)
      continue
    }
    if (match) {
      verifiedKey = cand
      return { ok: true, verified: true, alg: parsed.header.alg, key: cand, candidateKeys: derived.candidates.length }
    }
  }

  return {
    ok: true,
    verified: false,
    alg: parsed.header.alg,
    error: lastErr,
    detail: lastDetail,
    candidateKeys: derived.candidates.length,
    verdictKey: verifiedKey,
  }
}

// Gera um token JWT assinado (usado pelos exemplos da página).
// headerMust: { alg }, payload: objeto. keyMaterial: segredo (string) para
// HS*, KeyPair para RS/PS/ES/EdDSA.
export async function signJwt(headerMust, payload, keyMaterial) {
  const header = { typ: 'JWT', ...headerMust }
  const cfg = algConfig(header.alg)
  if (!cfg) throw new Error('unsupported alg')

  const enc = (obj) => bytesToB64url(new Uint8Array(utf8(JSON.stringify(obj))))
  const input = utf8(`${enc(header)}.${enc(payload)}`)

  let signature
  if (cfg.name === 'HMAC') {
    const key = await globalThis.crypto.subtle.importKey(
      'raw', utf8(keyMaterial), { name: 'HMAC', hash: cfg.hash }, false, ['sign']
    )
    signature = await globalThis.crypto.subtle.sign('HMAC', key, input)
  } else {
    const algo = cfg.name === 'RSA-PSS'
      ? { name: 'RSA-PSS', saltLength: cfg.saltLength }
      : cfg.name === 'ECDSA'
        ? { name: 'ECDSA', hash: cfg.hash }
        : cfg.name
    signature = await globalThis.crypto.subtle.sign(algo, keyMaterial, input)
  }

  return `${enc(header)}.${enc(payload)}.${bytesToB64url(new Uint8Array(signature))}`
}

export function pemFromSpkiJwk(cfg, jwk) {
  // (não usado na página — presente para clareza do motor)
  return null
}

export function getEngineSource() {
  return [
    '// Verificação de assinatura JWT — WebCrypto, 100% client-side.',
    'const cfg = algConfig(header.alg)   // HS*/RS*/PS*/ES*/EdDSA',
    'const sig = b64urlToBytes(parts[2])',
    "const data = utf8(parts[0] + '.' + parts[1])",
    '// Importa a chave (SPKI/JWK/segredo) com o algoritmo certo...',
    'const key = await crypto.subtle.importKey("spki", der, algo, false, ["verify"])',
    'export async function verifyJwtSignature(token, keyInput) {',
    '  const parsed = parseToken(token)',
    '  const cfg = algConfig(parsed.header.alg)',
    '  const derived = await deriveCandidates(cfg, keyInput)',
    '  for (const cand of derived.candidates) {',
    '    // RSA-PSS usa saltLength = tamanho do hash (RFC 7518)',
    '    const ok = await crypto.subtle.verify(verifyAlgo(cfg), cand.key, sig, data)',
    '    if (ok) return { verified: true, key: cand }',
    '  }',
    '  return { verified: false }',
    '}',
  ].join('\n')
}