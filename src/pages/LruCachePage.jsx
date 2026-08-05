import React, { useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Input, Button, Slider, Tag, List } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import { LRUCache } from '../utils/lruCache'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map() // Map preserva a ordem de inserção/atualização
  }

  has(key) {
    return this.map.has(key)
  }

  get(key) {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key)
    // re-insere: move a chave pro fim (mais recentemente usada)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      // a primeira chave do Map é a menos recentemente usada
      const oldestKey = this.map.keys().next().value
      this.map.delete(oldestKey)
    }
  }

  entries() {
    return [...this.map.entries()]
  }
}`

const translations = {
  pt: {
    title: 'Snippet: LRU Cache do zero',
    intro: (
      <>
        Cache com capacidade fixa que descarta o item{' '}
        <Text strong>menos recentemente usado</Text> (Least Recently Used)
        quando fica cheio. A implementação inteira se apoia numa única
        propriedade do <Text code>Map</Text> nativo do JS: ele preserva a
        ordem de inserção, e <Text code>delete</Text> seguido de{' '}
        <Text code>set</Text> reinsere uma chave no fim — então a primeira
        chave do Map é sempre a mais antiga (candidata a evicção) e a última
        é a mais recente. Sem lista duplamente encadeada, sem hashmap
        separado: <Text code>get</Text> e <Text code>put</Text> são O(1).
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração interativa',
    capacityLabel: 'Capacidade',
    keyLabel: 'Chave',
    valueLabel: 'Valor',
    putButton: 'put(chave, valor)',
    getButton: 'get(chave)',
    presetButton: 'Carregar sequência de exemplo',
    stateTitle: 'Estado do cache',
    stateHint: 'Ordem: menos recente (esquerda) → mais recente (direita)',
    empty: 'Cache vazio',
    logTitle: 'Log de operações',
    needKey: 'Informe uma chave.',
    hitMoved: 'hit — valor "{value}" (movida pra mais recente)',
    miss: 'miss — chave não está no cache',
    inserted: 'inserido',
    updatedMoved: 'atualizado (movido pra mais recente)',
    evicted: 'evictou "{key}" (cache cheia)',
  },
  en: {
    title: 'Snippet: LRU Cache from scratch',
    intro: (
      <>
        A fixed-capacity cache that evicts the{' '}
        <Text strong>least recently used</Text> item once it's full. The
        whole implementation leans on a single property of JS's native{' '}
        <Text code>Map</Text>: it preserves insertion order, and{' '}
        <Text code>delete</Text> followed by <Text code>set</Text>{' '}
        re-inserts a key at the end — so the Map's first key is always the
        oldest (eviction candidate) and the last is the most recent. No
        doubly linked list, no separate hash map: <Text code>get</Text> and{' '}
        <Text code>put</Text> are O(1).
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Interactive demo',
    capacityLabel: 'Capacity',
    keyLabel: 'Key',
    valueLabel: 'Value',
    putButton: 'put(key, value)',
    getButton: 'get(key)',
    presetButton: 'Load example sequence',
    stateTitle: 'Cache state',
    stateHint: 'Order: least recent (left) → most recent (right)',
    empty: 'Empty cache',
    logTitle: 'Operation log',
    needKey: 'Enter a key.',
    hitMoved: 'hit — value "{value}" (moved to most recent)',
    miss: 'miss — key not in cache',
    inserted: 'inserted',
    updatedMoved: 'updated (moved to most recent)',
    evicted: 'evicted "{key}" (cache full)',
  },
}

const PRESET_SEQUENCE = [
  { op: 'put', key: 'a', value: '1' },
  { op: 'put', key: 'b', value: '2' },
  { op: 'put', key: 'c', value: '3' },
  { op: 'get', key: 'a' },
  { op: 'put', key: 'd', value: '4' },
  { op: 'get', key: 'b' },
]

export default function LruCachePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [capacity, setCapacity] = useState(4)
  const cacheRef = useRef(new LRUCache(4))
  const [entries, setEntries] = useState([])
  const [log, setLog] = useState([])
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const nextLogId = useRef(0)

  function resetCache(newCapacity) {
    cacheRef.current = new LRUCache(newCapacity)
    setEntries([])
    setLog([])
  }

  function pushLog(line) {
    setLog((prev) => [{ id: nextLogId.current++, line }, ...prev].slice(0, 30))
  }

  function sync() {
    setEntries(cacheRef.current.entries())
  }

  function handlePut(k, v) {
    if (!k) {
      pushLog(t.needKey)
      return
    }
    const cache = cacheRef.current
    const hadKey = cache.has(k)
    const sizeBefore = cache.entries().length
    const willEvict = !hadKey && sizeBefore === cache.capacity && cache.capacity > 0
    const evictedKey = willEvict ? cache.entries()[0][0] : null

    cache.put(k, v)
    sync()

    if (evictedKey !== null) {
      pushLog(`put(${k}, ${v}) → ${t.inserted}; ${t.evicted.replace('{key}', evictedKey)}`)
    } else if (hadKey) {
      pushLog(`put(${k}, ${v}) → ${t.updatedMoved}`)
    } else {
      pushLog(`put(${k}, ${v}) → ${t.inserted}`)
    }
  }

  function handleGet(k) {
    if (!k) {
      pushLog(t.needKey)
      return
    }
    const cache = cacheRef.current
    const hit = cache.has(k)
    const v = cache.get(k)
    sync()
    pushLog(`get(${k}) → ${hit ? t.hitMoved.replace('{value}', v) : t.miss}`)
  }

  function loadPreset() {
    resetCache(capacity)
    const cache = cacheRef.current
    const lines = []
    for (const step of PRESET_SEQUENCE) {
      if (step.op === 'put') {
        const hadKey = cache.has(step.key)
        const sizeBefore = cache.entries().length
        const willEvict = !hadKey && sizeBefore === cache.capacity && cache.capacity > 0
        const evictedKey = willEvict ? cache.entries()[0][0] : null
        cache.put(step.key, step.value)
        if (evictedKey !== null) {
          lines.push(`put(${step.key}, ${step.value}) → ${t.inserted}; ${t.evicted.replace('{key}', evictedKey)}`)
        } else if (hadKey) {
          lines.push(`put(${step.key}, ${step.value}) → ${t.updatedMoved}`)
        } else {
          lines.push(`put(${step.key}, ${step.value}) → ${t.inserted}`)
        }
      } else {
        const hit = cache.has(step.key)
        const v = cache.get(step.key)
        lines.push(`get(${step.key}) → ${hit ? t.hitMoved.replace('{value}', v) : t.miss}`)
      }
    }
    sync()
    setLog(lines.reverse().map((line) => ({ id: nextLogId.current++, line })))
  }

  const currentEntries = useMemo(() => entries, [entries])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space align="center" wrap>
            <Text type="secondary">{t.capacityLabel}: {capacity}</Text>
            <Slider
              min={2}
              max={8}
              value={capacity}
              onChange={(v) => {
                setCapacity(v)
                resetCache(v)
              }}
              style={{ width: 160 }}
            />
            <Button onClick={loadPreset}>{t.presetButton}</Button>
          </Space>

          <Space wrap align="end">
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.keyLabel}</Text>
              <Input value={key} onChange={(e) => setKey(e.target.value)} style={{ width: 120 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.valueLabel}</Text>
              <Input value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 120 }} />
            </div>
            <Button type="primary" onClick={() => handlePut(key.trim(), value.trim())}>{t.putButton}</Button>
            <Button onClick={() => handleGet(key.trim())}>{t.getButton}</Button>
          </Space>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.stateTitle}</Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{t.stateHint}</Text>
            <Space size={8} wrap>
              {currentEntries.length === 0 && <Text type="secondary">{t.empty}</Text>}
              {currentEntries.map(([k, v], idx) => (
                <Tag key={k} color={idx === currentEntries.length - 1 ? 'green' : 'default'} style={{ padding: '4px 10px', fontSize: 13 }}>
                  {k}: {v}
                </Tag>
              ))}
            </Space>
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
