import React, { useRef, useState } from 'react'
import { Typography, Card, Space, Input, InputNumber, Button, Tag, List, Alert } from 'antd'
import { SortAscendingOutlined, DeleteOutlined, EyeOutlined, ExperimentOutlined, ClearOutlined } from '@ant-design/icons'
import { PriorityQueue } from '../utils/priorityQueue'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `// Fila de prioridade mínima sobre um Binary Heap (array indexado em 0).
// Nó i: pai = (i-1)>>1, filhos = 2i+1 e 2i+2. Heap property: todo pai
// "vem antes" dos filhos segundo o comparator — aqui, prioridade menor primeiro.
export class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = []
    this.comparator = comparator
  }

  get size() {
    return this.heap.length
  }

  isEmpty() {
    return this.heap.length === 0
  }

  peek() {
    return this.heap[0]
  }

  push(item) {
    this.heap.push(item)
    this._siftUp(this.heap.length - 1)
    return this
  }

  pop() {
    if (this.heap.length === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()
    if (this.heap.length > 0) {
      this.heap[0] = last
      this._siftDown(0)
    }
    return top
  }

  toArray() {
    return [...this.heap]
  }

  // Constrói o heap a partir de um array qualquer em O(n) (heapify):
  // sift-down de cada pai, da última folha-nível para a raiz.
  static fromArray(items, comparator) {
    const q = new PriorityQueue(comparator)
    q.heap = [...items]
    const n = q.heap.length
    for (let i = (n >> 1) - 1; i >= 0; i--) q._siftDown(i)
    return q
  }

  _less(i, j) {
    return this.comparator(this.heap[i], this.heap[j]) < 0
  }

  _swap(i, j) {
    const tmp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = tmp
  }

  _siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this._less(i, parent)) {
        this._swap(i, parent)
        i = parent
      } else {
        break
      }
    }
  }

  _siftDown(i) {
    const n = this.heap.length
    for (;;) {
      const l = 2 * i + 1
      const r = l + 1
      let smallest = i
      if (l < n && this._less(l, smallest)) smallest = l
      if (r < n && this._less(r, smallest)) smallest = r
      if (smallest === i) break
      this._swap(i, smallest)
      i = smallest
    }
  }
}

// uso:
// const pq = new PriorityQueue()                    // min-heap por a.priority
// const pq = PriorityQueue.fromArray([{priority:3,value:'x'}, ...]) // heapify O(n)
// pq.push({ priority: 1, value: 'urgente' })
// pq.peek()   // { priority: 1, value: 'urgente' } — mais prioritário, sem remover
// pq.pop()    // remove e devolve o de menor prioridade (O(log n) depois do push)`

// Sequência clássica do CLRS: inserir 8,3,10,1,6,14,2,7 e extrair duas vezes.
const PRESET = [
  { op: 'push', priority: 8, value: 'a' },
  { op: 'push', priority: 3, value: 'b' },
  { op: 'push', priority: 10, value: 'c' },
  { op: 'push', priority: 1, value: 'd' },
  { op: 'push', priority: 6, value: 'e' },
  { op: 'push', priority: 14, value: 'f' },
  { op: 'push', priority: 2, value: 'g' },
  { op: 'push', priority: 7, value: 'h' },
  { op: 'pop' },
  { op: 'pop' },
  { op: 'push', priority: 5, value: 'i' },
  { op: 'pop' },
]

const translations = {
  pt: {
    title: 'Snippet: Priority Queue (Binary Heap)',
    intro: (
      <>
        Fila de prioridade que remove sempre o item de <Text strong>menor
        prioridade</Text> primeiro (min-heap), implementada como árvore
        binária <Text strong>quase completa</Text> armazenada num array — índice
        <Text code>i</Text>, pai <Text code>(i-1) &gt;&gt; 1</Text>, filhos{' '}
        <Text code>2i+1</Text> e <Text code>2i+2</Text>. O custo é o que torna
        o heap o queridinho de schedulers, Dijkstra/BFS por peso e k-way merge:{' '}
        <Text code>push</Text> e <Text code>pop</Text> em O(log n),{' '}
        <Text code>peek</Text> em O(1) e construção (heapify) em O(n). O
        comparador é injetável: troque o cálculo pra virar um max-heap ou
        ordenar por outro campo sem tocar em nada mais.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceHint: 'O comparador padrão é (a, b) => a.priority - b.priority. Para um max-heap, use (a, b) => b.priority - a.priority. Empates de prioridade saem em ordem indefinida — heap por comparador não é estável.',
    demoTitle: 'Demonstração interativa',
    demoDesc: 'Empurre itens com prioridade e valor; o heap mantém o de menor prioridade na raiz.',
    priorityLabel: 'Prioridade (menor = primeiro)',
    valueLabel: 'Valor',
    pushButton: 'push(p, v)',
    popButton: 'pop()',
    peekButton: 'peek()',
    presetButton: 'Rodar sequência CLRS',
    clearButton: 'Limpar',
    heapTitle: 'Estado do heap (array)',
    heapHint: 'Verde = raiz (menor prioridade). Índice do array entre colchetes.',
    treeTitle: 'Visão em árvore',
    treeHint: 'Pai em verde; cada nó mostra prioridade:valor.',
    logTitle: 'Log de operações',
    empty: 'Fila vazia — nada no heap ainda.',
    needPriority: 'Informe a prioridade (número).',
    needValue: 'Informe um valor.',
    pushed: 'push({p}, "{v}") → inserido, sift-up até a posição correta',
    popped: 'pop() → {p}:{v} removido (raiz), última folha sift-down no lugar',
    peeked: 'peek() → {p}:{v} (não remove)',
    emptyPop: 'pop() → heap vazio, nada a remover',
    emptyPeek: 'peek() → heap vazio',
    cleared: 'heap limpo',
    sizeLabel: 'Tamanho',
    maxHeapNote: (
      <>
        Quer um <Text strong>max-heap</Text>? Só inverta o comparador:{' '}
        <Text code>new PriorityQueue((a, b) =&gt; b.priority - a.priority)</Text>{' '}
        — o resto do algoritmo (sift-up/sift-down) não muda.
      </>
    ),
  },
  en: {
    title: 'Snippet: Priority Queue (Binary Heap)',
    intro: (
      <>
        A priority queue that always removes the{' '}
        <Text strong>lowest-priority</Text> item first (min-heap), implemented
        as an almost-complete binary tree stored in an array — index{' '}
        <Text code>i</Text>, parent <Text code>(i-1) &gt;&gt; 1</Text>,
        children <Text code>2i+1</Text> and <Text code>2i+2</Text>. The cost
        is what makes the heap the go-to for schedulers, weighted
        Dijkstra/BFS and k-way merge: <Text code>push</Text> and{' '}
        <Text code>pop</Text> in O(log n), <Text code>peek</Text> in O(1) and
        O(n) construction via heapify. The comparator is injectable: flip its
        math to turn this into a max-heap or order by any other field without
        touching anything else.
      </>
    ),
    sourceTitle: 'Source code',
    sourceHint: 'The default comparator is (a, b) => a.priority - b.priority. For a max-heap use (a, b) => b.priority - a.priority. Ties in priority come out in undefined order — comparator-based heaps are not stable.',
    demoTitle: 'Interactive demo',
    demoDesc: 'Push items with a priority and a value; the heap keeps the lowest priority at the root.',
    priorityLabel: 'Priority (lower = sooner)',
    valueLabel: 'Value',
    pushButton: 'push(p, v)',
    popButton: 'pop()',
    peekButton: 'peek()',
    presetButton: 'Run CLRS sequence',
    clearButton: 'Clear',
    heapTitle: 'Heap state (array)',
    heapHint: 'Green = root (lowest priority). Array index in brackets.',
    treeTitle: 'Tree view',
    treeHint: 'Parent in green; each node shows priority:value.',
    logTitle: 'Operation log',
    empty: 'Empty queue — nothing in the heap yet.',
    needPriority: 'Enter a priority (number).',
    needValue: 'Enter a value.',
    pushed: 'push({p}, "{v}") → inserted, sift-up into position',
    popped: 'pop() → removed {p}:{v} (root), last leaf sift-down into place',
    peeked: 'peek() → {p}:{v} (kept)',
    emptyPop: 'pop() → heap empty, nothing to remove',
    emptyPeek: 'peek() → heap empty',
    cleared: 'heap cleared',
    sizeLabel: 'Size',
    maxHeapNote: (
      <>
        Want a <Text strong>max-heap</Text>? Just flip the comparator:{' '}
        <Text code>new PriorityQueue((a, b) =&gt; b.priority - a.priority)</Text>{' '}
        — the rest of the algorithm (sift-up/sift-down) stays the same.
      </>
    ),
  },
}

function renderNode(arr, i) {
  if (i >= arr.length) return null
  const item = arr[i]
  const left = renderNode(arr, 2 * i + 1)
  const right = renderNode(arr, 2 * i + 2)
  return (
    <div
      key={i}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 6px' }}
    >
      <Tag
        color={i === 0 ? 'green' : 'blue'}
        style={{ fontSize: 13, padding: '2px 10px', margin: 0 }}
      >
        {item.priority}:{item.value}
      </Tag>
      {(left || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 10 }}>
          {left}
          {right}
        </div>
      )}
    </div>
  )
}

export default function PriorityQueueSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const queueRef = useRef(new PriorityQueue())
  const nextLogId = useRef(0)
  const [items, setItems] = useState([])
  const [log, setLog] = useState([])
  const [priority, setPriority] = useState(3)
  const [value, setValue] = useState('')

  function pushLog(line) {
    setLog((prev) => [{ id: nextLogId.current++, line }, ...prev].slice(0, 40))
  }

  function sync() {
    setItems(queueRef.current.toArray())
  }

  function handlePush() {
    const p = priority
    const v = value.trim()
    if (!Number.isFinite(p)) {
      pushLog(t.needPriority)
      return
    }
    if (!v) {
      pushLog(t.needValue)
      return
    }
    queueRef.current.push({ priority: p, value: v })
    sync()
    pushLog(t.pushed.replace('{p}', p).replace('{v}', v))
    setValue('')
  }

  function handlePop() {
    if (queueRef.current.isEmpty()) {
      pushLog(t.emptyPop)
      return
    }
    const removed = queueRef.current.pop()
    sync()
    pushLog(t.popped.replace('{p}', removed.priority).replace('{v}', removed.value))
  }

  function handlePeek() {
    if (queueRef.current.isEmpty()) {
      pushLog(t.emptyPeek)
      return
    }
    const top = queueRef.current.peek()
    pushLog(t.peeked.replace('{p}', top.priority).replace('{v}', top.value))
  }

  function handleClear() {
    queueRef.current = new PriorityQueue()
    setItems([])
    pushLog(t.cleared)
  }

  function runPreset() {
    queueRef.current = new PriorityQueue()
    const lines = []
    for (const step of PRESET) {
      if (step.op === 'push') {
        queueRef.current.push({ priority: step.priority, value: step.value })
        lines.push(t.pushed.replace('{p}', step.priority).replace('{v}', step.value))
      } else {
        const removed = queueRef.current.pop()
        lines.push(removed ? t.popped.replace('{p}', removed.priority).replace('{v}', removed.value) : t.emptyPop)
      }
    }
    sync()
    setLog(lines.reverse().map((line) => ({ id: nextLogId.current++, line })))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SortAscendingOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary" style={{ fontSize: 13 }}>{t.sourceHint}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text type="secondary">{t.demoDesc}</Text>

          <Space wrap align="end">
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {t.priorityLabel}
              </Text>
              <InputNumber
                min={-99}
                max={999}
                value={priority}
                onChange={(v) => setPriority(typeof v === 'number' ? v : undefined)}
                style={{ width: 140 }}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {t.valueLabel}
              </Text>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onPressEnter={handlePush}
                placeholder="ex.: a"
                style={{ width: 140 }}
              />
            </div>
            <Button type="primary" icon={<SortAscendingOutlined />} onClick={handlePush}>
              {t.pushButton}
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handlePop}>
              {t.popButton}
            </Button>
            <Button icon={<EyeOutlined />} onClick={handlePeek}>
              {t.peekButton}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              {t.clearButton}
            </Button>
            <Button icon={<ExperimentOutlined />} onClick={runPreset}>
              {t.presetButton}
            </Button>
          </Space>

          <Alert type="info" showIcon message={t.maxHeapNote} />

          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.heapTitle}</Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{t.heapHint}</Text>
            <Space size={8} wrap>
              {items.length === 0 && <Text type="secondary">{t.empty}</Text>}
              {items.map((item, idx) => (
                <Tag
                  key={`${idx}-${item.priority}-${item.value}`}
                  color={idx === 0 ? 'green' : 'blue'}
                  style={{ padding: '4px 10px', fontSize: 13 }}
                >
                  [{idx}] {item.priority}:{item.value}
                </Tag>
              ))}
            </Space>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.treeTitle}</Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{t.treeHint}</Text>
            <div
              style={{
                padding: 16,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
                overflowX: 'auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {items.length === 0 ? (
                <Text type="secondary">{t.empty}</Text>
              ) : (
                renderNode(items, 0)
              )}
            </div>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.logTitle}</Text>
            <List
              size="small"
              bordered
              dataSource={log}
              style={{ maxHeight: 240, overflowY: 'auto' }}
              renderItem={(item) => (
                <List.Item>
                  <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.line}</Text>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Card>
    </Space>
  )
}