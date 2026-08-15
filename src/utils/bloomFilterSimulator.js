// Simulador de Bloom Filter — 100% client-side.
// Implementa uma estrutura de dados probabilistica compacta para testar
// membership com possiveis falsos positivos, mas nunca falsos negativos.

function fnv1a32(input, seed = 0) {
  let hash = 0x811c9dc5 ^ seed
  const str = String(input)
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function computeHashIndex(input, hashIndex, size) {
  // Combina duas funcoes FNV-1a independentes para reduzir correlacao.
  const h1 = fnv1a32(input, hashIndex * 0x9e3779b9)
  const h2 = fnv1a32(input, hashIndex * 0x85ebca77 + 1)
  return (h1 + hashIndex * h2) % size
}

export function createBloomFilter(size, hashCount) {
  const bits = new Uint8Array(Math.max(1, size))
  const items = []

  function indexesFor(input) {
    const k = Math.max(1, hashCount)
    const idxs = []
    for (let i = 0; i < k; i += 1) {
      idxs.push(computeHashIndex(input, i, bits.length))
    }
    return idxs
  }

  return {
    size: bits.length,
    hashCount: Math.max(1, hashCount),
    add(input) {
      const idxs = indexesFor(input)
      idxs.forEach((idx) => {
        bits[idx] = 1
      })
      items.push(String(input))
    },
    test(input) {
      const idxs = indexesFor(input)
      return idxs.every((idx) => bits[idx] === 1)
    },
    get bits() {
      return Array.from(bits)
    },
    get items() {
      return items.slice()
    },
    getBit(index) {
      return bits[index] === 1
    },
    getIndexesFor(input) {
      return indexesFor(input)
    },
  }
}

export function buildFilterFromItems(items, size, hashCount) {
  const filter = createBloomFilter(size, hashCount)
  items.forEach((item) => filter.add(item))
  return filter
}

export function theoreticalFalsePositiveRate(n, m, k) {
  if (!m || !k) return 0
  const exp = -(k * n) / m
  return (1 - Math.E ** exp) ** k
}

export function optimalHashCount(m, n) {
  if (!n) return 1
  return Math.max(1, Math.round((m / n) * Math.LN2))
}

export function recommendedSize(expectedItems, targetFpRate) {
  if (!expectedItems || targetFpRate <= 0 || targetFpRate >= 1) return 64
  const m = Math.ceil(
    -(expectedItems * Math.log(targetFpRate)) / (Math.LN2 ** 2)
  )
  return Math.max(16, m)
}

export const PRESETS = {
  pt: [
    {
      key: 'tiny',
      label: 'Mini (m=32, k=2)',
      size: 32,
      hashCount: 2,
      samples: ['gato', 'cachorro', 'peixe'],
    },
    {
      key: 'recommended',
      label: 'Recomendado (m=256, k=3)',
      size: 256,
      hashCount: 3,
      samples: ['user:42', 'user:7', 'user:99', 'user:123'],
    },
    {
      key: 'large',
      label: 'Grande (m=1024, k=5)',
      size: 1024,
      hashCount: 5,
      samples: ['sku-A1', 'sku-B2', 'sku-C3', 'sku-D4', 'sku-E5'],
    },
  ],
  en: [
    {
      key: 'tiny',
      label: 'Tiny (m=32, k=2)',
      size: 32,
      hashCount: 2,
      samples: ['cat', 'dog', 'fish'],
    },
    {
      key: 'recommended',
      label: 'Recommended (m=256, k=3)',
      size: 256,
      hashCount: 3,
      samples: ['user:42', 'user:7', 'user:99', 'user:123'],
    },
    {
      key: 'large',
      label: 'Large (m=1024, k=5)',
      size: 1024,
      hashCount: 5,
      samples: ['sku-A1', 'sku-B2', 'sku-C3', 'sku-D4', 'sku-E5'],
    },
  ],
}

export function sourceCode() {
  return `function fnv1a32(input, seed = 0) {
  let hash = 0x811c9dc5 ^ seed;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function computeHashIndex(input, hashIndex, size) {
  const h1 = fnv1a32(input, hashIndex * 0x9e3779b9);
  const h2 = fnv1a32(input, hashIndex * 0x85ebca77 + 1);
  return (h1 + hashIndex * h2) % size;
}

function createBloomFilter(size, hashCount) {
  const bits = new Uint8Array(Math.max(1, size));

  function indexesFor(input) {
    const idxs = [];
    for (let i = 0; i < Math.max(1, hashCount); i++) {
      idxs.push(computeHashIndex(input, i, bits.length));
    }
    return idxs;
  }

  return {
    add(input) {
      indexesFor(input).forEach((idx) => { bits[idx] = 1; });
    },
    test(input) {
      return indexesFor(input).every((idx) => bits[idx] === 1);
    },
  };
}

function falsePositiveRate(n, m, k) {
  return (1 - Math.E ** (-(k * n) / m)) ** k;
}`
}
