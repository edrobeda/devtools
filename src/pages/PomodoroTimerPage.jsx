import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Progress, InputNumber, Switch, Radio, Tag } from 'antd'
import {
  ClockCircleOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  ForwardOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Ferramenta: Timer Pomodoro',
    intro: (
      <>
        Um timer Pomodoro que roda 100% no navegador — foco de{' '}
        <Text code>25</Text> minutos, pausa curta de <Text code>5</Text> e
        pausa longa de <Text code>15</Text> depois de cada <Text code>4</Text>{' '}
        blocos de foco. Um <Text code>setInterval</Text> decrementa o tempo
        restante a cada segundo só com atualização funcional de estado (sem
        closures desatualizadas); quando zera, a fase avança sozinha e o anel
        de progresso reflete a ocupação do bloco atual. Tudo local, sem API.
      </>
    ),
    phaseFocus: 'Foco',
    phaseShort: 'Pausa curta',
    phaseLong: 'Pausa longa',
    start: 'Iniciar',
    pause: 'Pausar',
    reset: 'Reiniciar',
    skip: 'Pular',
    durationsTitle: 'Durações',
    focusDuration: 'Foco (min)',
    shortDuration: 'Pausa curta (min)',
    longDuration: 'Pausa longa (min)',
    longEvery: 'Pausa longa a cada',
    focusSteps: 'blocos de foco',
    autoStart: 'Iniciar o próximo bloco sozinho',
    completedToday: (n) => `${n} ${n === 1 ? 'foco concluído' : 'focos concluídos'} hoje`,
    hint: 'Edite as durações com o timer pausado; valem a partir do próximo bloco.',
    autoSteps: 'blocos de foco',
  },
  en: {
    title: 'Tool: Pomodoro Timer',
    intro: (
      <>
        A Pomodoro timer that runs 100% in the browser — <Text code>25</Text>{' '}
        minutes of focus, a <Text code>5</Text>-minute short break and a{' '}
        <Text code>15</Text>-minute long break after every <Text code>4</Text>{' '}
        focus blocks. A <Text code>setInterval</Text> decrements the remaining
        time each second using only functional state updates (no stale
        closures); when it hits zero the phase advances on its own and the
        progress ring shows how full the current block is. Everything runs
        locally, no server involved.
      </>
    ),
    phaseFocus: 'Focus',
    phaseShort: 'Short break',
    phaseLong: 'Long break',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    skip: 'Skip',
    durationsTitle: 'Durations',
    shortDuration: 'Short break (min)',
    longDuration: 'Long break (min)',
    longEvery: 'Long break every',
    focusDuration: 'Focus (min)',
    autoStart: 'Auto-start the next block',
    autoSteps: 'focus blocks',
    completedToday: (n) => `${n} focus ${n === 1 ? 'block' : 'blocks'} done today`,
    hint: 'Edit durations while paused; they apply from the next block onwards.',
  },
}

const DEFAULT_EVERY = 4
const MIN_TO_SEC = 60

function toSeconds(mins) {
  return Math.max(1, Math.round(mins)) * MIN_TO_SEC
}

function formatTime(total) {
  const s = Math.max(0, Math.floor(total))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function PomodoroTimerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [durations, setDurations] = useState({ focus: 25, short: 5, long: 15, every: DEFAULT_EVERY })
  const [phase, setPhase] = useState('focus')
  const [seconds, setSeconds] = useState(toSeconds(25))
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [blocksInCycle, setBlocksInCycle] = useState(0)
  const [autoStart, setAutoStart] = useState(true)

  // Total de segundos do bloco atual — guardado em ref pra derivar o
  // percentual sem recriar nada a cada render.
  const totalRef = useRef(toSeconds(25))

  const isFocus = phase === 'focus'
  const total = totalRef.current
  const percent = Math.max(0, Math.min(100, ((total - seconds) / total) * 100))

  const setDuration = useCallback((key, val) => {
    setDurations((d) => ({ ...d, [key]: Math.max(1, val) }))
  }, [])

  const startPhase = useCallback((p) => {
    const secs = durations[p] * MIN_TO_SEC
    totalRef.current = secs
    setPhase(p)
    setSeconds(secs)
  }, [durations])

  // Tick — roda enquanto `running`, decrementa de 1 em 1 segundo com
  // atualização funcional (nunca lê `seconds` no closure).
  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [running])

  // Transição ao zerar o tempo.
  useEffect(() => {
    if (!running || seconds > 0) return
    const wasFocus = phase === 'focus'
    let next
    if (wasFocus) {
      // termina um foco: conta e decide entre pausa longa/curta
      setCompleted((c) => c + 1)
      if (blocksInCycle + 1 >= durations.every) {
        next = 'long'
        setBlocksInCycle(0)
      } else {
        next = 'short'
        setBlocksInCycle((b) => b + 1)
      }
    } else {
      // terminou uma pausa: volta pro foco
      next = 'focus'
    }
    startPhase(next)
    setRunning(autoStart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running, phase, blocksInCycle, durations.every, autoStart])

  const phaseNames = useMemo(
    () => ({ focus: t.phaseFocus, short: t.phaseShort, long: t.phaseLong }),
    [t]
  )

  const handleReset = useCallback(() => {
    setRunning(false)
    setBlocksInCycle(0)
    startPhase('focus')
  }, [startPhase])

  const handleSkip = useCallback(() => {
    if (!running) return
    const next = phase === 'focus' ? (blocksInCycle + 1 >= durations.every ? 'long' : 'short') : 'focus'
    startPhase(next)
    setRunning(false)
  }, [running, phase, blocksInCycle, durations.every, startPhase])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ClockCircleOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Radio.Group
              value={phase}
              optionType="button"
              buttonStyle="solid"
              disabled={running}
              onChange={(event) => startPhase(event.target.value)}
              options={[
                { label: t.phaseFocus, value: 'focus' },
                { label: t.phaseShort, value: 'short' },
                { label: t.phaseLong, value: 'long' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Progress
              type="circle"
              size={240}
              percent={Number(percent.toFixed(1))}
              strokeColor={isFocus ? '#1677ff' : '#52c41a'}
              format={() => (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 46, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(seconds)}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                    {phaseNames[phase]}
                  </div>
                </div>
              )}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Space size="middle" wrap>
              <Button
                size="large"
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => setRunning(true)}
              >
                {t.start}
              </Button>
              <Button size="large" icon={<PauseOutlined />} onClick={() => setRunning(false)}>
                {t.pause}
              </Button>
              <Button size="large" icon={<ReloadOutlined />} onClick={handleReset}>
                {t.reset}
              </Button>
              <Button size="large" icon={<ForwardOutlined />} onClick={handleSkip} disabled={!running}>
                {t.skip}
              </Button>
            </Space>
          </div>
          
          {completed > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Tag color="geekblue">{t.completedToday(completed)}</Tag>
            </div>
          )}
        </Space>
      </Card>

      <Card title={t.durationsTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space size="large" wrap>
            <div>
              <Text type="secondary">{t.focusDuration}</Text>
              <InputNumber min={1} max={120} value={durations.focus} onChange={(v) => setDuration('focus', v)} />
            </div>
            <div>
              <Text type="secondary">{t.shortDuration}</Text>
              <InputNumber min={1} max={60} value={durations.short} onChange={(v) => setDuration('short', v)} />
            </div>
            <div>
              <Text type="secondary">{t.longDuration}</Text>
              <InputNumber min={1} max={120} value={durations.long} onChange={(v) => setDuration('long', v)} />
            </div>
            <div>
              <Text type="secondary">{t.longEvery}</Text>
              <InputNumber min={1} max={12} value={durations.every} onChange={(v) => setDuration('every', v)} />
              <Text type="secondary">{t.autoSteps}</Text>
            </div>
          </Space>

          <Space>
            <Switch checked={autoStart} onChange={setAutoStart} />
            <Text>{t.autoStart}</Text>
          </Space>

          <Text type="secondary" style={{ fontStyle: 'italic' }}>{t.hint}</Text>
        </Space>
      </Card>
    </Space>
  )
}