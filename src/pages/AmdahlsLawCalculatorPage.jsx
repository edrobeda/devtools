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
  ThunderboltOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateAmdahl,
  getPresets,
  buildSpeedupTable,
  buildChartPoints,
  formatNumber,
} from '../utils/amdahlsLawCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import { calculateAmdahl } from '../utils/amdahlsLawCalculator'

// Carga de 120s, 80% paralelizável, 16 processadores
calculateAmdahl({
  totalTime: 120,
  parallelFraction: 80,
  processors: 16,
})
// {
//   totalTime: 120,
//   parallelFraction: 0.8,
//   serialFraction: 0.2,
//   processors: 16,
//   serialTime: 24,
//   parallelTime: 6,
//   newTime: 30,
//   speedup: 4.00,
//   maxSpeedup: 5.00,
//   efficiency: 0.25,
//   timeSaved: 90,
// }
`

const translations = {
  pt: {
    title: 'Calculadora da Lei de Amdahl',
    subtitle: 'Speedup teórico do paralelismo',
    intro: 'A Lei de Amdahl estima o ganho máximo de desempenho ao paralelizar uma fração de uma carga de trabalho. A parte serial (1 − P) vira o gargalo: por mais processadores que você adicione, o speedup nunca ultrapassa 1 / (1 − P).',
    totalTime: 'Tempo total da carga (s)',
    totalTimeHelp: 'Tempo que a tarefa leva em um único processador.',
    parallelFraction: 'Fração paralelizável (P)',
    parallelFractionHelp: 'Porcentagem da carga que pode ser dividida entre processadores.',
    processors: 'Número de processadores (N)',
    processorsHelp: 'Quantidade de cores, threads ou nós em paralelo.',
    presets: 'Exemplos de um clique',
    results: 'Resultados',
    speedup: 'Speedup',
    maxSpeedup: 'Speedup máximo',
    efficiency: 'Eficiência',
    newTime: 'Novo tempo',
    timeSaved: 'Tempo economizado',
    serialFraction: 'Fração serial',
    tableTitle: 'Speedup por número de processadores',
    processorsColumn: 'Processadores',
    newTimeColumn: 'Novo tempo (s)',
    speedupColumn: 'Speedup',
    efficiencyColumn: 'Eficiência',
    chartTitle: 'Speedup em função de N',
    formula: 'Fórmula',
    formulaText: 'S(N) = 1 / ((1 − P) + P / N). Quando N cresce, o termo P / N some e o speedup tende a 1 / (1 − P).',
    clear: 'Limpar',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
  },
  en: {
    title: "Amdahl's Law Calculator",
    subtitle: 'Theoretical parallel speedup',
    intro: "Amdahl's Law estimates the maximum performance gain when parallelizing a fraction of a workload. The serial part (1 − P) becomes the bottleneck: no matter how many processors you add, speedup can never exceed 1 / (1 − P).",
    totalTime: 'Total workload time (s)',
    totalTimeHelp: 'Time the task takes on a single processor.',
    parallelFraction: 'Parallel fraction (P)',
    parallelFractionHelp: 'Percentage of the workload that can be split across processors.',
    processors: 'Number of processors (N)',
    processorsHelp: 'Number of cores, threads or parallel nodes.',
    presets: 'One-click examples',
    results: 'Results',
    speedup: 'Speedup',
    maxSpeedup: 'Maximum speedup',
    efficiency: 'Efficiency',
    newTime: 'New time',
    timeSaved: 'Time saved',
    serialFraction: 'Serial fraction',
    tableTitle: 'Speedup by number of processors',
    processorsColumn: 'Processors',
    newTimeColumn: 'New time (s)',
    speedupColumn: 'Speedup',
    efficiencyColumn: 'Efficiency',
    chartTitle: 'Speedup as a function of N',
    formula: 'Formula',
    formulaText: 'S(N) = 1 / ((1 − P) + P / N). As N grows, the P / N term vanishes and speedup approaches 1 / (1 − P).',
    clear: 'Clear',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
  },
}

export default function AmdahlsLawCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [totalTime, setTotalTime] = useState(120)
  const [parallelFraction, setParallelFraction] = useState(80)
  const [processors, setProcessors] = useState(16)

  const presets = useMemo(() => getPresets(lang), [lang])

  const result = useMemo(
    () =>
      calculateAmdahl({
        totalTime: totalTime || 0,
        parallelFraction: parallelFraction || 0,
        processors: processors || 1,
      }),
    [totalTime, parallelFraction, processors]
  )

  const tableData = useMemo(
    () =>
      buildSpeedupTable({
        totalTime: totalTime || 0,
        parallelFraction: parallelFraction || 0,
        maxProcessors: Math.max(processors || 1, 128),
      }),
    [totalTime, parallelFraction, processors]
  )

  const chartPoints = useMemo(
    () =>
      buildChartPoints({
        totalTime: totalTime || 0,
        parallelFraction: parallelFraction || 0,
        maxProcessors: Math.max(processors || 1, 64),
        points: 60,
      }),
    [totalTime, parallelFraction, processors]
  )

  const handlePreset = (preset) => {
    setTotalTime(preset.totalTime)
    setParallelFraction(preset.parallelFraction)
    setProcessors(preset.processors)
  }

  const clearAll = () => {
    setTotalTime(120)
    setParallelFraction(80)
    setProcessors(16)
  }

  const columns = [
    {
      title: t.processorsColumn,
      dataIndex: 'processors',
      render: (value) => value,
    },
    {
      title: t.newTimeColumn,
      dataIndex: 'newTime',
      render: (value) => `${formatNumber(value, 2)}s`,
    },
    {
      title: t.speedupColumn,
      dataIndex: 'speedup',
      render: (value) => `${formatNumber(value, 2)}×`,
    },
    {
      title: t.efficiencyColumn,
      dataIndex: 'efficiency',
      render: (value) => `${formatNumber(value * 100, 0)}%`,
    },
  ]

  // Gráfico SVG simples: speedup vs processadores
  const width = 640
  const height = 220
  const padding = { top: 16, right: 24, bottom: 40, left: 48 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxProcessors = chartPoints[chartPoints.length - 1]?.processors || 1
  const maxSpeedup = Math.max(
    result.maxSpeedup === Infinity ? result.speedup * 1.2 : result.maxSpeedup,
    ...chartPoints.map((p) => p.speedup)
  )

  const xScale = (n) => padding.left + (Math.log2(n) / Math.log2(maxProcessors)) * chartWidth
  const yScale = (s) => padding.top + chartHeight - (s / maxSpeedup) * chartHeight

  const pathD = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.processors)} ${yScale(p.speedup)}`)
    .join(' ')

  const areaD = `${pathD} L ${xScale(maxProcessors)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <ThunderboltOutlined style={{ marginRight: 12 }} />
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
                <Text strong>{t.totalTime}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.totalTimeHelp}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  value={totalTime}
                  onChange={(v) => setTotalTime(v ?? 0)}
                  addonAfter="s"
                />
              </div>

              <div>
                <Text strong>{t.parallelFraction}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.parallelFractionHelp}
                </Text>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Slider
                      min={0}
                      max={99.99}
                      step={0.01}
                      value={parallelFraction}
                      onChange={(v) => setParallelFraction(v)}
                      tooltip={{ formatter: (v) => `${formatNumber(v, 2)}%` }}
                    />
                  </Col>
                  <Col style={{ width: 120 }}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={99.99}
                      step={0.01}
                      value={parallelFraction}
                      onChange={(v) => setParallelFraction(v ?? 0)}
                      formatter={(v) => `${v}%`}
                      parser={(v) => parseFloat((v || '').replace('%', ''))}
                    />
                  </Col>
                </Row>
              </div>

              <div>
                <Text strong>{t.processors}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t.processorsHelp}
                </Text>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Slider
                      min={1}
                      max={128}
                      step={1}
                      value={processors}
                      onChange={(v) => setProcessors(v)}
                    />
                  </Col>
                  <Col style={{ width: 120 }}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={10000}
                      step={1}
                      value={processors}
                      onChange={(v) => setProcessors(v ?? 1)}
                    />
                  </Col>
                </Row>
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
                    title={t.speedup}
                    value={`${formatNumber(result.speedup, 2)}×`}
                    valueStyle={{ color: '#1677ff' }}
                    prefix={<RiseOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.maxSpeedup}
                    value={result.maxSpeedup === Infinity ? '∞' : `${formatNumber(result.maxSpeedup, 2)}×`}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.efficiency}
                    value={`${formatNumber(result.efficiency * 100, 1)}%`}
                    valueStyle={{ color: result.efficiency > 0.5 ? '#52c41a' : '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.serialFraction}
                    value={`${formatNumber(result.serialFraction * 100, 2)}%`}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.newTime}
                    value={`${formatNumber(result.newTime, 2)}s`}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t.timeSaved}
                    value={`${formatNumber(result.timeSaved, 2)}s`}
                    valueStyle={{ color: '#52c41a' }}
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
                    {formatNumber(ratio * maxSpeedup, 1)}×
                  </text>
                </g>
              )
            })}
            {/* ticks eixo X */}
            {[1, 2, 4, 8, 16, 32, 64, 128]
              .filter((n) => n <= maxProcessors)
              .map((n) => (
                <text
                  key={n}
                  x={xScale(n)}
                  y={padding.top + chartHeight + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#8c8c8c"
                >
                  {n}
                </text>
              ))}
            <text
              x={padding.left + chartWidth / 2}
              y={height - 4}
              textAnchor="middle"
              fontSize={11}
              fill="#595959"
            >
              N (processadores)
            </text>
            {/* linha de speedup máximo teórico */}
            {result.maxSpeedup !== Infinity && (
              <>
                <line
                  x1={padding.left}
                  y1={yScale(result.maxSpeedup)}
                  x2={padding.left + chartWidth}
                  y2={yScale(result.maxSpeedup)}
                  stroke="#722ed1"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
                <text
                  x={padding.left + chartWidth - 4}
                  y={yScale(result.maxSpeedup) - 6}
                  textAnchor="end"
                  fontSize={10}
                  fill="#722ed1"
                >
                  max
                </text>
              </>
            )}
            {/* área sob a curva */}
            <path d={areaD} fill="rgba(22, 119, 255, 0.12)" />
            {/* curva de speedup */}
            <path d={pathD} fill="none" stroke="#1677ff" strokeWidth={2} />
            {/* ponto atual */}
            <circle
              cx={xScale(result.processors)}
              cy={yScale(result.speedup)}
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
          rowKey="processors"
          rowClassName={(record) =>
            record.processors === result.processors ? 'amdahl-highlight-row' : ''
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

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>

      <style>{`
        .amdahl-highlight-row {
          background: #e6f7ff !important;
        }
      `}</style>
    </div>
  )
}
