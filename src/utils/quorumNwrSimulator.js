// Simulador de Quorum NWR — 100% client-side.
// Modelo usado por sistemas distribuidos estilo Dynamo: N replicas, W
// confirmacoes pra escrita e R leituras pra leitura. A regra W + R > N
// garante que toda leitura se sobrepoe a uma escrita recente.

export const PRESETS = {
  pt: [
    {
      key: 'dynamo',
      label: 'Dynamo padrao (N=3, W=2, R=2)',
      n: 3,
      w: 2,
      r: 2,
    },
    {
      key: 'fast-write',
      label: 'Escrita rapida (N=3, W=1, R=1)',
      n: 3,
      w: 1,
      r: 1,
    },
    {
      key: 'strong-consistency',
      label: 'Consistencia total (N=3, W=3, R=1)',
      n: 3,
      w: 3,
      r: 1,
    },
    {
      key: 'five-replicas',
      label: 'Cinco replicas balanceado (N=5, W=3, R=3)',
      n: 5,
      w: 3,
      r: 3,
    },
    {
      key: 'read-heavy',
      label: 'Leitura barata (N=5, W=4, R=2)',
      n: 5,
      w: 4,
      r: 2,
    },
  ],
  en: [
    {
      key: 'dynamo',
      label: 'Default Dynamo (N=3, W=2, R=2)',
      n: 3,
      w: 2,
      r: 2,
    },
    {
      key: 'fast-write',
      label: 'Fast writes (N=3, W=1, R=1)',
      n: 3,
      w: 1,
      r: 1,
    },
    {
      key: 'strong-consistency',
      label: 'Strong consistency (N=3, W=3, R=1)',
      n: 3,
      w: 3,
      r: 1,
    },
    {
      key: 'five-replicas',
      label: 'Five replicas balanced (N=5, W=3, R=3)',
      n: 5,
      w: 3,
      r: 3,
    },
    {
      key: 'read-heavy',
      label: 'Cheap reads (N=5, W=4, R=2)',
      n: 5,
      w: 4,
      r: 2,
    },
  ],
}

export function validateQuorum(n, w, r) {
  const errors = []
  if (!Number.isInteger(n) || n < 1) errors.push('n')
  if (!Number.isInteger(w) || w < 1 || w > n) errors.push('w')
  if (!Number.isInteger(r) || r < 1 || r > n) errors.push('r')
  return errors
}

export function analyzeQuorum(n, w, r) {
  const errors = validateQuorum(n, w, r)
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      isConsistent: false,
      overlap: 0,
      writeFaultTolerance: 0,
      readFaultTolerance: 0,
      bothFaultTolerance: 0,
      minActiveNodesForWrite: w,
      minActiveNodesForRead: r,
      classification: 'invalid',
    }
  }

  const overlap = w + r - n
  const isConsistent = overlap > 0
  const writeFaultTolerance = n - w
  const readFaultTolerance = n - r
  // Para continuar servindo escrita E leitura, precisamos de no maximo
  // (N - max(W, R)) falhas simultaneas? Nao exatamente. Precisamos que
  // existam ao menos W nodes vivos E R nodes vivos, ou seja, falhas <= N - W
  // e falhas <= N - R. O gargalo eh o maior quorum.
  const bothFaultTolerance = Math.min(writeFaultTolerance, readFaultTolerance)

  let classification = 'eventual'
  if (isConsistent) {
    if (w === n && r === n) classification = 'strict'
    else if (w + r === n + 1) classification = 'balanced'
    else classification = 'strong'
  } else {
    classification = 'eventual'
  }

  return {
    valid: true,
    errors: [],
    isConsistent,
    overlap: Math.max(0, overlap),
    writeFaultTolerance,
    readFaultTolerance,
    bothFaultTolerance,
    minActiveNodesForWrite: w,
    minActiveNodesForRead: r,
    classification,
  }
}

export function classifyLatencyCost(n, w, r) {
  // Estimativa simplificada: cada replica adiciona latencia de rede.
  const writeCost = w
  const readCost = r
  const totalCost = writeCost + readCost
  const maxCost = n * 2
  const ratio = maxCost > 0 ? totalCost / maxCost : 0
  return { writeCost, readCost, totalCost, maxCost, ratio }
}

export function sourceCode() {
  return `// Motor do simulador de Quorum NWR

export function analyzeQuorum(n, w, r) {
  const errors = []
  if (!Number.isInteger(n) || n < 1) errors.push('n')
  if (!Number.isInteger(w) || w < 1 || w > n) errors.push('w')
  if (!Number.isInteger(r) || r < 1 || r > n) errors.push('r')
  if (errors.length > 0) return { valid: false, errors }

  const overlap = w + r - n
  const isConsistent = overlap > 0
  const writeFaultTolerance = n - w
  const readFaultTolerance = n - r
  const bothFaultTolerance = Math.min(writeFaultTolerance, readFaultTolerance)

  let classification = 'eventual'
  if (isConsistent) {
    if (w === n && r === n) classification = 'strict'
    else if (w + r === n + 1) classification = 'balanced'
    else classification = 'strong'
  }

  return {
    valid: true,
    isConsistent,
    overlap: Math.max(0, overlap),
    writeFaultTolerance,
    readFaultTolerance,
    bothFaultTolerance,
    minActiveNodesForWrite: w,
    minActiveNodesForRead: r,
    classification,
  }
}

// Regra classica: W + R > N garante que toda leitura se sobrepoe
// a uma escrita confirmada, portanto leituras veem o valor mais recente.
`
}
