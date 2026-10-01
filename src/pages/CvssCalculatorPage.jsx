import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Row, Col, Input, Select, Button, Tag, Alert, Collapse,
  Table, Switch, Tooltip, message,
} from 'antd'
import {
  SafetyCertificateOutlined, CopyOutlined, ThunderboltOutlined, InfoCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  BASE_METRICS, TEMPORAL_METRICS, ENV_METRICS, MODIFIED_METRICS, DEFAULT_METRICS,
  computeCvss, buildVector, parseVector, weightOf, getMetric, severityBands, toCvssJson,
} from '../utils/cvss'

const { Title, Paragraph, Text } = Typography

// Vetores reais (com a mesma nota publicada pelo NVD) pra conferir o resultado
// contra uma fonte externa, e o exemplo ambiental do CVSS v3.1 User Guide.
const EXAMPLES = [
  { id: 'log4shell', text: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H' },
  { id: 'heartbleed', text: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N' },
  { id: 'eternalblue', text: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H' },
  { id: 'xss', text: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N' },
  { id: 'env', text: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:L/I:L/A:N/MAV:A' },
]

const NOT_DEFINED = { pt: 'Não definido', en: 'Not Defined' }

const SOURCE_CODE = `// CVSS v3.1 — núcleo do cálculo (equações da seção 7 da spec da FIRST)

// Roundup: menor número com 1 casa decimal >= entrada, em aritmética inteira
// (Appendix A) — é o que separa o v3.1 do v3.0 em notas como 4.7 vs 4.6.
export function roundup(input) {
  const intInput = Math.round(input * 100000)
  if (intInput % 10000 === 0) return intInput / 100000
  return (Math.floor(intInput / 10000) + 1) / 10
}

const iss = 1 - (1 - c) * (1 - i) * (1 - a)
const impact = scope === 'C'
  ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
  : 6.42 * iss
const exploitability = 8.22 * av * ac * pr * ui

const baseScore = impact <= 0 ? 0 : roundup(
  scope === 'C'
    ? Math.min(1.08 * (impact + exploitability), 10)
    : Math.min(impact + exploitability, 10)
)

// Temporal: só rebaixa a nota (E, RL e RC têm peso <= 1).
const temporalScore = roundup(baseScore * e * rl * rc)

// Environmental: requisitos de segurança (CR/IR/AR) + métricas modificadas
// (MAV..MA), com 'X' herdando o valor Base.
const miss = Math.min(1 - (1 - cr * mc) * (1 - ir * mi) * (1 - ar * ma), 0.915)
const modifiedImpact = modifiedScope === 'C'
  ? 7.52 * (miss - 0.029) - 3.25 * Math.pow(miss * 0.9731 - 0.02, 13) // expoente 13: mudança do v3.1
  : 6.42 * miss
const environmentalScore = modifiedImpact <= 0 ? 0 : roundup(
  roundup(
    modifiedScope === 'C'
      ? Math.min(1.08 * (modifiedImpact + modifiedExploitability), 10)
      : Math.min(modifiedImpact + modifiedExploitability, 10)
  ) * e * rl * rc
)`

const translations = {
  pt: {
    title: 'Calculadora de CVSS v3.1',
    intro: (
      <>
        Calcula o <Text strong>CVSS v3.1</Text> a partir de um vetor de métricas: Base,
        Temporal e Environmental Score, com a memória de cálculo passo a passo e o peso de
        cada métrica na tela. Implementação das equações da especificação da FIRST
        (seção 7) — tudo no navegador, sem API e sem consultar base de vulnerabilidades.
      </>
    ),
    vectorTitle: 'Vetor de métricas',
    vectorLabel: 'Cole um vetor CVSS',
    vectorPlaceholder: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    apply: 'Calcular',
    reset: 'Voltar ao padrão',
    examplesLabel: 'Exemplos com resultado esperado',
    resultTitle: 'Resultado',
    baseScoreLabel: 'Base Score',
    temporalScoreLabel: 'Temporal Score',
    environmentalScoreLabel: 'Environmental Score',
    copyVector: 'Copiar vetor',
    copyJson: 'Copiar JSON',
    copyScore: 'Copiar score',
    copied: 'copiado',
    copyFail: 'Não foi possível copiar',
    vectorOut: 'Vetor resultante',
    invalidVector: 'Vetor inválido — usei o que deu pra interpretar e apontei o(s) problema(s):',
    errEmpty: 'o campo está vazio',
    errVersion: 'versão não suportada (use CVSS:3.1)',
    errTemplate: 'parece um vetor-modelo (placeholders X nas métricas Base) — troque pelos valores reais',
    errMalformed: 'trecho sem "Métrica:Valor": {token}',
    errUnknown: 'métrica desconhecida: {key}',
    errInvalid: 'valor inválido para {key}: {value}',
    errDuplicate: 'métrica repetida: {key}',
    errMissing: 'faltam métricas Base obrigatórias: {keys}',
    extensionNote: 'Extensões ignoradas no cálculo padrão: {keys}',
    version30Warn: 'Esse vetor é do CVSS 3.0 e o cálculo aqui usa as equações do v3.1 (redefinição do Roundup e o expoente 13 no ModifiedImpact). O resultado pode diferir em 0.1 do que um pontificador v3.0 devolve.',
    scoreZeroWarn: 'Com Confidencialidade, Integridade e Disponibilidade em Nenhum o Impacto é zero — o Base Score é 0.0 por definição.',
    baseTitle: 'Métricas Base',
    baseHelp: 'Obrigatórias, e suficientes para o Base Score. PR muda de peso conforme o Escopo: Low vira 0.68 e High vira 0.50 quando S:C.',
    temporalTitle: 'Métricas Temporais',
    temporalHelp: 'Ajustam a nota ao momento atual e só podem rebaixá-la (pesos <= 1). Use para diferenciar o que está sendo explorado de verdade do que ainda é teórico.',
    environmentalTitle: 'Métricas Ambientais',
    environmentalHelp: 'Customizam a nota para o seu ambiente: o quanto o ativo é crítico (CR/IR/AR) e quais métricas Base valem de verdade ali (MAV..MA herdam a Base quando estão em X).',
    requirementsLabel: 'Requisitos de segurança do ativo',
    showModified: 'Sobrescrever métricas Base (MAV..MA)',
    baseValue: 'Base: {value}',
    inheritedFrom: 'Herdando a métrica Base: {keys}',
    calcTitle: 'Memória de cálculo',
    calcBaseTitle: 'Base Score',
    calcTemporalTitle: 'Temporal Score',
    calcEnvironmentalTitle: 'Environmental Score',
    colFormula: 'Equação',
    colSubstitution: 'Substituição',
    colValue: 'Resultado',
    glossaryTitle: 'Glossário das métricas',
    glossaryHelp: 'Mesmos valores e pesos das tabelas 1–11 e 16 da especificação. Em PR/MPR os dois pesos são mostrados porque dependem do escopo (S:U / S:C).',
    colMetric: 'Métrica',
    colValueName: 'Valor',
    colWeight: 'Peso',
    colMeaning: 'Significado',
    colGroup: 'Grupo',
    groupBase: 'Base',
    groupTemporal: 'Temporal',
    groupEnvironmental: 'Ambiental',
    bandsTitle: 'Faixas de severidade',
    bandsHelp: 'A escala qualitativa da seção 5 da especificação — é ela que vira badge, fila e SLA.',
    colBand: 'Faixa',
    colRating: 'Classificação',
    sourceTitle: 'Implementação (fonte)',
    tipTitle: 'CVSS não é risco de negócio',
    tipBody: (
      <>
        <Text strong>A nota é intrínseca à vulnerabilidade</Text>, não ao seu ambiente: o
        mesmo CVE recebe 9.8 num navegador e num roteador. O que define a prioridade de
        correção é o par CVSS + contexto (CR/IR/AR, exposição de rede, ativo envolvido) e o
        prazo de correção do fornecedor — algo que esta ferramenta não tem como saber.
        Prefira sempre o vetor publicado pela fonte primária (NVD, fornecedor, CNA) a
        recalcular por conta própria.
      </>
    ),
    severity: {
      none: 'Nenhum',
      low: 'Baixo',
      medium: 'Médio',
      high: 'Alto',
      critical: 'Crítico',
    },
    metricExamples: {
      log4shell: 'Log4Shell (10.0)',
      heartbleed: 'Heartbleed (7.5)',
      eternalblue: 'EternalBlue (8.8)',
      xss: 'XSS refletido (6.1)',
      env: 'Score ambiental (5.4)',
    },
    temporalNotDefined: 'métricas Temporais não definidas — o Temporal Score repete o Base Score',
    environmentalNotDefined: 'métricas Ambientais não definidas — o Environmental Score repete o score anterior',
  },
  en: {
    title: 'CVSS v3.1 Calculator',
    intro: (
      <>
        Computes the <Text strong>CVSS v3.1</Text> score from a metric vector: Base,
        Temporal and Environmental scores, with a step-by-step walkthrough of the formula
        and the weight of every metric on screen. Implementation of the equations from the
        FIRST specification (section 7) — runs in the browser, no API and no vulnerability
        database lookup.
      </>
    ),
    vectorTitle: 'Metric vector',
    vectorLabel: 'Paste a CVSS vector',
    vectorPlaceholder: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    apply: 'Calculate',
    reset: 'Back to defaults',
    examplesLabel: 'Examples with expected score',
    resultTitle: 'Result',
    baseScoreLabel: 'Base Score',
    temporalScoreLabel: 'Temporal Score',
    environmentalScoreLabel: 'Environmental Score',
    copyVector: 'Copy vector',
    copyJson: 'Copy JSON',
    copyScore: 'Copy score',
    copied: 'copied',
    copyFail: 'Copy failed',
    vectorOut: 'Resulting vector',
    invalidVector: 'Invalid vector — I used whatever could be parsed and flagged the problem(s):',
    errEmpty: 'the field is empty',
    errVersion: 'unsupported version (use CVSS:3.1)',
    errTemplate: 'looks like a template vector (X placeholders in the Base metrics) — fill in the real values',
    errMalformed: 'chunk without "Metric:Value": {token}',
    errUnknown: 'unknown metric: {key}',
    errInvalid: 'invalid value for {key}: {value}',
    errDuplicate: 'duplicated metric: {key}',
    errMissing: 'missing mandatory Base metrics: {keys}',
    extensionNote: 'Extensions ignored in the standard calculation: {keys}',
    version30Warn: 'That vector is CVSS 3.0, and this calculator uses the v3.1 equations (Roundup redefinition and the exponent 13 in ModifiedImpact). The result may differ by 0.1 from a v3.0 scorer.',
    scoreZeroWarn: 'With Confidentiality, Integrity and Availability set to None the Impact is zero — the Base Score is 0.0 by definition.',
    baseTitle: 'Base metrics',
    baseHelp: 'Mandatory, and enough for the Base Score. PR changes weight depending on Scope: Low becomes 0.68 and High becomes 0.50 when S:C.',
    temporalTitle: 'Temporal metrics',
    temporalHelp: 'Tune the score to the current moment — they can only lower it (weights <= 1). Use them to separate what is actually being exploited from what is still theoretical.',
    environmentalTitle: 'Environmental metrics',
    environmentalHelp: 'Customize the score for your environment: how critical the asset is (CR/IR/AR) and which Base metrics really hold there (MAV..MA inherit Base when set to X).',
    requirementsLabel: 'Security requirements of the asset',
    showModified: 'Override Base metrics (MAV..MA)',
    baseValue: 'Base: {value}',
    inheritedFrom: 'Inheriting the Base metric: {keys}',
    calcTitle: 'Calculation walkthrough',
    calcBaseTitle: 'Base Score',
    calcTemporalTitle: 'Temporal Score',
    calcEnvironmentalTitle: 'Environmental Score',
    colFormula: 'Equation',
    colSubstitution: 'Substitution',
    colValue: 'Result',
    glossaryTitle: 'Metric glossary',
    glossaryHelp: 'Same values and weights as tables 1–11 and 16 of the specification. For PR/MPR both weights are shown because they depend on scope (S:U / S:C).',
    colMetric: 'Metric',
    colValueName: 'Value',
    colWeight: 'Weight',
    colMeaning: 'Meaning',
    colGroup: 'Group',
    groupBase: 'Base',
    groupTemporal: 'Temporal',
    groupEnvironmental: 'Environmental',
    bandsTitle: 'Severity ratings',
    bandsHelp: 'The qualitative scale from section 5 of the specification — it is what ends up in badges, queues and SLAs.',
    colBand: 'Range',
    colRating: 'Rating',
    sourceTitle: 'Implementation (source)',
    tipTitle: 'CVSS is not business risk',
    tipBody: (
      <>
        <Text strong>The score is intrinsic to the vulnerability</Text>, not to your
        environment: the same CVE gets 9.8 on a browser and on a router. What drives
        remediation priority is the pair CVSS + context (CR/IR/AR, network exposure, the
        asset involved) and the vendor patch timeline — something this tool cannot know.
        Prefer the vector published by the primary source (NVD, vendor, CNA) over
        recomputing it yourself.
      </>
    ),
    severity: {
      none: 'None',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    },
    metricExamples: {
      log4shell: 'Log4Shell (10.0)',
      heartbleed: 'Heartbleed (7.5)',
      eternalblue: 'EternalBlue (8.8)',
      xss: 'Reflected XSS (6.1)',
      env: 'Environmental score (5.4)',
    },
    temporalNotDefined: 'no Temporal metrics set — the Temporal Score repeats the Base Score',
    environmentalNotDefined: 'no Environmental metrics set — the Environmental Score repeats the previous score',
  },
}

export default function CvssCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [metrics, setMetrics] = useState(() => {
    const parsed = parseVector(EXAMPLES[0].text)
    return parsed.metrics
  })
  const [version, setVersion] = useState('3.1')
  const [input, setInput] = useState(EXAMPLES[0].text)
  const [notes, setNotes] = useState({ errors: [], extensions: [] })
  const [showModified, setShowModified] = useState(false)

  // `metrics` é sempre um objeto novo (substituído por cópia), então o
  // useMemo não reinicia a cada render — nada de objeto/array recriado em deps.
  const result = useMemo(() => computeCvss(metrics), [metrics])
  const vector = useMemo(() => buildVector(metrics, version), [metrics, version])
  const json = useMemo(() => toCvssJson(metrics, version, result), [metrics, version, result])

  // Definições das métricas modificadas: mesmos valores da métrica Base mais o
  // "X" (não definido), montado uma vez só.
  const modifiedDefs = useMemo(() => MODIFIED_METRICS.map((def) => ({
    key: def.key,
    base: def.base,
    name: def.name,
    values: [{ v: 'X', name: NOT_DEFINED }, ...getMetric(def.base).values],
  })), [])

  const setMetric = useCallback((key, value) => {
    setMetrics((prev) => ({ ...prev, [key]: value }))
  }, [])

  const copy = useCallback(async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(`${label} — ${t.copied}`)
    } catch {
      messageApi.error(t.copyFail)
    }
  }, [messageApi, t])

  const applyVector = useCallback((raw) => {
    const parsed = parseVector(raw)
    if (parsed.errors.includes('empty')) {
      setNotes({ errors: ['empty'], extensions: [] })
      return
    }
    // Vetor-modelo gera 8 erros "invalid:XX:X" — uma nota só diz mais.
    const errors = parsed.errors.includes('template')
      ? ['template']
      : parsed.errors.slice(0, 6)
    setMetrics(parsed.metrics)
    setVersion(parsed.version)
    setNotes({ errors, extensions: parsed.extensions })
  }, [])

  const resetAll = useCallback(() => {
    setMetrics({ ...DEFAULT_METRICS })
    setVersion('3.1')
    setNotes({ errors: [], extensions: [] })
    setShowModified(false)
  }, [])

  const loadExample = useCallback((text) => {
    setInput(text)
    applyVector(text)
  }, [applyVector])

  const describeError = useCallback((code) => {
    const [kind, a, b] = code.split(':')
    switch (kind) {
      case 'empty': return t.errEmpty
      case 'version': return t.errVersion
      case 'template': return t.errTemplate
      case 'malformed': return t.errMalformed.replace('{token}', a)
      case 'unknown': return t.errUnknown.replace('{key}', a)
      case 'invalid': return t.errInvalid.replace('{key}', a).replace('{value}', b)
      case 'duplicate': return t.errDuplicate.replace('{key}', a)
      case 'missing': return t.errMissing.replace('{keys}', a)
      default: return code
    }
  }, [t])

  const weightLabel = useCallback((key, value, scope) => {
    const weight = weightOf(key, value, scope)
    return weight === null ? '—' : String(weight)
  }, [])

  const renderScore = (label, score, severity, note) => (
    <Card size="small" style={{ flex: '1 1 190px', minWidth: 190 }} styles={{ body: { padding: 12 } }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Text type="secondary">{label}</Text>
        <Space align="baseline" size={8} wrap>
          <Text strong style={{ fontSize: 28, lineHeight: 1.1, color: severity.color }}>
            {score.toFixed(1)}
          </Text>
          <Tag color={severity.color} style={{ color: '#fff', border: 'none', marginInlineEnd: 0 }}>
            {t.severity[severity.key]}
          </Tag>
        </Space>
        {note && (
          <Text type="secondary" style={{ fontSize: 12 }}>{note}</Text>
        )}
      </Space>
    </Card>
  )

  const renderMetricSelect = (metric, extraNote) => {
    const current = metrics[metric.key]
    const scope = metric.key === 'MPR' ? result.resolved.MS : result.metrics.S
    const selected = metric.values.find((item) => item.v === current)
    return (
      <Col xs={24} sm={12} lg={8} key={metric.key}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space size={6} wrap>
            <Text code>{metric.key}</Text>
            <Text strong>{metric.name[lang]}</Text>
            {metric.question && (
              <Tooltip title={metric.question[lang]}>
                <QuestionCircleOutlined style={{ color: '#bfbfbf' }} />
              </Tooltip>
            )}
            {extraNote && <Text type="secondary" style={{ fontSize: 12 }}>{extraNote}</Text>}
          </Space>
          <Select
            value={current}
            onChange={(value) => setMetric(metric.key, value)}
            style={{ width: '100%' }}
            options={metric.values.map((item) => ({
              value: item.v,
              label: `${item.v} — ${item.name[lang]} (${weightLabel(metric.key, item.v, scope)})`,
            }))}
          />
          {selected && selected.desc && (
            <Text type="secondary" style={{ fontSize: 12 }}>{selected.desc[lang]}</Text>
          )}
        </Space>
      </Col>
    )
  }

  const stepColumns = useMemo(() => [
    {
      title: t.colFormula,
      dataIndex: 'formula',
      key: 'formula',
      render: (value) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'normal' }}>{value}</Text>
      ),
    },
    {
      title: t.colSubstitution,
      dataIndex: 'substitution',
      key: 'substitution',
      render: (value) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'normal' }}>{value}</Text>
      ),
    },
    {
      title: t.colValue,
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (value) => <Text strong>{value}</Text>,
    },
  ], [t])

  const glossaryRows = useMemo(() => {
    const rows = []
    const push = (group, defs) => {
      for (const def of defs) {
        for (const value of def.values) {
          // PR/MPR mudam de peso com o escopo — mostra os dois.
          const unchanged = weightOf(def.key, value.v, 'U')
          const changed = weightOf(def.key, value.v, 'C')
          const weight = unchanged === null
            ? '—'
            : (unchanged === changed ? String(unchanged) : `${unchanged} (S:U) / ${changed} (S:C)`)
          rows.push({
            key: `${def.key}-${value.v}`,
            group,
            metric: def.key,
            metricName: def.name[lang],
            value: value.v,
            valueName: value.name[lang],
            weight,
            desc: value.desc ? value.desc[lang] : null,
          })
        }
      }
    }
    push(t.groupBase, BASE_METRICS)
    push(t.groupTemporal, TEMPORAL_METRICS)
    push(t.groupEnvironmental, ENV_METRICS)
    return rows
  }, [lang, t])

  const glossaryColumns = useMemo(() => [
    {
      title: t.colMetric,
      dataIndex: 'metric',
      key: 'metric',
      width: 210,
      render: (value, row) => (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            <Text code>{value}</Text>
            <Text strong>{row.metricName}</Text>
          </Space>
          <Tag style={{ marginInlineEnd: 0 }}>{row.group}</Tag>
        </Space>
      ),
    },
    {
      title: t.colValueName,
      dataIndex: 'valueName',
      key: 'valueName',
      width: 170,
      render: (value, row) => `${row.value} — ${value}`,
    },
    {
      title: t.colWeight,
      dataIndex: 'weight',
      key: 'weight',
      width: 130,
      align: 'right',
      render: (value) => <Text code style={{ fontSize: 12 }}>{value}</Text>,
    },
    {
      title: t.colMeaning,
      dataIndex: 'desc',
      key: 'desc',
      render: (value) => value || <Text type="secondary">—</Text>,
    },
  ], [t])

  const inheritedKeys = useMemo(
    () => MODIFIED_METRICS.filter((def) => metrics[def.key] === 'X').map((def) => def.base),
    [metrics]
  )

  return (
    <>
      {messageContextHolder}
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
          <Paragraph>{t.intro}</Paragraph>
        </div>

        <Card
          title={<><ThunderboltOutlined /> {t.resultTitle}</>}
          extra={(
            <Space wrap>
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(vector, t.copyVector)}>
                {t.copyVector}
              </Button>
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(json, t.copyJson)}>
                {t.copyJson}
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copy(result.scores.base.toFixed(1), t.copyScore)}
              >
                {t.copyScore}
              </Button>
            </Space>
          )}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap size="middle">
              {renderScore(t.baseScoreLabel, result.scores.base, result.severity.base)}
              {renderScore(
                t.temporalScoreLabel,
                result.scores.temporal,
                result.severity.temporal,
                result.temporal.defined ? null : t.temporalNotDefined
              )}
              {renderScore(
                t.environmentalScoreLabel,
                result.scores.environmental,
                result.severity.environmental,
                result.environmental.defined ? null : t.environmentalNotDefined
              )}
            </Space>

            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>{t.vectorOut}</Text>
              <Text code style={{ fontSize: 13, wordBreak: 'break-all' }}>{vector}</Text>
            </Space>

            {notes.errors.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message={t.invalidVector}
                description={(
                  <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                    {notes.errors.map((note) => <li key={note}>{describeError(note)}</li>)}
                  </ul>
                )}
              />
            )}
            {notes.extensions.length > 0 && (
              <Alert
                type="info"
                showIcon
                message={t.extensionNote.replace('{keys}', notes.extensions.join(', '))}
              />
            )}
            {version === '3.0' && <Alert type="info" showIcon message={t.version30Warn} />}
            {result.base.impact <= 0 && <Alert type="info" showIcon message={t.scoreZeroWarn} />}
          </Space>
        </Card>

        <Card
          title={t.vectorTitle}
          extra={<Button size="small" onClick={resetAll}>{t.reset}</Button>}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>{t.vectorLabel}</Text>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onPressEnter={() => applyVector(input)}
                  placeholder={t.vectorPlaceholder}
                />
                <Button type="primary" onClick={() => applyVector(input)}>{t.apply}</Button>
              </Space.Compact>
            </Space>
            <Space direction="vertical" size={6}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.examplesLabel}</Text>
              <Space wrap>
                {EXAMPLES.map((example) => (
                  <Tag.CheckableTag
                    key={example.id}
                    checked={input === example.text}
                    onChange={() => loadExample(example.text)}
                  >
                    {t.metricExamples[example.id]}
                  </Tag.CheckableTag>
                ))}
              </Space>
            </Space>
          </Space>
        </Card>

        <Card title={t.baseTitle}>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>{t.baseHelp}</Paragraph>
          <Row gutter={[16, 16]}>
            {BASE_METRICS.map((metric) => renderMetricSelect(metric))}
          </Row>
        </Card>

        <Card title={t.temporalTitle}>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>{t.temporalHelp}</Paragraph>
          <Row gutter={[16, 16]}>
            {TEMPORAL_METRICS.map((metric) => renderMetricSelect(metric))}
          </Row>
        </Card>

        <Card title={t.environmentalTitle}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
              {t.environmentalHelp}
            </Paragraph>
            <Text strong>{t.requirementsLabel}</Text>
            <Row gutter={[16, 16]}>
              {ENV_METRICS.map((metric) => renderMetricSelect(metric))}
            </Row>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <Switch checked={showModified} onChange={setShowModified} />
                <Text>{t.showModified}</Text>
              </Space>
              {showModified && inheritedKeys.length > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.inheritedFrom.replace('{keys}', inheritedKeys.join(', '))}
                </Text>
              )}
              {showModified && (
                <Row gutter={[16, 16]}>
                  {modifiedDefs.map((def) => renderMetricSelect(
                    def,
                    t.baseValue.replace('{value}', metrics[def.base])
                  ))}
                </Row>
              )}
            </Space>
          </Space>
        </Card>

        <Card title={t.calcTitle}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>{t.calcBaseTitle} — {result.scores.base.toFixed(1)}</Text>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={stepColumns}
                dataSource={result.base.steps}
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>{t.calcTemporalTitle} — {result.scores.temporal.toFixed(1)}</Text>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={stepColumns}
                dataSource={result.temporal.steps}
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>{t.calcEnvironmentalTitle} — {result.scores.environmental.toFixed(1)}</Text>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={stepColumns}
                dataSource={result.environmental.steps}
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        </Card>

        <Alert
          type="warning"
          showIcon
          icon={<InfoCircleOutlined />}
          message={t.tipTitle}
          description={t.tipBody}
        />

        <Collapse items={[
          {
            key: 'glossary',
            label: t.glossaryTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
                  {t.glossaryHelp}
                </Paragraph>
                <Table
                  size="small"
                  rowKey="key"
                  columns={glossaryColumns}
                  dataSource={glossaryRows}
                  pagination={{ pageSize: 15, size: 'small' }}
                />
              </Space>
            ),
          },
          {
            key: 'bands',
            label: t.bandsTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
                  {t.bandsHelp}
                </Paragraph>
                <Table
                  size="small"
                  rowKey="key"
                  pagination={false}
                  columns={[
                    {
                      title: t.colBand,
                      dataIndex: 'range',
                      key: 'range',
                      width: 140,
                      render: (value) => <Text code>{value}</Text>,
                    },
                    {
                      title: t.colRating,
                      dataIndex: 'key',
                      key: 'label',
                      render: (value, row) => (
                        <Tag color={row.color} style={{ color: '#fff', border: 'none' }}>
                          {t.severity[value]}
                        </Tag>
                      ),
                    },
                  ]}
                  dataSource={severityBands()}
                />
              </Space>
            ),
          },
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, padding: 12, background: '#f6f8fa', borderRadius: 8, overflow: 'auto' }}>
                <code>{SOURCE_CODE}</code>
              </pre>
            ),
          },
        ]} />
      </Space>
    </>
  )
}