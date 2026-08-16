/**
 * Motor de simulação de pathfinding — A* e Dijkstra 100% client-side.
 *
 * Representação do grid: matriz bidimensional de strings.
 * Células possíveis: 'empty', 'wall', 'start', 'end', 'visited', 'path'.
 *
 * O algoritmo gera uma lista de "frames" (steps), onde cada frame é uma
 * snapshot imutável do grid num instante da busca. Isso permite animar a
 * exploração sem correr risco de estado inconsistente.
 */

export const CELL_TYPES = {
  EMPTY: 'empty',
  WALL: 'wall',
  START: 'start',
  END: 'end',
  VISITED: 'visited',
  PATH: 'path',
  CURRENT: 'current',
}

const DIRECTIONS_4 = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
]

export function createGrid(rows, cols, fill = CELL_TYPES.EMPTY) {
  return Array.from({ length: rows }, () => Array(cols).fill(fill))
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice())
}

export function setCell(grid, r, c, type) {
  const next = cloneGrid(grid)
  next[r][c] = type
  return next
}

export function findCell(grid, type) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === type) return { r, c }
    }
  }
  return null
}

export function countCells(grid, type) {
  let count = 0
  for (const row of grid) {
    for (const cell of row) {
      if (cell === type) count++
    }
  }
  return count
}

function heuristicManhattan(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

function heuristicEuclidean(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.c - b.c) ** 2)
}

function keyOf(node) {
  return `${node.r},${node.c}`
}

class MinHeap {
  constructor() {
    this.data = []
  }

  push(item) {
    this.data.push(item)
    this._bubbleUp(this.data.length - 1)
  }

  pop() {
    if (this.data.length === 0) return undefined
    const top = this.data[0]
    const last = this.data.pop()
    if (this.data.length > 0) {
      this.data[0] = last
      this._sinkDown(0)
    }
    return top
  }

  size() {
    return this.data.length
  }

  _bubbleUp(idx) {
    const item = this.data[idx]
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2)
      const parent = this.data[parentIdx]
      if (item.f < parent.f) {
        this.data[parentIdx] = item
        this.data[idx] = parent
        idx = parentIdx
      } else {
        break
      }
    }
  }

  _sinkDown(idx) {
    const length = this.data.length
    const item = this.data[idx]
    while (true) {
      const leftIdx = 2 * idx + 1
      const rightIdx = 2 * idx + 2
      let smallestIdx = idx
      if (leftIdx < length && this.data[leftIdx].f < this.data[smallestIdx].f) {
        smallestIdx = leftIdx
      }
      if (rightIdx < length && this.data[rightIdx].f < this.data[smallestIdx].f) {
        smallestIdx = rightIdx
      }
      if (smallestIdx === idx) break
      this.data[idx] = this.data[smallestIdx]
      this.data[smallestIdx] = item
      idx = smallestIdx
    }
  }
}

function buildSnapshot(grid, current, meta) {
  const next = cloneGrid(grid)
  if (current) {
    next[current.r][current.c] = CELL_TYPES.CURRENT
  }
  return {
    grid: next,
    current,
    visitedCount: meta.visitedCount,
    pathLength: meta.pathLength,
    cost: meta.cost,
    found: meta.found,
    done: meta.done,
  }
}

function reconstructPath(cameFrom, current) {
  const path = [current]
  let key = keyOf(current)
  while (cameFrom.has(key)) {
    const prev = cameFrom.get(key)
    path.unshift(prev)
    key = keyOf(prev)
  }
  return path
}

export function runPathfinding(grid, algorithm = 'astar', heuristicName = 'manhattan') {
  const rows = grid.length
  const cols = grid[0].length
  const start = findCell(grid, CELL_TYPES.START)
  const end = findCell(grid, CELL_TYPES.END)

  if (!start || !end) {
    return { steps: [], found: false, cost: 0, visitedCount: 0, pathLength: 0 }
  }

  const heuristic = heuristicName === 'euclidean' ? heuristicEuclidean : heuristicManhattan
  const isDijkstra = algorithm === 'dijkstra'

  const openSet = new MinHeap()
  openSet.push({ r: start.r, c: start.c, f: 0, g: 0 })

  const cameFrom = new Map()
  const gScore = new Map()
  const closed = new Set()
  gScore.set(keyOf(start), 0)

  const workingGrid = cloneGrid(grid)
  const steps = []

  const meta = { visitedCount: 0, pathLength: 0, cost: 0, found: false, done: false }
  steps.push(buildSnapshot(workingGrid, start, { ...meta }))

  while (openSet.size() > 0) {
    const current = openSet.pop()
    const currentKey = keyOf(current)

    if (closed.has(currentKey)) continue
    closed.add(currentKey)

    if (workingGrid[current.r][current.c] !== CELL_TYPES.START) {
      workingGrid[current.r][current.c] = CELL_TYPES.VISITED
    }
    meta.visitedCount = closed.size
    steps.push(buildSnapshot(workingGrid, current, { ...meta }))

    if (current.r === end.r && current.c === end.c) {
      const path = reconstructPath(cameFrom, current)
      for (const node of path) {
        if (
          workingGrid[node.r][node.c] !== CELL_TYPES.START &&
          workingGrid[node.r][node.c] !== CELL_TYPES.END
        ) {
          workingGrid[node.r][node.c] = CELL_TYPES.PATH
        }
      }
      meta.pathLength = path.length
      meta.cost = current.g
      meta.found = true
      meta.done = true
      steps.push(buildSnapshot(workingGrid, current, { ...meta }))
      break
    }

    for (const dir of DIRECTIONS_4) {
      const nr = current.r + dir.r
      const nc = current.c + dir.c
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (workingGrid[nr][nc] === CELL_TYPES.WALL) continue

      const neighbor = { r: nr, c: nc }
      const nKey = keyOf(neighbor)
      if (closed.has(nKey)) continue

      const tentativeG = current.g + 1
      const existingG = gScore.get(nKey)
      if (existingG === undefined || tentativeG < existingG) {
        cameFrom.set(nKey, { r: current.r, c: current.c })
        gScore.set(nKey, tentativeG)
        const h = isDijkstra ? 0 : heuristic(neighbor, end)
        openSet.push({ r: nr, c: nc, f: tentativeG + h, g: tentativeG })
      }
    }
  }

  if (!meta.found) {
    meta.done = true
    steps.push(buildSnapshot(workingGrid, null, { ...meta }))
  }

  return {
    steps,
    found: meta.found,
    cost: meta.cost,
    visitedCount: meta.visitedCount,
    pathLength: meta.pathLength,
  }
}

export function generateRandomGrid(rows, cols, wallChance = 0.25) {
  const grid = createGrid(rows, cols)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c] = Math.random() < wallChance ? CELL_TYPES.WALL : CELL_TYPES.EMPTY
    }
  }
  grid[Math.floor(rows / 2)][Math.floor(cols / 4)] = CELL_TYPES.START
  grid[Math.floor(rows / 2)][Math.floor((cols * 3) / 4)] = CELL_TYPES.END
  return grid
}

export function generateEmptyGrid(rows, cols) {
  const grid = createGrid(rows, cols)
  grid[Math.floor(rows / 2)][Math.floor(cols / 4)] = CELL_TYPES.START
  grid[Math.floor(rows / 2)][Math.floor((cols * 3) / 4)] = CELL_TYPES.END
  return grid
}

export function generateObstacleGrid(rows, cols) {
  const grid = createGrid(rows, cols)
  const midR = Math.floor(rows / 2)
  const midC = Math.floor(cols / 2)
  for (let r = 0; r < rows; r++) {
    if (Math.abs(r - midR) > 2) {
      grid[r][midC] = CELL_TYPES.WALL
    }
  }
  grid[midR][Math.floor(cols / 4)] = CELL_TYPES.START
  grid[midR][Math.floor((cols * 3) / 4)] = CELL_TYPES.END
  return grid
}

export const PRESETS = {
  empty: { name: { pt: 'Vazio', en: 'Empty' }, build: generateEmptyGrid },
  random: { name: { pt: 'Aleatório', en: 'Random' }, build: generateRandomGrid },
  obstacle: { name: { pt: 'Barreira central', en: 'Central barrier' }, build: generateObstacleGrid },
}
