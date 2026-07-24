import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Alert, Tree } from 'antd'
import { FolderOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Visualizador de Árvore JSON',
    intro: (
      <>
        Cola um JSON e navega pela estrutura como uma árvore colapsável —
        útil pra explorar payloads grandes sem rolar um bloco de texto
        gigante. Tudo processado localmente via <Text code>JSON.parse</Text>.
      </>
    ),
    placeholder: 'Cole o JSON aqui',
    invalidTitle: 'JSON inválido',
    empty: 'Cole um JSON acima para ver a árvore.',
  },
  en: {
    title: 'JSON Tree Viewer',
    intro: (
      <>
        Paste a JSON and browse the structure as a collapsible tree —
        useful for exploring large payloads without scrolling through a
        giant text block. All processed locally via{' '}
        <Text code>JSON.parse</Text>.
      </>
    ),
    placeholder: 'Paste the JSON here',
    invalidTitle: 'Invalid JSON',
    empty: 'Paste a JSON above to see the tree.',
  },
}

let keyCounter = 0

function valueLabel(value) {
  if (value === null) return <Text type="secondary">null</Text>
  if (typeof value === 'string') return <Text type="success">"{value}"</Text>
  if (typeof value === 'number') return <Text style={{ color: '#1677ff' }}>{value}</Text>
  if (typeof value === 'boolean') return <Text style={{ color: '#722ed1' }}>{String(value)}</Text>
  return null
}

function buildNodes(value, keyPrefix) {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const nodeKey = `${keyPrefix}-${index}-${keyCounter++}`
      const isContainer = item !== null && typeof item === 'object'
      return {
        key: nodeKey,
        title: (
          <span>
            <Text strong>[{index}]</Text>{' '}
            {!isContainer && valueLabel(item)}
            {isContainer && <Text type="secondary">{Array.isArray(item) ? `Array(${item.length})` : `Object{${Object.keys(item).length}}`}</Text>}
          </span>
        ),
        children: isContainer ? buildNodes(item, nodeKey) : undefined,
      }
    })
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => {
      const nodeKey = `${keyPrefix}-${key}-${keyCounter++}`
      const isContainer = item !== null && typeof item === 'object'
      return {
        key: nodeKey,
        title: (
          <span>
            <Text strong>{key}</Text>:{' '}
            {!isContainer && valueLabel(item)}
            {isContainer && <Text type="secondary">{Array.isArray(item) ? `Array(${item.length})` : `Object{${Object.keys(item).length}}`}</Text>}
          </span>
        ),
        children: isContainer ? buildNodes(item, nodeKey) : undefined,
      }
    })
  }
  return []
}

export default function JsonTreeViewerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('{\n  "name": "devtools",\n  "tags": ["react", "vite"],\n  "active": true,\n  "meta": { "version": 1 }\n}')

  const { treeData, error } = useMemo(() => {
    if (!input.trim()) return { treeData: null, error: null }
    try {
      keyCounter = 0
      const parsed = JSON.parse(input)
      const isContainer = parsed !== null && typeof parsed === 'object'
      const treeData = isContainer
        ? buildNodes(parsed, 'root')
        : [{ key: 'root', title: valueLabel(parsed) }]
      return { treeData, error: null }
    } catch (err) {
      return { treeData: null, error: err.message }
    }
  }, [input])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FolderOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {error && <Alert type="error" showIcon message={t.invalidTitle} description={error} />}

      {treeData && (
        <Card>
          <Tree treeData={treeData} defaultExpandAll showLine />
        </Card>
      )}

      {!input.trim() && <Text type="secondary">{t.empty}</Text>}
    </Space>
  )
}
