import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Row,
  Col,
  Tabs,
  Alert,
  Collapse,
  Table,
  message,
} from 'antd'
import {
  GlobalOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  RECORD_TYPES,
  fieldsForType,
  defaultValuesForType,
  createRecord,
  buildRecordData,
  generateZoneFile,
  generateDigCommands,
  generateRoute53Terraform,
  generateCloudflareTerraform,
  validateAll,
  PRESETS,
  applyPreset,
  generateMarkdownSummary,
} from '../utils/dnsRecordGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { Panel } = Collapse

const sourceCode = `import {
  createRecord,
  generateZoneFile,
  generateDigCommands,
} from '../utils/dnsRecordGenerator'

const records = [
  createRecord('A', { name: '@', ip: '192.0.2.1', ttl: 300 }),
  createRecord('CNAME', { name: 'www', target: 'example.com.', ttl: 300 }),
]

console.log(generateZoneFile(records, { origin: 'example.com.', defaultTtl: 300 }))
console.log(generateDigCommands(records, { origin: 'example.com.' }))
`

const OUTPUT_TABS = [
  { key: 'zone', label: { pt: 'Zona BIND', en: 'BIND zone' } },
  { key: 'dig', label: { pt: 'Comandos dig', en: 'dig commands' } },
  { key: 'route53', label: { pt: 'Terraform AWS Route53', en: 'Terraform AWS Route53' } },
  { key: 'cloudflare', label: { pt: 'Terraform Cloudflare', en: 'Terraform Cloudflare' } },
  { key: 'markdown', label: { pt: 'Resumo Markdown', en: 'Markdown summary' } },
]

const translations = {
  pt: {
    title: 'Gerador de Registros DNS',
    subtitle: 'Monte registros DNS e exporte para zone file BIND, dig, Terraform AWS/Cloudflare',
    intro: 'Adicione registros A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, PTR, SOA, SPF, DKIM e DMARC para um domínio, visualize a zona BIND pronta e copie comandos dig ou recursos Terraform. Tudo roda no navegador — nenhuma consulta DNS real é feita.',
    configTitle: 'Domínio',
    originLabel: 'Origem ($ORIGIN)',
    originPlaceholder: 'example.com.',
    defaultTtlLabel: 'TTL padrão (segundos)',
    addTitle: 'Adicionar registro',
    typeLabel: 'Tipo',
    addButton: 'Adicionar',
    recordsTitle: 'Registros',
    colType: 'Tipo',
    colName: 'Nome',
    colTtl: 'TTL',
    colData: 'Dados',
    colAction: '',
    remove: 'Remover',
    noRecords: 'Nenhum registro ainda.',
    presets: 'Cenários rápidos',
    outputTitle: 'Saída gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Erro ao copiar',
    copyAll: 'Copiar tudo',
    warnings: 'Avisos',
    sourceTitle: 'Motor de geração',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado sai do navegador.',
    note: 'Use FQDNs (terminados em ponto) para destinos de NS, MX, CNAME e SRV. CNAME no apex e coexistindo com outros registros gera alertas.',
    errorsTitle: 'Erros no registro',
  },
  en: {
    title: 'DNS Record Generator',
    subtitle: 'Build DNS records and export to BIND zone file, dig, Terraform AWS/Cloudflare',
    intro: 'Add A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, PTR, SOA, SPF, DKIM and DMARC records for a domain, preview a ready-to-use BIND zone and copy dig commands or Terraform resources. Everything runs in the browser — no real DNS query is made.',
    configTitle: 'Domain',
    originLabel: 'Origin ($ORIGIN)',
    originPlaceholder: 'example.com.',
    defaultTtlLabel: 'Default TTL (seconds)',
    addTitle: 'Add record',
    typeLabel: 'Type',
    addButton: 'Add',
    recordsTitle: 'Records',
    colType: 'Type',
    colName: 'Name',
    colTtl: 'TTL',
    colData: 'Data',
    colAction: '',
    remove: 'Remove',
    noRecords: 'No records yet.',
    presets: 'Quick scenarios',
    outputTitle: 'Generated output',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Copy failed',
    copyAll: 'Copy all',
    warnings: 'Warnings',
    sourceTitle: 'Generation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no data leaves the browser.',
    note: 'Use FQDNs (ending with a dot) for NS, MX, CNAME and SRV targets. CNAME at apex and coexisting with other records triggers warnings.',
    errorsTitle: 'Record errors',
  },
}

export default function DnsRecordGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [origin, setOrigin] = useState('example.com.')
  const [defaultTtl, setDefaultTtl] = useState(300)
  const [records, setRecords] = useState([])
  const [recordType, setRecordType] = useState('A')
  const [formValues, setFormValues] = useState(() => defaultValuesForType('A'))
  const [activeTab, setActiveTab] = useState('zone')

  const fields = useMemo(() => fieldsForType(recordType), [recordType])

  const handleTypeChange = (value) => {
    setRecordType(value)
    setFormValues(defaultValuesForType(value))
  }

  const handleFieldChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const addRecord = () => {
    const record = createRecord(recordType, { ...formValues })
    setRecords((prev) => [...prev, record])
  }

  const removeRecord = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const applyPresetByKey = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    const applied = applyPreset(preset, origin)
    setOrigin(applied.origin)
    setDefaultTtl(applied.defaultTtl)
    setRecords(applied.records)
  }

  const validationWarnings = useMemo(() => validateAll(records), [records])

  const outputs = useMemo(() => {
    const opts = { origin, defaultTtl }
    return {
      zone: generateZoneFile(records, opts),
      dig: generateDigCommands(records, opts),
      route53: generateRoute53Terraform(records),
      cloudflare: generateCloudflareTerraform(records),
      markdown: generateMarkdownSummary(records, opts, lang),
    }
  }, [records, origin, defaultTtl, lang])

  const allOutputsText = useMemo(
    () =>
      OUTPUT_TABS.map((tab) => `=== ${tab.label[lang]} ===\n${outputs[tab.key]}`).join('\n\n'),
    [outputs, lang]
  )

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const recordColumns = [
    { title: t.colType, dataIndex: 'type', width: 70 },
    { title: t.colName, dataIndex: 'name', render: (v) => <Text style={{ wordBreak: 'break-all' }}>{v}</Text> },
    { title: t.colTtl, dataIndex: 'ttl', width: 80 },
    { title: t.colData, dataIndex: 'data', render: (v) => <Text style={{ wordBreak: 'break-all' }}>{v}</Text> },
    {
      title: t.colAction,
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRecord(record.id)}>
          {t.remove}
        </Button>
      ),
    },
  ]

  const recordRows = useMemo(
    () =>
      records.map((r) => ({
        key: r.id,
        id: r.id,
        type: r.type,
        name: r.type === 'PTR' ? r.values.ptrName : r.values.name || '@',
        ttl: Number(r.values.ttl) || defaultTtl,
        data: buildRecordData(r),
      })),
    [records, defaultTtl]
  )

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {messageContextHolder}
      <Title level={2}>
        <GlobalOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.configTitle}>
              <Form layout="vertical" size="small">
                <Form.Item label={t.originLabel}>
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder={t.originPlaceholder}
                  />
                </Form.Item>
                <Form.Item label={t.defaultTtlLabel}>
                  <InputNumber
                    min={0}
                    step={60}
                    value={defaultTtl}
                    onChange={(v) => setDefaultTtl(v ?? 0)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            </Card>

            <Card title={t.addTitle}>
              <Form layout="vertical" size="small">
                <Form.Item label={t.typeLabel}>
                  <Select value={recordType} onChange={handleTypeChange} style={{ width: '100%' }}>
                    {RECORD_TYPES.map((type) => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {fields.map((field) => (
                  <Form.Item key={field.key} label={field.label[lang]}>
                    {field.type === 'textarea' ? (
                      <TextArea
                        rows={3}
                        value={formValues[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder && field.placeholder[lang] ? field.placeholder[lang] : field.placeholder}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={formValues[field.key]}
                        onChange={(v) => handleFieldChange(field.key, v)}
                        style={{ width: '100%' }}
                      >
                        {field.options.map((opt) => (
                          <Option key={opt} value={opt}>
                            {opt}
                          </Option>
                        ))}
                      </Select>
                    ) : field.type === 'number' ? (
                      <InputNumber
                        min={field.min}
                        max={field.max}
                        value={formValues[field.key]}
                        onChange={(v) => handleFieldChange(field.key, v ?? 0)}
                        style={{ width: '100%' }}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input
                        value={formValues[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder && field.placeholder[lang] ? field.placeholder[lang] : field.placeholder}
                      />
                    )}
                  </Form.Item>
                ))}

                <Button icon={<PlusOutlined />} type="primary" onClick={addRecord} block>
                  {t.addButton}
                </Button>
              </Form>
            </Card>

            <Card title={t.presets}>
              <Space wrap>
                {Object.entries(PRESETS).map(([key, p]) => (
                  <Button key={key} size="small" icon={<ThunderboltOutlined />} onClick={() => applyPresetByKey(key)}>
                    {p.label[lang]}
                  </Button>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={14}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.recordsTitle}>
              {records.length === 0 ? (
                <Text type="secondary">{t.noRecords}</Text>
              ) : (
                <Table
                  dataSource={recordRows}
                  columns={recordColumns}
                  pagination={false}
                  size="small"
                  bordered
                />
              )}
            </Card>

            {validationWarnings.length > 0 && (
              <Alert
                type="warning"
                showIcon
                icon={<InfoCircleOutlined />}
                message={t.warnings}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {validationWarnings.map((w, i) => (
                      <li key={i}>{w[lang]}</li>
                    ))}
                  </ul>
                }
              />
            )}

            <Card
              title={t.outputTitle}
              extra={
                <Button icon={<CopyOutlined />} size="small" onClick={() => copyToClipboard(allOutputsText)}>
                  {t.copyAll}
                </Button>
              }
            >
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={OUTPUT_TABS.map((tab) => ({
                  key: tab.key,
                  label: tab.label[lang],
                  children: (
                    <div>
                      <pre
                        style={{
                          background: '#f6ffed',
                          padding: 16,
                          borderRadius: 8,
                          overflow: 'auto',
                          minHeight: 120,
                          fontSize: 13,
                        }}
                      >
                        <code>{outputs[tab.key]}</code>
                      </pre>
                      <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(outputs[tab.key])}>
                        {t.copy}
                      </Button>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Space>
        </Col>
      </Row>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.note} style={{ marginTop: 16 }} />

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
