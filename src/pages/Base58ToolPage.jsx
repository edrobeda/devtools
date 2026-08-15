import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Space,
  Button,
  Alert,
  message,
  Collapse,
  Segmented,
  Row,
  Col,
  Statistic,
  Switch,
} from 'antd'
import { SwapOutlined, CopyOutlined, ArrowsAltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  encodeBase58String,
  decodeBase58String,
  encodeBase58CheckString,
  decodeBase58CheckString,
  isValidBase58,
  base58Stats,
  bytesToHex,
  hexToBytes,
} from '../utils/base58Tool'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const MODE = {
  PLAIN: 'plain',
  CHECK: 'check',
}

const translations = {
  pt: {
    title: 'Base58 / Base58Check Encode/Decode',
    intro: (
      <>
        Codifica e decodifica texto no formato Base58 100% no navegador — nenhum
        dado sai daqui. Base58 remove caracteres visualmente ambíguos (0, O, I, l)
        e é usado em Bitcoin, IPFS e outras cadeias. Base58Check adiciona um
        checksum de 4 bytes (duplo SHA-256) e um byte de versão, comum em
        endereços e chaves WIF.
      </>
    ),
    plainLabel: 'Texto original',
    base58Label: 'Base58',
    plainPlaceholder: 'Digite ou cole o texto aqui...',
    base58Placeholder: 'Cole o Base58 aqui...',
    encode: 'Codificar →',
    decode: '← Decodificar',
    swap: 'Inverter',
    copy: 'Copiar',
    copied: 'Copiado',
    clear: 'Limpar',
    mode: 'Modo',
    modePlain: 'Base58 padrão',
    modeCheck: 'Base58Check',
    versionByte: 'Byte de versão (0-255)',
    hexInput: 'Entrada como hex',
    hexOutput: 'Saída como hex',
    invalidTitle: 'Base58 inválido',
    invalidVersion: 'Byte de versão inválido',
    checksumInvalid: 'Checksum Base58Check inválido',
    checksumValid: 'Checksum Base58Check válido',
    stats: 'Estatísticas',
    chars: 'Caracteres',
    bytes: 'Bytes',
    bits: 'Bits',
    examples: 'Exemplos rápidos',
    exampleHello: 'Olá',
    exampleBitcoin: 'Endereço Bitcoin (P2PKH)',
    exampleWif: 'Chave WIF',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor em src/utils/base58Tool.js implementa o alfabeto Base58 ' +
      '(123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz), codificação ' +
      'de bytes como inteiro grande (BigInt) e preservação de zeros à esquerda. ' +
      'Base58Check usa a Web Crypto API (crypto.subtle.digest) para calcular o ' +
      'duplo SHA-256 e anexar os 4 bytes de checksum.',
  },
  en: {
    title: 'Base58 / Base58Check Encode/Decode',
    intro: (
      <>
        Encodes and decodes text using Base58 100% in the browser — no data
        leaves this page. Base58 removes visually ambiguous characters (0, O, I, l)
        and is used by Bitcoin, IPFS and other chains. Base58Check adds a 4-byte
        checksum (double SHA-256) and a version byte, common in addresses and WIF
        keys.
      </>
    ),
    plainLabel: 'Plain text',
    base58Label: 'Base58',
    plainPlaceholder: 'Type or paste text here...',
    base58Placeholder: 'Paste Base58 here...',
    encode: 'Encode →',
    decode: '← Decode',
    swap: 'Swap',
    copy: 'Copy',
    copied: 'Copied',
    clear: 'Clear',
    mode: 'Mode',
    modePlain: 'Standard Base58',
    modeCheck: 'Base58Check',
    versionByte: 'Version byte (0-255)',
    hexInput: 'Input as hex',
    hexOutput: 'Output as hex',
    invalidTitle: 'Invalid Base58',
    invalidVersion: 'Invalid version byte',
    checksumInvalid: 'Invalid Base58Check checksum',
    checksumValid: 'Valid Base58Check checksum',
    stats: 'Statistics',
    chars: 'Characters',
    bytes: 'Bytes',
    bits: 'Bits',
    examples: 'Quick examples',
    exampleHello: 'Hello',
    exampleBitcoin: 'Bitcoin address (P2PKH)',
    exampleWif: 'WIF key',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine in src/utils/base58Tool.js implements the Base58 alphabet ' +
      '(123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz), encodes ' +
      'bytes as a large integer (BigInt) and preserves leading zeros. ' +
      'Base58Check uses the Web Crypto API (crypto.subtle.digest) to compute ' +
      'double SHA-256 and append the 4 checksum bytes.',
  },
}

const SOURCE_CODE = `const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const CHAR_TO_VALUE = new Map([...ALPHABET].map((c, i) => [c, BigInt(i)]));
const BASE = BigInt(58);

export function encodeBase58(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new Error('Uint8Array expected');
  let value = BigInt(0);
  for (const byte of bytes) value = (value << BigInt(8)) | BigInt(byte);

  let out = '';
  if (value === BigInt(0)) out = ALPHABET[0];
  else while (value > BigInt(0)) {
    out = ALPHABET[Number(value % BASE)] + out;
    value = value / BASE;
  }

  for (const byte of bytes) {
    if (byte === 0) out = ALPHABET[0] + out;
    else break;
  }
  return out;
}

export function decodeBase58(input) {
  const cleaned = input.replace(/\\s+/g, '');
  let value = BigInt(0);
  for (const c of cleaned) {
    const v = CHAR_TO_VALUE.get(c);
    if (v === undefined) throw new Error(\`Invalid base58 character: "\${c}"\`);
    value = value * BASE + v;
  }

  let leadingZeros = 0;
  for (const c of cleaned) {
    if (c === ALPHABET[0]) leadingZeros += 1;
    else break;
  }

  const bytes = [];
  while (value > BigInt(0)) {
    bytes.unshift(Number(value & BigInt(0xff)));
    value = value >> BigInt(8);
  }

  const result = new Uint8Array(leadingZeros + bytes.length);
  result.set(bytes, leadingZeros);
  return result;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

export async function base58checkChecksum(payload) {
  return (await sha256(await sha256(payload))).slice(0, 4);
}`

export default function Base58ToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [plain, setPlain] = useState('')
  const [base58, setBase58] = useState('')
  const [error, setError] = useState(null)
  const [checksumOk, setChecksumOk] = useState(null)
  const [mode, setMode] = useState(MODE.PLAIN)
  const [versionByte, setVersionByte] = useState('0')
  const [hexInput, setHexInput] = useState(false)
  const [hexOutput, setHexOutput] = useState(false)

  const plainStats = useMemo(() => base58Stats(plain), [plain])

  const parsedVersionByte = useMemo(() => {
    const n = parseInt(versionByte, 10)
    if (Number.isNaN(n) || n < 0 || n > 255) return null
    return n
  }, [versionByte])

  const applyExample = useCallback(
    async (value) => {
      setError(null)
      setChecksumOk(null)
      if (mode === MODE.PLAIN) {
        setPlain(value)
        try {
          setBase58(encodeBase58String(value))
        } catch (err) {
          setError(err.message)
        }
        return
      }

      // Base58Check examples: decode them to show the payload.
      setBase58(value)
      try {
        const result = await decodeBase58CheckString(value)
        setPlain(result.text)
        setChecksumOk(result.checksumValid)
      } catch (err) {
        setError(err.message)
      }
    },
    [mode]
  )

  const copy = useCallback(
    (value) => {
      navigator.clipboard.writeText(value)
      message.success(t.copied)
    },
    [t.copied]
  )

  const handleEncode = useCallback(async () => {
    setError(null)
    setChecksumOk(null)
    try {
      if (mode === MODE.PLAIN) {
        setBase58(encodeBase58String(plain))
        return
      }

      if (parsedVersionByte === null) {
        setError(t.invalidVersion)
        return
      }

      let bytes
      if (hexInput) {
        bytes = hexToBytes(plain)
      } else {
        bytes = new TextEncoder().encode(plain)
      }

      const encoded = await encodeBase58CheckString(bytes, parsedVersionByte)
      setBase58(encoded)
    } catch (err) {
      setError(err.message)
    }
  }, [mode, plain, parsedVersionByte, hexInput, t.invalidVersion])

  const handleDecode = useCallback(async () => {
    setError(null)
    setChecksumOk(null)
    if (!isValidBase58(base58)) {
      setError(lang === 'pt' ? 'Caracteres Base58 inválidos.' : 'Invalid Base58 characters.')
      return
    }
    try {
      if (mode === MODE.PLAIN) {
        const decoded = decodeBase58String(base58)
        setPlain(decoded)
        return
      }

      const expectedVersion = parsedVersionByte ?? undefined
      const result = await decodeBase58CheckString(base58, expectedVersion)
      setChecksumOk(result.checksumValid)
      if (hexOutput) {
        setPlain(bytesToHex(result.payload))
      } else {
        setPlain(result.text)
      }
    } catch (err) {
      setError(err.message)
    }
  }, [base58, mode, parsedVersionByte, hexOutput, lang])

  const handleSwap = useCallback(() => {
    setPlain(base58)
    setBase58(plain)
    setError(null)
    setChecksumOk(null)
  }, [base58, plain])

  const handleClear = useCallback(() => {
    setPlain('')
    setBase58('')
    setError(null)
    setChecksumOk(null)
  }, [])

  // Re-encode automatically when mode switches and both fields have content,
  // but only in plain mode to avoid firing async SHA-256 on every keystroke.
  useEffect(() => {
    if (mode !== MODE.PLAIN || !plain || !base58) return
    setError(null)
    setChecksumOk(null)
    try {
      setBase58(encodeBase58String(plain))
    } catch (err) {
      setError(err.message)
    }
  }, [mode, plain, base58])

  const bitcoinAddressExample = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  const wifExample = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SwapOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.mode} size="small">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Segmented
            value={mode}
            onChange={(v) => {
              setMode(v)
              setError(null)
              setChecksumOk(null)
            }}
            options={[
              { value: MODE.PLAIN, label: t.modePlain },
              { value: MODE.CHECK, label: t.modeCheck },
            ]}
            block
          />

          {mode === MODE.CHECK && (
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12}>
                <Space>
                  <Text>{t.versionByte}</Text>
                  <Input
                    value={versionByte}
                    onChange={(e) => setVersionByte(e.target.value)}
                    style={{ width: 80 }}
                    maxLength={3}
                  />
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  <Switch checked={hexInput} onChange={setHexInput} />
                  <Text>{t.hexInput}</Text>
                </Space>
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={mode === MODE.CHECK && hexInput ? 'Hex' : t.plainLabel}
            extra={(
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(plain)}>
                  {t.copy}
                </Button>
              </Space>
            )}
          >
            <TextArea
              rows={7}
              placeholder={t.plainPlaceholder}
              value={plain}
              onChange={(e) => setPlain(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={t.base58Label}
            extra={(
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(base58)}>
                  {t.copy}
                </Button>
              </Space>
            )}
          >
            <TextArea
              rows={7}
              placeholder={t.base58Placeholder}
              value={base58}
              onChange={(e) => setBase58(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ width: '100%', justifyContent: 'center' }} wrap>
        <Button type="primary" onClick={handleEncode}>
          {t.encode}
        </Button>
        <Button onClick={handleDecode}>{t.decode}</Button>
        <Button icon={<ArrowsAltOutlined />} onClick={handleSwap}>
          {t.swap}
        </Button>
        <Button onClick={handleClear}>{t.clear}</Button>
      </Space>

      {mode === MODE.CHECK && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space>
              <Switch checked={hexOutput} onChange={setHexOutput} />
              <Text>{t.hexOutput}</Text>
            </Space>
          </Col>
        </Row>
      )}

      {error && <Alert type="error" showIcon message={t.invalidTitle} description={error} />}
      {checksumOk === true && (
        <Alert type="success" showIcon message={t.checksumValid} />
      )}
      {checksumOk === false && (
        <Alert type="warning" showIcon message={t.checksumInvalid} />
      )}

      <Card title={t.stats} size="small">
        <Space size="large">
          <Statistic title={t.chars} value={plainStats.chars} />
          <Statistic title={t.bytes} value={plainStats.bytes} />
          <Statistic title={t.bits} value={plainStats.bits} />
        </Space>
      </Card>

      <Card title={t.examples} size="small">
        <Space wrap>
          <Button onClick={() => applyExample(t.exampleHello)}>{t.exampleHello}</Button>
          <Button onClick={() => applyExample(bitcoinAddressExample)}>{t.exampleBitcoin}</Button>
          <Button onClick={() => applyExample(wifExample)}>{t.exampleWif}</Button>
        </Space>
      </Card>

      <Collapse ghost>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph type="secondary">{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f6f6', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{SOURCE_CODE}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
