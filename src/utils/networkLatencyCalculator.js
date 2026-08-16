// Calculadora de latência de rede — estimativa teórica de RTT baseada na
// distância geodésica entre dois pontos e na velocidade de propagação no cabo.
// Todos os cálculos são 100% client-side; nenhuma coordenada ou estimativa sai
// do navegador.

export const SPEED_OF_LIGHT_KM_MS = 299.792458 // km por milissegundo

// A luz na fibra óptica viaja aproximadamente 1/1.5 da velocidade no vácuo
// devido ao índice de refração do vidro.
export const DEFAULT_CABLE_FACTOR = 1.5

// Fator realista adicional para compensar roteadores, switches, conversões
// óptico-elétricas e rotas não em linha reta entre data centers.
export const DEFAULT_REALISTIC_FACTOR = 1.3

// Regiões de nuvem com coordenadas aproximadas dos principais data centers.
export const CLOUD_REGIONS = [
  { id: 'sa-east-1', name: 'São Paulo', provider: 'AWS', country: 'BR', lat: -23.55, lon: -46.63 },
  { id: 'us-east-1', name: 'N. Virginia', provider: 'AWS', country: 'US', lat: 37.93, lon: -78.24 },
  { id: 'us-east-2', name: 'Ohio', provider: 'AWS', country: 'US', lat: 40.15, lon: -82.9 },
  { id: 'us-west-1', name: 'N. California', provider: 'AWS', country: 'US', lat: 37.77, lon: -122.41 },
  { id: 'us-west-2', name: 'Oregon', provider: 'AWS', country: 'US', lat: 45.52, lon: -122.67 },
  { id: 'eu-west-1', name: 'Dublin', provider: 'AWS', country: 'IE', lat: 53.34, lon: -6.26 },
  { id: 'eu-west-2', name: 'London', provider: 'AWS', country: 'GB', lat: 51.5, lon: -0.12 },
  { id: 'eu-west-3', name: 'Paris', provider: 'AWS', country: 'FR', lat: 48.85, lon: 2.35 },
  { id: 'eu-central-1', name: 'Frankfurt', provider: 'AWS', country: 'DE', lat: 50.11, lon: 8.68 },
  { id: 'ap-southeast-1', name: 'Singapore', provider: 'AWS', country: 'SG', lat: 1.35, lon: 103.86 },
  { id: 'ap-southeast-2', name: 'Sydney', provider: 'AWS', country: 'AU', lat: -33.86, lon: 151.2 },
  { id: 'ap-northeast-1', name: 'Tokyo', provider: 'AWS', country: 'JP', lat: 35.68, lon: 139.76 },
  { id: 'ap-northeast-2', name: 'Seoul', provider: 'AWS', country: 'KR', lat: 37.56, lon: 126.97 },
  { id: 'ap-south-1', name: 'Mumbai', provider: 'AWS', country: 'IN', lat: 19.07, lon: 72.87 },
  { id: 'ca-central-1', name: 'Montreal', provider: 'AWS', country: 'CA', lat: 45.5, lon: -73.56 },
  { id: 'me-south-1', name: 'Bahrain', provider: 'AWS', country: 'BH', lat: 26.22, lon: 50.58 },
  { id: 'af-south-1', name: 'Cape Town', provider: 'AWS', country: 'ZA', lat: -33.92, lon: 18.42 },
  { id: 'us-south1', name: 'São Paulo', provider: 'GCP', country: 'BR', lat: -23.55, lon: -46.63 },
  { id: 'us-central1', name: 'Iowa', provider: 'GCP', country: 'US', lat: 41.87, lon: -93.09 },
  { id: 'us-east1', name: 'South Carolina', provider: 'GCP', country: 'US', lat: 33.83, lon: -80.0 },
  { id: 'us-east4', name: 'N. Virginia', provider: 'GCP', country: 'US', lat: 37.93, lon: -78.24 },
  { id: 'us-west1', name: 'Oregon', provider: 'GCP', country: 'US', lat: 45.52, lon: -122.67 },
  { id: 'europe-west1', name: 'Belgium', provider: 'GCP', country: 'BE', lat: 50.85, lon: 4.35 },
  { id: 'europe-west2', name: 'London', provider: 'GCP', country: 'GB', lat: 51.5, lon: -0.12 },
  { id: 'europe-west3', name: 'Frankfurt', provider: 'GCP', country: 'DE', lat: 50.11, lon: 8.68 },
  { id: 'asia-southeast1', name: 'Singapore', provider: 'GCP', country: 'SG', lat: 1.35, lon: 103.86 },
  { id: 'asia-northeast1', name: 'Tokyo', provider: 'GCP', country: 'JP', lat: 35.68, lon: 139.76 },
  { id: 'asia-east1', name: 'Taiwan', provider: 'GCP', country: 'TW', lat: 23.69, lon: 120.96 },
  { id: 'australia-southeast1', name: 'Sydney', provider: 'GCP', country: 'AU', lat: -33.86, lon: 151.2 },
  { id: 'brazilsouth', name: 'São Paulo', provider: 'Azure', country: 'BR', lat: -23.55, lon: -46.63 },
  { id: 'eastus', name: 'Virginia', provider: 'Azure', country: 'US', lat: 37.93, lon: -78.24 },
  { id: 'westus', name: 'California', provider: 'Azure', country: 'US', lat: 37.77, lon: -122.41 },
  { id: 'westeurope', name: 'Netherlands', provider: 'Azure', country: 'NL', lat: 52.36, lon: 4.9 },
  { id: 'northeurope', name: 'Ireland', provider: 'Azure', country: 'IE', lat: 53.34, lon: -6.26 },
  { id: 'southeastasia', name: 'Singapore', provider: 'Azure', country: 'SG', lat: 1.35, lon: 103.86 },
  { id: 'eastasia', name: 'Hong Kong', provider: 'Azure', country: 'HK', lat: 22.31, lon: 114.16 },
  { id: 'japaneast', name: 'Tokyo', provider: 'Azure', country: 'JP', lat: 35.68, lon: 139.76 },
  { id: 'koreacentral', name: 'Seoul', provider: 'Azure', country: 'KR', lat: 37.56, lon: 126.97 },
  { id: 'australiaeast', name: 'Sydney', provider: 'Azure', country: 'AU', lat: -33.86, lon: 151.2 },
]

// Cenários rápidos de um clique.
export const PRESETS = [
  { id: 'sa-east-1:us-east-1', label: { pt: 'São Paulo ↔ Virgínia', en: 'São Paulo ↔ N. Virginia' } },
  { id: 'sa-east-1:eu-west-1', label: { pt: 'São Paulo ↔ Dublin', en: 'São Paulo ↔ Dublin' } },
  { id: 'us-east-1:eu-central-1', label: { pt: 'Virgínia ↔ Frankfurt', en: 'N. Virginia ↔ Frankfurt' } },
  { id: 'us-east-1:ap-northeast-1', label: { pt: 'Virgínia ↔ Tóquio', en: 'N. Virginia ↔ Tokyo' } },
  { id: 'eu-west-1:ap-southeast-1', label: { pt: 'Dublin ↔ Cingapura', en: 'Dublin ↔ Singapore' } },
  { id: 'us-west-2:ap-southeast-2', label: { pt: 'Oregon ↔ Sydney', en: 'Oregon ↔ Sydney' } },
]

export function getRegionById(id) {
  return CLOUD_REGIONS.find((r) => r.id === id) || null
}

export function toRadians(deg) {
  return (deg * Math.PI) / 180
}

// Distância geodésica entre dois pontos na superfície da Terra usando a
// fórmula de Haversine. Retorna quilômetros.
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // raio médio da Terra em km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Estimativa de latência a partir da distância.
export function calculateLatency(distanceKm, cableFactor = DEFAULT_CABLE_FACTOR, realisticFactor = DEFAULT_REALISTIC_FACTOR) {
  const oneWayMinMs = distanceKm / SPEED_OF_LIGHT_KM_MS * cableFactor
  const rttMinMs = oneWayMinMs * 2
  const rttRealisticMs = rttMinMs * realisticFactor
  return {
    distanceKm,
    oneWayMinMs,
    rttMinMs,
    rttRealisticMs,
  }
}

export function formatNumber(n, maximumFractionDigits = 2) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { maximumFractionDigits })
}

// Gera uma matriz resumida de RTT realista entre as regiões mais populares.
export function buildQuickTable(regionIds) {
  const regions = regionIds.map(getRegionById).filter(Boolean)
  const rows = []
  for (let i = 0; i < regions.length; i += 1) {
    for (let j = i + 1; j < regions.length; j += 1) {
      const a = regions[i]
      const b = regions[j]
      const distance = haversineDistance(a.lat, a.lon, b.lat, b.lon)
      const { rttRealisticMs } = calculateLatency(distance)
      rows.push({
        key: `${a.id}:${b.id}`,
        from: a,
        to: b,
        distanceKm: distance,
        rttMs: rttRealisticMs,
      })
    }
  }
  return rows.sort((a, b) => a.rttMs - b.rttMs)
}
