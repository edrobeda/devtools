// Simulador pedagógico do algoritmo de eleição em anel (Chang-Roberts).
// Implementação 100% client-side e passo a passo: os processos estão
// organizados logicamente em um anel e elegem o de maior ID trocando
// mensagens unidirecionais com o próximo vizinho ativo.

export const STATES = {
  NORMAL: 'NORMAL',
  ELECTION: 'ELECTION',
  LEADER: 'LEADER',
  FAILED: 'FAILED',
}

export const MESSAGE_TYPES = {
  ELECTION: 'ELECTION',
  COORDINATOR: 'COORDINATOR',
}

const PALETTE = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d']

export function createInitialState(nodeCount = 5) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: i,
    priority: i + 1,
    state: STATES.NORMAL,
    leaderId: null,
    color: PALETTE[i % PALETTE.length],
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

export function nextActiveNode(state, fromId) {
  const n = state.nodes.length
  for (let offset = 1; offset <= n; offset++) {
    const id = (fromId + offset) % n
    const node = state.nodes[id]
    if (node && !node.failed) return id
  }
  return null
}

function sendMessage(state, from, type, candidateId) {
  const sender = state.nodes[from]
  if (!sender || sender.failed) return state

  const to = nextActiveNode(state, from)
  if (to === null) return state

  return {
    ...state,
    messages: [
      ...state.messages,
      {
        id: state.eventCounter++,
        from,
        to,
        type,
        candidateId,
        delivered: false,
      },
    ],
  }
}

export function startElection(state, nodeId) {
  const node = state.nodes[nodeId]
  if (!node || node.failed) return state
  if (state.nodes.filter((n) => !n.failed).length <= 1) {
    // com apenas um nó ativo, ele é líder imediatamente
    let nextState = {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, state: STATES.LEADER, leaderId: nodeId } : n
      ),
      leaderId: nodeId,
      step: state.step + 1,
    }
    return logEvent(nextState, `Nó ${nodeId} é o único ativo e assume a liderança`)
  }

  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, state: STATES.ELECTION, leaderId: null } : n
    ),
    leaderId: null,
    step: state.step + 1,
  }
  nextState = logEvent(nextState, `Nó ${nodeId} inicia eleição no anel`)
  return sendMessage(nextState, nodeId, MESSAGE_TYPES.ELECTION, nodeId)
}

function handleElectionMessage(state, msg) {
  const receiver = state.nodes[msg.to]
  if (!receiver || receiver.failed) {
    // mensagem chega a um nó falho: é perdida
    return logEvent(state, `Mensagem ELECTION(${msg.candidateId}) para Nó ${msg.to} perdida (falho)`)
  }

  const candidateId = msg.candidateId
  let nextState = state

  if (candidateId > receiver.id) {
    // repassa o candidato maior para o próximo ativo
    nextState = logEvent(nextState, `Nó ${msg.to} repassa ELECTION(${candidateId})`)
    return sendMessage(nextState, msg.to, MESSAGE_TYPES.ELECTION, candidateId)
  }

  if (candidateId < receiver.id) {
    // candidato é menor: descarta e propõe a si mesmo
    nextState = logEvent(nextState, `Nó ${msg.to} descarta ${candidateId} e propõe seu ID`)
    nextState = {
      ...nextState,
      nodes: nextState.nodes.map((n) =>
        n.id === msg.to ? { ...n, state: STATES.ELECTION } : n
      ),
    }
    return sendMessage(nextState, msg.to, MESSAGE_TYPES.ELECTION, msg.to)
  }

  // candidateId === receiver.id: deu a volta completa, este é o líder
  nextState = {
    ...nextState,
    nodes: nextState.nodes.map((n) =>
      n.id === msg.to ? { ...n, state: STATES.LEADER, leaderId: msg.to } : n
    ),
    leaderId: msg.to,
    step: nextState.step + 1,
  }
  nextState = logEvent(nextState, `Nó ${msg.to} recebeu seu próprio ID e é eleito líder`)
  return sendMessage(nextState, msg.to, MESSAGE_TYPES.COORDINATOR, msg.to)
}

function handleCoordinatorMessage(state, msg) {
  const receiver = state.nodes[msg.to]
  if (!receiver || receiver.failed) {
    return logEvent(state, `Mensagem COORDINATOR(${msg.candidateId}) para Nó ${msg.to} perdida (falho)`)
  }

  const leaderId = msg.candidateId
  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === msg.to ? { ...n, state: STATES.NORMAL, leaderId } : n
    ),
    leaderId,
    step: state.step + 1,
  }

  if (leaderId === msg.to) {
    // a mensagem já deu a volta completa
    return logEvent(nextState, `COORDINATOR deu a volta completa no anel`)
  }

  nextState = logEvent(nextState, `Nó ${msg.to} reconhece ${leaderId} como líder e repassa`)
  return sendMessage(nextState, msg.to, MESSAGE_TYPES.COORDINATOR, leaderId)
}

function deliverNextMessage(state) {
  const pending = state.messages.find((m) => !m.delivered)
  if (!pending) return null

  let nextState = {
    ...state,
    messages: state.messages.map((m) => (m.id === pending.id ? { ...m, delivered: true } : m)),
    step: state.step + 1,
  }

  if (pending.type === MESSAGE_TYPES.ELECTION) {
    nextState = handleElectionMessage(nextState, pending)
  } else if (pending.type === MESSAGE_TYPES.COORDINATOR) {
    nextState = handleCoordinatorMessage(nextState, pending)
  }

  return nextState
}

function triggerAutoElection(state) {
  // Se não há líder, não há mensagens pendentes e ainda existem nós ativos,
  // o menor ID ativo inicia uma eleição para evitar deadlock.
  const active = state.nodes.filter((n) => !n.failed)
  if (active.length === 0) return null

  const hasLeader = active.some((n) => n.state === STATES.LEADER)
  if (hasLeader) return null

  const pendingElection = state.messages.some(
    (m) => !m.delivered && m.type === MESSAGE_TYPES.ELECTION
  )
  if (pendingElection) return null

  const starter = active.reduce((a, b) => (a.id < b.id ? a : b))
  return startElection(state, starter.id)
}

export function stepSimulation(state) {
  if (state.messages.some((m) => !m.delivered)) {
    return deliverNextMessage(state)
  }
  return triggerAutoElection(state)
}

export function runUntilStable(state, maxSteps = 200) {
  let current = state
  for (let i = 0; i < maxSteps; i++) {
    const next = stepSimulation(current)
    if (!next) break
    current = next
    const active = current.nodes.filter((n) => !n.failed)
    const hasLeader = active.some((n) => n.state === STATES.LEADER)
    const pending = current.messages.some((m) => !m.delivered)
    if (hasLeader && !pending) break
  }
  return current
}

export function toggleNodeFailure(state, nodeId) {
  const node = state.nodes[nodeId]
  if (!node) return state

  if (node.failed) {
    let nextState = {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, failed: false, state: STATES.NORMAL, leaderId: state.leaderId }
          : n
      ),
      step: state.step + 1,
    }
    nextState = logEvent(nextState, `Nó ${nodeId} recupera e inicia eleição`)
    return startElection(nextState, nodeId)
  }

  const wasLeader = node.state === STATES.LEADER
  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, failed: true, state: STATES.FAILED, leaderId: null } : n
    ),
    leaderId: wasLeader ? null : state.leaderId,
    step: state.step + 1,
  }

  if (wasLeader) {
    nextState = logEvent(nextState, `Nó ${nodeId} (líder) falha`)
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
    if (!highest.failed) {
      state = toggleNodeFailure(state, highest.id)
    }
    return state
  }
  if (preset === 'mid-failure') {
    // falha um nó no meio do anel durante uma eleição
    let state = createInitialState(nodeCount)
    state = startElection(state, 0)
    // entrega uma mensagem para começar a propagar
    state = stepSimulation(state) || state
    const active = state.nodes.filter((n) => !n.failed && n.id !== 0)
    if (active.length > 0) {
      const mid = active[Math.floor(active.length / 2)]
      state = toggleNodeFailure(state, mid.id)
    }
    return state
  }
  if (preset === 'two-nodes') {
    let state = createInitialState(2)
    return startElection(state, 0)
  }
  return createInitialState(nodeCount)
}

export function sourceCode() {
  return `// Motor do algoritmo de eleição em anel (Chang-Roberts)

const STATES = { NORMAL, ELECTION, LEADER, FAILED }
const MESSAGE_TYPES = { ELECTION, COORDINATOR }

function nextActiveNode(state, fromId) {
  const n = state.nodes.length
  for (let offset = 1; offset <= n; offset++) {
    const id = (fromId + offset) % n
    if (state.nodes[id] && !state.nodes[id].failed) return id
  }
  return null
}

function startElection(state, nodeId) {
  state.nodes[nodeId].state = ELECTION
  sendMessage(state, nodeId, ELECTION, nodeId) // para o próximo ativo
}

function handleElection(state, msg) {
  const receiver = state.nodes[msg.to]
  if (msg.candidateId > receiver.id) {
    // candidato maior: apenas repassa
    sendMessage(state, msg.to, ELECTION, msg.candidateId)
  } else if (msg.candidateId < receiver.id) {
    // candidato menor: descarta e propõe a si
    receiver.state = ELECTION
    sendMessage(state, msg.to, ELECTION, msg.to)
  } else {
    // recebeu seu próprio ID -> é líder
    receiver.state = LEADER
    sendMessage(state, msg.to, COORDINATOR, msg.to)
  }
}

function handleCoordinator(state, msg) {
  const receiver = state.nodes[msg.to]
  receiver.state = NORMAL
  receiver.leaderId = msg.candidateId
  if (msg.candidateId !== msg.to) {
    sendMessage(state, msg.to, COORDINATOR, msg.candidateId)
  }
}

function stepSimulation(state) {
  const pending = state.messages.find(m => !m.delivered)
  if (pending) {
    pending.delivered = true
    if (pending.type === ELECTION) handleElection(state, pending)
    else if (pending.type === COORDINATOR) handleCoordinator(state, pending)
    return state
  }
  // se não há líder nem mensagens pendentes, reinicia eleição
  const active = state.nodes.filter(n => !n.failed)
  if (active.length && !active.some(n => n.state === LEADER)) {
    const starter = active.reduce((a, b) => a.id < b.id ? a : b)
    return startElection(state, starter.id)
  }
  return null
}`
}
