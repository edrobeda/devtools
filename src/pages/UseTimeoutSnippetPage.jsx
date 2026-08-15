import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Slider, Progress, Tag } from 'antd'
import { CodeOutlined, PlayCircleOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import useTimeout from '../hooks/useTimeout'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

export default function useTimeout(callback, delay) {
  const savedCallback = useRef(callback)

  // Mantém a referência mais recente da callback sem reiniciar o timer.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Inicia o timer; delay === null cancela sem desmontar o componente.
  useEffect(() => {
    if (delay === null) return undefined
    const id = setTimeout(() => savedCallback.current(), delay)
    return () => clearTimeout(id)
  }, [delay])
}`

const STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  FIRED: 'fired',
}

const translations = {
  pt: {
    title: 'Snippet: useTimeout',
    intro: (
      <>
        Hook declarativo em volta do <Text code>setTimeout</Text> do
        navegador. Passa uma callback (sempre a versão mais atualizada via{' '}
        <Text code>useRef</Text>) e um delay em ms. Usar{' '}
        <Text code>null</Text> como delay cancela o timer sem precisar
        desmontar nada. Resolve o problema da closure desatualizada quando se
        usa <Text code>setTimeout</Text> direto dentro de um{' '}
        <Text code>useEffect</Text>. Já está em{' '}
        <Text code>src/hooks/useTimeout.js</Text>, pronto pra reutilizar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Escolha um delay, inicie o timer e cancele antes que ele dispare:',
    delay: 'Delay',
    start: 'Iniciar / Reiniciar',
    cancel: 'Cancelar',
    statusIdle: 'Parado',
    statusPending: 'Aguardando...',
    statusFired: 'Disparou!',
    ms: 'ms',
    elapsed: 'decorridos',
  },
  en: {
    title: 'Snippet: useTimeout',
    intro: (
      <>
        A declarative hook around the browser's <Text code>setTimeout</Text>.
        Pass a callback (always the latest version via{' '}
        <Text code>useRef</Text>) and a delay in ms. Passing{' '}
        <Text code>null</Text> as the delay cancels the timer without
        unmounting anything. Solves the stale-closure problem of using{' '}
        <Text code>setTimeout</Text> directly inside a{' '}
        <Text code>useEffect</Text>. It already lives in{' '}
        <Text code>src/hooks/useTimeout.js</Text>, ready to reuse.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Pick a delay, start the timer and cancel it before it fires:',
    delay: 'Delay',
    start: 'Start / Restart',
    cancel: 'Cancel',
    statusIdle: 'Idle',
    statusPending: 'Pending...',
    statusFired: 'Fired!',
    ms: 'ms',
    elapsed: 'elapsed',
  },
}

function DemoUsage({ t }) {
  const [delayMs, setDelayMs] = useState(2000)
  const [status, setStatus] = useState(STATUS.IDLE)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(null)

  // O timer só está ativo quando status é PENDING.
  const activeDelay = status === STATUS.PENDING ? delayMs : null

  useTimeout(() => {
    setStatus(STATUS.FIRED)
    setElapsed(delayMs)
  }, activeDelay)

  // Anima a barra de progresso enquanto o timer está pendente.
  useEffect(() => {
    if (status !== STATUS.PENDING) return undefined
    startTimeRef.current = performance.now()
    setElapsed(0)

    let rafId
    const tick = (now) => {
      const next = Math.min(now - startTimeRef.current, delayMs)
      setElapsed(next)
      if (next < delayMs) {
        rafId = requestAnimationFrame(tick)
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [status, delayMs])

  const progressPercent = useMemo(() => {
    if (status === STATUS.IDLE) return 0
    if (status === STATUS.FIRED) return 100
    return Math.round((elapsed / delayMs) * 100)
  }, [status, elapsed, delayMs])

  const statusLabel =
    status === STATUS.IDLE ? t.statusIdle : status === STATUS.PENDING ? t.statusPending : t.statusFired

  const statusColor = status === STATUS.IDLE ? 'default' : status === STATUS.PENDING ? 'processing' : 'success'

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <div style={{ maxWidth: 360 }}>
        <Text>{t.delay}: {delayMs}{t.ms}</Text>
        <Slider
          min={500}
          max={5000}
          step={100}
          value={delayMs}
          onChange={setDelayMs}
          disabled={status === STATUS.PENDING}
        />
      </div>

      <Space>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setStatus(STATUS.PENDING)}
        >
          {t.start}
        </Button>
        <Button
          icon={<StopOutlined />}
          onClick={() => {
            setStatus(STATUS.IDLE)
            setElapsed(0)
          }}
          disabled={status !== STATUS.PENDING}
        >
          {t.cancel}
        </Button>
      </Space>

      <div style={{ maxWidth: 480 }}>
        <Progress percent={progressPercent} status={status === STATUS.FIRED ? 'success' : 'active'} showInfo={false} />
        <Space style={{ marginTop: 8 }}>
          <Tag color={statusColor} icon={status === STATUS.FIRED ? <CheckCircleOutlined /> : null}>
            {statusLabel}
          </Tag>
          <Text type="secondary">
            {Math.round(elapsed)}{t.ms} {t.elapsed}
          </Text>
        </Space>
      </div>
    </Space>
  )
}

export default function UseTimeoutSnippetPage() {
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
