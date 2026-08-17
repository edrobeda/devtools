import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Form,
  Input,
  Select,
  Checkbox,
  Switch,
  InputNumber,
  Tabs,
  Alert,
  Button,
  Space,
  Row,
  Col,
  Collapse,
  message,
} from 'antd'
import {
  SafetyOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  HTTP_METHODS,
  PRESETS,
  generateAll,
} from '../utils/corsConfigGenerator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { TextArea } = Input
const { Option } = Select

const sourceCode = `import { generateAll, PRESETS } from '../utils/corsConfigGenerator'

const options = {
  origins: ['https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 7200,
}

const { normalized, outputs } = generateAll(options)
// normalized: { origins, methods, headers, exposedHeaders, credentials, maxAge, warnings }
// outputs: { nginx, apache, express, fastapi, spring, aspnet, headers }
`

const FORMATS = [
  { key: 'nginx', label: { pt: 'nginx', en: 'nginx' } },
  { key: 'apache', label: { pt: 'Apache (.htaccess)', en: 'Apache (.htaccess)' } },
  { key: 'express', label: { pt: 'Express.js (cors)', en: 'Express.js (cors)' } },
  { key: 'fastapi', label: { pt: 'FastAPI', en: 'FastAPI' } },
  { key: 'spring', label: { pt: 'Spring Boot', en: 'Spring Boot' } },
  { key: 'aspnet', label: { pt: 'ASP.NET Core', en: 'ASP.NET Core' } },
  { key: 'headers', label: { pt: 'Cabeçalhos HTTP crus', en: 'Raw HTTP headers' } },
]

const translations = {
  pt: {
    title: 'Gerador de Configuração CORS',
    subtitle: 'Gere configs CORS para nginx, Apache, Express, FastAPI, Spring e ASP.NET Core',
    intro: 'Preencha as origens, métodos e cabeçalhos permitidos e obtenha a configuração pronta para vários servidores e frameworks. A ferramenta alerta sobre incompatibilidades comuns, como credentials=true com origem *.',
    presets: 'Cenários rápidos',
    configTitle: 'Configuração',
    originsLabel: 'Origens permitidas (uma por linha)',
    originsPlaceholder: 'https://app.exemplo.com\nhttps://admin.exemplo.com',
    methodsLabel: 'Métodos permitidos',
    headersLabel: 'Cabeçalhos permitidos (um por linha)',
    headersPlaceholder: 'Content-Type\nAuthorization\nX-Request-Id',
    exposedHeadersLabel: 'Cabeçalhos expostos (um por linha)',
    exposedHeadersPlaceholder: 'X-Total-Count\nX-Request-Id',
    credentialsLabel: 'Permitir credentials (cookies/autorização)',
    maxAgeLabel: 'Max-Age do preflight (segundos)',
    outputTitle: 'Configuração gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyAll: 'Copiar todas',
    warningsTitle: 'Avisos',
    sourceTitle: 'Motor de geração',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhuma configuração sai do navegador.',
    note: 'Valores vazios são ignorados. Quando há múltiplas origens e credentials, o gerador usa patterns/variáveis para refletir a origem da requisição.',
  },
  en: {
    title: 'CORS Config Generator',
    subtitle: 'Generate CORS configs for nginx, Apache, Express, FastAPI, Spring and ASP.NET Core',
    intro: 'Fill in allowed origins, methods, and headers and get ready-to-use configurations for several servers and frameworks. The tool warns about common pitfalls such as credentials=true with a * origin.',
    presets: 'Quick scenarios',
    configTitle: 'Configuration',
    originsLabel: 'Allowed origins (one per line)',
    originsPlaceholder: 'https://app.example.com\nhttps://admin.example.com',
    methodsLabel: 'Allowed methods',
    headersLabel: 'Allowed headers (one per line)',
    headersPlaceholder: 'Content-Type\nAuthorization\nX-Request-Id',
    exposedHeadersLabel: 'Exposed headers (one per line)',
    exposedHeadersPlaceholder: 'X-Total-Count\nX-Request-Id',
    credentialsLabel: 'Allow credentials (cookies/authorization)',
    maxAgeLabel: 'Preflight Max-Age (seconds)',
    outputTitle: 'Generated configuration',
    copy: 'Copy',
    copied: 'Copied!',
    copyAll: 'Copy all',
    warningsTitle: 'Warnings',
    sourceTitle: 'Generation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no configuration leaves the browser.',
    note: 'Empty values are ignored. When there are multiple origins with credentials, the generator uses patterns/variables to mirror the request origin.',
  },
}

export default function CorsConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [origins, setOrigins] = useState('https://app.example.com')
  const [methods, setMethods] = useState(['GET', 'POST', 'PUT', 'DELETE'])
  const [headers, setHeaders] = useState('Content-Type\nAuthorization')
  const [exposedHeaders, setExposedHeaders] = useState('X-Total-Count')
  const [credentials, setCredentials] = useState(true)
  const [maxAge, setMaxAge] = useState(7200)
  const [activeTab, setActiveTab] = useState('nginx')

  const options = useMemo(
    () => ({
      origins: origins.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
      methods,
      headers: headers.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
      exposedHeaders: exposedHeaders.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
      credentials,
      maxAge,
    }),
    [origins, methods, headers, exposedHeaders, credentials, maxAge]
  )

  const { normalized, outputs } = useMemo(() => generateAll(options), [options])

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(t.copied)
    } catch {
      message.error('Copy failed')
    }
  }

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setOrigins(p.origins.join('\n'))
    setMethods(p.methods)
    setHeaders(p.headers.join('\n'))
    setExposedHeaders(p.exposedHeaders.join('\n'))
    setCredentials(p.credentials)
    setMaxAge(p.maxAge)
  }

  const allOutputsText = useMemo(
    () =>
      FORMATS.map((f) => `=== ${f.label[lang]} ===\n${outputs[f.key]}`).join('\n\n'),
    [outputs, lang]
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2}>
        <SafetyOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={t.configTitle}>
            <Form layout="vertical" size="small">
              <Form.Item label={t.originsLabel}>
                <TextArea
                  rows={3}
                  value={origins}
                  onChange={(e) => setOrigins(e.target.value)}
                  placeholder={t.originsPlaceholder}
                />
              </Form.Item>

              <Form.Item label={t.methodsLabel}>
                <Checkbox.Group
                  options={HTTP_METHODS}
                  value={methods}
                  onChange={(v) => setMethods(v)}
                />
              </Form.Item>

              <Form.Item label={t.headersLabel}>
                <TextArea
                  rows={3}
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder={t.headersPlaceholder}
                />
              </Form.Item>

              <Form.Item label={t.exposedHeadersLabel}>
                <TextArea
                  rows={2}
                  value={exposedHeaders}
                  onChange={(e) => setExposedHeaders(e.target.value)}
                  placeholder={t.exposedHeadersPlaceholder}
                />
              </Form.Item>

              <Form.Item>
                <Switch
                  checked={credentials}
                  onChange={setCredentials}
                  checkedChildren={t.credentialsLabel}
                  unCheckedChildren={t.credentialsLabel}
                />
              </Form.Item>

              <Form.Item label={t.maxAgeLabel}>
                <InputNumber
                  min={0}
                  step={60}
                  value={maxAge}
                  onChange={(v) => setMaxAge(v ?? 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label={t.presets}>
                <Space wrap>
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <Button
                      key={key}
                      size="small"
                      icon={<ThunderboltOutlined />}
                      onClick={() => applyPreset(key)}
                    >
                      {p.label[lang]}
                    </Button>
                  ))}
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={t.outputTitle}
            extra={
              <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(allOutputsText)}>
                {t.copyAll}
              </Button>
            }
          >
            {normalized.warnings.length > 0 && (
              <Alert
                type="warning"
                showIcon
                icon={<InfoCircleOutlined />}
                message={t.warningsTitle}
                description={(
                  <ul style={{ marginBottom: 0, paddingLeft: 16 }}>
                    {normalized.warnings.map((w, i) => (
                      <li key={i}>{w[lang]}</li>
                    ))}
                  </ul>
                )}
                style={{ marginBottom: 16 }}
              />
            )}

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={FORMATS.map((f) => ({
                key: f.key,
                label: f.label[lang],
                children: (
                  <div>
                    <pre
                      style={{
                        background: '#f6ffed',
                        padding: 16,
                        borderRadius: 8,
                        overflow: 'auto',
                        minHeight: 120,
                      }}
                    >
                      <code>{outputs[f.key]}</code>
                    </pre>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(outputs[f.key])}
                    >
                      {t.copy}
                    </Button>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.note} style={{ marginTop: 16 }} />

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
