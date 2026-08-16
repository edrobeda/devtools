import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, BookOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL, ITEMS } from '../utils/designPatternsCheatsheet'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de Design Patterns',
    intro: (
      <>
        Referência rápida dos principais <Text code>Design Patterns</Text> —
        padrões criacionais, estruturais, comportamentais e arquiteturais — com
        snippets em JavaScript/TypeScript. Use para escolher o padrão certo,
        estudar ou explicar em code review.
      </>
    ),
    search: 'Buscar padrão, intenção ou categoria...',
    all: 'Todos',
    empty: 'Nenhum padrão encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Quando usar padrões',
    tipBody: (
      <>
        Padrões resolvem problemas recorrentes, não são bibliotecas. Comece com
        o código mais simples que funcione e introduza um padrão quando a
        complexidade justificar. Evite over-engineering — um pattern mal
        aplicado vira anti-pattern.
      </>
    ),
    resultsOne: 'padrão encontrado',
    resultsMany: 'padrões encontrados',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar código',
    copiedCode: 'Código copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Design Patterns Cheat Sheet',
    intro: (
      <>
        Quick reference of the main <Text code>Design Patterns</Text> —
        creational, structural, behavioral and architectural — with
        JavaScript/TypeScript snippets. Use it to pick the right pattern, study
        or explain during code reviews.
      </>
    ),
    search: 'Search pattern, intent or category...',
    all: 'All',
    empty: 'No pattern found. Try a different search or category.',
    tipTitle: 'When to use patterns',
    tipBody: (
      <>
        Patterns solve recurring problems; they are not libraries. Start with
        the simplest working code and introduce a pattern only when complexity
        justifies it. Avoid over-engineering — a poorly applied pattern becomes
        an anti-pattern.
      </>
    ),
    resultsOne: 'pattern found',
    resultsMany: 'patterns found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy code',
    copiedCode: 'Code copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function DesignPatternsCheatsheetPage() {
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
        it.name[lang].toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q) ||
        (it[lang] || '').toLowerCase().includes(q) ||
        CATEGORY_LABEL[it.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# Design Patterns Cheat Sheet\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${it.name[lang]} (${CATEGORY_LABEL[it.cat][lang]})`,
          '',
          '```js',
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
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<BookOutlined />}
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
            <List.Item key={`${item.cat}-${item.name.en}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Text strong>{item.name[lang]}</Text>
                    <Tag color={CATEGORY_COLOR[item.cat]}>{CATEGORY_LABEL[item.cat][lang]}</Tag>
                  </Space>
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
