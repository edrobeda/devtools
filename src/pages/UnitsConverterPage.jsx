import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Row, Col, Segmented, Alert, Button, Collapse } from 'antd'
import { SwapOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Catálogo de unidades ────────────────────────────────────────────────
// Cada unidade é um par (factor, offset) que leva o valor à unidade-base da
// categoria: base = v * factor + offset. Tudo é linear, então converter de
// A pra B é "vai pra base" seguido de "volta da base". Só a temperatura usa
// offset diferente de zero (entre °C, °F e K os zeros das escalas mudam).
const CATEGORIES = [
  {
    key: 'length',
    names: { pt: 'Comprimento', en: 'Length' },
    units: [
      { code: 'mm', factor: 1e-3, name: { pt: 'Milímetro', en: 'Millimeter' } },
      { code: 'cm', factor: 1e-2, name: { pt: 'Centímetro', en: 'Centimeter' } },
      { code: 'm', factor: 1, name: { pt: 'Metro', en: 'Meter' } },
      { code: 'km', factor: 1e3, name: { pt: 'Quilômetro', en: 'Kilometer' } },
      { code: 'in', factor: 0.0254, name: { pt: 'Polegada', en: 'Inch' } },
      { code: 'ft', factor: 0.3048, name: { pt: 'Pé', en: 'Foot' } },
      { code: 'yd', factor: 0.9144, name: { pt: 'Jarda', en: 'Yard' } },
      { code: 'mi', factor: 1609.344, name: { pt: 'Milha', en: 'Mile' } },
      { code: 'nmi', factor: 1852, name: { pt: 'Milha náutica', en: 'Nautical mile' } },
    ],
  },
  {
    key: 'mass',
    names: { pt: 'Massa', en: 'Mass' },
    units: [
      { code: 'mg', factor: 1e-6, name: { pt: 'Miligrama', en: 'Milligram' } },
      { code: 'g', factor: 1e-3, name: { pt: 'Grama', en: 'Gram' } },
      { code: 'kg', factor: 1, name: { pt: 'Quilograma', en: 'Kilogram' } },
      { code: 't', factor: 1e3, name: { pt: 'Tonelada', en: 'Tonne' } },
      { code: 'oz', factor: 0.028349523125, name: { pt: 'Onça', en: 'Ounce' } },
      { code: 'lb', factor: 0.45359237, name: { pt: 'Libra', en: 'Pound' } },
      { code: 'st', factor: 6.35029318, name: { pt: 'Stone', en: 'Stone' } },
    ],
  },
  {
    key: 'temperature',
    names: { pt: 'Temperatura', en: 'Temperature' },
    units: [
      { code: '°C', factor: 1, offset: 273.15, name: { pt: 'Celsius', en: 'Celsius' } },
      { code: '°F', factor: 5 / 9, offset: 255.3722222222222, name: { pt: 'Fahrenheit', en: 'Fahrenheit' } },
      { code: 'K', factor: 1, offset: 0, name: { pt: 'Kelvin', en: 'Kelvin' } },
    ],
  },
  {
    key: 'speed',
    names: { pt: 'Velocidade', en: 'Speed' },
    units: [
      { code: 'cm/s', factor: 0.01, name: { pt: 'Centímetro por segundo', en: 'Centimeter per second' } },
      { code: 'm/s', factor: 1, name: { pt: 'Metro por segundo', en: 'Meter per second' } },
      { code: 'km/s', factor: 1e3, name: { pt: 'Quilômetro por segundo', en: 'Kilometer per second' } },
      { code: 'km/h', factor: 1 / 3.6, name: { pt: 'Quilômetro por hora', en: 'Kilometer per hour' } },
      { code: 'mph', factor: 0.44704, name: { pt: 'Milha por hora', en: 'Mile per hour' } },
      { code: 'kn', factor: 1852 / 3600, name: { pt: 'Nó', en: 'Knot' } },
      { code: 'ft/s', factor: 0.3048, name: { pt: 'Pé por segundo', en: 'Foot per second' } },
    ],
  },
  {
    key: 'area',
    names: { pt: 'Área', en: 'Area' },
    units: [
      { code: 'mm²', factor: 1e-6, name: { pt: 'Milímetro quadrado', en: 'Square millimeter' } },
      { code: 'cm²', factor: 1e-4, name: { pt: 'Centímetro quadrado', en: 'Square centimeter' } },
      { code: 'm²', factor: 1, name: { pt: 'Metro quadrado', en: 'Square meter' } },
      { code: 'km²', factor: 1e6, name: { pt: 'Quilômetro quadrado', en: 'Square kilometer' } },
      { code: 'in²', factor: 0.00064516, name: { pt: 'Polegada quadrada', en: 'Square inch' } },
      { code: 'ft²', factor: 0.09290304, name: { pt: 'Pé quadrado', en: 'Square foot' } },
      { code: 'ha', factor: 1e4, name: { pt: 'Hectare', en: 'Hectare' } },
      { code: 'ac', factor: 4046.8564224, name: { pt: 'Acre', en: 'Acre' } },
    ],
  },
  {
    key: 'volume',
    names: { pt: 'Volume', en: 'Volume' },
    units: [
      { code: 'mL', factor: 1e-3, name: { pt: 'Mililitro', en: 'Milliliter' } },
      { code: 'L', factor: 1, name: { pt: 'Litro', en: 'Liter' } },
      { code: 'm³', factor: 1e3, name: { pt: 'Metro cúbico', en: 'Cubic meter' } },
      { code: 'in³', factor: 0.016387064, name: { pt: 'Polegada cúbica', en: 'Cubic inch' } },
      { code: 'ft³', factor: 28.316846592, name: { pt: 'Pé cúbico', en: 'Cubic foot' } },
      { code: 'fl oz', factor: 0.0295735295625, name: { pt: 'Onça fluida (US)', en: 'Fluid ounce (US)' } },
      { code: 'gal', factor: 3.785411784, name: { pt: 'Galão (US)', en: 'Gallon (US)' } },
      { code: 'gal imp', factor: 4.54609, name: { pt: 'Galão (UK)', en: 'Gallon (UK)' } },
    ],
  },
  {
    key: 'time',
    names: { pt: 'Tempo', en: 'Time' },
    units: [
      { code: 'ms', factor: 1e-3, name: { pt: 'Milissegundo', en: 'Millisecond' } },
      { code: 's', factor: 1, name: { pt: 'Segundo', en: 'Second' } },
      { code: 'min', factor: 60, name: { pt: 'Minuto', en: 'Minute' } },
      { code: 'h', factor: 3600, name: { pt: 'Hora', en: 'Hour' } },
      { code: 'd', factor: 86400, name: { pt: 'Dia', en: 'Day' } },
      { code: 'wk', factor: 604800, name: { pt: 'Semana', en: 'Week' } },
      { code: 'mo', factor: 2629800, name: { pt: 'Mês', en: 'Month' } },
      { code: 'yr', factor: 31557600, name: { pt: 'Ano', en: 'Year' } },
    ],
  },
  {
    key: 'data',
    names: { pt: 'Dados', en: 'Data' },
    units: [
      { code: 'B', factor: 1, name: { pt: 'Byte', en: 'Byte' } },
      { code: 'KB', factor: 1e3, name: { pt: 'Quilobyte (decimal)', en: 'Kilobyte (decimal)' } },
      { code: 'MB', factor: 1e6, name: { pt: 'Megabyte (decimal)', en: 'Megabyte (decimal)' } },
      { code: 'GB', factor: 1e9, name: { pt: 'Gigabyte (decimal)', en: 'Gigabyte (decimal)' } },
      { code: 'TB', factor: 1e12, name: { pt: 'Terabyte (decimal)', en: 'Terabyte (decimal)' } },
      { code: 'PB', factor: 1e15, name: { pt: 'Petabyte (decimal)', en: 'Petabyte (decimal)' } },
      { code: 'KiB', factor: 1024, name: { pt: 'Quibibyte (binário)', en: 'Kibibyte (binary)' } },
      { code: 'MiB', factor: 1048576, name: { pt: 'Mebibyte (binário)', en: 'Mebibyte (binary)' } },
      { code: 'GiB', factor: 1073741824, name: { pt: 'Gibibyte (binário)', en: 'Gibibyte (binary)' } },
      { code: 'TiB', factor: 1099511627776, name: { pt: 'Tebibyte (binário)', en: 'Tebibyte (binary)' } },
      { code: 'PiB', factor: 1125899906842624, name: { pt: 'Pebibyte (binário)', en: 'Pebibyte (binary)' } },
    ],
  },
]

function catFor(key) {
  return CATEGORIES.find((c) => c.key === key)
}

// ─── Conversão linear ────────────────────────────────────────────────────
function toBase(v, u) {
  return v * u.factor + (u.offset || 0)
}
function fromBase(b, u) {
  return (b - (u.offset || 0)) / u.factor
}
function convert(v, from, to) {
  return fromBase(toBase(v, from), to)
}

// Formata pra exibição: ~12 algarismos significativos, sem zeros à direita,
// inteiros grandes sem notação (até 1e21) pra não poluir a leitura.
function format(n) {
  if (!Number.isFinite(n)) return ''
  const r = Number(n.toPrecision(12))
  if (r === Math.floor(r) && Math.abs(r) < 1e21) return String(r)
  const s = r.toPrecision(12)
  if (s.includes('e')) return s
  return s.replace(/\.?0+$/, '')
}

function parseNum(raw) {
  const s = raw.trim().replace(',', '.')
  if (s === '') return null
  if (!/^-?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?$/.test(s)) return NaN
  return Number(s)
}

const SOURCE_SNIPPET = `// Todas as unidades de uma categoria são lineares em relação à base:
//   base = v * factor + offset
// só a temperatura usa offset não-zero (os zeros de °C/°F/K não coincidem).
function toBase(v, u) { return v * u.factor + (u.offset || 0) }
function fromBase(b, u) { return (b - (u.offset || 0)) / u.factor }
function convert(v, from, to) { return fromBase(toBase(v, from), to) }
// Ex.: 32 °F em °C
//   toBase(32, °F) = 32 * (5/9) + 255.3722 = 273.15 K
//   fromBase(273.15, °C) = (273.15 - 273.15) / 1 = 0 °C ✓

// Fatores exatos do SI (base internacional): 1 in = 25,4 mm, 1 lb = 453,59237 g,
// 1 mi = 1609,344 m, nmi = 1852 m, nó = nmi/h. Dados: 1 KiB = 2^10 B, 1 KB = 10^3 B.`

const translations = {
  pt: {
    title: 'Conversor de Unidades',
    intro: (
      <>
        Converte valores do dia a dia entre unidades físicas — comprimento,
        massa, temperatura, velocidade, área, volume, tempo e dados (bytes).
        Escolha a categoria, digite em qualquer campo e todos os outros se
        atualizam na hora. 100% client-side, nada sai do navegador.
      </>
    ),
    categoryLabel: 'Categoria',
    valuesTitle: 'Valores',
    activeHint: 'Digite em qualquer campo para usá-lo como origem.',
    invalid: 'Valor inválido para conversão.',
    copy: 'Copiar',
    copied: 'Copiado!',
    alertTitle: 'Sobre os fatores',
    alertBody: (
      <>
        Todo par de unidades nessa página é <Text code>linear</Text>: um mesmo
        fator multiplica a unidade-base (comprimento, massa, velocidade, área,
        volume, tempo) e <Text code>offset</Text> só na temperatura —{' '}
        <Text code>base = v × factor + offset</Text>. Por isso{' '}
        <Text code>32 °F</Text> vira <Text code>0 °C</Text>: primeiro vai pra
        kelvin (escala universal) e depois volta. Em <Text code>Dados</Text>,
        cuidado com a pegadinha dos prefixos: <Text code>KB</Text> é decimal
        (×1000), <Text code>KiB</Text> é binário (×1024) — um disco de{' '}
        <Text code>500 GB</Text> tem ~465 GiB utilizáveis. Nos fatores usei os
        valores exatos das definições (polegada = 25,4&nbsp;mm, libra =
        453,59&nbsp;g, milha náutica = 1852&nbsp;m); mês = ano/12 (365,25&nbsp;d).
        Complementa o <Text code>css-unit-converter</Text>, que só lida com
        unidades CSS de tela (px/rem/vw), não com unidades físicas.
      </>
    ),
    algorithmTitle: 'Como funciona (algoritmo)',
    algorithmDesc:
      'Cada unidade guarda um par (factor, offset) para a unidade-base da categoria. Converter entre unidades é ida à base e volta da base — linear, por isso tudo é O(1) e sem arredondamento acumulado. O resultado é formatado com ~12 algarismos significativos pra esconder artefatos de ponto flutuante.',
  },
  en: {
    title: 'Units Converter',
    intro: (
      <>
        Converts everyday values between physical units — length, mass,
        temperature, speed, area, volume, time and data storage (bytes).
        Pick a category, type in any field and all the others update
        instantly. 100% client-side, nothing leaves the browser.
      </>
    ),
    categoryLabel: 'Category',
    valuesTitle: 'Values',
    activeHint: 'Type in any field to make it the source.',
    invalid: 'Invalid value for conversion.',
    copy: 'Copy',
    copied: 'Copied!',
    alertTitle: 'About the factors',
    alertBody: (
      <>
        Every pair of units on this page is <Text code>linearly</Text>{' '}
        related to a base unit (length, mass, area, volume, time); only{' '}
        <Text code>temperature</Text> adds an offset because the zero points
        differ, so <Text code>base = v × factor + offset</Text>. That&apos;s why{' '}
        <Text code>32 °F</Text> becomes <Text code>0 °C</Text>: first to kelvin,
        then back out. In <Text code>Data</Text> watch the prefix trap:{' '}
        <Text code>KB</Text> is decimal (×1000) while <Text code>KiB</Text> is
        binary (×1024) — a <Text code>500 GB</Text> drive shows ~465 GiB. The
        factors are the exact definitions (inch = 25.4&nbsp;mm, pound =
        453.59&nbsp;g, nautical mile = 1852&nbsp;m); month = 1/12 of 365.25 d.
        Complements <Text code>css-unit-converter</Text>, which only handles
        screen units (px/rem/vw), not physical units.
      </>
    ),
    algorithmTitle: 'Under the hood (algorithm)',
    algorithmDesc:
      'Each unit stores a (factor, offset) pair toward the category base. Converting is just base and back: multiply, add, subtract, divide. O(1), no accumulated rounding; output is formatted to ~12 significant digits to hide float artifacts.',
  },
}

// Título de cada categoria como aparece no Segmented (troca o símbolo da
// unidade-base no aviso também).
const CATEGORY_NAMES = CATEGORIES.map((c) => ({
  value: c.key,
  label: { pt: c.names.pt, en: c.names.en },
}))

export default function UnitsConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('length')
  const [activeUnit, setActiveUnit] = useState(CATEGORIES[0].units[0].code)
  const [raw, setRaw] = useState('1')
  const [copied, setCopied] = useState('')

  const defs = useMemo(() => {
    const c = catFor(category)
    return { cat: c, units: c.units }
  }, [category])

  const values = useMemo(() => {
    const names = {}
    for (const u of defs.units) names[u.code] = u
    const n = parseNum(raw)
    const from = names[activeUnit]
    if (n === null) return {}
    if (Number.isNaN(n)) return { _invalid: true }
    const out = {}
    for (const u of defs.units) {
      if (u.code === activeUnit) continue
      out[u.code] = format(convert(n, from, u))
    }
    return out
  }, [defs, activeUnit, raw])

  function switchCategory(key) {
    setCategory(key)
    const first = catFor(key).units[0]
    setActiveUnit(first.code)
    setRaw('1')
  }

  async function handleCopy(code, value) {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(code)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('')
    }
  }

  const selLabel = CATEGORIES.find((c) => c.key === category).names[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={
          <Space size={8}>
            <span>{t.categoryLabel}</span>
            <Text type="secondary" style={{ fontSize: 12 }}>({selLabel})</Text>
          </Space>
        }
      >
        <Segmented
          block
          value={category}
          onChange={switchCategory}
          options={CATEGORY_NAMES.map((o) => ({
            value: o.value,
            label: o.label[lang],
          }))}
        />
      </Card>

      {values._invalid && (
        <Alert type="error" showIcon message={t.invalid} />
      )}

      <Card title={t.valuesTitle}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
          {t.activeHint}
        </Text>
        <Row gutter={[16, 16]}>
          {defs.units.map((u) => (
            <Col xs={24} sm={12} key={u.code}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {u.name[lang]}
                  <Text code style={{ marginLeft: 4 }} title={u.name[lang]}>{u.code}</Text>
                </Text>
                <Input
                  value={values[u.code] ?? (u.code === activeUnit ? raw : '')}
                  onChange={(e) => {
                    setActiveUnit(u.code)
                    setRaw(e.target.value)
                  }}
                  style={{ fontFamily: 'monospace' }}
                  suffix={
                    <Button
                      type="text"
                      size="small"
                      icon={copied === u.code ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                      onClick={() => handleCopy(u.code, values[u.code] ?? (u.code === activeUnit ? raw : ''))}
                    />
                  }
                />
              </Space>
            </Col>
          ))}
        </Row>
      </Card>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>unitsConverter.js</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>{SOURCE_SNIPPET}</pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}