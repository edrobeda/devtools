import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Checkbox, Divider, Row, Col, Statistic, Alert } from 'antd'
import { OrderedListOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const SOURCE_SNIPPET = `// todas as operações rodam sobre o array de linhas, na ordem abaixo
const lines = input.split(/\\r?\\n/)

// 1. trim de cada linha
let out = lines.map(l => l.trim())

// 2. remover linhas vazias (antes de deduplicar)
out = out.filter(l => l !== '')

// 3. deduplicar preservando a primeira ocorrência (ou ignorar case)
out = out.filter((l, i, arr) =>
  arr.findIndex(x => x.toLowerCase() === l.toLowerCase()) === i)

// 4. ordenar
if (sortDesc) out.sort((a, b) => b.localeCompare(a))
else if (sortAsc) out.sort((a, b) => a.localeCompare(b))

// 5. numerar
if (number) out = out.map((l, i) => \`\${i + 1}. \${l}\`)`

const SAMPLE = [
  'Banana',
  '  Apple  ',
  '',
  'banana',
  'Cherry',
  'apple',
  '',
  'Dragon Fruit',
  'banana',
].join('\n')

const translations = {
  pt: {
    title: 'Processador de Linhas',
    intro: 'Ajeita e transforma um bloco de linhas de texto com operações encadeadas: aparar espaços, remover linhas vazias, deduplicar, ordenar e numerar. Tudo client-side, em tempo real. Útil pra limpar listas, saídas de terminal, CSVs simples ou logs antes de colar noutro lugar.',
    inputPlaceholder: 'Cole as linhas aqui, uma por linha...',
    optionsTitle: 'Operações (aplicadas em ordem)',
    optTrim: 'Aparar espaços nas pontas de cada linha',
    optEmpty: 'Remover linhas vazias',
    optDedupe: 'Remover linhas duplicadas',
    optDedupeCase: ' (ignorando maiúsculas/minúsculas)',
    optSortAsc: 'Ordenar de A a Z',
    optSortDesc: 'Ordenar de Z a A',
    optNumber: 'Numerar as linhas',
    resultTitle: 'Resultado',
    emptyOutput: 'Nada pra processar — adicione linhas e escolha as operações.',
    copied: 'Copiado!',
    copy: 'Copiar resultado',
    clear: 'Limpar',
    sample: 'Exemplo',
    beforeCount: 'linhas de entrada',
    afterCount: 'linhas de saída',
    note: 'As operações rodam na ordem acima: trim → remover vazias → deduplicar → ordenar → numerar. Podem ser combinadas livremente.',
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'Text Lines Tool',
    intro: 'Cleans and transforms a block of lines with chained operations: trim, remove blanks, dedupe, sort and number lines. Fully client-side and live. Handy for tidying lists, terminal output or simple arrays before pasting them elsewhere.',
    inputPlaceholder: 'Paste the lines here, one per line...',
    optionsTitle: 'Options (applied in order)',
    optTrim: 'Trim whitespace at the start/end of each line',
    optEmpty: 'Remove empty lines',
    optDedupe: 'Remove duplicate lines',
    optDedupeCase: ' (ignoring case)',
    optSort: 'Sorted A to Z',
    optSortDesc: 'Sort Z to A',
    optNumber: 'Number the lines',
    resultTitle: 'Result',
    empty: 'Nothing to process — add text and pick the operations.',
    copied: 'Copied!',
    copy: 'Copy result',
    clear: 'Clear',
    sample: 'Sample',
    beforeCount: 'input lines',
    afterCount: 'output lines',
    note: 'Operations run in this order: trim → drop empties → dedupe → sort → number. They can be freely combined.',
    sourceTitle: 'Under the hood',
  },
}

const t_pt = translations.pt
const t_en = translations.en

export default function LinesToolPage() {
  const { lang } = useLanguage()
  const t = lang === 'pt' ? t_pt : t_en
  const [input, setInput] = useState('')
  const [trim, setTrim] = useState(true)
  const [empty, setEmpty] = useState(true)
  const [dedupe, setDedupe] = useState(true)
  const [dedupeCase, setDedupeCase] = useState(true)
  const [sortAsc, setSortAsc] = useState(false)
  const [sortDesc, setSortDesc] = useState(false)
  const [number, setNumber] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!input) return { text: '', before: 0, after: 0 }
    const raw = input.split(/\r?\n/)
    const before = raw.length
    let out = [...raw]
    if (trim) out = out.map((l) => l.trim())
    if (empty) out = out.filter((l) => l !== '')
    if (dedupe) {
      const seen = new Set()
      out = out.filter((l) => {
        const key = dedupeCase ? l.toLowerCase() : l
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
    if (sortAsc) out.sort((a, b) => a.localeCompare(b))
    else if (sortDesc) out.sort((a, b) => b.localeCompare(a))
    if (number) out = out.map((l, i) => `${i + 1}. ${l}`)
    return { text: out.join('\n'), before, after: out.length }
  }, [input, trim, empty, dedupe, dedupeCase, sortAsc, sortDesc, number])

  async function handleCopy() {
    if (!result.text) return
    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><OrderedListOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input.TextArea
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.inputPlaceholder}
        />
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size={8}>
          <Checkbox checked={trim} onChange={(e) => setTrim(e.target.checked)}>{t.optTrim}</Checkbox>
          <Checkbox checked={empty} onChange={(e) => setEmpty(e.target.checked)}>{t.optEmpty}</Checkbox>
          <Checkbox checked={dedupe} onChange={(e) => setDedupe(e.target.checked)}>{t.optDedupe}</Checkbox>
          {dedupe && (
            <Checkbox checked={dedupeCase} onChange={(e) => setDedupeCase(e.target.checked)} style={{ paddingLeft: 24 }}>
              {t.optDedupeCase}
            </Checkbox>
          )}
          <Space size="large">
            <Checkbox checked={sortAsc} onChange={(e) => { setSortAsc(e.target.checked); if (e.target.checked) setSortDesc(false) }}>{t.optSortAsc}</Checkbox>
            <Checkbox checked={sortDesc} onChange={(e) => { setSortDesc(e.target.checked); if (e.target.checked) setSortAsc(false) }}>{t.optSortDesc}</Checkbox>
          </Space>
          <Checkbox checked={number} onChange={(e) => setNumber(e.target.checked)}>{t.optNumber}</Checkbox>
        </Space>
      </Card>

      <Card
        title={t.resultTitle}
        extra={
          <Space>
            <Button size="small" onClick={() => setInput(SAMPLE)}>{t.sample}</Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => { setInput(''); setCopied(false) }} disabled={!input}>{t.clear}</Button>
            <Button size="small" type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopy} disabled={!result.text}>
              {copied ? t.copied : t.copy}
            </Button>
          </Space>
        }
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {result.text || <Text type="secondary">{t.empty}</Text>}
        </pre>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={12}><Card><Statistic title={t.before} value={result.before} /></Card></Col>
        <Col xs={24} md={12}><Card><Statistic title={t.after} value={result.after} /></Card></Col>
      </Row>

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}><code>{SOURCE_SNIPPET}</code></pre>
      </Card>
    </Space>
  )
}