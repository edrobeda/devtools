import React, { useRef, useState } from 'react'
import { Typography, Card, Space, Tag } from 'antd'
import { AimOutlined } from '@ant-design/icons'
import useEventListener from '../hooks/useEventListener'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function useEventListener(eventName, handler, target) {
  const savedHandler = useRef(handler)

  // guarda sempre a versão mais recente do handler, sem precisar
  // re-registrar o listener a cada render (evita closures desatualizadas)
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const node = target?.current ?? target ?? window
    if (!node?.addEventListener) return undefined

    const listener = (event) => savedHandler.current(event)
    node.addEventListener(eventName, listener)
    return () => node.removeEventListener(eventName, listener)
  }, [eventName, target])
}

// uso: window por padrão
// useEventListener('resize', () => console.log(window.innerWidth))
//
// uso: elemento específico via ref
// const ref = useRef(null)
// useEventListener('mousemove', handleMove, ref)`

const translations = {
  pt: {
    title: 'Snippet: useEventListener',
    intro: (
      <>
        Hook genérico pra registrar um listener de evento em qualquer alvo —{' '}
        <Text code>window</Text> por padrão, ou um elemento via{' '}
        <Text code>ref</Text>. O handler mais recente fica guardado num{' '}
        <Text code>useRef</Text>, então o <Text code>addEventListener</Text>{' '}
        só é refeito quando o evento ou o alvo mudam, não a cada render —
        evita tanto closures desatualizadas quanto listeners duplicados.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Mova o mouse dentro da caixa abaixo:',
    outside: 'Mouse fora da caixa',
  },
  en: {
    title: 'Snippet: useEventListener',
    intro: (
      <>
        A generic hook to register an event listener on any target —{' '}
        <Text code>window</Text> by default, or an element via{' '}
        <Text code>ref</Text>. The latest handler is kept in a{' '}
        <Text code>useRef</Text>, so <Text code>addEventListener</Text> only
        runs again when the event name or target change, not on every
        render — avoiding both stale closures and duplicate listeners.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Move the mouse inside the box below:',
    outside: 'Mouse outside the box',
  },
}

function DemoUsage({ t }) {
  const boxRef = useRef(null)
  const [pos, setPos] = useState(null)

  useEventListener('mousemove', (e) => {
    const rect = boxRef.current.getBoundingClientRect()
    setPos({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) })
  }, boxRef)

  useEventListener('mouseleave', () => setPos(null), boxRef)

  return (
    <Space direction="vertical">
      <Space>
        <Text type="secondary">{t.demoDesc}</Text>
        <Tag color={pos ? 'blue' : 'default'}>
          {pos ? `x: ${pos.x}, y: ${pos.y}` : t.outside}
        </Tag>
      </Space>
      <div
        ref={boxRef}
        style={{
          position: 'relative',
          height: 180,
          borderRadius: 8,
          background: '#fafafa',
          border: '1px dashed #d9d9d9',
          overflow: 'hidden',
        }}
      >
        {pos && (
          <div
            style={{
              position: 'absolute',
              left: pos.x - 5,
              top: pos.y - 5,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#1677ff',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </Space>
  )
}

export default function UseEventListenerSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><AimOutlined /> {t.title}</Title>
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
