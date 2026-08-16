export const PRESETS = {
  simple: {
    label: { pt: 'Host simples', en: 'Simple host' },
    host: 'myserver',
    hostname: '203.0.113.10',
    user: 'deploy',
    port: 22,
    identityFile: '~/.ssh/id_ed25519',
    addKeysToAgent: false,
    forwardAgent: false,
    identitiesOnly: false,
    serverAliveInterval: 60,
    serverAliveCountMax: 3,
    strictHostKeyChecking: '',
    userKnownHostsFile: '',
    proxyJump: '',
    localForward: '',
    remoteForward: '',
    dynamicForward: '',
    logLevel: '',
    compression: false,
    preferredAuthentications: '',
    macs: '',
    ciphers: '',
    kexAlgorithms: '',
    extras: '',
  },
  github: {
    label: { pt: 'GitHub / Forge', en: 'GitHub / Forge' },
    host: 'github.com',
    hostname: 'github.com',
    user: 'git',
    port: 22,
    identityFile: '~/.ssh/id_ed25519_github',
    addKeysToAgent: true,
    forwardAgent: false,
    identitiesOnly: true,
    serverAliveInterval: 0,
    serverAliveCountMax: 0,
    strictHostKeyChecking: '',
    userKnownHostsFile: '',
    proxyJump: '',
    localForward: '',
    remoteForward: '',
    dynamicForward: '',
    logLevel: '',
    compression: false,
    preferredAuthentications: 'publickey',
    macs: '',
    ciphers: '',
    kexAlgorithms: '',
    extras: '',
  },
  bastion: {
    label: { pt: 'Bastion / Jump Host', en: 'Bastion / Jump Host' },
    host: 'internal-*',
    hostname: '%h.internal.example.com',
    user: 'admin',
    port: 22,
    identityFile: '~/.ssh/id_ed25519',
    addKeysToAgent: false,
    forwardAgent: false,
    identitiesOnly: false,
    serverAliveInterval: 60,
    serverAliveCountMax: 3,
    strictHostKeyChecking: 'accept-new',
    userKnownHostsFile: '~/.ssh/known_hosts_internal',
    proxyJump: 'bastion.example.com',
    localForward: '',
    remoteForward: '',
    dynamicForward: '',
    logLevel: '',
    compression: false,
    preferredAuthentications: '',
    macs: '',
    ciphers: '',
    kexAlgorithms: '',
    extras: '',
  },
  reverseTunnel: {
    label: { pt: 'Túnel reverso', en: 'Reverse tunnel' },
    host: 'tunnel',
    hostname: 'tunnel.example.com',
    user: 'tunnel',
    port: 22,
    identityFile: '~/.ssh/id_ed25519_tunnel',
    addKeysToAgent: false,
    forwardAgent: false,
    identitiesOnly: false,
    serverAliveInterval: 30,
    serverAliveCountMax: 3,
    strictHostKeyChecking: '',
    userKnownHostsFile: '',
    proxyJump: '',
    localForward: '8080:localhost:8080',
    remoteForward: '9090:localhost:3000',
    dynamicForward: '',
    logLevel: 'VERBOSE',
    compression: true,
    preferredAuthentications: '',
    macs: '',
    ciphers: '',
    kexAlgorithms: '',
    extras: 'ExitOnForwardFailure yes\nGatewayPorts no',
  },
  socks: {
    label: { pt: 'Proxy SOCKS dinâmico', en: 'Dynamic SOCKS proxy' },
    host: 'socks-proxy',
    hostname: 'vpn.example.com',
    user: 'vpn',
    port: 22,
    identityFile: '~/.ssh/id_ed25519',
    addKeysToAgent: false,
    forwardAgent: false,
    identitiesOnly: false,
    serverAliveInterval: 60,
    serverAliveCountMax: 3,
    strictHostKeyChecking: '',
    userKnownHostsFile: '',
    proxyJump: '',
    localForward: '',
    remoteForward: '',
    dynamicForward: '1080',
    logLevel: '',
    compression: true,
    preferredAuthentications: '',
    macs: '',
    ciphers: '',
    kexAlgorithms: '',
    extras: '',
  },
}

export const DEFAULTS = { ...PRESETS.simple }

function trim(s) {
  return String(s || '').trim()
}

function quoteIfNeeded(s) {
  const v = trim(s)
  if (!v) return v
  if (/\s/.test(v) && !/^".*"$/.test(v)) return `"${v}"`
  return v
}

export function buildSshConfig(o) {
  const lines = []
  const warnings = []
  const add = (s) => lines.push(s)

  const host = trim(o.host)
  const hostname = trim(o.hostname)
  const user = trim(o.user)
  const identityFile = trim(o.identityFile)

  if (!host) warnings.push('host')
  if (!hostname) warnings.push('hostname')
  if (!user) warnings.push('user')

  add(`Host ${host || '*'}`)
  if (hostname) add(`  HostName ${hostname}`)
  if (user) add(`  User ${user}`)

  const port = Number(o.port)
  if (port && port !== 22) {
    add(`  Port ${port}`)
  }

  if (identityFile) add(`  IdentityFile ${identityFile}`)
  if (o.addKeysToAgent) add('  AddKeysToAgent yes')
  if (o.forwardAgent) add('  ForwardAgent yes')
  if (o.identitiesOnly) add('  IdentitiesOnly yes')

  const serverAliveInterval = Number(o.serverAliveInterval)
  if (serverAliveInterval > 0) add(`  ServerAliveInterval ${serverAliveInterval}`)

  const serverAliveCountMax = Number(o.serverAliveCountMax)
  if (serverAliveCountMax > 0) add(`  ServerAliveCountMax ${serverAliveCountMax}`)

  const strictHostKeyChecking = trim(o.strictHostKeyChecking)
  if (strictHostKeyChecking) add(`  StrictHostKeyChecking ${strictHostKeyChecking}`)

  const userKnownHostsFile = trim(o.userKnownHostsFile)
  if (userKnownHostsFile) add(`  UserKnownHostsFile ${quoteIfNeeded(userKnownHostsFile)}`)

  const proxyJump = trim(o.proxyJump)
  if (proxyJump) add(`  ProxyJump ${proxyJump}`)

  const localForward = trim(o.localForward)
  if (localForward) add(`  LocalForward ${localForward}`)

  const remoteForward = trim(o.remoteForward)
  if (remoteForward) add(`  RemoteForward ${remoteForward}`)

  const dynamicForward = trim(o.dynamicForward)
  if (dynamicForward) add(`  DynamicForward ${dynamicForward}`)

  const logLevel = trim(o.logLevel)
  if (logLevel) add(`  LogLevel ${logLevel}`)

  if (o.compression) add('  Compression yes')

  const preferredAuthentications = trim(o.preferredAuthentications)
  if (preferredAuthentications) add(`  PreferredAuthentications ${preferredAuthentications}`)

  const macs = trim(o.macs)
  if (macs) add(`  MACs ${macs}`)

  const ciphers = trim(o.ciphers)
  if (ciphers) add(`  Ciphers ${ciphers}`)

  const kexAlgorithms = trim(o.kexAlgorithms)
  if (kexAlgorithms) add(`  KexAlgorithms ${kexAlgorithms}`)

  const extras = trim(o.extras)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  extras.forEach((s) => add(`  ${s}`))

  const text = lines.join('\n')
  return { text, warnings, lineCount: lines.length, byteCount: new TextEncoder().encode(text).length }
}
