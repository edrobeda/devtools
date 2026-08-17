import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Tag,
  message,
  Tabs,
  Switch,
  Divider,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  CodeOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildOpenApiSpec,
  toYaml,
  toJson,
  statsFor,
  PRESETS,
  HTTP_METHODS,
  PARAM_IN_OPTIONS,
  SCHEMA_TYPES,
  CONTENT_TYPES,
  emptyPath,
  emptyParameter,
  emptyResponse,
} from '../utils/openapiSpecGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const SOURCE = `
export function buildOpenApiSpec(options) {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: options.title || 'API',
      version: options.version || '1.0.0',
      description: options.description || '',
    },
    servers: [{ url: options.serverUrl || 'https://api.example.com' }],
    paths: {},
  }

  const tagsSet = new Set()

  ;(options.paths || []).forEach((p) => {
    if (!p.path || !p.method) return
    const pathKey = p.path.startsWith('/') ? p.path : '/' + p.path
    if (!spec.paths[pathKey]) spec.paths[pathKey] = {}

    const operation = {
      summary: p.summary || p.method.toUpperCase() + ' ' + pathKey,
      operationId: p.operationId || (p.method + pathKey.replace(/[^a-zA-Z0-9]/g, '')),
      tags: p.tags ? p.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    }

    operation.tags.forEach(tag => tagsSet.add(tag))

    if (Array.isArray(p.parameters) && p.parameters.length) {
      operation.parameters = p.parameters
        .filter(param => param.name)
        .map(param => ({
          name: param.name,
          in: param.in || 'query',
          required: Boolean(param.required),
          description: param.description || '',
          schema: { type: param.type || 'string' },
        }))
    }

    if (p.hasRequestBody && p.requestBody) {
      const rb = p.requestBody
      const schema = { type: rb.schemaType || 'object' }
      if (rb.example) {
        try { schema.example = JSON.parse(rb.example) }
        catch { schema.example = rb.example }
      }
      operation.requestBody = {
        required: Boolean(rb.required),
        description: rb.description || '',
        content: { [rb.contentType || 'application/json']: { schema } },
      }
    }

    operation.responses = {}
    ;(p.responses || []).forEach(r => {
      if (!r.code) return
      operation.responses[r.code] = {
        description: r.description || '',
        content: {
          'application/json': { schema: { type: r.schemaType || 'object' } },
        },
      }
    })

    spec.paths[pathKey][p.method.toLowerCase()] = operation
  })

  if (tagsSet.size) {
    spec.tags = Array.from(tagsSet).map(name => ({ name }))
  }

  return spec
}
`

const translations = {
  pt: {
    title: 'Gerador de Especificação OpenAPI',
    intro:
      'Monta especificações OpenAPI 3.0.0 (Swagger) 100% no navegador. Configure a info da API, adicione paths, parâmetros, body e respostas; exporte em YAML ou JSON.',
    presets: 'Modelos de um clique',
    infoTitle: 'Informações da API',
    titleLabel: 'Título',
    versionLabel: 'Versão',
    descriptionLabel: 'Descrição',
    serverUrlLabel: 'URL base',
    pathsTitle: 'Paths',
    addPath: 'Adicionar path',
    pathLabel: 'Path',
    methodLabel: 'Método',
    summaryLabel: 'Summary',
    operationIdLabel: 'operationId',
    tagsLabel: 'Tags (vírgula)',
    parametersLabel: 'Parâmetros',
    addParameter: 'Adicionar parâmetro',
    noParameters: 'Nenhum parâmetro.',
    paramName: 'Nome',
    paramIn: 'Em',
    paramRequired: 'Obrigatório',
    paramType: 'Tipo',
    paramDescription: 'Descrição',
    requestBodyLabel: 'Request body',
    requestBodyRequired: 'Body obrigatório',
    contentTypeLabel: 'Content-Type',
    schemaTypeLabel: 'Tipo do schema',
    exampleLabel: 'Exemplo (JSON ou texto)',
    responsesLabel: 'Responses',
    addResponse: 'Adicionar response',
    responseCode: 'Código HTTP',
    responseDescription: 'Descrição',
    responseSchema: 'Schema',
    remove: 'Remover',
    outputTitle: 'Especificação gerada',
    yamlTab: 'YAML',
    jsonTab: 'JSON',
    copy: 'Copiar',
    copied: 'Especificação copiada!',
    download: 'Baixar',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    pathCount: (n) => `${n} path${n === 1 ? '' : 's'}`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildOpenApiSpec monta um objeto OpenAPI 3.0.0 a partir das opções, normaliza paths, parâmetros, requestBody e responses, e ainda coleta tags únicas.',
    tipsTitle: 'Dicas de OpenAPI',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>operationId</Text> deve ser único em toda a especificação; é usado por geradores de SDK.
        </li>
        <li>
          Parâmetros <Text code>path</Text> são sempre obrigatórios e devem estar presentes na URL entre chaves.
        </li>
        <li>
          O exemplo do body é inserido no schema como <Text code>example</Text>; mantenha-o como JSON válido quando possível.
        </li>
        <li>
          Use <Text code>tags</Text> para agrupar operações no Swagger UI e no Redoc.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'OpenAPI Spec Generator',
    intro:
      'Builds OpenAPI 3.0.0 (Swagger) specs 100% in the browser. Configure API info, add paths, parameters, body and responses; export as YAML or JSON.',
    presets: 'One-click templates',
    infoTitle: 'API info',
    titleLabel: 'Title',
    versionLabel: 'Version',
    descriptionLabel: 'Description',
    serverUrlLabel: 'Base URL',
    pathsTitle: 'Paths',
    addPath: 'Add path',
    pathLabel: 'Path',
    methodLabel: 'Method',
    summaryLabel: 'Summary',
    operationIdLabel: 'operationId',
    tagsLabel: 'Tags (comma)',
    parametersLabel: 'Parameters',
    addParameter: 'Add parameter',
    noParameters: 'No parameters.',
    paramName: 'Name',
    paramIn: 'In',
    paramRequired: 'Required',
    paramType: 'Type',
    paramDescription: 'Description',
    requestBodyLabel: 'Request body',
    requestBodyRequired: 'Body required',
    contentTypeLabel: 'Content-Type',
    schemaTypeLabel: 'Schema type',
    exampleLabel: 'Example (JSON or text)',
    responsesLabel: 'Responses',
    addResponse: 'Add response',
    responseCode: 'HTTP code',
    responseDescription: 'Description',
    responseSchema: 'Schema',
    remove: 'Remove',
    outputTitle: 'Generated specification',
    yamlTab: 'YAML',
    jsonTab: 'JSON',
    copy: 'Copy',
    copied: 'Specification copied!',
    download: 'Download',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    pathCount: (n) => `${n} path${n === 1 ? '' : 's'}`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildOpenApiSpec builds an OpenAPI 3.0.0 object from the options, normalizes paths, parameters, requestBody and responses, and collects unique tags.',
    tipsTitle: 'OpenAPI tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>operationId</Text> must be unique across the spec; SDK generators rely on it.
        </li>
        <li>
          <Text code>path</Text> parameters are always required and must appear in the URL inside braces.
        </li>
        <li>
          The body example is embedded in the schema as <Text code>example</Text>; keep it valid JSON when possible.
        </li>
        <li>
          Use <Text code>tags</Text> to group operations in Swagger UI and Redoc.
        </li>
      </ul>
    ),
  },
}

function clonePreset(preset) {
  return JSON.parse(JSON.stringify(preset))
}

export default function OpenapiSpecGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState(() => clonePreset(PRESETS['users-crud']))
  const [activePreset, setActivePreset] = useState('users-crud')
  const [outputTab, setOutputTab] = useState('yaml')

  const spec = useMemo(() => buildOpenApiSpec(options), [options])
  const yamlOutput = useMemo(() => toYaml(spec), [spec])
  const jsonOutput = useMemo(() => toJson(spec), [spec])
  const outputText = outputTab === 'yaml' ? yamlOutput : jsonOutput
  const stats = useMemo(() => statsFor(outputText), [outputText])

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setActivePreset(key)
    setOptions(clonePreset(preset))
  }

  const updateInfo = (field, value) => {
    setOptions((prev) => ({ ...prev, [field]: value }))
    setActivePreset('')
  }

  const updatePath = (index, field, value) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      paths[index] = { ...paths[index], [field]: value }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const addPath = () => {
    setOptions((prev) => ({ ...prev, paths: [...prev.paths, emptyPath()] }))
    setActivePreset('')
  }

  const removePath = (index) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      paths.splice(index, 1)
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const updateParameter = (pathIndex, paramIndex, field, value) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      const params = [...paths[pathIndex].parameters]
      params[paramIndex] = { ...params[paramIndex], [field]: value }
      paths[pathIndex] = { ...paths[pathIndex], parameters: params }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const addParameter = (pathIndex) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      paths[pathIndex] = {
        ...paths[pathIndex],
        parameters: [...paths[pathIndex].parameters, emptyParameter()],
      }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const removeParameter = (pathIndex, paramIndex) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      const params = [...paths[pathIndex].parameters]
      params.splice(paramIndex, 1)
      paths[pathIndex] = { ...paths[pathIndex], parameters: params }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const updateRequestBody = (pathIndex, field, value) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      paths[pathIndex] = {
        ...paths[pathIndex],
        requestBody: { ...paths[pathIndex].requestBody, [field]: value },
      }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const updateResponse = (pathIndex, responseIndex, field, value) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      const responses = [...paths[pathIndex].responses]
      responses[responseIndex] = { ...responses[responseIndex], [field]: value }
      paths[pathIndex] = { ...paths[pathIndex], responses }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const addResponse = (pathIndex) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      paths[pathIndex] = {
        ...paths[pathIndex],
        responses: [...paths[pathIndex].responses, emptyResponse()],
      }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const removeResponse = (pathIndex, responseIndex) => {
    setOptions((prev) => {
      const paths = [...prev.paths]
      const responses = [...paths[pathIndex].responses]
      responses.splice(responseIndex, 1)
      paths[pathIndex] = { ...paths[pathIndex], responses }
      return { ...prev, paths }
    })
    setActivePreset('')
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(outputText)
    message.success(t.copied)
  }

  const downloadOutput = () => {
    const blob = new Blob([outputText], {
      type: outputTab === 'yaml' ? 'text/yaml' : 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = outputTab === 'yaml' ? 'openapi.yaml' : 'openapi.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const methodOptions = HTTP_METHODS.map((m) => ({
    value: m,
    label: m.toUpperCase(),
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FileTextOutlined /> {t.title}
      </Title>
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
          <Card title={t.infoTitle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.titleLabel}
                </Text>
                <Input
                  value={options.title}
                  onChange={(e) => updateInfo('title', e.target.value)}
                  placeholder="My API"
                />
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.versionLabel}
                </Text>
                <Input
                  value={options.version}
                  onChange={(e) => updateInfo('version', e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.descriptionLabel}
                </Text>
                <TextArea
                  rows={2}
                  value={options.description}
                  onChange={(e) => updateInfo('description', e.target.value)}
                />
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t.serverUrlLabel}
                </Text>
                <Input
                  value={options.serverUrl}
                  onChange={(e) => updateInfo('serverUrl', e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>
            </Space>
          </Card>

          {options.paths.map((path, pathIndex) => (
            <Card
              key={pathIndex}
              title={
                <Space>
                  <Tag color="blue">{path.method.toUpperCase()}</Tag>
                  <Text strong>{path.path || t.pathLabel}</Text>
                </Space>
              }
              extra={
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removePath(pathIndex)}
                >
                  {t.remove}
                </Button>
              }
              style={{ marginTop: 16 }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.pathLabel}
                    </Text>
                    <Input
                      value={path.path}
                      onChange={(e) => updatePath(pathIndex, 'path', e.target.value)}
                      placeholder="/users"
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.methodLabel}
                    </Text>
                    <Select
                      style={{ width: '100%' }}
                      value={path.method}
                      onChange={(v) => updatePath(pathIndex, 'method', v)}
                      options={methodOptions}
                    />
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.summaryLabel}
                    </Text>
                    <Input
                      value={path.summary}
                      onChange={(e) => updatePath(pathIndex, 'summary', e.target.value)}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      {t.operationIdLabel}
                    </Text>
                    <Input
                      value={path.operationId}
                      onChange={(e) => updatePath(pathIndex, 'operationId', e.target.value)}
                    />
                  </Col>
                </Row>
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    {t.tagsLabel}
                  </Text>
                  <Input
                    value={path.tags}
                    onChange={(e) => updatePath(pathIndex, 'tags', e.target.value)}
                    placeholder="users, admin"
                  />
                </div>

                <Divider orientation="left" style={{ margin: '12px 0' }}>
                  {t.parametersLabel}
                </Divider>
                {path.parameters.length === 0 && (
                  <Text type="secondary">{t.noParameters}</Text>
                )}
                {path.parameters.map((param, paramIndex) => (
                  <Card
                    key={paramIndex}
                    size="small"
                    style={{ marginBottom: 8 }}
                    extra={
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeParameter(pathIndex, paramIndex)}
                      />
                    }
                  >
                    <Row gutter={[8, 8]}>
                      <Col xs={24} sm={8}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.paramName}
                        </Text>
                        <Input
                          value={param.name}
                          onChange={(e) =>
                            updateParameter(pathIndex, paramIndex, 'name', e.target.value)
                          }
                        />
                      </Col>
                      <Col xs={12} sm={8}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.paramIn}
                        </Text>
                        <Select
                          style={{ width: '100%' }}
                          value={param.in}
                          onChange={(v) => updateParameter(pathIndex, paramIndex, 'in', v)}
                          options={PARAM_IN_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label[lang],
                          }))}
                        />
                      </Col>
                      <Col xs={12} sm={8}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.paramType}
                        </Text>
                        <Select
                          style={{ width: '100%' }}
                          value={param.type}
                          onChange={(v) => updateParameter(pathIndex, paramIndex, 'type', v)}
                          options={SCHEMA_TYPES.map((o) => ({
                            value: o.value,
                            label: o.label,
                          }))}
                        />
                      </Col>
                    </Row>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      <Col xs={12} sm={6}>
                        <Switch
                          checked={param.required}
                          onChange={(v) =>
                            updateParameter(pathIndex, paramIndex, 'required', v)
                          }
                        />{' '}
                        <Text type="secondary">{t.paramRequired}</Text>
                      </Col>
                      <Col xs={24} sm={18}>
                        <Input
                          value={param.description}
                          onChange={(e) =>
                            updateParameter(pathIndex, paramIndex, 'description', e.target.value)
                          }
                          placeholder={t.paramDescription}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => addParameter(pathIndex)}
                >
                  {t.addParameter}
                </Button>

                <Divider orientation="left" style={{ margin: '12px 0' }}>
                  {t.requestBodyLabel}
                </Divider>
                <div>
                  <Switch
                    checked={path.hasRequestBody}
                    onChange={(v) => updatePath(pathIndex, 'hasRequestBody', v)}
                  />{' '}
                  <Text type="secondary">{t.requestBodyRequired}</Text>
                </div>
                {path.hasRequestBody && (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Row gutter={[8, 8]}>
                      <Col xs={24} sm={12}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.contentTypeLabel}
                        </Text>
                        <Select
                          style={{ width: '100%' }}
                          value={path.requestBody.contentType}
                          onChange={(v) => updateRequestBody(pathIndex, 'contentType', v)}
                          options={CONTENT_TYPES.map((o) => ({
                            value: o.value,
                            label: o.label,
                          }))}
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.schemaTypeLabel}
                        </Text>
                        <Select
                          style={{ width: '100%' }}
                          value={path.requestBody.schemaType}
                          onChange={(v) => updateRequestBody(pathIndex, 'schemaType', v)}
                          options={SCHEMA_TYPES.map((o) => ({
                            value: o.value,
                            label: o.label,
                          }))}
                        />
                      </Col>
                    </Row>
                    <div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                        {t.exampleLabel}
                      </Text>
                      <TextArea
                        rows={3}
                        value={path.requestBody.example}
                        onChange={(e) => updateRequestBody(pathIndex, 'example', e.target.value)}
                      />
                    </div>
                  </Space>
                )}

                <Divider orientation="left" style={{ margin: '12px 0' }}>
                  {t.responsesLabel}
                </Divider>
                {path.responses.map((response, responseIndex) => (
                  <Card
                    key={responseIndex}
                    size="small"
                    style={{ marginBottom: 8 }}
                    extra={
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeResponse(pathIndex, responseIndex)}
                      />
                    }
                  >
                    <Row gutter={[8, 8]}>
                      <Col xs={12} sm={6}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.responseCode}
                        </Text>
                        <Input
                          value={response.code}
                          onChange={(e) =>
                            updateResponse(pathIndex, responseIndex, 'code', e.target.value)
                          }
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.responseSchema}
                        </Text>
                        <Select
                          style={{ width: '100%' }}
                          value={response.schemaType}
                          onChange={(v) =>
                            updateResponse(pathIndex, responseIndex, 'schemaType', v)
                          }
                          options={SCHEMA_TYPES.map((o) => ({
                            value: o.value,
                            label: o.label,
                          }))}
                        />
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                          {t.responseDescription}
                        </Text>
                        <Input
                          value={response.description}
                          onChange={(e) =>
                            updateResponse(pathIndex, responseIndex, 'description', e.target.value)
                          }
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => addResponse(pathIndex)}
                >
                  {t.addResponse}
                </Button>
              </Space>
            </Card>
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={addPath} style={{ marginTop: 16 }}>
            {t.addPath}
          </Button>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={t.outputTitle}
            extra={
              <Space>
                <Text type="secondary">
                  {t.lineCount(stats.lines)} · {t.byteCount(stats.bytes)} · {t.pathCount(stats.paths)}
                </Text>
                <Button icon={<CopyOutlined />} onClick={copyOutput}>
                  {t.copy}
                </Button>
                <Button icon={<DownloadOutlined />} onClick={downloadOutput}>
                  {t.download}
                </Button>
              </Space>
            }
          >
            <Tabs activeKey={outputTab} onChange={setOutputTab} items={[
              {
                key: 'yaml',
                label: t.yamlTab,
                children: (
                  <pre
                    style={{
                      background: '#f6f8fa',
                      padding: 16,
                      borderRadius: 8,
                      overflow: 'auto',
                      maxHeight: '60vh',
                    }}
                  >
                    <code>{yamlOutput}</code>
                  </pre>
                ),
              },
              {
                key: 'json',
                label: t.jsonTab,
                children: (
                  <pre
                    style={{
                      background: '#f6f8fa',
                      padding: 16,
                      borderRadius: 8,
                      overflow: 'auto',
                      maxHeight: '60vh',
                    }}
                  >
                    <code>{jsonOutput}</code>
                  </pre>
                ),
              },
            ]} />
          </Card>

          <Collapse style={{ marginTop: 16 }}>
            <Panel
              header={
                <Space>
                  <CodeOutlined />
                  {t.sourceTitle}
                </Space>
              }
              key="source"
            >
              <Paragraph>{t.sourceBody}</Paragraph>
              <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto' }}>
                <code>{SOURCE}</code>
              </pre>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </Space>
  )
}
