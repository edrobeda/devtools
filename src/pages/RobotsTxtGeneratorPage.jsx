import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, message } from 'antd'
import { SafetyOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const AI_CRAWLERS = ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'ClaudeBot', 'Google-Extended', 'Bytespider']

let nextId = 0
function makeGroup(overrides = {}) {
  return {
    id: nextId++,
    userAgent: '*',
    disallow: '',
    allow: '',
    crawlDelay: '',
    ...overrides,
  }
}

const translations = {
  pt: {
    title: 'Gerador de robots.txt',
    intro: (
      <>
        Monta um arquivo <Text code>robots.txt</Text> a partir de grupos de
        regras por user-agent, mais sitemap(s) opcionais — tudo local, sem
        chamada de rede. Cada grupo vira um bloco{' '}
        <Text code>User-agent</Text> com suas linhas <Text code>Disallow</Text>/
        <Text code>Allow</Text>.
      </>
    ),
    presets: 'Atalhos',
    presetBlockAll: 'Bloquear tudo',
    presetAllowAll: 'Permitir tudo',
    presetBlockAi: 'Bloquear crawlers de IA',
    groups: 'Grupos de regras',
    addGroup: 'Adicionar grupo',
    userAgent: 'User-agent',
    disallow: 'Disallow (um caminho por linha)',
    disallowPlaceholder: '/admin\n/private',
    allow: 'Allow (um caminho por linha)',
    allowPlaceholder: '/public',
    crawlDelay: 'Crawl-delay (segundos, opcional)',
    sitemaps: 'Sitemap(s) (uma URL por linha)',
    sitemapsPlaceholder: 'https://exemplo.com/sitemap.xml',
    output: 'robots.txt gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    minGroups: 'É preciso ter pelo menos 1 grupo.',
  },
  en: {
    title: 'robots.txt Generator',
    intro: (
      <>
        Builds a <Text code>robots.txt</Text> file from per-user-agent rule
        groups, plus optional sitemap(s) — all local, no network call. Each
        group becomes a <Text code>User-agent</Text> block with its own{' '}
        <Text code>Disallow</Text>/<Text code>Allow</Text> lines.
      </>
    ),
    presets: 'Shortcuts',
    presetBlockAll: 'Block everything',
    presetAllowAll: 'Allow everything',
    presetBlockAi: 'Block AI crawlers',
    groups: 'Rule groups',
    addGroup: 'Add group',
    userAgent: 'User-agent',
    disallow: 'Disallow (one path per line)',
    disallowPlaceholder: '/admin\n/private',
    allow: 'Allow (one path per line)',
    allowPlaceholder: '/public',
    crawlDelay: 'Crawl-delay (seconds, optional)',
    sitemaps: 'Sitemap(s) (one URL per line)',
    sitemapsPlaceholder: 'https://example.com/sitemap.xml',
    output: 'Generated robots.txt',
    copy: 'Copy',
    copied: 'Copied!',
    minGroups: 'You need at least 1 group.',
  },
}

export default function RobotsTxtGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [groups, setGroups] = useState([makeGroup()])
  const [sitemaps, setSitemaps] = useState('')

  function updateGroup(id, patch) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }

  function addGroup() {
    setGroups((prev) => [...prev, makeGroup({ userAgent: '' })])
  }

  function removeGroup(id) {
    if (groups.length <= 1) {
      message.warning(t.minGroups)
      return
    }
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }

  function applyBlockAll() {
    setGroups([makeGroup({ userAgent: '*', disallow: '/' })])
  }

  function applyAllowAll() {
    setGroups([makeGroup({ userAgent: '*', disallow: '' })])
  }

  function applyBlockAi() {
    setGroups(AI_CRAWLERS.map((ua) => makeGroup({ userAgent: ua, disallow: '/' })))
  }

  const output = useMemo(() => {
    const blocks = groups
      .filter((g) => g.userAgent.trim())
      .map((g) => {
        const lines = [`User-agent: ${g.userAgent.trim()}`]
        g.disallow.split('\n').map((l) => l.trim()).filter(Boolean).forEach((path) => {
          lines.push(`Disallow: ${path}`)
        })
        g.allow.split('\n').map((l) => l.trim()).filter(Boolean).forEach((path) => {
          lines.push(`Allow: ${path}`)
        })
        if (g.crawlDelay.trim()) lines.push(`Crawl-delay: ${g.crawlDelay.trim()}`)
        return lines.join('\n')
      })

    const sitemapLines = sitemaps.split('\n').map((l) => l.trim()).filter(Boolean).map((url) => `Sitemap: ${url}`)

    return [...blocks, ...(sitemapLines.length ? [sitemapLines.join('\n')] : [])].join('\n\n')
  }, [groups, sitemaps])

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presets}>
        <Space wrap>
          <Button onClick={applyBlockAll}>{t.presetBlockAll}</Button>
          <Button onClick={applyAllowAll}>{t.presetAllowAll}</Button>
          <Button onClick={applyBlockAi}>{t.presetBlockAi}</Button>
        </Space>
      </Card>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>{t.groups}</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={addGroup}>{t.addGroup}</Button>
        </Space>

        {groups.map((g) => (
          <Card
            key={g.id}
            size="small"
            extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeGroup(g.id)} />}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.userAgent}</Text>
                <Input value={g.userAgent} onChange={(e) => updateGroup(g.id, { userAgent: e.target.value })} />
              </div>
              <Space wrap style={{ width: '100%' }} size="middle">
                <div style={{ width: 260 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.disallow}</Text>
                  <TextArea
                    value={g.disallow}
                    onChange={(e) => updateGroup(g.id, { disallow: e.target.value })}
                    placeholder={t.disallowPlaceholder}
                    autoSize={{ minRows: 2, maxRows: 5 }}
                  />
                </div>
                <div style={{ width: 260 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.allow}</Text>
                  <TextArea
                    value={g.allow}
                    onChange={(e) => updateGroup(g.id, { allow: e.target.value })}
                    placeholder={t.allowPlaceholder}
                    autoSize={{ minRows: 2, maxRows: 5 }}
                  />
                </div>
                <div style={{ width: 200 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.crawlDelay}</Text>
                  <Input value={g.crawlDelay} onChange={(e) => updateGroup(g.id, { crawlDelay: e.target.value })} />
                </div>
              </Space>
            </Space>
          </Card>
        ))}
      </Space>

      <Card title={t.sitemaps}>
        <TextArea
          value={sitemaps}
          onChange={(e) => setSitemaps(e.target.value)}
          placeholder={t.sitemapsPlaceholder}
          autoSize={{ minRows: 2, maxRows: 5 }}
        />
      </Card>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <code>{output || ' '}</code>
        </pre>
      </Card>
    </Space>
  )
}
