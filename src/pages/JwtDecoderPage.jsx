import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert, Tag, Descriptions } from 'antd'
import { KeyOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

function base64UrlDecode(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

function decodeJwt(token) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    throw new Error('Token precisa ter 3 partes separadas por ponto (header.payload.signature).')
  }
  const [rawHeader, rawPayload, signature] = parts
  const header = JSON.parse(base64UrlDecode(rawHeader))
  const payload = JSON.parse(base64UrlDecode(rawPayload))
  return { header, payload, signature }
}

function formatDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleString('pt-BR')
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState('')

  const result = useMemo(() => {
    if (!token.trim()) return { data: null, error: null }
    try {
      return { data: decodeJwt(token), error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [token])

  const exp = result.data?.payload?.exp
  const iat = result.data?.payload?.iat
  const isExpired = typeof exp === 'number' ? Date.now() >= exp * 1000 : null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> Decodificador de JWT</Title>
      <Paragraph type="secondary">
        Cola um JSON Web Token abaixo pra ver o header e o payload decodificados.
        Tudo roda no navegador — o token nunca sai da sua máquina, e a
        assinatura não é verificada (só decodificação, sem validação de segredo).
      </Paragraph>

      <Card>
        <TextArea
          rows={4}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {result.error && (
        <Alert type="error" showIcon message="Token inválido" description={result.error} />
      )}

      {result.data && (
        <>
          {isExpired !== null && (
            <Alert
              type={isExpired ? 'error' : 'success'}
              showIcon
              message={isExpired ? 'Token expirado' : 'Token válido (dentro do prazo)'}
              description={
                <Descriptions size="small" column={1}>
                  {iat && <Descriptions.Item label="Emitido em (iat)">{formatDate(iat)}</Descriptions.Item>}
                  {exp && <Descriptions.Item label="Expira em (exp)">{formatDate(exp)}</Descriptions.Item>}
                </Descriptions>
              }
            />
          )}

          <Card
            title={<Space>Header <Tag color="blue">{result.data.header.alg}</Tag></Space>}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{JSON.stringify(result.data.header, null, 2)}</code>
            </pre>
          </Card>

          <Card title="Payload">
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{JSON.stringify(result.data.payload, null, 2)}</code>
            </pre>
          </Card>

          <Card title="Assinatura (não verificada)">
            <Text code style={{ wordBreak: 'break-all' }}>{result.data.signature}</Text>
          </Card>
        </>
      )}
    </Space>
  )
}
