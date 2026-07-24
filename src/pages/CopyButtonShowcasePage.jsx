import React, { useState } from 'react'
import { Typography, Card, Space, Button, message } from 'antd'
import { CopyOutlined, CheckOutlined, BgColorsOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

function iconStyle(visible, color) {
  return {
    position: 'absolute',
    inset: 0,
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) rotate(0deg)' : 'scale(0.4) rotate(-90deg)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    color,
  }
}

function CopyButton({ value, children = 'Copiar' }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error('Não foi possível copiar')
    }
  }

  return (
    <Button onClick={handleClick} icon={
      <span style={{ position: 'relative', display: 'inline-block', width: 14, height: 14 }}>
        <CopyOutlined style={iconStyle(!copied)} />
        <CheckOutlined style={iconStyle(copied, '#52c41a')} />
      </span>
    }>
      {copied ? 'Copiado!' : children}
    </Button>
  )
}

const sourceCode = `function iconStyle(visible, color) {
  return {
    position: 'absolute',
    inset: 0,
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) rotate(0deg)' : 'scale(0.4) rotate(-90deg)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    color,
  }
}

function CopyButton({ value, children = 'Copiar' }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error('Não foi possível copiar')
    }
  }

  return (
    <Button onClick={handleClick} icon={
      <span style={{ position: 'relative', display: 'inline-block', width: 14, height: 14 }}>
        <CopyOutlined style={iconStyle(!copied)} />
        <CheckOutlined style={iconStyle(copied, '#52c41a')} />
      </span>
    }>
      {copied ? 'Copiado!' : children}
    </Button>
  )
}`

export default function CopyButtonShowcasePage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> Componente: Botão de Copiar Animado</Title>
      <Paragraph type="secondary">
        Botão que troca o ícone de copiar por um check verde com uma
        transição de escala e rotação, e volta ao normal depois de 1.5s.
        Só CSS via inline styles com <Text code>transition</Text> — sem
        biblioteca de animação.
      </Paragraph>

      <Card title="Demonstração">
        <Space>
          <CopyButton value="npm install antd">Copiar comando</CopyButton>
          <CopyButton value="edrobeda@gmail.com">Copiar e-mail</CopyButton>
          <CopyButton value='{"ok": true}'>Copiar JSON</CopyButton>
        </Space>
      </Card>

      <Card title="Código-fonte">
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
