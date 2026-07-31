import React, { useState } from 'react'
import { Typography, Card, Space, Button, InputNumber, Select, Input, message, List } from 'antd'
import { IdcardOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ALPHABETS = {
  nanoid: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  hex: '0123456789abcdef',
}

// Rejection sampling: evita bias de módulo — descarta bytes que estourariam
// a distribuição uniforme sobre o tamanho do alfabeto, igual ao pacote nanoid.
function generateId(alphabet, length) {
  const mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1
  const step = Math.ceil((1.6 * mask * length) / alphabet.length)
  let id = ''
  while (id.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(step))
    for (let i = 0; i < step && id.length < length; i++) {
      const byte = bytes[i] & mask
      if (byte < alphabet.length) id += alphabet[byte]
    }
  }
  return id
}

function generateIds(quantity, alphabet, length) {
  return Array.from({ length: quantity }, () => generateId(alphabet, length))
}

const translations = {
  pt: {
    title: 'Gerador de NanoID',
    intro: (
      <>
        Gera IDs curtos e aleatórios via <Text code>crypto.getRandomValues</Text>{' '}
        com rejection sampling — descarta bytes fora do intervalo pra evitar o
        viés de módulo, a mesma técnica usada pelo pacote <Text code>nanoid</Text>.
        Alfabeto e comprimento configuráveis, tudo local.
      </>
    ),
    quantity: 'Quantidade',
    length: 'Comprimento',
    alphabet: 'Alfabeto',
    alphabetCustom: 'Personalizado',
    customPlaceholder: 'Digite os caracteres permitidos, ex: ABC123',
    generate: 'Gerar',
    copyAll: 'Copiar tudo',
    copy: 'Copiar',
    copied: 'Copiado',
    emptyAlphabet: 'O alfabeto personalizado precisa ter pelo menos 2 caracteres.',
    alphabets: {
      nanoid: 'Padrão nanoid (A-Za-z0-9_-)',
      alphanumeric: 'Alfanumérico (A-Za-z0-9)',
      lowercase: 'Minúsculas (a-z)',
      uppercase: 'Maiúsculas (A-Z)',
      numbers: 'Somente números (0-9)',
      hex: 'Hexadecimal (0-9a-f)',
    },
  },
  en: {
    title: 'NanoID Generator',
    intro: (
      <>
        Generates short random IDs via <Text code>crypto.getRandomValues</Text>{' '}
        using rejection sampling — discards out-of-range bytes to avoid
        modulo bias, the same technique the <Text code>nanoid</Text> package
        uses. Configurable alphabet and length, all local.
      </>
    ),
    quantity: 'Quantity',
    length: 'Length',
    alphabet: 'Alphabet',
    alphabetCustom: 'Custom',
    customPlaceholder: 'Type the allowed characters, e.g.: ABC123',
    generate: 'Generate',
    copyAll: 'Copy all',
    copy: 'Copy',
    copied: 'Copied',
    emptyAlphabet: 'The custom alphabet needs at least 2 characters.',
    alphabets: {
      nanoid: 'Default nanoid (A-Za-z0-9_-)',
      alphanumeric: 'Alphanumeric (A-Za-z0-9)',
      lowercase: 'Lowercase (a-z)',
      uppercase: 'Uppercase (A-Z)',
      numbers: 'Numbers only (0-9)',
      hex: 'Hex (0-9a-f)',
    },
  },
}

export default function NanoIdGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [quantity, setQuantity] = useState(5)
  const [length, setLength] = useState(21)
  const [alphabetKey, setAlphabetKey] = useState('nanoid')
  const [customAlphabet, setCustomAlphabet] = useState('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
  const [ids, setIds] = useState(() => generateIds(5, ALPHABETS.nanoid, 21))

  const alphabet = alphabetKey === 'custom' ? customAlphabet : ALPHABETS[alphabetKey]

  function handleGenerate() {
    if (!alphabet || alphabet.length < 2) {
      message.error(t.emptyAlphabet)
      return
    }
    setIds(generateIds(quantity, alphabet, length))
  }

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.quantity}</Text>
              <InputNumber min={1} max={200} value={quantity} onChange={setQuantity} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.length}</Text>
              <InputNumber min={1} max={128} value={length} onChange={setLength} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.alphabet}</Text>
              <Select
                value={alphabetKey}
                onChange={setAlphabetKey}
                style={{ width: 260 }}
                options={[
                  ...Object.keys(ALPHABETS).map((key) => ({ value: key, label: t.alphabets[key] })),
                  { value: 'custom', label: t.alphabetCustom },
                ]}
              />
            </Space>
          </Space>
          {alphabetKey === 'custom' && (
            <Input
              value={customAlphabet}
              onChange={(e) => setCustomAlphabet(e.target.value)}
              placeholder={t.customPlaceholder}
              style={{ maxWidth: 420, fontFamily: 'monospace' }}
            />
          )}
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>{t.generate}</Button>
        </Space>
      </Card>

      <Card
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(ids.join('\n'))}>{t.copyAll}</Button>}
      >
        <List
          size="small"
          dataSource={ids}
          renderItem={(id) => (
            <List.Item
              actions={[
                <Button key="c" size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(id)} />,
              ]}
            >
              <Text code>{id}</Text>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
