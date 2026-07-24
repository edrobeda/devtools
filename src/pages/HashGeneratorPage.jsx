import React, { useEffect, useRef, useState } from 'react'
import { Typography, Card, Input, Space, List, Button, message, Alert } from 'antd'
import { NumberOutlined, CopyOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

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
      <Title level={2}><NumberOutlined /> Gerador de Hash</Title>
      <Paragraph type="secondary">
        Calcula SHA-1, SHA-256, SHA-384 e SHA-512 de um texto usando a
        Web Crypto API do navegador (<Text code>crypto.subtle</Text>) — nada
        é enviado pra fora, o cálculo acontece localmente.
      </Paragraph>

      <Card>
        <TextArea
          rows={4}
          placeholder="Digite ou cole o texto..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {error && <Alert type="error" showIcon message="Erro ao calcular hash" description={error} />}

      {hashes && (
        <Card title="Resultado">
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
                      message.success(`${alg} copiado`)
                    }}
                  >
                    Copiar
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
