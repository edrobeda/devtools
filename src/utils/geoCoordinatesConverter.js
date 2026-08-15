/**
 * Motor do conversor de coordenadas geográficas.
 * Converte entre graus decimais e DMS (graus, minutos, segundos).
 * 100% client-side — nenhum dado sai do navegador.
 */

export const DIRECTIONS = {
  lat: { positive: 'N', negative: 'S' },
  lon: { positive: 'E', negative: 'W' },
}

/**
 * Converte um valor em graus decimais para DMS.
 * @param {number} decimal — valor em graus decimais (lat: -90..90, lon: -180..180)
 * @param {'lat' | 'lon'} axis — eixo da coordenada
 * @returns {{ degrees: number, minutes: number, seconds: number, direction: string, rawSeconds: number }}
 */
export function decimalToDms(decimal, axis) {
  const abs = Math.abs(decimal)
  const degrees = Math.floor(abs)
  const minutesFull = (abs - degrees) * 60
  const minutes = Math.floor(minutesFull)
  const seconds = (minutesFull - minutes) * 60

  const direction = decimal >= 0 ? DIRECTIONS[axis].positive : DIRECTIONS[axis].negative

  return {
    degrees,
    minutes,
    seconds: Math.round(seconds * 10000) / 10000,
    rawSeconds: seconds,
    direction,
  }
}

/**
 * Converte DMS para graus decimais.
 * @param {number} degrees
 * @param {number} minutes
 * @param {number} seconds
 * @param {string} direction — 'N', 'S', 'E' ou 'W'
 * @returns {number}
 */
export function dmsToDecimal(degrees, minutes, seconds, direction) {
  const sign = direction === 'S' || direction === 'W' ? -1 : 1
  return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600)
}

/**
 * Formata um valor DMS como string legível (ex.: 23° 32' 42.50" S).
 */
export function formatDms({ degrees, minutes, seconds, direction }) {
  return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`
}

/**
 * Valida uma coordenada decimal.
 * @param {number} lat
 * @param {number} lon
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDecimal(lat, lon) {
  if (typeof lat !== 'number' || Number.isNaN(lat)) {
    return { valid: false, error: 'invalid-lat' }
  }
  if (typeof lon !== 'number' || Number.isNaN(lon)) {
    return { valid: false, error: 'invalid-lon' }
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'lat-out-of-range' }
  }
  if (lon < -180 || lon > 180) {
    return { valid: false, error: 'lon-out-of-range' }
  }
  return { valid: true }
}

/**
 * Valida valores DMS.
 */
export function validateDms(degrees, minutes, seconds, direction, axis) {
  const validDirections = axis === 'lat' ? ['N', 'S'] : ['E', 'W']
  if (!validDirections.includes(direction)) {
    return { valid: false, error: 'invalid-direction' }
  }
  if (minutes < 0 || minutes >= 60) {
    return { valid: false, error: 'minutes-out-of-range' }
  }
  if (seconds < 0 || seconds >= 60) {
    return { valid: false, error: 'seconds-out-of-range' }
  }
  const absDegrees = Math.abs(degrees)
  const maxDegrees = axis === 'lat' ? 90 : 180
  if (absDegrees > maxDegrees || absDegrees < 0) {
    return { valid: false, error: 'degrees-out-of-range' }
  }
  if (absDegrees === maxDegrees && (minutes > 0 || seconds > 0)) {
    return { valid: false, error: 'max-degree-exceeded' }
  }
  return { valid: true }
}

/**
 * Presets de coordenadas conhecidas.
 */
export const PRESETS = [
  { name: 'São Paulo', pt: 'São Paulo', en: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'New York', pt: 'Nova York', en: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', pt: 'Tóquio', en: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'London', pt: 'Londres', en: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Sydney', pt: 'Sydney', en: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Cape Town', pt: 'Cidade do Cabo', en: 'Cape Town', lat: -33.9249, lon: 18.4241 },
]
