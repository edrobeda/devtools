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
  Checkbox,
  message,
  Divider,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  UndoOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildBoilerplate,
  validateBoilerplate,
  DEFAULTS,
  PRESETS,
} from '../utils/htmlBoilerplateGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const LANG_OPTIONS = [
  'pt-BR', 'en', 'en-US', 'en-GB', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru', 'ar', 'nl', 'pl',
]

const CHARSET_OPTIONS = ['UTF-8', 'ISO-8859-1', 'windows-1252']

const OG_TYPES = ['website', 'article', 'profile', 'product', 'video.movie', 'music.song', 'blog']

const CSS_OPTIONS = [
  { value: 'none', labelKey: { pt: 'Nenhum', en: 'None' } },
  { value: 'link', labelKey: { pt: 'Arquivo externo', en: 'External file' } },
  { value: 'inline-reset', labelKey: { pt: 'Reset mínimo inline', en: 'Inline minimal reset' } },
  { value: 'inline-normalize', labelKey: { pt: 'Normalize simplificado inline', en: 'Inline simplified normalize' } },
]

const JS_OPTIONS = [
  { value: 'none', labelKey: { pt: 'Nenhum', en: 'None' } },
  { value: 'link', labelKey: { pt: 'Script no <head>', en: 'Script in <head>' } },
  { value: 'inline', labelKey: { pt: 'Inline no <body>', en: 'Inline in <body>' } },
  { value: 'module', labelKey: { pt: 'Módulo ES no <body>', en: 'ES module in <body>' } },
  { value: 'defer', labelKey: { pt: 'Defer no <body>', en: 'Deferred in <body>' } },
]

const translations = {
  pt: {
    title: 'Gerador de HTML5 Boilerplate',
    intro:
      'Monte um documento HTML5 completo, semântico e pronto para produção. Escolha metadados, ' +
      'tags sociais (Open Graph e Twitter Card), CSS e JS, e copie o resultado. Tudo acontece no navegador.',
    presets: 'Modelos de um clique',
    presetMinimal: 'Mínimo',
    presetLanding: 'Landing Page',
    presetBlog: 'Artigo de Blog',
    reset: 'Restaurar',
    basicCard: '1 · Informações básicas',
    langField: 'lang',
    charsetField: 'charset',
    viewportField: 'Viewport',
    titleField: 'title',
    titlePlaceholder: 'Título da página',
    descriptionField: 'description',
    descriptionPlaceholder: 'Descrição para SEO e redes sociais',
    seoCard: '2 · SEO e identidade',
    themeColorField: 'theme-color',
    faviconField: 'favicon',
    faviconPlaceholder: '/favicon.ico',
    canonicalField: 'canonical',
    canonicalPlaceholder: 'https://exemplo.com/pagina',
    authorField: 'author',
    authorPlaceholder: 'Nome do autor',
    robotsField: 'robots',
    socialCard: '3 · Redes sociais',
    openGraphField: 'Open Graph',
    ogTypeField: 'og:type',
    ogImageField: 'og:image',
    ogImagePlaceholder: 'https://exemplo.com/og.png',
    ogSiteNameField: 'og:site_name',
    ogSiteNamePlaceholder: 'Nome do site',
    twitterCardField: 'Twitter Card',
    twitterSiteField: 'twitter:site',
    twitterSitePlaceholder: '@exemplo',
    manifestField: 'manifest',
    manifestPlaceholder: '/manifest.json',
    assetsCard: '4 · CSS e JavaScript',
    cssOptionField: 'CSS',
    cssHrefField: 'href',
    cssHrefPlaceholder: '/styles.css',
    jsOptionField: 'JavaScript',
    jsSrcField: 'src',
    jsSrcPlaceholder: '/app.js',
    bodyCard: '5 · Corpo da página',
    noscriptField: 'Aviso <noscript>',
    bodyContentField: 'conteúdo do <body>',
    includeCommentsField: 'Incluir comentários explicativos',
    outputCard: 'HTML gerado',
    copy: 'Copiar',
    copied: 'HTML copiado!',
    download: 'Baixar .html',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    validationTitle: 'Campos obrigatórios pendentes',
    validationTitleField: 'title é obrigatório',
    validationCssHref: 'href do CSS é obrigatório quando CSS externo está ativo',
    validationJsSrc: 'src do JavaScript é obrigatório para essa opção',
    tipTitle: 'Dicas de HTML5 Boilerplate',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>lang</Text> ajuda leitores de tela e mecanismos de busca a identificar o idioma.
        </li>
        <li>
          Sempre inclua <Text code>charset="UTF-8"</Text> como primeira meta tag do <Text code>{'<head>'}</Text>.
        </li>
        <li>
          <Text strong>Open Graph</Text> define como o link aparece no Facebook/LinkedIn;
          <Text strong>Twitter Card</Text> faz o mesmo no X/Twitter.
        </li>
        <li>
          Prefira <Text code>defer</Text> ou <Text code>type="module"</Text> para scripts no body, evitando bloqueio da renderização.
        </li>
      </ul>
    ),
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'buildBoilerplate monta a string HTML5 completa respeitando a ordem recomendada de tags, ' +
      'escapando atributos e omitindo blocos vazios. validateBoilerplate verifica título e campos dependentes.',
  },
  en: {
    title: 'HTML5 Boilerplate Generator',
    intro:
      'Build a complete, semantic, production-ready HTML5 document. Choose metadata, ' +
      'social tags (Open Graph and Twitter Card), CSS and JS, and copy the result. Everything happens in the browser.',
    presets: 'One-click templates',
    presetMinimal: 'Minimal',
    presetLanding: 'Landing Page',
    presetBlog: 'Blog Post',
    reset: 'Reset',
    basicCard: '1 · Basic info',
    langField: 'lang',
    charsetField: 'charset',
    viewportField: 'Viewport',
    titleField: 'title',
    titlePlaceholder: 'Page title',
    descriptionField: 'description',
    descriptionPlaceholder: 'SEO and social description',
    seoCard: '2 · SEO and identity',
    themeColorField: 'theme-color',
    faviconField: 'favicon',
    faviconPlaceholder: '/favicon.ico',
    canonicalField: 'canonical',
    canonicalPlaceholder: 'https://example.com/page',
    authorField: 'author',
    authorPlaceholder: 'Author name',
    robotsField: 'robots',
    socialCard: '3 · Social media',
    openGraphField: 'Open Graph',
    ogTypeField: 'og:type',
    ogImageField: 'og:image',
    ogImagePlaceholder: 'https://example.com/og.png',
    ogSiteNameField: 'og:site_name',
    ogSiteNamePlaceholder: 'Site name',
    twitterCardField: 'Twitter Card',
    twitterSiteField: 'twitter:site',
    twitterSitePlaceholder: '@example',
    manifestField: 'manifest',
    manifestPlaceholder: '/manifest.json',
    assetsCard: '4 · CSS and JavaScript',
    cssOptionField: 'CSS',
    cssHrefField: 'href',
    cssHrefPlaceholder: '/styles.css',
    jsOptionField: 'JavaScript',
    jsSrcField: 'src',
    jsSrcPlaceholder: '/app.js',
    bodyCard: '5 · Page body',
    noscriptField: '<noscript> warning',
    bodyContentField: '<body> content',
    includeCommentsField: 'Include explanatory comments',
    outputCard: 'Generated HTML',
    copy: 'Copy',
    copied: 'HTML copied!',
    download: 'Download .html',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    validationTitle: 'Required fields missing',
    validationTitleField: 'title is required',
    validationCssHref: 'CSS href is required when external CSS is active',
    validationJsSrc: 'JavaScript src is required for this option',
    tipTitle: 'HTML5 Boilerplate tips',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>lang</Text> helps screen readers and search engines identify the page language.
        </li>
        <li>
          Always include <Text code>charset="UTF-8"</Text> as the first meta tag in <Text code>{'<head>'}</Text>.
        </li>
        <li>
          <Text strong>Open Graph</Text> controls how the link appears on Facebook/LinkedIn;
          <Text strong>Twitter Card</Text> does the same on X/Twitter.
        </li>
        <li>
          Prefer <Text code>defer</Text> or <Text code>type="module"</Text> for body scripts to avoid render-blocking.
        </li>
      </ul>
    ),
    sourceTitle: 'Engine source code',
    sourceBody:
      'buildBoilerplate assembles the complete HTML5 string following the recommended tag order, ' +
      'escaping attributes and skipping empty blocks. validateBoilerplate checks the title and dependent fields.',
  },
}

function labelFor(options, lang) {
  return options.map((o) => ({ value: o.value, label: o.labelKey[lang] }))
}

export default function HtmlBoilerplateGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [form, setForm] = useState(DEFAULTS)

  const patch = (p) => setForm((prev) => ({ ...prev, ...p }))
  const reset = () => setForm(DEFAULTS)

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (preset) setForm(preset.values)
  }

  const html = useMemo(() => buildBoilerplate(form), [form])
  const validation = useMemo(() => validateBoilerplate(form), [form])
  const lineCount = html ? html.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([html]).size, [html])

  const copyHtml = () => {
    navigator.clipboard.writeText(html)
    message.success(t.copied)
  }

  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'index.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderValidation = (err) => {
    if (err.field === 'title') return t.validationTitleField
    if (err.field === 'cssHref') return t.validationCssHref
    if (err.field === 'jsSrc') return t.validationJsSrc
    return err.message
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>{t.presets}</Text>
        <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
      </Space>
      <Space wrap>
        {Object.entries(PRESETS).map(([key, p]) => (
          <Button key={key} size="small" onClick={() => applyPreset(key)}>{p.label[lang]}</Button>
        ))}
      </Space>

      <Card title={t.basicCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text code>{t.langField}</Text>}>
              <Select
                value={form.lang}
                onChange={(v) => patch({ lang: v })}
                options={LANG_OPTIONS.map((l) => ({ value: l, label: l }))}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text code>{t.charsetField}</Text>}>
              <Select
                value={form.charset}
                onChange={(v) => patch({ charset: v })}
                options={CHARSET_OPTIONS.map((c) => ({ value: c, label: c }))}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text>{t.viewportField}</Text>}>
              <Checkbox
                checked={form.viewport}
                onChange={(e) => patch({ viewport: e.target.checked })}
              >
                {t.viewportField}
              </Checkbox>
            </FormItem>
          </Col>
          <Col xs={24}>
            <FormItem label={<Text code>{t.titleField}</Text>}>
              <Input
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder={t.titlePlaceholder}
                status={validation.some((e) => e.field === 'title') ? 'error' : ''}
              />
            </FormItem>
          </Col>
          <Col xs={24}>
            <FormItem label={<Text code>{t.descriptionField}</Text>}>
              <TextArea
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder={t.descriptionPlaceholder}
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </FormItem>
          </Col>
        </Row>
      </Card>

      <Card title={t.seoCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text code>{t.themeColorField}</Text>}>
              <Space>
                <input
                  type="color"
                  value={form.themeColor || '#ffffff'}
                  onChange={(e) => patch({ themeColor: e.target.value })}
                  style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <Input
                  value={form.themeColor}
                  onChange={(e) => patch({ themeColor: e.target.value })}
                  placeholder="#1677ff"
                  style={{ width: 120 }}
                />
              </Space>
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text code>{t.faviconField}</Text>}>
              <Input
                value={form.favicon}
                onChange={(e) => patch({ favicon: e.target.value })}
                placeholder={t.faviconPlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text code>{t.canonicalField}</Text>}>
              <Input
                value={form.canonical}
                onChange={(e) => patch({ canonical: e.target.value })}
                placeholder={t.canonicalPlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text code>{t.manifestField}</Text>}>
              <Input
                value={form.manifest}
                onChange={(e) => patch({ manifest: e.target.value })}
                placeholder={t.manifestPlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text code>{t.authorField}</Text>}>
              <Input
                value={form.author}
                onChange={(e) => patch({ author: e.target.value })}
                placeholder={t.authorPlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text code>{t.robotsField}</Text>}>
              <Input
                value={form.robots}
                onChange={(e) => patch({ robots: e.target.value })}
                placeholder="index, follow"
              />
            </FormItem>
          </Col>
        </Row>
      </Card>

      <Card title={t.socialCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} lg={12}>
            <FormItem label={<Text>{t.openGraphField}</Text>}>
              <Checkbox
                checked={form.openGraph}
                onChange={(e) => patch({ openGraph: e.target.checked })}
              >
                {t.openGraphField}
              </Checkbox>
            </FormItem>
            {form.openGraph && (
              <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.ogTypeField}</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={form.ogType}
                    onChange={(v) => patch({ ogType: v })}
                    options={OG_TYPES.map((o) => ({ value: o, label: o }))}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.ogSiteNameField}</Text>
                  <Input
                    value={form.ogSiteName}
                    onChange={(e) => patch({ ogSiteName: e.target.value })}
                    placeholder={t.ogSiteNamePlaceholder}
                  />
                </Col>
                <Col xs={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.ogImageField}</Text>
                  <Input
                    value={form.ogImage}
                    onChange={(e) => patch({ ogImage: e.target.value })}
                    placeholder={t.ogImagePlaceholder}
                  />
                </Col>
              </Row>
            )}
          </Col>
          <Col xs={24} lg={12}>
            <FormItem label={<Text>{t.twitterCardField}</Text>}>
              <Checkbox
                checked={form.twitterCard}
                onChange={(e) => patch({ twitterCard: e.target.checked })}
              >
                {t.twitterCardField}
              </Checkbox>
            </FormItem>
            {form.twitterCard && (
              <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                <Col xs={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.twitterSiteField}</Text>
                  <Input
                    value={form.twitterSite}
                    onChange={(e) => patch({ twitterSite: e.target.value })}
                    placeholder={t.twitterSitePlaceholder}
                  />
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      </Card>

      <Card title={t.assetsCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.cssOptionField}</Text>}>
              <Select
                style={{ width: '100%' }}
                value={form.cssOption}
                onChange={(v) => patch({ cssOption: v })}
                options={labelFor(CSS_OPTIONS, lang)}
              />
            </FormItem>
            {form.cssOption === 'link' && (
              <FormItem label={<Text code>{t.cssHrefField}</Text>}>
                <Input
                  value={form.cssHref}
                  onChange={(e) => patch({ cssHref: e.target.value })}
                  placeholder={t.cssHrefPlaceholder}
                  status={validation.some((e) => e.field === 'cssHref') ? 'error' : ''}
                />
              </FormItem>
            )}
          </Col>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.jsOptionField}</Text>}>
              <Select
                style={{ width: '100%' }}
                value={form.jsOption}
                onChange={(v) => patch({ jsOption: v })}
                options={labelFor(JS_OPTIONS, lang)}
              />
            </FormItem>
            {form.jsOption !== 'none' && form.jsOption !== 'inline' && (
              <FormItem label={<Text code>{t.jsSrcField}</Text>}>
                <Input
                  value={form.jsSrc}
                  onChange={(e) => patch({ jsSrc: e.target.value })}
                  placeholder={t.jsSrcPlaceholder}
                  status={validation.some((e) => e.field === 'jsSrc') ? 'error' : ''}
                />
              </FormItem>
            )}
          </Col>
        </Row>
      </Card>

      <Card title={t.bodyCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24}>
            <FormItem label={<Text>{t.noscriptField}</Text>}>
              <Checkbox
                checked={form.noscript}
                onChange={(e) => patch({ noscript: e.target.checked })}
              >
                {t.noscriptField}
              </Checkbox>
            </FormItem>
          </Col>
          <Col xs={24}>
            <FormItem label={<Text code>{t.bodyContentField}</Text>}>
              <TextArea
                value={form.bodyContent}
                onChange={(e) => patch({ bodyContent: e.target.value })}
                autoSize={{ minRows: 5, maxRows: 14 }}
                style={{ fontFamily: 'monospace' }}
              />
            </FormItem>
          </Col>
          <Col xs={24}>
            <Checkbox
              checked={form.includeComments}
              onChange={(e) => patch({ includeComments: e.target.checked })}
            >
              {t.includeCommentsField}
            </Checkbox>
          </Col>
        </Row>
      </Card>

      {validation.length > 0 && (
        <Alert
          type="error"
          showIcon
          message={t.validationTitle}
          description={validation.map((e, i) => <div key={i}>{renderValidation(e)}</div>)}
        />
      )}

      <Card
        title={t.outputCard}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyHtml}>{t.copy}</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadHtml}>{t.download}</Button>
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
          <code>{html}</code>
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
                <Divider style={{ margin: '8px 0' }} />
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300 }}>
                  <code>{buildBoilerplate.toString()}</code>
                </pre>
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
      {label}
      {children}
    </Space>
  )
}
