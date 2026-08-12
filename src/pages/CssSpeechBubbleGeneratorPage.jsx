import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildSpeechBubbleCss,
  buildSpeechBubbleHtml,
  buildSpeechBubbleFullDemo,
  SPEECH_BUBBLE_PRESETS,
} from '../utils/cssSpeechBubbleGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const translations = {
  pt: {
    title: 'Gerador de Speech Bubble CSS',
    intro: (
      <>
        Crie balões de fala, diálogo e pensamento usando só CSS: uma caixa com
        bordas arredondadas e um pseudo-elemento <Text code>::after</Text>{' '}
        formando a seta. Útil para chat, quadrinhos, tooltips estilizados e
        callouts visuais.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A seta é desenhada com o clássico truque das bordas transparentes. Quando
        há borda visível, um segundo pseudo-elemento <Text code>::before</Text>{' '}
        (um triângulo ligeiramente maior na cor da borda) fica por trás da seta
        principal, criando a ilusão de contorno contínuo. No modo{' '}
        <Text code>pensamento</Text>, os círculos são feitos com{' '}
        <Text code>::before</Text> e <Text code>::after</Text> adicionais. Cuidado
        com balões muito próximos da borda da viewport — a seta pode ser cortada.
      </>
    ),
    settings: 'Configurações',
    preset: 'Preset (estilo)',
    type: 'Tipo de balão',
    typeSpeech: 'Fala',
    typeThought: 'Pensamento',
    typeShout: 'Grito',
    position: 'Posição da seta',
    posTop: 'Topo',
    posBottom: 'Base',
    posLeft: 'Esquerda',
    posRight: 'Direita',
    align: 'Alinhamento da seta',
    alignStart: 'Início',
    alignCenter: 'Centro',
    alignEnd: 'Fim',
    bg: 'Cor de fundo',
    color: 'Cor do texto',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    paddingX: 'Padding horizontal',
    paddingY: 'Padding vertical',
    radius: 'Border radius',
    fontSize: 'Tamanho da fonte',
    arrowSize: 'Tamanho da seta',
    shadow: 'Sombra',
    shadowColor: 'Cor da sombra',
    animation: 'Animação',
    animationNone: 'Nenhuma',
    animationPop: 'Pop',
    className: 'Nome da classe CSS',
    bubbleText: 'Texto do preview',
    preview: 'Pré-visualização',
    previewHint: 'O preview abaixo mostra exatamente o CSS gerado sendo injetado na página.',
    output: 'CSS gerado',
    demo: 'Bloco completo (HTML + CSS)',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssSpeechBubbleGenerator.js. buildSpeechBubbleCss monta as regras do container, do pseudo-elemento ::after (seta principal) e, quando há borda, do ::before (seta de contorno). Para balões de pensamento, adiciona círculos com ::before e ::after extras. buildSpeechBubbleHtml gera o markup de exemplo e buildSpeechBubbleFullDemo junta CSS + HTML num único bloco.',
  },
  en: {
    title: 'CSS Speech Bubble Generator',
    intro: (
      <>
        Build speech, chat and thought bubbles with CSS only: a rounded box plus
        an <Text code>::after</Text> pseudo-element forming the arrow. Great for
        chats, comics, styled tooltips and visual callouts.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The arrow is drawn with the classic transparent-border triangle trick.
        When a visible border is enabled, a second <Text code>::before</Text>{' '}
        pseudo-element (a slightly larger triangle in the border color) sits
        behind the main arrow, creating the illusion of a continuous outline. In{' '}
        <Text code>thought</Text> mode, extra <Text code>::before</Text> and{' '}
        <Text code>::after</Text> circles are added. Watch out for bubbles too
        close to the viewport edge — the arrow may get clipped.
      </>
    ),
    settings: 'Settings',
    preset: 'Preset (style)',
    type: 'Bubble type',
    typeSpeech: 'Speech',
    typeThought: 'Thought',
    typeShout: 'Shout',
    position: 'Arrow position',
    posTop: 'Top',
    posBottom: 'Bottom',
    posLeft: 'Left',
    posRight: 'Right',
    align: 'Arrow alignment',
    alignStart: 'Start',
    alignCenter: 'Center',
    alignEnd: 'End',
    bg: 'Background color',
    color: 'Text color',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    paddingX: 'Horizontal padding',
    paddingY: 'Vertical padding',
    radius: 'Border radius',
    fontSize: 'Font size',
    arrowSize: 'Arrow size',
    shadow: 'Shadow',
    shadowColor: 'Shadow color',
    animation: 'Animation',
    animationNone: 'None',
    animationPop: 'Pop',
    className: 'CSS class name',
    bubbleText: 'Preview text',
    preview: 'Preview',
    previewHint: 'The preview below injects the exact generated CSS into the page.',
    output: 'Generated CSS',
    demo: 'Full block (HTML + CSS)',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssSpeechBubbleGenerator.js. buildSpeechBubbleCss assembles the container rules, the ::after pseudo-element (main arrow) and, when a border is enabled, the ::before pseudo-element (outline arrow). For thought bubbles, it adds extra ::before and ::after circles. buildSpeechBubbleHtml generates the example markup and buildSpeechBubbleFullDemo joins CSS + HTML in a single block.',
  },
}

export default function CssSpeechBubbleGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [type, setType] = useState('speech')
  const [bg, setBg] = useState('#ffffff')
  const [color, setColor] = useState('#262626')
  const [borderColor, setBorderColor] = useState('#d9d9d9')
  const [borderWidth, setBorderWidth] = useState(1)
  const [paddingX, setPaddingX] = useState(16)
  const [paddingY, setPaddingY] = useState(12)
  const [radius, setRadius] = useState(12)
  const [fontSize, setFontSize] = useState(14)
  const [shadow, setShadow] = useState(true)
  const [shadowColor, setShadowColor] = useState('rgba(0, 0, 0, 0.12)')
  const [arrowPosition, setArrowPosition] = useState('bottom')
  const [arrowAlign, setArrowAlign] = useState('center')
  const [arrowSize, setArrowSize] = useState(10)
  const [animation, setAnimation] = useState('none')
  const [className, setClassName] = useState('speech-bubble')
  const [bubbleText, setBubbleText] = useState(
    lang === 'pt' ? 'Olá! Este é um balão de fala feito só com CSS.' : 'Hi! This is a CSS-only speech bubble.'
  )

  const settings = useMemo(
    () => ({
      type, bg, color, borderColor, borderWidth, paddingX, paddingY, radius,
      fontSize, shadow, shadowColor, arrowPosition, arrowAlign, arrowSize,
      animation, className,
    }),
    [type, bg, color, borderColor, borderWidth, paddingX, paddingY, radius,
      fontSize, shadow, shadowColor, arrowPosition, arrowAlign, arrowSize,
      animation, className]
  )

  const result = useMemo(() => buildSpeechBubbleCss(settings), [settings])
  const html = useMemo(() => buildSpeechBubbleHtml(bubbleText, settings), [bubbleText, settings])
  const fullDemo = useMemo(() => buildSpeechBubbleFullDemo(bubbleText, settings), [bubbleText, settings])

  const applyPreset = (key) => {
    const p = SPEECH_BUBBLE_PRESETS.find((x) => x.key === key)
    if (!p) return
    setType(p.opts.type || 'speech')
    setBg(p.opts.bg || '#ffffff')
    setColor(p.opts.color || '#262626')
    setBorderColor(p.opts.borderColor || '#d9d9d9')
    setBorderWidth(p.opts.borderWidth !== undefined ? p.opts.borderWidth : 1)
    setPaddingX(p.opts.paddingX !== undefined ? p.opts.paddingX : 16)
    setPaddingY(p.opts.paddingY !== undefined ? p.opts.paddingY : 12)
    setRadius(p.opts.radius !== undefined ? p.opts.radius : 12)
    setFontSize(p.opts.fontSize !== undefined ? p.opts.fontSize : 14)
    setShadow(p.opts.shadow !== undefined ? p.opts.shadow : true)
    setShadowColor(p.opts.shadowColor || 'rgba(0, 0, 0, 0.12)')
    setArrowPosition(p.opts.arrowPosition || 'bottom')
    setArrowAlign(p.opts.arrowAlign || 'center')
    setArrowSize(p.opts.arrowSize !== undefined ? p.opts.arrowSize : 10)
    setAnimation(p.opts.animation || 'none')
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const typeOptions = {
    pt: [
      { label: t.typeSpeech, value: 'speech' },
      { label: t.typeThought, value: 'thought' },
      { label: t.typeShout, value: 'shout' },
    ],
    en: [
      { label: t.typeSpeech, value: 'speech' },
      { label: t.typeThought, value: 'thought' },
      { label: t.typeShout, value: 'shout' },
    ],
  }

  const positionOptions = {
    pt: [
      { label: t.posTop, value: 'top' },
      { label: t.posBottom, value: 'bottom' },
      { label: t.posLeft, value: 'left' },
      { label: t.posRight, value: 'right' },
    ],
    en: [
      { label: t.posTop, value: 'top' },
      { label: t.posBottom, value: 'bottom' },
      { label: t.posLeft, value: 'left' },
      { label: t.posRight, value: 'right' },
    ],
  }

  const bubbleTypeClass = type === 'speech' ? result.className : `${result.className} ${result.className}--${type}`

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
                options={SPEECH_BUBBLE_PRESETS.map((p) => ({ value: p.key, label: p.name[lang] }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.type}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={type}
                  onChange={setType}
                  options={typeOptions[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.position}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={arrowPosition}
                  onChange={setArrowPosition}
                  options={positionOptions[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.align}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={arrowAlign}
                  onChange={setArrowAlign}
                  options={[
                    { label: t.alignStart, value: 'start' },
                    { label: t.alignCenter, value: 'center' },
                    { label: t.alignEnd, value: 'end' },
                  ]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.animation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={animation}
                  onChange={setAnimation}
                  options={[
                    { label: t.animationNone, value: 'none' },
                    { label: t.animationPop, value: 'pop' },
                  ]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.bg}</Text>
                <ColorPicker value={bg} onChange={setBg} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color}</Text>
                <ColorPicker value={color} onChange={setColor} showText />
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

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingX}</Text>
                <Text code>{paddingX}px</Text>
              </Space>
              <Slider min={0} max={48} value={paddingX} onChange={setPaddingX} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.paddingY}</Text>
                <Text code>{paddingY}px</Text>
              </Space>
              <Slider min={0} max={32} value={paddingY} onChange={setPaddingY} />

              {type !== 'shout' && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.radius}</Text>
                    <Text code>{radius}px</Text>
                  </Space>
                  <Slider min={0} max={40} value={radius} onChange={setRadius} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={32} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.arrowSize}</Text>
                <Text code>{arrowSize}px</Text>
              </Space>
              <Slider min={4} max={30} value={arrowSize} onChange={setArrowSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.shadow}</Text>
                <Switch checked={shadow} onChange={setShadow} />
              </Space>

              {shadow && (
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.shadowColor}</Text>
                  <ColorPicker value={shadowColor} onChange={setShadowColor} showText />
                </Space>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.bubbleText}</Text>
                <Input value={bubbleText} onChange={(e) => setBubbleText(e.target.value)} />
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
                padding: 48,
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 32,
                minHeight: 280,
              }}
            >
              <div className={bubbleTypeClass}>{bubbleText}</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className={bubbleTypeClass}>
                  {lang === 'pt' ? 'Curto!' : 'Short!'}
                </div>
                <div className={bubbleTypeClass}>
                  {lang === 'pt'
                    ? 'Outro exemplo com mais texto para ver a quebra de linha.'
                    : 'Another example with more text to see line wrapping.'}
                </div>
              </div>
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
            label: `${t.sourceCol} — buildSpeechBubbleCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildSpeechBubbleCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
