import React from 'react'
import { Typography, Card, Space, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useWindowSize from '../hooks/useWindowSize'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

export default function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}`

const translations = {
  pt: {
    title: 'Snippet: useWindowSize',
    intro: (
      <>
        Hook que devolve <Text code>width</Text>/<Text code>height</Text> da
        janela e se mantém atualizado sozinho, ouvindo o evento{' '}
        <Text code>resize</Text> do <Text code>window</Text>. Útil pra lógica
        condicional em JS que depende do tamanho da tela — pra CSS puro,
        media queries continuam sendo a opção mais barata (ver{' '}
        <Text code>useMediaQuery</Text>).
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Redimensiona a janela do navegador e observa os valores mudarem ao vivo:',
    width: 'Largura',
    height: 'Altura',
  },
  en: {
    title: 'Snippet: useWindowSize',
    intro: (
      <>
        A hook that returns the window's <Text code>width</Text>/
        <Text code>height</Text> and keeps itself updated by listening to the{' '}
        <Text code>window</Text>'s <Text code>resize</Text> event. Useful for
        conditional JS logic that depends on screen size — for pure CSS,
        media queries are still the cheaper option (see{' '}
        <Text code>useMediaQuery</Text>).
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Resize the browser window and watch the values update live:',
    width: 'Width',
    height: 'Height',
  },
}

function DemoUsage({ t }) {
  const { width, height } = useWindowSize()

  return (
    <Space direction="vertical">
      <Text type="secondary">{t.demoDesc}</Text>
      <Space>
        <Tag color="blue">{t.width}: {width}px</Tag>
        <Tag color="purple">{t.height}: {height}px</Tag>
      </Space>
    </Space>
  )
}

export default function UseWindowSizeSnippetPage() {
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
