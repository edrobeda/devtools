import React, { useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Switch, Segmented, Descriptions, message } from 'antd'
import { FileTextOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { formatSql, minifySql, sqlStats } from '../utils/sqlFormatter'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE_SELECT = `SELECT u.id, u.name, count(o.id) AS orders, max(o.created_at) AS last_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = TRUE
  AND u.created_at >= '2024-01-01'
  AND u.city IN ('sp', 'rj')
GROUP BY u.id, u.name
HAVING count(o.id) >= 2
ORDER BY orders DESC, u.name
LIMIT 10;`

const SAMPLE_INSERT = `insert into customers (name, price, active) values ('Mouse Gamer', 199.90, TRUE), ('Teclado Mecânico', 349.00, TRUE), ('Monitor 27"', 899.00, TRUE) on conflict (name) do update set price = excluded.price;`

const SAMPLE_DDL = `CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);`

const SAMPLE_MINI = `select name, (select max(total) from orders o where o.user_id = u.id) as max_total from users u where u.active = true and u.id in (select user_id from orders where total > 1000) order by max_total desc nulls last limit 5;`

const SOURCE_SNIPPET = `// 1. Tokeniza o SQL: strings '...', identificadores "..." / \`...\` / [...] ,
//    comentários -- e /* */ , números e operadores — cada um vira um token
//    único, nada é tocado por dentro deles (prefixo E'...'/N'...' incluído).
//
// 2. Re-emissão com poucos estados:
//    - cláusula nova (SELECT/FROM/WHERE/GROUP/...): linha própria no
//      indent-base do escopo;
//    - cláusulas de lista (SELECT, FROM, WHERE, HAVING, VALUES, SET):
//      conteúdo na linha seguinte, indent +1, um item por linha;
//    - '(' que abre subquery (próximo token SELECT/WITH/...) ou as
//      colunas de CREATE TABLE vira bloco: conteúdo indentado +1, com o
//      ')' voltando alinhado à linha de abertura;
//    - AND/OR dentro de WHERE/HAVING/ON quebram linha no nível do conteúdo;
//      GROUP BY / ORDER BY emendam o BY e depois listam um por linha;
//    - '.', '::', '->' e '(' de função colam no token vizinho (sem espaço);
//    - ON CONFLICT DO UPDATE/SET mantém tudo inline até o próximo ';'.
//
// 3. Minificar: remove comentários e re-emite com espaço só onde a fusão
//    mudaria o significado (SELECT * precisa de espaço; count(x) não).
//
// 4. Validação nasce do próprio tokenizer: string/comentário sem
//    fechamento e parêntese desbalanceado são apontados antes de formatar.
`

const translateError = (key, t) => {
  switch (key) {
    case 'quoteUnclosed': return t.errQuote
    case 'commentUnclosed': return t.errComment
    case 'parenUnbalanced': return t.errParen
    default: return t.errGeneric
  }
}

const translations = {
  pt: {
    title: 'Formatador de SQL',
    intro: (<>Cola um SQL e formata com indentação ou minifica — 100% local, com <Text code>tokenizer</Text> próprio, nada sai do navegador. Whitespace e comentários podem ser reorganizados à vontade; o re-emissor só comprime/expande o que é seguro. Complementa o <Text code>json-formatter</Text>/<Text code>xml-formatter</Text>/<Text code>css-formatter</Text>, que não entendem SQL.</>),
    inputLabel: 'SQL de entrada',
    placeholder: 'Cole seu SQL aqui (ou use os exemplos)...',
    format: 'Formatar',
    minify: 'Minificar',
    sampleSelect: 'SELECT',
    sampleInsert: 'INSERT',
    sampleDdl: 'CREATE TABLE',
    sampleMini: 'Subquery',
    clear: 'Limpar',
    upperKeywords: 'Palavras-chave em maiúsculas',
    indentLabel: 'Indentação',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado!',
    emptyHint: 'Cole um SQL acima para ver o resultado.',
    err: 'SQL inválido',
    errQuote: 'String sem aspas de fechamento',
    errComment: 'Comentário /* ... sem fechamento',
    errParen: 'Parênteses desbalanceados (falta um ( ou ))',
    errGeneric: 'Sintaxe inválida',
    statements: 'Statements',
    tokens: 'Tokens',
    bytesIn: 'Entrada',
    bytesOut: 'Saída',
    saved: 'Economia',
    note: 'Cláusulas novas ganham linha própria, listas (SELECT, WHERE, GROUP BY...) um item por linha, subqueries e CREATE TABLE ganham bloco indentado, e strings, comentários, casts (::) e identadores com aspas colam como devem. No modo minificar, comentários são removidos e só os espaços obrigatórios pro SQL continuar válido são mantidos — nada dentro de strings é tocado.',
    algorithmTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'SQL Formatter',
    intro: (<>Paste some SQL to format it with indentation or minify it — fully local, powered by its own <Text code>tokenizer</Text>, nothing leaves the browser. Whitespace and comments are freely rearranged; the re-emitter only compresses/expands what is safe. Complements the <Text code>json</Text>/<Text code>xml</Text>/<Text code>css</Text> formatters, which don’t speak SQL.</>),
    inputLabel: 'SQL input',
    placeholder: 'Paste your SQL here (or pick a sample)...',
    format: 'Format',
    minify: 'Minify',
    sampleSelect: 'SELECT',
    sampleInsert: 'INSERT',
    sampleDdl: 'CREATE TABLE',
    sampleMini: 'Subquery',
    clear: 'Clear',
    upperKeywords: 'Uppercase keywords',
    indentLabel: 'Indentation',
    resultTitle: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    emptyHint: 'Paste some SQL above to see the result.',
    err: 'Invalid SQL',
    errQuote: 'Unterminated string (missing closing quote)',
    errComment: 'Unterminated /* comment',
    errParen: 'Unbalanced parentheses (missing a ( or ))',
    errGeneric: 'Invalid syntax',
    statements: 'Statements',
    tokens: 'Tokens',
    bytesIn: 'In',
    bytesOut: 'Out',
    saved: 'Savings',
    note: 'New clauses get their own line, list clauses (SELECT, WHERE, GROUP BY...) one entry per line, subqueries and CREATE TABLE get block indentation, and strings, identifiers with quotes, casts and column tokens keep their required gluing. When minifying, comments are dropped and only the spaces needed to keep valid SQL are kept — values inside strings are never touched.',
    algorithmTitle: 'Under the hood (algorithm)',
  },
}

function bytesOf(s) {
  return new TextEncoder().encode(s).length
}

export default function SqlFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLE_SELECT)
  const [upperKeywords, setUpperKeywords] = useState(true)
  const [indent, setIndent] = useState(2)
  const [mode, setMode] = useState(null)
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [copied, setCopied] = useState(false)

  function process(nextMode) {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setStats(null)
      setMode(nextMode)
      return
    }
    const res = formatSql(input, { upperKeywords, indent })
    if (!res.ok) {
      setError(res.error)
      setOutput('')
      setStats(null)
      setMode(nextMode)
      return
    }
    const text = nextMode === 'minify' ? minifySql(input) : res.text
    setError(null)
    setOutput(text)
    setMode(nextMode)
    setStats({
      ...sqlStats(input),
      in: bytesOf(input),
      out: bytesOf(text),
    })
  }

  function setSample(value) {
    setInput(value)
    setOutput('')
    setError(null)
    setStats(null)
  }

  async function handleCopy() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.info(t.emptyHint)
    }
  }

  const saved =
    stats && mode === 'minify' && stats.in > 0 && stats.out < stats.in
      ? Math.round(((stats.in - stats.out) / stats.in) * 1000) / 10
      : 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={12}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(''); setError(null) }}
            placeholder={t.placeholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Button type="primary" onClick={() => process('format')}>{t.format}</Button>
            <Button onClick={() => process('minify')}>{t.minify}</Button>
          </Space>
          <Space wrap>
            <Button size="small" onClick={() => setSample(SAMPLE_SELECT)}>{t.sampleSelect}</Button>
            <Button size="small" onClick={() => setSample(SAMPLE_INSERT)}>{t.sampleInsert}</Button>
            <Button size="small" onClick={() => setSample(SAMPLE_DDL)}>{t.sampleDdl}</Button>
            <Button size="small" onClick={() => setSample(SAMPLE_MINI)}>{t.sampleMini}</Button>
            <Button size="small" disabled={!input} onClick={() => setSample('')}>{t.clear}</Button>
          </Space>
          <Space wrap>
            <Switch checked={upperKeywords} onChange={setUpperKeywords} size="small" />
            <Text type="secondary" style={{ fontSize: 13 }}>{t.upperKeywords}</Text>
            <Segmented
              size="small"
              value={indent}
              onChange={setIndent}
              options={[{ label: `2 ${t.indentLabel}`, value: 2 }, { label: `4 ${t.indentLabel}`, value: 4 }]}
              style={{ marginLeft: 16 }}
            />
          </Space>
        </Space>
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          message={t.err}
          description={<Text code>{translateError(error, t)}</Text>}
        />
      )}

      {output ? (
        <Card
          title={
            <Space size={8}>
              <span>{t.resultTitle}</span>
              {stats && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.bytesOut}: {stats.out} B
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
          {stats && (
            <Descriptions size="small" column={3} style={{ marginBottom: 12 }}>
              <Descriptions.Item label={t.statements}>{stats.statements}</Descriptions.Item>
              <Descriptions.Item label={t.tokens}>{stats.tokens}</Descriptions.Item>
              <Descriptions.Item label={t.saved}>
                {mode === 'minify' && stats.in > 0 ? `${saved}%` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t.bytesIn}>{stats.in} B</Descriptions.Item>
              <Descriptions.Item label={t.bytesOut}>{stats.out} B</Descriptions.Item>
            </Descriptions>
          )}
          <pre style={{
            margin: 0,
            overflowX: 'auto',
            maxHeight: 440,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 13,
          }}>
            <code>{output}</code>
          </pre>
        </Card>
      ) : (
        !error && <Text type="secondary">{t.emptyHint}</Text>
      )}

      <Alert type="info" showIcon message={t.note} />

      <Card title={t.algorithmTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
          <code>{SOURCE_SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}