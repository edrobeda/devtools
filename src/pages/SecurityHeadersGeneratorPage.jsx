import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Checkbox,
  Input,
  Select,
  Segmented,
  Row,
  Col,
  Alert,
  Collapse,
  message,
} from 'antd'
import { SafetyCertificateOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildSecurityHeaders,
  PRESETS,
  PERMISSIONS_FEATURES,
} from '../utils/securityHeadersGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const FRAME_OPTIONS = ['DENY', 'SAMEORIGIN', 'ALLOW-FROM']
const REFERRER_OPTIONS = [
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
]
const COOP_OPTIONS = ['same-origin', 'same-origin-allow-popups', 'unsafe-none']
const COEP_OPTIONS = ['require-corp', 'credentialless', 'unsafe-none']
const CORP_OPTIONS = ['same-origin', 'same-site', 'cross-origin']
const XSS_OPTIONS = ['0', '1', '1; mode=block']
const PERMISSIONS_OPTIONS = [
  { value: '()', label: { pt: 'negado', en: 'denied' } },
  { value: '(self)', label: { pt: 'mesma origem', en: 'same-origin' } },
  { value: '*', label: { pt: 'permitido', en: 'allowed' } },
]

const FORMATS = [
  { value: 'nginx', label: { pt: 'Nginx', en: 'Nginx' } },
  { value: 'apache', label: { pt: 'Apache (.htaccess)', en: 'Apache (.htaccess)' } },
  { value: 'express', label: { pt: 'Express (res.set)', en: 'Express (res.set)' } },
  { value: 'netlify', label: { pt: 'Netlify _headers', en: 'Netlify _headers' } },
  { value: 'vercel', label: { pt: 'Vercel headers', en: 'Vercel headers' } },
  { value: 'html', label: { pt: 'HTML <meta>', en: 'HTML <meta>' } },
]

const FILENAMES = {
  nginx: 'security-headers.conf',
  apache: '.htaccess',
  express: 'security-headers.js',
  netlify: '_headers',
  vercel: 'vercel.json',
  html: 'security-headers.html',
}

const SOURCE = `
function buildHeaderList(options) {
  const headers = []

  if (options.hstsEnabled) {
    const parts = [\`max-age=\${options.hstsMaxAge || '31536000'}\`]
    if (options.hstsSubDomains) parts.push('includeSubDomains')
    if (options.hstsPreload) parts.push('preload')
    headers.push({ name: 'Strict-Transport-Security', value: parts.join('; ') })
  }

  if (options.contentTypeEnabled) {
    headers.push({ name: 'X-Content-Type-Options', value: 'nosniff' })
  }

  if (options.frameEnabled) {
    const frame = options.frameValue === 'ALLOW-FROM' && options.frameAllowFrom
      ? \`ALLOW-FROM \${options.frameAllowFrom}\`
      : (options.frameValue || 'DENY')
    headers.push({ name: 'X-Frame-Options', value: frame })
  }

  if (options.referrerEnabled && options.referrerValue) {
    headers.push({ name: 'Referrer-Policy', value: options.referrerValue })
  }

  if (options.permissionsEnabled && options.permissionsDirectives) {
    const pp = Object.entries(options.permissionsDirectives)
      .filter(([, v]) => v && String(v).trim() !== '')
      .map(([k, v]) => \`\${k}=\${v}\`)
      .join(', ')
    if (pp) headers.push({ name: 'Permissions-Policy', value: pp })
  }

  if (options.xssEnabled && options.xssValue) {
    headers.push({ name: 'X-XSS-Protection', value: options.xssValue })
  }

  if (options.cspEnabled && options.cspValue) {
    headers.push({ name: 'Content-Security-Policy', value: options.cspValue.trim() })
  }

  if (options.coepEnabled && options.coepValue) {
    headers.push({ name: 'Cross-Origin-Embedder-Policy', value: options.coepValue })
  }

  if (options.coopEnabled && options.coopValue) {
    headers.push({ name: 'Cross-Origin-Opener-Policy', value: options.coopValue })
  }

  if (options.corpEnabled && options.corpValue) {
    headers.push({ name: 'Cross-Origin-Resource-Policy', value: options.corpValue })
  }

  return headers
}

export function buildSecurityHeaders(options, format = 'nginx') {
  const headers = buildHeaderList(options)
  switch (format) {
    case 'apache':
      return headers.map((h) => \`Header always set \${h.name} "\${h.value.replace(/"/g, '\\\\"')}"\`).join('\\n')
    case 'express':
      return \`app.use((req, res, next) => {\\n\${headers.map((h) => \`  res.set('\${h.name}', '\${h.value.replace(/'/g, "\\\\'")}')\`).join('\\n')}\\n  next()\\n})\`
    case 'netlify':
      return ['/*', ...headers.map((h) => \`  \${h.name}: \${h.value}\`)].join('\\n')
    case 'vercel':
      return JSON.stringify({ headers: [{ source: '/(.*)', headers: headers.map((h) => ({ key: h.name, value: h.value })) }] }, null, 2)
    case 'html':
      return headers
        .filter((h) => ['Content-Security-Policy', 'Referrer-Policy'].includes(h.name))
        .map((h) => h.name === 'Referrer-Policy'
          ? \`<meta name="referrer" content="\${h.value.replace(/"/g, '\\\\"')}">\`
          : \`<meta http-equiv="\${h.name}" content="\${h.value.replace(/"/g, '\\\\"')}">\`)
        .join('\\n')
    case 'nginx':
    default:
      return headers.map((h) => \`add_header \${h.name} "\${h.value.replace(/"/g, '\\\\"')}" always;\`).join('\\n')
  }
}
`

const translations = {
  pt: {
    title: 'Gerador de Cabeçalhos de Segurança HTTP',
    intro: (
      <>
        Monta um conjunto de cabeçalhos de segurança HTTP prontos para colar no
        Nginx, Apache, Express, Netlify, Vercel ou como tags{' '}
        <Text code>{'<meta>'}</Text> equivalentes. Tudo é feito no navegador —
        nenhuma requisição sai daqui.
      </>
    ),
    presets: 'Modelos de um clique',
    presetStrict: 'Stricto',
    presetApi: 'API',
    presetStatic: 'Site estático',
    presetMinimal: 'Mínimo',
    headers: 'Cabeçalhos',
    hsts: 'Strict-Transport-Security (HSTS)',
    hstsMaxAge: 'max-age (segundos)',
    hstsSubDomains: 'includeSubDomains',
    hstsPreload: 'preload',
    contentType: 'X-Content-Type-Options',
    frame: 'X-Frame-Options',
    frameAllowFrom: 'ALLOW-FROM URL',
    referrer: 'Referrer-Policy',
    permissions: 'Permissions-Policy',
    permissionsHint: 'Escolha o comportamento de cada recurso do navegador.',
    xss: 'X-XSS-Protection (legado)',
    csp: 'Content-Security-Policy',
    cspHint: 'Para regras complexas, use o Gerador de CSP dedicado.',
    coep: 'Cross-Origin-Embedder-Policy',
    coop: 'Cross-Origin-Opener-Policy',
    corp: 'Cross-Origin-Resource-Policy',
    outputFormat: 'Formato de saída',
    output: 'Configuração gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildHeaderList monta a lista de cabeçalhos a partir das opções ativas e buildSecurityHeaders formata essa lista para Nginx, Apache, Express, Netlify, Vercel ou HTML meta tags.',
    tipsTitle: 'Antes de usar',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>HSTS</Text> só faz sentido em sites com HTTPS válido. Use{' '}
          <Text code>preload</Text> apenas se entender as implicações de inclusão em listas de preload.
        </li>
        <li>
          <Text strong>Permissions-Policy</Text> desativa recursos do navegador que você não usa (câmera, microfone etc.) — ótimo para reduzir a superfície de ataque.
        </li>
        <li>
          <Text strong>X-Frame-Options</Text> e <Text strong>COOP</Text> ajudam a evitar clickjacking e ataques de janela.
        </li>
        <li>
          Valide o resultado em sites como{' '}
          <Text code>securityheaders.com</Text> após implantar suas regras.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'HTTP Security Headers Generator',
    intro: (
      <>
        Builds a set of HTTP security headers ready to paste into Nginx, Apache,
        Express, Netlify, Vercel or as equivalent <Text code>{'<meta>'}</Text>{' '}
        tags. Everything happens in the browser — no request leaves this page.
      </>
    ),
    presets: 'One-click templates',
    presetStrict: 'Strict',
    presetApi: 'API',
    presetStatic: 'Static site',
    presetMinimal: 'Minimal',
    headers: 'Headers',
    hsts: 'Strict-Transport-Security (HSTS)',
    hstsMaxAge: 'max-age (seconds)',
    hstsSubDomains: 'includeSubDomains',
    hstsPreload: 'preload',
    contentType: 'X-Content-Type-Options',
    frame: 'X-Frame-Options',
    frameAllowFrom: 'ALLOW-FROM URL',
    referrer: 'Referrer-Policy',
    permissions: 'Permissions-Policy',
    permissionsHint: 'Choose the behavior of each browser feature.',
    xss: 'X-XSS-Protection (legacy)',
    csp: 'Content-Security-Policy',
    cspHint: 'For complex rules, use the dedicated CSP generator.',
    coep: 'Cross-Origin-Embedder-Policy',
    coop: 'Cross-Origin-Opener-Policy',
    corp: 'Cross-Origin-Resource-Policy',
    outputFormat: 'Output format',
    output: 'Generated configuration',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildHeaderList builds the list of headers from active options and buildSecurityHeaders formats that list for Nginx, Apache, Express, Netlify, Vercel or HTML meta tags.',
    tipsTitle: 'Before you use it',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>HSTS</Text> only makes sense on sites with valid HTTPS. Only use{' '}
          <Text code>preload</Text> if you understand the implications of preload lists.
        </li>
        <li>
          <Text strong>Permissions-Policy</Text> disables browser features you do not use (camera, microphone, etc.) — great for shrinking the attack surface.
        </li>
        <li>
          <Text strong>X-Frame-Options</Text> and <Text strong>COOP</Text> help prevent clickjacking and window-based attacks.
        </li>
        <li>
          Validate the result on sites like <Text code>securityheaders.com</Text> after deploying your rules.
        </li>
      </ul>
    ),
  },
}

export default function SecurityHeadersGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState(() => JSON.parse(JSON.stringify(PRESETS.strict)))
  const [format, setFormat] = useState('nginx')

  function applyPreset(key) {
    setOptions(JSON.parse(JSON.stringify(PRESETS[key])))
  }

  function setOpt(key, value) {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  function setPermission(feature, value) {
    setOptions((prev) => ({
      ...prev,
      permissionsDirectives: { ...prev.permissionsDirectives, [feature]: value },
    }))
  }

  const output = useMemo(() => buildSecurityHeaders(options, format), [options, format])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  function handleDownload() {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = FILENAMES[format]
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatOptions = useMemo(
    () => FORMATS.map((f) => ({ value: f.value, label: f.label[lang] })),
    [lang]
  )

  const permissionOptions = useMemo(
    () => PERMISSIONS_OPTIONS.map((o) => ({ value: o.value, label: o.label[lang] })),
    [lang]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      <Card title={t.presets}>
        <Space wrap>
          <Button onClick={() => applyPreset('strict')}>{t.presetStrict}</Button>
          <Button onClick={() => applyPreset('api')}>{t.presetApi}</Button>
          <Button onClick={() => applyPreset('static')}>{t.presetStatic}</Button>
          <Button onClick={() => applyPreset('minimal')}>{t.presetMinimal}</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={t.headers}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Checkbox checked={options.hstsEnabled} onChange={(e) => setOpt('hstsEnabled', e.target.checked)}>
                  <Text strong>{t.hsts}</Text>
                </Checkbox>
                {options.hstsEnabled && (
                  <Space wrap size="middle" style={{ marginTop: 8, marginLeft: 24 }}>
                    <Input
                      value={options.hstsMaxAge}
                      onChange={(e) => setOpt('hstsMaxAge', e.target.value)}
                      style={{ width: 140 }}
                      addonBefore="max-age"
                    />
                    <Checkbox checked={options.hstsSubDomains} onChange={(e) => setOpt('hstsSubDomains', e.target.checked)}>
                      {t.hstsSubDomains}
                    </Checkbox>
                    <Checkbox checked={options.hstsPreload} onChange={(e) => setOpt('hstsPreload', e.target.checked)}>
                      {t.hstsPreload}
                    </Checkbox>
                  </Space>
                )}
              </div>

              <Checkbox checked={options.contentTypeEnabled} onChange={(e) => setOpt('contentTypeEnabled', e.target.checked)}>
                <Text strong>{t.contentType}</Text> — nosniff
              </Checkbox>

              <div>
                <Checkbox checked={options.frameEnabled} onChange={(e) => setOpt('frameEnabled', e.target.checked)}>
                  <Text strong>{t.frame}</Text>
                </Checkbox>
                {options.frameEnabled && (
                  <Space wrap size="middle" style={{ marginTop: 8, marginLeft: 24 }}>
                    <Select
                      value={options.frameValue}
                      onChange={(v) => setOpt('frameValue', v)}
                      options={FRAME_OPTIONS.map((v) => ({ value: v, label: v }))}
                      style={{ width: 160 }}
                    />
                    {options.frameValue === 'ALLOW-FROM' && (
                      <Input
                        value={options.frameAllowFrom}
                        onChange={(e) => setOpt('frameAllowFrom', e.target.value)}
                        placeholder="https://example.com"
                        style={{ width: 220 }}
                      />
                    )}
                  </Space>
                )}
              </div>

              <div>
                <Checkbox checked={options.referrerEnabled} onChange={(e) => setOpt('referrerEnabled', e.target.checked)}>
                  <Text strong>{t.referrer}</Text>
                </Checkbox>
                {options.referrerEnabled && (
                  <Select
                    value={options.referrerValue}
                    onChange={(v) => setOpt('referrerValue', v)}
                    options={REFERRER_OPTIONS.map((v) => ({ value: v, label: v }))}
                    style={{ width: 280, marginLeft: 24, marginTop: 8, display: 'block' }}
                  />
                )}
              </div>

              <div>
                <Checkbox checked={options.permissionsEnabled} onChange={(e) => setOpt('permissionsEnabled', e.target.checked)}>
                  <Text strong>{t.permissions}</Text>
                </Checkbox>
                {options.permissionsEnabled && (
                  <>
                    <Paragraph type="secondary" style={{ marginLeft: 24, marginBottom: 8, fontSize: 12 }}>
                      {t.permissionsHint}
                    </Paragraph>
                    <Space direction="vertical" size="small" style={{ marginLeft: 24, width: '100%' }}>
                      {PERMISSIONS_FEATURES.map((feature) => (
                        <Space key={feature} wrap size="middle" style={{ width: '100%' }}>
                          <Text code style={{ width: 140, display: 'inline-block' }}>{feature}</Text>
                          <Select
                            value={options.permissionsDirectives[feature]}
                            onChange={(v) => setPermission(feature, v)}
                            options={permissionOptions}
                            style={{ width: 160 }}
                          />
                        </Space>
                      ))}
                    </Space>
                  </>
                )}
              </div>

              <Checkbox checked={options.xssEnabled} onChange={(e) => setOpt('xssEnabled', e.target.checked)}>
                <Text strong>{t.xss}</Text>
              </Checkbox>
              {options.xssEnabled && (
                <Select
                  value={options.xssValue}
                  onChange={(v) => setOpt('xssValue', v)}
                  options={XSS_OPTIONS.map((v) => ({ value: v, label: v }))}
                  style={{ width: 200, marginLeft: 24, display: 'block' }}
                />
              )}

              <div>
                <Checkbox checked={options.cspEnabled} onChange={(e) => setOpt('cspEnabled', e.target.checked)}>
                  <Text strong>{t.csp}</Text>
                </Checkbox>
                {options.cspEnabled && (
                  <>
                    <Paragraph type="secondary" style={{ marginLeft: 24, marginBottom: 8, fontSize: 12 }}>
                      {t.cspHint}
                    </Paragraph>
                    <TextArea
                      value={options.cspValue}
                      onChange={(e) => setOpt('cspValue', e.target.value)}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      style={{ marginLeft: 24, fontFamily: 'monospace' }}
                    />
                  </>
                )}
              </div>

              <div>
                <Checkbox checked={options.coepEnabled} onChange={(e) => setOpt('coepEnabled', e.target.checked)}>
                  <Text strong>{t.coep}</Text>
                </Checkbox>
                {options.coepEnabled && (
                  <Select
                    value={options.coepValue}
                    onChange={(v) => setOpt('coepValue', v)}
                    options={COEP_OPTIONS.map((v) => ({ value: v, label: v }))}
                    style={{ width: 200, marginLeft: 24, marginTop: 8, display: 'block' }}
                  />
                )}
              </div>

              <div>
                <Checkbox checked={options.coopEnabled} onChange={(e) => setOpt('coopEnabled', e.target.checked)}>
                  <Text strong>{t.coop}</Text>
                </Checkbox>
                {options.coopEnabled && (
                  <Select
                    value={options.coopValue}
                    onChange={(v) => setOpt('coopValue', v)}
                    options={COOP_OPTIONS.map((v) => ({ value: v, label: v }))}
                    style={{ width: 260, marginLeft: 24, marginTop: 8, display: 'block' }}
                  />
                )}
              </div>

              <div>
                <Checkbox checked={options.corpEnabled} onChange={(e) => setOpt('corpEnabled', e.target.checked)}>
                  <Text strong>{t.corp}</Text>
                </Checkbox>
                {options.corpEnabled && (
                  <Select
                    value={options.corpValue}
                    onChange={(v) => setOpt('corpValue', v)}
                    options={CORP_OPTIONS.map((v) => ({ value: v, label: v }))}
                    style={{ width: 200, marginLeft: 24, marginTop: 8, display: 'block' }}
                  />
                )}
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={t.output}
            extra={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
                </Text>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload} disabled={!output}>{t.download}</Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Segmented
                value={format}
                onChange={(v) => setFormat(v)}
                options={formatOptions}
                block
              />
              <pre
                style={{
                  margin: 0,
                  overflowX: 'auto',
                  background: '#0d1117',
                  color: '#e6edf3',
                  padding: 12,
                  borderRadius: 8,
                  maxHeight: 520,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
              >
                <code>{output || ' '}</code>
              </pre>
            </Space>
          </Card>
        </Col>
      </Row>

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
