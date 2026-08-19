import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Segmented,
  Input,
  InputNumber,
  Button,
  Alert,
  Statistic,
  Row,
  Col,
  Descriptions,
  Collapse,
  Table,
  Tag,
  message,
  Switch,
} from 'antd'
import {
  ClockCircleOutlined,
  CopyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  COMMON_DURATIONS,
  MONTH_DAYS,
  YEAR_DAYS,
  breakdownTotal,
  buildDuration,
  cleanNumber,
  describeParts,
  getEngineSource,
  parseDuration,
} from '../utils/iso8601Duration'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Conversor de Duração ISO 8601',
    intro: (
      <>
        Converte entre o formato de duração <Text code>PnYnMnDTnHnMnS</Text> e o
        total em segundos/minutos/horas/dias 100% no navegador. Parseia ou monta
        a string ISO, mostra a decomposição unidade a unidade e uma descrição em
        texto. Nada sai do navegador.
      </>
    ),
    convention: (
      <>
        <Text strong>Observações de conversão:</Text> a fração decimal só é
        válida na menor unidade presente (ex.: <Text code>PT1.5H</Text> vale
        1h30min) e semanas (<Text code>PnW</Text>) só podem aparecer sozinhas — a
        ferramenta aceita essas variações para parsear, mas sinaliza com aviso.
        Para transformar na duração total em segundos, considera-se{' '}
        <Text strong>1 ano = {YEAR_DAYS} dias</Text> e{' '}
        <Text strong>1 mês = {MONTH_DAYS} dias</Text> (convenção comum em
        ferramentas de calendário).
      </>
    ),
    mode: 'Modo',
    modeParse: 'Decodificar',
    modeBuild: 'Montar',
    modeRef: 'Referência rápida',
    parseInput: 'String ISO 8601',
    parsePlaceholder: 'Ex.: P1Y2M3DT4H5M6S',
    parsePresets: 'Exemplos',
    parseValid: 'Duração válida',
    parseEmpty: 'Digite uma string de duração (ex.: P1DT12H).',
    parseInvalid: 'String inválida. Formato esperado: P[nY][nM][nW][nD][T[nH][nM][nS]]',
    parsedHuman: 'Em palavras',
    parsedTotal: 'Total (segundos)',
    weekMixWarn: (
      <>
        <Text code>PnW</Text> (semanas) só é válida sozinha no ISO 8601 — aqui ela
        aparece misturada com outras unidades.
      </>
    ),
    fractionWarn: (
      <>
        A fração decimal deve ficar na <Text strong>menor unidade presente</Text>{' '}
        do valor (ex.: <Text code>PT1H30M</Text> em vez de{' '}
        <Text code>P0.0625D</Text>).
      </>
    ),
    weeksToDaysWarn: 'Semanas misturadas com outras unidades não são válidas no ISO — converter semana(s) em dias.',
    breakdown: 'Decomposição em unidades',
    totalInHours: 'Horas',
    totalInDays: 'Dias',
    totalInMinutes: 'Minutos',
    totalInWeeks: 'Semanas',
    buildTitle: 'Montar string ISO a partir das partes',
    buildHint: 'Preencha os componentes desejados; o string ISO é gerado ao vivo.',
    negativeHint: 'Duração negativa (prefixa a string com “-”)',
    years: 'Anos',
    months: 'Meses',
    weeks: 'Semanas',
    days: 'Dias',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    generatedIso: 'String ISO gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    zeroDuration: 'Duração zero (tudo zerado gera PT0S).',
    refTitle: 'Durações comuns no formato ISO 8601',
    refNotes: () =>
      `Totais em segundos considerando 1 ano = ${YEAR_DAYS} dias e 1 mês = ${MONTH_DAYS} dias.`,
    tableDuration: 'Descrição',
    tableIso: 'String ISO',
    tableSeconds: 'Segundos',
    source: 'Código-fonte do motor',
    parseUnits: [
      ['ano', 'anos'],
      ['mês', 'meses'],
      ['semana', 'semanas'],
      ['dia', 'dias'],
      ['hora', 'horas'],
      ['minuto', 'minutos'],
      ['segundo', 'segundos'],
    ],
    buildUnits: [
      ['ano', 'anos'],
      ['mês', 'meses'],
      ['semana', 'semanas'],
      ['dia', 'dias'],
      ['hora', 'horas'],
      ['minuto', 'minutos'],
      ['segundo', 'segundos'],
    ],
  },
  en: {
    title: 'ISO 8601 Duration Converter',
    intro: (
      <>
        Convert between the ISO 8601 duration format{' '}
        <Text code>PnYnMnDTnHnMnS</Text> and totals in seconds/minutes/hours/days,
        100% in the browser. Parse or build the ISO string, see the unit-by-unit
        breakdown and a plain-text description. Nothing leaves the browser.
      </>
    ),
    convention: (
      <>
        <Text strong>Conversion notes:</Text> fractional values are only valid on
        the smallest unit present (e.g. <Text code>PT1.5H</Text> = 1h30min) and
        weeks (<Text code>PnW</Text>) can only appear alone — the tool still
        parses these variations but flags a warning. To get the total duration in
        seconds it assumes <Text strong>1 year = {YEAR_DAYS} days</Text> and{' '}
        <Text strong>1 month = {MONTH_DAYS} days</Text> (a common calendar-tool
        convention).
      </>
    ),
    mode: 'Mode',
    modeParse: 'Decode',
    modeBuild: 'Build',
    modeRef: 'Quick reference',
    parseInput: 'ISO 8601 string',
    parsePlaceholder: 'e.g. P1Y2M3DT4H5M6S',
    parsePresets: 'Examples',
    parseValid: 'Valid duration',
    parseEmpty: 'Type a duration string (e.g. P1DT12H).',
    parseInvalid: 'Invalid string. Expected format: P[nY][nM][nW][nD][T[nH][nM][nS]]',
    parsedHuman: 'In words',
    parsedTotal: 'Total (seconds)',
    weekMixWarn: (
      <>
        <Text code>PnW</Text> (weeks) is only valid on its own in ISO 8601 — here
        it is mixed with other units.
      </>
    ),
    fractionWarn: (
      <>
        The decimal fraction must be on the <Text strong>smallest unit
        present</Text> (e.g. <Text code>PT1H30M</Text> instead of{' '}
        <Text code>P0.0625D</Text>).
      </>
    ),
    weeksToDaysWarn: 'Weeks mixed with other units are not valid ISO — converting week(s) into days.',
    breakdown: 'Unit breakdown',
    totalInHours: 'Hours',
    totalInDays: 'Days',
    totalInMinutes: 'Minutes',
    totalInWeeks: 'Weeks',
    buildTitle: 'Build an ISO string from parts',
    buildHint: 'Fill in the parts you want; the ISO string is generated live.',
    negativeHint: 'Negative duration (prefixes the string with “-”)',
    years: 'Years',
    months: 'Months',
    weeks: 'Weeks',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    generatedIso: 'Generated ISO string',
    copy: 'Copy',
    copied: 'Copied!',
    zeroDuration: 'Zero duration (all zero generates PT0S).',
    refTitle: 'Common durations in ISO 8601',
    refNotes: () =>
      `Totals assume 1 year = ${YEAR_DAYS} days and 1 month = ${MONTH_DAYS} days.`,
    tableDuration: 'Description',
    tableIso: 'ISO string',
    tableSeconds: 'Seconds',
    source: 'Engine source code',
    parseUnits: [
      ['year', 'years'],
      ['month', 'months'],
      ['week', 'weeks'],
      ['day', 'days'],
      ['hour', 'hours'],
      ['minute', 'minutes'],
      ['second', 'seconds'],
    ],
    buildUnits: [
      ['year', 'years'],
      ['month', 'months'],
      ['week', 'weeks'],
      ['day', 'days'],
      ['hour', 'hours'],
      ['minute', 'minutes'],
      ['second', 'seconds'],
    ],
  },
}

const componentKeys = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']

const parsePresets = [
  { key: 'PT1H30M', value: 'PT1H30M' },
  { key: 'P1W', value: 'P1W' },
  { key: 'P2DT12H', value: 'P2DT12H' },
  { key: 'PT90M', value: 'PT90M' },
  { key: 'PT1.5H', value: 'PT1.5H' },
  { key: 'P1Y2M', value: 'P1Y2M' },
  { key: 'P-1D', value: 'P-1D' },
  { key: 'P1W2D', value: 'P1W2D' },
]

function fmt(n) {
  return String(cleanNumber(n))
}

export default function Iso8601DurationPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('parse')
  const [parseInput, setParseInput] = useState('P1DT12H')
  const [parts, setParts] = useState({ years: 0, months: 0, weeks: 0, days: 1, hours: 12, minutes: 0, seconds: 0 })
  const [negative, setNegative] = useState(false)

  const parsed = useMemo(() => parseDuration(parseInput), [parseInput])

  const buildParts = useMemo(
    () => ({ ...parts, negative }),
    [parts, negative]
  )
  const built = useMemo(() => buildDuration(buildParts), [buildParts])

  const builtParsed = useMemo(() => parseDuration(built.iso), [built.iso])

  const refTableData = useMemo(
    () =>
      COMMON_DURATIONS.map((d, i) => ({
        key: i,
        duration: d.label,
        iso: d.iso,
        seconds: fmt(d.seconds),
      })),
    []
  )

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const units = t.parseUnits
  const described = parsed.ok ? describeParts(parsed.parts, units, parsed.sign) : ''
  const builtDescribed = builtParsed.ok ? describeParts(builtParsed.parts, units, builtParsed.sign) : ''
  const totals = parsed.ok ? breakdownTotal(parsed.totalSeconds) : null

  const refColumns = [
    { title: t.tableDuration, dataIndex: 'duration', key: 'duration' },
    { title: t.tableIso, dataIndex: 'iso', key: 'iso', render: (v) => <Text code>{v}</Text> },
    { title: t.tableSeconds, dataIndex: 'seconds', key: 'seconds' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ClockCircleOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>
      <Alert message={t.convention} type="info" showIcon />

      <Card title={t.mode}>
        <Segmented
          block
          value={mode}
          onChange={setMode}
          options={[
            { label: t.modeParse, value: 'parse' },
            { label: t.modeBuild, value: 'build' },
            { label: t.modeRef, value: 'ref' },
          ]}
        />
      </Card>

      {mode === 'parse' && (
        <>
          <Card title={t.parseInput}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
                placeholder={t.parsePlaceholder}
                style={{ fontFamily: 'monospace' }}
              />
              <Space wrap>
                <Text type="secondary">{t.parsePresets}</Text>
                {parsePresets.map((p) => (
                  <Button key={p.key} size="small" onClick={() => setParseInput(p.value)}>
                    <Text code>{p.value}</Text>
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>

          {!parsed.ok ? (
            <Alert
              type="error"
              showIcon
              message={parseInput.trim() ? t.parseInvalid : t.parseEmpty}
            />
          ) : (
            <Card title={t.parseValid} extra={<Tag color="green">ISO 8601</Tag>}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {parsed.warning === 'weekMix' && <Alert type="warning" message={t.weekMixWarn} showIcon />}
                {parsed.warning === 'fractionNotSmallest' && <Alert type="warning" message={t.fractionWarn} showIcon />}

                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label={t.parsedHuman}>
                    <Text strong>{described}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t.breakdown}>
                    <Space wrap size={[4, 4]}>
                      {componentKeys.map((k) => {
                        const idx = componentKeys.indexOf(k)
                        return (
                          <Tag key={k} color={parsed.parts[k] > 0 ? 'blue' : 'default'}>
                            {cleanNumber(parsed.parts[k])} {units[idx][cleanNumber(parsed.parts[k]) === 1 ? 0 : 1]}
                          </Tag>
                        )
                      })}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>

                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Card size="small">
                      <Statistic title={t.parsedTotal} value={fmt(totals.seconds)} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small">
                      <Statistic title={t.totalInMinutes} value={fmt(totals.minutes)} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small">
                      <Statistic title={t.totalInHours} value={fmt(totals.hours)} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small">
                      <Statistic title={t.totalInDays} value={fmt(totals.days)} />
                    </Card>
                  </Col>
                </Row>
              </Space>
            </Card>
          )}
        </>
      )}

      {mode === 'build' && (
        <Card title={t.buildTitle}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph type="secondary">{t.buildHint}</Paragraph>
            <Row gutter={[16, 16]}>
              {componentKeys.map((k) => {
                const i = componentKeys.indexOf(k)
                return (
                  <Col xs={12} sm={6} md={4} key={k}>
                    <Text strong>{t[k]}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={parts[k]}
                      min={0}
                      onChange={(v) => setParts((p) => ({ ...p, [k]: v ?? 0 }))}
                    />
                  </Col>
                )
              })}
            </Row>
            <Space>
              <Switch checked={negative} onChange={setNegative} />
              <Text type="secondary">{t.negativeHint}</Text>
            </Space>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t.generatedIso}>
                <Space>
                  <Text code strong style={{ fontSize: 15 }}>
                    {built.iso}
                  </Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(built.iso)}
                  >
                    {t.copy}
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t.parsedHuman}>{builtDescribed}</Descriptions.Item>
              <Descriptions.Item label={`${t.parsedTotal} (365/30)`}>{fmt(builtParsed.totalSeconds)}</Descriptions.Item>
            </Descriptions>

            {built.warning === 'weeksToDays' && (
              <Alert type="warning" message={t.weeksToDaysWarn} showIcon />
            )}
            {built.iso === 'PT0S' && (
              <Alert type="info" message={t.zeroDuration} showIcon />
            )}
          </Space>
        </Card>
      )}

      {mode === 'ref' && (
        <Card title={t.refTitle}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph type="secondary">{t.refNotes()}</Paragraph>
            <Table
              size="small"
              columns={refColumns}
              dataSource={refTableData}
              pagination={false}
            />
          </Space>
        </Card>
      )}

      <Collapse
        items={[
          {
            key: 'source',
            label: t.source,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{getEngineSource()}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}