import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildPricingTableCss,
  buildPricingTableHtml,
  buildPricingTableFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssPricingTableGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Limpo', value: 'clean' },
    { label: 'Contorno', value: 'outline' },
    { label: 'Gradiente', value: 'gradient' },
    { label: 'Escuro', value: 'dark' },
    { label: 'Colorido', value: 'colorful' },
  ],
  en: [
    { label: 'Clean', value: 'clean' },
    { label: 'Outline', value: 'outline' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Dark', value: 'dark' },
    { label: 'Colorful', value: 'colorful' },
  ],
}

const ALIGN_OPTIONS = {
  pt: [
    { label: 'Esquerda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
}

const ICON_OPTIONS = {
  pt: [
    { label: 'Check', value: 'check' },
    { label: 'Bolinha', value: 'dot' },
    { label: 'Nenhum', value: 'none' },
  ],
  en: [
    { label: 'Check', value: 'check' },
    { label: 'Dot', value: 'dot' },
    { label: 'None', value: 'none' },
  ],
}

const PRESET_ORDER = ['clean', 'outline', 'gradient', 'dark', 'colorful']

const translations = {
  pt: {
    title: 'Gerador de Pricing Table CSS',
    intro: (
      <>
        Monte tabelas de preços usando só CSS: grade responsiva de planos,
        preço/periodo, lista de features, botão CTA e destaque do plano
        &quot;mais popular&quot; com badge. O preview usa o CSS exato gerado,
        então você vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Cada plano é um <Text code>{'<article class="pricing__plan">'}</Text>{' '}
        dentro de uma grade <Text code>{'.pricing'}</Text>. O plano destacado
        recebe <Text code>{'.pricing__plan--highlight'}</Text> e usa{' '}
        <Text code>transform: scale(...)</Text> — por isso precisa de{' '}
        <Text code>z-index</Text> para não ficar cortado pelos vizinhos. As
        features usam <Text code>::before</Text> com máscara SVG, então a cor do
        ícone é trocada via <Text code>background-color</Text>. Linhas que
        começam com <Text code>-</Text> viram itens desabilitados (×).
      </>
    ),
    settings: 'Configurações visuais',
    plans: 'Planos',
    planName: 'Nome',
    planPrice: 'Preço',
    planPeriod: 'Período',
    planDescription: 'Descrição',
    planFeatures: 'Features (1 por linha; use - para desabilitar)',
    planHighlighted: 'Destacar como mais popular',
    variant: 'Variação visual',
    columns: 'Colunas',
    maxWidth: 'Largura máxima (px)',
    gap: 'Espaçamento entre planos (px)',
    padding: 'Padding interno (px)',
    borderRadius: 'Border radius (px)',
    borderWidth: 'Espessura da borda (px)',
    bgColor: 'Fundo do card',
    textColor: 'Cor do texto',
    borderColor: 'Cor da borda',
    shadow: 'Sombra do card',
    headerBg: 'Fundo do header',
    headerTextColor: 'Cor do texto do header',
    priceColor: 'Cor do preço',
    periodColor: 'Cor do período',
    featureColor: 'Cor das features',
    featureIconColor: 'Cor do ícone ativo',
    featureDisabledIconColor: 'Cor do ícone desabilitado',
    featureIcon: 'Estilo do ícone',
    buttonBg: 'Fundo do botão',
    buttonColor: 'Cor do texto do botão',
    buttonRadius: 'Border radius do botão (px)',
    highlightedBg: 'Fundo do plano destacado',
    highlightedBorderColor: 'Cor da borda do destacado',
    highlightedShadow: 'Sombra do destacado',
    highlightedScale: 'Escala do destacado',
    badgeBg: 'Fundo do badge',
    badgeColor: 'Cor do texto do badge',
    badgeText: 'Texto do badge',
    align: 'Alinhamento do texto',
    showFeatures: 'Mostrar lista de features',
    showButton: 'Mostrar botão CTA',
    showDescription: 'Mostrar descrição',
    buttonText: 'Texto do botão',
    preview: 'Pré-visualização',
    previewHint: 'A tabela abaixo usa exatamente o CSS gerado. Redimensione a janela para testar a responsividade.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssPricingTableGenerator.js. buildPricingTableCss monta as regras do container .pricing, dos cards .pricing__plan, header, preço, features, badge e botão. buildPricingTableHtml gera o markup semântico com <section>, <article> e <ul> de features.',
  },
  en: {
    title: 'CSS Pricing Table Generator',
    intro: (
      <>
        Build pricing tables using only CSS: responsive plan grid, price/period,
        feature list, CTA button and a highlighted &quot;most popular&quot; plan
        with a badge. The preview uses the exact generated CSS, so you see the
        final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        Each plan is an <Text code>{'<article class="pricing__plan">'}</Text>{' '}
        inside a <Text code>{'.pricing'}</Text> grid. The highlighted plan gets{' '}
        <Text code>{'.pricing__plan--highlight'}</Text> and uses{' '}
        <Text code>transform: scale(...)</Text>, so it needs{' '}
        <Text code>z-index</Text> to avoid being clipped by neighbors. Features
        use a <Text code>::before</Text> pseudo-element with an SVG mask, so the
        icon color is changed via <Text code>background-color</Text>. Lines
        starting with <Text code>-</Text> become disabled items (×).
      </>
    ),
    settings: 'Visual settings',
    plans: 'Plans',
    planName: 'Name',
    planPrice: 'Price',
    planPeriod: 'Period',
    planDescription: 'Description',
    planFeatures: 'Features (one per line; prefix - to disable)',
    planHighlighted: 'Highlight as most popular',
    variant: 'Visual variant',
    columns: 'Columns',
    maxWidth: 'Max width (px)',
    gap: 'Gap between plans (px)',
    padding: 'Inner padding (px)',
    borderRadius: 'Border radius (px)',
    borderWidth: 'Border width (px)',
    bgColor: 'Card background',
    textColor: 'Text color',
    borderColor: 'Border color',
    shadow: 'Card shadow',
    headerBg: 'Header background',
    headerTextColor: 'Header text color',
    priceColor: 'Price color',
    periodColor: 'Period color',
    featureColor: 'Feature color',
    featureIconColor: 'Active icon color',
    featureDisabledIconColor: 'Disabled icon color',
    featureIcon: 'Icon style',
    buttonBg: 'Button background',
    buttonColor: 'Button text color',
    buttonRadius: 'Button border radius (px)',
    highlightedBg: 'Highlighted plan background',
    highlightedBorderColor: 'Highlighted border color',
    highlightedShadow: 'Highlighted shadow',
    highlightedScale: 'Highlighted scale',
    badgeBg: 'Badge background',
    badgeColor: 'Badge text color',
    badgeText: 'Badge text',
    align: 'Text alignment',
    showFeatures: 'Show feature list',
    showButton: 'Show CTA button',
    showDescription: 'Show description',
    buttonText: 'Button text',
    preview: 'Preview',
    previewHint: 'The table below uses exactly the generated CSS. Resize the window to test responsiveness.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssPricingTableGenerator.js. buildPricingTableCss builds the rules for the .pricing container, .pricing__plan cards, header, price, features, badge and button. buildPricingTableHtml generates semantic markup with <section>, <article> and feature <ul>.',
  },
}

export default function CssPricingTableGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [columns, setColumns] = useState(DEFAULTS.columns)
  const [maxWidth, setMaxWidth] = useState(DEFAULTS.maxWidth)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [padding, setPadding] = useState(DEFAULTS.padding)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [headerBg, setHeaderBg] = useState(DEFAULTS.headerBg)
  const [headerTextColor, setHeaderTextColor] = useState(DEFAULTS.headerTextColor)
  const [priceColor, setPriceColor] = useState(DEFAULTS.priceColor)
  const [periodColor, setPeriodColor] = useState(DEFAULTS.periodColor)
  const [featureColor, setFeatureColor] = useState(DEFAULTS.featureColor)
  const [featureIconColor, setFeatureIconColor] = useState(DEFAULTS.featureIconColor)
  const [featureDisabledIconColor, setFeatureDisabledIconColor] = useState(DEFAULTS.featureDisabledIconColor)
  const [featureIcon, setFeatureIcon] = useState(DEFAULTS.featureIcon)
  const [buttonBg, setButtonBg] = useState(DEFAULTS.buttonBg)
  const [buttonColor, setButtonColor] = useState(DEFAULTS.buttonColor)
  const [buttonRadius, setButtonRadius] = useState(DEFAULTS.buttonRadius)
  const [highlightedBg, setHighlightedBg] = useState(DEFAULTS.highlightedBg)
  const [highlightedBorderColor, setHighlightedBorderColor] = useState(DEFAULTS.highlightedBorderColor)
  const [highlightedShadow, setHighlightedShadow] = useState(DEFAULTS.highlightedShadow)
  const [highlightedScale, setHighlightedScale] = useState(DEFAULTS.highlightedScale)
  const [badgeBg, setBadgeBg] = useState(DEFAULTS.badgeBg)
  const [badgeColor, setBadgeColor] = useState(DEFAULTS.badgeColor)
  const [badgeText, setBadgeText] = useState(DEFAULTS.badgeText)
  const [badgeTextEn, setBadgeTextEn] = useState(DEFAULTS.badgeTextEn)
  const [align, setAlign] = useState(DEFAULTS.align)
  const [showFeatures, setShowFeatures] = useState(DEFAULTS.showFeatures)
  const [showButton, setShowButton] = useState(DEFAULTS.showButton)
  const [showDescription, setShowDescription] = useState(DEFAULTS.showDescription)
  const [buttonText, setButtonText] = useState(DEFAULTS.buttonText)
  const [buttonTextEn, setButtonTextEn] = useState(DEFAULTS.buttonTextEn)
  const [plans, setPlans] = useState(DEFAULTS.plans)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setVariant(key)
    setBgColor(p.bgColor)
    setTextColor(p.textColor)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setShadow(p.shadow)
    setHeaderBg(p.headerBg)
    setHeaderTextColor(p.headerTextColor)
    setPriceColor(p.priceColor)
    setPeriodColor(p.periodColor)
    setFeatureColor(p.featureColor)
    setFeatureIconColor(p.featureIconColor)
    setFeatureDisabledIconColor(p.featureDisabledIconColor)
    setButtonBg(p.buttonBg)
    setButtonColor(p.buttonColor)
    setHighlightedBg(p.highlightedBg)
    setHighlightedBorderColor(p.highlightedBorderColor)
    setHighlightedShadow(p.highlightedShadow)
    setHighlightedScale(p.highlightedScale)
    setBadgeBg(p.badgeBg)
    setBadgeColor(p.badgeColor)
  }

  const updatePlan = (index, field, value) => {
    setPlans((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const updatePlanFeatures = (index, raw) => {
    const list = raw.split('\n').map((s) => s.trim()).filter(Boolean)
    updatePlan(index, 'features', list)
  }

  const settings = useMemo(
    () => ({
      variant,
      columns,
      maxWidth,
      gap,
      padding,
      borderRadius,
      bgColor,
      textColor,
      borderColor,
      borderWidth,
      shadow,
      headerBg,
      headerTextColor,
      priceColor,
      periodColor,
      featureColor,
      featureIconColor,
      featureDisabledIconColor,
      featureIcon,
      buttonBg,
      buttonColor,
      buttonRadius,
      highlightedBg,
      highlightedBorderColor,
      highlightedShadow,
      highlightedScale,
      badgeBg,
      badgeColor,
      badgeText,
      badgeTextEn,
      align,
      showFeatures,
      showButton,
      showDescription,
      buttonText,
      buttonTextEn,
      plans,
    }),
    [
      variant,
      columns,
      maxWidth,
      gap,
      padding,
      borderRadius,
      bgColor,
      textColor,
      borderColor,
      borderWidth,
      shadow,
      headerBg,
      headerTextColor,
      priceColor,
      periodColor,
      featureColor,
      featureIconColor,
      featureDisabledIconColor,
      featureIcon,
      buttonBg,
      buttonColor,
      buttonRadius,
      highlightedBg,
      highlightedBorderColor,
      highlightedShadow,
      highlightedScale,
      badgeBg,
      badgeColor,
      badgeText,
      badgeTextEn,
      align,
      showFeatures,
      showButton,
      showDescription,
      buttonText,
      buttonTextEn,
      plans,
    ]
  )

  const cssOutput = useMemo(() => buildPricingTableCss(settings), [settings])
  const htmlOutput = useMemo(() => buildPricingTableHtml(settings, lang), [settings, lang])
  const fullOutput = useMemo(() => buildPricingTableFullDemo(settings, lang), [settings, lang])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
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

  const renderColorControl = (label, value, onChange) => (
    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text>{label}</Text>
      <ColorPicker value={value} onChange={onChange} showText />
    </Space>
  )

  const renderSlider = (label, value, onChange, min, max, step = 1) => (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Text code>{value}{step === 1 ? 'px' : ''}</Text>
      </Space>
      <Slider min={min} max={max} step={step} value={value} onChange={onChange} />
    </>
  )

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
                  label: VARIANT_OPTIONS[lang].find((s) => s.value === key)?.label || key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.variant}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={variant}
                  onChange={setVariant}
                  options={VARIANT_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.align}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={align}
                  onChange={setAlign}
                  options={ALIGN_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.featureIcon}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={featureIcon}
                  onChange={setFeatureIcon}
                  options={ICON_OPTIONS[lang]}
                />
              </Space>

              {renderSlider(t.columns, columns, setColumns, 1, 4)}
              {renderSlider(t.maxWidth, maxWidth, setMaxWidth, 320, 1600)}
              {renderSlider(t.gap, gap, setGap, 0, 80)}
              {renderSlider(t.padding, padding, setPadding, 8, 80)}
              {renderSlider(t.borderRadius, borderRadius, setBorderRadius, 0, 64)}
              {renderSlider(t.borderWidth, borderWidth, setBorderWidth, 0, 8)}
              {renderSlider(t.buttonRadius, buttonRadius, setButtonRadius, 0, 32)}
              {renderSlider(t.highlightedScale, highlightedScale, setHighlightedScale, 1, 1.15, 0.01)}

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input value={shadow} onChange={(e) => setShadow(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.highlightedShadow}</Text>
                <Input value={highlightedShadow} onChange={(e) => setHighlightedShadow(e.target.value)} />
              </Space>

              {renderColorControl(t.bgColor, bgColor, setBgColor)}
              {renderColorControl(t.textColor, textColor, setTextColor)}
              {renderColorControl(t.borderColor, borderColor, setBorderColor)}
              {renderColorControl(t.headerBg, headerBg, setHeaderBg)}
              {renderColorControl(t.headerTextColor, headerTextColor, setHeaderTextColor)}
              {renderColorControl(t.priceColor, priceColor, setPriceColor)}
              {renderColorControl(t.periodColor, periodColor, setPeriodColor)}
              {renderColorControl(t.featureColor, featureColor, setFeatureColor)}
              {renderColorControl(t.featureIconColor, featureIconColor, setFeatureIconColor)}
              {renderColorControl(t.featureDisabledIconColor, featureDisabledIconColor, setFeatureDisabledIconColor)}
              {renderColorControl(t.buttonBg, buttonBg, setButtonBg)}
              {renderColorControl(t.buttonColor, buttonColor, setButtonColor)}
              {renderColorControl(t.highlightedBg, highlightedBg, setHighlightedBg)}
              {renderColorControl(t.highlightedBorderColor, highlightedBorderColor, setHighlightedBorderColor)}
              {renderColorControl(t.badgeBg, badgeBg, setBadgeBg)}
              {renderColorControl(t.badgeColor, badgeColor, setBadgeColor)}

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.badgeText}</Text>
                <Input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} />
              </Space>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.badgeText} (EN)</Text>
                <Input value={badgeTextEn} onChange={(e) => setBadgeTextEn(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.buttonText}</Text>
                <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
              </Space>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.buttonText} (EN)</Text>
                <Input value={buttonTextEn} onChange={(e) => setButtonTextEn(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showFeatures}</Text>
                  <Switch size="small" checked={showFeatures} onChange={setShowFeatures} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showButton}</Text>
                  <Switch size="small" checked={showButton} onChange={setShowButton} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showDescription}</Text>
                  <Switch size="small" checked={showDescription} onChange={setShowDescription} />
                </Space>
              </Space>
            </Space>
          </Card>

          <Card title={t.plans} style={{ marginTop: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {plans.map((plan, i) => (
                <Card
                  key={i}
                  type="inner"
                  title={`${t.plans} ${i + 1}${plan.highlighted ? ' ★' : ''}`}
                  extra={
                    <Switch
                      size="small"
                      checked={plan.highlighted}
                      onChange={(checked) => updatePlan(i, 'highlighted', checked)}
                    />
                  }
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>{t.planHighlighted}</Text>
                      <Switch
                        size="small"
                        checked={plan.highlighted}
                        onChange={(checked) => updatePlan(i, 'highlighted', checked)}
                      />
                    </Space>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.planName}</Text>
                      <Input value={plan.name} onChange={(e) => updatePlan(i, 'name', e.target.value)} />
                    </Space>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.planPrice}</Text>
                      <Input value={plan.price} onChange={(e) => updatePlan(i, 'price', e.target.value)} />
                    </Space>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.planPeriod}</Text>
                      <Input value={plan.period} onChange={(e) => updatePlan(i, 'period', e.target.value)} />
                    </Space>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.planDescription}</Text>
                      <Input value={plan.description} onChange={(e) => updatePlan(i, 'description', e.target.value)} />
                    </Space>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.planFeatures}</Text>
                      <Input.TextArea
                        rows={4}
                        value={plan.features.join('\n')}
                        onChange={(e) => updatePlanFeatures(i, e.target.value)}
                      />
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{cssOutput}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                minHeight: 320,
                overflow: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
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
            label: `${t.sourceCol} — buildPricingTableCss / buildPricingTableHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildPricingTableCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
