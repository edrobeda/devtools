import React, { useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Segmented, Switch, Descriptions, message } from 'antd'
import { FileTextOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { formatHtml } from '../utils/htmlFormatter'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Exemplo 1: fragmento bagunçado — espaços esquisitos, atributos com
// espaçamento estranho, listas aninhadas e um <br> solto.
const SAMPLE_MESSY = `<div   class="hero"><h1>Olá,  mundo!  </h1><p>Bem-vindo   ao nosso <strong>site</strong> . </p><ul><li>Item 1</li>  <li>Item   2</li><li><a href="#">Item 3</a></li></ul></div><section class="cards"><article><h2>Título</h2><p>Texto <em>com ênfase</em> e <code>código</code>.</p><img src="a.png" alt="imagem"><br></article></section>`

// Exemplo 2: documento completo com doctype, head (meta/title/style) e tabela.
const SAMPLE_DOC = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Minha página</title><style>body { margin: 0; }</style></head><body><header><h1>Título</h1><nav><ul><li><a href="/">Home</a></li><li><a href="/sobre">Sobre</a></li></ul></nav></header><main><table><tr><th>Nome</th><th>Idade</th></tr><tr><td>Ana</td><td>30</td></tr></table></main></body></html>`

// Algoritmo, em resumo legível (o código completo vive em src/utils/htmlFormatter.js).
const SOURCE_SNIPPET = `// 1. Parse: DOMParser text/html — o parser real do navegador, que
//    corrige HTML malformado (tag sem fechar, </p> solto) como um browser.

// 2. Decisão de quebra de linha:
//    INLINE (span, a, strong, em, code, img...)  -> fica na mesma linha
//    BLOCK  (div, p, ul, li, section, table...)  -> uma linha por nível
//    VOID   (img, br, input, meta, link...)      -> nunca tem fechamento
//    PRESERVE (pre, textarea, style, script)     -> conteúdo verbatim

// 3. Whitespace de texto é colapsado (\s+ vira um espaço) — o mesmo que o
//    navegador faz ao renderizar — então whitespace entre blocos some e
//    sequências de espaços viram um espaço único dentro do texto inline.

// 4. Atributos booleanos (checked, disabled, required, selected...) saem
//    sem ="" ; os demais são escapados (&, ", <).

// 5. Minify: mesma árvore, sem indentação nem quebras entre tags; a opção
//    removeComments (padrão ligada) descarta <!-- --> nesse modo.

// A saída NUNCA usa o whitespace original — é sempre re-serializada a
// partir do DOM, então o resultado é estável mesmo colando HTML minificado.`

const translations = {
  pt: {
    title: 'Formatador e Minificador de HTML',
    intro: (
      <>
        Cola um HTML bagunçado — e-mail renderizado, trecho do DevTools, uma
        tela com códigos — e formata com indentação ou minifica, tudo local
        via o <Text code>DOMParser</Text> do navegador. Fecha a família de
        formatadores (JSON, XML, CSS, TOML, SQL), que não cobria HTML.
      </>
    ),
    inputLabel: 'HTML de entrada',
    placeholder: 'Cole seu HTML aqui (ou use os exemplos)...',
    format: 'Formatar',
    minify: 'Minificar',
    sampleMessy: 'Exemplo bagunçado',
    sampleDoc: 'Exemplo documento',
    clear: 'Limpar',
    indentLabel: 'Indentação',
    removeComments: 'Remover comentários ao minificar',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado!',
    emptyHint: 'Cole um HTML acima para ver o resultado.',
    elements: 'Elementos',
    attrs: 'Atributos',
    comments: 'Comentários',
    bytesIn: 'Entrada',
    bytesOut: 'Saída',
    saved: 'Economia',
    note: 'O parser é o do navegador: HTML malformado (tag sem fechar, `</p>` solto) é corrigido automaticamente, então não existe "HTML inválido" aqui — o resultado é o que o navegador renderizaria. Ao colar um fragmento, meta/link/style/title sobem pro `<head>` e aparecem antes do body na saída. Conteúdo de pre/textarea/style/script é preservado verbatim (espaços e quebras nunca são reformatados). E o whitespace de texto é colapsado como na renderização: se você dependia de múltiplos espaços ou de `&nbsp;`, eles são necessários de verdade.',
    sourceTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'HTML Formatter & Minifier',
    intro: (
      <>
        Paste some messy HTML — a rendered email, a DevTools copy, a template
        — to format it with indentation or minify it, all local via the
        browser's <Text code>DOMParser</Text>. Closes the formatter family
        (JSON, XML, CSS, TOML, SQL), which didn't cover HTML.
      </>
    ),
    inputLabel: 'HTML input',
    placeholder: 'Paste your HTML here (or pick the samples)...',
    format: 'Format',
    minify: 'Minify',
    sampleMessy: 'Messy sample',
    sampleDoc: 'Document sample',
    clear: 'Clear',
    indentLabel: 'Indentation',
    removeComments: 'Strip comments when minifying',
    resultTitle: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    emptyHint: 'Paste some HTML above to see the result.',
    elements: 'Elements',
    attrs: 'Attributes',
    comments: 'Comments',
    bytesIn: 'In',
    bytesOut: 'Out',
    saved: 'Savings',
    note: 'The parser is the browser\'s own: malformed HTML (unclosed tags, stray `</p>`) is auto-fixed, so there is no "invalid HTML" here — the output is what the browser would render. When you paste a fragment, meta/link/style/title get hoisted into `<head>` and show up before the body in the output. Content inside pre/textarea/style/script is preserved verbatim (spaces and line breaks are never reformatted). And text whitespace collapses just like rendering: if you depended on multiple spaces or `&nbsp;`, you really need them.',
    sourceTitle: 'Under the hood (algorithm)',
  },
}

function bytesOf(s) {
  return new TextEncoder().encode(s).length
}

export default function HtmlFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLE_MESSY)
  const [output, setOutput] = useState('')
  const [stats, setStats] = useState(null)
  const [mode, setMode] = useState(null)
  const [indent, setIndent] = useState(2)
  const [removeComments, setRemoveComments] = useState(true)
  const [copied, setCopied] = useState(false)

  function process(nextMode) {
    if (!input.trim()) {
      setOutput('')
      setStats(null)
      setMode(nextMode)
      return
    }
    const { text, stats: s } = formatHtml(input, {
      minify: nextMode === 'minify',
      indent,
      removeComments,
    })
    setOutput(text)
    setStats({ ...s, in: bytesOf(input), out: bytesOf(text) })
    setMode(nextMode)
  }

  function setSample(value) {
    setInput(value)
    setOutput('')
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
            onChange={(e) => { setInput(e.target.value); setOutput('') }}
            placeholder={t.placeholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Button type="primary" onClick={() => process('format')}>{t.format}</Button>
            <Button onClick={() => process('minify')}>{t.minify}</Button>
            <Button onClick={() => setSample(SAMPLE_MESSY)}>{t.sampleMessy}</Button>
            <Button onClick={() => setSample(SAMPLE_DOC)}>{t.sampleDoc}</Button>
            <Button disabled={!input} onClick={() => setSample('')}>{t.clear}</Button>
          </Space>
          <Space wrap>
            <Text type="secondary" style={{ fontSize: 13 }}>{t.indentLabel}</Text>
            <Segmented
              size="small"
              value={indent}
              onChange={setIndent}
              options={[
                { label: '2', value: 2 },
                { label: '4', value: 4 },
              ]}
            />
            <Switch checked={removeComments} onChange={setRemoveComments} size="small" />
            <Text type="secondary" style={{ fontSize: 13 }}>{t.removeComments}</Text>
          </Space>
        </Space>
      </Card>

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
            <Descriptions size="small" column={6} style={{ marginBottom: 12 }}>
              <Descriptions.Item label={t.elements}>{stats.elements}</Descriptions.Item>
              <Descriptions.Item label={t.attrs}>{stats.attrs}</Descriptions.Item>
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
        <Text type="secondary">{t.emptyHint}</Text>
      )}

      <Alert type="info" showIcon message={t.note} />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
          <code>{SOURCE_SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}
