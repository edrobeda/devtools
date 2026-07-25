import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Radio, Slider, message } from 'antd'
import { BgColorsOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const PRESET_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#f5222d', '#13c2c2']

let nextId = 0
function makeStop(color, position) {
  return { id: nextId++, color, position }
}

const translations = {
  pt: {
    title: 'Gerador de Gradiente CSS',
    intro: 'Monta um gradiente CSS visualmente — linear ou radial, com quantos stops de cor quiser — e copia o código pronto pra usar.',
    type: 'Tipo',
    linear: 'Linear',
    radial: 'Radial',
    angle: 'Ângulo',
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
    intro: 'Visually build a CSS gradient — linear or radial, with as many color stops as you want — and copy the ready-to-use code.',
    type: 'Type',
    linear: 'Linear',
    radial: 'Radial',
    angle: 'Angle',
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
  const [stops, setStops] = useState([
    makeStop(PRESET_COLORS[0], 0),
    makeStop(PRESET_COLORS[1], 100),
  ])

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  )

  const stopsCss = sortedStops.map((s) => `${s.color} ${s.position}%`).join(', ')
  const gradientCss = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stopsCss})`
    : `radial-gradient(circle, ${stopsCss})`
  const fullCss = `background: ${gradientCss};`

  function updateStop(id, patch) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addStop() {
    const color = PRESET_COLORS[stops.length % PRESET_COLORS.length]
    setStops((prev) => [...prev, makeStop(color, 50)])
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

      <div
        style={{
          height: 180,
          borderRadius: 12,
          background: gradientCss,
          border: '1px solid #d9d9d9',
        }}
      />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center">
            <Text>{t.type}:</Text>
            <Radio.Group value={type} onChange={(e) => setType(e.target.value)} optionType="button">
              <Radio.Button value="linear">{t.linear}</Radio.Button>
              <Radio.Button value="radial">{t.radial}</Radio.Button>
            </Radio.Group>
          </Space>

          {type === 'linear' && (
            <div>
              <Text>{t.angle}: {angle}°</Text>
              <Slider min={0} max={360} value={angle} onChange={setAngle} />
            </div>
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
                    max={100}
                    value={stop.position}
                    onChange={(v) => updateStop(stop.id, { position: v })}
                    style={{ width: 160 }}
                  />
                  <Text style={{ width: 40 }}>{stop.position}%</Text>
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
