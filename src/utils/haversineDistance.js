/**
 * Motor da calculadora de distância entre coordenadas geográficas.
 * Fórmula de Haversine + interpolação do grande círculo (slerp) para
 * desenhar a rota na projeção equiretangular. 100% client-side —
 * nenhum dado sai do navegador.
 */

export const EARTH_RADIUS_KM = 6371.0088

export const UNITS = {
  km: { kmPerUnit: 1, label: { pt: 'km', en: 'km' } },
  m: { kmPerUnit: 0.001, label: { pt: 'm', en: 'm' } },
  mi: { kmPerUnit: 1.609344, label: { pt: 'mi', en: 'mi' } },
  nmi: { kmPerUnit: 1.852, label: { pt: 'mn', en: 'nmi' } },
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

function toDeg(rad) {
  return (rad * 180) / Math.PI
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

/**
 * Converte uma coordenada para o vetor unitário cartesiano 3D.
 * @returns {[number, number, number]}
 */
export function latLonToVector(lat, lon) {
  const phi = toRad(lat)
  const lambda = toRad(lon)
  const cosPhi = Math.cos(phi)
  return [
    cosPhi * Math.cos(lambda),
    cosPhi * Math.sin(lambda),
    Math.sin(phi),
  ]
}

/**
 * Converte um vetor unitário 3D de volta para coordenadas.
 * @returns {{ lat: number, lon: number }}
 */
export function vectorToLatLon([x, y, z]) {
  const lat = toDeg(Math.asin(clamp(z, -1, 1)))
  const lon = toDeg(Math.atan2(y, x))
  return { lat, lon }
}

/**
 * Interpolação esférica linear entre dois vetores unitários.
 */
export function slerp(v1, v2, t) {
  const dot = clamp(v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2], -1, 1)
  const theta = Math.acos(dot)
  if (theta < 1e-12) return [v1[0], v1[1], v1[2]]
  const sinTheta = Math.sin(theta)
  const a = Math.sin((1 - t) * theta) / sinTheta
  const b = Math.sin(t * theta) / sinTheta
  return [
    a * v1[0] + b * v2[0],
    a * v1[1] + b * v2[1],
    a * v1[2] + b * v2[2],
  ]
}

/**
 * Distância em km entre dois pontos usando a fórmula de Haversine.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(clamp(a, 0, 1)))
}

/**
 * Distância em uma unidade qualquer (chave de UNITS).
 */
export function distance(lat1, lon1, lat2, lon2, unit) {
  const km = haversineKm(lat1, lon1, lat2, lon2)
  const u = UNITS[unit] || UNITS.km
  return km / u.kmPerUnit
}

/**
 * Rumo inicial (bearing) em graus 0..360, medido do norte em sentido horário.
 */
export function initialBearingDeg(lat1, lon1, lat2, lon2) {
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dLon = toRad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/**
 * Rumo final (bearing no destino) em graus 0..360.
 */
export function finalBearingDeg(lat1, lon1, lat2, lon2) {
  return (initialBearingDeg(lat2, lon2, lat1, lon1) + 180) % 360
}

/**
 * Ponto médio sobre o grande círculo (lidando com a antimeridiana via slerp).
 */
export function greatCircleMidpoint(lat1, lon1, lat2, lon2) {
  return vectorToLatLon(slerp(latLonToVector(lat1, lon1), latLonToVector(lat2, lon2), 0.5))
}

/**
 * Amostra N pontos do grande círculo entre dois pontos.
 * @returns {Array<{lat: number, lon: number}>}
 */
export function greatCircleSamples(lat1, lon1, lat2, lon2, segments = 64) {
  const v1 = latLonToVector(lat1, lon1)
  const v2 = latLonToVector(lat2, lon2)
  const out = []
  for (let i = 0; i <= segments; i += 1) {
    out.push(vectorToLatLon(slerp(v1, v2, i / segments)))
  }
  return out
}

/**
 * Projeta lat/lon para o plano equiretangular (para SVG).
 */
export function projectEquirectangular(lat, lon, width, height) {
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}

/**
 * Converte amostras do grande círculo em um caminho SVG. Divide o caminho
 * quando a rota cruza a antimeridiana, evitando uma linha atravessando o mapa.
 * @returns {Array<Array<{x: number, y: number}>>}
 */
export function greatCirclePathSegments(samples, width, height) {
  const points = samples.map((s) => projectEquirectangular(s.lat, s.lon, width, height))
  const paths = []
  let current = [points[0]]
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const cur = points[i]
    if (Math.abs(cur.x - prev.x) > width / 2) {
      paths.push(current)
      current = []
    }
    current.push(cur)
  }
  paths.push(current)
  return paths
}

/**
 * Formata uma distância numérica com a unidade escolhida.
 */
export function formatDistance(value, unit = 'km', decimals) {
  const u = UNITS[unit] || UNITS.km
  const d = decimals == null ? (value >= 1000 ? 0 : 1) : decimals
  return `${value.toLocaleString('pt-BR', {
    maximumFractionDigits: d,
  })} ${u.label.pt}`
}

/**
 * Parseia uma lista de linhas "nome, lat, lon" ou "lat, lon".
 * @returns {{ points: Array<{name: string, lat: number, lon: number}>, errors: Array<string>, total: number, valid: number }}
 */
export function parseCoordinateLines(text) {
  const points = []
  const errors = []
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  lines.forEach((line, index) => {
    const parts = line.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
    if (parts.length === 0) return
    let name = ''
    let latStr
    let lonStr
    if (parts.length >= 3) {
      name = parts.slice(0, parts.length - 2).join(' ')
      ;[latStr, lonStr] = parts.slice(-2)
    } else if (parts.length === 2) {
      ;[latStr, lonStr] = parts
    } else {
      errors.push({ line: index + 1, reason: 'format' })
      return
    }
    const lat = Number(latStr)
    const lon = Number(lonStr)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      errors.push({ line: index + 1, reason: 'number' })
      return
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      errors.push({ line: index + 1, reason: 'range' })
      return
    }
    points.push({ name: name || `#${index + 1}`, lat, lon })
  })

  return { points, errors, total: lines.length, valid: points.length }
}

export const CITY_PRESETS = [
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Anchorage', lat: 61.2181, lon: -149.9003 },
]

export const ROUTE_PRESETS = [
  {
    id: 'sp-ny',
    label: { pt: 'São Paulo → Nova York', en: 'São Paulo → New York' },
    a: { lat: -23.5505, lon: -46.6333 },
    b: { lat: 40.7128, lon: -74.006 },
  },
  {
    id: 'tok-lon',
    label: { pt: 'Tóquio → Londres', en: 'Tokyo → London' },
    a: { lat: 35.6762, lon: 139.6503 },
    b: { lat: 51.5074, lon: -0.1278 },
  },
  {
    id: 'syd-sp',
    label: { pt: 'Sydney → São Paulo', en: 'Sydney → São Paulo' },
    a: { lat: -33.8688, lon: 151.2093 },
    b: { lat: -23.5505, lon: -46.6333 },
  },
  {
    id: 'anch-berlin',
    label: { pt: 'Anchorage → Berlim (perto do polo)', en: 'Anchorage → Berlin (near the pole)' },
    a: { lat: 61.2181, lon: -149.9003 },
    b: { lat: 52.52, lon: 13.405 },
  },
  {
    id: 'moscow-tokyo',
    label: { pt: 'Moscou → Tóquio (grande círculo pelo Ártico)', en: 'Moscow → Tokyo (great circle over the Arctic)' },
    a: { lat: 55.7558, lon: 37.6173 },
    b: { lat: 35.6762, lon: 139.6503 },
  },
  {
    id: 'tokyo-anchorage',
    label: { pt: 'Tóquio → Anchorage (cruza a antimeridiana)', en: 'Tokyo → Anchorage (crosses the antimeridian)' },
    a: { lat: 35.6762, lon: 139.6503 },
    b: { lat: 61.2181, lon: -149.9003 },
  },
  {
    id: 'equal-lat',
    label: { pt: 'Mesma latitude (latitude 0°)', en: 'Same latitude (equator)' },
    a: { lat: 0, lon: -75 },
    b: { lat: 0, lon: 105 },
  },
]

export const BATCH_SAMPLE = `São Paulo, -23.5505, -46.6333
New York, 40.7128, -74.006
Tokyo, 35.6762, 139.6503
London, 51.5074, -0.1278
Sydney, -33.8688, 151.2093
-15.8267, -47.9218`
