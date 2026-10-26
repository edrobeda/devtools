// Primitivas compartilhadas de IPv4/CIDR (BigInt, exato nos 32 bits).
//
// Usadas pela Calculadora de Sub-rede (/network/subnet-calculator) e pelo
// agregador de sobreposição de CIDR (/network/cidr-overlap-aggregator).
//
// As duas páginas precisavam exatamente da mesma matemática — parse do
// dotted-quad, conversão para inteiro de 32 bits, prefixo -> máscara,
// endereço de rede e de broadcast — e cada uma mantinha sua cópia do zero
// (a calculadora em Number, o agregador em BigInt). Este módulo é a
// implementação única: o parse é feito em BigInt (exato nos 32 bits) e quem
// precisa de Number converte explicitamente com Number(...).
//
// O prefixo 0 continua produzindo máscara 0 (prefixToMask) e o prefixo 32
// produz 0xffffffff — a máscara é sempre a mesma para as duas páginas.

export const MAX_PREFIX = 32
export const TOTAL_ADDRESSES = 2n ** 32n

export const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
export const CIDR_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/

export function isByte(n) {
  return Number.isInteger(n) && n >= 0 && n <= 255
}

// "192.168.1.10" -> 3232235786n (null se não for um IPv4 válido).
export function parseIPv4(ip) {
  if (typeof ip !== 'string') return null
  const match = ip.trim().match(IPV4_RE)
  if (!match) return null
  const parts = match.slice(1, 5).map(Number)
  if (!parts.every(isByte)) return null
  return (
    (BigInt(parts[0]) << 24n) |
    (BigInt(parts[1]) << 16n) |
    (BigInt(parts[2]) << 8n) |
    BigInt(parts[3])
  )
}

// 3232235786n -> "192.168.1.10".
export function intToIPv4(int) {
  return [
    Number((int >> 24n) & 255n),
    Number((int >> 16n) & 255n),
    Number((int >> 8n) & 255n),
    Number(int & 255n),
  ].join('.')
}

// Prefixo -> máscara de 32 bits (0 -> 0, 32 -> 0xffffffff).
export function prefixToMask(prefix) {
  if (prefix <= 0) return 0n
  if (prefix >= 32) return TOTAL_ADDRESSES - 1n
  return TOTAL_ADDRESSES - (2n ** BigInt(32 - prefix))
}

// Complemento da máscara dentro dos 32 bits (wildcard mask).
export function maskToWildcard(mask) {
  return ~mask & (TOTAL_ADDRESSES - 1n)
}

// "192.168.1.10/24" -> os dados do bloco (rede, broadcast, máscara, tamanho).
// Em entrada inválida devolve { valid: false, original, error }.
export function parseCidr(cidr) {
  if (typeof cidr !== 'string') {
    return { valid: false, original: String(cidr), error: 'not_a_string' }
  }
  const match = cidr.trim().match(CIDR_RE)
  if (!match) {
    return { valid: false, original: cidr.trim(), error: 'invalid_format' }
  }
  const parts = match.slice(1, 5).map(Number)
  const prefix = Number(match[5])
  if (!parts.every(isByte)) {
    return { valid: false, original: cidr.trim(), error: 'octet_out_of_range' }
  }
  if (prefix < 0 || prefix > MAX_PREFIX) {
    return { valid: false, original: cidr.trim(), error: 'prefix_out_of_range' }
  }

  const ipInt = parseIPv4(parts.join('.'))
  if (ipInt === null) {
    return { valid: false, original: cidr.trim(), error: 'invalid_format' }
  }
  const mask = prefixToMask(prefix)
  const wildcard = maskToWildcard(mask)
  const network = ipInt & mask
  const broadcast = network | wildcard
  const size = 2n ** BigInt(32 - prefix)

  return {
    valid: true,
    original: cidr.trim(),
    normalized: `${intToIPv4(network)}/${prefix}`,
    network,
    broadcast,
    prefix,
    size,
    mask,
    wildcard,
  }
}
