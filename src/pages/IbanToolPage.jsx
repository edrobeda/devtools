import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Select,
  Radio,
  Checkbox,
  Alert,
  List,
  Tag,
  Tabs,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  CopyOutlined,
  RedoOutlined,
  CodeOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  FORMATS,
  COUNTRY_PRESETS,
  IBAN_LENGTHS,
  normalize,
  isValid,
  formatIban,
  getIbanInfo,
  generateIban,
  generateMultiple,
  calculateCheckDigits,
} from '../utils/ibanTool'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

const sourceCode = `// src/utils/ibanTool.js (resumo)
export const IBAN_LENGTHS = {
  DE: 22, GB: 22, FR: 27, ES: 24, IT: 27, PT: 25,
  NL: 18, BE: 16, CH: 21, AT: 20, IE: 22, /* ... */
}

export function normalize(iban) {
  return iban.replace(/\\s+/g, '').toUpperCase()
}

export function formatIban(iban, style = 'grouped') {
  const clean = normalize(iban)
  if (style === 'compact') return clean
  return clean.match(/.{1,4}/g)?.join(' ') || clean
}

function charToNumber(char) {
  const code = char.charCodeAt(0)
  if (code >= 65 && code <= 90) return String(code - 55)
  if (code >= 48 && code <= 57) return char
  return ''
}

function ibanToNumeric(iban) {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  return rearranged.split('').map(charToNumber).join('')
}

function mod97(numericString) {
  let chunk = numericString.slice(0, 9)
  let remainder = parseInt(chunk, 10) % 97
  let pos = 9
  while (pos < numericString.length) {
    chunk = String(remainder) + numericString.slice(pos, pos + 7)
    remainder = parseInt(chunk, 10) % 97
    pos += 7
  }
  return remainder
}

export function calculateCheckDigits(countryCode, bban) {
  const temp = normalize(countryCode + '00' + bban)
  return String(98 - mod97(ibanToNumeric(temp))).padStart(2, '0')
}

export function isValid(iban) {
  const clean = normalize(iban)
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) return false
  const expected = IBAN_LENGTHS[clean.slice(0, 2)]
  return expected && clean.length === expected && mod97(ibanToNumeric(clean)) === 1
}`

const translations = {
  pt: {
    title: 'Gerador / Validador de IBAN',
    intro: (
      <>
        Gere IBANs (International Bank Account Number) de exemplo com checksum
        válido e valide IBANs reais 100% no navegador. O algoritmo segue o
        padrão ISO 13616 com cálculo <Text code>mod-97</Text> em partes para
        suportar números maiores que o inteiro seguro do JavaScript.
      </>
    ),
    generateTab: 'Gerar',
    validateTab: 'Validar',
    sourceTab: 'Código-fonte',
    countryLabel: 'País',
    formatLabel: 'Formato',
    countLabel: 'Quantidade',
    numericOnlyLabel: 'Apenas dígitos no BBAN (exemplos mais simples)',
    generateBtn: 'Gerar',
    generateMoreBtn: 'Gerar mais',
    copyBtn: 'Copiar',
    copied: 'Copiado!',
    noDuplicates: 'Evitar duplicados',
    resultsTitle: 'IBANs gerados',
    emptyResults: 'Clique em "Gerar" para criar IBANs de exemplo.',
    validatePlaceholder: 'Cole um IBAN em qualquer formato...',
    validateBtn: 'Validar',
    valid: 'IBAN válido',
    invalid: 'IBAN inválido',
    normalized: 'Normalizado',
    countryLabelInfo: 'País',
    lengthLabel: 'Comprimento',
    checkDigitsLabel: 'Dígitos de verificação',
    bbanLabel: 'BBAN',
    expectedLength: 'Comprimento esperado',
    actualLength: 'Comprimento real',
    unknownCountry: 'País não reconhecido no registro ISO 13616',
    wrongLength: 'Comprimento incorreto',
    invalidChars: 'Caracteres inválidos',
    checksum: 'Falha no checksum mod-97',
    remainder: 'Resto',
    expectedCheck: 'Dígitos de verificação esperados',
    note: (
      <>
        IBANs gerados aqui são <Text strong>fictícios</Text>: possuem o
        checksum correto, mas o BBAN não corresponde a uma conta bancária real.
        Use apenas para testes de formulário, máscaras e validações client-side.
      </>
    ),
  },
  en: {
    title: 'IBAN Generator / Validator',
    intro: (
      <>
        Generate sample IBANs (International Bank Account Number) with a valid
        checksum and validate real IBANs entirely in the browser. The
        algorithm follows ISO 13616 using chunked <Text code>mod-97</Text>{' '}
        arithmetic to support numbers larger than JavaScript's safe integer.
      </>
    ),
    generateTab: 'Generate',
    validateTab: 'Validate',
    sourceTab: 'Source code',
    countryLabel: 'Country',
    formatLabel: 'Format',
    countLabel: 'Quantity',
    numericOnlyLabel: 'Numeric BBAN only (simpler examples)',
    generateBtn: 'Generate',
    generateMoreBtn: 'Generate more',
    copyBtn: 'Copy',
    copied: 'Copied!',
    noDuplicates: 'Avoid duplicates',
    resultsTitle: 'Generated IBANs',
    emptyResults: 'Click "Generate" to create sample IBANs.',
    validatePlaceholder: 'Paste an IBAN in any format...',
    validateBtn: 'Validate',
    valid: 'Valid IBAN',
    invalid: 'Invalid IBAN',
    normalized: 'Normalized',
    countryLabelInfo: 'Country',
    lengthLabel: 'Length',
    checkDigitsLabel: 'Check digits',
    bbanLabel: 'BBAN',
    expectedLength: 'Expected length',
    actualLength: 'Actual length',
    unknownCountry: 'Country not found in the ISO 13616 registry',
    wrongLength: 'Wrong length',
    invalidChars: 'Invalid characters',
    checksum: 'Mod-97 checksum failed',
    remainder: 'Remainder',
    expectedCheck: 'Expected check digits',
    note: (
      <>
        IBANs generated here are <Text strong>fictional</Text>: they have the
        correct checksum, but the BBAN does not match any real bank account.
        Use them only for form, mask and client-side validation testing.
      </>
    ),
  },
}

function GenerateSection({ t, lang }) {
  const [country, setCountry] = useState('DE')
  const [format, setFormat] = useState('grouped')
  const [count, setCount] = useState(5)
  const [numericOnly, setNumericOnly] = useState(true)
  const [avoidDuplicates, setAvoidDuplicates] = useState(true)
  const [ibans, setIbans] = useState([])
  const [copied, setCopied] = useState(false)

  const options = useMemo(
    () => ({ country, format, numericOnly }),
    [country, format, numericOnly]
  )

  const handleGenerate = () => {
    const next = avoidDuplicates
      ? generateMultiple(count, options)
      : Array.from({ length: count }, () => generateIban(options))
    setIbans(next)
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(ibans.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{t.countryLabel}</Text>
            <Select
              value={country}
              onChange={setCountry}
              options={COUNTRY_PRESETS.map((c) => ({
                label: `${c.code} — ${lang === 'pt' ? c.labelPt : c.label}`,
                value: c.code,
              }))}
              style={{ width: '100%' }}
            />
          </Space>
        </Col>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{t.formatLabel}</Text>
            <Select
              value={format}
              onChange={setFormat}
              options={Object.values(FORMATS).map((f) => ({
                label: lang === 'pt' ? f.labelPt : f.label,
                value: f.id,
              }))}
              style={{ width: '100%' }}
            />
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={8}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{t.countLabel}</Text>
            <Radio.Group
              value={count}
              onChange={(e) => setCount(e.target.value)}
              options={[1, 5, 10, 25].map((n) => ({ label: n, value: n }))}
              optionType="button"
              buttonStyle="solid"
            />
          </Space>
        </Col>
        <Col xs={24} sm={16}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Checkbox checked={numericOnly} onChange={(e) => setNumericOnly(e.target.checked)}>
              {t.numericOnlyLabel}
            </Checkbox>
            <Checkbox checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)}>
              {t.noDuplicates}
            </Checkbox>
          </Space>
        </Col>
      </Row>

      <Space wrap>
        <Button type="primary" icon={<RedoOutlined />} onClick={handleGenerate}>
          {t.generateBtn}
        </Button>
        <Button icon={<CopyOutlined />} disabled={ibans.length === 0} onClick={handleCopyAll}>
          {copied ? t.copied : t.copyBtn}
        </Button>
      </Space>

      <Card title={t.resultsTitle} size="small">
        <List
          bordered
          size="small"
          locale={{ emptyText: t.emptyResults }}
          dataSource={ibans}
          renderItem={(iban) => (
            <List.Item
              actions={[
                <Button
                  key="copy"
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => navigator.clipboard.writeText(iban)}
                />,
              ]}
            >
              <Text code copyable={{ text: iban }}>{iban}</Text>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}

function ValidateSection({ t }) {
  const [input, setInput] = useState('')
  const [info, setInfo] = useState(null)

  const handleValidate = () => {
    setInfo(getIbanInfo(input))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleValidate()
  }

  const reasonText = info && !info.valid ? t[info.reason] || info.reason : null

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.validatePlaceholder}
          prefix={<GlobalOutlined />}
          allowClear
        />
        <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleValidate}>
          {t.validateBtn}
        </Button>
      </Space.Compact>

      {info && (
        <Alert
          type={info.valid ? 'success' : 'error'}
          showIcon
          icon={info.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          message={info.valid ? t.valid : t.invalid}
          description={!info.valid && (
            <Space direction="vertical" size="small">
              <Text>{reasonText}</Text>
              {info.reason !== 'unknownCountry' && (
                <Text code>{normalize(input) || input}</Text>
              )}
            </Space>
          )}
        />
      )}

      {info?.valid && (
        <Card size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title={t.normalized}
                  value={info.clean}
                  valueStyle={{ fontSize: 16, fontFamily: 'monospace' }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title={t.countryLabelInfo}
                  value={`${info.country} (${IBAN_LENGTHS[info.country]} ${t.lengthLabel.toLowerCase()})`}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>

            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title={t.checkDigitsLabel}
                  value={info.checkDigits}
                  valueStyle={{ fontSize: 16, fontFamily: 'monospace' }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title={t.bbanLabel}
                  value={info.bban}
                  valueStyle={{ fontSize: 14, fontFamily: 'monospace' }}
                />
              </Col>
            </Row>

            <Text strong>{t.formatLabel}</Text>
            <Space wrap>
              {Object.entries(info.formatted).map(([fmt, value]) => (
                <Tag key={fmt} color="blue">
                  {fmt}: <Text code copyable={{ text: value }}>{value}</Text>
                </Tag>
              ))}
            </Space>
          </Space>
        </Card>
      )}

      {info && !info.valid && info.reason === 'checksum' && (
        <Card size="small">
          <Space direction="vertical" size="small">
            <Text>{t.remainder}: <Text code>{info.remainder}</Text></Text>
            <Text>{t.expectedCheck}: <Text code>{info.expectedCheck}</Text></Text>
          </Space>
        </Card>
      )}

      {info && !info.valid && info.reason === 'wrongLength' && (
        <Card size="small">
          <Space direction="vertical" size="small">
            <Text>{t.expectedLength}: <Text code>{info.expectedLength}</Text></Text>
            <Text>{t.actualLength}: <Text code>{info.actualLength}</Text></Text>
          </Space>
        </Card>
      )}

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function IbanToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BankOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Tabs defaultActiveKey="generate" type="card">
        <TabPane tab={t.generateTab} key="generate">
          <GenerateSection t={t} lang={lang} />
        </TabPane>
        <TabPane tab={t.validateTab} key="validate">
          <ValidateSection t={t} />
        </TabPane>
        <TabPane tab={<><CodeOutlined /> {t.sourceTab}</>} key="source">
          <Card>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{sourceCode}</code>
            </pre>
          </Card>
        </TabPane>
      </Tabs>
    </Space>
  )
}
