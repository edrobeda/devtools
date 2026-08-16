import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Collapse,
  Alert,
  Table,
  Tooltip,
} from 'antd'
import {
  ApartmentOutlined,
  BuildOutlined,
  ClearOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BranchesOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildHuffman,
  encodeText,
  decodeBits,
  layoutTree,
  formatChar,
  PRESETS,
  applyPreset,
  sourceCode,
} from '../utils/huffmanCodingSimulator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const MAX_TREE_LEAVES = 40

const translations = {
  pt: {
    title: 'Simulador de Codificação de Huffman',
    intro:
      'Construa uma árvore de prefixo ótima a partir das frequências de caracteres de um texto. Veja os códigos gerados, a taxa de compressão teórica e a própria árvore — tudo 100% no navegador.',
    inputLabel: 'Texto de entrada',
    inputPlaceholder: 'Digite ou cole um texto para comprimir...',
    buildButton: 'Construir árvore',
    clearButton: 'Limpar',
    presetsTitle: 'Cenários rápidos',
    statsTitle: 'Estatísticas',
    originalBits: 'Bits originais (UTF-8)',
    compressedBits: 'Bits comprimidos',
    compressionRatio: 'Taxa de compressão',
    treeNodes: 'Nós da árvore',
    treeLeaves: 'Folhas',
    treeHeight: 'Altura',
    codesTitle: 'Tabela de códigos',
    charColumn: 'Caractere',
    freqColumn: 'Frequência',
    codeColumn: 'Código Huffman',
    bitsColumn: 'Bits/símbolo',
    encodedTitle: 'Bits codificados',
    decodedTitle: 'Texto decodificado',
    decodedMatch: 'Decodificação verificada — bate com o original',
    decodedMismatch: 'A decodificação não bate com o original',
    copy: 'Copiar',
    copied: 'Copiado',
    emptyAlert: 'Digite algum texto para construir a árvore.',
    treeTitle: 'Visualização da árvore',
    treeTooLarge: 'Árvore muito grande para visualização limpa (mais de {max} folhas). Reduza o alfabeto ou use um texto mais curto.',
    sourceCode: 'Código-fonte do motor',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        A codificação de Huffman atribui códigos binários mais curtos aos símbolos mais frequentes e
        códigos mais longos aos menos frequentes. A árvore é construída unindo iterativamente os dois
        nós de menor frequência, garantindo que nenhum código seja prefixo de outro. O resultado é um
        código livre de prefixo que minimiza o número esperado de bits por caractere quando as
        frequências são conhecidas.
      </>
    ),
  },
  en: {
    title: 'Huffman Coding Simulator',
    intro:
      'Build an optimal prefix tree from the character frequencies of a text. See the generated codes, the theoretical compression ratio and the tree itself — all 100% in the browser.',
    inputLabel: 'Input text',
    inputPlaceholder: 'Type or paste text to compress...',
    buildButton: 'Build tree',
    clearButton: 'Clear',
    presetsTitle: 'Quick scenarios',
    statsTitle: 'Statistics',
    originalBits: 'Original bits (UTF-8)',
    compressedBits: 'Compressed bits',
    compressionRatio: 'Compression ratio',
    treeNodes: 'Tree nodes',
    treeLeaves: 'Leaves',
    treeHeight: 'Height',
    codesTitle: 'Code table',
    charColumn: 'Character',
    freqColumn: 'Frequency',
    codeColumn: 'Huffman code',
    bitsColumn: 'Bits/symbol',
    encodedTitle: 'Encoded bits',
    decodedTitle: 'Decoded text',
    decodedMatch: 'Decoded correctly — matches the original',
    decodedMismatch: 'Decoded output does not match the original',
    copy: 'Copy',
    copied: 'Copied',
    emptyAlert: 'Enter some text to build the tree.',
    treeTitle: 'Tree visualization',
    treeTooLarge: 'Tree is too large for a clean visualization (more than {max} leaves). Reduce the alphabet or use a shorter text.',
    sourceCode: 'Engine source code',
    explanationTitle: 'How it works',
    explanation: (
      <>
        Huffman coding assigns shorter binary codes to more frequent symbols and longer codes to less
        frequent ones. The tree is built by repeatedly merging the two lowest-frequency nodes,
        ensuring that no code is a prefix of another. The result is a prefix-free code that minimizes
        the expected number of bits per character when the frequencies are known.
      </>
    ),
  },
}

function TreeSvg({ layout }) {
  const { nodes, links, bounds } = layout
  const nodeRadius = Math.max(4, Math.min(14, 180 / (nodes.length || 1)))
  const showLabels = nodes.length <= 60

  return (
    <div style={{ overflow: 'auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${bounds.width} ${bounds.height}`}
        style={{ minWidth: bounds.width, minHeight: bounds.height, display: 'block' }}
        role="img"
        aria-label="huffman tree"
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#bfbfbf" />
          </marker>
        </defs>
        {links.map((link, i) => (
          <g key={`l-${i}`}>
            <line
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              stroke="#bfbfbf"
              strokeWidth={1.5}
            />
            {showLabels && (
              <text
                x={(link.source.x + link.target.x) / 2}
                y={(link.source.y + link.target.y) / 2 - 4}
                textAnchor="middle"
                fontSize={11}
                fill="#8c8c8c"
              >
                {link.label}
              </text>
            )}
          </g>
        ))}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill={node.isLeaf ? '#52c41a' : '#1677ff'}
              stroke="#fff"
              strokeWidth={2}
            />
            {showLabels && node.isLeaf && (
              <g>
                <text
                  x={node.x}
                  y={node.y + nodeRadius + 14}
                  textAnchor="middle"
                  fontSize={12}
                  fill="rgba(0,0,0,0.85)"
                >
                  {formatChar(node.char)}
                </text>
                <text
                  x={node.x}
                  y={node.y + nodeRadius + 28}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#8c8c8c"
                >
                  {node.freq}
                </text>
              </g>
            )}
            {showLabels && !node.isLeaf && (
              <text
                x={node.x}
                y={node.y - nodeRadius - 6}
                textAnchor="middle"
                fontSize={10}
                fill="#8c8c8c"
              >
                {node.freq}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function HuffmanCodingSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [text, setText] = useState('')
  const [lastBuilt, setLastBuilt] = useState('')
  const [copiedField, setCopiedField] = useState(null)

  const result = useMemo(() => {
    if (!lastBuilt) return null
    return buildHuffman(lastBuilt)
  }, [lastBuilt])

  const layout = useMemo(() => {
    if (!result || !result.root) return null
    return layoutTree(result.root, 800, 320)
  }, [result])

  const handleBuild = useCallback(() => {
    setLastBuilt(text)
  }, [text])

  const handleClear = useCallback(() => {
    setText('')
    setLastBuilt('')
  }, [])

  const handleApplyPreset = useCallback(
    (key) => {
      const value = applyPreset(key, lang)
      setText(value)
      setLastBuilt(value)
    },
    [lang]
  )

  const copyToClipboard = useCallback((value, field) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1200)
    })
  }, [])

  const copySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopiedField('source')
      setTimeout(() => setCopiedField(null), 1200)
    })
  }, [])

  const codeColumns = [
    {
      title: t.charColumn,
      dataIndex: 'char',
      key: 'char',
      render: (char) => <Text code>{formatChar(char)}</Text>,
    },
    {
      title: t.freqColumn,
      dataIndex: 'freq',
      key: 'freq',
      sorter: (a, b) => a.freq - b.freq,
    },
    {
      title: t.codeColumn,
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Text code copyable>{code}</Text>,
    },
    {
      title: t.bitsColumn,
      dataIndex: 'bits',
      key: 'bits',
      sorter: (a, b) => a.bits - b.bits,
    },
  ]

  const codeData = useMemo(() => {
    if (!result) return []
    return Object.entries(result.codes)
      .map(([char, code]) => ({
        key: char,
        char,
        freq: result.frequencies.find((f) => f.char === char)?.freq || 0,
        code,
        bits: code.length,
      }))
      .sort((a, b) => b.freq - a.freq)
  }, [result])

  const decodedMatches = result ? result.decoded === lastBuilt : false

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.inputLabel}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <TextArea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.inputPlaceholder}
                maxLength={5000}
                showCount
              />
              <Space wrap>
                <Button type="primary" icon={<BuildOutlined />} onClick={handleBuild}>
                  {t.buildButton}
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleClear}>
                  {t.clearButton}
                </Button>
              </Space>
            </Space>
          </Card>

          <Card title={t.presetsTitle} style={{ marginTop: 16 }}>
            <Space wrap>
              {presets.map((preset) => (
                <Button key={preset.key} onClick={() => handleApplyPreset(preset.key)}>
                  {preset.label}
                </Button>
              ))}
            </Space>
          </Card>

          {result && (
            <Card title={t.statsTitle} style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Statistic title={t.originalBits} value={result.originalBits} />
                </Col>
                <Col xs={12}>
                  <Statistic title={t.compressedBits} value={result.compressedBits} />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title={t.compressionRatio}
                    value={result.compressionRatio}
                    precision={2}
                    suffix="×"
                  />
                </Col>
                <Col xs={12}>
                  <Statistic title={t.treeNodes} value={result.nodeCount} />
                </Col>
                <Col xs={12}>
                  <Statistic title={t.treeLeaves} value={result.leafCount} />
                </Col>
                <Col xs={12}>
                  <Statistic title={t.treeHeight} value={result.treeHeight} />
                </Col>
              </Row>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={12}>
          {!result && (
            <Alert type="info" showIcon message={t.emptyAlert} />
          )}

          {result && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Card title={t.codesTitle}>
                <Table
                  dataSource={codeData}
                  columns={codeColumns}
                  pagination={{ pageSize: 8, size: 'small' }}
                  size="small"
                  scroll={{ x: 'max-content' }}
                />
              </Card>

              <Card
                title={t.encodedTitle}
                extra={
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(result.encoded, 'encoded')}
                  >
                    {copiedField === 'encoded' ? t.copied : t.copy}
                  </Button>
                }
              >
                <TextArea
                  rows={4}
                  value={result.encoded}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Card>

              <Card title={t.decodedTitle}>
                <Alert
                  type={decodedMatches ? 'success' : 'error'}
                  showIcon
                  icon={decodedMatches ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  message={decodedMatches ? t.decodedMatch : t.decodedMismatch}
                />
                <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                  <Text code>{result.decoded}</Text>
                </Paragraph>
              </Card>
            </Space>
          )}
        </Col>
      </Row>

      {result && (
        <Card title={t.treeTitle} icon={<BranchesOutlined />}>
          {result.leafCount > MAX_TREE_LEAVES ? (
            <Alert type="warning" message={t.treeTooLarge.replace('{max}', MAX_TREE_LEAVES)} />
          ) : layout ? (
            <TreeSvg layout={layout} />
          ) : null}
        </Card>
      )}

      <Card title={t.explanationTitle}>
        <Paragraph>{t.explanation}</Paragraph>
      </Card>

      <Collapse defaultActiveKey={[]}>
        <Panel
          header={t.sourceCode}
          extra={
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                copySource()
              }}
            >
              {copiedField === 'source' ? t.copied : t.copy}
            </Button>
          }
        >
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{sourceCode()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
