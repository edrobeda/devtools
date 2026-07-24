import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Checkbox, Alert, Select, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const FLAG_OPTIONS = ['g', 'i', 'm', 's', 'u', 'y']

const PRESETS = [
  { key: 'email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', flags: 'g' },
  { key: 'url', pattern: 'https?:\\/\\/[^\\s]+', flags: 'g' },
  { key: 'ipv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { key: 'hexColor', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'g' },
  { key: 'cpf', pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}', flags: 'g' },
  { key: 'phoneBr', pattern: '\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}', flags: 'g' },
]

const translations = {
  pt: {
    title: 'Regex Tester',
    intro: (
      <>
        Testa uma expressão regular contra um texto, destacando as
        correspondências em tempo real via <Text code>String.matchAll</Text>.
        Tudo roda no navegador, nada é enviado pra fora.
      </>
    ),
    patternPlaceholder: 'Padrão, ex: \\d+',
    testPlaceholder: 'Cole ou digite o texto de teste aqui...',
    flags: 'Flags',
    presets: 'Padrões prontos',
    presetPlaceholder: 'Escolher um padrão comum...',
    invalidTitle: 'Regex inválida',
    highlightTitle: 'Texto com correspondências destacadas',
    matchesTitle: (n) => `Correspondências (${n})`,
    noMatches: 'Nenhuma correspondência encontrada.',
    match: 'match',
    group: 'grupo',
    presetNames: {
      email: 'E-mail',
      url: 'URL',
      ipv4: 'Endereço IPv4',
      hexColor: 'Cor hexadecimal',
      cpf: 'CPF (000.000.000-00)',
      phoneBr: 'Telefone BR',
    },
  },
  en: {
    title: 'Regex Tester',
    intro: (
      <>
        Tests a regular expression against a text, highlighting matches in
        real time via <Text code>String.matchAll</Text>. Everything runs in
        the browser, nothing is sent out.
      </>
    ),
    patternPlaceholder: 'Pattern, e.g.: \\d+',
    testPlaceholder: 'Paste or type the test text here...',
    flags: 'Flags',
    presets: 'Common patterns',
    presetPlaceholder: 'Pick a common pattern...',
    invalidTitle: 'Invalid regex',
    highlightTitle: 'Text with matches highlighted',
    matchesTitle: (n) => `Matches (${n})`,
    noMatches: 'No matches found.',
    match: 'match',
    group: 'group',
    presetNames: {
      email: 'Email',
      url: 'URL',
      ipv4: 'IPv4 address',
      hexColor: 'Hex color',
      cpf: 'Brazilian CPF (000.000.000-00)',
      phoneBr: 'BR phone number',
    },
  },
}

export default function RegexTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b')
  const [flags, setFlags] = useState(['g', 'i'])
  const [testText, setTestText] = useState('Contato: ana@example.com ou joao.silva@empresa.com.br')

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null }
    try {
      const flagStr = flags.includes('g') ? flags.join('') : `${flags.join('')}g`
      return { regex: new RegExp(pattern, flagStr), error: null }
    } catch (err) {
      return { regex: null, error: err.message }
    }
  }, [pattern, flags])

  const matches = useMemo(() => {
    if (!regex || !testText) return []
    try {
      return [...testText.matchAll(regex)]
    } catch {
      return []
    }
  }, [regex, testText])

  const highlighted = useMemo(() => {
    if (!testText) return null
    if (!matches.length) return testText
    const nodes = []
    let lastIndex = 0
    matches.forEach((m, i) => {
      if (m.index > lastIndex) nodes.push(<span key={`t-${i}`}>{testText.slice(lastIndex, m.index)}</span>)
      nodes.push(
        <mark key={`m-${i}`} style={{ background: '#ffe58f', padding: '0 1px', borderRadius: 2 }}>
          {m[0]}
        </mark>,
      )
      lastIndex = m.index + m[0].length
    })
    if (lastIndex < testText.length) nodes.push(<span key="tail">{testText.slice(lastIndex)}</span>)
    return nodes
  }, [matches, testText])

  function applyPreset(key) {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setPattern(preset.pattern)
    setFlags(preset.flags.split(''))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SearchOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Select
            style={{ width: '100%', maxWidth: 360 }}
            placeholder={t.presetPlaceholder}
            allowClear
            onChange={applyPreset}
            options={PRESETS.map((p) => ({ value: p.key, label: t.presetNames[p.key] }))}
          />
          <Input
            placeholder={t.patternPlaceholder}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            style={{ fontFamily: 'monospace' }}
            addonBefore="/"
            addonAfter={flags.join('')}
          />
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.flags}</Text>
            <Checkbox.Group
              options={FLAG_OPTIONS}
              value={flags}
              onChange={setFlags}
            />
          </Space>
          <TextArea
            rows={5}
            placeholder={t.testPlaceholder}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={t.invalidTitle} description={error} />}

      {!error && testText && (
        <Card title={t.highlightTitle}>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
            {highlighted}
          </div>
        </Card>
      )}

      {!error && (
        <Card title={t.matchesTitle(matches.length)}>
          {matches.length === 0 && <Text type="secondary">{t.noMatches}</Text>}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {matches.map((m, i) => (
              <div key={i}>
                <Tag color="gold">{t.match} {i + 1}</Tag>
                <Text code>{m[0]}</Text>
                {m.length > 1 && (
                  <div style={{ marginLeft: 24, marginTop: 4 }}>
                    {m.slice(1).map((g, gi) => (
                      <div key={gi}>
                        <Text type="secondary">{t.group} {gi + 1}: </Text>
                        <Text code>{g === undefined ? '—' : g}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Space>
        </Card>
      )}
    </Space>
  )
}
