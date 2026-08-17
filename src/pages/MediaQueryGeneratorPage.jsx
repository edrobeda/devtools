import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Select, Input, InputNumber,
  Segmented, Row, Col, Tag, Collapse, Alert, message,
} from 'antd'
import {
  ColumnWidthOutlined, CopyOutlined, PlusOutlined,
  DeleteOutlined, UndoOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import engineSource from '../utils/mediaQueryGenerator.js?raw'
import {
  DEFAULT_SELECTOR,
  DEFAULT_BREAKPOINTS,
  CONDITION_TYPES,
  DISPLAY_OPTIONS,
  FLEX_DIRECTION_OPTIONS,
  PRESETS,
  getPresetBreakpoints,
  buildCss,
  buildHtmlExample,
  getActiveBreakpointIndex,
} from '../utils/mediaQueryGenerator'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { useMessage } = message

const translations = {
  pt: {
    title: 'Gerador de Media Queries CSS',
    intro:
      'Monte blocos @media visualmente: combine condições de largura, altura, orientação, prefers-color-scheme, hover, pointer e muito mais. Gere CSS com sintaxe moderna de intervalo (width >= 768px) ou legado (min-width), veja o preview em um iframe com largura controlada e copie o código.',
    noteTitle: 'Como funciona',
    noteBody:
      'Media queries respondem à viewport do navegador. O preview usa um iframe cuja largura é ajustada pelo slider, então você vê as regras @media de verdade em ação. Fora do iframe, o CSS gerado usa o seletor que você definir.',
    selector: 'Seletor CSS',
    syntax: 'Sintaxe da media query',
    modern: 'Moderna (intervalo)',
    legacy: 'Legado (min/max)',
    breakpoints: 'Breakpoints',
    addBreakpoint: 'Adicionar breakpoint',
    breakpoint: 'Breakpoint',
    active: 'Ativo',
    conditions: 'Condições',
    addCondition: 'Adicionar condição',
    conditionType: 'Condição',
    value: 'Valor',
    min: 'Mín',
    max: 'Máx',
    styles: 'Estilos',
    bg: 'Fundo',
    text: 'Texto',
    fontSize: 'Fonte (px)',
    padding: 'Padding (px)',
    radius: 'Radius (px)',
    display: 'Display',
    flexDirection: 'Direção flex',
    gap: 'Gap (px)',
    presets: 'Presets rápidos',
    presetMobileFirst: 'Mobile-first',
    presetDesktopFirst: 'Desktop-first',
    presetDarkMode: 'Modo escuro',
    presetReducedMotion: 'Movimento reduzido',
    presetPortrait: 'Orientação retrato',
    reset: 'Restaurar padrões',
    preview: 'Preview ao vivo',
    previewTitle: 'Elemento responsivo',
    previewHint: 'Arraste o slider para mudar a largura do iframe e ver qual @media ativa.',
    widthLabel: 'Largura do preview',
    cssOutput: 'CSS gerado',
    htmlOutput: 'HTML de exemplo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor em src/utils/mediaQueryGenerator.js monta a string da media query a partir das condições e gera o bloco @media com as declarações de estilo.',
    minWidth: 'Largura mínima',
    maxWidth: 'Largura máxima',
    widthRange: 'Faixa de largura',
    minHeight: 'Altura mínima',
    maxHeight: 'Altura máxima',
    orientation: 'Orientação',
    aspectRatio: 'Proporção (aspect-ratio)',
    prefersColorScheme: 'Prefere esquema de cores',
    prefersReducedMotion: 'Prefere movimento reduzido',
    hover: 'Hover',
    pointer: 'Ponteiro',
    displayMode: 'Modo de exibição',
    portrait: 'Retrato',
    landscape: 'Paisagem',
    dark: 'Escuro',
    light: 'Claro',
    reduce: 'Reduzir',
    noPreference: 'Sem preferência',
    hoverValue: 'hover',
    noneValue: 'none',
    fine: 'fine',
    coarse: 'coarse',
    fullscreen: 'fullscreen',
    standalone: 'standalone',
    minimalUi: 'minimal-ui',
    browser: 'browser',
    windowControlsOverlay: 'window-controls-overlay',
  },
  en: {
    title: 'CSS Media Query Generator',
    intro:
      'Build @media blocks visually: combine width, height, orientation, prefers-color-scheme, hover, pointer and more. Generate CSS with modern range syntax (width >= 768px) or legacy min/max syntax, preview it inside a width-controlled iframe and copy the code.',
    noteTitle: 'How it works',
    noteBody:
      'Media queries respond to the browser viewport. The preview uses an iframe whose width is controlled by the slider, so you see real @media rules in action. Outside the iframe, the generated CSS uses the selector you define.',
    selector: 'CSS selector',
    syntax: 'Media query syntax',
    modern: 'Modern (range)',
    legacy: 'Legacy (min/max)',
    breakpoints: 'Breakpoints',
    addBreakpoint: 'Add breakpoint',
    breakpoint: 'Breakpoint',
    active: 'Active',
    conditions: 'Conditions',
    addCondition: 'Add condition',
    conditionType: 'Condition',
    value: 'Value',
    min: 'Min',
    max: 'Max',
    styles: 'Styles',
    bg: 'Background',
    text: 'Text',
    fontSize: 'Font size (px)',
    padding: 'Padding (px)',
    radius: 'Radius (px)',
    display: 'Display',
    flexDirection: 'Flex direction',
    gap: 'Gap (px)',
    presets: 'Quick presets',
    presetMobileFirst: 'Mobile-first',
    presetDesktopFirst: 'Desktop-first',
    presetDarkMode: 'Dark mode',
    presetReducedMotion: 'Reduced motion',
    presetPortrait: 'Portrait orientation',
    reset: 'Reset defaults',
    preview: 'Live preview',
    previewTitle: 'Responsive element',
    previewHint: 'Drag the slider to change the iframe width and see which @media becomes active.',
    widthLabel: 'Preview width',
    cssOutput: 'Generated CSS',
    htmlOutput: 'Sample HTML',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine in src/utils/mediaQueryGenerator.js assembles the media query string from conditions and generates the @media block with style declarations.',
    minWidth: 'Min width',
    maxWidth: 'Max width',
    widthRange: 'Width range',
    minHeight: 'Min height',
    maxHeight: 'Max height',
    orientation: 'Orientation',
    aspectRatio: 'Aspect ratio',
    prefersColorScheme: 'Prefers color scheme',
    prefersReducedMotion: 'Prefers reduced motion',
    hover: 'Hover',
    pointer: 'Pointer',
    displayMode: 'Display mode',
    portrait: 'Portrait',
    landscape: 'Landscape',
    dark: 'Dark',
    light: 'Light',
    reduce: 'Reduce',
    noPreference: 'No preference',
    hoverValue: 'hover',
    noneValue: 'none',
    fine: 'fine',
    coarse: 'coarse',
    fullscreen: 'fullscreen',
    standalone: 'standalone',
    minimalUi: 'minimal-ui',
    browser: 'browser',
    windowControlsOverlay: 'window-controls-overlay',
  },
}

function defaultValueForType(type) {
  const def = CONDITION_TYPES.find((c) => c.value === type)
  if (!def) return { value: '' }
  if (def.range) return { value: 0, valueMax: 767 }
  if (def.numeric) return { value: 768 }
  if (def.options) return { value: def.options[0] }
  if (type === 'aspect-ratio') return { value: '16/9' }
  return { value: '' }
}

function StyleField({ label, value, onChange, type = 'text', min = 0, max = 100, options }) {
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
  if (type === 'select') {
    return (
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Select value={value} onChange={onChange} style={{ width: 140 }} options={options} />
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

export default function MediaQueryGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [selector, setSelector] = useState(DEFAULT_SELECTOR)
  const [rangeSyntax, setRangeSyntax] = useState(true)
  const [breakpoints, setBreakpoints] = useState(DEFAULT_BREAKPOINTS)
  const [previewWidth, setPreviewWidth] = useState(360)

  const cssOutput = useMemo(() => buildCss(selector, breakpoints, rangeSyntax), [selector, breakpoints, rangeSyntax])
  const htmlOutput = useMemo(() => buildHtmlExample(selector), [selector])
  const previewCss = useMemo(() => buildCss('.mq-preview-element', breakpoints, rangeSyntax), [breakpoints, rangeSyntax])
  const activeIndex = useMemo(() => getActiveBreakpointIndex(breakpoints, previewWidth, rangeSyntax), [breakpoints, previewWidth, rangeSyntax])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const addBreakpoint = () => {
    setBreakpoints((prev) => [
      ...prev,
      {
        id: `bp-${Date.now()}`,
        conditions: [{ type: 'min-width', value: 768 }],
        styles: { ...DEFAULT_BREAKPOINTS[0].styles },
      },
    ])
  }

  const removeBreakpoint = (index) => {
    setBreakpoints((prev) => prev.filter((_, i) => i !== index))
  }

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

  const addCondition = (index) => {
    setBreakpoints((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        conditions: [...next[index].conditions, { type: 'min-width', value: 768 }],
      }
      return next
    })
  }

  const updateCondition = (bpIndex, condIndex, patch) => {
    setBreakpoints((prev) => {
      const next = [...prev]
      const conditions = [...next[bpIndex].conditions]
      conditions[condIndex] = { ...conditions[condIndex], ...patch }
      next[bpIndex] = { ...next[bpIndex], conditions }
      return next
    })
  }

  const updateConditionType = (bpIndex, condIndex, type) => {
    const defaults = defaultValueForType(type)
    updateCondition(bpIndex, condIndex, { type, ...defaults })
  }

  const removeCondition = (bpIndex, condIndex) => {
    setBreakpoints((prev) => {
      const next = [...prev]
      next[bpIndex] = {
        ...next[bpIndex],
        conditions: next[bpIndex].conditions.filter((_, i) => i !== condIndex),
      }
      return next
    })
  }

  const applyPreset = (key) => {
    setBreakpoints(getPresetBreakpoints(key))
  }

  const reset = () => {
    setSelector(DEFAULT_SELECTOR)
    setRangeSyntax(true)
    setBreakpoints(DEFAULT_BREAKPOINTS)
  }

  const conditionTypeOptions = useMemo(
    () => CONDITION_TYPES.map((c) => ({ value: c.value, label: t[c.labelKey] })),
    [t]
  )

  const renderConditionValue = (bpIndex, condIndex, condition) => {
    const def = CONDITION_TYPES.find((c) => c.value === condition.type)
    if (!def) return null

    if (def.range) {
      return (
        <Space>
          <InputNumber
            min={0}
            value={condition.value}
            onChange={(v) => updateCondition(bpIndex, condIndex, { value: v })}
            placeholder={t.min}
            style={{ width: 80 }}
          />
          <Text>–</Text>
          <InputNumber
            min={0}
            value={condition.valueMax}
            onChange={(v) => updateCondition(bpIndex, condIndex, { valueMax: v })}
            placeholder={t.max}
            style={{ width: 80 }}
          />
          <Text type="secondary">px</Text>
        </Space>
      )
    }

    if (def.numeric) {
      return (
        <Space>
          <InputNumber
            min={0}
            value={condition.value}
            onChange={(v) => updateCondition(bpIndex, condIndex, { value: v })}
            style={{ width: 100 }}
          />
          <Text type="secondary">px</Text>
        </Space>
      )
    }

    if (def.options) {
      return (
        <Select
          value={condition.value}
          onChange={(v) => updateCondition(bpIndex, condIndex, { value: v })}
          style={{ width: 180 }}
          options={def.options.map((opt) => ({ value: opt, label: t[opt] || opt }))}
        />
      )
    }

    return (
      <Input
        value={condition.value}
        onChange={(e) => updateCondition(bpIndex, condIndex, { value: e.target.value })}
        style={{ width: 140 }}
      />
    )
  }

  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; }
  .mq-preview-element { transition: all 0.25s ease; }
  ${previewCss}
</style>
</head>
<body>
  <div class="mq-preview-element">
    <div style="font-size: 32px; line-height: 1; text-align: center;">📱</div>
    <div style="margin-top: 8px; text-align: center;">
      <div style="font-weight: 700;">${t.previewTitle}</div>
      <div style="opacity: 0.85; margin-top: 4px;">${previewWidth}px</div>
    </div>
  </div>
</body>
</html>`
  }, [previewCss, previewWidth, t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ColumnWidthOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card size="small" title={t.selector}>
            <Input
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder=".card"
            />
          </Card>

          <Card size="small" title={t.syntax} style={{ marginTop: 16 }}>
            <Segmented
              value={rangeSyntax}
              onChange={(v) => setRangeSyntax(v)}
              block
              options={[
                { value: true, label: t.modern },
                { value: false, label: t.legacy },
              ]}
            />
          </Card>

          <Card title={t.presets} style={{ marginTop: 16 }}>
            <Space wrap>
              {PRESETS.map((p) => (
                <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>
                  {t[p.labelKey]}
                </Button>
              ))}
              <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
            </Space>
          </Card>

          <Card title={t.breakpoints} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {breakpoints.map((bp, i) => (
                <Card
                  key={bp.id}
                  size="small"
                  title={
                    <Space>
                      <Text strong>{t.breakpoint} {i + 1}</Text>
                      {activeIndex === i && <Tag color="blue">{t.active}</Tag>}
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
                    <Text strong>{t.conditions}</Text>
                    {bp.conditions.map((cond, ci) => (
                      <Space key={ci} wrap>
                        <Select
                          value={cond.type}
                          onChange={(v) => updateConditionType(i, ci, v)}
                          style={{ width: 180 }}
                          options={conditionTypeOptions}
                        />
                        {renderConditionValue(i, ci, cond)}
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeCondition(i, ci)}
                        />
                      </Space>
                    ))}
                    <Button size="small" icon={<PlusOutlined />} onClick={() => addCondition(i)} block>
                      {t.addCondition}
                    </Button>

                    <Text strong style={{ marginTop: 8 }}>{t.styles}</Text>
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
                      label={t.fontSize}
                      type="number"
                      min={8}
                      max={96}
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
                      label={t.radius}
                      type="number"
                      min={0}
                      max={64}
                      value={bp.styles.borderRadius}
                      onChange={(v) => updateBreakpointStyles(i, { borderRadius: v })}
                    />
                    <StyleField
                      label={t.display}
                      type="select"
                      value={bp.styles.display}
                      onChange={(v) => updateBreakpointStyles(i, { display: v })}
                      options={DISPLAY_OPTIONS.map((o) => ({ value: o, label: o }))}
                    />
                    {(bp.styles.display === 'flex' || bp.styles.display === 'inline-flex') && (
                      <StyleField
                        label={t.flexDirection}
                        type="select"
                        value={bp.styles.flexDirection}
                        onChange={(v) => updateBreakpointStyles(i, { flexDirection: v })}
                        options={FLEX_DIRECTION_OPTIONS.map((o) => ({ value: o, label: o }))}
                      />
                    )}
                    {(bp.styles.display === 'flex' || bp.styles.display === 'inline-flex' || bp.styles.display === 'grid') && (
                      <StyleField
                        label={t.gap}
                        type="number"
                        min={0}
                        max={64}
                        value={bp.styles.gap}
                        onChange={(v) => updateBreakpointStyles(i, { gap: v })}
                      />
                    )}
                  </Space>
                </Card>
              ))}
              <Button icon={<PlusOutlined />} onClick={addBreakpoint} block>{t.addBreakpoint}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <Alert type="info" showIcon message={t.noteTitle} description={t.noteBody} style={{ marginBottom: 16 }} />
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <iframe
                title={t.previewTitle}
                srcDoc={srcDoc}
                style={{
                  width: previewWidth,
                  maxWidth: '100%',
                  height: 220,
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  display: 'block',
                }}
              />
              <div>
                <Text strong>{t.widthLabel}: </Text>
                <Text>{previewWidth}px</Text>
              </div>
              <InputNumber
                min={200}
                max={900}
                value={previewWidth}
                onChange={(v) => setPreviewWidth(v ?? 360)}
                style={{ width: '100%' }}
                addonAfter="px"
              />
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>{t.previewHint}</Paragraph>
            </Space>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card
                title={t.cssOutput}
                extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>{t.copy}</Button>}
              >
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{cssOutput || `/* ${lang === 'pt' ? 'Nenhuma condição válida' : 'No valid conditions'} */`}</code>
                </pre>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
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
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{engineSource}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
