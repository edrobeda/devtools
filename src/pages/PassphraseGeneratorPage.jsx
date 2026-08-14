import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Select, Segmented, Checkbox,
  Button, InputNumber, List, Tag, Alert, Collapse, message,
} from 'antd'
import { KeyOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { generatePassphrase, generateMultiple, BITS_PER_WORD } from '../utils/passphraseGenerator'

const { Title, Paragraph, Text } = Typography

const SEPARATORS = [
  { value: ' ', label: { pt: 'Espaço', en: 'Space' } },
  { value: '-', label: { pt: 'Hífen', en: 'Hyphen' } },
  { value: '_', label: { pt: 'Underline', en: 'Underscore' } },
  { value: '.', label: { pt: 'Ponto', en: 'Dot' } },
  { value: '', label: { pt: 'Nenhum', en: 'None' } },
]

const CASE_OPTIONS = [
  { value: 'lower', label: { pt: 'minúsculas', en: 'lower' } },
  { value: 'title', label: { pt: 'Title Case', en: 'Title' } },
  { value: 'upper', label: { pt: 'MAIÚSCULAS', en: 'UPPER' } },
]

const translations = {
  pt: {
    title: 'Gerador de Passphrase',
    intro: (
      <>
        Crie frases-senha memorizáveis e fortes no estilo Diceware. Cada palavra é
        sorteada da wordlist BIP-39 (2048 palavras, ~{Math.round(BITS_PER_WORD * 100) / 100} bits de entropia cada) com{' '}
        <Text code>crypto.getRandomValues</Text> — nada sai do navegador.
      </>
    ),
    wordCount: 'Quantidade de palavras',
    separator: 'Separador',
    wordCase: 'Capitalização',
    includeNumber: 'Adicionar um número no final',
    includeSymbol: 'Adicionar um símbolo no final',
    quantity: 'Quantidade de frases',
    generate: 'Gerar',
    copy: 'Copiar',
    copyAll: 'Copiar todas',
    copied: 'Copiado!',
    resultTitle: 'Frases geradas',
    entropy: 'Entropia',
    bits: 'bits',
    tipTitle: 'Por que passphrases funcionam?',
    tipBody: (
      <>
        Comprimento vence complexidade. Uma frase com 6 palavras da BIP-39 tem cerca de 66 bits
        de entropia — muito mais fácil de lembrar que uma senha aleatória de 10 caracteres e,
        em geral, mais segura. Para contas importantes, prefira 8+ palavras e nunca reuse a
        passphrase.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'O núcleo vive em src/utils/passphraseGenerator.js. A wordlist BIP-39 é importada como array; getRandomInt usa crypto.getRandomValues com rejection sampling para evitar viés de módulo, e generatePassphrase monta a frase com separador, capitalização e extras opcionais.',
  },
  en: {
    title: 'Passphrase Generator',
    intro: (
      <>
        Create memorable and strong Diceware-style passphrases. Each word is drawn from the
        BIP-39 wordlist (2048 words, ~{Math.round(BITS_PER_WORD * 100) / 100} bits of entropy each) using{' '}
        <Text code>crypto.getRandomValues</Text> — nothing leaves the browser.
      </>
    ),
    wordCount: 'Word count',
    separator: 'Separator',
    wordCase: 'Capitalization',
    includeNumber: 'Append a number',
    includeSymbol: 'Append a symbol',
    quantity: 'Number of phrases',
    generate: 'Generate',
    copy: 'Copy',
    copyAll: 'Copy all',
    copied: 'Copied!',
    resultTitle: 'Generated phrases',
    entropy: 'Entropy',
    bits: 'bits',
    tipTitle: 'Why passphrases work',
    tipBody: (
      <>
        Length beats complexity. A 6-word BIP-39 phrase has about 66 bits of entropy — easier to
        remember than a random 10-character password and usually stronger. For important accounts,
        prefer 8+ words and never reuse the passphrase.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'The core lives in src/utils/passphraseGenerator.js. The BIP-39 wordlist is imported as an array; getRandomInt uses crypto.getRandomValues with rejection sampling to avoid modulo bias, and generatePassphrase builds the phrase with separator, capitalization and optional extras.',
  },
}

export default function PassphraseGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [wordCount, setWordCount] = useState(6)
  const [separator, setSeparator] = useState(' ')
  const [wordCase, setWordCase] = useState('lower')
  const [includeNumber, setIncludeNumber] = useState(false)
  const [includeSymbol, setIncludeSymbol] = useState(false)
  const [quantity, setQuantity] = useState(5)
  const [phrases, setPhrases] = useState(() => generateMultiple(5, {
    wordCount: 6, separator: ' ', wordCase: 'lower', includeNumber: false, includeSymbol: false,
  }))

  const options = useMemo(() => ({
    wordCount,
    separator,
    wordCase,
    includeNumber,
    includeSymbol,
  }), [wordCount, separator, wordCase, includeNumber, includeSymbol])

  const handleGenerate = () => {
    setPhrases(generateMultiple(quantity, options))
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const sepOptions = useMemo(() => SEPARATORS.map((s) => ({
    value: s.value,
    label: s.label[lang],
  })), [lang])

  const caseOptions = useMemo(() => CASE_OPTIONS.map((c) => ({
    value: c.value,
    label: c.label[lang],
  })), [lang])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text>{t.wordCount}: {wordCount}</Text>
            <Slider min={3} max={24} value={wordCount} onChange={setWordCount} />
          </div>

          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.separator}</Text>
              <Select value={separator} onChange={setSeparator} options={sepOptions} style={{ minWidth: 140 }} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.wordCase}</Text>
              <Segmented value={wordCase} onChange={setWordCase} options={caseOptions} />
            </Space>
          </Space>

          <Space direction="vertical">
            <Checkbox checked={includeNumber} onChange={(e) => setIncludeNumber(e.target.checked)}>
              {t.includeNumber}
            </Checkbox>
            <Checkbox checked={includeSymbol} onChange={(e) => setIncludeSymbol(e.target.checked)}>
              {t.includeSymbol}
            </Checkbox>
          </Space>

          <Space align="center">
            <Text>{t.quantity}</Text>
            <InputNumber min={1} max={50} value={quantity} onChange={setQuantity} />
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>
              {t.generate}
            </Button>
          </Space>
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card
        title={t.resultTitle}
        extra={(
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(phrases.map((p) => p.phrase).join('\n'))}>
            {t.copyAll}
          </Button>
        )}
      >
        <List
          dataSource={phrases}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tag key="ent" color="blue">{item.entropy} {t.bits}</Tag>,
                <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(item.phrase)}>
                  {t.copy}
                </Button>,
              ]}
            >
              <Text code style={{ wordBreak: 'break-all', fontSize: 14 }}>{item.phrase}</Text>
            </List.Item>
          )}
        />
      </Card>

      <Collapse items={[
        {
          key: 'source',
          label: t.sourceTitle,
          children: <Paragraph type="secondary">{t.sourceBody}</Paragraph>,
        },
      ]} />
    </Space>
  )
}
