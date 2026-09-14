import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert, Row, Col, Button, Collapse, Segmented, message } from 'antd'
import { SwapOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { generateMergePatch, applyMergePatch, PRESETS } from '../utils/jsonMergePatch'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ENGINE_SOURCE = `// RFC 7396 — JSON Merge Patch
// O patch é ele próprio um JSON: objetos são mesclados recursivamente,
// null apaga uma chave e qualquer outro valor substitui. Arrays são
// sempre tratados como um todo (nunca são mesclados).

// Gera o patch que transforma original -> modified
export function generateMergePatch(original, modified) {
  if (deepEqual(original, modified)) return {}   // iguais => {} (sem mudança)
  return diffValue(original, modified).patch
}

// diffValue devolve { none: true } quando iguais ou { patch } quando não.
function diffValue(original, modified) {
  if (deepEqual(original, modified)) return { none: true }
  if (isPlainObject(original) && isPlainObject(modified)) {
    const patch = {}
    for (const key of Object.keys(modified)) {
      if (key in original) {
        const sub = diffValue(original[key], modified[key])
        if (!sub.none) patch[key] = sub.patch      // mudou => sub-patch
      } else {
        patch[key] = deepClone(modified[key])       // chave nova => valor inteiro
      }
    }
    for (const key of Object.keys(original)) {
      if (!(key in modified)) patch[key] = null     // chave removida => null
    }
    return { patch }
  }
  return { patch: deepClone(modified) }             // folha/array => valor inteiro
}

// Aplica um patch a um documento (RFC 7396 §2), sem mutar o original.
export function applyMergePatch(target, patch) {
  if (!isPlainObject(patch)) return deepClone(patch) // patch não-objeto substitui tudo
  const result = isPlainObject(target) ? deepClone(target) : {}
  for (const key of Object.keys(patch)) {
    if (patch[key] === null) {
      delete result[key]                            // null => remove a chave
    } else {
      result[key] = applyMergePatch(
        Object.prototype.hasOwnProperty.call(result, key) ? result[key] : undefined,
        patch[key]
      )
    }
  }
  return result
}`

const translations = {
  pt: {
    title: 'JSON Merge Patch (RFC 7396)',
    intro: (
      <>
        O <Text code>JSON Merge Patch</Text> (RFC 7396) descreve a diferença
        entre dois documentos como <em>um JSON que é ele próprio o patch</em>:{' '}
        objetos são mesclados recursivamente, <Text code>null</Text> apaga uma
        chave e qualquer outro valor a substitui. É o formato usado pelas APIs
        REST que aceitam <Text code>PATCH</Text> com{' '}
        <Text code>application/merge-patch+json</Text>. Diferente do{' '}
        <Text code>/data/json-patch</Text> (RFC 6902, uma lista de operações{' '}
        <Text code>add/remove/replace</Text> com JSON Pointer) e do{' '}
        <Text code>/data/json-diff</Text> (que só enxerga as mudanças). Aqui
        você <strong>gera</strong> o patch entre dois documentos ou{' '}
        <strong>aplica</strong> um patch a um documento — 100% no navegador.
      </>
    ),
    modeGenerate: 'Gerar patch',
    modeApply: 'Aplicar patch',
    generateHint: 'Cole os dois documentos; sai o patch mínimo que transforma um no outro. Objetos idênticos produzem {}.',
    applyHint: 'Cole um documento e um merge patch (RFC 7396); sai o resultado com o patch aplicado.',
    originalLabel: 'Original (antes)',
    modifiedLabel: 'Modificado (depois)',
    docLabel: 'Documento',
    patchLabel: 'JSON Merge Patch',
    origPlaceholder: '{\n  "title": "Login",\n  "status": "active"\n}',
    modPlaceholder: '{\n  "title": "SSO Login",\n  "status": "archived",\n  "priority": 2\n}',
    docPlaceholder: '{\n  "user": { "name": "Ada", "plan": "free" }\n}',
    patchPlaceholder: '{\n  "user": { "name": "Ada Lovelace", "plan": null }\n}',
    errorJson: 'JSON inválido',
    outputPatch: 'JSON Merge Patch gerado',
    outputResult: 'Resultado (depois)',
    equalResult: 'Documentos idênticos → o patch é {} (nenhuma mudança a aplicar).',
    empty: 'Preencha os campos acima para ver o resultado.',
    copyOutput: 'Copiar resultado',
    copied: 'Copiado!',
    presetsTitle: 'Exemplos',
    compareTitle: 'RFC 7396 vs RFC 6902: quando usar cada um',
    compareBody: (
      <>
        <Text strong>RFC 7396 (Merge Patch)</Text> — simples e legível, ideal
        quando você substitui/mescla campos de um objeto: muita mudança num
        objeto pequeno ou updates parciais óbvios. <Text strong>Limitação
        real</Text>: é cego para arrays — qualquer item diferente reescreve a
        lista inteira, e é impossível "mexer no 3º elemento". Também não
        consegue representar um valor <em>null</em> de verdade (null sempre
        significa "apagar").
        <br />
        <br />
        <Text strong>RFC 6902 (JSON Patch)</Text> — cirúrgico por caminhos
        (JSON Pointer), consegue <Text code>add/remove</Text> em índices de
        arrays, <Text code>move</Text>/<Text code>copy</Text> e o teste{' '}
        <Text code>test</Text> pré-operação. Verboso para mudanças triviais,
        mas o único jeito de editar arrays com precisão ou representar null
        literal.
      </>
    ),
    sourceTitle: 'Como funciona (código do motor)',
    swapMode: 'Alternar modo',
  },
  en: {
    title: 'JSON Merge Patch (RFC 7396)',
    intro: (
      <>
        A <Text code>JSON Merge Patch</Text> (RFC 7396) describes the
        difference between two documents as <em>a JSON that is itself the
        patch</em>: objects are merged recursively, <Text code>null</Text>{' '}
        deletes a key and any other value replaces it. It's the format used by
        REST APIs that accept <Text code>PATCH</Text> with{' '}
        <Text code>application/merge-patch+json</Text>. Unlike{' '}
        <Text code>/data/json-patch</Text> (RFC 6902, a list of{' '}
        <Text code>add/remove/replace</Text> operations with JSON Pointer) and{' '}
        <Text code>/data/json-diff</Text> (which only visualizes the changes).
        Here you can <strong>generate</strong> the patch between two documents
        or <strong>apply</strong> a patch to a document — 100% in the browser.
      </>
    ),
    modeGenerate: 'Generate patch',
    modeApply: 'Apply patch',
    generateHint: 'Paste both documents; you get the minimal patch that turns one into the other. Identical objects produce {}.',
    applyHint: 'Paste a document and a merge patch (RFC 7396); you get the result with the patch applied.',
    originalLabel: 'Original (before)',
    modifiedLabel: 'Modified (after)',
    docLabel: 'Document',
    patchLabel: 'JSON Merge Patch',
    origPlaceholder: '{\n  "title": "Login",\n  "status": "active"\n}',
    modPlaceholder: '{\n  "title": "SSO Login",\n  "status": "archived",\n  "priority": 2\n}',
    docPlaceholder: '{\n  "user": { "name": "Ada", "plan": "free" }\n}',
    patchPlaceholder: '{\n  "user": { "name": "Ada Lovelace", "plan": null }\n}',
    errorJson: 'Invalid JSON',
    outputPatch: 'Generated JSON Merge Patch',
    outputResult: 'Result (after)',
    equalResult: 'Identical documents → the patch is {} (no change to apply).',
    empty: 'Fill the fields above to see the result.',
    copyOutput: 'Copy result',
    copied: 'Copied!',
    presetsTitle: 'Examples',
    compareTitle: 'RFC 7396 vs RFC 6902: when to use each',
    compareBody: (
      <>
        <Text strong>RFC 7396 (Merge Patch)</Text> — simple and readable,
        ideal when you replace/merge object fields: lots of small changes or
        obvious partial updates. <Text strong>Real limitation</Text>: it is
        blind to arrays — any different item rewrites the whole list, and you
        can't "touch the 3rd element". It also can't represent a literal{' '}
        <em>null</em> value (null always means "delete").
        <br />
        <br />
        <Text strong>RFC 6902 (JSON Patch)</Text> — surgical by path (JSON
        Pointer), can <Text code>add/remove</Text> array items by index,{' '}
        <Text code>move</Text>/<Text code>copy</Text> and a{' '}
        <Text code>test</Text> pre-operation. Verbose for trivial changes, but
        the only way to edit arrays precisely or represent a literal null.
      </>
    ),
    sourceTitle: 'How it works (engine source)',
    swapMode: 'Switch mode',
  },
}

function tryParse(text) {
  if (!text.trim()) return { ok: false, empty: true }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export default function JsonMergePatchPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [mode, setMode] = useState('generate')
  const [origText, setOrigText] = useState(PRESETS[0].original)
  const [modText, setModText] = useState(PRESETS[0].modified)
  const [docText, setDocText] = useState(
    '{\n  "user": {\n    "name": "Ada",\n    "email": "ada@mid.com",\n    "plan": "free"\n  },\n  "notify": true\n}'
  )
  const [patchText, setPatchText] = useState(
    '{\n  "user": {\n    "name": "Ada Lovelace",\n    "plan": null\n  },\n  "notify": false\n}'
  )
  const [copied, setCopied] = useState(false)

  const parsedOrig = useMemo(() => tryParse(origText), [origText])
  const parsedMod = useMemo(() => tryParse(modText), [modText])
  const parsedDoc = useMemo(() => tryParse(docText), [docText])
  const parsedPatch = useMemo(() => tryParse(patchText), [patchText])

  // Tudo derivado via useMemo sobre state primitivo — zero useEffect, zero loops.
  const generated = useMemo(() => {
    if (mode !== 'generate') return null
    if (!parsedOrig.ok || !parsedMod.ok) return null
    return generateMergePatch(parsedOrig.value, parsedMod.value)
  }, [mode, parsedOrig, parsedMod])

  const applied = useMemo(() => {
    if (mode !== 'apply') return null
    if (!parsedDoc.ok || !parsedPatch.ok) return null
    return applyMergePatch(parsedDoc.value, parsedPatch.value)
  }, [mode, parsedDoc, parsedPatch])

  const output = mode === 'generate' ? generated : applied
  const outputText = useMemo(() => {
    if (output === undefined || output === null) return ''
    try {
      return JSON.stringify(output, null, 2)
    } catch (_) {
      return ''
    }
  }, [output])

  const handleCopy = async () => {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      message.success(t.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch (_) {
      message.error(t.copied)
    }
  }

  const loadPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setOrigText(preset.original)
    setModText(preset.modified)
  }

  const hasInput = mode === 'generate'
    ? (origText.trim() || modText.trim())
    : (docText.trim() || patchText.trim())

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { label: t.modeGenerate, value: 'generate' },
          { label: t.modeApply, value: 'apply' },
        ]}
      />

      {mode === 'generate' && (
        <>
          <Alert type="info" showIcon message={t.generateHint} />

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.presetsTitle}</Text>
            <Segmented
              defaultValue={PRESETS[0].key}
              options={PRESETS.map((p) => ({ label: p.key, value: p.key }))}
              onChange={loadPreset}
            />
          </div>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card title={t.originalLabel} size="small">
                <TextArea
                  rows={10}
                  value={origText}
                  onChange={(e) => setOrigText(e.target.value)}
                  placeholder={t.origPlaceholder}
                  style={{ fontFamily: 'monospace' }}
                />
              </Card>
              {!parsedOrig.ok && !parsedOrig.empty && (
                <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorJson} description={parsedOrig.error} />
              )}
            </Col>
            <Col xs={24} md={12}>
              <Card title={t.modifiedLabel} size="small">
                <TextArea
                  rows={10}
                  value={modText}
                  onChange={(e) => setModText(e.target.value)}
                  placeholder={t.modPlaceholder}
                  style={{ fontFamily: 'monospace' }}
                />
              </Card>
              {!parsedMod.ok && !parsedMod.empty && (
                <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorJson} description={parsedMod.error} />
              )}
            </Col>
          </Row>
        </>
      )}

      {mode === 'apply' && (
        <>
          <Alert type="info" showIcon message={t.applyHint} />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card title={t.docLabel} size="small">
                <TextArea
                  rows={10}
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder={t.docPlaceholder}
                  style={{ fontFamily: 'monospace' }}
                />
              </Card>
              {!parsedDoc.ok && !parsedDoc.empty && (
                <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorJson} description={parsedDoc.error} />
              )}
            </Col>
            <Col xs={24} md={12}>
              <Card title={t.patchLabel} size="small">
                <TextArea
                  rows={10}
                  value={patchText}
                  onChange={(e) => setPatchText(e.target.value)}
                  placeholder={t.patchPlaceholder}
                  style={{ fontFamily: 'monospace' }}
                />
              </Card>
              {!parsedPatch.ok && !parsedPatch.empty && (
                <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorJson} description={parsedPatch.error} />
              )}
            </Col>
          </Row>
        </>
      )}

      {hasInput && output !== null && (
        <>
          {mode === 'generate' && parsedOrig.ok && parsedMod.ok && JSON.stringify(generated) === '{}' && (
            <Alert type="info" showIcon message={t.equalResult} />
          )}
          <Card
            title={mode === 'generate' ? t.outputPatch : t.outputResult}
            extra={
              <Button size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} disabled={!outputText}>
                {t.copyOutput}
              </Button>
            }
          >
            <pre style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {outputText}
            </pre>
          </Card>
        </>
      )}

      {!hasInput && <Text type="secondary">{t.empty}</Text>}

      <Collapse
        items={[
          {
            key: 'compare',
            label: t.compareTitle,
            children: <Paragraph>{t.compareBody}</Paragraph>,
          },
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