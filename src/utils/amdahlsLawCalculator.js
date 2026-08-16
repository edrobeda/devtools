/**
 * Calculadora da Lei de Amdahl — 100% client-side.
 *
 * A lei de Amdahl estima o ganho máximo de desempenho ao paralelizar uma
 * fração P de uma carga de trabalho em N processadores:
 *
 *   S(N) = 1 / ((1 - P) + P / N)
 *
 * O speedup teórico máximo (N → ∞) é 1 / (1 - P).
 */

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '∞'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function calculateAmdahl({ totalTime, parallelFraction, processors }) {
  const P = Math.max(0, Math.min(1, parallelFraction / 100))
  const N = Math.max(1, processors)
  const S = 1 - P

  const serialTime = totalTime * S
  const parallelTime = (totalTime * P) / N
  const newTime = serialTime + parallelTime
  const speedup = newTime > 0 ? totalTime / newTime : 0
  const maxSpeedup = S < 1 ? 1 / S : Infinity
  const efficiency = N > 0 ? speedup / N : 0

  return {
    totalTime,
    parallelFraction: P,
    serialFraction: S,
    processors: N,
    serialTime,
    parallelTime,
    newTime,
    speedup,
    maxSpeedup,
    efficiency,
    timeSaved: totalTime - newTime,
  }
}

export function getPresets(lang = 'pt') {
  const data = [
    {
      key: 'web-server',
      pt: { label: 'Servidor web', desc: '75% paralelizável, 8 cores' },
      en: { label: 'Web server', desc: '75% parallelizable, 8 cores' },
      totalTime: 100,
      parallelFraction: 75,
      processors: 8,
    },
    {
      key: 'video-render',
      pt: { label: 'Renderização de vídeo', desc: '95% paralelizável, 32 cores' },
      en: { label: 'Video rendering', desc: '95% parallelizable, 32 cores' },
      totalTime: 600,
      parallelFraction: 95,
      processors: 32,
    },
    {
      key: 'parallel-build',
      pt: { label: 'Build paralelo', desc: '60% paralelizável, 16 threads' },
      en: { label: 'Parallel build', desc: '60% parallelizable, 16 threads' },
      totalTime: 180,
      parallelFraction: 60,
      processors: 16,
    },
    {
      key: 'scientific-simulation',
      pt: { label: 'Simulação científica', desc: '90% paralelizável, 64 nós' },
      en: { label: 'Scientific simulation', desc: '90% parallelizable, 64 nodes' },
      totalTime: 3600,
      parallelFraction: 90,
      processors: 64,
    },
    {
      key: 'database-query',
      pt: { label: 'Query de banco', desc: '50% paralelizável, 4 cores' },
      en: { label: 'Database query', desc: '50% parallelizable, 4 cores' },
      totalTime: 30,
      parallelFraction: 50,
      processors: 4,
    },
  ]

  return data.map((item) => ({
    key: item.key,
    label: item[lang].label,
    desc: item[lang].desc,
    totalTime: item.totalTime,
    parallelFraction: item.parallelFraction,
    processors: item.processors,
  }))
}

export function buildSpeedupTable({ totalTime, parallelFraction, maxProcessors = 128 }) {
  const P = Math.max(0, Math.min(1, parallelFraction / 100))
  const S = 1 - P
  const steps = [1, 2, 4, 8, 16, 32, 64, 128].filter((n) => n <= Math.max(8, maxProcessors))

  return steps.map((processors) => {
    const newTime = totalTime * (S + P / processors)
    const speedup = newTime > 0 ? totalTime / newTime : 0
    const efficiency = speedup / processors
    return {
      processors,
      newTime,
      speedup,
      efficiency,
    }
  })
}

export function buildChartPoints({ totalTime, parallelFraction, maxProcessors = 64, points = 40 }) {
  const P = Math.max(0, Math.min(1, parallelFraction / 100))
  const S = 1 - P
  const result = []
  for (let i = 0; i <= points; i++) {
    const processors = Math.max(1, Math.round(1 + (maxProcessors - 1) * (i / points)))
    const newTime = totalTime * (S + P / processors)
    const speedup = newTime > 0 ? totalTime / newTime : 0
    result.push({ processors, speedup })
  }
  return result
}
