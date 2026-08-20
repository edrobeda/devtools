import React, { useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Tag,
  Descriptions,
  Collapse,
  message,
  Row,
  Col,
} from 'antd'
import {
  SafetyCertificateOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseToken,
  verifyJwtSignature,
  signJwt,
  describeKey,
  bytesToB64url,
  b64urlToBytes,
  getEngineSource,
} from '../utils/jwtSignatureVerifier'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const HOUR = 3600

function examplePayload() {
  const now = Math.floor(Date.now() / 1000)
  return {
    sub: 'user_42',
    name: 'Patricia Santos',
    iss: 'https://app.example.com',
    aud: 'api.example.com',
    iat: now - 120,
    exp: now + HOUR,
  }
}

async function defaultPemExport(key) {
  const spki = await globalThis.crypto.subtle.exportKey('spki', key)
  let bin = ''
  new Uint8Array(spki).forEach((b) => {
    bin += String.fromCharCode(b)
  })
  const b64 = btoa(bin)
  const lines = b64.match(/.{1,64}/g) || []
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`
}

const jsonPretty = (obj) => JSON.stringify(obj, null, 2)
const jsonCompact = (obj) => JSON.stringify(obj)
const encodeSegment = (text) => bytesToB64url(new TextEncoder().encode(text))

const translations = {
  pt: {
    title: 'Verificador de Assinatura JWT',
    intro: (
      <>
        Verifica se a assinatura de um JWT realmente confere com a chave —
        cole o token e a chave pública (PEM), um JWK/JWKS ou o segredo (HMAC),
        e o navegador confere a assinatura na hora com WebCrypto. Suporta
        HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512 e EdDSA.
        Nada sai do navegador.
      </>
    ),
    tokenLabel: 'Token JWT',
    tokenPlaceholder: 'header.payload.assinatura',
    keyLabel: 'Chave de verificação',
    keyPlaceholder:
      'Cole a chave pública PEM (-----BEGIN PUBLIC KEY-----), um JWK, um JWKS {"keys":[...]} ou — para HS* — o segredo em texto puro…',
    verify: 'Verificar assinatura',
    examples: 'Exemplos gerados localmente',
    exHmac: 'HS256 (segredo)',
    exRsa: 'RS256 (RSA)',
    exEc: 'ES256 (ECDSA)',
    exTampered: 'Adulterado (inválido)',
    generating: 'Gerando chaves…',
    emptyAlert: 'Cole um token e a chave para verificar.',
    tokenInvalid:
      'O token não parece ser um JWT válido — confira se tem 3 segmentos base64url separados por ponto.',
    resultTitle: 'Resultado',
    validTag: 'Assinatura válida',
    invalidTag: 'Assinatura INVÁLIDA',
    errorTag: 'Não foi possível verificar',
    validText: (key) => `A assinatura confere com a chave (${key}).`,
    invalidText:
      'A assinatura NÃO confere com a chave fornecida — ou o token foi adulterado, ou a chave não é a mesma que assinou.',
    errText: (detail) => (detail ? `Detalhe: ${detail}` : 'Não foi possível verificar a assinatura.'),
    algLine: 'Algoritmo detectado',
    keyInfo: 'Chave usada',
    keyType: 'Tipo',
    crv: 'Curva',
    kid: 'kid',
    thumb: 'Thumbprint (RFC 7638)',
    verifiedKey: 'Chave que validou',
    testedKeys: (n) => `${n} chave(s) testada(s)`,
    kidMatch: 'kid bate com o header',
    kidMismatch: 'kid diferente do header',
    header: 'Header',
    payload: 'Payload',
    signature: 'Assinatura',
    copy: 'Copiar',
    copied: 'Assinatura copiada!',
    tokenParts: 'Estrutura do token',
    tokenHint: 'Os três segmentos decodificados do token, com a assinatura pronta pra copiar.',
    claims: 'Claims de tempo',
    claimExp: 'expira',
    claimIat: 'emitido',
    claimNbf: 'válido a partir de',
    validUntil: (until) => `válido até ${until}`,
    expired: (ago) => `expirado há ${ago}`,
    now: 'agora',
    howTitle: 'Como funciona',
    how: (
      <>
        O navegador reconstrói o payload assinado (<Text code>header.payload</Text>),
        importa a chave com o algoritmo certo — <Text code>RSASSA-PKCS1-v1_5</Text>,
        <Text code> RSA-PSS</Text> (salt = hash, RFC 7518), <Text code>ECDSA</Text>,
        <Text code> Ed25519</Text> ou <Text code>HMAC</Text> — e chama{' '}
        <Text code>crypto.subtle.verify</Text>. Se a entrada for um JWKS, cada
        chave é tentada e a que validar é identificada.
      </>
    ),
    source: 'Código-fonte do motor',
    note: 'A verificação é local: nada é enviado a nenhum servidor.',
  },
  en: {
    title: 'JWT Signature Verifier',
    intro: (
      <>
        Verify that a JWT signature really matches the key — paste the token
        and the public key (PEM), a JWK/JWKS or the secret (HMAC), and the
        browser checks the signature on the spot with WebCrypto. Supports
        HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512 and EdDSA.
        Nothing leaves the browser.
      </>
    ),
    tokenLabel: 'JWT token',
    tokenPlaceholder: 'header.payload.signature',
    keyLabel: 'Verification key',
    keyPlaceholder:
      'Paste a PEM public key (-----BEGIN PUBLIC KEY-----), a JWK, a JWKS {"keys":[...]} or — for HS* — the plain-text secret…',
    verify: 'Verify signature',
    examples: 'Examples generated locally',
    exHmac: 'HS256 (secret)',
    exRsa: 'RS256 (RSA)',
    exEc: 'ES256 (ECDSA)',
    exTampered: 'Tampered (invalid)',
    generating: 'Generating keys…',
    emptyAlert: 'Paste a token and the key to verify.',
    tokenInvalid:
      'The token does not look like a valid JWT — check that it has 3 base64url segments separated by dots.',
    resultTitle: 'Result',
    validTag: 'Signature valid',
    invalidTag: 'Invalid signature',
    errorTag: 'Could not verify',
    validText: (key) => `The signature matches the key (${key}).`,
    invalidText:
      'The signature does NOT match the provided key — the token was tampered with, or the key is not the one that signed it.',
    errText: (detail) => (detail ? `Detail: ${detail}` : 'The signature could not be verified.'),
    algLine: 'Detected algorithm',
    keyInfo: 'Key used',
    keyType: 'Type',
    crv: 'Curve',
    kid: 'kid',
    thumb: 'Thumbprint (RFC 7638)',
    verifiedKey: 'Key that validated',
    testedKeys: (n) => `${n} key(s) tested`,
    kidMatch: 'kid matches the header',
    kidMismatch: 'kid differs from the header',
    header: 'Header',
    payload: 'Payload',
    signature: 'Signature',
    copy: 'Copy',
    copied: 'Signature copied!',
    tokenParts: 'Token structure',
    tokenHint: 'The three decoded segments of the token, with the signature ready to copy.',
    claims: 'Time claims',
    claimExp: 'expires',
    claimIat: 'issued at',
    claimNbf: 'not valid before',
    validUntil: (until) => `valid until ${until}`,
    expired: (ago) => `expired ${ago} ago`,
    now: 'now',
    howTitle: 'How it works',
    how: (
      <>
        The browser rebuilds the signed payload (<Text code>header.payload</Text>),
        imports the key with the right algorithm — <Text code>RSASSA-PKCS1-v1_5</Text>,
        <Text code> RSA-PSS</Text> (salt = hash, RFC 7518), <Text code>ECDSA</Text>,
        <Text code> Ed25519</Text> or <Text code>HMAC</Text> — and calls{' '}
        <Text code>crypto.subtle.verify</Text>. If the input is a JWKS, each key
        is tried and the one that validates is identified.
      </>
    ),
    source: 'Engine source code',
    note: 'Verification is local: nothing is sent to any server.',
  },
}

function timeTag(t, value, kind) {
  const now = Date.now()
  const ms = value * 1000
  const diff = ms - now
  const abs = (d) => {
    const m = Math.round(Math.abs(d) / 60000)
    if (m < 1) return t.now
    if (m < 60) return `${m}min`
    const h = Math.round(m / 60)
    if (h < 48) return `${h}h`
    return `${Math.round(h / 24)}d`
  }
  const date = new Date(ms).toLocaleString()
  if (kind === 'exp') {
    const color = diff <= 0 ? 'red' : diff < HOUR * 1000 * 24 ? 'orange' : 'green'
    return (
      <Tag color={color}>
        {t.claimExp}: {date} {diff > 0 ? `· ${t.validUntil(abs(diff))}` : `· ${t.expired(abs(diff))}`}
      </Tag>
    )
  }
  const color = kind === 'nbf' && diff > 0 ? 'orange' : 'default'
  const label = kind === 'iat' ? t.claimIat : t.claimNbf
  return (
    <Tag color={color}>
      {label}: {date}
    </Tag>
  )
}

export default function JwtSignatureVerifierPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [token, setToken] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [building, setBuilding] = useState(false)
  const [result, setResult] = useState(null)
  const [parsed, setParsed] = useState(null)

  const replaceAll = (tk, key) => {
    setToken(tk)
    setKeyInput(key)
    setResult(null)
    setParsed(parseToken(tk))
  }

  async function handleVerify() {
    if (!token.trim() || !keyInput.trim()) {
      message.warning(t.emptyAlert)
      return
    }
    const p = parseToken(token)
    setParsed(p.ok ? p : null)
    if (!p.ok) {
      setResult({ ok: false, error: 'token_invalid', detail: p.detail })
      message.warning(t.tokenInvalid)
      return
    }
    const r = await verifyJwtSignature(token, keyInput)
    setResult({
      ...r,
      keyInfo: r.key ? await describeKey(r.key.jwk) : null,
    })
  }

  async function loadExample(kind) {
    setBuilding(true)
    try {
      const payload = examplePayload()
      if (kind === 'hmac') {
        const secret = 'devtools-demo-secret-2026'
        const tk = await signJwt({ alg: 'HS256' }, payload, secret)
        replaceAll(tk, secret)
      } else if (kind === 'rsa') {
        const kp = await globalThis.crypto.subtle.generateKey(
          {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['sign', 'verify']
        )
        const tk = await signJwt({ alg: 'RS256', kid: 'rsa-demo' }, payload, kp.privateKey)
        const pem = await defaultPemExport(kp.publicKey)
        replaceAll(tk, pem)
      } else if (kind === 'ec') {
        const kp = await globalThis.crypto.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign', 'verify']
        )
        const tk = await signJwt({ alg: 'ES256', kid: 'ec-demo' }, payload, kp.privateKey)
        const pem = await defaultPemExport(kp.publicKey)
        replaceAll(tk, pem)
      } else if (kind === 'tampered') {
        const secret = 'devtools-demo-secret-2026'
        const tk = await signJwt({ alg: 'HS256' }, payload, secret)
        const parts = tk.split('.')
        const decoded = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])))
        decoded.sub = 'user_999'
        const evil = `${parts[0]}.${encodeSegment(jsonCompact(decoded))}.${parts[2]}`
        replaceAll(evil, secret)
      }
    } finally {
      setBuilding(false)
    }
  }

  const claims = parsed?.payload
    ? [['iat', 'iat'], ['nbf', 'nbf'], ['exp', 'exp']]
        .filter(([f]) => typeof parsed.payload[f] === 'number')
        .map(([f, kind]) => ({ kind, value: parsed.payload[f] }))
    : []

  const headerKid = parsed?.header?.kid || null
  const keyKid = result?.keyInfo?.kid || null
  const kidOk = headerKid && keyKid ? headerKid === keyKid : null

  const typeLabel =
    (result?.keyInfo?.kty && `${result.keyInfo.kty}${result.keyInfo.bits ? ` ${result.keyInfo.bits} bits` : ''}`) ||
    null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>{t.title}</Title>
        <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 0 }}>
          {t.intro}
        </Paragraph>
      </div>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.tokenLabel}</Text>
            <TextArea
              value={token}
              onChange={(e) => {
                setToken(e.target.value)
                setResult(null)
              }}
              placeholder={t.tokenPlaceholder}
              autoSize={{ minRows: 3, maxRows: 8 }}
            />
          </Space>

          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.keyLabel}</Text>
            <TextArea
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value)
                setResult(null)
              }}
              placeholder={t.keyPlaceholder}
              autoSize={{ minRows: 4, maxRows: 12 }}
            />
          </Space>

          <Space wrap>
            <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleVerify} loading={building}>
              {t.verify}
            </Button>
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.examples}</Text>
            <Space wrap>
              <Button size="small" icon={<ThunderboltOutlined />} loading={building} onClick={() => loadExample('hmac')}>
                {t.exHmac}
              </Button>
              <Button size="small" icon={<KeyOutlined />} loading={building} onClick={() => loadExample('rsa')}>
                {t.exRsa}
              </Button>
              <Button size="small" icon={<KeyOutlined />} loading={building} onClick={() => loadExample('ec')}>
                {t.exEc}
              </Button>
              <Button size="small" danger loading={building} onClick={() => loadExample('tampered')}>
                {t.exTampered}
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.note}</Text>
          </Space>
        </Space>
      </Card>

      {result && (
        <Card size="small" title={t.resultTitle}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {result.verified ? (
              <Alert
                type="success"
                showIcon
                message={t.validTag}
                description={t.validText(result.key ? result.key.label : '')}
              />
            ) : result.error === 'token_invalid' ? (
              <Alert type="error" showIcon message={t.tokenInvalid} description={t.errText(result.detail)} />
            ) : result.error && !result.ok ? (
              <Alert type="warning" showIcon message={t.errorTag} description={t.errText(result.detail)} />
            ) : (
              <Alert type="error" showIcon message={t.invalidTag} description={t.invalidText} />
            )}

            {result.alg && (
              <Space wrap>
                <Text type="secondary">{t.algLine}:</Text>
                <Tag color="blue">{result.alg}</Tag>
                {result.candidateKeys > 1 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.testedKeys(result.candidateKeys)}</Text>
                )}
              </Space>
            )}

            {result.keyInfo && (
              <Descriptions size="small" column={1} title={t.keyInfo} bordered>
                <Descriptions.Item label={t.keyType}>{typeLabel || result.keyInfo.kty}</Descriptions.Item>
                {result.keyInfo.crv && <Descriptions.Item label={t.crv}>{result.keyInfo.crv}</Descriptions.Item>}
                <Descriptions.Item label={t.kid}>
                  {keyKid || '—'}
                  {kidOk !== null && (
                    <Tag color={kidOk ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                      {kidOk ? t.kidMatch : t.kidMismatch}
                    </Tag>
                  )}
                </Descriptions.Item>
                {result.keyInfo.thumb && (
                  <Descriptions.Item label={t.thumb}>
                    <Text code copyable={{ text: result.keyInfo.thumb }} style={{ wordBreak: 'break-all', fontSize: 12 }}>
                      {result.keyInfo.thumb}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}
          </Space>
        </Card>
      )}

      {parsed && parsed.ok && (
        <Card size="small" title={t.tokenParts}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.tokenHint}</Text>

            {claims.length > 0 && (
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.claims}</Text>
                <Space wrap>
                  {claims.map((c) => (
                    <span key={c.kind}>{timeTag(t, c.value, c.kind)}</span>
                  ))}
                </Space>
              </Space>
            )}

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.header}</Text>
                <pre style={{ margin: '8px 0 0', maxHeight: 240, overflow: 'auto' }}>
                  <code>{jsonPretty(parsed.header)}</code>
                </pre>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.payload}</Text>
                <pre style={{ margin: '8px 0 0', maxHeight: 240, overflow: 'auto' }}>
                  <code>{jsonPretty(parsed.payload)}</code>
                </pre>
              </Col>
            </Row>

            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.signature}</Text>
              <Space wrap>
                <Text code style={{ wordBreak: 'break-all' }}>{parsed.signatureB64}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(parsed.signatureB64).then(() => message.success(t.copied))
                  }}
                >
                  {t.copy}
                </Button>
              </Space>
            </Space>
          </Space>
        </Card>
      )}

      <Alert type="info" showIcon message={t.howTitle} description={t.how} />

      <Collapse>
        <Panel header={t.source} key="source">
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{getEngineSource()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}