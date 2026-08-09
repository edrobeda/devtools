import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Alert, Collapse, Descriptions, Tag, Row, Col } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Núcleo IPv6 (RFC 4291) ────────────────────────────────────────────────
// O endereço é tratado como um array de 8 grupos de 16 bits. Toda a aritmética
// de 128 bits (máscara, rede, tamanho) usa BigInt. Parser tolerante a `::`,
// maiúsculas/minúsculas e IPv4 embutido nos 32 bits finais.

const FULL128 = (1n << 128n) - 1n

function parseIpv4(s) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s)
  if (!m) return null
  const p = m.slice(1, 5).map(Number)
  if (p.some((v) => v > 255)) return null
  return p
}

function parseHalf(part) {
  if (part === '') return { groups: [], ipv4: null }
  const chunks = part.split(':')
  let ipv4 = null
  const lastChunk = chunks[chunks.length - 1]
  if (lastChunk.includes('.')) {
    ipv4 = parseIpv4(lastChunk)
    if (!ipv4) return null
  }
  const groups = []
  const limit = chunks.length - (ipv4 ? 1 : 0)
  for (let i = 0; i < limit; i++) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(chunks[i])) return null
    groups.push(parseInt(chunks[i], 16))
  }
  if (ipv4) {
    groups.push((ipv4[0] << 8) | ipv4[1])
    groups.push((ipv4[2] << 8) | ipv4[3])
  }
  return { groups, ipv4 }
}

// "2001:db8:85a3::8a2e:370:7334/64" → { groups: [8], prefix: int|null, embeddedV4 }
function parseIpv6(input) {
  const s = (input || '').trim()
  if (!s || /\s/.test(s)) return null
  const slash = s.split('/')
  if (slash.length > 2) return null
  let prefix = null
  if (slash.length === 2) {
    if (!/^\d{1,3}$/.test(slash[1])) return null
    prefix = parseInt(slash[1], 10)
    if (prefix > 128) return null
  }
  const body = slash[0]
  if (!body) return null
  const dc = body.split('::')
  if (dc.length > 2) return null

  if (dc.length === 2) {
    const left = parseHalf(dc[0])
    const right = parseHalf(dc[1])
    if (left === null || right === null || left.ipv4) return null
    const zeros = 8 - left.groups.length - right.groups.length
    if (zeros < 1) return null
    return {
      groups: [...left.groups, ...Array(zeros).fill(0), ...right.groups],
      prefix,
      embeddedV4: right.ipv4,
    }
  }
  const g = parseHalf(body)
  if (g === null || g.groups.length !== 8) return null
  return { groups: g.groups, prefix, embeddedV4: g.ipv4 }
}

const hexGroup = (g) => g.toString(16).padStart(4, '0')

function expandedForm(groups) {
  return groups.map(hexGroup).join(':')
}

function longestZeroRun(groups) {
  let bestStart = -1
  let bestLen = 1
  let curStart = -1
  let curLen = 0
  groups.forEach((g, i) => {
    if (g === 0) {
      if (curLen === 0) curStart = i
      curLen++
      if (curLen > bestLen) {
        bestLen = curLen
        bestStart = curStart
      }
    } else {
      curLen = 0
    }
  })
  return bestLen >= 2 ? { start: bestStart, len: bestLen } : null
}

// RFC 5952: comprime a maior sequência de grupos zero (≥2) e omite os zeros
// à esquerda dos grupos — 0db8 → db8, 0007 → 7. Empate → usa a 1ª sequência.
function compressedForm(groups) {
  const run = longestZeroRun(groups)
  if (!run) return groups.map((g) => g.toString(16)).join(':')
  const left = groups.slice(0, run.start).map((g) => g.toString(16)).join(':')
  const right = groups.slice(run.start + run.len).map((g) => g.toString(16)).join(':')
  return [left, right].join('::')
}

function toBigInt(groups) {
  let n = 0n
  for (const g of groups) n = (n << 16n) | BigInt(g)
  return n
}

function groupsOf(n) {
  const g = []
  for (let i = 0; i < 8; i++) {
    g.unshift(Number(n & 0xffffn))
    n >>= 16n
  }
  return g
}

// Ordem importa: casos específicos (mapped, NAT64, doc range) antes dos
// mais genéricos (fc00::/7, fe80::/10, 2000::/3).
function classify(groups) {
  const a = groups[0]
  const b = groups[1]
  if (groups.every((g) => g === 0)) return { key: 'unspecified' }
  if (a === 0 && b === 0 && groups[2] === 0 && groups[3] === 0 &&
      groups[4] === 0 && groups[5] === 0 && groups[6] === 0 && groups[7] === 1)
    return { key: 'loopback' }
  if (a === 0 && b === 0 && groups[2] === 0 && groups[3] === 0 &&
      groups[4] === 0 && groups[5] === 0xffff)
    return { key: 'ipv4Mapped' }
  if (a === 0 && b === 0 && groups[2] === 0 && groups[3] === 0 &&
      groups[4] === 0 && groups[5] === 0 && (groups[6] !== 0 || groups[7] !== 0))
    return { key: 'ipv4Compatible' }
  if (a === 0x64 && b === 0xff9b && groups.slice(2, 6).every((g) => g === 0))
    return { key: 'nat64' }
  if (a === 0x2001 && b === 0x0db8) return { key: 'documentation' }
  if ((a & 0xff00) === 0xff00) return { key: 'multicast', scope: a & 0x000f }
  if ((a & 0xffc0) === 0xfe80) return { key: 'linkLocal' }
  if ((a & 0xffc0) === 0xfec0) return { key: 'siteLocal' }
  if ((a & 0xfe00) === 0xfc00) return { key: 'ula' }
  if (a === 0x2002) return { key: 'sixToFour' }
  if (a === 0x2001 && b === 0x0000) return { key: 'teredo' }
  if (a === 0x2001 && b === 0x0002) return { key: 'benchmark' }
  if ((a & 0xe000) === 0x2000) return { key: 'globalUnicast' }
  return { key: 'reserved' }
}

const TYPE_INFO = {
  unspecified: { label: { pt: 'Não especificado (::)', en: 'Unspecified (::)' }, color: 'default' },
  loopback: { label: { pt: 'Loopback (::1)', en: 'Loopback (::1)' }, color: 'gold' },
  ipv4Compatible: { label: { pt: 'IPv4-compatível (obsoleto)', en: 'IPv4-compatible (deprecated)' }, color: 'volcano' },
  ipv4Mapped: { label: { pt: 'IPv4-mapeado (::ffff:0:0/96)', en: 'IPv4-mapped (::ffff:0:0/96)' }, color: 'geekblue' },
  nat64: { label: { pt: 'Prefixo NAT64 (64:ff9b::/96)', en: 'NAT64 prefix (64:ff9b::/96)' }, color: 'cyan' },
  documentation: { label: { pt: 'Documentação (2001:db8::/32)', en: 'Documentation (2001:db8::/32)' }, color: 'purple' },
  multicast: { label: { pt: 'Multicast (ff00::/8)', en: 'Multicast (ff00::/8)' }, color: 'magenta' },
  linkLocal: { label: { pt: 'Link-Local (fe80::/10)', en: 'Link-Local (fe80::/10)' }, color: 'orange' },
  siteLocal: { label: { pt: 'Site-Local (fec0::/10, obsoleto)', en: 'Site-Local (fec0::/10, deprecated)' }, color: 'orange' },
  ula: { label: { pt: 'ULA — privado (fc00::/7)', en: 'ULA — private (fc00::/7)' }, color: 'green' },
  sixToFour: { label: { pt: '6to4 (2002::/16)', en: '6to4 (2002::/16)' }, color: 'geekblue' },
  teredo: { label: { pt: 'Teredo (2001:0000::/32)', en: 'Teredo (2001:0000::/32)' }, color: 'cyan' },
  benchmark: { label: { pt: 'Benchmarking (2001:2::/48)', en: 'Benchmarking (2001:2::/48)' }, color: 'volcano' },
  globalUnicast: { label: { pt: 'Unicast Global (2000::/3)', en: 'Global Unicast (2000::/3)' }, color: 'blue' },
  reserved: { label: { pt: 'Reservado / indefinido', en: 'Reserved / undefined' }, color: 'default' },
}

function v4Tail(groups) {
  return `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`
}

function scopeLabel(scope, lang) {
  const map = {
    pt: {
      1: 'interface-local', 2: 'link-local', 3: 'realm-local', 4: 'admin-local',
      5: 'site-local', 7: 'org-local', 8: 'org-local', 14: 'global-local',
    },
    en: {
      1: 'interface-local', 2: 'link-local', 3: 'realm-local', 4: 'admin-local',
      5: 'site-local', 7: 'org-local', 8: 'org-local', 14: 'global-local',
    },
  }
  return map[lang][scope] || `0x${scope.toString(16)}`
}

function bigWithCommas(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const EXAMPLES = [
  '2001:db8:85a3::8a2e:370:7334/64',
  '::1',
  '::',
  'fe80::a1b2:3c4d:5e6f:1a9c/48',
  'fc00::153/44',
  'ff02::1',
  '::ffff:192.168.1.1',
  '64:ff9b::7f00:1',
  '2002:cb00:7100::1/48',
  '2001:4860:4860::8888',
  '2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff/32',
]

const translations = {
  pt: {
    title: 'Explorador IPv6',
    intro: (
      <>
        Cola um endereço IPv6 (com ou sem prefixo CIDR) e a página mostra as
        formas expandida e comprimida (RFC 5952), os 128 bits com o trecho de
        rede e o de <em>host</em> separados, o tipo do endereço (unicast
        global, ULA, link-local, multicast, mapeado em IPv4, loopback...) e,
        se houver prefixo, a rede e o último endereço do bloco. 100%
        client-side com <Text code>BigInt</Text> pros 128 bits.
      </>
    ),
    inputLabel: 'Endereço (com ou sem /prefixo)',
    placeholder: '2001:db8:85a3::8a2e:370:7334/64',
    examples: 'Exemplos de um clique',
    error:
      'Endereço inválido — digite um IPv6 válido com /prefixo opcional (0 a 128). IPv4 só vale embutido nos 32 bits finais (ex: ::ffff:192.168.1.1).',
    summary: 'Visão geral',
    addressType: 'Tipo de endereço',
    scope: 'Escopo',
    embedded: 'IPv4 embutido',
    prefix: 'Prefixo',
    noPrefix: 'Sem prefixo — veja apenas o endereço; adicione /N pra calcular a rede.',
    forms: 'Formas canônicas',
    expanded: 'Expandido (minúsculas)',
    expandedUpper: 'Expandido (MAIÚSCULAS)',
    compressed: 'Comprimido (RFC 5952)',
    bits: 'Layout dos 128 bits',
    networkBits: 'rede',
    hostBits: 'host',
    subnet: 'Sub-rede (CIDR)',
    netAddr: 'Endereço de rede',
    lastAddr: 'Último endereço',
    size: 'Tamanho do bloco',
    sizePower: 'Tamanho (potência)',
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'O núcleo é o parser parseIpv6 (aceita ::, maiúsculas e IPv4 embutido na cauda), o classificador classify e o RFC 5952 compressedForm; a sub-rede é BigInt puro: rede = ip & máscara, bloco = 2^(128-prefixo).',
    tipTitle: 'O que você precisa saber de IPv6',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>8 grupos de 16 bits</Text> separados por dois-pontos:{' '}
          <Text code>2001:0db8:85a3:0000:0000:7334</Text> — cada grupo vai de 0000 a ffff.
        </li>
        <li>
          <Text strong>::</Text> comprime a maior sequência de zeros (uma única vez):{' '}
          <Text code>::1</Text> é loopback, <Text code>::</Text> é o não especificado.
        </li>
        <li>
          <Text strong>IPv6 não tem máscara</Text>: sempre o prefixo /N — e o que
          compara no roteamento são os bits da esquerda.
        </li>
        <li>
          <Text strong>2000::/3</Text> é o unicast global; <Text code>2001:db8::/32</Text>{' '}
          é reservado pra exemplo/documentação (não roteia).
        </li>
        <li>
          <Text strong>fc00::/7 (ULA)</Text> é o endereço "privado" de casa — não
          roteável na internet; <Text code>fe80::/10</Text> (link-local) se
          auto-configura na interface sem DHCP.
        </li>
        <li>
          <Text strong>IPv4 cabe na cauda</Text>: os últimos 32 bits podem guardar
          um endereço IPv4 — por isso túneis mostram <Text code>::ffff:c0a8:0101</Text>.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'IPv6 Explorer',
    intro: (
      <>
        Paste an IPv6 address (with or without a CIDR prefix) and see it laid
        bare: the expanded and RFC 5952 compressed forms, the 128 bits with the
        network and host parts split apart, the address type (global unicast,
        ULA, link-local, multicast, IPv4-mapped, loopback...) and, when a
        prefix is given, the network and last address of the block. 100%
        client-side <Text code>BigInt</Text> math for the full 128 bits.
      </>
    ),
    inputLabel: 'Address (with or without /prefix)',
    placeholder: '2001:db8:85a3::8a2e:370:7334/64',
    examples: 'One-click examples',
    error: 'Invalid address — enter a valid IPv6 with an optional /prefix (0–128). IPv4 is only allowed in the final 32 bits (e.g. ::ffff:192.168.1.1).',
    summary: 'Overview',
    addressType: 'Address type',
    scope: 'Scope',
    prefix: 'Prefix',
    noPrefix: 'No prefix — just inspecting the address; add /N to compute the network.',
    forms: 'Canonical forms',
    expanded: 'Expanded (lowercase)',
    expandedUpper: 'Expanded (UPPERCASE)',
    compressed: 'Compressed (RFC 5952)',
    bits: '128-bit layout',
    networkBits: 'network',
    hostBits: 'host',
    subnet: 'Subnet (CIDR)',
    netAddr: 'Network address',
    lastAddr: 'Last address',
    size: 'Block size',
    sizePower: 'Size (as power)',
    sourceTitle: 'Source algorithm',
    sourceBody:
      'The core is the parseIpv6 parser (handles ::, upper/lowercase and IPv4 in the tail), the classify helper and the RFC 5952 compressedForm encoder; the subnet math is plain BigInt: network = ip & mask, size = 2^(128-prefix).',
    tipTitle: 'IPv6 essentials',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>8×16-bit groups</Text> separated by colons:{' '}
          <Text code>2001:0db8:85a3:0000:0000:7334</Text> — each group spans 0000–ffff.
        </li>
        <li>
          <Text strong>::</Text> compresses the longest all-zero run (once):{' '}
          <Text code>::1</Text> is loopback, <Text code>::</Text> is unspecified.
        </li>
        <li>
          <Text strong>No "subnet mask" in IPv6</Text> — always a /N prefix; routing
          compares the left-most bits.
        </li>
        <li>
          <Text strong>2000::/3</Text> is global unicast; <Text code>2001:db8::/32</Text>{' '}
          is reserved for documentation only.
        </li>
        <li>
          <Text strong>fc00::/7 (ULA)</Text> is the "private" block — not routable on
          the internet; <Text code>fe80::/10</Text> (link-local) auto-configures on a
          link without DHCP.
        </li>
        <li>
          <Text strong>IPv4 fits in the tail</Text>: the last 32 bits can hold an IPv4 —
          that&apos;s why tunnels show <Text code>::ffff:c0a8:0101</Text>.
        </li>
      </ul>
    ),
  },
}

export default function Ipv6ExplorerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('2001:db8:85a3::8a2e:370:7334/64')

  const parsed = useMemo(() => {
    const v = input.trim()
    if (!v) return null
    try {
      const r = parseIpv6(v)
      return r ? { ok: true, ...r } : { ok: false }
    } catch {
      return { ok: false }
    }
  }, [input])

  const detail = useMemo(() => {
    if (!parsed || !parsed.ok) return null
    const { groups, prefix } = parsed
    const cls = classify(groups)
    const info = TYPE_INFO[cls.key] || TYPE_INFO.reserved
    const int = toBigInt(groups)
    let subnet = null
    if (prefix !== null) {
      const mask = FULL128 ^ ((1n << BigInt(128 - prefix)) - 1n)
      const network = int & mask
      subnet = {
        prefix,
        network,
        last: network | (FULL128 ^ mask),
        size: 1n << BigInt(128 - prefix),
      }
    }
    return {
      groups,
      info,
      cls,
      subnet,
      expanded: expandedForm(groups),
      expandedUpper: expandedForm(groups).toUpperCase(),
      compressed: compressedForm(groups),
      embeddedV4: parsed.embeddedV4 ? v4Tail(groups) : null,
      int,
    }
  }, [parsed])

  const binLines = useMemo(() => {
    if (!detail) return []
    const p = detail.subnet ? detail.subnet.prefix : null
    return detail.groups.map((g, gi) => {
      const bits = g.toString(2).padStart(16, '0')
      if (p === null) return { bits, cut: null }
      const start = gi * 16
      const cut = Math.max(Math.min(p - start, 16), 0)
      return { bits, cut }
    })
  }, [detail])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.inputLabel}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          style={{ fontFamily: 'monospace' }}
        />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', margin: '12px 0 6px' }}>
          {t.examples}
        </Text>
        <Space size={[6, 6]} wrap>
          {EXAMPLES.map((ex) => (
            <Tag
              key={ex}
              color="blue"
              style={{ cursor: 'pointer', fontFamily: 'monospace' }}
              onClick={() => setInput(ex)}
            >
              {ex}
            </Tag>
          ))}
        </Space>
      </Card>

      {input.trim() && parsed && !parsed.ok && (
        <Alert type="error" showIcon message={t.error} />
      )}

      {detail && (
        <>
          <Card title={t.summary}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.addressType}>
                <Tag color={detail.info.color}>{detail.info.label[lang]}</Tag>
                {detail.cls.key === 'multicast' && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {t.scope}: {scopeLabel(detail.cls.scope, lang)}
                  </Text>
                )}
              </Descriptions.Item>
              {detail.embeddedV4 && (
                <Descriptions.Item label={t.embedded}>
                  <Text code>{detail.embeddedV4}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t.prefix}>
                {detail.subnet ? (
                  <Text code>/{detail.subnet.prefix}</Text>
                ) : (
                  <Text type="secondary">{t.noPrefix}</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t.forms}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.compressed}>
                <Text copyable code>{detail.compressed}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.expanded}>
                <Text code>{detail.expanded}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.expandedUpper}>
                <Text code>{detail.expandedUpper}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t.bits}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}>
              {binLines.map((line, gi) => (
                <Row key={gi} gutter={8} style={{ marginBottom: 2 }}>
                  <Col flex="none" style={{ width: 40 }}>
                    <Text type="secondary">{gi}</Text>
                  </Col>
                  <Col flex="auto">
                    {(() => {
                      const c = line.cut
                      if (c === null) {
                        return <Text>{line.bits}</Text>
                      }
                      return (
                        <>
                          <Text strong style={{ color: '#1677ff' }}>{line.bits.slice(0, c)}</Text>
                          <Text type="secondary">{line.bits.slice(c)}</Text>
                        </>
                      )
                    })()}
                  </Col>
                </Row>
              ))}
            </div>
            <Space style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ color: '#1677ff' }}>{t.networkBits}</Text>
              <Text type="secondary">{t.hostBits}</Text>
            </Space>
          </Card>

          {detail.subnet && (
            <Card title={t.subnet}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label={t.netAddr}>
                  <Text copyable code>{compressedForm(groupsOf(detail.subnet.network))}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.lastAddr}>
                  <Text code>{compressedForm(groupsOf(detail.subnet.last))}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.size}>
                  {bigWithCommas(detail.subnet.size)}
                </Descriptions.Item>
                <Descriptions.Item label={t.sizePower}>
                  <Text code>2^(128 - {detail.subnet.prefix})</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Collapse
            items={[
              {
                key: 'source',
                label: t.sourceTitle,
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                    <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 360 }}>
                      <code>{[
                        parseIpv6.toString(),
                        compressedForm.toString(),
                        classify.toString(),
                      ].join('\n\n')}</code>
                    </pre>
                  </Space>
                ),
              },
            ]}
          />
        </>
      )}
    </Space>
  )
}