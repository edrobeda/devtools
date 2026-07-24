import React from 'react'
import { Typography, Card, Space, Tag } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useMediaQuery from '../hooks/useMediaQuery'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const listener = (event) => setMatches(event.matches)

    mediaQueryList.addEventListener('change', listener)
    setMatches(mediaQueryList.matches)

    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}`

const translations = {
  pt: {
    title: 'Snippet: useMediaQuery',
    intro: (
      <>
        Hook que retorna um booleano indicando se uma media query CSS (ex:{' '}
        <Text code>'(max-width: 768px)'</Text>) está ativa no momento, e
        atualiza automaticamente quando a janela é redimensionada — via{' '}
        <Text code>window.matchMedia</Text> e o evento{' '}
        <Text code>change</Text>. Útil pra renderizar layouts responsivos
        condicionalmente em vez de depender só de CSS. Já está em{' '}
        <Text code>src/hooks/useMediaQuery.js</Text>, pronto pra importar em
        qualquer página nova.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Redimensiona a janela do navegador pra ver o valor mudar ao vivo:',
    isMobile: 'É mobile (≤768px)',
    isDesktop: 'É desktop (>768px)',
    isDark: 'Prefere tema escuro do sistema',
    isLight: 'Prefere tema claro do sistema',
  },
  en: {
    title: 'Snippet: useMediaQuery',
    intro: (
      <>
        A hook that returns a boolean telling whether a CSS media query
        (e.g. <Text code>'(max-width: 768px)'</Text>) currently matches, and
        updates automatically as the window is resized — via{' '}
        <Text code>window.matchMedia</Text> and its <Text code>change</Text>{' '}
        event. Useful for conditionally rendering responsive layouts instead
        of relying on CSS alone. It already lives in{' '}
        <Text code>src/hooks/useMediaQuery.js</Text>, ready to import in any
        new page.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Resize the browser window to see the value change live:',
    isMobile: 'Is mobile (≤768px)',
    isDesktop: 'Is desktop (>768px)',
    isDark: 'Prefers system dark theme',
    isLight: 'Prefers system light theme',
  },
}

function DemoUsage({ t }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  return (
    <Space direction="vertical">
      <Text type="secondary">{t.demoDesc}</Text>
      <Space>
        <Tag color={isMobile ? 'blue' : 'default'}>{t.isMobile}: {String(isMobile)}</Tag>
        <Tag color={!isMobile ? 'blue' : 'default'}>{t.isDesktop}: {String(!isMobile)}</Tag>
      </Space>
      <Tag color={prefersDark ? 'purple' : 'gold'}>
        {prefersDark ? t.isDark : t.isLight}
      </Tag>
    </Space>
  )
}

export default function UseMediaQuerySnippetPage() {
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
