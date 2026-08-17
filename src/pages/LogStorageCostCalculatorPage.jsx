import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Slider,
  Row,
  Col,
  Statistic,
  Alert,
  Collapse,
  Button,
  Table,
  Tooltip,
} from 'antd'
import {
  FileTextOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateLogStorageCost,
  getPresets,
  buildProjection,
  buildReport,
  formatNumber,
  formatCurrency,
} from '../utils/logStorageCostCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateLogStorageCost } from '../utils/logStorageCostCalculator'

// 50 GB/dia, 30 dias de retenção, compressão 18%
calculateLogStorageCost({
  dailyRawGB: 50,
  retentionDays: 30,
  compressionRatio: 0.18,
  ingestCostPerGB: 0.5,
  storageCostPerGBMonth: 0.03,
  scanCostPerGB: 0.005,
  scannedGBPerDay: 100,
})
// {
//   dailyRawGB: 50,
//   dailyCompressedGB: 9,
//   storedGB: 270,
//   monthlyIngestCost: 750,
//   monthlyStorageCost: 8.10,
//   monthlyScanCost: 15,
//   monthlyTotal: 773.10,
//   yearlyTotal: 9277.20,
//   ...
// }
`

const translations = {
  pt: {
    title: 'Calculadora de Custo de Armazenamento de Logs',
    subtitle: 'Estime gastos de ingestão, retenção e consulta de logs',
    intro: 'Calcule o custo mensal e anual de armazenar logs informando volume diário, retenção, compressão e preços do provedor. Use os presets para comparar cenários comuns como CloudWatch, Datadog, Splunk, Elastic e Loki.',
    dailyRawGB: 'Volume bruto por dia',
    dailyRawGBHelp: 'Quantidade de logs gerados por dia antes da compressão.',
    retentionDays: 'Dias de retenção',
    retentionDaysHelp: 'Por quantos dias os logs ficam armazenados.',
    compressionRatio: 'Taxa de compressão',
    compressionRatioHelp: 'Fração do tamanho original após compressão (20% = 0,2).',
    ingestCostPerGB: 'Custo de ingestão',
    ingestCostPerGBHelp: 'Preço cobrado por GB ingerido (alguns provedores incluem no ingest).',
    storageCostPerGBMonth: 'Custo de armazenamento',
    storageCostPerGBMonthHelp: 'Preço por GB armazenado por mês.',
    scanCostPerGB: 'Custo de consulta',
    scanCostPerGBHelp: 'Preço por GB escaneado em queries (ex.: CloudWatch Insights).',
    scannedGBPerDay: 'GB escaneados por dia',
    scannedGBPerDayHelp: 'Volume médio de dados escaneados diariamente em buscas.',
    presets: 'Exemplos de um clique',
    results: 'Resultados',
    dailyCompressedGB: 'Comprimido por dia',
    storedGB: 'Armazenado no pico',
    monthlyIngestCost: 'Ingestão/mês',
    monthlyStorageCost: 'Armazenamento/mês',
    monthlyScanCost: 'Consulta/mês',
    monthlyTotal: 'Total/mês',
    yearlyTotal: 'Total/ano',
    costPerDay: 'Custo/dia',
    costPerGBIngested: 'Custo por GB ingerido',
    chartTitle: 'Breakdown de custo mensal',
    tableTitle: 'Projeção de custo por mês',
    monthColumn: 'Mês',
    ingestColumn: 'Ingestão',
    storageColumn: 'Armazenamento',
    scanColumn: 'Consulta',
    totalColumn: 'Total',
    cumulativeColumn: 'Storage acumulado',
    notes: 'Observação',
    notesText: 'Os preços dos presets são estimativas aproximadas para ordem de grandeza. Sempre confira a tabela oficial do provedor, pois descontos por volume, tiers de retenção e taxas adicionais podem alterar o valor real.',
    clear: 'Limpar',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    copyReport: 'Copiar relatório',
    downloadReport: 'Baixar relatório',
    copied: 'Copiado!',
  },
  en: {
    title: 'Log Storage Cost Calculator',
    subtitle: 'Estimate log ingest, retention and query costs',
    intro: 'Calculate monthly and yearly log storage costs by entering daily volume, retention, compression and provider prices. Use the presets to compare common scenarios such as CloudWatch, Datadog, Splunk, Elastic and Loki.',
    dailyRawGB: 'Daily raw volume',
    dailyRawGBHelp: 'Amount of logs generated per day before compression.',
    retentionDays: 'Retention days',
    retentionDaysHelp: 'How many days logs are kept.',
    compressionRatio: 'Compression ratio',
    compressionRatioHelp: 'Fraction of the original size after compression (20% = 0.2).',
    ingestCostPerGB: 'Ingest cost',
    ingestCostPerGBHelp: 'Price charged per GB ingested (some providers bundle it).',
    storageCostPerGBMonth: 'Storage cost',
    storageCostPerGBMonthHelp: 'Price per GB stored per month.',
    scanCostPerGB: 'Query cost',
    scanCostPerGBHelp: 'Price per GB scanned in queries (e.g., CloudWatch Insights).',
    scannedGBPerDay: 'GB scanned per day',
    scannedGBPerDayHelp: 'Average volume of data scanned daily in searches.',
    presets: 'One-click examples',
    results: 'Results',
    dailyCompressedGB: 'Compressed per day',
    storedGB: 'Peak stored volume',
    monthlyIngestCost: 'Ingest/month',
    monthlyStorageCost: 'Storage/month',
    monthlyScanCost: 'Query/month',
    monthlyTotal: 'Total/month',
    yearlyTotal: 'Total/year',
    costPerDay: 'Cost/day',
    costPerGBIngested: 'Cost per GB ingested',
    chartTitle: 'Monthly cost breakdown',
    tableTitle: 'Monthly cost projection',
    monthColumn: 'Month',
    ingestColumn: 'Ingest',
    storageColumn: 'Storage',
    scanColumn: 'Query',
    totalColumn: 'Total',
    cumulativeColumn: 'Cumulative storage',
    notes: 'Note',
    notesText: 'Preset prices are rough estimates for order-of-magnitude planning. Always check the official provider pricing page, as volume discounts, retention tiers and extra fees can change the real value.',
    clear: 'Clear',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    copyReport: 'Copy report',
    downloadReport: 'Download report',
    copied: 'Copied!',
  },
}

export default function LogStorageCostCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [dailyRawGB, setDailyRawGB] = useState(50)
  const [retentionDays, setRetentionDays] = useState(30)
  const [compressionRatio, setCompressionRatio] = useState(0.18)
  const [ingestCostPerGB, setIngestCostPerGB] = useState(0.5)
  const [storageCostPerGBMonth, setStorageCostPerGBMonth] = useState(0.03)
  const [scanCostPerGB, setScanCostPerGB] = useState(0.005)
  const [scannedGBPerDay, setScannedGBPerDay] = useState(100)
  const [copied, setCopied] = useState(false)

  const presets = useMemo(() => getPresets(lang), [lang])

  const result = useMemo(
    () =>
      calculateLogStorageCost({
        dailyRawGB,
        retentionDays,
        compressionRatio,
        ingestCostPerGB,
        storageCostPerGBMonth,
        scanCostPerGB,
        scannedGBPerDay,
      }),
    [dailyRawGB, retentionDays, compressionRatio, ingestCostPerGB, storageCostPerGBMonth, scanCostPerGB, scannedGBPerDay]
  )

  const projection = useMemo(() => buildProjection(result, 12), [result])

  const handlePreset = (preset) => {
    setDailyRawGB(preset.dailyRawGB)
    setRetentionDays(preset.retentionDays)
    setCompressionRatio(preset.compressionRatio)
    setIngestCostPerGB(preset.ingestCostPerGB)
    setStorageCostPerGBMonth(preset.storageCostPerGBMonth)
    setScanCostPerGB(preset.scanCostPerGB)
    setScannedGBPerDay(preset.scannedGBPerDay)
  }

  const clearAll = () => {
    setDailyRawGB(50)
    setRetentionDays(30)
    setCompressionRatio(0.18)
    setIngestCostPerGB(0.5)
    setStorageCostPerGBMonth(0.03)
    setScanCostPerGB(0.005)
    setScannedGBPerDay(100)
  }

  const report = useMemo(() => buildReport(result, lang), [result, lang])

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'log-storage-cost-report.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: t.monthColumn,
      dataIndex: 'month',
    },
    {
      title: t.ingestColumn,
      dataIndex: 'ingestCost',
      render: (value) => formatCurrency(value),
    },
    {
      title: t.storageColumn,
      dataIndex: 'storageCost',
      render: (value) => formatCurrency(value),
    },
    {
      title: t.scanColumn,
      dataIndex: 'scanCost',
      render: (value) => formatCurrency(value),
    },
    {
      title: t.totalColumn,
      dataIndex: 'totalCost',
      render: (value) => formatCurrency(value),
    },
    {
      title: t.cumulativeColumn,
      dataIndex: 'cumulativeStorageGB',
      render: (value) => `${formatNumber(value, 0)} GB`,
    },
  ]

  // Gráfico SVG de barras empilhadas: ingest + storage + scan
  const width = 640
  const height = 260
  const padding = { top: 16, right: 24, bottom: 56, left: 72 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const barCount = 12
  const barWidth = (chartWidth / barCount) * 0.65
  const maxTotal = Math.max(...projection.map((p) => p.totalCost), result.monthlyTotal) * 1.15 || 1

  const yScale = (value) =>
    padding.top + chartHeight - (value / maxTotal) * chartHeight

  const colors = {
    ingest: '#1677ff',
    storage: '#52c41a',
    scan: '#faad14',
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <FileTextOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t.dailyRawGB}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.dailyRawGBHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  value={dailyRawGB}
                  onChange={(v) => setDailyRawGB(v ?? 0)}
                  addonAfter="GB"
                />
              </div>

              <div>
                <Text strong>{t.retentionDays}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.retentionDaysHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  value={retentionDays}
                  onChange={(v) => setRetentionDays(v ?? 0)}
                  addonAfter="dias"
                />
              </div>

              <div>
                <Text strong>{t.compressionRatio}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.compressionRatioHelp}
                </Text>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={compressionRatio}
                      onChange={(v) => setCompressionRatio(v)}
                      tooltip={{ formatter: (v) => `${formatNumber(v * 100, 0)}%` }}
                    />
                  </Col>
                  <Col style={{ width: 120 }}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={1}
                      step={0.01}
                      value={compressionRatio}
                      onChange={(v) => setCompressionRatio(v ?? 0)}
                      formatter={(v) => `${formatNumber((v ?? 0) * 100, 0)}%`}
                      parser={(v) => parseFloat((v || '').replace('%', '')) / 100}
                    />
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong>{t.ingestCostPerGB}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.ingestCostPerGBHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  value={ingestCostPerGB}
                  onChange={(v) => setIngestCostPerGB(v ?? 0)}
                  addonAfter="$/GB"
                />
              </div>

              <div>
                <Text strong>{t.storageCostPerGBMonth}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.storageCostPerGBMonthHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.001}
                  value={storageCostPerGBMonth}
                  onChange={(v) => setStorageCostPerGBMonth(v ?? 0)}
                  addonAfter="$/GB/mês"
                />
              </div>

              <div>
                <Text strong>{t.scanCostPerGB}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.scanCostPerGBHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.001}
                  value={scanCostPerGB}
                  onChange={(v) => setScanCostPerGB(v ?? 0)}
                  addonAfter="$/GB"
                />
              </div>

              <div>
                <Text strong>{t.scannedGBPerDay}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.scannedGBPerDayHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  value={scannedGBPerDay}
                  onChange={(v) => setScannedGBPerDay(v ?? 0)}
                  addonAfter="GB/dia"
                />
              </div>

              <Button icon={<SyncOutlined />} onClick={clearAll}>
                {t.clear}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 12 }}>
                {t.results}
              </Text>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={t.dailyCompressedGB}
                    value={`${formatNumber(result.dailyCompressedGB, 2)} GB`}
                    valueStyle={{ color: '#1677ff' }}
                    prefix={<DatabaseOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.storedGB}
                    value={`${formatNumber(result.storedGB, 2)} GB`}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<DatabaseOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.monthlyTotal}
                    value={formatCurrency(result.monthlyTotal)}
                    valueStyle={{ color: '#1677ff' }}
                    prefix={<DollarOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.yearlyTotal}
                    value={formatCurrency(result.yearlyTotal)}
                    valueStyle={{ color: '#1677ff' }}
                    prefix={<DollarOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.monthlyIngestCost}
                    value={formatCurrency(result.monthlyIngestCost)}
                    valueStyle={{ color: '#1677ff' }}
                    prefix={<ThunderboltOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.monthlyStorageCost}
                    value={formatCurrency(result.monthlyStorageCost)}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<DatabaseOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.monthlyScanCost}
                    value={formatCurrency(result.monthlyScanCost)}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<SearchOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.costPerGBIngested}
                    value={formatCurrency(result.costPerGBIngested)}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>{t.presets}</Text>
          <Space wrap>
            {presets.map((preset) => (
              <Tooltip key={preset.key} title={preset.desc}>
                <Button size="small" onClick={() => handlePreset(preset)}>
                  {preset.label}
                </Button>
              </Tooltip>
            ))}
          </Space>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.chartTitle}>
        <div style={{ overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            style={{ minWidth: 320, maxWidth: width }}
            role="img"
            aria-label={t.chartTitle}
          >
            {/* eixos */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#d9d9d9"
              strokeWidth={1}
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#d9d9d9"
              strokeWidth={1}
            />
            {/* grid horizontal */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + chartHeight - ratio * chartHeight
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="#f0f0f0"
                    strokeWidth={1}
                  />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#8c8c8c">
                    {formatCurrency(ratio * maxTotal, 0)}
                  </text>
                </g>
              )
            })}
            {/* barras empilhadas */}
            {projection.map((row, i) => {
              const x = padding.left + (i + 0.5) * (chartWidth / barCount) - barWidth / 2
              const hIngest = (row.ingestCost / maxTotal) * chartHeight
              const hStorage = (row.storageCost / maxTotal) * chartHeight
              const hScan = (row.scanCost / maxTotal) * chartHeight
              const yIngest = padding.top + chartHeight - hIngest
              const yStorage = yIngest - hStorage
              const yScan = yStorage - hScan
              return (
                <g key={row.month}>
                  <rect x={x} y={yIngest} width={barWidth} height={hIngest} fill={colors.ingest} rx={2} />
                  <rect x={x} y={yStorage} width={barWidth} height={hStorage} fill={colors.storage} rx={2} />
                  <rect x={x} y={yScan} width={barWidth} height={hScan} fill={colors.scan} rx={2} />
                  <text
                    x={x + barWidth / 2}
                    y={padding.top + chartHeight + 18}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#8c8c8c"
                  >
                    {row.month}
                  </text>
                </g>
              )
            })}
            <text
              x={padding.left + chartWidth / 2}
              y={height - 4}
              textAnchor="middle"
              fontSize={11}
              fill="#595959"
            >
              {t.monthColumn}
            </text>
          </svg>
          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col>
              <Text type="secondary">
                <span style={{ display: 'inline-block', width: 12, height: 12, background: colors.ingest, borderRadius: 2, marginRight: 6 }} />
                {t.ingestColumn}
              </Text>
            </Col>
            <Col>
              <Text type="secondary">
                <span style={{ display: 'inline-block', width: 12, height: 12, background: colors.storage, borderRadius: 2, marginRight: 6 }} />
                {t.storageColumn}
              </Text>
            </Col>
            <Col>
              <Text type="secondary">
                <span style={{ display: 'inline-block', width: 12, height: 12, background: colors.scan, borderRadius: 2, marginRight: 6 }} />
                {t.scanColumn}
              </Text>
            </Col>
          </Row>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.tableTitle}>
        <Table
          dataSource={projection}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="month"
        />
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.notes}
        description={t.notesText}
        style={{ marginTop: 16 }}
      />

      <Card style={{ marginTop: 16 }}>
        <Space wrap>
          <Button icon={<CopyOutlined />} onClick={copyReport}>
            {copied ? t.copied : t.copyReport}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={downloadReport}>
            {t.downloadReport}
          </Button>
        </Space>
      </Card>

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
