import React, { useCallback, useState } from 'react'
import { Typography, Card, Space, Button, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useClickOutside from '../hooks/useClickOutside'
import { useLanguage } from '../i18n/LanguageContext'

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

const translations = {
  pt: {
    title: 'Snippet: useClickOutside',
    intro: (
      <>
        Hook que detecta cliques fora de um elemento e dispara um callback —
        útil pra fechar dropdowns, menus e popovers customizados sem depender
        de um componente pronto. Recebe a função de fechamento e devolve um{' '}
        <Text code>ref</Text> pra anexar no elemento que deve permanecer
        "dentro". Já está em <Text code>src/hooks/useClickOutside.js</Text>,
        pronto pra importar em qualquer página nova.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    openButton: 'Abrir menu',
    closeButton: 'Fechar menu',
    clickOutsideText: 'Clique fora dessa caixa pra fechar.',
    openTag: 'aberto',
    closedTag: 'fechado',
  },
  en: {
    title: 'Snippet: useClickOutside',
    intro: (
      <>
        A hook that detects clicks outside an element and fires a callback —
        useful for closing dropdowns, menus and custom popovers without
        relying on a ready-made component. It takes the close function and
        returns a <Text code>ref</Text> to attach to the element that should
        stay "inside". It already lives in{' '}
        <Text code>src/hooks/useClickOutside.js</Text>, ready to import in
        any new page.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    openButton: 'Open menu',
    closeButton: 'Close menu',
    clickOutsideText: 'Click outside this box to close it.',
    openTag: 'open',
    closedTag: 'closed',
  },
}

function DemoUsage({ t }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useClickOutside(close)

  return (
    <Space direction="vertical">
      <Button onClick={() => setOpen((v) => !v)}>
        {open ? t.closeButton : t.openButton}
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
          <Text>{t.clickOutsideText}</Text>
        </div>
      )}
      <Tag color={open ? 'green' : 'default'}>{open ? t.openTag : t.closedTag}</Tag>
    </Space>
  )
}

export default function UseClickOutsideSnippetPage() {
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
