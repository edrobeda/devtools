import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Row, Col, Button, Tag, Alert, Collapse, message } from 'antd'
import { EyeOutlined, CopyOutlined, BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { simulateAll, hexToRgb, CVD_TYPES } from '../utils/colorBlindness'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESET_COLORS = [
  '#ff4d4f',
  '#52c41a',
  '#1677ff',
  '#faad14',
  '#722ed1',
  '#13c2c2',
]

const translations = {
  pt: {
    title: 'Simulador de Daltonismo',
    intro: (
      <>
        Veja como uma cor é percebida pelos principais tipos de deficiência
        cromática — protanopia (falta de cones vermelhos), deuteranopia
        (falta de cones verdes), tritanopia (falta de cones azuis) e
        acromatopsia (visão monocromática). A simulação acontece 100% no
        navegador usando matrizes de conversão no espaço de cor linear.
      </>
    ),
    pickColor: 'Escolha uma cor',
    hex: 'Hex',
    presets: 'Cores de exemplo',
    original: 'Original',
    protanopia: 'Protanopia',
    deuteranopia: 'Deuteranopia',
    tritanopia: 'Tritanopia',
    achromatopsia: 'Acromatopsia',
    copy: 'Copiar',
    copied: 'Hex copiado!',
    invalid: 'Cor inválida — use formato hex, ex: #1677ff',
    tipTitle: 'O que a simulação consegue (e não consegue) fazer',
    tipBody: (
      <>
        As matrizes usadas são baseadas no modelo de Brettel, Viénot & Mollon
        (1997) e reproduzem bem a confusão entre tons para a maioria das
        pessoas com discromatopsia. Elas <Text strong>não simulam</Text>{' '}
        variações individuais de gravidade, anomalias parciais (protanomalia,
        deuteranomalia etc.) nem condições como catarata ou fotofobia. Use
        como guia rápido de acessibilidade, não como diagnóstico.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/colorBlindness.js. Cada tipo de daltonismo tem uma matriz 3×3 que opera em RGB linear: primeiro expandimos o gamma do sRGB, multiplicamos pelos coeficientes da matriz e depois comprimimos o gamma de volta para sRGB. A acromatopsia usa apenas a luminância relativa (mesmos pesos do WCAG). O resultado é arredondado e limitado entre 0 e 255.',
    affectedCones: {
      protanopia: 'sem cones L (vermelho)',
      deuteranopia: 'sem cones M (verde)',
      tritanopia: 'sem cones S (azul)',
      achromatopsia: 'nenhum cone funcional',
    },
  },
  en: {
    title: 'Color Blindness Simulator',
    intro: (
      <>
        See how a color is perceived under the main types of color vision
        deficiency — protanopia (missing red cones), deuteranopia (missing
        green cones), tritanopia (missing blue cones) and achromatopsia
        (monochromatic vision). The simulation runs 100% in the browser using
        conversion matrices in linear color space.
      </>
    ),
    pickColor: 'Pick a color',
    hex: 'Hex',
    presets: 'Sample colors',
    original: 'Original',
    protanopia: 'Protanopia',
    deuteranopia: 'Deuteranopia',
    tritanopia: 'Tritanopia',
    achromatopsia: 'Achromatopsia',
    copy: 'Copy',
    copied: 'Hex copied!',
    invalid: 'Invalid color — use hex format, e.g. #1677ff',
    tipTitle: 'What the simulation can (and cannot) do',
    tipBody: (
      <>
        The matrices are based on the Brettel, Viénot & Mollon model (1997)
        and reproduce hue confusion well for most people with color blindness.
        They do <Text strong>not simulate</Text> individual severity,
        partial anomalies (protanomaly, deuteranomaly, etc.) or conditions
        such as cataracts or photophobia. Use it as a quick accessibility
        guide, not a diagnosis.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody:
      'The core lives in src/utils/colorBlindness.js. Each CVD type has a 3×3 matrix that operates on linear RGB: first we expand sRGB gamma, multiply by the matrix coefficients, then compress gamma back to sRGB. Achromatopsia uses only relative luminance (same WCAG weights). The result is rounded and clamped between 0 and 255.',
    affectedCones: {
      protanopia: 'no L cones (red)',
      deuteranopia: 'no M cones (green)',
      tritanopia: 'no S cones (blue)',
      achromatopsia: 'no working cones',
    },
  },
}

function ColorCard({ title, subtitle, hex, messageApi, t }) {
  const valid = hexToRgb(hex)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hex)
      messageApi.success(t.copied)
    } catch {
      // ignore
    }
  }

  return (
    <Card
      size="small"
      title={title}
      extra={subtitle && <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>}
    >
      <div style={{
        height: 80,
        background: valid ? hex : '#f5f5f5',
        borderRadius: 6,
        border: '1px solid #d9d9d9',
        marginBottom: 12,
      }} />
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text code>{hex}</Text>
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!valid}>
          {t.copy}
        </Button>
      </Space>
    </Card>
  )
}

export default function ColorBlindnessSimulatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [color, setColor] = useState('#1677ff')
  const [messageApi, contextHolder] = useMessage()

  const result = useMemo(() => simulateAll(color), [color])
  const valid = result !== null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2}><EyeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.pickColor}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Space style={{ display: 'flex' }}>
              <input
                type="color"
                value={valid ? color : '#000000'}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 48, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 120, fontFamily: 'monospace' }}
                placeholder="#1677ff"
              />
            </Space>
          </Col>
          <Col xs={24} sm={16}>
            <Space wrap>
              <Text strong>{t.presets}:</Text>
              {PRESET_COLORS.map((c) => (
                <Tag
                  key={c}
                  color={c}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setColor(c)}
                >
                  <BgColorsOutlined /> {c}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {!valid && <Paragraph type="danger">{t.invalid}</Paragraph>}

      {valid && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <ColorCard title={t.original} hex={result.original} messageApi={messageApi} t={t} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <ColorCard
              title={t.protanopia}
              subtitle={t.affectedCones.protanopia}
              hex={result.protanopia}
              messageApi={messageApi}
              t={t}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <ColorCard
              title={t.deuteranopia}
              subtitle={t.affectedCones.deuteranopia}
              hex={result.deuteranopia}
              messageApi={messageApi}
              t={t}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <ColorCard
              title={t.tritanopia}
              subtitle={t.affectedCones.tritanopia}
              hex={result.tritanopia}
              messageApi={messageApi}
              t={t}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <ColorCard
              title={t.achromatopsia}
              subtitle={t.affectedCones.achromatopsia}
              hex={result.achromatopsia}
              messageApi={messageApi}
              t={t}
            />
          </Col>
        </Row>
      )}

      <Alert
        type="info"
        showIcon
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Collapse ghost>
        <Collapse.Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 12, borderRadius: 6, overflow: 'auto' }}>
            <code>{`// src/utils/colorBlindness.js — trecho das matrizes

const CVD_TYPES = {
  protanopia: {
    matrix: [
      [0.567, 0.433, 0.0],
      [0.558, 0.442, 0.0],
      [0.0, 0.242, 0.758],
    ],
  },
  deuteranopia: {
    matrix: [
      [0.625, 0.375, 0.0],
      [0.7, 0.3, 0.0],
      [0.0, 0.3, 0.7],
    ],
  },
  tritanopia: {
    matrix: [
      [0.95, 0.05, 0.0],
      [0.0, 0.433, 0.567],
      [0.0, 0.475, 0.525],
    ],
  },
  achromatopsia: {
    luminance: [0.2126, 0.7152, 0.0722],
  },
}

function simulate(rgb, type) {
  const cvd = CVD_TYPES[type]
  const linear = [rgb.r, rgb.g, rgb.b].map(gammaExpand)
  let out

  if (type === 'achromatopsia') {
    const y = linear[0] * cvd.luminance[0]
          + linear[1] * cvd.luminance[1]
          + linear[2] * cvd.luminance[2]
    out = [y, y, y]
  } else {
    const m = cvd.matrix
    out = [
      linear[0] * m[0][0] + linear[1] * m[0][1] + linear[2] * m[0][2],
      linear[0] * m[1][0] + linear[1] * m[1][1] + linear[2] * m[1][2],
      linear[0] * m[2][0] + linear[1] * m[2][1] + linear[2] * m[2][2],
    ]
  }

  return out.map(gammaCompress).map(clamp)
}`}</code>
          </pre>
        </Collapse.Panel>
      </Collapse>
    </Space>
  )
}
