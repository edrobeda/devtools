import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Table, Segmented,
  Statistic, Row, Col, Alert, Tag,
} from 'antd'
import {
  CodeOutlined, CopyOutlined, CheckOutlined, ClearOutlined, WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const enc = new TextEncoder()

// Regex de categorias Unicode. Propriedades como Extended_Pictographic exigem
// a flag 'u' e têm suporte amplo nos navegadores modernos.
const RE_LETTER = /\p{L}/u
const RE_MARK = /\p{M}/u
const RE_NUMBER = /\p{N}/u
const RE_SYMBOL = /\p{S}/u
const RE_PUNCT = /\p{P}/u
const RE_EMOJI = /\p{Extended_Pictographic}/u

const WHITESPACE = new Set(
  [' ', '\t', '\n', '\r', '\v', '\f', '\u00A0', '\u1680', '\u2028', '\u2029',
    '\u3000', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005',
    '\u2006', '\u2007', '\u2008', '\u2009', '\u200A', '\u202F', '\u205F']
)

// Zero-width, bidi e joiners: "invisíveis" porém com função real de verdade.
const INVISIBLE = new Set(
  ['\u200B', '\u200C', '\u200D', '\uFEFF', '\u2060', '\u200E', '\u200F',
    '\u202A', '\u202B', '\u202C', '\u202D', '\u202E', '\u2066', '\u2067',
    '\u2068', '\u2069']
)

// Rótulo pode ser função (rota de idioma) ou string simples.
function mod(label, lang) {
  return typeof label === 'function' ? label(lang) : label
}

function classify(char, lang) {
  const L = KIND_LABELS[lang] || KIND_LABELS.pt
  const cp = char.codePointAt(0)
  if (INVISIBLE.has(char)) return { label: L.invisible, color: 'red', unusual: true }
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || cp === 0x7f) {
    return { label: L.control, color: 'red', unusual: true }
  }
  if (WHITESPACE.has(char)) return { label: L.whitespace, color: 'orange' }
  if (RE_MARK.test(char)) return { label: L.mark, color: 'purple' }
  if (RE_EMOJI.test(char)) return { label: L.emoji, color: 'gold' }
  if (cp >= 32 && cp <= 126) return { label: L.ascii, color: 'blue' }
  if (RE_NUMBER.test(char)) return { label: L.number, color: 'geekblue' }
  if (RE_LETTER.test(char)) return { label: L.letter, color: 'green' }
  if (RE_SYMBOL.test(char)) return { label: L.symbol, color: 'purple' }
  if (RE_PUNCT.test(char)) return { label: L.punct, color: 'cyan' }
  return { label: L.other, color: 'default' }
}

function htmlEntity(char) {
  const cp = char.codePointAt(0)
  if (cp > 127 || cp === 34 || cp === 38 || cp === 60 || cp === 62) return `&#${cp};`
  return char
}

function describe(char, lang) {
  const cp = char.codePointAt(0)
  const utf8 = Array.from(enc.encode(char)).map((b) => b.toString(16).padStart(2, '0')).join(' ')
  return {
    char,
    code: cp,
    utf8,
    html: htmlEntity(char),
  }
}

const SAMPLE = 'Olá, café ☕ Camélias 👋🏽 😀\u200Bzero-width\u200C\u200Bfim 👨\u200d👩\u200d👧\u200d👦'

const translations = {
  pt: {
    title: 'Inspetor de Unicode',
    intro: 'Descobre exatamente que caracteres existem num texto: pra cada caractere único mostra o code point (U+xxxx), os bytes em UTF‑8, a entidade HTML e a categoria Unicode. Ajuda a caçar problemas de codificação e caracteres "fantasmas" — espaços de largura zero, marcas bidi e controles invisíveis — que quebram displays, layouts e validações sem você ver.',
    inputPlaceholder: 'Cole o texto aqui para inspecionar...',
    statTotal: 'caracteres (code points)',
    statUnique: 'caracteres distintos',
    statSpecial: 'incomuns',
    filterAll: 'Todos',
    filterUnusual: 'Só os incomuns',
    warnTitle: 'Caracteres de atenção detectados',
    warnBody: (list) => `O texto tem caracteres estruturados que quebram display/validação: ${list}.`,
    okTitle: 'Tudo limpo',
    okBody: 'Nenhum caractere invisível, de controle ou de formatação encontrado.',
    tableTitle: 'Análise por caractere',
    emptyInput: 'Cole algum texto acima para começar.',
    noUnusual: 'Nenhum caractere incomum na lista — altere o filtro.',
    colChar: 'Caractere',
    colPoint: 'Code point',
    colHex: 'UTF-8 (bytes)',
    colHtml: 'HTML',
    colCat: 'Categoria',
    colCount: 'Vezes',
    colOdd: 'Incomum',
    copy: 'Copiar tabela',
    copyOk: 'Copiado!',
    clear: 'Limpar',
    sample: 'Exemplo',
    sourceTitle: 'Como funciona',
    source: (s) => `Tudo é calculado na hora, sem dependência. Primeiro \`String.codePointAt\` obtém o code point deciminal de cada caractere (o \`U+\` hex vira \`toString(16)\`). Os bytes UTF-8 saem do \`TextEncoder\` embutido:\n\n\`\`\`js\nconst bytes = Array.from(new TextEncoder().encode(char))\n  .map(b => b.toString(16).padStart(2, '0')).join(' ')\n\`\`\`\n\nA classificação usa propriedades de regex Unicode (flag \`u\`):\n\n\`\`\`js\nconst LETTER = /\\p{L}/u, MARK = /\\p{M}/u, NUMBER = /\\p{N}/u,\n      SYMBOL = /\\p{S}/u, EMOJI = /\\p{Extended_Pictographic}/u\n\`\`\`\n\nE a varredura é por code point de verdade com \`Array.from(text)\`, evitando as unidades UTF-16 que \`text[i]\` devolveria (importante pra emojis e acentos combinados).`,
  },
  en: {
    title: 'Unicode Inspector',
    intro: 'See exactly which characters live in a text — for each unique one it shows the code point (U+XXXX), the UTF-8 bytes, the HTML entity and the Unicode category. Great for hunting encoding bugs and "ghost" characters — zero-width spaces, bidi marks and invisible formatting — that break layout, sorting and parsing without being visible.',
    inputPlaceholder: 'Paste the text to inspect...',
    statTotal: 'characters (code points)',
    statUnique: 'unique characters',
    statSpecial: 'unusual',
    filterAll: 'All',
    filterUnusual: 'Only unusual',
    warnTitle: 'Suspicious characters found',
    warnBody: (list) => `Found hidden / control / format characters that break display and validation: ${list}.`,
    okTitle: 'All clean',
    okBody: 'No invisible, control or formatting characters found.',
    tableTitle: 'Character breakdown',
    emptyInput: 'Paste some text above to start.',
    noUnusual: 'No unusual characters — change the filter.',
    colChar: 'Character',
    colPoint: 'Code point',
    colHex: 'UTF-8 bytes',
    colHtml: 'HTML',
    colCat: 'Category',
    colCount: 'Times',
    colOdd: 'Odd',
    copy: 'Copy table',
    copyOk: 'Copied!',
    clear: 'Clear',
    sample: 'Sample',
    sourceTitle: 'Under the hood',
    source: (s) => `Everything computed live, no library. \`String.String.fromCodePoint\` reads each code point in decimal; show as \`U+HEX\` from \`.toString(16)\`. UTF-8 bytes via the built-in \`TextEncoder\`:\n\n\`\`\`js\nconst tilde = Array.from(enc.encode(text))\n  .map(b => b.toString(16).padStart(2, '0')).join(' ')\n\`\`\`\n\nCategory classification uses Unicode regex properties (require the \`u\` flag):\n\n\`\`\`js\nconst LETTER = /\\p{L}/u, MARK = /\\p{M}/u, NUMBER = /\\p{N}/u,\n      SYMBOL = /\\p{S}/u, EMOJI = /\\p{Extended_Pictographic}/u\n\`\`\`\n\nAnd the scan walks by real code point via \`Array.from(text)\`, avoiding the UTF-16 units that \`text[i]\` would return (important for emoji and combining marks).`,
  },
}

const KIND_LABELS = {
  pt: {
    invisible: 'Invizúvel / formatação',
    control: 'Controle',
    whitespace: 'Espaço em branco',
    mark: 'Marca combinável',
    emoji: 'Emoji',
    ascii: 'ASCII imprimível',
    number: 'Número',
    letter: 'Letra',
    symbol: 'Símbolo',
    punct: 'Pontuação',
    other: 'Outro',
  },
  en: {
    invisible: 'Invisible / format',
    control: 'Control',
    whitespace: 'Whitespace',
    mark: 'Combining mark',
    emoji: 'Emoji',
    ascii: 'ASCII printable',
    number: 'Number',
    letter: 'Letter',
    symbol: 'Symbol',
    punct: 'Punctuation',
    other: 'Other',
  },
}

export default function UnicodeInspectorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState(false)

  const analysis = useMemo(() => {
    const codes = Array.from(text)
    const map = new Map()
    for (const code of codes) {
      const e = map.get(code) || { char: code, count: 0 }
      e.count += 1
      map.set(code, e)
    }
    const rows = Array.from(map.values()).map((e) => ({
      ...describe(e.char, lang),
      ...classify(e.char, lang),
      count: e.count,
    }))
    const special = rows.filter((r) => r.unusual)
    return { total: codes.length, unique: rows.length, rows, special }
  }, [text, lang])

  const shownRows = useMemo(
    () => (filter === 'unusual' ? analysis.rows.filter((r) => r.unusual) : analysis.rows),
    [analysis, filter]
  )

  async function handleCopy() {
    const head = [t.colChar, t.colPoint, t.colHex, t.colHtml, t.colCat, t.colCount].join('\t')
    const lines = shownRows.map((r) =>
      [r.char, `U+${r.code.toString(16).toUpperCase().padStart(4, '0')}`, r.utf8, r.html, r.label, r.count].join('\t')
    )
    try {
      await navigator.clipboard.writeText([head, ...lines].join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input.TextArea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
        />
      </Card>

      <Row gutter={16}>
        {[
          { title: t.statTotal, value: analysis.total },
          { title: t.statUnique, value: analysis.unique },
          { title: t.statSpecial, value: analysis.special.length },
        ].map((s, i) => (
          <Col xs={24} sm={8} key={i}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                valueStyle={{ color: i === 2 && s.value ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
        ))}
        <Col xs={24} sm={8}> </Col>
      </Row>

      {analysis.total === 0 ? null : analysis.special.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={t.warnTitle}
          description={t.warnBody(analysis.special.map((r) => `U+${r.code.toString(16).toUpperCase().padStart(4, '0')}`).join(', '))}
        />
      ) : (
        <Alert type="success" showIcon message={t.okTitle} description={t.okBody} />
      )}

      <Card
        title={t.tableTitle}
        extra={
          <Space wrap>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { label: t.filterAll, value: 'all' },
                { label: t.filterUnusual, value: 'unusual' },
              ]}
            />
            <Button size="small" onClick={() => setText(SAMPLE)}>{t.sample}</Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => { setText(''); setCopied(false) }} disabled={!text}>{t.clear}</Button>
            <Button size="small" type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} disabled={shownRows.length === 0}>
              {copied ? t.copyOk : t.copy}
            </Button>
          </Space>
        }
      >
        {shownRows.length === 0 ? (
          <Text type="secondary">{analysis.total === 0 ? t.emptyInput : t.noUnusual}</Text>
        ) : (
          <Table
            rowKey="code"
            size="small"
            pagination={filter === 'all' ? { pageSize: 20, showSizeChanger: false } : false}
            dataSource={shownRows}
            columns={[
              { title: t.colChar, dataIndex: 'char', render: (c) => <span style={{ fontSize: 18, padding: '0 4px' }}>{c}</span> },
              { title: t.colPoint, dataIndex: 'code', render: (v) => <Text code>{`U+${v.toString(16).toUpperCase().padStart(4, '0')}`}</Text> },
              { title: t.colHex, dataIndex: 'utf8', render: (v) => <Text code>{v}</Text> },
              { title: t.colHtml, dataIndex: 'html', render: (v) => <Text code>{v}</Text> },
              { title: t.colCat, dataIndex: 'label', render: (v, row) => <Tag color={row.color}>{mod(v, lang)}</Tag> },
              { title: t.colCount, dataIndex: 'count', width: 80, align: 'right' },
              {
                title: t.colOdd,
                dataIndex: 'unusual',
                width: 90,
                render: (u) => (u ? <Tag color="red">!</Tag> : <Tag color="green">✓</Tag>),
              },
            ]}
          />
        )}
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}><code>{typeof t.source === 'function' ? t.source(lang) : t.source}</code></pre>
      </Card>
    </Space>
  )
}