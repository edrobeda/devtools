import React, { useState } from 'react'
import { Typography, Card, Space, Button, Tag, Alert, Input, InputNumber, List } from 'antd'
import { CodeOutlined, RedoOutlined, ClearOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import useMap from '../hooks/useMap'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useMap(initialValue = []) {
  const [map, setMap] = useState(() => new Map(initialValue))

  const set = useCallback((key, value) => {
    setMap((prev) => {
      if (prev.has(key) && Object.is(prev.get(key), value)) return prev
      const next = new Map(prev)
      next.set(key, value)
      return next
    })
  }, [])

  const setAll = useCallback((entries) => {
    setMap(new Map(entries))
  }, [])

  const remove = useCallback((key) => {
    setMap((prev) => {
      if (!prev.has(key)) return prev
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setMap((prev) => (prev.size === 0 ? prev : new Map()))
  }, [])

  const reset = useCallback(() => {
    setMap(new Map(initialValue))
  }, [initialValue])

  const has = useCallback((key) => map.has(key), [map])

  const get = useCallback((key) => map.get(key), [map])

  return {
    map,
    entries: Array.from(map.entries()),
    keys: Array.from(map.keys()),
    values: Array.from(map.values()),
    size: map.size,
    set,
    setAll,
    remove,
    clear,
    reset,
    has,
    get,
  }
}

// uso:
// const { entries, set, remove, has, clear, reset, size } = useMap([['a', 1]])
// set('b', 2)   // adiciona ou atualiza
// has('a')      // boolean
// get('a')      // 1`;

const INITIAL = {
  pt: [
    ['Café', 10],
    ['Açúcar', 5],
    ['Leite', 3],
  ],
  en: [
    ['Coffee', 10],
    ['Sugar', 5],
    ['Milk', 3],
  ],
}

const translations = {
  pt: {
    title: 'Snippet: useMap',
    intro: (
      <>
        Hook utilitário que encapsula um{' '}
        <Text code>Map</Text> do JavaScript de forma reativa. Útil para
        estados com pares chave/valor — estoques, caches locais, dicionários,
        parâmetros de formulário — onde é preciso ler, inserir, atualizar e
        remover por chave. A API expõe <Text code>set</Text>,{' '}
        <Text code>setAll</Text>, <Text code>remove</Text>,{' '}
        <Text code>clear</Text>, <Text code>reset</Text>,{' '}
        <Text code>has</Text> e <Text code>get</Text>, além de{' '}
        <Text code>entries</Text>, <Text code>keys</Text>,{' '}
        <Text code>values</Text> e <Text code>size</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Gerencie um estoque simples de produtos e quantidades:',
    productPlaceholder: 'Produto',
    quantityPlaceholder: 'Qtd',
    add: 'Adicionar / Atualizar',
    empty: 'Estoque vazio',
    total: 'Total de itens',
    totalUnits: 'Unidades em estoque',
    clear: 'Limpar',
    reset: 'Reset',
    note: (
      <>
        As funções <Text code>set</Text> e <Text code>remove</Text> usam o
        updater do <Text code>useState</Text> e só criam um novo{' '}
        <Text code>Map</Text> quando o valor realmente muda, preservando a
        referência estável em renders consecutivos sem alteração.
      </>
    ),
  },
  en: {
    title: 'Snippet: useMap',
    intro: (
      <>
        A utility hook that wraps a JavaScript{' '}
        <Text code>Map</Text> in a reactive React state. Useful for key/value
        states — inventories, local caches, dictionaries, form parameters —
        where you need to read, insert, update and remove by key. The API
        exposes <Text code>set</Text>, <Text code>setAll</Text>,{' '}
        <Text code>remove</Text>, <Text code>clear</Text>,{' '}
        <Text code>reset</Text>, <Text code>has</Text> and{' '}
        <Text code>get</Text>, plus <Text code>entries</Text>,{' '}
        <Text code>keys</Text>, <Text code>values</Text> and{' '}
        <Text code>size</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Manage a simple product stock with quantities:',
    productPlaceholder: 'Product',
    quantityPlaceholder: 'Qty',
    add: 'Add / Update',
    empty: 'Stock is empty',
    total: 'Total items',
    totalUnits: 'Units in stock',
    clear: 'Clear',
    reset: 'Reset',
    note: (
      <>
        The <Text code>set</Text> and <Text code>remove</Text> functions use
        the <Text code>useState</Text> updater and only create a new{' '}
        <Text code>Map</Text> when the value actually changes, keeping the
        reference stable across unchanged renders.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const { lang } = useLanguage()
  const { entries, set, remove, clear, reset, size } = useMap(INITIAL[lang])

  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState(1)

  const totalUnits = entries.reduce((sum, [, qty]) => sum + (Number(qty) || 0), 0)

  const handleAdd = () => {
    const key = product.trim()
    if (!key) return
    set(key, quantity)
    setProduct('')
    setQuantity(1)
  }

  const handleRemove = (key) => remove(key)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Input
          placeholder={t.productPlaceholder}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          onPressEnter={handleAdd}
          style={{ width: 160 }}
        />
        <InputNumber
          min={0}
          placeholder={t.quantityPlaceholder}
          value={quantity}
          onChange={(value) => setQuantity(value ?? 0)}
          onPressEnter={handleAdd}
          style={{ width: 80 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t.add}
        </Button>
      </Space>

      <List
        bordered
        size="small"
        locale={{ emptyText: t.empty }}
        dataSource={entries}
        renderItem={([key, value]) => (
          <List.Item
            actions={[
              <Button
                key="delete"
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(key)}
              />,
            ]}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              <Text strong style={{ flex: 1 }}>{key}</Text>
              <Tag color="blue">{value}</Tag>
            </div>
          </List.Item>
        )}
      />

      <Space wrap>
        <Button icon={<ClearOutlined />} onClick={clear}>
          {t.clear}
        </Button>
        <Button icon={<RedoOutlined />} onClick={reset}>
          {t.reset}
        </Button>
      </Space>

      <Alert
        type="info"
        showIcon
        message={
          <Space>
            <span>{t.total}:</span>
            <Tag color="blue">{size}</Tag>
            <span>{t.totalUnits}:</span>
            <Tag color="green">{totalUnits}</Tag>
          </Space>
        }
      />
      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseMapSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
