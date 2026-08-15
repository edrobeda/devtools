import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Select,
  Input,
  InputNumber,
  Space,
  Button,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Collapse,
  Alert,
} from 'antd'
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  CopyOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  PercentageOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  ALGORITHM_LABELS,
  ALGORITHM_DESCRIPTIONS,
  PRESETS,
  simulate,
  sourceCode,
} from '../utils/cpuSchedulingSimulator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Escalonamento de CPU',
    intro:
      'Compare algoritmos classicos de escalonamento de CPU 100% no navegador. Edite os processos, escolha o algoritmo e visualize o diagrama de Gantt, os tempos de espera/turnaround/retorno e outras metricas de desempenho.',
    algorithmLabel: 'Algoritmo',
    quantumLabel: 'Quantum (Round Robin)',
    processesTitle: 'Processos',
    processName: 'PID',
    arrivalLabel: 'Chegada',
    burstLabel: 'Burst',
    priorityLabel: 'Prioridade',
    addProcess: 'Adicionar processo',
    removeProcess: 'Remover',
    presetsTitle: 'Cenarios rapidos',
    simulate: 'Simular',
    resultsTitle: 'Resultados',
    ganttTitle: 'Diagrama de Gantt',
    statsTitle: 'Estatisticas',
    avgTurnaround: 'Turnaround medio',
    avgWaiting: 'Espera media',
    avgResponse: 'Resposta media',
    cpuUtilization: 'Uso da CPU',
    throughput: 'Throughput',
    throughputSuffix: 'proc./unid.',
    totalTime: 'Tempo total',
    pidCol: 'PID',
    arrivalCol: 'Chegada',
    burstCol: 'Burst',
    priorityCol: 'Prioridade',
    completionCol: 'Conclusao',
    turnaroundCol: 'Turnaround',
    waitingCol: 'Espera',
    responseCol: 'Resposta',
    noProcesses: 'Adicione pelo menos um processo com burst maior que zero.',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    algorithmInfo: 'Como funciona',
    idle: 'Ocioso',
  },
  en: {
    title: 'CPU Scheduling Simulator',
    intro:
      'Compare classic CPU scheduling algorithms 100% in the browser. Edit processes, pick an algorithm and visualize the Gantt chart, waiting/turnaround/response times and other performance metrics.',
    algorithmLabel: 'Algorithm',
    quantumLabel: 'Quantum (Round Robin)',
    processesTitle: 'Processes',
    processName: 'PID',
    arrivalLabel: 'Arrival',
    burstLabel: 'Burst',
    priorityLabel: 'Priority',
    addProcess: 'Add process',
    removeProcess: 'Remove',
    presetsTitle: 'Quick scenarios',
    simulate: 'Simulate',
    resultsTitle: 'Results',
    ganttTitle: 'Gantt Chart',
    statsTitle: 'Statistics',
    avgTurnaround: 'Avg. turnaround',
    avgWaiting: 'Avg. waiting',
    avgResponse: 'Avg. response',
    cpuUtilization: 'CPU utilization',
    throughput: 'Throughput',
    throughputSuffix: 'proc./unit',
    totalTime: 'Total time',
    pidCol: 'PID',
    arrivalCol: 'Arrival',
    burstCol: 'Burst',
    priorityCol: 'Priority',
    completionCol: 'Completion',
    turnaroundCol: 'Turnaround',
    waitingCol: 'Waiting',
    responseCol: 'Response',
    noProcesses: 'Add at least one process with a burst greater than zero.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    algorithmInfo: 'How it works',
    idle: 'Idle',
  },
}

const PALETTE = [
  '#1677ff',
  '#52c41a',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16',
  '#2f4554',
  '#1890ff',
]

function generatePid(index) {
  return `P${index + 1}`
}

export default function CpuSchedulingSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const algoLabels = ALGORITHM_LABELS[lang]
  const algoDescriptions = ALGORITHM_DESCRIPTIONS[lang]
  const presets = PRESETS[lang]

  const [algorithm, setAlgorithm] = useState(ALGORITHMS.FCFS)
  const [quantum, setQuantum] = useState(2)
  const [processes, setProcesses] = useState([
    { pid: 'P1', arrival: 0, burst: 8, priority: 3 },
    { pid: 'P2', arrival: 1, burst: 4, priority: 1 },
    { pid: 'P3', arrival: 2, burst: 2, priority: 2 },
  ])
  const [copiedKey, setCopiedKey] = useState(null)
  const [tick, setTick] = useState(0)

  const validProcesses = useMemo(
    () => processes.filter((p) => p.burst > 0),
    [processes]
  )

  const result = useMemo(
    () =>
      simulate({
        processes: validProcesses,
        algorithm,
        quantum,
      }),
    [validProcesses, algorithm, quantum, tick]
  )

  const updateProcess = (index, field, value) => {
    setProcesses((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const addProcess = () => {
    setProcesses((prev) => [
      ...prev,
      {
        pid: generatePid(prev.length),
        arrival: 0,
        burst: 1,
        priority: prev.length + 1,
      },
    ])
  }

  const removeProcess = (index) => {
    setProcesses((prev) => prev.filter((_, i) => i !== index))
  }

  const applyPreset = (preset) => {
    setAlgorithm(preset.algorithm)
    setQuantum(preset.quantum)
    setProcesses(preset.processes.map((p) => ({ ...p })))
  }

  const handleSimulate = () => {
    setTick((x) => x + 1)
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const processColors = useMemo(() => {
    const map = {}
    validProcesses.forEach((p, idx) => {
      map[p.pid] = PALETTE[idx % PALETTE.length]
    })
    return map
  }, [validProcesses])

  const columns = [
    { title: t.pidCol, dataIndex: 'pid', key: 'pid' },
    { title: t.arrivalCol, dataIndex: 'arrival', key: 'arrival' },
    { title: t.burstCol, dataIndex: 'burst', key: 'burst' },
    {
      title: t.priorityCol,
      dataIndex: 'priority',
      key: 'priority',
      render: (v) =>
        algorithm === ALGORITHMS.FCFS || algorithm === ALGORITHMS.ROUND_ROBIN ? (
          <Text type="secondary">—</Text>
        ) : (
          v
        ),
    },
    { title: t.completionCol, dataIndex: 'completionTime', key: 'completionTime' },
    {
      title: t.turnaroundCol,
      dataIndex: 'turnaroundTime',
      key: 'turnaroundTime',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: t.waitingCol,
      dataIndex: 'waitingTime',
      key: 'waitingTime',
      render: (v) => <Tag color={v <= 0 ? 'success' : 'warning'}>{v}</Tag>,
    },
    {
      title: t.responseCol,
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (v) => <Tag color="cyan">{v}</Tag>,
    },
  ]

  const totalTime = Math.max(1, result.totalTime)
  const chartHeight = 120
  const padding = { left: 40, right: 16, top: 24, bottom: 32 }
  const chartWidth = 640
  const usableWidth = chartWidth - padding.left - padding.right
  const scale = totalTime > 0 ? usableWidth / totalTime : 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ClockCircleOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.processesTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {processes.map((p, idx) => (
            <Row key={idx} gutter={[12, 12]} align="middle">
              <Col xs={24} sm={6}>
                <Input
                  value={p.pid}
                  onChange={(e) => updateProcess(idx, 'pid', e.target.value)}
                  placeholder={t.processName}
                />
              </Col>
              <Col xs={8} sm={6}>
                <InputNumber
                  min={0}
                  value={p.arrival}
                  onChange={(v) => updateProcess(idx, 'arrival', v ?? 0)}
                  style={{ width: '100%' }}
                  addonBefore={t.arrivalLabel}
                />
              </Col>
              <Col xs={8} sm={6}>
                <InputNumber
                  min={1}
                  value={p.burst}
                  onChange={(v) => updateProcess(idx, 'burst', v ?? 1)}
                  style={{ width: '100%' }}
                  addonBefore={t.burstLabel}
                />
              </Col>
              <Col xs={8} sm={3}>
                <InputNumber
                  min={0}
                  value={p.priority}
                  onChange={(v) => updateProcess(idx, 'priority', v ?? 0)}
                  style={{ width: '100%' }}
                  addonBefore={t.priorityLabel}
                />
              </Col>
              <Col xs={24} sm={3}>
                <Button
                  danger
                  size="small"
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeProcess(idx)}
                  disabled={processes.length <= 1}
                >
                  {t.removeProcess}
                </Button>
              </Col>
            </Row>
          ))}
          <Button icon={<PlusOutlined />} onClick={addProcess}>
            {t.addProcess}
          </Button>
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={algorithm === ALGORITHMS.ROUND_ROBIN ? 12 : 24}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.algorithmLabel}</Text>
                <Select value={algorithm} onChange={setAlgorithm} style={{ width: '100%' }}>
                  {Object.values(ALGORITHMS).map((key) => (
                    <Option key={key} value={key}>
                      {algoLabels[key]}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            {algorithm === ALGORITHMS.ROUND_ROBIN && (
              <Col xs={24} sm={12}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>{t.quantumLabel}</Text>
                  <InputNumber
                    min={1}
                    max={20}
                    value={quantum}
                    onChange={(v) => setQuantum(v ?? 1)}
                    style={{ width: '100%' }}
                  />
                </Space>
              </Col>
            )}
          </Row>

          <div>
            <Text strong>{t.presetsTitle}: </Text>
            <Space size={[8, 8]} wrap>
              {presets.map((p) => (
                <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
                  {p.label}
                </Button>
              ))}
            </Space>
          </div>

          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleSimulate}>
            {t.simulate}
          </Button>

          <Alert type="info" showIcon message={t.algorithmInfo} description={algoDescriptions[algorithm]} />

          {validProcesses.length === 0 ? (
            <Alert type="warning" showIcon message={t.noProcesses} />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small">
                    <Statistic
                      title={t.avgTurnaround}
                      value={result.averages.turnaround.toFixed(2)}
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small">
                    <Statistic
                      title={t.avgWaiting}
                      value={result.averages.waiting.toFixed(2)}
                      prefix={<CalculatorOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small">
                    <Statistic
                      title={t.avgResponse}
                      value={result.averages.response.toFixed(2)}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small">
                    <Statistic
                      title={t.cpuUtilization}
                      value={result.cpuUtilization.toFixed(1)}
                      suffix="%"
                      prefix={<PercentageOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small">
                    <Statistic
                      title={t.throughput}
                      value={result.throughput.toFixed(2)}
                      suffix={t.throughputSuffix}
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                  <Card size="small">
                    <Statistic
                      title={t.totalTime}
                      value={result.totalTime}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Card size="small" title={t.ganttTitle}>
                <div style={{ overflowX: 'auto' }}>
                  <svg
                    width={chartWidth}
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    role="img"
                    aria-label={t.ganttTitle}
                  >
                    {result.timeline.map((seg, idx) => {
                      const x = padding.left + seg.start * scale
                      const width = Math.max(1, (seg.end - seg.start) * scale)
                      const isIdle = seg.pid === '__IDLE__'
                      const color = isIdle ? '#d9d9d9' : processColors[seg.pid] || '#1677ff'
                      return (
                        <g key={idx}>
                          <rect
                            x={x}
                            y={padding.top}
                            width={width}
                            height={chartHeight - padding.top - padding.bottom}
                            fill={color}
                            opacity={isIdle ? 0.5 : 1}
                            rx={4}
                            stroke="#fff"
                            strokeWidth={1}
                          />
                          {!isIdle && width > 24 && (
                            <text
                              x={x + width / 2}
                              y={padding.top + (chartHeight - padding.top - padding.bottom) / 2 + 4}
                              textAnchor="middle"
                              fontSize={12}
                              fill="#fff"
                            >
                              {seg.pid}
                            </text>
                          )}
                          <text
                            x={x}
                            y={chartHeight - 8}
                            textAnchor="middle"
                            fontSize={10}
                            fill="currentColor"
                          >
                            {seg.start}
                          </text>
                        </g>
                      )
                    })}
                    <text
                      x={padding.left + totalTime * scale}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      fontSize={10}
                      fill="currentColor"
                    >
                      {totalTime}
                    </text>
                  </svg>
                </div>
              </Card>

              <Card size="small" title={t.statsTitle}>
                <Table
                  dataSource={result.processStats}
                  columns={columns}
                  rowKey="pid"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </>
          )}
        </Space>
      </Card>

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <div style={{ position: 'relative' }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => copy(sourceCode(), 'source')}
            >
              {copiedKey === 'source' ? t.copied : t.copy}
            </Button>
            <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
              <code>{sourceCode()}</code>
            </pre>
          </div>
        </Panel>
      </Collapse>
    </Space>
  )
}
