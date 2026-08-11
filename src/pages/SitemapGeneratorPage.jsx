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
  Tag,
  message,
  Checkbox,
  Radio,
  Divider,
} from 'antd'
import {
  GlobalOutlined,
  CopyOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildSitemapXml,
  validateEntry,
  buildWarnings,
  todayIso,
  isAbsoluteUrl,
} from '../utils/sitemapGenerator'

const { Title, Paragraph, Text } = Typography

const EMPTY_ENTRY = { loc: '', lastmod: '', changefreq: '', priority: '' }

const CHANGEFREQS = ['', 'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']

const PRESETS = [
  {
    key: 'landing',
    labelKey: 'presetLanding',
    urls: ['/'],
  },
  {
    key: 'blog',
    labelKey: 'presetBlog',
    urls: ['/', '/blog', '/blog/post-1', '/blog/post-2', '/sobre'],
  },
  {
    key: 'ecommerce',
    labelKey: 'presetEcommerce',
    urls: ['/', '/produtos', '/produtos/categoria-a', '/produtos/categoria-b', '/carrinho', '/checkout'],
  },
]

const translations = {
  pt: {
    title: 'Gerador de Sitemap XML',
    intro:
      'Monta um arquivo sitemap.xml válido no protocolo Sitemaps.org — com <loc>, <lastmod>, <changefreq> e <priority> — pronto pra colar no <head> ou enviar pro Google Search Console. Tudo acontece no navegador, nenhuma URL sai daqui.',
    baseHost: 'Host base',
    baseHostPlaceholder: 'https://exemplo.com',
    baseHostHint: 'URLs relativas são prefixadas com esse host.',
    options: 'Opções',
    includeLastmod: 'Incluir <lastmod> quando preenchido',
    formatPretty: 'Pretty print',
    formatMinify: 'Minificado',
    entries: 'URLs do sitemap',
    addUrl: 'Adicionar URL',
    clear: 'Limpar tudo',
    presets: 'Modelos de um clique',
    presetLanding: 'Landing page',
    presetBlog: 'Blog',
    presetEcommerce: 'E-commerce',
    urlColumn: 'URL (loc)',
    lastmodColumn: 'Última modificação',
    changefreqColumn: 'Frequência',
    priorityColumn: 'Prioridade',
    priorityPlaceholder: '0.0–1.0',
    output: 'sitemap.xml gerado',
    copy: 'Copiar',
    copied: 'Sitemap copiado!',
    download: 'Baixar .xml',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    emptyOutput: '<!-- preencha as URLs acima -->',
    validationTitle: 'Problemas encontrados',
    noErrors: 'Nenhum problema encontrado.',
    warningsTitle: 'Avisos',
    noWarnings: 'Nenhum aviso.',
    errorMessages: {
      empty: 'URL obrigatória',
      invalid: 'URL inválida',
      relative: 'URL relativa sem host base',
    },
    fieldLabels: {
      loc: 'URL',
      lastmod: 'lastmod',
      changefreq: 'changefreq',
      priority: 'priority',
    },
    duplicateWarning: (loc) => `URL duplicada: ${loc}`,
    tipTitle: 'Dicas de sitemap',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>&lt;loc&gt; deve ser absoluta</Text> — crawlers precisam de{' '}
          <Text code>https://...</Text>. Use o host base pra transformar caminhos
          relativos automaticamente.
        </li>
        <li>
          <Text strong>Limite do protocolo</Text>: até 50.000 URLs e 50 MB
          (descompactado). Sitemaps maiores devem ser divididos e listados num
          índice (<Text code>sitemapindex</Text>).
        </li>
        <li>
          <Text strong>&lt;priority&gt; é relativa</Text>: valores de{' '}
          <Text code>0.0</Text> a <Text code>1.0</Text>. Não afeta ranking
          absoluto — só sugere importância entre as próprias URLs.
        </li>
        <li>
          <Text strong>&lt;changefreq&gt;</Text> é uma dica, não uma promessa:
          use <Text code>daily/monthly</Text> para conteúdo que muda com
          regularidade e <Text code>never</Text> para páginas fixas.
        </li>
      </ul>
    ),
    sourceCol: 'Algoritmo-fonte',
    sourceBody:
      'buildSitemapXml percorre as entradas, normaliza URLs relativas com o host base, escapa tudo com escapeXml e monta a string XML. validateEntry verifica cada campo separadamente para mostrar erros específicos por linha.',
  },
  en: {
    title: 'XML Sitemap Generator',
    intro:
      'Builds a valid sitemap.xml following the Sitemaps.org protocol — with <loc>, <lastmod>, <changefreq> and <priority> — ready to paste into your site or submit to Google Search Console. Everything happens in the browser; no URL leaves this page.',
    baseHost: 'Base host',
    baseHostPlaceholder: 'https://example.com',
    baseHostHint: 'Relative URLs are prefixed with this host.',
    options: 'Options',
    includeLastmod: 'Include <lastmod> when filled',
    formatPretty: 'Pretty print',
    formatMinify: 'Minified',
    entries: 'Sitemap URLs',
    addUrl: 'Add URL',
    clear: 'Clear all',
    presets: 'One-click templates',
    presetLanding: 'Landing page',
    presetBlog: 'Blog',
    presetEcommerce: 'E-commerce',
    urlColumn: 'URL (loc)',
    lastmodColumn: 'Last modified',
    changefreqColumn: 'Frequency',
    priorityColumn: 'Priority',
    priorityPlaceholder: '0.0–1.0',
    output: 'Generated sitemap.xml',
    copy: 'Copy',
    copied: 'Sitemap copied!',
    download: 'Download .xml',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    emptyOutput: '<!-- fill the URLs above -->',
    validationTitle: 'Issues found',
    noErrors: 'No issues found.',
    warningsTitle: 'Warnings',
    noWarnings: 'No warnings.',
    errorMessages: {
      empty: 'URL is required',
      invalid: 'Invalid URL',
      relative: 'Relative URL without base host',
    },
    fieldLabels: {
      loc: 'URL',
      lastmod: 'lastmod',
      changefreq: 'changefreq',
      priority: 'priority',
    },
    duplicateWarning: (loc) => `Duplicate URL: ${loc}`,
    tipTitle: 'Sitemap tips',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>&lt;loc&gt; must be absolute</Text> — crawlers need{' '}
          <Text code>https://...</Text>. Set a base host to convert relative
          paths automatically.
        </li>
        <li>
          <Text strong>Protocol limit</Text>: up to 50,000 URLs and 50 MB
          (uncompressed). Larger sitemaps should be split and listed in a{' '}
          <Text code>sitemapindex</Text>.
        </li>
        <li>
          <Text strong>&lt;priority&gt; is relative</Text>: values from{' '}
          <Text code>0.0</Text> to <Text code>1.0</Text>. It does not affect
          absolute ranking — it only hints importance among your own URLs.
        </li>
        <li>
          <Text strong>&lt;changefreq&gt;</Text> is a hint, not a promise: use{' '}
          <Text code>daily/monthly</Text> for regularly changing content and{' '}
          <Text code>never</Text> for static pages.
        </li>
      </ul>
    ),
    sourceCol: 'Source code',
    sourceBody:
      'buildSitemapXml iterates over entries, normalizes relative URLs with the base host, escapes everything with escapeXml and builds the XML string. validateEntry checks each field separately so errors are shown per row.',
  },
}

export default function SitemapGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [baseHost, setBaseHost] = useState('')
  const [includeLastmod, setIncludeLastmod] = useState(true)
  const [pretty, setPretty] = useState(true)
  const [entries, setEntries] = useState([{ ...EMPTY_ENTRY, loc: '/', lastmod: todayIso() }])

  const options = useMemo(
    () => ({ baseHost, includeLastmod, pretty }),
    [baseHost, includeLastmod, pretty]
  )

  const xml = useMemo(() => buildSitemapXml(entries, options), [entries, options])
  const lineCount = xml ? xml.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([xml]).size, [xml])

  const validationErrors = useMemo(() => {
    const all = []
    for (let i = 0; i < entries.length; i++) {
      all.push(...validateEntry(entries[i], i, baseHost))
    }
    return all
  }, [entries, baseHost])

  const warnings = useMemo(() => buildWarnings(entries, baseHost), [entries, baseHost])

  const updateEntry = (index, patch) => {
    setEntries((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const addEntry = () => setEntries((prev) => [...prev, { ...EMPTY_ENTRY, lastmod: todayIso() }])

  const removeEntry = (index) => {
    setEntries((prev) => {
      const next = [...prev]
      next.splice(index, 1)
      return next.length ? next : [{ ...EMPTY_ENTRY, lastmod: todayIso() }]
    })
  }

  const moveEntry = (index, direction) => {
    setEntries((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  const clearAll = () => setEntries([{ ...EMPTY_ENTRY, lastmod: todayIso() }])

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setEntries(
      preset.urls.map((loc) => ({
        loc,
        lastmod: todayIso(),
        changefreq: loc === '/' ? 'weekly' : 'monthly',
        priority: loc === '/' ? '1.0' : '0.8',
      }))
    )
  }

  const copyXml = () => {
    navigator.clipboard.writeText(xml)
    message.success(t.copied)
  }

  const downloadXml = () => {
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasErrors = validationErrors.length > 0
  const hasWarnings = warnings.length > 0
  const baseIsAbsolute = isAbsoluteUrl(baseHost)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.baseHost}>
            <Input
              value={baseHost}
              onChange={(e) => setBaseHost(e.target.value)}
              placeholder={t.baseHostPlaceholder}
              prefix={<GlobalOutlined />}
              status={baseHost && !baseIsAbsolute ? 'warning' : ''}
            />
            {baseHost && !baseIsAbsolute && (
              <Paragraph type="warning" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
                {lang === 'pt' ? 'O host base deve começar com http:// ou https://' : 'Base host should start with http:// or https://'}
              </Paragraph>
            )}
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
              {t.baseHostHint}
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t.options}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Checkbox checked={includeLastmod} onChange={(e) => setIncludeLastmod(e.target.checked)}>
                {t.includeLastmod}
              </Checkbox>
              <Radio.Group value={pretty} onChange={(e) => setPretty(e.target.value)}>
                <Radio value>{t.formatPretty}</Radio>
                <Radio value={false}>{t.formatMinify}</Radio>
              </Radio.Group>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            {t.entries}
            <Tag>{entries.length}</Tag>
          </Space>
        }
        extra={
          <Space wrap>
            <Text strong>{t.presets}</Text>
            {PRESETS.map((p) => (
              <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>{t[p.labelKey]}</Button>
            ))}
            <Divider type="vertical" />
            <Button size="small" icon={<PlusOutlined />} onClick={addEntry}>{t.addUrl}</Button>
            <Button size="small" danger onClick={clearAll}>{t.clear}</Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {entries.map((entry, index) => {
            const rowErrors = validationErrors.filter((e) => e.index === index)
            const errorFields = new Set(rowErrors.map((e) => e.field))
            return (
              <div
                key={index}
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 12,
                  background: errorFields.size > 0 ? '#fff2f0' : '#fafafa',
                }}
              >
                <Row gutter={[12, 12]} align="middle">
                  <Col xs={24} lg={9}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.urlColumn}</Text>
                    <Input
                      value={entry.loc}
                      onChange={(e) => updateEntry(index, { loc: e.target.value })}
                      placeholder="/caminho"
                      status={errorFields.has('loc') ? 'error' : ''}
                    />
                  </Col>
                  <Col xs={12} lg={4}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.lastmodColumn}</Text>
                    <Input
                      value={entry.lastmod}
                      onChange={(e) => updateEntry(index, { lastmod: e.target.value })}
                      placeholder="2026-08-11"
                      status={errorFields.has('lastmod') ? 'error' : ''}
                    />
                  </Col>
                  <Col xs={12} lg={4}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.changefreqColumn}</Text>
                    <Select
                      style={{ width: '100%' }}
                      value={entry.changefreq}
                      onChange={(v) => updateEntry(index, { changefreq: v })}
                      options={CHANGEFREQS.map((cf) => ({ value: cf, label: cf || '—' }))}
                      status={errorFields.has('changefreq') ? 'error' : ''}
                    />
                  </Col>
                  <Col xs={12} lg={4}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.priorityColumn}</Text>
                    <Input
                      value={entry.priority}
                      onChange={(e) => updateEntry(index, { priority: e.target.value })}
                      placeholder={t.priorityPlaceholder}
                      status={errorFields.has('priority') ? 'error' : ''}
                    />
                  </Col>
                  <Col xs={12} lg={3}>
                    <Space>
                      <Button
                        size="small"
                        icon={<UpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveEntry(index, -1)}
                      />
                      <Button
                        size="small"
                        icon={<DownOutlined />}
                        disabled={index === entries.length - 1}
                        onClick={() => moveEntry(index, 1)}
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeEntry(index)}
                      />
                    </Space>
                  </Col>
                </Row>
                {rowErrors.length > 0 && (
                  <Paragraph type="danger" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
                    {rowErrors.map((e) => `${t.fieldLabels[e.field]}: ${t.errorMessages[e.type] || e.type}`).join(' · ')}
                  </Paragraph>
                )}
              </div>
            )
          })}
        </Space>
      </Card>

      {(hasErrors || hasWarnings) && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={hasErrors && hasWarnings ? 12 : 24}>
            {hasErrors && (
              <Alert
                type="error"
                showIcon
                icon={<WarningOutlined />}
                message={t.validationTitle}
                description={validationErrors.length}
              />
            )}
          </Col>
          <Col xs={24} lg={hasErrors && hasWarnings ? 12 : 24}>
            {hasWarnings && (
              <Alert
                type="warning"
                showIcon
                message={t.warningsTitle}
                description={warnings.map((w, i) => (
                  <div key={i}>{t.duplicateWarning(w.loc)}</div>
                ))}
              />
            )}
          </Col>
        </Row>
      )}

      <Card
        title={t.output}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyXml}>{t.copy}</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadXml}>{t.download}</Button>
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
          <code>{xml || t.emptyOutput}</code>
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
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300 }}>
                  <code>{buildSitemapXml.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
