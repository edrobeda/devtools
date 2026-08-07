import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Tag, Alert, message } from 'antd'
import { CodeOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { deepClone, deepEqual, firstDiff } from '../utils/deep'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE_A = `{
  "name": "devtools",
  "version": "1.0.0",
  "tags": ["tools", "internal"],
  "meta": { "owner": "lab", "open": true }
}`

const SAMPLE_B = `{
  "name": "devtools",
  "version": "1.0.0",
  "tags": ["tools", "internal"],
  "meta": { "owner": "lab", "open": false }
}`

const sourceCode = `export function deepClone(value, seen = new Map()) {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value) // referência cíclica
  seen.set(value, value)
  let out
  if (Array.isArray(value)) {
    out = []
    for (const item of value) out.push(deepClone(item, seen))
  } else if (value instanceof Date) {
    out = new Date(value.getTime())
  } else if (value instanceof RegExp) {
    out = new RegExp(value.source, value.flags)
  } else if (value instanceof Map) {
    out = new Map()
    for (const [k, v] of value) out.set(k, deepClone(v, seen))
  } else if (value instanceof Set) {
    out = new Set()
    for (const v of value) out.add(deepClone(v, seen))
  } else {
    out = {}
    for (const key of Object.keys(value)) out[key] = deepClone(value[key], seen)
  }
  seen.set(value, out)
  return out
}

export function deepEqual(a, b) {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== 'object' || typeof b !== 'object') return a === b
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp && a.source === b.source && a.flags === b.flags
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map)) return false
    if (a.size !== b.size) return false
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false
    return true
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set)) return false
    if (a.size !== b.size) return false
    return [...a].every((v) => [...b].some((bv) => deepEqual(v, bv)))
  }
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (!deepEqual(a[k], b[k])) return false
  }
  return true
}`

const translations = {
  pt: {
    title: 'Snippet: deepClone & deepEqual',
    intro: (
      <>
        Implementações do zero de cópia profunda ({' '}
        <Text code>deepClone</Text>) e de comparação estrutural profunda ({' '}
        <Text code>deepEqual</Text>). Diferente de{' '}
        <Text code>JSON.parse(JSON.stringify(x))</Text>, preservam{' '}
        <Text code>Date</Text>, <Text code>RegExp</Text>, <Text code>Map</Text>{' '}
        e <Text code>Set</Text> e suportam referências cíclicas (a cópia usa
        um <Text code>Map</Text> de nós já visitados). Já estão em{' '}
        <Text code>src/utils/deep.js</Text>, prontas pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    copy: 'Copiar código',
    copied: 'Copiado!',
    demoTitle: 'Demonstração',
    tabCompare: 'Comparar dois JSONs',
    tabClone: 'Provar a cópia (deepcopy)',
    aLabel: 'JSON A',
    bLabel: 'JSON B',
    aSample: 'Exemplo A',
    bSample: 'Exemplo B',
    clearA: 'Limpar A',
    clearB: 'Limpar B',
    equal: 'Estruturalmente IGUAIS',
    different: 'Estruturalmente DIFERENTES',
    firstDiffAt: 'Primeira diferença em',
    invalid: 'JSON inválido — corrija o campo marcado.',
    noBoth: 'Preencha os dois lados para comparar.',
    cloneInput: 'JSON de origem',
    cloneInputSample: 'Exemplo',
    clearInput: 'Limpar',
    cloneBtn: 'Fazer deepClone',
    cloneProof: 'Agora mutamos só a cópia (mudamos um campo aninhado) — o original tem que ficar intacto:',
    originalLabel: 'Original',
    cloneLabel: 'Clone (mutado)',
    stillEqual: 'Original ainda é estruturalmente igual ao clone?',
    yes: 'sim',
    no: 'não',
  },
  en: {
    title: 'Snippet: deepClone & deepEqual',
    intro: (
      <>
        From-scratch implementations of deep copying (<Text code>deepClone</Text>)
        and deep structural equality (<Text code>deepEqual</Text>). Unlike{' '}
        <Text code>JSON.parse(JSON.stringify(x))</Text>, they preserve{' '}
        <Text code>Date</Text>, <Text code>RegExp</Text>, <Text code>Map</Text>{' '}
        and <Text code>Set</Text>, and handle circular references (copying
        keeps a <Text code>Map</Text> of visited nodes). They already live in{' '}
        <Text code>src/utils/deep.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    copy: 'Copy code',
    copied: 'Copied!',
    demoTitle: 'Demo',
    tabCompare: 'Compare two JSONs',
    tabClone: 'Prove the copy (deepcopy)',
    aLabel: 'JSON A',
    bLabel: 'JSON B',
    aSample: 'Sample A',
    bSample: 'Sample B',
    clearA: 'Clear A',
    clearB: 'Clear B',
    equal: 'Structurally EQUAL',
    different: 'Structurally DIFFERENT',
    firstDiffAt: 'First difference at',
    invalid: 'Invalid JSON — fix the flagged field.',
    noBoth: 'Fill both sides to compare.',
    cloneTitle: 'JSON data',
    cloneInputSample: 'Sample',
    clearInput: 'Clear',
    cloneBtn: 'Run deepClone',
    cloneProof: 'We mutated the clone (changed a nested field) — the original must stay intact:',
    originalLabel: 'Original',
    cloneLabel: 'Clone (mutated)',
    stillEqual: 'Is the clone still structurally equal to the original?',
    yes: 'yes',
    no: 'no',
  },
}

function jsonTo(text) {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

function CompareTab({ t }) {
  const [a, setA] = useState(SAMPLE_A)
  const [b, setB] = useState(SAMPLE_B)

  const parsedA = useMemo(() => jsonTo(a), [a])
  const parsedB = useMemo(() => jsonTo(b), [b])

  const result = useMemo(() => {
    if (!a.trim() || !b.trim()) return null
    if (!parsedA.ok || !parsedB.ok) return null
    return {
      equal: deepEqual(parsedA.value, parsedB.value),
      diff: firstDiff(parsedA.value, parsedB.value),
    }
  }, [a, b, parsedA, parsedB])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Button size="small" onClick={() => setA(SAMPLE_A)}>{t.aSample}</Button>
        <Button size="small" onClick={() => setA('')}>{t.clearA}</Button>
        <Button size="small" onClick={() => setB(SAMPLE_B)}>{t.bSample}</Button>
        <Button size="small" onClick={() => setB('')}>{t.clearB}</Button>
      </Space>

      <Space size="large" style={{ width: '100%', alignItems: 'flex-start' }} wrap>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Text strong>{t.aLabel}</Text>
          <TextArea
            value={a}
            onChange={(e) => setA(e.target.value)}
            autoSize={{ minRows: 8, maxRows: 18 }}
            style={{ fontFamily: 'monospace', marginTop: 8 }}
            status={a.trim() && !parsedA.ok ? 'error' : undefined}
          />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Text strong>{t.bLabel}</Text>
          <TextArea
            value={b}
            onChange={(e) => setB(e.target.value)}
            autoSize={{ minRows: 8, maxRows: 18 }}
            style={{ fontFamily: 'monospace', marginTop: 8 }}
            status={b.trim() && !parsedB.ok ? 'error' : undefined}
          />
        </div>
      </Space>

      <div>
        {(!a.trim() || !b.trim()) ? (
          <Alert type="info" showIcon message={t.noBoth} />
        ) : (!parsedA.ok || !parsedB.ok) ? (
          <Alert type="error" showIcon message={t.invalid} />
        ) : (
          <Space direction="vertical" size="small">
            <Tag color={result.equal ? 'green' : 'red'} style={{ fontSize: 13, padding: '4px 10px' }}>
              {result.equal ? t.equal : t.different}
            </Tag>
            {!result.equal && result.diff && result.diff.a !== null && result.diff.b !== null && (
              <div>
                <Text type="secondary">{t.firstDiffAt} </Text>
                <Text code>{result.diff.path}</Text>
                <div style={{ marginTop: 6 }}>
                  <Text code>{t.aLabel} → </Text>
                  <Text code>{String(result.diff.a)}</Text>
                  <br />
                  <Text code>{t.bLabel} → </Text>
                  <Text code>{String(result.diff.b)}</Text>
                </div>
              </div>
            )}
          </Space>
        )}
      </div>
    </Space>
  )
}

function CloneTab({ t }) {
  const [input, setInput] = useState(SAMPLE_A)
  const [clone, setClone] = useState(null)

  const parsed = useMemo(() => jsonTo(input), [input])

  function handleClone() {
    if (!input.trim() || !parsed.ok) return
    const copy = deepClone(parsed.value)
    if (copy && typeof copy === 'object') {
      copy.meta = { ...(copy.meta || {}), deepCopy: true, open: copy.meta?.open ?? undefined }
      copy.meta.open = false
      copy.meta.deepCopy = 'sou a cópia'
    }
    setClone({ original: parsed.value, copy })
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text strong>{t.cloneTitle}</Text>
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoSize={{ minRows: 8, maxRows: 18 }}
        style={{ fontFamily: 'monospace' }}
        status={input.trim() && !parsed.ok ? 'error' : undefined}
      />
      <Space wrap>
        <Button size="small" onClick={() => setInput(SAMPLE_A)}>{t.cloneInputSample}</Button>
        <Button size="small" onClick={() => setInput('')}>{t.clearInput}</Button>
        <Button type="primary" size="small" icon={<SwapOutlined />} onClick={handleClone}>
          {t.cloneBtn}
        </Button>
      </Space>

      {clone && (
        <div>
          <Text type="secondary">{t.cloneProof}</Text>
          <Space size="large" align="flex-start" style={{ width: '100%', marginTop: 8 }} wrap>
            <div style={{ flex: 1, minWidth: 260 }}>
              <Text type="secondary" strong>{t.originalLabel}</Text>
              <pre style={{ marginTop: 4, background: '#fafafa', padding: 10, borderRadius: 8, overflowX: 'auto', fontSize: 12 }}>
                <code>{JSON.stringify(clone.original, null, 2)}</code>
              </pre>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <Text type="secondary" strong>{t.cloneLabel}</Text>
              <pre style={{ marginTop: 4, background: '#fafafa', padding: 10, borderRadius: 8, overflowX: 'auto', fontSize: 12 }}>
                <code>{JSON.stringify(clone.copy, null, 2)}</code>
              </pre>
            </div>
          </Space>
          <div style={{ marginTop: 10 }}>
            <Space>
              <Text>{t.stillEqual}</Text>
              <Tag color={deepEqual(clone.original, clone.copy) ? 'green' : 'red'}>
                {deepEqual(clone.original, clone.copy) ? t.yes : t.no}
              </Tag>
            </Space>
          </div>
        </div>
      )}
    </Space>
  )
}

export default function DeepCloneDeepEqualPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [active, setActive] = useState('compare')

  function handleCopy() {
    navigator.clipboard.writeText(sourceCode)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.sourceTitle}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto', overflowY: 'auto', maxHeight: 460, fontSize: 12 }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Button
              type={active === 'compare' ? 'primary' : 'default'}
              size="middle"
              onClick={() => setActive('compare')}
            >
              {t.tabCompare}
            </Button>
            <Button
              type={active === 'clone' ? 'primary' : 'default'}
              size="middle"
              onClick={() => setActive('clone')}
              style={{ marginLeft: 8 }}
            >
              {t.tabClone}
            </Button>
          </div>
          {active === 'compare' ? <CompareTab t={t} /> : <CloneTab t={t} />}
        </Space>
      </Card>
    </Space>
  )
}