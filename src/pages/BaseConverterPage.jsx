import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Row, Col, Button, message, Alert } from 'antd'
import { NumberOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const BASES = [
  { key: 'bin', label: 'Binário', labelEn: 'Binary', radix: 2, pattern: /^[01]*$/ },
  { key: 'oct', label: 'Octal', labelEn: 'Octal', radix: 8, pattern: /^[0-7]*$/ },
  { key: 'dec', label: 'Decimal', labelEn: 'Decimal', radix: 10, pattern: /^[0-9]*$/ },
  { key: 'hex', label: 'Hexadecimal', labelEn: 'Hexadecimal', radix: 16, pattern: /^[0-9a-fA-F]*$/ },
]

const translations = {
  pt: {
    title: 'Conversor de Base Numérica',
    intro: 'Converte um número entre binário, octal, decimal e hexadecimal em tempo real. Edite qualquer um dos campos — os outros três se atualizam sozinhos.',
    invalid: 'Caractere inválido pra essa base.',
    tooBig: 'Número grande demais pra converter com precisão exata (usa BigInt, mas evite excessos).',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'Number Base Converter',
    intro: 'Converts a number between binary, octal, decimal and hexadecimal in real time. Edit any field — the other three update automatically.',
    invalid: 'Invalid character for this base.',
    tooBig: 'Number too large to convert with exact precision (uses BigInt, but avoid excess).',
    copy: 'Copy',
    copied: 'Copied',
  },
}

export default function BaseConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [activeKey, setActiveKey] = useState('dec')
  const [rawValue, setRawValue] = useState('42')
  const [error, setError] = useState('')

  const values = useMemo(() => {
    const activeBase = BASES.find((b) => b.key === activeKey)
    if (rawValue === '') return { bin: '', oct: '', dec: '', hex: '' }
    if (!activeBase.pattern.test(rawValue)) return null
    try {
      const asBig = BigInt(
        activeBase.radix === 10 ? rawValue : `0${{ 2: 'b', 8: 'o', 16: 'x' }[activeBase.radix]}${rawValue}`
      )
      return {
        bin: asBig.toString(2),
        oct: asBig.toString(8),
        dec: asBig.toString(10),
        hex: asBig.toString(16),
      }
    } catch {
      return null
    }
  }, [rawValue, activeKey])

  function handleChange(key, value) {
    setActiveKey(key)
    setRawValue(value)
    const base = BASES.find((b) => b.key === key)
    setError(value !== '' && !base.pattern.test(value) ? t.invalid : '')
  }

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><NumberOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {error && <Alert type="error" showIcon message={error} />}

      <Card>
        <Row gutter={[16, 16]}>
          {BASES.map((b) => (
            <Col xs={24} sm={12} key={b.key}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{lang === 'pt' ? b.label : b.labelEn} ({b.radix === 2 ? 'base 2' : b.radix === 8 ? 'base 8' : b.radix === 10 ? 'base 10' : 'base 16'})</Text>
                <Input
                  value={values ? values[b.key] : (activeKey === b.key ? rawValue : '')}
                  onChange={(e) => handleChange(b.key, e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                  suffix={(
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(values ? values[b.key] : rawValue)}
                    />
                  )}
                />
              </Space>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  )
}
