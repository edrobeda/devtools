import React from 'react'
import { Typography, Card, Space, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useKeyPress from '../hooks/useKeyPress'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

export default function useKeyPress(targetKey) {
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === targetKey) setIsPressed(true)
    }
    function handleKeyUp(e) {
      if (e.key === targetKey) setIsPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [targetKey])

  return isPressed
}

// uso:
// const isEnterPressed = useKeyPress('Enter')
// const isEscPressed = useKeyPress('Escape')`

const translations = {
  pt: {
    title: 'Snippet: useKeyPress',
    intro: (
      <>
        Hook que retorna um booleano dizendo se uma tecla específica está
        pressionada agora, escutando <Text code>keydown</Text>/
        <Text code>keyup</Text> na <Text code>window</Text>. O valor de{' '}
        <Text code>targetKey</Text> segue o mesmo nome usado por{' '}
        <Text code>KeyboardEvent.key</Text> (ex.: <Text code>'Enter'</Text>,{' '}
        <Text code>'Escape'</Text>, <Text code>'a'</Text>,{' '}
        <Text code>'ArrowUp'</Text>). Útil pra atalhos de teclado simples ou
        feedback visual de "segure pra ação".
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Segure as teclas abaixo (com esta página em foco):',
    pressed: 'Pressionada',
    released: 'Solta',
  },
  en: {
    title: 'Snippet: useKeyPress',
    intro: (
      <>
        A hook that returns a boolean telling whether a specific key is
        currently pressed, listening to <Text code>keydown</Text>/
        <Text code>keyup</Text> on <Text code>window</Text>. The{' '}
        <Text code>targetKey</Text> value follows the same name used by{' '}
        <Text code>KeyboardEvent.key</Text> (e.g. <Text code>'Enter'</Text>,{' '}
        <Text code>'Escape'</Text>, <Text code>'a'</Text>,{' '}
        <Text code>'ArrowUp'</Text>). Handy for simple keyboard shortcuts or
        "hold to act" visual feedback.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Hold the keys below (with this page focused):',
    pressed: 'Pressed',
    released: 'Released',
  },
}

const DEMO_KEYS = ['Shift', 'Enter', 'ArrowUp', 'a']

function DemoUsage({ t }) {
  return (
    <Space direction="vertical">
      <Text type="secondary">{t.demoDesc}</Text>
      <Space wrap size="middle">
        {DEMO_KEYS.map((key) => <KeyIndicator key={key} label={key} t={t} />)}
      </Space>
    </Space>
  )
}

function KeyIndicator({ label, t }) {
  const isPressed = useKeyPress(label)
  return (
    <div
      style={{
        minWidth: 90,
        textAlign: 'center',
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${isPressed ? '#52c41a' : '#d9d9d9'}`,
        background: isPressed ? '#f6ffed' : '#fafafa',
        transition: 'all 0.15s ease',
      }}
    >
      <Text strong style={{ fontFamily: 'monospace' }}>{label}</Text>
      <div>
        <Tag color={isPressed ? 'green' : 'default'} style={{ marginTop: 4 }}>
          {isPressed ? t.pressed : t.released}
        </Tag>
      </div>
    </div>
  )
}

export default function UseKeyPressSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
