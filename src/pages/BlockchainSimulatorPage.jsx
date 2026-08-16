import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Slider,
  Tag,
  Statistic,
  Row,
  Col,
  Collapse,
  Alert,
  Tooltip,
} from 'antd'
import {
  BlockOutlined,
  PlusOutlined,
  RedoOutlined,
  ReloadOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  createGenesisBlock,
  addBlock,
  updateBlockData,
  mineSingleBlock,
  remineChain,
  validateChain,
  formatHash,
  PRESETS,
  applyPreset,
  sourceCode,
} from '../utils/blockchainSimulator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Blockchain',
    intro:
      'Monte uma cadeia de blocos 100% no navegador, mineie com proof-of-work ajustável e veja ao vivo como qualquer alteração em um bloco quebra a validade dele e dos blocos seguintes. Re-minere a cadeia para restaurar os hashes corretos.',
    difficultyLabel: 'Dificuldade de mineração (zeros à esquerda)',
    difficultyHelp: 'Quanto maior a dificuldade, mais hashes o minerador precisa testar.',
    dataLabel: 'Dados do próximo bloco',
    dataPlaceholder: 'Ex: Alice envia 5 BTC para Bob',
    addButton: 'Adicionar bloco minerado',
    resetButton: 'Reiniciar cadeia',
    remineAllButton: 'Re-minar cadeia inteira',
    presetsTitle: 'Cenários rápidos',
    statusTitle: 'Status da cadeia',
    statusValid: 'Cadeia válida',
    statusInvalid: 'Cadeia inválida',
    invalidBlocks: 'Blocos inválidos',
    blockCount: 'Blocos',
    mineButton: 'Minerar este bloco',
    remineFromButton: 'Re-minar daqui em diante',
    prevHashLabel: 'Hash anterior',
    nonceLabel: 'Nonce',
    hashLabel: 'Hash',
    timestampLabel: 'Timestamp',
    dataLabelShort: 'Dados',
    reasonHash: 'Hash não atende à dificuldade ou dados foram alterados',
    reasonPrev: 'Hash anterior divergente',
    copy: 'Copiar',
    copied: 'Copiado',
    sourceCode: 'Código-fonte do motor',
    explanationTitle: 'Como funciona',
    explanation: (
      <>
        Cada bloco contém um <Text code>index</Text>, <Text code>timestamp</Text>,{' '}
        <Text code>data</Text>, <Text code>previousHash</Text>, <Text code>nonce</Text> e{' '}
        <Text code>hash</Text> próprio. O hash é calculado sobre todos esses campos; para ser
        aceito, ele precisa começar com uma quantidade configurável de zeros — esse é o{' '}
        <Text code>proof-of-work</Text>. Se você alterar os dados de um bloco, o hash dele
        deixa de bater e o bloco seguinte passa a apontar para um <Text code>previousHash</Text>{' '}
        obsoleto. Re-minar a cadeia a partir do bloco alterado força o recálculo dos nonces
        necessários para restaurar a validade.
      </>
    ),
    mining: 'Minerando...',
  },
  en: {
    title: 'Blockchain Simulator',
    intro:
      'Build a block chain 100% in the browser, mine it with adjustable proof-of-work, and see in real time how changing any block breaks its validity and the validity of the following blocks. Re-mine the chain to restore the correct hashes.',
    difficultyLabel: 'Mining difficulty (leading zeros)',
    difficultyHelp: 'The higher the difficulty, the more hashes the miner has to try.',
    dataLabel: 'Next block data',
    dataPlaceholder: 'E.g. Alice sends 5 BTC to Bob',
    addButton: 'Add mined block',
    resetButton: 'Reset chain',
    remineAllButton: 'Re-mine whole chain',
    presetsTitle: 'Quick scenarios',
    statusTitle: 'Chain status',
    statusValid: 'Valid chain',
    statusInvalid: 'Invalid chain',
    invalidBlocks: 'Invalid blocks',
    blockCount: 'Blocks',
    mineButton: 'Mine this block',
    remineFromButton: 'Re-mine from here',
    prevHashLabel: 'Previous hash',
    nonceLabel: 'Nonce',
    hashLabel: 'Hash',
    timestampLabel: 'Timestamp',
    dataLabelShort: 'Data',
    reasonHash: 'Hash does not meet difficulty or data was changed',
    reasonPrev: 'Previous hash mismatch',
    copy: 'Copy',
    copied: 'Copied',
    sourceCode: 'Engine source code',
    explanationTitle: 'How it works',
    explanation: (
      <>
        Each block contains an <Text code>index</Text>, <Text code>timestamp</Text>,{' '}
        <Text code>data</Text>, <Text code>previousHash</Text>, <Text code>nonce</Text> and its
        own <Text code>hash</Text>. The hash is computed over all of those fields; to be
        accepted it must start with a configurable number of zeros — this is the{' '}
        <Text code>proof-of-work</Text>. If you change a block's data, its hash no longer
        matches and the next block points to an outdated <Text code>previousHash</Text>.{' '}
        Re-mining the chain from the altered block recalculates the nonces needed to restore
        validity.
      </>
    ),
    mining: 'Mining...',
  },
}

export default function BlockchainSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [chain, setChain] = useState(() => [createGenesisBlock(2)])
  const [difficulty, setDifficulty] = useState(2)
  const [newData, setNewData] = useState('')
  const [miningIndex, setMiningIndex] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  const validation = useMemo(
    () => validateChain(chain, difficulty),
    [chain, difficulty]
  )

  const isMining = miningIndex !== null

  const handleAddBlock = useCallback(() => {
    setMiningIndex('add')
    const next = addBlock(chain, newData || 'Empty block', difficulty)
    setChain(next)
    setNewData('')
    setMiningIndex(null)
  }, [chain, difficulty, newData])

  const handleReset = useCallback(() => {
    setChain([createGenesisBlock(difficulty)])
    setNewData('')
  }, [difficulty])

  const handleRemineAll = useCallback(() => {
    setMiningIndex('all')
    const next = remineChain(chain, difficulty, 0)
    setChain(next)
    setMiningIndex(null)
  }, [chain, difficulty])

  const handleUpdateData = useCallback((index, value) => {
    setChain((prev) => updateBlockData(prev, index, value))
  }, [])

  const handleMineBlock = useCallback(
    (index) => {
      setMiningIndex(index)
      const next = mineSingleBlock(chain, index, difficulty)
      setChain(next)
      setMiningIndex(null)
    },
    [chain, difficulty]
  )

  const handleRemineFrom = useCallback(
    (index) => {
      setMiningIndex(`from-${index}`)
      const next = remineChain(chain, difficulty, index)
      setChain(next)
      setMiningIndex(null)
    },
    [chain, difficulty]
  )

  const handleApplyPreset = useCallback(
    (key) => {
      setChain(applyPreset(key, difficulty))
      setNewData('')
    },
    [difficulty]
  )

  const copyToClipboard = useCallback(
    (value, field) => {
      navigator.clipboard.writeText(value).then(() => {
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 1200)
      })
    },
    []
  )

  const copySource = useCallback(() => {
    navigator.clipboard.writeText(sourceCode()).then(() => {
      setCopiedField('source')
      setTimeout(() => setCopiedField(null), 1200)
    })
  }, [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <BlockOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.presetsTitle}>
            <Space wrap>
              {presets.map((preset) => (
                <Button key={preset.key} onClick={() => handleApplyPreset(preset.key)}>
                  {preset.label}
                </Button>
              ))}
            </Space>
          </Card>

          <Card title={t.difficultyLabel} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Slider
                min={1}
                max={5}
                step={1}
                value={difficulty}
                onChange={setDifficulty}
                marks={{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.difficultyHelp}
              </Text>
            </Space>
          </Card>

          <Card title={t.dataLabel} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <TextArea
                rows={2}
                value={newData}
                onChange={(e) => setNewData(e.target.value)}
                placeholder={t.dataPlaceholder}
                maxLength={500}
                showCount
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddBlock}
                loading={miningIndex === 'add'}
                disabled={isMining}
                block
              >
                {t.addButton}
              </Button>
            </Space>
          </Card>

          <Card title={t.statusTitle} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type={validation.valid ? 'success' : 'error'}
                showIcon
                icon={validation.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                message={validation.valid ? t.statusValid : t.statusInvalid}
                description={
                  validation.valid
                    ? `${t.blockCount}: ${chain.length}`
                    : `${t.invalidBlocks}: #${validation.invalidIndices.join(', #')}`
                }
              />
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Statistic title={t.blockCount} value={chain.length} />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title={t.invalidBlocks}
                    value={validation.invalidIndices.length}
                    valueStyle={{ color: validation.invalidIndices.length ? '#cf1322' : undefined }}
                  />
                </Col>
              </Row>
              <Button icon={<ReloadOutlined />} onClick={handleRemineAll} disabled={isMining} block>
                {t.remineAllButton}
              </Button>
              <Button icon={<RedoOutlined />} onClick={handleReset} disabled={isMining} block>
                {t.resetButton}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {chain.map((block, index) => {
              const detail = validation.details[index]
              const blockValid = detail.hashValid && detail.previousValid
              const isTampered = !detail.hashValid
              const isBrokenLink = !detail.previousValid

              return (
                <Card
                  key={`${index}-${block.hash}`}
                  size="small"
                  title={
                    <Space>
                      <Text strong>#{block.index}</Text>
                      {blockValid ? (
                        <Tag color="success">OK</Tag>
                      ) : (
                        <Tag color="error">Invalid</Tag>
                      )}
                    </Space>
                  }
                  style={{
                    borderLeft: `4px solid ${blockValid ? '#52c41a' : '#ff4d4f'}`,
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t.dataLabelShort}
                      </Text>
                      <TextArea
                        rows={2}
                        value={block.data}
                        onChange={(e) => handleUpdateData(index, e.target.value)}
                        maxLength={500}
                      />
                    </div>

                    <Row gutter={[8, 8]}>
                      <Col xs={24}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.hashLabel}
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text code copyable={{ text: block.hash }}>
                            {formatHash(block.hash, 24)}
                          </Text>
                          <Tooltip title={copiedField === `hash-${index}` ? t.copied : t.copy}>
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => copyToClipboard(block.hash, `hash-${index}`)}
                            />
                          </Tooltip>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.nonceLabel}
                        </Text>
                        <div>
                          <Text>{block.nonce.toLocaleString()}</Text>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.timestampLabel}
                        </Text>
                        <div>
                          <Text>{new Date(block.timestamp).toLocaleString()}</Text>
                        </div>
                      </Col>
                      <Col xs={24}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.prevHashLabel}
                        </Text>
                        <div>
                          <Text code>{formatHash(block.previousHash, 24)}</Text>
                        </div>
                      </Col>
                    </Row>

                    {!blockValid && (
                      <Alert
                        type="error"
                        showIcon
                        message={t.statusInvalid}
                        description={
                          <Space direction="vertical" size="small">
                            {isTampered && <Text style={{ fontSize: 12 }}>• {t.reasonHash}</Text>}
                            {isBrokenLink && <Text style={{ fontSize: 12 }}>• {t.reasonPrev}</Text>}
                          </Space>
                        }
                        style={{ marginTop: 8 }}
                      />
                    )}

                    <Space wrap style={{ marginTop: 8 }}>
                      <Button
                        size="small"
                        icon={<RedoOutlined />}
                        onClick={() => handleMineBlock(index)}
                        loading={miningIndex === index}
                        disabled={isMining}
                      >
                        {t.mineButton}
                      </Button>
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={() => handleRemineFrom(index)}
                        loading={miningIndex === `from-${index}`}
                        disabled={isMining}
                      >
                        {t.remineFromButton}
                      </Button>
                    </Space>
                  </Space>
                </Card>
              )
            })}
          </Space>
        </Col>
      </Row>

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
