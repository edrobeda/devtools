import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildCustomCheckboxCss,
  buildCustomCheckboxHtml,
  buildCustomCheckboxFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssCustomCheckboxGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const SHAPE_OPTIONS = {
  pt: [
    { label: 'Arredondado', value: 'rounded' },
    { label: 'Círculo', value: 'circle' },
    { label: 'Quadrado', value: 'square' },
  ],
  en: [
    { label: 'Rounded', value: 'rounded' },
    { label: 'Circle', value: 'circle' },
    { label: 'Square', value: 'square' },
  ],
}

const CHECK_OPTIONS = {
  pt: [
    { label: 'Check', value: 'check' },
    { label: 'Traço', value: 'dash' },
  ],
  en: [
    { label: 'Check', value: 'check' },
    { label: 'Dash', value: 'dash' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Checkbox CSS',
    intro: (
      <>
        Crie checkboxes customizados usando só CSS + um input real. Escolha a
        forma (arredondado, círculo ou quadrado), ajuste cores, tamanho, borda,
        espessura do check e transição; o preview usa o CSS exato que será
        copiado, então você clica e vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O input real fica invisível (mas acessível) e um{' '}
        <Text code>{'<span class="box">'}</Text> atua como a caixa visual. O
        check é desenhado no pseudo-elemento <Text code>::after</Text> usando
        bordas em L ou um traço sólido, e aparece via{' '}
        <Text code>{'transform: scale(...)'}</Text> quando{' '}
        <Text code>{'input:checked + .box'}</Text> dispara. Sempre envolva o
        input e a caixa num <Text code>{'<label>'}</Text> para que o clique no
        texto também marque a opção.
      </>
    ),
    settings: 'Configurações',
    shape: 'Forma',
    size: 'Tamanho (px)',
    borderRadius: 'Border radius (px)',
    activeColor: 'Cor ativa (checked)',
    inactiveColor: 'Cor inativa',
    checkColor: 'Cor do check',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    checkWidth: 'Espessura do check',
    transitionDuration: 'Duração da transição (ms)',
    checkStyle: 'Estilo do marcador',
    shadow: 'Sombra da caixa',
    disabled: 'Preview desabilitado',
    checked: 'Preview marcado por padrão',
    preview: 'Pré-visualização',
    previewHint: 'O checkbox abaixo usa exatamente o CSS gerado — clique para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssCustomCheckboxGenerator.js. buildCustomCheckboxCss monta as regras do container, do input oculto, da caixa .box e do pseudo-elemento ::after com o marcador (check ou dash), além dos estados :hover, :checked, :focus-visible e :disabled. buildCustomCheckboxHtml gera o markup semântico envolvido por <label>.',
  },
  en: {
    title: 'CSS Custom Checkbox Generator',
    intro: (
      <>
        Build custom checkboxes using only CSS + a real input. Pick a shape
        (rounded, circle or square), tweak colors, size, border, check width
        and transition; the preview uses the exact CSS that will be copied, so
        you click and see the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The real input is visually hidden (but accessible) and a{' '}
        <Text code>{'<span class="box">'}</Text> acts as the visual box. The
        check mark is drawn in the <Text code>::after</Text> pseudo-element
        using L-shaped borders or a solid dash, and reveals via{' '}
        <Text code>{'transform: scale(...)'}</Text> when{' '}
        <Text code>{'input:checked + .box'}</Text> fires. Always wrap the input
        and the box in a <Text code>{'<label>'}</Text> so clicking the text
        toggles the option.
      </>
    ),
    settings: 'Settings',
    shape: 'Shape',
    size: 'Size (px)',
    borderRadius: 'Border radius (px)',
    activeColor: 'Active color (checked)',
    inactiveColor: 'Inactive color',
    checkColor: 'Check color',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    checkWidth: 'Check width',
    transitionDuration: 'Transition duration (ms)',
    checkStyle: 'Marker style',
    shadow: 'Box shadow',
    disabled: 'Preview disabled',
    checked: 'Preview checked by default',
    preview: 'Preview',
    previewHint: 'The checkbox below uses exactly the generated CSS — click to test it.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssCustomCheckboxGenerator.js. buildCustomCheckboxCss builds the rules for the container, hidden input, .box element and ::after pseudo-element with the marker (check or dash), plus :hover, :checked, :focus-visible and :disabled states. buildCustomCheckboxHtml generates semantic markup wrapped in <label>.',
  },
}

const PRESET_ORDER = ['rounded', 'circle', 'square', 'minimal', 'dash']

export default function CssCustomCheckboxGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [style, setStyle] = useState(DEFAULTS.style)
  const [size, setSize] = useState(DEFAULTS.size)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [activeColor, setActiveColor] = useState(DEFAULTS.activeColor)
  const [inactiveColor, setInactiveColor] = useState(DEFAULTS.inactiveColor)
  const [checkColor, setCheckColor] = useState(DEFAULTS.checkColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [checkWidth, setCheckWidth] = useState(DEFAULTS.checkWidth)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [checkStyle, setCheckStyle] = useState(DEFAULTS.checkStyle)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [disabled, setDisabled] = useState(false)
  const [checked, setChecked] = useState(false)

  const settings = useMemo(
    () => ({
      style,
      size,
      borderRadius,
      activeColor,
      inactiveColor,
      checkColor,
      borderColor,
      borderWidth,
      checkWidth,
      transitionDuration,
      checkStyle,
      shadow,
    }),
    [
      style,
      size,
      borderRadius,
      activeColor,
      inactiveColor,
      checkColor,
      borderColor,
      borderWidth,
      checkWidth,
      transitionDuration,
      checkStyle,
      shadow,
    ]
  )

  const cssOutput = useMemo(() => buildCustomCheckboxCss(settings), [settings])
  const htmlOutput = useMemo(
    () => buildCustomCheckboxHtml({ ...settings, labelText: t.title, checked, disabled }),
    [settings, checked, disabled, t.title]
  )
  const fullOutput = useMemo(() => buildCustomCheckboxFullDemo({ ...settings, checked, disabled }), [settings, checked, disabled])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setStyle(p.style)
    setSize(p.size)
    setBorderRadius(p.borderRadius)
    setActiveColor(p.activeColor)
    setInactiveColor(p.inactiveColor)
    setCheckColor(p.checkColor)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setCheckWidth(p.checkWidth)
    setTransitionDuration(p.transitionDuration)
    setCheckStyle(p.checkStyle)
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
                <Text>{t.shape}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={style}
                  onChange={setStyle}
                  options={SHAPE_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.checkStyle}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={checkStyle}
                  onChange={setCheckStyle}
                  options={CHECK_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.size}</Text>
                <Text code>{size}px</Text>
              </Space>
              <Slider min={12} max={96} value={size} onChange={setSize} />

              {style !== 'circle' && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.borderRadius}</Text>
                    <Text code>{borderRadius}px</Text>
                  </Space>
                  <Slider min={0} max={Math.floor(size / 2)} value={borderRadius} onChange={setBorderRadius} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.activeColor}</Text>
                <ColorPicker value={activeColor} onChange={setActiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.inactiveColor}</Text>
                <ColorPicker value={inactiveColor} onChange={setInactiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.checkColor}</Text>
                <ColorPicker value={checkColor} onChange={setCheckColor} showText />
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
                <Text>{t.checkWidth}</Text>
                <Text code>{checkWidth}px</Text>
              </Space>
              <Slider min={1} max={12} value={checkWidth} onChange={setCheckWidth} />

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
              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  defaultChecked={checked}
                  disabled={disabled}
                />
                <span className="box" />
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
            label: `${t.sourceCol} — buildCustomCheckboxCss / buildCustomCheckboxHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildCustomCheckboxCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
