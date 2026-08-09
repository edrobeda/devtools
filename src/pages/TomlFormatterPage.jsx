import React, { useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Segmented, Switch, Collapse, message } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { formatToml, tomlStats } from '../utils/tomlFormatter'

const { Title, Paragraph, Text } = Typography
const TextArea = Input.TextArea

const SAMPLE_APP = `# pyproject.toml — exemplo de projeto Python

[project]
name = "meu-pacote"
version = "1.2.3"
requires-python = ">=3.11"
description = """Um pacote de exemplo
com linha dupla quebrada."""

dependencies = ["requests", "pydantic", "rich>=13"]
classifiers = ["Programming Language :: Python :: 3", "License :: OSI Approved :: MIT"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.pytest.ini_options]
addopts = "-ra -q"
testpaths = ["tests"]
fail_no_tests = false

[tool.mypy]
strict = true
plugins = ["pydantic.mypy"]
`

const SAMPLE_CARGO = `# Cargo.toml — projeto Rust

[package]
name = "meu-bin"
version = "0.1.0"
edition = "2021"
authors = ["devtools <dev@example.com>"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
regex = "1.10"

[features]
default = ["std"]
std = []
serde_support = ["dep:serde"]
`

const SAMPLE_DOCKER = `# Mostra arrays de tabelas ([[...]])

[[containers]]
name = "web"
image = "nginx:alpine"
ports = [80, 8000]

[[containers]]
name = "db"
image = "postgres:16"
env = { POSTGRES_USER = "app", POSTGRES_PASSWORD = "secret" }
ports = [5432]
`

const SAMPLE_GEODATA = `# Números e datas de exemplo

[limits]
max_conn = 5_000
ratio = 0.8137
pi = 3.14159265e0
neg = -273.15
octal = 0o755
huge = 2.0e+30
inf = +\`inf\`
nan = \`nan\`

[times]
created = 1979-05-27T07:32:00Z
local = 1979-05-27T07:32:00
just_date = 1979-05-27
just_time = 07:32:00.5
`

const translateError = (key, t) => {
  switch (key) {
    case 'stringBasic': return t.errStringBasic
    case 'stringLiteral': return t.errStringLiteral
    case 'stringMultiline': return t.errStringMultiline
    case 'invalidValue': return t.errInvalidValue
    case 'unclosedArray': return t.errUnclosedArray
    case 'unclosedInline': return t.errUnclosedInline
    case 'unclosedHeader': return t.errUnclosedHeader
    case 'arrayTableClose': return t.errArrayTableClose
    case 'missingEqual': return t.errMissingEqual
    case 'badKey': return t.errBadKey
    case 'badTableKey': return t.errBadTableKey
    case 'newlineInHeader': return t.errNewlineInHeader
    case 'valueExpected': return t.errValueExpected
    default: return t.errGeneric
  }
}

const translations = {
  pt: {
    title: 'Formatador e Validador de TOML',
    intro: (
      <>
        Cola um <Text code>TOML</Text> — o formato de config do Cargo, do{' '}
        <Text code>pyproject.toml</Text>, de servidores... — e formata com
        indentação, minifica ou valida. 100% local, com{' '}
        <Text code>tokenizer</Text> e parser próprios: nada sai do navegador
        e strings, comentários e números nunca são tocados por dentro. É o
        mais novo da família de formatadores de texto do projeto (
        <Text code>json-formatter</Text>, <Text code>xml-formatter</Text>,{' '}
        <Text code>css-formatter</Text>, <Text code>sql-formatter</Text>) —
        nenhum deles entendia a sintaxe de tabelas <Text code>[a.b]</Text>.
      </>
    ),
    inputLabel: 'TOML de entrada',
    placeholder: 'Cole seu TOML aqui (ou use os exemplos)...',
    format: 'Formatar',
    minify: 'Minificar',
    sampleApp: 'pyproject.toml',
    sampleCargo: 'Cargo.toml',
    sampleDocker: '[[containers]]',
    sampleGeo: 'Números & datas',
    clear: 'Limpar',
    indentLabel: 'Indentação',
    keepComments: 'Manter comentários ao minificar',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    emptyHint: 'Cole um TOML acima para ver o resultado.',
    errTitle: 'TOML inválido',
    errAt: 'linha',
    bytesIn: 'Entrada',
    bytesOut: 'Saída',
    savedLabel: 'Economia',
    tables: 'Tabelas',
    assigns: 'Chaves',
    inlineTables: 'Inline tables',
    arrays: 'Arrays',
    noteTitle: 'Pegadinhas do TOML',
    note: (
      <>
        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
          <li>Chaves simples são <Text code>[A-Za-z0-9_-]</Text>, mas o{' '}
            <Text strong>valor</Text> sempre precisa de aspas —{' '}
            <Text code>32 = "x"</Text> é uma atribuição válida, um número puro
            como par não.</li>
          <li>Strings multilinha (<Text code>"""..."""</Text>) preservam quebras
            de linha; a literal crua <Text code>'''...'''</Text> não faz{' '}
            <Text code>escape</Text> — um <Text code>#</Text> dentro de uma
            string nunca vira comentário.</li>
          <li>Cada tabela (<Text code>[a.b]</Text>) é definida uma única vez na
            árvore; tabelas inline <Text code>{'{ a = 1 }'}</Text> ficam em
            uma linha só.</li>
          <li>Datas sem timezone (<Text code>1979-05-27</Text>) e horas soltas (
            <Text code>07:32:00</Text>) são valores válidos — não são strings.</li>
        </ul>
        <div style={{ marginTop: 8 }}>Tudo roda no navegador: tokenize → parse → render.</div>
      </>
    ),
    howTitle: 'Como funciona (algoritmo)',
    errGeneric: 'Erro genérico de sintaxe.',
    errStringBasic: 'String básica sem fechamento.',
    errStringLiteral: 'String literal sem fechamento.',
    errStringMultiline: 'String multilinha sem fechador.',
    errInvalidValue: 'Valor não reconhecido (use string, número, data, true ou false).',
    errUnclosedArray: 'Array sem fechamento (falta ]).',
    errUnclosedInline: 'Tabela inline sem fechamento (falta }).',
    errUnclosedHeader: 'Header de tabela sem fechamento (falta ]).',
    errArrayTableClose: 'Array de tabelas exige ]].',
    errMissingEqual: 'Esperando = após a chave.',
    errBadKey: 'Chave inválida (use [A-Za-z0-9_-] ou aspas).',
    errBadTableKey: 'Nome de tabela inválido.',
    errNewlineInHeader: 'Quebra de linha dentro de header de tabela.',
    errValueExpected: 'Esperando um valor após =.',
  },
  en: {
    title: 'TOML Formatter & Validator',
    intro: (
      <>
        Paste some <Text code>TOML</Text> — the config format of Cargo,{' '}
        <Text code>pyproject.toml</Text>, servers... — and format it with
        indentation, minify it or validate it. 100% local, powered by its own{' '}
        <Text code>tokenizer</Text> and parser: nothing leaves the browser,
        and strings, comments and numbers are never touched on the inside. It
        is the newest member of the text-formatter family (
        <Text code>json-formatter</Text>, <Text code>xml-formatter</Text>,{' '}
        <Text code>css-formatter</Text>, <Text code>sql-formatter</Text>) —
        none of them understood the <Text code>[a.b]</Text> table syntax.
      </>
    ),
    errGeneric: 'Generic syntax error.',
    errStringBasic: 'Basic string missing a closing quote.',
    errStringLiteral: 'Literal string missing a closing quote.',
    errStringMultiline: 'Multiline string missing a closing delimiter.',
    errInvalidValue: 'Unknown value (use a string, number, date/time or true/false).',
    errUnclosedArray: 'Array missing a closing ].',
    errUnclosedInline: 'Inline table missing a closing }.',
    errUnclosedHeader: 'Table header missing a closing ].',
    errArrayTableClose: 'Array of tables needs ]].',
    errMissingEqual: 'Expected = after the key.',
    errBadKey: 'Invalid key (use [A-Za-z0-9_-] bare or quoted).',
    errBadTableKey: 'Invalid table name.',
    errNewlineInHeader: 'Line break inside a table header.',
    errValueExpected: 'Expected a value after =.',
    inputLabel: 'TOML input',
    placeholder: 'Paste your TOML here (or pick a sample)...',
    format: 'Format',
    minify: 'Minify',
    sampleApp: 'pyproject.toml',
    sampleCargo: 'Cargo.toml',
    sampleDocker: '[[containers]]',
    sampleGeo: 'Numbers & dates',
    clear: 'Clear',
    indentLabel: 'Indentation',
    keepComments: 'Keep comments when minifying',
    resultTitle: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    emptyHint: 'Paste some TOML above to see the result.',
    errTitle: 'Invalid TOML',
    errAt: 'line',
    bytesIn: 'In',
    bytesOut: 'Out',
    savedLabel: 'Savings',
    tables: 'Tables',
    assigns: 'Keys',
    inlineTables: 'Inline tables',
    arrays: 'Arrays',
    noteTitle: 'Gotchas',
    note: (
      <>
        Validates <Text code>true</Text>/<Text code>false</Text>, decimal/
        hex/octal/binary integers (with named separators{' '}
        <Text code>_</Text>), floats with exponents and{' '}
        <Text code>inf</Text>/<Text code>nan</Text>, ISO-8601 dates and times,
        bare and quoted keys, nested tables and arrays of tables.
      </>
    ),
    howTitle: 'Under the hood (algorithm)',
  },
}

const SRC_TEXT = `// tokenizeToml — varre o texto cru em tokens: strings simples
//   (delimitadas por aspas), literais '...', multilinhas """/''' e
//   comentários '#' ate a quebra de linha; além dos estruturais
//   [ ] { } , =. Palavras (chaves, números, data/hora, true/false)
//   viram tokens 'word'.
//
// parseDoc — percorre os tokens construindo uma lista de statements:
//   - '[' / '[[' ... ']' / ']]'  → tabela / array de tabelas
//   - chave (com pontos) + '=' + valor  → par
//   O valor é recursivo: escalar, tabela inline '{ k = v }' ou array
//   '[...]' que pode conter novas linhas.
//
// renderStatements — re-emite a árvore em dois modos:
//   pretty: cada par na forma 'chave = valor', tabelas separadas por
//     linha em branco, arrays multilinha 1 item por linha (indent 2/4);
//   min:    'chave=valor' compacto, inline tables '{k="v"}', arrays
//     '[1,2,3]', comentários removidos a não ser que keepComments=true.
//
// Como o whitespace original nunca é reaproveitado — o re-emitidor
// reconstrói tudo a partir dos tokens — a saída fica limpa e válida
// mesmo com entrada bagunçada.`

export default function TomlFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt
  const [input, setInput] = useState(SAMPLE_APP)
  const [indent, setIndent] = useState(2)
  const [keepComments, setKeepComments] = useState(false)
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
    const res = formatToml(input, { mode: isMin ? 'min' : 'pretty', indent, keepComments })
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
    const stats = tomlStats(res.tree, input, res.text)
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
            <Button size="small" onClick={() => pastSample(SAMPLE_APP)}>{t.sampleApp}</Button>
            <Button size="small" onClick={() => pastSample(SAMPLE_CARGO)}>{t.sampleCargo}</Button>
            <Button size="small" onClick={() => pastSample(SAMPLE_DOCKER)}>{t.sampleDocker}</Button>
            <Button size="small" onClick={() => pastSample(SAMPLE_GEODATA)}>{t.sampleGeo}</Button>
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
            <Switch checked={keepComments} onChange={setKeepComments} size="small" />
            <Text type="secondary" style={{ fontSize: 13 }}>{t.keepComments}</Text>
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
          {result && result.assigns !== undefined && (
            <Space wrap size={[12, 4]} style={{ marginBottom: 12 }}>
              <Text code>{t.tables}: {result.tables}</Text>
              <Text code>{t.assigns}: {result.assigns}</Text>
              <Text code>{t.inlineTables}: {result.inlineTables}</Text>
              <Text code>{t.arrays}: {result.arrays}</Text>
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
            label: `${t.howTitle} — tokenizeToml → parseToml → renderStatements`,
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