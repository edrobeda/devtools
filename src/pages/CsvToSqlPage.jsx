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

const EXAMPLES = {
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

const translations = {
  pt: {
    title: 'CSV → SQL',
    intro:
      'Cole uma planilha CSV e gere comandos CREATE TABLE + INSERT prontos para rodar no PostgreSQL, MySQL, SQLite ou SQL Server. O motor infere os tipos a partir dos dados, normaliza os nomes das colunas e deixa você ajustar cada campo antes de gerar o SQL. Tudo acontece no navegador — nenhum dado sai daqui.',
    inputTitle: 'CSV de entrada',
    inputPlaceholder:
      'id,nome,email\n1,Ana,ana@example.com\n2,Bruno,bruno@example.com',
    delimiter: 'Delimitador',
    comma: 'Vírgula',
    semicolon: 'Ponto e vírgula',
    tab: 'Tab',
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
    empty: 'Cole um CSV com cabeçalho e pelo menos uma linha de dados para gerar o SQL.',
    copy: 'Copiar SQL',
    copied: 'Copiado!',
    clear: 'Limpar',
    example: 'Exemplo',
    exampleUsers: 'Usuários',
    exampleProducts: 'Produtos',
    exampleOrders: 'Pedidos',
    statRows: 'linhas',
    statCols: 'colunas',
    statBytes: 'bytes',
    note: 'O parser entende aspas, aspas duplicadas ("") e quebras de linha dentro de campos. Tipos são inferidos heuristicamente: booleanos, inteiros, decimais, datas e timestamps. Revise as colunas antes de copiar o SQL para produção — a inferência é uma conveniência, não um schema definitivo.',
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'CSV → SQL',
    intro:
      'Paste a CSV spreadsheet and generate ready-to-run CREATE TABLE + INSERT statements for PostgreSQL, MySQL, SQLite or SQL Server. The engine infers column types from the data, normalizes column names and lets you adjust each field before generating SQL. Fully client-side.',
    inputTitle: 'Input CSV',
    inputPlaceholder:
      'id,name,email\n1,Ana,ana@example.com\n2,Bruno,bruno@example.com',
    delimiter: 'Delimiter',
    comma: 'Comma',
    semicolon: 'Semicolon',
    tab: 'Tab',
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
    empty: 'Paste a CSV with a header row and at least one data row to generate SQL.',
    copy: 'Copy SQL',
    copied: 'Copied!',
    clear: 'Clear',
    example: 'Example',
    exampleUsers: 'Users',
    exampleProducts: 'Products',
    exampleOrders: 'Orders',
    statRows: 'rows',
    statCols: 'columns',
    statBytes: 'bytes',
    note: 'The parser handles quotes, doubled quotes ("") and line breaks inside fields. Types are heuristically inferred: booleans, integers, decimals, dates and timestamps. Review the columns before copying the SQL to production — inference is a convenience, not a definitive schema.',
    sourceTitle: 'Under the hood',
  },
}

export default function CsvToSqlPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState('')
  const [delimiterKey, setDelimiterKey] = useState('comma')
  const [tableName, setTableName] = useState('my_table')
  const [dialect, setDialect] = useState('postgres')
  const [batchSize, setBatchSize] = useState('all')
  const [includeCreate, setIncludeCreate] = useState(true)
  const [ifNotExists, setIfNotExists] = useState(false)
  const [dropTable, setDropTable] = useState(false)
  const [overrides, setOverrides] = useState({})
  const [copied, setCopied] = useState(false)

  const delimiter = DELIMITERS[delimiterKey]

  const rows = useMemo(() => parseCsv(input, delimiter), [input, delimiter])
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
    setInput(EXAMPLES[key])
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
            <TextArea
              rows={10}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              style={{ fontFamily: 'monospace' }}
            />
            <Space style={{ marginTop: 12 }}>
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
              style={{ width: 140 }}
              onChange={loadExample}
              options={[
                { value: 'users', label: t.exampleUsers },
                { value: 'products', label: t.exampleProducts },
                { value: 'orders', label: t.exampleOrders },
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
          <Text type="secondary">{t.empty}</Text>
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
