import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, message, Row, Col,
  Input, Select, Slider, InputNumber, Tag,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildContainerCss,
  buildDemoHtml,
  buildBreakpointQuery,
  DEFAULT_CONTAINER,
  DEFAULT_BREAKPOINTS,
  CONTAINER_TYPES,
} from '../utils/containerQueryGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message
const { Option } = Select

const translations = {
  pt: {
    title: 'Gerador de CSS Container Queries',
    intro: (
      <>
        Monte regras de <Text code>@container</Text> visualmente: defina um container
        nomeado, escolha o tipo de medição e crie breakpoints que mudam o estilo de
        filhos conforme o <strong>tamanho do container</strong>, não da viewport.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Container queries permitem responsividade baseada no elemento-pai. Use{' '}
        <Text code>container-type: inline-size</Text> para medir a largura (caso mais comum),
        <Text code>size</Text> para largura e altura, ou <Text code>normal</Text> para nomear
        sem criar contexto de query. O container precisa ter dimensão definida
        (ex.: <Text code>width: 100%</Text> ou <Text code>resize: horizontal</Text>) para as queries
        funcionarem. O suporte é bom nos navegadores modernos, mas projetos antigos
        precisam de fallback com media queries.
      </>
    ),
    containerName: 'Nome do container',
    containerType: 'Tipo de container',
    inlineSize: 'inline-size (largura)',
    size: 'size (largura + altura)',
    normal: 'normal (só nome)',
    breakpoints: 'Breakpoints',
    addBreakpoint: 'Adicionar breakpoint',
    range: 'Faixa (px)',
    min: 'Min',
    max: 'Max',
    styles: 'Estilos',
    bg: 'Fundo',
    text: 'Texto',
    fontSize: 'Fonte (px)',
    padding: 'Padding (px)',
    gap: 'Gap (px)',
    radius: 'Radius (px)',
    direction: 'Direção',
    row: 'linha',
    column: 'coluna',
    preview: 'Pré-visualização',
    previewHint: 'Arraste o canto inferior direito do container para redimensioná-lo e ver as regras @container em ação.',
    output: 'CSS gerado',
    htmlOutput: 'HTML de exemplo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/containerQueryGenerator.js. buildContainerCss monta a regra do container e os blocos @container, enquanto buildBreakpointQuery formata cada faixa e seus estilos.',
  },
  en: {
    title: 'CSS Container Queries Generator',
    intro: (
      <>
        Build <Text code>@container</Text> rules visually: define a named container,
        choose the measurement type and create breakpoints that change children styles
        based on the <strong>container size</strong>, not the viewport.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        Container queries enable component-based responsiveness. Use{' '}
        <Text code>container-type: inline-size</Text> to measure width (most common),
        <Text code>size</Text> for width and height, or <Text code>normal</Text> to name
        without creating a query context. The container must have a defined size
        (e.g. <Text code>width: 100%</Text> or <Text code>resize: horizontal</Text>) for queries
        to work. Support is good in modern browsers, but older projects need a
        media-query fallback.
      </>
    ),
    containerName: 'Container name',
    containerType: 'Container type',
    inlineSize: 'inline-size (width)',
    size: 'size (width + height)',
    normal: 'normal (name only)',
    breakpoints: 'Breakpoints',
    addBreakpoint: 'Add breakpoint',
    range: 'Range (px)',
    min: 'Min',
    max: 'Max',
    styles: 'Styles',
    bg: 'Background',
    text: 'Text',
    fontSize: 'Font size (px)',
    padding: 'Padding (px)',
    gap: 'Gap (px)',
    radius: 'Radius (px)',
    direction: 'Direction',
    row: 'row',
    column: 'column',
    preview: 'Preview',
    previewHint: 'Drag the bottom-right corner of the container to resize it and see the @container rules in action.',
    output: 'Generated CSS',
    htmlOutput: 'Sample HTML',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/containerQueryGenerator.js. buildContainerCss builds the container rule and @container blocks, while buildBreakpointQuery formats each range and its styles.',
  },
}

function StyleField({ label, value, onChange, type = 'text', min = 0, max = 100 }) {
  if (type === 'select') {
    return (
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Select value={value} onChange={onChange} style={{ width: 120 }}>
          <Option value="row">row</Option>
          <Option value="column">column</Option>
        </Select>
      </Space>
    )
  }
  if (type === 'color') {
    return (
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 60, padding: 2 }}
        />
      </Space>
    )
  }
  return (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Text>{label}</Text>
      <InputNumber min={min} max={max} value={value} onChange={onChange} style={{ width: 80 }} />
    </Space>
  )
}

export default function ContainerQueryGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [container, setContainer] = useState(DEFAULT_CONTAINER)
  const [breakpoints, setBreakpoints] = useState(DEFAULT_BREAKPOINTS)
  const [previewWidth, setPreviewWidth] = useState(360)

  const cssOutput = useMemo(() => buildContainerCss(container, breakpoints), [container, breakpoints])
  const htmlOutput = useMemo(() => buildDemoHtml(container), [container])

  const updateContainer = (patch) => setContainer((prev) => ({ ...prev, ...patch }))

  const updateBreakpoint = (index, patch) => {
    setBreakpoints((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const updateBreakpointStyles = (index, patch) => {
    setBreakpoints((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], styles: { ...next[index].styles, ...patch } }
      return next
    })
  }

  const addBreakpoint = () => {
    const last = breakpoints[breakpoints.length - 1]
    const min = last && last.maxWidth != null ? last.maxWidth + 1 : 0
    setBreakpoints((prev) => [
      ...prev,
      { minWidth: min, maxWidth: null, styles: { ...DEFAULT_BREAKPOINTS[0].styles } },
    ])
  }

  const removeBreakpoint = (index) => {
    setBreakpoints((prev) => prev.filter((_, i) => i !== index))
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const typeLabel = {
    'inline-size': t.inlineSize,
    size: t.size,
    normal: t.normal,
  }

  const activeBpIndex = useMemo(() => {
    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]
      const min = bp.minWidth ?? 0
      const max = bp.maxWidth ?? Infinity
      if (previewWidth >= min && previewWidth <= max) return i
    }
    return -1
  }, [breakpoints, previewWidth])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.containerName} size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input
                value={container.name}
                onChange={(e) => updateContainer({ name: e.target.value })}
                placeholder="card-container"
              />
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text strong>{t.containerType}</Text>
                <Select
                  value={container.type}
                  onChange={(v) => updateContainer({ type: v })}
                  style={{ width: 220 }}
                >
                  {CONTAINER_TYPES.map((type) => (
                    <Option key={type} value={type}>{typeLabel[type]}</Option>
                  ))}
                </Select>
              </Space>
            </Space>
          </Card>

          <Card title={t.breakpoints} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {breakpoints.map((bp, i) => (
                <Card
                  key={i}
                  size="small"
                  title={
                    <Space>
                      <Text strong>{t.range}</Text>
                      {activeBpIndex === i && <Tag color="blue">{lang === 'pt' ? 'Ativo' : 'Active'}</Tag>}
                    </Space>
                  }
                  extra={
                    breakpoints.length > 1 && (
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeBreakpoint(i)}
                      />
                    )
                  }
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space style={{ width: '100%' }}>
                      <InputNumber
                        min={0}
                        value={bp.minWidth}
                        onChange={(v) => updateBreakpoint(i, { minWidth: v })}
                        placeholder={t.min}
                        style={{ width: 90 }}
                      />
                      <Text>–</Text>
                      <InputNumber
                        min={0}
                        value={bp.maxWidth}
                        onChange={(v) => updateBreakpoint(i, { maxWidth: v })}
                        placeholder={t.max}
                        style={{ width: 90 }}
                      />
                    </Space>

                    <Text strong>{t.styles}</Text>
                    <StyleField
                      label={t.bg}
                      type="color"
                      value={bp.styles.backgroundColor}
                      onChange={(v) => updateBreakpointStyles(i, { backgroundColor: v })}
                    />
                    <StyleField
                      label={t.text}
                      type="color"
                      value={bp.styles.color}
                      onChange={(v) => updateBreakpointStyles(i, { color: v })}
                    />
                    <StyleField
                      label={t.direction}
                      type="select"
                      value={bp.styles.flexDirection}
                      onChange={(v) => updateBreakpointStyles(i, { flexDirection: v })}
                    />
                    <StyleField
                      label={t.fontSize}
                      type="number"
                      min={8}
                      max={64}
                      value={bp.styles.fontSize}
                      onChange={(v) => updateBreakpointStyles(i, { fontSize: v })}
                    />
                    <StyleField
                      label={t.padding}
                      type="number"
                      min={0}
                      max={64}
                      value={bp.styles.padding}
                      onChange={(v) => updateBreakpointStyles(i, { padding: v })}
                    />
                    <StyleField
                      label={t.gap}
                      type="number"
                      min={0}
                      max={64}
                      value={bp.styles.gap}
                      onChange={(v) => updateBreakpointStyles(i, { gap: v })}
                    />
                    <StyleField
                      label={t.radius}
                      type="number"
                      min={0}
                      max={64}
                      value={bp.styles.borderRadius}
                      onChange={(v) => updateBreakpointStyles(i, { borderRadius: v })}
                    />
                  </Space>
                </Card>
              ))}
              <Button icon={<PlusOutlined />} onClick={addBreakpoint} block>{t.addBreakpoint}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 24,
                background: '#fafafa',
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: previewWidth,
                  maxWidth: '100%',
                  resize: 'horizontal',
                  overflow: 'auto',
                  minWidth: 120,
                  border: '2px dashed #d9d9d9',
                  borderRadius: 8,
                  padding: 8,
                }}
                onMouseUp={(e) => setPreviewWidth(e.currentTarget.clientWidth)}
              >
                <style>{cssOutput}</style>
                <div className={container.name.replace(/[^a-zA-Z0-9_-]/g, '-') || 'card-container'}>
                  <div className={`${container.name.replace(/[^a-zA-Z0-9_-]/g, '-') || 'card-container'}__item`}>
                    <div style={{ fontSize: 32, lineHeight: 1 }}>🎨</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Container Queries</div>
                      <div style={{ opacity: 0.85, marginTop: 4 }}>
                        {lang === 'pt' ? 'Redimensione este container.' : 'Resize this container.'}
                      </div>
                      <div style={{ opacity: 0.65, fontSize: 12, marginTop: 4 }}>
                        {previewWidth}px
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={t.output}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>{t.copy}</Button>}
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
              <code>{cssOutput}</code>
            </pre>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={t.htmlOutput}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(htmlOutput)}>{t.copy}</Button>}
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
              <code>{htmlOutput}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildContainerCss / buildBreakpointQuery`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildContainerCss.toString()}\n\n{buildBreakpointQuery.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
