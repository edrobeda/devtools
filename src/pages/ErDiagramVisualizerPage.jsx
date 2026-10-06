import React, { useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Tag,
  Row,
  Col,
  Statistic,
  Empty,
  Collapse,
  message,
} from 'antd'
import {
  ApartmentOutlined,
  CopyOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DragOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseSql,
  layoutDiagram,
  buildEdge,
  columnAnchorY,
  HEADER_H,
  ROW_H,
  BADGE_X,
  NAME_X,
  SAMPLES,
} from '../utils/erDiagram'
import engineSource from '../utils/erDiagram.js?raw'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { useMessage } = message

const C = {
  header: '#1668dc',
  headerSel: '#0958d9',
  rowAlt: '#fafafa',
  border: '#d9d9d9',
  borderSel: '#1677ff',
  borderRel: '#4096ff',
  text: 'rgba(0, 0, 0, 0.88)',
  type: 'rgba(0, 0, 0, 0.45)',
  sep: '#f0f0f0',
  edge: '#bfbfbf',
  edgeOn: '#1677ff',
  pkBg: '#fffbe6',
  pkFg: '#d48806',
  fkBg: '#e6f4ff',
  fkFg: '#1677ff',
}

const MONO = {
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
}

const translations = {
  pt: {
    title: 'Visualizador de Diagrama ER',
    intro: (
      <>
        Cole o DDL de um banco — <Text code>CREATE TABLE</Text> e{' '}
        <Text code>ALTER TABLE ... ADD CONSTRAINT</Text> de PostgreSQL, MySQL ou
        SQLite — e veja o diagrama entidade-relacionamento como SVG: tabelas
        organizadas em camadas (quem é referenciado no topo), chaves primárias e
        estrangeiras com badge, cardinalidade 1..N em cada relação e ciclos ou
        auto-referência tratados sem travar. Arraste as tabelas para ajustar o
        layout e clique numa tabela para destacar só as relações dela. 100%
        client-side, nada sai do navegador.
      </>
    ),
    inputTitle: 'DDL SQL',
    presetsTitle: 'Exemplos',
    previewTitle: 'Diagrama',
    hint: 'Arraste as tabelas para reposicionar · clique numa tabela para destacar suas relações · clique no fundo para limpar.',
    legend: 'Legenda',
    legendPk: 'PK — chave primária',
    legendFk: 'FK — chave estrangeira',
    legendCard: '1 = lado único · N = lado de vários (quem tem a FK)',
    statsTables: 'Tabelas',
    statsRels: 'Relacionamentos',
    statsWarnings: 'Avisos',
    emptyInput: 'Cole um DDL SQL acima ou escolha um dos exemplos.',
    noTables: 'Nenhum CREATE TABLE encontrado na entrada — cole o DDL de uma tabela.',
    warningsTitle: 'Avisos do parser',
    copy: 'Copiar SVG',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    download: 'Baixar .svg',
    reset: 'Reposicionar layout',
    sourceCol: 'Código-fonte — parseSql / layoutDiagram / buildEdge',
    sourceBody:
      'O motor vive em src/utils/erDiagram.js: parseSql separa os statements, entende CREATE TABLE e ALTER TABLE ... ADD, resolve as referências (inclusive schema-qualified e identificadores entre aspas) e emite os avisos; layoutDiagram calcula a profundidade de cada tabela pelo grafo de FK (ciclo protegido por visita) e posiciona as camadas; buildEdge desenha a curva Bézier entre as colunas certas, com laço próprio pra auto-referência.',
    warnings: {
      missingTable: (a, b) => `${a}: FOREIGN KEY referencia a tabela “${b}”, que não existe.`,
      missingRefColumn: (a, b, c) => `${c}: a coluna “${b}” não existe em ${a}.`,
      missingFkColumn: (a, b) => `${a}: a coluna “${b}” do FOREIGN KEY não existe na tabela.`,
      missingPkColumn: (a, b) => `${a}: a coluna “${b}” do PRIMARY KEY não existe na tabela.`,
      fkArity: (a, b, c) => `${a}: FK com ${b} coluna(s) de origem e ${c} de destino — conferir.`,
      noPk: (a) => `${a}: sem PRIMARY KEY.`,
      dupTable: (a) => `Tabela “${a}” declarada mais de uma vez.`,
      alterTarget: (a) => `ALTER TABLE “${a}”: tabela não encontrada.`,
      badCreate: (a) => `CREATE TABLE inválido perto de “${a}”.`,
      badItem: (a, b) => `${a}: trecho não reconhecido — “${b}”.`,
      unknown: (a, b, c) => `${a || ''} ${b || ''} ${c || ''}`.trim(),
    },
  },
  en: {
    title: 'ER Diagram Visualizer',
    intro: (
      <>
        Paste a database DDL — <Text code>CREATE TABLE</Text> and{' '}
        <Text code>ALTER TABLE ... ADD CONSTRAINT</Text> from PostgreSQL, MySQL
        or SQLite — and get the entity-relationship diagram as SVG: tables laid
        out in layers (referenced tables on top), primary/foreign keys with
        badges, 1..N cardinality on every relationship, cycles and
        self-references handled without hanging. Drag tables to adjust the
        layout and click one to highlight only its relationships. 100%
        client-side, nothing leaves the browser.
      </>
    ),
    inputTitle: 'SQL DDL',
    presetsTitle: 'Examples',
    previewTitle: 'Diagram',
    hint: 'Drag tables to reposition · click a table to highlight its relationships · click the background to clear.',
    legend: 'Legend',
    legendPk: 'PK — primary key',
    legendFk: 'FK — foreign key',
    legendCard: '1 = one side · N = many side (the table holding the FK)',
    statsTables: 'Tables',
    statsRels: 'Relationships',
    statsWarnings: 'Warnings',
    emptyInput: 'Paste SQL DDL above or pick one of the examples.',
    noTables: 'No CREATE TABLE found in the input — paste a table DDL.',
    warningsTitle: 'Parser warnings',
    copy: 'Copy SVG',
    copied: 'Copied!',
    copyError: 'Could not copy',
    download: 'Download .svg',
    reset: 'Reset layout',
    sourceCol: 'Source code — parseSql / layoutDiagram / buildEdge',
    sourceBody:
      'The engine lives in src/utils/erDiagram.js: parseSql splits statements, understands CREATE TABLE and ALTER TABLE ... ADD, resolves references (including schema-qualified and quoted identifiers) and emits warnings; layoutDiagram computes each table depth from the FK graph (cycles guarded by a visiting set) and positions the layers; buildEdge draws the Bézier between the right columns, with a loop for self-references.',
    warnings: {
      missingTable: (a, b) => `${a}: FOREIGN KEY points to table “${b}”, which does not exist.`,
      missingRefColumn: (a, b, c) => `${c}: column “${b}” does not exist in ${a}.`,
      missingFkColumn: (a, b) => `${a}: FOREIGN KEY column “${b}” does not exist in the table.`,
      missingPkColumn: (a, b) => `${a}: PRIMARY KEY column “${b}” does not exist in the table.`,
      fkArity: (a, b, c) => `${a}: FK has ${b} source column(s) and ${c} target column(s) — check it.`,
      noPk: (a) => `${a}: no PRIMARY KEY.`,
      dupTable: (a) => `Table “${a}” declared more than once.`,
      alterTarget: (a) => `ALTER TABLE “${a}”: table not found.`,
      badCreate: (a) => `Invalid CREATE TABLE near “${a}”.`,
      badItem: (a, b) => `${a}: unrecognized fragment — “${b}”.`,
      unknown: (a, b, c) => `${a || ''} ${b || ''} ${c || ''}`.trim(),
    },
  },
}

function TableBody({ table, width, height, selected }) {
  const hasBadge = table.columns.some((c) => c.pk || c.isFk)
  const nameX = hasBadge ? NAME_X : 10
  const rows = []
  table.columns.forEach((col, i) => {
    const y = HEADER_H + i * ROW_H
    rows.push(
      <React.Fragment key={col.name}>
        {i % 2 === 1 ? (
          <rect x={1} y={y} width={width - 2} height={ROW_H} fill={C.rowAlt} />
        ) : null}
        <line x1={0} y1={y + ROW_H} x2={width} y2={y + ROW_H} stroke={C.sep} />
        {col.pk ? (
          <g>
            <rect x={BADGE_X} y={y + 4} width={26} height={13} rx={3} fill={C.pkBg} />
            <text
              x={BADGE_X + 13}
              y={y + 13.5}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill={C.pkFg}
            >
              PK
            </text>
          </g>
        ) : null}
        {col.isFk ? (
          <g>
            <rect x={BADGE_X + 30} y={y + 4} width={26} height={13} rx={3} fill={C.fkBg} />
            <text
              x={BADGE_X + 43}
              y={y + 13.5}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill={C.fkFg}
            >
              FK
            </text>
          </g>
        ) : null}
        <text x={nameX} y={y + 14.5} fontSize={12} fill={C.text} style={MONO}>
          {col.name}
        </text>
        <text
          x={width - 10}
          y={y + 14.5}
          textAnchor="end"
          fontSize={11}
          fill={C.type}
          style={MONO}
        >
          {col.type.length > 26 ? `${col.type.slice(0, 25)}…` : col.type}
        </text>
      </React.Fragment>
    )
  })
  return (
    <g>
      <rect x={0} y={0} width={width} height={HEADER_H} rx={8} fill={selected ? C.headerSel : C.header} />
      <rect x={0} y={HEADER_H - 8} width={width} height={8} fill={selected ? C.headerSel : C.header} />
      <text x={10} y={19.5} fontSize={13} fontWeight={600} fill="#fff">
        {table.name}
      </text>
      <rect x={0} y={HEADER_H} width={width} height={Math.max(height - HEADER_H, 0)} fill="#fff" />
      {rows}
      <rect
        x={0.5}
        y={0.5}
        width={width - 1}
        height={height - 1}
        rx={8}
        fill="none"
        stroke={selected ? C.borderSel : C.border}
        strokeWidth={selected ? 2 : 1}
        pointerEvents="none"
      />
    </g>
  )
}

const MemoTableBody = React.memo(TableBody)

export default function ErDiagramVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [sql, setSql] = useState(SAMPLES[0].sql)
  const [selected, setSelected] = useState(null)
  const [custom, setCustom] = useState({ sig: null, pos: {} })

  const parsed = useMemo(() => parseSql(sql), [sql])
  const layout = useMemo(
    () => layoutDiagram(parsed.tables, parsed.rels),
    [parsed]
  )

  const positions = useMemo(() => {
    if (custom.sig !== layout.sig) return layout.byId
    const merged = {}
    for (const id of Object.keys(layout.byId)) {
      merged[id] = custom.pos[id]
        ? { ...layout.byId[id], x: custom.pos[id].x, y: custom.pos[id].y }
        : layout.byId[id]
    }
    return merged
  }, [layout, custom])

  const selectedRelIds = useMemo(() => {
    if (!selected) return null
    const set = new Set()
    for (const r of parsed.rels) {
      if (r.fromId === selected || r.toId === selected) set.add(r.id)
    }
    return set
  }, [parsed.rels, selected])

  const relatedTables = useMemo(() => {
    if (!selected) return null
    const set = new Set([selected])
    for (const r of parsed.rels) {
      if (r.fromId === selected) set.add(r.toId)
      if (r.toId === selected) set.add(r.fromId)
    }
    return set
  }, [parsed.rels, selected])

  const edges = useMemo(() => {
    const tablesById = {}
    for (const tb of parsed.tables) tablesById[tb.id] = tb
    const seen = new Map()
    return parsed.rels.map((r) => {
      const pair = [r.fromId, r.toId].sort().join('<>')
      const idx = seen.get(pair) || 0
      seen.set(pair, idx + 1)
      const fromPos = positions[r.fromId]
      const toPos = positions[r.toId]
      const fromTable = tablesById[r.fromId]
      const toTable = tablesById[r.toId]
      if (!fromPos || !toPos || !fromTable || !toTable) return null
      const ay = columnAnchorY(fromPos, fromTable, r.fromCols[0])
      const by = columnAnchorY(toPos, toTable, r.toCols[0])
      return { rel: r, geo: buildEdge(fromPos, ay, toPos, by, idx) }
    }).filter(Boolean)
  }, [parsed, positions])

  const dragRef = useRef(null)
  const svgRef = useRef(null)

  const onTablePointerDown = (e, id) => {
    e.stopPropagation()
    const pos = positions[id]
    if (!pos) return
    const svg = svgRef.current
    const ctm = svg ? svg.getScreenCTM() : null
    if (!ctm) return
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      w: pos.w,
      h: pos.h,
      scaleA: ctm.a || 1,
      scaleD: ctm.d || 1,
      moved: false,
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer capture indisponível — fallback: sem drag contínuo */
    }
  }

  const onTablePointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const rawDx = e.clientX - d.startX
    const rawDy = e.clientY - d.startY
    if (!d.moved) {
      if (Math.hypot(rawDx, rawDy) < 3) return
      d.moved = true
    }
    const dx = rawDx / d.scaleA
    const dy = rawDy / d.scaleD
    const maxX = Math.max(0, layout.width - d.w)
    const maxY = Math.max(0, layout.height - d.h)
    const nx = Math.min(maxX, Math.max(0, Math.round(d.origX + dx)))
    const ny = Math.min(maxY, Math.max(0, Math.round(d.origY + dy)))
    setCustom((prev) => {
      const base = prev.sig === layout.sig && prev.pos ? prev.pos : {}
      return { sig: layout.sig, pos: { ...base, [d.id]: { x: nx, y: ny } } }
    })
  }

  const onTablePointerCancel = () => {
    dragRef.current = null
  }

  const onTablePointerUp = (e, id) => {
    const d = dragRef.current
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* já liberado */
    }
    if (d && !d.moved) {
      setSelected((prev) => (prev === id ? null : id))
    }
  }

  const getSvgText = () => {
    const el = svgRef.current
    if (!el || parsed.tables.length === 0) return ''
    const clone = el.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(layout.width))
    clone.setAttribute('height', String(layout.height))
    clone.removeAttribute('style')
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`
  }

  const copySvg = async () => {
    const text = getSvgText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const downloadSvg = () => {
    const text = getSvgText()
    if (!text) return
    const blob = new Blob([text], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'er-diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const isCustom =
    custom.sig === layout.sig && Object.keys(custom.pos || {}).length > 0

  const uniqueWarnings = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const w of parsed.warnings) {
      const key = `${w.code}|${w.a || ''}|${w.b || ''}|${w.c || ''}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(w)
    }
    return out
  }, [parsed.warnings])

  const applySample = (sample) => {
    setSql(sample.sql)
    setSelected(null)
  }

  const warningText = (w) => {
    const fn = t.warnings[w.code] || t.warnings.unknown
    return fn(w.a, w.b, w.c)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title={t.inputTitle}>
            <TextArea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={18}
              style={{ ...MONO, fontSize: 12 }}
            />
          </Card>

          <Card title={t.presetsTitle} style={{ marginTop: 24 }}>
            <Space size={[8, 8]} wrap>
              {SAMPLES.map((sample) => (
                <Button key={sample.key} size="small" onClick={() => applySample(sample)}>
                  {lang === 'pt' ? sample.label : sample.enLabel}
                </Button>
              ))}
            </Space>
          </Card>

          {uniqueWarnings.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 24 }}
              message={`${t.warningsTitle} (${uniqueWarnings.length})`}
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {uniqueWarnings.map((w, i) => (
                    <li key={`${w.code}-${i}`}>
                      <Text style={{ fontSize: 12 }}>{warningText(w)}</Text>
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={t.previewTitle}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {`${parsed.tables.length} tbl · ${parsed.rels.length} rel`}
              </Text>
            }
          >
            {parsed.tables.length === 0 ? (
              <Empty
                description={sql.trim() ? t.noTables : t.emptyInput}
                style={{ padding: '48px 0' }}
              />
            ) : (
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  overflow: 'auto',
                  background: '#fff',
                  minHeight: 240,
                  maxHeight: 560,
                }}
              >
                <svg
                  id="er-diagram-svg"
                  ref={svgRef}
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  width={layout.width}
                  height={layout.height}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                  onPointerDown={() => setSelected(null)}
                >
                  {edges.map(({ rel, geo }) => {
                    if (!geo) return null
                    const active = selectedRelIds ? selectedRelIds.has(rel.id) : false
                    return (
                      <g
                        key={rel.id}
                        opacity={selectedRelIds && !active ? 0.15 : 1}
                        pointerEvents="none"
                      >
                        <path
                          d={geo.d}
                          fill="none"
                          stroke={active ? C.edgeOn : C.edge}
                          strokeWidth={active ? 2 : 1.5}
                        />
                        <text
                          x={geo.nX}
                          y={geo.nY}
                          textAnchor={geo.nAnchor}
                          fontSize={11}
                          fontWeight={700}
                          fill={active ? C.edgeOn : C.type}
                          stroke="#fff"
                          strokeWidth={3}
                          paintOrder="stroke"
                        >
                          N
                        </text>
                        <text
                          x={geo.oneX}
                          y={geo.oneY}
                          textAnchor={geo.oneAnchor}
                          fontSize={11}
                          fontWeight={700}
                          fill={active ? C.edgeOn : C.type}
                          stroke="#fff"
                          strokeWidth={3}
                          paintOrder="stroke"
                        >
                          1
                        </text>
                      </g>
                    )
                  })}
                  {parsed.tables.map((table) => {
                    const pos = positions[table.id]
                    if (!pos) return null
                    const isSelected = selected === table.id
                    const isRelated = relatedTables ? relatedTables.has(table.id) : false
                    return (
                      <g
                        key={table.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        style={{
                          touchAction: 'none',
                          cursor: 'move',
                        }}
                        onPointerDown={(e) => onTablePointerDown(e, table.id)}
                        onPointerMove={onTablePointerMove}
                        onPointerUp={(e) => onTablePointerUp(e, table.id)}
                        onPointerCancel={(e) => onTablePointerUp(e, table.id)}
                      >
                        {isRelated && !isSelected ? (
                          <rect
                            x={-3}
                            y={-3}
                            width={pos.w + 6}
                            height={pos.h + 6}
                            rx={10}
                            fill="none"
                            stroke={C.borderRel}
                            strokeWidth={1}
                            strokeDasharray="4 3"
                            pointerEvents="none"
                          />
                        ) : null}
                        <MemoTableBody
                          table={table}
                          width={pos.w}
                          height={pos.h}
                          selected={isSelected}
                        />
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}

            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 12 }}>
              <DragOutlined /> {t.hint}
            </Paragraph>

            <Space wrap>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => setCustom({ sig: null, pos: {} })}
                disabled={!isCustom}
              >
                {t.reset}
              </Button>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={copySvg}
                disabled={parsed.tables.length === 0}
              >
                {t.copy}
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={downloadSvg}
                disabled={parsed.tables.length === 0}
              >
                {t.download}
              </Button>
            </Space>
          </Card>

          <Card title={t.legend} style={{ marginTop: 24 }}>
            <Space direction="vertical" size={4}>
              <Space size={8}>
                <Tag color="gold" style={{ margin: 0 }}>
                  PK
                </Tag>
                <Text style={{ fontSize: 12 }}>{t.legendPk}</Text>
              </Space>
              <Space size={8}>
                <Tag color="blue" style={{ margin: 0 }}>
                  FK
                </Tag>
                <Text style={{ fontSize: 12 }}>{t.legendFk}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.legendCard}
              </Text>
            </Space>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={8}>
              <Statistic title={t.statsTables} value={parsed.tables.length} />
            </Col>
            <Col xs={8}>
              <Statistic title={t.statsRels} value={parsed.rels.length} />
            </Col>
            <Col xs={8}>
              <Statistic
                title={t.statsWarnings}
                value={uniqueWarnings.length}
                valueStyle={uniqueWarnings.length > 0 ? { color: '#d48806' } : undefined}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceCol,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre
                  style={{
                    margin: 0,
                    overflowX: 'auto',
                    maxHeight: 340,
                    fontSize: 11,
                    background: '#fafafa',
                    padding: '8px 10px',
                    borderRadius: 6,
                  }}
                >
                  <code>{engineSource}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
