import React, { useEffect, useState } from 'react'
import { Typography, Card, Space, Input, Slider } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const styleTag = `
.devtools-typewriter-cursor {
  display: inline-block;
  width: 2px;
  margin-left: 2px;
  background: currentColor;
  animation: devtools-typewriter-blink 900ms step-end infinite;
}
@keyframes devtools-typewriter-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
`

const sourceCode = `// Hook: digita e apaga uma lista de frases em loop
function useTypewriter(phrases, { typingMs = 60, deletingMs = 30, pauseMs = 1200 } = {}) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!phrases.length) return
    const current = phrases[phraseIndex % phrases.length]
    let timer

    if (!isDeleting && text === current) {
      // terminou de digitar: espera antes de começar a apagar
      timer = setTimeout(() => setIsDeleting(true), pauseMs)
    } else if (isDeleting && text === '') {
      // terminou de apagar: avança pra próxima frase
      setIsDeleting(false)
      setPhraseIndex((i) => (i + 1) % phrases.length)
    } else {
      const next = isDeleting
        ? current.slice(0, text.length - 1)
        : current.slice(0, text.length + 1)
      timer = setTimeout(() => setText(next), isDeleting ? deletingMs : typingMs)
    }

    return () => clearTimeout(timer)
  }, [text, isDeleting, phraseIndex, phrases, typingMs, deletingMs, pauseMs])

  return text
}

/* CSS do cursor piscando */
.cursor {
  display: inline-block;
  width: 2px;
  margin-left: 2px;
  background: currentColor;
  animation: blink 900ms step-end infinite;
}
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

// Uso
function Hero() {
  const text = useTypewriter(['Café ☕', 'Código 💻', 'Deploy 🚀'])
  return <h1>{text}<span className="cursor">&nbsp;</span></h1>
}`

const translations = {
  pt: {
    title: 'Componente: Efeito de Máquina de Escrever',
    intro: (
      <>
        Hook que digita e apaga uma lista de frases em loop, caractere por
        caractere, via <Text code>setTimeout</Text> encadeado — sem
        biblioteca. A cada render decide o próximo passo: ainda digitando
        (adiciona 1 caractere), pausado no final da frase, apagando (remove 1
        caractere) ou virou pra próxima frase. O cursor piscando é só CSS,{' '}
        <Text code>@keyframes</Text> alternando <Text code>opacity</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    phrasesLabel: 'Frases (uma por linha)',
    typingSpeedLabel: 'Velocidade de digitação (ms/caractere)',
    deletingSpeedLabel: 'Velocidade de apagar (ms/caractere)',
    pauseLabel: 'Pausa no final da frase (ms)',
  },
  en: {
    title: 'Component: Typewriter Effect',
    intro: (
      <>
        A hook that types and deletes a list of phrases in a loop, one
        character at a time, via chained <Text code>setTimeout</Text> calls —
        no library. On every render it decides the next step: still typing
        (add 1 character), paused at the end of a phrase, deleting (remove 1
        character), or moving on to the next phrase. The blinking cursor is
        pure CSS, <Text code>@keyframes</Text> toggling{' '}
        <Text code>opacity</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    phrasesLabel: 'Phrases (one per line)',
    typingSpeedLabel: 'Typing speed (ms/character)',
    deletingSpeedLabel: 'Deleting speed (ms/character)',
    pauseLabel: 'Pause at end of phrase (ms)',
  },
}

const DEFAULT_PHRASES = {
  pt: ['Café ☕', 'Código 💻', 'Deploy 🚀', 'Bug encontrado 🐛'],
  en: ['Coffee ☕', 'Code 💻', 'Deploy 🚀', 'Bug found 🐛'],
}

function useTypewriter(phrases, { typingMs = 60, deletingMs = 30, pauseMs = 1200 } = {}) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setText('')
    setPhraseIndex(0)
    setIsDeleting(false)
  }, [phrases])

  useEffect(() => {
    if (!phrases.length) return
    const current = phrases[phraseIndex % phrases.length] ?? ''
    let timer

    if (!isDeleting && text === current) {
      timer = setTimeout(() => setIsDeleting(true), pauseMs)
    } else if (isDeleting && text === '') {
      setIsDeleting(false)
      setPhraseIndex((i) => (i + 1) % phrases.length)
    } else {
      const next = isDeleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1)
      timer = setTimeout(() => setText(next), isDeleting ? deletingMs : typingMs)
    }

    return () => clearTimeout(timer)
  }, [text, isDeleting, phraseIndex, phrases, typingMs, deletingMs, pauseMs])

  return text
}

export default function TypewriterEffectPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [phrasesText, setPhrasesText] = useState(DEFAULT_PHRASES[lang].join('\n'))
  const [typingMs, setTypingMs] = useState(70)
  const [deletingMs, setDeletingMs] = useState(35)
  const [pauseMs, setPauseMs] = useState(1200)

  useEffect(() => {
    setPhrasesText(DEFAULT_PHRASES[lang].join('\n'))
  }, [lang])

  const phrases = phrasesText.split('\n').map((p) => p.trim()).filter(Boolean)
  const text = useTypewriter(phrases, { typingMs, deletingMs, pauseMs })

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><EditOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              fontSize: 28,
              fontWeight: 600,
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span>{text}</span>
            <span className="devtools-typewriter-cursor" style={{ height: '1em' }} />
          </div>

          <div>
            <Text type="secondary">{t.phrasesLabel}</Text>
            <TextArea
              value={phrasesText}
              onChange={(e) => setPhrasesText(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </div>

          <Space size="large" wrap align="start">
            <div style={{ width: 220 }}>
              <Text type="secondary">{t.typingSpeedLabel}: {typingMs}</Text>
              <Slider min={20} max={200} value={typingMs} onChange={setTypingMs} />
            </div>
            <div style={{ width: 220 }}>
              <Text type="secondary">{t.deletingSpeedLabel}: {deletingMs}</Text>
              <Slider min={10} max={150} value={deletingMs} onChange={setDeletingMs} />
            </div>
            <div style={{ width: 220 }}>
              <Text type="secondary">{t.pauseLabel}: {pauseMs}</Text>
              <Slider min={300} max={3000} step={100} value={pauseMs} onChange={setPauseMs} />
            </div>
          </Space>
        </Space>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
