import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Select, Alert, Tabs, Tag, message,
  Collapse, Input,
} from 'antd'
import { KeyOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  generateAsymmetricKeyPair,
  isCryptoSupported,
  KEY_PRESETS,
  formatJwk,
} from '../utils/asymmetricKeyGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Par de Chaves Assimétricas',
    intro: (
      <>
        Gera pares de chaves RSA (2048/3072/4096 bits) e ECDSA (P-256, P-384,
        P-521) 100% no navegador usando a <Text code>Web Crypto API</Text>. A
        chave privada nunca sai do seu ambiente; tudo acontece localmente via{' '}
        <Text code>crypto.subtle</Text>.
      </>
    ),
    notSupported: 'O seu navegador/contexto não oferece suporte à Web Crypto API.',
    algorithm: 'Algoritmo',
    generate: 'Gerar par de chaves',
    generating: 'Gerando...',
    resultTitle: 'Par de chaves gerado',
    fingerprint: 'Fingerprint (SHA-256 do SPKI)',
    publicKey: 'Chave pública',
    privateKey: 'Chave privada',
    pemTab: 'PEM',
    jwkTab: 'JWK',
    copy: 'Copiar',
    copied: 'Copiado',
    tipTitle: 'Para que serve cada formato?',
    tipBody: (
      <>
        <Text code>PEM</Text> é o formato mais universal: a chave pública em SPKI
        e a privada em PKCS#8 funcionam em OpenSSL, Node.js, Python, Java etc.{' '}
        <Text code>JWK</Text> (JSON Web Key) é usado principalmente por aplicações
        web/JWT e bibliotecas como <Text code>jose</Text>. Guarde a chave privada
        em um cofre ou variável de ambiente segura e nunca a commite no
        repositório.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'O motor mora em src/utils/asymmetricKeyGenerator.js. Abaixo um recorte do núcleo: geração via crypto.subtle.generateKey e exportação para SPKI/PKCS8, depois conversão para PEM.',
  },
  en: {
    title: 'Asymmetric Key Pair Generator',
    intro: (
      <>
        Generates RSA (2048/3072/4096-bit) and ECDSA (P-256, P-384, P-521) key
        pairs 100% in the browser using the <Text code>Web Crypto API</Text>. The
        private key never leaves your environment; everything happens locally via{' '}
        <Text code>crypto.subtle</Text>.
      </>
    ),
    notSupported: 'Your browser/context does not support the Web Crypto API.',
    algorithm: 'Algorithm',
    generate: 'Generate key pair',
    generating: 'Generating...',
    resultTitle: 'Generated key pair',
    fingerprint: 'Fingerprint (SHA-256 of SPKI)',
    publicKey: 'Public key',
    privateKey: 'Private key',
    pemTab: 'PEM',
    jwkTab: 'JWK',
    copy: 'Copy',
    copied: 'Copied',
    tipTitle: 'What is each format for?',
    tipBody: (
      <>
        <Text code>PEM</Text> is the most universal format: the public key in SPKI
        and the private key in PKCS#8 work with OpenSSL, Node.js, Python, Java,
        etc. <Text code>JWK</Text> (JSON Web Key) is mainly used by web/JWT
        applications and libraries like <Text code>jose</Text>. Store the private
        key in a vault or secure environment variable and never commit it to the
        repository.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'The engine lives in src/utils/asymmetricKeyGenerator.js. Below is a snippet of the core: generation via crypto.subtle.generateKey, export to SPKI/PKCS8, then conversion to PEM.',
  },
}

const SOURCE_SNIPPET = `async function generateAsymmetricKeyPair(presetKey) {
  const preset = KEY_PRESETS[presetKey]
  const keyPair = await crypto.subtle.generateKey(
    preset.algorithm,
    true,               // extractable
    preset.usages
  )

  const [publicSpki, privatePkcs8] = await Promise.all([
    crypto.subtle.exportKey('spki', keyPair.publicKey),
    crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
  ])

  return {
    publicPem: toPem(publicSpki, 'PUBLIC KEY'),
    privatePem: toPem(privatePkcs8, 'PRIVATE KEY'),
  }
}`

export default function AsymmetricKeyGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('rsa2048')
  const [generating, setGenerating] = useState(false)
  const [keyPair, setKeyPair] = useState(null)
  const [error, setError] = useState(null)

  const presetOptions = useMemo(
    () => Object.keys(KEY_PRESETS).map((k) => ({ value: k, label: KEY_PRESETS[k].label })),
    []
  )

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateAsymmetricKeyPair(preset)
      setKeyPair(result)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setGenerating(false)
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  const supported = isCryptoSupported()

  const pemTab = keyPair && (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text strong>{t.publicKey}</Text>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(keyPair.publicPem)}>
            {t.copy}
          </Button>
        </Space>
        <Input.TextArea
          value={keyPair.publicPem}
          readOnly
          rows={5}
          style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>
      <div>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text strong>{t.privateKey}</Text>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(keyPair.privatePem)}>
            {t.copy}
          </Button>
        </Space>
        <Input.TextArea
          value={keyPair.privatePem}
          readOnly
          rows={8}
          style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>
    </Space>
  )

  const jwkTab = keyPair && (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text strong>{t.publicKey}</Text>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(formatJwk(keyPair.publicJwk))}>
            {t.copy}
          </Button>
        </Space>
        <Input.TextArea
          value={formatJwk(keyPair.publicJwk)}
          readOnly
          rows={6}
          style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>
      <div>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text strong>{t.privateKey}</Text>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(formatJwk(keyPair.privateJwk))}>
            {t.copy}
          </Button>
        </Space>
        <Input.TextArea
          value={formatJwk(keyPair.privateJwk)}
          readOnly
          rows={8}
          style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {!supported && (
        <Alert type="warning" showIcon message={t.notSupported} />
      )}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.algorithm}</Text>
              <Select
                value={preset}
                onChange={setPreset}
                options={presetOptions}
                disabled={generating}
                style={{ minWidth: 200 }}
              />
            </Space>
          </Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={generating}
            disabled={!supported}
            onClick={handleGenerate}
          >
            {generating ? t.generating : t.generate}
          </Button>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      {keyPair && (
        <Card
          title={t.resultTitle}
          extra={(
            <Tag color="blue">
              {keyPair.algorithm}
            </Tag>
          )}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">{t.fingerprint}: </Text>
              <Text code copyable>{keyPair.fingerprint}</Text>
            </div>
            <Tabs
              defaultActiveKey="pem"
              items={[
                { key: 'pem', label: t.pemTab, children: pemTab },
                { key: 'jwk', label: t.jwkTab, children: jwkTab },
              ]}
            />
          </Space>
        </Card>
      )}

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
    </Space>
  )
}
