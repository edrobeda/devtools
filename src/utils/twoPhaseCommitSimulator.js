// Simulador de Two-Phase Commit (2PC) — 100% client-side.
// Ilustra o protocolo classico de commit atomico em sistemas distribuidos
// com um coordenador e N participantes.

export const STATES = {
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  PREPARED: 'PREPARED',
  COMMITTING: 'COMMITTING',
  COMMITTED: 'COMMITTED',
  ABORTING: 'ABORTING',
  ABORTED: 'ABORTED',
  CRASHED: 'CRASHED',
}

export const PHASES = {
  IDLE: 'IDLE',
  PREPARE_SENT: 'PREPARE_SENT',
  VOTES_RECEIVED: 'VOTES_RECEIVED',
  DECISION_MADE: 'DECISION_MADE',
  DECISION_DELIVERED: 'DECISION_DELIVERED',
  DONE: 'DONE',
}

export const DECISIONS = {
  COMMIT: 'COMMIT',
  ABORT: 'ABORT',
  PENDING: 'PENDING',
}

export const PRESETS = {
  pt: [
    {
      key: 'commit-happy',
      label: 'Caminho feliz (commit)',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashPrepare: [false, false, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'one-abort',
      label: 'Um participante aborta',
      participants: 3,
      votes: ['yes', 'no', 'yes'],
      crashPrepare: [false, false, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'crash-before-decision',
      label: 'Coordenador cai antes da decisao',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashPrepare: [false, false, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: 'before-decision',
    },
    {
      key: 'participant-unavailable',
      label: 'Participante nao responde no prepare',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashPrepare: [false, true, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: null,
    },
  ],
  en: [
    {
      key: 'commit-happy',
      label: 'Happy path (commit)',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashPrepare: [false, false, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'one-abort',
      label: 'One participant aborts',
      participants: 3,
      votes: ['yes', 'no', 'yes'],
      crashPrepare: [false, false, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'crash-before-decision',
      label: 'Coordinator crashes before decision',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashPrepare: [false, false, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: 'before-decision',
    },
    {
      key: 'participant-unavailable',
      label: 'Participant does not answer prepare',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashPrepare: [false, true, false],
      crashDecision: [false, false, false],
      coordinatorCrashes: null,
    },
  ],
}

export function defaultConfig() {
  return {
    participantCount: 3,
    votes: ['yes', 'yes', 'yes'],
    crashPrepare: [false, false, false],
    crashDecision: [false, false, false],
    coordinatorCrashes: null,
  }
}

function makeParticipant(index, config) {
  return {
    id: `P${index + 1}`,
    state: STATES.IDLE,
    vote: config.votes[index] || 'yes',
    crashed: false,
    acked: false,
    crashPrepare: !!config.crashPrepare[index],
    crashDecision: !!config.crashDecision[index],
  }
}

export function createSimulation(config = defaultConfig()) {
  const count = Math.max(2, Math.min(5, config.participantCount))
  return {
    phase: PHASES.IDLE,
    coordinator: {
      id: 'C',
      state: STATES.IDLE,
      decision: DECISIONS.PENDING,
      crashed: false,
      crashAfter: config.coordinatorCrashes || null,
    },
    participants: Array.from({ length: count }, (_, i) => makeParticipant(i, config)),
    messages: [],
    log: [],
    stats: { started: 0, committed: 0, aborted: 0, crashed: 0 },
    finished: false,
  }
}

function pushLog(sim, message, type = 'info') {
  sim.log.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    step: sim.phase,
    message,
    type,
    timestamp: Date.now(),
  })
}

function pushMessage(sim, from, to, type) {
  sim.messages.push({ from, to, type, delivered: false })
}

function countCrashed(sim) {
  const coord = sim.coordinator.crashed ? 1 : 0
  const parts = sim.participants.filter((p) => p.crashed).length
  sim.stats.crashed = coord + parts
}

export function startTransaction(sim) {
  if (sim.phase !== PHASES.IDLE || sim.finished) return sim
  const next = structuredClone ? structuredClone(sim) : JSON.parse(JSON.stringify(sim))
  next.phase = PHASES.PREPARE_SENT
  next.coordinator.state = STATES.PREPARING
  next.stats.started += 1
  next.participants.forEach((p) => {
    p.state = STATES.PREPARING
    pushMessage(next, 'C', p.id, 'PREPARE')
  })
  pushLog(next, 'Coordinator enviou PREPARE para todos os participantes.', 'info')
  countCrashed(next)
  return next
}

export function collectVotes(sim) {
  if (sim.phase !== PHASES.PREPARE_SENT) return sim
  const next = structuredClone ? structuredClone(sim) : JSON.parse(JSON.stringify(sim))

  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashPrepare) {
      p.crashed = true
      pushLog(next, `${p.id} caiu ao receber PREPARE e nao responde.`, 'error')
      pushMessage(next, p.id, 'C', 'TIMEOUT')
      return
    }
    p.state = STATES.PREPARED
    p.vote = p.vote || 'yes'
    pushMessage(next, p.id, 'C', p.vote === 'yes' ? 'YES' : 'NO')
    pushLog(next, `${p.id} votou ${p.vote.toUpperCase()}.`, p.vote === 'yes' ? 'success' : 'warning')
  })

  next.phase = PHASES.VOTES_RECEIVED
  pushLog(next, 'Coordenador recebeu todos os votos disponiveis.', 'info')
  countCrashed(next)
  return next
}

export function makeDecision(sim) {
  if (sim.phase !== PHASES.VOTES_RECEIVED) return sim
  const next = structuredClone ? structuredClone(sim) : JSON.parse(JSON.stringify(sim))

  if (next.coordinator.crashAfter === 'before-decision') {
    next.coordinator.crashed = true
    next.coordinator.state = STATES.CRASHED
    pushLog(next, 'Coordenador caiu ANTES de tomar a decisao. A transacao fica bloqueada ate a recuperacao.', 'error')
    next.phase = PHASES.DECISION_MADE
    countCrashed(next)
    return next
  }

  const allYes = next.participants.every((p) => p.vote === 'yes' && !p.crashPrepare)
  const anyNo = next.participants.some((p) => p.vote === 'no')

  if (allYes && !anyNo) {
    next.coordinator.decision = DECISIONS.COMMIT
    next.coordinator.state = STATES.COMMITTING
    pushLog(next, 'Todos votaram YES. Coordenador decidiu COMMIT.', 'success')
  } else {
    next.coordinator.decision = DECISIONS.ABORT
    next.coordinator.state = STATES.ABORTING
    const reason = anyNo ? 'algum participante votou NO' : 'um participante nao respondeu'
    pushLog(next, `${reason}. Coordenador decidiu ABORT.`, 'warning')
  }

  if (next.coordinator.crashAfter === 'after-decision') {
    next.coordinator.crashed = true
    next.coordinator.state = STATES.CRASHED
    pushLog(next, 'Coordenador caiu DEPOIS de decidir, mas antes de enviar a todos.', 'error')
  }

  next.phase = PHASES.DECISION_MADE
  countCrashed(next)
  return next
}

export function deliverDecision(sim) {
  if (sim.phase !== PHASES.DECISION_MADE || sim.finished) return sim
  const next = structuredClone ? structuredClone(sim) : JSON.parse(JSON.stringify(sim))

  if (next.coordinator.crashed) {
    pushLog(next, 'Coordenador esta indisponivel. Nenhuma decisao pode ser enviada.', 'error')
    return next
  }

  const decision = next.coordinator.decision
  next.participants.forEach((p) => {
    if (p.crashed) return
    if (decision === DECISIONS.COMMIT) {
      p.state = STATES.COMMITTING
    } else {
      p.state = STATES.ABORTING
    }
    pushMessage(next, 'C', p.id, decision)
  })

  pushLog(next, `Coordenador enviou ${decision} para os participantes.`, decision === DECISIONS.COMMIT ? 'success' : 'warning')
  next.phase = PHASES.DECISION_DELIVERED
  return next
}

export function collectAcks(sim) {
  if (sim.phase !== PHASES.DECISION_DELIVERED) return sim
  const next = structuredClone ? structuredClone(sim) : JSON.parse(JSON.stringify(sim))

  const decision = next.coordinator.decision
  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashDecision) {
      p.crashed = true
      pushLog(next, `${p.id} caiu ao receber ${decision} e nao responde.`, 'error')
      pushMessage(next, p.id, 'C', 'TIMEOUT')
      return
    }
    if (decision === DECISIONS.COMMIT) {
      p.state = STATES.COMMITTED
    } else {
      p.state = STATES.ABORTED
    }
    p.acked = true
    pushMessage(next, p.id, 'C', 'ACK')
  })

  next.coordinator.state = decision === DECISIONS.COMMIT ? STATES.COMMITTED : STATES.ABORTED
  next.phase = PHASES.DONE
  next.finished = true

  if (decision === DECISIONS.COMMIT) {
    next.stats.committed += 1
    pushLog(next, 'Transacao COMMITADA por todos os participantes.', 'success')
  } else {
    next.stats.aborted += 1
    pushLog(next, 'Transacao ABORTADA.', 'warning')
  }

  countCrashed(next)
  return next
}

export function step(sim) {
  switch (sim.phase) {
    case PHASES.IDLE:
      return startTransaction(sim)
    case PHASES.PREPARE_SENT:
      return collectVotes(sim)
    case PHASES.VOTES_RECEIVED:
      return makeDecision(sim)
    case PHASES.DECISION_MADE:
      return deliverDecision(sim)
    case PHASES.DECISION_DELIVERED:
      return collectAcks(sim)
    default:
      return sim
  }
}

export function resetSimulation(config) {
  return createSimulation(config)
}

export function crashNode(sim, nodeId) {
  const next = structuredClone ? structuredClone(sim) : JSON.parse(JSON.stringify(sim))
  if (nodeId === 'C') {
    next.coordinator.crashed = true
    next.coordinator.state = STATES.CRASHED
  } else {
    const p = next.participants.find((x) => x.id === nodeId)
    if (p) {
      p.crashed = true
      p.state = STATES.CRASHED
    }
  }
  pushLog(next, `${nodeId} caiu manualmente.`, 'error')
  countCrashed(next)
  return next
}

export function recoverNode(sim, nodeId) {
  const next = structuredClone ? structuredClone(sim) : JSON.parse(JSON.stringify(sim))
  if (nodeId === 'C') {
    next.coordinator.crashed = false
    next.coordinator.state = next.coordinator.decision === DECISIONS.PENDING ? STATES.PREPARING : (next.coordinator.decision === DECISIONS.COMMIT ? STATES.COMMITTING : STATES.ABORTING)
    pushLog(next, 'Coordenador recuperado. Se ja tiver decidido, reenvia a decisao.', 'info')
  } else {
    const p = next.participants.find((x) => x.id === nodeId)
    if (p) {
      p.crashed = false
      p.state = STATES.IDLE
      p.acked = false
      pushLog(next, `${nodeId} recuperado. No 2PC real o participante consulta o coordenador ou outros nos para saber o resultado.`, 'info')
    }
  }
  countCrashed(next)
  return next
}

export function stateColor(state) {
  switch (state) {
    case STATES.IDLE:
      return '#8c8c8c'
    case STATES.PREPARING:
      return '#1890ff'
    case STATES.PREPARED:
      return '#722ed1'
    case STATES.COMMITTING:
      return '#13c2c2'
    case STATES.COMMITTED:
      return '#52c41a'
    case STATES.ABORTING:
      return '#fa8c16'
    case STATES.ABORTED:
      return '#ff4d4f'
    case STATES.CRASHED:
      return '#595959'
    default:
      return '#8c8c8c'
  }
}

export function decisionColor(decision) {
  return decision === DECISIONS.COMMIT ? '#52c41a' : decision === DECISIONS.ABORT ? '#ff4d4f' : '#8c8c8c'
}

export function sourceCode() {
  return `// Motor do simulador de Two-Phase Commit (2PC)

export const STATES = {
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  PREPARED: 'PREPARED',
  COMMITTING: 'COMMITTING',
  COMMITTED: 'COMMITTED',
  ABORTING: 'ABORTING',
  ABORTED: 'ABORTED',
  CRASHED: 'CRASHED',
}

export const PHASES = {
  IDLE: 'IDLE',
  PREPARE_SENT: 'PREPARE_SENT',
  VOTES_RECEIVED: 'VOTES_RECEIVED',
  DECISION_MADE: 'DECISION_MADE',
  DECISION_DELIVERED: 'DECISION_DELIVERED',
  DONE: 'DONE',
}

export const DECISIONS = { COMMIT: 'COMMIT', ABORT: 'ABORT', PENDING: 'PENDING' }

function makeParticipant(index, config) {
  return {
    id: \`P\${index + 1}\`,
    state: STATES.IDLE,
    vote: config.votes[index] || 'yes',
    crashed: false,
    acked: false,
    crashPrepare: !!config.crashPrepare[index],
    crashDecision: !!config.crashDecision[index],
  }
}

export function createSimulation(config) {
  return {
    phase: PHASES.IDLE,
    coordinator: { id: 'C', state: STATES.IDLE, decision: DECISIONS.PENDING, crashed: false, crashAfter: config.coordinatorCrashes },
    participants: Array.from({ length: config.participantCount }, (_, i) => makeParticipant(i, config)),
    messages: [],
    log: [],
    stats: { started: 0, committed: 0, aborted: 0, crashed: 0 },
    finished: false,
  }
}

export function startTransaction(sim) {
  const next = structuredClone(sim)
  next.phase = PHASES.PREPARE_SENT
  next.coordinator.state = STATES.PREPARING
  next.stats.started += 1
  next.participants.forEach((p) => { p.state = STATES.PREPARING })
  return next
}

export function collectVotes(sim) {
  const next = structuredClone(sim)
  next.participants.forEach((p) => {
    if (p.crashPrepare) { p.crashed = true; return }
    p.state = STATES.PREPARED
  })
  next.phase = PHASES.VOTES_RECEIVED
  return next
}

export function makeDecision(sim) {
  const next = structuredClone(sim)
  const allYes = next.participants.every((p) => p.vote === 'yes' && !p.crashPrepare)
  const anyNo = next.participants.some((p) => p.vote === 'no')
  if (allYes && !anyNo) {
    next.coordinator.decision = DECISIONS.COMMIT
    next.coordinator.state = STATES.COMMITTING
  } else {
    next.coordinator.decision = DECISIONS.ABORT
    next.coordinator.state = STATES.ABORTING
  }
  next.phase = PHASES.DECISION_MADE
  return next
}

export function deliverDecision(sim) {
  const next = structuredClone(sim)
  const decision = next.coordinator.decision
  next.participants.forEach((p) => { if (!p.crashed) p.state = decision === DECISIONS.COMMIT ? STATES.COMMITTING : STATES.ABORTING })
  next.phase = PHASES.DECISION_DELIVERED
  return next
}

export function collectAcks(sim) {
  const next = structuredClone(sim)
  const decision = next.coordinator.decision
  next.participants.forEach((p) => {
    if (p.crashed) return
    p.state = decision === DECISIONS.COMMIT ? STATES.COMMITTED : STATES.ABORTED
    p.acked = true
  })
  next.coordinator.state = decision === DECISIONS.COMMIT ? STATES.COMMITTED : STATES.ABORTED
  next.phase = PHASES.DONE
  next.finished = true
  next.stats[decision === DECISIONS.COMMIT ? 'committed' : 'aborted'] += 1
  return next
}

export function step(sim) {
  switch (sim.phase) {
    case PHASES.IDLE: return startTransaction(sim)
    case PHASES.PREPARE_SENT: return collectVotes(sim)
    case PHASES.VOTES_RECEIVED: return makeDecision(sim)
    case PHASES.DECISION_MADE: return deliverDecision(sim)
    case PHASES.DECISION_DELIVERED: return collectAcks(sim)
    default: return sim
  }
}

// Regras classicas:
// - Fase 1 (prepare): o coordenador envia PREPARE; cada participante vota YES/NO.
// - Fase 2 (decision): se TODOS votarem YES, o coordenador envia COMMIT;
//   caso contrario envia ABORT. Os participantes aplicam e respondem ACK.
// - Falhas: se o coordenador cai antes de decidir, os participantes podem ficar
//   bloqueados ate a recuperacao; depois da decisao, o coordenador reenvia o
//   veredicto para quem ainda nao respondeu.
`
}
