import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Segmented,
  Switch,
  Button,
  Alert,
  Collapse,
  message,
  List,
  Row,
  Col,
} from 'antd'
import {
  CopyOutlined,
  CheckOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildHtaccess, PRESETS } from '../utils/htaccessGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE = `
function section(title) {
  return ['', '# --- ' + title + ' ---']
}

function buildHtaccess(o) {
  const lines = []
  const warnings = []
  const add = (s) => lines.push(s)

  const basePath = String(o.basePath || '').trim() || '/'

  if (o.rewriteEngine) {
    add(...section('RewriteEngine'))
    add('RewriteEngine On')
    if (basePath !== '/') add('RewriteBase ' + basePath)
  }

  if (o.httpsRedirect && o.rewriteEngine) {
    add(...section('HTTPS redirect'))
    add('RewriteCond %{HTTPS} off')
    add('RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]')
  }

  if (o.wwwRedirect && o.wwwRedirect !== 'none' && o.rewriteEngine) {
    add(...section('www redirect'))
    if (o.wwwRedirect === 'to-www') {
      add('RewriteCond %{HTTP_HOST} !^www\\\\. [NC]')
      add('RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]')
    } else if (o.wwwRedirect === 'to-non-www') {
      add('RewriteCond %{HTTP_HOST} ^www\\\\.(.*)$ [NC]')
      add('RewriteRule ^(.*)$ https://%1%{REQUEST_URI} [L,R=301]')
    }
  }

  if (o.spaFallback && o.rewriteEngine) {
    add(...section('SPA fallback'))
    add('RewriteCond %{REQUEST_FILENAME} !-f')
    add('RewriteCond %{REQUEST_FILENAME} !-d')
    add('RewriteRule . /index.html [L]')
  }

  if (o.compression) {
    add(...section('Compression'))
    add('<IfModule mod_deflate.c>')
    add('  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css')
    add('  AddOutputFilterByType DEFLATE application/javascript application/json application/xml')
    add('  AddOutputFilterByType DEFLATE font/woff font/woff2')
    add('</IfModule>')
  }

  if (o.cacheAssets) {
    add(...section('Cache control'))
    const days = Number(o.cacheDays) || 30
    add('<IfModule mod_expires.c>')
    add('  ExpiresActive On')
    add('  ExpiresDefault "access plus ' + days + ' days"')
    add('</IfModule>')
    add('<IfModule mod_headers.c>')
    add('  <FilesMatch "\\\\.(ico|pdf|flv|jpg|jpeg|png|gif|js|css|swf|woff|woff2)$">')
    add('    Header set Cache-Control "public, max-age=' + (days * 86400) + '"')
    add('  </FilesMatch>')
    add('</IfModule>')
  }

  if (o.securityHeaders) {
    add(...section('Security headers'))
    add('<IfModule mod_headers.c>')
    add('  Header always set X-Content-Type-Options "nosniff"')
    add('  Header always set X-Frame-Options "SAMEORIGIN"')
    add('  Header always set X-XSS-Protection "1; mode=block"')
    add('  Header always set Referrer-Policy "strict-origin-when-cross-origin"')
    add('  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"')
    add('</IfModule>')
  }

  if (o.hideServerInfo) {
    add(...section('Server info'))
    add('ServerSignature Off')
    add('ServerTokens Prod')
  }

  if (o.disableDirectoryListing) add('Options -Indexes')

  if (o.passwordProtect) {
    add(...section('Basic authentication'))
    const authName = String(o.authName || 'Restricted Area').trim()
    const authUserFile = String(o.authUserFile || '/var/www/.htpasswd').trim()
    add('AuthType Basic')
    add('AuthName "' + authName + '"')
    add('AuthUserFile ' + authUserFile)
    add('Require valid-user')
  }

  const errors = Array.isArray(o.customErrors) ? o.customErrors : []
  const validErrors = errors.filter((e) => e && String(e.code || '').trim() && String(e.url || '').trim())
  if (validErrors.length) {
    add(...section('Custom error pages'))
    for (const e of validErrors) {
      add('ErrorDocument ' + String(e.code).trim() + ' ' + String(e.url).trim())
    }
  }

  const ips = String(o.denyIps || '').split('\\n').map((s) => s.trim()).filter(Boolean)
  if (ips.length) {
    add(...section('IP deny'))
    add('<RequireAll>')
    add('  Require all granted')
    for (const ip of ips) add('  Require not ip ' + ip)
    add('</RequireAll>')
  }

  const extra = String(o.extra || '').split('\\n').map((s) => s.trim()).filter(Boolean)
  if (extra.length) {
    add(...section('Custom rules'))
    for (const line of extra) add(line)
  }

  if (!lines.length) warnings.push('empty')
  return { text: lines.join('\\n'), warnings }
}
`.trim()

const translations = {
  pt: {
    title: 'Gerador de .htaccess',
    intro: (
      <>
        Monta arquivos <Text code>.htaccess</Text> para o Apache a partir de
        opções: rewrites, redirect para HTTPS, compressão, cache, headers de
        segurança, autenticação básica, bloqueio de IPs e páginas de erro
        customizadas. Escolha um preset e ajuste — o arquivo sai pronto para
        copiar ou baixar. 100% client-side, nada sai do navegador.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Um clique aplica uma configuração de exemplo.',
    rewriteTitle: 'RewriteEngine',
    optRewriteEngine: 'Ligar RewriteEngine',
    basePathLabel: 'Caminho base (RewriteBase)',
    basePathPlaceholder: '/',
    optSpaFallback: 'SPA fallback (tudo para /index.html)',
    optHttpsRedirect: 'Redirecionar HTTP → HTTPS',
    wwwRedirectLabel: 'Redirecionar www',
    wwwOptions: {
      none: 'nenhum',
      'to-www': 'sem-www → www',
      'to-non-www': 'www → sem-www',
    },
    perfTitle: 'Performance',
    optCompression: 'Compressão gzip/deflate (mod_deflate)',
    optCacheAssets: 'Cache de assets estáticos (mod_expires/mod_headers)',
    cacheDaysLabel: 'Dias de cache',
    securityTitle: 'Segurança',
    optSecurityHeaders: 'Headers de segurança (X-Frame-Options, HSTS, etc.)',
    optHideServerInfo: 'Esconder versão do Apache (ServerTokens/ServerSignature)',
    optDisableDirectoryListing: 'Desabilitar listagem de diretórios',
    optPasswordProtect: 'Proteger diretório com senha (basic auth)',
    authNameLabel: 'Nome da área protegida',
    authNamePlaceholder: 'Área Restrita',
    authUserFileLabel: 'Caminho do .htpasswd',
    authUserFilePlaceholder: '/var/www/.htpasswd',
    errorsTitle: 'Páginas de erro customizadas',
    errorsEmpty: 'Nenhuma página de erro customizada.',
    errorCodeLabel: 'Código HTTP',
    errorUrlLabel: 'URL/Arquivo',
    addError: 'Adicionar erro',
    denyTitle: 'Bloqueio de IPs',
    denyHint: 'Um IP por linha. Exemplo: 192.168.1.100',
    denyPlaceholder: '192.168.1.100\n10.0.0.0/8',
    extraTitle: 'Regras adicionais (verbatim)',
    extraPlaceholder: 'RewriteRule ^old$ /new [L,R=301]',
    outTitle: '.htaccess gerado',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar .htaccess',
    copyErr: 'Não foi possível copiar',
    warningsTitle: 'Avisos — o arquivo ainda sai, mas confira:',
    warningsNone: 'Tudo certo — revise o arquivo antes de colocar no servidor.',
    wAuthName: 'Nome da área protegida vazio.',
    wAuthUserFile: 'Caminho do .htpasswd vazio.',
    wEmpty: 'O .htaccess está vazio — ligue pelo menos uma opção.',
    tipTitle: 'Usando no Apache',
    tipBody: (
      <>
        O <Text code>.htaccess</Text> só funciona quando o módulo{' '}
        <Text code>AllowOverride</Text> da configuração principal do Apache
        permite as diretivas usadas. Em produção, muitos administradores preferem
        mover regras para o virtual host principal por performance. Sempre
        teste com <Text code>apachectl configtest</Text> (ou{' '}
        <Text code>httpd -t</Text>) antes de recarregar o Apache.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'O builder adiciona seções na ordem semântica (rewrite → redirects → SPA fallback → compressão → cache → segurança → autenticação → erros → IP deny → extras), agrupa diretivas em blocos <IfModule> quando necessário e monta o texto final linha a linha.',
  },
  en: {
    title: '.htaccess Generator',
    intro: (
      <>
        Builds Apache <Text code>.htaccess</Text> files from options: rewrites,
        HTTPS redirect, compression, caching, security headers, basic auth,
        IP deny and custom error pages. Pick a preset and tweak it — the file
        is ready to copy or download. 100% client-side, nothing leaves the
        browser.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'One click applies a sample configuration.',
    rewriteTitle: 'RewriteEngine',
    optRewriteEngine: 'Enable RewriteEngine',
    basePathLabel: 'Base path (RewriteBase)',
    basePathPlaceholder: '/',
    optSpaFallback: 'SPA fallback (everything to /index.html)',
    optHttpsRedirect: 'Redirect HTTP → HTTPS',
    wwwRedirectLabel: 'Redirect www',
    wwwOptions: {
      none: 'none',
      'to-www': 'non-www → www',
      'to-non-www': 'www → non-www',
    },
    perfTitle: 'Performance',
    optCompression: 'gzip/deflate compression (mod_deflate)',
    optCacheAssets: 'Static asset caching (mod_expires/mod_headers)',
    cacheDaysLabel: 'Cache days',
    securityTitle: 'Security',
    optSecurityHeaders: 'Security headers (X-Frame-Options, HSTS, etc.)',
    optHideServerInfo: 'Hide Apache version (ServerTokens/ServerSignature)',
    optDisableDirectoryListing: 'Disable directory listing',
    optPasswordProtect: 'Password protect directory (basic auth)',
    authNameLabel: 'Auth realm name',
    authNamePlaceholder: 'Restricted Area',
    authUserFileLabel: '.htpasswd path',
    authUserFilePlaceholder: '/var/www/.htpasswd',
    errorsTitle: 'Custom error pages',
    errorsEmpty: 'No custom error pages.',
    errorCodeLabel: 'HTTP code',
    errorUrlLabel: 'URL/File',
    addError: 'Add error',
    denyTitle: 'IP deny',
    denyHint: 'One IP per line. Example: 192.168.1.100',
    denyPlaceholder: '192.168.1.100\n10.0.0.0/8',
    extraTitle: 'Extra rules (verbatim)',
    extraPlaceholder: 'RewriteRule ^old$ /new [L,R=301]',
    outTitle: 'Generated .htaccess',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download .htaccess',
    copyErr: 'Could not copy',
    warningsTitle: 'Warnings — the file still generates, but check:',
    warningsNone: 'All good — review the file before deploying it.',
    wAuthName: 'Auth realm name is empty.',
    wAuthUserFile: '.htpasswd path is empty.',
    wEmpty: 'The .htaccess is empty — enable at least one option.',
    tipTitle: 'Using with Apache',
    tipBody: (
      <>
        A <Text code>.htaccess</Text> only works when the main Apache config's{' '}
        <Text code>AllowOverride</Text> allows the directives used. In
        production many admins prefer moving rules to the main virtual host for
        performance. Always test with <Text code>apachectl configtest</Text>{' '}
        (or <Text code>httpd -t</Text>) before reloading Apache.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'The builder appends sections in semantic order (rewrite → redirects → SPA fallback → compression → cache → security → auth → errors → IP deny → extras), groups directives inside <IfModule> blocks when needed, and builds the final text line by line.',
  },
}

export default function HtaccessGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('spa')
  const [fields, setFields] = useState(() => ({ ...PRESETS.spa }))
  const [copied, setCopied] = useState(false)

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const applyPreset = (key) => {
    setPreset(key)
    setFields({ ...PRESETS[key] })
  }

  const addError = () => {
    setFields((f) => ({
      ...f,
      customErrors: [...(f.customErrors || []), { code: '', url: '' }],
    }))
  }

  const removeError = (idx) => {
    setFields((f) => ({
      ...f,
      customErrors: f.customErrors.filter((_, i) => i !== idx),
    }))
  }

  const updateError = (idx, key, value) => {
    setFields((f) => {
      const next = [...(f.customErrors || [])]
      next[idx] = { ...next[idx], [key]: value }
      return { ...f, customErrors: next }
    })
  }

  const result = useMemo(() => buildHtaccess(fields), [fields])
  const { text, warnings } = result
  const uniqueWarnings = Array.from(new Set(warnings))
  const lineCount = text.split('\n').length
  const byteCount = new TextEncoder().encode(text).length

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  function download() {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.htaccess'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const warningText = (w) => {
    if (w === 'authName') return t.wAuthName
    if (w === 'authUserFile') return t.wAuthUserFile
    if (w === 'empty') return t.wEmpty
    return w
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={preset}
          onChange={applyPreset}
          options={Object.keys(PRESETS).map((k) => ({ label: PRESETS[k].label[lang], value: k }))}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.rewriteTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap align="center">
                <Text type="secondary">{t.optRewriteEngine}</Text>
                <Switch checked={fields.rewriteEngine} onChange={(v) => setField('rewriteEngine', v)} />
              </Space>
              {fields.rewriteEngine && (
                <Space wrap align="center">
                  <Text type="secondary">{t.basePathLabel}</Text>
                  <Input
                    value={fields.basePath}
                    onChange={(e) => setField('basePath', e.target.value)}
                    placeholder={t.basePathPlaceholder}
                    style={{ width: 160, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
              )}
              {fields.rewriteEngine && (
                <>
                  <Space wrap align="center">
                    <Text type="secondary">{t.optSpaFallback}</Text>
                    <Switch checked={fields.spaFallback} onChange={(v) => setField('spaFallback', v)} />
                  </Space>
                  <Space wrap align="center">
                    <Text type="secondary">{t.optHttpsRedirect}</Text>
                    <Switch checked={fields.httpsRedirect} onChange={(v) => setField('httpsRedirect', v)} />
                  </Space>
                  <Space wrap align="center">
                    <Text type="secondary">{t.wwwRedirectLabel}</Text>
                    <Segmented
                      value={fields.wwwRedirect}
                      onChange={(v) => setField('wwwRedirect', v)}
                      options={[
                        { label: t.wwwOptions.none, value: 'none' },
                        { label: t.wwwOptions['to-www'], value: 'to-www' },
                        { label: t.wwwOptions['to-non-www'], value: 'to-non-www' },
                      ]}
                    />
                  </Space>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.perfTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap align="center">
                <Text type="secondary">{t.optCompression}</Text>
                <Switch checked={fields.compression} onChange={(v) => setField('compression', v)} />
              </Space>
              <Space wrap align="center">
                <Text type="secondary">{t.optCacheAssets}</Text>
                <Switch checked={fields.cacheAssets} onChange={(v) => setField('cacheAssets', v)} />
              </Space>
              {fields.cacheAssets && (
                <Space wrap align="center">
                  <Text type="secondary">{t.cacheDaysLabel}</Text>
                  <Input
                    type="number"
                    min={1}
                    value={fields.cacheDays}
                    onChange={(e) => setField('cacheDays', Number(e.target.value))}
                    style={{ width: 100 }}
                  />
                </Space>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.securityTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap align="center">
                <Text type="secondary">{t.optSecurityHeaders}</Text>
                <Switch checked={fields.securityHeaders} onChange={(v) => setField('securityHeaders', v)} />
              </Space>
              <Space wrap align="center">
                <Text type="secondary">{t.optHideServerInfo}</Text>
                <Switch checked={fields.hideServerInfo} onChange={(v) => setField('hideServerInfo', v)} />
              </Space>
              <Space wrap align="center">
                <Text type="secondary">{t.optDisableDirectoryListing}</Text>
                <Switch checked={fields.disableDirectoryListing} onChange={(v) => setField('disableDirectoryListing', v)} />
              </Space>
              <Space wrap align="center">
                <Text type="secondary">{t.optPasswordProtect}</Text>
                <Switch checked={fields.passwordProtect} onChange={(v) => setField('passwordProtect', v)} />
              </Space>
              {fields.passwordProtect && (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space wrap>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.authNameLabel}</Text>
                    <Input
                      value={fields.authName}
                      onChange={(e) => setField('authName', e.target.value)}
                      placeholder={t.authNamePlaceholder}
                      style={{ width: 200, fontSize: 12 }}
                    />
                  </Space>
                  <Space wrap>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.authUserFileLabel}</Text>
                    <Input
                      value={fields.authUserFile}
                      onChange={(e) => setField('authUserFile', e.target.value)}
                      placeholder={t.authUserFilePlaceholder}
                      style={{ width: 260, fontFamily: 'monospace', fontSize: 12 }}
                    />
                  </Space>
                </Space>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.errorsTitle}>
            {(fields.customErrors || []).length === 0 ? (
              <Text type="secondary">{t.errorsEmpty}</Text>
            ) : (
              <List
                dataSource={fields.customErrors}
                renderItem={(item, idx) => (
                  <List.Item key={idx}>
                    <Space wrap align="center">
                      <Input
                        value={item.code}
                        onChange={(e) => updateError(idx, 'code', e.target.value)}
                        placeholder={t.errorCodeLabel}
                        style={{ width: 120, fontFamily: 'monospace', fontSize: 12 }}
                      />
                      <Input
                        value={item.url}
                        onChange={(e) => updateError(idx, 'url', e.target.value)}
                        placeholder={t.errorUrlLabel}
                        style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
                      />
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeError(idx)} />
                    </Space>
                  </List.Item>
                )}
              />
            )}
            <Button size="small" icon={<PlusOutlined />} onClick={addError} style={{ marginTop: 8 }}>
              {t.addError}
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.denyTitle}>
            <Paragraph type="secondary" style={{ fontSize: 12 }}>{t.denyHint}</Paragraph>
            <TextArea
              value={fields.denyIps}
              onChange={(e) => setField('denyIps', e.target.value)}
              placeholder={t.denyPlaceholder}
              rows={3}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.extraTitle}>
            <TextArea
              value={fields.extra}
              onChange={(e) => setField('extra', e.target.value)}
              placeholder={t.extraPlaceholder}
              rows={3}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t.outTitle}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.stats(lineCount, byteCount)}</Text>}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.6,
              background: '#fafafa',
              padding: 12,
              borderRadius: 6,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <code>{text}</code>
          </pre>
          <Space wrap>
            <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
              {copied ? t.copied : t.copy}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={download}>
              {t.download}
            </Button>
          </Space>
          <Alert
            type={uniqueWarnings.length ? 'warning' : 'success'}
            showIcon
            message={uniqueWarnings.length ? t.warningsTitle : t.warningsNone}
            description={
              uniqueWarnings.length ? (
                <Space direction="vertical" size={0}>
                  {uniqueWarnings.map((w) => (
                    <Text key={w} style={{ fontSize: 12 }}>· {warningText(w)}</Text>
                  ))}
                </Space>
              ) : null
            }
          />
        </Space>
      </Card>

      <Card title={t.tipTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipBody}</Paragraph>
      </Card>

      <Card title={t.howItWorks}>
        <Paragraph type="secondary">{t.howItWorksDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>htaccessGenerator.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
