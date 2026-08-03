import React, { useEffect, useState } from 'react'
import { Typography, Card, Input, Space, Alert, Select, Button } from 'antd'
import { KeyOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ALGORITHMS = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
}

const DEFAULT_PAYLOAD = `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1700000000
}`

const translations = {
  pt: {
    title: 'Gerador de JWT',
    intro: (
      <>
        Monta e assina um JSON Web Token válido a partir de um payload e uma
        chave secreta, usando <Text code>crypto.subtle.sign</Text> do
        navegador para HMAC — nada sai da sua máquina. Útil pra montar
        tokens de teste sem precisar de um backend rodando. Complementa o{' '}
        <Text code>/tools/jwt-decoder</Text>, que faz o caminho inverso.
      </>
    ),
    algorithmLabel: 'Algoritmo',
    secretLabel: 'Chave secreta',
    secretPlaceholder: 'Digite a chave secreta usada pra assinar...',
    payloadLabel: 'Payload (JSON)',
    resultTitle: 'Token gerado',
    copy: 'Copiar',
    copied: 'Token copiado!',
    errorTitle: 'Payload inválido',
    errorDesc: 'O payload precisa ser um JSON válido representando um objeto.',
    warning: 'Gerado só pra testes locais — não use uma chave secreta real de produção aqui.',
  },
  en: {
    title: 'JWT Generator',
    intro: (
      <>
        Builds and signs a valid JSON Web Token from a payload and a secret
        key, using the browser's <Text code>crypto.subtle.sign</Text> for
        HMAC — nothing leaves your machine. Useful for putting together test
        tokens without a backend running. Complements{' '}
        <Text code>/tools/jwt-decoder</Text>, which does the reverse.
      </>
    ),
    algorithmLabel: 'Algorithm',
    secretLabel: 'Secret key',
    secretPlaceholder: 'Type the secret key used to sign...',
    payloadLabel: 'Payload (JSON)',
    resultTitle: 'Generated token',
    copy: 'Copy',
    copied: 'Token copied!',
    errorTitle: 'Invalid payload',
    errorDesc: 'The payload needs to be valid JSON representing an object.',
    warning: 'Generated for local testing only — do not use a real production secret here.',
  },
}

function base64UrlEncode(bytes) {
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function encodeJsonSegment(obj) {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  return base64UrlEncode(bytes)
}

async function signJwt(alg, secret, payloadObj) {
  const header = { alg, typ: 'JWT' }
  const headerSegment = encodeJsonSegment(header)
  const payloadSegment = encodeJsonSegment(payloadObj)
  const signingInput = `${headerSegment}.${payloadSegment}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: ALGORITHMS[alg] },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  const signatureSegment = base64UrlEncode(new Uint8Array(signature))
  return `${signingInput}.${signatureSegment}`
}

export default function JwtGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [algorithm, setAlgorithm] = useState('HS256')
  const [secret, setSecret] = useState('your-256-bit-secret')
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD)
  const [token, setToken] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
    let payloadObj
    try {
      payloadObj = JSON.parse(payloadText)
      if (typeof payloadObj !== 'object' || payloadObj === null || Array.isArray(payloadObj)) {
        throw new Error('not an object')
      }
    } catch {
      setError(true)
      setToken('')
      return
    }
    setError(null)
    if (!secret) {
      setToken('')
      return
    }
    let cancelled = false
    signJwt(algorithm, secret, payloadObj).then((tok) => {
      if (!cancelled) setToken(tok)
    })
    return () => { cancelled = true }
  }, [algorithm, secret, payloadText])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>
      <Alert type="warning" showIcon message={t.warning} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.algorithmLabel}</Text>
            <Select
              value={algorithm}
              onChange={setAlgorithm}
              style={{ display: 'block', marginTop: 4, maxWidth: 200 }}
              options={Object.keys(ALGORITHMS).map((a) => ({ label: a, value: a }))}
            />
          </div>
          <div>
            <Text strong>{t.secretLabel}</Text>
            <Input.Password
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={t.secretPlaceholder}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
              visibilityToggle
            />
          </div>
          <div>
            <Text strong>{t.payloadLabel}</Text>
            <TextArea
              rows={8}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
            />
          </div>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={t.errorTitle} description={t.errorDesc} />}

      {token && !error && (
        <Card
          title={t.resultTitle}
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(token)
                setCopied(true)
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <Text code style={{ wordBreak: 'break-all' }}>{token}</Text>
        </Card>
      )}
    </Space>
  )
}
