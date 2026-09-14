const HASH_FUNCTIONS = {
  djb2: {
    name: 'DJB2',
    compute: (str) => {
      let hash = 5381
      for (let i = 0; i < str.length; i += 1) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0
      }
      return hash >>> 0
    },
  },
  fnv1a: {
    name: 'FNV-1a',
    compute: (str) => {
      let hash = 0x811c9dc5
      for (let i = 0; i < str.length; i += 1) {
        hash ^= str.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193) >>> 0
      }
      return hash >>> 0
    },
  },
  java: {
    name: 'Java hashCode',
    compute: (str) => {
      let hash = 0
      for (let i = 0; i < str.length; i += 1) {
        hash = (Math.imul(hash, 31) + str.charCodeAt(i)) >>> 0
      }
      return hash >>> 0
    },
  },
  knuth: {
    name: 'Multiplicativo (Knuth)',
    compute: (str) => {
      let hash = 0
      for (let i = 0; i < str.length; i += 1) {
        hash = (Math.imul(hash, 2654435761) ^ str.charCodeAt(i)) >>> 0
      }
      return hash >>> 0
    },
  },
}

function computeHash(hashFnName, key) {
  return HASH_FUNCTIONS[hashFnName].compute(key) >>> 0
}

function bucketIndex(hashFnName, key, bucketCount) {
  return computeHash(hashFnName, key) % bucketCount
}

function createHashTable(bucketCount, hashFnName) {
  const buckets = Array.from({ length: bucketCount }, () => [])
  let size = 0

  const insert = (key, value) => {
    const hash = computeHash(hashFnName, key)
    const idx = hash % bucketCount
    const bucket = buckets[idx]
    const foundIdx = bucket.findIndex((e) => e.key === key)
    if (foundIdx >= 0) {
      bucket[foundIdx].value = value
      return { ok: true, updated: true, collision: false, hash, idx, chainLength: bucket.length }
    }
    const collision = bucket.length > 0
    bucket.push({ key, value })
    size += 1
    return { ok: true, updated: false, collision, hash, idx, chainLength: bucket.length }
  }

  const remove = (key) => {
    const hash = computeHash(hashFnName, key)
    const idx = hash % bucketCount
    const bucket = buckets[idx]
    const foundIdx = bucket.findIndex((e) => e.key === key)
    if (foundIdx < 0) {
      return { ok: false, hash, idx, chainLength: bucket.length }
    }
    bucket.splice(foundIdx, 1)
    size -= 1
    return { ok: true, hash, idx, chainLength: bucket.length }
  }

  const find = (key) => {
    const hash = computeHash(hashFnName, key)
    const idx = hash % bucketCount
    const bucket = buckets[idx]
    const position = bucket.findIndex((e) => e.key === key)
    return { ok: position >= 0, hash, idx, position, chainLength: bucket.length }
  }

  const stats = () => {
    const totalEntries = buckets.reduce((sum, b) => sum + b.length, 0)
    const nonEmpty = buckets.filter((b) => b.length > 0).length
    const longestChain = buckets.reduce((max, b) => Math.max(max, b.length), 0)
    const collisions = buckets.reduce((sum, b) => sum + Math.max(0, b.length - 1), 0)
    const avgOccupied = nonEmpty ? totalEntries / nonEmpty : 0
    const avgAll = bucketCount ? totalEntries / bucketCount : 0
    const loadFactor = bucketCount ? totalEntries / bucketCount : 0
    return {
      totalEntries,
      nonEmpty,
      longestChain,
      collisions,
      avgOccupied,
      avgAll,
      loadFactor,
      emptyBuckets: bucketCount - nonEmpty,
    }
  }

  return { buckets, size, insert, remove, find, stats }
}

const sourceCode = () => `const HASH_FUNCTIONS = {
  djb2: (str) => {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0
    }
    return hash >>> 0
  },
  fnv1a: (str) => {
    let hash = 0x811c9dc5
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash >>> 0
  },
  java: (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(hash, 31) + str.charCodeAt(i)) >>> 0
    }
    return hash >>> 0
  },
}

function createHashTable(bucketCount, hashFn) {
  const buckets = Array.from({ length: bucketCount }, () => [])
  let size = 0

  const insert = (key, value) => {
    const idx = hashFn(key) % bucketCount
    const bucket = buckets[idx]
    const existing = bucket.findIndex((e) => e.key === key)
    if (existing >= 0) {
      bucket[existing].value = value
      return { updated: true, idx }
    }
    bucket.push({ key, value })
    size += 1
    return { updated: false, collision: bucket.length > 1, idx }
  }

  const remove = (key) => {
    const idx = hashFn(key) % bucketCount
    const bucket = buckets[idx]
    const i = bucket.findIndex((e) => e.key === key)
    if (i < 0) return false
    bucket.splice(i, 1)
    size -= 1
    return true
  }

  const find = (key) => {
    const idx = hashFn(key) % bucketCount
    return buckets[idx].some((e) => e.key === key)
  }

  return {
    get size() { return size },
    get buckets() { return buckets },
    insert, remove, find,
  }
}`.trim()

export { HASH_FUNCTIONS, computeHash, bucketIndex, createHashTable, sourceCode }