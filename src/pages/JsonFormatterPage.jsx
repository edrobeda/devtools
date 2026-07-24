import React, { useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, message, Descriptions } from 'antd'
import { FileTextOutlined, CopyOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

function countKeys(value) {
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => acc + countKeys(item), 0)
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).reduce(
      (acc, key) => acc + 1 + countKeys(value[key]),
      0,
    )
  }
  return 0
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  function parseInput() {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setStats(null)
      return null
    }
    try {
      const parsed = JSON.parse(input)
      setError(null)
      return parsed
    } catch (err) {
      setError(err.message)
      setOutput('')
      setStats(null)
      return undefined
    }
  }

  function handleFormat() {
    const parsed = parseInput()
    if (parsed === null || parsed === undefined) return
    const formatted = JSON.stringify(parsed, null, 2)
    setOutput(formatted)
    setStats({
      keys: countKeys(parsed),
      bytes: new TextEncoder().encode(formatted).length,
    })
  }

  function handleMinify() {
    const parsed = parseInput()
    if (parsed === null || parsed === undefined) return
    const minified = JSON.stringify(parsed)
    setOutput(minified)
    setStats({
      keys: countKeys(parsed),
      bytes: new TextEncoder().encode(minified).length,
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success('Copiado')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> Formatador e Validador de JSON</Title>
      <Paragraph type="secondary">
        Cola um JSON, formata com indentação ou minifica, e valida a sintaxe
        — tudo local via <Text code>JSON.parse</Text>/<Text code>JSON.stringify</Text>,
        nenhum dado sai do navegador.
      </Paragraph>

      <Card>
        <TextArea
          rows={10}
          placeholder='Cole o JSON aqui, ex: {"nome": "teste", "ativo": true}'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" onClick={handleFormat}>Formatar</Button>
          <Button onClick={handleMinify}>Minificar</Button>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message="JSON inválido" description={error} />}

      {output && (
        <Card
          title="Resultado"
          extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>Copiar</Button>}
        >
          {stats && (
            <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Chaves">{stats.keys}</Descriptions.Item>
              <Descriptions.Item label="Tamanho">{stats.bytes} bytes</Descriptions.Item>
            </Descriptions>
          )}
          <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            <code>{output}</code>
          </pre>
        </Card>
      )}
    </Space>
  )
}
