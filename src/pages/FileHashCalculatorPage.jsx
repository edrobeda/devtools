import React, { useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Checkbox, Alert, Upload, Row, Col,
  Statistic, Input, Tag, message, Collapse,
} from 'antd'
import {
  SafetyOutlined, CopyOutlined, UploadOutlined, FileOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClearOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  hashFile,
  formatBytes,
  verifyHash,
} from '../utils/fileHashCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const SOURCE_SNIPPET = `import { hashFile, verifyHash } from '../utils/fileHashCalculator'

// Calcula MD5 + família SHA de um File nativo
const { hashes } = await hashFile(file, ['MD5', 'SHA-1', 'SHA-256'])
console.log(hashes['SHA-256'])

// Verifica se um hash bate com o esperado (case/whitespace insensível)
const ok = verifyHash(hashes['SHA-256'], expectedHash)
`

const translations = {
  pt: {
    title: 'Calculadora de Hashes de Arquivo',
    intro: (
      <>Calcule <Text code>MD5</Text>, <Text code>SHA-1</Text>,{' '}
        <Text code>SHA-256</Text>, <Text code>SHA-384</Text> e{' '}
        <Text code>SHA-512</Text> de qualquer arquivo localmente no navegador.
        O arquivo nunca sai do seu dispositivo: a leitura e o cálculo acontecem
        100% client-side via FileReader e Web Crypto API (MD5 é implementado em
        JavaScript puro porque não faz parte da Web Crypto).
      </>
    ),
    selectFile: 'Selecionar arquivo',
    orDrop: 'ou arraste aqui',
    selectedFile: 'Arquivo selecionado',
    size: 'Tamanho',
    type: 'Tipo',
    algorithms: 'Algoritmos',
    calculate: 'Calcular hashes',
    calculating: 'Calculando...',
    clear: 'Limpar',
    resultsTitle: 'Resultados',
    noFile: 'Nenhum arquivo selecionado.',
    emptyResults: 'Selecione um arquivo e clique em calcular para ver os hashes.',
    copy: 'Copiar',
    copied: 'Copiado!',
    verifyTitle: 'Verificar hash',
    verifyPlaceholder: 'Cole o hash esperado para comparar...',
    match: 'Bate',
    mismatch: 'Não bate',
    warningTitle: 'Limite de tamanho',
    warningBody: 'O arquivo é lido inteiro na memória do navegador. Arquivos muito grandes podem travar a aba; prefira arquivos menores que algumas centenas de MB.',
    sourceTitle: 'Como funciona',
    sourceBody: 'O motor em src/utils/fileHashCalculator.js implementa MD5 em JS puro (padding, rounds F/G/H/I e soma final) e delega SHA-* à crypto.subtle.digest. A página lê o arquivo via file.arrayBuffer(), calcula os algoritmos selecionados e oferece comparação case/whitespace-insensível.',
    errorRead: 'Erro ao ler o arquivo.',
    errorGeneric: 'Erro ao calcular hashes.',
  },
  en: {
    title: 'File Hash Calculator',
    intro: (
      <>Compute <Text code>MD5</Text>, <Text code>SHA-1</Text>,{' '}
        <Text code>SHA-256</Text>, <Text code>SHA-384</Text> and{' '}
        <Text code>SHA-512</Text> of any file locally in the browser. The file
        never leaves your device: reading and hashing happen 100% client-side
        via FileReader and the Web Crypto API (MD5 is implemented in pure
        JavaScript because it is not part of Web Crypto).
      </>
    ),
    selectFile: 'Select file',
    orDrop: 'or drop here',
    selectedFile: 'Selected file',
    size: 'Size',
    type: 'Type',
    algorithms: 'Algorithms',
    calculate: 'Calculate hashes',
    calculating: 'Calculating...',
    clear: 'Clear',
    resultsTitle: 'Results',
    noFile: 'No file selected.',
    emptyResults: 'Select a file and click calculate to see the hashes.',
    copy: 'Copy',
    copied: 'Copied!',
    verifyTitle: 'Verify hash',
    verifyPlaceholder: 'Paste the expected hash to compare...',
    match: 'Match',
    mismatch: 'Mismatch',
    warningTitle: 'Size limit',
    warningBody: 'The file is read entirely into browser memory. Very large files may freeze the tab; prefer files smaller than a few hundred MB.',
    sourceTitle: 'How it works',
    sourceBody: 'The engine in src/utils/fileHashCalculator.js implements MD5 in pure JS (padding, F/G/H/I rounds and final sum) and delegates SHA-* to crypto.subtle.digest. The page reads the file via file.arrayBuffer(), computes the selected algorithms and offers case/whitespace-insensitive comparison.',
    errorRead: 'Error reading file.',
    errorGeneric: 'Error calculating hashes.',
  },
}

export default function FileHashCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [file, setFile] = useState(null)
  const [selected, setSelected] = useState(['MD5', 'SHA-256'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [expectedHash, setExpectedHash] = useState('')
  const abortRef = useRef(false)

  const allSelected = useMemo(() => ALGORITHMS.every((a) => selected.includes(a)), [selected])

  const handleUpload = ({ file: f }) => {
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
  }

  const toggleAlgorithm = (algo) => {
    setSelected((prev) => {
      const next = prev.includes(algo)
        ? prev.filter((a) => a !== algo)
        : [...prev, algo]
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? [] : [...ALGORITHMS])
  }

  const run = async () => {
    if (!file || selected.length === 0) return
    abortRef.current = false
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await hashFile(file, selected)
      if (!abortRef.current) {
        setResult(data)
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(t.errorGeneric)
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false)
      }
    }
  }

  const clear = () => {
    abortRef.current = true
    setFile(null)
    setResult(null)
    setError('')
    setExpectedHash('')
  }

  const copy = (value) => {
    navigator.clipboard.writeText(value)
    message.success(t.copied)
  }

  const expectedNormalized = expectedHash.trim()
  const matchInfo = useMemo(() => {
    if (!result || !expectedNormalized) return null
    for (const algo of ALGORITHMS) {
      const hash = result.hashes[algo]
      if (hash && verifyHash(hash, expectedNormalized)) {
        return { algo, match: true }
      }
    }
    return { match: false }
  }, [result, expectedNormalized])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="warning" message={t.warningTitle} description={t.warningBody} showIcon />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Upload.Dragger
            beforeUpload={() => false}
            onChange={handleUpload}
            showUploadList={false}
            accept="*/*"
            style={{ padding: 24 }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">{t.selectFile}</p>
            <p className="ant-upload-hint">{t.orDrop}</p>
          </Upload.Dragger>

          {file && (
            <Card size="small" style={{ background: '#f6f6f6' }}>
              <Row gutter={[16, 8]}>
                <Col xs={24} md={12}>
                  <Text strong><FileOutlined /> {file.name}</Text>
                </Col>
                <Col xs={12} md={6}>
                  <Text type="secondary">{t.size}: </Text>
                  <Text>{formatBytes(file.size)}</Text>
                </Col>
                <Col xs={12} md={6}>
                  <Text type="secondary">{t.type}: </Text>
                  <Text>{file.type || '—'}</Text>
                </Col>
              </Row>
            </Card>
          )}

          <div>
            <Text strong>{t.algorithms}</Text>
            <div style={{ marginTop: 8 }}>
              <Checkbox checked={allSelected} onChange={toggleAll}>
                {lang === 'pt' ? 'Todos' : 'All'}
              </Checkbox>
              {ALGORITHMS.map((algo) => (
                <Checkbox
                  key={algo}
                  checked={selected.includes(algo)}
                  onChange={() => toggleAlgorithm(algo)}
                  style={{ marginLeft: 16 }}
                >
                  {algo}
                </Checkbox>
              ))}
            </div>
          </div>

          <Space wrap>
            <Button
              type="primary"
              onClick={run}
              loading={loading}
              disabled={!file || selected.length === 0}
            >
              {loading ? t.calculating : t.calculate}
            </Button>
            <Button icon={<ClearOutlined />} onClick={clear} disabled={!file && !result}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      {error && <Alert type="error" message={error} banner />}

      <Card title={t.resultsTitle}>
        {!result ? (
          <Text type="secondary">{t.emptyResults}</Text>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic title={t.selectedFile} value={result.name} />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic title={t.size} value={formatBytes(result.size)} />
              </Col>
            </Row>

            {ALGORITHMS.filter((a) => result.hashes[a]).map((algo) => {
              const hash = result.hashes[algo]
              return (
                <Card key={algo} size="small">
                  <Row gutter={[16, 8]} align="middle">
                    <Col xs={24} sm={4}>
                      <Tag color="blue">{algo}</Tag>
                    </Col>
                    <Col xs={18} sm={16}>
                      <Text code copyable={{ text: hash, tooltips: false }} style={{ wordBreak: 'break-all' }}>
                        {hash}
                      </Text>
                    </Col>
                    <Col xs={6} sm={4} style={{ textAlign: 'right' }}>
                      <Button size="small" icon={<CopyOutlined />} onClick={() => copy(hash)}>
                        {t.copy}
                      </Button>
                    </Col>
                  </Row>
                </Card>
              )
            })}

            <Card size="small" title={t.verifyTitle}>
              <Input
                value={expectedHash}
                onChange={(e) => setExpectedHash(e.target.value)}
                placeholder={t.verifyPlaceholder}
                suffix={
                  matchInfo ? (
                    matchInfo.match ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        {t.match} {matchInfo.algo}
                      </Tag>
                    ) : (
                      <Tag color="error" icon={<CloseCircleOutlined />}>
                        {t.mismatch}
                      </Tag>
                    )
                  ) : null
                }
              />
            </Card>
          </Space>
        )}
      </Card>

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph type="secondary">{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            <code>{SOURCE_SNIPPET}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
