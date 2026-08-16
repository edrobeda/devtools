import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Select, Button, message, Collapse,
  Row, Col, Alert, Segmented, Divider,
} from 'antd'
import { MailOutlined, CopyOutlined, UndoOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  TEMPLATES,
  DEFAULTS,
  PRESETS,
  generateSignature,
  generatePlainText,
  isValidHex,
} from '../utils/emailSignatureGenerator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de Assinatura de E-mail',
    subtitle: 'Monte assinaturas HTML inline para usar em qualquer cliente de e-mail',
    intro:
      'Preencha seus dados, escolha um template e copie o HTML gerado. As assinaturas usam tabelas e estilos inline — a forma mais compatível com Gmail, Outlook, Apple Mail e outros clientes.',
    preview: 'Preview',
    htmlOutput: 'HTML gerado',
    textOutput: 'Texto plano',
    copyHtml: 'Copiar HTML',
    copyText: 'Copiar texto',
    copiedHtml: 'HTML copiado!',
    copiedText: 'Texto copiado!',
    reset: 'Restaurar padrões',
    presets: 'Exemplos de um clique',
    template: 'Template',
    name: 'Nome completo',
    role: 'Cargo / função',
    company: 'Empresa',
    email: 'E-mail',
    phone: 'Telefone',
    website: 'Website',
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    photoUrl: 'URL da foto (opcional)',
    primaryColor: 'Cor principal',
    secondaryColor: 'Cor secundária',
    invalidHex: 'Hex inválido',
    compatibilityTitle: 'Compatibilidade com clientes de e-mail',
    compatibilityBody:
      'Clientes de e-mail costumam ignorar folhas de estilo externas e classes CSS. Por isso o gerador produz tabelas com estilos inline, que funcionam melhor no Gmail, Outlook, Yahoo e Apple Mail. Sempre teste a assinatura no seu cliente real antes de usar em produção.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor monta HTML inline a partir do estado. Nenhum dado é enviado a servidores — tudo fica no navegador.',
    templateClean: 'Clean',
    templateModern: 'Modern',
    templateCompact: 'Compacto',
    templateVertical: 'Vertical',
    templateMinimal: 'Minimalista',
  },
  en: {
    title: 'HTML E-mail Signature Generator',
    subtitle: 'Build inline HTML signatures for any e-mail client',
    intro:
      'Fill in your details, pick a template and copy the generated HTML. The signatures use tables and inline styles — the most compatible approach for Gmail, Outlook, Apple Mail and other clients.',
    preview: 'Preview',
    htmlOutput: 'Generated HTML',
    textOutput: 'Plain text',
    copyHtml: 'Copy HTML',
    copyText: 'Copy text',
    copiedHtml: 'HTML copied!',
    copiedText: 'Text copied!',
    reset: 'Reset defaults',
    presets: 'One-click examples',
    template: 'Template',
    name: 'Full name',
    role: 'Job title',
    company: 'Company',
    email: 'E-mail',
    phone: 'Phone',
    website: 'Website',
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    photoUrl: 'Photo URL (optional)',
    primaryColor: 'Primary color',
    secondaryColor: 'Secondary color',
    invalidHex: 'Invalid hex',
    compatibilityTitle: 'E-mail client compatibility',
    compatibilityBody:
      'E-mail clients often ignore external stylesheets and CSS classes. This generator uses tables with inline styles, which work best in Gmail, Outlook, Yahoo and Apple Mail. Always test the signature in your actual client before using it in production.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine assembles inline HTML from the current state. No data is sent to servers — everything stays in the browser.',
    templateClean: 'Clean',
    templateModern: 'Modern',
    templateCompact: 'Compact',
    templateVertical: 'Vertical',
    templateMinimal: 'Minimal',
  },
}

const sourceCode = `import {
  generateSignature,
  generatePlainText,
} from '../utils/emailSignatureGenerator'

const state = {
  template: 'clean',
  name: 'Ana Silva',
  role: 'Software Engineer',
  company: 'EventifyLab',
  email: 'ana.silva@eventifylab.com',
  phone: '+55 11 91234-5678',
  website: 'https://eventifylab.com',
  linkedIn: 'https://linkedin.com/in/anasilva',
  github: 'https://github.com/anasilva',
  photoUrl: '',
  primaryColor: '#1677ff',
  secondaryColor: '#595959',
}

const html = generateSignature(state)
const text = generatePlainText(state)
`

export default function EmailSignatureGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [state, setState] = useState(DEFAULTS)

  const setField = (key, value) => setState((prev) => ({ ...prev, [key]: value }))

  const applyPreset = (preset) => {
    setState((prev) => ({ ...prev, ...preset.state }))
  }

  const reset = () => setState(DEFAULTS)

  const validPrimary = isValidHex(state.primaryColor)
  const validSecondary = isValidHex(state.secondaryColor)
  const validAll = validPrimary && validSecondary

  const htmlOutput = useMemo(() => generateSignature(state), [state])
  const textOutput = useMemo(() => generatePlainText(state), [state])

  const copyHtml = () => {
    navigator.clipboard.writeText(htmlOutput)
    message.success(t.copiedHtml)
  }

  const copyText = () => {
    navigator.clipboard.writeText(textOutput)
    message.success(t.copiedText)
  }

  const templateOptions = TEMPLATES.map((tmpl) => ({
    value: tmpl.key,
    label: t[tmpl.labelKey],
  }))

  const colorInput = (label, value, valid, onChange) => (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Text strong>{label}</Text>
      <Space>
        <input
          type="color"
          value={valid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          status={valid ? '' : 'error'}
          style={{ width: 120 }}
          maxLength={7}
        />
      </Space>
      {!valid && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidHex}</Text>}
    </Space>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <MailOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={t.presets}
            extra={<Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>}
            style={{ marginBottom: 16 }}
          >
            <Space wrap>
              {PRESETS.map((p) => (
                <Button key={p.key} size="small" onClick={() => applyPreset(p)}>
                  {p.label[lang]}
                </Button>
              ))}
            </Space>
          </Card>

          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Text strong>{t.template}</Text>
                <Select
                  value={state.template}
                  onChange={(v) => setField('template', v)}
                  options={templateOptions}
                  style={{ width: '100%' }}
                />
              </Space>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.name}</Text>
                    <Input
                      value={state.name}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="Ana Silva"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.role}</Text>
                    <Input
                      value={state.role}
                      onChange={(e) => setField('role', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </Space>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.company}</Text>
                    <Input
                      value={state.company}
                      onChange={(e) => setField('company', e.target.value)}
                      placeholder="EventifyLab"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.email}</Text>
                    <Input
                      value={state.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="ana.silva@eventifylab.com"
                    />
                  </Space>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.phone}</Text>
                    <Input
                      value={state.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      placeholder="+55 11 91234-5678"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.website}</Text>
                    <Input
                      value={state.website}
                      onChange={(e) => setField('website', e.target.value)}
                      placeholder="https://eventifylab.com"
                    />
                  </Space>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.linkedIn}</Text>
                    <Input
                      value={state.linkedIn}
                      onChange={(e) => setField('linkedIn', e.target.value)}
                      placeholder="https://linkedin.com/in/anasilva"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Text strong>{t.github}</Text>
                    <Input
                      value={state.github}
                      onChange={(e) => setField('github', e.target.value)}
                      placeholder="https://github.com/anasilva"
                    />
                  </Space>
                </Col>
              </Row>

              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Text strong>{t.photoUrl}</Text>
                <Input
                  value={state.photoUrl}
                  onChange={(e) => setField('photoUrl', e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
              </Space>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  {colorInput(
                    t.primaryColor,
                    state.primaryColor,
                    validPrimary,
                    (v) => setField('primaryColor', v)
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  {colorInput(
                    t.secondaryColor,
                    state.secondaryColor,
                    validSecondary,
                    (v) => setField('secondaryColor', v)
                  )}
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.preview}>
            {!validAll ? (
              <div
                style={{
                  minHeight: 160,
                  border: '1px dashed #d9d9d9',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="danger">{t.invalidHex}</Text>
              </div>
            ) : (
              <div
                style={{
                  minHeight: 160,
                  border: '1px dashed #d9d9d9',
                  borderRadius: 8,
                  padding: 16,
                  background: '#fafafa',
                  overflow: 'auto',
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: htmlOutput }}
              />
            )}
          </Card>

          <Card
            title={t.htmlOutput}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={copyHtml}>{t.copyHtml}</Button>}
            style={{ marginTop: 16 }}
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
              <code>{validAll ? htmlOutput : `<!-- ${t.invalidHex} -->`}</code>
            </pre>
          </Card>

          <Card
            title={t.textOutput}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={copyText}>{t.copyText}</Button>}
            style={{ marginTop: 16 }}
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 160 }}>
              <code>{textOutput || '—'}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.compatibilityTitle}
        description={t.compatibilityBody}
        style={{ marginTop: 24 }}
      />

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph type="secondary">{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </div>
  )
}
