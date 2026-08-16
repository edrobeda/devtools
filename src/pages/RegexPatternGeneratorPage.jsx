import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Select, Input, Button, Tag, List, Segmented, Alert,
  Collapse, Tabs, message, Descriptions, Divider,
} from 'antd'
import {
  CopyOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CATEGORIES,
  PATTERNS,
  getPatternById,
  buildRegex,
  testPattern,
  findMatches,
  snippetJs,
  snippetPython,
} from '../utils/regexPatternGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Padrões Regex',
    intro: (
      <>
        Copie expressões regulares prontas para validações do dia a dia — e-mail,
        URL, CPF, CEP, UUID, IPv4/IPv6, senha forte e mais. Cada padrão inclui
        explicação, exemplos válidos/inválidos, testador integrado e snippets em
        JavaScript e Python. 100% no navegador.
      </>
    ),
    categoryLabel: 'Categoria',
    allCategories: 'Todas',
    patternLabel: 'Padrão',
    flagsLabel: 'Flags',
    flagsHint: 'i = ignore case, g = global, m = multiline, s = dotall',
    testLabel: 'Testar contra',
    testPlaceholder: 'Cole ou digite um valor para testar...',
    matches: 'Matches encontrados',
    noMatches: 'Nenhum match',
    validExamples: 'Exemplos válidos',
    invalidExamples: 'Exemplos inválidos',
    snippetJs: 'JavaScript',
    snippetPython: 'Python',
    copyRegex: 'Copiar regex',
    copySnippet: 'Copiar snippet',
    copied: 'Copiado',
    copyErr: 'Falha ao copiar',
    description: 'Descrição',
    sourceTitle: 'Código-fonte do motor',
    noteExact: 'Nota: esta regex valida apenas o formato. Para verificação completa de dígitos (CPF/CNPJ/cartão), use as ferramentas dedicadas.',
  },
  en: {
    title: 'Regex Pattern Generator',
    intro: (
      <>
        Copy ready-to-use regular expressions for everyday validations — e-mail,
        URL, CPF, CEP, UUID, IPv4/IPv6, strong password and more. Each pattern
        includes an explanation, valid/invalid examples, an integrated tester and
        JavaScript/Python snippets. 100% in the browser.
      </>
    ),
    categoryLabel: 'Category',
    allCategories: 'All',
    patternLabel: 'Pattern',
    flagsLabel: 'Flags',
    flagsHint: 'i = ignore case, g = global, m = multiline, s = dotall',
    testLabel: 'Test against',
    testPlaceholder: 'Paste or type a value to test...',
    matches: 'Matches found',
    noMatches: 'No matches',
    validExamples: 'Valid examples',
    invalidExamples: 'Invalid examples',
    snippetJs: 'JavaScript',
    snippetPython: 'Python',
    copyRegex: 'Copy regex',
    copySnippet: 'Copy snippet',
    copied: 'Copied',
    copyErr: 'Copy failed',
    description: 'Description',
    sourceTitle: 'Source code',
    noteExact: 'Note: this regex validates format only. For full digit verification (CPF/CNPJ/card), use the dedicated tools.',
  },
}

export default function RegexPatternGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedId, setSelectedId] = useState(PATTERNS[0].id)
  const [customFlags, setCustomFlags] = useState('')
  const [testInput, setTestInput] = useState('')

  const categoriesOptions = useMemo(
    () => [
      { value: 'all', label: t.allCategories },
      ...CATEGORIES.map((c) => ({ value: c.key, label: c[lang] })),
    ],
    [lang, t.allCategories]
  )

  const filteredPatterns = useMemo(() => {
    if (selectedCategory === 'all') return PATTERNS
    return PATTERNS.filter((p) => p.category === selectedCategory)
  }, [selectedCategory])

  const pattern = useMemo(() => {
    const found = getPatternById(selectedId)
    if (found && filteredPatterns.some((p) => p.id === found.id)) return found
    return filteredPatterns[0] || PATTERNS[0]
  }, [selectedId, filteredPatterns])

  // Sincroniza o select de padrão quando a categoria filtra a lista.
  const effectiveId = pattern.id

  const flags = customFlags
  const regex = useMemo(() => buildRegex(pattern, flags), [pattern, flags])
  const regexString = `/${pattern.regex}/${flags}`

  const testResult = useMemo(() => {
    if (testInput === '') return null
    return testPattern(pattern, testInput, flags)
  }, [pattern, testInput, flags])

  const matches = useMemo(() => {
    if (testInput === '') return []
    return findMatches(pattern, testInput, flags)
  }, [pattern, testInput, flags])

  const handleCategoryChange = useCallback((value) => {
    setSelectedCategory(value)
    setSelectedId((current) => {
      const list = value === 'all' ? PATTERNS : PATTERNS.filter((p) => p.category === value)
      const stillVisible = list.some((p) => p.id === current)
      return stillVisible ? current : (list[0]?.id || PATTERNS[0].id)
    })
  }, [])

  const copyToClipboard = useCallback(
    async (text, label) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(`${label} — ${t.copied}`)
      } catch {
        messageApi.error(t.copyErr)
      }
    },
    [messageApi, t]
  )

  const source = useMemo(
    () => `const PATTERNS = [
  {
    id: 'email',
    regex: /^[a-zA-Z0-9.!#$%&'*+/=?^\x60{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    flags: '',
  },
  // ...
]

export function buildRegex(pattern, flags = pattern.flags) {
  return new RegExp(pattern.regex, flags)
}

export function testPattern(pattern, input, flags = pattern.flags) {
  return buildRegex(pattern, flags).test(String(input ?? ''))
}

export function findMatches(pattern, input, flags = pattern.flags) {
  const re = buildRegex(pattern, flags.includes('g') ? flags : flags + 'g')
  return Array.from(input.matchAll(re)).map(m => ({
    match: m[0], index: m.index,
  }))
}`,
    []
  )

  const snippetJsText = useMemo(() => snippetJs(pattern, flags), [pattern, flags])
  const snippetPythonText = useMemo(() => snippetPython(pattern, flags), [pattern, flags])

  const patternOptions = useMemo(
    () => filteredPatterns.map((p) => ({ value: p.id, label: p.name[lang] })),
    [filteredPatterns, lang]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ExperimentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.noteExact} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="center">
            <Space direction="vertical" size="small">
              <Text strong>{t.categoryLabel}</Text>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                options={categoriesOptions}
                style={{ minWidth: 160 }}
              />
            </Space>
            <Space direction="vertical" size="small">
              <Text strong>{t.patternLabel}</Text>
              <Select
                value={effectiveId}
                onChange={setSelectedId}
                options={patternOptions}
                style={{ minWidth: 220 }}
              />
            </Space>
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{regexString}</Text>
            <Space wrap>
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(regexString, t.copyRegex)}
              >
                {t.copyRegex}
              </Button>
              <Input
                prefix={<span style={{ color: '#bfbfbf' }}>/…/</span>}
                value={customFlags}
                onChange={(e) => setCustomFlags(e.target.value.replace(/[^igmsuxy]/g, ''))}
                placeholder={t.flagsHint}
                style={{ width: 200 }}
                maxLength={6}
              />
            </Space>
          </Space>
        </Space>
      </Card>

      <Card title={t.description}>
        <Paragraph>{pattern.description[lang]}</Paragraph>
      </Card>

      <Card title={t.testLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t.testPlaceholder}
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
          />
          {testResult !== null && (
            <Tag
              icon={testResult ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              color={testResult ? 'success' : 'error'}
              style={{ fontSize: 14, padding: '4px 10px' }}
            >
              {testResult ? 'Match' : 'No match'}
            </Tag>
          )}
          {matches.length > 0 && (
            <Descriptions bordered size="small" column={1} title={t.matches}>
              {matches.map((m, i) => (
                <Descriptions.Item key={i} label={`#${i + 1} @ ${m.index}`}>
                  <Text code>{m.match}</Text>
                </Descriptions.Item>
              ))}
            </Descriptions>
          )}
          {testInput !== '' && matches.length === 0 && testResult === false && (
            <Text type="secondary">{t.noMatches}</Text>
          )}
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space size="large" align="start" wrap>
            <Space direction="vertical" size="small">
              <Text strong type="success">{t.validExamples}</Text>
              <List
                size="small"
                bordered
                dataSource={pattern.valid}
                renderItem={(item) => (
                  <List.Item>
                    <Text code>{item}</Text>
                  </List.Item>
                )}
                style={{ minWidth: 180 }}
              />
            </Space>
            <Space direction="vertical" size="small">
              <Text strong type="danger">{t.invalidExamples}</Text>
              <List
                size="small"
                bordered
                dataSource={pattern.invalid}
                renderItem={(item) => (
                  <List.Item>
                    <Text code>{item}</Text>
                  </List.Item>
                )}
                style={{ minWidth: 180 }}
              />
            </Space>
          </Space>
        </Space>
      </Card>

      <Card>
        <Tabs
          items={[
            {
              key: 'js',
              label: t.snippetJs,
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
                    {snippetJsText}
                  </pre>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(snippetJsText, t.snippetJs)}>
                    {t.copySnippet}
                  </Button>
                </Space>
              ),
            },
            {
              key: 'python',
              label: t.snippetPython,
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
                    {snippetPythonText}
                  </pre>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(snippetPythonText, t.snippetPython)}>
                    {t.copySnippet}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
                {source}
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
