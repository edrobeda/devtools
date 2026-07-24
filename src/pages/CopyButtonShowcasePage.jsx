import React, { useState } from 'react'
import { Typography, Card, Space, Button, message } from 'antd'
import { CopyOutlined, CheckOutlined, BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Componente: Botão de Copiar Animado',
    intro: (
      <>
        Botão que troca o ícone de copiar por um check verde com uma
        transição de escala e rotação, e volta ao normal depois de 1.5s.
        Só CSS via inline styles com <Text code>transition</Text> — sem
        biblioteca de animação.
      </>
    ),
    demoTitle: 'Demonstração',
    sourceTitle: 'Código-fonte',
    copyLabel: 'Copiar',
    copiedLabel: 'Copiado!',
    copyError: 'Não foi possível copiar',
    copyCommand: 'Copiar comando',
    copyEmail: 'Copiar e-mail',
    copyJson: 'Copiar JSON',
  },
  en: {
    title: 'Component: Animated Copy Button',
    intro: (
      <>
        A button that swaps its copy icon for a green checkmark with a
        scale and rotation transition, then reverts after 1.5s. Pure CSS
        via inline styles with <Text code>transition</Text> — no animation
        library.
      </>
    ),
    demoTitle: 'Demo',
    sourceTitle: 'Source code',
    copyLabel: 'Copy',
    copiedLabel: 'Copied!',
    copyError: 'Could not copy',
    copyCommand: 'Copy command',
    copyEmail: 'Copy email',
    copyJson: 'Copy JSON',
  },
}

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

function CopyButton({ value, children, copiedLabel, errorMessage }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(errorMessage)
    }
  }

  return (
    <Button onClick={handleClick} icon={
      <span style={{ position: 'relative', display: 'inline-block', width: 14, height: 14 }}>
        <CopyOutlined style={iconStyle(!copied)} />
        <CheckOutlined style={iconStyle(copied, '#52c41a')} />
      </span>
    }>
      {copied ? copiedLabel : children}
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

function CopyButton({ value, children = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error('Could not copy')
    }
  }

  return (
    <Button onClick={handleClick} icon={
      <span style={{ position: 'relative', display: 'inline-block', width: 14, height: 14 }}>
        <CopyOutlined style={iconStyle(!copied)} />
        <CheckOutlined style={iconStyle(copied, '#52c41a')} />
      </span>
    }>
      {copied ? 'Copied!' : children}
    </Button>
  )
}`

export default function CopyButtonShowcasePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space>
          <CopyButton value="npm install antd" copiedLabel={t.copiedLabel} errorMessage={t.copyError}>{t.copyCommand}</CopyButton>
          <CopyButton value="edrobeda@gmail.com" copiedLabel={t.copiedLabel} errorMessage={t.copyError}>{t.copyEmail}</CopyButton>
          <CopyButton value='{"ok": true}' copiedLabel={t.copiedLabel} errorMessage={t.copyError}>{t.copyJson}</CopyButton>
        </Space>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
