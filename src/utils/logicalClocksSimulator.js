/**
 * Simulador de relógios lógicos (Lamport timestamps e vector clocks).
 * 100% client-side — nenhum dado sai do navegador.
 */

export const CLOCK_MODES = {
  LAMPORT: 'lamport',
  VECTOR: 'vector',
}

export const EVENT_TYPES = {
  LOCAL: 'local',
  SEND: 'send',
  RECEIVE: 'receive',
}

export function createProcess(id, label, color) {
  return {
    id,
    label: label || id,
    color: color || '#1677ff',
  }
}

export function createState(processes) {
  const vector = {}
  processes.forEach((p) => {
    vector[p.id] = 0
  })
  return {
    processes: processes.map((p) => ({ ...p })),
    events: [],
    nextIndex: {},
    lastVector: { ...vector },
    messageCounter: 0,
  }
}

function nextEventId(state, processId) {
  const idx = (state.nextIndex[processId] || 0) + 1
  state.nextIndex[processId] = idx
  return `${processId}-${idx}`
}

function bumpOwnClock(vector, processId) {
  return { ...vector, [processId]: (vector[processId] || 0) + 1 }
}

function mergeVectors(local, incoming) {
  const merged = { ...local }
  Object.keys(incoming).forEach((pid) => {
    merged[pid] = Math.max(merged[pid] || 0, incoming[pid] || 0)
  })
  return merged
}

function maxValue(vector) {
  return Math.max(0, ...Object.values(vector).map(Number))
}

export function addLocalEvent(state, processId, label) {
  const vector = bumpOwnClock(state.lastVector, processId)
  state.lastVector = vector
  const event = {
    id: nextEventId(state, processId),
    processId,
    index: state.nextIndex[processId],
    type: EVENT_TYPES.LOCAL,
    label: label || 'local',
    vector: { ...vector },
    lamport: maxValue(vector),
  }
  state.events.push(event)
  return event
}

export function addSendEvent(state, fromProcessId, toProcessId, label) {
  const sendVector = bumpOwnClock(state.lastVector, fromProcessId)
  state.lastVector = sendVector
  state.messageCounter += 1
  const messageId = `m${state.messageCounter}`
  const sendEvent = {
    id: nextEventId(state, fromProcessId),
    processId: fromProcessId,
    index: state.nextIndex[fromProcessId],
    type: EVENT_TYPES.SEND,
    label: label || `send ${messageId}`,
    vector: { ...sendVector },
    lamport: maxValue(sendVector),
    targetId: toProcessId,
    messageId,
  }
  state.events.push(sendEvent)
  return { sendEvent, messageId, sendVector }
}

export function addReceiveEvent(state, processId, messageId, sendVector, label) {
  let vector = { ...state.lastVector }
  vector = mergeVectors(vector, sendVector)
  vector = bumpOwnClock(vector, processId)
  state.lastVector = vector
  const event = {
    id: nextEventId(state, processId),
    processId,
    index: state.nextIndex[processId],
    type: EVENT_TYPES.RECEIVE,
    label: label || `recv ${messageId}`,
    vector: { ...vector },
    lamport: maxValue(vector),
    messageId,
  }
  state.events.push(event)
  return event
}

export function compareVectorClocks(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  let less = false
  let greater = false
  let allEqual = true
  for (const k of keys) {
    const av = a[k] || 0
    const bv = b[k] || 0
    if (av !== bv) allEqual = false
    if (av < bv) less = true
    if (av > bv) greater = true
  }
  if (allEqual) return 'equal'
  if (less && !greater) return 'before'
  if (greater && !less) return 'after'
  return 'concurrent'
}

export function compareEvents(a, b) {
  return compareVectorClocks(a.vector, b.vector)
}

export function formatVector(vector, empty = '—') {
  const entries = Object.entries(vector)
  if (entries.length === 0) return empty
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pid, v]) => `${pid}:${v}`)
    .join(', ')
}

export function eventsByProcess(state) {
  const map = {}
  state.processes.forEach((p) => {
    map[p.id] = []
  })
  state.events.forEach((e) => {
    if (map[e.processId]) map[e.processId].push(e)
  })
  return map
}

export function buildScenario(name, builderFn) {
  return { name, build: builderFn }
}

const PRESETS_PT = {
  simpleMessage: {
    label: 'Mensagem simples',
    description: 'P1 envia uma mensagem para P2. Veja como o vector clock do receive herda o estado de P1.',
  },
  chain: {
    label: 'Cadeia causal',
    description: 'P1 → P2 → P3. O evento final de P3 depende indiretamente do primeiro evento de P1.',
  },
  concurrent: {
    label: 'Eventos concorrentes',
    description: 'P1 e P2 executam eventos locais independentes. Seus vector clocks são incomparáveis.',
  },
  race: {
    label: 'Conflito de mensagens',
    description: 'P1 e P2 enviam mensagens para P3. P3 recebe ambas e seus relógios se combinam.',
  },
}

const PRESETS_EN = {
  simpleMessage: {
    label: 'Simple message',
    description: 'P1 sends a message to P2. See how the receive vector clock inherits P1 state.',
  },
  chain: {
    label: 'Causal chain',
    description: 'P1 → P2 → P3. The final P3 event indirectly depends on the first P1 event.',
  },
  concurrent: {
    label: 'Concurrent events',
    description: 'P1 and P2 run independent local events. Their vector clocks are incomparable.',
  },
  race: {
    label: 'Message race',
    description: 'P1 and P2 send messages to P3. P3 receives both and merges their clocks.',
  },
}

export const PRESETS = {
  pt: PRESETS_PT,
  en: PRESETS_EN,
}

function makeProcesses() {
  return [
    createProcess('p1', 'P1', '#1677ff'),
    createProcess('p2', 'P2', '#52c41a'),
    createProcess('p3', 'P3', '#faad14'),
  ]
}

export function buildSimpleMessageScenario() {
  const state = createState(makeProcesses())
  addLocalEvent(state, 'p1', 'a')
  const { sendEvent, messageId, sendVector } = addSendEvent(state, 'p1', 'p2', 'm')
  addLocalEvent(state, 'p2', 'b')
  const receiveEvent = addReceiveEvent(state, 'p2', messageId, sendVector, 'm')
  sendEvent.pairEventId = receiveEvent.id
  receiveEvent.pairEventId = sendEvent.id
  return state
}

export function buildCausalChainScenario() {
  const state = createState(makeProcesses())
  addLocalEvent(state, 'p1', 'a')
  const { sendEvent: s1, messageId: m1, sendVector: v1 } = addSendEvent(state, 'p1', 'p2', 'm1')
  addLocalEvent(state, 'p2', 'b')
  const r1 = addReceiveEvent(state, 'p2', m1, v1, 'm1')
  s1.pairEventId = r1.id
  r1.pairEventId = s1.id
  const { sendEvent: s2, messageId: m2, sendVector: v2 } = addSendEvent(state, 'p2', 'p3', 'm2')
  addLocalEvent(state, 'p3', 'c')
  const r2 = addReceiveEvent(state, 'p3', m2, v2, 'm2')
  s2.pairEventId = r2.id
  r2.pairEventId = s2.id
  return state
}

export function buildConcurrentScenario() {
  const state = createState(makeProcesses())
  addLocalEvent(state, 'p1', 'a')
  addLocalEvent(state, 'p1', 'b')
  addLocalEvent(state, 'p2', 'c')
  addLocalEvent(state, 'p2', 'd')
  addLocalEvent(state, 'p3', 'e')
  return state
}

export function buildRaceScenario() {
  const state = createState(makeProcesses())
  addLocalEvent(state, 'p1', 'a')
  addLocalEvent(state, 'p2', 'b')
  const { sendEvent: s1, messageId: m1, sendVector: v1 } = addSendEvent(state, 'p1', 'p3', 'm1')
  const { sendEvent: s2, messageId: m2, sendVector: v2 } = addSendEvent(state, 'p2', 'p3', 'm2')
  addLocalEvent(state, 'p3', 'c')
  const r1 = addReceiveEvent(state, 'p3', m1, v1, 'm1')
  const r2 = addReceiveEvent(state, 'p3', m2, v2, 'm2')
  s1.pairEventId = r1.id
  r1.pairEventId = s1.id
  s2.pairEventId = r2.id
  r2.pairEventId = s2.id
  return state
}

export function getScenario(key) {
  switch (key) {
    case 'simpleMessage':
      return buildSimpleMessageScenario()
    case 'chain':
      return buildCausalChainScenario()
    case 'concurrent':
      return buildConcurrentScenario()
    case 'race':
      return buildRaceScenario()
    default:
      return buildSimpleMessageScenario()
  }
}

export function sourceCode() {
  return `import {
  createState,
  createProcess,
  addLocalEvent,
  addSendEvent,
  addReceiveEvent,
  compareVectorClocks,
} from '../utils/logicalClocksSimulator'

// Criar três processos
const state = createState([
  createProcess('p1', 'P1', '#1677ff'),
  createProcess('p2', 'P2', '#52c41a'),
  createProcess('p3', 'P3', '#faad14'),
])

// Evento local em P1
addLocalEvent(state, 'p1', 'a')

// P1 envia mensagem para P2
const { sendEvent, messageId, sendVector } = addSendEvent(state, 'p1', 'p2', 'm')

// P2 recebe a mensagem (merge de vector clocks)
addReceiveEvent(state, 'p2', messageId, sendVector, 'm')

// Comparar causalidade entre dois eventos
const result = compareVectorClocks(
  { p1: 1, p2: 0, p3: 0 },
  { p1: 1, p2: 2, p3: 0 }
)
// result: 'before' | 'after' | 'concurrent' | 'equal'
`
}
