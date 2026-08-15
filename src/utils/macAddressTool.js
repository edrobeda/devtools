/**
 * MAC Address tool — 100% client-side utilities to generate, validate,
 * normalize and format MAC addresses (EUI-48 / IEEE 802).
 *
 * A MAC address is 6 bytes represented as 12 hexadecimal digits.
 * The two least-significant bits of the first byte have special meaning:
 *   - bit 0 (IG): 0 = unicast, 1 = multicast
 *   - bit 1 (U/L): 0 = universal (OUI assigned), 1 = locally administered
 */

const MAC_RE = /^[0-9a-f]{12}$/i

export const FORMATS = {
  colon: { id: 'colon', label: 'Colon', labelPt: 'Dois pontos', example: '00:1a:2b:3c:4d:5e' },
  hyphen: { id: 'hyphen', label: 'Hyphen', labelPt: 'Hífen', example: '00-1a-2b-3c-4d-5e' },
  dot: { id: 'dot', label: 'Cisco dot', labelPt: 'Ponto Cisco', example: '001a.2b3c.4d5e' },
  raw: { id: 'raw', label: 'Raw', labelPt: 'Puro', example: '001a2b3c4d5e' },
}

export const OUI_PRESETS = [
  { value: '', label: 'Random', labelPt: 'Aleatório' },
  { value: '00:50:56', label: 'VMware', labelPt: 'VMware' },
  { value: '08:00:27', label: 'VirtualBox', labelPt: 'VirtualBox' },
  { value: '52:54:00', label: 'QEMU/KVM', labelPt: 'QEMU/KVM' },
  { value: '02:42:ac', label: 'Docker', labelPt: 'Docker' },
]

export function normalize(mac) {
  if (typeof mac !== 'string') return ''
  return mac
    .toLowerCase()
    .replace(/[^0-9a-f]/g, '')
    .slice(0, 12)
}

export function isValid(mac) {
  const clean = normalize(mac)
  return clean.length === 12 && MAC_RE.test(clean)
}

export function formatMac(mac, format = 'colon') {
  const clean = normalize(mac)
  if (clean.length !== 12) return clean

  switch (format) {
    case 'hyphen':
      return clean.match(/.{2}/g).join('-')
    case 'dot':
      return clean.match(/.{4}/g).join('.')
    case 'raw':
      return clean
    case 'colon':
    default:
      return clean.match(/.{2}/g).join(':')
  }
}

export function parseFirstByte(cleanMac) {
  const first = parseInt(cleanMac.slice(0, 2), 16)
  return {
    multicast: (first & 0x01) === 0x01,
    local: (first & 0x02) === 0x02,
    first,
  }
}

export function getMacInfo(mac) {
  const clean = normalize(mac)
  if (!isValid(mac)) {
    return { valid: false, clean }
  }

  const { multicast, local, first } = parseFirstByte(clean)
  const oui = clean.slice(0, 6).toUpperCase()

  return {
    valid: true,
    clean,
    oui,
    formatted: {
      colon: formatMac(clean, 'colon'),
      hyphen: formatMac(clean, 'hyphen'),
      dot: formatMac(clean, 'dot'),
      raw: formatMac(clean, 'raw'),
    },
    type: {
      scope: local ? 'locallyAdministered' : 'universal',
      transmission: multicast ? 'multicast' : 'unicast',
    },
    bits: {
      firstByteHex: `0x${first.toString(16).padStart(2, '0')}`,
      firstByteBinary: first.toString(2).padStart(8, '0'),
      localBitSet: local,
      multicastBitSet: multicast,
    },
  }
}

export function applyFirstByteFlags(firstByteHex, { local = false, multicast = false } = {}) {
  let byte = parseInt(firstByteHex, 16) & 0xfc
  if (local) byte |= 0x02
  if (multicast) byte |= 0x01
  return byte.toString(16).padStart(2, '0')
}

function randomHexByte() {
  return Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, '0')
}

export function generateMac({
  format = 'colon',
  local = true,
  multicast = false,
  prefix = '',
  upperCase = false,
} = {}) {
  const prefixClean = normalize(prefix)
  const prefixBytes = prefixClean.slice(0, 12).match(/.{2}/g) || []

  // Fill remaining bytes with random values.
  const bytes = [...prefixBytes]
  while (bytes.length < 6) {
    bytes.push(randomHexByte())
  }

  // Apply scope/transmission flags to the first byte.
  bytes[0] = applyFirstByteFlags(bytes[0], { local, multicast })

  const raw = bytes.join('')
  let result = formatMac(raw, format)
  if (upperCase) result = result.toUpperCase()
  return result
}

export function generateMultiple(count, options) {
  const macs = new Set()
  let attempts = 0
  while (macs.size < count && attempts < count * 100) {
    macs.add(generateMac(options))
    attempts += 1
  }
  return Array.from(macs)
}
