export const PRESETS = [
  {
    key: 'cpu-memory',
    label: { pt: 'CPU (%) → uso de memória (GB)', en: 'CPU (%) → memory usage (GB)' },
    points: [
      { x: 10, y: 1.2 },
      { x: 20, y: 1.8 },
      { x: 30, y: 2.5 },
      { x: 40, y: 3.1 },
      { x: 50, y: 3.8 },
      { x: 60, y: 4.4 },
      { x: 70, y: 5.0 },
      { x: 80, y: 5.7 },
    ],
  },
  {
    key: 'requests-latency',
    label: { pt: 'Requisições/s → latência (ms)', en: 'Requests/s → latency (ms)' },
    points: [
      { x: 100, y: 45 },
      { x: 200, y: 52 },
      { x: 300, y: 68 },
      { x: 400, y: 85 },
      { x: 500, y: 110 },
      { x: 600, y: 142 },
      { x: 700, y: 190 },
    ],
  },
  {
    key: 'experience-salary',
    label: { pt: 'Anos de experiência → salário (k)', en: 'Years of experience → salary (k)' },
    points: [
      { x: 0, y: 35 },
      { x: 1, y: 40 },
      { x: 2, y: 48 },
      { x: 3, y: 55 },
      { x: 4, y: 62 },
      { x: 5, y: 72 },
      { x: 6, y: 78 },
      { x: 7, y: 90 },
      { x: 8, y: 98 },
      { x: 10, y: 120 },
    ],
  },
  {
    key: 'study-grade',
    label: { pt: 'Horas de estudo → nota', en: 'Study hours → grade' },
    points: [
      { x: 1, y: 3.5 },
      { x: 2, y: 4.2 },
      { x: 3, y: 5.0 },
      { x: 4, y: 5.8 },
      { x: 5, y: 6.5 },
      { x: 6, y: 7.2 },
      { x: 7, y: 7.8 },
      { x: 8, y: 8.5 },
      { x: 9, y: 9.0 },
      { x: 10, y: 9.5 },
    ],
  },
  {
    key: 'temperature-icecream',
    label: { pt: 'Temperatura (°C) → vendas de sorvete', en: 'Temperature (°C) → ice cream sales' },
    points: [
      { x: 14, y: 12 },
      { x: 16, y: 18 },
      { x: 18, y: 25 },
      { x: 20, y: 30 },
      { x: 22, y: 38 },
      { x: 24, y: 45 },
      { x: 26, y: 52 },
      { x: 28, y: 60 },
      { x: 30, y: 68 },
    ],
  },
]

export function calculateRegression(points) {
  const valid = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  const n = valid.length
  if (n < 2) {
    return { ok: false, error: 'need-at-least-two-points' }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0
  for (const p of valid) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
    sumY2 += p.y * p.y
  }

  const meanX = sumX / n
  const meanY = sumY / n

  const ssxx = sumX2 - (sumX * sumX) / n
  const ssyy = sumY2 - (sumY * sumY) / n
  const ssxy = sumXY - (sumX * sumY) / n

  if (ssxx === 0) {
    return { ok: false, error: 'zero-variance-x' }
  }

  const slope = ssxy / ssxx
  const intercept = meanY - slope * meanX

  const predicted = valid.map((p) => {
    const yHat = slope * p.x + intercept
    return {
      x: p.x,
      y: p.y,
      yHat,
      residual: p.y - yHat,
    }
  })

  const ssResidual = predicted.reduce((acc, p) => acc + p.residual * p.residual, 0)
  const ssTotal = ssyy
  const rDenom = Math.sqrt(ssxx * ssyy)
  const r = rDenom === 0 ? 0 : ssxy / rDenom
  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal
  const stdError = Math.sqrt(ssResidual / Math.max(1, n - 2))
  const slopeStdError = Math.sqrt((stdError * stdError) / ssxx)
  const interceptStdError = stdError * Math.sqrt((1 / n) + (meanX * meanX) / ssxx)

  return {
    ok: true,
    n,
    sumX,
    sumY,
    sumXY,
    sumX2,
    sumY2,
    meanX,
    meanY,
    ssxx,
    ssyy,
    ssxy,
    slope,
    intercept,
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
    r,
    rSquared,
    correlation: r,
    stdError,
    slopeStdError,
    interceptStdError,
    predicted,
    ssResidual,
    ssTotal,
  }
}

export function predict(result, x) {
  if (!result.ok) return null
  return result.slope * x + result.intercept
}

export function formatNumber(n, digits = 4) {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs === 0) return '0'
  if (abs < 1e-6 || abs > 1e9) return n.toExponential(digits)
  return n.toFixed(digits)
}
