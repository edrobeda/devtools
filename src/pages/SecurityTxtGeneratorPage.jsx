import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Row,
  Col,
  Alert,
  Collapse,
  message,
  List,
  Tag,
} from 'antd'
import { SafetyOutlined, CopyOutlined, DownloadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildSecurityTxt, PRESETS, validateSecurityTxt } from '../utils/securityTxtGenerator'

const { Title, Paragraph, Text } = Typography

const SOURCE = `
function escapeField(value) {
  return String(value).replace(/\\n/g, ' ').replace(/\\r/g, '').trim()
}

export function buildSecurityTxt(options) {
  const lines = []

  const contacts = (options.contact || [])
    .map((c) => String(c).trim())
    .filter(Boolean)

  contacts.forEach((c) => {
    lines.push(\`Contact: \${escapeField(c)}\`)
  })

  if (options.expires) {
    lines.push(\`Expires: \${escapeField(options.expires)}\`)
  }

  ;[
    'acknowledgments', 'canonical', 'encryption',
    'hiring', 'policy', 'preferredLanguages', 'csaf',
  ].forEach((key) => {
    const value = options[key]
    if (value && String(value).trim()) {
      lines.push(\`\${FIELD_NAMES[key]}: \${escapeField(value)}\`)
    }
  })

  const text = lines.join('\\n')
  return text.endsWith('\\n') ? text : \`\${text}\\n\`
}
`

const translations = {
  pt: {
    title: 'Gerador de security.txt',
    intro: (
      <>
        Monta o arquivo <Text code>security.txt</Text> no formato definido pela{' '}
        <Text strong>RFC 9116</Text>. Esse arquivo costuma ficar em{' '}
        <Text code>/.well-known/security.txt</Text> e informa pesquisadores de
        segurança como reportar vulnerabilidades. Tudo acontece no navegador —
        nenhum dado sai daqui.
      </>
    ),
    presets: 'Modelos de um clique',
    presetMinimal: 'Mínimo',
    presetComplete: 'Completo',
    fields: 'Campos',
    contacts: 'Contatos',
    contactsHint: 'Pelo menos um contato é obrigatório. Use mailto:, https:// ou telefone.',
    addContact: 'Adicionar contato',
    expires: 'Data de expiração',
    expiresHint: 'Quando as informações deste arquivo devem ser consideradas desatualizadas.',
    acknowledgments: 'Acknowledgments',
    acknowledgmentsHint: 'URL com a lista de pesquisadores reconhecidos.',
    canonical: 'Canonical',
    canonicalHint: 'URL canônica deste arquivo security.txt.',
    encryption: 'Encryption',
    encryptionHint: 'URL da chave PGP ou fingerprint openpgp4fpr:.',
    hiring: 'Hiring',
    hiringHint: 'URL da página de vagas de segurança.',
    policy: 'Policy',
    policyHint: 'URL da política de divulgação de vulnerabilidades.',
    preferredLanguages: 'Preferred-Languages',
    preferredLanguagesHint: 'Idiomas preferidos para comunicação (ex.: en, pt-BR).',
    csaf: 'CSAF',
    csafHint: 'URL do provider-metadata.json do CSAF (RFC 8322).',
    includeSignature: 'Incluir bloco de assinatura PGP (placeholder)',
    output: 'Arquivo gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar security.txt',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'O motor recebe os campos preenchidos, valida os contatos obrigatórios e a data de expiração, e monta o texto no formato chave: valor da RFC 9116.',
    tipsTitle: 'Antes de usar',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Os campos <Text strong>Contact</Text> e <Text strong>Expires</Text> são obrigatórios.
        </li>
        <li>
          Publique o arquivo em <Text code>/.well-known/security.txt</Text> e,
          se quiser redundância, também em <Text code>/security.txt</Text>.
        </li>
        <li>
          Use HTTPS para todos os links. Se usar assinatura PGP, assine o arquivo
          de verdade e substitua o placeholder.
        </li>
        <li>
          Teste o resultado no validador oficial:{' '}
          <Text code>securitytxt.org</Text>.
        </li>
      </ul>
    ),
    errorContactRequired: 'Adicione pelo menos um contato.',
    errorExpiresRequired: 'Informe a data de expiração.',
    errorExpiresInvalid: 'Data de expiração inválida.',
    warningContactInvalid: 'Um dos contatos não parece ser email, URL ou telefone.',
    warningUrl: (field) => `O campo ${field} não parece ser uma URL http/https.`,
    warningEncryption: 'O campo Encryption deve ser uma URL ou fingerprint openpgp4fpr:.',
    warningCanonicalMultiple: 'Canonical deve conter apenas uma URL.',
  },
  en: {
    title: 'security.txt Generator',
    intro: (
      <>
        Builds the <Text code>security.txt</Text> file in the format defined by{' '}
        <Text strong>RFC 9116</Text>. This file usually lives at{' '}
        <Text code>/.well-known/security.txt</Text> and tells security researchers
        how to report vulnerabilities. Everything happens in the browser — no
        data leaves this page.
      </>
    ),
    presets: 'One-click templates',
    presetMinimal: 'Minimal',
    presetComplete: 'Complete',
    fields: 'Fields',
    contacts: 'Contacts',
    contactsHint: 'At least one contact is required. Use mailto:, https:// or a phone number.',
    addContact: 'Add contact',
    expires: 'Expiration date',
    expiresHint: 'When the information in this file should be considered stale.',
    acknowledgments: 'Acknowledgments',
    acknowledgmentsHint: 'URL listing acknowledged security researchers.',
    canonical: 'Canonical',
    canonicalHint: 'Canonical URL of this security.txt file.',
    encryption: 'Encryption',
    encryptionHint: 'URL to the PGP key or openpgp4fpr: fingerprint.',
    hiring: 'Hiring',
    hiringHint: 'URL of the security jobs page.',
    policy: 'Policy',
    policyHint: 'URL of the vulnerability disclosure policy.',
    preferredLanguages: 'Preferred-Languages',
    preferredLanguagesHint: 'Preferred languages for communication (e.g. en, pt-BR).',
    csaf: 'CSAF',
    csafHint: 'URL of the CSAF provider-metadata.json (RFC 8322).',
    includeSignature: 'Include PGP signature block (placeholder)',
    output: 'Generated file',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download security.txt',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'The engine takes the filled fields, validates the required contacts and expiration date, and builds the key: value text in RFC 9116 format.',
    tipsTitle: 'Before you use it',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          The <Text strong>Contact</Text> and <Text strong>Expires</Text> fields are required.
        </li>
        <li>
          Publish the file at <Text code>/.well-known/security.txt</Text> and,
          for redundancy, also at <Text code>/security.txt</Text>.
        </li>
        <li>
          Use HTTPS for every link. If signing with PGP, sign the file for real
          and replace the placeholder.
        </li>
        <li>
          Test the result with the official validator:{' '}
          <Text code>securitytxt.org</Text>.
        </li>
      </ul>
    ),
    errorContactRequired: 'Add at least one contact.',
    errorExpiresRequired: 'Inform the expiration date.',
    errorExpiresInvalid: 'Invalid expiration date.',
    warningContactInvalid: 'One of the contacts does not look like an email, URL or phone number.',
    warningUrl: (field) => `The ${field} field does not look like an http/https URL.`,
    warningEncryption: 'The Encryption field should be a URL or an openpgp4fpr: fingerprint.',
    warningCanonicalMultiple: 'Canonical should contain only one URL.',
  },
}

const FIELD_LABELS = {
  acknowledgments: 'Acknowledgments',
  canonical: 'Canonical',
  encryption: 'Encryption',
  hiring: 'Hiring',
  policy: 'Policy',
  csaf: 'CSAF',
}

export default function SecurityTxtGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState(() => JSON.parse(JSON.stringify(PRESETS.complete)))

  function applyPreset(key) {
    setOptions(JSON.parse(JSON.stringify(PRESETS[key])))
  }

  function setOpt(key, value) {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  function setContact(index, value) {
    setOptions((prev) => {
      const next = [...prev.contact]
      next[index] = value
      return { ...prev, contact: next }
    })
  }

  function addContact() {
    setOptions((prev) => ({ ...prev, contact: [...prev.contact, ''] }))
  }

  function removeContact(index) {
    setOptions((prev) => ({
      ...prev,
      contact: prev.contact.filter((_, i) => i !== index),
    }))
  }

  const output = useMemo(() => buildSecurityTxt(options), [options])
  const validation = useMemo(() => validateSecurityTxt(options), [options])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  function handleDownload() {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'security.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function errorMessage(key) {
    switch (key) {
      case 'contactRequired': return t.errorContactRequired
      case 'expiresRequired': return t.errorExpiresRequired
      case 'expiresInvalid': return t.errorExpiresInvalid
      default: return key
    }
  }

  function warningMessage(key) {
    switch (key) {
      case 'contactLooksInvalid': return t.warningContactInvalid
      case 'acknowledgmentsNotUrl': return t.warningUrl('Acknowledgments')
      case 'canonicalNotUrl': return t.warningUrl('Canonical')
      case 'encryptionNotUrlOrFingerprint': return t.warningEncryption
      case 'hiringNotUrl': return t.warningUrl('Hiring')
      case 'policyNotUrl': return t.warningUrl('Policy')
      case 'csafNotUrl': return t.warningUrl('CSAF')
      case 'canonicalMultiple': return t.warningCanonicalMultiple
      default: return key
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      {validation.errors.length > 0 && (
        <Alert
          type="error"
          showIcon
          message="Erros de validação"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {validation.errors.map((e) => (
                <li key={e}>{errorMessage(e)}</li>
              ))}
            </ul>
          }
        />
      )}
      {validation.warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Avisos"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {validation.warnings.map((w) => (
                <li key={w}>{warningMessage(w)}</li>
              ))}
            </ul>
          }
        />
      )}

      <Card title={t.presets}>
        <Space wrap>
          <Button onClick={() => applyPreset('minimal')}>{t.presetMinimal}</Button>
          <Button onClick={() => applyPreset('complete')}>{t.presetComplete}</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={t.fields}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.contacts}</Text>
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                  {t.contactsHint}
                </Paragraph>
                <List
                  size="small"
                  dataSource={options.contact}
                  renderItem={(value, index) => (
                    <List.Item
                      style={{ paddingLeft: 0, paddingRight: 0 }}
                      actions={[
                        <Button
                          key="remove"
                          type="text"
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeContact(index)}
                          disabled={options.contact.length <= 1}
                        />,
                      ]}
                    >
                      <Input
                        value={value}
                        onChange={(e) => setContact(index, e.target.value)}
                        placeholder="mailto:security@example.com"
                        style={{ width: '100%' }}
                      />
                    </List.Item>
                  )}
                />
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addContact} style={{ marginTop: 8 }}>
                  {t.addContact}
                </Button>
              </div>

              <div>
                <Text strong>{t.expires}</Text>
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                  {t.expiresHint}
                </Paragraph>
                <Input
                  type="datetime-local"
                  value={options.expires}
                  onChange={(e) => setOpt('expires', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {[
                { key: 'acknowledgments', placeholder: 'https://example.com/security/hall-of-fame' },
                { key: 'canonical', placeholder: 'https://example.com/.well-known/security.txt' },
                { key: 'encryption', placeholder: 'https://example.com/security/pgp-key.txt' },
                { key: 'hiring', placeholder: 'https://example.com/careers#security' },
                { key: 'policy', placeholder: 'https://example.com/security/policy' },
                { key: 'csaf', placeholder: 'https://example.com/.well-known/csaf/provider-metadata.json' },
              ].map(({ key, placeholder }) => (
                <div key={key}>
                  <Text strong>{FIELD_LABELS[key]}</Text>
                  <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                    {t[`${key}Hint`]}
                  </Paragraph>
                  <Input
                    value={options[key]}
                    onChange={(e) => setOpt(key, e.target.value)}
                    placeholder={placeholder}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}

              <div>
                <Text strong>{t.preferredLanguages}</Text>
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                  {t.preferredLanguagesHint}
                </Paragraph>
                <Input
                  value={options.preferredLanguages}
                  onChange={(e) => setOpt('preferredLanguages', e.target.value)}
                  placeholder="en, pt-BR"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <Tag color="blue">RFC 9116</Tag>
                <Tag color="blue">CSAF</Tag>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={t.output}
            extra={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
                </Text>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload} disabled={!output}>{t.download}</Button>
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
                maxHeight: 520,
                fontSize: 12.5,
                lineHeight: 1.6,
              }}
            >
              <code>{output || ' '}</code>
            </pre>
          </Card>
        </Col>
      </Row>

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
