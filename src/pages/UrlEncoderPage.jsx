import React, { useState } from 'react'
import { Typography, Card, Space, Input, Button, Radio, message, Alert } from 'antd'
import { SwapOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'URL Encode/Decode',
    intro: (
      <>
        Codifica ou decodifica texto pra uso em URLs. <Text code>Componente</Text>{' '}
        escapa todos os caracteres reservados (uso em query strings/parâmetros,
        via <Text code>encodeURIComponent</Text>); <Text code>URI completa</Text>{' '}
        preserva <Text code>: / ? # [ ] @ &amp; =</Text> (uso em URLs inteiras,
        via <Text code>encodeURI</Text>). Tudo local, nada é enviado a lugar nenhum.
      </>
    ),
    mode: 'Modo',
    encode: 'Codificar',
    decode: 'Decodificar',
    scope: 'Escopo',
    component: 'Componente (encodeURIComponent)',
    full: 'URI completa (encodeURI)',
    inputLabel: 'Entrada',
    outputLabel: 'Saída',
    inputPlaceholder: 'Cole o texto ou URL aqui...',
    copy: 'Copiar',
    copied: 'Copiado!',
    invalid: 'Sequência inválida para decodificar (%-encoding malformado).',
  },
  en: {
    title: 'URL Encode/Decode',
    intro: (
      <>
        Encodes or decodes text for use in URLs. <Text code>Component</Text>{' '}
        escapes all reserved characters (for query strings/parameters, via{' '}
        <Text code>encodeURIComponent</Text>); <Text code>Full URI</Text>{' '}
        preserves <Text code>: / ? # [ ] @ &amp; =</Text> (for whole URLs, via{' '}
        <Text code>encodeURI</Text>). Fully local, nothing is ever sent anywhere.
      </>
    ),
    mode: 'Mode',
    encode: 'Encode',
    decode: 'Decode',
    scope: 'Scope',
    component: 'Component (encodeURIComponent)',
    full: 'Full URI (encodeURI)',
    inputLabel: 'Input',
    outputLabel: 'Output',
    inputPlaceholder: 'Paste text or a URL here...',
    copy: 'Copy',
    copied: 'Copied!',
    invalid: 'Invalid sequence to decode (malformed %-encoding).',
  },
}

export default function UrlEncoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('encode')
  const [scope, setScope] = useState('component')
  const [input, setInput] = useState('')

  let output = ''
  let error = false
  try {
    if (input) {
      if (mode === 'encode') {
        output = scope === 'component' ? encodeURIComponent(input) : encodeURI(input)
      } else {
        output = scope === 'component' ? decodeURIComponent(input) : decodeURI(input)
      }
    }
  } catch {
    error = true
  }

  function copy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Space>
              <Text>{t.mode}:</Text>
              <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button">
                <Radio.Button value="encode">{t.encode}</Radio.Button>
                <Radio.Button value="decode">{t.decode}</Radio.Button>
              </Radio.Group>
            </Space>
            <Space>
              <Text>{t.scope}:</Text>
              <Radio.Group value={scope} onChange={(e) => setScope(e.target.value)} optionType="button">
                <Radio.Button value="component">{t.component}</Radio.Button>
                <Radio.Button value="full">{t.full}</Radio.Button>
              </Radio.Group>
            </Space>
          </Space>

          <div>
            <Text strong>{t.inputLabel}</Text>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              autoSize={{ minRows: 4, maxRows: 10 }}
            />
          </div>
        </Space>
      </Card>

      {error ? (
        <Alert type="error" message={t.invalid} showIcon />
      ) : (
        <Card
          title={t.outputLabel}
          extra={<Button size="small" icon={<CopyOutlined />} onClick={copy} disabled={!output}>{t.copy}</Button>}
        >
          <Paragraph copyable={false} style={{ margin: 0, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            <Text code>{output}</Text>
          </Paragraph>
        </Card>
      )}
    </Space>
  )
}
