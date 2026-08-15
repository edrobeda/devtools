// Simulador de Circuit Breaker — 100% client-side.
// Implementa a maquina de estados classica CLOSED -> OPEN -> HALF_OPEN,
// com janela deslizante de falhas e threshold de sucessos para fechar.

export const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
}

export const PRESETS = {
  pt: [
    {
      key: 'api-flaky',
      label: 'API instavel',
      failureThreshold: 3,
      successThreshold: 2,
      timeoutDuration: 3000,
      slidingWindowSize: 5,
      failureRate: 0.55,
    },
    {
      key: 'db-slow',
      label: 'DB lento (timeout rapido)',
      failureThreshold: 2,
      successThreshold: 3,
      timeoutDuration: 2000,
      slidingWindowSize: 4,
      failureRate: 0.35,
    },
    {
      key: 'healthy',
      label: 'Servico saudavel',
      failureThreshold: 5,
      successThreshold: 2,
      timeoutDuration: 5000,
      slidingWindowSize: 10,
      failureRate: 0.05,
    },
    {
      key: 'sensitive',
      label: 'Circuito sensivel',
      failureThreshold: 1,
      successThreshold: 1,
      timeoutDuration: 4000,
      slidingWindowSize: 3,
      failureRate: 0.45,
    },
  ],
  en: [
    {
      key: 'api-flaky',
      label: 'Flaky API',
      failureThreshold: 3,
      successThreshold: 2,
      timeoutDuration: 3000,
      slidingWindowSize: 5,
      failureRate: 0.55,
    },
    {
      key: 'db-slow',
      label: 'Slow DB (fast timeout)',
      failureThreshold: 2,
      successThreshold: 3,
      timeoutDuration: 2000,
      slidingWindowSize: 4,
      failureRate: 0.35,
    },
    {
      key: 'healthy',
      label: 'Healthy service',
      failureThreshold: 5,
      successThreshold: 2,
      timeoutDuration: 5000,
      slidingWindowSize: 10,
      failureRate: 0.05,
    },
    {
      key: 'sensitive',
      label: 'Sensitive circuit',
      failureThreshold: 1,
      successThreshold: 1,
      timeoutDuration: 4000,
      slidingWindowSize: 3,
      failureRate: 0.45,
    },
  ],
}

export function defaultConfig() {
  return {
    failureThreshold: 3,
    successThreshold: 2,
    timeoutDuration: 3000,
    slidingWindowSize: 5,
  }
}

export function initialState(config) {
  return {
    state: STATES.CLOSED,
    config: { ...config },
    failures: [],
    halfOpenSuccesses: 0,
    openedAt: null,
    stats: { total: 0, success: 0, failure: 0, rejected: 0, transitions: 0 },
    history: [],
  }
}

export function resetState(state) {
  return initialState(state.config)
}

function pruneFailures(failures, now, windowSize) {
  const cutoff = now - windowSize
  return failures.filter((t) => t > cutoff)
}

function makeHistoryEntry({ now, success, rejected, stateBefore, stateAfter }) {
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    success,
    rejected,
    stateBefore,
    stateAfter,
  }
}

export function recordEvent(state, success, now = Date.now()) {
  const { config } = state
  let nextState = state.state
  let rejected = false
  let halfOpenSuccesses = state.halfOpenSuccesses
  let openedAt = state.openedAt
  let failures = state.failures
  let stats = { ...state.stats, total: state.stats.total + 1 }
  let transitions = state.stats.transitions

  if (state.state === STATES.OPEN) {
    if (openedAt && now - openedAt >= config.timeoutDuration) {
      nextState = STATES.HALF_OPEN
      transitions += 1
      halfOpenSuccesses = 0
      openedAt = null
    } else {
      rejected = true
      stats.rejected += 1
      const history = [makeHistoryEntry({ now, success: null, rejected: true, stateBefore: state.state, stateAfter: STATES.OPEN }), ...state.history].slice(0, 100)
      return { ...state, stats, history }
    }
  }

  if (nextState === STATES.HALF_OPEN) {
    if (success) {
      halfOpenSuccesses += 1
      stats.success += 1
      if (halfOpenSuccesses >= config.successThreshold) {
        nextState = STATES.CLOSED
        transitions += 1
        halfOpenSuccesses = 0
        failures = []
        openedAt = null
      }
    } else {
      stats.failure += 1
      nextState = STATES.OPEN
      transitions += 1
      openedAt = now
      halfOpenSuccesses = 0
    }
    const history = [makeHistoryEntry({ now, success, rejected: false, stateBefore: state.state, stateAfter: nextState }), ...state.history].slice(0, 100)
    return {
      ...state,
      state: nextState,
      failures,
      halfOpenSuccesses,
      openedAt,
      stats: { ...stats, transitions },
      history,
    }
  }

  // CLOSED
  failures = pruneFailures(state.failures, now, config.slidingWindowSize)
  if (success) {
    stats.success += 1
  } else {
    stats.failure += 1
    failures = [...failures, now]
    if (failures.length >= config.failureThreshold) {
      nextState = STATES.OPEN
      transitions += 1
      openedAt = now
    }
  }

  const history = [makeHistoryEntry({ now, success, rejected: false, stateBefore: state.state, stateAfter: nextState }), ...state.history].slice(0, 100)
  return {
    ...state,
    state: nextState,
    failures,
    halfOpenSuccesses,
    openedAt,
    stats: { ...stats, transitions },
    history,
  }
}

export function stateColor(state) {
  switch (state) {
    case STATES.CLOSED:
      return '#52c41a'
    case STATES.OPEN:
      return '#ff4d4f'
    case STATES.HALF_OPEN:
      return '#faad14'
    default:
      return '#8c8c8c'
  }
}

export function stateLabel(state, lang = 'pt') {
  const labels = {
    pt: {
      CLOSED: 'FECHADO',
      OPEN: 'ABERTO',
      HALF_OPEN: 'MEIO ABERTO',
    },
    en: {
      CLOSED: 'CLOSED',
      OPEN: 'OPEN',
      HALF_OPEN: 'HALF-OPEN',
    },
  }
  return labels[lang][state] || state
}

export function sourceCode() {
  return `// Motor do simulador de Circuit Breaker

export const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
}

export function initialState(config) {
  return {
    state: STATES.CLOSED,
    config: { ...config },
    failures: [],
    halfOpenSuccesses: 0,
    openedAt: null,
    stats: { total: 0, success: 0, failure: 0, rejected: 0, transitions: 0 },
    history: [],
  }
}

function pruneFailures(failures, now, windowSize) {
  const cutoff = now - windowSize
  return failures.filter((t) => t > cutoff)
}

export function recordEvent(state, success, now = Date.now()) {
  const { config } = state
  let nextState = state.state
  let failures = state.failures
  let halfOpenSuccesses = state.halfOpenSuccesses
  let openedAt = state.openedAt
  let stats = { ...state.stats, total: state.stats.total + 1 }
  let transitions = state.stats.transitions

  // Se estiver ABERTO, verifica se o timeout ja passou.
  if (state.state === STATES.OPEN) {
    if (openedAt && now - openedAt >= config.timeoutDuration) {
      nextState = STATES.HALF_OPEN
      transitions += 1
      halfOpenSuccesses = 0
      openedAt = null
    } else {
      stats.rejected += 1
      return { ...state, stats }
    }
  }

  // Estado MEIO ABERTO: testa se o servico recuperou.
  if (nextState === STATES.HALF_OPEN) {
    if (success) {
      halfOpenSuccesses += 1
      stats.success += 1
      if (halfOpenSuccesses >= config.successThreshold) {
        nextState = STATES.CLOSED
        transitions += 1
        halfOpenSuccesses = 0
        failures = []
        openedAt = null
      }
    } else {
      stats.failure += 1
      nextState = STATES.OPEN
      transitions += 1
      openedAt = now
      halfOpenSuccesses = 0
    }
    return { ...state, state: nextState, failures, halfOpenSuccesses, openedAt,
             stats: { ...stats, transitions } }
  }

  // Estado FECHADO: contabiliza falhas na janela deslizante.
  failures = pruneFailures(state.failures, now, config.slidingWindowSize)
  if (success) {
    stats.success += 1
  } else {
    stats.failure += 1
    failures = [...failures, now]
    if (failures.length >= config.failureThreshold) {
      nextState = STATES.OPEN
      transitions += 1
      openedAt = now
    }
  }

  return { ...state, state: nextState, failures, halfOpenSuccesses, openedAt,
           stats: { ...stats, transitions } }
}

// Regras classicas:
// - CLOSED: requests passam normalmente; N falhas dentro da janela abrem o circuito.
// - OPEN: requests sao rejeitados imediatamente ate o timeout expirar.
// - HALF_OPEN: um pequeno fluxo de teste e liberado; M sucessos consecutivos
//   fecham o circuito, uma unica falha o reabre.
`
}
