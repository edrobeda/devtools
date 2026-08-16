import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { KeyOutlined, SearchOutlined, ReadOutlined, CopyOutlined, SafetyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  ITEMS,
} from '../utils/oauth2Cheatsheet'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de OAuth2 / OIDC',
    intro: (
      <>
        Referência rápida dos fluxos, endpoints, tokens e boas práticas de{' '}
        <Text code>OAuth 2.0</Text> e <Text code>OpenID Connect</Text>. Use junto
        com o <Text code>Gerador de PKCE / OAuth2</Text> e o{' '}
        <Text code>Cheat Sheet de Claims JWT</Text> do devtools.
      </>
    ),
    search: 'Buscar fluxo, endpoint, token, ataque...',
    all: 'Todas',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Lembrete de segurança',
    tipBody: (
      <>
        OAuth2 é um framework de <strong>delegação de autorização</strong>, não
        de autenticação. Use <Text code>Authorization Code + PKCE</Text> em
        SPAs/mobile, guarde segredos apenas em servidores e nunca confie em
        tokens sem validar assinatura, issuer e audience.
      </>
    ),
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar snippet',
    copiedCode: 'Snippet copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'OAuth2 / OIDC Cheat Sheet',
    intro: (
      <>
        Quick reference of <Text code>OAuth 2.0</Text> and{' '}
        <Text code>OpenID Connect</Text> flows, endpoints, tokens and best
        practices. Use it alongside the devtools{' '}
        <Text code>PKCE / OAuth2 Generator</Text> and{' '}
        <Text code>JWT Claims Cheat Sheet</Text>.
      </>
    ),
    search: 'Search flow, endpoint, token, attack...',
    all: 'All',
    empty: 'No item found. Try a different search or category.',
    tipTitle: 'Security reminder',
    tipBody: (
      <>
        OAuth2 is an <strong>authorization delegation</strong> framework, not an
        authentication mechanism. Use <Text code>Authorization Code + PKCE</Text>{' '}
        in SPAs/mobile, keep secrets on servers only, and never trust tokens
        without validating signature, issuer and audience.
      </>
    ),
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy snippet',
    copiedCode: 'Snippet copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function Oauth2CheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const catCounts = useMemo(() => {
    const counts = { all: ITEMS.length }
    for (const cat of CATEGORIES) {
      counts[cat] = ITEMS.filter((it) => it.cat === cat).length
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((it) => {
      if (category !== 'all' && it.cat !== category) return false
      if (!q) return true
      return (
        it.code.toLowerCase().includes(q) ||
        (it[lang] || '').toLowerCase().includes(q) ||
        CATEGORY_LABEL[it.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# OAuth2 / OIDC Cheat Sheet\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${CATEGORY_LABEL[it.cat][lang]}`,
          '',
          '```',
          it.code,
          '```',
          '',
          it[lang],
        ].join('\n')
      )
      .join('\n\n---\n\n')
    return header + body
  }, [filtered, lang])

  const copyCode = useCallback(
    async (code) => {
      try {
        await navigator.clipboard.writeText(code)
        messageApi.success(t.copiedCode)
      } catch {
        messageApi.error(t.copyError)
      }
    },
    [messageApi, t]
  )

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mdList)
      messageApi.success(t.copiedList)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [mdList, messageApi, t])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<SafetyOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({catCounts.all})</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>
              {CATEGORY_LABEL[cat][lang]} ({catCounts[cat]})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={`${item.cat}-${item.code.slice(0, 40)}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{CATEGORY_LABEL[item.cat][lang]}</Tag>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    title={t.copyCode}
                    onClick={() => copyCode(item.code)}
                  />
                </Space>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <code>{item.code}</code>
                </pre>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
