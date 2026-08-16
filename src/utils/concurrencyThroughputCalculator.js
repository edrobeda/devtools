/**
 * Calculadora de Concorrência & Throughput para APIs e aplicações web.
 *
 * Modelo: um usuário concorrente gera uma requisição, espera o tempo de
 * resposta (W) e depois "pensa" por um tempo antes da próxima requisição.
 * Portanto, cada usuário consome (responseTime + thinkTime) por requisição.
 *
 * Fórmulas:
 *   throughput = concurrentUsers / (responseTime + thinkTime)
 *   concurrentUsers = throughput * (responseTime + thinkTime)
 *   maxResponseTime = (concurrentUsers / throughput) - thinkTime
 *   sessionDuration = requestsPerUser * (responseTime + thinkTime)
 *
 * A calculadora também usa a Lei de Little para mostrar a equivalência
 * L = λ × W quando não há think time.
 */

const MS_PER_UNIT = {
  ms: 1,
  s: 1000,
  min: 60 * 1000,
  h: 3600 * 1000,
}

const RPS_PER_UNIT = {
  rps: 1,
  rpm: 1 / 60,
  rph: 1 / 3600,
  rpd: 1 / 86400,
}

export function toMs(value, unit) {
  const v = Number(value)
  if (!Number.isFinite(v)) return null
  return v * (MS_PER_UNIT[unit] || 1)
}

export function fromMs(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return value / (MS_PER_UNIT[unit] || 1)
}

export function toRps(value, unit) {
  const v = Number(value)
  if (!Number.isFinite(v)) return null
  return v * (RPS_PER_UNIT[unit] || 1)
}

export function fromRps(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return value / (RPS_PER_UNIT[unit] || 1)
}

export function formatNumber(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (!Number.isFinite(value)) return '∞'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs < 0.0001 || abs >= 1_000_000) {
    return value.toExponential(digits)
  }
  const fixed = value.toFixed(digits)
  return fixed.replace(/\.?0+$/, '')
}

function parseInput(value) {
  if (value === '' || value === undefined || value === null) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

/**
 * Resolve o modelo de throughput com base nos campos preenchidos.
 *
 * @param {Object} params
 * @param {number|null} params.concurrentUsers — usuários/requests concorrentes
 * @param {number|null} params.throughput — taxa de requisições (na unidade de throughput)
 * @param {number|null} params.responseTimeMs — tempo médio de resposta em ms
 * @param {number|null} params.thinkTimeMs — think time em ms
 * @param {number|null} params.requestsPerUser — requisições por usuário por sessão
 */
export function solveConcurrencyThroughput({
  concurrentUsers,
  throughput,
  responseTimeMs,
  thinkTimeMs,
  requestsPerUser,
}) {
  const N = parseInput(concurrentUsers)
  const lambda = parseInput(throughput)
  const W = parseInput(responseTimeMs)
  const T = parseInput(thinkTimeMs) || 0
  const R = parseInput(requestsPerUser) || 1

  const known = [N, lambda, W].filter((v) => v !== null).length

  if (known < 2) {
    return {
      solved: false,
      missing: 3 - known,
      message: 'needTwo',
      inputs: { N, lambda, W, T, R },
    }
  }

  let resultN = N
  let resultLambda = lambda
  let resultW = W
  let warnings = []

  if (N === null) {
    // λ = N / (W + T)  →  N = λ * (W + T)
    resultN = lambda * (W + T)
  } else if (lambda === null) {
    // λ = N / (W + T)
    const denom = W + T
    if (denom <= 0) {
      return {
        solved: false,
        error: 'denominatorZero',
        inputs: { N, lambda, W, T, R },
      }
    }
    resultLambda = N / denom
  } else if (W === null) {
    // W = N / λ - T
    if (lambda <= 0) {
      return {
        solved: false,
        error: 'throughputZero',
        inputs: { N, lambda, W, T, R },
      }
    }
    resultW = N / lambda - T
    if (resultW < 0) {
      warnings.push('negativeResponseTime')
      resultW = 0
    }
  }

  const cycleMs = resultW + T
  const sessionMs = R * cycleMs

  // Verifica consistência quando os 3 estão presentes (ou foram calculados)
  const expectedN = resultLambda * cycleMs
  const relativeError = expectedN === 0 ? Math.abs(resultN) : Math.abs((resultN - expectedN) / expectedN)

  // Utilização aproximada: fração do tempo do usuário ocupado em resposta
  const utilization = cycleMs > 0 ? resultW / cycleMs : 0

  return {
    solved: true,
    inputs: { N: resultN, lambda: resultLambda, W: resultW, T, R },
    results: {
      concurrentUsers: resultN,
      throughputRps: resultLambda,
      responseTimeMs: resultW,
      thinkTimeMs: T,
      requestsPerUser: R,
      cycleMs,
      sessionMs,
      utilization,
      consistent: relativeError < 1e-6,
      relativeError,
    },
    warnings,
  }
}

export function getPresets(lang = 'pt') {
  const labels = {
    pt: {
      apiSmall: 'API pequena',
      apiHeavy: 'API sob carga',
      ecommerce: 'Checkout e-commerce',
      streaming: 'Streaming/HLS',
      chat: 'Servidor de chat',
      worker: 'Worker em lote',
    },
    en: {
      apiSmall: 'Small API',
      apiHeavy: 'API under load',
      ecommerce: 'E-commerce checkout',
      streaming: 'Streaming/HLS',
      chat: 'Chat server',
      worker: 'Batch worker',
    },
  }

  const l = labels[lang] || labels.en

  return [
    {
      key: 'apiSmall',
      label: l.apiSmall,
      concurrentUsers: 50,
      throughput: null,
      throughputUnit: 'rps',
      responseTime: 200,
      responseTimeUnit: 'ms',
      thinkTime: 0,
      thinkTimeUnit: 'ms',
      requestsPerUser: 10,
      desc: {
        pt: '50 usuários concorrentes, 200 ms de resposta, sem think time. Throughput ≈ 250 req/s.',
        en: '50 concurrent users, 200 ms response time, no think time. Throughput ≈ 250 req/s.',
      },
    },
    {
      key: 'apiHeavy',
      label: l.apiHeavy,
      concurrentUsers: null,
      throughput: 1000,
      throughputUnit: 'rps',
      responseTime: 150,
      responseTimeUnit: 'ms',
      thinkTime: 50,
      thinkTimeUnit: 'ms',
      requestsPerUser: 20,
      desc: {
        pt: 'Alvo de 1.000 req/s, 150 ms de resposta + 50 ms de think time. Precisa de ~200 usuários concorrentes.',
        en: 'Target 1,000 req/s, 150 ms response + 50 ms think time. Needs ~200 concurrent users.',
      },
    },
    {
      key: 'ecommerce',
      label: l.ecommerce,
      concurrentUsers: 500,
      throughput: null,
      throughputUnit: 'rps',
      responseTime: 800,
      responseTimeUnit: 'ms',
      thinkTime: 3000,
      thinkTimeUnit: 'ms',
      requestsPerUser: 8,
      desc: {
        pt: '500 usuários no checkout, 800 ms de resposta, 3 s de think time. Throughput ≈ 132 req/s.',
        en: '500 users in checkout, 800 ms response, 3 s think time. Throughput ≈ 132 req/s.',
      },
    },
    {
      key: 'streaming',
      label: l.streaming,
      concurrentUsers: 2000,
      throughput: null,
      throughputUnit: 'rps',
      responseTime: 120,
      responseTimeUnit: 'ms',
      thinkTime: 4000,
      thinkTimeUnit: 'ms',
      requestsPerUser: 120,
      desc: {
        pt: '2.000 espectadores, requisição a cada 4 s, 120 ms de resposta. Throughput ≈ 488 req/s.',
        en: '2,000 viewers, one request every 4 s, 120 ms response. Throughput ≈ 488 req/s.',
      },
    },
    {
      key: 'chat',
      label: l.chat,
      concurrentUsers: 10000,
      throughput: null,
      throughputUnit: 'rps',
      responseTime: 50,
      responseTimeUnit: 'ms',
      thinkTime: 5000,
      thinkTimeUnit: 'ms',
      requestsPerUser: 60,
      desc: {
        pt: '10.000 usuários de chat, 50 ms de resposta, 5 s entre mensagens. Throughput ≈ 1.980 req/s.',
        en: '10,000 chat users, 50 ms response, 5 s between messages. Throughput ≈ 1,980 req/s.',
      },
    },
    {
      key: 'worker',
      label: l.worker,
      concurrentUsers: 20,
      throughput: null,
      throughputUnit: 'rps',
      responseTime: 5,
      responseTimeUnit: 's',
      thinkTime: 0,
      thinkTimeUnit: 'ms',
      requestsPerUser: 100,
      desc: {
        pt: '20 workers, 5 s por tarefa, sem think time. Throughput = 4 tarefas/s (14.400/hora).',
        en: '20 workers, 5 s per task, no think time. Throughput = 4 tasks/s (14,400/hour).',
      },
    },
  ]
}
