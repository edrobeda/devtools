import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  InputNumber,
  Select,
  Switch,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Radio,
  Tag,
  message,
  Divider,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildPrettierrc, PRESETS } from '../utils/prettierrcGenerator'

const { Title, Paragraph, Text } = Typography

const TRAILING_COMMA_OPTIONS = [
  { value: 'es5', label: 'es5' },
  { value: 'all', label: 'all' },
  { value: 'none', label: 'none' },
]

const ARROW_PARENS_OPTIONS = [
  { value: 'always', label: 'always' },
  { value: 'avoid', label: 'avoid' },
]

const END_OF_LINE_OPTIONS = [
  { value: 'lf', label: 'lf' },
  { value: 'crlf', label: 'crlf' },
  { value: 'cr', label: 'cr' },
  { value: 'auto', label: 'auto' },
]

const QUOTE_PROPS_OPTIONS = [
  { value: 'as-needed', label: 'as-needed' },
  { value: 'consistent', label: 'consistent' },
  { value: 'preserve', label: 'preserve' },
]

const PROSE_WRAP_OPTIONS = [
  { value: 'preserve', label: 'preserve' },
  { value: 'always', label: 'always' },
  { value: 'never', label: 'never' },
]

const HTML_WS_OPTIONS = [
  { value: 'css', label: 'css' },
  { value: 'strict', label: 'strict' },
  { value: 'ignore', label: 'ignore' },
]

const EMBEDDED_LANG_OPTIONS = [
  { value: 'auto', label: 'auto' },
  { value: 'off', label: 'off' },
]

const SOURCE = `
const DEFAULT_PRESET = PRESETS.default

export function buildPrettierrc(options) {
  const opts = { ...DEFAULT_PRESET, ...options }
  const out = {}

  if (opts.includeSchema) {
    out.\$schema = 'https://json.schemastore.org/prettierrc'
  }

  if (opts.printWidth != null && opts.printWidth !== '') {
    out.printWidth = Number(opts.printWidth)
  }
  if (opts.tabWidth != null && opts.tabWidth !== '') {
    out.tabWidth = Number(opts.tabWidth)
  }

  if (typeof opts.semi === 'boolean') out.semi = opts.semi
  if (typeof opts.singleQuote === 'boolean') out.singleQuote = opts.singleQuote
  if (typeof opts.useTabs === 'boolean') out.useTabs = opts.useTabs
  if (typeof opts.bracketSpacing === 'boolean') out.bracketSpacing = opts.bracketSpacing
  if (typeof opts.bracketSameLine === 'boolean') out.bracketSameLine = opts.bracketSameLine
  if (typeof opts.jsxSingleQuote === 'boolean') out.jsxSingleQuote = opts.jsxSingleQuote
  if (typeof opts.singleAttributePerLine === 'boolean') {
    out.singleAttributePerLine = opts.singleAttributePerLine
  }

  if (opts.trailingComma) out.trailingComma = opts.trailingComma
  if (opts.arrowParens) out.arrowParens = opts.arrowParens
  if (opts.endOfLine) out.endOfLine = opts.endOfLine
  if (opts.quoteProps) out.quoteProps = opts.quoteProps
  if (opts.proseWrap) out.proseWrap = opts.proseWrap
  if (opts.htmlWhitespaceSensitivity) out.htmlWhitespaceSensitivity = opts.htmlWhitespaceSensitivity
  if (opts.embeddedLanguageFormatting) out.embeddedLanguageFormatting = opts.embeddedLanguageFormatting

  if (Object.keys(out).length === 0) {
    out.printWidth = 80
    out.tabWidth = 2
    out.semi = true
    out.singleQuote = false
  }

  return JSON.stringify(out, null, 2)
}
`

const translations = {
  pt: {
    title: 'Gerador de .prettierrc',
    intro:
      'Monta um arquivo .prettierrc (JSON) válido para padronizar a formatação do Prettier no projeto. Tudo acontece no navegador — nenhum dado sai daqui.',
    presets: 'Modelos de um clique',
    includeSchema: 'Incluir "$schema"',
    printWidth: 'Largura máxima (printWidth)',
    tabWidth: 'Largura do tab (tabWidth)',
    useTabs: 'Usar tabs em vez de espaços',
    semi: 'Inserir ponto-e-vírgula',
    singleQuote: 'Usar aspas simples',
    jsxSingleQuote: 'Aspas simples no JSX',
    trailingComma: 'Vírgula no final',
    bracketSpacing: 'Espaço dentro de chaves',
    bracketSameLine: 'Fecha-tag no mesma linha',
    arrowParens: 'Parênteses em arrow function',
    endOfLine: 'Fim de linha',
    quoteProps: 'Aspas em propriedades de objeto',
    proseWrap: 'Quebra de linha em Markdown',
    htmlWhitespaceSensitivity: 'Sensibilidade a whitespace HTML',
    embeddedLanguageFormatting: 'Formatar código embutido',
    singleAttributePerLine: 'Um atributo por linha',
    output: '.prettierrc gerado',
    copy: 'Copiar',
    copied: '.prettierrc copiado!',
    download: 'Baixar .prettierrc',
    downloadName: '.prettierrc',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildPrettierrc monta um objeto JavaScript a partir das opções escolhidas e emite JSON.stringify(out, null, 2). Valores vazios são ignorados para manter o arquivo enxuto.',
    tipsTitle: 'Dicas do .prettierrc',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          O nome do arquivo pode ser <Text code>.prettierrc</Text> (JSON),{' '}
          <Text code>.prettierrc.json</Text> ou a chave <Text code>prettier</Text>{' '}
          no <Text code>package.json</Text>.
        </li>
        <li>
          <Text strong>printWidth</Text> não é um limite rígido: o Prettier tenta
          respeitá-lo, mas não quebra expressões só porque passou um caractere.
        </li>
        <li>
          <Text strong>trailingComma: 'all'</Text> gera diffs menores ao adicionar
          itens em objetos/arrays, mas exige parseadores modernos.
        </li>
        <li>
          <Text strong>useTabs</Text> é a escolha de acessibilidade: cada
          desenvolvedor vê o tab com a largura que preferir no editor.
        </li>
      </ul>
    ),
  },
  en: {
    title: '.prettierrc Generator',
    intro:
      'Builds a valid .prettierrc (JSON) file to standardize Prettier formatting in your project. Everything happens in the browser — no data leaves this page.',
    presets: 'One-click templates',
    includeSchema: 'Include "$schema"',
    printWidth: 'Max line width (printWidth)',
    tabWidth: 'Tab width (tabWidth)',
    useTabs: 'Use tabs instead of spaces',
    semi: 'Semicolons',
    singleQuote: 'Single quotes',
    jsxSingleQuote: 'JSX single quotes',
    trailingComma: 'Trailing commas',
    bracketSpacing: 'Spacing inside brackets',
    bracketSameLine: 'Closing bracket same line',
    arrowParens: 'Arrow function parentheses',
    endOfLine: 'End of line',
    quoteProps: 'Quote object properties',
    proseWrap: 'Markdown line wrapping',
    htmlWhitespaceSensitivity: 'HTML whitespace sensitivity',
    embeddedLanguageFormatting: 'Format embedded code',
    singleAttributePerLine: 'One attribute per line',
    output: 'Generated .prettierrc',
    copy: 'Copy',
    copied: '.prettierrc copied!',
    download: 'Download .prettierrc',
    downloadName: '.prettierrc',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildPrettierrc builds a JavaScript object from the selected options and outputs JSON.stringify(out, null, 2). Empty values are skipped to keep the file concise.',
    tipsTitle: '.prettierrc tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          The file can be named <Text code>.prettierrc</Text> (JSON),{' '}
          <Text code>.prettierrc.json</Text> or use the <Text code>prettier</Text>{' '}
          key in <Text code>package.json</Text>.
        </li>
        <li>
          <Text strong>printWidth</Text> is not a hard limit: Prettier tries to
          respect it, but it will not break an expression just because it
          exceeds the width by one character.
        </li>
        <li>
          <Text strong>trailingComma: 'all'</Text> produces smaller diffs when
          adding items to objects/arrays, but requires modern parsers.
        </li>
        <li>
          <Text strong>useTabs</Text> is the accessibility-friendly choice: each
          developer sees tabs with their preferred width in their editor.
        </li>
      </ul>
    ),
  },
}

export default function PrettierrcGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({ ...PRESETS.default })
  const [activePreset, setActivePreset] = useState('default')

  const output = useMemo(() => buildPrettierrc(options), [options])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setActivePreset(key)
    setOptions({ ...preset })
  }

  const updateField = (field, value) => {
    setOptions((prev) => ({ ...prev, [field]: value }))
    setActivePreset('')
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      <Card title={t.presets}>
        <Space wrap>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              type={activePreset === key ? 'primary' : 'default'}
              size="small"
              onClick={() => applyPreset(key)}
            >
              {preset.label[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[12, 12]}>
                <Col xs={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.printWidth}</Text>
                  <InputNumber
                    min={1}
                    max={1000}
                    style={{ width: '100%' }}
                    value={options.printWidth}
                    onChange={(v) => updateField('printWidth', v)}
                  />
                </Col>
                <Col xs={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.tabWidth}</Text>
                  <InputNumber
                    min={1}
                    max={16}
                    style={{ width: '100%' }}
                    value={options.tabWidth}
                    onChange={(v) => updateField('tabWidth', v)}
                  />
                </Col>
              </Row>

              <div>
                <Switch
                  checked={options.useTabs}
                  onChange={(v) => updateField('useTabs', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.useTabs}</Text>
              </div>

              <div>
                <Switch
                  checked={options.semi}
                  onChange={(v) => updateField('semi', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.semi}</Text>
              </div>

              <div>
                <Switch
                  checked={options.singleQuote}
                  onChange={(v) => updateField('singleQuote', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.singleQuote}</Text>
              </div>

              <div>
                <Switch
                  checked={options.jsxSingleQuote}
                  onChange={(v) => updateField('jsxSingleQuote', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.jsxSingleQuote}</Text>
              </div>

              <div>
                <Switch
                  checked={options.bracketSpacing}
                  onChange={(v) => updateField('bracketSpacing', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.bracketSpacing}</Text>
              </div>

              <div>
                <Switch
                  checked={options.bracketSameLine}
                  onChange={(v) => updateField('bracketSameLine', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.bracketSameLine}</Text>
              </div>

              <div>
                <Switch
                  checked={options.singleAttributePerLine}
                  onChange={(v) => updateField('singleAttributePerLine', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.singleAttributePerLine}</Text>
              </div>

              <div>
                <Switch
                  checked={options.includeSchema}
                  onChange={(v) => updateField('includeSchema', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.includeSchema}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.trailingComma}</Text>
                <Radio.Group
                  value={options.trailingComma}
                  onChange={(e) => updateField('trailingComma', e.target.value)}
                  options={TRAILING_COMMA_OPTIONS}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.arrowParens}</Text>
                <Radio.Group
                  value={options.arrowParens}
                  onChange={(e) => updateField('arrowParens', e.target.value)}
                  options={ARROW_PARENS_OPTIONS}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.endOfLine}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.endOfLine}
                  onChange={(v) => updateField('endOfLine', v)}
                  options={END_OF_LINE_OPTIONS}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.quoteProps}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.quoteProps}
                  onChange={(v) => updateField('quoteProps', v)}
                  options={QUOTE_PROPS_OPTIONS}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.proseWrap}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.proseWrap}
                  onChange={(v) => updateField('proseWrap', v)}
                  options={PROSE_WRAP_OPTIONS}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.htmlWhitespaceSensitivity}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.htmlWhitespaceSensitivity}
                  onChange={(v) => updateField('htmlWhitespaceSensitivity', v)}
                  options={HTML_WS_OPTIONS}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.embeddedLanguageFormatting}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.embeddedLanguageFormatting}
                  onChange={(v) => updateField('embeddedLanguageFormatting', v)}
                  options={EMBEDDED_LANG_OPTIONS}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>{t.copy}</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadOutput}>{t.download}</Button>
          </Space>
        }
      >
        <pre
          style={{
            margin: 0,
            overflowX: 'auto',
            background: '#0d1117',
            color: '#e6edf3',
            padding: 12,
            borderRadius: 8,
            maxHeight: 420,
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          <code>{output}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{SOURCE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
