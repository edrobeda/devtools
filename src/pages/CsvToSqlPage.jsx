import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Segmented,
  Button,
  Alert,
  Row,
  Col,
  Checkbox,
  Statistic,
  Radio,
  message,
} from 'antd'
import {
  DatabaseOutlined,
  CopyOutlined,
  CheckOutlined,
  ClearOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseCsv,
  inferColumns,
  generateCreateTable,
  generateInsert,
  COMMON_TYPES,
} from '../utils/csvToSql'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const DELIMITERS = { comma: ',', semicolon: ';', tab: '\t' }

const CSV_EXAMPLES = {
  users:
    `id,name,email,active,age,created_at
1,Dana Reyes,dana@example.com,true,34,2024-08-01 10:00:00
2,Leo Costa,leo@example.com,false,28,2024-08-02 11:30:00
3,Mara Lima,mara@example.com,true,41,2024-08-03 09:15:00`,
  products:
    `sku,name,price,active,stock
ABC-123,Widget,19.99,true,150
XYZ-789,Gadget,49.50,false,23`,
  orders:
    `order_id,user_id,total,created_at,paid
1001,1,120.00,2024-09-01 14:00:00,true
1002,3,45.50,2024-09-02 09:30:00,false`,
}

const JSON_EXAMPLES = {
  jsonUsers: JSON.stringify(
    [
      { id: 1, name: 'Dana Reyes', email: 'dana@example.com', active: true, age: 34, created_at: '2024-08-01 10:00:00', meta: { plan: 'pro' } },
      { id: 2, name: 'Leo Costa', email: 'leo@example.com', active: false, age: 28, created_at: '2024-08-02 11:30:00', meta: { plan: 'free' } },
      { id: 3, name: 'Mara Lima', email: 'mara@example.com', active: true, age: 41, created_at: '2024-08-03 09:15:00', meta: null },
    ],
    null,
    2,
  ),
}

const SOURCE_SNIPPET = `function parseCsv(text, delimiter) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else { inQuotes = false }
      } else { field += c }
    } else if (c === '"') { inQuotes = true }
    else if (c === delimiter) { row.push(field); field = '' }
    else if (c === '\\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\\r') { field += c }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

function inferType(values) {
  if (!values.length) return 'TEXT'
  if (values.every((v) => /^(true|false|1|0|yes|no)$/i.test(v))) return 'BOOLEAN'
  if (values.every((v) => /^-?\\d+$/.test(v)))
    return values.every((v) => Number.isSafeInteger(Number(v))) ? 'INTEGER' : 'BIGINT'
  if (values.every((v) => /^-?\\d+\\.\\d+([eE][+-]?\\d+)?$/.test(v))) return 'REAL'
  if (values.every((v) => /^\\d{4}-\\d{2}-\\d{2}$/.test(v))) return 'DATE'
  if (values.every((v) => /^\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}(:\\d{2})?/.test(v))) return 'TIMESTAMP'
  return 'TEXT'
}

const createSql = generateCreateTable(tableName, columns, dialect, opts)
const insertSql = generateInsert(tableName, columns, rows, dialect, batchSize)`

function serializeNestedCell(v, nestedOn) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return nestedOn ? JSON.stringify(v) : ''
  return String(v)
}

function parseJsonRows(text, nestedOn) {
  const parsed = JSON.parse(text)
  const raw = Array.isArray(parsed) ? parsed : [parsed]
  const objectRows = raw.filter(
    (r) => r !== null && typeof r === 'object' && !Array.isArray(r),
  )
  const useObjects = objectRows.length > 0

  const cols = []
  if (useObjects) {
    const seen = new Set()
    for (const r of objectRows) {
      for (const k of Object.keys(r)) {
        if (!seen.has(k)) {
          seen.add(k)
          cols.push(k)
        }
      }
    }
  }
  if (cols.length === 0) cols.push('value')

  const header = [...cols]
  const dataRows = raw.map((r) => {
    if (useObjects && r !== null && typeof r === 'object' && !Array.isArray(r)) {
      return cols.map((c) => serializeNestedCell(r[c], nestedOn))
    }
    return [serializeNestedCell(r, nestedOn)]
  })

  return [header, ...dataRows]
}

const translations = {
  pt: {
    title: 'CSV / JSON → SQL',
    intro:
      'Cole dados tabulares em CSV ou JSON e gere comandos CREATE TABLE + INSERT prontos para rodar no PostgreSQL, MySQL, SQLite ou SQL Server. O motor infere os tipos a partir dos dados, normaliza os nomes das colunas e deixa você ajustar cada campo antes de gerar o SQL. Objetos/arrays aninhados do JSON são serializados como JSON string ou NULL. Tudo acontece no navegador — nenhum dado sai daqui.',
    inputTitle: 'Dados de entrada',
    inputPlaceholder: 'Cole CSV (cabeçalho + dados) ou JSON (array de objetos)...',
    formatLabel: 'Formato',
    formatCsv: 'CSV',
    formatJson: 'JSON',
    delimiter: 'Delimitador',
    comma: 'Vírgula',
    semicolon: 'Ponto e vírgula',
    tab: 'Tab',
    nested: 'Aninhados',
    nestedJson: 'JSON string',
    nestedText: 'NULL',
    optionsTitle: 'Opções do SQL',
    tableLabel: 'Tabela',
    dialect: 'Dialeto',
    postgres: 'PostgreSQL',
    mysql: 'MySQL',
    sqlite: 'SQLite',
    sqlserver: 'SQL Server',
    batchLabel: 'Linhas por INSERT',
    batchAll: 'Todas',
    includeCreate: 'Gerar CREATE TABLE',
    ifNotExists: 'IF NOT EXISTS',
    dropTable: 'DROP TABLE IF EXISTS primeiro',
    columnsTitle: 'Colunas inferidas',
    columnName: 'Nome',
    columnType: 'Tipo',
    nullable: 'NULL',
    primaryKey: 'PK',
    resetColumns: 'Redefinir colunas',
    resultTitle: 'SQL gerado',
    empty: 'Cole dados tabulares (CSV ou JSON) para gerar o SQL.',
    copy: 'Copiar SQL',
    copied: 'Copiado!',
    clear: 'Limpar',
    example: 'Exemplo',
    exampleUsers: 'Usuários (CSV)',
    exampleProducts: 'Produtos (CSV)',
    exampleOrders: 'Pedidos (CSV)',
    exampleJsonUsers: 'Usuários (JSON)',
    errInvalid: 'JSON inválido: ',
    errTitle: 'Não foi possível gerar o SQL.',
    statRows: 'linhas',
    statCols: 'colunas',
    statBytes: 'bytes',
    note: 'CSV: entende aspas, aspas duplicadas ("") e quebras de linha dentro de campos. JSON: serializa objetos/arrays aninhados como JSON string ou NULL, conforme a opção. Tipos são inferidos heuristicamente: booleanos, inteiros, decimais, datas, timestamps e JSON. Revise as colunas antes de copiar o SQL para produção — a inferência é uma conveniência, não um schema definitivo.',
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'CSV / JSON → SQL',
    intro:
      'Paste tabular data as CSV or JSON and generate ready-to-run CREATE TABLE + INSERT statements for PostgreSQL, MySQL, SQLite or SQL Server. The engine infers column types from the data, normalizes column names and lets you adjust each field before generating SQL. Nested objects/arrays in JSON are serialized as JSON text or NULL. Fully client-side.',
    inputTitle: 'Input data',
    inputPlaceholder: 'Paste CSV (header + rows) or JSON (array of objects)...',
    formatLabel: 'Format',
    formatCsv: 'CSV',
    formatJson: 'JSON',
    delimiter: 'Delimiter',
    comma: 'Comma',
    semicolon: 'Semicolon',
    tab: 'Tab',
    nested: 'Nested',
    nestedJson: 'JSON string',
    nestedText: 'NULL',
    optionsTitle: 'SQL options',
    tableLabel: 'Table',
    dialect: 'Dialect',
    postgres: 'PostgreSQL',
    mysql: 'MySQL',
    sqlite: 'SQLite',
    sqlserver: 'SQL Server',
    batchLabel: 'Rows per INSERT',
    batchAll: 'All',
    includeCreate: 'Generate CREATE TABLE',
    ifNotExists: 'IF NOT EXISTS',
    dropTable: 'DROP TABLE IF EXISTS first',
    columnsTitle: 'Inferred columns',
    columnName: 'Name',
    columnType: 'Type',
    nullable: 'NULL',
    primaryKey: 'PK',
    resetColumns: 'Reset columns',
    resultTitle: 'Generated SQL',
    empty: 'Paste tabular data (CSV or JSON) to generate SQL.',
    copy: 'Copy SQL',
    copied: 'Copied!',
    clear: 'Clear',
    example: 'Example',
    exampleUsers: 'Users (CSV)',
    exampleProducts: 'Products (CSV)',
    exampleOrders: 'Orders (CSV)',
    exampleJsonUsers: 'Users (JSON)',
    errInvalid: 'Invalid JSON: ',
    errTitle: 'Could not generate the SQL.',
    statRows: 'rows',
    statCols: 'columns',
    statBytes: 'bytes',
    note: 'CSV: handles quotes, doubled quotes ("") and line breaks inside fields. JSON: serializes nested objects/arrays as JSON text or NULL. Types are inferred heuristically: booleans, integers, decimals, dates, timestamps, and JSON. Review the columns before copying the SQL to production — inference is a convenience, not a definitive schema.',
    sourceTitle: 'Under the hood',
  },
}

export default function CsvToSqlPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState('')
  const [format, setFormat] = useState('csv')
  const [delimiterKey, setDelimiterKey] = useState('comma')
  const [nested, setNested] = useState('json')
  const [tableName, setTableName] = useState('my_table')
  const [dialect, setDialect] = useState('postgres')
  const [batchSize, setBatchSize] = useState('all')
  const [includeCreate, setIncludeCreate] = useState(true)
  const [ifNotExists, setIfNotExists] = useState(false)
  const [dropTable, setDropTable] = useState(false)
  const [overrides, setOverrides] = useState({})
  const [copied, setCopied] = useState(false)

  const delimiter = DELIMITERS[delimiterKey]

  const jsonError = useMemo(() => {
    if (format === 'csv' || !input.trim()) return null
    try {
      parseJsonRows(input, nested === 'json')
      return null
    } catch (e) {
      return `${t.errInvalid}${e?.message || e}`
    }
  }, [input, format, nested, t.errInvalid])

  const rows = useMemo(() => {
    if (format === 'csv') return parseCsv(input, delimiter)
    if (!input.trim()) return []
    try {
      return parseJsonRows(input, nested === 'json')
    } catch {
      return []
    }
  }, [input, delimiter, format, nested])

  const inferredColumns = useMemo(() => inferColumns(rows), [rows])

  const columns = useMemo(() => {
    return inferredColumns.map((col) => {
      const o = overrides[col.originalName] || {}
      return {
        ...col,
        ...o,
        name: o.name ?? col.name,
      }
    })
  }, [inferredColumns, overrides])

  const batchNum = batchSize === 'all' ? 0 : Number(batchSize)

  const fullSql = useMemo(() => {
    if (rows.length <= 1) return ''
    const create = generateCreateTable(tableName, columns, dialect, {
      includeCreate,
      ifNotExists,
      dropTable,
    })
    const insert = generateInsert(tableName, columns, rows, dialect, batchNum)
    if (!create && !insert) return ''
    return create + (create && insert ? '\n\n' : '') + insert
  }, [
    rows,
    tableName,
    columns,
    dialect,
    includeCreate,
    ifNotExists,
    dropTable,
    batchNum,
  ])

  function loadExample(key) {
    if (JSON_EXAMPLES[key]) {
      setInput(JSON_EXAMPLES[key])
      setFormat('json')
    } else if (CSV_EXAMPLES[key]) {
      setInput(CSV_EXAMPLES[key])
      setFormat('csv')
    }
    setOverrides({})
  }

  function updateOverride(originalName, patch) {
    setOverrides((prev) => ({
      ...prev,
      [originalName]: { ...(prev[originalName] || {}), ...patch },
    }))
  }

  async function handleCopy() {
    if (!fullSql) return
    try {
      await navigator.clipboard.writeText(fullSql)
      setCopied(true)
      message.success(t.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const dialectOptions = [
    { label: t.postgres, value: 'postgres' },
    { label: t.mysql, value: 'mysql' },
    { label: t.sqlite, value: 'sqlite' },
    { label: t.sqlserver, value: 'sqlserver' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <DatabaseOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.inputTitle}>
            <Space style={{ marginBottom: 12 }}>
              <Text>{t.formatLabel}:</Text>
              <Segmented
                value={format}
                onChange={setFormat}
                options={[
                  { label: t.formatCsv, value: 'csv' },
                  { label: t.formatJson, value: 'json' },
                ]}
              />
            </Space>
            <TextArea
              rows={10}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              style={{ fontFamily: 'monospace' }}
            />
            <Space style={{ marginTop: 12 }} wrap>
              {format === 'csv' && (
                <>
                  <Text>{t.delimiter}:</Text>
                  <Radio.Group
                    value={delimiterKey}
                    onChange={(e) => setDelimiterKey(e.target.value)}
                    optionType="button"
                    size="small"
                  >
                    <Radio.Button value="comma">{t.comma}</Radio.Button>
                    <Radio.Button value="semicolon">{t.semicolon}</Radio.Button>
                    <Radio.Button value="tab">{t.tab}</Radio.Button>
                  </Radio.Group>
                </>
              )}
              {format === 'json' && (
                <>
                  <Text>{t.nested}:</Text>
                  <Segmented
                    value={nested}
                    onChange={setNested}
                    options={[
                      { label: t.nestedJson, value: 'json' },
                      { label: t.nestedText, value: 'null' },
                    ]}
                  />
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.optionsTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Text>{t.tableLabel}</Text>
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  style={{ width: 200 }}
                />
              </Space>
              <Space wrap>
                <Text>{t.dialect}</Text>
                <Segmented
                  value={dialect}
                  onChange={setDialect}
                  options={dialectOptions}
                />
              </Space>
              <Space wrap>
                <Text>{t.batchLabel}</Text>
                <Select
                  value={batchSize}
                  onChange={setBatchSize}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: t.batchAll },
                    { value: '1', label: '1' },
                    { value: '10', label: '10' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: '500', label: '500' },
                  ]}
                />
              </Space>
              <Space wrap>
                <Checkbox
                  checked={includeCreate}
                  onChange={(e) => setIncludeCreate(e.target.checked)}
                >
                  {t.includeCreate}
                </Checkbox>
                <Checkbox
                  checked={ifNotExists}
                  onChange={(e) => setIfNotExists(e.target.checked)}
                  disabled={!includeCreate}
                >
                  {t.ifNotExists}
                </Checkbox>
                <Checkbox
                  checked={dropTable}
                  onChange={(e) => setDropTable(e.target.checked)}
                  disabled={!includeCreate}
                >
                  {t.dropTable}
                </Checkbox>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {jsonError && (
        <Alert type="error" showIcon message={t.errTitle} description={jsonError} />
      )}

      <Card
        title={t.columnsTitle}
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => setOverrides({})}
            disabled={Object.keys(overrides).length === 0}
          >
            {t.resetColumns}
          </Button>
        }
      >
        {columns.length === 0 ? (
          <Text type="secondary">{t.empty}</Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {columns.map((col) => (
              <Row key={col.originalName} gutter={[12, 12]} align="middle">
                <Col xs={24} sm={8}>
                  <Input
                    value={col.name}
                    onChange={(e) =>
                      updateOverride(col.originalName, { name: e.target.value })
                    }
                    addonBefore={t.columnName}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Select
                    value={col.type}
                    onChange={(value) =>
                      updateOverride(col.originalName, { type: value })
                    }
                    style={{ width: '100%' }}
                    options={COMMON_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />
                </Col>
                <Col xs={6} sm={4}>
                  <Checkbox
                    checked={col.nullable}
                    onChange={(e) =>
                      updateOverride(col.originalName, { nullable: e.target.checked })
                    }
                  >
                    {t.nullable}
                  </Checkbox>
                </Col>
                <Col xs={6} sm={4}>
                  <Checkbox
                    checked={col.primaryKey}
                    onChange={(e) =>
                      updateOverride(col.originalName, { primaryKey: e.target.checked })
                    }
                  >
                    {t.primaryKey}
                  </Checkbox>
                </Col>
              </Row>
            ))}
          </Space>
        )}
      </Card>

      <Card
        title={t.resultTitle}
        extra={
          <Space>
            <Select
              value={undefined}
              placeholder={t.example}
              size="small"
              style={{ width: 160 }}
              onChange={loadExample}
              options={[
                { value: 'users', label: t.exampleUsers },
                { value: 'products', label: t.exampleProducts },
                { value: 'orders', label: t.exampleOrders },
                { value: 'jsonUsers', label: t.exampleJsonUsers },
              ]}
            />
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={() => {
                setInput('')
                setOverrides({})
              }}
              disabled={!input}
            >
              {t.clear}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              disabled={!fullSql}
            >
              {copied ? t.copied : t.copy}
            </Button>
          </Space>
        }
      >
        {fullSql ? (
          <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12 }}>
            <code>{fullSql}</code>
          </pre>
        ) : (
          <Text type="secondary">
            {jsonError ? t.errTitle : t.empty}
          </Text>
        )}
      </Card>

      {fullSql && (
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title={t.statRows} value={Math.max(rows.length - 1, 0)} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title={t.statCols} value={columns.length} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title={t.statBytes} value={fullSql.length} />
            </Card>
          </Col>
        </Row>
      )}

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{SOURCE_SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}
