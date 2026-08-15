import React, { useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Alert,
  Input,
  Select,
  Slider,
  Button,
  Tag,
  Row,
  Col,
} from 'antd'
import {
  CodeOutlined,
  SoundOutlined,
  PauseOutlined,
  CaretRightOutlined,
  StopOutlined,
} from '@ant-design/icons'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const sourceCode = `import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function getSynth() {
  return typeof window !== 'undefined' && window.speechSynthesis
    ? window.speechSynthesis
    : null
}

function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export default function useSpeechSynthesis() {
  const synth = useRef(getSynth())
  const utteranceRef = useRef(null)

  const [voices, setVoices] = useState(() =>
    isSupported() ? synth.current.getVoices() : []
  )
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [status, setStatus] = useState({
    speaking: false,
    paused: false,
    pending: false,
  })

  const selectedVoice = useMemo(
    () => voices.find((v) => v.voiceURI === selectedVoiceURI) || voices[0] || null,
    [voices, selectedVoiceURI]
  )

  const refreshVoices = useCallback(() => {
    if (!synth.current) return
    const next = synth.current.getVoices()
    setVoices(next)
    if (!selectedVoiceURI && next.length > 0) {
      const defaultVoice = next.find((v) => v.default) || next[0]
      setSelectedVoiceURI(defaultVoice.voiceURI)
    }
  }, [selectedVoiceURI])

  useEffect(() => {
    if (!synth.current) return
    refreshVoices()
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = refreshVoices
    }
    return () => {
      if (synth.current && synth.current.onvoiceschanged !== undefined) {
        synth.current.onvoiceschanged = null
      }
    }
  }, [refreshVoices])

  const updateStatus = useCallback(() => {
    if (!synth.current) return
    setStatus({
      speaking: synth.current.speaking,
      paused: synth.current.paused,
      pending: synth.current.pending,
    })
  }, [])

  const cancel = useCallback(() => {
    if (!synth.current) return
    synth.current.cancel()
    updateStatus()
  }, [updateStatus])

  const pause = useCallback(() => {
    if (!synth.current) return
    synth.current.pause()
    updateStatus()
  }, [updateStatus])

  const resume = useCallback(() => {
    if (!synth.current) return
    synth.current.resume()
    updateStatus()
  }, [updateStatus])

  const speak = useCallback(
    (text, options = {}) => {
      if (!synth.current || !text) return

      synth.current.cancel()

      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = options.rate ?? rate
      utter.pitch = options.pitch ?? pitch
      utter.volume = options.volume ?? volume

      const voice = options.voice || selectedVoice
      if (voice) utter.voice = voice

      utter.onstart = () => updateStatus()
      utter.onend = () => updateStatus()
      utter.onpause = () => updateStatus()
      utter.onresume = () => updateStatus()
      utter.onerror = () => updateStatus()
      utter.onboundary = () => updateStatus()

      utteranceRef.current = utter
      synth.current.speak(utter)
      updateStatus()
    },
    [pitch, rate, selectedVoice, updateStatus, volume]
  )

  useEffect(() => {
    return () => {
      if (synth.current) {
        synth.current.cancel()
      }
    }
  }, [])

  return {
    supported: isSupported(),
    voices,
    selectedVoice,
    selectedVoiceURI,
    setVoice: setSelectedVoiceURI,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    speaking: status.speaking,
    paused: status.paused,
    pending: status.pending,
    speak,
    cancel,
    pause,
    resume,
  }
}`

const sampleText = {
  pt: 'Olá! Esta é uma demonstração da Web Speech API no React. Você pode ajustar a velocidade, o tom e o volume, além de escolher uma voz disponível no navegador.',
  en: 'Hello! This is a demonstration of the Web Speech API in React. You can adjust the speed, pitch and volume, plus choose a voice available in the browser.',
}

const translations = {
  pt: {
    title: 'Snippet: useSpeechSynthesis',
    intro: (
      <>
        Hook que encapsula a <Text code>Web Speech API</Text> para transformar
        texto em fala diretamente no navegador: lista as vozes instaladas,
        permite controlar velocidade, tom e volume, e expõe estados de fala,
        pausa e fila. Útil para acessibilidade, notificações faladas ou leitura
        de conteúdo. Já está em <Text code>src/hooks/useSpeechSynthesis.js</Text>,
        pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração ao vivo',
    unsupported: 'Web Speech API não está disponível neste navegador.',
    textLabel: 'Texto para falar',
    textPlaceholder: 'Digite algo para ouvir...',
    voiceLabel: 'Voz',
    defaultVoice: 'Voz padrão',
    rateLabel: 'Velocidade',
    pitchLabel: 'Tom',
    volumeLabel: 'Volume',
    speak: 'Falar',
    pause: 'Pausar',
    resume: 'Continuar',
    cancel: 'Parar',
    example: 'Exemplo',
    status: 'Status',
    statusSpeaking: 'Falando',
    statusPaused: 'Pausado',
    statusPending: 'Na fila',
    statusIdle: 'Parado',
    voicesFound: (n) => `${n} voz(es) encontrada(s)`,
  },
  en: {
    title: 'Snippet: useSpeechSynthesis',
    intro: (
      <>
        A hook that wraps the <Text code>Web Speech API</Text> to turn text into
        speech right in the browser: lists installed voices, lets you control
        speed, pitch and volume, and exposes speaking, paused and pending
        states. Useful for accessibility, spoken notifications or content
        reading. Already in <Text code>src/hooks/useSpeechSynthesis.js</Text>,
        ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Live demo',
    unsupported: 'Web Speech API is not available in this browser.',
    textLabel: 'Text to speak',
    textPlaceholder: 'Type something to hear...',
    voiceLabel: 'Voice',
    defaultVoice: 'Default voice',
    rateLabel: 'Rate',
    pitchLabel: 'Pitch',
    volumeLabel: 'Volume',
    speak: 'Speak',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Stop',
    example: 'Example',
    status: 'Status',
    statusSpeaking: 'Speaking',
    statusPaused: 'Paused',
    statusPending: 'Pending',
    statusIdle: 'Idle',
    voicesFound: (n) => `${n} voice(s) found`,
  },
}

function SpeechDemo({ t, lang }) {
  const {
    supported,
    voices,
    selectedVoiceURI,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    speaking,
    paused,
    pending,
    speak,
    cancel,
    pause,
    resume,
  } = useSpeechSynthesis()

  const [text, setText] = useState(sampleText[lang])

  if (!supported) {
    return <Alert type="warning" showIcon message={t.unsupported} />
  }

  const statusTag = speaking
    ? <Tag color="green">{t.statusSpeaking}</Tag>
    : paused
    ? <Tag color="orange">{t.statusPaused}</Tag>
    : pending
    ? <Tag color="blue">{t.statusPending}</Tag>
    : <Tag>{t.statusIdle}</Tag>

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text strong>{t.status}:</Text>
        {statusTag}
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          {t.voicesFound(voices.length)}
        </Text>
      </div>

      <div>
        <Text strong>{t.textLabel}</Text>
        <TextArea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.textPlaceholder}
          style={{ marginTop: 6 }}
        />
      </div>

      <div>
        <Text strong>{t.voiceLabel}</Text>
        <Select
          showSearch
          style={{ width: '100%', marginTop: 6 }}
          value={selectedVoiceURI || t.defaultVoice}
          onChange={setVoice}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={voices.map((v) => ({
            value: v.voiceURI,
            label: `${v.name} (${v.lang})`,
          }))}
        />
      </div>

      <Row gutter={[24, 16]}>
        <Col xs={24} md={8}>
          <Text strong>{t.rateLabel}: {rate.toFixed(1)}</Text>
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            value={rate}
            onChange={setRate}
          />
        </Col>
        <Col xs={24} md={8}>
          <Text strong>{t.pitchLabel}: {pitch.toFixed(1)}</Text>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={pitch}
            onChange={setPitch}
          />
        </Col>
        <Col xs={24} md={8}>
          <Text strong>{t.volumeLabel}: {Math.round(volume * 100)}%</Text>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={setVolume}
          />
        </Col>
      </Row>

      <Space wrap>
        <Button
          type="primary"
          icon={<SoundOutlined />}
          onClick={() => speak(text)}
          disabled={!text}
        >
          {t.speak}
        </Button>
        <Button
          icon={<PauseOutlined />}
          onClick={pause}
          disabled={!speaking || paused}
        >
          {t.pause}
        </Button>
        <Button
          icon={<CaretRightOutlined />}
          onClick={resume}
          disabled={!paused}
        >
          {t.resume}
        </Button>
        <Button
          danger
          icon={<StopOutlined />}
          onClick={cancel}
          disabled={!speaking && !paused && !pending}
        >
          {t.cancel}
        </Button>
        <Button
          onClick={() => {
            const next = sampleText[lang]
            setText(next)
            speak(next)
          }}
        >
          {t.example}
        </Button>
      </Space>
    </Space>
  )
}

export default function UseSpeechSynthesisSnippetPage() {
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
        <SpeechDemo t={t} lang={lang} />
      </Card>
    </Space>
  )
}
