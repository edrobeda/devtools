import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Statistic,
  Collapse,
  Alert,
  List,
  Empty,
  Select,
} from 'antd'
import {
  ApartmentOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildMerkleTree,
  getInclusionProof,
  verifyProof,
  formatHash,
  treeStats,
  getNodePath,
  PRESETS,
  sourceCode,
} from '../utils/merkleTreeSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Simulador de Merkle Tree',
    intro:
      'Construa uma arvore de hashes binaria 100% no navegador. Cada folha e o hash SHA-256 de um bloco de dados; cada no interno e o hash da concatenacao dos dois filhos. A raiz resume todo o conjunto, e e possivel gerar uma prova de inclusao com O(log n) hashes. Util em blockchain, Git, verificacao de integridade e sincronizacao de dados.',
    inputTitle: 'Blocos de dados',
    inputPlaceholder: 'Digite um bloco por linha\nEx.:\ntransacao-1\ntransacao-2\ntransacao-3',
    buildButton: 'Construir arvore',
    rebuildButton: 'Reconstruir',
    clearButton: 'Limpar',
    presetsTitle: 'Cenarios rapidos',
    visualizationTitle: 'Visualizacao da arvore',
    clickLeafHint: 'Clique em uma folha para ver a prova de inclusao.',
    rootTitle: 'Merkle Root',
    statsTitle: 'Estatisticas',
    leaves: 'Folhas',
    nodes: 'Nos',
    depth: 'Altura',
    duplicateHint: 'Folhas duplicadas para completar o ultimo nivel (quantidade impar).',
    proofTitle: 'Prova de inclusao',
    proofIntro: 'Para verificar que um bloco faz parte da arvore, basta reconstruir o caminho ate a raiz usando os hashes irmaos abaixo.',
    noProof: 'Selecione uma folha na arvore para gerar a prova.',
    targetHash: 'Hash do bloco',
    siblingDirectionLeft: 'irmao a esquerda',
    siblingDirectionRight: 'irmao a direita',
    verifyButton: 'Verificar prova',
    verificationOk: 'Prova verificada com sucesso.',
    verificationFail: 'Prova invalida.',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    howItWorks: 'Como funciona',
    howItWorksText:
      'A arvore e construida de baixo para cima: cada folha recebe SHA-256(dado), e cada no interno recebe SHA-256(hashEsquerda + hashDireita). Se o numero de folhas for impar, a ultima folha e duplicada para formar um par. A raiz final e um unico hash que representa todo o conjunto. Uma prova de inclusao contem os hashes irmaos no caminho da folha ate a raiz; qualquer um pode verifica-la sem precisar dos demais dados.',
    emptyTree: 'Nenhuma arvore construida ainda.',
    leafDuplicateLabel: 'duplicado',
  },
  en: {
    title: 'Merkle Tree Simulator',
    intro:
      'Build a binary hash tree 100% in the browser. Each leaf is the SHA-256 hash of a data block; each internal node is the hash of its two children concatenated. The root summarizes the whole set, and an inclusion proof can be generated with O(log n) hashes. Useful for blockchain, Git, integrity checks, and data synchronization.',
    inputTitle: 'Data blocks',
    inputPlaceholder: 'Type one block per line\nE.g.:\ntransaction-1\ntransaction-2\ntransaction-3',
    buildButton: 'Build tree',
    rebuildButton: 'Rebuild',
    clearButton: 'Clear',
    presetsTitle: 'Quick scenarios',
    visualizationTitle: 'Tree visualization',
    clickLeafHint: 'Click a leaf to see its inclusion proof.',
    rootTitle: 'Merkle Root',
    statsTitle: 'Statistics',
    leaves: 'Leaves',
    nodes: 'Nodes',
    depth: 'Depth',
    duplicateHint: 'Duplicated leaf to complete the last level (odd count).',
    proofTitle: 'Inclusion proof',
    proofIntro: 'To verify that a block belongs to the tree, rebuild the path to the root using the sibling hashes below.',
    noProof: 'Select a leaf in the tree to generate a proof.',
    targetHash: 'Block hash',
    siblingDirectionLeft: 'sibling on the left',
    siblingDirectionRight: 'sibling on the right',
    verifyButton: 'Verify proof',
    verificationOk: 'Proof verified successfully.',
    verificationFail: 'Proof is invalid.',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    howItWorks: 'How it works',
    howItWorksText:
      'The tree is built bottom-up: each leaf gets SHA-256(data), and each internal node gets SHA-256(leftHash + rightHash). If the number of leaves is odd, the last leaf is duplicated to form a pair. The final root is a single hash representing the entire set. An inclusion proof contains the sibling hashes along the path from leaf to root; anyone can verify it without needing the remaining data.',
    emptyTree: 'No tree built yet.',
    leafDuplicateLabel: 'duplicated',
  },
}

export default function MerkleTreeSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [input, setInput] = useState('')
  const [tree, setTree] = useState(null)
  const [building, setBuilding] = useState(false)
  const [selectedData, setSelectedData] = useState(null)
  const [proof, setProof] = useState(null)
  const [verification, setVerification] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const svgContainerRef = useRef(null)
  const [svgWidth, setSvgWidth] = useState(640)

  useEffect(() => {
    function updateWidth() {
      if (svgContainerRef.current) {
        setSvgWidth(svgContainerRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const blocks = useMemo(() => {
    return input
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  }, [input])

  const build = useCallback(async () => {
    if (blocks.length === 0) return
    setBuilding(true)
    setSelectedData(null)
    setProof(null)
    setVerification(null)
    try {
      const nextTree = await buildMerkleTree(blocks)
      setTree(nextTree)
    } finally {
      setBuilding(false)
    }
  }, [blocks])

  const applyPreset = useCallback(
    (preset) => {
      const text = preset.items.join('\n')
      setInput(text)
      setSelectedData(null)
      setProof(null)
      setVerification(null)
    },
    []
  )

  const clear = useCallback(() => {
    setInput('')
    setTree(null)
    setSelectedData(null)
    setProof(null)
    setVerification(null)
  }, [])

  const selectLeaf = useCallback(
    async (data) => {
      if (!tree) return
      setSelectedData(data)
      const p = getInclusionProof(tree, data)
      setProof(p)
      setVerification(null)
    },
    [tree]
  )

  const verify = useCallback(async () => {
    if (!proof || !proof.found) return
    const ok = await verifyProof(proof.target, proof.siblings, proof.root)
    setVerification(ok)
  }, [proof])

  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  const stats = useMemo(() => treeStats(tree), [tree])

  const svgLayout = useMemo(() => {
    if (!tree || !tree.levels.length) return null

    const levels = tree.levels
    const depth = levels.length
    const nodeWidth = 76
    const nodeHeight = 28
    const levelHeight = 80
    const paddingX = 12
    const paddingY = 16
    const height = paddingY * 2 + (depth - 1) * levelHeight + nodeHeight
    const width = Math.max(svgWidth, 320)

    const nodes = []
    const nodeByKey = new Map()

    levels.forEach((level, levelIndex) => {
      const count = level.length
      const stepX = count === 1 ? 0 : (width - paddingX * 2 - nodeWidth) / (count - 1)
      const y = paddingY + (depth - 1 - levelIndex) * levelHeight

      level.forEach((node, index) => {
        const x =
          count === 1
            ? width / 2 - nodeWidth / 2
            : paddingX + index * stepX

        const rendered = {
          ...node,
          x,
          y,
          width: nodeWidth,
          height: nodeHeight,
          levelIndex,
          nodeIndex: index,
        }
        nodes.push(rendered)
        nodeByKey.set(`${node.level}:${node.index}`, rendered)
      })
    })

    const links = []
    nodes.forEach((node) => {
      if (!node.isLeaf) {
        const leftKey = `${node.left.level}:${node.left.index}`
        const rightKey = `${node.right.level}:${node.right.index}`
        const left = nodeByKey.get(leftKey)
        const right = nodeByKey.get(rightKey)
        if (left) {
          links.push({
            from: { x: node.x + nodeWidth / 2, y: node.y + nodeHeight },
            to: { x: left.x + nodeWidth / 2, y: left.y },
            source: node,
            target: left,
          })
        }
        if (right) {
          links.push({
            from: { x: node.x + nodeWidth / 2, y: node.y + nodeHeight },
            to: { x: right.x + nodeWidth / 2, y: right.y },
            source: node,
            target: right,
          })
        }
      }
    })

    return { width, height, nodes, links }
  }, [tree, svgWidth])

  const highlightedKeys = useMemo(() => {
    if (!tree || !selectedData) return new Set()
    const path = getNodePath(tree, selectedData)
    const keys = new Set()
    const leaf = tree.leaves.find((l) => l.data === selectedData)
    if (leaf) {
      keys.add(`0:${leaf.index}`)
    }
    path.forEach((step) => {
      keys.add(`${step.level}:${step.index}`)
      keys.add(`${step.level}:${step.siblingIndex}`)
      keys.add(`${step.level + 1}:${step.parentIndex}`)
    })
    return keys
  }, [tree, selectedData])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={t.inputTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <TextArea
                rows={8}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.inputPlaceholder}
              />
              <Space wrap>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={build}
                  loading={building}
                  disabled={blocks.length === 0}
                >
                  {t.buildButton}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={build} disabled={blocks.length === 0 || building}>
                  {t.rebuildButton}
                </Button>
                <Button onClick={clear}>{t.clearButton}</Button>
              </Space>

              <div>
                <Text strong>{t.presetsTitle}: </Text>
                <Space size={[8, 8]} wrap>
                  {presets.map((p) => (
                    <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
                      {p.label}
                    </Button>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>

          {tree && (
            <Card title={t.statsTitle} style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={8}>
                  <Statistic title={t.leaves} value={stats.leafCount} />
                </Col>
                <Col xs={8}>
                  <Statistic title={t.nodes} value={stats.nodeCount} />
                </Col>
                <Col xs={8}>
                  <Statistic title={t.depth} value={stats.depth} />
                </Col>
                <Col xs={24}>
                  <Card size="small">
                    <Text type="secondary">{t.rootTitle}</Text>
                    <div>
                      <Text code copyable={{ text: stats.root }}>
                        {formatHash(stats.root, 12)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={14}>
          <Card title={t.visualizationTitle}>
            {svgLayout ? (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.clickLeafHint}
                </Text>
                <div ref={svgContainerRef}>
                  <svg
                    width="100%"
                    height={svgLayout.height}
                    viewBox={`0 0 ${svgLayout.width} ${svgLayout.height}`}
                    style={{ background: '#fafafa', borderRadius: 8 }}
                  >
                    {svgLayout.links.map((link, i) => {
                      const key = `${link.source.level}:${link.source.index}-${link.target.level}:${link.target.index}`
                      const highlighted =
                        highlightedKeys.has(
                          `${link.source.level}:${link.source.index}`
                        ) &&
                        highlightedKeys.has(
                          `${link.target.level}:${link.target.index}`
                        )
                      return (
                        <line
                          key={key}
                          x1={link.from.x}
                          y1={link.from.y}
                          x2={link.to.x}
                          y2={link.to.y}
                          stroke={highlighted ? '#1677ff' : '#d9d9d9'}
                          strokeWidth={highlighted ? 2.5 : 1.5}
                        />
                      )
                    })}
                    {svgLayout.nodes.map((node) => {
                      const key = `${node.level}:${node.index}`
                      const highlighted = highlightedKeys.has(key)
                      const isSelectedLeaf = node.isLeaf && node.data === selectedData
                      const stroke = isSelectedLeaf
                        ? '#1677ff'
                        : highlighted
                        ? '#1677ff'
                        : '#d9d9d9'
                      const fill = isSelectedLeaf
                        ? '#e6f4ff'
                        : highlighted
                        ? '#f0f5ff'
                        : '#ffffff'
                      return (
                        <g key={key}>
                          <rect
                            x={node.x}
                            y={node.y}
                            width={node.width}
                            height={node.height}
                            rx={4}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={isSelectedLeaf ? 2 : 1}
                            style={{
                              cursor: node.isLeaf ? 'pointer' : 'default',
                            }}
                            onClick={() =>
                              node.isLeaf ? selectLeaf(node.data) : undefined
                            }
                          />
                          <text
                            x={node.x + node.width / 2}
                            y={node.y + node.height / 2 + 4}
                            textAnchor="middle"
                            fontSize={10}
                            fill={highlighted ? '#1677ff' : '#595959'}
                            style={{
                              pointerEvents: 'none',
                              userSelect: 'none',
                            }}
                          >
                            {node.isLeaf
                              ? node.data.slice(0, 8) || node.data
                              : formatHash(node.hash, 6)}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
                {tree.leaves.some((l) => l.isDuplicate) && (
                  <Alert type="info" showIcon message={t.duplicateHint} />
                )}
              </Space>
            ) : (
              <Empty description={t.emptyTree} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {tree && (
        <Card title={t.proofTitle}>
          {proof && proof.found ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 0 }}>{t.proofIntro}</Paragraph>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title={t.targetHash}>
                    <Text code copyable={{ text: proof.targetHash }}>
                      {formatHash(proof.targetHash, 16)}
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title={t.rootTitle}>
                    <Text code copyable={{ text: proof.root }}>
                      {formatHash(proof.root, 16)}
                    </Text>
                  </Card>
                </Col>
              </Row>

              <List
                header={<Text strong>{t.proofTitle}</Text>}
                size="small"
                dataSource={proof.siblings}
                renderItem={(sibling, index) => (
                  <List.Item>
                    <Space>
                      <Tag color={sibling.direction === 'left' ? 'orange' : 'cyan'}>
                        {sibling.direction === 'left'
                          ? t.siblingDirectionLeft
                          : t.siblingDirectionRight}
                      </Tag>
                      <Text code copyable={{ text: sibling.hash }}>
                        {formatHash(sibling.hash, 14)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        #{index + 1}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />

              <Space>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={verify}>
                  {t.verifyButton}
                </Button>
                {verification === true && (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    {t.verificationOk}
                  </Tag>
                )}
                {verification === false && (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    {t.verificationFail}
                  </Tag>
                )}
              </Space>
            </Space>
          ) : (
            <Empty description={t.noProof} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      )}

      <Alert type="info" showIcon message={t.howItWorks} description={t.howItWorksText} />

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <div style={{ position: 'relative' }}>
            <Button
              size="small"
              icon={<CopyOutlined />}
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => copy(sourceCode(), 'source')}
            >
              {copiedKey === 'source' ? t.copied : t.copy}
            </Button>
            <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
              <code>{sourceCode()}</code>
            </pre>
          </div>
        </Panel>
      </Collapse>
    </Space>
  )
}
