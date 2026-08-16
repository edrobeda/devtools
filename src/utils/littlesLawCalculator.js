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
 */

export function solveLittleLaw({ l, lambda, w }) {
  const L = l === undefined || l === null || Number.isNaN(l) ? null : Number(l)
  const Lambda =
    lambda === undefined || lambda === null || Number.isNaN(lambda)
      ? null
      : Number(lambda)
  const W =
    w === undefined || w === null || Number.isNaN(w) ? null : Number(w)

  const known = [L, Lambda, W].filter((v) => v !== null).length

  if (known < 2) {
    return {
      l: L,
      lambda: Lambda,
      w: W,
      solved: false,
      missing: 3 - known,
    }
  }

  if (known === 3) {
    // Se os três foram informados, valida a consistência.
    const expectedL = Lambda * W
    const relativeError = expectedL === 0 ? Math.abs(L) : Math.abs((L - expectedL) / expectedL)
    return {
      l: L,
      lambda: Lambda,
      w: W,
      solved: true,
      consistent: relativeError < 1e-6,
      relativeError,
    }
  }

  if (L === null) {
    return {
      l: Lambda * W,
      lambda: Lambda,
      w: W,
      solved: true,
    }
  }

  if (Lambda === null) {
    if (W === 0) {
      return {
        l: L,
        lambda: null,
        w: W,
        solved: false,
        error: 'W cannot be zero when solving for λ.',
      }
    }
    return {
      l: L,
      lambda: L / W,
      w: W,
      solved: true,
    }
  }

  // W === null
  if (Lambda === 0) {
    return {
      l: L,
      lambda: Lambda,
      w: null,
      solved: false,
      error: 'λ cannot be zero when solving for W.',
    }
  }
  return {
    l: L,
    lambda: Lambda,
    w: L / Lambda,
    solved: true,
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
    },
    en: {
      api: 'Average web API',
      support: 'Support queue',
      supermarket: 'Supermarket',
      dbPool: 'Connection pool',
      highway: 'Highway traffic',
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
      desc: {
        pt: '60 carros/min, 600 carros na rodovia, viagem de 10 min.',
        en: '60 cars/min, 600 cars on the highway, 10 min trip.',
      },
    },
  ]
}
