import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Select, Checkbox, message } from 'antd'
import { LockOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const DIRECTIVES = [
  'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
  'connect-src', 'frame-src', 'frame-ancestors', 'object-src', 'base-uri',
  'form-action', 'media-src', 'worker-src', 'manifest-src',
]

const QUICK_TOKENS = ["'self'", "'none'", "'unsafe-inline'", "'unsafe-eval'", 'data:', 'https:', 'blob:']

let nextId = 0
function makeRule(directive = 'default-src', values = "'self'") {
  return { id: nextId++, directive, values }
}

const translations = {
  pt: {
    title: 'Gerador de Content-Security-Policy',
    intro: (
      <>
        Monta um cabeçalho <Text code>Content-Security-Policy</Text> a partir
        de diretivas e listas de fontes permitidas — tudo local, só
        montagem de texto. Cada linha vira{' '}
        <Text code>diretiva valor1 valor2 ...</Text> separada por{' '}
        <Text code>;</Text>. Use os botões de atalho pra inserir tokens
        comuns (<Text code>'self'</Text>, <Text code>'unsafe-inline'</Text>{' '}
        etc.) em qualquer linha.
      </>
    ),
    presets: 'Atalhos',
    presetBasic: 'Política básica restritiva',
    presetPermissive: 'Bem permissiva (não recomendado)',
    presetReset: 'Limpar tudo',
    rules: 'Diretivas',
    addRule: 'Adicionar diretiva',
    directive: 'Diretiva',
    values: 'Valores (separados por espaço)',
    valuesPlaceholder: "'self' https://cdn.exemplo.com",
    upgradeInsecure: 'Incluir upgrade-insecure-requests (força HTTPS em todo recurso)',
    outputHeader: 'Cabeçalho HTTP',
    outputMeta: 'Tag <meta> equivalente',
    copy: 'Copiar',
    copied: 'Copiado!',
    minRules: 'É preciso ter pelo menos 1 diretiva.',
    quickTokens: 'Inserir',
  },
  en: {
    title: 'Content-Security-Policy Generator',
    intro: (
      <>
        Builds a <Text code>Content-Security-Policy</Text> header from
        directives and allowed source lists — all local, just text
        assembly. Each row becomes{' '}
        <Text code>directive value1 value2 ...</Text> separated by{' '}
        <Text code>;</Text>. Use the shortcut buttons to insert common
        tokens (<Text code>'self'</Text>, <Text code>'unsafe-inline'</Text>{' '}
        etc.) into any row.
      </>
    ),
    presets: 'Shortcuts',
    presetBasic: 'Basic restrictive policy',
    presetPermissive: 'Very permissive (not recommended)',
    presetReset: 'Clear all',
    rules: 'Directives',
    addRule: 'Add directive',
    directive: 'Directive',
    values: 'Values (space-separated)',
    valuesPlaceholder: "'self' https://cdn.example.com",
    upgradeInsecure: 'Include upgrade-insecure-requests (force HTTPS for every resource)',
    outputHeader: 'HTTP header',
    outputMeta: 'Equivalent <meta> tag',
    copy: 'Copy',
    copied: 'Copied!',
    minRules: 'You need at least 1 directive.',
    quickTokens: 'Insert',
  },
}

export default function CspGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [rules, setRules] = useState([
    makeRule('default-src', "'self'"),
    makeRule('object-src', "'none'"),
    makeRule('base-uri', "'self'"),
  ])
  const [upgradeInsecure, setUpgradeInsecure] = useState(true)

  function updateRule(id, patch) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRule() {
    setRules((prev) => [...prev, makeRule('script-src', '')])
  }

  function removeRule(id) {
    if (rules.length <= 1) {
      message.warning(t.minRules)
      return
    }
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  function insertToken(id, token) {
    setRules((prev) => prev.map((r) => {
      if (r.id !== id) return r
      const tokens = r.values.split(/\s+/).filter(Boolean)
      if (tokens.includes(token)) return r
      return { ...r, values: [...tokens, token].join(' ') }
    }))
  }

  function applyBasic() {
    setRules([
      makeRule('default-src', "'self'"),
      makeRule('object-src', "'none'"),
      makeRule('base-uri', "'self'"),
      makeRule('form-action', "'self'"),
    ])
    setUpgradeInsecure(true)
  }

  function applyPermissive() {
    setRules([makeRule('default-src', '*'), makeRule('script-src', "* 'unsafe-inline' 'unsafe-eval'")])
    setUpgradeInsecure(false)
  }

  function applyReset() {
    setRules([makeRule('default-src', '')])
    setUpgradeInsecure(false)
  }

  const policy = useMemo(() => {
    const parts = rules
      .filter((r) => r.directive && r.values.trim())
      .map((r) => `${r.directive} ${r.values.trim().split(/\s+/).join(' ')}`)
    if (upgradeInsecure) parts.push('upgrade-insecure-requests')
    return parts.join('; ')
  }, [rules, upgradeInsecure])

  const headerLine = `Content-Security-Policy: ${policy}`
  const metaLine = `<meta http-equiv="Content-Security-Policy" content="${policy}">`

  function copyText(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><LockOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presets}>
        <Space wrap>
          <Button onClick={applyBasic}>{t.presetBasic}</Button>
          <Button onClick={applyPermissive}>{t.presetPermissive}</Button>
          <Button onClick={applyReset}>{t.presetReset}</Button>
        </Space>
      </Card>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>{t.rules}</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={addRule}>{t.addRule}</Button>
        </Space>

        {rules.map((r) => (
          <Card
            key={r.id}
            size="small"
            extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRule(r.id)} />}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space wrap size="middle" style={{ width: '100%' }}>
                <div style={{ width: 180 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.directive}</Text>
                  <Select
                    value={r.directive}
                    onChange={(v) => updateRule(r.id, { directive: v })}
                    style={{ width: '100%' }}
                    options={DIRECTIVES.map((d) => ({ value: d, label: d }))}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.values}</Text>
                  <Input
                    value={r.values}
                    onChange={(e) => updateRule(r.id, { values: e.target.value })}
                    placeholder={t.valuesPlaceholder}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </Space>
              <Space wrap size={4} align="center">
                <Text type="secondary" style={{ fontSize: 12 }}>{t.quickTokens}:</Text>
                {QUICK_TOKENS.map((token) => (
                  <Button key={token} size="small" onClick={() => insertToken(r.id, token)}>
                    {token}
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>
        ))}
      </Space>

      <Card>
        <Checkbox checked={upgradeInsecure} onChange={(e) => setUpgradeInsecure(e.target.checked)}>
          {t.upgradeInsecure}
        </Checkbox>
      </Card>

      <Card
        title={t.outputHeader}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copyText(headerLine)} disabled={!policy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{policy ? headerLine : ' '}</code>
        </pre>
      </Card>

      <Card
        title={t.outputMeta}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copyText(metaLine)} disabled={!policy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{policy ? metaLine : ' '}</code>
        </pre>
      </Card>
    </Space>
  )
}
