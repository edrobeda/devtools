import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Row,
  Col,
  Segmented,
  InputNumber,
  Button,
  Statistic,
  Divider,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd'
import { CalculatorOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const BASES = {
  bin: { radix: 2, pattern: /^[01]*$/ },
  dec: { radix: 10, pattern: /^[0-9]*$/ },
  hex: { radix: 16, pattern: /^[0-9a-fA-F]*$/ },
}

const WIDTHS = [8, 16, 32, 64]

const OPERATIONS = [
  { key: 'AND', symbol: '&', unary: false },
  { key: 'OR', symbol: '|', unary: false },
  { key: 'XOR', symbol: '^', unary: false },
  { key: 'NAND', symbol: '~(a&b)', unary: false },
  { key: 'NOR', symbol: '~(a|b)', unary: false },
  { key: 'XNOR', symbol: '~(a^b)', unary: false },
  { key: 'NOTA', symbol: '~a', unary: true },
  { key: 'NOTB', symbol: '~b', unary: true },
  { key: 'LSH', symbol: 'a << n', unary: false, shift: true },
  { key: 'RSH', symbol: 'a >> n', unary: false, shift: true },
]

const translations = {
  pt: {
    title: 'Calculadora Bit a Bit',
    intro:
      'Faça operações bitwise (AND, OR, XOR, NOT, shifts) entre dois inteiros e veja o resultado em binário, decimal e hexadecimal — com a grade de bits destacada. Defina a largura (8/16/32/64) para truncar e inverter dentro do limite. Tudo no navegador, nada sai daqui.',
    operation: 'Operação',
    width: 'Largura de bits',
    inputBase: 'Base de entrada',
    operandA: 'Operando A',
    operandB: 'Operando B',
    shiftBy: 'Deslocar por (n)',
    result: 'Resultado',
    bin: 'Binário',
    dec: 'Decimal',
    hex: 'Hexadecimal',
    bitsA: 'Bits de A',
    bitsB: 'Bits de B',
    bitsR: 'Bits do resultado',
    unaryNote: 'Operação unária — usa só A (B é ignorado).',
    invalid: 'Caractere inválido pra essa base.',
    copy: 'Copiar',
    copied: 'Copiado',
    referenceTitle: 'Referência de operadores bitwise (JavaScript)',
    referenceIntro:
      'No JavaScript, os operadores bitwise trabalham com inteiros de 32 bits com sinal (exceto >>>, que é sem sinal). Para larguras maiores ou sem risco de overflow, use BigInt com o sufixo n — exatamente o que esta página faz.',
    colOperator: 'Operador',
    colName: 'Nome',
    colExample: 'Exemplo',
    colResult: 'Resultado',
  },
  en: {
    title: 'Bitwise Calculator',
    intro:
      'Perform bitwise operations (AND, OR, XOR, NOT, shifts) between two integers and see the result in binary, decimal and hexadecimal — with the bit grid highlighted. Set the width (8/16/32/64) to truncate and invert within the limit. Everything runs in the browser, nothing leaves.',
    operation: 'Operation',
    width: 'Bit width',
    inputBase: 'Input base',
    operandA: 'Operand A',
    operandB: 'Operand B',
    shiftBy: 'Shift by (n)',
    result: 'Result',
    bin: 'Binary',
    dec: 'Decimal',
    hex: 'Hexadecimal',
    bitsA: 'Bits of A',
    bitsB: 'Bits of B',
    bitsR: 'Bits of result',
    unaryNote: 'Unary operation — uses A only (B is ignored).',
    invalid: 'Invalid character for this base.',
    copy: 'Copy',
    copied: 'Copied',
    referenceTitle: 'Bitwise operators reference (JavaScript)',
    referenceIntro:
      'In JavaScript, bitwise operators work on signed 32-bit integers (except >>>, which is unsigned). For larger widths or to avoid overflow, use BigInt with the n suffix — exactly what this page does.',
    colOperator: 'Operator',
    colName: 'Name',
    colExample: 'Example',
    colResult: 'Result',
  },
}

const REFERENCE_ROWS = [
  { op: '&', namePt: 'AND bit a bit', nameEn: 'Bitwise AND', example: '0b1100 & 0b1010', result: '0b1000  (8)' },
  { op: '|', namePt: 'OR bit a bit', nameEn: 'Bitwise OR', example: '0b1100 | 0b1010', result: '0b1110  (14)' },
  { op: '^', namePt: 'XOR bit a bit', nameEn: 'Bitwise XOR', example: '0b1100 ^ 0b1010', result: '0b0110  (6)' },
  { op: '~', namePt: 'NOT (inverte)', nameEn: 'NOT (inverts)', example: '~0b1100', result: '-13  (32-bit)' },
  { op: '<<', namePt: 'Desloc. à esquerda', nameEn: 'Left shift', example: '0b0001 << 3', result: '0b1000  (8)' },
  { op: '>>', namePt: 'Desloc. à direita (sinal)', nameEn: 'Right shift (sign)', example: '0b1000 >> 2', result: '0b0010  (2)' },
  { op: '>>>', namePt: 'Desloc. à direita (sem sinal)', nameEn: 'Unsigned right shift', example: '-1 >>> 0', result: '4294967295' },
  { op: '&=', namePt: 'AND com atribuição', nameEn: 'AND assignment', example: 'x &= 0b0011', result: 'x = x & 0b0011' },
]

function parseOperand(raw, baseKey) {
  if (raw === '') return 0n
  const { radix, pattern } = BASES[baseKey]
  if (!pattern.test(raw)) return null
  try {
    // BigInt(string) sempre interpreta como base 10 — por isso prefixamos
    // com 0b/0o/0x pra forçar a base correta (mesma técnica do base-converter).
    const literal = radix === 10 ? raw : '0' + { 2: 'b', 8: 'o', 16: 'x' }[radix] + raw
    return BigInt(literal)
  } catch {
    return null
  }
}

function padBits(value, width) {
  return value.toString(2).padStart(width, '0')
}

function toCells(bitsStr) {
  return bitsStr.split('').map((c) => c === '1')
}

export default function BitwiseCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [baseKey, setBaseKey] = useState('bin')
  const [width, setWidth] = useState(8)
  const [opKey, setOpKey] = useState('AND')
  const [aRaw, setARaw] = useState('1100')
  const [bRaw, setBRaw] = useState('1010')
  const [shiftN, setShiftN] = useState(2)

  const computed = useMemo(() => {
    const widthN = Number(width)
    const mask = (1n << BigInt(widthN)) - 1n

    const aParsed = parseOperand(aRaw, baseKey)
    const bParsed = parseOperand(bRaw, baseKey)

    if (aParsed === null || bParsed === null) {
      return { error: t.invalid }
    }

    // Trunca os operandos pra largura escolhida (não-negativos).
    const a = aParsed & mask
    const b = bParsed & mask
    const n = BigInt(Math.max(0, Math.min(shiftN, widthN)))

    let r
    switch (opKey) {
      case 'AND':
        r = a & b
        break
      case 'OR':
        r = a | b
        break
      case 'XOR':
        r = a ^ b
        break
      case 'NAND':
        r = ~(a & b) & mask
        break
      case 'NOR':
        r = ~(a | b) & mask
        break
      case 'XNOR':
        r = ~(a ^ b) & mask
        break
      case 'NOTA':
        r = ~a & mask
        break
      case 'NOTB':
        r = ~b & mask
        break
      case 'LSH':
        r = (a << n) & mask
        break
      case 'RSH':
        r = a >> n
        break
      default:
        r = 0n
    }
    r &= mask

    const hexLen = Math.ceil(widthN / 4)
    return {
      a,
      b,
      r,
      aBits: padBits(a, widthN),
      bBits: padBits(b, widthN),
      rBits: padBits(r, widthN),
      aCells: toCells(padBits(a, widthN)),
      bCells: toCells(padBits(b, widthN)),
      rCells: toCells(padBits(r, widthN)),
      bin: padBits(r, widthN),
      dec: r.toString(10),
      hex: r.toString(16).toUpperCase().padStart(hexLen, '0'),
    }
  }, [aRaw, bRaw, baseKey, width, opKey, shiftN, t.invalid])

  const op = OPERATIONS.find((o) => o.key === opKey)
  const error = computed.error

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  function fillExample() {
    setBaseKey('bin')
    setWidth(8)
    setOpKey('AND')
    setARaw('1100')
    setBRaw('1010')
    setShiftN(2)
  }

  const referenceColumns = [
    { title: t.colOperator, dataIndex: 'op', key: 'op', render: (v) => <Text code strong>{v}</Text> },
    { title: t.colName, key: 'name', render: (_, row) => <Text>{lang === 'pt' ? row.namePt : row.nameEn}</Text> },
    { title: t.colExample, dataIndex: 'example', key: 'example', render: (v) => <Text code>{v}</Text> },
    { title: t.colResult, dataIndex: 'result', key: 'result', render: (v) => <Text code>{v}</Text> },
  ]

  // Agrupa os bits em bytes (8 em 8) pra facilitar a leitura.
  const byteGroups = useMemo(() => {
    const w = Number(width)
    const groups = []
    for (let i = 0; i < w; i += 8) {
      const end = Math.min(i + 8, w)
      groups.push({ start: i, end })
    }
    return groups
  }, [width])

  function renderBitRow(label, cells, color) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ width: 120, flexShrink: 0, fontSize: 12 }}>{label}</Text>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {byteGroups.map((g, gi) => {
            const slice = cells.slice(g.start, g.end).map((on, idx) => ({ on, idx: g.start + idx }))
            return (
              <div key={gi} style={{ display: 'flex', gap: 2 }}>
                {slice.map(({ on, idx }) => (
                  <Tooltip key={idx} title={`bit ${idx}: ${on ? 1 : 0}`}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        borderRadius: 3,
                        cursor: 'default',
                        background: on ? color : '#f0f0f0',
                        color: on ? '#fff' : '#bfbfbf',
                        border: '1px solid #d9d9d9',
                      }}
                    >
                      {on ? 1 : 0}
                    </div>
                  </Tooltip>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const baseOptions = [
    { label: t.bin, value: 'bin' },
    { label: t.dec, value: 'dec' },
    { label: t.hex, value: 'hex' },
  ]
  const opOptions = OPERATIONS.map((o) => ({ label: o.symbol, value: o.key }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          <CalculatorOutlined style={{ marginRight: 12 }} />
          {t.title}
        </Title>
        <Paragraph type="secondary">{t.intro}</Paragraph>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">{t.inputBase}</Text>
            <Segmented
              options={baseOptions}
              value={baseKey}
              onChange={setBaseKey}
              block
              style={{ marginTop: 4 }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">{t.width}</Text>
            <Segmented
              options={WIDTHS.map((w) => ({ label: `${w}`, value: w }))}
              value={width}
              onChange={setWidth}
              block
              style={{ marginTop: 4 }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">{t.operation}</Text>
            <Segmented
              options={opOptions}
              value={opKey}
              onChange={setOpKey}
              block
              style={{ marginTop: 4 }}
            />
          </Col>
          {op.shift && (
            <Col xs={24} sm={12} md={6}>
              <Text type="secondary">{t.shiftBy}</Text>
              <InputNumber
                min={0}
                max={width}
                value={shiftN}
                onChange={(v) => setShiftN(v ?? 0)}
                style={{ width: '100%', marginTop: 4 }}
              />
            </Col>
          )}
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text strong>{t.operandA}</Text>
            <Input
              value={aRaw}
              onChange={(e) => setARaw(e.target.value)}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
              placeholder={baseKey === 'bin' ? '1100' : baseKey === 'dec' ? '12' : 'C'}
            />
          </Col>
          <Col xs={24} md={12}>
            <Text strong>{t.operandB}</Text>
            <Input
              value={bRaw}
              onChange={(e) => setBRaw(e.target.value)}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
              placeholder={baseKey === 'bin' ? '1010' : baseKey === 'dec' ? '10' : 'A'}
              disabled={op.unary}
            />
            {op.unary && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t.unaryNote}</Text>
            )}
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Button type="link" onClick={fillExample} style={{ padding: 0 }}>
            {lang === 'pt' ? 'Carregar exemplo' : 'Load example'}
          </Button>
        </div>

        {error ? (
          <Text type="danger">{error}</Text>
        ) : (
          <>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {renderBitRow(t.bitsA, computed.aCells, '#1677ff')}
              {renderBitRow(t.bitsB, computed.bCells, '#52c41a')}
              {renderBitRow(t.bitsR, computed.rCells, '#fa541c')}
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic
                  title={t.bin}
                  value={computed.bin}
                  formatter={() => (
                    <span style={{ fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all' }}>{computed.bin}</span>
                  )}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(computed.bin)}
                >{t.copy}</Button>
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title={t.dec}
                  value={computed.dec}
                  formatter={() => (
                    <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{computed.dec}</span>
                  )}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(computed.dec)}
                >{t.copy}</Button>
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title={t.hex}
                  value={computed.hex}
                  formatter={() => (
                    <span style={{ fontFamily: 'monospace', fontSize: 14 }}>0x{computed.hex}</span>
                  )}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy('0x' + computed.hex)}
                >{t.copy}</Button>
              </Col>
            </Row>
          </>
        )}
      </Card>

      <Card title={t.referenceTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>{t.referenceIntro}</Paragraph>
        <Table
          dataSource={REFERENCE_ROWS}
          columns={referenceColumns}
          rowKey="op"
          pagination={false}
          size="small"
        />
        <div style={{ marginTop: 12 }}>
          <Tag color="blue">{lang === 'pt' ? 'Máscara usada nesta página' : 'Mask used on this page'}: (1n &lt;&lt; width) - 1n</Tag>
        </div>
      </Card>
    </Space>
  )
}
