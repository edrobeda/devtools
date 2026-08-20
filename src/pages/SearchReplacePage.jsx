import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Checkbox,
  Row,
  Col,
  Statistic,
  Alert,
  Segmented,
  Collapse,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  SwapOutlined,
  CopyOutlined,
  CheckOutlined,
  ClearOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildRegex,
  countMatches,
  findSegments,
  replaceAllMatches,
} from '../utils/searchReplace'

const { Title, Paragraph, Text } = Typography

// Código-fonte do motor exibido na própria página, como referência.
const SOURCE_SNIPPET = `// escape de metacaracteres quando o modo é texto puro
const pattern = literal ? find.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') : find
const wrapped = wholeWord ? \`\\\\b(?:\\\\\${pattern})\\\\b\` : pattern

let flags = 'g'          // busca todas as ocorrências
if (!caseSensitive) flags += 'i'
if (multiline)  flags += 'm'
if (dotAll)     flags += 's'

const regex = new RegExp(wrapped, flags)   // lança erro se o padrão for inválido

// contagem sem travar em matches de comprimento zero
let matches = 0
let m
while ((m = regex.exec(input)) !== null) {
  matches++
  if (m[0] === '') regex.lastIndex++
}

// destaque no preview: segmentos { text, match } reconstroem o texto original
// substituição com expansão manual de tokens: \$\$ → \$ , \$& → match, \$1..\$99 → grupo
const output = input.replace(regex, (...args) => expandReplacement(replacement, args))`

const SAMPLE_TEXT = [
  'Ada Lovelace',
  'Grace Hopper',
].join('\n')

const PRESETS = [
  {
    key: 'reverse-name',
    find: '^(\\S+)\\s+(\\S+)$',
    replacement: '$2, $1',
    literal: false,
    caseSensitive: false,
    wholeWord: false,
    multiline: true,
    dotAll: false,
    sample: 'Ada Lovelace\nGrace Hopper',
  },
  {
    key: 'markdown-url',
    find: '\\[([^\\]]+)\\]\\(([^)]+)\\)',
    replacement: '$2',
    literal: false,
    caseSensitive: false,
    wholeWord: false,
    multiline: false,
    dotAll: false,
    sample: 'Veja [docs](https://example.com/a) e o [repositório](https://example.com/b).',
  },
  {
    key: 'strip-html',
    find: '<[^>]+>',
    replacement: '',
    literal: false,
    caseSensitive: false,
    wholeWord: false,
    multiline: false,
    dotAll: false,
    sample: '<p>Olá <b>mundo</b> <span style="color:red">vermelho</span></p>',
  },
  {
    key: 'interpolate',
    find: '\\{\\{\\s*(\\w+)\\s*\\}\\}',
    replacement: '${$1}',
    literal: false,
    caseSensitive: false,
    wholeWord: false,
    multiline: false,
    dotAll: false,
    sample: 'Olá {{ nome }}, seu pedido {{ pedido }} foi enviado.',
  },
  {
    key: 'strip-log',
    find: '^\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\]\\s*',
    replacement: '',
    literal: false,
    caseSensitive: false,
    wholeWord: false,
    multiline: true,
    dotAll: false,
    sample: '[2026-08-20 10:00:01] iniciando serviço\n[2026-08-20 10:00:02] healthz 200\n[2026-08-20 10:00:03] job finalizado',
  },
  {
    key: 'trim-lines',
    find: '^\\s+|\\s+$',
    replacement: '',
    literal: false,
    caseSensitive: false,
    wholeWord: false,
    multiline: true,
    dotAll: false,
    sample: '  padded line  \n\tindented\n   spaced out   ',
  },
]

const translations = {
  pt: {
    title: 'Pesquisar & Substituir',
    intro: 'Localiza e substitui texto — em modo literal ou com expressão regular — com preview ao vivo das ocorrências destacadas, contagem de matches e suporte a grupos de captura ($1, $2…). Tudo client-side, em tempo real.',
    inputTitle: 'Texto de entrada',
    inputPlaceholder: 'Cole o texto aqui…',
    sample: 'Aplicar exemplo',
    clearInput: 'Limpar',
    configTitle: 'Busca & substituição',
    findLabel: 'Procurar',
    findPlaceholder: 'Texto ou padrão…',
    replaceLabel: 'Substituir por',
    replacePlaceholder: 'Texto de substituição (ex.: $2, $1)…',
    modeLiteral: 'Texto puro',
    modeRegex: 'Regex',
    optCase: 'Diferenciar maiúsc./minúsc.',
    optWhole: 'Palavra inteira',
    optMultiline: 'Multilinha (^ e $ por linha)',
    optDotAll: 'Ponto casa quebra de linha',
    presetsTitle: 'Exemplos rápidos',
    presets: {
      'reverse-name': 'Inverter nome',
      'markdown-url': 'Extrair URL de link',
      'strip-html': 'Remover tags HTML',
      'interpolate': 'Template → ${var}',
      'strip-log': 'Tirar timestamp de log',
      'trim-lines': 'Aparar pontas das linhas',
    },
    matches: 'correspondência(s)',
    of: 'de',
    previewTitle: 'Preview das ocorrências',
    previewEmpty: 'Digite algo para ver as ocorrências destacadas.',
    resultTitle: 'Resultado após substituir',
    resultEmpty: 'Sem busca ativa — defina o texto/padrão de busca.',
    replaced: 'substituição(ões) feita(s)',
    noMatch: 'Nenhuma correspondência encontrada.',
    invalidRegex: 'Expressão regular inválida: a busca não foi executada.',
    copyResult: 'Copiar resultado',
    replaceCopy: 'Substituir tudo e copiar',
    copied: 'Copiado!',
    alertTitle: 'Grupos de captura',
    alertBody: 'No modo regex, use $1, $2… no texto de substituição para inserir os grupos capturados; $& insere a ocorrência inteira e $$ um cifrão literal. No modo "Texto puro" os metacaracteres são escapados automaticamente.',
    sourceTitle: 'Como funciona (motor)',
  },
  en: {
    title: 'Search & Replace',
    intro: 'Finds and replaces text — literal or regex — with a live preview of highlighted matches, match count and capture-group support ($1, $2…). Fully client-side and real-time.',
    inputTitle: 'Input text',
    inputPlaceholder: 'Paste your text here…',
    sample: 'Apply sample',
    clearInput: 'Clear',
    configTitle: 'Find & replace',
    findLabel: 'Find',
    findPlaceholder: 'Text or pattern…',
    replaceLabel: 'Replace with',
    replacePlaceholder: 'Replacement text (e.g. $2, $1)…',
    modeLiteral: 'Literal',
    modeRegex: 'Regex',
    optCase: 'Case sensitive',
    optWhole: 'Whole word',
    optMultiline: 'Multiline (^ and $ per line)',
    optDotAll: 'Dot matches newlines',
    presetsTitle: 'Quick examples',
    presets: {
      'reverse-name': 'Swap first/last name',
      'markdown-url': 'Extract link URL',
      'strip-html': 'Strip HTML tags',
      'interpolate': 'Template → ${var}',
      'strip-log': 'Drop log timestamps',
      'trim-lines': 'Trim line edges',
    },
    matches: 'match(es)',
    of: 'of',
    previewTitle: 'Match preview',
    previewEmpty: 'Type something to see the highlighted matches.',
    resultTitle: 'Result after replace',
    resultEmpty: 'No active search — set the search text/pattern.',
    replaced: 'replacement(s) made',
    noMatch: 'No matches found.',
    invalidRegex: 'Invalid regular expression: the search was not executed.',
    copyResult: 'Copy result',
    replaceCopy: 'Replace all and copy',
    copied: 'Copied!',
    alertTitle: 'Capture groups',
    alertBody: 'In regex mode use $1, $2… in the replacement text to insert captured groups; $& inserts the full match and $$ a literal dollar. In literal mode special characters are escaped automatically.',
    sourceTitle: 'Under the hood (engine)',
  },
}

export default function SearchReplacePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLE_TEXT)
  const [find, setFind] = useState(PRESETS[0].find)
  const [replacement, setReplacement] = useState(PRESETS[0].replacement)
  const [literal, setLiteral] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [multiline, setMultiline] = useState(true)
  const [dotAll, setDotAll] = useState(false)
  const [copied, setCopied] = useState(false)

  const state = useMemo(() => {
    let regex = null
    let error = null
    try {
      regex = buildRegex(find, { literal, caseSensitive, wholeWord, multiline, dotAll })
    } catch (e) {
      error = e instanceof RangeError ? e.message : String(e)
    }
    const matches = regex && !error ? countMatches(input, regex) : 0
    const segments = regex && !error ? findSegments(input, regex) : [{ text: input, match: false }]
    const output = regex && !error ? replaceAllMatches(input, regex, replacement) : input
    return { regex, error, matches, segments, output }
  }, [input, find, replacement, literal, caseSensitive, wholeWord, multiline, dotAll])

  const hasResult = state.output !== '' && state.matches > 0

  function applyPreset(p) {
    setFind(p.find)
    setReplacement(p.replacement)
    setLiteral(p.literal)
    setCaseSensitive(p.caseSensitive)
    setWholeWord(p.wholeWord)
    setMultiline(p.multiline)
    setDotAll(p.dotAll)
    setInput(p.sample)
    setCopied(false)
  }

  async function handleCopy() {
    if (!state.output) return
    try {
      await navigator.clipboard.writeText(state.output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SearchOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.inputTitle}
        extra={
          <Space>
            <Button size="small" icon={<ExperimentOutlined />} onClick={() => { setInput(''); setCopied(false) }}>{t.clearInput}</Button>
          </Space>
        }
      >
        <Input.TextArea
          rows={7}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.inputPlaceholder}
        />
      </Card>

      <Card title={t.configTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} md={8}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>{t.findLabel}</Text>
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={find}
                onChange={(e) => setFind(e.target.value)}
                placeholder={t.findPlaceholder}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>{t.replaceLabel}</Text>
              <Input
                allowClear
                prefix={<SwapOutlined style={{ color: '#bfbfbf' }} />}
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder={t.replacePlaceholder}
              />
            </Col>
            <Col xs={24} md={8}>
              <Segmented
                block
                options={[
                  { label: t.modeLiteral, value: 'literal' },
                  { label: t.modeRegex, value: 'regex' },
                ]}
                value={literal ? 'literal' : 'regex'}
                onChange={(v) => setLiteral(v === 'literal')}
              />
            </Col>
          </Row>

          <Space size="large" wrap>
            <Checkbox checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)}>{t.optCase}</Checkbox>
            <Checkbox checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)}>{t.optWhole}</Checkbox>
            <Checkbox checked={multiline} onChange={(e) => setMultiline(e.target.checked)}>{t.optMultiline}</Checkbox>
            <Checkbox checked={dotAll} onChange={(e) => setDotAll(e.target.checked)}>{t.optDotAll}</Checkbox>
          </Space>

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t.presetsTitle}</Text>
            <Space size={[8, 8]} wrap>
              {PRESETS.map((p) => (
                <Tooltip key={p.key} title={p.replacement ? `${p.find} → ${p.replacement}` : p.find}>
                  <Button size="small" icon={<ThunderboltOutlined />} onClick={() => applyPreset(p)}>
                    {t.presets[p.key]}
                  </Button>
                </Tooltip>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      {state.error ? (
        <Alert type="error" message={t.invalidRegex} description={state.error} showIcon />
      ) : (
        <Alert type="info" message={t.alertTitle} description={t.alertBody} showIcon />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={t.previewTitle}
            extra={
              <Text type="secondary">
                {t.matches}: <b>{state.matches}</b>
              </Text>
            }
          >
            <div style={{ maxHeight: 280, overflow: 'auto' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {state.regex && input ? (
                  state.segments.map((seg, i) =>
                    seg.match ? (
                      <mark key={i} style={{ background: 'rgba(250, 173, 20, 0.45)', borderRadius: 3, padding: '0 1px' }}>
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  )
                ) : (
                  <Text type="secondary">{t.previewEmpty}</Text>
                )}
              </pre>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={t.resultTitle}
            extra={
              <Button
                type="primary"
                size="small"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
                disabled={state.output === ''}
              >
                {copied ? t.copied : t.copyResult}
              </Button>
            }
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', maxHeight: 280, overflow: 'auto' }}>
              {hasResult ? state.output : <Text type="secondary">{state.regex && input ? (state.matches === 0 ? t.noMatch : t.resultEmpty) : t.resultEmpty}</Text>}
            </pre>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title={t.matches} value={state.matches} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title={t.replaced} value={hasResult ? state.matches : 0} />
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}><code>{SOURCE_SNIPPET}</code></pre>
            ),
          },
        ]}
      />
    </Space>
  )
}