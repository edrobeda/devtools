// Simulador do Algoritmo do Banqueiro (Banker's Algorithm) — 100% client-side.
// Implementa a verificacao de estado seguro e a simulacao de requisicoes de
// recursos conforme o classico algoritmo de Dijkstra/Habermann.

function cloneMatrix(m) {
  return m.map((row) => [...row])
}

function cloneArray(a) {
  return [...a]
}

export function validateState(available, allocation, max) {
  const p = allocation.length
  const r = available.length
  const errors = []

  if (p === 0) errors.push('At least one process is required')
  if (r === 0) errors.push('At least one resource type is required')

  for (let i = 0; i < p; i += 1) {
    if (!allocation[i] || allocation[i].length !== r) {
      errors.push(`Process ${i}: allocation row size mismatch`)
      continue
    }
    if (!max[i] || max[i].length !== r) {
      errors.push(`Process ${i}: max row size mismatch`)
      continue
    }
    for (let j = 0; j < r; j += 1) {
      const alloc = Number(allocation[i][j]) || 0
      const mx = Number(max[i][j]) || 0
      if (alloc < 0 || mx < 0) {
        errors.push(`Process ${i}, resource ${j}: negative value`)
      }
      if (alloc > mx) {
        errors.push(`Process ${i}, resource ${j}: allocation > max`)
      }
    }
  }

  if (available.length !== r) {
    errors.push('Available vector size mismatch')
  } else {
    for (let j = 0; j < r; j += 1) {
      if ((Number(available[j]) || 0) < 0) {
        errors.push(`Resource ${j}: negative available`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function computeNeed(allocation, max) {
  return allocation.map((row, i) =>
    row.map((alloc, j) => {
      const mx = Number(max[i][j]) || 0
      const al = Number(alloc) || 0
      return Math.max(0, mx - al)
    })
  )
}

export function checkSafeState(available, allocation, max) {
  const validation = validateState(available, allocation, max)
  if (!validation.valid) {
    return {
      safe: false,
      sequence: [],
      steps: [],
      error: validation.errors.join('; '),
    }
  }

  const work = cloneArray(available).map((v) => Number(v) || 0)
  const need = computeNeed(allocation, max)
  const finish = new Array(allocation.length).fill(false)
  const sequence = []
  const steps = []

  let progress = true
  while (progress && finish.some((f) => !f)) {
    progress = false
    for (let i = 0; i < allocation.length; i += 1) {
      if (finish[i]) continue

      const canRun = need[i].every((n, j) => n <= work[j])
      if (canRun) {
        const released = cloneArray(allocation[i]).map((v) => Number(v) || 0)
        const workBefore = cloneArray(work)
        for (let j = 0; j < work.length; j += 1) {
          work[j] += released[j]
        }
        finish[i] = true
        sequence.push(i)
        steps.push({
          process: i,
          workBefore,
          workAfter: cloneArray(work),
          released,
          reason: `Need[${i}] = [${need[i].join(', ')}] <= Work [${workBefore.join(', ')}]`,
        })
        progress = true
      }
    }
  }

  const safe = finish.every((f) => f)
  return {
    safe,
    sequence,
    steps,
    need,
    work,
    error: safe
      ? null
      : `No safe sequence exists; processes [${finish
          .map((f, i) => (f ? -1 : i))
          .filter((i) => i !== -1)
          .join(', ')}] would remain blocked`,
  }
}

export function requestResources(available, allocation, max, processIndex, request) {
  const validation = validateState(available, allocation, max)
  if (!validation.valid) {
    return {
      granted: false,
      reason: validation.errors.join('; '),
    }
  }

  const p = allocation.length
  const r = available.length

  if (processIndex < 0 || processIndex >= p) {
    return {
      granted: false,
      reason: `Invalid process index ${processIndex}`,
    }
  }

  if (!request || request.length !== r) {
    return {
      granted: false,
      reason: 'Request vector size mismatch',
    }
  }

  const need = computeNeed(allocation, max)
  const req = request.map((v) => Number(v) || 0)

  // 1. Verifica se request <= need
  for (let j = 0; j < r; j += 1) {
    if (req[j] > need[processIndex][j]) {
      return {
        granted: false,
        reason: `Request [${req.join(', ')}] exceeds Need[${processIndex}] = [${need[processIndex].join(', ')}]`,
      }
    }
  }

  // 2. Verifica se request <= available
  for (let j = 0; j < r; j += 1) {
    if (req[j] > available[j]) {
      return {
        granted: false,
        reason: `Request [${req.join(', ')}] exceeds Available [${available.join(', ')}]`,
      }
    }
  }

  // 3. Simula a concessao
  const newAvailable = cloneArray(available).map((v) => Number(v) || 0)
  const newAllocation = cloneMatrix(allocation).map((row) => row.map((v) => Number(v) || 0))
  const newMax = cloneMatrix(max)

  for (let j = 0; j < r; j += 1) {
    newAvailable[j] -= req[j]
    newAllocation[processIndex][j] += req[j]
  }

  const safeCheck = checkSafeState(newAvailable, newAllocation, newMax)

  if (safeCheck.safe) {
    return {
      granted: true,
      reason: `Request granted; safe sequence found: [${safeCheck.sequence.join(' → ')}]`,
      newAvailable,
      newAllocation,
      newNeed: computeNeed(newAllocation, newMax),
      safeSequence: safeCheck.sequence,
    }
  }

  // 4. Se o novo estado nao for seguro, nega a requisicao
  return {
    granted: false,
    reason: `Request would leave the system in an unsafe state (${safeCheck.error}). Denied to avoid potential deadlock.`,
    hypotheticalAvailable: newAvailable,
    hypotheticalAllocation: newAllocation,
  }
}

export const PRESETS = {
  pt: [
    {
      key: 'safe',
      label: 'Estado seguro classico',
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
    },
    {
      key: 'unsafe',
      label: 'Estado inseguro',
      available: [1, 0, 0],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
    },
    {
      key: 'request',
      label: 'Requisicao de P1 (1,0,2)',
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
      requestProcess: 1,
      request: [1, 0, 2],
    },
    {
      key: 'denied',
      label: 'Requisicao negada (P0 0,2,0)',
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
      requestProcess: 0,
      request: [0, 2, 0],
    },
  ],
  en: [
    {
      key: 'safe',
      label: 'Classic safe state',
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
    },
    {
      key: 'unsafe',
      label: 'Unsafe state',
      available: [1, 0, 0],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
    },
    {
      key: 'request',
      label: 'P1 request (1,0,2)',
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
      requestProcess: 1,
      request: [1, 0, 2],
    },
    {
      key: 'denied',
      label: 'Denied request (P0 0,2,0)',
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
      requestProcess: 0,
      request: [0, 2, 0],
    },
  ],
}

export function sourceCode() {
  return `function checkSafeState(available, allocation, max) {
  const work = [...available].map(v => Number(v) || 0);
  const finish = new Array(allocation.length).fill(false);
  const sequence = [];

  // need[i][j] = max[i][j] - allocation[i][j]
  const need = allocation.map((row, i) =>
    row.map((alloc, j) => Math.max(0, (max[i][j] || 0) - (alloc || 0)))
  );

  let progress = true;
  while (progress && finish.some(f => !f)) {
    progress = false;
    for (let i = 0; i < allocation.length; i += 1) {
      if (finish[i]) continue;
      const canRun = need[i].every((n, j) => n <= work[j]);
      if (canRun) {
        for (let j = 0; j < work.length; j += 1) {
          work[j] += (allocation[i][j] || 0);
        }
        finish[i] = true;
        sequence.push(i);
        progress = true;
      }
    }
  }

  return {
    safe: finish.every(f => f),
    sequence,
    work,
  };
}

function requestResources(available, allocation, max, processIndex, request) {
  const need = allocation.map((row, i) =>
    row.map((alloc, j) => Math.max(0, (max[i][j] || 0) - (alloc || 0)))
  );

  // 1. request <= need
  if (request.some((r, j) => r > need[processIndex][j])) {
    return { granted: false, reason: 'Request exceeds maximum claim' };
  }

  // 2. request <= available
  if (request.some((r, j) => r > available[j])) {
    return { granted: false, reason: 'Not enough resources available' };
  }

  // 3. Simulate allocation
  const newAvailable = [...available].map((v, j) => v - request[j]);
  const newAllocation = allocation.map((row, i) =>
    i === processIndex ? row.map((v, j) => v + request[j]) : [...row]
  );

  // 4. Grant only if the resulting state is safe
  const check = checkSafeState(newAvailable, newAllocation, max);
  if (check.safe) {
    return { granted: true, newAvailable, newAllocation, safeSequence: check.sequence };
  }

  return { granted: false, reason: 'Would lead to an unsafe state' };
}`
}
