import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Segmented, Switch, Select,
  List, Tag, Badge, message, Empty, Row, Col, Statistic, Alert,
} from 'antd'
import {
  LinkOutlined, MailOutlined, CopyOutlined, DeleteOutlined,
  FileTextOutlined, DownloadOutlined, ClearOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  extractUrls, extractEmails, processExtraction,
  buildOnePerLine, buildMarkdownList, buildCsv, SAMPLE_TEXT,
} from '../utils/urlEmailExtractor'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const sourceCode = [
  "const URL_RE = /https?:\\/\\/[^\\s<>\"{}|\\\\^`[\\]]+/gi",
  "const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g",
  '',
  'export function extractUrls(text) {',
  '  if (!text) return []',
  '  return Array.from(text.matchAll(URL_RE), (m) => m[0])',
  '}',
  '',
  'export function extractEmails(text) {',
  '  if (!text) return []',
  '  return Array.from(text.matchAll(EMAIL_RE), (m) => m[0])',
  '}',
].join('\n')

const translations = {
  pt: {
    title: 'Extrator de URLs e E-mails',
    intro: (
      <>
        Cole um texto qualquer — documentos, logs, páginas, relatórios — e
        extraia todos os links HTTP/HTTPS e endereços de e-mail de uma vez.
        Tudo roda localmente no navegador: nenhum dado sai da máquina.
      </>
    ),
    inputTitle: 'Texto de entrada',
    placeholder: 'Cole o texto aqui...',
    modeLabel: 'Extrair',
    modeUrls: 'URLs',
    modeEmails: 'E-mails',
    modeAll: 'Ambos',
    dedupe: 'Remover duplicados',
    sortLabel: 'Ordenar por',
    sortNone: 'Nenhuma',
    sortDefault: 'Alfabética',
    sortLength: 'Tamanho',
    sortDomain: 'Domínio',
    sample: 'Exemplo',
    clear: 'Limpar',
    resultTitle: 'Resultados',
    copy: 'Copiar',
    copied: 'Copiado!',
    downloadCsv: 'CSV',
    downloadMd: 'Markdown',
    noResults: 'Nenhum resultado encontrado no texto.',
    statsTitle: 'Estatísticas',
    total: 'Total',
    urls: 'URLs',
    emails: 'E-mails',
    unique: 'Únicos',
    sourceTitle: 'Algoritmo (regexes usadas)',
    note: 'A regex de URL captura apenas links HTTP/HTTPS. E-mails com sinais de +, traços, subdomínios e TLDs comuns são reconhecidos. Padrões inválidos ou incompletos podem não ser detectados.',
  },
  en: {
    title: 'URL & E-mail Extractor',
    intro: (
      <>
        Paste any text — documents, logs, pages, reports — and extract every
        HTTP/HTTPS link and e-mail address at once. Everything runs locally in
        the browser: no data leaves your machine.
      </>
    ),
    inputTitle: 'Input text',
    placeholder: 'Paste your text here...',
    modeLabel: 'Extract',
    modeUrls: 'URLs',
    modeEmails: 'E-mails',
    modeAll: 'Both',
    dedupe: 'Remove duplicates',
    sortLabel: 'Sort by',
    sortNone: 'None',
    sortDefault: 'Alphabetical',
    sortLength: 'Length',
    sortDomain: 'Domain',
    sample: 'Sample',
    clear: 'Clear',
    resultTitle: 'Results',
    copy: 'Copy',
    copied: 'Copied!',
    downloadCsv: 'CSV',
    downloadMd: 'Markdown',
    noResults: 'No results found in the text.',
    statsTitle: 'Statistics',
    total: 'Total',
    urls: 'URLs',
    emails: 'E-mails',
    unique: 'Unique',
    sourceTitle: 'Algorithm (regexes used)',
    note: 'The URL regex only captures HTTP/HTTPS links. E-mails with plus signs, dashes, subdomains and common TLDs are recognized. Invalid or incomplete patterns may not be detected.',
  },
}

export default function UrlEmailExtractorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState(SAMPLE_TEXT)
  const [mode, setMode] = useState('all')
  const [dedupe, setDedupe] = useState(true)
  const [sortMode, setSortMode] = useState('default')

  const urlCount = useMemo(() => extractUrls(text).length, [text])
  const emailCount = useMemo(() => extractEmails(text).length, [text])

  const results = useMemo(() => {
    return processExtraction({ text, mode, deduplicate: dedupe, sortMode })
  }, [text, mode, dedupe, sortMode])

  const uniqueUrlCount = useMemo(() => new Set(extractUrls(text)).size, [text])
  const uniqueEmailCount = useMemo(() => new Set(extractEmails(text)).size, [text])

  async function copyResults() {
    if (results.length === 0) return
    try {
      await navigator.clipboard.writeText(buildOnePerLine(results))
      message.success(t.copied)
    } catch {
      message.error('Copy failed')
    }
  }

  function download(content, filename, type) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const modeOptions = [
    { label: t.modeUrls, value: 'urls', icon: <LinkOutlined /> },
    { label: t.modeEmails, value: 'emails', icon: <MailOutlined /> },
    { label: t.modeAll, value: 'all' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><LinkOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={10}>
              <Space>
                <Text type="secondary">{t.modeLabel}:</Text>
                <Segmented
                  value={mode}
                  onChange={setMode}
                  options={modeOptions}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Switch checked={dedupe} onChange={setDedupe} size="small" />
                <Text type="secondary">{t.dedupe}</Text>
              </Space>
            </Col>
            <Col xs={24} sm={24} md={6}>
              <Space>
                <Text type="secondary">{t.sortLabel}:</Text>
                <Select value={sortMode} onChange={setSortMode} style={{ width: 130 }}>
                  <Option value="none">{t.sortNone}</Option>
                  <Option value="default">{t.sortDefault}</Option>
                  <Option value="length">{t.sortLength}</Option>
                  <Option value="domain">{t.sortDomain}</Option>
                </Select>
              </Space>
            </Col>
          </Row>
          <Space wrap>
            <Button onClick={() => setText(SAMPLE_TEXT)} icon={<FileTextOutlined />}>
              {t.sample}
            </Button>
            <Button onClick={() => setText('')} icon={<ClearOutlined />} disabled={!text}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title={t.statsTitle}>
        <Row gutter={[24, 24]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.total} value={results.length} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.urls} value={urlCount} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.emails} value={emailCount} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={`${t.unique} ${t.urls.toLowerCase()}`} value={uniqueUrlCount} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={`${t.unique} ${t.emails.toLowerCase()}`} value={uniqueEmailCount} />
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <span>{t.resultTitle}</span>
            <Badge count={results.length} showZero color="#1677ff" />
          </Space>
        }
        extra={
          <Space wrap>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={copyResults}
              disabled={results.length === 0}
            >
              {t.copy}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => download(buildCsv(results), 'extracao.csv', 'text/csv')}
              disabled={results.length === 0}
            >
              {t.downloadCsv}
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => download(buildMarkdownList(results, mode), 'extracao.md', 'text/markdown')}
              disabled={results.length === 0}
            >
              {t.downloadMd}
            </Button>
          </Space>
        }
      >
        {results.length === 0 ? (
          <Empty description={t.noResults} />
        ) : (
          <List
            bordered
            size="small"
            dataSource={results}
            style={{ maxHeight: 440, overflow: 'auto' }}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  {item.includes('@') ? (
                    <Tag icon={<MailOutlined />} color="blue">e-mail</Tag>
                  ) : (
                    <Tag icon={<LinkOutlined />} color="green">URL</Tag>
                  )}
                  <Text code copyable={{ text: item }} style={{ wordBreak: 'break-all' }}>
                    {item}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Alert type="info" showIcon message={t.note} />

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
