import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, SafetyOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  labelOf,
  ITEMS,
} from '../utils/a11yCheatsheet'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de Acessibilidade Web (a11y)',
    intro: (
      <>
        Referência prática e pesquisável de acessibilidade web — landmarks,
        roles e estados ARIA, foco/teclado, formulários, mídia, contraste,
        semântica HTML e testes. Use junto com o{' '}
        <Text code>Checador de Contraste</Text> do devtools para validar a
        parte visual.
      </>
    ),
    search: 'Buscar snippet, conceito ou categoria...',
    all: 'Todas',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Acessibilidade primeiro',
    tipBody: (
      <>
        A primeira regra da ARIA é: se você pode usar um elemento HTML nativo,
        use. Roles e atributos ARIA são ferramentas de último recurço. Teste
        sempre com teclado e, quando possível, com um leitor de tela real.
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
    title: 'Web Accessibility Cheat Sheet (a11y)',
    intro: (
      <>
        A practical, searchable accessibility reference — landmarks, ARIA
        roles and states, focus/keyboard, forms, media, contrast, HTML
        semantics, and testing. Use it alongside the devtools{' '}
        <Text code>Contrast Checker</Text> to validate the visual side.
      </>
    ),
    search: 'Search snippet, concept or category...',
    all: 'All',
    empty: 'No item found. Try a different search or category.',
    tipTitle: 'Accessibility first',
    tipBody: (
      <>
        The first rule of ARIA is: if you can use a native HTML element, do it.
        Roles and ARIA attributes are tools of last resort. Always test with a
        keyboard and, whenever possible, with a real screen reader.
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

export default function A11yCheatsheetPage() {
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
    const header = '# Web Accessibility (a11y cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
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
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
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
            <List.Item key={`${item.cat}-${item.code.slice(0, 40)}`}>
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
