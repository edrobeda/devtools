// Motor de análise de ranges SemVer estilo npm (^, ~, x-ranges, hífen, ||).
// Implementação autossuficiente, sem dependências externas.

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

const PARTIAL_RE = /^(\d+|[xX*])(?:\.(\d+|[xX*])(?:\.(\d+|[xX*])(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?)?)?$/

export const REGEXES = { SEMVER_RE, PARTIAL_RE }

function mk(major, minor, patch, prerelease) {
  const pre = prerelease || []
  return {
    major,
    minor,
    patch,
    prerelease: pre,
    raw: `${major}.${minor}.${patch}${pre.length ? '-' + pre.join('.') : ''}`,
  }
}

export function parseVersion(raw) {
  const str = (raw || '').trim()
  const m = SEMVER_RE.exec(str)
  if (!m) return null
  return {
    raw: str,
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ? m[4].split('.') : [],
    build: m[5] ? m[5].split('.') : [],
  }
}

function parsePartial(str) {
  const m = PARTIAL_RE.exec((str || '').trim())
  if (!m) return null
  const parts = []
  for (let i = 1; i <= 3; i++) {
    if (m[i] === undefined || /^[xX*]$/.test(m[i])) parts.push(null)
    else parts.push(Number(m[i]))
  }
  const prerelease = m[4] ? m[4].split('.') : []
  return { parts, prerelease }
}

function compareIdentifier(a, b) {
  const aNum = /^\d+$/.test(a)
  const bNum = /^\d+$/.test(b)
  if (aNum && bNum) return Number(a) - Number(b)
  if (aNum && !bNum) return -1
  if (!aNum && bNum) return 1
  return a < b ? -1 : a > b ? 1 : 0
}

function comparePrerelease(a, b) {
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0) return 1
  if (b.length === 0) return -1
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] === undefined) return -1
    if (b[i] === undefined) return 1
    const c = compareIdentifier(a[i], b[i])
    if (c !== 0) return c
  }
  return 0
}

export function compareSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  return comparePrerelease(a.prerelease, b.prerelease)
}

function rangeFromPartial(parts, prerelease, notEqual) {
  const [M, m, p] = parts
  if (notEqual) {
    if (M !== null && m !== null && p !== null) return [{ op: '!=', semver: mk(M, m, p, prerelease) }]
    return []
  }
  if (M === null) return []
  if (m === null) {
    return [
      { op: '>=', semver: mk(M, 0, 0, []) },
      { op: '<', semver: mk(M + 1, 0, 0, []) },
    ]
  }
  if (p === null) {
    return [
      { op: '>=', semver: mk(M, m, 0, []) },
      { op: '<', semver: mk(M, m + 1, 0, []) },
    ]
  }
  return [{ op: '=', semver: mk(M, m, p, prerelease) }]
}

function comparatorFromPartial(op, parts, prerelease) {
  const [M, m, p] = parts
  if (op === '>=') {
    return {
      op: '>=',
      semver: mk(M === null ? 0 : M, m === null ? 0 : m, p === null ? 0 : p, prerelease),
    }
  }
  if (op === '>') {
    if (M !== null && m === null) return { op: '>=', semver: mk(M + 1, 0, 0, []) }
    if (M !== null && m !== null && p === null) return { op: '>=', semver: mk(M, m + 1, 0, []) }
    return {
      op: '>',
      semver: mk(M === null ? 0 : M, m === null ? 0 : m, p === null ? 0 : p, prerelease),
    }
  }
  if (op === '<') {
    if (M !== null && m === null) return { op: '<', semver: mk(M, 0, 0, []) }
    return {
      op: '<',
      semver: mk(M === null ? 0 : M, m === null ? 0 : m, p === null ? 0 : p, prerelease),
    }
  }
  if (op === '<=') {
    if (M !== null && m === null) return { op: '<', semver: mk(M + 1, 0, 0, []) }
    if (M !== null && m !== null && p === null) return { op: '<', semver: mk(M, m + 1, 0, []) }
    if (M === null) return { op: '<', semver: mk(0, 0, 0, []) }
    return { op: '<=', semver: mk(M, m, p === null ? 0 : p, prerelease) }
  }
  return null
}

function tildeFromParts(parts, prerelease) {
  const [M, m, p] = parts
  if (M === null) return []
  if (m === null) {
    return [
      { op: '>=', semver: mk(M, 0, 0, []) },
      { op: '<', semver: mk(M + 1, 0, 0, []) },
    ]
  }
  if (p === null) {
    return [
      { op: '>=', semver: mk(M, m, 0, []) },
      { op: '<', semver: mk(M, m + 1, 0, []) },
    ]
  }
  return [
    { op: '>=', semver: mk(M, m, p, prerelease) },
    { op: '<', semver: mk(M, m + 1, 0, []) },
  ]
}

function caretFromParts(parts, prerelease) {
  const [M, m, p] = parts
  if (M === null) return []
  const lower = { op: '>=', semver: mk(M, m === null ? 0 : m, p === null ? 0 : p, prerelease) }
  if (M > 0) return [lower, { op: '<', semver: mk(M + 1, 0, 0, []) }]
  if (m === null) return [lower, { op: '<', semver: mk(1, 0, 0, []) }]
  if (m > 0) return [lower, { op: '<', semver: mk(0, m + 1, 0, []) }]
  if (p === null) return [lower, { op: '<', semver: mk(0, 1, 0, []) }]
  if (p > 0) return [lower, { op: '<', semver: mk(0, 0, p + 1, []) }]
  return [{ op: '=', semver: mk(0, 0, 0, []) }]
}

function hyphenLeft(partialRaw) {
  const pp = parsePartial(partialRaw)
  if (!pp) return null
  const [M, m, p] = pp.parts
  return {
    op: '>=',
    semver: mk(M === null ? 0 : M, m === null ? 0 : m, p === null ? 0 : p, pp.prerelease),
  }
}

function hyphenRight(partialRaw) {
  const pp = parsePartial(partialRaw)
  if (!pp) return null
  const [M, m, p] = pp.parts
  if (M === null) return { op: '>=', semver: mk(0, 0, 0, []) }
  if (m === null) return { op: '<', semver: mk(M + 1, 0, 0, []) }
  if (p === null) return { op: '<', semver: mk(M, m + 1, 0, []) }
  return { op: '<=', semver: mk(M, m, p, pp.prerelease) }
}

const OPERATORS = ['>=', '<=', '!=', '>', '<', '=', '~', '^']

function computeBounds(comparators) {
  let lower = null
  let upper = null
  for (const c of comparators) {
    if (c.op === '>=' || c.op === '>') {
      if (!lower || compareSemver(c.semver, lower.semver) > 0) lower = c
    } else if (c.op === '<=' || c.op === '<') {
      if (!upper || compareSemver(c.semver, upper.semver) < 0) upper = c
    } else if (c.op === '=') {
      if (!lower) lower = c
      if (!upper) upper = c
    }
  }
  return { lower, upper }
}

function finalizeSet(comparators, rawAlt) {
  const unique = []
  for (const c of comparators) {
    const key = `${c.op}${c.semver.raw}`
    if (!unique.some((u) => `${u.op}${u.semver.raw}` === key)) unique.push(c)
  }
  return {
    raw: rawAlt,
    comparators: unique,
    normalized: unique.length ? unique.map((c) => `${c.op}${c.semver.raw}`).join(' ') : '*',
    bounds: computeBounds(unique),
    isAny: unique.length === 0,
    isExact: unique.length === 1 && unique[0].op === '=',
  }
}

function translateSet(alt) {
  const hy = /\s+-\s+/.exec(alt)
  if (hy) {
    const before = alt.slice(0, hy.index)
    const after = alt.slice(hy.index + hy[0].length)
    if (!before.trim() || !after.trim()) return { valid: false, error: 'hyphen' }
    const left = hyphenLeft(before)
    const right = hyphenRight(after)
    if (!left || !right) return { valid: false, error: 'hyphen' }
    return { valid: true, set: finalizeSet([left, right], alt) }
  }

  const tokens = (alt || '').trim().split(/\s+/)
  if (tokens.length === 1 && /^[*xX]$/.test(tokens[0])) {
    return { valid: true, set: finalizeSet([], tokens[0]) }
  }

  const comparators = []
  for (let i = 0; i < tokens.length; i++) {
    let tok = tokens[i]
    if (!tok) continue
    let op = ''
    let rest = tok
    if (OPERATORS.includes(tok)) {
      op = tok
      rest = tokens[++i] || ''
    } else {
      const matched = OPERATORS.filter((o) => tok.startsWith(o)).sort((a, b) => b.length - a.length)[0]
      if (matched) {
        op = matched
        rest = tok.slice(matched.length) || tokens[++i] || ''
      }
    }
    if (!rest) return { valid: false, error: 'token' }
    const pp = parsePartial(rest)
    if (!pp) return { valid: false, error: 'version' }

    if (op === '' || op === '=') {
      comparators.push(...rangeFromPartial(pp.parts, pp.prerelease, false))
    } else if (op === '!=') {
      comparators.push(...rangeFromPartial(pp.parts, pp.prerelease, true))
    } else if (op === '~') {
      comparators.push(...tildeFromParts(pp.parts, pp.prerelease))
    } else if (op === '^') {
      comparators.push(...caretFromParts(pp.parts, pp.prerelease))
    } else {
      const c = comparatorFromPartial(op, pp.parts, pp.prerelease)
      if (!c) return { valid: false, error: 'token' }
      comparators.push(c)
    }
  }
  return { valid: true, set: finalizeSet(comparators, alt) }
}

export function parseRange(input) {
  const raw = (input || '').trim()
  if (!raw) return { valid: false, error: 'empty', sets: [] }
  if (/^[*xX]$/.test(raw)) return { valid: true, sets: [finalizeSet([], raw)] }
  const alternatives = raw.split(/\s*\|\|\s*/)
  if (alternatives.some((a) => !a.trim())) return { valid: false, error: 'or', sets: [] }
  const sets = []
  for (const alt of alternatives) {
    const tr = translateSet(alt)
    if (!tr.valid) return { valid: false, error: tr.error, sets: [] }
    sets.push(tr.set)
  }
  return { valid: true, sets }
}

export function normalizeRange(input) {
  const r = parseRange(input)
  if (!r.valid) return null
  return r.sets.map((s) => s.normalized).join(' || ')
}

function cmpMatches(c, v) {
  const d = compareSemver(v, c.semver)
  switch (c.op) {
    case '>=': return d >= 0
    case '>': return d > 0
    case '<=': return d <= 0
    case '<': return d < 0
    case '=': return d === 0
    case '!=': return d !== 0
    default: return false
  }
}

function setSatisfies(v, set) {
  if (set.comparators.length === 0) return true
  if (v.prerelease.length) {
    const tuple = `${v.major}.${v.minor}.${v.patch}`
    const hasPrereleaseComparator = set.comparators.some(
      (c) => c.semver.prerelease.length && `${c.semver.major}.${c.semver.minor}.${c.semver.patch}` === tuple
    )
    if (!hasPrereleaseComparator) return false
  }
  return set.comparators.every((c) => cmpMatches(c, v))
}

export function satisfies(versionInput, rangeInput) {
  const v = parseVersion(versionInput)
  if (!v) return { match: false, reason: 'version', version: null }
  const r = parseRange(rangeInput)
  if (!r.valid) return { match: false, reason: 'range', error: r.error, version: v }
  for (let i = 0; i < r.sets.length; i++) {
    if (setSatisfies(v, r.sets[i])) return { match: true, setIndex: i, set: r.sets[i], version: v }
  }
  return { match: false, reason: 'nomatch', version: v }
}