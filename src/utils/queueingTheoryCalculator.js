/**
 * Queueing Theory Calculator
 * Cálculos clássicos de filas: M/M/1, M/M/c e M/D/1.
 * 100% client-side, sem dependências externas.
 */

export const MODELS = {
  MM1: 'mm1',
  MMc: 'mmc',
  MD1: 'md1',
}

export const MODEL_LABELS = {
  [MODELS.MM1]: { pt: 'M/M/1 (um servidor)', en: 'M/M/1 (single server)' },
  [MODELS.MMc]: { pt: 'M/M/c (múltiplos servidores)', en: 'M/M/c (multiple servers)' },
  [MODELS.MD1]: { pt: 'M/D/1 (serviço determinístico)', en: 'M/D/1 (deterministic service)' },
}

export const PRESETS = {
  [MODELS.MM1]: [
    {
      key: 'api-small',
      label: { pt: 'API pequena', en: 'Small API' },
      lambda: 10,
      mu: 12,
      servers: 1,
    },
    {
      key: 'api-overload',
      label: { pt: 'API sob carga', en: 'API under load' },
      lambda: 95,
      mu: 100,
      servers: 1,
    },
    {
      key: 'coffee-shop',
      label: { pt: 'Cafeteria', en: 'Coffee shop' },
      lambda: 30,
      mu: 35,
      servers: 1,
    },
  ],
  [MODELS.MMc]: [
    {
      key: 'call-center',
      label: { pt: 'Call center', en: 'Call center' },
      lambda: 120,
      mu: 30,
      servers: 5,
    },
    {
      key: 'web-pool',
      label: { pt: 'Pool de workers web', en: 'Web worker pool' },
      lambda: 300,
      mu: 50,
      servers: 8,
    },
    {
      key: 'supermarket',
      label: { pt: 'Supermercado (caixas)', en: 'Supermarket (checkouts)' },
      lambda: 60,
      mu: 15,
      servers: 6,
    },
  ],
  [MODELS.MD1]: [
    {
      key: 'assembly-line',
      label: { pt: 'Esteira de produção', en: 'Assembly line' },
      lambda: 8,
      mu: 10,
      servers: 1,
    },
    {
      key: 'atm',
      label: { pt: 'Caixa eletrônico', en: 'ATM' },
      lambda: 25,
      mu: 30,
      servers: 1,
    },
    {
      key: 'ticket-gate',
      label: { pt: 'Catraca de acesso', en: 'Ticket gate' },
      lambda: 45,
      mu: 50,
      servers: 1,
    },
  ],
}

function factorial(n) {
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

function round(value, decimals = 4) {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function formatTime(seconds) {
  if (seconds >= 60) return `${round(seconds / 60, 2)} min`
  if (seconds >= 1) return `${round(seconds, 4)} s`
  if (seconds >= 0.001) return `${round(seconds * 1000, 2)} ms`
  return `${round(seconds * 1_000_000, 2)} µs`
}

export function calculateQueueing({ model, lambda, mu, servers = 1 }) {
  const l = Number(lambda)
  const m = Number(mu)
  const c = Math.max(1, Math.floor(Number(servers)))

  const errors = []

  if (!Number.isFinite(l) || l <= 0) errors.push({ field: 'lambda', message: 'lambda > 0' })
  if (!Number.isFinite(m) || m <= 0) errors.push({ field: 'mu', message: 'mu > 0' })
  if (model === MODELS.MMc && (!Number.isFinite(c) || c < 1)) {
    errors.push({ field: 'servers', message: 'servers >= 1' })
  }

  if (errors.length > 0) return { ok: false, errors }

  const rho = model === MODELS.MMc ? l / (c * m) : l / m

  if (rho >= 1) {
    return {
      ok: false,
      unstable: true,
      rho: round(rho, 4),
      errors: [{ field: 'rho', message: 'rho >= 1 (sistema instável)' }],
    }
  }

  let P0 = 0
  let Pw = 0
  let Lq = 0
  let L = 0
  let Wq = 0
  let W = 0

  if (model === MODELS.MM1) {
    P0 = 1 - rho
    Lq = (rho ** 2) / (1 - rho)
    L = rho / (1 - rho)
    Wq = Lq / l
    W = Wq + 1 / m
    Pw = rho // em M/M/1, probabilidade de esperar = rho
  } else if (model === MODELS.MMc) {
    // P0 para M/M/c
    let sum = 0
    const a = l / m // intensidade de tráfego oferecida em erlangs
    for (let n = 0; n < c; n++) {
      sum += (a ** n) / factorial(n)
    }
    const lastTerm = (a ** c) / (factorial(c) * (1 - rho))
    P0 = 1 / (sum + lastTerm)

    // Erlang C: probabilidade de um cliente ter de esperar na fila
    Pw = lastTerm * P0
    Lq = Pw * (rho / (1 - rho))
    L = Lq + a
    Wq = Lq / l
    W = Wq + 1 / m
  } else if (model === MODELS.MD1) {
    P0 = 1 - rho
    Lq = (rho ** 2) / (2 * (1 - rho))
    L = rho + Lq
    Wq = Lq / l
    W = Wq + 1 / m
    Pw = 0 // M/D/1 sempre tem fila quando rho > 0, mas não há fórmula Erlang C simples
  }

  return {
    ok: true,
    model,
    lambda: l,
    mu: m,
    servers: c,
    rho: round(rho, 4),
    rhoPercent: round(rho * 100, 2),
    P0: round(P0, 6),
    Pw: round(Pw, 6),
    L: round(L, 4),
    Lq: round(Lq, 4),
    W: round(W, 6),
    Wq: round(Wq, 6),
    Wformatted: formatTime(W),
    WqFormatted: formatTime(Wq),
    idleProbability: round(P0 * 100, 2),
    waitProbability: round(Pw * 100, 2),
    throughput: round(l, 4),
    capacityUtilization: round(rho * 100, 2),
  }
}

export function buildSummary(result, lang = 'pt') {
  if (!result.ok) return ''
  const t = {
    pt: `Com λ=${result.lambda} chegadas/s e μ=${result.mu} atendimentos/s`,
    en: `With λ=${result.lambda} arrivals/s and μ=${result.mu} services/s`,
  }
  return t[lang]
}

// Fórmulas exibidas na página para referência
export const FORMULAS = {
  mm1: `/* M/M/1 */
ρ = λ / μ
P0 = 1 - ρ
L = ρ / (1 - ρ)
Lq = ρ² / (1 - ρ)
W = 1 / (μ - λ)
Wq = λ / (μ(μ - λ))`,
  mmc: `/* M/M/c */
ρ = λ / (c·μ)
P0 = [ Σ_{n=0}^{c-1} (aⁿ/n!) + aᶜ/(c!(1-ρ)) ]⁻¹,  a = λ/μ
Pw = P0 · aᶜ / (c!(1-ρ))   /* Erlang C */
Lq = Pw · ρ / (1 - ρ)
L = Lq + a
Wq = Lq / λ
W = Wq + 1/μ`,
  md1: `/* M/D/1 */
ρ = λ / μ
P0 = 1 - ρ
Lq = ρ² / (2(1 - ρ))
L = ρ + Lq
Wq = Lq / λ
W = Wq + 1/μ`,
}
