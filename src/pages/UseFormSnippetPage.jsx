import React, { useCallback, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Tag,
  Alert,
  Button,
  Input,
  Checkbox,
  Form,
  Row,
  Col,
  Divider,
} from 'antd'
import { CodeOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import useForm from '../hooks/useForm'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useMemo, useState } from 'react'

export default function useForm(options = {}) {
  const { initialValues = {}, validate, onSubmit } = options

  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errors = useMemo(() => {
    if (typeof validate !== 'function') return {}
    return validate(values) || {}
  }, [values, validate])

  const isValid = useMemo(
    () => Object.keys(errors).length === 0,
    [errors]
  )

  const setValue = useCallback((name, next) => {
    setValues((prev) => ({ ...prev, [name]: next }))
  }, [])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setValue(name, type === 'checkbox' ? checked : value)
  }, [setValue])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  const setTouchedField = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const handleSubmit = useCallback(
    async (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault()
      }

      setTouched(
        Object.keys(values).reduce((acc, key) => {
          acc[key] = true
          return acc
        }, {})
      )

      if (!isValid) return

      setIsSubmitting(true)
      try {
        await onSubmit?.(values)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, isValid, onSubmit]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    handleChange,
    handleBlur,
    setTouchedField,
    reset,
    handleSubmit,
  }
}

// uso:
// const { values, errors, touched, handleChange, handleBlur, handleSubmit, reset, isValid } = useForm({
//   initialValues: { email: '', password: '' },
//   validate: (v) => {
//     const err = {}
//     if (!v.email) err.email = 'Required'
//     return err
//   },
//   onSubmit: async (v) => console.log(v),
// })
//
// <form onSubmit={handleSubmit}>
//   <input name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
//   {touched.email && errors.email && <span>{errors.email}</span>}
//   <button type="submit" disabled={!isValid}>Enviar</button>
// </form>`

const translations = {
  pt: {
    title: 'Snippet: useForm',
    intro: (
      <>
        Hook utilitário para gerenciar formulários no React. Mantém{' '}
        <Text code>values</Text>, <Text code>errors</Text>,{' '}
        <Text code>touched</Text> e <Text code>isSubmitting</Text> sincronizados,
        expõe handlers <Text code>handleChange</Text> e{' '}
        <Text code>handleBlur</Text> prontos para inputs controlados e uma função{' '}
        <Text code>handleSubmit</Text> que só dispara quando a validação passa.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc:
      'Preencha o formulário abaixo. A validação ocorre em tempo real; os erros só aparecem depois que o campo é tocado ou no envio.',
    nameLabel: 'Nome',
    namePlaceholder: 'Seu nome completo',
    emailLabel: 'E-mail',
    emailPlaceholder: 'voce@exemplo.com',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'Mínimo 6 caracteres',
    termsLabel: 'Aceito os termos',
    submit: 'Enviar',
    reset: 'Reset',
    submitting: 'Enviando...',
    success: 'Formulário enviado com sucesso!',
    stateValues: 'Valores',
    stateErrors: 'Erros',
    stateTouched: 'Tocados',
    stateValid: 'Válido',
    stateSubmitting: 'Submitting',
    required: 'Campo obrigatório',
    invalidEmail: 'E-mail inválido',
    passwordMin: 'A senha precisa ter pelo menos 6 caracteres',
    termsRequired: 'Você precisa aceitar os termos',
    note: (
      <>
        O <Text code>validate</Text> é executado dentro de um{' '}
        <Text code>useMemo</Text>, então <Text code>errors</Text> e{' '}
        <Text code>isValid</Text> são recalculados automaticamente a cada mudança.
        A função <Text code>onSubmit</Text> só é chamada quando não há erros.
      </>
    ),
  },
  en: {
    title: 'Snippet: useForm',
    intro: (
      <>
        Utility hook to manage forms in React. Keeps{' '}
        <Text code>values</Text>, <Text code>errors</Text>,{' '}
        <Text code>touched</Text> and <Text code>isSubmitting</Text> in sync,
        exposes <Text code>handleChange</Text> and <Text code>handleBlur</Text>{' '}
        handlers for controlled inputs and a <Text code>handleSubmit</Text>{' '}
        function that only fires when validation passes.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc:
      'Fill in the form below. Validation runs in real time; errors only show after a field is touched or on submit.',
    nameLabel: 'Name',
    namePlaceholder: 'Your full name',
    emailLabel: 'E-mail',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    termsLabel: 'I agree to the terms',
    submit: 'Submit',
    reset: 'Reset',
    submitting: 'Submitting...',
    success: 'Form submitted successfully!',
    stateValues: 'Values',
    stateErrors: 'Errors',
    stateTouched: 'Touched',
    stateValid: 'Valid',
    stateSubmitting: 'Submitting',
    required: 'Required field',
    invalidEmail: 'Invalid e-mail',
    passwordMin: 'Password must be at least 6 characters',
    termsRequired: 'You must agree to the terms',
    note: (
      <>
        <Text code>validate</Text> runs inside a <Text code>useMemo</Text>, so{' '}
        <Text code>errors</Text> and <Text code>isValid</Text> are recomputed
        automatically on every change. <Text code>onSubmit</Text> is only called
        when there are no errors.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [submitted, setSubmitted] = useState(false)

  const validate = useCallback(
    (values) => {
      const errors = {}
      if (!values.name || !values.name.trim()) errors.name = t.required
      if (!values.email || !values.email.trim()) {
        errors.email = t.required
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = t.invalidEmail
      }
      if (!values.password || values.password.length < 6) errors.password = t.passwordMin
      if (!values.terms) errors.terms = t.termsRequired
      return errors
    },
    [t]
  )

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, reset, isValid, isSubmitting } = useForm({
    initialValues: { name: '', email: '', password: '', terms: false },
    validate,
    onSubmit: async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      // eslint-disable-next-line no-console
      console.log('[useForm] submitted:', data)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    },
  })

  const showError = (field) => touched[field] && errors[field]
  const status = (field) => (showError(field) ? 'error' : '')

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={t.nameLabel}
          validateStatus={status('name')}
          help={showError('name')}
        >
          <Input
            name="name"
            value={values.name}
            placeholder={t.namePlaceholder}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </Form.Item>

        <Form.Item
          label={t.emailLabel}
          validateStatus={status('email')}
          help={showError('email')}
        >
          <Input
            name="email"
            type="email"
            value={values.email}
            placeholder={t.emailPlaceholder}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </Form.Item>

        <Form.Item
          label={t.passwordLabel}
          validateStatus={status('password')}
          help={showError('password')}
        >
          <Input.Password
            name="password"
            value={values.password}
            placeholder={t.passwordPlaceholder}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </Form.Item>

        <Form.Item validateStatus={status('terms')} help={showError('terms')}>
          <Checkbox
            name="terms"
            checked={values.terms}
            onChange={(e) => handleChange({ target: { name: 'terms', value: e.target.checked, type: 'checkbox' } })}
          >
            {t.termsLabel}
          </Checkbox>
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={!isValid}>
            {isSubmitting ? t.submitting : t.submit}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={reset}>
            {t.reset}
          </Button>
        </Space>

        {submitted && (
          <Alert
            style={{ marginTop: 16 }}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={t.success}
          />
        )}
      </Form>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title={t.stateValues}>
            <pre style={{ margin: 0, fontSize: 12 }}>
              <code>{JSON.stringify(values, null, 2)}</code>
            </pre>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Card size="small" title={t.stateErrors}>
              {Object.keys(errors).length === 0 ? (
                <Tag color="success">—</Tag>
              ) : (
                <Space wrap>
                  {Object.entries(errors).map(([key, msg]) => (
                    <Tag key={key} color="error">
                      {key}: {msg}
                    </Tag>
                  ))}
                </Space>
              )}
            </Card>
            <Card size="small" title={t.stateTouched}>
              <Space wrap>
                {Object.keys(touched).length === 0 ? (
                  <Tag>—</Tag>
                ) : (
                  Object.keys(touched).map((key) => <Tag key={key}>{key}</Tag>)
                )}
              </Space>
            </Card>
            <Space>
              <Tag color={isValid ? 'success' : 'error'}>{t.stateValid}: {isValid ? 'true' : 'false'}</Tag>
              <Tag color={isSubmitting ? 'processing' : 'default'}>{t.stateSubmitting}: {isSubmitting ? 'true' : 'false'}</Tag>
            </Space>
          </Space>
        </Col>
      </Row>

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseFormSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
