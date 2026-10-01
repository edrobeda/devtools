import React, { useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Button, Checkbox, Alert, Upload, Row, Col,
  Statistic, Input, Tag, message, Collapse, Segmented, Radio,
} from 'antd'
import {
  NumberOutlined, CopyOutlined, UploadOutlined, FileTextOutlined, FileOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClearOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALGORITHMS,
  SRI_ALGORITHMS,
  hashBuffer,
  hashFile,
  buildSriTag,
  formatBytes,
  verifyHash,
} from '../utils/fileHashCalculator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

// Referência estável: sem ela, `result?.sri || {}` criaria um objeto novo a
// cada render e reinvalidatoria os useMemo de SRI abaixo.
const EMPTY_SRI = {}

const SOURCE_SNIPPET = `import { hashBuffer, hashFile, verifyHash } from '../utils/fileHashCalculator'

// Texto (UTF-8): MD5 + família SHA de qualquer conteúdo em bytes
const bytes = new TextEncoder().encode('algum texto')
const { hashes } = await hashBuffer(bytes.buffer, ['MD5', 'SHA-1', 'SHA-256'])

// Arquivo nativo: File, FileList[0] ou drag&drop (traz hashes hex + sri base64)
const { name, size, hashes, sri } = await hashFile(file, ['MD5', 'SHA-1', 'SHA-256'])

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
    sriTitle: 'Subresource Integrity (SRI) para CDN',
    sriIntro: 'No modo Arquivo os mesmos digests saem também em base64 no formato algo-base64, pronto para o atributo integrity de <script> ou <link rel="stylesheet">. Cole a URL do recurso e monte a tag completa.',
    sriAlgo: 'Algoritmo da tag',
    sriKind: 'Tipo de recurso',
    sriScript: 'Script',
    sriStyle: 'Stylesheet',
    sriUrl: 'URL do recurso',
    sriUrlPlaceholder: 'https://cdn.exemplo.com/lib/v1.0.0/app.min.js',
    sriTag: 'Tag gerada',
    sriEmpty: 'Informe a URL do recurso para ver a tag com o atributo integrity.',
    sriMissing: 'Selecione ao menos um algoritmo SHA-256/384/512 no modo Arquivo para gerar o valor SRI.',
    sourceTitle: 'Como funciona',
    sourceBody: 'O motor em src/utils/fileHashCalculator.js implementa MD5 em JS puro (padding, rounds F/G/H/I e soma final) e delega SHA-* à crypto.subtle.digest. Texto é codificado em UTF-8 com TextEncoder e tratado pelos mesmos bytes que um arquivo; a página calcula os algoritmos selecionados e oferece comparação case/whitespace-insensível. No modo Arquivo o mesmo digest é convertido para base64 por bufferToBase64, e buildSriTag monta a tag integrity a partir da URL informada.',
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
    sriTitle: 'Subresource Integrity (SRI) for CDNs',
    sriIntro: 'In File mode the same digests are also emitted as base64 in the algo-base64 format, ready for the integrity attribute of <script> or <link rel="stylesheet">. Paste the resource URL to build the complete tag.',
    sriAlgo: 'Tag algorithm',
    sriKind: 'Resource type',
    sriScript: 'Script',
    sriStyle: 'Stylesheet',
    sriUrl: 'Resource URL',
    sriUrlPlaceholder: 'https://cdn.example.com/lib/v1.0.0/app.min.js',
    sriTag: 'Generated tag',
    sriEmpty: 'Fill in the resource URL to see the tag with the integrity attribute.',
    sriMissing: 'Pick at least one of the SHA-256/384/512 algorithms in File mode to generate the SRI value.',
    sourceTitle: 'How it works',
    sourceBody: 'The engine in src/utils/fileHashCalculator.js implements MD5 in pure JS (padding, F/G/H/I rounds and final sum) and delegates SHA-* to crypto.subtle.digest. Text is encoded as UTF-8 with TextEncoder and goes through the same bytes as a file; the page computes the selected algorithms and offers case/whitespace-insensitive comparison. In File mode the same digest is converted to base64 by bufferToBase64, and buildSriTag assembles the integrity tag from the URL you provide.',
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
  const [sriAlgo, setSriAlgo] = useState('SHA-384')
  const [sriKind, setSriKind] = useState('script')
  const [sriUrl, setSriUrl] = useState('')
  const abortRef = useRef(false)

  const allSelected = useMemo(() => ALGORITHMS.every((a) => selected.includes(a)), [selected])
  const isTextMode = mode === 'text'
  const sourceReady = isTextMode ? text.length > 0 : !!file
  const sriHashes = result?.sri || EMPTY_SRI
  const sriAlgorithms = useMemo(
    () => SRI_ALGORITHMS.filter((a) => sriHashes[a]),
    [sriHashes],
  )
  const sriKindOptions = useMemo(() => [
    { value: 'script', label: t.sriScript },
    { value: 'style', label: t.sriStyle },
  ], [t.sriScript, t.sriStyle])
  const sriAlgoOptions = useMemo(() => sriAlgorithms.map((a) => ({
    value: a,
    label: a,
  })), [sriAlgorithms])

  const generatedSriTag = useMemo(() => {
    const url = sriUrl.trim()
    if (!url || sriAlgorithms.length === 0) return null
    const integrity = sriHashes[sriAlgorithms.includes(sriAlgo) ? sriAlgo : sriAlgorithms[0]]
    if (!integrity) return null
    return buildSriTag(url, integrity, sriKind)
  }, [sriUrl, sriAlgorithms, sriAlgo, sriKind, sriHashes])

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
    setSriUrl('')
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

            {!isTextMode && sriAlgorithms.length > 0 && (
              <Card size="small" title={t.sriTitle}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {t.sriIntro}
                  </Paragraph>

                  {sriAlgorithms.map((algo) => (
                    <Row key={algo} gutter={[16, 8]} align="middle">
                      <Col xs={24} sm={4}>
                        <Tag color="purple">{algo}</Tag>
                      </Col>
                      <Col xs={18} sm={16}>
                        <Text code style={{ wordBreak: 'break-all' }}>
                          {sriHashes[algo]}
                        </Text>
                      </Col>
                      <Col xs={6} sm={4} style={{ textAlign: 'right' }}>
                        <Button size="small" icon={<CopyOutlined />} onClick={() => copy(sriHashes[algo])}>
                          {t.copy}
                        </Button>
                      </Col>
                    </Row>
                  ))}

                  <Space wrap size="large" align="start">
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">{t.sriAlgo}</Text>
                      <Segmented
                        value={sriAlgorithms.includes(sriAlgo) ? sriAlgo : sriAlgorithms[0]}
                        onChange={setSriAlgo}
                        options={sriAlgoOptions}
                      />
                    </Space>
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">{t.sriKind}</Text>
                      <Radio.Group
                        options={sriKindOptions}
                        value={sriKind}
                        onChange={(e) => setSriKind(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                      />
                    </Space>
                  </Space>

                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary">{t.sriUrl}</Text>
                    <Input
                      value={sriUrl}
                      onChange={(e) => setSriUrl(e.target.value)}
                      placeholder={t.sriUrlPlaceholder}
                      prefix={<FileOutlined />}
                    />
                  </Space>

                  {generatedSriTag ? (
                    <div>
                      <Text strong>{t.sriTag}</Text>
                      <pre style={{ marginTop: 8, padding: 12, background: '#f6f6f6', borderRadius: 8, overflow: 'auto' }}>
                        <code>{generatedSriTag}</code>
                      </pre>
                      <Button icon={<CopyOutlined />} onClick={() => copy(generatedSriTag)}>
                        {t.copy}
                      </Button>
                    </div>
                  ) : (
                    <Text type="secondary">{t.sriEmpty}</Text>
                  )}
                </Space>
              </Card>
            )}

            {!isTextMode && sriAlgorithms.length === 0 && (
              <Alert type="info" showIcon message={t.sriMissing} />
            )}
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