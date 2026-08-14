import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Slider, InputNumber,
  Alert, Collapse, Tag, message, Statistic, Divider,
} from 'antd'
import {
  KeyOutlined, CopyOutlined, ReloadOutlined, QrcodeOutlined,
  SafetyOutlined, LinkOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  generateTotp,
  getRemainingSeconds,
  isValidBase32,
  buildOtpauthUri,
} from '../utils/totpGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Código TOTP',
    intro: (
      <>
        Gere códigos de autenticação de dois fatores (2FA) no padrão{' '}
        <Text code>TOTP</Text> diretamente no navegador. Decodifique o secret
        em base32, compute o HMAC-SHA1 com{' '}
        <Text code>crypto.subtle</Text> e veja o código atual atualizar a cada
        segundo. Nada sai do dispositivo.
      </>
    ),
    secretLabel: 'Secret (base32)',
    secretPlaceholder: 'JBSWY3DPEHPK3PXP',
    accountLabel: 'Conta',
    accountPlaceholder: 'voce@example.com',
    issuerLabel: 'Emissor',
    issuerPlaceholder: 'DevTools',
    digitsLabel: 'Dígitos',
    stepLabel: 'Time-step (segundos)',
    generate: 'Gerar agora',
    copy: 'Copiar',
    copied: 'Copiado!',
    invalidSecret: 'Secret inválido — use apenas caracteres base32 (A-Z, 2-7).',
    currentCode: 'Código atual',
    nextIn: 'Próximo código em',
    seconds: 's',
    otpauthTitle: 'URI otpauth://',
    otpauthHelp: 'Use este URI no Gerador de QR Code ou importe em um app autenticador.',
    settingsTitle: 'Configurações',
    tipTitle: 'Segurança',
    tipBody: (
      <>
        O secret é o mesmo valor exibido pelos apps autenticadores durante a
        configuração. Quem tiver acesso a ele consegue gerar códigos válidos,
        então trate-o como senha. O algoritmo TOTP usa o relógio do dispositivo;
        diferenças de horário grandes podem gerar códigos fora de sincronia.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'O núcleo vive em src/utils/totpGenerator.js: normalizeSecret/remove espaços e traços, base32ToBytes converte de base32 para bytes, counterToBytes emite o contador de 64 bits em big-endian, hmacSha1 usa crypto.subtle.importKey + sign, e o truncamento dinâmico extrai 31 bits para formar o código numérico.',
  },
  en: {
    title: 'TOTP Code Generator',
    intro: (
      <>
        Generate two-factor authentication (2FA) codes using the{' '}
        <Text code>TOTP</Text> standard right in the browser. Decode the base32
        secret, compute HMAC-SHA1 with <Text code>crypto.subtle</Text>, and watch
        the current code refresh every second. Nothing leaves the device.
      </>
    ),
    secretLabel: 'Secret (base32)',
    secretPlaceholder: 'JBSWY3DPEHPK3PXP',
    accountLabel: 'Account',
    accountPlaceholder: 'you@example.com',
    issuerLabel: 'Issuer',
    issuerPlaceholder: 'DevTools',
    digitsLabel: 'Digits',
    stepLabel: 'Time-step (seconds)',
    generate: 'Generate now',
    copy: 'Copy',
    copied: 'Copied!',
    invalidSecret: 'Invalid secret — use only base32 characters (A-Z, 2-7).',
    currentCode: 'Current code',
    nextIn: 'Next code in',
    seconds: 's',
    otpauthTitle: 'otpauth:// URI',
    otpauthHelp: 'Use this URI in the QR Code Generator or import it into an authenticator app.',
    settingsTitle: 'Settings',
    tipTitle: 'Security',
    tipBody: (
      <>
        The secret is the same value shown by authenticator apps during setup.
        Anyone with access to it can generate valid codes, so treat it as a
        password. TOTP relies on the device clock; large time differences can
        produce out-of-sync codes.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'The core lives in src/utils/totpGenerator.js: normalizeSecret strips spaces/dashes, base32ToBytes decodes base32 into bytes, counterToBytes emits the 64-bit counter in big-endian, hmacSha1 uses crypto.subtle.importKey + sign, and dynamic truncation extracts 31 bits to build the numeric code.',
  },
}

export default function TotpGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [secret, setSecret] = useState('JBSWY3DPEHPK3PXP')
  const [account, setAccount] = useState('')
  const [issuer, setIssuer] = useState('DevTools')
  const [digits, setDigits] = useState(6)
  const [step, setStep] = useState(30)
  const [code, setCode] = useState('------')
  const [remaining, setRemaining] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const secretValid = useMemo(() => isValidBase32(secret), [secret])

  const compute = React.useCallback(async () => {
    if (!secretValid || !secret.trim()) {
      setError(t.invalidSecret)
      setCode('------')
      return
    }
    setError('')
    setLoading(true)
    try {
      const nextCode = await generateTotp(secret, { digits, step })
      setCode(nextCode)
      setRemaining(getRemainingSeconds(step))
    } catch (err) {
      setError(err.message || t.invalidSecret)
      setCode('------')
    } finally {
      setLoading(false)
    }
  }, [secret, secretValid, digits, step, t])

  // Regenerate on every tick and whenever settings/secret change.
  useEffect(() => {
    compute()
    const id = setInterval(() => {
      compute()
    }, 1000)
    return () => clearInterval(id)
  }, [compute])

  const otpauthUri = useMemo(() => {
    if (!secretValid || !account.trim()) return ''
    return buildOtpauthUri(secret, account, issuer, { digits, step })
  }, [secret, account, issuer, digits, step, secretValid])

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.settingsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.secretLabel}</Text>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={t.secretPlaceholder}
              status={secretValid || !secret ? '' : 'error'}
            />
          </div>

          <Space wrap size="large" style={{ width: '100%' }} align="start">
            <Space direction="vertical" size={4} style={{ minWidth: 220, flex: 1 }}>
              <Text strong>{t.accountLabel}</Text>
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={t.accountPlaceholder}
              />
            </Space>
            <Space direction="vertical" size={4} style={{ minWidth: 180, flex: 1 }}>
              <Text strong>{t.issuerLabel}</Text>
              <Input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder={t.issuerPlaceholder}
              />
            </Space>
          </Space>

          <Space wrap size="large" style={{ width: '100%' }} align="start">
            <Space direction="vertical" size={4} style={{ minWidth: 160 }}>
              <Text strong>{t.digitsLabel}: {digits}</Text>
              <Slider min={4} max={8} value={digits} onChange={setDigits} style={{ width: 160 }} />
            </Space>
            <Space direction="vertical" size={4} style={{ minWidth: 160 }}>
              <Text strong>{t.stepLabel}: {step}</Text>
              <Slider min={10} max={120} value={step} onChange={setStep} style={{ width: 160 }} />
            </Space>
          </Space>

          <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={compute}>
            {t.generate}
          </Button>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
          <Text type="secondary">{t.currentCode}</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Text style={{ fontSize: 48, fontWeight: 700, letterSpacing: 8, fontFamily: 'monospace' }}>
              {code}
            </Text>
            <Button size="large" icon={<CopyOutlined />} onClick={() => copy(code)} disabled={!secretValid}>
              {t.copy}
            </Button>
          </div>
          <Tag color="blue" icon={<KeyOutlined />}>
            {t.nextIn}: {remaining}{t.seconds}
          </Tag>
        </Space>
      </Card>

      {otpauthUri && (
        <Card
          title={(
            <span>
              <QrcodeOutlined style={{ marginRight: 8 }} />
              {t.otpauthTitle}
            </span>
          )}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert type="info" showIcon message={t.otpauthHelp} />
            <Input.TextArea
              value={otpauthUri}
              autoSize={{ minRows: 2, maxRows: 4 }}
              readOnly
            />
            <Button icon={<LinkOutlined />} onClick={() => copy(otpauthUri)}>
              {t.copy}
            </Button>
          </Space>
        </Card>
      )}

      <Alert type="warning" showIcon message={t.tipTitle} description={t.tipBody} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: <Paragraph type="secondary">{t.sourceBody}</Paragraph>,
          },
        ]}
      />
    </Space>
  )
}
