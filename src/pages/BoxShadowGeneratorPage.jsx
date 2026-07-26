import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Button, Slider, Checkbox, message } from 'antd'
import { BorderOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

let nextId = 0
function makeLayer(overrides = {}) {
  return {
    id: nextId++,
    x: 0,
    y: 4,
    blur: 12,
    spread: 0,
    color: '#000000',
    opacity: 25,
    inset: false,
    ...overrides,
  }
}

function hexToRgba(hex, opacityPercent) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${(opacityPercent / 100).toFixed(2)})`
}

function layerToCss(layer) {
  const color = hexToRgba(layer.color, layer.opacity)
  return `${layer.inset ? 'inset ' : ''}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${color}`
}

const translations = {
  pt: {
    title: 'Gerador de Box Shadow',
    intro: 'Monta um box-shadow visualmente, com quantas camadas quiser, e copia o CSS pronto. Sombras múltiplas se combinam separadas por vírgula.',
    layers: 'Camadas',
    addLayer: 'Adicionar camada',
    offsetX: 'Deslocamento X',
    offsetY: 'Deslocamento Y',
    blur: 'Desfoque',
    spread: 'Expansão',
    color: 'Cor',
    opacity: 'Opacidade',
    inset: 'Interna (inset)',
    css: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    minLayers: 'É preciso ter pelo menos 1 camada.',
  },
  en: {
    title: 'Box Shadow Generator',
    intro: 'Visually build a box-shadow with as many layers as you want, and copy the ready-to-use CSS. Multiple shadows combine, separated by commas.',
    layers: 'Layers',
    addLayer: 'Add layer',
    offsetX: 'Offset X',
    offsetY: 'Offset Y',
    blur: 'Blur',
    spread: 'Spread',
    color: 'Color',
    opacity: 'Opacity',
    inset: 'Inset',
    css: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    minLayers: 'You need at least 1 layer.',
  },
}

export default function BoxShadowGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [layers, setLayers] = useState([makeLayer({ y: 4, blur: 12, opacity: 25 })])

  const boxShadowCss = useMemo(() => layers.map(layerToCss).join(', '), [layers])
  const fullCss = `box-shadow: ${boxShadowCss};`

  function updateLayer(id, patch) {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLayer() {
    setLayers((prev) => [...prev, makeLayer()])
  }

  function removeLayer(id) {
    if (layers.length <= 1) {
      message.warning(t.minLayers)
      return
    }
    setLayers((prev) => prev.filter((l) => l.id !== id))
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
            width: 160,
            height: 100,
            borderRadius: 8,
            background: '#fff',
            boxShadow: boxShadowCss,
          }}
        />
      </div>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>{t.layers}</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={addLayer}>{t.addLayer}</Button>
        </Space>

        {layers.map((layer) => (
          <Card
            key={layer.id}
            size="small"
            extra={
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeLayer(layer.id)} />
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space wrap size="large">
                <div style={{ width: 200 }}>
                  <Text>{t.offsetX}: {layer.x}px</Text>
                  <Slider min={-50} max={50} value={layer.x} onChange={(v) => updateLayer(layer.id, { x: v })} />
                </div>
                <div style={{ width: 200 }}>
                  <Text>{t.offsetY}: {layer.y}px</Text>
                  <Slider min={-50} max={50} value={layer.y} onChange={(v) => updateLayer(layer.id, { y: v })} />
                </div>
                <div style={{ width: 200 }}>
                  <Text>{t.blur}: {layer.blur}px</Text>
                  <Slider min={0} max={100} value={layer.blur} onChange={(v) => updateLayer(layer.id, { blur: v })} />
                </div>
                <div style={{ width: 200 }}>
                  <Text>{t.spread}: {layer.spread}px</Text>
                  <Slider min={-50} max={50} value={layer.spread} onChange={(v) => updateLayer(layer.id, { spread: v })} />
                </div>
                <div style={{ width: 200 }}>
                  <Text>{t.opacity}: {layer.opacity}%</Text>
                  <Slider min={0} max={100} value={layer.opacity} onChange={(v) => updateLayer(layer.id, { opacity: v })} />
                </div>
              </Space>
              <Space align="center">
                <Text>{t.color}:</Text>
                <input
                  type="color"
                  value={layer.color}
                  onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                  style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <Text code>{layer.color}</Text>
                <Checkbox checked={layer.inset} onChange={(e) => updateLayer(layer.id, { inset: e.target.checked })}>
                  {t.inset}
                </Checkbox>
              </Space>
            </Space>
          </Card>
        ))}
      </Space>

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
