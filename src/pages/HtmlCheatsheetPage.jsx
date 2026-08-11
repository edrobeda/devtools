import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['doc', 'section', 'group', 'text', 'media', 'table', 'form', 'interactive']

const CATEGORY_COLOR = {
  doc: 'blue',
  section: 'green',
  group: 'cyan',
  text: 'purple',
  media: 'magenta',
  table: 'gold',
  form: 'orange',
  interactive: 'red',
}

const labelOf = {
  doc: { pt: 'Documento & metadados', en: 'Document & metadata' },
  section: { pt: 'Seções & estrutura', en: 'Sections & structure' },
  group: { pt: 'Agrupamento de conteúdo', en: 'Content grouping' },
  text: { pt: 'Texto & semântica inline', en: 'Text & inline semantics' },
  media: { pt: 'Mídia & incorporação', en: 'Media & embedded' },
  table: { pt: 'Tabelas', en: 'Tables' },
  form: { pt: 'Formulários', en: 'Forms' },
  interactive: { pt: 'Interativos', en: 'Interactive' },
}

// Elementos void: não têm tag de fechamento e nunca podem conter conteúdo.
const VOID_TAGS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']

const ELEMENTS = [
  // ─── Documento & metadados ─────────────────────────────────────────────────
  { tag: 'html', cat: 'doc', pt: 'A raiz do documento — envolve tudo e carrega o atributo lang (idioma da página)', en: 'The document root — wraps everything and carries the lang attribute (page language)' },
  { tag: 'head', cat: 'doc', pt: 'Metadados do documento, invisíveis ao usuário: título, CSS, meta tags', en: 'Document metadata, invisible to the user: title, CSS, meta tags' },
  { tag: 'body', cat: 'doc', pt: 'O conteúdo visível da página — tudo que o usuário enxerga', en: 'The visible page content — everything the user sees' },
  { tag: 'title', cat: 'doc', pt: 'Título mostrado na aba do navegador e nos resultados de busca', en: 'Title shown in the browser tab and search results' },
  { tag: 'meta', cat: 'doc', pt: 'Metadados declarativos: charset, viewport, description, Open Graph', en: 'Declarative metadata: charset, viewport, description, Open Graph' },
  { tag: 'link', cat: 'doc', pt: 'Conecta recursos externos — CSS, favicon, preload, manifest', en: 'Links external resources — CSS, favicon, preload, manifest' },
  { tag: 'base', cat: 'doc', pt: 'Define a URL base para todos os links relativos do documento', en: 'Sets the base URL for every relative link in the document' },
  { tag: 'style', cat: 'doc', pt: 'CSS embutido direto no documento (prefira <link> pra reaproveitar)', en: 'Inline CSS right in the document (prefer <link> for reuse)' },
  { tag: 'script', cat: 'doc', pt: 'JavaScript embutido ou externo; async/defer controlam quando executa', en: 'Inline or external JavaScript; async/defer control when it runs' },
  { tag: 'noscript', cat: 'doc', pt: 'Conteúdo de fallback exibido quando o JavaScript está desabilitado', en: 'Fallback content shown when JavaScript is disabled' },

  // ─── Seções & estrutura ────────────────────────────────────────────────────
  { tag: 'header', cat: 'section', pt: 'Cabeçalho da página ou de uma seção — logo, título, navegação', en: 'Page or section header — logo, heading, navigation' },
  { tag: 'nav', cat: 'section', pt: 'Bloco de navegação com links principais', en: 'A block of primary navigation links' },
  { tag: 'main', cat: 'section', pt: 'O conteúdo principal — deve haver apenas um por página', en: 'The main content — there should be only one per page' },
  { tag: 'section', cat: 'section', pt: 'Agrupamento temático de conteúdo, normalmente com um heading', en: 'Thematic grouping of content, usually with a heading' },
  { tag: 'article', cat: 'section', pt: 'Conteúdo autônomo e reutilizável: post, card, comentário, notícia', en: 'Self-contained, reusable content: post, card, comment, article' },
  { tag: 'aside', cat: 'section', pt: 'Conteúdo complementar ao principal — sidebar, notas, propaganda', en: 'Content complementary to the main flow — sidebar, notes, ads' },
  { tag: 'footer', cat: 'section', pt: 'Rodapé da página ou seção — copyright, contatos, links secundários', en: 'Page or section footer — copyright, contacts, secondary links' },
  { tag: 'h1–h6', cat: 'section', pt: 'Títulos hierárquicos: h1 único por página, depois h2, h3... em níveis', en: 'Heading levels: one h1 per page, then h2, h3... down the tree' },
  { tag: 'address', cat: 'section', pt: 'Informações de contato do autor ou da página', en: 'Contact information of the author or page' },

  // ─── Agrupamento de conteúdo ───────────────────────────────────────────────
  { tag: 'div', cat: 'group', pt: 'Contêiner genérico de bloco — sem significado semântico próprio', en: 'Generic block container — carries no semantic meaning' },
  { tag: 'p', cat: 'group', pt: 'Parágrafo de texto corrido', en: 'A paragraph of running text' },
  { tag: 'hr', cat: 'group', pt: 'Quebra temática — a linha horizontal que separa assuntos', en: 'Thematic break — the horizontal rule separating topics' },
  { tag: 'pre', cat: 'group', pt: 'Texto pré-formatado: espaços e quebras são preservados (código)', en: 'Preformatted text: whitespace and line breaks are kept (code)' },
  { tag: 'blockquote', cat: 'group', pt: 'Citação longa em bloco separado do texto principal', en: 'A long quotation set apart from the main text' },
  { tag: 'ol', cat: 'group', pt: 'Lista ordenada — itens numerados; start/reversed controlam a numeração', en: 'Ordered list — numbered items; start/reversed control the numbering' },
  { tag: 'ul', cat: 'group', pt: 'Lista não ordenada — itens com marcador', en: 'Unordered list — items with a bullet marker' },
  { tag: 'li', cat: 'group', pt: 'Item de lista — filho direto de ol/ul/menu', en: 'List item — direct child of ol/ul/menu' },
  { tag: 'dl', cat: 'group', pt: 'Lista de descrição: pares de termo (dt) e definição (dd)', en: 'Description list: pairs of term (dt) and definition (dd)' },
  { tag: 'dt', cat: 'group', pt: 'Termo dentro de uma lista de descrição', en: 'Term inside a description list' },
  { tag: 'dd', cat: 'group', pt: 'Definição/descrição do termo em uma lista de descrição', en: 'Definition/description of the term in a description list' },
  { tag: 'figure', cat: 'group', pt: 'Conteúdo ilustrativo autônomo — imagem, gráfico, diagrama — com figcaption', en: 'Self-contained illustrative content — image, chart, diagram — with figcaption' },
  { tag: 'figcaption', cat: 'group', pt: 'Legenda de uma figura; primeiro ou último filho de figure', en: 'Caption of a figure; first or last child of figure' },
  { tag: 'menu', cat: 'group', pt: 'Lista de comandos/ações — variação mais semântica de ul', en: 'List of commands/actions — a more semantic ul variant' },

  // ─── Texto & semântica inline ──────────────────────────────────────────────
  { tag: 'a', cat: 'text', pt: 'Âncora: o link. href aponta o destino; download força download', en: 'The anchor: the link. href points to the destination; download forces a download' },
  { tag: 'em', cat: 'text', pt: 'Ênfase — voz com stress; renderizado itálico', en: 'Emphasis — stressed voice; rendered italic' },
  { tag: 'strong', cat: 'text', pt: 'Importância forte — renderizado negrito', en: 'Strong importance — rendered bold' },
  { tag: 'small', cat: 'text', pt: 'Letras miúdas: avisos legais, disclaimers, direitos autorais', en: 'Small print: legalese, disclaimers, copyrights' },
  { tag: 's', cat: 'text', pt: 'Conteúdo não mais correto/relevante — renderizado riscado', en: 'Content no longer accurate/relevant — rendered strikethrough' },
  { tag: 'cite', cat: 'text', pt: 'Título de uma obra citada — livro, filme, artigo', en: 'Title of a cited work — book, movie, article' },
  { tag: 'q', cat: 'text', pt: 'Citação curta inline; o navegador insere as aspas', en: 'Short inline quotation; the browser adds the quotes' },
  { tag: 'dfn', cat: 'text', pt: 'Termo que está sendo definido no contexto', en: 'The term currently being defined in context' },
  { tag: 'abbr', cat: 'text', pt: 'Abreviação/sigla; title expande o significado no hover', en: 'Abbreviation/acronym; title expands the meaning on hover' },
  { tag: 'time', cat: 'text', pt: 'Data/hora com datetime legível por máquina (ISO 8601)', en: 'Date/time with a machine-readable datetime (ISO 8601)' },
  { tag: 'code', cat: 'text', pt: 'Trecho de código inline', en: 'An inline code fragment' },
  { tag: 'var', cat: 'text', pt: 'Variável em código ou expressão matemática', en: 'A variable in code or a math expression' },
  { tag: 'samp', cat: 'text', pt: 'Saída de um programa — ex.: resultado de um comando', en: 'Program output — e.g. the result of a command' },
  { tag: 'kbd', cat: 'text', pt: 'Entrada de teclado — a tecla ou o atalho a pressionar', en: 'Keyboard input — the key or shortcut to press' },
  { tag: 'sub', cat: 'text', pt: 'Subscrito — fórmulas, notação química, índices', en: 'Subscript — formulas, chemical notation, indices' },
  { tag: 'sup', cat: 'text', pt: 'Sobrescrito — expoentes, notas de rodapé', en: 'Superscript — exponents, footnotes' },
  { tag: 'i', cat: 'text', pt: 'Texto em voz/idioma alternativo — termos técnicos, nomes científicos', en: 'Text in an alternate voice/tongue — technical terms, scientific names' },
  { tag: 'b', cat: 'text', pt: 'Atenção sem ênfase extra — palavras-chave, nomes de produto', en: 'Attention without extra emphasis — keywords, product names' },
  { tag: 'u', cat: 'text', pt: 'Anotação não textual — tipicamente sublinhado (ex.: erro ortográfico)', en: 'Non-textual annotation — typically underlined (e.g. spelling error)' },
  { tag: 'mark', cat: 'text', pt: 'Texto destacado/marcado — como um marcador de texto', en: 'Highlighted/marked text — like a highlighter pen' },
  { tag: 'ruby', cat: 'text', pt: 'Anotação ruby (ex.: furigana em japonês) com rt/rp', en: 'Ruby annotation (e.g. furigana in Japanese) with rt/rp' },
  { tag: 'bdi', cat: 'text', pt: 'Isola texto com direção própria (ex.: nome em árabe no meio de texto LTR)', en: 'Isolates text with its own direction (e.g. an Arabic name amid LTR text)' },
  { tag: 'bdo', cat: 'text', pt: 'Força a direção do texto com o atributo dir (rtl/ltr)', en: 'Forces text direction with the dir attribute (rtl/ltr)' },
  { tag: 'span', cat: 'text', pt: 'Contêiner inline genérico — para estilizar/segmentar trechos', en: 'Generic inline container — for styling/segmenting snippets' },
  { tag: 'br', cat: 'text', pt: 'Quebra de linha forçada — para poesia/endereços, não para espaçamento', en: 'Forced line break — for poetry/addresses, not for spacing' },
  { tag: 'wbr', cat: 'text', pt: 'Ponto onde a linha PODE quebrar se precisar (URLs longas)', en: 'An optional line-break opportunity (long URLs)' },

  // ─── Mídia & incorporação ──────────────────────────────────────────────────
  { tag: 'img', cat: 'media', pt: 'Imagem; alt é obrigatório (acessibilidade) — src e srcset definem a origem', en: 'An image; alt is required (accessibility) — src and srcset define the source' },
  { tag: 'picture', cat: 'media', pt: 'Imagem responsiva: várias <source> + um <img> de fallback', en: 'Responsive image: multiple <source> + one fallback <img>' },
  { tag: 'source', cat: 'media', pt: 'Fonte alternativa para picture/video/audio — media e srcset decidem', en: 'Alternative source for picture/video/audio — media and srcset decide' },
  { tag: 'audio', cat: 'media', pt: 'Áudio reproduzível com controles; source/track são filhos', en: 'Playable audio with controls; source/track are children' },
  { tag: 'video', cat: 'media', pt: 'Vídeo com controles; poster é a miniatura antes de dar play', en: 'Video with controls; poster is the thumbnail before play' },
  { tag: 'track', cat: 'media', pt: 'Trilha de legenda/subtítulo para video/audio (WebVTT)', en: 'Caption/subtitle track for video/audio (WebVTT)' },
  { tag: 'iframe', cat: 'media', pt: 'Frame que embute outra página — sandbox e allow limitam os poderes', en: 'Frame embedding another page — sandbox and allow limit its powers' },
  { tag: 'embed', cat: 'media', pt: 'Integra conteúdo externo/plugin via src e type', en: 'Embeds external/plugin content via src and type' },
  { tag: 'object', cat: 'media', pt: 'Recurso externo genérico (PDF, imagem, app) — data e type', en: 'Generic external resource (PDF, image, app) — data and type' },
  { tag: 'param', cat: 'media', pt: 'Parâmetro de configuração de um <object> (raro hoje)', en: 'Configuration parameter for an <object> (rare today)' },
  { tag: 'map', cat: 'media', pt: 'Mapa de imagem clicável — define áreas sobre uma imagem', en: 'Clickable image map — defines areas over an image' },
  { tag: 'area', cat: 'media', pt: 'Área clicável dentro de um mapa (retângulo, círculo, polígono)', en: 'Clickable area within a map (rectangle, circle, polygon)' },
  { tag: 'canvas', cat: 'media', pt: 'Área de desenho 2D/3D via JavaScript — WebGL e gráficos', en: '2D/3D drawing surface via JavaScript — WebGL and graphics' },

  // ─── Tabelas ───────────────────────────────────────────────────────────────
  { tag: 'table', cat: 'table', pt: 'Tabela de dados — nunca use para layout', en: 'A data table — never use for layout' },
  { tag: 'caption', cat: 'table', pt: 'Título/legenda da tabela, logo após o <table>', en: 'Table title/caption, right after <table>' },
  { tag: 'colgroup', cat: 'table', pt: 'Agrupa colunas para aplicar estilos/atributos em bloco', en: 'Groups columns to apply styles/attributes in bulk' },
  { tag: 'col', cat: 'table', pt: 'Representa uma coluna dentro de colgroup — span cobre várias', en: 'Represents one column inside colgroup — span covers several' },
  { tag: 'thead', cat: 'table', pt: 'Bloco de cabeçalho da tabela — linhas de título', en: 'Table header block — the title rows' },
  { tag: 'tbody', cat: 'table', pt: 'Bloco de corpo da tabela — as linhas de dados', en: 'Table body block — the data rows' },
  { tag: 'tfoot', cat: 'table', pt: 'Bloco de rodapé da tabela — totais, resumos', en: 'Table footer block — totals, summaries' },
  { tag: 'tr', cat: 'table', pt: 'Linha da tabela — contém th ou td', en: 'Table row — contains th or td' },
  { tag: 'th', cat: 'table', pt: 'Célula de cabeçalho — scope define se é de coluna ou linha', en: 'Header cell — scope defines column or row header' },
  { tag: 'td', cat: 'table', pt: 'Célula de dados; colspan/rowspan mesclam células', en: 'Data cell; colspan/rowspan merge cells' },

  // ─── Formulários ───────────────────────────────────────────────────────────
  { tag: 'form', cat: 'form', pt: 'Formulário — action/method definem o envio; onsubmit intercepta no JS', en: 'The form — action/method define submission; onsubmit intercepts in JS' },
  { tag: 'label', cat: 'form', pt: 'Rótulo de um controle — clicar nele foca o campo vinculado (for)', en: 'Control label — clicking it focuses the linked field (for)' },
  { tag: 'input', cat: 'form', pt: 'Campo de entrada com dezenas de types: text, number, date, checkbox...', en: 'Input field with dozens of types: text, number, date, checkbox...' },
  { tag: 'button', cat: 'form', pt: 'Botão — type submit (padrão), button ou reset', en: 'Button — type submit (default), button, or reset' },
  { tag: 'select', cat: 'form', pt: 'Menu suspenso com opções; multiple permite várias escolhas', en: 'Dropdown menu with options; multiple allows several choices' },
  { tag: 'optgroup', cat: 'form', pt: 'Agrupa opções de um select com um rótulo', en: 'Groups options of a select with a label' },
  { tag: 'option', cat: 'form', pt: 'Uma opção de select — value é o que vai no submit', en: 'One option of a select — value is what gets submitted' },
  { tag: 'textarea', cat: 'form', pt: 'Campo de texto multilinha; rows/cols controlam o tamanho', en: 'Multi-line text field; rows/cols control its size' },
  { tag: 'output', cat: 'form', pt: 'Resultado de um cálculo/script, normalmente associado via for', en: 'Result of a calculation/script, usually linked via for' },
  { tag: 'progress', cat: 'form', pt: 'Barra de progresso indeterminada ou com value/max', en: 'Progress bar — indeterminate or with value/max' },
  { tag: 'meter', cat: 'form', pt: 'Medidor de valor numa faixa (uso de disco, nota) — value/min/max', en: 'Scalar gauge within a range (disk usage, score) — value/min/max' },
  { tag: 'fieldset', cat: 'form', pt: 'Agrupa controles relacionados; disabled desabilita o grupo inteiro', en: 'Groups related controls; disabled disables the whole group' },
  { tag: 'legend', cat: 'form', pt: 'Legenda de um fieldset — o título visível do grupo', en: 'Legend of a fieldset — the group’s visible title' },
  { tag: 'datalist', cat: 'form', pt: 'Sugestões para um input com list="id" — autocomplete customizado', en: 'Suggestions for an input with list="id" — custom autocomplete' },

  // ─── Interativos ───────────────────────────────────────────────────────────
  { tag: 'details', cat: 'interactive', pt: 'Painel colapsável — abrir/fechar sem JS; open mostra aberto', en: 'Collapsible panel — open/close without JS; open shows it expanded' },
  { tag: 'summary', cat: 'interactive', pt: 'Título clicável do details — o que aparece no fechado', en: 'Clickable title of details — what shows while collapsed' },
  { tag: 'dialog', cat: 'interactive', pt: 'Caixa de diálogo/modal — showModal() cria o overlay', en: 'Dialog/modal box — showModal() creates the overlay' },
  { tag: 'template', cat: 'interactive', pt: 'Marca conteúdo clonável pelo JS — não renderiza sozinho', en: 'Marks clonable content for JS — does not render on its own' },
  { tag: 'slot', cat: 'interactive', pt: 'Ponto de injeção de conteúdo em web components', en: 'Content injection point in web components' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Elementos HTML',
    intro: (
      <>
        Referência pesquisável dos elementos <Text code>HTML</Text> do dia a
        dia, agrupados por função — a linguagem de marcação em que todo site
        é construído. Cada entrada tem o nome da tag, a categoria (Tag
        colorida), o que ela faz e quando usar; as void (sem fechamento)
        recebem o selo <Text code>void</Text>. Complementa o{' '}
        <Text code>/references/markdown-syntax</Text> (que documenta
        Markdown, não HTML) e os formatadores/conversores de{' '}
        <Text code>html-formatter</Text>/<Text code>html-to-jsx</Text> — é o
        primeiro item que cataloga os elementos em si.
      </>
    ),
    search: 'Buscar tag ou descrição...',
    all: 'Todos',
    empty: 'Nenhum elemento encontrado. Tente outra busca ou categoria.',
    voidTag: 'void',
    tipTitle: 'O essencial do HTML',
    tipBody: (
      <>
        Todo elemento HTML tem uma função: <Text code>&lt;div&gt;</Text> é o
        contêiner sem semântica, enquanto{' '}
        <Text code>&lt;main&gt;</Text>/<Text code>&lt;nav&gt;</Text>/
        <Text code>&lt;article&gt;</Text> comunicam a estrutura ao leitor de
        tela e aos buscadores. Elementos <Text code>void</Text> (img, br, hr,
        input, meta, link...) nunca têm tag de fechamento — o{' '}
        <Text code>/</Text> em <Text code>&lt;br /&gt;</Text> é opcional e
        ignorado. Os headings seguem hierarquia: UM{' '}
        <Text code>&lt;h1&gt;</Text> por página e os demais em ordem
        decrescente. E nada de <Text code>&lt;div&gt;</Text> para tudo:{' '}
        <Text code>&lt;section&gt;</Text>, <Text code>&lt;ul&gt;</Text> e{' '}
        <Text code>&lt;table&gt;</Text> existem exatamente para isso.
      </>
    ),
    resultsOne: 'elemento encontrado',
    resultsMany: 'elementos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'HTML Elements Cheat Sheet',
    intro: (
      <>
        A searchable reference of everyday <Text code>HTML</Text> elements,
        grouped by purpose — the markup language every site is built on.
        Each entry has the tag name, its category (colored Tag), what it does
        and when to use it; the void ones (no closing tag) get a{' '}
        <Text code>void</Text> badge. It complements{' '}
        <Text code>/references/markdown-syntax</Text> (which documents
        Markdown, not HTML) and the{' '}
        <Text code>html-formatter</Text>/<Text code>html-to-jsx</Text>{' '}
        converters — it's the first item that catalogs the elements
        themselves.
      </>
    ),
    search: 'Search tag or description...',
    all: 'All',
    empty: 'No element found. Try a different search or category.',
    voidTag: 'void',
    tipTitle: 'The HTML essentials',
    tipBody: (
      <>
        Every HTML element has a job: <Text code>&lt;div&gt;</Text> is the
        semantics-free container, while{' '}
        <Text code>&lt;main&gt;</Text>/<Text code>&lt;nav&gt;</Text>/
        <Text code>&lt;article&gt;</Text> communicate structure to screen
        readers and search engines. <Text code>Void</Text> elements (img, br,
        hr, input, meta, link...) never have a closing tag — the{' '}
        <Text code>/</Text> in <Text code>&lt;br /&gt;</Text> is optional and
        ignored. Headings follow hierarchy: ONE{' '}
        <Text code>&lt;h1&gt;</Text> per page and the rest in descending
        order. And don't reach for <Text code>&lt;div&gt;</Text> for
        everything: <Text code>&lt;section&gt;</Text>,{' '}
        <Text code>&lt;ul&gt;</Text> and <Text code>&lt;table&gt;</Text>{' '}
        exist precisely for that.
      </>
    ),
    resultsOne: 'element found',
    resultsMany: 'elements found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function HtmlCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ELEMENTS.filter((el) => {
      if (category !== 'all' && el.cat !== category) return false
      if (!q) return true
      return (
        el.tag.toLowerCase().includes(q) ||
        (el[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Tag | Categoria | Descrição |\n|---|---|---|\n'
    const rows = filtered.map((el) =>
      `| \`<${el.tag}>\` | ${labelOf[el.cat][lang]} | ${(el[lang] || '').replace(/\|/g, '\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CodeOutlined />} message={t.tipTitle} description={t.tipBody} />

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
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.tag}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{`<${item.tag}>`}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  {VOID_TAGS.includes(item.tag) && <Tag>{t.voidTag}</Tag>}
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(`<${item.tag}>`)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
