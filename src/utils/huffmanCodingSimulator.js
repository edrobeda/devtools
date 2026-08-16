// Simulador de Codificacao de Huffman — 100% client-side.
// Constroi uma arvore de prefixo otima a partir das frequencias de caracteres
// de um texto, gera os codigos binarios, codifica e decodifica tudo no
// navegador, sem enviar dados para lugar nenhum.

let nodeIdCounter = 0

function newNode(freq, char = null, left = null, right = null) {
  return {
    id: `n${nodeIdCounter++}`,
    char,
    freq,
    left,
    right,
  }
}

function buildFrequencies(text) {
  const map = new Map()
  for (const ch of text) {
    map.set(ch, (map.get(ch) || 0) + 1)
  }
  return map
}

function buildTree(text) {
  const freqMap = buildFrequencies(text)
  if (freqMap.size === 0) return { root: null, frequencies: [] }

  const leaves = []
  freqMap.forEach((count, ch) => {
    leaves.push(newNode(count, ch))
  })

  // Fila de prioridade simples mantida ordenada por frequencia crescente.
  const queue = leaves.slice().sort((a, b) => a.freq - b.freq)

  while (queue.length > 1) {
    const left = queue.shift()
    const right = queue.shift()
    const parent = newNode(left.freq + right.freq, null, left, right)
    // Insere mantendo ordenacao.
    let inserted = false
    for (let i = 0; i < queue.length; i++) {
      if (parent.freq <= queue[i].freq) {
        queue.splice(i, 0, parent)
        inserted = true
        break
      }
    }
    if (!inserted) queue.push(parent)
  }

  return { root: queue[0], frequencies: leaves }
}

function buildCodes(root, prefix = '', acc = {}) {
  if (!root) return acc
  if (root.char !== null) {
    acc[root.char] = prefix || '0'
    return acc
  }
  if (root.left) buildCodes(root.left, `${prefix}0`, acc)
  if (root.right) buildCodes(root.right, `${prefix}1`, acc)
  return acc
}

export function encodeText(text, codes) {
  let out = ''
  for (const ch of text) {
    out += codes[ch]
  }
  return out
}

export function decodeBits(bits, root) {
  if (!root) return ''
  // Caso especial: apenas um caractere no alfabeto.
  if (root.char !== null) {
    return root.char.repeat(bits.length)
  }
  let out = ''
  let node = root
  for (const bit of bits) {
    node = bit === '0' ? node.left : node.right
    if (node && node.char !== null) {
      out += node.char
      node = root
    }
  }
  return out
}

function treeHeight(root) {
  if (!root) return 0
  if (root.char !== null) return 0
  return 1 + Math.max(treeHeight(root.left), treeHeight(root.right))
}

function countNodes(root) {
  if (!root) return 0
  return 1 + countNodes(root.left) + countNodes(root.right)
}

function countLeaves(root) {
  if (!root) return 0
  if (root.char !== null) return 1
  return countLeaves(root.left) + countLeaves(root.right)
}

export function layoutTree(root, width = 800, height = 320) {
  if (!root) return { nodes: [], links: [], bounds: { width, height } }

  const leaves = []
  const all = []

  function collect(node, depth) {
    if (!node) return
    node._depth = depth
    if (node.char !== null) {
      leaves.push(node)
    }
    all.push(node)
    collect(node.left, depth + 1)
    collect(node.right, depth + 1)
  }
  collect(root, 0)

  const h = treeHeight(root)
  const levelHeight = h === 0 ? height / 2 : height / (h + 1)

  leaves.forEach((leaf, i) => {
    leaf._x = ((i + 0.5) / leaves.length) * width
  })

  function assignX(node) {
    if (!node) return
    if (node.char !== null) return
    assignX(node.left)
    assignX(node.right)
    const leftX = node.left ? node.left._x : 0
    const rightX = node.right ? node.right._x : width
    node._x = node.left && node.right ? (leftX + rightX) / 2 : (leftX + rightX) / 2
  }
  assignX(root)

  const nodes = all.map((n) => ({
    id: n.id,
    x: n._x,
    y: n._depth * levelHeight + levelHeight / 2,
    char: n.char,
    freq: n.freq,
    isLeaf: n.char !== null,
  }))

  const links = []
  all.forEach((n) => {
    if (n.left) {
      links.push({
        source: { x: n.left._x, y: n.left._depth * levelHeight + levelHeight / 2 },
        target: { x: n._x, y: n._depth * levelHeight + levelHeight / 2 },
        label: '0',
      })
    }
    if (n.right) {
      links.push({
        source: { x: n.right._x, y: n.right._depth * levelHeight + levelHeight / 2 },
        target: { x: n._x, y: n._depth * levelHeight + levelHeight / 2 },
        label: '1',
      })
    }
  })

  return { nodes, links, bounds: { width, height } }
}

export function buildHuffman(text) {
  nodeIdCounter = 0
  const trimmed = text
  const { root, frequencies } = buildTree(trimmed)

  if (!root) {
    return {
      root: null,
      frequencies: [],
      codes: {},
      encoded: '',
      decoded: '',
      originalBits: 0,
      compressedBits: 0,
      compressionRatio: 0,
      treeHeight: 0,
      nodeCount: 0,
      leafCount: 0,
    }
  }

  const codes = buildCodes(root)
  const encoded = encodeText(trimmed, codes)
  const decoded = decodeBits(encoded, root)
  const originalBits = new TextEncoder().encode(trimmed).length * 8
  const compressedBits = encoded.length
  const compressionRatio = originalBits > 0 ? compressedBits / originalBits : 0

  return {
    root,
    frequencies,
    codes,
    encoded,
    decoded,
    originalBits,
    compressedBits,
    compressionRatio,
    treeHeight: treeHeight(root),
    nodeCount: countNodes(root),
    leafCount: countLeaves(root),
  }
}

export function formatChar(ch) {
  if (ch === ' ') return '␠'
  if (ch === '\n') return '↵'
  if (ch === '\t') return '⇥'
  if (ch === '\r') return '↵'
  return ch
}

export const PRESETS = {
  pt: [
    { key: 'simple', label: 'Texto simples' },
    { key: 'dna', label: 'Sequencia de DNA' },
    { key: 'repeated', label: 'Repeticao pesada' },
    { key: 'pangram', label: 'Pangrama' },
  ],
  en: [
    { key: 'simple', label: 'Simple text' },
    { key: 'dna', label: 'DNA sequence' },
    { key: 'repeated', label: 'Heavy repetition' },
    { key: 'pangram', label: 'Pangram' },
  ],
}

export function applyPreset(key, lang = 'pt') {
  switch (key) {
    case 'simple':
      return lang === 'pt'
        ? 'o rato roeu a roupa do rei de roma'
        : 'the quick brown fox jumps over the lazy dog'
    case 'dna':
      return 'ACGTACGTACGTACGTACGTACGTACGTACGTACGT'
    case 'repeated':
      return 'aaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbccccdd'
    case 'pangram':
      return lang === 'pt'
        ? 'vejo x duas glicose quinoa no céu'
        : 'the quick brown fox jumps over the lazy dog'
    default:
      return ''
  }
}

export function sourceCode() {
  return [
    '// Motor do simulador de Codificacao de Huffman',
    '',
    'function newNode(freq, char = null, left = null, right = null) {',
    '  return { id: Math.random().toString(36).slice(2), char, freq, left, right }',
    '}',
    '',
    'function buildTree(text) {',
    '  const map = new Map()',
    '  for (const ch of text) map.set(ch, (map.get(ch) || 0) + 1)',
    '  if (map.size === 0) return null',
    '',
    '  const queue = []',
    '  map.forEach((count, ch) => queue.push(newNode(count, ch)))',
    '  queue.sort((a, b) => a.freq - b.freq)',
    '',
    '  while (queue.length > 1) {',
    '    const left = queue.shift()',
    '    const right = queue.shift()',
    '    const parent = newNode(left.freq + right.freq, null, left, right)',
    '    let inserted = false',
    '    for (let i = 0; i < queue.length; i++) {',
    '      if (parent.freq <= queue[i].freq) {',
    '        queue.splice(i, 0, parent)',
    '        inserted = true',
    '        break',
    '      }',
    '    }',
    '    if (!inserted) queue.push(parent)',
    '  }',
    '  return queue[0]',
    '}',
    '',
    'function buildCodes(root, prefix = \'\', acc = {}) {',
    '  if (!root) return acc',
    '  if (root.char !== null) {',
    '    acc[root.char] = prefix || \'0\'',
    '    return acc',
    '  }',
    '  buildCodes(root.left, prefix + \'0\', acc)',
    '  buildCodes(root.right, prefix + \'1\', acc)',
    '  return acc',
    '}',
    '',
    'export function encodeText(text, codes) {',
    '  let out = \'\'',
    '  for (const ch of text) out += codes[ch]',
    '  return out',
    '}',
    '',
    'export function decodeBits(bits, root) {',
    '  if (!root) return \'\'',
    '  if (root.char !== null) return root.char.repeat(bits.length)',
    '  let out = \'\'',
    '  let node = root',
    '  for (const bit of bits) {',
    '    node = bit === \'0\' ? node.left : node.right',
    '    if (node && node.char !== null) {',
    '      out += node.char',
    '      node = root',
    '    }',
    '  }',
    '  return out',
    '}',
    '',
    'export function buildHuffman(text) {',
    '  const root = buildTree(text)',
    '  const codes = buildCodes(root)',
    '  const encoded = encodeText(text, codes)',
    '  const decoded = decodeBits(encoded, root)',
    '  return { root, codes, encoded, decoded }',
    '}',
  ].join('\n')
}
