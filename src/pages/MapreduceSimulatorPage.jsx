import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Select,
  Input,
  Row,
  Col,
  Collapse,
  Statistic,
  Table,
  Alert,
} from 'antd'
import {
  ApartmentOutlined,
  PlayCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  runJob,
  sourceCode,
} from '../utils/mapreduceSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select
const { TextArea } = Input

const MAX_CHARS = 5000
const MAX_LINES = 300
const MAX_TABLE_ROWS = 50

const translations = {
  pt: {
    title: 'Simulador de MapReduce',
    intro:
      'Execute localmente um pipeline MapReduce completo: split -> map -> shuffle/sort -> reduce. Entenda como uma funcao de map emite pares (chave, valor), o shuffle agrupa por chave e o reduce consolida os resultados — tudo no navegador, sem enviar dados para lugar nenhum.',
    inputLabel: 'Documentos de entrada',
    inputPlaceholder: 'Cole ou digite o texto aqui. Cada linha sera um documento.',
    inputHelp: 'Cada linha vira um registro de entrada com chave numerada.',
    presetLabel: 'Job (map + reduce)',
    filterLabel: 'Substring para filtrar',
    filterPlaceholder: 'Ex: erro',
    runButton: 'Executar job',
    statsTitle: 'Estatisticas do job',
    inputRecords: 'Registros de entrada',
    mappedRecords: 'Pares emitidos pelo map',
    groups: 'Grupos apos shuffle',
    outputRecords: 'Registros de saida',
    phaseInput: '1. Entrada (split)',
    phaseMap: '2. Map',
    phaseShuffle: '3. Shuffle / Sort',
    phaseReduce: '4. Reduce (saida)',
    keyColumn: 'Chave',
    valueColumn: 'Valor',
    valuesColumn: 'Valores',
    lineColumn: 'Linha',
    limitNotice: 'Mostrando os {limit} primeiros de {total}.',
    emptyState: 'Nenhum dado para exibir com a configuracao atual.',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        MapReduce divide o processamento em quatro fases. Na fase{' '}
        <Text code>split</Text> a entrada e dividida em fragmentos. Cada
        fragmento passa por uma funcao <Text code>map</Text> que emite pares{' '}
        <Text code>(chave, valor)</Text>. O framework entao faz{' '}
        <Text code>shuffle/sort</Text>, agrupando todos os valores com a mesma
        chave. Por fim, a funcao <Text code>reduce</Text> recebe cada grupo e
        produz o resultado final. Esse modelo permite escalar horizontalmente:
        muitos mappers e reducers processam dados em paralelo.
      </>
    ),
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'MapReduce Simulator',
    intro:
      'Run a full MapReduce pipeline locally: split -> map -> shuffle/sort -> reduce. See how a map function emits (key, value) pairs, shuffle groups by key, and reduce consolidates the results — all in the browser, no data leaves your machine.',
    inputLabel: 'Input documents',
    inputPlaceholder: 'Paste or type text here. Each line becomes one document.',
    inputHelp: 'Each non-empty line becomes a numbered input record.',
    presetLabel: 'Job (map + reduce)',
    filterLabel: 'Substring to filter',
    filterPlaceholder: 'e.g. error',
    runButton: 'Run job',
    statsTitle: 'Job statistics',
    inputRecords: 'Input records',
    mappedRecords: 'Map output pairs',
    groups: 'Groups after shuffle',
    outputRecords: 'Output records',
    phaseInput: '1. Input (split)',
    phaseMap: '2. Map',
    phaseShuffle: '3. Shuffle / Sort',
    phaseReduce: '4. Reduce (output)',
    keyColumn: 'Key',
    valueColumn: 'Value',
    valuesColumn: 'Values',
    lineColumn: 'Line',
    limitNotice: 'Showing first {limit} of {total}.',
    emptyState: 'No data to display for the current configuration.',
    explanationTitle: 'How it works',
    explanation: (
      <>
        MapReduce splits processing into four phases. During{' '}
        <Text code>split</Text> the input is divided into chunks. Each chunk is
        processed by a <Text code>map</Text> function that emits{' '}
        <Text code>(key, value)</Text> pairs. The framework then performs{' '}
        <Text code>shuffle/sort</Text>, grouping all values that share the same
        key. Finally, the <Text code>reduce</Text> function receives each group
        and produces the final output. This model scales horizontally: many
        mappers and reducers can run in parallel.
      </>
    ),
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
  },
}

export default function MapreduceSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [text, setText] = useState(
    lang === 'pt'
      ? 'o rato roeu a roupa do rei de roma\na rainha de roma roeu a roupa do rato\nmapreduce e um modelo de processamento distribuido\nprocessamento distribuido e paralelo'
      : 'the quick brown fox jumps over the lazy dog\nmapreduce is a distributed processing model\ndistributed processing enables parallel computation\nthe lazy dog was not impressed'
  )
  const [presetKey, setPresetKey] = useState('word-count')
  const [filterText, setFilterText] = useState('')
  const [runId, setRunId] = useState(0)
  const [copied, setCopied] = useState(false)

  const options = useMemo(
    () => ({ filterText }),
    [filterText]
  )

  const job = useMemo(
    () => runJob(text.slice(0, MAX_CHARS), presetKey, options),
    [text, presetKey, options, runId]
  )

  function applyPreset(key) {
    setPresetKey(key)
    setRunId((id) => id + 1)
  }

  function handleTextChange(e) {
    const value = e.target.value
    const lines = value.split('\n')
    if (lines.length > MAX_LINES) {
      setText(lines.slice(0, MAX_LINES).join('\n'))
    } else {
      setText(value)
    }
  }

  function handleRun() {
    setRunId((id) => id + 1)
  }

  function handleCopy() {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const inputColumns = [
    { title: t.lineColumn, dataIndex: 'key', key: 'key', width: 80 },
    { title: t.valueColumn, dataIndex: 'value', key: 'value' },
  ]

  const mapColumns = [
    { title: t.keyColumn, dataIndex: 'key', key: 'key' },
    { title: t.valueColumn, dataIndex: 'value', key: 'value', width: 100 },
  ]

  const shuffleColumns = [
    { title: t.keyColumn, dataIndex: 'key', key: 'key' },
    {
      title: t.valuesColumn,
      dataIndex: 'values',
      key: 'values',
      render: (values) => (
        <Text ellipsis style={{ maxWidth: 240 }} title={JSON.stringify(values)}>
          {JSON.stringify(values)}
        </Text>
      ),
    },
  ]

  const reduceColumns = [
    { title: t.keyColumn, dataIndex: 'key', key: 'key' },
    {
      title: t.valueColumn,
      dataIndex: 'value',
      key: 'value',
      render: (value) => (
        <Text ellipsis style={{ maxWidth: 240 }} title={JSON.stringify(value)}>
          {Array.isArray(value) ? `${value.length} item(s)` : String(value)}
        </Text>
      ),
    },
  ]

  const inputData = job.inputRecords.slice(0, MAX_TABLE_ROWS)
  const mappedData = job.mapped.slice(0, MAX_TABLE_ROWS)
  const groupedData = job.grouped.slice(0, MAX_TABLE_ROWS)
  const outputData = job.output.slice(0, MAX_TABLE_ROWS)

  const stats = [
    { label: t.inputRecords, value: job.stats.inputRecords },
    { label: t.mappedRecords, value: job.stats.mappedRecords },
    { label: t.groups, value: job.stats.groups },
    { label: t.outputRecords, value: job.stats.outputRecords },
  ]

  const isFilterPreset = presetKey === 'filter-lines'
  const hasData = job.stats.inputRecords > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[24, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.inputLabel}>
            <TextArea
              value={text}
              onChange={handleTextChange}
              rows={8}
              placeholder={t.inputPlaceholder}
              showCount
              maxLength={MAX_CHARS}
            />
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {t.inputHelp}
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t.statsTitle}>
            <Row gutter={[16, 16]}>
              {stats.map((s) => (
                <Col xs={12} key={s.label}>
                  <Statistic title={s.label} value={s.value} />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[24, 16]} align="bottom">
          <Col xs={24} md={12}>
            <Text strong>{t.presetLabel}</Text>
            <Select
              value={presetKey}
              onChange={applyPreset}
              style={{ width: '100%' }}
              optionLabelProp="label"
            >
              {presets.map((preset) => (
                <Option
                  key={preset.key}
                  value={preset.key}
                  label={preset.label}
                >
                  <div>
                    <Text strong>{preset.label}</Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {preset.description}
                      </Text>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Col>
          {isFilterPreset && (
            <Col xs={24} md={12}>
              <Text strong>{t.filterLabel}</Text>
              <Input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={t.filterPlaceholder}
                allowClear
              />
            </Col>
          )}
          <Col xs={24} md={isFilterPreset ? 24 : 12}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              block={false}
            >
              {t.runButton}
            </Button>
          </Col>
        </Row>
      </Card>

      {!hasData && (
        <Alert type="info" message={t.emptyState} showIcon />
      )}

      {hasData && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={6}>
            <Card
              title={t.phaseInput}
              size="small"
              extra={
                job.inputRecords > MAX_TABLE_ROWS && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t.limitNotice
                      .replace('{limit}', MAX_TABLE_ROWS)
                      .replace('{total}', job.inputRecords)}
                  </Text>
                )
              }
            >
              <Table
                dataSource={inputData}
                columns={inputColumns}
                pagination={false}
                size="small"
                rowKey="key"
                bordered
                scroll={{ y: 240 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              title={t.phaseMap}
              size="small"
              extra={
                job.mapped.length > MAX_TABLE_ROWS && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t.limitNotice
                      .replace('{limit}', MAX_TABLE_ROWS)
                      .replace('{total}', job.mapped.length)}
                  </Text>
                )
              }
            >
              <Table
                dataSource={mappedData}
                columns={mapColumns}
                pagination={false}
                size="small"
                rowKey={(record, index) => `map-${record.key}-${index}`}
                bordered
                scroll={{ y: 240 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              title={t.phaseShuffle}
              size="small"
              extra={
                job.grouped.length > MAX_TABLE_ROWS && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t.limitNotice
                      .replace('{limit}', MAX_TABLE_ROWS)
                      .replace('{total}', job.grouped.length)}
                  </Text>
                )
              }
            >
              <Table
                dataSource={groupedData}
                columns={shuffleColumns}
                pagination={false}
                size="small"
                rowKey="key"
                bordered
                scroll={{ y: 240 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              title={t.phaseReduce}
              size="small"
              extra={
                job.output.length > MAX_TABLE_ROWS && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t.limitNotice
                      .replace('{limit}', MAX_TABLE_ROWS)
                      .replace('{total}', job.output.length)}
                  </Text>
                )
              }
            >
              <Table
                dataSource={outputData}
                columns={reduceColumns}
                pagination={false}
                size="small"
                rowKey="key"
                bordered
                scroll={{ y: 240 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card title={t.explanationTitle}>
        <Paragraph>{t.explanation}</Paragraph>
      </Card>

      <Collapse defaultActiveKey={[]}>
        <Panel
          header={t.sourceCode}
          extra={
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
