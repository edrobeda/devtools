import React, { useEffect, useState } from 'react'
import { Typography, Card, Space, Tag, Button, List } from 'antd'
import { CodeOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import usePageVisibility from '../hooks/usePageVisibility'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

function getVisible() {
  if (typeof document === 'undefined') return true
  return !document.hidden
}

export default function usePageVisibility() {
  const [visible, setVisible] = useState(getVisible)

  useEffect(() => {
    const handle = () => setVisible(getVisible())
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [])

  return visible
}

// uso:
// const visible = usePageVisibility()
// useEffect(() => {
//   if (!visible) pauseBackgroundTasks()
// }, [visible])`

const translations = {
  pt: {
    title: 'Snippet: usePageVisibility',
    intro: (
      <>
        Hook que escuta o evento <Text code>visibilitychange</Text> do documento
        e retorna um booleano indicando se a aba/janela está visível. Ideal para
        pausar animações, vídeos, polling em segundo plano ou registrar tempo de
        foco na página.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Status de visibilidade detectado nesta aba agora:',
    visible: 'Aba visível',
    hidden: 'Aba oculta',
    simulateLabel: 'Simular mudança de visibilidade',
    historyTitle: 'Histórico de mudanças',
    historyEmpty: 'Ainda não houve mudança de visibilidade.',
    timeFormat: (time) => time.toLocaleTimeString('pt-BR', { hour12: false }),
    note: (
      <>
        Dica: em navegadores modernos o evento dispara ao minimizar a janela,
        trocar de aba ou abrir outro app. O botão acima simula o evento para
        testar sem precisar sair da página.
      </>
    ),
  },
  en: {
    title: 'Snippet: usePageVisibility',
    intro: (
      <>
        A hook that listens to the document <Text code>visibilitychange</Text>{' '}
        event and returns a boolean telling whether the tab/window is visible.
        Great for pausing animations, videos, background polling or tracking page
        focus time.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Visibility status detected in this tab right now:',
    visible: 'Tab visible',
    hidden: 'Tab hidden',
    simulateLabel: 'Simulate visibility change',
    historyTitle: 'Visibility history',
    historyEmpty: 'No visibility change yet.',
    timeFormat: (time) => time.toLocaleTimeString('en-US', { hour12: false }),
    note: (
      <>
        Tip: modern browsers fire this event when you minimize the window, switch
        tabs or open another app. The button above simulates the event so you can
        test without leaving the page.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const visible = usePageVisibility()
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory((prev) => [
      { visible, time: new Date() },
      ...prev.slice(0, 9),
    ])
  }, [visible])

  const simulate = () => {
    document.hidden = !document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
    // restaura o estado real logo em seguida para não travar a aba no modo "oculto"
    requestAnimationFrame(() => {
      document.hidden = false
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Tag
        color={visible ? 'green' : 'default'}
        icon={visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        style={{ fontSize: 14, padding: '4px 8px' }}
      >
        {visible ? t.visible : t.hidden}
      </Tag>

      <Button onClick={simulate}>{t.simulateLabel}</Button>

      <Card
        type="inner"
        title={t.historyTitle}
        size="small"
        styles={{ body: { padding: 0 } }}
      >
        <List
          size="small"
          dataSource={history}
          locale={{ emptyText: t.historyEmpty }}
          renderItem={(item) => (
            <List.Item>
              <Text code>{t.timeFormat(item.time)}</Text>{' '}
              <Tag color={item.visible ? 'green' : 'default'}>
                {item.visible ? t.visible : t.hidden}
              </Tag>
            </List.Item>
          )}
        />
      </Card>

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.note}
      </Paragraph>
    </Space>
  )
}

export default function UsePageVisibilitySnippetPage() {
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
