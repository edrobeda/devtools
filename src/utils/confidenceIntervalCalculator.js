// Motor de cálculo de intervalo de confiança e tamanho amostral — 100% client-side.
// Usa aproximação normal (Z) para médias e proporções. Nenhum dado sai do navegador.

export const CONFIDENCE_LEVELS = [
  { key: '80', label: '80%', z: 1.282 },
  { key: '85', label: '85%', z: 1.44 },
  { key: '90', label: '90%', z: 1.645 },
  { key: '95', label: '95%', z: 1.96 },
  { key: '99', label: '99%', z: 2.576 },
  { key: '99.9', label: '99.9%', z: 3.291 },
]

export function getZ(confidenceKey) {
  const level = CONFIDENCE_LEVELS.find((c) => c.key === String(confidenceKey))
  return level ? level.z : 1.96
}

export function standardErrorMean(sd, n) {
  const nNum = Number(n)
  const sdNum = Number(sd)
  if (!Number.isFinite(nNum) || !Number.isFinite(sdNum) || nNum <= 1 || sdNum < 0) return null
  return sdNum / Math.sqrt(nNum)
}

export function standardErrorProportion(p, n) {
  const nNum = Number(n)
  const pNum = Number(p)
  if (!Number.isFinite(nNum) || !Number.isFinite(pNum) || nNum <= 0 || pNum < 0 || pNum > 1) return null
  return Math.sqrt((pNum * (1 - pNum)) / nNum)
}

export function confidenceIntervalMean(mean, sd, n, z) {
  const meanNum = Number(mean)
  const se = standardErrorMean(sd, n)
  if (!Number.isFinite(meanNum) || se === null || !Number.isFinite(z) || z <= 0) {
    return { lower: null, upper: null, marginOfError: null, standardError: null, valid: false }
  }
  const moe = z * se
  return {
    lower: meanNum - moe,
    upper: meanNum + moe,
    marginOfError: moe,
    standardError: se,
    valid: true,
  }
}

export function confidenceIntervalProportion(successes, n, z) {
  const nNum = Number(n)
  const successesNum = Number(successes)
  if (!Number.isFinite(nNum) || !Number.isFinite(successesNum) || nNum <= 0 || successesNum < 0 || successesNum > nNum) {
    return { lower: null, upper: null, marginOfError: null, standardError: null, proportion: null, valid: false }
  }
  const p = successesNum / nNum
  const se = standardErrorProportion(p, nNum)
  if (se === null || !Number.isFinite(z) || z <= 0) {
    return { lower: null, upper: null, marginOfError: null, standardError: null, proportion: p, valid: false }
  }
  const moe = z * se
  return {
    lower: Math.max(0, p - moe),
    upper: Math.min(1, p + moe),
    marginOfError: moe,
    standardError: se,
    proportion: p,
    valid: true,
  }
}

export function sampleSizeForMean(moe, z, sd) {
  const moeNum = Number(moe)
  const zNum = Number(z)
  const sdNum = Number(sd)
  if (!Number.isFinite(moeNum) || !Number.isFinite(zNum) || !Number.isFinite(sdNum) || moeNum <= 0 || zNum <= 0 || sdNum <= 0) {
    return null
  }
  return Math.ceil(Math.pow((zNum * sdNum) / moeNum, 2))
}

export function sampleSizeForProportion(moe, z, p) {
  const moeNum = Number(moe)
  const zNum = Number(z)
  const pNum = Number(p)
  if (!Number.isFinite(moeNum) || !Number.isFinite(zNum) || !Number.isFinite(pNum) || moeNum <= 0 || zNum <= 0 || pNum < 0 || pNum > 1) {
    return null
  }
  return Math.ceil((Math.pow(zNum, 2) * pNum * (1 - pNum)) / Math.pow(moeNum, 2))
}

export function formatNumber(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const fixed = value.toFixed(digits)
  return fixed.replace(/\.?0+$/, '')
}

export function formatPercent(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

export const PRESETS = {
  pt: [
    { name: 'Tempo de resposta de API', mean: 120, sd: 35, n: 100, successes: null, total: null },
    { name: 'Taxa de conversão', mean: null, sd: null, n: null, successes: 45, total: 200 },
    { name: 'Satisfação do cliente', mean: 4.2, sd: 0.8, n: 50, successes: null, total: null },
    { name: 'Taxa de erro', mean: null, sd: null, n: null, successes: 12, total: 500 },
  ],
  en: [
    { name: 'API response time', mean: 120, sd: 35, n: 100, successes: null, total: null },
    { name: 'Conversion rate', mean: null, sd: null, n: null, successes: 45, total: 200 },
    { name: 'Customer satisfaction', mean: 4.2, sd: 0.8, n: 50, successes: null, total: null },
    { name: 'Error rate', mean: null, sd: null, n: null, successes: 12, total: 500 },
  ],
}
