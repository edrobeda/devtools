import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, Descriptions } from 'antd'
import { PictureOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { convertSvgToJsx, SVG_SAMPLE } from '../utils/svgToJsx'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SNIPPET = `// SVG attributes → JSX (subset for reference)
const ATTR_MAP = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'fill-rule': 'fillRule',
  'clip-path': 'clipPath',
  'font-size': 'fontSize',
  'class': 'className',
  'viewBox': 'viewBox',         // already camelCase — unchanged
  'xlink:href': 'xlinkHref',
  // data-* and aria-* pass through unchanged
}

function render(node, depth) {
  if (node.nodeType === 3) return ind + "{\\'...\\'}"   // text
  if (node.nodeType !== 1) return ''
  const tag = node.tagName.toLowerCase()
  const attrs = buildAttrs(node.attributes)
  // void elements → <tag />;  otherwise recurse children
  return ind + '<' + tag + attrs + '>'
}`

const translations = {
  pt: {
    title: 'Conversor SVG → JSX',
    intro: (
      <>
        Cola um SVG — vindo do Figma, de um gerador online ou do
        source code do projeto — e receba a versão JSX pronta pra React:
        <Text code>stroke-width</Text> vira{' '}
        <Text code>strokeWidth</Text>,{' '}
        <Text code>fill-rule</Text> vira{' '}
        <Text code>fillRule</Text>,{' '}
        <Text code>class</Text> vira{' '}
        <Text code>className</Text>.{' '}
        Atributos <Text code>data-*</Text> e <Text code>aria-*</Text>{' '}
        passam intactos. A declaração XML é removida automaticamente.
        Tudo client-side, nada sai do navegador.
      </>
    ),
    placeholder: 'Cole o SVG aqui (com ou sem declaração <?xml?>)...',
    sample: 'Exemplo',
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar',
    inputLabel: 'SVG de entrada',
    outputLabel: 'JSX gerado',
    empty: 'Cole um SVG pra começar.',
    error: 'Erro de parsing',
    elements: 'elementos',
    chars: 'caracteres',
    note: `O conversor usa DOMParser com MIME type "image/svg+xml" pra obter o DOM real do SVG e serializa cada nó recursivamente. Atributos SVG específicos (stroke-width, fill-rule, clip-path, font-size etc.) são mapeados por um dicionário completo de 90+ entradas; qualquer atributo não-listado com hífen é camelCased por fallback. A declaração <?xml ...?> é removida antes do parsing pra evitar erros no DOMParser.`,
    sourceTitle: 'Como funciona',
    preview: 'Preview',
  },
  en: {
    title: 'SVG → JSX Converter',
    intro: (
      <>
        Paste an SVG — from Figma, an online generator, or your
        project's source code — and get the React JSX version:
        <Text code>stroke-width</Text> becomes{' '}
        <Text code>strokeWidth</Text>,{' '}
        <Text code>fill-rule</Text> becomes{' '}
        <Text code>fillRule</Text>,{' '}
        <Text code>class</Text> becomes{' '}
        <Text code>className</Text>.{' '}
        <Text code>data-*</Text> and <Text code>aria-*</Text>{' '}
        attributes pass through unchanged. The XML declaration
        is stripped automatically. All client-side, nothing
        leaves your machine.
      </>
    ),
    placeholder: 'Paste the SVG here (with or without <?xml?> declaration)...',
    sample: 'Sample',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    inputLabel: 'SVG input',
    outputLabel: 'JSX output',
    empty: 'Paste an SVG to get started.',
    error: 'Parse error',
    elements: 'elements',
    chars: 'characters',
    note: 'The converter uses DOMParser with "image/svg+xml" to get the real SVG DOM, then serialises each node recursively. SVG-specific attributes (stroke-width, fill-rule, clip-path, font-size etc.) are mapped via a 90+ entry dictionary; any unlisted hyphenated attribute is camelCased as a fallback. The <?xml ...?> declaration is stripped before parsing to avoid DOMParser errors.',
    sourceTitle: 'How it works',
    preview: 'Preview',
  },
}

export default function SvgToJsxConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!input.trim()) return { jsx: '', error: '', elements: 0, chars: 0 }
    return convertSvgToJsx(input)
  }, [input])

  function handleCopy() {
    if (!result.jsx) return
    navigator.clipboard.writeText(result.jsx).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PictureOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={10}
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
        <Space style={{ marginTop: 12 }} wrap>
          <Button onClick={() => setInput(SVG_SAMPLE)}>{t.sample}</Button>
          <Button icon={<ClearOutlined />} disabled={!input} onClick={() => { setInput(''); setCopied(false) }}>{t.clear}</Button>
          <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} disabled={!result.jsx} onClick={handleCopy}>
            {copied ? t.copied : t.copy}
          </Button>
        </Space>
      </Card>

      {result.error ? (
        <Card>
          <Alert type="error" message={t.error} description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.error}</pre>} showIcon />
        </Card>
      ) : result.jsx ? (
        <Card>
          <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
            <Descriptions.Item label={t.elements}>{result.elements}</Descriptions.Item>
            <Descriptions.Item label={t.chars}>{result.chars}</Descriptions.Item>
          </Descriptions>
          <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            <code>{result.jsx}</code>
          </pre>
        </Card>
      ) : (
        !input.trim() && <Text type="secondary">{t.empty}</Text>
      )}

      {result.jsx && (
        <Card title={t.preview}>
          <div
            dangerouslySetInnerHTML={{ __html: input }}
            style={{ display: 'flex', justifyContent: 'center', padding: 24 }}
          />
        </Card>
      )}

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}
