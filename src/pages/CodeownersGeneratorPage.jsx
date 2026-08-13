import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Switch,
  Tag,
  message,
  Divider,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildCodeowners, PRESETS, validateCodeowners } from '../utils/codeownersGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const EMPTY_RULE = { pattern: '', owners: [''] }

const PRESET_HEADERS = {
  minimal: {
    pt: 'Responsáveis padrão de todo o repositório.\nEdite conforme a estrutura do seu time.',
    en: 'Default owners for the whole repository.\nEdit to match your team structure.',
  },
  monorepo: {
    pt: 'Exemplo de CODEOWNERS para monorepo com pacotes frontend, backend e shared.',
    en: 'Sample CODEOWNERS for a monorepo with frontend, backend and shared packages.',
  },
  security: {
    pt: 'Toda mudança em CI/CD, secrets e dependências precisa de aprovação do time de segurança.',
    en: 'Any change to CI/CD, secrets and dependencies requires security team approval.',
  },
  docs: {
    pt: 'Documentação e traduções sob responsabilidade do time de docs.',
    en: 'Documentation and translations owned by the docs team.',
  },
}

const SOURCE = `
function formatComment(text) {
  if (!text) return ''
  return text
    .split('\\n')
    .map((line) => (line.trim() ? \`# \${line.trim()}\` : '#'))
    .join('\\n')
}

function validateOwner(owner) {
  const trimmed = owner.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('@')) return trimmed.length > 1
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(trimmed)
}

function buildCodeowners({ header, headerText, rules }) {
  const lines = []

  if (header && headerText) {
    const comment = formatComment(headerText)
    if (comment) lines.push(comment, '')
  }

  for (const rule of rules || []) {
    const pattern = (rule.pattern || '').trim()
    const owners = (rule.owners || [])
      .map((o) => o.trim())
      .filter(validateOwner)
    if (!pattern || owners.length === 0) continue
    lines.push(\`\${pattern} \${owners.join(' ')}\`)
  }

  return lines.join('\\n')
}
`

const translations = {
  pt: {
    title: 'Gerador de CODEOWNERS',
    intro:
      'Monta um arquivo CODEOWNERS válido para GitHub, GitLab e Bitbucket: defina padrões de arquivo e os usuários ou times responsáveis. Tudo acontece no navegador — nenhum dado sai daqui.',
    presets: 'Modelos de um clique',
    header: 'Incluir comentário de cabeçalho',
    headerText: 'Texto do cabeçalho',
    headerTextPlaceholder: 'Escreva uma breve explicação sobre as regras abaixo...',
    rules: 'Regras',
    rulesHint:
      'Cada linha associa um padrão (glob) a um ou mais owners. Use @usuario ou @time do GitHub; e-mails também são aceitos. Separe múltiplos owners com espaço.',
    pattern: 'Padrão (glob)',
    patternPlaceholder: '*.js ou /apps/web/**',
    owners: 'Owners',
    ownersPlaceholder: '@my-org/frontend @alice',
    addRule: 'Adicionar regra',
    remove: 'Remover',
    copy: 'Copiar',
    copied: 'CODEOWNERS copiado!',
    download: 'Baixar CODEOWNERS',
    downloadName: 'CODEOWNERS',
    output: 'CODEOWNERS gerado',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    invalidOwners: 'Alguns owners parecem inválidos',
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildCodeowners monta a string linha a linha: começa com o cabeçalho comentado e depois adiciona uma regra para cada padrão que tiver pelo menos um owner válido.',
    tipsTitle: 'Dicas de CODEOWNERS',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Ordem importa</Text>: o GitHub usa a última regra que casa com o arquivo. Coloque regras específicas antes das genéricas.
        </li>
        <li>
          <Text strong>@team</Text> é melhor que @user individual: facilita a manutenção quando alguém entra ou sai do time.
        </li>
        <li>
          <Text strong>Arquivo de CODEOWNERS</Text> pode ficar em <Text code>.github/CODEOWNERS</Text>, <Text code>CODEOWNERS</Text> na raiz ou <Text code>docs/CODEOWNERS</Text>.
        </li>
        <li>
          Use <Text code>**</Text> para recursão e <Text code>!</Text> para negar padrões (suporte varia entre plataformas).
        </li>
      </ul>
    ),
  },
  en: {
    title: 'CODEOWNERS Generator',
    intro:
      'Builds a valid CODEOWNERS file for GitHub, GitLab and Bitbucket: define file patterns and the users or teams responsible for them. Everything happens in the browser — no data leaves this page.',
    presets: 'One-click templates',
    header: 'Include header comment',
    headerText: 'Header text',
    headerTextPlaceholder: 'Write a short explanation about the rules below...',
    rules: 'Rules',
    rulesHint:
      'Each line maps a glob pattern to one or more owners. Use @user or @team from GitHub; emails are also accepted. Separate multiple owners with spaces.',
    pattern: 'Pattern (glob)',
    patternPlaceholder: '*.js or /apps/web/**',
    owners: 'Owners',
    ownersPlaceholder: '@my-org/frontend @alice',
    addRule: 'Add rule',
    remove: 'Remove',
    copy: 'Copy',
    copied: 'CODEOWNERS copied!',
    download: 'Download CODEOWNERS',
    downloadName: 'CODEOWNERS',
    output: 'Generated CODEOWNERS',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    invalidOwners: 'Some owners look invalid',
    sourceTitle: 'Source code',
    sourceBody:
      'buildCodeowners builds the string line by line: it starts with a commented header and then adds one rule for each pattern that has at least one valid owner.',
    tipsTitle: 'CODEOWNERS tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Order matters</Text>: GitHub uses the last rule matching a file. Put specific rules before generic ones.
        </li>
        <li>
          <Text strong>@team</Text> is better than individual @user: easier to maintain when people join or leave the team.
        </li>
        <li>
          <Text strong>CODEOWNERS file</Text> can live at <Text code>.github/CODEOWNERS</Text>, root <Text code>CODEOWNERS</Text> or <Text code>docs/CODEOWNERS</Text>.
        </li>
        <li>
          Use <Text code>**</Text> for recursion and <Text code>!</Text> to negate patterns (support varies by platform).
        </li>
      </ul>
    ),
  },
}

export default function CodeownersGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({
    header: true,
    headerText: PRESET_HEADERS.minimal[lang],
    rules: PRESETS.minimal.rules.map((rule) => ({ ...rule, owners: [...rule.owners] })),
  })
  const [activePreset, setActivePreset] = useState('minimal')

  const output = useMemo(() => buildCodeowners(options), [options])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])
  const validationErrors = useMemo(() => validateCodeowners(options), [options])

  const applyPreset = useCallback((key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setActivePreset(key)
    setOptions({
      header: true,
      headerText: PRESET_HEADERS[key][lang],
      rules: preset.rules.map((rule) => ({ ...rule, owners: [...rule.owners] })),
    })
  }, [lang])

  const updateHeader = useCallback((value) => {
    setOptions((prev) => ({ ...prev, headerText: value }))
    setActivePreset('')
  }, [])

  const toggleHeader = useCallback((checked) => {
    setOptions((prev) => ({ ...prev, header: checked }))
    setActivePreset('')
  }, [])

  const updateRulePattern = useCallback((index, value) => {
    setOptions((prev) => {
      const next = { ...prev }
      next.rules = next.rules.map((rule, i) =>
        i === index ? { ...rule, pattern: value } : rule
      )
      return next
    })
    setActivePreset('')
  }, [])

  const updateRuleOwners = useCallback((index, value) => {
    setOptions((prev) => {
      const next = { ...prev }
      next.rules = next.rules.map((rule, i) =>
        i === index ? { ...rule, owners: [value] } : rule
      )
      return next
    })
    setActivePreset('')
  }, [])

  const addRule = useCallback(() => {
    setOptions((prev) => ({
      ...prev,
      rules: [...prev.rules, { ...EMPTY_RULE }],
    }))
    setActivePreset('')
  }, [])

  const removeRule = useCallback((index) => {
    setOptions((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }))
    setActivePreset('')
  }, [])

  const copyOutput = useCallback(() => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }, [output, t.copied])

  const downloadOutput = useCallback(() => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.downloadName
    a.click()
    URL.revokeObjectURL(url)
  }, [output, t.downloadName])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TeamOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      <Card title={t.presets}>
        <Space wrap>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              type={activePreset === key ? 'primary' : 'default'}
              size="small"
              onClick={() => applyPreset(key)}
            >
              {preset.label[lang]}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.output}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Switch
                  checked={options.header}
                  onChange={toggleHeader}
                  style={{ marginRight: 8 }}
                />
                <Text>{t.header}</Text>
              </div>

              {options.header && (
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.headerText}</Text>
                  <TextArea
                    rows={3}
                    value={options.headerText}
                    onChange={(e) => updateHeader(e.target.value)}
                    placeholder={t.headerTextPlaceholder}
                  />
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                {t.rules}
                <Tag>{options.rules.length}</Tag>
              </Space>
            }
            extra={
              <Button size="small" icon={<PlusOutlined />} onClick={addRule}>
                {t.addRule}
              </Button>
            }
          >
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
              {t.rulesHint}
            </Paragraph>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {options.rules.map((rule, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 12,
                    background: '#fafafa',
                  }}
                >
                  <Row gutter={[12, 12]} align="bottom">
                    <Col xs={24} sm={10}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.pattern}</Text>
                      <Input
                        value={rule.pattern}
                        onChange={(e) => updateRulePattern(index, e.target.value)}
                        placeholder={t.patternPlaceholder}
                      />
                    </Col>
                    <Col xs={20} sm={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.owners}</Text>
                      <Input
                        value={rule.owners[0] || ''}
                        onChange={(e) => updateRuleOwners(index, e.target.value)}
                        placeholder={t.ownersPlaceholder}
                      />
                    </Col>
                    <Col xs={4} sm={2} style={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeRule(index)}
                        title={t.remove}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={
          <Space>
            {validationErrors.length > 0 && (
              <Tag color="warning">{t.invalidOwners}</Tag>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>{t.copy}</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadOutput}>{t.download}</Button>
          </Space>
        }
      >
        <pre
          style={{
            margin: 0,
            overflowX: 'auto',
            background: '#0d1117',
            color: '#e6edf3',
            padding: 12,
            borderRadius: 8,
            maxHeight: 420,
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          <code>{output || '# CODEOWNERS'}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{SOURCE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
