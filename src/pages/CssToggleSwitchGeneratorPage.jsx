import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildToggleSwitchCss,
  buildToggleSwitchHtml,
  buildToggleSwitchFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssToggleSwitchGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const STYLE_OPTIONS = {
  pt: [
    { label: 'iOS', value: 'ios' },
    { label: 'Material', value: 'material' },
    { label: 'Com labels', value: 'rounded' },
    { label: 'Quadrado', value: 'square' },
  ],
  en: [
    { label: 'iOS', value: 'ios' },
    { label: 'Material', value: 'material' },
    { label: 'With labels', value: 'rounded' },
    { label: 'Square', value: 'square' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Toggle Switch CSS',
    intro: (
      <>
        Crie switches/toggles funcionais usando só CSS + um checkbox. Escolha o
        estilo (iOS, Material, com labels ON/OFF ou quadrado), ajuste cores,
        tamanho, sombra e transição; o preview usa o CSS exato que será copiado,
        então você clica e vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O input real fica invisível (mas acessível) e o <Text code>{'<label>'}</Text>{' '}
        envolve o checkbox + um <Text code>{'<span class="track">'}</Text>. O
        thumb é o pseudo-elemento <Text code>::after</Text> da trilha, movido com{' '}
        <Text code>{'transform: translateX(...)'}</Text> quando o seletor{' '}
        <Text code>{'input:checked + .track'}</Text> dispara. Use{' '}
        <Text code>{'role="switch"'}</Text> no input para leitores de tela e{' '}
        <Text code>{'aria-checked'}</Text> se controlar via JavaScript. Evite
        estilizar com <Text code>{':checked'}</Text> em inputs dentro de labels
        aninhados de formas que quebrem o seletor de irmão adjacente.
      </>
    ),
    settings: 'Configurações',
    style: 'Estilo',
    width: 'Largura (px)',
    height: 'Altura (px)',
    activeColor: 'Cor ativa (checked)',
    inactiveColor: 'Cor inativa',
    thumbColor: 'Cor do thumb',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    thumbShadow: 'Sombra do thumb',
    transitionDuration: 'Duração da transição (ms)',
    showLabels: 'Mostrar labels ON/OFF',
    labelOn: 'Texto "ligado"',
    labelOff: 'Texto "desligado"',
    disabled: 'Preview desabilitado',
    checked: 'Preview ligado por padrão',
    preview: 'Pré-visualização',
    previewHint: 'O switch abaixo usa exatamente o CSS gerado — clique para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssToggleSwitchGenerator.js. buildToggleSwitchCss monta as regras do container, do input oculto, da track e do thumb ::after, além dos estados :checked, :focus-visible e :disabled. buildToggleSwitchHtml gera o markup semântico com role="switch" e, opcionalmente, data-on/data-off para labels internos.',
  },
  en: {
    title: 'CSS Toggle Switch Generator',
    intro: (
      <>
        Build working toggle switches using only CSS + a checkbox. Pick a style
        (iOS, Material, with ON/OFF labels or square), tweak colors, size, shadow
        and transition; the preview uses the exact CSS that will be copied, so
        you click and see the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The real input is visually hidden (but accessible) and the{' '}
        <Text code>{'<label>'}</Text> wraps the checkbox plus a{' '}
        <Text code>{'<span class="track">'}</Text>. The thumb is the{' '}
        <Text code>::after</Text> pseudo-element of the track, moved with{' '}
        <Text code>{'transform: translateX(...)'}</Text> when the{' '}
        <Text code>{'input:checked + .track'}</Text> selector fires. Use{' '}
        <Text code>{'role="switch"'}</Text> on the input for screen readers and{' '}
        <Text code>{'aria-checked'}</Text> if controlling it with JavaScript. Avoid
        nesting labels in ways that break the adjacent sibling selector.
      </>
    ),
    settings: 'Settings',
    style: 'Style',
    width: 'Width (px)',
    height: 'Height (px)',
    activeColor: 'Active color (checked)',
    inactiveColor: 'Inactive color',
    thumbColor: 'Thumb color',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    thumbShadow: 'Thumb shadow',
    transitionDuration: 'Transition duration (ms)',
    showLabels: 'Show ON/OFF labels',
    labelOn: '"On" text',
    labelOff: '"Off" text',
    disabled: 'Preview disabled',
    checked: 'Preview checked by default',
    preview: 'Preview',
    previewHint: 'The switch below uses exactly the generated CSS — click to test it.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssToggleSwitchGenerator.js. buildToggleSwitchCss builds the rules for the container, hidden input, track and ::after thumb, plus :checked, :focus-visible and :disabled states. buildToggleSwitchHtml generates semantic markup with role="switch" and optional data-on/data-off for inner labels.',
  },
}

const PRESET_ORDER = ['ios', 'material', 'rounded', 'square']

export default function CssToggleSwitchGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [style, setStyle] = useState(DEFAULTS.style)
  const [width, setWidth] = useState(DEFAULTS.width)
  const [height, setHeight] = useState(DEFAULTS.height)
  const [activeColor, setActiveColor] = useState(DEFAULTS.activeColor)
  const [inactiveColor, setInactiveColor] = useState(DEFAULTS.inactiveColor)
  const [thumbColor, setThumbColor] = useState(DEFAULTS.thumbColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [thumbShadow, setThumbShadow] = useState(DEFAULTS.thumbShadow)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [showLabels, setShowLabels] = useState(DEFAULTS.showLabels)
  const [labelOn, setLabelOn] = useState(DEFAULTS.labelOn)
  const [labelOff, setLabelOff] = useState(DEFAULTS.labelOff)
  const [disabled, setDisabled] = useState(DEFAULTS.disabled)
  const [checked, setChecked] = useState(DEFAULTS.checked)

  const settings = useMemo(
    () => ({
      style,
      width,
      height,
      activeColor,
      inactiveColor,
      thumbColor,
      borderColor,
      borderWidth,
      thumbShadow,
      transitionDuration,
      showLabels,
      labelOn,
      labelOff,
      disabled,
      checked,
    }),
    [
      style,
      width,
      height,
      activeColor,
      inactiveColor,
      thumbColor,
      borderColor,
      borderWidth,
      thumbShadow,
      transitionDuration,
      showLabels,
      labelOn,
      labelOff,
      disabled,
      checked,
    ]
  )

  const cssOutput = useMemo(() => buildToggleSwitchCss(settings), [settings])
  const htmlOutput = useMemo(() => buildToggleSwitchHtml({ ...settings, labelText: t.labelOn }), [settings, t.labelOn])
  const fullOutput = useMemo(() => buildToggleSwitchFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setStyle(key)
    setWidth(p.width)
    setHeight(p.height)
    setActiveColor(p.activeColor)
    setInactiveColor(p.inactiveColor)
    setThumbColor(p.thumbColor)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setThumbShadow(p.thumbShadow)
    setTransitionDuration(p.transitionDuration)
    setShowLabels(p.showLabels)
    if (p.showLabels) {
      setLabelOn(p.labelOn)
      setLabelOff(p.labelOff)
    }
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
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESET_ORDER.map((key) => ({
                  value: key,
                  label: STYLE_OPTIONS[lang].find((s) => s.value === key)?.label || key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.style}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={style}
                  onChange={setStyle}
                  options={STYLE_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.width}</Text>
                <Text code>{width}px</Text>
              </Space>
              <Slider min={24} max={200} value={width} onChange={setWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.height}</Text>
                <Text code>{height}px</Text>
              </Space>
              <Slider min={12} max={100} value={height} onChange={setHeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.activeColor}</Text>
                <ColorPicker value={activeColor} onChange={setActiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.inactiveColor}</Text>
                <ColorPicker value={inactiveColor} onChange={setInactiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.thumbColor}</Text>
                <ColorPicker value={thumbColor} onChange={setThumbColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={8} value={borderWidth} onChange={setBorderWidth} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.thumbShadow}</Text>
                <Input
                  value={thumbShadow}
                  onChange={(e) => setThumbShadow(e.target.value)}
                  placeholder="0 2px 4px rgba(0,0,0,0.25)"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={1000} value={transitionDuration} onChange={setTransitionDuration} />

              {(style === 'rounded' || style === 'square') && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{t.showLabels}</Text>
                    <Switch size="small" checked={showLabels} onChange={setShowLabels} />
                  </Space>
                  {showLabels && (
                    <>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{t.labelOn}</Text>
                        <Input value={labelOn} onChange={(e) => setLabelOn(e.target.value)} />
                      </Space>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{t.labelOff}</Text>
                        <Input value={labelOff} onChange={(e) => setLabelOff(e.target.value)} />
                      </Space>
                    </>
                  )}
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.disabled}</Text>
                <Switch size="small" checked={disabled} onChange={setDisabled} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.checked}</Text>
                <Switch size="small" checked={checked} onChange={setChecked} />
              </Space>
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
                minHeight: 180,
              }}
            >
              <style>{cssOutput}</style>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  role="switch"
                  defaultChecked={checked}
                  disabled={disabled}
                />
                <span
                  className="track"
                  data-on={showLabels ? labelOn : undefined}
                  data-off={showLabels ? labelOff : undefined}
                />
                <span className="label-text">{t.labelOn}</span>
              </label>
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
            label: `${t.sourceCol} — buildToggleSwitchCss / buildToggleSwitchHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildToggleSwitchCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
