import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, List, Button, message } from 'antd'
import { FontSizeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

function toWords(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
}

function capitalize(w) {
  return w.charAt(0).toUpperCase() + w.slice(1)
}

function buildCases(input) {
  const words = toWords(input)
  if (!words.length) return null
  return {
    camelCase: words.map((w, i) => (i === 0 ? w : capitalize(w))).join(''),
    PascalCase: words.map(capitalize).join(''),
    snake_case: words.join('_'),
    'kebab-case': words.join('-'),
    CONSTANT_CASE: words.join('_').toUpperCase(),
    'Title Case': words.map(capitalize).join(' '),
    'dot.case': words.join('.'),
    'path/case': words.join('/'),
  }
}

const translations = {
  pt: {
    title: 'Conversor de Case',
    intro: 'Converte um texto entre camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, dot.case e path/case — detectando limites de palavra automaticamente.',
    placeholder: 'Digite um texto, ex: hello world ou helloWorld ou hello_world',
    copy: 'Copiar',
    copied: 'Copiado',
    empty: 'Digite algo acima pra ver as conversões.',
  },
  en: {
    title: 'Case Converter',
    intro: 'Converts text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, dot.case and path/case — automatically detecting word boundaries.',
    placeholder: 'Type some text, e.g.: hello world or helloWorld or hello_world',
    copy: 'Copy',
    copied: 'Copied',
    empty: 'Type something above to see the conversions.',
  },
}

export default function CaseConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('hello world example')

  const cases = useMemo(() => buildCases(input), [input])

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <Card>
        {!cases ? (
          <Text type="secondary">{t.empty}</Text>
        ) : (
          <List
            dataSource={Object.entries(cases)}
            renderItem={([label, value]) => (
              <List.Item
                actions={[
                  <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(value)}>{t.copy}</Button>,
                ]}
              >
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text type="secondary">{label}</Text>
                  <Text code style={{ wordBreak: 'break-all' }}>{value}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  )
}
