import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Row, Col, Tag, Descriptions } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { hexToRgb, contrastRatio } from '../utils/colorConvert'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Checador de Contraste de Cores (WCAG)',
    intro: (
      <>
        Cola duas cores (texto e fundo) e veja a razão de contraste calculada
        via luminância relativa, e se ela passa nos critérios WCAG AA/AAA —
        tudo client-side, fórmula direto da especificação.
      </>
    ),
    foreground: 'Cor do texto',
    background: 'Cor do fundo',
    ratio: 'Razão de contraste',
    preview: 'Pré-visualização',
    previewText: 'Texto de exemplo — Aa Bb Cc 123',
    normalText: 'Texto normal',
    largeText: 'Texto grande (≥18pt ou ≥14pt negrito)',
    pass: 'Passa',
    fail: 'Falha',
    invalid: 'Cor inválida — use formato hex, ex: #1677ff',
  },
  en: {
    title: 'Color Contrast Checker (WCAG)',
    intro: (
      <>
        Paste two colors (text and background) and see the contrast ratio
        computed via relative luminance, and whether it passes WCAG AA/AAA —
        all client-side, formula straight from the spec.
      </>
    ),
    foreground: 'Text color',
    background: 'Background color',
    ratio: 'Contrast ratio',
    preview: 'Preview',
    previewText: 'Sample text — Aa Bb Cc 123',
    normalText: 'Normal text',
    largeText: 'Large text (≥18pt or ≥14pt bold)',
    pass: 'Pass',
    fail: 'Fail',
    invalid: 'Invalid color — use hex format, e.g. #1677ff',
  },
}

function PassTag({ pass, label }) {
  return <Tag color={pass ? 'green' : 'red'}>{label}</Tag>
}

export default function ContrastCheckerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [fg, setFg] = useState('#1677ff')
  const [bg, setBg] = useState('#ffffff')

  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg])
  const valid = ratio !== null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Text strong>{t.foreground}</Text>
            <Space style={{ marginTop: 8, display: 'flex' }}>
              <input type="color" value={hexToRgb(fg) ? fg : '#000000'} onChange={(e) => setFg(e.target.value)} />
              <Input value={fg} onChange={(e) => setFg(e.target.value)} style={{ width: 140, fontFamily: 'monospace' }} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>{t.background}</Text>
            <Space style={{ marginTop: 8, display: 'flex' }}>
              <input type="color" value={hexToRgb(bg) ? bg : '#ffffff'} onChange={(e) => setBg(e.target.value)} />
              <Input value={bg} onChange={(e) => setBg(e.target.value)} style={{ width: 140, fontFamily: 'monospace' }} />
            </Space>
          </Col>
        </Row>
      </Card>

      {!valid && <Paragraph type="danger">{t.invalid}</Paragraph>}

      {valid && (
        <>
          <Card title={t.preview}>
            <div style={{ background: bg, color: fg, padding: 32, borderRadius: 8, textAlign: 'center', fontSize: 20 }}>
              {t.previewText}
            </div>
          </Card>

          <Card>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.ratio}>
                <Text strong style={{ fontSize: 18 }}>{ratio.toFixed(2)}:1</Text>
              </Descriptions.Item>
              <Descriptions.Item label={`AA — ${t.normalText}`}>
                <PassTag pass={ratio >= 4.5} label={ratio >= 4.5 ? t.pass : t.fail} />
              </Descriptions.Item>
              <Descriptions.Item label={`AA — ${t.largeText}`}>
                <PassTag pass={ratio >= 3} label={ratio >= 3 ? t.pass : t.fail} />
              </Descriptions.Item>
              <Descriptions.Item label={`AAA — ${t.normalText}`}>
                <PassTag pass={ratio >= 7} label={ratio >= 7 ? t.pass : t.fail} />
              </Descriptions.Item>
              <Descriptions.Item label={`AAA — ${t.largeText}`}>
                <PassTag pass={ratio >= 4.5} label={ratio >= 4.5 ? t.pass : t.fail} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}
    </Space>
  )
}
