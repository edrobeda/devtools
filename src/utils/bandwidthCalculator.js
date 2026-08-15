// Motor 100% client-side para calculos de largura de banda e tempo de
// transferencia. Converte tamanhos de arquivo e velocidades de conexao para
// uma unidade comum (bits por segundo) antes de calcular o tempo estimado.

const SIZE_UNITS = [
  { key: 'B', factor: 1 },
  { key: 'KB', factor: 1e3 },
  { key: 'MB', factor: 1e6 },
  { key: 'GB', factor: 1e9 },
  { key: 'TB', factor: 1e12 },
  { key: 'PB', factor: 1e15 },
  { key: 'KiB', factor: 1024 },
  { key: 'MiB', factor: 1024 ** 2 },
  { key: 'GiB', factor: 1024 ** 3 },
  { key: 'TiB', factor: 1024 ** 4 },
  { key: 'PiB', factor: 1024 ** 5 },
]

const SPEED_UNITS = [
  { key: 'bps', factor: 1 },
  { key: 'Kbps', factor: 1e3 },
  { key: 'Mbps', factor: 1e6 },
  { key: 'Gbps', factor: 1e9 },
  { key: 'Tbps', factor: 1e12 },
  { key: 'B/s', factor: 8 },
  { key: 'KB/s', factor: 8e3 },
  { key: 'MB/s', factor: 8e6 },
  { key: 'GB/s', factor: 8e9 },
  { key: 'TB/s', factor: 8e12 },
]

const SIZE_BY_KEY = Object.fromEntries(SIZE_UNITS.map((u) => [u.key, u]))
const SPEED_BY_KEY = Object.fromEntries(SPEED_UNITS.map((u) => [u.key, u]))

/**
 * Converte um tamanho para bytes.
 * @param {number} value
 * @param {string} unit — ex.: 'GB', 'MiB'
 * @returns {number}
 */
export function sizeToBytes(value, unit) {
  const u = SIZE_BY_KEY[unit]
  if (!u) throw new Error(`Unidade de tamanho desconhecida: ${unit}`)
  return value * u.factor
}

/**
 * Converte uma velocidade para bits por segundo.
 * @param {number} value
 * @param {string} unit — ex.: 'Mbps', 'MB/s'
 * @returns {number}
 */
export function speedToBps(value, unit) {
  const u = SPEED_BY_KEY[unit]
  if (!u) throw new Error(`Unidade de velocidade desconhecida: ${unit}`)
  return value * u.factor
}

/**
 * Formata um numero com casas decimais dinamicas.
 * @param {number} value
 * @param {number} [maxDecimals=4]
 * @returns {string}
 */
export function formatNumber(value, maxDecimals = 4) {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  const decimals = abs >= 100 ? 2 : abs >= 1 ? 4 : abs >= 0.001 ? 6 : 8
  const clamped = Math.min(decimals, maxDecimals)
  const formatted = Number(value.toFixed(clamped))
  return String(formatted).replace(/\.$/, '')
}

/**
 * Calcula o tempo estimado de transferencia em segundos.
 * @param {number} sizeBytes
 * @param {number} speedBps
 * @param {number} [overheadPercent=0] — overhead de protocolo (0-100)
 * @returns {number} segundos
 */
export function calculateTransferTime(sizeBytes, speedBps, overheadPercent = 0) {
  if (speedBps <= 0) return Infinity
  const effectiveSpeed = speedBps * (1 - Math.min(Math.max(overheadPercent, 0), 100) / 100)
  if (effectiveSpeed <= 0) return Infinity
  const bits = sizeBytes * 8
  return bits / effectiveSpeed
}

/**
 * Calcula o tamanho maximo transferivel em bytes dada uma velocidade e tempo.
 * @param {number} speedBps
 * @param {number} seconds
 * @param {number} [overheadPercent=0]
 * @returns {number} bytes
 */
export function calculateMaxSize(speedBps, seconds, overheadPercent = 0) {
  if (seconds < 0 || speedBps <= 0) return 0
  const effectiveSpeed = speedBps * (1 - Math.min(Math.max(overheadPercent, 0), 100) / 100)
  return (effectiveSpeed * seconds) / 8
}

/**
 * Formata uma duracao em segundos para a maior unidade legivel.
 * @param {number} seconds
 * @returns {{value:number, unit:string, parts:object}}
 */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return { value: 0, unit: 's', parts: { d: 0, h: 0, m: 0, s: 0 }, text: '—' }
  }

  const totalSeconds = Math.ceil(seconds)
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  if (seconds < 1) {
    return { value: seconds, unit: 'ms', parts: { d, h, m, s }, text: `${formatNumber(seconds * 1000)} ms` }
  }
  if (seconds < 60) {
    return { value: seconds, unit: 's', parts: { d, h, m, s }, text: `${formatNumber(seconds)} s` }
  }
  if (seconds < 3600) {
    return { value: seconds / 60, unit: 'min', parts: { d, h, m, s }, text: `${formatNumber(seconds / 60)} min` }
  }
  if (seconds < 86400) {
    return { value: seconds / 3600, unit: 'h', parts: { d, h, m, s }, text: `${formatNumber(seconds / 3600)} h` }
  }
  return { value: seconds / 86400, unit: 'd', parts: { d, h, m, s }, text: `${formatNumber(seconds / 86400)} d` }
}

/**
 * Retorna a representacao detalhada (dias, horas, minutos, segundos).
 * @param {number} seconds
 * @returns {string}
 */
export function formatDurationDetailed(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const totalSeconds = Math.max(0, Math.ceil(seconds))
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}min`)
  if (s || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

/**
 * Formata uma velocidade em bits/s para a unidade mais legivel.
 * @param {number} bps
 * @returns {{value:number, unit:string}}
 */
export function humanizeSpeed(bps) {
  const abs = Math.abs(bps)
  if (abs === 0) return { value: 0, unit: 'bps' }
  if (abs >= 1e12) return { value: bps / 1e12, unit: 'Tbps' }
  if (abs >= 1e9) return { value: bps / 1e9, unit: 'Gbps' }
  if (abs >= 1e6) return { value: bps / 1e6, unit: 'Mbps' }
  if (abs >= 1e3) return { value: bps / 1e3, unit: 'Kbps' }
  return { value: bps, unit: 'bps' }
}

/**
 * Converte bytes/s em uma unidade legivel.
 * @param {number} bytesPerSecond
 * @returns {{value:number, unit:string}}
 */
export function humanizeByteSpeed(bytesPerSecond) {
  const abs = Math.abs(bytesPerSecond)
  if (abs === 0) return { value: 0, unit: 'B/s' }
  if (abs >= 1e12) return { value: bytesPerSecond / 1e12, unit: 'TB/s' }
  if (abs >= 1e9) return { value: bytesPerSecond / 1e9, unit: 'GB/s' }
  if (abs >= 1e6) return { value: bytesPerSecond / 1e6, unit: 'MB/s' }
  if (abs >= 1e3) return { value: bytesPerSecond / 1e3, unit: 'KB/s' }
  return { value: bytesPerSecond, unit: 'B/s' }
}

/**
 * Presets comuns de transferencia.
 */
export const TRANSFER_PRESETS = [
  { label: 'Backup 100 GiB @ 1 Gbps', sizeValue: 100, sizeUnit: 'GiB', speedValue: 1, speedUnit: 'Gbps', overhead: 0 },
  { label: 'Filme 4 GB @ 100 Mbps', sizeValue: 4, sizeUnit: 'GB', speedValue: 100, speedUnit: 'Mbps', overhead: 0 },
  { label: 'Docker image 2 GB @ 10 MB/s', sizeValue: 2, sizeUnit: 'GB', speedValue: 10, speedUnit: 'MB/s', overhead: 0 },
  { label: 'Arquivo 50 MB @ 5 Mbps', sizeValue: 50, sizeUnit: 'MB', speedValue: 5, speedUnit: 'Mbps', overhead: 0 },
  { label: 'Patch 500 MB @ 1 Gbps', sizeValue: 500, sizeUnit: 'MB', speedValue: 1, speedUnit: 'Gbps', overhead: 0 },
]

export const SIZE_UNIT_KEYS = SIZE_UNITS.map((u) => u.key)
export const SPEED_UNIT_KEYS = SPEED_UNITS.map((u) => u.key)
