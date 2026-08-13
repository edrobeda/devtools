import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Segmented, Alert, Collapse, Upload,
  Radio, Input, List, Tag, message,
} from 'antd'
import {
  SafetyOutlined, CopyOutlined, UploadOutlined, FileOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  SRI_ALGORITHMS,
  computeSriForFile,
  buildSriTag,
} from '../utils/sriHashGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Hash SRI',
    intro: (
      <>
        Calcula hashes de <Text code>Subresource Integrity</Text> para arquivos
        locais usando SHA-256, SHA-384 ou SHA-512 via{' '}
        <Text code>crypto.subtle</Text>. O arquivo nunca sai do navegador —
        tudo acontece localmente. Use o resultado no atributo{' '}
        <Text code>integrity</Text> de tags <Text code>{'<script>'}</Text> ou{' '}
        <Text code>{'<link rel="stylesheet">'}</Text> para garantir que um CDN
        ou recurso externo não seja alterado sem autorização.
      </>
    ),
    upload: {
      title: 'Clique ou arraste um arquivo aqui',
      hint: 'JS, CSS ou qualquer arquivo estático (tamanho ilimitado, mas arquivos grandes podem levar alguns segundos).',
    },
    algorithm: 'Algoritmo preferido para a tag de exemplo',
    tagKind: 'Tipo de recurso',
    tagScript: 'Script',
    tagStyle: 'Stylesheet',
    cdnUrl: 'URL do recurso (para montar a tag)',
    cdnUrlPlaceholder: 'https://cdn.exemplo.com/lib/v1.0.0/app.min.js',
    resultTitle: 'Hashes calculados',
    resultFor: 'Arquivo',
    resultSize: 'Tamanho',
    bytes: 'bytes',
    copy: 'Copiar',
    copied: 'Copiado',
    clear: 'Limpar',
    generatedTag: 'Tag gerada',
    emptyTag: 'Preencha a URL do recurso para ver a tag completa.',
    tipTitle: 'Por que usar SRI?',
    tipBody: (
      <>
        SRI permite que o navegador compare o hash de um arquivo baixado com o
        valor esperado. Se o conteúdo for modificado (por exemplo, em um CDN
        comprometido), o navegador recusa carregar o recurso. Use sempre{' '}
        <Text code>crossorigin="anonymous"</Text> com recursos de CDN públicos
        e prefira SHA-384 ou SHA-512 para maior margem de segurança.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'O núcleo vive em src/utils/sriHashGenerator.js. computeSriHash usa crypto.subtle.digest, arrayBufferToBase64 converte o digest para base64 e buildSriTag monta o markup final.',
    errorCrypto: 'Web Crypto API não disponível neste contexto. Use HTTPS ou localhost.',
    errorGeneric: 'Erro ao calcular o hash.',
  },
  en: {
    title: 'SRI Hash Generator',
    intro: (
      <>
        Computes <Text code>Subresource Integrity</Text> hashes for local files
        using SHA-256, SHA-384 or SHA-512 via{' '}
        <Text code>crypto.subtle</Text>. The file never leaves the browser —
        everything happens locally. Use the result in the{' '}
        <Text code>integrity</Text> attribute of <Text code>{'<script>'}</Text>{' '}
        or <Text code>{'<link rel="stylesheet">'}</Text> tags to make sure a
        CDN or external resource has not been tampered with.
      </>
    ),
    upload: {
      title: 'Click or drag a file here',
      hint: 'JS, CSS or any static file (unlimited size, but large files may take a few seconds).',
    },
    algorithm: 'Preferred algorithm for the example tag',
    tagKind: 'Resource type',
    tagScript: 'Script',
    tagStyle: 'Stylesheet',
    cdnUrl: 'Resource URL (used to build the tag)',
    cdnUrlPlaceholder: 'https://cdn.example.com/lib/v1.0.0/app.min.js',
    resultTitle: 'Computed hashes',
    resultFor: 'File',
    resultSize: 'Size',
    bytes: 'bytes',
    copy: 'Copy',
    copied: 'Copied',
    clear: 'Clear',
    generatedTag: 'Generated tag',
    emptyTag: 'Fill in the resource URL to see the complete tag.',
    tipTitle: 'Why use SRI?',
    tipBody: (
      <>
        SRI lets the browser compare the hash of a downloaded file against the
        expected value. If the content is modified (for example, on a
        compromised CDN), the browser refuses to load the resource. Always use{' '}
        <Text code>crossorigin="anonymous"</Text> with public CDN assets and
        prefer SHA-384 or SHA-512 for a stronger security margin.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: 'The core lives in src/utils/sriHashGenerator.js. computeSriHash uses crypto.subtle.digest, arrayBufferToBase64 converts the digest to base64 and buildSriTag assembles the final markup.',
    errorCrypto: 'Web Crypto API is not available in this context. Use HTTPS or localhost.',
    errorGeneric: 'Error while computing the hash.',
  },
}

export default function SriHashGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [fileResult, setFileResult] = useState(null)
  const [preferredAlgo, setPreferredAlgo] = useState('SHA-384')
  const [tagKind, setTagKind] = useState('script')
  const [cdnUrl, setCdnUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpload = useCallback(async ({ file, onSuccess, onError }) => {
    if (!crypto?.subtle?.digest) {
      message.error(t.errorCrypto)
      onError?.(new Error(t.errorCrypto))
      return
    }
    setLoading(true)
    try {
      const result = await computeSriForFile(file.originFileObj || file)
      setFileResult(result)
      onSuccess?.('ok')
    } catch (err) {
      message.error(`${t.errorGeneric} ${err.message || ''}`)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [t])

  const copy = useCallback((value) => {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }, [t.copied])

  const clear = useCallback(() => {
    setFileResult(null)
    setCdnUrl('')
  }, [])

  const generatedTag = useMemo(() => {
    if (!fileResult || !cdnUrl.trim()) return null
    const integrity = fileResult.hashes[preferredAlgo]
    return buildSriTag(cdnUrl.trim(), integrity, tagKind)
  }, [fileResult, preferredAlgo, tagKind, cdnUrl])

  const algoOptions = useMemo(() => SRI_ALGORITHMS.map((a) => ({
    value: a,
    label: a,
  })), [])

  const tagKindOptions = useMemo(() => [
    { value: 'script', label: t.tagScript },
    { value: 'style', label: t.tagStyle },
  ], [t.tagScript, t.tagStyle])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Upload.Dragger
            name="file"
            multiple={false}
            showUploadList={false}
            customRequest={handleUpload}
            accept="*/*"
          >
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">{t.upload.title}</p>
            <p className="ant-upload-hint">{t.upload.hint}</p>
          </Upload.Dragger>

          <Space wrap size="large" align="start">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.algorithm}</Text>
              <Segmented value={preferredAlgo} onChange={setPreferredAlgo} options={algoOptions} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.tagKind}</Text>
              <Radio.Group
                options={tagKindOptions}
                value={tagKind}
                onChange={(e) => setTagKind(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              />
            </Space>
          </Space>

          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">{t.cdnUrl}</Text>
            <Input
              value={cdnUrl}
              onChange={(e) => setCdnUrl(e.target.value)}
              placeholder={t.cdnUrlPlaceholder}
              prefix={<FileOutlined />}
            />
          </Space>
        </Space>
      </Card>

      {fileResult && (
        <Card
          title={(
            <Space>
              <span>{t.resultTitle}</span>
              <Tag color="blue">{fileResult.name}</Tag>
            </Space>
          )}
          extra={(
            <Space>
              <Tag>{t.resultSize}: {fileResult.size.toLocaleString()} {t.bytes}</Tag>
              <Button size="small" icon={<DeleteOutlined />} onClick={clear}>
                {t.clear}
              </Button>
            </Space>
          )}
          loading={loading}
        >
          <List
            size="small"
            dataSource={SRI_ALGORITHMS}
            renderItem={(algo) => (
              <List.Item
                actions={[
                  <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(fileResult.hashes[algo])}>
                    {t.copy}
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text strong>{algo}</Text>
                  <Text code style={{ wordBreak: 'break-all' }}>{fileResult.hashes[algo]}</Text>
                </Space>
              </List.Item>
            )}
          />

          {generatedTag ? (
            <div style={{ marginTop: 24 }}>
              <Text strong>{t.generatedTag}</Text>
              <pre style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 6, overflow: 'auto' }}>
                <code>{generatedTag}</code>
              </pre>
              <Button icon={<CopyOutlined />} onClick={() => copy(generatedTag)}>
                {t.copy}
              </Button>
            </div>
          ) : (
            <Paragraph type="secondary" style={{ marginTop: 16 }}>{t.emptyTag}</Paragraph>
          )}
        </Card>
      )}

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

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
