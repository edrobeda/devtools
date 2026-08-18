import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Input,
  InputNumber,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Button,
  Segmented,
  Table,
  Tooltip,
  message,
} from 'antd'
import {
  CalculatorOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateBudget,
  exportMarkdown,
  createStep,
  getPresets,
  formatNumber,
  PERCENTILE_OPTIONS,
} from '../utils/latencyBudgetCalculator'
import useCopyToClipboard from '../hooks/useCopyToClipboard'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  calculateBudget,
  exportMarkdown,
  createStep,
  getPresets,
} from '../utils/latencyBudgetCalculator'

const steps = [
  createStep('DNS', 15, 5),
  createStep('TCP + TLS', 60, 20),
  createStep('Server', 80, 30),
  createStep('Database', 25, 10),
]

const result = calculateBudget(steps, 'p95')
// { valid: true, totalMean: 180, totalStdDev: 35.51,
//   percentileLatency: 238.4, targetPercentile: 'p95', z: 1.6449, ... }

const markdown = exportMarkdown(result, 'pt')
`

const translations = {
  pt: {
    title: 'Orçamento de Latência End-to-End',
    subtitle: 'Some as latências de cada etapa e estime percentis',
    intro: 'Monte o orçamento de latência de uma requisição ou fluxo: adicione etapas com média e desvio padrão (ms). A ferramenta calcula a latência total e o percentil-alvo assumindo uma aproximação normal — útil para dimensionar SLAs, identificar gargalos e justificar otimizações.',
    targetLabel: 'Percentil-alvo',
    stepsTitle: 'Etapas da requisição',
    addStep: 'Adicionar etapa',
    stepName: 'Etapa',
    meanLabel: 'Média (ms)',
    stdLabel: 'σ (ms)',
    contributionLabel: 'Contribuição',
    actionLabel: 'Ação',
    resultsTitle: 'Resultados',
    totalMean: 'Latência média total',
    totalStd: 'Desvio padrão total',
    percentile: 'Latência no percentil',
    biggestContributor: 'Maior contribuinte',
    presets: 'Cenários rápidos',
    copyMarkdown: 'Copiar relatório',
    copied: 'Copiado!',
    emptyAlert: 'Adicione pelo menos uma etapa para calcular o orçamento.',
    invalidAlert: 'Todas as etapas precisam de valores numéricos não negativos.',
    normalNote: 'Os percentis usam aproximação normal: P = μ_total + Z × σ_total. Para distribuições muito assimétricas, considere simulação ou histogramas reais.',
    chartTitle: 'Breakdown visual',
    chartCaption: 'Cada barra representa a média de uma etapa; a linha tracejada indica a latência no percentil-alvo.',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
  },
  en: {
    title: 'End-to-End Latency Budget',
    subtitle: 'Add up latency per step and estimate percentiles',
    intro: 'Build a latency budget for a request or flow: add steps with mean and standard deviation (ms). The tool calculates the total latency and target percentile using a normal approximation — useful for sizing SLAs, spotting bottlenecks and justifying optimizations.',
    targetLabel: 'Target percentile',
    stepsTitle: 'Request steps',
    addStep: 'Add step',
    stepName: 'Step',
    meanLabel: 'Mean (ms)',
    stdLabel: 'σ (ms)',
    contributionLabel: 'Contribution',
    actionLabel: 'Action',
    resultsTitle: 'Results',
    totalMean: 'Total mean latency',
    totalStd: 'Total standard deviation',
    percentile: 'Latency at percentile',
    biggestContributor: 'Biggest contributor',
    presets: 'Quick scenarios',
    copyMarkdown: 'Copy report',
    copied: 'Copied!',
    emptyAlert: 'Add at least one step to calculate the budget.',
    invalidAlert: 'All steps need non-negative numeric values.',
    normalNote: 'Percentiles use the normal approximation: P = μ_total + Z × σ_total. For heavily skewed distributions, consider simulation or real histograms.',
    chartTitle: 'Visual breakdown',
    chartCaption: 'Each bar represents a step mean; the dashed line shows the target percentile latency.',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
  },
}

export default function LatencyBudgetCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const copy = useCopyToClipboard()

  const presets = useMemo(() => getPresets(lang), [lang])

  const [steps, setSteps] = useState(() =>
    presets[0].steps.map((s) => createStep(s.name, s.mean, s.stdDev))
  )
  const [targetPercentile, setTargetPercentile] = useState('p95')

  const result = useMemo(
    () => calculateBudget(steps, targetPercentile),
    [steps, targetPercentile]
  )

  const updateStep = useCallback((id, field, value) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }, [])

  const removeStep = useCallback((id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addStep = useCallback(() => {
    setSteps((prev) => [...prev, createStep()])
  }, [])

  const applyPreset = useCallback(
    (key) => {
      const preset = presets.find((p) => p.key === key)
      if (!preset) return
      setSteps(preset.steps.map((s) => createStep(s.name, s.mean, s.stdDev)))
    },
    [presets]
  )

  const handleCopy = useCallback(async () => {
    const md = exportMarkdown(result, lang)
    const ok = await copy(md)
    if (ok) message.success(t.copied)
  }, [copy, result, lang, t])

  const columns = [
    {
      title: t.stepName,
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Input
          value={record.name}
          onChange={(e) => updateStep(record.id, 'name', e.target.value)}
          placeholder={t.stepName}
        />
      ),
    },
    {
      title: t.meanLabel,
      dataIndex: 'mean',
      key: 'mean',
      width: 130,
      render: (_, record) => (
        <InputNumber
          min={0}
          step={1}
          value={record.mean}
          onChange={(v) => updateStep(record.id, 'mean', v === null ? '' : v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: t.stdLabel,
      dataIndex: 'stdDev',
      key: 'stdDev',
      width: 130,
      render: (_, record) => (
        <InputNumber
          min={0}
          step={1}
          value={record.stdDev}
          onChange={(v) => updateStep(record.id, 'stdDev', v === null ? '' : v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: t.contributionLabel,
      dataIndex: 'contributionPct',
      key: 'contributionPct',
      width: 110,
      render: (_, record) => {
        const contribution = result.valid
          ? result.breakdown.find((b) => b.id === record.id)?.contributionPct ?? 0
          : 0
        return <Text>{formatNumber(contribution)}%</Text>
      },
    },
    {
      title: t.actionLabel,
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => removeStep(record.id)}
        />
      ),
    },
  ]

  const maxScale = Math.max(
    result.valid ? result.percentileLatency : 0,
    result.valid ? result.totalMean : 0,
    1
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2}>
        <CalculatorOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={t.stepsTitle}
            extra={
              <Button icon={<PlusOutlined />} onClick={addStep}>
                {t.addStep}
              </Button>
            }
          >
            <Table
              dataSource={steps}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: t.emptyAlert }}
            />

            <div style={{ marginTop: 16 }}>
              <Text strong>{t.targetLabel}: </Text>
              <Segmented
                value={targetPercentile}
                onChange={(v) => setTargetPercentile(v)}
                options={PERCENTILE_OPTIONS.map((p) => ({
                  value: p,
                  label: p.toUpperCase(),
                }))}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={t.resultsTitle}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {!result.valid ? (
                <Alert
                  type={result.error === 'EMPTY' ? 'info' : 'warning'}
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message={result.error === 'EMPTY' ? t.emptyAlert : t.invalidAlert}
                />
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title={t.totalMean}
                        value={formatNumber(result.totalMean)}
                        suffix="ms"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={t.totalStd}
                        value={formatNumber(result.totalStdDev)}
                        suffix="ms"
                      />
                    </Col>
                    <Col span={24}>
                      <Statistic
                        title={`${t.percentile} (${result.targetPercentile.toUpperCase()})`}
                        value={formatNumber(result.percentileLatency)}
                        suffix="ms"
                        valueStyle={{ color: '#1677ff' }}
                      />
                    </Col>
                  </Row>

                  {result.biggestContributor && (
                    <div>
                      <Text strong>{t.biggestContributor}: </Text>
                      <Tag color="red">
                        {result.biggestContributor.name || '-'}
                        {' '}
                        ({formatNumber(result.biggestContributor.contributionPct)}%)
                      </Tag>
                    </div>
                  )}

                  <Button icon={<CopyOutlined />} onClick={handleCopy} block>
                    {t.copyMarkdown}
                  </Button>
                </>
              )}
            </Space>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Text strong>{t.presets}</Text>
              <Space wrap>
                {presets.map((preset) => (
                  <Button key={preset.key} size="small" onClick={() => applyPreset(preset.key)}>
                    {preset.label}
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {result.valid && (
        <Card style={{ marginTop: 16 }} title={t.chartTitle}>
          <svg
            viewBox="0 0 800 320"
            width="100%"
            height={320}
            style={{ display: 'block' }}
          >
            {/* Eixo horizontal */}
            <line
              x1={60}
              y1={280}
              x2={760}
              y2={280}
              stroke="#d9d9d9"
              strokeWidth={1}
            />

            {/* Marcas do eixo */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const x = 60 + ratio * 700
              const ms = (maxScale * ratio).toFixed(0)
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={280}
                    x2={x}
                    y2={285}
                    stroke="#d9d9d9"
                  />
                  <text
                    x={x}
                    y={302}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#8c8c8c"
                  >
                    {ms}ms
                  </text>
                </g>
              )
            })}

            {/* Barras das etapas */}
            {result.breakdown.map((step, idx) => {
              const barHeight = 28
              const gap = 12
              const y = 20 + idx * (barHeight + gap)
              const barWidth = (step.mean / maxScale) * 700
              const colors = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d']
              const color = colors[idx % colors.length]

              return (
                <g key={step.id}>
                  <text
                    x={50}
                    y={y + barHeight / 2 + 4}
                    textAnchor="end"
                    fontSize={12}
                    fill="#595959"
                  >
                    {step.name || '-'}
                  </text>
                  <rect
                    x={60}
                    y={y}
                    width={Math.max(barWidth, 2)}
                    height={barHeight}
                    fill={color}
                    opacity={0.85}
                    rx={4}
                  />
                  <text
                    x={60 + Math.max(barWidth, 2) + 6}
                    y={y + barHeight / 2 + 4}
                    fontSize={12}
                    fill="#595959"
                  >
                    {formatNumber(step.mean)}ms
                  </text>
                </g>
              )
            })}

            {/* Linha tracejada do percentil total */}
            {result.percentileLatency > 0 && (
              <g>
                <line
                  x1={60 + (result.percentileLatency / maxScale) * 700}
                  y1={10}
                  x2={60 + (result.percentileLatency / maxScale) * 700}
                  y2={270}
                  stroke="#1677ff"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
                <text
                  x={60 + (result.percentileLatency / maxScale) * 700 + 6}
                  y={24}
                  fontSize={12}
                  fill="#1677ff"
                  fontWeight="bold"
                >
                  {result.targetPercentile.toUpperCase()} = {formatNumber(result.percentileLatency)}ms
                </text>
              </g>
            )}
          </svg>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            {t.chartCaption}
          </Paragraph>
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.normalNote}
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
    </div>
  )
}
