import React, { useEffect, useRef, useState } from 'react'
import { Typography, Card, Input, Space, List, Button, message, Alert } from 'antd'
import { KeyOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

const translations = {
  pt: {
    title: 'Gerador de HMAC',
    intro: (
      <>
        Calcula o HMAC (Hash-based Message Authentication Code) de uma
        mensagem a partir de uma chave secreta, usando{' '}
        <Text code>crypto.subtle.sign</Text> do navegador — nada é enviado
        pra fora, o cálculo acontece localmente. Útil pra conferir assinaturas
        de webhook (GitHub, Stripe) ou gerar tokens de teste.
      </>
    ),
    keyLabel: 'Chave secreta',
    keyPlaceholder: 'Digite a chave secreta...',
    messageLabel: 'Mensagem',
    messagePlaceholder: 'Digite ou cole a mensagem...',
    algorithmLabel: 'Algoritmo',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copiedMessage: 'HMAC copiado',
    errorTitle: 'Erro ao calcular HMAC',
  },
  en: {
    title: 'HMAC Generator',
    intro: (
      <>
        Computes the HMAC (Hash-based Message Authentication Code) of a
        message using a secret key, via the browser's{' '}
        <Text code>crypto.subtle.sign</Text> — nothing is sent out, the
        computation happens locally. Useful for checking webhook signatures
        (GitHub, Stripe) or generating test tokens.
      </>
    ),
    keyLabel: 'Secret key',
    keyPlaceholder: 'Type the secret key...',
    messageLabel: 'Message',
    messagePlaceholder: 'Type or paste the message...',
    algorithmLabel: 'Algorithm',
    resultTitle: 'Result',
    copy: 'Copy',
    copiedMessage: 'HMAC copied',
    errorTitle: 'Error computing HMAC',
  },
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function computeHmac(key, message_, algorithm) {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message_))
  return toHex(signature)
}

export default function HmacGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [secretKey, setSecretKey] = useState('')
  const [text, setText] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (!secretKey || !text) {
      setResults(null)
      setError(null)
      return
    }
    const id = ++requestId.current
    Promise.all(ALGORITHMS.map((alg) => computeHmac(secretKey, text, alg)))
      .then((values) => {
        if (id === requestId.current) {
          setResults(Object.fromEntries(ALGORITHMS.map((alg, i) => [alg, values[i]])))
          setError(null)
        }
      })
      .catch((err) => {
        if (id === requestId.current) setError(err.message)
      })
  }, [secretKey, text])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.keyLabel}</Text>
            <Input.Password
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={t.keyPlaceholder}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
              visibilityToggle
            />
          </div>
          <div>
            <Text strong>{t.messageLabel}</Text>
            <TextArea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.messagePlaceholder}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
            />
          </div>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={t.errorTitle} description={error} />}

      {results && (
        <Card title={t.resultTitle}>
          <List
            dataSource={ALGORITHMS}
            renderItem={(alg) => (
              <List.Item
                actions={[
                  <Button
                    key="copy"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(results[alg])
                      message.success(t.copiedMessage)
                    }}
                  >
                    {t.copy}
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong>HMAC-{alg}</Text>
                  <Text code style={{ wordBreak: 'break-all' }}>{results[alg]}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}
    </Space>
  )
}
