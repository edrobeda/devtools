import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  Alert,
  Segmented,
  Collapse,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import {
  SwapOutlined,
  GlobalOutlined,
  CopyOutlined,
  CheckOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { convertAll, getEngineSource, SAMPLES } from '../utils/punycode'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Conversor IDN / Punycode',
    intro: 'Converte nomes de domínio entre a forma legível com caracteres Unicode (acentos, emoji, scripts CJK/árabe etc.) e a forma ASCII que o DNS realmente aceita (punycode do RFC 3492, prefixo xn--). Algoritmo implementado do zero, 100% no navegador.',
    inputTitle: 'Entrada — um domínio por linha',
    inputPlaceholder: 'Ex.: münchen.de  (ou xn--mnchen-3ya.de)',
    dirToAscii: 'Unicode → ASCII (xn--)',
    dirToUnicode: 'ASCII (xn--) → Unicode',
    presetUnicode: 'Exemplos Unicode',
    presetPuny: 'Exemplos punycode (xn--)',
    clear: 'Limpar',
    copy: 'Copiar resultado',
    copied: 'Copiado!',
    outputTitle: 'Resultado',
    outputEmpty: 'Sem linhas válidas ainda — cole domínios na entrada.',
    infoTitle: 'O que acontece aqui',
    infoBody: 'Cada rótulo (label) separado por ponto é convertido independentemente: rótulos com caracteres fora do ASCII viram punycode e ganham o prefixo xn--; rótulos ASCII comuns (incluindo IPs) passam intactos. A entrada é normalizada para NFC + minúsculas antes de codificar (DNS ignora maiúsc./minúsc.). A porta e o ponto final são preservados. Nada sai do navegador.',
    statDomains: 'Domínios',
    statErrors: 'Com erro',
    statConverted: 'Rótulos convertidos',
    colInput: 'De (entrada)',
    colOutput: 'Para (saída)',
    colLabels: 'Rótulos',
    colWarnings: 'Avisos',
    rowLabelsTitle: (from, to) => `${from} → ${to}`,
    noWarnings: '—',
    kindEncoded: 'codificado',
    kindDecoded: 'decodificado',
    kindAscii: 'ascii',
    kindUnchanged: 'inalterado',
    errorTag: 'erro',
    warningTag: 'aviso',
    labelLegend: 'Legenda dos rótulos:',
    errorMsg: {
      whitespace: 'Não pode conter espaços — use um domínio por linha.',
      slashes: 'Informe só o domínio (sem https://, barras, ? ou #).',
      empty: 'Linha vazia.',
      emptylabel: 'Rótulo vazio (pontos duplos ou domínio começando/terminando em ".").',
      badchars: 'Caractere inválido para um host neste modo.',
      toolong: 'Rótulo resultante ultrapassa 63 caracteres (limite do DNS).',
      nonascii: 'No modo ASCII → Unicode a entrada precisa ser ASCII; converta o domínio antes.',
      badencode: 'Sequência xn-- inválida — o algoritmo não conseguiu decodificar.',
    },
    warningMsg: {
      labellen: (label) => `Rótulo "${label.length > 24 ? `${label.slice(0, 24)}…` : label}" com ${label.length} caracteres (limite: 63).`,
      domainlen: (len) => `Domínio inteiro com ${len} caracteres (limite: 253).`,
      plainascii: 'Tudo já é ASCII — nada a converter.',
      lowercased: 'Rótulo(s) somente-ASCII convertido(s) para minúsculas (DNS é case-insensitive).',
    },
    sourceTitle: 'Como funciona (motor — RFC 3492)',
    refTitle: 'Referência rápida',
    refItems: [
      { k: 'ace', t: 'Prefix xn--', d: 'O DNS só aceita ASCII; cada rótulo não-ASCII vira xn-- + codificação punycode do RFC 3492.' },
      { k: 'base36', t: 'Base-36', d: 'O algoritmo serializa os caracteres em dígitos a–z e 0–9, com bias adaptativo pra comprimir tamanhos típicos (os primeiros dígitos absorvem quase toda a variação).' },
      { k: 'len', t: 'Limites', d: '63 caracteres por rótulo e 253 para o domínio inteiro (contando os pontos e o prefixo xn--).' },
      { k: 'case', t: 'Case-insensitive', d: 'DNS ignora maiúsc./minúsc.; a entrada é normalizada pra NFC + minúsculas antes de codificar.' },
      { k: 'idna', t: 'IDNA vs punycode', d: 'Punycode é só a codificação; o mapeamento completo de caracteres especiais (ß/ẞ, fullwidth etc.) é o UTS 46 usado por registradores. Aqui aplicamos NFC + minúsculas — suficiente para a maioria dos casos.' },
    ],
  },
  en: {
    title: 'IDN / Punycode Converter',
    intro: 'Converts domain names between the readable Unicode form (accents, emoji, CJK/Arabic scripts etc.) and the ASCII form DNS actually accepts (RFC 3492 punycode, xn-- prefix). Algorithm implemented from scratch, 100% in the browser.',
    inputTitle: 'Input — one domain per line',
    inputPlaceholder: 'e.g. münchen.de  (or xn--mnchen-3ya.de)',
    dirToAscii: 'Unicode → ASCII (xn--)',
    dirToUnicode: 'ASCII (xn--) → Unicode',
    presetUnicode: 'Unicode samples',
    presetPuny: 'Punycode samples (xn--)',
    clear: 'Clear',
    copy: 'Copy result',
    copied: 'Copied!',
    outputTitle: 'Result',
    outputEmpty: 'No valid lines yet — paste domains in the input.',
    infoTitle: 'What happens here',
    infoBody: 'Each label (separated by dots) is converted independently: labels with non-ASCII characters turn into punycode with the xn-- prefix; ordinary ASCII labels (including IPs) pass through unchanged. Input is normalized to NFC + lowercase before encoding (DNS is case-insensitive). Ports and the trailing dot are preserved. Nothing leaves the browser.',
    statDomains: 'Domains',
    statErrors: 'With errors',
    statConverted: 'Labels converted',
    colInput: 'From (input)',
    colOutput: 'To (output)',
    colLabels: 'Labels',
    colWarnings: 'Warnings',
    rowLabelsTitle: (from, to) => `${from} → ${to}`,
    noWarnings: '—',
    kindEncoded: 'encoded',
    kindDecoded: 'decoded',
    kindAscii: 'ascii',
    kindUnchanged: 'unchanged',
    errorTag: 'error',
    warningTag: 'warning',
    labelLegend: 'Label legend:',
    errorMsg: {
      whitespace: 'Cannot contain spaces — use one domain per line.',
      slashes: 'Provide only the domain (no https://, slashes, ? or #).',
      empty: 'Empty line.',
      emptylabel: 'Empty label (double dots or a domain starting/ending with ".").',
      badchars: 'Invalid character for a host in this mode.',
      toolong: 'Resulting label exceeds 63 characters (DNS limit).',
      nonascii: 'In ASCII → Unicode mode the input must be ASCII; convert the domain first.',
      badencode: 'Invalid xn-- sequence — the algorithm could not decode it.',
    },
    warningMsg: {
      labellen: (label) => `Label "${label.length > 24 ? `${label.slice(0, 24)}…` : label}" has ${label.length} characters (limit: 63).`,
      domainlen: (len) => `Whole domain has ${len} characters (limit: 253).`,
      plainascii: 'Everything is already ASCII — nothing to convert.',
      lowercased: 'ASCII-only label(s) converted to lowercase (DNS is case-insensitive).',
    },
    sourceTitle: 'Under the hood (engine — RFC 3492)',
    refTitle: 'Quick reference',
    refItems: [
      { k: 'ace', t: 'xn-- prefix', d: 'DNS only accepts ASCII; each non-ASCII label becomes xn-- + the RFC 3492 punycode encoding.' },
      { k: 'base36', t: 'Base-36', d: 'The algorithm serializes code points into a–z / 0–9 digits with biased adaptation to compress typical sizes (the first digits absorb most of the length variation).' },
      { k: 'len', t: 'Limits', d: '63 characters per label and 253 for the whole domain (counting dots and the xn-- prefix).' },
      { k: 'case', t: 'Case-insensitive', d: 'DNS ignores case; input is normalized to NFC + lowercase before encoding.' },
      { k: 'idna', t: 'IDNA vs punycode', d: 'Punycode is just the encoding; the full mapping of special characters (ß/ẞ, fullwidth, etc.) is the UTS 46 that registries use. Here we apply NFC + lowercase — enough for most cases.' },
    ],
  },
}

// Cor da Tag de cada tipo de rótulo.
const KIND_STYLE = {
  encoded: 'blue',
  decoded: 'green',
  ascii: 'default',
  unchanged: 'default',
}

export default function IdnPunycodeConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [direction, setDirection] = useState('toAscii')
  const [input, setInput] = useState('münchen.de\ncafé.example.com\n💩.la')
  const [copied, setCopied] = useState(false)

  const state = useMemo(() => convertAll(input, direction), [input, direction])

  const handleCopy = async () => {
    if (!state.output) return
    try {
      await navigator.clipboard.writeText(state.output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const applySample = (dir) => {
    setDirection(dir)
    setInput(dir === 'toAscii' ? SAMPLES.toAscii : SAMPLES.toUnicode)
    setCopied(false)
  }

  const columns = [
    {
      title: t.colInput,
      dataIndex: 'input',
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: '',
      width: 40,
      render: () => <ArrowRightOutlined style={{ color: '#bfbfbf' }} />,
    },
    {
      title: t.colOutput,
      dataIndex: 'output',
      render: (v, row) =>
        row.error ? (
          <Tag color="red" icon={<WarningOutlined />}>{t.errorTag}: {t.errorMsg[row.error] || row.error}</Tag>
        ) : (
          <Text code style={{ wordBreak: 'break-all' }}>{v}</Text>
        ),
    },
    {
      title: t.colLabels,
      dataIndex: 'labels',
      render: (labels) => (
        <Space direction="vertical" size={2}>
          {labels.map((l, i) => (
            <span key={i}>
              <Text type="secondary" style={{ fontSize: 12 }}>{l.from}</Text>
              {' → '}
              <Text style={{ fontSize: 12 }}>{l.to}</Text>{' '}
              <Tag color={KIND_STYLE[l.kind] || 'default'} style={{ fontSize: 10, lineHeight: '16px', marginLeft: 2 }}>
                {l.kind === 'encoded' ? t.kindEncoded : l.kind === 'decoded' ? t.kindDecoded : l.kind === 'ascii' ? t.kindAscii : t.kindUnchanged}
              </Tag>
            </span>
          ))}
        </Space>
      ),
    },
    {
      title: t.colWarnings,
      dataIndex: 'warnings',
      width: 220,
      render: (warnings) =>
        warnings && warnings.length ? (
          <Space direction="vertical" size={2}>
            {warnings.map((w, i) => {
              const msg = t.warningMsg[w.code]
                ? typeof t.warningMsg[w.code] === 'function'
                  ? t.warningMsg[w.code](w.label || w.len)
                  : t.warningMsg[w.code]
                : w.code
              return (
                <Tooltip key={i} title={msg}>
                  <Tag color="orange" style={{ fontSize: 11, lineHeight: '16px', marginInlineEnd: 0 }}>
                    {t.warningTag}: {w.code}
                  </Tag>
                </Tooltip>
              )
            })}
          </Space>
        ) : (
          <Text type="secondary">{t.noWarnings}</Text>
        ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented
            block
            value={direction}
            onChange={(v) => { setDirection(v); setCopied(false) }}
            options={[
              { label: <span><SwapOutlined /> {t.dirToAscii}</span>, value: 'toAscii' },
              { label: <span>{t.dirToUnicode}</span>, value: 'toUnicode' },
            ]}
          />
          <Input.TextArea
            rows={6}
            value={input}
            onChange={(e) => { setInput(e.target.value); setCopied(false) }}
            placeholder={t.inputPlaceholder}
            style={{ fontFamily: 'monospace' }}
          />
          <Space size={[8, 8]} wrap>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => applySample('toAscii')}>
              {t.presetUnicode}
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => applySample('toUnicode')}>
              {t.presetPuny}
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setInput('')}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      <Alert type="info" message={t.infoTitle} description={t.infoBody} showIcon />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card><Statistic title={t.statDomains} value={state.total} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t.statConverted} value={state.labelsConverted} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t.statErrors} value={state.errors} valueStyle={state.errors ? { color: '#cf1322' } : undefined} /></Card>
        </Col>
      </Row>

      <Card
        title={t.outputTitle}
        extra={
          <Button
            type="primary"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            disabled={!state.output}
          >
            {copied ? t.copied : t.copy}
          </Button>
        }
      >
        <Input.TextArea
          rows={6}
          readOnly
          value={state.output}
          placeholder={t.outputEmpty}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <Card title={t.labelLegend}>
        <Space size="middle" wrap>
          <span><Tag color="blue">{t.kindEncoded}</Tag></span>
          <span><Tag color="green">{t.kindDecoded}</Tag></span>
          <span><Tag>{t.kindUnchanged}</Tag></span>
        </Space>
        <Table
          style={{ marginTop: 12 }}
          rowKey={(row, i) => i}
          size="small"
          columns={columns}
          dataSource={state.results}
          pagination={false}
          scroll={{ x: 720 }}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}><code>{getEngineSource()}</code></pre>
            ),
          },
          {
            key: 'ref',
            label: t.refTitle,
            children: (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {t.refItems.map((r) => (
                  <div key={r.k}>
                    <Text strong>{r.t}.</Text> <Text type="secondary">{r.d}</Text>
                  </div>
                ))}
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}