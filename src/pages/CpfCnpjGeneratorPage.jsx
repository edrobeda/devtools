import React, { useState } from 'react'
import { Typography, Card, Space, Segmented, InputNumber, Button, List, message } from 'antd'
import { IdcardOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons'
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

function randomDigit() {
  return Math.floor(Math.random() * 10)
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

function formatCpf(digits) {
  const s = digits.join('')
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9, 11)}`
}

function formatCnpj(digits) {
  const s = digits.join('')
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12, 14)}`
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
  },
}

export default function CpfCnpjGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [type, setType] = useState('cpf')
  const [quantity, setQuantity] = useState(5)
  const [results, setResults] = useState(() => Array.from({ length: 5 }, generateCpf))

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  function generate() {
    const fn = type === 'cpf' ? generateCpf : generateCnpj
    setResults(Array.from({ length: quantity }, fn))
  }

  const format = type === 'cpf' ? formatCpf : formatCnpj

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
              onChange={setType}
              options={[
                { label: 'CPF', value: 'cpf' },
                { label: 'CNPJ', value: 'cnpj' },
              ]}
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.quantity}</Text>
            <InputNumber min={1} max={50} value={quantity} onChange={(v) => setQuantity(v || 1)} />
          </Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={generate}>{t.generate}</Button>
        </Space>
      </Card>

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
                <Text type="secondary" style={{ fontSize: 12 }}>{digits.join('')}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
