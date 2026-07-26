import React, { useState } from 'react'
import { Typography, Card, Space, Button, Slider, Tag } from 'antd'
import { CodeOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import useInterval from '../hooks/useInterval'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function useInterval(callback, delay) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return undefined
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}`

const translations = {
  pt: {
    title: 'Snippet: useInterval',
    intro: (
      <>
        Hook que roda um <Text code>setInterval</Text> declarativo dentro do
        React — passa uma função de callback (sempre a versão mais recente,
        via <Text code>useRef</Text>, sem precisar re-criar o interval a cada
        render) e um delay em ms. Passar <Text code>null</Text> como delay
        pausa o interval sem precisar desmontar nada. Resolve o problema
        clássico de closures desatualizadas ao usar{' '}
        <Text code>setInterval</Text> direto dentro de um{' '}
        <Text code>useEffect</Text>. Já está em{' '}
        <Text code>src/hooks/useInterval.js</Text>, pronto pra importar em
        qualquer página nova.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Contador que incrementa sozinho no intervalo escolhido:',
    play: 'Rodar',
    pause: 'Pausar',
    interval: 'Intervalo',
    ticks: 'ticks',
  },
  en: {
    title: 'Snippet: useInterval',
    intro: (
      <>
        A hook that runs a declarative <Text code>setInterval</Text> inside
        React — pass a callback function (always the latest version, via{' '}
        <Text code>useRef</Text>, without re-creating the interval on every
        render) and a delay in ms. Passing <Text code>null</Text> as the
        delay pauses the interval without unmounting anything. Solves the
        classic stale-closure problem of using <Text code>setInterval</Text>{' '}
        directly inside a <Text code>useEffect</Text>. It already lives in{' '}
        <Text code>src/hooks/useInterval.js</Text>, ready to import in any
        new page.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'A counter that ticks up on its own at the chosen interval:',
    play: 'Play',
    pause: 'Pause',
    interval: 'Interval',
    ticks: 'ticks',
  },
}

function DemoUsage({ t }) {
  const [count, setCount] = useState(0)
  const [delayMs, setDelayMs] = useState(1000)
  const [running, setRunning] = useState(true)

  useInterval(() => setCount((c) => c + 1), running ? delayMs : null)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Space align="center" size="large">
        <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
          {count} {t.ticks}
        </Tag>
        <Button
          icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? t.pause : t.play}
        </Button>
      </Space>
      <div style={{ maxWidth: 320 }}>
        <Text>{t.interval}: {delayMs}ms</Text>
        <Slider min={100} max={3000} step={100} value={delayMs} onChange={setDelayMs} />
      </div>
    </Space>
  )
}

export default function UseIntervalSnippetPage() {
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
