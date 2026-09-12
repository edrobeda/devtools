import React, { useState } from 'react'
import {
  Typography, Card, Space, Input, Button, InputNumber, Select, List,
  Alert, Divider, message, Tag, Collapse,
} from 'antd'
import {
  IdcardOutlined, CopyOutlined, ReloadOutlined, CheckCircleOutlined,
  FieldTimeOutlined, DatabaseOutlined, HddOutlined, NumberOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Snowflake (Twitter/X): inteiro de 64 bits — 1 bit de sinal (0), 41 bits de
// timestamp (ms desde um epoch custom), 5 bits de datacenter, 5 bits de worker
// e 12 bits de sequence. Discord usa o mesmo layout com epoch próprio
// (1420070400000, 2015-01-01) e 42 bits úteis de timestamp (consome a
// "margem" do bit de sinal).
const TWITTER_EPOCH_MS = 1288834974657 // 2010-11-04T01:42:54.657Z
const DISCORD_EPOCH_MS = 1420070400000 // 2015-01-01T00:00:00.000Z

const TIMESTAMP_BITS = 41
const DATACENTER_BITS = 5
const WORKER_BITS = 5
const SEQUENCE_BITS = 12
const DATACENTER_MASK = (1 << DATACENTER_BITS) - 1 // 31
const WORKER_MASK = (1 << WORKER_BITS) - 1 // 31
const SEQUENCE_MASK = (1 << SEQUENCE_BITS) - 1 // 4095
const TIMESTAMP_MASK = (1n << BigInt(TIMESTAMP_BITS)) - 1n

function buildSnowflake({ timestampMs = Date.now(), epochMs, datacenter = 0, worker = 0, sequence = 0 }) {
  const ts = BigInt(Math.max(0, Math.floor(timestampMs))) - BigInt(Math.round(Number(epochMs)))
  return (
    (ts & TIMESTAMP_MASK) << BigInt(DATACENTER_BITS + WORKER_BITS + SEQUENCE_BITS) |
    (BigInt(datacenter & DATACENTER_MASK) << BigInt(WORKER_BITS + SEQUENCE_BITS)) |
    (BigInt(worker & WORKER_MASK) << BigInt(SEQUENCE_BITS)) |
    BigInt(sequence & SEQUENCE_MASK)
  ).toString()
}

function decodeSnowflake(valueStr, epochMs) {
  const value = BigInt(valueStr.trim())
  if (value < 0n || value >= 1n << 63n) {
    throw new Error('out-of-range')
  }
  const tsField = Number((value >> BigInt(DATACENTER_BITS + WORKER_BITS + SEQUENCE_BITS)) & TIMESTAMP_MASK)
  const datacenter = Number((value >> BigInt(WORKER_BITS + SEQUENCE_BITS)) & BigInt(DATACENTER_MASK))
  const worker = Number((value >> BigInt(SEQUENCE_BITS)) & BigInt(WORKER_MASK))
  const sequence = Number(value & BigInt(SEQUENCE_MASK))
  const timestampMs = tsField + Math.round(Number(epochMs))
  return {
    value,
    tsField,
    datacenter,
    worker,
    sequence,
    timestampMs,
    date: new Date(timestampMs),
  }
}

// Exemplo determinístico (2024-03-14T15:09:26.535Z, dc=1, worker=2, seq=0,
// epoch Twitter) usado pra deixar o decoder pré-populado e estável pra teste.
const SAMPLE_TS = Date.UTC(2024, 2, 14, 15, 9, 26, 535)
const SAMPLE_ID = buildSnowflake({ timestampMs: SAMPLE_TS, epochMs: TWITTER_EPOCH_MS, datacenter: 1, worker: 2, sequence: 0 })

const SOURCE_CODE = `// src/pages/SnowflakeIdToolPage.jsx — motor de geração/decodificação
const TWITTER_EPOCH_MS = 1288834974657n // 2010-11-04
const DISCORD_EPOCH_MS = 1420070400000n // 2015-01-01
const TIMESTAMP_MASK = (1n << 41n) - 1n  // 41 bits de timestamp

function buildSnowflake({ timestampMs = Date.now(), epochMs,
  datacenter = 0, worker = 0, sequence = 0 }) {
  const ts = BigInt(timestampMs) - BigInt(epochMs)
  return (
    (ts & TIMESTAMP_MASK) << 22n |          // 41 bits
    BigInt(datacenter & 31) << 17n |        // 5 bits
    BigInt(worker & 31) << 12n |            // 5 bits
    BigInt(sequence & 4095n)                // 12 bits
  ).toString()
}

function decodeSnowflake(valueStr, epochMs) {
  const value = BigInt(valueStr.trim())
  if (value < 0n || value >= 1n << 63n) throw new Error('out-of-range')
  const tsField = Number((value >> 22n) & TIMESTAMP_MASK)
  return {
    tsField,
    datacenter: Number((value >> 17n) & 31n),
    worker: Number((value >> 12n) & 31n),
    sequence: Number(value & 4095n),
    timestampMs: tsField + Number(epochMs),
    date: new Date(tsField + Number(epochMs)),
  }
}`

const translations = {
  pt: {
    title: 'Gerador / Decoder de Snowflake ID',
    intro: (
      <>
        Gere e decodifique IDs no formato <Text code>Snowflake</Text> — o inteiro
        de 64 bits usado pelo Twitter/X e pelo Discord pra gerar IDs ordenáveis
        por tempo sem coordenador central. Sua estrutura: <Text code>41 bits de
        timestamp</Text> (ms desde um epoch custom), <Text code>5 bits de
        datacenter</Text>, <Text code>5 bits de worker</Text> e{' '}
        <Text code>12 bits de sequence</Text>. Tudo 100% client-side, nada sai
        do navegador.
      </>
    ),
    generateTitle: 'Gerar Snowflakes',
    epochLabel: 'Epoch',
    epochTwitter: 'Twitter / X (2010-11-04)',
    epochDiscord: 'Discord (2015-01-01)',
    epochCustom: 'Customizado',
    customEpochLabel: 'Epoch customizado (ms Unix)',
    datacenterLabel: 'Datacenter ID (0–31)',
    workerLabel: 'Worker ID (0–31)',
    countLabel: 'Quantidade',
    generate: 'Gerar',
    generateAnother: 'Gerar outro lote',
    copy: 'Copiar',
    copyAll: 'Copiar todos',
    copied: 'Copiado!',
    emptyList: 'Clique em Gerar para criar snowflakes.',
    sequenceHint: 'Cada item do lote usa um sequence diferente (0, 1, 2…) no mesmo milissegundo — é assim que vários IDs no mesmo ms continuam únicos e ordenados.',
    decodeTitle: 'Decodificar Snowflake',
    decodeEpochLabel: 'Epoch do ID',
    decodePlaceholder: 'Cole um snowflake (só dígitos) aqui',
    decodeButton: 'Decodificar',
    sampleButton: 'Usar exemplo',
    invalidInput: 'Entrada inválida — um snowflake é um inteiro decimal de 64 bits sem sinal (até 19 dígitos).',
    outOfRange: 'Número fora do intervalo de um snowflake de 64 bits (≥ 0 e < 2^63).',
    valueLabel: 'Valor decimal',
    binaryLabel: 'Binário (64 bits)',
    timestampFieldLabel: 'Campo timestamp (desde o epoch)',
    dateLabel: 'Data/hora',
    utcLabel: 'UTC',
    signLabel: 'sinal',
    timestampBitsLabel: 'timestamp (41)',
    datacenterBitsLabel: 'datacenter (5)',
    workerBitsLabel: 'worker (5)',
    sequenceBitsLabel: 'sequence (12)',
    datacenterLabelShort: 'Datacenter',
    workerLabelShort: 'Worker',
    sequenceLabelShort: 'Sequence',
    previousLabel: 'Anterior (seq−1)',
    nextLabel: 'Próximo (seq+1)',
    noPrevNext: '— (sequence já no limite)',
    structureTitle: 'Estrutura de um Snowflake',
    structureBody: (
      <>
        Os 64 bits são divididos em:{' '}
        <Text code>1 bit de sinal</Text> (sempre 0 — snowflakes são positivos),{' '}
        <Text code>41 bits de timestamp</Text> (ms desde o epoch, big-endian),
        <Text code>5 bits de datacenter</Text>,{' '}
        <Text code>5 bits de worker</Text> e{' '}
        <Text code>12 bits de sequence</Text> (0–4095; estourou no mesmo ms, o
        gerador espera o ms seguinte). O epoch é o que diferencia cada
        plataforma: Twitter/X usa{' '}
        <Text code>1288834974657</Text> (2010-11-04) e Discord usa{' '}
        <Text code>1420070400000</Text> (2015-01-01). Por isso o mesmo layout
        serve os dois — muda só a origem da contagem do tempo. IDs sortables,
        o tempo de criação é literalmente embutido no número, e um batimento
        por máquina (datacenter + worker) evita colisão entre processos sem
        depender de um banco sequencial.
      </>
    ),
    sourceTitle: 'Código-fonte do motor',
  },
  en: {
    title: 'Snowflake ID Generator / Decoder',
    intro: (
      <>
        Generate and decode <Text code>Snowflake</Text> IDs — the 64-bit
        integer format Twitter/X and Discord use to mint time-ordered
        identifiers without a central coordinator. Its layout:{' '}
        <Text code>41-bit timestamp</Text> (ms since a custom epoch),{' '}
        <Text code>5-bit datacenter</Text>, <Text code>5-bit worker</Text> and{' '}
        <Text code>12-bit sequence</Text>. 100% client-side, nothing leaves the
        browser.
      </>
    ),
    generateTitle: 'Generate Snowflakes',
    epochLabel: 'Epoch',
    epochTwitter: 'Twitter / X (2010-11-04)',
    epochDiscord: 'Discord (2015-01-01)',
    epochCustom: 'Custom',
    customEpochLabel: 'Custom epoch (Unix ms)',
    datacenterLabel: 'Datacenter ID (0–31)',
    workerLabel: 'Worker ID (0–31)',
    countLabel: 'Count',
    generate: 'Generate',
    generateAnother: 'Generate another batch',
    copy: 'Copy',
    copyAll: 'Copy all',
    copied: 'Copied!',
    emptyList: 'Click Generate to create snowflakes.',
    sequenceHint: 'Each item in a batch uses a different sequence (0, 1, 2…) within the same millisecond — that is how many IDs in the same ms stay unique and sorted.',
    decodeTitle: 'Decode Snowflake',
    decodeEpochLabel: 'ID epoch',
    decodePlaceholder: 'Paste a snowflake (digits only) here',
    decodeButton: 'Decode',
    sampleButton: 'Use sample',
    invalidInput: 'Invalid input — a snowflake is an unsigned 64-bit decimal integer (up to 19 digits).',
    outOfRange: 'Number out of range for a 64-bit snowflake (≥ 0 and < 2^63).',
    valueLabel: 'Decimal value',
    binaryLabel: 'Binary (64 bits)',
    timestampFieldLabel: 'Timestamp field (since epoch)',
    dateLabel: 'Date/time',
    utcLabel: 'UTC',
    signLabel: 'sign',
    timestampBitsLabel: 'timestamp (41)',
    datacenterBitsLabel: 'datacenter (5)',
    workerBitsLabel: 'worker (5)',
    sequenceBitsLabel: 'sequence (12)',
    datacenterLabelShort: 'Datacenter',
    workerLabelShort: 'Worker',
    sequenceLabelShort: 'Sequence',
    previousLabel: 'Previous (seq−1)',
    nextLabel: 'Next (seq+1)',
    noPrevNext: '— (sequence already at the edge)',
    structureTitle: 'Snowflake layout',
    structureBody: (
      <>
        The 64 bits split into:{' '}
        <Text code>1 sign bit</Text> (always 0 — snowflakes are positive),{' '}
        <Text code>41-bit timestamp</Text> (ms since the epoch, big-endian),{' '}
        <Text code>5-bit datacenter</Text>, <Text code>5-bit worker</Text> and{' '}
        <Text code>12-bit sequence</Text> (0–4095; if it overflows within the
        same ms, the generator waits for the next one). The epoch is what sets
        each platform apart: Twitter/X uses{' '}
        <Text code>1288834974657</Text> (2010-11-04) and Discord uses{' '}
        <Text code>1420070400000</Text> (2015-01-01). Same layout, different
        reference point — that is why one decoder fits both. IDs are sortable,
        the creation time is literally embedded in the number, and a per-machine
        beat (datacenter + worker) avoids collisions without a sequential
        database.
      </>
    ),
    sourceTitle: 'Engine source code',
  },
}

const EPOCH_OPTIONS = [
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'discord', label: 'Discord' },
  { value: 'custom', label: 'Custom' },
]

function epochMsFor(preset, customMs) {
  if (preset === 'discord') return DISCORD_EPOCH_MS
  if (preset === 'custom') return Number(customMs) || 0
  return TWITTER_EPOCH_MS
}

function fmtDate(ms, locale) {
  const d = new Date(ms)
  const local = d.toLocaleString(locale, { dateStyle: 'full', timeStyle: 'medium' })
  const utc = d.toLocaleString(locale, { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'medium' })
  return { local, utc }
}

// Gera a visualização em grupos [sinal][timestamp][datacenter][worker][sequence]
function buildSegments(d, t) {
  const full = d.value.toString(2).padStart(64, '0')
  return [
    { key: 'sign', label: t.signLabel, bits: full[0], color: '#8c8c8c' },
    { key: 'timestamp', label: t.timestampBitsLabel, bits: full.slice(1, 42), color: '#1677ff' },
    { key: 'datacenter', label: t.datacenterBitsLabel, bits: full.slice(42, 47), color: '#52c41a' },
    { key: 'worker', label: t.workerBitsLabel, bits: full.slice(47, 52), color: '#fa8c16' },
    { key: 'sequence', label: t.sequenceBitsLabel, bits: full.slice(52, 64), color: '#722ed1' },
  ]
}

export default function SnowflakeIdToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'

  const [epochPreset, setEpochPreset] = useState('twitter')
  const [customEpochMs, setCustomEpochMs] = useState(TWITTER_EPOCH_MS)
  const [datacenter, setDatacenter] = useState(1)
  const [worker, setWorker] = useState(2)
  const [count, setCount] = useState(5)
  const [generated, setGenerated] = useState([])

  const [decodeInput, setDecodeInput] = useState(SAMPLE_ID)
  const [decodeEpochPreset, setDecodeEpochPreset] = useState('twitter')
  const [decodeCustomEpochMs, setDecodeCustomEpochMs] = useState(TWITTER_EPOCH_MS)
  const [decoded, setDecoded] = useState(null)
  const [decodeError, setDecodeError] = useState('')

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const handleGenerate = () => {
    const validCount = Math.min(100, Math.max(1, Number(count) || 1))
    setCount(validCount)
    const epochMs = epochMsFor(epochPreset, customEpochMs)
    const now = Date.now()
    const ids = []
    for (let i = 0; i < validCount; i++) {
      ids.push(buildSnowflake({ timestampMs: now, epochMs, datacenter, worker, sequence: i }))
    }
    setGenerated(ids)
  }

  const handleDecode = () => {
    setDecoded(null)
    setDecodeError('')
    const raw = decodeInput.trim()
    if (!raw) return
    if (!/^\d{1,19}$/.test(raw)) {
      setDecodeError(t.invalidInput)
      return
    }
    try {
      const epochMs = epochMsFor(decodeEpochPreset, decodeCustomEpochMs)
      const result = decodeSnowflake(raw, epochMs)
      setDecoded({ ...result, raw })
    } catch (e) {
      setDecodeError(t.outOfRange)
    }
  }

  const generateEpochInputs = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap size="large" align="start">
        <Space direction="vertical" size={4}>
          <Text strong>{t.epochLabel}</Text>
          <Select
            value={epochPreset}
            onChange={setEpochPreset}
            options={EPOCH_OPTIONS}
            style={{ width: 220 }}
          />
        </Space>
        <Space direction="vertical" size={4}>
          <Text strong>{t.datacenterLabel}</Text>
          <InputNumber min={0} max={31} value={datacenter} onChange={setDatacenter} style={{ width: 120 }} />
        </Space>
        <Space direction="vertical" size={4}>
          <Text strong>{t.workerLabel}</Text>
          <InputNumber min={0} max={31} value={worker} onChange={setWorker} style={{ width: 120 }} />
        </Space>
        <Space direction="vertical" size={4}>
          <Text strong>{t.countLabel}</Text>
          <InputNumber min={1} max={100} value={count} onChange={setCount} style={{ width: 120 }} />
        </Space>
      </Space>
      {epochPreset === 'custom' && (
        <Space direction="vertical" size={4}>
          <Text strong>{t.customEpochLabel}</Text>
          <InputNumber
            min={0}
            style={{ width: 240 }}
            value={customEpochMs}
            onChange={setCustomEpochMs}
          />
        </Space>
      )}
      <Button type="primary" icon={generated.length > 0 ? <ReloadOutlined /> : <IdcardOutlined />} onClick={handleGenerate}>
        {generated.length > 0 ? t.generateAnother : t.generate}
      </Button>
      <Alert type="info" showIcon message={t.sequenceHint} />
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><IdcardOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.generateTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {generateEpochInputs}
          {generated.length > 0 ? (
            <>
              <List
                bordered
                size="small"
                dataSource={generated}
                renderItem={(item, idx) => (
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
                    <Space>
                      <Tag color="blue">seq {idx}</Tag>
                      <Text code style={{ fontSize: 14, letterSpacing: 1 }}>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
              <Button icon={<CopyOutlined />} onClick={() => handleCopy(generated.join('\n'))}>
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
          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text strong>{t.decodeEpochLabel}</Text>
              <Select
                value={decodeEpochPreset}
                onChange={setDecodeEpochPreset}
                options={EPOCH_OPTIONS}
                style={{ width: 200 }}
              />
            </Space>
            {decodeEpochPreset === 'custom' && (
              <Space direction="vertical" size={4}>
                <Text strong>{t.customEpochLabel}</Text>
                <InputNumber
                  min={0}
                  style={{ width: 220 }}
                  value={decodeCustomEpochMs}
                  onChange={setDecodeCustomEpochMs}
                />
              </Space>
            )}
          </Space>
          <Input
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.target.value)}
            placeholder={t.decodePlaceholder}
            onPressEnter={handleDecode}
          />
          <Space wrap>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleDecode}>
              {t.decodeButton}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => setDecodeInput(SAMPLE_ID)}>
              {t.sampleButton}
            </Button>
          </Space>

          {decodeError && <Alert type="error" showIcon message={decodeError} />}

          {decoded && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div><Text strong>{t.valueLabel}:</Text> <Text code copyable>{decoded.raw}</Text></div>
              <div>
                <Text strong>{t.binaryLabel}:</Text>{' '}
                <Text code style={{ fontSize: 12 }}>{decoded.value.toString(2).padStart(64, '0')}</Text>
              </div>

              <div style={{ overflowX: 'auto', paddingTop: 4 }}>
                <div style={{ display: 'flex', gap: 8, minWidth: 680 }}>
                  {buildSegments(decoded, t).map((seg) => (
                    <div key={seg.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>
                        {seg.bits.split('').map((bit, i) => (
                          <span
                            key={i}
                            style={{
                              display: 'inline-flex',
                              width: 10,
                              height: 15,
                              marginRight: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: seg.color,
                              border: `1px solid ${seg.color}`,
                              borderRadius: 2,
                            }}
                          >
                            {bit}
                          </span>
                        ))}
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{seg.label} ({seg.bits.length})</Text>
                    </div>
                  ))}
                </div>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <div>
                <Text strong><FieldTimeOutlined /> {t.timestampFieldLabel}:</Text>{' '}
                <Tag color="blue">{decoded.tsField}</Tag>
              </div>
              <div>
                <Text strong>{t.dateLabel}:</Text>{' '}
                {fmtDate(decoded.timestampMs, locale).local}{' '}
                <Text type="secondary">({t.utcLabel}: {fmtDate(decoded.timestampMs, locale).utc})</Text>
              </div>
              <div>
                <Text strong><DatabaseOutlined /> {t.datacenterLabelShort}:</Text>{' '}
                <Tag color="green">{decoded.datacenter}</Tag>{' '}
                <Text strong><HddOutlined /> {t.workerLabelShort}:</Text>{' '}
                <Tag color="orange">{decoded.worker}</Tag>{' '}
                <Text strong><NumberOutlined /> {t.sequenceLabelShort}:</Text>{' '}
                <Tag color="purple">{decoded.sequence}</Tag>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Space wrap size="large">
                <div>
                  <Text type="secondary">{t.previousLabel}:</Text>{' '}
                  {decoded.sequence > 0 ? (
                    <Text code copyable>{decoded.value - 1n}</Text>
                  ) : (
                    <Text type="secondary">{t.noPrevNext}</Text>
                  )}
                </div>
                <div>
                  <Text type="secondary">{t.nextLabel}:</Text>{' '}
                  {decoded.sequence < SEQUENCE_MASK ? (
                    <Text code copyable>{decoded.value + 1n}</Text>
                  ) : (
                    <Text type="secondary">{t.noPrevNext}</Text>
                  )}
                </div>
              </Space>
            </Space>
          )}
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.structureTitle} description={t.structureBody} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, padding: 12, background: '#f6f6f6', borderRadius: 6, overflow: 'auto' }}>
                <code>{SOURCE_CODE}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}