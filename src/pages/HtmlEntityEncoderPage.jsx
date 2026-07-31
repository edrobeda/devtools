import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Radio, Checkbox, message } from 'antd'
import { CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const NAMED = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function encodeEntities(input, encodeNonAscii) {
  let out = input.replace(/[&<>"']/g, (ch) => NAMED[ch])
  if (encodeNonAscii) {
    out = out.replace(/[^\x00-\x7F]/gu, (ch) => `&#${ch.codePointAt(0)};`)
  }
  return out
}

// DOMParser cria um documento sem scripting habilitado — scripts dentro do
// HTML não executam, então é seguro decodificar entidades assim.
function decodeEntities(input) {
  const doc = new DOMParser().parseFromString(input, 'text/html')
  return doc.documentElement.textContent
}

const translations = {
  pt: {
    title: 'HTML Entity Encode/Decode',
    intro: (
      <>
        Codifica caracteres especiais (<Text code>&amp; &lt; &gt; " '</Text>)
        em entidades HTML nomeadas, com opção de também converter todo
        caractere não-ASCII em entidade numérica. Decodifica no sentido
        inverso via <Text code>DOMParser</Text> — o documento criado não
        executa scripts, então é seguro decodificar HTML de origem
        desconhecida sem risco de XSS na própria ferramenta.
      </>
    ),
    mode: 'Modo',
    encode: 'Codificar',
    decode: 'Decodificar',
    nonAscii: 'Também codificar não-ASCII (acentos, emoji) como &#code;',
    inputLabel: 'Entrada',
    outputLabel: 'Saída',
    inputPlaceholderEncode: 'Cole texto ou HTML aqui, ex: <div class="a">João & Cia</div>',
    inputPlaceholderDecode: 'Cole HTML com entidades aqui, ex: &lt;div&gt;Ol&aacute;&lt;/div&gt;',
    copy: 'Copiar',
    copied: 'Copiado!',
  },
  en: {
    title: 'HTML Entity Encode/Decode',
    intro: (
      <>
        Encodes special characters (<Text code>&amp; &lt; &gt; " '</Text>)
        into named HTML entities, with an option to also convert every
        non-ASCII character into a numeric entity. Decodes the other way via{' '}
        <Text code>DOMParser</Text> — the document it creates never executes
        scripts, so decoding HTML from an unknown source here is safe from XSS.
      </>
    ),
    mode: 'Mode',
    encode: 'Encode',
    decode: 'Decode',
    nonAscii: 'Also encode non-ASCII (accents, emoji) as &#code;',
    inputLabel: 'Input',
    outputLabel: 'Output',
    inputPlaceholderEncode: 'Paste text or HTML here, e.g.: <div class="a">Jack & Co</div>',
    inputPlaceholderDecode: 'Paste HTML with entities here, e.g.: &lt;div&gt;Caf&eacute;&lt;/div&gt;',
    copy: 'Copy',
    copied: 'Copied!',
  },
}

export default function HtmlEntityEncoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('encode')
  const [nonAscii, setNonAscii] = useState(false)
  const [input, setInput] = useState('<div class="greeting">João & Cia — 100% grátis!</div>')

  const output = useMemo(() => {
    if (!input) return ''
    return mode === 'encode' ? encodeEntities(input, nonAscii) : decodeEntities(input)
  }, [input, mode, nonAscii])

  function copy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text>{t.mode}:</Text>
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button">
              <Radio.Button value="encode">{t.encode}</Radio.Button>
              <Radio.Button value="decode">{t.decode}</Radio.Button>
            </Radio.Group>
          </Space>
          {mode === 'encode' && (
            <Checkbox checked={nonAscii} onChange={(e) => setNonAscii(e.target.checked)}>{t.nonAscii}</Checkbox>
          )}
          <div>
            <Text strong>{t.inputLabel}</Text>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? t.inputPlaceholderEncode : t.inputPlaceholderDecode}
              autoSize={{ minRows: 4, maxRows: 10 }}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </Space>
      </Card>

      <Card
        title={t.outputLabel}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy} disabled={!output}>{t.copy}</Button>}
      >
        <Paragraph style={{ margin: 0, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
          <Text code>{output}</Text>
        </Paragraph>
      </Card>
    </Space>
  )
}
