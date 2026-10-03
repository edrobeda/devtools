import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, Descriptions } from 'antd'
import { FileMarkdownOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { convertMarkupToJsx } from '../utils/jsxConverter'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Conversor mínimo(porém sólido) de HTML -> JSX, demonstrado na página:
// DOMParser + text/html entrega o DOM, e a serialização mapeia atributos
// e filhos recursivamente. Sem dependência externa.
const SNIPPET = `const ATTR_MAP = {
  class: 'className', 'for': 'htmlFor',
  maxlength: 'maxLength', tabindex: 'tabIndex',
  readonly: 'readOnly', colspan: 'colSpan', ...
}

function render(node, depth) {
  const ind = '  '.repeat(depth)
  if (node.nodeType === 3) {                    // texto
    if (!node.nodeValue.trim()) return ''
    return ind + "{'...'}"                      // sempre em braço literal
  }
  if (node.nodeType === 8) return ind + '{/*...*/}'
  if (node.nodeType !== 1) return ''
  const tag = node.tagName.toLowerCase()
  const attrs = buildAttrs(node.attributes)     // className, htmlFor, style={{...}}
  // void elements (img, br, input...) sempre <tag /> em JSX
  if (VOID_ELEMENTS.has(tag)) return ind + '<' + tag + attrs + ' />'
  const kids = [...node.childNodes].map(c => render(c, depth + 1)).filter(Boolean)
  if (!kids.length) return ind + '<' + tag + attrs + ' />'
  return ind + '<' + tag + attrs + '>\\n' + kids.join('\\n') + '\\n' + ind + '</' + tag + '>'
}`

const SAMPLE = `<!-- lista de cards -->
<div class="grid">
  <article class="card" id="c1">
    <img src="/img/thumb.png" alt="miniatura" />
    <h3>Olá, mundo!</h3>
    <p style="color: #333; font-size: 14px; line-height: 1.5;">
      Um parágrafo com <strong>destaque</strong>, uma lista vazia (input:
      <input type="text" maxlength="20" disabled> some) e um comentário.
    </p>
  </article>
</div>`

const translations = {
  pt: {
    title: 'Conversor HTML → JSX',
    intro: (
      <>
        Cola um trecho de HTML e recebe a versão JSX/React pronta pra usar —
        <Text code>class</Text> vira <Text code>className</Text>,{' '}
        <Text code>for</Text> vira <Text code>htmlFor</Text>, atributos em
        kebab-case viram camelCase, <Text code>style</Text> vira{' '}
        <Text code>{'{...}'}</Text> e tag vazia/void vira{' '}
        <Text code>&lt;img /&gt;</Text>. Tudo client-side via <Text code>DOMParser</Text>,
        nada sai da máquina. Complementa o Markdown → HTML, que vai no outro
        sentido.
      </>
    ),
    placeholder: 'Cole o HTML aqui (pode ser um fragmento, sem <html>/<body>)...',
    resultTitle: 'JSX gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar',
    inputLabel: 'HTML de entrada',
    outputLabel: 'Saída JSX',
    empty: 'Cole um HTML pra começar.',
    elements: 'elementos',
    chars: 'caracteres',
    note: `JSX precisa de um único elemento raiz; múltiplas raízes são embrulhadas num fragmento <>. Texto sempre é emitido dentro de {"..."} (seguro e inequívoco), comentários HTML viram {/* ... */}, e atributos com aspas duplas usam a notação {'valor'} entre chaves.`,
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'HTML → JSX Converter',
    intro: (
      <>
        Paste some HTML and get JSX ready for React — <Text code>class</Text>{' '}
        becomes <Text code>className</Text>, <Text code>for</Text>{' '}
        becomes <Text code>htmlFor</Text>, kebab-case attributes become
        camelCase, <Text code>style</Text> becomes <Text code>{'{...}'}</Text>,
        and void/empty tags turn into <Text code>&lt;img /&gt;</Text>. All
        client-side via <Text code>DOMParser</Text>, nothing leaves your
        machine. Complements Markdown → HTML, which goes the other way.
      </>
    ),
    placeholder: 'Paste the HTML here (a fragment is fine, no <html>/<body> needed)',
    sample: 'Sample',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    inputLabel: 'HTML input',
    outputLabel: 'JSX output',
    empty: 'Paste some HTML to get started.',
    elements: 'elements',
    chars: 'characters',
    note: 'JSX needs a single root; multiple roots are wrapped in a fragment <>. Text is always emitted inside quotes for safety, HTML comments become {/* ... */}, and attributes containing double quotes use the quoted-string form.',
    sourceTitle: 'How it works',
  },
}

// O motor de serialização (DOMParser + camelCase de atributos, style -> {{...}},
// void elements, fragmento quando há mais de uma raiz) vive em
// src/utils/jsxConverter.js, compartilhado com /tools/svg-to-jsx-converter.
// Antes esta página carregava uma cópia privada dele. Aqui fica só o que é
// próprio do HTML: o dicionário de atributos abaixo.
const ATTR_MAP = {
  class: 'className',
  'for': 'htmlFor',
  maxlength: 'maxLength',
  minlength: 'minLength',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  'accept-charset': 'acceptCharset',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  'formenctype': 'formEncType',
  'formmethod': 'formMethod',
  'formnovalidate': 'formNoValidate',
  'formtarget': 'formTarget',
  frameborder: 'frameBorder',
  inputmode: 'inputMode',
  marginheight: 'marginHeight',
  marginwidth: 'marginWidth',
  referrerpolicy: 'referrerPolicy',
  srcset: 'srcSet',
  allowfullscreen: 'allowFullScreen',
  spellcheck: 'spellCheck',
  playsinline: 'playsInline',
}

function convertHtmlToJsx(html) {
  // 'body' itera os filhos do <body> e embrulha em fragmento quando há mais de
  // uma raiz — JSX exige um único elemento raiz.
  return convertMarkupToJsx(html, {
    attrMap: ATTR_MAP,
    parseMode: 'text/html',
    root: 'body',
  })
}

export default function HtmlToJsxConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!input.trim()) return { jsx: '', elements: 0, chars: 0 }
    const jsx = convertHtmlToJsx(input)
    return {
      jsx,
      elements: (jsx.match(/<[a-z]/g) || []).length,
      chars: jsx.length,
    }
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
      <Title level={2}><FileMarkdownOutlined /> {t.title}</Title>
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
          <Button onClick={() => setInput(SAMPLE)}>{t.sample}</Button>
          <Button icon={<ClearOutlined />} disabled={!input} onClick={() => { setInput(''); setCopied(false) }}>{t.clear}</Button>
          <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} disabled={!result.jsx} onClick={handleCopy}>
            {copied ? t.copied : t.copy}
          </Button>
        </Space>
      </Card>

      {result.jsx ? (
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

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}