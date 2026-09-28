import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Tag, Alert, Tabs } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useStorage from '../hooks/useStorage'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

export default function useStorage(key, initialValue, { session = false } = {}) {
  const [value, setValue] = useState(() => {
    try {
      const store = session ? window.sessionStorage : window.localStorage
      const stored = store.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      const store = session ? window.sessionStorage : window.localStorage
      store.setItem(key, JSON.stringify(value))
    } catch {
      // storage indisponível (modo privado, quota cheia etc.) — ignora
    }
  }, [key, value, session])

  return [value, setValue]
}

export function useLocalStorage(key, initialValue) {
  return useStorage(key, initialValue)
}

export function useSessionStorage(key, initialValue) {
  return useStorage(key, initialValue, { session: true })
}`

const KINDS = {
  local: {
    storage: 'localStorage',
    nameKey: 'devtools:demo-name',
    countKey: 'devtools:demo-count',
    placeholder: {
      pt: 'Digite seu nome (recarrega a página pra ver que persiste)',
      en: 'Type your name (reload the page to see it persist)',
    },
    savedPrefix: {
      pt: 'Salvo em localStorage sob a chave ',
      en: 'Saved in localStorage under the key ',
    },
    increment: {
      pt: 'Incrementar contador persistido',
      en: 'Increment persisted counter',
    },
  },
  session: {
    storage: 'sessionStorage',
    nameKey: 'devtools:demo-session-name',
    countKey: 'devtools:demo-session-count',
    placeholder: {
      pt: 'Digite um texto (reload preserva, fechar aba limpa)',
      en: 'Type some text (reload keeps it, closing tab clears it)',
    },
    savedPrefix: {
      pt: 'Salvo em sessionStorage sob a chave ',
      en: 'Saved in sessionStorage under the key ',
    },
    increment: {
      pt: 'Incrementar contador da sessão',
      en: 'Increment session counter',
    },
  },
}

const translations = {
  pt: {
    title: 'Snippet: useStorage',
    intro: (
      <>
        Hook que funciona como <Text code>useState</Text>, mas mantém o valor
        sincronizado com o Web Storage:         <Text code>localStorage</Text> por
        padrão (preferências do usuário, rascunhos de formulário, qualquer estado
        que deve sobreviver a um refresh) ou <Text code>sessionStorage</Text> com{' '}
        <Text code>session: true</Text>, pra estado temporário de uma
        aba/jornada. Já está em <Text code>src/hooks/useStorage.js</Text>, pronto
        pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc:
      'A mesma hook nas duas abas — cada storage guarda o seu valor de forma independente (recarregue a página pra confirmar o que persiste).',
    empty: '(vazio)',
    sessionAlertMessage: 'Diferença do localStorage',
    sessionAlertDescription:
      'O valor salvo aqui sobrevive a um reload da página, mas desaparece se você fechar a aba. O localStorage persistiria mesmo depois de fechar o navegador.',
  },
  en: {
    title: 'Snippet: useStorage',
    intro: (
      <>
        A hook that behaves like <Text code>useState</Text>, but keeps the value
        in sync with the Web Storage: <Text code>localStorage</Text> by default
        (user preferences, form drafts, any state that should survive a page
        refresh) or <Text code>sessionStorage</Text> with{' '}
        <Text code>session: true</Text>, for temporary per-tab state. It
        already lives in <Text code>src/hooks/useStorage.js</Text>, ready to
        import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc:
      'The same hook on both tabs — each storage keeps its own value (reload the page to see what persists).',
    empty: '(empty)',
    sessionAlertMessage: 'Difference from localStorage',
    sessionAlertDescription:
      'The value saved here survives a page reload, but disappears if you close the tab. localStorage would persist even after closing the browser.',
  },
}

function DemoUsage({ t, kind, lang }) {
  const config = KINDS[kind]
  const session = kind === 'session'
  const [name, setName] = useStorage(config.nameKey, '', { session })
  const [count, setCount] = useStorage(config.countKey, 0, { session })

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {session && (
        <Alert
          type="info"
          showIcon
          message={t.sessionAlertMessage}
          description={t.sessionAlertDescription}
        />
      )}
      <Input
        placeholder={config.placeholder[lang]}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Text type="secondary">
        {config.savedPrefix[lang]}<Text code>{config.nameKey}</Text>:
      </Text>
      <Tag color="blue">{name || t.empty}</Tag>

      <Space>
        <Button onClick={() => setCount((c) => c + 1)}>
          {config.increment[lang]}
        </Button>
        <Tag color="purple">count = {count}</Tag>
      </Space>
    </Space>
  )
}

export default function UseLocalStorageSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [tab, setTab] = useState('local')

  const tabItems = useMemo(
    () =>
      Object.keys(KINDS).map((kind) => ({
        key: kind,
        label: <Text code>{KINDS[kind].storage}</Text>,
        children: <DemoUsage t={t} kind={kind} lang={lang} />,
      })),
    [t, lang]
  )

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
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">{t.demoDesc}</Text>
          <Tabs activeKey={tab} onChange={setTab} items={tabItems} />
        </Space>
      </Card>
    </Space>
  )
}
