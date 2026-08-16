/**
 * CIDR Overlap & Aggregator — 100% client-side utilities for IPv4 CIDRs.
 *
 * Supports:
 *   - parse and normalize CIDRs
 *   - check overlap / containment between two CIDRs
 *   - aggregate a list of CIDRs into the smallest equivalent set
 *   - summarize a list of CIDRs into the single smallest supernet
 *
 * Uses BigInt internally so all 32 IPv4 bits are handled safely.
 */

const CIDR_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/

export const MAX_PREFIX = 32
export const TOTAL_ADDRESSES = 2n ** 32n

function isByte(n) {
  return Number.isInteger(n) && n >= 0 && n <= 255
}

export function parseIPv4(ip) {
  if (typeof ip !== 'string') return null
  const match = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
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

export function intToIPv4(int) {
  return [
    Number((int >> 24n) & 255n),
    Number((int >> 16n) & 255n),
    Number((int >> 8n) & 255n),
    Number(int & 255n),
  ].join('.')
}

export function prefixToMask(prefix) {
  if (prefix <= 0) return 0n
  if (prefix >= 32) return TOTAL_ADDRESSES - 1n
  return TOTAL_ADDRESSES - (2n ** BigInt(32 - prefix))
}

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
  const mask = prefixToMask(prefix)
  const network = ipInt & mask
  const broadcast = network | ~mask & (TOTAL_ADDRESSES - 1n)
  const size = 2n ** BigInt(32 - prefix)

  return {
    valid: true,
    original: cidr.trim(),
    normalized: `${intToIPv4(network)}/${prefix}`,
    network,
    broadcast,
    prefix,
    size,
    mask: intToIPv4(mask),
  }
}

export function cidrContains(container, contained) {
  if (!container.valid || !contained.valid) return false
  return (
    container.network <= contained.network &&
    container.broadcast >= contained.broadcast
  )
}

export function cidrsOverlap(a, b) {
  if (!a.valid || !b.valid) return false
  return (
    a.network <= b.broadcast &&
    a.broadcast >= b.network
  )
}

/**
 * Aggregate a list of IPv4 CIDRs into the smallest equivalent set.
 * Returns an object with the aggregated CIDR strings, stats and any invalid inputs.
 */
export function aggregateCidrs(inputs) {
  const parsed = inputs
    .map((input) => parseCidr(input))
    .filter((c) => c.valid)
    .map((c) => ({ ...c, normalized: `${intToIPv4(c.network)}/${c.prefix}` }))

  const invalid = inputs
    .map((input) => parseCidr(input))
    .filter((c) => !c.valid)
    .map((c) => c.original)

  if (parsed.length === 0) {
    return {
      aggregated: [],
      removed: 0,
      originalCount: inputs.length,
      validCount: 0,
      invalid,
      stats: {
        originalAddresses: 0n,
        aggregatedAddresses: 0n,
        reduction: 0,
      },
    }
  }

  // Sort by network address, then by prefix descending (more specific first).
  const sorted = [...parsed].sort((a, b) => {
    if (a.network < b.network) return -1
    if (a.network > b.network) return 1
    return b.prefix - a.prefix
  })

  // First pass: discard CIDRs fully contained by a broader/previous one.
  const reduced = []
  for (const c of sorted) {
    const last = reduced[reduced.length - 1]
    if (last && cidrContains(last, c)) continue
    reduced.push(c)
  }

  // Second pass: repeatedly merge adjacent sibling blocks.
  let working = reduced
  let changed = true
  while (changed) {
    changed = false
    working.sort((a, b) => {
      if (a.network < b.network) return -1
      if (a.network > b.network) return 1
      return a.prefix - b.prefix
    })

    const next = []
    let i = 0
    while (i < working.length) {
      const current = working[i]
      const siblingPrefix = current.prefix - 1
      if (siblingPrefix < 0) {
        next.push(current)
        i += 1
        continue
      }

      const blockSize = 2n ** BigInt(32 - current.prefix)
      const siblingNetwork = current.network ^ blockSize

      const siblingIndex = working.findIndex(
        (c, idx) =>
          idx > i &&
          c.prefix === current.prefix &&
          c.network === siblingNetwork
      )

      if (siblingIndex !== -1) {
        const mask = prefixToMask(siblingPrefix)
        const mergedNetwork = current.network & mask
        next.push({
          valid: true,
          original: `${intToIPv4(mergedNetwork)}/${siblingPrefix}`,
          normalized: `${intToIPv4(mergedNetwork)}/${siblingPrefix}`,
          network: mergedNetwork,
          broadcast: mergedNetwork | ~mask & (TOTAL_ADDRESSES - 1n),
          prefix: siblingPrefix,
          size: 2n ** BigInt(32 - siblingPrefix),
          mask: intToIPv4(mask),
        })
        i = siblingIndex + 1
        changed = true
      } else {
        next.push(current)
        i += 1
      }
    }
    working = next
  }

  const aggregated = working.map((c) => c.normalized)
  const originalAddresses = parsed.reduce((sum, c) => sum + c.size, 0n)
  const aggregatedAddresses = working.reduce((sum, c) => sum + c.size, 0n)

  return {
    aggregated,
    removed: inputs.length - aggregated.length - invalid.length,
    originalCount: inputs.length,
    validCount: parsed.length,
    invalid,
    stats: {
      originalAddresses,
      aggregatedAddresses,
      reduction:
        originalAddresses === 0n
          ? 0
          : Number(
              ((originalAddresses - aggregatedAddresses) * 10000n) /
                originalAddresses
            ) / 100,
    },
  }
}

/**
 * Summarize a list of IPv4 CIDRs into the single smallest CIDR that contains
 * all of them. Returns the summary CIDR, the exact address range it covers and
 * whether it leaves gaps between the original networks.
 */
export function summarizeCidrs(inputs) {
  const parsed = inputs.map((input) => parseCidr(input)).filter((c) => c.valid)

  if (parsed.length === 0) {
    return {
      summary: null,
      exactRange: null,
      hasGaps: false,
      stats: null,
    }
  }

  const minNetwork = parsed.reduce((min, c) => (c.network < min ? c.network : min), parsed[0].network)
  const maxBroadcast = parsed.reduce((max, c) => (c.broadcast > max ? c.broadcast : max), parsed[0].broadcast)
  const span = maxBroadcast - minNetwork + 1n

  // Compute the smallest prefix whose block size is >= the span.
  let prefix = MAX_PREFIX
  while (prefix > 0) {
    const blockSize = 2n ** BigInt(32 - prefix + 1)
    if (blockSize >= span) {
      prefix -= 1
    } else {
      break
    }
  }

  const mask = prefixToMask(prefix)
  const network = minNetwork & mask
  const broadcast = network | (~mask & (TOTAL_ADDRESSES - 1n))

  // Check whether the summary leaves gaps between the original CIDRs.
  const sorted = [...parsed].sort((a, b) => (a.network < b.network ? -1 : 1))
  let hasGaps = false
  let cursor = network
  for (const c of sorted) {
    if (c.network > cursor) {
      hasGaps = true
      break
    }
    if (c.broadcast + 1n > cursor) {
      cursor = c.broadcast + 1n
    }
  }
  if (cursor <= broadcast) hasGaps = true

  return {
    summary: `${intToIPv4(network)}/${prefix}`,
    exactRange: {
      first: intToIPv4(minNetwork),
      last: intToIPv4(maxBroadcast),
      addresses: Number(span),
    },
    summaryRange: {
      first: intToIPv4(network),
      last: intToIPv4(broadcast),
      addresses: Number(2n ** BigInt(32 - prefix)),
    },
    hasGaps,
    stats: {
      inputCount: parsed.length,
      summaryPrefix: prefix,
    },
  }
}
