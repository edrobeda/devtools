// Simulador de detecção de deadlock baseado em Resource Allocation Graph
// com múltiplas instâncias por recurso. Tudo roda 100% no navegador.

export const MAX_INSTANCES = 12

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createState() {
  return {
    processes: [],
    resources: [],
    allocations: {}, // { resourceId: { processId: number } }
    requests: {},    // { resourceId: { processId: number } }
    nextProcessId: 1,
    nextResourceId: 1,
  }
}

export function addProcess(state, name) {
  const id = `p${state.nextProcessId++}`
  const newProcess = {
    id,
    name: name?.trim() || `P${state.nextProcessId - 1}`,
  }
  return {
    ...clone(state),
    processes: [...state.processes, newProcess],
  }
}

export function removeProcess(state, processId) {
  const processes = state.processes.filter((p) => p.id !== processId)
  const allocations = clone(state.allocations)
  const requests = clone(state.requests)

  for (const rid of Object.keys(allocations)) {
    if (allocations[rid]) delete allocations[rid][processId]
  }
  for (const rid of Object.keys(requests)) {
    if (requests[rid]) delete requests[rid][processId]
  }

  return { ...clone(state), processes, allocations, requests }
}

export function addResource(state, name, instances = 1) {
  const id = `r${state.nextResourceId++}`
  const total = Math.max(1, Math.min(MAX_INSTANCES, Number(instances) || 1))
  const newResource = {
    id,
    name: name?.trim() || `R${state.nextResourceId - 1}`,
    totalInstances: total,
  }
  const allocations = clone(state.allocations)
  const requests = clone(state.requests)
  allocations[id] = {}
  requests[id] = {}

  return {
    ...clone(state),
    resources: [...state.resources, newResource],
    allocations,
    requests,
  }
}

export function removeResource(state, resourceId) {
  const resources = state.resources.filter((r) => r.id !== resourceId)
  const allocations = clone(state.allocations)
  const requests = clone(state.requests)
  delete allocations[resourceId]
  delete requests[resourceId]

  return { ...clone(state), resources, allocations, requests }
}

export function getAllocated(state, resourceId, processId) {
  return state.allocations[resourceId]?.[processId] || 0
}

export function getRequested(state, resourceId, processId) {
  return state.requests[resourceId]?.[processId] || 0
}

export function setAllocation(state, processId, resourceId, count) {
  const value = Math.max(0, Number(count) || 0)
  const resource = state.resources.find((r) => r.id === resourceId)
  if (!resource) return clone(state)

  const available = resource.totalInstances - totalAllocated(state, resourceId) + getAllocated(state, resourceId, processId)
  const safeValue = Math.min(value, available)

  const allocations = clone(state.allocations)
  if (!allocations[resourceId]) allocations[resourceId] = {}
  if (safeValue > 0) allocations[resourceId][processId] = safeValue
  else delete allocations[resourceId][processId]

  return { ...clone(state), allocations }
}

export function setRequest(state, processId, resourceId, count) {
  const value = Math.max(0, Number(count) || 0)
  const resource = state.resources.find((r) => r.id === resourceId)
  if (!resource) return clone(state)

  const requests = clone(state.requests)
  if (!requests[resourceId]) requests[resourceId] = {}
  if (value > 0) requests[resourceId][processId] = value
  else delete requests[resourceId][processId]

  return { ...clone(state), requests }
}

export function releaseAll(state, processId, resourceId) {
  return setAllocation(state, processId, resourceId, 0)
}

export function totalAllocated(state, resourceId) {
  const map = state.allocations[resourceId] || {}
  return Object.values(map).reduce((sum, n) => sum + (Number(n) || 0), 0)
}

export function totalRequested(state, resourceId) {
  const map = state.requests[resourceId] || {}
  return Object.values(map).reduce((sum, n) => sum + (Number(n) || 0), 0)
}

export function availableInstances(state, resourceId) {
  const resource = state.resources.find((r) => r.id === resourceId)
  if (!resource) return 0
  return resource.totalInstances - totalAllocated(state, resourceId)
}

export function detectDeadlock(state) {
  const available = {}
  state.resources.forEach((r) => {
    available[r.id] = availableInstances(state, r.id)
  })

  const work = { ...available }
  const finish = {}
  state.processes.forEach((p) => {
    finish[p.id] = !hasAnyRequest(state, p.id)
  })

  const safeSequence = []
  let changed = true

  while (changed) {
    changed = false
    for (const process of state.processes) {
      if (finish[process.id]) continue
      if (canSatisfy(state, process.id, work)) {
        // Simula a conclusão do processo: libera suas alocações
        state.resources.forEach((r) => {
          work[r.id] += getAllocated(state, r.id, process.id)
        })
        finish[process.id] = true
        safeSequence.push(process.id)
        changed = true
      }
    }
  }

  const involvedProcessIds = state.processes
    .filter((p) => !finish[p.id])
    .map((p) => p.id)

  return {
    deadlock: involvedProcessIds.length > 0,
    involvedProcessIds,
    safeSequence,
    available,
  }
}

function hasAnyRequest(state, processId) {
  return state.resources.some((r) => getRequested(state, r.id, processId) > 0)
}

function canSatisfy(state, processId, work) {
  return state.resources.every((r) => {
    const need = getRequested(state, r.id, processId)
    return need <= work[r.id]
  })
}

// Gera dados posicionados para desenho SVG do Resource Allocation Graph.
// Processos ficam à esquerda, recursos à direita.
export function buildGraphLayout(state, width = 640, height = 360) {
  const paddingX = 72
  const paddingY = 56
  const usableHeight = Math.max(120, height - paddingY * 2)

  const processNodes = state.processes.map((p, i) => {
    const y = state.processes.length === 1
      ? height / 2
      : paddingY + (usableHeight / (state.processes.length - 1)) * i
    return {
      id: p.id,
      type: 'process',
      label: p.name,
      x: paddingX,
      y,
      inDeadlock: false,
    }
  })

  const resourceNodes = state.resources.map((r, i) => {
    const y = state.resources.length === 1
      ? height / 2
      : paddingY + (usableHeight / (state.resources.length - 1)) * i
    return {
      id: r.id,
      type: 'resource',
      label: r.name,
      instances: r.totalInstances,
      x: width - paddingX,
      y,
      available: availableInstances(state, r.id),
    }
  })

  const allocationEdges = []
  const requestEdges = []

  state.resources.forEach((r) => {
    const resNode = resourceNodes.find((n) => n.id === r.id)
    const allocations = state.allocations[r.id] || {}
    for (const [pid, count] of Object.entries(allocations)) {
      if (count > 0) {
        const procNode = processNodes.find((n) => n.id === pid)
        if (procNode) {
          allocationEdges.push({
            from: r.id,
            to: pid,
            count,
            source: resNode,
            target: procNode,
          })
        }
      }
    }

    const requests = state.requests[r.id] || {}
    for (const [pid, count] of Object.entries(requests)) {
      if (count > 0) {
        const procNode = processNodes.find((n) => n.id === pid)
        if (procNode) {
          requestEdges.push({
            from: pid,
            to: r.id,
            count,
            source: procNode,
            target: resNode,
          })
        }
      }
    }
  })

  return { processNodes, resourceNodes, allocationEdges, requestEdges, width, height }
}

export function loadScenario(key) {
  const scenarios = {
    classic: () => {
      let s = createState()
      s = addProcess(s, 'P1')
      s = addProcess(s, 'P2')
      s = addResource(s, 'R1', 1)
      s = addResource(s, 'R2', 1)
      s = setAllocation(s, 'p1', 'r1', 1)
      s = setAllocation(s, 'p2', 'r2', 1)
      s = setRequest(s, 'p1', 'r2', 1)
      s = setRequest(s, 'p2', 'r1', 1)
      return s
    },
    safe: () => {
      let s = createState()
      s = addProcess(s, 'P1')
      s = addProcess(s, 'P2')
      s = addResource(s, 'R1', 2)
      s = addResource(s, 'R2', 2)
      s = setAllocation(s, 'p1', 'r1', 1)
      s = setAllocation(s, 'p2', 'r2', 1)
      return s
    },
    multi: () => {
      let s = createState()
      s = addProcess(s, 'P1')
      s = addProcess(s, 'P2')
      s = addProcess(s, 'P3')
      s = addResource(s, 'R1', 3)
      s = addResource(s, 'R2', 3)
      s = setAllocation(s, 'p1', 'r1', 2)
      s = setAllocation(s, 'p2', 'r2', 2)
      s = setAllocation(s, 'p3', 'r1', 1)
      s = setRequest(s, 'p1', 'r2', 1)
      s = setRequest(s, 'p2', 'r1', 1)
      s = setRequest(s, 'p3', 'r2', 2)
      return s
    },
    chain: () => {
      let s = createState()
      s = addProcess(s, 'P1')
      s = addProcess(s, 'P2')
      s = addProcess(s, 'P3')
      s = addResource(s, 'R1', 1)
      s = addResource(s, 'R2', 1)
      s = addResource(s, 'R3', 1)
      s = setAllocation(s, 'p1', 'r1', 1)
      s = setAllocation(s, 'p2', 'r2', 1)
      s = setAllocation(s, 'p3', 'r3', 1)
      s = setRequest(s, 'p1', 'r2', 1)
      s = setRequest(s, 'p2', 'r3', 1)
      s = setRequest(s, 'p3', 'r1', 1)
      return s
    },
    noDeadlock: () => {
      let s = createState()
      s = addProcess(s, 'P1')
      s = addProcess(s, 'P2')
      s = addResource(s, 'R1', 2)
      s = setAllocation(s, 'p1', 'r1', 1)
      s = setRequest(s, 'p2', 'r1', 1)
      return s
    },
  }
  return scenarios[key]?.() || createState()
}

export function getScenarioLabels(lang = 'pt') {
  const labels = {
    pt: {
      classic: 'Deadlock clássico (2P / 2R)',
      safe: 'Sistema seguro',
      multi: 'Múltiplas instâncias',
      chain: 'Cadeia circular',
      noDeadlock: 'Sem deadlock',
    },
    en: {
      classic: 'Classic deadlock (2P / 2R)',
      safe: 'Safe system',
      multi: 'Multiple instances',
      chain: 'Circular chain',
      noDeadlock: 'No deadlock',
    },
  }
  return labels[lang] || labels.pt
}

export function formatCycle(processIds, state) {
  return processIds
    .map((pid) => state.processes.find((p) => p.id === pid)?.name || pid)
    .join(' → ')
}
