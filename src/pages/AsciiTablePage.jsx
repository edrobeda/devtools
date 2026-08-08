import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, Radio, Table, Tag, Button, Switch, Alert, Collapse, message } from 'antd'
import { ReadOutlined, SearchOutlined, CopyOutlined, FontSizeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Descrições dos caracteres de controle 0–31 e 127 (DEL).
const CONTROL = {
  0: { en: 'Null', pt: 'Nulo' },
  1: { en: 'Start of heading', pt: 'Início de cabeçalho' },
  2: { en: 'Start of text', pt: 'Início de texto' },
  3: { en: 'End of text', pt: 'Fim de texto' },
  4: { en: 'End of transmission', pt: 'Fim de transmissão' },
  5: { en: 'Enquiry', pt: 'Consulta' },
  6: { en: 'Acknowledgement', pt: 'Confirmação' },
  7: { en: 'Bell', pt: 'Sino' },
  8: { en: 'Backspace', pt: 'Retrocesso' },
  9: { en: 'Horizontal tab', pt: 'Tabulação horizontal' },
  10: { en: 'Line feed', pt: 'Avanço de linha' },
  11: { en: 'Vertical tab', pt: 'Tabulação vertical' },
  12: { en: 'Form feed', pt: 'Avanço de página' },
  13: { en: 'Carriage return', pt: 'Retorno de carro' },
  14: { en: 'Shift out', pt: 'Shift out' },
  15: { en: 'Shift in', pt: 'Shift in' },
  16: { en: 'Data link escape', pt: 'Escape de enlace de dados' },
  17: { en: 'Device control 1', pt: 'Controle de dispositivo 1' },
  18: { en: 'Device control 2', pt: 'Controle de dispositivo 2' },
  19: { en: 'Device control 3', pt: 'Controle de dispositivo 3' },
  20: { en: 'Device control 4', pt: 'Controle de dispositivo 4' },
  21: { en: 'Negative acknowledgement', pt: 'Confirmação negativa' },
  22: { en: 'Synchronous idle', pt: 'Repouso síncrono' },
  23: { en: 'End of frame', pt: 'Fim de quadro' },
  24: { en: 'Cancel', pt: 'Cancelar' },
  25: { en: 'End of medium', pt: 'Fim de meio' },
  26: { en: 'Substitute', pt: 'Substituição' },
  27: { en: 'Escape', pt: 'Escape' },
  28: { en: 'File separator', pt: 'Separador de arquivo' },
  29: { en: 'Group separator', pt: 'Separador de grupo' },
  30: { en: 'Record separator', pt: 'Separador de registro' },
  31: { en: 'Unit separator', pt: 'Separador de unidade' },
  127: { en: 'Delete', pt: 'Apagar' },
}

const SYMBOLS = {
  32: { en: 'Space', pt: 'Espaço' },
  33: { en: 'Exclamation mark', pt: 'Ponto de exclamação' },
  34: { en: 'Quotation mark', pt: 'Aspas (aspas duplas)' },
  35: { en: 'Number sign / hash', pt: 'Sustenido (jogo da velha)' },
  36: { en: 'Dollar sign', pt: 'Cifrão' },
  37: { en: 'Percent sign', pt: 'Porcentagem' },
  38: { en: 'Ampersand', pt: 'E comercial' },
  39: { en: 'Apostrophe', pt: 'Apóstrofo' },
  40: { en: 'Left parenthesis', pt: 'Parêntese esquerdo' },
  41: { en: 'Right parenthesis', pt: 'Parêntese direito' },
  42: { en: 'Asterisk', pt: 'Asterisco' },
  43: { en: 'Plus sign', pt: 'Mais' },
  44: { en: 'Comma', pt: 'Vírgula' },
  45: { en: 'Hyphen-minus', pt: 'Hífen/menos' },
  46: { en: 'Full stop', pt: 'Ponto final' },
  47: { en: 'Slash', pt: 'Barra' },
  58: { en: 'Colon', pt: 'Dois pontos' },
  59: { en: 'Semicolon', pt: 'Ponto e vírgula' },
  60: { en: 'Less-than sign', pt: 'Menor que' },
  61: { en: 'Equals sign', pt: 'Igual' },
  62: { en: 'Greater-than sign', pt: 'Maior que' },
  63: { en: 'Question mark', pt: 'Interrogação' },
  64: { en: 'At sign', pt: 'Arroba' },
  91: { en: 'Left square bracket', pt: 'Colchete esquerdo' },
  92: { en: 'Backslash', pt: 'Barra invertida' },
  93: { en: 'Right square bracket', pt: 'Colchete direito' },
  94: { en: 'Caret', pt: 'Acento circunflexo' },
  95: { en: 'Low line (underscore)', pt: 'Sublinhado (underline)' },
  96: { en: 'Grave accent (backtick)', pt: 'Acento grave (crase)' },
  123: { en: 'Left curly bracket', pt: 'Chave esquerda' },
  124: { en: 'Vertical bar (pipe)', pt: 'Barra vertical (pipe)' },
  125: { en: 'Right curly bracket', pt: 'Chave direita' },
  126: { en: 'Tilde', pt: 'Til' },
}

function byteName(n, lang) {
  if (CONTROL[n]) return CONTROL[n][lang]
  if (SYMBOLS[n]) return SYMBOLS[n][lang]
  if (n >= 48 && n <= 57) return lang === 'pt' ? `Dígito ${n - 48}` : `Digit ${n - 48}`
  if (n >= 65 && n <= 90) return lang === 'pt' ? `Letra ${String.fromCharCode(n)} (maiúscula)` : `Letter ${String.fromCharCode(n)} (uppercase)`
  if (n >= 97 && n <= 122) return lang === 'pt' ? `Letra ${String.fromCharCode(n)} (minúscula)` : `Letter ${String.fromCharCode(n)} (lowercase)`
  if (n >= 128 && n <= 159) return lang === 'pt' ? 'Controle C1 (Latin-1)' : 'C1 control (Latin-1)'
  return lang === 'pt' ? 'Caractere Latin-1' : 'Latin-1 character'
}

// Escape/token JS que representa o byte — atalho pra usar em código.
function escapeToken(n) {
  switch (n) {
    case 0: return '\\0'
    case 9: return '\\t'
    case 10: return '\\n'
    case 13: return '\\r'
    case 27: return '\\x1B'
    case 127: return '\\x7F'
    default:
      if (n < 32 || (n > 126 && n < 160)) {
        return `\\x${n.toString(16).padStart(2, '0').toUpperCase()}`
      }
      return String.fromCharCode(n)
  }
}

function buildRows(extended) {
  const last = extended ? 255 : 127
  const rows = []
  for (let n = 0; n <= last; n++) {
    let cat
    if (n < 32 || n === 127) cat = 'control'
    else if (n >= 65 && n <= 90) cat = 'letter'
    else if (n >= 97 && n <= 122) cat = 'letter'
    else if (n >= 48 && n <= 57) cat = 'digit'
    else if (n >= 128) cat = 'extended'
    else cat = 'symbol'
    rows.push({
      n,
      cat,
      hex: n.toString(16).padStart(2, '0').toUpperCase(),
      bin: n.toString(2).padStart(8, '0'),
    })
  }
  return rows
}

// Código-fonte exibido — o núcleo do algoritmo da página.
const SOURCE = `// Nome legível de um byte (traduzido pela página).
function byteName(n, lang) {
  if (CONTROL[n]) return CONTROL[n][lang]       // 0-31, 127
  if (SYMBOLS[n]) return SYMBOLS[n][lang]       // !"#$%&'()*+,-./... etc.
  if (n >= 48 && n <= 57) return lang === 'pt'
    ? 'Dígito ' + (n - 48) : 'Digit ' + (n - 48)
  if (n >= 65 && n <= 90) return lang === 'pt'
    ? 'Letra ' + String.fromCharCode(n) + ' (maiúscula)'
    : 'Letter ' + String.fromCharCode(n) + ' (uppercase)'
  // ...minúsculas e Latin-1 análogos
}

// O byte vira o token que você escreveria em código:
function escapeToken(n) {
  switch (n) {
    case 0:  return '\\\\0'
    case 9:  return '\\\\t'
    case 10: return '\\\\n'
    case 13: return '\\\\r'
    case 27: return '\\\\x1B'
    case 127: return '\\\\x7F'
    default:
      if (n < 32 || (n > 126 && n < 160)) {
        return '\\\\x' + n.toString(16).padStart(2, '0').toUpperCase()
      }
      return String.fromCharCode(n)   // ASCII imprimível / Latin-1
  }
}

function buildRows(extended) {
  const last = extended ? 255 : 127
  const rows = []
  for (let n = 0; n <= last; n++) {
    let cat
    if (n < 32 || n === 127) cat = 'control'
    else if (n >= 65 && n <= 122) cat = 'letter'   // A-Z e a-z
    else if (n >= 48 && n <= 57) cat = 'digit'
    else if (n >= 128) cat = 'extended'
    else cat = 'symbol'
    rows.push({
      n,
      cat,
      hex: n.toString(16).padStart(2, '0').toUpperCase(),
      bin: n.toString(2).padStart(8, '0'),
    })
  }
  return rows
}`

const translations = {
  pt: {
    title: 'Tabela ASCII',
    intro: (
      <>
        Consulta rápida dos valores de <Text code>0–255</Text>: o código decimal, hexadecimal e
        binário de cada byte, com o caractere correspondente (ASCII 0–127) e a extensão
        Latin-1 (128–255). Útil pra decifrar um <Text code>0x1B</Text> num dump/buffer, escrever os
        escapes de string certos ou lembrar que <Text code>\n</Text> é <Text code>10 (0x0A)</Text> e que{' '}
        <Text code>\t</Text> é <Text code>9 (0x09)</Text>.
      </>
    ),
    search: 'Buscar por código (dec/hex/bin) ou nome...',
    all: 'Todas',
    control: 'Controles',
    letter: 'Letras',
    digit: 'Dígitos',
    symbol: 'Símbolos',
    extended: 'Latin-1',
    extendedToggle: 'Mostrar 128–255 (Latin-1)',
    empty: 'Nada encontrado com esse filtro.',
    found: 'bytes exibidos',
    dec: 'Dec',
    hex: 'Hex',
    bin: 'Bin',
    char: 'Char',
    name: 'Nome',
    esc: 'Escape',
    copyList: 'Copiar lista filtrada (TSV)',
    copied: 'Copiado!',
    tipTitle: 'Como ler a tabela',
    tipBody: (
      <>
        Um <Text code>byte</Text> é um número de 0 a 255 — a mesma linha mostra o valor nas três bases
        (decimal, hex e binário). Os caracteres <Text strong>de controle</Text> (0–31 e 127) não imprimem nada;
        aparecem em terminais, protocolos e arquivos como tokens especiais — <Text code>\r\n</Text>
        (CR/LF, 13/10) separa linhas no Windows, <Text code>\n</Text> (10) no Linux, <Text code>\t</Text> (9) tabula
        e <Text code>0x00</Text> é o nulo. Pra conferir na prática: <Text code>"ABC".charCodeAt(0)</Text> retorna
        <Text code> 65</Text> — o valor da coluna <Text>Dec</Text> — e <Text code>String.fromCharCode(65)</Text> devolve{' '}
        <Text code>'A'</Text>.
      </>
    ),
    sourceTab: 'Código-fonte (buildRows + escapeToken)',
    sourceHint: 'Gere as linhas da tabela com:',
    copyTab: 'Copiar código',
  },
  en: {
    title: 'ASCII Table',
    intro: (
      <>
        Quick reference for byte values <Text code>0–255</Text>: the decimal, hex and binary code of
        each byte, plus the matching character (ASCII 0–127) and the Latin-1 extension
        (128–255). Handy to decode a <Text code>0x1B</Text> in a hex dump, write the right string
        escapes, or recall that <Text code>\n</Text> is <Text code>10 (0x0A)</Text> and <Text code>\t</Text> is{' '}
        <Text code>9 (0x09)</Text>.
      </>
    ),
    search: 'Search by code (dec/hex/bin) or name...',
    all: 'All',
    control: 'Controls',
    letter: 'Letters',
    digit: 'Digits',
    symbol: 'Symbols',
    extended: 'Latin-1',
    extendedToggle: 'Show 128–255 (Latin-1)',
    empty: 'Nothing found with this filter.',
    found: 'bytes shown',
    dec: 'Dec',
    hex: 'Hex',
    bin: 'Bin',
    char: 'Char',
    name: 'Name',
    esc: 'Escape',
    copyList: 'Copy filtered list (TSV)',
    copied: 'Copied!',
    tipTitle: 'How to read this table',
    tipBody: (
      <>
        A <Text code>byte</Text> is an integer from 0 to 255 — one row shows the same value in three
        bases (decimal, hex and binary). <Text strong>Control</Text> characters (0–31, 127) print nothing;
        you meet them in terminals, protocols and logs as special tokens — <Text code>\r\n</Text>
        (CRLF, 13/10) separates lines on Windows, <Text code>\n</Text> (10) on Linux, <Text code>\t</Text> (9) is
        the tab and <Text code>0x00</Text> is null. Try it: <Text code>"ABC".charCodeAt(0)</Text> returns{' '}
        <Text code>65</Text> — the value in the <Text>Dec</Text> column — and <Text code>String.fromCharCode(65)</Text>{' '}
        gives back <Text code>'A'</Text>.
      </>
    ),
    sourceTab: 'Source code (buildRows + escapeToken)',
    sourceHint: 'Generate the table rows with:',
    copyTab: 'Copy code',
  },
}

export default function AsciiTablePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [showExtended, setShowExtended] = useState(false)
  const [cat, setCat] = useState('all')

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const rows = useMemo(() => buildRows(showExtended), [showExtended])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return rows.filter((r) => {
      if (cat === 'control') {
        if (r.cat !== 'control') return false
      } else if (cat === 'letter') {
        if (r.cat !== 'letter') return false
      } else if (cat === 'digit') {
        if (r.cat !== 'digit') return false
      } else if (cat === 'symbol') {
        if (r.cat !== 'symbol') return false
      } else if (cat === 'extended') {
        if (r.cat !== 'extended') return false
      }
      if (!q) return true
      const name = byteName(r.n, lang).toLowerCase()
      const printable = r.cat === 'letter' || r.cat === 'digit' || r.cat === 'symbol'
      return (
        String(r.n).includes(q) ||
        r.hex.toLowerCase().includes(q) ||
        `0x${r.hex.toLowerCase()}`.includes(q) ||
        r.bin.toLowerCase().includes(q) ||
        (printable ? String.fromCharCode(r.n).toLowerCase().includes(q) : false) ||
        name.includes(q)
      )
    })
  }, [rows, query, cat, lang, normalized])

  const columns = useMemo(() => [
    { title: t.dec, dataIndex: 'n', key: 'n', width: 64, render: (v) => <Text style={{ fontFamily: 'monospace' }}>{v}</Text> },
    {
      title: t.hex,
      dataIndex: 'hex',
      key: 'hex',
      width: 70,
      render: (v) => <Text code style={{ fontSize: 11 }}>0x{v}</Text>,
    },
    {
      title: t.bin,
      dataIndex: 'bin',
      key: 'bin',
      width: 96,
      render: (v) => <Text code style={{ fontSize: 10 }}>{v}</Text>,
    },
    {
      title: t.char,
      dataIndex: 'n',
      key: 'char',
      width: 52,
      align: 'center',
      render: (v) => {
        if (v < 32 || v === 127) return null
        if (v >= 128) return <Text style={{ fontFamily: 'monospace', color: '#8c8c8c' }}>{String.fromCharCode(v)}</Text>
        return <Text strong style={{ fontSize: 16 }}>{String.fromCharCode(v)}</Text>
      },
    },
    {
      title: t.name,
      dataIndex: 'n',
      key: 'name',
      render: (v) => {
        if (v < 32 || v === 127) {
          return (
            <Space size={4}>
              <Tag color="orange" style={{ marginRight: 0 }}>{`U+${v.toString(16).padStart(2, '0').toUpperCase()}`}</Tag>
              <Text type="secondary">{byteName(v, lang)}</Text>
            </Space>
          )
        }
        return <Text>{byteName(v, lang)}</Text>
      },
    },
    {
      title: t.esc,
      key: 'esc',
      width: 110,
      render: (_, r) => {
        const esc = escapeToken(r.n)
        return <Text code>{esc}</Text>
      },
    },
  ], [t, lang])

  function copyFiltered() {
    const lines = filtered.map((r) => `${r.n}\t0x${r.hex}\t${r.bin}\t${escapeToken(r.n)}\t${byteName(r.n, lang)}`)
    navigator.clipboard.writeText(lines.join('\n'))
    message.success(t.copied)
  }

  function handleCopySource() {
    navigator.clipboard.writeText(SOURCE)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<FontSizeOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Space wrap size="middle">
          <Radio.Group value={cat} onChange={(e) => setCat(e.target.value)} optionType="button">
            <Radio.Button value="all">{t.all}</Radio.Button>
            <Radio.Button value="control">{t.control}</Radio.Button>
            <Radio.Button value="letter">{t.letter}</Radio.Button>
            <Radio.Button value="digit">{t.digit}</Radio.Button>
            <Radio.Button value="symbol">{t.symbol}</Radio.Button>
            {showExtended && <Radio.Button value="extended">{t.extended}</Radio.Button>}
          </Radio.Group>
          <Space size={8}>
            <Switch size="small" checked={showExtended} onChange={setShowExtended} />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.extendedToggle}</Text>
          </Space>
        </Space>
      </Space>

      <Space wrap size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">{filtered.length} {t.found}</Text>
        <Button size="small" icon={<CopyOutlined />} onClick={copyFiltered} disabled={filtered.length === 0}>
          {t.copyList}
        </Button>
      </Space>

      <Card>
        <Table
          rowKey={(r) => r.n}
          columns={columns}
          dataSource={filtered}
          size="small"
          pagination={{ defaultPageSize: 32, showSizeChanger: true, pageSizeOptions: [16, 32, 64, 128] }}
          locale={{ emptyText: t.empty }}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTab,
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Paragraph type="secondary">{t.sourceHint} <Text code>buildRows(showExtended)</Text></Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420, fontSize: 12 }}>
                  <code>{SOURCE}</code>
                </pre>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopySource}>{t.copyTab}</Button>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}