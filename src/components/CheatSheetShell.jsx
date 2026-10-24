import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { CopyOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

function itemKey(item, keyMode) {
  if (keyMode === 'codePrefix') return `${item.cat}-${item.code.slice(0, 40)}`
  if (keyMode === 'name') return `${item.cat}-${item.name.en}`
  return `${item.cat}-${item.code}`
}

export default function CheatSheetShell({
  items,
  categories,
  categoryColors,
  categoryLabels,
  translations,
  titleIcon,
  alertIcon,
  alertType = 'warning',
  markdownHeader,
  markdownFence = '```',
  codeWrapped = false,
  codeColor = '#262626',
  keyMode = 'code',
  matchCategoryLabel = false,
  matchItemName = false,
  showItemName = false,
  copyMarkdownIcon = <CopyOutlined />,
}) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((value) => String(value).trim().toLowerCase(), [])

  const catCounts = useMemo(() => {
    const counts = { all: items.length }
    for (const cat of categories) {
      counts[cat] = items.filter((item) => item.cat === cat).length
    }
    return counts
  }, [items, categories])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return items.filter((item) => {
      if (category !== 'all' && item.cat !== category) return false
      if (!q) return true
      if (matchItemName && item.name[lang].toLowerCase().includes(q)) return true
      if (item.code.toLowerCase().includes(q)) return true
      if ((item[lang] || '').toLowerCase().includes(q)) return true
      if (matchCategoryLabel && categoryLabels[item.cat][lang].toLowerCase().includes(q)) return true
      return false
    })
  }, [items, category, categoryLabels, lang, matchCategoryLabel, matchItemName, normalized, query])

  const mdList = useMemo(() => {
    const body = filtered
      .map((item) => {
        const title = showItemName
          ? `### ${item.name[lang]} (${categoryLabels[item.cat][lang]})`
          : `### ${categoryLabels[item.cat][lang]}`
        return [title, '', markdownFence, item.code, '```', '', item[lang]].join('\n')
      })
      .join('\n\n---\n\n')
    return markdownHeader + body
  }, [categoryLabels, filtered, lang, markdownFence, markdownHeader, showItemName])

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
  const codeStyle = {
    margin: 0,
    padding: '8px 12px',
    background: '#f5f5f5',
    borderRadius: 6,
    fontSize: 12.5,
    lineHeight: 1.65,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    ...(codeColor === null ? {} : { color: codeColor }),
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}>{titleIcon} {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type={alertType}
        showIcon
        icon={alertIcon}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(event) => setCategory(event.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({catCounts.all})</Radio.Button>
          {categories.map((cat) => (
            <Radio.Button key={cat} value={cat}>
              {categoryLabels[cat][lang]} ({catCounts[cat]})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={copyMarkdownIcon} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={itemKey(item, keyMode)}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  {showItemName ? (
                    <Space>
                      <Text strong>{item.name[lang]}</Text>
                      <Tag color={categoryColors[item.cat]}>{categoryLabels[item.cat][lang]}</Tag>
                    </Space>
                  ) : (
                    <Tag color={categoryColors[item.cat]}>{categoryLabels[item.cat][lang]}</Tag>
                  )}
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    title={t.copyCode}
                    onClick={() => copyCode(item.code)}
                  />
                </Space>
                <pre style={codeStyle}>
                  {codeWrapped ? <code>{item.code}</code> : item.code}
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
