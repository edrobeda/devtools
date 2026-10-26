import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCopyText from '../hooks/useCopyText'

const { Title, Paragraph, Text } = Typography

const escapeCell = (value) => String(value ?? '').replace(/\|/g, '\\|')

export default function CommandCheatSheetShell({
  items,
  categories,
  categoryColors,
  categoryLabels,
  translations,
  titleIcon,
  alertIcon = titleIcon,
  alertType = 'info',
  alertTitleKey = 'tipTitle',
  alertBodyKey = 'tipBody',
  markdownHeader = '| Command | Category | Description |',
  codeWrap = false,
  extraAlert = null,
}) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return items.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q) ||
        categoryLabels[c.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [category, categoryLabels, items, lang, normalized, query])

  const mdTable = useMemo(() => {
    const head = `${markdownHeader}\n|---|---|---|\n`
    const rows = filtered.map((c) =>
      `| \`${escapeCell(c.cmd).replace(/\n/g, '\\n')}\` | ${categoryLabels[c.cat][lang]} | ${escapeCell(c[lang] || '')} |`
    )
    return head + rows.join('\n')
  }, [categoryLabels, filtered, lang, markdownHeader])

  const copyText = useCopyText(t, messageApi)

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  const codeStyle = codeWrap ? { fontSize: 13, whiteSpace: 'pre-wrap' } : { fontSize: 13 }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}>{titleIcon} {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type={alertType} showIcon icon={alertIcon} message={t[alertTitleKey]} description={t[alertBodyKey]} />
      {extraAlert && (
        <Alert
          type={extraAlert.type}
          showIcon
          message={t[extraAlert.messageKey]}
          description={t[extraAlert.descriptionKey]}
        />
      )}

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {categories.map((cat) => (
            <Radio.Button key={cat} value={cat}>{categoryLabels[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={codeStyle}>{item.cmd}</Text>
                  <Tag color={categoryColors[item.cat]}>{categoryLabels[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Collapse items={[
        {
          key: 'source',
          label: t.source,
          children: (
            <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
              <code>{JSON.stringify(items, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}
