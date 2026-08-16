// Simulador de Paxos (single decree) — 100% client-side.
// Ilustra o protocolo classico de consenso distribuido com 1 proposer,
// N acceptors e 1 learner. O valor so e escolhido quando uma maioria de
// acceptors o aceita com o mesmo numero de proposta.

export const PROPOSER_STATES = {
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  ACCEPTING: 'ACCEPTING',
  CHOSEN: 'CHOSEN',
  REJECTED: 'REJECTED',
}

export const ACCEPTOR_STATES = {
  IDLE: 'IDLE',
  PROMISED: 'PROMISED',
  ACCEPTED: 'ACCEPTED',
  CRASHED: 'CRASHED',
}

export const LEARNER_STATES = {
  UNKNOWN: 'UNKNOWN',
  LEARNED: 'LEARNED',
}

export const PHASES = {
  IDLE: 'IDLE',
  PREPARE_SENT: 'PREPARE_SENT',
  PROMISES_RECEIVED: 'PROMISES_RECEIVED',
  ACCEPT_SENT: 'ACCEPT_SENT',
  ACCEPTS_RECEIVED: 'ACCEPTS_RECEIVED',
  DONE: 'DONE',
}

function clone(sim) {
  if (typeof structuredClone === 'function') {
    return structuredClone(sim)
  }
  return JSON.parse(JSON.stringify(sim))
}

function pushLog(sim, message, type = 'info') {
  sim.log.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phase: sim.phase,
    message,
    type,
    timestamp: Date.now(),
  })
}

function pushMessage(sim, from, to, type, payload = {}) {
  sim.messages.push({ from, to, type, payload, delivered: false })
}

function makeAcceptor(index, config) {
  const preloaded = config.preloadedAcceptors?.[index] || {}
  return {
    id: `A${index + 1}`,
    state: preloaded.state || ACCEPTOR_STATES.IDLE,
    maxPromiseN: preloaded.maxPromiseN ?? -1,
    acceptedN: preloaded.acceptedN ?? null,
    acceptedV: preloaded.acceptedV ?? null,
    crashed: !!config.crashed?.[index],
    rejectPrepare: !!config.rejectPrepare?.[index],
    rejectAccept: !!config.rejectAccept?.[index],
  }
}

export function defaultConfig() {
  return {
    acceptorCount: 5,
    proposalNumber: 1,
    proposalValue: 'X',
    rejectPrepare: [false, false, false, false, false],
    rejectAccept: [false, false, false, false, false],
    crashed: [false, false, false, false, false],
    preloadedAcceptors: [],
  }
}

export function createSimulation(config = defaultConfig()) {
  const count = Math.max(3, Math.min(7, config.acceptorCount || 5))
  const safeConfig = { ...defaultConfig(), ...config, acceptorCount: count }
  return {
    phase: PHASES.IDLE,
    proposer: {
      id: 'P',
      state: PROPOSER_STATES.IDLE,
      proposalN: safeConfig.proposalNumber,
      value: safeConfig.proposalValue,
      promisedCount: 0,
      acceptedCount: 0,
      chosenValue: null,
    },
    acceptors: Array.from({ length: count }, (_, i) => makeAcceptor(i, safeConfig)),
    learner: {
      id: 'L',
      state: LEARNER_STATES.UNKNOWN,
      value: null,
      proposalN: null,
      crashed: false,
    },
    messages: [],
    log: [],
    stats: {
      promises: 0,
      rejects: 0,
      accepts: 0,
      learned: 0,
      crashed: 0,
    },
    finished: false,
  }
}

export function resetSimulation(config) {
  return createSimulation(config)
}

export function crashNode(sim, nodeId) {
  const next = clone(sim)
  if (nodeId === 'P') {
    next.proposer.state = PROPOSER_STATES.REJECTED
    pushLog(next, 'Proposer caiu. A rodada atual nao pode continuar.', 'error')
  } else if (nodeId === 'L') {
    next.learner.crashed = true
    next.learner.state = LEARNER_STATES.UNKNOWN
    pushLog(next, 'Learner caiu. Ninguem mais observa o resultado.', 'error')
  } else {
    const a = next.acceptors.find((x) => x.id === nodeId)
    if (a) {
      a.crashed = true
      a.state = ACCEPTOR_STATES.CRASHED
      pushLog(next, `${nodeId} caiu e para de responder.`, 'error')
    }
  }
  countCrashed(next)
  return next
}

export function recoverNode(sim, nodeId) {
  const next = clone(sim)
  if (nodeId === 'P') {
    next.proposer.state = PROPOSER_STATES.IDLE
    pushLog(next, 'Proposer recuperado.', 'info')
  } else if (nodeId === 'L') {
    next.learner.crashed = false
    next.learner.state = next.learner.value ? LEARNER_STATES.LEARNED : LEARNER_STATES.UNKNOWN
    pushLog(next, 'Learner recuperado.', 'info')
    checkLearner(next)
  } else {
    const a = next.acceptors.find((x) => x.id === nodeId)
    if (a) {
      a.crashed = false
      a.state = a.acceptedN != null ? ACCEPTOR_STATES.ACCEPTED : a.maxPromiseN >= 0 ? ACCEPTOR_STATES.PROMISED : ACCEPTOR_STATES.IDLE
      pushLog(next, `${nodeId} recuperado. No Paxos real ele consultaria seu estado persistido.`, 'info')
    }
  }
  countCrashed(next)
  return next
}

function countCrashed(sim) {
  sim.stats.crashed =
    sim.acceptors.filter((a) => a.crashed).length +
    (sim.proposer.state === PROPOSER_STATES.REJECTED ? 1 : 0) +
    (sim.learner.crashed ? 1 : 0)
}

function majority(n) {
  return Math.floor(n / 2) + 1
}

function sendPrepareMessages(sim) {
  const next = clone(sim)
  next.phase = PHASES.PREPARE_SENT
  next.proposer.state = PROPOSER_STATES.PREPARING
  next.acceptors.forEach((a) => {
    if (a.crashed) return
    pushMessage(next, 'P', a.id, 'PREPARE', { n: next.proposer.proposalN })
  })
  pushLog(next, `Proposer enviou PREPARE(n=${next.proposer.proposalN}) para os acceptors.`, 'info')
  countCrashed(next)
  return next
}

function receivePromises(sim) {
  const next = clone(sim)
  next.phase = PHASES.PROMISES_RECEIVED

  let promises = 0
  let highestAcceptedN = -1
  let valueToUse = next.proposer.value
  let rejected = 0

  next.acceptors.forEach((a) => {
    if (a.crashed) return

    if (a.rejectPrepare) {
      pushMessage(next, a.id, 'P', 'REJECT_PREPARE', { n: next.proposer.proposalN })
      pushLog(next, `${a.id} rejeitou PREPARE(n=${next.proposer.proposalN}) — ja prometeu a uma proposta maior.`, 'warning')
      rejected += 1
      return
    }

    if (next.proposer.proposalN < a.maxPromiseN) {
      pushMessage(next, a.id, 'P', 'REJECT_PREPARE', { n: next.proposer.proposalN })
      pushLog(next, `${a.id} rejeitou PREPARE(n=${next.proposer.proposalN}) — prometeu n=${a.maxPromiseN}.`, 'warning')
      rejected += 1
      return
    }

    a.maxPromiseN = next.proposer.proposalN
    a.state = ACCEPTOR_STATES.PROMISED
    promises += 1

    pushMessage(next, a.id, 'P', 'PROMISE', {
      n: next.proposer.proposalN,
      acceptedN: a.acceptedN,
      acceptedV: a.acceptedV,
    })

    if (a.acceptedN != null && a.acceptedN > highestAcceptedN) {
      highestAcceptedN = a.acceptedN
      valueToUse = a.acceptedV
    }

    pushLog(next, `${a.id} prometeu n=${next.proposer.proposalN}${a.acceptedN != null ? ` e revelou valor anterior n=${a.acceptedN}` : ''}.`, 'success')
  })

  next.proposer.promisedCount = promises
  next.stats.promises = promises
  next.stats.rejects += rejected

  const needed = majority(next.acceptors.length)
  if (promises >= needed) {
    next.proposer.value = valueToUse
    next.proposer.state = PROPOSER_STATES.ACCEPTING
    pushLog(next, `Maioria de promises (${promises}/${needed}). Proposer segue com valor "${valueToUse}".`, 'success')
  } else {
    next.proposer.state = PROPOSER_STATES.REJECTED
    next.finished = true
    pushLog(next, `Promises insuficientes (${promises}/${needed}). Proposer desiste desta rodada.`, 'error')
  }

  countCrashed(next)
  return next
}

function sendAcceptMessages(sim) {
  const next = clone(sim)
  if (next.proposer.state === PROPOSER_STATES.REJECTED) {
    next.phase = PHASES.DONE
    next.finished = true
    return next
  }

  next.phase = PHASES.ACCEPT_SENT
  next.acceptors.forEach((a) => {
    if (a.crashed) return
    pushMessage(next, 'P', a.id, 'ACCEPT', { n: next.proposer.proposalN, v: next.proposer.value })
  })
  pushLog(next, `Proposer enviou ACCEPT(n=${next.proposer.proposalN}, v="${next.proposer.value}") para os acceptors.`, 'info')
  return next
}

function receiveAccepts(sim) {
  const next = clone(sim)
  next.phase = PHASES.ACCEPTS_RECEIVED

  let accepts = 0
  let rejected = 0

  next.acceptors.forEach((a) => {
    if (a.crashed) return

    if (a.rejectAccept) {
      pushMessage(next, a.id, 'P', 'REJECT_ACCEPT', { n: next.proposer.proposalN })
      pushLog(next, `${a.id} rejeitou ACCEPT(n=${next.proposer.proposalN}) — proposta desatualizada.`, 'warning')
      rejected += 1
      return
    }

    if (next.proposer.proposalN < a.maxPromiseN) {
      pushMessage(next, a.id, 'P', 'REJECT_ACCEPT', { n: next.proposer.proposalN })
      pushLog(next, `${a.id} rejeitou ACCEPT(n=${next.proposer.proposalN}) — prometeu n=${a.maxPromiseN}.`, 'warning')
      rejected += 1
      return
    }

    a.acceptedN = next.proposer.proposalN
    a.acceptedV = next.proposer.value
    a.state = ACCEPTOR_STATES.ACCEPTED
    accepts += 1

    pushMessage(next, a.id, 'L', 'ACCEPTED', { n: next.proposer.proposalN, v: next.proposer.value })
    pushLog(next, `${a.id} aceitou (n=${next.proposer.proposalN}, v="${next.proposer.value}").`, 'success')
  })

  next.proposer.acceptedCount = accepts
  next.stats.accepts = accepts
  next.stats.rejects += rejected

  const needed = majority(next.acceptors.length)
  if (accepts >= needed) {
    next.proposer.state = PROPOSER_STATES.CHOSEN
    next.proposer.chosenValue = next.proposer.value
    pushLog(next, `Maioria de accepts (${accepts}/${needed}). Valor "${next.proposer.value}" escolhido.`, 'success')
  } else {
    next.proposer.state = PROPOSER_STATES.REJECTED
    next.finished = true
    pushLog(next, `Accepts insuficientes (${accepts}/${needed}). Valor nao foi escolhido.`, 'error')
  }

  checkLearner(next)
  countCrashed(next)
  return next
}

function checkLearner(sim) {
  const groups = {}
  sim.acceptors.forEach((a) => {
    if (a.state === ACCEPTOR_STATES.ACCEPTED && a.acceptedN != null) {
      const key = `${a.acceptedN}::${a.acceptedV}`
      groups[key] = (groups[key] || 0) + 1
    }
  })

  const needed = majority(sim.acceptors.length)
  for (const [key, count] of Object.entries(groups)) {
    if (count >= needed) {
      const [, v] = key.split('::')
      sim.learner.state = LEARNER_STATES.LEARNED
      sim.learner.value = v
      sim.learner.proposalN = Number(key.split('::')[0])
      sim.stats.learned = count
      return
    }
  }
}

function finishRound(sim) {
  const next = clone(sim)
  next.phase = PHASES.DONE
  next.finished = true
  if (next.proposer.state === PROPOSER_STATES.CHOSEN) {
    pushLog(next, `Learner confirmou o valor escolhido: "${next.learner.value}".`, 'success')
  } else if (next.proposer.state === PROPOSER_STATES.REJECTED) {
    pushLog(next, 'Nenhum valor foi escolhido nesta rodada.', 'warning')
  }
  return next
}

export function step(sim) {
  switch (sim.phase) {
    case PHASES.IDLE:
      return sendPrepareMessages(sim)
    case PHASES.PREPARE_SENT:
      return receivePromises(sim)
    case PHASES.PROMISES_RECEIVED:
      return sendAcceptMessages(sim)
    case PHASES.ACCEPT_SENT:
      return receiveAccepts(sim)
    case PHASES.ACCEPTS_RECEIVED:
      return finishRound(sim)
    default:
      return sim
  }
}

export function stateColor(state) {
  switch (state) {
    case PROPOSER_STATES.IDLE:
    case ACCEPTOR_STATES.IDLE:
    case LEARNER_STATES.UNKNOWN:
      return '#8c8c8c'
    case PROPOSER_STATES.PREPARING:
      return '#1890ff'
    case PROPOSER_STATES.ACCEPTING:
      return '#722ed1'
    case PROPOSER_STATES.CHOSEN:
    case LEARNER_STATES.LEARNED:
      return '#52c41a'
    case PROPOSER_STATES.REJECTED:
      return '#ff4d4f'
    case ACCEPTOR_STATES.PROMISED:
      return '#faad14'
    case ACCEPTOR_STATES.ACCEPTED:
      return '#52c41a'
    case ACCEPTOR_STATES.CRASHED:
      return '#595959'
    default:
      return '#8c8c8c'
  }
}

export const PRESETS = {
  pt: [
    {
      key: 'happy-path',
      label: 'Caminho feliz',
      acceptorCount: 5,
      proposalNumber: 1,
      proposalValue: 'X',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [],
    },
    {
      key: 'proposal-too-low',
      label: 'Numero de proposta baixo',
      acceptorCount: 5,
      proposalNumber: 1,
      proposalValue: 'X',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
      ],
    },
    {
      key: 'conflict-prior-value',
      label: 'Conflito: valor anterior',
      acceptorCount: 5,
      proposalNumber: 5,
      proposalValue: 'Y',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [
        { state: 'ACCEPTED', maxPromiseN: 3, acceptedN: 3, acceptedV: 'X' },
        { state: 'ACCEPTED', maxPromiseN: 3, acceptedN: 3, acceptedV: 'X' },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'IDLE', maxPromiseN: -1, acceptedN: null, acceptedV: null },
        { state: 'IDLE', maxPromiseN: -1, acceptedN: null, acceptedV: null },
      ],
    },
    {
      key: 'minority-crash',
      label: 'Accep. falha, maioria sobrevive',
      acceptorCount: 5,
      proposalNumber: 2,
      proposalValue: 'Z',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [true, true, false, false, false],
      preloadedAcceptors: [],
    },
    {
      key: 'accept-rejected',
      label: 'Accept rejeitado pela maioria',
      acceptorCount: 5,
      proposalNumber: 2,
      proposalValue: 'W',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [true, true, true, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [],
    },
  ],
  en: [
    {
      key: 'happy-path',
      label: 'Happy path',
      acceptorCount: 5,
      proposalNumber: 1,
      proposalValue: 'X',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [],
    },
    {
      key: 'proposal-too-low',
      label: 'Proposal number too low',
      acceptorCount: 5,
      proposalNumber: 1,
      proposalValue: 'X',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
      ],
    },
    {
      key: 'conflict-prior-value',
      label: 'Conflict: prior value',
      acceptorCount: 5,
      proposalNumber: 5,
      proposalValue: 'Y',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [
        { state: 'ACCEPTED', maxPromiseN: 3, acceptedN: 3, acceptedV: 'X' },
        { state: 'ACCEPTED', maxPromiseN: 3, acceptedN: 3, acceptedV: 'X' },
        { state: 'PROMISED', maxPromiseN: 3, acceptedN: null, acceptedV: null },
        { state: 'IDLE', maxPromiseN: -1, acceptedN: null, acceptedV: null },
        { state: 'IDLE', maxPromiseN: -1, acceptedN: null, acceptedV: null },
      ],
    },
    {
      key: 'minority-crash',
      label: 'Minority crash, majority survives',
      acceptorCount: 5,
      proposalNumber: 2,
      proposalValue: 'Z',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [false, false, false, false, false],
      crashed: [true, true, false, false, false],
      preloadedAcceptors: [],
    },
    {
      key: 'accept-rejected',
      label: 'Accept rejected by majority',
      acceptorCount: 5,
      proposalNumber: 2,
      proposalValue: 'W',
      rejectPrepare: [false, false, false, false, false],
      rejectAccept: [true, true, true, false, false],
      crashed: [false, false, false, false, false],
      preloadedAcceptors: [],
    },
  ],
}

export function sourceCode() {
  return `// Motor do simulador de Paxos (single decree)

export const PROPOSER_STATES = {
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  ACCEPTING: 'ACCEPTING',
  CHOSEN: 'CHOSEN',
  REJECTED: 'REJECTED',
}

export const ACCEPTOR_STATES = {
  IDLE: 'IDLE',
  PROMISED: 'PROMISED',
  ACCEPTED: 'ACCEPTED',
}

export const PHASES = {
  IDLE: 'IDLE',
  PREPARE_SENT: 'PREPARE_SENT',
  PROMISES_RECEIVED: 'PROMISES_RECEIVED',
  ACCEPT_SENT: 'ACCEPT_SENT',
  ACCEPTS_RECEIVED: 'ACCEPTS_RECEIVED',
  DONE: 'DONE',
}

function clone(sim) {
  return structuredClone(sim)
}

function majority(n) {
  return Math.floor(n / 2) + 1
}

export function createSimulation(config) {
  return {
    phase: PHASES.IDLE,
    proposer: { id: 'P', state: PROPOSER_STATES.IDLE, proposalN: config.proposalNumber, value: config.proposalValue },
    acceptors: Array.from({ length: config.acceptorCount }, (_, i) => ({
      id: \`A\${i + 1}\`,
      state: config.preloadedAcceptors?.[i]?.state || ACCEPTOR_STATES.IDLE,
      maxPromiseN: config.preloadedAcceptors?.[i]?.maxPromiseN ?? -1,
      acceptedN: config.preloadedAcceptors?.[i]?.acceptedN ?? null,
      acceptedV: config.preloadedAcceptors?.[i]?.acceptedV ?? null,
      crashed: !!config.crashed?.[i],
      rejectPrepare: !!config.rejectPrepare?.[i],
      rejectAccept: !!config.rejectAccept?.[i],
    })),
    learner: { id: 'L', state: 'UNKNOWN', value: null },
    messages: [],
    log: [],
    finished: false,
  }
}

function sendPrepareMessages(sim) {
  const next = clone(sim)
  next.phase = PHASES.PREPARE_SENT
  next.proposer.state = PROPOSER_STATES.PREPARING
  next.acceptors.forEach((a) => {
    if (!a.crashed) pushMessage(next, 'P', a.id, 'PREPARE', { n: next.proposer.proposalN })
  })
  return next
}

function receivePromises(sim) {
  const next = clone(sim)
  next.phase = PHASES.PROMISES_RECEIVED
  let promises = 0
  let highestAcceptedN = -1
  let valueToUse = next.proposer.value

  next.acceptors.forEach((a) => {
    if (a.crashed) return
    if (a.rejectPrepare || next.proposer.proposalN < a.maxPromiseN) {
      pushMessage(next, a.id, 'P', 'REJECT_PREPARE', { n: next.proposer.proposalN })
      return
    }
    a.maxPromiseN = next.proposer.proposalN
    a.state = ACCEPTOR_STATES.PROMISED
    promises += 1
    if (a.acceptedN != null && a.acceptedN > highestAcceptedN) {
      highestAcceptedN = a.acceptedN
      valueToUse = a.acceptedV
    }
    pushMessage(next, a.id, 'P', 'PROMISE', { n: next.proposer.proposalN, acceptedN: a.acceptedN, acceptedV: a.acceptedV })
  })

  const needed = majority(next.acceptors.length)
  if (promises >= needed) {
    next.proposer.value = valueToUse
    next.proposer.state = PROPOSER_STATES.ACCEPTING
  } else {
    next.proposer.state = PROPOSER_STATES.REJECTED
    next.finished = true
  }
  return next
}

function sendAcceptMessages(sim) {
  const next = clone(sim)
  next.phase = PHASES.ACCEPT_SENT
  next.acceptors.forEach((a) => {
    if (!a.crashed) pushMessage(next, 'P', a.id, 'ACCEPT', { n: next.proposer.proposalN, v: next.proposer.value })
  })
  return next
}

function receiveAccepts(sim) {
  const next = clone(sim)
  next.phase = PHASES.ACCEPTS_RECEIVED
  let accepts = 0

  next.acceptors.forEach((a) => {
    if (a.crashed) return
    if (a.rejectAccept || next.proposer.proposalN < a.maxPromiseN) {
      pushMessage(next, a.id, 'P', 'REJECT_ACCEPT', { n: next.proposer.proposalN })
      return
    }
    a.acceptedN = next.proposer.proposalN
    a.acceptedV = next.proposer.value
    a.state = ACCEPTOR_STATES.ACCEPTED
    accepts += 1
    pushMessage(next, a.id, 'L', 'ACCEPTED', { n: next.proposer.proposalN, v: next.proposer.value })
  })

  const needed = majority(next.acceptors.length)
  if (accepts >= needed) {
    next.proposer.state = PROPOSER_STATES.CHOSEN
  } else {
    next.proposer.state = PROPOSER_STATES.REJECTED
    next.finished = true
  }
  checkLearner(next)
  return next
}

function checkLearner(sim) {
  const groups = {}
  sim.acceptors.forEach((a) => {
    if (a.state === ACCEPTOR_STATES.ACCEPTED && a.acceptedN != null) {
      const key = \`\${a.acceptedN}::\${a.acceptedV}\`
      groups[key] = (groups[key] || 0) + 1
    }
  })
  const needed = majority(sim.acceptors.length)
  for (const [key, count] of Object.entries(groups)) {
    if (count >= needed) {
      const [n, v] = key.split('::')
      sim.learner.state = 'LEARNED'
      sim.learner.value = v
      sim.learner.proposalN = Number(n)
      return
    }
  }
}

export function step(sim) {
  switch (sim.phase) {
    case PHASES.IDLE: return sendPrepareMessages(sim)
    case PHASES.PREPARE_SENT: return receivePromises(sim)
    case PHASES.PROMISES_RECEIVED: return sendAcceptMessages(sim)
    case PHASES.ACCEPT_SENT: return receiveAccepts(sim)
    case PHASES.ACCEPTS_RECEIVED:
      const next = clone(sim)
      next.phase = PHASES.DONE
      next.finished = true
      return next
    default: return sim
  }
}

// Regras classicas do Paxos:
// - Fase 1 (prepare): proposer envia PREPARE(n); acceptors prometem nao
//   aceitar propostas menores e respondem PROMISE com valor ja aceito.
// - Se proposer obtem maioria de promises, escolhe o valor do maior acceptedN
//   ou seu proprio valor se nenhum foi aceito, e envia ACCEPT(n, v).
// - Acceptors aceitam se n >= maxPromiseN e respondem ACCEPTED.
// - Learner descobre o valor quando uma maioria de acceptors reporta ACCEPTED
//   para o mesmo (n, v).
`
}
