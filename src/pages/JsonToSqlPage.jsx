import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Select, Segmented, Statistic, Row, Col, Alert } from 'antd'
import { DatabaseOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const SOURCE_SNIPPET = `function serialize(v, nested) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL'
  if (typeof v === 'string') return "'" + v.replace(/'/g, "''") + "'"
  // objetos/arrays aninhados viram JSON textual (ou NULL, se nested=false)
  return nested ? "'" + JSON.stringify(v).replace(/'/g, "''") + "'" : 'NULL'
}

// colunas inferidas pela união das chaves, na ordem de primeira ocorrência
const cols = []
for (const row of rows) for (const k of Object.keys(row))
  if (!cols.includes(k)) cols.push(k)

// um INSERT por lote (batch), agrupando linhas no mesmo VALUES
const lote = (linhas) =>
  linhas.map((r) => '(' +
    cols.map((c) => serializeValue(r[c], nested)).join(', ')
  + ')').join(',\n  ')

const stmts = batches.map((b) =>
  'INSERT INTO ' + qid(table) + ' (' + cols.map(qid).join(', ') + ')\n  VALUES\n  ' +
  lote(b) + ';'
)`

const SAMPLE = JSON.stringify([
  { id: 1, name: 'Dana Reyes', email: 'dana@example.com', active: true, age: 34, created_at: '2024-08-01 10:00:00', meta: { plan: 'pro' } },
  { id: 2, name: 'Leo Costa', email: 'leo@example.com', active: false, age: 28, created_at: '2024-08-02 11:30:00', meta: { plan: 'free' } },
  { id: 3, name: 'Mara Lima', email: 'mara@example.com', active: true, age: 41, created_at: '2024-08-03 09:15:00', meta: null },
], null, 2)

const translations = {
  pt: {
    title: 'JSON → SQL INSERT',
    intro: 'Cola um array de objetos (saída de uma API ou um dump) e gera os comandos INSERT prontos pra semear o banco. Infere as colunas pelas chaves, serializa cada tipo — strings escapadas, booleans como TRUE/FALSE, null como NULL, objetos/arrays aninhados como JSON textual — e quebra em lotes do tamanho que você escolher. Tudo client-side, nada sai do navegador.',
    inputPlaceholder: 'Cole o JSON (array de objetos, objeto único ou array de valores)...',
    tableLabel: 'Tabela',
    dialect: 'Dialeto (formato de aspas em identificadores)',
    titlePg: 'PostgreSQL',
    titleMy: 'MySQL',
    titleSqlite: 'SQLite',
    batchLabel: 'Linhas por INSERT',
    batchAll: 'Todas',
    nested: 'Objetos/arrays aninhados',
    nestedJson: 'Como JSON string',
    nestedText: 'Como NULL',
    resultTitle: 'SQL gerado',
    empty: 'Cole um JSON acima para gerar o SQL.',
    errInvalid: 'JSON inválido: ',
    errEmpty: 'O JSON não tem nenhuma linha pra converter.',
    errTitle: 'Não foi possível gerar o SQL.',
    copy: 'Copiar SQL',
    copied: 'Copiado!',
    clear: 'Limpar',
    sample: 'Exemplo',
    statRows: 'linhas',
    statCols: 'colunas',
    statStmts: 'comandos INSERT',
    statBytes: 'bytes',
    note: 'O algoritmo caminha sobre o JSON e monta cada comando na hora: infer é a união das chaves na ordem de primeira ocorrência, colunas ausentes numa linha viram NULL, e cada lote de {"nested": true} é agrupado num único VALUES. Valores de string ganham aspas simples com escapamento (uma aspa vira duas). Nada é executado — é só texto para copiar pro seu cliente SQL.',
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'JSON → SQL INSERT',
    intro: 'Turn a JSON array (API payload or dump) into ready-to-paste INSERT statements to seed a database. Columns are inferred from the keys, values are serialized correctly — strings, numbers, booleans as TRUE/FALSE, null as NULL, nested objects/arrays as JSON text — and rows are split into batches you choose. Fully client-side.',
    inputPlaceholder: 'Paste JSON (array of objects, single object, or array of values)...',
    tableLabel: 'Table',
    dialect: 'Identifier quoting',
    titlePg: 'PostgreSQL',
    titleMy: 'MySQL',
    titleSqlite: 'SQLite',
    batchLabel: 'Rows per batch',
    batchAll: 'All',
    nested: 'Nested objects/arrays',
    nestedJson: 'As JSON string',
    nestedText: 'As NULL',
    resultTitle: 'Generated SQL',
    empty: 'Paste some JSON above to generate SQL.',
    errInvalid: 'Invalid JSON: ',
    errEmpty: 'The JSON has no rows to convert.',
    errTitle: 'Could not generate the SQL.',
    copy: 'Copy SQL',
    copied: 'Copied!',
    clear: 'Clear',
    sample: 'Sample',
    statRows: 'rows',
    statCols: 'columns',
    statStmts: 'INSERT statements',
    statBytes: 'bytes',
    note: 'The generator walks the rows and builds statements on the fly without executing anything — columns are the union of keys in first-occurrence order, a row missing a key gets NULL, and each batch becomes one VALUES group. String values use single quotes with doubled apostrophes for escaping. Nothing runs against a database; you copy the text into your own SQL client.',
    sourceTitle: 'Under the hood',
  },
}

function quoteId(name, dialect) {
  if (dialect === 'mysql') return `\`${name}\``
  return `"${name}"`
}

function serializeValue(v, nested) {
  if (v === null || v === undefined) return 'NULL'
  const t = typeof v
  if (t === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (t === 'number') return Number.isFinite(v) ? String(v) : 'NULL'
  if (t === 'string') return `'${v.replace(/'/g, "''")}'`
  if (nested) return `'${JSON.stringify(v).replace(/'/g, "''")}'`
  return 'NULL'
}

function chunk(arr, size) {
  if (size === null || size >= arr.length) return [arr]
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default function JsonToSqlPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [table, setTable] = useState('my_table')
  const [dialect, setDialect] = useState('postgres')
  const [batch, setBatch] = useState('all')
  const [nested, setNested] = useState('json')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!input.trim()) return { sql: '', rows: 0, cols: 0, stmts: 0, bytes: 0, error: null }
    let parsed
    try {
      parsed = JSON.parse(input)
    } catch (e) {
      return { sql: '', rows: 0, cols: 0, stmts: 0, bytes: 0, error: `${t.errInvalid}${e?.message || e}` }
    }
    const rawRows = Array.isArray(parsed) ? parsed : [parsed]
    const objectRows = rawRows.filter((r) => r !== null && typeof r === 'object' && !Array.isArray(r))
    const useObjects = objectRows.length > 0

    // colunas: união das chaves na ordem de primeira ocorrência
    const cols = []
    const seen = new Set()
    for (const r of objectRows) {
      for (const k of Object.keys(r)) {
        if (!seen.has(k)) { seen.add(k); cols.push(k) }
      }
    }
    if (cols.length === 0 && rawRows.length > 0) cols.push('value')
    if (rawRows.length === 0 || cols.length === 0) {
      return { sql: '', rows: 0, cols: 0, stmts: 0, bytes: 0, error: t.errEmpty }
    }

    const nestedOn = nested === 'json'
    const qid = (n) => quoteId(n, dialect)
    const tableName = table.trim() || 'table'
    const header = `INSERT INTO ${qid(tableName)} (${cols.map(qid).join(', ')}) VALUES`

    const size = batch === 'all' ? null : Number(batch)
    const chunks = chunk(rawRows, size)
    const stmts = chunks.map((rowsBlock) => {
      const values = rowsBlock
        .map((r) => {
          if (useObjects && r !== null && typeof r === 'object' && !Array.isArray(r)) {
            return '(' + cols.map((c) => serializeValue(r[c], nestedOn)).join(', ') + ')'
          }
          return '(' + serializeValue(r, nestedOn) + ')'
        })
        .join(',\n    ')
      return header + '\n  ' + values + ';'
    })

    const sql = stmts.join('\n\n')
    return { sql, rows: chunks.length ? rawRows.length : 0, cols: cols.length, stmts: stmts.length, bytes: sql.length, error: null }
  }, [input, table, dialect, batch, nested, t])

  async function handleCopy() {
    if (!result.sql) return
    try {
      await navigator.clipboard.writeText(result.sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input.TextArea
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.inputPlaceholder}
        />
      </Card>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text>{t.tableLabel}</Text>
            <Input value={table} onChange={(e) => setTable(e.target.value)} style={{ width: 200 }} />
          </Space>
          <Space wrap>
            <Text>{t.dialect}</Text>
            <Segmented
              value={dialect}
              onChange={setDialect}
              options={[
                { label: t.titlePg, value: 'postgres' },
                { label: t.titleMy, value: 'mysql' },
                { label: t.titleSqlite, value: 'sqlite' },
              ]}
            />
          </Space>
          <Space wrap>
            <Text>{t.batchLabel}</Text>
            <Select
              value={batch}
              onChange={setBatch}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: t.batchAll },
                { value: '10', label: '10' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
                { value: '500', label: '500' },
              ]}
            />
            <Text style={{ marginLeft: 24 }}>{t.nested}</Text>
            <Segmented
              value={nested}
              onChange={setNested}
              options={[
                { value: 'json', label: t.nestedJson },
                { value: 'null', label: t.nestedText },
              ]}
            />
          </Space>
        </Space>
      </Card>

      {result.error && (
        <Alert type="error" showIcon message={t.errTitle} description={result.error} />
      )}

      <Card
        title={t.resultTitle}
        extra={
          <Space>
            <Button size="small" onClick={() => setInput(SAMPLE)}>{t.sample}</Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => { setInput(''); setCopied(false) }} disabled={!input}>{t.clear}</Button>
            <Button size="small" type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} disabled={!result.sql}>
              {copied ? t.copied : t.copy}
            </Button>
          </Space>
        }
      >
        {result.sql ? (
          <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12 }}><code>{result.sql}</code></pre>
        ) : (
          <Text type="secondary">{result.error ? t.errTitle : input.trim() ? t.errEmpty : t.empty}</Text>
        )}
      </Card>

      {result.sql && (
        <Row gutter={16}>
          <Col xs={12} md={6}><Card><Statistic title={t.statRows} value={result.rows} /></Card></Col>
          <Col xs={12} md={6}><Card><Statistic title={t.statCols} value={result.cols} /></Card></Col>
          <Col xs={12} md={6}><Card><Statistic title={t.statStmts} value={result.stmts} /></Card></Col>
          <Col xs={12} md={6}><Card><Statistic title={t.statBytes} value={result.bytes} /></Card></Col>
        </Row>
      )}

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}><code>{SOURCE_SNIPPET}</code></pre>
      </Card>
    </Space>
  )
}