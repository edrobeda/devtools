import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, InputNumber, Radio, Button, message } from 'antd'
import { FileTextOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'curabitur', 'pretium',
  'tincidunt', 'lacus', 'nulla', 'gravida', 'orci', 'vel', 'euismod', 'fringilla',
  'malesuada', 'proin', 'libero', 'nunc', 'consequat', 'interdum', 'varius',
  'sagittis', 'leo', 'purus', 'condimentum', 'lobortis', 'sapien',
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function makeSentence(startWithLorem) {
  const length = randomInt(6, 16)
  const words = []
  if (startWithLorem) {
    words.push('lorem', 'ipsum', 'dolor', 'sit', 'amet')
  }
  while (words.length < length) {
    words.push(WORDS[randomInt(0, WORDS.length - 1)])
  }
  let sentence = words.join(' ')
  // sprinkle a comma somewhere in the middle for realism
  if (words.length > 8) {
    const commaIdx = randomInt(3, words.length - 4)
    const parts = sentence.split(' ')
    parts[commaIdx] += ','
    sentence = parts.join(' ')
  }
  return capitalize(sentence) + '.'
}

function makeParagraph(sentenceCount, startWithLorem) {
  const sentences = []
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(makeSentence(startWithLorem && i === 0))
  }
  return sentences.join(' ')
}

function generate(unit, count, startWithLorem) {
  if (unit === 'words') {
    const words = []
    if (startWithLorem) words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet')
    while (words.length < count) words.push(WORDS[randomInt(0, WORDS.length - 1)])
    return words.slice(0, count).join(' ')
  }
  if (unit === 'sentences') {
    const sentences = []
    for (let i = 0; i < count; i++) sentences.push(makeSentence(startWithLorem && i === 0))
    return sentences.join(' ')
  }
  const paragraphs = []
  for (let i = 0; i < count; i++) {
    paragraphs.push(makeParagraph(randomInt(4, 7), startWithLorem && i === 0))
  }
  return paragraphs.join('\n\n')
}

const translations = {
  pt: {
    title: 'Gerador de Lorem Ipsum',
    intro: 'Gera texto de preenchimento (placeholder) em pseudo-latim, no clássico estilo Lorem Ipsum, pra maquetes e testes de layout — nunca texto real, só ruído visual proporcional.',
    unitLabel: 'Unidade',
    words: 'Palavras',
    sentences: 'Frases',
    paragraphs: 'Parágrafos',
    countLabel: 'Quantidade',
    startWithLorem: 'Começar com "Lorem ipsum dolor sit amet"',
    generate: 'Gerar',
    copy: 'Copiar',
    copied: 'Copiado!',
    resultTitle: 'Resultado',
  },
  en: {
    title: 'Lorem Ipsum Generator',
    intro: 'Generates pseudo-Latin placeholder text, in the classic Lorem Ipsum style, for mockups and layout testing — never real text, just proportional visual noise.',
    unitLabel: 'Unit',
    words: 'Words',
    sentences: 'Sentences',
    paragraphs: 'Paragraphs',
    countLabel: 'Count',
    startWithLorem: 'Start with "Lorem ipsum dolor sit amet"',
    generate: 'Generate',
    copy: 'Copy',
    copied: 'Copied!',
    resultTitle: 'Result',
  },
}

export default function LoremIpsumGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [unit, setUnit] = useState('paragraphs')
  const [count, setCount] = useState(3)
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [seed, setSeed] = useState(0)

  const output = useMemo(
    () => generate(unit, count, startWithLorem),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, count, startWithLorem, seed],
  )

  function copy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.unitLabel}</Text>
              <Radio.Group value={unit} onChange={(e) => setUnit(e.target.value)} optionType="button">
                <Radio.Button value="words">{t.words}</Radio.Button>
                <Radio.Button value="sentences">{t.sentences}</Radio.Button>
                <Radio.Button value="paragraphs">{t.paragraphs}</Radio.Button>
              </Radio.Group>
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.countLabel}</Text>
              <InputNumber min={1} max={unit === 'words' ? 500 : unit === 'sentences' ? 50 : 20} value={count} onChange={(v) => setCount(v || 1)} />
            </Space>
          </Space>
          <Radio checked={startWithLorem} onChange={(e) => setStartWithLorem(e.target.checked)}>
            {t.startWithLorem}
          </Radio>
          <Space>
            <Button type="primary" onClick={() => setSeed((s) => s + 1)}>{t.generate}</Button>
          </Space>
        </Space>
      </Card>

      <Card
        title={t.resultTitle}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{output}</Paragraph>
      </Card>
    </Space>
  )
}
