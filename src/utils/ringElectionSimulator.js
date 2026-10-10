// Simulador pedagógico do algoritmo de eleição em anel (Chang-Roberts).
// Implementação 100% client-side e passo a passo: os processos estão
// organizados logicamente em um anel e elegem o de maior ID trocando
// mensagens unidirecionais com o próximo vizinho ativo.
// O harness comum (estado inicial, log, fila/entrega de mensagens,
// estabilização, queda/recuperacao e presets genericos) vive em
// leaderElectionHarness.js — este arquivo guarda só a máquina do anel.

import {
  BASE_MESSAGE_TYPES,
  BASE_STATES,
  createBaseState,
  deliverPendingMessage,
  logEvent,
  presetFailLeader,
  presetStartElection,
  queueMessage,
  runUntilStable as runUntilStableBase,
  stepOnce,
  toggleNodeFailure as toggleNodeFailureBase,
} from './leaderElectionHarness'

export const STATES = {
  ...BASE_STATES,
}

export const MESSAGE_TYPES = {
  ...BASE_MESSAGE_TYPES,
}

export function createInitialState(nodeCount = 5) {
  return createBaseState(nodeCount)
}

export function resetState(nodeCount = 5) {
  return createInitialState(nodeCount)
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

  return queueMessage(state, { from, to, type, candidateId })
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

function dispatchMessage(nextState, pending) {
  if (pending.type === MESSAGE_TYPES.ELECTION) {
    return handleElectionMessage(nextState, pending)
  }
  if (pending.type === MESSAGE_TYPES.COORDINATOR) {
    return handleCoordinatorMessage(nextState, pending)
  }
  return nextState
}

function deliverNextMessage(state) {
  return deliverPendingMessage(state, dispatchMessage, true)
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
  return stepOnce(state, deliverNextMessage, triggerAutoElection)
}

export function runUntilStable(state, maxSteps = 200) {
  return runUntilStableBase(state, stepSimulation, maxSteps)
}

export function toggleNodeFailure(state, nodeId) {
  return toggleNodeFailureBase(state, nodeId, { startElection })
}

export function setPreset(preset, nodeCount = 5) {
  if (preset === 'election') {
    return presetStartElection({ createInitialState, startElection }, nodeCount)
  }
  if (preset === 'leader-failure') {
    return presetFailLeader({ createInitialState, runUntilStable, toggleNodeFailure }, nodeCount)
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
    return presetStartElection({ createInitialState, startElection }, 2)
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
