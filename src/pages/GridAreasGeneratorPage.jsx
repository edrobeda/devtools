import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, InputNumber,
  Segmented, Tooltip, message, Row, Col, Input, Tag,
} from 'antd'
import {
  BgColorsOutlined, CopyOutlined, DeleteOutlined, PlusOutlined,
  ReloadOutlined, AppstoreOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildFullSnippet, buildGridCss, buildHtmlSkeleton, buildGridTemplateAreas,
  cloneGrid, createEmptyGrid, getAreaColor, getUsedAreas, nextAreaName,
  validateAreas, validateGrid,
} from '../utils/gridAreas'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESETS = [
  {
    key: 'holy',
    rows: 3,
    cols: 3,
    gap: '16px',
    grid: [
      ['h', 'h', 'h'],
      ['s', 'm', 'm'],
      ['f', 'f', 'f'],
    ],
  },
  {
    key: 'sidebar',
    rows: 2,
    cols: 4,
    gap: '16px',
    grid: [
      ['s', 'c', 'c', 'c'],
      ['s', 'c', 'c', 'c'],
    ],
  },
  {
    key: 'twocol',
    rows: 2,
    cols: 2,
    gap: '24px',
    grid: [
      ['a', 'b'],
      ['a', 'b'],
    ],
  },
  {
    key: 'gallery',
    rows: 3,
    cols: 4,
    gap: '12px',
    grid: [
      ['h', 'h', 'h', 'h'],
      ['a', 'a', 'b', 'b'],
      ['c', 'd', 'e', 'f'],
    ],
  },
  {
    key: 'dashboard',
    rows: 3,
    cols: 4,
    gap: '16px',
    grid: [
      ['k', 'k', 'c', 'c'],
      ['k', 'k', 'c', 'c'],
      ['a', 'b', 'd', 'e'],
    ],
  },
]

const PRESET_LABELS = {
  holy: { pt: 'Grail (header/sidebar/main/footer)', en: 'Holy Grail (header/sidebar/main/footer)' },
  sidebar: { pt: 'Sidebar fixa', en: 'Fixed sidebar' },
  twocol: { pt: 'Duas colunas', en: 'Two columns' },
  gallery: { pt: 'Galeria de cards', en: 'Card gallery' },
  dashboard: { pt: 'Dashboard', en: 'Dashboard' },
}

const translations = {
  pt: {
    title: 'Gerador de Grid Areas CSS',
    intro: (
      <>
        Desenhe áreas nomeadas de um grid CSS visualmente e copie o{' '}
        <Text code>grid-template-areas</Text> pronto. Cada cor é uma área;
        células em branco viram buracos (<Text code>.</Text>). Ideal pra
        protótipos de layout sem media query.
      </>
    ),
    tipTitle: 'Regras do grid-template-areas',
    tipBody: (
      <>
        Cada área nomeada deve ser um <Text strong>retângulo sólido</Text>; se
        uma mesma letra aparecer em duas regiões não adjacentes ou com formato
        irregular, o CSS é inválido. Use <Text code>.</Text> para células
        vazias. A propriedade só funciona quando o container tem{' '}
        <Text code>display: grid</Text>.
      </>
    ),
    settings: 'Configurações',
    grid: 'Grade',
    rows: 'Linhas',
    cols: 'Colunas',
    gap: 'Gap',
    preset: 'Preset de layout',
    clear: 'Limpar',
    activeArea: 'Área ativa',
    hole: 'Buraco (.)',
    addArea: 'Nova área',
    renamePlaceholder: 'Renomear área…',
    preview: 'Preview ao vivo',
    previewHint: 'Clique ou arraste para pintar. Cores iguais = mesma área.',
    output: 'CSS gerado',
    htmlOutput: 'HTML esqueleto',
    fullSnippet: 'Snippet completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    invalidWarning: (areas) => `Área(s) inválida(s): ${areas.join(', ')} — cada área precisa ser um retângulo contíguo.`,
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/gridAreas.js. A grade é uma matriz de strings; buildGridTemplateAreas transforma cada linha em "a a b", buildGridCss monta display grid, grid-template-columns/rows repeat(), gap e grid-template-areas, e gera uma classe .area-X por área usada. validateAreas verifica se cada área é um retângulo sólido.',
  },
  en: {
    title: 'CSS Grid Areas Generator',
    intro: (
      <>
        Visually draw named CSS grid areas and copy the ready-to-use{' '}
        <Text code>grid-template-areas</Text>. Each color is an area; blank cells
        become holes (<Text code>.</Text>). Great for layout prototyping without
        writing media queries first.
      </>
    ),
    tipTitle: 'grid-template-areas rules',
    tipBody: (
      <>
        Every named area must be a <Text strong>solid rectangle</Text>; if the
        same letter appears in two non-adjacent regions or in an irregular
        shape, the CSS is invalid. Use <Text code>.</Text> for empty cells. The
        property only works when the container has{' '}
        <Text code>display: grid</Text>.
      </>
    ),
    settings: 'Settings',
    grid: 'Grid',
    rows: 'Rows',
    cols: 'Columns',
    gap: 'Gap',
    preset: 'Layout preset',
    clear: 'Clear',
    activeArea: 'Active area',
    hole: 'Hole (.)',
    addArea: 'New area',
    renamePlaceholder: 'Rename area…',
    preview: 'Live preview',
    previewHint: 'Click or drag to paint. Same color = same area.',
    output: 'Generated CSS',
    htmlOutput: 'HTML skeleton',
    fullSnippet: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    invalidWarning: (areas) => `Invalid area(s): ${areas.join(', ')} — each area must be a contiguous rectangle.`,
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/gridAreas.js. The grid is a string matrix; buildGridTemplateAreas turns each row into "a a b", buildGridCss builds display grid, grid-template-columns/rows repeat(), gap and grid-template-areas, and emits a .area-X class per used area. validateAreas checks whether each area is a solid rectangle.',
  },
}

export default function GridAreasGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [gap, setGap] = useState('16px')
  const [grid, setGrid] = useState(() => cloneGrid(PRESETS[0].grid))
  const [activeArea, setActiveArea] = useState('h')
  const [isDragging, setIsDragging] = useState(false)
  const gridRef = useRef(null)

  const usedAreas = useMemo(() => getUsedAreas(grid), [grid])
  const areaIndex = useMemo(() => {
    const map = new Map()
    usedAreas.forEach((a, i) => map.set(a, i))
    return map
  }, [usedAreas])

  const validationErrors = useMemo(() => validateAreas(grid), [grid])
  const invalidAreas = useMemo(() => validationErrors.map((e) => e.area), [validationErrors])

  const resizeGrid = useCallback((newRows, newCols) => {
    const { rows: r, cols: c } = validateGrid(newRows, newCols)
    setRows(r)
    setCols(c)
    setGrid((prev) => {
      const next = createEmptyGrid(r, c, '.')
      for (let i = 0; i < Math.min(prev.length, r); i++) {
        for (let j = 0; j < Math.min(prev[i].length, c); j++) {
          next[i][j] = prev[i][j]
        }
      }
      return next
    })
  }, [])

  const applyPreset = useCallback((key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (!p) return
    setRows(p.rows)
    setCols(p.cols)
    setGap(p.gap)
    setGrid(cloneGrid(p.grid))
    setActiveArea(getUsedAreas(p.grid)[0] || 'a')
  }, [])

  const clearGrid = useCallback(() => {
    setGrid(createEmptyGrid(rows, cols, '.'))
    setActiveArea('.')
  }, [rows, cols])

  const addArea = useCallback(() => {
    const name = nextAreaName(usedAreas)
    setActiveArea(name)
  }, [usedAreas])

  const renameArea = useCallback((oldName, newName) => {
    const sanitized = newName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) || oldName
    if (sanitized === oldName || usedAreas.includes(sanitized)) return
    setGrid((prev) => prev.map((row) => row.map((cell) => (cell === oldName ? sanitized : cell))))
    if (activeArea === oldName) setActiveArea(sanitized)
  }, [usedAreas, activeArea])

  const removeArea = useCallback((name) => {
    setGrid((prev) => prev.map((row) => row.map((cell) => (cell === name ? '.' : cell))))
    if (activeArea === name) setActiveArea('.')
  }, [activeArea])

  const paintCell = useCallback((r, c) => {
    setGrid((prev) => {
      if (prev[r][c] === activeArea) return prev
      const next = cloneGrid(prev)
      next[r][c] = activeArea
      return next
    })
  }, [activeArea])

  const handleMouseDown = useCallback((r, c) => (e) => {
    e.preventDefault()
    setIsDragging(true)
    paintCell(r, c)
  }, [paintCell])

  const handleMouseEnter = useCallback((r, c) => (e) => {
    if (e.buttons === 1 && isDragging) {
      paintCell(r, c)
    }
  }, [isDragging, paintCell])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!gridRef.current || !isDragging) return
    const rect = gridRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    const cellW = rect.width / cols
    const cellH = rect.height / rows
    const c = Math.floor(x / cellW)
    const r = Math.floor(y / cellH)
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      paintCell(r, c)
    }
  }, [isDragging, rows, cols, paintCell])

  const cssOutput = useMemo(() => buildGridCss(grid, rows, cols, gap), [grid, rows, cols, gap])
  const htmlOutput = useMemo(() => buildHtmlSkeleton(grid, rows, cols, usedAreas, gap), [grid, rows, cols, usedAreas, gap])
  const fullSnippet = useMemo(() => buildFullSnippet(grid, rows, cols, gap), [grid, rows, cols, gap])

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [messageApi, t])

  const areaOptions = useMemo(() => {
    const opts = usedAreas.map((area) => ({
      value: area,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12, height: 12, borderRadius: 2,
              background: getAreaColor(areaIndex.get(area)),
              display: 'inline-block',
            }}
          />
          {area}
        </span>
      ),
    }))
    opts.push({
      value: '.',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12, height: 12, borderRadius: 2,
              background: 'repeating-conic-gradient(#d9d9d9 0 25%, transparent 0 50%)',
              backgroundSize: '8px 8px',
              display: 'inline-block',
            }}
          />
          {t.hole}
        </span>
      ),
    })
    return opts
  }, [usedAreas, areaIndex, t.hole])

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: '100%' }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      {invalidAreas.length > 0 && (
        <Alert type="warning" showIcon message={t.invalidWarning(invalidAreas)} />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.preset}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={null}
                  onChange={applyPreset}
                  options={PRESETS.map((p) => ({
                    value: p.key,
                    label: PRESET_LABELS[p.key][lang],
                  }))}
                />
              </Space>

              <Space align="center" wrap>
                <Text>{t.rows}</Text>
                <InputNumber min={1} max={8} value={rows} onChange={(v) => resizeGrid(v, cols)} />
                <Text>{t.cols}</Text>
                <InputNumber min={1} max={8} value={cols} onChange={(v) => resizeGrid(rows, v)} />
                <Text>{t.gap}</Text>
                <Input value={gap} onChange={(e) => setGap(e.target.value)} style={{ width: 80 }} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.activeArea}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={activeArea}
                  onChange={setActiveArea}
                  options={areaOptions}
                />
                <Button icon={<PlusOutlined />} size="small" onClick={addArea}>
                  {t.addArea}
                </Button>
              </Space>

              {usedAreas.length > 0 && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{lang === 'pt' ? 'Áreas criadas' : 'Created areas'}</Text>
                  <Space size={[8, 8]} wrap>
                    {usedAreas.map((area) => (
                      <Tag
                        key={area}
                        color={getAreaColor(areaIndex.get(area))}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                      >
                        <Input
                          size="small"
                          variant="borderless"
                          defaultValue={area}
                          onBlur={(e) => renameArea(area, e.target.value)}
                          onPressEnter={(e) => renameArea(area, e.target.value)}
                          style={{ width: 70, color: 'inherit', background: 'transparent' }}
                          placeholder={t.renamePlaceholder}
                        />
                        <Tooltip title={lang === 'pt' ? 'Remover área' : 'Remove area'}>
                          <DeleteOutlined
                            style={{ cursor: 'pointer', fontSize: 12 }}
                            onClick={() => removeArea(area)}
                          />
                        </Tooltip>
                      </Tag>
                    ))}
                  </Space>
                </Space>
              )}

              <Button icon={<ReloadOutlined />} onClick={clearGrid} block>
                {t.clear}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={<><AppstoreOutlined /> {t.preview}</>}>
            <div
              ref={gridRef}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap,
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: 12,
                minHeight: 260,
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const isHole = cell === '.'
                  const idx = isHole ? -1 : areaIndex.get(cell)
                  const color = isHole ? undefined : getAreaColor(idx)
                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseDown={handleMouseDown(r, c)}
                      onMouseEnter={handleMouseEnter(r, c)}
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 13,
                        color: isHole ? '#bfbfbf' : '#fff',
                        background: isHole
                          ? 'repeating-conic-gradient(#f0f0f0 0 25%, #fff 0 50%)'
                          : color,
                        backgroundSize: isHole ? '16px 16px' : undefined,
                        cursor: 'pointer',
                        outline: activeArea === cell ? `2px solid ${isHole ? '#1677ff' : '#fff'}` : 'none',
                        outlineOffset: -3,
                      }}
                    >
                      {isHole ? '.' : cell}
                    </div>
                  )
                })
              )}
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={t.output}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>{t.copy}</Button>}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{cssOutput}</code>
            </pre>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={t.htmlOutput}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(htmlOutput)}>{t.copy}</Button>}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{htmlOutput}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.fullSnippet}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullSnippet)}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullSnippet}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — gridAreas.js`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildGridTemplateAreas.toString()}{'\n\n'}{buildGridCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
