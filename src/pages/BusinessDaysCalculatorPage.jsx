import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Segmented,
  Input,
  InputNumber,
  Checkbox,
  Button,
  Alert,
  Statistic,
  Row,
  Col,
  Progress,
  Tag,
  Descriptions,
  Collapse,
  message,
} from 'antd'
import {
  CalendarOutlined,
  CopyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  BR_HOLIDAYS_2025,
  BR_HOLIDAYS_2026,
  addDaysIso,
  addWorkingDays,
  countWorkingDays,
  getEngineSource,
  isoWeekday,
  parseHolidays,
  todayIso,
} from '../utils/businessDaysCalculator'

const { Title, Paragraph, Text } = Typography

const DAY_FULL_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const DAY_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const translations = {
  pt: {
    title: 'Calculadora de Dias Úteis',
    intro: (
      <>
        Conta <Text strong>dias úteis entre duas datas</Text> ou calcula uma data
        destino somando/subtraindo <Text strong>N dias úteis</Text>, descontando fins de
        semana configuráveis e feriados (lista editável, com presets dos feriados
        nacionais do Brasil). Tudo roda no navegador.
      </>
    ),
    convention: (
      <>
        <Text strong>Convenção:</Text> ao somar N dias úteis, a data de início{' '}
        <Text strong>não</Text> é contada — somar 1 dia útil em uma sexta-feira (sem
        feriados) resulta na segunda-feira seguinte.
      </>
    ),
    presets: 'Cenários rápidos',
    sprint: 'Sprint de 2 semanas (10 dias úteis)',
    deadline: 'Prazo de 21 dias úteis',
    juneRelease: 'Release em junho/2026 (com Corpus Christi)',
    novemberRelease: 'Dezembro antes do Natal? (nov/2026)',
    mode: 'Modo',
    modeCount: 'Contar dias úteis entre datas',
    modeAdd: 'Adicionar / subtrair dias úteis',
    start: 'Data inicial',
    end: 'Data final',
    base: 'Data de início',
    direction: 'Direção',
    add: 'Adicionar',
    subtract: 'Subtrair',
    workingDays: 'Dias úteis',
    directionHint: 'Quantos dias úteis a somar ou subtrair a partir da data de início.',
    resultsCount: 'Resultado da contagem',
    resultsAdd: 'Data destino',
    totalDays: 'Total de dias',
    weekendDays: 'Fins de semana',
    holidayDays: 'Feriados no intervalo',
    workingRatio: 'Dias úteis vs total',
    invertedTag: 'Data inicial maior que a final — a contagem foi feita no intervalo invertido',
    ifNotWorking: 'Dia não útil (fim de semana ou feriado)',
    weekendConfig: 'Fins de semana',
    weekendConfigHint: 'Selecione os dias da semana que devem ser tratados como folga. Deixe pelo menos um dia útil.',
    allWeekendWarn: 'Todos os 7 dias estão marcados como fim de semana — não sobra nenhum dia útil.',
    holidays: 'Feriados (uma data por linha, YYYY-MM-DD)',
    holidaysHint: 'Feriados dentro do intervalo não contam como dias úteis. Preencha manualmente ou use os presets.',
    holidaysPreset2026: 'Feriados BR 2026',
    holidaysPreset2025: 'Feriados BR 2025',
    holidaysClear: 'Limpar',
    holidaysValidSummary: (v, total) => `${v} linha(s) válida(s) de ${total} total(is)`,
    invalidLines: (n) => `${n} linha(s) inválida(s) ignorada(s):`,
    output: 'Relatório (copiar)',
    copy: 'Copiar relatório',
    copied: 'Copiado!',
    source: 'Código-fonte do motor',
    selectDates: 'Selecione as duas datas para calcular.',
    holidayListLabel: 'Feriados',
    none: '(nenhum)',
  },
  en: {
    title: 'Business Days Calculator',
    intro: (
      <>
        Count <Text strong>working days between two dates</Text> or compute a target
        date by adding/subtracting <Text strong>N working days</Text>, discounting
        configurable weekends and holidays (editable list, with Brazilian national
        holiday presets). Everything runs in the browser.
      </>
    ),
    convention: (
      <>
        <Text strong>Convention:</Text> when adding N working days, the start date is{' '}
        <Text strong>not</Text> counted — adding 1 working day to a Friday (no
        holidays) lands on the following Monday.
      </>
    ),
    presets: 'Quick scenarios',
    sprint: '2-week sprint (10 working days)',
    deadline: '21-working-day deadline',
    juneRelease: 'June/2026 release (Corpus Christi on the way)',
    novemberRelease: 'Before Christmas? (Nov/2026)',
    mode: 'Mode',
    modeCount: 'Count working days between dates',
    modeAdd: 'Add / subtract working days',
    start: 'Start date',
    end: 'End date',
    base: 'Start date',
    direction: 'Direction',
    add: 'Add',
    subtract: 'Subtract',
    workingDays: 'Working days',
    directionHint: 'How many working days to add or subtract from the start date.',
    resultsCount: 'Count results',
    resultsAdd: 'Target date',
    totalDays: 'Total days',
    weekendDays: 'Weekend days',
    holidayDays: 'Holidays in range',
    workingRatio: 'Working days vs total',
    invertedTag: 'Start date is after end date — counted over the inverted range',
    ifNotWorking: 'Not a working day (weekend or holiday)',
    weekendConfig: 'Weekends',
    weekendConfigHint: 'Select the weekdays that should count as rest days. Keep at least one working day.',
    allWeekendWarn: 'All 7 days are marked as weekends — no working day is left.',
    holidays: 'Holidays (one date per line, YYYY-MM-DD)',
    holidaysHint: 'Holidays inside the range do not count as working days. Fill manually or use the presets.',
    holidaysPreset2026: 'BR Holidays 2026',
    holidaysPreset2025: 'BR Holidays 2025',
    holidaysClear: 'Clear',
    holidaysValidSummary: (v, total) => `${v} valid line(s) of ${total} total`,
    invalidLines: (n) => `${n} invalid line(s) ignored:`,
    output: 'Report (copy)',
    copy: 'Copy report',
    copied: 'Copied!',
    source: 'Engine source code',
    selectDates: 'Pick both dates to calculate.',
    holidayListLabel: 'Holidays',
    none: '(none)',
  },
}

const DAY_FULL = (lang) => (lang === 'pt' ? DAY_FULL_PT : DAY_FULL_EN)
const DAY_SHORT = (lang) => (lang === 'pt' ? DAY_SHORT_PT : DAY_SHORT_EN)

function isIso(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '')
}

function dateLabel(iso, lang) {
  if (!isIso(iso)) return iso || '—'
  return `${iso} (${DAY_FULL(lang)[isoWeekday(iso)]})`
}

export default function BusinessDaysCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('count')
  const [start, setStart] = useState(todayIso)
  const [end, setEnd] = useState(() => addDaysIso(todayIso(), 6))
  const [base, setBase] = useState(todayIso)
  const [direction, setDirection] = useState('add')
  const [count, setCount] = useState(10)
  const [weekend, setWeekend] = useState([0, 6])
  const [holidaysText, setHolidaysText] = useState('')

  const { valid: holidayList, invalid: invalidLines } = useMemo(
    () => parseHolidays(holidaysText),
    [holidaysText]
  )
  const holidaysSet = useMemo(() => new Set(holidayList), [holidayList])

  function isWorking(iso, wknd, holSet) {
    if (wknd.includes(isoWeekday(iso))) return false
    if (holSet.has(iso)) return false
    return true
  }

  const startValid = isIso(start)
  const endValid = isIso(end)
  const baseValid = isIso(base)
  const allWeekend = weekend.length === 7

  const countResult = useMemo(
    () =>
      startValid && endValid && !allWeekend
        ? countWorkingDays(start, end, weekend, holidaysSet)
        : null,
    [start, end, weekend, holidaysSet, startValid, endValid, allWeekend]
  )

  const addResult = useMemo(() => {
    if (!baseValid || !isIso(base) || allWeekend) {
      return null
    }
    const n = direction === 'subtract' ? -count : count
    const iso = addWorkingDays(base, n, weekend, holidaysSet)
    return {
      iso,
      nonWorking: !isWorking(iso, weekend, holidaysSet),
    }
  }, [base, count, direction, weekend, holidaysSet, baseValid, allWeekend, lang])

  const scenarios = [
    { key: 'sprint', name: t.sprint, mode: 'add', base: todayIso(), direction: 'add', count: 10 },
    { key: 'deadline', name: t.deadline, mode: 'add', base: todayIso(), direction: 'add', count: 21 },
    {
      key: 'juneRelease',
      name: t.juneRelease,
      mode: 'count',
      start: '2026-06-01',
      end: '2026-06-30',
      holidaysPreset: BR_HOLIDAYS_2026.join('\n'),
    },
    {
      key: 'novemberRelease',
      name: t.novemberRelease,
      mode: 'count',
      start: '2026-11-16',
      end: '2026-11-30',
      holidaysPreset: BR_HOLIDAYS_2026.join('\n'),
    },
  ]

  function applyScenario(scenario) {
    setMode(scenario.mode)
    if (scenario.start) setStart(scenario.start)
    if (scenario.end) setEnd(scenario.end)
    if (scenario.base) setBase(scenario.base)
    if (scenario.direction) setDirection(scenario.direction)
    if (scenario.count !== undefined) setCount(scenario.count)
    if (scenario.holidaysPreset) setHolidaysText(scenario.holidaysPreset)
  }

  const report = useMemo(() => {
    const lines = [`# ${t.title}`]
    if (mode === 'count' && countResult) {
      lines.push(`- ${t.start}: ${dateLabel(start, lang)}`)
      lines.push(`- ${t.end}: ${dateLabel(end, lang)}`)
      lines.push(`- ${t.totalDays}: ${countResult.total}`)
      lines.push(`- ${t.workingDays}: ${countResult.working}`)
      lines.push(`- ${t.weekendDays}: ${countResult.weekendDays}`)
      lines.push(`- ${t.holidayDays}: ${countResult.holidaysInRange}`)
      lines.push(`- ${t.weekendConfig}: [${weekend.map((d) => DAY_SHORT(lang)[d]).join(', ')}]`)
      lines.push(`- ${t.holidayListLabel}: ${holidayList.length ? holidayList.join(', ') : t.none}`)
    } else if (mode === 'add' && addResult && isIso(addResult.iso)) {
      lines.push(`- ${t.base}: ${dateLabel(base, lang)}`)
      lines.push(`- ${direction === 'subtract' ? t.subtract : t.add}: ${count} ${t.workingDays}`)
      lines.push(`- ${t.resultsAdd}: ${dateLabel(addResult.iso, lang)}`)
      lines.push(`- ${t.weekendConfig}: [${weekend.map((d) => DAY_SHORT(lang)[d]).join(', ')}]`)
      lines.push(`- ${t.holidayListLabel}: ${holidayList.length ? holidayList.join(', ') : t.none}`)
    }
    return lines.join('\n')
  }, [mode, countResult, addResult, start, end, base, direction, count, weekend, holidayList, t, lang])

  function handleCopy() {
    navigator.clipboard.writeText(report)
    message.success(t.copied)
  }

  const workingPercent = countResult
    ? Math.round((countResult.working / countResult.total) * 100)
    : 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CalendarOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>
      <Alert message={t.convention} type="info" showIcon />

      <Card title={t.presets}>
        <Space wrap>
          {scenarios.map((s) => (
            <Button key={s.key} icon={<ThunderboltOutlined />} onClick={() => applyScenario(s)}>
              {s.name}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title={t.mode}>
        <Segmented
          block
          value={mode}
          onChange={setMode}
          options={[
            { label: t.modeCount, value: 'count' },
            { label: t.modeAdd, value: 'add' },
          ]}
        />
      </Card>

      {mode === 'count' ? (
        <Card title={t.resultsCount}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Text strong>{t.start}</Text>
                <Input type="date" value={start || ''} onChange={(e) => setStart(e.target.value)} />
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>{t.end}</Text>
                <Input type="date" value={end || ''} onChange={(e) => setEnd(e.target.value)} />
              </Col>
            </Row>

            {!startValid || !endValid ? (
              <Alert type="warning" message={t.selectDates} showIcon />
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {countResult.inverted && <Tag color="orange">{t.invertedTag}</Tag>}
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Card size="small"><Statistic title={t.totalDays} value={countResult.total} /></Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small"><Statistic title={t.workingDays} value={countResult.working} /></Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small"><Statistic title={t.weekendDays} value={countResult.weekendDays} /></Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small"><Statistic title={t.holidayDays} value={countResult.holidaysInRange} /></Card>
                  </Col>
                </Row>
                <div>
                  <Text type="secondary">{t.workingRatio}</Text>
                  <Progress percent={workingPercent} />
                </div>
              </Space>
            )}
          </Space>
        </Card>
      ) : (
        <Card title={t.resultsAdd}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={8}>
                <Text strong>{t.base}</Text>
                <Input type="date" value={base || ''} onChange={(e) => setBase(e.target.value)} />
              </Col>
              <Col xs={24} sm={8}>
                <Text strong>{t.direction}</Text>
                <Segmented
                  block
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { label: `+ ${t.add}`, value: 'add' },
                    { label: `− ${t.subtract}`, value: 'subtract' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text strong>{t.workingDays}</Text>
                <InputNumber
                  min={0}
                  max={10000}
                  style={{ width: '100%' }}
                  value={count}
                  onChange={(v) => setCount(v ?? 0)}
                />
                <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                  {t.directionHint}
                </Paragraph>
              </Col>
            </Row>

            {!baseValid ? (
              <Alert type="warning" message={t.selectDates} showIcon />
            ) : addResult && isIso(addResult.iso) ? (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label={t.resultsAdd}>
                  <Space>
                    <Text strong style={{ fontSize: 18 }}>{dateLabel(addResult.iso, lang)}</Text>
                    {addResult.nonWorking && <Tag color="volcano">{t.ifNotWorking}</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t.weekendConfig}>
                  {weekend.map((d) => DAY_SHORT(lang)[d]).join(', ') || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t.holidayDays}>
                  {holidayList.length ? holidayList.join(', ') : '—'}
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Space>
        </Card>
      )}

      <Card title={t.weekendConfig}>
        <Paragraph type="secondary">{t.weekendConfigHint}</Paragraph>
        <Checkbox.Group value={weekend} onChange={(values) => setWeekend([...values].sort((a, b) => a - b))}>
          <Space wrap>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <Checkbox key={d} value={d}>
                {DAY_SHORT(lang)[d]}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
        {allWeekend && (
          <Alert style={{ marginTop: 12 }} type="warning" message={t.allWeekendWarn} showIcon />
        )}
      </Card>

      <Card title={t.holidays}>
        <Paragraph type="secondary">{t.holidaysHint}</Paragraph>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button size="small" onClick={() => setHolidaysText(BR_HOLIDAYS_2026.join('\n'))}>
            {t.holidaysPreset2026}
          </Button>
          <Button size="small" onClick={() => setHolidaysText(BR_HOLIDAYS_2025.join('\n'))}>
            {t.holidaysPreset2025}
          </Button>
          <Button size="small" danger onClick={() => setHolidaysText('')}>
            {t.holidaysClear}
          </Button>
        </Space>
        <Input.TextArea
          rows={5}
          placeholder={'YYYY-MM-DD\nYYYY-MM-DD'}
          value={holidaysText}
          onChange={(e) => setHolidaysText(e.target.value)}
        />
        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
          {t.holidaysValidSummary(holidayList.length, holidayList.length + invalidLines.length)}
        </Paragraph>
        {invalidLines.length > 0 && (
          <Alert
            type="warning"
            message={t.invalidLines(invalidLines.length)}
            description={<code>{invalidLines.join(' · ')}</code>}
            showIcon
          />
        )}
      </Card>

      <Card title={t.output} extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}>
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
          <code>{report}</code>
        </pre>
      </Card>

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