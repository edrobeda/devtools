const AREA_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#eb2f96',
  '#722ed1', '#13c2c2', '#f5222d', '#faad14',
  '#2f54eb', '#a0d911',
]

export function getAreaColor(index) {
  return AREA_COLORS[index % AREA_COLORS.length]
}

export function validateGrid(rows, cols) {
  const r = Math.max(1, Math.min(8, Number(rows) || 1))
  const c = Math.max(1, Math.min(8, Number(cols) || 1))
  return { rows: r, cols: c }
}

export function createEmptyGrid(rows, cols, value = '.') {
  return Array.from({ length: rows }, () => Array(cols).fill(value))
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row])
}

export function getUsedAreas(grid) {
  const set = new Set()
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell !== '.') set.add(cell)
    }
  }
  return [...set].sort()
}

export function generateAreaNames(count) {
  const names = []
  for (let i = 0; i < count; i++) {
    names.push(String.fromCharCode(97 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : ''))
  }
  return names
}

export function nextAreaName(used) {
  const all = generateAreaNames(Math.max(used.length, 0) + 26)
  return all.find((n) => !used.includes(n)) || 'a'
}

export function buildGridTemplateAreas(grid) {
  return grid.map((row) => `"${row.join(' ')}"`).join('\n  ')
}

export function buildGridCss(grid, rows, cols, gap) {
  const areas = buildGridTemplateAreas(grid)
  const used = getUsedAreas(grid)
  let css = `.container {\n`
  css += `  display: grid;\n`
  css += `  grid-template-columns: repeat(${cols}, 1fr);\n`
  css += `  grid-template-rows: repeat(${rows}, 1fr);\n`
  if (gap) css += `  gap: ${gap};\n`
  css += `  grid-template-areas:\n    ${areas.split('\n  ').join('\n    ')};\n`
  css += `}\n\n`
  used.forEach((area) => {
    css += `.area-${area} { grid-area: ${area}; }\n`
  })
  if (!used.length) css = css.trimEnd() + '\n'
  return css.trim()
}

export function buildHtmlSkeleton(grid, rows, cols, used, gap) {
  if (!used.length) {
    return `<div class="container">\n  <!-- empty grid ${rows}×${cols} -->\n</div>`
  }
  const lines = used.map((area) => `  <div class="area-${area}">${area}</div>`)
  return `<div class="container">\n${lines.join('\n')}\n</div>`
}

export function buildFullSnippet(grid, rows, cols, gap) {
  const css = buildGridCss(grid, rows, cols, gap)
  const used = getUsedAreas(grid)
  const html = buildHtmlSkeleton(grid, rows, cols, used, gap)
  return `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
}

export function floodFill(grid, startRow, startCol, target, replacement) {
  if (target === replacement) return grid
  const rows = grid.length
  const cols = grid[0]?.length || 0
  const out = cloneGrid(grid)
  const stack = [[startRow, startCol]]
  while (stack.length) {
    const [r, c] = stack.pop()
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue
    if (out[r][c] !== target) continue
    out[r][c] = replacement
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1])
  }
  return out
}

export function findAreaRect(grid, area) {
  let minR = Infinity, minC = Infinity, maxR = -1, maxC = -1
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === area) {
        minR = Math.min(minR, r)
        minC = Math.min(minC, c)
        maxR = Math.max(maxR, r)
        maxC = Math.max(maxC, c)
      }
    }
  }
  if (maxR === -1) return null
  return { top: minR, left: minC, bottom: maxR, right: maxC }
}

export function isRectangular(grid, area) {
  const rect = findAreaRect(grid, area)
  if (!rect) return false
  const { top, left, bottom, right } = rect
  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      if (grid[r][c] !== area) return false
    }
  }
  return true
}

export function validateAreas(grid) {
  const used = getUsedAreas(grid)
  const errors = []
  for (const area of used) {
    if (!isRectangular(grid, area)) {
      errors.push({ area, message: `area "${area}" is not a solid rectangle` })
    }
  }
  return errors
}

export function autoNameRectangles(grid) {
  const rows = grid.length
  const cols = grid[0]?.length || 0
  const out = createEmptyGrid(rows, cols, '.')
  let nameIndex = 0
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited[r][c] || grid[r][c] === '.') continue
      const area = String.fromCharCode(97 + nameIndex)
      nameIndex = (nameIndex + 1) % 26
      const target = grid[r][c]
      const stack = [[r, c]]
      while (stack.length) {
        const [cr, cc] = stack.pop()
        if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue
        if (visited[cr][cc] || grid[cr][cc] !== target) continue
        visited[cr][cc] = true
        out[cr][cc] = area
        stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1])
      }
    }
  }
  return out
}
