import React, { useMemo, useState } from 'react'
import { Typography, Alert, Card, Space, Segmented, Input, Tag, InputNumber, Button, Select, List, Descriptions, Collapse, message } from 'antd'
import { CreditCardOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  BRANDS,
  onlyDigits,
  luhnCheck,
  luhnTrace,
  detectBrand,
  generateCardNumber,
  formatDigits,
} from '../utils/creditCard'

const { Title, Paragraph, Text } = Typography

// Números de teste conhecidos/imunizados que os gateways de sandbox aceitam
// (Stripe, PayPal etc.) — usados como exemplos de um clique na aba validar.
const EXAMPLES = [
  { id: 'visa', number: '4242424242424242' },
  { id: 'mastercard', number: '5555555555554444' },
  { id: 'amex', number: '378282246310005' },
  { id: 'discover', number: '6011111111111117' },
  { id: 'diners', number: '30569309025904' },
  { id: 'jcb', number: '3530111333300000' },
  { id: 'elo', number: '6362970000457013' },
  { id: 'hipercard', number: '6062825624254001' },
  { id: 'unionpay', number: '6250941006528599' },
  { id: 'maestro', number: '6304000000000000' },
]

const translations = {
  pt: {
    title: 'Gerador/Validador de Cartão (Luhn)',
    intro: (
      <>
        Valida um número de cartão pelo checksum <Text code>Luhn</Text> (o
        módulo 10 usado na maioria dos cartões) e detecta a bandeira pelas
        faixas de IIN — ou gera números de teste com dígito verificador
        correto pra povoar formulários. Tudo no navegador, nada sai daqui.
      </>
    ),
    modeValidate: 'Validar',
    modeGenerate: 'Gerar',
    validateCard: 'Validar um número',
    inputPlaceholder: 'Digite ou cole um número de cartão (espaços e traços são ignorados)',
    examplesLabel: 'Exemplos de um clique',
    brandLabel: 'Bandeira',
    unknownBrand: 'Não identificada',
    luhnLabel: 'Checksum Luhn',
    valid: 'Válido',
    invalid: 'Inválido',
    digitsLabel: 'Dígitos',
    lengthLabel: 'Comprimento p/ a bandeira',
    lengthOk: 'Aceito',
    lengthBad: 'Fora do padrão',
    formattedLabel: 'Formatado',
    traceTitle: 'Passo a passo do Luhn',
    traceLegend: 'Em azul: dígitos dobrados (somando os dígitos do dobro quando passa de 9). Último dígito = verificador.',
    traceCheck: 'Dígito verificador',
    traceSum: 'Soma',
    traceVerdictOk: 'Múltiplo de 10 → número válido',
    traceVerdictBad: 'Não é múltiplo de 10 → inválido',
    generateCard: 'Gerar números de teste',
    brandSelect: 'Bandeira',
    quantityLabel: 'Quantidade',
    generateBtn: 'Gerar',
    copy: 'Copiar',
    copied: 'Copiado',
    copyErr: 'Falha ao copiar',
    copyAll: 'Copiar todos',
    listEmpty: 'Clique em Gerar pra sortear números.',
    alertTitle: 'Luhn não é garantia de número real',
    alertBody: (
      <>
        O Luhn é uma <Text code>soma de verificação</Text>: pega erros de
        digitação e troca de dígitos, mas <Text strong>não prova que o cartão
        existe</Text> — um número Luhn-válido com BIN qualquer não pertence a
        ninguém e será recusado por uma cobrança real. Os BINs (primeiros 6
        dígitos) identificam o emissor, então o resto do número é alocado pelo
        banco, não por sorteio. Use os <Text code>números de teste oficiais</Text>{' '}
        (4242…, 5555…, 3782… — aceitos no modo sandbox da Stripe, PayPal e
        afins) ou os gerados aqui <Text strong>apenas em testes locais/sandbox</Text>;
        nunca em pagamento real.
      </>
    ),
    sourceTitle: 'Algoritmo-fonte',
  },
  en: {
    title: 'Credit Card Generator/Validator (Luhn)',
    intro: (
      <>
        Validates a card number against the <Text code>Luhn</Text> checksum
        (the modulo-10 used by most cards) and detects the brand from its IIN
        ranges — or generates test numbers with a correct check digit to fill
        forms. Everything in the browser, nothing leaves this page.
      </>
    ),
    modeValidate: 'Validate',
    modeGenerate: 'Generate',
    validateCard: 'Validate a number',
    inputPlaceholder: 'Type or paste a card number (spaces and dashes are ignored)',
    examplesLabel: 'One-click examples',
    brandLabel: 'Brand',
    unknownBrand: 'Not detected',
    luhnLabel: 'Luhn checksum',
    valid: 'Valid',
    invalid: 'Invalid',
    digitsLabel: 'Digits',
    lengthLabel: 'Length for the brand',
    lengthOk: 'Accepted',
    lengthBad: 'Off-pattern',
    formattedLabel: 'Formatted',
    traceTitle: 'Luhn step by step',
    traceLegend: 'In blue: doubled digits (summing the digits when twice > 9). Last digit = check digit.',
    traceCheck: 'Check digit',
    traceSum: 'Sum',
    traceVerdictOk: 'Multiple of 10 → valid number',
    traceVerdictBad: 'Not a multiple of 10 → invalid',
    generateCard: 'Generate test numbers',
    brandSelect: 'Brand',
    quantityLabel: 'Quantity',
    generateBtn: 'Generate',
    copy: 'Copy',
    copied: 'Copied',
    copyErr: 'Copy failed',
    copyAll: 'Copy all',
    listEmpty: 'Click Generate to draw numbers.',
    alertTitle: 'Luhn is not proof of a real number',
    alertBody: (
      <>
        Luhn is a <Text code>checksum</Text>: it catches typos and swapped
        digits, but <Text strong>does not prove the card exists</Text> — a
        Luhn-valid number with a random BIN belongs to nobody and would be
        declined by a real charge. BINs (first 6 digits) identify the issuer,
        so the rest of the number is allocated by the bank, not drawn at
        random. Use the <Text code>official test numbers</Text> (4242…, 5555…,
        3782… — accepted on Stripe/PayPal sandbox) or these generated here{' '}
        <Text strong>only in local/sandbox tests</Text>; never for a real
        payment.
      </>
    ),
    sourceTitle: 'Source algorithm',
  },
}

export default function CreditCardToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [mode, setMode] = useState('validate')
  const [input, setInput] = useState(EXAMPLES[0].number)

  const [genBrand, setGenBrand] = useState(BRANDS[0].id)
  const [quantity, setQuantity] = useState(5)
  const [results, setResults] = useState([])

  const digitsOnly = onlyDigits(input)

  const assessment = useMemo(() => {
    if (!digitsOnly) return null
    const brand = detectBrand(digitsOnly)
    const passesLuhn = luhnCheck(digitsOnly)
    const lengthAccepted = brand ? brand.lengths.includes(digitsOnly.length) : null
    return {
      brand,
      passesLuhn,
      lengthAccepted,
      formatted: formatDigits(digitsOnly),
      digitCount: digitsOnly.length,
      trace: luhnTrace(digitsOnly),
    }
  }, [digitsOnly])

  const generate = () => {
    setResults(Array.from({ length: quantity }, () => generateCardNumber(genBrand)))
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyErr)
    }
  }

  const source = useMemo(
    () =>
      [
        '// Luhn: validação por soma de verificação (módulo 10)',
        luhnCheck.toString(),
        '',
        '// Dígito verificador que fecha a soma em múltiplo de 10',
        luhnCheckDigitSource,
        '',
        '// Detecção de bandeira pelas faixas de IIN',
        detectBrand.toString(),
        '',
        '// Geração de número de teste (prefixo + meio + verificador)',
        generateCardNumber.toString(),
      ].join('\n\n'),
    []
  )

  const brandOptions = BRANDS.map((b) => ({ value: b.id, label: b.name[lang] }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><CreditCardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Segmented
        block
        value={mode}
        onChange={setMode}
        options={[
          { label: t.modeValidate, value: 'validate' },
          { label: t.modeGenerate, value: 'generate' },
        ]}
      />

      {mode === 'validate' && (
        <>
          <Card title={t.validateCard}>
            <Input
              size="large"
              placeholder={t.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 16 }}
              allowClear
            />
            <Text type="secondary" style={{ display: 'block', margin: '12px 0 4px' }}>
              {t.examplesLabel}
            </Text>
            <Space size={[8, 8]} wrap>
              {EXAMPLES.map((ex) => (
                <Tag
                  key={ex.id}
                  color={detectBrand(ex.number)?.color ?? 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setInput(ex.number)}
                >
                  {BRANDS.find((b) => b.id === ex.id)?.name[lang]}
                </Tag>
              ))}
            </Space>

            {assessment && (
              <>
                <Descriptions bordered size="small" column={2} style={{ marginTop: 20 }}>
                  <Descriptions.Item label={t.brandLabel}>
                    {assessment.brand ? (
                      <Tag color={assessment.brand.color}>{assessment.brand.name[lang]}</Tag>
                    ) : (
                      <Text type="secondary">{t.unknownBrand}</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t.luhnLabel}>
                    <Tag color={assessment.passesLuhn ? 'green' : 'red'}>
                      {assessment.passesLuhn ? t.valid : t.invalid}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t.digitsLabel}>
                    <Text strong>{assessment.digitCount}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t.lengthLabel}>
                    {assessment.brand ? (
                      assessment.lengthAccepted ? (
                        <Tag color="green">{t.lengthOk}</Tag>
                      ) : (
                        <Tag color="red">{t.lengthBad}</Tag>
                      )
                    ) : (
                      '—'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t.formattedLabel} span={2}>
                    <Text code style={{ fontSize: 14 }}>{assessment.formatted}</Text>
                  </Descriptions.Item>
                </Descriptions>

                <Card type="inner" title={t.traceTitle} style={{ marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                    {t.traceLegend}
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {assessment.trace.steps.map((step) => (
                      <Space
                        key={step.index}
                        direction="vertical"
                        size={0}
                        align="center"
                        style={{
                          background: step.index === digitsOnly.length - 1 ? '#f0f5ff' : step.doubled ? '#e6f4ff' : '#fafafa',
                          border: step.index === digitsOnly.length - 1 ? '1px solid #91caff' : '1px solid #f0f0f0',
                          borderRadius: 6,
                          padding: '2px 7px',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: step.index === digitsOnly.length - 1 ? 700 : 400 }}>
                          {step.original}
                          {step.doubled ? '×2' : ''}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>={step.value}</Text>
                      </Space>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #f0f0f0', margin: '12px 0 0' }} />
                  <Space wrap style={{ marginTop: 12 }} size="large">
                    <Text type="secondary">
                      {t.traceCheck}: <Text code strong>{digitsOnly.slice(-1)}</Text>
                    </Text>
                    <Text type="secondary">
                      {t.traceSum}: <Text code>{assessment.trace.sum}</Text>
                    </Text>
                    <Tag color={assessment.trace.valid ? 'green' : 'red'}>
                      {assessment.trace.valid ? t.traceVerdictOk : t.traceVerdictBad}
                    </Tag>
                  </Space>
                </Card>
              </>
            )}
          </Card>
        </>
      )}

      {mode === 'generate' && (
        <Card
          title={t.generateCard}
          extra={
            <Button size="small" icon={<CopyOutlined />} disabled={!results.length} onClick={() => copy(results.join('\n'))}>
              {t.copyAll}
            </Button>
          }
        >
          <Space wrap align="end">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.brandSelect}</Text>
              <Select
                value={genBrand}
                onChange={setGenBrand}
                options={brandOptions}
                style={{ width: 180 }}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.quantityLabel}</Text>
              <InputNumber min={1} max={20} value={quantity} onChange={(v) => setQuantity(v || 1)} />
            </Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={generate}>
              {t.generateBtn}
            </Button>
          </Space>

          <List
            size="small"
            style={{ marginTop: 16 }}
            locale={{ emptyText: t.listEmpty }}
            dataSource={results}
            renderItem={(number) => (
              <List.Item
                actions={[
                  <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(number)}>
                    {t.copy}
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={0}>
                  <Text code style={{ fontSize: 14 }}>{formatDigits(number)}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{number}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
                {source}
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}

const luhnCheckDigitSource = `function luhnCheckDigit(partial) {
  const digits = partial.replace(/\\D/g, '')
  const probe = digits + '0'          // testa com '0' no lugar do verificador
  let sum = 0
  const parity = probe.length % 2
  for (let i = 0; i < probe.length; i++) {
    let d = probe.charCodeAt(i) - 48
    if (i % 2 === parity) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return (10 - (sum % 10)) % 10       // quanto falta pra fechar a soma em 10
}`