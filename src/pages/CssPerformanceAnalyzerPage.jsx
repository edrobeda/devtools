import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Table, Tag, Alert, Row, Col, Statistic, Empty, Button } from 'antd'
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { analyzeCss, specificityLabel } from '../utils/cssPerformanceAnalyzer'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE_CSS = `/* Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  color: #222;
}

@import url("https://fonts.example.com/inter.css");

a {
  color: #1677ff !important;
  text-decoration: none;
}

.header > nav > ul > li > a:hover {
  color: #faad14;
}

.card.featured h2.title span.icon::before {
  content: "★";
  color: gold;
}

[data-theme="dark"] .sidebar ul li a.active.is-selected {
  color: #fff;
}

.button:has(.icon) {
  display: inline-flex;
  gap: 8px;
}

@supports (display: grid) {
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .header > nav > ul > li > a {
    padding: 4px;
  }
}

@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-display: swap;
}
`

const SEVERITY_TAG = {
  info: { color: 'blue', pt: 'Info', en: 'Info' },
  warning: { color: 'orange', pt: 'Aviso', en: 'Warning' },
  error: { color: 'red', pt: 'Erro', en: 'Error' },
}

function severityTag(severity, lang) {
  const conf = SEVERITY_TAG[severity] || SEVERITY_TAG.info
  return <Tag color={conf.color}>{lang === 'pt' ? conf.pt : conf.en}</Tag>
}

const translations = {
  pt: {
    title: 'Analisador de Performance CSS',
    intro: (
      <>
        Cole um CSS e veja o que pesa no parse, no matching e no cascade. O analisador percorre as
        regras do arquivo, calcula especificidade, conta<Text code>!important</Text>, detecta
        seletores profundos, pseudoclasses custosas, <Text code>@import</Text> síncrono,
        <Text code>@font-face</Text> acumulados e propriedades redundantes — e aponta problemas
        com severidade (info / aviso / erro).
      </>
    ),
    placeholder: 'Cole aqui o seu CSS…',
    analyzeButton: 'Analisar de novo',
    loadSample: 'Carregar exemplo',
    clearButton: 'Limpar',
    summaryTitle: 'Resumo',
    bytes: 'Tamanho',
    gzippedHint: '~gz (estimativa)',
    rules: 'Regras',
    declarations: 'Declarações',
    avgSpec: 'Especificidade média',
    maxSpec: 'Maior especificidade',
    issuesTitle: 'Problemas encontrados',
    noIssues: 'Nenhum problema detectado nesse CSS.',
    specTitle: 'Distribuição de especificidade',
    specColBucket: 'Bucket (a,b,c)',
    specColCount: 'Quantidade',
    topPropsTitle: 'Propriedades mais usadas',
    topPropsColProp: 'Propriedade',
    topPropsColCount: 'Vezes',
    topSpecificTitle: 'Regras mais específicas',
    topSpecificColSelector: 'Seletor',
    topSpecificColSpec: 'Especificidade',
    topSpecificColRules: 'Regras',
    importsTitle: '@import encontrados',
    importsColUrl: 'URL',
    importsColFull: 'Preâmbulo',
    importsColBlocking: 'Bloqueante?',
    yes: 'sim',
    no: 'não',
    fontFacesTitle: '@font-face encontrados',
    fontFacesColFamily: 'Família',
    fontFacesColDecls: 'Declarações',
    expensiveTitle: 'Pseudoclasses funcionais usadas',
    expensiveColName: 'Pseudoclasse',
    expensiveColCount: 'Quantidade',
    expensiveColNote: 'Observação',
    redundantTitle: 'Propriedades repetidas (≥ 8 vezes)',
    importantTitle: 'Onde !important foi usado',
    importantColSelector: 'Seletor',
    importantColProp: 'Propriedade',
    empty: 'Cole um CSS acima e a análise aparece aqui.',
    sampleNote: 'O exemplo mostra um arquivo pequeno com vários problemas de propósito — !important, seletor universal, @import síncrono, profundidade alta, :has() e @font-face.',
    perRuleTitle: 'Tabela detalhada de regras',
    perRuleColSelector: 'Seletor',
    perRuleColSpec: 'spec.',
    perRuleColDepth: 'Profundidade',
    perRuleColDecls: 'Decls',
    perRuleColInside: 'Dentro de',
    topLevel: '(top-level)',
  },
  en: {
    title: 'CSS Performance Analyzer',
    intro: (
      <>
        Paste CSS and see what hurts parse, matching and the cascade. The analyzer walks every rule,
        computes specificity, counts <Text code>!important</Text>, flags deep selectors, costly
        functional pseudoclasses, sync <Text code>@import</Text>, accumulated <Text code>@font-face</Text>
        and repeated declarations — and grades each finding by severity (info / warning / error).
      </>
    ),
    placeholder: 'Paste your CSS here…',
    analyzeButton: 'Re-analyze',
    loadSample: 'Load sample',
    clearButton: 'Clear',
    summaryTitle: 'Summary',
    bytes: 'Size',
    gzippedHint: '~gz (estimate)',
    rules: 'Rules',
    declarations: 'Declarations',
    avgSpec: 'Avg specificity',
    maxSpec: 'Top specificity',
    issuesTitle: 'Issues found',
    noIssues: 'No issues detected in this CSS.',
    specTitle: 'Specificity distribution',
    specColBucket: 'Bucket (a,b,c)',
    specColCount: 'Count',
    topPropsTitle: 'Most-used properties',
    topPropsColProp: 'Property',
    topPropsColCount: 'Times',
    topSpecificTitle: 'Most specific rules',
    topSpecificColSelector: 'Selector',
    topSpecificColSpec: 'Specificity',
    topSpecificColRules: 'Decls',
    importsTitle: '@import rules',
    importsColUrl: 'URL',
    importsColFull: 'Prelude',
    importsColBlocking: 'Blocking?',
    yes: 'yes',
    no: 'no',
    fontFacesTitle: '@font-face rules',
    fontFacesColFamily: 'Family',
    fontFacesColDecls: 'Declarations',
    expensiveTitle: 'Functional pseudoclasses used',
    expensiveColName: 'Pseudoclass',
    expensiveColCount: 'Count',
    expensiveColNote: 'Note',
    redundantTitle: 'Repeated properties (≥ 8 times)',
    importantTitle: 'Where !important was used',
    importantColSelector: 'Selector',
    importantColProp: 'Property',
    empty: 'Paste some CSS above and the analysis shows up here.',
    sampleNote: 'The sample is a small file that intentionally triggers many findings — !important, universal selector, sync @import, deep selector chains, :has(), and @font-face.',
    perRuleTitle: 'Detailed rule table',
    perRuleColSelector: 'Selector',
    perRuleColSpec: 'spec.',
    perRuleColDepth: 'Depth',
    perRuleColDecls: 'Decls',
    perRuleColInside: 'Inside',
    topLevel: '(top-level)',
  },
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function CssPerformanceAnalyzerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLE_CSS)

  const analysis = useMemo(() => {
    if (!input.trim()) return null
    try {
      return analyzeCss(input)
    } catch (err) {
      return { error: err.message || String(err) }
    }
  }, [input])

  const hasError = analysis?.error

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ThunderboltOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            autoSize={{ minRows: 8, maxRows: 24 }}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Button onClick={() => setInput(SAMPLE_CSS)} icon={<ReloadOutlined />}>
              {t.loadSample}
            </Button>
            <Button onClick={() => setInput('')}>{t.clearButton}</Button>
          </Space>
          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            {t.sampleNote}
          </Paragraph>
        </Space>
      </Card>

      {hasError && (
        <Alert type="error" showIcon message={hasError} />
      )}

      {!input.trim() && (
        <Empty description={t.empty} />
      )}

      {analysis && !hasError && (
        <>
          <Card title={t.summaryTitle}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title={t.bytes}
                  value={formatBytes(analysis.size)}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ~{formatBytes(analysis.gzippedEstimate)} {t.gzippedHint}
                </Text>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic title={t.rules} value={analysis.totalRules} />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic title={t.declarations} value={analysis.totalDeclarations} />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title={t.avgSpec}
                  value={analysis.avgSpecNum.toFixed(1)}
                />
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Statistic
                  title={t.maxSpec}
                  value={analysis.maxSpecificity.selector ? specificityLabel(analysis.topSpecific[0]?.specificity || { a: 0, b: 0, c: 0 }) : '(0,0,0)'}
                />
                {analysis.maxSpecificity.selector && (
                  <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {analysis.maxSpecificity.selector.length > 32
                      ? analysis.maxSpecificity.selector.slice(0, 32) + '…'
                      : analysis.maxSpecificity.selector}
                  </Text>
                )}
              </Col>
            </Row>
          </Card>

          <Card title={t.issuesTitle}>
            {analysis.issues.length === 0 ? (
              <Alert type="success" showIcon message={t.noIssues} />
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {analysis.issues.map((iss, idx) => (
                  <Alert
                    key={idx}
                    type={iss.severity === 'error' ? 'error' : iss.severity === 'warning' ? 'warning' : 'info'}
                    showIcon
                    message={
                      <Space>
                        {severityTag(iss.severity, lang)}
                        <Text strong>{iss.title}</Text>
                      </Space>
                    }
                    description={iss.detail}
                  />
                ))}
              </Space>
            )}
          </Card>

          <Card title={t.specTitle}>
            <Table
              size="small"
              pagination={false}
              dataSource={Object.entries(analysis.specBuckets)
                .filter(([, c]) => c > 0)
                .map(([bucket, count]) => ({ key: bucket, bucket, count }))}
              columns={[
                { title: t.specColBucket, dataIndex: 'bucket', render: (v) => <Text code>{v}</Text> },
                { title: t.specColCount, dataIndex: 'count', align: 'right' },
              ]}
            />
          </Card>

          <Card title={t.topPropsTitle}>
            <Table
              size="small"
              pagination={false}
              dataSource={analysis.topProps.map(([prop, count]) => ({ key: prop, prop, count }))}
              columns={[
                { title: t.topPropsColProp, dataIndex: 'prop', render: (v) => <Text code>{v}</Text> },
                { title: t.topPropsColCount, dataIndex: 'count', align: 'right' },
              ]}
            />
          </Card>

          <Card title={t.topSpecificTitle}>
            <Table
              size="small"
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              dataSource={analysis.topSpecific.map((r, idx) => ({
                key: `${idx}-${r.selector}`,
                selector: r.selector,
                specificity: r.specificity,
                decls: r.declarations.length,
                inside: r.wrappedIn ? r.wrappedIn.join(' ⊳ ') : t.topLevel,
              }))}
              columns={[
                {
                  title: t.topSpecificColSelector,
                  dataIndex: 'selector',
                  render: (v) => <Text code style={{ wordBreak: 'break-all' }}>{v}</Text>,
                },
                {
                  title: t.topSpecificColSpec,
                  dataIndex: 'specificity',
                  render: (s) => (
                    <Space size={4}>
                      <Tag color="magenta">a={s.a}</Tag>
                      <Tag color="blue">b={s.b}</Tag>
                      <Tag color="green">c={s.c}</Tag>
                    </Space>
                  ),
                },
                { title: t.topSpecificColRules, dataIndex: 'decls', align: 'right' },
                {
                  title: t.perRuleColInside,
                  dataIndex: 'inside',
                  render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
                },
              ]}
            />
          </Card>

          {Object.keys(analysis.expensiveUses).length > 0 && (
            <Card title={t.expensiveTitle}>
              <Table
                size="small"
                pagination={false}
                dataSource={Object.entries(analysis.expensiveUses).map(([name, count]) => {
                  const meta = {
                    ':has()': 'Modern — matching top-down on every ancestor. Native in evergreen engines; can be expensive in large DOMs.',
                    ':is()': 'Spec rule: specificity = most specific arg. Generally fine.',
                    ':where()': 'Specificity is always zero; very friendly to the cascade.',
                    ':not()': 'Spec rule: specificity = most specific arg. Generally fine.',
                    ':nth-*()': 'Positional; cheap for short lists, gets costlier with many siblings.',
                  }[name] || ''
                  return { key: name, name, note: meta, count }
                })}
                columns={[
                  { title: t.expensiveColName, dataIndex: 'name', render: (v) => <Text code>{v}</Text> },
                  { title: t.expensiveColCount, dataIndex: 'count', align: 'right' },
                  { title: t.expensiveColNote, dataIndex: 'note' },
                ]}
              />
            </Card>
          )}

          {analysis.importantRules.length > 0 && (
            <Card title={t.importantTitle}>
              <Table
                size="small"
                pagination={false}
                dataSource={analysis.importantRules.map((r, idx) => ({
                  key: idx,
                  selector: r.selector,
                  property: r.property,
                }))}
                columns={[
                  {
                    title: t.importantColSelector,
                    dataIndex: 'selector',
                    render: (v) => <Text code style={{ wordBreak: 'break-all' }}>{v}</Text>,
                  },
                  {
                    title: t.importantColProp,
                    dataIndex: 'property',
                    render: (v) => <Text code>{v}</Text>,
                  },
                ]}
              />
            </Card>
          )}

          {analysis.imports.length > 0 && (
            <Card title={t.importsTitle}>
              <Table
                size="small"
                pagination={false}
                dataSource={analysis.imports.map((imp, idx) => ({
                  key: idx,
                  url: imp.url,
                  full: imp.full,
                  blocking: !imp.hasNonBlockingHint,
                }))}
                columns={[
                  { title: t.importsColUrl, dataIndex: 'url', render: (v) => <Text code>{v}</Text> },
                  { title: t.importsColFull, dataIndex: 'full', render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
                  {
                    title: t.importsColBlocking,
                    dataIndex: 'blocking',
                    render: (v) => v ? <Tag color="orange">{t.yes}</Tag> : <Tag color="green">{t.no}</Tag>,
                  },
                ]}
              />
            </Card>
          )}

          {analysis.fontFaces.length > 0 && (
            <Card title={t.fontFacesTitle}>
              <Table
                size="small"
                pagination={false}
                dataSource={analysis.fontFaces.map((f, idx) => ({
                  key: idx,
                  family: f.family,
                  decls: f.declarations.join('; '),
                }))}
                columns={[
                  { title: t.fontFacesColFamily, dataIndex: 'family', render: (v) => <Text code>{v}</Text> },
                  { title: t.fontFacesColDecls, dataIndex: 'decls', render: (v) => <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>{v}</Text> },
                ]}
              />
            </Card>
          )}

          <Card title={t.perRuleTitle}>
            <Table
              size="small"
              pagination={{ pageSize: 15, hideOnSinglePage: true }}
              dataSource={analysis.enriched.map((r, idx) => ({
                key: idx,
                selector: r.selector,
                specificity: r.specificity,
                depth: r.depth,
                decls: r.declarations.length,
                inside: r.wrappedIn ? r.wrappedIn.join(' ⊳ ') : t.topLevel,
              }))}
              columns={[
                {
                  title: t.perRuleColSelector,
                  dataIndex: 'selector',
                  render: (v) => <Text code style={{ wordBreak: 'break-all' }}>{v}</Text>,
                },
                {
                  title: t.perRuleColSpec,
                  dataIndex: 'specificity',
                  render: (s) => (
                    <Space size={4}>
                      <Tag color="magenta">a={s.a}</Tag>
                      <Tag color="blue">b={s.b}</Tag>
                      <Tag color="green">c={s.c}</Tag>
                    </Space>
                  ),
                },
                { title: t.perRuleColDepth, dataIndex: 'depth', align: 'right' },
                { title: t.perRuleColDecls, dataIndex: 'decls', align: 'right' },
                { title: t.perRuleColInside, dataIndex: 'inside', render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
              ]}
            />
          </Card>
        </>
      )}
    </Space>
  )
}