import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Table, Tag, Badge, message } from 'antd'
import { FileProtectOutlined, CopyOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseEnv } from '../utils/envParser'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE = `# Configuração do serviço
NODE_ENV=production
SECRET="v3rys3cr3t"
API_URL=https://api.example.com
API_URL=https://api.example.com/v2
TIMEOUT="15"
export DEBUG=true
MISSING=ok_without_use
REFERENCED=${APITES}INDEFINIDO
QUOTED='literal valor'
ESCAPED=\\#not a comment`

const translations = {
  pt: {
    title: 'Validador de arquivo .env',
    intro: (
      <>
        Cola um arquivo <Text code>.env</Text> e veja cada variável parseada e
        validada — chave, valor, aspas usadas e linha de origem — além de
        problemas comuns apontados: chaves duplicadas, sem valor, nomes
        inválidos, aspas mal fechadas, linhas sem <Text code>=</Text> e
        referências a variáveis indefinidas. 100% local; nada sai do
        navegador.
      </>
    ),
    input: 'Conteúdo do arquivo .env',
    sample: 'Carregar exemplo',
    clear: 'Limpar',
    parse: 'Analisar',
    parsed: 'variável(is) parseada(s)',
    ok: 'OK',
    withIssues: 'com problemas',
    entriesTitle: 'Variáveis',
    keyCol: 'Chave',
    valueCol: 'Valor',
    quoteCol: 'Aspas',
    lineCol: 'Linha',
    noQuote: 'sem aspas',
    single: 'simples',
    double: 'duplas',
    issuesTitle: 'Problemas (impedem o uso do valor)',
    warningsTitle: 'Avisos',
    emptyIssues: 'Nenhum problema. Arquivo limpo!',
    codeHint: 'Rode o parseador:',
    codeTab: 'Código-fonte (src/utils/envParser.js)',
    copy: 'Copiar código',
    copied: 'Copiado!',
    warn_duplicate: 'Chave duplicada',
    warn_undefined_ref: 'Referência a variável indefinida',
  },
  en: {
    title: '.env File Validator',
    intro: (
      <>
        Paste a <Text code>.env</Text> file and see every variable parsed —
        key, value, quoting style and source line — plus common problems
        flagged: duplicate keys, keys without a value, invalid names, unclosed
        quotes, lines without <Text code>=</Text>, and references to
        undefined variables. 100% local; nothing leaves the browser.
      </>
    ),
    input: '.env file contents',
    sample: 'Load sample',
    clear: 'Clear',
    parse: 'Parse',
    parsed: 'variable(s) parse',
    ok: 'OK',
    withIssues: 'with issue(s)',
    entriesTitle: 'Variables',
    keyCol: 'Key',
    valueCol: 'Value',
    quoteCol: 'Quote',
    lineCol: 'Line',
    noQuote: 'none',
    single: 'single',
    double: 'double',
    issuesTitle: 'Issues (block value use)',
    warningsTitle: 'Warnings',
    emptyIssues: 'No issues. File is clean!',
    codeHint: 'Run the parser:',
    codeTab: 'Source code (src/utils/envParser.js)',
    copy: 'Copy code',
    copied: 'Copied!',
    warn_duplicate: 'Duplicate key',
    warn_undefined_ref: 'Reference to undefined variable',
  },
}

const ISSUE_TEXT = {
  'no-equals': { pt: "Linha sem '='", en: "Line without '='" },
  'empty-key': { pt: "Chave vazia antes do '='", en: "Empty key before '='" },
  'invalid-key': { pt: 'Nome de chave inválido', en: 'Invalid key name' },
  'unclosed-quote': { pt: 'Aspas sem fechamento', en: 'Unclosed quote' },
}

const WARNING_TEXT = {
  duplicate: { pt: 'Chave duplicada', en: 'Duplicate key' },
  'undefined-ref': { pt: 'Referência a variável indefinida', en: 'Reference to undefined variable' },
}

const SOURCE = `export function parseEnv(input) {
  const text = String(input || '').replace(/^\\uFEFF/, '')
  const lines = text.split(/\\r?\\n/)
  const entries = []
  const issues = []
  const warnings = []
  const seen = {}

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1
    let line = raw.trimStart()
    if (/^export\\s+/.test(line)) line = line.replace(/^export\\s+/, '')
    if (!line || line.startsWith('#')) return

    const eq = line.indexOf('=')
    if (eq === -1) { issues.push({ lineNo, code: 'no-equals' }); return }
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).replace(/^\\s+/, '')
    if (!key) { issues.push({ line: lineNo, code: 'empty-key' }); return }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      issues.push({ line: lineNo, code: 'invalid-key' }); return
    }

    let quote = null
    if (value.startsWith('"')) {
      if (!value.endsWith('"')) { issues.push({ line: lineNo, code: 'unclosed-quote' }); return }
      quote = '"'; value = value.slice(1, -1)
    } else if (value.startsWith("'")) {
      if (!value.endsWith("'")) { issues.push({ line: lineNo, code: 'unclosed-quote' }); return }
      quote = "'"; value = value.slice(1, -1)
    } else {
      value = stripInlineComment(value)
    }

    if (seen[key] !== undefined) warnings.push({ line: lineNo, code: 'duplicate', key })
    seen[key] = lineNo
    entries.push({ key, value, quote, line: lineNo, raw })
  })

  const defined = new Map(entries.map((e) => [e.key, e]))
  entries.forEach((e) => {
    const re = /\\$(\\{[A-Za-z_][A-Za-z0-9_]*\\}|[A-Za-z_][A-Za-z0-9_]*)/g
    let m
    while ((m = re.exec(e.value)) !== null) {
      const name = m[1].replace(/[{}]/g, '')
      if (!defined.has(name)) warnings.push({ line: e.line, code: 'undefined-ref', ref: m[0], key: e.key })
    }
  })
  return { entries, issues, warnings }
}`

export default function EnvToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [content, setContent] = useState('')

  const result = useMemo(() => parseEnv(content), [content])

  const columns = useMemo(
    () => [
      { title: t.keyCol, dataIndex: 'key', key: 'key', render: (v) => <Text code strong>{v}</Text> },
      { title: t.valueCol, dataIndex: 'value', key: 'value', ellipsis: true, render: (v) => <Text>{v}</Text> },
      {
        title: t.quoteCol,
        dataIndex: 'quote',
        key: 'quote',
        width: 90,
        render: (q) => (q ? <Tag color="blue">{q === '"' ? t.double : t.single}</Tag> : <Tag>{t.noQuote}</Tag>),
      },
      { title: t.lineCol, dataIndex: 'line', key: 'line', width: 70 },
    ],
    [t],
  )

  function handleCopy() {
    navigator.clipboard.writeText(SOURCE)
    message.success(t.copied)
  }

  const hasIssues = result.issues.length > 0
  const hasWarnings = result.warnings.length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileProtectOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.input}
        extra={
          <Space>
            <Button size="small" onClick={() => setContent(SAMPLE)}>{t.sample}</Button>
            <Button size="small" onClick={() => setContent('')}>{t.clear}</Button>
          </Space>
        }
      >
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoSize={{ minRows: 6, maxRows: 14 }}
          style={{ fontFamily: 'monospace' }}
          placeholder="NODE_ENV=production&#10;SECRET=...&#10;# comentário"
        />
      </Card>

      <Space wrap size="middle">
        <Badge
          count={result.entries.length}
          color="green"
          showZero
        >
          <Tag color="green" style={{ fontSize: 13, padding: '4px 10px' }}>{t.ok}</Tag>
        </Badge>
        {result.issues.length > 0 && (
          <Badge count={result.issues.length} color="red" showZero>
            <Tag color="red" style={{ fontSize: 13, padding: '4px 10px' }}>{t.issuesTitle}</Tag>
          </Badge>
        )}
        {result.warnings.length > 0 && (
          <Badge count={result.warnings.length} color="gold" showZero>
            <Tag color="gold" style={{ fontSize: 13, padding: '4px 10px' }}>{t.warningsTitle}</Tag>
          </Badge>
        )}
      </Space>

      {result.entries.length > 0 && (
        <Card title={`${t.entriesTitle} (${result.entries.length})`}>
          <Table
            rowKey={(r) => `${r.line}-${r.key}`}
            columns={columns}
            dataSource={result.entries}
            size="small"
            pagination={false}
          />
        </Card>
      )}

      <Card title={t.issuesTitle}>
        {hasIssues ? (
          <>
            {result.issues.map((iss, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <Space size="small">
                  <Tag color="orange"><CloseCircleOutlined /></Tag>
                  <Space direction="vertical" size={0}>
                    <Text type="danger">
                      L{iss.line}: {t[`issue_${iss.code}`] || ISSUE_TEXT[iss.code]?.[lang]}
                      {iss.key ? ` — ${iss.key}` : ''}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{iss.raw}</Text>
                  </Space>
                </Space>
              </div>
            ))}
          </>
        ) : (
          <Text type="success">{t.emptyIssues}</Text>
        )}
      </Card>

      <Card title={t.warningsTitle}>
        {hasWarnings ? (
          result.warnings.map((w, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <Space size="small" wrap>
                <Tag color="gold"><WarningOutlined /></Tag>
                <Text>
                  L{w.line}: {WARNING_TEXT[w.code]?.[lang]}
                  {w.key ? ` — ${w.key}` : ''}
                  {w.ref ? ` (${w.ref})` : ''}
                  {w.previousLine ? ` ${lang === 'pt' ? `(primeira em L${w.previousLine})` : `(first on L${w.previousLine})`}` : ''}
                </Text>
              </Space>
            </div>
          ))
        ) : (
          <Text type="secondary">{lang === 'pt' ? 'Sem avisos.' : 'No warnings.'}</Text>
        )}
      </Card>

      <Card
        title={t.codeTab}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}
      >
        <Paragraph type="secondary">{t.codeHint} <Text code>parseEnv(content)</Text></Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto', overflowY: 'auto', maxHeight: 420, fontSize: 12 }}>
          <code>{SOURCE}</code>
        </pre>
      </Card>
    </Space>
  )
}