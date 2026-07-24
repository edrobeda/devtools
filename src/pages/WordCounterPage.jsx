import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Row, Col, Statistic } from 'antd'
import { FontSizeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Contador de Palavras, Caracteres e Linhas',
    intro: (
      <>
        Cola ou digita um texto e vê contagem de palavras, caracteres (com
        e sem espaço), linhas, frases e um tempo estimado de leitura — tudo
        calculado localmente enquanto você digita.
      </>
    ),
    placeholder: 'Cole ou digite um texto aqui...',
    words: 'Palavras',
    charsWithSpaces: 'Caracteres (com espaços)',
    charsNoSpaces: 'Caracteres (sem espaços)',
    lines: 'Linhas',
    sentences: 'Frases (aprox.)',
    readingTime: 'Tempo de leitura estimado',
    minutes: 'min',
  },
  en: {
    title: 'Word, Character & Line Counter',
    intro: (
      <>
        Paste or type text and see word count, character count (with and
        without spaces), lines, sentences, and an estimated reading time —
        all computed locally as you type.
      </>
    ),
    placeholder: 'Paste or type text here...',
    words: 'Words',
    charsWithSpaces: 'Characters (with spaces)',
    charsNoSpaces: 'Characters (no spaces)',
    lines: 'Lines',
    sentences: 'Sentences (approx.)',
    readingTime: 'Estimated reading time',
    minutes: 'min',
  },
}

export default function WordCounterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const trimmed = text.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const charsWithSpaces = text.length
    const charsNoSpaces = text.replace(/\s/g, '').length
    const lines = text ? text.split('\n').length : 0
    const sentences = trimmed ? (trimmed.match(/[.!?]+(\s|$)/g) || []).length || (trimmed ? 1 : 0) : 0
    const readingMinutes = words / 200

    return { words, charsWithSpaces, charsNoSpaces, lines, sentences, readingMinutes }
  }, [text])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
        />
      </Card>

      <Card>
        <Row gutter={[24, 24]}>
          <Col xs={12} sm={8} md={4}><Statistic title={t.words} value={stats.words} /></Col>
          <Col xs={12} sm={8} md={4}><Statistic title={t.charsWithSpaces} value={stats.charsWithSpaces} /></Col>
          <Col xs={12} sm={8} md={4}><Statistic title={t.charsNoSpaces} value={stats.charsNoSpaces} /></Col>
          <Col xs={12} sm={8} md={4}><Statistic title={t.lines} value={stats.lines} /></Col>
          <Col xs={12} sm={8} md={4}><Statistic title={t.sentences} value={stats.sentences} /></Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.readingTime}
              value={stats.readingMinutes < 1 && stats.readingMinutes > 0 ? '<1' : stats.readingMinutes.toFixed(1)}
              suffix={t.minutes}
            />
          </Col>
        </Row>
      </Card>
    </Space>
  )
}
