import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Slider, Switch, message } from 'antd'
import { BgColorsOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const PRESET_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#f5222d', '#13c2c2']

let nextId = 0
function makeStop(color, position) {
  return { id: nextId++, color, position }
}

const PRESETS = [
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
    ].map(([color, position]) => makeStop(color, position)),
  },
  {
    angle: 45,
    cx: 50,
    cy: 50,
    stops: [
      ['#ffe8ba', 0],
      ['#fd5d5d', 180],
      ['#a44ad8', 360],
    ].map(([color, position]) => makeStop(color, position)),
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
      ['#1677ff', 360],
    ].map(([color, position]) => makeStop(color, position)),
  },
]

const translations = {
  pt: {
    title: 'Gerador de Gradiente Cônico CSS',
    intro: 'Monta um gradiente circular (conic-gradient) com ângulo inicial, centro e quantos stops de cor quiser, e copia o CSS pronto. Perfeito pra anéis de progresso, donuts e roletas.',
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
    title: 'CSS Conic Gradient Generator',
    intro: 'Visually build a circular conic-gradient with a starting angle, center point and as many color stops as you want, and copy the ready-to-use CSS. Great for progress rings, donuts and wheels.',
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

export default function ConicGradientGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [angle, setAngle] = useState(90)
  const [cx, setCx] = useState(50)
  const [cy, setCy] = useState(50)
  const [repeating, setRepeating] = useState(false)
  const [stops, setStops] = useState([
    makeStop(PRESET_COLORS[0], 0),
    makeStop(PRESET_COLORS[1], 120),
    makeStop(PRESET_COLORS[2], 240),
  ])

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  )

  const stopsCss = sortedStops.map((s) => `${s.color} ${s.position}deg`).join(', ')
  const gradientFn = repeating ? 'repeating-conic-gradient' : 'conic-gradient'
  const gradientCss = `${gradientFn}(from ${angle}deg at ${cx}% ${cy}%, ${stopsCss})`
  const fullCss = `background: ${gradientCss};`

  function applyPreset(preset) {
    setAngle(preset.angle)
    setCx(preset.cx)
    setCy(preset.cy)
    setStops(preset.stops.map((s) => makeStop(s.color, s.position)))
  }

  function updateStop(id, patch) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addStop() {
    const color = PRESET_COLORS[stops.length % PRESET_COLORS.length]
    setStops((prev) => [...prev, makeStop(color, 120)])
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

      <Space align="center" wrap>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: gradientCss,
            border: '1px solid #d9d9d9',
          }}
        />
      </Space>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text>{t.presets}:</Text>
            <Space wrap style={{ marginLeft: 8 }}>
              <Button size="small" onClick={() => applyPreset(PRESETS[0])}>{t.presetRainbow}</Button>
              <Button size="small" onClick={() => applyPreset(PRESETS[1])}>{t.presetSunset}</Button>
              <Button size="small" onClick={() => applyPreset(PRESETS[2])}>{t.presetSlices}</Button>
            </Space>
          </div>

          <div>
            <Text>{t.from}: {angle}°</Text>
            <Slider min={0} max={360} value={angle} onChange={setAngle} />
          </div>

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

          <Space align="center">
            <Switch size="small" checked={repeating} onChange={setRepeating} />
            <Text>{t.repeating}</Text>
          </Space>

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
                    max={360}
                    value={stop.position}
                    onChange={(v) => updateStop(stop.id, { position: v })}
                    style={{ width: 160 }}
                  />
                  <Text style={{ width: 44 }}>{stop.position}°</Text>
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