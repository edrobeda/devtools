import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Switch, Collapse, Segmented } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Exemplos clicáveis ──────────────────────────────────────────────────
const SAMPLES = [
  {
    key: 'api',
    label: { pt: 'Response de API', en: 'API response' },
    value: JSON.stringify(
      {
        ok: true,
        status: 200,
        payload: {
          user_id: 42,
          name: 'Alice',
          email: 'alice@example.com',
          active: true,
          plan: 'on',
          score: '9.5',
        },
        tags: ['api', 'v1.2', 'release'],
        meta: { created: '2024-03-01T10:00:00Z', cache_hit: false },
        errors: null,
      },
      null,
      2
    ),
  },
  {
    key: 'config',
    label: { pt: 'Config / CI', en: 'Config / CI' },
    value: JSON.stringify(
      {
        name: 'devtools',
        version: '1.0.0',
        scripts: { start: 'npm start', build: 'npm run build' },
        env: { NODE_ENV: 'production', DEBUG: 'no' },
        services: [
          { name: 'api', port: 3000 },
          { name: 'web', port: 8080 },
        ],
      },
      null,
      2
    ),
  },
  {
    key: 'nested',
    label: { pt: 'Aninhado & cases', en: 'Nested & edge cases' },
    value: JSON.stringify(
      {
        title: 'itens: com dois pontos # e cerquilha',
        description: 'linha 1\nlinha 2',
        matrix: [[1, 2], [3, 4]],
        empty: {},
        emptyList: [],
        nothing: null,
        'chave com espaço': 'valor 123',
        'on': 'on mas string',
      },
      null,
      2
    ),
  },
]

// ─── Regras de aspas (plain scalars) ────────────────────────────────────
// Um scalar YAML pode sair sem aspas quando o parser não leria outro tipo:
// números, booleans, null/~, yes/no/on/off (booleans em YAML 1.1), espaços
// nas pontas, início com caractere de sintaxe (- ? : , [ ] { } # & * ! |
// > ' " % @ `) e ':' seguido de espaço (ou no fim) ou '#' antes de espaço.
function quotePlain(s) {
  if (s === '') return true
  if (/^\s|\s$/.test(s)) return true
  if (/[\x00-\x08\x0A-\x1F\x7F]/.test(s)) return true
  if (s.includes('\n')) return true
  if (/^[\-\?:,\[\]{}#&*!|>'"%@`]/.test(s)) return true
  if (/#(\s|$)|:(\s|$)/.test(s)) return true
  if (/^[-+]?[0-9]/.test(s)) return true
  if (/^(true|True|TRUE|false|False|FALSE|null|Null|NULL|~|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF)$/.test(s)) return true
  return false
}

// Serializa um string como scalar YAML: aspas duplas simples (JSON.stringify
// emite exatamente os escapes \n \" \\ que o YAML aceita no mesmo formato).
function yamlString(s) {
  return quotePlain(s) ? JSON.stringify(s) : s
}

function yamlKey(k) {
  return quotePlain(k) ? JSON.stringify(k) : k
}

// array aninhado (array dentro de array, ou objeto inline) → notação flow
function flowArray(arr) {
  return '[' + arr.map(flowValue).join(', ') + ']'
}

function flowValue(n) {
  if (n === null) return 'null'
  if (typeof n === 'boolean') return n ? 'true' : 'false'
  if (typeof n === 'number') return String(n)
  if (typeof n === 'string') return yamlString(n)
  if (Array.isArray(n)) return flowArray(n)
  const keys = Object.keys(n)
  return '{ ' + keys.map((k) => yamlKey(k) + ': ' + flowValue(n[k])).join(', ') + ' }'
}

// ─── Emissor em bloco ────────────────────────────────────────────────────
// Regras de indentação (sempre crescente, então o YAML fica válido):
//  - objeto raiz / objeto sob chave: chaves na coluna `col`
//  - objeto item de array: chaves na coluna `col` (o "- " ocupa 2)
//  - array sob chave: travessões na coluna `col + UNIT`
//  - array item de array: inline
function renderYaml(value, opts) {
  const UNIT = opts.indent === 4 ? 4 : 2
  const lines = []
  if (opts.docStart) lines.push('---')

  const pad = (col) => ' '.repeat(col)

  const scalar = (v) => {
    if (v === null) return opts.keepNull ? '' : 'null'
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    if (typeof v === 'number') {
      const s = String(v)
      if (!Number.isFinite(v)) return JSON.stringify(s)
      return /^[0-9.eE+-]+$/.test(s) ? s : JSON.stringify(s)
    }
    return yamlString(v)
  }

  function emitObject(obj, col) {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      lines.push(pad(col) + '{}')
      return
    }
    for (const k of keys) {
      const v = obj[k]
      const head = pad(col) + yamlKey(k) + ':'
      if (v === null || typeof v !== 'object') {
        lines.push(head + ' ' + scalar(v))
      } else if (Array.isArray(v)) {
        if (v.length === 0) lines.push(head + ' []')
        else {
          lines.push(head)
          emitArray(v, col + UNIT)
        }
      } else {
        if (Object.keys(v).length === 0) lines.push(head + ' {}')
        else {
          lines.push(head)
          emitObject(v, col + UNIT)
        }
      }
    }
  }

  function emitArray(arr, col) {
    if (arr.length === 0) {
      lines.push(pad(col) + '[]')
      return
    }
    for (const item of arr) {
      if (item !== null && typeof item === 'object') {
        if (Array.isArray(item)) {
          if (item.length === 0) lines.push(pad(col) + '- []')
          else lines.push(pad(col) + '- ' + flowArray(item))
        } else if (Object.keys(item).length === 0) {
          lines.push(pad(col) + '- {}')
        } else {
          // objeto-item: primeira chave na coluna col+2 (após "- "), demais iguais
          emitObjectAsListItem(item, col)
        }
      } else {
        lines.push(pad(col) + '- ' + scalar(item))
      }
    }
  }

  // Objeto item de array: "key: value" sempre vive 2 colunas à frente do
  // travessão (a primeira linha é "- key:", as seguintes só "key:").
  function emitObjectAsListItem(obj, col) {
    const keys = Object.keys(obj)
    keys.forEach((k, i) => {
      const v = obj[k]
      const pre = i === 0 ? pad(col) + '- ' : pad(col + 2)
      if (v === null || typeof v !== 'object') {
        lines.push(pre + yamlKey(k) + ': ' + scalar(v))
      } else if (Array.isArray(v)) {
        if (v.length === 0) lines.push(pre + yamlKey(k) + ': []')
        else {
          lines.push(pre + yamlKey(k) + ':')
          emitArray(v, col + 2 + UNIT)
        }
      } else {
        if (Object.keys(v).length === 0) lines.push(pre + yamlKey(k) + ': {}')
        else {
          lines.push(pre + yamlKey(k) + ':')
          emitObject(v, col + 2 + UNIT)
        }
      }
    })
  }

  if (Array.isArray(value)) {
    emitArray(value, 0)
  } else if (value !== null && typeof value === 'object') {
    emitObject(value, 0)
  } else {
    lines.push(scalar(value))
  }
  return lines.join('\n')
}

const SOURCE_SNIPPET = `// JSON → YAML sem dependências, indo de nó em nó. A ideia: o YAML de
// bloco só precisa que cada nível aninhado tenha indentação crescente —
// scalar sai "inline", objeto vira "chave:" + bloco filho, array vira um
// item por linha com "- ". Objeto dentro de array recebe "- " na primeira
// propriedade e as outras alinhadas depois disso.
function serialize(node, col) {
  if (isScalar(node)) return colPad(col) + scalar(node)
  if (Array.isArray(node)) {
    if (!node.length) return [col + '[]']
    return node.map(function (item) {
      if (isPlainObject(item)) {
        var out = Object.keys(item).map(function (k, i) {
          var head = pad(col + (i === 0 ? 2 : UNIT)) + key(k) + ':'
          return isScalar(item[k])
            ? head + ' ' + scalar(item[k])
            : head + '\\n' + serialize(item[k], col + UNIT)
        })
        return col + '- ' + out.join('\\n')
      }
      return col + '- ' + scalar(item)      // scalar fora
    })
  }
  // objeto comum
}
// "chave: ' 5'" — cite apenas o que mudaria de tipo. Veja quotePlain().`

const translations = {
  pt: {
    title: 'JSON → YAML',
    intro: (
      <>
        Cola um JSON — response de API, config, payload — e gera o YAML
        equivalente pronto pra colar num pipeline de CI, Compose, Ansible ou
        k8s. Serialização própria e 100% client-side: objetos viram mapeamentos
        indentados, arrays viram listas <Text code>- item</Text>, strings só
        ganham aspas quando o parser leria outro tipo (números, booleans,{' '}
        <Text code>yes/no/on/off</Text>, chaves com <Text code>:</Text>/{' '}
        <Text code>#</Text>, etc.) e chaves esquisitas também saem citadas.
        Nada sai do navegador.
      </>
    ),
    input: 'JSON de entrada',
    sampleLabel: 'Exemplos:',
    options: 'Opções',
    indentLabel: 'Indentação',
    docStart: 'Prefixo de documento',
    docStartHint: 'Adiciona "---" no topo, o marcador de início de documento.',
    keepNull: 'null como placeholder',
    keepNullHint: 'Por padrão null vira "null"; com isto, vira linha vazia (ex.: "key:").',
    resultTitle: 'YAML gerado',
    sizeLabel: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    emptyHint: 'Cole um JSON válido acima pra gerar o YAML.',
    invalidJson: 'JSON inválido — confira chaves, vírgulas e aspas.',
    copy: 'Copiar',
    copied: 'Copiado!',
    alertTitle: 'Sobre as aspas e o tipo dos valores',
    alertBody: (
      <>
        YAML não tem "string implícita": um token sem aspas é interpretado
        conforme a forma (número, boolean, null...). O gerador então cita
        tudo que viraria outro tipo — <Text code>"123"</Text>, <Text code>"true"</Text>,{' '}
        <Text code>"on"</Text> (que vira boolean em YAML 1.1) — e deixa como
        scalar nativo os <Text code>true</Text>/<Text code>false</Text>/
        <Text code>null</Text> e números do JS. Pergunte: <Text code>#</Text>{' '}
        seguido de espaço e <Text code>:</Text> seguido de espaço (ou no fim)
        também exigem aspas. Array dentro de array vira lista inline{' '}
        <Text code>[1, 2]</Text> — comportamento válido e muito mais legível
        que <Text code>- - 1</Text> aninhado. Complementa o{' '}
        <Text code>json-formatter</Text> (formata JSON) e o{' '}
        <Text code>json-to-sql</Text> (emite INSERTs): nenhum deles produz o
        formato YAML consumido por Compose/CI/Ansible/k8s.
      </>
    ),
    algorithmTitle: 'Como funciona (algoritmo)',
    algorithmDesc:
      'Caminhada recursiva em profundidade emitindo uma linha por nó: scalar inline; objeto vira "chave:" + bloco aninhado com indentação maior; array vira "- item" uma linha por item; objeto dentro de array recebe "- " na primeira propriedade e as demais ficam alinhadas dois espaços depois do travessão.',
  },
  en: {
    title: 'JSON → YAML',
    intro: (
      <>
        Paste a JSON — an API response, config or payload — and get the
        equivalent YAML ready to drop into a CI pipeline, Compose, Ansible or
        k8s. Self-contained and 100% client-side: objects become indented
        block mappings, arrays become <Text code>-</Text> lists, strings only
        get quotes when a parser would read a different type (numbers,
        booleans, <Text code>yes/no/on/off</Text>, keys with <Text code>:</Text>/{' '}
        <Text code>#</Text>, etc.), and tricky keys get quoted too. Nothing
        leaves the browser.
      </>
    ),
    input: 'Input JSON',
    sampleLabel: 'Samples:',
    options: 'Options',
    indentLabel: 'Indentation',
    docStart: 'Document start',
    docStartHint: 'Adds "---" at the top, the YAML document start marker.',
    keepNull: 'null as placeholder',
    keepNullHint: 'By default null becomes "null"; with this on it becomes an empty value (e.g. "key:").',
    resultTitle: 'Generated YAML',
    sizeLabel: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    emptyHint: 'Paste valid JSON above to generate YAML.',
    invalidJson: 'Invalid JSON — check braces, commas and quotes.',
    copy: 'Copy',
    copied: 'Copied!',
    alertTitle: 'About quotes and value types',
    alertBody: (
      <>
        YAML has no implicit strings: a plain token is interpreted by the
        parser according to its shape (number, boolean, null...). The
        generator quotes anything that would flip meaning — <Text code>"123"</Text>,{' '}
        <Text code>"true"</Text>, <Text code>"on"</Text> (a boolean in YAML
        1.1) — while keeping the JavaScript <Text code>true</Text>/
        <Text code>false</Text>/<Text code>number</Text>/<Text code>null</Text>{' '}
        untouched. <Text code>#</Text> followed by a space and{' '}
        <Text code>:</Text> followed by a space (or at the end) also force
        quotes. Nested arrays become inline style <Text code>[1, 2]</Text>{' '}
        instead of deep <Text code>- - 1</Text>. Complements the{' '}
        <Text code>json-formatter</Text> (formats JSON) and the{' '}
        <Text code>json-to-sql</Text> (emits INSERTs): neither produces the
        YAML consumed by Compose/CI/Ansible/k8s.
      </>
    ),
    algorithmTitle: 'Under the hood (algorithm)',
    algorithmDesc:
      'Depth-first recursive walk emitting one line per node: scalars inline; objects become "key:" plus an indented nested block; arrays become an item per line ("- "); an object inside an array gets "- " on its first property and the rest are aligned two spaces past the dash.',
  },
}

export default function JsonToYamlPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLES[0].value)
  const [indent, setIndent] = useState(2)
  const [docStart, setDocStart] = useState(false)
  const [keepNull, setKeepNull] = useState(false)
  const [copied, setCopied] = useState(false)

  const opts = useMemo(
    () => ({ indent, docStart, keepNull }),
    [indent, docStart, keepNull]
  )

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, error: 'empty' }
    try {
      return { ok: true, value: JSON.parse(input) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [input])

  const output = useMemo(() => {
    if (!parsed.ok) return ''
    return renderYaml(parsed.value, opts)
  }, [parsed, opts])

  const bytes = useMemo(() => {
    return output ? new TextEncoder().encode(output).length : 0
  }, [output])

  async function handleCopy() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
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
            <Text type="secondary">{t.indentLabel}</Text>
            <Segmented
              value={indent}
              onChange={setIndent}
              options={[2, 4]}
            />
          </Space>
          <Space wrap>
            <Switch checked={keepNull} onChange={setKeepNull} />
            {t.keepNull}
          </Space>
          <Space wrap>
            <Switch checked={docStart} onChange={setDocStart} />
            {t.docStart}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40 }}>
            {t.docStartHint}
          </Text>
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.resultTitle}</span>
            {parsed.ok && output && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.sizeLabel(bytes)}
              </Text>
            )}
          </Space>
        }
        extra={
          parsed.ok && output ? (
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
            <code>{output}</code>
          </pre>
        )}
      </Card>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>jsonToYaml.js</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>{SOURCE_SNIPPET}</pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}