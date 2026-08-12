import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, message, Select,
  Slider, InputNumber, Row, Col, Switch, Tag,
} from 'antd'
import { PicCenterOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  AXIS_OPTIONS,
  STRICTNESS_OPTIONS,
  ALIGN_OPTIONS,
  STOP_OPTIONS,
  DEFAULT_SETTINGS,
  PRESETS,
  buildScrollSnapCss,
  buildScrollSnapHtml,
  buildFullDemo,
} from '../utils/scrollSnapGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message
const { Option } = Select

const translations = {
  pt: {
    title: 'Gerador de Scroll Snap CSS',
    intro: (
      <>
        Monte carrosséis, galerias e listas paginadas usando só CSS com{' '}
        <Text code>scroll-snap-type</Text>. Controle o eixo, o alinhamento e a
        rigidez do snap, e veja o efeito ao vivo enquanto copia o código pronto.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        <Text code>scroll-snap-type</Text> define o eixo e se o snap é{' '}
        <Text code>mandatory</Text> (sempre para no item mais próximo) ou{' '}
        <Text code>proximity</Text> (só “puxa” quando perto o suficiente).{' '}
        <Text code>scroll-snap-align</Text> diz qual parte do item se alinha ao
        container. Atenção: <Text code>scroll-padding</Text> afeta o container e
        cria margem interna na área de snap; <Text code>scroll-margin</Text> afeta
        cada item. Para esconder a barra de rolagem visualmente, usamos{' '}
        <Text code>scrollbar-width: none</Text>, mas o scroll continua acessível
        por touchpad/roda do mouse — não quebre a acessibilidade removendo
        completamente a rolagem.
      </>
    ),
    preset: 'Preset',
    presetCarousel: 'Carrossel horizontal',
    presetGallery: 'Galeria vertical',
    presetPagination: 'Paginação full-width',
    presetVerticalList: 'Lista vertical',
    axis: 'Eixo de snap',
    strictness: 'Rigidez',
    align: 'Alinhamento do item',
    stop: 'Parada do snap',
    snapPadding: 'Scroll padding (px)',
    snapMargin: 'Scroll margin por item (px)',
    itemWidth: 'Largura do item (%)',
    itemHeight: 'Altura do item (px)',
    gap: 'Espaço entre itens (px)',
    itemCount: 'Nº de itens no preview',
    hideScrollbar: 'Esconder barra de rolagem',
    smoothScroll: 'Scroll suave (smooth)',
    preview: 'Pré-visualização',
    previewHint: 'Arraste/role a área abaixo para sentir o comportamento do snap.',
    output: 'CSS gerado',
    htmlOutput: 'HTML de exemplo',
    fullDemo: 'CSS + HTML completos',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    reset: 'Redefinir padrão',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/scrollSnapGenerator.js. buildScrollSnapCss monta as regras do container e dos itens a partir das opções escolhidas; buildScrollSnapHtml gera o markup de exemplo; buildFullDemo junta os dois com um estilo visual mínimo.',
  },
  en: {
    title: 'CSS Scroll Snap Generator',
    intro: (
      <>
        Build carousels, galleries and paginated lists using only CSS with{' '}
        <Text code>scroll-snap-type</Text>. Control the axis, alignment and snap
        strictness, and see the effect live while copying the ready-to-use code.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        <Text code>scroll-snap-type</Text> sets the axis and whether snapping is{' '}
        <Text code>mandatory</Text> (always snaps to the nearest item) or{' '}
        <Text code>proximity</Text> (only pulls when close enough).{' '}
        <Text code>scroll-snap-align</Text> tells which part of the item aligns
        to the container. Note:         <Text code>scroll-padding</Text> affects the
        container and creates inner snap area padding; <Text code>scroll-margin</Text>{' '}
        affects each item. To visually hide the scrollbar we use{' '}
        <Text code>scrollbar-width: none</Text>, but scrolling stays available
        via trackpad/mouse wheel — don’t break accessibility by removing
        scrolling entirely.
      </>
    ),
    preset: 'Preset',
    presetCarousel: 'Horizontal carousel',
    presetGallery: 'Vertical gallery',
    presetPagination: 'Full-width pagination',
    presetVerticalList: 'Vertical list',
    axis: 'Snap axis',
    strictness: 'Strictness',
    align: 'Item alignment',
    stop: 'Snap stop',
    snapPadding: 'Scroll padding (px)',
    snapMargin: 'Scroll margin per item (px)',
    itemWidth: 'Item width (%)',
    itemHeight: 'Item height (px)',
    gap: 'Gap between items (px)',
    itemCount: 'Number of preview items',
    hideScrollbar: 'Hide scrollbar',
    smoothScroll: 'Smooth scroll',
    preview: 'Preview',
    previewHint: 'Drag or scroll the area below to feel the snap behavior.',
    output: 'Generated CSS',
    htmlOutput: 'Sample HTML',
    fullDemo: 'Full CSS + HTML',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    reset: 'Reset to default',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/scrollSnapGenerator.js. buildScrollSnapCss builds the container and item rules from the chosen options; buildScrollSnapHtml generates the sample markup; buildFullDemo joins both with minimal visual styling.',
  },
}

const PRESET_LABELS = {
  pt: {
    carousel: 'Carrossel horizontal',
    gallery: 'Galeria vertical',
    pagination: 'Paginação full-width',
    'vertical-list': 'Lista vertical',
  },
  en: {
    carousel: 'Horizontal carousel',
    gallery: 'Vertical gallery',
    pagination: 'Full-width pagination',
    'vertical-list': 'Vertical list',
  },
}

export default function ScrollSnapGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }))

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (p) setSettings(p.settings)
  }

  const reset = () => setSettings(DEFAULT_SETTINGS)

  const cssOutput = useMemo(() => buildScrollSnapCss(settings), [settings])
  const htmlOutput = useMemo(() => buildScrollSnapHtml(settings), [settings])
  const fullOutput = useMemo(() => buildFullDemo(settings), [settings])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const isHorizontal = settings.axis === 'x' || settings.axis === 'inline'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><PicCenterOutlined /> {t.title}</Title>
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

          <Card title="Configurações" style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.axis}</Text>
                <Select value={settings.axis} onChange={(v) => update({ axis: v })} style={{ width: 120 }}>
                  {AXIS_OPTIONS.map((o) => (
                    <Option key={o} value={o}>{o}</Option>
                  ))}
                </Select>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.strictness}</Text>
                <Select
                  value={settings.strictness}
                  onChange={(v) => update({ strictness: v })}
                  style={{ width: 120 }}
                >
                  {STRICTNESS_OPTIONS.map((o) => (
                    <Option key={o} value={o}>{o}</Option>
                  ))}
                </Select>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.align}</Text>
                <Select value={settings.align} onChange={(v) => update({ align: v })} style={{ width: 120 }}>
                  {ALIGN_OPTIONS.map((o) => (
                    <Option key={o} value={o}>{o}</Option>
                  ))}
                </Select>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.stop}</Text>
                <Select value={settings.stop} onChange={(v) => update({ stop: v })} style={{ width: 120 }}>
                  {STOP_OPTIONS.map((o) => (
                    <Option key={o} value={o}>{o}</Option>
                  ))}
                </Select>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.snapPadding}</Text>
                <InputNumber
                  min={0}
                  max={200}
                  value={settings.snapPadding}
                  onChange={(v) => update({ snapPadding: v ?? 0 })}
                  style={{ width: 80 }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.snapMargin}</Text>
                <InputNumber
                  min={0}
                  max={200}
                  value={settings.snapMargin}
                  onChange={(v) => update({ snapMargin: v ?? 0 })}
                  style={{ width: 80 }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{isHorizontal ? t.itemWidth : t.itemHeight}</Text>
                <InputNumber
                  min={10}
                  max={100}
                  value={settings.itemWidth}
                  onChange={(v) => update({ itemWidth: v ?? 75 })}
                  style={{ width: 80 }}
                  formatter={(v) => `${v}%`}
                  parser={(v) => parseInt(v?.replace('%', '') || '0', 10)}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{isHorizontal ? t.itemHeight : t.itemWidth}</Text>
                <InputNumber
                  min={40}
                  max={600}
                  value={settings.itemHeight}
                  onChange={(v) => update({ itemHeight: v ?? 220 })}
                  style={{ width: 80 }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <InputNumber
                  min={0}
                  max={64}
                  value={settings.gap}
                  onChange={(v) => update({ gap: v ?? 0 })}
                  style={{ width: 80 }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemCount}</Text>
                <Slider
                  min={2}
                  max={12}
                  value={settings.itemCount}
                  onChange={(v) => update({ itemCount: v })}
                  style={{ width: 140 }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.hideScrollbar}</Text>
                <Switch checked={settings.hideScrollbar} onChange={(v) => update({ hideScrollbar: v })} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.smoothScroll}</Text>
                <Switch checked={settings.smoothScroll} onChange={(v) => update({ smoothScroll: v })} />
              </Space>

              <Button icon={<ReloadOutlined />} onClick={reset} block>{t.reset}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 16,
                background: '#fafafa',
                minHeight: isHorizontal ? 320 : 420,
                display: 'flex',
                alignItems: isHorizontal ? 'center' : 'flex-start',
                justifyContent: 'center',
              }}
            >
              <div
                className="snap-preview-container"
                style={{
                  width: isHorizontal ? '100%' : settings.itemWidth === 100 ? '100%' : `${settings.itemWidth}%`,
                  height: isHorizontal ? settings.itemHeight : 360,
                  overflow: isHorizontal ? 'auto' : 'auto',
                  display: 'flex',
                  flexDirection: isHorizontal ? 'row' : 'column',
                  gap: settings.gap,
                  scrollSnapType: `${settings.axis} ${settings.strictness}`,
                  [isHorizontal ? 'scrollPaddingInline' : 'scrollPaddingBlock']: settings.snapPadding,
                  scrollBehavior: settings.smoothScroll ? 'smooth' : 'auto',
                  scrollbarWidth: settings.hideScrollbar ? 'none' : undefined,
                }}
              >
                {Array.from({ length: settings.itemCount }, (_, i) => i + 1).map((n) => (
                  <div
                    key={n}
                    className="snap-preview-item"
                    style={{
                      flex: `0 0 ${settings.itemWidth}%`,
                      height: isHorizontal ? '100%' : settings.itemHeight,
                      scrollSnapAlign: settings.align,
                      scrollSnapStop: settings.stop,
                      scrollMargin: settings.snapMargin,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 12,
                      background: '#e6f7ff',
                      color: '#0958d9',
                      fontWeight: 700,
                      fontSize: '2rem',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space wrap size={[8, 8]}>
              <Tag color="blue">scroll-snap-type: {settings.axis} {settings.strictness}</Tag>
              <Tag color="green">scroll-snap-align: {settings.align}</Tag>
              {settings.stop !== 'normal' && (
                <Tag color="orange">scroll-snap-stop: {settings.stop}</Tag>
              )}
              {settings.snapPadding > 0 && (
                <Tag color="purple">scroll-padding: {settings.snapPadding}px</Tag>
              )}
              {settings.snapMargin > 0 && (
                <Tag color="volcano">scroll-margin: {settings.snapMargin}px</Tag>
              )}
            </Space>
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

      <Card
        title={t.fullDemo}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
          <code>{fullOutput}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildScrollSnapCss / buildScrollSnapHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{`${buildScrollSnapCss.toString()}\n\n${buildScrollSnapHtml.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
