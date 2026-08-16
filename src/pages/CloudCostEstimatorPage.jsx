import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Select,
  InputNumber,
  Row,
  Col,
  Statistic,
  Collapse,
  Alert,
  Table,
  Tag,
  Divider,
} from 'antd'
import {
  CloudOutlined,
  PlusOutlined,
  DeleteOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CATALOG,
  HOURS_PER_MONTH,
  createResource,
  estimateCost,
  formatUsd,
  getPresets,
  providerLabels,
  serviceLabels,
} from '../utils/cloudCostEstimator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  CATALOG,
  createResource,
  estimateCost,
  formatUsd,
} from '../utils/cloudCostEstimator'

// Cria uma linha de recurso padrão
const vm = createResource('aws', 'compute')
// { provider: 'aws', service: 'compute', quantity: 1, hours: 730, gb: 0 }

// Estima o custo mensal de uma lista de recursos
const { total, lines, byProvider, byService } = estimateCost([
  { ...vm, quantity: 2, hours: 730 },
  { provider: 'aws', service: 'storage', quantity: 1, gb: 100 },
])

formatUsd(total) // "$XXX.XX"
`

const translations = {
  pt: {
    title: 'Estimador de Custo de Nuvem',
    subtitle: 'AWS · GCP · Azure — ordem de grandeza em USD/mês',
    intro: 'Monte uma lista de recursos e estime o custo mensal de infraestrutura na nuvem. Os preços são valores representativos embutidos na página para comparação rápida; sempre confira a tabela oficial do provedor antes de fechar um orçamento real.',
    addResource: 'Adicionar recurso',
    provider: 'Provedor',
    service: 'Serviço',
    quantity: 'Quantidade',
    hours: 'Horas/mês',
    gb: 'GB/mês',
    noResources: 'Nenhum recurso adicionado. Use o botão acima ou um exemplo rápido.',
    presets: 'Exemplos de um clique',
    summary: 'Resumo',
    totalMonthly: 'Total estimado / mês',
    byProvider: 'Por provedor',
    byService: 'Por serviço',
    detail: 'Cálculo',
    cost: 'Custo',
    disclaimer: 'Estimativa aproximada com preços cacheados na página. Não inclui impostos, descontos por reserva, spot/preemptible, egress entre regiões, licenças de SO nem alterações recentes na tabela dos provedores.',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    remove: 'Remover',
    aws: 'AWS',
    gcp: 'GCP',
    azure: 'Azure',
  },
  en: {
    title: 'Cloud Cost Estimator',
    subtitle: 'AWS · GCP · Azure — order-of-magnitude USD/month',
    intro: 'Build a resource list and estimate monthly cloud infrastructure cost. Prices are representative values embedded in the page for quick comparison; always check the official provider pricing before committing to a real budget.',
    addResource: 'Add resource',
    provider: 'Provider',
    service: 'Service',
    quantity: 'Quantity',
    hours: 'Hours/month',
    gb: 'GB/month',
    noResources: 'No resources added. Use the button above or a quick example.',
    presets: 'One-click examples',
    summary: 'Summary',
    totalMonthly: 'Estimated total / month',
    byProvider: 'By provider',
    byService: 'By service',
    detail: 'Calculation',
    cost: 'Cost',
    disclaimer: 'Rough estimate using prices cached on this page. Does not include taxes, reserved-instance discounts, spot/preemptible pricing, cross-region egress, OS licenses, or recent provider pricing changes.',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    remove: 'Remove',
    aws: 'AWS',
    gcp: 'GCP',
    azure: 'Azure',
  },
}

const providerOptions = ['aws', 'gcp', 'azure']
const serviceOptions = ['compute', 'storage', 'database', 'bandwidth', 'loadBalancer', 'staticIp']

export default function CloudCostEstimatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [resources, setResources] = useState(() => [
    createResource('aws', 'compute'),
    createResource('aws', 'storage'),
  ])

  const providerNames = useMemo(() => providerLabels(lang), [lang])
  const serviceNames = useMemo(() => serviceLabels(lang), [lang])
  const presets = useMemo(() => getPresets(lang), [lang])

  const estimate = useMemo(() => estimateCost(resources), [resources])

  const handleAdd = useCallback(() => {
    setResources((prev) => [...prev, createResource('aws', 'compute')])
  }, [])

  const handleRemove = useCallback((id) => {
    setResources((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleChange = useCallback((id, field, value) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r

        if (field === 'provider') {
          // Mantém o mesmo serviço se existir no novo provedor; senão, cai em compute.
          const nextService = CATALOG[value][r.service] ? r.service : 'compute'
          const spec = CATALOG[value][nextService]
          return {
            id: r.id,
            provider: value,
            service: nextService,
            quantity: r.quantity,
            hours: spec.needsHours ? r.hours : 0,
            gb: spec.needsGb ? r.gb : 0,
          }
        }

        if (field === 'service') {
          const spec = CATALOG[r.provider][value]
          return {
            id: r.id,
            provider: r.provider,
            service: value,
            quantity: r.quantity,
            hours: spec.needsHours ? spec.defaultHours : 0,
            gb: spec.needsGb ? spec.defaultGb : 0,
          }
        }

        return { ...r, [field]: value }
      })
    )
  }, [])

  const applyPreset = useCallback((preset) => {
    setResources(preset.resources.map((r) => ({ ...r, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })))
  }, [])

  const columns = useMemo(
    () => [
      {
        title: t.provider,
        dataIndex: 'provider',
        key: 'provider',
        render: (value, record) => (
          <Select
            value={value}
            onChange={(v) => handleChange(record.id, 'provider', v)}
            style={{ minWidth: 140 }}
            options={providerOptions.map((p) => ({ value: p, label: providerNames[p] }))}
          />
        ),
      },
      {
        title: t.service,
        dataIndex: 'service',
        key: 'service',
        render: (value, record) => (
          <Select
            value={value}
            onChange={(v) => handleChange(record.id, 'service', v)}
            style={{ minWidth: 220 }}
            options={serviceOptions.map((s) => ({ value: s, label: serviceNames[s] }))}
          />
        ),
      },
      {
        title: t.quantity,
        dataIndex: 'quantity',
        key: 'quantity',
        render: (value, record) => (
          <InputNumber
            min={0}
            value={value}
            onChange={(v) => handleChange(record.id, 'quantity', v)}
            style={{ width: 80 }}
          />
        ),
      },
      {
        title: t.hours,
        dataIndex: 'hours',
        key: 'hours',
        render: (value, record) => {
          const spec = CATALOG[record.provider][record.service]
          return spec.needsHours ? (
            <InputNumber
              min={0}
              max={HOURS_PER_MONTH}
              value={value}
              onChange={(v) => handleChange(record.id, 'hours', v)}
              style={{ width: 100 }}
            />
          ) : (
            <Text type="secondary">—</Text>
          )
        },
      },
      {
        title: t.gb,
        dataIndex: 'gb',
        key: 'gb',
        render: (value, record) => {
          const spec = CATALOG[record.provider][record.service]
          return spec.needsGb ? (
            <InputNumber
              min={0}
              value={value}
              onChange={(v) => handleChange(record.id, 'gb', v)}
              style={{ width: 120 }}
            />
          ) : (
            <Text type="secondary">—</Text>
          )
        },
      },
      {
        title: t.detail,
        dataIndex: 'id',
        key: 'detail',
        render: (id) => {
          const line = estimate.lines.find((l) => l.id === id)
          return <Text type="secondary" style={{ fontSize: 12 }}>{line?.detail}</Text>
        },
      },
      {
        title: t.cost,
        dataIndex: 'id',
        key: 'cost',
        align: 'right',
        render: (id) => {
          const line = estimate.lines.find((l) => l.id === id)
          return <Text strong>{formatUsd(line?.monthly || 0)}</Text>
        },
      },
      {
        title: '',
        key: 'actions',
        align: 'center',
        render: (_, record) => (
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleRemove(record.id)}
            aria-label={t.remove}
          />
        ),
      },
    ],
    [t, providerNames, serviceNames, estimate.lines, handleChange, handleRemove]
  )

  const providerSummary = useMemo(
    () =>
      providerOptions
        .map((p) => ({ provider: p, cost: estimate.byProvider[p] || 0 }))
        .filter((item) => item.cost > 0),
    [estimate.byProvider]
  )

  const serviceSummary = useMemo(
    () =>
      serviceOptions
        .map((s) => ({ service: s, cost: estimate.byService[s] || 0 }))
        .filter((item) => item.cost > 0),
    [estimate.byService]
  )

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <CloudOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text strong>{t.presets}</Text>
          <Space wrap>
            {presets.map((preset) => (
              <Button key={preset.key} size="small" onClick={() => applyPreset(preset)}>
                {preset.label}
              </Button>
            ))}
          </Space>
        </Space>
      </Card>

      <Card
        title={(
          <Space>
            <DollarOutlined />
            <span>{lang === 'pt' ? 'Recursos' : 'Resources'}</span>
          </Space>
        )}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t.addResource}
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {resources.length === 0 ? (
          <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.noResources} />
        ) : (
          <Table
            dataSource={resources}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
          />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title={t.totalMonthly}
              value={estimate.total}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={t.byProvider} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {providerSummary.length === 0 ? (
                <Text type="secondary">—</Text>
              ) : (
                providerSummary.map((item) => (
                  <div key={item.provider} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Tag color="blue">{providerNames[item.provider]}</Tag>
                    <Text strong>{formatUsd(item.cost)}</Text>
                  </div>
                ))
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={t.byService} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {serviceSummary.length === 0 ? (
                <Text type="secondary">—</Text>
              ) : (
                serviceSummary.map((item) => (
                  <div key={item.service} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>{serviceNames[item.service]}</Text>
                    <Text strong>{formatUsd(item.cost)}</Text>
                  </div>
                ))
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Alert type="warning" showIcon icon={<InfoCircleOutlined />} message={t.disclaimer} style={{ marginBottom: 24 }} />

      <Collapse>
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
