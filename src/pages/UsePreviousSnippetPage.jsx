import React, { useState } from 'react'
import { Typography, Card, Space, Button, Tag } from 'antd'
import { CodeOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons'
import usePrevious from '../hooks/usePrevious'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function usePrevious(value) {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}`

const translations = {
  pt: {
    title: 'Snippet: usePrevious',
    intro: (
      <>
        Hook clássico que guarda o valor anterior de uma variável entre
        renders, via <Text code>useRef</Text> atualizado num{' '}
        <Text code>useEffect</Text> que roda depois do render — então durante
        o render atual, <Text code>ref.current</Text> ainda contém o valor da
        vez anterior. Útil pra comparar "mudou de X para Y", animar
        transições ou disparar lógica só quando um valor específico muda de
        estado. Já está em <Text code>src/hooks/usePrevious.js</Text>, pronto
        pra importar em qualquer página nova.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Muda o contador e observa o valor anterior sendo lembrado:',
    current: 'Atual',
    previous: 'Anterior',
    none: 'nenhum ainda',
  },
  en: {
    title: 'Snippet: usePrevious',
    intro: (
      <>
        A classic hook that keeps the previous value of a variable across
        renders, via a <Text code>useRef</Text> updated inside a{' '}
        <Text code>useEffect</Text> that runs after render — so during the
        current render, <Text code>ref.current</Text> still holds the value
        from last time. Useful for comparing "changed from X to Y",
        animating transitions, or firing logic only when a specific value
        changes state. It already lives in{' '}
        <Text code>src/hooks/usePrevious.js</Text>, ready to import in any
        new page.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Change the counter and watch the previous value being remembered:',
    current: 'Current',
    previous: 'Previous',
    none: 'none yet',
  },
}

function DemoUsage({ t }) {
  const [count, setCount] = useState(0)
  const previousCount = usePrevious(count)

  return (
    <Space direction="vertical">
      <Text type="secondary">{t.demoDesc}</Text>
      <Space>
        <Button icon={<MinusOutlined />} onClick={() => setCount((c) => c - 1)} />
        <Button icon={<PlusOutlined />} onClick={() => setCount((c) => c + 1)} />
      </Space>
      <Space>
        <Tag color="blue">{t.current}: {count}</Tag>
        <Tag color="purple">{t.previous}: {previousCount === undefined ? t.none : previousCount}</Tag>
      </Space>
    </Space>
  )
}

export default function UsePreviousSnippetPage() {
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
