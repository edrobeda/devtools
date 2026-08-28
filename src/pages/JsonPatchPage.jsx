import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert, List, Tag, Row, Col, Button, Collapse, Segmented, message } from 'antd'
import { ApartmentOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { applyPatch, PRESETS } from '../utils/jsonPatch'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ENGINE_SOURCE = `// RFC 6901 — JSON Pointer
export function parsePointer(pointer) {
  if (pointer === '') return []
  if (pointer[0] !== '/') throw new Error('deve começar com "/" ou ser "" (raiz)')
  return pointer.slice(1).split('/').map((t) =>
    t.replace(/~1/g, '/').replace(/~0/g, '~')
  )
}

// RFC 6902 — operações
// add:    insere value em path (array: splice/index, "-" = append; objeto: set)
// remove: apaga path (array: splice; objeto: delete)
// replace: troca value em path (alvo deve existir)
// move:   remove de "from" e adiciona em "path"
// copy:   lê "from" e adiciona um clone em "path"
// test:   compara value com o atual em path; falha o patch se diferente

export function applyPatch(doc, patch) {
  if (!Array.isArray(patch)) return { ok: false, error: 'patch deve ser array' }
  let result = deepClone(doc)           // nunca muta o original
  const log = []
  for (let i = 0; i < patch.length; i++) {
    const out = applyOp(result, patch[i])
    if (out.error) {
      log.push({ index: i, op: patch[i], status: 'failed', detail: out.error })
      return { ok: false, result, log, failedIndex: i }
    }
    result = out.doc
    log.push({ index: i, op: patch[i], status: 'ok', detail: out.detail })
  }
  return { ok: true, result, log, failedIndex: null }
}`

const translations = {
  pt: {
    title: 'Aplicador de JSON Patch (RFC 6902)',
    intro: (
      <>
        Aplique um <Text code>JSON Patch</Text> (RFC 6902) a um documento e veja
        o resultado + o log passo a passo. Cada operação vira uma entrada:{' '}
        <Text code>add</Text>, <Text code>remove</Text>,{' '}
        <Text code>replace</Text>, <Text code>move</Text>,{' '}
        <Text code>copy</Text> e <Text code>test</Text>. Os caminhos seguem{' '}
        JSON Pointer (RFC 6901) — <Text code>""</Text> é a raiz,{' '}
        <Text code>/foo/0</Text> desce por chaves/índices e{' '}
        <Text code>/arr/-</Text> anexa ao fim de um array. Tudo roda no
        navegador; o documento original nunca é mutado. Complementa o{' '}
        <Text code>/data/json-diff</Text> (que compara dois JSONs) e o{' '}
        <Text code>/data/json-path-explorer</Text> (JSONPath).
      </>
    ),
    docLabel: 'Documento (antes)',
    patchLabel: 'JSON Patch (array de ops)',
    docPlaceholder: '{\n  "name": "devtools",\n  "version": 1\n}',
    patchPlaceholder: '[\n  { "op": "add", "path": "/author", "value": "agent" },\n  { "op": "replace", "path": "/version", "value": 2 }\n]',
    errorDoc: 'Documento inválido',
    errorPatch: 'JSON Patch inválido',
    resultTitle: 'Resultado (depois)',
    logTitle: 'Log das operações',
    empty: 'Cole um documento e um patch acima para aplicar.',
    presetsTitle: 'Exemplos',
    opCol: 'op',
    pathCol: 'path / from',
    statusOk: 'ok',
    statusFail: 'falhou',
    copied: 'Copiado!',
    copyResult: 'Copiar resultado',
    sourceTitle: 'Como funciona (código do motor)',
    halted: 'patch interrompido na operação',
    noOps: 'Patch vazio — nenhuma operação para aplicar.',
    invalidPatchShape: 'O patch precisa ser um array JSON de operações.',
  },
  en: {
    title: 'JSON Patch Applier (RFC 6902)',
    intro: (
      <>
        Apply a <Text code>JSON Patch</Text> (RFC 6902) to a document and see
        the result + a step-by-step log. Each operation is one entry:{' '}
        <Text code>add</Text>, <Text code>remove</Text>,{' '}
        <Text code>replace</Text>, <Text code>move</Text>,{' '}
        <Text code>copy</Text> and <Text code>test</Text>. Paths follow JSON
        Pointer (RFC 6901) — <Text code>""</Text> is the root,{' '}
        <Text code>/foo/0</Text> descends through keys/indices and{' '}
        <Text code>/arr/-</Text> appends to an array. Everything runs in the
        browser; the original document is never mutated. Complements{' '}
        <Text code>/data/json-diff</Text> (which compares two JSONs) and{' '}
        <Text code>/data/json-path-explorer</Text> (JSONPath).
      </>
    ),
    docLabel: 'Document (before)',
    patchLabel: 'JSON Patch (array of ops)',
    docPlaceholder: '{\n  "name": "devtools",\n  "version": 1\n}',
    patchPlaceholder: '[\n  { "op": "add", "path": "/author", "value": "agent" },\n  { "op": "replace", "path": "/version", "value": 2 }\n]',
    errorDoc: 'Invalid document',
    errorPatch: 'Invalid JSON Patch',
    resultTitle: 'Result (after)',
    logTitle: 'Operations log',
    empty: 'Paste a document and a patch above to apply.',
    presetsTitle: 'Examples',
    opCol: 'op',
    pathCol: 'path / from',
    statusOk: 'ok',
    statusFail: 'failed',
    copied: 'Copied!',
    copyResult: 'Copy result',
    sourceTitle: 'How it works (engine source)',
    halted: 'patch halted at operation',
    noOps: 'Empty patch — no operations to apply.',
    invalidPatchShape: 'The patch must be a JSON array of operations.',
  },
}

function opPathLabel(op) {
  if (op.op === 'move' || op.op === 'copy') {
    return `${op.path} ← ${op.from}`
  }
  return op.path
}

export default function JsonPatchPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [inputDoc, setInputDoc] = useState(PRESETS[0].doc)
  const [inputPatch, setInputPatch] = useState(PRESETS[0].patch)
  const [copied, setCopied] = useState(false)

  // Documento parseado (ou erro). Depende só da string — state primitivo.
  const { parsedDoc, errorDoc } = useMemo(() => {
    if (!inputDoc.trim()) return { parsedDoc: undefined, errorDoc: null }
    try {
      return { parsedDoc: JSON.parse(inputDoc), errorDoc: null }
    } catch (err) {
      return { parsedDoc: undefined, errorDoc: err.message }
    }
  }, [inputDoc])

  // Patch parseado (ou erro). Depende só da string — state primitivo.
  const { parsedPatch, errorPatch, patchIsArray } = useMemo(() => {
    if (!inputPatch.trim()) return { parsedPatch: undefined, errorPatch: null, patchIsArray: false }
    try {
      const v = JSON.parse(inputPatch)
      return { parsedPatch: v, errorPatch: null, patchIsArray: Array.isArray(v) }
    } catch (err) {
      return { parsedPatch: undefined, errorPatch: err.message, patchIsArray: false }
    }
  }, [inputPatch])

  // Aplicação do patch — tudo derivado via useMemo sobre state estável
  // (parsedDoc/parsedPatch são o resultado de JSON.parse, identidade estável
  // enquanto as strings de entrada não mudam). Nenhum useEffect, zero loops.
  const applied = useMemo(() => {
    if (errorDoc || errorPatch) return null
    if (parsedDoc === undefined || parsedPatch === undefined) return null
    if (!patchIsArray) return { invalidShape: true }
    return applyPatch(parsedDoc, parsedPatch)
  }, [parsedDoc, parsedPatch, errorDoc, errorPatch, patchIsArray])

  const resultText = useMemo(() => {
    if (!applied || applied.invalidShape) return ''
    try {
      return JSON.stringify(applied.result, null, 2)
    } catch (_) {
      return ''
    }
  }, [applied])

  const handleCopy = async () => {
    if (!resultText) return
    try {
      await navigator.clipboard.writeText(resultText)
      setCopied(true)
      message.success(t.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch (_) {
      message.error(t.copied)
    }
  }

  const loadPreset = (preset) => {
    setInputDoc(preset.doc)
    setInputPatch(preset.patch)
  }

  const hasInput = inputDoc.trim() || inputPatch.trim()

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApartmentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.presetsTitle}</Text>
        <Segmented
          defaultValue={PRESETS[0].key}
          options={PRESETS.map((p) => ({ label: p.key, value: p.key }))}
          onChange={(key) => loadPreset(PRESETS.find((p) => p.key === key))}
        />
      </div>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={t.docLabel} size="small">
            <TextArea
              rows={10}
              value={inputDoc}
              onChange={(e) => setInputDoc(e.target.value)}
              placeholder={t.docPlaceholder}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
          {errorDoc && <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorDoc} description={errorDoc} />}
        </Col>
        <Col xs={24} md={12}>
          <Card title={t.patchLabel} size="small">
            <TextArea
              rows={10}
              value={inputPatch}
              onChange={(e) => setInputPatch(e.target.value)}
              placeholder={t.patchPlaceholder}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
          {errorPatch && <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorPatch} description={errorPatch} />}
        </Col>
      </Row>

      {applied && applied.invalidShape && (
        <Alert type="warning" showIcon message={t.invalidPatchShape} />
      )}

      {applied && !applied.invalidShape && (
        <>
          {!applied.ok && applied.log.length > 0 && (
            <Alert
              type="error"
              showIcon
              message={`${t.halted} #${applied.failedIndex}`}
              description={applied.log[applied.failedIndex].detail}
            />
          )}

          <Card
            title={t.resultTitle}
            extra={
              <Button size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} disabled={!resultText}>
                {t.copyResult}
              </Button>
            }
          >
            <pre style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {resultText || (applied.ok && parsedPatch && parsedPatch.length === 0 ? t.noOps : '')}
            </pre>
          </Card>

          <Card title={t.logTitle} extra={<Text type="secondary">{applied.log.length}</Text>}>
            {applied.log.length === 0 ? (
              <Text type="secondary">{t.noOps}</Text>
            ) : (
              <List
                size="small"
                dataSource={applied.log}
                renderItem={(entry) => {
                  const ok = entry.status === 'ok'
                  const op = entry.op && entry.op.op ? entry.op.op : '?'
                  return (
                    <List.Item>
                      <Space wrap style={{ width: '100%' }}>
                        <Tag color="blue">#{entry.index}</Tag>
                        <Tag color={ok ? 'green' : 'red'}>{op}</Tag>
                        <Text code style={{ wordBreak: 'break-all' }}>
                          {entry.op ? opPathLabel(entry.op) : ''}
                        </Text>
                        <Tag color={ok ? 'success' : 'error'} style={{ marginLeft: 'auto' }}>
                          {ok ? t.statusOk : t.statusFail}
                        </Tag>
                      </Space>
                      {!ok && (
                        <Text type="danger" style={{ display: 'block', marginTop: 4, wordBreak: 'break-word' }}>
                          {entry.detail}
                        </Text>
                      )}
                      {ok && entry.detail && (
                        <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                          {entry.detail}
                        </Text>
                      )}
                    </List.Item>
                  )
                }}
              />
            )}
          </Card>
        </>
      )}

      {!hasInput && <Text type="secondary">{t.empty}</Text>}

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                {ENGINE_SOURCE}
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
