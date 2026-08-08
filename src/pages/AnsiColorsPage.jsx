import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Collapse, Divider, message, Tag } from 'antd'
import { CopyOutlined, ClearOutlined, BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cores ANSI (escapes de terminal)',
    intro: (
      <>
        Cole aqui a saída colorida de um terminal — logs, testes, npm, git — com os{' '}
        <Text code>ESC</Text> escapes de cor preservados, e veja de um lado o texto
        renderizado com as cores aplicadas de verdade e do outro o mesmo texto já
        limpo, sem nenhum código ANSI, pronto pra colar em ticket ou doc. A página
        também serve de referência das paletas 16/256 cores e do truecolor pra
        colorir a saída das suas próprias ferramentas. 100% client-side.
      </>
    ),
    howTitle: 'Lendo os códigos',
    howBody: (
      <>
        Uma cor ANSI é uma sequência de escape no formato <Text code>ESC[…m</Text>{' '}
        — o <Text code>ESC</Text> é o byte 27, comumente escrito{' '}
        <Text code>\x1b</Text>. Dentro dos colchetes vêm os números separados por{' '}
        <Text code>;</Text>, o <Text code>SGR</Text> (Select Graphic Rendition). Ex.:{' '}
        <Text code>\x1b[1;31m</Text> liga <b>negrito + vermelho</b> e{' '}
        <Text code>\x1b[0m</Text> volta ao normal. Além das 16 básicas,{' '}
        <Text code>38;5;N</Text> acessa as 256 cores do xterm e{' '}
        <Text code>38;2;R;G;B</Text> aceita qualquer RGB (truecolor). A página
        normaliza <Text code>\e</Text>, <Text code>\x1b</Text>,{' '}
        <Text code>\u001b</Text> e <Text code>\033</Text> pro byte real, então
        entende tanto a saída verdadeira de um terminal quanto texto digitado.
      </>
    ),
    inputTitle: 'Entrada — texto com escapes',
    inputPlaceholder: 'Cole aqui o texto colorido do terminal…',
    examples: 'Exemplos de um clique',
    ex1: 'Log de deploy',
    ex2: 'Bala 256 cores',
    ex3: 'Truecolor RGB',
    clear: 'Limpar',
    previewTitle: 'Preview renderizado',
    noTitle: 'Texto limpo (códigos removidos)',
    copyClean: 'Copiar texto limpo',
    noInput: 'Cole algo acima pra ver o preview.',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    stats: 'sequências SGR',
    statsCtrl: 'outros CSIs ignorados',
    segments: 'trechos',
    sgrTableTitle: 'Principais códigos SGR',
    sgrTableHint: 'Os números que controlam a aparência',
    sgrReset: 'reset — volta tudo ao padrão',
    sgrBold: 'negrito',
    sgrDim: 'fosco/escurecido',
    sgrItalic: 'itálico',
    sgrUnderline: 'sublinhado',
    sgrReverse: 'inverte texto/fundo',
    sgrStrike: 'riscado',
    sgrFgDefault: 'volta à cor de texto padrão',
    sgrBgDefault: 'volta à cor de fundo padrão',
    fgGroup: 'Cor do texto: 30–37 e 90–97 (brilhante)',
    bgGroup: 'Cor de fundo: 40–47 e 100–107 (brilhante)',
    ext256: 'Paleta xterm: 38;5;N (texto) e 48;5;N (fundo), N = 0–255',
    extTrue: 'Truecolor RGB: 38;2;R;G;B e 48;2;R;G;B',
    basicTitle: 'Paleta básica (16 cores)',
    basicHint: 'Clique num bloco pra copiar o escape que pinta o texto (o número é o SGR 30–37 / 90–97).',
    xtermTitle: 'Paleta xterm (256 cores)',
    xtermHint: (
      <>
        Clique numa célula pra copiar <Text code>\x1b[38;5;N</Text>m — N de 0 a
        255. Layout: 16 básicas, cubo 6×6×6 e 24 cinzas.
      </>
    ),
    trueTitle: 'Truecolor (24 bits)',
    trueHint: (
      <>
        No modo <Text code>38;2;R;G;B</Text> qualquer cor funciona — quase todos
        os terminais modernos suportam.
      </>
    ),
    tCopyFg: 'Texto',
    tCopyBg: 'Fundo',
    srcTitle: 'Algoritmo-fonte (parser + render)',
    srcBody: 'A implementação completa usada nesta própria página:',
  },
  en: {
    title: 'ANSI Colors (terminal escape codes)',
    intro: (
      <>
        Paste colored terminal output — logs, deploy, npm, git — keeping the{' '}
        <Text code>ESC</Text> color codes, and see on one side the text rendered
        with the real colors and on the other the same text with all codes stripped,
        ready to paste into a ticket or doc. The page also works as a reference of
        the 16-color and 256-color palettes plus truecolor, to color your own CLI
        tools. 100% client-side.
      </>
    ),
    howTitle: 'Reading the codes',
    howBody: (
      <>
        An ANSI color is an escape sequence of the form <Text code>ESC[…m</Text> —
        <Text code>ESC</Text> is byte 27, usually written <Text code>\x1b</Text>.
        Inside the brackets come the numbers separated by <Text code>;</Text>, the{' '}
        <Text code>SGR</Text> (Select Graphic Rendition). E.g.{' '}
        <Text code>\x1b[1;31m</Text> turns on <b>bold + red</b> and{' '}
        <Text code>\x1b[0m</Text> resets everything. Beyond the basic 16,{' '}
        <Text code>38;5;N</Text> picks from the 256-color xterm palette and{' '}
        <Text code>38;2;R;G;B</Text> accepts any RGB. The page normalizes{' '}
        <Text code>\e</Text>, <Text code>\x1b</Text>, <Text code>\u001b</Text> and{' '}
        <Text code>\033</Text> to the real byte, so both real terminal output and
        hand-typed text are understood.
      </>
    ),
    inputTitle: 'Input — text with escape codes',
    inputPlaceholder: 'Paste the colored terminal text…',
    examples: 'One-click examples',
    ex1: 'Deploy log',
    ex2: '256-color burst',
    ex3: 'Truecolor RGB',
    clear: 'Clear',
    previewTitle: 'Rendered preview',
    noTitle: 'Stripped text (no codes)',
    copyClean: 'Copy stripped text',
    noInput: 'Paste something above to see the preview.',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    stats: 'SGR sequences',
    statsCtrl: 'other CSIs ignored',
    segments: 'segments',
    sgrTableTitle: 'Key SGR codes',
    sgrTableHint: 'The numbers that control the appearance',
    sgrReset: 'reset — back to defaults',
    sgrBold: 'bold',
    sgrDim: 'faint/dim',
    sgrItalic: 'italic',
    sgrUnderline: 'underline',
    sgrReverse: 'reverse video',
    sgrStrike: 'strikethrough',
    sgrFgDefault: 'back to default foreground',
    sgrBgDefault: 'back to default background',
    fgGroup: 'Foreground: 30–37 and 90–97 (bright)',
    bgGroup: 'Background: 40–47 and 100–107 (bright)',
    ext256: 'xterm palette: 38;5;N for text and 48;5;N for background, N = 0–255',
    extTrue: 'RGB truecolor: 38;2;R;G;B and 48;2;R;G;B',
    basicTitle: 'Basic palette (16 colors)',
    basicHint: 'Click a swatch to copy the escape that paints the text (the number is the SGR 30–37 / 90–97).',
    xtermTitle: 'xterm palette (256 colors)',
    xtermHint: (
      <>
        Click a cell to copy <Text code>\x1b[38;5;N</Text>m — N from 0–255.
        Layout: 16 base + 6×6×6 cube + 24 grays.
      </>
    ),
    trueTitle: 'Truecolor (24-bit)',
    trueHint: (
      <>
        Any RGB works via <Text code>38;2;R;G;B</Text> — virtually every modern
        terminal supports it.
      </>
    ),
    tCopyFg: 'FG',
    tCopyBg: 'BG',
    srcTitle: 'Source of the algorithm (parser + render)',
    srcBody: 'The complete implementation used on this very page:',
  },
}

// ─── Mapeamento de cores ───────────────────────────────────────────
const BASIC_16 = ['#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
  '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff']

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function rgbToHex(r, g, b) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// cor legível (escura ou clara) por cima de um fundo
function contrastFor(hex) {
  const [r, g, b] = hexToRgb(hex)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 140 ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.85)'
}

// índice xterm 0–255 → [r, g, b] (regras da paleta padrão do xterm)
function xtermToRgb(n) {
  if (n < 16) return hexToRgb(BASIC_16[n])
  if (n < 232) {
    const v = n - 16
    const level = (x) => (x === 0 ? 0 : 95 + (x - 1) * 40)
    return [level(Math.floor(v / 36)), level(Math.floor(v / 6) % 6), level(v % 6)]
  }
  const g = 8 + (n - 232) * 10
  return [g, g, g]
}

function toCssColor(color) {
  if (color == null) return null
  if (Array.isArray(color)) return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  const [r, g, b] = xtermToRgb(color)
  return `rgb(${r}, ${g}, ${b})`
}

// ─── Parser ANSI ─────────────────────────────────────────────────────
// cada token: { text } trecho simples | { sgr: params[] } mudou a aparência |
// { ignored } outras sequências CSI (cursor, limpeza) — descartadas.
const CSI_FINAL = /[@-~]/

function normalizeEscapes(str) {
  return str
    .split('\\e').join('\u001b')
    .split('\\x1b').join('\u001b')
    .split('\\u001b').join('\u001b')
    .split('\\033').join('\u001b')
}

function tokenize(str) {
  const tokens = []
  let buf = ''
  let i = 0
  const n = str.length
  const flush = () => {
    if (buf) { tokens.push({ text: buf }); buf = '' }
  }
  while (i < n) {
    const ch = str[i]
    if (ch === '\u001b') {
      if (str[i + 1] === '[') {
        let j = i + 2
        while (j < n && !CSI_FINAL.test(str[j])) j++
        if (j < n) {
          flush()
          const body = str.slice(i + 2, j).trim()
          if (str[j] === 'm') {
            tokens.push({ sgr: body === '' ? [] : body.split(';').map((p) => (Number.isFinite(Number(p)) ? Number(p) : 0)) })
          } else {
            tokens.push({ ignored: true })
          }
          i = j + 1
          continue
        }
      }
      flush()
      tokens.push({ ignored: true })
      i += 1
      continue
    }
    if (ch === '\x07') { flush(); tokens.push({ ignored: true }); i += 1; continue }
    buf += ch
    i += 1
  }
  flush()
  return tokens
}

// aplica parâmetros SGR sobre a aparência atual (imutável)
function applySgr(style, params) {
  const s = { ...style }
  const raw = [0]
  const p = (params?.length ? params : raw)
  let i = 0
  while (i < p.length) {
    const c = p[i]
    if (c === 0) for (const k of Object.keys(s)) delete s[k]
    else if (c === 1) s.bold = true
    else if (c === 2) s.dim = true
    else if (c === 3) s.italic = true
    else if (c === 4) s.underline = true
    else if (c === 7) s.reverse = true
    else if (c === 9) s.strike = true
    else if (c === 22) { s.bold = false; s.dim = false }
    else if (c === 23) s.italic = false
    else if (c === 24) s.underline = false
    else if (c === 27) s.reverse = false
    else if (c === 29) s.strike = false
    else if (c === 39) delete s.fg
    else if (c === 49) delete s.bg
    else if (c >= 30 && c <= 37) s.fg = c - 30
    else if (c >= 90 && c <= 97) s.fg = c - 90 + 8
    else if (c >= 40 && c <= 47) s.bg = c - 40
    else if (c >= 100 && c <= 107) s.bg = c - 100 + 8
    else if (c === 38 || c === 48) {
      const key = c === 38 ? 'fg' : 'bg'
      if (p[i + 1] === 5) { s[key] = p[i + 2]; i += 3; continue }
      if (p[i + 1] === 2) { s[key] = [p[i + 2], p[i + 3], p[i + 4]]; i += 3; continue }
      i += 1
    }
    i += 1
  }
  return s
}

function styleToCss(style, defaultColor) {
  const css = {}
  let fg = toCssColor(style.fg)
  let bg = toCssColor(style.bg)
  if (style.reverse) { const tmp = fg; fg = bg; bg = tmp }
  css.color = fg || defaultColor
  if (bg) css.background = bg
  if (style.bold) css.fontWeight = 700
  if (style.dim) css.opacity = 0.68
  if (style.italic) css.fontStyle = 'italic'
  const deco = []
  if (style.underline) deco.push('underline')
  if (style.strike) deco.push('line-through')
  if (deco.length) css.textDecoration = deco.join(' ')
  return css
}

function parseAnsi(raw) {
  const tokens = tokenize(normalizeEscapes(raw))
  const runs = []
  let style = {}
  let sgrCount = 0
  let ignoredCount = 0
  for (const t of tokens) {
    if (t.sgr) { style = applySgr(style, t.sgr); sgrCount += 1 }
    else if (t.text) runs.push({ text: t.text, style: { ...style } })
    else ignoredCount += 1
  }
  return { runs, sgrCount, ignoredCount }
}

const ESC = '\\x1b'

// exemplos usam a notação literal \x1b pra serem legíveis no source
const EXAMPLES = [
  `${ESC}[1;34mDeploy da API v2.14.0${ESC}[0m    ${ESC}[90m(23.4s)${ESC}[0m
${ESC}[32m✔${ESC}[0m build         ${ESC}[36m0.8s${ESC}[0m
${ESC}[32m✔${ESC}[0m testes        ${ESC}[36m4.1s${ESC}[0m
${ESC}[33m⚠${ESC}[0m 3 avisos de lint — revisar no código
${ESC}[31m✖${ESC}[0m falhou: ${ESC}[1;31mconnection refused${ESC}[0m
${ESC}[4;90m     veja /var/log/app/deploy.log:42${ESC}[0m`,
  `${ESC}[38;5;196m●${ESC}[0m ${ESC}[38;5;208m●${ESC}[0m ${ESC}[38;5;226m●${ESC}[0m ${ESC}[38;5;46m●${ESC}[0m ${ESC}[38;5;51m●${ESC}[0m ${ESC}[38;5;93m●${ESC}[0m
${ESC}[38;5;202;48;5;52m  erro de compilação  ${ESC}[0m
${ESC}[38;5;40m^~${ESC}[0m ${ESC}[38;5;119mapontado: src/main.c:12${ESC}[0m
${ESC}[2;38;5;247mpaleta xterm 256 cores (0–255)${ESC}[0m`,
  `${ESC}[38;2;79;70;229mindigo${ESC}[0m ${ESC}[38;2;255;107;129mrosa${ESC}[0m ${ESC}[38;2;255;159;28mâmbar${ESC}[0m ${ESC}[38;2;16;185;129mesmeralda${ESC}[0m ${ESC}[38;2;6;182;212mciano${ESC}[0m
${ESC}[48;2;236;72;153;38;2;255;255;255m   truecolor: 16,7M de cores   ${ESC}[0m
${ESC}[1;38;2;156;39;176mtítulo em negrito + RGB${ESC}[0m`,
]

const SGR_ROWS = {
  pt: [
    ['0', 'reset — volta tudo ao padrão'], ['1', 'negrito'], ['2', 'fosco/escurecido'],
    ['3', 'itálico'], ['4', 'sublinhado'], ['5', 'pisca-pisca'], ['7', 'inverte texto/fundo'],
    ['9', 'riscado'], ['22–24', 'desliga negrito/dim/itálico'], ['30–37 e 90–97', 'Cor do texto'],
    ['40–47 e 100–107', 'Cor de fundo'], ['39 / 49', 'volta às cores padrão'],
    ['38;5;N · 48;5;N', 'paleta xterm (256)'], ['38;2;R;G;B · 48;2;R;G;B', 'truecolor RGB'],
  ],
  en: [
    ['0', 'reset to defaults'], ['1', 'bold'], ['2', 'faint/dim'],
    ['3', 'italic'], ['4', 'underline'], ['5', 'blink'], ['7', 'reverse video'],
    ['9', 'strikethrough'], ['22–24', 'turn off bold/dim/italic'], ['30–37 and 90–97', 'Foreground'],
    ['40–47 and 100–107', 'Background'], ['39 / 49', 'back to default colors'],
    ['38;5;N · 48;5;N', 'xterm palette (256 colors)'], ['38;2;R;G;B · 48;2;R;G;B', 'RGB truecolor'],
  ],
}

// fonte exibida na própria página (com String.fromCharCode(27) pra não usar \x1b)
const SOURCE = String.raw`
const ESC = String.fromCharCode(27)

// transforma notações escritas no byte real: \e e \x1b, \u001b, \033
function tokenize(raw) {
  const src = raw.split('\x1b').join(ESC)
  const out = []
  let text = ''
  let i = 0
  while (i < src.length) {
    if (src[i] === ESC) {
      if (src[i + 1] === '[') {                 // CSI: ESC [ params final
        let j = i + 2
        while (j < src.length && !/[@-~]/.test(src[j])) j++
        if (j < src.length) {
          if (src[j] === 'm') {
            const p = src.slice(i + 2, j).trim()
            out.push({ sgr: p ? p.split(';').map(Number) : [] })
          } else {
            out.push({ ignored: true })         // cursor/limpeza: descarta
          }
          i = j + 1
          continue
        }
      }
      out.push({ ignored: true })                // ESC órfão
      i += 1
      continue
    }
    text += src[i]
    i += 1
  }
  if (text) out.push({ text })
  return out
}

function applySgr(style, params) {
  const s = { ...style }
  const p = params.length ? params : [0]
  let i = 0
  while (i < p.length) {
    const c = p[i]
    if (c === 0)            Object.keys(s).forEach(k => delete s[k])
    else if (c === 1)       s.bold = true
    else if (c === 4)       s.underline = true
    else if (c === 7)       s.reverse = true
    else if (c >= 30 && c <= 37)  s.fg = c - 30
    else if (c >= 90 && c <= 97)  s.fg = c - 90 + 8
    else if (c >= 40 && c <= 47)  s.bg = c - 40
    else if (c >= 100 && c <= 107) s.bg = c - 100 + 8
    else if (c === 39)      delete s.fg
    else if (c === 49)      delete s.bg
    else if (c === 38 || c === 48) {
      const k = c === 38 ? 'fg' : 'bg'
      if (p[i + 1] === 5) { s[k] = p[i + 2];  i += 3; continue }   // 256 cores
      if (p[i + 1] === 2) { s[k] = [p[i + 2], p[i + 3], p[i + 4]]; i += 3; continue }
      i += 1
    }
    i += 1
  }
  return s
}

// walk pelos tokens acumulando o estado → trechos {text, style}
// o CSS resulta de styleToCss({fg|bg|bold|dim|italic|underline|reverse})
`

const TRUE_COLORS = [
  { hex: '#4f46e5', r: 79, g: 70, b: 229 },
  { hex: '#2563eb', r: 37, g: 99, b: 235 },
  { hex: '#06b6d4', r: 6, g: 182, b: 212 },
  { hex: '#10b981', r: 16, g: 185, b: 129 },
  { hex: '#f59e0b', r: 245, g: 158, b: 11 },
  { hex: '#f97316', r: 249, g: 115, b: 22 },
  { hex: '#ef4444', r: 239, g: 68, b: 68 },
  { hex: '#ec4899', r: 236, g: 72, b: 153 },
  { hex: '#a855f7', r: 168, g: 85, b: 247 },
  { hex: '#8b5cf6', r: 139, g: 92, b: 246 },
]

export default function AnsiColorsPage() {
  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt

  const [text, setText] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const parsed = useMemo(() => parseAnsi(text || ''), [text])
  const cleanText = useMemo(() => parsed.runs.map((r) => r.text).join(''), [parsed])
  const palette256 = useMemo(() =>
    Array.from({ length: 256 }, (_, n) => {
      const [r, g, b] = xtermToRgb(n)
      const hex = rgbToHex(r, g, b)
      return { n, hex, numColor: contrastFor(hex) }
    })
  , [])

  const copy = async (value, okMsg) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(okMsg || t.copied)
    } catch {
      messageApi.error(t.copyErr)
    }
  }

  const basicPalette = BASIC_16.map((hex, i) => {
    const isBright = i >= 8
    const idx = isBright ? i - 8 : i
    const sgr = isBright ? 90 + idx : 30 + idx
    return { n: i, hex, sgr, bgSgr: isBright ? 100 + idx : 40 + idx }
  })

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.howTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.howBody}</Paragraph>
      </Card>

      <Card title={t.inputTitle}>
        <Input.TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
          autoSize={{ minRows: 5, maxRows: 12 }}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space style={{ marginTop: 12 }} wrap>
          <Text type="secondary">{t.examples}:</Text>
          {[t.ex1, t.ex2, t.ex3].map((label, idx) => (
            <Button key={label} size="small" onClick={() => setText(EXAMPLES[idx])}>{label}</Button>
          ))}
          <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>{t.clear}</Button>
        </Space>
      </Card>

      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }} wrap>
          <Text strong>{t.previewTitle}</Text>
          {text && (
            <Space size="small" wrap>
              <Tag color="blue">{parsed.sgrCount} {t.stats}</Tag>
              {parsed.ignoredCount > 0 && <Tag>{parsed.ignoredCount} {t.statsCtrl}</Tag>}
              <Tag>{parsed.runs.length} {t.segments}</Tag>
            </Space>
          )}
        </Space>
        <div style={{ background: '#0d1117', borderRadius: 6, padding: '12px 14px', minHeight: 100, overflow: 'auto' }}>
          {parsed.runs.length === 0 ? (
            <Text type="secondary" style={{ color: '#8b949e' }}>{t.noInput}</Text>
          ) : (
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#e6edf3' }}>
              {parsed.runs.map((r, idx) => (
                <span key={idx} style={styleToCss(r.style, '#e6edf3')}>{r.text}</span>
              ))}
            </pre>
          )}
        </div>
      </div>

      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }} wrap>
          <Text strong>{t.noTitle}</Text>
          {text && (
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cleanText, t.copyClean)}>
              {t.copy}
            </Button>
          )}
        </Space>
        <pre style={{ margin: 0, maxHeight: 160, overflow: 'auto', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '10px 12px', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {text ? cleanText : t.noInput}
        </pre>
      </div>

      <Divider />

      <Card title={t.sgrTableTitle} extra={<Text type="secondary">{t.sgrTableHint}</Text>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '4px 24px' }}>
          {(SGR_ROWS[lang] || SGR_ROWS.pt).map(([code, what]) => (
            <div key={code} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '3px 0' }}>
              <Text code style={{ minWidth: 120, display: 'inline-block', fontSize: 12 }}>{code}</Text>
              <span style={{ color: 'rgba(0,0,0,0.85)' }}>{what}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t.basicTitle} extra={<Text type="secondary">{t.basicHint}</Text>}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {basicPalette.map((c) => (
            <div
              key={c.hex}
              onClick={() => copy(`${ESC}[${c.sgr}m`)}
              title={`${ESC}[${c.sgr}m — ${ESC}[${c.bgSgr}m`}
              style={{ width: 104, cursor: 'pointer', border: '1px solid #f0f0f0', borderRadius: 6, padding: 6, textAlign: 'center', background: '#fafafa' }}
            >
              <div style={{ height: 30, borderRadius: 4, background: c.hex }} />
              <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 4 }}>{c.sgr}</div>
              <div style={{ fontSize: 10, color: '#999' }}>{c.hex}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t.xtermTitle} extra={<Text type="secondary">{t.xtermHint}</Text>}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {palette256.map((c) => (
            <div
              key={c.n}
              onClick={() => copy(`${ESC}[38;5;${c.n}m`)}
              title={`${ESC}[38;5;${c.n}m`}
              style={{ width: 22, height: 22, borderRadius: 3, background: c.hex, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontSize: 8, color: c.numColor, fontFamily: 'monospace' }}>
                {c.n}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t.trueTitle} extra={<Text type="secondary">{t.trueHint}</Text>}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TRUE_COLORS.map((c) => (
            <div
              key={c.hex}
              onClick={() => copy(`${ESC}[38;2;${c.r};${c.g};${c.b}m`)}
              title={`${ESC}[38;2;${c.r};${c.g};${c.b}m`}
              style={{ width: 128, cursor: 'pointer', border: '1px solid #f0f0f0', borderRadius: 6, padding: 6, textAlign: 'center', background: '#fafafa' }}
            >
              <div style={{ height: 30, borderRadius: 4, background: c.hex }} />
              <div style={{ fontFamily: 'monospace', fontSize: 10, marginTop: 4 }}>38;2;{c.r};{c.g};{c.b}</div>
            </div>
          ))}
        </div>
      </Card>

      <Collapse
        items={[{
          key: '1',
          label: <Text strong>{t.srcTitle}</Text>,
          children: (
            <>
              <Paragraph type="secondary">{t.srcBody}</Paragraph>
              <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.65, background: '#fafafa', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
                {SOURCE}
              </pre>
            </>
          ),
        }]}
      />
    </Space>
  )
}