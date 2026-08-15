// Simulador de cache de memoria — 100% client-side.
// Suporta mapeamento direto, totalmente associativo e associativo por
// conjunto, com politicas de substituicao LRU, FIFO, LFU e Random.

export const MAPPINGS = ['direct', 'fully-associative', 'set-associative']
export const REPLACEMENTS = ['LRU', 'FIFO', 'LFU', 'Random']

function log2(value) {
  return Math.log2(value)
}

function isPowerOfTwo(value) {
  return value > 0 && (value & (value - 1)) === 0
}

function parseSequence(input, base = 'dec') {
  if (Array.isArray(input)) return input.map((x) => Number(x)).filter((n) => Number.isFinite(n))
  const parts = String(input)
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts
    .map((p) => {
      const cleaned = p.replace(/^0x/i, '')
      return base === 'hex' ? parseInt(cleaned, 16) : parseInt(cleaned, 10)
    })
    .filter((n) => Number.isFinite(n) && n >= 0)
}

function normalizeConfig(raw) {
  const mapping = MAPPINGS.includes(raw.mapping) ? raw.mapping : 'direct'
  const cacheSize = Math.max(16, Math.min(8192, Number(raw.cacheSize) || 64))
  const blockSize = Math.max(8, Math.min(512, Number(raw.blockSize) || 16))
  let ways = Math.max(1, Math.min(32, Number(raw.ways) || 1))

  // Garante que tamanhos sao potencias de 2 e que o bloco cabe na cache.
  const normalizedCacheSize = 2 ** Math.round(log2(cacheSize))
  const normalizedBlockSize = 2 ** Math.round(log2(blockSize))
  const safeBlockSize = Math.min(normalizedBlockSize, normalizedCacheSize)
  const numBlocks = Math.floor(normalizedCacheSize / safeBlockSize)

  if (mapping === 'direct') {
    ways = 1
  } else if (mapping === 'fully-associative') {
    ways = numBlocks
  } else {
    ways = Math.min(ways, numBlocks)
    ways = Math.max(1, ways)
  }

  const numSets = Math.floor(numBlocks / ways)
  const offsetBits = Math.round(log2(safeBlockSize))
  const indexBits = numSets > 1 ? Math.round(log2(numSets)) : 0
  const tagBits = 32 - offsetBits - indexBits

  return {
    mapping,
    cacheSize: normalizedCacheSize,
    blockSize: safeBlockSize,
    ways,
    numSets,
    numBlocks,
    offsetBits,
    indexBits,
    tagBits,
    replacement: REPLACEMENTS.includes(raw.replacement) ? raw.replacement : 'LRU',
    addressBase: raw.addressBase === 'hex' ? 'hex' : 'dec',
  }
}

function createLine() {
  return {
    valid: false,
    tag: null,
    lastUsed: 0,
    insertedAt: 0,
    accessCount: 0,
  }
}

function createCache(config) {
  return Array.from({ length: config.numSets }, () =>
    Array.from({ length: config.ways }, () => createLine())
  )
}

function blockId(setIndex, tag) {
  return `${setIndex}:${tag}`
}

function findVictim(set, replacement, tick) {
  const occupied = set.filter((line) => line.valid)
  if (occupied.length === 0) return set.findIndex((line) => !line.valid)
  if (occupied.length === set.length) {
    // Conjunto cheio: aplica politica.
    switch (replacement) {
      case 'FIFO':
        return set.indexOf(occupied.reduce((a, b) => (a.insertedAt < b.insertedAt ? a : b)))
      case 'LFU': {
        const minCount = Math.min(...occupied.map((l) => l.accessCount))
        const candidates = occupied.filter((l) => l.accessCount === minCount)
        return set.indexOf(candidates.reduce((a, b) => (a.insertedAt < b.insertedAt ? a : b)))
      }
      case 'Random':
        return set.indexOf(occupied[Math.floor(Math.random() * occupied.length)])
      case 'LRU':
      default:
        return set.indexOf(occupied.reduce((a, b) => (a.lastUsed < b.lastUsed ? a : b)))
    }
  }
  return set.findIndex((line) => !line.valid)
}

function cloneLine(line) {
  return { ...line }
}

function cloneCache(cache) {
  return cache.map((set) => set.map(cloneLine))
}

export function simulateCache(rawConfig) {
  const config = normalizeConfig(rawConfig)
  const sequence = parseSequence(rawConfig.sequence, config.addressBase)
  const cache = createCache(config)
  const allBlocks = new Set()
  const steps = []
  let hits = 0
  let misses = 0
  let compulsory = 0
  let conflict = 0
  let capacity = 0
  let tick = 0

  sequence.forEach((address) => {
    tick += 1
    const blockAddress = Math.floor(address / config.blockSize) * config.blockSize
    const offset = address & ((1 << config.offsetBits) - 1)
    const setIndex = config.numSets > 1
      ? (address >> config.offsetBits) & ((1 << config.indexBits) - 1)
      : 0
    const tag = address >> (config.offsetBits + config.indexBits)
    const set = cache[setIndex]

    const hitIndex = set.findIndex((line) => line.valid && line.tag === tag)
    let hit = false
    let victimLine = null
    let targetIndex = -1
    let missType = null

    if (hitIndex !== -1) {
      hit = true
      targetIndex = hitIndex
      set[targetIndex].lastUsed = tick
      set[targetIndex].accessCount += 1
      hits += 1
    } else {
      targetIndex = findVictim(set, config.replacement, tick)
      victimLine = set[targetIndex].valid ? { ...set[targetIndex] } : null
      set[targetIndex] = {
        valid: true,
        tag,
        lastUsed: tick,
        insertedAt: tick,
        accessCount: 1,
      }
      misses += 1

      const id = blockId(setIndex, tag)
      if (!allBlocks.has(id)) {
        compulsory += 1
        missType = 'compulsory'
        allBlocks.add(id)
      } else if (config.mapping === 'direct') {
        conflict += 1
        missType = 'conflict'
      } else {
        capacity += 1
        missType = 'capacity'
      }
    }

    steps.push({
      address,
      blockAddress,
      offset,
      setIndex,
      tag,
      hit,
      targetIndex,
      victimLine,
      missType,
      cacheSnapshot: cloneCache(cache),
    })
  })

  const total = hits + misses
  return {
    config,
    sequence,
    steps,
    stats: {
      hits,
      misses,
      compulsory,
      conflict,
      capacity,
      total,
      hitRate: total ? (hits / total) * 100 : 0,
      missRate: total ? (misses / total) * 100 : 0,
    },
  }
}

export const PRESETS = {
  pt: [
    {
      key: 'localidade',
      label: 'Localidade espacial (direto)',
      mapping: 'direct',
      cacheSize: 64,
      blockSize: 16,
      ways: 1,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 4 8 12 16 20 24 28 32 36 40 44',
    },
    {
      key: 'conflito',
      label: 'Conflito de mapeamento',
      mapping: 'direct',
      cacheSize: 64,
      blockSize: 16,
      ways: 1,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 64 128 0 64 128',
    },
    {
      key: 'associativo',
      label: 'Associativo por conjunto (2 vias)',
      mapping: 'set-associative',
      cacheSize: 64,
      blockSize: 16,
      ways: 2,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 64 128 0 64 128 192',
    },
    {
      key: 'total',
      label: 'Totalmente associativo',
      mapping: 'fully-associative',
      cacheSize: 64,
      blockSize: 16,
      ways: 4,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 32 64 96 0 32 128 64',
    },
  ],
  en: [
    {
      key: 'spatial',
      label: 'Spatial locality (direct)',
      mapping: 'direct',
      cacheSize: 64,
      blockSize: 16,
      ways: 1,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 4 8 12 16 20 24 28 32 36 40 44',
    },
    {
      key: 'conflict',
      label: 'Mapping conflict',
      mapping: 'direct',
      cacheSize: 64,
      blockSize: 16,
      ways: 1,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 64 128 0 64 128',
    },
    {
      key: 'set-assoc',
      label: 'Set-associative (2 ways)',
      mapping: 'set-associative',
      cacheSize: 64,
      blockSize: 16,
      ways: 2,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 64 128 0 64 128 192',
    },
    {
      key: 'fully',
      label: 'Fully associative',
      mapping: 'fully-associative',
      cacheSize: 64,
      blockSize: 16,
      ways: 4,
      replacement: 'LRU',
      addressBase: 'dec',
      sequence: '0 32 64 96 0 32 128 64',
    },
  ],
}

export function sourceCode() {
  return `function simulateCache(config) {
  const {
    cacheSize,      // bytes
    blockSize,      // bytes
    ways,           // 1 = direct mapped
    replacement,    // 'LRU' | 'FIFO' | 'LFU' | 'Random'
  } = config;

  const numBlocks = cacheSize / blockSize;
  const numSets = numBlocks / ways;
  const offsetBits = Math.log2(blockSize);
  const indexBits = Math.log2(numSets);

  // Cada conjunto com \`ways\` linhas.
  const cache = Array.from({ length: numSets }, () =>
    Array.from({ length: ways }, () => ({ valid: false, tag: null, lastUsed: 0 }))
  );

  const steps = [];

  sequence.forEach((address, tick) => {
    const setIndex = (address >> offsetBits) & ((1 << indexBits) - 1);
    const tag = address >> (offsetBits + indexBits);
    const set = cache[setIndex];

    const hitIndex = set.findIndex(line => line.valid && line.tag === tag);

    if (hitIndex !== -1) {
      set[hitIndex].lastUsed = tick;
      steps.push({ address, setIndex, tag, hit: true });
      return;
    }

    // Miss: escolhe vitima.
    const victimIndex = set.findIndex(line => !line.valid) ??
      set.indexOf(
        set.filter(line => line.valid)
          .reduce((a, b) => (a.lastUsed < b.lastUsed ? a : b))
      );

    set[victimIndex] = { valid: true, tag, lastUsed: tick };
    steps.push({ address, setIndex, tag, hit: false, victimIndex });
  });

  return { cache, steps };
}`
}
