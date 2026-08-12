import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Slider, Alert, Collapse, message, Segmented,
  Row, Col, Input, Select, Switch,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildTransform, buildClassCss, makeValues, PRESETS } from '../utils/transformGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message
const { Option } = Select

const PRESET_KEYS = ['none', 'rotateY', 'rotateX', 'isometric', 'cardFlip', 'perspective', 'skew', 'scale', 'hoverLift']

const PRESET_LABEL = {
  none: { pt: 'Nenhum', en: 'None' },
  rotateY: { pt: 'Rotação Y', en: 'Rotate Y' },
  rotateX: { pt: 'Rotação X', en: 'Rotate X' },
  isometric: { pt: 'Isométrico', en: 'Isometric' },
  cardFlip: { pt: 'Virar Cartão', en: 'Card Flip' },
  perspective: { pt: 'Perspectiva', en: 'Perspective' },
  skew: { pt: 'Inclinar', en: 'Skew' },
  scale: { pt: 'Escalar', en: 'Scale' },
  hoverLift: { pt: 'Hover 3D', en: 'Hover Lift' },
}

const ORIGIN_OPTIONS = ['center', 'left', 'right', 'top', 'bottom']

const translations = {
  pt: {
    title: 'Gerador de Transform CSS',
    intro: (
      <>
        Monte transformações 2D e 3D (<Text code>transform</Text>) interativamente:
        translação, rotação, escala, inclinação, perspectiva e origem.
        Útil para cards 3D, efeitos de hover e composições isométricas.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A ordem das funções importa: <Text code>rotateY(45deg) translateZ(50px)</Text>{' '}
        é diferente de <Text code>translateZ(50px) rotateY(45deg)</Text>. Para efeitos 3D,
        defina <Text code>perspective</Text> no pai e <Text code>transform-style: preserve-3d</Text>{' '}
        para que filhos preservem profundidade. <Text code>transform-origin</Text> muda o eixo
        de rotação/escala; o padrão é <Text code>center center</Text>.
      </>
    ),
    preset: 'Preset',
    translate: 'Translação (px)',
    rotate: 'Rotação (deg)',
    scale: 'Escala',
    skew: 'Inclinação (deg)',
    perspective: 'Perspectiva',
    perspectiveHint: '0 = sem perspectiva no elemento',
    origin: 'Origem (transform-origin)',
    originZ: 'Origem Z (px)',
    transformStyle: 'Transform-style',
    preserve3d: 'preserve-3d',
    flat: 'flat',
    preview: 'Pré-visualização',
    previewHint: 'A caixa abaixo usa exatamente o CSS gerado. Passe o mouse para ver o estado de hover.',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/transformGenerator.js. buildTransform percorre translate/rotate/scale/skew e emite apenas as funções com valores diferentes do padrão; buildClassCss embrulha tudo numa classe pronta, incluindo perspective, transform-origin e transform-style.',
  },
  en: {
    title: 'CSS Transform Generator',
    intro: (
      <>
        Build interactive 2D and 3D <Text code>transform</Text> compositions:
        translate, rotate, scale, skew, perspective and origin.
        Great for 3D cards, hover effects and isometric layouts.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        Order matters: <Text code>rotateY(45deg) translateZ(50px)</Text>{' '}
        is different from <Text code>translateZ(50px) rotateY(45deg)</Text>. For 3D effects,
        set <Text code>perspective</Text> on the parent and <Text code>transform-style: preserve-3d</Text>{' '}
        so children keep depth. <Text code>transform-origin</Text> changes the rotation/scale axis;
        the default is <Text code>center center</Text>.
      </>
    ),
    preset: 'Preset',
    translate: 'Translate (px)',
    rotate: 'Rotate (deg)',
    scale: 'Scale',
    skew: 'Skew (deg)',
    perspective: 'Perspective',
    perspectiveHint: '0 = no perspective on the element',
    origin: 'Origin (transform-origin)',
    originZ: 'Origin Z (px)',
    transformStyle: 'Transform-style',
    preserve3d: 'preserve-3d',
    flat: 'flat',
    preview: 'Preview',
    previewHint: 'The box below uses exactly the generated CSS. Hover it to see the hover state.',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/transformGenerator.js. buildTransform walks translate/rotate/scale/skew and emits only the functions with non-default values; buildClassCss wraps everything in a paste-ready class, including perspective, transform-origin and transform-style.',
  },
}

function SliderField({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <Space direction="vertical" size={2} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Text code>{value}{unit}</Text>
      </Space>
      <Slider min={min} max={max} step={step} value={value} onChange={onChange} />
    </Space>
  )
}

export default function TransformGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [values, setValues] = useState(() => makeValues({ rotateY: 45, perspective: 800, transformStyle: 'preserve-3d' }))
  const [isHover, setIsHover] = useState(false)

  const update = (patch) => setValues((prev) => ({ ...prev, ...patch }))

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setValues({ ...preset })
  }

  const displayValues = useMemo(() => {
    if (!isHover) return values
    if (values.translateZ > 0 || values.scaleX !== 1 || values.scaleY !== 1) return values
    return {
      ...values,
      translateZ: 40,
      scaleX: Math.max(values.scaleX, 1.04),
      scaleY: Math.max(values.scaleY, 1.04),
    }
  }, [values, isHover])

  const transform = useMemo(() => buildTransform(displayValues), [displayValues])
  const classCss = useMemo(() => buildClassCss(values, 'transform-box'), [values])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(classCss)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const reset = () => setValues(makeValues())

  const originZ = values.originZ ? ` ${values.originZ}px` : ''
  const origin = `${values.originX} ${values.originY}${originZ}`

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card
            title={t.preset}
            extra={<Button size="small" onClick={reset}>Reset</Button>}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESET_KEYS.map((key) => ({
                  value: key,
                  label: PRESET_LABEL[key][lang],
                }))}
              />

              <Card size="small" title={t.translate}>
                <SliderField
                  label="X"
                  value={values.translateX}
                  min={-200}
                  max={200}
                  unit="px"
                  onChange={(v) => update({ translateX: v })}
                />
                <SliderField
                  label="Y"
                  value={values.translateY}
                  min={-200}
                  max={200}
                  unit="px"
                  onChange={(v) => update({ translateY: v })}
                />
                <SliderField
                  label="Z"
                  value={values.translateZ}
                  min={-200}
                  max={200}
                  unit="px"
                  onChange={(v) => update({ translateZ: v })}
                />
              </Card>

              <Card size="small" title={t.rotate}>
                <SliderField
                  label="X"
                  value={values.rotateX}
                  min={-180}
                  max={180}
                  unit="°"
                  onChange={(v) => update({ rotateX: v })}
                />
                <SliderField
                  label="Y"
                  value={values.rotateY}
                  min={-180}
                  max={180}
                  unit="°"
                  onChange={(v) => update({ rotateY: v })}
                />
                <SliderField
                  label="Z"
                  value={values.rotateZ}
                  min={-180}
                  max={180}
                  unit="°"
                  onChange={(v) => update({ rotateZ: v })}
                />
              </Card>

              <Card size="small" title={`${t.scale} / ${t.skew}`}>
                <SliderField
                  label="scaleX"
                  value={values.scaleX}
                  min={0}
                  max={3}
                  step={0.05}
                  onChange={(v) => update({ scaleX: v })}
                />
                <SliderField
                  label="scaleY"
                  value={values.scaleY}
                  min={0}
                  max={3}
                  step={0.05}
                  onChange={(v) => update({ scaleY: v })}
                />
                <SliderField
                  label="skewX"
                  value={values.skewX}
                  min={-90}
                  max={90}
                  unit="°"
                  onChange={(v) => update({ skewX: v })}
                />
                <SliderField
                  label="skewY"
                  value={values.skewY}
                  min={-90}
                  max={90}
                  unit="°"
                  onChange={(v) => update({ skewY: v })}
                />
              </Card>

              <Card size="small" title={t.perspective}>
                <SliderField
                  label={t.perspective}
                  value={values.perspective}
                  min={0}
                  max={2000}
                  unit="px"
                  onChange={(v) => update({ perspective: v })}
                />
                <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 12 }}>
                  {t.perspectiveHint}
                </Paragraph>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text strong>{t.origin}</Text>
                  <Space wrap>
                    <Select
                      value={values.originX}
                      onChange={(v) => update({ originX: v })}
                      style={{ width: 120 }}
                    >
                      {ORIGIN_OPTIONS.map((o) => <Option key={`x-${o}`} value={o}>{o}</Option>)}
                    </Select>
                    <Select
                      value={values.originY}
                      onChange={(v) => update({ originY: v })}
                      style={{ width: 120 }}
                    >
                      {ORIGIN_OPTIONS.map((o) => <Option key={`y-${o}`} value={o}>{o}</Option>)}
                    </Select>
                    <Input
                      type="number"
                      placeholder={t.originZ}
                      value={values.originZ}
                      onChange={(e) => update({ originZ: e.target.value })}
                      style={{ width: 120 }}
                    />
                  </Space>
                </Space>
                <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>{t.transformStyle}</Text>
                  <Switch
                    checked={values.transformStyle === 'preserve-3d'}
                    onChange={(checked) => update({ transformStyle: checked ? 'preserve-3d' : 'flat' })}
                    checkedChildren={t.preserve3d}
                    unCheckedChildren={t.flat}
                  />
                </Space>
              </Card>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 48,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 360,
                perspective: values.perspective > 0 ? values.perspective : 'none',
              }}
              onMouseEnter={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 18,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  transform,
                  transformOrigin: origin,
                  transformStyle: values.transformStyle,
                  transition: 'transform 0.35s ease',
                  cursor: 'pointer',
                }}
              >
                DevTools
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
            label: `${t.sourceCol} — buildTransform / buildClassCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildTransform.toString()}\n\n{buildClassCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
