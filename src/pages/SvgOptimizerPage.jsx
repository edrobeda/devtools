import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Switch, Select, Alert, Collapse, Row, Col, Tag, Button, message, Input } from 'antd'
import { UploadOutlined, ClearOutlined, CopyOutlined, DownloadOutlined, CompressOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { optimizeSvg } from '../utils/svgOptimizer'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Ícone exportado do Inkscape para teste -->
<svg
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   width="32" height="32" viewBox="0 0 32 32">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://web.resource.org/cc/">
      <cc:Work>
        <dc:format>image/svg+xml</dc:format>
        <dc:title>exemplo de otimizacao</dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style="stop-color: #1677ff; " />
      <stop offset="1" style="stop-color: #52c41a;" />
    </linearGradient>
  </defs>
  <g>
    <g>
      <rect x="0.0000000" y="0.0000000" width="32.0000000" height="32.0000000" rx="6.0000001" fill="url(#grad)" />
    </g>
  </g>
  <g>
    <path d="M 8.00000001 8.00000001 L 24 8 L 24 24 L 8 24 Z" fill="none" stroke="#ffffff" stroke-width="2" />
    <circle cx="16.00000001" cy="16.00000001" r="4.0000001" fill="#ffffff" />
  </g>
  <g/>
</svg>
`

const PRECISION_OPTIONS = [
  { label: 'off', value: -1 },
  { label: '0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
]

const DEFAULT_OPTS = {
  comments: true,
  whitespace: true,
  editor: true,
  empty: true,
  groups: true,
  precision: 2,
}

const translations = {
  pt: {
    title: 'Otimizador de SVG',
    intro: 'Cole um arquivo .svg exportado do Inkscape, Illustrator, Figma ou baixado de um icon set e receba a versão mínima pronta pra subir em produção: comentários, metadata e elementos de editor removidos, espaços em branco minificados, grupos vazios eliminados e decimais intermináveis arredondados. Tudo 100% no navegador.',
    inputTitle: 'SVG de entrada',
    loadSample: 'Carregar exemplo',
    clear: 'Limpar',
    placeholder: 'Cole aqui o código SVG (arquivo .svg, não um componente React). Ex.: saída do Inkscape, ícone do Figma/Illustrator…',
    optionsTitle: 'Otimizações',
    optComments: 'Remover comentários (<!-- … -->)',
    optWhitespace: 'Remover espaços em branco e minificar atributo style',
    optEditor: 'Remover metadata e elementos de editor (Inkscape, Illustrator, RDF…)',
    optEmpty: 'Remover elementos vazios (sem atributos e sem conteúdo)',
    optGroups: 'Desembrulhar grupos sem atributos (<g> inúteis que só aninham)',
    precisionLabel: 'Precisão decimal',
    precisionOff: 'Não arredondar',
    precisionHint: 'Exportadores costumam escrever coordenadas com 8+ casas decimais — o que mais incha um SVG. Arredonde apenas o necessário (use 2 por padrão e 0 só se a arte tolerar).',
    resultTitle: 'Resultado',
    emptyState: 'Cole um SVG na caixa acima pra começar.',
    invalidError: 'Não consegui ler o conteúdo como SVG/XML válido. Confira se o documento está bem formado (tags fechadas, aspas corretas).',
    notSvg: 'A raiz do documento não é <svg> — o otimizador só processa arquivos SVG XML.',
    original: 'Original',
    optimized: 'Otimizado',
    saving: 'Economia',
    savedOf: (pct) => `~${pct}% menor`,
    rawOutput: 'SVG otimizado',
    preview: 'Pré-visualização',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    download: 'Baixar .svg',
    stComments: 'comentários',
    stWhitespace: 'nós de espaço',
    stEditor: 'metadata/editor',
    stEmpty: 'vazios removidos',
    stGroups: 'grupos desembrulhados',
    stRounded: 'atributos com números',
    noteTitle: 'O que isso faz — e o que NÃO faz',
    noteBody: 'Opera sobre o DOM do XML (parse via DOMParser, re-serialização via XMLSerializer), então nunca quebra marcação: só remove o que é seguro. Texto renderizado de <text>/<title>/<desc> e o conteúdo de <style> ficam intactos. Arredondar decimais altera levemente os valores — se a arte tiver coordenadas críticas, use precisão 3+ ou deixe desligada. Funciona em arquivo .svg; para converter ícones em componentes React use /tools/svg-to-jsx-converter.',
    sourceTitle: 'Como funciona — src/utils/svgOptimizer.js',
    sourceBody: 'Ordem das passadas: 1) remove comentários; 2) remove nós de texto só-espaço (fora de text/style); 3) remove metadata/namedview e elementos em namespaces de editor; 4) remove elementos vazios (pós-ordem); 5) desembrulha <g> sem atributos; 6) arredonda números em atributos de geometria/apresentação (com re-escritor que insere espaço entre números que encostariam após o round, mantendo o path válido); 7) minifica atributos style. O tamanho é medido em bytes UTF-8 (TextEncoder).',
    totalHint: (before, after) => `${(before / 1000).toFixed(1)} KB → ${(after / 1000).toFixed(1)} KB`,
  },
  en: {
    title: 'SVG Optimizer',
    intro: 'Paste a .svg file exported from Inkscape, Illustrator, Figma or downloaded from an icon set and get the minimal version ready for production: comments, metadata and editor elements stripped, whitespace minified, empty groups removed and endless decimals rounded. Everything runs 100% in the browser.',
    inputTitle: 'Input SVG',
    loadSample: 'Load sample',
    clear: 'Clear',
    placeholder: 'Paste the SVG code here (a .svg file, not a React component). E.g. an Inkscape export or a Figma/Illustrator icon…',
    optionsTitle: 'Optimizations',
    optComments: 'Remove comments (<!-- … -->)',
    optWhitespace: 'Remove whitespace and minify style attributes',
    optEditor: 'Remove metadata and editor elements (Inkscape, Illustrator, RDF…)',
    optEmpty: 'Remove empty elements (no attributes and no content)',
    optGroups: 'Unwrap attribute-less groups (useless nested <g>)',
    precisionLabel: 'Decimal precision',
    precisionOff: 'Do not round',
    precisionHint: 'Exporters usually write coordinates with 8+ decimal places — the #1 SVG bloat. Round only what you need (2 by default; 0 only if the artwork tolerates it).',
    resultTitle: 'Result',
    emptyState: 'Paste an SVG in the box above to get started.',
    invalidError: 'Could not read the content as a valid SVG/XML. Check that the document is well-formed (closed tags, correct quotes).',
    notSvg: 'The document root is not <svg> — the optimizer only processes XML SVG files.',
    original: 'Original',
    optimized: 'Optimized',
    saving: 'Savings',
    savedOf: (pct) => `~${pct}% smaller`,
    rawOutput: 'Optimized SVG',
    preview: 'Preview',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    download: 'Download .svg',
    stComments: 'comments',
    stWhitespace: 'whitespace nodes',
    stEditor: 'metadata/editor',
    stEmpty: 'empty removed',
    stGroups: 'groups unwrapped',
    stRounded: 'numeric attrs',
    noteTitle: 'What it does — and what it does NOT do',
    noteBody: 'It operates on the XML DOM (parsed with DOMParser, re-serialized with XMLSerializer), so it never breaks markup: only safe removals happen. Rendered text of <text>/<title>/<desc> and <style> contents are left untouched. Rounding decimals slightly changes values — if the artwork has critical coordinates, use 3+ precision or leave it off. Works on .svg files; to convert icons into React components use /tools/svg-to-jsx-converter.',
    sourceTitle: 'How it works — src/utils/svgOptimizer.js',
    sourceBody: 'Pass order: 1) remove comments; 2) remove whitespace-only text nodes (outside text/style); 3) remove metadata/namedview and elements in editor namespaces; 4) remove empty elements (post-order); 5) unwrap attribute-less <g>; 6) round numbers in geometry/presentation attributes (with a rewriter that inserts a space between numbers that would fuse after rounding, keeping the path valid); 7) minify style attributes. Sizes are measured as UTF-8 bytes (TextEncoder).',
    totalHint: (before, after) => `${(before / 1000).toFixed(1)} KB → ${(after / 1000).toFixed(1)} KB`,
  },
}

export default function SvgOptimizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [opts, setOpts] = useState(DEFAULT_OPTS)

  const setOpt = (key, value) => setOpts((prev) => ({ ...prev, [key]: value }))

  const result = useMemo(() => {
    if (!input.trim()) return null
    try {
      return optimizeSvg(input, {
        removeComments: opts.comments,
        removeWhitespace: opts.whitespace,
        removeEditor: opts.editor,
        removeEmpty: opts.empty,
        unwrapGroups: opts.groups,
        roundPrecision: opts.precision,
      })
    } catch (e) {
      if (e.message === 'empty') return null
      return { error: e.message === 'not-svg' ? 'not-svg' : 'invalid' }
    }
  }, [input, opts.comments, opts.whitespace, opts.editor, opts.empty, opts.groups, opts.precision])

  const copy = () => {
    if (!result || result.error || !result.svg) return
    navigator.clipboard.writeText(result.svg)
    message.success(t.copied)
  }

  function downloadSvg() {
    if (!result || result.error || !result.svg) return
    const blob = new Blob([result.svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const savingsPct =
    result && !result.error ? Math.max(0, Math.round(100 * (1 - result.sizeAfter / result.sizeBefore))) : 0

  const previewUri = useMemo(() => {
    const svg = result && !result.error ? result.svg : input
    if (!svg) return null
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [result, input])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CompressOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.noteTitle} description={t.noteBody} />

      <Card
        title={t.inputTitle}
        extra={
          <Space>
            <Button size="small" icon={<UploadOutlined />} onClick={() => setInput(SAMPLE)}>
              {t.loadSample}
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setInput('')}>
              {t.clear}
            </Button>
          </Space>
        }
      >
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Switch checked={opts.comments} onChange={(v) => setOpt('comments', v)} checkedChildren={t.optComments} unCheckedChildren={t.optComments} />
          <Switch checked={opts.whitespace} onChange={(v) => setOpt('whitespace', v)} checkedChildren={t.optWhitespace} unCheckedChildren={t.optWhitespace} />
          <Switch checked={opts.editor} onChange={(v) => setOpt('editor', v)} checkedChildren={t.optEditor} unCheckedChildren={t.optEditor} />
          <Switch checked={opts.empty} onChange={(v) => setOpt('empty', v)} checkedChildren={t.optEmpty} unCheckedChildren={t.optEmpty} />
          <Switch checked={opts.groups} onChange={(v) => setOpt('groups', v)} checkedChildren={t.optGroups} unCheckedChildren={t.optGroups} />
          <Space align="center" wrap>
            <Text strong>{t.precisionLabel}:</Text>
            <Select
              value={opts.precision}
              onChange={(v) => setOpt('precision', v)}
              options={PRECISION_OPTIONS.map((o) => ({
                label: o.value === -1 ? t.precisionOff : String(o.value),
                value: o.value,
              }))}
              style={{ width: 180 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.precisionHint}</Text>
          </Space>
        </Space>
      </Card>

      {!input.trim() && (
        <Card title={t.resultTitle}>
          <Paragraph type="secondary" style={{ margin: 0 }}>{t.emptyState}</Paragraph>
        </Card>
      )}

      {input.trim() && result && result.error && (
        <Card title={t.resultTitle}>
          <Alert
            type="warning"
            showIcon
            message={result.error === 'not-svg' ? t.notSvg : t.invalidError}
          />
        </Card>
      )}

      {input.trim() && result && !result.error && (
        <>
          <Card
            title={t.resultTitle}
            extra={
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={downloadSvg}>{t.download}</Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap>
                <Tag color="blue">{t.original}: {result.sizeBefore} B</Tag>
                <Tag color="green">{t.optimized}: {result.sizeAfter} B</Tag>
                <Tag color={savingsPct >= 10 ? 'gold' : 'default'}>{t.saving}: {savingsPct}%</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.totalHint(result.sizeBefore, result.sizeAfter)}
                </Text>
              </Space>
              <Space wrap>
                <Tag>{result.stats.comments} {t.stComments}</Tag>
                <Tag>{result.stats.whitespace} {t.stWhitespace}</Tag>
                <Tag>{result.stats.editor} {t.stEditor}</Tag>
                <Tag>{result.stats.empty} {t.stEmpty}</Tag>
                <Tag>{result.stats.unwrapped} {t.stGroups}</Tag>
                <Tag>{result.stats.rounded} {t.stRounded}</Tag>
              </Space>
              <Text strong>{t.rawOutput}</Text>
              <Input.TextArea
                value={result.svg}
                readOnly
                rows={12}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          </Card>

          {previewUri && (
            <Card title={t.preview}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size={6}>
                    <Text type="secondary">{t.original}</Text>
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: 12,
                        background: 'repeating-conic-gradient(#e7eaf0 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px',
                        textAlign: 'center',
                      }}
                    >
                      <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(input)}`} alt="original" style={{ maxWidth: '100%', maxHeight: 180 }} />
                    </div>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size={6}>
                    <Text type="secondary">{t.optimized}</Text>
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: 12,
                        background: 'repeating-conic-gradient(#e7eaf0 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px',
                        textAlign: 'center',
                      }}
                    >
                      <img src={previewUri} alt="optimized" style={{ maxWidth: '100%', maxHeight: 180 }} />
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}
        </>
      )}

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceTitle}`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 360 }}>
                  <code>{optimizeSvg.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}