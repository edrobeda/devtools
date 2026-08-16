import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Collapse,
  Alert,
  Table,
  Statistic,
  Select,
} from 'antd'
import {
  ExperimentOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  checkSafeState,
  requestResources,
  computeNeed,
  PRESETS,
  sourceCode,
} from '../utils/bankersAlgorithmSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Option } = Select

const translations = {
  pt: {
    title: 'Simulador do Algoritmo do Banqueiro',
    intro:
      'Explore o clássico algoritmo de Dijkstra/Habermann para evitar deadlock. ' +
      'Configure processos, tipos de recursos, vetor Available e matrizes Allocation/Max; ' +
      'descubra se o estado atual é seguro e teste requisições de recursos sem sair do navegador.',
    dimensionsTitle: 'Dimensões',
    processCountLabel: 'Processos',
    resourceCountLabel: 'Tipos de recurso',
    availableTitle: 'Recursos disponíveis (Available)',
    allocationTitle: 'Alocação atual (Allocation)',
    maxTitle: 'Máximo necessário (Max)',
    needTitle: 'Necessidade restante (Need = Max − Allocation)',
    checkButton: 'Verificar estado seguro',
    resetButton: 'Limpar tudo',
    presetsTitle: 'Cenários rápidos',
    resultTitle: 'Resultado da verificação',
    safe: 'Estado SEGURO',
    unsafe: 'Estado INSEGURO',
    safeSequence: 'Sequência segura',
    safeSequenceEmpty: 'Nenhuma sequência segura encontrada',
    stepsTitle: 'Passo a passo do algoritmo',
    stepProcess: 'Processo',
    stepNeed: 'Need',
    stepWorkBefore: 'Work antes',
    stepWorkAfter: 'Work depois',
    stepReleased: 'Liberou',
    requestTitle: 'Simular requisição',
    requestProcessLabel: 'Processo solicitante',
    requestAmountLabel: 'Quantidade solicitada',
    requestButton: 'Tentar conceder',
    requestGranted: 'Requisição CONCEDIDA',
    requestDenied: 'Requisão NEGADA',
    requestReason: 'Motivo',
    newAvailable: 'Novo Available',
    newAllocation: 'Nova Allocation',
    newNeed: 'Novo Need',
    howItWorksTitle: 'Como funciona',
    howItWorksText:
      'O Algoritmo do Banqueiro mantém o sistema em um estado seguro. ' +
      'Um estado é seguro quando existe pelo menos uma sequência de execução ' +
      'na qual todos os processos conseguem terminar. Para cada requisição, ' +
      'o sistema simula a concessão e só aprova se o estado resultante continuar seguro; ' +
      'caso contrário, a requisição é negada para evitar deadlock.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor em src/utils/bankersAlgorithmSimulator.js implementa a verificação de ' +
      'estado seguro e a simulação de requisições seguindo as quatro regras do algoritmo: ' +
      'request ≤ need, request ≤ available, concessão simulada e teste de segurança.',
    copy: 'Copiar',
    copied: 'Copiado',
    total: 'Total',
    unitResource: 'R',
    unitProcess: 'P',
  },
  en: {
    title: "Banker's Algorithm Simulator",
    intro:
      "Explore Dijkstra/Habermann's classic deadlock-avoidance algorithm. " +
      'Set up processes, resource types, the Available vector and the Allocation/Max matrices; ' +
      'discover whether the current state is safe and test resource requests — all in the browser.',
    dimensionsTitle: 'Dimensions',
    processCountLabel: 'Processes',
    resourceCountLabel: 'Resource types',
    availableTitle: 'Available resources (Available)',
    allocationTitle: 'Current allocation (Allocation)',
    maxTitle: 'Maximum claim (Max)',
    needTitle: 'Remaining need (Need = Max − Allocation)',
    checkButton: 'Check safe state',
    resetButton: 'Clear all',
    presetsTitle: 'Quick scenarios',
    resultTitle: 'Safety check result',
    safe: 'SAFE state',
    unsafe: 'UNSAFE state',
    safeSequence: 'Safe sequence',
    safeSequenceEmpty: 'No safe sequence found',
    stepsTitle: 'Algorithm step-by-step',
    stepProcess: 'Process',
    stepNeed: 'Need',
    stepWorkBefore: 'Work before',
    stepWorkAfter: 'Work after',
    stepReleased: 'Released',
    requestTitle: 'Simulate request',
    requestProcessLabel: 'Requesting process',
    requestAmountLabel: 'Amount requested',
    requestButton: 'Try to grant',
    requestGranted: 'Request GRANTED',
    requestDenied: 'Request DENIED',
    requestReason: 'Reason',
    newAvailable: 'New Available',
    newAllocation: 'New Allocation',
    newNeed: 'New Need',
    howItWorksTitle: 'How it works',
    howItWorksText:
      "The Banker's Algorithm keeps the system in a safe state. " +
      'A state is safe when there is at least one execution sequence ' +
      'in which every process can finish. For each request, the system simulates ' +
      'the grant and only approves it if the resulting state remains safe; ' +
      'otherwise, the request is denied to avoid deadlock.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine in src/utils/bankersAlgorithmSimulator.js implements safe-state checking ' +
      "and request simulation following the algorithm's four rules: " +
      'request ≤ need, request ≤ available, simulated grant and safety test.',
    copy: 'Copy',
    copied: 'Copied',
    total: 'Total',
    unitResource: 'R',
    unitProcess: 'P',
  },
}

const SOURCE_CODE = sourceCode()

function makeMatrix(rows, cols, value = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => value))
}

function resizeMatrix(matrix, newRows, newCols, defaultValue = 0) {
  const result = []
  for (let i = 0; i < newRows; i += 1) {
    const row = []
    for (let j = 0; j < newCols; j += 1) {
      row.push(matrix?.[i]?.[j] ?? defaultValue)
    }
    result.push(row)
  }
  return result
}

function resizeArray(arr, newLength, defaultValue = 0) {
  return Array.from({ length: newLength }, (_, i) => arr?.[i] ?? defaultValue)
}

function EditableNumberCell({ value, onChange, min = 0, max = 9999, width = 70 }) {
  return (
    <InputNumber
      min={min}
      max={max}
      value={value}
      onChange={(v) => onChange(v ?? 0)}
      style={{ width }}
      controls={false}
    />
  )
}

function MatrixTable({ data, onChange, rowLabel, colLabel, highlightCell }) {
  const cols = data[0]?.length ?? 0
  const columns = [
    {
      title: '',
      dataIndex: 'index',
      key: 'index',
      render: (index) => <Text strong>{rowLabel(index)}</Text>,
      width: 70,
    },
    ...Array.from({ length: cols }, (_, j) => ({
      title: colLabel(j),
      dataIndex: j,
      key: j,
      render: (value, record) => {
        const highlighted = highlightCell?.(record.index, j)
        return (
          <div style={highlighted ? { background: '#fff7e6', padding: 2, borderRadius: 4 } : undefined}>
            <EditableNumberCell
              value={value}
              onChange={(v) => onChange(record.index, j, v)}
            />
          </div>
        )
      },
    })),
  ]

  const tableData = data.map((row, i) => ({ index: i, ...row }))

  return (
    <Table
      dataSource={tableData}
      columns={columns}
      pagination={false}
      size="small"
      rowKey="index"
      bordered
    />
  )
}

function StepsTable({ steps, t }) {
  const columns = [
    { title: '#', dataIndex: 'order', key: 'order', width: 50 },
    { title: t.stepProcess, dataIndex: 'process', key: 'process', render: (p) => `P${p}` },
    {
      title: t.stepNeed,
      dataIndex: 'need',
      key: 'need',
      render: (need) => `[${need.join(', ')}]`,
    },
    {
      title: t.stepWorkBefore,
      dataIndex: 'workBefore',
      key: 'workBefore',
      render: (w) => `[${w.join(', ')}]`,
    },
    {
      title: t.stepWorkAfter,
      dataIndex: 'workAfter',
      key: 'workAfter',
      render: (w) => `[${w.join(', ')}]`,
    },
    {
      title: t.stepReleased,
      dataIndex: 'released',
      key: 'released',
      render: (r) => `[${r.join(', ')}]`,
    },
  ]

  const data = steps.map((s, i) => ({ key: i, order: i + 1, ...s }))

  return <Table dataSource={data} columns={columns} pagination={false} size="small" bordered />
}

export default function BankersAlgorithmSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [processCount, setProcessCount] = useState(5)
  const [resourceCount, setResourceCount] = useState(3)
  const [available, setAvailable] = useState([3, 3, 2])
  const [allocation, setAllocation] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ])
  const [max, setMax] = useState([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ])

  const [safeResult, setSafeResult] = useState(null)
  const [requestProcess, setRequestProcess] = useState(0)
  const [requestAmount, setRequestAmount] = useState([0, 0, 0])
  const [requestResult, setRequestResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const need = useMemo(() => computeNeed(allocation, max), [allocation, max])

  const updateProcessCount = useCallback((n) => {
    const count = Math.max(1, Math.min(12, n))
    setProcessCount(count)
    setAllocation((prev) => resizeMatrix(prev, count, resourceCount))
    setMax((prev) => resizeMatrix(prev, count, resourceCount))
    setSafeResult(null)
    setRequestResult(null)
  }, [resourceCount])

  const updateResourceCount = useCallback((n) => {
    const count = Math.max(1, Math.min(8, n))
    setResourceCount(count)
    setAvailable((prev) => resizeArray(prev, count))
    setAllocation((prev) => resizeMatrix(prev, processCount, count))
    setMax((prev) => resizeMatrix(prev, processCount, count))
    setRequestAmount((prev) => resizeArray(prev, count))
    setSafeResult(null)
    setRequestResult(null)
  }, [processCount])

  const updateAvailable = useCallback((j, value) => {
    setAvailable((prev) => {
      const next = [...prev]
      next[j] = value
      return next
    })
    setSafeResult(null)
    setRequestResult(null)
  }, [])

  const updateAllocation = useCallback((i, j, value) => {
    setAllocation((prev) => {
      const next = prev.map((row) => [...row])
      next[i][j] = value
      return next
    })
    setSafeResult(null)
    setRequestResult(null)
  }, [])

  const updateMax = useCallback((i, j, value) => {
    setMax((prev) => {
      const next = prev.map((row) => [...row])
      next[i][j] = value
      return next
    })
    setSafeResult(null)
    setRequestResult(null)
  }, [])

  const handleCheck = useCallback(() => {
    setSafeResult(checkSafeState(available, allocation, max))
    setRequestResult(null)
  }, [available, allocation, max])

  const handleRequest = useCallback(() => {
    setRequestResult(requestResources(available, allocation, max, requestProcess, requestAmount))
    setSafeResult(null)
  }, [available, allocation, max, requestProcess, requestAmount])

  const handlePreset = useCallback((preset) => {
    const newAvailable = preset.available.map((v) => Number(v) || 0)
    const newAllocation = preset.allocation.map((row) => row.map((v) => Number(v) || 0))
    const newMax = preset.max.map((row) => row.map((v) => Number(v) || 0))

    setResourceCount(newAvailable.length)
    setProcessCount(newAllocation.length)
    setAvailable(newAvailable)
    setAllocation(newAllocation)
    setMax(newMax)

    if (preset.requestProcess !== undefined && preset.request) {
      setRequestProcess(preset.requestProcess)
      setRequestAmount(preset.request.map((v) => Number(v) || 0))
      setRequestResult(null)
    } else {
      setRequestAmount(Array.from({ length: newAvailable.length }, () => 0))
      setRequestResult(null)
    }

    setSafeResult(null)
  }, [])

  const handleReset = useCallback(() => {
    setProcessCount(5)
    setResourceCount(3)
    setAvailable([0, 0, 0])
    setAllocation(makeMatrix(5, 3))
    setMax(makeMatrix(5, 3))
    setRequestProcess(0)
    setRequestAmount([0, 0, 0])
    setSafeResult(null)
    setRequestResult(null)
  }, [])

  const handleCopySource = useCallback(() => {
    navigator.clipboard.writeText(SOURCE_CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  const allocatedTotals = useMemo(() => {
    const totals = Array.from({ length: resourceCount }, () => 0)
    allocation.forEach((row) => {
      row.forEach((v, j) => {
        totals[j] += Number(v) || 0
      })
    })
    return totals
  }, [allocation, resourceCount])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          {t.title}
        </Title>
        <Paragraph type="secondary">{t.intro}</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t.dimensionsTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.processCountLabel}</Text>
                    <InputNumber
                      min={1}
                      max={12}
                      value={processCount}
                      onChange={(v) => updateProcessCount(v)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col xs={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{t.resourceCountLabel}</Text>
                    <InputNumber
                      min={1}
                      max={8}
                      value={resourceCount}
                      onChange={(v) => updateResourceCount(v)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t.presetsTitle}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {presets.map((preset) => (
                <Button key={preset.key} block onClick={() => handlePreset(preset)}>
                  {preset.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t.availableTitle}>
        <Space wrap>
          {available.map((value, j) => (
            <Space key={j} direction="vertical" size="small">
              <Text strong>
                {t.unitResource}
                {j}
              </Text>
              <EditableNumberCell value={value} onChange={(v) => updateAvailable(j, v)} />
            </Space>
          ))}
        </Space>
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">
            {t.total}: [{allocatedTotals.map((v) => `${v} alocado`).join(', ')}] | {' '}
            [{available.map((v, j) => `${v} disponível`).join(', ')}]
          </Text>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.allocationTitle}>
            <MatrixTable
              data={allocation}
              onChange={updateAllocation}
              rowLabel={(i) => `${t.unitProcess}${i}`}
              colLabel={(j) => `${t.unitResource}${j}`}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t.maxTitle}>
            <MatrixTable
              data={max}
              onChange={updateMax}
              rowLabel={(i) => `${t.unitProcess}${i}`}
              colLabel={(j) => `${t.unitResource}${j}`}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t.needTitle}>
        <MatrixTable
          data={need}
          onChange={() => {}}
          rowLabel={(i) => `${t.unitProcess}${i}`}
          colLabel={(j) => `${t.unitResource}${j}`}
        />
      </Card>

      <Space>
        <Button type="primary" icon={<SafetyOutlined />} onClick={handleCheck}>
          {t.checkButton}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          {t.resetButton}
        </Button>
      </Space>

      {safeResult && (
        <Card title={t.resultTitle}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {safeResult.safe ? (
              <Alert
                type="success"
                showIcon
                message={
                  <Space>
                    <Text strong>{t.safe}</Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Text>
                      {t.safeSequence}:{' '}
                      {safeResult.sequence.map((p, idx) => (
                        <span key={p}>
                          <Tag color="green">P{p}</Tag>
                          {idx < safeResult.sequence.length - 1 && (
                            <Text type="secondary" style={{ margin: '0 4px' }}>→</Text>
                          )}
                        </span>
                      ))}
                    </Text>
                  </Space>
                }
              />
            ) : (
              <Alert
                type="error"
                showIcon
                message={
                  <Space>
                    <WarningOutlined />
                    <Text strong>{t.unsafe}</Text>
                  </Space>
                }
                description={safeResult.error}
              />
            )}

            {safeResult.steps && safeResult.steps.length > 0 && (
              <>
                <Text strong>{t.stepsTitle}</Text>
                <StepsTable steps={safeResult.steps} t={t} />
              </>
            )}
          </Space>
        </Card>
      )}

      <Card title={t.requestTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>{t.requestProcessLabel}</Text>
                <Select
                  value={requestProcess}
                  onChange={setRequestProcess}
                  style={{ width: '100%' }}
                >
                  {Array.from({ length: processCount }, (_, i) => (
                    <Option key={i} value={i}>
                      {t.unitProcess}
                      {i}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>{t.requestAmountLabel}</Text>
                <Space wrap>
                  {requestAmount.map((value, j) => (
                    <Space key={j} direction="vertical" size="small">
                      <Text strong>
                        {t.unitResource}
                        {j}
                      </Text>
                      <EditableNumberCell
                        value={value}
                        onChange={(v) => {
                          setRequestAmount((prev) => {
                            const next = [...prev]
                            next[j] = v
                            return next
                          })
                          setRequestResult(null)
                        }}
                      />
                    </Space>
                  ))}
                </Space>
              </Space>
            </Col>
          </Row>

          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleRequest}>
            {t.requestButton}
          </Button>

          {requestResult && (
            <Alert
              type={requestResult.granted ? 'success' : 'warning'}
              showIcon
              message={
                <Text strong>
                  {requestResult.granted ? t.requestGranted : t.requestDenied}
                </Text>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text>
                    {t.requestReason}: {requestResult.reason}
                  </Text>
                  {requestResult.granted && (
                    <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                      <Col xs={24} md={8}>
                        <Statistic
                          title={t.newAvailable}
                          value={`[${requestResult.newAvailable.join(', ')}]`}
                        />
                      </Col>
                      <Col xs={24} md={8}>
                        <Statistic
                          title={t.newNeed}
                          value={`[${requestResult.newNeed[requestProcess].join(', ')}]`}
                        />
                      </Col>
                      <Col xs={24} md={8}>
                        <Statistic
                          title={t.safeSequence}
                          value={`[${requestResult.safeSequence.join(' → ')}]`}
                        />
                      </Col>
                    </Row>
                  )}
                </Space>
              }
            />
          )}
        </Space>
      </Card>

      <Alert message={t.howItWorksTitle} description={t.howItWorksText} type="info" showIcon />

      <Collapse>
        <Panel
          header={t.sourceTitle}
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCopySource()
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <Paragraph type="secondary">{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f6f6', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{SOURCE_CODE}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
