import React, { useState } from 'react'
import { Typography, Card, Space, Button, Slider, Progress, Tag } from 'antd'
import { CodeOutlined, PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, FieldTimeOutlined } from '@ant-design/icons'
import useCountdown, { formatTime } from '../hooks/useCountdown'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'
import useInterval from './useInterval'

export default function useCountdown(initialSeconds = 60) {
  const [duration, setDuration] = useState(Math.max(0, Math.floor(initialSeconds)))
  const [secondsLeft, setSecondsLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setIsRunning(false)
    setSecondsLeft(duration)
  }, [duration])

  const restart = useCallback((newDuration) => {
    const next = Math.max(0, Math.floor(newDuration ?? duration))
    setDuration(next)
    setSecondsLeft(next)
    setIsRunning(false)
  }, [duration])

  useInterval(
    () => setSecondsLeft((s) => Math.max(0, s - 1)),
    isRunning && secondsLeft > 0 ? 1000 : null
  )

  useEffect(() => {
    if (secondsLeft === 0) {
      setIsRunning(false)
    }
  }, [secondsLeft])

  const progress = duration > 0 ? 1 - secondsLeft / duration : 0

  return {
    secondsLeft,
    duration,
    isRunning,
    progress,
    start,
    pause,
    reset,
    restart,
  }
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
}`

const translations = {
  pt: {
    title: 'Snippet: useCountdown',
    intro: (
      <>
        Hook declarativo de countdown — passa os segundos iniciais e recebe de
        volta o tempo restante, o progresso (0 a 1), se está rodando e funções
        para <Text code>start</Text>, <Text code>pause</Text>,{' '}
        <Text code>reset</Text> e <Text code>restart(novosSegundos)</Text>. Usa o{' '}
        <Text code>useInterval</Text> já existente do projeto, então o callback
        do tick sempre vê o estado mais recente e para automaticamente ao
        chegar em zero. O helper <Text code>formatTime</Text> converte o total de
        segundos para <Text code>mm:ss</Text>. Já está em{' '}
        <Text code>src/hooks/useCountdown.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Escolha a duração, inicie o timer e pause ou reinicie quando quiser:',
    duration: 'Duração',
    start: 'Iniciar',
    pause: 'Pausar',
    reset: 'Reiniciar',
    finished: 'Tempo esgotado',
    secondsUnit: 's',
  },
  en: {
    title: 'Snippet: useCountdown',
    intro: (
      <>
        Declarative countdown hook — pass the initial seconds and get back the
        remaining time, progress (0 to 1), whether it is running, and functions
        for <Text code>start</Text>, <Text code>pause</Text>,{' '}
        <Text code>reset</Text> and <Text code>restart(newSeconds)</Text>. It
        reuses the existing <Text code>useInterval</Text> hook from the project,
        so the tick callback always sees the freshest state and stops
        automatically when it reaches zero. The <Text code>formatTime</Text>{' '}
        helper converts the total seconds into <Text code>mm:ss</Text>. Already
        lives in <Text code>src/hooks/useCountdown.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Pick a duration, start the timer, then pause or reset it:',
    duration: 'Duration',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    finished: 'Time is up',
    secondsUnit: 's',
  },
}

function DemoUsage({ t }) {
  const [durationInput, setDurationInput] = useState(30)
  const { secondsLeft, duration, isRunning, progress, start, pause, reset, restart } =
    useCountdown(durationInput)

  const handleDurationChange = (value) => {
    setDurationInput(value)
    restart(value)
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {formatTime(secondsLeft)}
          </div>
          {secondsLeft === 0 && !isRunning && (
            <Tag color="green" style={{ marginTop: 12 }}>{t.finished}</Tag>
          )}
        </div>
      </div>

      <Progress
        percent={Math.round(progress * 100)}
        status={secondsLeft === 0 ? 'success' : 'active'}
        strokeColor={{ from: '#1677ff', to: '#52c41a' }}
        showInfo={false}
      />

      <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
        <Button
          type="primary"
          icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={isRunning ? pause : start}
          disabled={secondsLeft === 0}
        >
          {isRunning ? t.pause : t.start}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={reset}>
          {t.reset}
        </Button>
      </Space>

      <div style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}>
        <Text>
          <FieldTimeOutlined style={{ marginRight: 6 }} />
          {t.duration}: {durationInput}{t.secondsUnit}
        </Text>
        <Slider
          min={5}
          max={300}
          step={5}
          value={duration}
          onChange={handleDurationChange}
          disabled={isRunning}
        />
      </div>
    </Space>
  )
}

export default function UseCountdownSnippetPage() {
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
