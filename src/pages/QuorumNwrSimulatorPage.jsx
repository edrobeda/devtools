import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  InputNumber,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Collapse,
  Alert,
  Table,
} from 'antd'
import {
  ApartmentOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  analyzeQuorum,
  classifyLatencyCost,
  sourceCode,
} from '../utils/quorumNwrSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Quorum NWR',
    intro:
      'Experimente como o modelo NWR de sistemas estilo Dynamo balanceia consistencia e disponibilidade. Escolha N (replicas totais), W (confirmacoes de escrita) e R (leituras). A regra W + R > N garante que toda leitura se cruze com a ultima escrita.',
    nLabel: 'Replicas (N)',
    wLabel: 'Quorum de escrita (W)',
    rLabel: 'Quorum de leitura (R)',
    presetsTitle: 'Cenarios rapidos',
    resultTitle: 'Analise do quorum',
    replicasTitle: 'Visualizacao das replicas',
    replicaLabel: 'Replica',
    writeQuorumLabel: 'Escrita precisa de W =',
    readQuorumLabel: 'Leitura precisa de R =',
    consistent: 'Consistencia forte',
    eventual: 'Consistencia eventual',
    strict: 'Consistencia estrita (todos os nodes)',
    balanced: 'Quorum balanceado',
    strong: 'Consistencia forte',
    ruleOk: 'W + R > N — toda leitura enxerga a ultima escrita.',
    ruleFail: 'W + R <= N — leituras podem retornar valores desatualizados.',
    overlapLabel: 'Sobreposicao minima entre leitura e escrita',
    writeFaultTolerance: 'Falhas toleradas em escrita',
    readFaultTolerance: 'Falhas toleradas em leitura',
    bothFaultTolerance: 'Falhas simultaneas mantendo escrita E leitura',
    minActiveWrite: 'Nodes ativos minimos para escrever',
    minActiveRead: 'Nodes ativos minimos para ler',
    writeCost: 'Custo de escrita (replicas contatadas)',
    readCost: 'Custo de leitura (replicas contatadas)',
    totalCost: 'Custo total W + R',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    invalid: 'Configuracao invalida',
    explanationTitle: 'Como interpretar',
    explanation: (
      <>
        Em um sistema distribuido com <Text code>N</Text> replicas, uma
        escrita so eh confirmada apos receber <Text code>W</Text> acks e uma
        leitura consulta <Text code>R</Text> replicas. Se{' '}
        <Text code>W + R &gt; N</Text>, a intersecao obrigatoria entre os
        conjuntos garante que nenhuma leitura perca a ultima versao. Se{' '}
        <Text code>W + R &lt;= N</Text>, o sistema favorece latencia e
        disponibilidade, mas exige resolucao de conflitos (ex: vetor clocks,
        last-write-wins).
      </>
    ),
    classificationLabel: 'Classificacao',
    latencyTitle: 'Custo estimado',
  },
  en: {
    title: 'NWR Quorum Simulator',
    intro:
      'Experiment with the Dynamo-style NWR quorum model and see how it trades consistency for availability. Pick N (total replicas), W (write acknowledgements) and R (read replicas). The rule W + R > N ensures every read overlaps the latest write.',
    nLabel: 'Replicas (N)',
    wLabel: 'Write quorum (W)',
    rLabel: 'Read quorum (R)',
    presetsTitle: 'Quick scenarios',
    resultTitle: 'Quorum analysis',
    replicasTitle: 'Replica visualization',
    replicaLabel: 'Replica',
    writeQuorumLabel: 'Write needs W =',
    readQuorumLabel: 'Read needs R =',
    consistent: 'Strong consistency',
    eventual: 'Eventual consistency',
    strict: 'Strict consistency (all nodes)',
    balanced: 'Balanced quorum',
    strong: 'Strong consistency',
    ruleOk: 'W + R > N — every read overlaps the latest write.',
    ruleFail: 'W + R <= N — reads may return stale values.',
    overlapLabel: 'Minimum read/write overlap',
    writeFaultTolerance: 'Write fault tolerance',
    readFaultTolerance: 'Read fault tolerance',
    bothFaultTolerance: 'Simultaneous faults keeping both write AND read',
    minActiveWrite: 'Minimum active nodes to write',
    minActiveRead: 'Minimum active nodes to read',
    writeCost: 'Write cost (replicas contacted)',
    readCost: 'Read cost (replicas contacted)',
    totalCost: 'Total cost W + R',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    invalid: 'Invalid configuration',
    explanationTitle: 'How to read it',
    explanation: (
      <>
        In a distributed system with <Text code>N</Text> replicas, a write is
        only acknowledged after <Text code>W</Text> acks and a read queries{' '}
        <Text code>R</Text> replicas. If <Text code>W + R &gt; N</Text>, the
        mandatory intersection guarantees no read misses the latest version. If{' '}
        <Text code>W + R &lt;= N</Text>, the system favors latency and
        availability, but requires conflict resolution (e.g. vector clocks,
        last-write-wins).
      </>
    ),
    classificationLabel: 'Classification',
    latencyTitle: 'Estimated cost',
  },
}

export default function QuorumNwrSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [n, setN] = useState(3)
  const [w, setW] = useState(2)
  const [r, setR] = useState(2)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => analyzeQuorum(n, w, r), [n, w, r])
  const cost = useMemo(() => classifyLatencyCost(n, w, r), [n, w, r])

  const classificationText = {
    strict: t.strict,
    balanced: t.balanced,
    strong: t.strong,
    eventual: t.eventual,
    invalid: t.invalid,
  }[result.classification]

  const replicas = useMemo(() => {
    return Array.from({ length: n }, (_, i) => i + 1)
  }, [n])

  function applyPreset(preset) {
    setN(preset.n)
    setW(preset.w)
    setR(preset.r)
  }

  function handleCopy() {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const statsColumns = [
    {
      title: t.resultTitle,
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: '',
      dataIndex: 'value',
      key: 'value',
      render: (value, row) => (
        <span>
          {value}
          {row.tag && (
            <Tag color={row.tagColor} style={{ marginLeft: 8 }}>
              {row.tag}
            </Tag>
          )}
        </span>
      ),
    },
  ]

  const statsData = result.valid
    ? [
        {
          key: 'classification',
          label: t.classificationLabel,
          value: classificationText,
          tag: result.isConsistent ? t.consistent : t.eventual,
          tagColor: result.isConsistent ? 'green' : 'orange',
        },
        {
          key: 'rule',
          label: 'W + R > N',
          value: `${w} + ${r} ${result.isConsistent ? '>' : '<='} ${n}`,
          tag: result.isConsistent ? 'OK' : 'FAIL',
          tagColor: result.isConsistent ? 'success' : 'warning',
        },
        {
          key: 'overlap',
          label: t.overlapLabel,
          value: result.overlap,
        },
        {
          key: 'writeFault',
          label: t.writeFaultTolerance,
          value: result.writeFaultTolerance,
        },
        {
          key: 'readFault',
          label: t.readFaultTolerance,
          value: result.readFaultTolerance,
        },
        {
          key: 'bothFault',
          label: t.bothFaultTolerance,
          value: result.bothFaultTolerance,
        },
        {
          key: 'minWrite',
          label: t.minActiveWrite,
          value: result.minActiveNodesForWrite,
        },
        {
          key: 'minRead',
          label: t.minActiveRead,
          value: result.minActiveNodesForRead,
        },
      ]
    : [
        {
          key: 'invalid',
          label: t.invalid,
          value: result.errors.join(', '),
          tag: 'ERROR',
          tagColor: 'error',
        },
      ]

  const latencyData = [
    { key: 'writeCost', label: t.writeCost, value: cost.writeCost },
    { key: 'readCost', label: t.readCost, value: cost.readCost },
    { key: 'totalCost', label: t.totalCost, value: `${cost.totalCost} / ${cost.maxCost}` },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApartmentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle}>
        <Space wrap>
          {presets.map((preset) => (
            <Button key={preset.key} onClick={() => applyPreset(preset)}>
              {preset.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Card>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <Text strong>{t.nLabel}</Text>
            <div>
              <InputNumber
                min={1}
                max={16}
                value={n}
                onChange={(v) => setN(v || 1)}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>{t.wLabel}</Text>
            <div>
              <InputNumber
                min={1}
                max={n}
                value={w}
                onChange={(v) => setW(v || 1)}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>{t.rLabel}</Text>
            <div>
              <InputNumber
                min={1}
                max={n}
                value={r}
                onChange={(v) => setR(v || 1)}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {result.valid && (
        <>
          <Alert
            type={result.isConsistent ? 'success' : 'warning'}
            message={result.isConsistent ? t.ruleOk : t.ruleFail}
            showIcon
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title={t.resultTitle}>
                <Table
                  dataSource={statsData}
                  columns={statsColumns}
                  pagination={false}
                  size="small"
                  rowKey="key"
                  bordered
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={t.latencyTitle}>
                <Table
                  dataSource={latencyData}
                  columns={statsColumns}
                  pagination={false}
                  size="small"
                  rowKey="key"
                  bordered
                />
              </Card>
            </Col>
          </Row>

          <Card title={t.replicasTitle}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              {replicas.map((replica) => (
                <div
                  key={replica}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    border: '3px solid #1677ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    background: '#f0f5ff',
                    color: '#1677ff',
                  }}
                >
                  {replica}
                </div>
              ))}
            </div>
            <Row gutter={[16, 8]} style={{ marginTop: 24 }}>
              <Col xs={24} sm={12}>
                <Statistic
                  title={`${t.writeQuorumLabel} ${w}`}
                  value={w}
                  suffix={`/ ${n}`}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title={`${t.readQuorumLabel} ${r}`}
                  value={r}
                  suffix={`/ ${n}`}
                />
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Card title={t.explanationTitle}>
        <Paragraph>{t.explanation}</Paragraph>
      </Card>

      <Collapse defaultActiveKey={[]}>
        <Panel
          header={t.sourceCode}
          extra={
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
