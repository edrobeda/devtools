import React, { useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Segmented,
  Tabs,
  ColorPicker,
  message,
} from 'antd'
import {
  TagOutlined,
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  STYLES as SHIELDS_STYLES,
  PRESETS as SHIELDS_PRESETS,
  DEFAULTS,
  buildBadgeUrl,
  buildMarkdown,
  buildHtml,
  buildRst,
  buildAsciiDoc,
  validateBadge,
} from '../utils/shieldsBadgeGenerator'
import {
  buildBadgeSvg,
  buildBadgeMarkdown,
  buildBadgeHtml as buildBadgeHtmlSvg,
  buildBadgeRst as buildBadgeRstSvg,
  measureTexts,
  STYLE_CONFIG,
} from '../utils/svgBadgeGenerator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de Badge',
    intro: (
      <>
        Monte badges estilo <Text code>shields.io</Text> para READMEs, documentação e sites.
        Use o <Text strong>Modo URL (online)</Text> para badges via shields.io com logos
        simple-icons e links, ou o <Text strong>Modo SVG (offline)</Text> para gerar o código
        SVG autocontido no próprio navegador, com logos de emoji. Copie em Markdown, HTML,
        reStructuredText, AsciiDoc ou SVG. Tudo no navegador — nenhum dado sai da máquina.
      </>
    ),
    modeTitle: 'Modo de geração',
    modeUrl: 'URL shields.io (online)',
    modeSvg: 'SVG autocontido (offline)',
    urlModeHint:
      'Monta uma URL para o serviço shields.io. Logos vêm do simple-icons; depende de rede para renderizar o badge.',
    svgModeHint:
      'Gera o código SVG no próprio navegador (100% offline). Logos limitados a emoji/letra de 2 caracteres.',
    url: {
      presetsTitle: 'Modelo',
      presetsHint: 'Escolha um ponto de partida e edite à vontade.',
      formTitle: 'Configuração',
      labelLabel: 'Label (esquerda)',
      labelHint: 'build',
      messageLabel: 'Mensagem (direita)',
      messageHint: 'passing',
      colorLabel: 'Cor',
      colorHint: 'brightgreen, red ou hex sem #',
      styleLabel: 'Estilo',
      logoLabel: 'Logo (simple-icons)',
      logoHint: 'github, npm, docker...',
      logoColorLabel: 'Cor do logo',
      logoColorHint: 'white, black ou hex sem #',
      labelColorLabel: 'Cor do label',
      labelColorHint: 'cinza escuro, hex sem #',
      cacheSecondsLabel: 'Cache (segundos)',
      cacheSecondsHint: '300',
      linksTitle: 'Links',
      linkLeftLabel: 'Link da parte esquerda',
      linkRightLabel: 'Link da parte direita',
      previewTitle: 'Preview',
      previewAlt: 'badge',
      outputTitle: 'Saída',
      copy: 'Copiar',
      copied: 'Copiado!',
      copyErr: 'Não foi possível copiar',
      download: 'Baixar SVG',
      downloadErr: 'Não foi possível baixar',
      tabMarkdown: 'Markdown',
      tabHtml: 'HTML',
      tabRst: 'reStructuredText',
      tabAsciidoc: 'AsciiDoc',
      tabUrl: 'URL',
      warningTitle: 'Aviso',
      warningEmpty: 'Preencha label ou mensagem para gerar o badge.',
      tipTitle: 'Dicas',
      tipBody: (
        <>
          Acesse <Text code>https://simpleicons.org</Text> para ver os nomes de logos disponíveis.
          Cores podem ser nomes do shields ou hexadecimais sem <Text code>#</Text>. Use o parâmetro
          de cache com cautela: serviços dinâmicos costumam ignorar valores muito altos.
        </>
      ),
      howTitle: 'Como funciona — algoritmo-fonte',
      howDesc: 'O builder escapa os caracteres reservados do shields.io (- → --, _ → __, espaço → _), normaliza a cor, monta a URL base e anexa os query params escolhidos. Os snippets são templates simples sobre a URL gerada.',
    },
    svg: {
      contentTitle: 'Conteúdo',
      label: 'Label',
      message: 'Mensagem',
      logo: 'Logo (emoji/letra)',
      style: 'Estilo',
      colorsTitle: 'Cores',
      labelColor: 'Fundo do label',
      messageColor: 'Fundo da mensagem',
      textColor: 'Cor do texto',
      logoColor: 'Cor do logo',
      optionsTitle: 'Opções',
      presetsTitle: 'Exemplos de um clique',
      previewTitle: 'Preview ao vivo',
      previewHint: 'O SVG abaixo é exatamente o que será copiado.',
      outputsTitle: 'Versões prontas pra copiar',
      svgLabel: 'SVG',
      markdownLabel: 'Markdown',
      htmlLabel: 'HTML',
      rstLabel: 'reStructuredText',
      download: 'Baixar .svg',
      copy: 'Copiar',
      copied: 'Copiado!',
      copyError: 'Não foi possível copiar',
      bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
      tipTitle: 'Como usar',
      tipBody: (
        <>
          Cole o Markdown direto no README do GitHub/GitLab ou use o SVG inline no
          seu site. Para READMEs prefira o SVG inline ou data URI (Markdown), já
          que shields de terceiros podem ficar offline. Se quiser hospedar o
          arquivo, baixe o <Text code>.svg</Text> e referencie-o normalmente.
        </>
      ),
      howItWorks: 'Como funciona — algoritmo-fonte',
      howItWorksDesc:
        'Como a largura de textos em SVG depende da fonte renderizadora, medimos label e message em um <canvas> com a mesma família tipográfica e peso do estilo escolhido. A partir das larguras calculamos a largura total, dividimos o badge em dois retângulos com cantos arredondados apenas nas pontas e centralizamos os textos em cada lado.',
      styleOptions: {
        flat: 'Flat',
        'flat-square': 'Flat square',
        plastic: 'Plastic',
        'for-the-badge': 'For the Badge',
      },
    },
  },
  en: {
    title: 'Badge Generator',
    intro: (
      <>
        Build <Text code>shields.io</Text>-style badges for READMEs, docs and sites. Use the
        <Text strong> URL mode (online)</Text> for badges via shields.io with simple-icons logos
        and links, or the <Text strong> SVG mode (offline)</Text> to generate self-contained SVG
        code in the browser with emoji logos. Copy as Markdown, HTML, reStructuredText, AsciiDoc
        or SVG. All in the browser — no data leaves the machine.
      </>
    ),
    modeTitle: 'Generation mode',
    modeUrl: 'URL shields.io (online)',
    modeSvg: 'Self-contained SVG (offline)',
    urlModeHint:
      'Builds a URL for the shields.io service. Logos come from simple-icons; rendering the badge requires network.',
    svgModeHint:
      'Generates the SVG code in the browser (100% offline). Logos are limited to emoji/2-char letters.',
    url: {
      presetsTitle: 'Template',
      presetsHint: 'Pick a starting point and edit freely.',
      formTitle: 'Configuration',
      labelLabel: 'Label (left)',
      labelHint: 'build',
      messageLabel: 'Message (right)',
      messageHint: 'passing',
      colorLabel: 'Color',
      colorHint: 'brightgreen, red or hex without #',
      styleLabel: 'Style',
      logoLabel: 'Logo (simple-icons)',
      logoHint: 'github, npm, docker...',
      logoColorLabel: 'Logo color',
      logoColorHint: 'white, black or hex without #',
      labelColorLabel: 'Label color',
      labelColorHint: 'dark grey, hex without #',
      cacheSecondsLabel: 'Cache (seconds)',
      cacheSecondsHint: '300',
      linksTitle: 'Links',
      linkLeftLabel: 'Left-side link',
      linkRightLabel: 'Right-side link',
      previewTitle: 'Preview',
      previewAlt: 'badge',
      outputTitle: 'Output',
      copy: 'Copy',
      copied: 'Copied!',
      copyErr: 'Could not copy',
      download: 'Download SVG',
      downloadErr: 'Could not download',
      tabMarkdown: 'Markdown',
      tabHtml: 'HTML',
      tabRst: 'reStructuredText',
      tabAsciidoc: 'AsciiDoc',
      tabUrl: 'URL',
      warningTitle: 'Warning',
      warningEmpty: 'Fill in the label or message to generate the badge.',
      tipTitle: 'Tips',
      tipBody: (
        <>
          Visit <Text code>https://simpleicons.org</Text> for available logo names. Colors can be
          shields names or hex without <Text code>#</Text>. Use the cache parameter carefully:
          dynamic services usually ignore very high values.
        </>
      ),
      howTitle: 'How it works — source code',
      howDesc: 'The builder escapes shields.io reserved characters (- → --, _ → __, space → _), normalizes the color, builds the base URL and appends the chosen query params. The snippets are simple templates over the generated URL.',
    },
    svg: {
      contentTitle: 'Content',
      label: 'Label',
      message: 'Message',
      logo: 'Logo (emoji/letter)',
      style: 'Style',
      colorsTitle: 'Colors',
      labelColor: 'Label background',
      messageColor: 'Message background',
      textColor: 'Text color',
      logoColor: 'Logo color',
      optionsTitle: 'Options',
      presetsTitle: 'One-click presets',
      previewTitle: 'Live preview',
      previewHint: 'The SVG below is exactly what will be copied.',
      outputsTitle: 'Ready-to-copy outputs',
      svgLabel: 'SVG',
      markdownLabel: 'Markdown',
      htmlLabel: 'HTML',
      rstLabel: 'reStructuredText',
      download: 'Download .svg',
      copy: 'Copy',
      copied: 'Copied!',
      copyError: 'Could not copy',
      bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
      tipTitle: 'How to use',
      tipBody: (
        <>
          Paste the Markdown directly into a GitHub/GitLab README or use the
          inline SVG on your site. For READMEs prefer inline SVG or data URI
          Markdown, since third-party shields can go offline. If you want to host
          the file, download the <Text code>.svg</Text> and reference it as usual.
        </>
      ),
      howItWorks: 'How it works — source algorithm',
      howItWorksDesc:
        'Because SVG text width depends on the renderer font, we measure label and message on an off-screen <canvas> using the same font family and weight as the chosen style. From those widths we compute the total badge width, split it into two rectangles with rounded corners only at the outer edges, and center the texts on each side.',
      styleOptions: {
        flat: 'Flat',
        'flat-square': 'Flat square',
        plastic: 'Plastic',
        'for-the-badge': 'For the Badge',
      },
    },
  },
}

const SVG_PRESETS = [
  { key: 'build', label: 'Build passing', message: 'passing', color: '#4c1', labelColor: '#555', logo: '' },
  { key: 'coverage', label: 'coverage', message: '92%', color: '#007ec6', labelColor: '#555', logo: '' },
  { key: 'version', label: 'npm', message: 'v5.2.0', color: '#cb3837', labelColor: '#555', logo: '📦' },
  { key: 'license', label: 'license', message: 'MIT', color: '#97ca00', labelColor: '#555', logo: '' },
  { key: 'downloads', label: 'downloads', message: '1M/mo', color: '#9f9f9f', labelColor: '#555', logo: '⬇' },
]

const SVG_SOURCE = `// src/utils/svgBadgeGenerator.js (resumo)
// 1. Mede os textos no <canvas> com a fonte e tamanho do estilo escolhido.
function measureTexts(label, message, styleKey, logo, canvasCtx) {
  const style = STYLE_CONFIG[styleKey]
  canvasCtx.font = \`\${style.fontWeight} \${style.fontSize}px Verdana,...\`
  return {
    labelWidth: Math.ceil(canvasCtx.measureText(label).width),
    messageWidth: Math.ceil(canvasCtx.measureText(message).width),
    logoWidth: logo ? style.height - 4 : 0,
  }
}

// 2. Calcula as dimensões totais a partir das larguras.
function computeDimensions(measurements, styleKey, hasLabel) {
  const style = STYLE_CONFIG[styleKey]
  const labelW = hasLabel ? measurements.labelWidth + style.padX * 2 + measurements.logoWidth : 0
  const messageW = measurements.messageWidth + style.padX * 2
  return { width: labelW + messageW, height: style.height, splitX: labelW }
}

// 3. Desenha cada lado como um path com cantos arredondados apenas nas pontas,
//    injetando gradiente linear (plastic) e filtro de sombra quando ativados.
function roundedRectPath(x, y, w, h, r, left, right) { ... }

// 4. Monta a string SVG final com <text> centralizados e logo opcional.
function buildBadgeSvg(measurements, options) { ... }`

function UrlMode({ t, lang }) {
  const [options, setOptions] = useState(DEFAULTS)
  const [presetKey, setPresetKey] = useState('buildPassing')
  const [copiedTab, setCopiedTab] = useState(null)
  const [activeTab, setActiveTab] = useState('markdown')

  const setField = (key, value) => {
    setPresetKey('custom')
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const presetKeys = useMemo(() => Object.keys(SHIELDS_PRESETS), [])
  const presetOptions = useMemo(
    () => presetKeys.map((k) => ({ label: SHIELDS_PRESETS[k].label[lang], value: k })),
    [presetKeys, lang]
  )

  const styleOptions = useMemo(
    () => SHIELDS_STYLES.map((s) => ({ label: s[lang], value: s.value })),
    [lang]
  )

  const url = useMemo(() => buildBadgeUrl(options), [options])
  const markdown = useMemo(() => buildMarkdown(url, t.previewAlt), [url, t.previewAlt])
  const html = useMemo(() => buildHtml(url, t.previewAlt), [url, t.previewAlt])
  const rst = useMemo(() => buildRst(url, t.previewAlt), [url, t.previewAlt])
  const asciidoc = useMemo(() => buildAsciiDoc(url, t.previewAlt), [url, t.previewAlt])
  const warnings = useMemo(() => validateBadge(options), [options])

  const copy = async (text, tab) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTab(tab)
      setTimeout(() => setCopiedTab(null), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  const downloadSvg = async () => {
    if (!url) return
    try {
      const svgUrl = url.replace('/badge/', '/badge/')
      const response = await fetch(svgUrl)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = 'badge.svg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      message.error(t.downloadErr)
    }
  }

  const snippetForTab = {
    markdown,
    html,
    rst,
    asciidoc,
    url,
  }

  const currentSnippet = snippetForTab[activeTab] || ''

  return (
    <>
      <Card title={t.presetsTitle}>
        <Paragraph type="secondary">{t.presetsHint}</Paragraph>
        <Segmented
          options={presetOptions}
          value={presetKey}
          onChange={(k) => {
            setPresetKey(k)
            setOptions({ ...SHIELDS_PRESETS[k].data })
          }}
        />
      </Card>

      <Card title={t.formTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.labelLabel}</Text>
              <Input
                value={options.label}
                onChange={(e) => setField('label', e.target.value)}
                placeholder={t.labelHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.messageLabel}</Text>
              <Input
                value={options.message}
                onChange={(e) => setField('message', e.target.value)}
                placeholder={t.messageHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.colorLabel}</Text>
              <Input
                value={options.color}
                onChange={(e) => setField('color', e.target.value)}
                placeholder={t.colorHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.styleLabel}</Text>
              <Select
                value={options.style}
                options={styleOptions}
                onChange={(v) => setField('style', v)}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.logoLabel}</Text>
              <Input
                value={options.logo}
                onChange={(e) => setField('logo', e.target.value)}
                placeholder={t.logoHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.logoColorLabel}</Text>
              <Input
                value={options.logoColor}
                onChange={(e) => setField('logoColor', e.target.value)}
                placeholder={t.logoColorHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.labelColorLabel}</Text>
              <Input
                value={options.labelColor}
                onChange={(e) => setField('labelColor', e.target.value)}
                placeholder={t.labelColorHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.cacheSecondsLabel}</Text>
              <Input
                value={options.cacheSeconds}
                onChange={(e) => setField('cacheSeconds', e.target.value)}
                placeholder={t.cacheSecondsHint}
              />
            </Space>
          </Col>
        </Row>

        <Paragraph strong style={{ marginTop: 24 }}>{t.linksTitle}</Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.linkLeftLabel}</Text>
              <Input
                value={options.linkLeft}
                onChange={(e) => setField('linkLeft', e.target.value)}
                placeholder="https://..."
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.linkRightLabel}</Text>
              <Input
                value={options.linkRight}
                onChange={(e) => setField('linkRight', e.target.value)}
                placeholder="https://..."
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title={t.previewTitle}>
        {warnings.length > 0 ? (
          <Alert type="warning" message={t.warningTitle} description={t.warningEmpty} showIcon />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ minHeight: 40 }}>
              <img src={url} alt={t.previewAlt} style={{ maxWidth: '100%' }} />
            </div>
            <Space>
              <Button icon={<CopyOutlined />} onClick={() => copy(url, 'url')}>
                {copiedTab === 'url' ? <><CheckOutlined /> {t.copied}</> : t.copy}
              </Button>
              <Button icon={<DownloadOutlined />} onClick={downloadSvg}>
                {t.download}
              </Button>
            </Space>
          </Space>
        )}
      </Card>

      <Card title={t.outputTitle}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'markdown', label: t.tabMarkdown },
            { key: 'html', label: t.tabHtml },
            { key: 'rst', label: t.tabRst },
            { key: 'asciidoc', label: t.tabAsciidoc },
            { key: 'url', label: t.tabUrl },
          ]}
          tabBarExtraContent={
            <Button
              icon={copiedTab === activeTab ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => copy(currentSnippet, activeTab)}
              disabled={!currentSnippet}
            >
              {copiedTab === activeTab ? t.copied : t.copy}
            </Button>
          }
        />
        <pre
          style={{
            background: '#f6f8fa',
            padding: 16,
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            minHeight: 60,
          }}
        >
          {currentSnippet || '-'}
        </pre>
      </Card>

      <Card title={t.tipTitle}>
        <Paragraph>{t.tipBody}</Paragraph>
      </Card>

      <Collapse>
        <Panel header={t.howTitle} key="how">
          <Paragraph>{t.howDesc}</Paragraph>
          <pre style={{ fontSize: 12, lineHeight: 1.6, overflowX: 'auto' }}>
            {`function escapeShieldsPart(s) {
  return s
    .replace(/_/g, '__')
    .replace(/-/g, '--')
    .replace(/ /g, '_')
}

function normalizeColor(c) {
  const v = String(c ?? '').trim().toLowerCase()
  if (!v) return ''
  if (v.startsWith('#')) return v.slice(1)
  return v
}

export function buildBadgeUrl(o) {
  const label = String(o.label ?? '').trim()
  const message = String(o.message ?? '').trim()
  const color = normalizeColor(o.color) || 'lightgrey'
  const parts = [
    escapeShieldsPart(label || ' '),
    escapeShieldsPart(message || ' '),
    color,
  ]
  const base = \`https://img.shields.io/badge/\${parts.join('-')}\`
  const params = new URLSearchParams()
  if (o.style) params.set('style', o.style)
  if (o.logo) params.set('logo', o.logo)
  if (normalizeColor(o.logoColor)) params.set('logoColor', normalizeColor(o.logoColor))
  if (normalizeColor(o.labelColor)) params.set('labelColor', normalizeColor(o.labelColor))
  if (o.cacheSeconds) params.set('cacheSeconds', o.cacheSeconds)
  if (o.linkLeft || o.linkRight) {
    if (o.linkLeft) params.set('link', o.linkLeft)
    if (o.linkRight) params.append('link', o.linkRight)
  }
  const query = params.toString()
  return query ? \`\${base}?\${query}\` : base
}`}
          </pre>
        </Panel>
      </Collapse>
    </>
  )
}

function SvgOutputBlock({ label, value, copied, onCopy, copyLabel, copiedLabel }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text strong style={{ fontSize: 13 }}>{label}</Text>
        <Button size="small" type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={onCopy}>
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 150, overflowY: 'auto', fontSize: 12, background: '#fafafa', padding: '8px 10px', borderRadius: 6 }}>
        <code>{value}</code>
      </pre>
    </div>
  )
}

function SvgMode({ t }) {
  const [label, setLabel] = useState('build')
  const [message, setMessage] = useState('passing')
  const [logo, setLogo] = useState('')
  const [style, setStyle] = useState('flat')
  const [labelColor, setLabelColor] = useState('#555555')
  const [color, setColor] = useState('#44cc11')
  const [textColor, setTextColor] = useState('#ffffff')
  const [logoColor, setLogoColor] = useState('#ffffff')
  const [copied, setCopied] = useState(null)

  const canvasRef = useRef(null)

  const measurements = useMemo(() => {
    const canvas = canvasRef.current || document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    return measureTexts(label, message, style, logo, ctx)
  }, [label, message, style, logo])

  const options = useMemo(
    () => ({ label, message, labelColor, color, style, logo, logoColor, textColor }),
    [label, message, labelColor, color, style, logo, logoColor, textColor]
  )

  const svgCode = useMemo(() => buildBadgeSvg(measurements, options), [measurements, options])
  const markdownCode = useMemo(() => buildBadgeMarkdown(label, message, svgCode), [label, message, svgCode])
  const htmlCode = useMemo(() => buildBadgeHtmlSvg(svgCode), [svgCode])
  const rstCode = useMemo(() => buildBadgeRstSvg(label, message, svgCode), [label, message, svgCode])

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      message.error(t.copyError)
    }
  }

  function downloadSvg() {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `badge-${label || 'shield'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyPreset(p) {
    setLabel(p.label)
    setMessage(p.message)
    setColor(p.color)
    setLabelColor(p.labelColor)
    setLogo(p.logo || '')
  }

  const styleOptions = [
    { label: t.styleOptions.flat, value: 'flat' },
    { label: t.styleOptions['flat-square'], value: 'flat-square' },
    { label: t.styleOptions.plastic, value: 'plastic' },
    { label: t.styleOptions['for-the-badge'], value: 'for-the-badge' },
  ]

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Card title={t.contentTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Space>
              <Text type="secondary">{t.label}</Text>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} style={{ width: 160 }} />
            </Space>
            <Space>
              <Text type="secondary">{t.message}</Text>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: 160 }} />
            </Space>
            <Space>
              <Text type="secondary">{t.logo}</Text>
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} style={{ width: 80 }} maxLength={2} />
            </Space>
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.style}</Text>
            <Segmented value={style} onChange={setStyle} options={styleOptions} />
          </Space>
        </Space>
      </Card>

      <Card title={t.colorsTitle}>
        <Space wrap align="center" size="large">
          <Space>
            <Text type="secondary">{t.labelColor}</Text>
            <ColorPicker value={labelColor} onChange={(c) => setLabelColor(c.toHexString())} showText />
          </Space>
          <Space>
            <Text type="secondary">{t.messageColor}</Text>
            <ColorPicker value={color} onChange={(c) => setColor(c.toHexString())} showText />
          </Space>
          <Space>
            <Text type="secondary">{t.textColor}</Text>
            <ColorPicker value={textColor} onChange={(c) => setTextColor(c.toHexString())} showText />
          </Space>
          <Space>
            <Text type="secondary">{t.logoColor}</Text>
            <ColorPicker value={logoColor} onChange={(c) => setLogoColor(c.toHexString())} showText />
          </Space>
        </Space>
      </Card>

      <Card title={t.presetsTitle}>
        <Space size={[8, 8]} wrap>
          {SVG_PRESETS.map((p) => (
            <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
              {p.label} — {p.message}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title={t.previewTitle}>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#999' }}>{t.previewHint}</div>
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 24, background: 'repeating-conic-gradient(#f6f6f6 0% 25%, #fff 0% 50%) 0 0 / 20px 20px' }}>
          <div dangerouslySetInnerHTML={{ __html: svgCode }} />
        </div>
      </Card>

      <Card title={t.outputsTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <SvgOutputBlock label={t.svgLabel} value={svgCode} copied={copied === 'svg'} onCopy={() => copy(svgCode, 'svg')} copyLabel={t.copy} copiedLabel={t.copied} />
          <SvgOutputBlock label={t.markdownLabel} value={markdownCode} copied={copied === 'md'} onCopy={() => copy(markdownCode, 'md')} copyLabel={t.copy} copiedLabel={t.copied} />
          <SvgOutputBlock label={t.htmlLabel} value={htmlCode} copied={copied === 'html'} onCopy={() => copy(htmlCode, 'html')} copyLabel={t.copy} copiedLabel={t.copied} />
          <SvgOutputBlock label={t.rstLabel} value={rstCode} copied={copied === 'rst'} onCopy={() => copy(rstCode, 'rst')} copyLabel={t.copy} copiedLabel={t.copied} />
          <Space>
            <Button icon={<DownloadOutlined />} onClick={downloadSvg}>{t.download}</Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.svgLabel}: {t.bytes(svgCode.length)}
            </Text>
          </Space>
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.howItWorks}>
        <Paragraph type="secondary">{t.howItWorksDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>svgBadgeGenerator.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SVG_SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </>
  )
}

export default function ShieldsBadgeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [mode, setMode] = useState('url')

  const modeOptions = useMemo(
    () => [
      { label: t.modeUrl, value: 'url' },
      { label: t.modeSvg, value: 'svg' },
    ],
    [t.modeUrl, t.modeSvg]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TagOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.modeTitle}>
        <Segmented options={modeOptions} value={mode} onChange={setMode} block />
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          {mode === 'url' ? t.urlModeHint : t.svgModeHint}
        </Paragraph>
      </Card>

      {mode === 'url' ? <UrlMode t={t.url} lang={lang} /> : <SvgMode t={t.svg} />}
    </Space>
  )
}
