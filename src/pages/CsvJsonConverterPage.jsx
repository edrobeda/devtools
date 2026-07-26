import React, { useState } from 'react'
import { Typography, Card, Input, Space, Radio, Button, Alert, message } from 'antd'
import { SwapOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const DELIMITERS = { comma: ',', semicolon: ';', tab: '\t' }

// RFC4180-ish parser: handles quoted fields, escaped "" quotes, and quoted
// newlines/delimiters inside a field.
function parseCsv(text, delimiter) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // skip, \n right after closes the row
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

function csvToJson(text, delimiter) {
  const rows = parseCsv(text, delimiter)
  if (rows.length === 0) return []
  const [header, ...dataRows] = rows
  return dataRows.map((r) => {
    const obj = {}
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? ''
    })
    return obj
  })
}

function escapeCsvField(value, delimiter) {
  const s = value === null || value === undefined ? '' : String(value)
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function jsonToCsv(jsonText, delimiter) {
  const data = JSON.parse(jsonText)
  if (!Array.isArray(data)) throw new Error('not-array')
  if (data.length === 0) return ''

  const headers = Array.from(
    data.reduce((set, obj) => {
      Object.keys(obj || {}).forEach((k) => set.add(k))
      return set
    }, new Set())
  )

  const lines = [headers.map((h) => escapeCsvField(h, delimiter)).join(delimiter)]
  data.forEach((obj) => {
    lines.push(headers.map((h) => escapeCsvField(obj ? obj[h] : '', delimiter)).join(delimiter))
  })
  return lines.join('\n')
}

const translations = {
  pt: {
    title: 'Conversor CSV ↔ JSON',
    intro: 'Converte CSV em um array JSON de objetos (usando a primeira linha como cabeçalho) e vice-versa. Suporta campos entre aspas com vírgulas, quebras de linha e aspas escapadas (""). Tudo local, nada sai do navegador.',
    csvToJson: 'CSV → JSON',
    jsonToCsv: 'JSON → CSV',
    delimiter: 'Delimitador',
    comma: 'Vírgula (,)',
    semicolon: 'Ponto e vírgula (;)',
    tab: 'Tab',
    input: 'Entrada',
    output: 'Saída',
    csvPlaceholder: 'nome,idade\nAna,30\nBruno,25',
    jsonPlaceholder: '[\n  { "nome": "Ana", "idade": 30 },\n  { "nome": "Bruno", "idade": 25 }\n]',
    convert: 'Converter',
    copy: 'Copiar',
    copied: 'Copiado!',
    errorTitle: 'Erro ao converter',
    errorInvalidJson: 'JSON inválido — verifique a sintaxe.',
    errorNotArray: 'O JSON precisa ser um array de objetos.',
    errorEmptyCsv: 'O CSV precisa ter ao menos uma linha de cabeçalho e uma linha de dados.',
  },
  en: {
    title: 'CSV ↔ JSON Converter',
    intro: 'Converts CSV into a JSON array of objects (using the first row as header) and back. Supports quoted fields with commas, line breaks, and escaped ("") quotes. Everything runs locally, nothing leaves the browser.',
    csvToJson: 'CSV → JSON',
    jsonToCsv: 'JSON → CSV',
    delimiter: 'Delimiter',
    comma: 'Comma (,)',
    semicolon: 'Semicolon (;)',
    tab: 'Tab',
    input: 'Input',
    output: 'Output',
    csvPlaceholder: 'name,age\nAna,30\nBruno,25',
    jsonPlaceholder: '[\n  { "name": "Ana", "age": 30 },\n  { "name": "Bruno", "age": 25 }\n]',
    convert: 'Convert',
    copy: 'Copy',
    copied: 'Copied!',
    errorTitle: 'Conversion error',
    errorInvalidJson: 'Invalid JSON — check the syntax.',
    errorNotArray: 'The JSON must be an array of objects.',
    errorEmptyCsv: 'The CSV needs at least a header line and one data line.',
  },
}

export default function CsvJsonConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [direction, setDirection] = useState('csvToJson')
  const [delimiterKey, setDelimiterKey] = useState('comma')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const delimiter = DELIMITERS[delimiterKey]

  function convert() {
    setError('')
    setOutput('')
    if (!input.trim()) return

    try {
      if (direction === 'csvToJson') {
        const rows = parseCsv(input, delimiter)
        if (rows.length < 2) {
          setError(t.errorEmptyCsv)
          return
        }
        const json = csvToJson(input, delimiter)
        setOutput(JSON.stringify(json, null, 2))
      } else {
        let parsed
        try {
          parsed = JSON.parse(input)
        } catch {
          setError(t.errorInvalidJson)
          return
        }
        if (!Array.isArray(parsed)) {
          setError(t.errorNotArray)
          return
        }
        setOutput(jsonToCsv(input, delimiter))
      }
    } catch {
      setError(t.errorTitle)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Space wrap size="large">
        <Radio.Group
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value)
            setInput('')
            setOutput('')
            setError('')
          }}
          optionType="button"
        >
          <Radio.Button value="csvToJson">{t.csvToJson}</Radio.Button>
          <Radio.Button value="jsonToCsv">{t.jsonToCsv}</Radio.Button>
        </Radio.Group>

        <Space>
          <Text>{t.delimiter}:</Text>
          <Radio.Group value={delimiterKey} onChange={(e) => setDelimiterKey(e.target.value)} optionType="button" size="small">
            <Radio.Button value="comma">{t.comma}</Radio.Button>
            <Radio.Button value="semicolon">{t.semicolon}</Radio.Button>
            <Radio.Button value="tab">{t.tab}</Radio.Button>
          </Radio.Group>
        </Space>
      </Space>

      <Card title={t.input} size="small">
        <TextArea
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={direction === 'csvToJson' ? t.csvPlaceholder : t.jsonPlaceholder}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <Button type="primary" onClick={convert}>{t.convert}</Button>

      {error && <Alert type="error" showIcon message={t.errorTitle} description={error} />}

      {output && (
        <Card
          title={t.output}
          size="small"
          extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
        >
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{output}</code>
          </pre>
        </Card>
      )}
    </Space>
  )
}
