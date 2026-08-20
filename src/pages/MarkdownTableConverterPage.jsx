import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Button, Alert, message, Tabs } from 'antd'
import { TableOutlined, CopyOutlined, CheckOutlined, ClearOutlined, FileAddOutlined, SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE = `| service | status | instances | region
|---------|--------|-----------|--------
| auth-api | healthy | 3 | us-east-1
| ingress-nginx | running | 2 | eu-west-1
| prometheus | degraded | 1 | sa-east-1
| postgres-primary | healthy | 1 | us-east-1`

const SAMPLE_NO_HEADER = `auth-api | healthy | 3 | us-east-1
ingress-nginx | running | 2 | eu-west-1
prometheus | degraded | 1 | sa-east-1`

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

const translations = {
  pt: {
    title: 'Conversor de Tabela Markdown',
    intro: <>Cole uma tabela <Text code>Markdown</Text> (estilo GitHub/GitLab/Notion) e converta para <Text code>CSV</Text> ou <Text code>JSON</Text>. Detecta cabeçalho automaticamente pela linha de separação <Text code>|---|---|</Text>; se não houver, trata todas as linhas como dados. Tudo local, nada sai do navegador.</>,
    pastePlaceholder: 'Cole a tabela Markdown aqui...',
    outputFormat: 'Formato de saída',
    outputCsv: 'CSV',
    outputJson: 'JSON',
    delimiter: 'Delimitador (CSV)',
    comma: 'Vírgula (,)',
    semicolon: 'Ponto e vírgula (;)',
    tab: 'Tab',
    headerAuto: 'Auto',
    headerYes: 'Forçar cabeçalho',
    headerNo: 'Sem cabeçalho',
    headerTip: 'Auto detecta pela linha de separação (|---|). "Forçar" usa a primeira linha como cabeçalho mesmo sem separador. "Sem" trata tudo como dados.',
    sample: 'Exemplo (com header)',
    sampleNoHeader: 'Exemplo (sem header)',
    clear: 'Limpar',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    csvTitle: 'CSV',
    jsonTitle: 'JSON',
    empty: 'Nada pra renderizar ainda — cola uma tabela Markdown ou carrega um exemplo.',
    rowsOne: 'linha',
    rowsMany: 'linhas',
    colsOne: 'coluna',
    colsMany: 'colunas',
    detectedHeader: 'Cabeçalho detectado:',
    noHeaderDetected: 'Nenhum cabeçalho detectado (todas as linhas são dados)',
    howTitle: 'Como funciona o parser',
  },
  en: {
    title: 'Markdown Table Converter',
    intro: <>Paste a <Text code>Markdown</Text> table (GitHub/GitLab/Notion style) and convert to <Text code>CSV</Text> or <Text code>JSON</Text>. Auto-detects header via the separator row <Text code>|---|---|</Text>; if none, treats all lines as data. Runs entirely in the browser — nothing leaves your machine.</>,
    pastePlaceholder: 'Paste Markdown table here...',
    outputFormat: 'Output format',
    outputCsv: 'CSV',
    outputJson: 'JSON',
    delimiter: 'Delimiter (CSV)',
    comma: 'Comma (,)',
    semicolon: 'Semicolon (;)',
    tab: 'Tab',
    headerAuto: 'Auto',
    headerYes: 'Force header',
    headerNo: 'No header',
    headerTip: 'Auto detects via separator row (|---|). "Force" uses first row as header even without separator. "None" treats all as data.',
    sample: 'Sample (with header)',
    sampleNoHeader: 'Sample (no header)',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    csvTitle: 'CSV',
    jsonTitle: 'JSON',
    empty: 'Nothing to render yet — paste a Markdown table or load a sample.',
    rowsOne: 'row',
    rowsMany: 'rows',
    colsOne: 'column',
    colsMany: 'columns',
    detectedHeader: 'Detected header:',
    noHeaderDetected: 'No header detected (all rows are data)',
    howTitle: 'How the parser works',
  },
}

export default function MarkdownTableConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [outputFormat, setOutputFormat] = useState('csv')
  const [delimiter, setDelimiter] = useState('comma')
  const [headerMode, setHeaderMode] = useState('auto')
  const [copied, setCopied] = useState(null)

  const DELIMITERS = { comma: ',', semicolon: ';', tab: '\t' }

  const { headers: parsedHeaders, rows: parsedRows, hasHeader: detectedHeader } = useMemo(
    () => parseMarkdownTable(input),
    [input]
  )

  const hasHeader = useMemo(() => {
    if (headerMode === 'yes') return true
    if (headerMode === 'no') return false
    return detectedHeader
  }, [headerMode, detectedHeader])

  const finalHeaders = hasHeader ? parsedHeaders : []
  const finalRows = hasHeader ? parsedRows : parsedRows

  const csv = useMemo(() => buildCsv(finalHeaders, finalRows, DELIMITERS[delimiter]), [finalHeaders, finalRows, delimiter])
  const json = useMemo(() => JSON.stringify(buildJson(finalHeaders, finalRows), null, 2), [finalHeaders, finalRows])

  const output = outputFormat === 'csv' ? csv : json

  const stats = useMemo(() => {
    const cols = finalRows.length ? Math.max(...finalRows.map(r => r.length)) : (finalHeaders.length || 0)
    return { cols, n: finalRows.length }
  }, [finalHeaders, finalRows])

  async function copy() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(outputFormat)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      message.error(t.copyError)
    }
  }

  const hasData = finalRows.length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TableOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.pastePlaceholder}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap style={{ rowGap: 12 }}>
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
            <Space>
              <Text type="secondary">{t.delimiter}</Text>
              <Segmented
                value={delimiter}
                onChange={setDelimiter}
                options={[
                  { label: t.comma, value: 'comma' },
                  { label: t.semicolon, value: 'semicolon' },
                  { label: t.tab, value: 'tab' },
                ]}
              />
            </Space>
            <Space>
              <Text type="secondary">{t.headerAuto}</Text>
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
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.headerTip}</Text>
          <Space wrap>
            <Button icon={<FileAddOutlined />} onClick={() => setInput(SAMPLE)}>{t.sample}</Button>
            <Button icon={<FileAddOutlined />} onClick={() => setInput(SAMPLE_NO_HEADER)}>{t.sampleNoHeader}</Button>
            <Button icon={<ClearOutlined />} disabled={!input} onClick={() => { setInput(''); setCopied(null) }}>{t.clear}</Button>
          </Space>
        </Space>
      </Card>

      {!hasData ? (
        <Alert type="info" showIcon message={t.empty} />
      ) : (
        <>
          <Tabs
            defaultActiveKey={outputFormat === 'csv' ? 'csv' : 'json'}
            items={[
              { key: 'csv', label: t.csvTitle, children: (
                <Card
                  title={`${t.csvTitle} — ${stats.n} ${stats.n === 1 ? t.rowsOne : t.rowsMany} × ${stats.cols} ${stats.cols === 1 ? t.colsOne : t.colsMany}`}
                  extra={
                    <Button
                      size="small"
                      type="primary"
                      icon={copied === 'csv' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => { setOutputFormat('csv'); copy(); }}
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
                  title={`${t.jsonTitle} — ${stats.n} ${stats.n === 1 ? t.rowsOne : t.rowsMany}`}
                  extra={
                    <Button
                      size="small"
                      type="primary"
                      icon={copied === 'json' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => { setOutputFormat('json'); copy(); }}
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
            hasHeader
              ? <><Text strong>{t.detectedHeader} </Text>{finalHeaders.join(', ')}</>
              : t.noHeaderDetected
          } />
        </>
      )}

      <Card title={t.howTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{`function parseMarkdownTable(text) {
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
}`}
        </code>
        </pre>
      </Card>
    </Space>
  )
}