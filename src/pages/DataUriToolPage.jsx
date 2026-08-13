import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Input, Select, Tabs, Alert, Tag, Divider, Row, Col, message,
} from 'antd'
import {
  LinkOutlined, CopyOutlined, UploadOutlined, FileImageOutlined, InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  textToDataUri, svgToDataUri, binaryToDataUri, decodeDataUri, parseDataUri,
  guessMimeType, formatBytes, isImageMime, bytesToBase64, bytesToObjectUrl,
} from '../utils/dataUriTool'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { useMessage } = message

const MIME_OPTIONS = [
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/octet-stream',
]

const CHARSET_OPTIONS = ['UTF-8', 'ASCII', 'ISO-8859-1', 'windows-1252']

const SAMPLE_TEXT = 'Hello, World! 👋'
const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <circle cx="50" cy="50" r="40" fill="#1890ff" />\n</svg>'

const translations = {
  pt: {
    title: 'Data URI Generator / Decoder',
    intro: (
      <>
        Crie e decodifique <Text code>data URIs</Text> (RFC 2397) direto no navegador. Converta
        texto, SVG ou arquivos em <Text code>data:</Text> URLs para uso inline em CSS/HTML, ou
        extraia o conteúdo original de uma data URI existente. Nada é enviado para servidor.
      </>
    ),
    tabEncodeText: 'Texto → URI',
    tabEncodeSvg: 'SVG → URI',
    tabEncodeFile: 'Arquivo → URI',
    tabDecode: 'Decodificar URI',
    inputLabel: 'Entrada',
    outputLabel: 'Data URI',
    mimeLabel: 'MIME type',
    charsetLabel: 'Charset',
    generate: 'Gerar',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    clear: 'Limpar',
    chooseFile: 'Escolher arquivo',
    dropHint: 'Ou arraste um arquivo aqui',
    preview: 'Preview',
    fileName: 'Nome',
    fileSize: 'Tamanho',
    decodedText: 'Texto decodificado',
    decodedBytes: 'Bytes decodificados',
    base64: 'Base64',
    raw: 'Raw/URL-encoded',
    invalidUri: 'Data URI inválida',
    cannotPreview: 'Preview não disponível para este tipo de conteúdo.',
    usageTitle: 'Snippet de uso',
    sourceTitle: 'Código-fonte',
    sourceBody:
      'O motor vive em src/utils/dataUriTool.js. textToDataUri escolhe entre encoding raw (quando seguro) e base64, svgToDataUri otimiza SVGs para CSS, binaryToDataUri converte Uint8Array em base64 e decodeDataUri faz o parsing reverso.',
    tipTitle: 'Quando usar data URI?',
    tipBody: (
      <>
        Use para imagens pequenas, SVGs inline ou fontes de poucos KB em CSS. Evite arquivos grandes:
        data URIs aumentam ~33% o tamanho quando usam base64, dificultam o cache separado e
        derrubam a legibilidade do código-fonte.
      </>
    ),
  },
  en: {
    title: 'Data URI Generator / Decoder',
    intro: (
      <>
        Create and decode <Text code>data URIs</Text> (RFC 2397) right in the browser. Turn text,
        SVG or files into inline <Text code>data:</Text> URLs for CSS/HTML, or extract the original
        content from an existing data URI. Nothing is sent to a server.
      </>
    ),
    tabEncodeText: 'Text → URI',
    tabEncodeSvg: 'SVG → URI',
    tabEncodeFile: 'File → URI',
    tabDecode: 'Decode URI',
    inputLabel: 'Input',
    outputLabel: 'Data URI',
    mimeLabel: 'MIME type',
    charsetLabel: 'Charset',
    generate: 'Generate',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    clear: 'Clear',
    chooseFile: 'Choose file',
    dropHint: 'Or drop a file here',
    preview: 'Preview',
    fileName: 'Name',
    fileSize: 'Size',
    decodedText: 'Decoded text',
    decodedBytes: 'Decoded bytes',
    base64: 'Base64',
    raw: 'Raw/URL-encoded',
    invalidUri: 'Invalid data URI',
    cannotPreview: 'Preview is not available for this content type.',
    usageTitle: 'Usage snippet',
    sourceTitle: 'Source code',
    sourceBody:
      'The engine lives in src/utils/dataUriTool.js. textToDataUri picks raw encoding when safe or base64 otherwise, svgToDataUri optimizes SVGs for CSS, binaryToDataUri turns Uint8Array into base64, and decodeDataUri reverses the process.',
    tipTitle: 'When to use data URIs?',
    tipBody: (
      <>
        Use them for tiny images, inline SVGs or small fonts in CSS. Avoid large files: base64 data
        URIs are ~33% bigger, hurt separate caching and make source code harder to read.
      </>
    ),
  },
}

export default function DataUriToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [textInput, setTextInput] = useState(SAMPLE_TEXT)
  const [textMime, setTextMime] = useState('text/plain')
  const [textCharset, setTextCharset] = useState('UTF-8')

  const [svgInput, setSvgInput] = useState(SAMPLE_SVG)

  const [file, setFile] = useState(null)
  const [fileUri, setFileUri] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const [decodeInput, setDecodeInput] = useState('')
  const [decoded, setDecoded] = useState(null)

  const copy = useCallback(async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [messageApi, t])

  const generatedTextUri = useMemo(() => {
    try {
      return textToDataUri(textInput, textMime, textCharset)
    } catch (e) {
      return ''
    }
  }, [textInput, textMime, textCharset])

  const generatedSvgUri = useMemo(() => {
    try {
      return svgToDataUri(svgInput)
    } catch (e) {
      return ''
    }
  }, [svgInput])

  const readFile = useCallback((selectedFile) => {
    if (!selectedFile) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target.result)
      const mime = selectedFile.type || guessMimeType(selectedFile.name)
      setFile({ name: selectedFile.name, size: selectedFile.size, mime })
      setFileUri(binaryToDataUri(bytes, mime))
    }
    reader.readAsArrayBuffer(selectedFile)
  }, [])

  const handleFileChange = useCallback((e) => {
    readFile(e.target.files?.[0])
    e.target.value = ''
  }, [readFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    readFile(e.dataTransfer.files?.[0])
  }, [readFile])

  useEffect(() => {
    const handler = (e) => e.preventDefault()
    if (dragOver) {
      window.addEventListener('dragover', handler)
      window.addEventListener('drop', handler)
    }
    return () => {
      window.removeEventListener('dragover', handler)
      window.removeEventListener('drop', handler)
    }
  }, [dragOver])

  const handleDecode = useCallback(() => {
    setDecoded(decodeDataUri(decodeInput))
  }, [decodeInput])

  const parsedDecode = useMemo(() => parseDataUri(decodeInput), [decodeInput])

  const decodePreviewUrl = useMemo(() => {
    if (!decoded?.bytes || !decoded.mimeType) return ''
    return bytesToObjectUrl(decoded.bytes, decoded.mimeType)
  }, [decoded])

  const renderOutput = (value) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <TextArea
        value={value}
        readOnly
        autoSize={{ minRows: 3, maxRows: 8 }}
        style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
      />
      <Space>
        <Button icon={<CopyOutlined />} onClick={() => copy(value)} disabled={!value}>
          {t.copy}
        </Button>
        {value && (
          <Text type="secondary">
            {formatBytes(new TextEncoder().encode(value).length)}
          </Text>
        )}
      </Space>
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><LinkOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Tabs
        defaultActiveKey="text"
        items={[
          {
            key: 'text',
            label: t.tabEncodeText,
            children: (
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Text strong>{t.inputLabel}</Text>
                  <TextArea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    autoSize={{ minRows: 4, maxRows: 10 }}
                  />
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">{t.mimeLabel}</Text>
                        <Select
                          value={textMime}
                          onChange={setTextMime}
                          style={{ width: '100%' }}
                          allowClear
                          placeholder={t.mimeLabel}
                        >
                          {MIME_OPTIONS.map((m) => <Option key={m} value={m}>{m}</Option>)}
                        </Select>
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">{t.charsetLabel}</Text>
                        <Select value={textCharset} onChange={setTextCharset} style={{ width: '100%' }}>
                          {CHARSET_OPTIONS.map((c) => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                      </Space>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong>{t.outputLabel}</Text>
                  {renderOutput(generatedTextUri)}
                </Space>
              </Card>
            ),
          },
          {
            key: 'svg',
            label: t.tabEncodeSvg,
            children: (
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Text strong>{t.inputLabel}</Text>
                  <TextArea
                    value={svgInput}
                    onChange={(e) => setSvgInput(e.target.value)}
                    autoSize={{ minRows: 5, maxRows: 12 }}
                    style={{ fontFamily: 'monospace' }}
                  />
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong>{t.outputLabel}</Text>
                  {renderOutput(generatedSvgUri)}
                  {generatedSvgUri && (
                    <Card size="small" title={t.preview}>
                      <img src={generatedSvgUri} alt="SVG preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
                    </Card>
                  )}
                </Space>
              </Card>
            ),
          },
          {
            key: 'file',
            label: t.tabEncodeFile,
            children: (
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      border: `2px dashed ${dragOver ? '#1890ff' : '#d9d9d9'}`,
                      borderRadius: 8,
                      padding: 40,
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: dragOver ? '#e6f7ff' : '#fafafa',
                      transition: 'all 0.2s',
                    }}
                  >
                    <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                    <div style={{ marginTop: 12 }}>
                      <Text strong>{t.chooseFile}</Text>
                    </div>
                    <Text type="secondary">{t.dropHint}</Text>
                  </div>
                  {file && (
                    <Space wrap>
                      <Tag icon={<FileImageOutlined />} color="blue">{file.name}</Tag>
                      <Tag>{formatBytes(file.size)}</Tag>
                      <Tag>{file.mime}</Tag>
                    </Space>
                  )}
                  {fileUri && (
                    <>
                      <Divider style={{ margin: '12px 0' }} />
                      <Text strong>{t.outputLabel}</Text>
                      {renderOutput(fileUri)}
                      {isImageMime(file.mime) && (
                        <Card size="small" title={t.preview}>
                          <img src={fileUri} alt="File preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
                        </Card>
                      )}
                    </>
                  )}
                </Space>
              </Card>
            ),
          },
          {
            key: 'decode',
            label: t.tabDecode,
            children: (
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Text strong>data URI</Text>
                  <TextArea
                    value={decodeInput}
                    onChange={(e) => setDecodeInput(e.target.value)}
                    placeholder="data:image/png;base64,iVBORw0..."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                  />
                  <Button type="primary" onClick={handleDecode} disabled={!decodeInput}>
                    {t.generate}
                  </Button>
                  {decoded === null && parsedDecode === null && decodeInput && (
                    <Alert type="error" message={t.invalidUri} />
                  )}
                  {decoded && (
                    <>
                      <Space wrap>
                        <Tag color="blue">{decoded.mimeType || 'text/plain'}</Tag>
                        {decoded.charset && <Tag>{decoded.charset}</Tag>}
                        <Tag color={decoded.isBase64 ? 'purple' : 'cyan'}>
                          {decoded.isBase64 ? t.base64 : t.raw}
                        </Tag>
                        <Tag>{formatBytes(decoded.byteLength)}</Tag>
                      </Space>
                      {decoded.error && <Alert type="warning" message={decoded.error} />}
                      {isImageMime(decoded.mimeType) && decodePreviewUrl && (
                        <Card size="small" title={t.preview}>
                          <img src={decodePreviewUrl} alt="Decoded preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
                        </Card>
                      )}
                      {!isImageMime(decoded.mimeType) && (
                        <>
                          <Text strong>{t.decodedText}</Text>
                          <TextArea
                            value={decoded.text}
                            readOnly
                            autoSize={{ minRows: 4, maxRows: 10 }}
                            style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                          />
                        </>
                      )}
                      <Button icon={<CopyOutlined />} onClick={() => copy(decoded.isBase64 ? bytesToBase64(decoded.bytes) : decoded.text)}>
                        {t.copy} {decoded.isBase64 ? t.base64 : t.raw}
                      </Button>
                    </>
                  )}
                </Space>
              </Card>
            ),
          },
        ]}
      />

      <Card title={t.usageTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{`// Texto\nconst uri = textToDataUri('hello', 'text/plain', 'UTF-8');\n\n// SVG (ótimo para background-image no CSS)\nconst svgUri = svgToDataUri('<svg>...</svg>');\n\n// Arquivo / Uint8Array\nconst fileUri = binaryToDataUri(bytes, 'image/png');\n\n// Decodificar\nconst decoded = decodeDataUri(uri);\n// decoded -> { mimeType, charset, isBase64, data, text, bytes, byteLength }`}</code>
        </pre>
      </Card>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceBody}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
          <code>{`${textToDataUri.toString()}\n\n${svgToDataUri.toString()}\n\n${binaryToDataUri.toString()}\n\n${decodeDataUri.toString()}\n\n${parseDataUri.toString()}`}</code>
        </pre>
      </Card>
    </Space>
  )
}
