// Simulador de Gossip Protocol — 100% client-side.
// Modela a propagação de uma mensagem numa rede de nodes usando epidemias
// de rumor: SI (simple) ou SIR (com remocao). Cada node infectado escolhe
// `fanout` vizinhos aleatorios por round para tentar contagiar.

export const MODES = {
  SI: 'si',
  SIR: 'sir',
}

export const STATES = {
  SUSCEPTIBLE: 'susceptible',
  INFECTED: 'infected',
  REMOVED: 'removed',
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(array, rng) {
  const copy = array.slice()
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function createNetwork(nodeCount, topology = 'random', seed = 12345) {
  const rng = mulberry32(seed)
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: i,
    state: STATES.SUSCEPTIBLE,
    roundsInfected: 0,
  }))

  const edges = []

  if (topology === 'ring') {
    for (let i = 0; i < nodeCount; i += 1) {
      const next = (i + 1) % nodeCount
      edges.push([i, next])
      nodes[i].neighbors = nodes[i].neighbors || []
      nodes[i].neighbors.push(next)
      nodes[next].neighbors = nodes[next].neighbors || []
      nodes[next].neighbors.push(i)
    }
  } else if (topology === 'mesh') {
    for (let i = 0; i < nodeCount; i += 1) {
      nodes[i].neighbors = []
      for (let j = 0; j < nodeCount; j += 1) {
        if (i !== j) {
          edges.push([i, j])
          nodes[i].neighbors.push(j)
        }
      }
    }
  } else if (topology === 'star') {
    const center = 0
    for (let i = 1; i < nodeCount; i += 1) {
      edges.push([center, i])
      nodes[center].neighbors = nodes[center].neighbors || []
      nodes[center].neighbors.push(i)
      nodes[i].neighbors = nodes[i].neighbors || []
      nodes[i].neighbors.push(center)
    }
  } else {
    // random: cada node se conecta a ~ln(N) vizinhos, minimo 2.
    const targetDegree = Math.max(2, Math.round(Math.log(nodeCount || 1) + 2))
    for (let i = 0; i < nodeCount; i += 1) {
      nodes[i].neighbors = []
    }
    for (let i = 0; i < nodeCount; i += 1) {
      const others = Array.from({ length: nodeCount }, (_, k) => k).filter((k) => k !== i)
      const picked = shuffle(others, rng).slice(0, targetDegree)
      picked.forEach((j) => {
        if (!nodes[i].neighbors.includes(j)) {
          nodes[i].neighbors.push(j)
          nodes[j].neighbors.push(i)
          edges.push([i, j])
        }
      })
    }
  }

  // Garante grafo conexo adicionando ponte entre componentes, se necessario.
  ensureConnected(nodes, rng)

  return { nodes, edges }
}

function ensureConnected(nodes, rng) {
  if (nodes.length <= 1) return
  const visited = new Set()
  const stack = [0]
  while (stack.length) {
    const id = stack.pop()
    if (visited.has(id)) continue
    visited.add(id)
    nodes[id].neighbors.forEach((n) => stack.push(n))
  }

  if (visited.size === nodes.length) return

  const unvisited = nodes.map((n) => n.id).filter((id) => !visited.has(id))
  unvisited.forEach((id) => {
    const target = Math.floor(rng() * nodes.length)
    if (!nodes[id].neighbors.includes(target)) {
      nodes[id].neighbors.push(target)
      nodes[target].neighbors.push(id)
    }
  })
}

export function seedInfection(nodes, sourceCount, rng) {
  const copy = nodes.map((n) => ({ ...n }))
  const sources = shuffle(
    copy.map((n) => n.id),
    rng
  ).slice(0, Math.max(1, sourceCount))
  sources.forEach((id) => {
    copy[id].state = STATES.INFECTED
    copy[id].roundsInfected = 0
  })
  return { nodes: copy, sources }
}

export function stepGossip(state, mode, fanout, removedAfterRounds, rng) {
  const nodes = state.nodes.map((n) => ({ ...n }))
  const messages = []
  const newInfections = new Set()

  nodes.forEach((node) => {
    if (node.state !== STATES.INFECTED) return
    if (!node.neighbors || node.neighbors.length === 0) return

    const peers = shuffle(node.neighbors, rng).slice(0, Math.max(1, fanout))
    peers.forEach((peerId) => {
      messages.push({ from: node.id, to: peerId })
      const peer = nodes[peerId]
      if (peer.state === STATES.SUSCEPTIBLE) {
        peer.state = STATES.INFECTED
        peer.roundsInfected = 0
        newInfections.add(peerId)
      }
    })
  })

  if (mode === MODES.SIR) {
    nodes.forEach((node) => {
      if (node.state === STATES.INFECTED) {
        node.roundsInfected += 1
        if (node.roundsInfected >= removedAfterRounds) {
          node.state = STATES.REMOVED
        }
      }
    })
  }

  const counts = countStates(nodes)
  return {
    nodes,
    round: state.round + 1,
    messages: state.messages + messages.length,
    lastMessages: messages,
    newInfectionCount: newInfections.size,
    counts,
    converged: counts.susceptible === 0 || counts.infected === 0,
  }
}

export function countStates(nodes) {
  return nodes.reduce(
    (acc, n) => {
      acc[n.state] += 1
      return acc
    },
    { susceptible: 0, infected: 0, removed: 0 }
  )
}

export function resetSimulation(state, sourceCount, rng) {
  const resetNodes = state.nodes.map((n) => ({
    ...n,
    state: STATES.SUSCEPTIBLE,
    roundsInfected: 0,
  }))
  const seeded = seedInfection(resetNodes, sourceCount, rng)
  return {
    nodes: seeded.nodes,
    round: 0,
    messages: 0,
    lastMessages: [],
    newInfectionCount: 0,
    counts: countStates(seeded.nodes),
    converged: false,
  }
}

export function buildInitialState(nodeCount, topology, sourceCount, seed) {
  const rng = mulberry32(seed)
  const network = createNetwork(nodeCount, topology, seed)
  const seeded = seedInfection(network.nodes, sourceCount, rng)
  return {
    nodes: seeded.nodes,
    edges: network.edges,
    round: 0,
    messages: 0,
    lastMessages: [],
    newInfectionCount: 0,
    counts: countStates(seeded.nodes),
    converged: false,
    sources: seeded.sources,
  }
}

export function estimateConvergence({ nodeCount, mode, fanout, removedAfterRounds }) {
  // Aproximacao grosseira baseada em SI: ln(N) / ln(1 + fanout) rounds.
  if (mode === MODES.SI) {
    return Math.ceil(Math.log(nodeCount || 1) / Math.log(1 + Math.max(1, fanout)))
  }
  // Para SIR a convergencia depende do removedAfterRounds; usamos heuristicas.
  const base = Math.ceil(Math.log(nodeCount || 1) / Math.log(1 + Math.max(1, fanout)))
  return Math.ceil(base * (1 + 2 / Math.max(1, removedAfterRounds)))
}

export const PRESETS = {
  pt: [
    {
      key: 'si-fast',
      label: 'SI rapido (rede pequena)',
      nodeCount: 20,
      topology: 'random',
      fanout: 3,
      mode: MODES.SI,
      sourceCount: 1,
      removedAfterRounds: 3,
    },
    {
      key: 'sir-slow',
      label: 'SIR lento (remocao tardia)',
      nodeCount: 30,
      topology: 'random',
      fanout: 2,
      mode: MODES.SIR,
      sourceCount: 2,
      removedAfterRounds: 5,
    },
    {
      key: 'ring',
      label: 'Anel determinista',
      nodeCount: 24,
      topology: 'ring',
      fanout: 2,
      mode: MODES.SI,
      sourceCount: 1,
      removedAfterRounds: 3,
    },
    {
      key: 'star',
      label: 'Estrela (hub central)',
      nodeCount: 25,
      topology: 'star',
      fanout: 3,
      mode: MODES.SI,
      sourceCount: 1,
      removedAfterRounds: 3,
    },
    {
      key: 'large',
      label: 'Rede grande (100 nodes)',
      nodeCount: 100,
      topology: 'random',
      fanout: 4,
      mode: MODES.SI,
      sourceCount: 3,
      removedAfterRounds: 4,
    },
  ],
  en: [
    {
      key: 'si-fast',
      label: 'Fast SI (small network)',
      nodeCount: 20,
      topology: 'random',
      fanout: 3,
      mode: MODES.SI,
      sourceCount: 1,
      removedAfterRounds: 3,
    },
    {
      key: 'sir-slow',
      label: 'Slow SIR (late removal)',
      nodeCount: 30,
      topology: 'random',
      fanout: 2,
      mode: MODES.SIR,
      sourceCount: 2,
      removedAfterRounds: 5,
    },
    {
      key: 'ring',
      label: 'Deterministic ring',
      nodeCount: 24,
      topology: 'ring',
      fanout: 2,
      mode: MODES.SI,
      sourceCount: 1,
      removedAfterRounds: 3,
    },
    {
      key: 'star',
      label: 'Star (central hub)',
      nodeCount: 25,
      topology: 'star',
      fanout: 3,
      mode: MODES.SI,
      sourceCount: 1,
      removedAfterRounds: 3,
    },
    {
      key: 'large',
      label: 'Large network (100 nodes)',
      nodeCount: 100,
      topology: 'random',
      fanout: 4,
      mode: MODES.SI,
      sourceCount: 3,
      removedAfterRounds: 4,
    },
  ],
}

export function sourceCode() {
  return `const STATES = {
  SUSCEPTIBLE: 'susceptible',
  INFECTED: 'infected',
  REMOVED: 'removed'
};

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(array, rng) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function stepGossip(state, fanout, mode, removedAfterRounds, rng) {
  const nodes = state.nodes.map(n => ({ ...n }));
  const messages = [];

  nodes.forEach(node => {
    if (node.state !== STATES.INFECTED) return;
    const peers = shuffle(node.neighbors, rng).slice(0, fanout);
    peers.forEach(peerId => {
      messages.push({ from: node.id, to: peerId });
      if (nodes[peerId].state === STATES.SUSCEPTIBLE) {
        nodes[peerId].state = STATES.INFECTED;
      }
    });
  });

  if (mode === 'sir') {
    nodes.forEach(node => {
      if (node.state === STATES.INFECTED) {
        node.roundsInfected += 1;
        if (node.roundsInfected >= removedAfterRounds) {
          node.state = STATES.REMOVED;
        }
      }
    });
  }

  return { nodes, messages, round: state.round + 1 };
}

function countStates(nodes) {
  return nodes.reduce((acc, n) => {
    acc[n.state] += 1;
    return acc;
  }, { susceptible: 0, infected: 0, removed: 0 });
}`
}
