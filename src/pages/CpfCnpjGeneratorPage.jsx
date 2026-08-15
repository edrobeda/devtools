import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Segmented, InputNumber, Button, List, message, Input, Alert } from 'antd'
import { IdcardOutlined, ReloadOutlined, CopyOutlined, EditOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Dígito verificador do CPF: peso decrescente de N+1 até 2, sem reinício.
function cpfCheckDigit(digits) {
  let sum = 0
  let weight = digits.length + 1
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * weight
    weight--
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

// Dígito verificador do CNPJ: da direita pra esquerda, peso sobe de 2 até 9
// e reinicia em 2 — diferente do CPF, que não tem esse reinício.
function cnpjCheckDigit(digits) {
  let sum = 0
  let weight = 2
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

// Converte um caractere do CNPJ alfanumérico para o valor decimal usado no
// cálculo do dígito verificador (Resolução da Receita Federal nº 2.200/2026):
// 0-9 = 0-9; A-Z = 17-42.
function cnpjAlfaCharValue(char) {
  const c = char.toUpperCase()
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - '0'.charCodeAt(0)
  if (c >= 'A' && c <= 'Z') return 17 + (c.charCodeAt(0) - 'A'.charCodeAt(0))
  return -1
}

function cnpjAlfaCheckDigit(chars) {
  const values = chars.map(cnpjAlfaCharValue)
  return cnpjCheckDigit(values)
}

function randomDigit() {
  return Math.floor(Math.random() * 10)
}

function randomAlfaChar() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return chars[Math.floor(Math.random() * chars.length)]
}

function generateCpf() {
  const base = Array.from({ length: 9 }, randomDigit)
  const d1 = cpfCheckDigit(base)
  const d2 = cpfCheckDigit([...base, d1])
  return [...base, d1, d2]
}

function generateCnpj() {
  // 8 dígitos de raiz + "0001" de filial (padrão da matriz), dígitos verificadores calculados
  const root = Array.from({ length: 8 }, randomDigit)
  const branch = [0, 0, 0, 1]
  const base = [...root, ...branch]
  const d1 = cnpjCheckDigit(base)
  const d2 = cnpjCheckDigit([...base, d1])
  return [...base, d1, d2]
}

function generateCnpjAlfa() {
  const root = Array.from({ length: 8 }, randomAlfaChar)
  const branch = ['0', '0', '0', '1']
  const base = [...root, ...branch]
  const d1 = cnpjAlfaCheckDigit(base)
  const d2 = cnpjAlfaCheckDigit([...base, String(d1)])
  return [...base, String(d1), String(d2)]
}

function formatCpf(digits) {
  const s = digits.join('')
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9, 11)}`
}

function formatCnpj(digits) {
  const s = digits.join('')
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12, 14)}`
}

function formatCnpjAlfa(chars) {
  const s = chars.join('').toUpperCase()
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12, 14)}`
}

function parseCustomInput(type, raw) {
  const cleaned = raw.replace(/[\s.\-/]/g, '').trim()
  if (type === 'cpf') {
    if (!/^\d{9,11}$/.test(cleaned)) return null
    const base = cleaned.slice(0, 9).split('').map(Number)
    return [...base, cpfCheckDigit(base), cpfCheckDigit([...base, cpfCheckDigit(base)])]
  }
  if (type === 'cnpj') {
    if (!/^\d{12,14}$/.test(cleaned)) return null
    const base = cleaned.slice(0, 12).split('').map(Number)
    const d1 = cnpjCheckDigit(base)
    return [...base, d1, cnpjCheckDigit([...base, d1])]
  }
  if (type === 'cnpj-alfa') {
    if (!/^[a-zA-Z0-9]{12,14}$/.test(cleaned)) return null
    const base = cleaned.slice(0, 12).split('')
    const d1 = cnpjAlfaCheckDigit(base)
    return [...base, String(d1), String(cnpjAlfaCheckDigit([...base, String(d1)]))]
  }
  return null
}

const translations = {
  pt: {
    title: 'Gerador de CPF/CNPJ Fake',
    intro: (
      <>
        Gera números de CPF e CNPJ fictícios com dígitos verificadores
        matematicamente válidos (mesmo algoritmo módulo 11 usado na validação
        real), pra popular formulários e testes. Os números <Text strong>não
        pertencem a pessoas ou empresas reais</Text> — são só sequências que
        passam na validação de dígito verificador. Tudo calculado no
        navegador via <Text code>Math.random</Text>.
      </>
    ),
    type: 'Tipo',
    quantity: 'Quantidade',
    generate: 'Gerar',
    copy: 'Copiar',
    copied: 'Copiado',
    copyAll: 'Copiar todos',
    formatted: 'Formatado',
    plain: 'Só números',
    mode: 'Modo',
    modeGenerate: 'Gerar',
    modeCustom: 'Customizar',
    customPlaceholder: 'Digite a base (sem formatação)',
    customLabel: 'Base',
    customHintCpf: '9 dígitos (com ou sem formatação)',
    customHintCnpj: '12 dígitos (com ou sem formatação)',
    customHintCnpjAlfa: '12 caracteres alfanuméricos',
    customError: 'Base inválida para o tipo selecionado.',
    calculate: 'Completar dígitos',
    cnpjAlfa: 'CNPJ Alfanumérico',
  },
  en: {
    title: 'Fake CPF/CNPJ Generator',
    intro: (
      <>
        Generates fictitious Brazilian CPF (individual) and CNPJ (company)
        tax IDs with mathematically valid check digits (the same modulo-11
        algorithm used for real validation), for filling forms and tests. The
        numbers <Text strong>do not belong to real people or companies</Text>{' '}
        — they're just sequences that pass check-digit validation. Everything
        computed in the browser via <Text code>Math.random</Text>.
      </>
    ),
    type: 'Type',
    quantity: 'Quantity',
    generate: 'Generate',
    copy: 'Copy',
    copied: 'Copied',
    copyAll: 'Copy all',
    formatted: 'Formatted',
    plain: 'Digits only',
    mode: 'Mode',
    modeGenerate: 'Generate',
    modeCustom: 'Custom',
    customPlaceholder: 'Enter the base (no formatting)',
    customLabel: 'Base',
    customHintCpf: '9 digits (formatted or plain)',
    customHintCnpj: '12 digits (formatted or plain)',
    customHintCnpjAlfa: '12 alphanumeric characters',
    customError: 'Invalid base for the selected type.',
    calculate: 'Complete check digits',
    cnpjAlfa: 'Alphanumeric CNPJ',
  },
}

export default function CpfCnpjGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [type, setType] = useState('cpf')
  const [mode, setMode] = useState('generate')
  const [quantity, setQuantity] = useState(5)
  const [results, setResults] = useState(() => Array.from({ length: 5 }, generateCpf))
  const [customInput, setCustomInput] = useState('')
  const [customError, setCustomError] = useState(false)

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  const generators = useMemo(() => ({
    cpf: generateCpf,
    cnpj: generateCnpj,
    'cnpj-alfa': generateCnpjAlfa,
  }), [])

  const formatters = useMemo(() => ({
    cpf: formatCpf,
    cnpj: formatCnpj,
    'cnpj-alfa': formatCnpjAlfa,
  }), [])

  function generate() {
    const fn = generators[type]
    setResults(Array.from({ length: quantity }, fn))
  }

  function calculateCustom() {
    const parsed = parseCustomInput(type, customInput)
    if (!parsed) {
      setCustomError(true)
      return
    }
    setCustomError(false)
    setResults([parsed])
  }

  function handleTypeChange(nextType) {
    setType(nextType)
    setCustomError(false)
    if (mode === 'generate') {
      const fn = generators[nextType]
      setResults(Array.from({ length: quantity }, fn))
    }
  }

  function handleModeChange(nextMode) {
    setMode(nextMode)
    setCustomError(false)
    if (nextMode === 'generate') {
      const fn = generators[type]
      setResults(Array.from({ length: quantity }, fn))
    } else {
      setResults([])
    }
  }

  const format = formatters[type]

  const customHint = type === 'cpf'
    ? t.customHintCpf
    : type === 'cnpj'
      ? t.customHintCnpj
      : t.customHintCnpjAlfa

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space wrap size="large" align="end">
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.type}</Text>
            <Segmented
              value={type}
              onChange={handleTypeChange}
              options={[
                { label: 'CPF', value: 'cpf' },
                { label: 'CNPJ', value: 'cnpj' },
                { label: t.cnpjAlfa, value: 'cnpj-alfa' },
              ]}
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.mode}</Text>
            <Segmented
              value={mode}
              onChange={handleModeChange}
              options={[
                { label: <><ThunderboltOutlined /> {t.modeGenerate}</>, value: 'generate' },
                { label: <><EditOutlined /> {t.modeCustom}</>, value: 'custom' },
              ]}
            />
          </Space>
          {mode === 'generate' ? (
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.quantity}</Text>
              <InputNumber min={1} max={50} value={quantity} onChange={(v) => setQuantity(v || 1)} />
            </Space>
          ) : null}
          {mode === 'generate' ? (
            <Button type="primary" icon={<ReloadOutlined />} onClick={generate}>{t.generate}</Button>
          ) : (
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={calculateCustom}>{t.calculate}</Button>
          )}
        </Space>

        {mode === 'custom' ? (
          <Space direction="vertical" size={8} style={{ marginTop: 16, width: '100%' }}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Text type="secondary">{t.customLabel}</Text>
              <Input
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value)
                  if (customError) setCustomError(false)
                }}
                onPressEnter={calculateCustom}
                placeholder={customHint}
                status={customError ? 'error' : ''}
                style={{ maxWidth: 400 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{customHint}</Text>
            </Space>
            {customError ? (
              <Alert message={t.customError} type="error" showIcon style={{ maxWidth: 400 }} />
            ) : null}
          </Space>
        ) : null}
      </Card>

      {results.length > 0 ? (
        <Card
          extra={(
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copy(results.map(format).join('\n'))}
            >
              {t.copyAll}
            </Button>
          )}
        >
          <List
            dataSource={results}
            renderItem={(digits, i) => (
              <List.Item
                key={i}
                actions={[
                  <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(format(digits))}>{t.copy}</Button>,
                ]}
              >
                <Space direction="vertical" size={0}>
                  <Text code style={{ fontSize: 15 }}>{format(digits)}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{digits.join('').toUpperCase()}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      ) : null}
    </Space>
  )
}
