import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Collapse,
  Tag,
  Table,
  message,
} from 'antd'
import {
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  FormatPainterOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  UTM_KEYS,
  UTM_PRESETS,
  isValidUrl,
  parseBaseUrl,
  buildUtmUrl,
  extractUtmParams,
  validateUtmParams,
  applyPreset,
  buildShortLabel,
  normalizeUtmValue,
} from '../utils/utmUrlBuilder'

const { Title, Paragraph, Text } = Typography

const EXAMPLE_BASE = 'https://example.com/saas-plans'
const EXAMPLE_CAMPAIGN = 'black-friday-2026'

const SOURCE_SNIPPET = `// Motor do Construtor de URL com UTM
// src/utils/utmUrlBuilder.js

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_id',
  'utm_term',
  'utm_content',
]

function parseBaseUrl(input) {
  try {
    const url = new URL(input.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'protocol' }
    }
    return { ok: true, url }
  } catch {
    return { ok: false, error: 'invalid' }
  }
}

export function buildUtmUrl(baseUrl, params) {
  const parsed = parseBaseUrl(baseUrl)
  if (!parsed.ok) return ''

  const url = new URL(parsed.url.href)

  // Limpa UTM antigos para evitar misturar campanhas.
  UTM_KEYS.forEach((key) => url.searchParams.delete(key))

  // Adiciona params na ordem padrão.
  UTM_KEYS.forEach((key) => {
    const value = params[key]
    if (value && String(value).trim()) {
      url.searchParams.set(key, String(value).trim())
    }
  })

  // Parâmetros customizados no final.
  Object.entries(params).forEach(([key, value]) => {
    if (UTM_KEYS.includes(key)) return
    if (key && String(value).trim()) {
      url.searchParams.set(key, String(value).trim())
    }
  })

  return url.toString()
}`

const translations = {
  pt: {
    title: 'Construtor de URL com UTM',
    intro: (
      <>
        Monte URLs de campanha com os parâmetros UTM corretos — source, medium,
        campaign, id, term e content. A ferramenta valida a URL base, remove
        UTMs antigos para não misturar campanhas e normaliza os valores no
        padrão snake_case. Tudo acontece no navegador.
      </>
    ),
    baseUrlLabel: 'URL base',
    baseUrlPlaceholder: 'https://seusite.com.br/pagina',
    baseUrlInvalid: 'URL inválida — informe um endereço http:// ou https://',
    importFromUrl: 'Importar UTMs da URL',
    presets: 'Canais rápidos',
    googleAds: 'Google Ads',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    twitter: 'Twitter/X',
    newsletter: 'Newsletter',
    email: 'E-mail',
    youtube: 'YouTube',
    organic: 'Orgânico',
    referral: 'Referral',
    utmSource: 'utm_source',
    utmMedium: 'utm_medium',
    utmCampaign: 'utm_campaign',
    utmId: 'utm_id',
    utmTerm: 'utm_term',
    utmContent: 'utm_content',
    utmSourceHint: 'Origem do tráfego (ex.: google, newsletter)',
    utmMediumHint: 'Meio (ex.: cpc, email, social)',
    utmCampaignHint: 'Nome da campanha (ex.: black-friday-2026)',
    utmIdHint: 'ID da campanha no ads',
    utmTermHint: 'Palavra-chave paga (ex.: devtools-saas)',
    utmContentHint: 'Variação do criativo (ex.: banner-a, footer)',
    campaignLabel: 'Nome da campanha',
    campaignPlaceholder: 'black-friday-2026',
    customParams: 'Parâmetros customizados',
    customKey: 'Chave',
    customValue: 'Valor',
    addCustom: 'Adicionar parâmetro',
    remove: 'Remover',
    generated: 'URL gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar tudo',
    normalize: 'Normalizar snake_case',
    shortLabel: 'Resumo',
    warnings: 'Avisos',
    required: (field) => `${field} é obrigatório para rastreamento correto`,
    caseWarning: 'Use letras minúsculas e evite espaços nos UTMs',
    whitespaceWarning: 'Evite espaços no nome da campanha — use hífen ou underline',
    bestPracticesTitle: 'Boas práticas',
    bestPracticesBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            Sempre preencha pelo menos <Text code>utm_source</Text>,{' '}
            <Text code>utm_medium</Text> e <Text code>utm_campaign</Text>.
          </li>
          <li>
            Use letras minúsculas, sem espaços e sem caracteres especiais nos
            valores UTM.
          </li>
          <li>
            Mantenha um padrão fixo de nomenclatura dentro do time — isso evita
            campanhas duplicadas no analytics.
          </li>
          <li>
            Use <Text code>utm_content</Text> para testes A/B de criativos e{' '}
            <Text code>utm_term</Text> para palavras-chave de campanhas pagas.
          </li>
          <li>
            Parâmetros customizados são úteis para enviar dados extras sem
            quebrar a semântica dos UTMs.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'UTM URL Builder',
    intro: (
      <>
        Build campaign URLs with the right UTM parameters — source, medium,
        campaign, id, term and content. The tool validates the base URL, removes
        old UTMs to avoid campaign mixing, and normalizes values to snake_case.
        Everything stays in the browser.
      </>
    ),
    baseUrlLabel: 'Base URL',
    baseUrlPlaceholder: 'https://yoursite.com/page',
    baseUrlInvalid: 'Invalid URL — please provide an http:// or https:// address',
    importFromUrl: 'Import UTMs from URL',
    presets: 'Quick channels',
    googleAds: 'Google Ads',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    twitter: 'Twitter/X',
    newsletter: 'Newsletter',
    email: 'Email',
    youtube: 'YouTube',
    organic: 'Organic',
    referral: 'Referral',
    utmSource: 'utm_source',
    utmMedium: 'utm_medium',
    utmCampaign: 'utm_campaign',
    utmId: 'utm_id',
    utmTerm: 'utm_term',
    utmContent: 'utm_content',
    utmSourceHint: 'Traffic source (e.g. google, newsletter)',
    utmMediumHint: 'Medium (e.g. cpc, email, social)',
    utmCampaignHint: 'Campaign name (e.g. black-friday-2026)',
    utmIdHint: 'Campaign ID in your ads platform',
    utmTermHint: 'Paid keyword (e.g. devtools-saas)',
    utmContentHint: 'Creative variant (e.g. banner-a, footer)',
    campaignLabel: 'Campaign name',
    campaignPlaceholder: 'black-friday-2026',
    customParams: 'Custom parameters',
    customKey: 'Key',
    customValue: 'Value',
    addCustom: 'Add parameter',
    remove: 'Remove',
    generated: 'Generated URL',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear all',
    normalize: 'Normalize snake_case',
    shortLabel: 'Summary',
    warnings: 'Warnings',
    required: (field) => `${field} is required for proper tracking`,
    caseWarning: 'Use lowercase letters and avoid spaces in UTMs',
    whitespaceWarning: 'Avoid spaces in campaign name — use hyphen or underscore',
    bestPracticesTitle: 'Best practices',
    bestPracticesBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            Always fill at least <Text code>utm_source</Text>,{' '}
            <Text code>utm_medium</Text> and <Text code>utm_campaign</Text>.
          </li>
          <li>
            Use lowercase letters, no spaces and no special characters in UTM
            values.
          </li>
          <li>
            Keep a fixed naming convention within the team — this prevents
            duplicate campaigns in analytics.
          </li>
          <li>
            Use <Text code>utm_content</Text> for A/B testing creatives and{' '}
            <Text code>utm_term</Text> for paid keywords.
          </li>
          <li>
            Custom parameters are useful for sending extra data without
            breaking UTM semantics.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Under the hood (algorithm)',
  },
}

const PRESET_ORDER = [
  'googleAds',
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'newsletter',
  'email',
  'youtube',
  'organic',
  'referral',
]

const EMPTY_PARAMS = {
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_id: '',
  utm_term: '',
  utm_content: '',
}

export default function UtmUrlBuilderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [baseUrl, setBaseUrl] = useState(EXAMPLE_BASE)
  const [params, setParams] = useState({
    ...EMPTY_PARAMS,
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: EXAMPLE_CAMPAIGN,
  })
  const [customParams, setCustomParams] = useState([])
  const [copied, setCopied] = useState(false)

  const baseValid = useMemo(() => isValidUrl(baseUrl), [baseUrl])
  const generatedUrl = useMemo(() => {
    if (!baseValid) return ''
    const allParams = { ...params }
    customParams.forEach((p) => {
      if (p.key && String(p.value).trim()) {
        allParams[p.key] = String(p.value).trim()
      }
    })
    return buildUtmUrl(baseUrl, allParams)
  }, [baseUrl, params, customParams, baseValid])

  const warnings = useMemo(() => validateUtmParams(params), [params])
  const shortLabel = useMemo(() => buildShortLabel(params), [params])

  const updateParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }, [])

  const loadPreset = useCallback(
    (presetKey) => {
      const campaign = params.utm_campaign.trim() || EXAMPLE_CAMPAIGN
      const next = applyPreset(presetKey, campaign)
      setParams((prev) => ({ ...prev, ...next }))
    },
    [params.utm_campaign]
  )

  const normalizeAll = useCallback(() => {
    setParams((prev) => {
      const next = {}
      Object.entries(prev).forEach(([key, value]) => {
        next[key] = normalizeUtmValue(value)
      })
      return next
    })
    setCustomParams((prev) =>
      prev.map((p) => ({
        ...p,
        key: normalizeUtmValue(p.key),
        value: normalizeUtmValue(p.value),
      }))
    )
  }, [])

  const importFromUrl = useCallback(() => {
    const extracted = extractUtmParams(baseUrl)
    if (Object.keys(extracted).length === 0) {
      messageApi.info(lang === 'pt' ? 'Nenhum UTM encontrado na URL' : 'No UTMs found in the URL')
      return
    }
    setParams((prev) => ({ ...prev, ...extracted }))
    messageApi.success(lang === 'pt' ? 'UTMs importados' : 'UTMs imported')
  }, [baseUrl, lang, messageApi])

  const addCustomParam = useCallback(() => {
    setCustomParams((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, key: '', value: '' },
    ])
  }, [])

  const updateCustomParam = useCallback((id, field, value) => {
    setCustomParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }, [])

  const removeCustomParam = useCallback((id) => {
    setCustomParams((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setBaseUrl('')
    setParams({ ...EMPTY_PARAMS })
    setCustomParams([])
  }, [])

  const handleCopy = useCallback(async () => {
    if (!generatedUrl) return
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      messageApi.success(t.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      messageApi.error(lang === 'pt' ? 'Erro ao copiar' : 'Copy failed')
    }
  }, [generatedUrl, lang, messageApi, t.copied])

  const customColumns = useMemo(
    () => [
      {
        title: t.customKey,
        dataIndex: 'key',
        key: 'key',
        render: (_, record) => (
          <Input
            value={record.key}
            onChange={(e) => updateCustomParam(record.id, 'key', e.target.value)}
            placeholder={t.customKey}
            size="small"
            style={{ fontFamily: 'monospace' }}
          />
        ),
      },
      {
        title: t.customValue,
        dataIndex: 'value',
        key: 'value',
        render: (_, record) => (
          <Input
            value={record.value}
            onChange={(e) => updateCustomParam(record.id, 'value', e.target.value)}
            placeholder={t.customValue}
            size="small"
          />
        ),
      },
      {
        title: '',
        key: 'action',
        width: 60,
        render: (_, record) => (
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeCustomParam(record.id)}
            aria-label={t.remove}
          />
        ),
      },
    ],
    [t, updateCustomParam, removeCustomParam]
  )

  const warningMessages = useMemo(() => {
    return warnings.map((w) => {
      if (w.type === 'required') return t.required(w.field)
      if (w.type === 'case') return t.caseWarning
      if (w.type === 'whitespace') return t.whitespaceWarning
      return ''
    })
  }, [warnings, t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><LinkOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.baseUrlLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={t.baseUrlPlaceholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap>
            <Button size="small" icon={<ImportOutlined />} onClick={importFromUrl}>
              {t.importFromUrl}
            </Button>
            <Button danger size="small" icon={<ClearOutlined />} onClick={clearAll}>
              {t.clear}
            </Button>
          </Space>
          {!baseValid && baseUrl.trim() && (
            <Alert type="error" message={t.baseUrlInvalid} showIcon />
          )}
        </Space>
      </Card>

      <Card title={t.presets} size="small">
        <Space wrap>
          {PRESET_ORDER.map((key) => (
            <Button key={key} size="small" icon={<ThunderboltOutlined />} onClick={() => loadPreset(key)}>
              {t[key]}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title="UTM parameters">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div>
              <Text type="secondary">{t.utmSource}</Text>
              <Input
                value={params.utm_source}
                onChange={(e) => updateParam('utm_source', e.target.value)}
                placeholder={t.utmSourceHint}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <Text type="secondary">{t.utmMedium}</Text>
              <Input
                value={params.utm_medium}
                onChange={(e) => updateParam('utm_medium', e.target.value)}
                placeholder={t.utmMediumHint}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <Text type="secondary">{t.utmCampaign}</Text>
              <Input
                value={params.utm_campaign}
                onChange={(e) => updateParam('utm_campaign', e.target.value)}
                placeholder={t.utmCampaignHint}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <Text type="secondary">{t.utmId}</Text>
              <Input
                value={params.utm_id}
                onChange={(e) => updateParam('utm_id', e.target.value)}
                placeholder={t.utmIdHint}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <Text type="secondary">{t.utmTerm}</Text>
              <Input
                value={params.utm_term}
                onChange={(e) => updateParam('utm_term', e.target.value)}
                placeholder={t.utmTermHint}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <Text type="secondary">{t.utmContent}</Text>
              <Input
                value={params.utm_content}
                onChange={(e) => updateParam('utm_content', e.target.value)}
                placeholder={t.utmContentHint}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>
          <Button size="small" icon={<FormatPainterOutlined />} onClick={normalizeAll}>
            {t.normalize}
          </Button>
        </Space>
      </Card>

      <Card
        title={t.customParams}
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={addCustomParam}>
            {t.addCustom}
          </Button>
        }
      >
        {customParams.length === 0 ? (
          <Text type="secondary">{lang === 'pt' ? 'Nenhum parâmetro customizado.' : 'No custom parameters.'}</Text>
        ) : (
          <Table
            dataSource={customParams}
            columns={customColumns}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
          />
        )}
      </Card>

      {warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t.warnings}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {warningMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          }
        />
      )}

      <Card
        title={
          <Space size={12}>
            <span>{t.generated}</span>
            <Tag color="blue">{t.shortLabel}: {shortLabel}</Tag>
          </Space>
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            disabled={!generatedUrl}
          >
            {copied ? t.copied : t.copy}
          </Button>
        }
      >
        <pre
          style={{
            margin: 0,
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.6,
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 6,
          }}
        >
          {generatedUrl || (lang === 'pt' ? 'Preencha uma URL base válida e os UTMs.' : 'Fill in a valid base URL and UTMs.')}
        </pre>
      </Card>

      <Alert type="info" showIcon message={t.bestPracticesTitle} description={t.bestPracticesBody} />

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: (
              <pre
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 6,
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {SOURCE_SNIPPET}
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
