import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Switch, Button, Alert, Collapse, message } from 'antd'
import { CopyOutlined, CheckOutlined, ContainerOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Modelos (presets) de um clique ─────────────────────────────────────────
const PRESETS = {
  proxy: {
    label: { pt: 'Reverse proxy (Vite/Node)', en: 'Reverse proxy (Vite/Node)' },
    domains: 'example.com',
    mode: 'proxy',
    backend: 'localhost:3000',
    matcher: '',
    root: '',
    encode: true,
    headers: true,
    tls: false,
    auth: false,
    authUser: '',
    authHash: '',
    comments: true,
    extra: '',
  },
  static: {
    label: { pt: 'Estático (file_server)', en: 'Static (file_server)' },
    domains: 'site.example.com',
    mode: 'static',
    backend: '',
    matcher: '',
    root: '/var/www/html',
    encode: true,
    headers: true,
    tls: false,
    auth: false,
    authUser: '',
    authHash: '',
    comments: true,
    extra: '',
  },
  api: {
    label: { pt: 'Subdomínio de API', en: 'API subdomain' },
    domains: 'api.example.com',
    mode: 'proxy',
    backend: 'localhost:8080',
    matcher: '/api/*',
    root: '',
    encode: true,
    headers: true,
    tls: false,
    auth: false,
    authUser: '',
    authHash: '',
    comments: true,
    extra: '',
  },
  php: {
    label: { pt: 'PHP-FPM', en: 'PHP-FPM' },
    domains: 'php.example.com',
    mode: 'php',
    backend: '127.0.0.1:9000',
    matcher: '',
    root: '/var/www/html',
    encode: true,
    headers: true,
    tls: false,
    auth: false,
    authUser: '',
    authHash: '',
    comments: true,
    extra: '',
  },
}

// ─── Algoritmo-fonte exibido na própria página ────────────────────────────
const SOURCE = `
function buildCaddyfile(o) {
  const lines = []
  const warnings = []
  const ind = '  '
  const add = (s) => lines.push(s)

  // domains: "a.com, b.com" — Caddy aceita vários nomes no mesmo bloco
  const domains = String(o.domains || '')
    .split(/[,\\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const site = domains.join(', ')
  if (!domains.length) warnings.push('domains')

  add(site)
  add('{')

  if (o.tls)        add(ind + 'tls internal')
  if (o.encode)     add(ind + 'encode zstd gzip')

  // header: bloco com "-Nome" (remove) e "Nome valor" (seta)
  if (o.headers) {
    add(ind + 'header {')
    add(ind.repeat(2) + '- Server')
    add(ind.repeat(2) + 'X-Content-Type-Options "nosniff"')
    add(ind.repeat(2) + 'X-Frame-Options "DENY"')
    add(ind.repeat(2) + 'Referrer-Policy "strict-origin-when-cross-origin"')
    add(ind + '}')
  }

  if (o.auth) {
    add(ind + 'basic_auth {')
    add(ind.repeat(2) + o.authUser + ' ' + o.authHash)
    add(ind + '}')
  }

  if (o.mode === 'proxy' || o.mode === 'php') {
    const backend = String(o.backend || '').trim()
    if (!backend) warnings.push('backend')
    if (o.mode === 'php') {
      add(ind + 'root * ' + (o.root || ' <root>'))
      add(ind + 'file_server')
      add(ind + 'php_fastcgi ' + backend)
    } else {
      // matcher opcional: "reverse_proxy /api/* localhost:8080"
      const m = String(o.matcher || '').trim()
      add(ind + 'reverse_proxy ' + (m ? m + ' ' : '') + (backend || ' <backend>'))
    }
  } else if (o.mode === 'static') {
    add(ind + 'root * ' + (o.root || ' <root>'))
    add(ind + 'file_server')
  }

  // linhas extras coladas verbatim
  String(o.extra || '')
    .split('\\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => add(ind + s))

  add('}')
  return { text: lines.join('\\n'), warnings }
}
`.trim()

const translations = {
  pt: {
    title: 'Gerador de Caddyfile',
    intro: (
      <>
        Monta um <Text code>Caddyfile</Text> — o arquivo de configuração do{' '}
        <Text code>Caddy</Text>, o servidor web com HTTPS automático via Let's
        Encrypt. Escolha o modelo (reverse proxy, estático, subdomínio de API
        ou PHP-FPM), ajuste domínios e opções, e o bloco do site sai pronto pra
        copiar. 100% client-side, nada sai do navegador.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Um clique aplica um exemplo — depois é só ajustar.',
    siteTitle: 'Site',
    domainsLabel: 'Domínio(s)',
    domainsHint: 'example.com, www.example.com',
    modeLabel: 'Função do servidor',
    modes: { proxy: 'reverse_proxy', static: 'file_server', php: 'PHP-FPM' },
    backendLabel: 'Backend (endereço ou porta)',
    backendPlaceholder: 'localhost:3000',
    backendHint: 'host:porta do app — localhost, um container do Compose (ex.: api:8080) ou um IP.',
    matcherLabel: 'Matcher de caminho (opcional)',
    matcherPlaceholder: '/api/*',
    matcherHint: 'Limita o reverse_proxy a um prefixo de caminho; vazio = todas as rotas.',
    rootLabel: 'Diretório raiz (root)',
    rootPlaceholder: '/var/www/html',
    optionsTitle: 'Opções',
    optEncode: 'Codificar com zstd + gzip',
    optHeaders: 'Remover Server e adicionar headers de segurança',
    optTls: 'tls internal (sem cert público)',
    optAuth: 'basic_auth (senha em bcrypt)',
    authUserLabel: 'Usuário',
    authHashLabel: 'Hash bcrypt',
    authHashHint: 'Gere com: caddy hash-password (ou htpasswd -bnBC 14 "" senha)',
    commentsLabel: 'Comentários de seção',
    extraLabel: 'Linhas adicionais (verbatim, sem indentação necessária)',
    extraPlaceholder: 'redir /old http://example.com/new 308',
    outTitle: 'Caddyfile gerado',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    warningsTitle: 'Avisos — o Caddyfile ainda sai, mas confira:',
    warningsNone: 'Tudo certo — só precisa do domínio válido (Caddy resolve o resto).',
    wDomains: 'Sem domínio informado.',
    wBackend: 'Backend vazio — defina o endereço do reverse proxy/PHP.',
    tipTitle: 'Entendendo o resultado',
    tipBody: (
      <>
        O Caddy é <b>self-managed de TLS</b>: por padrão ele envia e configura
        sozinho os certificados Let's Encrypt para o domínio do bloco — é por
        isso que 'https' quase nunca aparece no Caddyfile. Cada{' '}
        <Text code>site</Text> serve um conjunto de domínios, e as{' '}
        <Text code>diretivas</Text> dentro do bloco decidem o que responder (proxy,
        arquivo, PHP). Num deplo comum (este devtools!) o Caddy fica na frente e
        repassa pra um container interno:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'api.example.com {\n\tencode zstd gzip\n\treverse_proxy kong:8000\n}'}</pre>
        Valide antes de recarregar: <Text code>caddy validate</Text> e{' '}
        <Text code>caddy reload</Text>. Para hosts internos/máquinas sem domínio
        público, <Text code>tls internal</Text> emite um certificado CA local
        autoassinado.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'O builder junta domínios num só bloco (Caddy aceita vários nomes separados por vírgula), monta as diretivas por seção na ordem canônica do Caddy (base), e contatena as linhas extras verbatim. Simples por design: o Caddyfile é texto.',
  },
  en: {
    title: 'Caddyfile Generator',
    intro: (
      <>
        Builds a <Text code>Caddyfile</Text> — the config file for{' '}
        <Text code>Caddy</Text>, the web server with automatic Let's Encrypt
        HTTPS. Pick a template (reverse proxy, static, API subdomain or
        PHP-FPM), tweak the values, and grab the site block ready to copy.
        100% client-side, nothing leaves the browser.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'One click applies a sample — tweak afterwards.',
    siteTitle: 'Site',
    domainsLabel: 'Domain(s)',
    domainsHint: 'e.g. example.com, www.example.com',
    modeLabel: 'Server role',
    modes: { proxy: 'reverse_proxy', static: 'file_server', php: 'PHP-FPM' },
    backendLabel: 'Backend address',
    backendPlaceholder: 'localhost:3000',
    backendHint: 'host:port of the app — localhost, a Compose service (api:8080) or an IP.',
    matcherLabel: 'Path matcher (optional)',
    matcherPlaceholder: '/api/*',
    matcherHint: 'Restrict reverse_proxy to a path prefix; empty = every route.',
    rootLabel: 'Root directory',
    rootPlaceholder: '/var/www/html',
    optionsTitle: 'Options',
    optEncode: 'Compress with zstd + gzip',
    optHeaders: 'Remove Server and set security headers',
    optTls: 'tls internal (no external HTTPS)',
    optAuth: 'basic_auth',
    authUserLabel: 'Username',
    authHashLabel: 'bcrypt hash',
    authHashHint: 'Generate with: caddy hash-password (or htpasswd -pBC 10 pwd)',
    commentsLabel: 'Section comments',
    extraLabel: 'Extra lines (verbatim)',
    extraPlaceholder: 'redir / https://example.com/ 308',
    outTitle: 'Generated Caddyfile',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    warningsTitle: 'Warnings — the Caddyfile still generates, but check:',
    warningsNone: 'All good — just needs a valid domain (Caddy handles the rest).',
    wDomains: 'No domain provided.',
    wBackend: 'Empty backend — set the reverse_proxy/PHP target.',
    tipTitle: 'Understanding the output',
    tipBody: (
      <>
        Caddy does <strong>automatic HTTPS</strong>: by default it provisions and
        renews Let's Encrypt certificates for the site on each block, which is
        why "https" rarely appears in a Caddyfile. The site block holds all the{' '}
        <Text code>directives</Text>. In a containerized deploy (this devtools!)
        Caddy sits in front and sends traffic to a separate container:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'api.example.com {\n\tencode zstd gzip\n\treverse_proxy api_port:8000\n}'}</pre>
        Validate before reloading: <Text code>caddy validate</Text> and{' '}
        <Text code>caddy reload</Text>. For internal hosts,{' '}
        <Text code>tls internal</Text> issues a local self-signed CA certificate.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'The domain list folds into a single block (Caddy accepts several names separated by commas), directives are built per section in Caddy semantic order, and extra lines are appended verbatim. Simple by design: a Caddyfile is just text.',
  },
}

function buildCaddyfile(o) {
  const lines = []
  const warnings = []
  const IND = o.comments ? '  ' : '  '
  const add = (s) => lines.push(s)

  const domains = String(o.domains || '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const site = domains.join(', ')
  if (!domains.length) warnings.push('domains')

  add(site)
  add('{')

  if (o.tls) add(IND + 'tls internal')
  if (o.encode) add(IND + 'encode zstd gzip')
  if (o.comments) add(IND + '# --- headers ---')

  if (o.headers) {
    add(IND + 'header {')
    add(IND + '  - Server')
    add(IND + '  X-Content-Type-Options "nosniff"')
    add(IND + '  X-Frame-Options "DENY"')
    add(IND + '  Referrer-Policy "strict-origin-when-cross-origin"')
    add(IND + '}')
  }

  if (o.auth) {
    add(IND + 'basic_auth {')
    add(IND + '  ' + o.authUser + ' ' + o.authHash)
    add(IND + '}')
  }

  if (o.mode === 'proxy' || o.mode === 'php') {
    const backend = String(o.backend || '').trim()
    if (!backend) warnings.push('backend')
    if (o.mode === 'php') {
      add(IND + 'root * ' + (o.root || '/var/www/html'))
      add(IND + 'php_fastcgi ' + backend)
      add(IND + 'file_server')
    } else {
      const m = String(o.matcher || '').trim()
      add(IND + 'reverse_proxy ' + (m ? m + ' ' : '') + backend)
    }
  } else if (o.mode === 'static') {
    add(IND + 'root * ' + (o.root || '/var/www/html'))
    add(IND + 'file_server')
  }

  String(o.extra || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => add(IND + s))

  add('}')
  return { text: lines.join('\n'), warnings }
}

export default function CaddyfileGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('proxy')
  const [fields, setFields] = useState(() => ({ ...PRESETS.proxy }))
  const [copied, setCopied] = useState(false)

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const applyPreset = (key) => {
    setPreset(key)
    setFields({ ...PRESETS[key] })
  }

  const result = useMemo(() => buildCaddyfile(fields), [fields])
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
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
              options={[
                { label: t.modes?.proxy ?? 'reverse_proxy', value: 'proxy' },
                { label: t.modes?.static ?? 'file_server', value: 'static' },
                { label: t.modes?.php ?? 'PHP-FPM', value: 'php' },
              ]}
            />
          </Space>

          {(fields.mode === 'proxy' || fields.mode === 'php') && (
            <Space wrap align="center">
              <Text type="secondary">{t.backendLabel}</Text>
              <Input
                value={fields.backend}
                onChange={(e) => setField('backend', e.target.value)}
                placeholder={t.backendPlaceholder}
                style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.backendHint}</Text>
            </Space>
          )}

          {fields.mode === 'proxy' && (
            <Space wrap align="center">
              <Text type="secondary">{t.matcherLabel}</Text>
              <Input
                value={fields.matcher}
                onChange={(e) => setField('matcher', e.target.value)}
                placeholder={t.matcherPlaceholder}
                style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.matcherHint}</Text>
            </Space>
          )}

          {(fields.mode === 'static' || fields.mode === 'php') && (
            <Space wrap align="center">
              <Text type="secondary">{t.rootLabel}</Text>
              <Input
                value={fields.root}
                onChange={(e) => setField('root', e.target.value)}
                placeholder={t.rootPlaceholder}
                style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          )}
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.optEncode}</Text>
            <Switch checked={fields.encode} onChange={(v) => setField('encode', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optHeaders}</Text>
            <Switch checked={fields.headers} onChange={(v) => setField('headers', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optTls}</Text>
            <Switch checked={fields.tls} onChange={(v) => setField('tls', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optAuth}</Text>
            <Switch checked={fields.auth} onChange={(v) => setField('auth', v)} />
          </Space>
          {fields.auth && (
            <Space wrap align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>{t.authUserLabel}</Text>
              <Input
                value={fields.authUser}
                onChange={(e) => setField('authUser', e.target.value)}
                placeholder="alice"
                style={{ width: 160, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.authHashLabel}</Text>
              <Input
                value={fields.authHash}
                onChange={(e) => setField('authHash', e.target.value)}
                placeholder="$2y$10$..."
                style={{ width: 240, fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          )}
          {fields.auth && <Text type="secondary" style={{ fontSize: 12 }}>{t.authHashHint}</Text>}
          <Space wrap align="center">
            <Text type="secondary">{t.commentsLabel}</Text>
            <Switch checked={fields.comments} onChange={(v) => setField('comments', v)} />
          </Space>
        </Space>
      </Card>

      <Card title={t.extraLabel}>
        <TextArea
          value={fields.extra}
          onChange={(e) => setField('extra', e.target.value)}
          placeholder={t.extraPlaceholder}
          rows={2}
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
                    <Text key={w} style={{ fontSize: 12 }}>· {w === 'domains' ? t.wDomains : t.wBackend}</Text>
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
              label: <Text code>caddyfile-builder.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}