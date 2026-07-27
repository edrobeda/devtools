import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Select, Button, InputNumber, Table, message, Segmented } from 'antd'
import { FolderOutlined, CopyOutlined, PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Felipe', 'Gabriela', 'Hugo', 'Isabela', 'João', 'Karen', 'Lucas', 'Mariana', 'Nathan', 'Olivia', 'Pedro', 'Rafaela', 'Sofia', 'Thiago', 'Valentina']
const LAST_NAMES = ['Silva', 'Souza', 'Costa', 'Pereira', 'Oliveira', 'Santos', 'Almeida', 'Ferreira', 'Rodrigues', 'Carvalho', 'Gomes', 'Martins', 'Araujo', 'Barbosa', 'Ribeiro']
const CITIES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Lisboa', 'Berlin', 'Toronto', 'Austin', 'Tokyo']
const COUNTRIES = ['Brasil', 'Portugal', 'Alemanha', 'Canadá', 'Estados Unidos', 'Japão', 'Espanha', 'Argentina']
const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'labore', 'magna', 'aliqua']
const DOMAINS = ['example.com', 'mail.com', 'test.dev', 'devtools.local']

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDateISO() {
  const start = new Date(2015, 0, 1).getTime()
  const end = Date.now()
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10)
}

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')
}

const GENERATORS = {
  uuid: () => crypto.randomUUID(),
  fullName: () => `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
  firstName: () => randomItem(FIRST_NAMES),
  lastName: () => randomItem(LAST_NAMES),
  email: () => `${slugify(randomItem(FIRST_NAMES) + '.' + randomItem(LAST_NAMES))}${randomInt(1, 99)}@${randomItem(DOMAINS)}`,
  boolean: () => Math.random() < 0.5,
  integer: () => randomInt(0, 1000),
  float: () => Number((Math.random() * 1000).toFixed(2)),
  date: () => randomDateISO(),
  phone: () => `+55 ${randomInt(11, 99)} 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
  city: () => randomItem(CITIES),
  country: () => randomItem(COUNTRIES),
  word: () => randomItem(WORDS),
  sentence: () => {
    const len = randomInt(5, 10)
    const words = Array.from({ length: len }, () => randomItem(WORDS))
    const sentence = words.join(' ')
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
  },
  hexColor: () => `#${randomInt(0, 0xffffff).toString(16).padStart(6, '0')}`,
}

const TYPE_OPTIONS = Object.keys(GENERATORS)

function toCsv(rows, fields) {
  const header = fields.map((f) => f.name).join(',')
  const lines = rows.map((row) =>
    fields.map((f) => {
      const value = String(row[f.name])
      return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
    }).join(',')
  )
  return [header, ...lines].join('\n')
}

const translations = {
  pt: {
    title: 'Gerador de Dados Fake',
    intro: (
      <>
        Gera uma lista de objetos fake pra testar formulários, seeds locais
        ou mocks de API — sem sair do navegador, tudo via{' '}
        <Text code>Math.random</Text>/<Text code>crypto.randomUUID</Text>.
        Configure os campos e o tipo de cada um, escolha a quantidade e o
        formato de saída.
      </>
    ),
    fields: 'Campos',
    fieldName: 'Nome do campo',
    fieldType: 'Tipo',
    addField: 'Adicionar campo',
    count: 'Quantidade',
    format: 'Formato',
    generate: 'Gerar',
    result: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'Fake Data Generator',
    intro: (
      <>
        Generates a list of fake objects to test forms, local seeds, or API
        mocks — all in the browser, via <Text code>Math.random</Text>/
        <Text code>crypto.randomUUID</Text>. Configure the fields and each
        one's type, pick the count and output format.
      </>
    ),
    fields: 'Fields',
    fieldName: 'Field name',
    fieldType: 'Type',
    addField: 'Add field',
    count: 'Count',
    format: 'Format',
    generate: 'Generate',
    result: 'Result',
    copy: 'Copy',
    copied: 'Copied',
  },
}

export default function FakeDataGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [fields, setFields] = useState([
    { name: 'id', type: 'uuid' },
    { name: 'name', type: 'fullName' },
    { name: 'email', type: 'email' },
    { name: 'active', type: 'boolean' },
  ])
  const [count, setCount] = useState(10)
  const [format, setFormat] = useState('json')
  const [rows, setRows] = useState([])

  function updateField(index, patch) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  function addField() {
    setFields((prev) => [...prev, { name: `field${prev.length + 1}`, type: 'word' }])
  }

  function removeField(index) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function generate() {
    const validFields = fields.filter((f) => f.name.trim())
    const data = Array.from({ length: count }, () => {
      const obj = {}
      validFields.forEach((f) => {
        obj[f.name] = GENERATORS[f.type] ? GENERATORS[f.type]() : ''
      })
      return obj
    })
    setRows(data)
  }

  const output = useMemo(() => {
    if (!rows.length) return ''
    const validFields = fields.filter((f) => f.name.trim())
    return format === 'json' ? JSON.stringify(rows, null, 2) : toCsv(rows, validFields)
  }, [rows, format, fields])

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const columns = [
    {
      title: t.fieldName,
      render: (_, __, index) => (
        <Input value={fields[index].name} onChange={(e) => updateField(index, { name: e.target.value })} />
      ),
    },
    {
      title: t.fieldType,
      render: (_, __, index) => (
        <Select
          value={fields[index].type}
          onChange={(value) => updateField(index, { type: value })}
          style={{ width: '100%' }}
          options={TYPE_OPTIONS.map((type) => ({ value: type, label: type }))}
        />
      ),
    },
    {
      title: '',
      width: 48,
      render: (_, __, index) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeField(index)} />
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FolderOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>{t.fields}</Text>
            <Table
              style={{ marginTop: 8 }}
              size="small"
              pagination={false}
              rowKey={(_, index) => index}
              dataSource={fields}
              columns={columns}
            />
            <Button style={{ marginTop: 8 }} icon={<PlusOutlined />} onClick={addField}>{t.addField}</Button>
          </div>

          <Space size="large" wrap align="end">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.count}</Text>
              <InputNumber min={1} max={500} value={count} onChange={setCount} />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.format}</Text>
              <Segmented value={format} onChange={setFormat} options={[{ label: 'JSON', value: 'json' }, { label: 'CSV', value: 'csv' }]} />
            </div>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={generate}>{t.generate}</Button>
          </Space>
        </Space>
      </Card>

      <Card
        title={t.result}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 360 }}>
          <code>{output}</code>
        </pre>
      </Card>
    </Space>
  )
}
