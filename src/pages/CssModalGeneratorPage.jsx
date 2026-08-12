import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, InputNumber, Tabs, Switch,
} from 'antd'
import { BgColorsOutlined, ContainerOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildModalCss,
  buildModalHtml,
  buildModalFullDemo,
  MODAL_PRESETS,
} from '../utils/cssModalGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Gerador de Modal/Dialog CSS',
    intro: (
      <>
        Monte modais, drawers e bottom sheets funcionais usando só CSS + a
        pseudo-classe <Text code>{':target'}</Text>. Configure dimensões, cores,
        animação e botão de fechar; o preview usa o CSS exato que será copiado,
        então você abre e fecha o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        O modal é um <Text code>{'<div id="meuModal">'}</Text> que só aparece
        quando a URL termina com <Text code>{'#meuModal'}</Text>. Um link{' '}
        <Text code>{'<a href="#meuModal">'}</Text> abre; links{' '}
        <Text code>{'<a href="#">'}</Text> no overlay e no botão de fechar
        limpam o hash e escondem. Funciona sem JavaScript, mas{' '}
        <Text strong>bloquear scroll do body, fechar com Esc e foco inicial</Text>{' '}
        só conseguimos com JS. O hash da URL muda ao abrir/fechar.
      </>
    ),
    settings: 'Configurações',
    content: 'Conteúdo',
    modalTitle: 'Título do modal',
    modalBody: 'Corpo do modal',
    type: 'Tipo',
    typeCentered: 'Centralizado',
    typeDrawerLeft: 'Drawer esquerda',
    typeDrawerRight: 'Drawer direita',
    typeDrawerTop: 'Drawer topo',
    typeDrawerBottom: 'Drawer baixo',
    typeBottomSheet: 'Bottom sheet',
    dimensions: 'Dimensões',
    width: 'Largura (px)',
    maxWidth: 'Largura máxima (%)',
    height: 'Altura (px)',
    maxHeight: 'Altura máxima (%)',
    padding: 'Padding interno',
    borderRadius: 'Arredondamento',
    overlay: 'Overlay',
    overlayColor: 'Cor',
    overlayOpacity: 'Opacidade',
    appearance: 'Aparência',
    bgColor: 'Fundo do modal',
    shadow: 'Sombra',
    animation: 'Animação',
    animationFade: 'Fade',
    animationScale: 'Scale',
    animationSlide: 'Slide',
    duration: 'Duração (ms)',
    easing: 'Easing',
    closeButton: 'Botão de fechar',
    closeButtonShow: 'Mostrar botão ×',
    closeButtonSize: 'Tamanho',
    closeButtonColor: 'Cor',
    closeButtonPosition: 'Posição',
    closeButtonTopRight: 'Topo direito',
    closeButtonTopLeft: 'Topo esquerdo',
    preview: 'Pré-visualização',
    previewHint: 'O modal abaixo usa exatamente o CSS gerado — clique em "Abrir modal" para testar.',
    openModal: 'Abrir modal',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssModalGenerator.js. buildModalCss monta as regras de :target, overlay e content com transform/opacity; buildModalHtml gera o markup com links para abrir/fechar e atributos ARIA.',
  },
  en: {
    title: 'CSS Modal/Dialog Generator',
    intro: (
      <>
        Build working modals, drawers and bottom sheets using only CSS + the{' '}
        <Text code>{':target'}</Text> pseudo-class. Configure dimensions, colors,
        animation and close button; the preview uses the exact CSS that will be
        copied, so you can open and close the final result in real time.
      </>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        The modal is a <Text code>{'<div id="myModal">'}</Text> that only shows
        when the URL ends with <Text code>{'#myModal'}</Text>. A link{' '}
        <Text code>{'<a href="#myModal">'}</Text> opens it;{' '}
        <Text code>{'<a href="#">'}</Text> links on the overlay and close button
        clear the hash and hide it. It works without JavaScript, but{' '}
        <Text strong>body scroll lock, Esc to close and initial focus</Text>{' '}
        require JS. The URL hash changes when opening/closing.
      </>
    ),
    settings: 'Settings',
    content: 'Content',
    modalTitle: 'Modal title',
    modalBody: 'Modal body',
    type: 'Type',
    typeCentered: 'Centered',
    typeDrawerLeft: 'Left drawer',
    typeDrawerRight: 'Right drawer',
    typeDrawerTop: 'Top drawer',
    typeDrawerBottom: 'Bottom drawer',
    typeBottomSheet: 'Bottom sheet',
    dimensions: 'Dimensions',
    width: 'Width (px)',
    maxWidth: 'Max width (%)',
    height: 'Height (px)',
    maxHeight: 'Max height (%)',
    padding: 'Inner padding',
    borderRadius: 'Border radius',
    overlay: 'Overlay',
    overlayColor: 'Color',
    overlayOpacity: 'Opacity',
    appearance: 'Appearance',
    bgColor: 'Modal background',
    shadow: 'Shadow',
    animation: 'Animation',
    animationFade: 'Fade',
    animationScale: 'Scale',
    animationSlide: 'Slide',
    duration: 'Duration (ms)',
    easing: 'Easing',
    closeButton: 'Close button',
    closeButtonShow: 'Show × button',
    closeButtonSize: 'Size',
    closeButtonColor: 'Color',
    closeButtonPosition: 'Position',
    closeButtonTopRight: 'Top right',
    closeButtonTopLeft: 'Top left',
    preview: 'Preview',
    previewHint: 'The modal below uses exactly the generated CSS — click "Open modal" to test.',
    openModal: 'Open modal',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssModalGenerator.js. buildModalCss builds the :target, overlay and content rules with transform/opacity; buildModalHtml generates the markup with open/close links and ARIA attributes.',
  },
}

const PREVIEW_CLASS = 'devtools-modal-preview'
const PREVIEW_ID = 'preview-modal'

export default function CssModalGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [type, setType] = useState('centered')
  const [width, setWidth] = useState(520)
  const [maxWidthPct, setMaxWidthPct] = useState(90)
  const [height, setHeight] = useState(320)
  const [maxHeightPct, setMaxHeightPct] = useState(80)
  const [padding, setPadding] = useState(24)
  const [borderRadius, setBorderRadius] = useState(12)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [overlayColor, setOverlayColor] = useState('#000000')
  const [overlayOpacity, setOverlayOpacity] = useState(0.55)
  const [shadow, setShadow] = useState('0 20px 60px rgba(0, 0, 0, 0.25)')
  const [animation, setAnimation] = useState('scale')
  const [duration, setDuration] = useState(250)
  const [easing, setEasing] = useState('ease-out')
  const [closeButton, setCloseButton] = useState(true)
  const [closeButtonSize, setCloseButtonSize] = useState(24)
  const [closeButtonColor, setCloseButtonColor] = useState('#8c8c8c')
  const [closeButtonPosition, setCloseButtonPosition] = useState('top-right')
  const [modalTitle, setModalTitle] = useState(
    lang === 'pt' ? 'Título do modal' : 'Modal title'
  )
  const [modalBody, setModalBody] = useState(
    lang === 'pt' ? 'Este é o conteúdo do modal. Clique no overlay ou no × para fechar.' : 'This is the modal content. Click the overlay or the × to close.'
  )

  const options = useMemo(
    () => ({
      className: PREVIEW_CLASS,
      modalId: PREVIEW_ID,
      title: modalTitle,
      body: modalBody,
      type,
      width,
      maxWidthPct,
      height,
      maxHeightPct,
      padding,
      borderRadius,
      bgColor,
      overlayColor,
      overlayOpacity,
      shadow,
      animation,
      duration,
      easing,
      closeButton,
      closeButtonSize,
      closeButtonColor,
      closeButtonPosition,
    }),
    [
      modalTitle, modalBody, type, width, maxWidthPct, height, maxHeightPct,
      padding, borderRadius, bgColor, overlayColor, overlayOpacity, shadow,
      animation, duration, easing, closeButton, closeButtonSize,
      closeButtonColor, closeButtonPosition,
    ]
  )

  const css = useMemo(() => buildModalCss(options), [options])
  const html = useMemo(() => buildModalHtml(options), [options])
  const fullDemo = useMemo(() => buildModalFullDemo(options), [options])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = MODAL_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const o = preset.opts
    if (o.type !== undefined) setType(o.type)
    if (o.width !== undefined) setWidth(o.width)
    if (o.maxWidthPct !== undefined) setMaxWidthPct(o.maxWidthPct)
    if (o.height !== undefined) setHeight(o.height)
    if (o.maxHeightPct !== undefined) setMaxHeightPct(o.maxHeightPct)
    if (o.padding !== undefined) setPadding(o.padding)
    if (o.borderRadius !== undefined) setBorderRadius(o.borderRadius)
    if (o.bgColor !== undefined) setBgColor(o.bgColor)
    if (o.overlayOpacity !== undefined) setOverlayOpacity(o.overlayOpacity)
    if (o.shadow !== undefined) setShadow(o.shadow)
    if (o.animation !== undefined) setAnimation(o.animation)
    if (o.duration !== undefined) setDuration(o.duration)
    if (o.easing !== undefined) setEasing(o.easing)
    if (o.closeButton !== undefined) setCloseButton(o.closeButton)
    if (o.closeButtonSize !== undefined) setCloseButtonSize(o.closeButtonSize)
    if (o.closeButtonColor !== undefined) setCloseButtonColor(o.closeButtonColor)
    if (o.closeButtonPosition !== undefined) setCloseButtonPosition(o.closeButtonPosition)
  }

  const typeOptions = [
    { label: t.typeCentered, value: 'centered' },
    { label: t.typeDrawerLeft, value: 'drawer-left' },
    { label: t.typeDrawerRight, value: 'drawer-right' },
    { label: t.typeDrawerTop, value: 'drawer-top' },
    { label: t.typeDrawerBottom, value: 'drawer-bottom' },
    { label: t.typeBottomSheet, value: 'bottom-sheet' },
  ]

  const animationOptions = [
    { label: t.animationFade, value: 'fade' },
    { label: t.animationScale, value: 'scale' },
    { label: t.animationSlide, value: 'slide' },
  ]

  const isHorizontalDrawer = type === 'drawer-left' || type === 'drawer-right'
  const isVerticalDrawer = type === 'drawer-top' || type === 'drawer-bottom' || type === 'bottom-sheet'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
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
                options={MODAL_PRESETS.map((p) => ({
                  value: p.key,
                  label: p.name[lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.type}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={type}
                  onChange={setType}
                  options={typeOptions}
                />
              </Space>

              <Text strong>{t.content}</Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.modalTitle}</Text>
                <Input
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                />
              </Space>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.modalBody}</Text>
                <TextArea
                  rows={3}
                  value={modalBody}
                  onChange={(e) => setModalBody(e.target.value)}
                />
              </Space>

              <Text strong>{t.dimensions}</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{isVerticalDrawer ? t.height : t.width}</Text>
                    <InputNumber
                      min={200}
                      max={1200}
                      value={isVerticalDrawer ? height : width}
                      onChange={(v) => (isVerticalDrawer ? setHeight(v) : setWidth(v))}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{isVerticalDrawer ? t.maxHeight : t.maxWidth}</Text>
                    <InputNumber
                      min={30}
                      max={100}
                      value={isVerticalDrawer ? maxHeightPct : maxWidthPct}
                      onChange={(v) => (isVerticalDrawer ? setMaxHeightPct(v) : setMaxWidthPct(v))}
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              </Row>

              {type === 'centered' && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.height}</Text>
                      <InputNumber
                        min={120}
                        max={900}
                        value={height}
                        onChange={setHeight}
                        style={{ width: '100%' }}
                      />
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>{t.maxHeight}</Text>
                      <InputNumber
                        min={30}
                        max={100}
                        value={maxHeightPct}
                        onChange={setMaxHeightPct}
                        style={{ width: '100%' }}
                      />
                    </Space>
                  </Col>
                </Row>
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.padding}</Text>
                    <Slider min={12} max={48} value={padding} onChange={setPadding} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderRadius}</Text>
                    <Slider min={0} max={40} value={borderRadius} onChange={setBorderRadius} />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.overlay}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.overlayColor}</Text>
                    <ColorPicker value={overlayColor} onChange={setOverlayColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.overlayOpacity}</Text>
                    <Slider min={0} max={0.95} step={0.05} value={overlayOpacity} onChange={setOverlayOpacity} />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.appearance}</Text>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.bgColor}</Text>
                    <ColorPicker value={bgColor} onChange={setBgColor} showText />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.shadow}</Text>
                    <Input
                      value={shadow}
                      onChange={(e) => setShadow(e.target.value)}
                    />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.animation}</Text>
              <Segmented
                style={{ width: '100%' }}
                block
                value={animation}
                onChange={setAnimation}
                options={animationOptions}
              />
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.duration}</Text>
                    <InputNumber min={0} max={800} step={50} value={duration} onChange={setDuration} style={{ width: '100%' }} />
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.easing}</Text>
                    <Input value={easing} onChange={(e) => setEasing(e.target.value)} />
                  </Space>
                </Col>
              </Row>

              <Text strong>{t.closeButton}</Text>
              <Space>
                <Switch checked={closeButton} onChange={setCloseButton} />
                <Text>{t.closeButtonShow}</Text>
              </Space>
              {closeButton && (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{t.closeButtonSize}</Text>
                        <InputNumber min={16} max={48} value={closeButtonSize} onChange={setCloseButtonSize} style={{ width: '100%' }} />
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>{t.closeButtonColor}</Text>
                        <ColorPicker value={closeButtonColor} onChange={setCloseButtonColor} showText />
                      </Space>
                    </Col>
                  </Row>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.closeButtonPosition}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={closeButtonPosition}
                      onChange={setCloseButtonPosition}
                      options={[
                        { label: t.closeButtonTopRight, value: 'top-right' },
                        { label: t.closeButtonTopLeft, value: 'top-left' },
                      ]}
                    />
                  </Space>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{css}</style>
            <div
              id="modal-preview-host"
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 32,
                background: '#fafafa',
                minHeight: 320,
                position: 'relative',
              }}
            >
              <a href={`#${PREVIEW_ID}`} className="ant-btn ant-btn-primary" role="button">
                {t.openModal}
              </a>
              <div
                id={PREVIEW_ID}
                className={PREVIEW_CLASS}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${PREVIEW_ID}-title`}
              >
                <a href="#" className={`${PREVIEW_CLASS}-overlay`} aria-label="Close"></a>
                <div className={`${PREVIEW_CLASS}-content`}>
                  {closeButton && (
                    <a href="#" className={`${PREVIEW_CLASS}-close`} aria-label="Close">&times;</a>
                  )}
                  <h2 id={`${PREVIEW_ID}-title`} className={`${PREVIEW_CLASS}-title`}>{modalTitle}</h2>
                  <div className={`${PREVIEW_CLASS}-body`}>
                    <p>{modalBody}</p>
                  </div>
                </div>
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="css"
        items={[
          {
            key: 'css',
            label: t.outputCss,
            children: (
              <Card
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
            ),
          },
          {
            key: 'html',
            label: t.outputHtml,
            children: (
              <Card
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
            ),
          },
          {
            key: 'full',
            label: t.outputFull,
            children: (
              <Card
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
            ),
          },
        ]}
      />

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildModalCss / buildModalHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{buildModalCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
