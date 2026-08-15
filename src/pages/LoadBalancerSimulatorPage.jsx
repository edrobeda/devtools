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
  PartitionOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  CopyOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  ALGORITHM_LABELS,
  ALGORITHM_DESCRIPTIONS,
  PRESETS,
  simulate,
  computeStandardDeviation,
  sourceCode,
} from '../utils/loadBalancerSimulator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Load Balancer',
    intro:
      'Compare como diferentes algoritmos de load balancing distribuem requisicoes entre backends. Ajuste os servidores, escolha o algoritmo e simule centenas de requisicoes no navegador — nenhuma chamada de rede e feita.',
    algorithmLabel: 'Algoritmo',
    requestsLabel: 'Requisicoes',
    backendsTitle: 'Backends',
    backendName: 'Nome',
    backendWeight: 'Peso',
    backendConnections: 'Conexoes iniciais',
    addBackend: 'Adicionar backend',
    removeBackend: 'Remover',
    presetsTitle: 'Cenarios rapidos',
    simulate: 'Simular',
    resultsTitle: 'Resultados',
    totalRequests: 'Total',
    backendsUsed: 'Backends',
    balanceScore: 'Desvio padrao',
    assignmentsTitle: 'Distribuicao detalhada',
    requestCol: '#',
    backendCol: 'Backend',
    ipCol: 'Cliente IP',
    countCol: 'Requisicoes',
    percentCol: '%',
    idealCol: '% ideal',
    diffCol: 'Diferenca',
    noBackends: 'Adicione pelo menos um backend com peso maior que zero.',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    algorithmInfo: 'Como funciona',
  },
  en: {
    title: 'Load Balancer Simulator',
    intro:
      'Compare how different load balancing algorithms distribute requests across backends. Adjust the servers, pick an algorithm and simulate hundreds of requests in the browser — no network calls are made.',
    algorithmLabel: 'Algorithm',
    requestsLabel: 'Requests',
    backendsTitle: 'Backends',
    backendName: 'Name',
    backendWeight: 'Weight',
    backendConnections: 'Initial connections',
    addBackend: 'Add backend',
    removeBackend: 'Remove',
    presetsTitle: 'Quick scenarios',
    simulate: 'Simulate',
    resultsTitle: 'Results',
    totalRequests: 'Total',
    backendsUsed: 'Backends',
    balanceScore: 'Standard deviation',
    assignmentsTitle: 'Detailed distribution',
    requestCol: '#',
    backendCol: 'Backend',
    ipCol: 'Client IP',
    countCol: 'Requests',
    percentCol: '%',
    idealCol: '% ideal',
    diffCol: 'Difference',
    noBackends: 'Add at least one backend with a weight greater than zero.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    algorithmInfo: 'How it works',
  },
}

function generateBackendId(index) {
  return `b${index + 1}`
}

export default function LoadBalancerSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const algoLabels = ALGORITHM_LABELS[lang]
  const algoDescriptions = ALGORITHM_DESCRIPTIONS[lang]
  const presets = PRESETS[lang]

  const [algorithm, setAlgorithm] = useState(ALGORITHMS.ROUND_ROBIN)
  const [requests, setRequests] = useState(30)
  const [backends, setBackends] = useState([
    { id: 'a', name: 'backend-a', weight: 1, connections: 0 },
    { id: 'b', name: 'backend-b', weight: 1, connections: 0 },
    { id: 'c', name: 'backend-c', weight: 1, connections: 0 },
  ])
  const [copiedKey, setCopiedKey] = useState(null)
  const [seed] = useState(12345)

  const validBackends = useMemo(
    () => backends.filter((b) => b.weight > 0),
    [backends]
  )

  const result = useMemo(
    () =>
      simulate({
        backends: validBackends,
        requests,
        algorithm,
        seed,
      }),
    [validBackends, requests, algorithm, seed]
  )

  const updateBackend = (id, field, value) => {
    setBackends((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    )
  }

  const addBackend = () => {
    setBackends((prev) => {
      const nextId = generateBackendId(prev.length)
      return [
        ...prev,
        {
          id: nextId,
          name: `backend-${String.fromCharCode(97 + prev.length)}`,
          weight: 1,
          connections: 0,
        },
      ]
    })
  }

  const removeBackend = (id) => {
    setBackends((prev) => prev.filter((b) => b.id !== id))
  }

  const applyPreset = (preset) => {
    setAlgorithm(preset.algorithm)
    setRequests(preset.requests)
    setBackends(preset.backends.map((b) => ({ ...b })))
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const percentages = result.backendStats.map((b) => b.percentage)
  const stdDev = computeStandardDeviation(percentages)

  const columns = [
    {
      title: t.requestCol,
      dataIndex: 'requestIndex',
      key: 'requestIndex',
      width: 70,
    },
    {
      title: t.backendCol,
      dataIndex: 'backendId',
      key: 'backendId',
      render: (id) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: t.ipCol,
      dataIndex: 'clientIp',
      key: 'clientIp',
      render: (ip, row) =>
        algorithm === ALGORITHMS.IP_HASH ? ip : <Text type="secondary">—</Text>,
    },
  ]

  const statsColumns = [
    {
      title: t.backendCol,
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t.countCol,
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: t.percentCol,
      dataIndex: 'percentage',
      key: 'percentage',
      render: (v) => `${v.toFixed(1)}%`,
    },
    {
      title: t.idealCol,
      dataIndex: 'id',
      key: 'ideal',
      render: (id) => `${result.idealPercentages[id]?.toFixed(1) ?? '—'}%`,
    },
    {
      title: t.diffCol,
      dataIndex: 'id',
      key: 'diff',
      render: (id, row) => {
        const diff = row.percentage - (result.idealPercentages[id] || 0)
        const sign = diff > 0 ? '+' : ''
        return (
          <Tag color={Math.abs(diff) < 1 ? 'success' : diff > 0 ? 'warning' : 'error'}>
            {`${sign}${diff.toFixed(1)}%`}
          </Tag>
        )
      },
    },
    {
      title: t.backendConnections,
      dataIndex: 'finalConnections',
      key: 'finalConnections',
      render: (v) => (algorithm === ALGORITHMS.LEAST_CONNECTIONS ? v : '—'),
    },
  ]

  const maxBar = Math.max(1, ...result.backendStats.map((b) => b.count))
  const chartHeight = 160
  const barWidth = Math.max(16, 320 / Math.max(result.backendStats.length, 1) - 16)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <PartitionOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.backendsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {backends.map((b, idx) => (
            <Row key={b.id} gutter={[12, 12]} align="middle">
              <Col xs={24} sm={8}>
                <Input
                  value={b.name}
                  onChange={(e) => updateBackend(b.id, 'name', e.target.value)}
                  placeholder={`${t.backendName} ${idx + 1}`}
                />
              </Col>
              <Col xs={12} sm={5}>
                <InputNumber
                  min={0}
                  value={b.weight}
                  onChange={(v) => updateBackend(b.id, 'weight', v ?? 0)}
                  style={{ width: '100%' }}
                  addonBefore={t.backendWeight}
                />
              </Col>
              <Col xs={12} sm={5}>
                <InputNumber
                  min={0}
                  value={b.connections}
                  onChange={(v) => updateBackend(b.id, 'connections', v ?? 0)}
                  style={{ width: '100%' }}
                  addonBefore={t.backendConnections}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Button
                  danger
                  size="small"
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeBackend(b.id)}
                  disabled={backends.length <= 1}
                >
                  {t.removeBackend}
                </Button>
              </Col>
            </Row>
          ))}
          <Button icon={<PlusOutlined />} onClick={addBackend}>
            {t.addBackend}
          </Button>
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
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
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.requestsLabel}</Text>
                <InputNumber
                  min={1}
                  max={5000}
                  step={10}
                  value={requests}
                  onChange={(v) => setRequests(v ?? 1)}
                  style={{ width: '100%' }}
                />
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

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setRequests((r) => r)}
          >
            {t.simulate}
          </Button>

          <Alert type="info" showIcon message={t.algorithmInfo} description={algoDescriptions[algorithm]} />

          {validBackends.length === 0 ? (
            <Alert type="warning" showIcon message={t.noBackends} />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8}>
                  <Card size="small">
                    <Statistic title={t.totalRequests} value={requests} prefix={<BarChartOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small">
                    <Statistic title={t.backendsUsed} value={validBackends.length} prefix={<PartitionOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small">
                    <Statistic
                      title={t.balanceScore}
                      value={stdDev.toFixed(1)}
                      suffix="%"
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card size="small" title={t.resultsTitle}>
                    <Table
                      dataSource={result.backendStats}
                      columns={statsColumns}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ x: 'max-content' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card size="small" title={`${t.resultsTitle} — ${algoLabels[algorithm]}`}>
                    <svg
                      width="100%"
                      height={chartHeight}
                      viewBox={`0 0 360 ${chartHeight}`}
                      role="img"
                      aria-label={t.resultsTitle}
                    >
                      {result.backendStats.map((b, idx) => {
                        const h = Math.max(4, (b.count / maxBar) * (chartHeight - 48))
                        const x =
                          20 +
                          idx * (360 / Math.max(result.backendStats.length, 1)) +
                          (360 / Math.max(result.backendStats.length, 1) - barWidth) / 2
                        const y = chartHeight - h - 32
                        return (
                          <g key={b.id}>
                            <rect x={x} y={y} width={barWidth} height={h} fill="#1677ff" rx={4} />
                            <text x={x + barWidth / 2} y={chartHeight - 18} textAnchor="middle" fontSize={10} fill="currentColor">
                              {b.name}
                            </text>
                            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="#1677ff">
                              {b.count}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title={t.assignmentsTitle}>
                <Table
                  dataSource={result.assignments}
                  columns={columns}
                  rowKey="requestIndex"
                  pagination={{ pageSize: 20, hideOnSinglePage: true }}
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
