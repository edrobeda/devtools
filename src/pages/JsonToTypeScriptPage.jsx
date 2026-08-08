import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Switch, Collapse } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Exemplos clicáveis ──────────────────────────────────────────────────
const SAMPLES = [
  {
    key: 'usuario',
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
    key: 'produtos',
    label: { pt: 'Lista de produtos', en: 'Products list' },
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
    key: 'aninhado',
    label: { pt: 'Payload aninhado', en: 'Nested payload' },
    value: JSON.stringify(
      {
        id: 'evt_01',
        type: 'payment',
        payload: {
          amount: 1000,
          currency: 'BRL',
          items: [{ id: 'i1', qty: 2 }, { id: 'i2', qty: 1 }],
        },
        received_at: '2026-01-01T10:00:00Z',
      },
      null,
      2
    ),
  },
]

// ─── Utilitários de nome ─────────────────────────────────────────────────
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/
// Palavras reservadas do ECMAScript — em interfaces TS qualquer palavra
// reservada é permitida como nome de propriedade, então só entra aqui o que
// de fato quebraria a sintaxe se usado sem aspas (quase nada).
const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
  'while', 'with', 'yield', 'let', 'static', 'implements', 'package', 'private',
  'protected', 'public',
])

function camelize(key) {
  const camel = key
    .replace(/[\s_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9_]+/, '')
  return camel || key
}

// "user_profile" → "UserProfile" (PascalCase pro nome do tipo)
function pascalName(key) {
  const input = key || ''
  if (!input) return 'Obj'
  let clean = input.replace(/[\s_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
  let ident = clean.replace(/[^A-Za-z0-9_$]/g, '')
  ident = ident.charAt(0).toUpperCase() + ident.slice(1)
  if (!ident) return 'Obj'
  if (/^[0-9]/.test(ident)) ident = 'T' + ident
  return ident
}

function isIdent(k) {
  return IDENT_RE.test(k) && !RESERVED.has(k)
}

// "produtos" → "Produto", "items" → "Item" (heurística simples de singular)
function singular(base) {
  const lower = base.toLowerCase()
  if (base.length > 3 && lower.endsWith('ies')) return base.slice(0, -3) + 'y'
  if (base.length > 2 && lower.endsWith('es')) return base.slice(0, -2)
  if (base.length > 2 && lower.endsWith('s')) return base.slice(0, -1)
  return base
}

// ─── gerador JSON → TypeScript ───────────────────────────────────────────
function buildTypeScript(value, opts) {
  const defs = [] // { name, body } — interfaces geradas
  const used = new Set()
  const memo = new Map() // assinatura do objeto → nome já reutilizado

  const isRootObject =
    value !== null && typeof value === 'object' && !Array.isArray(value)
  const rootName = opts.rootName || 'Root'
  const rootBase = pascalName(rootName) // nome PascalCase do tipo raiz

  // Se a raiz não for objeto (array/primitivo), o nome da raiz vira o alias
  // `type Root = ...` — reserva ele logo pra interface dos elementos não
  // roubar o mesmo identificador.
  if (!isRootObject) used.add(rootBase)

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

  // Assinatura de FORMA (ignora valores): duas estruturas iguais com dados
  // diferentes geram a mesma assinatura e reutilizam a mesma interface.
  function shapeSig(node) {
    if (node === null) return 'null'
    if (typeof node === 'boolean') return 'bool'
    if (typeof node === 'number') return 'num'
    if (typeof node === 'string') return 'str'
    if (Array.isArray(node)) {
      if (node.length === 0) return '[]'
      const sigs = node.map(shapeSig)
      return '[' + Array.from(new Set(sigs)).sort().join(',') + ']'
    }
    const keys = Object.keys(node).sort()
    return '{' + keys.map((k) => k + ':' + shapeSig(node[k])).join(',') + '}'
  }

  // Tipa um nó e devolve o texto do tipo. Objetos viram interfaces nomeadas
  // (memo deduplica formas iguais), o resto é tipo inline.
  function typeOf(node, baseName) {
    if (node === null) return opts.nullable ? 'null' : 'any'
    if (typeof node === 'boolean') return 'boolean'
    if (typeof node === 'string') return 'string'
    if (typeof node === 'number') return 'number'

    if (Array.isArray(node)) {
      if (node.length === 0) return 'unknown[]'
      const types = []
      for (const el of node) {
        const t = typeOf(el, elementBaseName(el, baseName))
        if (!types.includes(t)) types.push(t)
      }
      return types.length === 1
        ? types[0] + '[]'
        : '(' + types.join(' | ') + ')[]'
    }

    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const name = uniqueName(pascalName(baseName) || 'Root')
      memo.set(sig, name)
      const lines = Object.keys(node).map((k) => {
        const key = opts.camelKeys ? camelize(k) : k
        const label = isIdent(key) ? key : JSON.stringify(key)
        return '  ' + label + ': ' + typeOf(node[k], pascalName(k))
      })
      defs.push({ name, body: lines.join('\n') })
      return name
    }

    return 'any'
  }

  // Nome do tipo dos elementos de um array: singular do nome do container
  // ("products" → "Product", "tags" → "Tag"); se o nome já vier no singular
  // ("Root"), vira "RootItem".
  function elementBaseName(firstEl, baseName) {
    const pascal = pascalName(baseName) || 'Root'
    const sg = singular(pascal)
    return sg && sg !== pascal ? sg : pascal + 'Item'
  }

  const rootResult = typeOf(value, rootBase)

  // Emite as interfaces; a raiz sai por último.
  const rootInterface = isRootObject
    ? defs.find((d) => d.name === rootBase)
    : null
  const others = defs.filter((d) => d.name !== rootBase)
  const head = others.map(intf).join('\n')

  if (isRootObject) {
    return (head ? head + '\n\n' : '') + intf(rootInterface) + '\n'
  }
  const prefix = opts.exportPrefix ? 'export ' : ''
  return (
    (head ? head + '\n\n' : '') +
    prefix + 'type ' + rootBase + ' = ' + rootResult + ';\n'
  )
}

function intf(d) {
  return `export interface ${d.name} {\n${d.body}\n}`
}

const SOURCE_SNIPPET = `// A chave da conversão: recursão que imita a estrutura do JSON e dá nome
// aos objetos — um Map memoiza a assinatura de cada objeto pra nunca
// redefinir interfaces com a mesma forma.
function typeOf(node, name) {
  if (node === null) return 'null | undefined'
  if (Array.isArray(node)) {
    var t = node.map(function (x) { return typeOf(x, singularOf(name)) })
    return uniqueTypes(t).join(' | ') + '[]'
  }
  if (typeof node === 'object') {
    var sig = JSON.stringify(node)
    if (memo.has(sig)) return memo.get(sig)   // forma já vista → reusa
    var iface = uniqueName(pascalName(name || 'Root'))
    memo.set(sig, iface)
    defs.push(iface + ' { ' +
      Object.keys(node).map(function (k) {
        return k + ': ' + typeOf(node[k], k)
      }) + ' }')
    return iface
  }
  return typeof node                        // 'boolean' | 'string' | 'number'
}

// Chaves que não são identificadores válidos (hifens, espaços, palavras
// reservadas) saem entre aspas:  { "user-name": string }
`

const translations = {
  pt: {
    title: 'JSON → TypeScript',
    intro: (
      <>
        Cola um JSON de exemplo — resposta de API, mock, dump — e gera as{' '}
        <Text code>interface</Text>/<Text code>type</Text> do TypeScript que
        descrevem aquela estrutura. Cada objeto vira uma interface nomeada
        (formas iguais são reaproveitadas via memo), arrays viram{' '}
        <Text code>Tipo[]</Text> com união de tipos e chaves com nome inválido
        ou palavra reservada saem entre aspas. Pronto pra colar no projeto na
        hora. 100% local, nada sai do navegador.
      </>
    ),
    input: 'JSON de exemplo',
    sampleLabel: 'Exemplos:',
    options: 'Opções',
    rootName: 'Nome do tipo raiz',
    rootNamePlaceholder: 'Root',
    camelKeys: 'Converter chaves para camelCase',
    camelKeysHint: 'Ex.: user_id → userId; espaços e hifens são unidos (ex.: "primeiro nome" → primeiroNome).',
    exportPrefix: 'Prefixo export',
    exportPrefixHint: 'Precede a raiz com "export" quando a raiz vira type alias (não-objeto).',
    nullAsAny: 'Mapear null como any',
    nullAsAnyHint: 'Por padrão null → "null"; com esta opção vira "any" onde JSON traz null.',
    resultTitle: 'TypeScript gerado',
    sizeLabel: (ifaces, bytes) => `${ifaces} ${ifaces === 1 ? 'interface' : 'interfaces'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    emptyHint: 'Cole um JSON válido acima pra gerar o TypeScript.',
    invalidJson: 'JSON inválido — confira chaves, vírgulas e aspas do que foi colado.',
    copy: 'Copiar',
    copied: 'Copiado!',
    scoreTitle: 'Sobre o resultado',
    scoreBody: (
      <>
        O TypeScript não infere semântica de <Text code>Date</Text>,{' '}
        <Text code>number</Text> inteiro ou modelos de domínio — o gerador
        cola os tipos básicos que o JSON expõe. Array de objetos com formas
        diferentes vira união <Text code>(A | B)</Text>; array vazio vira{' '}
        <Text code>unknown[]</Text>. Interfaces iguais (mesma assinatura) são
        reutilizadas em vez de duplicadas, e a raiz sai por último no bloco de
        interfaces.
      </>
    ),
    algorithmTitle: 'Como funciona (algoritmo)',
    algorithmDesc:
      'A recursão typeOf percorre o valor: primitivos devolvem o próprio tipo, arrays deduplicam e unem os tipos dos elementos, e objetos ganham interface nomeada (memo por assinatura). A raiz vira o type Name da primeira interface; valores não-objeto viram `type Root = ...`.',
  },
  en: {
    title: 'JSON → TypeScript',
    intro: (
      <>
        Paste a sample JSON — an API response, a mock, a dump — and get the
        TypeScript <Text code>interface</Text>/<Text code>type</Text> that
        describes it. Every object becomes a named interface (identical shapes
        are reused via memo), arrays become <Text code>Type[]</Text> with a
        union of variants and invalid/reserved key names get quoted. Ready to
        paste into your codebase. 100% local, nothing leaves the browser.
      </>
    ),
    input: 'Sample JSON',
    sampleLabel: 'Samples:',
    options: 'Options',
    rootName: 'Root type name',
    rootNamePlaceholder: 'Root',
    camelKeys: 'Convert keys to camelCase',
    camelKeysHint: 'e.g. "user_id" → "userId"; spaces and hyphens are joined (e.g. "first name" → firstName).',
    exportPrefix: 'Export prefix',
    exportPrefixHint: 'Prepends "export" to the root when the root becomes a type alias (non-object).',
    nullAsAny: 'Map null to any',
    nullAsAnyHint: 'By default null → "null"; with this on it becomes "any" wherever JSON holds null.',
    resultTitle: 'Generated TypeScript',
    sizeLabel: (ifaces, bytes) => `${ifaces} ${ifaces === 1 ? 'interface' : 'interfaces'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    emptyHint: 'Paste valid JSON above to generate the TypeScript.',
    invalidJson: 'Invalid JSON — check the braces, commas and quotes you pasted.',
    copy: 'Copy',
    copied: 'Copied!',
    scoreTitle: 'About the output',
    scoreBody: (
      <>
        TypeScript cannot infer that <Text code>id</Text> is int or that{' '}
        <Text code>date</Text> is an ISO string — only the basic types JSON
        actually exposes. Arrays holding different shapes become a{' '}
        <Text code>(A | B)</Text> union; empty arrays become{' '}
        <Text code>unknown[]</Text>. Identical shapes are reused instead of
        duplicated, and the root interface comes last in the block.
      </>
    ),
    algorithmTitle: 'Under the hood (algorithm)',
    algorithmDesc:
      'The typeOf() recursion walks the value: primitives yield their own type, arrays deduplicate and union the element types, and objects get a named interface (memoised by signature). The root becomes the name of the first interface; non-object roots become `type Root = ...`.',
  },
}

export default function JsonToTypeScriptPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLES[0].value)
  const [rootName, setRootName] = useState('Root')
  const [camelKeys, setCamelKeys] = useState(true)
  const [exportPrefix, setExportPrefix] = useState(true)
  const [nullAsAny, setNullAsAny] = useState(false)
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
    return buildTypeScript(parsed.value, {
      rootName: rootName.trim() || 'Root',
      camelKeys,
      exportPrefix,
      nullable: !nullAsAny,
    })
  }, [parsed, rootName, camelKeys, exportPrefix, nullAsAny])

  const stats = useMemo(() => {
    const ifaces = (outputText.match(/^export interface/gm) || []).length
    const bytes = new TextEncoder().encode(outputText).length
    return { ifaces, bytes }
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
            <Switch checked={camelKeys} onChange={setCamelKeys} />
            {t.camelKeys}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.camelKeysHint}
          </Text>

          <Space wrap>
            <Switch checked={exportPrefix} onChange={setExportPrefix} />
            {t.exportPrefix}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.exportPrefixHint}
          </Text>

          <Space wrap>
            <Switch checked={nullAsAny} onChange={setNullAsAny} />
            {t.nullAsAny}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.nullAsAnyHint}
          </Text>
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.resultTitle}</span>
            {parsed.ok && outputText && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.sizeLabel(stats.ifaces, stats.bytes)}
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
              label: <Text code>jsonToTypeScript.js</Text>,
              children: <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>{SOURCE_SNIPPET}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}