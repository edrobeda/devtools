import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Radio, Tag, List, Alert, Row, Col, Collapse, Button, message } from 'antd'
import { FileMarkdownOutlined, SearchOutlined, CopyOutlined, EyeOutlined, CodeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─────────────── Mini parser Markdown (subconjunto comum) ───────────────
// Renderiza o preview de cada elemento da página. Mesma família do parser do
// /tools/markdown-previewer, aqui com suporte extra a tabelas, headings
// Setext, riscado, task list e imagens.

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const ESCAPED = { '*': '&#42;', _: '&#95;', '#': '&#35;', '[': '&#91;', ']': '&#93;', '`': '&#96;', '~': '&#126;' }

function inlineFormat(raw) {
  let out = escapeHtml(raw)
  out = out.replace(/\\([#*_*`[\]~-])/g, (m, c) => ESCAPED[c] || m)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/!\[([^\]]*)\]\(([^\s)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%" />')
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  out = out.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return out
}

function parseTable(lines, start) {
  const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim())
  const header = splitRow(lines[start])
  const seps = splitRow(lines[start + 1])
  const alig = seps.map((s) => (s.startsWith(':') && s.endsWith(':') ? 'center' : (s.endsWith(':') ? 'right' : 'left')))
  let end = start + 2
  while (end < lines.length && lines[end].trim() !== '' && lines[end].includes('|')) end += 1
  const cell = (c, k, tag) => `${tag} style="border:1px solid #d9d9d9;padding:2px 8px;text-align:${alig[k] || 'left'}">${inlineFormat(c)}</${tag}>`
  let out = '<table style="border-collapse:collapse"><thead><tr>'
  out += header.map((h, k) => cell(h, k, 'th')).join('')
  out += '</tr></thead><tbody>'
  for (let r = start + 2; r < end; r += 1) {
    out += `<tr>${splitRow(lines[r]).map((c, k) => cell(c, k, 'td')).join('')}</tr>`
  }
  out += '</tbody></table>'
  return { html: out, next: end }
}

function isTableSep(l) {
  return /^\s*\|?[\s:|-]+-+[\s:|-]*\|?\s*$/.test(l) && l.includes('-')
}

function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const html = []
  let listBuffer = null
  let paragraphBuffer = []

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      html.push(`<p>${inlineFormat(paragraphBuffer.join(' '))}</p>`)
      paragraphBuffer = []
    }
  }

  const flushList = () => {
    if (!listBuffer) return
    const body = listBuffer.items
      .map((it) => {
        const box = it.checked === null ? '' : `<input type="checkbox" disabled ${it.checked ? 'checked' : ''} /> `
        const style = it.checked === null ? '' : 'list-style:none;'
        return `<li style="${style}">${box}${it.text}</li>`
      })
      .join('')
    html.push(`<${listBuffer.type}>${body}</${listBuffer.type}>`)
    listBuffer = null
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (/^```/.test(line)) {
      flushParagraph()
      flushList()
      const code = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i])
        i += 1
      }
      html.push(`<pre style="background:#f5f5f5;padding:8px;overflow:auto"><code>${escapeHtml(code.join('\n'))}</code></pre>`)
      i += 1
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      html.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`)
      i += 1
      continue
    }

    const setext = line.match(/^\s*(=+|-+)\s*$/)
    if (setext && paragraphBuffer.length) {
      const level = setext[1][0] === '=' ? 1 : 2
      const text = paragraphBuffer.join(' ')
      paragraphBuffer = []
      flushList()
      html.push(`<h${level}>${inlineFormat(text)}</h${level}>`)
      i += 1
      continue
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph()
      flushList()
      html.push('<hr style="border:none;border-top:1px solid #d9d9d9" />')
      i += 1
      continue
    }

    if (/^\s*>/.test(line)) {
      flushParagraph()
      flushList()
      const quote = []
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i += 1
      }
      html.push(`<blockquote style="border-left:3px solid #d9d9d9;margin:0;padding-left:8px;color:#595959">${inlineFormat(quote.join(' '))}</blockquote>`)
      continue
    }

    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushParagraph()
      flushList()
      const table = parseTable(lines, i)
      html.push(table.html)
      i = table.next
      continue
    }

    const ul = line.match(/^(\s*)[-*]\s+(.*)$/)
    const ol = line.match(/^(\s*)\d+\.\s+(.*)$/)
    if (ul || ol) {
      flushParagraph()
      const isOl = Boolean(ol)
      const text = (ol ? ol[2] : ul[2]).trim()
      if (!listBuffer || listBuffer.type !== (isOl ? 'ol' : 'ul')) {
        flushList()
        listBuffer = { type: isOl ? 'ol' : 'ul', items: [] }
      }
      const task = text.match(/^\[( |x|X)\]\s*(.*)$/)
      listBuffer.items.push({ text: task ? task[2] : text, checked: task ? task[1] : null })
      i += 1
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      i += 1
      continue
    }

    flushList()
    paragraphBuffer.push(line.trim())
    i += 1
  }

  flushParagraph()
  flushList()
  return html.join('\n')
}

// Imagem local (SVG embutido em base64) só pra exemplificar a sintaxe de
// imagem sem depender de nenhum recurso externo.
const IMG_B64 =
  'PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMjAnIGhlaWdodD0nNDAnPjxyZWN0' +
  'IHdpZHRoPScxMjAnIGhlaWdodD0nNDAnIHJ4PSc4JyBmaWxsPScjMTY3N2ZmJy8+PHRleHQgeD0nNjAnIHk9JzI2JyBm' +
  'b250LXNpemU9JzE0JyBmaWxsPScjZmZmJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyBmb250LWZhbWlseT0nc2Fucy1zZXJp' +
  'Zic+REVWIEJBU0U2NDwvdGV4dD48L3N2Zz4='

const CATS = {
  titles: { pt: 'Títulos', en: 'Headings' },
  format: { pt: 'Formatação', en: 'Formatting' },
  lists: { pt: 'Listas', en: 'Lists' },
  code: { pt: 'Código', en: 'Code' },
  links: { pt: 'Links & Imagens', en: 'Links & Images' },
  tables: { pt: 'Tabelas', en: 'Tables' },
  quote: { pt: 'Citações & extras', en: 'Quotes & extras' },
}

const CAT_COLOR = {
  titles: 'geekblue',
  format: 'purple',
  lists: 'green',
  code: 'cyan',
  links: 'blue',
  tables: 'orange',
  quote: 'magenta',
}

const ITEMS = [
  {
    cat: 'titles',
    name: { pt: 'Títulos (ATX)', en: 'Headings (ATX)' },
    sample: '# Título nível 1\n## Título nível 2\n### Título nível 3',
    pt: 'De um a seis `#` (H1 a H6). Um título que começa no nível mais alto costuma indicar que o texto virou documento demais.',
    en: 'One to six `#`s (H1 through H6). A section that needs the highest level is usually its own document.',
  },
  {
    cat: 'titles',
    name: { pt: 'Títulos alternativos (Setext)', en: 'Setext headings' },
    sample: 'Título nível 1\n===============\n\nTítulo nível 2\n---------------',
    pt: 'Variante com `=` ou `-` embaixo do texto — equivalente a H1 e H2 na maioria dos renderizadores.',
    en: 'Alternative using `=` or `-` under the line — equivalent to H1 and H2 in most renderers.',
  },
  {
    cat: 'format',
    name: { pt: 'Itálico', en: 'Italic' },
    sample: '*itálico* e _itálico também_',
    pt: 'Um `*` ou `_` de cada lado. Bom para termos técnicos, nomes de livros e ênfase leve.',
    en: 'One `*` or `_` on each side. Nice for technical terms, book titles and light emphasis.',
  },
  {
    cat: 'format',
    name: { pt: 'Negrito', en: 'Bold' },
    sample: '**negrito** e __negrito também__',
    pt: 'Dois `*` ou dois `_` de cada lado. Use para o ponto que precisa saltar aos olhos.',
    en: 'Two `*` or two `_` on each side. Use it for the takeaway you want to stand out.',
  },
  {
    cat: 'format',
    name: { pt: 'Negrito + itálico', en: 'Bold + italic' },
    sample: '***ambos ao mesmo tempo***',
    pt: 'Três `*` de cada lado combinam as duas ênfases. Com moderação — ênfase demais vira gritaria.',
    en: 'Three `*` on each side combine both. Use sparingly — over-emphasis is just shouting.',
  },
  {
    cat: 'format',
    name: { pt: 'Riscado', en: 'Strikethrough' },
    sample: '~~essa parte já foi~~',
    pt: 'Dois `~` de cada lado riscam o trecho. Popular para mostrar mudança de planos em changelogs e comentários.',
    en: 'Two `~` on each side strike the text through. Common in changelogs and comments to show a plan that changed.',
  },
  {
    cat: 'format',
    name: { pt: 'Código inline', en: 'Inline code' },
    sample: 'Rode `npm install` e depois `npm run build`.',
    pt: 'Um par de acentos graves destaca comandos, funções, caminhos e variáveis dentro do parágrafo.',
    en: 'Backticks mark commands, functions, paths and variables inside a sentence.',
  },
  {
    cat: 'format',
    name: { pt: 'Escape de caracteres', en: 'Escaping characters' },
    sample: '\\*não vira itálico\\* — \\# não vira título',
    pt: 'Uma barra invertida antes de um caractere especial faz ele aparecer literal, sem interpretação Markdown.',
    en: 'A backslash before a special character makes it literal, skipping Markdown interpretation.',
  },
  {
    cat: 'lists',
    name: { pt: 'Lista não ordenada', en: 'Unordered list' },
    sample: '- Backlog\n- Sprint em andamento\n- Review',
    pt: 'Itens marcados com `-`, `*` ou `+`. Use quando a ordem não importa.',
    en: 'Items marked with `-`, `*` or `+`. Use when the order does not matter.',
  },
  {
    cat: 'lists',
    name: { pt: 'Lista ordenada', en: 'Ordered list' },
    sample: '1. Aquecer o forno\n2. Misturar ingredientes\n3. Assar por 30 min',
    pt: 'Número seguido de ponto. Todos podem ser `1.` que a renderização re-numera sozinha — números explícitos ajudam quem lê o fonte.',
    en: 'Numbers followed by a dot. They can all be `1.` since the renderer re-counts; explicit numbers help the reader of the raw text.',
  },
  {
    cat: 'lists',
    name: { pt: 'Lista de tarefas', en: 'Task list' },
    sample: '- [ ] Abrir issue\n- [x] Revisar o diff\n- [ ] Adicionar testes',
    pt: 'Caixas de check com `[ ]` (pendente) e `[x]` (feito). Muito usada em PRs e READMEs para listar pendências.',
    en: 'Checkboxes with `[ ]` (todo) and `[x]` (done). A favorite in PRs and READMEs to track remaining work.',
  },
  {
    cat: 'code',
    name: { pt: 'Bloco de código', en: 'Code block (fence)' },
    sample: '```\nconst ola = function () {\n  return \'mundo\'\n}\n```',
    pt: 'Três crases abrem e fecham um bloco pré-formatado — sem destaque de sintaxe, bom para trechos genéricos.',
    en: 'Three backticks open and close a preformatted block with no highlighting. Good for generic snippets.',
  },
  {
    cat: 'code',
    name: { pt: 'Bloco de código com linguagem', en: 'Code block with language' },
    sample: '```js\nconst ola = () => "mundo"\nconsole.log(ola())\n```',
    pt: 'O nome da linguagem logo depois dos crases liga o destaque de sintaxe (js, python, bash, json, css...).',
    en: 'A language name right after the backticks turns on syntax highlighting (js, python, bash, json, css...).',
  },
  {
    cat: 'links',
    name: { pt: 'Link', en: 'Link' },
    sample: '[DevTools](https://devtools.eventifylab.com)',
    pt: '`[texto](url)` — a URL pode ser externa ou uma âncora do próprio documento (`#secao`, onde o renderizador suportar).',
    en: '`[text](url)` — the URL can be remote or a same-document anchor (`#section`) where the renderer supports it.',
  },
  {
    cat: 'links',
    name: { pt: 'Imagem', en: 'Image' },
    sample: `![Logo do DevTools](${IMG_B64})`,
    pt: 'Igual ao link, com `!` na frente. O texto entre colchetes vira o `alt` — usado por leitores de tela e quando a imagem não carrega.',
    en: 'Same as a link but with a leading `!`. The bracket text becomes the `alt` — used by screen readers and when the image cannot load.',
  },
  {
    cat: 'tables',
    name: { pt: 'Tabela', en: 'Table' },
    sample: '| Serviço | Porta | Protocolo |\n| :------ | ----: | :-------: |\n| HTTP    | 80    | TCP       |\n| Redis   | 6379  | TCP       |',
    pt: 'Cabeçalho, separador de `-` e linhas de dados. Dois pontos no separador escolhem o alinhamento da coluna (esquerda, direita, centro).',
    en: 'A header row, a `-` separator and data rows. Colons in the separator pick column alignment (left, right, center).',
  },
  {
    cat: 'quote',
    name: { pt: 'Citação', en: 'Blockquote' },
    sample: '> A melhor documentação\n> é a que foi escrita\n> pensando no leitor.\n\nTexto normal depois.',
    pt: 'O `>` no início de cada linha dá destaque a citações, notas e avisos.',
    en: 'A leading `>` highlights quoted text — citations, side notes and callouts.',
  },
  {
    cat: 'quote',
    name: { pt: 'Linha horizontal', en: 'Horizontal rule' },
    sample: 'Seção um\n\n---\n\nSeção dois',
    pt: 'Três `-` (ou `*` / `_`) numa linha própria separam seções graficamente.',
    en: 'Three `-` (or `*` / `_`) on their own line break the page between sections.',
  },
]

const translations = {
  pt: {
    title: 'Sintaxe Markdown',
    intro: (
      <>
        Cheat sheet pesquisável dos elementos de Markdown que você mais usa num
        dia de escrita — README, comentário de PR, documentação. Cada item mostra
        a sintaxe e o preview renderizado ao lado. É o subconjunto mais comum
        (GitHub Flavored), não o CommonMark inteiro; pra renderizar um texto seu
        inteiro, use o <Text code>markdown-previewer</Text>.
      </>
    ),
    search: 'Buscar por nome, descrição ou sintaxe...',
    all: 'Todos',
    empty: 'Nenhum elemento encontrado pra essa busca ou categoria.',
    syntaxLabel: 'Sintaxe',
    previewLabel: 'Preview renderizado',
    copy: 'Copiar exemplo',
    copied: 'Exemplo copiado',
    copyFailed: 'Não foi possível copiar',
    itemsCount: (n) => `${n} ${n === 1 ? 'elemento' : 'elementos'}`,
    alertTitle: 'Flavors of Markdown',
    alertBody: (
      <>
        Não existe um único Markdown: <Text code>CommonMark</Text> é a base, e
        o <Text code>GitHub Flavored Markdown</Text> adiciona tabelas, task
        lists e riscado. A página usa o subconjunto mais aceito — o que
        renderiza bem no GitHub, GitLab, Bitbucket e na maioria dos previews.
      </>
    ),
    sourceTitle: 'O parser usado nesses previews (fonte exibida)',
  },
  en: {
    title: 'Markdown Syntax',
    intro: (
      <>
        A searchable cheat sheet for the Markdown you type every day — PR
        comments, docs, READMEs. Each element shows the raw syntax next to its
        rendered preview. It covers the common (GitHub-flavored) subset, not
        full CommonMark; to render a whole text of yours, use the{' '}
        <Text code>markdown-previewer</Text> tool.
      </>
    ),
    search: 'Search by name, syntax or description...',
    all: 'All',
    empty: 'No matching element for this search or category.',
    syntaxLabel: 'Syntax',
    previewLabel: 'Rendered preview',
    copy: 'Copy sample',
    copied: 'Sample copied',
    copyFailed: 'Could not copy',
    itemsCount: (n) => `${n} ${n === 1 ? 'element' : 'elements'}`,
    alertTitle: 'Markdown flavors',
    alertBody: (
      <>
        There is not a single Markdown — <Text code>CommonMark</Text> is the
        core spec, and GitHub uses a flavor (GFM) that adds tables, task lists
        and strikethrough. This page sticks to the most portable subset: what
        renders well on GitHub, READMEs and most wikis.
      </>
    ),
    sourceTitle: 'The parser used for these previews (source shown)',
  },
}

export default function MarkdownSyntaxPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, contextHolder] = message.useMessage()

  const withHtml = useMemo(
    () => ITEMS.map((it) => ({ ...it, html: markdownToHtml(it.sample) })),
    []
  )

  const filtered = useMemo(() => withHtml.filter((it) => {
    if (category !== 'all' && it.cat !== category) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      it.name.pt.toLowerCase().includes(q) ||
      it.name.en.toLowerCase().includes(q) ||
      it.pt.toLowerCase().includes(q) ||
      it.en.toLowerCase().includes(q) ||
      it.sample.toLowerCase().includes(q)
    )
  }), [query, category, withHtml])

  const copySample = async (sample) => {
    try {
      await navigator.clipboard.writeText(sample)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyFailed)
    }
  }

  const parserSource = useMemo(
    () => [inlineFormat, parseTable, isTableSep, markdownToHtml].map((f) => f.toString()).join('\n\n'),
    []
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2}><FileMarkdownOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {Object.keys(CATS).map((cat) => (
            <Radio.Button key={cat} value={cat}>{CATS[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Text type="secondary">{t.itemsCount(filtered.length)}</Text>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={filtered}
        locale={{ emptyText: t.empty }}
        renderItem={(item) => (
          <List.Item>
            <Card size="small">
              <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 }}>
                <Space wrap>
                  <Text strong>{item.name[lang]}</Text>
                  <Tag color={CAT_COLOR[item.cat]}>{CATS[item.cat][lang]}</Tag>
                </Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copySample(item.sample)}>
                  {t.copy}
                </Button>
              </Space>
              <Row gutter={16}>
                <Col xs={24} md={11}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary"><CodeOutlined /> {t.syntaxLabel}</Text>
                    <pre style={{ margin: 0, background: '#fafafa', padding: 8, borderRadius: 6, overflowX: 'auto', fontSize: 12 }}>
                      <code>{item.sample}</code>
                    </pre>
                  </Space>
                </Col>
                <Col xs={24} md={13}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary"><EyeOutlined /> {t.previewLabel}</Text>
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '8px 12px', minHeight: 40 }}>
                      <div dangerouslySetInnerHTML={{ __html: item.html }} />
                    </div>
                  </Space>
                </Col>
              </Row>
              <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                {item[lang]}
              </Paragraph>
            </Card>
          </List.Item>
        )}
      />

      <Collapse
        items={[{
          key: 'source',
          label: (
            <Space>
              <CodeOutlined />
              {t.sourceTitle}
            </Space>
          ),
          children: (
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
              <code>{parserSource}</code>
            </pre>
          ),
        }]}
      />
    </Space>
  )
}