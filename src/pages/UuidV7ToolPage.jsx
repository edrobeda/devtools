import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, InputNumber, Switch, Tabs,
  Alert, Collapse, List, Tag, message, Checkbox,
} from 'antd'
import {
  IdcardOutlined, CopyOutlined, ReloadOutlined,
  CheckCircleOutlined, FieldTimeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  generateUuidV7,
  generateUuidV7Batch,
  decodeUuidV7,
  isValidUuid,
  isValidUuidV7,
  normalizeUuid,
  formatUuidV7Timestamp,
} from '../utils/uuidv7Tool'
import {
  generateUlids,
  parseUlid,
  isValidUlid,
  formatUlidTimestamp,
} from '../utils/ulidTool'

const { Title, Paragraph, Text } = Typography

const SOURCE_CODE_UUID = `// src/utils/uuidv7Tool.js — resumo da implementação
const UUID_V7_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\$/

function formatUuid(bytes) {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return \`\${hex.slice(0, 8)}-\${hex.slice(8, 12)}-\${hex.slice(12, 16)}-\${hex.slice(16, 20)}-\${hex.slice(20, 32)}\`
}

function parseUuid(uuid) {
  const cleaned = uuid.replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{32}\$/.test(cleaned)) throw new Error('Invalid UUID format')
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export function generateUuidV7(timestampMs = Date.now()) {
  const now = Math.max(0, Math.floor(timestampMs))
  const rand = crypto.getRandomValues(new Uint8Array(10))
  const bytes = new Uint8Array(16)

  bytes[0] = (now >> 40) & 0xff
  bytes[1] = (now >> 32) & 0xff
  bytes[2] = (now >> 24) & 0xff
  bytes[3] = (now >> 16) & 0xff
  bytes[4] = (now >> 8) & 0xff
  bytes[5] = now & 0xff

  bytes[6] = (rand[0] & 0x0f) | 0x70  // version 7
  bytes[7] = rand[1]
  bytes[8] = (rand[2] & 0x3f) | 0x80  // variant 10
  bytes[9] = rand[3]
  bytes[10] = rand[4]
  bytes[11] = rand[5]
  bytes[12] = rand[6]
  bytes[13] = rand[7]
  bytes[14] = rand[8]
  bytes[15] = rand[9]

  return formatUuid(bytes)
}

export function decodeUuidV7(uuid) {
  const bytes = parseUuid(uuid)
  const version = (bytes[6] >> 4) & 0x0f
  const variant = (bytes[8] >> 6) & 0x03

  if (version !== 7) return { valid: false, error: \`Expected version 7, got \${version}\` }
  if (variant !== 2) return { valid: false, error: \`Expected variant 10, got \${variant}\` }

  const timestampMs =
    (BigInt(bytes[0]) << 40n) |
    (BigInt(bytes[1]) << 32n) |
    (BigInt(bytes[2]) << 24n) |
    (BigInt(bytes[3]) << 16n) |
    (BigInt(bytes[4]) << 8n) |
    BigInt(bytes[5])

  return {
    valid: true,
    version,
    variant,
    timestampMs: Number(timestampMs),
    date: new Date(Number(timestampMs)),
    randA: ((bytes[6] & 0x0f) << 8) | bytes[7],
    randB: /* 62 bits from bytes 8..15 */,
  }
}
`

const SOURCE_CODE_ULID = `// src/utils/ulidTool.js — resumo da implementação
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const MASK_80 = (1n << 80n) - 1n
const MASK_128 = (1n << 128n) - 1n
const MAX_TIMESTAMP = (1n << 48n) - 1n

function encodeBase32(value, length = 26) {
  let chars = ''
  let remaining = value
  while (remaining > 0n) {
    chars = CROCKFORD[Number(remaining % 32n)] + chars
    remaining = remaining / 32n
  }
  return chars.padStart(length, '0')
}

function decodeBase32(str) {
  const map = Object.fromEntries([...CROCKFORD].map((c, i) => [c, BigInt(i)]))
  let value = 0n
  for (const char of str) value = value * 32n + map[char]
  return value
}

function random80Bits() {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)
  return value & MASK_80
}

export function generateUlid(timestampMs = Date.now(), random) {
  const timestamp = BigInt(timestampMs) & MAX_TIMESTAMP
  const randomPart = random === undefined ? random80Bits() : random & MASK_80
  return encodeBase32(((timestamp << 80n) | randomPart) & MASK_128)
}

export function generateUlids(count, options = {}) {
  const { timestampMs = Date.now(), monotonic = false } = options
  let ts = BigInt(timestampMs) & MAX_TIMESTAMP
  let rnd = random80Bits()
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(encodeBase32(((ts << 80n) | rnd) & MASK_128))
    if (monotonic) {
      rnd = (rnd + 1n) & MASK_80
      if (rnd === 0n) { ts = (ts + 1n) & MAX_TIMESTAMP; rnd = random80Bits() }
    } else {
      rnd = random80Bits()
    }
  }
  return out
}

export function parseUlid(ulid) {
  const value = decodeBase32(ulid.toUpperCase())
  return {
    timestampMs: Number(value >> 80n),
    random: value & MASK_80,
    uuid: bigIntToUuid(value),
  }
}

export function ulidToUuid(ulid) {
  return parseUlid(ulid).uuid
}

export function uuidToUlid(uuid) {
  const cleaned = uuid.replace(/-/g, '')
  return encodeBase32(BigInt('0x' + cleaned) & MASK_128)
}
`

const UUID_HEX_RE = /^[0-9a-fA-F]{32}$/
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

const translations = {
  pt: {
    title: 'Gerador / Decoder de UUID v7 & ULID',
    intro: (
      <>
        Gere e decodifique identificadores{' '}
        <Text code>UUID v7</Text> (RFC 9562) e{' '}
        <Text code>ULID</Text> diretamente no navegador. Ambos são de 128 bits
        com 48 bits de timestamp + bits aleatórios, e são lexicograficamente
        ordenáveis por data de criação. A diferença está na codificação: UUID v7
        usa hexadecimal (36 chars com hífens), ULID usa base32 Crockford (26
        chars). Nada sai do dispositivo.
      </>
    ),
    generateTitle: 'Gerar UUIDs v7',
    singleTitle: 'UUID v7 único',
    singleGenerate: 'Gerar outro',
    batchTitle: 'Geração em lote (UUID v7)',
    ulidGenerateTitle: 'Gerar ULIDs',
    countLabel: 'Quantidade',
    monotonicLabel: 'Modo monotônico (ordenação garantida no mesmo ms)',
    uppercaseLabel: 'Maiúsculas',
    noDashesLabel: 'Sem hífens',
    generate: 'Gerar lote',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyAll: 'Copiar todos',
    emptyList: 'Clique em Gerar para criar UUIDs v7.',
    ulidEmptyList: 'Clique em Gerar para criar ULIDs.',
    decodeTitle: 'Decodificar UUID v7 ou ULID',
    decodePlaceholder: 'Cole um UUID v7 ou ULID aqui',
    decodeButton: 'Decodificar',
    invalidInput: 'Entrada inválida — formato UUID (8-4-4-4-12 ou 32 hex) ou ULID (26 chars base32).',
    notV7: 'Esse UUID não é versão 7.',
    invalidUlid: 'ULID inválido — 26 caracteres base32 Crockford.',
    versionLabel: 'Versão',
    variantLabel: 'Variante',
    timestampLabel: 'Timestamp (ms)',
    dateLabel: 'Data/hora',
    randALabel: 'rand_a (12 bits)',
    randBLabel: 'rand_b (62 bits)',
    randomLabel: 'Componente aleatório',
    uuidLabel: 'UUID equivalente',
    ulidLabel: 'ULID equivalente',
    structureTitle: 'Estrutura do UUID v7',
    structureBody: (
      <>
        Os 128 bits de um UUID v7 são divididos em:{' '}
        <Text code>48 bits de timestamp</Text> (Unix ms, big-endian),{' '}
        <Text code>4 bits de versão = 7</Text>,{' '}
        <Text code>12 bits rand_a</Text>,{' '}
        <Text code>2 bits de variante = 10</Text> e{' '}
        <Text code>62 bits rand_b</Text>. O 13º caractere da string é sempre{' '}
        <Text code>7</Text>; o primeiro caractere do quarto grupo está entre{' '}
        <Text code>8</Text> e <Text code>b</Text> (bits <Text code>10</Text>).
      </>
    ),
    ulidStructureTitle: 'Estrutura do ULID',
    ulidStructureBody: (
      <>
        Os 128 bits de um ULID são divididos em:{' '}
        <Text code>48 bits de timestamp</Text> (Unix ms) e{' '}
        <Text code>80 bits aleatórios</Text>, codificados em base32 Crockford
        de 26 caracteres. A primeira metade (10 chars) representa o timestamp,
        e a segunda metade (16 chars) os bits aleatórios.
      </>
    ),
    sourceTitle: 'Código-fonte dos motores',
    sourceUuid: 'Motor UUID v7',
    sourceUlid: 'Motor ULID',
    sortWarning: 'No modo monotônico o componente aleatório é incrementado a cada ID gerado no mesmo milissegundo, preservando a ordenação lexicográfica.',
  },
  en: {
    title: 'UUID v7 & ULID Generator / Decoder',
    intro: (
      <>
        Generate and decode{' '}
        <Text code>UUID v7</Text> (RFC 9562) and{' '}
        <Text code>ULID</Text> identifiers right in the browser. Both are 128-bit
        values with a 48-bit timestamp + random bits, and are lexicographically
        sortable by creation time. The difference is encoding: UUID v7 uses hex
        (36 chars with dashes), ULID uses Crockford base32 (26 chars). Nothing
        leaves the device.
      </>
    ),
    generateTitle: 'Generate UUIDs v7',
    singleTitle: 'Single UUID v7',
    singleGenerate: 'Generate another',
    batchTitle: 'Batch generation (UUID v7)',
    ulidGenerateTitle: 'Generate ULIDs',
    countLabel: 'Count',
    monotonicLabel: 'Monotonic mode (guaranteed order within the same ms)',
    uppercaseLabel: 'Uppercase',
    noDashesLabel: 'No dashes',
    generate: 'Generate batch',
    copy: 'Copy',
    copied: 'Copied!',
    copyAll: 'Copy all',
    emptyList: 'Click Generate to create v7 UUIDs.',
    ulidEmptyList: 'Click Generate to create ULIDs.',
    decodeTitle: 'Decode UUID v7 or ULID',
    decodePlaceholder: 'Paste a UUID v7 or ULID here',
    decodeButton: 'Decode',
    invalidInput: 'Invalid input — expected UUID (8-4-4-4-12 or 32 hex) or ULID (26 Crockford base32 chars).',
    notV7: 'This UUID is not version 7.',
    invalidUlid: 'Invalid ULID — 26 Crockford base32 characters.',
    versionLabel: 'Version',
    variantLabel: 'Variant',
    timestampLabel: 'Timestamp (ms)',
    dateLabel: 'Date/time',
    randALabel: 'rand_a (12 bits)',
    randBLabel: 'rand_b (62 bits)',
    randomLabel: 'Random component',
    uuidLabel: 'Equivalent UUID',
    ulidLabel: 'Equivalent ULID',
    structureTitle: 'UUID v7 structure',
    structureBody: (
      <>
        A UUID v7 splits its 128 bits into:{' '}
        <Text code>48-bit timestamp</Text> (Unix ms, big-endian),{' '}
        <Text code>4-bit version = 7</Text>,{' '}
        <Text code>12-bit rand_a</Text>,{' '}
        <Text code>2-bit variant = 10</Text> and{' '}
        <Text code>62-bit rand_b</Text>. The 13th character of the string is
        always <Text code>7</Text>; the first character of the fourth group
        is between <Text code>8</Text> and <Text code>b</Text> (bits{' '}
        <Text code>10</Text>).
      </>
    ),
    ulidStructureTitle: 'ULID structure',
    ulidStructureBody: (
      <>
        A ULID splits its 128 bits into:{' '}
        <Text code>48-bit timestamp</Text> (Unix ms) and{' '}
        <Text code>80 random bits</Text>, encoded as 26 Crockford base32
        characters. The first half (10 chars) represents the timestamp,
        and the second half (16 chars) the random bits.
      </>
    ),
    sourceTitle: 'Engine source code',
    sourceUuid: 'UUID v7 engine',
    sourceUlid: 'ULID engine',
    sortWarning: 'In monotonic mode the random component is incremented for each ID generated within the same millisecond, keeping lexicographic sort order.',
  },
}

function formatOutput(ids, { uppercase, noDashes }) {
  return ids.map((id) => {
    let out = id
    if (uppercase) out = out.toUpperCase()
    if (noDashes) out = out.replace(/-/g, '')
    return out
  })
}

export default function UuidV7ToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'

  const [single, setSingle] = useState(() => generateUuidV7())
  const [count, setCount] = useState(5)
  const [monotonic, setMonotonic] = useState(false)
  const [uppercase, setUppercase] = useState(false)
  const [noDashes, setNoDashes] = useState(false)
  const [batch, setBatch] = useState([])

  const [ulidCount, setUlidCount] = useState(5)
  const [ulidMonotonic, setUlidMonotonic] = useState(false)
  const [ulidItems, setUlidItems] = useState([])

  const [decodeInput, setDecodeInput] = useState('')
  const [decoded, setDecoded] = useState(null)
  const [decodeError, setDecodeError] = useState('')

  const handleSingle = () => setSingle(generateUuidV7())

  const handleBatch = () => {
    const items = generateUuidV7Batch(count, { monotonic })
    setBatch(formatOutput(items, { uppercase, noDashes }))
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const handleCopyAll = (items) => {
    navigator.clipboard.writeText(items.join('\n'))
    message.success(t.copied)
  }

  const handleUlidGenerate = () => {
    const validCount = Math.min(100, Math.max(1, Number(ulidCount) || 1))
    setUlidCount(validCount)
    setUlidItems(generateUlids(validCount, { monotonic: ulidMonotonic }))
  }

  const handleDecode = () => {
    setDecoded(null)
    setDecodeError('')
    const value = decodeInput.trim()
    if (!value) return

    if (isValidUlid(value)) {
      const parsed = parseUlid(value)
      setDecoded({
        type: 'ulid',
        value: value.toUpperCase(),
        timestampMs: parsed.timestampMs,
        random: parsed.random,
        uuid: parsed.uuid,
      })
      return
    }

    const normalized = normalizeUuid(value)
    if (normalized && isValidUuid(normalized)) {
      if (isValidUuidV7(normalized)) {
        const result = decodeUuidV7(normalized)
        if (result.valid) {
          setDecoded({
            type: 'uuid-v7',
            value: normalized,
            version: result.version,
            variant: result.variant,
            timestampMs: result.timestampMs,
            randA: result.randA,
            randB: result.randB,
          })
          return
        }
      }
      setDecodeError(t.notV7)
      return
    }

    setDecodeError(t.invalidInput)
  }

  const decodedTime = useMemo(() => {
    if (!decoded) return null
    if (decoded.type === 'ulid') return formatUlidTimestamp(decoded.timestampMs, locale)
    return formatUuidV7Timestamp(decoded.timestampMs, locale)
  }, [decoded, locale])

  const singleDisplay = useMemo(() => {
    let out = single
    if (uppercase) out = out.toUpperCase()
    if (noDashes) out = out.replace(/-/g, '')
    return out
  }, [single, uppercase, noDashes])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.singleTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 1 }}>
            <Text code copyable>{singleDisplay}</Text>
          </div>
          <Space wrap>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleSingle}>
              {t.singleGenerate}
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => handleCopy(singleDisplay)}>
              {t.copy}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title={t.batchTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text strong>{t.countLabel}</Text>
              <InputNumber
                min={1}
                max={1000}
                value={count}
                onChange={setCount}
                style={{ width: 120 }}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text strong>&nbsp;</Text>
              <Switch
                checked={monotonic}
                onChange={setMonotonic}
                checkedChildren="Mono"
                unCheckedChildren="Normal"
              />
            </Space>
            <Text style={{ alignSelf: 'center' }}>{t.monotonicLabel}</Text>
          </Space>

          <Space wrap>
            <Checkbox checked={uppercase} onChange={(e) => setUppercase(e.target.checked)}>
              {t.uppercaseLabel}
            </Checkbox>
            <Checkbox checked={noDashes} onChange={(e) => setNoDashes(e.target.checked)}>
              {t.noDashesLabel}
            </Checkbox>
          </Space>

          <Button type="primary" icon={<ReloadOutlined />} onClick={handleBatch}>
            {t.generate}
          </Button>

          {monotonic && <Alert type="info" showIcon message={t.sortWarning} />}

          {batch.length > 0 ? (
            <>
              <List
                bordered
                size="small"
                dataSource={batch}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="copy"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(item)}
                      >
                        {t.copy}
                      </Button>,
                    ]}
                  >
                    <Text code style={{ fontSize: 14, letterSpacing: 1 }}>{item}</Text>
                  </List.Item>
                )}
              />
              <Button icon={<CopyOutlined />} onClick={() => handleCopyAll(batch)}>
                {t.copyAll}
              </Button>
            </>
          ) : (
            <Paragraph type="secondary">{t.emptyList}</Paragraph>
          )}
        </Space>
      </Card>

      <Card title={t.ulidGenerateTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text strong>{t.countLabel}</Text>
              <InputNumber
                min={1}
                max={100}
                value={ulidCount}
                onChange={setUlidCount}
                style={{ width: 120 }}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text strong>&nbsp;</Text>
              <Switch
                checked={ulidMonotonic}
                onChange={setUlidMonotonic}
                checkedChildren="Mono"
                unCheckedChildren="Normal"
              />
            </Space>
            <Text style={{ alignSelf: 'center' }}>{t.monotonicLabel}</Text>
          </Space>

          <Button type="primary" icon={<ReloadOutlined />} onClick={handleUlidGenerate}>
            {t.generate}
          </Button>

          {ulidMonotonic && <Alert type="info" showIcon message={t.sortWarning} />}

          {ulidItems.length > 0 ? (
            <>
              <List
                bordered
                size="small"
                dataSource={ulidItems}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="copy"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(item)}
                      >
                        {t.copy}
                      </Button>,
                    ]}
                  >
                    <Text code style={{ fontSize: 14, letterSpacing: 1 }}>{item}</Text>
                  </List.Item>
                )}
              />
              <Button icon={<CopyOutlined />} onClick={() => handleCopyAll(ulidItems)}>
                {t.copyAll}
              </Button>
            </>
          ) : (
            <Paragraph type="secondary">{t.ulidEmptyList}</Paragraph>
          )}
        </Space>
      </Card>

      <Card title={t.decodeTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.target.value)}
            placeholder={t.decodePlaceholder}
            onPressEnter={handleDecode}
          />
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleDecode}>
            {t.decodeButton}
          </Button>

          {decodeError && <Alert type="error" showIcon message={decodeError} />}

          {decoded && decodedTime && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {decoded.type === 'ulid' && (
                <>
                  <div><Text strong>{t.ulidLabel}:</Text> <Text code copyable>{decoded.value}</Text></div>
                  <div><Text strong>{t.uuidLabel}:</Text> <Text code copyable>{decoded.uuid}</Text></div>
                </>
              )}
              {decoded.type === 'uuid-v7' && (
                <>
                  <div>
                    <Text strong>{t.versionLabel}:</Text>{' '}
                    <Tag color="blue">{decoded.version}</Tag>
                  </div>
                  <div>
                    <Text strong>{t.variantLabel}:</Text>{' '}
                    <Tag color="blue">{decoded.variant}</Tag>
                  </div>
                  <div>
                    <Text strong><FieldTimeOutlined /> {t.timestampLabel}:</Text>{' '}
                    <Tag color="blue">{decoded.timestampMs}</Tag>
                  </div>
                  <div>
                    <Text strong>{t.dateLabel}:</Text>{' '}
                    {decodedTime.local}{' '}
                    <Text type="secondary">({decodedTime.iso})</Text>
                  </div>
                  <div>
                    <Text strong>{t.randALabel}:</Text>{' '}
                    <Text code>0x{decoded.randA.toString(16).padStart(3, '0').toUpperCase()}</Text>
                  </div>
                  <div>
                    <Text strong>{t.randBLabel}:</Text>{' '}
                    <Text code>0x{decoded.randB.toString(16).padStart(16, '0').toUpperCase()}</Text>
                  </div>
                </>
              )}
              {decoded.type === 'ulid' && (
                <>
                  <div><Text strong>{t.timestampLabel}:</Text> <Tag color="blue">{decoded.timestampMs}</Tag></div>
                  <div><Text strong>{t.dateLabel}:</Text> {decodedTime.local} <Text type="secondary">({decodedTime.iso})</Text></div>
                  <div><Text strong>{t.randomLabel}:</Text> <Text code>0x{decoded.random.toString(16).padStart(20, '0').toUpperCase()}</Text></div>
                </>
              )}
            </Space>
          )}
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.structureTitle} description={t.structureBody} />
      <Alert type="info" showIcon message={t.ulidStructureTitle} description={t.ulidStructureBody} />

      <Collapse
        items={[
          {
            key: 'source-uuid',
            label: t.sourceUuid,
            children: (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <pre style={{ margin: 0, padding: 12, background: '#f6f6f6', borderRadius: 6, overflow: 'auto' }}>
                  <code>{SOURCE_CODE_UUID}</code>
                </pre>
              </Space>
            ),
          },
          {
            key: 'source-ulid',
            label: t.sourceUlid,
            children: (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <pre style={{ margin: 0, padding: 12, background: '#f6f6f6', borderRadius: 6, overflow: 'auto' }}>
                  <code>{SOURCE_CODE_ULID}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
