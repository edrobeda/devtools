// Simulador de Three-Phase Commit (3PC) — 100% client-side.
// Ilustra o protocolo de commit atomico em tres fases (canCommit, preCommit,
// doCommit) usado em sistemas distribuidos. A fase extra elimina o bloqueio
// do 2PC quando o coordenador cai depois de uma decisao de commit.

export const STATES = {
  IDLE: 'IDLE',
  CAN_COMMITTING: 'CAN_COMMITTING',
  VOTED_YES: 'VOTED_YES',
  VOTED_NO: 'VOTED_NO',
  PRE_COMMITTING: 'PRE_COMMITTING',
  PRE_COMMITTED: 'PRE_COMMITTED',
  DO_COMMITTING: 'DO_COMMITTING',
  COMMITTED: 'COMMITTED',
  ABORTING: 'ABORTING',
  ABORTED: 'ABORTED',
  CRASHED: 'CRASHED',
}

export const PHASES = {
  IDLE: 'IDLE',
  CAN_COMMIT_SENT: 'CAN_COMMIT_SENT',
  VOTES_RECEIVED: 'VOTES_RECEIVED',
  PRE_COMMIT_SENT: 'PRE_COMMIT_SENT',
  PRE_COMMIT_ACKED: 'PRE_COMMIT_ACKED',
  DO_COMMIT_SENT: 'DO_COMMIT_SENT',
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
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'one-abort',
      label: 'Um participante vota NO',
      participants: 3,
      votes: ['yes', 'no', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'crash-before-precommit',
      label: 'Coordenador cai antes do preCommit',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: 'before-precommit',
    },
    {
      key: 'crash-after-precommit',
      label: 'Coordenador cai depois do preCommit',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: 'after-precommit',
    },
    {
      key: 'participant-crash-precommit',
      label: 'Participante cai no preCommit',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, true, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: null,
    },
  ],
  en: [
    {
      key: 'commit-happy',
      label: 'Happy path (commit)',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'one-abort',
      label: 'One participant votes NO',
      participants: 3,
      votes: ['yes', 'no', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: null,
    },
    {
      key: 'crash-before-precommit',
      label: 'Coordinator crashes before preCommit',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: 'before-precommit',
    },
    {
      key: 'crash-after-precommit',
      label: 'Coordinator crashes after preCommit',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, false, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: 'after-precommit',
    },
    {
      key: 'participant-crash-precommit',
      label: 'Participant crashes on preCommit',
      participants: 3,
      votes: ['yes', 'yes', 'yes'],
      crashCanCommit: [false, false, false],
      crashPreCommit: [false, true, false],
      crashDoCommit: [false, false, false],
      coordinatorCrashes: null,
    },
  ],
}

export function defaultConfig() {
  return {
    participantCount: 3,
    votes: ['yes', 'yes', 'yes'],
    crashCanCommit: [false, false, false],
    crashPreCommit: [false, false, false],
    crashDoCommit: [false, false, false],
    coordinatorCrashes: null,
  }
}

function clone(obj) {
  return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj))
}

function makeParticipant(index, config) {
  return {
    id: `P${index + 1}`,
    state: STATES.IDLE,
    vote: config.votes[index] || 'yes',
    crashed: false,
    ackedPreCommit: false,
    ackedDoCommit: false,
    crashCanCommit: !!config.crashCanCommit[index],
    crashPreCommit: !!config.crashPreCommit[index],
    crashDoCommit: !!config.crashDoCommit[index],
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
    recoveryCommit: false,
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

function isAllYes(sim) {
  return sim.participants.every((p) => p.vote === 'yes')
}

function isAnyNo(sim) {
  return sim.participants.some((p) => p.vote === 'no')
}

export function startTransaction(sim) {
  if (sim.phase !== PHASES.IDLE || sim.finished) return sim
  const next = clone(sim)
  next.phase = PHASES.CAN_COMMIT_SENT
  next.coordinator.state = STATES.CAN_COMMITTING
  next.stats.started += 1
  next.participants.forEach((p) => {
    p.state = STATES.CAN_COMMITTING
    pushMessage(next, 'C', p.id, 'CAN_COMMIT')
  })
  pushLog(next, 'Coordenador enviou CAN_COMMIT para todos os participantes.', 'info')
  countCrashed(next)
  return next
}

export function collectVotes(sim) {
  if (sim.phase !== PHASES.CAN_COMMIT_SENT) return sim
  const next = clone(sim)

  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashCanCommit) {
      p.crashed = true
      p.state = STATES.CRASHED
      pushLog(next, `${p.id} caiu ao receber CAN_COMMIT e nao responde.`, 'error')
      pushMessage(next, p.id, 'C', 'TIMEOUT')
      return
    }
    if (p.vote === 'yes') {
      p.state = STATES.VOTED_YES
      pushMessage(next, p.id, 'C', 'YES')
      pushLog(next, `${p.id} votou YES (pode commitar).`, 'success')
    } else {
      p.state = STATES.VOTED_NO
      pushMessage(next, p.id, 'C', 'NO')
      pushLog(next, `${p.id} votou NO (nao pode commitar).`, 'warning')
    }
  })

  next.phase = PHASES.VOTES_RECEIVED
  pushLog(next, 'Coordenador recebeu todos os votos disponiveis.', 'info')
  countCrashed(next)
  return next
}

export function makePreCommitDecision(sim) {
  if (sim.phase !== PHASES.VOTES_RECEIVED) return sim
  const next = clone(sim)

  if (next.coordinator.crashAfter === 'before-precommit') {
    next.coordinator.crashed = true
    next.coordinator.state = STATES.CRASHED
    pushLog(next, 'Coordenador caiu ANTES de enviar PRE_COMMIT. Participantes abortam por timeout.', 'error')
    next.participants.forEach((p) => {
      if (!p.crashed) {
        p.state = STATES.ABORTING
        pushMessage(next, 'C', p.id, 'ABORT')
      }
    })
    next.coordinator.decision = DECISIONS.ABORT
    next.phase = PHASES.PRE_COMMIT_SENT
    countCrashed(next)
    return next
  }

  if (isAnyNo(next) || !isAllYes(next)) {
    next.coordinator.decision = DECISIONS.ABORT
    next.coordinator.state = STATES.ABORTING
    pushLog(next, 'Algum participante votou NO (ou nao respondeu). Coordenador decide ABORT.', 'warning')
    next.participants.forEach((p) => {
      if (!p.crashed) {
        p.state = STATES.ABORTING
        pushMessage(next, 'C', p.id, 'ABORT')
      }
    })
  } else {
    next.coordinator.decision = DECISIONS.COMMIT
    next.coordinator.state = STATES.PRE_COMMITTING
    pushLog(next, 'Todos votaram YES. Coordenador envia PRE_COMMIT.', 'success')
    next.participants.forEach((p) => {
      if (!p.crashed) {
        p.state = STATES.PRE_COMMITTING
        pushMessage(next, 'C', p.id, 'PRE_COMMIT')
      }
    })
  }

  if (next.coordinator.crashAfter === 'after-precommit') {
    next.coordinator.crashed = true
    next.coordinator.state = STATES.CRASHED
    pushLog(next, 'Coordenador caiu DEPOIS de enviar PRE_COMMIT. Participantes podem commitar por timeout.', 'error')
    next.recoveryCommit = true
  }

  next.phase = PHASES.PRE_COMMIT_SENT
  countCrashed(next)
  return next
}

export function collectPreCommitAcks(sim) {
  if (sim.phase !== PHASES.PRE_COMMIT_SENT) return sim
  const next = clone(sim)

  if (next.coordinator.decision === DECISIONS.ABORT) {
    next.participants.forEach((p) => {
      if (p.crashed) return
      p.state = STATES.ABORTED
      p.ackedPreCommit = true
      pushMessage(next, p.id, 'C', 'ACK_ABORT')
    })
    next.coordinator.state = STATES.ABORTED
    next.phase = PHASES.DONE
    next.finished = true
    next.stats.aborted += 1
    pushLog(next, 'Transacao ABORTADA.', 'warning')
    countCrashed(next)
    return next
  }

  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashPreCommit) {
      p.crashed = true
      p.state = STATES.CRASHED
      pushLog(next, `${p.id} caiu ao receber PRE_COMMIT e nao responde.`, 'error')
      pushMessage(next, p.id, 'C', 'TIMEOUT')
      return
    }
    p.state = STATES.PRE_COMMITTED
    p.ackedPreCommit = true
    pushMessage(next, p.id, 'C', 'ACK_PRE_COMMIT')
  })

  if (next.coordinator.crashed) {
    next.phase = PHASES.PRE_COMMIT_ACKED
    pushLog(next, 'Coordenador caido; participantes em PRE_COMMITTED podem prosseguir para commit por timeout.', 'info')
    countCrashed(next)
    return next
  }

  next.phase = PHASES.PRE_COMMIT_ACKED
  pushLog(next, 'Coordenador recebeu ACKs do PRE_COMMIT.', 'info')
  countCrashed(next)
  return next
}

export function sendDoCommit(sim) {
  if (sim.phase !== PHASES.PRE_COMMIT_ACKED) return sim
  const next = clone(sim)

  if (next.coordinator.crashed) {
    next.participants.forEach((p) => {
      if (p.crashed) return
      if (p.state === STATES.PRE_COMMITTED) {
        p.state = STATES.DO_COMMITTING
        pushMessage(next, '(timeout)', p.id, 'DO_COMMIT')
      }
    })
    pushLog(next, 'Timeout atingido: participantes em PRE_COMMITTED avancam para DO_COMMIT sem coordenador.', 'success')
    next.phase = PHASES.DO_COMMIT_SENT
    countCrashed(next)
    return next
  }

  next.coordinator.state = STATES.DO_COMMITTING
  next.participants.forEach((p) => {
    if (p.crashed) return
    p.state = STATES.DO_COMMITTING
    pushMessage(next, 'C', p.id, 'DO_COMMIT')
  })
  pushLog(next, 'Coordenador enviou DO_COMMIT para todos os participantes.', 'success')

  if (next.coordinator.crashAfter === 'after-docommit') {
    next.coordinator.crashed = true
    next.coordinator.state = STATES.CRASHED
    pushLog(next, 'Coordenador caiu DEPOIS de enviar DO_COMMIT.', 'error')
  }

  next.phase = PHASES.DO_COMMIT_SENT
  countCrashed(next)
  return next
}

export function collectDoCommitAcks(sim) {
  if (sim.phase !== PHASES.DO_COMMIT_SENT) return sim
  const next = clone(sim)

  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashDoCommit) {
      p.crashed = true
      p.state = STATES.CRASHED
      pushLog(next, `${p.id} caiu ao receber DO_COMMIT e nao responde.`, 'error')
      pushMessage(next, p.id, 'C', 'TIMEOUT')
      return
    }
    p.state = STATES.COMMITTED
    p.ackedDoCommit = true
    pushMessage(next, p.id, 'C', 'ACK_DO_COMMIT')
  })

  if (!next.coordinator.crashed) {
    next.coordinator.state = STATES.COMMITTED
  }
  next.phase = PHASES.DONE
  next.finished = true
  next.stats.committed += 1
  pushLog(next, 'Transacao COMMITADA por todos os participantes disponiveis.', 'success')
  countCrashed(next)
  return next
}

export function step(sim) {
  switch (sim.phase) {
    case PHASES.IDLE:
      return startTransaction(sim)
    case PHASES.CAN_COMMIT_SENT:
      return collectVotes(sim)
    case PHASES.VOTES_RECEIVED:
      return makePreCommitDecision(sim)
    case PHASES.PRE_COMMIT_SENT:
      return collectPreCommitAcks(sim)
    case PHASES.PRE_COMMIT_ACKED:
      return sendDoCommit(sim)
    case PHASES.DO_COMMIT_SENT:
      return collectDoCommitAcks(sim)
    default:
      return sim
  }
}

export function resetSimulation(config) {
  return createSimulation(config)
}

export function crashNode(sim, nodeId) {
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

export function recoverNode(sim, nodeId) {
  const next = clone(sim)
  if (nodeId === 'C') {
    next.coordinator.crashed = false
    if (next.coordinator.decision === DECISIONS.PENDING) {
      next.coordinator.state = STATES.CAN_COMMITTING
    } else if (next.coordinator.decision === DECISIONS.COMMIT) {
      next.coordinator.state = next.phase === PHASES.DONE ? STATES.COMMITTED : STATES.DO_COMMITTING
    } else {
      next.coordinator.state = next.phase === PHASES.DONE ? STATES.ABORTED : STATES.ABORTING
    }
    pushLog(next, 'Coordenador recuperado. Reenvia a ultima decisao conhecida.', 'info')
  } else {
    const p = next.participants.find((x) => x.id === nodeId)
    if (p) {
      p.crashed = false
      if (p.state === STATES.CRASHED) {
        if (p.ackedDoCommit) {
          p.state = STATES.COMMITTED
        } else if (p.ackedPreCommit) {
          p.state = STATES.PRE_COMMITTED
        } else if (p.vote === 'no') {
          p.state = STATES.VOTED_NO
        } else if (p.vote === 'yes') {
          p.state = STATES.VOTED_YES
        } else {
          p.state = STATES.IDLE
        }
      }
      pushLog(next, `${nodeId} recuperado. No 3PC real o participante consulta outros nos para decidir entre ABORT (se nao viu PRE_COMMIT) ou COMMIT (se ja esta em PRE_COMMITTED).`, 'info')
    }
  }
  countCrashed(next)
  return next
}

export function stateColor(state) {
  switch (state) {
    case STATES.IDLE:
      return '#8c8c8c'
    case STATES.CAN_COMMITTING:
      return '#1890ff'
    case STATES.VOTED_YES:
      return '#52c41a'
    case STATES.VOTED_NO:
      return '#ff4d4f'
    case STATES.PRE_COMMITTING:
      return '#722ed1'
    case STATES.PRE_COMMITTED:
      return '#13c2c2'
    case STATES.DO_COMMITTING:
      return '#faad14'
    case STATES.COMMITTED:
      return '#237804'
    case STATES.ABORTING:
      return '#fa8c16'
    case STATES.ABORTED:
      return '#cf1322'
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
  return `// Motor do simulador de Three-Phase Commit (3PC)

export const STATES = {
  IDLE: 'IDLE',
  CAN_COMMITTING: 'CAN_COMMITTING',
  VOTED_YES: 'VOTED_YES',
  VOTED_NO: 'VOTED_NO',
  PRE_COMMITTING: 'PRE_COMMITTING',
  PRE_COMMITTED: 'PRE_COMMITTED',
  DO_COMMITTING: 'DO_COMMITTING',
  COMMITTED: 'COMMITTED',
  ABORTING: 'ABORTING',
  ABORTED: 'ABORTED',
  CRASHED: 'CRASHED',
}

export const PHASES = {
  IDLE: 'IDLE',
  CAN_COMMIT_SENT: 'CAN_COMMIT_SENT',
  VOTES_RECEIVED: 'VOTES_RECEIVED',
  PRE_COMMIT_SENT: 'PRE_COMMIT_SENT',
  PRE_COMMIT_ACKED: 'PRE_COMMIT_ACKED',
  DO_COMMIT_SENT: 'DO_COMMIT_SENT',
  DONE: 'DONE',
}

export const DECISIONS = { COMMIT: 'COMMIT', ABORT: 'ABORT', PENDING: 'PENDING' }

function makeParticipant(index, config) {
  return {
    id: \`P\${index + 1}\`,
    state: STATES.IDLE,
    vote: config.votes[index] || 'yes',
    crashed: false,
    ackedPreCommit: false,
    ackedDoCommit: false,
    crashCanCommit: !!config.crashCanCommit[index],
    crashPreCommit: !!config.crashPreCommit[index],
    crashDoCommit: !!config.crashDoCommit[index],
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
    recoveryCommit: false,
  }
}

export function startTransaction(sim) {
  const next = clone(sim)
  next.phase = PHASES.CAN_COMMIT_SENT
  next.coordinator.state = STATES.CAN_COMMITTING
  next.stats.started += 1
  next.participants.forEach((p) => { p.state = STATES.CAN_COMMITTING })
  return next
}

export function collectVotes(sim) {
  const next = clone(sim)
  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashCanCommit) { p.crashed = true; return }
    p.state = p.vote === 'yes' ? STATES.VOTED_YES : STATES.VOTED_NO
  })
  next.phase = PHASES.VOTES_RECEIVED
  return next
}

export function makePreCommitDecision(sim) {
  const next = clone(sim)
  const allYes = next.participants.every((p) => p.vote === 'yes')
  const anyNo = next.participants.some((p) => p.vote === 'no')
  if (!allYes || anyNo) {
    next.coordinator.decision = DECISIONS.ABORT
    next.coordinator.state = STATES.ABORTING
    next.participants.forEach((p) => { if (!p.crashed) p.state = STATES.ABORTING })
  } else {
    next.coordinator.decision = DECISIONS.COMMIT
    next.coordinator.state = STATES.PRE_COMMITTING
    next.participants.forEach((p) => { if (!p.crashed) p.state = STATES.PRE_COMMITTING })
  }
  next.phase = PHASES.PRE_COMMIT_SENT
  return next
}

export function collectPreCommitAcks(sim) {
  const next = clone(sim)
  if (next.coordinator.decision === DECISIONS.ABORT) {
    next.participants.forEach((p) => { if (!p.crashed) p.state = STATES.ABORTED })
    next.coordinator.state = STATES.ABORTED
    next.phase = PHASES.DONE
    next.finished = true
    next.stats.aborted += 1
    return next
  }
  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashPreCommit) { p.crashed = true; return }
    p.state = STATES.PRE_COMMITTED
    p.ackedPreCommit = true
  })
  next.phase = PHASES.PRE_COMMIT_ACKED
  return next
}

export function sendDoCommit(sim) {
  const next = clone(sim)
  if (next.coordinator.crashed) {
    next.participants.forEach((p) => {
      if (!p.crashed && p.state === STATES.PRE_COMMITTED) p.state = STATES.DO_COMMITTING
    })
  } else {
    next.coordinator.state = STATES.DO_COMMITTING
    next.participants.forEach((p) => { if (!p.crashed) p.state = STATES.DO_COMMITTING })
  }
  next.phase = PHASES.DO_COMMIT_SENT
  return next
}

export function collectDoCommitAcks(sim) {
  const next = clone(sim)
  next.participants.forEach((p) => {
    if (p.crashed) return
    if (p.crashDoCommit) { p.crashed = true; return }
    p.state = STATES.COMMITTED
    p.ackedDoCommit = true
  })
  if (!next.coordinator.crashed) next.coordinator.state = STATES.COMMITTED
  next.phase = PHASES.DONE
  next.finished = true
  next.stats.committed += 1
  return next
}

export function step(sim) {
  switch (sim.phase) {
    case PHASES.IDLE: return startTransaction(sim)
    case PHASES.CAN_COMMIT_SENT: return collectVotes(sim)
    case PHASES.VOTES_RECEIVED: return makePreCommitDecision(sim)
    case PHASES.PRE_COMMIT_SENT: return collectPreCommitAcks(sim)
    case PHASES.PRE_COMMIT_ACKED: return sendDoCommit(sim)
    case PHASES.DO_COMMIT_SENT: return collectDoCommitAcks(sim)
    default: return sim
  }
}

// Regras classicas do 3PC:
// - Fase 1 (canCommit): o coordenador pergunta se todos podem commitar;
//   cada participante responde YES ou NO.
// - Fase 2 (preCommit): se TODOS responderem YES, o coordenador envia
//   PRE_COMMIT; caso contrario envia ABORT. Participantes em PRE_COMMITTED
//   nao podem mais abortar sozinhos.
// - Fase 3 (doCommit): depois dos ACKs do PRE_COMMIT, o coordenador envia
//   DO_COMMIT e os participantes efetivam o commit.
// - Vantagem: se o coordenador cai DEPOIS do PRE_COMMIT, os participantes
//   podem commitar por timeout; se cai ANTES do PRE_COMMIT, abortam.
//   Isso evita o bloqueio do 2PC.
`
}
