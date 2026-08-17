import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Checkbox,
  message,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildViteConfig,
  PRESETS,
  FILE_TYPES,
  FRAMEWORKS,
  PLUGINS,
  MINIFY_OPTIONS,
  LOG_LEVEL_OPTIONS,
  LIB_FORMAT_OPTIONS,
} from '../utils/viteConfigGenerator'

const { Title, Paragraph, Text } = Typography

const SOURCE = `
export function buildViteConfig(options) {
  const opts = { ...PRESETS.minimal, ...options }
  const imports = collectImports(opts)

  const lines = []
  lines.push("import { defineConfig } from 'vite'")
  imports.forEach((imp) => {
    lines.push('import ' + imp.name + " from '" + imp.from + "'")
  })
  lines.push('')
  lines.push('export default defineConfig({')

  const fields = []
  if (opts.base && opts.base !== '/') {
    fields.push('  base: ' + JSON.stringify(opts.base))
  }
  if (opts.envPrefix && opts.envPrefix !== 'VITE_') {
    fields.push('  envPrefix: ' + JSON.stringify(opts.envPrefix))
  }
  if (opts.clearScreen === false) fields.push('  clearScreen: false')
  if (opts.logLevel && opts.logLevel !== 'info') {
    fields.push('  logLevel: ' + JSON.stringify(opts.logLevel))
  }
  if (opts.define) {
    const define = safeParseJson(opts.define)
    if (define) fields.push('  define: ' + stringifyObject(define))
  }
  if (imports.length) {
    const calls = imports.map((imp) => imp.name + '()')
    fields.push('  plugins: [' + calls.join(', ') + ']')
  }
  const aliasObj = opts.alias ? safeParseJson(opts.alias) : null
  if (aliasObj) {
    fields.push('  resolve: {\\n    alias: ' + stringifyObject(aliasObj) + '\\n  }')
  }
  const serverFields = []
  if (opts.port && Number(opts.port) !== 5173) {
    serverFields.push('    port: ' + Number(opts.port))
  }
  if (opts.open) serverFields.push('    open: true')
  if (opts.hmr === false) serverFields.push('    hmr: false')
  if (opts.proxy) {
    const proxy = safeParseJson(opts.proxy)
    if (proxy) serverFields.push('    proxy: ' + stringifyObject(proxy))
  }
  if (serverFields.length) {
    fields.push('  server: {\\n' + serverFields.join(',\\n') + '\\n  }')
  }
  const buildFields = []
  if (opts.outDir && opts.outDir !== 'dist') {
    buildFields.push('    outDir: ' + JSON.stringify(opts.outDir))
  }
  if (opts.sourcemap) buildFields.push('    sourcemap: true')
  if (opts.minify === false || opts.minify === 'false') {
    buildFields.push('    minify: false')
  } else if (opts.minify && opts.minify !== 'esbuild') {
    buildFields.push('    minify: ' + JSON.stringify(opts.minify))
  }
  if (opts.libMode) {
    buildFields.push('    lib: { ... }')
  }
  if (buildFields.length) {
    fields.push('  build: {\\n' + buildFields.join(',\\n') + '\\n  }')
  }

  lines.push(fields.join(',\\n'))
  lines.push('})')
  return lines.join('\\n')
}
`

const translations = {
  pt: {
    title: 'Gerador de Configuração Vite',
    intro:
      'Monta um arquivo vite.config.(js|ts|mjs|cjs) 100% no navegador. Escolha o framework, plugins, opções de servidor/build e alias; o preview atualiza ao vivo e está pronto para copiar ou baixar.',
    presets: 'Modelos de um clique',
    fileType: 'Extensão do arquivo',
    framework: 'Framework',
    plugins: 'Plugins',
    base: 'base (caminho público)',
    envPrefix: 'prefixo das variáveis de ambiente',
    clearScreen: 'Limpar tela no start',
    logLevel: 'logLevel',
    define: 'define (objeto JSON)',
    alias: 'resolve.alias (objeto JSON)',
    proxy: 'server.proxy (objeto JSON)',
    server: 'Servidor de dev',
    port: 'port',
    open: 'Abrir navegador',
    hmr: 'HMR ativado',
    css: 'CSS',
    cssModules: 'CSS Modules (camelCase)',
    cssDevSourcemap: 'devSourcemap do CSS',
    postcss: 'Incluir postcss: {}',
    optimizeDeps: 'optimizeDeps.include (vírgulas)',
    build: 'Build',
    outDir: 'outDir',
    sourcemap: 'sourcemap',
    minify: 'minify',
    libMode: 'Modo biblioteca (lib)',
    libEntry: 'lib.entry',
    libName: 'lib.name',
    libFileName: 'lib.fileName',
    libFormats: 'lib.formats',
    output: 'vite.config gerado',
    copy: 'Copiar',
    copied: 'Configuração copiada!',
    download: 'Baixar',
    downloadName: (ext) => `vite.config.${ext}`,
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildViteConfig coleta os imports dos plugins selecionados, monta os blocos server/build/resolve/css/define/lib e serializa tudo como um arquivo Vite válido. Objetos JSON são parseados no navegador e ignorados quando inválidos.',
    tipsTitle: 'Dicas de Vite',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Use <Text code>base</Text> quando o app for servido de um subdiretório (ex.: <Text code>/app/</Text>).
        </li>
        <li>
          Projetos React modernos preferem <Text code>@vitejs/plugin-react-swc</Text> por builds mais rápidos.
        </li>
        <li>
          O modo biblioteca exige <Text code>lib.entry</Text>, <Text code>lib.name</Text> e <Text code>formats</Text>; lembre-se de adicionar <Text code>rollupOptions.external</Text> para dependências peer.
        </li>
        <li>
          Variáveis de ambiente expostas ao client devem começar com <Text code>VITE_</Text> por padrão; altere em <Text code>envPrefix</Text> se necessário.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'Vite Config Generator',
    intro:
      'Builds a vite.config.(js|ts|mjs|cjs) file 100% in the browser. Choose the framework, plugins, server/build options and aliases; the preview updates live and is ready to copy or download.',
    presets: 'One-click templates',
    fileType: 'File extension',
    framework: 'Framework',
    plugins: 'Plugins',
    base: 'base (public path)',
    envPrefix: 'env variable prefix',
    clearScreen: 'Clear screen on start',
    logLevel: 'logLevel',
    define: 'define (JSON object)',
    alias: 'resolve.alias (JSON object)',
    proxy: 'server.proxy (JSON object)',
    server: 'Dev server',
    port: 'port',
    open: 'Open browser',
    hmr: 'HMR enabled',
    css: 'CSS',
    cssModules: 'CSS Modules (camelCase)',
    cssDevSourcemap: 'CSS devSourcemap',
    postcss: 'Include postcss: {}',
    optimizeDeps: 'optimizeDeps.include (comma separated)',
    build: 'Build',
    outDir: 'outDir',
    sourcemap: 'sourcemap',
    minify: 'minify',
    libMode: 'Library mode (lib)',
    libEntry: 'lib.entry',
    libName: 'lib.name',
    libFileName: 'lib.fileName',
    libFormats: 'lib.formats',
    output: 'Generated vite.config',
    copy: 'Copy',
    copied: 'Configuration copied!',
    download: 'Download',
    downloadName: (ext) => `vite.config.${ext}`,
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildViteConfig collects imports from the selected plugins, builds the server/build/resolve/css/define/lib blocks and serializes everything as a valid Vite file. JSON objects are parsed in the browser and skipped when invalid.',
    tipsTitle: 'Vite tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Use <Text code>base</Text> when the app is served from a subdirectory (e.g. <Text code>/app/</Text>).
        </li>
        <li>
          Modern React projects usually prefer <Text code>@vitejs/plugin-react-swc</Text> for faster builds.
        </li>
        <li>
          Library mode requires <Text code>lib.entry</Text>, <Text code>lib.name</Text> and <Text code>formats</Text>; remember to add <Text code>rollupOptions.external</Text> for peer dependencies.
        </li>
        <li>
          Environment variables exposed to the client must start with <Text code>VITE_</Text> by default; change <Text code>envPrefix</Text> if needed.
        </li>
      </ul>
    ),
  },
}

export default function ViteConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({ ...PRESETS.react })
  const [activePreset, setActivePreset] = useState('react')

  const output = useMemo(() => buildViteConfig(options), [options])
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
    const ext = options.fileType || 'js'
    const blob = new Blob([output], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.downloadName(ext)
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
          <Card title={t.framework}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.fileType}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.fileType}
                  onChange={(v) => updateField('fileType', v)}
                  options={FILE_TYPES.map((o) => ({ value: o, label: `vite.config.${o}` }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.framework}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.framework}
                  onChange={(v) => updateField('framework', v)}
                  options={FRAMEWORKS.map((o) => ({
                    value: o.value,
                    label: o.label[lang],
                  }))}
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
                  options={PLUGINS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.base}
                </Text>
                <Input
                  value={options.base}
                  onChange={(e) => updateField('base', e.target.value)}
                  placeholder="/"
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.envPrefix}
                </Text>
                <Input
                  value={options.envPrefix}
                  onChange={(e) => updateField('envPrefix', e.target.value)}
                  placeholder="VITE_"
                />
              </div>

              <div>
                {renderSwitch('clearScreen')}
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.logLevel}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.logLevel}
                  onChange={(v) => updateField('logLevel', v)}
                  options={LOG_LEVEL_OPTIONS.map((o) => ({ value: o, label: String(o) }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.define}
                </Text>
                <Input.TextArea
                  value={options.define}
                  onChange={(e) => updateField('define', e.target.value)}
                  placeholder='{ "__APP_VERSION__": "\"1.0.0\"" }'
                  rows={2}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.alias}
                </Text>
                <Input.TextArea
                  value={options.alias}
                  onChange={(e) => updateField('alias', e.target.value)}
                  placeholder='{ "@/*": "./src/*" }'
                  rows={3}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.server}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.port}
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={65535}
                  value={options.port}
                  onChange={(v) => updateField('port', v)}
                />
              </div>

              <div>
                {renderSwitch('open')}
              </div>

              <div>
                {renderSwitch('hmr')}
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.proxy}
                </Text>
                <Input.TextArea
                  value={options.proxy}
                  onChange={(e) => updateField('proxy', e.target.value)}
                  placeholder='{ "/api": { "target": "http://localhost:3000", "changeOrigin": true } }'
                  rows={3}
                />
              </div>
            </Space>
          </Card>

          <Card title={t.css} style={{ marginTop: 16 }}>
            <Space direction="vertical">
              {renderSwitch('cssModules')}
              {renderSwitch('cssDevSourcemap')}
              {renderSwitch('postcss')}
            </Space>
          </Card>

          <Card title={t.build} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.outDir}
                </Text>
                <Input
                  value={options.outDir}
                  onChange={(e) => updateField('outDir', e.target.value)}
                  placeholder="dist"
                />
              </div>

              <div>
                {renderSwitch('sourcemap')}
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.minify}
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.minify}
                  onChange={(v) => updateField('minify', v)}
                  options={MINIFY_OPTIONS.map((o) => ({ value: o, label: String(o) }))}
                />
              </div>

              <div>
                {renderSwitch('libMode')}
              </div>

              {options.libMode && (
                <>
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.libEntry}
                    </Text>
                    <Input
                      value={options.libEntry}
                      onChange={(e) => updateField('libEntry', e.target.value)}
                      placeholder="src/index.ts"
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.libName}
                    </Text>
                    <Input
                      value={options.libName}
                      onChange={(e) => updateField('libName', e.target.value)}
                      placeholder="MyLib"
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.libFileName}
                    </Text>
                    <Input
                      value={options.libFileName}
                      onChange={(e) => updateField('libFileName', e.target.value)}
                      placeholder="my-lib"
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.libFormats}
                    </Text>
                    <Select
                      mode="multiple"
                      allowClear
                      style={{ width: '100%' }}
                      value={options.libFormats}
                      onChange={(v) => updateField('libFormats', v)}
                      options={LIB_FORMAT_OPTIONS.map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                </>
              )}

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.optimizeDeps}
                </Text>
                <Input
                  value={options.optimizeDeps}
                  onChange={(e) => updateField('optimizeDeps', e.target.value)}
                  placeholder="react, react-dom, lodash"
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
