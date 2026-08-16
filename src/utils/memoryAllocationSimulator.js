// Simulador de algoritmos de alocacao de memoria contigua — 100% client-side.
// Implementa First Fit, Best Fit, Worst Fit e Next Fit sobre um espaco linear
// de memoria, com desalocacao e compactacao.

export const ALGORITHMS = ['First Fit', 'Best Fit', 'Worst Fit', 'Next Fit']

export const PRESETS = {
  pt: [
    {
      key: 'basico',
      label: 'Básico (memoria 256)',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 64 },
        { name: 'B', size: 32 },
        { name: 'C', size: 48 },
      ],
      algorithm: 'First Fit',
    },
    {
      key: 'fragmentacao',
      label: 'Fragmentacao externa',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 40 },
        { name: 'B', size: 40 },
        { name: 'C', size: 40 },
        { name: 'D', size: 40 },
      ],
      removals: ['B'],
      algorithm: 'First Fit',
    },
    {
      key: 'best-worst',
      label: 'Best vs Worst Fit',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 120 },
        { name: 'B', size: 32 },
      ],
      removals: ['B'],
      extra: { name: 'C', size: 28 },
      algorithm: 'Best Fit',
    },
    {
      key: 'next-fit',
      label: 'Next Fit em acao',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 48 },
        { name: 'B', size: 48 },
        { name: 'C', size: 48 },
      ],
      removals: ['B'],
      extra: { name: 'D', size: 32 },
      algorithm: 'Next Fit',
    },
    {
      key: 'cheio',
      label: 'Memoria quase cheia',
      memorySize: 128,
      allocations: [
        { name: 'A', size: 32 },
        { name: 'B', size: 32 },
        { name: 'C', size: 32 },
      ],
      extra: { name: 'D', size: 40 },
      algorithm: 'Best Fit',
    },
  ],
  en: [
    {
      key: 'basic',
      label: 'Basic (memory 256)',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 64 },
        { name: 'B', size: 32 },
        { name: 'C', size: 48 },
      ],
      algorithm: 'First Fit',
    },
    {
      key: 'fragmentation',
      label: 'External fragmentation',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 40 },
        { name: 'B', size: 40 },
        { name: 'C', size: 40 },
        { name: 'D', size: 40 },
      ],
      removals: ['B'],
      algorithm: 'First Fit',
    },
    {
      key: 'best-worst',
      label: 'Best vs Worst Fit',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 120 },
        { name: 'B', size: 32 },
      ],
      removals: ['B'],
      extra: { name: 'C', size: 28 },
      algorithm: 'Best Fit',
    },
    {
      key: 'next-fit',
      label: 'Next Fit in action',
      memorySize: 256,
      allocations: [
        { name: 'A', size: 48 },
        { name: 'B', size: 48 },
        { name: 'C', size: 48 },
      ],
      removals: ['B'],
      extra: { name: 'D', size: 32 },
      algorithm: 'Next Fit',
    },
    {
      key: 'almost-full',
      label: 'Memory almost full',
      memorySize: 128,
      allocations: [
        { name: 'A', size: 32 },
        { name: 'B', size: 32 },
        { name: 'C', size: 32 },
      ],
      extra: { name: 'D', size: 40 },
      algorithm: 'Best Fit',
    },
  ],
}

const PALETTE = [
  '#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1',
  '#13c2c2', '#f5222d', '#faad14', '#2f54eb', '#a0d911',
]

function createBlock(start, size, type, processId = null, processName = '') {
  return {
    id: `${type}-${start}-${size}`,
    start,
    size,
    type,
    processId,
    processName,
    color: type === 'free' ? '#f0f0f0' : PALETTE[(processName.charCodeAt(0) || 0) % PALETTE.length],
  }
}

export function createInitialState(memorySize = 256) {
  const size = Math.max(64, Math.min(1024, Number(memorySize) || 256))
  return {
    memorySize: size,
    blocks: [createBlock(0, size, 'free')],
    nextProcessId: 1,
    lastPointer: 0,
    history: [{ action: 'reset', blocks: [createBlock(0, size, 'free')] }],
  }
}

function findFreeBlock(blocks, size, algorithm, lastPointer) {
  const freeBlocks = blocks
    .map((b, index) => ({ b, index }))
    .filter(({ b }) => b.type === 'free' && b.size >= size)

  if (freeBlocks.length === 0) return null

  switch (algorithm) {
    case 'Best Fit':
      return freeBlocks.reduce((best, current) =>
        current.b.size < best.b.size ? current : best
      )
    case 'Worst Fit':
      return freeBlocks.reduce((best, current) =>
        current.b.size > best.b.size ? current : best
      )
    case 'Next Fit': {
      // Considera blocos a partir do ponteiro atual, depois volta ao inicio.
      const after = freeBlocks.filter(({ b }) => b.start >= lastPointer)
      const before = freeBlocks.filter(({ b }) => b.start < lastPointer)
      const ordered = [...after, ...before]
      return ordered[0]
    }
    case 'First Fit':
    default:
      return freeBlocks[0]
  }
}

export function allocate(state, processName, size, algorithm) {
  const request = Math.max(1, Math.floor(Number(size) || 0))
  if (request <= 0) {
    return { ...state, error: 'INVALID_SIZE' }
  }

  const name = (processName || `P${state.nextProcessId}`).toString().trim()
  const match = findFreeBlock(state.blocks, request, algorithm, state.lastPointer)

  if (!match) {
    return { ...state, error: 'NO_SPACE' }
  }

  const { b: freeBlock, index } = match
  const processId = state.nextProcessId
  const newBlocks = [...state.blocks]

  if (freeBlock.size === request) {
    newBlocks[index] = createBlock(
      freeBlock.start,
      request,
      'allocated',
      processId,
      name
    )
  } else {
    const allocated = createBlock(
      freeBlock.start,
      request,
      'allocated',
      processId,
      name
    )
    const remaining = createBlock(
      freeBlock.start + request,
      freeBlock.size - request,
      'free'
    )
    newBlocks.splice(index, 1, allocated, remaining)
  }

  const newPointer = freeBlock.start + request
  const newState = {
    ...state,
    blocks: newBlocks,
    nextProcessId: processId + 1,
    lastPointer: newPointer >= state.memorySize ? 0 : newPointer,
    history: [
      ...state.history,
      { action: 'allocate', processId, name, size: request, blocks: newBlocks },
    ],
    error: null,
  }

  return newState
}

export function deallocate(state, processId) {
  const id = Number(processId)
  const index = state.blocks.findIndex((b) => b.processId === id)
  if (index === -1) return state

  const newBlocks = state.blocks.map((b) => ({ ...b }))
  const block = newBlocks[index]
  block.type = 'free'
  block.processId = null
  block.processName = ''
  block.color = '#f0f0f0'
  block.id = `free-${block.start}-${block.size}`

  // Coalescencia com o vizinho da esquerda.
  if (index > 0 && newBlocks[index - 1].type === 'free') {
    const left = newBlocks[index - 1]
    left.size += block.size
    left.id = `free-${left.start}-${left.size}`
    newBlocks.splice(index, 1)
  }

  // Coalescencia com o vizinho da direita.
  const currentIndex = newBlocks.findIndex((b) => b.start === block.start)
  if (
    currentIndex >= 0 &&
    currentIndex < newBlocks.length - 1 &&
    newBlocks[currentIndex + 1].type === 'free'
  ) {
    const right = newBlocks[currentIndex + 1]
    block.size += right.size
    block.id = `free-${block.start}-${block.size}`
    newBlocks.splice(currentIndex + 1, 1)
  }

  return {
    ...state,
    blocks: newBlocks,
    history: [
      ...state.history,
      { action: 'deallocate', processId: id, blocks: newBlocks },
    ],
    error: null,
  }
}

export function compact(state) {
  const allocated = state.blocks
    .filter((b) => b.type === 'allocated')
    .map((b) => ({ ...b }))

  let cursor = 0
  const newBlocks = []
  allocated.forEach((b) => {
    b.start = cursor
    b.id = `alloc-${b.processId}-${b.start}-${b.size}`
    newBlocks.push(b)
    cursor += b.size
  })

  if (cursor < state.memorySize) {
    newBlocks.push(createBlock(cursor, state.memorySize - cursor, 'free'))
  }

  return {
    ...state,
    blocks: newBlocks,
    lastPointer: cursor >= state.memorySize ? 0 : cursor,
    history: [
      ...state.history,
      { action: 'compact', blocks: newBlocks },
    ],
    error: null,
  }
}

export function resetState(memorySize) {
  return createInitialState(memorySize)
}

export function computeStats(state) {
  const total = state.memorySize
  const used = state.blocks
    .filter((b) => b.type === 'allocated')
    .reduce((sum, b) => sum + b.size, 0)
  const free = total - used
  const freeBlocks = state.blocks.filter((b) => b.type === 'free')
  const largestFree = freeBlocks.length
    ? Math.max(...freeBlocks.map((b) => b.size))
    : 0
  const processCount = state.blocks.filter((b) => b.type === 'allocated').length

  // Fragmentacao externa: memoria livre que nao esta no maior bloco continuo,
  // expressa como percentual da memoria livre total.
  const externalFragmentation = free > 0
    ? ((free - largestFree) / free) * 100
    : 0

  return {
    total,
    used,
    free,
    processCount,
    largestFree,
    externalFragmentation,
  }
}

export function sourceCode() {
  return `const ALGORITHMS = ['First Fit', 'Best Fit', 'Worst Fit', 'Next Fit'];

function findFreeBlock(blocks, size, algorithm, lastPointer) {
  const freeBlocks = blocks
    .map((b, index) => ({ b, index }))
    .filter(({ b }) => b.type === 'free' && b.size >= size);

  if (freeBlocks.length === 0) return null;

  switch (algorithm) {
    case 'Best Fit':
      return freeBlocks.reduce((best, current) =>
        current.b.size < best.b.size ? current : best
      );
    case 'Worst Fit':
      return freeBlocks.reduce((best, current) =>
        current.b.size > best.b.size ? current : best
      );
    case 'Next Fit': {
      const after = freeBlocks.filter(({ b }) => b.start >= lastPointer);
      const before = freeBlocks.filter(({ b }) => b.start < lastPointer);
      return [...after, ...before][0];
    }
    default:
      return freeBlocks[0]; // First Fit
  }
}

export function allocate(state, processName, size, algorithm) {
  const request = Math.max(1, Math.floor(Number(size) || 0));
  const match = findFreeBlock(state.blocks, request, algorithm, state.lastPointer);
  if (!match) return { ...state, error: 'NO_SPACE' };

  const { b: freeBlock, index } = match;
  const newBlocks = [...state.blocks];

  if (freeBlock.size === request) {
    newBlocks[index] = {
      ...freeBlock,
      type: 'allocated',
      processId: state.nextProcessId,
      processName,
    };
  } else {
    const allocated = {
      start: freeBlock.start,
      size: request,
      type: 'allocated',
      processId: state.nextProcessId,
      processName,
    };
    const remaining = {
      start: freeBlock.start + request,
      size: freeBlock.size - request,
      type: 'free',
    };
    newBlocks.splice(index, 1, allocated, remaining);
  }

  return {
    ...state,
    blocks: newBlocks,
    nextProcessId: state.nextProcessId + 1,
    lastPointer: freeBlock.start + request,
  };
}

export function compact(state) {
  const allocated = state.blocks.filter((b) => b.type === 'allocated');
  let cursor = 0;
  const newBlocks = allocated.map((b) => {
    const moved = { ...b, start: cursor };
    cursor += b.size;
    return moved;
  });
  if (cursor < state.memorySize) {
    newBlocks.push({ start: cursor, size: state.memorySize - cursor, type: 'free' });
  }
  return { ...state, blocks: newBlocks };
}`
}
