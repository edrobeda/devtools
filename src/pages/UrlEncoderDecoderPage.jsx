import React, { useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, message, Segmented } from 'antd'
import { SwapOutlined, CopyOutlined, LinkOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'URL Encode/Decode',
    intro: (
      <>
        Codifica e decodifica URLs/URIs com segurança Unicode. Use{' '}
        <Text code>encodeURIComponent</Text> (componente de query) ou{' '}
        <Text code>encodeURI</Text> (URI completa). Tudo roda no navegador —
        nenhum dado sai daqui.
      </>
    ),
    mode: 'Modo',
    component: 'Componente (encodeURIComponent)',
    full: 'URI completa (encodeURI)',
    encode: 'Codificar →',
    decode: '← Decodificar',
    input: 'Entrada',
    output: 'Saída',
    copy: 'Copiar',
    copied: 'Copiado',
    placeholderInput: 'Cole ou digite a URL aqui...',
    placeholderOutput: 'Resultado aparece aqui...',
    errorDecode: 'Falha ao decodificar. Verifique se o valor está codificado corretamente.',
  },
  en: {
    title: 'URL Encode/Decode',
    intro: (
      <>
        Encode and decode URLs/URIs with Unicode safety. Use{' '}
        <Text code>encodeURIComponent</Text> (query/component) or{' '}
        <Text code>encodeURI</Text> (full URI). Everything runs in the browser —
        no data leaves this page.
      </>
    ),
    mode: 'Mode',
    component: 'Component (encodeURIComponent)',
    full: 'Full URI (encodeURI)',
    encode: 'Encode →',
    decode: '← Decode',
    input: 'Input',
    output: 'Output',
    copy: 'Copy',
    copied: 'Copied',
    placeholderInput: 'Paste or type URL here...',
    placeholderOutput: 'Result will appear here...',
    errorDecode: 'Failed to decode. Check if the value is properly encoded.',
  },
}

export default function UrlEncoderDecoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [mode, setMode] = useState('component')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)

  function handleEncode() {
    setError(null)
    try {
      if (mode === 'component') {
        setOutput(encodeURIComponent(input))
      } else {
        setOutput(encodeURI(input))
      }
    } catch (err) {
      setError(err.message)
      setOutput('')
    }
  }

  function handleDecode() {
    setError(null)
    try {
      if (mode === 'component') {
        setOutput(decodeURIComponent(input))
      } else {
        setOutput(decodeURI(input))
      }
    } catch (err) {
      setError(t.errorDecode)
      setOutput('')
    }
  }

  function handleSwap() {
    setInput(output)
    setOutput('')
    setError(null)
  }

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <LinkOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <Text>{t.mode}:</Text>
            <Segmented
              value={mode}
              onChange={(v) => setMode(v)}
              options={[
                { value: 'component', label: t.component },
                { value: 'full', label: t.full },
              ]}
            />
          </Space>

          <Card title={t.input}>
            <TextArea
              rows={6}
              placeholder={t.placeholderInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" onClick={handleEncode}>
                {t.encode}
              </Button>
              <Button onClick={handleDecode}>{t.decode}</Button>
              <Button icon={<SwapOutlined />} onClick={handleSwap} />
            </Space>
          </Card>

          {error && <Alert type="error" showIcon message={error} />}

          <Card
            title={t.output}
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={!output}
              >
                {t.copy}
              </Button>
            }
          >
            <TextArea
              rows={6}
              placeholder={t.placeholderOutput}
              value={output}
              readOnly
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
        </Space>
      </Card>
    </Space>
  )
}
