/**
 * Motor do Jogo da Vida de Conway — implementação 100% client-side.
 *
 * Regras clássicas, executadas sobre uma grade bidimensional com bordas
 * de corte (células fora dos limites são sempre mortas).
 */

export const PRESETS = {
  empty: {
    name: { pt: 'Vazio', en: 'Empty' },
    cells: [],
  },
  random: {
    name: { pt: 'Aleatório', en: 'Random' },
    cells: null, // tratado especialmente pelo criador de grade
  },
  glider: {
    name: { pt: 'Glider', en: 'Glider' },
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  },
  blinker: {
    name: { pt: 'Blinker', en: 'Blinker' },
    cells: [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  beacon: {
    name: { pt: 'Beacon', en: 'Beacon' },
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 2],
      [2, 3],
      [3, 2],
      [3, 3],
    ],
  },
  pulsar: {
    name: { pt: 'Pulsar', en: 'Pulsar' },
    cells: [
      [2, 4],
      [2, 5],
      [2, 6],
      [2, 10],
      [2, 11],
      [2, 12],
      [4, 2],
      [4, 7],
      [4, 9],
      [4, 14],
      [5, 2],
      [5, 7],
      [5, 9],
      [5, 14],
      [6, 2],
      [6, 7],
      [6, 9],
      [6, 14],
      [7, 4],
      [7, 5],
      [7, 6],
      [7, 10],
      [7, 11],
      [7, 12],
      [9, 4],
      [9, 5],
      [9, 6],
      [9, 10],
      [9, 11],
      [9, 12],
      [10, 2],
      [10, 7],
      [10, 9],
      [10, 14],
      [11, 2],
      [11, 7],
      [11, 9],
      [11, 14],
      [12, 2],
      [12, 7],
      [12, 9],
      [12, 14],
      [14, 4],
      [14, 5],
      [14, 6],
      [14, 10],
      [14, 11],
      [14, 12],
    ],
  },
  gosperGliderGun: {
    name: { pt: 'Gosper Glider Gun', en: 'Gosper Glider Gun' },
    cells: [
      [5, 1],
      [5, 2],
      [6, 1],
      [6, 2],
      [5, 11],
      [6, 11],
      [7, 11],
      [4, 12],
      [8, 12],
      [3, 13],
      [9, 13],
      [3, 14],
      [9, 14],
      [6, 15],
      [4, 16],
      [8, 16],
      [5, 17],
      [6, 17],
      [7, 17],
      [6, 18],
      [3, 21],
      [4, 21],
      [5, 21],
      [3, 22],
      [4, 22],
      [5, 22],
      [2, 23],
      [6, 23],
      [1, 25],
      [2, 25],
      [6, 25],
      [7, 25],
      [3, 35],
      [4, 35],
      [3, 36],
      [4, 36],
    ],
  },
}

/**
 * Cria uma grade vazia (ou aleatória, ou a partir de um preset) com as
 * dimensões informadas.
 */
export function createGrid(rows, cols, fill = 'empty', density = 0.3) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0))

  if (fill === 'random') {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r][c] = Math.random() < density ? 1 : 0
      }
    }
    return grid
  }

  const preset = PRESETS[fill]
  if (preset && preset.cells) {
    const offsetR = Math.floor(rows / 2) - 8
    const offsetC = Math.floor(cols / 2) - 8
    for (const [r, c] of preset.cells) {
      const rr = r + offsetR
      const cc = c + offsetC
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
        grid[rr][cc] = 1
      }
    }
  }

  return grid
}

function countNeighbors(grid, row, col) {
  let count = 0
  const rows = grid.length
  const cols = grid[0].length

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        count += grid[r][c]
      }
    }
  }

  return count
}

/**
 * Calcula a próxima geração aplicando as regras clássicas do Jogo da Vida.
 */
export function nextGeneration(grid) {
  const rows = grid.length
  const cols = grid[0].length
  const next = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const neighbors = countNeighbors(grid, r, c)
      const alive = grid[r][c] === 1

      if (alive && (neighbors === 2 || neighbors === 3)) {
        next[r][c] = 1
      } else if (!alive && neighbors === 3) {
        next[r][c] = 1
      }
    }
  }

  return next
}

/**
 * Retorna uma cópia da grade com a célula [row, col] invertida.
 */
export function toggleCell(grid, row, col) {
  const next = grid.map((line) => line.slice())
  next[row][col] = next[row][col] ? 0 : 1
  return next
}

/**
 * Conta células vivas na grade.
 */
export function countAlive(grid) {
  let total = 0
  for (const row of grid) {
    for (const cell of row) {
      total += cell
    }
  }
  return total
}

/**
 * Detecta se a grade atingiu um estado estável ou vazio.
 */
export function detectState(grid, previousGrid) {
  if (countAlive(grid) === 0) return 'extinct'
  if (!previousGrid) return 'running'

  const rows = grid.length
  const cols = grid[0].length
  let same = true
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== previousGrid[r][c]) {
        same = false
        break
      }
    }
    if (!same) break
  }

  return same ? 'stable' : 'running'
}
