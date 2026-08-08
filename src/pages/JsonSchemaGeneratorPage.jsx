import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Switch } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const ENUM_MAX = 5

const SAMPLES = [
  {
    key: 'pessoa',
    label: { pt: 'Pessoa', en: 'Person' },
    value: JSON.stringify(
      {
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        active: true,
        tags: ['admin', 'beta'],
        meta: { created: '2024-01-01', visits: 3 },
      },
      null,
      2
    ),
  },
  {
    key: 'produtos',
    label: { pt: 'Lista de produtos', en: 'Product list' },
    value: JSON.stringify(
      [
        { sku: 'A-1', name: 'Teclado', price: 129.9, stock: 12 },
        { sku: 'B-2', name: 'Mouse', price: 49.9, stock: 0 },
        { sku: 'C-3', name: 'Monitor', price: 899, stock: 4 },
      ],
      null,
      2
    ),
  },
  {
    key: 'evento',
    label: { pt: 'Evento aninhado', en: 'Nested event' },
    value: JSON.stringify(
      {
        id: 'evt_01',
        type: 'payment',
        payload: { amount: 1000, currency: 'BRL', items: [{ id: 'i1', qty: 2 }] },
        receivedAt: null,
      },
      null,
      2
    ),
  },
]

function identical(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function dedupeSchemas(list) {
  const out = []
  for (const s of list) {
    if (out.some((x) => identical(x, s))) continue
    out.push(s)
  }
  return out
}

function inferObject(value, opts) {
  const keys = Object.keys(value)
  const properties = {}
  for (const k of keys) {
    properties[k] = inferOne(value[k], opts)
  }
  const schema = { type: 'object', properties }
  if (opts.includeRequired && keys.length > 0) schema.required = keys
  return schema
}

function inferFromArray(array, opts) {
  if (array.length === 0) return { type: 'array' }
  return { type: 'array', items: inferFromValues(array, opts) }
}

function inferFromValues(values, opts) {
  const nonNull = values.filter((v) => v !== null)
  const allPrimitive = nonNull.length > 1 && nonNull.every((v) => typeof v === 'string' || typeof v === 'number')
  if (opts.enums && allPrimitive) {
    const distinct = []
    for (const v of nonNull) {
      if (!distinct.includes(v)) distinct.push(v)
    }
    if (distinct.length > 1 && distinct.length <= ENUM_MAX) {
      return { enum: distinct }
    }
  }
  const schemas = nonNull.map((v) => inferOne(v, opts))
  return unionSchemas(schemas, opts)
}

function inferOne(value, opts) {
  if (value === null) return { type: 'null' }
  if (typeof value === 'boolean') return { type: 'boolean' }
  if (typeof value === 'string') return { type: 'string' }
  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' }
  }
  if (Array.isArray(value)) {
    return inferFromArray(value, opts)
  }
  if (typeof value === 'object') {
    return inferObject(value, opts)
  }
  return {}
}

function unionSchemas(schemas, opts) {
  const uniq = dedupeSchemas(schemas)
  if (uniq.length <= 1) return uniq[0] || {}

  const objects = uniq.filter((s) => s && s.type === 'object' && s.properties)
  if (objects.length === uniq.length) {
    const keys = []
    for (const o of objects) {
      for (const k of Object.keys(o.properties)) {
        if (!keys.includes(k)) keys.push(k)
      }
    }
    const properties = {}
    for (const k of keys) {
      const subs = objects
        .filter((o) => Object.prototype.hasOwnProperty.call(o.properties, k))
        .map((o) => o.properties[k])
      properties[k] = unionSchemas(
        dedupeSchemas(subs.filter(Boolean)),
        opts
      )
    }
    const required = keys.filter((k) =>
      objects.every((o) => Object.prototype.hasOwnProperty.call(o.properties, k))
    )
    const merged = { type: 'object', properties }
    if (opts.includeRequired && required.length > 0) merged.required = required
    return merged
  }

  return { anyOf: uniq }
}

const SOURCE_SNIPPET = `// Cada valor de exemplo vira um schema. Objetos são varridos por chave,
// arrays inferem o items a partir dos elementos e tipos mistos viram anyOf.
function inferOne(value, opts) {
  if (value === null) return { type: 'null' }
  if (typeof value === 'boolean') return { type: 'boolean' }
  if (typeof value === 'string') return { type: 'string' }
  if (typeof value === 'number')
    return { type: Number.isInteger(value) ? 'integer' : 'number' }
  if (Array.isArray(value)) {
    var items = inferFromValues(value, opts)
    return { type: 'array', items: items.type ? items : {} }
  }
  if (typeof value === 'object') {
    var schema = { type: 'object', properties: {} }
    schema.required = []
    Object.keys(value).forEach(function (k) {
      schema.properties[k] = inferOne(value[k], opts)
      if (opts.includeRequired) schema.required.push(k)
    })
    if (schema.required.length === 0) delete schema.required
    return schema
  }
  return {}
}

// Junta vários schemas em um: iguais são deduplicados, objetos são fundidos
// por chave (required vira só as chaves presentes em todos) e o resto vira
// anyOf com a união dos tipos distintos.
function unionSchemas(list) {
  var uniq = dedupe(list)
  if (uniq.length <= 1) return uniq[0] || {}
  return { anyOf: uniq }
}`

const translations = {
  pt: {
    title: 'Gerador de JSON Schema',
    intro: (<>Cola um JSON de exemplo — payload de API, mock, dump — e gera um <Text code>JSON Schema</Text> compatível com draft-07 descrevendo a estrutura: tipos, chaves obrigatórias, items de arrays e <Text code>anyOf</Text> pra tipos mistos. Útil pra documentar endpoints, validar respostas (com <Text code>ajv</Text>) ou montar mocks. 100% local, nada sai do navegador.</>),
    inputLabel: 'JSON de exemplo',
    placeholder: 'Cole aqui um JSON de exemplo...',
    optionsTitle: 'Opções',
    sampleRequired: 'Todas as chaves como obrigatórias (required)',
    sampleRequiredHint: 'Em arrays de objetos, só entram em required as chaves presentes em todos os elementos.',
    enums: 'Inferir enum de valores pequenos',
    enumsHint: 'Se um campo só aparece com poucos valores string/número distintos, vira { enum: [...] }.',
    sampleLabel: 'Exemplos:',
    resultTitle: 'JSON Schema gerado',
    emptyHint: 'Cole um JSON válido acima pra gerar o schema.',
    invalidJson: 'JSON inválido — confira as chaves, vírgulas e aspas do que foi colado.',
    copy: 'Copiar',
    copied: 'Copiado!',
    sizeLabel: (bytes) => `${bytes} bytes`,
    algorithmTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'JSON Schema Generator',
    intro: (<>Paste a JSON value — an API response, a mock, a dump — and get a draft-07-compatible <Text code>JSON Schema</Text> describing it: types, required keys, array items and <Text code>anyOf</Text> for mixed types. Useful for documenting endpoints, validating responses (with <Text code>ajv</Text>) or building mocks. 100% local, nothing leaves the browser.</>),
    inputLabel: 'Sample JSON',
    placeholder: 'Paste a sample JSON here...',
    optionsTitle: 'Options',
    sampleRequired: 'Mark every key as required',
    sampleRequiredHint: 'For arrays of objects, only keys present in every element go into required.',
    enums: 'Infer enums from small value sets',
    enumsHint: 'Fields with only a few distinct string/number values become enum: [...]',
    sampleLabel: 'Examples:',
    resultTitle: 'Generated JSON Schema',
    emptyHint: 'Paste valid JSON above to generate a schema.',
    invalidJson: 'Invalid JSON — check the braces, commas and quotes you pasted.',
    copy: 'Copy',
    copied: 'Copied!',
    sizeLabel: (bytes) => `${bytes} bytes`,
    algorithmTitle: 'Under the hood (algorithm)',
  },
}

export default function JsonSchemaGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLES[0].value)
  const [includeRequired, setIncludeRequired] = useState(true)
  const [enums, setEnums] = useState(false)
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, error: 'empty' }
    try {
      return { ok: true, value: JSON.parse(input) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [input])

  const outputText = useMemo(() => {
    if (!parsed.ok) return ''
    const schema = inferOne(parsed.value, { includeRequired, enums })
    return JSON.stringify(schema, null, 2)
  }, [parsed, includeRequired, enums])

  const byteSize = useMemo(() => new Blob([outputText]).size, [outputText])

  async function handleCopy() {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sampleLabel}</Text>
            {SAMPLES.map((s) => (
              <Tag
                key={s.key}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => setInput(s.value)}
              >
                {s.label[lang]}
              </Tag>
            ))}
          </Space>
          <Input.TextArea
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space wrap>
            <Switch checked={includeRequired} onChange={setIncludeRequired} />
            <Text>{t.sampleRequired}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.sampleRequiredHint}
          </Text>
          <Space wrap>
            <Switch checked={enums} onChange={setEnums} />
            <Text>{t.enums}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.enumsHint}
          </Text>
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.resultTitle}</span>
            {outputText && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.sizeLabel(byteSize)}
              </Text>
            )}
          </Space>
        }
        extra={
          outputText ? (
            <Button
              type="primary"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? t.copied : t.copy}
            </Button>
          ) : null
        }
      >
        {parsed.ok ? (
          <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <code>{outputText}</code>
          </pre>
        ) : (
          <Alert
            type={parsed.error === 'empty' ? 'info' : 'error'}
            showIcon
            message={parsed.error === 'empty' ? t.emptyHint : t.invalidJson}
          />
        )}
      </Card>

      <Card title={t.algorithmTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
          <code>{SOURCE_SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}