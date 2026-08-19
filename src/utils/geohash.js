// Geohash encoder/decoder — 100% client-side.
//
// Geohash é uma string curta que representa uma célula retangular na
// superfície da Terra, baseada numa grade hierárquica: cada caractere
// adiciona 5 bits (lon, lat, lon, lat, ...) que subdividem a célula pela
// metade. String maior -> célula menor. Por isso prefixos comuns indicam
// proximidade.
//
// - Alfabeto base32 (exclui a, i, l e o): 0123456789bcdefghjkmnpqrstuvwxyz
// - latitude no intervalo [-90, 90], longitude em [-180, 180]
// - Cada caractere começa na longitude (o carro-chefe do bit MSB é lon).

export const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

export const MIN_PRECISION = 1
export const MAX_PRECISION = 12
// Acima disso o display de bits/graus ainda funciona, mas a tabela de
// referência vai só até 12.
export const MAX_HASH_LENGTH = 24

export function cleanInput(raw) {
  return String(raw == null ? '' : raw).trim().toLowerCase()
}

export function isBase32Character(c) {
  return BASE32.indexOf(c) !== -1
}

// Codifica lat/lon numa string geohash com `precision` caracteres.
// Valores fora do intervalo são limitados (a página valida antes).
export function encode(lat, lon, precision = 7) {
  const p = Math.max(MIN_PRECISION, Math.min(MAX_PRECISION, Math.floor(precision)))
  const clat = Math.max(-90, Math.min(90, Number(lat)))
  const clon = Math.max(-180, Math.min(180, Number(lon)))
  let latMin = -90
  let latMax = 90
  let lonMin = -180
  let lonMax = 180
  let hash = ''
  let bit = 0
  let ch = 0
  let even = true
  while (hash.length < p) {
    if (even) {
      const mid = (lonMin + lonMax) / 2
      if (clon >= mid) {
        ch |= 1 << (4 - bit)
        lonMin = mid
      } else {
        lonMax = mid
      }
    } else {
      const mid = (latMin + latMax) / 2
      if (clat >= mid) {
        ch |= 1 << (4 - bit)
        latMin = mid
      } else {
        latMax = mid
      }
    }
    even = !even
    bit += 1
    if (bit === 5) {
      hash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }
  return hash
}

// Decodifica um geohash na caixa delimitadora (bounds + centro).
// Retorna { ok: true, hash, precision, lat: [min, max], lon: [min, max],
// centerLat, centerLon, heightDeg, widthDeg }
// ou { ok: false, error } com error em 'empty' | 'length' | 'invalid'.
export function decode(hash) {
  const raw = cleanInput(hash)
  if (!raw) return { ok: false, error: 'empty' }
  if (raw.length < MIN_PRECISION) return { ok: false, error: 'length' }
  if (raw.length > MAX_HASH_LENGTH) return { ok: false, error: 'length' }

  let latMin = -90
  let latMax = 90
  let lonMin = -180
  let lonMax = 180
  let even = true
  for (let i = 0; i < raw.length; i += 1) {
    const c = raw[i]
    const idx = BASE32.indexOf(c)
    if (idx === -1) return { ok: false, error: 'invalid' }
    for (let b = 4; b >= 0; b -= 1) {
      const on = ((idx >> b) & 1) === 1
      if (even) {
        const mid = (lonMin + lonMax) / 2
        if (on) lonMin = mid
        else lonMax = mid
      } else {
        const mid = (latMin + latMax) / 2
        if (on) latMin = mid
        else latMax = mid
      }
      even = !even
    }
  }

  return {
    ok: true,
    hash: raw,
    precision: raw.length,
    lat: [latMin, latMax],
    lon: [lonMin, lonMax],
    centerLat: (latMin + latMax) / 2,
    centerLon: (lonMin + lonMax) / 2,
    heightDeg: latMax - latMin,
    widthDeg: lonMax - lonMin,
  }
}

// Guarda para deslocar o centro para a célula vizinha. Deslocar pelo
// tamanho exato da célula cai na célula adjacente, pois a grade é um
// encaixe exato (dyadic fractions). Longitude dá a volta na antimeridiana;
// latitude que sair de [-90, 90] significa que o vizinho não existe.
function shifted(hash, dlat, dlon) {
  const d = decode(hash)
  if (!d.ok) return null
  let lat = d.centerLat + d.heightDeg * dlat
  let lon = d.centerLon + d.widthDeg * dlon
  if (lat > 90 || lat < -90) return null
  if (lon > 180) lon -= 360
  if (lon < -180) lon += 360
  const neighbor = encode(lat, lon, d.precision)
  return { dir: null, hash: neighbor, box: decode(neighbor) }
}

const NEIGHBOR_DIRS = [
  ['n', 1, 0],
  ['s', -1, 0],
  ['e', 0, 1],
  ['w', 0, -1],
  ['ne', 1, 1],
  ['nw', 1, -1],
  ['se', -1, 1],
  ['sw', -1, -1],
]

// Os 8 geohashes vizinhos (n, s, e, w, ne, nw, se, sw). Vizinhos do polo
// norte/sul não existem e ficam null. A `box` vem decodificada.
export function neighbors(hash) {
  const d = decode(hash)
  if (!d.ok) return { ok: false, error: d.error }
  const out = {}
  NEIGHBOR_DIRS.forEach(([dir, dlat, dlon]) => {
    const s = shifted(hash, dlat, dlon)
    out[dir] = s ? { dir, hash: s.hash, box: s.box } : null
  })
  return { ok: true, precision: d.precision, neighbors: out }
}

// Grade 3x3 com a célula no centro e seus 8 vizinhos ao redor — usada no
// mapa. Cada entrada: { dir, hash, box }.
export function cellGrid(hash) {
  const d = decode(hash)
  if (!d.ok) return { ok: false, error: d.error }
  const nbrs = neighbors(hash)
  const rows = [
    [
      { dir: 'nw', hash: nbrs.neighbors.nw && nbrs.neighbors.nw.hash, box: nbrs.neighbors.nw && nbrs.neighbors.nw.box },
      { dir: 'n', hash: nbrs.neighbors.n && nbrs.neighbors.n.hash, box: nbrs.neighbors.n && nbrs.neighbors.n.box },
      { dir: 'ne', hash: nbrs.neighbors.ne && nbrs.neighbors.ne.hash, box: nbrs.neighbors.ne && nbrs.neighbors.ne.box },
    ],
    [
      { dir: 'w', hash: nbrs.neighbors.w && nbrs.neighbors.w.hash, box: nbrs.neighbors.w && nbrs.neighbors.w.box },
      { dir: 'center', hash, box: d },
      { dir: 'e', hash: nbrs.neighbors.e && nbrs.neighbors.e.hash, box: nbrs.neighbors.e && nbrs.neighbors.e.box },
    ],
    [
      { dir: 'sw', hash: nbrs.neighbors.sw && nbrs.neighbors.sw.hash, box: nbrs.neighbors.sw && nbrs.neighbors.sw.box },
      { dir: 's', hash: nbrs.neighbors.s && nbrs.neighbors.s.hash, box: nbrs.neighbors.s && nbrs.neighbors.s.box },
      { dir: 'se', hash: nbrs.neighbors.se && nbrs.neighbors.se.hash, box: nbrs.neighbors.se && nbrs.neighbors.se.box },
    ],
  ]
  return {
    ok: true,
    precision: d.precision,
    center: { hash, box: d },
    rows,
  }
}

// Número de bits de longitude/latitude por precisão. Interleaving começa na
// longitude, então lon fica com ceil(5p/2) bits e lat com floor(5p/2).
export function bitCounts(precision) {
  const total = precision * 5
  const lonBits = Math.ceil(total / 2)
  const latBits = Math.floor(total / 2)
  return { lonBits, latBits }
}

// Altura/largura (em graus) de uma célula com `precision` caracteres.
export function cellDegrees(precision) {
  const { lonBits, latBits } = bitCounts(precision)
  return {
    widthDeg: 360 / 2 ** lonBits,
    heightDeg: 180 / 2 ** latBits,
  }
}

// Aproximação linear de metros por grau (1° ≈ 111 km perto do equador).
const METERS_PER_DEG = 111000

// Tamanho em metros da célula decodificada (lon depende da latitude do
// centro — o grau de longitude «encolhe» com cos(lat)). Ordem: largura lon
// × altura lat.
export function cellMeters(box) {
  const latRad = (box.centerLat * Math.PI) / 180
  const lonM = box.widthDeg * METERS_PER_DEG * Math.cos(latRad)
  const latM = box.heightDeg * METERS_PER_DEG
  return { lonM, latM }
}

// Formata metros de forma legível: 4826.7 -> "4.8 km", 0.149 -> "15 cm".
export function humanDistance(m) {
  if (m >= 1000) {
    const km = m / 1000
    if (km >= 100) return `${Math.round(km)} km`
    return `${km >= 10 ? km.toFixed(1) : km.toFixed(2)} km`
  }
  if (m >= 1) return `${m.toFixed(m < 10 ? 1 : 0)} m`
  if (m >= 0.1) return `${m.toFixed(2)} m`
  return `${Math.round(m * 100)} cm`
}

// Tabela de referência: precisão -> bits, graus e tamanho aproximado no
// equador (largura lon × altura lat).
export const PRECISION_TABLE = Array.from({ length: MAX_PRECISION }, (_, i) => {
  const precision = i + 1
  const bits = bitCounts(precision)
  const { widthDeg, heightDeg } = cellDegrees(precision)
  const equator = { centerLat: 0, widthDeg, heightDeg }
  const { lonM, latM } = cellMeters(equator)
  return {
    precision,
    lonBits: bits.lonBits,
    latBits: bits.latBits,
    widthDeg,
    heightDeg,
    size: `${humanDistance(lonM)} × ${humanDistance(latM)}`,
  }
})

// Amostra de cidades de exemplo (nome de exibição, lat, lon). Usado tanto no
// modo Codificar quanto para gerar hashes de exemplo no modo Decodificar.
export const CITY_PRESETS = [
  { name: 'São Paulo, BR', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro, BR', lat: -22.9068, lon: -43.1729 },
  { name: 'Buenos Aires, AR', lat: -34.6037, lon: -58.3816 },
  { name: 'New York, US', lat: 40.7128, lon: -74.006 },
  { name: 'San Francisco, US', lat: 37.7749, lon: -122.4194 },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Berlin, DE', lat: 52.52, lon: 13.405 },
  { name: 'Moscow, RU', lat: 55.7558, lon: 37.6173 },
  { name: 'Tokyo, JP', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney, AU', lat: -33.8688, lon: 151.2093 },
  { name: 'Anchorage, US', lat: 61.2181, lon: -149.9003 },
]

export function getEngineSource() {
  return [
    '// Geohash: string curta que representa uma célula na superfície da Terra.',
    "// Alfabeto base32 (sem a/i/l/o): '0123456789bcdefghjkmnpqrstuvwxyz'",
    '// Cada caractere = 5 bits: lon, lat, lon, lat, ...',
    "// Prefixo comum => células próximas (ex.: '9q8yyk8y' e '9q8yyk93').",
    '',
    'const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"',
    '',
    'export function encode(lat, lon, precision = 7) {',
    '  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180',
    '  let hash = "", bit = 0, ch = 0, even = true',
    '  while (hash.length < precision) {',
    '    const isLongitude = even',
    '    const mid = isLongitude ? (lonMin + lonMax) / 2 : (latMin + latMax) / 2',
    '    const value = isLongitude ? lon : lat',
    '    if (value >= mid) {',
    '      ch |= (1 << (4 - bit))         // bit 1 = metade superior',
    '      if (isLongitude) lonMin = mid',
    '      else latMin = mid',
    '    } else if (isLongitude) lonMax = mid',
    '    else latMax = mid',
    '    even = !even',
    '    bit += 1',
    '    if (bit === 5) { hash += BASE32[ch]; bit = 0; ch = 0 }',
    '  }',
    '  return hash',
    '}',
    '',
    'export function decode(hash) {',
    '  // inverte o processo: cada bit refina a metade superior/inferior',
    '  // retorna lat/lon [min, max], centro e largura/altura em graus',
    '}',
    '',
    '// Vizinhos: desloque o centro por (largura, altura) da célula e',
    '// re-encode no mesmo nível — a grade é um encaixe exato (dyadic):',
    '//   n = encode(centerLat + height, centerLon)',
    '//   e = encode(centerLat, wrapLon(centerLon + width))  // antimeridiana',
    '// Células do polo norte/sul não têm vizinho (null).',
    '',
    '// Tamanho por precisão (no equador, 1° ≈ 111 km):',
    '//   1 → 45° × 45° (≈ 5.000 km)   7 → ≈ 153 m × 153 m',
    '//   3 → 1.4° (≈ 156 km)          8 → ≈ 38 m × 19 m',
    '//   5 → ≈ 4.9 km × 4.9 km       10 → ≈ 1,2 m',
    '//   6 → ≈ 1.2 km × 0.6 km       12 → ≈ 3,7 cm',
  ].join('\n')
}