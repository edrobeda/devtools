import React from 'react'
import { Typography, Card, Space, Input, Button, Tag, Alert } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useSessionStorage from '../hooks/useSessionStorage'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

export default function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable (private mode, quota full, etc.) — ignore
    }
  }, [key, value])

  return [value, setValue]
}`

const translations = {
  pt: {
    title: 'Snippet: useSessionStorage',
    intro: (
      <>
        Hook que funciona como <Text code>useState</Text>, mas mantém o valor
        sincronizado com <Text code>sessionStorage</Text> — útil pra estado
        temporário de uma aba/jornada, como rascunhos de formulário ou
        filtros de navegação. O valor sobrevive a um refresh, mas é limpo
        quando a aba é fechada. Já está em{' '}
        <Text code>src/hooks/useSessionStorage.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    alertMessage: 'Diferença do localStorage',
    alertDescription:
      'O valor salvo aqui sobrevive a um reload da página, mas desaparece se você fechar a aba. O localStorage persistiria mesmo depois de fechar o navegador.',
    namePlaceholder: 'Digite um texto (reload preserva, fechar aba limpa)',
    savedLabelPrefix: 'Salvo em sessionStorage sob a chave ',
    savedLabelSuffix: ': ',
    empty: '(vazio)',
    incrementButton: 'Incrementar contador da sessão',
  },
  en: {
    title: 'Snippet: useSessionStorage',
    intro: (
      <>
        A hook that behaves like <Text code>useState</Text>, but keeps the
        value in sync with <Text code>sessionStorage</Text> — useful for
        temporary per-tab state such as form drafts or navigation filters.
        The value survives a page reload, but is cleared when the tab is
        closed. It already lives in{' '}
        <Text code>src/hooks/useSessionStorage.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    alertMessage: 'Difference from localStorage',
    alertDescription:
      'The value saved here survives a page reload, but disappears if you close the tab. localStorage would persist even after closing the browser.',
    namePlaceholder: 'Type some text (reload keeps it, closing tab clears it)',
    savedLabelPrefix: 'Saved in sessionStorage under the key ',
    savedLabelSuffix: ': ',
    empty: '(empty)',
    incrementButton: 'Increment session counter',
  },
}

function DemoUsage({ t }) {
  const [name, setName] = useSessionStorage('devtools:demo-session-name', '')
  const [count, setCount] = useSessionStorage('devtools:demo-session-count', 0)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t.alertMessage}
        description={t.alertDescription}
      />
      <Input
        placeholder={t.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Text type="secondary">
        {t.savedLabelPrefix}<Text code>devtools:demo-session-name</Text>{t.savedLabelSuffix}
      </Text>
      <Tag color="blue">{name || t.empty}</Tag>

      <Space>
        <Button onClick={() => setCount((c) => c + 1)}>{t.incrementButton}</Button>
        <Tag color="purple">count = {count}</Tag>
      </Space>
    </Space>
  )
}

export default function UseSessionStorageSnippetPage() {
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
