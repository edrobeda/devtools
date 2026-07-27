import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Select, Button, message } from 'antd'
import { ApiOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

function nowIso() {
  return new Date().toISOString()
}

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`
}

const TEMPLATES = {
  'github-push': () => ({
    ref: 'refs/heads/main',
    before: '0'.repeat(40),
    after: Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40),
    repository: { id: 123456, name: 'devtools', full_name: 'org/devtools', private: false },
    pusher: { name: 'edrobeda', email: 'edrobeda@gmail.com' },
    commits: [
      {
        id: Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40),
        message: 'feat: adiciona gerador de payload de webhook',
        timestamp: nowIso(),
        author: { name: 'Edson', email: 'edrobeda@gmail.com' },
      },
    ],
  }),
  'github-pull_request': () => ({
    action: 'opened',
    number: 42,
    pull_request: {
      id: 987654,
      number: 42,
      state: 'open',
      title: 'feat: nova funcionalidade',
      user: { login: 'edrobeda' },
      created_at: nowIso(),
      head: { ref: 'feature/nova-funcionalidade' },
      base: { ref: 'main' },
    },
    repository: { id: 123456, name: 'devtools', full_name: 'org/devtools' },
  }),
  'stripe-charge.succeeded': () => ({
    id: id('evt'),
    object: 'event',
    type: 'charge.succeeded',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: id('ch'),
        object: 'charge',
        amount: 4999,
        currency: 'brl',
        paid: true,
        status: 'succeeded',
        customer: id('cus'),
        receipt_email: 'cliente@example.com',
      },
    },
  }),
  'stripe-invoice.payment_failed': () => ({
    id: id('evt'),
    object: 'event',
    type: 'invoice.payment_failed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: id('in'),
        object: 'invoice',
        amount_due: 12900,
        currency: 'brl',
        customer: id('cus'),
        attempt_count: 2,
        next_payment_attempt: Math.floor(Date.now() / 1000) + 86400,
      },
    },
  }),
  'slack-message': () => ({
    token: 'verification-token-example',
    team_id: 'T0EXAMPLE',
    api_app_id: 'A0EXAMPLE',
    event: {
      type: 'message',
      channel: 'C0EXAMPLE',
      user: 'U0EXAMPLE',
      text: 'olá do webhook de teste!',
      ts: (Date.now() / 1000).toFixed(6),
    },
    type: 'event_callback',
    event_id: id('Ev'),
    event_time: Math.floor(Date.now() / 1000),
  }),
  'stripe-checkout.session.completed': () => ({
    id: id('evt'),
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: id('cs'),
        object: 'checkout.session',
        amount_total: 15000,
        currency: 'brl',
        customer_email: 'cliente@example.com',
        payment_status: 'paid',
        mode: 'payment',
      },
    },
  }),
}

const TEMPLATE_LABELS = {
  'github-push': 'GitHub — push',
  'github-pull_request': 'GitHub — pull_request',
  'stripe-charge.succeeded': 'Stripe — charge.succeeded',
  'stripe-invoice.payment_failed': 'Stripe — invoice.payment_failed',
  'stripe-checkout.session.completed': 'Stripe — checkout.session.completed',
  'slack-message': 'Slack — message event',
}

const translations = {
  pt: {
    title: 'Gerador de Payload de Webhook',
    intro: (
      <>
        Monta um payload de exemplo pra webhooks comuns (GitHub, Stripe,
        Slack) com valores fictícios, pronto pra colar num endpoint de teste
        local — nenhuma requisição sai daqui, é só um template estático de
        JSON preenchido com dados aleatórios a cada clique.
      </>
    ),
    template: 'Template',
    regenerate: 'Gerar novo',
    result: 'Payload gerado',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  en: {
    title: 'Webhook Payload Generator',
    intro: (
      <>
        Builds a sample payload for common webhooks (GitHub, Stripe, Slack)
        with fake values, ready to paste into a local test endpoint — no
        request ever leaves this page, it's just a static JSON template
        filled with random data on each click.
      </>
    ),
    template: 'Template',
    regenerate: 'Generate new',
    result: 'Generated payload',
    copy: 'Copy',
    copied: 'Copied',
  },
}

export default function WebhookPayloadGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [templateKey, setTemplateKey] = useState('github-push')
  const [seed, setSeed] = useState(0)

  const payload = useMemo(() => TEMPLATES[templateKey](), [templateKey, seed])
  const output = JSON.stringify(payload, null, 2)

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApiOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space wrap>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.template}</Text>
            <Select
              value={templateKey}
              onChange={setTemplateKey}
              style={{ width: 320 }}
              options={Object.keys(TEMPLATES).map((key) => ({ value: key, label: TEMPLATE_LABELS[key] }))}
            />
          </div>
          <Button style={{ marginTop: 22 }} onClick={() => setSeed((s) => s + 1)}>{t.regenerate}</Button>
        </Space>
      </Card>

      <Card
        title={t.result}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
          <code>{output}</code>
        </pre>
      </Card>
    </Space>
  )
}
