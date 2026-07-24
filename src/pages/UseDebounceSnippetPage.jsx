import React, { useState } from 'react'
import { Typography, Card, Space, Input, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useDebounce from '../hooks/useDebounce'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

export default function useDebounce(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}`

function DemoUsage() {
  const [text, setText] = useState('')
  const debouncedText = useDebounce(text, 500)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        placeholder="Digita algo..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Text type="secondary">Valor com debounce (500ms): </Text>
      <Tag color="blue">{debouncedText || '(vazio)'}</Tag>
    </Space>
  )
}

export default function UseDebounceSnippetPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> Snippet: useDebounce</Title>
      <Paragraph type="secondary">
        Hook que atrasa a atualização de um valor até que ele pare de mudar
        por um período (<Text code>delayMs</Text>). Útil pra evitar disparar
        uma busca, chamada de API ou filtro pesado a cada tecla digitada —
        em vez disso, só reage depois que o usuário parou de digitar.
        Já está em <Text code>src/hooks/useDebounce.js</Text>, pronto pra
        importar em qualquer página nova.
      </Paragraph>

      <Card title="Código-fonte">
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title="Demonstração">
        <DemoUsage />
      </Card>
    </Space>
  )
}
