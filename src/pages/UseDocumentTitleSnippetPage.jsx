import React, { useEffect, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Input, Alert } from 'antd'
import { CodeOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef } from 'react'

export default function useDocumentTitle(initialTitle) {
  const originalTitleRef = useRef('')

  const setTitle = useCallback((title) => {
    if (typeof document === 'undefined') return
    document.title = title
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    originalTitleRef.current = document.title

    if (initialTitle) {
      setTitle(initialTitle)
    }

    return () => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current
      }
    }
  }, [initialTitle, setTitle])

  return setTitle
}

// uso:
// const setTitle = useDocumentTitle('Página inicial')
// setTitle('Nova aba')`

const translations = {
  pt: {
    title: 'Snippet: useDocumentTitle',
    intro: (
      <>
        Hook que altera o título da aba do navegador (<Text code>document.title</Text>) de forma
        reativa. Aceita um título inicial opcional e devolve uma função <Text code>setTitle</Text>{' '}
        para atualizações programáticas. O título original é salvo na montagem e restaurado
        automaticamente na desmontagem do componente — útil para páginas internas que precisam
        mostrar contexto na aba sem "sujar" o título global.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Digite um novo título ou escolha um dos presets para mudar o título desta aba:',
    customLabel: 'Título customizado',
    customPlaceholder: 'Ex: Dashboard de vendas',
    apply: 'Aplicar',
    current: 'Título atual',
    original: 'Título original',
    restore: 'Restaurar título original',
    presets: 'Presets rápidos',
    note: (
      <>
        A mudança é refletida imediatamente na aba do navegador. Ao sair desta página, o hook
        restaura o título original automaticamente. A implementação é SSR-safe: nada acontece
        quando <Text code>document</Text> não está disponível.
      </>
    ),
  },
  en: {
    title: 'Snippet: useDocumentTitle',
    intro: (
      <>
        A hook that changes the browser tab title (<Text code>document.title</Text>) reactively.
        It accepts an optional initial title and returns a <Text code>setTitle</Text> function for
        programmatic updates. The original title is saved on mount and automatically restored on
        unmount — useful for inner pages that need to show context in the tab without leaking
        the global title.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Type a new title or pick one of the presets to change this tab\'s title:',
    customLabel: 'Custom title',
    customPlaceholder: 'E.g. Sales dashboard',
    apply: 'Apply',
    current: 'Current title',
    original: 'Original title',
    restore: 'Restore original title',
    presets: 'Quick presets',
    note: (
      <>
        The change is reflected immediately in the browser tab. When you leave this page, the
        hook automatically restores the original title. The implementation is SSR-safe: nothing
        happens when <Text code>document</Text> is not available.
      </>
    ),
  },
}

const PRESETS = [
  { icon: '🔥', labelPt: 'Em produção', labelEn: 'In production' },
  { icon: '✅', labelPt: 'Tarefa concluída', labelEn: 'Task done' },
  { icon: '🚀', labelPt: 'Lançamento', labelEn: 'Launch' },
  { icon: '🐛', labelPt: 'Debug', labelEn: 'Debug' },
  { icon: '⏳', labelPt: 'Carregando...', labelEn: 'Loading...' },
]

function Demo({ t, lang }) {
  const setTitle = useDocumentTitle()
  const originalTitleRef = useRef('')
  const [custom, setCustom] = useState('')
  const [current, setCurrent] = useState('')

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    originalTitleRef.current = document.title
    setCurrent(document.title)
    return undefined
  }, [])

  const apply = (title) => {
    setTitle(title)
    setCurrent(title)
  }

  const restore = () => {
    if (originalTitleRef.current) {
      apply(originalTitleRef.current)
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Card title={t.customLabel} size="small">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t.customPlaceholder}
            prefix={<EditOutlined />}
          />
          <Button type="primary" onClick={() => apply(custom)} disabled={!custom.trim()}>
            {t.apply}
          </Button>
        </Space.Compact>
      </Card>

      <Card title={t.presets} size="small">
        <Space wrap>
          {PRESETS.map((preset) => {
            const titleText = `${preset.icon} ${lang === 'pt' ? preset.labelPt : preset.labelEn}`
            return (
              <Button key={preset.labelEn} onClick={() => apply(titleText)}>
                {titleText}
              </Button>
            )
          })}
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message={(
          <>
            {t.current}: <Text code>{current}</Text>
          </>
        )}
        description={(
          <>
            {t.original}: <Text code>{originalTitleRef.current}</Text>
          </>
        )}
      />

      <Button icon={<ReloadOutlined />} onClick={restore}>
        {t.restore}
      </Button>

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.note}
      </Paragraph>
    </Space>
  )
}

export default function UseDocumentTitleSnippetPage() {
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
        <Demo t={t} lang={lang} />
      </Card>
    </Space>
  )
}
