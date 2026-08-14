import React, { useEffect, useState } from 'react'
import { Typography, Card, Space, Tag, List } from 'antd'
import { CodeOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import useWindowFocus from '../hooks/useWindowFocus'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useState } from 'react'

export default function useWindowFocus() {
  const [focused, setFocused] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.hasFocus()
  })

  const handleFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback(() => setFocused(false), [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    setFocused(document.hasFocus())
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [handleFocus, handleBlur])

  return focused
}

// uso:
// const focused = useWindowFocus()
// useEffect(() => {
//   if (focused) resumePolling()
//   else pausePolling()
// }, [focused])`

const translations = {
  pt: {
    title: 'Snippet: useWindowFocus',
    intro: (
      <>
        Hook que detecta se a janela do navegador está focada, usando os
        eventos <Text code>focus</Text> e <Text code>blur</Text> de{' '}
        <Text code>window</Text>. É diferente de visibilidade de aba: a janela
        pode estar visível mas sem foco (por exemplo, quando o usuário clica em
        outra janela sobre a mesma tela). Útil para pausar animações, suspender
        polling, salvar rascunhos ou marcar notificações como lidas quando o
        usuário volta a interagir. Implementação SSR-safe em{' '}
        <Text code>src/hooks/useWindowFocus.js</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Clique fora desta aba ou janela e volte — o card reage ao foco do navegador:',
    focused: 'Focado',
    blurred: 'Sem foco',
    instructions: 'Alterne para outra aba/janela para disparar blur.',
    historyLabel: 'Últimas mudanças',
    historyEmpty: 'Nenhuma mudança ainda.',
    eventFocus: 'focus',
    eventBlur: 'blur',
  },
  en: {
    title: 'Snippet: useWindowFocus',
    intro: (
      <>
        A hook that detects whether the browser window is focused, using{' '}
        <Text code>window</Text> <Text code>focus</Text> and{' '}
        <Text code>blur</Text> events. It is different from tab visibility: a
        window can be visible but out of focus (for example, when the user
        clicks another window on the same screen). Useful to pause animations,
        suspend polling, save drafts or mark notifications as read when the user
        starts interacting again. SSR-safe implementation in{' '}
        <Text code>src/hooks/useWindowFocus.js</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Click outside this tab or window and come back — the card reacts to browser focus:',
    focused: 'Focused',
    blurred: 'Not focused',
    instructions: 'Switch to another tab/window to trigger blur.',
    historyLabel: 'Recent changes',
    historyEmpty: 'No changes yet.',
    eventFocus: 'focus',
    eventBlur: 'blur',
  },
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function DemoUsage({ t }) {
  const focused = useWindowFocus()
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory((prev) => {
      const last = prev[0]
      if (last && last.focused === focused) return prev
      return [{ focused, time: new Date() }, ...prev].slice(0, 8)
    })
  }, [focused])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Card
        style={{
          textAlign: 'center',
          background: focused ? '#f6ffed' : '#f5f5f5',
          borderColor: focused ? '#b7eb8f' : '#d9d9d9',
          transition: 'background 150ms ease, border-color 150ms ease',
        }}
        bodyStyle={{ padding: 32 }}
      >
        <Space direction="vertical" size="small" align="center">
          {focused ? (
            <EyeOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          ) : (
            <EyeInvisibleOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />
          )}
          <Text strong style={{ fontSize: 18, color: focused ? '#389e0d' : '#595959' }}>
            {focused ? t.focused : t.blurred}
          </Text>
          <Tag color={focused ? 'success' : 'default'}>
            {focused ? 'window.focus' : 'window.blur'}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.instructions}</Text>
        </Space>
      </Card>

      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>{t.historyLabel}</Text>
        {history.length === 0 ? (
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>{t.historyEmpty}</Text>
        ) : (
          <List
            size="small"
            dataSource={history}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <Tag color={item.focused ? 'success' : 'default'}>
                    {item.focused ? t.eventFocus : t.eventBlur}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(item.time)}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>
    </Space>
  )
}

export default function UseWindowFocusSnippetPage() {
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
