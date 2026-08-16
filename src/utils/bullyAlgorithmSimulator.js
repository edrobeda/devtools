// Simulador pedagógico do Algoritmo do Bully para eleição de líder.
// Implementação 100% client-side e passo a passo: cada nó tem um ID, e
// o nó com maior ID sempre vence. Quando o líder falha, o próximo nó
// ativo com maior ID inicia eleição e se anuncia como coordenador.

export const STATES = {
  NORMAL: 'NORMAL',
  ELECTION: 'ELECTION',
  WAITING: 'WAITING',
  LEADER: 'LEADER',
  FAILED: 'FAILED',
}

export const MESSAGE_TYPES = {
  ELECTION: 'ELECTION',
  ALIVE: 'ALIVE',
  COORDINATOR: 'COORDINATOR',
}

const PALETTE = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d']

function majority(n) {
  return Math.floor(n / 2) + 1
}

export function createInitialState(nodeCount = 5) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: i,
    priority: i + 1,
    state: STATES.NORMAL,
    leaderId: null,
    color: PALETTE[i % PALETTE.length],
    waitingReplies: 0,
    failed: false,
  }))

  return {
    nodes,
    messages: [],
    eventCounter: 0,
    step: 0,
    leaderId: null,
    log: [],
  }
}

export function resetState(nodeCount = 5) {
  return createInitialState(nodeCount)
}

function logEvent(state, text) {
  return {
    ...state,
    log: [{ step: state.step + 1, text }, ...state.log].slice(0, 100),
  }
}

function sendMessage(state, from, to, type, payload = {}) {
  const sender = state.nodes[from]
  const receiver = state.nodes[to]
  if (!sender || sender.failed || !receiver || receiver.failed) return state
  return {
    ...state,
    messages: [
      ...state.messages,
      {
        id: state.eventCounter++,
        from,
        to,
        type,
        payload,
        delivered: false,
      },
    ],
  }
}

function sendToAllHigher(state, from, type, payload = {}) {
  let next = state
  state.nodes
    .filter((n) => n.id > from && !n.failed)
    .forEach((n) => {
      next = sendMessage(next, from, n.id, type, payload)
    })
  return next
}

function sendToAllLower(state, from, type, payload = {}) {
  let next = state
  state.nodes
    .filter((n) => n.id < from && !n.failed)
    .forEach((n) => {
      next = sendMessage(next, from, n.id, type, payload)
    })
  return next
}

export function startElection(state, nodeId) {
  const node = state.nodes[nodeId]
  if (!node || node.failed) return state

  const higherCount = state.nodes.filter((n) => n.id > nodeId && !n.failed).length

  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId
        ? {
            ...n,
            state: higherCount > 0 ? STATES.WAITING : STATES.ELECTION,
            waitingReplies: higherCount,
            leaderId: null,
          }
        : n
    ),
    leaderId: null,
    step: state.step + 1,
  }

  if (higherCount > 0) {
    nextState = logEvent(nextState, `Nó ${nodeId} inicia eleição e pergunta aos superiores`)
    nextState = sendToAllHigher(nextState, nodeId, MESSAGE_TYPES.ELECTION)
  } else {
    nextState = logEvent(nextState, `Nó ${nodeId} inicia eleição — não há superiores ativos`)
  }

  return nextState
}

export function declareCoordinator(state, nodeId) {
  const node = state.nodes[nodeId]
  if (!node || node.failed) return state

  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, state: STATES.LEADER, leaderId: nodeId, waitingReplies: 0 } : n
    ),
    leaderId: nodeId,
    step: state.step + 1,
  }

  nextState = logEvent(nextState, `Nó ${nodeId} é eleito líder (maior ID ativo)`)
  nextState = sendToAllLower(nextState, nodeId, MESSAGE_TYPES.COORDINATOR, { leaderId: nodeId })
  nextState = sendToAllHigher(nextState, nodeId, MESSAGE_TYPES.COORDINATOR, { leaderId: nodeId })
  return nextState
}

function handleElectionMessage(state, msg) {
  const receiver = state.nodes[msg.to]
  if (!receiver || receiver.failed) return state

  // responde ALIVE e inicia sua própria eleição
  let nextState = sendMessage(state, msg.to, msg.from, MESSAGE_TYPES.ALIVE)
  nextState = logEvent(nextState, `Nó ${msg.to} responde ALIVE para ${msg.from} e inicia eleição`)
  return startElection(nextState, msg.to)
}

function handleAliveMessage(state, msg) {
  const candidate = state.nodes[msg.to]
  if (!candidate || candidate.failed) return state

  const waitingReplies = Math.max(0, candidate.waitingReplies - 1)
  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === msg.to
        ? { ...n, waitingReplies, state: waitingReplies === 0 ? STATES.NORMAL : STATES.WAITING }
        : n
    ),
    step: state.step + 1,
  }

  nextState = logEvent(nextState, `Nó ${msg.to} recebe ALIVE de ${msg.from} e desiste`)
  return nextState
}

function handleCoordinatorMessage(state, msg) {
  const receiver = state.nodes[msg.to]
  if (!receiver || receiver.failed) return state
  const leaderId = msg.payload.leaderId

  const nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === msg.to ? { ...n, state: STATES.NORMAL, leaderId } : n
    ),
    leaderId,
    step: state.step + 1,
  }
  return logEvent(nextState, `Nó ${msg.to} reconhece ${leaderId} como líder`)
}

function deliverNextMessage(state) {
  const pending = state.messages.find((m) => !m.delivered)
  if (!pending) return null

  let nextState = {
    ...state,
    messages: state.messages.map((m) => (m.id === pending.id ? { ...m, delivered: true } : m)),
  }

  if (pending.type === MESSAGE_TYPES.ELECTION) {
    nextState = handleElectionMessage(nextState, pending)
  } else if (pending.type === MESSAGE_TYPES.ALIVE) {
    nextState = handleAliveMessage(nextState, pending)
  } else if (pending.type === MESSAGE_TYPES.COORDINATOR) {
    nextState = handleCoordinatorMessage(nextState, pending)
  }

  return nextState
}

function triggerNextTimeout(state) {
  // Se houver nó em WAITING sem mensagens pendentes direcionadas a ele,
  // ele vence a eleição. Também detecta líder ausente.
  const waitingNode = state.nodes.find(
    (n) => n.state === STATES.WAITING && n.waitingReplies === 0
  )
  if (waitingNode) {
    return declareCoordinator(state, waitingNode.id)
  }

  // Se o líder falhou, o próximo nó ativo de maior prioridade inicia eleição
  if (state.leaderId !== null && state.nodes[state.leaderId]?.failed) {
    const candidates = state.nodes.filter((n) => !n.failed && n.id !== state.leaderId)
    if (candidates.length > 0) {
      const highest = candidates.reduce((a, b) => (a.id > b.id ? a : b))
      return startElection(state, highest.id)
    }
  }

  return null
}

export function stepSimulation(state) {
  if (state.messages.some((m) => !m.delivered)) {
    return deliverNextMessage(state)
  }
  return triggerNextTimeout(state)
}

export function runUntilStable(state, maxSteps = 100) {
  let current = state
  for (let i = 0; i < maxSteps; i++) {
    const next = stepSimulation(current)
    if (!next) break
    current = next
    const hasLeader = current.nodes.some((n) => n.state === STATES.LEADER && !n.failed)
    const pending = current.messages.some((m) => !m.delivered)
    if (hasLeader && !pending) break
  }
  return current
}

export function toggleNodeFailure(state, nodeId) {
  const node = state.nodes[nodeId]
  if (!node) return state

  if (node.failed) {
    // recuperação: volta como NORMAL sem líder e inicia eleição
    let nextState = {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, failed: false, state: STATES.NORMAL, leaderId: state.leaderId, waitingReplies: 0 }
          : n
      ),
      step: state.step + 1,
    }
    nextState = logEvent(nextState, `Nó ${nodeId} recupera e inicia eleição`)
    return startElection(nextState, nodeId)
  }

  // falha
  const wasLeader = node.state === STATES.LEADER
  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, failed: true, state: STATES.FAILED, leaderId: null, waitingReplies: 0 }
        : n
    ),
    step: state.step + 1,
  }

  if (wasLeader) {
    nextState = logEvent(nextState, `Nó ${nodeId} (líder) falha`)
    nextState = { ...nextState, leaderId: null }
  } else {
    nextState = logEvent(nextState, `Nó ${nodeId} falha`)
  }

  return nextState
}

export function setPreset(preset, nodeCount = 5) {
  if (preset === 'election') {
    let state = createInitialState(nodeCount)
    return startElection(state, 0)
  }
  if (preset === 'leader-failure') {
    let state = createInitialState(nodeCount)
    state = runUntilStable(state)
    if (state.leaderId !== null) {
      state = toggleNodeFailure(state, state.leaderId)
    }
    return state
  }
  if (preset === 'highest-recovers') {
    let state = createInitialState(nodeCount)
    state = runUntilStable(state)
    const highest = state.nodes.reduce((a, b) => (a.id > b.id ? a : b))
    if (highest.failed) {
      state = toggleNodeFailure(state, highest.id)
    }
    return state
  }
  if (preset === 'partition') {
    let state = createInitialState(nodeCount)
    state = runUntilStable(state)
    // força falha do líder e de um nó intermediário, deixando eleição
    // para o maior ID restante
    const active = state.nodes.filter((n) => !n.failed)
    if (active.length >= 3) {
      state = toggleNodeFailure(state, active[active.length - 1].id)
      state = toggleNodeFailure(state, active[active.length - 2].id)
    }
    return state
  }
  if (preset === 'tie-break') {
    // cenário com 2 nós: o de maior ID sempre vence
    let state = createInitialState(2)
    return startElection(state, 0)
  }
  return createInitialState(nodeCount)
}

export function sourceCode() {
  return `// Motor do Algoritmo do Bully (simplificado)

const STATES = { NORMAL, ELECTION, WAITING, LEADER, FAILED }
const MESSAGE_TYPES = { ELECTION, ALIVE, COORDINATOR }

function startElection(state, nodeId) {
  const higher = state.nodes.filter(n => n.id > nodeId && !n.failed)
  if (higher.length === 0) {
    return declareCoordinator(state, nodeId)
  }
  // envia ELECTION para todos os nós de ID maior
  higher.forEach(n => sendMessage(state, nodeId, n.id, ELECTION))
  return setNodeState(state, nodeId, WAITING, higher.length)
}

function handleElection(state, msg) {
  // responde ALIVE e inicia própria eleição
  sendMessage(state, msg.to, msg.from, ALIVE)
  return startElection(state, msg.to)
}

function handleAlive(state, msg) {
  const candidate = state.nodes[msg.to]
  const remaining = candidate.waitingReplies - 1
  if (remaining === 0) {
    return declareCoordinator(state, msg.to)
  }
  return setNodeState(state, msg.to, WAITING, remaining)
}

function declareCoordinator(state, nodeId) {
  setNodeState(state, nodeId, LEADER)
  state.nodes
    .filter(n => !n.failed && n.id !== nodeId)
    .forEach(n => sendMessage(state, nodeId, n.id, COORDINATOR))
}

function stepSimulation(state) {
  if (há mensagens pendentes) return entregarPróximaMensagem(state)
  if (líder falhou) return iniciarEleiçãoPeloMaiorAtivo(state)
  return null
}`
}
