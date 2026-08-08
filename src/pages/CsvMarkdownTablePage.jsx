import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Button, Alert, message } from 'antd'
import { TableOutlined, CopyOutlined, CheckOutlined, ClearOutlined, FileAddOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Parser CSV/TSV estilo RFC4180: campos entre aspas duplas podem conter o
// delimitador, quebras de linha e aspas escapadas ("") — sem dependência,
// tudo local.
const PARSE_SOURCE = `function parseDelimited(text, delim) {
  const rows = []; let row = []; let field = ''
  let inQuotes = false; let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue }
      if (ch === '"') { inQuotes = false; i++; continue }
      field += ch; i++; continue
    }
    if (ch === '"' && field === '') { inQuotes = true; i++; continue }
    if (ch === delim) { row.push(field); field = ''; i++; continue }
    if (ch === '\\n' || ch === '\\r') {
      if (ch === '\\r' && text[i + 1] === '\\n') i++ // CRLF vira linha única
      row.push(field); rows.push(row); row = []; field = ''
      i++; continue
    }
    field += ch; i++
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}`

const SAMPLE = `service,status,instances,region
auth-api,healthy,3,us-east-1
ingress-nginx,running,2,eu-west-1
prometheus,degraded,1,sa-east-1
postgres-primary,healthy,1,us-east-1`

const DELIMITERS = { comma: ',', semicolon: ';', tab: '\t' }

function parseDelimited(text, delim) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue }
      if (ch === '"') { inQuotes = false; i++; continue }
      field += ch; i++; continue
    }
    if (ch === '"' && field === '') { inQuotes = true; i++; continue }
    if (ch === delim) { row.push(field); field = ''; i++; continue }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += ch
    i++
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

function escapeCell(v) {
  return String(v).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}

function buildMarkdown(rows, hasHeader, align, colName) {
  if (!rows.length) return ''
  const cols = Math.max(...rows.map((r) => r.length))
  const padRow = (r) => { const out = r.slice(); while (out.length < cols) out.push(''); return out }
  const headerCells = hasHeader
    ? padRow(rows[0])
    : Array.from({ length: cols }, (_, i) => colName(i))
  const body = hasHeader ? rows.slice(1) : rows
  const sep = headerCells.map((h) => {
    const w = Math.max(3, h.length)
    if (align === 'left') return ':' + '-'.repeat(w - 1)
    if (align === 'center') return ':' + '-'.repeat(Math.max(1, w - 2)) + ':'
    if (align === 'right') return '-'.repeat(w - 1) + ':'
    return '-'.repeat(w)
  })
  const line = (cells) => `| ${cells.map(escapeCell).join(' | ')} |`
  const out = [line(headerCells), `| ${sep.join(' | ')} |`]
  body.forEach((r) => out.push(line(padRow(r))))
  return out.join('\n')
}

function buildHtml(rows, hasHeader) {
  if (!rows.length) return ''
  const cols = Math.max(...rows.map((r) => r.length))
  const padRow = (r) => { const out = r.slice(); while (out.length < cols) out.push(''); return out }
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const body = hasHeader ? rows.slice(1) : rows
  let html = '<table>\n'
  if (hasHeader) {
    html += '  <thead>\n    <tr>'
    padRow(rows[0]).forEach((c) => { html += `<th>${esc(c)}</th>` })
    html += '</tr>\n  </thead>\n'
  }
  html += '  <tbody>\n'
  body.forEach((r) => {
    html += '    <tr>'
    padRow(r).forEach((c) => { html += `<td>${esc(c)}</td>` })
    html += '</tr>\n'
  })
  html += '  </tbody>\n</table>'
  return html
}

const en = {
  title: 'CSV → Markdown Table',
  intro: <>Paste a spreadsheet/CSV/TSV and get a clean <Text code>Markdown</Text> table for docs, PRs or README, plus the <Text code>HTML</Text> equivalent. RFC4180-style parser: quoted fields, doubled quotes, embedded newlines — all client-side.</>,
  pastePlaceholder: 'Paste the data here (CSV, TSV...)',
  delimiter: 'Delimiter',
  delimiterComma: 'Comma',
  delimiterSemicolon: 'Semicolon',
  delimiterTab: 'Tab',
  headerLabel: 'Header',
  headerAuto: 'Auto',
  headerYes: 'Yes',
  headerNo: 'No',
  headerTip: 'Auto treats top row as header unless it looks all numeric. Yes forces it, No treats all rows as data.',
  alignLabel: 'Alignment',
  alignNone: 'Default',
  alignLeft: 'Left',
  alignCenter: 'Center',
  alignRight: 'Right',
  sample: 'Sample',
  clear: 'Clear',
  copyMarkdown: 'Copy Markdown',
  copyHtml: 'Copy HTML',
  copied: 'Copied!',
  copyError: 'Could not copy',
  mdTitle: 'Markdown table',
  htmlTitle: 'HTML table',
  empty: 'Nothing to render yet — paste some data or load the sample.',
  note: 'The parser handles quoted fields containing delimiters, doubled double-quotes and embedded newlines. In Markdown, | inside a cell is escaped as \\| and newlines become <br>.',
  rowsOne: 'row',
  rowsMany: 'rows',
  colsOne: 'column',
  colsMany: 'columns',
  colPlaceholder: (i) => `Col ${i + 1}`,
  howTitle: 'Source algorithm (parser & table)',
}

const pt = {
  title: 'CSV → Tabela Markdown',
  intro: <>Cola uma planilha em CSV, TSV ou lista e gera uma tabela <Text code>Markdown</Text> limpa pra documentação, PR ou README, além da versão <Text code>HTML</Text>. Parser estilo RFC4180 embutido: campos entre aspas, aspas duplicadas e quebras de linha — tudo client-side.</>,
  pastePlaceholder: 'Cole os dados aqui (CSV, TSV...)',
  delimiter: 'Delimitador',
  delimiterComma: 'Vírgula',
  delimiterSemicolon: 'Ponto e vírgula',
  delimiterTab: 'Tab',
  headerLabel: 'Cabeçalho',
  headerAuto: 'Auto',
  headerYes: 'Sim',
  headerNo: 'Não',
  headerTip: 'Auto trata a primeira linha como cabeçalho quando não parece toda numérica. "Sim" força como cabeçalho; "Não" trata todas como dados.',
  alignLabel: 'Alinhamento',
  alignNone: 'Padrão',
  alignLeft: 'Esquerda',
  alignCenter: 'Centro',
  alignRight: 'Direita',
  sample: 'Exemplo',
  clear: 'Limpar',
  copyMarkdown: 'Copiar Markdown',
  copyHtml: 'Copiar HTML',
  copied: 'Copiado!',
  copyError: 'Não foi possível copiar',
  mdTitle: 'Tabela Markdown',
  htmlTitle: 'Tabela HTML',
  empty: 'Nada pra renderizar ainda — cola dados ou carrega o exemplo.',
  note: 'O parser trata campos entre aspas contendo delimitadores, aspas duplicadas e quebras de linha. No Markdown, "|" dentro de célula vira "\\|" e quebras de linha viram <br>.',
  rowsOne: 'linha',
  rowsMany: 'linhas',
  colsOne: 'coluna',
  colsMany: 'colunas',
  colPlaceholder: (i) => `Col ${i + 1}`,
  howTitle: 'Algoritmo-fonte (parser e tabela)',
}

export default function CsvMarkdownTablePage() {
  const { lang } = useLanguage()
  const t = lang === 'pt' ? pt : en
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState('comma')
  const [headerMode, setHeaderMode] = useState('auto')
  const [align, setAlign] = useState('none')
  const [copied, setCopied] = useState(null)

  const rows = useMemo(() => parseDelimited(input, DELIMITERS[delimiter]), [input, delimiter])

  const hasHeader = useMemo(() => {
    if (headerMode === 'yes') return true
    if (headerMode === 'no') return false
    if (rows.length < 2) return false
    return !rows[0].every((c) => /^[+-]?[\d.,\s%]+$/.test(String(c).trim()))
  }, [headerMode, rows])

  const md = useMemo(() => buildMarkdown(rows, hasHeader, align, (i) => t.colPlaceholder(i)), [rows, hasHeader, align, t])
  const html = useMemo(() => buildHtml(rows, hasHeader), [rows, hasHeader])

  const stats = useMemo(() => {
    const cols = rows.length ? Math.max(...rows.map((r) => r.length)) : 0
    const n = hasHeader && rows.length ? rows.length - 1 : rows.length
    return { cols, n }
  }, [rows, hasHeader])

  async function copy(text, key) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      message.error(t.copyError)
    }
  }

  const hasData = rows.length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TableOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={7}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.pastePlaceholder}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap style={{ rowGap: 12 }}>
            <Space>
              <Text type="secondary">{t.delimiter}</Text>
              <Segmented
                value={delimiter}
                onChange={setDelimiter}
                options={[
                  { label: t.delimiterComma, value: 'comma' },
                  { label: t.delimiterSemicolon, value: 'semicolon' },
                  { label: t.delimiterTab, value: 'tab' },
                ]}
              />
            </Space>
            <Space>
              <Text type="secondary">{t.headerLabel}</Text>
              <Segmented
                value={headerMode}
                onChange={setHeaderMode}
                options={[
                  { label: t.headerAuto, value: 'auto' },
                  { label: t.headerYes, value: 'yes' },
                  { label: t.headerNo, value: 'no' },
                ]}
              />
            </Space>
            <Space>
              <Text type="secondary">{t.alignLabel}</Text>
              <Segmented
                value={align}
                onChange={setAlign}
                options={[
                  { label: t.alignNone, value: 'none' },
                  { label: t.alignLeft, value: 'left' },
                  { label: t.alignCenter, value: 'center' },
                  { label: t.alignRight, value: 'right' },
                ]}
              />
            </Space>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.headerTip}</Text>
          <Space wrap>
            <Button icon={<FileAddOutlined />} onClick={() => setInput(SAMPLE)}>{t.sample}</Button>
            <Button icon={<ClearOutlined />} disabled={!input} onClick={() => { setInput(''); setCopied(null) }}>{t.clear}</Button>
          </Space>
        </Space>
      </Card>

      {!hasData ? (
        <Alert type="info" showIcon message={t.empty} />
      ) : (
        <>
          <Card
            title={`${t.mdTitle} — ${stats.n} ${stats.n === 1 ? t.rowsOne : t.rowsMany} × ${stats.cols} ${stats.cols === 1 ? t.colsOne : t.colsMany}`}
            extra={
              <Button
                size="small"
                type="primary"
                icon={copied === 'md' ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => copy(md, 'md')}
              >
                {copied === 'md' ? t.copied : t.copyMarkdown}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 380, overflowY: 'auto', fontSize: 13 }}>
              <code>{md}</code>
            </pre>
          </Card>

          <Card
            title={t.htmlTitle}
            extra={
              <Button
                size="small"
                icon={copied === 'html' ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => copy(html, 'html')}
              >
                {copied === 'html' ? t.copied : t.copyHtml}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300, overflowY: 'auto', fontSize: 12 }}>
              <code>{html}</code>
            </pre>
          </Card>

          <Alert type="info" showIcon message={t.note} />
        </>
      )}

      <Card title={t.howTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{PARSE_SOURCE}</code>
        </pre>
      </Card>
    </Space>
  )
}