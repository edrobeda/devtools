import React, { useState } from 'react'
import { Typography, Card, Input, Space, Button, Alert, message, Tabs, Descriptions } from 'antd'
import { SwapOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

function encodeUnicodeBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(`0x${hex}`)))
}

function decodeUnicodeBase64(b64) {
  return decodeURIComponent(
    atob(b64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  )
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const translations = {
  pt: {
    title: 'Base64 Encode/Decode',
    intro: (
      <>
        Codifica e decodifica texto ou arquivos em Base64 direto no navegador
        — nenhum dado sai daqui. Texto usa um truque unicode-safe (via{' '}
        <Text code>encodeURIComponent</Text>) pra suportar acentos e emojis.
      </>
    ),
    tabText: 'Texto',
    tabFile: 'Arquivo',
    textPlaceholder: 'Digite ou cole o texto...',
    base64Placeholder: 'Cole o Base64 aqui...',
    encode: 'Codificar →',
    decode: '← Decodificar',
    invalidTitle: 'Base64 inválido',
    copy: 'Copiar',
    copied: 'Copiado',
    chooseFile: 'Escolher arquivo',
    fileInfo: 'Informações do arquivo',
    name: 'Nome',
    type: 'Tipo',
    size: 'Tamanho',
    base64Output: 'Base64 do arquivo',
    decodeFileTitle: 'Decodificar Base64 em arquivo',
    filenamePlaceholder: 'nome-do-arquivo.bin',
    mimePlaceholder: 'application/octet-stream',
    download: 'Baixar arquivo',
    noFile: 'Nenhum arquivo selecionado ainda.',
  },
  en: {
    title: 'Base64 Encode/Decode',
    intro: (
      <>
        Encodes and decodes text or files to/from Base64 right in the
        browser — no data leaves this page. Text uses a unicode-safe trick
        (via <Text code>encodeURIComponent</Text>) to support accents and
        emoji.
      </>
    ),
    tabText: 'Text',
    tabFile: 'File',
    textPlaceholder: 'Type or paste the text...',
    base64Placeholder: 'Paste Base64 here...',
    encode: 'Encode →',
    decode: '← Decode',
    invalidTitle: 'Invalid Base64',
    copy: 'Copy',
    copied: 'Copied',
    chooseFile: 'Choose file',
    fileInfo: 'File info',
    name: 'Name',
    type: 'Type',
    size: 'Size',
    base64Output: 'File as Base64',
    decodeFileTitle: 'Decode Base64 into a file',
    filenamePlaceholder: 'file-name.bin',
    mimePlaceholder: 'application/octet-stream',
    download: 'Download file',
    noFile: 'No file selected yet.',
  },
}

function TextTab({ t }) {
  const [plain, setPlain] = useState('')
  const [b64, setB64] = useState('')
  const [error, setError] = useState(null)

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  function handleEncode() {
    setError(null)
    setB64(encodeUnicodeBase64(plain))
  }

  function handleDecode() {
    try {
      setPlain(decodeUnicodeBase64(b64))
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card
        title="Texto"
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(plain)}>{t.copy}</Button>}
      >
        <TextArea
          rows={5}
          placeholder={t.textPlaceholder}
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <Space style={{ width: '100%', justifyContent: 'center' }}>
        <Button type="primary" onClick={handleEncode}>{t.encode}</Button>
        <Button onClick={handleDecode}>{t.decode}</Button>
      </Space>

      {error && <Alert type="error" showIcon message={t.invalidTitle} description={error} />}

      <Card
        title="Base64"
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(b64)}>{t.copy}</Button>}
      >
        <TextArea
          rows={5}
          placeholder={t.base64Placeholder}
          value={b64}
          onChange={(e) => setB64(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>
    </Space>
  )
}

function FileTab({ t }) {
  const [fileMeta, setFileMeta] = useState(null)
  const [fileB64, setFileB64] = useState('')
  const [decodeB64, setDecodeB64] = useState('')
  const [filename, setFilename] = useState('')
  const [mime, setMime] = useState('')

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
      setFileB64(base64)
      setFileMeta({ name: file.name, type: file.type || 'application/octet-stream', size: file.size })
    }
    reader.readAsDataURL(file)
  }

  function copy(value) {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  function handleDownload() {
    try {
      const byteChars = atob(decodeB64.trim())
      const bytes = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i += 1) bytes[i] = byteChars.charCodeAt(i)
      const blob = new Blob([bytes], { type: mime || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'file.bin'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      message.error(err.message)
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title={t.fileInfo}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <input type="file" onChange={handleFile} />
          {fileMeta ? (
            <Descriptions size="small" column={1}>
              <Descriptions.Item label={t.name}>{fileMeta.name}</Descriptions.Item>
              <Descriptions.Item label={t.type}>{fileMeta.type}</Descriptions.Item>
              <Descriptions.Item label={t.size}>{formatBytes(fileMeta.size)}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Text type="secondary">{t.noFile}</Text>
          )}
        </Space>
      </Card>

      {fileB64 && (
        <Card
          title={t.base64Output}
          extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(fileB64)}>{t.copy}</Button>}
        >
          <TextArea rows={6} readOnly value={fileB64} style={{ fontFamily: 'monospace' }} />
        </Card>
      )}

      <Card title={t.decodeFileTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={6}
            placeholder={t.base64Placeholder}
            value={decodeB64}
            onChange={(e) => setDecodeB64(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap>
            <Input
              placeholder={t.filenamePlaceholder}
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              style={{ width: 220 }}
            />
            <Input
              placeholder={t.mimePlaceholder}
              value={mime}
              onChange={(e) => setMime(e.target.value)}
              style={{ width: 220 }}
            />
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} disabled={!decodeB64.trim()}>
              {t.download}
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  )
}

export default function Base64ToolPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Tabs
        items={[
          { key: 'text', label: t.tabText, children: <TextTab t={t} /> },
          { key: 'file', label: t.tabFile, children: <FileTab t={t} /> },
        ]}
      />
    </Space>
  )
}
