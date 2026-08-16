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
  HddOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  ArrowsAltOutlined,
  NumberOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  ALGORITHM_LABELS,
  ALGORITHM_DESCRIPTIONS,
  PRESETS,
  simulate,
  sourceCode,
} from '../utils/diskSchedulingSimulator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Escalonamento de Disco',
    intro:
      'Compare algoritmos classicos de escalonamento de braco de disco 100% no navegador: FCFS, SSTF, SCAN, C-SCAN, LOOK e C-LOOK. Edite a fila de cilindros, a posicao inicial e o tamanho do disco, escolha o algoritmo e visualize o percurso do braco, a ordem de atendimento e as metricas de seek.',
    requestsLabel: 'Fila de requisicoes (cilindros)',
    requestsPlaceholder: 'Ex.: 82, 170, 43, 140, 24, 16, 190',
    initialHeadLabel: 'Posicao inicial do braco',
    maxCylinderLabel: 'Cilindros no disco',
    algorithmLabel: 'Algoritmo',
    presetsTitle: 'Cenarios rapidos',
    simulate: 'Simular',
    resultsTitle: 'Resultados',
    chartTitle: 'Percurso do braco',
    statsTitle: 'Estatisticas',
    totalSeek: 'Seek total',
    averageSeek: 'Seek medio',
    maxSeek: 'Maior seek',
    servedTitle: 'Ordem de atendimento',
    orderCol: 'Ordem',
    cylinderCol: 'Cilindro',
    seekCol: 'Distancia',
    ignoredTitle: 'Requisicoes ignoradas',
    ignoredEmpty: 'Nenhuma requisicao fora do intervalo.',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    algorithmInfo: 'Como funciona',
    noRequests: 'Adicione pelo menos um cilindro valido dentro do intervalo do disco.',
    headLabel: 'inicio',
    endLabel: 'fim',
  },
  en: {
    title: 'Disk Scheduling Simulator',
    intro:
      'Compare classic disk-arm scheduling algorithms 100% in the browser: FCFS, SSTF, SCAN, C-SCAN, LOOK and C-LOOK. Edit the cylinder queue, initial head position and disk size, pick an algorithm and visualize the arm path, service order and seek metrics.',
    requestsLabel: 'Request queue (cylinders)',
    requestsPlaceholder: 'E.g.: 82, 170, 43, 140, 24, 16, 190',
    initialHeadLabel: 'Initial head position',
    maxCylinderLabel: 'Disk cylinders',
    algorithmLabel: 'Algorithm',
    presetsTitle: 'Quick scenarios',
    simulate: 'Simulate',
    resultsTitle: 'Results',
    chartTitle: 'Arm path',
    statsTitle: 'Statistics',
    totalSeek: 'Total seek',
    averageSeek: 'Average seek',
    maxSeek: 'Max seek',
    servedTitle: 'Service order',
    orderCol: 'Order',
    cylinderCol: 'Cylinder',
    seekCol: 'Distance',
    ignoredTitle: 'Ignored requests',
    ignoredEmpty: 'No requests outside the disk range.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    algorithmInfo: 'How it works',
    noRequests: 'Add at least one valid cylinder within the disk range.',
    headLabel: 'start',
    endLabel: 'end',
  },
}

function parseRequests(text) {
  return text
    .split(/[\s,]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n))
}

export default function DiskSchedulingSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const algoLabels = ALGORITHM_LABELS[lang]
  const algoDescriptions = ALGORITHM_DESCRIPTIONS[lang]
  const presets = PRESETS[lang]

  const [algorithm, setAlgorithm] = useState(ALGORITHMS.FCFS)
  const [initialHead, setInitialHead] = useState(50)
  const [maxCylinder, setMaxCylinder] = useState(200)
  const [requestsText, setRequestsText] = useState('82, 170, 43, 140, 24, 16, 190')
  const [tick, setTick] = useState(0)
  const [copiedKey, setCopiedKey] = useState(null)

  const parsedRequests = useMemo(() => parseRequests(requestsText), [requestsText])

  const result = useMemo(
    () =>
      simulate({
        requests: parsedRequests,
        initialHead,
        maxCylinder,
        algorithm,
      }),
    [parsedRequests, initialHead, maxCylinder, algorithm, tick]
  )

  const handleSimulate = () => {
    setTick((x) => x + 1)
  }

  const applyPreset = (preset) => {
    setAlgorithm(preset.algorithm)
    setInitialHead(preset.initialHead)
    setMaxCylinder(preset.maxCylinder)
    setRequestsText(preset.requests.join(', '))
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const chartWidth = 640
  const chartHeight = 220
  const padding = { left: 40, right: 24, top: 32, bottom: 56 }
  const trackY = 120
  const usableWidth = chartWidth - padding.left - padding.right
  const maxC = Math.max(1, maxCylinder)
  const scale = usableWidth / (maxC - 1)

  const positions = result.sequence.map((s) => s.position)
  const coords = positions.map((p) => ({
    x: padding.left + p * scale,
    y: trackY,
  }))

  const tableData = result.servedOrder.map((cylinder, idx) => {
    let seek = 0
    for (let i = 1; i < result.sequence.length; i++) {
      if (result.sequence[i].position === cylinder) {
        seek = result.sequence[i].distance
        break
      }
    }
    return {
      key: idx,
      order: idx + 1,
      cylinder,
      seek,
    }
  })

  const columns = [
    { title: t.orderCol, dataIndex: 'order', key: 'order' },
    {
      title: t.cylinderCol,
      dataIndex: 'cylinder',
      key: 'cylinder',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: t.seekCol,
      dataIndex: 'seek',
      key: 'seek',
      render: (v) => <Tag color={v === 0 ? 'default' : 'cyan'}>{v}</Tag>,
    },
  ]

  const tickStep = Math.max(1, Math.ceil(maxC / 10 / 10) * 10)
  const ticks = []
  for (let i = 0; i < maxC; i += tickStep) {
    ticks.push(i)
  }
  if (!ticks.includes(maxC - 1)) ticks.push(maxC - 1)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <HddOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.requestsLabel}</Text>
                <Input.TextArea
                  rows={2}
                  value={requestsText}
                  onChange={(e) => setRequestsText(e.target.value)}
                  placeholder={t.requestsPlaceholder}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.initialHeadLabel}</Text>
                <InputNumber
                  min={0}
                  max={maxC - 1}
                  value={initialHead}
                  onChange={(v) => setInitialHead(v ?? 0)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.maxCylinderLabel}</Text>
                <InputNumber
                  min={1}
                  max={10000}
                  value={maxCylinder}
                  onChange={(v) => setMaxCylinder(v ?? 200)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
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
        </Space>
      </Card>

      {result.servedOrder.length === 0 ? (
        <Alert type="warning" showIcon message={t.noRequests} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} lg={6}>
              <Card size="small">
                <Statistic
                  title={t.totalSeek}
                  value={result.totalSeek}
                  prefix={<ArrowsAltOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card size="small">
                <Statistic
                  title={t.averageSeek}
                  value={result.averageSeek.toFixed(2)}
                  prefix={<CalculatorOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card size="small">
                <Statistic
                  title={t.maxSeek}
                  value={result.maxSeek}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card size="small">
                <Statistic
                  title={t.servedTitle}
                  value={result.servedOrder.length}
                  prefix={<NumberOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card size="small" title={t.chartTitle}>
            <div style={{ overflowX: 'auto' }}>
              <svg
                width={chartWidth}
                height={chartHeight}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label={t.chartTitle}
              >
                {/* eixo */}
                <line
                  x1={padding.left}
                  y1={trackY}
                  x2={padding.left + usableWidth}
                  y2={trackY}
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <polygon
                  points={`${padding.left + usableWidth},${trackY} ${padding.left + usableWidth - 8},${trackY - 5} ${padding.left + usableWidth - 8},${trackY + 5}`}
                  fill="currentColor"
                />

                {/* ticks */}
                {ticks.map((pos) => {
                  const x = padding.left + pos * scale
                  return (
                    <g key={`tick-${pos}`}>
                      <line x1={x} y1={trackY - 4} x2={x} y2={trackY + 4} stroke="currentColor" />
                      <text x={x} y={trackY + 20} textAnchor="middle" fontSize={10} fill="currentColor">
                        {pos}
                      </text>
                    </g>
                  )
                })}

                {/* labels de extremidades */}
                <text x={padding.left} y={chartHeight - 12} textAnchor="middle" fontSize={11} fill="currentColor">
                  0
                </text>
                <text
                  x={padding.left + usableWidth}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                >
                  {maxC - 1}
                </text>

                {/* caminho do braco */}
                {coords.length > 1 && (
                  <polyline
                    points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
                    fill="none"
                    stroke="#1677ff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* ponto inicial */}
                <circle cx={coords[0]?.x} cy={trackY} r={6} fill="#52c41a" stroke="#fff" strokeWidth={2} />
                <text
                  x={coords[0]?.x}
                  y={trackY - 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#52c41a"
                  fontWeight={700}
                >
                  {t.headLabel}
                </text>

                {/* requisicoes atendidas */}
                {(() => {
                  const used = new Set()
                  return result.servedOrder.map((cylinder, idx) => {
                    let foundIndex = -1
                    for (let i = 1; i < result.sequence.length; i++) {
                      if (result.sequence[i].position === cylinder && !used.has(i)) {
                        foundIndex = i
                        break
                      }
                    }
                    if (foundIndex === -1) return null
                    used.add(foundIndex)
                    const x = padding.left + cylinder * scale
                    return (
                      <g key={`req-${idx}`}>
                        <circle cx={x} cy={trackY} r={5} fill="#1677ff" stroke="#fff" strokeWidth={2} />
                        <text x={x} y={trackY - 28} textAnchor="middle" fontSize={11} fill="#1677ff" fontWeight={700}>
                          {idx + 1}
                        </text>
                        <text x={x} y={trackY + 38} textAnchor="middle" fontSize={9} fill="currentColor">
                          {cylinder}
                        </text>
                      </g>
                    )
                  })
                })()}
              </svg>
            </div>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card size="small" title={t.servedTitle}>
                <Table
                  dataSource={tableData}
                  columns={columns}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card size="small" title={t.ignoredTitle}>
                {result.ignored.length === 0 ? (
                  <Text type="secondary">{t.ignoredEmpty}</Text>
                ) : (
                  <Space size={[8, 8]} wrap>
                    {result.ignored.map((item, idx) => (
                      <Tag key={idx} color="error">
                        {item.value}
                      </Tag>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

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
