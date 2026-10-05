import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Segmented,
  Button,
  Alert,
  Tag,
  Statistic,
  Row,
  Col,
  Empty,
  Collapse,
  Tooltip,
  message,
} from 'antd'
import {
  ApartmentOutlined,
  CopyOutlined,
  ClearOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CodeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseTextPlan,
  parseJsonPlan,
  parseYamlPlan,
  detectFormat,
  SAMPLES,
  ENGINE_SOURCE,
  operationKind,
  KIND_COLORS,
  KIND_LABEL,
} from '../utils/sqlExplainVisualizer'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const MONO = {
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: 12,
}

const translations = {
  pt: {
    title: 'Visualizador de EXPLAIN (PostgreSQL)',
    intro: (
      <>
        Cole a saída do <Text code>EXPLAIN</Text> ou <Text code>EXPLAIN ANALYZE</Text>{' '}
        do PostgreSQL — em texto (formato padrão do psql), JSON ou YAML — e veja o
        plano de execução como uma árvore navegável, com cada operação{' '}
        <Text strong>categorizada</Text> (scan, join, aggregate, sort…) e{' '}
        <Text strong>colorida</Text> pelo peso relativo no plano. O gargalo (nó de
        maior custo ou de maior tempo real, quando <Text code>ANALYZE</Text>{' '}
        estiver presente) é marcado de vermelho. Útil para debugar queries lentas
        sem precisar instalar nada no servidor — basta copiar o plano do psql,
        DBeaver, pgAdmin, <Text code>auto_explain</Text> ou qualquer ferramenta
        que emita o output bruto do <Text code>EXPLAIN</Text>. 100% no
        navegador.
      </>
    ),
    inputTitle: 'Entrada',
    formatLabel: 'Formato',
    formatAuto: 'Auto',
    formatText: 'Texto',
    formatJson: 'JSON',
    formatYaml: 'YAML',
    formatDetected: (fmt) => `Detectado automaticamente: ${fmt.toUpperCase()}`,
    samples: 'Exemplos',
    clear: 'Limpar',
    parseError: 'Erro ao analisar',
    parseOk: 'Plano interpretado com sucesso',
    empty: 'Cole o output do EXPLAIN acima para visualizar a árvore.',
    sources: {
      'empty': 'A entrada está vazia — cole um EXPLAIN, JSON ou YAML.',
      'no-nodes': 'Nenhum nó de plano encontrado. Será que colou só cabeçalhos?',
      'multiple-roots': 'A entrada tem mais de um plano — cole apenas um EXPLAIN por vez.',
      'json-parse': 'JSON inválido — confira se colou o array inteiro, inclusive o "Plan" de fora.',
      'yaml-parse': 'YAML inválido — a estrutura de indentação tem que estar consistente.',
      'yaml-shape': 'YAML não reconhecido como EXPLAIN — verifique se o nó raiz é "Plan".',
      'no-plan': 'A chave "Plan" não foi encontrada no nível raiz do JSON/YAML.',
    },
    summaryTitle: 'Resumo do plano',
    totalCost: 'Custo total estimado',
    totalTime: 'Tempo total real',
    planRows: 'Linhas estimadas',
    actualRows: 'Linhas reais (pior nó)',
    nodes: 'Nós no plano',
    maxDepth: 'Profundidade máxima',
    planningTime: 'Planning Time',
    executionTime: 'Execution Time',
    notAvailable: '—',
    treeTitle: 'Árvore de execução',
    bottleneckByCost: 'Gargalo por custo',
    bottleneckByTime: 'Gargalo por tempo',
    bottlenecks: 'Gargalos',
    noBottleneck: 'Nenhum nó com custo/tempo destacado.',
    legendTitle: 'Legenda de cores',
    legendIntro: 'Cada nó é colorido pela categoria da operação e opaco pelo seu peso relativo no plano.',
    legendCost: 'Intensidade da cor = fração do nó do plan Total.',
    opLabel: 'Operação',
    classLabel: 'Categoria',
    relationLabel: 'Relação',
    aliasLabel: 'Apelido',
    indexLabel: 'Índice',
    costLabel: 'Custo',
    rowsLabel: 'Linhas',
    widthLabel: 'Largura',
    timeLabel: 'Tempo',
    loopsLabel: 'Loops',
    neverExecuted: 'Nunca executado',
    propertiesLabel: 'Propriedades',
    noProps: 'Sem propriedades adicionais.',
    copy: 'Copiar',
    copied: 'Copiado!',
    refTitle: 'Referência rápida',
    refIntro: 'Como conseguir o output bruto do EXPLAIN para colar aqui.',
    pgSnippet: (
      <pre style={{ margin: '8px 0' }}>
        <code>
          {`-- formato TEXT (default do psql)
EXPLAIN SELECT u.*, t.name FROM users u
JOIN teams t ON u.team_id = t.id
WHERE u.active = true;

-- com ANALYZE: também mostra actual time/rows/loops
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

-- formato JSON ou YAML (mesma saída, machine-readable)
EXPLAIN (FORMAT JSON) SELECT ...;
EXPLAIN (FORMAT YAML) SELECT ...;`}
        </code>
      </pre>
    ),
    pgNotes: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>EXPLAIN</Text> mostra <Text strong>estimativas</Text>{' '}
          (custo/plano de linhas) — não executa a query.
        </li>
        <li>
          <Text code>EXPLAIN ANALYZE</Text> executa a query e mostra{' '}
          <Text strong>tempos reais</Text> (actual time/rows/loops) — cuidado em
          produção.
        </li>
        <li>
          <Text code>auto_explain</Text> (módulo) grava EXPLAIN ANALYZE
          automaticamente em queries lentas no log do servidor.
        </li>
      </ul>
    ),
    opsTitle: 'Operações comuns no EXPLAIN',
    opsIntro:
      'As categorias abaixo cobrem quase tudo que aparece num plano real; cores batem com as da árvore.',
    ops: [
      ['SCAN', 'Leitura da tabela/índice'],
      ['JOIN', 'Combinação de duas entradas (loop/hash/merge)'],
      ['AGGREGATE', 'Agregação (GROUP BY, funções de janela)'],
      ['SORT', 'Ordenação em memória ou em disco'],
      ['LIMIT', 'Truncamento do resultado'],
      ['OTHER', 'Hash, Append, ModifyTable, etc.'],
    ],
    howTitle: 'Como o parser funciona',
    howIntro: (
      <>
        O <Text strong>text format</Text> é uma árvore desenhada com setas: cada
        nível de indentação mais um <Text code>→</Text> significa um filho. O
        parser identifica propriedades (linhas começando com{' '}
        <Text code>Palavra:</Text>) pelo regex{' '}
        <Text code>/^[A-Z][\w \-/]*:/</Text> e separa do nó em si; depois
        extrai, em ordem, os grupos de parênteses de cada nó:{' '}
        <Text code>(cost=A..B rows=N width=W)</Text> e{' '}
        <Text code>(actual time=A..B rows=N loops=N)</Text>. O{' '}
        <Text strong>JSON</Text> e o <Text strong>YAML</Text> são equivalentes
        — o JSON é <Text code>JSON.parse</Text> direto; o YAML usa um parser
        minimalista (indentação + listas + mapas) cobrindo só o subconjunto que o{' '}
        <Text code>EXPLAIN</Text> emite.
      </>
    ),
  },
  en: {
    title: 'EXPLAIN Visualizer (PostgreSQL)',
    intro: (
      <>
        Paste the output of <Text code>EXPLAIN</Text> or{' '}
        <Text code>EXPLAIN ANALYZE</Text> from PostgreSQL — in text format (the
        default psql output), JSON, or YAML — and see the execution plan as a
        navigable tree, with each operation <Text strong>categorized</Text>{' '}
        (scan, join, aggregate, sort…) and <Text strong>colored</Text> by its
        relative weight in the plan. The bottleneck (highest-cost or highest-time
        node when <Text code>ANALYZE</Text> is present) is highlighted in red.
        Useful for debugging slow queries without installing anything on the
        server — just copy the plan from psql, DBeaver, pgAdmin,{' '}
        <Text code>auto_explain</Text>, or any tool that emits the raw{' '}
        <Text code>EXPLAIN</Text> output. 100% client-side.
      </>
    ),
    inputTitle: 'Input',
    formatLabel: 'Format',
    formatAuto: 'Auto',
    formatText: 'Text',
    formatJson: 'JSON',
    formatYaml: 'YAML',
    formatDetected: (fmt) => `Auto-detected: ${fmt.toUpperCase()}`,
    samples: 'Examples',
    clear: 'Clear',
    parseError: 'Parse error',
    parseOk: 'Plan parsed successfully',
    empty: 'Paste the EXPLAIN output above to visualize the tree.',
    sources: {
      'empty': 'Input is empty — paste an EXPLAIN, JSON or YAML.',
      'no-nodes': 'No plan nodes found. Did you paste just the headers?',
      'multiple-roots': 'Input contains more than one plan — paste only one EXPLAIN at a time.',
      'json-parse': 'Invalid JSON — make sure you pasted the whole array, including the outer "Plan".',
      'yaml-parse': 'Invalid YAML — indentation must be consistent.',
      'yaml-shape': 'YAML not recognized as EXPLAIN — verify the root key is "Plan".',
      'no-plan': 'Key "Plan" not found at the JSON/YAML root level.',
    },
    summaryTitle: 'Plan summary',
    totalCost: 'Estimated total cost',
    totalTime: 'Actual total time',
    planRows: 'Estimated rows',
    actualRows: 'Actual rows (worst node)',
    nodes: 'Nodes in plan',
    maxDepth: 'Max depth',
    planningTime: 'Planning Time',
    executionTime: 'Execution Time',
    notAvailable: '—',
    treeTitle: 'Execution tree',
    bottleneckByCost: 'Cost bottleneck',
    bottleneckByTime: 'Time bottleneck',
    bottlenecks: 'Bottlenecks',
    noBottleneck: 'No node stands out by cost/time.',
    legendTitle: 'Color legend',
    legendIntro:
      'Each node is colored by operation category and shaded by its relative weight in the plan.',
    legendCost: 'Color intensity = fraction of plan Total.',
    opLabel: 'Operation',
    classLabel: 'Category',
    relationLabel: 'Relation',
    aliasLabel: 'Alias',
    indexLabel: 'Index',
    costLabel: 'Cost',
    rowsLabel: 'Rows',
    widthLabel: 'Width',
    timeLabel: 'Time',
    loopsLabel: 'Loops',
    neverExecuted: 'Never executed',
    propertiesLabel: 'Properties',
    noProps: 'No additional properties.',
    copy: 'Copy',
    copied: 'Copied!',
    refTitle: 'Quick reference',
    refIntro: 'How to get the raw EXPLAIN output to paste here.',
    pgSnippet: (
      <pre style={{ margin: '8px 0' }}>
        <code>
          {`-- TEXT format (psql default)
EXPLAIN SELECT u.*, t.name FROM users u
JOIN teams t ON u.team_id = t.id
WHERE u.active = true;

-- with ANALYZE: also shows actual time/rows/loops
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

-- JSON or YAML format (machine-readable)
EXPLAIN (FORMAT JSON) SELECT ...;
EXPLAIN (FORMAT YAML) SELECT ...;`}
        </code>
      </pre>
    ),
    pgNotes: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>EXPLAIN</Text> shows <Text strong>estimates</Text>{' '}
          (cost/plan-rows) — does not execute the query.
        </li>
        <li>
          <Text code>EXPLAIN ANALYZE</Text> runs the query and shows{' '}
          <Text strong>actual times</Text> (actual time/rows/loops) — be
          careful in production.
        </li>
        <li>
          <Text code>auto_explain</Text> (module) auto-logs EXPLAIN ANALYZE for
          slow queries in the server log.
        </li>
      </ul>
    ),
    opsTitle: 'Common operations in EXPLAIN',
    opsIntro:
      'The categories below cover almost everything that shows up in a real plan; colors match the tree.',
    ops: [
      ['SCAN', 'Table/index read'],
      ['JOIN', 'Combination of two inputs (loop/hash/merge)'],
      ['AGGREGATE', 'Aggregation (GROUP BY, window functions)'],
      ['SORT', 'In-memory or on-disk sorting'],
      ['LIMIT', 'Result truncation'],
      ['OTHER', 'Hash, Append, ModifyTable, etc.'],
    ],
    howTitle: 'How the parser works',
    howIntro: (
      <>
        The <Text strong>text format</Text> is a tree drawn with arrows: each
        level of indentation plus one <Text code>→</Text> means a child. The
        parser detects properties (lines starting with{' '}
        <Text code>Word:</Text>) via the regex{' '}
        <Text code>/^[A-Z][\w \-/]*:/</Text> and separates them from the node
        itself; then it extracts the parenthesized groups of each line:{' '}
        <Text code>(cost=A..B rows=N width=W)</Text> and{' '}
        <Text code>(actual time=A..B rows=N loops=N)</Text>. The{' '}
        <Text strong>JSON</Text> and <Text strong>YAML</Text> formats are
        equivalent — JSON is plain <Text code>JSON.parse</Text>; YAML uses a
        minimal parser (indentation + lists + maps) that only covers the
        subset that <Text code>EXPLAIN</Text> emits.
      </>
    ),
  },
}

function fmtNum(n, lang, suffix = '') {
  if (n == null) return '—'
  if (Number.isInteger(n)) {
    return `${n.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}${suffix}`
  }
  return `${n.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${suffix}`
}

function fmtMs(ms) {
  if (ms == null) return '—'
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`
  if (ms >= 1) return `${ms.toFixed(2)} ms`
  return `${(ms * 1000).toFixed(0)} µs`
}

function PlanNodeView({ node, lang, t, maxCost, maxTime, isRoot = false, isBottleneck = false }) {
  const kind = operationKind(node.operation)
  const color = KIND_COLORS[kind]
  const costFrac =
    node.totalCost != null && maxCost > 0
      ? Math.min(1, node.totalCost / maxCost)
      : 0
  const timeFrac =
    node.actualTotalTime != null && maxTime > 0
      ? Math.min(1, node.actualTotalTime / maxTime)
      : 0
  const frac = Math.max(costFrac, timeFrac)

  // bg color: weighted by frac
  const bgAlpha = 0.04 + frac * 0.18
  const borderAlpha = 0.3 + frac * 0.7

  const nodeTitle = (
    <Space size={8} wrap>
      <Text strong style={{ color, fontSize: 14 }}>
        {node.operation || '?'}
      </Text>
      {node.relation && (
        <Tag color="default" style={{ margin: 0 }}>
          <Text code style={{ fontSize: 11 }}>
            {node.schema ? `${node.schema}.` : ''}
            {node.relation}
            {node.alias ? ` ${node.alias}` : ''}
          </Text>
        </Tag>
      )}
      {node.indexName && (
        <Tag color="cyan" style={{ margin: 0 }}>
          <Text code style={{ fontSize: 11 }}>
            {node.indexName}
          </Text>
        </Tag>
      )}
      <Tag color={color} style={{ margin: 0, color: '#fff', borderColor: color }}>
        {KIND_LABEL[lang][kind]}
      </Tag>
      {isBottleneck && (
        <Tag color="red" icon={<WarningOutlined />} style={{ margin: 0 }}>
          {lang === 'pt' ? 'Gargalo' : 'Bottleneck'}
        </Tag>
      )}
      {node.neverExecuted && (
        <Tag color="default" style={{ margin: 0 }}>
          {t.neverExecuted}
        </Tag>
      )}
    </Space>
  )

  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} ${bgAlpha * 100}%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} ${borderAlpha * 100}%, transparent)`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 6,
        padding: '8px 12px',
        marginTop: isRoot ? 0 : 8,
        marginBottom: 0,
      }}
    >
      <div>{nodeTitle}</div>

      <Row gutter={[16, 4]} style={{ marginTop: 8 }}>
        {node.totalCost != null && (
          <Col>
            <Tooltip title={t.costLabel}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {t.costLabel}:
              </Text>{' '}
              <Text code style={MONO}>
                {fmtNum(node.startCost, lang)} → {fmtNum(node.totalCost, lang)}
              </Text>
            </Tooltip>
          </Col>
        )}
        {node.planRows != null && (
          <Col>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t.rowsLabel}:
            </Text>{' '}
            <Text code style={MONO}>
              {fmtNum(node.planRows, lang)}
            </Text>
          </Col>
        )}
        {node.planWidth != null && (
          <Col>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t.widthLabel}:
            </Text>{' '}
            <Text code style={MONO}>
              {fmtNum(node.planWidth, lang)}
            </Text>
          </Col>
        )}
        {node.actualTotalTime != null && (
          <Col>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t.timeLabel}:
            </Text>{' '}
            <Text code style={MONO}>
              {fmtMs(node.actualStartTime)} → {fmtMs(node.actualTotalTime)}
            </Text>
          </Col>
        )}
        {node.actualRows != null && (
          <Col>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t.rowsLabel}:
            </Text>{' '}
            <Text code style={MONO}>
              {fmtNum(node.actualRows, lang)}
            </Text>
            {node.actualLoops != null && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {' '}× {fmtNum(node.actualLoops, lang)}
              </Text>
            )}
          </Col>
        )}
      </Row>

      {node.properties.length > 0 && (
        <Collapse
          ghost
          size="small"
          style={{ marginTop: 4 }}
          items={[
            {
              key: 'props',
              label: (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t.propertiesLabel} ({node.properties.length})
                </Text>
              ),
              children: (
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  {node.properties.map((p, i) => (
                    <Text key={i} code style={{ ...MONO, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                      {p}
                    </Text>
                  ))}
                </Space>
              ),
            },
          ]}
        />
      )}

      {node.children && node.children.length > 0 && (
        <div style={{ marginTop: 8, marginLeft: 16, borderLeft: '1px dashed #d9d9d9', paddingLeft: 12 }}>
          {node.children.map((child, i) => (
            <PlanNodeView
              key={i}
              node={child}
              lang={lang}
              t={t}
              maxCost={maxCost}
              maxTime={maxTime}
              isBottleneck={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SqlExplainVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState('')
  const [formatOverride, setFormatOverride] = useState('auto')

  const detectedFormat = useMemo(
    () => (formatOverride === 'auto' ? detectFormat(input) : formatOverride),
    [input, formatOverride]
  )

  const parsed = useMemo(() => {
    if (!input.trim()) return null
    try {
      const fmt = detectedFormat
      if (fmt === 'json') return parseJsonPlan(input)
      if (fmt === 'yaml') return parseYamlPlan(input)
      return parseTextPlan(input)
    } catch (e) {
      return { ok: false, error: 'exception', message: e.message || String(e) }
    }
  }, [input, detectedFormat])

  const handleSample = useCallback((sampleKey) => {
    const sample = SAMPLES.find((s) => s.key === sampleKey)
    if (sample) setInput(sample.value)
  }, [])

  const handleClear = useCallback(() => setInput(''), [])

  const handleCopy = useCallback(
    (text) => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(
          () => message.success(t.copied),
          () => message.error('Copy failed')
        )
      }
    },
    [t.copied]
  )

  const bottleneckOps = useMemo(() => {
    const ops = []
    if (parsed?.ok) {
      if (parsed.totals.bottleneckByCost) {
        ops.push({ key: 'cost', node: parsed.totals.bottleneckByCost })
      }
      if (parsed.totals.bottleneckByTime) {
        ops.push({ key: 'time', node: parsed.totals.bottleneckByTime })
      }
    }
    return ops
  }, [parsed])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {t.title}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t.intro}
        </Paragraph>
      </div>

      <Card
        title={
          <Space wrap>
            <span>{t.inputTitle}</span>
            <Segmented
              value={formatOverride}
              onChange={setFormatOverride}
              options={[
                { label: t.formatAuto, value: 'auto' },
                { label: t.formatText, value: 'text' },
                { label: t.formatJson, value: 'json' },
                { label: t.formatYaml, value: 'yaml' },
              ]}
            />
            {formatOverride === 'auto' && input.trim() && (
              <Tag color="blue">{t.formatDetected(detectedFormat)}</Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              {t.clear}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.samples}:</Text>
            {SAMPLES.map((s) => (
              <Button
                key={s.key}
                size="small"
                icon={<CodeOutlined />}
                onClick={() => handleSample(s.key)}
              >
                {s.label[lang]}
              </Button>
            ))}
          </Space>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="EXPLAIN SELECT ..."
            autoSize={{ minRows: 8, maxRows: 20 }}
            style={MONO}
          />
        </Space>
      </Card>

      {parsed && parsed.ok && (
        <>
          <Card title={<Space><ThunderboltOutlined /> {t.summaryTitle}</Space>}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={t.totalCost}
                  value={fmtNum(parsed.totals.maxCost, lang)}
                  prefix={<ApartmentOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={t.totalTime}
                  value={
                    parsed.totals.maxTime > 0 ? fmtMs(parsed.totals.maxTime) : t.notAvailable
                  }
                  prefix={<ThunderboltOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title={t.planRows} value={fmtNum(parsed.totals.planRowsTotal, lang)} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={t.actualRows}
                  value={
                    parsed.totals.actualRowsTotal > 0
                      ? fmtNum(parsed.totals.actualRowsTotal, lang)
                      : t.notAvailable
                  }
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title={t.nodes} value={parsed.totals.nodeCount} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title={t.maxDepth} value={parsed.totals.maxDepth} />
              </Col>
              {parsed.totals.planningTime != null && (
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={t.planningTime}
                    value={fmtMs(parsed.totals.planningTime)}
                  />
                </Col>
              )}
              {parsed.totals.executionTime != null && (
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={t.executionTime}
                    value={fmtMs(parsed.totals.executionTime)}
                  />
                </Col>
              )}
            </Row>

            {bottleneckOps.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>
                  <WarningOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
                  {t.bottlenecks}:
                </Text>
                <Space direction="vertical" size={4} style={{ marginTop: 4 }}>
                  {bottleneckOps.map(({ key, node }) => (
                    <Space key={key} size={6}>
                      <Tag color="red">
                        {key === 'cost' ? t.bottleneckByCost : t.bottleneckByTime}
                      </Tag>
                      <Text code style={MONO}>
                        {node.operation}
                      </Text>
                      {node.relation && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({node.schema ? `${node.schema}.` : ''}
                          {node.relation}
                          {node.alias ? ` ${node.alias}` : ''})
                        </Text>
                      )}
                      {key === 'cost' && node.totalCost != null && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          cost={fmtNum(node.totalCost, lang)}
                        </Text>
                      )}
                      {key === 'time' && node.actualTotalTime != null && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          actual={fmtMs(node.actualTotalTime)}
                        </Text>
                      )}
                    </Space>
                  ))}
                </Space>
              </div>
            )}
          </Card>

          <Card
            title={
              <Space>
                <ClusterOutlined />
                {t.treeTitle}
              </Space>
            }
          >
            <PlanNodeView
              node={parsed.root}
              lang={lang}
              t={t}
              maxCost={parsed.totals.maxCost}
              maxTime={parsed.totals.maxTime}
              isRoot
              isBottleneck={false}
            />
          </Card>
        </>
      )}

      {parsed && !parsed.ok && (
        <Alert
          showIcon
          type="error"
          message={t.parseError}
          description={t.sources[parsed.error] || parsed.message}
        />
      )}

      {!parsed && (
        <Card>
          <Empty description={t.empty} />
        </Card>
      )}

      <Card title={<Space><EyeOutlined /> {t.legendTitle}</Space>}>
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          {t.legendIntro} {t.legendCost}
        </Paragraph>
        <Space wrap>
          {Object.entries(KIND_COLORS).map(([kind, color]) => (
            <Tag key={kind} color={color} style={{ color: '#fff', borderColor: color }}>
              {KIND_LABEL[lang][kind] || kind}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card title={t.opsTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          {t.opsIntro}
        </Paragraph>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {t.ops.map(([kind, desc]) => (
            <Space key={kind} size={8}>
              <Tag color={KIND_COLORS[kind]} style={{ color: '#fff', borderColor: KIND_COLORS[kind] }}>
                {kind}
              </Tag>
              <Text type="secondary">{desc}</Text>
            </Space>
          ))}
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'how',
            label: t.howTitle,
            children: (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t.howIntro}
              </Paragraph>
            ),
          },
          {
            key: 'ref',
            label: t.refTitle,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {t.refIntro}
                </Paragraph>
                {t.pgSnippet}
                {t.pgNotes}
              </Space>
            ),
          },
          {
            key: 'src',
            label: 'Código-fonte do parser',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <pre
                  style={{
                    ...MONO,
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: 12,
                    overflowX: 'auto',
                    margin: 0,
                  }}
                >
                  <code>{ENGINE_SOURCE}</code>
                </pre>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(ENGINE_SOURCE)}
                >
                  {t.copy}
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}