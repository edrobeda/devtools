import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Tag, Switch, Row, Col, Statistic, Empty,
  Alert, Segmented, Tooltip, Button, Table, Collapse, message, Select,
} from 'antd'
import {
  HighlightOutlined, CopyOutlined, ReloadOutlined, EyeOutlined, EyeInvisibleOutlined,
  CheckOutlined, AimOutlined, InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parsePath, autoViewBox, EXAMPLES, summarize, COMMAND_HELP, commandName } from '../utils/svgPath'

const { Title, Paragraph, Text } = Typography

// ─── Estilos para o SVG de preview ──────────────────────────────────────────
const STROKE = '#1677ff'
const STROKE_HOVER = '#eb2f96'
const STROKE_INACTIVE = 'rgba(22, 119, 255, 0.35)'
const CONTROL_FILL = '#1677ff'
const CONTROL_STROKE = '#ffffff'
const ENDPOINT_FILL = '#52c41a'
const ENDPOINT_STROKE = '#ffffff'
const GRID_STROKE = '#f0f0f0'

const translations = {
  pt: {
    title: 'Visualizador de Path SVG',
    intro: (
      <>
        Cole o atributo <Text code>d</Text> de um path SVG e veja ele desenhado, com a tabela de comandos
        abaixo separando <Text code>M</Text>/<Text code>L</Text>/<Text code>H</Text>/<Text code>V</Text>/
        <Text code>C</Text>/<Text code>S</Text>/<Text code>Q</Text>/<Text code>T</Text>/<Text code>A</Text>/
        <Text code>Z</Text> um a um. Passe o mouse sobre um comando para destacar o segmento correspondente
        e mostrar os pontos de controle das curvas.
      </>
    ),
    inputLabel: 'Atributo d',
    inputPlaceholder: 'Cole um path SVG aqui, ex.: M10,10 L90,90 L10,90 Z',
    examples: 'Exemplos',
    clearInput: 'Limpar',
    copied: 'Copiado!',
    copyPath: 'Copiar path',
    copySegment: 'Copiar comando',
    copyError: 'Não foi possível copiar',
    showGrid: 'Mostrar grade',
    showControls: 'Mostrar pontos de controle',
    showBbox: 'Mostrar bounding box',
    previewTitle: 'Preview',
    noCommands: 'Cole um path acima para visualizar.',
    statsTitle: 'Estatísticas',
    segs: 'comandos',
    subpaths: 'subpaths',
    length: 'comprimento aprox.',
    bbox: 'bounding box',
    bboxFromCtrl: 'com controles',
    empty: 'Sem comandos.',
    tableTitle: 'Tabela de comandos',
    colIndex: '#',
    colCmd: 'Cmd',
    colArgs: 'Argumentos',
    colMeaning: 'Significado',
    copyCol: 'Copiar',
    cmdRel: 'relativo',
    cmdAbs: 'absoluto',
    errorTitle: 'Problemas ao parsear',
    referenceTitle: 'Referência dos comandos',
    helpTitle: 'Sobre o path SVG',
    helpBody: (
      <>
        O atributo <Text code>d</Text> é uma mini-linguagem de desenho vetorial: cada letra é um
        comando (maiúscula = coordenadas absolutas, minúscula = relativas) seguida dos seus
        argumentos numéricos. O <Text code>M</Text> move a caneta, <Text code>L</Text>/
        <Text code>H</Text>/<Text code>V</Text> traçam retas, <Text code>C</Text>/<Text code>S</Text>/
        <Text code>Q</Text>/<Text code>T</Text> traçam curvas de Bézier (cúbica ou quadrática),{' '}
        <Text code>A</Text> traça arcos de elipse e <Text code>Z</Text> fecha o subpath atual. Após um{' '}
        <Text code>M</Text>, pares adicionais de coordenadas são interpretados como{' '}
        <Text code>L</Text> implícito.
      </>
    ),
    formatHint: 'Use espaços, vírgulas ou quebras de linha como separador entre números; ambos `1e-3` e `.5` são aceitos.',
  },
  en: {
    title: 'SVG Path Visualizer',
    intro: (
      <>
        Paste an SVG <Text code>d</Text> attribute and see it drawn, with a command table breaking down
        <Text code>M</Text>/<Text code>L</Text>/<Text code>H</Text>/<Text code>V</Text>/
        <Text code>C</Text>/<Text code>S</Text>/<Text code>Q</Text>/<Text code>T</Text>/<Text code>A</Text>/
        <Text code>Z</Text> one by one. Hover a row to highlight the corresponding segment and show
        the curve control points.
      </>
    ),
    inputLabel: 'd attribute',
    inputPlaceholder: 'Paste an SVG path here, e.g.: M10,10 L90,90 L10,90 Z',
    examples: 'Examples',
    clearInput: 'Clear',
    copied: 'Copied!',
    copyPath: 'Copy path',
    copySegment: 'Copy command',
    copyError: 'Could not copy',
    showGrid: 'Show grid',
    showControls: 'Show control points',
    showBbox: 'Show bounding box',
    previewTitle: 'Preview',
    noCommands: 'Paste a path above to visualize.',
    statsTitle: 'Statistics',
    segs: 'commands',
    subpaths: 'subpaths',
    length: 'approx. length',
    bbox: 'bounding box',
    bboxFromCtrl: 'with controls',
    empty: 'No commands.',
    tableTitle: 'Command table',
    colIndex: '#',
    colCmd: 'Cmd',
    colArgs: 'Arguments',
    colMeaning: 'Meaning',
    copyCol: 'Copy',
    cmdRel: 'relative',
    cmdAbs: 'absolute',
    errorTitle: 'Parsing problems',
    referenceTitle: 'Command reference',
    helpTitle: 'About SVG paths',
    helpBody: (
      <>
        The <Text code>d</Text> attribute is a tiny vector-drawing language: each letter is a command
        (uppercase = absolute coordinates, lowercase = relative) followed by its numeric arguments.{' '}
        <Text code>M</Text> moves the pen, <Text code>L</Text>/<Text code>H</Text>/<Text code>V</Text>{' '}
        draw lines, <Text code>C</Text>/<Text code>S</Text>/<Text code>Q</Text>/<Text code>T</Text> draw
        Bézier curves (cubic or quadratic), <Text code>A</Text> draws elliptical arcs and{' '}
        <Text code>Z</Text> closes the current subpath. After an <Text code>M</Text>, additional
        coordinate pairs are interpreted as implicit <Text code>L</Text>.
      </>
    ),
    formatHint: 'Use spaces, commas or line breaks between numbers; both `1e-3` and `.5` are accepted.',
  },
}

// ─── Helpers de renderização do SVG ─────────────────────────────────────────
function safeDFromCommands(commands) {
  if (!commands || commands.length === 0) return ''
  return commands.map((c) => c.raw).join(' ')
}

function niceStep(approx) {
  if (approx <= 0) return 1
  const exp = Math.floor(Math.log10(approx))
  const base = Math.pow(10, exp)
  const ratio = approx / base
  let step
  if (ratio < 1.5) step = 1
  else if (ratio < 3) step = 2
  else if (ratio < 7) step = 5
  else step = 10
  return step * base
}

// Converte 1 comando numa string `d` minúscula que renderiza só ele.
function segmentToD(cmd) {
  if (cmd.cmd === 'M') return `M ${cmd.start.x} ${cmd.start.y}`
  if (cmd.cmd === 'L') return `M ${cmd.start.x} ${cmd.start.y} L ${cmd.end.x} ${cmd.end.y}`
  if (cmd.cmd === 'H') return `M ${cmd.start.x} ${cmd.start.y} L ${cmd.end.x} ${cmd.end.y}`
  if (cmd.cmd === 'V') return `M ${cmd.start.x} ${cmd.start.y} L ${cmd.end.x} ${cmd.end.y}`
  if (cmd.cmd === 'C') return `M ${cmd.start.x} ${cmd.start.y} C ${cmd.control[0].x} ${cmd.control[0].y}, ${cmd.control[1].x} ${cmd.control[1].y}, ${cmd.end.x} ${cmd.end.y}`
  if (cmd.cmd === 'S') return `M ${cmd.start.x} ${cmd.start.y} C ${cmd.control[0].x} ${cmd.control[0].y}, ${cmd.control[1].x} ${cmd.control[1].y}, ${cmd.end.x} ${cmd.end.y}`
  if (cmd.cmd === 'Q') return `M ${cmd.start.x} ${cmd.start.y} Q ${cmd.control[0].x} ${cmd.control[0].y}, ${cmd.end.x} ${cmd.end.y}`
  if (cmd.cmd === 'T') return `M ${cmd.start.x} ${cmd.start.y} Q ${cmd.control[0].x} ${cmd.control[0].y}, ${cmd.end.x} ${cmd.end.y}`
  if (cmd.cmd === 'A') return `M ${cmd.start.x} ${cmd.start.y} A ${cmd.args.join(' ')}`
  if (cmd.cmd === 'Z') return `M ${cmd.start.x} ${cmd.start.y} L ${cmd.end.x} ${cmd.end.y}`
  return null
}

function renderControl(c) {
  if (!c) return null
  const start = c.start
  const end = c.end
  if (c.cmd === 'C') {
    return (
      <g key="ctrl">
        <line x1={start.x} y1={start.y} x2={c.control[0].x} y2={c.control[0].y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} />
        <line x1={c.control[1].x} y1={c.control[1].y} x2={end.x} y2={end.y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} />
        <circle cx={c.control[0].x} cy={c.control[0].y} r={4} fill={CONTROL_FILL} stroke={CONTROL_STROKE} strokeWidth={1.5} />
        <circle cx={c.control[1].x} cy={c.control[1].y} r={4} fill={CONTROL_FILL} stroke={CONTROL_STROKE} strokeWidth={1.5} />
        <Endpoint x={start.x} y={start.y} />
        <Endpoint x={end.x} y={end.y} />
      </g>
    )
  }
  if (c.cmd === 'S') {
    return (
      <g key="ctrl">
        <line x1={start.x} y1={start.y} x2={c.control[0].x} y2={c.control[0].y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.5} />
        <line x1={c.control[1].x} y1={c.control[1].y} x2={end.x} y2={end.y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} />
        <circle cx={c.control[0].x} cy={c.control[0].y} r={3} fill="none" stroke={STROKE} strokeWidth={1} strokeDasharray="2 1" />
        <circle cx={c.control[1].x} cy={c.control[1].y} r={4} fill={CONTROL_FILL} stroke={CONTROL_STROKE} strokeWidth={1.5} />
        <Endpoint x={start.x} y={start.y} />
        <Endpoint x={end.x} y={end.y} />
      </g>
    )
  }
  if (c.cmd === 'Q') {
    return (
      <g key="ctrl">
        <line x1={start.x} y1={start.y} x2={c.control[0].x} y2={c.control[0].y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} />
        <line x1={c.control[0].x} y1={c.control[0].y} x2={end.x} y2={end.y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} />
        <circle cx={c.control[0].x} cy={c.control[0].y} r={4} fill={CONTROL_FILL} stroke={CONTROL_STROKE} strokeWidth={1.5} />
        <Endpoint x={start.x} y={start.y} />
        <Endpoint x={end.x} y={end.y} />
      </g>
    )
  }
  if (c.cmd === 'T') {
    return (
      <g key="ctrl">
        <line x1={start.x} y1={start.y} x2={c.control[0].x} y2={c.control[0].y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.5} />
        <line x1={c.control[0].x} y1={c.control[0].y} x2={end.x} y2={end.y} stroke={STROKE} strokeDasharray="3 3" strokeWidth={1} />
        <circle cx={c.control[0].x} cy={c.control[0].y} r={3} fill="none" stroke={STROKE} strokeWidth={1} strokeDasharray="2 1" />
        <Endpoint x={start.x} y={start.y} />
        <Endpoint x={end.x} y={end.y} />
      </g>
    )
  }
  if (c.cmd === 'A' && c.arc && c.arc.valid) {
    const { center, rx, ry, xRotation } = c.arc
    return (
      <g key="ctrl">
        <ellipse cx={center.x} cy={center.y} rx={rx} ry={ry} transform={xRotation ? `rotate(${xRotation} ${center.x} ${center.y})` : undefined} fill="none" stroke={STROKE} strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.5} />
        <circle cx={center.x} cy={center.y} r={3} fill={CONTROL_FILL} stroke={CONTROL_STROKE} strokeWidth={1.5} />
        <Endpoint x={start.x} y={start.y} />
        <Endpoint x={end.x} y={end.y} />
      </g>
    )
  }
  // M, L, H, V, Z — só endpoints
  return (
    <g key="ctrl">
      <Endpoint x={start.x} y={start.y} />
      <Endpoint x={end.x} y={end.y} />
    </g>
  )
}

function Endpoint({ x, y }) {
  return <circle cx={x} cy={y} r={4} fill={ENDPOINT_FILL} stroke={ENDPOINT_STROKE} strokeWidth={1.5} />
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function SvgPathVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(EXAMPLES[0].d)
  const [showGrid, setShowGrid] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showBbox, setShowBbox] = useState(false)
  const [hoverIdx, setHoverIdx] = useState(null)
  const [messageApi, messageContextHolder] = message.useMessage()

  const parsed = useMemo(() => {
    try {
      return parsePath(input)
    } catch (e) {
      return { commands: [], bbox: null, bboxFromControl: null, length: 0, subpathCount: 0, errors: [String(e)], raw: input }
    }
  }, [input])

  const viewBox = useMemo(() => {
    if (parsed.bbox) return autoViewBox(parsed.bbox, 0.05)
    return '0 0 100 100'
  }, [parsed.bbox])

  // Comandos para a tabela (já preparados com summary)
  const tableData = useMemo(() => parsed.commands.map((c, i) => ({
    key: i,
    index: i,
    cmd: c.cmd,
    rel: c.rel,
    args: c.args.join(' '),
    raw: c.raw,
    meaning: summarize(c, lang),
    subpath: c.subpath,
  })), [parsed.commands, lang])

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(input)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [input, messageApi, t])

  const copySegment = useCallback(async (raw) => {
    try {
      await navigator.clipboard.writeText(raw)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [messageApi, t])

  const cmdTagColor = {
    M: 'blue', L: 'green', H: 'cyan', V: 'cyan', C: 'purple', S: 'magenta',
    Q: 'volcano', T: 'gold', A: 'red', Z: 'default',
  }

  const cmdColumns = [
    {
      title: t.colIndex,
      dataIndex: 'index',
      width: 50,
      render: (v) => <Text type="secondary">{v}</Text>,
    },
    {
      title: t.colCmd,
      dataIndex: 'cmd',
      width: 110,
      render: (cmd, row) => (
        <Space size={4}>
          <Tag color={cmdTagColor[cmd] || 'default'} style={{ fontFamily: 'monospace', margin: 0 }}>
            {cmd}
          </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {row.rel === 'rel' ? t.cmdRel : t.cmdAbs}
          </Text>
        </Space>
      ),
    },
    {
      title: t.colArgs,
      dataIndex: 'args',
      render: (args) => <Text code style={{ fontSize: 12 }}>{args}</Text>,
    },
    {
      title: t.colMeaning,
      dataIndex: 'meaning',
      render: (m) => <Text type="secondary" style={{ fontSize: 12 }}>{m}</Text>,
    },
    {
      title: '',
      dataIndex: 'raw',
      width: 60,
      render: (raw) => (
        <Tooltip title={t.copySegment}>
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            onClick={() => copySegment(raw)}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><HighlightOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.helpTitle}
        description={t.helpBody}
      />

      <Card
        title={t.inputLabel}
        extra={
          <Space>
            <Button size="small" onClick={() => setInput('')} icon={<ReloadOutlined />}>
              {t.clearInput}
            </Button>
            <Button size="small" onClick={copyAll} icon={<CopyOutlined />}>
              {t.copyPath}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            autoSize={{ minRows: 3, maxRows: 8 }}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.examples}:</Text>
            <Select
              size="small"
              style={{ minWidth: 280 }}
              value={null}
              placeholder={t.examples}
              onChange={(v) => setInput(v)}
              options={EXAMPLES.map((e) => ({ value: e.d, label: e.label[lang] }))}
            />
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>{t.formatHint}</Text>
        </Space>
      </Card>

      {parsed.errors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t.errorTitle}
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
              {parsed.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            title={t.previewTitle}
            extra={
              <Space size={4} wrap>
                <Tooltip title={t.showGrid}>
                  <Switch
                    size="small"
                    checked={showGrid}
                    onChange={setShowGrid}
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                  />
                </Tooltip>
                <Tooltip title={t.showControls}>
                  <Switch
                    size="small"
                    checked={showControls}
                    onChange={setShowControls}
                    checkedChildren={<AimOutlined />}
                    unCheckedChildren={<AimOutlined />}
                  />
                </Tooltip>
                <Tooltip title={t.showBbox}>
                  <Switch
                    size="small"
                    checked={showBbox}
                    onChange={setShowBbox}
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren={null}
                  />
                </Tooltip>
              </Space>
            }
          >
            <PreviewSvg
              d={input}
              viewBox={viewBox}
              parsed={parsed}
              showGrid={showGrid}
              showBbox={showBbox}
              showControls={showControls}
              hoverIdx={hoverIdx}
              onHover={setHoverIdx}
              onLeave={() => setHoverIdx(null)}
              emptyText={t.noCommands}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={t.statsTitle}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Statistic
                title={t.segs}
                value={parsed.commands.length}
              />
              <Statistic
                title={t.subpaths}
                value={parsed.subpathCount}
              />
              <Statistic
                title={t.length}
                value={parsed.length.toFixed(2)}
                valueStyle={{ fontFamily: 'monospace' }}
                suffix="px"
              />
              {parsed.bbox && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.bbox}:</Text>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 4 }}>
                    <div>x: {fmt(parsed.bbox.minX)} → {fmt(parsed.bbox.maxX)}</div>
                    <div>y: {fmt(parsed.bbox.minY)} → {fmt(parsed.bbox.maxY)}</div>
                    <div>w: {fmt(parsed.bbox.maxX - parsed.bbox.minX)}, h: {fmt(parsed.bbox.maxY - parsed.bbox.minY)}</div>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t.tableTitle}>
        {tableData.length === 0 ? (
          <Empty description={t.empty} />
        ) : (
          <Table
            dataSource={tableData}
            columns={cmdColumns}
            pagination={false}
            size="small"
            rowClassName={(row) => row.index === hoverIdx ? 'svg-path-row-active' : ''}
            onRow={(row) => ({
              onMouseEnter: () => setHoverIdx(row.index),
              onMouseLeave: () => setHoverIdx(null),
            })}
          />
        )}
      </Card>

      <Card title={t.referenceTitle}>
        <Collapse
          accordion
          items={['M', 'L', 'H', 'V', 'C', 'S', 'Q', 'T', 'A', 'Z'].map((c) => ({
            key: c,
            label: (
              <Space>
                <Tag color={cmdTagColor[c] || 'default'} style={{ fontFamily: 'monospace', margin: 0 }}>
                  {c}
                </Tag>
                <Text strong>{commandName(c, lang)}</Text>
              </Space>
            ),
            children: <Text type="secondary">{COMMAND_HELP[c][lang]}</Text>,
          }))}
        />
      </Card>

      <style>{`
        .svg-path-row-active td { background: #e6f7ff !important; }
        .svg-path-row-active td:first-child { font-weight: 600; }
      `}</style>
    </Space>
  )
}

function fmt(n) {
  return Number(n.toFixed(2))
}

// ─── Componente de preview (isolado pra manter o pai leve) ──────────────────
function PreviewSvg({ d, viewBox, parsed, showGrid, showBbox, showControls, hoverIdx, onHover, onLeave, emptyText }) {
  const [vx, vy, vw, vh] = viewBox.split(' ').map((n) => parseFloat(n))

  const grid = showGrid && vw > 0 && vh > 0 ? (
    <g key="grid" stroke={GRID_STROKE} strokeWidth={1} fill="none">
      {(() => {
        const step = niceStep(Math.min(vw, vh) / 10)
        const lines = []
        const startX = Math.floor(vx / step) * step
        const endX = vx + vw
        for (let x = startX; x <= endX + 1e-9; x += step) {
          lines.push(<line key={`gx${x.toFixed(2)}`} x1={x} y1={vy} x2={x} y2={vy + vh} />)
        }
        const startY = Math.floor(vy / step) * step
        const endY = vy + vh
        for (let y = startY; y <= endY + 1e-9; y += step) {
          lines.push(<line key={`gy${y.toFixed(2)}`} x1={vx} y1={y} x2={vx + vw} y2={y} />)
        }
        return lines
      })()}
    </g>
  ) : null

  const bbox = showBbox && parsed.bboxFromControl ? (
    <rect
      key="bbox"
      x={parsed.bboxFromControl.minX}
      y={parsed.bboxFromControl.minY}
      width={parsed.bboxFromControl.maxX - parsed.bboxFromControl.minX}
      height={parsed.bboxFromControl.maxY - parsed.bboxFromControl.minY}
      fill="none"
      stroke="#faad14"
      strokeWidth={1.5}
      strokeDasharray="4 3"
    />
  ) : null

  // Reconstrói um `d` a partir dos comandos válidos — se o usuário digitou
  // pedaços que não parsearam (ex.: "X" fora do alfabeto), o navegador
  // SVG reclama no console. Renderizar só o que parseou evita o ruído.
  const safeD = safeDFromCommands(parsed.commands)
  const basePath = parsed.commands.length > 0 && safeD ? (
    <path
      key="base"
      d={safeD}
      fill="rgba(22, 119, 255, 0.06)"
      stroke={STROKE_INACTIVE}
      strokeWidth={1.5}
    />
  ) : null

  const highlights = parsed.commands.map((c, i) => {
    const seg = segmentToD(c)
    if (!seg) return null
    const isActive = hoverIdx === i
    const isDim = hoverIdx !== null && hoverIdx !== i
    const color = isActive ? STROKE_HOVER : STROKE
    const sw = isActive ? 3 : (hoverIdx === null ? 1.5 : 1)
    const op = isDim ? 0.35 : 1
    return (
      <path
        key={`seg-${i}`}
        d={seg}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        opacity={op}
        pointerEvents="stroke"
      />
    )
  })

  const controlOverlay = showControls && hoverIdx !== null ? renderControl(parsed.commands[hoverIdx]) : null

  if (parsed.commands.length === 0) {
    return (
      <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="secondary">{emptyText}</Text>
      </div>
    )
  }

  // Width/height do SVG derivado da viewBox para preencher o card
  const aspect = vh === 0 ? 1 : vw / vh
  const maxW = 480
  const w = Math.min(maxW, maxW * aspect)
  const h = w / aspect

  return (
    <div
      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      onMouseLeave={onLeave}
    >
      <svg
        viewBox={viewBox}
        width="100%"
        style={{ maxWidth: 560, height: 'auto', background: '#fafafa', borderRadius: 6 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {grid}
        {bbox}
        {basePath}
        {highlights}
        {controlOverlay}
      </svg>
    </div>
  )
}