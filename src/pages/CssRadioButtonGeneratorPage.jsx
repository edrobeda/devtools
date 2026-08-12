import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildRadioButtonCss,
  buildRadioButtonHtml,
  buildRadioButtonFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssRadioButtonGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const MARKER_OPTIONS = {
  pt: [
    { label: 'Ponto', value: 'dot' },
    { label: 'Anel', value: 'ring' },
    { label: 'Check', value: 'check' },
  ],
  en: [
    { label: 'Dot', value: 'dot' },
    { label: 'Ring', value: 'ring' },
    { label: 'Check', value: 'check' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Radio Button CSS',
    intro: (
      <>
        Crie radio buttons customizados usando só CSS + um input real. Escolha o
        marcador (ponto, anel ou check), ajuste cores, tamanho, borda e transição;
        o preview usa o CSS exato que será copiado, então você clica e vê o
        resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O input real fica invisível (mas acessível) e um{' '}
        <Text code>{'<span class="radio-box">'}</Text> atua como a bolha visual.
        O marcador é desenhado no pseudo-elemento <Text code>::after</Text> e
        aparece via <Text code>{'transform: scale(...)'}</Text> quando{' '}
        <Text code>{'input:checked + .radio-box'}</Text> dispara. Sempre envolva o
        input e a bolha num <Text code>{'<label>'}</Text> e agrupe radios
        relacionados com o mesmo atributo <Text code>name</Text>.
      </>
    ),
    settings: 'Configurações',
    size: 'Tamanho (px)',
    activeColor: 'Cor ativa (checked)',
    inactiveColor: 'Cor inativa',
    markerColor: 'Cor do marcador',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    markerSize: 'Tamanho do marcador (%)',
    markerStyle: 'Estilo do marcador',
    transitionDuration: 'Duração da transição (ms)',
    shadow: 'Sombra da bolha',
    disabled: 'Preview desabilitado',
    checked: 'Preview marcado por padrão',
    preview: 'Pré-visualização',
    previewHint: 'O radio button abaixo usa exatamente o CSS gerado — clique para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssRadioButtonGenerator.js. buildRadioButtonCss monta as regras do container, do input oculto, da bolha .radio-box e do pseudo-elemento ::after com o marcador (dot, ring ou check), além dos estados :hover, :checked, :focus-visible e :disabled. buildRadioButtonHtml gera o markup semântico envolvido por <label>.',
  },
  en: {
    title: 'CSS Radio Button Generator',
    intro: (
      <>
        Build custom radio buttons using only CSS + a real input. Choose the
        marker (dot, ring or check), tweak colors, size, border and transition;
        the preview uses the exact CSS that will be copied, so you click and see
        the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The real input is visually hidden (but accessible) and a{' '}
        <Text code>{'<span class="radio-box">'}</Text> acts as the visual bubble.
        The marker is drawn in the <Text code>::after</Text> pseudo-element and
        reveals via <Text code>{'transform: scale(...)'}</Text> when{' '}
        <Text code>{'input:checked + .radio-box'}</Text> fires. Always wrap the
        input and bubble in a <Text code>{'<label>'}</Text> and group related
        radios with the same <Text code>name</Text> attribute.
      </>
    ),
    settings: 'Settings',
    size: 'Size (px)',
    activeColor: 'Active color (checked)',
    inactiveColor: 'Inactive color',
    markerColor: 'Marker color',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    markerSize: 'Marker size (%)',
    markerStyle: 'Marker style',
    transitionDuration: 'Transition duration (ms)',
    shadow: 'Bubble shadow',
    disabled: 'Preview disabled',
    checked: 'Preview checked by default',
    preview: 'Preview',
    previewHint: 'The radio button below uses exactly the generated CSS — click to test it.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssRadioButtonGenerator.js. buildRadioButtonCss builds the rules for the container, hidden input, .radio-box element and ::after pseudo-element with the marker (dot, ring or check), plus :hover, :checked, :focus-visible and :disabled states. buildRadioButtonHtml generates semantic markup wrapped in <label>.',
  },
}

const PRESET_ORDER = ['default', 'material', 'ios', 'minimal', 'check']

export default function CssRadioButtonGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [size, setSize] = useState(DEFAULTS.size)
  const [activeColor, setActiveColor] = useState(DEFAULTS.activeColor)
  const [inactiveColor, setInactiveColor] = useState(DEFAULTS.inactiveColor)
  const [markerColor, setMarkerColor] = useState(DEFAULTS.markerColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [markerSize, setMarkerSize] = useState(DEFAULTS.markerSize)
  const [markerStyle, setMarkerStyle] = useState(DEFAULTS.markerStyle)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [disabled, setDisabled] = useState(false)
  const [checked, setChecked] = useState(false)

  const settings = useMemo(
    () => ({
      size,
      activeColor,
      inactiveColor,
      markerColor,
      borderColor,
      borderWidth,
      markerSize,
      markerStyle,
      transitionDuration,
      shadow,
    }),
    [
      size,
      activeColor,
      inactiveColor,
      markerColor,
      borderColor,
      borderWidth,
      markerSize,
      markerStyle,
      transitionDuration,
      shadow,
    ]
  )

  const cssOutput = useMemo(() => buildRadioButtonCss(settings), [settings])
  const htmlOutput = useMemo(
    () => buildRadioButtonHtml({ ...settings, labelText: t.title, checked, disabled }),
    [settings, checked, disabled, t.title]
  )
  const fullOutput = useMemo(() => buildRadioButtonFullDemo({ ...settings, checked, disabled }), [settings, checked, disabled])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setSize(p.size)
    setActiveColor(p.activeColor)
    setInactiveColor(p.inactiveColor)
    setMarkerColor(p.markerColor)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setMarkerSize(p.markerSize)
    setMarkerStyle(p.markerStyle)
    setTransitionDuration(p.transitionDuration)
    setShadow(p.shadow)
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
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.markerStyle}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={markerStyle}
                  onChange={setMarkerStyle}
                  options={MARKER_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.size}</Text>
                <Text code>{size}px</Text>
              </Space>
              <Slider min={12} max={96} value={size} onChange={setSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.markerSize}</Text>
                <Text code>{markerSize}%</Text>
              </Space>
              <Slider min={10} max={90} value={markerSize} onChange={setMarkerSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.activeColor}</Text>
                <ColorPicker value={activeColor} onChange={setActiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.inactiveColor}</Text>
                <ColorPicker value={inactiveColor} onChange={setInactiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.markerColor}</Text>
                <ColorPicker value={markerColor} onChange={setMarkerColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={12} value={borderWidth} onChange={setBorderWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={800} value={transitionDuration} onChange={setTransitionDuration} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 2px 4px rgba(0,0,0,0.15)"
                />
              </Space>

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
              <label className="custom-radio">
                <input
                  type="radio"
                  name="radio-preview"
                  defaultChecked={checked}
                  disabled={disabled}
                />
                <span className="radio-box" />
                <span className="label-text">{t.title}</span>
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
            label: `${t.sourceCol} — buildRadioButtonCss / buildRadioButtonHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildRadioButtonCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
