import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, InputNumber, Segmented, Alert, Collapse,
  List, Tag, message,
} from 'antd'
import { KeyOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { generateJwtSecret, HMAC_BYTE_LENGTHS } from '../utils/jwtSecretGenerator'

const { Title, Paragraph, Text } = Typography

const OUTPUT_FORMATS = ['base64', 'base64url', 'hex', 'ascii']

const translations = {
  pt: {
    title: 'Gerador de Secret JWT',
    intro: (
      <>
        Gera chaves secretas criptograficamente seguras para assinar tokens JWT
        com HMAC-SHA256, HMAC-SHA384 ou HMAC-SHA512. Use <Text code>crypto.getRandomValues</Text>{' '}
        do navegador — nada é enviado pra fora. Escolha o algoritmo (tamanho
        recomendado) ou um comprimento customizado e copie no formato que precisar
        (Base64, Base64URL, Hex ou ASCII).
      </>
    ),
    algorithm: 'Algoritmo / tamanho',
    presetHS256: 'HS256',
    presetHS384: 'HS384',
    presetHS512: 'HS512',
    presetCustom: 'Custom',
    byteLength: 'Bytes',
    generate: 'Gerar secret',
    resultTitle: 'Secret gerado',
    entropy: 'Entropia',
    bits: 'bits',
    bytes: 'bytes',
    copy: 'Copiar',
    copied: 'Copiado',
    formatBase64: 'Base64',
    formatBase64url: 'Base64URL',
    formatHex: 'Hexadecimal',
    formatAscii: 'ASCII',
    tipTitle: 'Qual formato usar?',
    tipBody: (
      <>
        Bibliotecas como <Text code>jsonwebtoken</Text> (Node) ou <Text code>jose</Text>{' '}
        aceitam secrets em string UTF-8 ou Buffer. O mais comum é usar Base64 ou
        Base64URL em variáveis de ambiente. Hex também é aceito universalmente.
        ASCII imprimível é útil quando você precisa colar a chave em lugares que
        não lidam bem com caracteres não imprimíveis. O tamanho mínimo recomendado
        pelo RFC 7518 é de 256 bits (32 bytes) para HS256, 384 bits (48 bytes)
        para HS384 e 512 bits (64 bytes) para HS512.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'O núcleo vive em src/utils/jwtSecretGenerator.js. generateJwtSecret usa crypto.getRandomValues e formata os bytes em Base64, Base64URL, Hex e ASCII imprimível.',
  },
  en: {
    title: 'JWT Secret Generator',
    intro: (
      <>
        Generates cryptographically secure secret keys for signing JWTs with
        HMAC-SHA256, HMAC-SHA384 or HMAC-SHA512. Uses the browser's{' '}
        <Text code>crypto.getRandomValues</Text> — nothing is sent out. Choose the
        algorithm (recommended size) or a custom length and copy in the format you
        need (Base64, Base64URL, Hex or ASCII).
      </>
    ),
    algorithm: 'Algorithm / size',
    presetHS256: 'HS256',
    presetHS384: 'HS384',
    presetHS512: 'HS512',
    presetCustom: 'Custom',
    byteLength: 'Bytes',
    generate: 'Generate secret',
    resultTitle: 'Generated secret',
    entropy: 'Entropy',
    bits: 'bits',
    bytes: 'bytes',
    copy: 'Copy',
    copied: 'Copied',
    formatBase64: 'Base64',
    formatBase64url: 'Base64URL',
    formatHex: 'Hexadecimal',
    formatAscii: 'ASCII',
    tipTitle: 'Which format to use?',
    tipBody: (
      <>
        Libraries like <Text code>jsonwebtoken</Text> (Node) or <Text code>jose</Text>{' '}
        accept secrets as UTF-8 strings or Buffers. The most common choice is
        Base64 or Base64URL in environment variables. Hex is also universally
        accepted. Printable ASCII is handy when you need to paste the key into
        places that don't handle non-printable characters well. The minimum
        recommended size per RFC 7518 is 256 bits (32 bytes) for HS256, 384 bits
        (48 bytes) for HS384 and 512 bits (64 bytes) for HS512.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'The core lives in src/utils/jwtSecretGenerator.js. generateJwtSecret uses crypto.getRandomValues and formats the bytes as Base64, Base64URL, Hex and printable ASCII.',
  },
}

const PRESET_KEYS = ['HS256', 'HS384', 'HS512', 'custom']

function formatLabel(t, key) {
  if (key === 'base64') return t.formatBase64
  if (key === 'base64url') return t.formatBase64url
  if (key === 'hex') return t.formatHex
  return t.formatAscii
}

export default function JwtSecretGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [preset, setPreset] = useState('HS256')
  const [customBytes, setCustomBytes] = useState(32)
  const [secret, setSecret] = useState(() => generateJwtSecret(HMAC_BYTE_LENGTHS.HS256))

  const byteLength = useMemo(() => {
    if (preset === 'custom') return Math.max(1, Math.min(512, customBytes))
    return HMAC_BYTE_LENGTHS[preset]
  }, [preset, customBytes])

  function handleGenerate() {
    setSecret(generateJwtSecret(byteLength))
  }

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  const presetOptions = useMemo(() => PRESET_KEYS.map((key) => ({
    value: key,
    label: key === 'custom' ? t.presetCustom : `${t[`preset${key}`]} (${HMAC_BYTE_LENGTHS[key]} ${t.bytes})`,
  })), [t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.algorithm}</Text>
              <Segmented value={preset} onChange={setPreset} options={presetOptions} />
            </Space>
            {preset === 'custom' && (
              <Space direction="vertical" size={4}>
                <Text type="secondary">{t.byteLength}</Text>
                <InputNumber min={1} max={512} value={customBytes} onChange={setCustomBytes} />
              </Space>
            )}
          </Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>
            {t.generate}
          </Button>
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card
        title={t.resultTitle}
        extra={(
          <Tag color="blue">
            {secret.bytes} {t.bytes} / {secret.entropy} {t.bits} {t.entropy}
          </Tag>
        )}
      >
        <List
          size="small"
          dataSource={OUTPUT_FORMATS}
          renderItem={(format) => (
            <List.Item
              actions={[
                <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(secret[format])}>
                  {t.copy}
                </Button>,
              ]}
            >
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text strong>{formatLabel(t, format)}</Text>
                <Text code style={{ wordBreak: 'break-all' }}>{secret[format]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Collapse items={[
        {
          key: 'source',
          label: t.sourceTitle,
          children: <Paragraph type="secondary">{t.sourceBody}</Paragraph>,
        },
      ]} />
    </Space>
  )
}
