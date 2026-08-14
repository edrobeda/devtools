import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Slider,
  Space,
  Collapse,
  Row,
  Col,
  Statistic,
  Divider,
  Progress,
  Tag,
  Button,
} from 'antd'
import { ReadOutlined, FieldTimeOutlined, SoundOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  analyzeText,
  formatDuration,
  compareToKnownWorks,
  countWords,
  DEFAULT_READING_WPM,
  DEFAULT_SPEAKING_WPM,
  SLOW_READING_WPM,
  FAST_READING_WPM,
} from '../utils/readingTimeCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input

const sampleText = `O tempo de leitura e uma metrica simples, mas poderosa, para quem produz conteudo digital. Ele ajuda a dimensionar se um texto cabe na atencao do leitor, se uma landing page esta muito longa ou se uma documentacao pode ser consumida numa unica sentada.

A media adulta em portugues fica entre 200 e 250 palavras por minuto para leitura atenta. Ja uma apresentacao falada costuma ficar entre 120 e 150 palavras por minuto, porque o ouvinte nao pode voltar o olhar como faz com o texto.

Esta ferramenta calcula tudo isso no navegador, sem enviar seu texto para nenhum servidor. Use-a para estimar artigos, e-mails, documentacoes, roteiros ou qualquer conteudo que precise de uma previsao de tempo.`

const sourceCode = `import {
  analyzeText,
  formatDuration,
  compareToKnownWorks,
} from '../utils/readingTimeCalculator'

const metrics = analyzeText(texto, 238, 130)
// metrics.readingMinutes, metrics.speakingMinutes,
// metrics.words, metrics.sentences, metrics.flesch

formatDuration(metrics.readingMinutes) // "1min 23s"
compareToKnownWorks(metrics.words)
`

const readabilityLabels = {
  veryEasy: { pt: 'Muito facil', en: 'Very easy' },
  easy: { pt: 'Facil', en: 'Easy' },
  fairlyEasy: { pt: 'Relativamente facil', en: 'Fairly easy' },
  standard: { pt: 'Padrao', en: 'Standard' },
  fairlyDifficult: { pt: 'Relativamente dificil', en: 'Fairly difficult' },
  difficult: { pt: 'Dificil', en: 'Difficult' },
  veryDifficult: { pt: 'Muito dificil', en: 'Very difficult' },
}

const translations = {
  pt: {
    title: 'Calculadora de Tempo de Leitura',
    intro: 'Estime quanto tempo leva para ler ou apresentar um texto. A ferramenta tambem mostra estatisticas basicas e um indicador de legibilidade, tudo calculado 100% no navegador.',
    inputLabel: 'Cole ou digite seu texto',
    words: 'Palavras',
    characters: 'Caracteres',
    charactersNoSpaces: 'Caracteres sem espacos',
    sentences: 'Frases',
    paragraphs: 'Paragrafos',
    syllables: 'Silabas estimadas',
    avgWordLength: 'Media de letras/palavra',
    avgSentenceLength: 'Media de palavras/frase',
    readingSpeed: 'Velocidade de leitura',
    speakingSpeed: 'Velocidade de fala',
    wpm: 'ppm',
    readingTime: 'Tempo de leitura',
    speakingTime: 'Tempo de fala',
    readability: 'Legibilidade',
    readabilityHint: 'Baseado na metrica Flesch Reading Ease adaptada (quanto maior, mais facil).',
    compareTitle: 'Comparativo',
    compareIntro: 'Seu texto em comparacao com formatos comuns:',
    tweet: 'Post (280 palavras)',
    page: 'Pagina A4 (500 palavras)',
    blogPost: 'Artigo de blog (1.500 palavras)',
    shortStory: 'Conto (7.500 palavras)',
    novel: 'Romance (90.000 palavras)',
    reset: 'Limpar',
    example: 'Exemplo',
    sourceTitle: 'Motor de calculo',
    sourceIntro: 'O motor e puro JavaScript client-side e nao envia dados para lugar nenhum.',
  },
  en: {
    title: 'Reading Time Calculator',
    intro: 'Estimate how long it takes to read or present a text. The tool also shows basic statistics and a readability score, all calculated 100% in the browser.',
    inputLabel: 'Paste or type your text',
    words: 'Words',
    characters: 'Characters',
    charactersNoSpaces: 'Characters without spaces',
    sentences: 'Sentences',
    paragraphs: 'Paragraphs',
    syllables: 'Estimated syllables',
    avgWordLength: 'Avg letters/word',
    avgSentenceLength: 'Avg words/sentence',
    readingSpeed: 'Reading speed',
    speakingSpeed: 'Speaking speed',
    wpm: 'wpm',
    readingTime: 'Reading time',
    speakingTime: 'Speaking time',
    readability: 'Readability',
    readabilityHint: 'Based on an adapted Flesch Reading Ease score (higher means easier).',
    compareTitle: 'Comparison',
    compareIntro: 'Your text compared to common formats:',
    tweet: 'Social post (280 words)',
    page: 'A4 page (500 words)',
    blogPost: 'Blog article (1,500 words)',
    shortStory: 'Short story (7,500 words)',
    novel: 'Novel (90,000 words)',
    reset: 'Clear',
    example: 'Example',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere.',
  },
}

export default function ReadingTimeCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState(sampleText)
  const [readingWpm, setReadingWpm] = useState(DEFAULT_READING_WPM)
  const [speakingWpm, setSpeakingWpm] = useState(DEFAULT_SPEAKING_WPM)

  const metrics = useMemo(
    () => analyzeText(text, readingWpm, speakingWpm),
    [text, readingWpm, speakingWpm]
  )

  const comparison = useMemo(() => compareToKnownWorks(metrics.words), [metrics.words])

  const formatNum = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', {
          maximumFractionDigits: 1,
          minimumFractionDigits: 0,
        })
      : '0'

  const readableLabel = readabilityLabels[metrics.readability]

  const knownWorkLabels = {
    tweet: t.tweet,
    page: t.page,
    blogPost: t.blogPost,
    shortStory: t.shortStory,
    novel: t.novel,
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <ReadOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{t.inputLabel}</Text>
            <Space>
              <Button size="small" onClick={() => setText(sampleText)}>
                {t.example}
              </Button>
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
                [SLOW_READING_WPM]: `${SLOW_READING_WPM} ${t.wpm}`,
                [DEFAULT_READING_WPM]: `${DEFAULT_READING_WPM} ${t.wpm}`,
                [FAST_READING_WPM]: `${FAST_READING_WPM} ${t.wpm}`,
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
                [100]: `100 ${t.wpm}`,
                [DEFAULT_SPEAKING_WPM]: `${DEFAULT_SPEAKING_WPM} ${t.wpm}`,
                [200]: `200 ${t.wpm}`,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={t.readingTime}
                  value={formatDuration(metrics.readingMinutes)}
                  valueStyle={{ fontSize: 22 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t.speakingTime}
                  value={formatDuration(metrics.speakingMinutes)}
                  valueStyle={{ fontSize: 22 }}
                />
              </Col>
              <Col span={24}>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text strong>{t.readability}: </Text>
                  <Tag color={metrics.flesch >= 60 ? 'green' : metrics.flesch >= 30 ? 'orange' : 'red'}>
                    {readableLabel ? readableLabel[lang] : metrics.readability}
                  </Tag>
                  <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}>
                    {t.readabilityHint}
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.words} value={metrics.words} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.characters} value={metrics.characters} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.charactersNoSpaces} value={metrics.charactersNoSpaces} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.sentences} value={metrics.sentences} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.paragraphs} value={metrics.paragraphs} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.syllables} value={metrics.syllables} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.avgWordLength} value={formatNum(metrics.avgWordLength)} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic title={t.avgSentenceLength} value={formatNum(metrics.avgSentenceLength)} />
          </Card>
        </Col>
      </Row>

      <Card title={t.compareTitle} style={{ marginBottom: 16 }}>
        <Paragraph>{t.compareIntro}</Paragraph>
        <Space direction="vertical" style={{ width: '100%' }}>
          {comparison.map((item) => (
            <div key={item.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text>{knownWorkLabels[item.key]}</Text>
                <Text type="secondary">{item.pct}%</Text>
              </div>
              <Progress
                percent={item.pct}
                showInfo={false}
                strokeColor={item.pct >= 100 ? '#52c41a' : '#1890ff'}
              />
            </div>
          ))}
        </Space>
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
