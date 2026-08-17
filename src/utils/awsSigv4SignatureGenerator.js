/**
 * Gerador de assinatura AWS Signature Version 4 — 100% client-side.
 *
 * Implementa o algoritmo documentado em:
 * https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
 *
 * Use crypto.subtle (Web Crypto) para HMAC-SHA256 e SHA-256.
 */

const ALGORITHM = 'AWS4-HMAC-SHA256'
const TERMINAL = 'aws4_request'

/**
 * Codifica uma string no subconjunto de RFC 3986 exigido pela AWS.
 * Diferente de encodeURIComponent padrão, não codifica ~, mas codifica * e '.
 */
export function awsRfcEncode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)
}

export function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key, data) {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? enc.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data))
}

async function sha256Hex(data) {
  const enc = new TextEncoder()
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(data))
  return toHex(buffer)
}

/**
 * Deriva a chave de assinatura (signing key) a partir da secret access key.
 */
export async function deriveSigningKey(secretAccessKey, dateStamp, region, service) {
  const kDate = await hmacSha256(`AWS4${secretAccessKey}`, dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, TERMINAL)
  return kSigning
}

/**
 * Normaliza a URI canônica codificando cada segmento, preservando as barras.
 */
export function canonicalUri(uri) {
  const trimmed = uri.startsWith('/') ? uri : `/${uri}`
  return trimmed
    .split('/')
    .map((segment) => awsRfcEncode(segment))
    .join('/')
}

/**
 * Normaliza a query string canônica ordenando chaves e codificando valores.
 */
export function canonicalQueryString(queryString) {
  if (!queryString || !queryString.trim()) return ''
  const params = []
  const pairs = queryString.split('&')
  for (const pair of pairs) {
    const [key, ...rest] = pair.split('=')
    if (!key) continue
    const value = rest.join('=')
    params.push([awsRfcEncode(decodeURIComponent(key)), awsRfcEncode(decodeURIComponent(value || ''))])
  }
  params.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return params.map(([k, v]) => `${k}=${v}`).join('&')
}

/**
 * Faz o parse de headers em formato texto ("Nome: valor") para um objeto.
 * Preserva headers multivalor como lista para o cálculo da assinatura.
 */
export function parseHeaders(text) {
  const headers = {}
  if (!text || !text.trim()) return headers
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf(':')
    if (idx === -1) continue
    const name = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (!name) continue
    const lower = name.toLowerCase()
    if (!headers[lower]) headers[lower] = []
    headers[lower].push({ name, value })
  }
  return headers
}

/**
 * Monta o bloco de headers canônicos e a lista de signed headers.
 */
export function canonicalHeaders(headers) {
  const entries = Object.entries(headers)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([lower, items]) => {
      const values = items.map((it) => it.value.replace(/\s+/g, ' ')).join(',')
      return `${lower}:${values}\n`
    })
  const signed = Object.keys(headers).sort().join(';')
  return { canonical: entries.join(''), signed }
}

/**
 * Gera a assinatura SigV4 completa a partir dos dados da requisição.
 *
 * @param {Object} params
 * @param {string} params.accessKeyId
 * @param {string} params.secretAccessKey
 * @param {string} params.region
 * @param {string} params.service
 * @param {string} params.method
 * @param {string} params.uri
 * @param {string} [params.queryString]
 * @param {string} [params.headersText]
 * @param {string} [params.payload]
 * @param {string} [params.amzDate]  Formato ISO8601 básico, ex.: 20260102T120000Z
 * @param {string} [params.dateStamp] Formato yyyyMMdd
 * @param {boolean} [params.unsignedPayload]
 */
export async function generateSigV4(params) {
  const {
    accessKeyId,
    secretAccessKey,
    region,
    service,
    method,
    uri,
    queryString = '',
    headersText = '',
    payload = '',
    amzDate,
    dateStamp,
    unsignedPayload = false,
  } = params

  const now = new Date()
  const effectiveAmzDate = amzDate || now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const effectiveDateStamp = dateStamp || effectiveAmzDate.slice(0, 8)

  const payloadHash = unsignedPayload ? 'UNSIGNED-PAYLOAD' : await sha256Hex(payload)

  const headers = parseHeaders(headersText)
  headers['host'] = headers['host'] || [{ name: 'host', value: `${service}.${region}.amazonaws.com` }]
  headers['x-amz-date'] = headers['x-amz-date'] || [{ name: 'x-amz-date', value: effectiveAmzDate }]
  if (!unsignedPayload) {
    headers['x-amz-content-sha256'] = headers['x-amz-content-sha256'] || [{ name: 'x-amz-content-sha256', value: payloadHash }]
  }

  const { canonical: canonicalHeadersStr, signed } = canonicalHeaders(headers)
  const cUri = canonicalUri(uri)
  const cQuery = canonicalQueryString(queryString)
  const canonicalRequest = [
    method.toUpperCase(),
    cUri,
    cQuery,
    canonicalHeadersStr,
    signed,
    payloadHash,
  ].join('\n')

  const credentialScope = `${effectiveDateStamp}/${region}/${service}/${TERMINAL}`
  const canonicalRequestHash = await sha256Hex(canonicalRequest)
  const stringToSign = [ALGORITHM, effectiveAmzDate, credentialScope, canonicalRequestHash].join('\n')

  const signingKey = await deriveSigningKey(secretAccessKey, effectiveDateStamp, region, service)
  const signatureBuffer = await hmacSha256(signingKey, stringToSign)
  const signature = toHex(signatureBuffer)

  const authorization = `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signed}, Signature=${signature}`

  return {
    algorithm: ALGORITHM,
    amzDate: effectiveAmzDate,
    dateStamp: effectiveDateStamp,
    credentialScope,
    canonicalRequest,
    canonicalRequestHash,
    stringToSign,
    signingKeyHex: toHex(signingKey),
    signature,
    authorization,
    signedHeaders: signed,
    payloadHash,
    headers,
  }
}

/**
 * Presets rápidos de requisições AWS comuns para facilitar testes.
 */
export const PRESETS = [
  {
    key: 's3-get',
    pt: 'S3 GET objeto',
    en: 'S3 GET object',
    config: {
      method: 'GET',
      uri: '/my-bucket/my-key.txt',
      service: 's3',
      queryString: '',
      headersText: 'host: s3.us-east-1.amazonaws.com\n',
      payload: '',
      unsignedPayload: true,
    },
  },
  {
    key: 's3-put',
    pt: 'S3 PUT objeto',
    en: 'S3 PUT object',
    config: {
      method: 'PUT',
      uri: '/my-bucket/my-key.txt',
      service: 's3',
      queryString: '',
      headersText: 'host: s3.us-east-1.amazonaws.com\ncontent-type: text/plain\n',
      payload: 'Hello from devtools',
      unsignedPayload: false,
    },
  },
  {
    key: 'lambda-invoke',
    pt: 'Lambda Invoke',
    en: 'Lambda Invoke',
    config: {
      method: 'POST',
      uri: '/2015-03-31/functions/my-function/invocations',
      service: 'lambda',
      queryString: '',
      headersText: 'host: lambda.us-east-1.amazonaws.com\ncontent-type: application/json\n',
      payload: '{"key":"value"}',
      unsignedPayload: false,
    },
  },
  {
    key: 'apigateway',
    pt: 'API Gateway GET',
    en: 'API Gateway GET',
    config: {
      method: 'GET',
      uri: '/prod/users',
      service: 'execute-api',
      queryString: 'limit=10',
      headersText: 'host: abc123.execute-api.us-east-1.amazonaws.com\n',
      payload: '',
      unsignedPayload: false,
    },
  },
  {
    key: 'sts-assume-role',
    pt: 'STS AssumeRole',
    en: 'STS AssumeRole',
    config: {
      method: 'POST',
      uri: '/',
      service: 'sts',
      queryString: 'Action=AssumeRole&Version=2011-06-15&RoleArn=arn:aws:iam::123456789012:role/MyRole&RoleSessionName=devtools',
      headersText: 'host: sts.us-east-1.amazonaws.com\ncontent-type: application/x-www-form-urlencoded; charset=utf-8\n',
      payload: '',
      unsignedPayload: false,
    },
  },
]
