import React from 'react'
import { Typography, Card, Space, Input, Button, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useLocalStorage from '../hooks/useLocalStorage'
import { useLanguage } from '../i18n/LanguageContext'

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
      // storage unavailable (private mode, quota full, etc.) — ignore
    }
  }, [key, value])

  return [value, setValue]
}`

const translations = {
  pt: {
    title: 'Snippet: useLocalStorage',
    intro: (
      <>
        Hook que funciona como <Text code>useState</Text>, mas mantém o valor
        sincronizado com <Text code>localStorage</Text> — útil pra preferências
        do usuário, rascunhos de formulário ou qualquer estado que deve
        sobreviver a um refresh da página. Já está em{' '}
        <Text code>src/hooks/useLocalStorage.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração (recarregue a página pra confirmar que persiste)',
    namePlaceholder: 'Digite seu nome (recarrega a página pra ver que persiste)',
    savedLabelPrefix: 'Salvo em localStorage sob a chave ',
    savedLabelSuffix: ': ',
    empty: '(vazio)',
    incrementButton: 'Incrementar contador persistido',
  },
  en: {
    title: 'Snippet: useLocalStorage',
    intro: (
      <>
        A hook that behaves like <Text code>useState</Text>, but keeps the
        value in sync with <Text code>localStorage</Text> — useful for user
        preferences, form drafts, or any state that should survive a page
        refresh. It already lives in{' '}
        <Text code>src/hooks/useLocalStorage.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo (reload the page to confirm it persists)',
    namePlaceholder: 'Type your name (reload the page to see it persist)',
    savedLabelPrefix: 'Saved in localStorage under the key ',
    savedLabelSuffix: ': ',
    empty: '(empty)',
    incrementButton: 'Increment persisted counter',
  },
}

function DemoUsage({ t }) {
  const [name, setName] = useLocalStorage('devtools:demo-name', '')
  const [count, setCount] = useLocalStorage('devtools:demo-count', 0)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        placeholder={t.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Text type="secondary">
        {t.savedLabelPrefix}<Text code>devtools:demo-name</Text>{t.savedLabelSuffix}
      </Text>
      <Tag color="blue">{name || t.empty}</Tag>

      <Space>
        <Button onClick={() => setCount((c) => c + 1)}>{t.incrementButton}</Button>
        <Tag color="purple">count = {count}</Tag>
      </Space>
    </Space>
  )
}

export default function UseLocalStorageSnippetPage() {
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
