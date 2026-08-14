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
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildTsconfig,
  PRESETS,
  TARGET_OPTIONS,
  MODULE_OPTIONS,
  MODULE_RESOLUTION_OPTIONS,
  JSX_OPTIONS,
  LIB_OPTIONS,
} from '../utils/tsconfigGenerator'

const { Title, Paragraph, Text } = Typography

const SOURCE = `
export function buildTsconfig(options) {
  const opts = { ...DEFAULT_PRESET, ...options }
  const compilerOptions = {}
  const out = {}

  if (opts.includeSchema) {
    out.$schema = 'https://json.schemastore.org/tsconfig'
  }

  if (opts.target) compilerOptions.target = opts.target
  if (opts.module) compilerOptions.module = opts.module
  if (opts.moduleResolution) compilerOptions.moduleResolution = opts.moduleResolution
  if (opts.jsx) compilerOptions.jsx = opts.jsx
  if (opts.lib?.length) compilerOptions.lib = opts.lib

  // strict family
  if (typeof opts.strict === 'boolean') compilerOptions.strict = opts.strict
  if (typeof opts.noImplicitAny === 'boolean') compilerOptions.noImplicitAny = opts.noImplicitAny
  // ... (demais flags)

  if (Object.keys(compilerOptions).length > 0) out.compilerOptions = compilerOptions
  if (opts.include?.length) out.include = opts.include
  if (opts.exclude?.length) out.exclude = opts.exclude

  return JSON.stringify(out, null, 2)
}
`

const translations = {
  pt: {
    title: 'Gerador de tsconfig.json',
    intro:
      'Monta um arquivo tsconfig.json válido para padronizar a compilação do TypeScript no projeto. Tudo acontece no navegador — nenhum dado sai daqui.',
    presets: 'Modelos de um clique',
    compilerOptions: 'Opções do compilador',
    projectOptions: 'Opções do projeto',
    includeSchema: 'Incluir "$schema"',
    target: 'Target (versão do JS)',
    module: 'Módulo',
    moduleResolution: 'Resolução de módulo',
    lib: 'Libs',
    jsx: 'JSX',
    strict: 'Strict mode (mestre)',
    strictFlags: 'Flags do strict',
    noImplicitAny: 'noImplicitAny',
    strictNullChecks: 'strictNullChecks',
    strictFunctionTypes: 'strictFunctionTypes',
    strictBindCallApply: 'strictBindCallApply',
    strictPropertyInitialization: 'strictPropertyInitialization',
    noImplicitThis: 'noImplicitThis',
    alwaysStrict: 'alwaysStrict',
    checkFlags: 'Checagens adicionais',
    noUnusedLocals: 'noUnusedLocals',
    noUnusedParameters: 'noUnusedParameters',
    noImplicitReturns: 'noImplicitReturns',
    noFallthroughCasesInSwitch: 'noFallthroughCasesInSwitch',
    interop: 'Interoperação de módulos',
    esModuleInterop: 'esModuleInterop',
    allowSyntheticDefaultImports: 'allowSyntheticDefaultImports',
    forceConsistentCasingInFileNames: 'forceConsistentCasingInFileNames',
    skipLibCheck: 'skipLibCheck',
    resolveJsonModule: 'resolveJsonModule',
    isolatedModules: 'isolatedModules',
    verbatimModuleSyntax: 'verbatimModuleSyntax',
    preserveConstEnums: 'preserveConstEnums',
    emit: 'Emissão de arquivos',
    declaration: 'declaration',
    declarationMap: 'declarationMap',
    sourceMap: 'sourceMap',
    noEmit: 'noEmit',
    incremental: 'incremental',
    removeComments: 'removeComments',
    outDir: 'outDir',
    rootDir: 'rootDir',
    baseUrl: 'baseUrl',
    paths: 'paths (JSON)',
    include: 'include (separado por vírgula)',
    exclude: 'exclude (separado por vírgula)',
    output: 'tsconfig.json gerado',
    copy: 'Copiar',
    copied: 'tsconfig.json copiado!',
    download: 'Baixar tsconfig.json',
    downloadName: 'tsconfig.json',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildTsconfig monta o objeto compilerOptions a partir das opções escolhidas e emite JSON.stringify(out, null, 2). Strings vazias e arrays vazios são ignorados para manter o arquivo enxuto.',
    tipsTitle: 'Dicas do tsconfig.json',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>"strict": true</Text> ativa a maioria das checagens rigorosas de uma só vez; você ainda pode desligar flags individualmente abaixo dele.
        </li>
        <li>
          Projetos React/Vite modernos costumam usar <Text code>"moduleResolution": "bundler"</Text> e <Text code>"jsx": "react-jsx"</Text>.
        </li>
        <li>
          <Text code>"noEmit": true</Text> é comum quando você usa TypeScript só para checagem (ex.: Vite transpila o código por conta própria).
        </li>
        <li>
          O campo <Text code>paths</Text> deve ser um objeto JSON válido, por exemplo <Text code>{"{\"@/*\": [\"./src/*\"]}"}</Text>.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'tsconfig.json Generator',
    intro:
      'Builds a valid tsconfig.json file to standardize TypeScript compilation in your project. Everything happens in the browser — no data leaves this page.',
    presets: 'One-click templates',
    compilerOptions: 'Compiler options',
    projectOptions: 'Project options',
    includeSchema: 'Include "$schema"',
    target: 'Target (JS version)',
    module: 'Module',
    moduleResolution: 'Module resolution',
    lib: 'Libs',
    jsx: 'JSX',
    strict: 'Strict mode (master)',
    strictFlags: 'Strict flags',
    noImplicitAny: 'noImplicitAny',
    strictNullChecks: 'strictNullChecks',
    strictFunctionTypes: 'strictFunctionTypes',
    strictBindCallApply: 'strictBindCallApply',
    strictPropertyInitialization: 'strictPropertyInitialization',
    noImplicitThis: 'noImplicitThis',
    alwaysStrict: 'alwaysStrict',
    checkFlags: 'Additional checks',
    noUnusedLocals: 'noUnusedLocals',
    noUnusedParameters: 'noUnusedParameters',
    noImplicitReturns: 'noImplicitReturns',
    noFallthroughCasesInSwitch: 'noFallthroughCasesInSwitch',
    interop: 'Module interop',
    esModuleInterop: 'esModuleInterop',
    allowSyntheticDefaultImports: 'allowSyntheticDefaultImports',
    forceConsistentCasingInFileNames: 'forceConsistentCasingInFileNames',
    skipLibCheck: 'skipLibCheck',
    resolveJsonModule: 'resolveJsonModule',
    isolatedModules: 'isolatedModules',
    verbatimModuleSyntax: 'verbatimModuleSyntax',
    preserveConstEnums: 'preserveConstEnums',
    emit: 'File emit',
    declaration: 'declaration',
    declarationMap: 'declarationMap',
    sourceMap: 'sourceMap',
    noEmit: 'noEmit',
    incremental: 'incremental',
    removeComments: 'removeComments',
    outDir: 'outDir',
    rootDir: 'rootDir',
    baseUrl: 'baseUrl',
    paths: 'paths (JSON)',
    include: 'include (comma separated)',
    exclude: 'exclude (comma separated)',
    output: 'Generated tsconfig.json',
    copy: 'Copy',
    copied: 'tsconfig.json copied!',
    download: 'Download tsconfig.json',
    downloadName: 'tsconfig.json',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildTsconfig builds the compilerOptions object from the selected options and outputs JSON.stringify(out, null, 2). Empty strings and empty arrays are skipped to keep the file concise.',
    tipsTitle: 'tsconfig.json tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>"strict": true</Text> enables most strict checks at once; you can still toggle individual flags below it.
        </li>
        <li>
          Modern React/Vite projects usually use <Text code>"moduleResolution": "bundler"</Text> and <Text code>"jsx": "react-jsx"</Text>.
        </li>
        <li>
          <Text code>"noEmit": true</Text> is common when TypeScript is used only for type checking (e.g. Vite transpiles the code itself).
        </li>
        <li>
          The <Text code>paths</Text> field must be valid JSON, e.g. <Text code>{"{\"@/*\": [\"./src/*\"]}"}</Text>.
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

export default function TsconfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({ ...PRESETS.default })
  const [activePreset, setActivePreset] = useState('default')
  const [includeStr, setIncludeStr] = useState(arrayToCommaString(PRESETS.default.include))
  const [excludeStr, setExcludeStr] = useState(arrayToCommaString(PRESETS.default.exclude))

  const buildOptions = useMemo(() => {
    return {
      ...options,
      include: commaStringToArray(includeStr),
      exclude: commaStringToArray(excludeStr),
    }
  }, [options, includeStr, excludeStr])

  const output = useMemo(() => buildTsconfig(buildOptions), [buildOptions])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setActivePreset(key)
    setOptions({ ...preset })
    setIncludeStr(arrayToCommaString(preset.include))
    setExcludeStr(arrayToCommaString(preset.exclude))
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

  const renderSwitch = (field) => (
    <div key={field}>
      <Switch
        checked={options[field]}
        onChange={(v) => updateField(field, v)}
        style={{ marginRight: 8 }}
      />
      <Text>{t[field]}</Text>
    </div>
  )

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
          <Card title={t.compilerOptions}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.target}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.target}
                  onChange={(v) => updateField('target', v)}
                  options={TARGET_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.module}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.module}
                  onChange={(v) => updateField('module', v)}
                  options={MODULE_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.moduleResolution}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.moduleResolution}
                  onChange={(v) => updateField('moduleResolution', v)}
                  options={MODULE_RESOLUTION_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.jsx}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.jsx}
                  onChange={(v) => updateField('jsx', v)}
                  options={JSX_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.lib}</Text>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  value={options.lib}
                  onChange={(v) => updateField('lib', v)}
                  options={LIB_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {renderSwitch('strict')}

              <div style={{ paddingLeft: 24 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t.strictFlags}</Text>
                <Space direction="vertical">
                  {renderSwitch('noImplicitAny')}
                  {renderSwitch('strictNullChecks')}
                  {renderSwitch('strictFunctionTypes')}
                  {renderSwitch('strictBindCallApply')}
                  {renderSwitch('strictPropertyInitialization')}
                  {renderSwitch('noImplicitThis')}
                  {renderSwitch('alwaysStrict')}
                </Space>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t.checkFlags}</Text>
              <Space direction="vertical">
                {renderSwitch('noUnusedLocals')}
                {renderSwitch('noUnusedParameters')}
                {renderSwitch('noImplicitReturns')}
                {renderSwitch('noFallthroughCasesInSwitch')}
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.projectOptions}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t.interop}</Text>
              <Space direction="vertical">
                {renderSwitch('esModuleInterop')}
                {renderSwitch('allowSyntheticDefaultImports')}
                {renderSwitch('forceConsistentCasingInFileNames')}
                {renderSwitch('skipLibCheck')}
                {renderSwitch('resolveJsonModule')}
                {renderSwitch('isolatedModules')}
                {renderSwitch('verbatimModuleSyntax')}
                {renderSwitch('preserveConstEnums')}
              </Space>

              <Divider style={{ margin: '8px 0' }} />

              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t.emit}</Text>
              <Space direction="vertical">
                {renderSwitch('declaration')}
                {renderSwitch('declarationMap')}
                {renderSwitch('sourceMap')}
                {renderSwitch('noEmit')}
                {renderSwitch('incremental')}
                {renderSwitch('removeComments')}
              </Space>

              <Divider style={{ margin: '8px 0' }} />

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.outDir}</Text>
                <Input
                  value={options.outDir}
                  onChange={(e) => updateField('outDir', e.target.value)}
                  placeholder="./dist"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.rootDir}</Text>
                <Input
                  value={options.rootDir}
                  onChange={(e) => updateField('rootDir', e.target.value)}
                  placeholder="./src"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.baseUrl}</Text>
                <Input
                  value={options.baseUrl}
                  onChange={(e) => updateField('baseUrl', e.target.value)}
                  placeholder="."
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.paths}</Text>
                <Input
                  value={options.paths}
                  onChange={(e) => updateField('paths', e.target.value)}
                  placeholder='{"@/*": ["./src/*"]}'
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.include}</Text>
                <Input
                  value={includeStr}
                  onChange={(e) => {
                    setIncludeStr(e.target.value)
                    setActivePreset('')
                  }}
                  placeholder="src/**/*"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.exclude}</Text>
                <Input
                  value={excludeStr}
                  onChange={(e) => {
                    setExcludeStr(e.target.value)
                    setActivePreset('')
                  }}
                  placeholder="node_modules, dist, build"
                />
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
