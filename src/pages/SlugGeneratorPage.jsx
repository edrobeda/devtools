import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Segmented, Button, message } from 'antd'
import { LinkOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

function slugify(input, separator, lowercase) {
  let str = (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove marcas de acento (á -> a, ç -> c, ...)
    .replace(/[^\w\s-]/g, '') // remove tudo que não é letra/número/espaço/hífen
    .trim()
    .replace(/[\s_-]+/g, separator)

  if (lowercase) str = str.toLowerCase()
  return str.replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '')
}

const translations = {
  pt: {
    title: 'Gerador de Slug',
    intro: (
      <>
        Converte um texto livre num slug seguro pra URL: remove acentos (
        <Text code>á → a</Text>, <Text code>ç → c</Text>), troca espaços por
        um separador, remove caracteres especiais e evita separadores
        duplicados nas pontas. Diferente do conversor de case — aqui o foco é
        gerar algo pronto pra usar direto numa rota ou slug de post.
      </>
    ),
    placeholder: 'Digite um título, ex: Guia Prático de React & Hooks (2026)!',
    separator: 'Separador',
    lowercase: 'Minúsculas',
    result: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado',
    empty: 'Digite algo acima pra gerar o slug.',
  },
  en: {
    title: 'Slug Generator',
    intro: (
      <>
        Converts free text into a URL-safe slug: strips accents (
        <Text code>á → a</Text>, <Text code>ç → c</Text>), replaces spaces
        with a separator, removes special characters and avoids duplicate
        separators at the edges. Different from the case converter — the
        focus here is producing something ready to use directly in a route
        or post slug.
      </>
    ),
    placeholder: 'Type a title, e.g.: A Practical Guide to React & Hooks (2026)!',
    separator: 'Separator',
    lowercase: 'Lowercase',
    result: 'Result',
    copy: 'Copy',
    copied: 'Copied',
    empty: 'Type something above to generate the slug.',
  },
}

export default function SlugGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('Guia Prático de React & Hooks (2026)!')
  const [separator, setSeparator] = useState('-')
  const [lowercase, setLowercase] = useState(true)

  const slug = useMemo(() => slugify(input, separator, lowercase), [input, separator, lowercase])

  function copy() {
    navigator.clipboard.writeText(slug)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><LinkOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
          <Space wrap size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.separator}</Text>
              <Segmented
                value={separator}
                onChange={setSeparator}
                options={[{ label: '-', value: '-' }, { label: '_', value: '_' }]}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.lowercase}</Text>
              <Segmented
                value={lowercase ? 'yes' : 'no'}
                onChange={(v) => setLowercase(v === 'yes')}
                options={[{ label: 'a-z', value: 'yes' }, { label: 'Aa', value: 'no' }]}
              />
            </Space>
          </Space>
        </Space>
      </Card>

      <Card title={t.result}>
        {!slug ? (
          <Text type="secondary">{t.empty}</Text>
        ) : (
          <Space wrap>
            <Text code style={{ fontSize: 16, wordBreak: 'break-all' }}>{slug}</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>
          </Space>
        )}
      </Card>
    </Space>
  )
}
