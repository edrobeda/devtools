import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Switch,
} from 'antd'
import { SlidersOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildRangeSliderCss,
  buildRangeSliderHtml,
  buildRangeSliderFullDemo,
} from '../utils/cssRangeSliderGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESETS = [
  {
    key: 'default',
    trackHeight: 8, trackColor: '#e5e7eb', trackRadius: 999,
    fillColor: '#3b82f6', showFill: true,
    thumbWidth: 20, thumbHeight: 20, thumbColor: '#2563eb',
    thumbBorderWidth: 2, thumbBorderColor: '#ffffff', thumbRadius: 50,
    hoverThumbColor: '#1d4ed8', activeThumbColor: '#1e40af',
    disabledTrackColor: '#d1d5db', disabledThumbColor: '#9ca3af',
  },
  {
    key: 'minimal',
    trackHeight: 4, trackColor: '#d9d9d9', trackRadius: 2,
    fillColor: '#000000', showFill: true,
    thumbWidth: 14, thumbHeight: 14, thumbColor: '#000000',
    thumbBorderWidth: 0, thumbBorderColor: '#000000', thumbRadius: 50,
    hoverThumbColor: '#333333', activeThumbColor: '#555555',
    disabledTrackColor: '#e0e0e0', disabledThumbColor: '#bdbdbd',
  },
  {
    key: 'neon',
    trackHeight: 10, trackColor: '#111827', trackRadius: 999,
    fillColor: '#22d3ee', showFill: true,
    thumbWidth: 24, thumbHeight: 24, thumbColor: '#22d3ee',
    thumbBorderWidth: 3, thumbBorderColor: '#0891b2', thumbRadius: 50,
    hoverThumbColor: '#67e8f9', activeThumbColor: '#a5f3fc',
    disabledTrackColor: '#374151', disabledThumbColor: '#4b5563',
  },
  {
    key: 'rounded',
    trackHeight: 12, trackColor: '#f3f4f6', trackRadius: 12,
    fillColor: '#8b5cf6', showFill: true,
    thumbWidth: 28, thumbHeight: 28, thumbColor: '#ffffff',
    thumbBorderWidth: 4, thumbBorderColor: '#8b5cf6', thumbRadius: 50,
    hoverThumbColor: '#f5f3ff', activeThumbColor: '#ede9fe',
    disabledTrackColor: '#e5e7eb', disabledThumbColor: '#d1d5db',
  },
  {
    key: 'dark',
    trackHeight: 6, trackColor: '#374151', trackRadius: 999,
    fillColor: '#10b981', showFill: true,
    thumbWidth: 18, thumbHeight: 18, thumbColor: '#10b981',
    thumbBorderWidth: 2, thumbBorderColor: '#064e3b', thumbRadius: 4,
    hoverThumbColor: '#34d399', activeThumbColor: '#6ee7b7',
    disabledTrackColor: '#4b5563', disabledThumbColor: '#6b7280',
  },
]

const translations = {
  pt: {
    title: 'Gerador de Range Slider CSS',
    intro: (
      <>
        Estilize <Text code>{'<input type="range">'}</Text> sem bibliotecas.
        O gerador cobre os pseudo-elementos do WebKit e do Firefox, incluindo o
        preenchimento até o thumb (o famoso "progress track").
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Cada navegador usa pseudo-elementos diferentes: WebKit usa{' '}
        <Text code>::-webkit-slider-runnable-track</Text> e{' '}
        <Text code>::-webkit-slider-thumb</Text>; Firefox usa{' '}
        <Text code>::-moz-range-track</Text>,{' '}
        <Text code>::-moz-range-progress</Text> e{' '}
        <Text code>::-moz-range-thumb</Text>. O preenchimento no WebKit é um{' '}
        <Text code>linear-gradient</Text> controlado pelas variáveis CSS{' '}
        <Text code>--value</Text>/<Text code>--min</Text>/<Text code>--max</Text>.
        No Firefox o preenchimento usa <Text code>::-moz-range-progress</Text>.
        Sempre remova a aparência padrão com <Text code>appearance: none</Text>{' '}
        e lembre-se: estilos no thumb precisam ser declarados separadamente
        para cada engine.
      </>
    ),
    settings: 'Configurações',
    preset: 'Preset (estilo)',
    presetDefault: 'Padrão',
    presetMinimal: 'Minimal',
    presetNeon: 'Neon',
    presetRounded: 'Arredondado',
    presetDark: 'Escuro',
    min: 'Mínimo',
    max: 'Máximo',
    value: 'Valor atual',
    track: 'Trilha',
    trackHeight: 'Altura da trilha',
    trackColor: 'Cor da trilha',
    trackRadius: 'Arredondamento da trilha',
    fillColor: 'Cor do preenchimento',
    showFill: 'Mostrar preenchimento',
    thumb: 'Thumb',
    thumbWidth: 'Largura do thumb',
    thumbHeight: 'Altura do thumb',
    thumbColor: 'Cor do thumb',
    thumbBorderWidth: 'Borda do thumb',
    thumbBorderColor: 'Cor da borda',
    thumbRadius: 'Arredondamento do thumb',
    hoverThumbColor: 'Cor do thumb no hover',
    activeThumbColor: 'Cor do thumb ao clicar',
    disabled: 'Desabilitado',
    disabledTrackColor: 'Cor da trilha desabilitada',
    disabledThumbColor: 'Cor do thumb desabilitado',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'Arraste o slider abaixo para ver o CSS gerado em ação.',
    output: 'CSS gerado',
    demo: 'Bloco completo (HTML + CSS)',
    copy: 'Copiar',
    copied: 'Código copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssRangeSliderGenerator.js. buildRangeSliderCss monta as regras para WebKit e Firefox, calcula o gradiente de preenchimento a partir das variáveis CSS e gera estados hover/active/desabilitado. buildRangeSliderHtml entrega o markup de exemplo com as variáveis --value/--min/--max e buildRangeSliderFullDemo junta tudo.',
  },
  en: {
    title: 'CSS Range Slider Generator',
    intro: (
      <>
        Style an <Text code>{'<input type="range">'}</Text> without libraries.
        The generator covers WebKit and Firefox pseudo-elements, including the
        fill up to the thumb (the famous "progress track").
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        Each browser uses different pseudo-elements: WebKit uses{' '}
        <Text code>::-webkit-slider-runnable-track</Text> and{' '}
        <Text code>::-webkit-slider-thumb</Text>; Firefox uses{' '}
        <Text code>::-moz-range-track</Text>,{' '}
        <Text code>::-moz-range-progress</Text> and{' '}
        <Text code>::-moz-range-thumb</Text>. The WebKit fill is a{' '}
        <Text code>linear-gradient</Text> driven by the CSS variables{' '}
        <Text code>--value</Text>/<Text code>--min</Text>/<Text code>--max</Text>.
        On Firefox the fill uses <Text code>::-moz-range-progress</Text>.
        Always remove the default look with <Text code>appearance: none</Text>{' '}
        and remember: thumb styles must be declared separately for each engine.
      </>
    ),
    settings: 'Settings',
    preset: 'Preset (style)',
    presetDefault: 'Default',
    presetMinimal: 'Minimal',
    presetNeon: 'Neon',
    presetRounded: 'Rounded',
    presetDark: 'Dark',
    min: 'Minimum',
    max: 'Maximum',
    value: 'Current value',
    track: 'Track',
    trackHeight: 'Track height',
    trackColor: 'Track color',
    trackRadius: 'Track radius',
    fillColor: 'Fill color',
    showFill: 'Show fill',
    thumb: 'Thumb',
    thumbWidth: 'Thumb width',
    thumbHeight: 'Thumb height',
    thumbColor: 'Thumb color',
    thumbBorderWidth: 'Thumb border',
    thumbBorderColor: 'Thumb border color',
    thumbRadius: 'Thumb radius',
    hoverThumbColor: 'Thumb hover color',
    activeThumbColor: 'Thumb active color',
    disabled: 'Disabled',
    disabledTrackColor: 'Disabled track color',
    disabledThumbColor: 'Disabled thumb color',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'Drag the slider below to see the generated CSS in action.',
    output: 'Generated CSS',
    demo: 'Full block (HTML + CSS)',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssRangeSliderGenerator.js. buildRangeSliderCss assembles the WebKit and Firefox rules, computes the fill gradient from CSS variables and emits hover/active/disabled states. buildRangeSliderHtml returns the example markup with --value/--min/--max variables and buildRangeSliderFullDemo joins everything.',
  },
}

const PRESET_LABELS = {
  pt: {
    default: 'Padrão',
    minimal: 'Minimal',
    neon: 'Neon',
    rounded: 'Arredondado',
    dark: 'Escuro',
  },
  en: {
    default: 'Default',
    minimal: 'Minimal',
    neon: 'Neon',
    rounded: 'Rounded',
    dark: 'Dark',
  },
}

export default function CssRangeSliderGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [className, setClassName] = useState('range-slider')
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(100)
  const [value, setValue] = useState(50)

  const [trackHeight, setTrackHeight] = useState(8)
  const [trackColor, setTrackColor] = useState('#e5e7eb')
  const [trackRadius, setTrackRadius] = useState(999)
  const [fillColor, setFillColor] = useState('#3b82f6')
  const [showFill, setShowFill] = useState(true)

  const [thumbWidth, setThumbWidth] = useState(20)
  const [thumbHeight, setThumbHeight] = useState(20)
  const [thumbColor, setThumbColor] = useState('#2563eb')
  const [thumbBorderWidth, setThumbBorderWidth] = useState(2)
  const [thumbBorderColor, setThumbBorderColor] = useState('#ffffff')
  const [thumbRadius, setThumbRadius] = useState(50)
  const [hoverThumbColor, setHoverThumbColor] = useState('#1d4ed8')
  const [activeThumbColor, setActiveThumbColor] = useState('#1e40af')

  const [disabledTrackColor, setDisabledTrackColor] = useState('#d1d5db')
  const [disabledThumbColor, setDisabledThumbColor] = useState('#9ca3af')

  const settings = useMemo(
    () => ({
      className,
      min,
      max,
      value,
      trackHeight,
      trackColor,
      trackRadius,
      fillColor,
      showFill,
      thumbWidth,
      thumbHeight,
      thumbColor,
      thumbBorderWidth,
      thumbBorderColor,
      thumbRadius,
      hoverThumbColor,
      activeThumbColor,
      disabledTrackColor,
      disabledThumbColor,
    }),
    [
      className,
      min,
      max,
      value,
      trackHeight,
      trackColor,
      trackRadius,
      fillColor,
      showFill,
      thumbWidth,
      thumbHeight,
      thumbColor,
      thumbBorderWidth,
      thumbBorderColor,
      thumbRadius,
      hoverThumbColor,
      activeThumbColor,
      disabledTrackColor,
      disabledThumbColor,
    ]
  )

  const result = useMemo(() => buildRangeSliderCss(settings), [settings])
  const html = useMemo(
    () => buildRangeSliderHtml(result.className, min, max, value),
    [result.className, min, max, value]
  )
  const fullDemo = useMemo(() => buildRangeSliderFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (!p) return
    setTrackHeight(p.trackHeight)
    setTrackColor(p.trackColor)
    setTrackRadius(p.trackRadius)
    setFillColor(p.fillColor)
    setShowFill(p.showFill)
    setThumbWidth(p.thumbWidth)
    setThumbHeight(p.thumbHeight)
    setThumbColor(p.thumbColor)
    setThumbBorderWidth(p.thumbBorderWidth)
    setThumbBorderColor(p.thumbBorderColor)
    setThumbRadius(p.thumbRadius)
    setHoverThumbColor(p.hoverThumbColor)
    setActiveThumbColor(p.activeThumbColor)
    setDisabledTrackColor(p.disabledTrackColor)
    setDisabledThumbColor(p.disabledThumbColor)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SlidersOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESETS.map((p) => ({ value: p.key, label: PRESET_LABELS[lang][p.key] }))}
              />

              <Card type="inner" title={t.track} size="small" style={{ marginTop: 8 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.trackHeight}</Text>
                    <Text code>{trackHeight}px</Text>
                  </Space>
                  <Slider min={2} max={32} value={trackHeight} onChange={setTrackHeight} />

                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.trackColor}</Text>
                    <ColorPicker value={trackColor} onChange={setTrackColor} showText />
                  </Space>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.trackRadius}</Text>
                    <Text code>{trackRadius}px</Text>
                  </Space>
                  <Slider min={0} max={32} value={trackRadius} onChange={setTrackRadius} />

                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.fillColor}</Text>
                    <ColorPicker value={fillColor} onChange={setFillColor} showText />
                  </Space>

                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.showFill}</Text>
                    <Switch checked={showFill} onChange={setShowFill} />
                  </Space>
                </Space>
              </Card>

              <Card type="inner" title={t.thumb} size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.thumbWidth}</Text>
                    <Text code>{thumbWidth}px</Text>
                  </Space>
                  <Slider min={8} max={64} value={thumbWidth} onChange={setThumbWidth} />

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.thumbHeight}</Text>
                    <Text code>{thumbHeight}px</Text>
                  </Space>
                  <Slider min={8} max={64} value={thumbHeight} onChange={setThumbHeight} />

                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.thumbColor}</Text>
                    <ColorPicker value={thumbColor} onChange={setThumbColor} showText />
                  </Space>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.thumbBorderWidth}</Text>
                    <Text code>{thumbBorderWidth}px</Text>
                  </Space>
                  <Slider min={0} max={12} value={thumbBorderWidth} onChange={setThumbBorderWidth} />

                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.thumbBorderColor}</Text>
                    <ColorPicker value={thumbBorderColor} onChange={setThumbBorderColor} showText />
                  </Space>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.thumbRadius}</Text>
                    <Text code>{thumbRadius}%</Text>
                  </Space>
                  <Slider min={0} max={50} value={thumbRadius} onChange={setThumbRadius} />

                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.hoverThumbColor}</Text>
                    <ColorPicker value={hoverThumbColor} onChange={setHoverThumbColor} showText />
                  </Space>

                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.activeThumbColor}</Text>
                    <ColorPicker value={activeThumbColor} onChange={setActiveThumbColor} showText />
                  </Space>
                </Space>
              </Card>

              <Card type="inner" title={t.disabled} size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.disabledTrackColor}</Text>
                    <ColorPicker value={disabledTrackColor} onChange={setDisabledTrackColor} showText />
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.disabledThumbColor}</Text>
                    <ColorPicker value={disabledThumbColor} onChange={setDisabledThumbColor} showText />
                  </Space>
                </Space>
              </Card>

              <Card type="inner" title={t.value} size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.min}</Text>
                    <InputNumber value={min} onChange={(v) => setMin(Number.isFinite(v) ? v : 0)} style={{ width: 90 }} />
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.max}</Text>
                    <InputNumber value={max} onChange={(v) => setMax(Number.isFinite(v) ? v : 100)} style={{ width: 90 }} />
                  </Space>
                </Space>
              </Card>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{result.css}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              <input
                type="range"
                className={result.className}
                min={min}
                max={max}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                style={{ '--value': String(value), '--min': String(min), '--max': String(max) }}
              />
              <Text code>{value}</Text>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>

          <Card
            title={t.output}
            style={{ marginTop: 24 }}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(result.css)}>{t.copy}</Button>}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{result.css}</code>
            </pre>
          </Card>

          <Card
            title={t.demo}
            style={{ marginTop: 24 }}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullDemo)}>{t.copy}</Button>}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{fullDemo}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildRangeSliderCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildRangeSliderCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
