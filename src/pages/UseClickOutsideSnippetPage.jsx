import React, { useCallback, useState } from 'react'
import { Typography, Card, Space, Button, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useClickOutside from '../hooks/useClickOutside'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function useClickOutside(onOutsideClick) {
  const ref = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick(event)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [onOutsideClick])

  return ref
}`

function DemoUsage() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useClickOutside(close)

  return (
    <Space direction="vertical">
      <Button onClick={() => setOpen((v) => !v)}>
        {open ? 'Fechar' : 'Abrir'} menu
      </Button>
      {open && (
        <div
          ref={ref}
          style={{
            padding: 16,
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            background: '#fafafa',
            width: 240,
          }}
        >
          <Text>Clique fora dessa caixa pra fechar.</Text>
        </div>
      )}
      <Tag color={open ? 'green' : 'default'}>{open ? 'aberto' : 'fechado'}</Tag>
    </Space>
  )
}

export default function UseClickOutsideSnippetPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> Snippet: useClickOutside</Title>
      <Paragraph type="secondary">
        Hook que detecta cliques fora de um elemento e dispara um callback —
        útil pra fechar dropdowns, menus e popovers customizados sem depender
        de um componente pronto. Recebe a função de fechamento e devolve um{' '}
        <Text code>ref</Text> pra anexar no elemento que deve permanecer
        "dentro". Já está em <Text code>src/hooks/useClickOutside.js</Text>,
        pronto pra importar em qualquer página nova.
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
