/**
 * Calculadora de Hit Ratio / Latência Efetiva de Cache — 100% client-side.
 *
 * Dadas a latência de hit, a latência de miss e a taxa de acerto, calcula a
 * latência média efetiva de uma camada de cache:
 *
 *   L_eff = h × L_hit + (1 − h) × L_miss
 *
 * Também calcula o speedup em relação a não ter cache, a economia percentual
 * e o hit rate mínimo necessário para atingir uma latência-alvo.
 */

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '∞'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function calculateCacheHitRatio({
  hitLatency,
  missLatency,
  hitRate,
  targetLatency,
}) {
  const hit = Math.max(0, hitLatency)
  const miss = Math.max(0, missLatency)
  const h = Math.max(0, Math.min(1, (hitRate ?? 0) / 100))
  const target = targetLatency ?? null

  const avgLatency = h * hit + (1 - h) * miss
  const speedup = avgLatency > 0 ? miss / avgLatency : 0
  const savings = miss > 0 ? ((miss - avgLatency) / miss) * 100 : 0
  const missRate = (1 - h) * 100

  let minHitRate = null
  if (target !== null && Number.isFinite(target)) {
    if (target >= miss) {
      minHitRate = 0
    } else if (target <= hit) {
      minHitRate = 1
    } else if (miss !== hit) {
      minHitRate = (target - miss) / (hit - miss)
    } else {
      minHitRate = target <= avgLatency ? 0 : 1
    }
    minHitRate = Math.max(0, Math.min(1, minHitRate))
  }

  return {
    hitLatency: hit,
    missLatency: miss,
    hitRate: h,
    missRate,
    avgLatency,
    speedup,
    savings,
    targetLatency: target,
    minHitRate: minHitRate === null ? null : minHitRate * 100,
    isTargetMet: minHitRate !== null ? h >= minHitRate : null,
  }
}

export function getPresets(lang = 'pt') {
  const data = [
    {
      key: 'api-redis',
      pt: { label: 'API com Redis', desc: 'Hit 2 ms, miss 80 ms, 95% acerto' },
      en: { label: 'API with Redis', desc: '2 ms hit, 80 ms miss, 95% hit rate' },
      hitLatency: 2,
      missLatency: 80,
      hitRate: 95,
      targetLatency: 10,
    },
    {
      key: 'cdn-images',
      pt: { label: 'CDN de imagens', desc: 'Hit 20 ms, miss 250 ms, 90% acerto' },
      en: { label: 'Image CDN', desc: '20 ms hit, 250 ms miss, 90% hit rate' },
      hitLatency: 20,
      missLatency: 250,
      hitRate: 90,
      targetLatency: 50,
    },
    {
      key: 'query-cache',
      pt: { label: 'Query cache de banco', desc: 'Hit 1 ms, miss 40 ms, 85% acerto' },
      en: { label: 'Database query cache', desc: '1 ms hit, 40 ms miss, 85% hit rate' },
      hitLatency: 1,
      missLatency: 40,
      hitRate: 85,
      targetLatency: 8,
    },
    {
      key: 'edge-cache',
      pt: { label: 'Edge cache', desc: 'Hit 5 ms, miss 300 ms, 92% acerto' },
      en: { label: 'Edge cache', desc: '5 ms hit, 300 ms miss, 92% hit rate' },
      hitLatency: 5,
      missLatency: 300,
      hitRate: 92,
      targetLatency: 40,
    },
    {
      key: 'session-memcached',
      pt: { label: 'Sessões em Memcached', desc: 'Hit 0,5 ms, miss 15 ms, 99% acerto' },
      en: { label: 'Memcached sessions', desc: '0.5 ms hit, 15 ms miss, 99% hit rate' },
      hitLatency: 0.5,
      missLatency: 15,
      hitRate: 99,
      targetLatency: 2,
    },
  ]

  return data.map((item) => ({
    key: item.key,
    label: item[lang].label,
    desc: item[lang].desc,
    hitLatency: item.hitLatency,
    missLatency: item.missLatency,
    hitRate: item.hitRate,
    targetLatency: item.targetLatency,
  }))
}

export function buildTable({ hitLatency, missLatency }) {
  const rates = [0, 25, 50, 75, 90, 95, 99]
  return rates.map((rate) => {
    const r = calculateCacheHitRatio({
      hitLatency,
      missLatency,
      hitRate: rate,
      targetLatency: null,
    })
    return {
      hitRate: rate,
      avgLatency: r.avgLatency,
      speedup: r.speedup,
      savings: r.savings,
    }
  })
}

export function buildChartPoints({ hitLatency, missLatency, points = 50 }) {
  const result = []
  for (let i = 0; i <= points; i++) {
    const hitRate = (i / points) * 100
    const r = calculateCacheHitRatio({
      hitLatency,
      missLatency,
      hitRate,
      targetLatency: null,
    })
    result.push({ hitRate, avgLatency: r.avgLatency })
  }
  return result
}

export function buildReport(result, lang = 'pt') {
  const t = {
    pt: {
      title: 'Relatório de Hit Ratio de Cache',
      summary: 'Resumo',
      hitLatency: 'Latência de hit',
      missLatency: 'Latência de miss',
      hitRate: 'Hit rate',
      avgLatency: 'Latência média efetiva',
      speedup: 'Speedup vs sempre miss',
      savings: 'Economia',
      target: 'Latência-alvo',
      minHitRate: 'Hit rate mínimo para o alvo',
      targetMet: 'Alvo atingido',
      yes: 'Sim',
      no: 'Não',
      ms: 'ms',
      formula: 'Fórmula',
      formulaText:
        'L_eff = h × L_hit + (1 − h) × L_miss',
    },
    en: {
      title: 'Cache Hit Ratio Report',
      summary: 'Summary',
      hitLatency: 'Hit latency',
      missLatency: 'Miss latency',
      hitRate: 'Hit rate',
      avgLatency: 'Effective average latency',
      speedup: 'Speedup vs always miss',
      savings: 'Savings',
      target: 'Target latency',
      minHitRate: 'Minimum hit rate for target',
      targetMet: 'Target met',
      yes: 'Yes',
      no: 'No',
      ms: 'ms',
      formula: 'Formula',
      formulaText:
        'L_eff = h × L_hit + (1 − h) × L_miss',
    },
  }[lang]

  const lines = [
    `# ${t.title}`,
    '',
    `## ${t.summary}`,
    '',
    `- ${t.hitLatency}: ${formatNumber(result.hitLatency, 2)} ${t.ms}`,
    `- ${t.missLatency}: ${formatNumber(result.missLatency, 2)} ${t.ms}`,
    `- ${t.hitRate}: ${formatNumber(result.hitRate * 100, 2)}%`,
    `- ${t.avgLatency}: ${formatNumber(result.avgLatency, 2)} ${t.ms}`,
    `- ${t.speedup}: ${formatNumber(result.speedup, 2)}×`,
    `- ${t.savings}: ${formatNumber(result.savings, 2)}%`,
  ]

  if (result.targetLatency !== null) {
    lines.push(
      `- ${t.target}: ${formatNumber(result.targetLatency, 2)} ${t.ms}`,
      `- ${t.minHitRate}: ${formatNumber(result.minHitRate, 2)}%`,
      `- ${t.targetMet}: ${result.isTargetMet ? t.yes : t.no}`
    )
  }

  lines.push(
    '',
    `## ${t.formula}`,
    '',
    t.formulaText
  )

  return lines.join('\n')
}
