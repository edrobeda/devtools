import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildSegmentedControlCss,
  buildSegmentedControlHtml,
  buildSegmentedControlFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssSegmentedControlGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const ORIENTATION_OPTIONS = {
  pt: [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
  ],
  en: [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Segmented Control CSS',
    intro: (
      <>
        Crie controles segmentados (segmented controls) usando so CSS + radio
        buttons. Defina de 2 a 5 opcoes, escolha orientacao horizontal/vertical,
        ajuste cores, padding, bordas e animacao; o preview usa o CSS exato
        que sera copiado, entao voce clica e ve o indicador deslizar em tempo
        real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O container <Text code>{'.segmented-control'}</Text> envolve um{' '}
        <Text code>{'<span class="segmented-indicator">'}</Text> posicionado
        absolutamente e varios <Text code>{'<label>'}</Text> com radio buttons.
        Cada opcao usa <Text code>{'input:checked ~ .option-text'}</Text> para
        trocar a cor do texto, enquanto regras{' '}
        <Text code>{':has(label:nth-child(N) input:checked)'}</Text> movem o
        indicador via <Text code>{'transform'}</Text>. O indicador desliza
        entre as opcoes usando <Text code>{'translateX'}</Text> ou{' '}
        <Text code>{'translateY'}</Text> com <Text code>{'calc()'}</Text>.
      </>
    ),
    settings: 'Configuracoes',
    options: 'Opcoes',
    addOption: 'Adicionar opcao',
    removeOption: 'Remover opcao',
    orientation: 'Orientacao',
    padding: 'Padding do container (px)',
    gap: 'Espacamento entre opcoes (px)',
    borderRadius: 'Border radius do container (px)',
    indicatorRadius: 'Border radius do indicador (px)',
    background: 'Fundo do container',
    indicatorBackground: 'Fundo do indicador',
    activeTextColor: 'Cor do texto ativo',
    inactiveTextColor: 'Cor do texto inativo',
    fontSize: 'Tamanho da fonte (px)',
    fontWeight: 'Peso da fonte',
    itemPaddingX: 'Padding horizontal dos itens (px)',
    itemPaddingY: 'Padding vertical dos itens (px)',
    transitionDuration: 'Duracao da transicao (ms)',
    indicatorShadow: 'Sombra do indicador',
    fullWidth: 'Largura total',
    disabled: 'Preview desabilitado',
    preview: 'Pre-visualizacao',
    previewHint: 'O controle abaixo usa exatamente o CSS gerado — clique nas opcoes para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Nao foi possivel copiar',
    presets: 'Presets',
    sourceCol: 'Codigo-fonte',
    sourceBody:
      'O nucleo vive em src/utils/cssSegmentedControlGenerator.js. buildSegmentedControlCss monta as regras do container, do input oculto, das labels, do texto .option-text e do indicador .segmented-indicator, incluindo as regras :has() que deslizam o indicador para cada opcao ativa. buildSegmentedControlHtml gera o markup semantico com role="radiogroup".',
  },
  en: {
    title: 'CSS Segmented Control Generator',
    intro: (
      <>
        Build segmented controls using only CSS + radio buttons. Define 2 to 5
        options, choose horizontal/vertical orientation, tweak colors, padding,
        borders and animation; the preview uses the exact CSS that will be
        copied, so you click and see the indicator slide in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The <Text code>{'.segmented-control'}</Text> wrapper holds an
        absolutely positioned <Text code>{'<span class="segmented-indicator">'}</Text>{' '}
        and several <Text code>{'<label>'}</Text> elements with radio buttons.
        Each option uses <Text code>{'input:checked ~ .option-text'}</Text> to
        swap text color, while <Text code>{':has(label:nth-child(N) input:checked)'}</Text>{' '}
        rules move the indicator via <Text code>{'transform'}</Text>. The
        indicator slides between options using <Text code>{'translateX'}</Text>{' '}
        or <Text code>{'translateY'}</Text> with <Text code>{'calc()'}</Text>.
      </>
    ),
    settings: 'Settings',
    options: 'Options',
    addOption: 'Add option',
    removeOption: 'Remove option',
    orientation: 'Orientation',
    padding: 'Container padding (px)',
    gap: 'Gap between options (px)',
    borderRadius: 'Container border radius (px)',
    indicatorRadius: 'Indicator border radius (px)',
    background: 'Container background',
    indicatorBackground: 'Indicator background',
    activeTextColor: 'Active text color',
    inactiveTextColor: 'Inactive text color',
    fontSize: 'Font size (px)',
    fontWeight: 'Font weight',
    itemPaddingX: 'Items horizontal padding (px)',
    itemPaddingY: 'Items vertical padding (px)',
    transitionDuration: 'Transition duration (ms)',
    indicatorShadow: 'Indicator shadow',
    fullWidth: 'Full width',
    disabled: 'Preview disabled',
    preview: 'Preview',
    previewHint: 'The control below uses exactly the generated CSS — click the options to test it.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssSegmentedControlGenerator.js. buildSegmentedControlCss builds the rules for the container, hidden input, labels, .option-text and .segmented-indicator, including the :has() rules that slide the indicator to each active option. buildSegmentedControlHtml generates semantic markup with role="radiogroup".',
  },
}

const PRESET_ORDER = ['default', 'ios', 'material', 'dark', 'minimal']

export default function CssSegmentedControlGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [options, setOptions] = useState(DEFAULTS.options)
  const [orientation, setOrientation] = useState(DEFAULTS.orientation)
  const [padding, setPadding] = useState(DEFAULTS.padding)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [indicatorBorderRadius, setIndicatorBorderRadius] = useState(DEFAULTS.indicatorBorderRadius)
  const [background, setBackground] = useState(DEFAULTS.background)
  const [indicatorBackground, setIndicatorBackground] = useState(DEFAULTS.indicatorBackground)
  const [activeTextColor, setActiveTextColor] = useState(DEFAULTS.activeTextColor)
  const [inactiveTextColor, setInactiveTextColor] = useState(DEFAULTS.inactiveTextColor)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [fontWeight, setFontWeight] = useState(DEFAULTS.fontWeight)
  const [itemPaddingX, setItemPaddingX] = useState(DEFAULTS.itemPaddingX)
  const [itemPaddingY, setItemPaddingY] = useState(DEFAULTS.itemPaddingY)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [indicatorShadow, setIndicatorShadow] = useState(DEFAULTS.indicatorShadow)
  const [fullWidth, setFullWidth] = useState(DEFAULTS.fullWidth)
  const [disabled, setDisabled] = useState(false)
  const [defaultIndex, setDefaultIndex] = useState(0)

  const settings = useMemo(
    () => ({
      options,
      orientation,
      padding,
      gap,
      borderRadius,
      indicatorBorderRadius,
      background,
      indicatorBackground,
      activeTextColor,
      inactiveTextColor,
      fontSize,
      fontWeight,
      itemPaddingX,
      itemPaddingY,
      transitionDuration,
      indicatorShadow,
      fullWidth,
      disabled,
      defaultIndex,
      ariaLabel: t.title,
    }),
    [
      options,
      orientation,
      padding,
      gap,
      borderRadius,
      indicatorBorderRadius,
      background,
      indicatorBackground,
      activeTextColor,
      inactiveTextColor,
      fontSize,
      fontWeight,
      itemPaddingX,
      itemPaddingY,
      transitionDuration,
      indicatorShadow,
      fullWidth,
      disabled,
      defaultIndex,
      t.title,
    ]
  )

  const cssOutput = useMemo(() => buildSegmentedControlCss(settings), [settings])
  const htmlOutput = useMemo(() => buildSegmentedControlHtml(settings), [settings])
  const fullOutput = useMemo(() => buildSegmentedControlFullDemo(settings), [settings])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setPadding(p.padding)
    setGap(p.gap)
    setBorderRadius(p.borderRadius)
    setBackground(p.background)
    setIndicatorBackground(p.indicatorBackground)
    setIndicatorBorderRadius(p.indicatorBorderRadius)
    setIndicatorShadow(p.indicatorShadow)
    setActiveTextColor(p.activeTextColor)
    setInactiveTextColor(p.inactiveTextColor)
    setFontSize(p.fontSize)
    setFontWeight(p.fontWeight)
    setItemPaddingX(p.itemPaddingX)
    setItemPaddingY(p.itemPaddingY)
    setTransitionDuration(p.transitionDuration)
    setFullWidth(p.fullWidth)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const updateOption = (index, value) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)))
  }

  const addOption = () => {
    setOptions((prev) => (prev.length < 5 ? [...prev, `${lang === 'pt' ? 'Opcao' : 'Option'} ${prev.length + 1}`] : prev))
  }

  const removeOption = () => {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.slice(0, -1)))
  }

  useEffect(() => {
    setDefaultIndex((idx) => Math.min(idx, options.length - 1))
  }, [options])

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
                <Text>{t.orientation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={orientation}
                  onChange={setOrientation}
                  options={ORIENTATION_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.options}</Text>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {options.map((opt, i) => (
                    <Input
                      key={i}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`${lang === 'pt' ? 'Opcao' : 'Option'} ${i + 1}`}
                    />
                  ))}
                </Space>
                <Space>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addOption}
                    disabled={options.length >= 5}
                  >
                    {t.addOption}
                  </Button>
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={removeOption}
                    disabled={options.length <= 2}
                  >
                    {t.removeOption}
                  </Button>
                </Space>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.padding}</Text>
                <Text code>{padding}px</Text>
              </Space>
              <Slider min={0} max={32} value={padding} onChange={setPadding} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={0} max={24} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={40} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.indicatorRadius}</Text>
                <Text code>{indicatorBorderRadius}px</Text>
              </Space>
              <Slider min={0} max={40} value={indicatorBorderRadius} onChange={setIndicatorBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.background}</Text>
                <ColorPicker value={background} onChange={setBackground} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.indicatorBackground}</Text>
                <ColorPicker value={indicatorBackground} onChange={setIndicatorBackground} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.activeTextColor}</Text>
                <ColorPicker value={activeTextColor} onChange={setActiveTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.inactiveTextColor}</Text>
                <ColorPicker value={inactiveTextColor} onChange={setInactiveTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={32} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontWeight}</Text>
                <Text code>{fontWeight}</Text>
              </Space>
              <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemPaddingX}</Text>
                <Text code>{itemPaddingX}px</Text>
              </Space>
              <Slider min={0} max={64} value={itemPaddingX} onChange={setItemPaddingX} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemPaddingY}</Text>
                <Text code>{itemPaddingY}px</Text>
              </Space>
              <Slider min={0} max={48} value={itemPaddingY} onChange={setItemPaddingY} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={800} value={transitionDuration} onChange={setTransitionDuration} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.indicatorShadow}</Text>
                <Input
                  value={indicatorShadow}
                  onChange={(e) => setIndicatorShadow(e.target.value)}
                  placeholder="0 1px 3px rgba(0,0,0,0.12)"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.fullWidth}</Text>
                <Switch size="small" checked={fullWidth} onChange={setFullWidth} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.disabled}</Text>
                <Switch size="small" checked={disabled} onChange={setDisabled} />
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
                minHeight: 240,
              }}
            >
              <style>{cssOutput}</style>
              <div
                className="segmented-control"
                role="radiogroup"
                aria-label={t.title}
                style={{ maxWidth: '100%' }}
              >
                <span className="segmented-indicator" aria-hidden="true" />
                {options.map((opt, i) => (
                  <label key={i}>
                    <input
                      type="radio"
                      name="segmented-preview"
                      value={i}
                      defaultChecked={i === defaultIndex}
                      disabled={disabled}
                    />
                    <span className="option-text">{opt}</span>
                  </label>
                ))}
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
            label: `${t.sourceCol} — buildSegmentedControlCss / buildSegmentedControlHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildSegmentedControlCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
