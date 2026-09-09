import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Button, Alert, message, Tabs } from 'antd'
import { TableOutlined, CopyOutlined, CheckOutlined, ClearOutlined, FileAddOutlined, SwapOutlined } from '@ant-design/icons'
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

const PARSE_MD_SOURCE = `function parseMarkdownTable(text) {
  const lines = text.trim().split('\\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [], hasHeader: false }

  const isSeparator = (line) => /^\\|?\\s*:?-+:?\\s*(\\|\\s*:?-+:?\\s*)*\\|?$/.test(line)
  const splitRow = (line) => {
    const trimmed = line.replace(/^\\|/, '').replace(/\\|$/, '')
    return trimmed.split('|').map(c => c.trim())
  }

  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (isSeparator(lines[i])) {
      headerIdx = i
      break
    }
  }

  if (headerIdx >= 0) {
    const headers = splitRow(lines[headerIdx - 1] || '')
    const rows = lines.slice(headerIdx + 1).map(splitRow)
    return { headers, rows, hasHeader: true }
  }

  const allRows = lines.map(splitRow)
  const cols = Math.max(...allRows.map(r => r.length))
  const padded = allRows.map(r => { const out = [...r]; while (out.length < cols) out.push(''); return out })
  return { headers: [], rows: padded, hasHeader: false }
}`

const SAMPLE_CSV = `service,status,instances,region
auth-api,healthy,3,us-east-1
ingress-nginx,running,2,eu-west-1
prometheus,degraded,1,sa-east-1
postgres-primary,healthy,1,us-east-1`

const SAMPLE_MD = `| service | status | instances | region
|---------|--------|-----------|--------
| auth-api | healthy | 3 | us-east-1
| ingress-nginx | running | 2 | eu-west-1
| prometheus | degraded | 1 | sa-east-1
| postgres-primary | healthy | 1 | us-east-1`

const SAMPLE_MD_NO_HEADER = `auth-api | healthy | 3 | us-east-1
ingress-nginx | running | 2 | eu-west-1
prometheus | degraded | 1 | sa-east-1`

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

function parseMarkdownTable(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [], hasHeader: false }

  const isSeparator = (line) => /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(line)
  const splitRow = (line) => {
    const trimmed = line.replace(/^\|/, '').replace(/\|$/, '')
    return trimmed.split('|').map(c => c.trim())
  }

  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (isSeparator(lines[i])) {
      headerIdx = i
      break
    }
  }

  if (headerIdx >= 0) {
    const headers = splitRow(lines[headerIdx - 1] || '')
    const rows = lines.slice(headerIdx + 1).map(splitRow)
    return { headers, rows, hasHeader: true }
  }

  const allRows = lines.map(splitRow)
  const cols = Math.max(...allRows.map(r => r.length))
  const padded = allRows.map(r => { const out = [...r]; while (out.length < cols) out.push(''); return out })
  return { headers: [], rows: padded, hasHeader: false }
}

function escapeCsvField(value, delimiter) {
  const s = value === null || value === undefined ? '' : String(value)
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsv(headers, rows, delimiter) {
  const allRows = headers.length > 0 ? [headers, ...rows] : rows
  return allRows.map(r => r.map(c => escapeCsvField(c, delimiter)).join(delimiter)).join('\n')
}

function buildJson(headers, rows) {
  if (headers.length === 0) {
    return rows.map((r, i) => {
      const obj = {}
      r.forEach((c, idx) => { obj[`col${idx + 1}`] = c })
      return obj
    })
  }
  return rows.map(r => {
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? '' })
    return obj
  })
}

const en = {
  title: 'CSV ↔ Markdown Table',
  intro: <>Two-way table converter: paste a CSV/TSV spreadsheet and get a clean <Text code>Markdown</Text> table for docs, PRs or README (plus the <Text code>HTML</Text> equivalent); or paste a <Text code>Markdown</Text> table (GitHub/GitLab/Notion style) and convert it back to <Text code>CSV</Text> or <Text code>JSON</Text>. RFC4180-style parser on one side, separator-row header detection on the other — all client-side.</>,
  direction: 'Direction',
  dirCsvToMd: 'CSV/TSV → Markdown',
  dirMdToCsv: 'Markdown → CSV/JSON',
  pasteCsvPlaceholder: 'Paste the data here (CSV, TSV...)',
  pasteMdPlaceholder: 'Paste Markdown table here...',
  delimiter: 'Delimiter',
  delimiterComma: 'Comma',
  delimiterSemicolon: 'Semicolon',
  delimiterTab: 'Tab',
  headerLabel: 'Header',
  headerAuto: 'Auto',
  headerYes: 'Yes',
  headerNo: 'No',
  headerTip: 'Auto treats top row as header unless it looks all numeric (or detects the |---| separator row). Yes forces it, No treats all rows as data.',
  alignLabel: 'Alignment',
  alignNone: 'Default',
  alignLeft: 'Left',
  alignCenter: 'Center',
  alignRight: 'Right',
  sampleCsv: 'Sample',
  sampleMd: 'Sample (with header)',
  sampleMdNoHeader: 'Sample (no header)',
  clear: 'Clear',
  copyMarkdown: 'Copy Markdown',
  copyHtml: 'Copy HTML',
  outputFormat: 'Output format',
  outputCsv: 'CSV',
  outputJson: 'JSON',
  copy: 'Copy',
  copied: 'Copied!',
  copyError: 'Could not copy',
  mdTitle: 'Markdown table',
  htmlTitle: 'HTML table',
  csvTitle: 'CSV',
  jsonTitle: 'JSON',
  emptyCsv: 'Nothing to render yet — paste some data or load the sample.',
  emptyMd: 'Nothing to render yet — paste a Markdown table or load a sample.',
  note: 'The parser handles quoted fields containing delimiters, doubled double-quotes and embedded newlines. In Markdown, | inside a cell is escaped as \\| and newlines become <br>.',
  rowsOne: 'row',
  rowsMany: 'rows',
  colsOne: 'column',
  colsMany: 'columns',
  colPlaceholder: (i) => `Col ${i + 1}`,
  detectedHeader: 'Detected header:',
  noHeaderDetected: 'No header detected (all rows are data)',
  howCsvToMdTitle: 'Source algorithm (RFC4180 parser & Markdown table)',
  howMdToCsvTitle: 'How the Markdown parser works',
}

const pt = {
  title: 'Tabela CSV ↔ Markdown',
  intro: <>Conversor bidirecional de tabelas: cola uma planilha em CSV/TSV e gera uma tabela <Text code>Markdown</Text> limpa pra documentação, PR ou README (além da versão <Text code>HTML</Text>); ou cola uma tabela <Text code>Markdown</Text> (estilo GitHub/GitLab/Notion) e converte de volta pra <Text code>CSV</Text> ou <Text code>JSON</Text>. Parser estilo RFC4180 embutido de um lado, detecção de cabeçalho pela linha de separação do outro — tudo local.</>,
  direction: 'Direção',
  dirCsvToMd: 'CSV/TSV → Markdown',
  dirMdToCsv: 'Markdown → CSV/JSON',
  pasteCsvPlaceholder: 'Cole os dados aqui (CSV, TSV...)',
  pasteMdPlaceholder: 'Cole a tabela Markdown aqui...',
  delimiter: 'Delimitador',
  delimiterComma: 'Vírgula',
  delimiterSemicolon: 'Ponto e vírgula',
  delimiterTab: 'Tab',
  headerLabel: 'Cabeçalho',
  headerAuto: 'Auto',
  headerYes: 'Sim',
  headerNo: 'Não',
  headerTip: 'Auto trata a primeira linha como cabeçalho quando não parece toda numérica (ou detecta a linha de separação |---|). "Sim" força como cabeçalho; "Não" trata todas como dados.',
  alignLabel: 'Alinhamento',
  alignNone: 'Padrão',
  alignLeft: 'Esquerda',
  alignCenter: 'Centro',
  alignRight: 'Direita',
  sampleCsv: 'Exemplo',
  sampleMd: 'Exemplo (com header)',
  sampleMdNoHeader: 'Exemplo (sem header)',
  clear: 'Limpar',
  copyMarkdown: 'Copiar Markdown',
  copyHtml: 'Copiar HTML',
  outputFormat: 'Formato de saída',
  outputCsv: 'CSV',
  outputJson: 'JSON',
  copy: 'Copiar',
  copied: 'Copiado!',
  copyError: 'Não foi possível copiar',
  mdTitle: 'Tabela Markdown',
  htmlTitle: 'Tabela HTML',
  csvTitle: 'CSV',
  jsonTitle: 'JSON',
  emptyCsv: 'Nada pra renderizar ainda — cola dados ou carrega o exemplo.',
  emptyMd: 'Nada pra renderizar ainda — cola uma tabela Markdown ou carrega um exemplo.',
  note: 'O parser trata campos entre aspas contendo delimitadores, aspas duplicadas e quebras de linha. No Markdown, "|" dentro de célula vira "\\|" e quebras de linha viram <br>.',
  rowsOne: 'linha',
  rowsMany: 'linhas',
  colsOne: 'coluna',
  colsMany: 'colunas',
  colPlaceholder: (i) => `Col ${i + 1}`,
  detectedHeader: 'Cabeçalho detectado:',
  noHeaderDetected: 'Nenhum cabeçalho detectado (todas as linhas são dados)',
  howCsvToMdTitle: 'Algoritmo-fonte (parser RFC4180 e tabela)',
  howMdToCsvTitle: 'Como funciona o parser de Markdown',
}

export default function CsvMarkdownTablePage() {
  const { lang } = useLanguage()
  const t = lang === 'pt' ? pt : en
  const [direction, setDirection] = useState('csv2md')
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState('comma')
  const [headerMode, setHeaderMode] = useState('auto')
  const [align, setAlign] = useState('none')
  const [outputFormat, setOutputFormat] = useState('csv')
  const [copied, setCopied] = useState(null)

  const rowsCsv = useMemo(() => parseDelimited(input, DELIMITERS[delimiter]), [input, delimiter])

  const hasHeaderCsv = useMemo(() => {
    if (headerMode === 'yes') return true
    if (headerMode === 'no') return false
    if (rowsCsv.length < 2) return false
    return !rowsCsv[0].every((c) => /^[+-]?[\d.,\s%]+$/.test(String(c).trim()))
  }, [headerMode, rowsCsv])

  const md = useMemo(() => buildMarkdown(rowsCsv, hasHeaderCsv, align, (i) => t.colPlaceholder(i)), [rowsCsv, hasHeaderCsv, align, t])
  const html = useMemo(() => buildHtml(rowsCsv, hasHeaderCsv), [rowsCsv, hasHeaderCsv])

  const statsCsv = useMemo(() => {
    const cols = rowsCsv.length ? Math.max(...rowsCsv.map((r) => r.length)) : 0
    const n = hasHeaderCsv && rowsCsv.length ? rowsCsv.length - 1 : rowsCsv.length
    return { cols, n }
  }, [rowsCsv, hasHeaderCsv])

  const parsedMd = useMemo(() => parseMarkdownTable(input), [input])

  const hasHeaderMd = useMemo(() => {
    if (headerMode === 'yes') return true
    if (headerMode === 'no') return false
    return parsedMd.hasHeader
  }, [headerMode, parsedMd])

  const finalHeaders = hasHeaderMd ? parsedMd.headers : []
  const finalRows = parsedMd.rows

  const csv = useMemo(() => buildCsv(finalHeaders, finalRows, DELIMITERS[delimiter]), [finalHeaders, finalRows, delimiter])
  const json = useMemo(() => JSON.stringify(buildJson(finalHeaders, finalRows), null, 2), [finalHeaders, finalRows])

  const statsMd = useMemo(() => {
    const cols = finalRows.length ? Math.max(...finalRows.map(r => r.length)) : (finalHeaders.length || 0)
    return { cols, n: finalRows.length }
  }, [finalHeaders, finalRows])

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

  const isCsvToMd = direction === 'csv2md'
  const hasData = isCsvToMd ? rowsCsv.length > 0 : finalRows.length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TableOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.direction}</Text>
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { label: t.dirCsvToMd, value: 'csv2md' },
                { label: t.dirMdToCsv, value: 'md2csv' },
              ]}
            />
          </Space>
          <TextArea
            rows={7}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isCsvToMd ? t.pasteCsvPlaceholder : t.pasteMdPlaceholder}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap style={{ rowGap: 12 }}>
            {!isCsvToMd && (
              <Space>
                <Text type="secondary">{t.outputFormat}</Text>
                <Segmented
                  value={outputFormat}
                  onChange={setOutputFormat}
                  options={[
                    { label: t.outputCsv, value: 'csv' },
                    { label: t.outputJson, value: 'json' },
                  ]}
                />
              </Space>
            )}
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
            {isCsvToMd && (
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
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.headerTip}</Text>
          <Space wrap>
            <Button icon={<FileAddOutlined />} onClick={() => setInput(isCsvToMd ? SAMPLE_CSV : SAMPLE_MD)}>
              {isCsvToMd ? t.sampleCsv : t.sampleMd}
            </Button>
            {!isCsvToMd && (
              <Button icon={<FileAddOutlined />} onClick={() => setInput(SAMPLE_MD_NO_HEADER)}>{t.sampleMdNoHeader}</Button>
            )}
            <Button icon={<ClearOutlined />} disabled={!input} onClick={() => { setInput(''); setCopied(null) }}>{t.clear}</Button>
          </Space>
        </Space>
      </Card>

      {!hasData ? (
        <Alert type="info" showIcon message={isCsvToMd ? t.emptyCsv : t.emptyMd} />
      ) : isCsvToMd ? (
        <>
          <Card
            title={`${t.mdTitle} — ${statsCsv.n} ${statsCsv.n === 1 ? t.rowsOne : t.rowsMany} × ${statsCsv.cols} ${statsCsv.cols === 1 ? t.colsOne : t.colsMany}`}
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
      ) : (
        <>
          <Tabs
            activeKey={outputFormat}
            onChange={setOutputFormat}
            items={[
              { key: 'csv', label: t.csvTitle, children: (
                <Card
                  title={`${t.csvTitle} — ${statsMd.n} ${statsMd.n === 1 ? t.rowsOne : t.rowsMany} × ${statsMd.cols} ${statsMd.cols === 1 ? t.colsOne : t.colsMany}`}
                  extra={
                    <Button
                      size="small"
                      type="primary"
                      icon={copied === 'csv' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => { setOutputFormat('csv'); copy(csv, 'csv') }}
                    >
                      {copied === 'csv' ? t.copied : t.copy}
                    </Button>
                  }
                >
                  <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 380, overflowY: 'auto', fontSize: 13 }}>
                    <code>{csv}</code>
                  </pre>
                </Card>
              )},
              { key: 'json', label: t.jsonTitle, children: (
                <Card
                  title={`${t.jsonTitle} — ${statsMd.n} ${statsMd.n === 1 ? t.rowsOne : t.rowsMany}`}
                  extra={
                    <Button
                      size="small"
                      type="primary"
                      icon={copied === 'json' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => { setOutputFormat('json'); copy(json, 'json') }}
                    >
                      {copied === 'json' ? t.copied : t.copy}
                    </Button>
                  }
                >
                  <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 380, overflowY: 'auto', fontSize: 13 }}>
                    <code>{json}</code>
                  </pre>
                </Card>
              )},
            ]}
          />

          <Alert type="info" showIcon message={
            hasHeaderMd
              ? <><Text strong>{t.detectedHeader} </Text>{finalHeaders.join(', ')}</>
              : t.noHeaderDetected
          } />
        </>
      )}

      <Card title={isCsvToMd ? t.howCsvToMdTitle : t.howMdToCsvTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{isCsvToMd ? PARSE_SOURCE : PARSE_MD_SOURCE}</code>
        </pre>
      </Card>
    </Space>
  )
}