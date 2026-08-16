import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Segmented, Switch, Button, Alert, Collapse, message,
} from 'antd'
import { SafetyCertificateOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { PRESETS, DEFAULTS, buildSshConfig } from '../utils/sshConfigGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE = `
function buildSshConfig(o) {
  const lines = []
  const warnings = []
  const add = (s) => lines.push(s)

  const host = String(o.host || '').trim()
  const hostname = String(o.hostname || '').trim()
  const user = String(o.user || '').trim()

  if (!host) warnings.push('host')
  if (!hostname) warnings.push('hostname')
  if (!user) warnings.push('user')

  add('Host ' + (host || '*'))
  if (hostname) add('  HostName ' + hostname)
  if (user) add('  User ' + user)

  const port = Number(o.port)
  if (port && port !== 22) add('  Port ' + port)

  const identityFile = String(o.identityFile || '').trim()
  if (identityFile) add('  IdentityFile ' + identityFile)

  if (o.addKeysToAgent) add('  AddKeysToAgent yes')
  if (o.forwardAgent) add('  ForwardAgent yes')
  if (o.identitiesOnly) add('  IdentitiesOnly yes')

  const sai = Number(o.serverAliveInterval)
  if (sai > 0) add('  ServerAliveInterval ' + sai)

  const sacm = Number(o.serverAliveCountMax)
  if (sacm > 0) add('  ServerAliveCountMax ' + sacm)

  const strict = String(o.strictHostKeyChecking || '').trim()
  if (strict) add('  StrictHostKeyChecking ' + strict)

  const known = String(o.userKnownHostsFile || '').trim()
  if (known) add('  UserKnownHostsFile "' + known + '"')

  const proxyJump = String(o.proxyJump || '').trim()
  if (proxyJump) add('  ProxyJump ' + proxyJump)

  const localForward = String(o.localForward || '').trim()
  if (localForward) add('  LocalForward ' + localForward)

  const remoteForward = String(o.remoteForward || '').trim()
  if (remoteForward) add('  RemoteForward ' + remoteForward)

  const dynamicForward = String(o.dynamicForward || '').trim()
  if (dynamicForward) add('  DynamicForward ' + dynamicForward)

  const logLevel = String(o.logLevel || '').trim()
  if (logLevel) add('  LogLevel ' + logLevel)

  if (o.compression) add('  Compression yes')

  const auth = String(o.preferredAuthentications || '').trim()
  if (auth) add('  PreferredAuthentications ' + auth)

  const extras = String(o.extras || '')
    .split('\\n')
    .map((s) => s.trim())
    .filter(Boolean)
  extras.forEach((s) => add('  ' + s))

  return { text: lines.join('\\n'), warnings }
}
`.trim()

const translations = {
  pt: {
    title: 'Gerador de Configuração SSH',
    intro: (
      <>
        Monta blocos <Text code>Host</Text> para o arquivo <Text code>~/.ssh/config</Text> com as
        diretivas mais usadas: HostName, User, Port, IdentityFile, ProxyJump, túneis LocalForward /
        RemoteForward, DynamicForward (SOCKS) e opções de segurança. Tudo no navegador — nenhuma
        chave ou dado sai da máquina.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Escolha um ponto de partida e edite à vontade.',
    hostTitle: 'Conexão',
    hostLabel: 'Host (alias)',
    hostHint: 'myserver, github.com, internal-*',
    hostnameLabel: 'HostName',
    hostnameHint: 'IP ou FQDN real do servidor',
    userLabel: 'User',
    userHint: 'deploy, git, admin',
    portLabel: 'Port',
    identityFileLabel: 'IdentityFile',
    identityFileHint: '~/.ssh/id_ed25519',
    authTitle: 'Autenticação',
    addKeysToAgentLabel: 'AddKeysToAgent yes',
    forwardAgentLabel: 'ForwardAgent yes',
    identitiesOnlyLabel: 'IdentitiesOnly yes',
    preferredAuthenticationsLabel: 'PreferredAuthentications',
    preferredAuthenticationsHint: 'publickey, password, keyboard-interactive',
    keepAliveTitle: 'Keep-alive',
    serverAliveIntervalLabel: 'ServerAliveInterval (s)',
    serverAliveCountMaxLabel: 'ServerAliveCountMax',
    securityTitle: 'Segurança',
    strictHostKeyCheckingLabel: 'StrictHostKeyChecking',
    strictOptions: [
      { label: 'padrão', value: '' },
      { label: 'yes', value: 'yes' },
      { label: 'no', value: 'no' },
      { label: 'accept-new', value: 'accept-new' },
      { label: 'ask', value: 'ask' },
    ],
    userKnownHostsFileLabel: 'UserKnownHostsFile',
    userKnownHostsFileHint: '~/.ssh/known_hosts_custom',
    forwardingTitle: 'Túneis e proxy',
    proxyJumpLabel: 'ProxyJump',
    proxyJumpHint: 'bastion.example.com',
    localForwardLabel: 'LocalForward',
    localForwardHint: '8080:localhost:8080',
    remoteForwardLabel: 'RemoteForward',
    remoteForwardHint: '9090:localhost:3000',
    dynamicForwardLabel: 'DynamicForward (SOCKS)',
    dynamicForwardHint: '1080',
    logLevelLabel: 'LogLevel',
    logLevelOptions: [
      { label: 'padrão', value: '' },
      { label: 'QUIET', value: 'QUIET' },
      { label: 'FATAL', value: 'FATAL' },
      { label: 'ERROR', value: 'ERROR' },
      { label: 'INFO', value: 'INFO' },
      { label: 'VERBOSE', value: 'VERBOSE' },
      { label: 'DEBUG', value: 'DEBUG' },
    ],
    compressionLabel: 'Compression yes',
    algorithmsTitle: 'Algoritmos (avançado)',
    macsLabel: 'MACs',
    macsHint: 'hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com',
    ciphersLabel: 'Ciphers',
    ciphersHint: 'chacha20-poly1305@openssh.com,aes256-gcm@openssh.com',
    kexAlgorithmsLabel: 'KexAlgorithms',
    kexAlgorithmsHint: 'curve25519-sha256,ecdh-sha2-nistp521',
    extrasTitle: 'Regras adicionais',
    extrasHint: 'ExitOnForwardFailure yes\nGatewayPorts no',
    outTitle: 'Configuração gerada',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — confira antes de usar:',
    warningsNone: 'Nenhum aviso. Cole em ~/.ssh/config e ajuste as permissões para 600.',
    wHost: 'Host (alias) vazio.',
    wHostname: 'HostName vazio.',
    wUser: 'User vazio.',
    tipTitle: 'Dicas de uso',
    tipBody: (
      <>
        O arquivo <Text code>~/.ssh/config</Text> é lido pelo cliente OpenSSH. Mantenha as permissões
        restritas:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'chmod 600 ~/.ssh/config\nssh -G myserver'}</pre>
        Use <Text code>%h</Text> no HostName para construir nomes a partir do alias (ex.:{' '}
        <Text code>%h.internal.example.com</Text>). Combine com curingas no Host para regras de
        bastion.
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc: 'O builder monta o bloco Host linha a linha, incluindo apenas as diretivas preenchidas, e avisa sobre campos obrigatórios vazios.',
  },
  en: {
    title: 'SSH Config Generator',
    intro: (
      <>
        Builds <Text code>Host</Text> blocks for <Text code>~/.ssh/config</Text> with the most used
        directives: HostName, User, Port, IdentityFile, ProxyJump, LocalForward / RemoteForward
        tunnels, DynamicForward (SOCKS) and security options. All in the browser — no key or data
        leaves the machine.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'Pick a starting point and edit freely.',
    hostTitle: 'Connection',
    hostLabel: 'Host (alias)',
    hostHint: 'myserver, github.com, internal-*',
    hostnameLabel: 'HostName',
    hostnameHint: 'Real server IP or FQDN',
    userLabel: 'User',
    userHint: 'deploy, git, admin',
    portLabel: 'Port',
    identityFileLabel: 'IdentityFile',
    identityFileHint: '~/.ssh/id_ed25519',
    authTitle: 'Authentication',
    addKeysToAgentLabel: 'AddKeysToAgent yes',
    forwardAgentLabel: 'ForwardAgent yes',
    identitiesOnlyLabel: 'IdentitiesOnly yes',
    preferredAuthenticationsLabel: 'PreferredAuthentications',
    preferredAuthenticationsHint: 'publickey, password, keyboard-interactive',
    keepAliveTitle: 'Keep-alive',
    serverAliveIntervalLabel: 'ServerAliveInterval (s)',
    serverAliveCountMaxLabel: 'ServerAliveCountMax',
    securityTitle: 'Security',
    strictHostKeyCheckingLabel: 'StrictHostKeyChecking',
    strictOptions: [
      { label: 'default', value: '' },
      { label: 'yes', value: 'yes' },
      { label: 'no', value: 'no' },
      { label: 'accept-new', value: 'accept-new' },
      { label: 'ask', value: 'ask' },
    ],
    userKnownHostsFileLabel: 'UserKnownHostsFile',
    userKnownHostsFileHint: '~/.ssh/known_hosts_custom',
    forwardingTitle: 'Tunnels and proxy',
    proxyJumpLabel: 'ProxyJump',
    proxyJumpHint: 'bastion.example.com',
    localForwardLabel: 'LocalForward',
    localForwardHint: '8080:localhost:8080',
    remoteForwardLabel: 'RemoteForward',
    remoteForwardHint: '9090:localhost:3000',
    dynamicForwardLabel: 'DynamicForward (SOCKS)',
    dynamicForwardHint: '1080',
    logLevelLabel: 'LogLevel',
    logLevelOptions: [
      { label: 'default', value: '' },
      { label: 'QUIET', value: 'QUIET' },
      { label: 'FATAL', value: 'FATAL' },
      { label: 'ERROR', value: 'ERROR' },
      { label: 'INFO', value: 'INFO' },
      { label: 'VERBOSE', value: 'VERBOSE' },
      { label: 'DEBUG', value: 'DEBUG' },
    ],
    compressionLabel: 'Compression yes',
    algorithmsTitle: 'Algorithms (advanced)',
    macsLabel: 'MACs',
    macsHint: 'hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com',
    ciphersLabel: 'Ciphers',
    ciphersHint: 'chacha20-poly1305@openssh.com,aes256-gcm@openssh.com',
    kexAlgorithmsLabel: 'KexAlgorithms',
    kexAlgorithmsHint: 'curve25519-sha256,ecdh-sha2-nistp521',
    extrasTitle: 'Extra rules',
    extrasHint: 'ExitOnForwardFailure yes\nGatewayPorts no',
    outTitle: 'Generated config',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — review before using:',
    warningsNone: 'No warnings. Paste into ~/.ssh/config and set permissions to 600.',
    wHost: 'Host (alias) is empty.',
    wHostname: 'HostName is empty.',
    wUser: 'User is empty.',
    tipTitle: 'Usage tips',
    tipBody: (
      <>
        The <Text code>~/.ssh/config</Text> file is read by the OpenSSH client. Keep permissions
        restrictive:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'chmod 600 ~/.ssh/config\nssh -G myserver'}</pre>
        Use <Text code>%h</Text> in HostName to build names from the alias (e.g.{' '}
        <Text code>%h.internal.example.com</Text>). Combine with wildcards in Host for bastion rules.
      </>
    ),
    howTitle: 'How it works — source algorithm',
    howDesc: 'The builder assembles the Host block line by line, including only filled directives, and warns about empty required fields.',
  },
}

export default function SshConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('simple')
  const [fields, setFields] = useState(() => ({ ...DEFAULTS }))
  const [copied, setCopied] = useState(false)

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const applyPreset = (key) => {
    setPreset(key)
    setFields({ ...PRESETS[key] })
  }

  const result = useMemo(() => buildSshConfig(fields), [fields])
  const { text, warnings, lineCount, byteCount } = result
  const uniqueWarnings = useMemo(() => Array.from(new Set(warnings)), [warnings])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  const renderInput = (key, label, hint, width = 280) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text type="secondary">{label}</Text>
      <Input
        value={fields[key]}
        onChange={(e) => setField(key, e.target.value)}
        placeholder={hint}
        style={{ width, fontFamily: 'monospace', fontSize: 12 }}
        allowClear
      />
    </Space>
  )

  const renderNumber = (key, label, width = 120) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text type="secondary">{label}</Text>
      <Input
        type="number"
        min={0}
        value={fields[key]}
        onChange={(e) => setField(key, e.target.value === '' ? '' : Number(e.target.value))}
        style={{ width, fontFamily: 'monospace', fontSize: 12 }}
      />
    </Space>
  )

  const renderSwitch = (key, label) => (
    <Space wrap align="center">
      <Text type="secondary">{label}</Text>
      <Switch checked={fields[key]} onChange={(v) => setField(key, v)} />
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={preset}
          onChange={applyPreset}
          options={Object.keys(PRESETS).map((k) => ({ label: PRESETS[k].label[lang], value: k }))}
        />
      </Card>

      <Card title={t.hostTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="start">
            {renderInput('host', t.hostLabel, t.hostHint, 220)}
            {renderInput('hostname', t.hostnameLabel, t.hostnameHint, 260)}
            {renderInput('user', t.userLabel, t.userHint, 180)}
            {renderNumber('port', t.portLabel)}
          </Space>
          {renderInput('identityFile', t.identityFileLabel, t.identityFileHint, 360)}
        </Space>
      </Card>

      <Card title={t.authTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {renderSwitch('addKeysToAgent', t.addKeysToAgentLabel)}
          {renderSwitch('forwardAgent', t.forwardAgentLabel)}
          {renderSwitch('identitiesOnly', t.identitiesOnlyLabel)}
          {renderInput('preferredAuthentications', t.preferredAuthenticationsLabel, t.preferredAuthenticationsHint, 360)}
        </Space>
      </Card>

      <Card title={t.keepAliveTitle}>
        <Space wrap align="start">
          {renderNumber('serverAliveInterval', t.serverAliveIntervalLabel)}
          {renderNumber('serverAliveCountMax', t.serverAliveCountMaxLabel)}
        </Space>
      </Card>

      <Card title={t.securityTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.strictHostKeyCheckingLabel}</Text>
            <Segmented
              value={fields.strictHostKeyChecking}
              onChange={(v) => setField('strictHostKeyChecking', v)}
              options={t.strictOptions}
            />
          </Space>
          {renderInput('userKnownHostsFile', t.userKnownHostsFileLabel, t.userKnownHostsFileHint, 360)}
        </Space>
      </Card>

      <Card title={t.forwardingTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="start">
            {renderInput('proxyJump', t.proxyJumpLabel, t.proxyJumpHint, 260)}
            {renderInput('dynamicForward', t.dynamicForwardLabel, t.dynamicForwardHint, 140)}
          </Space>
          <Space wrap align="start">
            {renderInput('localForward', t.localForwardLabel, t.localForwardHint, 220)}
            {renderInput('remoteForward', t.remoteForwardLabel, t.remoteForwardHint, 220)}
          </Space>
          <Space wrap align="center">
            <Text type="secondary">{t.logLevelLabel}</Text>
            <Segmented
              value={fields.logLevel}
              onChange={(v) => setField('logLevel', v)}
              options={t.logLevelOptions}
            />
          </Space>
          {renderSwitch('compression', t.compressionLabel)}
        </Space>
      </Card>

      <Card title={t.algorithmsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {renderInput('macs', t.macsLabel, t.macsHint, 520)}
          {renderInput('ciphers', t.ciphersLabel, t.ciphersHint, 520)}
          {renderInput('kexAlgorithms', t.kexAlgorithmsLabel, t.kexAlgorithmsHint, 520)}
        </Space>
      </Card>

      <Card title={t.extrasTitle}>
        <TextArea
          value={fields.extras}
          onChange={(e) => setField('extras', e.target.value)}
          placeholder={t.extrasHint}
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 520 }}
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
                      · {w === 'host' ? t.wHost : w === 'hostname' ? t.wHostname : t.wUser}
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
              label: <Text code>sshConfigGenerator.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
