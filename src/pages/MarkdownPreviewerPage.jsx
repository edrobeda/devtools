import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, message, Row, Col } from 'antd'
import { FileMarkdownOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { markdownToHtml } from '../utils/markdownParser'

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
