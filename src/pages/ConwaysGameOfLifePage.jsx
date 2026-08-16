import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Slider,
  Select,
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
  ClearOutlined,
  ReloadOutlined,
  BorderOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  createGrid,
  nextGeneration,
  toggleCell,
  countAlive,
  detectState,
  PRESETS,
} from '../utils/conwaysGameOfLife'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

const SOURCE_CODE = `import {
  createGrid, nextGeneration, toggleCell, countAlive,
  detectState, PRESETS,
} from '../utils/conwaysGameOfLife'

// Regras do Jogo da Vida de Conway:
// 1. Qualquer célula viva com 2 ou 3 vizinhos vivos sobrevive.
// 2. Qualquer célula morta com exatamente 3 vizinhos vivos vive.
// 3. Todas as outras células morrem ou permanecem mortas.

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

export function nextGeneration(grid) {
  const rows = grid.length
  const cols = grid[0].length
  const next = Array.from({ length: rows }, () => Array(cols).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const neighbors = countNeighbors(grid, r, c)
      const alive = grid[r][c] === 1
      if (alive && (neighbors === 2 || neighbors === 3)) next[r][c] = 1
      else if (!alive && neighbors === 3) next[r][c] = 1
    }
  }
  return next
}`

const translations = {
  pt: {
    title: 'Jogo da Vida de Conway',
    intro: (
      <>
        O <Text strong>Jogo da Vida</Text> é um autômato celular criado pelo
        matemático John Conway em 1970. A partir de quatro regras simples
        aplicadas a uma grade de células vivas ou mortas, emergem padrões
        complexos — osciladores, naves espaciais e até máquinas autorreplicantes.
        Tudo acontece 100% no navegador.
      </>
    ),
    rulesTitle: 'As regras',
    rules: (
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        <li>Qualquer célula viva com 2 ou 3 vizinhos vivos sobrevive.</li>
        <li>Qualquer célula morta com exatamente 3 vizinhos vivos vive.</li>
        <li>Todas as outras células morrem ou permanecem mortas.</li>
      </ol>
    ),
    controlsTitle: 'Controles',
    play: 'Iniciar',
    pause: 'Pausar',
    step: 'Próxima geração',
    clear: 'Limpar',
    random: 'Aleatório',
    presetLabel: 'Preset',
    gridSizeLabel: 'Tamanho do grid',
    speedLabel: 'Velocidade (ms/gên)',
    statsTitle: 'Estatísticas',
    generation: 'Geração',
    alive: 'Células vivas',
    state: 'Estado',
    stateRunning: 'Em evolução',
    stateStable: 'Estável',
    stateExtinct: 'Extinto',
    hint: 'Clique nas células para desenhar seu próprio padrão.',
    fullscreen: 'Tela cheia',
    exitFullscreen: 'Sair da tela cheia',
    colorThemeLabel: 'Tema de cores',
    sourceTitle: 'Código-fonte do motor',
    presets: {
      empty: PRESETS.empty.name.pt,
      random: PRESETS.random.name.pt,
      glider: PRESETS.glider.name.pt,
      blinker: PRESETS.blinker.name.pt,
      beacon: PRESETS.beacon.name.pt,
      pulsar: PRESETS.pulsar.name.pt,
      gosperGliderGun: PRESETS.gosperGliderGun.name.pt,
    },
  },
  en: {
    title: "Conway's Game of Life",
    intro: (
      <>
        The <Text strong>Game of Life</Text> is a cellular automaton devised by
        mathematician John Conway in 1970. From four simple rules applied to a
        grid of live or dead cells, complex patterns emerge — oscillators,
        spaceships, and even self-replicating machines. Everything runs 100%
        in the browser.
      </>
    ),
    rulesTitle: 'The rules',
    rules: (
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        <li>Any live cell with 2 or 3 live neighbours survives.</li>
        <li>Any dead cell with exactly 3 live neighbours becomes alive.</li>
        <li>All other cells die or stay dead.</li>
      </ol>
    ),
    controlsTitle: 'Controls',
    play: 'Play',
    pause: 'Pause',
    step: 'Next generation',
    clear: 'Clear',
    random: 'Random',
    presetLabel: 'Preset',
    gridSizeLabel: 'Grid size',
    speedLabel: 'Speed (ms/gen)',
    statsTitle: 'Statistics',
    generation: 'Generation',
    alive: 'Alive cells',
    state: 'State',
    stateRunning: 'Evolving',
    stateStable: 'Stable',
    stateExtinct: 'Extinct',
    hint: 'Click cells to draw your own pattern.',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    colorThemeLabel: 'Color theme',
    sourceTitle: 'Engine source code',
    presets: {
      empty: PRESETS.empty.name.en,
      random: PRESETS.random.name.en,
      glider: PRESETS.glider.name.en,
      blinker: PRESETS.blinker.name.en,
      beacon: PRESETS.beacon.name.en,
      pulsar: PRESETS.pulsar.name.en,
      gosperGliderGun: PRESETS.gosperGliderGun.name.en,
    },
  },
}

const GRID_SIZES = [
  { rows: 20, cols: 30 },
  { rows: 30, cols: 50 },
  { rows: 40, cols: 70 },
]

const COLOR_THEMES = {
  blue: { alive: '#1677ff', dead: '#ffffff', background: '#f5f5f5', label: { pt: 'Azul', en: 'Blue' } },
  red: { alive: '#ff4d4f', dead: '#fff1f0', background: '#fff1f0', label: { pt: 'Vermelho', en: 'Red' } },
  green: { alive: '#52c41a', dead: '#f6ffed', background: '#f6ffed', label: { pt: 'Verde', en: 'Green' } },
  purple: { alive: '#722ed1', dead: '#f9f0ff', background: '#f9f0ff', label: { pt: 'Roxo', en: 'Purple' } },
  orange: { alive: '#fa8c16', dead: '#fff7e6', background: '#fff7e6', label: { pt: 'Laranja', en: 'Orange' } },
  neon: { alive: '#00ff9d', dead: '#0a0a0a', background: '#0a0a0a', label: { pt: 'Néon', en: 'Neon' } },
  dark: { alive: '#ffffff', dead: '#141414', background: '#141414', label: { pt: 'Escuro', en: 'Dark' } },
}

export default function ConwaysGameOfLifePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [sizeIndex, setSizeIndex] = useState(1)
  const [speed, setSpeed] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [grid, setGrid] = useState(() => createGrid(30, 50, 'random', 0.25))
  const [generation, setGeneration] = useState(0)
  const [colorTheme, setColorTheme] = useState('blue')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const previousGridRef = useRef(null)
  const gridContainerRef = useRef(null)

  const size = GRID_SIZES[sizeIndex]
  const theme = COLOR_THEMES[colorTheme]

  const aliveCount = useMemo(() => countAlive(grid), [grid])
  const state = useMemo(
    () => detectState(grid, previousGridRef.current),
    [grid],
  )

  const stateLabel = useMemo(() => {
    if (state === 'extinct') return <Tag color="default">{t.stateExtinct}</Tag>
    if (state === 'stable') return <Tag color="orange">{t.stateStable}</Tag>
    return <Tag color="blue">{t.stateRunning}</Tag>
  }, [state, t])

  const handleStep = useCallback(() => {
    setGrid((current) => {
      previousGridRef.current = current
      return nextGeneration(current)
    })
    setGeneration((g) => g + 1)
  }, [])

  useEffect(() => {
    if (!isPlaying) return

    const id = setInterval(() => {
      setGrid((current) => {
        previousGridRef.current = current
        return nextGeneration(current)
      })
      setGeneration((g) => g + 1)
    }, speed)

    return () => clearInterval(id)
  }, [isPlaying, speed])

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = gridContainerRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Ignora falhas de fullscreen em ambientes sem suporte.
    }
  }, [])

  const handleToggle = useCallback((r, c) => {
    setGrid((current) => toggleCell(current, r, c))
  }, [])

  const handleClear = useCallback(() => {
    setIsPlaying(false)
    setGrid(createGrid(size.rows, size.cols, 'empty'))
    setGeneration(0)
    previousGridRef.current = null
  }, [size])

  const handleRandom = useCallback(() => {
    setIsPlaying(false)
    setGrid(createGrid(size.rows, size.cols, 'random', 0.25))
    setGeneration(0)
    previousGridRef.current = null
  }, [size])

  const handlePreset = useCallback(
    (key) => {
      setIsPlaying(false)
      setGrid(createGrid(size.rows, size.cols, key))
      setGeneration(0)
      previousGridRef.current = null
    },
    [size],
  )

  const handleSizeChange = useCallback(
    (index) => {
      setSizeIndex(index)
      const next = GRID_SIZES[index]
      setGrid(createGrid(next.rows, next.cols, 'random', 0.25))
      setGeneration(0)
      setIsPlaying(false)
      previousGridRef.current = null
    },
    [],
  )

  const cellSize = useMemo(() => {
    if (size.cols <= 30) return 18
    if (size.cols <= 50) return 14
    return 10
  }, [size])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <BorderOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.rulesTitle}>
        <Paragraph>{t.rules}</Paragraph>
      </Card>

      <Card title={t.controlsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Button
              type={isPlaying ? 'default' : 'primary'}
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? t.pause : t.play}
            </Button>
            <Button icon={<StepForwardOutlined />} onClick={handleStep} disabled={isPlaying}>
              {t.step}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              {t.clear}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRandom}>
              {t.random}
            </Button>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? t.exitFullscreen : t.fullscreen}
            </Button>
          </Space>

          <Space wrap align="center">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.presetLabel}</Text>
              <Select
                value="random"
                style={{ width: 180 }}
                onChange={handlePreset}
                options={Object.keys(PRESETS).map((key) => ({
                  value: key,
                  label: t.presets[key],
                }))}
              />
            </Space>

            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.gridSizeLabel}</Text>
              <Select
                value={sizeIndex}
                style={{ width: 140 }}
                onChange={handleSizeChange}
                options={GRID_SIZES.map((s, i) => ({
                  value: i,
                  label: `${s.cols} × ${s.rows}`,
                }))}
              />
            </Space>

            <Space direction="vertical" size={4} style={{ minWidth: 160 }}>
              <Text type="secondary">{t.speedLabel}: {speed}ms</Text>
              <Slider
                min={30}
                max={1000}
                step={10}
                value={speed}
                onChange={setSpeed}
              />
            </Space>

            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.colorThemeLabel}</Text>
              <Select
                value={colorTheme}
                style={{ width: 140 }}
                onChange={setColorTheme}
                options={Object.keys(COLOR_THEMES).map((key) => ({
                  value: key,
                  label: (
                    <Space>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: COLOR_THEMES[key].alive,
                          border: `1px solid ${COLOR_THEMES[key].dead === '#ffffff' ? '#d9d9d9' : COLOR_THEMES[key].dead}`,
                        }}
                      />
                      {COLOR_THEMES[key].label[lang]}
                    </Space>
                  ),
                }))}
              />
            </Space>
          </Space>

          <Alert message={t.hint} type="info" showIcon />
        </Space>
      </Card>

      <Card title={t.statsTitle}>
        <Row gutter={16}>
          <Col>
            <Statistic title={t.generation} value={generation} />
          </Col>
          <Col>
            <Statistic title={t.alive} value={aliveCount} />
          </Col>
          <Col>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ display: 'block' }}>{t.state}</Text>
              {stateLabel}
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <div
          ref={gridContainerRef}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size.cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${size.rows}, ${cellSize}px)`,
            gap: 1,
            justifyContent: 'center',
            alignContent: 'center',
            overflowX: 'auto',
            padding: 8,
            background: theme.background,
            borderRadius: 8,
            height: isFullscreen ? '100vh' : 'auto',
            width: isFullscreen ? '100vw' : 'auto',
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => handleToggle(r, c)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: cell ? theme.alive : theme.dead,
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'background 0.08s ease',
                }}
                role="button"
                aria-label={`cell-${r}-${c}`}
              />
            ))
          )}
        </div>
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
