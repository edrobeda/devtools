import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Input,
  Select,
  Switch,
  Table,
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
import { buildMakefile, PRESETS } from '../utils/makefileGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const TAB_OPTIONS = [
  { value: 'tab', label: { pt: 'Tab real (\\t)', en: 'Real tab (\\t)' } },
  { value: '2', label: { pt: '2 espaços', en: '2 spaces' } },
  { value: '4', label: { pt: '4 espaços', en: '4 spaces' } },
]

const SOURCE = `
function indentCommand(command, indent) {
  const prefix = typeof indent === 'number' ? ' '.repeat(indent) : indent
  return command
    .split('\\n')
    .map((line) => prefix + line)
    .join('\\n')
}

function renderVariable(v) {
  const lines = []
  if (v.comment) lines.push(\`# \${v.comment}\`)
  lines.push(\`\${v.name} = \${v.value}\`)
  return lines.join('\\n')
}

function renderTarget(t, indent) {
  const lines = []
  if (t.comment) lines.push(\`# \${t.comment}\`)
  const deps = t.depends ? \` \${t.depends}\` : ''
  lines.push(\`\${t.name}:\${deps}\`)
  if (t.commands && t.commands.length > 0) {
    lines.push(
      t.commands.map((cmd) => indentCommand(cmd, indent)).join('\\n')
    )
  }
  return lines.join('\\n')
}

export function buildMakefile(options) {
  const opts = {
    tabSize: 'tab',
    includePhony: true,
    includeHelp: true,
    sortTargets: false,
    header: '',
    variables: [],
    targets: [],
    ...options,
  }

  const indent = opts.tabSize === 'tab'
    ? '\\t'
    : ' '.repeat(Number(opts.tabSize) || 2)

  let variables = (opts.variables || []).filter((v) => v.name.trim() !== '')
  let targets = (opts.targets || []).filter((t) => t.name.trim() !== '')

  if (opts.sortTargets) {
    targets = [...targets].sort((a, b) => a.name.localeCompare(b.name))
  }

  const out = []
  if (opts.header && opts.header.trim()) {
    out.push(opts.header.trim())
    out.push('')
  }
  if (variables.length > 0) {
    out.push(variables.map(renderVariable).join('\\n\\n'))
    out.push('')
  }
  const phonyNames = targets.filter((t) => t.phony).map((t) => t.name)
  if (opts.includePhony && phonyNames.length > 0) {
    out.push(\`.PHONY: \${phonyNames.join(' ')}\`)
    out.push('')
  }
  if (targets.length > 0) {
    out.push(targets.map((t) => renderTarget(t, indent)).join('\\n\\n'))
    out.push('')
  }
  return out.join('\\n').trimEnd() + '\\n'
}
`

const translations = {
  pt: {
    title: 'Gerador de Makefile',
    intro:
      'Monta um Makefile pronto para usar a partir de variáveis e targets editáveis. Tudo acontece no navegador — nenhum dado sai daqui.',
    presets: 'Modelos de um clique',
    variables: 'Variáveis',
    addVariable: 'Adicionar variável',
    targets: 'Targets',
    addTarget: 'Adicionar target',
    options: 'Opções',
    output: 'Makefile gerado',
    copy: 'Copiar',
    copied: 'Makefile copiado!',
    download: 'Baixar Makefile',
    downloadName: 'Makefile',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildMakefile recebe variáveis, targets e opções de formatação e emite o texto do Makefile respeitando tabs reais ou espaços, a diretiva .PHONY e a ordenação opcional.',
    tipsTitle: 'Dicas de Makefile',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Cada linha de comando em um target <Text strong>deve começar com um tab</Text>, não com espaços — é a regra mais comum de erro.
        </li>
        <li>
          A diretiva <Text code>.PHONY</Text> lista targets que não geram arquivos (como <Text code>build</Text> ou <Text code>clean</Text>), evitando conflitos quando existe um arquivo com o mesmo nome.
        </li>
        <li>
          Use <Text code>$(NOME)</Text> para expandir variáveis e <Text code>$@</Text> / <Text code>$&lt;</Text> para as variáveis automáticas de target e primeira dependência.
        </li>
        <li>
          Targets com <Text code>@</Text> no início do comando (ex.: <Text code>@echo</Text>) não imprimem a linha de comando antes de executá-la.
        </li>
      </ul>
    ),
    tabSize: 'Indentação dos comandos',
    includePhony: 'Incluir .PHONY automaticamente',
    sortTargets: 'Ordenar targets alfabeticamente',
    header: 'Cabeçalho / comentário inicial',
    variableName: 'Nome',
    variableValue: 'Valor',
    variableComment: 'Comentário',
    targetName: 'Nome',
    targetDepends: 'Dependências',
    targetComment: 'Comentário',
    targetPhony: '.PHONY',
    targetCommands: 'Comandos',
    emptyVariables: 'Nenhuma variável definida.',
    emptyTargets: 'Nenhum target definido.',
    remove: 'Remover',
  },
  en: {
    title: 'Makefile Generator',
    intro:
      'Builds a ready-to-use Makefile from editable variables and targets. Everything happens in the browser — no data leaves this page.',
    presets: 'One-click templates',
    variables: 'Variables',
    addVariable: 'Add variable',
    targets: 'Targets',
    addTarget: 'Add target',
    options: 'Options',
    output: 'Generated Makefile',
    copy: 'Copy',
    copied: 'Makefile copied!',
    download: 'Download Makefile',
    downloadName: 'Makefile',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildMakefile takes variables, targets and formatting options and emits the Makefile text, honoring real tabs or spaces, the .PHONY directive and optional sorting.',
    tipsTitle: 'Makefile tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Each command line in a target <Text strong>must start with a tab</Text>, not spaces — this is the most common source of errors.
        </li>
        <li>
          The <Text code>.PHONY</Text> directive lists targets that do not produce files (like <Text code>build</Text> or <Text code>clean</Text>), preventing conflicts when a file has the same name.
        </li>
        <li>
          Use <Text code>$(NAME)</Text> to expand variables and <Text code>$@</Text> / <Text code>$&lt;</Text> for the automatic target and first-dependency variables.
        </li>
        <li>
          Targets with <Text code>@</Text> at the start of a command (e.g. <Text code>@echo</Text>) do not print the command line before running it.
        </li>
      </ul>
    ),
    tabSize: 'Command indentation',
    includePhony: 'Automatically include .PHONY',
    sortTargets: 'Sort targets alphabetically',
    header: 'Header / initial comment',
    variableName: 'Name',
    variableValue: 'Value',
    variableComment: 'Comment',
    targetName: 'Name',
    targetDepends: 'Dependencies',
    targetComment: 'Comment',
    targetPhony: '.PHONY',
    targetCommands: 'Commands',
    emptyVariables: 'No variables defined.',
    emptyTargets: 'No targets defined.',
    remove: 'Remove',
  },
}

export default function MakefileGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [activePreset, setActivePreset] = useState('generic')
  const [variables, setVariables] = useState(() =>
    PRESETS.generic.variables.map((v) => ({ ...v }))
  )
  const [targets, setTargets] = useState(() =>
    PRESETS.generic.targets.map((t) => ({ ...t, commands: [...t.commands] }))
  )
  const [options, setOptions] = useState({
    tabSize: 'tab',
    includePhony: true,
    sortTargets: false,
    header: '',
  })

  const output = useMemo(
    () =>
      buildMakefile({
        ...options,
        variables,
        targets,
      }),
    [options, variables, targets]
  )
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setActivePreset(key)
    setVariables(preset.variables.map((v) => ({ ...v })))
    setTargets(
      preset.targets.map((t) => ({ ...t, commands: [...t.commands] }))
    )
  }

  const updateVariable = (index, field, value) => {
    setVariables((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
    setActivePreset('')
  }

  const addVariable = () => {
    setVariables((prev) => [...prev, { name: '', value: '', comment: '' }])
    setActivePreset('')
  }

  const removeVariable = (index) => {
    setVariables((prev) => prev.filter((_, i) => i !== index))
    setActivePreset('')
  }

  const updateTarget = (index, field, value) => {
    setTargets((prev) =>
      prev.map((target, i) =>
        i === index ? { ...target, [field]: value } : target
      )
    )
    setActivePreset('')
  }

  const updateTargetCommands = (index, value) => {
    setTargets((prev) =>
      prev.map((target, i) =>
        i === index ? { ...target, commands: value.split('\n') } : target
      )
    )
    setActivePreset('')
  }

  const addTarget = () => {
    setTargets((prev) => [
      ...prev,
      { name: '', depends: '', commands: [''], comment: '', phony: false },
    ])
    setActivePreset('')
  }

  const removeTarget = (index) => {
    setTargets((prev) => prev.filter((_, i) => i !== index))
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

  const variableColumns = [
    {
      title: t.variableName,
      dataIndex: 'name',
      key: 'name',
      render: (_, __, index) => (
        <Input
          value={variables[index].name}
          onChange={(e) => updateVariable(index, 'name', e.target.value)}
          placeholder="NAME"
        />
      ),
    },
    {
      title: t.variableValue,
      dataIndex: 'value',
      key: 'value',
      render: (_, __, index) => (
        <Input
          value={variables[index].value}
          onChange={(e) => updateVariable(index, 'value', e.target.value)}
          placeholder="value"
        />
      ),
    },
    {
      title: t.variableComment,
      dataIndex: 'comment',
      key: 'comment',
      render: (_, __, index) => (
        <Input
          value={variables[index].comment}
          onChange={(e) => updateVariable(index, 'comment', e.target.value)}
          placeholder="opcional"
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, __, index) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeVariable(index)}
          title={t.remove}
        />
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FileTextOutlined /> {t.title}
      </Title>
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
        <Col xs={24} lg={14}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card
              title={t.variables}
              extra={
                <Button size="small" icon={<PlusOutlined />} onClick={addVariable}>
                  {t.addVariable}
                </Button>
              }
            >
              <Table
                dataSource={variables.map((v, i) => ({ ...v, key: i }))}
                columns={variableColumns}
                pagination={false}
                size="small"
                locale={{ emptyText: t.emptyVariables }}
              />
            </Card>

            <Card
              title={t.targets}
              extra={
                <Button size="small" icon={<PlusOutlined />} onClick={addTarget}>
                  {t.addTarget}
                </Button>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {targets.map((target, index) => (
                  <Card
                    key={index}
                    type="inner"
                    size="small"
                    title={
                      <Space>
                        <Input
                          value={target.name}
                          onChange={(e) => updateTarget(index, 'name', e.target.value)}
                          placeholder={t.targetName}
                          style={{ width: 160 }}
                        />
                        <Text type="secondary">:</Text>
                        <Input
                          value={target.depends}
                          onChange={(e) => updateTarget(index, 'depends', e.target.value)}
                          placeholder={t.targetDepends}
                          style={{ width: 180 }}
                        />
                      </Space>
                    }
                    extra={
                      <Space>
                        <Text type="secondary">{t.targetPhony}</Text>
                        <Switch
                          size="small"
                          checked={target.phony}
                          onChange={(v) => updateTarget(index, 'phony', v)}
                        />
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeTarget(index)}
                          title={t.remove}
                        />
                      </Space>
                    }
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Input
                        value={target.comment}
                        onChange={(e) => updateTarget(index, 'comment', e.target.value)}
                        placeholder={t.targetComment}
                      />
                      <TextArea
                        value={target.commands.join('\n')}
                        onChange={(e) => updateTargetCommands(index, e.target.value)}
                        placeholder={t.targetCommands}
                        rows={3}
                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </Space>
                  </Card>
                ))}
                {targets.length === 0 && (
                  <Paragraph type="secondary">{t.emptyTargets}</Paragraph>
                )}
              </Space>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={t.options}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.tabSize}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.tabSize}
                  onChange={(v) => setOptions((prev) => ({ ...prev, tabSize: v }))}
                >
                  {TAB_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label[lang]}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Switch
                  checked={options.includePhony}
                  onChange={(v) =>
                    setOptions((prev) => ({ ...prev, includePhony: v }))
                  }
                  style={{ marginRight: 8 }}
                />
                <Text>{t.includePhony}</Text>
              </div>

              <div>
                <Switch
                  checked={options.sortTargets}
                  onChange={(v) =>
                    setOptions((prev) => ({ ...prev, sortTargets: v }))
                  }
                  style={{ marginRight: 8 }}
                />
                <Text>{t.sortTargets}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.header}
                </Text>
                <TextArea
                  value={options.header}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, header: e.target.value }))
                  }
                  rows={4}
                  placeholder="# Makefile gerado automaticamente"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
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
            <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>
              {t.copy}
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadOutput}>
              {t.download}
            </Button>
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
            maxHeight: 480,
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
