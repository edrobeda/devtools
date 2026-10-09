// Helpers comuns aos motores dos simuladores de commit distribuido
// (/tools/two-phase-commit-simulator e /tools/three-phase-commit-simulator).
//
// Os dois protocolos sao legitimamente distintos (o 2PC tem prepare/decision;
// o 3PC tem canCommit/preCommit/doCommit e a recuperacao por timeout), entao as
// maquinas de fase continuam em arquivos separados. O que vivia copiado nos
// dois — clonagem de estado, log, contagem de nos caidos, queda manual e cor
// da decisao — fica aqui.

export function clone(obj) {
  return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj))
}

export function pushLog(sim, message, type = 'info') {
  sim.log.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    step: sim.phase,
    message,
    type,
    timestamp: Date.now(),
  })
}

export function pushMessage(sim, from, to, type) {
  sim.messages.push({ from, to, type, delivered: false })
}

export function countCrashed(sim) {
  const coord = sim.coordinator.crashed ? 1 : 0
  const parts = sim.participants.filter((p) => p.crashed).length
  sim.stats.crashed = coord + parts
}

export function clampParticipantCount(config) {
  return Math.max(2, Math.min(5, config.participantCount))
}

export function commitCoordinator(STATES, DECISIONS, config) {
  return {
    id: 'C',
    state: STATES.IDLE,
    decision: DECISIONS.PENDING,
    crashed: false,
    crashAfter: config.coordinatorCrashes || null,
  }
}

export function commitParticipant(index, config, initialState) {
  return {
    id: `P${index + 1}`,
    state: initialState,
    vote: config.votes[index] || 'yes',
    crashed: false,
  }
}

export function commitSimulation({ phase, coordinator, participants, recoveryCommit }) {
  const sim = {
    phase,
    coordinator,
    participants,
    messages: [],
    log: [],
    stats: { started: 0, committed: 0, aborted: 0, crashed: 0 },
    finished: false,
  }
  if (recoveryCommit !== undefined) sim.recoveryCommit = recoveryCommit
  return sim
}

export function crashNode(sim, nodeId, STATES) {
  const next = clone(sim)
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

export function decisionColor(decision, DECISIONS) {
  return decision === DECISIONS.COMMIT ? '#52c41a' : decision === DECISIONS.ABORT ? '#ff4d4f' : '#8c8c8c'
}
