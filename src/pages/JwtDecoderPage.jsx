import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert, Tag, Descriptions } from 'antd'
import { KeyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Decodificador de JWT',
    intro: 'Cola um JSON Web Token abaixo pra ver o header e o payload decodificados. Tudo roda no navegador — o token nunca sai da sua máquina, e a assinatura não é verificada (só decodificação, sem validação de segredo).',
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    invalidTokenTitle: 'Token inválido',
    parseError: 'Token precisa ter 3 partes separadas por ponto (header.payload.signature).',
    expiredTitle: 'Token expirado',
    validTitle: 'Token válido (dentro do prazo)',
    issuedAt: 'Emitido em (iat)',
    expiresAt: 'Expira em (exp)',
    header: 'Header',
    payload: 'Payload',
    signature: 'Assinatura (não verificada)',
    locale: 'pt-BR',
  },
  en: {
    title: 'JWT Decoder',
    intro: 'Paste a JSON Web Token below to see the decoded header and payload. Everything runs in the browser — the token never leaves your machine, and the signature is not verified (decoding only, no secret validation).',
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    invalidTokenTitle: 'Invalid token',
    parseError: 'Token needs 3 parts separated by dots (header.payload.signature).',
    expiredTitle: 'Token expired',
    validTitle: 'Token valid (within window)',
    issuedAt: 'Issued at (iat)',
    expiresAt: 'Expires at (exp)',
    header: 'Header',
    payload: 'Payload',
    signature: 'Signature (not verified)',
    locale: 'en-US',
  },
}

function base64UrlDecode(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

function decodeJwt(token, parseErrorMessage) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    throw new Error(parseErrorMessage)
  }
  const [rawHeader, rawPayload, signature] = parts
  const header = JSON.parse(base64UrlDecode(rawHeader))
  const payload = JSON.parse(base64UrlDecode(rawPayload))
  return { header, payload, signature }
}

function formatDate(unixSeconds, locale) {
  return new Date(unixSeconds * 1000).toLocaleString(locale)
}

export default function JwtDecoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [token, setToken] = useState('')

  const result = useMemo(() => {
    if (!token.trim()) return { data: null, error: null }
    try {
      return { data: decodeJwt(token, t.parseError), error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [token, t.parseError])

  const exp = result.data?.payload?.exp
  const iat = result.data?.payload?.iat
  const isExpired = typeof exp === 'number' ? Date.now() >= exp * 1000 : null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={4}
          placeholder={t.placeholder}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {result.error && (
        <Alert type="error" showIcon message={t.invalidTokenTitle} description={result.error} />
      )}

      {result.data && (
        <>
          {isExpired !== null && (
            <Alert
              type={isExpired ? 'error' : 'success'}
              showIcon
              message={isExpired ? t.expiredTitle : t.validTitle}
              description={
                <Descriptions size="small" column={1}>
                  {iat && <Descriptions.Item label={t.issuedAt}>{formatDate(iat, t.locale)}</Descriptions.Item>}
                  {exp && <Descriptions.Item label={t.expiresAt}>{formatDate(exp, t.locale)}</Descriptions.Item>}
                </Descriptions>
              }
            />
          )}

          <Card
            title={<Space>{t.header} <Tag color="blue">{result.data.header.alg}</Tag></Space>}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{JSON.stringify(result.data.header, null, 2)}</code>
            </pre>
          </Card>

          <Card title={t.payload}>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{JSON.stringify(result.data.payload, null, 2)}</code>
            </pre>
          </Card>

          <Card title={t.signature}>
            <Text code style={{ wordBreak: 'break-all' }}>{result.data.signature}</Text>
          </Card>
        </>
      )}
    </Space>
  )
}
