import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Switch, Collapse, Select } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLES = [
  {
    key: 'user',
    label: { pt: 'Usuário', en: 'User' },
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
    key: 'products',
    label: { pt: 'Lista de produtos', en: 'Products list' },
    value: JSON.stringify(
      {
        products: [
          { sku: 'A-1', name: 'Teclado', price: 129.9, stock: 12, available: true },
          { sku: 'B-2', name: 'Mouse', price: 49.9, stock: 0, available: false },
        ],
        total: 2,
        page: 1,
      },
      null,
      2
    ),
  },
  {
    key: 'nested',
    label: { pt: 'Payload aninhado', en: 'Nested payload' },
    value: JSON.stringify(
      {
        order: {
          id: 'ord_01',
          customer: { name: 'Bob', email: 'bob@example.com' },
          items: [
            { product: { id: 'p1', name: 'Phone' }, qty: 1, price: 999.99 },
          ],
          total: 999.99,
          paid: true,
          notes: null,
        },
      },
      null,
      2
    ),
  },
]

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

function pascalName(key) {
  const input = key || ''
  if (!input) return 'Obj'
  let clean = input.replace(/[^A-Za-z0-9_]/g, ' ')
    .replace(/[\s_]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
  let ident = clean.replace(/[^A-Za-z0-9_]/g, '')
  ident = ident.charAt(0).toUpperCase() + ident.slice(1)
  if (!ident) return 'Obj'
  if (/^[0-9]/.test(ident)) ident = 'T' + ident
  return ident
}

function singular(base) {
  const lower = base.toLowerCase()
  if (base.length > 3 && lower.endsWith('ies')) return base.slice(0, -3) + 'y'
  if (base.length > 2 && lower.endsWith('es')) return base.slice(0, -2)
  if (base.length > 2 && lower.endsWith('s')) return base.slice(0, -1)
  return base
}

function isIdent(k) {
  return IDENT_RE.test(k)
}

// ─── GraphQL type generation ────────────────────────────────────────────────
function buildGraphql(value, opts) {
  const typeDefs = []
  const used = new Set()
  const memo = new Map()

  function uniqueName(base) {
    let name = base
    let i = 2
    while (used.has(name)) {
      name = base + i
      i += 1
    }
    used.add(name)
    return name
  }

  function shapeSig(node) {
    if (node === null || node === undefined) return 'null'
    if (typeof node === 'boolean') return 'bool'
    if (typeof node === 'number') {
      return Number.isInteger(node) ? 'int' : 'float'
    }
    if (typeof node === 'string') return 'str'
    if (Array.isArray(node)) {
      if (node.length === 0) return '[]'
      const sigs = node.map(shapeSig)
      return '[' + Array.from(new Set(sigs)).sort().join(',') + ']'
    }
    const keys = Object.keys(node).sort()
    return '{' + keys.map((k) => k + ':' + shapeSig(node[k])).join(',') + '}'
  }

  function gqlTypeOf(node, baseName) {
    if (node === null || node === undefined) {
      return 'String'
    }
    if (typeof node === 'boolean') return 'Boolean'
    if (typeof node === 'number') {
      return Number.isInteger(node) ? 'Int' : 'Float'
    }
    if (typeof node === 'string') return 'String'

    if (Array.isArray(node)) {
      if (node.length === 0) return '[String]'
      const types = []
      for (const el of node) {
        const t = gqlTypeOf(el, elementBaseName(el, baseName))
        if (!types.includes(t)) types.push(t)
      }
      const inner = types.length === 1 ? types[0] : types.join(' | ')
      return '[' + inner + ']'
    }

    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const name = uniqueName(pascalName(baseName) || 'Root')
      memo.set(sig, name)
      const fields = Object.keys(node).map((k) => {
        const fieldName = isIdent(k) ? k : JSON.stringify(k)
        const nullable = opts.nullable !== false
        const fieldType = gqlTypeOf(node[k], pascalName(k))
        // In GraphQL, ! means non-nullable. By default fields are nullable.
        // With non-null option, primitives get ! suffix.
        const isNonNull = opts.nonNull && typeof node[k] !== 'object' && node[k] !== null
        return '  ' + fieldName + ': ' + fieldType + (isNonNull ? '!' : '')
      })
      typeDefs.push({ name, body: fields.join('\n') })
      return name
    }

    return 'String'
  }

  function elementBaseName(firstEl, baseName) {
    const pascal = pascalName(baseName) || 'Root'
    const sg = singular(pascal)
    return sg && sg !== pascal ? sg : pascal + 'Item'
  }

  const isRootObject =
    value !== null && typeof value === 'object' && !Array.isArray(value)
  const rootName = opts.rootName || 'Root'
  const rootBase = pascalName(rootName)
  if (!isRootObject) used.add(rootBase)

  gqlTypeOf(value, rootBase)

  const rootType = isRootObject
    ? typeDefs.find((d) => d.name === rootBase)
    : null
  const others = typeDefs.filter((d) => d.name !== rootBase)

  const lines = []
  for (const def of others) {
    lines.push('type ' + def.name + ' {\n' + def.body + '\n}')
  }
  if (rootType) {
    if (others.length > 0) lines.push('')
    lines.push('type ' + rootType.name + ' {\n' + rootType.body + '\n}')
  }
  if (!isRootObject) {
    if (others.length > 0) lines.push('')
    const nullable = opts.nullable !== false
    const inner = gqlTypeOf(value, rootBase)
    const isNonNullRoot = opts.nonNull && value !== null && typeof value !== 'object'
    lines.push('type ' + rootBase + ' {\n  data: ' + inner + (isNonNullRoot ? '!' : '') + '\n}')
  }

  return lines.join('\n') + '\n'
}

const translations = {
  pt: {
    title: 'JSON → GraphQL Schema',
    intro: (
      <>
        Cola um JSON de exemplo — resposta de API, mock, dump — e gera o{' '}
        <Text code>schema</Text> GraphQL (SDL) que descreve aquela estrutura.
        Cada objeto vira um <Text code>type</Text> nomeado (formas iguais são
        reaproveitadas), arrays viram <Text code>[Tipo]</Text> e primitivos
        viram <Text code>String</Text>/<Text code>Int</Text>/<Text code>Float</Text>/<Text code>Boolean</Text>.
        Pronto pra colar num schema GraphQL ou gerar tipos com codegen.
        100% local, nada sai do navegador.
      </>
    ),
    input: 'JSON de exemplo',
    sampleLabel: 'Exemplos:',
    options: 'Opções',
    rootName: 'Nome do tipo raiz',
    rootNamePlaceholder: 'Root',
    nonNull: 'Campos primitivos não-nulos (!)',
    nonNullHint: 'Adiciona ! em campos de tipo primitivo (String, Int, etc.), indicando que nunca são null.',
    nullable: 'Permitir null (padrão GraphQL)',
    nullableHint: 'No GraphQL, campos sem ! são nullable por padrão. Com isto ligado, o tipo é gerado sem ! pra primitivos.',
    resultTitle: 'GraphQL Schema gerado',
    sizeLabel: (types, bytes) => `${types} ${types === 1 ? 'type' : 'types'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    emptyHint: 'Cole um JSON válido acima pra gerar o schema GraphQL.',
    invalidJson: 'JSON inválido — confira chaves, vírgulas e aspas do que foi colado.',
    copy: 'Copiar',
    copied: 'Copiado!',
    scoreTitle: 'Sobre o resultado',
    scoreBody: (
      <>
        O GraphQL não infere semântica de <Text code>ID</Text>, data ou enums —
        o gerador usa os escalares padrão: <Text code>String</Text>,{' '}
        <Text code>Int</Text>, <Text code>Float</Text> e{' '}
        <Text code>Boolean</Text>. Arrays vazios viram{' '}
        <Text code>[String]</Text>. Tipos com a mesma forma são reutilizados
        em vez de duplicados. Campos nullable (com <Text code>null</Text> no
        JSON) geram o tipo sem <Text code>!</Text>.
      </>
    ),
    algorithmTitle: 'Como funciona (algoritmo)',
    algorithmDesc:
      'A recursão gqlTypeOf percorre o valor: primitivos viram escalares GraphQL, arrays deduplicam os tipos dos elementos e objetos viram type nomeados (memo por assinatura de forma). A raiz vira o type Name da primeira definição; arrays e primitivos na raiz viram um type wrapper com campo data.',
  },
  en: {
    title: 'JSON → GraphQL Schema',
    intro: (
      <>
        Paste a sample JSON — an API response, a mock, a dump — and get the
        GraphQL <Text code>schema</Text> (SDL) that describes it. Every object
        becomes a named <Text code>type</Text> (identical shapes are reused),
        arrays become <Text code>[Type]</Text> and primitives become{' '}
        <Text code>String</Text>/<Text code>Int</Text>/<Text code>Float</Text>/<Text code>Boolean</Text>.
        Ready to paste into a GraphQL schema or generate types with codegen.
        100% local, nothing leaves the browser.
      </>
    ),
    input: 'Sample JSON',
    sampleLabel: 'Samples:',
    options: 'Options',
    rootName: 'Root type name',
    rootNamePlaceholder: 'Root',
    nonNull: 'Non-null primitives (!)',
    nonNullHint: 'Adds ! to primitive fields (String, Int, etc.), indicating they are never null.',
    nullable: 'Allow null (GraphQL default)',
    nullableHint: 'In GraphQL, fields without ! are nullable by default. With this on, types are generated without ! for primitives.',
    resultTitle: 'Generated GraphQL Schema',
    sizeLabel: (types, bytes) => `${types} ${types === 1 ? 'type' : 'types'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    emptyHint: 'Paste valid JSON above to generate the GraphQL schema.',
    invalidJson: 'Invalid JSON — check the braces, commas and quotes you pasted.',
    copy: 'Copy',
    copied: 'Copied!',
    scoreTitle: 'About the output',
    scoreBody: (
      <>
        GraphQL cannot infer <Text code>ID</Text>, date or enum semantics — the
        generator uses standard scalars: <Text code>String</Text>,{' '}
        <Text code>Int</Text>, <Text code>Float</Text> and{' '}
        <Text code>Boolean</Text>. Empty arrays become{' '}
        <Text code>[String]</Text>. Types with identical shapes are reused
        instead of duplicated. Nullable fields (with <Text code>null</Text> in
        JSON) generate the type without <Text code>!</Text>.
      </>
    ),
    algorithmTitle: 'Under the hood (algorithm)',
    algorithmDesc:
      'The gqlTypeOf() recursion walks the value: primitives become GraphQL scalars, arrays deduplicate element types, and objects become named types (memoised by shape signature). The root becomes the name of the first definition; arrays and primitives at root level become a wrapper type with a data field.',
  },
}

export default function JsonToGraphqlPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLES[0].value)
  const [rootName, setRootName] = useState('Root')
  const [nonNull, setNonNull] = useState(false)
  const [nullable, setNullable] = useState(true)
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
    return buildGraphql(parsed.value, {
      rootName: rootName.trim() || 'Root',
      nonNull,
      nullable,
    })
  }, [parsed, rootName, nonNull, nullable])

  const stats = useMemo(() => {
    const types = (outputText.match(/^type /gm) || []).length
    const bytes = new TextEncoder().encode(outputText).length
    return { types, bytes }
  }, [outputText])

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

      <Card title={t.input}>
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

      <Card title={t.options}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.rootName}</Text>
            <Input
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder={t.rootNamePlaceholder}
              style={{ width: 160 }}
            />
          </Space>

          <Space wrap>
            <Switch checked={nonNull} onChange={setNonNull} />
            {t.nonNull}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.nonNullHint}
          </Text>

          <Space wrap>
            <Switch checked={nullable} onChange={setNullable} />
            {t.nullable}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.nullableHint}
          </Text>
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.resultTitle}</span>
            {parsed.ok && outputText && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.sizeLabel(stats.types, stats.bytes)}
              </Text>
            )}
          </Space>
        }
        extra={
          parsed.ok && outputText ? (
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
          <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <code>{outputText}</code>
          </pre>
        )}
      </Card>

      <Alert type="info" showIcon message={t.scoreTitle} description={t.scoreBody} />

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>jsonToGraphql.js</Text>,
              children: <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>{`// Mapeamento JSON → GraphQL: primitivos viram escalares, objetos viram type nomeados.
function gqlTypeOf(node, baseName) {
  if (node === null) return 'String'       // null sem contexto → String nullable
  if (typeof node === 'boolean') return 'Boolean'
  if (typeof node === 'number')
    return Number.isInteger(node) ? 'Int' : 'Float'
  if (typeof node === 'string') return 'String'
  if (Array.isArray(node)) {
    // Deduplica tipos dos elementos → [Type] ou [A | B]
    var types = node.map(function (el) { return gqlTypeOf(el, singularOf(baseName)) })
    return '[' + uniqueTypes(types).join(' | ') + ']'
  }
  // Objeto → type nomeado (memo por assinatura de forma)
  var sig = shapeSignature(node)
  if (memo.has(sig)) return memo.get(sig)
  var name = uniqueName(pascalCase(baseName))
  memo.set(sig, name)
  typeDefs.push(name + ' { ' +
    Object.keys(node).map(function (k) {
      return k + ': ' + gqlTypeOf(node[k], k)
    }).join('\\n  ') + ' }')
  return name
}

// Assinatura de forma: { id:int, name:str, tags:[str] }
// Dois objetos com mesma forma geram o mesmo type (reuso).
function shapeSignature(node) {
  return Object.keys(node).sort()
    .map(function (k) { return k + ':' + typeSig(node[k]) })
    .join(',')
}
`}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
