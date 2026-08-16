// Simulador de Blockchain — 100% client-side.
// Implementa uma cadeia de blocos simples com proof-of-work por dificuldade
// (zeros à esquerda) usando SHA-256 puro em JavaScript, sem depender de API
// externa nem da Web Crypto API (assim a mineração e validação são
// síncronas e a UI responde imediatamente).

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0
}

export function sha256(message) {
  const bytes = new TextEncoder().encode(message)
  const bitLength = BigInt(bytes.length) * 8n

  const padLength = bytes.length + 9 + ((64 - ((bytes.length + 9) % 64)) % 64)
  const padded = new Uint8Array(padLength)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  view.setBigUint64(padLength - 8, bitLength, false)

  let h0 = 0x6a09e667
  let h1 = 0xbb67ae85
  let h2 = 0x3c6ef372
  let h3 = 0xa54ff53a
  let h4 = 0x510e527f
  let h5 = 0x9b05688c
  let h6 = 0x1f83d9ab
  let h7 = 0x5be0cd19

  for (let offset = 0; offset < padLength; offset += 64) {
    const w = new Uint32Array(64)
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false)
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    let f = h5
    let g = h6
    let h = h7

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('')
}

export function calculateHash(block) {
  return sha256(
    `${block.index}${block.timestamp}${block.data}${block.previousHash}${block.nonce}`
  )
}

export function isHashValid(hash, difficulty) {
  return hash.startsWith('0'.repeat(difficulty))
}

export function mineBlock(block, difficulty) {
  const target = '0'.repeat(difficulty)
  let nonce = 0
  let hash = calculateHash({ ...block, nonce })
  while (!hash.startsWith(target)) {
    nonce += 1
    hash = calculateHash({ ...block, nonce })
  }
  return { ...block, nonce, hash }
}

export function createGenesisBlock(difficulty = 2) {
  return mineBlock(
    {
      index: 0,
      timestamp: Date.now(),
      data: 'Genesis Block',
      previousHash: '0',
      nonce: 0,
      hash: '',
    },
    difficulty
  )
}

export function addBlock(chain, data, difficulty) {
  const previous = chain[chain.length - 1]
  const block = {
    index: chain.length,
    timestamp: Date.now(),
    data: data || 'Empty block',
    previousHash: previous ? previous.hash : '0',
    nonce: 0,
    hash: '',
  }
  return [...chain, mineBlock(block, difficulty)]
}

export function updateBlockData(chain, index, data) {
  return chain.map((b, i) => (i === index ? { ...b, data } : b))
}

export function mineSingleBlock(chain, index, difficulty) {
  return chain.map((b, i) =>
    i === index ? mineBlock({ ...b, nonce: 0 }, difficulty) : b
  )
}

export function remineChain(chain, difficulty, startIndex = 0) {
  const next = [...chain]
  for (let i = startIndex; i < next.length; i++) {
    const previousHash = i === 0 ? '0' : next[i - 1].hash
    next[i] = mineBlock({ ...next[i], previousHash, nonce: 0 }, difficulty)
  }
  return next
}

export function validateChain(chain, difficulty) {
  const target = '0'.repeat(difficulty)
  const details = chain.map((block, i) => {
    const recomputed = calculateHash(block)
    const hashValid = block.hash === recomputed && block.hash.startsWith(target)
    const previousValid = i === 0 || block.previousHash === chain[i - 1].hash
    return {
      index: i,
      hashValid,
      previousValid,
      recomputed,
    }
  })
  const invalidIndices = details
    .filter((d) => !d.hashValid || !d.previousValid)
    .map((d) => d.index)
  return {
    valid: invalidIndices.length === 0,
    details,
    invalidIndices,
  }
}

export function formatHash(hash, maxLength = 16) {
  if (!hash) return ''
  if (hash.length <= maxLength) return hash
  return `${hash.slice(0, maxLength / 2)}...${hash.slice(-maxLength / 2)}`
}

export const PRESETS = {
  pt: [
    { key: 'genesis', label: 'Apenas genesis' },
    { key: 'three-blocks', label: '3 blocos' },
    { key: 'tamper-demo', label: 'Demonstracao de tamper' },
  ],
  en: [
    { key: 'genesis', label: 'Genesis only' },
    { key: 'three-blocks', label: '3 blocks' },
    { key: 'tamper-demo', label: 'Tamper demonstration' },
  ],
}

export function applyPreset(key, difficulty) {
  switch (key) {
    case 'genesis':
      return [createGenesisBlock(difficulty)]
    case 'three-blocks': {
      let chain = [createGenesisBlock(difficulty)]
      chain = addBlock(chain, 'Alice envia 5 BTC para Bob', difficulty)
      chain = addBlock(chain, 'Bob envia 2 BTC para Charlie', difficulty)
      return chain
    }
    case 'tamper-demo': {
      let chain = [createGenesisBlock(difficulty)]
      chain = addBlock(chain, 'Transacao original #1', difficulty)
      chain = addBlock(chain, 'Transacao original #2', difficulty)
      chain = updateBlockData(chain, 1, 'Transacao ALTERADA #1')
      return chain
    }
    default:
      return [createGenesisBlock(difficulty)]
  }
}

export function sourceCode() {
  return [
    '// Motor do simulador de Blockchain',
    '',
    'export function sha256(message) {',
    '  // Implementacao pura de SHA-256 (omitida aqui por tamanho).',
    '  // Use crypto.subtle.digest em producao se preferir assincrono.',
    '}',
    '',
    'export function calculateHash(block) {',
    "  return sha256(`${block.index}${block.timestamp}${block.data}${block.previousHash}${block.nonce}`)",
    '}',
    '',
    'export function mineBlock(block, difficulty) {',
    "  const target = '0'.repeat(difficulty)",
    '  let nonce = 0',
    '  let hash = calculateHash({ ...block, nonce })',
    '  while (!hash.startsWith(target)) {',
    '    nonce += 1',
    '    hash = calculateHash({ ...block, nonce })',
    '  }',
    '  return { ...block, nonce, hash }',
    '}',
    '',
    'export function addBlock(chain, data, difficulty) {',
    '  const previous = chain[chain.length - 1]',
    '  const block = {',
    '    index: chain.length,',
    '    timestamp: Date.now(),',
    '    data,',
    '    previousHash: previous ? previous.hash : "0",',
    '    nonce: 0,',
    '    hash: "",',
    '  }',
    '  return [...chain, mineBlock(block, difficulty)]',
    '}',
    '',
    'export function validateChain(chain, difficulty) {',
    "  const target = '0'.repeat(difficulty)",
    '  const details = chain.map((block, i) => {',
    '    const recomputed = calculateHash(block)',
    '    const hashValid = block.hash === recomputed && block.hash.startsWith(target)',
    '    const previousValid = i === 0 || block.previousHash === chain[i - 1].hash',
    '    return { index: i, hashValid, previousValid, recomputed }',
    '  })',
    '  const invalidIndices = details.filter(d => !d.hashValid || !d.previousValid).map(d => d.index)',
    '  return { valid: invalidIndices.length === 0, details, invalidIndices }',
    '}',
    '',
    'export function remineChain(chain, difficulty, startIndex = 0) {',
    '  const next = [...chain]',
    '  for (let i = startIndex; i < next.length; i++) {',
    '    const previousHash = i === 0 ? "0" : next[i - 1].hash',
    '    next[i] = mineBlock({ ...next[i], previousHash, nonce: 0 }, difficulty)',
    '  }',
    '  return next',
    '}',
  ].join('\n')
}
