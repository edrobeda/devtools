import React, { useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Checkbox, Alert, Upload, Row, Col,
  Statistic, Input, Tag, message, Collapse, Segmented,
} from 'antd'
import {
  NumberOutlined, CopyOutlined, UploadOutlined, FileTextOutlined, FileOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClearOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  hashBuffer,
  hashFile,
  formatBytes,
  verifyHash,
} from '../utils/fileHashCalculator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const SOURCE_SNIPPET = `import { hashBuffer, hashFile, verifyHash } from '../utils/fileHashCalculator'

// Texto (UTF-8): MD5 + família SHA de qualquer conteúdo em bytes
const bytes = new TextEncoder().encode('algum texto')
const { hashes } = await hashBuffer(bytes.buffer, ['MD5', 'SHA-1', 'SHA-256'])

// Arquivo nativo: File, FileList[0] ou drag&drop
const { name, size, hashes } = await hashFile(file, ['MD5', 'SHA-1', 'SHA-256'])

// Verifica se um hash bate com o esperado (case/whitespace insensível)
const ok = verifyHash(hashes['SHA-256'], expectedHash)
`

const translations = {
  pt: {
    title: 'Gerador de Hash',
    intro: (
      <>Calcule <Text code>MD5</Text>, <Text code>SHA-1</Text>,{' '}
        <Text code>SHA-256</Text>, <Text code>SHA-384</Text> e{' '}
        <Text code>SHA-512</Text> de um texto ou arquivo localmente no navegador.
        O conteúdo nunca sai do seu dispositivo: a leitura e o cálculo acontecem
        100% client-side (MD5 é implementado em JavaScript puro porque não faz
        parte da Web Crypto; os SHA usam <Text code>crypto.subtle</Text>).
      </>
    ),
    modeText: 'Texto',
    modeFile: 'Arquivo',
    textPlaceholder: 'Digite ou cole o texto...',
    selectFile: 'Selecionar arquivo',
    orDrop: 'ou arraste aqui',
    selectedFile: 'Conteúdo',
    size: 'Tamanho',
    type: 'Tipo',
    algorithms: 'Algoritmos',
    calculate: 'Calcular hashes',
    calculating: 'Calculando...',
    clear: 'Limpar',
    resultsTitle: 'Resultados',
    emptyResults: 'Digite um texto ou selecione um arquivo e clique em calcular para ver os hashes.',
    copy: 'Copiar',
    copied: 'Copiado!',
    verifyTitle: 'Verificar hash',
    verifyPlaceholder: 'Cole o hash esperado para comparar...',
    match: 'Bate',
    mismatch: 'Não bate',
    warningTitle: 'Limite de tamanho',
    warningBody: 'O arquivo é lido inteiro na memória do navegador. Arquivos muito grandes podem travar a aba; prefira arquivos menores que algumas centenas de MB.',
    sourceTitle: 'Como funciona',
    sourceBody: 'O motor em src/utils/fileHashCalculator.js implementa MD5 em JS puro (padding, rounds F/G/H/I e soma final) e delega SHA-* à crypto.subtle.digest. Texto é codificado em UTF-8 com TextEncoder e tratado pelos mesmos bytes que um arquivo; a página calcula os algoritmos selecionados e oferece comparação case/whitespace-insensível.',
    errorText: 'O texto parece vazio.',
    errorGeneric: 'Erro ao calcular hashes.',
  },
  en: {
    title: 'Hash Generator',
    intro: (
      <>Compute <Text code>MD5</Text>, <Text code>SHA-1</Text>,{' '}
        <Text code>SHA-256</Text>, <Text code>SHA-384</Text> and{' '}
        <Text code>SHA-512</Text> of any text or file locally in the browser.
        The content never leaves your device: reading and hashing happen 100%
        client-side (MD5 is implemented in pure JavaScript because it is not part
        of Web Crypto; the SHA family uses <Text code>crypto.subtle</Text>).
      </>
    ),
    modeText: 'Text',
    modeFile: 'File',
    textPlaceholder: 'Type or paste the text...',
    selectFile: 'Select file',
    orDrop: 'or drop here',
    selectedFile: 'Content',
    size: 'Size',
    type: 'Type',
    algorithms: 'Algorithms',
    calculate: 'Calculate hashes',
    calculating: 'Calculating...',
    clear: 'Clear',
    resultsTitle: 'Results',
    emptyResults: 'Type some text or select a file and click calculate to see the hashes.',
    copy: 'Copy',
    copied: 'Copied!',
    verifyTitle: 'Verify hash',
    verifyPlaceholder: 'Paste the expected hash to compare...',
    match: 'Match',
    mismatch: 'Mismatch',
    warningTitle: 'Size limit',
    warningBody: 'The file is read entirely into browser memory. Very large files may freeze the tab; prefer files smaller than a few hundred MB.',
    sourceTitle: 'How it works',
    sourceBody: 'The engine in src/utils/fileHashCalculator.js implements MD5 in pure JS (padding, F/G/H/I rounds and final sum) and delegates SHA-* to crypto.subtle.digest. Text is encoded as UTF-8 with TextEncoder and goes through the same bytes as a file; the page computes the selected algorithms and offers case/whitespace-insensitive comparison.',
    errorText: 'The text looks empty.',
    errorGeneric: 'Error calculating hashes.',
  },
}

export default function HashGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [selected, setSelected] = useState(['MD5', 'SHA-256'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [expectedHash, setExpectedHash] = useState('')
  const abortRef = useRef(false)

  const allSelected = useMemo(() => ALGORITHMS.every((a) => selected.includes(a)), [selected])
  const isTextMode = mode === 'text'
  const sourceReady = isTextMode ? text.length > 0 : !!file

  const handleUpload = ({ file: f }) => {
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
  }

  const handleModeChange = (value) => {
    setMode(value)
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
    if (!sourceReady || selected.length === 0) return
    abortRef.current = false
    setLoading(true)
    setError('')
    setResult(null)
    try {
      let data
      if (isTextMode) {
        const encoded = new TextEncoder().encode(text)
        const hashes = await hashBuffer(encoded.buffer, selected)
        data = { name: t.selectedFile, size: encoded.length, type: 'text/plain', hashes }
      } else {
        data = await hashFile(file, selected)
      }
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
    setText('')
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
      <Title level={2}><NumberOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {mode === 'file' && (
        <Alert type="warning" message={t.warningTitle} description={t.warningBody} showIcon />
      )}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented
            block
            value={mode}
            onChange={handleModeChange}
            options={[
              { label: t.modeText, value: 'text', icon: <FileTextOutlined /> },
              { label: t.modeFile, value: 'file', icon: <FileOutlined /> },
            ]}
          />

          {isTextMode ? (
            <TextArea
              rows={4}
              placeholder={t.textPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          ) : (
            <>
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
            </>
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
              disabled={!sourceReady || selected.length === 0}
            >
              {loading ? t.calculating : t.calculate}
            </Button>
            <Button icon={<ClearOutlined />} onClick={clear} disabled={!sourceReady && !result}>
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