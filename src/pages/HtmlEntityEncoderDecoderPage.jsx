import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, message, Switch, Segmented } from 'antd'
import { CodeOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'HTML Entity Encode/Decode',
    intro: (
      <>
        Codifica <Text code>&lt;</Text>, <Text code>&gt;</Text>,{' '}
        <Text code>&amp;</Text>, <Text code>&quot;</Text>, <Text code>&apos;</Text>{' '}
        para entidades HTML seguras. Pode também converter caracteres não-ASCII
        em entidades numéricas <Text code>&amp;#code;</Text>. A decodificação
        usa <Text code>DOMParser</Text> — seguro contra XSS, 100% no navegador.
      </>
    ),
    mode: 'Modo',
    encode: 'Codificar',
    decode: 'Decodificar',
    entityNamed: 'Entidades nomeadas (&amp;lt; etc)',
    numericAscii: 'Também converter não-ASCII para &amp;#...;',
    input: 'Entrada',
    output: 'Saída',
    copy: 'Copiar',
    copied: 'Copiado',
    placeholderInput: 'Cole o texto HTML aqui...',
    placeholderOutput: 'Resultado aparece aqui...',
    swap: 'Inverter',
    errorDecode: 'Não foi possível decodificar. Verifique a entrada.',
  },
  en: {
    title: 'HTML Entity Encode/Decode',
    intro: (
      <>
        Encodes <Text code>&lt;</Text>, <Text code>&gt;</Text>,{' '}
        <Text code>&amp;</Text>, <Text code>&quot;</Text>, <Text code>&apos;</Text>{' '}
        into safe HTML entities. Optionally convert non-ASCII characters to
        numeric entities <Text code>&amp;#code;</Text>. Decoding uses{' '}
        <Text code>DOMParser</Text> — XSS-safe, 100% in the browser.
      </>
    ),
    mode: 'Mode',
    encode: 'Encode',
    decode: 'Decode',
    entityNamed: 'Named entities (&amp;lt; etc)',
    numericAscii: 'Also convert non-ASCII to &amp;#...;',
    input: 'Input',
    output: 'Output',
    copy: 'Copy',
    copied: 'Copied',
    placeholderInput: 'Paste HTML/text here...',
    placeholderOutput: 'Result will appear here...',
    swap: 'Swap',
    errorDecode: 'Could not decode. Check input.',
  },
}

const HTML_NAMED = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export default function HtmlEntityEncoderDecoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [mode, setMode] = useState('encode')
  const [nonAscii, setNonAscii] = useState(false)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)

  const encoded = useMemo(() => {
    if (!input) return ''
    let out = input.replace(/[&<>"']/g, (ch) => HTML_NAMED[ch])
    if (nonAscii) {
      out = out.replace(/[^\x00-\x7F]/gu, (ch) => `&#${ch.codePointAt(0)};`)
    }
    return out
  }, [input, nonAscii])

  function handleEncode() {
    setError(null)
    setOutput(encoded)
  }

  function handleDecode() {
    if (!input) {
      setOutput('')
      return
    }
    try {
      const doc = new DOMParser().parseFromString(input, 'text/html')
      setOutput(doc.documentElement.textContent || '')
      setError(null)
    } catch (err) {
      setError(t.errorDecode)
      setOutput('')
    }
  }

  function handleAction() {
    if (mode === 'encode') {
      handleEncode()
    } else {
      handleDecode()
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
        <CodeOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Space>
              <Text>{t.mode}:</Text>
              <Segmented
                value={mode}
                onChange={(v) => setMode(v)}
                options={[
                  { value: 'encode', label: t.encode },
                  { value: 'decode', label: t.decode },
                ]}
              />
            </Space>
            {mode === 'encode' && (
              <Space>
                <Switch checked={nonAscii} onChange={setNonAscii} />
                <Text>{t.numericAscii}</Text>
              </Space>
            )}
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
              <Button type="primary" onClick={handleAction}>
                {mode === 'encode' ? t.encode : t.decode}
              </Button>
              <Button icon={<SwapOutlined />} onClick={handleSwap}>
                {t.swap}
              </Button>
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
