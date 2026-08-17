import React, { useState } from 'react'
import {
  Typography, Card, Space, Button, Input, Select, Tabs, Alert,
  Collapse, Row, Col, Tag, message,
} from 'antd'
import { LockOutlined, CopyOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  AES_ALGORITHMS,
  DEFAULT_ITERATIONS,
  encryptAES,
  decryptAES,
  isCryptoSupported,
} from '../utils/aesEncryptDecrypt'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE_SNIPPET = `async function encryptAES({ algorithm, password, plaintext, iterations = 100_000 }) {
  const [mode, size] = parseAlgorithmOption(algorithm) // ex: AES-GCM-256
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const ivLen = mode === 'AES-GCM' ? 12 : 16
  const iv = crypto.getRandomValues(new Uint8Array(ivLen))

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: mode, length: size },
    false,
    ['encrypt', 'decrypt']
  )

  const ciphertext = await crypto.subtle.encrypt(
    mode === 'AES-GCM' ? { name: mode, iv, tagLength: 128 } : { name: mode, iv },
    key,
    new TextEncoder().encode(plaintext)
  )

  return btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
}`

const translations = {
  pt: {
    title: 'Criptografar / Descriptografar AES',
    intro: (
      <>
        Criptografe e descriptografe texto com <Text code>AES-GCM</Text> e{' '}
        <Text code>AES-CBC</Text> 100% no navegador. A senha é derivada em uma
        chave via <Text code>PBKDF2-HMAC-SHA256</Text> com salt aleatório — nada
        é enviado para servidores.
      </>
    ),
    notSupported: 'O seu navegador/contexto não oferece suporte à Web Crypto API.',
    mode: 'Modo',
    iterations: 'Iterações PBKDF2',
    password: 'Senha',
    passwordPlaceholder: 'Digite uma senha forte...',
    plaintext: 'Texto plano',
    plaintextPlaceholder: 'Cole aqui o texto a ser cifrado...',
    ciphertext: 'Payload cifrado',
    ciphertextPlaceholder: 'Cole aqui o payload (modo:tamanho:iterações:salt:iv:ciphertext)...',
    encrypt: 'Criptografar',
    decrypt: 'Descriptografar',
    encrypting: 'Criptografando...',
    decrypting: 'Descriptografando...',
    resultEncrypt: 'Payload gerado',
    resultDecrypt: 'Texto decifrado',
    copy: 'Copiar',
    copied: 'Copiado',
    sample: 'Exemplo',
    samplePassword: 'senha-secreta-123',
    samplePlaintext: 'Esta é uma mensagem secreta que será cifrada no navegador.',
    securityNote: 'A segurança depende da senha. Para dados reais, use uma senha longa e aleatória, armazenada em cofre.',
    formatTipTitle: 'Formato do payload',
    formatTipBody: 'O payload de saída segue o formato modo:tamanho:iterações:salt:iv:ciphertext, todos em base64 (exceto os separadores). Você pode copiar esse payload inteiro para descriptografar depois, desde que use a mesma senha.',
    sourceTitle: 'Código-fonte',
    sourceBody: 'O motor mora em src/utils/aesEncryptDecrypt.js. Abaixo um recorte do núcleo: derivação de chave com PBKDF2 e criptografia via crypto.subtle.encrypt.',
    errorTitle: 'Erro',
  },
  en: {
    title: 'AES Encrypt / Decrypt',
    intro: (
      <>
        Encrypt and decrypt text with <Text code>AES-GCM</Text> and{' '}
        <Text code>AES-CBC</Text> 100% in the browser. The password is derived
        into a key using <Text code>PBKDF2-HMAC-SHA256</Text> with a random
        salt — nothing is sent to any server.
      </>
    ),
    notSupported: 'Your browser/context does not support the Web Crypto API.',
    mode: 'Mode',
    iterations: 'PBKDF2 iterations',
    password: 'Password',
    passwordPlaceholder: 'Type a strong password...',
    plaintext: 'Plaintext',
    plaintextPlaceholder: 'Paste the text to encrypt here...',
    ciphertext: 'Ciphertext payload',
    ciphertextPlaceholder: 'Paste the payload (mode:size:iterations:salt:iv:ciphertext)...',
    encrypt: 'Encrypt',
    decrypt: 'Decrypt',
    encrypting: 'Encrypting...',
    decrypting: 'Decrypting...',
    resultEncrypt: 'Generated payload',
    resultDecrypt: 'Decrypted text',
    copy: 'Copy',
    copied: 'Copied',
    sample: 'Sample',
    samplePassword: 'secret-password-123',
    samplePlaintext: 'This is a secret message that will be encrypted in the browser.',
    securityNote: 'Security depends on the password. For real data, use a long random password stored in a vault.',
    formatTipTitle: 'Payload format',
    formatTipBody: 'The output payload follows mode:size:iterations:salt:iv:ciphertext, all base64-encoded except the separators. Copy the entire payload to decrypt later, as long as you use the same password.',
    sourceTitle: 'Source code',
    sourceBody: 'The engine lives in src/utils/aesEncryptDecrypt.js. Below is a snippet of the core: key derivation with PBKDF2 and encryption via crypto.subtle.encrypt.',
    errorTitle: 'Error',
  },
}

export default function AesEncryptDecryptPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('AES-GCM-256')
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS)
  const [password, setPassword] = useState('')
  const [plaintext, setPlaintext] = useState('')
  const [ciphertextInput, setCiphertextInput] = useState('')
  const [encryptResult, setEncryptResult] = useState(null)
  const [decryptResult, setDecryptResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('encrypt')

  const algorithmOptions = AES_ALGORITHMS.map((alg) => ({
    value: alg,
    label: alg,
  }))

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  async function handleEncrypt() {
    setLoading(true)
    setError(null)
    setEncryptResult(null)
    try {
      const result = await encryptAES({ algorithm: mode, password, plaintext, iterations })
      setEncryptResult(result)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDecrypt() {
    setLoading(true)
    setError(null)
    setDecryptResult(null)
    try {
      const result = await decryptAES({ payload: ciphertextInput, password })
      setDecryptResult(result)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  function applySample() {
    setPassword(t.samplePassword)
    setPlaintext(t.samplePlaintext)
    setActiveTab('encrypt')
    setEncryptResult(null)
    setDecryptResult(null)
    setError(null)
  }

  const supported = isCryptoSupported()

  const tabItems = [
    {
      key: 'encrypt',
      label: (
        <span>
          <LockOutlined style={{ marginRight: 6 }} />
          {t.encrypt}
        </span>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.plaintext}</Text>
            <TextArea
              rows={5}
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder={t.plaintextPlaceholder}
              style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 13 }}
            />
          </div>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={loading}
            disabled={!supported || !password || !plaintext || iterations < 1000}
            onClick={handleEncrypt}
            block
          >
            {loading ? t.encrypting : t.encrypt}
          </Button>

          {encryptResult && (
            <Card
              title={t.resultEncrypt}
              extra={
                <Tag color="blue">
                  {encryptResult.algorithm}-{encryptResult.keySize} / PBKDF2 ×{encryptResult.iterations}
                </Tag>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>payload</Text>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(encryptResult.payload)}>
                      {t.copy}
                    </Button>
                  </Space>
                  <TextArea
                    value={encryptResult.payload}
                    readOnly
                    rows={3}
                    style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">salt (base64)</Text>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                      {encryptResult.salt}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">iv (base64)</Text>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                      {encryptResult.iv}
                    </div>
                  </Col>
                </Row>
              </Space>
            </Card>
          )}
        </Space>
      ),
    },
    {
      key: 'decrypt',
      label: (
        <span>
          <SafetyOutlined style={{ marginRight: 6 }} />
          {t.decrypt}
        </span>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.ciphertext}</Text>
            <TextArea
              rows={5}
              value={ciphertextInput}
              onChange={(e) => setCiphertextInput(e.target.value)}
              placeholder={t.ciphertextPlaceholder}
              style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={loading}
            disabled={!supported || !password || !ciphertextInput || iterations < 1000}
            onClick={handleDecrypt}
            block
          >
            {loading ? t.decrypting : t.decrypt}
          </Button>

          {decryptResult !== null && (
            <Card title={t.resultDecrypt}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>{t.plaintext}</Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(decryptResult)}>
                    {t.copy}
                  </Button>
                </Space>
                <TextArea
                  value={decryptResult}
                  readOnly
                  rows={5}
                  style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 13 }}
                />
              </Space>
            </Card>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><LockOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {!supported && <Alert type="warning" showIcon message={t.notSupported} />}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{t.mode}</Text>
                <Select
                  value={mode}
                  onChange={setMode}
                  options={algorithmOptions}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{t.iterations}</Text>
                <Input
                  type="number"
                  min={1000}
                  step={10000}
                  value={iterations}
                  onChange={(e) => setIterations(Number(e.target.value))}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          </Row>

          <div>
            <Text strong>{t.password}</Text>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              disabled={loading}
              style={{ marginTop: 4, fontFamily: 'monospace' }}
            />
          </div>

          <Button onClick={applySample} disabled={loading}>
            {t.sample}
          </Button>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={t.errorTitle} description={error} />}

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Alert type="info" showIcon message={t.formatTipTitle} description={t.formatTipBody} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflow: 'auto' }}>
                  <code>{SOURCE_SNIPPET}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />

      <Alert type="warning" showIcon message={t.securityNote} />
    </Space>
  )
}
