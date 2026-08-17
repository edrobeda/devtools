import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Input,
  InputNumber,
  Space,
  Row,
  Col,
  Tag,
  Alert,
  Collapse,
  Table,
  Statistic,
} from 'antd'
import {
  ApartmentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  createState,
  addProcess,
  removeProcess,
  addResource,
  removeResource,
  setAllocation,
  setRequest,
  releaseAll,
  detectDeadlock,
  buildGraphLayout,
  loadScenario,
  getScenarioLabels,
  availableInstances,
  getAllocated,
  getRequested,
  totalAllocated,
  MAX_INSTANCES,
} from '../utils/deadlockSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  createState,
  addProcess,
  addResource,
  setAllocation,
  setRequest,
  detectDeadlock,
} from '../utils/deadlockSimulator'

let state = createState()
state = addProcess(state, 'P1')
state = addProcess(state, 'P2')
state = addResource(state, 'R1', 1)
state = addResource(state, 'R2', 1)

// P1 detem R1 e pede R2; P2 detem R2 e pede R1
state = setAllocation(state, 'p1', 'r1', 1)
state = setAllocation(state, 'p2', 'r2', 1)
state = setRequest(state, 'p1', 'r2', 1)
state = setRequest(state, 'p2', 'r1', 1)

const result = detectDeadlock(state)
// result.deadlock === true
// result.involvedProcessIds === ['p1', 'p2']
`

const translations = {
  pt: {
    title: 'Simulador de Deadlock',
    subtitle: 'Detecção de deadlock em Resource Allocation Graph',
    intro: 'Monte processos e recursos, defina alocações e requisições pendentes, e veja em tempo real se o sistema entrou em deadlock. O algoritmo de detecção suporta múltiplas instâncias por recurso e indica quais processos estão envolvidos no ciclo de espera.',
    processes: 'Processos',
    resources: 'Recursos',
    addProcess: 'Adicionar processo',
    addResource: 'Adicionar recurso',
    resourceInstances: 'Instâncias',
    allocations: 'Alocações',
    requests: 'Requisições pendentes',
    allocatedTo: 'Alocado para',
    requestedBy: 'Requisitado por',
    available: 'Disponível',
    total: 'Total',
    graphTitle: 'Resource Allocation Graph',
    allocationEdge: 'aresta de alocação (recurso → processo)',
    requestEdge: 'aresta de requisição (processo → recurso)',
    resultTitle: 'Resultado da detecção',
    deadlockDetected: 'Deadlock detectado',
    deadlockFree: 'Sem deadlock',
    involvedProcesses: 'Processos envolvidos',
    safeSequence: 'Sequência segura',
    noSafeSequence: 'Nenhuma sequência segura completa porque há deadlock.',
    scenarios: 'Cenários rápidos',
    reset: 'Limpar tudo',
    sourceTitle: 'Motor de detecção',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    note: 'A detecção segue o algoritmo clássico para múltiplas instâncias: tenta encontrar uma sequência segura; processos que não podem terminar estão em deadlock.',
    processNamePlaceholder: 'Nome do processo',
    resourceNamePlaceholder: 'Nome do recurso',
  },
  en: {
    title: 'Deadlock Simulator',
    subtitle: 'Deadlock detection on a Resource Allocation Graph',
    intro: 'Build processes and resources, define current allocations and pending requests, and see in real time whether the system is deadlocked. The detection algorithm supports multiple instances per resource and shows which processes are caught in the wait-for cycle.',
    processes: 'Processes',
    resources: 'Resources',
    addProcess: 'Add process',
    addResource: 'Add resource',
    resourceInstances: 'Instances',
    allocations: 'Allocations',
    requests: 'Pending requests',
    allocatedTo: 'Allocated to',
    requestedBy: 'Requested by',
    available: 'Available',
    total: 'Total',
    graphTitle: 'Resource Allocation Graph',
    allocationEdge: 'allocation edge (resource → process)',
    requestEdge: 'request edge (process → resource)',
    resultTitle: 'Detection result',
    deadlockDetected: 'Deadlock detected',
    deadlockFree: 'No deadlock',
    involvedProcesses: 'Involved processes',
    safeSequence: 'Safe sequence',
    noSafeSequence: 'No complete safe sequence because there is a deadlock.',
    scenarios: 'Quick scenarios',
    reset: 'Clear all',
    sourceTitle: 'Detection engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    note: 'Detection follows the classic multiple-instance algorithm: it tries to find a safe sequence; processes that cannot finish are deadlocked.',
    processNamePlaceholder: 'Process name',
    resourceNamePlaceholder: 'Resource name',
  },
}

export default function DeadlockSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [state, setState] = useState(() => loadScenario('classic'))
  const [processName, setProcessName] = useState('')
  const [resourceName, setResourceName] = useState('')
  const [resourceInstances, setResourceInstances] = useState(1)

  const scenarioLabels = useMemo(() => getScenarioLabels(lang), [lang])

  const analysis = useMemo(() => detectDeadlock(state), [state])

  const layout = useMemo(() => buildGraphLayout(state, 640, 360), [state, analysis.deadlock])

  const processColumns = [
    { title: t.processes, dataIndex: 'name', key: 'name' },
    {
      title: t.allocations,
      key: 'allocations',
      render: (_, record) => {
        const items = state.resources
          .map((r) => ({ r, count: getAllocated(state, r.id, record.id) }))
          .filter((item) => item.count > 0)
        if (items.length === 0) return <Text type="secondary">—</Text>
        return items.map((item) => (
          <Tag key={item.r.id} color="blue">
            {item.r.name}: {item.count}
          </Tag>
        ))
      },
    },
    {
      title: t.requests,
      key: 'requests',
      render: (_, record) => {
        const items = state.resources
          .map((r) => ({ r, count: getRequested(state, r.id, record.id) }))
          .filter((item) => item.count > 0)
        if (items.length === 0) return <Text type="secondary">—</Text>
        return items.map((item) => (
          <Tag key={item.r.id} color="orange">
            {item.r.name}: {item.count}
          </Tag>
        ))
      },
    },
    {
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setState((s) => removeProcess(s, record.id))}
        >
        </Button>
      ),
    },
  ]

  const resourceColumns = [
    { title: t.resources, dataIndex: 'name', key: 'name' },
    { title: t.total, dataIndex: 'totalInstances', align: 'center', key: 'total' },
    {
      title: t.allocations,
      key: 'allocations',
      align: 'center',
      render: (_, record) => totalAllocated(state, record.id),
    },
    {
      title: t.available,
      key: 'available',
      align: 'center',
      render: (_, record) => (
        <Tag color={availableInstances(state, record.id) === 0 ? 'red' : 'green'}>
          {availableInstances(state, record.id)}
        </Tag>
      ),
    },
    {
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setState((s) => removeResource(s, record.id))}
        >
        </Button>
      ),
    },
  ]

  function handleAddProcess() {
    setState((s) => addProcess(s, processName))
    setProcessName('')
  }

  function handleAddResource() {
    setState((s) => addResource(s, resourceName, resourceInstances))
    setResourceName('')
    setResourceInstances(1)
  }

  function handleScenario(key) {
    setState(loadScenario(key))
  }

  function renderGraph() {
    const { processNodes, resourceNodes, allocationEdges, requestEdges, width, height } = layout
    const involved = new Set(analysis.involvedProcessIds)

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ maxWidth: 640, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}
      >
        <defs>
          <marker id="allocationArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#1677ff" />
          </marker>
          <marker id="requestArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#fa8c16" />
          </marker>
        </defs>

        {allocationEdges.map((edge, i) => {
          const sx = edge.source.x - 24
          const sy = edge.source.y
          const tx = edge.target.x + 24
          const ty = edge.target.y
          return (
            <g key={`alloc-${i}`}>
              <line
                x1={sx} y1={sy} x2={tx} y2={ty}
                stroke="#1677ff"
                strokeWidth={2}
                markerEnd="url(#allocationArrow)"
              />
              <text
                x={(sx + tx) / 2}
                y={(sy + ty) / 2 - 6}
                fill="#1677ff"
                fontSize={11}
                textAnchor="middle"
              >
                {edge.count}
              </text>
            </g>
          )
        })}

        {requestEdges.map((edge, i) => {
          const sx = edge.source.x + 24
          const sy = edge.source.y
          const tx = edge.target.x + 24
          const ty = edge.target.y
          const midX = (sx + tx) / 2
          const midY = (sy + ty) / 2
          const offset = 8
          const nx = -(ty - sy)
          const ny = (tx - sx)
          const len = Math.sqrt(nx * nx + ny * ny) || 1
          const cx = midX + (nx / len) * offset
          const cy = midY + (ny / len) * offset
          return (
            <g key={`req-${i}`}>
              <path
                d={`M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`}
                fill="none"
                stroke="#fa8c16"
                strokeWidth={2}
                strokeDasharray="6 4"
                markerEnd="url(#requestArrow)"
              />
              <text
                x={cx}
                y={cy - 6}
                fill="#fa8c16"
                fontSize={11}
                textAnchor="middle"
              >
                {edge.count}
              </text>
            </g>
          )
        })}

        {processNodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={24}
              fill={involved.has(node.id) ? '#fff1f0' : '#e6f7ff'}
              stroke={involved.has(node.id) ? '#ff4d4f' : '#1677ff'}
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fill={involved.has(node.id) ? '#ff4d4f' : '#1677ff'}
              fontSize={13}
              fontWeight={600}
            >
              {node.label}
            </text>
          </g>
        ))}

        {resourceNodes.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x - 24}
              y={node.y - 24}
              width={48}
              height={48}
              rx={4}
              fill="#f6ffed"
              stroke="#52c41a"
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fill="#52c41a"
              fontSize={13}
              fontWeight={600}
            >
              {node.label}
            </text>
            <text
              x={node.x}
              y={node.y + 42}
              textAnchor="middle"
              fill="#8c8c8c"
              fontSize={11}
            >
              {node.available}/{node.instances}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2}>
        <ApartmentOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.processes}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={t.processNamePlaceholder}
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  onPressEnter={handleAddProcess}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProcess}>
                  {t.addProcess}
                </Button>
              </Space.Compact>
              <Table
                dataSource={state.processes}
                columns={processColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Space>
          </Card>

          <Card title={t.resources} style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={t.resourceNamePlaceholder}
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  onPressEnter={handleAddResource}
                />
                <InputNumber
                  min={1}
                  max={MAX_INSTANCES}
                  value={resourceInstances}
                  onChange={(v) => setResourceInstances(v ?? 1)}
                  style={{ width: 90 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddResource}>
                  {t.addResource}
                </Button>
              </Space.Compact>
              <Table
                dataSource={state.resources}
                columns={resourceColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.graphTitle} style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {state.processes.length === 0 || state.resources.length === 0 ? (
                <Text type="secondary">{lang === 'pt' ? 'Adicione processos e recursos para visualizar o grafo.' : 'Add processes and resources to visualize the graph.'}</Text>
              ) : (
                renderGraph()
              )}
              <Space size="middle">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <span style={{ display: 'inline-block', width: 20, height: 2, background: '#1677ff', verticalAlign: 'middle', marginRight: 6 }} />
                  {t.allocationEdge}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <span style={{ display: 'inline-block', width: 20, height: 2, background: '#fa8c16', verticalAlign: 'middle', marginRight: 6, borderTop: '2px dashed #fa8c16' }} />
                  {t.requestEdge}
                </Text>
              </Space>
            </Space>
          </Card>

          <Card title={t.resultTitle}>
            {analysis.deadlock ? (
              <Alert
                type="error"
                showIcon
                icon={<WarningOutlined />}
                message={t.deadlockDetected}
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Text strong>{t.involvedProcesses}: </Text>
                      {analysis.involvedProcessIds.map((pid) => {
                        const p = state.processes.find((x) => x.id === pid)
                        return (
                          <Tag key={pid} color="red">
                            {p?.name || pid}
                          </Tag>
                        )
                      })}
                    </div>
                    <Text type="secondary">{t.noSafeSequence}</Text>
                  </Space>
                }
              />
            ) : (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={t.deadlockFree}
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Text strong>{t.safeSequence}: </Text>
                      {analysis.safeSequence.length > 0 ? (
                        analysis.safeSequence.map((pid, i) => {
                          const p = state.processes.find((x) => x.id === pid)
                          return (
                            <span key={pid}>
                              <Tag color="green">{p?.name || pid}</Tag>
                              {i < analysis.safeSequence.length - 1 && <Text type="secondary"> → </Text>}
                            </span>
                          )
                        })
                      ) : (
                        <Text type="secondary">—</Text>
                      )}
                    </div>
                  </Space>
                }
              />
            )}
          </Card>

          <Card style={{ marginTop: 16 }} title={t.scenarios}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap>
                {Object.entries(scenarioLabels).map(([key, label]) => (
                  <Button key={key} size="small" onClick={() => handleScenario(key)}>
                    {label}
                  </Button>
                ))}
                <Button size="small" icon={<ReloadOutlined />} onClick={() => setState(createState())}>
                  {t.reset}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={`${t.allocations} / ${t.requests}`}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {state.resources.map((r) => (
                <div key={r.id}>
                  <Text strong>{r.name}</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({availableInstances(state, r.id)} {t.available} / {r.totalInstances} {t.total})
                  </Text>
                  <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                    <Col xs={24} md={12}>
                      <Card size="small" title={`${t.allocatedTo} ${r.name}`}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {state.processes.map((p) => (
                            <Row key={p.id} align="middle" gutter={8}>
                              <Col span={8}>
                                <Text>{p.name}</Text>
                              </Col>
                              <Col span={16}>
                                <InputNumber
                                  min={0}
                                  max={r.totalInstances}
                                  value={getAllocated(state, r.id, p.id)}
                                  onChange={(v) => setState((s) => setAllocation(s, p.id, r.id, v ?? 0))}
                                  style={{ width: '100%' }}
                                />
                              </Col>
                            </Row>
                          ))}
                          {state.processes.length === 0 && <Text type="secondary">—</Text>}
                        </Space>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card size="small" title={`${t.requestedBy} ${r.name}`}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {state.processes.map((p) => (
                            <Row key={p.id} align="middle" gutter={8}>
                              <Col span={8}>
                                <Text>{p.name}</Text>
                              </Col>
                              <Col span={16}>
                                <InputNumber
                                  min={0}
                                  max={r.totalInstances}
                                  value={getRequested(state, r.id, p.id)}
                                  onChange={(v) => setState((s) => setRequest(s, p.id, r.id, v ?? 0))}
                                  style={{ width: '100%' }}
                                />
                              </Col>
                            </Row>
                          ))}
                          {state.processes.length === 0 && <Text type="secondary">—</Text>}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ))}
              {state.resources.length === 0 && <Text type="secondary">{lang === 'pt' ? 'Nenhum recurso criado.' : 'No resources created.'}</Text>}
            </Space>
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        message={t.note}
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
