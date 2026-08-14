import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Select, Alert, Tag, message,
  Collapse, Input, Row, Col,
} from 'antd'
import { KeyOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  generateSymmetricKey,
  generateIv,
  AES_SIZES,
  OUTPUT_FORMATS,
  IV_SIZES,
} from '../utils/symmetricKeyGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Chave Simétrica (AES)',
    intro: (
      <>
        Gera chaves AES-128, AES-192 e AES-256 100% no navegador usando a{' '}
        <Text code>Web Crypto API</Text>. A chave nunca sai do seu ambiente; a
        geração e exportação acontecem localmente via <Text code>crypto.subtle</Text>.
      </>
    ),
    notSupported: 'O seu navegador/contexto não oferece suporte à Web Crypto API.',
    size: 'Tamanho da chave',
    format: 'Formato de saída',
    ivMode: 'Gerar IV/Nonce',
    generate: 'Gerar chave',
    generating: 'Gerando...',
    resultTitle: 'Chave gerada',
    keyLabel: 'Chave',
    ivLabel: 'IV / Nonce',
    ivNone: 'Nenhum',
    ivGcm: '12 bytes (GCM/CTR)',
    ivCbc: '16 bytes (CBC)',
    copy: 'Copiar',
    copied: 'Copiado',
    tipTitle: 'Para que serve cada formato?',
    tipBody: (
      <>
        <Text code>raw</Text> devolve um <Text code>Uint8Array</Text> pronto para
        ser usado diretamente com <Text code>crypto.subtle</Text>.{' '}
        <Text code>hex</Text> e <Text code>base64</Text> são as formas mais
        comuns de armazenar ou transmitir a chave em arquivos de configuração,
        logs seguros e variáveis de ambiente. <Text code>jwk</Text> (JSON Web
        Key) é útil para aplicações web/JWT. Guarde a chave em um cofre ou
        variável de ambiente segura e nunca a commite no repositório.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'O motor mora em src/utils/symmetricKeyGenerator.js. Abaixo um recorte do núcleo: geração via crypto.subtle.generateKey e exportação para raw, hex, base64 ou jwk.',
  },
  en: {
    title: 'Symmetric Key Generator (AES)',
    intro: (
      <>
        Generates AES-128, AES-192 and AES-256 keys 100% in the browser using the{' '}
        <Text code>Web Crypto API</Text>. The key never leaves your environment;
        generation and export happen locally via <Text code>crypto.subtle</Text>.
      </>
    ),
    notSupported: 'Your browser/context does not support the Web Crypto API.',
    size: 'Key size',
    format: 'Output format',
    ivMode: 'Generate IV/Nonce',
    generate: 'Generate key',
    generating: 'Generating...',
    resultTitle: 'Generated key',
    keyLabel: 'Key',
    ivLabel: 'IV / Nonce',
    ivNone: 'None',
    ivGcm: '12 bytes (GCM/CTR)',
    ivCbc: '16 bytes (CBC)',
    copy: 'Copy',
    copied: 'Copied',
    tipTitle: 'What is each format for?',
    tipBody: (
      <>
        <Text code>raw</Text> returns a <Text code>Uint8Array</Text> ready to be
        used directly with <Text code>crypto.subtle</Text>. <Text code>hex</Text>{' '}
        and <Text code>base64</Text> are the most common ways to store or
        transmit the key in config files, secure logs and environment variables.{' '}
        <Text code>jwk</Text> (JSON Web Key) is useful for web/JWT applications.
        Store the key in a vault or secure environment variable and never commit
        it to the repository.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'The engine lives in src/utils/symmetricKeyGenerator.js. Below is a snippet of the core: generation via crypto.subtle.generateKey and export to raw, hex, base64 or jwk.',
  },
}

const SOURCE_SNIPPET = `async function generateSymmetricKey({ size = 256, format = 'hex' } = {}) {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: size },
    true,                       // extractable
    ['encrypt', 'decrypt']
  )

  if (format === 'jwk') {
    const jwk = await crypto.subtle.exportKey('jwk', key)
    return JSON.stringify(jwk, null, 2)
  }

  const raw = await crypto.subtle.exportKey('raw', key)

  if (format === 'raw') return new Uint8Array(raw)
  if (format === 'hex') {
    return Array.from(new Uint8Array(raw))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  return bufferToBase64(raw)
}`

function isCryptoSupported() {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

export default function SymmetricKeyGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [size, setSize] = useState(256)
  const [format, setFormat] = useState('hex')
  const [ivMode, setIvMode] = useState('none')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [iv, setIv] = useState(null)
  const [error, setError] = useState(null)

  const sizeOptions = useMemo(
    () => AES_SIZES.map((s) => ({ value: s, label: `${s} bits (${s / 8} bytes)` })),
    []
  )

  const formatOptions = useMemo(
    () => OUTPUT_FORMATS.map((f) => ({ value: f, label: f.toUpperCase() })),
    []
  )

  const ivOptions = useMemo(
    () => [
      { value: 'none', label: t.ivNone },
      { value: 'gcm', label: t.ivGcm },
      { value: 'cbc', label: t.ivCbc },
    ],
    [t]
  )

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const keyResult = await generateSymmetricKey({ size, format })
      setResult(keyResult)
      setIv(ivMode === 'none' ? null : generateIv(ivMode))
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {!supported && (
        <Alert type="warning" showIcon message={t.notSupported} />
      )}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{t.size}</Text>
                <Select
                  value={size}
                  onChange={setSize}
                  options={sizeOptions}
                  disabled={generating}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{t.format}</Text>
                <Select
                  value={format}
                  onChange={setFormat}
                  options={formatOptions}
                  disabled={generating}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{t.ivMode}</Text>
                <Select
                  value={ivMode}
                  onChange={setIvMode}
                  options={ivOptions}
                  disabled={generating}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          </Row>
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

      {result && (
        <Card
          title={t.resultTitle}
          extra={(
            <Tag color="blue">
              AES-{result.size} / {result.format.toUpperCase()}
            </Tag>
          )}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text strong>{t.keyLabel}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(String(result.value))}>
                  {t.copy}
                </Button>
              </Space>
              <Input.TextArea
                value={String(result.value)}
                readOnly
                rows={format === 'jwk' ? 8 : 3}
                style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
            {iv && (
              <div>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>{t.ivLabel}</Text>
                  <Space>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copy(iv.hex)}>
                      HEX
                    </Button>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copy(iv.base64)}>
                      Base64
                    </Button>
                  </Space>
                </Space>
                <Input.TextArea
                  value={iv.hex}
                  readOnly
                  rows={2}
                  style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
            )}
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
