import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildTooltipCss, buildTooltipHtml, buildFullDemo } from '../utils/cssTooltipGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESETS = [
  {
    key: 'dark', position: 'top', align: 'center', bg: '#1f2937', color: '#ffffff',
    paddingX: 12, paddingY: 8, radius: 6, fontSize: 14, maxWidth: 220,
    arrow: true, arrowSize: 6, offset: 8, animation: 'fade', duration: 200, delay: 0,
    shadow: true, shadowColor: 'rgba(0, 0, 0, 0.2)',
  },
  {
    key: 'light', position: 'bottom', align: 'center', bg: '#ffffff', color: '#1f2937',
    paddingX: 12, paddingY: 8, radius: 8, fontSize: 13, maxWidth: 240,
    arrow: true, arrowSize: 6, offset: 10, animation: 'scale', duration: 180, delay: 0,
    shadow: true, shadowColor: 'rgba(0, 0, 0, 0.15)',
  },
  {
    key: 'slide', position: 'right', align: 'center', bg: '#1677ff', color: '#ffffff',
    paddingX: 14, paddingY: 10, radius: 6, fontSize: 14, maxWidth: 220,
    arrow: true, arrowSize: 8, offset: 12, animation: 'slide', duration: 220, delay: 50,
    shadow: true, shadowColor: 'rgba(22, 119, 255, 0.25)',
  },
  {
    key: 'minimal', position: 'top', align: 'start', bg: '#000000', color: '#ffffff',
    paddingX: 8, paddingY: 4, radius: 4, fontSize: 12, maxWidth: 180,
    arrow: false, arrowSize: 0, offset: 6, animation: 'fade', duration: 150, delay: 0,
    shadow: false, shadowColor: 'rgba(0, 0, 0, 0.2)',
  },
]

const translations = {
  pt: {
    title: 'Gerador de Tooltip CSS',
    intro: (
      <>
        Crie tooltips acessíveis usando só CSS: um wrapper, um elemento absoluto
        e um pseudo-elemento como seta. O estado aberto/fechado é controlado por{' '}
        <Text code>:hover</Text> e <Text code>:focus-within</Text>, sem precisar
        de JavaScript.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O <Text code>.tooltip-wrapper</Text> precisa ter{' '}
        <Text code>position: relative</Text> para que o tooltip se posicione
        em relação a ele. A seta é desenhada com bordas transparentes — o mesmo
        truque do triângulo CSS. A animação usa <Text code>opacity</Text> e{' '}
        <Text code>transform</Text> (GPU-acelerados). Cuidado com tooltips que
        aparecem no topo: se o elemento estiver colado na borda da viewport, a
        dica pode ser cortada; nesses casos troque para{' '}
        <Text code>bottom</Text>, <Text code>left</Text> ou{' '}
        <Text code>right</Text>.
      </>
    ),
    settings: 'Configurações',
    preset: 'Preset (estilo)',
    position: 'Posição',
    align: 'Alinhamento',
    alignStart: 'Início',
    alignCenter: 'Centro',
    alignEnd: 'Fim',
    bg: 'Cor de fundo',
    color: 'Cor do texto',
    paddingX: 'Padding horizontal',
    paddingY: 'Padding vertical',
    radius: 'Border radius',
    fontSize: 'Tamanho da fonte',
    maxWidth: 'Largura máxima',
    arrow: 'Mostrar seta',
    arrowSize: 'Tamanho da seta',
    offset: 'Distância do alvo',
    animation: 'Animação',
    animationFade: 'Fade',
    animationScale: 'Scale',
    animationSlide: 'Slide',
    duration: 'Duração da transição',
    delay: 'Delay de entrada',
    shadow: 'Sombra',
    shadowColor: 'Cor da sombra',
    className: 'Nome da classe CSS',
    tooltipText: 'Texto do preview',
    preview: 'Pré-visualização',
    previewHint: 'Passe o mouse ou foque nos elementos abaixo para ver o tooltip gerado.',
    output: 'CSS gerado',
    demo: 'Bloco completo (HTML + CSS)',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssTooltipGenerator.js. buildTooltipCss monta as regras do wrapper, do tooltip absoluto e do pseudo-elemento ::after que forma a seta. Ele calcula o posicionamento a partir de position + align, monta as transformações de entrada/saída conforme a animação escolhida e emite o CSS pronto para colar. buildTooltipHtml gera o markup de exemplo e buildFullDemo junta tudo num único bloco.',
  },
  en: {
    title: 'CSS Tooltip Generator',
    intro: (
      <>
        Build accessible tooltips with CSS only: a wrapper, an absolutely
        positioned element and a pseudo-element as the arrow. Open/close state
        is driven by <Text code>:hover</Text> and <Text code>:focus-within</Text>,
        no JavaScript required.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The <Text code>.tooltip-wrapper</Text> must have{' '}
        <Text code>position: relative</Text> so the tooltip positions itself
        against it. The arrow is drawn with transparent borders — the same CSS
        triangle trick. Animation uses <Text code>opacity</Text> and{' '}
        <Text code>transform</Text> (GPU-accelerated). Watch out for tooltips
        that open at the top: if the element is flush with the viewport edge, the
        tooltip may be clipped; switch to <Text code>bottom</Text>,{' '}
        <Text code>left</Text> or <Text code>right</Text> in those cases.
      </>
    ),
    settings: 'Settings',
    preset: 'Preset (style)',
    position: 'Position',
    align: 'Alignment',
    alignStart: 'Start',
    alignCenter: 'Center',
    alignEnd: 'End',
    bg: 'Background color',
    color: 'Text color',
    paddingX: 'Horizontal padding',
    paddingY: 'Vertical padding',
    radius: 'Border radius',
    fontSize: 'Font size',
    maxWidth: 'Max width',
    arrow: 'Show arrow',
    arrowSize: 'Arrow size',
    offset: 'Distance from target',
    animation: 'Animation',
    animationFade: 'Fade',
    animationScale: 'Scale',
    animationSlide: 'Slide',
    duration: 'Transition duration',
    delay: 'Entry delay',
    shadow: 'Shadow',
    shadowColor: 'Shadow color',
    className: 'CSS class name',
    tooltipText: 'Preview text',
    preview: 'Preview',
    previewHint: 'Hover or focus the elements below to see the generated tooltip.',
    output: 'Generated CSS',
    demo: 'Full block (HTML + CSS)',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssTooltipGenerator.js. buildTooltipCss assembles the wrapper rules, the absolutely positioned tooltip and the ::after pseudo-element that forms the arrow. It calculates positioning from position + align, builds the enter/exit transforms based on the chosen animation and emits paste-ready CSS. buildTooltipHtml generates the example markup and buildFullDemo joins everything in a single block.',
  },
}

const POSITION_OPTIONS = {
  pt: [
    { label: 'Topo', value: 'top' },
    { label: 'Base', value: 'bottom' },
    { label: 'Esquerda', value: 'left' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
}

export default function CssTooltipGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [position, setPosition] = useState('top')
  const [align, setAlign] = useState('center')
  const [bg, setBg] = useState('#1f2937')
  const [color, setColor] = useState('#ffffff')
  const [paddingX, setPaddingX] = useState(12)
  const [paddingY, setPaddingY] = useState(8)
  const [radius, setRadius] = useState(6)
  const [fontSize, setFontSize] = useState(14)
  const [maxWidth, setMaxWidth] = useState(220)
  const [arrow, setArrow] = useState(true)
  const [arrowSize, setArrowSize] = useState(6)
  const [offset, setOffset] = useState(8)
  const [animation, setAnimation] = useState('fade')
  const [duration, setDuration] = useState(200)
  const [delay, setDelay] = useState(0)
  const [shadow, setShadow] = useState(true)
  const [shadowColor, setShadowColor] = useState('rgba(0, 0, 0, 0.2)')
  const [className, setClassName] = useState('tooltip')
  const [tooltipText, setTooltipText] = useState('Tooltip gerado pelo devtools')

  const settings = useMemo(
    () => ({
      position, align, bg, color, paddingX, paddingY, radius, fontSize, maxWidth,
      arrow, arrowSize, offset, animation, duration, delay, shadow, shadowColor, className,
    }),
    [position, align, bg, color, paddingX, paddingY, radius, fontSize, maxWidth,
      arrow, arrowSize, offset, animation, duration, delay, shadow, shadowColor, className]
  )

  const result = useMemo(() => buildTooltipCss(settings), [settings])
  const html = useMemo(() => buildTooltipHtml(result.className, tooltipText), [result.className, tooltipText])
  const fullDemo = useMemo(() => buildFullDemo(settings, tooltipText), [settings, tooltipText])

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (!p) return
    setPosition(p.position)
    setAlign(p.align)
    setBg(p.bg)
    setColor(p.color)
    setPaddingX(p.paddingX)
    setPaddingY(p.paddingY)
    setRadius(p.radius)
    setFontSize(p.fontSize)
    setMaxWidth(p.maxWidth)
    setArrow(p.arrow)
    setArrowSize(p.arrowSize)
    setOffset(p.offset)
    setAnimation(p.animation)
    setDuration(p.duration)
    setDelay(p.delay)
    setShadow(p.shadow)
    setShadowColor(p.shadowColor)
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
                options={PRESETS.map((p) => ({ value: p.key, label: p.key }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.position}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={position}
                  onChange={setPosition}
                  options={POSITION_OPTIONS[lang]}
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
                <Text>{t.animation}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={animation}
                  onChange={setAnimation}
                  options={[
                    { label: t.animationFade, value: 'fade' },
                    { label: t.animationScale, value: 'scale' },
                    { label: t.animationSlide, value: 'slide' },
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

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.radius}</Text>
                <Text code>{radius}px</Text>
              </Space>
              <Slider min={0} max={32} value={radius} onChange={setRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={32} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.maxWidth}</Text>
                <Text code>{maxWidth}px</Text>
              </Space>
              <Slider min={80} max={480} value={maxWidth} onChange={setMaxWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.arrow}</Text>
                <Switch checked={arrow} onChange={setArrow} />
              </Space>

              {arrow && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.arrowSize}</Text>
                    <Text code>{arrowSize}px</Text>
                  </Space>
                  <Slider min={0} max={24} value={arrowSize} onChange={setArrowSize} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.offset}</Text>
                <Text code>{offset}px</Text>
              </Space>
              <Slider min={0} max={40} value={offset} onChange={setOffset} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <Text code>{duration}ms</Text>
              </Space>
              <Slider min={0} max={800} step={10} value={duration} onChange={setDuration} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.delay}</Text>
                <Text code>{delay}ms</Text>
              </Space>
              <Slider min={0} max={1000} step={10} value={delay} onChange={setDelay} />

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
                <Text>{t.tooltipText}</Text>
                <Input value={tooltipText} onChange={(e) => setTooltipText(e.target.value)} />
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
                gap: 40,
                minHeight: 260,
              }}
            >
              <span className={result.wrapperClass} tabIndex={0}>
                <Button>Button with tooltip</Button>
                <span className={result.className}>{tooltipText}</span>
              </span>
              <span className={result.wrapperClass} tabIndex={0}>
                <Text style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                  Texto com tooltip
                </Text>
                <span className={result.className}>{tooltipText}</span>
              </span>
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
            label: `${t.sourceCol} — buildTooltipCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildTooltipCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
