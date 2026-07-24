import React from 'react'
import { Typography, Card, Space, Input, Button, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useLocalStorage from '../hooks/useLocalStorage'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage indisponível (modo privado, quota cheia etc.) — ignora
    }
  }, [key, value])

  return [value, setValue]
}`

function DemoUsage() {
  const [name, setName] = useLocalStorage('devtools:demo-name', '')
  const [count, setCount] = useLocalStorage('devtools:demo-count', 0)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        placeholder="Digite seu nome (recarrega a página pra ver que persiste)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Text type="secondary">Salvo em localStorage sob a chave <Text code>devtools:demo-name</Text>: </Text>
      <Tag color="blue">{name || '(vazio)'}</Tag>

      <Space>
        <Button onClick={() => setCount((c) => c + 1)}>Incrementar contador persistido</Button>
        <Tag color="purple">count = {count}</Tag>
      </Space>
    </Space>
  )
}

export default function UseLocalStorageSnippetPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> Snippet: useLocalStorage</Title>
      <Paragraph type="secondary">
        Hook que funciona como <Text code>useState</Text>, mas mantém o valor
        sincronizado com <Text code>localStorage</Text> — útil pra preferências
        do usuário, rascunhos de formulário ou qualquer estado que deve
        sobreviver a um refresh da página. Já está em{' '}
        <Text code>src/hooks/useLocalStorage.js</Text>, pronto pra importar.
      </Paragraph>

      <Card title="Código-fonte">
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title="Demonstração (recarregue a página pra confirmar que persiste)">
        <DemoUsage />
      </Card>
    </Space>
  )
}
