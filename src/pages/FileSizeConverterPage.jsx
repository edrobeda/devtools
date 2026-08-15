import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Select,
  Space,
  Button,
  Table,
  Tag,
  Alert,
  Collapse,
  message,
  Row,
  Col,
} from 'antd'
import { SwapOutlined, CopyOutlined, CalculatorOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  UNITS,
  convertToAll,
  formatFileSize,
  humanizeBytes,
  PRESETS,
  toBytes,
} from '../utils/fileSizeConverter'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const sourceCode = `import {
  UNITS,
  toBytes,
  fromBytes,
  convertFileSize,
  convertToAll,
  formatFileSize,
  humanizeBytes,
} from '../utils/fileSizeConverter'

// Exemplo: converter 2 GiB para MB
const mb = convertFileSize(2, 'GiB', 'MB') // ~2147.48 MB

// Converter para todas as unidades
const all = convertToAll(1.5, 'GB') // array com valores em bits, bytes, KB...

// Formatar com casas decimais dinâmicas
formatFileSize(1536.1234) // "1536.1234"

// Humanizar: escolhe a unidade mais legível
humanizeBytes(1073741824) // { value: 1, unit: 'GiB' }
`

const translations = {
  pt: {
    title: 'Conversor de Tamanho de Arquivo',
    intro: (
      <>
        Converta entre bits, bytes e prefixos decimais (KB, MB, GB — base 1000) e
        binários (KiB, MiB, GiB — base 1024). Útil para comparar tamanhos de
        payload, logs, discos e arquivos de forma precisa.
      </>
    ),
    valueLabel: 'Valor',
    unitLabel: 'Unidade',
    copy: 'Copiar',
    copied: 'Copiado',
    allConversions: 'Conversões para todas as unidades',
    unitColumn: 'Unidade',
    valueColumn: 'Valor',
    nameColumn: 'Nome',
    baseColumn: 'Base',
    humanized: 'Tamanho "humanizado"',
    inBytes: 'Em bytes',
    explanationTitle: 'Qual a diferença entre GB e GiB?',
    explanation: (
      <>
        <Text strong>GB (gigabyte)</Text> usa base decimal: 1 GB = 1.000 MB = 1.000.000.000 bytes.
        Fabricantes de discos rígidos e SSDs usam essa convenção.
        <br /><br />
        <Text strong>GiB (gibibyte)</Text> usa base binária: 1 GiB = 1.024 MiB = 1.073.741.824 bytes.
        Sistemas operacionais geralmente relatam tamanhos em GiB, mesmo que exibam "GB" na interface.
        <br /><br />
        Por isso um disco de <Text code>500 GB</Text> aparece como aproximadamente <Text code>465 GiB</Text> no sistema.
      </>
    ),
    sourceCode: 'Código-fonte do motor',
    presets: 'Presets rápidos',
    decimal: 'Decimal (1000)',
    binary: 'Binário (1024)',
    bit: 'bit/byte',
  },
  en: {
    title: 'File Size Converter',
    intro: (
      <>
        Convert between bits, bytes, decimal prefixes (KB, MB, GB — base 1000)
        and binary prefixes (KiB, MiB, GiB — base 1024). Useful for accurately
        comparing payload, log, disk and file sizes.
      </>
    ),
    valueLabel: 'Value',
    unitLabel: 'Unit',
    copy: 'Copy',
    copied: 'Copied',
    allConversions: 'Conversions to all units',
    unitColumn: 'Unit',
    valueColumn: 'Value',
    nameColumn: 'Name',
    baseColumn: 'Base',
    humanized: 'Human-readable size',
    inBytes: 'In bytes',
    explanationTitle: 'What is the difference between GB and GiB?',
    explanation: (
      <>
        <Text strong>GB (gigabyte)</Text> uses the decimal base: 1 GB = 1,000 MB = 1,000,000,000 bytes.
        Hard drive and SSD manufacturers use this convention.
        <br /><br />
        <Text strong>GiB (gibibyte)</Text> uses the binary base: 1 GiB = 1,024 MiB = 1,073,741,824 bytes.
        Operating systems usually report sizes in GiB, even if the UI shows "GB".
        <br /><br />
        That is why a <Text code>500 GB</Text> disk appears as approximately <Text code>465 GiB</Text> in the system.
      </>
    ),
    sourceCode: 'Engine source code',
    presets: 'Quick presets',
    decimal: 'Decimal (1000)',
    binary: 'Binary (1024)',
    bit: 'bit/byte',
  },
}

function baseLabel(unit, t) {
  if (unit.base === 'decimal') return t.decimal
  if (unit.base === 'binary') return t.binary
  return t.bit
}

export default function FileSizeConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [value, setValue] = useState(1)
  const [unit, setUnit] = useState('GB')

  const all = useMemo(() => convertToAll(value || 0, unit), [value, unit])
  const bytes = useMemo(() => toBytes(value || 0, unit), [value, unit])
  const human = useMemo(() => humanizeBytes(bytes), [bytes])

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const columns = [
    {
      title: t.unitColumn,
      dataIndex: 'key',
      key: 'key',
      render: (key) => <Text code>{key}</Text>,
    },
    {
      title: t.nameColumn,
      dataIndex: 'unit',
      key: 'name',
      render: (u) => u.namePlural,
    },
    {
      title: t.baseColumn,
      dataIndex: 'unit',
      key: 'base',
      render: (u) => <Tag>{baseLabel(u, t)}</Tag>,
    },
    {
      title: t.valueColumn,
      dataIndex: 'value',
      key: 'value',
      render: (v, record) => (
        <Space>
          <Text strong style={{ fontFamily: 'monospace' }}>
            {formatFileSize(v)}
          </Text>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copy(`${formatFileSize(v)} ${record.key}`)}
          >
            {t.copy}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CalculatorOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.valueLabel}</Text>
              <InputNumber
                min={0}
                step={0.01}
                value={value}
                onChange={(v) => setValue(v ?? 0)}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.unitLabel}</Text>
              <Select value={unit} onChange={setUnit} style={{ width: '100%' }}>
                {UNITS.map((u) => (
                  <Option key={u.key} value={u.key}>
                    {u.key} ({u.namePlural})
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.humanized}</Text>
              <Text style={{ fontSize: 24, fontFamily: 'monospace' }}>
                {formatFileSize(human.value)} {human.unit}
              </Text>
              <Text type="secondary" style={{ fontFamily: 'monospace' }}>
                {formatFileSize(bytes)} B
              </Text>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Text strong>{t.presets}: </Text>
          <Space size={[8, 8]} wrap>
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                size="small"
                onClick={() => { setValue(p.value); setUnit(p.unit) }}
              >
                {p.label}
              </Button>
            ))}
          </Space>
        </div>
      </Card>

      <Card title={t.allConversions}>
        <Table
          dataSource={all}
          columns={columns}
          rowKey="key"
          pagination={false}
          size="small"
        />
      </Card>

      <Alert
        type="info"
        showIcon
        message={t.explanationTitle}
        description={t.explanation}
      />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
