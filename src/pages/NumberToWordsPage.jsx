import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Segmented, Alert, Tag } from 'antd'
import { NumberOutlined, CopyOutlined, CheckOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─────────────────────── Português (BR) ───────────────────────
const UN = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const CENT = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function ptDois(n) {
  if (n < 20) return UN[n]
  const u = n % 10
  return u === 0 ? DEZ[Math.floor(n / 10)] : DEZ[Math.floor(n / 10)] + ' e ' + UN[u]
}
function ptTres(n) {
  if (n === 100) return 'cem'
  const c = Math.floor(n / 100)
  const r = n % 100
  if (c === 0) return ptDois(r)
  if (r === 0) return CENT[c]
  return (c === 1 ? 'cento' : CENT[c]) + ' e ' + ptDois(r)
}
const PT_MAG = [
  { v: 1e12, sing: 'trilhão', plur: 'trilhões' },
  { v: 1e9, sing: 'bilhão', plur: 'bilhões' },
  { v: 1e6, sing: 'milhão', plur: 'milhões' },
  { v: 1e3, sing: 'mil', plur: 'mil' },
]
// grupos descendo de trilhão→unidade, cada um com seu valor-líder (lead)
function ptGrupos(n) {
  const groups = []
  let r = n
  for (const g of PT_MAG) {
    if (r >= g.v) {
      const q = Math.floor(r / g.v)
      r %= g.v
      if (g.v === 1000) groups.push({ text: q === 1 ? 'mil' : ptTres(q) + ' mil', lead: q })
      else groups.push({ text: q === 1 ? 'um ' + g.sing : ptTres(q) + ' ' + g.plur, lead: q })
    }
  }
  if (r > 0 || groups.length === 0) groups.push({ text: ptTres(r), lead: r })
  return groups
}
// regra do "e": antes de um grupo cujo valor-líder é < 100 ou múltiplo exato
// de 100 usa-se "e" (mil e vinte, mil e cem); senão não (mil duzentos e trinta)
function ptNumber(n) {
  if (n === 0) return 'zero'
  const neg = n < 0
  const groups = ptGrupos(Math.abs(n))
  let out = groups[0].text
  for (let i = 1; i < groups.length; i++) {
    const lead = groups[i].lead
    out += (lead < 100 || lead % 100 === 0) ? ' e ' + groups[i].text : ' ' + groups[i].text
  }
  return neg ? 'menos ' + out : out
}

// ─────────────────────── English ───────────────────────
const EN_SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function enTwo(n) {
  if (n < 20) return EN_SMALL[n]
  const u = n % 10
  const d = Math.floor(n / 10)
  return u === 0 ? EN_TENS[d] : EN_TENS[d] + '-' + EN_SMALL[u]
}
function enThree(n) {
  const h = Math.floor(n / 100)
  const r = n % 100
  if (h === 0) return enTwo(r)
  return EN_SMALL[h] + ' hundred' + (r === 0 ? '' : ' and ' + enTwo(r))
}
const EN_MAGS = [
  { v: 1e9, name: 'billion' },
  { v: 1e6, name: 'million' },
  { v: 1e3, name: 'thousand' },
]
function enNumber(n) {
  if (n === 0) return 'zero'
  const neg = n < 0
  let r = Math.abs(n)
  const parts = []
  for (const g of EN_MAGS) {
    if (r >= g.v) {
      const q = Math.floor(r / g.v)
      r %= g.v
      parts.push(enThree(q) + ' ' + g.name)
    }
  }
  const last = r
  if (last > 0) parts.push(enThree(last))
  // estilo britânico formal: usa "and" antes de dezena/unidade final sem centena
  if (last > 0 && last <= 99 && parts.length > 1) {
    const head = parts.slice(0, parts.length - 1).join(' ')
    return (neg ? 'minus ' : '') + head + ' and ' + enThree(last)
  }
  return (neg ? 'minus ' : '') + parts.join(' ')
}

// ─────────────────────── Moeda ───────────────────────
function ptMoney(intPart, cents, currency) {
  const isUsd = currency === 'usd'
  const noun = isUsd
    ? { single: 'dólar', plural: 'dólares' }
    : { single: 'real', plural: 'reais' }
  if (intPart === 0 && cents === 0) return 'zero ' + noun.plural
  const neg = intPart < 0 || (intPart === 0 && cents < 0)
  const ip = Math.abs(intPart)
  const c = Math.abs(cents)
  let out = ''
  if (ip > 0) {
    const de = ip >= 1e6 && ip % 1e6 === 0 ? ' de' : ''
    out = ptNumber(ip) + de + ' ' + (ip === 1 ? noun.single : noun.plural)
  }
  if (c > 0) out += (out ? ' e ' : '') + ptNumber(c) + ' ' + (c === 1 ? 'centavo' : 'centavos')
  return (neg ? 'menos ' : '') + out
}
function enMoney(intPart, cents) {
  if (intPart === 0 && cents === 0) return 'zero dollars'
  const neg = intPart < 0 || (intPart === 0 && cents < 0)
  const ip = Math.abs(intPart)
  const c = Math.abs(cents)
  let out = ''
  if (ip > 0) out = enNumber(ip) + ' ' + (ip === 1 ? 'dollar' : 'dollars')
  if (c > 0) out += (out ? ' and ' : '') + enNumber(c) + ' ' + (c === 1 ? 'cent' : 'cents')
  return (neg ? 'minus ' : '') + out
}

// ─────────────────────── parse do input ───────────────────────
const MAX = 999999999999999 // 999 trilhões — cabe em Number com segurança

function parseInteger(raw) {
  let digits = String(raw).replace(/[^\d-]/g, '')
  const neg = digits.startsWith('-')
  digits = digits.replace(/-/g, '').slice(0, 15)
  let n = Number(digits || '0')
  if (n > MAX) n = MAX
  return neg ? -n : n
}
function splitMoney(raw) {
  const s = String(raw).replace(/[^\d.,-]/g, '')
  const neg = s.startsWith('-')
  const body = s.startsWith('-') ? s.slice(1) : s
  let intStr = body
  let fracStr = ''
  if (body.includes('.') || body.includes(',')) {
    const last = Math.max(body.lastIndexOf('.'), body.lastIndexOf(','))
    const frac = body.slice(last + 1)
    if (frac.length >= 1 && frac.length <= 2) {
      intStr = body.slice(0, last).replace(/[.,]/g, '')
      fracStr = frac
    } else {
      intStr = body.replace(/[.,]/g, '')
    }
  }
  let intPart = Number((intStr || '0').slice(0, 15))
  if (intPart > MAX) intPart = MAX
  const cents = Number((fracStr + '0').slice(0, 2) || '0')
  return { intPart, cents, neg }
}

const EXAMPLES = ['1234', '2024', '100', '1000000', '1234567.89', '42', '0', '-17']

function groupInt(n) {
  const neg = n < 0
  const s = String(Math.abs(n))
  const withSep = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (neg ? '-' : '') + withSep
}

const SOURCE_SNIPPET = `// PT — ex.: porExtenso(1234) -> "mil duzentos e trinta e quatro"
function ptTres(n) {
  if (n === 100) return 'cem'
  var c = Math.floor(n / 100), r = n % 100
  if (c === 0) return ptDois(r)
  if (r === 0) return CENT[c]
  return (c === 1 ? 'cento' : CENT[c]) + ' e ' + ptDois(r)
}

// junta os grupos (trilhão..mil..unidade) aplicando a regra do "e":
function junta(groups) {
  var out = groups[0].text
  for (var i = 1; i < groups.length; i++) {
    var lead = groups[i].lead
    out += (lead < 100 || lead % 100 === 0) ? ' e ' : ' '
    out += groups[i].text
  }
  return out
}

// EN (estilo UK formal): "and" só antes da dezena/unidade final sem centena
// 1001 -> "one thousand and one"   |   1100 -> "one thousand one hundred"
if (last > 0 && last <= 99 && parts.length > 1) {
  out = head.join(' ') + ' and ' + enThree(last)
}`

const translations = {
  pt: {
    title: 'Número por Extenso',
    intro: (<>Escreve números e valores por extenso em português ou inglês — útil pra cheques, contratos, notas, faturas e textos formais. 100% local, o valor nunca sai do navegador.</>),
    modeLabel: 'Modo',
    modeNumber: 'Número',
    modeBrl: 'R$ Real',
    modeDolar: 'US$ Dólar',
    placeholderNumber: 'Digite um número (até 999.999.999.999.999)...',
    placeholderMoney: 'Digite um valor (ex.: 1.234,56)',
    examples: 'Exemplos',
    resultTitle: 'Por extenso',
    resultValue: 'Valor interpretado',
    copy: 'Copiar',
    copied: 'Copiado!',
    emptyHint: 'Digite um número acima para ver a escrita por extenso.',
    ruleTitle: 'Regra do "e"',
    ruleBody: (<>Em português, o <Text code>e</Text> liga dezenas/unidades dentro de um grupo (<Text code>cento e vinte</Text>, <Text code>trinta e dois</Text>) e também entra antes de um grupo cujo valor-líder é <Text code>&lt; 100</Text> ou múltiplo exato de 100 — por isso <Text code>mil e vinte</Text> e <Text code>mil e cem</Text>, mas <Text code>mil duzentos e trinta</Text>. Acima de 1 milhão, um valor redondo ganha <Text code>de</Text> antes da moeda: <Text code>dois milhões de reais</Text>. Em inglês segue o estilo britânico formal de cheques: o <Text code>and</Text> aparece apenas antes da dezena/unidade final sem centena — <Text code>one thousand and one</Text>, mas <Text code>one thousand one hundred</Text>.</>),
    sourceTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'Number to Words',
    intro: (<>Spells numbers and money amounts in Portuguese or English — handy for checks, contracts, invoices and formal text. 100% local: the value never leaves the browser.</>),
    modeLabel: 'Mode',
    modeNumber: 'Number',
    modeBrl: 'BRL Real',
    modeDolar: 'USD Dollar',
    placeholderNumber: 'Type a number (up to 999 trillion)',
    placeholderMoney: 'Type an amount (e.g. 1,234.56)',
    examples: 'Examples',
    resultTitle: 'In words',
    resultValue: 'Parsed value',
    copy: 'Copy',
    copied: 'Copied!',
    emptyHint: 'Type a number above to see it spelled out.',
    ruleTitle: 'The "and" rule',
    ruleBody: (<>In Portuguese the <Text code>e</Text> joins tens/units (<Text code>cento e vinte</Text>, <Text code>vinte e dois</Text>) and appears before a group whose leading value is <Text code>&lt; 100</Text> or an exact multiple of 100 — so <Text code>mil e vinte</Text> and <Text code>mil e cem</Text>, but <Text code>mil duzentos e trinta</Text>. Above one million, a whole amount takes <Text code>de</Text> before the currency: <Text code>dois milhões de reais</Text>. English uses the formal British "and": it appears only before the final tens/ones when there is no hundred — <Text code>one thousand two hundred</Text>, but <Text code>one thousand and one</Text>.</>),
    sourceTitle: 'Under the hood (algorithm)',
  },
}

export default function NumberToWordsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [mode, setMode] = useState('num')
  const [input, setInput] = useState('1234')
  const [copied, setCopied] = useState(false)

  const isMoney = mode !== 'num'
  const commaSep = lang === 'pt'
  const placeholder = isMoney ? t.placeholderMoney : t.placeholderNumber

  const result = useMemo(() => {
    if (!input.trim()) return null
    let display
    let text
    if (mode === 'num') {
      const n = parseInteger(input)
      display = groupInt(n)
      text = lang === 'pt' ? ptNumber(n) : enNumber(n)
    } else {
      const { intPart, cents, neg } = splitMoney(input)
      const ip = neg ? -intPart : intPart
      const c = neg ? -cents : cents
      const sep = commaSep ? ',' : '.'
      display = groupInt(ip) + sep + String(Math.abs(c)).padStart(2, '0')
      text = lang === 'pt' ? ptMoney(ip, c, mode) : enMoney(ip, c)
    }
    return { display, text }
  }, [input, mode, lang, commaSep])

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><NumberOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text>{t.modeLabel}</Text>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { label: t.modeNumber, value: 'num' },
                { label: t.modeBrl, value: 'brl' },
                { label: t.modeDolar, value: 'usd' },
              ]}
            />
          </Space>
          <Input
            size="large"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
          />
          <Space wrap>
            <Text type="secondary">{t.examples}:</Text>
            {EXAMPLES.map((ex) => (
              <Tag key={ex} color="blue" style={{ cursor: 'pointer' }} onClick={() => setInput(ex)}>
                {ex}
              </Tag>
            ))}
          </Space>
        </Space>
      </Card>

      {result ? (
        <Card
          title={t.resultTitle}
          extra={
            <Button type="primary" size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy}>
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t.resultValue}: <Text code>{result.display}</Text>
            </Text>
            <Text style={{ fontSize: 22, lineHeight: 1.5 }}>
              {result.text}
            </Text>
          </Space>
        </Card>
      ) : (
        <Alert type="info" showIcon message={t.emptyHint} />
      )}

      <Alert type="info" showIcon icon={<QuestionCircleOutlined />} message={t.ruleTitle} description={t.ruleBody} />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}><code>{SOURCE_SNIPPET}</code></pre>
      </Card>
    </Space>
  )
}