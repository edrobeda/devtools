import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, message, Collapse, Switch, Row, Col, Statistic } from 'antd'
import { SwapOutlined, CopyOutlined, ArrowsAltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { encodeBase32, decodeBase32, isValidBase32, base32Stats } from '../utils/base32Tool'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Base32 Encode/Decode',
    intro: (
      <>
        Codifica e decodifica texto no padrão Base32 (RFC 4648) 100% no
        navegador — nenhum dado sai daqui. Base32 é usado em secrets de TOTP,
        registros DNS e protocolos que precisam de caracteres alfanuméricos
        legíveis.
      </>
    ),
    plainLabel: 'Texto original',
    base32Label: 'Base32',
    plainPlaceholder: 'Digite ou cole o texto aqui...',
    base32Placeholder: 'Cole o Base32 aqui...',
    encode: 'Codificar →',
    decode: '← Decodificar',
    swap: 'Inverter',
    copy: 'Copiar',
    copied: 'Copiado',
    clear: 'Limpar',
    options: 'Opções',
    padding: 'Incluir padding (=)',
    lowercase: 'Saída minúscula',
    group: 'Agrupar a cada 4 caracteres',
    invalidTitle: 'Base32 inválido',
    stats: 'Estatísticas',
    chars: 'Caracteres',
    bytes: 'Bytes',
    bits: 'Bits',
    examples: 'Exemplos rápidos',
    exampleHello: 'Olá',
    exampleTotp: 'Secret TOTP',
    exampleEmoji: 'Emoji 🚀',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor em src/utils/base32Tool.js implementa o alfabeto RFC 4648 (A-Z, 2-7), ' +
      'converte UTF-8 para bytes com TextEncoder, agrupa os bits em blocos de 5 e ' +
      'mapeia para o alfabeto. A decodificação faz o caminho inverso e valida caracteres.',
  },
  en: {
    title: 'Base32 Encode/Decode',
    intro: (
      <>
        Encodes and decodes text using standard Base32 (RFC 4648) 100% in the
        browser — no data leaves this page. Base32 is used for TOTP secrets,
        DNS records and protocols that need readable alphanumeric characters.
      </>
    ),
    plainLabel: 'Plain text',
    base32Label: 'Base32',
    plainPlaceholder: 'Type or paste text here...',
    base32Placeholder: 'Paste Base32 here...',
    encode: 'Encode →',
    decode: '← Decode',
    swap: 'Swap',
    copy: 'Copy',
    copied: 'Copied',
    clear: 'Clear',
    options: 'Options',
    padding: 'Include padding (=)',
    lowercase: 'Lowercase output',
    group: 'Group every 4 characters',
    invalidTitle: 'Invalid Base32',
    stats: 'Statistics',
    chars: 'Characters',
    bytes: 'Bytes',
    bits: 'Bits',
    examples: 'Quick examples',
    exampleHello: 'Hello',
    exampleTotp: 'TOTP secret',
    exampleEmoji: 'Emoji 🚀',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine in src/utils/base32Tool.js implements the RFC 4648 alphabet ' +
      '(A-Z, 2-7), converts UTF-8 to bytes via TextEncoder, groups the bits into ' +
      '5-bit chunks and maps them to the alphabet. Decoding reverses the process ' +
      'and validates characters.',
  },
}

const SOURCE_CODE = `const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const CHAR_TO_VALUE = new Map([...ALPHABET].map((c, i) => [c, i]));

export function encodeBase32(str, options = {}) {
  const { padding = true, lowercase = false, groupSize = 0 } = options;
  const alphabet = lowercase ? ALPHABET.toLowerCase() : ALPHABET;
  const bytes = new TextEncoder().encode(String(str));

  let out = '';
  let bits = 0;
  let value = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  if (padding) while (out.length % 8 !== 0) out += '=';
  if (groupSize > 0) out = out.match(new RegExp(\`.{1,\${groupSize}}\`, 'g')).join(' ');

  return out;
}

export function decodeBase32(input) {
  const cleaned = input.replace(/=+$/, '').replace(/[\\s\\-]+/g, '').toUpperCase();
  let bits = 0, value = 0;
  const bytes = [];
  for (const c of cleaned) {
    const v = CHAR_TO_VALUE.get(c);
    if (v === undefined) throw new Error(\`Invalid base32 character: "\${c}"\`);
    value = (value << 5) | v;
    bits += 5;
    while (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}`

export default function Base32ToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [plain, setPlain] = useState('')
  const [base32, setBase32] = useState('')
  const [error, setError] = useState(null)
  const [padding, setPadding] = useState(true)
  const [lowercase, setLowercase] = useState(false)
  const [group, setGroup] = useState(false)

  const plainStats = useMemo(() => base32Stats(plain), [plain])

  const applyExample = (value) => {
    setPlain(value)
    setError(null)
    try {
      setBase32(encodeBase32(value, { padding, lowercase, groupSize: group ? 4 : 0 }))
    } catch (err) {
      setError(err.message)
    }
  }

  const copy = (value) => {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  const handleEncode = () => {
    setError(null)
    try {
      setBase32(encodeBase32(plain, { padding, lowercase, groupSize: group ? 4 : 0 }))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDecode = () => {
    setError(null)
    if (!isValidBase32(base32)) {
      setError(lang === 'pt' ? 'Caracteres Base32 inválidos.' : 'Invalid Base32 characters.')
      return
    }
    try {
      setPlain(decodeBase32(base32))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSwap = () => {
    setPlain(base32)
    setBase32(plain)
    setError(null)
  }

  const handleClear = () => {
    setPlain('')
    setBase32('')
    setError(null)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.options} size="small">
        <Space size="large" wrap>
          <Switch checked={padding} onChange={setPadding} checkedChildren={t.padding} unCheckedChildren={t.padding} />
          <Switch checked={lowercase} onChange={setLowercase} checkedChildren={t.lowercase} unCheckedChildren={t.lowercase} />
          <Switch checked={group} onChange={setGroup} checkedChildren={t.group} unCheckedChildren={t.group} />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={t.plainLabel}
            extra={(
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(plain)}>{t.copy}</Button>
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
            title={t.base32Label}
            extra={(
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(base32)}>{t.copy}</Button>
              </Space>
            )}
          >
            <TextArea
              rows={7}
              placeholder={t.base32Placeholder}
              value={base32}
              onChange={(e) => setBase32(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ width: '100%', justifyContent: 'center' }} wrap>
        <Button type="primary" onClick={handleEncode}>{t.encode}</Button>
        <Button onClick={handleDecode}>{t.decode}</Button>
        <Button icon={<ArrowsAltOutlined />} onClick={handleSwap}>{t.swap}</Button>
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
          <Button onClick={() => applyExample(t.exampleHello)}>{t.exampleHello}</Button>
          <Button onClick={() => applyExample(t.exampleTotp)}>{t.exampleTotp}</Button>
          <Button onClick={() => applyExample(t.exampleEmoji)}>{t.exampleEmoji}</Button>
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
