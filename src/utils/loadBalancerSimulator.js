// Simulador de algoritmos de load balancing — 100% client-side.
// Nao emula rede nem latencia real; distribui requisicoes ficticias entre
// backends para comparar o comportamento de cada algoritmo.

export const ALGORITHMS = {
  ROUND_ROBIN: 'round-robin',
  WEIGHTED_ROUND_ROBIN: 'weighted-round-robin',
  LEAST_CONNECTIONS: 'least-connections',
  IP_HASH: 'ip-hash',
  RANDOM: 'random',
}

export const ALGORITHM_LABELS = {
  pt: {
    [ALGORITHMS.ROUND_ROBIN]: 'Round Robin',
    [ALGORITHMS.WEIGHTED_ROUND_ROBIN]: 'Weighted Round Robin',
    [ALGORITHMS.LEAST_CONNECTIONS]: 'Least Connections',
    [ALGORITHMS.IP_HASH]: 'IP Hash',
    [ALGORITHMS.RANDOM]: 'Aleatorio',
  },
  en: {
    [ALGORITHMS.ROUND_ROBIN]: 'Round Robin',
    [ALGORITHMS.WEIGHTED_ROUND_ROBIN]: 'Weighted Round Robin',
    [ALGORITHMS.LEAST_CONNECTIONS]: 'Least Connections',
    [ALGORITHMS.IP_HASH]: 'IP Hash',
    [ALGORITHMS.RANDOM]: 'Random',
  },
}

export const ALGORITHM_DESCRIPTIONS = {
  pt: {
    [ALGORITHMS.ROUND_ROBIN]:
      'Distribui as requisicoes uma a uma em ordem circular, ignorando pesos. Simples e previsivel.',
    [ALGORITHMS.WEIGHTED_ROUND_ROBIN]:
      'Repete cada backend proporcionalmente ao seu peso. Quanto maior o peso, mais requisicoes ele recebe.',
    [ALGORITHMS.LEAST_CONNECTIONS]:
      'Envia cada nova requisicao para o backend com menos conexoes ativas no momento. Otimo para tarefas de duracao variavel.',
    [ALGORITHMS.IP_HASH]:
      'Usa o IP do cliente para calcular um hash e escolher um backend. O mesmo cliente sempre cai no mesmo servidor (sticky).',
    [ALGORITHMS.RANDOM]:
      'Escolhe um backend aleatoriamente a cada requisicao. Uniforme apenas no limite de muitas requisicoes.',
  },
  en: {
    [ALGORITHMS.ROUND_ROBIN]:
      'Distributes requests one by one in circular order, ignoring weights. Simple and predictable.',
    [ALGORITHMS.WEIGHTED_ROUND_ROBIN]:
      'Repeats each backend proportionally to its weight. Higher weight means more requests.',
    [ALGORITHMS.LEAST_CONNECTIONS]:
      'Sends each new request to the backend with the fewest active connections at that moment. Great for variable-duration tasks.',
    [ALGORITHMS.IP_HASH]:
      'Uses the client IP to compute a hash and pick a backend. The same client always lands on the same server (sticky).',
    [ALGORITHMS.RANDOM]:
      'Picks a backend randomly for each request. Only becomes uniform with a large number of requests.',
  },
}

export const PRESETS = {
  pt: [
    {
      key: 'balanced',
      label: '3 backends equilibrados',
      backends: [
        { id: 'a', name: 'backend-a', weight: 1, connections: 0 },
        { id: 'b', name: 'backend-b', weight: 1, connections: 0 },
        { id: 'c', name: 'backend-c', weight: 1, connections: 0 },
      ],
      requests: 30,
      algorithm: ALGORITHMS.ROUND_ROBIN,
    },
    {
      key: 'weighted',
      label: 'Pesos 3:2:1',
      backends: [
        { id: 'a', name: 'backend-a', weight: 3, connections: 0 },
        { id: 'b', name: 'backend-b', weight: 2, connections: 0 },
        { id: 'c', name: 'backend-c', weight: 1, connections: 0 },
      ],
      requests: 60,
      algorithm: ALGORITHMS.WEIGHTED_ROUND_ROBIN,
    },
    {
      key: 'sticky',
      label: 'Sessoes fixas (IP Hash)',
      backends: [
        { id: 'a', name: 'api-1', weight: 1, connections: 0 },
        { id: 'b', name: 'api-2', weight: 1, connections: 0 },
        { id: 'c', name: 'api-3', weight: 1, connections: 0 },
      ],
      requests: 24,
      algorithm: ALGORITHMS.IP_HASH,
    },
    {
      key: 'slow',
      label: 'Backend lento (Least Connections)',
      backends: [
        { id: 'a', name: 'fast-1', weight: 1, connections: 0 },
        { id: 'b', name: 'fast-2', weight: 1, connections: 0 },
        { id: 'c', name: 'slow-1', weight: 1, connections: 15 },
      ],
      requests: 30,
      algorithm: ALGORITHMS.LEAST_CONNECTIONS,
    },
  ],
  en: [
    {
      key: 'balanced',
      label: '3 balanced backends',
      backends: [
        { id: 'a', name: 'backend-a', weight: 1, connections: 0 },
        { id: 'b', name: 'backend-b', weight: 1, connections: 0 },
        { id: 'c', name: 'backend-c', weight: 1, connections: 0 },
      ],
      requests: 30,
      algorithm: ALGORITHMS.ROUND_ROBIN,
    },
    {
      key: 'weighted',
      label: 'Weights 3:2:1',
      backends: [
        { id: 'a', name: 'backend-a', weight: 3, connections: 0 },
        { id: 'b', name: 'backend-b', weight: 2, connections: 0 },
        { id: 'c', name: 'backend-c', weight: 1, connections: 0 },
      ],
      requests: 60,
      algorithm: ALGORITHMS.WEIGHTED_ROUND_ROBIN,
    },
    {
      key: 'sticky',
      label: 'Sticky sessions (IP Hash)',
      backends: [
        { id: 'a', name: 'api-1', weight: 1, connections: 0 },
        { id: 'b', name: 'api-2', weight: 1, connections: 0 },
        { id: 'c', name: 'api-3', weight: 1, connections: 0 },
      ],
      requests: 24,
      algorithm: ALGORITHMS.IP_HASH,
    },
    {
      key: 'slow',
      label: 'Slow backend (Least Connections)',
      backends: [
        { id: 'a', name: 'fast-1', weight: 1, connections: 0 },
        { id: 'b', name: 'fast-2', weight: 1, connections: 0 },
        { id: 'c', name: 'slow-1', weight: 1, connections: 15 },
      ],
      requests: 30,
      algorithm: ALGORITHMS.LEAST_CONNECTIONS,
    },
  ],
}

function generateClientIp(index) {
  // Gera IPs sequenciais em quatro octetos para reprodutibilidade.
  const n = 1_000_000 + index
  const o1 = Math.floor(n / 16_581_375) % 256
  const o2 = Math.floor(n / 65_025) % 256
  const o3 = Math.floor(n / 255) % 256
  const o4 = (n % 254) + 1
  return `${o1}.${o2}.${o3}.${o4}`
}

function hashIp(ip) {
  // FNV-1a de 32 bits — rapido e deterministico.
  let hash = 0x811c9dc5
  for (let i = 0; i < ip.length; i += 1) {
    hash ^= ip.charCodeAt(i)
    // Multiplicacao por 16777619 com overflow de 32 bits.
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function simulate({ backends, requests, algorithm, seed = 12345 }) {
  const normalizedBackends = backends
    .filter((b) => b && b.id && b.weight > 0)
    .map((b) => ({
      id: b.id,
      name: b.name || b.id,
      weight: Math.max(1, Math.floor(b.weight)),
      connections: Math.max(0, Math.floor(b.connections || 0)),
    }))

  if (normalizedBackends.length === 0) {
    return {
      assignments: [],
      totals: {},
      backendStats: [],
      idealPercentages: {},
    }
  }

  const totals = Object.fromEntries(normalizedBackends.map((b) => [b.id, 0]))
  const assignments = []
  const mutableConnections = normalizedBackends.map((b) => b.connections)

  // Prepara lista circular para Round Robin.
  let rrIndex = 0

  // Prepara lista ponderada para Weighted Round Robin.
  const weightedPool = normalizedBackends.flatMap((b) =>
    Array.from({ length: b.weight }, () => b.id)
  )
  let wrrIndex = 0

  // Gerador LCG deterministico para Random (evita resultados diferentes a cada render).
  let randomState = seed >>> 0
  function nextRandom() {
    randomState = Math.imul(1664525, randomState) + 1013904223
    return (randomState >>> 0) / 0xffffffff
  }

  const totalWeight = normalizedBackends.reduce((sum, b) => sum + b.weight, 0)
  const idealPercentages = Object.fromEntries(
    normalizedBackends.map((b) => [b.id, (b.weight / totalWeight) * 100])
  )

  for (let i = 0; i < requests; i += 1) {
    const clientIp = generateClientIp(i)
    let chosenId

    switch (algorithm) {
      case ALGORITHMS.ROUND_ROBIN: {
        chosenId = normalizedBackends[rrIndex % normalizedBackends.length].id
        rrIndex += 1
        break
      }
      case ALGORITHMS.WEIGHTED_ROUND_ROBIN: {
        chosenId = weightedPool[wrrIndex % weightedPool.length]
        wrrIndex += 1
        break
      }
      case ALGORITHMS.LEAST_CONNECTIONS: {
        let minConnections = Infinity
        const candidates = []
        normalizedBackends.forEach((b, idx) => {
          if (mutableConnections[idx] < minConnections) {
            minConnections = mutableConnections[idx]
            candidates.length = 0
          }
          if (mutableConnections[idx] === minConnections) {
            candidates.push(idx)
          }
        })
        // Desempate deterministico pelo menor id.
        candidates.sort((a, b) => normalizedBackends[a].id.localeCompare(normalizedBackends[b].id))
        const chosenIndex = candidates[0]
        chosenId = normalizedBackends[chosenIndex].id
        mutableConnections[chosenIndex] += 1
        break
      }
      case ALGORITHMS.IP_HASH: {
        const hash = hashIp(clientIp)
        const idx = hash % normalizedBackends.length
        chosenId = normalizedBackends[idx].id
        break
      }
      case ALGORITHMS.RANDOM: {
        const idx = Math.floor(nextRandom() * normalizedBackends.length)
        chosenId = normalizedBackends[idx].id
        break
      }
      default: {
        chosenId = normalizedBackends[0].id
      }
    }

    totals[chosenId] = (totals[chosenId] || 0) + 1
    assignments.push({
      requestIndex: i + 1,
      backendId: chosenId,
      clientIp,
    })
  }

  const backendStats = normalizedBackends.map((b) => {
    const count = totals[b.id] || 0
    return {
      ...b,
      count,
      percentage: requests > 0 ? (count / requests) * 100 : 0,
      finalConnections: mutableConnections[normalizedBackends.indexOf(b)],
    }
  })

  return {
    assignments,
    totals,
    backendStats,
    idealPercentages,
  }
}

export function computeStandardDeviation(values) {
  if (values.length <= 1) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function sourceCode() {
  return `function roundRobin(backends, requestIndex) {
  return backends[requestIndex % backends.length]
}

function weightedRoundRobin(backends, requestIndex) {
  const pool = backends.flatMap((b) => Array(b.weight).fill(b))
  return pool[requestIndex % pool.length]
}

function leastConnections(backends) {
  return backends.reduce((best, b) =>
    b.connections < best.connections ? b : best
  )
}

function ipHash(backends, clientIp) {
  let hash = 0x811c9dc5
  for (let i = 0; i < clientIp.length; i++) {
    hash ^= clientIp.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return backends[(hash >>> 0) % backends.length]
}`
}
