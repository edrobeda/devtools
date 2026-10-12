import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Segmented, Button, message } from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { hexToHsl, hslToHex } from '../utils/colorConvert'

const { Title, Paragraph, Text } = Typography

function buildPalette(baseHex, mode) {
  const { h, s, l } = hexToHsl(baseHex)
  switch (mode) {
    case 'complementary':
      return [baseHex.toLowerCase(), hslToHex(h + 180, s, l)]
    case 'analogous':
      return [hslToHex(h - 30, s, l), baseHex.toLowerCase(), hslToHex(h + 30, s, l)]
    case 'triadic':
      return [baseHex.toLowerCase(), hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)]
    case 'monochromatic':
      return [20, 35, 50, 65, 80].map((lightness) => hslToHex(h, s, lightness))
    default:
      return [baseHex.toLowerCase()]
  }
}

const MODES = ['complementary', 'analogous', 'triadic', 'monochromatic']

const translations = {
  pt: {
    title: 'Gerador de Paleta de Cores',
    intro: 'Gera uma paleta a partir de uma cor base, girando o matiz (hue) em HSL — complementar (180°), análoga (±30°), triádica (120°/240°) ou monocromática (mesmo matiz, variando luminosidade). Tudo calculado localmente.',
    baseColor: 'Cor base',
    mode: 'Modo',
    modes: {
      complementary: 'Complementar',
      analogous: 'Análoga',
      triadic: 'Triádica',
      monochromatic: 'Monocromática',
    },
    copy: 'Copiar',
    copiedMessage: (hex) => `${hex} copiado`,
  },
  en: {
    title: 'Color Palette Generator',
    intro: 'Generates a palette from a base color by rotating hue in HSL — complementary (180°), analogous (±30°), triadic (120°/240°), or monochromatic (same hue, varying lightness). Everything computed locally.',
    baseColor: 'Base color',
    mode: 'Mode',
    modes: {
      complementary: 'Complementary',
      analogous: 'Analogous',
      triadic: 'Triadic',
      monochromatic: 'Monochromatic',
    },
    copy: 'Copy',
    copiedMessage: (hex) => `${hex} copied`,
  },
}

export default function PaletteGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [baseColor, setBaseColor] = useState('#1677ff')
  const [mode, setMode] = useState('analogous')

  const palette = useMemo(() => buildPalette(baseColor, mode), [baseColor, mode])

  function copy(hex) {
    navigator.clipboard.writeText(hex)
    message.success(t.copiedMessage(hex))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space size="large" wrap align="center">
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.baseColor}</Text>
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              style={{ width: 56, height: 40, border: 'none', cursor: 'pointer', background: 'none' }}
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.mode}</Text>
            <Segmented
              value={mode}
              onChange={setMode}
              options={MODES.map((m) => ({ label: t.modes[m], value: m }))}
            />
          </Space>
        </Space>
      </Card>

      <Card>
        <Space size="middle" wrap>
          {palette.map((hex) => (
            <Space key={hex} direction="vertical" align="center" size={8}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  background: hex,
                  border: '1px solid #d9d9d9',
                }}
              />
              <Text code>{hex}</Text>
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(hex)}>{t.copy}</Button>
            </Space>
          ))}
        </Space>
      </Card>
    </Space>
  )
}
