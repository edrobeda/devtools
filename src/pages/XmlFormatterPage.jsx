import React, { useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, message, Descriptions, Switch } from 'antd'
import { FileTextOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// A técnica: DOMParser com MIME 'application/xml' já valida o XML e devolve
// um DOM — basta checar por um nó <parsererror>. A formatação re-serializa
// essa árvore com indentação recursiva.
const SNIPPET = `function parseXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error(doc.getElementsByTagName('parsererror')[0].textContent)
  }
  return doc // DOM válido: elementos, atributos, texto, comentários, CDATA
}

// Formatar = re-serializar a árvore com indentação recursiva:
// elementos sem filhos -> <tag a="v" /> (inline), só texto -> <tag>texto</tag>,
// com filhos -> uma linha por nível de profundidade.`

const translations = {
  pt: {
    title: 'Formatador de XML',
    intro: (
      <>
        Cola um XML e formata com indentação, minifica ou valida — tudo local
        via <Text code>DOMParser</Text> do navegador, nenhum dado sai da
        máquina. Complementa o formatador de JSON, que não entende XML.
      </>
    ),
    placeholder: 'Cole o XML aqui, ex: <catalog><book id="1">...</book></catalog>',
    format: 'Formatar',
    minify: 'Minificar',
    invalidTitle: 'XML inválido',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copiedMessage: 'Copiado',
    nodes: 'Nós',
    elements: 'Elementos',
    size: 'Tamanho',
    wrap: 'Adicionar declaração <?xml ...?> no topo',
    empty: 'Cole um XML pra começar.',
    sample: 'Exemplo',
    clear: 'Limpar',
    note: 'A formatação preserva comentários, CDATA, atributos e a declaração XML (se houver). O parser usa DOMParser — um XML com duas raízes, tag sem fechamento ou atributo sem aspas é apontado com a posição do erro.',
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'XML Formatter',
    intro: (
      <>
        Paste some XML to format it with indentation, minify it, or validate
        it — all local via the browser's <Text code>DOMParser</Text>, nothing
        leaves your machine. Complements the JSON formatter, which doesn't
        understand XML.
      </>
    ),
    placeholder: 'Paste the XML here, e.g.: <catalog><book id="1">...</book></catalog>',
    format: 'Format',
    minify: 'Minify',
    invalidTitle: 'Invalid XML',
    resultTitle: 'Result',
    copy: 'Copy',
    copiedMessage: 'Copied',
    nodes: 'Nodes',
    elements: 'Elements',
    size: 'Size',
    wrap: 'Add an <?xml ...?> declaration on top',
    empty: 'Paste some XML to get started.',
    sample: 'Sample',
    clear: 'Clear',
    note: 'Formatting preserves comments, CDATA, attributes and the XML declaration (if any). Parsing relies on DOMParser — XML with two roots, an unclosed tag, or an attribute without quotes is flagged with the error location.',
    sourceTitle: 'How it works',
  },
}

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101" available="true">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <price>44.95</price>
  </book>
  <book id="bk102" available="false">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <price>5.95</price>
    <note><![CDATA[Very <special> pricing!]]></note>
  </book>
</catalog>`

function escapeXmlText(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function serializeXml(doc, min) {
  const indent = (d) => '  '.repeat(d)
  const renderElement = (el, depth) => {
    let attrs = ''
    for (const a of el.attributes) attrs += ` ${a.name}="${a.value}"`
    if (el.childNodes.length === 0) {
      return `<${el.tagName}${attrs} />`
    }
    const hasElementChild = [...el.childNodes].some((n) => n.nodeType === 1)
    if (!hasElementChild) {
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.nodeValue)
        .join('')
        .trim()
      return `<${el.tagName}${attrs}>${escapeXmlText(text)}</${el.tagName}>`
    }
    let body = ''
    for (const c of el.childNodes) {
      if (c.nodeType === 1) {
        body += `${min ? '' : `\n${indent(depth + 1)}`}${renderElement(c, depth + 1)}`
      } else if (c.nodeType === 8) {
        body += `${min ? '' : `\n${indent(depth + 1)}`}<!--${c.nodeValue}-->`
      } else if (c.nodeType === 4) {
        body += `<![CDATA[${c.nodeValue}]]>`
      } else if (c.nodeType === 3) {
        const t = c.nodeValue.trim()
        if (t) body += `${min ? '' : `\n${indent(depth + 1)}`}${escapeXmlText(t)}`
      }
    }
    return `${min ? '' : `\n${indent(depth)}`}<${el.tagName}${attrs}>${body}${min ? '' : `\n${indent(depth)}`}</${el.tagName}>`
  }

  let result = ''
  for (const c of doc.childNodes) {
    if (c.nodeType === 7) {
      result += `<?${c.target}${c.data ? ` ${c.data}` : ''}?>\n`
    } else if (c.nodeType === 10) {
      let doctype = `<!DOCTYPE ${c.name}`
      if (c.publicId) doctype += ` PUBLIC "${c.publicId}"`
      if (c.systemId) doctype += c.publicId ? ` "${c.systemId}"` : ` SYSTEM "${c.systemId}"`
      result += `${doctype}>\n`
    } else if (c.nodeType === 8) {
      result += `<!--${c.nodeValue}-->\n`
    } else if (c.nodeType === 1) {
      result += renderElement(c, 0)
    }
  }
  if (min) return result.replace(/>\s+</g, '><').trim()
  return result
}

function countNodes(node) {
  let total = 0
  let elements = 0
  const walk = (n) => {
    for (const child of n.childNodes) {
      total++
      if (child.nodeType === 1) {
        elements++
        walk(child)
      }
    }
  }
  walk(node)
  return { total, elements }
}

export default function XmlFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [addDecl, setAddDecl] = useState(false)

  function process(min) {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setStats(null)
      return
    }
    let doc
    try {
      doc = new DOMParser().parseFromString(input, 'application/xml')
      const errNodes = doc.getElementsByTagName('parsererror')
      if (errNodes.length) {
        throw new Error(errNodes[0].textContent.trim())
      }
    } catch (err) {
      setError(err.message)
      setOutput('')
      setStats(null)
      return
    }
    let result = serializeXml(doc, min)
    if (addDecl && !input.trim().startsWith('<?xml')) {
      result = `<?xml version="1.0" encoding="UTF-8"?>\n${result}`
    }
    setOutput(result)
    setError(null)
    setStats({
      nodes: countNodes(doc).total,
      elements: countNodes(doc).elements,
      bytes: new TextEncoder().encode(result).length,
    })
  }

  function handleCopy() {
    if (!output) return
    navigator.clipboard.writeText(output)
    message.success(t.copiedMessage)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
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
          <Button type="primary" onClick={() => process(false)}>{t.format}</Button>
          <Button onClick={() => process(true)}>{t.minify}</Button>
          <Button onClick={() => setInput(SAMPLE)}>{t.sample}</Button>
          <Button disabled={!input} onClick={() => { setInput(''); setOutput(''); setError(null); setStats(null) }}>{t.clear}</Button>
          <Switch
            checked={addDecl}
            onChange={setAddDecl}
            checkedChildren="XML"
            unCheckedChildren="XML"
          />
          <Text type="secondary">{t.wrap}</Text>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={t.invalidTitle} description={error} />}

      {output ? (
        <Card
          title={t.resultTitle}
          extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}
        >
          {stats && (
            <Descriptions size="small" column={3} style={{ marginBottom: 12 }}>
              <Descriptions.Item label={t.nodes}>{stats.nodes}</Descriptions.Item>
              <Descriptions.Item label={t.elements}>{stats.elements}</Descriptions.Item>
              <Descriptions.Item label={t.size}>{stats.bytes} bytes</Descriptions.Item>
            </Descriptions>
          )}
          <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            <code>{output}</code>
          </pre>
        </Card>
      ) : (
        !error && <Text type="secondary">{t.empty}</Text>
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
