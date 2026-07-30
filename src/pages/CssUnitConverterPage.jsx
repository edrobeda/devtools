import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, InputNumber, Row, Col, Divider } from 'antd'
import { ColumnWidthOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Conversor de Unidades CSS',
    intro: (
      <>
        Converte um valor entre <Text code>px</Text>, <Text code>rem</Text>,{' '}
        <Text code>em</Text>, <Text code>pt</Text>, <Text code>vw</Text> e{' '}
        <Text code>vh</Text> em tempo real. <Text code>rem</Text> depende do
        tamanho de fonte raiz (<Text code>html</Text>), <Text code>em</Text>{' '}
        depende do tamanho de fonte do elemento pai, e{' '}
        <Text code>vw</Text>/<Text code>vh</Text> dependem das dimensões da
        viewport — ajuste as bases abaixo conforme seu contexto real.
      </>
    ),
    basesTitle: 'Bases de referência',
    rootFontSize: 'Tamanho de fonte raiz (px) — usado por rem',
    parentFontSize: 'Tamanho de fonte do pai (px) — usado por em',
    viewportWidth: 'Largura da viewport (px) — usada por vw',
    viewportHeight: 'Altura da viewport (px) — usada por vh',
    valuesTitle: 'Valores equivalentes',
    note: '1pt = 1/72 de polegada = 1.333px (fórmula fixa do CSS, não depende de base)',
  },
  en: {
    title: 'CSS Unit Converter',
    intro: (
      <>
        Converts a value between <Text code>px</Text>, <Text code>rem</Text>,{' '}
        <Text code>em</Text>, <Text code>pt</Text>, <Text code>vw</Text> and{' '}
        <Text code>vh</Text> in real time. <Text code>rem</Text> depends on
        the root (<Text code>html</Text>) font size, <Text code>em</Text>{' '}
        depends on the parent element's font size, and{' '}
        <Text code>vw</Text>/<Text code>vh</Text> depend on the viewport
        dimensions — adjust the bases below to match your real context.
      </>
    ),
    basesTitle: 'Reference bases',
    rootFontSize: 'Root font size (px) — used by rem',
    parentFontSize: 'Parent font size (px) — used by em',
    viewportWidth: 'Viewport width (px) — used by vw',
    viewportHeight: 'Viewport height (px) — used by vh',
    valuesTitle: 'Equivalent values',
    note: '1pt = 1/72 of an inch = 1.333px (fixed CSS formula, base-independent)',
  },
}

const PT_PER_PX = 0.75 // 1px = 0.75pt (96 CSS px per inch, 72pt per inch)

function toPx(value, unit, bases) {
  switch (unit) {
    case 'px': return value
    case 'rem': return value * bases.root
    case 'em': return value * bases.parent
    case 'pt': return value / PT_PER_PX
    case 'vw': return (value / 100) * bases.vw
    case 'vh': return (value / 100) * bases.vh
    default: return value
  }
}

function fromPx(px, unit, bases) {
  switch (unit) {
    case 'px': return px
    case 'rem': return px / bases.root
    case 'em': return px / bases.parent
    case 'pt': return px * PT_PER_PX
    case 'vw': return (px / bases.vw) * 100
    case 'vh': return (px / bases.vh) * 100
    default: return px
  }
}

const UNITS = ['px', 'rem', 'em', 'pt', 'vw', 'vh']

function round(n) {
  return Math.round(n * 10000) / 10000
}

export default function CssUnitConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [root, setRoot] = useState(16)
  const [parent, setParent] = useState(16)
  const [vw, setVw] = useState(1920)
  const [vh, setVh] = useState(1080)
  const [sourceUnit, setSourceUnit] = useState('px')
  const [sourceValue, setSourceValue] = useState(16)

  const bases = useMemo(() => ({ root: root || 1, parent: parent || 1, vw: vw || 1, vh: vh || 1 }), [root, parent, vw, vh])

  const px = useMemo(() => toPx(sourceValue || 0, sourceUnit, bases), [sourceValue, sourceUnit, bases])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ColumnWidthOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.basesTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.rootFontSize}</Text>
              <InputNumber min={1} value={root} onChange={(v) => setRoot(v ?? 16)} style={{ width: '100%' }} addonAfter="px" />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.parentFontSize}</Text>
              <InputNumber min={1} value={parent} onChange={(v) => setParent(v ?? 16)} style={{ width: '100%' }} addonAfter="px" />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.viewportWidth}</Text>
              <InputNumber min={1} value={vw} onChange={(v) => setVw(v ?? 1920)} style={{ width: '100%' }} addonAfter="px" />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.viewportHeight}</Text>
              <InputNumber min={1} value={vh} onChange={(v) => setVh(v ?? 1080)} style={{ width: '100%' }} addonAfter="px" />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title={t.valuesTitle}>
        <Row gutter={[16, 16]}>
          {UNITS.map((unit) => (
            <Col xs={12} md={8} key={unit}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontFamily: 'monospace' }}>{unit}</Text>
                <InputNumber
                  value={sourceUnit === unit ? sourceValue : round(fromPx(px, unit, bases))}
                  onChange={(v) => {
                    setSourceUnit(unit)
                    setSourceValue(v ?? 0)
                  }}
                  style={{ width: '100%' }}
                  step={unit === 'px' || unit === 'pt' ? 1 : 0.1}
                />
              </Space>
            </Col>
          ))}
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <Text type="secondary">{t.note}</Text>
      </Card>
    </Space>
  )
}
