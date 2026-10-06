import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Switch,
  Empty,
  Tabs,
  message,
  Alert,
} from 'antd'
import {
  UnorderedListOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  CopyOutlined,
  CodeOutlined,
  FileTextOutlined,
  NumberOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { generate as generateToc } from '../utils/markdownToc'

const { Title, Paragraph, Text } = Typography
const { TextArea: AntdTextArea } = Input

// Sample em PT-BR pra demonstrar o cenário clássico de README/documentação:
// título, subsejas, sub-subsejas, code block com # que NÃO é heading, link,
// heading duplicado (slug com sufixo -1).
const SAMPLE_PT = `# Guia do Projeto

Bem-vindo! Este é o guia de uso da ferramenta. Veja abaixo as seções.

## Instalação

Para instalar, use o gerenciador de pacotes:

\`\`\`bash
# isso aqui NÃO é um heading — está dentro de code fence
npm install my-package
\`\`\`

## Uso

Aqui vai o uso básico.

### Opções avançadas

Veja a lista completa de opções na \`API reference\`.

## Uso

Esta seção tem o mesmo título da anterior — vai virar \`uso-1\`.

## FAQ

Respostas para as dúvidas mais comuns.

### Como resetar

Siga os passos em [reset docs](https://example.com/reset).
`

const SAMPLE_EN = `# Project Guide

Welcome! This is the user manual. See the sections below.

## Installation

Install via your package manager:

\`\`\`bash
# this is NOT a heading — it is inside a code fence
npm install my-package
\`\`\`

## Usage

Basic usage goes here.

### Advanced options

See the full option list in the \`API reference\`.

## Usage

This section has the same title as the previous one — it will become \`usage-1\`.

## FAQ

Answers to common questions.

### How to reset

Follow the steps in [reset docs](https://example.com/reset).
`

const translations = {
  pt: {
    title: 'Gerador de TOC Markdown',
    intro: (
      <>
        Cole um documento Markdown e veja um índice (TOC — <Text code>Table of Contents</Text>)
        gerado automaticamente a partir das headings <Text code># …</Text> e <Text code>## …</Text>.
        O motor extrai headings, monta a hierarquia, gera <Text code>slug</Text> únicos no estilo
        GitHub/GFM (com sufixo <Text code>-1</Text> pra duplicatas) e devolve a lista markdown
        pronta pra colar no topo do documento — junto com o documento inteiro já com o índice
        inserido. Útil pra <Text code>README.md</Text>, docs de projeto e qualquer nota markdown
        longa.
      </>
    ),
    inputTitle: 'Markdown',
    inputPlaceholder: 'Cole aqui um documento markdown…',
    sample: 'Aplicar exemplo',
    clear: 'Limpar',
    configTitle: 'Configuração',
    minLevelLabel: 'Nível mínimo',
    numberedTpl: 'Numerar (1.2.3)',
    indentUnitLabel: 'Indentação',
    bulletLabel: 'Bullet',
    insertPositionLabel: 'Inserir TOC em',
    insertTop: 'Topo absoluto',
    insertAfterHeading: 'Depois do 1º heading',
    insertNone: 'Não inserir (mostrar separado)',
    statsTitle: 'Estatísticas',
    totalHeadings: 'Total de headings',
    levelDistribution: 'Distribuição por nível',
    levels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    emptyTitle: 'Nenhuma heading encontrada',
    emptyHint: 'Cole um documento que tenha headings no formato # Título, ## Subtítulo etc.',
    previewTitle: 'Lista Markdown (TOC)',
    documentTitle: 'Documento com TOC',
    copyToc: 'Copiar TOC',
    copyDocument: 'Copiar documento com TOC',
    copied: 'Copiado!',
    resultTitle: 'Resultado',
    howTitle: 'Como funciona',
    howBody: (
      <>
        O motor 100% local (<Text code>markdownToc.js</Text>) faz 5 coisas em uma passada:
        <br />
        <br />
        1. <b>Remove fences</b> de código (<Text code>```</Text>, <Text code>~~~</Text>) e
        comentários HTML <Text code>&lt;!-- ... --&gt;</Text> — pra que um{' '}
        <Text code># comentário</Text> dentro de um bloco de código não vire heading.
        <br />
        2. <b>Extrai headings</b> em dois formatos: <Text code># ATX</Text> (com #) e{' '}
        <Text code>Setext</Text> (com <Text code>===</Text> ou <Text code>---</Text> abaixo).
        Suporta <Text code>**bold**</Text>, <Text code>*italic*</Text>,{' '}
        <Text code>`code`</Text>, <Text code>[link](href)</Text> e <Text code>![img](src)</Text>{' '}
        dentro do texto da heading, removendo a formatação inline pra montar o label do TOC.
        <br />
        3. <b>Gera slugs</b> únicos no estilo <Text code>github.com/&lt;user&gt;/&lt;repo&gt;</Text>:
        lowercase, espaços viram <Text code>-</Text>, acentos viram transliteração (ex.:{' '}
        <Text code>Configuração → configurar</Text>), e sufixos <Text code>-1</Text>,{' '}
        <Text code>-2</Text> pra títulos repetidos.
        <br />
        4. <b>Monta a árvore</b> via pilha de ancestrais — respeita que{' '}
        <Text code># A → ## A.1 → ### A.1.1 → # B</Text> vira uma estrutura plana pro render.
        <br />
        5. <b>Numera opcionalmente</b> (<Text code>1.2.3</Text>) e <b>renderiza</b> com a
        indentação pedida. <b>Insere</b> o bloco no documento depois do primeiro heading —
        equivalente ao <Text code>gh-md-toc</Text>.
      </>
    ),
    anchorSample: 'Exemplo de slug',
    bulletOptions: [
      { value: '-', label: '-' },
      { value: '*', label: '*' },
      { value: '+', label: '+' },
    ],
    indentOptions: [
      { value: 0, label: '0' },
      { value: 2, label: '2 espaços' },
      { value: 4, label: '4 espaços' },
    ],
    insertOptions: [
      { value: 'after-first-heading', label: 'Depois do 1º heading' },
      { value: 'top', label: 'Topo absoluto' },
      { value: 'none', label: 'Não inserir' },
    ],
    levelOptions: [1, 2, 3, 4, 5, 6],
    noCopy: 'Nada pra copiar — o documento não tem headings.',
  },
  en: {
    title: 'Markdown TOC Generator',
    intro: (
      <>
        Paste a Markdown document and get an automatic table of contents built from its{' '}
        <Text code># …</Text> and <Text code>## …</Text> headings. The engine extracts the
        headings, builds the hierarchy, generates GitHub/GFM-style unique{' '}
        <Text code>slug</Text>s (with <Text code>-1</Text> suffixes for repeats) and returns the
        markdown list ready to paste at the top — along with the full document already having the
        TOC inserted. Great for <Text code>README.md</Text>, project docs and any long markdown
        note.
      </>
    ),
    inputTitle: 'Markdown',
    inputPlaceholder: 'Paste a markdown document here…',
    sample: 'Apply sample',
    clear: 'Clear',
    configTitle: 'Configuration',
    minLevelLabel: 'Min level',
    numberedTpl: 'Numbered (1.2.3)',
    indentUnitLabel: 'Indentation',
    bulletLabel: 'Bullet',
    insertPositionLabel: 'Insert TOC at',
    insertTop: 'Absolute top',
    insertAfterHeading: 'After first heading',
    insertNone: 'Don\u2019t insert (show separately)',
    statsTitle: 'Statistics',
    totalHeadings: 'Total headings',
    levelDistribution: 'Level distribution',
    levels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    emptyTitle: 'No headings found',
    emptyHint: 'Paste a document with # Title, ## Subtitle etc. headings.',
    previewTitle: 'Markdown list (TOC)',
    documentTitle: 'Document with TOC',
    copyToc: 'Copy TOC',
    copyDocument: 'Copy document with TOC',
    copied: 'Copied!',
    resultTitle: 'Result',
    howTitle: 'How it works',
    howBody: (
      <>
        The fully-local engine (<Text code>markdownToc.js</Text>) does 5 things in one pass:
        <br />
        <br />
        1. <b>Strips code fences</b> (<Text code>```</Text>, <Text code>~~~</Text>) and HTML
        comments <Text code>&lt;!-- ... --&gt;</Text> so a <Text code># comment</Text> inside a
        code block does not become a heading.
        <br />
        2. <b>Extracts headings</b> in two formats: <Text code># ATX</Text> and{' '}
        <Text code>Setext</Text> (with <Text code>===</Text> or <Text code>---</Text> below).
        Supports <Text code>**bold**</Text>, <Text code>*italic*</Text>,{' '}
        <Text code>`code`</Text>, <Text code>[link](href)</Text> and <Text code>![img](src)</Text>{' '}
        inside the heading line, stripping inline formatting to build the TOC label.
        <br />
        3. <b>Generates slugs</b> in <Text code>github.com/&lt;user&gt;/&lt;repo&gt;</Text> style:
        lowercase, spaces become <Text code>-</Text>, accents are transliterated (e.g.{' '}
        <Text code>Configuração → configuracao</Text>), with <Text code>-1</Text>,{' '}
        <Text code>-2</Text> suffixes for repeats.
        <br />
        4. <b>Builds the tree</b> via an ancestor stack — respecting that{' '}
        <Text code># A → ## A.1 → ### A.1.1 → # B</Text> flattens correctly for rendering.
        <br />
        5. <b>Optionally numbers</b> (<Text code>1.2.3</Text>) and <b>renders</b> with the
        chosen indent. <b>Inserts</b> the block in the document after the first heading —
        equivalent to <Text code>gh-md-toc</Text>.
      </>
    ),
    anchorSample: 'Slug example',
    bulletOptions: [
      { value: '-', label: '-' },
      { value: '*', label: '*' },
      { value: '+', label: '+' },
    ],
    indentOptions: [
      { value: 0, label: '0' },
      { value: 2, label: '2 spaces' },
      { value: 4, label: '4 spaces' },
    ],
    insertOptions: [
      { value: 'after-first-heading', label: 'After first heading' },
      { value: 'top', label: 'Absolute top' },
      { value: 'none', label: 'Don\u2019t insert' },
    ],
    levelOptions: [1, 2, 3, 4, 5, 6],
    noCopy: 'Nothing to copy — the document has no headings.',
  },
}

export default function MarkdownTocGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [rawInput, setRawInput] = useState('')
  const [minLevel, setMinLevel] = useState(1)
  const [numbered, setNumbered] = useState(false)
  const [indentUnit, setIndentUnit] = useState(2)
  const [bullet, setBullet] = useState('-')
  const [insertPosition, setInsertPosition] = useState('after-first-heading')

  // Recalcula o TOC quando qualquer input / config muda. O `useMemo` aqui
  // é importante: `rawInput` muda a cada keystroke e cada uma recria o
  // objeto de `headings`/`stats`, então sem memo seria recriado em todo
  // render, ainda que barato — mas a UI depende do objeto em vários
  // cards, e o React reconcilia melhor quando a referência é estável.
  const result = useMemo(
    () =>
      generateToc(rawInput, {
        minLevel,
        maxLevel: 6,
        numbered,
        indentUnit,
        bullet,
        insertPosition,
      }),
    [rawInput, minLevel, numbered, indentUnit, bullet, insertPosition]
  )

  // Lista achatada só pra UI: heading, slug e nível, na ordem em que
  // aparecem no documento. Memo separado porque `result.tree` é
  // reatravessado em todo render sem isso.
  const flatHeadings = useMemo(() => {
    const flat = []
    function walk(nodes, depth) {
      for (const n of nodes) {
        flat.push({ level: n.level, text: n.text, slug: n.slug, line: n.line, depth })
        walk(n.children, depth + 1)
      }
    }
    walk(result.tree.children, 0)
    return flat
  }, [result.tree])

  const handleSample = () => setRawInput(lang === 'pt' ? SAMPLE_PT : SAMPLE_EN)
  const handleClear = () => setRawInput('')

  const copy = async (text) => {
    if (!text) {
      message.warning(t.noCopy)
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      message.success(t.copied)
    } catch (e) {
      // Fallback: textarea + execCommand (raro mas pode acontecer em
      // navegadores sem clipboard API).
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        message.success(t.copied)
      } catch {
        message.error(String(e))
      }
      document.body.removeChild(ta)
    }
  }

  const hasHeadings = result.stats.total > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><UnorderedListOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.inputTitle}
        extra={
          <Space>
            <Button icon={<ThunderboltOutlined />} onClick={handleSample}>
              {t.sample}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleClear}>
              {t.clear}
            </Button>
          </Space>
        }
      >
        <AntdTextArea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={t.inputPlaceholder}
          autoSize={{ minRows: 8, maxRows: 24 }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Card>

      <Card title={t.configTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.minLevelLabel}</Text>
              <Select
                value={minLevel}
                onChange={setMinLevel}
                style={{ width: '100%' }}
                options={t.levelOptions.map((v) => ({ value: v, label: `h${v}` }))}
              />
            </Space>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.indentUnitLabel}</Text>
              <Select
                value={indentUnit}
                onChange={(v) => setIndentUnit(Number(v))}
                style={{ width: '100%' }}
                options={t.indentOptions}
              />
            </Space>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.bulletLabel}</Text>
              <Select
                value={bullet}
                onChange={setBullet}
                style={{ width: '100%' }}
                options={t.bulletOptions}
              />
            </Space>
          </Col>
          <Col xs={12} sm={12} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.insertPositionLabel}</Text>
              <Select
                value={insertPosition}
                onChange={setInsertPosition}
                style={{ width: '100%' }}
                options={t.insertOptions}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">{t.numberedTpl}</Text>
              <Switch checked={numbered} onChange={setNumbered} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title={t.statsTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6} md={4}>
            <Statistic title={t.totalHeadings} value={result.stats.total} />
          </Col>
          {result.stats.byLevel
            ? t.levels.map((lbl, i) => {
                const lvl = i + 1
                const count = result.stats.byLevel[lvl] || 0
                return (
                  <Col xs={12} sm={6} md={3} key={lbl}>
                    <Statistic
                      title={<Tag color={count > 0 ? 'blue' : 'default'}>{lbl}</Tag>}
                      value={count}
                    />
                  </Col>
                )
              })
            : null}
        </Row>
      </Card>

      <Card
        title={t.resultTitle}
        extra={
          hasHeadings ? (
            <Space>
              <Button
                icon={<CopyOutlined />}
                onClick={() => copy(result.tocMarkdown)}
                disabled={!result.tocMarkdown}
              >
                {t.copyToc}
              </Button>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copy(result.documentWithToc)}
                disabled={insertPosition === 'none'}
              >
                {t.copyDocument}
              </Button>
            </Space>
          ) : null
        }
      >
        {!hasHeadings ? (
          <Empty
            description={rawInput.trim() === '' ? t.emptyTitle : t.emptyHint}
          />
        ) : (
          <Tabs
            defaultActiveKey="toc"
            items={[
              {
                key: 'toc',
                label: (
                  <span>
                    <UnorderedListOutlined /> {t.previewTitle}
                  </span>
                ),
                children: (
                  <div>
                    <pre
                      data-testid="toc-output"
                      style={{
                        background: '#fafafa',
                        padding: 16,
                        borderRadius: 8,
                        overflowX: 'auto',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        margin: 0,
                        whiteSpace: 'pre',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      {result.tocMarkdown || '—'}
                    </pre>
                  </div>
                ),
              },
              {
                key: 'document',
                label: (
                  <span>
                    <FileTextOutlined /> {t.documentTitle}
                  </span>
                ),
                children: (
                  <div>
                    {insertPosition === 'none' && (
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message={t.insertNone}
                      />
                    )}
                    <pre
                      data-testid="document-output"
                      style={{
                        background: '#fafafa',
                        padding: 16,
                        borderRadius: 8,
                        overflowX: 'auto',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        maxHeight: 480,
                        overflowY: 'auto',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      {result.documentWithToc}
                    </pre>
                  </div>
                ),
              },
              {
                key: 'headings',
                label: (
                  <span>
                    <NumberOutlined /> {t.totalHeadings} ({result.stats.total})
                  </span>
                ),
                children: (
                  <div>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 13,
                      }}
                    >
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>
                          <th style={{ padding: '6px 8px', width: 60 }}>#</th>
                          <th style={{ padding: '6px 8px' }}>Heading</th>
                          <th style={{ padding: '6px 8px', width: 180 }}>{t.anchorSample}</th>
                          <th style={{ padding: '6px 8px', width: 60 }}>Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flatHeadings.map((h, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid #f0f0f0',
                              paddingLeft: h.depth * 16,
                            }}
                          >
                            <td style={{ padding: '6px 8px' }}>
                              <Tag color="blue">{`h${h.level}`}</Tag>
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{ paddingLeft: h.depth * 16 }}>{h.text}</span>
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <Text code style={{ fontSize: 12 }}>#{h.slug}</Text>
                            </td>
                            <td style={{ padding: '6px 8px', color: '#8c8c8c' }}>{h.line}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Card title={<><CodeOutlined /> {t.howTitle}</>}>
        <Paragraph style={{ marginBottom: 0 }}>{t.howBody}</Paragraph>
      </Card>
    </Space>
  )
}