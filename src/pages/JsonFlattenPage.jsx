import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Tag,
  Segmented,
  Collapse,
  Table,
  Switch,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  CheckOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { flatten, unflatten, flattenEntries } from '../utils/jsonFlatten'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLES = [
  {
    key: 'user',
    label: { pt: 'Usuário aninhado', en: 'Nested user' },
    flatten: JSON.stringify(
      {
        id: 42,
        name: 'Alice',
        address: {
          street: 'Rua das Flores',
          city: 'São Paulo',
          geo: { lat: -23.5, lng: -46.6 },
        },
        tags: ['admin', 'beta'],
      },
      null,
      2,
    ),
    unflatten: JSON.stringify(
      {
        'id': 42,
        'name': 'Alice',
        'address.street': 'Rua das Flores',
        'address.city': 'São Paulo',
        'address.geo.lat': -23.5,
        'address.geo.lng': -46.6,
        'tags.0': 'admin',
        'tags.1': 'beta',
      },
      null,
      2,
    ),
  },
  {
    key: 'list',
    label: { pt: 'Lista de objetos', en: 'List of objects' },
    flatten: JSON.stringify(
      [
        { id: 1, active: true },
        { id: 2, active: false, meta: { score: 9.5 } },
      ],
      null,
      2,
    ),
    unflatten: JSON.stringify(
      {
        '0.id': 1,
        '0.active': true,
        '1.id': 2,
        '1.active': false,
        '1.meta.score': 9.5,
      },
      null,
      2,
    ),
  },
  {
    key: 'edge',
    label: { pt: 'Casos especiais', en: 'Edge cases' },
    flatten: JSON.stringify(
      {
        empty: {},
        emptyList: [],
        'key.with.dots': 'preserved via backslash',
        value: null,
      },
      null,
      2,
    ),
    unflatten: JSON.stringify(
      {
        'empty': {},
        'emptyList': [],
        'key\\.with\\.dots': 'preserved via backslash',
        'value': null,
      },
      null,
      2,
    ),
  },
]

const SOURCE_SNIPPET = `// flatten: caminhada em profundidade emitindo "pai.delimitador.filho".
function flatten(value, opts = {}) {
  const delimiter = opts.delimiter || '.'
  const result = {}

  function isObject(n) {
    return n !== null && typeof n === 'object' && !Array.isArray(n)
  }

  function walk(node, prefix) {
    if (!isObject(node) && !Array.isArray(node)) {
      result[prefix] = node
      return
    }
    if (Array.isArray(node)) {
      if (node.length === 0) { result[prefix] = node; return }
      node.forEach((item, idx) => walk(item, prefix ? prefix + delimiter + idx : String(idx)))
      return
    }
    const keys = Object.keys(node)
    if (keys.length === 0) { result[prefix] = node; return }
    keys.forEach((key) => {
      const safe = key.replace(/\\\\/g, '\\\\\\\\').replaceAll(delimiter, '\\\\' + delimiter)
      const next = prefix ? prefix + delimiter + safe : safe
      walk(node[key], next)
    })
  }

  if (value === null || typeof value !== 'object') return value
  walk(value, '')
  return result
}

// unflatten: reconstrói a árvore a partir dos caminhos.
function unflatten(value, opts = {}) {
  const delimiter = opts.delimiter || '.'
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  const result = {}
  Object.keys(value).forEach((key) => {
    const parts = key.split(delimiter) // simplificado; versão real escapa \\.
    let current = result
    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1
      const nextIsNumber = /^\\d+$/.test(parts[idx + 1])
      if (isLast) { current[part] = value[key]; return }
      if (current[part] === undefined) current[part] = nextIsNumber ? [] : {}
      current = current[part]
    })
  })
  return result
}`

const translations = {
  pt: {
    title: 'JSON Flatten & Unflatten',
    intro: (
      <>
        Transforma um JSON aninhado num objeto "achatado" de caminhos{' '}
        <Text code>a.b.0.c</Text> e vice-versa — útil pra importar/exportar
        pra planilhas, logs estruturados, MongoDB projections, formulários
        dinâmicos e transforms ETL. 100% client-side: nada sai do navegador.
      </>
    ),
    mode: 'Modo',
    modeFlatten: 'Flatten',
    modeUnflatten: 'Unflatten',
    input: 'JSON de entrada',
    sampleLabel: 'Exemplos:',
    delimiter: 'Delimitador',
    delimiterHint: 'Use outro caractere se seus dados contiverem muitos pontos.',
    outputJson: 'JSON resultante',
    outputPaths: 'Caminhos gerados',
    emptyHint: 'Cole um JSON válido acima para processar.',
    invalidJson: 'JSON inválido — confira chaves, vírgulas e aspas.',
    paths: 'caminhos',
    arrays: 'arrays',
    objects: 'objetos',
    leaves: 'folhas',
    copy: 'Copiar',
    copied: 'Copiado!',
    showTable: 'Mostrar tabela de caminhos',
    alertTitle: 'Sobre arrays e chaves com o delimitador',
    alertBody: (
      <>
        Arrays são achatados como índices numéricos:{' '}
        <Text code>{'{"items":[{"id":1}]}'}</Text> vira{' '}
        <Text code>{'{"items.0.id":1}'}</Text>. Na volta, se o próximo
        segmento for um número, o nó vira array automaticamente. Objetos
        vazios e arrays vazios são preservados. Se uma chave contiver o
        próprio delimitador (ex.: <Text code>"a.b"</Text>), ela é escapada
        com <Text code>\</Text> no flatten; o unflatten real dessa página
        desfaz o escape. Complementa o <Text code>json-formatter</Text> e o{' '}
        <Text code>json-path-explorer</Text>: este não consulta valores,
        transforma a estrutura inteira.
      </>
    ),
    algorithmTitle: 'Como funciona (algoritmo)',
    algorithmDesc:
      'Depth-first walk: scalar vira folha, objeto vira "pai.delimitador.filho", array vira índices numéricos. Unflatten reconstrói a árvore criando arrays quando o próximo segmento é um número.',
    pathCol: 'Caminho',
    valueCol: 'Valor',
    typeCol: 'Tipo',
  },
  en: {
    title: 'JSON Flatten & Unflatten',
    intro: (
      <>
        Turn a nested JSON into a flat object of dot paths{' '}
        <Text code>a.b.0.c</Text> and back — handy for spreadsheets,
        structured logs, MongoDB projections, dynamic forms and ETL
        transforms. 100% client-side: nothing leaves the browser.
      </>
    ),
    mode: 'Mode',
    modeFlatten: 'Flatten',
    modeUnflatten: 'Unflatten',
    input: 'Input JSON',
    sampleLabel: 'Samples:',
    delimiter: 'Delimiter',
    delimiterHint: 'Pick another character if your data contains many dots.',
    outputJson: 'Resulting JSON',
    outputPaths: 'Generated paths',
    emptyHint: 'Paste valid JSON above to process.',
    invalidJson: 'Invalid JSON — check braces, commas and quotes.',
    paths: 'paths',
    arrays: 'arrays',
    objects: 'objects',
    leaves: 'leaves',
    copy: 'Copy',
    copied: 'Copied!',
    showTable: 'Show paths table',
    alertTitle: 'About arrays and keys containing the delimiter',
    alertBody: (
      <>
        Arrays flatten to numeric indices:{' '}
        <Text code>{'{"items":[{"id":1}]}'}</Text> becomes{' '}
        <Text code>{'{"items.0.id":1}'}</Text>. On the way back, if the
        next segment is a number the node becomes an array automatically.
        Empty objects and arrays are preserved. If a key contains the
        delimiter itself (e.g. <Text code>"a.b"</Text>), flatten escapes it
        with <Text code>\</Text>; the unflatten on this page reverses the
        escape. Complements <Text code>json-formatter</Text> and{' '}
        <Text code>json-path-explorer</Text>: this one does not query values,
        it transforms the whole structure.
      </>
    ),
    algorithmTitle: 'Under the hood (algorithm)',
    algorithmDesc:
      'Depth-first walk: scalar becomes a leaf, object becomes "parent.delimiter.child", array becomes numeric indices. Unflatten rebuilds the tree, creating arrays when the next segment is a number.',
    pathCol: 'Path',
    valueCol: 'Value',
    typeCol: 'Type',
  },
}

function getType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function countContainers(value) {
  let arrays = 0
  let objects = 0
  let leaves = 0

  function walk(node) {
    if (Array.isArray(node)) {
      arrays += 1
      node.forEach(walk)
    } else if (node !== null && typeof node === 'object') {
      objects += 1
      Object.values(node).forEach(walk)
    } else {
      leaves += 1
    }
  }

  walk(value)
  return { arrays, objects, leaves }
}

export default function JsonFlattenPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [mode, setMode] = useState('flatten')
  const [input, setInput] = useState(SAMPLES[0].flatten)
  const [delimiter, setDelimiter] = useState('.')
  const [showTable, setShowTable] = useState(true)
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, error: 'empty' }
    try {
      return { ok: true, value: JSON.parse(input) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [input])

  const result = useMemo(() => {
    if (!parsed.ok) return null
    const opts = { delimiter: delimiter || '.' }
    return mode === 'flatten'
      ? flatten(parsed.value, opts)
      : unflatten(parsed.value, opts)
  }, [parsed, mode, delimiter])

  const resultJson = useMemo(() => {
    if (result === null) return ''
    return JSON.stringify(result, null, 2)
  }, [result])

  const entries = useMemo(() => {
    if (!parsed.ok || mode !== 'flatten') return []
    return flattenEntries(parsed.value, { delimiter: delimiter || '.' })
  }, [parsed, mode, delimiter])

  const stats = useMemo(() => {
    if (!parsed.ok) return null
    if (mode === 'flatten') {
      const containers = countContainers(parsed.value)
      return {
        paths: entries.length,
        arrays: containers.arrays,
        objects: containers.objects,
        leaves: containers.leaves,
      }
    }
    const containers = countContainers(result)
    return {
      paths: Object.keys(parsed.value).length,
      arrays: containers.arrays,
      objects: containers.objects,
      leaves: containers.leaves,
    }
  }, [parsed, mode, result, entries.length])

  async function handleCopy() {
    if (!resultJson) return
    try {
      await navigator.clipboard.writeText(resultJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const columns = [
    {
      title: t.pathCol,
      dataIndex: 'path',
      key: 'path',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: t.valueCol,
      dataIndex: 'value',
      key: 'value',
      render: (value) => (
        <Text code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(value)}
        </Text>
      ),
    },
    {
      title: t.typeCol,
      dataIndex: 'value',
      key: 'type',
      width: 100,
      render: (value) => <Tag>{getType(value)}</Tag>,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FileTextOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.mode}>
        <Segmented
          value={mode}
          onChange={(value) => {
            setMode(value)
            const sample = SAMPLES.find((s) => s.key === 'user')
            setInput(value === 'flatten' ? sample.flatten : sample.unflatten)
          }}
          options={[
            { label: t.modeFlatten, value: 'flatten' },
            { label: t.modeUnflatten, value: 'unflatten' },
          ]}
        />
      </Card>

      <Card title={t.input}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sampleLabel}</Text>
            {SAMPLES.map((s) => (
              <Tag
                key={s.key}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setInput(mode === 'flatten' ? s.flatten : s.unflatten)
                }
              >
                {s.label[lang]}
              </Tag>
            ))}
          </Space>
          <TextArea
            rows={9}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.input}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      <Card title={t.delimiter}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Input
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              maxLength={4}
              style={{ width: 80, fontFamily: 'monospace', textAlign: 'center' }}
            />
            <Text type="secondary">{t.delimiterHint}</Text>
          </Space>
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <SwapOutlined />
            <span>{mode === 'flatten' ? t.outputPaths : t.outputJson}</span>
            {stats && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.paths} {t.paths} · {stats.arrays} {t.arrays} ·{' '}
                {stats.objects} {t.objects} · {stats.leaves} {t.leaves}
              </Text>
            )}
          </Space>
        }
        extra={
          parsed.ok && resultJson ? (
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
        {!parsed.ok ? (
          <Alert
            type={parsed.error === 'empty' ? 'info' : 'error'}
            showIcon
            message={parsed.error === 'empty' ? t.emptyHint : t.invalidJson}
          />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {mode === 'flatten' && (
              <Space>
                <Switch checked={showTable} onChange={setShowTable} />
                <Text>{t.showTable}</Text>
              </Space>
            )}
            {mode === 'flatten' && showTable && (
              <Table
                dataSource={entries.map((e, i) => ({ ...e, key: i }))}
                columns={columns}
                pagination={{ pageSize: 8, size: 'small' }}
                size="small"
              />
            )}
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              <code>{resultJson}</code>
            </pre>
          </Space>
        )}
      </Card>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>jsonFlatten.js</Text>,
              children: (
                <pre
                  style={{
                    margin: 0,
                    overflowX: 'auto',
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  <code>{SOURCE_SNIPPET}</code>
                </pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
