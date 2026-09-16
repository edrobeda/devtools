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
  encodeBase85,
  decodeBase85,
  ASCII85_ALPHABET,
  RFC1924_ALPHABET,
  Z85_ALPHABET,
  bytesToHex,
  hexToBytes,
  base85Stats,
} from '../utils/base85Tool'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const DIALECT = {
  ASCII85: 'ascii85',
  RFC1924: 'rfc1924',
  Z85: 'z85',
}

const translations = {
  pt: {
    title: 'Base85 Encode/Decode (Ascii85)',
    intro: (
      <>
        Codifica e decodifica texto em Base85 100% no navegador — nenhum dado sai
        daqui. Suporta três dialetos: <Text code>Ascii85</Text> (Adobe, com{' '}
        <Text code>{'<~ ~>'}</Text> opcionais e abreviação <Text code>z</Text>),{' '}
        <Text code>RFC 1924</Text> (B85) e <Text code>Z85</Text> (ZeroMQ, usado em
        mensagens ZeroMQ e bibliotecas como libzmq).
      </>
    ),
    dialect: 'Dialeto',
    ascii85: 'Ascii85 (Adobe)',
    rfc1924: 'RFC 1924',
    z85: 'Z85 (ZeroMQ)',
    delims: 'Delimitadores <~ ~>',
    zAbbrev: "Abreviar grupos de zeros como 'z'",
    hexInput: 'Entrada como hex',
    hexOutput: 'Saída como hex',
    plainLabel: 'Texto original',
    encodedLabel: 'Base85',
    plainPlaceholder: 'Digite ou cole o texto aqui...',
    encodedPlaceholder: 'Cole o Base85 aqui...',
    encode: 'Codificar →',
    decode: '← Decodificar',
    swap: 'Inverter',
    copy: 'Copiar',
    copied: 'Copiado',
    clear: 'Limpar',
    invalidTitle: 'Base85 inválido',
    stats: 'Estatísticas',
    chars: 'Caracteres',
    bytes: 'Bytes',
    bits: 'Bits',
    examples: 'Exemplos rápidos',
    exampleMan: 'Man',
    exampleManDistinguished: 'Man is distinguished',
    exampleHello: 'Hello',
    exampleRfc: 'RFC 1924 Base85',
    exampleZ85: 'Hello, world',
    exampleZ85Vector: '864fd26fb559f75b → HelloWorld',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor em src/utils/base85Tool.js implementa os três alfabetos, converte ' +
      'cada grupo de 4 bytes para 5 dígitos base-85 e trata grupos parciais ' +
      'finais (Ascii85/RFC 1924) completando o valor com bytes zero. Z85 exige ' +
      'entrada múltipla de 4 bytes (encoding sempre múltiplo de 5 caracteres).',
  },
  en: {
    title: 'Base85 Encode/Decode (Ascii85)',
    intro: (
      <>
        Encodes and decodes text as Base85 100% in the browser — no data leaves
        this page. Supports three dialects: <Text code>Ascii85</Text> (Adobe,
        with optional <Text code>{'<~ ~>'}</Text> and the{' '}
        <Text code>z</Text> abbreviation), <Text code>RFC 1924</Text> (B85) and{' '}
        <Text code>Z85</Text> (ZeroMQ, used in ZeroMQ frames and libraries like
        libzmq).
      </>
    ),
    dialect: 'Dialect',
    ascii85: 'Ascii85 (Adobe)',
    rfc1924: 'RFC 1924',
    z85: 'Z85 (ZeroMQ)',
    delims: '<~ ~> delimiters',
    zAbbrev: "Abbreviate zero groups as 'z'",
    hexInput: 'Input as hex',
    hexOutput: 'Output as hex',
    plainLabel: 'Plain text',
    encodedLabel: 'Base85',
    plainPlaceholder: 'Type or paste text here...',
    encodedPlaceholder: 'Paste Base85 here...',
    encode: 'Encode →',
    decode: '← Decode',
    swap: 'Swap',
    copy: 'Copy',
    copied: 'Copied',
    clear: 'Clear',
    invalidTitle: 'Invalid Base85',
    stats: 'Statistics',
    chars: 'Characters',
    bytes: 'Bytes',
    bits: 'Bits',
    examples: 'Quick examples',
    exampleMan: 'Man',
    exampleManDistinguished: 'Man is distinguished',
    exampleHello: 'Hello',
    exampleRfc: 'RFC 1924 Base85',
    exampleZ85: 'Hello, world',
    exampleZ85Vector: '864fd26fb559f75b → HelloWorld',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine in src/utils/base85Tool.js implements the three alphabets, ' +
      'converts each 4-byte group to 5 base-85 digits and handles partial ' +
      'trailing groups (Ascii85/RFC 1924) by zero-padding the value. Z85 ' +
      'requires input length to be a multiple of 4 bytes (encoding is always a ' +
      'multiple of 5 characters).',
  },
}

const SOURCE_CODE = `const ASCII85_ALPHABET = (() => {
  let s = '';
  for (let i = 33; i <= 117; i++) s += String.fromCharCode(i);
  return s;
})();

const RFC1924_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_\`{|}~';

const Z85_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';

const POW85 = [Math.pow(85, 4), Math.pow(85, 3), Math.pow(85, 2), 85, 1];

function groupValue(bytes, offset, count) {
  let n = 0;
  for (let j = 0; j < count; j++) n |= bytes[offset + j] << (24 - 8 * j);
  return n >>> 0;
}

function toChars(n, alphabet) {
  let out = '';
  for (const p of POW85) {
    const d = Math.floor(n / p);
    out += alphabet[d];
    n -= d * p;
  }
  return out;
}

export function encodeBase85(bytes, alphabet = RFC1924_ALPHABET, opts = {}) {
  const ascii85 = opts.ascii85 === true;
  const zAbbrev = opts.zAbbrev !== false;
  const delims = opts.delims === true;

  if (bytes.length === 0) return ascii85 && delims ? '<~~>' : '';
  let out = '';
  let i = 0;
  for (; i + 4 <= bytes.length; i += 4) {
    const n = groupValue(bytes, i, 4);
    if (ascii85 && zAbbrev && n === 0) out += 'z';
    else out += toChars(n, alphabet);
  }
  const rest = bytes.length - i;
  if (rest > 0) {
    const n = groupValue(bytes, i, rest);
    out += toChars(n, alphabet).slice(0, rest + 1);
  }
  return ascii85 && delims ? \`<~\${out}~>\` : out;
}

export function decodeBase85(input, alphabet = RFC1924_ALPHABET, opts = {}) {
  const ascii85 = opts.ascii85 === true;
  let clean = String(input).replace(/\\s+/g, '');
  if (ascii85) {
    if (clean.startsWith('<~')) clean = clean.slice(2);
    if (clean.endsWith('~>')) clean = clean.slice(0, -2);
    else if (clean.endsWith('~')) clean = clean.slice(0, -1);
  }
  if (!clean) return new Uint8Array(0);
  const bytes = [];
  let group = [];
  const flushGroup = (values) => {
    if (values.length === 5) {
      let n = 0;
      for (const g of values) n = n * 85 + g;
      bytes.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
      return;
    }
    const k = values.length;
    if (k === 1) throw new Error('Invalid base85 trailing group');
    let v = 0;
    for (const g of values) v = v * 85 + g;
    const scale = POW85[k - 1];
    const low = v * scale;
    const mod = Math.pow(2, 8 * (5 - k));
    const n = Math.ceil(low / mod) * mod;
    if (n - low >= scale || n >= Math.pow(2, 32))
      throw new Error('Invalid base85 trailing group');
    for (let j = 0; j < k - 1; j++) bytes.push((n >>> (24 - 8 * j)) & 0xff);
  };
  for (const c of clean) {
    if (ascii85 && c === 'z') {
      if (group.length > 0) throw new Error('invalid "z" group');
      bytes.push(0, 0, 0, 0);
      continue;
    }
    const v = alphabet.indexOf(c);
    if (v === -1) throw new Error(\`Invalid base85 character: "\${c}"\`);
    group.push(v);
    if (group.length === 5) {
      flushGroup(group);
      group = [];
    }
  }
  if (group.length > 0) flushGroup(group);
  return new Uint8Array(bytes);
}`

export default function Base85ToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [plain, setPlain] = useState('')
  const [encoded, setEncoded] = useState('')
  const [error, setError] = useState(null)
  const [dialect, setDialect] = useState(DIALECT.ASCII85)
  const [delims, setDelims] = useState(false)
  const [zAbbrev, setZAbbrev] = useState(true)
  const [hexInput, setHexInput] = useState(false)
  const [hexOutput, setHexOutput] = useState(false)

  const plainStats = useMemo(() => base85Stats(plain), [plain])

  const encodeValue = useCallback(
    (text) => {
      const bytes = hexInput ? hexToBytes(text) : new TextEncoder().encode(text)
      if (dialect === DIALECT.ASCII85) {
        return encodeBase85(bytes, ASCII85_ALPHABET, { ascii85: true, delims, zAbbrev })
      }
      if (dialect === DIALECT.RFC1924) {
        return encodeBase85(bytes, RFC1924_ALPHABET)
      }
      return encodeBase85(bytes, Z85_ALPHABET)
    },
    [dialect, delims, zAbbrev, hexInput]
  )

  const decodeValue = useCallback(
    (text) => {
      let bytes
      if (dialect === DIALECT.ASCII85) {
        bytes = decodeBase85(text, ASCII85_ALPHABET, { ascii85: true })
      } else if (dialect === DIALECT.RFC1924) {
        bytes = decodeBase85(text, RFC1924_ALPHABET)
      } else {
        bytes = decodeBase85(text, Z85_ALPHABET, { exact: true })
      }
      return hexOutput ? bytesToHex(bytes) : new TextDecoder().decode(bytes)
    },
    [dialect, hexOutput]
  )

  const copy = useCallback(
    (value) => {
      navigator.clipboard.writeText(value)
      message.success(t.copied)
    },
    [t.copied]
  )

  const handleEncode = useCallback(() => {
    setError(null)
    if (!plain) return
    try {
      setEncoded(encodeValue(plain))
    } catch (err) {
      setError(err.message)
    }
  }, [plain, encodeValue])

  const handleDecode = useCallback(() => {
    setError(null)
    if (!encoded) return
    try {
      setPlain(decodeValue(encoded))
    } catch (err) {
      setError(err.message)
    }
  }, [encoded, decodeValue])

  const handleSwap = useCallback(() => {
    setPlain(encoded)
    setEncoded(plain)
    setError(null)
  }, [encoded, plain])

  const handleClear = useCallback(() => {
    setPlain('')
    setEncoded('')
    setError(null)
  }, [])

  // Re-encode automatically when the dialect or options change and both fields
  // have content, so the output always reflects the current settings.
  useEffect(() => {
    if (!plain || !encoded) return
    setError(null)
    try {
      setEncoded(encodeValue(plain))
    } catch (err) {
      setError(err.message)
    }
  }, [dialect, delims, zAbbrev, hexInput, plain, encodeValue, encoded])

  const applyExample = useCallback(
    (value) => {
      setError(null)
      setHexOutput(false)
      setHexInput(false)
      setPlain(value)
      try {
        setEncoded(encodeValue(value))
      } catch (err) {
        setError(err.message)
      }
    },
    [encodeValue]
  )

  const applyZ85Vector = useCallback(() => {
    setError(null)
    setHexOutput(false)
    setHexInput(true)
    setPlain('864fd26fb559f75b')
    setEncoded(encodeBase85(hexToBytes('864fd26fb559f75b'), Z85_ALPHABET))
  }, [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SwapOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.dialect} size="small">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Segmented
            value={dialect}
            onChange={(v) => {
              setDialect(v)
              setError(null)
            }}
            options={[
              { value: DIALECT.ASCII85, label: t.ascii85 },
              { value: DIALECT.RFC1924, label: t.rfc1924 },
              { value: DIALECT.Z85, label: t.z85 },
            ]}
            block
          />

          <Row gutter={[16, 16]} align="middle">
            {dialect === DIALECT.ASCII85 && (
              <>
                <Col xs={24} sm={12}>
                  <Space>
                    <Switch checked={delims} onChange={setDelims} />
                    <Text>{t.delims}</Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space>
                    <Switch checked={zAbbrev} onChange={setZAbbrev} />
                    <Text>{t.zAbbrev}</Text>
                  </Space>
                </Col>
              </>
            )}
            <Col xs={24} sm={12}>
              <Space>
                <Switch checked={hexInput} onChange={setHexInput} />
                <Text>{t.hexInput}</Text>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space>
                <Switch checked={hexOutput} onChange={setHexOutput} />
                <Text>{t.hexOutput}</Text>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={hexInput ? 'Hex' : t.plainLabel}
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
            title={t.encodedLabel}
            extra={(
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(encoded)}>
                  {t.copy}
                </Button>
              </Space>
            )}
          >
            <TextArea
              rows={7}
              placeholder={t.encodedPlaceholder}
              value={encoded}
              onChange={(e) => setEncoded(e.target.value)}
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

      {error && <Alert type="error" showIcon message={t.invalidTitle} description={error} />}

      <Card title={t.stats} size="small">
        <Space size="large">
          <Statistic title={t.chars} value={plainStats.chars} />
          <Statistic title={t.bytes} value={plainStats.bytes} />
          <Statistic title={t.bits} value={plainStats.bits} />
        </Space>
      </Card>

      <Card title={t.examples} size="small">
        <Space wrap>
          {dialect === DIALECT.ASCII85 && (
            <>
              <Button onClick={() => applyExample(t.exampleMan)}>{t.exampleMan}</Button>
              <Button onClick={() => applyExample('Man is distinguished')}>
                {t.exampleManDistinguished}
              </Button>
              <Button onClick={() => applyExample(t.exampleHello)}>{t.exampleHello}</Button>
            </>
          )}
          {dialect === DIALECT.RFC1924 && (
            <>
              <Button onClick={() => applyExample(t.exampleHello)}>{t.exampleHello}</Button>
              <Button onClick={() => applyExample(t.exampleRfc)}>{t.exampleRfc}</Button>
            </>
          )}
          {dialect === DIALECT.Z85 && (
            <>
              <Button onClick={() => applyExample(t.exampleZ85)}>{t.exampleZ85}</Button>
              <Button onClick={applyZ85Vector}>{t.exampleZ85Vector}</Button>
            </>
          )}
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