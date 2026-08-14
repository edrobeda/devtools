// Motor 100% client-side para conversão de unidades de tamanho digital.
// Suporta tanto prefixos decimais (base 1000: KB, MB, GB...) quanto
// binários (base 1024: KiB, MiB, GiB...), além de bits e bytes.

export const UNITS = [
  { key: 'b', name: 'bit', namePlural: 'bits', base: 'bit', factor: 1 / 8 },
  { key: 'B', name: 'byte', namePlural: 'bytes', base: 'byte', factor: 1 },
  { key: 'KB', name: 'kilobyte', namePlural: 'kilobytes', base: 'decimal', factor: 1e3 },
  { key: 'MB', name: 'megabyte', namePlural: 'megabytes', base: 'decimal', factor: 1e6 },
  { key: 'GB', name: 'gigabyte', namePlural: 'gigabytes', base: 'decimal', factor: 1e9 },
  { key: 'TB', name: 'terabyte', namePlural: 'terabytes', base: 'decimal', factor: 1e12 },
  { key: 'PB', name: 'petabyte', namePlural: 'petabytes', base: 'decimal', factor: 1e15 },
  { key: 'KiB', name: 'kibibyte', namePlural: 'kibibytes', base: 'binary', factor: 1024 },
  { key: 'MiB', name: 'mebibyte', namePlural: 'mebibytes', base: 'binary', factor: 1024 ** 2 },
  { key: 'GiB', name: 'gibibyte', namePlural: 'gibibytes', base: 'binary', factor: 1024 ** 3 },
  { key: 'TiB', name: 'tebibyte', namePlural: 'tebibytes', base: 'binary', factor: 1024 ** 4 },
  { key: 'PiB', name: 'pebibyte', namePlural: 'pebibytes', base: 'binary', factor: 1024 ** 5 },
]

const UNIT_BY_KEY = Object.fromEntries(UNITS.map((u) => [u.key, u]))

/**
 * Converte um valor de uma unidade para bytes (a unidade base interna).
 * @param {number} value
 * @param {string} fromUnit — chave da unidade de origem (ex.: 'GB', 'MiB')
 * @returns {number} valor em bytes
 */
export function toBytes(value, fromUnit) {
  const unit = UNIT_BY_KEY[fromUnit]
  if (!unit) throw new Error(`Unidade desconhecida: ${fromUnit}`)
  return value * unit.factor
}

/**
 * Converte um valor em bytes para outra unidade.
 * @param {number} bytes
 * @param {string} toUnit — chave da unidade de destino
 * @returns {number}
 */
export function fromBytes(bytes, toUnit) {
  const unit = UNIT_BY_KEY[toUnit]
  if (!unit) throw new Error(`Unidade desconhecida: ${toUnit}`)
  return bytes / unit.factor
}

/**
 * Converte um valor de uma unidade qualquer para outra.
 * @param {number} value
 * @param {string} fromUnit
 * @param {string} toUnit
 * @returns {number}
 */
export function convertFileSize(value, fromUnit, toUnit) {
  return fromBytes(toBytes(value, fromUnit), toUnit)
}

/**
 * Retorna o valor convertido para TODAS as unidades conhecidas.
 * @param {number} value
 * @param {string} fromUnit
 * @returns {Array<{key:string, value:number, unit:object}>}
 */
export function convertToAll(value, fromUnit) {
  const bytes = toBytes(value, fromUnit)
  return UNITS.map((unit) => ({
    key: unit.key,
    value: bytes / unit.factor,
    unit,
  }))
}

/**
 * Formata um número com casas decimais dinâmicas, evitando zeros à direita.
 * @param {number} value
 * @param {number} [maxDecimals=4]
 * @returns {string}
 */
export function formatFileSize(value, maxDecimals = 4) {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  const decimals = abs >= 100 ? 2 : abs >= 1 ? 4 : abs >= 0.001 ? 6 : 8
  const clamped = Math.min(decimals, maxDecimals)
  const formatted = Number(value.toFixed(clamped))
  // Remove zeros à diresta e ponto decimal solitário.
  return String(formatted).replace(/\.$/, '')
}

/**
 * Converte um valor em bytes para a maior unidade "amigável" possível
 * sem perder legibilidade (ex.: 1536 bytes -> 1.5 KiB).
 * @param {number} bytes
 * @param {'binary'|'decimal'} [base='binary']
 * @returns {{value:number, unit:string}}
 */
export function humanizeBytes(bytes, base = 'binary') {
  const candidates = UNITS.filter((u) => u.base === base || u.base === 'byte')
  let best = candidates[0]
  for (const unit of candidates) {
    if (Math.abs(bytes) >= unit.factor) best = unit
  }
  const value = bytes / best.factor
  return { value, unit: best.key }
}

/**
 * Presets comuns para demonstração rápida.
 */
export const PRESETS = [
  { label: '1 KB', value: 1, unit: 'KB' },
  { label: '1 KiB', value: 1, unit: 'KiB' },
  { label: '1 MB', value: 1, unit: 'MB' },
  { label: '1 MiB', value: 1, unit: 'MiB' },
  { label: '1 GB', value: 1, unit: 'GB' },
  { label: '1 GiB', value: 1, unit: 'GiB' },
  { label: '500 MB', value: 500, unit: 'MB' },
  { label: '4.7 GB (DVD)', value: 4.7, unit: 'GB' },
  { label: '700 MB (CD)', value: 700, unit: 'MB' },
]
