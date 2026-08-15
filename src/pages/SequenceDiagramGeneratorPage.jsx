import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Alert, Collapse, message, Row, Col,
} from 'antd'
import {
  ProjectOutlined, CopyOutlined, DownloadOutlined, PlusOutlined, MinusOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildSvg,
  parseSource,
  PRESETS,
  DEFAULT_SOURCE,
} from '../utils/sequenceDiagramGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { useMessage } = message

const translations = {
  pt: {
    title: 'Gerador de Diagrama de Sequência',
    intro: (
      <>Desenhe diagramas de sequência UML a partir de texto simples. Defina participantes, envie mensagens, adicione notas e marque ativações — tudo renderizado em SVG pronto para copiar ou baixar. 100% client-side, nada sai do navegador.</>
    ),
    inputTitle: 'Texto do diagrama',
    previewTitle: 'Preview SVG',
    outputsTitle: 'SVG gerado',
    presetsTitle: 'Exemplos de um clique',
    syntaxTitle: 'Sintaxe rápida',
    syntaxBody: (
      <>
        <Text code>participant Nome</Text> declara um ator.{' '}
        <Text code>A -&gt; B: texto</Text> envia uma mensagem sólida; use{' '}
        <Text code>--&gt;</Text> para tracejada e <Text code>-&gt;x</Text> para destruição.{' '}
        <Text code>Note over A: texto</Text> ou <Text code>Note over A,B: texto</Text> cria uma nota.{' '}
        <Text code>activate A</Text> / <Text code>deactivate A</Text> desenham a barra de ativação.
      </>
    ),
    copy: 'Copiar SVG',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    download: 'Baixar .svg',
    emptyError: 'O diagrama está vazio ou não possui participantes.',
    stats: (p, m) => `${p} participante(s), ${m} mensagem(ns)`,
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/sequenceDiagramGenerator.js. parseSource tokeniza as linhas em eventos, buildDiagram calcula o layout (posições X/Y, lifelines e ativações) e buildSvg monta o SVG final com setas, cabeçalhos e notas.',
  },
  en: {
    title: 'Sequence Diagram Generator',
    intro: (
      <>Draw UML sequence diagrams from plain text. Define participants, send messages, add notes and mark activations — all rendered as copy-or-download-ready SVG. 100% client-side, nothing leaves the browser.</>
    ),
    inputTitle: 'Diagram text',
    previewTitle: 'SVG preview',
    outputsTitle: 'Generated SVG',
    presetsTitle: 'One-click presets',
    syntaxTitle: 'Quick syntax',
    syntaxBody: (
      <>
        <Text code>participant Name</Text> declares an actor.{' '}
        <Text code>A -&gt; B: text</Text> sends a solid message; use{' '}
        <Text code>--&gt;</Text> for dashed and <Text code>-&gt;x</Text> for destruction.{' '}
        <Text code>Note over A: text</Text> or <Text code>Note over A,B: text</Text> creates a note.{' '}
        <Text code>activate A</Text> / <Text code>deactivate A</Text> draws the activation bar.
      </>
    ),
    copy: 'Copy SVG',
    copied: 'Copied!',
    copyError: 'Could not copy',
    download: 'Download .svg',
    emptyError: 'The diagram is empty or has no participants.',
    stats: (p, m) => `${p} participant(s), ${m} message(s)`,
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/sequenceDiagramGenerator.js. parseSource tokenizes lines into events, buildDiagram computes the layout (X/Y positions, lifelines and activations) and buildSvg assembles the final SVG with arrows, headers and notes.',
  },
}

export default function SequenceDiagramGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [source, setSource] = useState(DEFAULT_SOURCE)
  const [fontSize, setFontSize] = useState(14)

  const result = useMemo(() => buildSvg(source), [source])
  const parsed = useMemo(() => parseSource(source), [source])

  const messageCount = parsed.events.filter((e) => e.type === 'message').length

  const copySvg = async () => {
    if (!result.svg) return
    try {
      await navigator.clipboard.writeText(result.svg)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const downloadSvg = () => {
    if (!result.svg) return
    const blob = new Blob([result.svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sequence-diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyPreset = (key) => setSource(PRESETS[key].source)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ProjectOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.syntaxTitle} description={t.syntaxBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={t.inputTitle}>
            <TextArea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              rows={16}
              style={{ fontFamily: 'monospace', fontSize }}
            />
            <Space style={{ marginTop: 12 }}>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              />
              <Button
                size="small"
                icon={<MinusOutlined />}
                onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>font-size: {fontSize}px</Text>
            </Space>
          </Card>

          <Card title={t.presetsTitle} style={{ marginTop: 24 }}>
            <Space size={[8, 8]} wrap>
              {Object.entries(PRESETS).map(([key, p]) => (
                <Button key={key} size="small" onClick={() => applyPreset(key)}>
                  {lang === 'pt' ? p.label : p.enLabel}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={t.previewTitle}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {result.error ? '—' : t.stats(result.participants.length, messageCount)}
              </Text>
            }
          >
            {result.error ? (
              <Alert type="warning" message={t.emptyError} description={result.error} />
            ) : (
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  overflow: 'auto',
                  background: '#fafafa',
                  minHeight: 200,
                  maxHeight: 520,
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: result.svg }}
              />
            )}
          </Card>

          <Card
            title={t.outputsTitle}
            style={{ marginTop: 24 }}
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={copySvg}
                  disabled={!result.svg}
                >
                  {t.copy}
                </Button>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={downloadSvg}
                  disabled={!result.svg}
                >
                  {t.download}
                </Button>
              </Space>
            }
          >
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                maxHeight: 260,
                fontSize: 12,
                background: '#fafafa',
                padding: '8px 10px',
                borderRadius: 6,
              }}
            >
              <code>{result.svg || ''}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — parseSource / buildDiagram / buildSvg`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320, fontSize: 12 }}>
                  <code>{`import { buildSvg, parseSource, PRESETS, DEFAULT_SOURCE } from '../utils/sequenceDiagramGenerator'

const result = buildSvg(sourceText)
// result.svg, result.width, result.height, result.participants, result.rows`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
