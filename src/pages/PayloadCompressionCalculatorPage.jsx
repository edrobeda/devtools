import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Input, Table, Alert, Collapse,
  Statistic, Tag, message, Upload, Row, Col,
} from 'antd'
import {
  CompressOutlined, CopyOutlined, UploadOutlined, FileTextOutlined,
  CodeOutlined, BranchesOutlined, ClearOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  analyzePayload,
  formatBytes,
  formatPercent,
  getByteSize,
  SAMPLES,
} from '../utils/payloadCompressionCalculator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Calculadora de Compressão de Payload',
    intro: (
      <>
        Meça o tamanho real (em bytes) de payloads antes e depois da compressão{' '}
        <Text code>gzip</Text>, <Text code>deflate</Text> e{' '}
        <Text code>brotli</Text> usando a CompressionStream API do navegador.
        Cole texto, arraste um arquivo ou use um dos exemplos. Nada sai do
        dispositivo.
      </>
    ),
    inputTitle: 'Payload',
    inputPlaceholder: 'Cole aqui JSON, HTML, CSS, JS ou qualquer texto...',
    loadFile: 'Carregar arquivo',
    sampleJson: 'Exemplo JSON',
    sampleHtml: 'Exemplo HTML',
    sampleCss: 'Exemplo CSS',
    sampleJs: 'Exemplo JS',
    clear: 'Limpar',
    analyze: 'Calcular compressão',
    calculating: 'Calculando...',
    resultsTitle: 'Resultados',
    original: 'Tamanho original',
    gzip: 'gzip',
    brotli: 'brotli',
    deflate: 'deflate',
    reduction: 'Redução',
    saved: 'Economia',
    ratio: 'Ratio',
    copied: 'Copiado!',
    copyAll: 'Copiar resumo',
    summaryTitle: 'Resumo',
    summaryFormat: (original, best, bestName, reduction) =>
      `Original: ${original} | ${bestName}: ${best} (${reduction} de redução)`,
    tableAlgo: 'Algoritmo',
    tableSize: 'Tamanho',
    tableReduction: 'Redução',
    tableSaved: 'Economia',
    tableRatio: 'Ratio',
    unsupportedTitle: 'Compressão não suportada',
    unsupportedBody: 'Seu navegador não suporta CompressionStream. Tente Chrome/Edge/Firefox recentes.',
    tipTitle: 'Dica',
    tipBody: 'Textos repetitivos (JSON com chaves repetidas, HTML com classes iguais, CSS redundante) costumam ter as maiores taxas de compressão. Dados já comprimidos (imagens, vídeos) não devem ser comprimidos novamente.',
    sourceTitle: 'Código-fonte',
    sourceBody: 'O motor em src/utils/payloadCompressionCalculator.js usa TextEncoder para medir bytes reais, CompressionStream para gzip/deflate/brotli, Response.blob() para obter o tamanho comprimido e calculateReduction para derivar ratio, economia e percentual.',
  },
  en: {
    title: 'Payload Compression Calculator',
    intro: (
      <>
        Measure the actual byte size of payloads before and after{' '}
        <Text code>gzip</Text>, <Text code>deflate</Text> and{' '}
        <Text code>brotli</Text> compression using the browser's native
        CompressionStream API. Paste text, drop a file or use one of the
        samples. Nothing leaves the device.
      </>
    ),
    inputTitle: 'Payload',
    inputPlaceholder: 'Paste JSON, HTML, CSS, JS or any text here...',
    loadFile: 'Load file',
    sampleJson: 'JSON sample',
    sampleHtml: 'HTML sample',
    sampleCss: 'CSS sample',
    sampleJs: 'JS sample',
    clear: 'Clear',
    analyze: 'Calculate compression',
    calculating: 'Calculating...',
    resultsTitle: 'Results',
    original: 'Original size',
    gzip: 'gzip',
    brotli: 'brotli',
    deflate: 'deflate',
    reduction: 'Reduction',
    saved: 'Saved',
    ratio: 'Ratio',
    copied: 'Copied!',
    copyAll: 'Copy summary',
    summaryTitle: 'Summary',
    summaryFormat: (original, best, bestName, reduction) =>
      `Original: ${original} | ${bestName}: ${best} (${reduction} reduction)`,
    tableAlgo: 'Algorithm',
    tableSize: 'Size',
    tableReduction: 'Reduction',
    tableSaved: 'Saved',
    tableRatio: 'Ratio',
    unsupportedTitle: 'Compression not supported',
    unsupportedBody: 'Your browser does not support CompressionStream. Try a recent Chrome/Edge/Firefox.',
    tipTitle: 'Tip',
    tipBody: 'Repetitive text (JSON with repeated keys, HTML with identical classes, redundant CSS) usually yields the highest compression ratios. Already-compressed data (images, videos) should not be compressed again.',
    sourceTitle: 'Source code',
    sourceBody: 'The engine in src/utils/payloadCompressionCalculator.js uses TextEncoder to measure real bytes, CompressionStream for gzip/deflate/brotli, Response.blob() to get the compressed size, and calculateReduction to derive ratio, savings and percentage.',
  },
}

export default function PayloadCompressionCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState(SAMPLES.json)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const cancelledRef = useRef(false)

  const runAnalysis = useCallback(async (payload) => {
    cancelledRef.current = false
    if (!payload) {
      setResult(null)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await analyzePayload(payload)
      if (!cancelledRef.current) {
        setResult(data)
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err.message || String(err))
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Recalcula automaticamente quando o texto para de mudar.
  useEffect(() => {
    const id = setTimeout(() => {
      runAnalysis(text)
    }, 500)
    return () => {
      clearTimeout(id)
      cancelledRef.current = true
    }
  }, [text, runAnalysis])

  const tableData = useMemo(() => {
    if (!result) return []
    const rows = []
    const push = (key, size, stats) => {
      if (size == null) return
      rows.push({
        key,
        algo: key,
        size,
        reduction: stats.reduction,
        saved: stats.saved,
        ratio: stats.ratio,
      })
    }
    push('gzip', result.gzip, result.gzipStats)
    push('brotli', result.brotli, result.brotliStats)
    push('deflate', result.deflate, result.deflateStats)
    return rows
  }, [result])

  const best = useMemo(() => {
    if (!tableData.length) return null
    return tableData.reduce((acc, row) => (row.size < acc.size ? row : acc), tableData[0])
  }, [tableData])

  const handleFile = ({ file }) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setText(String(e.target.result))
      message.success(`${file.name} (${formatBytes(file.size)})`)
    }
    reader.onerror = () => setError('Erro ao ler arquivo / Error reading file')
    reader.readAsText(file)
  }

  const loadSample = (key) => setText(SAMPLES[key])

  const copySummary = () => {
    if (!result || !best) return
    const summary = t.summaryFormat(
      formatBytes(result.original),
      formatBytes(best.size),
      best.algo,
      formatPercent(best.reduction)
    )
    navigator.clipboard.writeText(summary)
    message.success(t.copied)
  }

  const columns = [
    {
      title: t.tableAlgo,
      dataIndex: 'algo',
      key: 'algo',
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: t.tableSize,
      dataIndex: 'size',
      key: 'size',
      render: (value) => <Text strong>{formatBytes(value)}</Text>,
    },
    {
      title: t.tableReduction,
      dataIndex: 'reduction',
      key: 'reduction',
      render: (value) => formatPercent(value),
    },
    {
      title: t.tableSaved,
      dataIndex: 'saved',
      key: 'saved',
      render: (value) => formatBytes(value),
    },
    {
      title: t.tableRatio,
      dataIndex: 'ratio',
      key: 'ratio',
      render: (value) => value.toFixed(3),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CompressOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.inputPlaceholder}
          />
          <Space wrap>
            <Upload beforeUpload={() => false} onChange={handleFile} showUploadList={false}>
              <Button icon={<UploadOutlined />}>{t.loadFile}</Button>
            </Upload>
            <Button icon={<FileTextOutlined />} onClick={() => loadSample('json')}>{t.sampleJson}</Button>
            <Button icon={<CodeOutlined />} onClick={() => loadSample('html')}>{t.sampleHtml}</Button>
            <Button icon={<BranchesOutlined />} onClick={() => loadSample('css')}>{t.sampleCss}</Button>
            <Button icon={<CodeOutlined />} onClick={() => loadSample('js')}>{t.sampleJs}</Button>
            <Button icon={<ClearOutlined />} onClick={() => setText('')}>{t.clear}</Button>
          </Space>
        </Space>
      </Card>

      {error && (
        <Alert type="error" message={error} banner />
      )}

      <Card title={t.resultsTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={t.original}
                value={formatBytes(result?.original ?? getByteSize(text))}
                prefix={<FileTextOutlined />}
              />
            </Col>
            {['gzip', 'brotli', 'deflate'].map((algo) => {
              const size = result?.[algo]
              const stats = result?.[`${algo}Stats`]
              const isBest = best?.algo === algo
              return (
                <Col key={algo} xs={24} sm={12} md={6}>
                  <Statistic
                    title={(
                      <span>
                        {t[algo]}
                        {isBest && <Tag color="green" style={{ marginLeft: 8 }}>best</Tag>}
                      </span>
                    )}
                    value={size != null ? formatBytes(size) : '—'}
                    suffix={size != null ? formatPercent(stats.reduction) : ''}
                    valueStyle={{ color: size != null ? '#52c41a' : undefined }}
                  />
                </Col>
              )
            })}
          </Row>

          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size="small"
            loading={loading}
          />

          {result && best && (
            <Alert
              type="success"
              message={t.summaryTitle}
              description={t.summaryFormat(
                formatBytes(result.original),
                formatBytes(best.size),
                best.algo,
                formatPercent(best.reduction)
              )}
              action={(
                <Button icon={<CopyOutlined />} onClick={copySummary}>
                  {t.copyAll}
                </Button>
              )}
            />
          )}
        </Space>
      </Card>

      <Alert type="info" message={t.tipTitle} description={t.tipBody} />

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            <code>{`// src/utils/payloadCompressionCalculator.js
export async function analyzePayload(text) {
  const original = getByteSize(text)
  const [gzip, brotli, deflate] = await Promise.all([
    compressGzip(text).catch(() => null),
    compressBrotli(text).catch(() => null),
    compressDeflate(text).catch(() => null),
  ])
  return {
    original,
    gzip,
    brotli,
    deflate,
    gzipStats: calculateReduction(original, gzip ?? original),
    brotliStats: calculateReduction(original, brotli ?? original),
    deflateStats: calculateReduction(original, deflate ?? original),
  }
}`}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
