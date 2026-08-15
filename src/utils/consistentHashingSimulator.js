// Simulador de Consistent Hashing — 100% client-side.
// Implementa um anel hash deterministico com nodes virtuais (vnodes),
// permitindo comparar o balanceamento de chaves e o impacto de adicionar
// ou remover nodes sem re-mapear toda a base.

export const RING_SIZE = 2 ** 32

function fnv1a32(input) {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function hashNode(nodeId, replicaIndex) {
  return fnv1a32(`${nodeId}:${replicaIndex}`)
}

export function hashKey(key) {
  return fnv1a32(String(key))
}

export function buildRing(nodes, vnodesPerNode) {
  const points = []
  const nodeMap = new Map()

  for (const node of nodes) {
    const id = node.id
    const color = node.color
    const weight = Math.max(1, Math.floor(node.weight || 1))
    const replicas = vnodesPerNode * weight
    for (let i = 0; i < replicas; i += 1) {
      const pos = hashNode(id, i)
      const point = { pos, nodeId: id, color }
      points.push(point)
      nodeMap.set(pos, point)
    }
  }

  points.sort((a, b) => a.pos - b.pos)
  return { points, nodeMap }
}

export function findNodeForKey(pos, ringPoints) {
  if (ringPoints.length === 0) return null
  let lo = 0
  let hi = ringPoints.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (ringPoints[mid].pos < pos) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  if (ringPoints[lo].pos < pos) {
    return ringPoints[0].nodeId
  }
  return ringPoints[lo].nodeId
}

export function assignKeys(keys, ringPoints) {
  const assignments = []
  const counts = {}
  for (const key of keys) {
    const pos = hashKey(key)
    const nodeId = findNodeForKey(pos, ringPoints)
    assignments.push({ key, pos, nodeId })
    counts[nodeId] = (counts[nodeId] || 0) + 1
  }
  return { assignments, counts }
}

export function computeStats(counts, totalKeys, nodes) {
  const nodeIds = nodes.map((n) => n.id)
  if (nodeIds.length === 0 || totalKeys === 0) {
    return {
      percentages: {},
      stdDev: 0,
      min: 0,
      max: 0,
      range: 0,
    }
  }
  const values = nodeIds.map((id) => counts[id] || 0)
  const percentages = Object.fromEntries(
    nodeIds.map((id) => [id, ((counts[id] || 0) / totalKeys) * 100])
  )
  const mean = totalKeys / nodeIds.length
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / nodeIds.length
  const stdDev = Math.sqrt(variance)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { percentages, stdDev, min, max, range: max - min }
}

export function simulate({ nodes, keys, vnodesPerNode }) {
  const { points } = buildRing(nodes, vnodesPerNode)
  const { assignments, counts } = assignKeys(keys, points)
  const stats = computeStats(counts, keys.length, nodes)
  return { points, assignments, counts, stats }
}

export const PRESETS = {
  pt: [
    {
      key: 'small',
      label: '3 nodes / 100 vnodes',
      nodes: [
        { id: 'node-a', color: '#1677ff', weight: 1 },
        { id: 'node-b', color: '#52c41a', weight: 1 },
        { id: 'node-c', color: '#faad14', weight: 1 },
      ],
      vnodesPerNode: 100,
      keys: 500,
    },
    {
      key: 'weighted',
      label: 'Pesos 4:2:1',
      nodes: [
        { id: 'node-a', color: '#1677ff', weight: 4 },
        { id: 'node-b', color: '#52c41a', weight: 2 },
        { id: 'node-c', color: '#faad14', weight: 1 },
      ],
      vnodesPerNode: 100,
      keys: 700,
    },
    {
      key: 'dense',
      label: '5 nodes / 300 vnodes',
      nodes: [
        { id: 'node-a', color: '#1677ff', weight: 1 },
        { id: 'node-b', color: '#52c41a', weight: 1 },
        { id: 'node-c', color: '#faad14', weight: 1 },
        { id: 'node-d', color: '#eb2f96', weight: 1 },
        { id: 'node-e', color: '#722ed1', weight: 1 },
      ],
      vnodesPerNode: 300,
      keys: 1000,
    },
  ],
  en: [
    {
      key: 'small',
      label: '3 nodes / 100 vnodes',
      nodes: [
        { id: 'node-a', color: '#1677ff', weight: 1 },
        { id: 'node-b', color: '#52c41a', weight: 1 },
        { id: 'node-c', color: '#faad14', weight: 1 },
      ],
      vnodesPerNode: 100,
      keys: 500,
    },
    {
      key: 'weighted',
      label: 'Weights 4:2:1',
      nodes: [
        { id: 'node-a', color: '#1677ff', weight: 4 },
        { id: 'node-b', color: '#52c41a', weight: 2 },
        { id: 'node-c', color: '#faad14', weight: 1 },
      ],
      vnodesPerNode: 100,
      keys: 700,
    },
    {
      key: 'dense',
      label: '5 nodes / 300 vnodes',
      nodes: [
        { id: 'node-a', color: '#1677ff', weight: 1 },
        { id: 'node-b', color: '#52c41a', weight: 1 },
        { id: 'node-c', color: '#faad14', weight: 1 },
        { id: 'node-d', color: '#eb2f96', weight: 1 },
        { id: 'node-e', color: '#722ed1', weight: 1 },
      ],
      vnodesPerNode: 300,
      keys: 1000,
    },
  ],
}

export function generateKeys(count, prefix = 'key-') {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`)
}

export function sourceCode() {
  return `const RING_SIZE = 2 ** 32;

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function buildRing(nodes, vnodesPerNode) {
  const points = [];
  for (const node of nodes) {
    const replicas = vnodesPerNode * (node.weight || 1);
    for (let i = 0; i < replicas; i++) {
      points.push({
        pos: fnv1a32(node.id + ':' + i),
        nodeId: node.id,
      });
    }
  }
  points.sort((a, b) => a.pos - b.pos);
  return points;
}

function findNodeForKey(key, ring) {
  const pos = fnv1a32(key);
  // Busca binaria pelo primeiro ponto >= pos
  let lo = 0, hi = ring.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (ring[mid].pos < pos) lo = mid + 1;
    else hi = mid;
  }
  if (ring[lo].pos < pos) return ring[0].nodeId;
  return ring[lo].nodeId;
}

function assignKeys(keys, ring) {
  return keys.map((key) => ({
    key,
    nodeId: findNodeForKey(key, ring),
  }));
}`
}
