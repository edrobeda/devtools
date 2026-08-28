import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Tabs, Space, Input, InputNumber, Select, Switch, Segmented,
  Row, Col, Tag, Alert, Button, AutoComplete, Divider, Collapse,
} from 'antd'
import {
  GlobalOutlined, CopyOutlined, CheckOutlined, NumberOutlined,
  ClockCircleOutlined, FormatPainterOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Catálogos fixos (BCP-47, moedas, unidades, fusos, etc.) ────────────────
const LOCALES = [
  'en-US', 'pt-BR', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'ja-JP',
  'zh-CN', 'ko-KR', 'ru-RU', 'ar-SA', 'hi-IN', 'tr-TR', 'nl-NL', 'sv-SE',
  'pl-PL', 'da-DK', 'fi-FI', 'nb-NO', 'cs-CZ', 'th-TH', 'vi-VN', 'id-ID',
  'uk-UA', 'he-IL', 'fa-IR', 'el-GR', 'ro-RO', 'hu-HU', 'ca-ES', 'en-IN',
]
const DEFAULT_LOCALES = ['en-US', 'pt-BR', 'de-DE', 'ja-JP', 'fr-FR', 'ar-SA']

const CURRENCIES = [
  'USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CNY', 'INR', 'CHF', 'CAD', 'AUD',
  'RUB', 'KRW', 'AED', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY', 'SGD',
  'HKD', 'NZD', 'ZAR', 'CLP', 'ARS', 'COP', 'PEN', 'UYU', 'BOB', 'PYG',
]
const UNITS = [
  'kilometer', 'meter', 'centimeter', 'mile', 'yard', 'foot', 'inch',
  'kilogram', 'gram', 'pound', 'ounce', 'celsius', 'fahrenheit', 'percent',
  'liter', 'milliliter', 'gallon', 'byte', 'kilobyte', 'megabyte',
  'gigabyte', 'terabyte', 'second', 'minute', 'hour', 'day', 'year',
]
const TIMEZONES = [
  'UTC', 'America/Sao_Paulo', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Toronto',
  'America/Mexico_City', 'America/Buenos_Aires', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland', 'Africa/Johannesburg',
]
const NUMSYS = [
  'latn', 'arab', 'arabext', 'beng', 'deva', 'gujr', 'guru', 'telu',
  'taml', 'thai', 'tibt', 'hanidec', 'fullwide', 'roman',
]
const CALENDARS = [
  'gregory', 'iso8601', 'buddhist', 'chinese', 'coptic', 'ethiopic',
  'hebrew', 'indian', 'islamic', 'japanese', 'persian', 'roc',
]

const NUM_STYLES = ['decimal', 'currency', 'percent', 'unit']
const CURRENCY_DISPLAY = ['symbol', 'narrowSymbol', 'code', 'name']
const NOTATIONS = ['standard', 'scientific', 'engineering', 'compact']
const COMPACT_DISPLAY = ['short', 'long']
const SIGN_DISPLAY = ['auto', 'always', 'exceptZero', 'negative', 'never']
const UNIT_DISPLAY = ['long', 'short', 'narrow']
const DATE_STYLES = ['full', 'long', 'medium', 'short']
const LENGTHS = ['narrow', 'short', 'long']
const NUM2 = ['numeric', '2-digit']
const MONTH_OPTS = ['narrow', 'short', 'long', '2-digit', 'numeric']
const TZ_NAMES = ['short', 'long', 'shortOffset', 'longOffset', 'shortGeneric', 'longGeneric']

const raw = (arr) => arr.map((v) => ({ label: v, value: v }))
const withUnset = (arr, unsetLabel, unsetVal = '') => [
  { label: unsetLabel, value: unsetVal },
  ...raw(arr),
]
const uniq = (arr) => Array.from(new Set(arr))

// ─── Construtores de options "limpos" (omitindo valores não-definidos) ──────
function cleanNumOptions(o) {
  const r = {}
  if (o.style !== 'decimal') r.style = o.style
  if (o.style === 'currency') {
    r.currency = o.currency
    if (o.currencyDisplay !== 'symbol') r.currencyDisplay = o.currencyDisplay
  }
  if (o.style === 'unit') {
    r.unit = o.unit
    if (o.unitDisplay !== 'short') r.unitDisplay = o.unitDisplay
  }
  if (o.notation !== 'standard') {
    r.notation = o.notation
    if (o.notation === 'compact' && o.compactDisplay !== 'short') {
      r.compactDisplay = o.compactDisplay
    }
  }
  if (o.useGrouping === false) r.useGrouping = false
  if (o.minimumFractionDigits != null) r.minimumFractionDigits = o.minimumFractionDigits
  if (o.maximumFractionDigits != null) r.maximumFractionDigits = o.maximumFractionDigits
  if (o.minimumSignificantDigits != null) r.minimumSignificantDigits = o.minimumSignificantDigits
  if (o.maximumSignificantDigits != null) r.maximumSignificantDigits = o.maximumSignificantDigits
  if (o.signDisplay !== 'auto') r.signDisplay = o.signDisplay
  return r
}

function cleanDtOptions(o) {
  const r = {}
  if (o.dateStyle) r.dateStyle = o.dateStyle
  if (o.timeStyle) r.timeStyle = o.timeStyle
  if (o.weekday) r.weekday = o.weekday
  if (o.era) r.era = o.era
  if (o.year) r.year = o.year
  if (o.month) r.month = o.month
  if (o.day) r.day = o.day
  if (o.hour) r.hour = o.hour
  if (o.minute) r.minute = o.minute
  if (o.second) r.second = o.second
  if (o.timeZoneName) r.timeZoneName = o.timeZoneName
  if (o.hour12 != null) r.hour12 = o.hour12
  if (o.timeZone) r.timeZone = o.timeZone
  if (o.numberingSystem) r.numberingSystem = o.numberingSystem
  if (o.calendar) r.calendar = o.calendar
  return r
}

const translations = {
  pt: {
    title: 'Playground de Intl (i18n)',
    intro:
      'Experimente Intl.NumberFormat e Intl.DateTimeFormat do JavaScript direto no navegador. Ajuste as opções, compare o resultado em vários locales ao mesmo tempo e copie o código pronto — tudo client-side, nada sai daqui.',
    tabNumber: 'Número',
    tabDate: 'Data e Hora',
    valueLabel: 'Valor',
    valuePlaceholder: 'Ex.: 1234567.89',
    valueInvalid: 'Número inválido — usando 0 para a pré-visualização.',
    valueHintInt: 'Inteiros grandes são formatados como BigInt.',
    localesLabel: 'Locales',
    localesHelp: 'Selecione ou digite tags BCP-47 (ex.: en-US, pt-BR, de-DE).',
    optionsTitle: 'Opções',
    outputTitle: 'Saída',
    codeTitle: 'Código gerado',
    refLocale: 'Locale de referência',
    comparisonTitle: 'Comparação entre locales',
    comparisonEmpty: 'Selecione ao menos um locale acima.',
    colLocale: 'Locale',
    copy: 'Copiar',
    copied: 'Copiado!',
    unset: '—',
    systemDefault: 'Padrão do sistema',
    dateValueLabel: 'Data (ISO 8601)',
    dateInvalid: 'Data inválida.',
    presets: 'Exemplos',
    presetNow: 'Agora',
    presetEpoch: 'Epoch (1970)',
    presetY2K: '2000-01-01',
    presetSample: 'Exemplo',
    styleNote: 'Com dateStyle ou timeStyle definidos, os campos individuais são ignorados pelo Intl.',
    fStyle: 'Estilo',
    fCurrency: 'Moeda',
    fCurrencyDisplay: 'Exibição da moeda',
    fNotation: 'Notação',
    fCompactDisplay: 'Compacto',
    fUseGrouping: 'Agrupar milhares',
    fMinFraction: 'Casas decimais mín.',
    fMaxFraction: 'Casas decimais máx.',
    fMinSignificant: 'Dígitos sig. mín.',
    fMaxSignificant: 'Dígitos sig. máx.',
    fSignDisplay: 'Sinal',
    fUnit: 'Unidade',
    fUnitDisplay: 'Exibição da unidade',
    fDateStyle: 'Estilo de data',
    fTimeStyle: 'Estilo de hora',
    fWeekday: 'Dia da semana',
    fEra: 'Era',
    fYear: 'Ano',
    fMonth: 'Mês',
    fDay: 'Dia',
    fHour: 'Hora',
    fMinute: 'Minuto',
    fSecond: 'Segundo',
    fTimeZoneName: 'Nome do fuso',
    fHour12: 'Relógio',
    fTimeZone: 'Fuso horário (IANA)',
    fNumberingSystem: 'Sistema numérico',
    fCalendar: 'Calendário',
    sourceTitle: 'Por baixo dos panos',
    sourceBody:
      'Tudo usa as APIs nativas Intl do navegador, sem bibliotecas. O mesmo número vira "R$ 1.234.567,89" em pt-BR, "1,234,567.89" em en-US, "١٬٢٣٤٬٥٦٧٫٨٩" em ar-SA — só mudando o locale. Dica: Intl.NumberFormat aceita BigInt (úteis para valores monetários sem perda de precisão), e Intl.DateTimeFormat entende calendars e numberingSystem não-latino quando o ICU do navegador suporta.',
  },
  en: {
    title: 'Intl Playground (i18n)',
    intro:
      'Experiment with JavaScript Intl.NumberFormat and Intl.DateTimeFormat right in the browser. Tweak the options, compare the output across several locales at once and copy the generated code — fully client-side, nothing leaves your machine.',
    tabNumber: 'Number',
    tabDate: 'Date & Time',
    valueLabel: 'Value',
    valuePlaceholder: 'e.g. 1234567.89',
    valueInvalid: 'Invalid number — using 0 for the preview.',
    valueHintInt: 'Large integers are formatted as BigInt.',
    localesLabel: 'Locales',
    localesHelp: 'Select or type BCP-47 tags (e.g. en-US, pt-BR, de-DE).',
    optionsTitle: 'Options',
    outputTitle: 'Output',
    codeTitle: 'Generated code',
    refLocale: 'Reference locale',
    comparisonTitle: 'Comparison across locales',
    comparisonEmpty: 'Select at least one locale above.',
    colLocale: 'Locale',
    copy: 'Copy',
    copied: 'Copied!',
    unset: '—',
    systemDefault: 'System default',
    dateValueLabel: 'Date (ISO 8601)',
    dateInvalid: 'Invalid date.',
    presets: 'Presets',
    presetNow: 'Now',
    presetEpoch: 'Epoch (1970)',
    presetY2K: '2000-01-01',
    presetSample: 'Sample',
    styleNote: 'With dateStyle or timeStyle set, individual fields are ignored by Intl.',
    fStyle: 'Style',
    fCurrency: 'Currency',
    fCurrencyDisplay: 'Currency display',
    fNotation: 'Notation',
    fCompactDisplay: 'Compact display',
    fUseGrouping: 'Group thousands',
    fMinFraction: 'Min fraction digits',
    fMaxFraction: 'Max fraction digits',
    fMinSignificant: 'Min sig. digits',
    fMaxSignificant: 'Max sig. digits',
    fSignDisplay: 'Sign display',
    fUnit: 'Unit',
    fUnitDisplay: 'Unit display',
    fDateStyle: 'Date style',
    fTimeStyle: 'Time style',
    fWeekday: 'Weekday',
    fEra: 'Era',
    fYear: 'Year',
    fMonth: 'Month',
    fDay: 'Day',
    fHour: 'Hour',
    fMinute: 'Minute',
    fSecond: 'Second',
    fTimeZoneName: 'Time zone name',
    fHour12: 'Clock',
    fTimeZone: 'Time zone (IANA)',
    fNumberingSystem: 'Numbering system',
    fCalendar: 'Calendar',
    sourceTitle: 'Under the hood',
    sourceBody:
      'Everything uses the browser native Intl APIs, no libraries. The same number becomes "$1,234,567.89" in en-US, "1.234.567,89 €" in de-DE, "١٬٢٣٤٬٥٦٧٫٨٩" in ar-SA — only the locale changes. Tip: Intl.NumberFormat accepts BigInt (handy for monetary values without precision loss), and Intl.DateTimeFormat understands non-Latin calendars and numberingSystem when the browser ICU supports them.',
  },
}

function CopyBtn({ text, t }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="small"
      type="text"
      icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          setCopied(false)
        }
      }}
    >
      {copied ? t.copied : t.copy}
    </Button>
  )
}

function FieldLabel({ children }) {
  return (
    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
      {children}
    </Text>
  )
}

export default function IntlPlaygroundPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [selectedLocales, setSelectedLocales] = useState(DEFAULT_LOCALES)

  // ─── Estado da aba Número ──────────────────────────────────────────────
  const [numValue, setNumValue] = useState('1234567.89')
  const [num, setNum] = useState({
    style: 'decimal',
    currency: 'USD',
    currencyDisplay: 'symbol',
    unit: 'kilometer',
    unitDisplay: 'short',
    notation: 'standard',
    compactDisplay: 'short',
    useGrouping: true,
    minimumFractionDigits: null,
    maximumFractionDigits: null,
    minimumSignificantDigits: null,
    maximumSignificantDigits: null,
    signDisplay: 'auto',
  })
  const setNumOpt = (key) => (v) => setNum((prev) => ({ ...prev, [key]: v }))

  const parsedNum = useMemo(() => {
    const s = numValue.trim()
    if (!s) return { value: 0, ok: true }
    if (/^-?\d+$/.test(s)) return { value: BigInt(s), ok: true }
    const n = Number(s)
    if (Number.isNaN(n)) return { value: 0, ok: false }
    return { value: n, ok: true }
  }, [numValue])

  const primaryLocale = selectedLocales[0] || 'pt-BR'

  const numPrimary = useMemo(() => {
    try {
      return { output: new Intl.NumberFormat(primaryLocale, cleanNumOptions(num)).format(parsedNum.value), error: null }
    } catch (e) {
      return { output: '', error: e.message }
    }
  }, [primaryLocale, num, parsedNum])

  const numResults = useMemo(() => {
    const opts = cleanNumOptions(num)
    return uniq(selectedLocales).map((loc) => {
      try {
        return { locale: loc, output: new Intl.NumberFormat(loc, opts).format(parsedNum.value), error: null }
      } catch (e) {
        return { locale: loc, output: '', error: e.message }
      }
    })
  }, [selectedLocales, num, parsedNum])

  const numCode = useMemo(() => {
    const opts = cleanNumOptions(num)
    const optsStr = JSON.stringify(opts, null, 2)
    const valLit = typeof parsedNum.value === 'bigint' ? `${parsedNum.value.toString()}n` : String(parsedNum.value)
    return `new Intl.NumberFormat(${JSON.stringify(primaryLocale)}, ${optsStr})\n  .format(${valLit})`
  }, [primaryLocale, num, parsedNum])

  // ─── Estado da aba Data ─────────────────────────────────────────────────
  const [dtValue, setDtValue] = useState('2024-06-15T14:30:00Z')
  const [dt, setDt] = useState({
    dateStyle: '',
    timeStyle: '',
    weekday: '',
    era: '',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '',
    timeZoneName: '',
    hour12: null,
    timeZone: '',
    numberingSystem: '',
    calendar: '',
  })
  const setDtOpt = (key) => (v) => setDt((prev) => ({ ...prev, [key]: v }))

  const parsedDate = useMemo(() => {
    const d = new Date(dtValue)
    return { value: d, ok: !isNaN(d.getTime()) }
  }, [dtValue])

  const datePrimary = useMemo(() => {
    if (!parsedDate.ok) return { output: '', error: t.dateInvalid }
    try {
      return { output: new Intl.DateTimeFormat(primaryLocale, cleanDtOptions(dt)).format(parsedDate.value), error: null }
    } catch (e) {
      return { output: '', error: e.message }
    }
  }, [primaryLocale, dt, parsedDate, t])

  const dateResults = useMemo(() => {
    if (!parsedDate.ok) return []
    const opts = cleanDtOptions(dt)
    return uniq(selectedLocales).map((loc) => {
      try {
        return { locale: loc, output: new Intl.DateTimeFormat(loc, opts).format(parsedDate.value), error: null }
      } catch (e) {
        return { locale: loc, output: '', error: e.message }
      }
    })
  }, [selectedLocales, dt, parsedDate])

  const dateCode = useMemo(() => {
    const opts = cleanDtOptions(dt)
    const optsStr = JSON.stringify(opts, null, 2)
    return `new Intl.DateTimeFormat(${JSON.stringify(primaryLocale)}, ${optsStr})\n  .format(new Date(${JSON.stringify(dtValue)}))`
  }, [primaryLocale, dt, dtValue])

  const showStyleNote = !!(dt.dateStyle || dt.timeStyle)

  // ─── Render ─────────────────────────────────────────────────────────────
  const localeSelect = (
    <div>
      <FieldLabel>{t.localesLabel}</FieldLabel>
      <Select
        mode="tags"
        tokenSeparators={[',', ' ']}
        style={{ width: '100%' }}
        value={selectedLocales}
        onChange={(v) => setSelectedLocales(uniq(v))}
        options={raw(LOCALES)}
        placeholder="en-US, pt-BR, ..."
      />
      <Text type="secondary" style={{ fontSize: 12 }}>{t.localesHelp}</Text>
    </div>
  )

  const comparisonList = (results) => {
    if (results.length === 0) {
      return <Text type="secondary">{t.comparisonEmpty}</Text>
    }
    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {results.map((r) => (
          <div
            key={r.locale}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', border: '1px solid #f0f0f0', borderRadius: 6,
              background: '#fafafa',
            }}
          >
            <Tag color="blue" style={{ margin: 0, minWidth: 96, textAlign: 'center' }}>{r.locale}</Tag>
            {r.error ? (
              <Text type="danger" style={{ fontSize: 12 }}>{r.error}</Text>
            ) : (
              <Text code copyable={false} style={{ fontSize: 14, flex: 1, wordBreak: 'break-word' }}>
                {r.output}
              </Text>
            )}
            {!r.error && <CopyBtn text={r.output} t={t} />}
          </div>
        ))}
      </Space>
    )
  }

  const numberTab = {
    key: 'number',
    label: (<span><NumberOutlined /> {t.tabNumber}</span>),
    children: (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
              <FieldLabel>{t.valueLabel}</FieldLabel>
              <Input
                value={numValue}
                onChange={(e) => setNumValue(e.target.value)}
                placeholder={t.valuePlaceholder}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {!parsedNum.ok ? t.valueInvalid : t.valueHintInt}
              </Text>
            </Col>
            <Col xs={24} md={14}>{localeSelect}</Col>
          </Row>
        </Card>

        <Card title={t.optionsTitle}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fStyle}</FieldLabel>
              <Segmented block options={raw(NUM_STYLES)} value={num.style} onChange={setNumOpt('style')} />
            </Col>
            {num.style === 'currency' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <FieldLabel>{t.fCurrency}</FieldLabel>
                  <Select
                    showSearch style={{ width: '100%' }}
                    value={num.currency} onChange={setNumOpt('currency')}
                    options={raw(CURRENCIES)}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <FieldLabel>{t.fCurrencyDisplay}</FieldLabel>
                  <Segmented block options={raw(CURRENCY_DISPLAY)} value={num.currencyDisplay} onChange={setNumOpt('currencyDisplay')} />
                </Col>
              </>
            )}
            {num.style === 'unit' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <FieldLabel>{t.fUnit}</FieldLabel>
                  <Select
                    showSearch style={{ width: '100%' }}
                    value={num.unit} onChange={setNumOpt('unit')}
                    options={raw(UNITS)}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <FieldLabel>{t.fUnitDisplay}</FieldLabel>
                  <Segmented block options={raw(UNIT_DISPLAY)} value={num.unitDisplay} onChange={setNumOpt('unitDisplay')} />
                </Col>
              </>
            )}
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fNotation}</FieldLabel>
              <Segmented block options={raw(NOTATIONS)} value={num.notation} onChange={setNumOpt('notation')} />
            </Col>
            {num.notation === 'compact' && (
              <Col xs={24} sm={12} md={8}>
                <FieldLabel>{t.fCompactDisplay}</FieldLabel>
                <Segmented block options={raw(COMPACT_DISPLAY)} value={num.compactDisplay} onChange={setNumOpt('compactDisplay')} />
              </Col>
            )}
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fSignDisplay}</FieldLabel>
              <Segmented block options={raw(SIGN_DISPLAY)} value={num.signDisplay} onChange={setNumOpt('signDisplay')} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fUseGrouping}</FieldLabel>
              <Switch checked={num.useGrouping} onChange={setNumOpt('useGrouping')} />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <FieldLabel>{t.fMinFraction}</FieldLabel>
              <InputNumber min={0} max={20} style={{ width: '100%' }} value={num.minimumFractionDigits} onChange={setNumOpt('minimumFractionDigits')} placeholder="—" />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <FieldLabel>{t.fMaxFraction}</FieldLabel>
              <InputNumber min={0} max={20} style={{ width: '100%' }} value={num.maximumFractionDigits} onChange={setNumOpt('maximumFractionDigits')} placeholder="—" />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <FieldLabel>{t.fMinSignificant}</FieldLabel>
              <InputNumber min={1} max={20} style={{ width: '100%' }} value={num.minimumSignificantDigits} onChange={setNumOpt('minimumSignificantDigits')} placeholder="—" />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <FieldLabel>{t.fMaxSignificant}</FieldLabel>
              <InputNumber min={1} max={20} style={{ width: '100%' }} value={num.maximumSignificantDigits} onChange={setNumOpt('maximumSignificantDigits')} placeholder="—" />
            </Col>
          </Row>
        </Card>

        <Card
          title={t.outputTitle}
          extra={<><Tag>{t.refLocale}: {primaryLocale}</Tag><CopyBtn text={numPrimary.output} t={t} /></>}
        >
          {numPrimary.error ? (
            <Alert type="error" message={numPrimary.error} />
          ) : (
            <Text style={{ fontSize: 22, fontFamily: 'monospace', wordBreak: 'break-word' }}>
              {numPrimary.output}
            </Text>
          )}
          <Divider style={{ margin: '16px 0 12px' }} />
          <FieldLabel>{t.codeTitle}</FieldLabel>
          <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto', margin: 0 }}>
            <code>{numCode}</code>
          </pre>
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <CopyBtn text={numCode} t={t} />
          </div>
        </Card>

        <Card title={t.comparisonTitle}>{comparisonList(numResults)}</Card>
      </Space>
    ),
  }

  const dateTab = {
    key: 'date',
    label: (<span><ClockCircleOutlined /> {t.tabDate}</span>),
    children: (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
              <FieldLabel>{t.dateValueLabel}</FieldLabel>
              <Input
                value={dtValue}
                onChange={(e) => setDtValue(e.target.value)}
                placeholder="2024-06-15T14:30:00Z"
              />
              <Space size={6} wrap style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.presets}:</Text>
                <Button size="small" onClick={() => setDtValue(new Date().toISOString())}>{t.presetNow}</Button>
                <Button size="small" onClick={() => setDtValue('1970-01-01T00:00:00Z')}>{t.presetEpoch}</Button>
                <Button size="small" onClick={() => setDtValue('2000-01-01T00:00:00Z')}>{t.presetY2K}</Button>
                <Button size="small" onClick={() => setDtValue('2024-06-15T14:30:00Z')}>{t.presetSample}</Button>
              </Space>
            </Col>
            <Col xs={24} md={14}>{localeSelect}</Col>
          </Row>
        </Card>

        <Card title={t.optionsTitle}>
          {showStyleNote && (
            <Alert type="info" showIcon message={t.styleNote} style={{ marginBottom: 16 }} />
          )}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fDateStyle}</FieldLabel>
              <Segmented block options={withUnset(DATE_STYLES, t.unset)} value={dt.dateStyle} onChange={setDtOpt('dateStyle')} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fTimeStyle}</FieldLabel>
              <Segmented block options={withUnset(DATE_STYLES, t.unset)} value={dt.timeStyle} onChange={setDtOpt('timeStyle')} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fHour12}</FieldLabel>
              <Segmented block
                options={[{ label: t.unset, value: null }, { label: '12h', value: true }, { label: '24h', value: false }]}
                value={dt.hour12} onChange={setDtOpt('hour12')}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fWeekday}</FieldLabel>
              <Segmented block options={withUnset(LENGTHS, t.unset)} value={dt.weekday} onChange={setDtOpt('weekday')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fEra}</FieldLabel>
              <Segmented block options={withUnset(LENGTHS, t.unset)} value={dt.era} onChange={setDtOpt('era')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fYear}</FieldLabel>
              <Segmented block options={withUnset(NUM2, t.unset)} value={dt.year} onChange={setDtOpt('year')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fMonth}</FieldLabel>
              <Segmented block options={withUnset(MONTH_OPTS, t.unset)} value={dt.month} onChange={setDtOpt('month')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fDay}</FieldLabel>
              <Segmented block options={withUnset(NUM2, t.unset)} value={dt.day} onChange={setDtOpt('day')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fHour}</FieldLabel>
              <Segmented block options={withUnset(NUM2, t.unset)} value={dt.hour} onChange={setDtOpt('hour')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fMinute}</FieldLabel>
              <Segmented block options={withUnset(NUM2, t.unset)} value={dt.minute} onChange={setDtOpt('minute')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fSecond}</FieldLabel>
              <Segmented block options={withUnset(NUM2, t.unset)} value={dt.second} onChange={setDtOpt('second')} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <FieldLabel>{t.fTimeZoneName}</FieldLabel>
              <Segmented block options={withUnset(TZ_NAMES, t.unset)} value={dt.timeZoneName} onChange={setDtOpt('timeZoneName')} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <FieldLabel>{t.fTimeZone}</FieldLabel>
              <AutoComplete
                style={{ width: '100%' }}
                value={dt.timeZone}
                onChange={setDtOpt('timeZone')}
                placeholder={t.systemDefault}
                options={raw(TIMEZONES)}
                filterOption={(input, option) =>
                  (option?.value || '').toLowerCase().includes(input.toLowerCase())
                }
                allowClear
              />
            </Col>
            <Col xs={12} sm={6} md={8}>
              <FieldLabel>{t.fNumberingSystem}</FieldLabel>
              <Select
                style={{ width: '100%' }} value={dt.numberingSystem} onChange={setDtOpt('numberingSystem')}
                options={withUnset(NUMSYS, t.unset)}
              />
            </Col>
            <Col xs={12} sm={6} md={8}>
              <FieldLabel>{t.fCalendar}</FieldLabel>
              <Select
                style={{ width: '100%' }} value={dt.calendar} onChange={setDtOpt('calendar')}
                options={withUnset(CALENDARS, t.unset)}
              />
            </Col>
          </Row>
        </Card>

        <Card
          title={t.outputTitle}
          extra={<><Tag>{t.refLocale}: {primaryLocale}</Tag><CopyBtn text={datePrimary.output} t={t} /></>}
        >
          {datePrimary.error ? (
            <Alert type="error" message={datePrimary.error} />
          ) : (
            <Text style={{ fontSize: 22, fontFamily: 'monospace', wordBreak: 'break-word' }}>
              {datePrimary.output}
            </Text>
          )}
          <Divider style={{ margin: '16px 0 12px' }} />
          <FieldLabel>{t.codeTitle}</FieldLabel>
          <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto', margin: 0 }}>
            <code>{dateCode}</code>
          </pre>
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <CopyBtn text={dateCode} t={t} />
          </div>
        </Card>

        <Card title={t.comparisonTitle}>{comparisonList(dateResults)}</Card>
      </Space>
    ),
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2}>
        <FormatPainterOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Tabs defaultActiveKey="number" items={[numberTab, dateTab]} style={{ marginTop: 8 }} />

      <Collapse
        style={{ marginTop: 16 }}
        items={[{ key: 'src', label: t.sourceTitle, children: <Paragraph>{t.sourceBody}</Paragraph> }]}
      />
    </div>
  )
}
