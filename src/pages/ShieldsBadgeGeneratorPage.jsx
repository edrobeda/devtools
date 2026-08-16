import React, { useMemo, useState } from 'react'
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
  STYLES,
  COLORS,
  PRESETS,
  DEFAULTS,
  buildBadgeUrl,
  buildMarkdown,
  buildHtml,
  buildRst,
  buildAsciiDoc,
  validateBadge,
} from '../utils/shieldsBadgeGenerator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de Badge Shields.io',
    intro: (
      <>
        Monte badges do <Text code>shields.io</Text> para READMEs, documentação e sites.
        Escolha label, mensagem, cor, estilo, logo e link; copie o snippet em Markdown,
        HTML, reStructuredText ou AsciiDoc. Tudo no navegador — nenhum dado sai da máquina.
      </>
    ),
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
  en: {
    title: 'Shields.io Badge Generator',
    intro: (
      <>
        Build <Text code>shields.io</Text> badges for READMEs, docs and websites.
        Choose label, message, color, style, logo and link; copy the snippet as Markdown,
        HTML, reStructuredText or AsciiDoc. All in the browser — no data leaves the machine.
      </>
    ),
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
}

export default function ShieldsBadgeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [options, setOptions] = useState(DEFAULTS)
  const [presetKey, setPresetKey] = useState('buildPassing')
  const [copiedTab, setCopiedTab] = useState(null)
  const [activeTab, setActiveTab] = useState('markdown')

  const setField = (key, value) => {
    setPresetKey('custom')
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const presetKeys = useMemo(() => Object.keys(PRESETS), [])
  const presetOptions = useMemo(
    () => presetKeys.map((k) => ({ label: PRESETS[k].label[lang], value: k })),
    [presetKeys, lang]
  )

  const styleOptions = useMemo(
    () => STYLES.map((s) => ({ label: s[lang], value: s.value })),
    [lang]
  )

  const colorOptions = useMemo(
    () => COLORS.map((c) => ({ label: c[lang], value: c.value })),
    []
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TagOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle}>
        <Paragraph type="secondary">{t.presetsHint}</Paragraph>
        <Segmented
          options={presetOptions}
          value={presetKey}
          onChange={(k) => {
            setPresetKey(k)
            setOptions({ ...PRESETS[k].data })
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
    </Space>
  )
}
