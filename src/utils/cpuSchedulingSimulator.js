// Simulador de algoritmos de escalonamento de CPU — 100% client-side.
// Nao emula um SO real; calcula metricas teoricas (Gantt, waiting time,
// turnaround time, etc.) a partir de uma lista de processos.

export const ALGORITHMS = {
  FCFS: 'fcfs',
  SJF_NON_PREEMPTIVE: 'sjf-non-preemptive',
  SJF_PREEMPTIVE: 'sjf-preemptive',
  PRIORITY_NON_PREEMPTIVE: 'priority-non-preemptive',
  PRIORITY_PREEMPTIVE: 'priority-preemptive',
  ROUND_ROBIN: 'round-robin',
}

export const ALGORITHM_LABELS = {
  pt: {
    [ALGORITHMS.FCFS]: 'FCFS (First Come, First Served)',
    [ALGORITHMS.SJF_NON_PREEMPTIVE]: 'SJF Nao Preemptivo',
    [ALGORITHMS.SJF_PREEMPTIVE]: 'SRTF (SJF Preemptivo)',
    [ALGORITHMS.PRIORITY_NON_PREEMPTIVE]: 'Prioridade Nao Preemptiva',
    [ALGORITHMS.PRIORITY_PREEMPTIVE]: 'Prioridade Preemptiva',
    [ALGORITHMS.ROUND_ROBIN]: 'Round Robin',
  },
  en: {
    [ALGORITHMS.FCFS]: 'FCFS (First Come, First Served)',
    [ALGORITHMS.SJF_NON_PREEMPTIVE]: 'Non-Preemptive SJF',
    [ALGORITHMS.SJF_PREEMPTIVE]: 'SRTF (Preemptive SJF)',
    [ALGORITHMS.PRIORITY_NON_PREEMPTIVE]: 'Non-Preemptive Priority',
    [ALGORITHMS.PRIORITY_PREEMPTIVE]: 'Preemptive Priority',
    [ALGORITHMS.ROUND_ROBIN]: 'Round Robin',
  },
}

export const ALGORITHM_DESCRIPTIONS = {
  pt: {
    [ALGORITHMS.FCFS]:
      'Os processos sao executados na ordem de chegada. Simples, mas pode causar longos tempos de espera se um processo longo chegar antes de varios curtos.',
    [ALGORITHMS.SJF_NON_PREEMPTIVE]:
      'Sempre escolhe o processo ja chegado com o menor tempo de burst. Minimiza o tempo medio de espera, mas pode causar starvation de processos longos.',
    [ALGORITHMS.SJF_PREEMPTIVE]:
      'Versao preemptiva do SJF (tambem chamada SRTF). Se um processo com tempo restante menor chegar, a CPU e retirada do processo atual.',
    [ALGORITHMS.PRIORITY_NON_PREEMPTIVE]:
      'Escolhe o processo de maior prioridade entre os ja chegados. Menor numero = maior prioridade. Pode causar starvation de processos de baixa prioridade.',
    [ALGORITHMS.PRIORITY_PREEMPTIVE]:
      'Se um processo com prioridade maior chegar, a CPU e preemptada. Menor numero = maior prioridade.',
    [ALGORITHMS.ROUND_ROBIN]:
      'Cada processo recebe um quantum de tempo. Apos o quantum, vai para o final da fila. Justo, mas o quantum influencia no numero de trocas de contexto.',
  },
  en: {
    [ALGORITHMS.FCFS]:
      'Processes run in arrival order. Simple, but may cause long wait times if a long process arrives before several short ones.',
    [ALGORITHMS.SJF_NON_PREEMPTIVE]:
      'Always picks the arrived process with the shortest burst time. Minimizes average waiting time, but may starve long processes.',
    [ALGORITHMS.SJF_PREEMPTIVE]:
      'Preemptive version of SJF (also called SRTF). If a new process with a shorter remaining time arrives, the current process is preempted.',
    [ALGORITHMS.PRIORITY_NON_PREEMPTIVE]:
      'Picks the arrived process with the highest priority. Lower number = higher priority. May starve low-priority processes.',
    [ALGORITHMS.PRIORITY_PREEMPTIVE]:
      'If a higher-priority process arrives, the CPU is preempted. Lower number = higher priority.',
    [ALGORITHMS.ROUND_ROBIN]:
      'Each process gets a time quantum. After the quantum it goes to the back of the queue. Fair, but the quantum size affects context switches.',
  },
}

export const PRESETS = {
  pt: [
    {
      key: 'fcfs-convoy',
      label: 'Efeito comboio (FCFS)',
      processes: [
        { pid: 'P1', arrival: 0, burst: 8, priority: 3 },
        { pid: 'P2', arrival: 1, burst: 2, priority: 1 },
        { pid: 'P3', arrival: 2, burst: 1, priority: 2 },
      ],
      algorithm: ALGORITHMS.FCFS,
      quantum: 2,
    },
    {
      key: 'sjf-optimal',
      label: 'SJF otimo',
      processes: [
        { pid: 'P1', arrival: 0, burst: 7, priority: 2 },
        { pid: 'P2', arrival: 2, burst: 4, priority: 3 },
        { pid: 'P3', arrival: 4, burst: 1, priority: 1 },
        { pid: 'P4', arrival: 5, burst: 4, priority: 4 },
      ],
      algorithm: ALGORITHMS.SJF_NON_PREEMPTIVE,
      quantum: 2,
    },
    {
      key: 'srtf-preempt',
      label: 'SRTF com preempcao',
      processes: [
        { pid: 'P1', arrival: 0, burst: 7, priority: 3 },
        { pid: 'P2', arrival: 1, burst: 3, priority: 2 },
        { pid: 'P3', arrival: 2, burst: 2, priority: 1 },
        { pid: 'P4', arrival: 3, burst: 5, priority: 4 },
      ],
      algorithm: ALGORITHMS.SJF_PREEMPTIVE,
      quantum: 2,
    },
    {
      key: 'priority-starvation',
      label: 'Prioridade e starvation',
      processes: [
        { pid: 'P1', arrival: 0, burst: 10, priority: 3 },
        { pid: 'P2', arrival: 0, burst: 5, priority: 1 },
        { pid: 'P3', arrival: 0, burst: 3, priority: 2 },
        { pid: 'P4', arrival: 6, burst: 1, priority: 1 },
      ],
      algorithm: ALGORITHMS.PRIORITY_PREEMPTIVE,
      quantum: 2,
    },
    {
      key: 'round-robin',
      label: 'Round Robin (q=2)',
      processes: [
        { pid: 'P1', arrival: 0, burst: 5, priority: 2 },
        { pid: 'P2', arrival: 1, burst: 3, priority: 1 },
        { pid: 'P3', arrival: 2, burst: 8, priority: 3 },
        { pid: 'P4', arrival: 3, burst: 6, priority: 4 },
      ],
      algorithm: ALGORITHMS.ROUND_ROBIN,
      quantum: 2,
    },
  ],
  en: [
    {
      key: 'fcfs-convoy',
      label: 'Convoy effect (FCFS)',
      processes: [
        { pid: 'P1', arrival: 0, burst: 8, priority: 3 },
        { pid: 'P2', arrival: 1, burst: 2, priority: 1 },
        { pid: 'P3', arrival: 2, burst: 1, priority: 2 },
      ],
      algorithm: ALGORITHMS.FCFS,
      quantum: 2,
    },
    {
      key: 'sjf-optimal',
      label: 'SJF optimal',
      processes: [
        { pid: 'P1', arrival: 0, burst: 7, priority: 2 },
        { pid: 'P2', arrival: 2, burst: 4, priority: 3 },
        { pid: 'P3', arrival: 4, burst: 1, priority: 1 },
        { pid: 'P4', arrival: 5, burst: 4, priority: 4 },
      ],
      algorithm: ALGORITHMS.SJF_NON_PREEMPTIVE,
      quantum: 2,
    },
    {
      key: 'srtf-preempt',
      label: 'SRTF with preemption',
      processes: [
        { pid: 'P1', arrival: 0, burst: 7, priority: 3 },
        { pid: 'P2', arrival: 1, burst: 3, priority: 2 },
        { pid: 'P3', arrival: 2, burst: 2, priority: 1 },
        { pid: 'P4', arrival: 3, burst: 5, priority: 4 },
      ],
      algorithm: ALGORITHMS.SJF_PREEMPTIVE,
      quantum: 2,
    },
    {
      key: 'priority-starvation',
      label: 'Priority and starvation',
      processes: [
        { pid: 'P1', arrival: 0, burst: 10, priority: 3 },
        { pid: 'P2', arrival: 0, burst: 5, priority: 1 },
        { pid: 'P3', arrival: 0, burst: 3, priority: 2 },
        { pid: 'P4', arrival: 6, burst: 1, priority: 1 },
      ],
      algorithm: ALGORITHMS.PRIORITY_PREEMPTIVE,
      quantum: 2,
    },
    {
      key: 'round-robin',
      label: 'Round Robin (q=2)',
      processes: [
        { pid: 'P1', arrival: 0, burst: 5, priority: 1 },
        { pid: 'P2', arrival: 1, burst: 3, priority: 2 },
        { pid: 'P3', arrival: 2, burst: 8, priority: 3 },
        { pid: 'P4', arrival: 3, burst: 6, priority: 4 },
      ],
      algorithm: ALGORITHMS.ROUND_ROBIN,
      quantum: 2,
    },
  ],
}

function normalizeProcesses(processes) {
  return processes
    .filter((p) => p && p.pid && p.burst > 0)
    .map((p) => ({
      pid: String(p.pid),
      arrival: Math.max(0, Math.floor(p.arrival || 0)),
      burst: Math.max(1, Math.floor(p.burst)),
      priority: Math.max(0, Math.floor(p.priority || 0)),
      remaining: Math.max(1, Math.floor(p.burst)),
      completed: false,
      completionTime: null,
      firstStart: null,
      responseTime: null,
    }))
    .sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid))
}

function cloneProcesses(processes) {
  return processes.map((p) => ({
    ...p,
    remaining: p.burst,
    completed: false,
    completionTime: null,
    firstStart: null,
    responseTime: null,
  }))
}

function selectProcess(readyQueue, algorithm) {
  if (readyQueue.length === 0) return null
  const sorted = [...readyQueue].sort((a, b) => {
    if (algorithm === ALGORITHMS.SJF_NON_PREEMPTIVE || algorithm === ALGORITHMS.SJF_PREEMPTIVE) {
      if (a.remaining !== b.remaining) return a.remaining - b.remaining
    }
    if (algorithm === ALGORITHMS.PRIORITY_NON_PREEMPTIVE || algorithm === ALGORITHMS.PRIORITY_PREEMPTIVE) {
      if (a.priority !== b.priority) return a.priority - b.priority
    }
    if (a.arrival !== b.arrival) return a.arrival - b.arrival
    return a.pid.localeCompare(b.pid)
  })
  return sorted[0]
}

export function simulate({ processes, algorithm, quantum = 2 }) {
  const normalized = normalizeProcesses(processes)
  if (normalized.length === 0) {
    return {
      timeline: [],
      processStats: [],
      averages: {
        turnaround: 0,
        waiting: 0,
        response: 0,
      },
      cpuUtilization: 0,
      throughput: 0,
      totalTime: 0,
    }
  }

  const procs = cloneProcesses(normalized)
  const timeline = []
  let currentTime = 0
  let completedCount = 0
  let lastPid = null
  let lastStart = 0

  const quantumValue = Math.max(1, Math.floor(quantum || 2))
  const isPreemptive =
    algorithm === ALGORITHMS.SJF_PREEMPTIVE ||
    algorithm === ALGORITHMS.PRIORITY_PREEMPTIVE ||
    algorithm === ALGORITHMS.ROUND_ROBIN

  while (completedCount < procs.length) {
    const ready = procs.filter((p) => !p.completed && p.arrival <= currentTime)

    if (ready.length === 0) {
      // CPU ociosa: avanca para o proximo arrival.
      const nextArrival = procs
        .filter((p) => !p.completed && p.arrival > currentTime)
        .sort((a, b) => a.arrival - b.arrival)[0]?.arrival
      if (nextArrival == null) break
      if (lastPid != null && lastPid !== '__IDLE__') {
        timeline.push({ pid: lastPid, start: lastStart, end: currentTime })
      } else if (lastPid === null && currentTime > 0) {
        timeline.push({ pid: '__IDLE__', start: lastStart, end: currentTime })
      }
      lastPid = '__IDLE__'
      lastStart = currentTime
      currentTime = nextArrival
      continue
    }

    const current = selectProcess(ready, algorithm)

    if (current.firstStart == null) {
      current.firstStart = currentTime
      current.responseTime = currentTime - current.arrival
    }

    let runTime
    if (algorithm === ALGORITHMS.ROUND_ROBIN) {
      runTime = Math.min(current.remaining, quantumValue)
    } else if (isPreemptive) {
      // Algoritmos preemptivos avancam uma unidade de cada vez.
      runTime = 1
    } else {
      // Nao preemptivos: executa ate o fim.
      runTime = current.remaining
    }

    if (lastPid && lastPid !== current.pid) {
      if (lastPid !== '__IDLE__') {
        timeline.push({ pid: lastPid, start: lastStart, end: currentTime })
      } else {
        timeline.push({ pid: '__IDLE__', start: lastStart, end: currentTime })
      }
      lastStart = currentTime
    }
    lastPid = current.pid

    current.remaining -= runTime
    currentTime += runTime

    if (current.remaining <= 0) {
      current.completed = true
      current.completionTime = currentTime
      completedCount += 1
      if (lastPid === current.pid) {
        timeline.push({ pid: current.pid, start: lastStart, end: currentTime })
      }
      lastPid = null
      lastStart = currentTime
    } else if (algorithm === ALGORITHMS.ROUND_ROBIN) {
      // Round robin preempta por quantum.
      timeline.push({ pid: current.pid, start: lastStart, end: currentTime })
      lastStart = currentTime
      lastPid = null
    }
  }

  // Fecha o ultimo segmento, se houver.
  if (lastPid != null && lastStart < currentTime) {
    timeline.push({ pid: lastPid, start: lastStart, end: currentTime })
  }

  const totalTime = Math.max(0, currentTime)
  const busyTime = timeline
    .filter((seg) => seg.pid !== '__IDLE__')
    .reduce((sum, seg) => sum + (seg.end - seg.start), 0)
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 0
  const throughput = totalTime > 0 ? procs.length / totalTime : 0

  const processStats = normalized.map((orig) => {
    const p = procs.find((x) => x.pid === orig.pid)
    const completion = p?.completionTime ?? totalTime
    const turnaround = completion - orig.arrival
    const waiting = turnaround - orig.burst
    const response = p?.responseTime ?? 0
    return {
      pid: orig.pid,
      arrival: orig.arrival,
      burst: orig.burst,
      priority: orig.priority,
      completionTime: completion,
      turnaroundTime: turnaround,
      waitingTime: waiting,
      responseTime: response,
    }
  })

  const avgTurnaround =
    processStats.reduce((sum, p) => sum + p.turnaroundTime, 0) / processStats.length
  const avgWaiting =
    processStats.reduce((sum, p) => sum + p.waitingTime, 0) / processStats.length
  const avgResponse =
    processStats.reduce((sum, p) => sum + p.responseTime, 0) / processStats.length

  return {
    timeline,
    processStats,
    averages: {
      turnaround: avgTurnaround,
      waiting: avgWaiting,
      response: avgResponse,
    },
    cpuUtilization,
    throughput,
    totalTime,
  }
}

export function sourceCode() {
  return `// Motor simplificado de escalonamento de CPU

function fcfs(processes) {
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival)
  const timeline = []
  let time = 0
  for (const p of sorted) {
    if (time < p.arrival) {
      timeline.push({ pid: 'IDLE', start: time, end: p.arrival })
      time = p.arrival
    }
    timeline.push({ pid: p.pid, start: time, end: time + p.burst })
    time += p.burst
  }
  return timeline
}

function sjf(processes, preemptive = false) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }))
  const timeline = []
  let time = 0
  let completed = 0
  let lastPid = null
  let lastStart = 0

  while (completed < procs.length) {
    const ready = procs.filter(p => !p.completed && p.arrival <= time)
    if (!ready.length) {
      const next = procs.filter(p => !p.completed).sort((a, b) => a.arrival - b.arrival)[0]
      if (lastPid) timeline.push({ pid: lastPid, start: lastStart, end: time })
      lastPid = 'IDLE'; lastStart = time
      time = next.arrival
      continue
    }
    const current = ready.sort((a, b) =>
      a.remaining - b.remaining || a.arrival - b.arrival || a.pid.localeCompare(b.pid)
    )[0]
    const slice = preemptive ? 1 : current.remaining
    if (lastPid && lastPid !== current.pid) {
      timeline.push({ pid: lastPid, start: lastStart, end: time })
      lastStart = time
    }
    lastPid = current.pid
    current.remaining -= slice
    time += slice
    if (current.remaining <= 0) {
      current.completed = true
      completed++
      timeline.push({ pid: current.pid, start: lastStart, end: time })
      lastPid = null
      lastStart = time
    }
  }
  return timeline
}

function roundRobin(processes, quantum) {
  const queue = processes.map(p => ({ ...p, remaining: p.burst }))
  const timeline = []
  let time = 0
  let idx = 0

  while (queue.some(p => p.remaining > 0)) {
    const arrived = queue.filter(p => p.arrival <= time && p.remaining > 0)
    if (!arrived.length) {
      const next = queue.filter(p => p.remaining > 0).sort((a, b) => a.arrival - b.arrival)[0]
      timeline.push({ pid: 'IDLE', start: time, end: next.arrival })
      time = next.arrival
      continue
    }
    const current = arrived[idx % arrived.length]
    const slice = Math.min(current.remaining, quantum)
    timeline.push({ pid: current.pid, start: time, end: time + slice })
    current.remaining -= slice
    time += slice
    idx = arrived.indexOf(current) + 1
  }
  return timeline
}`
}
