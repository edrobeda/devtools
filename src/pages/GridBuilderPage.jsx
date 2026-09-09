import React, { useCallback, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, message, Select,
  Slider, Switch, Tag, Row, Col, InputNumber,
} from 'antd'
import { AppstoreOutlined, CopyOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ALIGN_CONTENTS, ALIGN_ITEMS, AUTO_FLOWS, DEFAULT_SETTINGS, JUSTIFY_CONTENTS,
  JUSTIFY_ITEMS, PRESETS, TRACK_TYPES, buildColumnsCss, buildContainerStyle,
  buildFullDemo, buildGridCss, buildItemStyles, buildRowsCss, buildSummary,
  trackToCss,
} from '../utils/cssGridBuilder'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message
const { Option } = Select

const translations = {
  pt: {
    title: 'Gerador de Grid CSS',
    intro: (
      <>Monte um layout <Text code>display: grid</Text> visualmente: defina trilhas de coluna e linha (<Text code>fr</Text>, <Text code>px</Text>, <Text code>%</Text>, <Text code>auto</Text>), espaçamento, alinhamento e fluxo automático, e copie o CSS pronto. Complementa o <Text code>grid-areas-generator</Text>, que desenha áreas nomeadas (<Text code>grid-template-areas</Text>).</>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A unidade <Text code>fr</Text> divide o espaço <em>restante</em> entre as colunas — <Text code>1fr 1fr 1fr</Text> = três colunas iguais, <Text code>1fr 2fr</Text> = a segunda com o dobro. Misturar <Text code>px</Text>/<Text code>%</Text> com <Text code>fr</Text> é comum e válido: as trilhas <Text code>fr</Text> absorvem o que sobra. Com <Text code>grid-auto-flow: column</Text> os itens fluem em linha em vez de quebrar a cada linha. Cuidado com <Text code>%</Text> em trilhas: ele é relativo ao container, já <Text code>fr</Text> só divide o que não foi ocupado. Para trilhas repetidas iguais use <Text code>repeat(N, 1fr)</Text> — o gerador produz essa forma automaticamente quando todas as colunas são <Text code>1fr</Text>.
      </>
    ),
    preset: 'Preset de grid',
    columns: 'Colunas',
    rows: 'Linhas',
    addColumn: 'Adicionar coluna',
    addRow: 'Adicionar linha',
    columnLabel: 'Coluna',
    rowLabel: 'Linha',
    gap: 'Espaçamento (gap)',
    justifyContent: 'justify-content',
    alignContent: 'align-content',
    justifyItems: 'justify-items',
    alignItems: 'align-items',
    autoFlow: 'grid-auto-flow',
    itemCount: 'Nº de itens no preview',
    spanFirst: '1º item atravessa 2 colunas',
    preview: 'Preview ao vivo',
    previewHint: 'A primeira trilha usa a cor destacada; cada item mostra o próprio índice.',
    output: 'CSS gerado',
    fullDemo: 'CSS + HTML',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssGridBuilder.js. trackToCss converte cada trilha ({type, value}) em um valor CSS; buildColumnsCss/buildRowsCss montam grid-template-columns/rows (com repeat() automático para colunas 1fr iguais); buildGridCss monta as regras do container e buildContainerStyle devolve o objeto de estilo para o preview ao vivo.',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    reset: 'Redefinir padrão',
    unitAuto: 'auto',
  },
  en: {
    title: 'CSS Grid Builder',
    intro: (
      <>Visually build a <Text code>display: grid</Text> layout: define column and row tracks (<Text code>fr</Text>, <Text code>px</Text>, <Text code>%</Text>, <Text code>auto</Text>), gap, alignment and auto-flow, and copy the ready CSS. Complements the <Text code>grid-areas-generator</Text>, which draws named areas (<Text code>grid-template-areas</Text>).</>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The <Text code>fr</Text> unit splits the <em>remaining</em> space among columns — <Text code>1fr 1fr 1fr</Text> = three equal columns, <Text code>1fr 2fr</Text> = the second one twice as wide. Mixing <Text code>px</Text>/<Text code>%</Text> with <Text code>fr</Text> is common and valid: the <Text code>fr</Text> tracks absorb what is left over. With <Text code>grid-auto-flow: column</Text> items flow in a row instead of wrapping per line. Be careful with <Text code>%</Text> tracks: they are relative to the container, whereas <Text code>fr</Text> only divides what remains. For repeated identical tracks use <Text code>repeat(N, 1fr)</Text> — the generator emits that form automatically when every column is <Text code>1fr</Text>.
      </>
    ),
    preset: 'Grid preset',
    columns: 'Columns',
    rows: 'Rows',
    addColumn: 'Add column',
    addRow: 'Add row',
    columnLabel: 'Column',
    rowLabel: 'Row',
    gap: 'Gap',
    justifyContent: 'justify-content',
    alignContent: 'align-content',
    justifyItems: 'justify-items',
    alignItems: 'align-items',
    autoFlow: 'grid-auto-flow',
    itemCount: 'Preview item count',
    spanFirst: '1st item spans 2 columns',
    preview: 'Live preview',
    previewHint: 'The first track uses the highlighted color; each item shows its own index.',
    output: 'Generated CSS',
    fullDemo: 'CSS + HTML',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssGridBuilder.js. trackToCss converts each track ({type, value}) into a CSS value; buildColumnsCss/buildRowsCss build grid-template-columns/rows (with automatic repeat() for equal 1fr columns); buildGridCss builds the container rules and buildContainerStyle returns the style object for the live preview.',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    reset: 'Reset to default',
    unitAuto: 'auto',
  },
}

const PRESET_LABELS = {
  pt: { thirds: 'Três colunas iguais', sidebar: 'Sidebar fixa', asymmetric: 'Assimétrico (1fr 2fr 1fr)', holy: 'Holy Grail', gallery: 'Galeria de cards' },
  en: { thirds: 'Three equal columns', sidebar: 'Fixed sidebar', asymmetric: 'Asymmetric (1fr 2fr 1fr)', holy: 'Holy Grail', gallery: 'Card gallery' },
}

const ITEM_COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2',
  '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911', '#fadb14', '#39c5bb']

export default function GridBuilderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const update = useCallback((patch) => setSettings((prev) => ({ ...prev, ...patch })), [])

  const updateTrack = (axis, index, patch) => {
    setSettings((prev) => {
      const list = prev[axis].map((tr, i) => (i === index ? { ...tr, ...patch } : tr))
      return { ...prev, [axis]: list }
    })
  }

  const addTrack = (axis) => {
    setSettings((prev) => ({ ...prev, [axis]: [...prev[axis], { type: 'fr', value: 1 }] }))
  }

  const removeTrack = (axis, index) => {
    setSettings((prev) => {
      if (prev[axis].length <= 1) return prev
      return { ...prev, [axis]: prev[axis].filter((_, i) => i !== index) }
    })
  }

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (p) setSettings(JSON.parse(JSON.stringify(p.settings)))
  }

  const reset = () => setSettings(DEFAULT_SETTINGS)

  const containerStyle = useMemo(() => buildContainerStyle(settings), [settings])
  const itemStyles = useMemo(() => buildItemStyles(settings), [settings])
  const cssOutput = useMemo(() => buildGridCss(settings), [settings])
  const fullOutput = useMemo(() => buildFullDemo(settings), [settings])
  const summary = useMemo(() => buildSummary(settings), [settings])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const renderTrackEditor = (axis, labelKey, label) => {
    const list = settings[axis]
    return (
      <Card size="small" title={`${label} (${axis === 'columns' ? buildColumnsCss(settings) : buildRowsCss(settings)})`}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {list.map((track, i) => (
            <Space key={i} style={{ width: '100%' }} wrap>
              <Text type="secondary">{labelKey} {i + 1}</Text>
              <Select
                value={track.type}
                onChange={(v) => updateTrack(axis, i, { type: v })}
                style={{ width: 92 }}
                options={TRACK_TYPES.map((tp) => ({ value: tp, label: tp }))}
              />
              {track.type !== 'auto' && (
                <InputNumber
                  min={track.type === 'fr' ? 0.5 : 0}
                  step={track.type === 'fr' ? 0.5 : (track.type === '%' ? 5 : 20)}
                  value={track.value}
                  onChange={(v) => updateTrack(axis, i, { value: v })}
                  style={{ width: 96 }}
                />
              )}
              <Button
                size="small"
                type="text"
                icon={<DeleteOutlined />}
                disabled={list.length <= 1}
                onClick={() => removeTrack(axis, i)}
              />
            </Space>
          ))}
          <Button size="small" icon={<PlusOutlined />} onClick={() => addTrack(axis)}>
            {axis === 'columns' ? t.addColumn : t.addRow}
          </Button>
        </Space>
      </Card>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><AppstoreOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card size="small" title={t.preset}>
            <Select
              style={{ width: '100%' }}
              placeholder={t.preset}
              value={null}
              onChange={applyPreset}
              options={PRESETS.map((p) => ({
                value: p.key,
                label: PRESET_LABELS[lang][p.key],
              }))}
            />
          </Card>

          <Card size="small" title={t.columns} style={{ marginTop: 16 }}>
            {renderTrackEditor('columns', t.columnLabel, t.columns)}
          </Card>

          <Card size="small" title={t.rows} style={{ marginTop: 16 }}>
            {renderTrackEditor('rows', t.rowLabel, t.rows)}
          </Card>

          <Card size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text>{t.gap}: {settings.gap}px</Text>
                <Slider min={0} max={48} step={4} value={settings.gap} onChange={(v) => update({ gap: v })} />
              </div>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.justifyContent}</Text>
                <Select
                  style={{ width: 160 }}
                  value={settings.justifyContent}
                  onChange={(v) => update({ justifyContent: v })}
                  options={JUSTIFY_CONTENTS.map((v) => ({ value: v, label: v }))}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.alignContent}</Text>
                <Select
                  style={{ width: 160 }}
                  value={settings.alignContent}
                  onChange={(v) => update({ alignContent: v })}
                  options={ALIGN_CONTENTS.map((v) => ({ value: v, label: v }))}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.justifyItems}</Text>
                <Select
                  style={{ width: 160 }}
                  value={settings.justifyItems}
                  onChange={(v) => update({ justifyItems: v })}
                  options={JUSTIFY_ITEMS.map((v) => ({ value: v, label: v }))}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.alignItems}</Text>
                <Select
                  style={{ width: 160 }}
                  value={settings.alignItems}
                  onChange={(v) => update({ alignItems: v })}
                  options={ALIGN_ITEMS.map((v) => ({ value: v, label: v }))}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.autoFlow}</Text>
                <Select
                  style={{ width: 160 }}
                  value={settings.autoFlow}
                  onChange={(v) => update({ autoFlow: v })}
                  options={AUTO_FLOWS.map((v) => ({ value: v, label: v }))}
                />
              </Space>

              <div>
                <Text>{t.itemCount}: {settings.itemCount}</Text>
                <Slider
                  min={3}
                  max={12}
                  value={settings.itemCount}
                  onChange={(v) => update({ itemCount: v })}
                />
              </div>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.spanFirst}</Text>
                <Switch checked={settings.spanFirst} onChange={(v) => update({ spanFirst: v })} />
              </Space>

              <Button icon={<ReloadOutlined />} onClick={reset} block>{t.reset}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.previewHint}</Paragraph>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 16,
                background: '#fafafa',
                minHeight: 200,
              }}
            >
              <div style={{ ...containerStyle }}>
                {itemStyles.map((itemStyle, i) => (
                  <div
                    key={i}
                    style={{
                      background: ITEM_COLORS[i % ITEM_COLORS.length],
                      color: '#fff',
                      borderRadius: 6,
                      padding: '12px 0',
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: 600,
                      ...itemStyle,
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space wrap size={[8, 8]}>
              <Tag color="blue">grid-template-columns: {summary.colsLabel}</Tag>
              <Tag color="cyan">grid-template-rows: {summary.rowsLabel}</Tag>
              <Tag color="green">{settings.gap}px gap</Tag>
              {settings.justifyContent !== 'normal' && <Tag color="orange">justify-content: {settings.justifyContent}</Tag>}
              {settings.autoFlow !== 'row' && <Tag color="purple">grid-auto-flow: {settings.autoFlow}</Tag>}
              {settings.spanFirst && <Tag color="magenta">primeiro item: span 2</Tag>}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
          <code>{cssOutput}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'full',
            label: t.fullDemo,
            children: (
              <Card
                title=""
                extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>{t.copy}</Button>}
              >
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{fullOutput}</code>
                </pre>
              </Card>
            ),
          },
          {
            key: 'source',
            label: `${t.sourceCol} — buildGridCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{`${trackToCss.toString()}\n\n${buildColumnsCss.toString()}\n\n${buildRowsCss.toString()}\n\n${buildGridCss.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
