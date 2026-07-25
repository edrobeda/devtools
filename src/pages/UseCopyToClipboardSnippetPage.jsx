import React from 'react'
import { Typography, Card, Space, Button, Input } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import useCopyToClipboard from '../hooks/useCopyToClipboard'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useRef, useState } from 'react'

export default function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef(null)

  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), resetDelay)
    })
  }, [resetDelay])

  return [copied, copy]
}`

const translations = {
  pt: {
    title: 'Snippet: useCopyToClipboard',
    intro: (
      <>
        Hook que encapsula <Text code>navigator.clipboard.writeText</Text> e
        devolve um estado <Text code>copied</Text> que volta pra{' '}
        <Text code>false</Text> sozinho depois de um tempo — útil pra dar
        feedback visual (ícone check, texto "Copiado!") em qualquer botão de
        copiar sem repetir o mesmo <Text code>useState</Text>/
        <Text code>setTimeout</Text> em cada página. Já está em{' '}
        <Text code>src/hooks/useCopyToClipboard.js</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoText: 'Texto de exemplo pra copiar',
    copy: 'Copiar',
    copied: 'Copiado!',
  },
  en: {
    title: 'Snippet: useCopyToClipboard',
    intro: (
      <>
        A hook that wraps <Text code>navigator.clipboard.writeText</Text> and
        returns a <Text code>copied</Text> state that flips back to{' '}
        <Text code>false</Text> on its own after a delay — handy for visual
        feedback (check icon, "Copied!" text) on any copy button without
        repeating the same <Text code>useState</Text>/
        <Text code>setTimeout</Text> on every page. Already lives in{' '}
        <Text code>src/hooks/useCopyToClipboard.js</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoText: 'Sample text to copy',
    copy: 'Copy',
    copied: 'Copied!',
  },
}

function DemoUsage({ t }) {
  const [copied, copy] = useCopyToClipboard()

  return (
    <Space.Compact style={{ width: '100%', maxWidth: 420 }}>
      <Input value={t.demoText} readOnly />
      <Button
        type={copied ? 'primary' : 'default'}
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={() => copy(t.demoText)}
      >
        {copied ? t.copied : t.copy}
      </Button>
    </Space.Compact>
  )
}

export default function UseCopyToClipboardSnippetPage() {
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
