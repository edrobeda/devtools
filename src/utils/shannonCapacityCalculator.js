// Calculadora de capacidade de canal de Shannon (Teorema de Shannon-Hartley)
// 100% client-side — nenhum dado de rede sai do navegador.

export const BANDWIDTH_UNITS = {
  Hz: 1,
  kHz: 1_000,
  MHz: 1_000_000,
  GHz: 1_000_000_000,
}

export const SPEED_UNITS = [
  { threshold: 1_000_000_000_000, unit: 'Tbps', divisor: 1_000_000_000_000 },
  { threshold: 1_000_000_000, unit: 'Gbps', divisor: 1_000_000_000 },
  { threshold: 1_000_000, unit: 'Mbps', divisor: 1_000_000 },
  { threshold: 1_000, unit: 'Kbps', divisor: 1_000 },
  { threshold: 0, unit: 'bps', divisor: 1 },
]

export const PRESETS = {
  telephone: {
    label: { pt: 'Canal telefônico', en: 'Telephone channel' },
    bandwidth: 3_100,
    bandwidthUnit: 'Hz',
    snrDb: 30,
  },
  wifi20: {
    label: { pt: 'Wi-Fi 20 MHz', en: 'Wi-Fi 20 MHz' },
    bandwidth: 20,
    bandwidthUnit: 'MHz',
    snrDb: 25,
  },
  wifi40: {
    label: { pt: 'Wi-Fi 40 MHz', en: 'Wi-Fi 40 MHz' },
    bandwidth: 40,
    bandwidthUnit: 'MHz',
    snrDb: 25,
  },
  lte5: {
    label: { pt: 'LTE 5 MHz', en: 'LTE 5 MHz' },
    bandwidth: 5,
    bandwidthUnit: 'MHz',
    snrDb: 20,
  },
  lte20: {
    label: { pt: 'LTE 20 MHz', en: 'LTE 20 MHz' },
    bandwidth: 20,
    bandwidthUnit: 'MHz',
    snrDb: 20,
  },
  fiber10g: {
    label: { pt: 'Fibra óptica 10 GHz', en: 'Optical fiber 10 GHz' },
    bandwidth: 10,
    bandwidthUnit: 'GHz',
    snrDb: 35,
  },
  satellite: {
    label: { pt: 'Enlace satelital', en: 'Satellite link' },
    bandwidth: 36,
    bandwidthUnit: 'MHz',
    snrDb: 15,
  },
}

export const MODULATIONS = [
  { name: 'BPSK', bitsPerHz: 1 },
  { name: 'QPSK', bitsPerHz: 2 },
  { name: '8-QAM', bitsPerHz: 3 },
  { name: '16-QAM', bitsPerHz: 4 },
  { name: '32-QAM', bitsPerHz: 5 },
  { name: '64-QAM', bitsPerHz: 6 },
  { name: '256-QAM', bitsPerHz: 8 },
  { name: '1024-QAM', bitsPerHz: 10 },
  { name: '4096-QAM', bitsPerHz: 12 },
]

export function toHz(value, unit) {
  return (value || 0) * (BANDWIDTH_UNITS[unit] || 1)
}

export function snrDbToLinear(db) {
  return Math.pow(10, (db || 0) / 10)
}

export function snrLinearToDb(linear) {
  if (linear <= 0) return -Infinity
  return 10 * Math.log10(linear)
}

// Capacidade de Shannon: C = B * log2(1 + SNR)  (bits por segundo)
export function shannonCapacity(bandwidthHz, snrLinear) {
  if (bandwidthHz <= 0 || snrLinear < 0) return 0
  return bandwidthHz * Math.log2(1 + snrLinear)
}

export function formatBitsPerSecond(bps, decimals = 2) {
  const abs = Math.abs(bps)
  const { unit, divisor } = SPEED_UNITS.find((u) => abs >= u.threshold)
  return {
    value: Number((bps / divisor).toFixed(decimals)),
    unit,
    bps,
  }
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const fixed = n.toFixed(decimals)
  return fixed.replace(/\.(\d+)$/, (match, dec) => (parseInt(dec, 10) ? match : ''))
}

// SNR linear mínimo para atingir uma capacidade-alvo (bps) dada uma largura de banda (Hz)
export function requiredSnrForCapacity(targetBps, bandwidthHz) {
  if (bandwidthHz <= 0 || targetBps <= 0) return null
  return Math.pow(2, targetBps / bandwidthHz) - 1
}

// Largura de banda mínima (Hz) para atingir uma capacidade-alvo (bps) dado um SNR linear
export function requiredBandwidthForCapacity(targetBps, snrLinear) {
  if (targetBps <= 0 || snrLinear < 0) return null
  if (snrLinear === 0) return Infinity
  return targetBps / Math.log2(1 + snrLinear)
}

// Gera pontos para gráfico de capacidade vs SNR (dB) para uma largura de banda fixa
export function buildCapacityCurve(bandwidthHz, dbRange = { min: -30, max: 60, steps: 90 }) {
  const points = []
  for (let i = 0; i <= dbRange.steps; i++) {
    const db = dbRange.min + ((dbRange.max - dbRange.min) * i) / dbRange.steps
    const linear = snrDbToLinear(db)
    const capacity = shannonCapacity(bandwidthHz, linear)
    points.push({ db, capacity })
  }
  return points
}

// Compara modulações ideais com o limite de Shannon para a banda dada
export function modulationComparison(bandwidthHz, snrLinear) {
  const shannon = shannonCapacity(bandwidthHz, snrLinear)
  return MODULATIONS.map((m) => {
    const theoretical = bandwidthHz * m.bitsPerHz
    const efficiency = shannon > 0 ? (theoretical / shannon) * 100 : 0
    return {
      ...m,
      theoreticalBps: theoretical,
      efficiency: Math.min(efficiency, 100),
      feasible: theoretical <= shannon,
    }
  })
}

export function calculateShannonResult({ bandwidth, bandwidthUnit, snrDb, signalMw, noiseMw, useDb }) {
  const bandwidthHz = toHz(bandwidth, bandwidthUnit)
  let snrLinear
  if (useDb) {
    snrLinear = snrDbToLinear(snrDb)
  } else {
    const signal = signalMw || 0
    const noise = noiseMw || 0
    snrLinear = noise > 0 ? signal / noise : 0
  }

  const capacity = shannonCapacity(bandwidthHz, snrLinear)
  const capacityFormatted = formatBitsPerSecond(capacity)
  const spectralEfficiency = bandwidthHz > 0 ? capacity / bandwidthHz : 0 // bits/s/Hz

  return {
    bandwidthHz,
    snrLinear,
    snrDb: snrLinearToDb(snrLinear),
    capacity,
    capacityFormatted,
    spectralEfficiency,
  }
}
