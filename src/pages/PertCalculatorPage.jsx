import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Input,
  Space,
  Segmented,
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
  CalculatorOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  FileMarkdownOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateTask,
  calculateSummary,
  confidenceInterval,
  probabilityOfCompletion,
  convertTime,
  formatNumber,
  makeTask,
  PRESETS,
  CONFIDENCE_LEVELS,
  TIME_UNITS,
  exportMarkdown,
} from '../utils/pertCalculator'
import useCopyToClipboard from '../hooks/useCopyToClipboard'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  calculateTask,
  calculateSummary,
  confidenceInterval,
  probabilityOfCompletion,
} from '../utils/pertCalculator'

// Estimativa de 3 pontos para uma única tarefa
const task = calculateTask(8, 16, 32)
// { pert: 17.33, stdDev: 4, variance: 16, valid: true }

// Resumo de várias tarefas
const summary = calculateSummary([
  { optimistic: 4, mostLikely: 8, pessimistic: 16 },
  { optimistic: 16, mostLikely: 24, pessimistic: 40 },
])
// { totalPert: 42.67, totalStdDev: 4.71, totalVariance: 22.22, ... }

// Intervalo de confiança de 95% (Z = 1.96)
const ci = confidenceInterval(summary.totalPert, summary.totalStdDev, 1.96)

// Probabilidade de terminar em até X unidades de tempo
const p = probabilityOfCompletion(summary.totalPert, summary.totalStdDev, 50)
// número entre 0 e 1
`

const translations = {
  pt: {
    title: 'Calculadora PERT',
    subtitle: 'Estimativa de 3 Pontos',
    intro: 'Calcule estimativas de projeto com o método PERT (Program Evaluation and Review Technique). Cada tarefa recebe três cenários — otimista (O), mais provável (M) e pessimista (P) — e a ferramenta deriva a estimativa ponderada, o desvio padrão, a variância e os intervalos de confiança para o conjunto.',
    unitLabel: 'Unidade de tempo',
    hours: 'Horas',
    days: 'Dias',
    weeks: 'Semanas',
    tasks: 'Tarefas',
    taskName: 'Tarefa',
    optimistic: 'Otimista (O)',
    mostLikely: 'Mais provável (M)',
    pessimistic: 'Pessimista (P)',
    pert: 'PERT',
    stdDev: 'Desvio padrão',
    variance: 'Variância',
    addTask: 'Adicionar tarefa',
    removeTask: 'Remover',
    presets: 'Presets de um clique',
    presetWeb: 'Projeto web simples',
    presetSprint: 'Sprint de 2 semanas',
    presetMobile: 'Release mobile',
    clearAll: 'Limpar tudo',
    summary: 'Resumo',
    totalPert: 'PERT total',
    totalStdDev: 'Desvio padrão total',
    totalVariance: 'Variância total',
    confidenceLevel: 'Nível de confiança',
    confidenceInterval: 'Intervalo de confiança',
    target: 'Prazo-alvo',
    probability: 'Probabilidade de conclusão até o prazo',
    copyMarkdown: 'Copiar Markdown',
    copied: 'Copiado!',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhuma estimativa sai do navegador.',
    formulaTitle: 'Fórmulas usadas',
    formulaText: 'PERT = (O + 4M + P) / 6 · σ = (P − O) / 6 · Variância = σ² · IC = PERT ± Z × σ',
    emptyHint: 'Adicione pelo menos uma tarefa com valores O, M e P válidos.',
    taskCol: 'Tarefa',
    optimisticCol: 'O',
    mostLikelyCol: 'M',
    pessimisticCol: 'P',
    pertCol: 'PERT',
    stdDevCol: 'σ',
    varianceCol: 'Var',
    chartTitle: 'PERT por tarefa',
  },
  en: {
    title: 'PERT Calculator',
    subtitle: 'Three-Point Estimation',
    intro: 'Calculate project estimates using PERT (Program Evaluation and Review Technique). Each task gets three scenarios — optimistic (O), most likely (M) and pessimistic (P) — and the tool derives the weighted estimate, standard deviation, variance and confidence intervals for the whole set.',
    unitLabel: 'Time unit',
    hours: 'Hours',
    days: 'Days',
    weeks: 'Weeks',
    tasks: 'Tasks',
    taskName: 'Task',
    optimistic: 'Optimistic (O)',
    mostLikely: 'Most likely (M)',
    pessimistic: 'Pessimistic (P)',
    pert: 'PERT',
    stdDev: 'Std dev',
    variance: 'Variance',
    addTask: 'Add task',
    removeTask: 'Remove',
    presets: 'One-click presets',
    presetWeb: 'Simple web project',
    presetSprint: 'Two-week sprint',
    presetMobile: 'Mobile release',
    clearAll: 'Clear all',
    summary: 'Summary',
    totalPert: 'Total PERT',
    totalStdDev: 'Total std dev',
    totalVariance: 'Total variance',
    confidenceLevel: 'Confidence level',
    confidenceInterval: 'Confidence interval',
    target: 'Target deadline',
    probability: 'Probability of completion by target',
    copyMarkdown: 'Copy Markdown',
    copied: 'Copied!',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no estimate leaves the browser.',
    formulaTitle: 'Formulas used',
    formulaText: 'PERT = (O + 4M + P) / 6 · σ = (P − O) / 6 · Variance = σ² · CI = PERT ± Z × σ',
    emptyHint: 'Add at least one task with valid O, M and P values.',
    taskCol: 'Task',
    optimisticCol: 'O',
    mostLikelyCol: 'M',
    pessimisticCol: 'P',
    pertCol: 'PERT',
    stdDevCol: 'σ',
    varianceCol: 'Var',
    chartTitle: 'PERT by task',
  },
}

export default function PertCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [unit, setUnit] = useState('hours')
  const [tasks, setTasks] = useState(() => [makeTask(t.taskName)])
  const [confidenceKey, setConfidenceKey] = useState('95')
  const [target, setTarget] = useState('')
  const [copied, copy] = useCopyToClipboard()

  const summary = useMemo(() => calculateSummary(tasks), [tasks])
  const confidence = useMemo(() => {
    const level = CONFIDENCE_LEVELS.find((c) => c.key === confidenceKey) || CONFIDENCE_LEVELS[2]
    const ci =
      summary.totalPert !== null
        ? confidenceInterval(summary.totalPert, summary.totalStdDev, level.z)
        : { lower: null, upper: null }
    return { ...level, ...ci }
  }, [summary, confidenceKey])

  const targetProbability = useMemo(() => {
    const targetValue = target === '' ? null : Number(target)
    if (summary.totalPert === null || targetValue === null || Number.isNaN(targetValue)) {
      return null
    }
    return probabilityOfCompletion(summary.totalPert, summary.totalStdDev, targetValue)
  }, [summary, target])

  const unitLabel = useMemo(
    () => TIME_UNITS.find((u) => u.key === unit)?.[lang === 'pt' ? 'labelPt' : 'labelEn'] || '',
    [unit, lang]
  )

  const handleTaskChange = useCallback((id, field, value) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, [field]: value } : task)))
  }, [])

  const handleAddTask = useCallback(() => {
    setTasks((prev) => [...prev, makeTask(`${t.taskName} ${prev.length + 1}`)])
  }, [t.taskName])

  const handleRemoveTask = useCallback((id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  const handlePreset = useCallback(
    (preset) => {
      setTasks(
        preset.tasks.map((task) =>
          makeTask(task.name, task.optimistic, task.mostLikely, task.pessimistic)
        )
      )
    },
    []
  )

  const handleClear = useCallback(() => {
    setTasks([makeTask(t.taskName)])
  }, [t.taskName])

  const handleCopyMarkdown = useCallback(() => {
    copy(exportMarkdown(tasks, summary, unitLabel, confidence, t))
  }, [copy, tasks, summary, unitLabel, confidence, t])

  const unitOptions = useMemo(
    () => [
      { label: t.hours, value: 'hours' },
      { label: t.days, value: 'days' },
      { label: t.weeks, value: 'weeks' },
    ],
    [t]
  )

  const confidenceOptions = useMemo(
    () => CONFIDENCE_LEVELS.map((c) => ({ label: c.label, value: c.key })),
    []
  )

  const tableColumns = useMemo(
    () => [
      {
        title: t.taskName,
        dataIndex: 'name',
        key: 'name',
        render: (_, record) => (
          <Input
            value={record.name}
            onChange={(e) => handleTaskChange(record.id, 'name', e.target.value)}
            placeholder={t.taskName}
          />
        ),
      },
      {
        title: t.optimistic,
        dataIndex: 'optimistic',
        key: 'optimistic',
        width: 130,
        render: (_, record) => (
          <InputNumber
            min={0}
            step={0.5}
            value={record.optimistic}
            onChange={(value) => handleTaskChange(record.id, 'optimistic', value)}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: t.mostLikely,
        dataIndex: 'mostLikely',
        key: 'mostLikely',
        width: 130,
        render: (_, record) => (
          <InputNumber
            min={0}
            step={0.5}
            value={record.mostLikely}
            onChange={(value) => handleTaskChange(record.id, 'mostLikely', value)}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: t.pessimistic,
        dataIndex: 'pessimistic',
        key: 'pessimistic',
        width: 130,
        render: (_, record) => (
          <InputNumber
            min={0}
            step={0.5}
            value={record.pessimistic}
            onChange={(value) => handleTaskChange(record.id, 'pessimistic', value)}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: t.pert,
        key: 'pert',
        width: 110,
        render: (_, record, index) => {
          const result = summary.taskResults[index]
          return (
            <Text strong={result?.valid}>
              {result?.valid ? formatNumber(result.pert) : '—'}
            </Text>
          )
        },
      },
      {
        title: t.stdDev,
        key: 'stdDev',
        width: 110,
        render: (_, record, index) => {
          const result = summary.taskResults[index]
          return result?.valid ? formatNumber(result.stdDev) : '—'
        },
      },
      {
        title: '',
        key: 'actions',
        width: 60,
        render: (_, record) => (
          <Tooltip title={t.removeTask}>
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              onClick={() => handleRemoveTask(record.id)}
              disabled={tasks.length <= 1}
            />
          </Tooltip>
        ),
      },
    ],
    [t, summary, tasks.length, handleTaskChange, handleRemoveTask]
  )

  const chartData = useMemo(() => {
    if (summary.validCount === 0) return []
    const maxValue = Math.max(
      ...summary.taskResults.filter((r) => r.valid).map((r) => r.pert),
      summary.totalPert || 0
    )
    return tasks
      .map((task, i) => {
        const r = summary.taskResults[i]
        if (!r?.valid) return null
        return {
          name: task.name || `${t.taskName} ${i + 1}`,
          value: r.pert,
          maxValue,
        }
      })
      .filter(Boolean)
  }, [tasks, summary, t.taskName])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CalculatorOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.formulaTitle}
        description={t.formulaText}
      />

      <Card title={t.unitLabel} size="small">
        <Segmented options={unitOptions} value={unit} onChange={setUnit} />
      </Card>

      <Card
        title={t.tasks}
        size="small"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={handleAddTask}>
              {t.addTask}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              {t.clearAll}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={tasks}
          columns={tableColumns}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
        />
        <Space style={{ marginTop: 16 }} wrap>
          <Text type="secondary">{t.presets}:</Text>
          {PRESETS[lang].map((preset) => (
            <Button key={preset.name} size="small" onClick={() => handlePreset(preset)}>
              {preset.name}
            </Button>
          ))}
        </Space>
      </Card>

      {summary.validCount > 0 ? (
        <>
          <Card title={t.summary} size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t.totalPert}
                  value={summary.totalPert}
                  precision={2}
                  suffix={unitLabel}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t.totalStdDev}
                  value={summary.totalStdDev}
                  precision={2}
                  suffix={unitLabel}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t.totalVariance}
                  value={summary.totalVariance}
                  precision={2}
                  suffix={`${unitLabel}²`}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} md={12}>
                <Card size="small" title={t.confidenceLevel}>
                  <Segmented
                    options={confidenceOptions}
                    value={confidenceKey}
                    onChange={setConfidenceKey}
                    block
                  />
                  <div style={{ marginTop: 16 }}>
                    <Text strong>{t.confidenceInterval}: </Text>
                    <Tag color="blue">
                      {formatNumber(confidence.lower)} — {formatNumber(confidence.upper)}{' '}
                      {unitLabel}
                    </Tag>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title={t.probability}>
                  <Row gutter={16} align="middle">
                    <Col flex="auto">
                      <InputNumber
                        min={0}
                        step={0.5}
                        value={target}
                        onChange={setTarget}
                        style={{ width: '100%' }}
                        addonAfter={unitLabel}
                        placeholder={t.target}
                      />
                    </Col>
                    <Col>
                      {targetProbability !== null ? (
                        <Tag color={targetProbability >= 0.8 ? 'green' : targetProbability >= 0.5 ? 'orange' : 'red'}>
                          {(targetProbability * 100).toFixed(1)}%
                        </Tag>
                      ) : (
                        <Text type="secondary">—</Text>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Card>

          {chartData.length > 0 && (
            <Card title={t.chartTitle} size="small">
              <svg
                width="100%"
                height={chartData.length * 40 + 40}
                style={{ display: 'block' }}
              >
                {chartData.map((item, i) => {
                  const y = i * 40 + 20
                  const barWidth = item.maxValue > 0 ? (item.value / item.maxValue) * 80 + '%' : '0%'
                  return (
                    <g key={i}>
                      <text
                        x="0"
                        y={y + 14}
                        style={{ fontSize: 12, fill: 'currentColor' }}
                        dominantBaseline="middle"
                      >
                        {item.name.length > 28 ? `${item.name.slice(0, 28)}…` : item.name}
                      </text>
                      <rect
                        x="32%"
                        y={y}
                        width={barWidth}
                        height={20}
                        rx={4}
                        fill="#1677ff"
                        opacity={0.85}
                      />
                      <text
                        x={`calc(32% + ${barWidth} + 8px)`}
                        y={y + 14}
                        style={{ fontSize: 12, fill: 'currentColor' }}
                        dominantBaseline="middle"
                      >
                        {formatNumber(item.value)}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </Card>
          )}

          <Button icon={<FileMarkdownOutlined />} onClick={handleCopyMarkdown}>
            {copied ? t.copied : t.copyMarkdown}
          </Button>
        </>
      ) : (
        <Alert type="warning" showIcon message={t.emptyHint} />
      )}

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
