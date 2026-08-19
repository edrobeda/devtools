import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Segmented, Select, InputNumber, Button, List, message, Collapse, Alert } from 'antd'
import { IdcardOutlined, ReloadOutlined, CopyOutlined, CodeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useMediaQuery from '../hooks/useMediaQuery'
import { GENERATORS, MOTOR_SOURCE } from '../utils/brazilianDataGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Dados Brasileiros',
    intro: (
      <>
        Gera dados brasileiros fictícios com máscaras e dígitos verificadores
        matematicamente válidos para popular formulários e ambientes de teste.
        <Text strong> Nenhum número corresponde a pessoas, veículos ou
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
    types: {
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
        Generates fictitious Brazilian data with masks and mathematically valid
        check digits for populating forms and test environments.{' '}
        <Text strong>No number corresponds to real people, vehicles or
        addresses</Text> — they're just sequences that pass format and check-digit
        validation. Everything is generated in the browser via{' '}
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
    types: {
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

export default function BrazilianDataGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [type, setType] = useState('cep')
  const [quantity, setQuantity] = useState(5)
  const [formatted, setFormatted] = useState(true)
  const [results, setResults] = useState(() =>
    Array.from({ length: 5 }, () => GENERATORS.cep.generate())
  )

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
      const { generate: gen } = GENERATORS[nextType]
      setResults(Array.from({ length: quantity }, gen))
    },
    [quantity]
  )

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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space wrap size="large" align="end">
          <Space direction="vertical" size={4} style={{ width: isMobile ? '100%' : undefined }}>
            <Text type="secondary">{t.type}</Text>
            {isMobile ? (
              <Select
                style={{ width: '100%' }}
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
            )}
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.quantity}</Text>
            <InputNumber min={1} max={50} value={quantity} onChange={(v) => setQuantity(v || 1)} />
          </Space>
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
          <Button type="primary" icon={<ReloadOutlined />} onClick={generate}>{t.generate}</Button>
        </Space>
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
