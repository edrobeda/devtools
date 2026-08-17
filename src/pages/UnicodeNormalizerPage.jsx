import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Table, Row, Col, Statistic, Alert, Tag, Segmented,
} from 'antd'
import {
  FontSizeOutlined, CopyOutlined, CheckOutlined, ClearOutlined, WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  analyzeText, normalize, listCodePoints, toEscaped, countGraphemeClusters, NORMALIZATION_FORMS,
} from '../utils/unicodeNormalizer'

const { Title, Paragraph, Text } = Typography

const SAMPLE = 'Café\u0301\u200B👨\u200D👩\u200D👧\u200D👦 \u00ADnaïve\uFEFF'

const translations = {
  pt: {
    title: 'Normalizador de Texto Unicode',
    intro: 'Converte texto entre as quatro formas normalizadas do Unicode (NFC, NFD, NFKC, NFKD), conta code points, unidades UTF-16, grafemas e bytes UTF-8, e destaca caracteres invisíveis ou de controle que costumam quebrar buscas, validações e comparações de strings.',
    inputPlaceholder: 'Cole ou digite o texto aqui...',
    stats: {
      codeUnits: 'Unidades UTF-16',
      codePoints: 'Code points',
      graphemes: 'Grafemas',
      bytes: 'Bytes UTF-8',
      invisible: 'Invisíveis',
    },
    normalizeTo: 'Normalizar para',
    forms: {
      NFC: 'NFC — Canonical Composition',
      NFD: 'NFD — Canonical Decomposition',
      NFKC: 'NFKC — Compatibility Composition',
      NFKD: 'NFKD — Compatibility Decomposition',
    },
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar',
    sample: 'Exemplo',
    escaped: 'Representações com escapes',
    escapeLabels: {
      js: 'JavaScript string',
      python: 'Python string',
      html: 'HTML entities',
      css: 'CSS content',
    },
    tableTitle: 'Caracteres únicos',
    emptyInput: 'Cole algum texto acima para analisar.',
    colChar: 'Caractere',
    colPoint: 'Code point',
    colName: 'Nome / Bloco',
    colCategory: 'Categoria',
    colUtf8: 'UTF-8',
    colHtml: 'HTML',
    colCount: 'Vezes',
    colInvisible: 'Invisível',
    yes: 'Sim',
    no: 'Não',
    invisibleAlert: (n) => `Detectados ${n} caractere(s) invisível/is de controle no texto. Eles podem alterar comparações, ordenação e busca sem aparecer visualmente.`,
    bomAlert: 'O texto começa com BOM (U+FEFF). Remova-o se estiver causando problemas de comparação.',
    sourceTitle: 'Como funciona',
    source: `O motor usa apenas APIs nativas do navegador. A normalização é feita por String.prototype.normalize:

\`\`\`js
const nfc  = text.normalize('NFC')   // compõe combinações canônicas
const nfd  = text.normalize('NFD')   // decompõe combinações canônicas
const nfkc = text.normalize('NFKC')  // compõe com compatibilidade
const nfkd = text.normalize('NFKD') // decompõe com compatibilidade
\`\`\`

A contagem de grafemas usa Intl.Segmenter quando disponível, com fallback para Array.from(text):

\`\`\`js
function countGraphemeClusters(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('en', { granularity: 'grapheme' })
    return Array.from(seg.segment(text)).length
  }
  return Array.from(text).length
}
\`\`\`

Cada caractere é classificado por propriedades Unicode (\\p{L}, \\p{M}, \\p{N}, \\p{P}, \\p{S}, \\p{Z}) e mapeado para um bloco Unicode por intervalo numérico.`,
  },
  en: {
    title: 'Unicode Text Normalizer',
    intro: 'Converts text between the four Unicode normalization forms (NFC, NFD, NFKC, NFKD), counts UTF-16 code units, code points, grapheme clusters and UTF-8 bytes, and highlights invisible or control characters that often break searches, validations and string comparisons.',
    inputPlaceholder: 'Paste or type text here...',
    stats: {
      codeUnits: 'UTF-16 code units',
      codePoints: 'Code points',
      graphemes: 'Grapheme clusters',
      bytes: 'UTF-8 bytes',
      invisible: 'Invisible',
    },
    normalizeTo: 'Normalize to',
    forms: {
      NFC: 'NFC — Canonical Composition',
      NFD: 'NFD — Canonical Decomposition',
      NFKC: 'NFKC — Compatibility Composition',
      NFKD: 'NFKD — Compatibility Decomposition',
    },
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    sample: 'Sample',
    escaped: 'Escaped representations',
    escapeLabels: {
      js: 'JavaScript string',
      python: 'Python string',
      html: 'HTML entities',
      css: 'CSS content',
    },
    tableTitle: 'Unique characters',
    emptyInput: 'Paste some text above to analyze.',
    colChar: 'Character',
    colPoint: 'Code point',
    colName: 'Name / Block',
    colCategory: 'Category',
    colUtf8: 'UTF-8',
    colHtml: 'HTML',
    colCount: 'Count',
    colInvisible: 'Invisible',
    yes: 'Yes',
    no: 'No',
    invisibleAlert: (n) => `Found ${n} invisible/control character(s) in the text. They can change comparisons, sorting and search without being visible.`,
    bomAlert: 'The text starts with a BOM (U+FEFF). Remove it if it is causing comparison issues.',
    sourceTitle: 'Under the hood',
    source: `The engine uses only native browser APIs. Normalization is done via String.prototype.normalize:

\`\`\`js
const nfc  = text.normalize('NFC')   // canonical composition
const nfd  = text.normalize('NFD')   // canonical decomposition
const nfkc = text.normalize('NFKC')  // compatibility composition
const nfkd = text.normalize('NFKD')  // compatibility decomposition
\`\`\`

Grapheme counting uses Intl.Segmenter when available, falling back to Array.from(text):

\`\`\`js
function countGraphemeClusters(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('en', { granularity: 'grapheme' })
    return Array.from(seg.segment(text)).length
  }
  return Array.from(text).length
}
\`\`\`

Each character is classified by Unicode properties (\\p{L}, \\p{M}, \\p{N}, \\p{P}, \\p{S}, \\p{Z}) and mapped to a Unicode block by numeric range.`,
  },
}

export default function UnicodeNormalizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState('')
  const [copiedForm, setCopiedForm] = useState(null)
  const [copiedEscape, setCopiedEscape] = useState(null)

  const analysis = useMemo(() => {
    if (!text) return null
    return analyzeText(text)
  }, [text])

  function handleNormalize(form) {
    setText((prev) => normalize(prev, form))
  }

  async function copyToClipboard(value, setter, key) {
    try {
      await navigator.clipboard.writeText(value)
      setter(key)
      setTimeout(() => setter(null), 1500)
    } catch {
      setter(null)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.inputPlaceholder}
          />
          <Space wrap>
            <Text strong>{t.normalizeTo}:</Text>
            {NORMALIZATION_FORMS.map((form) => (
              <Button key={form} size="small" onClick={() => handleNormalize(form)}>
                {form}
              </Button>
            ))}
            <Button size="small" onClick={() => setText(SAMPLE)}>{t.sample}</Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')} disabled={!text}>{t.clear}</Button>
          </Space>
        </Space>
      </Card>

      {analysis && (
        <>
          <Row gutter={[16, 16]}>
            {[
              { title: t.stats.codeUnits, value: analysis.codeUnits },
              { title: t.stats.codePoints, value: analysis.codePoints },
              { title: t.stats.graphemes, value: analysis.graphemeClusters },
              { title: t.stats.bytes, value: analysis.bytes },
              { title: t.stats.invisible, value: analysis.invisibleCount, highlight: analysis.invisibleCount > 0 },
            ].map((s, i) => (
              <Col xs={12} sm={8} md={4} key={i}>
                <Card size="small">
                  <Statistic
                    title={s.title}
                    value={s.value}
                    valueStyle={{ color: s.highlight ? '#cf1322' : undefined }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {analysis.invisibleCount > 0 && (
            <Alert type="warning" showIcon icon={<WarningOutlined />} message={t.invisibleAlert(analysis.invisibleCount)} />
          )}
          {analysis.hasBom && (
            <Alert type="warning" showIcon icon={<WarningOutlined />} message={t.bomAlert} />
          )}

          <Row gutter={[16, 16]}>
            {NORMALIZATION_FORMS.map((form) => (
              <Col xs={24} md={12} key={form}>
                <Card
                  size="small"
                  title={t.forms[form]}
                  extra={
                    <Button
                      size="small"
                      type="primary"
                      icon={copiedForm === form ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyToClipboard(analysis[form.toLowerCase()], setCopiedForm, form)}
                    >
                      {copiedForm === form ? t.copied : t.copy}
                    </Button>
                  }
                >
                  <Input.TextArea
                    readOnly
                    value={analysis[form.toLowerCase()]}
                    rows={3}
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Card title={t.escaped} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {['js', 'python', 'html', 'css'].map((mode) => (
                <div key={mode}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong>{t.escapeLabels[mode]}</Text>
                    <Button
                      size="small"
                      icon={copiedEscape === mode ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyToClipboard(toEscaped(text, mode), setCopiedEscape, mode)}
                    >
                      {copiedEscape === mode ? t.copied : t.copy}
                    </Button>
                  </div>
                  <Input.TextArea
                    readOnly
                    value={text ? toEscaped(text, mode) : ''}
                    rows={2}
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                </div>
              ))}
            </Space>
          </Card>

          <Card title={t.tableTitle} size="small">
            {analysis.unique.length === 0 ? (
              <Text type="secondary">{t.emptyInput}</Text>
            ) : (
              <Table
                rowKey="code"
                size="small"
                pagination={{ pageSize: 20, showSizeChanger: false }}
                dataSource={analysis.unique}
                columns={[
                  {
                    title: t.colChar,
                    dataIndex: 'char',
                    render: (c) => <span style={{ fontSize: 18, padding: '0 4px' }}>{c}</span>,
                  },
                  {
                    title: t.colPoint,
                    dataIndex: 'code',
                    render: (v) => <Text code>{`U+${v.toString(16).toUpperCase().padStart(4, '0')}`}</Text>,
                  },
                  {
                    title: t.colName,
                    render: (_, row) => (
                      <Space direction="vertical" size={0}>
                        <Text>{row.name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{row.block}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: t.colCategory,
                    dataIndex: 'categoryLabel',
                    render: (v, row) => <Tag color="blue">{v} ({row.category})</Tag>,
                  },
                  { title: t.colUtf8, dataIndex: 'utf8', render: (v) => <Text code>{v}</Text> },
                  { title: t.colHtml, dataIndex: 'html', render: (v) => <Text code>{v}</Text> },
                  { title: t.colCount, dataIndex: 'count', width: 80, align: 'right' },
                  {
                    title: t.colInvisible,
                    dataIndex: 'invisible',
                    width: 90,
                    render: (v) => (v ? <Tag color="red">{t.yes}</Tag> : <Tag color="green">{t.no}</Tag>),
                  },
                ]}
              />
            )}
          </Card>
        </>
      )}

      {!analysis && (
        <Card>
          <Text type="secondary">{t.emptyInput}</Text>
        </Card>
      )}

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}><code>{t.source}</code></pre>
      </Card>
    </Space>
  )
}
