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
  Tag,
  Alert,
  Collapse,
  Button,
  Table,
  Tooltip,
} from 'antd'
import {
  DatabaseOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateCacheHitRatio,
  getPresets,
  buildTable,
  buildChartPoints,
  buildReport,
  formatNumber,
} from '../utils/cacheHitRatioCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateCacheHitRatio } from '../utils/cacheHitRatioCalculator'

// Cache com hit de 2 ms, miss de 80 ms e 95% de acerto
calculateCacheHitRatio({
  hitLatency: 2,
  missLatency: 80,
  hitRate: 95,
  targetLatency: 10,
})
// {
//   hitLatency: 2,
//   missLatency: 80,
//   hitRate: 0.95,
//   missRate: 5,
//   avgLatency: 5.9,
//   speedup: 13.56,
//   savings: 92.63,
//   targetLatency: 10,
//   minHitRate: 89.87,
//   isTargetMet: true,
// }
`

const translations = {
  pt: {
    title: 'Calculadora de Hit Ratio de Cache',
    subtitle: 'Latência efetiva e hit rate mínimo',
    intro: 'Estime a latência média real de uma camada de cache a partir da latência de hit, da latência de miss e da taxa de acerto. Use a latência-alvo para descobrir qual hit rate mínimo você precisa atingir.',
    hitLatency: 'Latência de hit',
    hitLatencyHelp: 'Tempo quando o dado já está no cache.',
    missLatency: 'Latência de miss',
    missLatencyHelp: 'Tempo quando o dado precisa ser buscado na origem.',
    hitRate: 'Hit rate',
    hitRateHelp: 'Porcentagem de requisições atendidas pelo cache.',
    targetLatency: 'Latência-alvo',
    targetLatencyHelp: 'Latência máxima aceitável para calcular o hit rate mínimo.',
    presets: 'Exemplos de um clique',
    results: 'Resultados',
    avgLatency: 'Latência média efetiva',
    speedup: 'Speedup vs sempre miss',
    savings: 'Economia',
    missRate: 'Miss rate',
    minHitRate: 'Hit rate mínimo para o alvo',
    targetMet: 'Alvo atingido',
    targetNotMet: 'Alvo não atingido',
    tableTitle: 'Latência por hit rate',
    hitRateColumn: 'Hit rate',
    avgLatencyColumn: 'Latência média (ms)',
    speedupColumn: 'Speedup',
    savingsColumn: 'Economia',
    chartTitle: 'Latência efetiva × hit rate',
    chartX: 'Hit rate (%)',
    chartY: 'Latência (ms)',
    formula: 'Fórmula',
    formulaText: 'L_eff = h × L_hit + (1 − h) × L_miss. Quanto maior o hit rate, mais a latência efetiva se aproxima da latência de hit.',
    clear: 'Limpar',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    copyReport: 'Copiar relatório',
    downloadReport: 'Baixar relatório',
    copied: 'Copiado!',
  },
  en: {
    title: 'Cache Hit Ratio Calculator',
    subtitle: 'Effective latency and minimum hit rate',
    intro: 'Estimate the real average latency of a cache layer from hit latency, miss latency and hit rate. Use the target latency to find the minimum hit rate you need to achieve.',
    hitLatency: 'Hit latency',
    hitLatencyHelp: 'Time when the data is already in cache.',
    missLatency: 'Miss latency',
    missLatencyHelp: 'Time when the data must be fetched from origin.',
    hitRate: 'Hit rate',
    hitRateHelp: 'Percentage of requests served by cache.',
    targetLatency: 'Target latency',
    targetLatencyHelp: 'Maximum acceptable latency to compute the minimum hit rate.',
    presets: 'One-click examples',
    results: 'Results',
    avgLatency: 'Effective average latency',
    speedup: 'Speedup vs always miss',
    savings: 'Savings',
    missRate: 'Miss rate',
    minHitRate: 'Minimum hit rate for target',
    targetMet: 'Target met',
    targetNotMet: 'Target not met',
    tableTitle: 'Latency by hit rate',
    hitRateColumn: 'Hit rate',
    avgLatencyColumn: 'Average latency (ms)',
    speedupColumn: 'Speedup',
    savingsColumn: 'Savings',
    chartTitle: 'Effective latency × hit rate',
    chartX: 'Hit rate (%)',
    chartY: 'Latency (ms)',
    formula: 'Formula',
    formulaText: 'L_eff = h × L_hit + (1 − h) × L_miss. The higher the hit rate, the closer the effective latency gets to the hit latency.',
    clear: 'Clear',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    copyReport: 'Copy report',
    downloadReport: 'Download report',
    copied: 'Copied!',
  },
}

export default function CacheHitRatioCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [hitLatency, setHitLatency] = useState(2)
  const [missLatency, setMissLatency] = useState(80)
  const [hitRate, setHitRate] = useState(95)
  const [targetLatency, setTargetLatency] = useState(10)
  const [copied, setCopied] = useState(false)

  const presets = useMemo(() => getPresets(lang), [lang])

  const result = useMemo(
    () =>
      calculateCacheHitRatio({
        hitLatency: hitLatency ?? 0,
        missLatency: missLatency ?? 0,
        hitRate: hitRate ?? 0,
        targetLatency: targetLatency ?? null,
      }),
    [hitLatency, missLatency, hitRate, targetLatency]
  )

  const tableData = useMemo(
    () =>
      buildTable({
        hitLatency: hitLatency ?? 0,
        missLatency: missLatency ?? 0,
      }),
    [hitLatency, missLatency]
  )

  const chartPoints = useMemo(
    () =>
      buildChartPoints({
        hitLatency: hitLatency ?? 0,
        missLatency: missLatency ?? 0,
        points: 60,
      }),
    [hitLatency, missLatency]
  )

  const handlePreset = (preset) => {
    setHitLatency(preset.hitLatency)
    setMissLatency(preset.missLatency)
    setHitRate(preset.hitRate)
    setTargetLatency(preset.targetLatency)
  }

  const clearAll = () => {
    setHitLatency(2)
    setMissLatency(80)
    setHitRate(95)
    setTargetLatency(10)
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
    a.download = 'cache-hit-ratio-report.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: t.hitRateColumn,
      dataIndex: 'hitRate',
      render: (value) => `${formatNumber(value, 0)}%`,
    },
    {
      title: t.avgLatencyColumn,
      dataIndex: 'avgLatency',
      render: (value) => `${formatNumber(value, 2)} ms`,
    },
    {
      title: t.speedupColumn,
      dataIndex: 'speedup',
      render: (value) => `${formatNumber(value, 2)}×`,
    },
    {
      title: t.savingsColumn,
      dataIndex: 'savings',
      render: (value) => `${formatNumber(value, 1)}%`,
    },
  ]

  // Gráfico SVG: hit rate (0-100%) no eixo X, latência no eixo Y
  const width = 640
  const height = 240
  const padding = { top: 16, right: 24, bottom: 48, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxLatency = Math.max(
    missLatency ?? 0,
    ...chartPoints.map((p) => p.avgLatency),
    targetLatency ?? 0
  ) * 1.1 || 1

  const xScale = (h) => padding.left + (h / 100) * chartWidth
  const yScale = (l) =>
    padding.top + chartHeight - (l / maxLatency) * chartHeight

  const pathD = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.hitRate)} ${yScale(p.avgLatency)}`)
    .join(' ')

  const areaD = `${pathD} L ${xScale(100)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  const targetY = targetLatency !== null ? yScale(targetLatency) : null

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <DatabaseOutlined style={{ marginRight: 12 }} />
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
                <Text strong>{t.hitLatency}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.hitLatencyHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.5}
                  value={hitLatency}
                  onChange={(v) => setHitLatency(v ?? 0)}
                  addonAfter="ms"
                />
              </div>

              <div>
                <Text strong>{t.missLatency}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.missLatencyHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  value={missLatency}
                  onChange={(v) => setMissLatency(v ?? 0)}
                  addonAfter="ms"
                />
              </div>

              <div>
                <Text strong>{t.hitRate}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.hitRateHelp}
                </Text>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Slider
                      min={0}
                      max={100}
                      step={0.1}
                      value={hitRate}
                      onChange={(v) => setHitRate(v)}
                      tooltip={{ formatter: (v) => `${formatNumber(v, 1)}%` }}
                    />
                  </Col>
                  <Col style={{ width: 120 }}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      step={0.1}
                      value={hitRate}
                      onChange={(v) => setHitRate(v ?? 0)}
                      formatter={(v) => `${v}%`}
                      parser={(v) => parseFloat((v || '').replace('%', ''))}
                    />
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong>{t.targetLatency}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.targetLatencyHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  value={targetLatency}
                  onChange={(v) => setTargetLatency(v ?? null)}
                  addonAfter="ms"
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
                    title={t.avgLatency}
                    value={`${formatNumber(result.avgLatency, 2)} ms`}
                    valueStyle={{ color: '#1677ff' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.speedup}
                    value={`${formatNumber(result.speedup, 2)}×`}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ThunderboltOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.savings}
                    value={`${formatNumber(result.savings, 1)}%`}
                    valueStyle={{ color: result.savings > 50 ? '#52c41a' : '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.missRate}
                    value={`${formatNumber(result.missRate, 1)}%`}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.minHitRate}
                    value={result.minHitRate === null ? '—' : `${formatNumber(result.minHitRate, 2)}%`}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={12}>
                  {result.isTargetMet === null ? (
                    <Statistic title={t.targetMet} value="—" />
                  ) : (
                    <Statistic
                      title={t.targetMet}
                      value={result.isTargetMet ? t.targetMet : t.targetNotMet}
                      valueStyle={{ color: result.isTargetMet ? '#52c41a' : '#ff4d4f' }}
                      prefix={result.isTargetMet ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    />
                  )}
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
            {/* eixo X */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#d9d9d9"
              strokeWidth={1}
            />
            {/* eixo Y */}
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
                    {formatNumber(ratio * maxLatency, 0)}
                  </text>
                </g>
              )
            })}
            {/* ticks eixo X */}
            {[0, 25, 50, 75, 100].map((h) => (
              <text
                key={h}
                x={xScale(h)}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                fontSize={10}
                fill="#8c8c8c"
              >
                {h}%
              </text>
            ))}
            <text
              x={padding.left + chartWidth / 2}
              y={height - 4}
              textAnchor="middle"
              fontSize={11}
              fill="#595959"
            >
              {t.chartX}
            </text>
            {/* linha de latência-alvo */}
            {targetY !== null && targetLatency >= 0 && (
              <>
                <line
                  x1={padding.left}
                  y1={targetY}
                  x2={padding.left + chartWidth}
                  y2={targetY}
                  stroke="#52c41a"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
                <text
                  x={padding.left + chartWidth - 4}
                  y={targetY - 6}
                  textAnchor="end"
                  fontSize={10}
                  fill="#52c41a"
                >
                  target
                </text>
              </>
            )}
            {/* área sob a curva */}
            <path d={areaD} fill="rgba(22, 119, 255, 0.12)" />
            {/* curva de latência */}
            <path d={pathD} fill="none" stroke="#1677ff" strokeWidth={2} />
            {/* ponto atual */}
            <circle
              cx={xScale(result.hitRate * 100)}
              cy={yScale(result.avgLatency)}
              r={5}
              fill="#1677ff"
              stroke="#fff"
              strokeWidth={2}
            />
          </svg>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title={t.tableTitle}>
        <Table
          dataSource={tableData}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="hitRate"
          rowClassName={(record) =>
            record.hitRate === Math.round((hitRate ?? 0) * 10) / 10 ? 'cache-hit-highlight-row' : ''
          }
        />
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.formula}
        description={t.formulaText}
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

      <style>{`
        .cache-hit-highlight-row {
          background: #e6f7ff !important;
        }
      `}</style>
    </div>
  )
}
