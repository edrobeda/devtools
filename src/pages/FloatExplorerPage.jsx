import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Tag, Descriptions, Alert, Collapse } from 'antd'
import { NumberOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Explorador de Float (IEEE-754)',
    intro: (
      <>
        Digite um número e veja exatamente como ele é armazenado na memória:
        os 64 bits do <Text code>Number</Text> nativo do JavaScript divididos
        em sinal, expoente e mantissa, o valor decimal exato que a máquina
        guardou (é por isso que <Text code>0.1 + 0.2 !== 0.3</Text>), a
        representação em 32 bits (float32, usada em C/Python/GLSL) e os
        números representáveis vizinhos. 100% client-side, nada sai do
        navegador.
      </>
    ),
    inputLabel: 'Número',
    inputPlaceholder: 'Digite um número (ex.: 0.1)',
    examplesTitle: 'Exemplos de um clique',
    float64Title: 'Precisão dupla (float64) — como o JS guarda',
    float32Title: 'Precisão simples (float32)',
    neighborsTitle: 'Vizinhos representáveis',
    storedExact: 'Valor decimal exato armazenado',
    asJsPrints: 'Como o JS exibe',
    signLabel: 'Sinal (1 bit)',
    expLabel: 'Expoente (11 bits)',
    mantLabel: 'Mantissa (52 bits)',
    bitsLabel: 'Bits completos',
    hexLabel: 'Hex (16 dígitos)',
    f32SignLabel: 'Sinal',
    f32ExpLabel: 'Expoente (8 bits)',
    f32MantLabel: 'Mantissa (23 bits)',
    f32HexLabel: 'Hex (8 dígitos)',
    prev: 'anterior',
    next: 'próximo',
    gapLabel: 'Distância (1 ulp)',
    classicTitle: 'O clássico: 0.1 + 0.2',
    behaviorBody:
      'Nem 0.1 nem 0.2 cabem exatamente em binário: cada um vira o double mais próximo. A soma é arredondada de novo e o resultado é 0.30000000000000004. Repare no "valor exato" acima: o que o computador guarda de 0.1 é 0.1000000000000000055511151231257827..., e de 0.3 é 0.2999999999999999888977697537484....',
    sourceTitle: 'Como funciona — algoritmo-fonte',
    sourceDesc:
      'O núcleo é: escrever o número num ArrayBuffer via DataView (big-endian), ler de volta como BigInt de 64 bits e separar as três partes com deslocamentos. O "valor exato" reconstrói m × 2^(e−1023−52) com aritmética de precisão infinita (BigInt), mostrando todos os dígitos que o double realmente guarda.',
    zeroLabel: 'zero',
    negZeroLabel: '-0 (zero negativo)',
    subnormalLabel: 'subnormal (denormal)',
    normalLabel: 'normalizado',
    posInfLabel: '+infinito',
    negInfLabel: '-infinito',
    nanLabel: 'NaN (não é número)',
    signPos: 'positivo',
    signNeg: 'negativo',
    expNote: 'subnormal — expoente fixo em −1022',
    biasHint: 'viés 1023',
    f32Note:
      'O float32 usa 1 + 8 + 23 bits. O mesmo número quase nunca cabe: 0.1 vira 0.10000000149011612.',
    parseError: 'Não consegui interpretar isso como número. Tente "0.1", "-1.5e3", "0x1F", "Infinity", "NaN".',
  },
  en: {
    title: 'Float Explorer (IEEE-754)',
    intro: (
      <>
        Type a number and see exactly how it is stored in memory: the 64 bits
        of JavaScript&apos;s native <Text code>Number</Text> split into sign,
        exponent and mantissa, the exact decimal value actually stored (this
        is why <Text code>0.1 + 0.2 !== 0.3</Text>), the 32-bit float
        representation (C/Python/Postgres) and the neighboring representable
        numbers. 100% client-side, nothing leaves your device.
      </>
    ),
    inputLabel: 'Number',
    inputPlaceholder: 'Type a number (e.g. 0.1)',
    examplesTitle: 'One-click examples',
    float64Title: 'Double precision (float64) — what JS stores',
    float32Title: 'Single precision (float32)',
    storedExact: 'Exact stored decimal value',
    asJsPrints: 'As JS prints it',
    signLabel: 'Sign (1 bit)',
    expLabel: 'Exponent (11 bits)',
    mantLabel: 'Mantissa (52 bits)',
    bitsLabel: 'Full bits',
    hexLabel: 'Hex (16 digits)',
    f32SignLabel: 'Sign',
    f32ExpLabel: 'Exponent (8 bits)',
    f32MantLabel: 'Mantissa (23 bits)',
    f32HexLabel: 'Hex (8 digits)',
    prev: 'previous',
    next: 'next',
    gapLabel: 'Distance (1 ulp)',
    classicTitle: 'The classic: 0.1 + 0.2',
    behaviorBody:
      'Neither 0.1 nor 0.2 fits exactly in binary: each becomes the nearest double. The sum is rounded again and you get 0.30000000000000004. Check the "exact value" above: what the machine stores for 0.1 is 0.1000000000000000055511151231257827..., and for 0.3 it is 0.2999999999999999888977697537484....',
    sourceTitle: 'How it works — source algorithm',
    sourceDesc:
      'The core: write the number into an ArrayBuffer via DataView (big-endian), read it back as a 64-bit BigInt and split the three fields with bit shifts. The "exact value" rebuilds m × 2^(e−1023−52) using infinite-precision BigInt arithmetic, so every stored digit is shown.',
    zeroLabel: 'zero',
    negZeroLabel: '-0 (negative zero)',
    subnormalLabel: 'subnormal (denormal)',
    normalLabel: 'normal',
    posInfLabel: '+infinity',
    negInfLabel: '-infinity',
    nanLabel: 'NaN (not a number)',
    signPos: 'positive',
    signNeg: 'negative',
    expNote: 'subnormal — exponent fixed at −1022',
    biasHint: 'bias 1023',
    f32Note: 'float32 uses 1 + 8 + 23 bits. The same number usually does not fit: 0.1 becomes 0.10000000149011612.',
    parseError: 'Could not parse that as a number. Try "0.1", "-1.5e3", "0x1F", "Infinity", "NaN".',
  },
}

const EXAMPLES = [
  { label: '0.1', value: '0.1' },
  { label: '0.3', value: '0.3' },
  { label: '0.1+0.2', value: '0.30000000000000004' },
  { label: 'π', value: '3.141592653589793' },
  { label: '1e-7', value: '1e-7' },
  { label: '2^53', value: '9007199254740992' },
  { label: '1e308', value: '1e308' },
  { label: '1e-300', value: '1e-300' },
  { label: 'min subn.', value: '5e-324' },
  { label: 'Infinity', value: 'Infinity' },
  { label: 'NaN', value: 'NaN' },
  { label: '-0', value: '-0' },
]

const SIGN_BIT = 0x8000000000000000n
const BITS_FULL = 0xffffffffffffffffn

// converte Number ↔ BigInt de 64 bits (padrão IEEE-754, big-endian)
function doubleToBits(n) {
  const buf = new ArrayBuffer(8)
  const dv = new DataView(buf)
  dv.setFloat64(0, n, false)
  return dv.getBigUint64(0, false)
}

function bitsToDouble(bits) {
  const buf = new ArrayBuffer(8)
  const dv = new DataView(buf)
  dv.setBigUint64(0, bits, false)
  return dv.getFloat64(0, false)
}

// próximo representável: dir 1 = em direção +∞, dir -1 = em direção −∞
function neighbor(n, dir) {
  if (!Number.isFinite(n)) return n
  const negZero = Object.is(n, -0)
  if (n === 0) {
    if (negZero) return dir === 1 ? 5e-324 : -5e-324
    return dir === 1 ? 5e-324 : bitsToDouble(SIGN_BIT)
  }
  let bits = doubleToBits(n)
  const negative = (bits & SIGN_BIT) !== 0n
  const delta = dir === 1 ? 1n : -1n
  bits = negative ? bits - delta : bits + delta
  if (bits < 0n) bits = 0n
  if (bits > BITS_FULL) bits = BITS_FULL
  return bitsToDouble(bits)
}

// m × 2^e como decimal exato; m é BigInt ≥ 1, e inteiro (pode ser negativo).
// m/2^k = (m × 5^k)/10^k, então os dígitos vêm da multiplicação por 5^k.
function fractionToDecimal(m, e) {
  if (e >= 0) return (m << BigInt(e)).toString()
  const k = BigInt(-e)
  const scaled = (m * (5n ** k)).toString()
  const frac = scaled.padStart(Number(k), '0')
  const intPart = frac.slice(0, frac.length - Number(k)) || '0'
  const rest = frac.slice(frac.length - Number(k)).replace(/0+$/, '')
  return rest ? `${intPart}.${rest}` : intPart
}

function analyze64(n) {
  const bits = doubleToBits(n)
  const sign = (bits & SIGN_BIT) !== 0n
  const expRaw = Number((bits >> 52n) & 0x7ffn)
  const frac = bits & ((1n << 52n) - 1n)

  let cls
  let realExp = null
  if (expRaw === 0x7ff) {
    cls = frac === 0n ? (sign ? 'negInf' : 'posInf') : 'nan'
  } else if (expRaw === 0) {
    cls = frac === 0n ? (sign ? 'negZero' : 'zero') : 'subnormal'
    realExp = -1022
  } else {
    cls = 'normal'
    realExp = expRaw - 1023
  }

  // valor exato: m × 2^(realExp−52); subnormal m=frac, expoente real −1074
  let exact
  if (cls === 'nan') exact = 'NaN'
  else if (cls === 'posInf') exact = 'Infinity'
  else if (cls === 'negInf') exact = '-Infinity'
  else if (cls === 'zero') exact = sign ? '-0' : '0'
  else if (cls === 'negZero') exact = '-0'
  else {
    const m = expRaw === 0 ? frac : (1n << 52n) | frac
    const e = cls === 'subnormal' ? -1074 : realExp - 52
    exact = `${sign ? '-' : ''}${fractionToDecimal(m, e)}`
  }

  return {
    cls,
    sign,
    expRaw,
    expBin: expRaw.toString(2).padStart(11, '0'),
    fracBin: frac.toString(2).padStart(52, '0'),
    hex: '0x' + bits.toString(16).padStart(16, '0'),
    bitsFull: `${sign ? '1' : '0'} ${expRaw.toString(2).padStart(11, '0')} ${frac.toString(2).padStart(52, '0')}`,
    exact,
    realExp,
  }
}

function parse32(n) {
  const buf = new ArrayBuffer(4)
  const dv = new DataView(buf)
  dv.setFloat32(0, n, false)
  const bits = dv.getUint32(0, false)
  const expRaw = (bits >>> 23) & 0xff
  const frac = bits & 0x7fffff
  return {
    sign: (bits >>> 31) === 1,
    expBin: expRaw.toString(2).padStart(8, '0'),
    fracBin: frac.toString(2).padStart(23, '0'),
    hex: '0x' + bits.toString(16).padStart(8, '0'),
  }
}

const sourceCode = `// 1) grava o double num buffer de 8 bytes
const buf = new ArrayBuffer(8)
const dv = new DataView(buf)
dv.setFloat64(0, n, false)              // big-endian

// 2) lê o double como BigInt
const bits = dv.getBigUint64(0, false)
const sign = (bits >> 63n) === 1n       // 1 bit
const exp  = (bits >> 52n) & 0x7ffn     // 11 bits
const frac = bits & ((1n << 52n) - 1n)  // 52 bits

// 3) classificação IEEE-754
if (exp === 0x7ffn) cls = frac ? "NaN" : sign ? "-Inf" : "Inf"
else if (exp === 0n && frac === 0n) cls = sign ? "-0" : "0"
else if (exp === 0n) cls = "subnormal"
else cls = "normal"

// 4) valor exato = m × 2^(exp−1023−52)
let m = exp === 0n ? frac : (1n << 52n) | frac
let p = exp === 0n ? -1074 : Number(exp) - 1023 - 52
exact = fractionToDecimal(m, p)         // BigInt: precisão infinita
`.trim()

const CLS_COLORS = {
  zero: '#d9d9d9',
  negZero: '#d9d9d9',
  subnormal: '#faad14',
  normal: '#52c41a',
  posInf: '#f5222d',
  negInf: '#f5222d',
  nan: '#ff7a00',
}

export default function FloatExplorerPage() {
  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt
  const [raw, setRaw] = useState('0.1')

  const parsed = useMemo(() => {
    const s = (raw || '').trim()
    if (!s) return null
    if (/^(nan|-nan)$/i.test(s)) return { n: NaN }
    const n = Number(s)
    return Number.isNaN(n) ? { error: true } : { n }
  }, [raw])

  const info = useMemo(() => {
    if (!parsed || parsed.error) return null
    const a = analyze64(parsed.n)
    a.prev = neighbor(parsed.n, -1)
    a.next = neighbor(parsed.n, 1)
    return a
  }, [parsed])

  const f32 = useMemo(() => {
    if (!parsed || parsed.error) return null
    return parse32(parsed.n)
  }, [parsed])

  const clsName = info ? t[`${info.cls}Label`] || info.cls : ''

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><NumberOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Text strong>{t.inputLabel}</Text>
        <Input
          size="large"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t.inputPlaceholder}
          style={{ fontFamily: 'monospace', marginTop: 4 }}
          allowClear
        />
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">{t.examplesTitle}:</Text>
          <Space size={[6, 6]} wrap style={{ marginTop: 8 }}>
            {EXAMPLES.map((ex) => (
              <Tag key={ex.value} color="blue" style={{ cursor: 'pointer' }} onClick={() => setRaw(ex.value)}>
                {ex.label}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      {parsed && parsed.error && (
        <Alert type="error" showIcon message={t.parseError} />
      )}

      {info && (
        <>
          <Card title={t.float64Title}>
            <Tag color={CLS_COLORS[info.cls]}>{clsName}</Tag>
            <Descriptions bordered size="small" column={1} style={{ marginTop: 12 }}>
              <Descriptions.Item label={t.storedExact}>
                <Text style={{ fontSize: 12, wordBreak: 'break-all' }}>{info.exact}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.asJsPrints}>
                <Text code>{String(parsed.n)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.signLabel}>
                <Text code>{info.sign ? '1' : '0'}</Text>{' '}
                <Text type="secondary">({info.sign ? t.signNeg : t.signPos})</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.expLabel}>
                <Text code>{info.expBin}</Text>{' '}
                <Text type="secondary">
                  {info.cls === 'normal'
                    ? `${info.realExp} — ${t.biasHint}`
                    : info.cls === 'subnormal' ? t.expNote : ''}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.mantLabel}>
                <Text code style={{ wordBreak: 'break-all' }}>{info.fracBin}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.bitsLabel}>
                <Text code style={{ fontSize: 12, wordBreak: 'break-all' }}>{info.bitsFull}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.hexLabel}>
                <Text code style={{ wordBreak: 'break-all' }}>{info.hex}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t.float32Title}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.f32SignLabel}>
                <Text code>{f32.sign ? '1' : '0'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.f32ExpLabel}>
                <Text code>{f32.expBin}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.f32MantLabel}>
                <Text code style={{ wordBreak: 'break-all' }}>{f32.fracBin}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.f32HexLabel}>
                <Text code>{f32.hex}</Text>
              </Descriptions.Item>
            </Descriptions>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
              {t.f32Note}
            </Paragraph>
          </Card>

          <Card title={t.neighborsTitle}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.prev}>
                <Text code>{String(info.prev)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.next}>
                <Text code>{String(info.next)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.gapLabel}>
                <Text code>{!Number.isFinite(info.next) || !Number.isFinite(parsed.n) ? '—' : (info.next - parsed.n).toExponential(4)}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Alert type="info" showIcon message={t.classicTitle} description={t.behaviorBody} />
        </>
      )}

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>analyze.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{sourceCode}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}