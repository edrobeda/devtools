import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Alert,
  Tabs,
  Row,
  Col,
  Statistic,
  Tag,
  List,
} from 'antd'
import {
  GlobalOutlined,
  CompressOutlined,
  CodeOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseCidr,
  cidrsOverlap,
  cidrContains,
  aggregateCidrs,
  summarizeCidrs,
} from '../utils/cidrOverlapAggregator'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs
const { TextArea } = Input

const sourceCode = `// src/utils/cidrOverlapAggregator.js (resumo)
export function parseCidr(cidr) {
  const match = cidr.trim().match(
    /^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\/(\\d{1,2})$/
  )
  if (!match) return { valid: false }
  const parts = match.slice(1, 5).map(Number)
  const prefix = Number(match[5])
  if (parts.some((p) => p > 255) || prefix > 32) return { valid: false }

  const ipInt = (BigInt(parts[0]) << 24n) |
                (BigInt(parts[1]) << 16n) |
                (BigInt(parts[2]) << 8n)  |
                 BigInt(parts[3])
  const size = 2n ** BigInt(32 - prefix)
  const mask = 2n ** 32n - size
  return {
    valid: true,
    network: ipInt & mask,
    broadcast: ipInt | (size - 1n),
    prefix,
    size,
  }
}

export function cidrsOverlap(a, b) {
  return a.network <= b.broadcast && a.broadcast >= b.network
}

export function cidrContains(container, contained) {
  return container.network <= contained.network &&
         container.broadcast >= contained.broadcast
}

export function aggregateCidrs(inputs) {
  const parsed = inputs.map(parseCidr).filter((c) => c.valid)
  const sorted = parsed.sort((a, b) =>
    a.network < b.network ? -1 : a.network > b.network ? 1 : b.prefix - a.prefix
  )
  // 1) remove contained blocks; 2) merge adjacent siblings repeatedly.
  // ...
}

export function summarizeCidrs(inputs) {
  const parsed = inputs.map(parseCidr).filter((c) => c.valid)
  const minNetwork = parsed.reduce((m, c) => c.network < m ? c.network : m)
  const maxBroadcast = parsed.reduce((m, c) => c.broadcast > m ? c.broadcast : m)
  const span = maxBroadcast - minNetwork + 1n
  let prefix = 32
  while (prefix > 0 && 2n ** BigInt(32 - prefix + 1) >= span) prefix--
  return { summary: intToIPv4(minNetwork & prefixToMask(prefix)) + '/' + prefix }
}`

const translations = {
  pt: {
    title: 'CIDR Overlap & Aggregator',
    intro: (
      <>
        Analise blocos IPv4 em notação CIDR 100% no navegador: verifique se
        dois CIDRs se sobrepõem (ou se um contém o outro), agregue uma lista
        de blocos no conjunto equivalente mínimo e resuma vários CIDRs no
        menor supernet que os cubra.
      </>
    ),
    overlapTab: 'Sobreposição',
    aggregateTab: 'Agregar',
    summarizeTab: 'Resumir',
    sourceTab: 'Código-fonte',
    firstCidr: 'Primeiro CIDR',
    secondCidr: 'Segundo CIDR',
    checkBtn: 'Verificar',
    overlapYes: 'Os CIDRs se sobrepõem',
    overlapNo: 'Os CIDRs NÃO se sobrepõem',
    containsYes: 'O primeiro CIDR contém o segundo',
    containsNo: 'O primeiro CIDR NÃO contém o segundo',
    invalidFormat: 'Formato inválido — use ip/prefixo, ex: 10.0.0.0/24',
    listLabel: 'Lista de CIDRs (um por linha)',
    runBtn: 'Executar',
    aggregatedResult: 'CIDRs agregados',
    summarizedResult: 'Supernet resumido',
    stats: 'Estatísticas',
    original: 'Originais',
    aggregated: 'Agregados',
    removed: 'Removidos / mesclados',
    reduction: 'Redução de endereços',
    invalidItems: 'Itens inválidos',
    summary: 'Resumo',
    exactRange: 'Intervalo exato',
    summaryRange: 'Intervalo do resumo',
    hasGaps: 'Há gaps entre os blocos originais',
    noGaps: 'Sem gaps — supernet cobre exatamente os blocos',
    addresses: 'endereços',
    copyBtn: 'Copiar resultado',
    copied: 'Copiado!',
    examples: 'Exemplos rápidos',
    exampleOverlap: 'Sobreposição',
    exampleNested: 'Aninhado',
    exampleAggregate: 'Agregar VPCs',
    exampleSummarize: 'Resumir subnets',
    note: (
      <>
        A agregação preserva a cobertura exata dos blocos originais, mas pode
        incluir endereços que não estavam na lista inicial quando há gaps. O
        resumo sempre retorna o menor supernet, mesmo que deixe buracos.
      </>
    ),
  },
  en: {
    title: 'CIDR Overlap & Aggregator',
    intro: (
      <>
        Analyze IPv4 CIDR blocks entirely in the browser: check whether two
        CIDRs overlap (or one contains the other), aggregate a list of blocks
        into the smallest equivalent set, and summarize multiple CIDRs into
        the smallest covering supernet.
      </>
    ),
    overlapTab: 'Overlap',
    aggregateTab: 'Aggregate',
    summarizeTab: 'Summarize',
    sourceTab: 'Source code',
    firstCidr: 'First CIDR',
    secondCidr: 'Second CIDR',
    checkBtn: 'Check',
    overlapYes: 'CIDRs overlap',
    overlapNo: 'CIDRs do NOT overlap',
    containsYes: 'First CIDR contains the second',
    containsNo: 'First CIDR does NOT contain the second',
    invalidFormat: 'Invalid format — use ip/prefix, e.g. 10.0.0.0/24',
    listLabel: 'CIDR list (one per line)',
    runBtn: 'Run',
    aggregatedResult: 'Aggregated CIDRs',
    summarizedResult: 'Summarized supernet',
    stats: 'Statistics',
    original: 'Original',
    aggregated: 'Aggregated',
    removed: 'Removed / merged',
    reduction: 'Address reduction',
    invalidItems: 'Invalid items',
    summary: 'Summary',
    exactRange: 'Exact range',
    summaryRange: 'Summary range',
    hasGaps: 'There are gaps between original blocks',
    noGaps: 'No gaps — supernet covers exactly the blocks',
    addresses: 'addresses',
    copyBtn: 'Copy result',
    copied: 'Copied!',
    examples: 'Quick examples',
    exampleOverlap: 'Overlap',
    exampleNested: 'Nested',
    exampleAggregate: 'Aggregate VPCs',
    exampleSummarize: 'Summarize subnets',
    note: (
      <>
        Aggregation preserves exact coverage of the original blocks, but may
        include addresses that were not in the input when gaps exist. Summarize
        always returns the smallest supernet, even if it leaves holes.
      </>
    ),
  },
}

const EXAMPLES = {
  overlap: ['10.0.0.0/24', '10.0.0.128/25'],
  nested: ['10.0.0.0/16', '10.0.1.0/24'],
  aggregate: ['10.0.0.0/25', '10.0.0.128/25', '10.0.1.0/24', '10.0.2.0/23'],
  summarize: ['192.168.0.0/25', '192.168.0.128/26', '192.168.0.192/26'],
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return { copied, copy }
}

function OverlapSection({ t }) {
  const [first, setFirst] = useState('10.0.0.0/24')
  const [second, setSecond] = useState('10.0.0.128/25')
  const [result, setResult] = useState(null)

  const handleCheck = () => {
    const a = parseCidr(first)
    const b = parseCidr(second)
    setResult({ a, b, overlap: cidrsOverlap(a, b), contains: cidrContains(a, b) })
  }

  const invalid = result && (!result.a.valid || !result.b.valid)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{t.firstCidr}</Text>
            <Input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="10.0.0.0/24"
              style={{ fontFamily: 'monospace' }}
            />
          </Space>
        </Col>
        <Col xs={24} md={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{t.secondCidr}</Text>
            <Input
              value={second}
              onChange={(e) => setSecond(e.target.value)}
              placeholder="10.0.0.128/25"
              style={{ fontFamily: 'monospace' }}
            />
          </Space>
        </Col>
      </Row>

      <Button type="primary" icon={<SwapOutlined />} onClick={handleCheck}>
        {t.checkBtn}
      </Button>

      {result && invalid && (
        <Alert type="error" showIcon message={t.invalidFormat} />
      )}

      {result && !invalid && (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Alert
            type={result.overlap ? 'warning' : 'success'}
            showIcon
            icon={result.overlap ? <WarningOutlined /> : <CheckCircleOutlined />}
            message={result.overlap ? t.overlapYes : t.overlapNo}
          />
          <Alert
            type={result.contains ? 'info' : 'default'}
            showIcon
            icon={result.contains ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            message={result.contains ? t.containsYes : t.containsNo}
          />
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Card size="small" title={t.firstCidr}>
                <Text code>{result.a.normalized}</Text>
                <br />
                <Text type="secondary">
                  {result.a.network === result.a.broadcast
                    ? result.a.network
                    : `${result.a.network} — ${result.a.broadcast}`}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" title={t.secondCidr}>
                <Text code>{result.b.normalized}</Text>
                <br />
                <Text type="secondary">
                  {result.b.network === result.b.broadcast
                    ? result.b.network
                    : `${result.b.network} — ${result.b.broadcast}`}
                </Text>
              </Card>
            </Col>
          </Row>
        </Space>
      )}
    </Space>
  )
}

function CidrListSection({ t, mode }) {
  const [text, setText] = useState(EXAMPLES[mode].join('\n'))
  const [result, setResult] = useState(null)
  const { copied, copy } = useCopy()

  const inputs = useMemo(
    () => text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [text]
  )

  const handleRun = () => {
    if (mode === 'aggregate') {
      setResult({ type: 'aggregate', data: aggregateCidrs(inputs) })
    } else {
      setResult({ type: 'summarize', data: summarizeCidrs(inputs) })
    }
  }

  const applyExample = (key) => {
    setText(EXAMPLES[key].join('\n'))
    setResult(null)
  }

  const outputText = useMemo(() => {
    if (!result) return ''
    if (result.type === 'aggregate') return result.data.aggregated.join('\n')
    return result.data.summary || ''
  }, [result])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>{t.listLabel}</Text>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={{ fontFamily: 'monospace' }}
        />
      </Space>

      <Space wrap>
        <Button type="primary" icon={<CompressOutlined />} onClick={handleRun}>
          {t.runBtn}
        </Button>
        <Button
          icon={<SwapOutlined />}
          disabled={!outputText}
          onClick={() => copy(outputText)}
        >
          {copied ? t.copied : t.copyBtn}
        </Button>
      </Space>

      <Space wrap>
        <Text type="secondary">{t.examples}:</Text>
        <Button size="small" onClick={() => applyExample('overlap')}>
          {t.exampleOverlap}
        </Button>
        <Button size="small" onClick={() => applyExample('nested')}>
          {t.exampleNested}
        </Button>
        <Button size="small" onClick={() => applyExample('aggregate')}>
          {t.exampleAggregate}
        </Button>
        <Button size="small" onClick={() => applyExample('summarize')}>
          {t.exampleSummarize}
        </Button>
      </Space>

      {result?.type === 'aggregate' && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card title={t.aggregatedResult} size="small">
            {result.data.aggregated.length === 0 ? (
              <Text type="secondary">—</Text>
            ) : (
              <List
                bordered
                size="small"
                dataSource={result.data.aggregated}
                renderItem={(item) => (
                  <List.Item>
                    <Text code copyable={{ text: item }}>{item}</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic title={t.original} value={result.data.originalCount} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={t.aggregated} value={result.data.aggregated.length} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={t.removed} value={result.data.removed} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={t.reduction} value={`${result.data.stats.reduction.toFixed(2)}%`} />
            </Col>
          </Row>

          {result.data.invalid.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={t.invalidItems}
              description={
                <Space wrap>
                  {result.data.invalid.map((item) => (
                    <Tag key={item} color="red">{item}</Tag>
                  ))}
                </Space>
              }
            />
          )}
        </Space>
      )}

      {result?.type === 'summarize' && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card title={t.summarizedResult} size="small">
            {result.data.summary ? (
              <Text code copyable={{ text: result.data.summary }} style={{ fontSize: 16 }}>
                {result.data.summary}
              </Text>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Card>

          <Alert
            type={result.data.hasGaps ? 'warning' : 'success'}
            showIcon
            message={result.data.hasGaps ? t.hasGaps : t.noGaps}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card size="small" title={t.exactRange}>
                <Text code>{result.data.exactRange?.first}</Text>
                <Text> — </Text>
                <Text code>{result.data.exactRange?.last}</Text>
                <br />
                <Text type="secondary">
                  {result.data.exactRange?.addresses.toLocaleString()} {t.addresses}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" title={t.summaryRange}>
                <Text code>{result.data.summaryRange?.first}</Text>
                <Text> — </Text>
                <Text code>{result.data.summaryRange?.last}</Text>
                <br />
                <Text type="secondary">
                  {result.data.summaryRange?.addresses.toLocaleString()} {t.addresses}
                </Text>
              </Card>
            </Col>
          </Row>
        </Space>
      )}

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function CidrOverlapAggregatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Tabs defaultActiveKey="overlap" type="card">
        <TabPane tab={<><SwapOutlined /> {t.overlapTab}</>} key="overlap">
          <OverlapSection t={t} />
        </TabPane>
        <TabPane tab={<><CompressOutlined /> {t.aggregateTab}</>} key="aggregate">
          <CidrListSection t={t} mode="aggregate" />
        </TabPane>
        <TabPane tab={<><CompressOutlined /> {t.summarizeTab}</>} key="summarize">
          <CidrListSection t={t} mode="summarize" />
        </TabPane>
        <TabPane tab={<><CodeOutlined /> {t.sourceTab}</>} key="source">
          <Card>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{sourceCode}</code>
            </pre>
          </Card>
        </TabPane>
      </Tabs>
    </Space>
  )
}
