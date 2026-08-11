import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
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
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildEditorConfig, PRESETS } from '../utils/editorconfigGenerator'

const { Title, Paragraph, Text } = Typography

const INDENT_STYLES = [
  { value: 'space', label: 'space' },
  { value: 'tab', label: 'tab' },
]

const END_OF_LINES = [
  { value: 'lf', label: 'lf' },
  { value: 'crlf', label: 'crlf' },
  { value: 'cr', label: 'cr' },
]

const CHARSETS = [
  { value: 'utf-8', label: 'utf-8' },
  { value: 'utf-8-bom', label: 'utf-8-bom' },
  { value: 'latin1', label: 'latin1' },
  { value: 'utf-16be', label: 'utf-16be' },
  { value: 'utf-16le', label: 'utf-16le' },
]

const EMPTY_SECTION = {
  glob: '',
  indentStyle: '',
  indentSize: '',
  tabWidth: '',
  endOfLine: '',
  charset: '',
  trimTrailingWhitespace: '',
  insertFinalNewline: '',
  maxLineLength: '',
}

const SOURCE = `
function buildEditorConfig(o) {
  const lines = []
  if (o.root) lines.push('root = true')
  if (lines.length) lines.push('')

  lines.push('[*]')
  if (o.indentStyle) lines.push(\`indent_style = \${o.indentStyle}\`)
  if (o.indentSize !== '') lines.push(\`indent_size = \${o.indentSize}\`)
  if (o.tabWidth !== '') lines.push(\`tab_width = \${o.tabWidth}\`)
  if (o.endOfLine) lines.push(\`end_of_line = \${o.endOfLine}\`)
  if (o.charset) lines.push(\`charset = \${o.charset}\`)
  if (o.trimTrailingWhitespace !== '')
    lines.push(\`trim_trailing_whitespace = \${o.trimTrailingWhitespace}\`)
  if (o.insertFinalNewline !== '')
    lines.push(\`insert_final_newline = \${o.insertFinalNewline}\`)
  if (o.maxLineLength !== '')
    lines.push(\`max_line_length = \${o.maxLineLength}\`)

  for (const s of o.sections || []) {
    if (!s.glob) continue
    lines.push('')
    lines.push(\`[\${s.glob}]\`)
    if (s.indentStyle) lines.push(\`indent_style = \${s.indentStyle}\`)
    if (s.indentSize !== '') lines.push(\`indent_size = \${s.indentSize}\`)
    if (s.tabWidth !== '') lines.push(\`tab_width = \${s.tabWidth}\`)
    if (s.endOfLine) lines.push(\`end_of_line = \${s.endOfLine}\`)
    if (s.charset) lines.push(\`charset = \${s.charset}\`)
    if (s.trimTrailingWhitespace !== '')
      lines.push(\`trim_trailing_whitespace = \${s.trimTrailingWhitespace}\`)
    if (s.insertFinalNewline !== '')
      lines.push(\`insert_final_newline = \${s.insertFinalNewline}\`)
    if (s.maxLineLength !== '')
      lines.push(\`max_line_length = \${s.maxLineLength}\`)
  }

  return lines.join('\\n')
}
`

const translations = {
  pt: {
    title: 'Gerador de .editorconfig',
    intro:
      'Monta um arquivo .editorconfig válido para padronizar indentação, quebras de linha, charset e espaços em branco entre editores e IDEs. Tudo acontece no navegador — nenhum dado sai daqui.',
    presets: 'Modelos de um clique',
    root: 'root = true',
    rootHint: 'Define este arquivo como o mais próximo da raiz do projeto.',
    indentStyle: 'Estilo de indentação',
    indentSize: 'Tamanho da indentação',
    tabWidth: 'Largura do tab',
    tabWidthHint: 'Só necessário quando indent_style = tab.',
    endOfLine: 'Fim de linha',
    charset: 'Charset',
    trimTrailingWhitespace: 'Remover espaços no fim da linha',
    insertFinalNewline: 'Inserir nova linha no final do arquivo',
    maxLineLength: 'Limite de colunas',
    maxLineLengthPlaceholder: 'off ou número',
    sections: 'Seções por padrão (glob)',
    sectionsHint: 'Use padrões como *.py ou *.{js,ts} para sobrescrever regras em arquivos específicos.',
    addSection: 'Adicionar seção',
    glob: 'Padrão (glob)',
    globPlaceholder: '*.{ext}',
    copy: 'Copiar',
    copied: '.editorconfig copiado!',
    download: 'Baixar .editorconfig',
    downloadName: '.editorconfig',
    output: '.editorconfig gerado',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildEditorConfig monta a string linha a linha: cabeçalho root, seção global [*] e uma seção extra para cada glob, ignorando valores vazios.',
    tipsTitle: 'Dicas do EditorConfig',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>root = true</Text> para o arquivo na raiz do projeto; subpastas com{' '}
          <Text code>.editorconfig</Text> próprio herdam o que não for sobrescrito.
        </li>
        <li>
          <Text strong>indent_size</Text> e <Text strong>tab_width</Text> são diferentes: o
          primeiro define quantos espaços a tecla Tab representa; o segundo, a largura visual de
          um caractere tab.
        </li>
        <li>
          <Text strong>max_line_length</Text> aceita <Text code>off</Text> ou um número.
          Editores respeitam a regra de formatação automática (rulers/soft wrap).
        </li>
        <li>
          <Text strong>trim_trailing_whitespace</Text> pode ser desligado para Markdown, onde
          dois espaços no fim da linha forçam uma quebra.
        </li>
      </ul>
    ),
    booleanOptions: {
      '': '—',
      true: 'true',
      false: 'false',
    },
  },
  en: {
    title: '.editorconfig Generator',
    intro:
      'Builds a valid .editorconfig file to standardize indentation, line endings, charset and whitespace across editors and IDEs. Everything happens in the browser — no data leaves this page.',
    presets: 'One-click templates',
    root: 'root = true',
    rootHint: 'Mark this file as the closest to the project root.',
    indentStyle: 'Indent style',
    indentSize: 'Indent size',
    tabWidth: 'Tab width',
    tabWidthHint: 'Only needed when indent_style = tab.',
    endOfLine: 'End of line',
    charset: 'Charset',
    trimTrailingWhitespace: 'Trim trailing whitespace',
    insertFinalNewline: 'Insert final newline',
    maxLineLength: 'Max line length',
    maxLineLengthPlaceholder: 'off or number',
    sections: 'Sections by glob pattern',
    sectionsHint: 'Use patterns like *.py or *.{js,ts} to override rules for specific files.',
    addSection: 'Add section',
    glob: 'Pattern (glob)',
    globPlaceholder: '*.{ext}',
    copy: 'Copy',
    copied: '.editorconfig copied!',
    download: 'Download .editorconfig',
    downloadName: '.editorconfig',
    output: 'Generated .editorconfig',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildEditorConfig builds the string line by line: root header, global [*] section, and one extra section per glob, skipping empty values.',
    tipsTitle: 'EditorConfig tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>root = true</Text> for the file at the project root; subfolders with
          their own <Text code>.editorconfig</Text> inherit values unless overridden.
        </li>
        <li>
          <Text strong>indent_size</Text> and <Text strong>tab_width</Text> are different: the
          first sets how many spaces the Tab key represents; the second sets the visual width of
          a tab character.
        </li>
        <li>
          <Text strong>max_line_length</Text> accepts <Text code>off</Text> or a number.
          Editors use it for rulers and soft wrap.
        </li>
        <li>
          <Text strong>trim_trailing_whitespace</Text> can be disabled for Markdown, where two
          trailing spaces force a line break.
        </li>
      </ul>
    ),
    booleanOptions: {
      '': '—',
      true: 'true',
      false: 'false',
    },
  },
}

export default function EditorconfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({ ...PRESETS.generic })
  const [activePreset, setActivePreset] = useState('generic')

  const output = useMemo(() => buildEditorConfig(options), [options])
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

  const updateSection = (index, field, value) => {
    setOptions((prev) => {
      const next = { ...prev }
      next.sections = next.sections.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
      return next
    })
    setActivePreset('')
  }

  const addSection = () => {
    setOptions((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...EMPTY_SECTION }],
    }))
    setActivePreset('')
  }

  const removeSection = (index) => {
    setOptions((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }))
    setActivePreset('')
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  const boolOptions = [
    { value: '', label: t.booleanOptions[''] },
    { value: 'true', label: t.booleanOptions.true },
    { value: 'false', label: t.booleanOptions.false },
  ]

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
          <Card title={t.output}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch
                  checked={options.root}
                  onChange={(v) => updateField('root', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.root}</Text>
                <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}>
                  {t.rootHint}
                </Paragraph>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.indentStyle}</Text>
                <Radio.Group
                  value={options.indentStyle}
                  onChange={(e) => updateField('indentStyle', e.target.value)}
                  options={INDENT_STYLES}
                />
              </div>

              <Row gutter={[12, 12]}>
                <Col xs={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.indentSize}</Text>
                  <Input
                    value={options.indentSize}
                    onChange={(e) => updateField('indentSize', e.target.value)}
                    placeholder="2"
                  />
                </Col>
                <Col xs={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.tabWidth}</Text>
                  <Input
                    value={options.tabWidth}
                    onChange={(e) => updateField('tabWidth', e.target.value)}
                    placeholder="4"
                  />
                  <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}>
                    {t.tabWidthHint}
                  </Paragraph>
                </Col>
              </Row>

              <Row gutter={[12, 12]}>
                <Col xs={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.endOfLine}</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={options.endOfLine}
                    onChange={(v) => updateField('endOfLine', v)}
                    options={END_OF_LINES}
                  />
                </Col>
                <Col xs={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.charset}</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={options.charset}
                    onChange={(v) => updateField('charset', v)}
                    options={CHARSETS}
                  />
                </Col>
              </Row>

              <div>
                <Switch
                  checked={options.trimTrailingWhitespace}
                  onChange={(v) => updateField('trimTrailingWhitespace', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.trimTrailingWhitespace}</Text>
              </div>

              <div>
                <Switch
                  checked={options.insertFinalNewline}
                  onChange={(v) => updateField('insertFinalNewline', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.insertFinalNewline}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.maxLineLength}</Text>
                <Input
                  value={options.maxLineLength}
                  onChange={(e) => updateField('maxLineLength', e.target.value)}
                  placeholder={t.maxLineLengthPlaceholder}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                {t.sections}
                <Tag>{options.sections.length}</Tag>
              </Space>
            }
            extra={
              <Button size="small" icon={<PlusOutlined />} onClick={addSection}>
                {t.addSection}
              </Button>
            }
          >
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
              {t.sectionsHint}
            </Paragraph>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {options.sections.map((section, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 12,
                    background: '#fafafa',
                  }}
                >
                  <Row gutter={[12, 12]} align="bottom">
                    <Col xs={24}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.glob}</Text>
                      <Input
                        value={section.glob}
                        onChange={(e) => updateSection(index, 'glob', e.target.value)}
                        placeholder={t.globPlaceholder}
                      />
                    </Col>
                    <Col xs={12}>
                      <Select
                        style={{ width: '100%' }}
                        value={section.indentStyle}
                        onChange={(v) => updateSection(index, 'indentStyle', v)}
                        options={[{ value: '', label: 'indent_style —' }, ...INDENT_STYLES]}
                      />
                    </Col>
                    <Col xs={12}>
                      <Input
                        value={section.indentSize}
                        onChange={(e) => updateSection(index, 'indentSize', e.target.value)}
                        placeholder="indent_size"
                      />
                    </Col>
                    <Col xs={12}>
                      <Select
                        style={{ width: '100%' }}
                        value={section.endOfLine}
                        onChange={(v) => updateSection(index, 'endOfLine', v)}
                        options={[{ value: '', label: 'end_of_line —' }, ...END_OF_LINES]}
                      />
                    </Col>
                    <Col xs={12}>
                      <Select
                        style={{ width: '100%' }}
                        value={section.charset}
                        onChange={(v) => updateSection(index, 'charset', v)}
                        options={[{ value: '', label: 'charset —' }, ...CHARSETS]}
                      />
                    </Col>
                    <Col xs={12}>
                      <Select
                        style={{ width: '100%' }}
                        value={String(section.trimTrailingWhitespace)}
                        onChange={(v) => updateSection(index, 'trimTrailingWhitespace', v)}
                        options={boolOptions.map((o) => ({
                          ...o,
                          label: `trim_trailing_whitespace ${o.label}`,
                        }))}
                      />
                    </Col>
                    <Col xs={12}>
                      <Select
                        style={{ width: '100%' }}
                        value={String(section.insertFinalNewline)}
                        onChange={(v) => updateSection(index, 'insertFinalNewline', v)}
                        options={boolOptions.map((o) => ({
                          ...o,
                          label: `insert_final_newline ${o.label}`,
                        }))}
                      />
                    </Col>
                    <Col xs={24} style={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeSection(index)}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
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
          <code>{output || '# .editorconfig'}</code>
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
