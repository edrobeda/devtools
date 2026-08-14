import React, { useMemo, useState } from 'react'
import {
  Typography,
  Alert,
  Card,
  Space,
  Input,
  Radio,
  InputNumber,
  ColorPicker,
  Checkbox,
  Button,
  Tag,
  Collapse,
  message,
} from 'antd'
import { BarcodeOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  generateBarcode,
  validateCode128,
  validateEan13,
  BARCODE_TYPES,
  BARCODE_DEFAULTS,
} from '../utils/barcodeGenerator'

const { Title, Paragraph, Text } = Typography

const sourceCode = `// src/utils/barcodeGenerator.js
// Gerador de códigos de barras 100% client-side.
// Suporta Code 128 (subconjunto B) e EAN-13.

export function generateBarcode(type, text, opts = {}) {
  if (type === 'ean13') return generateEan13(text, opts)
  if (type === 'code128') return generateCode128(text, opts)
  return { error: 'unknown-type' }
}

export function validateCode128(text) {
  if (!text) return { ok: false, reason: 'empty' }
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 32 || code > 126) {
      return { ok: false, reason: 'invalid-char', char: text[i], index: i }
    }
  }
  return { ok: true }
}

export function validateEan13(input) {
  if (!input) return { ok: false, reason: 'empty' }
  const digitsOnly = input.replace(/\\D/g, '')
  if (digitsOnly.length !== 12 && digitsOnly.length !== 13) {
    return { ok: false, reason: 'length', got: digitsOnly.length }
  }
  if (digitsOnly.length === 13) {
    const expected = computeEanChecksum(digitsOnly.slice(0, 12))
    if (expected !== digitsOnly[12]) {
      return { ok: false, reason: 'checksum', expected, got: digitsOnly[12] }
    }
  }
  return { ok: true, normalized: digitsOnly + computeEanChecksum(digitsOnly.slice(0, 12)) }
}`

const translations = {
  pt: {
    title: 'Gerador de Código de Barras',
    intro: (
      <>
        Crie códigos de barras <Text code>Code 128</Text> e <Text code>EAN-13</Text>{' '}
        diretamente no navegador. O algoritmo monta a cadeia de bits, calcula
        checksum e gera um SVG pronto pra copiar ou baixar — nenhum dado sai daqui.
      </>
    ),
    typeLabel: 'Padrão',
    code128: 'Code 128',
    ean13: 'EAN-13',
    inputLabel: 'Conteúdo',
    code128Placeholder: 'Digite texto ASCII imprimível…',
    ean13Placeholder: '12 ou 13 dígitos (checksum calculado automaticamente)',
    widthLabel: 'Largura (px)',
    heightLabel: 'Altura (px)',
    colorsLabel: 'Cores',
    fgLabel: 'Barras',
    bgLabel: 'Fundo',
    showText: 'Exibir texto abaixo',
    errorEmpty: 'Digite algo para gerar o código.',
    errorInvalidChar: (c) => `O caractere "${c}" não é permitido no Code 128 (use ASCII 32-126).`,
    errorLength: (n) => `EAN-13 precisa de 12 ou 13 dígitos (você digitou ${n}).`,
    errorChecksum: (exp, got) => `Checksum inválido. Esperado: ${exp}, informado: ${got}.`,
    previewTitle: 'Preview',
    previewEmpty: 'O preview aparece aqui quando o conteúdo for válido.',
    statsType: 'Tipo',
    statsModules: 'Módulos',
    statsNormalized: 'Normalizado',
    copySvg: 'Copiar SVG',
    downloadSvg: 'Baixar SVG',
    copied: 'SVG copiado',
    alertTitle: 'Code 128 vs EAN-13',
    alertBody: (
      <>
        <Text strong>Code 128</Text> é alfanumérico e aceita letras, números e a
        maioria dos símbolos ASCII imprimíveis — ideal para SKUs, rastreio e
        identificadores internos. <Text strong>EAN-13</Text> é o padrão de
        produtos no varejo: aceita apenas dígitos, e o 13º dígito é o checksum
        (se você digitar 12, ele calcula sozinho). Códigos de barras são apenas
        representação visual de texto; não criptografam nada.
      </>
    ),
    sourceTitle: 'Algoritmo-fonte',
  },
  en: {
    title: 'Barcode Generator',
    intro: (
      <>
        Create <Text code>Code 128</Text> and <Text code>EAN-13</Text> barcodes
        right in the browser. The algorithm builds the bit chain, computes the
        checksum and outputs a copy-or-download-ready SVG — no data leaves here.
      </>
    ),
    typeLabel: 'Symbology',
    code128: 'Code 128',
    ean13: 'EAN-13',
    inputLabel: 'Content',
    code128Placeholder: 'Type printable ASCII text…',
    ean13Placeholder: '12 or 13 digits (checksum calculated automatically)',
    widthLabel: 'Width (px)',
    heightLabel: 'Height (px)',
    colorsLabel: 'Colors',
    fgLabel: 'Bars',
    bgLabel: 'Background',
    showText: 'Show text below',
    errorEmpty: 'Type something to generate the barcode.',
    errorInvalidChar: (c) => `Character "${c}" is not allowed in Code 128 (use ASCII 32-126).`,
    errorLength: (n) => `EAN-13 requires 12 or 13 digits (you typed ${n}).`,
    errorChecksum: (exp, got) => `Invalid checksum. Expected: ${exp}, given: ${got}.`,
    previewTitle: 'Preview',
    previewEmpty: 'The preview will appear here once the content is valid.',
    statsType: 'Type',
    statsModules: 'Modules',
    statsNormalized: 'Normalized',
    copySvg: 'Copy SVG',
    downloadSvg: 'Download SVG',
    copied: 'SVG copied',
    alertTitle: 'Code 128 vs EAN-13',
    alertBody: (
      <>
        <Text strong>Code 128</Text> is alphanumeric and accepts letters, numbers
        and most printable ASCII symbols — great for SKUs, tracking codes and
        internal identifiers. <Text strong>EAN-13</Text> is the retail product
        standard: digits only, and the 13th digit is the checksum (type 12 and we
        compute it for you). Barcodes are just a visual representation of text;
        they do not encrypt anything.
      </>
    ),
    sourceTitle: 'Source algorithm',
  },
}

export default function BarcodeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [type, setType] = useState(BARCODE_TYPES[0])
  const [text, setText] = useState(BARCODE_DEFAULTS.code128)
  const [width, setWidth] = useState(320)
  const [height, setHeight] = useState(100)
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [showText, setShowText] = useState(true)

  // Sincroniza o placeholder/conteúdo de exemplo ao trocar de tipo.
  function handleTypeChange(nextType) {
    setType(nextType)
    setText(BARCODE_DEFAULTS[nextType])
  }

  const validation = useMemo(() => {
    if (type === 'ean13') return validateEan13(text)
    return validateCode128(text)
  }, [type, text])

  const result = useMemo(() => {
    if (!validation.ok) return null
    return generateBarcode(type, text, { width, height, fg, bg, showText })
  }, [type, text, width, height, fg, bg, showText, validation.ok])

  const errorMessage = useMemo(() => {
    if (validation.ok) return null
    if (validation.reason === 'empty') return t.errorEmpty
    if (validation.reason === 'invalid-char') {
      return t.errorInvalidChar(validation.char)
    }
    if (validation.reason === 'length') {
      return t.errorLength(validation.got)
    }
    if (validation.reason === 'checksum') {
      return t.errorChecksum(validation.expected, validation.got)
    }
    return null
  }, [validation, t])

  function copySvg() {
    if (!result || result.error) return
    navigator.clipboard.writeText(result.svg)
    messageApi.success(t.copied)
  }

  function downloadSvg() {
    if (!result || result.error) return
    const blob = new Blob([result.svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode-${type}-${result.text || 'output'}.svg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BarcodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text>{t.typeLabel}:</Text>
            <Radio.Group value={type} onChange={(e) => handleTypeChange(e.target.value)} optionType="button">
              <Radio.Button value="code128">{t.code128}</Radio.Button>
              <Radio.Button value="ean13">{t.ean13}</Radio.Button>
            </Radio.Group>
          </Space>

          <div>
            <Text>{t.inputLabel}</Text>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={type === 'ean13' ? t.ean13Placeholder : t.code128Placeholder}
              status={errorMessage ? 'error' : ''}
            />
            {errorMessage && (
              <Paragraph style={{ marginTop: 8, marginBottom: 0 }} type="danger">
                {errorMessage}
              </Paragraph>
            )}
          </div>

          <Space wrap size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.widthLabel}</Text>
              <InputNumber min={80} max={800} value={width} onChange={(v) => setWidth(v ?? 320)} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.heightLabel}</Text>
              <InputNumber min={40} max={400} value={height} onChange={(v) => setHeight(v ?? 100)} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.colorsLabel}</Text>
              <Space>
                <Space align="center" size={4}>
                  <Text type="secondary">{t.fgLabel}</Text>
                  <ColorPicker value={fg} onChange={(c) => setFg(c.toHexString())} showText />
                </Space>
                <Space align="center" size={4}>
                  <Text type="secondary">{t.bgLabel}</Text>
                  <ColorPicker value={bg} onChange={(c) => setBg(c.toHexString())} showText />
                </Space>
              </Space>
            </Space>
            <Checkbox checked={showText} onChange={(e) => setShowText(e.target.checked)}>
              {t.showText}
            </Checkbox>
          </Space>
        </Space>
      </Card>

      <Card
        title={t.previewTitle}
        extra={result && !result.error && (
          <Space>
            <Button size="small" icon={<CopyOutlined />} onClick={copySvg}>{t.copySvg}</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadSvg}>{t.downloadSvg}</Button>
          </Space>
        )}
      >
        {result && !result.error ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 160,
                background: '#f5f5f5',
                borderRadius: 8,
                padding: 16,
                overflowX: 'auto',
              }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: result.svg }}
            />
            <Space wrap>
              <Tag color="blue">{t.statsType}: {result.type}</Tag>
              <Tag color="purple">{t.statsModules}: {result.modules}</Tag>
              {type === 'ean13' && result.text && (
                <Tag color="cyan">{t.statsNormalized}: {result.text}</Tag>
              )}
            </Space>
          </Space>
        ) : (
          <Paragraph type="secondary" style={{ textAlign: 'center', margin: 0 }}>
            {t.previewEmpty}
          </Paragraph>
        )}
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{sourceCode}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
