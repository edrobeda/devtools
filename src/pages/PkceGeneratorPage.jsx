import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Select, InputNumber, Slider,
  Input, Alert, Collapse, Tag, message, Row, Col, Divider,
} from 'antd'
import {
  KeyOutlined, CopyOutlined, ReloadOutlined, SafetyOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  isCryptoSupported,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateNonce,
  buildAuthorizationUrl,
  PKCE_METHODS,
  DEFAULT_VERIFIER_LENGTH,
  SOURCE_CODE,
} from '../utils/pkceGenerator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

const translations = {
  pt: {
    title: 'Gerador de PKCE / OAuth2',
    intro: (
      <>
        Gere os parâmetros de um fluxo{' '}
        <Text code>OAuth2 com PKCE</Text> (RFC 7636) diretamente no
        navegador: <Text code>code_verifier</Text>,{' '}
        <Text code>code_challenge</Text> (S256 ou plain),{' '}
        <Text code>state</Text> e <Text code>nonce</Text>. Tudo é calculado
        localmente com a Web Crypto API; nenhum segredo sai do dispositivo.
      </>
    ),
    notSupported: (
      <>
        O seu navegador não oferece suporte à{' '}
        <Text code>Web Crypto API</Text>, necessária para gerar o verifier e
        o challenge S256. Use um navegador moderno com HTTPS ou localhost.
      </>
    ),
    settingsTitle: 'Configurações do PKCE',
    methodLabel: 'Método do code_challenge',
    verifierLength: 'Comprimento do code_verifier',
    generateAll: 'Gerar tudo',
    regenerate: 'Gerar',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyFail: 'Falha ao copiar',
    verifierLabel: 'code_verifier',
    challengeLabel: 'code_challenge',
    stateLabel: 'state',
    nonceLabel: 'nonce',
    methodTag: 'método',
    authUrlTitle: 'URL de autorização (exemplo)',
    authEndpointLabel: 'Endpoint de autorização',
    clientIdLabel: 'client_id',
    redirectUriLabel: 'redirect_uri',
    scopeLabel: 'scope',
    responseTypeLabel: 'response_type',
    tipTitle: 'Segurança',
    tipBody: (
      <>
        O <Text code>code_verifier</Text> é um segredo de uso único: quem o
        possuir pode trocar o authorization code por um token. Sempre use{' '}
        <Text code>S256</Text> em produção; o método <Text code>plain</Text>{' '}
        só existe por compatibilidade e é desencorajado. O{' '}
        <Text code>state</Text> protege contra ataques CSRF e o{' '}
        <Text code>nonce</Text> ajuda a prevenir replay de tokens no OpenID
        Connect. Nunca armazene o verifier em URLs ou logs.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: (
      <>
        O núcleo vive em <Text code>src/utils/pkceGenerator.js</Text>:{' '}
        <Text code>generateRandomString</Text> sorteia bytes com{' '}
        <Text code>crypto.getRandomValues</Text>,{' '}
        <Text code>generateCodeChallenge</Text> aplica{' '}
        <Text code>crypto.subtle.digest('SHA-256', ...)</Text> e converte o
        digest para base64url.
      </>
    ),
    methodS256: 'S256 (SHA-256 + base64url)',
    methodPlain: 'plain (não recomendado)',
  },
  en: {
    title: 'PKCE / OAuth2 Generator',
    intro: (
      <>
        Generate the parameters for an{' '}
        <Text code>OAuth2 PKCE</Text> flow (RFC 7636) right in the browser:{' '}
        <Text code>code_verifier</Text>, <Text code>code_challenge</Text>{' '}
        (S256 or plain), <Text code>state</Text> and <Text code>nonce</Text>.
        Everything is computed locally using the Web Crypto API; no secret
        leaves the device.
      </>
    ),
    notSupported: (
      <>
        Your browser does not support the{' '}
        <Text code>Web Crypto API</Text>, which is required to generate the
        verifier and the S256 challenge. Use a modern browser with HTTPS or
        localhost.
      </>
    ),
    settingsTitle: 'PKCE settings',
    methodLabel: 'code_challenge method',
    verifierLength: 'code_verifier length',
    generateAll: 'Generate all',
    regenerate: 'Generate',
    copy: 'Copy',
    copied: 'Copied!',
    copyFail: 'Failed to copy',
    verifierLabel: 'code_verifier',
    challengeLabel: 'code_challenge',
    stateLabel: 'state',
    nonceLabel: 'nonce',
    methodTag: 'method',
    authUrlTitle: 'Authorization URL (example)',
    authEndpointLabel: 'Authorization endpoint',
    clientIdLabel: 'client_id',
    redirectUriLabel: 'redirect_uri',
    scopeLabel: 'scope',
    responseTypeLabel: 'response_type',
    tipTitle: 'Security',
    tipBody: (
      <>
        The <Text code>code_verifier</Text> is a one-time secret: anyone who
        holds it can exchange the authorization code for a token. Always use{' '}
        <Text code>S256</Text> in production; the <Text code>plain</Text>{' '}
        method exists only for compatibility and is discouraged.{' '}
        <Text code>state</Text> protects against CSRF attacks and{' '}
        <Text code>nonce</Text> helps prevent token replay in OpenID Connect.
        Never store the verifier in URLs or logs.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: (
      <>
        The core lives in <Text code>src/utils/pkceGenerator.js</Text>:{' '}
        <Text code>generateRandomString</Text> draws bytes with{' '}
        <Text code>crypto.getRandomValues</Text>, and{' '}
        <Text code>generateCodeChallenge</Text> applies{' '}
        <Text code>crypto.subtle.digest('SHA-256', ...)</Text> and converts
        the digest to base64url.
      </>
    ),
    methodS256: 'S256 (SHA-256 + base64url)',
    methodPlain: 'plain (not recommended)',
  },
}

export default function PkceGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const supported = useMemo(() => isCryptoSupported(), [])
  const [method, setMethod] = useState('S256')
  const [verifierLength, setVerifierLength] = useState(DEFAULT_VERIFIER_LENGTH)
  const [verifier, setVerifier] = useState('')
  const [challenge, setChallenge] = useState('')
  const [state, setState] = useState('')
  const [nonce, setNonce] = useState('')

  const [authEndpoint, setAuthEndpoint] = useState('https://oauth.example.com/authorize')
  const [clientId, setClientId] = useState('my-client-id')
  const [redirectUri, setRedirectUri] = useState('https://app.example.com/callback')
  const [scope, setScope] = useState('openid profile')
  const [responseType, setResponseType] = useState('code')

  const recomputeChallenge = useCallback(async () => {
    if (!verifier) return
    try {
      const c = await generateCodeChallenge(verifier, method)
      setChallenge(c)
    } catch (err) {
      message.error(err.message)
    }
  }, [verifier, method])

  const regenerateAll = useCallback(async () => {
    try {
      const v = generateCodeVerifier(verifierLength)
      const [c, s, n] = await Promise.all([
        generateCodeChallenge(v, method),
        generateState(),
        generateNonce(),
      ])
      setVerifier(v)
      setChallenge(c)
      setState(s)
      setNonce(n)
    } catch (err) {
      message.error(err.message)
    }
  }, [verifierLength, method])

  useEffect(() => {
    regenerateAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    recomputeChallenge()
  }, [recomputeChallenge])

  const authUrl = useMemo(() => {
    try {
      return buildAuthorizationUrl(authEndpoint, {
        response_type: responseType,
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: challenge,
        code_challenge_method: method,
        nonce,
      })
    } catch {
      return ''
    }
  }, [authEndpoint, responseType, clientId, redirectUri, scope, state, challenge, method, nonce])

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(t.copied)
    } catch {
      message.error(t.copyFail)
    }
  }, [t])

  const renderValueCard = (label, value, onRegenerate) => (
    <Card size="small" bodyStyle={{ padding: 12 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Text strong>{label}</Text>
        <Input.TextArea
          value={value}
          autoSize={{ minRows: 1, maxRows: 4 }}
          readOnly
        />
        <Space wrap>
          <Button icon={<CopyOutlined />} size="small" onClick={() => copy(value)}>
            {t.copy}
          </Button>
          {onRegenerate && (
            <Button icon={<ReloadOutlined />} size="small" onClick={onRegenerate}>
              {t.regenerate}
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  )

  if (!supported) {
    return (
      <>
        <Title level={2}><KeyOutlined /> {t.title}</Title>
        <Paragraph>{t.intro}</Paragraph>
        <Alert message={t.notSupported} type="error" showIcon />
      </>
    )
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={t.settingsTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.methodLabel}</Text>
              <Select
                value={method}
                onChange={setMethod}
                style={{ width: '100%' }}
                options={PKCE_METHODS.map((m) => ({
                  value: m,
                  label: m === 'S256' ? t.methodS256 : t.methodPlain,
                }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.verifierLength}</Text>
              <Row gutter={8} align="middle">
                <Col flex="auto">
                  <Slider
                    min={43}
                    max={128}
                    value={verifierLength}
                    onChange={setVerifierLength}
                  />
                </Col>
                <Col>
                  <InputNumber
                    min={43}
                    max={128}
                    value={verifierLength}
                    onChange={(v) => setVerifierLength(Number(v))}
                  />
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={regenerateAll}
          style={{ marginTop: 16 }}
        >
          {t.generateAll}
        </Button>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          {renderValueCard(t.verifierLabel, verifier, async () => {
            const v = generateCodeVerifier(verifierLength)
            setVerifier(v)
          })}
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" bodyStyle={{ padding: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space>
                <Text strong>{t.challengeLabel}</Text>
                <Tag size="small">{t.methodTag}: {method}</Tag>
              </Space>
              <Input.TextArea
                value={challenge}
                autoSize={{ minRows: 1, maxRows: 4 }}
                readOnly
              />
              <Button icon={<CopyOutlined />} size="small" onClick={() => copy(challenge)}>
                {t.copy}
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          {renderValueCard(t.stateLabel, state, () => setState(generateState()))}
        </Col>
        <Col xs={24} lg={12}>
          {renderValueCard(t.nonceLabel, nonce, () => setNonce(generateNonce()))}
        </Col>
      </Row>

      <Card
        title={<><LinkOutlined /> {t.authUrlTitle}</>}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong>{t.authEndpointLabel}</Text>
              <Input value={authEndpoint} onChange={(e) => setAuthEndpoint(e.target.value)} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong>{t.clientIdLabel}</Text>
              <Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong>{t.redirectUriLabel}</Text>
              <Input value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong>{t.scopeLabel}</Text>
              <Input value={scope} onChange={(e) => setScope(e.target.value)} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong>{t.responseTypeLabel}</Text>
              <Input value={responseType} onChange={(e) => setResponseType(e.target.value)} />
            </Space>
          </Col>
        </Row>
        <Divider />
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Input.TextArea value={authUrl} autoSize={{ minRows: 2, maxRows: 6 }} readOnly />
          <Button icon={<CopyOutlined />} onClick={() => copy(authUrl)}>
            {t.copy}
          </Button>
        </Space>
      </Card>

      <Alert message={t.tipTitle} description={t.tipBody} type="warning" showIcon icon={<SafetyOutlined />} />

      <Collapse items={[
        {
          key: 'source',
          label: t.sourceTitle,
          children: (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Paragraph>{t.sourceBody}</Paragraph>
              <pre style={{ margin: 0, padding: 12, background: '#f6f8fa', borderRadius: 8, overflow: 'auto' }}>
                <code>{SOURCE_CODE}</code>
              </pre>
            </Space>
          ),
        },
      ]} />
    </Space>
  )
}
