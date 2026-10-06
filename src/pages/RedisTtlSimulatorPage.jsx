import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  InputNumber,
  Select,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Alert,
  Empty,
  Segmented,
  Slider,
  Switch,
} from 'antd'
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  FireOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  StepForwardOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Constantes ──────────────────────────────────────────────────
const KEY_TYPES = ['string', 'list', 'set', 'hash', 'zset']
const TYPE_COLORS = {
  string: '#1677ff',
  list: '#52c41a',
  set: '#fa8c16',
  hash: '#722ed1',
  zset: '#eb2f96',
}
const EVICTION_POLICIES = [
  'noeviction',
  'allkeys-lru',
  'allkeys-lfu',
  'allkeys-random',
  'volatile-lru',
  'volatile-lfu',
  'volatile-random',
  'volatile-ttl',
]
const SIM_SPEEDS = [
  { value: 1, label: '1x' },
  { value: 5, label: '5x' },
  { value: 25, label: '25x' },
  { value: 100, label: '100x' },
]

// Helper: parseia "16kb", "2mb", "256b" para bytes.
function parseSize(s) {
  if (typeof s === 'number') return Math.max(0, Math.round(s))
  if (!s) return 0
  const m = String(s).trim().toLowerCase().match(/^([\d.]+)\s*(b|kb|mb|gb)?$/)
  if (!m) return 0
  const n = Number(m[1])
  const unit = m[2] || 'b'
  const mult = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 }[unit]
  return Math.max(0, Math.round(n * mult))
}

function formatBytes(b) {
  if (!Number.isFinite(b) || b < 0) return '0 B'
  if (b < 1024) return `${Math.round(b)} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 10240 ? 1 : 0)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(b < 10485760 ? 1 : 0)} MB`
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatTime(s) {
  if (!Number.isFinite(s) || s < 0) return '0s'
  if (s < 60) return `${Math.round(s)}s`
  if (s < 3600) return `${Math.floor(s / 60)}m${Math.round(s % 60)}s`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h${m}m`
}

// ─── Geração de chaves iniciais ──────────────────────────────────
function makeKey(name, size, keyType = 'string', ttl = 60, hits = 0) {
  return {
    id: `k-${Math.random().toString(36).slice(2, 9)}`,
    name,
    type: keyType,
    size,
    ttl,
    hits,
    createdAt: 0,
    status: 'alive',
    expiresAt: ttl === Infinity ? Infinity : 0,
  }
}

const SAMPLE_KEYS = [
  { name: 'session:user:1a2b3c', type: 'string', size: parseSize('256 B'), ttl: 1800 },
  { name: 'session:user:4d5e6f', type: 'string', size: parseSize('192 B'), ttl: 1800 },
  { name: 'cache:homepage', type: 'string', size: parseSize('4 KB'), ttl: 60 },
  { name: 'cache:product:42', type: 'hash', size: parseSize('512 B'), ttl: 300 },
  { name: 'cache:product:43', type: 'hash', size: parseSize('512 B'), ttl: 300 },
  { name: 'cache:product:44', type: 'hash', size: parseSize('512 B'), ttl: 300 },
  { name: 'leaderboard:game1', type: 'zset', size: parseSize('8 KB'), ttl: 86400 },
  { name: 'leaderboard:game2', type: 'zset', size: parseSize('16 KB'), ttl: 86400 },
  { name: 'ratelimit:api:user1', type: 'string', size: parseSize('32 B'), ttl: 10 },
  { name: 'ratelimit:api:user2', type: 'string', size: parseSize('32 B'), ttl: 10 },
  { name: 'analytics:events:queue', type: 'list', size: parseSize('128 KB'), ttl: 3600 },
  { name: 'analytics:online', type: 'set', size: parseSize('2 KB'), ttl: 120 },
  { name: 'cart:user:9f8e7d', type: 'hash', size: parseSize('1 KB'), ttl: 7200 },
  { name: 'feature:flags:active', type: 'string', size: parseSize('4 KB'), ttl: Infinity },
  { name: 'config:global', type: 'string', size: parseSize('8 KB'), ttl: Infinity },
  { name: 'temp:upload:1', type: 'string', size: parseSize('64 KB'), ttl: 30 },
  { name: 'temp:upload:2', type: 'string', size: parseSize('64 KB'), ttl: 30 },
  { name: 'temp:upload:3', type: 'string', size: parseSize('64 KB'), ttl: 30 },
  { name: 'jwt:revoked:abc', type: 'set', size: parseSize('256 B'), ttl: 900 },
  { name: 'jwt:revoked:def', type: 'set', size: parseSize('256 B'), ttl: 900 },
]

// ─── Motor de simulação ──────────────────────────────────────────
// Retorna novo array de chaves após avançar `delta` segundos.
// Aplica expiração por TTL e, se exceder maxMemory, evicção pela
// policy selecionada. Mutações em onTouched são aplicadas como
// incrementos de hit em chaves vivas (probabilidade passada).
function tick(state, delta, policy, maxMemory, touchProbability) {
  const t = state.time + delta
  const nextKeys = []
  const events = []
  let memory = 0
  for (const k of state.keys) {
    const expiresAt = k.ttl === Infinity ? Infinity : k.createdAt + k.ttl
    const newKey = { ...k, hits: k.hits }
    // é tempo expirado?
    if (k.status === 'alive' && k.ttl !== Infinity && t >= expiresAt) {
      newKey.status = 'expired'
      events.push({ time: Math.max(expiresAt, k.createdAt), type: 'expired', name: k.name })
    }
    // tocar aleatoriamente?
    if (k.status === 'alive' && touchProbability > 0 && Math.random() < touchProbability * delta / 60) {
      newKey.hits += 1
    }
    nextKeys.push(newKey)
  }
  // Memória = soma dos vivos
  for (const k of nextKeys) {
    if (k.status === 'alive') memory += k.size
  }
  // Aplicar evicção se memória > maxMemory
  let safety = 100
  while (memory > maxMemory && safety-- > 0) {
    const candidates = nextKeys
      .map((k, idx) => ({ k, idx }))
      .filter(({ k }) => k.status === 'alive')
    const eligible = policy.startsWith('volatile-')
      ? candidates.filter(({ k }) => k.ttl !== Infinity)
      : candidates
    if (eligible.length === 0) break
    let pickIdx = -1
    switch (policy) {
      case 'allkeys-lru':
      case 'volatile-lru':
      case 'allkeys-lfu':
      case 'volatile-lfu':
        pickIdx = eligible.reduce((a, b) => (a.k.hits <= b.k.hits ? a : b)).idx
        break
      case 'volatile-ttl':
        // eligible já exclui as persistentes (volatile-* filtra antes do switch)
        pickIdx = eligible.reduce((a, b) => (a.k.ttl <= b.k.ttl ? a : b)).idx
        break
      case 'allkeys-random':
      case 'volatile-random':
        pickIdx = eligible[Math.floor(Math.random() * eligible.length)].idx
        break
      case 'noeviction':
      default:
        pickIdx = -1
    }
    if (pickIdx < 0) break
    nextKeys[pickIdx] = { ...nextKeys[pickIdx], status: 'evicted' }
    memory -= nextKeys[pickIdx].size
    events.push({
      time: t,
      type: 'evicted',
      name: nextKeys[pickIdx].name,
      reason: policy,
    })
  }
  return { time: t, keys: nextKeys, events, memory }
}

// ─── i18n ────────────────────────────────────────────────────────
const translations = {
  pt: {
    title: 'Simulador de TTL do Redis',
    intro: 'Adicione chaves com TTL, defina a memória máxima e a eviction policy, e veja o ciclo de nascimento/expiração/evicção acontecer em tempo real — útil pra entender por que uma chave sumiu, ajustar maxmemory e prever o comportamento sob carga. Tudo roda 100% no navegador, sem nenhum servidor Redis real.',
    configTitle: 'Configuração do Redis',
    maxMemory: 'Memória máxima (maxmemory)',
    policy: 'Eviction policy',
    speedLabel: 'Velocidade da simulação',
    touchLabel: 'Activity on key access',
    touchHelp: 'Probabilidade (por minuto) de uma chave viva ser acessada (incrementa hits). Útil pra ver LRU/LFU escolherem candidatos diferentes do TTL puro.',
    keysTitle: 'Chaves',
    keysHelp: 'Cada linha é uma chave Redis com tamanho (bytes) e TTL (segundos). TTL infinito = persistente (não expira).',
    addKey: 'Adicionar chave',
    applySample: 'Aplicar exemplo',
    clearAll: 'Limpar tudo',
    simulateTitle: 'Simulação',
    play: 'Iniciar',
    pause: 'Pausar',
    step: 'Avançar 60s',
    reset: 'Reiniciar',
    currentTime: 'Tempo de simulação',
    newKey: {
      name: 'Nome',
      type: 'Tipo',
      size: 'Bytes',
      ttl: 'TTL (segundos)',
      persistent: 'Sem TTL (persistente)',
    },
    timelineTitle: 'Linha do tempo',
    timelineHelp: 'Cada barra é uma chave. Verde = ainda viva, cinza = expirou por TTL, vermelho = foi evictada. As linhas verticais marcam eventos.',
    memoryTitle: 'Memória',
    memoryHelp: 'A banda verde é a folga, a amarela é alerta (>70%) e a vermelha é crítica (>90%). Quando estoura, a policy escolhida começa a evicção.',
    memoryNow: 'Memória atual',
    memoryPeak: 'Pico',
    memoryLimit: 'Limite',
    memoryUsage: 'Uso',
    statsTitle: 'Estatísticas',
    statTotal: 'Chaves totais',
    statAlive: 'Vivas',
    statExpired: 'Expiradas',
    statEvicted: 'Evictadas',
    statHits: 'Hits acumulados',
    eventsTitle: 'Log de eventos',
    eventsHelp: 'Eventos em ordem cronológica. Limitado a 80 entradas.',
    eventsEmpty: 'Sem eventos ainda — clique em Iniciar ou em Avançar 60s.',
    evReason: 'por',
    timelineAxis: 'tempo (s)',
    typeShort: {
      string: 'str',
      list: 'list',
      set: 'set',
      hash: 'hash',
      zset: 'zset',
    },
    policyShort: {
      'noeviction': 'noeviction — recusa writes quando estoura (não evicta)',
      'allkeys-lru': 'allkeys-lru — evicta a menos usada recentemente',
      'allkeys-lfu': 'allkeys-lfu — evicta a menos usada frequentemente',
      'allkeys-random': 'allkeys-random — evicta aleatória',
      'volatile-lru': 'volatile-lru — LRU só nas que têm TTL',
      'volatile-lfu': 'volatile-lfu — LFU só nas que têm TTL',
      'volatile-random': 'volatile-random — aleatória só nas que têm TTL',
      'volatile-ttl': 'volatile-ttl — TTL mais curto entre as com TTL',
    },
    policyDescriptions: {
      'noeviction': 'Quando a memória estoura, novos writes retornam erro. Nenhuma chave existente é removida.',
      'allkeys-lru': 'Evicta a chave menos usada recentemente entre todas — persistentes também.',
      'allkeys-lfu': 'Evicta a chave menos usada frequentemente (histórico maior) entre todas.',
      'allkeys-random': 'Evicta uma chave aleatória — sem inteligência, mas sem custo extra.',
      'volatile-lru': 'LRU entre as que têm TTL. As persistentes sobrevivem sempre que couberem.',
      'volatile-lfu': 'LFU entre as que têm TTL. Idem ao volatile-lru mas com frequência histórica.',
      'volatile-random': 'Aleatória entre as que têm TTL. As persistentes ficam pra sempre.',
      'volatile-ttl': 'Evicta a chave com menor TTL entre as que têm TTL — sai logo de qualquer jeito.',
    },
    memoryOutExceeded: 'Memória acima de maxmemory — novas writes serão recusadas (noeviction) ou chaves serão evictadas (demais policies).',
    policyNote: 'A policy define o que evicta quando o keyspace estoura. `noeviction` é a única que não evicta — ela bloqueia writes.',
    algorithmTitle: 'Algoritmo (resumo)',
    algorithmCode: `// A cada tick(delta):
//   1) Aplica expiração: keys com ttl finito e status='alive'
//      viram 'expired' quando (time - createdAt) >= ttl.
//   2) Memória = soma de size de chaves com status='alive'.
//   3) Se memória > maxMemory, evicta segundo a policy:
//      noeviction          → bloqueia (não evicta nada).
//      allkeys-* / volatile-*: escolhe a candidata segundo a
//      regra (LRU/LFU/random/TTL). volatile-* ignora persistentes.
//      Loop até caber ou até acabarem as candidatas.
//   4) Activity: cada segundo sorteado, chaves vivas podem ter
//      hits++ com a probabilidade configurada.
//`,
  },
  en: {
    title: 'Redis TTL Simulator',
    intro: 'Add keys with TTL, set maxmemory and the eviction policy, and watch the birth/expire/evict cycle happen in real time — useful to understand why a key disappeared, tune maxmemory and predict behavior under load. Everything runs 100% in the browser, no real Redis server needed.',
    configTitle: 'Redis configuration',
    maxMemory: 'Max memory (maxmemory)',
    policy: 'Eviction policy',
    speedLabel: 'Simulation speed',
    touchLabel: 'Activity on key access',
    touchHelp: 'Probability (per minute) that a live key gets accessed (hits++). Useful to see LRU/LFU pick different candidates than pure TTL.',
    keysTitle: 'Keys',
    keysHelp: 'Each row is a Redis key with size (bytes) and TTL (seconds). Infinite TTL = persistent (no expire).',
    addKey: 'Add key',
    applySample: 'Apply sample',
    clearAll: 'Clear all',
    simulateTitle: 'Simulation',
    play: 'Play',
    pause: 'Pause',
    step: 'Step 60s',
    reset: 'Reset',
    currentTime: 'Simulation time',
    newKey: {
      name: 'Name',
      type: 'Type',
      size: 'Bytes',
      ttl: 'TTL (seconds)',
      persistent: 'No TTL (persistent)',
    },
    timelineTitle: 'Timeline',
    timelineHelp: 'Each line is a key. Green = still alive, gray = expired by TTL, red = evicted. Vertical lines are events.',
    memoryTitle: 'Memory',
    memoryHelp: 'The green area is healthy, yellow is warning (>70%), red is critical (>90%). When it overflows, the chosen policy starts evicting.',
    memoryNow: 'Current memory',
    memoryPeak: 'Peak',
    memoryLimit: 'Limit',
    memoryUsage: 'Usage',
    statsTitle: 'Statistics',
    statTotal: 'Total keys',
    statAlive: 'Alive',
    statExpired: 'Expired',
    statEvicted: 'Evicted',
    statHits: 'Total hits',
    eventsTitle: 'Event log',
    eventsHelp: 'Events in chronological order. Limited to 80 entries.',
    eventsEmpty: 'No events yet — click Play or Step 60s.',
    evReason: 'by',
    timelineAxis: 'time (s)',
    typeShort: {
      string: 'str',
      list: 'list',
      set: 'set',
      hash: 'hash',
      zset: 'zset',
    },
    policyShort: {
      'noeviction': 'noeviction — refuses writes on full (does not evict)',
      'allkeys-lru': 'allkeys-lru — evict least recently used',
      'allkeys-lfu': 'allkeys-lfu — evict least frequently used',
      'allkeys-random': 'allkeys-random — evict random key',
      'volatile-lru': 'volatile-lru — LRU only among keys with TTL',
      'volatile-lfu': 'volatile-lfu — LFU only among keys with TTL',
      'volatile-random': 'volatile-random — random only among keys with TTL',
      'volatile-ttl': 'volatile-ttl — shortest TTL among keys with TTL',
    },
    policyDescriptions: {
      'noeviction': 'When memory is exhausted, new writes are rejected. No existing key is evicted.',
      'allkeys-lru': 'Evicts the least recently used key across all — persistent ones too.',
      'allkeys-lfu': 'Evicts the least frequently used (over history) across all.',
      'allkeys-random': 'Evicts a random key — no intelligence, but no extra cost.',
      'volatile-lru': 'LRU only among keys with TTL. Persistents survive as long as they fit.',
      'volatile-lfu': 'LFU only among keys with TTL. Same as volatile-lru but with historical frequency.',
      'volatile-random': 'Random only among keys with TTL. Persistents stay forever.',
      'volatile-ttl': 'Evicts the shortest-TTL key among those with TTL — they would expire soon anyway.',
    },
    memoryOutExceeded: 'Memory above maxmemory — new writes will be refused (noeviction) or keys will be evicted (other policies).',
    policyNote: 'The policy defines what gets evicted when the keyspace is full. `noeviction` is the only one that does not evict — it blocks writes.',
    algorithmTitle: 'Algorithm (summary)',
    algorithmCode: `// On each tick(delta):
//   1) Apply expiration: keys with finite ttl and status='alive'
//      become 'expired' when (time - createdAt) >= ttl.
//   2) Memory = sum of size of keys with status='alive'.
//   3) If memory > maxMemory, evict by policy:
//      noeviction          → blocks (evict nothing).
//      allkeys-* / volatile-*: pick candidate by rule
//      (LRU/LFU/random/TTL). volatile-* ignores persistent keys.
//      Loop until it fits or candidates are exhausted.
//   4) Activity: each elapsed second, live keys may get
//      hits++ with the configured probability.
//`,
  },
}

// ─── Componente ───────────────────────────────────────────────────
export default function RedisTtlSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  // Estado principal
  const [keys, setKeys] = useState(() => SAMPLE_KEYS.map((k) => makeKey(k.name, k.size, k.type, k.ttl, 0)))
  const [time, setTime] = useState(0)
  const [peakMemory, setPeakMemory] = useState(0)
  const [events, setEvents] = useState([])
  const [maxMemory, setMaxMemory] = useState(8 * 1024) // 8 KB default — pequeno pra forçar evict logo
  const [maxMemoryInput, setMaxMemoryInput] = useState('8 KB')
  const [policy, setPolicy] = useState('allkeys-lru')
  const [speed, setSpeed] = useState(5)
  const [touchProbability, setTouchProbability] = useState(0.5) // por minuto
  const [isPlaying, setIsPlaying] = useState(false)

  // Novo key form
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('string')
  const [newSize, setNewSize] = useState('256 B')
  const [newTtl, setNewTtl] = useState(60)
  const [newPersistent, setNewPersistent] = useState(false)

  // Refs para o tick não depender de state antigo no setInterval
  const stateRef = useRef({ keys, time, events, peakMemory })
  useEffect(() => {
    stateRef.current = { keys, time, events, peakMemory }
  }, [keys, time, events, peakMemory])

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying) return undefined
    // 1 tick por ~80ms; speed controla quantos segundos de simulação por tick.
    const interval = setInterval(() => {
      const s = stateRef.current
      const result = tick(
        { time: s.time, keys: s.keys, events: s.events, memory: 0 },
        speed,
        policy,
        maxMemory,
        touchProbability
      )
      // novo pico
      const newPeak = Math.max(s.peakMemory, result.memory)
      setKeys(result.keys)
      setTime(result.time)
      setEvents((prev) => {
        const next = [...prev, ...result.events]
        return next.length > 80 ? next.slice(next.length - 80) : next
      })
      setPeakMemory(newPeak)
    }, 80)
    return () => clearInterval(interval)
  }, [isPlaying, speed, policy, maxMemory, touchProbability])

  // Memória atual calculada
  const currentMemory = useMemo(
    () => keys.reduce((acc, k) => (k.status === 'alive' ? acc + k.size : acc), 0),
    [keys]
  )

  const stats = useMemo(() => {
    let alive = 0
    let expired = 0
    let evicted = 0
    let hits = 0
    for (const k of keys) {
      if (k.status === 'alive') alive++
      else if (k.status === 'expired') expired++
      else if (k.status === 'evicted') evicted++
      hits += k.hits
    }
    return { total: keys.length, alive, expired, evicted, hits }
  }, [keys])

  // Intervalo de tempo da timeline
  const timeMax = useMemo(() => {
    let max = Math.ceil(time) + 60
    for (const k of keys) {
      const end = k.ttl === Infinity ? k.createdAt : k.createdAt + k.ttl
      if (end > max) max = Math.ceil(end) + 60
    }
    return Math.max(120, max)
  }, [keys, time])

  // Handlers
  function applySample() {
    setKeys(SAMPLE_KEYS.map((k) => makeKey(k.name, k.size, k.type, k.ttl, 0)))
    setTime(0)
    setPeakMemory(0)
    setEvents([])
    setIsPlaying(false)
  }
  function clearAll() {
    setKeys([])
    setTime(0)
    setPeakMemory(0)
    setEvents([])
    setIsPlaying(false)
  }
  function handleAddKey() {
    if (!newName.trim()) return
    const size = parseSize(newSize)
    const ttl = newPersistent ? Infinity : Math.max(1, Number(newTtl) || 60)
    setKeys((prev) => [
      ...prev,
      makeKey(newName.trim(), size, newType, ttl, 0),
    ])
    setNewName('')
    setNewSize('256 B')
    setNewTtl(60)
    setNewPersistent(false)
    setNewType('string')
  }
  function handleRemove(id) {
    setKeys((prev) => prev.filter((k) => k.id !== id))
  }
  function handleStep() {
    const s = stateRef.current
    const result = tick(
      { time: s.time, keys: s.keys, events: s.events, memory: 0 },
      60,
      policy,
      maxMemory,
      touchProbability
    )
    setKeys(result.keys)
    setTime(result.time)
    setEvents((prev) => {
      const next = [...prev, ...result.events]
      return next.length > 80 ? next.slice(next.length - 80) : next
    })
    setPeakMemory((prev) => Math.max(prev, result.memory))
  }
  function handleReset() {
    setKeys((prev) => prev.map((k) => ({ ...k, hits: 0, status: 'alive', createdAt: 0 })))
    setTime(0)
    setPeakMemory(0)
    setEvents([])
    setIsPlaying(false)
  }
  function handleMaxMemoryBlur() {
    const bytes = parseSize(maxMemoryInput)
    if (bytes > 0) setMaxMemory(bytes)
  }

  const memoryPercent = maxMemory > 0 ? Math.min(100, (currentMemory / maxMemory) * 100) : 0
  const peakPercent = maxMemory > 0 ? Math.min(100, (peakMemory / maxMemory) * 100) : 0
  const memoryColor = memoryPercent < 70 ? '#52c41a' : memoryPercent < 90 ? '#faad14' : '#f5222d'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ClockCircleOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {/* Configuração */}
      <Card title={t.configTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.maxMemory}</Text>
              <Input
                value={maxMemoryInput}
                onChange={(e) => setMaxMemoryInput(e.target.value)}
                onBlur={handleMaxMemoryBlur}
                onPressEnter={handleMaxMemoryBlur}
                placeholder="8 KB"
                addonAfter={
                  <Space size={0}>
                    <Button size="small" type="link" onClick={() => { setMaxMemoryInput('64 KB'); setMaxMemory(64 * 1024) }}>64K</Button>
                    <Button size="small" type="link" onClick={() => { setMaxMemoryInput('1 MB'); setMaxMemory(1024 * 1024) }}>1M</Button>
                  </Space>
                }
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {formatBytes(maxMemory)} ({formatBytes(currentMemory)} {t.memoryUsage.toLowerCase()})
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.policy}</Text>
              <Select
                value={policy}
                onChange={setPolicy}
                style={{ width: '100%' }}
                options={EVICTION_POLICIES.map((p) => ({
                  value: p,
                  label: t.policyShort[p] || p,
                }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.speedLabel}</Text>
              <Segmented
                value={speed}
                onChange={(v) => setSpeed(Number(v))}
                options={SIM_SPEEDS}
                block
              />
            </Space>
          </Col>
          <Col xs={24}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text type="secondary">{t.touchLabel}</Text>
                <Text style={{ fontSize: 12 }}>{touchProbability.toFixed(1)}/min</Text>
              </Space>
              <Slider
                min={0}
                max={5}
                step={0.1}
                value={touchProbability}
                onChange={setTouchProbability}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {t.touchHelp}
              </Text>
            </Space>
          </Col>
        </Row>
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginTop: 12 }}
          message={t.policyNote}
          description={t.policyDescriptions[policy]}
        />
      </Card>

      {/* Chaves */}
      <Card
        title={t.keysTitle}
        extra={
          <Space>
            <Button icon={<ThunderboltOutlined />} onClick={applySample}>{t.applySample}</Button>
            <Button icon={<DeleteOutlined />} onClick={clearAll} disabled={keys.length === 0}>{t.clearAll}</Button>
          </Space>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>{t.keysHelp}</Paragraph>
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t.newKey.name}
              onPressEnter={handleAddKey}
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              value={newType}
              onChange={setNewType}
              options={KEY_TYPES.map((tp) => ({ value: tp, label: tp }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder={t.newKey.size}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <InputNumber
              value={newTtl}
              onChange={(v) => setNewTtl(Number(v) || 1)}
              min={1}
              disabled={newPersistent}
              style={{ width: '100%' }}
              addonAfter="s"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Space style={{ width: '100%' }}>
              <Switch
                size="small"
                checked={newPersistent}
                onChange={setNewPersistent}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>{t.newKey.persistent}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button block icon={<PlusOutlined />} onClick={handleAddKey} disabled={!newName.trim()}>{t.addKey}</Button>
          </Col>
        </Row>
        {keys.length === 0 ? (
          <Empty description={t.eventsEmpty} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, fontFamily: 'monospace', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #d9d9d9', textAlign: 'left' }}>
                  <th style={{ padding: '4px 6px' }}>{t.newKey.name}</th>
                  <th style={{ padding: '4px 6px' }}>{t.newKey.type}</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>{t.newKey.size}</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>{t.newKey.ttl}</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>hits</th>
                  <th style={{ padding: '4px 6px' }}></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f0f0f0', opacity: k.status === 'alive' ? 1 : 0.5 }}>
                    <td style={{ padding: '4px 6px' }}>{k.name}</td>
                    <td style={{ padding: '4px 6px' }}>
                      <Tag color={TYPE_COLORS[k.type]} style={{ marginRight: 0 }}>{t.typeShort[k.type] || k.type}</Tag>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{formatBytes(k.size)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{k.ttl === Infinity ? '∞' : `${k.ttl}s`}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{k.hits}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                      <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => handleRemove(k.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Simulação */}
      <Card title={t.simulateTitle}>
        <Space wrap>
          {isPlaying ? (
            <Button icon={<PauseCircleOutlined />} onClick={() => setIsPlaying(false)}>{t.pause}</Button>
          ) : (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setIsPlaying(true)}>{t.play}</Button>
          )}
          <Button icon={<StepForwardOutlined />} onClick={handleStep}>{t.step}</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>{t.reset}</Button>
          <Tag icon={<ClockCircleOutlined />} color="blue">{t.currentTime}: {formatTime(time)}</Tag>
        </Space>
      </Card>

      {/* Estatísticas */}
      <Card title={t.statsTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.statTotal} value={stats.total} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.statAlive}
              value={stats.alive}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.statExpired}
              value={stats.expired}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.statEvicted}
              value={stats.evicted}
              valueStyle={{ color: '#f5222d' }}
              prefix={<FireOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.statHits} value={stats.hits} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.memoryNow}
              value={formatBytes(currentMemory)}
              valueStyle={{ color: memoryColor }}
            />
          </Col>
        </Row>
      </Card>

      {/* Memória */}
      <Card title={t.memoryTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>{t.memoryHelp}</Paragraph>
        <div style={{ height: 28, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              height: '100%',
              width: `${memoryPercent}%`,
              background: memoryColor,
              transition: 'width 0.1s linear',
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: memoryPercent > 50 ? '#fff' : '#262626',
          }}>
            {formatBytes(currentMemory)} / {formatBytes(maxMemory)} ({memoryPercent.toFixed(1)}%)
          </div>
        </div>
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col xs={24} sm={8}>
            <Text type="secondary">{t.memoryPeak}: </Text>
            <Text strong>{formatBytes(peakMemory)}</Text>
            <Text type="secondary"> ({peakPercent.toFixed(1)}%)</Text>
          </Col>
          <Col xs={24} sm={16}>
            {memoryPercent >= 100 && (
              <Alert
                type={policy === 'noeviction' ? 'error' : 'warning'}
                showIcon
                message={t.memoryOutExceeded}
              />
            )}
          </Col>
        </Row>
      </Card>

      {/* Timeline */}
      <Card title={t.timelineTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>{t.timelineHelp}</Paragraph>
        {keys.length === 0 ? (
          <Empty description={t.eventsEmpty} />
        ) : (
          <Timeline keys={keys} timeMax={timeMax} time={time} events={events} t={t} />
        )}
      </Card>

      {/* Log de eventos */}
      <Card title={t.eventsTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>{t.eventsHelp}</Paragraph>
        {events.length === 0 ? (
          <Empty description={t.eventsEmpty} />
        ) : (
          <div style={{ maxHeight: 280, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
            {[...events].reverse().map((ev, i) => (
              <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary">t={formatTime(ev.time)}</Text>{' '}
                {ev.type === 'expired' ? (
                  <Tag color="default" icon={<ClockCircleOutlined />}>{ev.name} {lang === 'pt' ? 'expirou' : 'expired'}</Tag>
                ) : (
                  <Tag color="red" icon={<FireOutlined />}>{ev.name} evicted ({t.evReason} {ev.reason})</Tag>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Algoritmo */}
      <Card title={t.algorithmTitle}>
        <pre style={{
          margin: 0,
          padding: 12,
          background: '#fafafa',
          border: '1px solid #f0f0f0',
          borderRadius: 4,
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: 12,
        }}>
          <code>{t.algorithmCode}</code>
        </pre>
      </Card>
    </Space>
  )
}

// ─── Timeline SVG ────────────────────────────────────────────────
function Timeline({ keys, timeMax, time, events, t }) {
  const ref = useRef(null)
  const [width, setWidth] = useState(800)
  useEffect(() => {
    if (!ref.current) return undefined
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.max(400, entry.contentRect.width))
      }
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const padding = { top: 12, right: 12, bottom: 26, left: 12 }
  const innerWidth = width - padding.left - padding.right
  const rowHeight = 18
  const innerHeight = Math.max(60, keys.length * rowHeight)
  const totalHeight = innerHeight + padding.top + padding.bottom

  const xFor = (s) => padding.left + (s / timeMax) * innerWidth

  // Eventos verticais: 1 a cada 60s, com label
  const ticks = []
  const step = timeMax > 600 ? 120 : timeMax > 300 ? 60 : timeMax > 120 ? 30 : 15
  for (let s = 0; s <= timeMax; s += step) {
    ticks.push(s)
  }

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width="100%" height={totalHeight} viewBox={`0 0 ${width} ${totalHeight}`}>
        {/* Linhas verticais de eventos */}
        {events.map((ev, i) => {
          const x = xFor(ev.time)
          if (x < padding.left || x > width - padding.right) return null
          const color = ev.type === 'expired' ? '#bfbfbf' : '#f5222d'
          return (
            <line
              key={i}
              x1={x} x2={x}
              y1={padding.top - 4}
              y2={innerHeight + padding.top}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.5}
            />
          )
        })}
        {/* Cursor do tempo atual */}
        {time > 0 && time <= timeMax && (
          <line
            x1={xFor(time)} x2={xFor(time)}
            y1={padding.top - 6}
            y2={innerHeight + padding.top}
            stroke="#1677ff"
            strokeWidth={2}
          />
        )}
        {/* Barras */}
        {keys.map((k, idx) => {
          const start = k.createdAt
          const end = k.ttl === Infinity ? timeMax : Math.min(timeMax, k.createdAt + k.ttl)
          const x1 = xFor(start)
          const x2 = xFor(end)
          const y = padding.top + idx * rowHeight + 2
          let color = TYPE_COLORS[k.type] || '#1677ff'
          if (k.status === 'expired') color = '#bfbfbf'
          else if (k.status === 'evicted') color = '#f5222d'
          const w = Math.max(2, x2 - x1)
          return (
            <g key={k.id}>
              <rect
                x={x1} y={y}
                width={w} height={rowHeight - 6}
                fill={color}
                opacity={k.status === 'alive' ? 0.85 : 0.55}
                rx={2}
              />
              <text
                x={x1 + 4} y={y + (rowHeight - 6) / 2 + 4}
                fill="#fff"
                fontSize={9}
                fontFamily="monospace"
                style={{ pointerEvents: 'none' }}
                clipPath={`inset(0 0 0 ${Math.max(0, w - 4)}px)`}
              >
                {k.name}
              </text>
            </g>
          )
        })}
        {/* Eixo X (ticks) */}
        {ticks.map((s) => {
          const x = xFor(s)
          return (
            <g key={s}>
              <line x1={x} x2={x} y1={innerHeight + padding.top} y2={innerHeight + padding.top + 4} stroke="#8c8c8c" />
              <text
                x={x}
                y={innerHeight + padding.top + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#8c8c8c"
                fontFamily="monospace"
              >
                {formatTime(s)}
              </text>
            </g>
          )
        })}
        {/* Label do eixo */}
        <text
          x={padding.left + innerWidth / 2}
          y={totalHeight - 4}
          textAnchor="middle"
          fontSize={10}
          fill="#8c8c8c"
        >
          {t.timelineAxis}
        </text>
      </svg>
    </div>
  )
}