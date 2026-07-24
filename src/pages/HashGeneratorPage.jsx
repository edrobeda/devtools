import React, { useEffect, useRef, useState } from 'react'
import { Typography, Card, Input, Space, List, Button, message, Alert } from 'antd'
import { NumberOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

const translations = {
  pt: {
    title: 'Gerador de Hash',
    intro: (
      <>
        Calcula SHA-1, SHA-256, SHA-384 e SHA-512 de um texto usando a
        Web Crypto API do navegador (<Text code>crypto.subtle</Text>) — nada
        é enviado pra fora, o cálculo acontece localmente.
      </>
    ),
    placeholder: 'Digite ou cole o texto...',
    errorTitle: 'Erro ao calcular hash',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copiedMessage: (alg) => `${alg} copiado`,
  },
  en: {
    title: 'Hash Generator',
    intro: (
      <>
        Computes SHA-1, SHA-256, SHA-384 and SHA-512 of a text using the
        browser's Web Crypto API (<Text code>crypto.subtle</Text>) — nothing
        is sent out, the computation happens locally.
      </>
    ),
    placeholder: 'Type or paste the text...',
    errorTitle: 'Error computing hash',
    resultTitle: 'Result',
    copy: 'Copy',
    copiedMessage: (alg) => `${alg} copied`,
  },
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function digestAll(text) {
  const encoded = new TextEncoder().encode(text)
  const entries = await Promise.all(
    ALGORITHMS.map(async (alg) => {
      const buffer = await crypto.subtle.digest(alg, encoded)
      return [alg, toHex(buffer)]
    }),
  )
  return Object.fromEntries(entries)
}

export default function HashGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState('')
  const [hashes, setHashes] = useState(null)
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (!text) {
      setHashes(null)
      setError(null)
      return
    }
    const id = ++requestId.current
    digestAll(text)
      .then((result) => {
        if (id === requestId.current) {
          setHashes(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (id === requestId.current) setError(err.message)
      })
  }, [text])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><NumberOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={4}
          placeholder={t.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {error && <Alert type="error" showIcon message={t.errorTitle} description={error} />}

      {hashes && (
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
                      navigator.clipboard.writeText(hashes[alg])
                      message.success(t.copiedMessage(alg))
                    }}
                  >
                    {t.copy}
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong>{alg}</Text>
                  <Text code style={{ wordBreak: 'break-all' }}>{hashes[alg]}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}
    </Space>
  )
}
