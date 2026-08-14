import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildProgressRingCss,
  buildProgressRingHtml,
  buildProgressRingFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssProgressRingGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const DIRECTION_OPTIONS = {
  pt: [
    { label: 'Horário', value: 'clockwise' },
    { label: 'Anti-horário', value: 'counter-clockwise' },
  ],
  en: [
    { label: 'Clockwise', value: 'clockwise' },
    { label: 'Counter-clockwise', value: 'counter-clockwise' },
  ],
}

const EASING_OPTIONS = {
  pt: [
    { label: 'Ease-out', value: 'ease-out' },
    { label: 'Ease-in-out', value: 'ease-in-out' },
    { label: 'Linear', value: 'linear' },
    { label: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)' },
  ],
  en: [
    { label: 'Ease-out', value: 'ease-out' },
    { label: 'Ease-in-out', value: 'ease-in-out' },
    { label: 'Linear', value: 'linear' },
    { label: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)' },
  ],
}

const START_ANGLE_OPTIONS = {
  pt: [
    { label: 'Topo', value: -90 },
    { label: 'Direita', value: 0 },
    { label: 'Base', value: 90 },
    { label: 'Esquerda', value: 180 },
  ],
  en: [
    { label: 'Top', value: -90 },
    { label: 'Right', value: 0 },
    { label: 'Bottom', value: 90 },
    { label: 'Left', value: 180 },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Progress Ring CSS',
    intro: (
      <>
        Crie anéis de progresso circulares usando só SVG + CSS: ajuste tamanho,
        espessura, valor, cores do fundo/preenchimento/texto/centro, ponto de
        partida, direção e curva de animação. O preview usa o CSS exato que
        será copiado.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O truque é controlar <Text code>stroke-dasharray</Text> e{' '}
        <Text code>stroke-dashoffset</Text> do círculo SVG: o dasharray fixo
        equivale à circunferência e o offset diminui conforme a porcentagem.
        Use <Text code>transform: rotate(...)</Text> no SVG para mudar o ponto
        inicial e <Text code>transform: scaleX(-1)</Text> no anel de progresso
        para inverter a direção. O label fica absoluto no centro.
      </>
    ),
    settings: 'Configurações',
    geometry: 'Geometria',
    size: 'Tamanho (px)',
    strokeWidth: 'Espessura do anel (px)',
    value: 'Valor atual',
    max: 'Valor máximo',
    appearance: 'Aparência',
    trackColor: 'Cor do fundo',
    fillColor: 'Cor do preenchimento',
    textColor: 'Cor do texto',
    holeColor: 'Cor do centro',
    shadow: 'Sombra do anel',
    roundedCap: 'Extremidades arredondadas',
    behavior: 'Comportamento',
    direction: 'Direção',
    startAngle: 'Ponto de partida',
    animationDuration: 'Duração da animação (ms)',
    easing: 'Timing function',
    label: 'Label central',
    showLabel: 'Mostrar label',
    labelTemplate: 'Template do label',
    preview: 'Pré-visualização',
    previewHint: 'Mude o valor para ver a transição do anel.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssProgressRingGenerator.js. buildProgressRingCss calcula a circunferência a partir do raio e gera as regras de .progress-ring, .progress-ring__svg, .progress-ring__track, .progress-ring__circle e .progress-ring__label. buildProgressRingHtml monta o SVG semântico com atributos ARIA.',
  },
  en: {
    title: 'CSS Progress Ring Generator',
    intro: (
      <>
        Build circular progress rings using only SVG + CSS: tweak size, ring
        thickness, value, track/fill/text/center colors, starting point,
        direction and animation curve. The preview uses the exact CSS that
        will be copied.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The trick is controlling <Text code>stroke-dasharray</Text> and{' '}
        <Text code>stroke-dashoffset</Text> on the SVG circle: the fixed
        dasharray equals the circumference and the offset shrinks with the
        percentage. Use <Text code>transform: rotate(...)</Text> on the SVG
        to change the starting point and{' '}
        <Text code>transform: scaleX(-1)</Text> on the progress ring to flip
        the direction. The label is absolutely centered.
      </>
    ),
    settings: 'Settings',
    geometry: 'Geometry',
    size: 'Size (px)',
    strokeWidth: 'Ring thickness (px)',
    value: 'Current value',
    max: 'Maximum value',
    appearance: 'Appearance',
    trackColor: 'Track color',
    fillColor: 'Fill color',
    textColor: 'Text color',
    holeColor: 'Center color',
    shadow: 'Ring shadow',
    roundedCap: 'Rounded caps',
    behavior: 'Behavior',
    direction: 'Direction',
    startAngle: 'Starting point',
    animationDuration: 'Animation duration (ms)',
    easing: 'Timing function',
    label: 'Center label',
    showLabel: 'Show label',
    labelTemplate: 'Label template',
    preview: 'Preview',
    previewHint: 'Change the value to see the ring animate.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssProgressRingGenerator.js. buildProgressRingCss calculates the circumference from the radius and builds the rules for .progress-ring, .progress-ring__svg, .progress-ring__track, .progress-ring__circle and .progress-ring__label. buildProgressRingHtml builds the semantic SVG with ARIA attributes.',
  },
}

const PRESET_ORDER = ['default', 'success', 'warning', 'danger', 'minimal', 'neon']
const PRESET_LABELS = {
  pt: {
    default: 'Padrão',
    success: 'Sucesso',
    warning: 'Aviso',
    danger: 'Perigo',
    minimal: 'Minimal',
    neon: 'Neon',
  },
  en: {
    default: 'Default',
    success: 'Success',
    warning: 'Warning',
    danger: 'Danger',
    minimal: 'Minimal',
    neon: 'Neon',
  },
}

export default function CssProgressRingGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [size, setSize] = useState(DEFAULTS.size)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULTS.strokeWidth)
  const [value, setValue] = useState(DEFAULTS.value)
  const [max, setMax] = useState(DEFAULTS.max)
  const [trackColor, setTrackColor] = useState(DEFAULTS.trackColor)
  const [fillColor, setFillColor] = useState(DEFAULTS.fillColor)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [holeColor, setHoleColor] = useState(DEFAULTS.holeColor)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [roundedCap, setRoundedCap] = useState(DEFAULTS.roundedCap)
  const [direction, setDirection] = useState(DEFAULTS.direction)
  const [startAngle, setStartAngle] = useState(DEFAULTS.startAngle)
  const [animationDuration, setAnimationDuration] = useState(DEFAULTS.animationDuration)
  const [easing, setEasing] = useState(DEFAULTS.easing)
  const [showLabel, setShowLabel] = useState(DEFAULTS.showLabel)
  const [labelTemplate, setLabelTemplate] = useState(DEFAULTS.labelTemplate)

  const settings = useMemo(
    () => ({
      size,
      strokeWidth,
      value,
      max,
      trackColor,
      fillColor,
      textColor,
      holeColor,
      shadow,
      roundedCap,
      direction,
      startAngle,
      animationDuration,
      easing,
      showLabel,
      labelTemplate,
    }),
    [
      size,
      strokeWidth,
      value,
      max,
      trackColor,
      fillColor,
      textColor,
      holeColor,
      shadow,
      roundedCap,
      direction,
      startAngle,
      animationDuration,
      easing,
      showLabel,
      labelTemplate,
    ]
  )

  const cssOutput = useMemo(() => buildProgressRingCss(settings), [settings])
  const htmlOutput = useMemo(() => buildProgressRingHtml(settings), [settings])
  const fullOutput = useMemo(() => buildProgressRingFullDemo(settings), [settings])

  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const percent = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100))
  const label = labelTemplate.replace(/\{value\}/g, Math.round(percent))

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setSize(p.size ?? DEFAULTS.size)
    setStrokeWidth(p.strokeWidth ?? DEFAULTS.strokeWidth)
    setTrackColor(p.trackColor ?? DEFAULTS.trackColor)
    setFillColor(p.fillColor ?? DEFAULTS.fillColor)
    setTextColor(p.textColor ?? DEFAULTS.textColor)
    setHoleColor(p.holeColor ?? DEFAULTS.holeColor)
    setRoundedCap(p.roundedCap ?? DEFAULTS.roundedCap)
    setShadow(p.shadow ?? DEFAULTS.shadow)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const outputTabs = [
    {
      key: 'css',
      label: t.outputCss,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{cssOutput}</code>
        </pre>
      ),
    },
    {
      key: 'html',
      label: t.outputHtml,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{htmlOutput}</code>
        </pre>
      ),
    },
    {
      key: 'full',
      label: t.outputFull,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullOutput}</code>
        </pre>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>{t.presets}</Text>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESET_ORDER.map((key) => ({
                  value: key,
                  label: PRESET_LABELS[lang][key] || key,
                }))}
              />

              <Text strong style={{ marginTop: 8 }}>{t.geometry}</Text>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.size}</Text>
                <Text code>{size}px</Text>
              </Space>
              <Slider min={80} max={300} value={size} onChange={setSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.strokeWidth}</Text>
                <Text code>{strokeWidth}px</Text>
              </Space>
              <Slider min={2} max={50} value={strokeWidth} onChange={setStrokeWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.value}</Text>
                <InputNumber
                  min={0}
                  max={max}
                  value={value}
                  onChange={(v) => setValue(Number.isFinite(v) ? v : 0)}
                  style={{ width: 80 }}
                />
              </Space>
              <Slider min={0} max={max} value={value} onChange={setValue} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.max}</Text>
                <InputNumber
                  min={1}
                  max={1000}
                  value={max}
                  onChange={(v) => {
                    const newMax = Number.isFinite(v) ? Math.max(1, v) : 1
                    setMax(newMax)
                    if (value > newMax) setValue(newMax)
                  }}
                  style={{ width: 80 }}
                />
              </Space>

              <Text strong style={{ marginTop: 8 }}>{t.appearance}</Text>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.trackColor}</Text>
                <ColorPicker value={trackColor} onChange={setTrackColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.fillColor}</Text>
                <ColorPicker value={fillColor} onChange={setFillColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.textColor}</Text>
                <ColorPicker value={textColor} onChange={setTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.holeColor}</Text>
                <ColorPicker value={holeColor} onChange={setHoleColor} showText />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 0 20px rgba(22, 119, 255, 0.35)"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.roundedCap}</Text>
                <Switch size="small" checked={roundedCap} onChange={setRoundedCap} />
              </Space>

              <Text strong style={{ marginTop: 8 }}>{t.behavior}</Text>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.direction}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={direction}
                  onChange={setDirection}
                  options={DIRECTION_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.startAngle}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={startAngle}
                  onChange={setStartAngle}
                  options={START_ANGLE_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.animationDuration}</Text>
                <Text code>{animationDuration}ms</Text>
              </Space>
              <Slider min={0} max={2000} value={animationDuration} onChange={setAnimationDuration} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.easing}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={easing}
                  onChange={setEasing}
                  options={EASING_OPTIONS[lang]}
                />
              </Space>

              <Text strong style={{ marginTop: 8 }}>{t.label}</Text>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showLabel}</Text>
                <Switch size="small" checked={showLabel} onChange={setShowLabel} />
              </Space>

              {showLabel && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.labelTemplate}</Text>
                  <Input
                    value={labelTemplate}
                    onChange={(e) => setLabelTemplate(e.target.value)}
                    placeholder="{value}%"
                  />
                </Space>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 320,
              }}
            >
              <style>{cssOutput}</style>
              <div
                className="progress-ring"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin="0"
                aria-valuemax={max}
              >
                <svg
                  className="progress-ring__svg"
                  viewBox={`0 0 ${size} ${size}`}
                  transform={`rotate(${startAngle} ${center} ${center})`}
                >
                  <circle
                    className="progress-ring__track"
                    cx={center}
                    cy={center}
                    r={radius}
                  />
                  <circle
                    className="progress-ring__circle"
                    cx={center}
                    cy={center}
                    r={radius}
                  />
                </svg>
                {showLabel && <span className="progress-ring__label">{label}</span>}
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.presets}
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>
            {t.copy}
          </Button>
        }
      >
        <Tabs
          items={outputTabs}
          tabBarExtraContent={
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>
              {t.copy}
            </Button>
          }
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildProgressRingCss / buildProgressRingHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildProgressRingCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
