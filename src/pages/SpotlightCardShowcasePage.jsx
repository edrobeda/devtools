import React, { useRef, useCallback } from 'react'
import { Typography, Card, Space, Row, Col } from 'antd'
import { BgColorsOutlined, ThunderboltOutlined, CloudOutlined, RocketOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

function SpotlightCard({ children, glowColor = 'rgba(255, 255, 255, 0.18)', background = 'rgba(255, 255, 255, 0.05)', borderColor = 'rgba(255, 255, 255, 0.12)', style = {} }) {
  const wrapperRef = useRef(null)
  const glowRef = useRef(null)

  const handleMove = useCallback((e) => {
    const wrapper = wrapperRef.current
    const glow = glowRef.current
    if (!wrapper || !glow) return
    const rect = wrapper.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glow.style.transform = `translate(${x}px, ${y}px)`
  }, [])

  const handleLeave = useCallback(() => {
    const glow = glowRef.current
    if (!glow) return
    glow.style.transform = 'translate(-9999px, -9999px)'
  }, [])

  const wrapperStyle = {
    position: 'relative',
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
    background,
    border: `1px solid ${borderColor}`,
    cursor: 'default',
    ...style,
  }

  const glowStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 240,
    marginTop: -120,
    marginLeft: -120,
    borderRadius: '50%',
    pointerEvents: 'none',
    background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
    transform: 'translate(-9999px, -9999px)',
    transition: 'transform 60ms linear',
    willChange: 'transform',
  }

  const contentStyle = {
    position: 'relative',
    zIndex: 1,
  }

  return (
    <div ref={wrapperRef} style={wrapperStyle} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div ref={glowRef} style={glowStyle} aria-hidden="true" />
      <div style={contentStyle}>{children}</div>
    </div>
  )
}

const sourceCode = `import React, { useRef, useCallback } from 'react'

function SpotlightCard({ children, glowColor = 'rgba(255,255,255,0.18)', background = 'rgba(255,255,255,0.05)', borderColor = 'rgba(255,255,255,0.12)' }) {
  const wrapperRef = useRef(null)
  const glowRef = useRef(null)

  const handleMove = useCallback((e) => {
    const wrapper = wrapperRef.current
    const glow = glowRef.current
    if (!wrapper || !glow) return
    const rect = wrapper.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glow.style.transform = \`translate(\${x}px, \${y}px)\`
  }, [])

  const handleLeave = useCallback(() => {
    const glow = glowRef.current
    if (glow) glow.style.transform = 'translate(-9999px, -9999px)'
  }, [])

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: 24,
        overflow: 'hidden',
        background,
        border: \`1px solid \${borderColor}\`,
      }}
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 240,
          height: 240,
          marginTop: -120,
          marginLeft: -120,
          borderRadius: '50%',
          pointerEvents: 'none',
          background: \`radial-gradient(circle, \${glowColor} 0%, transparent 70%)\`,
          transform: 'translate(-9999px, -9999px)',
          transition: 'transform 60ms linear',
          willChange: 'transform',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

// Example: place it over a dark/gradient background
<div style={{ background: 'linear-gradient(135deg, #1f2937, #111827)', padding: 32 }}>
  <SpotlightCard glowColor="rgba(99, 102, 241, 0.35)">
    <h3 style={{ color: '#fff', margin: 0 }}>Hover me</h3>
    <p style={{ color: 'rgba(255,255,255,0.7)' }}>The glow follows the cursor.</p>
  </SpotlightCard>
</div>`

const translations = {
  pt: {
    title: 'Estilo: Spotlight Card',
    intro: 'Cartão com um brilho radial que acompanha o cursor. O efeito é feito apenas com CSS (gradiente radial) e React refs — sem bibliotecas, sem re-renderizações a cada movimento do mouse, porque a posição do brilho é atualizada diretamente via estilo inline.',
    sourceTitle: 'Código-fonte',
    card1Title: 'Deploys hoje',
    card1Value: '12',
    card1Desc: 'Passe o mouse para ver o brilho.',
    card2Title: 'Uptime',
    card2Value: '99.98%',
    card2Desc: 'Apenas CSS + React.',
    card3Title: 'Builds na fila',
    card3Value: '3',
    card3Desc: 'Sem renderizações extras.',
    tip: 'Dica: funciona melhor sobre fundos escuros ou gradientes fortes, pois o brilho usa cores com transparência.',
  },
  en: {
    title: 'Style: Spotlight Card',
    intro: 'A card with a radial glow that follows the cursor. The effect is built with plain CSS (radial gradient) and React refs — no libraries, no re-renders on every mouse move because the glow position is updated directly via inline style.',
    sourceTitle: 'Source code',
    card1Title: 'Deploys today',
    card1Value: '12',
    card1Desc: 'Hover to see the glow.',
    card2Title: 'Uptime',
    card2Value: '99.98%',
    card2Desc: 'Plain CSS + React.',
    card3Title: 'Builds queued',
    card3Value: '3',
    card3Desc: 'No extra renders.',
    tip: 'Tip: works best over dark or strong gradient backgrounds, since the glow relies on transparent colors.',
  },
}

export default function SpotlightCardShowcasePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const cards = [
    { icon: <ThunderboltOutlined />, title: t.card1Title, value: t.card1Value, desc: t.card1Desc, glow: 'rgba(129, 140, 248, 0.35)' },
    { icon: <CloudOutlined />, title: t.card2Title, value: t.card2Value, desc: t.card2Desc, glow: 'rgba(52, 211, 153, 0.35)' },
    { icon: <RocketOutlined />, title: t.card3Title, value: t.card3Value, desc: t.card3Desc, glow: 'rgba(244, 114, 182, 0.35)' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <div
        style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        <Row gutter={[16, 16]}>
          {cards.map((c) => (
            <Col xs={24} sm={8} key={c.title}>
              <SpotlightCard glowColor={c.glow}>
                <Space direction="vertical" size={8}>
                  <span style={{ fontSize: 24, color: '#fff' }}>{c.icon}</span>
                  <Text style={{ color: 'rgba(255,255,255,0.75)' }}>{c.title}</Text>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{c.value}</span>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{c.desc}</Text>
                </Space>
              </SpotlightCard>
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
