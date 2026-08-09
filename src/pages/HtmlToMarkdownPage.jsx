import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Collapse } from 'antd'
import { FileMarkdownOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Algoritmo exibido na página (idêntico ao que roda aqui): o parser do
// navegador (DOMParser) entrega uma árvore otimizada e este conversor a
// re-serializa em GitHub Flavored Markdown — blocos → linhas, inline → marcas.
const SNIPPET = `const BLOCK = new Set(['p','div','section','article','h1','h2','h3','h4','h5','h6',
  'ul','ol','li','pre','blockquote','table','hr','dl'])
const INLINE = new Set(['a','strong','b','em','i','s','del','code','kbd','img','br','span','sup','sub'])

function esc(t) {   // marcações em texto viram texto, não sintaxe
  return t.replace(/\\\\/g, '\\\\\\\\').replace(/\\*/g, '\\\\*').replace(/_/g, '\\\\_')
          .replace(/\\[/g, '\\\\[').replace(/\\]/g, '\\\\]').replace(/\\\`/g, '\\\\\\\`')
}

function inlineize(el) {                 // filhos inline -> markdown inline
  let s = ''
  for (const c of el.childNodes) {
    if (c.nodeType === 3) s += esc(c.nodeValue.replace(/[ \\t]+/g, ' '))
    else if (c.nodeType === 1 && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE') s += inlineEl(c)
  }
  return s
}

function inlineEl(el) {                  // um nó inline
  const tag = el.tagName.toLowerCase()
  switch (tag) {
    case 'strong': case 'b': return '**' + inlineize(el).trim() + '**'
    case 'em': case 'i': return '*' + inlineize(el).trim() + '*'
    case 's': case 'del': return '~~' + inlineize(el).trim() + '~~'
    case 'code': case 'kbd': return '\\\`' + el.textContent + '\\\`'
    case 'br': return '\\n'
    case 'a': {
      const h = (el.getAttribute('href') || '').trim()
      return h ? '[' + inlineize(el).trim() + '](' + h + ')' : inlineize(el)
    }
    case 'img': {
      const src = (el.getAttribute('src') || '').trim()
      return src ? '![' + (el.getAttribute('alt') || '') + '](' + src + ')' : ''
    }
    default: return inlineize(el)
  }
}

function emitBlock(el, out) {            // um bloco -> linha(s) markdown
  const tag = el.tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag)) {
    out.push('#'.repeat(+tag[1]) + ' ' + inlineize(el).trim())
  } else if (tag === 'p') {
    out.push(inlineize(el).trim())
  } else if (tag === 'pre') {
    out.push('\\\`\\\`\\\`\\n' + el.textContent.trim() + '\\n\\\`\\\`\\\`')
  } else if (tag === 'ul' || tag === 'ol') {
    out.push(renderList(el, 0))
  } else if (tag === 'blockquote') {
    const inner = []
    walk(el, inner)
    out.push(inner.map(b => b.split('\\n').map(l => '> ' + l).join('\\n')).join('\\n\\n'))
  } else if (tag === 'table') {
    out.push(renderTable(el))
  } else if (tag === 'hr') {
    out.push('---')
  } else {
    walk(el, out)                        // contêiner: desce na árvore
  }
}

function walk(el, out) {                 // junta inline até achar um bloco
  let pending = ''
  const flush = () => { const s = pending.trim().replace(/[ \\t]+/g, ' '); if (s) out.push(s); pending = '' }
for (const c of el.childNodes) {
      if (c.nodeType === 3) { pending += esc(c.nodeValue.replace(/[ \\t]+/g, ' ')); continue }
      if (c.nodeType !== 1) continue
      const tag = c.tagName.toLowerCase()
      if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') continue
      if (INLINE.has(tag)) { pending += inlineEl(c); continue }
      flush()
      emitBlock(c, out)
    }
  flush()
}

function renderList(el, depth) {         // aninha com 2 espaços por nível
  const isOl = el.tagName.toLowerCase() === 'ol'
  const start = parseInt(el.getAttribute('start'), 10) || 1
  let idx = 0
  const lines = []
  for (const li of el.children) {
    if (li.tagName.toLowerCase() !== 'li') continue
    let text = ''
    const nested = []
    for (const c of li.childNodes) {
if (c.nodeType === 3) text += esc(c.nodeValue.replace(/[ \\t]+/g, ' '))
    else if (c.nodeType === 1) {
      const t = c.tagName.toLowerCase()
      if (t === 'ul' || t === 'ol') nested.push(c)
      else if (t !== 'script' && t !== 'style' && t !== 'noscript') text += inlineEl(c)
    }
    }
    const marker = isOl ? (start + idx) + '. ' : '- '
    const clean = text.trim()
    lines.push('  '.repeat(depth) + (clean ? marker + clean : marker.trimEnd()))
    for (const n of nested) lines.push(renderList(n, depth + 1))
    idx++
  }
  return lines.join('\\n')
}

function renderTable(table) {            // GFM: | a | b | com linha ---
  const trs = [...table.querySelectorAll('tr')]
  if (!trs.length) return ''
  const cl = td => inlineize(td).replace(/[ \\t]+/g, ' ').trim().replace(/\\|/g, '\\\\|')
  const head = [...trs[0].children].map(cl)
  const body = trs.slice(1).map(tr => [...tr.children].map(cl))
  const joinRow = r => '| ' + r.join(' | ') + ' |'
  return [joinRow(head), '| ' + head.map(() => '---').join(' | ') + ' |', ...body.map(joinRow)].join('\\n')
}

export function htmlToMarkdown(html) {    // ponto de entrada: só DOM do browser
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const out = []
  walk(doc.body, out)
  return out.join('\\n\\n').replace(/\\n{3,}/g, '\\n\\n').trim()
}`

const SAMPLE_ARTICLE = `<!-- exemplo: post de blog -->
<h1>Guia rápido de deploy</h1>
<p>Um parágrafo com <strong>negrito</strong>, <em>itálico</em>, <code>código</code>
e um <a href="https://example.com/post" title="ver post">link clicável</a>.</p>
<h2>Passo a passo</h2>
<ol start="3">
  <li>Rodar o <code>build</code></li>
  <li>Reiniciar o serviço com <strong>systemd</strong></li>
  <li>Conferir o <a href="/status">health check</a></li>
</ol>
<img src="/img/deploy.png" alt="job de deploy concluído">
<p>Última linha, agora com<br>quebra dura.</p>`

const SAMPLE_TABLE = `<h2>Rodadas e dificuldade</h2>
<table>
  <thead>
    <tr><th>Rodada</th><th>Item</th><th>Problema</th></tr>
  </thead>
  <tbody>
    <tr><td>R1</td><td>JWT decoder</td><td>nenhum</td></tr>
    <tr><td>R2</td><td>conversor de timestamp</td><td>texto grande</td></tr>
    <tr><td>R3</td><td>regex tester</td><td>loop</td></tr>
  </tbody>
</table>
<ul>
  <li>rodar checagem</li>
  <li>abrir MR pra revisão
    <ul>
      <li>revisor 1</li>
      <li>revisor 2</li>
    </ul>
  </li>
</ul>`

const SAMPLE_QUOTE = `<blockquote>
  <p>Deploy só na sexta depois do almoço.</p>
  <p><em>Regra de ouro</em> do time.</p>
</blockquote>

<pre><code>npm install && npm test
git push origin main
</code></pre>

<p>E um separador logo abaixo:</p>
<hr>
<p>Fim.</p>`

const translations = {
  pt: {
    title: 'Conversor HTML → Markdown',
    intro: (
      <>
        Cola um trecho de HTML — artigo, e-mail renderizado, trecho do DevTools —
        e recebe o Markdown equivalente (sintaxe <Text code>GFM</Text>) pronto
        pra colar em PR, README, Notion ou chat de IA. Tudo client-side via{' '}
        <Text code>DOMParser</Text>, nada sai do navegador. Complementa o
        Markdown → HTML, que vai no outro sentido, e o HTML → JSX.
      </>
    ),
    placeholder: 'Cole o HTML aqui (pode ser um fragmento, sem <html>/<body>)...',
    sampleArticle: 'Artigo completo',
    sampleTable: 'Tabela + lista',
    sampleQuote: 'Citação + código',
    clear: 'Limpar',
    copy: 'Copiar',
    copied: 'Copiado!',
    outputLabel: 'Markdown gerado',
    empty: 'Cole um HTML pra começar.',
    lines: 'linhas',
    blocks: 'blocos',
    chars: 'caracteres',
    note: (
      <>
        O conversor usa o parser do navegador (DOMParser): HTML malformado é
        corrigido como o browser faria (tag sem fechamento fecha,{' '}
        <Text code>{'<script>'}</Text>/<Text code>{'<style>'}</Text> são
        descartados), então a saída reflete a árvore renderizada, não o texto
        exato digitado. A saída usa GFM — tabela <Text code>|---|</Text>, listas{' '}
        <Text code>-</Text> e negrito <Text code>**</Text> —; caracteres de
        marcação no texto (<Text code>*</Text>, <Text code>_</Text>,{' '}
        <Text code>`</Text>, <Text code>[</Text>) são escapados pra não virarem
        sintaxe, múltiplos espaços e <Text code>&amp;nbsp;</Text> colapsam num
        espaço só, e a tabela exige linha de cabeçalho separada por{' '}
        <Text code>---</Text> (alguns editores antigos não aceitam isso).
      </>
    ),
    sourceTitle: 'Como funciona',
    statLines: 'Linhas',
    statBlocks: 'Blocos',
    statChars: 'Caracteres',
  },
  en: {
    title: 'HTML → Markdown Converter',
    intro: (
      <>
        Paste an HTML snippet — article, rendered email, DevTools copy — and get
        the equivalent Markdown (GitHub Flavored syntax) ready to drop into a PR,
        README, Notion or an AI chat. All client-side via{' '}
        <Text code>DOMParser</Text>, nothing leaves the browser. Complements the
        Markdown → HTML converter, which goes the other way, and the HTML → JSX
        one.
      </>
    ),
    placeholder: 'Paste the HTML here (a fragment is fine, no <html>/<body> needed)',
    sampleArticle: 'Full article',
    sampleTable: 'Table + list',
    sampleQuote: 'Quote + code',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Copied!',
    outputLabel: 'Generated Markdown',
    empty: 'Paste some HTML to get started.',
    lines: 'lines',
    blocks: 'blocks',
    chars: 'characters',
    note: (
      <>
        The converter uses the browser parser (DOMParser): malformed HTML is
        repaired the way a browser would (unclosed tags get closed,{' '}
        <Text code>{'<script>'}</Text>/<Text code>{'<style>'}</Text> are
        dropped), so the output reflects the rendered tree, not the exact text
        you typed. The output uses GFM — <Text code>|---| ---</Text> tables,{' '}
        <Text code>-</Text> lists, <Text code>**</Text> bold —; markup characters
        in plain text (<Text code>*</Text>, <Text code>_</Text>,{' '}
        <Text code>`</Text>, <Text code>[</Text>) are escaped so they don't
        become syntax, multiple spaces and <Text code>&amp;nbsp;</Text> collapse
        to a single space, and tables need a header row separated by{' '}
        <Text code>---</Text> (older editors can't render them).
      </>
    ),
    sourceTitle: 'How it works',
    statCopy: 'Lines',
    statBlocks: 'Blocks',
    statChars: 'Characters',
  },
}

const INLINE = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'big', 'br', 'cite', 'code', 'data', 'del', 'dfn',
  'em', 'i', 'img', 'ins', 'kbd', 'label', 'mark', 'q', 's', 'samp', 'small', 'span',
  'strike', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'font',
])

function esc(t) {
  return t
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/`/g, '\\`')
    .replace(/\u00a0/g, ' ')
}

function inlineize(el) {
  let s = ''
  for (const child of el.childNodes) {
    if (child.nodeType === 3) {
      s += esc(child.nodeValue.replace(/[ \t]+/g, ' '))
    } else if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') continue
      s += inlineEl(child)
    }
  }
  return s
}

function inlineEl(el) {
  const tag = el.tagName.toLowerCase()
  switch (tag) {
    case 'strong':
    case 'b':
      return '**' + inlineize(el).trim() + '**'
    case 'em':
    case 'i':
      return '*' + inlineize(el).trim() + '*'
    case 's':
    case 'del':
    case 'strike':
      return '~~' + inlineize(el).trim() + '~~'
    case 'code':
    case 'kbd':
    case 'samp':
      return '`' + el.textContent + '`'
    case 'br':
      return '\n'
    case 'a': {
      const href = (el.getAttribute('href') || '').trim()
      const title = (el.getAttribute('title') || '').trim()
      if (!href) return inlineize(el)
      const text = inlineize(el).trim()
      const wrapped = /[)\s]/.test(href) ? '<' + href + '>' : href
      const right = wrapped + (title ? ' "' + title.replace(/"/g, '\\"') + '"' : '')
      return text ? '[' + text + '](' + right + ')' : href
    }
    case 'img': {
      const src = (el.getAttribute('src') || '').trim()
      if (!src) return ''
      const alt = (el.getAttribute('alt') || '').trim()
        .replace(/\\/g, '\\\\')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
      const title = (el.getAttribute('title') || '').trim()
      return '![' + alt + '](' + src + (title ? ' "' + title.replace(/"/g, '\\"') + '"' : '') + ')'
    }
    case 'sup':
      return '^' + inlineize(el).trim() + '^'
    case 'sub':
      return '~' + inlineize(el).trim() + '~'
    case 'mark':
      return '==' + inlineize(el).trim() + '=='
    default:
      return inlineize(el)
  }
}

function walk(el, out) {
  let pending = ''
  const flush = () => {
    const s = pending.trim().replace(/[ \t]+/g, ' ')
    if (s) out.push(s)
    pending = ''
  }
  for (const child of el.childNodes) {
    if (child.nodeType === 3) {
      pending += esc(child.nodeValue.replace(/[ \t]+/g, ' '))
      continue
    }
    if (child.nodeType !== 1) continue
    const tag = child.tagName.toLowerCase()
    if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template' || tag === 'svg') continue
    if (INLINE.has(tag)) {
      pending += inlineEl(child)
      continue
    }
    flush()
    emitBlock(child, out)
  }
  flush()
}

function emitBlock(el, out) {
  const tag = el.tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag)) {
    const text = inlineize(el).trim()
    if (text) out.push('#'.repeat(Number(tag[1])) + ' ' + text)
  } else if (tag === 'p') {
    const s = inlineize(el).replace(/[ \t]+/g, ' ').trim().replace(/\n/g, '  \n')
    if (s) out.push(s)
  } else if (tag === 'pre') {
    const code = el.textContent.replace(/^\n+|\n+$/g, '')
    if (code.trim()) out.push('```\n' + code + '\n```')
  } else if (tag === 'ul' || tag === 'ol') {
    const md = renderList(el, 0)
    if (md) out.push(md)
  } else if (tag === 'blockquote') {
    const inner = []
    walk(el, inner)
    if (inner.length) {
      out.push(inner.map((b) => b.split('\n').map((l) => '> ' + l).join('\n')).join('\n\n'))
    }
  } else if (tag === 'table') {
    const md = renderTable(el)
    if (md) out.push(md)
  } else if (tag === 'hr') {
    out.push('---')
  } else if (tag === 'li') {
    const md = renderList(el.parentElement, 0)
    if (md) out.push(md)
  } else if (tag === 'img') {
    const s = inlineEl(el)
    if (s) out.push(s)
  } else {
    walk(el, out)
  }
}

export function renderList(el, depth) {
  const isOl = el.tagName.toLowerCase() === 'ol'
  const start = parseInt(el.getAttribute('start'), 10) || 1
  let idx = 0
  const lines = []
  for (const li of el.children) {
    if (li.tagName.toLowerCase() !== 'li') continue
    let text = ''
    const nested = []
    for (const child of li.childNodes) {
      if (child.nodeType === 3) {
        text += esc(child.nodeValue.replace(/[ \t]+/g, ' '))
      } else if (child.nodeType === 1) {
        const t = child.tagName.toLowerCase()
        if (t === 'ul' || t === 'ol') nested.push(child)
        else if (t === 'script' || t === 'style' || t === 'noscript') continue
        else if (t === 'li') nested.push(child)
        else text += inlineEl(child)
      }
    }
    const clean = text.replace(/[ \t]+/g, ' ').trim().replace(/\n/g, ' ')
    const marker = isOl ? (start + idx) + '. ' : '- '
    const prefix = '  '.repeat(depth)
    lines.push(clean ? prefix + marker + clean : prefix + marker.trimEnd() || prefix)
    for (const n of nested) {
      // um <li> aninhado no meio do texto conta como sublista
      const list = n.tagName.toLowerCase() === 'li' ? n.parentElement : n
      const sub = renderList(list, depth + 1)
      if (sub) lines.push(sub)
    }
    idx++
  }
  return lines.join('\n')
}

function renderTable(table) {
  const trs = [...table.querySelectorAll('tr')]
  if (!trs.length) return ''
  const cell = (td) => inlineize(td).replace(/[ \t]+/g, ' ').trim().replace(/\|/g, '\\|').replace(/\n+/g, ' ')
  const head = [...trs[0].children].map(cell)
  const body = trs.slice(1).map((tr) => [...tr.children].map(cell))
  const joinRow = (r) => '| ' + r.join(' | ') + ' |'
  return [joinRow(head), '| ' + head.map(() => '---').join(' | ') + ' |', ...body.map(joinRow)].join('\n')
}

export function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const out = []
  walk(doc.body, out)
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

export default function HtmlToMarkdownPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) return null
    const md = htmlToMarkdown(trimmed)
    return {
      md,
      lines: md ? md.split('\n').length : 0,
      blocks: md ? md.trim().split(/\n{2,}/).length : 0,
      chars: md.length,
    }
  }, [input])

  function handleCopy() {
    if (!result || !result.md) return
    navigator.clipboard.writeText(result.md).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileMarkdownOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={9}
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
        <Space style={{ marginTop: 12 }} wrap>
          <Button onClick={() => setInput(SAMPLE_ARTICLE)}>{t.sampleArticle}</Button>
          <Button onClick={() => setInput(SAMPLE_TABLE)}>{t.sampleTable}</Button>
          <Button onClick={() => setInput(SAMPLE_QUOTE)}>{t.sampleQuote}</Button>
          <Button icon={<ClearOutlined />} disabled={!input} onClick={() => { setInput(''); setCopied(false) }}>
            {t.clear}
          </Button>
          <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} disabled={!result || !result.md} onClick={handleCopy}>
            {copied ? t.copied : t.copy}
          </Button>
        </Space>
      </Card>

      {result && result.md ? (
        <Card title={t.outputLabel}>
          <Space size={16} wrap style={{ marginBottom: 12 }}>
            <Text type="secondary">{t.statLines}: <Text strong>{result.lines}</Text></Text>
            <Text type="secondary">{t.statBlocks}: <Text strong>{result.blocks}</Text></Text>
            <Text type="secondary">{t.statChars}: <Text strong>{result.chars}</Text></Text>
          </Space>
          <pre style={{
            margin: 0,
            overflowX: 'auto',
            maxHeight: 420,
            overflowY: 'auto',
            background: '#f6f8fa',
            border: '1px solid #d3dce6',
            borderRadius: 6,
            padding: 12,
          }}>
            <code>{result.md}</code>
          </pre>
        </Card>
      ) : (
        !input.trim() && <Text type="secondary">{t.empty}</Text>
      )}

      <Alert type="info" message={t.note} showIcon />

      <Collapse
        items={[{ key: '1', label: t.sourceTitle, children: (
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{SNIPPET}</code>
          </pre>
        ) }]}
      />
    </Space>
  )
}