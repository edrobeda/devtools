import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Select,
  Button,
  Space,
  Checkbox,
  Row,
  Col,
  message,
  Alert,
  Collapse,
  Tag,
} from 'antd'
import { SafetyCertificateOutlined, CopyOutlined, CodeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { generateSigV4, PRESETS } from '../utils/awsSigv4SignatureGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de Assinatura AWS SigV4',
    intro: (
      <>
        Monta a assinatura AWS Signature Version 4 de uma requisição HTTP
        diretamente no navegador usando <Text code>crypto.subtle</Text>. Útil
        para debugar chamadas à S3, Lambda, API Gateway, STS e outros serviços
        AWS sem sair do devtools.
      </>
    ),
    accessKeyLabel: 'Access Key ID',
    accessKeyPlaceholder: 'AKIA...',
    secretKeyLabel: 'Secret Access Key',
    secretKeyPlaceholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    regionLabel: 'Região',
    regionPlaceholder: 'us-east-1',
    serviceLabel: 'Serviço',
    servicePlaceholder: 's3, lambda, execute-api, sts...',
    methodLabel: 'Método HTTP',
    uriLabel: 'URI',
    uriPlaceholder: '/bucket/key',
    queryLabel: 'Query String',
    queryPlaceholder: 'prefix=docs&max-keys=100',
    headersLabel: 'Headers',
    headersPlaceholder: 'host: s3.us-east-1.amazonaws.com\ncontent-type: application/json',
    payloadLabel: 'Payload',
    unsignedPayload: 'Payload não assinado (UNSIGNED-PAYLOAD)',
    presets: 'Presets rápidos',
    compute: 'Calcular',
    resultTitle: 'Assinatura',
    authorization: 'Authorization',
    signature: 'Signature',
    canonicalRequest: 'Canonical Request',
    stringToSign: 'String to Sign',
    signedHeaders: 'Signed Headers',
    payloadHash: 'Payload Hash (x-amz-content-sha256)',
    credentialScope: 'Credential Scope',
    signingKey: 'Signing Key (hex)',
    copy: 'Copiar',
    copied: 'Copiado',
    errorTitle: 'Erro ao gerar assinatura',
    sourceTitle: 'Código-fonte do motor',
    emptyWarning: 'Preencha Access Key, Secret Key, região, serviço e URI para calcular a assinatura.',
  },
  en: {
    title: 'AWS SigV4 Signature Generator',
    intro: (
      <>
        Builds the AWS Signature Version 4 signature for an HTTP request
        directly in the browser using <Text code>crypto.subtle</Text>. Useful
        for debugging calls to S3, Lambda, API Gateway, STS and other AWS
        services without leaving devtools.
      </>
    ),
    accessKeyLabel: 'Access Key ID',
    accessKeyPlaceholder: 'AKIA...',
    secretKeyLabel: 'Secret Access Key',
    secretKeyPlaceholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    regionLabel: 'Region',
    regionPlaceholder: 'us-east-1',
    serviceLabel: 'Service',
    servicePlaceholder: 's3, lambda, execute-api, sts...',
    methodLabel: 'HTTP Method',
    uriLabel: 'URI',
    uriPlaceholder: '/bucket/key',
    queryLabel: 'Query String',
    queryPlaceholder: 'prefix=docs&max-keys=100',
    headersLabel: 'Headers',
    headersPlaceholder: 'host: s3.us-east-1.amazonaws.com\ncontent-type: application/json',
    payloadLabel: 'Payload',
    unsignedPayload: 'Unsigned payload (UNSIGNED-PAYLOAD)',
    presets: 'Quick presets',
    compute: 'Compute',
    resultTitle: 'Signature',
    authorization: 'Authorization',
    signature: 'Signature',
    canonicalRequest: 'Canonical Request',
    stringToSign: 'String to Sign',
    signedHeaders: 'Signed Headers',
    payloadHash: 'Payload Hash (x-amz-content-sha256)',
    credentialScope: 'Credential Scope',
    signingKey: 'Signing Key (hex)',
    copy: 'Copy',
    copied: 'Copied',
    errorTitle: 'Error generating signature',
    sourceTitle: 'Engine source code',
    emptyWarning: 'Fill in Access Key, Secret Key, region, service and URI to compute the signature.',
  },
}

const SOURCE_CODE = `const ALGORITHM = 'AWS4-HMAC-SHA256'
const TERMINAL = 'aws4_request'

export function awsRfcEncode(value) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (c) => \`%\${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}\`)
}

export function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
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
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(data)))
}

export async function deriveSigningKey(secretAccessKey, dateStamp, region, service) {
  const kDate = await hmacSha256(\`AWS4\${secretAccessKey}\`, dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, TERMINAL)
  return kSigning
}

export function canonicalUri(uri) {
  const trimmed = uri.startsWith('/') ? uri : \`/\${uri}\`
  return trimmed.split('/').map((s) => awsRfcEncode(s)).join('/')
}

export function canonicalQueryString(queryString) {
  if (!queryString?.trim()) return ''
  const params = []
  for (const pair of queryString.split('&')) {
    const [key, ...rest] = pair.split('=')
    if (!key) continue
    const value = rest.join('=')
    params.push([
      awsRfcEncode(decodeURIComponent(key)),
      awsRfcEncode(decodeURIComponent(value || '')),
    ])
  }
  params.sort(([a], [b]) => (a < b ? -1 : 1))
  return params.map(([k, v]) => \`\${k}=\${v}\`).join('&')
}

export function parseHeaders(text) {
  const headers = {}
  if (!text?.trim()) return headers
  for (const line of text.split(/\\r?\\n/)) {
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

export function canonicalHeaders(headers) {
  const entries = Object.entries(headers)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([lower, items]) => {
      const values = items.map((it) => it.value.replace(/\\s+/g, ' ')).join(',')
      return \`\${lower}:\${values}\\n\`
    })
  const signed = Object.keys(headers).sort().join(';')
  return { canonical: entries.join(''), signed }
}

export async function generateSigV4(params) {
  const {
    accessKeyId, secretAccessKey, region, service,
    method, uri, queryString = '', headersText = '',
    payload = '', unsignedPayload = false,
  } = params

  const now = new Date()
  const amzDate = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = unsignedPayload ? 'UNSIGNED-PAYLOAD' : await sha256Hex(payload)

  const headers = parseHeaders(headersText)
  headers.host ||= [{ name: 'host', value: \`\${service}.\${region}.amazonaws.com\` }]
  headers['x-amz-date'] ||= [{ name: 'x-amz-date', value: amzDate }]
  if (!unsignedPayload) {
    headers['x-amz-content-sha256'] ||= [{ name: 'x-amz-content-sha256', value: payloadHash }]
  }

  const { canonical: canonicalHeadersStr, signed } = canonicalHeaders(headers)
  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri(uri),
    canonicalQueryString(queryString),
    canonicalHeadersStr,
    signed,
    payloadHash,
  ].join('\\n')

  const credentialScope = \`\${dateStamp}/\${region}/\${service}/\${TERMINAL}\`
  const canonicalRequestHash = await sha256Hex(canonicalRequest)
  const stringToSign = [ALGORITHM, amzDate, credentialScope, canonicalRequestHash].join('\\n')

  const signingKey = await deriveSigningKey(secretAccessKey, dateStamp, region, service)
  const signature = toHex(await hmacSha256(signingKey, stringToSign))
  const authorization = \`\${ALGORITHM} Credential=\${accessKeyId}/\${credentialScope}, SignedHeaders=\${signed}, Signature=\${signature}\`

  return { authorization, signature, canonicalRequest, stringToSign, signedHeaders: signed, payloadHash, credentialScope }
}`

export default function AwsSigv4SignatureGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [accessKeyId, setAccessKeyId] = useState('AKIAIOSFODNN7EXAMPLE')
  const [secretAccessKey, setSecretAccessKey] = useState('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')
  const [region, setRegion] = useState('us-east-1')
  const [service, setService] = useState('s3')
  const [method, setMethod] = useState('GET')
  const [uri, setUri] = useState('/my-bucket/my-key.txt')
  const [queryString, setQueryString] = useState('')
  const [headersText, setHeadersText] = useState('host: s3.us-east-1.amazonaws.com\n')
  const [payload, setPayload] = useState('')
  const [unsignedPayload, setUnsignedPayload] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const params = useMemo(
    () => ({
      accessKeyId,
      secretAccessKey,
      region,
      service,
      method,
      uri,
      queryString,
      headersText,
      payload,
      unsignedPayload,
    }),
    [accessKeyId, secretAccessKey, region, service, method, uri, queryString, headersText, payload, unsignedPayload],
  )

  const canCompute = accessKeyId && secretAccessKey && region && service && uri

  useEffect(() => {
    if (!canCompute) {
      setResult(null)
      setError(null)
      return
    }
    const id = ++requestId.current
    generateSigV4(params)
      .then((data) => {
        if (id === requestId.current) {
          setResult(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (id === requestId.current) setError(err.message)
      })
  }, [params, canCompute])

  const applyPreset = (preset) => {
    const c = preset.config
    setMethod(c.method)
    setUri(c.uri)
    setService(c.service)
    setQueryString(c.queryString)
    setHeadersText(c.headersText)
    setPayload(c.payload)
    setUnsignedPayload(c.unsignedPayload)
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presets} size="small">
        <Space wrap>
          {PRESETS.map((p) => (
            <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
              {p[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={8}>
                <Col span={12}>
                  <Text strong>{t.accessKeyLabel}</Text>
                  <Input
                    value={accessKeyId}
                    onChange={(e) => setAccessKeyId(e.target.value)}
                    placeholder={t.accessKeyPlaceholder}
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.secretKeyLabel}</Text>
                  <Input.Password
                    value={secretAccessKey}
                    onChange={(e) => setSecretAccessKey(e.target.value)}
                    placeholder={t.secretKeyPlaceholder}
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                    visibilityToggle
                  />
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Text strong>{t.regionLabel}</Text>
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={t.regionPlaceholder}
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.serviceLabel}</Text>
                  <Input
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder={t.servicePlaceholder}
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                  />
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={8}>
                  <Text strong>{t.methodLabel}</Text>
                  <Select
                    value={method}
                    onChange={setMethod}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map((m) => (
                      <Option key={m} value={m}>{m}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={16}>
                  <Text strong>{t.uriLabel}</Text>
                  <Input
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                    placeholder={t.uriPlaceholder}
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                  />
                </Col>
              </Row>
              <div>
                <Text strong>{t.queryLabel}</Text>
                <TextArea
                  rows={2}
                  value={queryString}
                  onChange={(e) => setQueryString(e.target.value)}
                  placeholder={t.queryPlaceholder}
                  style={{ fontFamily: 'monospace', marginTop: 4 }}
                />
              </div>
              <div>
                <Text strong>{t.headersLabel}</Text>
                <TextArea
                  rows={4}
                  value={headersText}
                  onChange={(e) => setHeadersText(e.target.value)}
                  placeholder={t.headersPlaceholder}
                  style={{ fontFamily: 'monospace', marginTop: 4 }}
                />
              </div>
              <div>
                <Text strong>{t.payloadLabel}</Text>
                <TextArea
                  rows={3}
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  style={{ fontFamily: 'monospace', marginTop: 4 }}
                />
                <Checkbox
                  checked={unsignedPayload}
                  onChange={(e) => setUnsignedPayload(e.target.checked)}
                  style={{ marginTop: 8 }}
                >
                  {t.unsignedPayload}
                </Checkbox>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {!canCompute && (
            <Alert type="info" showIcon message={t.emptyWarning} style={{ marginBottom: 16 }} />
          )}
          {error && (
            <Alert type="error" showIcon message={t.errorTitle} description={error} style={{ marginBottom: 16 }} />
          )}
          {result && (
            <Card title={t.resultTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <ResultRow label={t.authorization} value={result.authorization} copy={copy} t={t} />
                <ResultRow label={t.signature} value={result.signature} copy={copy} t={t} />
                <ResultRow label={t.credentialScope} value={result.credentialScope} copy={copy} t={t} />
                <ResultRow label={t.signedHeaders} value={result.signedHeaders} copy={copy} t={t} />
                <ResultRow label={t.payloadHash} value={result.payloadHash} copy={copy} t={t} />
                <ResultRow label={t.stringToSign} value={result.stringToSign} copy={copy} t={t} code />
                <ResultRow label={t.canonicalRequest} value={result.canonicalRequest} copy={copy} t={t} code />
                <ResultRow label={t.signingKey} value={result.signingKeyHex} copy={copy} t={t} />
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Collapse defaultActiveKey={[]}>
        <Panel header={<><CodeOutlined /> {t.sourceTitle}</>} key="source">
          <pre style={{ overflow: 'auto', maxHeight: 480 }}>
            <code>{SOURCE_CODE}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}

function ResultRow({ label, value, copy, t, code }) {
  return (
    <div>
      <Text strong>{label}</Text>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
        <Text
          code={code}
          style={{
            wordBreak: 'break-all',
            flex: 1,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            background: 'rgba(0,0,0,0.03)',
            padding: 8,
            borderRadius: 4,
          }}
        >
          {value}
        </Text>
        <Button size="small" icon={<CopyOutlined />} onClick={() => copy(value)}>{t.copy}</Button>
      </div>
    </div>
  )
}
