import React, { useState } from 'react'
import { Typography, Card, Space, Button, InputNumber, Checkbox, Select, Input, message, List } from 'antd'
import { IdcardOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

function generateUuids(quantity, { uppercase, noDashes }) {
  return Array.from({ length: quantity }, () => {
    let id = crypto.randomUUID()
    if (noDashes) id = id.replace(/-/g, '')
    if (uppercase) id = id.toUpperCase()
    return id
  })
}

function formatOutput(uuids, format) {
  if (format === 'array') return `[\n${uuids.map((id) => `  "${id}"`).join(',\n')}\n]`
  if (format === 'csv') return uuids.join(', ')
  return uuids.join('\n')
}

const translations = {
  pt: {
    title: 'Gerador de UUID',
    intro: (
      <>
        Gera UUIDs v4 aleatórios via <Text code>crypto.randomUUID()</Text>,
        a API nativa do navegador — sem dependências, sem dados saindo daqui.
      </>
    ),
    quantity: 'Quantidade',
    options: 'Opções',
    uppercase: 'Maiúsculas',
    noDashes: 'Sem hífens',
    format: 'Formato de saída',
    formatLines: 'Uma por linha',
    formatArray: 'Array JS/JSON',
    formatCsv: 'Separado por vírgula',
    generate: 'Gerar',
    copyAll: 'Copiar tudo',
    copySingle: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'UUID Generator',
    intro: (
      <>
        Generates random v4 UUIDs via <Text code>crypto.randomUUID()</Text>,
        the browser's native API — no dependencies, no data leaving here.
      </>
    ),
    quantity: 'Quantity',
    options: 'Options',
    uppercase: 'Uppercase',
    noDashes: 'No dashes',
    format: 'Output format',
    formatLines: 'One per line',
    formatArray: 'JS/JSON array',
    formatCsv: 'Comma-separated',
    generate: 'Generate',
    copyAll: 'Copy all',
    copySingle: 'Copy',
    copied: 'Copied',
  },
}

export default function UuidGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [quantity, setQuantity] = useState(5)
  const [uppercase, setUppercase] = useState(false)
  const [noDashes, setNoDashes] = useState(false)
  const [format, setFormat] = useState('lines')
  const [uuids, setUuids] = useState(() => generateUuids(5, { uppercase: false, noDashes: false }))

  function handleGenerate() {
    setUuids(generateUuids(quantity, { uppercase, noDashes }))
  }

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.quantity}</Text>
              <InputNumber min={1} max={200} value={quantity} onChange={setQuantity} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.format}</Text>
              <Select
                value={format}
                onChange={setFormat}
                style={{ width: 200 }}
                options={[
                  { value: 'lines', label: t.formatLines },
                  { value: 'array', label: t.formatArray },
                  { value: 'csv', label: t.formatCsv },
                ]}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.options}</Text>
              <Space>
                <Checkbox checked={uppercase} onChange={(e) => setUppercase(e.target.checked)}>{t.uppercase}</Checkbox>
                <Checkbox checked={noDashes} onChange={(e) => setNoDashes(e.target.checked)}>{t.noDashes}</Checkbox>
              </Space>
            </Space>
          </Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>{t.generate}</Button>
        </Space>
      </Card>

      <Card
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(formatOutput(uuids, format))}>{t.copyAll}</Button>}
      >
        {format === 'lines' ? (
          <List
            size="small"
            dataSource={uuids}
            renderItem={(id) => (
              <List.Item
                actions={[
                  <Button key="c" size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(id)} />,
                ]}
              >
                <Text code>{id}</Text>
              </List.Item>
            )}
          />
        ) : (
          <TextArea rows={Math.min(uuids.length + 2, 16)} readOnly value={formatOutput(uuids, format)} style={{ fontFamily: 'monospace' }} />
        )}
      </Card>
    </Space>
  )
}
