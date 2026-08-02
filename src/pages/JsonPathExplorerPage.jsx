import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Table, Alert, Tag, Button, message } from 'antd'
import { PartitionOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE_JSON = JSON.stringify(
  {
    store: {
      books: [
        { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 22.5, tags: ['js', 'classic'] },
        { title: 'Clean Code', author: 'Robert C. Martin', price: 33.9, tags: ['craft'] },
        { title: 'You Don\'t Know JS', author: 'Kyle Simpson', price: 18.0, tags: ['js', 'deep-dive'] },
      ],
      location: { city: 'São Paulo', country: 'BR' },
    },
  },
  null,
  2
)

function isIdentifier(key) {
  return /^[A-Za-z_$][\w$]*$/.test(key)
}

function formatChildPath(base, key) {
  return isIdentifier(String(key)) ? `${base}.${key}` : `${base}['${key}']`
}

function collectRecursive(value, path, name) {
  const results = []
  function walk(v, p) {
    if (v && typeof v === 'object') {
      if (Array.isArray(v)) {
        v.forEach((item, idx) => {
          const childPath = `${p}[${idx}]`
          if (name === '*') results.push({ path: childPath, value: item })
          walk(item, childPath)
        })
      } else {
        Object.keys(v).forEach((key) => {
          const childPath = formatChildPath(p, key)
          if (name === '*' || key === name) results.push({ path: childPath, value: v[key] })
          walk(v[key], childPath)
        })
      }
    }
  }
  walk(value, path)
  return results
}

// Tokenizer de um subconjunto de JSONPath: $, ., .. (recursive descent),
// [*], [n], [n,m], [start:end], ['prop']. Não cobre filtros ?() nem
// expressões de script — o objetivo é explorar estrutura, não avaliar código.
function tokenize(path) {
  const tokens = []
  let i = 0
  if (path[0] === '$') {
    tokens.push({ type: 'root' })
    i = 1
  }
  while (i < path.length) {
    if (path[i] === '.' && path[i + 1] === '.') {
      i += 2
      const m = path.slice(i).match(/^(\*|[A-Za-z_$][\w$]*)/)
      if (m) {
        tokens.push({ type: 'recursive', name: m[1] })
        i += m[0].length
      } else {
        tokens.push({ type: 'recursive', name: '*' })
      }
      continue
    }
    if (path[i] === '.') {
      i += 1
      const m = path.slice(i).match(/^(\*|[A-Za-z_$][\w$]*)/)
      if (m) {
        tokens.push({ type: m[1] === '*' ? 'wildcard' : 'child', name: m[1] })
        i += m[0].length
        continue
      }
    }
    if (path[i] === '[') {
      const end = path.indexOf(']', i)
      if (end === -1) break
      const inner = path.slice(i + 1, end).trim()
      i = end + 1
      if (inner === '*') {
        tokens.push({ type: 'wildcard' })
      } else if (/^(['"]).*\1$/.test(inner)) {
        tokens.push({ type: 'child', name: inner.slice(1, -1) })
      } else if (inner.includes(':')) {
        const [s, e] = inner.split(':')
        tokens.push({
          type: 'slice',
          start: s === '' ? undefined : parseInt(s, 10),
          end: e === '' ? undefined : parseInt(e, 10),
        })
      } else if (inner.includes(',')) {
        tokens.push({ type: 'index', indices: inner.split(',').map((s) => parseInt(s.trim(), 10)) })
      } else if (/^-?\d+$/.test(inner)) {
        tokens.push({ type: 'index', indices: [parseInt(inner, 10)] })
      }
      continue
    }
    i += 1
  }
  return tokens
}

function applyToken(token, match) {
  const { path, value } = match
  if (token.type === 'child') {
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, token.name)) {
      return [{ path: formatChildPath(path, token.name), value: value[token.name] }]
    }
    if (Array.isArray(value) && token.name === 'length') {
      return [{ path: `${path}.length`, value: value.length }]
    }
    return []
  }
  if (token.type === 'wildcard') {
    if (Array.isArray(value)) return value.map((v, idx) => ({ path: `${path}[${idx}]`, value: v }))
    if (value && typeof value === 'object') return Object.entries(value).map(([k, v]) => ({ path: formatChildPath(path, k), value: v }))
    return []
  }
  if (token.type === 'index') {
    if (!Array.isArray(value)) return []
    return token.indices
      .map((idx) => (idx < 0 ? value.length + idx : idx))
      .filter((idx) => idx >= 0 && idx < value.length)
      .map((idx) => ({ path: `${path}[${idx}]`, value: value[idx] }))
  }
  if (token.type === 'slice') {
    if (!Array.isArray(value)) return []
    const start = token.start ?? 0
    const end = token.end ?? value.length
    const out = []
    for (let idx = Math.max(start, 0); idx < end && idx < value.length; idx++) {
      out.push({ path: `${path}[${idx}]`, value: value[idx] })
    }
    return out
  }
  if (token.type === 'recursive') {
    return collectRecursive(value, path, token.name)
  }
  return []
}

function evaluateJsonPath(root, path) {
  const tokens = tokenize(path.trim())
  let matches = [{ path: '$', value: root }]
  const rest = tokens[0]?.type === 'root' ? tokens.slice(1) : tokens
  for (const token of rest) {
    const next = []
    for (const m of matches) next.push(...applyToken(token, m))
    matches = next
  }
  return matches
}

const translations = {
  pt: {
    title: 'JSON Path Explorer',
    intro: (
      <>
        Testa uma expressão <Text code>JSONPath</Text> contra um JSON colado
        e mostra todos os caminhos e valores que combinam. Cobre um
        subconjunto prático da sintaxe — <Text code>$</Text>,{' '}
        <Text code>.prop</Text>, <Text code>..prop</Text> (recursive
        descent), <Text code>[*]</Text>, <Text code>[n]</Text>,{' '}
        <Text code>[n,m]</Text>, <Text code>[start:end]</Text> e{' '}
        <Text code>['prop']</Text> — sem filtros <Text code>?()</Text> ou
        expressões de script, pra não precisar de <Text code>eval</Text>.
      </>
    ),
    jsonLabel: 'JSON de entrada',
    pathLabel: 'Expressão JSONPath',
    invalidJson: 'JSON inválido',
    matches: (n) => `${n} ${n === 1 ? 'resultado' : 'resultados'}`,
    noMatches: 'Nenhum resultado pra esse caminho',
    col: { path: 'Caminho', value: 'Valor' },
    copy: 'Copiar',
    copied: 'Valor copiado',
    refTitle: 'Sintaxe suportada',
    refRows: [
      { syntax: '$', desc: 'Raiz do documento' },
      { syntax: '.prop / ["prop"]', desc: 'Acessa uma propriedade pelo nome' },
      { syntax: '..prop', desc: 'Busca "prop" em qualquer profundidade (recursive descent)' },
      { syntax: '..*', desc: 'Todos os nós descendentes, em qualquer profundidade' },
      { syntax: '[*]', desc: 'Todos os itens de um array, ou todos os valores de um objeto' },
      { syntax: '[0], [-1]', desc: 'Item por índice (negativo conta a partir do fim)' },
      { syntax: '[0,2,4]', desc: 'Lista de índices específicos' },
      { syntax: '[1:3]', desc: 'Slice de array (fim exclusivo, igual Array.slice)' },
    ],
  },
  en: {
    title: 'JSON Path Explorer',
    intro: (
      <>
        Tests a <Text code>JSONPath</Text> expression against a pasted JSON
        and shows every matching path and value. Covers a practical subset
        of the syntax — <Text code>$</Text>, <Text code>.prop</Text>,{' '}
        <Text code>..prop</Text> (recursive descent), <Text code>[*]</Text>,{' '}
        <Text code>[n]</Text>, <Text code>[n,m]</Text>,{' '}
        <Text code>[start:end]</Text> and <Text code>['prop']</Text> — no{' '}
        <Text code>?()</Text> filters or script expressions, so it never
        needs <Text code>eval</Text>.
      </>
    ),
    jsonLabel: 'Input JSON',
    pathLabel: 'JSONPath expression',
    invalidJson: 'Invalid JSON',
    matches: (n) => `${n} ${n === 1 ? 'match' : 'matches'}`,
    noMatches: 'No matches for this path',
    col: { path: 'Path', value: 'Value' },
    copy: 'Copy',
    copied: 'Value copied',
    refTitle: 'Supported syntax',
    refRows: [
      { syntax: '$', desc: 'Document root' },
      { syntax: '.prop / ["prop"]', desc: 'Access a property by name' },
      { syntax: '..prop', desc: 'Find "prop" at any depth (recursive descent)' },
      { syntax: '..*', desc: 'Every descendant node, at any depth' },
      { syntax: '[*]', desc: 'Every item in an array, or every value in an object' },
      { syntax: '[0], [-1]', desc: 'Item by index (negative counts from the end)' },
      { syntax: '[0,2,4]', desc: 'A list of specific indices' },
      { syntax: '[1:3]', desc: 'Array slice (end exclusive, like Array.slice)' },
    ],
  },
}

export default function JsonPathExplorerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [jsonText, setJsonText] = useState(SAMPLE_JSON)
  const [path, setPath] = useState('$.store.books[*].author')

  const { root, error } = useMemo(() => {
    try {
      return { root: JSON.parse(jsonText), error: null }
    } catch (e) {
      return { root: null, error: e.message }
    }
  }, [jsonText])

  const matches = useMemo(() => {
    if (error) return []
    try {
      return evaluateJsonPath(root, path)
    } catch {
      return []
    }
  }, [root, path, error])

  function copyValue(value) {
    navigator.clipboard.writeText(typeof value === 'string' ? value : JSON.stringify(value))
    message.success(t.copied)
  }

  const columns = [
    { title: t.col.path, dataIndex: 'path', key: 'path', render: (v) => <Text code>{v}</Text> },
    {
      title: t.col.value,
      dataIndex: 'value',
      key: 'value',
      render: (v) => (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(v)}
        </pre>
      ),
    },
    {
      title: '',
      key: 'copy',
      width: 40,
      render: (_, row) => <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyValue(row.value)} />,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PartitionOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.jsonLabel}</Text>
            <TextArea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              autoSize={{ minRows: 8, maxRows: 16 }}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
            />
            {error && <Alert style={{ marginTop: 8 }} type="error" showIcon message={`${t.invalidJson}: ${error}`} />}
          </div>
          <div>
            <Text strong>{t.pathLabel}</Text>
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
            />
          </div>
        </Space>
      </Card>

      <Card title={t.matches(matches.length)}>
        {matches.length === 0 ? (
          <Text type="secondary">{t.noMatches}</Text>
        ) : (
          <Table
            columns={columns}
            dataSource={matches.map((m, i) => ({ ...m, key: i }))}
            pagination={matches.length > 10 ? { pageSize: 10 } : false}
            size="small"
          />
        )}
      </Card>

      <Card title={t.refTitle}>
        <Table
          columns={[
            { title: 'Syntax', dataIndex: 'syntax', key: 'syntax', render: (v) => <Text code>{v}</Text> },
            { title: '', dataIndex: 'desc', key: 'desc' },
          ]}
          dataSource={t.refRows.map((r, i) => ({ ...r, key: i }))}
          pagination={false}
          size="small"
          showHeader={false}
        />
      </Card>
    </Space>
  )
}
