import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Collapse,
  Table,
  Tag,
  message,
} from 'antd'
import {
  SelectOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const HIGHLIGHT_CLASS = '__devtools-selector-match'

const SOURCE_SNIPPET = `// 1. Renderiza o HTML num <iframe srcDoc={html} sandbox="allow-same-origin">.
//    O sandbox impede scripts do usuário de rodarem, mas mantém
//    same-origin pra podermos ler contentDocument.querySelectorAll.
//
// 2. Valida o seletor com document.querySelectorAll(selector).
//    Seletor inválido vira DOMException → mostramos erro amigável.
//
// 3. Para cada elemento casado, montamos um resumo:
//    tagName, id, classes, texto e caminho simplificado.
//
// 4. Destacamos os matches injetando uma classe CSS no iframe
//    (outline vermelho) sem alterar o texto-fonte do usuário.`

const EXAMPLE_SIMPLE = `<nav>
  <a href="/">Home</a>
  <a href="/about" class="active">About</a>
  <a href="/contact">Contact</a>
</nav>

<article class="card featured">
  <h2>Título</h2>
  <p>Primeiro parágrafo.</p>
  <p>Segundo parágrafo.</p>
</article>

<form>
  <input type="text" name="user" required />
  <input type="email" name="email" />
  <button type="submit">Enviar</button>
</form>`

const EXAMPLE_PSEUDO = `<ul class="list">
  <li>Item 1</li>
  <li>Item 2</li>
  <li class="highlight">Item 3</li>
  <li>Item 4</li>
</ul>`

const EXAMPLE_ATTR = `<div data-status="open">Aberto</div>
<div data-status="closed">Fechado</div>
<a href="https://example.com" target="_blank">Externo</a>
<a href="/internal">Interno</a>`

const EXAMPLE_COMBINATORS = `<section>
  <h1>Título direto</h1>
  <div>
    <h1>Título aninhado</h1>
  </div>
  <p>Parágrafo irmão</p>
  <p>Outro irmão</p>
</section>`

const translations = {
  pt: {
    title: 'Testador de Seletores CSS',
    intro: (
      <>
        Digite um seletor CSS e veja quais elementos de um trecho de HTML
        correspondem em tempo real. O preview roda num iframe sandbox isolado,
        então nada executa fora do navegador — é tudo client-side.
      </>
    ),
    selectorLabel: 'Seletor CSS',
    selectorPlaceholder: 'Ex.: .card > p:first-child',
    htmlLabel: 'HTML de teste',
    htmlPlaceholder: 'Cole ou digite um trecho de HTML aqui...',
    examples: 'Exemplos',
    simple: 'Seletores comuns',
    pseudo: 'Pseudo-classes',
    attr: 'Atributos',
    combinators: 'Combinadores',
    clear: 'Limpar',
    previewTitle: 'Preview ao vivo',
    matchesTitle: 'Elementos encontrados',
    noMatches: 'Nenhum elemento corresponde ao seletor.',
    invalid: 'Seletor inválido — revise a sintaxe.',
    copySelector: 'Copiar seletor',
    copied: 'Copiado!',
    copyError: 'Erro ao copiar',
    resultCount: (n) => `${n} ${n === 1 ? 'match' : 'matches'}`,
    colIndex: '#',
    colElement: 'Elemento',
    colId: 'ID',
    colClasses: 'Classes',
    colText: 'Texto',
    colPath: 'Caminho',
    alertTitle: 'Pegadinhas de querySelector',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            Pseudo-elementos (<Text code>::before</Text>,{' '}
            <Text code>::after</Text>, <Text code>::selection</Text>) NÃO podem
            ser selecionados via <Text code>querySelectorAll</Text> — eles não
            existem no DOM como nós.
          </li>
          <li>
            Pseudo-estados como <Text code>:hover</Text>,{' '}
            <Text code>:focus</Text> e <Text code>:active</Text> dependem do
            estado do mouse/teclado; num HTML estático geralmente não casam
            nada.
          </li>
          <li>
            O iframe usa <Text code>sandbox=&quot;allow-same-origin&quot;</Text>,
            então tags <Text code>&lt;script&gt;</Text> do HTML não executam.
            Isso protege a página sem impedir o teste do seletor.
          </li>
          <li>
            Caracteres especiais em nomes de classe/id precisam ser escapados:
            <Text code>.item\\:2</Text> casa a classe{' '}
            <Text code>item:2</Text>.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'CSS Selector Tester',
    intro: (
      <>
        Type a CSS selector and see which elements match a snippet of HTML in
        real time. The preview runs inside a sandboxed iframe, so nothing runs
        outside the browser — it is all client-side.
      </>
    ),
    selectorLabel: 'CSS selector',
    selectorPlaceholder: 'E.g.: .card > p:first-child',
    htmlLabel: 'Test HTML',
    htmlPlaceholder: 'Paste or type a snippet of HTML here...',
    examples: 'Examples',
    simple: 'Common selectors',
    pseudo: 'Pseudo-classes',
    attr: 'Attributes',
    combinators: 'Combinators',
    clear: 'Clear',
    previewTitle: 'Live preview',
    matchesTitle: 'Matched elements',
    noMatches: 'No elements match the selector.',
    invalid: 'Invalid selector — check the syntax.',
    copySelector: 'Copy selector',
    copied: 'Copied!',
    copyError: 'Copy failed',
    resultCount: (n) => `${n} ${n === 1 ? 'match' : 'matches'}`,
    colIndex: '#',
    colElement: 'Element',
    colId: 'ID',
    colClasses: 'Classes',
    colText: 'Text',
    colPath: 'Path',
    alertTitle: 'querySelector gotchas',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            Pseudo-elements (<Text code>::before</Text>,{' '}
            <Text code>::after</Text>, <Text code>::selection</Text>) CANNOT be
            selected with <Text code>querySelectorAll</Text> — they do not exist
            as DOM nodes.
          </li>
          <li>
            Pseudo-states like <Text code>:hover</Text>,{' '}
            <Text code>:focus</Text> and <Text code>:active</Text> depend on
            mouse/keyboard state; against static HTML they usually match
            nothing.
          </li>
          <li>
            The iframe uses{' '}
            <Text code>sandbox=&quot;allow-same-origin&quot;</Text>, so user{' '}
            <Text code>&lt;script&gt;</Text> tags do not execute. This keeps the
            page safe without blocking the selector test.
          </li>
          <li>
            Special characters in class/id names must be escaped:{' '}
            <Text code>.item\\:2</Text> matches the class{' '}
            <Text code>item:2</Text>.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Under the hood (algorithm)',
  },
}

function buildPath(el) {
  const parts = []
  let node = el
  while (node && node.nodeType === 1) {
    let tag = node.tagName.toLowerCase()
    if (node.id) {
      tag += `#${node.id}`
    } else if (typeof node.className === 'string' && node.className.trim()) {
      const cls = node.className
        .trim()
        .split(/\s+/)
        .filter((c) => c && c !== HIGHLIGHT_CLASS)
        .slice(0, 2)
        .join('.')
      if (cls) tag += `.${cls}`
    }
    parts.push(tag)
    node = node.parentElement
  }
  return parts.reverse().join(' > ')
}

function classesOf(el) {
  if (typeof el.className === 'string') {
    return el.className
      .trim()
      .split(/\s+/)
      .filter((c) => c && c !== HIGHLIGHT_CLASS)
      .join(' ')
  }
  return ''
}

export default function CssSelectorTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [selector, setSelector] = useState('.card.featured > h2')
  const [html, setHtml] = useState(EXAMPLE_SIMPLE)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState(null)

  const iframeRef = useRef(null)

  const exampleOptions = useMemo(
    () => [
      { key: 'simple', label: t.simple, selector: '.card.featured > h2', html: EXAMPLE_SIMPLE },
      { key: 'pseudo', label: t.pseudo, selector: 'li:first-child, li:last-child', html: EXAMPLE_PSEUDO },
      { key: 'attr', label: t.attr, selector: '[data-status="open"], a[target="_blank"]', html: EXAMPLE_ATTR },
      { key: 'combinators', label: t.combinators, selector: 'section > h1 + p', html: EXAMPLE_COMBINATORS },
    ],
    [t]
  )

  function clearHighlights(doc) {
    doc
      .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
      .forEach((el) => el.classList.remove(HIGHLIGHT_CLASS))
  }

  function injectHighlightStyle(doc) {
    const id = 'devtools-selector-style'
    if (doc.getElementById(id)) return
    const style = doc.createElement('style')
    style.id = id
    style.textContent = `.${HIGHLIGHT_CLASS} { outline: 2px solid #f5222d !important; outline-offset: 1px !important; }`
    ;(doc.head || doc.body).appendChild(style)
  }

  function evaluate() {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return

    clearHighlights(doc)
    injectHighlightStyle(doc)

    const raw = selector.trim()
    if (!raw) {
      setMatches([])
      setError(null)
      return
    }

    try {
      const nodes = doc.querySelectorAll(raw)
      const rows = Array.from(nodes).map((el, idx) => ({
        key: idx,
        index: idx + 1,
        tag: el.tagName.toLowerCase(),
        id: el.id || '—',
        classes: classesOf(el) || '—',
        text: (el.textContent || '').trim().slice(0, 80),
        path: buildPath(el),
      }))
      nodes.forEach((el) => el.classList.add(HIGHLIGHT_CLASS))
      setMatches(rows)
      setError(null)
    } catch (e) {
      setMatches([])
      setError(e.message || t.invalid)
    }
  }

  useEffect(() => {
    evaluate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, html])

  async function copySelector() {
    try {
      await navigator.clipboard.writeText(selector)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  function loadExample(item) {
    setSelector(item.selector)
    setHtml(item.html)
  }

  const columns = [
    { title: t.colIndex, dataIndex: 'index', width: 48 },
    {
      title: t.colElement,
      dataIndex: 'tag',
      render: (val) => <Text code>{`<${val}>`}</Text>,
    },
    { title: t.colId, dataIndex: 'id' },
    { title: t.colClasses, dataIndex: 'classes' },
    {
      title: t.colText,
      dataIndex: 'text',
      render: (val) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {val || '—'}
        </Text>
      ),
    },
    {
      title: t.colPath,
      dataIndex: 'path',
      render: (val) => (
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{val}</Text>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SelectOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.selectorLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder={t.selectorPlaceholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace' }}
            suffix={
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={copySelector}
                disabled={!selector.trim()}
              >
                {t.copySelector}
              </Button>
            }
          />
          <Space wrap>
            {exampleOptions.map((opt) => (
              <Button
                key={opt.key}
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => loadExample(opt)}
              >
                {opt.label}
              </Button>
            ))}
            <Button
              danger
              size="small"
              icon={<ClearOutlined />}
              onClick={() => {
                setSelector('')
                setHtml('')
              }}
            >
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title={t.htmlLabel}>
        <TextArea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder={t.htmlPlaceholder}
          autoSize={{ minRows: 6, maxRows: 14 }}
          spellCheck={false}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <Card
        title={
          <Space size={12}>
            <span>{t.previewTitle}</span>
            <Tag color={error ? 'red' : 'blue'}>
              {error ? t.invalid : t.resultCount(matches.length)}
            </Tag>
          </Space>
        }
      >
        <iframe
          ref={iframeRef}
          key={html}
          title="CSS selector preview"
          srcDoc={html}
          sandbox="allow-same-origin"
          onLoad={evaluate}
          style={{
            width: '100%',
            height: 220,
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            background: '#fff',
          }}
        />
      </Card>

      {error && <Alert type="error" message={t.invalid} description={error} showIcon />}

      <Card
        title={
          <Space size={12}>
            <span>{t.matchesTitle}</span>
            <Tag color="blue">{matches.length}</Tag>
          </Space>
        }
      >
        {matches.length === 0 && !error ? (
          <Text type="secondary">{t.noMatches}</Text>
        ) : (
          <Table
            dataSource={matches}
            columns={columns}
            pagination={false}
            size="small"
            bordered
          />
        )}
      </Card>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: (
              <pre
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 6,
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {SOURCE_SNIPPET}
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
