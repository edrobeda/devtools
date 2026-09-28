import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Segmented, Select, InputNumber, Button, List, message, Collapse, Alert, Input } from 'antd'
import { IdcardOutlined, ReloadOutlined, CopyOutlined, CodeOutlined, EditOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useMediaQuery from '../hooks/useMediaQuery'
import { GENERATORS, MOTOR_SOURCE, mod11CheckDigit, cnpjCheckDigit, cnpjAlfaCheckDigit } from '../utils/brazilianDataGenerator'

const { Title, Paragraph, Text } = Typography

const CUSTOM_TYPES = ['cpf', 'cnpj', 'cnpj-alfa']

const translations = {
  pt: {
    title: 'Gerador de Dados Brasileiros',
    intro: (
      <>
        Gera dados brasileiros fictícios (CPF, CNPJ — inclusive alfanumérico —,
        CEP, telefones, placas, PIS e mais) com máscaras e dígitos verificadores
        matematicamente válidos para popular formulários e ambientes de teste.
        <Text strong> Nenhum número corresponde a pessoas, empresas, veículos ou
        endereços reais</Text> — são apenas sequências que passam nas validações
        de formato e DV. Tudo é gerado no navegador via{' '}
        <Text code>Math.random</Text>.
      </>
    ),
    type: 'Tipo de dado',
    quantity: 'Quantidade',
    generate: 'Gerar',
    copy: 'Copiar',
    copied: 'Copiado',
    copyAll: 'Copiar todos',
    plain: 'Sem formatação',
    formatted: 'Formatado',
    source: 'Código-fonte do motor',
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
    types: {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      'cnpj-alfa': 'CNPJ Alfanumérico',
      cep: 'CEP',
      phoneMobile: 'Celular',
      phoneLandline: 'Telefone fixo',
      plateOld: 'Placa antiga',
      plateMercosul: 'Placa Mercosul',
      pis: 'PIS/PASEP/NIT',
      tituloEleitor: 'Título de eleitor',
      rg: 'RG',
      renavam: 'RENAVAM',
    },
  },
  en: {
    title: 'Brazilian Data Generator',
    intro: (
      <>
        Generates fictitious Brazilian data (CPF, CNPJ — including alphanumeric
        —, ZIP codes, phones, license plates, PIS and more) with masks and
        mathematically valid check digits for populating forms and test
        environments.{' '}
        <Text strong>No number corresponds to real people, companies, vehicles
        or addresses</Text> — they're just sequences that pass format and
        check-digit validation. Everything is generated in the browser via{' '}
        <Text code>Math.random</Text>.
      </>
    ),
    type: 'Data type',
    quantity: 'Quantity',
    generate: 'Generate',
    copy: 'Copy',
    copied: 'Copied',
    copyAll: 'Copy all',
    plain: 'Plain',
    formatted: 'Formatted',
    source: 'Motor source code',
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
    types: {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      'cnpj-alfa': 'Alphanumeric CNPJ',
      cep: 'ZIP (CEP)',
      phoneMobile: 'Mobile phone',
      phoneLandline: 'Landline phone',
      plateOld: 'Old license plate',
      plateMercosul: 'Mercosul plate',
      pis: 'PIS/PASEP/NIT',
      tituloEleitor: 'Voter ID',
      rg: 'RG',
      renavam: 'RENAVAM',
    },
  },
}

const TYPE_ORDER = [
  'cpf',
  'cnpj',
  'cnpj-alfa',
  'cep',
  'phoneMobile',
  'phoneLandline',
  'plateOld',
  'plateMercosul',
  'pis',
  'tituloEleitor',
  'rg',
  'renavam',
]

function parseCustomInput(type, raw) {
  const cleaned = raw.replace(/[\s.\-/]/g, '').trim()
  if (type === 'cpf') {
    if (!/^\d{9,11}$/.test(cleaned)) return null
    const base = cleaned.slice(0, 9).split('').map(Number)
    const d1 = mod11CheckDigit(base)
    return [...base, d1, mod11CheckDigit([...base, d1])].join('')
  }
  if (type === 'cnpj') {
    if (!/^\d{12,14}$/.test(cleaned)) return null
    const base = cleaned.slice(0, 12).split('').map(Number)
    const d1 = cnpjCheckDigit(base)
    return [...base, d1, cnpjCheckDigit([...base, d1])].join('')
  }
  if (type === 'cnpj-alfa') {
    if (!/^[a-zA-Z0-9]{12,14}$/.test(cleaned)) return null
    const base = cleaned.slice(0, 12).split('')
    const d1 = cnpjAlfaCheckDigit(base)
    return [...base, String(d1), String(cnpjAlfaCheckDigit([...base, String(d1)]))].join('')
  }
  return null
}

export default function BrazilianDataGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [type, setType] = useState('cep')
  const [mode, setMode] = useState('generate')
  const [quantity, setQuantity] = useState(5)
  const [formatted, setFormatted] = useState(true)
  const [customInput, setCustomInput] = useState('')
  const [customError, setCustomError] = useState(false)
  const [results, setResults] = useState(() =>
    Array.from({ length: 5 }, () => GENERATORS.cep.generate())
  )

  const isCustomType = CUSTOM_TYPES.includes(type)

  const typeOptions = useMemo(
    () => TYPE_ORDER.map((key) => ({ label: t.types[key], value: key })),
    [t.types]
  )

  const generate = useCallback(() => {
    const { generate: gen } = GENERATORS[type]
    setResults(Array.from({ length: quantity }, gen))
  }, [type, quantity])

  const handleTypeChange = useCallback(
    (nextType) => {
      setType(nextType)
      setCustomError(false)
      setMode((currentMode) => (!CUSTOM_TYPES.includes(nextType) ? 'generate' : currentMode))
      if (!CUSTOM_TYPES.includes(nextType) || mode === 'generate') {
        const { generate: gen } = GENERATORS[nextType]
        setResults(Array.from({ length: quantity }, gen))
      } else {
        setResults([])
      }
    },
    [mode, quantity]
  )

  const handleModeChange = useCallback(
    (nextMode) => {
      setMode(nextMode)
      setCustomError(false)
      if (nextMode === 'generate') {
        const { generate: gen } = GENERATORS[type]
        setResults(Array.from({ length: quantity }, gen))
      } else {
        setResults([])
      }
    },
    [type, quantity]
  )

  const calculateCustom = useCallback(() => {
    const parsed = parseCustomInput(type, customInput)
    if (!parsed) {
      setCustomError(true)
      return
    }
    setCustomError(false)
    setResults([parsed])
  }, [type, customInput])

  const copy = useCallback(
    (value) => {
      navigator.clipboard.writeText(value)
      message.success(t.copied)
    },
    [t.copied]
  )

  const { format } = GENERATORS[type]
  const displayValue = useCallback(
    (raw) => (formatted ? format(raw) : raw),
    [formatted, format]
  )

  const customHint =
    type === 'cpf'
      ? t.customHintCpf
      : type === 'cnpj'
        ? t.customHintCnpj
        : t.customHintCnpjAlfa

  const typeSelector =
    typeOptions.length > 10 || isMobile ? (
      <Select
        style={{ width: isMobile ? '100%' : 320 }}
        value={type}
        onChange={handleTypeChange}
        options={typeOptions}
      />
    ) : (
      <Segmented
        value={type}
        onChange={handleTypeChange}
        options={typeOptions}
      />
    )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space wrap size="large" align="end">
          <Space direction="vertical" size={4} style={{ width: isMobile ? '100%' : undefined }}>
            <Text type="secondary">{t.type}</Text>
            {typeSelector}
          </Space>
          {isCustomType ? (
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
          ) : null}
          {mode === 'generate' ? (
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.quantity}</Text>
              <InputNumber min={1} max={50} value={quantity} onChange={(v) => setQuantity(v || 1)} />
            </Space>
          ) : null}
          <Space direction="vertical" size={4}>
            <Text type="secondary">{formatted ? t.formatted : t.plain}</Text>
            <Segmented
              block={isMobile}
              value={formatted}
              onChange={(v) => setFormatted(v)}
              options={[
                { label: t.formatted, value: true },
                { label: t.plain, value: false },
              ]}
            />
          </Space>
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

      <Alert
        type="info"
        showIcon
        message={lang === 'pt' ? 'Dados fictícios' : 'Fictitious data'}
        description={
          lang === 'pt'
            ? 'Esses números não têm vínculo com a Receita Federal, DETRAN ou qualquer base pública. Não use para finalidades oficiais.'
            : 'These numbers are not linked to the Brazilian IRS, DMV or any public database. Do not use them for official purposes.'
        }
      />

      <Card
        extra={(
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copy(results.map(displayValue).join('\n'))}
          >
            {t.copyAll}
          </Button>
        )}
      >
        <List
          dataSource={results}
          renderItem={(raw, i) => (
            <List.Item
              key={`${type}-${i}`}
              actions={[
                <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(displayValue(raw))}>{t.copy}</Button>,
              ]}
            >
              <Text code style={{ fontSize: 15 }}>{displayValue(raw)}</Text>
            </List.Item>
          )}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: (
              <Space>
                <CodeOutlined />
                {t.source}
              </Space>
            ),
            children: (
              <pre style={{ margin: 0, overflow: 'auto' }}>
                <code>{MOTOR_SOURCE}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}