import React, { useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Segmented, Collapse, message } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { formatYaml, yamlStats } from '../utils/yamlFormatter'

const { Title, Paragraph, Text } = Typography
const TextArea = Input.TextArea

const SAMPLE_COMPOSE = `# Exemplo: docker-compose.yml
version: "3.9"

services:
  web:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - type: volume
        source: db_data
        target: /var/lib/postgresql/data
    volumes:
      - ./html:/usr/share/nginx/html:ro
    healthcheck:
      test: ["CMD", "wget", "-q", "-O-", "http://localhost/"]
      interval: 30s
  db:
    image: postgres:16
    environment: {POSTGRES_USER: app, POSTGRES_PASSWORD: secret}
`

const SAMPLE_K8S = `# Exemplo: deployment.yaml (Kubernetes)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/component: server

spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    spec:
      containers:
        - name: server
          image: ghcr.io/me/server:1.2.3
          ports:
            - containerPort: 8080
          env:
            - name: LOG_LEVEL
              value: info
            - name: FEATURES
              value: "a,b"
`

const SAMPLE_CI = `# Exemplo: GitHub Actions workflow
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
        timeout-minutes: 10
`

const SAMPLE_CONFIG = `# Exemplo: ConfigMap com block scalar (multilinha)
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  nginx.conf: |
    server {
      listen 80 default_server;
      location /health { return 200; }
    }
  max_upload_mb: 32
  providers:
    - name: s3
      region: us-east-1
  note: 1234567890 # comentário é descartado na re-emissão
`

const translateError = (key, t) => {
  switch (key) {
    case 'tabIndent': return t.errTabIndent
    case 'unclosedFlow': return t.errUnclosedFlow
    case 'orphanIndent': return t.errOrphanIndent
    case 'multiDoc': return t.errMultiDoc
    case 'badKey': return t.errBadKey
    default: return t.errGeneric
  }
}

const translations = {
  pt: {
    title: 'Formatador e Validador de YAML',
    intro: (
      <>
        Cola um <Text code>YAML</Text> — <Text code>docker-compose</Text>,{' '}
        <Text code>Kubernetes</Text>, <Text code>GitHub Actions</Text>, Helm,
        CI... — e formata com indentação, minifica para uma única linha ou
        valida a estrutura. 100% local, com <Text code>tokenizer</Text> e
        parser próprios (indentação → árvore → re-emissão): nada sai do
        navegador. Completa a família de formatadores de texto do projeto (
        <Text code>json-formatter</Text>, <Text code>xml-formatter</Text>,{' '}
        <Text code>css-formatter</Text>, <Text code>sql-formatter</Text>,{' '}
        <Text code>toml-formatter</Text>) — era o único da família que ainda
        não estava no ar.
      </>
    ),
    inputLabel: 'YAML de entrada',
    placeholder: 'Cole seu YAML aqui (ou use os exemplos)...',
    format: 'Formatar',
    minify: 'Minificar',
    sampleCompose: 'docker-compose',
    sampleK8s: 'deployment.yaml',
    sampleCi: 'GitHub Actions',
    sampleConfig: 'ConfigMap',
    clear: 'Limpar',
    indentLabel: 'Indentação',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    emptyHint: 'Cole um YAML acima para ver o resultado.',
    errTitle: 'YAML inválido',
    errAt: 'linha',
    errGeneric: 'Erro genérico de sintaxe.',
    errTabIndent: 'Aba (tab) na indentação não é permitida em YAML.',
    errUnclosedFlow: 'Coleção em fluxo sem fechamento ([ ou { sem o ] ou } correspondente).',
    errOrphanIndent: 'Indentação inconsistente: uma linha mais funda que o nó atual sem pertencer a ele.',
    errMultiDoc: 'Marcador de documento (--- ou ...) em posição não suportada. Formate um documento por vez.',
    errBadKey: 'Chave vazia ou inválida.',
    bytesIn: 'Entrada',
    bytesOut: 'Saída',
    savedLabel: 'Economia',
    keys: 'Chaves',
    lists: 'Listas',
    depth: 'Profundidade',
    noteTitle: 'Pegadinhas do YAML',
    note: (
      <>
        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
          <li><Text code>yes/no/on/off</Text> são booleanos na leitura (YAML
            1.1, como o PyYAML) — <Text code>yes</Text> vira{' '}
            <Text code>true</Text> na saída; para manter a string, use aspas.</li>
          <li>Comentários (<Text code>#</Text>) são descartados na
            re-emissão: a saída é canônica, como nos outros formatadores.</li>
          <li>Strings multilinha viram block scalar <Text code>|</Text> (com
            o chomping <Text code>-</Text>/<Text code>+</Text> correto) no
            modo formatar; no minificar ficam com <Text code>\n</Text>.</li>
          <li><Text code>minificar</Text> colapsa tudo em uma linha de
            coleção de fluxo (<Text code>{'{ a: 1, b: [2, 3] }'}</Text>).</li>
          <li>Strings com <Text code>#</Text> ou dois-pontos seguido de
            espaço precisam de aspas — o formatador aspas automaticamente.</li>
          <li>Limite honesto: coleções de fluxo multilinha e âncoras/aliases
            (<Text code>&amp;</Text>, <Text code>*</Text>) não são suportados.</li>
        </ul>
        <div style={{ marginTop: 8 }}>Tudo roda no navegador: tokenize → parse → render.</div>
      </>
    ),
    howTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'YAML Formatter & Validator',
    intro: (
      <>
        Paste some <Text code>YAML</Text> — <Text code>docker-compose</Text>,{' '}
        <Text code>Kubernetes</Text>, <Text code>GitHub Actions</Text>, Helm,
        CI... — and format it with indentation, minify it into a single line
        or validate the structure. 100% local, powered by its own{' '}
        <Text code>tokenizer</Text> and parser (indentation → tree →
        re-emission): nothing leaves the browser. It completes the
        text-formatter family of the project (<Text code>json-formatter</Text>,{' '}
        <Text code>xml-formatter</Text>, <Text code>css-formatter</Text>,{' '}
        <Text code>sql-formatter</Text>, <Text code>toml-formatter</Text>) —
        it was the only member missing from the family.
      </>
    ),
    errGeneric: 'Generic syntax error.',
    errTabIndent: 'A tab used for indentation is not allowed in YAML.',
    errUnclosedFlow: 'Flow collection not closed ([ or { without a matching ] or }).',
    errOrphanIndent: 'Inconsistent indentation: a line deeper than the current node without belonging to it.',
    errMultiDoc: 'Document marker (--- or ...) at an unsupported position. Format one document at a time.',
    errBadKey: 'Empty or invalid key.',
    inputLabel: 'YAML input',
    placeholder: 'Paste your YAML here (or pick a sample)...',
    format: 'Format',
    minify: 'Minify',
    sampleCompose: 'docker-compose',
    sampleK8s: 'deployment.yaml',
    sampleCi: 'GitHub Actions',
    sampleConfig: 'ConfigMap',
    clear: 'Clear',
    indentLabel: 'Indentation',
    resultTitle: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    emptyHint: 'Paste some YAML above to see the result.',
    errTitle: 'Invalid YAML',
    errAt: 'line',
    bytesIn: 'In',
    bytesOut: 'Out',
    savedLabel: 'Savings',
    keys: 'Keys',
    lists: 'Lists',
    depth: 'Depth',
    noteTitle: 'Gotchas',
    note: (
      <>
        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
          <li><Text code>yes/no/on/off</Text> are read as booleans (YAML 1.1,
            like PyYAML) — <Text code>yes</Text> becomes{' '}
            <Text code>true</Text> on output; quote it to keep a string.</li>
          <li>Comments (<Text code>#</Text>) are dropped on re-emission:
            the output is canonical, like the other formatters.</li>
          <li>Multiline strings become <Text code>|</Text> block scalars (with{' '}
            <Text code>-</Text>/<Text code>+</Text> chomping) in format mode;
            in minify mode they use <Text code>\n</Text> escapes.</li>
          <li><Text code>minify</Text> collapses everything to a single-line
            flow collection (<Text code>{'{ a: 1, b: [2, 3] }'}</Text>).</li>
          <li>Strings containing <Text code>#</Text> or colon+space need
            quotes — the formatter quotes them automatically.</li>
          <li>Honest limit: multiline flow collections and anchors/aliases (
            <Text code>&amp;</Text>, <Text code>*</Text>) are not supported.</li>
        </ul>
        <div style={{ marginTop: 8 }}>Everything runs in the browser: tokenize → parse → render.</div>
      </>
    ),
    howTitle: 'Under the hood (algorithm)',
  },
}

const SRC_TEXT = `// tokenizeYaml — normaliza \\r\\n, separa em linhas e produz tokens
//   com coluna de indentação, removendo comentários fora de string.
//   Detecta: tab na indentação, coleções de fluxo [ ] / { } sem
//   fechamento (acumula o saldo linha a linha) e marcadores de
//   documento (--- / ...) fora do início do arquivo. Linhas de
//   block scalar (| >) são capturadas cruas, sem strip de comentário.
//
// parseYamlNode — parser recursivo à base de indentação:
//   - linha "chave:" vazio com filhos mais fundos → objeto aninhado;
//   - "- item" no mesmo nível da chave → sequência como valor;
//   - item de sequência com chave(s) → mapa de várias linhas
//     (parseSeqItem junta as chaves irmãs mais fundas);
//   - "- - 1" → sequência de sequências.
//   Entrada bagunçada gera erro com posição (linha/coluna) em vez de
//   adivinhar: orphanIndent para indentação inconsistente.
//
// renderPretty — re-emite a árvore do zero: indentação 2/4, strings
//   multilinha como block scalar '|' (com chomping -/+) e aspas só
//   quando necessário (regras de plain scalar). Comentários somem —
//   a saída é canônica.
//
// renderMin — colapsa tudo em uma única linha de coleção de fluxo,
//   com tipagem preservada (números, booleanos, null, listas, mapas).`

export default function YamlFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt
  const [input, setInput] = useState(SAMPLE_COMPOSE)
  const [indent, setIndent] = useState(2)
  const [mode, setMode] = useState(null)
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  function process(nextMode) {
    setMode(nextMode)
    const isMin = nextMode === 'minify'
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setResult(null)
      return
    }
    const res = formatYaml(input, { mode: isMin ? 'min' : 'pretty', indent })
    if (!res.ok) {
      setError({ key: res.error, line: res.line, col: res.col })
      setOutput('')
      setResult(null)
      return
    }
    setError(null)
    setOutput(res.text)
    if (!res.text.trim()) {
      setResult(null)
      return
    }
    const stats = yamlStats(res.tree, input, res.text)
    setResult({ ...stats, isMin })
  }

  async function handleCopy() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.warning(t.copyErr)
    }
  }

  const saved =
    result && result.isMin && result.bytesIn > 0 && result.bytesOut < result.bytesIn
      ? Math.round(((result.bytesIn - result.bytesOut) / result.bytesIn) * 1000) / 10
      : 0

  const errorMsg = error ? translateError(error.key, t) : ''

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputLabel}
        extra={(
          <Space wrap>
            <Button size="small" onClick={() => pastSample(SAMPLE_COMPOSE)}>{t.sampleCompose}</Button>
            <Button size="small" onClick={() => pastSample(SAMPLE_K8S)}>{t.sampleK8s}</Button>
            <Button size="small" onClick={() => pastSample(SAMPLE_CI)}>{t.sampleCi}</Button>
            <Button size="small" onClick={() => pastSample(SAMPLE_CONFIG)}>{t.sampleConfig}</Button>
            <Button size="small" disabled={!input} onClick={() => pastSample('')}>{t.clear}</Button>
          </Space>
        )}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={14}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(''); setError(null) }}
            placeholder={t.placeholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Button type="primary" onClick={() => process('pretty')}>{t.format}</Button>
            <Button onClick={() => process('minify')}>{t.minify}</Button>
          </Space>
          <Space wrap>
            <Text type="secondary" style={{ fontSize: 13 }}>{t.indentLabel}</Text>
            <Segmented
              size="small"
              value={indent}
              onChange={setIndent}
              options={[{ label: '2', value: 2 }, { label: '4', value: 4 }]}
              style={{ marginRight: 16 }}
            />
          </Space>
        </Space>
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          message={t.errTitle}
          description={
            <Space direction="vertical" size={0}>
              <Text code>{errorMsg}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.errAt} {error.line ?? '?'}, col {error.col ?? '?'}
              </Text>
            </Space>
          }
        />
      )}

      {output ? (
        <Card
          title={
            <Space size={8}>
              <span>{t.resultTitle}</span>
              {result && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.bytesIn}: {result.bytesIn} B · {t.bytesOut}: {result.bytesOut} B{' '}
                  {result.isMin ? `· ${t.savedLabel}: ${saved}%` : ''}
                </Text>
              )}
            </Space>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          {result && result.keys !== undefined && (
            <Space wrap size={[12, 4]} style={{ marginBottom: 12 }}>
              <Text code>{t.keys}: {result.keys}</Text>
              <Text code>{t.lists}: {result.lists}</Text>
              <Text code>{t.depth}: {result.depth}</Text>
            </Space>
          )}
          <pre style={{ margin: 0, overflow: 'auto', maxHeight: 480, fontFamily: 'monospace', fontSize: 13 }}>
            <code>{output}</code>
          </pre>
        </Card>
      ) : (
        !error && <Text type="secondary">{t.emptyHint}</Text>
      )}

      <Alert type="info" showIcon message={t.noteTitle} description={t.note} style={{ marginTop: 8 }} />

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.howTitle} — tokenizeYaml → parseYaml → render`,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13, maxHeight: 360, overflowY: 'auto' }}>
                <code>{SRC_TEXT}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )

  function pastSample(text) {
    setInput(text)
    setOutput('')
    setError(null)
    setResult(null)
  }
}