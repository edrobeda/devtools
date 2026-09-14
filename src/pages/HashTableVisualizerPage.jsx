import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Input,
  InputNumber,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Statistic,
  Collapse,
  Alert,
  Select,
  Empty,
} from 'antd'
import {
  TableOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ClearOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { HASH_FUNCTIONS, createHashTable, sourceCode } from '../utils/hashTableVisualizer'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const PRESETS = [
  {
    key: 'users',
    label: { pt: 'Usuários', en: 'Users' },
    items: [
      ['ana', 'adm'],
      ['bruno', 'dev'],
      ['carla', 'dev'],
      ['diego', 'qa'],
      ['elena', 'pm'],
      ['felipe', 'sre'],
    ],
  },
  {
    key: 'cc',
    label: { pt: 'Códigos de país', en: 'Country codes' },
    items: [
      ['BR', 'Brasil'],
      ['US', 'EUA'],
      ['CN', 'China'],
      ['DE', 'Alemanha'],
      ['IN', 'Índia'],
      ['JP', 'Japão'],
      ['FR', 'França'],
      ['GB', 'Reino Unido'],
    ],
  },
  {
    key: 'uf',
    label: { pt: 'UF brasileiras', en: 'Brazilian states' },
    items: [
      ['SP', 'São Paulo'],
      ['RJ', 'Rio de Janeiro'],
      ['MG', 'Minas Gerais'],
      ['RS', 'Rio Grande do Sul'],
      ['BA', 'Bahia'],
      ['PR', 'Paraná'],
    ],
  },
  {
    key: 'animals',
    label: { pt: 'Animais', en: 'Animals' },
    items: [
      ['gato', 'felino'],
      ['cachorro', 'canino'],
      ['passaro', 'ave'],
      ['peixe', 'aquatico'],
      ['cavalo', 'equino'],
      ['cobra', 'reptil'],
    ],
  },
]

const translations = {
  pt: {
    title: 'Visualizador de Tabela Hash',
    intro:
      'Visualize como uma tabela hash armazena pares chave-valor usando encadeamento para resolver colisoes. A funcao hash escolhida mapeia cada chave para um indice no vetor de baldes; quando duas chaves caem no mesmo balde, elas formam uma lista encadeada. Tudo roda 100% no navegador.',
    configTitle: 'Configuracao',
    bucketsLabel: 'Numero de baldes (m)',
    bucketsHelp: 'Menos baldes = mais colisoes. Mais baldes = menos colisoes, porem mais memoria.',
    hashLabel: 'Funcao hash',
    hashHelp: 'Algoritmo que converte chave → hash → indice do balde.',
    insertCard: 'Inserir / atualizar chave-valor',
    keyPlaceholder: 'Chave (ex.: user:42)',
    valuePlaceholder: 'Valor (opcional)',
    insertButton: 'Inserir',
    findCard: 'Buscar chave',
    findPlaceholder: 'Digite uma chave para buscar',
    findButton: 'Buscar',
    findDeleteButton: 'Buscar e remover',
    historyTitle: 'Historico de operacoes',
    clearButton: 'Limpar tudo',
    noKeys: 'Nenhuma chave inserida ainda. Use um cenario rapido ou digite uma chave.',
    visualizationTitle: 'Baldes',
    bucketPrefix: 'balde',
    emptyBucket: 'vazio',
    statsTitle: 'Estatisticas',
    entriesCount: 'Entradas (n)',
    loadFactor: 'Fator de carga',
    longestChain: 'Maior cadeia',
    collisionsTotal: 'Colisoes (total)',
    emptyBuckets: 'Baldes vazios',
    avgChain: 'Cadeia media (ocupados)',
    presetsTitle: 'Cenarios rapidos',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    howItWorks: 'Como funciona',
    howItWorksText:
      'Uma tabela hash usa uma funcao hash para converter a chave em um inteiro (hash) e o indice do balde e `hash mod m`. Quando dois hashes caem no mesmo balde, ocorre uma colisao e as entradas sao encadeadas em uma lista (separate chaining). Inserir, buscar e remover custam O(1) na media e O(n) no pior caso, quando muitas chaves colidem no mesmo balde.',
    quickAdvice: 'Dica rapida',
    quickAdviceText:
      'Experimente trocar a funcao hash e o numero de baldes para ver como a distribuicao muda. Um bom hash espalha as chaves uniformemente; uma tabela com fator de carga acima de 0.7 tende a gerar muitas colisoes.',
    noticeInserted: 'Inserido no balde {idx}',
    noticeUpdated: 'Atualizado no balde {idx}',
    noticeCollision: 'Inserido no balde {idx} com colisao!',
    noticeFound: 'Encontrado no balde {idx} (posicao {pos} da cadeia)',
    noticeNotFound: 'Nao encontrado — cairia no balde {idx}',
    noticeRemoved: 'Removido do balde {idx}',
    noticeRemovedMissing: 'Chave nao estava presente para remover',
    hashInfo: 'hash(chave) = {hash}',
  },
  en: {
    title: 'Hash Table Visualizer',
    intro:
      'Visualize how a hash table stores key-value pairs using separate chaining to resolve collisions. The chosen hash function maps each key to an index in the bucket array; when two keys land on the same bucket, they form a linked chain. Everything runs 100% in the browser.',
    configTitle: 'Configuration',
    bucketsLabel: 'Number of buckets (m)',
    bucketsHelp: 'Fewer buckets = more collisions. More buckets = fewer collisions, but more memory.',
    hashLabel: 'Hash function',
    hashHelp: 'Algorithm that converts key → hash → bucket index.',
    insertCard: 'Insert / update key-value',
    keyPlaceholder: 'Key (e.g. user:42)',
    valuePlaceholder: 'Value (optional)',
    insertButton: 'Insert',
    findCard: 'Find key',
    findPlaceholder: 'Type a key to look up',
    findButton: 'Find',
    findDeleteButton: 'Find and remove',
    historyTitle: 'Operation log',
    clearButton: 'Clear all',
    noKeys: 'No keys inserted yet. Use a quick scenario or type a key.',
    visualizationTitle: 'Buckets',
    bucketPrefix: 'bucket',
    emptyBucket: 'empty',
    statsTitle: 'Statistics',
    entriesCount: 'Entries (n)',
    loadFactor: 'Load factor',
    longestChain: 'Longest chain',
    collisionsTotal: 'Collisions (total)',
    emptyBuckets: 'Empty buckets',
    avgChain: 'Avg chain (occupied)',
    presetsTitle: 'Quick scenarios',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    howItWorks: 'How it works',
    howItWorksText:
      'A hash table uses a hash function to turn a key into an integer (hash) and the bucket index is `hash mod m`. When two hashes land on the same bucket, a collision occurs and the entries are chained into a list (separate chaining). Insert, find and remove are O(1) on average and O(n) in the worst case, when many keys collide on the same bucket.',
    quickAdvice: 'Quick advice',
    quickAdviceText:
      'Try switching the hash function and the number of buckets to see how the distribution changes. A good hash spreads keys uniformly; a table with a load factor above 0.7 tends to produce many collisions.',
    noticeInserted: 'Inserted into bucket {idx}',
    noticeUpdated: 'Updated in bucket {idx}',
    noticeCollision: 'Inserted into bucket {idx} with collision!',
    noticeFound: 'Found in bucket {idx} (position {pos} of the chain)',
    noticeNotFound: 'Not found — it would land in bucket {idx}',
    noticeRemoved: 'Removed from bucket {idx}',
    noticeRemovedMissing: 'Key was not present to remove',
    hashInfo: 'hash(key) = {hash}',
  },
}

const fillText = (template, values) =>
  template.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match))

function hashFnOptions(lang) {
  return Object.entries(HASH_FUNCTIONS).map(([key, fn]) => ({
    value: key,
    label: fn.name,
  }))
}

export default function HashTableVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [bucketCount, setBucketCount] = useState(8)
  const [hashFnName, setHashFnName] = useState('djb2')
  const [entries, setEntries] = useState([])
  const [keyInput, setKeyInput] = useState('')
  const [valueInput, setValueInput] = useState('')
  const [findInput, setFindInput] = useState('')
  const [activeIdx, setActiveIdx] = useState(null)
  const [notice, setNotice] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const [history, setHistory] = useState([])

  const table = useMemo(
    () => {
      const tbl = createHashTable(bucketCount, hashFnName)
      entries.forEach((e) => tbl.insert(e.key, e.value))
      return tbl
    },
    [entries, bucketCount, hashFnName]
  )

  const stats = table.stats()

  const applyPreset = useCallback(
    (preset) => {
      setEntries(preset.items.map(([key, value], i) => ({ key, value, id: i })))
      setActiveIdx(null)
      setNotice(null)
      setKeyInput('')
      setValueInput('')
      setFindInput('')
      setHistory([])
    },
    []
  )

  const clearAll = useCallback(() => {
    setEntries([])
    setActiveIdx(null)
    setNotice(null)
    setHistory([])
  }, [])

  const pushHistory = useCallback((record) => {
    setHistory((prev) => [{ key: Date.now() + Math.random(), ...record }, ...prev].slice(0, 12))
  }, [])

  const opInsert = useCallback(() => {
    const key = keyInput.trim()
    if (!key) return
    const value = valueInput.trim()
    const probe = createHashTable(bucketCount, hashFnName)
    entries.forEach((e) => probe.insert(e.key, e.value))
    const res = probe.insert(key, value)
    setEntries((prev) => {
      const existingIdx = prev.findIndex((e) => e.key === key)
      if (existingIdx >= 0) {
        return prev.map((e, i) => (i === existingIdx ? { ...e, value } : e))
      }
      return [...prev, { key, value, id: Date.now() + Math.random() }]
    })
    setActiveIdx(res.idx)
    setNotice({
      kind: res.updated ? 'updated' : res.collision ? 'collision' : 'inserted',
      idx: res.idx,
      pos: res.chainLength,
      hash: res.hash,
    })
    pushHistory({ type: 'insert', title: key, noticeKind: res.updated ? 'updated' : res.collision ? 'collision' : 'inserted', idx: res.idx })
    setKeyInput('')
    setValueInput('')
  }, [keyInput, valueInput, entries, bucketCount, hashFnName, pushHistory])

  const opFind = useCallback(
    (removeInstead) => {
      const key = findInput.trim()
      if (!key) return
      const probe = createHashTable(bucketCount, hashFnName)
      entries.forEach((e) => probe.insert(e.key, e.value))
      if (removeInstead) {
        const res = probe.remove(key)
        if (res.ok) {
          setEntries((prev) => prev.filter((e) => e.key !== key))
          setNotice({ kind: 'removed', idx: res.idx, hash: res.hash })
          pushHistory({ type: 'remove', title: key, noticeKind: 'removed', idx: res.idx })
        } else {
          setNotice({ kind: 'removedMissing', idx: res.idx, hash: res.hash })
          pushHistory({ type: 'remove', title: key, noticeKind: 'removedMissing', idx: res.idx })
        }
        setActiveIdx(res.idx)
      } else {
        const res = probe.find(key)
        setNotice({
          kind: res.ok ? 'found' : 'notFound',
          idx: res.idx,
          pos: res.position,
          hash: res.hash,
        })
        pushHistory({ type: 'find', title: key, noticeKind: res.ok ? 'found' : 'notFound', idx: res.idx })
        setActiveIdx(res.idx)
      }
      setFindInput('')
    },
    [findInput, entries, bucketCount, hashFnName, pushHistory]
  )

  const noticeConfig = useMemo(() => {
    if (!notice) return null
    const text = fillText(t[`notice${notice.kind[0].toUpperCase()}${notice.kind.slice(1)}`], {
      idx: notice.idx,
      pos: notice.pos,
    })
    const hashText = fillText(t.hashInfo, { hash: notice.hash })
    const color = {
      inserted: 'green',
      updated: 'blue',
      collision: 'orange',
      found: 'green',
      notFound: 'red',
      removed: 'default',
      removedMissing: 'red',
    }[notice.kind]
    return { text, hashText, color }
  }, [notice, t])

  const cols = useMemo(() => {
    if (bucketCount <= 3) return bucketCount
    return 4
  }, [bucketCount])

  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  const options = useMemo(() => hashFnOptions(lang), [lang])

  const historyList = useMemo(
    () =>
      history.map((h) => {
        const color = {
          inserted: 'green',
          updated: 'blue',
          collision: 'orange',
          found: 'green',
          notFound: 'red',
          removed: 'default',
          removedMissing: 'red',
        }[h.noticeKind]
        return { ...h, color }
      }),
    [history]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <TableOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.bucketsLabel}</Text>
                    <InputNumber
                      min={3}
                      max={24}
                      value={bucketCount}
                      onChange={(v) => setBucketCount(v ?? 8)}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.bucketsHelp}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.hashLabel}</Text>
                    <Select
                      value={hashFnName}
                      onChange={setHashFnName}
                      options={options}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.hashHelp}
                    </Text>
                  </Space>
                </Col>
              </Row>

              <div>
                <Text strong>{t.presetsTitle}: </Text>
                <Space size={[8, 8]} wrap>
                  {PRESETS.map((p) => (
                    <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
                      {p.label[lang]}
                    </Button>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>

          <Card title={t.insertCard} style={{ marginTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={t.keyPlaceholder}
                onPressEnter={opInsert}
                style={{ maxWidth: '55%' }}
              />
              <Input
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                placeholder={t.valuePlaceholder}
                onPressEnter={opInsert}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={opInsert}>
                {t.insertButton}
              </Button>
            </Space.Compact>
          </Card>

          <Card title={t.findCard} style={{ marginTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={findInput}
                onChange={(e) => setFindInput(e.target.value)}
                placeholder={t.findPlaceholder}
                onPressEnter={() => opFind(false)}
                prefix={<SearchOutlined />}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={() => opFind(false)}>
                {t.findButton}
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => opFind(true)}>
                {t.findDeleteButton}
              </Button>
            </Space.Compact>
          </Card>

          {noticeConfig && (
            <Alert
              type={noticeConfig.color === 'orange' ? 'warning' : noticeConfig.color === 'red' ? 'error' : 'info'}
              showIcon
              message={noticeConfig.text}
              description={noticeConfig.hashText}
              style={{ marginTop: 16 }}
            />
          )}

          {historyList.length > 0 && (
            <Card title={t.historyTitle} style={{ marginTop: 16 }}>
              <Space direction="vertical" size={[0, 8]} style={{ width: '100%' }}>
                {historyList.map((h) => (
                  <Space key={h.key} size={[8, 0]}>
                    <Tag color={h.color}>{h.title}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {fillText(t[`notice${h.noticeKind[0].toUpperCase()}${h.noticeKind.slice(1)}`], { idx: h.idx })}
                    </Text>
                  </Space>
                ))}
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.visualizationTitle}>
            {entries.length === 0 ? (
              <Empty description={t.noKeys} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gap: 8,
                }}
              >
                {table.buckets.map((bucket, idx) => {
                  const isEmpty = bucket.length === 0
                  const hasCollision = bucket.length > 1
                  const isActive = activeIdx === idx
                  return (
                    <div
                      key={idx}
                      style={{
                        border: `1px solid ${isActive ? '#1677ff' : '#e8e8e8'}`,
                        borderRadius: 6,
                        padding: 6,
                        background: isEmpty
                          ? '#fafafa'
                          : hasCollision
                            ? '#fff7e6'
                            : '#f0f7ff',
                        minWidth: 90,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t.bucketPrefix} {idx}
                      </Text>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {isEmpty ? (
                          <Text type="secondary" style={{ fontSize: 12, opacity: 0.7 }}>
                            ∅ {t.emptyBucket}
                          </Text>
                        ) : (
                          bucket.map((entry) => (
                            <Tag
                              key={entry.key}
                              color={hasCollision ? 'orange' : 'blue'}
                              style={{ marginInlineEnd: 0 }}
                            >
                              {entry.key}
                              {entry.value ? `: ${entry.value}` : ''}
                            </Tag>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {entries.length > 0 && (
              <Button icon={<ClearOutlined />} size="small" onClick={clearAll} style={{ marginTop: 12 }}>
                {t.clearButton}
              </Button>
            )}
          </Card>

          <Card title={t.statsTitle} style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.entriesCount} value={stats.totalEntries} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic
                    title={t.loadFactor}
                    value={stats.loadFactor.toFixed(2)}
                    suffix="/ m"
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.longestChain} value={stats.longestChain} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.collisionsTotal} value={stats.collisions} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.emptyBuckets} value={stats.emptyBuckets} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.avgChain} value={stats.avgOccupied.toFixed(2)} />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Alert type="info" showIcon message={t.howItWorks} description={t.howItWorksText} />
      <Alert type="warning" showIcon message={t.quickAdvice} description={t.quickAdviceText} />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <div style={{ position: 'relative' }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => copy(sourceCode(), 'source')}
            >
              {copiedKey === 'source' ? t.copied : t.copy}
            </Button>
            <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
              <code>{sourceCode()}</code>
            </pre>
          </div>
        </Panel>
      </Collapse>
    </Space>
  )
}