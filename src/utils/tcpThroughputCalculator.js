// Calculadora de throughput TCP / Bandwidth-Delay Product (BDP)
// 100% client-side — nenhum dado de rede sai do navegador.

export const DEFAULT_MSS = 1460 // bytes (típico para Ethernet IPv4 com cabeçalhos)

export const BANDWIDTH_UNITS = {
  bps: 1,
  Kbps: 1_000,
  Mbps: 1_000_000,
  Gbps: 1_000_000_000,
}

export const SIZE_UNITS = {
  B: 1,
  KB: 1_000,
  KiB: 1024,
  MB: 1_000_000,
  MiB: 1024 ** 2,
  GB: 1_000_000_000,
  GiB: 1024 ** 3,
  TB: 1_000_000_000_000,
  TiB: 1024 ** 4,
}

export const RTT_UNITS = {
  ms: 0.001,
  s: 1,
}

export function toBps(value, unit) {
  return (value || 0) * (BANDWIDTH_UNITS[unit] || 1)
}

export function toBytes(value, unit) {
  return (value || 0) * (SIZE_UNITS[unit] || 1)
}

export function toSeconds(value, unit) {
  return (value || 0) * (RTT_UNITS[unit] || 0.001)
}

export function humanizeSpeed(bps) {
  const abs = Math.abs(bps)
  if (abs >= 1_000_000_000) return { value: bps / 1_000_000_000, unit: 'Gbps' }
  if (abs >= 1_000_000) return { value: bps / 1_000_000, unit: 'Mbps' }
  if (abs >= 1_000) return { value: bps / 1_000, unit: 'Kbps' }
  return { value: bps, unit: 'bps' }
}

export function humanizeBytes(bytes, binary = false) {
  const abs = Math.abs(bytes)
  const base = binary ? 1024 : 1000
  const units = binary ? ['B', 'KiB', 'MiB', 'GiB', 'TiB'] : ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let index = 0
  while (abs >= base && index < units.length - 1) {
    value /= base
    index++
  }
  return { value, unit: units[index] }
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const fixed = n.toFixed(decimals)
  return fixed.replace(/\.(\d+)$/, (match, dec) => (parseInt(dec, 10) ? match : ''))
}

// BDP em bits = largura de banda (bps) × RTT (s)
export function calculateBdp(bps, rttSeconds) {
  return bps * rttSeconds
}

// Janela TCP ideal em bytes para saturar o link
export function idealWindowBytes(bdpBits) {
  return bdpBits / 8
}

// Throughput limitado pela janela informada (bytes) e RTT (s)
export function windowLimitedThroughput(windowBytes, rttSeconds) {
  if (!rttSeconds) return 0
  return (windowBytes * 8) / rttSeconds
}

// Fórmula de Mathis: throughput máximo com perda de pacotes
// throughput ≈ (MSS / RTT) × (1 / sqrt(p))
// p é a probabilidade de perda (0..1)
export function mathisThroughput(mssBytes, rttSeconds, lossProbability) {
  if (!rttSeconds || lossProbability <= 0) return Infinity
  return (mssBytes * 8) / rttSeconds * (1 / Math.sqrt(lossProbability))
}

// Throughput efetivo: menor entre banda bruta, limite da janela e limite de Mathis
export function calculateEffectiveThroughput({
  bandwidthBps,
  rttSeconds,
  windowBytes,
  lossProbability,
  mssBytes = DEFAULT_MSS,
}) {
  const windowLimit = windowBytes > 0 ? windowLimitedThroughput(windowBytes, rttSeconds) : Infinity
  const mathisLimit = lossProbability > 0 ? mathisThroughput(mssBytes, rttSeconds, lossProbability) : Infinity
  const effective = Math.min(bandwidthBps, windowLimit, mathisLimit)
  return {
    effectiveBps: effective,
    limitedByBandwidth: effective === bandwidthBps,
    limitedByWindow: windowBytes > 0 && effective === windowLimit,
    limitedByLoss: lossProbability > 0 && effective === mathisLimit,
  }
}

export function calculateTransferTime(fileBytes, throughputBps) {
  if (!throughputBps) return null
  return (fileBytes * 8) / throughputBps
}

export function formatDuration(seconds) {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '—'
  if (seconds < 0.001) return `${formatNumber(seconds * 1_000_000, 2)} µs`
  if (seconds < 1) return `${formatNumber(seconds * 1_000, 2)} ms`
  if (seconds < 60) return `${formatNumber(seconds, 2)} s`
  if (seconds < 3600) return `${formatNumber(seconds / 60, 2)} min`
  if (seconds < 86400) return `${formatNumber(seconds / 3600, 2)} h`
  return `${formatNumber(seconds / 86400, 2)} days`
}

export const PRESETS = [
  {
    id: 'lan',
    label: { pt: 'LAN rápida', en: 'Fast LAN' },
    bandwidth: 10,
    bandwidthUnit: 'Gbps',
    rtt: 0.5,
    rttUnit: 'ms',
    loss: 0.0001,
    window: 0,
    windowUnit: 'KB',
    fileSize: 1,
    fileSizeUnit: 'GB',
  },
  {
    id: 'datacenter',
    label: { pt: 'Data center', en: 'Data center' },
    bandwidth: 1,
    bandwidthUnit: 'Gbps',
    rtt: 2,
    rttUnit: 'ms',
    loss: 0.01,
    window: 256,
    windowUnit: 'KB',
    fileSize: 10,
    fileSizeUnit: 'GB',
  },
  {
    id: 'transatlantic',
    label: { pt: 'Transatlântico', en: 'Transatlantic' },
    bandwidth: 100,
    bandwidthUnit: 'Mbps',
    rtt: 80,
    rttUnit: 'ms',
    loss: 0.1,
    window: 1,
    windowUnit: 'MB',
    fileSize: 1,
    fileSizeUnit: 'GB',
  },
  {
    id: 'satellite',
    label: { pt: 'Satélite', en: 'Satellite' },
    bandwidth: 50,
    bandwidthUnit: 'Mbps',
    rtt: 600,
    rttUnit: 'ms',
    loss: 1,
    window: 5,
    windowUnit: 'MB',
    fileSize: 100,
    fileSizeUnit: 'MB',
  },
  {
    id: 'mobile-4g',
    label: { pt: '4G móvel', en: 'Mobile 4G' },
    bandwidth: 20,
    bandwidthUnit: 'Mbps',
    rtt: 40,
    rttUnit: 'ms',
    loss: 0.5,
    window: 256,
    windowUnit: 'KB',
    fileSize: 50,
    fileSizeUnit: 'MB',
  },
  {
    id: 'home-internet',
    label: { pt: 'Internet residencial', en: 'Home internet' },
    bandwidth: 100,
    bandwidthUnit: 'Mbps',
    rtt: 20,
    rttUnit: 'ms',
    loss: 0.1,
    window: 128,
    windowUnit: 'KB',
    fileSize: 500,
    fileSizeUnit: 'MB',
  },
  {
    id: 'wifi-congested',
    label: { pt: 'WiFi congestionado', en: 'Congested WiFi' },
    bandwidth: 50,
    bandwidthUnit: 'Mbps',
    rtt: 5,
    rttUnit: 'ms',
    loss: 2,
    window: 64,
    windowUnit: 'KB',
    fileSize: 100,
    fileSizeUnit: 'MB',
  },
]
