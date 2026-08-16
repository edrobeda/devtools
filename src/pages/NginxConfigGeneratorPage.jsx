import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Segmented, Switch, Button, Alert, Collapse, message,
} from 'antd'
import { GlobalOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { PRESETS, DEFAULTS, buildNginxConfig, MODES } from '../utils/nginxConfigGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE = `
function buildNginxConfig(o) {
  const lines = []
  const warnings = []
  const add = (s) => lines.push(s)
  const ind = '    '

  const domains = String(o.domains || '')
    .split(/[,\\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const primary = domains[0] || 'example.com'
  if (!domains.length) warnings.push('domains')
  if (needsBackend(o.mode) && !o.backend.trim()) warnings.push('backend')
  if (needsRoot(o.mode) && !o.root.trim()) warnings.push('root')

  const upstream = primary.replace(/[^a-zA-Z0-9_]/g, '_')

  if (o.mode === 'loadBalancer') {
    const backends = o.backend.split('\\n').map(s => s.trim()).filter(Boolean)
    add('upstream ' + upstream + ' {')
    backends.forEach(b => add(ind + 'server ' + b + ';'))
    add('}')
    add('')
  }

  add('server {')
  add(ind + 'listen 80;')
  add(ind + 'listen [::]:80;')

  if (o.ssl) {
    add(ind + 'listen 443 ssl http2;')
    add(ind + 'ssl_certificate ' + o.certPath + ';')
    add(ind + 'ssl_certificate_key ' + o.keyPath + ';')
    add(ind + 'if ($scheme != "https") {')
    add(ind + '  return 301 https://$host$request_uri;')
    add(ind + '}')
  }

  add(ind + 'server_name ' + (domains.length ? domains.join(' ') : '_') + ';')
  // ... gzip, headers, auth, root, location blocks, extras
  add('}')

  return { text: lines.join('\\n'), warnings, upstreamName: upstream }
}
`.trim()

const translations = {
  pt: {
    title: 'Gerador de Configuração Nginx',
    intro: (
      <>
        Monta blocos de servidor <Text code>nginx</Text> prontos para uso: reverse proxy,
        site estático, SPA com history fallback, API com prefixo, PHP-FPM e load balancer com{' '}
        <Text code>upstream</Text>. Ajuste domínios, SSL, gzip, headers de segurança e regras
        extras — tudo no navegador, nada sai da máquina.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Escolha um ponto de partida e edite à vontade.',
    siteTitle: 'Site',
    domainsLabel: 'Domínio(s)',
    domainsHint: 'example.com www.example.com',
    modeLabel: 'Função',
    modes: {
      proxy: 'Reverse proxy',
      static: 'Estático',
      spa: 'SPA fallback',
      api: 'API com prefixo',
      php: 'PHP-FPM',
      loadBalancer: 'Load balancer',
    },
    backendLabel: 'Backend(s)',
    backendHintProxy: 'host:port do app (ex.: localhost:3000 ou api:8080).',
    backendHintApi: 'host:port da API (ex.: localhost:8080).',
    backendHintPhp: 'socket ou host:port do PHP-FPM.',
    backendHintLb: 'Um backend por linha (ex.: localhost:3001).',
    rootLabel: 'Diretório raiz',
    rootPlaceholder: '/var/www/html',
    locationLabel: 'Location',
    locationPlaceholder: '/  ou  /api/',
    optionsTitle: 'Opções',
    optSsl: 'HTTPS / SSL',
    certLabel: 'Certificado',
    keyLabel: 'Chave privada',
    optGzip: 'Compressão gzip',
    optHeaders: 'Headers de segurança',
    optBasicAuth: 'Autenticação básica',
    authFileLabel: 'Arquivo de senhas',
    optCaching: 'Cache de assets estáticos',
    optLogAccess: 'Log de acesso',
    optLogError: 'Log de erros',
    optComments: 'Comentários de seção',
    extraLabel: 'Regras adicionais (verbatim)',
    extraPlaceholder: 'redir /old /new permanent;',
    outTitle: 'Configuração gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — confira antes de usar:',
    warningsNone: 'Nenhum aviso. Lembre-se de testar com nginx -t antes de recarregar.',
    wDomains: 'Nenhum domínio informado.',
    wBackend: 'Backend vazio para o modo escolhido.',
    wRoot: 'Diretório raiz vazio para o modo escolhido.',
    tipTitle: 'Dicas de uso',
    tipBody: (
      <>
        O nginx espera que blocos <Text code>server</Text> estejam dentro do contexto{' '}
        <Text code>http</Text> — em arquivos de site isso já é padrão. Sempre valide antes de
        recarregar:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'sudo nginx -t\nsudo systemctl reload nginx'}</pre>
        Para HTTPS em produção, prefira certificados gerenciados (Let's Encrypt + certbot) e
        redirecione HTTP para HTTPS.
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc: 'O builder monta o bloco server linha a linha, incluindo o upstream quando necessário, e coleta avisos sobre campos obrigatórios vazios.',
  },
  en: {
    title: 'Nginx Config Generator',
    intro: (
      <>
        Builds ready-to-use <Text code>nginx</Text> server blocks: reverse proxy, static
        site, SPA history fallback, API with prefix, PHP-FPM and load balancer with{' '}
        <Text code>upstream</Text>. Tweak domains, SSL, gzip, security headers and extra rules
        — all in the browser, nothing leaves the machine.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'Pick a starting point and edit freely.',
    siteTitle: 'Site',
    domainsLabel: 'Domain(s)',
    domainsHint: 'example.com www.example.com',
    modeLabel: 'Role',
    modes: {
      proxy: 'Reverse proxy',
      static: 'Static site',
      spa: 'SPA fallback',
      api: 'API prefix',
      php: 'PHP-FPM',
      loadBalancer: 'Load balancer',
    },
    backendLabel: 'Backend(s)',
    backendHintProxy: 'App host:port (e.g. localhost:3000 or api:8080).',
    backendHintApi: 'API host:port (e.g. localhost:8080).',
    backendHintPhp: 'PHP-FPM socket or host:port.',
    backendHintLb: 'One backend per line (e.g. localhost:3001).',
    rootLabel: 'Root directory',
    rootPlaceholder: '/var/www/html',
    locationLabel: 'Location',
    locationPlaceholder: '/  or  /api/',
    optionsTitle: 'Options',
    optSsl: 'HTTPS / SSL',
    certLabel: 'Certificate',
    keyLabel: 'Private key',
    optGzip: 'gzip compression',
    optHeaders: 'Security headers',
    optBasicAuth: 'Basic authentication',
    authFileLabel: 'Password file',
    optCaching: 'Static asset cache',
    optLogAccess: 'Access log',
    optLogError: 'Error log',
    optComments: 'Section comments',
    extraLabel: 'Extra rules (verbatim)',
    extraPlaceholder: 'redir /old /new permanent;',
    outTitle: 'Generated config',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — review before using:',
    warningsNone: 'No warnings. Remember to test with nginx -t before reloading.',
    wDomains: 'No domain provided.',
    wBackend: 'Empty backend for the selected mode.',
    wRoot: 'Empty root directory for the selected mode.',
    tipTitle: 'Usage tips',
    tipBody: (
      <>
        nginx expects <Text code>server</Text> blocks inside the <Text code>http</Text> context
        — site config files already do. Always validate before reloading:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'sudo nginx -t\nsudo systemctl reload nginx'}</pre>
        For production HTTPS, prefer managed certificates (Let's Encrypt + certbot) and redirect
        HTTP to HTTPS.
      </>
    ),
    howTitle: 'How it works — source algorithm',
    howDesc: 'The builder assembles the server block line by line, including the upstream when needed, and collects warnings about empty required fields.',
  },
}

export default function NginxConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('proxy')
  const [fields, setFields] = useState(() => ({ ...DEFAULTS }))
  const [copied, setCopied] = useState(false)

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const applyPreset = (key) => {
    setPreset(key)
    setFields({ ...PRESETS[key] })
  }

  const result = useMemo(() => buildNginxConfig(fields), [fields])
  const { text, warnings } = result
  const uniqueWarnings = useMemo(() => Array.from(new Set(warnings)), [warnings])
  const lineCount = text.split('\n').length
  const byteCount = new TextEncoder().encode(text).length

  const needsBackend = fields.mode === 'proxy' || fields.mode === 'api' || fields.mode === 'php' || fields.mode === 'loadBalancer'
  const needsRoot = fields.mode === 'static' || fields.mode === 'spa' || fields.mode === 'php'

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  const backendHint =
    fields.mode === 'api' ? t.backendHintApi
      : fields.mode === 'php' ? t.backendHintPhp
        : fields.mode === 'loadBalancer' ? t.backendHintLb
          : t.backendHintProxy

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={preset}
          onChange={applyPreset}
          options={Object.keys(PRESETS).map((k) => ({ label: PRESETS[k].label[lang], value: k }))}
        />
      </Card>

      <Card title={t.siteTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.domainsLabel}</Text>
            <Input
              value={fields.domains}
              onChange={(e) => setField('domains', e.target.value)}
              placeholder={t.domainsHint}
              style={{ width: 320, fontFamily: 'monospace', fontSize: 12 }}
              allowClear
            />
          </Space>

          <Space wrap align="center">
            <Text type="secondary">{t.modeLabel}</Text>
            <Segmented
              value={fields.mode}
              onChange={(v) => setField('mode', v)}
              options={MODES.map((m) => ({ label: t.modes[m], value: m }))}
            />
          </Space>

          {needsBackend && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.backendLabel}</Text>
              <TextArea
                value={fields.backend}
                onChange={(e) => setField('backend', e.target.value)}
                rows={fields.mode === 'loadBalancer' ? 4 : 1}
                style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 440 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{backendHint}</Text>
            </Space>
          )}

          {needsRoot && (
            <Space wrap align="center">
              <Text type="secondary">{t.rootLabel}</Text>
              <Input
                value={fields.root}
                onChange={(e) => setField('root', e.target.value)}
                placeholder={t.rootPlaceholder}
                style={{ width: 280, fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          )}

          {(fields.mode === 'proxy' || fields.mode === 'api') && (
            <Space wrap align="center">
              <Text type="secondary">{t.locationLabel}</Text>
              <Input
                value={fields.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder={t.locationPlaceholder}
                style={{ width: 180, fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          )}
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.optSsl}</Text>
            <Switch checked={fields.ssl} onChange={(v) => setField('ssl', v)} />
          </Space>
          {fields.ssl && (
            <>
              <Space wrap align="center">
                <Text type="secondary" style={{ fontSize: 12 }}>{t.certLabel}</Text>
                <Input
                  value={fields.certPath}
                  onChange={(e) => setField('certPath', e.target.value)}
                  style={{ width: 360, fontFamily: 'monospace', fontSize: 12 }}
                />
              </Space>
              <Space wrap align="center">
                <Text type="secondary" style={{ fontSize: 12 }}>{t.keyLabel}</Text>
                <Input
                  value={fields.keyPath}
                  onChange={(e) => setField('keyPath', e.target.value)}
                  style={{ width: 360, fontFamily: 'monospace', fontSize: 12 }}
                />
              </Space>
            </>
          )}
          <Space wrap align="center">
            <Text type="secondary">{t.optGzip}</Text>
            <Switch checked={fields.gzip} onChange={(v) => setField('gzip', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optHeaders}</Text>
            <Switch checked={fields.headers} onChange={(v) => setField('headers', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optBasicAuth}</Text>
            <Switch checked={fields.basicAuth} onChange={(v) => setField('basicAuth', v)} />
          </Space>
          {fields.basicAuth && (
            <Space wrap align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>{t.authFileLabel}</Text>
              <Input
                value={fields.authFile}
                onChange={(e) => setField('authFile', e.target.value)}
                style={{ width: 280, fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          )}
          <Space wrap align="center">
            <Text type="secondary">{t.optCaching}</Text>
            <Switch checked={fields.caching} onChange={(v) => setField('caching', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optLogAccess}</Text>
            <Switch checked={fields.logAccess} onChange={(v) => setField('logAccess', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optLogError}</Text>
            <Switch checked={fields.logError} onChange={(v) => setField('logError', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optComments}</Text>
            <Switch checked={fields.comments} onChange={(v) => setField('comments', v)} />
          </Space>
        </Space>
      </Card>

      <Card title={t.extraLabel}>
        <TextArea
          value={fields.extra}
          onChange={(e) => setField('extra', e.target.value)}
          placeholder={t.extraPlaceholder}
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 440 }}
        />
      </Card>

      <Card title={t.outTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.stats(lineCount, byteCount)}</Text>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, background: '#fafafa', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
            <code>{text}</code>
          </pre>
          <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
            {copied ? t.copied : t.copy}
          </Button>
          <Alert
            type={uniqueWarnings.length ? 'warning' : 'success'}
            showIcon
            message={uniqueWarnings.length ? t.warningsTitle : t.warningsNone}
            description={
              uniqueWarnings.length ? (
                <Space direction="vertical" size={0}>
                  {uniqueWarnings.map((w) => (
                    <Text key={w} style={{ fontSize: 12 }}>
                      · {w === 'domains' ? t.wDomains : w === 'backend' ? t.wBackend : t.wRoot}
                    </Text>
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

      <Card title={t.howTitle}>
        <Paragraph type="secondary">{t.howDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>nginxConfigGenerator.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
