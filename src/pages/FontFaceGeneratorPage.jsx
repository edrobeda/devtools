import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Checkbox,
  Alert,
  Collapse,
  Row,
  Col,
  Button,
  message,
  Tag,
  Table,
  Segmented,
} from 'antd'
import { FontSizeOutlined, CopyOutlined, UndoOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildFontFace,
  buildFamilyFallback,
  suggestFilename,
  FONT_DISPLAYS,
  FONT_WEIGHTS,
  FALLBACK_STACKS,
} from '../utils/fontFaceGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const FONT_STYLES = ['normal', 'italic']

const DEFAULTS = {
  family: 'Inter',
  fallbackKey: 'sans',
  display: 'swap',
  weights: [400, 700],
  styles: ['normal'],
  basePath: '/fonts',
  unicodeRange: '',
  usageClassName: 'font-inter',
  includeUsageClass: true,
  includePreconnect: false,
  preconnectDomains: '',
  files: {
    400: { woff2: 'Inter-Regular.woff2', woff: '', ttf: '', eot: '' },
    700: { woff2: 'Inter-Bold.woff2', woff: '', ttf: '', eot: '' },
  },
}

const PRESETS = [
  {
    key: 'minimal',
    labelKey: 'presetMinimal',
    config: {
      ...DEFAULTS,
      weights: [400],
      styles: ['normal'],
      files: {
        400: { woff2: 'Inter-Regular.woff2', woff: '', ttf: '', eot: '' },
      },
      usageClassName: 'font-inter',
    },
  },
  {
    key: 'complete',
    labelKey: 'presetComplete',
    config: {
      ...DEFAULTS,
      family: 'Inter',
      weights: [400, 500, 700],
      styles: ['normal', 'italic'],
      files: {
        400: { woff2: 'Inter-Regular.woff2', woff: '', ttf: '', eot: '' },
        500: { woff2: 'Inter-Medium.woff2', woff: '', ttf: '', eot: '' },
        700: { woff2: 'Inter-Bold.woff2', woff: '', ttf: '', eot: '' },
      },
      usageClassName: 'font-inter',
    },
  },
  {
    key: 'google',
    labelKey: 'presetGoogle',
    config: {
      ...DEFAULTS,
      family: 'Open Sans',
      weights: [400, 600, 700],
      styles: ['normal'],
      basePath: 'https://fonts.gstatic.com/s/opensans/v35',
      includePreconnect: true,
      preconnectDomains: 'https://fonts.gstatic.com',
      files: {
        400: { woff2: 'memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4iaVQUwaEQbjB_mQ.ttf', woff: '', ttf: '', eot: '' },
        600: { woff2: 'memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsgH1x4iaVQUwaEQbjB_mQ.ttf', woff: '', ttf: '', eot: '' },
        700: { woff2: 'memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4iaVQUwaEQbjB_mQ.ttf', woff: '', ttf: '', eot: '' },
      },
      usageClassName: 'font-opensans',
    },
  },
]

const FILE_EXTS = ['woff2', 'woff', 'ttf', 'eot']

const translations = {
  pt: {
    title: 'Gerador de @font-face CSS',
    intro:
      'Monta o bloco CSS @font-face para carregar uma fonte customizada no navegador — com múltiplos pesos, estilos, formatos (woff2, woff, ttf, eot), font-display e unicode-range. Gera também a classe utilitária com a stack de fallback, pronta pra colar no projeto.',
    tipTitle: 'Como usar @font-face sem erros comuns',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>woff2 primeiro</Text>: é o formato mais compacto e bem suportado;
          ofereça woff2 + woff como fallback para navegadores antigos.
        </li>
        <li>
          <Text strong>font-display: swap</Text> evita texto invisível durante o carregamento
          (FOIT), mas causa um flash de troca de fonte (FOUT).
        </li>
        <li>
          <Text strong>Caminhos absolutos</Text>: se a fonte for servida do mesmo domínio,
          prefira caminhos a partir da raiz (<Text code>/fonts/...</Text>). URLs do Google
          Fonts ou CDN precisam de <Text code>preconnect</Text>.
        </li>
        <li>
          <Text strong>unicode-range</Text> permite carregar só os caracteres que a página usa
          — ótimo para fontes com muitos glyphs ou para dividir por idioma.
        </li>
      </ul>
    ),
    settings: 'Configurações',
    family: 'Nome da família',
    familyPlaceholder: 'Ex: Inter',
    fallback: 'Stack de fallback',
    fallbackCustom: 'Customizado',
    fallbackNone: 'Sem fallback',
    display: 'font-display',
    basePath: 'Caminho base (opcional)',
    basePathPlaceholder: '/fonts ou https://cdn.example.com/fonts',
    unicodeRange: 'unicode-range (opcional)',
    unicodeRangePlaceholder: 'U+0000-00FF, U+0131, U+0152-0153',
    styles: 'Estilos',
    weights: 'Pesos',
    files: 'Arquivos por peso',
    usageClass: 'Classe utilitária',
    usageClassName: 'Nome da classe',
    includeUsageClass: 'Incluir classe CSS no output',
    includePreconnect: 'Incluir &lt;link rel="preconnect"&gt; no output',
    preconnectDomains: 'Domínios para preconnect (um por linha)',
    noFiles: 'Nenhum arquivo preenchido para este peso — o @font-face será gerado sem src.',
    presets: 'Modelos de um clique',
    presetMinimal: 'Mínimo (400 normal)',
    presetComplete: 'Completo (400/500/700 + itálico)',
    presetGoogle: 'Exemplo de CDN (Google Fonts)',
    reset: 'Restaurar',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    preview: 'Pré-visualização',
    previewHint: 'O preview usa o nome da família; a fonte real só renderiza se os arquivos estiverem acessíveis.',
    previewText: 'The quick brown fox jumps over the lazy dog. Áéíóú — 12345',
    previewLabel: 'Texto de preview',
    fontWeight: 'Peso do preview',
    fontStyle: 'Estilo do preview',
    sourceCol: 'Algoritmo-fonte',
    sourceBody:
      'O motor vive em src/utils/fontFaceGenerator.js. buildFontFace itera pelos pesos e estilos escolhidos e monta cada bloco @font-face; buildSingleFace ordena as fontes (eot primeiro para IE legado, depois woff2/woff/ttf/otf) e aplica font-display e unicode-range. buildFamilyFallback junta a família com uma stack de fallback (sans/serif/mono etc.).',
    statsFaces: (n) => `${n} @font-face`,
  },
  en: {
    title: 'CSS @font-face Generator',
    intro:
      'Builds the CSS @font-face block for loading a custom font in the browser — with multiple weights, styles, formats (woff2, woff, ttf, eot), font-display and unicode-range. Also generates the utility class with the fallback stack, ready to paste into your project.',
    tipTitle: 'How to use @font-face without common mistakes',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>woff2 first</Text>: it is the most compact and widely supported format;
          serve woff2 + woff as a fallback for older browsers.
        </li>
        <li>
          <Text strong>font-display: swap</Text> avoids invisible text while the font loads
          (FOIT), but causes a flash of unstyled text (FOUT).
        </li>
        <li>
          <Text strong>Absolute paths</Text>: when self-hosting, prefer root-relative paths
          (<Text code>/fonts/...</Text>). Google Fonts or CDN URLs need <Text code>preconnect</Text>.
        </li>
        <li>
          <Text strong>unicode-range</Text> lets you load only the characters the page uses —
          great for fonts with many glyphs or split by language.
        </li>
      </ul>
    ),
    settings: 'Settings',
    family: 'Family name',
    familyPlaceholder: 'e.g. Inter',
    fallback: 'Fallback stack',
    fallbackCustom: 'Custom',
    fallbackNone: 'No fallback',
    display: 'font-display',
    basePath: 'Base path (optional)',
    basePathPlaceholder: '/fonts or https://cdn.example.com/fonts',
    unicodeRange: 'unicode-range (optional)',
    unicodeRangePlaceholder: 'U+0000-00FF, U+0131, U+0152-0153',
    styles: 'Styles',
    weights: 'Weights',
    files: 'Files per weight',
    usageClass: 'Utility class',
    usageClassName: 'Class name',
    includeUsageClass: 'Include utility class in output',
    includePreconnect: 'Include &lt;link rel="preconnect"&gt; in output',
    preconnectDomains: 'Preconnect domains (one per line)',
    noFiles: 'No files filled for this weight — the @font-face will be generated without src.',
    presets: 'One-click templates',
    presetMinimal: 'Minimal (400 normal)',
    presetComplete: 'Complete (400/500/700 + italic)',
    presetGoogle: 'CDN example (Google Fonts)',
    reset: 'Reset',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    preview: 'Preview',
    previewHint: 'The preview uses the family name; the actual font only renders if the files are accessible.',
    previewText: 'The quick brown fox jumps over the lazy dog. Áéíóú — 12345',
    previewLabel: 'Preview text',
    fontWeight: 'Preview weight',
    fontStyle: 'Preview style',
    sourceCol: 'Source code',
    sourceBody:
      'The engine lives in src/utils/fontFaceGenerator.js. buildFontFace iterates over the chosen weights and styles and builds each @font-face block; buildSingleFace orders sources (eot first for legacy IE, then woff2/woff/ttf/otf) and applies font-display and unicode-range. buildFamilyFallback joins the family with a fallback stack (sans/serif/mono etc.).',
    statsFaces: (n) => `${n} @font-face${n === 1 ? '' : 's'}`,
  },
}

export default function FontFaceGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [config, setConfig] = useState(DEFAULTS)

  const patch = (p) => setConfig((prev) => ({ ...prev, ...p }))

  const reset = () => setConfig(DEFAULTS)

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (preset) setConfig(preset.config)
  }

  const toggleWeight = (weight) => {
    setConfig((prev) => {
      const has = prev.weights.includes(weight)
      const weights = has ? prev.weights.filter((w) => w !== weight) : [...prev.weights, weight].sort((a, b) => a - b)
      // Mantém a entrada de arquivos quando adiciona, não remove ao desmarcar
      // para não perder dados por acidente.
      const files = { ...prev.files }
      if (!has && !files[weight]) {
        files[weight] = {
          woff2: suggestFilename(prev.family, weight, prev.styles[0] || 'normal', 'woff2'),
          woff: '',
          ttf: '',
          eot: '',
        }
      }
      return { ...prev, weights, files }
    })
  }

  const toggleStyle = (style) => {
    setConfig((prev) => {
      const has = prev.styles.includes(style)
      const styles = has
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style].sort((a, b) => (a === 'italic' ? 1 : -1))
      return { ...prev, styles: styles.length ? styles : ['normal'] }
    })
  }

  const setFile = (weight, ext, value) => {
    setConfig((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        [weight]: {
          ...prev.files[weight],
          [ext]: value,
        },
      },
    }))
  }

  // Sempre garante uma entrada de arquivo para cada peso selecionado.
  const filesForWeights = useMemo(() => {
    const map = { ...config.files }
    config.weights.forEach((weight) => {
      if (!map[weight]) {
        map[weight] = {
          woff2: suggestFilename(config.family, weight, config.styles[0] || 'normal', 'woff2'),
          woff: '',
          ttf: '',
          eot: '',
        }
      }
    })
    return map
  }, [config.files, config.weights, config.family, config.styles])

  const buildConfig = useMemo(
    () => ({
      family: config.family,
      weights: config.weights,
      styles: config.styles,
      display: config.display,
      files: filesForWeights,
      basePath: config.basePath,
      unicodeRange: config.unicodeRange,
      fallbackKey: config.fallbackKey,
      includeUsageClass: config.includeUsageClass,
      usageClassName: config.usageClassName,
      includePreconnect: config.includePreconnect,
      preconnectDomains: config.preconnectDomains.split('\n').map((d) => d.trim()).filter(Boolean),
    }),
    [config, filesForWeights]
  )

  const result = useMemo(() => buildFontFace(buildConfig), [buildConfig])
  const faceCount = config.weights.length * config.styles.length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.full)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const [previewWeight, setPreviewWeight] = useState(400)
  const [previewStyle, setPreviewStyle] = useState('normal')
  const [previewText, setPreviewText] = useState(t.previewText)

  const familyWithFallback = useMemo(
    () => buildFamilyFallback(config.family, config.fallbackKey),
    [config.family, config.fallbackKey]
  )

  const fileColumns = FILE_EXTS.map((ext) => ({
    title: ext.toUpperCase(),
    dataIndex: ext,
    key: ext,
    render: (_, record) => (
      <Input
        size="small"
        value={record.files[ext] || ''}
        placeholder={`${record.family}-${record.weight}.${ext}`}
        onChange={(e) => setFile(record.weight, ext, e.target.value)}
      />
    ),
  }))

  const fileData = config.weights.map((weight) => ({
    key: weight,
    weight,
    family: config.family,
    files: filesForWeights[weight] || {},
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>{t.presets}</Text>
        <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
      </Space>
      <Space wrap>
        {PRESETS.map((p) => (
          <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>{t[p.labelKey]}</Button>
        ))}
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <FormItem label={t.family}>
                <Input
                  value={config.family}
                  onChange={(e) => patch({ family: e.target.value })}
                  placeholder={t.familyPlaceholder}
                />
              </FormItem>

              <FormItem label={t.fallback}>
                <Select
                  style={{ width: '100%' }}
                  value={config.fallbackKey}
                  onChange={(v) => patch({ fallbackKey: v })}
                  options={[
                    { value: 'sans', label: 'Sans-serif' },
                    { value: 'serif', label: 'Serif' },
                    { value: 'mono', label: 'Monospace' },
                    { value: 'system', label: 'System UI' },
                    { value: 'cursive', label: 'Cursive' },
                    { value: 'fantasy', label: 'Fantasy' },
                    { value: 'none', label: t.fallbackNone },
                  ]}
                />
              </FormItem>

              <FormItem label={t.display}>
                <Select
                  style={{ width: '100%' }}
                  value={config.display}
                  onChange={(v) => patch({ display: v })}
                  options={FONT_DISPLAYS.map((d) => ({ value: d, label: d }))}
                />
              </FormItem>

              <FormItem label={t.basePath}>
                <Input
                  value={config.basePath}
                  onChange={(e) => patch({ basePath: e.target.value })}
                  placeholder={t.basePathPlaceholder}
                />
              </FormItem>

              <FormItem label={t.unicodeRange}>
                <Input
                  value={config.unicodeRange}
                  onChange={(e) => patch({ unicodeRange: e.target.value })}
                  placeholder={t.unicodeRangePlaceholder}
                />
              </FormItem>

              <FormItem label={t.styles}>
                <Space wrap>
                  {FONT_STYLES.map((style) => (
                    <Checkbox
                      key={style}
                      checked={config.styles.includes(style)}
                      onChange={() => toggleStyle(style)}
                    >
                      {style}
                    </Checkbox>
                  ))}
                </Space>
              </FormItem>

              <FormItem label={t.weights}>
                <Space wrap>
                  {FONT_WEIGHTS.map((weight) => (
                    <Checkbox
                      key={weight}
                      checked={config.weights.includes(weight)}
                      onChange={() => toggleWeight(weight)}
                    >
                      {weight}
                    </Checkbox>
                  ))}
                </Space>
              </FormItem>

              <FormItem label={t.usageClassName}>
                <Space style={{ width: '100%' }}>
                  <Input
                    value={config.usageClassName}
                    onChange={(e) => patch({ usageClassName: e.target.value })}
                    placeholder="font-custom"
                    disabled={!config.includeUsageClass}
                  />
                </Space>
              </FormItem>

              <Space direction="vertical" size={4}>
                <Checkbox checked={config.includeUsageClass} onChange={(e) => patch({ includeUsageClass: e.target.checked })}>
                  {t.includeUsageClass}
                </Checkbox>
                <Checkbox checked={config.includePreconnect} onChange={(e) => patch({ includePreconnect: e.target.checked })}>
                  <span dangerouslySetInnerHTML={{ __html: t.includePreconnect }} />
                </Checkbox>
              </Space>

              {config.includePreconnect && (
                <FormItem label={t.preconnectDomains}>
                  <Input.TextArea
                    rows={2}
                    value={config.preconnectDomains}
                    onChange={(e) => patch({ preconnectDomains: e.target.value })}
                    placeholder="https://fonts.gstatic.com"
                  />
                </FormItem>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.preview}>
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: '24px 20px',
                  background: '#fafafa',
                  fontFamily: familyWithFallback,
                  fontSize: 28,
                  fontWeight: previewWeight,
                  fontStyle: previewStyle,
                  lineHeight: 1.4,
                  minHeight: 120,
                  wordBreak: 'break-word',
                }}
              >
                {previewText}
              </div>
              <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                {t.previewHint}
              </Paragraph>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={12}>
                  <FormItem label={t.previewLabel}>
                    <Input.TextArea
                      rows={2}
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                    />
                  </FormItem>
                </Col>
                <Col xs={24} md={6}>
                  <FormItem label={t.fontWeight}>
                    <Select
                      style={{ width: '100%' }}
                      value={previewWeight}
                      onChange={setPreviewWeight}
                      options={FONT_WEIGHTS.map((w) => ({ value: w, label: w }))}
                    />
                  </FormItem>
                </Col>
                <Col xs={24} md={6}>
                  <FormItem label={t.fontStyle}>
                    <Segmented
                      block
                      value={previewStyle}
                      onChange={setPreviewStyle}
                      options={FONT_STYLES.map((s) => ({ value: s, label: s }))}
                    />
                  </FormItem>
                </Col>
              </Row>
            </Card>

            <Card title={`${t.files} · ${t.statsFaces(faceCount)}`}>
              <Table
                size="small"
                pagination={false}
                dataSource={fileData}
                columns={[
                  { title: 'Weight', dataIndex: 'weight', key: 'weight', width: 70 },
                  ...fileColumns,
                ]}
                locale={{ emptyText: t.noFiles }}
              />
            </Card>
          </Space>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={(
          <Space size={8}>
            <Tag color="blue">{t.statsFaces(faceCount)}</Tag>
            <Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>
          </Space>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto', background: '#0d1117', color: '#e6edf3', padding: 12, borderRadius: 8, maxHeight: 520, fontSize: 12.5, lineHeight: 1.6 }}>
          <code>{result.full || '/* fill the settings above */'}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceCol,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300 }}><code>{buildFontFace.toString()}</code></pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}

function FormItem({ label, children }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text>{label}</Text>
      {children}
    </Space>
  )
}
