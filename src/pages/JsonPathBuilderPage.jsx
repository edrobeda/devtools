import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, Tree, Tag, Alert, Button, Collapse, Radio, message, Empty } from 'antd'
import { CopyOutlined, ClearOutlined, BranchesOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE_JSON = JSON.stringify(
  {
    store: {
      books: [
        { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 22.5, tags: ['js', 'classic'] },
        { title: 'Clean Code', author: 'Robert C. Martin', price: 33.9, tags: ['craft'] },
        { title: "You Don't Know JS", author: 'Kyle Simpson', price: 18.0, tags: ['js', 'deep-dive'] },
      ],
      location: { city: 'São Paulo', country: 'BR' },
    },
    users: [
      { id: 1, name: 'Ana', active: true },
      { id: 2, name: 'João', active: false },
    ],
  },
  null,
  2
)

const translations = {
  pt: {
    title: 'Construtor de JSON Path',
    intro: (
      <>
        Monte expressões JSONPath clicando nos nós de uma árvore visual — sem
        precisar digitar a sintaxe. Cole um JSON ou use o exemplo, expanda os
        nós e clique em qualquer chave/índice pra construir o caminho.
        Complementa o <Text code>json-path-explorer</Text> (que testa
        expressões coladas); aqui o caminho é <b>construído</b> interativamente.
      </>
    ),
    inputTitle: 'JSON de entrada',
    inputPlaceholder: 'Cole um JSON aqui…',
    loadSample: 'Usar exemplo',
    clear: 'Limpar',
    treeTitle: 'Árvore interativa',
    treeHint: 'Clique em qualquer nó pra adicionar ao caminho. Clique de novo pra remover.',
    pathTitle: 'Expressão gerada',
    notation: 'Notação',
    dotNotation: 'Ponto ( . )',
    bracketNotation: 'Colchete ( [ ] )',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    resultTitle: 'Valor no caminho',
    pathEmpty: 'Clique num nó da árvore pra selecionar um caminho.',
    noInput: 'Cole um JSON acima ou clique em "Usar exemplo".',
    parseError: 'JSON inválido',
    invalidJson: 'O texto não é um JSON válido.',
    howTitle: 'Como funciona',
    howBody: (
      <>
        A árvore é construída a partir do JSON com <Text code>JSON.parse</Text>.
        Cada nó mostra a chave (ou índice), o tipo do valor e um preview. A
        expressão gerada usa <Text code>$</Text> como raiz —{' '}
        <Text code>$.store.books[0].title</Text> acessa o título do primeiro
        livro. Clique em nós diferentes pra ver como o caminho muda. A notação
        de colchete <Text code>['chave']</Text> é usada quando a chave contém
        caracteres especiais, espaços ou não é um identificador válido.
      </>
    ),
    stats: 'nós',
    statsPath: 'caminho',
  },
  en: {
    title: 'JSON Path Builder',
    intro: (
      <>
        Build JSONPath expressions by clicking on visual tree nodes — no syntax
        to memorize. Paste JSON or use the sample, expand nodes, and click any
        key/index to construct the path. Complements{' '}
        <Text code>json-path-explorer</Text> (which evaluates pasted
        expressions); here the path is <b>built</b> interactively.
      </>
    ),
    inputTitle: 'JSON input',
    inputPlaceholder: 'Paste JSON here…',
    loadSample: 'Use sample',
    clear: 'Clear',
    treeTitle: 'Interactive tree',
    treeHint: 'Click any node to add it to the path. Click again to remove.',
    pathTitle: 'Generated expression',
    notation: 'Notation',
    dotNotation: 'Dot ( . )',
    bracketNotation: 'Bracket ( [ ] )',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    resultTitle: 'Value at path',
    pathEmpty: 'Click a tree node to select a path.',
    noInput: 'Paste JSON above or click "Use sample".',
    parseError: 'Invalid JSON',
    invalidJson: 'The text is not valid JSON.',
    howTitle: 'How it works',
    howBody: (
      <>
        The tree is built from JSON using <Text code>JSON.parse</Text>. Each
        node shows the key (or index), the value type, and a preview. The
        generated expression uses <Text code>$</Text> as root —{' '}
        <Text code>$.store.books[0].title</Text> accesses the first book's
        title. Click different nodes to see how the path changes. Bracket
        notation <Text code>['key']</Text> is used when the key contains
        special characters, spaces, or isn't a valid identifier.
      </>
    ),
    stats: 'nodes',
    statsPath: 'path',
  },
}

function isIdentifier(key) {
  return /^[A-Za-z_$][\w$]*$/.test(String(key))
}

function escapeBracket(key) {
  const s = String(key)
  if (/^\d+$/.test(s)) return s
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function buildTreeData(value, basePath, depth) {
  if (value === null) {
    return { title: `${basePath} = null`, key: basePath, isLeaf: true, value, type: 'null', depth }
  }
  if (typeof value === 'boolean') {
    return { title: `${basePath} = ${value}`, key: basePath, isLeaf: true, value, type: 'boolean', depth }
  }
  if (typeof value === 'number') {
    return { title: `${basePath} = ${value}`, key: basePath, isLeaf: true, value, type: 'number', depth }
  }
  if (typeof value === 'string') {
    const preview = value.length > 50 ? value.slice(0, 50) + '…' : value
    return { title: `${basePath} = "${preview}"`, key: basePath, isLeaf: true, value, type: 'string', depth }
  }
  if (Array.isArray(value)) {
    const children = value.map((item, idx) => {
      const childPath = `${basePath}[${idx}]`
      return buildTreeData(item, childPath, depth + 1)
    })
    return {
      title: `${basePath} (Array, ${value.length})`,
      key: basePath,
      children,
      type: 'array',
      depth,
    }
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    const children = keys.map((k) => {
      const childPath = isIdentifier(k) ? `${basePath}.${k}` : `${basePath}['${k}']`
      return buildTreeData(value[k], childPath, depth + 1)
    })
    return {
      title: `${basePath} (Object, ${keys.length})`,
      key: basePath,
      children,
      type: 'object',
      depth,
    }
  }
  return { title: basePath, key: basePath, isLeaf: true, value, type: typeof value, depth }
}

function getValueAtPath(obj, pathStr) {
  if (!pathStr || pathStr === '$') return obj
  const tokens = []
  const re = /\[['"]?([^'"]*?)['"]?\]|\.([A-Za-z_$][\w$]*)|\.(\d+)/g
  let m
  let remaining = pathStr.startsWith('$') ? pathStr.slice(1) : pathStr
  while ((m = re.exec(remaining)) !== null) {
    if (m[1] !== undefined) tokens.push(m[1])
    else if (m[2] !== undefined) tokens.push(m[2])
    else if (m[3] !== undefined) tokens.push(Number(m[3]))
  }
  let cur = obj
  for (const t of tokens) {
    if (cur === undefined || cur === null) return undefined
    cur = cur[t]
  }
  return cur
}

function formatValue(v) {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'string') return `"${v.length > 120 ? v.slice(0, 120) + '…' : v}"`
  if (typeof v === 'object') {
    try {
      const s = JSON.stringify(v)
      return s.length > 120 ? s.slice(0, 120) + '…' : s
    } catch { return String(v) }
  }
  return String(v)
}

export default function JsonPathBuilderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState('')
  const [selectedPath, setSelectedPath] = useState(null)
  const [notation, setNotation] = useState('dot')

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, data: null }
    try {
      return { ok: true, data: JSON.parse(input) }
    } catch {
      return { ok: false, data: null }
    }
  }, [input])

  const treeData = useMemo(() => {
    if (!parsed.ok) return []
    return [buildTreeData(parsed.data, '$', 0)]
  }, [parsed])

  const nodeCount = useMemo(() => {
    if (!parsed.ok) return 0
    let count = 0
    const walk = (v) => {
      count++
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) v.forEach(walk)
        else Object.values(v).forEach(walk)
      }
    }
    walk(parsed.data)
    return count
  }, [parsed])

  const handleSelect = useCallback((keys) => {
    if (keys.length > 0) {
      setSelectedPath(keys[0])
    } else {
      setSelectedPath(null)
    }
  }, [])

  const pathValue = useMemo(() => {
    if (!parsed.ok || !selectedPath) return undefined
    return getValueAtPath(parsed.data, selectedPath)
  }, [parsed, selectedPath])

  const handleCopy = useCallback(() => {
    if (!selectedPath) return
    navigator.clipboard.writeText(selectedPath).then(() => {
      message.success(t.copied)
    }).catch(() => {
      message.error(t.copyErr)
    })
  }, [selectedPath, t])

  const loadSample = useCallback(() => {
    setInput(SAMPLE_JSON)
    setSelectedPath(null)
  }, [])

  const handleClear = useCallback(() => {
    setInput('')
    setSelectedPath(null)
  }, [])

  const treeIcon = useCallback((nodeData) => {
    if (!nodeData.type) return null
    const colors = { string: 'green', number: 'blue', boolean: 'orange', null: 'default', array: 'purple', object: 'cyan' }
    const labels = { string: 'str', number: 'num', boolean: 'bool', null: 'null', array: 'arr', object: 'obj' }
    return <Tag color={colors[nodeData.type] || 'default'} style={{ marginLeft: 8, fontSize: 10, lineHeight: '16px' }}>{labels[nodeData.type] || nodeData.type}</Tag>
  }, [])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Title level={2}>
        <BranchesOutlined style={{ marginRight: 8 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={t.inputTitle} size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            rows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space>
            <Button onClick={loadSample} size="small">{t.loadSample}</Button>
            <Button onClick={handleClear} icon={<ClearOutlined />} size="small">{t.clear}</Button>
            {parsed.ok && <Tag color="green">{nodeCount} {t.stats}</Tag>}
          </Space>
        </Space>
      </Card>

      {!input.trim() && (
        <Alert type="info" showIcon message={t.noInput} />
      )}

      {input.trim() && !parsed.ok && (
        <Alert type="error" showIcon message={t.parseError} description={t.invalidJson} />
      )}

      {parsed.ok && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Card title={t.treeTitle} size="small" style={{ flex: 1, minWidth: 340 }}>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>{t.treeHint}</Paragraph>
            <div style={{ maxHeight: 460, overflow: 'auto' }}>
              <Tree
                treeData={treeData}
                onSelect={handleSelect}
                selectedKeys={selectedPath ? [selectedPath] : []}
                defaultExpandAll
                showLine
                switcherIcon={<span />}
                titleRender={(nodeData) => (
                  <Space size={4}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{nodeData.title}</span>
                    {treeIcon(nodeData)}
                  </Space>
                )}
              />
            </div>
          </Card>

          <Card title={t.pathTitle} size="small" style={{ flex: 1, minWidth: 340 }}>
            <Radio.Group
              value={notation}
              onChange={(e) => setNotation(e.target.value)}
              size="small"
              style={{ marginBottom: 12 }}
            >
              <Radio.Button value="dot">{t.dotNotation}</Radio.Button>
              <Radio.Button value="bracket">{t.bracketNotation}</Radio.Button>
            </Radio.Group>

            {selectedPath ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: '12px 16px',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  wordBreak: 'break-all',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{selectedPath}</span>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                    style={{ color: '#d4d4d4', flexShrink: 0 }}
                  />
                </div>

                <Card size="small" type="inner" title={t.resultTitle}>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', background: '#f6f8fa', padding: '8px 12px', borderRadius: 4 }}>
                    {pathValue !== undefined ? formatValue(pathValue) : <Text type="secondary">undefined</Text>}
                  </div>
                  {pathValue !== undefined && pathValue !== null && typeof pathValue === 'object' && (
                    <Tag color="blue" style={{ marginTop: 8 }}>
                      {Array.isArray(pathValue) ? `Array[${pathValue.length}]` : `Object(${Object.keys(pathValue).length})`}
                    </Tag>
                  )}
                </Card>
              </Space>
            ) : (
              <Empty description={t.pathEmpty} style={{ marginTop: 32 }} />
            )}
          </Card>
        </div>
      )}

      <Collapse size="small" items={[{ key: 'how', header: t.howTitle, children: t.howBody }]} />
    </Space>
  )
}
