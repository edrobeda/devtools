import React, { useEffect, useRef } from 'react'
import { Typography, Card, Space, Button } from 'antd'
import { GiftOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const COLORS = ['#1677ff', '#722ed1', '#eb2f96', '#fa8c16', '#52c41a', '#faad14', '#13c2c2']
const GRAVITY = 0.18
const DRAG = 0.005

function createParticle(width, height) {
  const angle = Math.random() * Math.PI * 2
  const speed = 4 + Math.random() * 8
  return {
    x: width / 2,
    y: height * 0.35,
    vx: Math.cos(angle) * speed * (0.4 + Math.random() * 0.6),
    vy: Math.sin(angle) * speed - 6 - Math.random() * 4,
    size: 5 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 16,
    shape: Math.random() < 0.5 ? 'rect' : 'circle',
    life: 0,
    maxLife: 90 + Math.random() * 40,
  }
}

const sourceCode = `// Física simples: gravidade constante + arrasto leve, sem lib.
// Cada partícula é um retângulo ou círculo colorido girando enquanto cai,
// e desaparece (fade) perto do fim da vida útil em vez de sumir abrupto.
function createParticle(width, height) {
  const angle = Math.random() * Math.PI * 2
  const speed = 4 + Math.random() * 8
  return {
    x: width / 2,
    y: height * 0.35,
    vx: Math.cos(angle) * speed * (0.4 + Math.random() * 0.6),
    vy: Math.sin(angle) * speed - 6 - Math.random() * 4, // impulso pra cima
    size: 5 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 16,
    shape: Math.random() < 0.5 ? 'rect' : 'circle',
    life: 0,
    maxLife: 90 + Math.random() * 40,
  }
}

function tick(particles, ctx, width, height) {
  ctx.clearRect(0, 0, width, height)
  for (const p of particles) {
    p.vy += GRAVITY
    p.vx *= 1 - DRAG
    p.x += p.vx
    p.y += p.vy
    p.rotation += p.rotationSpeed
    p.life += 1

    const fadeStart = p.maxLife * 0.7
    const opacity = p.life < fadeStart ? 1 : Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart))

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.globalAlpha = opacity
    ctx.fillStyle = p.color
    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
    } else {
      ctx.beginPath()
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  // remove partículas mortas ou que já saíram por baixo da tela
  return particles.filter((p) => p.life < p.maxLife && p.y < height + 40)
}`

const translations = {
  pt: {
    title: 'Componente: Efeito de Confete',
    intro: (
      <>
        Explosão de confete em <Text code>&lt;canvas&gt;</Text> pura, sem
        biblioteca — gravidade e arrasto constantes simulam a queda, cada
        partícula gira em velocidade própria e desaparece com fade perto do
        fim da vida útil, em vez de sumir de repente. Bom pra celebrar uma
        ação — "deploy com sucesso", "todos os testes passaram" etc. O loop
        roda em <Text code>requestAnimationFrame</Text> e se auto-encerra
        quando não sobra partícula viva, sem <Text code>setInterval</Text>{' '}
        residual.
      </>
    ),
    demoTitle: 'Demonstração',
    demoDesc: 'Clique pra disparar uma explosão de confete:',
    fire: 'Comemorar 🎉',
    sourceTitle: 'Código-fonte',
  },
  en: {
    title: 'Component: Confetti Effect',
    intro: (
      <>
        A confetti burst on plain <Text code>&lt;canvas&gt;</Text>, no
        library — constant gravity and drag simulate the fall, each particle
        spins at its own rate and fades out near the end of its life instead
        of vanishing abruptly. Good for celebrating an action — "deploy
        succeeded", "all tests passed", etc. The loop runs on{' '}
        <Text code>requestAnimationFrame</Text> and stops itself once no
        particle is left alive, with no lingering{' '}
        <Text code>setInterval</Text>.
      </>
    ),
    demoTitle: 'Demo',
    demoDesc: 'Click to fire a confetti burst:',
    fire: 'Celebrate 🎉',
    sourceTitle: 'Source code',
  },
}

function useConfetti(canvasRef) {
  const particlesRef = useRef([])
  const rafRef = useRef(null)

  function loop() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    particlesRef.current = tick(particlesRef.current, ctx, canvas.width, canvas.height)
    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(loop)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      rafRef.current = null
    }
  }

  function tick(particles, ctx, width, height) {
    ctx.clearRect(0, 0, width, height)
    for (const p of particles) {
      p.vy += GRAVITY
      p.vx *= 1 - DRAG
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.life += 1

      const fadeStart = p.maxLife * 0.7
      const opacity = p.life < fadeStart ? 1 : Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart))

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = opacity
      ctx.fillStyle = p.color
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    return particles.filter((p) => p.life < p.maxLife && p.y < height + 40)
  }

  function fire() {
    const canvas = canvasRef.current
    if (!canvas) return
    const newParticles = Array.from({ length: 120 }, () => createParticle(canvas.width, canvas.height))
    particlesRef.current = [...particlesRef.current, ...newParticles]
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(loop)
    }
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return fire
}

export default function ConfettiEffectPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const fire = useConfetti(canvasRef)

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GiftOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Text type="secondary">{t.demoDesc}</Text>
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            marginTop: 12,
            height: 320,
            borderRadius: 8,
            background: 'repeating-linear-gradient(45deg, #fafafa, #fafafa 10px, #f0f0f0 10px, #f0f0f0 20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <Button type="primary" size="large" onClick={fire} style={{ position: 'relative', zIndex: 1 }}>
            {t.fire}
          </Button>
        </div>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
