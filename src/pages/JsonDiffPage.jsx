import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert, List, Tag, Row, Col } from 'antd'
import { DiffOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function formatValue(value) {
  if (value === undefined) return '—'
  if (typeof value === 'string') return JSON.stringify(value)
  if (isObject(value)) return `Object{${Object.keys(value).length}}`
  if (Array.isArray(value)) return `Array(${value.length})`
  return JSON.stringify(value)
}

// Walks both values in parallel, collecting a flat list of structural
// differences addressed by JSON-pointer-ish path (root.a.b[0]).
function diffValues(a, b, path, out) {
  const aIsContainer = isObject(a) || Array.isArray(a)
  const bIsContainer = isObject(b) || Array.isArray(b)

  if (aIsContainer && bIsContainer && Array.isArray(a) === Array.isArray(b)) {
    if (Array.isArray(a)) {
      const maxLen = Math.max(a.length, b.length)
      for (let i = 0; i < maxLen; i++) {
        const childPath = `${path}[${i}]`
        if (i >= a.length) out.push({ path: childPath, type: 'added', oldValue: undefined, newValue: b[i] })
        else if (i >= b.length) out.push({ path: childPath, type: 'removed', oldValue: a[i], newValue: undefined })
        else diffValues(a[i], b[i], childPath, out)
      }
    } else {
      const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
      for (const key of keys) {
        const childPath = `${path}.${key}`
        const inA = Object.prototype.hasOwnProperty.call(a, key)
        const inB = Object.prototype.hasOwnProperty.call(b, key)
        if (!inA) out.push({ path: childPath, type: 'added', oldValue: undefined, newValue: b[key] })
        else if (!inB) out.push({ path: childPath, type: 'removed', oldValue: a[key], newValue: undefined })
        else diffValues(a[key], b[key], childPath, out)
      }
    }
    return
  }

  // Leaf values, or a type mismatch (e.g. object vs array, object vs string)
  const equal = aIsContainer || bIsContainer ? false : JSON.stringify(a) === JSON.stringify(b)
  if (!equal) out.push({ path, type: 'changed', oldValue: a, newValue: b })
}

const translations = {
  pt: {
    title: 'JSON Diff (estrutural)',
    intro: (
      <>
        Compara dois JSONs pela estrutura — chaves e valores, não linha de
        texto — e lista o que foi adicionado, removido ou alterado por
        caminho (<Text code>root.a.b[0]</Text>). Diferente do{' '}
        <Text code>/tools/diff-checker</Text>, que compara texto linha a
        linha; aqui a ordem das chaves e a formatação/espaçamento não importam,
        só o conteúdo.
      </>
    ),
    beforeLabel: 'JSON A (antes)',
    afterLabel: 'JSON B (depois)',
    placeholderA: '{\n  "name": "devtools",\n  "version": 1,\n  "tags": ["react"]\n}',
    placeholderB: '{\n  "name": "devtools",\n  "version": 2,\n  "tags": ["react", "vite"]\n}',
    errorTitleA: 'JSON A inválido',
    errorTitleB: 'JSON B inválido',
    resultTitle: 'Diferenças',
    noDiff: 'Nenhuma diferença estrutural — os dois JSONs são equivalentes.',
    empty: 'Cole os dois JSONs acima para comparar.',
    added: 'adicionado',
    removed: 'removido',
    changed: 'alterado',
    countLabel: (n) => `${n} diferença${n === 1 ? '' : 's'}`,
  },
  en: {
    title: 'JSON Diff (structural)',
    intro: (
      <>
        Compares two JSONs by structure — keys and values, not text lines —
        and lists what was added, removed or changed by path (
        <Text code>root.a.b[0]</Text>). Unlike{' '}
        <Text code>/tools/diff-checker</Text>, which compares text line by
        line, here key order and formatting/whitespace don't matter, only
        content does.
      </>
    ),
    beforeLabel: 'JSON A (before)',
    afterLabel: 'JSON B (after)',
    placeholderA: '{\n  "name": "devtools",\n  "version": 1,\n  "tags": ["react"]\n}',
    placeholderB: '{\n  "name": "devtools",\n  "version": 2,\n  "tags": ["react", "vite"]\n}',
    errorTitleA: 'Invalid JSON A',
    errorTitleB: 'Invalid JSON B',
    resultTitle: 'Differences',
    noDiff: 'No structural difference — both JSONs are equivalent.',
    empty: 'Paste both JSONs above to compare.',
    added: 'added',
    removed: 'removed',
    changed: 'changed',
    countLabel: (n) => `${n} difference${n === 1 ? '' : 's'}`,
  },
}

const TYPE_COLOR = { added: 'green', removed: 'red', changed: 'orange' }

export default function JsonDiffPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')

  const { parsedA, errorA } = useMemo(() => {
    if (!inputA.trim()) return { parsedA: undefined, errorA: null }
    try {
      return { parsedA: JSON.parse(inputA), errorA: null }
    } catch (err) {
      return { parsedA: undefined, errorA: err.message }
    }
  }, [inputA])

  const { parsedB, errorB } = useMemo(() => {
    if (!inputB.trim()) return { parsedB: undefined, errorB: null }
    try {
      return { parsedB: JSON.parse(inputB), errorB: null }
    } catch (err) {
      return { parsedB: undefined, errorB: err.message }
    }
  }, [inputB])

  const diffs = useMemo(() => {
    if (errorA || errorB || parsedA === undefined || parsedB === undefined) return null
    const out = []
    diffValues(parsedA, parsedB, 'root', out)
    return out
  }, [parsedA, parsedB, errorA, errorB])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><DiffOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={t.beforeLabel} size="small">
            <TextArea
              rows={10}
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              placeholder={t.placeholderA}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
          {errorA && <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorTitleA} description={errorA} />}
        </Col>
        <Col xs={24} md={12}>
          <Card title={t.afterLabel} size="small">
            <TextArea
              rows={10}
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              placeholder={t.placeholderB}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
          {errorB && <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.errorTitleB} description={errorB} />}
        </Col>
      </Row>

      {diffs && (
        <Card title={t.resultTitle} extra={<Text type="secondary">{t.countLabel(diffs.length)}</Text>}>
          {diffs.length === 0 ? (
            <Text type="success">{t.noDiff}</Text>
          ) : (
            <List
              dataSource={diffs}
              renderItem={(d) => (
                <List.Item>
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color={TYPE_COLOR[d.type]}>{t[d.type]}</Tag>
                      <Text code>{d.path}</Text>
                    </Space>
                    {d.type !== 'added' && (
                      <Text delete type="danger" style={{ wordBreak: 'break-all' }}>{formatValue(d.oldValue)}</Text>
                    )}
                    {d.type !== 'removed' && (
                      <Text type="success" style={{ wordBreak: 'break-all' }}>{formatValue(d.newValue)}</Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Card>
      )}

      {!inputA.trim() && !inputB.trim() && <Text type="secondary">{t.empty}</Text>}
    </Space>
  )
}
