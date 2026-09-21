import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Switch, Button, Alert, Collapse, Select, message } from 'antd'
import { CopyOutlined, CheckOutlined, PartitionOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Modelos (presets) de um clique ─────────────────────────────────────────
const PRESETS = {
  http: {
    label: { pt: 'Reverse proxy HTTP', en: 'HTTP reverse proxy' },
    mode: 'http',
    frontendName: 'web',
    bind: '*:80',
    backendName: 'app',
    balance: 'roundrobin',
    servers: 's1 10.0.0.11:8080 1\ns2 10.0.0.12:8080 1',
    healthCheck: true,
    httpChkPath: '/healthz',
    sticky: false,
    forwardfor: true,
    stats: false,
    statsBind: '127.0.0.1:8404',
    statsUser: '',
    statsPass: '',
    comments: true,
    extra: '',
  },
  tcp: {
    label: { pt: 'TCP (DB / Redis / gRPC)', en: 'TCP (DB / Redis / gRPC)' },
    mode: 'tcp',
    frontendName: 'db',
    bind: '*:5432',
    backendName: 'pg-servers',
    balance: 'leastconn',
    servers: 'pg1 10.0.0.21:5432\npg2 10.0.0.22:5432',
    healthCheck: true,
    httpChkPath: '/healthz',
    sticky: false,
    forwardfor: false,
    stats: false,
    statsBind: '127.0.0.1:8404',
    statsUser: '',
    statsPass: '',
    comments: true,
    extra: '',
  },
  stats: {
    label: { pt: 'HTTP + painel de stats', en: 'HTTP + stats dashboard' },
    mode: 'http',
    frontendName: 'web',
    bind: '*:80',
    backendName: 'app',
    balance: 'random',
    servers: 's1 10.0.0.11:8080\ns2 10.0.0.12:8080\ns3 10.0.0.13:8080',
    healthCheck: true,
    httpChkPath: '/healthz',
    sticky: false,
    forwardfor: true,
    stats: true,
    statsBind: '127.0.0.1:8404',
    statsUser: 'admin',
    statsPass: 'admin',
    comments: true,
    extra: '',
  },
}

const BALANCES = [
  { value: 'roundrobin', pt: 'roundrobin — simples e robusta', en: 'roundrobin — simple, robust' },
  { value: 'leastconn', pt: 'leastconn — menor nº de conexões', en: 'leastconn — fewest connections' },
  { value: 'random', pt: 'random — distribuição uniforme (2 reinitos)', en: 'random — uniform, 2 draws' },
  { value: 'first', pt: 'first — sempre no 1º servidor livre', en: 'first — always the first free server' },
  { value: 'uri', pt: 'uri — mesmo URI → mesmo servidor (cache)', en: 'uri — same URI → same server (cache)' },
  { value: 'source', pt: 'source — mesma origem → mesmo servidor', en: 'source — same client IP → same server' },
]

// ─── Algoritmo-fonte exibido na própria página ────────────────────────────
const SOURCE = `
function buildHaproxy(o) {
  const lines = []
  const warnings = []
  const ind = '    '
  const add = (s) => lines.push(s)
  const section = (title) => {
    if (o.comments) add('# ' + title)
  }

  section('===== global =====')
  add('global')
  add(ind + 'maxconn 4096')

  section('===== defaults =====')
  add('defaults')
  add(ind + 'mode ' + o.mode)
  add(ind + 'timeout connect 5s')
  add(ind + 'timeout client 50s')
  add(ind + 'timeout server 50s')
  if (o.mode === 'http') {
    add(ind + 'option httplog')
    if (o.forwardfor) add(ind + 'option forwardfor')
  }

  section('===== frontend =====')
  add('frontend ' + (o.frontendName || 'web'))
  add(ind + 'bind ' + (o.bind || '*:80'))
  add(ind + 'mode ' + o.mode)
  add(ind + 'default_backend ' + (o.backendName || 'app'))

  section('===== backend =====')
  add('backend ' + (o.backendName || 'app'))
  add(ind + 'balance ' + o.balance)
  if (o.mode === 'http') {
    if (o.healthCheck) add(ind + 'option httpchk GET ' + (o.httpChkPath || '/healthz'))
    if (o.sticky) add(ind + 'cookie SERVERID insert indirect nocache')
  }

  const servers = String(o.servers || '')
    .split('\\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!servers.length) warnings.push('servers')
  servers.forEach((raw) => {
    let line = raw
    if (o.healthCheck && !/\\bcheck\\b/.test(line)) line += ' check inter 5s'
    add(ind + 'server ' + line)
  })

  if (o.stats) {
    section('===== stats =====')
    add('listen stats')
    add(ind + 'bind ' + (o.statsBind || '127.0.0.1:8404'))
    add(ind + 'mode http')
    add(ind + 'stats enable')
    add(ind + 'stats uri /stats')
    if (o.statsUser && o.statsPass) add(ind + 'stats auth ' + o.statsUser + ':' + o.statsPass)
  }

  String(o.extra || '')
    .split('\\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => add(s))

  return { text: lines.join('\\n'), warnings }
}
`.trim()

const translations = {
  pt: {
    title: 'Gerador de Configuração HAProxy',
    intro: (
      <>
        Monta um <Text code>haproxy.cfg</Text> — o arquivo de configuração do{' '}
        <Text code>HAProxy</Text>, o load balancer / proxy reverso de alta
        performance usado na frente de serviços web, bancos de dados e gRPC.
        Escolha o modelo (HTTP, TCP ou com o painel de stats), ajuste os
        servers e copie o arquivo pronto pra validar com{' '}
        <Text code>haproxy -c -f haproxy.cfg</Text>. 100% client-side, nada sai
        do navegador.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Um clique aplica um exemplo — depois é só ajustar.',
    frontTitle: 'Listeners (frontend)',
    modeLabel: 'Modo',
    frontendNameLabel: 'Nome do frontend',
    bindLabel: 'Bind (frontend)',
    bindHint: 'Endereço e porta que o frontend escuta — ex.: *:80, 127.0.0.1:8080.',
    backendNameLabel: 'Nome do backend',
    backendTitle: 'Backend & servers',
    balanceLabel: 'Algoritmo de balanceamento',
    serversLabel: 'Servers (um por linha)',
    serversPlaceholder: 's1 10.0.0.11:8080 1\ns2 10.0.0.12:8080 1',
    serversHint: 'Formato: nome endereço:porta (peso opcional, padrão 1). O check é adicionado automaticamente quando a health check está ligada.',
    optionsTitle: 'Opções',
    optHealth: 'Health check (check inter 5s)',
    httpChkLabel: 'Caminho do HTTP check',
    httpChkHint: 'Só HTTP: envia GET para esse path — ex.: /healthz.',
    optSticky: 'Sessão sticky (cookie SERVERID)',
    optForwardfor: 'option forwardfor (X-Forwarded-For)',
    optStats: 'Painel de stats (listen stats)',
    statsBindLabel: 'Bind do stats',
    statsUserLabel: 'Usuário (opcional)',
    statsPassLabel: 'Senha (opcional)',
    optsHttpOnly: 'Só se aplica ao modo HTTP.',
    commentsLabel: 'Comentários de seção',
    extraLabel: 'Linhas adicionais (verbatim)',
    extraPlaceholder: 'option redispatch',
    extraHint: 'Coladas no final do arquivo — certifique-se de que fazem sentido no contexto.',
    outTitle: 'haproxy.cfg gerado',
    statsTxt: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    warningsTitle: 'Avisos — o config ainda sai, mas confira:',
    warningsNone: 'Tudo certo — valide com haproxy -c -f haproxy.cfg antes de aplicar.',
    wServers: 'Nenhum server definido — sem server o backend não tem para onde mandar tráfego.',
    tipTitle: 'Entendendo o resultado',
    tipBody: (
      <>
        O HAProxy separa o tráfego em duas metades: <Text code>frontend</Text>{' '}
        (onde o tráfego entra — o <Text code>bind</Text> define IP:porta) e{' '}
        <Text code>backend</Text> (para onde ele vai — os{' '}
        <Text code>server</Text>s). O <Text code>balance</Text> decide como as
        conexões são distribuídas: <Text code>roundrobin</Text> alterna em
        ordem, <Text code>leastconn</Text> manda pro servidor com menos
        conexões abertas (bom pra TCP/DB), <Text code>random</Text> dá
        distribuição uniforme e <Text code>uri</Text>/<Text code>source</Text>{' '}
        fixam o mesmo alvo por URI ou IP de origem (cache e sessão). Ligar a{' '}
        <Text code>health check</Text> faz o HAProxy marcar o server como{' '}
        <Text code>DOWN</Text> automaticamente quando ele para de responder —
        sem isso o tráfego continua indo pra máquina morta. Sessão sticky
        (cookie <Text code>SERVERID</Text>) garante que as requests de um
        mesmo usuário caiam sempre no mesmo server, o que quebra o
        balanceamento puro mas resolve login em memória:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'frontend web\n\tbind *:80\n\tmode http\n\tdefault_backend app\n\nbackend app\n\tbalance roundrobin\n\tserver s1 10.0.0.11:8080 check inter 5s'}</pre>
        No deploy em container o HAProxy costuma ser um serviço separado na
        mesma rede do Compose, apontando os servers pro nome dos serviços
        (ex.: <Text code>app:8080</Text>).
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'O builder monta o arquivo em seções canônicas (global, defaults, frontend, backend, stats), injeta o modo http/tcp nas seções certas, adiciona option httpchk e cookie só no modo HTTP, cola o check inter 5s em cada server (sem duplicar se você já escreveu "check") e concatena as linhas extras verbatim no final. Simples por design: o haproxy.cfg é texto com palavras-chave de seção.',
  },
  en: {
    title: 'HAProxy Config Generator',
    intro: (
      <>
        Builds a <Text code>haproxy.cfg</Text> — the config file for{' '}
        <Text code>HAProxy</Text>, the high-performance load balancer / reverse
        proxy used in front of Web services, databases and gRPC. Pick a template
        (HTTP, TCP or with the stats dashboard), tweak the servers, and grab the
        file ready to validate with <Text code>haproxy -c -f haproxy.cfg</Text>.
        100% client-side, nothing leaves the browser.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'One click applies a sample — tweak afterwards.',
    frontTitle: 'Listeners (frontend)',
    modeLabel: 'Mode',
    frontendNameLabel: 'Frontend name',
    bindLabel: 'Bind (frontend)',
    bindHint: 'Address and port the frontend listens on — e.g. *:80, 127.0.0.1:8080.',
    backendNameLabel: 'Backend name',
    backendTitle: 'Backend & servers',
    balanceLabel: 'Balancing algorithm',
    serversLabel: 'Servers (one per line)',
    serversPlaceholder: 's1 10.0.0.11:8080 1\ns2 10.0.0.12:8080 1',
    serversHint: 'Format: name address:port (optional weight, default 1). The check is added automatically when the health check is on.',
    optionsTitle: 'Options',
    optHealth: 'Health check (check inter 5s)',
    httpChkLabel: 'HTTP check path',
    httpChkHint: 'HTTP only: sends GET to that path — e.g. /healthz.',
    optSticky: 'Sticky sessions (cookie SERVERID)',
    optForwardfor: 'option forwardfor (X-Forwarded-For)',
    optStats: 'Stats dashboard (listen stats)',
    statsBindLabel: 'Stats bind',
    statsUserLabel: 'Username (optional)',
    statsPassLabel: 'Password (optional)',
    optsHttpOnly: 'Only applies in HTTP mode.',
    commentsLabel: 'Section comments',
    extraLabel: 'Extra lines (verbatim)',
    extraPlaceholder: 'option redispatch',
    extraHint: 'Appended at the end of the file — make sure they fit the context.',
    outTitle: 'Generated haproxy.cfg',
    statsTxt: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    warningsTitle: 'Warnings — the config still generates, but check:',
    warningsNone: 'All good — validate with haproxy -c -f haproxy.cfg before deploying.',
    wServers: 'No servers defined — without servers the backend has nowhere to send traffic.',
    tipTitle: 'Understanding the output',
    tipBody: (
      <>
        HAProxy splits traffic into two halves: the{' '}
        <Text code>frontend</Text> (where traffic enters — the{' '}
        <Text code>bind</Text> defines IP:port) and the{' '}
        <Text code>backend</Text> (where it goes — the{' '}
        <Text code>server</Text>s). The{' '}
        <Text code>balance</Text> decides how connections are spread:{' '}
        <Text code>roundrobin</Text> alternates in order,{' '}
        <Text code>leastconn</Text> sends to the server with the fewest open
        connections (good for TCP/DB), <Text code>random</Text> spreads
        uniformly, and <Text code>uri</Text>/<Text code>source</Text> pin the
        same target by URI or source IP (cache and session). Turning on the{' '}
        <Text code>health check</Text> makes HAProxy mark a server as{' '}
        <Text code>DOWN</Text> automatically when it stops responding —
        otherwise traffic keeps going to the dead machine. Sticky sessions
        (cookie <Text code>SERVERID</Text>) keep a user matching the same
        server, which breaks pure balancing but fixes in-memory logins:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'frontend web\n\tbind *:80\n\tmode http\n\tdefault_backend app\n\nbackend app\n\tbalance roundrobin\n\tserver s1 10.0.0.11:8080 check inter 5s'}</pre>
        In a container deploy HAProxy is usually a separate service on the same
        Compose network, pointing servers at the service names (e.g.{' '}
        <Text code>app:8080</Text>).
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'The builder emits the file in canonical sections (global, defaults, frontend, backend, stats), injects the http/tcp mode into the right sections, adds option httpchk and cookie only in HTTP mode, appends check inter 5s to each server (without doubling if you already wrote "check") and concatenates verbatim extra lines at the end. Simple by design: a haproxy.cfg is just text with section keywords.',
  },
}

function buildHaproxy(o) {
  const lines = []
  const warnings = []
  const ind = '    '
  const add = (s) => lines.push(s)
  const section = (title) => {
    if (o.comments) add('# ' + title)
  }

  section('===== global =====')
  add('global')
  add(ind + 'maxconn 4096')

  section('===== defaults =====')
  add('defaults')
  add(ind + 'mode ' + o.mode)
  add(ind + 'timeout connect 5s')
  add(ind + 'timeout client 50s')
  add(ind + 'timeout server 50s')
  if (o.mode === 'http') {
    add(ind + 'option httplog')
    if (o.forwardfor) add(ind + 'option forwardfor')
  }

  section('===== frontend =====')
  add('frontend ' + (o.frontendName || 'web'))
  add(ind + 'bind ' + (o.bind || '*:80'))
  add(ind + 'mode ' + o.mode)
  add(ind + 'default_backend ' + (o.backendName || 'app'))

  section('===== backend =====')
  add('backend ' + (o.backendName || 'app'))
  add(ind + 'balance ' + o.balance)
  if (o.mode === 'http') {
    if (o.healthCheck) add(ind + 'option httpchk GET ' + (o.httpChkPath || '/healthz'))
    if (o.sticky) add(ind + 'cookie SERVERID insert indirect nocache')
  }

  const servers = String(o.servers || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!servers.length) warnings.push('servers')
  servers.forEach((raw) => {
    let line = raw
    if (o.healthCheck && !/\bcheck\b/.test(line)) line += ' check inter 5s'
    add(ind + 'server ' + line)
  })

  if (o.stats) {
    section('===== stats =====')
    add('listen stats')
    add(ind + 'bind ' + (o.statsBind || '127.0.0.1:8404'))
    add(ind + 'mode http')
    add(ind + 'stats enable')
    add(ind + 'stats uri /stats')
    if (o.statsUser && o.statsPass) add(ind + 'stats auth ' + o.statsUser + ':' + o.statsPass)
  }

  String(o.extra || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => add(s))

  return { text: lines.join('\n'), warnings }
}

export default function HaproxyConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('http')
  const [fields, setFields] = useState(() => ({ ...PRESETS.http }))
  const [copied, setCopied] = useState(false)

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const applyPreset = (key) => {
    setPreset(key)
    setFields({ ...PRESETS[key] })
  }

  const result = useMemo(() => buildHaproxy(fields), [fields])
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
      <Title level={2}>
        <PartitionOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={preset}
          onChange={applyPreset}
          options={Object.keys(PRESETS).map((k) => ({ label: PRESETS[k].label[lang], value: k }))}
        />
      </Card>

      <Card title={t.frontTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.modeLabel}</Text>
            <Segmented
              value={fields.mode}
              onChange={(v) => setField('mode', v)}
              options={[
                { label: 'http', value: 'http' },
                { label: 'tcp', value: 'tcp' },
              ]}
            />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.frontendNameLabel}</Text>
            <Input
              value={fields.frontendName}
              onChange={(e) => setField('frontendName', e.target.value)}
              placeholder="web"
              style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
            />
            <Text type="secondary">{t.bindLabel}</Text>
            <Input
              value={fields.bind}
              onChange={(e) => setField('bind', e.target.value)}
              placeholder="*:80"
              style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
              allowClear
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.bindHint}</Text>
          </Space>
        </Space>
      </Card>

      <Card title={t.backendTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.backendNameLabel}</Text>
            <Input
              value={fields.backendName}
              onChange={(e) => setField('backendName', e.target.value)}
              placeholder="app"
              style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
            />
            <Text type="secondary">{t.balanceLabel}</Text>
            <Select
              value={fields.balance}
              onChange={(v) => setField('balance', v)}
              style={{ width: 360 }}
              options={BALANCES.map((b) => ({ value: b.value, label: b[lang] }))}
            />
          </Space>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">{t.serversLabel}</Text>
            <TextArea
              value={fields.servers}
              onChange={(e) => setField('servers', e.target.value)}
              placeholder={t.serversPlaceholder}
              rows={4}
              style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 640 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.serversHint}</Text>
          </Space>
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.optHealth}</Text>
            <Switch checked={fields.healthCheck} onChange={(v) => setField('healthCheck', v)} />
            {fields.mode === 'http' && fields.healthCheck && (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.httpChkLabel}</Text>
                <Input
                  value={fields.httpChkPath}
                  onChange={(e) => setField('httpChkPath', e.target.value)}
                  placeholder="/healthz"
                  style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
                />
              </>
            )}
          </Space>
          {fields.mode === 'http' && fields.healthCheck && (
            <Text type="secondary" style={{ fontSize: 12 }}>{t.httpChkHint}</Text>
          )}
          <Space wrap align="center">
            <Text type="secondary">{t.optSticky}</Text>
            <Switch checked={fields.sticky} disabled={fields.mode !== 'http'} onChange={(v) => setField('sticky', v)} />
            <Text type="secondary">{t.optForwardfor}</Text>
            <Switch checked={fields.forwardfor} disabled={fields.mode !== 'http'} onChange={(v) => setField('forwardfor', v)} />
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.optStats}</Text>
            <Switch checked={fields.stats} onChange={(v) => setField('stats', v)} />
          </Space>
          {fields.stats && (
            <Space wrap align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>{t.statsBindLabel}</Text>
              <Input
                value={fields.statsBind}
                onChange={(e) => setField('statsBind', e.target.value)}
                style={{ width: 180, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.statsUserLabel}</Text>
              <Input
                value={fields.statsUser}
                onChange={(e) => setField('statsUser', e.target.value)}
                style={{ width: 130, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.statsPassLabel}</Text>
              <Input.Password
                value={fields.statsPass}
                onChange={(e) => setField('statsPass', e.target.value)}
                style={{ width: 130, fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          )}
          <Space wrap align="center">
            <Text type="secondary">{t.commentsLabel}</Text>
            <Switch checked={fields.comments} onChange={(v) => setField('comments', v)} />
          </Space>
        </Space>
      </Card>

      <Card title={t.extraLabel} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.extraHint}</Text>}>
        <TextArea
          value={fields.extra}
          onChange={(e) => setField('extra', e.target.value)}
          placeholder={t.extraPlaceholder}
          rows={2}
          style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 440 }}
        />
      </Card>

      <Card title={t.outTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.statsTxt(lineCount, byteCount)}</Text>}>
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
                    <Text key={w} style={{ fontSize: 12 }}>· {w === 'servers' ? t.wServers : ''}</Text>
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
              label: <Text code>haproxy-builder.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}