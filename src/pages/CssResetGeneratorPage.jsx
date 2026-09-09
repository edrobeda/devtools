import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Select, Checkbox, Row, Col, Button, Divider, Tabs, Alert, Tooltip, message } from 'antd'
import { CopyOutlined, CodeOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const PRESETS = [
  { value: 'modern', label: { pt: 'Modern (Josh Comeau)', en: 'Modern (Josh Comeau)' } },
  { value: 'normalize', label: { pt: 'Normalize', en: 'Normalize' } },
  { value: 'minimal', label: { pt: 'Mínimo', en: 'Minimal' } },
  { value: 'bootstrap', label: { pt: 'Bootstrap-style', en: 'Bootstrap-style' } },
  { value: 'comprehensive', label: { pt: 'Abrangente', en: 'Comprehensive' } },
  { value: 'custom', label: { pt: 'Personalizado', en: 'Custom' } },
]

const RULES = [
  { key: 'boxSizing', defaultLabel: { pt: 'Box-sizing: border-box global', en: 'Global box-sizing: border-box' } },
  { key: 'marginReset', defaultLabel: { pt: 'Reset de margens do body', en: 'Body margin reset' } },
  { key: 'typography', defaultLabel: { pt: 'Tipografia fluida (html font-size)', en: 'Fluid typography (html font-size)' } },
  { key: 'lineHeight', defaultLabel: { pt: 'Line-height hereditário (1.5)', en: 'Inherited line-height (1.5)' } },
  { key: 'headingMargins', defaultLabel: { pt: 'Margens de headings', en: 'Heading margins' } },
  { key: 'listStyle', defaultLabel: { pt: 'Remover list-style: none', en: 'Remove list-style: none' } },
  { key: 'imgReset', defaultLabel: { pt: 'Reset de imagens (display block, max-width)', en: 'Image reset (display block, max-width)' } },
  { key: 'formReset', defaultLabel: { pt: 'Reset de formulários (font inherit)', en: 'Form reset (font inherit)' } },
  { key: 'buttonReset', defaultLabel: { pt: 'Reset de botões (cursor, font inherit)', en: 'Button reset (cursor, font inherit)' } },
  { key: 'tableReset', defaultLabel: { pt: 'Reset de tabelas (border-collapse)', en: 'Table reset (border-collapse)' } },
  { key: 'linkReset', defaultLabel: { pt: 'Reset de links (cor herdada)', en: 'Link reset (inherited color)' } },
  { key: 'focusVisible', defaultLabel: { pt: 'Outline no :focus-visible', en: 'Outline on :focus-visible' } },
  { key: 'scrollBehavior', defaultLabel: { pt: 'scroll-behavior: smooth', en: 'scroll-behavior: smooth' } },
  { key: 'subSup', defaultLabel: { pt: 'Reset de sub/sup', en: 'Sub/sup reset' } },
  { key: 'hidden', defaultLabel: { pt: '[hidden] display: none', en: '[hidden] display: none' } },
]

const PRESET_CHECKS = {
  modern: ['boxSizing', 'marginReset', 'typography', 'lineHeight', 'headingMargins', 'listStyle', 'imgReset', 'formReset', 'buttonReset', 'tableReset', 'linkReset', 'focusVisible', 'scrollBehavior', 'subSup', 'hidden'],
  normalize: ['boxSizing', 'marginReset', 'lineHeight', 'headingMargins', 'imgReset', 'formReset', 'buttonReset', 'tableReset', 'linkReset', 'focusVisible', 'hidden'],
  minimal: ['boxSizing', 'marginReset', 'imgReset'],
  bootstrap: ['boxSizing', 'marginReset', 'typography', 'lineHeight', 'headingMargins', 'listStyle', 'imgReset', 'formReset', 'buttonReset', 'tableReset', 'linkReset', 'focusVisible', 'scrollBehavior', 'subSup', 'hidden'],
  comprehensive: ['boxSizing', 'marginReset', 'typography', 'lineHeight', 'headingMargins', 'listStyle', 'imgReset', 'formReset', 'buttonReset', 'tableReset', 'linkReset', 'focusVisible', 'scrollBehavior', 'subSup', 'hidden'],
  custom: [],
}

function buildCss(checkedRules) {
  const lines = []
  lines.push('/* Modern CSS Reset — gerado em devtools.eventifylab.com */')
  lines.push('')

  if (checkedRules.includes('boxSizing')) {
    lines.push('*,')
  lines.push('*::before,')
  lines.push('*::after {')
  lines.push('  box-sizing: border-box;')
  lines.push('}')
  lines.push('')
  }

  if (checkedRules.includes('marginReset')) {
    lines.push('body {')
    lines.push('  margin: 0;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('typography')) {
    lines.push('html {')
    lines.push('  font-size: 100%; /* 16px base */')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('lineHeight')) {
    lines.push('body {')
    lines.push('  line-height: 1.5;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('headingMargins')) {
    lines.push('h1, h2, h3, h4, h5, h6 {')
    lines.push('  margin: 0;')
    lines.push('  text-wrap: balance;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('listStyle')) {
    lines.push('ul, ol {')
    lines.push('  list-style: none;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('imgReset')) {
    lines.push('img,')
    lines.push('picture,')
    lines.push('video,')
    lines.push('canvas,')
    lines.push('svg {')
    lines.push('  display: block;')
    lines.push('  max-width: 100%;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('formReset')) {
    lines.push('input,')
    lines.push('button,')
    lines.push('textarea,')
    lines.push('select {')
    lines.push('  font: inherit;')
    lines.push('  color: inherit;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('buttonReset')) {
    lines.push('button {')
    lines.push('  cursor: pointer;')
    lines.push('  background: none;')
    lines.push('  border: none;')
    lines.push('  padding: 0;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('tableReset')) {
    lines.push('table {')
    lines.push('  border-collapse: collapse;')
    lines.push('  border-spacing: 0;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('linkReset')) {
    lines.push('a {')
    lines.push('  color: inherit;')
    lines.push('  text-decoration: none;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('focusVisible')) {
    lines.push(':focus-visible {')
    lines.push('  outline: 2px solid #1677ff;')
    lines.push('  outline-offset: 2px;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('scrollBehavior')) {
    lines.push('html {')
    lines.push('  scroll-behavior: smooth;')
    lines.push('}')
    lines.push('')
  }

  if (checkedRules.includes('subSup')) {
    lines.push('sub, sup {')
    lines.push('  font-size: 75%;')
    lines.push('  line-height: 0;')
    lines.push('  position: relative;')
    lines.push('  vertical-align: baseline;')
    lines.push('}')
    lines.push('')
    lines.push('sub { bottom: -0.25em; }')
    lines.push('sup { top: -0.5em; }')
    lines.push('')
  }

  if (checkedRules.includes('hidden')) {
    lines.push('[hidden] {')
    lines.push('  display: none !important;')
    lines.push('}')
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

function PreviewPane() {
  const { lang } = useLanguage()
  return (
    <div style={{ padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        {lang === 'pt' ? 'Prévia — como os elementos ficam SEM o reset:' : 'Preview — how elements look WITHOUT the reset:'}
      </Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <Text strong>{lang === 'pt' ? 'Tipografia' : 'Typography'}</Text>
          <h1 style={{ margin: '8px 0 4px' }}>Heading 1</h1>
          <h2 style={{ margin: '8px 0 4px' }}>Heading 2</h2>
          <h3 style={{ margin: '8px 0 4px' }}>Heading 3</h3>
          <p style={{ margin: '8px 0' }}>Paragraph with <a href="#reset">a link</a> and <strong>bold</strong> text.</p>
        </div>
        <div>
          <Text strong>{lang === 'pt' ? 'Formulários' : 'Forms'}</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <input placeholder="Text input" style={{ padding: '4px 8px' }} />
            <select><option>Select option</option></select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button">Button</button>
              <button type="button" style={{ border: '1px solid #ccc', padding: '2px 10px', borderRadius: 4 }}>Outlined</button>
            </div>
          </div>
        </div>
        <div>
          <Text strong>{lang === 'pt' ? 'Listas' : 'Lists'}</Text>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Unordered item 1</li>
            <li>Unordered item 2</li>
          </ul>
          <ol style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Ordered item 1</li>
            <li>Ordered item 2</li>
          </ol>
        </div>
        <div>
          <Text strong>{lang === 'pt' ? 'Tabela' : 'Table'}</Text>
          <table style={{ width: '100%', marginTop: 8, border: '1px solid #ddd' }}>
            <thead><tr style={{ background: '#fafafa' }}><th style={{ padding: 6, border: '1px solid #ddd' }}>Name</th><th style={{ padding: 6, border: '1px solid #ddd' }}>Value</th></tr></thead>
            <tbody><tr><td style={{ padding: 6, border: '1px solid #ddd' }}>A</td><td style={{ padding: 6, border: '1px solid #ddd' }}>1</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const translations = {
  pt: {
    title: 'Gerador de CSS Reset',
    intro: 'Gere um CSS reset moderno e pronto para produção. Escolha um preset e ajuste as regras individualmente — ou comece do zero no modo Personalizado. O código sai pronto para copiar e colar.',
    preset: 'Preset',
    rules: 'Regras',
    preview: 'Prévia',
    code: 'Código',
    copy: 'Copiar',
    copied: 'Copiado!',
    selectPreset: 'Selecione um preset',
    tip: 'Cada preset ativa um conjunto diferente de regras. Mude para Personalizado e ajuste individualmente.',
    elementsPreview: 'Prévia dos elementos',
  },
  en: {
    title: 'CSS Reset Generator',
    intro: 'Generate a modern, production-ready CSS reset. Pick a preset and toggle individual rules — or start from scratch in Custom mode. The code is ready to copy and paste.',
    preset: 'Preset',
    rules: 'Rules',
    preview: 'Preview',
    code: 'Code',
    copy: 'Copy',
    copied: 'Copied!',
    selectPreset: 'Select a preset',
    tip: 'Each preset activates a different set of rules. Switch to Custom and toggle them individually.',
    elementsPreview: 'Elements preview',
  },
}

export default function CssResetGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('modern')
  const [checkedRules, setCheckedRules] = useState([...PRESET_CHECKS.modern])

  const handlePresetChange = useCallback((val) => {
    setPreset(val)
    if (val !== 'custom') {
      setCheckedRules([...PRESET_CHECKS[val]])
    }
  }, [])

  const handleRuleToggle = useCallback((key) => {
    setPreset('custom')
    setCheckedRules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }, [])

  const cssCode = useMemo(() => buildCss(checkedRules), [checkedRules])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cssCode).then(() => {
      message.success(t.copied)
    })
  }, [cssCode, t.copied])

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
        <Title level={2} style={{ marginBottom: 8 }}>{t.title}</Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>{t.intro}</Paragraph>

        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>{t.preset}</Text>
              <Select
                value={preset}
                onChange={handlePresetChange}
                style={{ width: 280 }}
                options={PRESETS.map((p) => ({ value: p.value, label: p.label[lang] }))}
              />
            </div>
            <Alert
              message={<span><InfoCircleOutlined style={{ marginRight: 6 }} />{t.tip}</span>}
              type="info"
              showIcon={false}
              banner
              style={{ borderRadius: 6 }}
            />
          </Space>
        </Card>

        <Card title={t.rules} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 12]}>
            {RULES.map((rule) => (
              <Col xs={24} sm={12} key={rule.key}>
                <Checkbox
                  checked={checkedRules.includes(rule.key)}
                  onChange={() => handleRuleToggle(rule.key)}
                >
                  {rule.defaultLabel[lang]}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <CodeOutlined />
              {t.code}
            </Space>
          }
          extra={
            <Tooltip title={t.copy}>
              <Button icon={<CopyOutlined />} onClick={handleCopy} size="small" />
            </Tooltip>
          }
        >
          <pre style={{
            margin: 0,
            padding: 16,
            background: '#1e1e1e',
            color: '#d4d4d4',
            borderRadius: 8,
            overflow: 'auto',
            fontSize: 13,
            lineHeight: 1.6,
            maxHeight: 500,
          }}>
            <code>{cssCode}</code>
          </pre>
        </Card>

        <Card
          title={
            <Space>
              <EyeOutlined />
              {t.elementsPreview}
            </Space>
          }
        >
          <PreviewPane />
        </Card>
      </div>
    </div>
  )
}
