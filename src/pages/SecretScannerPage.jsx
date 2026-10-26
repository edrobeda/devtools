import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Input, Space, Button, Checkbox, Segmented, Tag, Alert,
  Empty, Table, Row, Col, Statistic, Collapse,
} from 'antd'
import {
  SecurityScanOutlined, ClearOutlined, ExperimentOutlined, CopyOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  SECRET_RULES, SEVERITIES, SEVERITY_WEIGHT, scanText, summarizeFindings,
} from '../utils/secretScanner'

const { Title, Paragraph, Text } = Typography

const RULES_BY_ID = Object.fromEntries(SECRET_RULES.map((rule) => [rule.id, rule]))

const SEVERITY_COLOR = {
  critical: 'red',
  high: 'volcano',
  medium: 'orange',
  low: 'gold',
}

const SAMPLE = [
  '# .env de exemplo ficticio — nenhum segredo real',
  'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
  'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  'GITHUB_TOKEN=ghp_0123456789abcdefghijklmnopqrstuvwxyz',
  'STRIPE_SECRET_KEY=sk_' + 'live_51H8xK2AbCdEfGhIjKlMnOpQr',
  'OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz0123456789',
  'DATABASE_URL=postgres://admin:sup3rs3cret@db.internal:5432/app',
  'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
  'api_key = "9f2c7b1e4a8d5f3c0b6e9a2d7c4f1b8e"',
  'slack_webhook=https://hooks.slack.' + 'com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
].join('\n')

const SOURCE_CODE = `// src/utils/secretScanner.js — resumo da implementacao
const RULES = [
  { id: 'aws-access-key', severity: 'critical',
    source: '\\\\b(?:AKIA|ASIA|AIDA|AROA)[A-Z0-9]{16}\\\\b' },
  { id: 'github-token', severity: 'critical',
    source: '\\\\bgh[pousr]_[A-Za-z0-9]{36,}\\\\b' },
  { id: 'stripe-secret', severity: 'critical',
    source: '\\\\bsk_(?:live|test)_[A-Za-z0-9]{16,}\\\\b' },
  { id: 'private-key', severity: 'critical',
    source: '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----' },
  { id: 'jwt', severity: 'medium',
    source: '\\\\beyJ[A-Za-z0-9_-]+\\\\.[A-Za-z0-9_-]+\\\\.[A-Za-z0-9_-]+\\\\b' }
]

function shannonEntropy(str) {
  const freq = {}
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1
  let h = 0
  for (const ch in freq) {
    const p = freq[ch] / str.length
    h -= p * Math.log2(p)
  }
  return h
}

// Camada 2: api_key = "..." / token: "..." com alta entropia
const ASSIGNMENT = /(api[_-]?key|secret|token|password)\\\\s*[:=]\\\\s*["']?([A-Za-z0-9_./+~-]{12,})/gi

function scan(text) {
  const findings = []
  for (const rule of RULES) {
    const re = new RegExp(rule.source, 'g')
    let m
    while ((m = re.exec(text)) !== null) {
      findings.push({ rule: rule.id, severity: rule.severity, match: m[0] })
      if (m.index === re.lastIndex) re.lastIndex += 1
    }
  }
  return findings
}`

const translations = {
  pt: {
    title: 'Scanner de Segredos Expostos',
    intro: (
      <>
        Cola um trecho de código, um <Text code>.env</Text>, um diff ou um log e
        este scanner procura credenciais que vazaram — chaves da AWS, tokens do
        GitHub/GitLab/Slack, chaves de API (Stripe, Google, OpenAI…), chaves
        privadas PEM, JWTs e strings de conexão com senha. Cada achado vira uma
        linha de laudo com <Text code>severidade</Text>, tipo, linha e o valor
        mascarado. Diferente do Redator de PII, aqui o objetivo é auditar e
        priorizar a rotação, não gerar uma versão limpa do texto. 100% no
        navegador — nada sai daqui.
      </>
    ),
    inputTitle: 'Código / log de entrada',
    inputPlaceholder: 'Cole o código, diff ou log para escanear...',
    sample: 'Carregar exemplo',
    clear: 'Limpar',
    optionsTitle: 'Opções',
    genericLabel: 'Detectar segredos genéricos por entropia (api_key = "...", token: "...")',
    filterLabel: 'Filtrar por severidade',
    filterAll: 'Todas',
    summaryTitle: 'Resumo',
    total: 'Total',
    found: 'Achados',
    resultsTitle: 'Laudo',
    columnSeverity: 'Severidade',
    columnType: 'Tipo',
    columnLine: 'Linha',
    columnValue: 'Valor (mascarado)',
    columnAdvice: 'Recomendação',
    emptyInput: 'Cole um texto acima para escanear.',
    nothingFound: 'Nenhum segredo aparente detectado. Ainda assim, revise credenciais que não seguem um formato conhecido.',
    copyReport: 'Copiar laudo',
    copied: 'Copiado!',
    remediationTitle: 'O que fazer ao encontrar um segredo',
    remediationDesc: (
      <>
        Considere o segredo como comprometido assim que ele aparece num local
        compartilhado. Rotacione/revogue a credencial primeiro, depois remova
        do histórico (<Text code>git filter-repo</Text> ou BFG) — só apagar o
        commit mais recente não basta. Para o futuro, mantenha segredos em
        variáveis de ambiente ou num cofre, nunca no repositório.
      </>
    ),
    sourceTitle: 'Código-fonte do motor',
    entropyNote:
      'A camada de entropia só olha para atribuições (chave = valor) e ignora placeholders comuns, para reduzir falsos positivos.',
    severity: {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo',
    },
    severityAdvice: {
      critical: 'Revogue e rotacione esta credencial agora e remova-a do histórico do Git.',
      high: 'Rotacione esta credencial e verifique onde mais ela foi usada.',
      medium: 'Avalie se esta credencial ainda é válida; se sim, considere rotacioná-la.',
      low: 'Verifique se o valor é realmente sensível antes de agir.',
    },
  },
  en: {
    title: 'Leaked Secret Scanner',
    intro: (
      <>
        Paste a code snippet, a <Text code>.env</Text>, a diff or a log and this
        scanner looks for leaked credentials — AWS keys, GitHub/GitLab/Slack
        tokens, API keys (Stripe, Google, OpenAI…), PEM private keys, JWTs and
        connection strings with passwords. Each hit becomes a report row with
        <Text code>severity</Text>, type, line and the masked value. Unlike the
        PII Redactor, the goal here is to audit and prioritize rotation, not to
        produce a cleaned-up copy of the text. 100% in the browser — nothing
        leaves this page.
      </>
    ),
    inputTitle: 'Input code / log',
    inputPlaceholder: 'Paste the code, diff or log to scan...',
    sample: 'Load sample',
    clear: 'Clear',
    optionsTitle: 'Options',
    genericLabel: 'Detect generic high-entropy secrets (api_key = "...", token: "...")',
    filterLabel: 'Filter by severity',
    filterAll: 'All',
    summaryTitle: 'Summary',
    total: 'Total',
    found: 'Findings',
    resultsTitle: 'Report',
    columnSeverity: 'Severity',
    columnType: 'Type',
    columnLine: 'Line',
    columnValue: 'Value (masked)',
    columnAdvice: 'Recommendation',
    emptyInput: 'Paste some text above to scan.',
    nothingFound: 'No apparent secret detected. Still, review credentials that do not follow a known format.',
    copyReport: 'Copy report',
    copied: 'Copied!',
    remediationTitle: 'What to do when you find a secret',
    remediationDesc: (
      <>
        Treat the secret as compromised as soon as it shows up in a shared
        place. Rotate/revoke the credential first, then purge it from history
        (<Text code>git filter-repo</Text> or BFG) — deleting only the latest
        commit is not enough. Going forward, keep secrets in environment
        variables or a vault, never in the repository.
      </>
    ),
    sourceTitle: 'Engine source code',
    entropyNote:
      'The entropy layer only inspects assignments (key = value) and ignores common placeholders, to reduce false positives.',
    severity: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    severityAdvice: {
      critical: 'Revoke and rotate this credential now and purge it from Git history.',
      high: 'Rotate this credential and check where else it was used.',
      medium: 'Assess whether this credential is still valid; if so, consider rotating it.',
      low: 'Check whether the value is actually sensitive before acting.',
    },
  },
}

const FILTER_WEIGHT = {
  all: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

export default function SecretScannerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState(SAMPLE)
  const [includeGeneric, setIncludeGeneric] = useState(true)
  const [minSeverity, setMinSeverity] = useState('all')
  const [copied, setCopied] = useState(false)

  const findings = useMemo(
    () => scanText(text, { includeGeneric }),
    [text, includeGeneric],
  )

  const counts = useMemo(() => summarizeFindings(findings), [findings])

  const filtered = useMemo(() => {
    const min = FILTER_WEIGHT[minSeverity]
    return findings.filter((f) => SEVERITY_WEIGHT[f.severity] >= min)
  }, [findings, minSeverity])

  const adviceFor = (record) => {
    const rule = RULES_BY_ID[record.ruleId]
    if (rule && rule.advice) return rule.advice[lang]
    return t.severityAdvice[record.severity]
  }

  const columns = [
    {
      title: t.columnSeverity,
      dataIndex: 'severity',
      key: 'severity',
      width: 110,
      filters: SEVERITIES.map((s) => ({ text: t.severity[s], value: s })),
      onFilter: (value, record) => record.severity === value,
      render: (severity) => <Tag color={SEVERITY_COLOR[severity]}>{t.severity[severity]}</Tag>,
    },
    {
      title: t.columnType,
      dataIndex: 'label',
      key: 'type',
      render: (label) => label[lang],
    },
    {
      title: t.columnLine,
      dataIndex: 'line',
      key: 'line',
      width: 80,
      sorter: (a, b) => a.line - b.line,
    },
    {
      title: t.columnValue,
      dataIndex: 'masked',
      key: 'value',
      render: (masked) => <Text code>{masked}</Text>,
    },
  ]

  const handleCopy = () => {
    const lines = filtered.map(
      (f) =>
        `${t.severity[f.severity]}\t${f.label[lang]}\t${t.columnLine} ${f.line}\t${f.masked}`,
    )
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const hasText = text.trim().length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SecurityScanOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Input.TextArea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space wrap style={{ marginTop: 8 }}>
          <Button icon={<ExperimentOutlined />} onClick={() => setText(SAMPLE)}>
            {t.sample}
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setText('')}>
            {t.clear}
          </Button>
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Checkbox
            checked={includeGeneric}
            onChange={(e) => setIncludeGeneric(e.target.checked)}
          >
            {t.genericLabel}
          </Checkbox>
          <Space wrap size="middle" align="center">
            <Text strong>{t.filterLabel}:</Text>
            <Segmented
              value={minSeverity}
              onChange={setMinSeverity}
              options={[
                { label: t.filterAll, value: 'all' },
                { label: t.severity.critical, value: 'critical' },
                { label: t.severity.high, value: 'high' },
                { label: t.severity.medium, value: 'medium' },
              ]}
            />
          </Space>
          {includeGeneric && <Text type="secondary">{t.entropyNote}</Text>}
        </Space>
      </Card>

      <Card title={t.summaryTitle}>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.total} value={findings.length} />
          </Col>
          {SEVERITIES.map((s) => (
            <Col xs={12} sm={8} md={5} key={s}>
              <Statistic
                title={t.severity[s]}
                value={counts[s]}
                valueStyle={{ color: s === 'critical' && counts[s] > 0 ? '#cf1322' : undefined }}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={t.resultsTitle}
        extra={
          <Button
            icon={<CopyOutlined />}
            disabled={!hasText || filtered.length === 0}
            onClick={handleCopy}
          >
            {copied ? t.copied : t.copyReport}
          </Button>
        }
      >
        {!hasText ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.emptyInput} />
        ) : filtered.length === 0 ? (
          <Alert type="success" showIcon message={t.nothingFound} />
        ) : (
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={filtered}
            pagination={filtered.length > 20 ? { pageSize: 20 } : false}
            scroll={{ x: 'max-content' }}
            expandable={{
              expandedRowRender: (record) => (
                <Paragraph style={{ margin: 0 }}>
                  <Text strong>{t.columnAdvice}: </Text>
                  {adviceFor(record)}
                </Paragraph>
              ),
            }}
          />
        )}
      </Card>

      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        message={t.remediationTitle}
        description={t.remediationDesc}
      />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: 8,
                  overflow: 'auto',
                }}
              >
                <code>{SOURCE_CODE}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
