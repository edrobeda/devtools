import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Input, Space, Button, Checkbox, Tag, Alert, Empty, Table,
  Row, Col, Statistic, Collapse,
} from 'antd'
import {
  ProfileOutlined, ExperimentOutlined, ClearOutlined, CopyOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  LEVELS, LEVEL_LABELS, LEVEL_COLORS, parseLogs, summarize, buildTimeline,
  formatTime, formatDateTime, formatInterval,
} from '../utils/logExplorer'

const { Title, Paragraph, Text } = Typography

const LEVEL_TAG = {
  fatal: 'magenta',
  error: 'red',
  warn: 'orange',
  info: 'blue',
  debug: 'purple',
  trace: 'default',
  unknown: 'default',
}

const SAMPLE_DOCKER = [
  'api-1    | 2026-10-14T12:00:01.120Z INFO  server listening on :3000',
  'api-1    | 2026-10-14T12:00:02.340Z INFO  connected to postgres',
  'db-1     | 2026-10-14 12:00:02.501 [INFO] database system is ready to accept connections',
  'api-1    | 2026-10-14T12:00:05.010Z WARN  slow query took 1487ms: SELECT * FROM orders',
  'api-1    | 2026-10-14T12:00:06.220Z ERROR failed to charge invoice 8842: card_declined',
  'api-1    |     at Payments.charge (payments.js:142)',
  'api-1    | 2026-10-14T12:00:06.900Z INFO  retrying charge 8842 (attempt 1/3)',
  'worker-1 | 2026-10-14T12:00:08.400Z DEBUG queue jobs.import drained (12 jobs)',
  'api-1    | 2026-10-14T12:00:09.000Z INFO  charge 8842 succeeded on retry',
].join('\n')

const SAMPLE_JSON = [
  '{"level":30,"time":1791979201120,"msg":"server started","pid":42,"hostname":"api-1"}',
  '{"level":30,"time":1791979202015,"msg":"connected to postgres","pid":42}',
  '{"level":40,"time":1791979205010,"msg":"slow query","durationMs":1487,"sql":"SELECT * FROM orders"}',
  '{"level":50,"time":1791979206220,"msg":"charge failed","invoice":"8842","code":"card_declined"}',
  '{"level":30,"time":1791979207330,"msg":"retrying charge 8842 (attempt 1/3)"}',
  '{"time":"2026-10-14T12:00:10.450000000Z","stream":"stdout","log":"worker drained 12 jobs\\n"}',
  '{"level":60,"time":1791979211500,"msg":"fatal: cannot bind :3000 (EADDRINUSE)","pid":42}',
].join('\n')

const SOURCE_CODE = [
  '// src/utils/logExplorer.js — resumo do parser (arquivo completo no repo)',
  'const DOCKER_PREFIX = /^([A-Za-z0-9_.\\-/]+)\\s{1,4}\\|\\s?/',
  'const TIMESTAMP = /(\\d{4}-\\d{2}-\\d{2})[T ](\\d{2}:\\d{2}:\\d{2})(?:[.,](\\d{1,9}))?\\s*(Z|[+-]\\d{2}:?\\d{2})?/',
  'const SYSLOG = /^([A-Z][a-z]{2}\\s{1,2}\\d{1,2}\\s+\\d{2}:\\d{2}:\\d{2})/',
  'const LEVEL = /^\\s*[[(<]?\\s*(trace|debug|info|warn|error|fatal)\\s*[\\])>]?\\s*(?::|[-])?\\s+/i',
  '',
  '// pino/bunyan usam número: 10 trace … 30 info … 60 fatal',
  'const pino = (n) => n >= 60 ? "fatal" : n >= 50 ? "error" : n >= 40 ? "warn"',
  '  : n >= 30 ? "info" : n >= 20 ? "debug" : "trace"',
  '',
  'function parseLine(text) {',
  '  let src = null, body = text',
  '  const dp = body.match(DOCKER_PREFIX)      // "api-1  | ..."',
  '  if (dp) { src = dp[1]; body = body.slice(dp[0].length) }',
  '',
  '  if (body[0] === "{") {                    // docker json-file / pino / bunyan',
  '    try {',
  '      const o = JSON.parse(body)',
  '      const msg = o.msg ?? o.message ?? o.log ?? o.text ?? ""',
  '      const lvl = typeof o.level === "number" ? pino(o.level)',
  '        : String(o.level ?? o.severity ?? "").toLowerCase()',
  '      return { src: o.hostname ?? src, level: lvl,',
  '        time: toEpoch(o.time ?? o.ts ?? o.timestamp),',
  '        message: String(msg).replace(/\\s+$/, "") }',
  '    } catch (e) { /* não é JSON válido: cai pro texto puro */ }',
  '  }',
  '',
  '  const ts = body.match(TIMESTAMP) || body.match(SYSLOG)',
  '  if (ts) body = body.replace(ts[0], " ").trim()',
  '',
  '  const lv = body.match(LEVEL)              // "[ERROR]", "WARN -", "INFO …"',
  '  return { src, time: ts ? toEpoch(ts[0]) : null,',
  '    level: lv ? lv[1].toLowerCase() : "unknown",',
  '    message: lv ? body.slice(lv[0].length).trim() : body }',
  '}',
].join('\n')

const translations = {
  pt: {
    title: 'Explorador de Logs',
    intro: (
      <>
        Cola um log em texto puro ou em JSON — saída de <Text code>docker compose</Text>,
        <Text code> docker logs</Text>, <Text code>kubectl logs</Text>, pm2, journalctl
        ou da própria aplicação — e veja cada linha classificada por{' '}
        <Text code>nível</Text>, timestamp e origem (container). Filtre por nível e por
        serviço, busque por texto ou regex e acompanhe a distribuição no tempo numa
        linha do tempo. O parser entende prefixos do Compose (<Text code>api-1 | ...</Text>),
        linhas JSON do <Text code>docker json-file</Text> e do pino/bunyan
        (<Text code>{'{"level":30,"msg":...}'}</Text>) e o formato em texto com
        <Text code> [INFO]</Text> no início. Tudo no navegador — nada é enviado.
      </>
    ),
    inputTitle: 'Log de entrada',
    inputPlaceholder: 'Cole aqui as linhas de log...',
    sampleDocker: 'Exemplo Docker Compose',
    sampleJson: 'Exemplo JSON (pino)',
    clear: 'Limpar',
    filtersTitle: 'Filtros',
    levelLabel: 'Nível',
    sourceLabel: 'Origem',
    searchPlaceholder: 'Buscar na mensagem ou na linha crua...',
    regexLabel: 'Regex',
    regexInvalid: 'Expressão regular inválida — o filtro de busca foi ignorado.',
    clearFilters: 'Limpar filtros',
    summaryTitle: 'Resumo',
    totalLines: 'Linhas',
    withTimestamp: 'Com timestamp',
    truncated: 'O log é longo demais: as primeiras 20.000 linhas foram processadas.',
    timelineTitle: 'Linha do tempo',
    timelineEmpty:
      'Nenhuma linha com timestamp reconhecido — sem dados suficientes para a linha do tempo. O parsing ainda mostra o nível e a mensagem de cada linha.',
    eachBar: 'cada barra ≈',
    resultsTitle: 'Linhas',
    copyFiltered: 'Copiar linhas filtradas',
    copied: 'Copiado!',
    colLine: '#',
    colTime: 'Hora',
    colLevel: 'Nível',
    colSource: 'Origem',
    colMessage: 'Mensagem',
    emptyInput: 'Cole um log acima para começar.',
    noResults: 'Nenhuma linha corresponde aos filtros atuais.',
    detailRaw: 'Linha original',
    detailJson: 'Objeto JSON',
    sourceTitle: 'Código-fonte do parser',
    howTitle: 'Como o parser classifica as linhas',
    howDesc: (
      <>
        Cada linha passa por três tentativas, na ordem: (1) prefixo de container do
        Compose; (2) <Text code>JSON.parse</Text> — cobre o
        <Text code> docker json-file</Text> (<Text code>log</Text>/<Text code>time</Text>)
        e o pino/bunyan (<Text code>level</Text>/<Text code>time</Text>/<Text code>msg</Text>,
        com nível numérico de 10 a 60); (3) texto puro, procurando timestamp ISO,
        <Text code> YYYY-MM-DD HH:MM:SS</Text>, syslog ou só hora, e um token de nível
        no início (<Text code>[ERROR]</Text>, <Text code>WARN:</Text>…). Linhas sem
        nível reconhecido caem em <Text code>Sem nível</Text> em vez de sumir. Para
        renderizar as cores ANSI do terminal use <Text code>/devops/ansi-colors</Text>;
        para estimar o custo de reter esse log use{' '}
        <Text code>/tools/log-storage-cost-calculator</Text>.
      </>
    ),
  },
  en: {
    title: 'Log Explorer',
    intro: (
      <>
        Paste a plain-text or JSON log — output from <Text code>docker compose</Text>,{' '}
        <Text code>docker logs</Text>, <Text code>kubectl logs</Text>, pm2, journalctl
        or your own app — and see every line classified by <Text code>level</Text>,
        timestamp and origin (container). Filter by level and service, search by text
        or regex and watch the distribution over time on a timeline. The parser
        understands Compose prefixes (<Text code>api-1 | ...</Text>),{' '}
        <Text code>docker json-file</Text> and pino/bunyan JSON lines
        (<Text code>{'{"level":30,"msg":...}'}</Text>) and the plain format with
        <Text code> [INFO]</Text> at the start. Everything runs in the browser —
        nothing is sent.
      </>
    ),
    inputTitle: 'Input log',
    inputPlaceholder: 'Paste the log lines here...',
    sampleDocker: 'Docker Compose sample',
    sampleJson: 'JSON sample (pino)',
    clear: 'Clear',
    filtersTitle: 'Filters',
    levelLabel: 'Level',
    sourceLabel: 'Source',
    searchPlaceholder: 'Search in the message or raw line...',
    regexLabel: 'Regex',
    regexInvalid: 'Invalid regular expression — the search filter was ignored.',
    clearFilters: 'Clear filters',
    summaryTitle: 'Summary',
    totalLines: 'Lines',
    withTimestamp: 'With timestamp',
    truncated: 'The log is too long: only the first 20,000 lines were processed.',
    timelineTitle: 'Timeline',
    timelineEmpty:
      'No lines with a recognized timestamp — not enough data for the timeline. Parsing still shows the level and message of each line.',
    eachBar: 'each bar ≈',
    resultsTitle: 'Lines',
    copyFiltered: 'Copy filtered lines',
    copied: 'Copied!',
    colLine: '#',
    colTime: 'Time',
    colLevel: 'Level',
    colSource: 'Source',
    colMessage: 'Message',
    emptyInput: 'Paste a log above to get started.',
    noResults: 'No line matches the current filters.',
    detailRaw: 'Original line',
    detailJson: 'JSON object',
    sourceTitle: 'Parser source code',
    howTitle: 'How the parser classifies lines',
    howDesc: (
      <>
        Each line goes through three attempts, in order: (1) Compose container
        prefix; (2) <Text code>JSON.parse</Text> — covers{' '}
        <Text code>docker json-file</Text> (<Text code>log</Text>/<Text code>time</Text>)
        and pino/bunyan (<Text code>level</Text>/<Text code>time</Text>/<Text code>msg</Text>,
        with numeric level from 10 to 60); (3) plain text, looking for an ISO
        timestamp, <Text code>YYYY-MM-DD HH:MM:SS</Text>, syslog or time-only, plus a
        level token at the start (<Text code>[ERROR]</Text>, <Text code>WARN:</Text>…).
        Lines with no recognized level fall into <Text code>No level</Text> instead of
        disappearing. To render terminal ANSI colors use{' '}
        <Text code>/devops/ansi-colors</Text>; to estimate the cost of retaining this
        log use <Text code>/tools/log-storage-cost-calculator</Text>.
      </>
    ),
  },
}

const preStyle = {
  margin: 0,
  padding: 12,
  background: 'rgba(0,0,0,0.03)',
  borderRadius: 8,
  overflow: 'auto',
  fontSize: 12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
}

function bucketTitle(bucket) {
  return formatDateTime(bucket.start) + ' — ' + bucket.total
}

export default function LogExplorerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState(SAMPLE_DOCKER)
  const [selectedLevels, setSelectedLevels] = useState([])
  const [selectedSources, setSelectedSources] = useState([])
  const [query, setQuery] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => parseLogs(text), [text])
  const stats = useMemo(() => summarize(parsed.entries), [parsed])
  const timeline = useMemo(() => buildTimeline(parsed.entries), [parsed])

  const presentLevels = useMemo(
    () => LEVELS.filter((l) => stats.counts[l] > 0),
    [stats],
  )
  const sources = useMemo(() => {
    const set = new Set()
    for (const entry of parsed.entries) if (entry.source) set.add(entry.source)
    return Array.from(set).sort()
  }, [parsed])

  const regexError = useMemo(() => {
    if (!useRegex || !query) return null
    try {
      // eslint-disable-next-line no-new
      new RegExp(query)
      return null
    } catch (e) {
      return e.message
    }
  }, [query, useRegex])

  const filtered = useMemo(() => {
    let re = null
    if (query && !regexError) {
      re = useRegex ? new RegExp(query, 'i') : null
    }
    const q = query.toLowerCase()
    return parsed.entries.filter((entry) => {
      if (selectedLevels.length > 0 && !selectedLevels.includes(entry.level)) return false
      if (selectedSources.length > 0) {
        if (!entry.source || !selectedSources.includes(entry.source)) return false
      }
      if (query && !regexError) {
        if (re) {
          if (!re.test(entry.raw)) return false
        } else if (
          !entry.message.toLowerCase().includes(q) &&
          !entry.raw.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [parsed, selectedLevels, selectedSources, query, useRegex, regexError])

  const hasText = text.trim().length > 0

  const clearFilters = () => {
    setSelectedLevels([])
    setSelectedSources([])
    setQuery('')
    setUseRegex(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(filtered.map((entry) => entry.raw).join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const columns = [
    {
      title: t.colLine,
      dataIndex: 'line',
      key: 'line',
      width: 70,
      render: (line) => <Text type="secondary">{line}</Text>,
    },
    {
      title: t.colTime,
      dataIndex: 'time',
      key: 'time',
      width: 150,
      render: (time, record) => {
        if (time != null) {
          return <Text code>{formatTime(time)}</Text>
        }
        return record.timeText ? (
          <Text type="secondary">{record.timeText}</Text>
        ) : (
          <Text type="secondary">—</Text>
        )
      },
    },
    {
      title: t.colLevel,
      dataIndex: 'level',
      key: 'level',
      width: 110,
      render: (level) => <Tag color={LEVEL_TAG[level]}>{LEVEL_LABELS[level][lang]}</Tag>,
    },
    {
      title: t.colSource,
      dataIndex: 'source',
      key: 'source',
      width: 130,
      render: (source) => (source ? <Text code>{source}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: t.colMessage,
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{message}</Text>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ProfileOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Input.TextArea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space wrap style={{ marginTop: 8 }}>
          <Button icon={<ExperimentOutlined />} onClick={() => setText(SAMPLE_DOCKER)}>
            {t.sampleDocker}
          </Button>
          <Button icon={<ExperimentOutlined />} onClick={() => setText(SAMPLE_JSON)}>
            {t.sampleJson}
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setText('')}>
            {t.clear}
          </Button>
        </Space>
      </Card>

      <Card title={t.filtersTitle} extra={<Button size="small" onClick={clearFilters}>{t.clearFilters}</Button>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="middle" align="center">
            <Text strong>{t.levelLabel}:</Text>
            <Checkbox.Group
              value={selectedLevels}
              onChange={setSelectedLevels}
              options={presentLevels.map((level) => ({
                value: level,
                label: (
                  <span>
                    <Tag color={LEVEL_TAG[level]} style={{ marginRight: 4 }}>
                      {LEVEL_LABELS[level][lang]}
                    </Tag>
                    <Text type="secondary">{stats.counts[level]}</Text>
                  </span>
                ),
              }))}
            />
          </Space>
          {sources.length > 0 && (
            <Space wrap size="middle" align="center">
              <Text strong>{t.sourceLabel}:</Text>
              <Checkbox.Group value={selectedSources} onChange={setSelectedSources}>
                {sources.map((source) => (
                  <Checkbox key={source} value={source}>
                    <Text code>{source}</Text>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Space>
          )}
          <Space wrap size="middle" align="center">
            <Input
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{ width: 320 }}
            />
            <Checkbox checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)}>
              {t.regexLabel}
            </Checkbox>
          </Space>
          {regexError && <Alert type="warning" showIcon message={t.regexInvalid} />}
        </Space>
      </Card>

      <Card title={t.summaryTitle}>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.totalLines} value={stats.total} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.withTimestamp} value={stats.withTime} suffix={'/ ' + stats.total} />
          </Col>
          {presentLevels.map((level) => (
            <Col xs={12} sm={8} md={4} key={level}>
              <Statistic
                title={LEVEL_LABELS[level][lang]}
                value={stats.counts[level]}
                valueStyle={{ color: LEVEL_COLORS[level] }}
              />
            </Col>
          ))}
        </Row>
        {parsed.truncated && (
          <Alert style={{ marginTop: 12 }} type="info" showIcon message={t.truncated} />
        )}
      </Card>

      <Card title={<span><ClockCircleOutlined /> {t.timelineTitle}</span>}>
        {!timeline ? (
          <Alert type="info" showIcon message={t.timelineEmpty} />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                height: 96,
                padding: '0 2px',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {timeline.buckets.map((bucket, index) => (
                <div
                  key={index}
                  title={bucketTitle(bucket)}
                  style={{
                    flex: 1,
                    minWidth: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                  }}
                >
                  {LEVELS.map((level) =>
                    bucket.counts[level] > 0 ? (
                      <div
                        key={level}
                        style={{
                          height: (bucket.counts[level] / timeline.maxTotal) * 100 + '%',
                          background: LEVEL_COLORS[level],
                        }}
                      />
                    ) : null,
                  )}
                </div>
              ))}
            </div>
            <Row justify="space-between" style={{ marginTop: 4 }}>
              <Text type="secondary">{formatDateTime(timeline.min)}</Text>
              <Text type="secondary">
                {t.eachBar} {formatInterval(timeline.interval)}
              </Text>
              <Text type="secondary">{formatDateTime(timeline.max)}</Text>
            </Row>
            <Space wrap style={{ marginTop: 8 }}>
              {presentLevels.map((level) => (
                <span key={level}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: LEVEL_COLORS[level],
                      marginRight: 6,
                    }}
                  />
                  {LEVEL_LABELS[level][lang]} ({stats.counts[level]})
                </span>
              ))}
            </Space>
          </>
        )}
      </Card>

      <Card
        title={t.resultsTitle}
        extra={
          <Button
            icon={<CopyOutlined />}
            disabled={filtered.length === 0}
            onClick={handleCopy}
          >
            {copied ? t.copied : t.copyFiltered}
          </Button>
        }
      >
        {!hasText ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.emptyInput} />
        ) : filtered.length === 0 ? (
          <Alert type="warning" showIcon message={t.noResults} />
        ) : (
          <Table
            rowKey="line"
            size="small"
            columns={columns}
            dataSource={filtered}
            pagination={filtered.length > 50 ? { pageSize: 50, showSizeChanger: false } : false}
            scroll={{ x: 'max-content' }}
            expandable={{
              expandedRowRender: (record) => (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>{t.detailRaw}</Text>
                  <pre style={preStyle}>{record.raw}</pre>
                  {record.json && (
                    <>
                      <Text strong>{t.detailJson}</Text>
                      <pre style={preStyle}>{JSON.stringify(record.json, null, 2)}</pre>
                    </>
                  )}
                </Space>
              ),
            }}
          />
        )}
      </Card>

      <Alert type="info" showIcon message={t.howTitle} description={t.howDesc} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre style={preStyle}>
                <code>{SOURCE_CODE}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
