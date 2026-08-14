import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Tabs, Input, Alert, Button, Collapse, Tag, Statistic, Row, Col, message } from 'antd'
import { NumberOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { toRoman, fromRoman, isValidRoman, explainRoman, ROMAN_MAP } from '../utils/romanNumeralConverter'

const { Title, Paragraph, Text } = Typography

const DECIMAL_EXAMPLES = [1, 4, 9, 42, 99, 100, 1994, 2024, 3999]
const ROMAN_EXAMPLES = ['I', 'IV', 'IX', 'XLII', 'XCIX', 'C', 'MCMXCIV', 'MMXXIV', 'MMMCMXCIX']

const translations = {
  pt: {
    title: 'Conversor de Números Romanos',
    intro: 'Converte entre números decimais (1–3999) e numerais romanos no sistema subtrativo moderno. A conversão acontece localmente, com explicação passo a passo e histórico das últimas operações.',
    tabDecimalToRoman: 'Decimal → Romano',
    tabRomanToDecimal: 'Romano → Decimal',
    decimalInput: 'Número decimal',
    decimalPlaceholder: 'Digite um número entre 1 e 3999…',
    romanInput: 'Numeral romano',
    romanPlaceholder: 'Digite algo como MMXXIV…',
    examples: 'Exemplos',
    resultRoman: 'Resultado em romano',
    resultDecimal: 'Resultado em decimal',
    invalidDecimal: 'Digite um número inteiro entre 1 e 3999.',
    invalidRoman: 'Numeral romano inválido. Use apenas I, V, X, L, C, D e M com subtrações válidas.',
    emptyPlaceholder: 'O resultado aparece aqui…',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    stepByStep: 'Passo a passo',
    stepDescription: 'O algoritmo guloso subtrai o maior símbolo possível a cada iteração:',
    reference: 'Tabela de referência',
    history: 'Histórico',
    historyEmpty: 'Nenhuma conversão ainda.',
    clearHistory: 'Limpar',
    sourceTitle: 'Código-fonte — toRoman / fromRoman',
    sourceBody: 'O núcleo vive em src/utils/romanNumeralConverter.js. toRoman percorre ROMAN_MAP do maior para o menor valor e concatena símbolos enquanto subtrai do número. fromRoman valida a string contra uma regex estrita, depois soma os valores considerando subtrações (quando um símbolo menor precede um maior). explainRoman devolve a lista de subtrações para exibir a decomposição na interface.',
    statValue: 'Valor',
    statSymbol: 'Símbolo',
    statRemaining: 'Restante',
    rangeMin: 'Mínimo',
    rangeMax: 'Máximo',
  },
  en: {
    title: 'Roman Numeral Converter',
    intro: 'Convert between decimal numbers (1–3999) and Roman numerals using the modern subtractive notation. Conversion happens locally, with a step-by-step breakdown and a history of recent operations.',
    tabDecimalToRoman: 'Decimal → Roman',
    tabRomanToDecimal: 'Roman → Decimal',
    decimalInput: 'Decimal number',
    decimalPlaceholder: 'Type a number between 1 and 3999…',
    romanInput: 'Roman numeral',
    romanPlaceholder: 'Type something like MMXXIV…',
    examples: 'Examples',
    resultRoman: 'Roman result',
    resultDecimal: 'Decimal result',
    invalidDecimal: 'Please enter an integer between 1 and 3999.',
    invalidRoman: 'Invalid Roman numeral. Use only I, V, X, L, C, D, and M with valid subtractive pairs.',
    emptyPlaceholder: 'The result appears here…',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    stepByStep: 'Step by step',
    stepDescription: 'The greedy algorithm subtracts the largest possible symbol on every iteration:',
    reference: 'Reference table',
    history: 'History',
    historyEmpty: 'No conversions yet.',
    clearHistory: 'Clear',
    sourceTitle: 'Source code — toRoman / fromRoman',
    sourceBody: 'The core lives in src/utils/romanNumeralConverter.js. toRoman walks ROMAN_MAP from highest to lowest value and appends symbols while subtracting from the number. fromRoman validates the input against a strict regex, then sums the values while accounting for subtractive notation (when a smaller symbol appears before a larger one). explainRoman returns the list of subtractions to render the breakdown in the UI.',
    statValue: 'Value',
    statSymbol: 'Symbol',
    statRemaining: 'Remaining',
    rangeMin: 'Minimum',
    rangeMax: 'Maximum',
  },
}

export default function RomanNumeralConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [tab, setTab] = useState('decimal-to-roman')
  const [decimalInput, setDecimalInput] = useState('')
  const [romanInput, setRomanInput] = useState('')
  const [history, setHistory] = useState([])

  const addToHistory = (from, to, type) => {
    setHistory((prev) => {
      const next = [{ from, to, type, id: Date.now() }, ...prev]
      return next.slice(0, 10)
    })
  }

  const decimalResult = useMemo(() => {
    if (decimalInput === '') return { value: '', error: '', steps: [] }
    const num = Number(decimalInput)
    if (!Number.isInteger(num) || num < 1 || num > 3999) {
      return { value: '', error: t.invalidDecimal, steps: [] }
    }
    const roman = toRoman(num)
    const steps = explainRoman(num)
    return { value: roman, error: '', steps }
  }, [decimalInput, t.invalidDecimal])

  const romanResult = useMemo(() => {
    if (romanInput.trim() === '') return { value: '', error: '' }
    if (!isValidRoman(romanInput)) {
      return { value: '', error: t.invalidRoman }
    }
    try {
      const decimal = fromRoman(romanInput)
      return { value: String(decimal), error: '' }
    } catch {
      return { value: '', error: t.invalidRoman }
    }
  }, [romanInput, t.invalidRoman])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      message.success(t.copied)
    } catch {
      message.error(t.copyError)
    }
  }

  const handleDecimalExample = (n) => {
    setDecimalInput(String(n))
    addToHistory(String(n), toRoman(n), 'decimal-to-roman')
  }

  const handleRomanExample = (r) => {
    setRomanInput(r)
    addToHistory(r, String(fromRoman(r)), 'roman-to-decimal')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><NumberOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'decimal-to-roman',
            label: t.tabDecimalToRoman,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text type="secondary">{t.decimalInput}</Text>
                    <Input
                      type="number"
                      min={1}
                      max={3999}
                      value={decimalInput}
                      onChange={(e) => setDecimalInput(e.target.value)}
                      placeholder={t.decimalPlaceholder}
                      style={{ fontFamily: 'monospace' }}
                    />
                    <Space wrap style={{ marginTop: 4 }}>
                      {t.examples}:&nbsp;
                      {DECIMAL_EXAMPLES.map((n) => (
                        <Tag
                          key={n}
                          color="processing"
                          style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                          onClick={() => handleDecimalExample(n)}
                        >
                          <Text code style={{ color: 'inherit' }}>{n}</Text>
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Card>

                {decimalResult.error && <Alert type="error" showIcon message={decimalResult.error} />}

                <Card
                  title={t.resultRoman}
                  extra={(
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(decimalResult.value)}
                      disabled={!decimalResult.value}
                    >
                      {t.copy}
                    </Button>
                  )}
                >
                  {decimalResult.value ? (
                    <Paragraph strong style={{ fontSize: 28, marginBottom: 0, fontFamily: 'serif' }}>
                      {decimalResult.value}
                    </Paragraph>
                  ) : (
                    <Text type="secondary">{t.emptyPlaceholder}</Text>
                  )}
                </Card>

                {decimalResult.steps.length > 0 && (
                  <Card title={t.stepByStep}>
                    <Paragraph type="secondary">{t.stepDescription}</Paragraph>
                    <Row gutter={[16, 16]}>
                      {decimalResult.steps.map((step, idx) => (
                        <Col xs={8} sm={6} md={4} key={idx}>
                          <Statistic title={t.statValue} value={step.value} />
                          <Statistic title={t.statSymbol} value={step.symbol} />
                          <Statistic title={t.statRemaining} value={step.remaining} />
                        </Col>
                      ))}
                    </Row>
                  </Card>
                )}
              </Space>
            ),
          },
          {
            key: 'roman-to-decimal',
            label: t.tabRomanToDecimal,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text type="secondary">{t.romanInput}</Text>
                    <Input
                      value={romanInput}
                      onChange={(e) => setRomanInput(e.target.value.toUpperCase())}
                      placeholder={t.romanPlaceholder}
                      style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                    <Space wrap style={{ marginTop: 4 }}>
                      {t.examples}:&nbsp;
                      {ROMAN_EXAMPLES.map((r) => (
                        <Tag
                          key={r}
                          color="processing"
                          style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                          onClick={() => handleRomanExample(r)}
                        >
                          <Text code style={{ color: 'inherit' }}>{r}</Text>
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Card>

                {romanResult.error && <Alert type="error" showIcon message={romanResult.error} />}

                <Card
                  title={t.resultDecimal}
                  extra={(
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(romanResult.value)}
                      disabled={!romanResult.value}
                    >
                      {t.copy}
                    </Button>
                  )}
                >
                  {romanResult.value ? (
                    <Paragraph strong style={{ fontSize: 28, marginBottom: 0, fontFamily: 'monospace' }}>
                      {romanResult.value}
                    </Paragraph>
                  ) : (
                    <Text type="secondary">{t.emptyPlaceholder}</Text>
                  )}
                </Card>
              </Space>
            ),
          },
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t.reference}>
            <Row gutter={[8, 8]}>
              {ROMAN_MAP.map(({ value, symbol }) => (
                <Col span={8} key={symbol}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                      background: '#fafafa',
                    }}
                  >
                    <Text strong style={{ fontFamily: 'serif' }}>{symbol}</Text>
                    <Text type="secondary">{value}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={t.history}
            extra={history.length > 0 && (
              <Button size="small" icon={<DeleteOutlined />} onClick={() => setHistory([])}>
                {t.clearHistory}
              </Button>
            )}
          >
            {history.length === 0 ? (
              <Text type="secondary">{t.historyEmpty}</Text>
            ) : (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                    }}
                  >
                    <Text code>{item.from}</Text>
                    <Text type="secondary">→</Text>
                    <Text code>{item.to}</Text>
                    <Tag color={item.type === 'decimal-to-roman' ? 'blue' : 'green'}>
                      {item.type === 'decimal-to-roman' ? t.tabDecimalToRoman : t.tabRomanToDecimal}
                    </Tag>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{toRoman.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
