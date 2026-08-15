import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
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
  Slider,
} from 'antd'
import {
  ApartmentOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  CopyOutlined,
  BarChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildRing,
  assignKeys,
  computeStats,
  generateKeys,
  PRESETS,
  sourceCode,
} from '../utils/consistentHashingSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const NODE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d', '#2f54eb']

const translations = {
  pt: {
    title: 'Simulador de Consistent Hashing',
    intro:
      'Visualize como o consistent hashing distribui chaves em um anel hash. Adicione ou remova nodes, ajuste o numero de vnodes e observe como poucas chaves precisam ser remapeadas quando a topologia muda — tudo no navegador, sem chamadas de rede.',
    nodesTitle: 'Nodes',
    nodeName: 'ID do node',
    nodeWeight: 'Peso',
    addNode: 'Adicionar node',
    removeNode: 'Remover',
    vnodesLabel: 'VNodes por node',
    keysLabel: 'Quantidade de chaves',
    generateKeys: 'Gerar chaves',
    presetsTitle: 'Cenarios rapidos',
    apply: 'Aplicar',
    ringTitle: 'Anel hash',
    mappingTitle: 'Mapeamento key → node',
    statsTitle: 'Estatisticas',
    totalKeys: 'Chaves',
    totalNodes: 'Nodes',
    vnodesTotal: 'VNodes totais',
    balanceScore: 'Desvio padrao',
    minMax: 'Min / Max',
    keyCol: 'Chave',
    hashCol: 'Hash (ring)',
    nodeCol: 'Node',
    noNodes: 'Adicione pelo menos um node.',
    noKeys: 'Gere pelo menos uma chave para ver o mapeamento.',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    ringNote: 'Cada fatia colorida representa a regiao do anel atribuida a um vnode; a chave cai no primeiro vnode a sua frente no sentido horario.',
    keySampleNote: 'Mostrando as primeiras 200 chaves no anel.',
  },
  en: {
    title: 'Consistent Hashing Simulator',
    intro:
      'Visualize how consistent hashing distributes keys across a hash ring. Add or remove nodes, adjust the number of virtual nodes and see how few keys need to be remapped when the topology changes — all in the browser, with no network calls.',
    nodesTitle: 'Nodes',
    nodeName: 'Node ID',
    nodeWeight: 'Weight',
    addNode: 'Add node',
    removeNode: 'Remove',
    vnodesLabel: 'VNodes per node',
    keysLabel: 'Number of keys',
    generateKeys: 'Generate keys',
    presetsTitle: 'Quick scenarios',
    apply: 'Apply',
    ringTitle: 'Hash ring',
    mappingTitle: 'Key → node mapping',
    statsTitle: 'Statistics',
    totalKeys: 'Keys',
    totalNodes: 'Nodes',
    vnodesTotal: 'Total VNodes',
    balanceScore: 'Standard deviation',
    minMax: 'Min / Max',
    keyCol: 'Key',
    hashCol: 'Ring hash',
    nodeCol: 'Node',
    noNodes: 'Add at least one node.',
    noKeys: 'Generate at least one key to see the mapping.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    ringNote: 'Each colored slice represents the ring region owned by a virtual node; a key lands on the first vnode ahead of it in clockwise order.',
    keySampleNote: 'Showing the first 200 keys on the ring.',
  },
}

export default function ConsistentHashingSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [nodes, setNodes] = useState([
    { id: 'node-a', color: NODE_COLORS[0], weight: 1 },
    { id: 'node-b', color: NODE_COLORS[1], weight: 1 },
    { id: 'node-c', color: NODE_COLORS[2], weight: 1 },
  ])
  const [vnodesPerNode, setVnodesPerNode] = useState(100)
  const [keyCount, setKeyCount] = useState(500)
  const [keys, setKeys] = useState(() => generateKeys(500))
  const [copiedKey, setCopiedKey] = useState(null)

  const ringPoints = useMemo(() => buildRing(nodes, vnodesPerNode).points, [nodes, vnodesPerNode])

  const { assignments, counts, stats } = useMemo(() => {
    const { assignments: a, counts: c } = assignKeys(keys, ringPoints)
    const s = computeStats(c, keys.length, nodes)
    return { assignments: a, counts: c, stats: s }
  }, [keys, ringPoints, nodes])

  const updateNode = useCallback((index, field, value) => {
    setNodes((prev) =>
      prev.map((n, i) => (i === index ? { ...n, [field]: value } : n))
    )
  }, [])

  const addNode = useCallback(() => {
    setNodes((prev) => {
      const idx = prev.length
      const id = `node-${String.fromCharCode(97 + idx)}`
      return [...prev, { id, color: NODE_COLORS[idx % NODE_COLORS.length], weight: 1 }]
    })
  }, [])

  const removeNode = useCallback((index) => {
    setNodes((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const regenerateKeys = useCallback(() => {
    setKeys(generateKeys(Math.max(1, Math.min(5000, keyCount))))
  }, [keyCount])

  const applyPreset = useCallback(
    (preset) => {
      setNodes(preset.nodes.map((n) => ({ ...n })))
      setVnodesPerNode(preset.vnodesPerNode)
      setKeyCount(preset.keys)
      setKeys(generateKeys(preset.keys))
    },
    []
  )

  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  const mappingColumns = [
    { title: '#', key: 'index', width: 60, render: (_, __, idx) => idx + 1 },
    { title: t.keyCol, dataIndex: 'key', key: 'key', ellipsis: true },
    {
      title: t.hashCol,
      dataIndex: 'pos',
      key: 'pos',
      render: (v) => v.toLocaleString(lang),
    },
    {
      title: t.nodeCol,
      dataIndex: 'nodeId',
      key: 'nodeId',
      render: (id, row) => {
        const node = nodes.find((n) => n.id === id)
        return <Tag color={node?.color || 'default'}>{id}</Tag>
      },
    },
  ]

  // Visualizacao do anel.
  const size = 360
  const cx = size / 2
  const cy = size / 2
  const outerR = 160
  const innerR = 110
  const RING_SIZE = 2 ** 32

  function polar(pos, r) {
    const angle = (pos / RING_SIZE) * Math.PI * 2 - Math.PI / 2
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  function arcPath(startPos, endPos) {
    const start = polar(startPos, outerR)
    const end = polar(endPos, outerR)
    const startInner = polar(startPos, innerR)
    const endInner = polar(endPos, innerR)
    const largeArc = endPos > startPos ? endPos - startPos > RING_SIZE / 2 : startPos - endPos < RING_SIZE / 2
    const sweep = 1
    return `M ${start.x} ${start.y} A ${outerR} ${outerR} 0 ${largeArc ? 1 : 0} ${sweep} ${end.x} ${end.y} L ${endInner.x} ${endInner.y} A ${innerR} ${innerR} 0 ${largeArc ? 1 : 0} ${0} ${startInner.x} ${startInner.y} Z`
  }

  const ringSlices = useMemo(() => {
    if (ringPoints.length === 0) return []
    const slices = []
    for (let i = 0; i < ringPoints.length; i += 1) {
      const current = ringPoints[i]
      const next = ringPoints[(i + 1) % ringPoints.length]
      slices.push({
        key: `${current.nodeId}-${current.pos}`,
        d: arcPath(current.pos, next.pos),
        color: current.color,
        nodeId: current.nodeId,
      })
    }
    return slices
  }, [ringPoints])

  const vnodeMarkers = useMemo(() => {
    return ringPoints.map((p) => {
      const pos = polar(p.pos, (outerR + innerR) / 2)
      return { key: `${p.nodeId}-${p.pos}`, ...pos, color: p.color }
    })
  }, [ringPoints])

  const keyMarkers = useMemo(() => {
    const sample = assignments.slice(0, 200)
    return sample.map((a) => {
      const pos = polar(a.pos, outerR + 12)
      const node = nodes.find((n) => n.id === a.nodeId)
      return { key: a.key, ...pos, color: node?.color || '#999' }
    })
  }, [assignments, nodes])

  const maxVisibleKeys = 200
  const showingSample = assignments.length > maxVisibleKeys

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.nodesTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {nodes.map((node, idx) => (
            <Row key={`${node.id}-${idx}`} gutter={[12, 12]} align="middle">
              <Col xs={24} sm={4}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: node.color,
                    display: 'inline-block',
                    marginRight: 8,
                    verticalAlign: 'middle',
                  }}
                />
              </Col>
              <Col xs={24} sm={10}>
                <Input
                  value={node.id}
                  onChange={(e) => updateNode(idx, 'id', e.target.value)}
                  placeholder={`${t.nodeName} ${idx + 1}`}
                />
              </Col>
              <Col xs={18} sm={6}>
                <InputNumber
                  min={1}
                  max={32}
                  value={node.weight}
                  onChange={(v) => updateNode(idx, 'weight', v ?? 1)}
                  style={{ width: '100%' }}
                  addonBefore={t.nodeWeight}
                />
              </Col>
              <Col xs={6} sm={4}>
                <Button
                  danger
                  size="small"
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeNode(idx)}
                  disabled={nodes.length <= 1}
                >
                  {t.removeNode}
                </Button>
              </Col>
            </Row>
          ))}
          <Button icon={<PlusOutlined />} onClick={addNode}>
            {t.addNode}
          </Button>
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.vnodesLabel}</Text>
                <Row>
                  <Col span={20}>
                    <Slider
                      min={10}
                      max={500}
                      step={10}
                      value={vnodesPerNode}
                      onChange={setVnodesPerNode}
                    />
                  </Col>
                  <Col span={4} style={{ textAlign: 'right' }}>
                    <Text strong>{vnodesPerNode}</Text>
                  </Col>
                </Row>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.keysLabel}</Text>
                <InputNumber
                  min={1}
                  max={5000}
                  step={100}
                  value={keyCount}
                  onChange={(v) => setKeyCount(v ?? 1)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          </Row>

          <Button icon={<ReloadOutlined />} onClick={regenerateKeys}>
            {t.generateKeys}
          </Button>

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

          {nodes.length === 0 ? (
            <Alert type="warning" showIcon message={t.noNodes} />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic title={t.totalKeys} value={keys.length} prefix={<BarChartOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic title={t.totalNodes} value={nodes.length} prefix={<ApartmentOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic title={t.vnodesTotal} value={ringPoints.length} prefix={<ApartmentOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={t.balanceScore}
                      value={stats.stdDev.toFixed(1)}
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card size="small" title={t.ringTitle}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <svg
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        role="img"
                        aria-label={t.ringTitle}
                      >
                        <circle cx={cx} cy={cy} r={outerR + 2} fill="none" stroke="#d9d9d9" strokeWidth={1} />
                        <circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke="#d9d9d9" strokeWidth={1} />
                        {ringSlices.map((slice) => (
                          <path
                            key={slice.key}
                            d={slice.d}
                            fill={slice.color}
                            fillOpacity={0.35}
                            stroke={slice.color}
                            strokeWidth={0.5}
                          />
                        ))}
                        {vnodeMarkers.map((m) => (
                          <circle key={m.key} cx={m.x} cy={m.y} r={2} fill={m.color} />
                        ))}
                        {keyMarkers.map((k) => (
                          <circle key={k.key} cx={k.x} cy={k.y} r={1.5} fill={k.color} opacity={0.8} />
                        ))}
                      </svg>
                    </div>
                    <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                      {t.ringNote}
                    </Paragraph>
                    {showingSample && (
                      <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                        {t.keySampleNote}
                      </Paragraph>
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card size="small" title={t.statsTitle}>
                    <Table
                      dataSource={nodes.map((n) => ({
                        id: n.id,
                        color: n.color,
                        count: counts[n.id] || 0,
                        percentage: stats.percentages[n.id] || 0,
                        weight: n.weight,
                      }))}
                      columns={[
                        {
                          title: t.nodeCol,
                          dataIndex: 'id',
                          key: 'id',
                          render: (id, row) => <Tag color={row.color}>{id}</Tag>,
                        },
                        {
                          title: t.nodeWeight,
                          dataIndex: 'weight',
                          key: 'weight',
                        },
                        {
                          title: t.statsTitle,
                          dataIndex: 'count',
                          key: 'count',
                          render: (v, row) => `${v} (${row.percentage.toFixed(1)}%)`,
                        },
                      ]}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                    <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
                      <Text strong>{t.minMax}: </Text>
                      <Text>
                        {stats.min} / {stats.max} ({t.balanceScore}: {stats.stdDev.toFixed(2)})
                      </Text>
                    </Paragraph>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title={t.mappingTitle}>
                {assignments.length === 0 ? (
                  <Alert type="info" showIcon message={t.noKeys} />
                ) : (
                  <Table
                    dataSource={assignments}
                    columns={mappingColumns}
                    rowKey="key"
                    pagination={{ pageSize: 20, hideOnSinglePage: true }}
                    size="small"
                    scroll={{ x: 'max-content' }}
                  />
                )}
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
