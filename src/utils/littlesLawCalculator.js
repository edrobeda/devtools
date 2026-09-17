/**
 * Calculadora da Lei de Little (L = λ × W).
 *
 * L  = número médio de itens no sistema (em fila + em atendimento)
 * λ  = taxa média de chegada (itens / unidade de tempo)
 * W  = tempo médio de permanência no sistema (unidade de tempo)
 *
 * A lei é válida para sistemas estáveis (taxa de chegada <= taxa de
 * atendimento, em média) e independente da distribuição de chegadas ou
 * tempos de serviço — por isso é tão útil para estimar capacidade de
 * filas, bancos de dados, APIs, supermercados, call centers etc.
 *
 * Modo concorrência (opcional): quando `thinkTime` (T) é informado, cada
 * item — ex.: um usuário web — gera uma requisição a cada ciclo composto
 * por resposta (W) + tempo de "pensamento" (T), e o modelo vira
 * λ = L / (W + T). Nesse modo L passa a ser usuários concorrentes, W o
 * tempo médio de resposta e T o think time. Com T = 0 tudo se reduz à
 * Lei de Little clássica. O retorno inclui métricas derivadas: ciclo por
 * requisição (W + T), utilização (W / (W + T)) e duração da sessão
 * (requestsPerUser × ciclo).
 */

function parse(value) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

export function solveLittleLaw({ l, lambda, w, thinkTime = 0, requestsPerUser = 1 }) {
  const L = parse(l)
  const Lambda = parse(lambda)
  const W = parse(w)
  const T = parse(thinkTime) || 0
  const R = parse(requestsPerUser) || 1

  const known = [L, Lambda, W].filter((v) => v !== null).length

  const derive = (l, lambda, w) => {
    const cycleTime = w + T
    return {
      cycleTime,
      utilization: cycleTime > 0 ? w / cycleTime : 0,
      sessionDuration: R * cycleTime,
    }
  }

  if (known < 2) {
    return {
      l: L,
      lambda: Lambda,
      w: W,
      thinkTime: T,
      requestsPerUser: R,
      solved: false,
      missing: 3 - known,
    }
  }

  if (known === 3) {
    // Se os três foram informados, valida a consistência.
    const expectedL = Lambda * (W + T)
    const relativeError = expectedL === 0 ? Math.abs(L) : Math.abs((L - expectedL) / expectedL)
    return {
      l: L,
      lambda: Lambda,
      w: W,
      thinkTime: T,
      requestsPerUser: R,
      solved: true,
      consistent: relativeError < 1e-6,
      relativeError,
      ...derive(L, Lambda, W),
    }
  }

  if (L === null) {
    const resultL = Lambda * (W + T)
    return {
      l: resultL,
      lambda: Lambda,
      w: W,
      thinkTime: T,
      requestsPerUser: R,
      solved: true,
      ...derive(resultL, Lambda, W),
    }
  }

  if (Lambda === null) {
    const cycle = W + T
    if (cycle <= 0) {
      return {
        l: L,
        lambda: null,
        w: W,
        thinkTime: T,
        requestsPerUser: R,
        solved: false,
        error: 'cycleTimeZero',
      }
    }
    const resultLambda = L / cycle
    return {
      l: L,
      lambda: resultLambda,
      w: W,
      thinkTime: T,
      requestsPerUser: R,
      solved: true,
      ...derive(L, resultLambda, W),
    }
  }

  // W === null
  if (Lambda <= 0) {
    return {
      l: L,
      lambda: Lambda,
      w: null,
      thinkTime: T,
      requestsPerUser: R,
      solved: false,
      error: 'lambdaZero',
    }
  }
  const rawW = L / Lambda - T
  const warnings = rawW < 0 ? ['negativeResidenceTime'] : []
  const resultW = Math.max(0, rawW)
  return {
    l: L,
    lambda: Lambda,
    w: resultW,
    thinkTime: T,
    requestsPerUser: R,
    solved: true,
    warnings,
    ...derive(L, Lambda, resultW),
  }
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

export function getPresets(lang = 'pt') {
  const labels = {
    pt: {
      api: 'API web média',
      support: 'Fila de suporte',
      supermarket: 'Supermercado',
      dbPool: 'Pool de conexões',
      highway: 'Rodovia (trânsito)',
      apiSmall: 'API pequena',
      apiHeavy: 'API sob carga',
      ecommerce: 'Checkout e-commerce',
      streaming: 'Streaming/HLS',
      chat: 'Servidor de chat',
      worker: 'Worker em lote',
    },
    en: {
      api: 'Average web API',
      support: 'Support queue',
      supermarket: 'Supermarket',
      dbPool: 'Connection pool',
      highway: 'Highway traffic',
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
      key: 'api',
      label: l.api,
      l: 50,
      lambda: 100,
      w: 0.5,
      unit: 's',
      thinkTime: 0,
      requestsPerUser: 1,
      desc: {
        pt: '100 req/s, 50 requisições em voo, latência média 0,5 s.',
        en: '100 req/s, 50 in-flight requests, 0.5 s average latency.',
      },
    },
    {
      key: 'support',
      label: l.support,
      l: 12,
      lambda: 4,
      w: 3,
      unit: 'h',
      thinkTime: 0,
      requestsPerUser: 1,
      desc: {
        pt: '4 tickets/hora, 12 tickets em aberto, tempo médio de 3 h.',
        en: '4 tickets/hour, 12 open tickets, 3 h average time.',
      },
    },
    {
      key: 'supermarket',
      label: l.supermarket,
      l: 8,
      lambda: 30,
      w: 0.267,
      unit: 'min',
      thinkTime: 0,
      requestsPerUser: 1,
      desc: {
        pt: '30 clientes/min, 8 na fila/caixa, 16 s no sistema.',
        en: '30 customers/min, 8 in queue/register, 16 s in the system.',
      },
    },
    {
      key: 'dbPool',
      label: l.dbPool,
      l: 20,
      lambda: 200,
      w: 0.1,
      unit: 's',
      thinkTime: 0,
      requestsPerUser: 1,
      desc: {
        pt: '200 consultas/s, 20 conexões ocupadas, 100 ms médios.',
        en: '200 queries/s, 20 busy connections, 100 ms average.',
      },
    },
    {
      key: 'highway',
      label: l.highway,
      l: 600,
      lambda: 60,
      w: 10,
      unit: 'min',
      thinkTime: 0,
      requestsPerUser: 1,
      desc: {
        pt: '60 carros/min, 600 carros na rodovia, viagem de 10 min.',
        en: '60 cars/min, 600 cars on the highway, 10 min trip.',
      },
    },
    {
      key: 'apiSmall',
      label: l.apiSmall,
      l: 50,
      lambda: null,
      w: 0.2,
      unit: 's',
      thinkTime: 0,
      requestsPerUser: 10,
      desc: {
        pt: '50 usuários concorrentes, 200 ms de resposta, sem think time. Throughput ≈ 250 req/s.',
        en: '50 concurrent users, 200 ms response time, no think time. Throughput ≈ 250 req/s.',
      },
    },
    {
      key: 'apiHeavy',
      label: l.apiHeavy,
      l: null,
      lambda: 1000,
      w: 0.15,
      unit: 's',
      thinkTime: 0.05,
      requestsPerUser: 20,
      desc: {
        pt: 'Alvo de 1.000 req/s, 150 ms de resposta + 50 ms de think time. Precisa de ~200 usuários concorrentes.',
        en: 'Target 1,000 req/s, 150 ms response + 50 ms think time. Needs ~200 concurrent users.',
      },
    },
    {
      key: 'ecommerce',
      label: l.ecommerce,
      l: 500,
      lambda: null,
      w: 0.8,
      unit: 's',
      thinkTime: 3,
      requestsPerUser: 8,
      desc: {
        pt: '500 usuários no checkout, 800 ms de resposta, 3 s de think time. Throughput ≈ 132 req/s.',
        en: '500 users in checkout, 800 ms response, 3 s think time. Throughput ≈ 132 req/s.',
      },
    },
    {
      key: 'streaming',
      label: l.streaming,
      l: 2000,
      lambda: null,
      w: 0.12,
      unit: 's',
      thinkTime: 4,
      requestsPerUser: 120,
      desc: {
        pt: '2.000 espectadores, requisição a cada 4 s, 120 ms de resposta. Throughput ≈ 488 req/s.',
        en: '2,000 viewers, one request every 4 s, 120 ms response. Throughput ≈ 488 req/s.',
      },
    },
    {
      key: 'chat',
      label: l.chat,
      l: 10000,
      lambda: null,
      w: 0.05,
      unit: 's',
      thinkTime: 5,
      requestsPerUser: 60,
      desc: {
        pt: '10.000 usuários de chat, 50 ms de resposta, 5 s entre mensagens. Throughput ≈ 1.980 req/s.',
        en: '10,000 chat users, 50 ms response, 5 s between messages. Throughput ≈ 1,980 req/s.',
      },
    },
    {
      key: 'worker',
      label: l.worker,
      l: 20,
      lambda: null,
      w: 5,
      unit: 's',
      thinkTime: 0,
      requestsPerUser: 100,
      desc: {
        pt: '20 workers, 5 s por tarefa, sem think time. Throughput = 4 tarefas/s (14.400/hora).',
        en: '20 workers, 5 s per task, no think time. Throughput = 4 tasks/s (14,400/hour).',
      },
    },
  ]
}