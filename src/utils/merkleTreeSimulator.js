// Simulador de Merkle Tree — 100% client-side.
// Constroi uma arvore de hashes binaria a partir de um conjunto de blocos,
// calcula a raiz (Merkle root) e gera/verifica provas de inclusao.
// Usa SHA-256 via Web Crypto API para manter o exemplo proximo do real
// (blockchain, Git, verificacao de integridade de dados).

async function sha256Hex(input) {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hashPair(left, right) {
  return sha256Hex(left.hash + right.hash)
}

export async function buildMerkleTree(leaves) {
  const rawLeaves = leaves
    .map((l) => String(l).trim())
    .filter((l) => l.length > 0)

  if (rawLeaves.length === 0) {
    return { root: null, levels: [], leaves: [], byData: new Map() }
  }

  // Se houver quantidade impar, duplica a ultima folha (estilo Bitcoin).
  const balanced = rawLeaves.slice()
  if (balanced.length % 2 === 1) {
    balanced.push(balanced[balanced.length - 1])
  }

  const levels = []
  let currentLevel = await Promise.all(
    balanced.map(async (data, index) => ({
      hash: await sha256Hex(data),
      data,
      level: 0,
      index,
      isLeaf: true,
      isDuplicate:
        index > 0 && data === balanced[index - 1] && index >= rawLeaves.length,
    }))
  )

  levels.push(currentLevel)

  while (currentLevel.length > 1) {
    if (currentLevel.length % 2 === 1) {
      currentLevel.push({ ...currentLevel[currentLevel.length - 1] })
    }

    const nextLevel = []
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = currentLevel[i + 1]
      const hash = await hashPair(left, right)
      nextLevel.push({
        hash,
        level: left.level + 1,
        index: i / 2,
        left,
        right,
        isLeaf: false,
      })
    }
    levels.push(nextLevel)
    currentLevel = nextLevel
  }

  const root = currentLevel[0] || null

  const byData = new Map()
  levels[0].forEach((leaf) => {
    if (!byData.has(leaf.data)) {
      byData.set(leaf.data, [])
    }
    byData.get(leaf.data).push(leaf)
  })

  return { root, levels, leaves: levels[0], byData }
}

export function getInclusionProof(tree, targetData) {
  if (!tree || !tree.root || !tree.byData.has(targetData)) {
    return { found: false, siblings: [], root: tree?.root?.hash || null }
  }

  const leaves = tree.leaves
  const targetLeaves = leaves.filter((leaf) => leaf.data === targetData)
  // Seleciona a primeira ocorrencia para montar a prova.
  const targetLeaf = targetLeaves[0]

  const siblings = []
  let current = targetLeaf
  let levelIndex = current.index

  for (let level = 0; level < tree.levels.length - 1; level += 1) {
    const levelNodes = tree.levels[level]
    const isRight = levelIndex % 2 === 1
    const siblingIndex = isRight ? levelIndex - 1 : levelIndex + 1
    const sibling = levelNodes[siblingIndex]

    if (sibling) {
      siblings.push({
        hash: sibling.hash,
        direction: isRight ? 'left' : 'right',
      })
    }

    levelIndex = Math.floor(levelIndex / 2)
    const parentLevel = tree.levels[level + 1]
    current = parentLevel[levelIndex]
  }

  return {
    found: true,
    target: targetData,
    targetHash: targetLeaf.hash,
    siblings,
    root: tree.root.hash,
  }
}

export async function verifyProof(targetData, siblings, expectedRoot) {
  if (!siblings || siblings.length === 0) {
    const onlyHash = await sha256Hex(targetData)
    return onlyHash === expectedRoot
  }

  let current = await sha256Hex(targetData)
  for (const sibling of siblings) {
    const combined =
      sibling.direction === 'left'
        ? sibling.hash + current
        : current + sibling.hash
    current = await sha256Hex(combined)
  }
  return current === expectedRoot
}

export function formatHash(hash, chars = 8) {
  if (!hash) return ''
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

export function treeStats(tree) {
  if (!tree || !tree.root) {
    return { leafCount: 0, nodeCount: 0, depth: 0, root: '' }
  }
  const nodeCount = tree.levels.reduce((sum, level) => sum + level.length, 0)
  return {
    leafCount: tree.leaves.length,
    nodeCount,
    depth: tree.levels.length,
    root: tree.root.hash,
  }
}

export function getNodePath(tree, targetData) {
  if (!tree || !tree.byData.has(targetData)) return []
  const leaf = tree.leaves.find((l) => l.data === targetData)
  if (!leaf) return []

  const path = []
  let current = leaf
  let levelIndex = current.index

  for (let level = 0; level < tree.levels.length - 1; level += 1) {
    const levelNodes = tree.levels[level]
    const isRight = levelIndex % 2 === 1
    const siblingIndex = isRight ? levelIndex - 1 : levelIndex + 1
    const sibling = levelNodes[siblingIndex]
    const parentIndex = Math.floor(levelIndex / 2)

    path.push({
      level,
      index: levelIndex,
      isRight,
      siblingIndex,
      siblingHash: sibling?.hash || null,
      parentIndex,
      parentHash: tree.levels[level + 1][parentIndex]?.hash || null,
    })

    levelIndex = parentIndex
  }

  return path
}

export const PRESETS = {
  pt: [
    {
      key: 'transactions',
      label: 'Transacoes',
      items: ['Alice -> Bob: 5 BTC', 'Bob -> Carol: 2 BTC', 'Carol -> Dave: 1 BTC', 'Dave -> Alice: 0.5 BTC'],
    },
    {
      key: 'files',
      label: 'Arquivos',
      items: ['README.md', 'package.json', 'src/index.js', 'src/App.jsx', 'src/styles.css'],
    },
    {
      key: 'logs',
      label: 'Logs',
      items: ['2026-08-15 10:00:01 login ok', '2026-08-15 10:00:05 query executed', '2026-08-15 10:00:09 cache miss', '2026-08-15 10:00:12 request completed'],
    },
    {
      key: 'odd',
      label: 'Quantidade impar',
      items: ['bloco-A', 'bloco-B', 'bloco-C'],
    },
  ],
  en: [
    {
      key: 'transactions',
      label: 'Transactions',
      items: ['Alice -> Bob: 5 BTC', 'Bob -> Carol: 2 BTC', 'Carol -> Dave: 1 BTC', 'Dave -> Alice: 0.5 BTC'],
    },
    {
      key: 'files',
      label: 'Files',
      items: ['README.md', 'package.json', 'src/index.js', 'src/App.jsx', 'src/styles.css'],
    },
    {
      key: 'logs',
      label: 'Logs',
      items: ['2026-08-15 10:00:01 login ok', '2026-08-15 10:00:05 query executed', '2026-08-15 10:00:09 cache miss', '2026-08-15 10:00:12 request completed'],
    },
    {
      key: 'odd',
      label: 'Odd count',
      items: ['block-A', 'block-B', 'block-C'],
    },
  ],
}

export function sourceCode() {
  return `async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildMerkleTree(leaves) {
  const balanced = leaves.filter((l) => l.trim());
  if (balanced.length % 2 === 1) balanced.push(balanced[balanced.length - 1]);

  const levels = [];
  let current = await Promise.all(
    balanced.map(async (data, index) => ({
      hash: await sha256Hex(data),
      data,
      level: 0,
      index,
      isLeaf: true,
    }))
  );
  levels.push(current);

  while (current.length > 1) {
    if (current.length % 2 === 1) current.push({ ...current[current.length - 1] });
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1];
      next.push({
        hash: await sha256Hex(left.hash + right.hash),
        level: left.level + 1,
        left,
        right,
      });
    }
    levels.push(next);
    current = next;
  }

  return { root: current[0], levels };
}

function getInclusionProof(tree, targetData) {
  const leaf = tree.levels[0].find((l) => l.data === targetData);
  if (!leaf) return { found: false };

  const siblings = [];
  let index = leaf.index;

  for (let level = 0; level < tree.levels.length - 1; level++) {
    const nodes = tree.levels[level];
    const isRight = index % 2 === 1;
    const sibling = nodes[isRight ? index - 1 : index + 1];
    siblings.push({ hash: sibling.hash, direction: isRight ? 'left' : 'right' });
    index = Math.floor(index / 2);
  }

  return { found: true, siblings, root: tree.root.hash };
}

async function verifyProof(targetData, siblings, expectedRoot) {
  let current = await sha256Hex(targetData);
  for (const s of siblings) {
    const combined = s.direction === 'left' ? s.hash + current : current + s.hash;
    current = await sha256Hex(combined);
  }
  return current === expectedRoot;
}`
}
