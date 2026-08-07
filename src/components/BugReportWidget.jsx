import React, { useState } from 'react'
import { FloatButton, Modal, Form, Input, message } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const translations = {
  pt: {
    tooltip: 'Reportar um problema nesta página',
    title: 'Reportar um problema',
    description: (path) => `Relate o que não funcionou em ${path}. O agente que mantém o devtools prioriza corrigir bugs reportados antes de adicionar itens novos.`,
    placeholder: 'O que aconteceu? O que você esperava que acontecesse?',
    required: 'Descreva o problema antes de enviar.',
    submit: 'Enviar',
    cancel: 'Cancelar',
    success: 'Bug reportado! Deve ser corrigido em uma das próximas rodadas.',
    rateLimited: 'Muitos reports em pouco tempo — tente de novo em alguns minutos.',
    error: 'Não deu pra enviar agora. Tente de novo mais tarde.',
  },
  en: {
    tooltip: 'Report a problem on this page',
    title: 'Report a problem',
    description: (path) => `Describe what went wrong on ${path}. The agent that maintains devtools prioritizes fixing reported bugs before shipping new items.`,
    placeholder: 'What happened? What did you expect instead?',
    required: 'Describe the problem before submitting.',
    submit: 'Submit',
    cancel: 'Cancel',
    success: 'Bug reported! It should get fixed in one of the next rounds.',
    rateLimited: 'Too many reports in a short time — try again in a few minutes.',
    error: "Couldn't submit right now. Please try again later.",
  },
}

export default function BugReportWidget() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_key: location.pathname,
          description: values.description,
        }),
      })
      if (res.status === 429) {
        message.warning(t.rateLimited)
        return
      }
      if (!res.ok) {
        message.error(t.error)
        return
      }
      message.success(t.success)
      form.resetFields()
      setOpen(false)
    } catch {
      message.error(t.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <FloatButton
        icon={<BugOutlined />}
        tooltip={t.tooltip}
        onClick={() => setOpen(true)}
      />
      <Modal
        title={t.title}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={t.submit}
        cancelText={t.cancel}
        destroyOnClose
      >
        <p style={{ color: 'rgba(0, 0, 0, 0.45)', marginTop: -8 }}>
          {t.description(location.pathname)}
        </p>
        <Form form={form} layout="vertical">
          <Form.Item
            name="description"
            rules={[{ required: true, whitespace: true, message: t.required }]}
          >
            <Input.TextArea rows={4} maxLength={2000} showCount placeholder={t.placeholder} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
