import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Space,
  Collapse,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Select,
  Divider,
  Slider,
} from 'antd'
import { ReadOutlined, FieldTimeOutlined, SoundOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  analyzeReadability,
  classifyFlesch,
  formatDuration,
  describeGradeLevel,
  readabilityLabels,
  gradeLabels,
  DEFAULT_READING_WPM,
  DEFAULT_SPEAKING_WPM,
  SAMPLE_TEXTS,
} from '../utils/readabilityCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input

const sourceCode = `import {
  analyzeReadability,
  classifyFlesch,
  describeGradeLevel,
} from '../utils/readabilityCalculator'

const metrics = analyzeReadability(texto, 238, 130)
// metrics.fleschReadingEase, metrics.fleschKincaidGrade,
// metrics.fogIndex, metrics.smogIndex, metrics.colemanLiau, metrics.ari

const difficulty = classifyFlesch(metrics.fleschReadingEase)
const grade = describeGradeLevel(metrics.fleschKincaidGrade)
`

const translations = {
  pt: {
    title: 'Calculadora de Legibilidade de Texto',
    intro: 'Analise a legibilidade de um texto com as principais métricas clássicas — Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau e ARI. Tudo é calculado 100% no navegador; seu texto não sai da máquina.',
    inputLabel: 'Cole ou digite seu texto',
    sampleLabel: 'Exemplo',
    sampleSimple: 'Texto simples',
    sampleArticle: 'Artigo',
    sampleTechnical: 'Técnico',
    reset: 'Limpar',
    statistics: 'Estatísticas',
    words: 'Palavras',
    sentences: 'Frases',
    paragraphs: 'Parágrafos',
    characters: 'Caracteres',
    charactersNoSpaces: 'Sem espaços',
    syllables: 'Sílabas',
    complexWords: 'Palavras complexas',
    avgWordsPerSentence: 'Média palavras/frase',
    avgSyllablesPerWord: 'Média sílabas/palavra',
    avgLettersPerWord: 'Média letras/palavra',
    readabilityScores: 'Métricas de legibilidade',
    fleschReadingEase: 'Flesch Reading Ease',
    fleschKincaidGrade: 'Flesch-Kincaid Grade',
    gunningFog: 'Gunning Fog Index',
    smog: 'Índice SMOG',
    colemanLiau: 'Coleman-Liau Index',
    ari: 'Automated Readability Index',
    difficulty: 'Nível de dificuldade',
    gradeLevel: 'Ano escolar estimado',
    readingSpeed: 'Velocidade de leitura',
    speakingSpeed: 'Velocidade de fala',
    wpm: 'ppm',
    readingTime: 'Tempo de leitura',
    speakingTime: 'Tempo de fala',
    formulasNote: 'As fórmulas foram calibradas originalmente para textos em inglês, mas os contadores funcionam para qualquer idioma.',
    score: 'Pontuação',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side e não envia dados para lugar nenhum.',
  },
  en: {
    title: 'Text Readability Calculator',
    intro: 'Analyze text readability using the classic metrics — Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau and ARI. Everything is calculated 100% in the browser; your text never leaves the machine.',
    inputLabel: 'Paste or type your text',
    sampleLabel: 'Sample',
    sampleSimple: 'Simple text',
    sampleArticle: 'Article',
    sampleTechnical: 'Technical',
    reset: 'Clear',
    statistics: 'Statistics',
    words: 'Words',
    sentences: 'Sentences',
    paragraphs: 'Paragraphs',
    characters: 'Characters',
    charactersNoSpaces: 'Without spaces',
    syllables: 'Syllables',
    complexWords: 'Complex words',
    avgWordsPerSentence: 'Avg words/sentence',
    avgSyllablesPerWord: 'Avg syllables/word',
    avgLettersPerWord: 'Avg letters/word',
    readabilityScores: 'Readability scores',
    fleschReadingEase: 'Flesch Reading Ease',
    fleschKincaidGrade: 'Flesch-Kincaid Grade',
    gunningFog: 'Gunning Fog Index',
    smog: 'SMOG Index',
    colemanLiau: 'Coleman-Liau Index',
    ari: 'Automated Readability Index',
    difficulty: 'Difficulty level',
    gradeLevel: 'Estimated grade level',
    readingSpeed: 'Reading speed',
    speakingSpeed: 'Speaking speed',
    wpm: 'wpm',
    readingTime: 'Reading time',
    speakingTime: 'Speaking time',
    formulasNote: 'The formulas were originally calibrated for English texts, but the counters work for any language.',
    score: 'Score',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere.',
  },
}

function fmt(n, digits = 1) {
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

function fmtInt(n) {
  if (!Number.isFinite(n)) return '0'
  return Math.round(n).toLocaleString()
}

export default function ReadabilityCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState(SAMPLE_TEXTS.article[lang])
  const [readingWpm, setReadingWpm] = useState(DEFAULT_READING_WPM)
  const [speakingWpm, setSpeakingWpm] = useState(DEFAULT_SPEAKING_WPM)

  const metrics = useMemo(
    () => analyzeReadability(text, readingWpm, speakingWpm),
    [text, readingWpm, speakingWpm]
  )

  const difficultyKey = useMemo(() => classifyFlesch(metrics.fleschReadingEase), [metrics.fleschReadingEase])
  const gradeKey = useMemo(() => describeGradeLevel(metrics.fleschKincaidGrade), [metrics.fleschKincaidGrade])

  const difficultyLabel = readabilityLabels[difficultyKey]?.[lang] || difficultyKey
  const gradeLabel = gradeLabels[gradeKey]?.[lang] || gradeKey

  const difficultyColor =
    metrics.fleschReadingEase >= 70 ? 'green' : metrics.fleschReadingEase >= 50 ? 'orange' : 'red'

  const handleSampleChange = (value) => {
    if (value && SAMPLE_TEXTS[value]) {
      setText(SAMPLE_TEXTS[value][lang])
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}>
        <ReadOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text strong>{t.inputLabel}</Text>
            <Space>
              <Select
                placeholder={t.sampleLabel}
                style={{ minWidth: 140 }}
                allowClear
                onChange={handleSampleChange}
                options={[
                  { value: 'simple', label: t.sampleSimple },
                  { value: 'article', label: t.sampleArticle },
                  { value: 'technical', label: t.sampleTechnical },
                ]}
              />
              <Button size="small" onClick={() => setText('')}>
                {t.reset}
              </Button>
            </Space>
          </div>
          <TextArea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            showCount
            maxLength={50000}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FieldTimeOutlined />
              <Text strong>{t.readingSpeed}</Text>
            </div>
            <Slider
              min={60}
              max={600}
              step={1}
              value={readingWpm}
              onChange={setReadingWpm}
              marks={{
                120: `120 ${t.wpm}`,
                [DEFAULT_READING_WPM]: `${DEFAULT_READING_WPM} ${t.wpm}`,
                400: `400 ${t.wpm}`,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 16 }}>
              <SoundOutlined />
              <Text strong>{t.speakingSpeed}</Text>
            </div>
            <Slider
              min={60}
              max={400}
              step={1}
              value={speakingWpm}
              onChange={setSpeakingWpm}
              marks={{
                100: `100 ${t.wpm}`,
                [DEFAULT_SPEAKING_WPM]: `${DEFAULT_SPEAKING_WPM} ${t.wpm}`,
                200: `200 ${t.wpm}`,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title={t.readingTime} value={formatDuration(metrics.readingMinutes)} valueStyle={{ fontSize: 22 }} />
              </Col>
              <Col span={12}>
                <Statistic title={t.speakingTime} value={formatDuration(metrics.speakingMinutes)} valueStyle={{ fontSize: 22 }} />
              </Col>
              <Col span={24}>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <Text strong>{t.difficulty}:</Text>
                  <Tag color={difficultyColor}>{difficultyLabel}</Tag>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <Text strong>{t.gradeLevel}:</Text>
                  <Tag>{gradeLabel}</Tag>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title={t.readabilityScores} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.fleschReadingEase} value={fmt(metrics.fleschReadingEase)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.fleschKincaidGrade} value={fmt(metrics.fleschKincaidGrade)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.gunningFog} value={fmt(metrics.fogIndex)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.smog} value={fmt(metrics.smogIndex)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.colemanLiau} value={fmt(metrics.colemanLiau)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.ari} value={fmt(metrics.ari)} />
          </Col>
        </Row>
        <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}>
          {t.formulasNote}
        </Paragraph>
      </Card>

      <Card title={t.statistics} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.words} value={fmtInt(metrics.words)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.sentences} value={fmtInt(metrics.sentences)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.paragraphs} value={fmtInt(metrics.paragraphs)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.characters} value={fmtInt(metrics.characters)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.charactersNoSpaces} value={fmtInt(metrics.charactersNoSpaces)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.syllables} value={fmtInt(metrics.syllables)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.complexWords} value={fmtInt(metrics.complexWords)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.avgWordsPerSentence} value={fmt(metrics.avgWordsPerSentence)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.avgSyllablesPerWord} value={fmt(metrics.avgSyllablesPerWord)} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.avgLettersPerWord} value={fmt(metrics.avgLettersPerWord)} />
          </Col>
        </Row>
      </Card>

      <Collapse defaultActiveKey={[]}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre
            style={{
              background: '#f6ffed',
              padding: 12,
              borderRadius: 4,
              overflow: 'auto',
              fontSize: 12,
            }}
          >
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
