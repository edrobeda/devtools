import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Tabs, Switch, Select,
  Table, Tag, Alert, Row, Col, message, Empty,
} from 'antd'
import {
  ProfileOutlined, BuildOutlined, CopyOutlined, ClearOutlined,
  FileTextOutlined, SafetyOutlined, GlobalOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseSetCookieList, parseCookieHeader, buildSetCookie,
  cookieToJson, createEmptyCookie, SAMPLE_SET_COOKIE, SAMPLE_COOKIE,
  SAME_SITE_OPTIONS, PRIORITY_OPTIONS, validatePrefixRules, detectCookieInputType,
} from '../utils/cookieTool'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

const sourceCode = [
  'function parseNameValue(pair) {',
  '  const idx = pair.indexOf("=")',
  '  if (idx === -1) return { name: pair.trim(), value: "" }',
  '  let name = pair.slice(0, idx).trim()',
  '  let value = pair.slice(idx + 1).trim()',
  '  if (value.length >= 2 && value.startsWith("\\"") && value.endsWith("\\"")) {',
  '    value = value.slice(1, -1)',
  '  }',
  '  return { name, value }',
  '}',
  '',
  'export function parseSetCookie(header) {',
  '  const parts = header.split(";")',
  '  const { name, value } = parseNameValue(parts[0].trim())',
  '  const cookie = { name, value, expires: "", maxAge: "", domain: "",',
  '    path: "", secure: false, httpOnly: false, sameSite: "",',
  '    partitioned: false, priority: "" }',
  '  for (const part of parts.slice(1)) {',
  '    const { name: attr, value: val } = parseNameValue(part.trim())',
  '    switch (attr.toLowerCase()) {',
  '      case "expires": cookie.expires = val; break',
  '      case "max-age": cookie.maxAge = val; break',
  '      case "domain": cookie.domain = val; break',
  '      case "path": cookie.path = val; break',
  '      case "secure": cookie.secure = true; break',
  '      case "httponly": cookie.httpOnly = true; break',
  '      case "samesite": cookie.sameSite = val; break',
  '      case "partitioned": cookie.partitioned = true; break',
  '      case "priority": cookie.priority = val; break',
  '    }',
  '  }',
  '  return cookie',
  '}',
  '',
  'export function buildSetCookie(cookie) {',
  '  const parts = [`${cookie.name}=${cookie.value}`]',
  '  if (cookie.expires) parts.push(`Expires=${cookie.expires}`)',
  '  if (cookie.maxAge) parts.push(`Max-Age=${cookie.maxAge}`)',
  '  if (cookie.domain) parts.push(`Domain=${cookie.domain}`)',
  '  if (cookie.path) parts.push(`Path=${cookie.path}`)',
  '  if (cookie.secure) parts.push("Secure")',
  '  if (cookie.httpOnly) parts.push("HttpOnly")',
  '  if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`)',
  '  if (cookie.partitioned) parts.push("Partitioned")',
  '  if (cookie.priority) parts.push(`Priority=${cookie.priority}`)',
  '  return parts.join("; ")',
  '}',
].join('\n')

const translations = {
  pt: {
    title: 'Cookie Parser / Builder',
    intro: (
      <>
        Analise cabeçalhos <Text code>Set-Cookie</Text> e <Text code>Cookie</Text>,
        visualize atributos (Expires, Max-Age, Domain, Path, Secure, HttpOnly,
        SameSite, Partitioned, Priority) e monte novos cookies do zero.
        Tudo roda no navegador: nenhum dado sai da máquina.
      </>
    ),
    parseTab: 'Analisar',
    buildTab: 'Montar',
    inputLabel: 'Cole o cabeçalho aqui',
    setCookiePlaceholder: 'Set-Cookie: sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Lax',
    cookiePlaceholder: 'Cookie: sessionId=abc123; theme=dark; lang=pt-BR',
    detected: 'Detectado como',
    detectedSetCookie: 'Set-Cookie (resposta)',
    detectedCookie: 'Cookie (requisição)',
    sample: 'Exemplo',
    clear: 'Limpar',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyJson: 'Copiar JSON',
    noResults: 'Nenhum cookie encontrado no texto colado.',
    resultCount: (n) => `${n} cookie${n === 1 ? '' : 's'}`,
    name: 'Nome',
    value: 'Valor',
    expires: 'Expires',
    maxAge: 'Max-Age',
    domain: 'Domain',
    path: 'Path',
    secure: 'Secure',
    httpOnly: 'HttpOnly',
    sameSite: 'SameSite',
    partitioned: 'Partitioned',
    priority: 'Priority',
    jsonPreview: 'Preview JSON',
    builderOutput: 'Set-Cookie gerado',
    warnings: 'Avisos',
    encodeValue: 'Codificar valor (percent-encoding)',
    sampleSetCookie: 'Exemplo Set-Cookie',
    sampleCookie: 'Exemplo Cookie',
    sourceTitle: 'Código-fonte do motor',
    note: 'O parser segue a RFC 6265 de forma prática: reconhece atributos case-insensitivos, remove aspas do valor e ignora campos desconhecidos. Prefixos __Host- e __Secure- são validados contra as regras mínimas do navegador.',
  },
  en: {
    title: 'Cookie Parser / Builder',
    intro: (
      <>
        Parse <Text code>Set-Cookie</Text> and <Text code>Cookie</Text> headers,
        inspect attributes (Expires, Max-Age, Domain, Path, Secure, HttpOnly,
        SameSite, Partitioned, Priority) and build new cookies from scratch.
        Everything runs in the browser: no data leaves your machine.
      </>
    ),
    parseTab: 'Parse',
    buildTab: 'Build',
    inputLabel: 'Paste the header here',
    setCookiePlaceholder: 'Set-Cookie: sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Lax',
    cookiePlaceholder: 'Cookie: sessionId=abc123; theme=dark; lang=pt-BR',
    detected: 'Detected as',
    detectedSetCookie: 'Set-Cookie (response)',
    detectedCookie: 'Cookie (request)',
    sample: 'Sample',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Copied!',
    copyJson: 'Copy JSON',
    noResults: 'No cookies found in the pasted text.',
    resultCount: (n) => `${n} cookie${n === 1 ? '' : 's'}`,
    name: 'Name',
    value: 'Value',
    expires: 'Expires',
    maxAge: 'Max-Age',
    domain: 'Domain',
    path: 'Path',
    secure: 'Secure',
    httpOnly: 'HttpOnly',
    sameSite: 'SameSite',
    partitioned: 'Partitioned',
    priority: 'Priority',
    jsonPreview: 'JSON preview',
    builderOutput: 'Generated Set-Cookie',
    warnings: 'Warnings',
    encodeValue: 'Encode value (percent-encoding)',
    sampleSetCookie: 'Set-Cookie sample',
    sampleCookie: 'Cookie sample',
    sourceTitle: 'Engine source code',
    note: 'The parser follows RFC 6265 in a practical way: attributes are case-insensitive, surrounding quotes are stripped from the value and unknown fields are ignored. __Host- and __Secure- prefixes are validated against the browser minimum rules.',
  },
}

export default function CookieToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [parseText, setParseText] = useState(SAMPLE_SET_COOKIE)
  const [cookie, setCookie] = useState(createEmptyCookie)
  const [encodeValue, setEncodeValue] = useState(false)

  const detectedType = useMemo(() => detectCookieInputType(parseText), [parseText])

  const parsedSetCookies = useMemo(
    () => (detectedType === 'set-cookie' ? parseSetCookieList(parseText) : []),
    [parseText, detectedType]
  )
  const parsedCookies = useMemo(
    () => (detectedType === 'cookie' ? parseCookieHeader(parseText) : []),
    [parseText, detectedType]
  )

  const parsedJson = useMemo(() => {
    if (detectedType === 'set-cookie') {
      return parsedSetCookies.map(cookieToJson)
    }
    return parsedCookies
  }, [parsedSetCookies, parsedCookies, detectedType])

  const setCookieOutput = useMemo(
    () => buildSetCookie(cookie, { encodeValue }),
    [cookie, encodeValue]
  )
  const warnings = useMemo(() => validatePrefixRules(cookie), [cookie])

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      message.success(t.copied)
    } catch {
      message.error('Copy failed')
    }
  }

  const setCookieColumns = [
    { title: t.name, dataIndex: 'name', key: 'name', render: (v) => <Text code>{v}</Text> },
    {
      title: t.value,
      dataIndex: 'value',
      key: 'value',
      render: (v) => <Text style={{ wordBreak: 'break-all' }}>{v}</Text>,
    },
    {
      title: t.sameSite,
      dataIndex: 'sameSite',
      key: 'sameSite',
      render: (v) => v && <Tag color="blue">{v}</Tag>,
    },
    {
      title: t.secure,
      dataIndex: 'secure',
      key: 'secure',
      render: (v) => v && <Tag color="green"><SafetyOutlined /> Secure</Tag>,
    },
    {
      title: t.httpOnly,
      dataIndex: 'httpOnly',
      key: 'httpOnly',
      render: (v) => v && <Tag color="orange">HttpOnly</Tag>,
    },
    {
      title: t.path,
      dataIndex: 'path',
      key: 'path',
      render: (v) => v && <Tag>{v}</Tag>,
    },
    {
      title: t.domain,
      dataIndex: 'domain',
      key: 'domain',
      render: (v) => v && <Tag icon={<GlobalOutlined />}>{v}</Tag>,
    },
    {
      title: t.expires,
      dataIndex: 'expires',
      key: 'expires',
      render: (v) => v && <Tag icon={<ClockCircleOutlined />}>{v}</Tag>,
    },
  ]

  const cookieColumns = [
    { title: t.name, dataIndex: 'name', key: 'name', render: (v) => <Text code>{v}</Text> },
    {
      title: t.value,
      dataIndex: 'value',
      key: 'value',
      render: (v) => <Text style={{ wordBreak: 'break-all' }}>{v}</Text>,
    },
  ]

  function updateField(field, value) {
    setCookie((prev) => ({ ...prev, [field]: value }))
  }

  const results = detectedType === 'set-cookie' ? parsedSetCookies : parsedCookies
  const resultColumns = detectedType === 'set-cookie' ? setCookieColumns : cookieColumns

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ProfileOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Tabs defaultActiveKey="parse" type="card">
        <TabPane tab={<span><ProfileOutlined /> {t.parseTab}</span>} key="parse">
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col>
                  <Text type="secondary">{t.detected}:</Text>
                </Col>
                <Col>
                  <Tag color={detectedType === 'set-cookie' ? 'purple' : 'cyan'}>
                    {detectedType === 'set-cookie' ? t.detectedSetCookie : t.detectedCookie}
                  </Tag>
                </Col>
              </Row>
              <TextArea
                rows={8}
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder={t.setCookiePlaceholder}
                spellCheck={false}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
              />
              <Space wrap>
                <Button onClick={() => setParseText(SAMPLE_SET_COOKIE)} icon={<FileTextOutlined />}>
                  {t.sampleSetCookie}
                </Button>
                <Button onClick={() => setParseText(SAMPLE_COOKIE)} icon={<FileTextOutlined />}>
                  {t.sampleCookie}
                </Button>
                <Button onClick={() => setParseText('')} icon={<ClearOutlined />} disabled={!parseText}>
                  {t.clear}
                </Button>
              </Space>
            </Space>
          </Card>

          {results.length > 0 && (
            <Card
              title={
                <Space>
                  <span>{t.resultCount(results.length)}</span>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(JSON.stringify(parsedJson, null, 2))}>
                    {t.copyJson}
                  </Button>
                </Space>
              }
            >
              <Table
                dataSource={results}
                columns={resultColumns}
                rowKey={(record, idx) => `${record.name}-${idx}`}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </Card>
          )}

          {results.length === 0 && parseText.trim() && (
            <Empty description={t.noResults} />
          )}

          {results.length > 0 && (
            <Card title={t.jsonPreview}>
              <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
                <code>{JSON.stringify(parsedJson, null, 2)}</code>
              </pre>
            </Card>
          )}
        </TabPane>

        <TabPane tab={<span><BuildOutlined /> {t.buildTab}</span>} key="build">
          <Card title={t.buildTab}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.name}</Text>
                  <Input
                    value={cookie.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="sessionId"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.value}</Text>
                  <Input
                    value={cookie.value}
                    onChange={(e) => updateField('value', e.target.value)}
                    placeholder="abc123"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.domain}</Text>
                  <Input
                    value={cookie.domain}
                    onChange={(e) => updateField('domain', e.target.value)}
                    placeholder="example.com"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.path}</Text>
                  <Input
                    value={cookie.path}
                    onChange={(e) => updateField('path', e.target.value)}
                    placeholder="/"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.expires}</Text>
                  <Input
                    value={cookie.expires}
                    onChange={(e) => updateField('expires', e.target.value)}
                    placeholder="Wed, 21 Oct 2025 07:28:00 GMT"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.maxAge}</Text>
                  <Input
                    value={cookie.maxAge}
                    onChange={(e) => updateField('maxAge', e.target.value)}
                    placeholder="2592000"
                    type="number"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.sameSite}</Text>
                  <Select
                    value={cookie.sameSite || undefined}
                    onChange={(v) => updateField('sameSite', v)}
                    style={{ width: '100%' }}
                    allowClear
                    placeholder="SameSite"
                  >
                    {SAME_SITE_OPTIONS.map((opt) => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.priority}</Text>
                  <Select
                    value={cookie.priority || undefined}
                    onChange={(v) => updateField('priority', v)}
                    style={{ width: '100%' }}
                    allowClear
                    placeholder="Priority"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <Row gutter={[16, 16]} align="middle">
                <Col>
                  <Space>
                    <Switch checked={cookie.secure} onChange={(v) => updateField('secure', v)} />
                    <Text type="secondary">{t.secure}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Switch checked={cookie.httpOnly} onChange={(v) => updateField('httpOnly', v)} />
                    <Text type="secondary">{t.httpOnly}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Switch checked={cookie.partitioned} onChange={(v) => updateField('partitioned', v)} />
                    <Text type="secondary">{t.partitioned}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Switch checked={encodeValue} onChange={setEncodeValue} />
                    <Text type="secondary">{t.encodeValue}</Text>
                  </Space>
                </Col>
              </Row>

              {warnings.length > 0 && (
                <Alert type="warning" showIcon message={t.warnings} description={warnings.join(' · ')} />
              )}
            </Space>
          </Card>

          <Card
            title={t.builderOutput}
            extra={
              <Button icon={<CopyOutlined />} onClick={() => copy(setCookieOutput)}>
                {t.copy}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
              <code>{setCookieOutput}</code>
            </pre>
          </Card>

        </TabPane>
      </Tabs>

      <Alert type="info" showIcon message={t.note} />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
