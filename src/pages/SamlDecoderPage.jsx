import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Descriptions,
  Tag,
  Tabs,
  Table,
  Collapse,
  message,
  Empty,
} from 'antd'
import {
  SafetyOutlined,
  CopyOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  prepareInput,
  parseSaml,
  validityStatus,
  relativeAmount,
  getEngineSource,
} from '../utils/samlDecoder'

const { Title, Paragraph, Text } = Typography

const MIN = 60000

function buildSampleXml({ expired = false } = {}) {
  const now = Date.now()
  const notBefore = new Date(now - 5 * MIN).toISOString()
  const notOnOrAfter = expired
    ? new Date(now - 90 * MIN).toISOString()
    : new Date(now + 30 * MIN).toISOString()
  const authnInstant = new Date(now - 12 * MIN).toISOString()
  return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_2dfc8e0e5a3f41c4b7d99f6a1c5e8b4a" Version="2.0" IssueInstant="${notBefore}" Destination="https://sp.example.com/acs">
  <saml:Issuer>https://idp.example.com/idp</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion ID="_a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4" Version="2.0" IssueInstant="${authnInstant}">
    <saml:Issuer>https://idp.example.com/idp</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">patricia.santos@example.com</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData Recipient="https://sp.example.com/acs" NotOnOrAfter="${notOnOrAfter}"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${notOnOrAfter}">
      <saml:AudienceRestriction>
        <saml:Audience>https://sp.example.com/app</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="${authnInstant}" SessionIndex="_s3ss10n42">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>patricia.santos@example.com</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="givenName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="First name">
        <saml:AttributeValue>Patricia</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="sn" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="Last name">
        <saml:AttributeValue>Santos</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="memberOf" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>CN=DevTeam,OU=Groups,DC=example,DC=com</saml:AttributeValue>
        <saml:AttributeValue>CN=DevToolsAdmins,OU=Groups,DC=example,DC=com</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`
}

// base64 de uma string (XML do exemplo é ASCII — btoa é seguro).
function toBase64(s) {
  return btoa(s)
}

const translations = {
  pt: {
    title: 'Decodificador SAML',
    intro: (
      <>
        Decodifica <Text code>SAMLResponse</Text> e assertions SAML 2.0 do
        fluxo de SSO — aceita o XML cru, o base64 do valor do formulário do
        IdP ou o corpo do POST inteiro — e mostra issuers, subject, janela de
        validade, atributos e assinatura. 100% no navegador; nada sai daqui.
      </>
    ),
    inputTitle: 'Entrada (XML, base64 ou corpo do POST)',
    inputPlaceholder:
      'Cole o SAMLResponse=… base64, o XML da assertion ou o corpo do POST completo…',
    examples: 'Exemplos',
    validSample: 'Válido',
    expiredSample: 'Expirado',
    rawXmlSample: 'XML cru',
    invalidAlert: 'Não consegui interpretar a entrada como SAML. Confira se é o valor de SAMLResponse= (base64) ou o XML da assertion.',
    emptyAlert: 'Cole um SAMLResponse= (base64), o XML da assertion ou o corpo do POST para decodificar.',
    validityTitle: 'Validade',
    validityUnknown: 'Sem janela de validade (NotBefore/NotOnOrAfter ausentes).',
    statusValid: 'Válido',
    statusNotYet: 'Ainda não é válido',
    statusExpired: 'Expirado',
    validFor: 'Válido por mais',
    expiredFor: 'Expirado há',
    notYetFor: 'Válido em',
    validSince: 'Válido desde',
    overviewTitle: 'Visão geral',
    rootName: 'Documento',
    id: 'ID',
    version: 'Versão',
    issueInstant: 'Emitido em',
    destination: 'Destination',
    issuer: 'Issuer',
    notBefore: 'NotBefore',
    notOnOrAfter: 'NotOnOrAfter',
    tabsSubject: 'Subject',
    tabsConditions: 'Conditions',
    tabsAuthn: 'Autenticação',
    tabsAttributes: 'Atributos',
    tabsSignature: 'Assinatura',
    tabsXml: 'XML',
    nameId: 'NameID',
    nameIdFormat: 'Formato do NameID',
    nameIdQualifier: 'NameQualifier',
    confirmationMethod: 'Método',
    recipient: 'Recipient',
    confirmationDataNotOnOrAfter: 'Confirmação válida até',
    noSubject: 'Nenhum Subject encontrado.',
    audience: 'Audience',
    noAudience: 'Nenhuma Audience.',
    authnInstant: 'AuthnInstant',
    sessionIndex: 'SessionIndex',
    authnContext: 'Contexto de autenticação',
    noAuthn: 'Nenhum AuthnStatement.',
    attrFilter: 'Filtrar atributos',
    attrName: 'Nome',
    attrFormat: 'NameFormat',
    attrFriendly: 'FriendlyName',
    attrValues: 'Valores',
    noAttributes: 'Nenhum atributo nesta assertion.',
    signatureAlgo: 'Algoritmo de assinatura',
    signatureDigestAlgo: 'Algoritmo de digest',
    signatureValue: 'SignatureValue',
    certificate: 'Certificado X.509',
    noSignature: 'Esta assertion não contém <Signature> — a integridade não é verificável sem a chave pública do IdP.',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyXml: 'Copiar XML',
    decodeHint: 'A assinatura é apenas exibida — verificar a criptografia exige a chave pública do IdP.',
    source: 'Código-fonte do motor',
  },
  en: {
    title: 'SAML Decoder',
    intro: (
      <>
        Decode <Text code>SAMLResponse</Text> values and SAML 2.0 assertions
        from SSO flows — accepts the raw XML, the base64 form value from the
        IdP, or the whole POST body — and shows issuers, subject, validity
        window, attributes and signature. 100% in the browser; nothing leaves
        here.
      </>
    ),
    inputTitle: 'Input (XML, base64 or POST body)',
    inputPlaceholder:
      'Paste the SAMLResponse=… base64, the assertion XML or the full POST body…',
    examples: 'Examples',
    validSample: 'Valid',
    expiredSample: 'Expired',
    rawXmlSample: 'Raw XML',
    invalidAlert: 'Could not interpret the input as SAML. Check that it is the SAMLResponse= value (base64) or the assertion XML.',
    emptyAlert: 'Paste a SAMLResponse= (base64), the assertion XML or the POST body to decode.',
    validityTitle: 'Validity',
    validityUnknown: 'No validity window (NotBefore/NotOnOrAfter missing).',
    statusValid: 'Valid',
    statusNotYet: 'Not yet valid',
    statusExpired: 'Expired',
    validFor: 'Valid for another',
    expiredFor: 'Expired',
    notYetFor: 'Valid in',
    validSince: 'Valid since',
    overviewTitle: 'Overview',
    rootName: 'Document',
    id: 'ID',
    version: 'Version',
    issueInstant: 'Issued at',
    destination: 'Destination',
    issuer: 'Issuer',
    notBefore: 'NotBefore',
    notOnOrAfter: 'NotOnOrAfter',
    tabsSubject: 'Subject',
    tabsConditions: 'Conditions',
    tabsAuthn: 'Authentication',
    tabsAttributes: 'Attributes',
    tabsSignature: 'Signature',
    tabsXml: 'XML',
    nameId: 'NameID',
    nameIdFormat: 'NameID format',
    nameIdQualifier: 'NameQualifier',
    confirmationMethod: 'Method',
    recipient: 'Recipient',
    confirmationDataNotOnOrAfter: 'Confirmation valid until',
    noSubject: 'No Subject found.',
    audience: 'Audience',
    noAudience: 'No Audience.',
    authnInstant: 'AuthnInstant',
    sessionIndex: 'SessionIndex',
    authnContext: 'Authn context',
    noAuthn: 'No AuthnStatement.',
    attrFilter: 'Filter attributes',
    attrName: 'Name',
    attrFormat: 'NameFormat',
    attrFriendly: 'FriendlyName',
    attrValues: 'Values',
    noAttributes: 'No attributes in this assertion.',
    signatureAlgo: 'Signature algorithm',
    signatureDigestAlgo: 'Digest algorithm',
    signatureValue: 'SignatureValue',
    certificate: 'X.509 certificate',
    noSignature: 'This assertion has no <Signature> — integrity cannot be verified without the IdP public key.',
    copy: 'Copy',
    copied: 'Copied!',
    copyXml: 'Copy XML',
    decodeHint: 'The signature is only displayed — verifying it requires the IdP public key.',
    source: 'Engine source code',
  },
}

export default function SamlDecoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState(() => toBase64(buildSampleXml()))
  const [attrFilter, setAttrFilter] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) return null
    const prepared = prepareInput(input)
    if (!prepared.ok) return { error: prepared.error }
    return parseSaml(prepared.xml)
  }, [input])

  const decodedXml = useMemo(() => {
    if (!result || !result.ok) return ''
    const prepared = prepareInput(input)
    return prepared.ok ? prepared.xml : ''
  }, [input, result])

  const validity = useMemo(() => {
    if (!result || !result.ok) return null
    return validityStatus(result.conditions.notBefore, result.conditions.notOnOrAfter)
  }, [result])

  const filteredAttributes = useMemo(() => {
    if (!result || !result.ok) return []
    const q = attrFilter.trim().toLowerCase()
    if (!q) return result.attributes
    return result.attributes.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.friendlyName || '').toLowerCase().includes(q) ||
        a.values.some((v) => v.toLowerCase().includes(q))
    )
  }, [result, attrFilter])

  const validityTag = useMemo(() => {
    if (!validity) return null
    switch (validity.status) {
      case 'valid':
        return <Tag color="green">{t.statusValid}</Tag>
      case 'notYet':
        return <Tag color="orange">{t.statusNotYet}</Tag>
      case 'expired':
        return <Tag color="red">{t.statusExpired}</Tag>
      default:
        return <Tag>{t.validityUnknown}</Tag>
    }
  }, [validity, t])

  function handleCopy(text, label = t.copied) {
    navigator.clipboard.writeText(text)
    message.success(label)
  }

  const now = new Date()

  // Frase de validade em linguagem natural, no idioma da página.
  function validitySentence() {
    if (!validity) return '-'
    if (validity.status === 'unknown') return t.validityUnknown
    const amt = relativeAmount(
      validity.status === 'expired' ? validity.notOnOrAfter : validity.notOnOrAfter || validity.notBefore,
      now
    )
    if (validity.status === 'valid') return `${t.validFor} ${amt}`
    if (validity.status === 'expired') return `${t.expiredFor} ${amt}`
    return `${t.notYetFor} ${amt}`
  }

  const overviewItems = result && result.ok
    ? [
        { key: 'doc', label: t.rootName, children: result.root.name },
        { key: 'id', label: t.id, children: result.root.id ? <Text code>{result.root.id}</Text> : '-' },
        { key: 'ver', label: t.version, children: result.root.version || '-' },
        { key: 'issue', label: t.issueInstant, children: result.root.issueInstant || '-' },
        { key: 'dest', label: t.destination, children: result.root.destination || '-' },
        { key: 'issuer', label: t.issuer, children: result.issuer ? <Text code>{result.issuer}</Text> : '-' },
      ]
    : []

  const subjectItems = result && result.ok
    ? [
        { key: 'nameid', label: t.nameId, children: result.subject.nameId || '-' },
        { key: 'fmt', label: t.nameIdFormat, children: result.subject.nameIdFormat || '-' },
        { key: 'qual', label: t.nameIdQualifier, children: result.subject.nameIdQualifier || '-' },
        { key: 'method', label: t.confirmationMethod, children: result.subject.confirmationMethod || '-' },
        { key: 'recipient', label: t.recipient, children: result.subject.confirmationData?.recipient || '-' },
        {
          key: 'confnoa',
          label: t.confirmationDataNotOnOrAfter,
          children: result.subject.confirmationData?.notOnOrAfter || '-',
        },
      ]
    : []

  const conditionsItems = result && result.ok
    ? [
        { key: 'nb', label: t.notBefore, children: result.conditions.notBefore || '-' },
        { key: 'noa', label: t.notOnOrAfter, children: result.conditions.notOnOrAfter || '-' },
        {
          key: 'aud',
          label: t.audience,
          children: result.conditions.audiences.length ? (
            <Space wrap>
              {result.conditions.audiences.map((a) => (
                <Tag key={a}>{a}</Tag>
              ))}
            </Space>
          ) : (
            t.noAudience
          ),
        },
      ]
    : []

  const authnItems = result && result.ok && result.authn
    ? [
        { key: 'inst', label: t.authnInstant, children: result.authn.authnInstant || '-' },
        { key: 'sess', label: t.sessionIndex, children: result.authn.sessionIndex || '-' },
        { key: 'ctx', label: t.authnContext, children: result.authn.contextClassRef || '-' },
      ]
    : []

  const attrColumns = [
    { title: t.attrName, dataIndex: 'name', key: 'name', render: (v) => (v ? <Text code>{v}</Text> : '-') },
    { title: t.attrFormat, dataIndex: 'nameFormat', key: 'nameFormat', render: (v) => v || '-' },
    { title: t.attrFriendly, dataIndex: 'friendlyName', key: 'friendlyName', render: (v) => v || '-' },
    {
      title: t.attrValues,
      dataIndex: 'values',
      key: 'values',
      render: (v) => (v && v.length ? v.map((x) => <Tag key={x} style={{ marginBottom: 4 }}>{x}</Tag>) : '-'),
    },
  ]

  const signatureEl = result && result.ok && result.signature ? (
    <Descriptions column={1} bordered size="small" items={[
      { key: 'algo', label: t.signatureAlgo, children: result.signature.algorithm || '-' },
      { key: 'digest', label: t.signatureDigestAlgo, children: result.signature.digestAlgorithm || '-' },
      {
        key: 'sig',
        label: t.signatureValue,
        children: (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text code style={{ wordBreak: 'break-all' }}>{result.signature.signatureValue || '-'}</Text>
            {result.signature.signatureValue && (
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.signature.signatureValue)}>
                {t.copy}
              </Button>
            )}
          </Space>
        ),
      },
      {
        key: 'cert',
        label: t.certificate,
        children: result.signature.certificate ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text code style={{ wordBreak: 'break-all' }}>{result.signature.certificate}</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.signature.certificate)}>
              {t.copy}
            </Button>
          </Space>
        ) : (
          '-'
        ),
      },
    ]} />
  ) : (
    <Alert type="info" showIcon message={t.noSignature} />
  )

  const tabItems = [
    {
      key: 'subject',
      label: t.tabsSubject,
      children: result && result.ok ? (
        <Descriptions column={1} bordered size="small" items={subjectItems} />
      ) : (
        <Empty description={t.noSubject} />
      ),
    },
    {
      key: 'conditions',
      label: t.tabsConditions,
      children: <Descriptions column={1} bordered size="small" items={conditionsItems} />,
    },
    {
      key: 'authn',
      label: t.tabsAuthn,
      children: result && result.ok && result.authn ? (
        <Descriptions column={1} bordered size="small" items={authnItems} />
      ) : (
        <Empty description={t.noAuthn} />
      ),
    },
    {
      key: 'attributes',
      label: t.tabsAttributes,
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            allowClear
            value={attrFilter}
            onChange={(e) => setAttrFilter(e.target.value)}
            placeholder={t.attrFilter}
            style={{ maxWidth: 360 }}
          />
          <Table
            rowKey={(r) => `${r.name}-${r.values.join(',')}-${r.nameFormat}`}
            columns={attrColumns}
            dataSource={filteredAttributes}
            pagination={false}
            size="small"
            locale={{ emptyText: t.noAttributes }}
          />
        </Space>
      ),
    },
    {
      key: 'signature',
      label: t.tabsSignature,
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert type="info" showIcon message={t.decodeHint} />
          {signatureEl}
        </Space>
      ),
    },
    {
      key: 'xml',
      label: t.tabsXml,
      children: decodedXml ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button icon={<CopyOutlined />} onClick={() => handleCopy(decodedXml)}>
            {t.copyXml}
          </Button>
          <pre
            style={{
              margin: 0,
              maxHeight: 420,
              overflow: 'auto',
              background: 'rgba(0,0,0,0.03)',
              padding: 16,
              borderRadius: 8,
            }}
          >
            <code>{decodedXml}</code>
          </pre>
        </Space>
      ) : (
        <Empty />
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SafetyOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 10 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap>
            <Text type="secondary">{t.examples}</Text>
            <Button size="small" onClick={() => setInput(toBase64(buildSampleXml()))}>
              {t.validSample}
            </Button>
            <Button size="small" onClick={() => setInput(toBase64(buildSampleXml({ expired: true })))}>
              {t.expiredSample}
            </Button>
            <Button size="small" onClick={() => setInput(buildSampleXml())}>
              {t.rawXmlSample}
            </Button>
          </Space>
        </Space>
      </Card>

      {input.trim() && result && result.error === 'empty' && (
        <Alert type="info" showIcon message={t.emptyAlert} />
      )}
      {result && !result.ok && result.error !== 'empty' && (
        <Alert type="error" showIcon message={t.invalidAlert} />
      )}

      {result && result.ok && (
        <>
          <Card
            title={t.validityTitle}
            extra={validityTag}
          >
            <Descriptions column={1} bordered size="small" items={[
              {
                key: 'nb',
                label: t.notBefore,
                children: result.conditions.notBefore || '-',
              },
              {
                key: 'noa',
                label: t.notOnOrAfter,
                children: result.conditions.notOnOrAfter || '-',
              },
              {
                key: 'rel',
                label: validity.status === 'valid' ? t.validFor : t.validSince,
                children: validitySentence(),
              },
            ]} />
          </Card>

          <Card title={t.overviewTitle}>
            <Descriptions column={1} bordered size="small" items={overviewItems} />
          </Card>

          <Card>
            <Tabs items={tabItems} />
          </Card>

          <Collapse
            items={[
              {
                key: 'source',
                label: (
                  <Space>
                    <FileTextOutlined /> {t.source}
                  </Space>
                ),
                children: (
                  <pre style={{ margin: 0, overflowX: 'auto' }}>
                    <code>{getEngineSource()}</code>
                  </pre>
                ),
              },
            ]}
          />
        </>
      )}
    </Space>
  )
}
