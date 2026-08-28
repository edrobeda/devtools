import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  InputNumber,
  Input,
  Row,
  Col,
  Statistic,
  Divider,
  Tag,
  Collapse,
  Button,
  Tooltip,
  message,
} from 'antd'
import { CalculatorOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

// Limites de entrada — BigInt é exato, mas mantemos os números exibíveis e
// o cálculo instantâneo. Acima disso a página mostra um aviso em vez de travar.
const MAX_N = 2000
const MAX_R = 2000
const MAX_WORD = 500
const MAX_INLINE_DIGITS = 5000

// ─── Motor: combinatória com BigInt (100% client-side) ───────────
function factorialBig(n) {
  if (n < 0) return null
  let r = 1n
  for (let i = 2n; i <= BigInt(n); i++) r *= i
  return r
}

function permutationsBig(n, r) {
  if (r < 0 || r > n) return 0n
  let res = 1n
  for (let i = 0; i < r; i++) res *= BigInt(n - i)
  return res
}

function combinationsBig(n, r) {
  if (r < 0 || r > n) return 0n
  if (r > n - r) r = n - r
  let res = 1n
  for (let i = 1; i <= r; i++) res = (res * BigInt(n - r + i)) / BigInt(i)
  return res
}

function powBig(base, exp) {
  if (exp < 0) return null
  let result = 1n
  let b = BigInt(base)
  let e = BigInt(exp)
  while (e > 0n) {
    if (e & 1n) result *= b
    b *= b
    e >>= 1n
  }
  return result
}

function distinctPermutationsBig(str) {
  const chars = [...str]
  const n = chars.length
  if (n === 0) return 1n
  const freq = {}
  for (const c of chars) freq[c] = (freq[c] || 0) + 1
  let num = factorialBig(n)
  for (const f of Object.values(freq)) num = num / factorialBig(f)
  return num
}

// ─── Formatação ──────────────────────────────────────────────────
function withSeparators(str) {
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function scientificOf(bi) {
  if (bi === 0n) return '0'
  const neg = bi < 0n
  const s = (neg ? -bi : bi).toString()
  const digits = s.length
  if (digits <= 6) return (neg ? '-' : '') + s
  let mantissa = s.slice(0, 1) + '.' + s.slice(1, 6).replace(/0+$/, '')
  mantissa = mantissa.replace(/\.$/, '')
  return (neg ? '-' : '') + mantissa + ' \u00d7 10^' + (digits - 1)
}

function describeBig(bi) {
  if (bi === null) return { full: '', display: '', digits: 0 }
  const s = bi.toString()
  if (s.length <= 60) return { full: s, display: withSeparators(s), digits: s.length }
  return { full: s, display: scientificOf(bi), digits: s.length }
}

// Exemplos fixos mostrados no rodapé (calculados uma vez, no carregamento).
const EX_C49_6 = withSeparators(combinationsBig(49, 6).toString())
const EX_62_8 = withSeparators(powBig(62, 8).toString())
const EX_BANANA = distinctPermutationsBig('BANANA').toString()

const sourceCode = `// Combinação, permutação e fatorial com BigInt — exato para números grandes.
// 100% client-side, nenhum dado sai daqui.

function factorialBig(n) {
  if (n < 0) return null
  let r = 1n
  for (let i = 2n; i <= BigInt(n); i++) r *= i
  return r
}

// P(n, r) = n! / (n-r)!  -> produto de r termos evita calcular n! inteiro
function permutationsBig(n, r) {
  if (r < 0 || r > n) return 0n
  let res = 1n
  for (let i = 0; i < r; i++) res *= BigInt(n - i)
  return res
}

// C(n, r) = n! / (r! * (n-r)!)  -> forma multiplicativa (divide a cada passo)
function combinationsBig(n, r) {
  if (r < 0 || r > n) return 0n
  if (r > n - r) r = n - r      // usa o menor r pela simetria C(n,r)=C(n,n-r)
  let res = 1n
  for (let i = 1; i <= r; i++) res = (res * BigInt(n - r + i)) / BigInt(i)
  return res
}

// n^r por exponenciação rápida (permutações com repetição)
function powBig(base, exp) {
  let result = 1n, b = BigInt(base), e = BigInt(exp)
  while (e > 0n) { if (e & 1n) result *= b; b *= b; e >>= 1n }
  return result
}

// Anagramas distintos de um multiset: n! / (f1! * f2! * ... * fk!)
function distinctPermutationsBig(str) {
  const chars = [...str]
  const n = chars.length
  if (n === 0) return 1n
  const freq = {}
  for (const c of chars) freq[c] = (freq[c] || 0) + 1
  let num = factorialBig(n)
  for (const f of Object.values(freq)) num = num / factorialBig(f)
  return num
}

// Exemplos
combinationsBig(49, 6)            // 13.983.816  (Mega-Sena)
permutationsBig(10, 4)            // 5.040
powBig(62, 8)                     // 218.340.105.584.896  (senhas de 8 chars)
distinctPermutationsBig('BANANA') // 60
`

const translations = {
  pt: {
    title: 'Calculadora de Combinatória',
    intro:
      'Calcule fatorial, permutações e combinações (com e sem repetição), subconjuntos e anagramas distintos de uma palavra. Tudo com BigInt, então o resultado é exato mesmo para números enormes — 100% no navegador, nenhum dado sai daqui.',
    nLabel: 'n (total de elementos)',
    rLabel: 'r (tamanho da escolha)',
    inputs: 'Entrada',
    factorial: 'Fatorial',
    permutations: 'Permutações (sem repetição)',
    combinations: 'Combinações (sem repetição)',
    permRep: 'Permutações com repetição',
    combRep: 'Combinações com repetição',
    subsets: 'Subconjuntos',
    wordTitle: 'Anagramas de uma palavra',
    wordIntro:
      'Quantos arranjos distintos é possível formar com as letras de uma palavra (ou qualquer multiset) — descontando repetições. Útil para combinatória, anagramas e CTFs.',
    wordPlaceholder: 'Digite uma palavra (ex.: BANANA)',
    wordResult: 'Anagramas distintos',
    wordFormula: 'n! / (f₁! · f₂! · … · fₖ!)',
    result: 'Resultado',
    digits: 'dígitos',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyFull: 'Copiar valor exato',
    showFull: 'Mostrar valor exato',
    hideFull: 'Ocultar',
    exactValue: 'Valor exato',
    tooLargeN: 'n é grande demais (máx ' + MAX_N + ').',
    tooLargeR: 'r é grande demais (máx ' + MAX_R + ').',
    tooLargeWord: 'Palavra longa demais (máx ' + MAX_WORD + ' caracteres).',
    invalidN: 'n deve ser um inteiro não negativo.',
    invalidR: 'r deve ser um inteiro não negativo.',
    rGreaterThanN: 'r não pode ser maior que n para permutações/combinações simples.',
    wordTooLarge: 'Palavra longa demais para calcular.',
    emptyWord: 'Digite uma palavra para calcular.',
    note:
      'Acima do limite a página mostra um aviso em vez de calcular — BigInt é exato, mas números com dezenas de milhares de dígitos travariam a renderização. Os limites atuais já cobrem os casos práticos do dia a dia.',
    sourceTitle: 'Motor de cálculo (BigInt)',
    sourceIntro:
      'O motor é puro JavaScript client-side com BigInt. As fórmulas multiplicativas calculam P(n,r) e C(n,r) em r passos (sem precisar de n! inteiro), e a exponenciação rápida resolve n^r em log r multiplicações.',
    formula: 'Fórmula',
    examples: 'Exemplos',
  },
  en: {
    title: 'Combinatorics Calculator',
    intro:
      'Compute factorial, permutations and combinations (with and without repetition), subsets and distinct anagrams of a word. Everything uses BigInt, so the result is exact even for huge numbers — 100% in the browser, no data leaves here.',
    nLabel: 'n (total elements)',
    rLabel: 'r (choice size)',
    inputs: 'Input',
    factorial: 'Factorial',
    permutations: 'Permutations (no repetition)',
    combinations: 'Combinations (no repetition)',
    permRep: 'Permutations with repetition',
    combRep: 'Combinations with repetition',
    subsets: 'Subsets',
    wordTitle: 'Anagrams of a word',
    wordIntro:
      'How many distinct arrangements can be formed with the letters of a word (or any multiset) — discounting repetitions. Useful for combinatorics, anagrams and CTFs.',
    wordPlaceholder: 'Type a word (e.g. BANANA)',
    wordResult: 'Distinct anagrams',
    wordFormula: 'n! / (f₁! · f₂! · … · fₖ!)',
    result: 'Result',
    digits: 'digits',
    copy: 'Copy',
    copied: 'Copied!',
    copyFull: 'Copy exact value',
    showFull: 'Show exact value',
    hideFull: 'Hide',
    exactValue: 'Exact value',
    tooLargeN: 'n is too large (max ' + MAX_N + ').',
    tooLargeR: 'r is too large (max ' + MAX_R + ').',
    tooLargeWord: 'Word too long (max ' + MAX_WORD + ' characters).',
    invalidN: 'n must be a non-negative integer.',
    invalidR: 'r must be a non-negative integer.',
    rGreaterThanN: 'r cannot be greater than n for simple permutations/combinations.',
    wordTooLarge: 'Word too long to compute.',
    emptyWord: 'Type a word to compute.',
    note:
      'Above the limit the page shows a warning instead of computing — BigInt is exact, but numbers with tens of thousands of digits would freeze rendering. Current limits already cover everyday practical cases.',
    sourceTitle: 'Calculation engine (BigInt)',
    sourceIntro:
      'The engine is pure client-side JavaScript with BigInt. The multiplicative formulas compute P(n,r) and C(n,r) in r steps (without needing the full n!), and fast exponentiation solves n^r in log r multiplications.',
    formula: 'Formula',
    examples: 'Examples',
  },
}

export default function CombinatoricsCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [n, setN] = useState(10)
  const [r, setR] = useState(3)
  const [word, setWord] = useState('BANANA')
  const [showFullKey, setShowFullKey] = useState(null)

  const nInt = Number.isInteger(n) ? n : null
  const rInt = Number.isInteger(r) ? r : null

  // Erros de validação para n/r
  const nError =
    nInt === null
      ? t.invalidN
      : nInt < 0
      ? t.invalidN
      : nInt > MAX_N
      ? t.tooLargeN
      : null
  const rError =
    rInt === null
      ? t.invalidR
      : rInt < 0
      ? t.invalidR
      : rInt > MAX_R
      ? t.tooLargeR
      : null
  const rGtN =
    nInt !== null && rInt !== null && nInt >= 0 && rInt >= 0 && rInt > nInt
      ? t.rGreaterThanN
      : null

  const results = useMemo(() => {
    const valid = nInt !== null && rInt !== null && nInt >= 0 && rInt >= 0 && nInt <= MAX_N && rInt <= MAX_R
    if (!valid) return null
    return {
      factorial: describeBig(factorialBig(nInt)),
      permutations: describeBig(permutationsBig(nInt, rInt)),
      combinations: describeBig(combinationsBig(nInt, rInt)),
      permRep: describeBig(powBig(nInt, rInt)),
      combRep: describeBig(combinationsBig(nInt + rInt - 1, rInt)),
      subsets: describeBig(powBig(2, nInt)),
    }
  }, [nInt, rInt])

  const wordResult = useMemo(() => {
    const w = word
    if (!w) return { error: t.emptyWord, desc: null, n: 0, freq: null }
    const chars = [...w]
    if (chars.length > MAX_WORD) return { error: t.wordTooLarge, desc: null, n: chars.length, freq: null }
    const freq = {}
    for (const c of chars) freq[c] = (freq[c] || 0) + 1
    return { error: null, desc: describeBig(distinctPermutationsBig(w)), n: chars.length, freq }
  }, [word, t.emptyWord, t.wordTooLarge])

  const handleCopy = (value, label) => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => message.success(t.copied))
  }

  const renderFormulaCard = (key, title, formula, substituted, desc) => (
    <Col xs={24} md={12} key={key}>
      <Card
        title={
          <span>
            <CalculatorOutlined style={{ marginRight: 8 }} />
            {title}
          </span>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.formula}: </Text>
            <Text code>{formula}</Text>
          </div>
          {substituted && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.result}: </Text>
              <Text code>{substituted}</Text>
            </div>
          )}
          <Divider style={{ margin: '8px 0' }} />
          {desc && desc.display ? (
            <>
              <Statistic value={desc.display} />
              {desc.digits > 60 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {desc.digits} {t.digits}
                </Text>
              )}
              <Space size="small" style={{ marginTop: 8 }}>
                <Tooltip title={t.copyFull}>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(desc.full, title)}>
                    {t.copy}
                  </Button>
                </Tooltip>
                {desc.digits <= MAX_INLINE_DIGITS && desc.digits > 60 && (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setShowFullKey((k) => (k === key ? null : key))}
                  >
                    {showFullKey === key ? t.hideFull : t.showFull}
                  </Button>
                )}
              </Space>
              {showFullKey === key && desc.digits <= MAX_INLINE_DIGITS && (
                <pre
                  style={{
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    padding: 12,
                    borderRadius: 8,
                    overflow: 'auto',
                    maxHeight: 240,
                    fontSize: 12,
                    margin: '8px 0 0',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <code>{desc.full}</code>
                </pre>
              )}
            </>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Space>
      </Card>
    </Col>
  )

  const cards = results
    ? [
        renderFormulaCard(
          'factorial',
          t.factorial,
          'n!',
          nInt + '! = ' + results.factorial.display,
          results.factorial
        ),
        renderFormulaCard(
          'permutations',
          t.permutations,
          'P(n, r) = n! / (n \u2212 r)!',
          'P(' + nInt + ', ' + rInt + ') = ' + results.permutations.display,
          results.permutations
        ),
        renderFormulaCard(
          'combinations',
          t.combinations,
          'C(n, r) = n! / (r! \u00b7 (n \u2212 r)!)',
          'C(' + nInt + ', ' + rInt + ') = ' + results.combinations.display,
          results.combinations
        ),
        renderFormulaCard(
          'permRep',
          t.permRep,
          'n^r',
          nInt + '^' + rInt + ' = ' + results.permRep.display,
          results.permRep
        ),
        renderFormulaCard(
          'combRep',
          t.combRep,
          'C(n + r \u2212 1, r) = (n + r \u2212 1)! / (r! \u00b7 (n \u2212 1)!)',
          'C(' + (nInt + rInt - 1) + ', ' + rInt + ') = ' + results.combRep.display,
          results.combRep
        ),
        renderFormulaCard(
          'subsets',
          t.subsets,
          '2^n',
          '2^' + nInt + ' = ' + results.subsets.display,
          results.subsets
        ),
      ]
    : []

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <CalculatorOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={t.inputs} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>{t.nLabel}</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={MAX_N}
              precision={0}
              value={n}
              onChange={(v) => setN(v ?? 0)}
              status={nError ? 'error' : ''}
            />
            {nError && <Text type="danger" style={{ fontSize: 12, display: 'block' }}>{nError}</Text>}
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>{t.rLabel}</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={MAX_R}
              precision={0}
              value={r}
              onChange={(v) => setR(v ?? 0)}
              status={rError || rGtN ? 'error' : ''}
            />
            {rError && <Text type="danger" style={{ fontSize: 12, display: 'block' }}>{rError}</Text>}
            {!rError && rGtN && (
              <Text type="warning" style={{ fontSize: 12, display: 'block' }}>{rGtN}</Text>
            )}
          </Col>
        </Row>
        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          {t.note}
        </Paragraph>
      </Card>

      {results && !rGtN ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {cards}
        </Row>
      ) : (
        results && rGtN && (
          <Card style={{ marginBottom: 16 }}>
            <Text type="warning">{rGtN}</Text>
          </Card>
        )
      )}

      <Card title={t.wordTitle} style={{ marginBottom: 16 }}>
        <Paragraph type="secondary" style={{ fontSize: 13 }}>
          {t.wordIntro}
        </Paragraph>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Input
            allowClear
            placeholder={t.wordPlaceholder}
            value={word}
            onChange={(e) => setWord(e.target.value)}
            maxLength={MAX_WORD}
          />
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.formula}: </Text>
            <Text code>{t.wordFormula}</Text>
          </div>
          {wordResult.desc && wordResult.n > 0 && wordResult.freq && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {wordResult.n}! / (
                {Object.values(wordResult.freq)
                  .map((f) => f + '!')
                  .join(' \u00b7 ')}
                ) ={' '}
              </Text>
              <Text code>{wordResult.desc.display}</Text>
            </div>
          )}
          <Divider style={{ margin: '8px 0' }} />
          {wordResult.error ? (
            <Text type={wordResult.n > MAX_WORD ? 'danger' : 'secondary'}>{wordResult.error}</Text>
          ) : (
            <>
              <Statistic title={t.wordResult} value={wordResult.desc.display} />
              {wordResult.desc.digits > 60 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {wordResult.desc.digits} {t.digits}
                </Text>
              )}
              <Tooltip title={t.copyFull}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  style={{ marginTop: 8 }}
                  onClick={() => handleCopy(wordResult.desc.full, t.wordResult)}
                >
                  {t.copy}
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      </Card>

      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        <Tag color="blue">{t.examples}:</Tag>{' '}
        C(49, 6) = {EX_C49_6} ({lang === 'pt' ? 'Mega-Sena' : 'lottery'}) &middot; 62^8 = {EX_62_8} (
        {lang === 'pt' ? 'senhas de 8 caracteres' : '8-char passwords'}) &middot; BANANA = {EX_BANANA}
      </Paragraph>

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
