// Simulador do problema dos Filosofos Jantando — 100% client-side.
// Ilustra sincronizacao, deadlocks, starvation e estrategias classicas de
// prevenacao usando garfos como recursos compartilhados.

export const STATES = {
  THINKING: 'THINKING',
  HUNGRY: 'HUNGRY',
  EATING: 'EATING',
}

export const STRATEGIES = {
  NAIVE: 'naive',
  HIERARCHY: 'hierarchy',
  ARBITRATOR: 'arbitrator',
  TIMEOUT: 'timeout',
}

export const PRESETS = {
  pt: [
    {
      key: 'naive-deadlock',
      label: 'Naive — deadlock provavel',
      philosopherCount: 5,
      strategy: STRATEGIES.NAIVE,
      eatDuration: 3,
      thinkDuration: 3,
    },
    {
      key: 'hierarchy-safe',
      label: 'Hierarquia de recursos',
      philosopherCount: 5,
      strategy: STRATEGIES.HIERARCHY,
      eatDuration: 3,
      thinkDuration: 3,
    },
    {
      key: 'arbitrator-safe',
      label: 'Arbitrador (garcom)',
      philosopherCount: 5,
      strategy: STRATEGIES.ARBITRATOR,
      eatDuration: 3,
      thinkDuration: 3,
    },
    {
      key: 'timeout-safe',
      label: 'Timeout e retenta',
      philosopherCount: 5,
      strategy: STRATEGIES.TIMEOUT,
      eatDuration: 3,
      thinkDuration: 3,
    },
  ],
  en: [
    {
      key: 'naive-deadlock',
      label: 'Naive — deadlock likely',
      philosopherCount: 5,
      strategy: STRATEGIES.NAIVE,
      eatDuration: 3,
      thinkDuration: 3,
    },
    {
      key: 'hierarchy-safe',
      label: 'Resource hierarchy',
      philosopherCount: 5,
      strategy: STRATEGIES.HIERARCHY,
      eatDuration: 3,
      thinkDuration: 3,
    },
    {
      key: 'arbitrator-safe',
      label: 'Arbitrator (waiter)',
      philosopherCount: 5,
      strategy: STRATEGIES.ARBITRATOR,
      eatDuration: 3,
      thinkDuration: 3,
    },
    {
      key: 'timeout-safe',
      label: 'Timeout and retry',
      philosopherCount: 5,
      strategy: STRATEGIES.TIMEOUT,
      eatDuration: 3,
      thinkDuration: 3,
    },
  ],
}

export function defaultConfig() {
  return {
    philosopherCount: 5,
    strategy: STRATEGIES.HIERARCHY,
    eatDuration: 3,
    thinkDuration: 3,
    timeoutThreshold: 5,
  }
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

function leftFork(index, count) {
  return index
}

function rightFork(index, count) {
  return (index + 1) % count
}

function makePhilosopher(index) {
  return {
    id: index,
    name: `P${index + 1}`,
    state: STATES.THINKING,
    timer: Math.floor(Math.random() * 3) + 1,
    meals: 0,
    hungerTicks: 0,
    maxHungerTicks: 0,
    heldForks: [],
  }
}

function makeForks(count) {
  return Array.from({ length: count }, (_, i) => ({ id: i, heldBy: null }))
}

export function createSimulation(config = defaultConfig()) {
  const count = Math.max(3, Math.min(8, config.philosopherCount || 5))
  return {
    tick: 0,
    philosophers: Array.from({ length: count }, (_, i) => makePhilosopher(i)),
    forks: makeForks(count),
    config: {
      strategy: config.strategy || STRATEGIES.HIERARCHY,
      eatDuration: Math.max(1, config.eatDuration || 3),
      thinkDuration: Math.max(1, config.thinkDuration || 3),
      timeoutThreshold: Math.max(2, config.timeoutThreshold || 5),
    },
    stats: {
      totalMeals: 0,
      deadlockTicks: 0,
      maxConcurrentEating: 0,
    },
    log: [],
    running: false,
    finished: false,
  }
}

function pushLog(sim, message, type = 'info') {
  sim.log.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tick: sim.tick,
    message,
    type,
    timestamp: Date.now(),
  })
  if (sim.log.length > 80) sim.log.pop()
}

function isForkFree(forks, forkId) {
  return forks[forkId].heldBy === null
}

function holdFork(sim, philosopher, forkId) {
  sim.forks[forkId].heldBy = philosopher.id
  philosopher.heldForks.push(forkId)
}

function releaseFork(sim, philosopher, forkId) {
  sim.forks[forkId].heldBy = null
  philosopher.heldForks = philosopher.heldForks.filter((id) => id !== forkId)
}

function releaseAllForks(sim, philosopher) {
  const ids = philosopher.heldForks.slice()
  ids.forEach((forkId) => releaseFork(sim, philosopher, forkId))
}

function tryEatNaive(sim, philosopher, count) {
  const left = leftFork(philosopher.id, count)
  const right = rightFork(philosopher.id, count)

  if (philosopher.heldForks.length === 0) {
    if (isForkFree(sim.forks, left)) {
      holdFork(sim, philosopher, left)
      return false
    }
  } else if (philosopher.heldForks.length === 1) {
    const held = philosopher.heldForks[0]
    const needed = held === left ? right : left
    if (isForkFree(sim.forks, needed)) {
      holdFork(sim, philosopher, needed)
      philosopher.state = STATES.EATING
      philosopher.meals += 1
      philosopher.timer = sim.config.eatDuration
      philosopher.hungerTicks = 0
      sim.stats.totalMeals += 1
      pushLog(sim, `${philosopher.name} pegou dois garfos e comecou a comer.`, 'success')
      return true
    }
  }
  return false
}

function tryEatHierarchy(sim, philosopher, count) {
  const left = leftFork(philosopher.id, count)
  const right = rightFork(philosopher.id, count)
  const first = Math.min(left, right)
  const second = Math.max(left, right)

  if (philosopher.heldForks.length === 0) {
    if (isForkFree(sim.forks, first)) {
      holdFork(sim, philosopher, first)
      return false
    }
  } else if (philosopher.heldForks.length === 1 && philosopher.heldForks[0] === first) {
    if (isForkFree(sim.forks, second)) {
      holdFork(sim, philosopher, second)
      philosopher.state = STATES.EATING
      philosopher.meals += 1
      philosopher.timer = sim.config.eatDuration
      philosopher.hungerTicks = 0
      sim.stats.totalMeals += 1
      pushLog(sim, `${philosopher.name} pegou os garfos em ordem hierarquica e comeu.`, 'success')
      return true
    }
  }
  return false
}

function tryEatArbitrator(sim, philosopher, count) {
  const left = leftFork(philosopher.id, count)
  const right = rightFork(philosopher.id, count)

  if (isForkFree(sim.forks, left) && isForkFree(sim.forks, right)) {
    holdFork(sim, philosopher, left)
    holdFork(sim, philosopher, right)
    philosopher.state = STATES.EATING
    philosopher.meals += 1
    philosopher.timer = sim.config.eatDuration
    philosopher.hungerTicks = 0
    sim.stats.totalMeals += 1
    pushLog(sim, `${philosopher.name} pegou ambos os garfos ao mesmo tempo (arbitrador).`, 'success')
    return true
  }
  return false
}

function tryEatTimeout(sim, philosopher, count) {
  const ate = tryEatNaive(sim, philosopher, count)
  if (!ate) {
    if (philosopher.hungerTicks >= sim.config.timeoutThreshold) {
      if (philosopher.heldForks.length > 0) {
        releaseAllForks(sim, philosopher)
        pushLog(sim, `${philosopher.name} atingiu o timeout e soltou os garfos.`, 'warning')
      }
      philosopher.state = STATES.THINKING
      philosopher.timer = 1
      philosopher.hungerTicks = 0
    }
  }
  return ate
}

function tryEat(sim, philosopher, count) {
  switch (sim.config.strategy) {
    case STRATEGIES.NAIVE:
      return tryEatNaive(sim, philosopher, count)
    case STRATEGIES.HIERARCHY:
      return tryEatHierarchy(sim, philosopher, count)
    case STRATEGIES.ARBITRATOR:
      return tryEatArbitrator(sim, philosopher, count)
    case STRATEGIES.TIMEOUT:
      return tryEatTimeout(sim, philosopher, count)
    default:
      return false
  }
}

function detectDeadlock(sim) {
  const count = sim.philosophers.length
  // Deadlock: todo mundo segurando exatamente um garfo e com fome
  return sim.philosophers.every(
    (p) => p.state === STATES.HUNGRY && p.heldForks.length === 1
  ) && sim.philosophers.every((p) => sim.forks[p.heldForks[0]].heldBy === p.id) && sim.stats.totalMeals > 0
}

export function step(sim) {
  if (sim.finished) return sim
  const next = clone(sim)
  next.tick += 1
  const count = next.philosophers.length

  next.philosophers.forEach((philosopher) => {
    if (philosopher.timer > 0) philosopher.timer -= 1

    if (philosopher.state === STATES.EATING) {
      if (philosopher.timer === 0) {
        releaseAllForks(next, philosopher)
        philosopher.state = STATES.THINKING
        philosopher.timer = next.config.thinkDuration
        pushLog(next, `${philosopher.name} terminou de comer e voltou a pensar.`, 'info')
      }
      return
    }

    if (philosopher.state === STATES.THINKING) {
      if (philosopher.timer === 0) {
        philosopher.state = STATES.HUNGRY
        philosopher.hungerTicks = 0
        pushLog(next, `${philosopher.name} ficou com fome.`, 'warning')
      }
      return
    }

    if (philosopher.state === STATES.HUNGRY) {
      philosopher.hungerTicks += 1
      philosopher.maxHungerTicks = Math.max(philosopher.maxHungerTicks, philosopher.hungerTicks)
      tryEat(next, philosopher, count)
    }
  })

  const eatingCount = next.philosophers.filter((p) => p.state === STATES.EATING).length
  next.stats.maxConcurrentEating = Math.max(next.stats.maxConcurrentEating, eatingCount)

  if (detectDeadlock(next)) {
    next.stats.deadlockTicks += 1
    if (next.stats.deadlockTicks === 1) {
      pushLog(next, 'DEADLOCK detectado: todos seguram um garfo e esperam o outro!', 'error')
    }
  } else {
    next.stats.deadlockTicks = 0
  }

  return next
}

export function runTicks(sim, ticks) {
  let current = sim
  for (let i = 0; i < ticks; i += 1) {
    if (current.finished) break
    current = step(current)
  }
  return current
}

export function resetSimulation(config) {
  return createSimulation(config)
}

export function stateColor(state) {
  switch (state) {
    case STATES.THINKING:
      return '#52c41a'
    case STATES.HUNGRY:
      return '#faad14'
    case STATES.EATING:
      return '#1890ff'
    default:
      return '#8c8c8c'
  }
}

export function strategyLabel(strategy, lang) {
  const labels = {
    pt: {
      [STRATEGIES.NAIVE]: 'Ingenuo (segura um garfo)',
      [STRATEGIES.HIERARCHY]: 'Hierarquia de recursos',
      [STRATEGIES.ARBITRATOR]: 'Arbitrador / garcom',
      [STRATEGIES.TIMEOUT]: 'Timeout e retenta',
    },
    en: {
      [STRATEGIES.NAIVE]: 'Naive (holds one fork)',
      [STRATEGIES.HIERARCHY]: 'Resource hierarchy',
      [STRATEGIES.ARBITRATOR]: 'Arbitrator / waiter',
      [STRATEGIES.TIMEOUT]: 'Timeout and retry',
    },
  }
  return (labels[lang] || labels.en)[strategy] || strategy
}

export function sourceCode() {
  return `// Motor do simulador de Filosofos Jantando (Dining Philosophers)

export const STATES = {
  THINKING: 'THINKING',
  HUNGRY: 'HUNGRY',
  EATING: 'EATING',
}

export const STRATEGIES = {
  NAIVE: 'naive',        // pega esquerda, depois direita (pode deadlockar)
  HIERARCHY: 'hierarchy', // sempre pega o garfo de menor ID primeiro
  ARBITRATOR: 'arbitrator', // so comeca se ambos os garfos estiverem livres
  TIMEOUT: 'timeout',    // solta garfos apos N ticks com fome
}

function leftFork(i, n) { return i }
function rightFork(i, n) { return (i + 1) % n }

function tryEatNaive(sim, p, n) {
  const left = leftFork(p.id, n)
  const right = rightFork(p.id, n)
  if (p.heldForks.length === 0 && sim.forks[left].heldBy === null) {
    sim.forks[left].heldBy = p.id
    p.heldForks.push(left)
    return false
  }
  if (p.heldForks.length === 1 && sim.forks[right].heldBy === null) {
    sim.forks[right].heldBy = p.id
    p.heldForks.push(right)
    p.state = STATES.EATING
    return true
  }
  return false
}

function tryEatHierarchy(sim, p, n) {
  const forks = [leftFork(p.id, n), rightFork(p.id, n)].sort((a, b) => a - b)
  if (p.heldForks.length === 0 && sim.forks[forks[0]].heldBy === null) {
    sim.forks[forks[0]].heldBy = p.id
    p.heldForks.push(forks[0])
    return false
  }
  if (p.heldForks.length === 1 && sim.forks[forks[1]].heldBy === null) {
    sim.forks[forks[1]].heldBy = p.id
    p.heldForks.push(forks[1])
    p.state = STATES.EATING
    return true
  }
  return false
}

function tryEatArbitrator(sim, p, n) {
  const left = leftFork(p.id, n)
  const right = rightFork(p.id, n)
  if (sim.forks[left].heldBy === null && sim.forks[right].heldBy === null) {
    sim.forks[left].heldBy = p.id
    sim.forks[right].heldBy = p.id
    p.heldForks.push(left, right)
    p.state = STATES.EATING
    return true
  }
  return false
}

export function step(sim) {
  const next = structuredClone(sim)
  next.tick += 1
  const n = next.philosophers.length

  next.philosophers.forEach((p) => {
    if (p.timer > 0) p.timer -= 1

    if (p.state === STATES.EATING && p.timer === 0) {
      p.heldForks.forEach((forkId) => { next.forks[forkId].heldBy = null })
      p.heldForks = []
      p.state = STATES.THINKING
      p.timer = next.config.thinkDuration
      return
    }

    if (p.state === STATES.THINKING && p.timer === 0) {
      p.state = STATES.HUNGRY
      return
    }

    if (p.state === STATES.HUNGRY) {
      p.hungerTicks += 1
      const ate = (
        next.config.strategy === STRATEGIES.NAIVE ? tryEatNaive(next, p, n) :
        next.config.strategy === STRATEGIES.HIERARCHY ? tryEatHierarchy(next, p, n) :
        next.config.strategy === STRATEGIES.ARBITRATOR ? tryEatArbitrator(next, p, n) :
        tryEatNaive(next, p, n)
      )
      if (ate) {
        p.meals += 1
        p.timer = next.config.eatDuration
        p.hungerTicks = 0
      }
    }
  })

  return next
}

// Regras classicas:
// - 5 filosofos sentados em uma mesa circular.
// - Cada um precisa de dois garfos (esquerdo e direito) para comer.
// - Solucoes para evitar deadlock:
//   1. Hierarquia de recursos: pegue sempre o garfo de menor ID primeiro.
//   2. Arbitrador: so permita pegar ambos os garfos quando ambos estiverem livres.
//   3. Timeout: limite o tempo com fome e solte os garfos ja adquiridos.
// - Starvation ainda e possivel mesmo sem deadlock; estatisticas ajudam a detecta-la.
`
}
