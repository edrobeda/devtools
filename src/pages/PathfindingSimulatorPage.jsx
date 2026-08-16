import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Segmented,
  Select,
  Slider,
  Tag,
  Statistic,
  Row,
  Col,
  Collapse,
  Alert,
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  ClearOutlined,
  BgColorsOutlined,
  NodeIndexOutlined,
  FlagOutlined,
  BorderOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CELL_TYPES,
  generateEmptyGrid,
  generateRandomGrid,
  generateObstacleGrid,
  runPathfinding,
  setCell,
  findCell,
} from '../utils/pathfindingSimulator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

const SOURCE_CODE = `import {
  CELL_TYPES, generateEmptyGrid, runPathfinding, setCell,
} from '../utils/pathfindingSimulator'

// A* com min-heap próprio. Cada frame é uma snapshot imutável do grid,
// então a animação é só um índice avançando — sem async que corrompa estado.

function heuristicManhattan(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

class MinHeap {
  constructor() { this.data = [] }
  push(item) { this.data.push(item); this._bubbleUp(this.data.length - 1) }
  pop() { /* ... */ }
  size() { return this.data.length }
}

export function runPathfinding(grid, algorithm = 'astar') {
  const rows = grid.length
  const cols = grid[0].length
  const start = findCell(grid, CELL_TYPES.START)
  const end = findCell(grid, CELL_TYPES.END)
  if (!start || !end) return { steps: [], found: false }

  const openSet = new MinHeap()
  openSet.push({ r: start.r, c: start.c, f: 0, g: 0 })

  const cameFrom = new Map()
  const gScore = new Map()
  const closed = new Set()
  gScore.set(keyOf(start), 0)

  const workingGrid = cloneGrid(grid)
  const steps = []

  while (openSet.size() > 0) {
    const current = openSet.pop()
    const currentKey = keyOf(current)
    if (closed.has(currentKey)) continue
    closed.add(currentKey)

    workingGrid[current.r][current.c] = CELL_TYPES.VISITED
    steps.push(buildSnapshot(workingGrid, current))

    if (current.r === end.r && current.c === end.c) {
      const path = reconstructPath(cameFrom, current)
      for (const node of path) {
        if (workingGrid[node.r][node.c] === CELL_TYPES.VISITED) {
          workingGrid[node.r][node.c] = CELL_TYPES.PATH
        }
      }
      steps.push(buildSnapshot(workingGrid, current))
      return { steps, found: true, cost: current.g }
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
        const h = algorithm === 'dijkstra' ? 0 : heuristicManhattan(neighbor, end)
        openSet.push({ r: nr, c: nc, f: tentativeG + h, g: tentativeG })
      }
    }
  }

  return { steps, found: false }
}`

const translations = {
  pt: {
    title: 'Simulador de Pathfinding',
    intro: (
      <>
        Veja o algoritmo <Text strong>A*</Text> (e seu parente{' '}
        <Text strong>Dijkstra</Text>) explorarem o grid passo a passo. Desenhe
        paredes, mova o ponto de início e de destino, escolha a heurística e
        acompanhe como a busca encontra o caminho mais curto. Tudo acontece
        100% no navegador.
      </>
    ),
    controlsTitle: 'Controles',
    toolLabel: 'Ferramenta',
    toolWall: 'Parede',
    toolStart: 'Início',
    toolEnd: 'Destino',
    algoLabel: 'Algoritmo',
    heuristicLabel: 'Heurística',
    heuristicManhattan: 'Manhattan',
    heuristicEuclidean: 'Euclidiana',
    run: 'Executar',
    pause: 'Pausar',
    step: 'Passo',
    clearPath: 'Limpar busca',
    clearAll: 'Limpar tudo',
    reset: 'Resetar',
    presetLabel: 'Cenário',
    presetEmpty: 'Vazio',
    presetRandom: 'Aleatório',
    presetObstacle: 'Barreira',
    speedLabel: 'Velocidade',
    speedMs: 'ms',
    gridTitle: 'Grade',
    statsTitle: 'Estatísticas',
    visited: 'Nós visitados',
    pathLength: 'Comprimento',
    cost: 'Custo total',
    status: 'Status',
    statusFound: 'Caminho encontrado',
    statusNotFound: 'Sem caminho',
    statusReady: 'Pronto',
    statusRunning: 'Executando',
    stepOf: 'Passo {cur} de {total}',
    hint: 'Clique nas células para desenhar paredes. Use as ferramentas Início/Destino para reposicioná-los.',
    algorithmsTitle: 'A* vs Dijkstra',
    algorithms: (
      <>
        <Text code>Dijkstra</Text> expande igualmente em todas as direções até
        encontrar o destino — garante o menor caminho, mas visita mais nós.
        <Text code>A*</Text> usa uma heurística para estimar a distância
        restante e expandir primeiro os nós que parecem mais promissores,
        tornando a busca muito mais rápida em grids esparsos.
      </>
    ),
    sourceTitle: 'Código-fonte do motor',
  },
  en: {
    title: 'Pathfinding Simulator',
    intro: (
      <>
        Watch the <Text strong>A*</Text> algorithm (and its cousin{' '}
        <Text strong>Dijkstra</Text>) explore the grid step by step. Draw walls,
        move the start and end points, pick a heuristic and see how the search
        finds the shortest path. Everything runs 100% in the browser.
      </>
    ),
    controlsTitle: 'Controls',
    toolLabel: 'Tool',
    toolWall: 'Wall',
    toolStart: 'Start',
    toolEnd: 'End',
    algoLabel: 'Algorithm',
    heuristicLabel: 'Heuristic',
    heuristicManhattan: 'Manhattan',
    heuristicEuclidean: 'Euclidean',
    run: 'Run',
    pause: 'Pause',
    step: 'Step',
    clearPath: 'Clear search',
    clearAll: 'Clear all',
    reset: 'Reset',
    presetLabel: 'Scenario',
    presetEmpty: 'Empty',
    presetRandom: 'Random',
    presetObstacle: 'Barrier',
    speedLabel: 'Speed',
    speedMs: 'ms',
    gridTitle: 'Grid',
    statsTitle: 'Statistics',
    visited: 'Visited nodes',
    pathLength: 'Path length',
    cost: 'Total cost',
    status: 'Status',
    statusFound: 'Path found',
    statusNotFound: 'No path',
    statusReady: 'Ready',
    statusRunning: 'Running',
    stepOf: 'Step {cur} of {total}',
    hint: 'Click cells to draw walls. Use Start/End tools to move them.',
    algorithmsTitle: 'A* vs Dijkstra',
    algorithms: (
      <>
        <Text code>Dijkstra</Text> expands evenly in all directions until it
        reaches the target — it guarantees the shortest path but visits more
        nodes. <Text code>A*</Text> uses a heuristic to estimate the remaining
        distance and expands the most promising nodes first, making the search
        much faster on sparse grids.
      </>
    ),
    sourceTitle: 'Engine source code',
  },
}

const ROWS = 15
const COLS = 25
const CELL_SIZE = 22

function clearSearchMarks(grid) {
  return grid.map((row) =>
    row.map((cell) => {
      if (cell === CELL_TYPES.VISITED || cell === CELL_TYPES.PATH || cell === CELL_TYPES.CURRENT) {
        return CELL_TYPES.EMPTY
      }
      return cell
    })
  )
}

function applyTool(grid, r, c, tool) {
  if (tool === 'wall') {
    const cell = grid[r][c]
    if (cell === CELL_TYPES.START || cell === CELL_TYPES.END) return grid
    return setCell(grid, r, c, cell === CELL_TYPES.WALL ? CELL_TYPES.EMPTY : CELL_TYPES.WALL)
  }

  const targetType = tool === 'start' ? CELL_TYPES.START : CELL_TYPES.END
  if (grid[r][c] === targetType) return grid

  const next = grid.map((row) => row.slice())
  for (let rr = 0; rr < next.length; rr++) {
    for (let cc = 0; cc < next[rr].length; cc++) {
      if (next[rr][cc] === targetType) next[rr][cc] = CELL_TYPES.EMPTY
    }
  }
  next[r][c] = targetType
  return next
}

const cellColor = {
  [CELL_TYPES.EMPTY]: '#ffffff',
  [CELL_TYPES.WALL]: '#333333',
  [CELL_TYPES.START]: '#52c41a',
  [CELL_TYPES.END]: '#f5222d',
  [CELL_TYPES.VISITED]: '#bae0ff',
  [CELL_TYPES.PATH]: '#faad14',
  [CELL_TYPES.CURRENT]: '#1677ff',
}

export default function PathfindingSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [baseGrid, setBaseGrid] = useState(() => generateEmptyGrid(ROWS, COLS))
  const [tool, setTool] = useState('wall')
  const [algorithm, setAlgorithm] = useState('astar')
  const [heuristic, setHeuristic] = useState('manhattan')
  const [speed, setSpeed] = useState(60)
  const [steps, setSteps] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastResult, setLastResult] = useState({ found: false, cost: 0, visitedCount: 0, pathLength: 0 })

  const displayedGrid = useMemo(() => {
    if (steps.length === 0) return baseGrid
    return steps[Math.min(stepIndex, steps.length - 1)].grid
  }, [steps, stepIndex, baseGrid])

  const frame = useMemo(
    () => (steps.length > 0 ? steps[Math.min(stepIndex, steps.length - 1)] : null),
    [steps, stepIndex],
  )

  const status = useMemo(() => {
    if (isPlaying) return <Tag color="blue">{t.statusRunning}</Tag>
    if (lastResult.found) return <Tag color="green">{t.statusFound}</Tag>
    if (steps.length > 0 && !lastResult.found && frame?.done) return <Tag color="red">{t.statusNotFound}</Tag>
    return <Tag>{t.statusReady}</Tag>
  }, [isPlaying, lastResult, steps, frame, t])

  const stats = useMemo(() => {
    if (!frame) return lastResult
    return {
      found: frame.found,
      cost: frame.cost,
      visitedCount: frame.visitedCount,
      pathLength: frame.pathLength,
    }
  }, [frame, lastResult])

  useEffect(() => {
    if (!isPlaying) return undefined
    const id = setInterval(() => {
      setStepIndex((i) => {
        if (i + 1 >= steps.length) {
          setIsPlaying(false)
          return i
        }
        return i + 1
      })
    }, speed)
    return () => clearInterval(id)
  }, [isPlaying, speed, steps])

  const handleCellClick = useCallback(
    (r, c) => {
      setBaseGrid((current) => applyTool(current, r, c, tool))
      setSteps([])
      setStepIndex(0)
      setIsPlaying(false)
      setLastResult({ found: false, cost: 0, visitedCount: 0, pathLength: 0 })
    },
    [tool],
  )

  const handleRun = useCallback(() => {
    const start = findCell(baseGrid, CELL_TYPES.START)
    const end = findCell(baseGrid, CELL_TYPES.END)
    if (!start || !end) return

    const cleanGrid = clearSearchMarks(baseGrid)
    const result = runPathfinding(cleanGrid, algorithm, heuristic)
    setSteps(result.steps)
    setStepIndex(0)
    setLastResult(result)
    setIsPlaying(true)
  }, [baseGrid, algorithm, heuristic])

  const handleStep = useCallback(() => {
    setIsPlaying(false)
    setStepIndex((i) => Math.min(i + 1, Math.max(steps.length - 1, 0)))
  }, [steps.length])

  const handleClearPath = useCallback(() => {
    setBaseGrid((current) => clearSearchMarks(current))
    setSteps([])
    setStepIndex(0)
    setIsPlaying(false)
    setLastResult({ found: false, cost: 0, visitedCount: 0, pathLength: 0 })
  }, [])

  const handleClearAll = useCallback(() => {
    const grid = generateEmptyGrid(ROWS, COLS)
    setBaseGrid(grid)
    setSteps([])
    setStepIndex(0)
    setIsPlaying(false)
    setLastResult({ found: false, cost: 0, visitedCount: 0, pathLength: 0 })
  }, [])

  const handlePreset = useCallback(
    (preset) => {
      let grid
      if (preset === 'random') {
        grid = generateRandomGrid(ROWS, COLS, 0.22)
      } else if (preset === 'obstacle') {
        grid = generateObstacleGrid(ROWS, COLS)
      } else {
        grid = generateEmptyGrid(ROWS, COLS)
      }
      setBaseGrid(grid)
      setSteps([])
      setStepIndex(0)
      setIsPlaying(false)
      setLastResult({ found: false, cost: 0, visitedCount: 0, pathLength: 0 })
    },
    [],
  )

  const handleAlgorithmChange = useCallback((value) => {
    setAlgorithm(value)
    setSteps([])
    setStepIndex(0)
    setIsPlaying(false)
  }, [])

  const handleHeuristicChange = useCallback((value) => {
    setHeuristic(value)
    setSteps([])
    setStepIndex(0)
    setIsPlaying(false)
  }, [])

  const totalSteps = steps.length

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <NodeIndexOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.controlsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.toolLabel}</Text>
              <Segmented
                value={tool}
                onChange={setTool}
                options={[
                  { value: 'wall', label: t.toolWall, icon: <BorderOutlined /> },
                  { value: 'start', label: t.toolStart, icon: <FlagOutlined /> },
                  { value: 'end', label: t.toolEnd, icon: <BgColorsOutlined /> },
                ]}
              />
            </Space>

            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.algoLabel}</Text>
              <Select
                value={algorithm}
                onChange={handleAlgorithmChange}
                style={{ width: 160 }}
                options={[
                  { value: 'astar', label: 'A*' },
                  { value: 'dijkstra', label: 'Dijkstra' },
                ]}
              />
            </Space>

            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.heuristicLabel}</Text>
              <Select
                value={heuristic}
                onChange={handleHeuristicChange}
                disabled={algorithm === 'dijkstra'}
                style={{ width: 160 }}
                options={[
                  { value: 'manhattan', label: t.heuristicManhattan },
                  { value: 'euclidean', label: t.heuristicEuclidean },
                ]}
              />
            </Space>

            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.presetLabel}</Text>
              <Select
                defaultValue="empty"
                onChange={handlePreset}
                style={{ width: 160 }}
                options={[
                  { value: 'empty', label: t.presetEmpty },
                  { value: 'random', label: t.presetRandom },
                  { value: 'obstacle', label: t.presetObstacle },
                ]}
              />
            </Space>
          </Space>

          <Space wrap align="center">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              disabled={isPlaying}
            >
              {t.run}
            </Button>
            <Button icon={<PauseCircleOutlined />} onClick={() => setIsPlaying(false)}>
              {t.pause}
            </Button>
            <Button icon={<StepForwardOutlined />} onClick={handleStep} disabled={isPlaying || steps.length === 0}>
              {t.step}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClearPath}>
              {t.clearPath}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClearAll}>
              {t.clearAll}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleClearAll}>
              {t.reset}
            </Button>
          </Space>

          <Space wrap align="center">
            <Space direction="vertical" size={4} style={{ minWidth: 200 }}>
              <Text type="secondary">{t.speedLabel}: {speed}{t.speedMs}</Text>
              <Slider min={10} max={500} step={10} value={speed} onChange={setSpeed} />
            </Space>
            <Text type="secondary">
              {t.stepOf.replace('{cur}', Math.min(stepIndex + 1, Math.max(totalSteps, 1))).replace('{total}', totalSteps || 1)}
            </Text>
          </Space>

          <Alert message={t.hint} type="info" showIcon />
        </Space>
      </Card>

      <Card title={t.statsTitle}>
        <Row gutter={16}>
          <Col>
            <Statistic title={t.visited} value={stats.visitedCount} />
          </Col>
          <Col>
            <Statistic title={t.pathLength} value={stats.pathLength} />
          </Col>
          <Col>
            <Statistic title={t.cost} value={stats.cost} />
          </Col>
          <Col>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ display: 'block' }}>{t.status}</Text>
              {status}
            </div>
          </Col>
        </Row>
      </Card>

      <Card title={t.gridTitle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
            gap: 1,
            justifyContent: 'center',
            padding: 8,
            background: '#f5f5f5',
            borderRadius: 8,
            overflowX: 'auto',
          }}
        >
          {displayedGrid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: cellColor[cell] || cellColor[CELL_TYPES.EMPTY],
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: '1px solid #e5e5e5',
                  transition: 'background 0.1s ease',
                }}
                role="button"
                aria-label={`cell-${r}-${c}`}
              />
            ))
          )}
        </div>
      </Card>

      <Card title={t.algorithmsTitle}>
        <Paragraph type="secondary">{t.algorithms}</Paragraph>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{SOURCE_CODE}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
