import React, { useState } from 'react'
import { Typography, Card, Space, Button, Tag, Slider } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import useThrottle from '../hooks/useThrottle'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef, useState } from 'react'

export default function useThrottle(value, limitMs = 300) {
  const [throttled, setThrottled] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const remaining = limitMs - (Date.now() - lastRan.current)
    const handler = setTimeout(() => {
      setThrottled(value)
      lastRan.current = Date.now()
    }, Math.max(remaining, 0))

    return () => clearTimeout(handler)
  }, [value, limitMs])

  return throttled
}`

const translations = {
  pt: {
    title: 'Snippet: useThrottle',
    intro: (
      <>
        Hook que limita a frequência com que um valor é propagado — no
        máximo uma atualização a cada <Text code>limitMs</Text>, mesmo que o
        valor de entrada mude com muito mais frequência. Diferente do{' '}
        <Text code>useDebounce</Text> (que só reage depois que o valor
        para de mudar), o throttle continua entregando atualizações
        periódicas enquanto o valor muda continuamente — útil pra eventos de
        scroll, resize ou movimento de mouse, onde você quer reagir várias
        vezes, mas não a cada disparo. Já está em{' '}
        <Text code>src/hooks/useThrottle.js</Text>, pronto pra importar em
        qualquer página nova.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Clique rápido no botão — o contador bruto sobe a cada clique, o contador com throttle só acompanha a cada intervalo escolhido:',
    clickButton: 'Clique aqui',
    rawLabel: 'Contador bruto',
    throttledLabel: 'Contador com throttle',
    limitLabel: 'Intervalo mínimo',
  },
  en: {
    title: 'Snippet: useThrottle',
    intro: (
      <>
        A hook that limits how often a value is propagated — at most one
        update every <Text code>limitMs</Text>, even if the input value
        changes much more frequently. Unlike <Text code>useDebounce</Text>{' '}
        (which only reacts once the value stops changing), throttle keeps
        delivering periodic updates while the value keeps changing
        continuously — useful for scroll, resize, or mouse-move events,
        where you want to react multiple times but not on every single
        firing. It already lives in{' '}
        <Text code>src/hooks/useThrottle.js</Text>, ready to import in any
        new page.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Click the button rapidly — the raw counter bumps on every click, the throttled counter only catches up every chosen interval:',
    clickButton: 'Click here',
    rawLabel: 'Raw counter',
    throttledLabel: 'Throttled counter',
    limitLabel: 'Minimum interval',
  },
}

function DemoUsage({ t }) {
  const [count, setCount] = useState(0)
  const [limitMs, setLimitMs] = useState(1000)
  const throttledCount = useThrottle(count, limitMs)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Space align="center" size="large" wrap>
        <Button type="primary" onClick={() => setCount((c) => c + 1)}>{t.clickButton}</Button>
        <Space direction="vertical" size={0} align="center">
          <Text type="secondary" style={{ fontSize: 12 }}>{t.rawLabel}</Text>
          <Tag color="default" style={{ fontSize: 16, padding: '4px 12px' }}>{count}</Tag>
        </Space>
        <Space direction="vertical" size={0} align="center">
          <Text type="secondary" style={{ fontSize: 12 }}>{t.throttledLabel}</Text>
          <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>{throttledCount}</Tag>
        </Space>
      </Space>
      <div style={{ maxWidth: 320 }}>
        <Text>{t.limitLabel}: {limitMs}ms</Text>
        <Slider min={100} max={3000} step={100} value={limitMs} onChange={setLimitMs} />
      </div>
    </Space>
  )
}

export default function UseThrottleSnippetPage() {
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
