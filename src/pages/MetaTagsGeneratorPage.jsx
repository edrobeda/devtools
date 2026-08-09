import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Select, Checkbox, Alert, Collapse, Row, Col, Button, message, Divider, Tag } from 'antd'
import { CopyOutlined, GlobalOutlined, UndoOutlined, PictureOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const DEFAULTS = {
  title: 'DevTools — Ferramentas internas de desenvolvimento',
  description:
    'Um espaço genérico de ferramentas internas de desenvolvimento: geradores, conversores, validadores, cheat sheets e padrões visuais prontos pra usar.',
  canonical: 'https://devtools.eventifylab.com/',
  ogType: 'website',
  siteName: 'DevTools',
  locale: 'pt_BR',
  localeAlternate: 'en_US',
  image: '',
  publishedTime: '',
  author: '',
  themeColor: '#1677ff',
  themeOn: true,
  baseOn: true,
  twitterOn: true,
  twitterCard: 'summary_large_image',
  twitterSite: '',
}

const OG_TYPES = ['website', 'article', 'profile', 'product', 'video.movie', 'music.song', 'blog']

const PRESETS = [
  {
    key: 'landing',
    labelKey: 'presetLanding',
    f: {
      ...DEFAULTS,
      title: 'Produto X — a forma mais simples de automatizar',
      description: 'Conheça o Produto X: velocidade, segurança e simplicidade para o seu fluxo de trabalho.',
      canonical: 'https://produtox.example.com/',
      siteName: 'Produto X',
      locale: 'pt_BR',
      localeAlternate: 'en_US',
      image: 'https://produtox.example.com/og-1200x630.png',
      twitterSite: '@produtox',
    },
  },
  {
    key: 'article',
    labelKey: 'presetArticle',
    f: {
      ...DEFAULTS,
      ogType: 'article',
      title: 'Entendendo o Open Graph por dentro',
      description: 'Como o protocolo Open Graph transforma um link em um cartão rico no feed das redes sociais.',
      canonical: 'https://blog.example.com/entendendo-open-graph',
      siteName: 'Blog da Empresa',
      locale: 'pt_BR',
      localeAlternate: '',
      image: 'https://blog.example.com/assets/og.png',
      publishedTime: '2026-08-09T09:00:00-03:00',
      author: 'Maria Souza',
    },
  },
  {
    key: 'app',
    labelKey: 'presetApp',
    f: {
      ...DEFAULTS,
      title: 'Painel de Métricas',
      description: 'Visualize métricas e relatórios em tempo real, com acesso por equipe e exportação em CSV.',
      canonical: 'https://app.example.com/dashboard',
      ogType: 'product',
      siteName: 'Métricas SA',
      locale: 'en_US',
      localeAlternate: 'pt_BR',
      image: 'https://app.example.com/share/dashboard.png',
      themeColor: '#0b7cff',
    },
  },
]

// Escapa um valor pra atributo HTML: troca & " < > por entidades, pra um
// valor digitado nunca quebrar a tag nem permitir injeção no content.
function escAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Monta o bloco de <head>. Regra central: cada tag só entra quando o campo
// correspondente tem valor (ou a opção está ligada). Ordem fixa — base
// (charset/viewport), theme-color, title, description, canonical, Open Graph
// e por fim o Twitter Card, que espelha os campos do OG.
function buildHeadTags(f) {
  const t = (v) => (v || '').trim()
  const lines = []
  const push = (line) => lines.push(line)

  const title = t(f.title)
  const desc = t(f.description)
  const url = t(f.canonical)
  const siteName = t(f.siteName)
  const locale = t(f.locale)
  const localeAlt = t(f.localeAlternate)
  const image = t(f.image)
  const publishedTime = t(f.publishedTime)
  const author = t(f.author)

  if (f.baseOn) {
    push('<meta charset="UTF-8" />')
    push('<meta name="viewport" content="width=device-width, initial-scale=1.0" />')
  }
  if (f.themeOn && t(f.themeColor)) {
    push(`<meta name="theme-color" content="${escAttr(f.themeColor)}" />`)
  }

  if (title) push(`<title>${escAttr(title)}</title>`)
  if (desc) push(`<meta name="description" content="${escAttr(desc)}" />`)
  if (url) push(`<link rel="canonical" href="${escAttr(url)}" />`)

  push(`<meta property="og:type" content="${escAttr(f.ogType)}" />`)
  if (title) push(`<meta property="og:title" content="${escAttr(title)}" />`)
  if (desc) push(`<meta property="og:description" content="${escAttr(desc)}" />`)
  if (url) push(`<meta property="og:url" content="${escAttr(url)}" />`)
  if (image) push(`<meta property="og:image" content="${escAttr(image)}" />`)
  if (siteName) push(`<meta property="og:site_name" content="${escAttr(siteName)}" />`)
  if (locale) push(`<meta property="og:locale" content="${escAttr(locale)}" />`)
  if (localeAlt) push(`<meta property="og:locale:alternate" content="${escAttr(localeAlt)}" />`)
  if (f.ogType === 'article' && publishedTime) {
    push(`<meta property="article:published_time" content="${escAttr(publishedTime)}" />`)
  }
  if (f.ogType === 'article' && author) {
    push(`<meta property="article:author" content="${escAttr(author)}" />`)
  }

  if (f.twitterOn) {
    push(`<meta name="twitter:card" content="${escAttr(f.twitterCard)}" />`)
    if (title) push(`<meta name="twitter:title" content="${escAttr(title)}" />`)
    if (desc) push(`<meta name="twitter:description" content="${escAttr(desc)}" />`)
    if (image) push(`<meta name="twitter:image" content="${escAttr(image)}" />`)
    if (t(f.twitterSite)) push(`<meta name="twitter:site" content="${escAttr(f.twitterSite)}" />`)
  }

  return lines
}

const translations = {
  pt: {
    title: 'Gerador de Meta Tags (SEO / Open Graph)',
    intro:
      'Monta o bloco de <head> de uma página — title, description, canonical, Open Graph, Twitter Card e theme-color — pronto pra colar numa landing, num artigo ou num app. Só strings sendo montadas localmente, nada sai do navegador.',
    pageCard: '1 · Informações da página',
    titleField: 'Título (title)',
    titlePlaceholder: 'Título da página',
    descField: 'Resumo (description)',
    descPlaceholder: 'Resumo da página — até 160 caracteres',
    canonicalField: 'Canonical / og:url',
    authorField: 'Autor do artigo',
    authorHint: 'só para o tipo "article"',
    shareCard: '2 · Compartilhamento social (Open Graph)',
    optCard: '3 · Opções',
    ogImage: 'og:image',
    imageHint: 'absoluta https, ~1200×630 — crawlers baixam o arquivo',
    themeField: 'theme-color',
    themeHint: 'cor da aba no navegador',
    baseTags: 'Incluir charset + viewport',
    themeColor: 'Incluir theme-color',
    twitterOn: 'Incluir Twitter Card',
    twitterCardField: 'twitter:card',
    twitterLarge: 'summary_large_image',
    twitterSummary: 'summary (só texto)',
    twitterSitePlaceholder: 'Handle @empresa',
    output: 'HTML gerado',
    copy: 'Copiar',
    copied: 'Head copiado!',
    reset: 'Restaurar',
    presets: 'Modelos de um clique',
    presetLanding: 'Landing page',
    presetArticle: 'Artigo de blog',
    presetApp: 'App / dashboard',
    preview: 'Prévia do compartilhamento',
    previewNote: 'A prévia usa só os dados preenchidos (sem baixar a imagem) — o cartão real é renderizado pelos crawlers de cada rede.',
    nothing: 'Preencha o título para ver a prévia',
    titleCount: (n) => `title ${n}/60`,
    descCount: (n) => `description ${n}/160`,
    countRange: 'faixa recomendada',
    lines: (n) => `${n} linhas`,
    bytes: (n) => `${n} bytes`,
    nohead: '<!-- preencha os campos acima -->',
    tipTitle: 'Como o ecossistema de meta tags se comporta',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>og:title / og:description / og:url</Text> espelham o{' '}
          <Text code>title</Text>, a <Text code>description</Text> e o{' '}
          <Text code>canonical</Text> — se a tag faltar, o crawler cai no valor
          cru do documento.
        </li>
        <li>
          <Text strong>Title ~50–60 caracteres</Text> e{' '}
          <Text strong>description ~140–160</Text>: além do SEO, é o texto que
          aparece (truncado) no cartão. Os contadores da página ajudam a julgar
          — verde na faixa, vermelho acima.
        </li>
        <li>
          <Text strong>Twitter Card herda o Open Graph</Text>: sem{' '}
          <Text code>twitter:title</Text>/<Text code>description</Text>/<Text code>image</Text>,
          o Twitter usa os <Text code>og:*</Text> — por isso as duas listas
          saem com o mesmo conteúdo aqui; o <Text code>twitter:card</Text> só
          opta entre <em>summary</em> (sem imagem) e <em>summary_large_image</em>.
        </li>
        <li>
          <Text strong>og:image precisa de URL absoluta e acessível</Text>: o bot
          de compartilhamento baixa o arquivo ao renderizar o cartão — imagem
          quebrada derruba só o cartão, nunca a página.
        </li>
        <li>
          <Text strong>canonical ≠ noindex</Text>: canonical é sinalização de
          preferência; pra tirar do índice você usa{' '}
          <Text code>&lt;meta name="robots" content="noindex"&gt;</Text> (ou o
          robots.txt).
        </li>
      </ul>
    ),
    sourceCol: 'Algoritmo-fonte',
    sourceBody:
      'A regra central é "cada tag só entra se o campo tiver valor": base e theme-color são opções ligadas, o Open Graph espelha title/description/canonical e o Twitter espelha o OG. escAttr troca & < > por entidades pra nenhum valor digitado quebrar o atributo.',
  },
  en: {
    title: 'Meta Tags Generator (SEO / Open Graph)',
    intro:
      'Assembles the <head> block of a page — title, description, canonical, Open Graph, Twitter Card and theme-color — ready to paste into a landing page, article or app. Only local string assembly, nothing leaves the browser.',
    pageCard: '1 · Page info',
    titleField: 'Title',
    titlePlaceholder: 'Page title',
    descField: 'Description',
    descPlaceholder: 'Page summary — up to ~160 characters',
    canonicalField: 'Canonical / og:url',
    authorField: 'Article author',
    authorHint: 'only for "article" type',
    shareCard: '2 · Social sharing (Open Graph)',
    optCard: '3 · Options',
    ogImage: 'og:image',
    imageHint: 'absolute https, ~1200×630 — crawlers fetch the file',
    themeField: 'theme-color',
    themeHint: 'browser tab color',
    baseTags: 'Include charset + viewport',
    themeColor: 'Include theme-color',
    twitterOn: 'Include Twitter Card',
    twitterCardField: 'twitter:card',
    twitterLarge: 'summary_large_image',
    twitterSummary: 'summary (text only)',
    twitterSitePlaceholder: 'Enter @handle',
    output: 'Generated HTML',
    copy: 'Copy',
    copied: 'Head copied!',
    reset: 'Reset',
    presets: 'One-click templates',
    presetLanding: 'Landing page',
    presetArticle: 'Blog article',
    presetApp: 'Web app',
    preview: 'Share preview',
    previewNote: 'The preview only uses filled data (no image fetch) — the real card is rendered by each platform’s own crawler.',
    nothing: 'Fill in the title to see the preview',
    titleCount: (n) => `title ${n}/60`,
    descCount: (n) => `description ${n}/160`,
    lines: (n) => `${n} line${n === 1 ? '' : 's'}`,
    bytes: (n) => `${n} bytes`,
    nohead: '<!-- fill the fields above -->',
    tipTitle: 'How the meta tag ecosystem behaves',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>og:title/description/url</Text> mirror the{' '}
          <Text code>title</Text>, <Text code>description</Text> and{' '}
          <Text code>canonical</Text> — if a tag is missing, crawlers fall back
          to the raw document value.
        </li>
        <li>
          <Text strong>~50–60 char titles</Text> and{' '}
          <Text strong>~150–160 char descriptions</Text> are what render in the
          card; the counters up top mark the recommended range.
        </li>
        <li>
          <Text strong>Twitter cards inherit og:*</Text> — a missing{' '}
          <Text code>twitter:title</Text>/<Text code>description</Text>/<Text code>image</Text>
          falls back to <Text code>og:*</Text>, which is why both lists share
          the same content here.
        </li>
        <li>
          <Text strong>og:image must be an absolute URL</Text>: the bot fetches
          that file at render time — a broken image only kills the card, never
          the page.
        </li>
        <li>
          <Text strong>canonical ≠ noindex</Text>: canonical only signals
          preference; to stay out of search results you need{' '}
          <Text code>&lt;meta name="robots" content="noindex"&gt;</Text> or the
          robots.txt.
        </li>
      </ul>
    ),
    sourceCol: 'Source code',
    sourceBody:
      'The core rule is " each tag only enters if its field has a value": base and theme-color are opt-in, Open Graph mirrors title/description/canonical and Twitter mirrors OG. escAttr escapes & and < so no typed value ever breaks the attribute.',
  },
}

export default function MetaTagsGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [f, setF] = useState(DEFAULTS)

  const patch = (p) => setF((prev) => ({ ...prev, ...p }))
  const reset = () => setF(DEFAULTS)

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (preset) setF(preset.f)
  }

  const headLines = useMemo(() => buildHeadTags(f), [f])
  const code = useMemo(() => headLines.join('\n'), [headLines])
  const lineCount = code.length ? code.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([code]).size, [code])

  const copy = () => {
    navigator.clipboard.writeText(code)
    message.success(t.copied)
  }

  const title = f.title.trim()
  const desc = f.description.trim()
  const host = useMemo(() => {
    try {
      return new URL(f.canonical.trim()).host
    } catch {
      return ''
    }
  }, [f.canonical])

  const isArticle = f.ogType === 'article'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
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

      <Card title={t.pageCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.titleField}</Text>} right={<Tag color={title.length > 60 ? 'error' : 'success'} style={{ fontSize: 11 }}>{t.titleCount(title.length)}</Tag>}>
              <Input value={f.title} onChange={(e) => patch({ title: e.target.value })} placeholder={t.titlePlaceholder} />
            </FormItem>
          </Col>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.descField}</Text>} right={<Tag color={desc.length > 160 ? 'error' : 'success'} style={{ fontSize: 11 }}>{t.descCount(desc.length)}</Tag>}>
              <Input.TextArea rows={2} value={f.description} onChange={(e) => patch({ description: e.target.value })} placeholder={t.descPlaceholder} />
            </FormItem>
          </Col>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.canonicalField}</Text>}>
              <Input value={f.canonical} onChange={(e) => patch({ canonical: e.target.value })} placeholder="https://exemplo.com/pagina" />
            </FormItem>
          </Col>
          <Col xs={24} lg={12}>
            <FormItem label={<Text>{t.authorField} <Text type="secondary" style={{ fontSize: 12 }}>({t.authorHint})</Text></Text>}>
              <Input value={f.author} disabled={!isArticle} onChange={(e) => patch({ author: e.target.value })} placeholder={lang === 'pt' ? 'Nome do autor' : 'Author name'} />
            </FormItem>
          </Col>
        </Row>
      </Card>

      <Card title={t.shareCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} md={8}>
            <FormItem label={<Text code>og:type</Text>}>
              <Select style={{ width: '100%' }} value={f.ogType} onChange={(v) => patch({ ogType: v })} options={OG_TYPES.map((ot) => ({ value: ot, label: ot }))} />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <FormItem label={<Text code>og:site_name</Text>}>
              <Input value={f.siteName} onChange={(e) => patch({ siteName: e.target.value })} placeholder={lang === 'pt' ? 'Nome do site' : 'Site name'} />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <FormItem label={<Text code>og:locale</Text>}>
              <Input value={f.locale} onChange={(e) => patch({ locale: e.target.value })} placeholder="pt_BR" />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <FormItem label={<Text code>og:locale:alternate</Text>}>
              <Input value={f.localeAlternate} onChange={(e) => patch({ localeAlternate: e.target.value })} placeholder="en_US" />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <FormItem label={<Text code>{t.ogImage}</Text>}>
              <Input value={f.image} onChange={(e) => patch({ image: e.target.value })} placeholder="https://exemplo.com/card.png" prefix={<PictureOutlined />} />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <FormItem label={<Text code>article:published_time</Text>}>
              <Input value={f.publishedTime} disabled={!isArticle} onChange={(e) => patch({ publishedTime: e.target.value })} placeholder="2026-08-09T09:00:00-03:00" />
            </FormItem>
          </Col>
        </Row>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{t.imageHint}</Text>
        <Divider style={{ margin: '4px 0 12px' }} />
        <Space align="center" wrap>
          <Text code>{t.themeField}</Text>
          <input type="color" value={f.themeColor} onChange={(e) => patch({ themeColor: e.target.value })} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }} />
          <Input value={f.themeColor} onChange={(e) => patch({ themeColor: e.target.value })} style={{ width: 110 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>({t.themeHint})</Text>
        </Space>
      </Card>

      <Card title={t.optCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4}>
              <Checkbox checked={f.baseOn} onChange={(e) => patch({ baseOn: e.target.checked })}>{t.baseTags}</Checkbox>
              <Checkbox checked={f.themeOn} onChange={(e) => patch({ themeOn: e.target.checked })}>{t.themeColor}</Checkbox>
              <Checkbox checked={f.twitterOn} onChange={(e) => patch({ twitterOn: e.target.checked })}>{t.twitterOn}</Checkbox>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text code>{t.twitterCardField}</Text>
              <Select style={{ width: '100%' }} disabled={!f.twitterOn} value={f.twitterCard} onChange={(v) => patch({ twitterCard: v })} options={[{ value: 'summary', label: t.twitterSummary }, { value: 'summary_large_image', label: t.twitterLarge }]} />
              <Input disabled={!f.twitterOn} value={f.twitterSite} onChange={(e) => patch({ twitterSite: e.target.value })} placeholder={t.twitterSitePlaceholder} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={13}>
          <Card title={t.output} extra={<Space size={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.lines(lineCount)} · {t.bytes(byteCount)}</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>
          </Space>}>
            <pre style={{ margin: 0, overflowX: 'auto', background: '#0d1117', color: '#e6edf3', padding: 12, borderRadius: 8, maxHeight: 420, fontSize: 12.5, lineHeight: 1.6 }}>
              <code>{code || t.nohead}</code>
            </pre>
          </Card>
        </Col>
        <Col xs={24} lg={11}>
          <Card title={t.preview} extra={<Text type="secondary" style={{ fontSize: 12 }}>og:type {f.ogType}</Text>}>
            {title ? (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ height: 96, background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 55%, #faad14 130%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: 'rgba(255,255,255,0.92)' }}>
                    <GlobalOutlined />
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{host || f.canonical || 'example.com'}</Text>
                    <Text strong style={{ display: 'block', marginTop: 4 }}>{title}</Text>
                    {f.siteName.trim() && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>{f.siteName}</Text>}
                    {desc && (
                      <Text type="secondary" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 4 }}>
                        {desc}
                      </Text>
                    )}
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.previewNote}</Text>
              </Space>
            ) : (
              <Text type="secondary">{t.nothing}</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceCol,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 220 }}><code>{escAttr.toString()}</code></pre>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300 }}><code>{buildHeadTags.toString()}</code></pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}

// helper de label+contador para os campos de título/descrição
function FormItem({ label, right, children }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        {label}
        {right}
      </Space>
      {children}
    </Space>
  )
}