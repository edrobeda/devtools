import React, { useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Select,
  Alert,
  Collapse,
  message,
  Row,
  Col,
  Tag,
} from 'antd'
import {
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PROVIDERS,
  verifyWebhookSignature,
  generateExample,
  SOURCE,
} from '../utils/webhookSignatureValidator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const translations = {
  pt: {
    title: 'Validador de Assinatura de Webhook',
    intro: (
      <>Verifica se um webhook foi realmente enviado pelo provedor esperado. O validador recalcula o HMAC localmente com <Text code>crypto.subtle</Text> — nenhum payload, segredo ou assinatura sai do navegador. Suporta Stripe, GitHub, Shopify e um modo genérico.</>
    ),
    providerLabel: 'Provedor',
    providerHelp: 'Escolha o formato do cabeçalho de assinatura.',
    payloadLabel: 'Payload (corpo bruto)',
    payloadPlaceholder: '{\n  "id": "evt_123",\n  "object": "event"\n}',
    secretLabel: 'Segredo / Webhook secret',
    secretPlaceholder: 'whsec_... ou qualquer chave secreta',
    signatureLabel: 'Cabeçalho de assinatura',
    signaturePlaceholder: (header) => `Exemplo: ${header}: ...`,
    verify: 'Verificar assinatura',
    loadExample: 'Carregar exemplo válido',
    exampleLoaded: 'Exemplo carregado. Clique em "Verificar assinatura".',
    copyComputed: 'Copiar assinatura esperada',
    copied: 'Assinatura esperada copiada',
    resultValid: 'Assinatura válida',
    resultInvalid: 'Assinatura inválida',
    reason: {
      valid: 'O HMAC recalculado corresponde à assinatura recebida.',
      missingFields: 'Preencha payload, segredo e cabeçalho de assinatura.',
      signatureNotFound: 'Não foi possível extrair a assinatura do cabeçalho.',
      signatureMismatch: 'O HMAC recalculado é diferente da assinatura recebida.',
      timestampToleranceExceeded: 'O timestamp do cabeçalho está fora da tolerância (5 minutos).',
      error: 'Erro ao calcular o HMAC.',
    },
    expectedSignature: 'Assinatura esperada',
    sourceTitle: 'Algoritmo-fonte',
    sourceBody: 'O motor extrai a assinatura do cabeçalho, monta o payload assinado conforme o provedor (payload bruto ou timestamp.payload), recalcula o HMAC com crypto.subtle e compara em tempo constante.',
    tipsTitle: 'Dicas de segurança',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Prefira verificar a assinatura antes de processar o payload.</li>
        <li>No Stripe, verifique também o timestamp para evitar replay attacks.</li>
        <li>Use comparação em tempo constante para não vazar informações sobre o HMAC correto.</li>
        <li>Nunca exponha o webhook secret no frontend de produção — esta ferramenta é só para depuração local.</li>
      </ul>
    ),
  },
  en: {
    title: 'Webhook Signature Validator',
    intro: (
      <>Check whether a webhook was really sent by the expected provider. The validator recomputes the HMAC locally using <Text code>crypto.subtle</Text> — no payload, secret or signature leaves the browser. Supports Stripe, GitHub, Shopify and a generic mode.</>
    ),
    providerLabel: 'Provider',
    providerHelp: 'Pick the signature header format.',
    payloadLabel: 'Payload (raw body)',
    payloadPlaceholder: '{\n  "id": "evt_123",\n  "object": "event"\n}',
    secretLabel: 'Secret / webhook secret',
    secretPlaceholder: 'whsec_... or any secret key',
    signatureLabel: 'Signature header',
    signaturePlaceholder: (header) => `Example: ${header}: ...`,
    verify: 'Verify signature',
    loadExample: 'Load valid example',
    exampleLoaded: 'Example loaded. Click "Verify signature".',
    copyComputed: 'Copy expected signature',
    copied: 'Expected signature copied',
    resultValid: 'Signature is valid',
    resultInvalid: 'Signature is invalid',
    reason: {
      valid: 'The recomputed HMAC matches the received signature.',
      missingFields: 'Fill in payload, secret and signature header.',
      signatureNotFound: 'Could not extract the signature from the header.',
      signatureMismatch: 'The recomputed HMAC differs from the received signature.',
      timestampToleranceExceeded: 'The header timestamp is outside the tolerance window (5 minutes).',
      error: 'Error computing HMAC.',
    },
    expectedSignature: 'Expected signature',
    sourceTitle: 'Source code',
    sourceBody: 'The engine extracts the signature from the header, builds the signed payload according to the provider (raw payload or timestamp.payload), recomputes the HMAC with crypto.subtle, and compares it in constant time.',
    tipsTitle: 'Security tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Verify the signature before processing the payload.</li>
        <li>For Stripe, also check the timestamp to avoid replay attacks.</li>
        <li>Use constant-time comparison to avoid leaking information about the correct HMAC.</li>
        <li>Never expose the webhook secret in production frontends — this tool is for local debugging only.</li>
      </ul>
    ),
  },
}

export default function WebhookSignatureValidatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [provider, setProvider] = useState('stripe')
  const [payload, setPayload] = useState('')
  const [secret, setSecret] = useState('')
  const [signatureHeader, setSignatureHeader] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const providerConfig = PROVIDERS[provider]

  async function handleVerify() {
    setLoading(true)
    try {
      const res = await verifyWebhookSignature({
        provider,
        payload,
        secret,
        signatureHeader,
      })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadExample() {
    const example = await generateExample(provider)
    setPayload(example.payload)
    setSecret(example.secret)
    setSignatureHeader(example.signatureHeader)
    setResult(null)
    message.success(t.exampleLoaded)
  }

  function handleCopyComputed() {
    if (result?.computedSignature) {
      navigator.clipboard.writeText(result.computedSignature)
      message.success(t.copied)
    }
  }

  const resultAlert = result && (
    <Alert
      showIcon
      type={result.valid ? 'success' : 'error'}
      message={result.valid ? t.resultValid : t.resultInvalid}
      description={(
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text>{t.reason[result.reason] || result.reason}</Text>
          {result.computedSignature && (
            <Space wrap>
              <Text type="secondary">{t.expectedSignature}:</Text>
              <Text code style={{ wordBreak: 'break-all' }}>{result.computedSignature}</Text>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyComputed}>
                {t.copyComputed}
              </Button>
            </Space>
          )}
          {result.timestamp && (
            <Tag>timestamp: {result.timestamp}</Tag>
          )}
        </Space>
      )}
      icon={result.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
    />
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.providerLabel}</Text>
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>{t.providerHelp}</Paragraph>
            <Select
              value={provider}
              onChange={setProvider}
              style={{ width: '100%' }}
              options={Object.values(PROVIDERS).map((p) => ({ value: p.key, label: `${p.name} (${p.header})` }))}
            />
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div>
                <Text strong>{t.payloadLabel}</Text>
                <TextArea
                  rows={8}
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder={t.payloadPlaceholder}
                  style={{ fontFamily: 'monospace', marginTop: 4 }}
                />
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>{t.secretLabel}</Text>
                  <Input.Password
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t.secretPlaceholder}
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                    visibilityToggle
                  />
                </div>
                <div>
                  <Text strong>{t.signatureLabel}</Text>
                  <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
                    <Text code>{providerConfig.header}</Text>
                  </Paragraph>
                  <TextArea
                    rows={4}
                    value={signatureHeader}
                    onChange={(e) => setSignatureHeader(e.target.value)}
                    placeholder={t.signaturePlaceholder(providerConfig.header)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </Space>
            </Col>
          </Row>

          <Space wrap>
            <Button type="primary" icon={<CheckCircleOutlined />} loading={loading} onClick={handleVerify}>
              {t.verify}
            </Button>
            <Button icon={<ExperimentOutlined />} onClick={handleLoadExample}>
              {t.loadExample}
            </Button>
          </Space>
        </Space>
      </Card>

      {resultAlert}

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 500 }}>
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
