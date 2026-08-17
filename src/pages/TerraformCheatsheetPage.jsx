import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { BlockOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL, ITEMS } from '../utils/terraformCheatsheet'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Terraform Cheat Sheet',
    intro: (
      <>
        Referência pesquisável de <Text code>terraform</Text> e de HCL — CLI,
        plan/apply/destroy, state, import, workspaces, variáveis, providers &
        backend, módulos, meta-argumentos, funções e flags úteis. Tudo 100%
        client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Boas práticas',
    tipBody: (
      <>
        Separe <Text code>terraform plan</Text> de <Text code>apply</Text> e
        revisse o diff antes de aplicar. Nunca versionar{' '}
        <Text code>.terraform/</Text>, <Text code>*.tfstate</Text> ou{' '}
        <Text code>*.tfstate.*</Text>; commite apenas o{' '}
        <Text code>.terraform.lock.hcl</Text>. Prefira{' '}
        <Text code>for_each</Text> a <Text code>count</Text> em produção e use{' '}
        <Text code>-replace</Text> no lugar do antigo{' '}
        <Text code>taint</Text>. Com backends remotos, proteja <Text code>prevent_destroy</Text> nos recursos críticos.
      </>
    ),
    search: 'Buscar comando, snippet ou descrição...',
    all: 'Todos',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'Terraform Cheat Sheet',
    intro: (
      <>
        A searchable <Text code>terraform</Text> and HCL reference — CLI,
        plan/apply/destroy, state, import, workspaces, variables, providers &
        backend, modules, meta-arguments, functions and handy flags. 100%
        client-side (reference text only).
      </>
    ),
    tipTitle: 'Best practices',
    tipBody: (
      <>
        Split <Text code>terraform plan</Text> from <Text code>apply</Text> and
        review the diff before applying. Never commit{' '}
        <Text code>.terraform/</Text>, <Text code>*.tfstate</Text> or{' '}
        <Text code>*.tfstate.*</Text>; commit only the{''}{' '}
        <Text code>.terraform.lock.hcl</Text>. Prefer <Text code>for_each</Text>{' '}
        over <Text code>count</Text> in production and use <Text code>-replace</Text> instead of the old <Text code>taint</Text>. With remote backends, guard critical resources with <Text code>prevent_destroy</Text>.
      </>
    ),
    search: 'Search a command, snippet or description...',
    all: 'All',
    empty: 'No matches found. Try another search or category.',
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function TerraformCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q) ||
        CATEGORY_LABEL[c.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\` | ${CATEGORY_LABEL[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BlockOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<BlockOutlined />} message={t.tipTitle} description={t.tipBody} />

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
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{CATEGORY_LABEL[cat][lang]}</Radio.Button>
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
                <Space wrap style={{ rowGap: 6, alignItems: 'flex-start' }}>
                  {item.cmd.includes('\n') ? (
                    <pre
                      style={{
                        margin: 0,
                        fontSize: 12,
                        lineHeight: 1.5,
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        maxWidth: '100%',
                        overflow: 'auto',
                      }}
                    >
                      <code>{item.cmd}</code>
                    </pre>
                  ) : (
                    <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  )}
                  <Tag color={CATEGORY_COLOR[item.cat]}>{CATEGORY_LABEL[item.cat][lang]}</Tag>
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
              <code>{JSON.stringify(ITEMS, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}