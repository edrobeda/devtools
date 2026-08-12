import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, SelectOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  labelOf,
  ITEMS,
} from '../utils/cssSelectorsCheatsheet'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de Seletores CSS',
    intro: (
      <>
        Referência pesquisável dos seletores CSS — da sintaxe básica a
        pseudo-classes e pseudo-elementos. Use junto com o{' '}
        <Text code>Testador de Seletores CSS</Text> e a{' '}
        <Text code>Calculadora de Especificidade</Text> do devtools para ir além
        da teoria e testar suas regras na prática.
      </>
    ),
    search: 'Buscar seletor, conceito ou descrição...',
    all: 'Todas',
    empty: 'Nenhum seletor encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Como usar este catálogo',
    tipBody: (
      <>
        Seletores CSS são case-insensitive em HTML (exceto nomes de atributo).
        A especificidade dos seletores influencia qual regra vence quando há
        conflito: <Text code>id</Text> vale mais que <Text code>classe</Text>,
        que vale mais que <Text code>elemento</Text>. Pseudo-classes como{' '}
        <Text code>:is()</Text> e <Text code>:not()</Text> herdam a
        especificidade do argumento mais específico, enquanto{' '}
        <Text code>:where()</Text> tem especificidade zero.
      </>
    ),
    resultsOne: 'seletor encontrado',
    resultsMany: 'seletores encontrados',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar seletor',
    copiedCode: 'Seletor copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'CSS Selectors Cheat Sheet',
    intro: (
      <>
        A searchable reference of CSS selectors — from basic syntax to
        pseudo-classes and pseudo-elements. Use it alongside the devtools{' '}
        <Text code>CSS Selector Tester</Text> and{' '}
        <Text code>Specificity Calculator</Text> to go beyond theory and test
        your rules in practice.
      </>
    ),
    search: 'Search selector, concept or description...',
    all: 'All',
    empty: 'No selector found. Try a different search or category.',
    tipTitle: 'How to use this catalog',
    tipBody: (
      <>
        CSS selectors are case-insensitive in HTML (except attribute names).
        Selector specificity determines which rule wins when there is a
        conflict: <Text code>id</Text> beats <Text code>class</Text>, which
        beats <Text code>element</Text>. Pseudo-classes like{' '}
        <Text code>:is()</Text> and <Text code>:not()</Text> inherit the
        specificity of their most specific argument, while{' '}
        <Text code>:where()</Text> has zero specificity.
      </>
    ),
    resultsOne: 'selector found',
    resultsMany: 'selectors found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy selector',
    copiedCode: 'Selector copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function CssSelectorsCheatsheetPage() {
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
        labelOf[it.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# CSS Selectors (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```css',
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
      <Title level={2}><SelectOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<ReadOutlined />}
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
              {labelOf[cat][lang]} ({catCounts[cat]})
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
            <List.Item key={`${item.cat}-${item.code}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
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
