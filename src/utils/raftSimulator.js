// Simulador pedagógico do algoritmo de consenso Raft.
// Não é um servidor real — é uma máquina de estados passo a passo para
// visualizar eleição de líder, batimentos cardíacos (heartbeats),
// replicação de log e partições de rede.

export const STATES = {
  FOLLOWER: 'FOLLOWER',
  CANDIDATE: 'CANDIDATE',
  LEADER: 'LEADER',
}

export const MESSAGE_TYPES = {
  REQUEST_VOTE: 'REQUEST_VOTE',
  REQUEST_VOTE_RESPONSE: 'REQUEST_VOTE_RESPONSE',
  APPEND_ENTRIES: 'APPEND_ENTRIES',
  APPEND_ENTRIES_RESPONSE: 'APPEND_ENTRIES_RESPONSE',
}

const PALETTE = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d']

function randTimeout(base = 150) {
  // timeout aleatório entre base e base*2 (ms) — garante que, na prática,
  // um único nó estoure primeiro.
  return base + Math.floor(Math.random() * base)
}

export function createInitialState(nodeCount = 5) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: i,
    state: STATES.FOLLOWER,
    term: 0,
    votedFor: null,
    votesReceived: 0,
    log: [],
    commitIndex: 0,
    nextIndex: {},
    matchIndex: {},
    color: PALETTE[i % PALETTE.length],
    electionTimeout: randTimeout(),
    lastEventTime: 0,
    isolated: false,
  }))
  return {
    nodes,
    messages: [],
    eventCounter: 0,
    step: 0,
    leaderId: null,
    log: [], // log global de eventos da simulação
    partitionMode: false,
  }
}

export function resetState(nodeCount = 5) {
  return createInitialState(nodeCount)
}

function majority(n) {
  return Math.floor(n / 2) + 1
}

function broadcast(state, from, type, payload = {}) {
  const term = state.nodes[from].term
  const newMessages = state.nodes
    .filter((n) => n.id !== from && !n.isolated && !state.nodes[from].isolated)
    .map((n) => ({
      id: state.eventCounter++,
      from,
      to: n.id,
      type,
      term,
      payload,
      delivered: false,
    }))
  return { ...state, messages: [...state.messages, ...newMessages] }
}

function logEvent(state, text) {
  return {
    ...state,
    log: [{ step: state.step + 1, text }, ...state.log].slice(0, 100),
  }
}

export function startElection(state, nodeId) {
  const node = state.nodes[nodeId]
  if (node.state === STATES.LEADER) return state

  const newNodes = state.nodes.map((n) => {
    if (n.id !== nodeId) return n
    return {
      ...n,
      state: STATES.CANDIDATE,
      term: n.term + 1,
      votedFor: n.id,
      votesReceived: 1,
      electionTimeout: randTimeout(),
      lastEventTime: state.step,
    }
  })

  let nextState = {
    ...state,
    nodes: newNodes,
    step: state.step + 1,
  }
  nextState = logEvent(nextState, `Nó ${nodeId} inicia eleição para o termo ${node.term + 1}`)
  nextState = broadcast(nextState, nodeId, MESSAGE_TYPES.REQUEST_VOTE, {
    lastLogIndex: node.log.length,
    lastLogTerm: node.log[node.log.length - 1]?.term || 0,
  })
  return nextState
}

function isLogUpToDate(candidateLog, lastIndex, lastTerm) {
  const myLastTerm = candidateLog[candidateLog.length - 1]?.term || 0
  const myLastIndex = candidateLog.length
  if (lastTerm !== myLastTerm) return lastTerm > myLastTerm
  return lastIndex >= myLastIndex
}

export function handleRequestVote(state, msg) {
  const voter = state.nodes[msg.to]
  let granted = false
  if (
    msg.term > voter.term ||
    (msg.term === voter.term && (voter.votedFor === null || voter.votedFor === msg.from))
  ) {
    if (isLogUpToDate(voter.log, msg.payload.lastLogIndex, msg.payload.lastLogTerm)) {
      granted = true
    }
  }

  let nextState = state
  if (msg.term > voter.term) {
    nextState = {
      ...nextState,
      nodes: nextState.nodes.map((n) =>
        n.id === msg.to
          ? { ...n, term: msg.term, votedFor: granted ? msg.from : null, state: STATES.FOLLOWER }
          : n
      ),
    }
  } else if (granted) {
    nextState = {
      ...nextState,
      nodes: nextState.nodes.map((n) =>
        n.id === msg.to ? { ...n, votedFor: msg.from } : n
      ),
    }
  }

  nextState = {
    ...nextState,
    messages: [
      ...nextState.messages,
      {
        id: nextState.eventCounter++,
        from: msg.to,
        to: msg.from,
        type: MESSAGE_TYPES.REQUEST_VOTE_RESPONSE,
        term: Math.max(voter.term, msg.term),
        payload: { granted },
        delivered: false,
      },
    ],
  }

  return logEvent(nextState, `Nó ${msg.to} ${granted ? 'vota' : 'recusa'} em ${msg.from} (termo ${msg.term})`)
}

export function handleRequestVoteResponse(state, msg) {
  const candidate = state.nodes[msg.to]
  if (candidate.state !== STATES.CANDIDATE || msg.term < candidate.term) return state

  if (msg.term > candidate.term) {
    return {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === msg.to ? { ...n, term: msg.term, state: STATES.FOLLOWER, votedFor: null } : n
      ),
    }
  }

  if (msg.payload.granted) {
    const votes = candidate.votesReceived + 1
    let nextState = {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === msg.to ? { ...n, votesReceived: votes } : n
      ),
    }

    if (votes >= majority(state.nodes.length)) {
      nextState = {
        ...nextState,
        nodes: nextState.nodes.map((n) => {
          if (n.id !== msg.to) return n
          const nextIndex = {}
          const matchIndex = {}
          state.nodes.forEach((peer) => {
            nextIndex[peer.id] = n.log.length + 1
            matchIndex[peer.id] = 0
          })
          return { ...n, state: STATES.LEADER, nextIndex, matchIndex }
        }),
        leaderId: msg.to,
      }
      nextState = logEvent(nextState, `Nó ${msg.to} é eleito líder no termo ${candidate.term}`)
      nextState = broadcastHeartbeats(nextState, msg.to)
      return nextState
    }

    return logEvent(nextState, `Nó ${msg.to} recebe voto; total ${votes}`)
  }

  return state
}

export function broadcastHeartbeats(state, leaderId) {
  const leader = state.nodes[leaderId]
  if (leader.state !== STATES.LEADER) return state
  return broadcast(state, leaderId, MESSAGE_TYPES.APPEND_ENTRIES, {
    prevLogIndex: leader.log.length,
    prevLogTerm: leader.log[leader.log.length - 1]?.term || 0,
    entries: [],
    leaderCommit: leader.commitIndex,
  })
}

export function handleAppendEntries(state, msg) {
  let nextState = state
  const follower = state.nodes[msg.to]

  // descarta se termo é menor
  if (msg.term < follower.term) {
    nextState = {
      ...nextState,
      messages: [
        ...nextState.messages,
        {
          id: nextState.eventCounter++,
          from: msg.to,
          to: msg.from,
          type: MESSAGE_TYPES.APPEND_ENTRIES_RESPONSE,
          term: follower.term,
          payload: { success: false, matchIndex: follower.log.length },
          delivered: false,
        },
      ],
    }
    return logEvent(nextState, `Nó ${msg.to} rejeita AppendEntries antigo (termo ${msg.term})`)
  }

  // atualiza termo e volta a ser follower se necessário
  nextState = {
    ...nextState,
    nodes: nextState.nodes.map((n) =>
      n.id === msg.to
        ? {
            ...n,
            term: msg.term,
            state: STATES.FOLLOWER,
            votedFor: null,
            leaderId: msg.from,
            lastEventTime: state.step,
          }
        : n.id === msg.from && n.state === STATES.CANDIDATE
        ? { ...n, state: STATES.FOLLOWER, votedFor: null }
        : n
    ),
    leaderId: msg.from,
  }

  const newFollower = nextState.nodes[msg.to]
  const { prevLogIndex, prevLogTerm, entries, leaderCommit } = msg.payload

  // consistência do log
  const logOk =
    prevLogIndex === 0 ||
    (prevLogIndex <= newFollower.log.length &&
      newFollower.log[prevLogIndex - 1]?.term === prevLogTerm)

  if (!logOk) {
    nextState = {
      ...nextState,
      messages: [
        ...nextState.messages,
        {
          id: nextState.eventCounter++,
          from: msg.to,
          to: msg.from,
          type: MESSAGE_TYPES.APPEND_ENTRIES_RESPONSE,
          term: newFollower.term,
          payload: { success: false, matchIndex: newFollower.log.length },
          delivered: false,
        },
      ],
    }
    return logEvent(nextState, `Nó ${msg.to}: inconsistência de log rejeitada`)
  }

  // aplica novas entradas
  let newLog = [...newFollower.log]
  if (entries.length > 0) {
    // remove entradas conflitantes
    newLog = newLog.slice(0, prevLogIndex)
    newLog = [...newLog, ...entries]
  }

  // atualiza commitIndex
  let newCommitIndex = newFollower.commitIndex
  if (leaderCommit > newCommitIndex) {
    newCommitIndex = Math.min(leaderCommit, newLog.length)
  }

  nextState = {
    ...nextState,
    nodes: nextState.nodes.map((n) =>
      n.id === msg.to ? { ...n, log: newLog, commitIndex: newCommitIndex } : n
    ),
    messages: [
      ...nextState.messages,
      {
        id: nextState.eventCounter++,
        from: msg.to,
        to: msg.from,
        type: MESSAGE_TYPES.APPEND_ENTRIES_RESPONSE,
        term: newFollower.term,
        payload: { success: true, matchIndex: newLog.length },
        delivered: false,
      },
    ],
  }

  if (entries.length > 0) {
    nextState = logEvent(
      nextState,
      `Nó ${msg.to} replica ${entries.length} entrada(s) do líder ${msg.from}`
    )
  }
  return nextState
}

export function handleAppendEntriesResponse(state, msg) {
  const leader = state.nodes[msg.to]
  if (leader.state !== STATES.LEADER || msg.term < leader.term) return state

  if (msg.term > leader.term) {
    return {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === msg.to
          ? { ...n, term: msg.term, state: STATES.FOLLOWER, votedFor: null }
          : n
      ),
    }
  }

  const { success, matchIndex } = msg.payload
  let nextState = state

  if (success) {
    const oldMatch = leader.matchIndex[msg.from] || 0
    if (matchIndex > oldMatch) {
      nextState = {
        ...nextState,
        nodes: nextState.nodes.map((n) =>
          n.id === msg.to
            ? {
                ...n,
                matchIndex: { ...n.matchIndex, [msg.from]: matchIndex },
                nextIndex: { ...n.nextIndex, [msg.from]: matchIndex + 1 },
              }
            : n
        ),
      }
    }
  } else {
    const nextIdx = Math.max(1, (leader.nextIndex[msg.from] || leader.log.length + 1) - 1)
    nextState = {
      ...nextState,
      nodes: nextState.nodes.map((n) =>
        n.id === msg.to
          ? { ...n, nextIndex: { ...n.nextIndex, [msg.from]: nextIdx } }
          : n
      ),
    }
    // reenvia com índice anterior
    nextState = sendAppendEntriesTo(nextState, msg.to, msg.from)
  }

  // tenta avançar commitIndex
  nextState = advanceLeaderCommit(nextState, msg.to)
  return nextState
}

function sendAppendEntriesTo(state, leaderId, targetId) {
  const leader = state.nodes[leaderId]
  if (leader.state !== STATES.LEADER) return state
  const target = state.nodes[targetId]
  if (target.isolated || leader.isolated) return state

  const nextIdx = leader.nextIndex[targetId] || 1
  const prevLogIndex = nextIdx - 1
  const prevLogTerm = prevLogIndex > 0 ? leader.log[prevLogIndex - 1]?.term || 0 : 0
  const entries = leader.log.slice(nextIdx - 1)

  return {
    ...state,
    messages: [
      ...state.messages,
      {
        id: state.eventCounter++,
        from: leaderId,
        to: targetId,
        type: MESSAGE_TYPES.APPEND_ENTRIES,
        term: leader.term,
        payload: { prevLogIndex, prevLogTerm, entries, leaderCommit: leader.commitIndex },
        delivered: false,
      },
    ],
  }
}

function advanceLeaderCommit(state, leaderId) {
  const leader = state.nodes[leaderId]
  if (leader.state !== STATES.LEADER) return state

  const replicated = Object.values(leader.matchIndex)
  replicated.push(leader.log.length) // o líder sempre conhece seu próprio log
  replicated.sort((a, b) => b - a)
  const commitPossible = replicated[majority(state.nodes.length) - 1]

  if (
    commitPossible > leader.commitIndex &&
    leader.log[commitPossible - 1]?.term === leader.term
  ) {
    return {
      ...state,
      nodes: state.nodes.map((n) =>
        n.id === leaderId ? { ...n, commitIndex: commitPossible } : n
      ),
    }
  }
  return state
}

export function proposeCommand(state, command) {
  const leader = state.nodes[state.leaderId]
  if (!leader || leader.state !== STATES.LEADER) return state

  const entry = { term: leader.term, index: leader.log.length + 1, command }
  const nextState = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === leader.id ? { ...n, log: [...n.log, entry] } : n
    ),
    step: state.step + 1,
  }
  const logged = logEvent(nextState, `Líder ${leader.id} propõe comando "${command}"`)
  return broadcast(logged, leader.id, MESSAGE_TYPES.APPEND_ENTRIES, {
    prevLogIndex: leader.log.length,
    prevLogTerm: leader.log[leader.log.length - 1]?.term || 0,
    entries: [entry],
    leaderCommit: leader.commitIndex,
  })
}

function deliverNextMessage(state) {
  const pending = state.messages.find((m) => !m.delivered)
  if (!pending) return null

  let nextState = {
    ...state,
    messages: state.messages.map((m) => (m.id === pending.id ? { ...m, delivered: true } : m)),
    step: state.step + 1,
  }

  if (pending.type === MESSAGE_TYPES.REQUEST_VOTE) {
    nextState = handleRequestVote(nextState, pending)
  } else if (pending.type === MESSAGE_TYPES.REQUEST_VOTE_RESPONSE) {
    nextState = handleRequestVoteResponse(nextState, pending)
  } else if (pending.type === MESSAGE_TYPES.APPEND_ENTRIES) {
    nextState = handleAppendEntries(nextState, pending)
  } else if (pending.type === MESSAGE_TYPES.APPEND_ENTRIES_RESPONSE) {
    nextState = handleAppendEntriesResponse(nextState, pending)
  }

  return nextState
}

function triggerNextTimeout(state) {
  // escolhe o follower com maior tempo desde o último evento e estoura timeout
  const candidates = state.nodes
    .filter((n) => n.state !== STATES.LEADER)
    .map((n) => ({ ...n, wait: state.step - n.lastEventTime }))
    .sort((a, b) => b.wait - a.wait)

  const node = candidates[0]
  if (!node) return null

  return startElection(
    {
      ...state,
      step: state.step + 1,
    },
    node.id
  )
}

export function stepSimulation(state) {
  if (state.messages.some((m) => !m.delivered)) {
    return deliverNextMessage(state)
  }
  return triggerNextTimeout(state)
}

export function runUntilStable(state, maxSteps = 50) {
  let current = state
  for (let i = 0; i < maxSteps; i++) {
    const next = stepSimulation(current)
    if (!next) break
    current = next
    if (!current.messages.some((m) => !m.delivered)) {
      const hasLeader = current.nodes.some((n) => n.state === STATES.LEADER)
      const allFollowers = current.nodes.every(
        (n) => n.state === STATES.FOLLOWER || n.state === STATES.LEADER
      )
      if (hasLeader && allFollowers) break
    }
  }
  return current
}

export function toggleNodeIsolation(state, nodeId) {
  return {
    ...state,
    nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, isolated: !n.isolated } : n)),
    partitionMode: true,
    step: state.step + 1,
  }
}

export function setPreset(preset, nodeCount = 5) {
  if (preset === 'election') {
    let state = createInitialState(nodeCount)
    // força o nó 0 a iniciar eleição imediatamente
    return startElection(state, 0)
  }
  if (preset === 'leader-failure') {
    let state = createInitialState(nodeCount)
    state = startElection(state, 0)
    state = runUntilStable(state)
    // isola o líder para forçar nova eleição no próximo timeout
    if (state.leaderId !== null) {
      state = toggleNodeIsolation(state, state.leaderId)
    }
    return state
  }
  if (preset === 'partition') {
    let state = createInitialState(nodeCount)
    state = startElection(state, 0)
    state = runUntilStable(state)
    // isola dois followers, deixando o líder com minoria
    const followers = state.nodes
      .filter((n) => n.state === STATES.FOLLOWER)
      .slice(0, 2)
      .map((n) => n.id)
    followers.forEach((id) => {
      state = toggleNodeIsolation(state, id)
    })
    return state
  }
  if (preset === 'log-replication') {
    let state = createInitialState(nodeCount)
    state = startElection(state, 0)
    state = runUntilStable(state)
    state = proposeCommand(state, 'SET x = 1')
    return state
  }
  return createInitialState(nodeCount)
}

export function sourceCode() {
  return `// Motor Raft simplificado (trechos principais)

const STATES = { FOLLOWER: 'FOLLOWER', CANDIDATE: 'CANDIDATE', LEADER: 'LEADER' }

function startElection(state, nodeId) {
  const node = state.nodes[nodeId]
  const newNodes = state.nodes.map(n =>
    n.id === nodeId
      ? { ...n, state: STATES.CANDIDATE, term: n.term + 1, votedFor: n.id, votesReceived: 1 }
      : n
  )
  let next = { ...state, nodes: newNodes }
  next = broadcast(next, nodeId, 'REQUEST_VOTE')
  return next
}

function handleRequestVote(state, msg) {
  const voter = state.nodes[msg.to]
  const granted = msg.term > voter.term ||
    (msg.term === voter.term && voter.votedFor === null)
  // envia REQUEST_VOTE_RESPONSE...
}

function handleAppendEntries(state, msg) {
  // verifica termo, consistência do log, aplica entradas,
  // atualiza commitIndex e responde sucesso/fracasso
}

function proposeCommand(state, command) {
  const leader = state.nodes[state.leaderId]
  const entry = { term: leader.term, index: leader.log.length + 1, command }
  const next = { ...state, nodes: state.nodes.map(n =>
    n.id === leader.id ? { ...n, log: [...n.log, entry] } : n
  )}
  return broadcast(next, leader.id, 'APPEND_ENTRIES', { entries: [entry] })
}

function stepSimulation(state) {
  if (há mensagens pendentes) return entregarPróximaMensagem(state)
  return estourarTimeoutDeAlgumFollower(state)
}`
}
