import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, message, Row, Col } from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { normalizeHex, hexToRgb, rgbToHsl } from '../utils/colorConvert'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Conversor de Cor',
    intro: 'Converte entre HEX, RGB e HSL em tempo real. Digite um HEX ou use o seletor de cor — tudo calculado localmente, sem dependências.',
    invalidHex: 'HEX inválido',
    copy: 'Copiar',
    copiedMessage: (text) => `${text} copiado`,
  },
  en: {
    title: 'Color Converter',
    intro: 'Converts between HEX, RGB and HSL in real time. Type a HEX value or use the color picker — everything is computed locally, no dependencies.',
    invalidHex: 'Invalid HEX',
    copy: 'Copy',
    copiedMessage: (text) => `${text} copied`,
  },
}

export default function ColorConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [hexInput, setHexInput] = useState('#1677ff')

  const normalized = normalizeHex(hexInput)
  const rgb = useMemo(() => (normalized ? hexToRgb(normalized) : null), [normalized])
  const hsl = useMemo(() => {
    if (!rgb) return null
    const raw = rgbToHsl(rgb)
    return { h: raw.h, s: Math.round(raw.s), l: Math.round(raw.l) }
  }, [rgb])

  const rgbText = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : null
  const hslText = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : null

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copiedMessage(text))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space align="center" size="large" wrap>
          <input
            type="color"
            value={normalized || '#000000'}
            onChange={(e) => setHexInput(e.target.value)}
            style={{ width: 56, height: 40, border: 'none', cursor: 'pointer', background: 'none' }}
          />
          <Input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="#1677ff"
            style={{ width: 160, fontFamily: 'monospace' }}
            status={normalized ? '' : 'error'}
          />
          {!normalized && <Text type="danger">{t.invalidHex}</Text>}
        </Space>
      </Card>

      {normalized && (
        <Card>
          <Row gutter={16} align="middle">
            <Col flex="120px">
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  background: normalized,
                  border: '1px solid #d9d9d9',
                }}
              />
            </Col>
            <Col flex="auto">
              <Space direction="vertical" style={{ width: '100%' }}>
                {[
                  ['HEX', normalized],
                  ['RGB', rgbText],
                  ['HSL', hslText],
                ].map(([label, value]) => (
                  <Space key={label} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Text strong style={{ width: 40, display: 'inline-block' }}>{label}</Text>
                      <Text code>{value}</Text>
                    </Space>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copy(value)}>
                      {t.copy}
                    </Button>
                  </Space>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>
      )}
    </Space>
  )
}
