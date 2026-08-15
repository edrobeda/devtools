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
  NumberOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  FORMATS,
  OUI_PRESETS,
  normalize,
  isValid,
  formatMac,
  getMacInfo,
  generateMac,
  generateMultiple,
} from '../utils/macAddressTool'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

const sourceCode = `// src/utils/macAddressTool.js (resumo)
export const FORMATS = {
  colon:  '00:1a:2b:3c:4d:5e',
  hyphen: '00-1a-2b-3c-4d-5e',
  dot:    '001a.2b3c.4d5e',
  raw:    '001a2b3c4d5e',
}

export function normalize(mac) {
  return mac.toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 12)
}

export function isValid(mac) {
  const clean = normalize(mac)
  return /^[0-9a-f]{12}$/.test(clean)
}

export function formatMac(mac, format = 'colon') {
  const clean = normalize(mac)
  if (clean.length !== 12) return clean
  switch (format) {
    case 'hyphen': return clean.match(/.{2}/g).join('-')
    case 'dot':    return clean.match(/.{4}/g).join('.')
    case 'raw':    return clean
    default:       return clean.match(/.{2}/g).join(':')
  }
}

export function applyFirstByteFlags(byte, { local, multicast }) {
  let b = parseInt(byte, 16) & 0xfc
  if (local) b |= 0x02
  if (multicast) b |= 0x01
  return b.toString(16).padStart(2, '0')
}

function randomHexByte() {
  return Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
}

export function generateMac({ format = 'colon', local = true, multicast = false, prefix = '' } = {}) {
  const prefixBytes = normalize(prefix).slice(0, 12).match(/.{2}/g) || []
  const bytes = [...prefixBytes]
  while (bytes.length < 6) bytes.push(randomHexByte())
  bytes[0] = applyFirstByteFlags(bytes[0], { local, multicast })
  return formatMac(bytes.join(''), format)
}`

const formatOptions = Object.values(FORMATS).map((f) => ({
  label: f.label,
  value: f.id,
}))

const formatOptionsPt = Object.values(FORMATS).map((f) => ({
  label: f.labelPt,
  value: f.id,
}))

const translations = {
  pt: {
    title: 'Gerador / Validador de Endereço MAC',
    intro: (
      <>
        Gere endereços MAC (EUI-48) válidos e valide endereços existentes
        100% no navegador. Controle o formato de saída, escolha um prefixo/OUI
        conhecido (VMware, VirtualBox, Docker, etc.) e consulte as flags do
        primeiro byte — <Text code>local</Text> vs <Text code>universal</Text>{' '}
        e <Text code>unicast</Text> vs <Text code>multicast</Text>.
      </>
    ),
    generateTab: 'Gerar',
    validateTab: 'Validar',
    sourceTab: 'Código-fonte',
    formatLabel: 'Formato',
    prefixLabel: 'Prefixo / OUI',
    prefixHelp: 'Ex.: 00:50:56 para VMware. Apenas os bytes iniciais serão usados.',
    countLabel: 'Quantidade',
    localLabel: 'Localmente administrado (bit U/L ligado)',
    multicastLabel: 'Multicast (bit IG ligado)',
    uppercaseLabel: 'Maiúsculas',
    generateBtn: 'Gerar',
    generateMoreBtn: 'Gerar mais',
    copyBtn: 'Copiar',
    copied: 'Copiado!',
    noDuplicates: 'Evitar duplicados',
    resultsTitle: 'Endereços gerados',
    emptyResults: 'Clique em "Gerar" para criar endereços MAC.',
    validatePlaceholder: 'Cole um MAC em qualquer formato...',
    validateBtn: 'Validar',
    valid: 'Endereço MAC válido',
    invalid: 'Endereço MAC inválido',
    normalized: 'Normalizado',
    formattedAs: 'Formatos',
    ouiLabel: 'OUI',
    scopeLabel: 'Escopo',
    transmissionLabel: 'Transmissão',
    universal: 'Universal (OUI atribuído)',
    locallyAdministered: 'Localmente administrado',
    unicast: 'Unicast',
    multicast: 'Multicast',
    firstByte: 'Primeiro byte',
    binary: 'Binário',
    localBit: 'bit local (U/L)',
    multicastBit: 'bit multicast (IG)',
    yes: 'ligado',
    no: 'desligado',
    note: (
      <>
        O primeiro byte de um MAC codifica dois bits especiais: IG (bit 0) e
        U/L (bit 1). Para endereços de uso local em VMs/containers, deixe o
        bit U/L ligado para evitar colisão com OUIs atribuídos oficialmente.
      </>
    ),
  },
  en: {
    title: 'MAC Address Generator / Validator',
    intro: (
      <>
        Generate valid MAC addresses (EUI-48) and validate existing ones
        entirely in the browser. Control the output format, pick a known
        prefix/OUI (VMware, VirtualBox, Docker, etc.) and inspect the first
        byte flags — <Text code>local</Text> vs <Text code>universal</Text>{' '}
        and <Text code>unicast</Text> vs <Text code>multicast</Text>.
      </>
    ),
    generateTab: 'Generate',
    validateTab: 'Validate',
    sourceTab: 'Source code',
    formatLabel: 'Format',
    prefixLabel: 'Prefix / OUI',
    prefixHelp: 'E.g.: 00:50:56 for VMware. Only the leading bytes are used.',
    countLabel: 'Quantity',
    localLabel: 'Locally administered (U/L bit set)',
    multicastLabel: 'Multicast (IG bit set)',
    uppercaseLabel: 'Uppercase',
    generateBtn: 'Generate',
    generateMoreBtn: 'Generate more',
    copyBtn: 'Copy',
    copied: 'Copied!',
    noDuplicates: 'Avoid duplicates',
    resultsTitle: 'Generated addresses',
    emptyResults: 'Click "Generate" to create MAC addresses.',
    validatePlaceholder: 'Paste a MAC address in any format...',
    validateBtn: 'Validate',
    valid: 'Valid MAC address',
    invalid: 'Invalid MAC address',
    normalized: 'Normalized',
    formattedAs: 'Formats',
    ouiLabel: 'OUI',
    scopeLabel: 'Scope',
    transmissionLabel: 'Transmission',
    universal: 'Universal (assigned OUI)',
    locallyAdministered: 'Locally administered',
    unicast: 'Unicast',
    multicast: 'Multicast',
    firstByte: 'First byte',
    binary: 'Binary',
    localBit: 'local bit (U/L)',
    multicastBit: 'multicast bit (IG)',
    yes: 'set',
    no: 'unset',
    note: (
      <>
        The first byte of a MAC address encodes two special bits: IG (bit 0)
        and U/L (bit 1). For local-use addresses in VMs/containers, keep the
        U/L bit set to avoid colliding with officially assigned OUIs.
      </>
    ),
  },
}

function GenerateSection({ t, lang }) {
  const [format, setFormat] = useState('colon')
  const [prefix, setPrefix] = useState('')
  const [count, setCount] = useState(5)
  const [local, setLocal] = useState(true)
  const [multicast, setMulticast] = useState(false)
  const [upperCase, setUpperCase] = useState(false)
  const [avoidDuplicates, setAvoidDuplicates] = useState(true)
  const [macs, setMacs] = useState([])
  const [copied, setCopied] = useState(false)

  const options = useMemo(
    () => ({ format, local, multicast, prefix, upperCase }),
    [format, local, multicast, prefix, upperCase]
  )

  const handleGenerate = () => {
    const next = avoidDuplicates
      ? generateMultiple(count, options)
      : Array.from({ length: count }, () => generateMac(options))
    setMacs(next)
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(macs.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{t.formatLabel}</Text>
            <Select
              value={format}
              onChange={setFormat}
              options={lang === 'pt' ? formatOptionsPt : formatOptions}
              style={{ width: '100%' }}
            />
          </Space>
        </Col>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{t.prefixLabel}</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                value={prefix}
                onChange={setPrefix}
                options={OUI_PRESETS.map((p) => ({
                  label: lang === 'pt' ? p.labelPt : p.label,
                  value: p.value,
                }))}
                style={{ width: '40%' }}
                allowClear
                placeholder={t.prefixHelp}
              />
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder={t.prefixHelp}
                style={{ width: '60%' }}
              />
            </Space.Compact>
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
            <Checkbox checked={local} onChange={(e) => setLocal(e.target.checked)}>
              {t.localLabel}
            </Checkbox>
            <Checkbox checked={multicast} onChange={(e) => setMulticast(e.target.checked)}>
              {t.multicastLabel}
            </Checkbox>
            <Space>
              <Checkbox checked={upperCase} onChange={(e) => setUpperCase(e.target.checked)}>
                {t.uppercaseLabel}
              </Checkbox>
              <Checkbox checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)}>
                {t.noDuplicates}
              </Checkbox>
            </Space>
          </Space>
        </Col>
      </Row>

      <Space wrap>
        <Button type="primary" icon={<RedoOutlined />} onClick={handleGenerate}>
          {t.generateBtn}
        </Button>
        <Button icon={<CopyOutlined />} disabled={macs.length === 0} onClick={handleCopyAll}>
          {copied ? t.copied : t.copyBtn}
        </Button>
      </Space>

      <Card title={t.resultsTitle} size="small">
        <List
          bordered
          size="small"
          locale={{ emptyText: t.emptyResults }}
          dataSource={macs}
          renderItem={(mac) => (
            <List.Item
              actions={[
                <Button
                  key="copy"
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => navigator.clipboard.writeText(mac)}
                />,
              ]}
            >
              <Text code copyable={{ text: mac }}>{mac}</Text>
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
    setInfo(getMacInfo(input))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleValidate()
  }

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
          description={!info.valid && <Text code>{normalize(input) || input}</Text>}
        />
      )}

      {info?.valid && (
        <Card size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title={t.normalized}
                  value={info.clean.toUpperCase()}
                  valueStyle={{ fontSize: 16, fontFamily: 'monospace' }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title={t.ouiLabel}
                  value={info.oui}
                  valueStyle={{ fontSize: 16, fontFamily: 'monospace' }}
                />
              </Col>
            </Row>

            <Text strong>{t.formattedAs}</Text>
            <Space wrap>
              {Object.entries(info.formatted).map(([fmt, value]) => (
                <Tag key={fmt} color="blue">
                  {fmt}: <Text code copyable={{ text: value }}>{value}</Text>
                </Tag>
              ))}
            </Space>

            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <Text strong>{t.scopeLabel}:</Text>{' '}
                <Tag color={info.type.scope === 'locallyAdministered' ? 'orange' : 'green'}>
                  {t[info.type.scope]}
                </Tag>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>{t.transmissionLabel}:</Text>{' '}
                <Tag color={info.type.transmission === 'multicast' ? 'purple' : 'cyan'}>
                  {t[info.type.transmission]}
                </Tag>
              </Col>
            </Row>

            <Card size="small" title={t.firstByte} style={{ background: 'rgba(0,0,0,0.02)' }}>
              <Space direction="vertical" size="small">
                <Text code>{info.bits.firstByteHex}</Text>
                <Text code>{info.bits.firstByteBinary}</Text>
                <Space wrap>
                  <Tag color={info.bits.localBitSet ? 'orange' : 'default'}>
                    {t.localBit}: {info.bits.localBitSet ? t.yes : t.no}
                  </Tag>
                  <Tag color={info.bits.multicastBitSet ? 'purple' : 'default'}>
                    {t.multicastBit}: {info.bits.multicastBitSet ? t.yes : t.no}
                  </Tag>
                </Space>
              </Space>
            </Card>
          </Space>
        </Card>
      )}

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function MacAddressToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><NumberOutlined /> {t.title}</Title>
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
