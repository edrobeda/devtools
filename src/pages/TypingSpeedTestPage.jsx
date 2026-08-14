import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Input, Radio, Statistic, Alert, Collapse, Tag } from 'antd'
import { ClockCircleOutlined, ReloadOutlined, TrophyOutlined, EditOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const TEXT_SAMPLES = {
  pt: 'O rápido raposo salta sobre o cão preguiçoso enquanto o sol se põe no horizonte. A cada tecla digitada, o cérebro e os dedos trabalham juntos para transformar pensamentos em palavras na tela.',
  en: 'The quick brown fox jumps over the lazy dog while the sun sets behind the hills. Every keystroke brings your thoughts closer to the screen, one word at a time, until the sentence is complete.',
}

const DURATIONS = [30, 60, 120]

const translations = {
  pt: {
    title: 'Teste de Velocidade de Digitação',
    intro: 'Meça sua velocidade de digitação em palavras por minuto (WPM) e caracteres por minuto (CPM). O timer começa automaticamente quando você digita a primeira letra.',
    duration: 'Duração',
    seconds: 'segundos',
    startTyping: 'Comece a digitar aqui...',
    restart: 'Reiniciar',
    timeLeft: 'Tempo restante',
    wpm: 'WPM',
    cpm: 'CPM',
    accuracy: 'Precisão',
    correctChars: 'Caracteres corretos',
    finished: 'Teste finalizado!',
    results: 'Resultados',
    sourceTitle: 'Algoritmo de cálculo',
    sourceDesc: 'A lógica central que conta acertos e converte o tempo decorrido em WPM/CPM.',
  },
  en: {
    title: 'Typing Speed Test',
    intro: 'Measure your typing speed in words per minute (WPM) and characters per minute (CPM). The timer starts automatically as soon as you type the first letter.',
    duration: 'Duration',
    seconds: 'seconds',
    startTyping: 'Start typing here...',
    restart: 'Restart',
    timeLeft: 'Time left',
    wpm: 'WPM',
    cpm: 'CPM',
    accuracy: 'Accuracy',
    correctChars: 'Correct chars',
    finished: 'Test finished!',
    results: 'Results',
    sourceTitle: 'Calculation algorithm',
    sourceDesc: 'The core logic that counts correct keystrokes and turns elapsed time into WPM/CPM.',
  },
}

const sourceCode = `function calculateStats(input, sample, duration, timeLeft) {
  const elapsedSeconds = duration - timeLeft
  const totalTyped = input.length

  let correct = 0
  for (let i = 0; i < totalTyped; i++) {
    if (i < sample.length && input[i] === sample[i]) {
      correct += 1
    }
  }

  const accuracy = totalTyped > 0
    ? (correct / totalTyped) * 100
    : 100

  const minutes = elapsedSeconds / 60
  const cpm = minutes > 0 ? Math.round(correct / minutes) : 0
  const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0

  return { correct, accuracy, cpm, wpm }
}`

export default function TypingSpeedTestPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const sample = useMemo(() => TEXT_SAMPLES[lang], [lang])

  const [duration, setDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeLeft(duration)
    setInput('')
    setRunning(false)
    setFinished(false)
  }, [duration, sample])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (timeLeft === 0 && running) {
      setRunning(false)
      setFinished(true)
    }
  }, [timeLeft, running])

  useEffect(() => {
    if (!running) return
    if (input.length >= sample.length) {
      setRunning(false)
      setFinished(true)
    }
  }, [input, running, sample.length])

  const stats = useMemo(() => {
    const elapsed = duration - timeLeft
    const totalTyped = input.length
    let correct = 0
    for (let i = 0; i < totalTyped; i++) {
      if (i < sample.length && input[i] === sample[i]) {
        correct += 1
      }
    }
    const accuracy = totalTyped > 0 ? (correct / totalTyped) * 100 : 100
    const minutes = elapsed / 60
    const cpm = minutes > 0 ? Math.round(correct / minutes) : 0
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0
    return { elapsed, totalTyped, correct, accuracy, cpm, wpm }
  }, [input, sample, duration, timeLeft])

  function handleInputChange(e) {
    const value = e.target.value
    if (!running && !finished && value.length > 0) {
      setRunning(true)
    }
    setInput(value)
  }

  function restart() {
    setInput('')
    setTimeLeft(duration)
    setRunning(false)
    setFinished(false)
    inputRef.current?.focus()
  }

  function handleDurationChange(value) {
    setDuration(value)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><EditOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text strong>{t.duration}:</Text>
            <Radio.Group
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              disabled={running}
            >
              {DURATIONS.map((sec) => (
                <Radio.Button key={sec} value={sec}>
                  {sec} {t.seconds}
                </Radio.Button>
              ))}
            </Radio.Group>
            <Button icon={<ReloadOutlined />} onClick={restart}>
              {t.restart}
            </Button>
          </Space>

          <div
            style={{
              fontFamily: 'monospace, monospace',
              fontSize: 18,
              lineHeight: 1.7,
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              minHeight: 120,
            }}
          >
            {sample.split('').map((char, i) => {
              let color = '#8c8c8c'
              let background = 'transparent'
              let textDecoration = 'none'
              if (i < input.length) {
                if (input[i] === char) {
                  color = '#237804'
                  background = '#f6ffed'
                } else {
                  color = '#cf1322'
                  background = '#fff1f0'
                  textDecoration = 'underline'
                }
              }
              const isCursor = i === input.length && running
              return (
                <span
                  key={i}
                  style={{
                    color,
                    background,
                    textDecoration,
                    borderRadius: 2,
                    padding: isCursor ? '0 1px' : 0,
                    borderLeft: isCursor ? '2px solid #1677ff' : '2px solid transparent',
                  }}
                >
                  {char}
                </span>
              )
            })}
            {input.length >= sample.length && (
              <span style={{ borderLeft: '2px solid #1677ff', padding: '0 1px' }} />
            )}
          </div>

          <Input.TextArea
            ref={inputRef}
            rows={4}
            value={input}
            onChange={handleInputChange}
            placeholder={t.startTyping}
            disabled={finished}
            style={{ fontSize: 16, fontFamily: 'monospace, monospace' }}
          />

          {finished && (
            <Alert
              type="success"
              showIcon
              icon={<TrophyOutlined />}
              message={t.finished}
              description={
                <Space wrap size="large">
                  <Statistic title={t.wpm} value={stats.wpm} />
                  <Statistic title={t.cpm} value={stats.cpm} />
                  <Statistic title={t.accuracy} value={`${stats.accuracy.toFixed(1)}%`} />
                  <Statistic title={t.correctChars} value={`${stats.correct} / ${sample.length}`} />
                </Space>
              }
            />
          )}

          {!finished && (
            <Space wrap size="large">
              <Statistic
                title={t.timeLeft}
                value={timeLeft}
                suffix="s"
                prefix={<ClockCircleOutlined />}
              />
              <Statistic title={t.wpm} value={stats.wpm} />
              <Statistic title={t.cpm} value={stats.cpm} />
              <Statistic title={t.accuracy} value={`${stats.accuracy.toFixed(1)}%`} />
            </Space>
          )}
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: (
              <Space>
                <Text strong>{t.sourceTitle}</Text>
                <Text type="secondary">{t.sourceDesc}</Text>
              </Space>
            ),
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{sourceCode}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
