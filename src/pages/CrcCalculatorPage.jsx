import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, Segmented, Table, Button, Tag, Alert, Collapse, message } from 'antd'
import { SafetyCertificateOutlined, CopyOutlined, CodeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Parâmetros dos algoritmos, seguindo os nomes do catálogo RevEng
// (https://reveng.sourceforge.io/crc-catalogue/). `check` é o valor de
// referência documentado para a entrada ASCII "123456789".
const ALGOS = [
  { key: 'crc8', name: 'CRC-8', bits: 8, poly: 0x07, init: 0x00, refin: false, refout: false, xorout: 0x00, check: 'F4', use: { pt: 'redes de sensores, automação, protocolos de chip/placa (ex.: CRC-8/WIRE)', en: 'sensor networks, automation, chip/board protocols (e.g. CRC-8/WIRE)' } },
  { key: 'crc8maxim', name: 'CRC-8/MAXIM', bits: 8, poly: 0x31, init: 0x00, refin: true, refout: true, xorout: 0x00, check: 'A1', use: { pt: 'Dallas/Maxim 1-Wire (ex.: sensor DS18B20)', en: 'Dallas/Maxim 1-Wire (e.g. DS18B20 sensor)' } },
  { key: 'crc16modbus', name: 'CRC-16/MODBUS', bits: 16, poly: 0x8005, init: 0xffff, refin: true, refout: true, xorout: 0x0000, check: '4B37', use: { pt: 'protocolo Modbus RTU (automação industrial)', en: 'Modbus RTU protocol (industrial automation)' } },
  { key: 'crc16ccittf', name: 'CRC-16/CCITT-FALSE', bits: 16, poly: 0x1021, init: 0xffff, refin: false, refout: false, xorout: 0x0000, check: '29B1', use: { pt: 'Bluetooth, X.25, PPP', en: 'Bluetooth, X.25, PPP' } },
  { key: 'crc16xmodem', name: 'CRC-16/XMODEM', bits: 16, poly: 0x1021, init: 0x0000, refin: false, refout: false, xorout: 0x0000, check: '31C3', use: { pt: 'transferência de arquivos XMODEM, bootloaders, AX.25', en: 'XMODEM file transfer, bootloaders, AX.25' } },
  { key: 'crc16kermit', name: 'CRC-16/KERMIT', bits: 16, poly: 0x1021, init: 0x0000, refin: true, refout: true, xorout: 0x0000, check: '2189', use: { pt: 'protocolo Kermit, DNP3, enlaces de telefonia', en: 'Kermit protocol, DNP3, telecom links' } },
  { key: 'crc32', name: 'CRC-32', bits: 32, poly: 0x04c11db7, init: 0xffffffff, refin: true, refout: true, xorout: 0xffffffff, check: 'CBF43926', use: { pt: 'ZIP, gzip, PNG (por chunk), FCS do Ethernet, ext4', en: 'ZIP, gzip, PNG (per chunk), Ethernet FCS, ext4' } },
  { key: 'crc32c', name: 'CRC-32/C (Castagnoli)', bits: 32, poly: 0x1edc6f41, init: 0xffffffff, refin: true, refout: true, xorout: 0xffffffff, check: 'E3069283', use: { pt: 'iSCSI, ext4, Btrfs, tecnologias de storage', en: 'iSCSI, ext4, Btrfs, storage technologies' } },
  { key: 'crc32mpeg2', name: 'CRC-32/MPEG-2', bits: 32, poly: 0x04c11db7, init: 0xffffffff, refin: false, refout: false, xorout: 0x00000000, check: '0376E6E7', use: { pt: 'MPEG-2 systems, streams .ts, mídias magnéticas', en: 'MPEG-2 systems, .ts streams, magnetic media' } },
]

// ─── Núcleo do algoritmo ────────────────────────────────────────
// CRC genérico via tabela de look-up de 256 entradas. Cada entrada pré-
// calcula o efeito de 8 bits do registrador; `refin` decide se a tabela é a
// variante "normal" (shift left, polinômio como na literatura) ou a
// "refletida" (shift right, polinômio espelhado). No fim, se `refout` for
// diferente de `refin`, o registrador é espelhado antes de aplicar `xorout`.

function reflect(value, width) {
  let r = 0
  for (let i = 0; i < width; i++) {
    r = (r << 1) | (value & 1)
    value >>>= 1
  }
  return r >>> 0
}

function makeTable(alg) {
  const w = alg.bits
  const mask = w === 32 ? 0xffffffff : (1 << w) - 1
  const poly = (alg.refin ? reflect(alg.poly, w) : alg.poly) >>> 0
  const table = new Array(256)
  for (let i = 0; i < 256; i++) {
    let crc = alg.refin ? i : (i << (w - 8))
    for (let j = 0; j < 8; j++) {
      if (alg.refin) {
        crc = crc & 1 ? ((crc >>> 1) ^ poly) : (crc >>> 1)
      } else {
        const topMask = w === 32 ? 0x80000000 : (1 << (w - 1))
        crc = crc & topMask ? ((crc << 1) ^ poly) : (crc << 1)
        crc &= mask
      }
      crc >>>= 0
    }
    table[i] = crc >>> 0
  }
  return { table, mask }
}

function crcBytes(alg, bytes) {
  const w = alg.bits
  const { table, mask } = makeTable(alg)
  let crc = alg.init >>> 0
  if (alg.refin) {
    for (const byte of bytes) {
      crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff]
    }
  } else {
    for (const byte of bytes) {
      crc = (((crc << 8) & mask) ^ table[(((crc >>> (w - 8)) & 0xff) ^ byte) & 0xff]) >>> 0
    }
  }
  crc ^= alg.xorout
  if (alg.refout !== alg.refin) crc = reflect(crc, w)
  return crc >>> 0
}

function hexOf(value, bits) {
  return value.toString(16).padStart(bits / 4, '0').toUpperCase()
}

// Entrada "123456789" (ASCII) — o vetor de teste canônico do catálogo
// RevEng; todo algoritmo listado acima deve devolver exatamente `check`.
const SAMPLE = '123456789'

const SAMPLE_HEX = '48 65 6c 6c 6f'

const SOURCE = `// Registrador de width bits + tabela de 256 entradas.
// refin=true  -> variante "refletida" (polinômio espelhado, shift right)
// refin=false -> variante "normal" (polinômio da literatura, shift left)
function reflect(value, width) {
  let r = 0
  for (let i = 0; i < width; i++) {
    r = (r << 1) | (value & 1)
    value >>>= 1
  }
  return r >>> 0
}

function makeTable(alg) {
  const w = alg.bits
  const mask = w === 32 ? 0xffffffff : (1 << w) - 1
  const poly = (alg.refin ? reflect(alg.poly, w) : alg.poly) >>> 0
  const table = new Array(256)
  for (let i = 0; i < 256; i++) {
    let crc = alg.refin ? i : (i << (w - 8))
    for (let j = 0; j < 8; j++) {
      if (alg.refin) {
        crc = crc & 1 ? ((crc >>> 1) ^ poly) : (crc >>> 1)
      } else {
        const topMask = w === 32 ? 0x80000000 : (1 << (w - 1))
        crc = crc & topMask ? ((crc << 1) ^ poly) : (crc << 1)
        crc &= mask
      }
      crc >>>= 0
    }
    table[i] = crc >>> 0
  }
  return { table, mask }
}

// Cada byte vira um passo de 8 bits sobre o registrador.
function crcBytes(alg, bytes) {
  const w = alg.bits
  const { table, mask } = makeTable(alg)
  let crc = alg.init >>> 0
  if (alg.refin) {
    for (const byte of bytes) {
      crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff]
    }
  } else {
    for (const byte of bytes) {
      crc = (((crc << 8) & mask) ^
        table[(((crc >>> (w - 8)) & 0xff) ^ byte) & 0xff]) >>> 0
    }
  }
  crc ^= alg.xorout
  if (alg.refout !== alg.refin) crc = reflect(crc, w)
  return crc >>> 0
}

// Parâmetros do catálogo RevEng: { bits, poly, init, refin, refout, xorout, check }
// 'check' é o valor documentado para a entrada ASCII "123456789":
//   CRC-8            8,  0x07,       0x00,       false, false, 0x00,        F4
//   CRC-8/MAXIM      8,  0x31,       0x00,       true,  true,  0x00,        A1
//   CRC-16/MODBUS    16, 0x8005,     0xFFFF,     true,  true,  0x0000,      4B37
//   CRC-16/CCITT-FALSE 16, 0x1021,   0xFFFF,     false, false, 0x0000,      29B1
//   CRC-16/XMODEM    16, 0x1021,     0x0000,     false, false, 0x0000,      31C3
//   CRC-16/KERMIT    16, 0x1021,     0x0000,     true,  true,  0x0000,      2189
//   CRC-32           32, 0x04C11DB7, 0xFFFFFFFF, true,  true,  0xFFFFFFFF,  CBF43926
//   CRC-32/C         32, 0x1EDC6F41, 0xFFFFFFFF, true,  true,  0xFFFFFFFF,  E3069283
//   CRC-32/MPEG-2    32, 0x04C11DB7, 0xFFFFFFFF, false, false, 0x00000000, 0376E6E7`

const translations = {
  pt: {
    title: 'Calculadora de CRC',
    intro: (
      <>
        Calcula checksums <Text code>CRC-8</Text>, <Text code>CRC-16</Text> e <Text code>CRC-32</Text> de um texto
        ou de bytes hex — 9 algoritmos da tabela do catálogo RevEng, todos com a tabela de look-up
        calculada aqui mesmo, sem nenhuma biblioteca. Útil pra conferir o CRC de um frame de rede,
        um chunk de PNG, um arquivo ZIP ou um pacote de protocolo serial, e pra entender por que
        <Text code>crc32("Hello")</Text> num sistema não bate com o de outro quando a ordem de bytes
        diverge.
      </>
    ),
    modeText: 'Texto',
    modeHex: 'Bytes hex',
    placeholderText: 'Digite ou cole o texto...',
    placeholderHex: 'Ex.: 48656c6c6f  ou  48 65 6c 6c 6f',
    hexInvalid: 'Entrada hex inválida — só aceita dígitos 0-9 e a-f (espaços e vírgulas são ignorados).',
    hexOdd: 'Quantidade ímpar de dígitos hex — cada byte tem 2 dígitos.',
    samples: 'Exemplos:',
    bytesLabel: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    colAlgo: 'Algoritmo',
    colHex: 'CRC (hex)',
    colDec: 'Decimal',
    colCheck: 'Referência p/ "123456789"',
    copy: 'Copiar',
    ok: 'OK',
    fail: 'DIVERGE',
    copied: 'Copiado!',
    whatTitle: 'CRC é checksum, não hash criptográfico',
    whatBody: (
      <>
        CRC pega erro <Text strong>acidental</Text> — ruído, byte corrompido no disco, bit flip na rede —
        mas <Text strong>não</Text> é resistente a ataque: qualquer pessoa consegue forjar um payload que
        produz o mesmo CRC-32 de propósito. Pra integridade contra adulteração use uma família
        criptográfica (o <Text code>/tools/hash-generator</Text> já oferece SHA-1/256/384/512). Outra
        pegadinha clássica: o mesmo "CRC-16" aparece com ordens de byte e polinômios diferentes
        (CCITT-FALSE vs XMODEM vs KERMIT não são a mesma coisa) — confirme qual variante o
        protocolo/documentação exige.
      </>
    ),
    testTitle: 'Como conferir que a conta está certa',
    testBody: (
      <>
        A entrada ASCII <Text code>123456789</Text> é o vetor de teste canônico do catálogo RevEng: cada
        linha da tabela tem o valor <Text code>check</Text> documentado pra ela, e clicar no exemplo
        "123456789" acende um selo verde <Text code>OK</Text> em todos — o cálculo passou no teste
        referência. A coluna mostra a forma comum de cada família: CRC-32 de um arquivo ZIP, o FCS
        do Ethernet, o CRC-16 de um frame Modbus RTU (bytes de baixa ordem primeiro) e o CRC-8 dos
        sensores 1-Wire.
      </>
    ),
    sourceTab: 'Código-fonte (makeTable + crcBytes)',
    sourceHint: 'O núcleo: tabela de look-up de 256 entradas e o registrador de width bits.',
    copySource: 'Copiar código',
    resultEmpty: 'Digite algo acima pra calcular os CRCs.',
  },
  en: {
    title: 'CRC Checksum Calculator',
    intro: (
      <>
        Computes <Text code>CRC-8</Text>, <Text code>CRC-16</Text> and <Text code>CRC-32</Text> checksums of
        some text or hex bytes — 9 algorithms from the RevEng catalogue table, all with the look-up
        table built right here, no library. Handy to verify the CRC of a network frame, a PNG chunk,
        a ZIP file or a serial protocol packet, and to understand why{' '}
        <Text code>crc32("Hello")</Text> in one system doesn't match another when the byte order
        differs.
      </>
    ),
    modeText: 'Text',
    modeHex: 'Hex bytes',
    placeholderText: 'Type or paste the text...',
    placeholderHex: 'E.g. 48656c6c6f  or  48 65 6c 6c 6f',
    hexInvalid: 'Invalid hex input — only 0-9 and a-f allowed (spaces and commas are ignored).',
    hexOdd: 'Odd number of hex digits — each byte takes 2 digits.',
    samples: 'Examples:',
    bytesLabel: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    colAlgo: 'Algorithm',
    colHex: 'CRC (hex)',
    colDec: 'Decimal',
    colCheck: 'Reference for "123456789"',
    copy: 'Copy',
    ok: 'OK',
    fail: 'MISMATCH',
    copied: 'Copied!',
    whatTitle: 'CRC is a checksum, not a cryptographic hash',
    whatBody: (
      <>
        CRC catches <Text strong>accidental</Text> corruption — noise, a flipped bit on disk or the
        network — but it is <Text strong>not</Text> attack-resistant: anyone can deliberately craft a
        payload that yields the same CRC-32. For integrity against tampering use a cryptographic
        family (the <Text code>/tools/hash-generator</Text> already offers SHA-1/256/384/512). Another
        classic gotcha: the same "CRC-16" name shows up with different byte orders and polynomials
        (CCITT-FALSE vs XMODEM vs KERMIT are not the same thing) — always confirm which variant the
        protocol/docs require.
      </>
    ),
    testTitle: 'How to verify the math is right',
    testBody: (
      <>
        The ASCII input <Text code>123456789</Text> is the canonical RevEng catalogue test vector: each
        row carries the documented <Text code>check</Text> value for it, and clicking the "123456789"
        example lights up a green <Text code>OK</Text> badge on every row — the computation passed the
        reference test. The reference column maps to where each family shows up: CRC-32 of a ZIP
        file, the Ethernet FCS, the CRC-16 of a Modbus RTU frame (low byte first) and the CRC-8 of
        1-Wire sensors.
      </>
    ),
    sourceTab: 'Source code (makeTable + crcBytes)',
    sourceHint: 'The core: a 256-entry look-up table and a width-bit register.',
    copySource: 'Copy code',
    resultEmpty: 'Type something above to compute the CRCs.',
  },
}

function parseHex(s) {
  const tokens = s.split(/[\s,]+/).map((x) => x.trim().replace(/^0x/i, '')).filter(Boolean)
  const cleaned = tokens.join('')
  if (cleaned.length === 0) return { bytes: new Uint8Array(), error: null }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return { bytes: null, error: 'hexInvalid' }
  if (cleaned.length % 2 !== 0) return { bytes: null, error: 'hexOdd' }
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16)
  }
  return { bytes, error: null }
}

export default function CrcCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [hexText, setHexText] = useState('')

  const parsed = useMemo(() => {
    if (mode === 'hex') return parseHex(hexText)
    return { bytes: new TextEncoder().encode(text), error: null }
  }, [mode, hexText, text])

  const bytes = parsed.bytes || new Uint8Array()
  const parseError = parsed.error

  const sampleBytes = useMemo(() => new TextEncoder().encode(SAMPLE), [])

  const isSample = useMemo(
    () => bytes.length === sampleBytes.length && bytes.every((b, i) => b === sampleBytes[i]),
    [bytes, sampleBytes],
  )

  const results = useMemo(() => {
    return ALGOS.map((a) => {
      const value = crcBytes(a, bytes)
      return {
        key: a.key,
        name: a.name,
        bits: a.bits,
        use: a.use,
        hex: `0x${hexOf(value, a.bits)}`,
        plainHex: hexOf(value, a.bits),
        dec: String(value),
        check: a.check,
        ok: a.check === hexOf(value, a.bits),
      }
    })
  }, [bytes])

  const copy = useCallback((value) => {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }, [t])

  const columns = useMemo(() => [
    {
      title: t.colAlgo,
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            <Text strong style={{ fontFamily: 'monospace' }}>{r.name}</Text>
            <Tag color="blue" style={{ lineHeight: '16px', fontSize: 11 }}>{`${r.bits} bits`}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.use[lang]}</Text>
        </Space>
      ),
    },
    {
      title: t.colHex,
      dataIndex: 'hex',
      key: 'hex',
      width: 150,
      render: (v) => <Text code style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: t.colDec,
      dataIndex: 'dec',
      key: 'dec',
      render: (v) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: t.colCheck,
      dataIndex: 'check',
      key: 'check',
      render: (v, r) => (
        <Space size={6} wrap>
          <Text code style={{ fontSize: 12 }}>{`0x${v}`}</Text>
          {isSample && r.ok && <Tag color="green" style={{ marginRight: 0 }}>{t.ok}</Tag>}
          {isSample && !r.ok && <Tag color="red" style={{ marginRight: 0 }}>{t.fail}</Tag>}
        </Space>
      ),
    },
    {
      title: '',
      key: 'copy',
      width: 96,
      render: (_, r) => (
        <Button size="small" icon={<CopyOutlined />} onClick={() => copy(r.plainHex)}>{t.copy}</Button>
      ),
    },
  ], [t, lang, isSample, copy])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        message={t.whatTitle}
        description={t.whatBody}
      />
      <Alert
        type="success"
        showIcon
        message={t.testTitle}
        description={t.testBody}
      />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { label: t.modeText, value: 'text' },
                { label: t.modeHex, value: 'hex' },
              ]}
            />
            <Space size={8} wrap>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.samples}</Text>
              <Button
                size="small"
                onClick={() => { setMode('text'); setText(SAMPLE) }}
              >
                123456789
              </Button>
              <Button
                size="small"
                onClick={() => { setMode('text'); setText('Hello, world!') }}
              >
                Hello, world!
              </Button>
              <Button
                size="small"
                onClick={() => { setMode('hex'); setHexText(SAMPLE_HEX) }}
              >
                {SAMPLE_HEX}
              </Button>
            </Space>
          </Space>

          <TextArea
            rows={4}
            value={mode === 'text' ? text : hexText}
            onChange={(e) => (mode === 'text' ? setText(e.target.value) : setHexText(e.target.value))}
            placeholder={mode === 'text' ? t.placeholderText : t.placeholderHex}
            style={{ fontFamily: 'monospace' }}
            autoSize={{ minRows: 4, maxRows: 12 }}
          />

          <Space wrap>
            <Tag color="purple" style={{ marginRight: 0 }}>{t.bytesLabel(bytes.length)}</Tag>
            {isSample && <Tag color="green" style={{ marginRight: 0 }}>{t.ok}</Tag>}
          </Space>

          {parseError && (
            <Alert type="error" showIcon message={parseError === 'hexInvalid' ? t.hexInvalid : t.hexOdd} />
          )}
        </Space>
      </Card>

      <Table
        rowKey="key"
        columns={columns}
        dataSource={results}
        size="small"
        pagination={false}
        locale={{ emptyText: t.resultEmpty }}
      />

      <Collapse
        items={[
          {
            key: 'src',
            label: <span><CodeOutlined /> {t.sourceTab}</span>,
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Paragraph type="secondary">{t.sourceHint}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420, fontSize: 12 }}>
                  <code>{SOURCE}</code>
                </pre>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(SOURCE)}>{t.copySource}</Button>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
