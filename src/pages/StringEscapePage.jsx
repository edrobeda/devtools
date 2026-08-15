import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Radio,
  Select,
  Checkbox,
  message,
  Collapse,
  Alert,
  Tag,
} from 'antd'
import { CodeOutlined, CopyOutlined, UndoOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import * as se from '../utils/stringEscape'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const CONTEXTS = [
  { key: 'js', label: { pt: 'JavaScript string', en: 'JavaScript string' } },
  { key: 'json', label: { pt: 'JSON', en: 'JSON' } },
  { key: 'html', label: { pt: 'HTML entities', en: 'HTML entities' } },
  { key: 'xml', label: { pt: 'XML', en: 'XML' } },
  { key: 'url', label: { pt: 'URL', en: 'URL' } },
  { key: 'regex', label: { pt: 'Regex', en: 'Regex' } },
  { key: 'sql', label: { pt: 'SQL LIKE', en: 'SQL LIKE' } },
  { key: 'markdown', label: { pt: 'Markdown', en: 'Markdown' } },
  { key: 'csv', label: { pt: 'CSV', en: 'CSV' } },
]

const QUOTES = ['"', "'", '`']

function buildSample(context, lang) {
  if (context === 'js') {
    return lang === 'pt'
      ? 'Linha 1\nLinha 2\tcom tab\nAspas "simples" e `template`'
      : 'Line 1\nLine 2\twith tab\nQuotes "single" and `template`'
  }
  if (context === 'json') {
    return lang === 'pt'
      ? 'Café "especial" com \nquebra'
      : 'Coffee "special" with \nnewline'
  }
  if (context === 'html') {
    return '<div class="box">João & Maria > <span title="ok">100%</span></div>'
  }
  if (context === 'xml') {
    return '<item id="1" name="João & Maria">5 > 3</item>'
  }
  if (context === 'url') {
    return 'https://example.com/search?q=café & açaí&lang=pt-BR'
  }
  if (context === 'regex') {
    return '(abc)+.*[0-9]?^foo$'
  }
  if (context === 'sql') {
    return '50% off_icial'
  }
  if (context === 'markdown') {
    return '# Título\n*item* com `code` e [link](url)'
  }
  if (context === 'csv') {
    return 'João, "Dev", SP\nMaria, "QA", RJ'
  }
  return ''
}

const SOURCE_SNIPPET = Object.values(se)
  .filter((f) => typeof f === 'function')
  .map((f) => f.toString())
  .join('\n\n')

const translations = {
  pt: {
    title: 'String Escape / Unescape',
    intro: (
      <>
        Escape e unescape de texto para diferentes contextos: strings JavaScript, JSON,
        entidades HTML, XML, URL, expressões regulares, SQL <Text code>LIKE</Text>, Markdown
        e CSV. Tudo roda no navegador — nenhum dado sai daqui.
      </>
    ),
    context: 'Contexto',
    mode: 'Modo',
    escape: 'Escape',
    unescape: 'Unescape',
    quote: 'Aspas do literal',
    nonAscii: 'Também escapar não-ASCII como &#code;',
    urlScope: 'Escopo URL',
    urlComponent: 'Componente (encodeURIComponent)',
    urlFull: 'URI completa (encodeURI)',
    csvDelimiter: 'Delimitador CSV',
    inputLabel: 'Entrada',
    outputLabel: 'Saída',
    inputPlaceholder: 'Cole ou digite o texto aqui...',
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar',
    swap: 'Inverter',
    examples: 'Exemplos rápidos',
    reversible: 'Reversível',
    notReversible: 'Unescape é aproximado',
    error: 'Não foi possível processar a entrada para este modo/contexto.',
    algorithmTitle: 'Algoritmo',
    algorithmDesc: 'Cada transformação é uma função pura em src/utils/stringEscape.js. O código exibido é o mesmo que roda na página.',
    sourceTab: 'stringEscape.js',
  },
  en: {
    title: 'String Escape / Unescape',
    intro: (
      <>
        Escape and unescape text for different contexts: JavaScript strings, JSON,
        HTML entities, XML, URL, regular expressions, SQL <Text code>LIKE</Text>, Markdown
        and CSV. Everything runs in the browser — no data leaves this page.
      </>
    ),
    context: 'Context',
    mode: 'Mode',
    escape: 'Escape',
    unescape: 'Unescape',
    quote: 'Literal quote',
    nonAscii: 'Also escape non-ASCII as &#code;',
    urlScope: 'URL scope',
    urlComponent: 'Component (encodeURIComponent)',
    urlFull: 'Full URI (encodeURI)',
    csvDelimiter: 'CSV delimiter',
    inputLabel: 'Input',
    outputLabel: 'Output',
    inputPlaceholder: 'Paste or type text here...',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    swap: 'Swap',
    examples: 'Quick examples',
    reversible: 'Reversible',
    notReversible: 'Unescape is approximate',
    error: 'Could not process the input for this mode/context.',
    algorithmTitle: 'Algorithm',
    algorithmDesc: 'Each transformation is a pure function in src/utils/stringEscape.js. The code shown here is the same code running on the page.',
    sourceTab: 'stringEscape.js',
  },
}

export default function StringEscapePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [context, setContext] = useState('js')
  const [mode, setMode] = useState('escape')
  const [quote, setQuote] = useState('"')
  const [nonAscii, setNonAscii] = useState(false)
  const [urlScope, setUrlScope] = useState('component')
  const [csvDelimiter, setCsvDelimiter] = useState(',')
  const [input, setInput] = useState(buildSample('js', lang))

  const reversibleContexts = ['js', 'json', 'html', 'xml', 'url', 'sql', 'csv']
  const isReversible = reversibleContexts.includes(context)

  const result = useMemo(() => {
    if (!input) return { ok: true, value: '' }
    try {
      let value = ''
      if (context === 'js') {
        value = mode === 'escape' ? se.escapeJsString(input, quote) : se.unescapeJsString(input)
      } else if (context === 'json') {
        value = mode === 'escape' ? se.escapeJsonString(input) : se.unescapeJsonString(input)
      } else if (context === 'html') {
        value = mode === 'escape' ? se.escapeHtml(input, nonAscii) : se.unescapeHtml(input)
      } else if (context === 'xml') {
        value = mode === 'escape' ? se.escapeXml(input) : se.unescapeXml(input)
      } else if (context === 'url') {
        value =
          mode === 'escape'
            ? urlScope === 'component'
              ? se.escapeUrlComponent(input)
              : se.escapeUrlFull(input)
            : urlScope === 'component'
              ? se.unescapeUrlComponent(input)
              : se.unescapeUrlFull(input)
      } else if (context === 'regex') {
        value = mode === 'escape' ? se.escapeRegex(input) : se.unescapeRegex(input)
      } else if (context === 'sql') {
        value = mode === 'escape' ? se.escapeSqlLike(input) : se.unescapeSqlLike(input)
      } else if (context === 'markdown') {
        value = mode === 'escape' ? se.escapeMarkdown(input) : se.unescapeMarkdown(input)
      } else if (context === 'csv') {
        value =
          mode === 'escape'
            ? se.escapeCsv(input, csvDelimiter)
            : se.unescapeCsv(input, csvDelimiter)
      }
      return { ok: true, value }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }, [input, context, mode, quote, nonAscii, urlScope, csvDelimiter])

  function copy() {
    navigator.clipboard.writeText(result.value)
    message.success(t.copied)
  }

  function loadSample(key) {
    setContext(key)
    setMode('escape')
    setInput(buildSample(key, lang))
  }

  function swap() {
    if (result.ok && result.value) {
      setInput(result.value)
      setMode((m) => (m === 'escape' ? 'unescape' : 'escape'))
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Space>
              <Text>{t.context}:</Text>
              <Select
                value={context}
                onChange={(v) => setContext(v)}
                options={CONTEXTS.map((c) => ({ value: c.key, label: c.label[lang] }))}
                style={{ minWidth: 160 }}
              />
            </Space>

            <Space>
              <Text>{t.mode}:</Text>
              <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button">
                <Radio.Button value="escape">{t.escape}</Radio.Button>
                <Radio.Button value="unescape">{t.unescape}</Radio.Button>
              </Radio.Group>
            </Space>

            <Tag color={isReversible ? 'green' : 'orange'}>
              {isReversible ? t.reversible : t.notReversible}
            </Tag>
          </Space>

          {context === 'js' && (
            <Space>
              <Text>{t.quote}:</Text>
              <Radio.Group value={quote} onChange={(e) => setQuote(e.target.value)} optionType="button">
                {QUOTES.map((q) => (
                  <Radio.Button key={q} value={q}>{q === '`' ? '`...`' : q}</Radio.Button>
                ))}
              </Radio.Group>
            </Space>
          )}

          {context === 'html' && mode === 'escape' && (
            <Checkbox checked={nonAscii} onChange={(e) => setNonAscii(e.target.checked)}>
              {t.nonAscii}
            </Checkbox>
          )}

          {context === 'url' && (
            <Space>
              <Text>{t.urlScope}:</Text>
              <Radio.Group value={urlScope} onChange={(e) => setUrlScope(e.target.value)} optionType="button">
                <Radio.Button value="component">{t.urlComponent}</Radio.Button>
                <Radio.Button value="full">{t.urlFull}</Radio.Button>
              </Radio.Group>
            </Space>
          )}

          {context === 'csv' && (
            <Space>
              <Text>{t.csvDelimiter}:</Text>
              <Radio.Group value={csvDelimiter} onChange={(e) => setCsvDelimiter(e.target.value)} optionType="button">
                <Radio.Button value=",">,</Radio.Button>
                <Radio.Button value=";">;</Radio.Button>
                <Radio.Button value="\t">TAB</Radio.Button>
              </Radio.Group>
            </Space>
          )}

          <div>
            <Text strong>{t.inputLabel}</Text>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              autoSize={{ minRows: 4, maxRows: 10 }}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <Space wrap>
            <Text strong>{t.examples}:</Text>
            {CONTEXTS.map((c) => (
              <Button key={c.key} size="small" onClick={() => loadSample(c.key)}>
                {c.label[lang]}
              </Button>
            ))}
          </Space>
        </Space>
      </Card>

      {result.ok ? (
        <Card
          title={t.outputLabel}
          extra={
            <Space>
              <Button size="small" icon={<UndoOutlined />} onClick={swap} disabled={!result.value}>
                {t.swap}
              </Button>
              <Button size="small" icon={<CopyOutlined />} onClick={copy} disabled={!result.value}>
                {t.copy}
              </Button>
            </Space>
          }
        >
          <Paragraph style={{ margin: 0, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            <Text code>{result.value}</Text>
          </Paragraph>
        </Card>
      ) : (
        <Alert type="error" showIcon message={t.error} description={result.error} />
      )}

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>{t.sourceTab}</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>
                  <code>{SOURCE_SNIPPET}</code>
                </pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
