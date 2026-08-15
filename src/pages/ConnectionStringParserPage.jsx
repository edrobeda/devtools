import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Tabs, Select, Tag,
  Descriptions, Alert, Row, Col, message, Empty,
} from 'antd'
import {
  DatabaseOutlined, ProfileOutlined, BuildOutlined,
  CopyOutlined, ClearOutlined, FileTextOutlined, SafetyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseConnectionString, buildConnectionString,
  SAMPLES, SCHEMES, schemeLabel, isSensitiveField,
} from '../utils/connectionStringParser'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

const sourceCode = [
  'import { parseConnectionString, buildConnectionString } from',
  '  "../utils/connectionStringParser"',
  '',
  '// Analisar uma URI de banco de dados',
  'const parsed = parseConnectionString("postgresql://u:p@host:5432/db")',
  '// parsed.host  -> "host"',
  '// parsed.port  -> "5432"',
  '// parsed.user  -> "u"',
  '// parsed.database -> "db"',
  '',
  '// Montar uma URI a partir de campos',
  'buildConnectionString({',
  '  scheme: "postgresql",',
  '  user: "u",',
  '  password: "p",',
  '  host: "host",',
  '  port: "5432",',
  '  database: "db",',
  '  params: { sslmode: "require" },',
  '})',
  '// -> "postgresql://u:p@host:5432/db?sslmode=require"',
].join('\n')

const translations = {
  pt: {
    title: 'Parser de Connection String',
    intro: (
      <>
        Analise e monte strings de conexão de bancos de dados 100% no navegador.
        Suporta PostgreSQL, MySQL, MariaDB, MongoDB, Redis, SQLite, SQL Server,
        Oracle, JDBC e ODBC. Nenhum dado sai da máquina.
      </>
    ),
    parseTab: 'Analisar',
    buildTab: 'Montar',
    inputLabel: 'Connection string',
    placeholder: 'postgresql://user:pass@host:5432/db?sslmode=require',
    detected: 'Scheme detectado',
    sample: 'Exemplo',
    clear: 'Limpar',
    copy: 'Copiar',
    copied: 'Copiado!',
    noResults: 'Nenhuma connection string válida encontrada.',
    components: 'Componentes',
    params: 'Parâmetros',
    jsonPreview: 'JSON',
    builderOutput: 'Connection string gerada',
    scheme: 'Scheme',
    host: 'Host',
    port: 'Porta',
    user: 'Usuário',
    password: 'Senha',
    database: 'Banco de dados',
    path: 'Caminho',
    driver: 'Driver',
    sensitiveWarning: 'Senha detectada — tome cuidado ao copiar.',
    addParam: 'Adicionar parâmetro',
    removeParam: 'Remover',
    paramKey: 'Chave',
    paramValue: 'Valor',
    sourceTitle: 'Código-fonte do motor',
    sourceIntro: 'O motor é puro JavaScript client-side e não envia dados para lugar nenhum.',
  },
  en: {
    title: 'Connection String Parser',
    intro: (
      <>
        Parse and build database connection strings 100% in the browser.
        Supports PostgreSQL, MySQL, MariaDB, MongoDB, Redis, SQLite, SQL Server,
        Oracle, JDBC and ODBC. No data leaves your machine.
      </>
    ),
    parseTab: 'Parse',
    buildTab: 'Build',
    inputLabel: 'Connection string',
    placeholder: 'postgresql://user:pass@host:5432/db?sslmode=require',
    detected: 'Detected scheme',
    sample: 'Sample',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Copied!',
    noResults: 'No valid connection string found.',
    components: 'Components',
    params: 'Parameters',
    jsonPreview: 'JSON',
    builderOutput: 'Generated connection string',
    scheme: 'Scheme',
    host: 'Host',
    port: 'Port',
    user: 'User',
    password: 'Password',
    database: 'Database',
    path: 'Path',
    driver: 'Driver',
    sensitiveWarning: 'Password detected — be careful when copying.',
    addParam: 'Add parameter',
    removeParam: 'Remove',
    paramKey: 'Key',
    paramValue: 'Value',
    sourceTitle: 'Engine source code',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere.',
  },
}

export default function ConnectionStringParserPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [parseText, setParseText] = useState(SAMPLES.postgresql)
  const [buildScheme, setBuildScheme] = useState('postgresql')
  const [buildHost, setBuildHost] = useState('localhost')
  const [buildPort, setBuildPort] = useState('5432')
  const [buildUser, setBuildUser] = useState('user')
  const [buildPassword, setBuildPassword] = useState('secret')
  const [buildDatabase, setBuildDatabase] = useState('mydb')
  const [buildParams, setBuildParams] = useState([{ key: 'sslmode', value: 'require' }])

  const parsed = useMemo(() => parseConnectionString(parseText), [parseText])
  const hasPassword = Boolean(parsed.password)

  const builtParamsObject = useMemo(() => {
    const obj = {}
    buildParams.forEach((p) => {
      if (p.key) obj[p.key] = p.value
    })
    return obj
  }, [buildParams])

  const builtString = useMemo(() => {
    return buildConnectionString({
      scheme: buildScheme,
      host: buildHost,
      port: buildPort,
      user: buildUser,
      password: buildPassword,
      database: buildDatabase,
      params: builtParamsObject,
    })
  }, [buildScheme, buildHost, buildPort, buildUser, buildPassword, buildDatabase, builtParamsObject])

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      message.success(t.copied)
    } catch {
      message.error('Copy failed')
    }
  }

  function updateParam(index, field, value) {
    setBuildParams((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  function addParam() {
    setBuildParams((prev) => [...prev, { key: '', value: '' }])
  }

  function removeParam(index) {
    setBuildParams((prev) => prev.filter((_, i) => i !== index))
  }

  const renderParsed = () => {
    if (!parseText.trim() || parsed.errors.length > 0 && !parsed.host && !parsed.database) {
      return <Empty description={t.noResults} />
    }

    const items = [
      { key: 'scheme', label: t.scheme, children: <Tag color="blue">{schemeLabel(parsed.scheme)}</Tag> },
      { key: 'host', label: t.host, children: parsed.host || '—' },
      { key: 'port', label: t.port, children: parsed.port || '—' },
      { key: 'user', label: t.user, children: parsed.user || '—' },
      { key: 'password', label: t.password, children: parsed.password ? '••••••••' : '—' },
      { key: 'database', label: t.database, children: parsed.database || '—' },
      { key: 'path', label: t.path, children: parsed.path || '—' },
      { key: 'driver', label: t.driver, children: parsed.driver || '—' },
    ].filter((i) => i.children !== undefined)

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {hasPassword && (
          <Alert type="warning" showIcon message={t.sensitiveWarning} icon={<SafetyOutlined />} />
        )}
        <Card title={t.components}>
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} items={items} />
        </Card>

        {Object.keys(parsed.params).length > 0 && (
          <Card title={t.params}>
            <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
              {Object.entries(parsed.params).map(([key, value]) => (
                <Descriptions.Item label={key} key={key}>
                  <Text style={{ wordBreak: 'break-all' }}>{String(value)}</Text>
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        )}

        {parsed.hosts.length > 0 && (
          <Card title="Hosts">
            <Space direction="vertical">
              {parsed.hosts.map((h, i) => (
                <Tag key={i}>{h.host}{h.port ? `:${h.port}` : ''}</Tag>
              ))}
            </Space>
          </Card>
        )}

        {parsed.warnings.length > 0 && (
          <Alert type="info" showIcon message={parsed.warnings.join(' ')} />
        )}

        {parsed.errors.length > 0 && (
          <Alert type="error" showIcon message={parsed.errors.join(' ')} />
        )}

        <Card title={t.jsonPreview}>
          <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <code>{JSON.stringify(parsed, null, 2)}</code>
          </pre>
        </Card>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
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
                  <Tag color={parsed.scheme ? 'purple' : 'default'}>
                    {schemeLabel(parsed.scheme) || '—'}
                  </Tag>
                </Col>
              </Row>

              <TextArea
                rows={6}
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder={t.placeholder}
                spellCheck={false}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
              />

              <Space wrap>
                {SCHEMES.map((scheme) => (
                  <Button
                    key={scheme}
                    size="small"
                    onClick={() => setParseText(SAMPLES[scheme] || '')}
                    icon={<FileTextOutlined />}
                  >
                    {t.sample} {schemeLabel(scheme)}
                  </Button>
                ))}
                <Button
                  size="small"
                  onClick={() => setParseText('')}
                  icon={<ClearOutlined />}
                  disabled={!parseText}
                >
                  {t.clear}
                </Button>
              </Space>
            </Space>
          </Card>

          {renderParsed()}
        </TabPane>

        <TabPane tab={<span><BuildOutlined /> {t.buildTab}</span>} key="build">
          <Card title={t.buildTab}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.scheme}</Text>
                  <Select
                    value={buildScheme}
                    onChange={setBuildScheme}
                    style={{ width: '100%' }}
                  >
                    {SCHEMES.map((s) => (
                      <Option key={s} value={s}>{schemeLabel(s)}</Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.host}</Text>
                  <Input
                    value={buildHost}
                    onChange={(e) => setBuildHost(e.target.value)}
                    placeholder="localhost"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.port}</Text>
                  <Input
                    value={buildPort}
                    onChange={(e) => setBuildPort(e.target.value)}
                    placeholder="5432"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.database}</Text>
                  <Input
                    value={buildDatabase}
                    onChange={(e) => setBuildDatabase(e.target.value)}
                    placeholder="mydb"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.user}</Text>
                  <Input
                    value={buildUser}
                    onChange={(e) => setBuildUser(e.target.value)}
                    placeholder="user"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">{t.password}</Text>
                  <Input.Password
                    value={buildPassword}
                    onChange={(e) => setBuildPassword(e.target.value)}
                    placeholder="secret"
                  />
                </Col>
              </Row>

              <div>
                <Text strong>{t.params}</Text>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {buildParams.map((p, i) => (
                    <Row gutter={8} key={i}>
                      <Col span={10}>
                        <Input
                          placeholder={t.paramKey}
                          value={p.key}
                          onChange={(e) => updateParam(i, 'key', e.target.value)}
                        />
                      </Col>
                      <Col span={10}>
                        <Input
                          placeholder={t.paramValue}
                          value={p.value}
                          onChange={(e) => updateParam(i, 'value', e.target.value)}
                        />
                      </Col>
                      <Col span={4}>
                        <Button onClick={() => removeParam(i)} danger size="small">
                          {t.removeParam}
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Button size="small" onClick={addParam}>{t.addParam}</Button>
                </Space>
              </div>
            </Space>
          </Card>

          <Card
            title={t.builderOutput}
            extra={
              <Button icon={<CopyOutlined />} onClick={() => copy(builtString)}>
                {t.copy}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
              <code>{builtString}</code>
            </pre>
          </Card>
        </TabPane>
      </Tabs>

      <Card title={t.sourceTitle}>
        <Paragraph>{t.sourceIntro}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13, background: '#f6ffed', padding: 16, borderRadius: 8 }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
