import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Switch, Descriptions, message } from 'antd'
import { FileTextOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCss, countStats } from '../utils/cssFormatter'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE_PRETTY = `:root {
  --brand: #4f46e5;
  --radius: 0.5rem;
}

/* botões */
.btn,
.btn.primary {
  padding: var(--radius);
  color: var(--brand);
  transition: transform 0.2s ease-in-out;
  background-color: rgba(79, 70, 229, 0.08);
}

.btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }

@keyframes slide {
  from { opacity: 0; }
  to { opacity: 1; transform: translateX(0); }
}

@media screen and (min-width: 720px) {
  .hero { background-image: url("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="); }
}
`

const SAMPLE_MIN = ':root{--brand:#4f46e5;--radius:0.5rem;}.btn, .btn.primary{padding:var(--radius);color:var(--brand);transition:transform 0.2s}@media screen and (min-width:720px){.hero{background-image:url("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")}}'

const SOURCE_SNIPPET = `// 1. Tokeniza: strings, comentários e url(...) são tokens únicos,
//    então nada é tocado por dentro deles; parênteses somam profundidade.
while (i < n) {
  if (c === '"' || c === "'")  tokenizar a string (com \\escapes)
  if (c === '/' && c2 === '*') tokenizar o comentário
  if (c === '{' || c === '}' || c === ';' || c === ',') token próprio
  else palavra: acumula até espaço/chave/*; conta ( e ) para a profundidade
}

// 2) Parse em escopos: num bloco, um ';' fecha uma declaração e um '{'
//    abre uma regra aninhada — só em profundidade de parêntese zero, então
//    `;`/`,` dentro de url(data:image/png;base64,...) não dividem nada.

// 3) Re-emissão:
//    pretty -> indentação de 2 espaços, declaração por linha
//              (prop: value;), seletores virgulados em linhas separadas,
//              linha em branco entre regras-raiz.
//    min    -> remove espaços, com espaço mínimo onde a fusão mudaria
//              o significado (duas palavras, or + (, url(...) + palavra).
//    A validação é o próprio tokenizer barrando: chave sem par, parêntese
//    sem par, aspas e comentário sem fechamento.
`

const translateError = (key, t) => {
  switch (key) {
    case 'stringUnclosed': return t.errString
    case 'commentUnclosed': return t.errComment
    case 'parenOpen': return t.errParenOpen
    case 'parenClose': return t.errParenClose
    case 'braceExtra': return t.errBraceExtra
    case 'braceUnclosed': return t.errBraceUnclosed
    default: return t.errGeneric
  }
}

const translations = {
  pt: {
    title: 'Formatador e Minificador de CSS',
    intro: (<>Cola um CSS e formatar com indentação, minifica ou valida — tudo local, com <Text code>tokenizer</Text> próprio, nada sai do navegador. Strings, comentários e <Text code>url(data:...)</Text> passam intactos. Complementa o formatador de JSON e o de XML, que não entendem CSS.</>),
    inputLabel: 'CSS de entrada',
    placeholder: 'Cole seu CSS aqui (ou use o exemplo)...',
    format: 'Formatar',
    minify: 'Minificar',
    samplePretty: 'Exemplo bonito',
    sampleMin: 'Exemplo minificado',
    clear: 'Limpar',
    keepComments: 'Manter comentários na minificação',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado!',
    emptyHint: 'Cole um CSS acima para ver o resultado.',
    errTitle: 'CSS inválido',
    errString: 'String sem aspas de fechamento',
    errComment: 'Comentário /* ... sem fechamento',
    errParenOpen: 'Parêntese ( aberto sem o ) de fechamento',
    errParenClose: 'Parêntese ) sem o ( de abertura',
    errBraceExtra: 'Chave } sem um { correspondente',
    errBraceUnclosed: 'Chave { sem um } correspondente',
    errGeneric: 'Sintaxe inválida',
    bytesIn: 'Entrada',
    bytesOut: 'Saída',
    saved: 'Economia',
    rules: 'Regras',
    decls: 'Declarações',
    comments: 'Comentários',
    note: 'A validação nasce do próprio tokenizer: string, comentário, parêntese-chave e chaves desbalanceadas são apontados. A indentação usa 2 espaços, seletores virgulados ganham uma linha por item e regras de raiz são separadas por linha em branco. Comentários são preservados no formatar; no minificar, a opção acima decide.',
    algorithmTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'CSS Formatter & Minifier',
    intro: (<>Paste some CSS to format it with indentation, minify it, or validate it — 100% local, powered by a small <Text code>tokenizer</Text>, nothing leaves the browser. Strings, comments and <Text code>url(data:...)</Text> pass through untouched. Complements the JSON and XML formatters, which don’t understand CSS.</>),
    inputLabel: 'CSS input',
    placeholder: 'Paste your CSS here (or pick the samples)...',
    format: 'Format',
    minify: 'Minify',
    samplePretty: 'Pretty sample',
    sampleMin: 'Minified sample',
    clear: 'Clear',
    keepComments: 'Keep comments when minifying',
    resultTitle: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    emptyHint: 'Paste some CSS above to see the result.',
    errTitle: 'Invalid CSS',
    errString: 'Unterminated string (missing closing quote)',
    errComment: 'Unterminated /* comment',
    errParenOpen: 'Missing closing ) for an open parenthesis',
    errParenClose: 'A ) without an opening (',
    errBraceExtra: 'A } without a matching {',
    errBraceUnclosed: 'A { without a matching }',
    errGeneric: 'Invalid syntax',
    bytesIn: 'In',
    bytesOut: 'Out',
    saved: 'Savings',
    rules: 'Rules',
    decls: 'Declarations',
    comments: 'Comments',
    note: 'Validation comes from the tokenizer itself: unterminated strings and comments, unbalanced parentheses and braces are all flagged. Indentation uses 2 spaces; comma-separated selectors get their own line each and root rules are separated by a blank line. Comments survive formatting; when minifying, the toggle above decides.',
    algorithmTitle: 'Under the hood (algorithm)',
  },
}

function bytesOf(s) {
  return new TextEncoder().encode(s).length
}

export default function CssFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLE_PRETTY)
  const [keepComments, setKeepComments] = useState(false)
  const [mode, setMode] = useState(null)
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [copied, setCopied] = useState(false)

  const opts = useMemo(() => ({ minifyKeepComments: keepComments }), [keepComments])

  function process(nextMode) {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setStats(null)
      setMode(nextMode)
      return
    }
    const res = formatCss(input, nextMode === 'minify' ? 'min' : 'pretty', opts)
    if (!res.ok) {
      setError(res.error)
      setOutput('')
      setStats(null)
      setMode(nextMode)
      return
    }
    setError(null)
    setOutput(res.text)
    setMode(nextMode)
    setStats({
      ...countStats(res.tree),
      in: bytesOf(input),
      out: bytesOf(res.text),
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
            <Button onClick={() => setSample(SAMPLE_PRETTY)}>{t.samplePretty}</Button>
            <Button onClick={() => setSample(SAMPLE_MIN)}>{t.sampleMin}</Button>
            <Button disabled={!input} onClick={() => setSample('')}>{t.clear}</Button>
          </Space>
          <Space wrap>
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
            <Descriptions size="small" column={4} style={{ marginBottom: 12 }}>
              <Descriptions.Item label={t.rules}>{stats.rules}</Descriptions.Item>
              <Descriptions.Item label={t.decls}>{stats.decls}</Descriptions.Item>
              <Descriptions.Item label={t.comments}>{stats.comments}</Descriptions.Item>
              <Descriptions.Item label={t.saved}>
                {mode === 'minify' ? `${saved}%` : '—'}
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