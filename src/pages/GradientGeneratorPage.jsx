import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Radio, Slider, Switch, message } from 'antd'
import { BgColorsOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const PRESET_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#f5222d', '#13c2c2']

const PERCENT_MAX = 100
const CONIC_MAX = 360

const CONIC_PRESETS = [
  {
    angle: 90,
    cx: 50,
    cy: 50,
    stops: [
      ['#ff4d4f', 0],
      ['#faad14', 51],
      ['#52c41a', 102],
      ['#13c2c2', 153],
      ['#1677ff', 204],
      ['#722ed1', 255],
      ['#eb2f96', 306],
    ],
  },
  {
    angle: 45,
    cx: 50,
    cy: 50,
    stops: [
      ['#ffe8ba', 0],
      ['#fd5d5d', 180],
      ['#a44ad8', 360],
    ],
  },
  {
    angle: 0,
    cx: 50,
    cy: 50,
    stops: [
      ['#1677ff', 0],
      ['#1677ff', 80],
      ['#eb2f96', 80],
      ['#eb2f96', 160],
      ['#52c41a', 160],
      ['#52c41a', 240],
      ['#faad14', 240],
      ['#faad14', 320],
      ['#1677ff', 320],
      ['#1677ff', 360],
    ],
  },
]

let nextId = 0
function makeStop(color, position) {
  return { id: nextId++, color, position }
}

const translations = {
  pt: {
    title: 'Gerador de Gradiente CSS',
    intro: 'Monta um gradiente CSS visualmente — linear, radial ou cônico, com quantos stops de cor quiser — e copia o código pronto pra usar. No cônico dá pra ajustar centro e repetir, pra anéis de progresso, donuts e roletas.',
    type: 'Tipo',
    linear: 'Linear',
    radial: 'Radial',
    conic: 'Cônico',
    angle: 'Ângulo',
    from: 'De',
    center: 'Centro',
    cx: 'X',
    cy: 'Y',
    repeating: 'Repetir (repeating-conic-gradient)',
    presets: 'Presets',
    presetRainbow: 'Arco-íris',
    presetSunset: 'Pôr do sol',
    presetSlices: 'Fatias',
    stops: 'Stops de cor',
    addStop: 'Adicionar stop',
    position: 'Posição',
    css: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    minStops: 'É preciso ter pelo menos 2 stops.',
  },
  en: {
    title: 'CSS Gradient Generator',
    intro: 'Visually build a CSS gradient — linear, radial or conic, with as many color stops as you want — and copy the ready-to-use code. Conic mode adds center and repeat controls, great for progress rings, donuts and wheels.',
    type: 'Type',
    linear: 'Linear',
    radial: 'Radial',
    conic: 'Conic',
    angle: 'Angle',
    from: 'From',
    center: 'Center',
    cx: 'X',
    cy: 'Y',
    repeating: 'Repeat (repeating-conic-gradient)',
    presets: 'Presets',
    presetRainbow: 'Rainbow',
    presetSunset: 'Sunset',
    presetSlices: 'Slices',
    stops: 'Color stops',
    addStop: 'Add stop',
    position: 'Position',
    css: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    minStops: 'You need at least 2 stops.',
  },
}

export default function GradientGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [type, setType] = useState('linear')
  const [angle, setAngle] = useState(90)
  const [cx, setCx] = useState(50)
  const [cy, setCy] = useState(50)
  const [repeating, setRepeating] = useState(false)
  const [stops, setStops] = useState([
    makeStop(PRESET_COLORS[0], 0),
    makeStop(PRESET_COLORS[1], 100),
  ])

  const isConic = type === 'conic'
  const unit = isConic ? 'deg' : '%'
  const maxPosition = isConic ? CONIC_MAX : PERCENT_MAX

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  )

  const stopsCss = sortedStops.map((s) => `${s.color} ${s.position}${unit}`).join(', ')
  const gradientCss = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stopsCss})`
    : type === 'radial'
      ? `radial-gradient(circle, ${stopsCss})`
      : `${repeating ? 'repeating-conic-gradient' : 'conic-gradient'}(from ${angle}deg at ${cx}% ${cy}%, ${stopsCss})`
  const fullCss = `background: ${gradientCss};`

  function changeType(next) {
    if ((next === 'conic') !== (type === 'conic')) {
      const factor = next === 'conic' ? CONIC_MAX / PERCENT_MAX : PERCENT_MAX / CONIC_MAX
      setStops((prev) => prev.map((s) => ({ ...s, position: Math.round(s.position * factor) })))
    }
    setType(next)
  }

  function applyPreset(preset) {
    setAngle(preset.angle)
    setCx(preset.cx)
    setCy(preset.cy)
    setStops(preset.stops.map(([color, position]) => makeStop(color, position)))
  }

  function updateStop(id, patch) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addStop() {
    const color = PRESET_COLORS[stops.length % PRESET_COLORS.length]
    setStops((prev) => [...prev, makeStop(color, maxPosition / 2)])
  }

  function removeStop(id) {
    if (stops.length <= 2) {
      message.warning(t.minStops)
      return
    }
    setStops((prev) => prev.filter((s) => s.id !== id))
  }

  function copy() {
    navigator.clipboard.writeText(fullCss)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {isConic ? (
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: gradientCss,
            border: '1px solid #d9d9d9',
          }}
        />
      ) : (
        <div
          style={{
            height: 180,
            borderRadius: 12,
            background: gradientCss,
            border: '1px solid #d9d9d9',
          }}
        />
      )}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center">
            <Text>{t.type}:</Text>
            <Radio.Group value={type} onChange={(e) => changeType(e.target.value)} optionType="button">
              <Radio.Button value="linear">{t.linear}</Radio.Button>
              <Radio.Button value="radial">{t.radial}</Radio.Button>
              <Radio.Button value="conic">{t.conic}</Radio.Button>
            </Radio.Group>
          </Space>

          {isConic && (
            <div>
              <Text>{t.presets}:</Text>
              <Space wrap style={{ marginLeft: 8 }}>
                <Button size="small" onClick={() => applyPreset(CONIC_PRESETS[0])}>{t.presetRainbow}</Button>
                <Button size="small" onClick={() => applyPreset(CONIC_PRESETS[1])}>{t.presetSunset}</Button>
                <Button size="small" onClick={() => applyPreset(CONIC_PRESETS[2])}>{t.presetSlices}</Button>
              </Space>
            </div>
          )}

          {(type === 'linear' || isConic) && (
            <div>
              <Text>{isConic ? t.from : t.angle}: {angle}°</Text>
              <Slider min={0} max={360} value={angle} onChange={setAngle} />
            </div>
          )}

          {isConic && (
            <Space align="center" size="large" wrap>
              <div style={{ width: 220 }}>
                <Text>{t.center} — {t.cx}: {cx}%</Text>
                <Slider min={0} max={100} value={cx} onChange={setCx} />
              </div>
              <div style={{ width: 220 }}>
                <Text>{t.center} — {t.cy}: {cy}%</Text>
                <Slider min={0} max={100} value={cy} onChange={setCy} />
              </div>
            </Space>
          )}

          {isConic && (
            <Space align="center">
              <Switch size="small" checked={repeating} onChange={setRepeating} />
              <Text>{t.repeating}</Text>
            </Space>
          )}

          <div>
            <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
              <Text strong>{t.stops}</Text>
              <Button size="small" icon={<PlusOutlined />} onClick={addStop}>{t.addStop}</Button>
            </Space>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stops.map((stop) => (
                <Space key={stop.id} align="center" wrap>
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                    style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <Text code style={{ width: 76 }}>{stop.color}</Text>
                  <Text type="secondary">{t.position}:</Text>
                  <Slider
                    min={0}
                    max={maxPosition}
                    value={stop.position}
                    onChange={(v) => updateStop(stop.id, { position: v })}
                    style={{ width: 160 }}
                  />
                  <Text style={{ width: 48 }}>{stop.position}{unit}</Text>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeStop(stop.id)}
                  />
                </Space>
              ))}
            </Space>
          </div>
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
