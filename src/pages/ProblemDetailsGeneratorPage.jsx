import React, { useState, useMemo, useCallback } from 'react'
import {
  Card,
  Input,
  Select,
  Form,
  Button,
  Tabs,
  Alert,
  Divider,
  Typography,
  Collapse,
  Tooltip,
  Switch,
  Space,
  Tag,
} from 'antd'
import { CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Panel } = Collapse
const TextArea = Input.TextArea

const PRESET_ERRORS = {
  validation: {
    type: 'https://example.com/validation-error',
    title: 'Validation Failed',
    status: 400,
    detail: 'One or more fields failed validation',
    instance: '/api/users/123',
    errors: [
      { field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' },
      { field: 'age', message: 'Must be at least 18', code: 'MIN_VALUE' },
    ],
  },
  notFound: {
    type: 'https://example.com/not-found',
    title: 'Resource Not Found',
    status: 404,
    detail: 'The requested resource was not found',
    instance: '/api/users/999',
  },
  unauthorized: {
    type: 'https://example.com/unauthorized',
    title: 'Unauthorized',
    status: 401,
    detail: 'Authentication credentials are missing or invalid',
    instance: '/api/protected',
  },
  forbidden: {
    type: 'https://example.com/forbidden',
    title: 'Forbidden',
    status: 403,
    detail: 'Insufficient permissions to access this resource',
    instance: '/api/admin',
  },
  rateLimited: {
    type: 'https://example.com/rate-limited',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Rate limit exceeded. Try again later.',
    instance: '/api/search',
    retryAfter: 60,
  },
  serverError: {
    type: 'https://example.com/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
    instance: '/api/process',
    traceId: 'abc-123-def-456',
  },
}

const HTTP_STATUS_OPTIONS = [
  { value: 400, label: '400 Bad Request' },
  { value: 401, label: '401 Unauthorized' },
  { value: 403, label: '403 Forbidden' },
  { value: 404, label: '404 Not Found' },
  { value: 409, label: '409 Conflict' },
  { value: 422, label: '422 Unprocessable Entity' },
  { value: 429, label: '429 Too Many Requests' },
  { value: 500, label: '500 Internal Server Error' },
  { value: 503, label: '503 Service Unavailable' },
]

export default function ProblemDetailsGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [formData, setFormData] = useState({
    type: 'https://example.com/error',
    title: '',
    status: 400,
    detail: '',
    instance: '',
    traceId: '',
    errors: [{ field: '', message: '', code: '' }],
    retryAfter: '',
    customFields: [{ key: '', value: '' }],
  })

  const [activeTab, setActiveTab] = useState('json')
  const [copied, setCopied] = useState(false)

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateError = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newErrors = [...prev.errors]
      newErrors[index] = { ...newErrors[index], [field]: value }
      return { ...prev, errors: newErrors }
    })
  }, [])

  const addError = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      errors: [...prev.errors, { field: '', message: '', code: '' }],
    }))
  }, [])

  const removeError = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      errors: prev.errors.filter((_, i) => i !== index),
    }))
  }, [])

  const updateCustomField = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newFields = [...prev.customFields]
      newFields[index] = { ...newFields[index], [field]: value }
      return { ...prev, customFields: newFields }
    })
  }, [])

  const addCustomField = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { key: '', value: '' }],
    }))
  }, [])

  const removeCustomField = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }))
  }, [])

  const loadPreset = useCallback((preset) => {
    const data = PRESET_ERRORS[preset]
    setFormData({
      type: data.type,
      title: data.title,
      status: data.status,
      detail: data.detail,
      instance: data.instance,
      traceId: data.traceId || '',
      errors: data.errors || [{ field: '', message: '', code: '' }],
      retryAfter: data.retryAfter || '',
      customFields: [{ key: '', value: '' }],
    })
  }, [])

  const problemDetails = useMemo(() => {
    const result = {
      type: formData.type || 'about:blank',
      title: formData.title,
      status: formData.status,
      detail: formData.detail,
    }

    if (formData.instance) result.instance = formData.instance

    const hasErrors = formData.errors.some((e) => e.field || e.message || e.code)
    if (hasErrors) {
      result.errors = formData.errors
        .filter((e) => e.field || e.message || e.code)
        .map((e) => {
          const err = {}
          if (e.field) err.field = e.field
          if (e.message) err.message = e.message
          if (e.code) err.code = e.code
          return err
        })
    }

    if (formData.traceId) result.traceId = formData.traceId
    if (formData.retryAfter) result['retry-after'] = parseInt(formData.retryAfter, 10)

    formData.customFields
      .filter((f) => f.key && f.value)
      .forEach((f) => {
        result[f.key] = f.value
      })

    return result
  }, [formData])

  const jsonOutput = useMemo(
    () => JSON.stringify(problemDetails, null, 2),
    [problemDetails]
  )

  const httpResponse = useMemo(() => {
    const headers = {
      'Content-Type': 'application/problem+json',
    }
    if (formData.retryAfter) {
      headers['Retry-After'] = formData.retryAfter
    }
    return {
      status: formData.status,
      headers,
      body: jsonOutput,
    }
  }, [jsonOutput, formData.status, formData.retryAfter])

  const httpOutput = useMemo(
    () =>
      `HTTP/1.1 ${formData.status} ${HTTP_STATUS_OPTIONS.find((o) => o.value === formData.status)?.label || ''}
${Object.entries(httpResponse.headers)
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}

${jsonOutput}`,
    [httpResponse, formData.status, jsonOutput]
  )

  const curlOutput = useMemo(
    () =>
      `curl -X POST '${formData.instance || 'https://api.example.com/endpoint'}' \\
  -H 'Content-Type: application/problem+json' \\
  -H 'Accept: application/problem+json' \\
  -d '${jsonOutput.replace(/'/g, "'\\''")}'`,
    [jsonOutput, formData.instance]
  )

  const copyToClipboard = async (text, label) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card style={{ maxWidth: 960, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {t.description}
      </Paragraph>

      <Alert
        message={t.rfcInfo.title}
        description={t.rfcInfo.description}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'builder', tab: t.tabs.builder, children: (
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label={t.fields.type} name="type" tooltip={t.tooltips.type}>
              <Input
                value={formData.type}
                onChange={(e) => updateField('type', e.target.value)}
                placeholder="https://example.com/problem-type"
              />
            </Form.Item>

            <Form.Item label={t.fields.title} name="title" tooltip={t.tooltips.title}>
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Validation Failed"
              />
            </Form.Item>

            <Form.Item label={t.fields.status} name="status" tooltip={t.tooltips.status}>
              <Select
                value={formData.status}
                onChange={(v) => updateField('status', v)}
                style={{ width: 200 }}
                options={HTTP_STATUS_OPTIONS}
              />
            </Form.Item>

            <Form.Item label={t.fields.detail} name="detail" tooltip={t.tooltips.detail}>
              <TextArea
                value={formData.detail}
                onChange={(e) => updateField('detail', e.target.value)}
                rows={2}
                placeholder="One or more fields failed validation"
              />
            </Form.Item>

            <Form.Item label={t.fields.instance} name="instance" tooltip={t.tooltips.instance}>
              <Input
                value={formData.instance}
                onChange={(e) => updateField('instance', e.target.value)}
                placeholder="/api/users/123"
              />
            </Form.Item>

            <Form.Item label={t.fields.traceId} name="traceId" tooltip={t.tooltips.traceId}>
              <Input
                value={formData.traceId}
                onChange={(e) => updateField('traceId', e.target.value)}
                placeholder="abc-123-def-456"
              />
            </Form.Item>

            <Form.Item label={t.fields.retryAfter} name="retryAfter" tooltip={t.tooltips.retryAfter}>
              <Input
                value={formData.retryAfter}
                onChange={(e) => updateField('retryAfter', e.target.value)}
                type="number"
                placeholder="60"
                style={{ width: 120 }}
              />
            </Form.Item>

            <Divider dashed>{t.sections.validationErrors}</Divider>

            {formData.errors.map((error, index) => (
              <Card key={index} style={{ marginBottom: 12, borderRadius: 8 }}>
                <Space justify="space-between">
                  <Text strong>{t.errorItem} #{index + 1}</Text>
                  {formData.errors.length > 1 && (
                    <Button type="text" danger size="small" onClick={() => removeError(index)}>
                      {t.remove}
                    </Button>
                  )}
                </Space>
                <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
                  <Form.Item name={`errors[${index}].field`} tooltip={t.tooltips.errorField}>
                    <Input
                      value={error.field}
                      onChange={(e) => updateError(index, 'field', e.target.value)}
                      placeholder={t.placeholders.errorField}
                    />
                  </Form.Item>
                  <Form.Item name={`errors[${index}].message`} tooltip={t.tooltips.errorMessage}>
                    <Input
                      value={error.message}
                      onChange={(e) => updateError(index, 'message', e.target.value)}
                      placeholder={t.placeholders.errorMessage}
                    />
                  </Form.Item>
                  <Form.Item name={`errors[${index}].code`} tooltip={t.tooltips.errorCode}>
                    <Input
                      value={error.code}
                      onChange={(e) => updateError(index, 'code', e.target.value)}
                      placeholder={t.placeholders.errorCode}
                    />
                  </Form.Item>
                </Space>
              </Card>
            ))}

            <Button type="dashed" icon={<CheckOutlined />} onClick={addError} style={{ marginBottom: 16 }}>
              {t.addError}
            </Button>

            <Divider dashed>{t.sections.customFields}</Divider>

            {formData.customFields.map((field, index) => (
              <Space key={index} style={{ marginBottom: 8, width: '100%' }}>
                <Input
                  placeholder={t.placeholders.customKey}
                  value={field.key}
                  onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                  style={{ width: '45%' }}
                />
                <Input
                  placeholder={t.placeholders.customValue}
                  value={field.value}
                  onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                  style={{ width: '45%' }}
                />
                {formData.customFields.length > 1 && (
                  <Button type="text" danger size="small" onClick={() => removeCustomField(index)}>
                    {t.remove}
                  </Button>
                )}
              </Space>
            ))}

            <Button type="dashed" icon={<CheckOutlined />} onClick={addCustomField}>
              {t.addCustomField}
            </Button>

            <Divider dashed style={{ marginTop: 24 }} />
            <Text strong>{t.sections.presets}</Text>
            <Space wrap style={{ marginTop: 8 }}>
              {Object.keys(PRESET_ERRORS).map((key) => (
                <Button
                  key={key}
                  type="text"
                  onClick={() => loadPreset(key)}
                  style={{ marginRight: 8, marginBottom: 8 }}
                >
                  {t.presets[key]}
                </Button>
              ))}
            </Space>
          </Form>
        )},
        { key: 'json', tab: t.tabs.json, children: (
          <Card style={{ marginTop: 16 }}>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{jsonOutput}</code>
            </pre>
          </Card>
        )},
        { key: 'http', tab: t.tabs.http, children: (
          <Card style={{ marginTop: 16 }}>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{httpOutput}</code>
            </pre>
          </Card>
        )},
        { key: 'curl', tab: t.tabs.curl, children: (
          <Card style={{ marginTop: 16 }}>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{curlOutput}</code>
            </pre>
          </Card>
        )},
      ]} />

      <Space style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <Button
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(jsonOutput, 'json')}
          loading={copied === 'json'}
        >
          {copied === 'json' ? t.copied : t.copyJson}
        </Button>
        <Button
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(httpOutput, 'http')}
          loading={copied === 'http'}
        >
          {copied === 'http' ? t.copied : t.copyHttp}
        </Button>
        <Button
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(curlOutput, 'curl')}
          loading={copied === 'curl'}
        >
          {copied === 'curl' ? t.copied : t.copyCurl}
        </Button>
      </Space>

      <Divider dashed style={{ marginTop: 24 }} />
      <Collapse defaultActiveKey={[]} bordered={false}>
        <Panel header={t.reference.title} key="reference">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph>{t.reference.intro}</Paragraph>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {t.reference.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            <Paragraph>
              <Text strong>{t.reference.mediaType}</Text>
              {' application/problem+json'}
            </Paragraph>
            <Paragraph>
              <Text strong>{t.reference.contentType}</Text>
              {' application/problem+json'}
            </Paragraph>
          </Space>
        </Panel>
      </Collapse>
    </Card>
  )
}

const translations = {
  pt: {
    title: 'Gerador de Problem Details (RFC 7807 / RFC 9457)',
    description:
      'Crie respostas de erro padronizadas para APIs HTTP seguindo o padrão Problem Details. ' +
      'Útil para documentar contratos de erro, testar clientes e garantir consistência entre serviços.',
    rfcInfo: {
      title: 'Sobre o padrão Problem Details',
      description:
        'RFC 7807 (atualizado pelo RFC 9457) define um formato padronizado para respostas de erro em APIs HTTP. ' +
        'Em vez de cada API inventar seu próprio formato de erro, use application/problem+json com campos ' +
        'conhecidos (type, title, status, detail, instance) e extensões customizadas.',
    },
    tabs: {
      builder: 'Construtor',
      json: 'JSON',
      http: 'HTTP Response',
      curl: 'cURL',
    },
    fields: {
      type: 'Type (URI)',
      title: 'Title',
      status: 'Status HTTP',
      detail: 'Detail',
      instance: 'Instance',
      traceId: 'Trace ID',
      retryAfter: 'Retry-After (seg)',
    },
    tooltips: {
      type: 'URI que identifica o tipo de problema. Deve ser uma URL estável que documente este tipo de erro.',
      title: 'Resumo curto e legível do tipo de problema. Não deve mudar entre ocorrências do mesmo tipo.',
      status: 'Código de status HTTP da resposta (deve corresponder ao status real da resposta).',
      detail: 'Explicação legível por humanos desta ocorrência específica do problema.',
      instance: 'URI que identifica a ocorrência específica deste problema.',
      traceId: 'ID de rastreamento para correlação de logs (extensão comum).',
      retryAfter: 'Segundos até o cliente poder tentar novamente (para 429/503).',
      errorField: 'Nome do campo que falhou na validação.',
      errorMessage: 'Mensagem de erro legível para o campo.',
      errorCode: 'Código de erro interno/máquina para o tipo de falha.',
    },
    placeholders: {
      errorField: 'ex: email',
      errorMessage: 'ex: Formato de e-mail inválido',
      errorCode: 'ex: INVALID_FORMAT',
      customKey: 'Chave da extensão',
      customValue: 'Valor da extensão',
    },
    sections: {
      validationErrors: 'Erros de Validação (extensão "errors")',
      customFields: 'Extensões Customizadas',
      presets: 'Presets Rápidos',
    },
    errorItem: 'Erro',
    remove: 'Remover',
    addError: 'Adicionar erro de validação',
    addCustomField: 'Adicionar extensão customizada',
    presets: {
      validation: 'Erro de Validação (400)',
      notFound: 'Não Encontrado (404)',
      unauthorized: 'Não Autorizado (401)',
      forbidden: 'Proibido (403)',
      rateLimited: 'Rate Limited (429)',
      serverError: 'Erro Interno (500)',
    },
    copyJson: 'Copiar JSON',
    copyHttp: 'Copiar HTTP',
    copyCurl: 'Copiar cURL',
    copied: 'Copiado!',
    reference: {
      title: 'Referência Rápida (RFC 7807 / RFC 9457)',
      intro: 'Campos padrão do objeto Problem Details:',
      points: [
        'type (string, URI): Identificador do tipo de problema. Use "about:blank" se não houver tipo específico.',
        'title (string): Resumo curto e legível. Constante para o mesmo type.',
        'status (number): Código HTTP da resposta (deve bater com o status real).',
        'detail (string): Explicação específica desta ocorrência.',
        'instance (string, URI): Identificador desta ocorrência específica.',
      ],
      mediaType: 'Media Type:',
      contentType: 'Content-Type header:',
    },
  },
  en: {
    title: 'Problem Details Generator (RFC 7807 / RFC 9457)',
    description:
      'Create standardized error responses for HTTP APIs following the Problem Details pattern. ' +
      'Useful for documenting error contracts, testing clients, and ensuring consistency across services.',
    rfcInfo: {
      title: 'About the Problem Details standard',
      description:
        'RFC 7807 (updated by RFC 9457) defines a standardized format for HTTP API error responses. ' +
        'Instead of each API inventing its own error format, use application/problem+json with known ' +
        'fields (type, title, status, detail, instance) and custom extensions.',
    },
    tabs: {
      builder: 'Builder',
      json: 'JSON',
      http: 'HTTP Response',
      curl: 'cURL',
    },
    fields: {
      type: 'Type (URI)',
      title: 'Title',
      status: 'HTTP Status',
      detail: 'Detail',
      instance: 'Instance',
      traceId: 'Trace ID',
      retryAfter: 'Retry-After (sec)',
    },
    tooltips: {
      type: 'URI identifying the problem type. Should be a stable URL documenting this error type.',
      title: 'Short, human-readable summary of the problem type. Should not change between occurrences.',
      status: 'HTTP status code of the response (must match the actual response status).',
      detail: 'Human-readable explanation specific to this occurrence of the problem.',
      instance: 'URI identifying this specific occurrence of the problem.',
      traceId: 'Trace ID for log correlation (common extension).',
      retryAfter: 'Seconds until client can retry (for 429/503).',
      errorField: 'Name of the field that failed validation.',
      errorMessage: 'Human-readable error message for the field.',
      errorCode: 'Machine-readable error code for the failure type.',
    },
    placeholders: {
      errorField: 'e.g. email',
      errorMessage: 'e.g. Invalid email format',
      errorCode: 'e.g. INVALID_FORMAT',
      customKey: 'Extension key',
      customValue: 'Extension value',
    },
    sections: {
      validationErrors: 'Validation Errors (errors extension)',
      customFields: 'Custom Extensions',
      presets: 'Quick Presets',
    },
    errorItem: 'Error',
    remove: 'Remove',
    addError: 'Add validation error',
    addCustomField: 'Add custom extension',
    presets: {
      validation: 'Validation Error (400)',
      notFound: 'Not Found (404)',
      unauthorized: 'Unauthorized (401)',
      forbidden: 'Forbidden (403)',
      rateLimited: 'Rate Limited (429)',
      serverError: 'Server Error (500)',
    },
    copyJson: 'Copy JSON',
    copyHttp: 'Copy HTTP',
    copyCurl: 'Copy cURL',
    copied: 'Copied!',
    reference: {
      title: 'Quick Reference (RFC 7807 / RFC 9457)',
      intro: 'Standard Problem Details fields:',
      points: [
        'type (string, URI): Identifier for the problem type. Use "about:blank" if no specific type.',
        'title (string): Short, human-readable summary. Constant for the same type.',
        'status (number): HTTP status code (must match actual response status).',
        'detail (string): Human-readable explanation for this specific occurrence.',
        'instance (string, URI): Identifier for this specific occurrence.',
      ],
      mediaType: 'Media Type:',
      contentType: 'Content-Type header:',
    },
  },
}