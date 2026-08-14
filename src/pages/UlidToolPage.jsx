import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, InputNumber, Switch,
  Alert, Collapse, List, Tag, message,
} from 'antd'
import {
  IdcardOutlined, CopyOutlined, ReloadOutlined,
  LinkOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  generateUlids,
  parseUlid,
  ulidToUuid,
  uuidToUlid,
  isValidUlid,
  formatUlidTimestamp,
} from '../utils/ulidTool'

const { Title, Paragraph, Text } = Typography

const SOURCE_CODE = `// src/utils/ulidTool.js — resumo da implementação
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

const translations = {
  pt: {
    title: 'Gerador / Decoder de ULID',
    intro: (
      <>
        Gere e decodifique identificadores{' '}
        <Text code>ULID</Text> diretamente no navegador. ULIDs são de 128 bits
        (48 bits de timestamp + 80 bits aleatórios), codificados em base32
        Crockford de 26 caracteres, e são lexicograficamente ordenáveis.
        Nada sai do dispositivo.
      </>
    ),
    generateTitle: 'Gerar ULIDs',
    countLabel: 'Quantidade',
    monotonicLabel: 'Modo monotônico (mesmo timestamp, random incrementado)',
    generate: 'Gerar',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyAll: 'Copiar todos',
    emptyList: 'Clique em Gerar para criar ULIDs.',
    decodeTitle: 'Decodificar ULID ou UUID',
    decodePlaceholder: 'Cole um ULID ou UUID aqui',
    decodeButton: 'Decodificar',
    invalidUlid: 'ULID inválido — 26 caracteres base32 Crockford.',
    invalidUuid: 'UUID inválido — formato 8-4-4-4-12 ou 32 hex.',
    timestampLabel: 'Timestamp (ms)',
    dateLabel: 'Data/hora',
    randomLabel: 'Componente aleatório',
    uuidLabel: 'UUID equivalente',
    ulidLabel: 'ULID equivalente',
    infoTitle: 'Por que ULID?',
    infoBody: (
      <>
        ULID combina a unicidade de um UUID com a ordenação de um timestamp: ao
        ordenar strings de ULIDs, você também ordena por data de criação. Isso
        é útil para chaves de banco, logs e eventos. O modo monotônico garante
        ordenação mesmo quando vários IDs são gerados no mesmo milissegundo.
      </>
    ),
    sourceTitle: 'Código-fonte do motor',
    sourceBody: 'O motor é puro JavaScript client-side em src/utils/ulidTool.js: codificação/decodificação base32 Crockford, geração de 80 bits com crypto.getRandomValues e aritmética de 128 bits via BigInt.',
    sortWarning: 'Use o modo monotônico para garantir que vários IDs gerados no mesmo milissegundo mantenham a ordenação lexicográfica.',
  },
  en: {
    title: 'ULID Generator / Decoder',
    intro: (
      <>
        Generate and decode{' '}
        <Text code>ULID</Text> identifiers right in the browser. ULIDs are
        128-bit values (48-bit timestamp + 80-bit randomness) encoded as 26
        Crockford base32 characters, and they are lexicographically sortable.
        Nothing leaves the device.
      </>
    ),
    generateTitle: 'Generate ULIDs',
    countLabel: 'Count',
    monotonicLabel: 'Monotonic mode (same timestamp, incremented random)',
    generate: 'Generate',
    copy: 'Copy',
    copied: 'Copied!',
    copyAll: 'Copy all',
    emptyList: 'Click Generate to create ULIDs.',
    decodeTitle: 'Decode ULID or UUID',
    decodePlaceholder: 'Paste a ULID or UUID here',
    decodeButton: 'Decode',
    invalidUlid: 'Invalid ULID — 26 Crockford base32 characters.',
    invalidUuid: 'Invalid UUID — expected 8-4-4-4-12 or 32 hex digits.',
    timestampLabel: 'Timestamp (ms)',
    dateLabel: 'Date/time',
    randomLabel: 'Random component',
    uuidLabel: 'Equivalent UUID',
    ulidLabel: 'Equivalent ULID',
    infoTitle: 'Why ULID?',
    infoBody: (
      <>
        ULID combines the uniqueness of a UUID with the sortability of a
        timestamp: sorting ULID strings also sorts them by creation time. This
        is useful for database keys, logs and events. Monotonic mode keeps the
        order intact even when several IDs are generated in the same
        millisecond.
      </>
    ),
    sourceTitle: 'Engine source code',
    sourceBody: 'The engine is pure client-side JavaScript in src/utils/ulidTool.js: Crockford base32 encode/decode, 80-bit random generation using crypto.getRandomValues and 128-bit arithmetic via BigInt.',
    sortWarning: 'Use monotonic mode to ensure multiple IDs generated in the same millisecond remain lexicographically sortable.',
  },
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const UUID_HEX_RE = /^[0-9a-fA-F]{32}$/

export default function UlidToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [count, setCount] = useState(5)
  const [monotonic, setMonotonic] = useState(false)
  const [items, setItems] = useState([])

  const [decodeInput, setDecodeInput] = useState('')
  const [decoded, setDecoded] = useState(null)
  const [decodeError, setDecodeError] = useState('')

  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'

  const handleGenerate = () => {
    const validCount = Math.min(100, Math.max(1, Number(count) || 1))
    setCount(validCount)
    setItems(generateUlids(validCount, { monotonic }))
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(items.join('\n'))
    message.success(t.copied)
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

    if (UUID_RE.test(value) || UUID_HEX_RE.test(value)) {
      try {
        const ulid = uuidToUlid(value)
        const parsed = parseUlid(ulid)
        setDecoded({
          type: 'uuid',
          value: value,
          ulid,
          timestampMs: parsed.timestampMs,
          random: parsed.random,
          uuid: parsed.uuid,
        })
      } catch (err) {
        setDecodeError(err.message || t.invalidUuid)
      }
      return
    }

    setDecodeError(t.invalidUlid)
  }

  const decodedTime = useMemo(() => {
    if (!decoded) return null
    return formatUlidTimestamp(decoded.timestampMs, locale)
  }, [decoded, locale])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.generateTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text strong>{t.countLabel}</Text>
              <InputNumber
                min={1}
                max={100}
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
                checkedChildren={lang === 'pt' ? 'Mono' : 'Mono'}
                unCheckedChildren={lang === 'pt' ? 'Normal' : 'Normal'}
              />
            </Space>
            <Text style={{ alignSelf: 'center' }}>{t.monotonicLabel}</Text>
          </Space>

          <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>
            {t.generate}
          </Button>

          {monotonic && (
            <Alert type="info" showIcon message={t.sortWarning} />
          )}

          {items.length > 0 ? (
            <>
              <List
                bordered
                size="small"
                dataSource={items}
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
              <Button icon={<CopyOutlined />} onClick={handleCopyAll}>
                {t.copyAll}
              </Button>
            </>
          ) : (
            <Paragraph type="secondary">{t.emptyList}</Paragraph>
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
              {decoded.type === 'uuid' && (
                <>
                  <div><Text strong>{t.uuidLabel}:</Text> <Text code copyable>{decoded.value}</Text></div>
                  <div><Text strong>{t.ulidLabel}:</Text> <Text code copyable>{decoded.ulid}</Text></div>
                </>
              )}
              <div><Text strong>{t.timestampLabel}:</Text> <Tag color="blue">{decoded.timestampMs}</Tag></div>
              <div><Text strong>{t.dateLabel}:</Text> {decodedTime.local} <Text type="secondary">({decodedTime.iso})</Text></div>
              <div><Text strong>{t.randomLabel}:</Text> <Text code>0x{decoded.random.toString(16).padStart(20, '0').toUpperCase()}</Text></div>
            </Space>
          )}
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.infoTitle} description={t.infoBody} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, padding: 12, background: '#f6f6f6', borderRadius: 6, overflow: 'auto' }}>
                  <code>{SOURCE_CODE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
