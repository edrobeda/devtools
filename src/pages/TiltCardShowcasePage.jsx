import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Typography, Card, Space, Row, Col, Slider, Switch } from 'antd'
import { BgColorsOutlined, ThunderboltOutlined, CloudOutlined, RocketOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

function TiltCard({ children, maxTilt = 14, scale = 1.03, glare = true, glareOpacity = 0.25, style = {} }) {
  const cardRef = useRef(null)
  const glareRef = useRef(null)
  const frameRef = useRef(null)
  const stateRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 50, over: false })

  const apply = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    const s = stateRef.current
    card.style.transform = `perspective(700px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) scale(${s.over ? scale : 1})`
    if (glare && glareRef.current) {
      glareRef.current.style.opacity = s.over ? 1 : 0
      glareRef.current.style.background = `radial-gradient(circle at ${s.gx}% ${s.gy}%, rgba(255,255,255,${glareOpacity}) 0%, transparent 62%)`
    }
  }, [scale, glare, glareOpacity])

  const handleMove = useCallback((e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const s = stateRef.current
    s.rx = (0.5 - py) * 2 * maxTilt
    s.ry = (px - 0.5) * 2 * maxTilt
    s.gx = px * 100
    s.gy = py * 100
    s.over = true
    card.style.transition = 'transform 80ms linear'
    if (glareRef.current) glareRef.current.style.transition = 'opacity 120ms linear'
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(apply)
  }, [maxTilt, apply])

  const handleLeave = useCallback(() => {
    const s = stateRef.current
    s.rx = 0
    s.ry = 0
    s.over = false
    const card = cardRef.current
    if (card) card.style.transition = 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)'
    if (glareRef.current) glareRef.current.style.transition = 'opacity 300ms ease'
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(apply)
  }, [apply])

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: 28,
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #1f2937 0%, #111827 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        transform: 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
        ...style,
      }}
    >
      {glare && (
        <div
          ref={glareRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25) 0%, transparent 62%)',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

const sourceCode = `import React, { useCallback, useEffect, useRef } from 'react'

function TiltCard({ children, maxTilt = 14, scale = 1.03, glare = true, glareOpacity = 0.25, style = {} }) {
  const cardRef = useRef(null)
  const glareRef = useRef(null)
  const frameRef = useRef(null)
  const stateRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 50, over: false })

  const apply = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    const s = stateRef.current
    card.style.transform = \`perspective(700px) rotateX(\${s.rx}deg) rotateY(\${s.ry}deg) scale(\${s.over ? scale : 1})\`
    if (glare && glareRef.current) {
      glareRef.current.style.opacity = s.over ? 1 : 0
      glareRef.current.style.background = \`radial-gradient(circle at \${s.gx}% \${s.gy}%, rgba(255,255,255,\${glareOpacity}) 0%, transparent 62%)\`
    }
  }, [scale, glare, glareOpacity])

  const handleMove = useCallback((e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const s = stateRef.current
    s.rx = (0.5 - py) * 2 * maxTilt
    s.ry = (px - 0.5) * 2 * maxTilt
    s.gx = px * 100
    s.gy = py * 100
    s.over = true
    card.style.transition = 'transform 80ms linear'
    if (glareRef.current) glareRef.current.style.transition = 'opacity 120ms linear'
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(apply)
  }, [maxTilt, apply])

  const handleLeave = useCallback(() => {
    const s = stateRef.current
    s.rx = 0
    s.ry = 0
    s.over = false
    const card = cardRef.current
    if (card) card.style.transition = 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)'
    if (glareRef.current) glareRef.current.style.transition = 'opacity 300ms ease'
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(apply)
  }, [apply])

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: 28,
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #1f2937 0%, #111827 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        transform: 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
        ...style,
      }}
    >
      {glare && (
        <div
          ref={glareRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25) 0%, transparent 62%)',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

// Example: three tiltable cards on a dark background
<Row gutter={[16, 16]}>
  <Col span={8}>
    <TiltCard>
      <h3 style={{ color: '#fff', margin: 0 }}>Hover me</h3>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>The card tilts in 3D following the cursor.</p>
    </TiltCard>
  </Col>
</Row>`

const translations = {
  pt: {
    title: 'Estilo: 3D Tilt Card',
    intro: 'Cartão que inclina em 3D seguindo o cursor: a posição do mouse dentro do card vira os eixos rotateX / rotateY sobre uma perspectiva, com um brilho (glare) que acompanha o ponteiro. Sem bibliotecas — os valores são escritos direto no estilo via refs e requestAnimationFrame, então não há re-renderizações a cada movimento do mouse.',
    sourceTitle: 'Código-fonte',
    controlsTitle: 'Ajustes do preview',
    maxTiltLabel: 'Inclinação máxima (maxTilt)',
    scaleLabel: 'Zoom no hover (scale)',
    glareLabel: 'Brilho acompanhando o cursor',
    card1Title: 'Deploys hoje',
    card1Value: '12',
    card1Desc: 'Passe o mouse para inclinar.',
    card2Title: 'Uptime',
    card2Value: '99.98%',
    card2Desc: 'Perspectiva + rotateX/Y.',
    card3Title: 'Builds na fila',
    card3Value: '3',
    card3Desc: 'Sem re-renderizações.',
    tip: 'Dica: o transform usa perspective() embutido, então funciona em qualquer lugar (sem necessidade de um pai com perspectiva). Quando o mouse sai, o card volta ao normal com uma transição suave.',
  },
  en: {
    title: 'Style: 3D Tilt Card',
    intro: 'A card that tilts in 3D following the cursor: the mouse position inside the card drives rotateX / rotateY over a perspective, plus a glare highlight that follows the pointer. No libraries — values are written straight to the style via refs and requestAnimationFrame, so there are no re-renders on every mouse move.',
    sourceTitle: 'Source code',
    controlsTitle: 'Preview settings',
    maxTiltLabel: 'Max tilt (maxTilt)',
    scaleLabel: 'Hover zoom (scale)',
    glareLabel: 'Glare following the cursor',
    card1Title: 'Deploys today',
    card1Value: '12',
    card1Desc: 'Hover to tilt.',
    card2Title: 'Uptime',
    card2Value: '99.98%',
    card2Desc: 'Perspective + rotateX/Y.',
    card3Title: 'Builds queued',
    card3Value: '3',
    card3Desc: 'No re-renders.',
    tip: 'Tip: the transform bakes in perspective(), so it works anywhere (no perspective parent required). When the mouse leaves, the card springs back with a smooth transition.',
  },
}

export default function TiltCardShowcasePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [maxTilt, setMaxTilt] = useState(14)
  const [scalePct, setScalePct] = useState(3)
  const [glareOn, setGlareOn] = useState(true)

  const cards = [
    { icon: <ThunderboltOutlined />, title: t.card1Title, value: t.card1Value, desc: t.card1Desc },
    { icon: <CloudOutlined />, title: t.card2Title, value: t.card2Value, desc: t.card2Desc },
    { icon: <RocketOutlined />, title: t.card3Title, value: t.card3Value, desc: t.card3Desc },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.controlsTitle} size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text>{t.maxTiltLabel}: <Text strong>{maxTilt}°</Text></Text>
            <Slider min={0} max={35} value={maxTilt} onChange={setMaxTilt} />
          </div>
          <div>
            <Text>{t.scaleLabel}: <Text strong>{scalePct > 0 ? `+${scalePct}%` : '1.00'}</Text></Text>
            <Slider min={0} max={15} value={scalePct} onChange={setScalePct} />
          </div>
          <Space>
            <Switch checked={glareOn} onChange={setGlareOn} />
            <Text>{t.glareLabel}</Text>
          </Space>
        </Space>
      </Card>

      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        <Row gutter={[16, 16]}>
          {cards.map((c) => (
            <Col xs={24} sm={8} key={c.title}>
              <TiltCard maxTilt={maxTilt} scale={1 + scalePct / 100} glare={glareOn}>
                <Space direction="vertical" size={8} style={{ minHeight: 120 }}>
                  <span style={{ fontSize: 24, color: '#fff' }}>{c.icon}</span>
                  <Text style={{ color: 'rgba(255,255,255,0.75)' }}>{c.title}</Text>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{c.value}</span>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{c.desc}</Text>
                </Space>
              </TiltCard>
            </Col>
          ))}
        </Row>
      </div>

      <Paragraph type="secondary">{t.tip}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}