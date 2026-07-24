import React, { useState } from 'react'
import { Typography, Card, Space, Input, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useDebounce from '../hooks/useDebounce'
import { useLanguage } from '../i18n/LanguageContext'

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

const translations = {
  pt: {
    title: 'Snippet: useDebounce',
    intro: (
      <>
        Hook que atrasa a atualização de um valor até que ele pare de mudar
        por um período (<Text code>delayMs</Text>). Útil pra evitar disparar
        uma busca, chamada de API ou filtro pesado a cada tecla digitada —
        em vez disso, só reage depois que o usuário parou de digitar.
        Já está em <Text code>src/hooks/useDebounce.js</Text>, pronto pra
        importar em qualquer página nova.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    inputPlaceholder: 'Digita algo...',
    debouncedValueLabel: 'Valor com debounce (500ms): ',
    empty: '(vazio)',
  },
  en: {
    title: 'Snippet: useDebounce',
    intro: (
      <>
        A hook that delays updating a value until it stops changing for a
        period (<Text code>delayMs</Text>). Useful to avoid firing a
        search, API call or heavy filter on every keystroke — instead it
        only reacts once the user has stopped typing. It already lives in{' '}
        <Text code>src/hooks/useDebounce.js</Text>, ready to import in any
        new page.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    inputPlaceholder: 'Type something...',
    debouncedValueLabel: 'Debounced value (500ms): ',
    empty: '(empty)',
  },
}

function DemoUsage({ t }) {
  const [text, setText] = useState('')
  const debouncedText = useDebounce(text, 500)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        placeholder={t.inputPlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Text type="secondary">{t.debouncedValueLabel}</Text>
      <Tag color="blue">{debouncedText || t.empty}</Tag>
    </Space>
  )
}

export default function UseDebounceSnippetPage() {
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
