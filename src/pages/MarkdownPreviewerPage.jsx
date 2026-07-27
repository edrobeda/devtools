import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, message, Row, Col } from 'antd'
import { FileMarkdownOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const DEFAULT_MD = `# Título

Um parágrafo com **negrito**, *itálico* e \`código inline\`.

## Lista

- item um
- item dois
  - sub item

## Código

\`\`\`
function ola() {
  return 'mundo'
}
\`\`\`

> uma citação

[link para o devtools](https://devtools.eventifylab.com)
`

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineFormat(text) {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  out = out.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
  return out
}

// Parser Markdown minimalista, cobre apenas o subconjunto mais comum do
// dia a dia (headings, negrito/itálico, código inline/bloco, listas,
// citação, link, linha horizontal, parágrafos) — não é CommonMark completo.
function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const html = []
  let i = 0
  let paragraphBuffer = []
  let listBuffer = null // { type: 'ul' | 'ol', items: [] }

  function flushParagraph() {
    if (paragraphBuffer.length) {
      html.push(`<p>${inlineFormat(paragraphBuffer.join(' '))}</p>`)
      paragraphBuffer = []
    }
  }

  function flushList() {
    if (listBuffer) {
      const tag = listBuffer.type
      html.push(`<${tag}>${listBuffer.items.map((it) => `<li>${inlineFormat(it)}</li>`).join('')}</${tag}>`)
      listBuffer = null
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    if (/^```/.test(line)) {
      flushParagraph()
      flushList()
      const codeLines = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i])
        i += 1
      }
      html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      i += 1
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = headingMatch[1].length
      html.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`)
      i += 1
      continue
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph()
      flushList()
      html.push('<hr />')
      i += 1
      continue
    }

    const quoteMatch = line.match(/^>\s?(.*)$/)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      const quoteLines = [quoteMatch[1]]
      i += 1
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i += 1
      }
      html.push(`<blockquote>${inlineFormat(quoteLines.join(' '))}</blockquote>`)
      continue
    }

    const ulMatch = line.match(/^(\s*)[-*]\s+(.*)$/)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/)
    if (ulMatch || olMatch) {
      flushParagraph()
      const type = ulMatch ? 'ul' : 'ol'
      const text = ulMatch ? ulMatch[2] : olMatch[2]
      if (!listBuffer || listBuffer.type !== type) {
        flushList()
        listBuffer = { type, items: [] }
      }
      listBuffer.items.push(text)
      i += 1
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      i += 1
      continue
    }

    flushList()
    paragraphBuffer.push(line.trim())
    i += 1
  }

  flushParagraph()
  flushList()
  return html.join('\n')
}

const translations = {
  pt: {
    title: 'Markdown → HTML (Preview)',
    intro: (
      <>
        Converte Markdown para HTML com um parser próprio (sem dependência
        externa) e mostra o preview renderizado lado a lado com o texto
        digitado. Cobre o subconjunto mais comum: títulos, negrito/itálico,
        código inline e em bloco, listas, citação, link e linha horizontal —
        não é uma implementação completa de CommonMark.
      </>
    ),
    inputTitle: 'Markdown',
    previewTitle: 'Preview',
    htmlTitle: 'HTML gerado',
    copy: 'Copiar HTML',
    copied: 'HTML copiado',
  },
  en: {
    title: 'Markdown → HTML (Preview)',
    intro: (
      <>
        Converts Markdown to HTML with a hand-rolled parser (no external
        dependency) and shows the rendered preview side by side with the
        typed text. Covers the most common subset: headings, bold/italic,
        inline and block code, lists, blockquote, link and horizontal rule —
        it is not a full CommonMark implementation.
      </>
    ),
    inputTitle: 'Markdown',
    previewTitle: 'Preview',
    htmlTitle: 'Generated HTML',
    copy: 'Copy HTML',
    copied: 'HTML copied',
  },
}

export default function MarkdownPreviewerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [md, setMd] = useState(DEFAULT_MD)

  const html = useMemo(() => markdownToHtml(md), [md])

  function handleCopy() {
    navigator.clipboard.writeText(html)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileMarkdownOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={t.inputTitle}>
            <TextArea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              rows={16}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t.previewTitle}>
            <div style={{ minHeight: 360 }} dangerouslySetInnerHTML={{ __html: html }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={t.htmlTitle}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 240 }}>
          <code>{html}</code>
        </pre>
      </Card>
    </Space>
  )
}
