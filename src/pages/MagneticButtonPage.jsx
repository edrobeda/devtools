import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Typography, Card, Space, Slider, Button, Row, Col, Divider } from 'antd'
import { ThunderboltOutlined, RocketOutlined, HeartOutlined, DownloadOutlined, BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Componente: o botão propriamente dito.
// - Sem useState/re-render em cada mouse move: posição e escala são
//   lidas/escritas direto em refs e o style é aplicado via inline. Apenas
//   um único <button> re-renderiza, e isso não acontece em cada evento.
// - requestAnimationFrame faz o lerp (easing exponencial) até o alvo —
//   começa a animação se não estiver rodando, e para sozinho quando o
//   delta fica abaixo do epsilon (idle).
// - A "zona de atração" (range, em px) define a partir de quantos px de
//   distância do centro ele responde; dentro dela, a translação é
//   proporcional ao deslocamento do cursor vezes strength (0..1).
function MagneticButton({
  children,
  strength = 0.35,
  range = 120,
  scale = 1.06,
  bg = '#1677ff',
  color = '#fff',
  radius = 12,
  padding = '14px 28px',
  fontSize = 16,
  ...rest
}) {
  const btnRef = useRef(null)
  // refs de "animação" — guardam o alvo que queremos atingir e o valor
  // atual do lerp. Não disparam re-render.
  const target = useRef({ x: 0, y: 0, s: 1 })
  const current = useRef({ x: 0, y: 0, s: 1 })
  const rafId = useRef(null)

  const ease = 0.18

  const step = useCallback(() => {
    const btn = btnRef.current
    if (!btn) {
      rafId.current = null
      return
    }
    current.current.x += (target.current.x - current.current.x) * ease
    current.current.y += (target.current.y - current.current.y) * ease
    current.current.s += (target.current.s - current.current.s) * ease
    btn.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0) scale(${current.current.s.toFixed(4)})`

    const dx = Math.abs(target.current.x - current.current.x)
    const dy = Math.abs(target.current.y - current.current.y)
    const ds = Math.abs(target.current.s - current.current.s)
    if (dx > 0.05 || dy > 0.05 || ds > 0.0008) {
      rafId.current = requestAnimationFrame(step)
    } else {
      // snap final pra zerar erro residual
      current.current.x = target.current.x
      current.current.y = target.current.y
      current.current.s = target.current.s
      btn.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) scale(${current.current.s})`
      rafId.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(step)
    }
  }, [step])

  // Cancela o rAF pendente ao desmontar pra não rodar contra um ref morto.
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [])

  const handleMove = useCallback((e) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > range) {
      // fora do alcance — não puxa
      target.current.x = 0
      target.current.y = 0
    } else {
      // dentro do alcance — translação proporcional ao strength.
      // clamp implícito: a distância máxima do centro é ~range, então
      // |dx|*strength <= range*strength <= ~0.35*120 ≈ 42px num caso
      // extremo. Sem precisar de clamp explícito.
      target.current.x = dx * strength
      target.current.y = dy * strength
    }
    target.current.s = scale
    start()
  }, [strength, range, scale, start])

  const handleEnter = useCallback(() => {
    target.current.s = scale
    start()
  }, [scale, start])

  const handleLeave = useCallback(() => {
    target.current.x = 0
    target.current.y = 0
    target.current.s = 1
    start()
  }, [start])

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding,
        fontSize,
        fontWeight: 600,
        background: bg,
        color,
        border: 'none',
        borderRadius: radius,
        cursor: 'pointer',
        boxShadow: `0 6px 18px ${bg}55`,
        willChange: 'transform',
        transform: 'translate3d(0,0,0) scale(1)',
        transition: 'background-color 200ms ease, box-shadow 200ms ease, color 200ms ease',
        ...rest.style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

const sourceCode = `import React, { useRef, useCallback, useEffect } from 'react'

// Botão "magnético": puxa para perto do mouse quando o cursor entra na sua
// zona de atração (range), e volta suavemente pro centro ao sair.
//
// Sem useState em cada mouse move: posição e escala são lidas/escritas
// direto em refs e aplicadas via style. Zero re-render por movimento.
// requestAnimationFrame faz o lerp (easing exponencial 0.18) até o alvo
// — começa quando precisa, para sozinho quando o delta fica abaixo do
// epsilon (idle). Pra cancelAnimationFrame on unmount pra não rodar
// contra um ref morto.

export function MagneticButton({
  children,
  strength = 0.35,
  range = 120,
  scale = 1.06,
  bg = '#1677ff',
  color = '#fff',
  radius = 12,
  padding = '14px 28px',
  fontSize = 16,
  ...rest
}) {
  const btnRef = useRef(null)
  const target = useRef({ x: 0, y: 0, s: 1 })
  const current = useRef({ x: 0, y: 0, s: 1 })
  const rafId = useRef(null)
  const EASE = 0.18

  const step = useCallback(() => {
    const btn = btnRef.current
    if (!btn) { rafId.current = null; return }
    current.current.x += (target.current.x - current.current.x) * EASE
    current.current.y += (target.current.y - current.current.y) * EASE
    current.current.s += (target.current.s - current.current.s) * EASE
    btn.style.transform = \`translate3d(\${current.current.x.toFixed(2)}px, \${current.current.y.toFixed(2)}px, 0) scale(\${current.current.s.toFixed(4)})\`

    const dx = Math.abs(target.current.x - current.current.x)
    const dy = Math.abs(target.current.y - current.current.y)
    const ds = Math.abs(target.current.s - current.current.s)
    if (dx > 0.05 || dy > 0.05 || ds > 0.0008) {
      rafId.current = requestAnimationFrame(step)
    } else {
      // snap final pra zerar erro residual e desligar o loop
      current.current.x = target.current.x
      current.current.y = target.current.y
      current.current.s = target.current.s
      btn.style.transform = \`translate3d(\${current.current.x}px, \${current.current.y}px, 0) scale(\${current.current.s})\`
      rafId.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (rafId.current === null) rafId.current = requestAnimationFrame(step)
  }, [step])

  useEffect(() => () => {
    if (rafId.current !== null) cancelAnimationFrame(rafId.current)
  }, [])

  const handleMove = useCallback((e) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > range) {
      target.current.x = 0
      target.current.y = 0
    } else {
      target.current.x = dx * strength
      target.current.y = dy * strength
    }
    target.current.s = scale
    start()
  }, [strength, range, scale, start])

  const handleEnter = useCallback(() => {
    target.current.s = scale
    start()
  }, [scale, start])

  const handleLeave = useCallback(() => {
    target.current.x = 0
    target.current.y = 0
    target.current.s = 1
    start()
  }, [start])

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding,
        fontSize,
        fontWeight: 600,
        background: bg,
        color,
        border: 'none',
        borderRadius: radius,
        cursor: 'pointer',
        boxShadow: \`0 6px 18px \${bg}55\`,
        willChange: 'transform',
        transform: 'translate3d(0,0,0) scale(1)',
        transition: 'background-color 200ms ease, box-shadow 200ms ease, color 200ms ease',
        ...rest.style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

// uso:
//   <MagneticButton strength={0.4} range={150}>Primary action</MagneticButton>
//   <MagneticButton bg="#52c41a" range={80} scale={1.12}>
//     <DownloadOutlined /> Install
//   </MagneticButton>`

const translations = {
  pt: {
    title: 'Componente: Botão com Hover Magnético',
    intro: (
      <>
        Botão que <Text strong>segue o cursor</Text> quando o mouse entra na sua zona de atração, e
        volta suavemente ao centro quando sai. A translação é proporcional ao deslocamento do
        cursor vezes um<Text code>strength</Text> (0–1), dentro de um<Text code>range</Text> (px) além
        do qual o botão ignora o cursor — assim o efeito não "gruda" quando o mouse está longe.
        A escala (opcional) acompanha o hover. Implementação 100% React + refs +{' '}
        <Text code>requestAnimationFrame</Text> com easing exponencial —{' '}
        <Text strong>sem re-renders</Text> por movimento de mouse, sem biblioteca de animação.
      </>
    ),
    demoTitle: 'Demonstração interativa',
    strengthLabel: 'Força da atração (0–1)',
    rangeLabel: 'Alcance da zona (px)',
    scaleLabel: 'Escala no hover',
    showcase: 'Galeria de variações',
    gallery: (
      <>
        Quatro botões com parâmetros diferentes lado a lado — útil pra comparar o "feel" de cada
        combinação: o azul usa força alta e range pequeno (efeito "agressivo"), o verde usa força
        média e range grande (efeito "suave"), o rosa tem escala bem visível e o cinza usa fundo
        neutro pra servir de modelo de CTA.
      </>
    ),
    controlsTitle: 'Controles',
    controls: (
      <>
        Mexa nos sliders para ajustar o botão abaixo em tempo real. O texto e o ícone são só pra
        preencher — o que importa é o comportamento do{' '}
        <Text code>transform</Text> ao mover o mouse sobre ele.
      </>
    ),
    resetButton: 'Restaurar padrões',
    presetsTitle: 'Presets rápidos',
    presetPrimary: 'Primário',
    presetArrow: 'Próximo passo',
    presetDownload: 'Baixar agora',
    presetSave: 'Salvar',
    sourceTitle: 'Código-fonte',
    perfTitle: 'Por que isso não trava',
    perf: (
      <>
        O caminho ingênuo — armazenar<Text code>x</Text>,<Text code>y</Text> e escala em{' '}
        <Text code>useState</Text> e renderizar o componente a cada movimento de mouse — gera um
        re-render por evento (e <Text code>mousemove</Text> dispara em cada pixel percorrido).
        Aqui, posição e escala são lidas/escritas direto em refs e aplicadas via{' '}
        <Text code>style.transform</Text>, sem nunca passar por state. O único React render é o
        inicial; o resto é manipulação direta do DOM. A animação usa um único{' '}
        <Text code>requestAnimationFrame</Text> que se auto-desliga quando o delta entre posição
        atual e alvo fica abaixo do epsilon (0.05 px / 0.0008 em escala), e{' '}
        <Text code>cancelAnimationFrame</Text> no cleanup do <Text code>useEffect</Text>{' '}
        garante que ele não rode contra um ref morto se o componente desmontar no meio da
        animação.
      </>
    ),
    sourceHint: 'Cole o componente num arquivo .jsx e use direto no seu projeto — zero dependência externa.',
  },
  en: {
    title: 'Component: Magnetic Hover Button',
    intro: (
      <>
        Button that <Text strong>follows the cursor</Text> when the mouse enters its attraction zone,
        and smoothly snaps back to center when it leaves. The translation is proportional to the
        cursor offset times a <Text code>strength</Text> (0–1), within a <Text code>range</Text> (px)
        beyond which the button ignores the cursor — so the effect doesn't "stick" when the mouse is
        far away. An optional scale accompanies the hover. Implementation is 100% React + refs +{' '}
        <Text code>requestAnimationFrame</Text> with exponential easing —{' '}
        <Text strong>no re-renders</Text> on mouse move, no animation library.
      </>
    ),
    demoTitle: 'Interactive demo',
    strengthLabel: 'Pull strength (0–1)',
    rangeLabel: 'Attraction range (px)',
    scaleLabel: 'Scale on hover',
    showcase: 'Variations gallery',
    gallery: (
      <>
        Four buttons with different parameters side by side — useful to compare the "feel" of each
        combination: blue uses high strength and small range (an "aggressive" effect), green uses
        mid strength and a large range (a "soft" effect), pink has a much more visible scale and
        gray uses a neutral fill as a CTA baseline.
      </>
    ),
    controlsTitle: 'Controls',
    controls: (
      <>
        Move them to tweak the button below in real time. The label and icon are just filler — what
        matters is the behavior of <Text code>transform</Text> as you move the mouse over it.
      </>
    ),
    resetButton: 'Reset to defaults',
    presetsTitle: 'Quick presets',
    presetPrimary: 'Primary',
    presetArrow: 'Next step',
    presetDownload: 'Download now',
    presetSave: 'Save',
    sourceTitle: 'Source code',
    perfTitle: 'Why this does not lag',
    perf: (
      <>
        The naive approach — store <Text code>x</Text>, <Text code>y</Text> and scale in{' '}
        <Text code>useState</Text> and re-render the component on every mouse move — generates a
        re-render per event (and <Text code>mousemove</Text> fires at every pixel travelled). Here,
        position and scale are read/written straight into refs and applied via{' '}
        <Text code>style.transform</Text>, never touching state. The only React render is the initial
        one; everything else is direct DOM manipulation. The animation uses a single{' '}
        <Text code>requestAnimationFrame</Text> that auto-stops when the delta between current and
        target position drops below an epsilon (0.05 px / 0.0008 on scale), and{' '}
        <Text code>cancelAnimationFrame</Text> on the <Text code>useEffect</Text> cleanup makes sure
        it never runs against a dead ref if the component unmounts mid-animation.
      </>
    ),
    sourceHint: 'Drop the component into a .jsx file and use it directly in your project — zero external dependencies.',
  },
}

const DEFAULT_STRENGTH = 0.35
const DEFAULT_RANGE = 120
const DEFAULT_SCALE = 1.06

export default function MagneticButtonPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [strength, setStrength] = useState(DEFAULT_STRENGTH)
  const [range, setRange] = useState(DEFAULT_RANGE)
  const [scale, setScale] = useState(DEFAULT_SCALE)

  // Botão "reset" restaura os defaults (sem usar < > 100% lado a lado).
  const handleReset = () => {
    setStrength(DEFAULT_STRENGTH)
    setRange(DEFAULT_RANGE)
    setScale(DEFAULT_SCALE)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Paragraph type="secondary" style={{ marginTop: -4, marginBottom: 0 }}>{t.controls}</Paragraph>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.strengthLabel}</Text>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={strength}
                onChange={setStrength}
                marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
              />
              <Text code style={{ fontSize: 12 }}>{strength.toFixed(2)}</Text>
            </Col>
            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.rangeLabel}</Text>
              <Slider
                min={20}
                max={400}
                step={5}
                value={range}
                onChange={setRange}
                marks={{ 20: '20', 200: '200', 400: '400' }}
              />
              <Text code style={{ fontSize: 12 }}>{range}px</Text>
            </Col>
            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.scaleLabel}</Text>
              <Slider
                min={1}
                max={1.3}
                step={0.01}
                value={scale}
                onChange={setScale}
                marks={{ 1: '1.0', 1.15: '1.15', 1.3: '1.3' }}
              />
              <Text code style={{ fontSize: 12 }}>{scale.toFixed(2)}×</Text>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0' }} />

          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
              borderRadius: 12,
              padding: '64px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 180,
            }}
          >
            <MagneticButton strength={strength} range={range} scale={scale}>
              <ThunderboltOutlined /> {t.presetPrimary}
            </MagneticButton>
          </div>

          <div>
            <Button onClick={handleReset}>{t.resetButton}</Button>
          </div>
        </Space>
      </Card>

      <Card title={t.showcase}>
        <Paragraph type="secondary" style={{ marginTop: -4 }}>{t.gallery}</Paragraph>
        <Row gutter={[16, 24]} style={{ marginTop: 8 }}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 120, alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: 24 }}>
              <MagneticButton strength={0.55} range={80} scale={1.04} bg="#1677ff" radius={10}>
                <ThunderboltOutlined /> {t.presetPrimary}
              </MagneticButton>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 120, alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: 24 }}>
              <MagneticButton strength={0.22} range={220} scale={1.03} bg="#52c41a" radius={999}>
                <RocketOutlined /> {t.presetArrow}
              </MagneticButton>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 120, alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: 24 }}>
              <MagneticButton strength={0.4} range={140} scale={1.18} bg="#eb2f96" radius={14}>
                <DownloadOutlined /> {t.presetDownload}
              </MagneticButton>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 120, alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: 24 }}>
              <MagneticButton strength={0.3} range={100} scale={1.05} bg="#262626" color="#fff" radius={16} padding="12px 24px" fontSize={14}>
                <HeartOutlined /> {t.presetSave}
              </MagneticButton>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title={t.perfTitle}>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>{t.perf}</Paragraph>
      </Card>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary" style={{ fontSize: 13, marginTop: -4 }}>{t.sourceHint}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}