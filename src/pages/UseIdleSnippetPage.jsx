import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Tag, Button, List, Alert } from 'antd'
import { CodeOutlined, ClockCircleOutlined, ReloadOutlined, CoffeeOutlined, ThunderboltOutlined } from '@ant-design/icons'
import useIdle from '../hooks/useIdle'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'wheel',
  'scroll',
]

export default function useIdle(options = {}) {
  const { delay = 5000, events = DEFAULT_EVENTS, initialIdle = false } = options

  const [state, setState] = useState(() => {
    if (typeof document === 'undefined') {
      return { isIdle: initialIdle, timeIdle: 0, lastActive: null }
    }
    return { isIdle: initialIdle, timeIdle: 0, lastActive: Date.now() }
  })

  const timerRef = useRef(null)
  const lastActiveRef = useRef(state.lastActive || Date.now())

  const markIdle = useCallback(() => {
    const t = Date.now()
    lastActiveRef.current = t - delay
    setState({
      isIdle: true,
      timeIdle: delay,
      lastActive: lastActiveRef.current,
    })
  }, [delay])

  const startTimer = useCallback(() => {
    if (typeof window === 'undefined') return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(markIdle, delay)
  }, [delay, markIdle])

  const handleActivity = useCallback(() => {
    const t = Date.now()
    lastActiveRef.current = t
    setState((prev) =>
      prev.isIdle
        ? { isIdle: false, timeIdle: 0, lastActive: t }
        : { ...prev, isIdle: false, timeIdle: 0, lastActive: t }
    )
    startTimer()
  }, [startTimer])

  const reset = useCallback(() => {
    handleActivity()
  }, [handleActivity])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const t = Date.now()
    lastActiveRef.current = t
    setState((prev) => ({ ...prev, lastActive: t }))
    startTimer()

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, { passive: true })
      })
    }
  }, [events, handleActivity, startTimer])

  return { ...state, reset }
}

// uso:
// const { isIdle, timeIdle, lastActive, reset } = useIdle({ delay: 3000 })
// useEffect(() => {
//   if (isIdle) pauseExpensiveUpdates()
// }, [isIdle])`

const translations = {
  pt: {
    title: 'Snippet: useIdle',
    intro: (
      <>
        Hook que detecta quando o usuário está inativo no documento por um tempo
        configurável. Escuta eventos como <Text code>mousemove</Text>,{' '}
        <Text code>keydown</Text>, <Text code>scroll</Text> etc. e dispara{' '}
        <Text code>isIdle</Text> quando nenhum evento ocorre dentro do delay.
        Útil para pausar sincronizações, esconder UI secundária, mostrar telas
        de proteção ou reduzir processamento em segundo plano. Implementação
        SSR-safe em <Text code>src/hooks/useIdle.js</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração ao vivo',
    delayLabel: 'Delay até considerar inativo',
    seconds: 's',
    active: 'Ativo',
    idle: 'Inativo',
    remaining: 'Tempo restante',
    elapsed: 'Tempo inativo',
    reset: 'Resetar timer',
    eventsLabel: 'Eventos observados',
    historyLabel: 'Histórico de transições',
    historyEmpty: 'Nenhuma transição ainda. Fique parado para virar inativo.',
    activeEvent: 'ativo',
    idleEvent: 'inativo',
    hint: 'Pare de mover/clicar/teclar nesta página para ver o estado mudar.',
  },
  en: {
    title: 'Snippet: useIdle',
    intro: (
      <>
        A hook that detects when the user has been idle on the document for a
        configurable amount of time. It listens to events such as{' '}
        <Text code>mousemove</Text>, <Text code>keydown</Text>,{' '}
        <Text code>scroll</Text> and fires <Text code>isIdle</Text> when no
        event happens within the delay. Useful to pause syncing, hide secondary
        UI, show lock screens or reduce background processing. SSR-safe
        implementation in <Text code>src/hooks/useIdle.js</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Live demo',
    delayLabel: 'Delay before considering idle',
    seconds: 's',
    active: 'Active',
    idle: 'Idle',
    remaining: 'Time remaining',
    elapsed: 'Idle time',
    reset: 'Reset timer',
    eventsLabel: 'Observed events',
    historyLabel: 'Transition history',
    historyEmpty: 'No transitions yet. Stop moving/clicking/typing to become idle.',
    activeEvent: 'active',
    idleEvent: 'idle',
    hint: 'Stop moving, clicking or typing on this page to watch the state change.',
  },
}

function formatMs(ms) {
  if (ms <= 0) return '0.0s'
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function IdleDemo({ t }) {
  const [delay, setDelay] = useState(5000)
  const options = useMemo(() => ({ delay }), [delay])
  const { isIdle, lastActive, reset } = useIdle(options)
  const [tick, setTick] = useState(0)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setHistory((prev) => {
      const last = prev[0]
      if (last && last.isIdle === isIdle) return prev
      return [{ isIdle, time: new Date() }, ...prev].slice(0, 10)
    })
  }, [isIdle])

  const nowMs = Date.now()
  const lastMs = lastActive || nowMs
  const elapsed = Math.max(0, nowMs - lastMs)
  const remaining = Math.max(0, delay - elapsed)

  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll']

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert type="info" showIcon message={t.hint} />

      <div>
        <Text strong>{t.delayLabel}</Text>
        <Slider
          min={1000}
          max={30000}
          step={1000}
          value={delay}
          onChange={setDelay}
          tooltip={{ formatter: (v) => `${v / 1000}${t.seconds}` }}
        />
      </div>

      <Card
        style={{
          textAlign: 'center',
          background: isIdle ? '#fff7e6' : '#f6ffed',
          borderColor: isIdle ? '#ffd591' : '#b7eb8f',
          transition: 'background 200ms ease, border-color 200ms ease',
        }}
        bodyStyle={{ padding: 32 }}
      >
        <Space direction="vertical" size="small" align="center">
          {isIdle ? (
            <CoffeeOutlined style={{ fontSize: 48, color: '#fa8c16' }} />
          ) : (
            <ThunderboltOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          )}
          <Text strong style={{ fontSize: 18, color: isIdle ? '#d46b08' : '#389e0d' }}>
            {isIdle ? t.idle : t.active}
          </Text>
          <Tag color={isIdle ? 'warning' : 'success'}>
            {isIdle ? `idle: ${formatMs(elapsed)}` : `${t.remaining}: ${formatMs(remaining)}`}
          </Tag>
        </Space>
      </Card>

      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={reset}>
          {t.reset}
        </Button>
      </Space>

      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>{t.eventsLabel}</Text>
        <div style={{ marginTop: 8 }}>
          {events.map((event) => (
            <Tag key={event} style={{ marginBottom: 4 }}>{event}</Tag>
          ))}
        </div>
      </div>

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
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                  <Tag color={item.isIdle ? 'warning' : 'success'}>
                    {item.isIdle ? t.idleEvent : t.activeEvent}
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

export default function UseIdleSnippetPage() {
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
        <IdleDemo t={t} />
      </Card>
    </Space>
  )
}
