import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Segmented, Button, message } from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

function normalizeHex(hex) {
  const match = HEX_RE.exec((hex || '').trim())
  if (!match) return null
  let value = match[1]
  if (value.length === 3) value = value.split('').map((c) => c + c).join('')
  return `#${value.toLowerCase()}`
}

function hexToHsl(hex) {
  const value = normalizeHex(hex)
  const r = parseInt(value.slice(1, 3), 16) / 255
  const g = parseInt(value.slice(3, 5), 16) / 255
  const b = parseInt(value.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return { h, s: s * 100, l: l * 100 }
}

function hslToHex(h, s, l) {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.min(100, Math.max(0, s)) / 100
  const ll = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0; let g = 0; let b = 0
  if (hh < 60) { r = c; g = x; b = 0 }
  else if (hh < 120) { r = x; g = c; b = 0 }
  else if (hh < 180) { r = 0; g = c; b = x }
  else if (hh < 240) { r = 0; g = x; b = c }
  else if (hh < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

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
