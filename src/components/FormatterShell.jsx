import React, { useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Collapse, message } from 'antd'
import { CopyOutlined, CheckOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { TextArea } = Input

// Shell compartilhado das paginas de formatador (JSON, YAML, TOML, XML, CSS,
// SQL, HTML).
//
// Antes cada pagina trazia uma copia do mesmo esqueleto: Card de entrada com
// a area de texto monoespacada e os botoes, Alert de erro, Card de saida com
// o botao Copiar e o <pre> do resultado, o texto de "cole algo acima", o
// Alert de nota e o painel de codigo-fonte. O que muda entre as paginas e o
// parse/format de cada formato, as opcoes (indentacao, switches) e o bloco
// de traducao -- tudo isso continua na pagina.
//
// A copia tambem era reimplementada em 5 paginas (estado `copied` + timer de
// 1500ms + toast de erro). O shell mantem o comportamento exato de cada
// pagina: `copyMode="toast"` (JSON/XML, que avisam "Copiado" com toast) e
// `copyMode="state"` (as demais, que trocam o icone do botao por 1,5s).
//
// As linhas de controle do Card de entrada sao slots: `actions` (Formatar /
// Minificar), `extraRow` (linha propria extra -- no SQL, os botoes de
// exemplo) e `options` (indentacao, switches).

const OUTPUT_STYLES = {
  default: { margin: 0, overflowX: 'auto', maxHeight: 400, overflowY: 'auto' },
  mono: {
    margin: 0,
    overflowX: 'auto',
    maxHeight: 440,
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  tall: {
    margin: 0,
    overflow: 'auto',
    maxHeight: 480,
    fontFamily: 'monospace',
    fontSize: 13,
  },
}

const SOURCE_STYLES = {
  plain: { margin: 0, overflowX: 'auto' },
  mono: { margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 },
}

const COLLAPSE_SOURCE_STYLE = {
  margin: 0,
  overflowX: 'auto',
  fontFamily: 'monospace',
  fontSize: 13,
  maxHeight: 360,
  overflowY: 'auto',
}

export default function FormatterShell({
  icon,
  title,
  intro,
  input,
  onInputChange,
  placeholder,
  rows = 10,
  mono = false,
  inputLayout = 'stacked',
  inputTitle,
  inputExtra,
  inputActionsWrap = true,
  actions,
  extraRow,
  options,
  error = null,
  output = '',
  outputTitle,
  outputStyle = 'default',
  stats = null,
  copyLabel,
  copiedLabel,
  copyMode = 'state',
  copyToastText,
  copyError = null,
  emptyHint = null,
  hideEmptyHintOnError = true,
  note = null,
  source = null,
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!output) return
    if (copyMode === 'toast') {
      navigator.clipboard.writeText(output)
      message.success(copyToastText)
      return
    }
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      if (copyError) message[copyError.type || 'warning'](copyError.text)
    }
  }

  const copyButton =
    copyMode === 'toast' ? (
      <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
        {copyLabel}
      </Button>
    ) : (
      <Button
        type="primary"
        size="small"
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={handleCopy}
      >
        {copied ? copiedLabel : copyLabel}
      </Button>
    )

  const textArea = (
    <TextArea
      rows={rows}
      value={input}
      onChange={onInputChange}
      placeholder={placeholder}
      spellCheck={mono ? false : undefined}
      style={mono ? { fontFamily: 'monospace', fontSize: 13 } : { fontFamily: 'monospace' }}
    />
  )

  const inputCard =
    inputLayout === 'plain' ? (
      <Card>
        {textArea}
        <Space style={{ marginTop: 12 }} wrap={inputActionsWrap}>
          {actions}
        </Space>
      </Card>
    ) : (
      <Card title={inputTitle} extra={inputExtra}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {textArea}
          <Space wrap>{actions}</Space>
          {extraRow ? <Space wrap>{extraRow}</Space> : null}
          {options ? <Space wrap>{options}</Space> : null}
        </Space>
      </Card>
    )

  const errorAlert = error ? (
    <Alert type="error" showIcon message={error.title} description={error.description} />
  ) : null

  const outputCard = output ? (
    <Card title={outputTitle} extra={copyButton}>
      {stats}
      <pre style={OUTPUT_STYLES[outputStyle]}>
        <code>{output}</code>
      </pre>
    </Card>
  ) : null

  const hasHint = emptyHint !== null && emptyHint !== undefined
  const hint =
    !output && hasHint && !(error && hideEmptyHintOnError) ? emptyHint : null

  const noteAlert = note ? (
    <Alert
      type="info"
      showIcon
      message={note.title}
      description={note.description}
      style={note.style}
    />
  ) : null

  const sourceBlock = source ? (
    source.variant === 'collapse' ? (
      <Collapse
        items={[
          {
            key: 'source',
            label: source.label,
            children: (
              <pre style={COLLAPSE_SOURCE_STYLE}>
                <code>{source.text}</code>
              </pre>
            ),
          },
        ]}
      />
    ) : (
      <Card title={source.title}>
        <pre style={SOURCE_STYLES[source.style || 'mono']}>
          <code>{source.text}</code>
        </pre>
      </Card>
    )
  ) : null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>{icon} {title}</Title>
      <Paragraph type="secondary">{intro}</Paragraph>

      {inputCard}

      {errorAlert}

      {output ? outputCard : hint}

      {noteAlert}

      {sourceBlock}
    </Space>
  )
}
