import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Collapse,
  Alert,
  Table,
  Tag,
  Switch,
} from 'antd'
import {
  DatabaseOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ENGINES,
  ENGINE_LABELS,
  DATA_TYPES,
  DATA_TYPE_KEYS,
  INDEX_TYPES,
  INDEX_TYPE_KEYS,
  PRESETS,
  estimateDatabase,
  estimateTable,
  formatBytes,
  createEmptyColumn,
  createEmptyIndex,
  createEmptyTable,
} from '../utils/databaseStorageEstimator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const sourceCode = `import { estimateDatabase, estimateTable, ENGINES } from '../utils/databaseStorageEstimator'

// Estimar um banco completo
const result = estimateDatabase({
  engine: ENGINES.INNODB,
  growth: 20, // % ao ano
  tables: [
    {
      name: 'users',
      rows: 1_000_000,
      columns: [
        { name: 'id', type: 'BIGINT', size: 0, nullable: false },
        { name: 'email', type: 'VARCHAR', size: 120, nullable: false },
        { name: 'created_at', type: 'DATETIME', size: 0, nullable: false },
      ],
      indexes: [
        { name: 'PRIMARY', type: 'BTREE', columns: ['id'] },
        { name: 'idx_email', type: 'BTREE', columns: ['email'] },
      ],
    },
  ],
})

// result.totalNow, result.totalData, result.totalIndexes, result.projected1y...

// Estimar apenas uma tabela
estimateTable(usersTable, ENGINES.INNODB)
`

const translations = {
  pt: {
    title: 'Estimador de Tamanho de Banco de Dados',
    subtitle: 'Calcule o storage necessário para tabelas, colunas e índices',
    intro: 'Dimensione o armazenamento de bancos de dados relacionais e documentos a partir do esquema, número de linhas e crescimento esperado. Escolha o engine, monte as tabelas/coleções com colunas e índices, e veja o tamanho estimado hoje e em 1, 3 e 5 anos. Todos os cálculos são aproximações client-side — nenhum dado sai do navegador.',
    engineLabel: 'Engine / banco',
    engineHelp: 'Cada engine tem overhead de linha, página e índice diferentes.',
    growthLabel: 'Crescimento anual (%)',
    growthHelp: 'Taxa de crescimento estimada do volume de dados.',
    presets: 'Cenários rápidos',
    tablesTitle: 'Tabelas / Coleções',
    addTable: 'Adicionar tabela',
    tableName: 'Nome',
    rows: 'Linhas estimadas',
    columns: 'Colunas',
    columnName: 'Nome da coluna',
    type: 'Tipo',
    size: 'Tamanho médio',
    sizeHelp: 'Usado para tipos variáveis (VARCHAR, TEXT, JSON, BLOB...).',
    nullable: 'Nullable',
    indexes: 'Índices',
    indexName: 'Nome do índice',
    indexType: 'Tipo',
    indexColumns: 'Colunas (vírgula)',
    addColumn: 'Adicionar coluna',
    addIndex: 'Adicionar índice',
    remove: 'Remover',
    resultsTitle: 'Resultado estimado',
    totalNow: 'Tamanho total hoje',
    totalData: 'Dados',
    totalIndexes: 'Índices',
    totalRows: 'Linhas totais',
    projected1y: 'Projeção 1 ano',
    projected3y: 'Projeção 3 anos',
    projected5y: 'Projeção 5 anos',
    breakdownTitle: 'Detalhamento por tabela',
    tableNameCol: 'Tabela',
    rowsCol: 'Linhas',
    rowSizeCol: 'Bytes/linha',
    dataSizeCol: 'Dados',
    indexSizeCol: 'Índices',
    totalSizeCol: 'Total',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    noteTitle: 'Como funciona',
    noteBody: 'O tamanho de cada linha é a soma dos bytes dos tipos de dados mais o overhead fixo do engine escolhido. O tamanho dos índices depende do tipo (B-tree, Hash, Full-text, GIN/GiST) e das colunas indexadas. O resultado final inclui um fator de overhead de página/heap. Use como ordem de grandeza, não como valor exato.',
    emptyTable: 'Adicione pelo menos uma tabela para estimar o tamanho.',
    copied: 'Copiado!',
    clearAll: 'Limpar tudo',
  },
  en: {
    title: 'Database Storage Estimator',
    subtitle: 'Calculate storage needs for tables, columns and indexes',
    intro: 'Size relational and document databases from schema, row counts and expected growth. Pick the engine, build tables/collections with columns and indexes, and see the estimated size today and in 1, 3 and 5 years. All calculations are client-side approximations — no data leaves the browser.',
    engineLabel: 'Engine / database',
    engineHelp: 'Each engine has different row, page and index overhead.',
    growthLabel: 'Annual growth (%)',
    growthHelp: 'Estimated yearly growth rate of data volume.',
    presets: 'Quick scenarios',
    tablesTitle: 'Tables / Collections',
    addTable: 'Add table',
    tableName: 'Name',
    rows: 'Estimated rows',
    columns: 'Columns',
    columnName: 'Column name',
    type: 'Type',
    size: 'Average size',
    sizeHelp: 'Used for variable-length types (VARCHAR, TEXT, JSON, BLOB...).',
    nullable: 'Nullable',
    indexes: 'Indexes',
    indexName: 'Index name',
    indexType: 'Type',
    indexColumns: 'Columns (comma)',
    addColumn: 'Add column',
    addIndex: 'Add index',
    remove: 'Remove',
    resultsTitle: 'Estimated result',
    totalNow: 'Total size today',
    totalData: 'Data',
    totalIndexes: 'Indexes',
    totalRows: 'Total rows',
    projected1y: '1-year projection',
    projected3y: '3-year projection',
    projected5y: '5-year projection',
    breakdownTitle: 'Breakdown by table',
    tableNameCol: 'Table',
    rowsCol: 'Rows',
    rowSizeCol: 'Bytes/row',
    dataSizeCol: 'Data',
    indexSizeCol: 'Indexes',
    totalSizeCol: 'Total',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    noteTitle: 'How it works',
    noteBody: 'Each row size is the sum of the chosen data-type bytes plus the selected engine fixed row overhead. Index size depends on the index type (B-tree, Hash, Full-text, GIN/GiST) and indexed columns. The final result includes a page/heap overhead factor. Treat the output as an order-of-magnitude estimate, not an exact value.',
    emptyTable: 'Add at least one table to estimate size.',
    copied: 'Copied!',
    clearAll: 'Clear all',
  },
}

function updateTable(tables, index, updater) {
  const next = [...tables]
  next[index] = updater(next[index])
  return next
}

export default function DatabaseStorageEstimatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [engine, setEngine] = useState(ENGINES.INNODB)
  const [growth, setGrowth] = useState(20)
  const [tables, setTables] = useState(() => [
    {
      name: 'users',
      rows: 1_000_000,
      columns: [
        { name: 'id', type: 'BIGINT', size: 0, nullable: false },
        { name: 'email', type: 'VARCHAR', size: 120, nullable: false },
        { name: 'name', type: 'VARCHAR', size: 120, nullable: true },
        { name: 'active', type: 'BOOLEAN', size: 0, nullable: false },
        { name: 'created_at', type: 'DATETIME', size: 0, nullable: false },
      ],
      indexes: [
        { name: 'PRIMARY', type: 'BTREE', columns: ['id'] },
        { name: 'idx_email', type: 'BTREE', columns: ['email'] },
      ],
    },
  ])

  const dbParams = useMemo(
    () => ({ engine, growth, tables }),
    [engine, growth, tables]
  )

  const result = useMemo(() => estimateDatabase(dbParams), [dbParams])

  const handlePreset = (preset) => {
    setEngine(preset.engine)
    setGrowth(preset.growth)
    setTables(preset.tables.map((t) => ({ ...t })))
  }

  const addTable = () => {
    setTables((prev) => [...prev, createEmptyTable()])
  }

  const removeTable = (idx) => {
    setTables((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateTableField = (idx, field, value) => {
    setTables((prev) =>
      updateTable(prev, idx, (tbl) => ({ ...tbl, [field]: value }))
    )
  }

  const addColumn = (tableIdx) => {
    setTables((prev) =>
      updateTable(prev, tableIdx, (tbl) => ({
        ...tbl,
        columns: [...tbl.columns, createEmptyColumn()],
      }))
    )
  }

  const removeColumn = (tableIdx, colIdx) => {
    setTables((prev) =>
      updateTable(prev, tableIdx, (tbl) => ({
        ...tbl,
        columns: tbl.columns.filter((_, i) => i !== colIdx),
      }))
    )
  }

  const updateColumn = (tableIdx, colIdx, field, value) => {
    setTables((prev) =>
      updateTable(prev, tableIdx, (tbl) => {
        const nextColumns = [...tbl.columns]
        nextColumns[colIdx] = { ...nextColumns[colIdx], [field]: value }
        return { ...tbl, columns: nextColumns }
      })
    )
  }

  const addIndex = (tableIdx) => {
    setTables((prev) =>
      updateTable(prev, tableIdx, (tbl) => ({
        ...tbl,
        indexes: [...tbl.indexes, createEmptyIndex()],
      }))
    )
  }

  const removeIndex = (tableIdx, idxIdx) => {
    setTables((prev) =>
      updateTable(prev, tableIdx, (tbl) => ({
        ...tbl,
        indexes: tbl.indexes.filter((_, i) => i !== idxIdx),
      }))
    )
  }

  const updateIndex = (tableIdx, idxIdx, field, value) => {
    setTables((prev) =>
      updateTable(prev, tableIdx, (tbl) => {
        const nextIndexes = [...tbl.indexes]
        nextIndexes[idxIdx] = { ...nextIndexes[idxIdx], [field]: value }
        return { ...tbl, indexes: nextIndexes }
      })
    )
  }

  const handleCopy = () => {
    const report = [
      `${t.title}`,
      `Engine: ${ENGINE_LABELS[engine][lang]}`,
      `${t.growthLabel}: ${growth}%`,
      `${t.totalNow}: ${formatBytes(result.totalNow)}`,
      `${t.totalData}: ${formatBytes(result.totalData)}`,
      `${t.totalIndexes}: ${formatBytes(result.totalIndexes)}`,
      `${t.totalRows}: ${result.totalRows.toLocaleString(lang)}`,
      `${t.projected1y}: ${formatBytes(result.projected1y)}`,
      `${t.projected3y}: ${formatBytes(result.projected3y)}`,
      `${t.projected5y}: ${formatBytes(result.projected5y)}`,
      '',
      t.breakdownTitle,
      ...result.tables.map(
        (tbl) =>
          `- ${tbl.name}: ${formatBytes(tbl.totalSize)} (${tbl.rows.toLocaleString(lang)} rows, ${formatBytes(tbl.tableDataSize)} data + ${formatBytes(tbl.indexSize)} indexes)`
      ),
    ].join('\n')
    navigator.clipboard.writeText(report)
  }

  const breakdownColumns = [
    { title: t.tableNameCol, dataIndex: 'name', key: 'name' },
    {
      title: t.rowsCol,
      dataIndex: 'rows',
      key: 'rows',
      align: 'right',
      render: (v) => v.toLocaleString(lang),
    },
    {
      title: t.rowSizeCol,
      dataIndex: 'rowSize',
      key: 'rowSize',
      align: 'right',
      render: (v) => `${v} B`,
    },
    {
      title: t.dataSizeCol,
      dataIndex: 'tableDataSize',
      key: 'tableDataSize',
      align: 'right',
      render: (v) => formatBytes(v),
    },
    {
      title: t.indexSizeCol,
      dataIndex: 'indexSize',
      key: 'indexSize',
      align: 'right',
      render: (v) => formatBytes(v),
    },
    {
      title: t.totalSizeCol,
      dataIndex: 'totalSize',
      key: 'totalSize',
      align: 'right',
      render: (v) => <Text strong>{formatBytes(v)}</Text>,
    },
  ]

  const chartData = result.tables.map((tbl) => ({
    name: tbl.name,
    data: tbl.tableDataSize,
    index: tbl.indexSize,
  }))
  const chartMax = Math.max(1, ...chartData.map((d) => d.data + d.index))

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <DatabaseOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t.engineLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.engineHelp}
                </Text>
                <Select value={engine} onChange={setEngine} style={{ width: '100%' }}>
                  {Object.values(ENGINES).map((e) => (
                    <Option key={e} value={e}>
                      {ENGINE_LABELS[e][lang]}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>{t.growthLabel}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.growthHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={1000}
                  step={1}
                  value={growth}
                  onChange={(v) => setGrowth(v === null ? 0 : v)}
                  suffix="%"
                />
              </div>

              <div>
                <Text strong>{t.presets}</Text>
                <Space wrap style={{ marginTop: 8 }}>
                  {PRESETS.map((preset) => (
                    <Button key={preset.key} size="small" onClick={() => handlePreset(preset)}>
                      {preset.label[lang]}
                    </Button>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>

          <Card title={t.tablesTitle} style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {tables.map((table, tIdx) => (
                <Card
                  key={tIdx}
                  size="small"
                  title={
                    <Input
                      value={table.name}
                      onChange={(e) => updateTableField(tIdx, 'name', e.target.value)}
                      placeholder={t.tableName}
                      variant="borderless"
                      style={{ fontWeight: 600 }}
                    />
                  }
                  extra={
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeTable(tIdx)}
                    >
                      {t.remove}
                    </Button>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Text strong>{t.rows}</Text>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={1000}
                        value={table.rows}
                        onChange={(v) => updateTableField(tIdx, 'rows', v === null ? 0 : v)}
                      />
                    </div>

                    <div>
                      <Text strong>{t.columns}</Text>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {table.columns.map((col, cIdx) => (
                          <Row key={cIdx} gutter={[8, 8]} align="middle">
                            <Col span={8}>
                              <Input
                                value={col.name}
                                onChange={(e) => updateColumn(tIdx, cIdx, 'name', e.target.value)}
                                placeholder={t.columnName}
                              />
                            </Col>
                            <Col span={7}>
                              <Select
                                value={col.type}
                                onChange={(v) => updateColumn(tIdx, cIdx, 'type', v)}
                                style={{ width: '100%' }}
                              >
                                {DATA_TYPE_KEYS.map((k) => (
                                  <Option key={k} value={k}>
                                    {DATA_TYPES[k].label}
                                  </Option>
                                ))}
                              </Select>
                            </Col>
                            <Col span={4}>
                              <InputNumber
                                min={0}
                                step={8}
                                value={col.size}
                                disabled={!DATA_TYPES[col.type]?.variable}
                                onChange={(v) => updateColumn(tIdx, cIdx, 'size', v === null ? 0 : v)}
                                placeholder={t.size}
                                style={{ width: '100%' }}
                              />
                            </Col>
                            <Col span={3}>
                              <Switch
                                checked={col.nullable}
                                onChange={(v) => updateColumn(tIdx, cIdx, 'nullable', v)}
                                checkedChildren="NULL"
                                unCheckedChildren="NOT"
                                size="small"
                              />
                            </Col>
                            <Col span={2}>
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeColumn(tIdx, cIdx)}
                              />
                            </Col>
                          </Row>
                        ))}
                        <Button size="small" icon={<PlusOutlined />} onClick={() => addColumn(tIdx)}>
                          {t.addColumn}
                        </Button>
                      </Space>
                    </div>

                    <div>
                      <Text strong>{t.indexes}</Text>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {table.indexes.map((idx, iIdx) => (
                          <Row key={iIdx} gutter={[8, 8]} align="middle">
                            <Col span={7}>
                              <Input
                                value={idx.name}
                                onChange={(e) => updateIndex(tIdx, iIdx, 'name', e.target.value)}
                                placeholder={t.indexName}
                              />
                            </Col>
                            <Col span={6}>
                              <Select
                                value={idx.type}
                                onChange={(v) => updateIndex(tIdx, iIdx, 'type', v)}
                                style={{ width: '100%' }}
                              >
                                {INDEX_TYPE_KEYS.map((k) => (
                                  <Option key={k} value={k}>
                                    {INDEX_TYPES[k].label}
                                  </Option>
                                ))}
                              </Select>
                            </Col>
                            <Col span={9}>
                              <Input
                                value={Array.isArray(idx.columns) ? idx.columns.join(', ') : idx.columns}
                                onChange={(e) =>
                                  updateIndex(
                                    tIdx,
                                    iIdx,
                                    'columns',
                                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                  )
                                }
                                placeholder={t.indexColumns}
                              />
                            </Col>
                            <Col span={2}>
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeIndex(tIdx, iIdx)}
                              />
                            </Col>
                          </Row>
                        ))}
                        <Button size="small" icon={<PlusOutlined />} onClick={() => addIndex(tIdx)}>
                          {t.addIndex}
                        </Button>
                      </Space>
                    </div>
                  </Space>
                </Card>
              ))}
              <Button icon={<PlusOutlined />} onClick={addTable}>
                {t.addTable}
              </Button>
              <Button icon={<SyncOutlined />} onClick={() => setTables([createEmptyTable()])}>
                {t.clearAll}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={t.resultsTitle}>
            {tables.length === 0 || result.totalRows === 0 ? (
              <Alert type="info" showIcon message={t.emptyTable} />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Statistic title={t.totalNow} value={formatBytes(result.totalNow)} />
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic title={t.totalData} value={formatBytes(result.totalData)} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic title={t.totalIndexes} value={formatBytes(result.totalIndexes)} />
                    </Card>
                  </Col>
                </Row>
                <Statistic title={t.totalRows} value={result.totalRows.toLocaleString(lang)} />
                <Row gutter={[12, 12]}>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title={t.projected1y} value={formatBytes(result.projected1y)} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title={t.projected3y} value={formatBytes(result.projected3y)} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic title={t.projected5y} value={formatBytes(result.projected5y)} />
                    </Card>
                  </Col>
                </Row>
                <Button icon={<CopyOutlined />} onClick={handleCopy}>
                  {lang === 'pt' ? 'Copiar resumo' : 'Copy summary'}
                </Button>

                {result.tables.length > 0 && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      {t.breakdownTitle}
                    </Text>
                    <Table
                      dataSource={result.tables}
                      columns={breakdownColumns}
                      rowKey={(r) => r.name}
                      pagination={false}
                      size="small"
                      summary={() => (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <Text strong>Total</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            {result.totalRows.toLocaleString(lang)}
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right">-</Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right">
                            {formatBytes(result.totalData)}
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="right">
                            {formatBytes(result.totalIndexes)}
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5} align="right">
                            <Text strong>{formatBytes(result.totalNow)}</Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      )}
                    />
                  </div>
                )}

                {chartData.length > 0 && (
                  <Card size="small">
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      {t.breakdownTitle}
                    </Text>
                    <svg viewBox="0 0 320 160" width="100%" height={160} role="img" aria-label={t.breakdownTitle}>
                      {chartData.map((d, i) => {
                        const barHeight = ((d.data + d.index) / chartMax) * 110
                        const x = 20 + i * (280 / Math.max(chartData.length, 1))
                        const width = 240 / Math.max(chartData.length, 1)
                        const dataHeight = (d.data / chartMax) * 110
                        const indexHeight = (d.index / chartMax) * 110
                        return (
                          <g key={d.name}>
                            <rect
                              x={x}
                              y={130 - barHeight}
                              width={width}
                              height={barHeight}
                              fill="#1677ff"
                              rx={4}
                            />
                            <rect
                              x={x}
                              y={130 - dataHeight}
                              width={width}
                              height={indexHeight}
                              fill="#52c41a"
                              rx={4}
                            />
                            <text
                              x={x + width / 2}
                              y={145}
                              textAnchor="middle"
                              fill="#595959"
                              fontSize="10"
                            >
                              {d.name.length > 10 ? `${d.name.slice(0, 10)}...` : d.name}
                            </text>
                          </g>
                        )
                      })}
                      <text x="20" y="15" fill="#1677ff" fontSize="10">data</text>
                      <text x="60" y="15" fill="#52c41a" fontSize="10">indexes</text>
                    </svg>
                  </Card>
                )}
              </Space>
            )}
          </Card>

          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message={t.noteTitle}
            description={t.noteBody}
            style={{ marginTop: 16 }}
          />
        </Col>
      </Row>

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
