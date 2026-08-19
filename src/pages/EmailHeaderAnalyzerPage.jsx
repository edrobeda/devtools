import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Button,
  Space,
  Table,
  Tag,
  Alert,
  Collapse,
  Timeline,
  Descriptions,
  message,
} from 'antd'
import {
  MailOutlined,
  CopyOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  analyze,
  extractIp,
  getAllHeaders,
  getEngineSource,
} from '../utils/emailHeaderParser'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const SAMPLE_HEADERS = [
  'Return-Path: <onboarding@news.example.com>',
  'Received: from mail-gw1.external.isp.net (mail-gw1.external.isp.net [203.0.113.7])',
  '\tby mx.examplecorp.com (Postfix) with ESMTPS id 4Xm81z3DqZ',
  '\tfor <patricia.santos@examplecorp.com>; Thu, 14 Aug 2026 09:48:12 +0000',
  'Received: from smtp-relay.sendgrid.net (ec2-192-0-2-44.sa-east-1.compute.amazonaws.com [192.0.2.44])',
  '\tby mail-gw1.external.isp.net with ESMTPS id 9tK4cw2;',
  '\tThu, 14 Aug 2026 09:48:10 +0000',
  'Received: from mailer.news.example.com (mailer.news.example.com [198.51.100.23])',
  '\tby smtp-relay.sendgrid.net with ESMTP id 5xJ9aA2bC',
  '\tfor <patricia.santos@examplecorp.com>; Thu, 14 Aug 2026 09:48:08 +0000',
  'DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=news.example.com; s=s1;',
  '\th=from:subject:date:message-id; bh=AbCdEfGh...; b=ZyXwVuTs...',
  'Authentication-Results: mx.examplecorp.com; dkim=pass header.d=news.example.com header.s=s1;',
  '\tspf=pass smtp.mailfrom=news.example.com;',
  '\tdmarc=pass header.from=news.example.com',
  'Received-SPF: pass (examplecorp.com: domain of news.example.com designates 198.51.100.23 as permitted sender)',
  '\treceiver=mx.examplecorp.com; client-ip=198.51.100.23;',
  '\tenvelope-from=onboarding@news.example.com; helo=mailer.news.example.com',
  'Date: Thu, 14 Aug 2026 09:48:07 +0000',
  'From: =?UTF-8?Q?Equipe_de_Suporte?= <onboarding@news.example.com>',
  'To: <patricia.santos@examplecorp.com>',
  'Message-ID: <a1b2c3d4e5f6@mailer.news.example.com>',
  'Subject: =?UTF-8?B?Tm92aWRhZGVzIGRvIFByb2R1dG8=?= / =?UTF-8?Q?edi=C3=A7=C3=A3o_42?=',
  'X-Mailer: NewsMailer 3.7',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset="UTF-8"',
].join('\n')

const translations = {
  pt: {
    title: 'Analisador de Cabeçalhos de E-mail',
    intro: (
      <>
        Cole aqui os <Text strong>cabeçalhos completos</Text> de um e-mail
        (o “Mostrar original” do Gmail / “Ver mensagem original” do Outlook) e
        veja a trilha que ele percorreu: saltos <Text code>Received</Text> em
        ordem, resultados de SPF/DKIM/DMARC e todos os campos decodificados —
        incluindo palavras MIME <Text code>=?UTF-8?B?...?=</Text>. 100% no
        navegador, nada sai dele.
      </>
    ),
    inputTitle: 'Cabeçalhos brutos',
    placeholder: 'Cole aqui os cabeçalhos do e-mail (a partir do Return-Path ou do primeiro Received)...',
    loadSample: 'Carregar exemplo',
    clear: 'Limpar',
    emptyHint: 'Cole os cabeçalhos brutos de um e-mail para começar a análise. Em quase todos os clientes isso aparece como “Mostrar original” / “Ver fonte”.',
    errNoHeaders: 'Não encontrei nenhum cabeçalho no texto colado. Use o botão “Carregar exemplo” para ver o formato esperado.',
    loadError: 'Não consegui analisar os cabeçalhos deste texto.',
    summaryTitle: 'Resumo',
    from: 'De (From)',
    to: 'Para (To)',
    subject: 'Assunto (Subject)',
    date: 'Data (Date)',
    messageId: 'Message-ID',
    returnPath: 'Return-Path',
    deliveredTo: 'Delivered-To / Envelope-to',
    hopsCount: 'Saltos (servidores)',
    headersCount: 'Cabeçalhos no total',
    spamStatus: 'X-Spam-Status',
    justNow: 'agora',
    minAgo: 'min atrás',
    hourAgo: 'h atrás',
    dayAgo: 'dia(s) atrás',
    securityTitle: 'Autenticação (SPF / DKIM / DMARC)',
    securityHint: 'Resultados extraídos de Authentication-Results e Received-SPF. Verde = pass; vermelho = fail; cinza = sem resultado.',
    securityEmpty: 'Este e-mail não traz resultados de autenticação (SPF/DKIM/DMARC) nos cabeçalhos.',
    spf: 'SPF',
    dkim: 'DKIM',
    dmarc: 'DMARC',
    statusNone: 'sem resultado',
    dkimSigPresent: 'assinatura presente',
    authResultsRaw: 'Authentication-Results (bruto)',
    receivedTitle: 'Trilha de entrega (Received)',
    receivedHint: 'Os cabeçalhos Received vêm do mais recente (topo) para o mais antigo — é o caminho que o e-mail percorreu até a sua caixa.',
    hopFrom: 'De',
    hopBy: 'Por',
    hopWith: 'Protocolo',
    hopId: 'id',
    hopFor: 'para',
    hopRecent: 'mais recente',
    hopOrigin: 'origem',
    noReceived: 'Este cabeçalho não tem saltos Received (e-mail pequeno, entregue localmente, ou colado sem a parte dos Received).',
    headersTableTitle: 'Todos os cabeçalhos',
    searchPlaceholder: 'Filtrar por nome ou valor...',
    colName: 'Cabeçalho',
    colValue: 'Valor (decodificado)',
    copy: 'Copiar',
    copied: 'Copiado',
    source: 'Código-fonte do motor',
  },
  en: {
    title: 'E-mail Header Analyzer',
    intro: (
      <>
        Paste a message's full <Text strong>headers</Text> (Gmail's “Show
        original” / Outlook's “View message source”) to see the route it took:
        the <Text code>Received</Text> hops in order, SPF/DKIM/DMARC results
        and every field decoded — including MIME encoded-words like{' '}
        <Text code>=?UTF-8?B?...?=</Text>. 100% in the browser, nothing leaves
        it.
      </>
    ),
    inputTitle: 'Raw headers',
    placeholder: 'Paste the e-mail headers here (starting at Return-Path or the first Received line)...',
    loadSample: 'Load sample',
    clear: 'Clear',
    emptyHint: 'Paste the raw headers of an e-mail to start. In most clients this is “Show original” / “View message source”.',
    errNoHeaders: 'No headers found in the pasted text. Use the “Load sample” button to see the expected format.',
    loadError: 'Could not analyze the headers in this text.',
    summaryTitle: 'Summary',
    from: 'From',
    to: 'To',
    subject: 'Subject',
    date: 'Date',
    messageId: 'Message-ID',
    returnPath: 'Return-Path',
    deliveredTo: 'Delivered-To / Envelope-to',
    hopsCount: 'Hops (servers)',
    headersCount: 'Total headers',
    spamStatus: 'X-Spam-Status',
    justNow: 'just now',
    minAgo: 'min ago',
    hourAgo: 'h ago',
    dayAgo: 'day(s) ago',
    securityTitle: 'Authentication (SPF / DKIM / DMARC)',
    securityHint: 'Results pulled from Authentication-Results and Received-SPF. Green = pass; red = fail; gray = no result.',
    securityEmpty: 'This e-mail carries no authentication results (SPF/DKIM/DMARC) in its headers.',
    spf: 'SPF',
    dkim: 'DKIM',
    dmarc: 'DMARC',
    statusNone: 'no result',
    dkimSigPresent: 'signature present',
    authResultsRaw: 'Authentication-Results (raw)',
    receivedTitle: 'Delivery trail (Received)',
    receivedHint: 'Received headers are newest first (top) — that is the path the e-mail travelled to your mailbox.',
    hopFrom: 'From',
    hopBy: 'By',
    hopWith: 'Protocol',
    hopId: 'id',
    hopFor: 'for',
    hopRecent: 'most recent',
    hopOrigin: 'origin',
    noReceived: 'No Received hops (small e-mail delivered locally, or headers pasted without the Received block).',
    headersTableTitle: 'All headers',
    searchPlaceholder: 'Filter by name or value...',
    colName: 'Header',
    colValue: 'Value (decoded)',
    copy: 'Copy',
    copied: 'Copied',
    source: 'Engine source code',
  },
}

const STATUS_TAG_COLOR = {
  pass: 'green',
  fail: 'red',
  softfail: 'orange',
  neutral: 'default',
  none: 'default',
  temperror: 'magenta',
  permerror: 'magenta',
  bestguesspars: 'geekblue',
}

function statusTag(status, label) {
  return <Tag color={STATUS_TAG_COLOR[status] || 'default'}>{label}</Tag>
}

function formatDateLocal(d) {
  const pad = (n) => String(n).padStart(2, '0')
  const tz = -d.getTimezoneOffset() / 60
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} (GMT${tz >= 0 ? '+' : ''}${tz})`
}

function formatDateEn(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n) => String(n).padStart(2, '0')
  const tz = -d.getTimezoneOffset() / 60
  return `${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} (GMT${tz >= 0 ? '+' : ''}${tz})`
}

function relativeTime(date, t) {
  const diff = Date.now() - date.getTime()
  const mins = Math.round(diff / 60000)
  if (!Number.isFinite(mins) || mins <= 0) return t.justNow
  if (mins < 60) return `${mins} ${t.minAgo}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${t.hourAgo}`
  return `${Math.floor(hours / 24)} ${t.dayAgo}`
}

function addressLabel(addr) {
  if (!addr) return null
  if (addr.name && addr.email) return `${addr.name} <${addr.email}>`
  if (addr.email) return addr.email
  if (addr.name) return addr.name
  return null
}

export default function EmailHeaderAnalyzerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState('')
  const [filterText, setFilterText] = useState('')

  const analysis = useMemo(() => analyze(input), [input])

  const timelineItems = useMemo(() => {
    if (!analysis.ok) return []
    return analysis.received.map((hop, i) => {
      const ip = extractIp(hop.from)
      const lines = []
      if (hop.from) {
        lines.push(
          <div key="f">
            <Text strong>{t.hopFrom}</Text>{' '}
            <Text code>{hop.from}</Text>
            {ip && <Tag color="blue" style={{ marginLeft: 6 }}>{ip}</Tag>}
          </div>
        )
      }
      if (hop.by) {
        lines.push(
          <div key="b">
            <Text strong>{t.hopBy}</Text> <Text code>{hop.by}</Text>
          </div>
        )
      }
      if (hop.withInfo || hop.id || hop.forAddr) {
        lines.push(
          <div key="w" style={{ fontSize: 12 }}>
            {hop.withInfo && <><Text type="secondary">{t.hopWith}:</Text> <Text code style={{ fontSize: 12 }}>{hop.withInfo}</Text> </>}
            {hop.id && <><Text type="secondary">{t.hopId} </Text><Text code style={{ fontSize: 12 }}>{hop.id}</Text> </>}
            {hop.forAddr && <><Text type="secondary">{t.hopFor} </Text><Text code style={{ fontSize: 12 }}>{hop.forAddr}</Text></>}
          </div>
        )
      }
      if (hop.date) {
        lines.push(
          <div key="d" style={{ fontSize: 12 }}>
            <Text type="secondary">{lang === 'pt' ? formatDateLocal(hop.date) : formatDateEn(hop.date)}</Text>
            {' · '}
            <Text type="secondary">{relativeTime(hop.date, t)}</Text>
          </div>
        )
      }
      return {
        color: i === 0 ? 'green' : 'blue',
        children: (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Tag color={i === 0 ? 'green' : 'default'} style={{ marginBottom: 4 }}>
              {i === 0 ? t.hopRecent : `#${i + 1}`} {i === analysis.received.length - 1 ? `· ${t.hopOrigin}` : ''}
            </Tag>
            {lines}
          </Space>
        ),
      }
    })
  }, [analysis, t, lang])

  const securityRows = useMemo(
    () => [
      { key: 'spf', check: t.spf, kind: 'spf' },
      { key: 'dkim', check: t.dkim, kind: 'dkim' },
      { key: 'dmarc', check: t.dmarc, kind: 'dmarc' },
    ],
    [t]
  )

  const securityData = useMemo(() => {
    if (!analysis.ok) return {}
    return { spf: analysis.security.spf, dkim: analysis.security.dkim, dmarc: analysis.security.dmarc }
  }, [analysis])

  const securityHasResults = useMemo(
    () => analysis.ok && (securityData.spf.length > 0 || securityData.dkim.length > 0 || securityData.dmarc.length > 0),
    [analysis, securityData]
  )

  const securityColumns = [
    {
      key: 'check',
      width: 140,
      render: (_, record) => (
        <Text strong style={{ fontSize: 13 }}>
          {record.check}
        </Text>
      ),
    },
    {
      key: 'result',
      render: (_, record) => {
        const rows = securityData[record.kind] || []
        if (rows.length === 0) return <Text type="secondary">{t.statusNone}</Text>
        return (
          <Space wrap>
            {rows.map((r, i) => {
              const isSig = record.kind === 'dkim' && r.present
              const label = isSig ? t.dkimSigPresent : r.status
              const rawTail = r.raw && r.raw.length > 56 ? `${r.raw.slice(0, 56)}…` : r.raw
              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {statusTag(isSig ? 'pass' : r.status, label)}
                  {r.domain && <Text style={{ fontSize: 12 }} strong>{r.domain}</Text>}
                  {r.selector && <Text type="secondary" style={{ fontSize: 12 }}>s={r.selector}</Text>}
                  {rawTail && <Text style={{ fontSize: 11 }} type="secondary" code>{rawTail}</Text>}
                </span>
              )
            })}
          </Space>
        )
      },
    },
  ]

  const authResultsRaw = useMemo(
    () => (analysis.ok ? analysis.security.authResults : []),
    [analysis]
  )

  const spamStatusHeader = useMemo(
    () => (analysis.ok ? getAllHeaders(analysis.headers, 'x-spam-status')[0] : null),
    [analysis]
  )

  const headersColumns = [
    {
      title: t.colName,
      dataIndex: 'name',
      width: 250,
      render: (v) => <Text code strong style={{ wordBreak: 'break-all' }}>{v}</Text>,
    },
    {
      title: t.colValue,
      dataIndex: 'value',
      render: (v) => (
        <Space size={6} align="start" style={{ width: '100%' }}>
          <Text
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              flex: 1,
            }}
          >
            {v}
          </Text>
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(v)
              message.success(t.copied)
            }}
          />
        </Space>
      ),
    },
  ]

  const searchableHeaders = useMemo(() => (analysis.ok ? analysis.headers : []), [analysis])
  const visibleRows = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    if (!q) return searchableHeaders
    return searchableHeaders.filter(
      (h) => h.name.toLowerCase().includes(q) || h.value.toLowerCase().includes(q)
    )
  }, [searchableHeaders, filterText])

  function loadSample() {
    setInput(SAMPLE_HEADERS)
  }

  function clear() {
    setInput('')
    setFilterText('')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <MailOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={<><FileTextOutlined /> {t.inputTitle}</>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          <Space wrap>
            <Button type="primary" icon={<ExperimentOutlined />} onClick={loadSample}>
              {t.loadSample}
            </Button>
            <Button icon={<DeleteOutlined />} onClick={clear}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      {!input.trim() ? (
        <Alert type="info" showIcon message={t.emptyHint} />
      ) : !analysis.ok ? (
        <Alert type="error" showIcon message={analysis.error === 'no-headers' ? t.errNoHeaders : t.loadError} />
      ) : (
        <>
          <Card title={<><SafetyOutlined /> {t.summaryTitle}</>}>
            <Descriptions column={{ xs: 1, sm: 1, md: 2 }} size="small" bordered>
              <Descriptions.Item label={t.from}>
                {addressLabel(analysis.summary.from) || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t.to}>
                {addressLabel(analysis.summary.to) || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t.subject} span={2}>
                {analysis.summary.subject || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t.date}>
                {analysis.summary.dateObj ? (
                  <>
                    <Text code style={{ fontSize: 12 }}>
                      {lang === 'pt' ? formatDateLocal(analysis.summary.dateObj) : formatDateEn(analysis.summary.dateObj)}
                    </Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      ({relativeTime(analysis.summary.dateObj, t)})
                    </Text>
                  </>
                ) : (
                  analysis.summary.dateHeader || '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t.hopsCount}>
                <Tag color={analysis.received.length ? 'blue' : 'default'}>{analysis.received.length || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t.headersCount} span={2}>
                <Tag color="geekblue">{analysis.headers.length || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t.messageId}>
                <Text code style={{ wordBreak: 'break-all' }}>{analysis.summary.messageId || '—'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.returnPath}>
                <Text code style={{ wordBreak: 'break-all' }}>{analysis.summary.returnPath || '—'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.deliveredTo} span={2}>
                <Text code>{analysis.summary.deliveredTo || analysis.summary.envelopeTo || '—'}</Text>
              </Descriptions.Item>
              {spamStatusHeader && (
                <Descriptions.Item label={t.spamStatus} span={2}>
                  <Text code style={{ wordBreak: 'break-all' }}>{spamStatusHeader.value}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card
            title={<><SendOutlined /> {t.securityTitle}</>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.securityHint}</Text>}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {!securityHasResults ? (
                <Alert type="info" showIcon message={t.securityEmpty} />
              ) : (
                <Table
                  size="small"
                  columns={securityColumns}
                  dataSource={securityRows}
                  pagination={false}
                  showHeader={false}
                  scroll={{ x: 520 }}
                />
              )}
              {authResultsRaw.length > 0 && (
                <Collapse ghost size="small">
                  <Panel header={<Text type="secondary" style={{ fontSize: 12 }}>{t.authResultsRaw}</Text>} key="auth">
                    {authResultsRaw.map((raw, i) => (
                      <pre key={i} style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{raw}</pre>
                    ))}
                  </Panel>
                </Collapse>
              )}
            </Space>
          </Card>

          <Card
            title={<><ClockCircleOutlined /> {t.receivedTitle}</>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.receivedHint}</Text>}
          >
            {analysis.received.length === 0 ? (
              <Alert type="info" showIcon message={t.noReceived} />
            ) : (
              <Timeline items={timelineItems} style={{ maxWidth: 900 }} />
            )}
          </Card>

          <Card title={<><FileTextOutlined /> {t.headersTableTitle}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input.Search
                allowClear
                placeholder={t.searchPlaceholder}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{ maxWidth: 420 }}
              />
              <Table
                size="small"
                columns={headersColumns}
                dataSource={visibleRows}
                pagination={false}
                scroll={{ x: 640 }}
              />
            </Space>
          </Card>
        </>
      )}

      <Collapse>
        <Panel header={t.source} key="source">
          <pre style={{ margin: 0, overflow: 'auto' }}>
            <code>{getEngineSource()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}