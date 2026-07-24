import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, message, Row, Col } from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

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

function normalizeHex(hex) {
  const match = HEX_RE.exec(hex.trim())
  if (!match) return null
  let value = match[1]
  if (value.length === 3) {
    value = value.split('').map((c) => c + c).join('')
  }
  return `#${value.toLowerCase()}`
}

function hexToRgb(hex) {
  const value = normalizeHex(hex)
  if (!value) return null
  const r = parseInt(value.slice(1, 3), 16)
  const g = parseInt(value.slice(3, 5), 16)
  const b = parseInt(value.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) }
}

export default function ColorConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [hexInput, setHexInput] = useState('#1677ff')

  const normalized = normalizeHex(hexInput)
  const rgb = useMemo(() => (normalized ? hexToRgb(normalized) : null), [normalized])
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb) : null), [rgb])

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
