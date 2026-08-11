import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse, message, ColorPicker, Row, Col, InputNumber } from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildTriangle, buildTriangleClass } from '../utils/cssTriangle'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESETS = [
  { key: 'up', direction: 'up', base: 120, height: 100, color: '#1677ff', kind: 'isosceles' },
  { key: 'down', direction: 'down', base: 120, height: 100, color: '#52c41a', kind: 'isosceles' },
  { key: 'left', direction: 'left', base: 120, height: 100, color: '#fa8c16', kind: 'isosceles' },
  { key: 'right', direction: 'right', base: 120, height: 100, color: '#eb2f96', kind: 'isosceles' },
  { key: 'equilateral', direction: 'up', base: 140, height: 0, color: '#722ed1', kind: 'equilateral' },
]

const PRESET_LABEL = {
  up: { pt: 'Para cima', en: 'Pointing up' },
  down: { pt: 'Para baixo', en: 'Pointing down' },
  left: { pt: 'Para a esquerda', en: 'Pointing left' },
  right: { pt: 'Para a direita', en: 'Pointing right' },
  equilateral: { pt: 'Equilátero para cima', en: 'Equilateral up' },
}

const translations = {
  pt: {
    title: 'Gerador de Triângulo CSS',
    intro: (
      <>
        Crie triângulos só com CSS usando o clássico truque das{' '}
        <Text code>border</Text> transparentes. Ajuste direção, base, altura e
        cor, copie a regra pronta e veja o preview ao vivo. Não precisa de SVG,
        imagem nem pseudo-elemento complicado.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O elemento tem <Text code>width: 0</Text> e{' '}
        <Text code>height: 0</Text>; as bordas laterais são transparentes e
        a borda oposta à ponta recebe a cor. Se você quer uma seta para{' '}
        <Text strong>cima</Text>, as bordas esquerda e direita são transparentes
        e a borda de baixo é colorida — a espessura dela vira a altura do
        triângulo. Cuidado com valores muito pequenos em telas de alta densidade
        (Retina), pois meio-pixel pode arredondar de formas diferentes em cada
        engine; prefira bases e alturas pares quando precisar de simetria
        perfeita.
      </>
    ),
    settings: 'Configurações',
    preset: 'Preset (formato)',
    direction: 'Direção',
    kind: 'Tipo',
    kindIsosceles: 'Isósceles',
    kindEquilateral: 'Equilátero',
    base: 'Base (largura)',
    height: 'Altura',
    color: 'Cor do triângulo',
    bg: 'Cor do fundo do preview',
    preview: 'Pré-visualização',
    previewHint: 'O triângulo abaixo usa exatamente o CSS gerado.',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssTriangle.js. buildTriangle valida a base e altura, calcula a altura de um triângulo equilátero (base × √3 / 2) e mapeia a direção para as quatro bordas: para cima a borda de baixo é colorida e as laterais têm metade da base; para baixo é o oposto; para esquerda/direita a borda colorida fica do lado correspondente e as de cima/baixo têm metade da altura. buildTriangleClass embrulha isso numa classe pronta para colar.',
  },
  en: {
    title: 'CSS Triangle Generator',
    intro: (
      <>
        Create triangles with CSS only using the classic transparent{' '}
        <Text code>border</Text> trick. Tweak direction, base, height and color,
        copy the ready-to-use rule and see a live preview. No SVG, image or
        fancy pseudo-element required.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The element has <Text code>width: 0</Text> and{' '}
        <Text code>height: 0</Text>; the side borders are transparent and the
        border opposite to the tip gets the color. For an arrow{' '}
        <Text strong>up</Text>, the left and right borders are transparent and
        the bottom border is colored — its thickness becomes the triangle
        height. Watch out for very small values on high-density (Retina)
        screens: half-pixel rounding may differ across engines; prefer even base
        and height values when you need perfect symmetry.
      </>
    ),
    settings: 'Settings',
    preset: 'Preset (shape)',
    direction: 'Direction',
    kind: 'Kind',
    kindIsosceles: 'Isosceles',
    kindEquilateral: 'Equilateral',
    base: 'Base (width)',
    height: 'Height',
    color: 'Triangle color',
    bg: 'Preview background',
    preview: 'Preview',
    previewHint: 'The triangle below uses exactly the generated CSS.',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssTriangle.js. buildTriangle validates base and height, computes an equilateral triangle height (base × √3 / 2) and maps the direction to the four borders: up colors the bottom border and the sides get half the base; down is the opposite; left/right color the matching side border and the top/bottom get half the height. buildTriangleClass wraps it in a paste-ready class.',
  },
}

const DIRECTION_OPTIONS = {
  pt: [
    { label: 'Cima', value: 'up' },
    { label: 'Baixo', value: 'down' },
    { label: 'Esquerda', value: 'left' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Up', value: 'up' },
    { label: 'Down', value: 'down' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
}

export default function CssTriangleGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [direction, setDirection] = useState('up')
  const [kind, setKind] = useState('isosceles')
  const [base, setBase] = useState(120)
  const [height, setHeight] = useState(100)
  const [color, setColor] = useState('#1677ff')
  const [bg, setBg] = useState('#f0f5ff')

  const settings = useMemo(
    () => ({ direction, kind, base, height, color }),
    [direction, kind, base, height, color]
  )

  const triangle = useMemo(() => buildTriangle(settings), [settings])
  const classCss = useMemo(() => buildTriangleClass(triangle, 'triangle'), [triangle])

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (!p) return
    setDirection(p.direction)
    setKind(p.kind)
    setBase(p.base)
    setHeight(p.height)
    setColor(p.color)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(classCss)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const handleKindChange = (k) => {
    setKind(k)
    if (k === 'equilateral') {
      setHeight(Math.round((base * Math.sqrt(3)) / 2))
    }
  }

  const handleBaseChange = (v) => {
    setBase(v)
    if (kind === 'equilateral') {
      setHeight(Math.round((v * Math.sqrt(3)) / 2))
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
                options={PRESETS.map((p) => ({
                  value: p.key,
                  label: PRESET_LABEL[p.key][lang],
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
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
                <Text>{t.kind}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={kind}
                  onChange={handleKindChange}
                  options={[
                    { label: t.kindIsosceles, value: 'isosceles' },
                    { label: t.kindEquilateral, value: 'equilateral' },
                  ]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.base}</Text>
                <Text code>{base}px</Text>
              </Space>
              <Slider min={8} max={300} value={base} onChange={handleBaseChange} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.height}</Text>
                {kind === 'equilateral' ? (
                  <Text type="secondary">{triangle.height}px</Text>
                ) : (
                  <Text code>{height}px</Text>
                )}
              </Space>
              {kind === 'isosceles' ? (
                <Slider min={8} max={300} value={height} onChange={setHeight} />
              ) : (
                <InputNumber disabled value={triangle.height} style={{ width: '100%' }} />
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color}</Text>
                <ColorPicker value={color} onChange={setColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.bg}</Text>
                <ColorPicker value={bg} onChange={setBg} showText />
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
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 220,
              }}
            >
              <div style={{ width: 0, height: 0 }}>
                <div dangerouslySetInnerHTML={{ __html: '' }} />
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: direction === 'up'
                      ? `0 ${triangle.base / 2}px ${triangle.height}px ${triangle.base / 2}px`
                      : direction === 'down'
                      ? `${triangle.height}px ${triangle.base / 2}px 0 ${triangle.base / 2}px`
                      : direction === 'left'
                      ? `${triangle.height / 2}px ${triangle.base}px ${triangle.height / 2}px 0`
                      : `${triangle.height / 2}px 0 ${triangle.height / 2}px ${triangle.base}px`,
                    borderColor: direction === 'up'
                      ? `transparent transparent ${triangle.color} transparent`
                      : direction === 'down'
                      ? `${triangle.color} transparent transparent transparent`
                      : direction === 'left'
                      ? `transparent ${triangle.color} transparent transparent`
                      : `transparent transparent transparent ${triangle.color}`,
                  }}
                />
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{classCss}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildTriangle / buildTriangleClass`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildTriangle.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
