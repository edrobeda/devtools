import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, InputNumber,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, OrderedListOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildStepperCss,
  buildStepperHtml,
  buildStepperFullDemo,
  STEPPER_PRESETS,
} from '../utils/cssStepperGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const DEFAULT_ITEMS = {
  pt: [
    { title: 'Conta', desc: 'Crie sua conta' },
    { title: 'Plano', desc: 'Escolha o plano' },
    { title: 'Pagamento', desc: 'Dados do cartão' },
    { title: 'Revisão', desc: 'Confirme tudo' },
  ],
  en: [
    { title: 'Account', desc: 'Create your account' },
    { title: 'Plan', desc: 'Choose a plan' },
    { title: 'Payment', desc: 'Card details' },
    { title: 'Review', desc: 'Confirm everything' },
  ],
}

const SHAPE_OPTIONS = {
  pt: [
    { label: 'Círculo', value: 'circle' },
    { label: 'Arredondado', value: 'rounded' },
    { label: 'Pílula', value: 'pill' },
    { label: 'Quadrado', value: 'square' },
  ],
  en: [
    { label: 'Circle', value: 'circle' },
    { label: 'Rounded', value: 'rounded' },
    { label: 'Pill', value: 'pill' },
    { label: 'Square', value: 'square' },
  ],
}

const CONNECTOR_STYLE_OPTIONS = {
  pt: [
    { label: 'Sólido', value: 'solid' },
    { label: 'Tracejado', value: 'dashed' },
    { label: 'Pontilhado', value: 'dotted' },
  ],
  en: [
    { label: 'Solid', value: 'solid' },
    { label: 'Dashed', value: 'dashed' },
    { label: 'Dotted', value: 'dotted' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Stepper/Wizard CSS',
    intro: (
      <>
        Monte steppers e wizards usando só CSS: escolha orientação
        (horizontal/vertical), formato do marcador, cores de cada estado
        (pendente, ativo, concluído), conector e tipografia. O preview usa o
        CSS exato que será copiado, então você clica nos passos e vê o
        estado ativo mudar em tempo real.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        O HTML gerado usa uma <Text code>{'<ol>'}</Text> com{' '}
        <Text code>{'aria-label="progress"'}</Text> e o passo ativo recebe{' '}
        <Text code>{'aria-current="step"'}</Text>. Os estados são classes
        utilitárias —{' '}
        <Text code>{'.stepper__item--active'}</Text> e{' '}
        <Text code>{'.stepper__item--completed'}</Text> — então no seu
        framework favorito você pode aplicá-las dinamicamente. O conector é
        um pseudo-elemento <Text code>::after</Text> no item, o que mantém o
        markup enxuto.
      </>
    ),
    settings: 'Configurações',
    items: 'Passos (título | descrição)',
    orientation: 'Orientação',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    align: 'Alinhamento',
    alignStart: 'Início',
    alignCenter: 'Centro',
    alignEnd: 'Fim',
    shape: 'Forma do marcador',
    marker: 'Marcador',
    size: 'Tamanho',
    borderWidth: 'Espessura da borda',
    connector: 'Conector',
    connectorWidth: 'Espessura',
    connectorStyle: 'Estilo',
    gap: 'Espaçamento',
    typography: 'Tipografia',
    titleSize: 'Título',
    descSize: 'Descrição',
    showDescription: 'Mostrar descrição',
    showCheckOnComplete: 'Check no concluído',
    colors: 'Cores',
    pending: 'Pendente',
    active: 'Ativo',
    completed: 'Concluído',
    bg: 'Fundo',
    border: 'Borda',
    text: 'Texto',
    titleColor: 'Título',
    descColor: 'Descrição',
    connectorColor: 'Conector',
    connectorActiveColor: 'Conector ativo',
    preview: 'Pré-visualização',
    previewHint: 'O stepper abaixo usa exatamente o CSS gerado. Clique em um passo para torná-lo ativo.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssStepperGenerator.js. buildStepperCss monta as regras do container, dos itens, do marcador e do conector conforme a orientação escolhida; buildStepperHtml gera o markup semântico com <ol>, <li>, aria-current e spans internos para título/descrição.',
  },
  en: {
    title: 'CSS Stepper/Wizard Generator',
    intro: (
      <>
        Build CSS-only steppers and wizards: choose orientation
        (horizontal/vertical), marker shape, colors for each state (pending,
        active, completed), connector and typography. The preview uses the
        exact CSS that will be copied, so you can click steps and see the
        active state change in real time.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        The generated HTML uses an <Text code>{'<ol>'}</Text> with{' '}
        <Text code>{'aria-label="progress"'}</Text> and the active step gets{' '}
        <Text code>{'aria-current="step"'}</Text>. States are utility
        classes — <Text code>{'.stepper__item--active'}</Text> and{' '}
        <Text code>{'.stepper__item--completed'}</Text> — so in your
        favorite framework you can apply them dynamically. The connector is
        a <Text code>::after</Text> pseudo-element on the item, keeping the
        markup lean.
      </>
    ),
    settings: 'Settings',
    items: 'Steps (title | description)',
    orientation: 'Orientation',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    align: 'Alignment',
    alignStart: 'Start',
    alignCenter: 'Center',
    alignEnd: 'End',
    shape: 'Marker shape',
    marker: 'Marker',
    size: 'Size',
    borderWidth: 'Border width',
    connector: 'Connector',
    connectorWidth: 'Width',
    connectorStyle: 'Style',
    gap: 'Gap',
    typography: 'Typography',
    titleSize: 'Title',
    descSize: 'Description',
    showDescription: 'Show description',
    showCheckOnComplete: 'Checkmark on completed',
    colors: 'Colors',
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
    bg: 'Background',
    border: 'Border',
    text: 'Text',
    titleColor: 'Title',
    descColor: 'Description',
    connectorColor: 'Connector',
    connectorActiveColor: 'Active connector',
    preview: 'Preview',
    previewHint: 'The stepper below uses exactly the generated CSS. Click a step to make it active.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssStepperGenerator.js. buildStepperCss builds the container, item, marker and connector rules based on the chosen orientation; buildStepperHtml generates semantic markup with <ol>, <li>, aria-current and inner spans for title/description.',
  },
}

const PREVIEW_CLASS = 'devtools-stepper-preview'

function parseItems(text) {
  return text
    .split('\n')
    .map((line) => {
      const [title, desc] = line.split('|').map((s) => s.trim())
      return { title: title || '', desc: desc || '' }
    })
    .filter((it) => it.title)
}

export default function CssStepperGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [itemsText, setItemsText] = useState(
    DEFAULT_ITEMS[lang].map((it) => `${it.title} | ${it.desc}`).join('\n')
  )
  const [orientation, setOrientation] = useState('horizontal')
  const [align, setAlign] = useState('center')
  const [shape, setShape] = useState('circle')
  const [size, setSize] = useState(32)
  const [borderWidth, setBorderWidth] = useState(2)
  const [connectorWidth, setConnectorWidth] = useState(2)
  const [connectorStyle, setConnectorStyle] = useState('solid')
  const [gap, setGap] = useState(24)
  const [titleSize, setTitleSize] = useState(14)
  const [descSize, setDescSize] = useState(12)
  const [showDescription, setShowDescription] = useState(true)
  const [showCheckOnComplete, setShowCheckOnComplete] = useState(true)
  const [activeStep, setActiveStep] = useState(1)

  const [pendingBg, setPendingBg] = useState('#ffffff')
  const [pendingBorder, setPendingBorder] = useState('#d9d9d9')
  const [pendingText, setPendingText] = useState('#595959')
  const [activeBg, setActiveBg] = useState('#1677ff')
  const [activeBorder, setActiveBorder] = useState('#1677ff')
  const [activeText, setActiveText] = useState('#ffffff')
  const [completedBg, setCompletedBg] = useState('#52c41a')
  const [completedBorder, setCompletedBorder] = useState('#52c41a')
  const [completedText, setCompletedText] = useState('#ffffff')
  const [titleColor, setTitleColor] = useState('#262626')
  const [descColor, setDescColor] = useState('#8c8c8c')
  const [connectorColor, setConnectorColor] = useState('#d9d9d9')
  const [connectorActiveColor, setConnectorActiveColor] = useState('#1677ff')

  const items = useMemo(() => parseItems(itemsText), [itemsText])

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      orientation,
      align,
      shape,
      size,
      borderWidth,
      connectorWidth,
      connectorStyle,
      gap,
      titleSize,
      descSize,
      showDescription,
      showCheckOnComplete,
      pendingBg,
      pendingBorder,
      pendingText,
      activeBg,
      activeBorder,
      activeText,
      completedBg,
      completedBorder,
      completedText,
      titleColor,
      descColor,
      connectorColor,
      connectorActiveColor,
    }),
    [
      orientation, align, shape, size, borderWidth, connectorWidth, connectorStyle,
      gap, titleSize, descSize, showDescription, showCheckOnComplete,
      pendingBg, pendingBorder, pendingText,
      activeBg, activeBorder, activeText,
      completedBg, completedBorder, completedText,
      titleColor, descColor, connectorColor, connectorActiveColor,
    ]
  )

  const css = useMemo(() => buildStepperCss(options), [options])
  const html = useMemo(() => buildStepperHtml(items, options), [items, options])
  const fullDemo = useMemo(() => buildStepperFullDemo(items, options), [items, options])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = STEPPER_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.orientation !== undefined) setOrientation(o.orientation)
    if (o.align !== undefined) setAlign(o.align)
    if (o.shape !== undefined) setShape(o.shape)
    if (o.size !== undefined) setSize(o.size)
    if (o.borderWidth !== undefined) setBorderWidth(o.borderWidth)
    if (o.connectorWidth !== undefined) setConnectorWidth(o.connectorWidth)
    if (o.connectorStyle !== undefined) setConnectorStyle(o.connectorStyle)
    if (o.gap !== undefined) setGap(o.gap)
    if (o.titleSize !== undefined) setTitleSize(o.titleSize)
    if (o.descSize !== undefined) setDescSize(o.descSize)
    if (o.showDescription !== undefined) setShowDescription(o.showDescription)
    if (o.showCheckOnComplete !== undefined) setShowCheckOnComplete(o.showCheckOnComplete)
    if (o.pendingBg !== undefined) setPendingBg(o.pendingBg)
    if (o.pendingBorder !== undefined) setPendingBorder(o.pendingBorder)
    if (o.pendingText !== undefined) setPendingText(o.pendingText)
    if (o.activeBg !== undefined) setActiveBg(o.activeBg)
    if (o.activeBorder !== undefined) setActiveBorder(o.activeBorder)
    if (o.activeText !== undefined) setActiveText(o.activeText)
    if (o.completedBg !== undefined) setCompletedBg(o.completedBg)
    if (o.completedBorder !== undefined) setCompletedBorder(o.completedBorder)
    if (o.completedText !== undefined) setCompletedText(o.completedText)
    if (o.titleColor !== undefined) setTitleColor(o.titleColor)
    if (o.descColor !== undefined) setDescColor(o.descColor)
    if (o.connectorColor !== undefined) setConnectorColor(o.connectorColor)
    if (o.connectorActiveColor !== undefined) setConnectorActiveColor(o.connectorActiveColor)
  }

  const renderPreviewItems = () => {
    if (items.length === 0) {
      return (
        <li className={`${PREVIEW_CLASS}__item ${PREVIEW_CLASS}__item--active`} aria-current="step">
          <span className={`${PREVIEW_CLASS}__marker`}><span>1</span></span>
          <span className={`${PREVIEW_CLASS}__content`}>
            <span className={`${PREVIEW_CLASS}__title`}>Step 1</span>
          </span>
        </li>
      )
    }

    return items.map((it, idx) => {
      const stepNumber = idx + 1
      const isActive = stepNumber === activeStep
      const isCompleted = stepNumber < activeStep
      const stateClass = isActive
        ? `${PREVIEW_CLASS}__item--active`
        : isCompleted
          ? `${PREVIEW_CLASS}__item--completed`
          : ''
      return (
        <li
          key={`${it.title}-${idx}`}
          className={`${PREVIEW_CLASS}__item ${stateClass}`}
          aria-current={isActive ? 'step' : undefined}
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveStep(stepNumber)}
        >
          <span className={`${PREVIEW_CLASS}__marker`}><span>{stepNumber}</span></span>
          <span className={`${PREVIEW_CLASS}__content`}>
            <span className={`${PREVIEW_CLASS}__title`}>{it.title}</span>
            {showDescription && it.desc && (
              <span className={`${PREVIEW_CLASS}__desc`}>{it.desc}</span>
            )}
          </span>
        </li>
      )
    })
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><OrderedListOutlined /> {t.title}</Title>
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
                options={STEPPER_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.items}</Text>
                <TextArea
                  rows={5}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder={DEFAULT_ITEMS[lang].map((it) => `${it.title} | ${it.desc}`).join('\n')}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.orientation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={orientation}
                  onChange={setOrientation}
                  options={[
                    { label: t.horizontal, value: 'horizontal' },
                    { label: t.vertical, value: 'vertical' },
                  ]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.align}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={align}
                  onChange={setAlign}
                  options={[
                    { label: t.alignStart, value: 'start' },
                    { label: t.alignCenter, value: 'center' },
                    { label: t.alignEnd, value: 'end' },
                  ]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shape}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={shape}
                  onChange={setShape}
                  options={SHAPE_OPTIONS[lang]}
                />
              </Space>

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.size}</Text>
                    <InputNumber min={20} max={80} value={size} onChange={setSize} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderWidth}</Text>
                    <InputNumber min={0} max={8} value={borderWidth} onChange={setBorderWidth} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.connector}</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.connectorWidth}</Text>
                    <InputNumber min={1} max={10} value={connectorWidth} onChange={setConnectorWidth} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.connectorStyle}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={connectorStyle}
                      onChange={setConnectorStyle}
                      options={CONNECTOR_STYLE_OPTIONS[lang]}
                    />
                  </Space>
                </Col>
              </Row>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.gap}</Text>
                <Slider min={8} max={64} value={gap} onChange={setGap} />
              </Space>

              <Text strong>{t.typography}</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.titleSize}</Text>
                    <InputNumber min={10} max={32} value={titleSize} onChange={setTitleSize} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.descSize}</Text>
                    <InputNumber min={10} max={24} value={descSize} onChange={setDescSize} style={{ width: '100%' }} />
                  </Space>
                </Col>
              </Row>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showDescription}</Text>
                <Switch checked={showDescription} onChange={setShowDescription} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.showCheckOnComplete}</Text>
                <Switch checked={showCheckOnComplete} onChange={setShowCheckOnComplete} />
              </Space>

              <Text strong>{t.colors}</Text>
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Text type="secondary">{t.pending}</Text>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bg}</Text>
                    <ColorPicker value={pendingBg} onChange={setPendingBg} showText />
                  </Space>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.border}</Text>
                    <ColorPicker value={pendingBorder} onChange={setPendingBorder} showText />
                  </Space>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.text}</Text>
                    <ColorPicker value={pendingText} onChange={setPendingText} showText />
                  </Space>
                </Col>

                <Col span={24}>
                  <Text type="secondary">{t.active}</Text>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bg}</Text>
                    <ColorPicker value={activeBg} onChange={setActiveBg} showText />
                  </Space>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.border}</Text>
                    <ColorPicker value={activeBorder} onChange={setActiveBorder} showText />
                  </Space>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.text}</Text>
                    <ColorPicker value={activeText} onChange={setActiveText} showText />
                  </Space>
                </Col>

                <Col span={24}>
                  <Text type="secondary">{t.completed}</Text>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bg}</Text>
                    <ColorPicker value={completedBg} onChange={setCompletedBg} showText />
                  </Space>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.border}</Text>
                    <ColorPicker value={completedBorder} onChange={setCompletedBorder} showText />
                  </Space>
                </Col>
                <Col span={8}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.text}</Text>
                    <ColorPicker value={completedText} onChange={setCompletedText} showText />
                  </Space>
                </Col>

                <Col span={24}>
                  <Text type="secondary">{t.typography}</Text>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.titleColor}</Text>
                    <ColorPicker value={titleColor} onChange={setTitleColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.descColor}</Text>
                    <ColorPicker value={descColor} onChange={setDescColor} showText />
                  </Space>
                </Col>

                <Col span={24}>
                  <Text type="secondary">{t.connector}</Text>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.connectorColor}</Text>
                    <ColorPicker value={connectorColor} onChange={setConnectorColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.connectorActiveColor}</Text>
                    <ColorPicker value={connectorActiveColor} onChange={setConnectorActiveColor} showText />
                  </Space>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{css}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 32,
                background: '#fafafa',
                minHeight: 200,
                display: 'flex',
                alignItems: orientation === 'horizontal' ? 'center' : 'flex-start',
                justifyContent: orientation === 'horizontal' ? 'center' : 'flex-start',
                overflow: 'auto',
              }}
            >
              <ol className={PREVIEW_CLASS} aria-label="Progress">
                {renderPreviewItems()}
              </ol>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.outputCss}
        extra={(
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(css)}>
            {t.copy}
          </Button>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{css}</code>
        </pre>
      </Card>

      <Card
        title={t.outputHtml}
        extra={(
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(html)}>
            {t.copy}
          </Button>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{html}</code>
        </pre>
      </Card>

      <Card
        title={t.outputFull}
        extra={(
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullDemo)}>
            {t.copy}
          </Button>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullDemo}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildStepperCss / buildStepperHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildStepperCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
