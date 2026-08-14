import React, { useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  List as AntList,
  Alert,
  Tag,
  Row,
  Col,
} from 'antd'
import {
  CodeOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  SortAscendingOutlined,
  RollbackOutlined,
  ClearOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import useList from '../hooks/useList'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useList(initialValue = []) {
  const [list, setList] = useState(initialValue)

  const set = useCallback((value) => {
    setList(value)
  }, [])

  const push = useCallback((value) => {
    setList((prev) => [...prev, value])
  }, [])

  const unshift = useCallback((value) => {
    setList((prev) => [value, ...prev])
  }, [])

  const insertAt = useCallback((index, value) => {
    setList((prev) => {
      const next = [...prev]
      next.splice(index, 0, value)
      return next
    })
  }, [])

  const updateAt = useCallback((index, value) => {
    setList((prev) => {
      if (index < 0 || index >= prev.length) return prev
      if (prev[index] === value) return prev
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const removeAt = useCallback((index) => {
    setList((prev) => {
      if (index < 0 || index >= prev.length) return prev
      return [...prev.slice(0, index), ...prev.slice(index + 1)]
    })
  }, [])

  const remove = useCallback((value) => {
    setList((prev) => prev.filter((item) => item !== value))
  }, [])

  const move = useCallback((from, to) => {
    setList((prev) => {
      if (from < 0 || from >= prev.length ||
          to < 0 || to >= prev.length ||
          from === to) {
        return prev
      }
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const swap = useCallback((indexA, indexB) => {
    setList((prev) => {
      if (indexA < 0 || indexA >= prev.length ||
          indexB < 0 || indexB >= prev.length ||
          indexA === indexB) {
        return prev
      }
      const next = [...prev]
      ;[next[indexA], next[indexB]] = [next[indexB], next[indexA]]
      return next
    })
  }, [])

  const filter = useCallback((predicate) => {
    setList((prev) => prev.filter(predicate))
  }, [])

  const sort = useCallback((compareFn) => {
    setList((prev) => [...prev].sort(compareFn))
  }, [])

  const reverse = useCallback(() => {
    setList((prev) => [...prev].reverse())
  }, [])

  const clear = useCallback(() => {
    setList([])
  }, [])

  const reset = useCallback(() => {
    setList(initialValue)
  }, [initialValue])

  return {
    list,
    set,
    push,
    unshift,
    insertAt,
    updateAt,
    removeAt,
    remove,
    move,
    swap,
    filter,
    sort,
    reverse,
    clear,
    reset,
  }
}`

const EXAMPLE_ITEMS = {
  pt: ['React', 'Vue', 'Angular', 'Svelte'],
  en: ['React', 'Vue', 'Angular', 'Svelte'],
}

const translations = {
  pt: {
    title: 'Snippet: useList',
    intro: (
      <>
        Hook utilitário para gerenciar arrays no React com uma API semântica.
        Útil para listas dinâmicas, filas de tarefas, ordenações manuais,
        filtros rápidos e qualquer estado baseado em coleção ordenada. Expõe{' '}
        <Text code>push</Text>, <Text code>unshift</Text>,{' '}
        <Text code>insertAt</Text>, <Text code>updateAt</Text>,{' '}
        <Text code>removeAt</Text>, <Text code>remove</Text>,{' '}
        <Text code>move</Text>, <Text code>swap</Text>, <Text code>filter</Text>,{' '}
        <Text code>sort</Text>, <Text code>reverse</Text>,{' '}
        <Text code>clear</Text>, <Text code>reset</Text> e o array{' '}
        <Text code>list</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração interativa',
    addPlaceholder: 'Novo item',
    add: 'Adicionar',
    clear: 'Limpar',
    reset: 'Reset',
    sort: 'Ordenar A-Z',
    reverse: 'Inverter',
    empty: 'A lista está vazia.',
    itemCount: 'Itens',
    note: (
      <>
        Todas as operações usam o updater do <Text code>useState</Text> e
        retornam uma nova referência apenas quando o array realmente muda.
        Operações inválidas (índices fora dos limites, swap no mesmo índice
        etc.) são ignoradas silenciosamente.
      </>
    ),
  },
  en: {
    title: 'Snippet: useList',
    intro: (
      <>
        A utility hook for managing arrays in React with a semantic API. Great
        for dynamic lists, task queues, manual reordering, quick filters, and
        any ordered collection state. Exposes <Text code>push</Text>,{' '}
        <Text code>unshift</Text>, <Text code>insertAt</Text>,{' '}
        <Text code>updateAt</Text>, <Text code>removeAt</Text>,{' '}
        <Text code>remove</Text>, <Text code>move</Text>, <Text code>swap</Text>,{' '}
        <Text code>filter</Text>, <Text code>sort</Text>,{' '}
        <Text code>reverse</Text>, <Text code>clear</Text>,{' '}
        <Text code>reset</Text> and the <Text code>list</Text> array.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Interactive demo',
    addPlaceholder: 'New item',
    add: 'Add',
    clear: 'Clear',
    reset: 'Reset',
    sort: 'Sort A-Z',
    reverse: 'Reverse',
    empty: 'The list is empty.',
    itemCount: 'Items',
    note: (
      <>
        All operations use the <Text code>useState</Text> updater and only
        return a new reference when the array actually changes. Invalid
        operations (out-of-bounds indexes, swapping the same index, etc.) are
        silently ignored.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const { lang } = useLanguage()
  const { list, push, removeAt, move, swap, sort, reverse, clear, reset } =
    useList(EXAMPLE_ITEMS[lang])
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    const value = newItem.trim()
    if (!value) return
    push(value)
    setNewItem('')
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[8, 8]}>
        <Col flex="auto">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onPressEnter={handleAdd}
            placeholder={t.addPlaceholder}
          />
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t.add}
          </Button>
        </Col>
      </Row>

      <Space wrap>
        <Button icon={<SortAscendingOutlined />} onClick={() => sort((a, b) => a.localeCompare(b))}>
          {t.sort}
        </Button>
        <Button icon={<SwapOutlined />} onClick={reverse}>
          {t.reverse}
        </Button>
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
          <Text>
            {t.itemCount}: <Text code>{list.length}</Text>
          </Text>
        }
      />

      <AntList
        bordered
        locale={{ emptyText: t.empty }}
        dataSource={list}
        renderItem={(item, index) => (
          <AntList.Item
            actions={[
              <Button
                key="up"
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              />,
              <Button
                key="down"
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={index === list.length - 1}
                onClick={() => move(index, index + 1)}
              />,
              <Button
                key="swap"
                size="small"
                icon={<SwapOutlined />}
                disabled={list.length < 2}
                onClick={() => swap(index, (index + 1) % list.length)}
              />,
              <Button
                key="delete"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeAt(index)}
              />,
            ]}
          >
            <Tag color="blue">{index}</Tag>
            <Text>{item}</Text>
          </AntList.Item>
        )}
      />

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseListSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
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
