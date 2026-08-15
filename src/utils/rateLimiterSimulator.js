// Simulador de Rate Limiter — 100% client-side.
// Implementa cinco algoritmos classicos de controle de trafego:
// Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log e
// Sliding Window Counter.

export const ALGORITHMS = {
  TOKEN_BUCKET: 'tokenBucket',
  LEAKY_BUCKET: 'leakyBucket',
  FIXED_WINDOW: 'fixedWindow',
  SLIDING_WINDOW_LOG: 'slidingWindowLog',
  SLIDING_WINDOW_COUNTER: 'slidingWindowCounter',
}

export const ALGORITHM_LABELS = {
  pt: {
    tokenBucket: 'Token Bucket',
    leakyBucket: 'Leaky Bucket',
    fixedWindow: 'Fixed Window',
    slidingWindowLog: 'Sliding Window Log',
    slidingWindowCounter: 'Sliding Window Counter',
  },
  en: {
    tokenBucket: 'Token Bucket',
    leakyBucket: 'Leaky Bucket',
    fixedWindow: 'Fixed Window',
    slidingWindowLog: 'Sliding Window Log',
    slidingWindowCounter: 'Sliding Window Counter',
  },
}

export function defaultConfig(algorithm = ALGORITHMS.TOKEN_BUCKET) {
  switch (algorithm) {
    case ALGORITHMS.TOKEN_BUCKET:
      return { capacity: 10, refillRate: 2, initialTokens: 10 }
    case ALGORITHMS.LEAKY_BUCKET:
      return { capacity: 10, leakRate: 2, initialVolume: 0 }
    case ALGORITHMS.FIXED_WINDOW:
      return { limit: 10, windowMs: 1000 }
    case ALGORITHMS.SLIDING_WINDOW_LOG:
      return { limit: 10, windowMs: 1000 }
    case ALGORITHMS.SLIDING_WINDOW_COUNTER:
      return { limit: 10, windowMs: 1000 }
    default:
      return {}
  }
}

export function initialState(algorithm, config, now = Date.now()) {
  const base = {
    algorithm,
    config: { ...config },
    stats: { total: 0, allowed: 0, rejected: 0 },
    history: [],
  }

  switch (algorithm) {
    case ALGORITHMS.TOKEN_BUCKET:
      return {
        ...base,
        tokens: config.initialTokens ?? config.capacity,
        lastRefill: now,
      }
    case ALGORITHMS.LEAKY_BUCKET:
      return {
        ...base,
        volume: config.initialVolume ?? 0,
        lastLeak: now,
      }
    case ALGORITHMS.FIXED_WINDOW:
      return {
        ...base,
        windowStart: windowStart(now, config.windowMs),
        count: 0,
      }
    case ALGORITHMS.SLIDING_WINDOW_LOG:
      return {
        ...base,
        requests: [],
      }
    case ALGORITHMS.SLIDING_WINDOW_COUNTER:
      return {
        ...base,
        currentWindowStart: windowStart(now, config.windowMs),
        currentCount: 0,
        previousCount: 0,
      }
    default:
      return base
  }
}

function windowStart(now, windowMs) {
  return Math.floor(now / windowMs) * windowMs
}

function makeHistoryEntry({ now, allowed, stateSnapshot }) {
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    allowed,
    stateSnapshot,
  }
}

export function step(state, now = Date.now()) {
  const { algorithm, config } = state
  let allowed = false
  let remaining = 0
  let nextState = { ...state }

  switch (algorithm) {
    case ALGORITHMS.TOKEN_BUCKET: {
      const capacity = config.capacity
      const refillRate = config.refillRate
      const elapsed = (now - state.lastRefill) / 1000
      let tokens = Math.min(capacity, state.tokens + elapsed * refillRate)
      if (tokens >= 1) {
        tokens -= 1
        allowed = true
      }
      remaining = Math.floor(tokens * 10) / 10
      nextState = { ...state, tokens, lastRefill: now }
      break
    }

    case ALGORITHMS.LEAKY_BUCKET: {
      const capacity = config.capacity
      const leakRate = config.leakRate
      const elapsed = (now - state.lastLeak) / 1000
      let volume = Math.max(0, state.volume - elapsed * leakRate)
      if (volume + 1 <= capacity + 1e-9) {
        volume += 1
        allowed = true
      }
      remaining = Math.max(0, Math.floor((capacity - volume) * 10) / 10)
      nextState = { ...state, volume, lastLeak: now }
      break
    }

    case ALGORITHMS.FIXED_WINDOW: {
      const start = windowStart(now, config.windowMs)
      let count = state.count
      if (start !== state.windowStart) {
        count = 0
      }
      if (count < config.limit) {
        count += 1
        allowed = true
      }
      remaining = Math.max(0, config.limit - count)
      nextState = { ...state, windowStart: start, count }
      break
    }

    case ALGORITHMS.SLIDING_WINDOW_LOG: {
      const cutoff = now - config.windowMs
      const requests = state.requests.filter((t) => t > cutoff)
      if (requests.length < config.limit) {
        requests.push(now)
        allowed = true
      }
      remaining = Math.max(0, config.limit - requests.length)
      nextState = { ...state, requests }
      break
    }

    case ALGORITHMS.SLIDING_WINDOW_COUNTER: {
      const start = windowStart(now, config.windowMs)
      let { currentCount, previousCount, currentWindowStart } = state
      if (start !== currentWindowStart) {
        previousCount = currentCount
        currentCount = 0
        currentWindowStart = start
      }
      const elapsedInWindow = now - start
      const weightPrev = 1 - elapsedInWindow / config.windowMs
      const estimate = currentCount + previousCount * weightPrev
      if (estimate < config.limit) {
        currentCount += 1
        allowed = true
      }
      remaining = Math.max(0, Math.floor((config.limit - estimate) * 10) / 10)
      nextState = { ...state, currentCount, previousCount, currentWindowStart }
      break
    }

    default:
      break
  }

  const stats = {
    ...nextState.stats,
    total: nextState.stats.total + 1,
    allowed: nextState.stats.allowed + (allowed ? 1 : 0),
    rejected: nextState.stats.rejected + (allowed ? 0 : 1),
  }

  const stateSnapshot = describeState(nextState)
  const history = [makeHistoryEntry({ now, allowed, stateSnapshot }), ...nextState.history].slice(0, 100)

  return { ...nextState, stats, history }
}

export function resetState(state) {
  return initialState(state.algorithm, state.config)
}

export function describeState(state) {
  switch (state.algorithm) {
    case ALGORITHMS.TOKEN_BUCKET:
      return { tokens: round(state.tokens), capacity: state.config.capacity }
    case ALGORITHMS.LEAKY_BUCKET:
      return { volume: round(state.volume), capacity: state.config.capacity }
    case ALGORITHMS.FIXED_WINDOW:
      return { count: state.count, limit: state.config.limit }
    case ALGORITHMS.SLIDING_WINDOW_LOG:
      return { count: state.requests.length, limit: state.config.limit }
    case ALGORITHMS.SLIDING_WINDOW_COUNTER:
      return { current: state.currentCount, previous: state.previousCount, limit: state.config.limit }
    default:
      return {}
  }
}

function round(n) {
  return Math.round(n * 100) / 100
}

export function capacityForAlgorithm(algorithm) {
  switch (algorithm) {
    case ALGORITHMS.TOKEN_BUCKET:
    case ALGORITHMS.LEAKY_BUCKET:
      return true
    default:
      return false
  }
}

export const PRESETS = {
  pt: [
    {
      key: 'api-standard',
      label: 'API padrao',
      algorithm: ALGORITHMS.TOKEN_BUCKET,
      config: { capacity: 10, refillRate: 2, initialTokens: 10 },
    },
    {
      key: 'strict-burst',
      label: 'Sem rajada',
      algorithm: ALGORITHMS.LEAKY_BUCKET,
      config: { capacity: 5, leakRate: 1, initialVolume: 0 },
    },
    {
      key: 'window-strict',
      label: 'Janela fixa rigida',
      algorithm: ALGORITHMS.FIXED_WINDOW,
      config: { limit: 5, windowMs: 1000 },
    },
    {
      key: 'sliding-smooth',
      label: 'Janela deslizante suave',
      algorithm: ALGORITHMS.SLIDING_WINDOW_COUNTER,
      config: { limit: 10, windowMs: 1000 },
    },
    {
      key: 'log-precise',
      label: 'Log preciso',
      algorithm: ALGORITHMS.SLIDING_WINDOW_LOG,
      config: { limit: 8, windowMs: 1000 },
    },
  ],
  en: [
    {
      key: 'api-standard',
      label: 'Standard API',
      algorithm: ALGORITHMS.TOKEN_BUCKET,
      config: { capacity: 10, refillRate: 2, initialTokens: 10 },
    },
    {
      key: 'strict-burst',
      label: 'No burst',
      algorithm: ALGORITHMS.LEAKY_BUCKET,
      config: { capacity: 5, leakRate: 1, initialVolume: 0 },
    },
    {
      key: 'window-strict',
      label: 'Strict fixed window',
      algorithm: ALGORITHMS.FIXED_WINDOW,
      config: { limit: 5, windowMs: 1000 },
    },
    {
      key: 'sliding-smooth',
      label: 'Smooth sliding window',
      algorithm: ALGORITHMS.SLIDING_WINDOW_COUNTER,
      config: { limit: 10, windowMs: 1000 },
    },
    {
      key: 'log-precise',
      label: 'Precise log',
      algorithm: ALGORITHMS.SLIDING_WINDOW_LOG,
      config: { limit: 8, windowMs: 1000 },
    },
  ],
}

export function sourceCode() {
  return [
    '// Motor do simulador de Rate Limiter',
    '',
    "export const ALGORITHMS = {",
    "  TOKEN_BUCKET: 'tokenBucket',",
    "  LEAKY_BUCKET: 'leakyBucket',",
    "  FIXED_WINDOW: 'fixedWindow',",
    "  SLIDING_WINDOW_LOG: 'slidingWindowLog',",
    "  SLIDING_WINDOW_COUNTER: 'slidingWindowCounter',",
    "}",
    '',
    'export function initialState(algorithm, config, now = Date.now()) {',
    '  switch (algorithm) {',
    "    case ALGORITHMS.TOKEN_BUCKET:",
    '      return {',
    '        algorithm,',
    '        config: { ...config },',
    '        tokens: config.initialTokens ?? config.capacity,',
    '        lastRefill: now,',
    '        stats: { total: 0, allowed: 0, rejected: 0 },',
    '        history: [],',
    '      }',
    "    case ALGORITHMS.LEAKY_BUCKET:",
    '      return {',
    '        algorithm,',
    '        config: { ...config },',
    '        volume: config.initialVolume ?? 0,',
    '        lastLeak: now,',
    '        stats: { total: 0, allowed: 0, rejected: 0 },',
    '        history: [],',
    '      }',
    "    case ALGORITHMS.FIXED_WINDOW:",
    '      return {',
    '        algorithm,',
    '        config: { ...config },',
    '        windowStart: Math.floor(now / config.windowMs) * config.windowMs,',
    '        count: 0,',
    '        stats: { total: 0, allowed: 0, rejected: 0 },',
    '        history: [],',
    '      }',
    "    case ALGORITHMS.SLIDING_WINDOW_LOG:",
    '      return {',
    '        algorithm,',
    '        config: { ...config },',
    '        requests: [],',
    '        stats: { total: 0, allowed: 0, rejected: 0 },',
    '        history: [],',
    '      }',
    "    case ALGORITHMS.SLIDING_WINDOW_COUNTER:",
    '      return {',
    '        algorithm,',
    '        config: { ...config },',
    '        currentWindowStart: Math.floor(now / config.windowMs) * config.windowMs,',
    '        currentCount: 0,',
    '        previousCount: 0,',
    '        stats: { total: 0, allowed: 0, rejected: 0 },',
    '        history: [],',
    '      }',
    '  }',
    '}',
    '',
    'export function step(state, now = Date.now()) {',
    '  const { algorithm, config } = state',
    '  let allowed = false',
    '  let nextState = { ...state }',
    '',
    '  switch (algorithm) {',
    "    case ALGORITHMS.TOKEN_BUCKET: {",
    '      const elapsed = (now - state.lastRefill) / 1000',
    '      let tokens = Math.min(config.capacity, state.tokens + elapsed * config.refillRate)',
    '      if (tokens >= 1) {',
    '        tokens -= 1',
    '        allowed = true',
    '      }',
    '      nextState = { ...state, tokens, lastRefill: now }',
    '      break',
    '    }',
    "    case ALGORITHMS.LEAKY_BUCKET: {",
    '      const elapsed = (now - state.lastLeak) / 1000',
    '      let volume = Math.max(0, state.volume - elapsed * config.leakRate)',
    '      if (volume + 1 <= config.capacity) {',
    '        volume += 1',
    '        allowed = true',
    '      }',
    '      nextState = { ...state, volume, lastLeak: now }',
    '      break',
    '    }',
    "    case ALGORITHMS.FIXED_WINDOW: {",
    '      const start = Math.floor(now / config.windowMs) * config.windowMs',
    '      let count = start === state.windowStart ? state.count : 0',
    '      if (count < config.limit) {',
    '        count += 1',
    '        allowed = true',
    '      }',
    '      nextState = { ...state, windowStart: start, count }',
    '      break',
    '    }',
    "    case ALGORITHMS.SLIDING_WINDOW_LOG: {",
    '      const cutoff = now - config.windowMs',
    '      const requests = state.requests.filter((t) => t > cutoff)',
    '      if (requests.length < config.limit) {',
    '        requests.push(now)',
    '        allowed = true',
    '      }',
    '      nextState = { ...state, requests }',
    '      break',
    '    }',
    "    case ALGORITHMS.SLIDING_WINDOW_COUNTER: {",
    '      const start = Math.floor(now / config.windowMs) * config.windowMs',
    '      let { currentCount, previousCount, currentWindowStart } = state',
    '      if (start !== currentWindowStart) {',
    '        previousCount = currentCount',
    '        currentCount = 0,',
    '        currentWindowStart = start',
    '      }',
    '      const weightPrev = 1 - (now - start) / config.windowMs',
    '      const estimate = currentCount + previousCount * weightPrev',
    '      if (estimate < config.limit) {',
    '        currentCount += 1',
    '        allowed = true',
    '      }',
    '      nextState = { ...state, currentCount, previousCount, currentWindowStart }',
    '      break',
    '    }',
    '  }',
    '',
    '  const stats = {',
    '    ...nextState.stats,',
    '    total: nextState.stats.total + 1,',
    '    allowed: nextState.stats.allowed + (allowed ? 1 : 0),',
    '    rejected: nextState.stats.rejected + (allowed ? 0 : 1),',
    '  }',
    '',
    '  return { ...nextState, stats }',
    '}',
    '',
    '// Regras resumidas:',
    '// Token Bucket: permite bursts ate a capacidade; recarrega tokens ao longo do tempo.',
    '// Leaky Bucket: suaviza saida a uma taxa fixa; limita bursts pela capacidade.',
    '// Fixed Window: conta requisicoes por janela de tempo; pode causar spike na fronteira.',
    '// Sliding Window Log: guarda timestamps reais; preciso, mas consome memoria.',
    '// Sliding Window Counter: aproxima pesando a janela anterior; economico e suave.',
  ].join('\n')
}
