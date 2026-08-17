// Gerador de registros DNS — 100% client-side.
// Monta registros tipo A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, PTR, SOA,
// SPF, DKIM e DMARC e gera saídas em formato BIND (zone file), comandos dig,
// Terraform aws_route53_record e cloudflare_record.

export const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR', 'SOA', 'SPF', 'DKIM', 'DMARC']

const FIELD_META = {
  name: {
    key: 'name',
    label: { pt: 'Nome / Host', en: 'Name / Host' },
    type: 'text',
    placeholder: { pt: 'www (use @ para o apex)', en: 'www (use @ for apex)' },
    default: 'www',
  },
  ip: {
    key: 'ip',
    label: { pt: 'Endereço IPv4', en: 'IPv4 address' },
    type: 'text',
    placeholder: '192.0.2.1',
    default: '192.0.2.1',
  },
  ipv6: {
    key: 'ipv6',
    label: { pt: 'Endereço IPv6', en: 'IPv6 address' },
    type: 'text',
    placeholder: '2001:db8::1',
    default: '2001:db8::1',
  },
  target: {
    key: 'target',
    label: { pt: 'Destino', en: 'Target' },
    type: 'text',
    placeholder: { pt: 'exemplo.com. (ponto final = FQDN)', en: 'example.com. (trailing dot = FQDN)' },
    default: 'example.com.',
  },
  priority: {
    key: 'priority',
    label: { pt: 'Prioridade', en: 'Priority' },
    type: 'number',
    placeholder: '10',
    default: 10,
    min: 0,
    max: 65535,
  },
  weight: {
    key: 'weight',
    label: { pt: 'Peso (SRV)', en: 'Weight (SRV)' },
    type: 'number',
    placeholder: '0',
    default: 0,
    min: 0,
    max: 65535,
  },
  port: {
    key: 'port',
    label: { pt: 'Porta (SRV)', en: 'Port (SRV)' },
    type: 'number',
    placeholder: '443',
    default: 443,
    min: 1,
    max: 65535,
  },
  text: {
    key: 'text',
    label: { pt: 'Valor do TXT', en: 'TXT value' },
    type: 'textarea',
    placeholder: 'v=spf1 include:_spf.google.com ~all',
    default: '',
  },
  flag: {
    key: 'flag',
    label: { pt: 'Flag (CAA)', en: 'Flag (CAA)' },
    type: 'number',
    placeholder: '0',
    default: 0,
    min: 0,
    max: 255,
  },
  tag: {
    key: 'tag',
    label: { pt: 'Tag (CAA)', en: 'Tag (CAA)' },
    type: 'select',
    options: ['issue', 'issuewild', 'iodef'],
    default: 'issue',
  },
  value: {
    key: 'value',
    label: { pt: 'Valor (CAA / genérico)', en: 'Value (CAA / generic)' },
    type: 'text',
    placeholder: { pt: 'letsencrypt.org', en: 'letsencrypt.org' },
    default: 'letsencrypt.org',
  },
  ptrName: {
    key: 'ptrName',
    label: { pt: 'Nome reverso', en: 'Reverse name' },
    type: 'text',
    placeholder: '1.2.0.192.in-addr.arpa.',
    default: '1.2.0.192.in-addr.arpa.',
  },
  primaryNs: {
    key: 'primaryNs',
    label: { pt: 'Nameserver primário', en: 'Primary nameserver' },
    type: 'text',
    placeholder: 'ns1.example.com.',
    default: 'ns1.example.com.',
  },
  adminEmail: {
    key: 'adminEmail',
    label: { pt: 'E-mail do administrador', en: 'Admin email' },
    type: 'text',
    placeholder: 'hostmaster.example.com.',
    default: 'hostmaster.example.com.',
  },
  serial: {
    key: 'serial',
    label: { pt: 'Serial (YYYYMMDDNN)', en: 'Serial (YYYYMMDDNN)' },
    type: 'number',
    placeholder: '2026081701',
    default: 2026081701,
    min: 0,
  },
  refresh: {
    key: 'refresh',
    label: { pt: 'Refresh (segundos)', en: 'Refresh (seconds)' },
    type: 'number',
    placeholder: '3600',
    default: 3600,
    min: 0,
  },
  retry: {
    key: 'retry',
    label: { pt: 'Retry (segundos)', en: 'Retry (seconds)' },
    type: 'number',
    placeholder: '600',
    default: 600,
    min: 0,
  },
  expire: {
    key: 'expire',
    label: { pt: 'Expire (segundos)', en: 'Expire (seconds)' },
    type: 'number',
    placeholder: '604800',
    default: 604800,
    min: 0,
  },
  minimum: {
    key: 'minimum',
    label: { pt: 'Minimum TTL (segundos)', en: 'Minimum TTL (seconds)' },
    type: 'number',
    placeholder: '86400',
    default: 86400,
    min: 0,
  },
  selector: {
    key: 'selector',
    label: { pt: 'Seletor DKIM', en: 'DKIM selector' },
    type: 'text',
    placeholder: 'default',
    default: 'default',
  },
  publicKey: {
    key: 'publicKey',
    label: { pt: 'Chave pública (base64)', en: 'Public key (base64)' },
    type: 'textarea',
    placeholder: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
    default: '',
  },
  policy: {
    key: 'policy',
    label: { pt: 'Política', en: 'Policy' },
    type: 'select',
    options: ['none', 'quarantine', 'reject'],
    default: 'none',
  },
  pct: {
    key: 'pct',
    label: { pt: 'Porcentagem (%)', en: 'Percentage (%)' },
    type: 'number',
    placeholder: '100',
    default: 100,
    min: 0,
    max: 100,
  },
  rua: {
    key: 'rua',
    label: { pt: 'URI de relatórios agregados (rua)', en: 'Aggregate report URI (rua)' },
    type: 'text',
    placeholder: 'mailto:dmarc@example.com',
    default: '',
  },
  ruf: {
    key: 'ruf',
    label: { pt: 'URI de relatórios forenses (ruf)', en: 'Forensic report URI (ruf)' },
    type: 'text',
    placeholder: 'mailto:dmarc@example.com',
    default: '',
  },
  ttl: {
    key: 'ttl',
    label: { pt: 'TTL (segundos)', en: 'TTL (seconds)' },
    type: 'number',
    placeholder: '300',
    default: 300,
    min: 0,
  },
}

const TYPE_FIELDS = {
  A: ['name', 'ip', 'ttl'],
  AAAA: ['name', 'ipv6', 'ttl'],
  CNAME: ['name', 'target', 'ttl'],
  MX: ['name', 'priority', 'target', 'ttl'],
  TXT: ['name', 'text', 'ttl'],
  NS: ['name', 'target', 'ttl'],
  SRV: ['name', 'priority', 'weight', 'port', 'target', 'ttl'],
  CAA: ['name', 'flag', 'tag', 'value', 'ttl'],
  PTR: ['ptrName', 'target', 'ttl'],
  SOA: ['name', 'primaryNs', 'adminEmail', 'serial', 'refresh', 'retry', 'expire', 'minimum', 'ttl'],
  SPF: ['name', 'text', 'ttl'],
  DKIM: ['selector', 'name', 'publicKey', 'ttl'],
  DMARC: ['name', 'policy', 'pct', 'rua', 'ruf', 'ttl'],
}

function isIPv4(value) {
  if (!value || typeof value !== 'string') return false
  const parts = value.split('.')
  if (parts.length !== 4) return false
  return parts.every((p) => {
    const n = parseInt(p, 10)
    return p === String(n) && n >= 0 && n <= 255
  })
}

function isIPv6(value) {
  if (!value || typeof value !== 'string') return false
  if (!value.includes(':')) return false
  // Rejeita endereços vazios e aceita compactação :: uma única vez
  const segments = value.split(':')
  const empty = segments.filter((s) => s === '').length
  if (empty > 2) return false
  if (empty === 0 && segments.length !== 8) return false
  if (empty > 0 && segments.length > 8) return false
  return segments.every((s) => s === '' || /^[0-9a-fA-F]{1,4}$/.test(s))
}

function isHostnameLike(value) {
  if (!value || typeof value !== 'string') return false
  if (value === '@') return true
  return /^[a-zA-Z0-9_]([a-zA-Z0-9_-]*[a-zA-Z0-9_])?(\.[a-zA-Z0-9_]([a-zA-Z0-9_-]*[a-zA-Z0-9_])?)*\.?$/.test(value)
}

function isDomain(value) {
  if (!value || typeof value !== 'string') return false
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+\.?$/.test(value)
}

function isFqdn(value) {
  return typeof value === 'string' && value.endsWith('.')
}

function quoteTxt(value) {
  if (!value) return '""'
  // Quebra valores TXT maiores que 255 caracteres em strings de 255.
  const chunks = value.match(/.{1,255}/g) || []
  return chunks.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(' ')
}

export function fieldsForType(type) {
  const keys = TYPE_FIELDS[type] || []
  return keys.map((k) => FIELD_META[k])
}

export function defaultValuesForType(type) {
  const result = {}
  for (const f of fieldsForType(type)) {
    result[f.key] = f.default
  }
  return result
}

export function createRecord(type, values) {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, type, values: { ...values } }
}

function formatName(name, origin) {
  if (!name || name === '@') return origin || '@'
  return name
}

export function buildRecordData(record) {
  const { type, values } = record
  switch (type) {
    case 'A':
      return values.ip
    case 'AAAA':
      return values.ipv6
    case 'CNAME':
    case 'NS':
    case 'PTR':
      return values.target
    case 'MX':
      return `${values.priority} ${values.target}`
    case 'TXT':
    case 'SPF':
      return quoteTxt(values.text)
    case 'SRV':
      return `${values.priority} ${values.weight} ${values.port} ${values.target}`
    case 'CAA':
      return `${values.flag} ${values.tag} "${values.value}"`
    case 'SOA':
      return `${values.primaryNs} ${values.adminEmail} ${values.serial} ${values.refresh} ${values.retry} ${values.expire} ${values.minimum}`
    case 'DKIM':
      return `"v=DKIM1; k=rsa; p=${(values.publicKey || '').replace(/"/g, '\\"')}"`
    case 'DMARC': {
      const parts = [`v=DMARC1`, `p=${values.policy}`, `pct=${values.pct}`]
      if (values.rua) parts.push(`rua=${values.rua}`)
      if (values.ruf) parts.push(`ruf=${values.ruf}`)
      return `"${parts.join('; ')}"`
    }
    default:
      return ''
  }
}

function recordNameForDisplay(record, origin) {
  const { type, values } = record
  if (type === 'PTR') return values.ptrName || '@'
  if (type === 'DKIM') {
    const name = values.name || '@'
    const base = name === '@' ? (origin || '@') : name
    return `${values.selector}._domainkey.${base}`
  }
  return values.name || '@'
}

export function generateZoneFile(records, { origin = 'example.com.', defaultTtl = 300 } = {}) {
  const lines = []
  lines.push(`$ORIGIN ${origin}`)
  lines.push(`$TTL ${defaultTtl}`)
  lines.push('')
  for (const record of records) {
    const ttl = Number(record.values.ttl) || defaultTtl
    const name = recordNameForDisplay(record, origin)
    const data = buildRecordData(record)
    if (!data) continue
    lines.push(`${name}\t${ttl}\tIN\t${record.type}\t${data}`)
  }
  return lines.join('\n')
}

export function generateDigCommands(records, { origin = 'example.com.' } = {}) {
  const commands = []
  for (const record of records) {
    const name = recordNameForDisplay(record, origin).replace(/\.$/, '')
    commands.push(`dig +short ${name} ${record.type}`)
  }
  return commands.join('\n')
}

export function generateRoute53Terraform(records, { zoneId = 'Z1234567890ABC' } = {}) {
  const lines = []
  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const name = recordNameForDisplay(record, '').replace(/@/g, '') || '.'
    const data = buildRecordData(record)
    if (!data) continue
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || `record_${i}`
    lines.push(`resource "aws_route53_record" "${safeName}_${i}" {`)
    lines.push(`  zone_id = "${zoneId}"`)
    lines.push(`  name    = "${name}"`)
    lines.push(`  type    = "${record.type}"`)
    lines.push(`  ttl     = ${Number(record.values.ttl) || 300}`)
    lines.push(`  records = [${record.type === 'SOA' || record.type === 'SRV' || record.type === 'MX' || record.type === 'CAA' || record.type === 'TXT' || record.type === 'SPF' || record.type === 'DKIM' || record.type === 'DMARC' ? `"${data.replace(/"/g, '\\"')}"` : `"${data}"`}]`)
    lines.push('}')
    lines.push('')
  }
  return lines.join('\n')
}

export function generateCloudflareTerraform(records, { zoneId = 'your-zone-id' } = {}) {
  const lines = []
  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const rawName = recordNameForDisplay(record, '').replace(/@/g, '')
    const name = rawName === '' || rawName === '.' ? '@' : rawName
    const data = buildRecordData(record)
    if (!data) continue
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || `record_${i}`
    lines.push(`resource "cloudflare_record" "${safeName}_${i}" {`)
    lines.push(`  zone_id = "${zoneId}"`)
    lines.push(`  name    = "${name}"`)
    lines.push(`  type    = "${record.type}"`)
    lines.push(`  value   = "${data.replace(/"/g, '\\"')}"`)
    if (record.type === 'SRV' || record.type === 'MX') {
      lines.push(`  ttl     = ${Number(record.values.ttl) || 300}`)
    } else {
      lines.push(`  ttl     = ${Number(record.values.ttl) || 1}`)
    }
    lines.push('}')
    lines.push('')
  }
  return lines.join('\n')
}

export function validateRecord(record) {
  const errors = []
  const { type, values } = record
  if (!RECORD_TYPES.includes(type)) {
    errors.push({ pt: `Tipo desconhecido: ${type}`, en: `Unknown type: ${type}` })
    return errors
  }

  if (type === 'A' && !isIPv4(values.ip)) {
    errors.push({ pt: 'Endereço IPv4 inválido.', en: 'Invalid IPv4 address.' })
  }
  if (type === 'AAAA' && !isIPv6(values.ipv6)) {
    errors.push({ pt: 'Endereço IPv6 inválido.', en: 'Invalid IPv6 address.' })
  }
  if (['CNAME', 'NS', 'MX', 'SRV'].includes(type) && !isHostnameLike(values.target) && !isDomain(values.target)) {
    errors.push({ pt: 'Destino inválido.', en: 'Invalid target.' })
  }
  if (['CNAME', 'NS', 'MX', 'SRV', 'PTR', 'SOA'].includes(type) && !isFqdn(values.target) && type !== 'PTR') {
    errors.push({ pt: 'Destinos para NS/MX/CNAME/SRV devem ser FQDNs (terminar com ponto).', en: 'Targets for NS/MX/CNAME/SRV should be FQDNs (end with a dot).' })
  }
  if (['MX', 'SRV'].includes(type) && (!Number.isFinite(Number(values.priority)) || Number(values.priority) < 0)) {
    errors.push({ pt: 'Prioridade deve ser um número não negativo.', en: 'Priority must be a non-negative number.' })
  }
  if (type === 'SRV' && (!Number.isFinite(Number(values.weight)) || Number(values.weight) < 0 || !Number.isFinite(Number(values.port)) || Number(values.port) < 1 || Number(values.port) > 65535)) {
    errors.push({ pt: 'Peso/Porta SRV inválidos.', en: 'Invalid SRV weight/port.' })
  }
  if (['TXT', 'SPF'].includes(type) && !values.text) {
    errors.push({ pt: 'Valor TXT vazio.', en: 'Empty TXT value.' })
  }
  if (type === 'CAA' && (!['issue', 'issuewild', 'iodef'].includes(values.tag) || !Number.isFinite(Number(values.flag)))) {
    errors.push({ pt: 'CAA tag/flag inválidos.', en: 'Invalid CAA tag/flag.' })
  }
  if (type === 'PTR' && !values.ptrName) {
    errors.push({ pt: 'Nome reverso PTR vazio.', en: 'Empty PTR reverse name.' })
  }
  if (type === 'SOA') {
    if (!isFqdn(values.primaryNs)) errors.push({ pt: 'Nameserver primário deve ser FQDN.', en: 'Primary NS must be a FQDN.' })
    if (!values.adminEmail) errors.push({ pt: 'E-mail do administrador vazio.', en: 'Empty admin email.' })
    if (!Number.isFinite(Number(values.serial)) || values.serial <= 0) errors.push({ pt: 'Serial inválido.', en: 'Invalid serial.' })
  }
  if (type === 'DKIM' && !values.publicKey) {
    errors.push({ pt: 'Chave pública DKIM vazia.', en: 'Empty DKIM public key.' })
  }
  if (type === 'DMARC' && !['none', 'quarantine', 'reject'].includes(values.policy)) {
    errors.push({ pt: 'Política DMARC inválida.', en: 'Invalid DMARC policy.' })
  }
  if (!Number.isFinite(Number(values.ttl)) || Number(values.ttl) < 0) {
    errors.push({ pt: 'TTL inválido.', en: 'Invalid TTL.' })
  }
  return errors
}

export function validateAll(records) {
  const warnings = []
  const names = new Map()

  for (const record of records) {
    const errors = validateRecord(record)
    if (errors.length) continue
    const displayName = recordNameForDisplay(record, '@')
    const existing = names.get(displayName) || []
    existing.push(record)
    names.set(displayName, existing)
  }

  for (const [displayName, list] of names.entries()) {
    const hasCname = list.some((r) => r.type === 'CNAME')
    const hasOther = list.some((r) => r.type !== 'CNAME')
    if (hasCname && hasOther) {
      warnings.push({
        pt: `O nome "${displayName}" tem um CNAME e outros registros — isso viola o RFC 1034.`,
        en: `Name "${displayName}" has a CNAME plus other records — this violates RFC 1034.`,
      })
    }
    if (hasCname && (displayName === '@' || displayName.endsWith('.'))) {
      // Aviso mais específico para apex
      warnings.push({
        pt: `CNAME no apex ("${displayName}") geralmente é inválido; considere um ALIAS/ANAME se seu provedor suportar.`,
        en: `CNAME at apex ("${displayName}") is usually invalid; consider an ALIAS/ANAME if your provider supports it.`,
      })
    }
  }

  return warnings
}

function presetBase(origin) {
  return origin.endsWith('.') ? origin : `${origin}.`
}

export const PRESETS = {
  website: {
    label: { pt: 'Site simples', en: 'Simple website' },
    origin: 'example.com.',
    defaultTtl: 300,
    records: [
      { type: 'A', values: { name: '@', ip: '192.0.2.10', ttl: 300 } },
      { type: 'A', values: { name: 'www', ip: '192.0.2.10', ttl: 300 } },
      { type: 'TXT', values: { name: '@', text: 'v=spf1 -all', ttl: 300 } },
    ],
  },
  googleWorkspace: {
    label: { pt: 'E-mail Google Workspace', en: 'Google Workspace email' },
    origin: 'example.com.',
    defaultTtl: 3600,
    records: [
      { type: 'MX', values: { name: '@', priority: 1, target: 'aspmx.l.google.com.', ttl: 3600 } },
      { type: 'MX', values: { name: '@', priority: 5, target: 'alt1.aspmx.l.google.com.', ttl: 3600 } },
      { type: 'MX', values: { name: '@', priority: 5, target: 'alt2.aspmx.l.google.com.', ttl: 3600 } },
      { type: 'MX', values: { name: '@', priority: 10, target: 'alt3.aspmx.l.google.com.', ttl: 3600 } },
      { type: 'MX', values: { name: '@', priority: 10, target: 'alt4.aspmx.l.google.com.', ttl: 3600 } },
      { type: 'TXT', values: { name: '@', text: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 } },
      { type: 'TXT', values: { name: '_dmarc', text: 'v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@example.com', ttl: 3600 } },
      { type: 'CNAME', values: { name: 'mail', target: 'ghs.googlehosted.com.', ttl: 3600 } },
    ],
  },
  microsoft365: {
    label: { pt: 'E-mail Microsoft 365', en: 'Microsoft 365 email' },
    origin: 'example.com.',
    defaultTtl: 3600,
    records: [
      { type: 'MX', values: { name: '@', priority: 0, target: 'example-com.mail.protection.outlook.com.', ttl: 3600 } },
      { type: 'TXT', values: { name: '@', text: 'v=spf1 include:spf.protection.outlook.com ~all', ttl: 3600 } },
      { type: 'CNAME', values: { name: 'autodiscover', target: 'autodiscover.outlook.com.', ttl: 3600 } },
      { type: 'CNAME', values: { name: 'sip', target: 'sipdir.online.lync.com.', ttl: 3600 } },
      { type: 'TXT', values: { name: '_dmarc', text: 'v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@example.com', ttl: 3600 } },
    ],
  },
  cdn: {
    label: { pt: 'Site com CDN', en: 'CDN website' },
    origin: 'example.com.',
    defaultTtl: 300,
    records: [
      { type: 'A', values: { name: '@', ip: '192.0.2.20', ttl: 300 } },
      { type: 'AAAA', values: { name: '@', ipv6: '2001:db8::20', ttl: 300 } },
      { type: 'CNAME', values: { name: 'www', target: 'cdn.example.net.', ttl: 300 } },
      { type: 'TXT', values: { name: '@', text: 'v=spf1 -all', ttl: 300 } },
      { type: 'CAA', values: { name: '@', flag: 0, tag: 'issue', value: 'letsencrypt.org', ttl: 300 } },
    ],
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    origin: 'example.com.',
    defaultTtl: 300,
    records: [{ type: 'A', values: { name: '@', ip: '192.0.2.1', ttl: 300 } }],
  },
}

export function applyPreset(preset, origin) {
  const base = presetBase(origin)
  const records = preset.records.map((r) =>
    createRecord(r.type, { ...r.values, ttl: Number(r.values.ttl) || preset.defaultTtl })
  )
  return { origin: base, defaultTtl: preset.defaultTtl, records }
}

export function generateMarkdownSummary(records, { origin = 'example.com.', defaultTtl = 300 } = {}, lang = 'pt') {
  const t = {
    pt: {
      records: 'Registros',
      zone: 'Zona BIND',
      dig: 'Comandos dig',
    },
    en: {
      records: 'Records',
      zone: 'BIND zone',
      dig: 'dig commands',
    },
  }[lang]

  return [
    `## ${t.records}`,
    records.map((r) => `- ${r.type}: ${recordNameForDisplay(r, origin)}`).join('\n'),
    `\n## ${t.zone}`,
    '```',
    generateZoneFile(records, { origin, defaultTtl }),
    '```',
    `\n## ${t.dig}`,
    '```bash',
    generateDigCommands(records, { origin }),
    '```',
  ].join('\n')
}
