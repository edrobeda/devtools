// Harness base compartilhado pelos motores dos simuladores de eleicao de
// lider: /tools/bully-algorithm-simulator (Algoritmo do Bully) e
// /tools/ring-election-simulator (Chang-Roberts em anel).
//
// Os dois algoritmos sao legitimamente distintos — o Bully envia ELECTION para
// todos os IDs maiores e espera ALIVE, o anel circula a mensagem pelo vizinho
// ativo — entao as maquinas de eleicao continuam em arquivos separados. O que
// vivia copiado byte a byte nos dois (paleta de cores, estados/tipos de
// mensagem de base, no inicial, log, fila e entrega de mensagens,
// estabilizacao, queda/recuperacao e os dois presets genericos) fica aqui.

const PALETTE = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d']

// Estados e tipos de mensagem que os dois algoritmos compartilham. O Bully
// acrescenta o estado WAITING e o tipo ALIVE; o anel usa soh isto.
export const BASE_STATES = {
  NORMAL: 'NORMAL',
  ELECTION: 'ELECTION',
  LEADER: 'LEADER',
  FAILED: 'FAILED',
}

export const BASE_MESSAGE_TYPES = {
  ELECTION: 'ELECTION',
  COORDINATOR: 'COORDINATOR',
}

// Estado inicial dos dois simuladores; `extraNodeFields` carrega o que existe
// soh num deles (ex.: waitingReplies do Bully).
export function createBaseState(nodeCount = 5, extraNodeFields = {}) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: i,
    priority: i + 1,
    state: BASE_STATES.NORMAL,
    leaderId: null,
    color: PALETTE[i % PALETTE.length],
    failed: false,
    ...extraNodeFields,
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

export function logEvent(state, text) {
  return {
    ...state,
    log: [{ step: state.step + 1, text }, ...state.log].slice(0, 100),
  }
}

export function queueMessage(state, message) {
  return {
    ...state,
    messages: [
      ...state.messages,
      { id: state.eventCounter++, ...message, delivered: false },
    ],
  }
}

export function hasPendingMessages(state) {
  return state.messages.some((m) => !m.delivered)
}

// Marca a proxima mensagem pendente como entregue e a manda pro handler do
// algoritmo. `bumpStep` existe porque o anel conta a entrega como passo e o
// Bully nao.
export function deliverPendingMessage(state, dispatch, bumpStep = false) {
  const pending = state.messages.find((m) => !m.delivered)
  if (!pending) return null

  let nextState = {
    ...state,
    messages: state.messages.map((m) => (m.id === pending.id ? { ...m, delivered: true } : m)),
  }
  if (bumpStep) nextState = { ...nextState, step: nextState.step + 1 }
  return dispatch(nextState, pending)
}

export function stepOnce(state, deliver, onIdle) {
  if (hasPendingMessages(state)) return deliver(state)
  return onIdle(state)
}

export function runUntilStable(state, stepSimulation, maxSteps = 100) {
  let current = state
  for (let i = 0; i < maxSteps; i++) {
    const next = stepSimulation(current)
    if (!next) break
    current = next
    const hasLeader = current.nodes.some((n) => n.state === BASE_STATES.LEADER && !n.failed)
    const pending = hasPendingMessages(current)
    if (hasLeader && !pending) break
  }
  return current
}

// Queda/recuperacao manual de um no: identica nos dois algoritmos, exceto os
// campos extra do no (waitingReplies no Bully) e quem reinicia a eleicao.
export function toggleNodeFailure(state, nodeId, { startElection, nodeDefaults = {} }) {
  const node = state.nodes[nodeId]
  if (!node) return state

  if (node.failed) {
    let nextState = {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, failed: false, state: BASE_STATES.NORMAL, leaderId: state.leaderId, ...nodeDefaults }
          : n
      ),
      step: state.step + 1,
    }
    nextState = logEvent(nextState, `Nó ${nodeId} recupera e inicia eleição`)
    return startElection(nextState, nodeId)
  }

  const wasLeader = node.state === BASE_STATES.LEADER
  let nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, failed: true, state: BASE_STATES.FAILED, leaderId: null, ...nodeDefaults }
        : n
    ),
    leaderId: wasLeader ? null : state.leaderId,
    step: state.step + 1,
  }
  nextState = logEvent(nextState, wasLeader ? `Nó ${nodeId} (líder) falha` : `Nó ${nodeId} falha`)
  return nextState
}

// Presets que fazem exatamente a mesma coisa nos dois algoritmos. Os demais
// (partition/tie-break no Bully, mid-failure/two-nodes no anel, e as duas
// versoes de "maior ID") descrevem cenarios proprios e ficam em cada motor.
export function presetStartElection({ createInitialState, startElection }, nodeCount = 5) {
  return startElection(createInitialState(nodeCount), 0)
}

export function presetFailLeader({ createInitialState, runUntilStable, toggleNodeFailure }, nodeCount = 5) {
  let state = createInitialState(nodeCount)
  state = runUntilStable(state)
  if (state.leaderId !== null) {
    state = toggleNodeFailure(state, state.leaderId)
  }
  return state
}
