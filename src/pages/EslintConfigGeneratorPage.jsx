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
  Tag,
  message,
  Divider,
  Checkbox,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildEslintConfig,
  PRESETS,
  CONFIG_TYPES,
  ENVIRONMENTS,
  EXTENDS_OPTIONS,
  PLUGINS_OPTIONS,
  PARSER_OPTIONS,
  ECMA_VERSION_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  AVAILABLE_RULES,
  RULE_LEVELS,
} from '../utils/eslintConfigGenerator'

const { Title, Paragraph, Text } = Typography

const SOURCE = `
export function buildEslintConfig(options) {
  const opts = { ...DEFAULT_PRESET, ...options }
  const configType = opts.configType || 'flat'

  if (configType === 'legacy') {
    return buildLegacyConfig(opts)
  }
  return buildFlatConfig(opts)
}

function buildFlatConfig(options) {
  const configs = []
  const jsConfig = { name: 'Base JS config' }

  // environments -> globals/flags
  const env = Array.isArray(options.environments)
    ? options.environments
    : []
  if (env.includes('browser')) jsConfig.browser = true
  if (env.includes('node')) jsConfig.node = true

  // languageOptions
  const languageOptions = {
    ecmaVersion: options.ecmaVersion || 'latest',
    sourceType: options.sourceType || 'module',
  }
  if (options.parser) languageOptions.parser = options.parser
  if (options.jsx) {
    languageOptions.parserOptions = { ecmaFeatures: { jsx: true } }
  }
  jsConfig.languageOptions = languageOptions

  // extends, plugins, rules, settings
  if (options.extends?.length) jsConfig.extends = options.extends
  if (options.plugins?.length) jsConfig.plugins = options.plugins
  const rules = {}
  options.rules?.forEach((r) => {
    if (r.level && r.level !== 'off') rules[r.name] = r.level
  })
  if (Object.keys(rules).length) jsConfig.rules = rules

  configs.push(jsConfig)
  if (options.ignores?.length) {
    configs.push({ name: 'Ignores', ignores: options.ignores })
  }

  return '/** @type {import("eslint").Linter.Config[]} */\\n'
    + 'export default [\\n'
    + configs.map((cfg) => '  ' + JSON.stringify(cfg, null, 2)).join(',\\n')
    + '\\n];\\n'
}
`

const translations = {
  pt: {
    title: 'Gerador de Configuração ESLint',
    intro:
      'Monta arquivos eslint.config.js (flat config) ou .eslintrc.json (legacy) 100% no navegador. Escolha presets, ambiente, plugins, parser e regras; o arquivo gerado está pronto para copiar ou baixar.',
    presets: 'Modelos de um clique',
    configType: 'Tipo de configuração',
    environments: 'Ambientes',
    extends: 'Extends',
    plugins: 'Plugins',
    parser: 'Parser',
    ecmaVersion: 'ecmaVersion',
    sourceType: 'sourceType',
    jsx: 'Habilitar JSX',
    reactVersion: 'React version',
    lintFiles: 'Arquivos a lintar (globs)',
    ignores: 'Ignorar (globs)',
    rules: 'Regras',
    noRules: 'Nenhuma regra ativa. Adicione regras pelo preset ou manualmente.',
    addRule: 'Adicionar regra',
    output: 'Configuração gerada',
    copy: 'Copiar',
    copied: 'Configuração copiada!',
    downloadFlat: 'Baixar eslint.config.js',
    downloadLegacy: 'Baixar .eslintrc.json',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildEslintConfig monta um objeto de configuração para flat config ou legacy a partir das opções escolhidas, converte regras em um mapa de níveis e serializa a saída como JavaScript ou JSON.',
    tipsTitle: 'Dicas de ESLint',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          A <Text code>flat config</Text> (eslint.config.js) é o formato moderno a partir do ESLint v9. A legacy (.eslintrc.json) ainda é suportada mas está depreciada.
        </li>
        <li>
          Use <Text code>plugin:prettier/recommended</Text> para integrar Prettier sem conflitos de regras de formatação.
        </li>
        <li>
          Projetos React modernos costumam desligar <Text code>react/react-in-jsx-scope</Text> porque o novo transform do JSX não exige importar React.
        </li>
        <li>
          TypeScript exige o parser <Text code>@typescript-eslint/parser</Text> e o plugin <Text code>@typescript-eslint</Text> para regras específicas.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'ESLint Config Generator',
    intro:
      'Builds eslint.config.js (flat config) or .eslintrc.json (legacy) files 100% in the browser. Choose presets, environment, plugins, parser and rules; the generated file is ready to copy or download.',
    presets: 'One-click templates',
    configType: 'Configuration type',
    environments: 'Environments',
    extends: 'Extends',
    plugins: 'Plugins',
    parser: 'Parser',
    ecmaVersion: 'ecmaVersion',
    sourceType: 'sourceType',
    jsx: 'Enable JSX',
    reactVersion: 'React version',
    lintFiles: 'Files to lint (globs)',
    ignores: 'Ignore (globs)',
    rules: 'Rules',
    noRules: 'No active rules. Add rules from a preset or manually.',
    addRule: 'Add rule',
    output: 'Generated configuration',
    copy: 'Copy',
    copied: 'Configuration copied!',
    downloadFlat: 'Download eslint.config.js',
    downloadLegacy: 'Download .eslintrc.json',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildEslintConfig builds a flat or legacy configuration object from the selected options, converts rules into a level map and serializes the output as JavaScript or JSON.',
    tipsTitle: 'ESLint tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>Flat config</Text> (eslint.config.js) is the modern format since ESLint v9. Legacy (.eslintrc.json) is still supported but deprecated.
        </li>
        <li>
          Use <Text code>plugin:prettier/recommended</Text> to integrate Prettier without conflicting formatting rules.
        </li>
        <li>
          Modern React projects usually turn off <Text code>react/react-in-jsx-scope</Text> because the new JSX transform does not require importing React.
        </li>
        <li>
          TypeScript requires the parser <Text code>@typescript-eslint/parser</Text> and the plugin <Text code>@typescript-eslint</Text> for TS-specific rules.
        </li>
      </ul>
    ),
  },
}

function commaStringToArray(value) {
  if (!value || typeof value !== 'string') return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function arrayToCommaString(arr) {
  if (!Array.isArray(arr)) return ''
  return arr.join(', ')
}

export default function EslintConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({ ...PRESETS.recommended })
  const [activePreset, setActivePreset] = useState('recommended')
  const [lintFilesStr, setLintFilesStr] = useState(
    arrayToCommaString(PRESETS.recommended.lintFiles)
  )
  const [ignoresStr, setIgnoresStr] = useState(
    arrayToCommaString(PRESETS.recommended.ignores)
  )

  const buildOptions = useMemo(() => {
    return {
      ...options,
      lintFiles: commaStringToArray(lintFilesStr),
      ignores: commaStringToArray(ignoresStr),
    }
  }, [options, lintFilesStr, ignoresStr])

  const output = useMemo(() => buildEslintConfig(buildOptions), [buildOptions])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setActivePreset(key)
    setOptions({ ...preset })
    setLintFilesStr(arrayToCommaString(preset.lintFiles))
    setIgnoresStr(arrayToCommaString(preset.ignores))
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
    const isFlat = options.configType === 'flat'
    const blob = new Blob([output], {
      type: isFlat ? 'application/javascript' : 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isFlat ? 'eslint.config.js' : '.eslintrc.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const addRule = () => {
    const current = Array.isArray(options.rules) ? [...options.rules] : []
    current.push({ name: 'no-unused-vars', level: 'warn' })
    updateField('rules', current)
  }

  const updateRule = (index, key, value) => {
    const current = Array.isArray(options.rules) ? [...options.rules] : []
    current[index] = { ...current[index], [key]: value }
    updateField('rules', current)
  }

  const removeRule = (index) => {
    const current = Array.isArray(options.rules) ? [...options.rules] : []
    current.splice(index, 1)
    updateField('rules', current)
  }

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
        <Col xs={24} lg={12}>
          <Card title={t.configType}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Select
                style={{ width: '100%' }}
                value={options.configType}
                onChange={(v) => updateField('configType', v)}
                options={CONFIG_TYPES.map((o) => ({
                  value: o.value,
                  label: o.label[lang],
                }))}
              />

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.environments}
                </Text>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  value={options.environments}
                  onChange={(v) => updateField('environments', v)}
                  options={ENVIRONMENTS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.extends}
                </Text>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  value={options.extends}
                  onChange={(v) => updateField('extends', v)}
                  options={EXTENDS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.plugins}
                </Text>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  value={options.plugins}
                  onChange={(v) => updateField('plugins', v)}
                  options={PLUGINS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.parser}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.parser}
                  onChange={(v) => updateField('parser', v)}
                  options={PARSER_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.value ? o.label : o.label[lang],
                  }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.ecmaVersion}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.ecmaVersion}
                  onChange={(v) => updateField('ecmaVersion', v)}
                  options={ECMA_VERSION_OPTIONS.map((o) => ({ value: o, label: String(o) }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.sourceType}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.sourceType}
                  onChange={(v) => updateField('sourceType', v)}
                  options={SOURCE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Switch
                  checked={options.jsx}
                  onChange={(v) => updateField('jsx', v)}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.jsx}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.reactVersion}
                </Text>
                <Input
                  value={options.reactVersion}
                  onChange={(e) => updateField('reactVersion', e.target.value)}
                  placeholder="detect"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.lintFiles}
                </Text>
                <Input
                  value={lintFilesStr}
                  onChange={(e) => {
                    setLintFilesStr(e.target.value)
                    setActivePreset('')
                  }}
                  placeholder="src/**/*.{js,jsx}"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.ignores}
                </Text>
                <Input
                  value={ignoresStr}
                  onChange={(e) => {
                    setIgnoresStr(e.target.value)
                    setActivePreset('')
                  }}
                  placeholder="dist, build, node_modules"
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={t.rules}
            extra={
              <Button size="small" icon={<CodeOutlined />} onClick={addRule}>
                {t.addRule}
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {(!Array.isArray(options.rules) || options.rules.length === 0) && (
                <Paragraph type="secondary">{t.noRules}</Paragraph>
              )}

              {Array.isArray(options.rules) &&
                options.rules.map((rule, index) => (
                  <Row key={index} gutter={[8, 8]} align="middle">
                    <Col flex="auto">
                      <Select
                        style={{ width: '100%' }}
                        value={rule.name}
                        onChange={(v) => updateRule(index, 'name', v)}
                        options={AVAILABLE_RULES.map((r) => ({
                          value: r.name,
                          label: r.name,
                        }))}
                        showSearch
                        filterOption={(input, option) =>
                          option?.value?.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Col>
                    <Col flex="100px">
                      <Select
                        style={{ width: '100%' }}
                        value={rule.level}
                        onChange={(v) => updateRule(index, 'level', v)}
                        options={RULE_LEVELS.map((l) => ({
                          value: l.value,
                          label: l.label,
                        }))}
                      />
                    </Col>
                    <Col flex="40px">
                      <Button size="small" danger onClick={() => removeRule(index)}>
                        ×
                      </Button>
                    </Col>
                  </Row>
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
            <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>
              {t.copy}
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadOutput}>
              {options.configType === 'flat' ? t.downloadFlat : t.downloadLegacy}
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
