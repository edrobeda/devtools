// Simulador de algoritmos de substituicao de pagina — 100% client-side.
// Implementa FIFO, LRU, LFU, Optimal e Clock (Second Chance) com passo a
// passo completo para visualizacao.

export const ALGORITHMS = ['FIFO', 'LRU', 'LFU', 'Optimal', 'Clock']

function parseReferences(input) {
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean)
  return String(input)
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function cloneState(frames, historyEntry) {
  return {
    frames: frames.map((f) => ({ ...f })),
    fault: historyEntry?.fault ?? false,
    replaced: historyEntry?.replaced ?? null,
    reference: historyEntry?.reference ?? null,
  }
}

function runFifo(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null)
  const queue = []
  const steps = []

  references.forEach((page, idx) => {
    const existingIndex = frames.findIndex((f) => f && f.page === page)
    if (existingIndex !== -1) {
      steps.push(cloneState(frames, { fault: false, replaced: null, reference: page }))
      return
    }

    let replaced = null
    if (queue.length < frameCount) {
      const emptyIdx = frames.findIndex((f) => f === null)
      frames[emptyIdx] = { page, r: 0 }
      queue.push(page)
    } else {
      const victimPage = queue.shift()
      const victimIdx = frames.findIndex((f) => f && f.page === victimPage)
      replaced = victimPage
      frames[victimIdx] = { page, r: 0 }
      queue.push(page)
    }

    steps.push(cloneState(frames, { fault: true, replaced, reference: page }))
  })

  return steps
}

function runLru(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null)
  const lastUsed = new Map()
  const insertionOrder = new Map()
  let clock = 0
  const steps = []

  references.forEach((page) => {
    clock += 1
    const existingIndex = frames.findIndex((f) => f && f.page === page)

    if (existingIndex !== -1) {
      lastUsed.set(page, clock)
      steps.push(cloneState(frames, { fault: false, replaced: null, reference: page }))
      return
    }

    let replaced = null
    const emptyIdx = frames.findIndex((f) => f === null)
    if (emptyIdx !== -1) {
      frames[emptyIdx] = { page, r: 0 }
      lastUsed.set(page, clock)
      insertionOrder.set(page, clock)
    } else {
      // Encontra o frame com menor lastUsed; empate pelo mais antigo.
      let victimIdx = 0
      let victimPage = frames[0].page
      for (let i = 1; i < frames.length; i += 1) {
        const currentPage = frames[i].page
        if (
          lastUsed.get(currentPage) < lastUsed.get(victimPage) ||
          (lastUsed.get(currentPage) === lastUsed.get(victimPage) &&
            insertionOrder.get(currentPage) < insertionOrder.get(victimPage))
        ) {
          victimIdx = i
          victimPage = currentPage
        }
      }
      replaced = victimPage
      frames[victimIdx] = { page, r: 0 }
      lastUsed.delete(victimPage)
      insertionOrder.delete(victimPage)
      lastUsed.set(page, clock)
      insertionOrder.set(page, clock)
    }

    steps.push(cloneState(frames, { fault: true, replaced, reference: page }))
  })

  return steps
}

function runLfu(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null)
  const frequency = new Map()
  const insertionOrder = new Map()
  let clock = 0
  const steps = []

  references.forEach((page) => {
    clock += 1
    const existingIndex = frames.findIndex((f) => f && f.page === page)

    if (existingIndex !== -1) {
      frequency.set(page, (frequency.get(page) || 0) + 1)
      steps.push(cloneState(frames, { fault: false, replaced: null, reference: page }))
      return
    }

    let replaced = null
    const emptyIdx = frames.findIndex((f) => f === null)
    if (emptyIdx !== -1) {
      frames[emptyIdx] = { page, r: 0 }
      frequency.set(page, 1)
      insertionOrder.set(page, clock)
    } else {
      // Menor frequencia; empate pelo mais antigo.
      let victimIdx = 0
      let victimPage = frames[0].page
      for (let i = 1; i < frames.length; i += 1) {
        const currentPage = frames[i].page
        if (
          frequency.get(currentPage) < frequency.get(victimPage) ||
          (frequency.get(currentPage) === frequency.get(victimPage) &&
            insertionOrder.get(currentPage) < insertionOrder.get(victimPage))
        ) {
          victimIdx = i
          victimPage = currentPage
        }
      }
      replaced = victimPage
      frames[victimIdx] = { page, r: 0 }
      frequency.delete(victimPage)
      insertionOrder.delete(victimPage)
      frequency.set(page, 1)
      insertionOrder.set(page, clock)
    }

    steps.push(cloneState(frames, { fault: true, replaced, reference: page }))
  })

  return steps
}

function runOptimal(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null)
  const steps = []

  references.forEach((page, idx) => {
    const existingIndex = frames.findIndex((f) => f && f.page === page)
    if (existingIndex !== -1) {
      steps.push(cloneState(frames, { fault: false, replaced: null, reference: page }))
      return
    }

    let replaced = null
    const emptyIdx = frames.findIndex((f) => f === null)
    if (emptyIdx !== -1) {
      frames[emptyIdx] = { page, r: 0 }
    } else {
      let victimIdx = 0
      let farthest = -1
      for (let i = 0; i < frames.length; i += 1) {
        const currentPage = frames[i].page
        const nextUse = references.slice(idx + 1).indexOf(currentPage)
        if (nextUse === -1) {
          victimIdx = i
          break
        }
        if (nextUse > farthest) {
          farthest = nextUse
          victimIdx = i
        }
      }
      replaced = frames[victimIdx].page
      frames[victimIdx] = { page, r: 0 }
    }

    steps.push(cloneState(frames, { fault: true, replaced, reference: page }))
  })

  return steps
}

function runClock(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null)
  let pointer = 0
  const steps = []

  references.forEach((page) => {
    const existingIndex = frames.findIndex((f) => f && f.page === page)
    if (existingIndex !== -1) {
      frames[existingIndex].r = 1
      steps.push(cloneState(frames, { fault: false, replaced: null, reference: page }))
      return
    }

    let replaced = null
    const emptyIdx = frames.findIndex((f) => f === null)
    if (emptyIdx !== -1) {
      frames[emptyIdx] = { page, r: 0 }
    } else {
      // Percorre circularmente ate encontrar um bit R === 0.
      while (frames[pointer].r === 1) {
        frames[pointer].r = 0
        pointer = (pointer + 1) % frameCount
      }
      replaced = frames[pointer].page
      frames[pointer] = { page, r: 0 }
      pointer = (pointer + 1) % frameCount
    }

    steps.push(cloneState(frames, { fault: true, replaced, reference: page }))
  })

  return steps
}

export function simulatePageReplacement(algorithm, referencesInput, frameCount) {
  const references = parseReferences(referencesInput)
  const count = Math.max(1, Math.min(8, Number(frameCount) || 3))

  let steps
  switch (algorithm) {
    case 'FIFO':
      steps = runFifo(references, count)
      break
    case 'LRU':
      steps = runLru(references, count)
      break
    case 'LFU':
      steps = runLfu(references, count)
      break
    case 'Optimal':
      steps = runOptimal(references, count)
      break
    case 'Clock':
      steps = runClock(references, count)
      break
    default:
      steps = runFifo(references, count)
  }

  const faults = steps.filter((s) => s.fault).length
  const hits = steps.length - faults
  const hitRate = steps.length ? (hits / steps.length) * 100 : 0

  return {
    references,
    frameCount: count,
    algorithm,
    steps,
    hits,
    faults,
    hitRate,
  }
}

export const PRESETS = {
  pt: [
    {
      key: 'basico',
      label: 'Basico (3 frames)',
      frames: 3,
      references: '1 2 3 4 1 2 5 1 2 3 4 5',
    },
    {
      key: 'belady',
      label: 'Anomalia de Belady',
      frames: 3,
      references: '1 2 3 4 1 2 5 1 2 3 4 5',
    },
    {
      key: 'localidade',
      label: 'Localidade tipica',
      frames: 4,
      references: '1 2 3 1 4 5 1 2 1 4 3 5 2 1 4',
    },
    {
      key: 'loop',
      label: 'Loop sequencial',
      frames: 3,
      references: 'A B C D A B E A B C D E',
    },
  ],
  en: [
    {
      key: 'basic',
      label: 'Basic (3 frames)',
      frames: 3,
      references: '1 2 3 4 1 2 5 1 2 3 4 5',
    },
    {
      key: 'belady',
      label: "Belady's Anomaly",
      frames: 3,
      references: '1 2 3 4 1 2 5 1 2 3 4 5',
    },
    {
      key: 'locality',
      label: 'Typical locality',
      frames: 4,
      references: '1 2 3 1 4 5 1 2 1 4 3 5 2 1 4',
    },
    {
      key: 'loop',
      label: 'Sequential loop',
      frames: 3,
      references: 'A B C D A B E A B C D E',
    },
  ],
}

export function sourceCode() {
  return `const ALGORITHMS = ['FIFO', 'LRU', 'LFU', 'Optimal', 'Clock'];

function runFifo(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null);
  const queue = [];
  const steps = [];

  references.forEach((page) => {
    const hit = frames.some((f) => f && f.page === page);
    if (hit) {
      steps.push({ frames: frames.map(f => f ? { ...f } : null), fault: false });
      return;
    }

    if (queue.length < frameCount) {
      const emptyIdx = frames.findIndex(f => f === null);
      frames[emptyIdx] = { page };
      queue.push(page);
    } else {
      const victim = queue.shift();
      const idx = frames.findIndex(f => f && f.page === victim);
      frames[idx] = { page };
      queue.push(page);
    }

    steps.push({ frames: frames.map(f => f ? { ...f } : null), fault: true });
  });

  return steps;
}

function runLru(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null);
  const lastUsed = new Map();
  let clock = 0;
  const steps = [];

  references.forEach((page) => {
    clock += 1;
    const existing = frames.findIndex(f => f && f.page === page);

    if (existing !== -1) {
      lastUsed.set(page, clock);
      steps.push({ frames: frames.map(f => f ? { ...f } : null), fault: false });
      return;
    }

    const emptyIdx = frames.findIndex(f => f === null);
    if (emptyIdx !== -1) {
      frames[emptyIdx] = { page };
      lastUsed.set(page, clock);
    } else {
      const victimIdx = frames.reduce((best, f, i) => {
        if (lastUsed.get(f.page) < lastUsed.get(frames[best].page)) return i;
        return best;
      }, 0);
      lastUsed.delete(frames[victimIdx].page);
      frames[victimIdx] = { page };
      lastUsed.set(page, clock);
    }

    steps.push({ frames: frames.map(f => f ? { ...f } : null), fault: true });
  });

  return steps;
}

function runOptimal(references, frameCount) {
  const frames = Array.from({ length: frameCount }, () => null);
  const steps = [];

  references.forEach((page, idx) => {
    const hit = frames.some(f => f && f.page === page);
    if (hit) {
      steps.push({ frames: frames.map(f => f ? { ...f } : null), fault: false });
      return;
    }

    const emptyIdx = frames.findIndex(f => f === null);
    if (emptyIdx !== -1) {
      frames[emptyIdx] = { page };
    } else {
      const victimIdx = frames.reduce((best, f, i) => {
        const nextUse = references.slice(idx + 1).indexOf(f.page);
        const bestNextUse = references.slice(idx + 1).indexOf(frames[best].page);
        if (nextUse === -1) return i;
        if (bestNextUse === -1) return best;
        return nextUse > bestNextUse ? i : best;
      }, 0);
      frames[victimIdx] = { page };
    }

    steps.push({ frames: frames.map(f => f ? { ...f } : null), fault: true });
  });

  return steps;
}`
}
