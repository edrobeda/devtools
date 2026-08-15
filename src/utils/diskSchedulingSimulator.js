// Simulador de algoritmos de escalonamento de disco — 100% client-side.
// Calcula a ordem de atendimento dos cilindros, a sequencia percorrida pelo
// braco e metricas de seek (deslocamento) para FCFS, SSTF, SCAN, C-SCAN,
// LOOK e C-LOOK.

export const ALGORITHMS = {
  FCFS: 'fcfs',
  SSTF: 'sstf',
  SCAN: 'scan',
  C_SCAN: 'c-scan',
  LOOK: 'look',
  C_LOOK: 'c-look',
}

export const ALGORITHM_LABELS = {
  pt: {
    [ALGORITHMS.FCFS]: 'FCFS (First Come, First Served)',
    [ALGORITHMS.SSTF]: 'SSTF (Shortest Seek Time First)',
    [ALGORITHMS.SCAN]: 'SCAN (elevador)',
    [ALGORITHMS.C_SCAN]: 'C-SCAN (circular SCAN)',
    [ALGORITHMS.LOOK]: 'LOOK',
    [ALGORITHMS.C_LOOK]: 'C-LOOK',
  },
  en: {
    [ALGORITHMS.FCFS]: 'FCFS (First Come, First Served)',
    [ALGORITHMS.SSTF]: 'SSTF (Shortest Seek Time First)',
    [ALGORITHMS.SCAN]: 'SCAN (elevator)',
    [ALGORITHMS.C_SCAN]: 'C-SCAN (circular SCAN)',
    [ALGORITHMS.LOOK]: 'LOOK',
    [ALGORITHMS.C_LOOK]: 'C-LOOK',
  },
}

export const ALGORITHM_DESCRIPTIONS = {
  pt: {
    [ALGORITHMS.FCFS]:
      'Atende os cilindros na ordem em que chegam. Simples e justo, mas geralmente gera o maior deslocamento total.',
    [ALGORITHMS.SSTF]:
      'Sempre escolhe o cilindro solicitado mais proximo da posicao atual. Reduz o seek medio, mas pode deixar requisicoes distantes esperando indefinidamente (starvation).',
    [ALGORITHMS.SCAN]:
      'O braco sobe atendendo requisicoes ate o final do disco, depois desce atendendo as restantes. Semelhante a um elevador; evita starvation, mas quem acabou de perder a subida espera duas viagens.',
    [ALGORITHMS.C_SCAN]:
      'Variacao circular do SCAN: sobe atendendo, vai ate o final, retorna rapidamente ao inicio sem atender ninguem e sobe novamente. Distribui o tempo de espera de forma mais uniforme.',
    [ALGORITHMS.LOOK]:
      'Igual ao SCAN, mas o braco so vai ate a requisicao mais alta (nao ate o final do disco) e depois ate a mais baixa. Menos seek desperdicado.',
    [ALGORITHMS.C_LOOK]:
      'Variacao circular do LOOK: sobe ate a ultima requisicao, salta ate a primeira e continua subindo.',
  },
  en: {
    [ALGORITHMS.FCFS]:
      'Serves cylinders in the order they arrive. Simple and fair, but usually yields the highest total head movement.',
    [ALGORITHMS.SSTF]:
      'Always picks the pending request closest to the current head position. Reduces average seek time, but may starve far-away requests.',
    [ALGORITHMS.SCAN]:
      'The arm moves up serving requests until the end of the disk, then moves down serving the remaining ones. Like an elevator; prevents starvation, but requests just missing the upward pass wait two sweeps.',
    [ALGORITHMS.C_SCAN]:
      'Circular SCAN variant: serves requests while moving up, jumps to the beginning without serving anyone, and moves up again. Provides a more uniform waiting time.',
    [ALGORITHMS.LOOK]:
      'Like SCAN, but the arm only goes as far as the highest pending request before reversing, and only as low as the lowest one. Wastes less seek.',
    [ALGORITHMS.C_LOOK]:
      'Circular LOOK variant: serves while moving up to the highest request, jumps to the lowest, and continues moving up.',
  },
}

export const PRESETS = {
  pt: [
    {
      key: 'fcfs-queued',
      label: 'Fila padrao',
      requests: [82, 170, 43, 140, 24, 16, 190],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.FCFS,
    },
    {
      key: 'sstf-clustered',
      label: 'Cluster proximo',
      requests: [95, 180, 34, 119, 11, 123, 62, 64],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.SSTF,
    },
    {
      key: 'scan-elevator',
      label: 'Elevador (SCAN)',
      requests: [82, 170, 43, 140, 24, 16, 190],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.SCAN,
    },
    {
      key: 'cscan-uniform',
      label: 'C-SCAN uniforme',
      requests: [82, 170, 43, 140, 24, 16, 190],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.C_SCAN,
    },
    {
      key: 'look-balanced',
      label: 'LOOK equilibrado',
      requests: [95, 180, 34, 119, 11, 123, 62, 64],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.LOOK,
    },
  ],
  en: [
    {
      key: 'fcfs-queued',
      label: 'Standard queue',
      requests: [82, 170, 43, 140, 24, 16, 190],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.FCFS,
    },
    {
      key: 'sstf-clustered',
      label: 'Nearby cluster',
      requests: [95, 180, 34, 119, 11, 123, 62, 64],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.SSTF,
    },
    {
      key: 'scan-elevator',
      label: 'Elevator (SCAN)',
      requests: [82, 170, 43, 140, 24, 16, 190],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.SCAN,
    },
    {
      key: 'cscan-uniform',
      label: 'Uniform C-SCAN',
      requests: [82, 170, 43, 140, 24, 16, 190],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.C_SCAN,
    },
    {
      key: 'look-balanced',
      label: 'Balanced LOOK',
      requests: [95, 180, 34, 119, 11, 123, 62, 64],
      initialHead: 50,
      maxCylinder: 200,
      algorithm: ALGORITHMS.LOOK,
    },
  ],
}

function normalizeInput(requests, initialHead, maxCylinder) {
  const max = Math.max(1, Math.floor(maxCylinder || 200))
  const head = Math.min(Math.max(0, Math.floor(initialHead ?? 0)), max - 1)
  const valid = []
  const ignored = []
  ;(Array.isArray(requests) ? requests : [])
    .map((v) => (typeof v === 'string' ? Number(v.trim()) : Number(v)))
    .forEach((v, i) => {
      if (!Number.isFinite(v)) return
      const n = Math.floor(v)
      if (n < 0 || n >= max) ignored.push({ index: i, value: n })
      else valid.push(n)
    })
  return { requests: valid, initialHead: head, maxCylinder: max, ignored }
}

function pushMove(sequence, from, to) {
  const last = sequence[sequence.length - 1]
  const lastPos = last != null ? last.position : from
  if (to !== lastPos) {
    sequence.push({ position: to, distance: Math.abs(to - lastPos) })
  }
}

function finishSequence(sequence, initialHead) {
  if (sequence.length === 0) return [{ position: initialHead, distance: 0 }]
  return sequence
}

function runFcfs(requests, initialHead) {
  const sequence = [{ position: initialHead, distance: 0 }]
  for (const r of requests) pushMove(sequence, null, r)
  return finishSequence(sequence, initialHead)
}

function runSstf(requests, initialHead) {
  const pending = requests.slice()
  const sequence = [{ position: initialHead, distance: 0 }]
  let head = initialHead
  while (pending.length > 0) {
    let bestIdx = 0
    let bestDist = Math.abs(pending[0] - head)
    for (let i = 1; i < pending.length; i++) {
      const d = Math.abs(pending[i] - head)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    head = pending[bestIdx]
    pending.splice(bestIdx, 1)
    pushMove(sequence, null, head)
  }
  return finishSequence(sequence, initialHead)
}

function runScan(requests, initialHead, maxCylinder) {
  const sorted = Array.from(new Set(requests)).sort((a, b) => a - b)
  const lower = sorted.filter((r) => r < initialHead)
  const upper = sorted.filter((r) => r >= initialHead)

  const sequence = [{ position: initialHead, distance: 0 }]

  // sobe atendendo upper em ordem crescente
  for (const r of upper) pushMove(sequence, null, r)

  // toca o final se ainda nao estiver la (e ha movimento)
  const end = maxCylinder - 1
  if (upper.length > 0 && upper[upper.length - 1] !== end) {
    pushMove(sequence, null, end)
  }

  // desce atendendo lower em ordem decrescente
  for (let i = lower.length - 1; i >= 0; i--) pushMove(sequence, null, lower[i])

  return finishSequence(sequence, initialHead)
}

function runCscan(requests, initialHead, maxCylinder) {
  const sorted = Array.from(new Set(requests)).sort((a, b) => a - b)
  const lower = sorted.filter((r) => r < initialHead)
  const upper = sorted.filter((r) => r >= initialHead)
  const end = maxCylinder - 1

  const sequence = [{ position: initialHead, distance: 0 }]

  // sobe atendendo upper
  for (const r of upper) pushMove(sequence, null, r)
  pushMove(sequence, null, end)

  // retorno rapido ao inicio
  pushMove(sequence, null, 0)

  // continua subindo atendendo lower
  for (const r of lower) pushMove(sequence, null, r)

  return finishSequence(sequence, initialHead)
}

function runLook(requests, initialHead) {
  const sorted = Array.from(new Set(requests)).sort((a, b) => a - b)
  const lower = sorted.filter((r) => r < initialHead)
  const upper = sorted.filter((r) => r >= initialHead)

  const sequence = [{ position: initialHead, distance: 0 }]

  for (const r of upper) pushMove(sequence, null, r)
  for (let i = lower.length - 1; i >= 0; i--) pushMove(sequence, null, lower[i])

  return finishSequence(sequence, initialHead)
}

function runCLook(requests, initialHead) {
  const sorted = Array.from(new Set(requests)).sort((a, b) => a - b)
  const lower = sorted.filter((r) => r < initialHead)
  const upper = sorted.filter((r) => r >= initialHead)

  const sequence = [{ position: initialHead, distance: 0 }]

  for (const r of upper) pushMove(sequence, null, r)
  if (lower.length > 0) {
    pushMove(sequence, null, lower[0])
    for (let i = 1; i < lower.length; i++) pushMove(sequence, null, lower[i])
  }

  return finishSequence(sequence, initialHead)
}

export function simulate({ requests, initialHead, maxCylinder, algorithm }) {
  const normalized = normalizeInput(requests, initialHead, maxCylinder)
  const { requests: valid, ignored } = normalized

  if (valid.length === 0) {
    return {
      sequence: [{ position: normalized.initialHead, distance: 0 }],
      servedOrder: [],
      ignored,
      totalSeek: 0,
      averageSeek: 0,
      maxSeek: 0,
    }
  }

  let sequence
  switch (algorithm) {
    case ALGORITHMS.SSTF:
      sequence = runSstf(valid, normalized.initialHead)
      break
    case ALGORITHMS.SCAN:
      sequence = runScan(valid, normalized.initialHead, normalized.maxCylinder)
      break
    case ALGORITHMS.C_SCAN:
      sequence = runCscan(valid, normalized.initialHead, normalized.maxCylinder)
      break
    case ALGORITHMS.LOOK:
      sequence = runLook(valid, normalized.initialHead)
      break
    case ALGORITHMS.C_LOOK:
      sequence = runCLook(valid, normalized.initialHead)
      break
    case ALGORITHMS.FCFS:
    default:
      sequence = runFcfs(valid, normalized.initialHead)
      break
  }

  const seekTimes = sequence.slice(1).map((s) => s.distance)
  const totalSeek = seekTimes.reduce((sum, d) => sum + d, 0)
  const maxSeek = seekTimes.length > 0 ? Math.max(...seekTimes) : 0
  const averageSeek = seekTimes.length > 0 ? totalSeek / seekTimes.length : 0

  const visited = new Set()
  const servedOrder = []
  for (const s of sequence) {
    if (!visited.has(s.position)) {
      visited.add(s.position)
      if (valid.includes(s.position)) servedOrder.push(s.position)
    }
  }

  return {
    sequence,
    servedOrder,
    ignored,
    totalSeek,
    averageSeek,
    maxSeek,
  }
}

export function sourceCode() {
  return `// Motor simplificado de escalonamento de disco

function sstf(requests, head) {
  const pending = [...requests]
  const path = [head]
  while (pending.length) {
    let bestIdx = 0
    let bestDist = Math.abs(pending[0] - head)
    for (let i = 1; i < pending.length; i++) {
      const d = Math.abs(pending[i] - head)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    head = pending.splice(bestIdx, 1)[0]
    path.push(head)
  }
  return path
}

function scan(requests, head, maxCylinder) {
  const sorted = [...new Set(requests)].sort((a, b) => a - b)
  const lower = sorted.filter(r => r < head)
  const upper = sorted.filter(r => r >= head)
  return [
    head,
    ...upper,
    maxCylinder - 1,
    ...lower.reverse(),
  ]
}

function cscan(requests, head, maxCylinder) {
  const sorted = [...new Set(requests)].sort((a, b) => a - b)
  const lower = sorted.filter(r => r < head)
  const upper = sorted.filter(r => r >= head)
  return [
    head,
    ...upper,
    maxCylinder - 1,
    0,
    ...lower,
  ]
}

function look(requests, head) {
  const sorted = [...new Set(requests)].sort((a, b) => a - b)
  return [
    head,
    ...sorted.filter(r => r >= head),
    ...sorted.filter(r => r < head).reverse(),
  ]
}`
}
