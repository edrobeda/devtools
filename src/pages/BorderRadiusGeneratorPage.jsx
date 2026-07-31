import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Slider, Checkbox, message, Row, Col } from 'antd'
import { BorderOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CORNERS = ['tl', 'tr', 'br', 'bl']

function buildCss(corners, advanced) {
  const h = CORNERS.map((c) => `${corners[c].h}px`)
  const v = CORNERS.map((c) => `${corners[c].v}px`)
  const hasEllipse = advanced && CORNERS.some((c) => corners[c].h !== corners[c].v)

  if (!hasEllipse) {
    const allSame = h.every((val) => val === h[0])
    return allSame ? h[0] : h.join(' ')
  }
  return `${h.join(' ')} / ${v.join(' ')}`
}

const translations = {
  pt: {
    title: 'Gerador de Border Radius',
    intro: (
      <>
        Ajusta o raio de cada canto de forma independente e gera o{' '}
        <Text code>border-radius</Text> pronto pra copiar. No modo avançado,
        cada canto ganha um valor horizontal e vertical distintos, gerando a
        sintaxe elíptica completa (<Text code>h1 h2 h3 h4 / v1 v2 v3 v4</Text>).
      </>
    ),
    corner: {
      tl: 'Superior-esquerdo',
      tr: 'Superior-direito',
      br: 'Inferior-direito',
      bl: 'Inferior-esquerdo',
    },
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    advanced: 'Modo avançado (raio elíptico, h/v independentes)',
    css: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
  },
  en: {
    title: 'Border Radius Generator',
    intro: (
      <>
        Adjusts each corner's radius independently and generates a
        ready-to-copy <Text code>border-radius</Text>. In advanced mode, each
        corner gets distinct horizontal and vertical values, producing the
        full elliptical syntax (<Text code>h1 h2 h3 h4 / v1 v2 v3 v4</Text>).
      </>
    ),
    corner: {
      tl: 'Top-left',
      tr: 'Top-right',
      br: 'Bottom-right',
      bl: 'Bottom-left',
    },
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    advanced: 'Advanced mode (elliptical radius, independent h/v)',
    css: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
  },
}

export default function BorderRadiusGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [advanced, setAdvanced] = useState(false)
  const [corners, setCorners] = useState({
    tl: { h: 40, v: 40 },
    tr: { h: 40, v: 40 },
    br: { h: 40, v: 40 },
    bl: { h: 40, v: 40 },
  })

  const radiusValue = useMemo(() => buildCss(corners, advanced), [corners, advanced])
  const fullCss = `border-radius: ${radiusValue};`

  function updateCorner(key, axis, value) {
    setCorners((prev) => ({
      ...prev,
      [key]: { ...prev[key], [axis]: value, ...(advanced ? {} : { h: value, v: value }) },
    }))
  }

  function copy() {
    navigator.clipboard.writeText(fullCss)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BorderOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <div
        style={{
          height: 220,
          borderRadius: 12,
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 220,
            height: 140,
            background: '#1677ff',
            borderRadius: radiusValue,
          }}
        />
      </div>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Checkbox checked={advanced} onChange={(e) => setAdvanced(e.target.checked)}>{t.advanced}</Checkbox>

          <Row gutter={[24, 16]}>
            {CORNERS.map((key) => (
              <Col xs={24} sm={12} key={key}>
                <Card size="small" title={t.corner[key]}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text type="secondary">{t.horizontal}: {corners[key].h}px</Text>
                      <Slider
                        min={0}
                        max={200}
                        value={corners[key].h}
                        onChange={(v) => updateCorner(key, 'h', v)}
                      />
                    </div>
                    {advanced && (
                      <div>
                        <Text type="secondary">{t.vertical}: {corners[key].v}px</Text>
                        <Slider
                          min={0}
                          max={200}
                          value={corners[key].v}
                          onChange={(v) => updateCorner(key, 'v', v)}
                        />
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>

      <Card
        title={t.css}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullCss}</code>
        </pre>
      </Card>
    </Space>
  )
}
