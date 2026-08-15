import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Input,
  InputNumber,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Statistic,
  Collapse,
  Alert,
  List,
  Empty,
} from 'antd'
import {
  ExperimentOutlined,
  PlusOutlined,
  SearchOutlined,
  CopyOutlined,
  DeleteOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  createBloomFilter,
  theoreticalFalsePositiveRate,
  optimalHashCount,
  recommendedSize,
  PRESETS,
  sourceCode,
} from '../utils/bloomFilterSimulator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Simulador de Bloom Filter',
    intro:
      'Visualize como um Bloom Filter armazena itens de forma compacta e probabilistica. Um item inserido nunca gera falso negativo, mas itens nao inseridos podem gerar falsos positivos conforme o filtro enche. Tudo roda 100% no navegador.',
    configTitle: 'Configuracao do filtro',
    sizeLabel: 'Bits (m)',
    hashCountLabel: 'Funcoes hash (k)',
    sizeHelp: 'Tamanho do vetor de bits. Mais bits = menos falsos positivos.',
    hashCountHelp: 'Quantidade de posicoes ativadas por item.',
    optimalK: 'k otimo para m/itens',
    addTitle: 'Inserir item',
    addPlaceholder: 'Ex.: user:42',
    addButton: 'Adicionar',
    testTitle: 'Testar membership',
    testPlaceholder: 'Digite um item para ver se pode estar no filtro',
    testButton: 'Testar',
    itemsTitle: 'Itens inseridos',
    removeItem: 'Remover',
    clearItems: 'Limpar',
    noItems: 'Nenhum item inserido ainda.',
    visualizationTitle: 'Vetor de bits',
    bitOnTooltip: 'bit ligado',
    bitOffTooltip: 'bit desligado',
    statsTitle: 'Estatisticas',
    itemsCount: 'Itens (n)',
    bitsSet: 'Bits ligados',
    loadFactor: 'Fator de carga',
    theoreticalFp: 'Falso positivo teorico',
    recommendationTitle: 'Recomendacao rapida',
    expectedItemsLabel: 'Itens esperados',
    targetFpLabel: 'Falso positivo desejado',
    recommendedM: 'm recomendado',
    recommendedK: 'k recomendado',
    presetsTitle: 'Cenarios rapidos',
    sourceCode: 'Codigo-fonte do motor',
    copy: 'Copiar',
    copied: 'Copiado',
    falsePositive: 'Pode estar presente (falso positivo e possivel)',
    definitelyNot: 'Definitivamente nao esta presente',
    definitelyYes: 'Item confirmado no filtro',
    howItWorks: 'Como funciona',
    howItWorksText:
      'Cada item e hasheado k vezes para gerar k indices no vetor de bits. Para testar, verifica-se se todos os k bits estao ligados. Se algum estiver desligado, o item certamente nao foi inserido. Se todos estiverem ligados, o item provavelmente foi inserido — mas pode ser um falso positivo, porque outros itens podem ter ligado os mesmos bits.',
    quickAdvice: 'Dica rapida',
    quickAdviceText:
      'Para n itens e taxa de falso positivo p, use m aproximadamente -n*ln(p)/(ln2)^2 bits e k = (m/n)*ln2 funcoes hash.',
    testHistoryTitle: 'Historico de testes',
    noTests: 'Nenhum teste realizado ainda.',
  },
  en: {
    title: 'Bloom Filter Simulator',
    intro:
      'Visualize how a Bloom Filter stores items in a compact, probabilistic way. An inserted item never yields a false negative, but non-inserted items may produce false positives as the filter fills up. Everything runs 100% in the browser.',
    configTitle: 'Filter configuration',
    sizeLabel: 'Bits (m)',
    hashCountLabel: 'Hash functions (k)',
    sizeHelp: 'Bit array size. More bits = fewer false positives.',
    hashCountHelp: 'Number of positions set per item.',
    optimalK: 'Optimal k for m/items',
    addTitle: 'Insert item',
    addPlaceholder: 'E.g. user:42',
    addButton: 'Add',
    testTitle: 'Test membership',
    testPlaceholder: 'Type an item to check if it may be in the filter',
    testButton: 'Test',
    itemsTitle: 'Inserted items',
    removeItem: 'Remove',
    clearItems: 'Clear',
    noItems: 'No items inserted yet.',
    visualizationTitle: 'Bit array',
    bitOnTooltip: 'bit on',
    bitOffTooltip: 'bit off',
    statsTitle: 'Statistics',
    itemsCount: 'Items (n)',
    bitsSet: 'Bits set',
    loadFactor: 'Load factor',
    theoreticalFp: 'Theoretical false positive',
    recommendationTitle: 'Quick recommendation',
    expectedItemsLabel: 'Expected items',
    targetFpLabel: 'Target false positive rate',
    recommendedM: 'Recommended m',
    recommendedK: 'Recommended k',
    presetsTitle: 'Quick scenarios',
    sourceCode: 'Engine source code',
    copy: 'Copy',
    copied: 'Copied',
    falsePositive: 'May be present (false positive possible)',
    definitelyNot: 'Definitely not present',
    definitelyYes: 'Item confirmed in filter',
    howItWorks: 'How it works',
    howItWorksText:
      'Each item is hashed k times to produce k indices in the bit array. To test membership, all k bits are checked. If any bit is off, the item was certainly not inserted. If all bits are on, the item was probably inserted — but it could be a false positive, because other items may have set the same bits.',
    quickAdvice: 'Quick advice',
    quickAdviceText:
      'For n items and false positive rate p, use approximately m = -n*ln(p)/(ln2)^2 bits and k = (m/n)*ln2 hash functions.',
    testHistoryTitle: 'Test history',
    noTests: 'No tests performed yet.',
  },
}

export default function BloomFilterSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const presets = PRESETS[lang]

  const [size, setSize] = useState(256)
  const [hashCount, setHashCount] = useState(3)
  const [items, setItems] = useState([])
  const [input, setInput] = useState('')
  const [testInput, setTestInput] = useState('')
  const [testHistory, setTestHistory] = useState([])
  const [copiedKey, setCopiedKey] = useState(null)
  const [expectedItems, setExpectedItems] = useState(100)
  const [targetFp, setTargetFp] = useState(0.01)

  const filter = useMemo(
    () => createBloomFilter(size, hashCount),
    [size, hashCount]
  )

  // Repopula o filtro sempre que os itens mudam; nao dependemos do estado
  // do filter em useEffect, apenas reconstruimos o objeto memoizado.
  const populatedFilter = useMemo(() => {
    const f = createBloomFilter(size, hashCount)
    items.forEach((item) => f.add(item))
    return f
  }, [items, size, hashCount])

  const bits = populatedFilter.bits
  const bitsSet = bits.filter((b) => b === 1).length
  const loadFactor = bits.length ? (bitsSet / bits.length) * 100 : 0
  const fpRate = theoreticalFalsePositiveRate(items.length, bits.length, hashCount)
  const optimalKValue = optimalHashCount(bits.length, items.length || 1)

  const recommendedM = useMemo(
    () => recommendedSize(expectedItems, targetFp),
    [expectedItems, targetFp]
  )
  const recommendedK = useMemo(
    () => optimalHashCount(recommendedM, expectedItems || 1),
    [recommendedM, expectedItems]
  )

  const addItem = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    setItems((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
    setInput('')
  }, [input])

  const removeItem = useCallback((value) => {
    setItems((prev) => prev.filter((i) => i !== value))
  }, [])

  const clearItems = useCallback(() => {
    setItems([])
    setTestHistory([])
  }, [])

  const testItem = useCallback(() => {
    const trimmed = testInput.trim()
    if (!trimmed) return
    const probablyPresent = populatedFilter.test(trimmed)
    const definitelyPresent = items.includes(trimmed)
    setTestHistory((prev) => [
      { input: trimmed, probablyPresent, definitelyPresent, key: Date.now() + Math.random() },
      ...prev,
    ])
    setTestInput('')
  }, [testInput, populatedFilter, items])

  const applyPreset = useCallback((preset) => {
    setSize(preset.size)
    setHashCount(preset.hashCount)
    setItems(preset.samples.slice())
    setTestHistory([])
  }, [])

  const applyRecommendation = useCallback(() => {
    setSize(recommendedM)
    setHashCount(recommendedK)
  }, [recommendedM, recommendedK])

  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  const cols = useMemo(() => {
    const c = Math.ceil(Math.sqrt(bits.length))
    return Math.max(1, c)
  }, [bits.length])

  const testHistoryList = useMemo(
    () =>
      testHistory.map((entry) => {
        let color = 'default'
        let text = entry.probablyPresent ? t.falsePositive : t.definitelyNot
        if (entry.definitelyPresent) {
          color = 'success'
          text = t.definitelyYes
        } else if (entry.probablyPresent) {
          color = 'warning'
        }
        return { ...entry, color, text }
      }),
    [testHistory, t]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ExperimentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.configTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.sizeLabel}</Text>
                    <InputNumber
                      min={8}
                      max={1024}
                      step={8}
                      value={size}
                      onChange={(v) => setSize(v ?? 8)}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.sizeHelp}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.hashCountLabel}</Text>
                    <InputNumber
                      min={1}
                      max={10}
                      value={hashCount}
                      onChange={(v) => setHashCount(v ?? 1)}
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.hashCountHelp}
                    </Text>
                  </Space>
                </Col>
              </Row>

              {items.length > 0 && (
                <Alert
                  type="info"
                  showIcon
                  message={`${t.optimalK}: ${optimalKValue}`}
                  description={t.quickAdviceText}
                />
              )}

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

          <Card title={t.addTitle} style={{ marginTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.addPlaceholder}
                onPressEnter={addItem}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={addItem}>
                {t.addButton}
              </Button>
            </Space.Compact>
          </Card>

          <Card title={t.testTitle} style={{ marginTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder={t.testPlaceholder}
                onPressEnter={testItem}
                prefix={<SearchOutlined />}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={testItem}>
                {t.testButton}
              </Button>
            </Space.Compact>
          </Card>

          <Card title={t.itemsTitle} style={{ marginTop: 16 }}>
            {items.length === 0 ? (
              <Empty description={t.noItems} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={items}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="remove"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(item)}
                      >
                        {t.removeItem}
                      </Button>,
                    ]}
                  >
                    <Tag color="blue">{item}</Tag>
                  </List.Item>
                )}
              />
            )}
            {items.length > 0 && (
              <Button icon={<ClearOutlined />} size="small" onClick={clearItems} style={{ marginTop: 8 }}>
                {t.clearItems}
              </Button>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.visualizationTitle}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: 2,
              }}
            >
              {bits.map((bit, idx) => (
                <div
                  key={idx}
                  title={`bit ${idx}: ${bit ? t.bitOnTooltip : t.bitOffTooltip}`}
                  style={{
                    aspectRatio: '1 / 1',
                    background: bit ? '#1677ff' : '#f0f0f0',
                    borderRadius: 2,
                    minWidth: 8,
                    minHeight: 8,
                  }}
                />
              ))}
            </div>
          </Card>

          <Card title={t.statsTitle} style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.itemsCount} value={items.length} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.bitsSet} value={bitsSet} suffix={`/ ${bits.length}`} />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small">
                  <Statistic title={t.loadFactor} value={loadFactor.toFixed(1)} suffix="%" />
                </Card>
              </Col>
              <Col xs={24}>
                <Card size="small">
                  <Statistic
                    title={t.theoreticalFp}
                    value={(fpRate * 100).toFixed(4)}
                    suffix="%"
                  />
                </Card>
              </Col>
            </Row>
          </Card>

          <Card title={t.recommendationTitle} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.expectedItemsLabel}</Text>
                    <InputNumber
                      min={1}
                      value={expectedItems}
                      onChange={(v) => setExpectedItems(v ?? 1)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{t.targetFpLabel}</Text>
                    <InputNumber
                      min={0.0001}
                      max={0.9999}
                      step={0.01}
                      value={targetFp}
                      onChange={(v) => setTargetFp(v ?? 0.01)}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Statistic title={t.recommendedM} value={recommendedM} />
                </Col>
                <Col xs={12}>
                  <Statistic title={t.recommendedK} value={recommendedK} />
                </Col>
              </Row>
              <Button onClick={applyRecommendation}>{t.presetsTitle}</Button>
            </Space>
          </Card>

          <Card title={t.testHistoryTitle} style={{ marginTop: 16 }}>
            {testHistoryList.length === 0 ? (
              <Empty description={t.noTests} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={testHistoryList}
                renderItem={(entry) => (
                  <List.Item>
                    <Space>
                      <Tag>{entry.input}</Tag>
                      <Tag color={entry.color}>{entry.text}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

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
