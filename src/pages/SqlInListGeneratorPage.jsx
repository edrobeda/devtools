import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Checkbox,
  InputNumber,
  Button,
  Alert,
  Tag,
  Collapse,
  message,
} from 'antd'
import { DatabaseOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  generateInList,
  DATA_TYPES,
  DATA_TYPE_LABELS,
  QUOTES,
  NULL_BEHAVIORS,
  NULL_BEHAVIOR_LABELS,
  SORTS,
  SORT_LABELS,
  OUTPUT_MODES,
  OUTPUT_MODE_LABELS,
  CHUNK_SIZES,
  SOURCE_SNIPPET,
} from '../utils/sqlInListGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLES = {
  ids: {
    pt: 'IDs numéricos',
    en: 'Numeric IDs',
    value: '42\n7\n99\n42\n13\n256\nnot_a_number\n88',
    options: { dataType: 'integer', quote: "'", nullBehavior: 'omit', dedupe: true, sort: 'asc', chunkSize: 1000, outputMode: 'where', columnName: 'id', wrapInParentheses: true },
  },
  emails: {
    pt: 'E-mails',
    en: 'E-mails',
    value: `alice@example.com
bob@example.com
Alice@example.com
charlie@example.com
\nnull`,
    options: { dataType: 'string', quote: "'", nullBehavior: 'null', dedupe: true, caseInsensitive: true, sort: 'asc', chunkSize: 1000, outputMode: 'where', columnName: 'email', wrapInParentheses: true },
  },
  countries: {
    pt: 'Países (texto)',
    en: 'Countries (text)',
    value: "Brasil\nArgentina\nChile\nBrasil\nJapão\nO'Reilly",
    options: { dataType: 'string', quote: "'", nullBehavior: 'omit', dedupe: true, caseInsensitive: false, sort: 'asc', chunkSize: 1000, outputMode: 'where', columnName: 'country', wrapInParentheses: true },
  },
  dates: {
    pt: 'Datas ISO',
    en: 'ISO dates',
    value: '2024-01-15\n2024-12-31\n2023-06-01\n2024-01-15',
    options: { dataType: 'date', quote: "'", nullBehavior: 'omit', dedupe: true, sort: 'asc', chunkSize: 1000, outputMode: 'where', columnName: 'created_at', wrapInParentheses: true },
  },
}

const translations = {
  pt: {
    title: 'Gerador de Cláusula SQL IN',
    intro:
      'Cole uma lista de valores e monte expressões SQL IN / NOT IN prontas para colar em queries. Escolha o tipo de dados, aspas, comportamento de vazios/NULL, remoção de duplicatas, ordenação e quebra em chunks — útil quando o banco impõe limite de itens por IN.',
    inputTitle: 'Valores de entrada',
    outputTitle: 'Resultado SQL',
    options: 'Opções',
    dataType: 'Tipo de dado',
    quote: 'Aspas',
    nullBehavior: 'Como tratar vazios/NULL',
    dedupe: 'Remover duplicatas',
    caseInsensitive: 'Deduplicação case-insensitive',
    sort: 'Ordenação',
    chunkSize: 'Máx. itens por IN (0 = sem limite)',
    outputMode: 'Modo de saída',
    columnName: 'Nome da coluna',
    wrapInParentheses: 'Envolver em parênteses',
    sample: 'Exemplos rápidos',
    empty: 'Cole uma lista com um valor por linha.',
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar',
    stats: (parsed, unique, chunks, invalid) =>
      `${parsed} valores válidos · ${unique} únicos · ${chunks} chunk${chunks === 1 ? '' : 's'} · ${invalid} inválido${invalid === 1 ? '' : 's'}`,
    invalidTitle: 'Itens ignorados',
    sourceTitle: 'Código-fonte do motor',
    noteTitle: 'Dicas',
    noteBody:
      'Aspas simples são o padrão SQL para literais de texto. Para identificadores, use backticks (MySQL/MariaDB) ou aspas duplas (PostgreSQL/Oracle). Valores inválidos para tipos numéricos são omitidos do resultado e listados acima.',
  },
  en: {
    title: 'SQL IN Clause Generator',
    intro:
      'Paste a value list and build SQL IN / NOT IN expressions ready to drop into queries. Choose data type, quotes, empty/NULL handling, deduplication, sorting, and chunking — handy when your database limits items per IN clause.',
    inputTitle: 'Input values',
    outputTitle: 'SQL output',
    options: 'Options',
    dataType: 'Data type',
    quote: 'Quote',
    nullBehavior: 'Empty/NULL handling',
    dedupe: 'Remove duplicates',
    caseInsensitive: 'Case-insensitive deduplication',
    sort: 'Sort',
    chunkSize: 'Max items per IN (0 = no limit)',
    outputMode: 'Output mode',
    columnName: 'Column name',
    wrapInParentheses: 'Wrap in parentheses',
    sample: 'Quick samples',
    empty: 'Paste a list with one value per line.',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    stats: (parsed, unique, chunks, invalid) =>
      `${parsed} valid values · ${unique} unique · ${chunks} chunk${chunks === 1 ? '' : 's'} · ${invalid} invalid`,
    invalidTitle: 'Ignored items',
    sourceTitle: 'Engine source code',
    noteTitle: 'Tips',
    noteBody:
      'Single quotes are the SQL standard for string literals. For identifiers, use backticks (MySQL/MariaDB) or double quotes (PostgreSQL/Oracle). Values that fail numeric validation are omitted from the output and listed above.',
  },
}

export default function SqlInListGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const dataTypeLabels = DATA_TYPE_LABELS[lang]
  const nullLabels = NULL_BEHAVIOR_LABELS[lang]
  const sortLabels = SORT_LABELS[lang]
  const modeLabels = OUTPUT_MODE_LABELS[lang]

  const [input, setInput] = useState(SAMPLES.ids.value)
  const [dataType, setDataType] = useState(SAMPLES.ids.options.dataType)
  const [quote, setQuote] = useState(SAMPLES.ids.options.quote)
  const [nullBehavior, setNullBehavior] = useState(SAMPLES.ids.options.nullBehavior)
  const [dedupe, setDedupe] = useState(SAMPLES.ids.options.dedupe)
  const [caseInsensitive, setCaseInsensitive] = useState(false)
  const [sort, setSort] = useState(SAMPLES.ids.options.sort)
  const [chunkSize, setChunkSize] = useState(SAMPLES.ids.options.chunkSize)
  const [outputMode, setOutputMode] = useState(SAMPLES.ids.options.outputMode)
  const [columnName, setColumnName] = useState(SAMPLES.ids.options.columnName)
  const [wrapInParentheses, setWrapInParentheses] = useState(SAMPLES.ids.options.wrapInParentheses)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    return generateInList(input, {
      dataType,
      quote,
      nullBehavior,
      dedupe,
      caseInsensitive,
      sort,
      chunkSize: Number(chunkSize) || 0,
      outputMode,
      columnName: columnName.trim() || 'id',
      wrapInParentheses,
    })
  }, [input, dataType, quote, nullBehavior, dedupe, caseInsensitive, sort, chunkSize, outputMode, columnName, wrapInParentheses])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      message.success(t.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(lang === 'pt' ? 'Erro ao copiar' : 'Copy failed')
    }
  }

  function applySample(key) {
    const s = SAMPLES[key]
    setInput(s.value)
    setDataType(s.options.dataType)
    setQuote(s.options.quote)
    setNullBehavior(s.options.nullBehavior)
    setDedupe(s.options.dedupe)
    setCaseInsensitive(s.options.caseInsensitive || false)
    setSort(s.options.sort)
    setChunkSize(s.options.chunkSize)
    setOutputMode(s.options.outputMode)
    setColumnName(s.options.columnName)
    setWrapInParentheses(s.options.wrapInParentheses)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <DatabaseOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.options}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="center">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.dataType}</Text>
              <Select
                value={dataType}
                onChange={setDataType}
                style={{ width: 200 }}
                options={DATA_TYPES.map((v) => ({ value: v, label: dataTypeLabels[v] }))}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.quote}</Text>
              <Select
                value={quote}
                onChange={setQuote}
                style={{ width: 100 }}
                options={QUOTES.map((v) => ({ value: v, label: v }))}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.nullBehavior}</Text>
              <Select
                value={nullBehavior}
                onChange={setNullBehavior}
                style={{ width: 200 }}
                options={NULL_BEHAVIORS.map((v) => ({ value: v, label: nullLabels[v] }))}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.sort}</Text>
              <Select
                value={sort}
                onChange={setSort}
                style={{ width: 180 }}
                options={SORTS.map((v) => ({ value: v, label: sortLabels[v] }))}
              />
            </Space>
          </Space>

          <Space wrap size="large" align="center">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.outputMode}</Text>
              <Select
                value={outputMode}
                onChange={setOutputMode}
                style={{ width: 220 }}
                options={OUTPUT_MODES.map((v) => ({ value: v, label: modeLabels[v] }))}
              />
            </Space>
            {outputMode !== 'values' && (
              <Space direction="vertical" size={4}>
                <Text type="secondary">{t.columnName}</Text>
                <Input
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  style={{ width: 160 }}
                  placeholder="id"
                />
              </Space>
            )}
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.chunkSize}</Text>
              <InputNumber
                min={0}
                max={100000}
                step={100}
                value={chunkSize}
                onChange={(v) => setChunkSize(v ?? 0)}
                style={{ width: 120 }}
              />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.dedupe}</Text>
              <Checkbox checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
            </Space>
            {dataType === 'string' && (
              <Space direction="vertical" size={4}>
                <Text type="secondary">{t.caseInsensitive}</Text>
                <Checkbox checked={caseInsensitive} onChange={(e) => setCaseInsensitive(e.target.checked)} />
              </Space>
            )}
            {outputMode === 'values' && (
              <Space direction="vertical" size={4}>
                <Text type="secondary">{t.wrapInParentheses}</Text>
                <Checkbox checked={wrapInParentheses} onChange={(e) => setWrapInParentheses(e.target.checked)} />
              </Space>
            )}
          </Space>
        </Space>
      </Card>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sample}</Text>
            {Object.keys(SAMPLES).map((key) => (
              <Tag key={key} color="blue" style={{ cursor: 'pointer' }} onClick={() => applySample(key)}>
                {SAMPLES[key][lang]}
              </Tag>
            ))}
          </Space>
          <TextArea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.empty}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.outputTitle}</span>
            {result.text && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.stats(result.totalParsed, result.uniqueCount, result.chunks, result.invalidCount)}
              </Text>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setInput('')}>
              {t.clear}
            </Button>
            {result.text && (
              <Button
                type="primary"
                size="small"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
              >
                {copied ? t.copied : t.copy}
              </Button>
            )}
          </Space>
        }
      >
        {result.invalidCount > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={t.invalidTitle}
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {result.invalid.map((err, idx) => (
                  <li key={idx}>
                    <Text code>{err}</Text>
                  </li>
                ))}
              </ul>
            }
          />
        )}
        {result.text ? (
          <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <code>{result.text}</code>
          </pre>
        ) : (
          <Alert type="info" showIcon message={t.empty} />
        )}
      </Card>

      <Alert type="info" showIcon message={t.noteTitle} description={t.noteBody} />

      <Card title={t.sourceTitle}>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>sqlInListGenerator.js</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>{SOURCE_SNIPPET}</pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
