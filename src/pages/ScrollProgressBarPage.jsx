import React, { useRef, useState } from 'react'
import { Typography, Card, Space } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `/* CSS */
.scroll-progress-track {
  position: sticky;
  top: 0;
  height: 4px;
  width: 100%;
  background: rgba(0, 0, 0, 0.08);
  z-index: 1;
}
.scroll-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #722ed1);
  width: 0%; /* atualizado via JS */
  transition: width 80ms linear;
}

// React
function ScrollProgressBar({ containerRef }) {
  const [progress, setProgress] = useState(0)

  function handleScroll() {
    const el = containerRef.current
    const max = el.scrollHeight - el.clientHeight
    setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0)
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} style={{ overflow: 'auto' }}>
      <div className="scroll-progress-track">
        <div className="scroll-progress-bar" style={{ width: \`\${progress}%\` }} />
      </div>
      {/* conteúdo scrollável aqui */}
    </div>
  )
}`

const translations = {
  pt: {
    title: 'Componente: Indicador de Progresso de Scroll',
    intro: (
      <>
        Barra fina fixa no topo de uma área com scroll, cuja largura reflete
        quanto já foi rolado — comum em posts de blog longos. A lógica é só
        aritmética simples no evento <Text code>onScroll</Text>:{' '}
        <Text code>scrollTop / (scrollHeight - clientHeight)</Text>, sem
        biblioteca nem <Text code>IntersectionObserver</Text>. A barra usa{' '}
        <Text code>position: sticky</Text> pra ficar colada no topo do
        próprio container rolável, e uma transição curta de{' '}
        <Text code>width</Text> suaviza o preenchimento.
      </>
    ),
    demoTitle: 'Demonstração',
    demoDesc: 'Role a caixa abaixo — a barra no topo acompanha o progresso:',
    sourceTitle: 'Código-fonte',
    paragraphs: [
      'Role esta caixa pra ver a barra de progresso no topo reagir em tempo real.',
      'Ela é útil em páginas de artigo longas, documentação técnica ou qualquer lista extensa onde o usuário quer saber quanto falta.',
      'A implementação não depende de nenhuma biblioteca externa — só o evento onScroll do elemento com overflow: auto e um pouco de aritmética.',
      'Diferente de um indicador de scroll da janela inteira, este é escopado a um container específico, então funciona igualmente bem dentro de um modal, painel lateral ou card com altura fixa.',
      'Continue rolando para ver a barra se aproximar de 100%.',
      'Quase lá...',
      'Fim do conteúdo — a barra deveria estar totalmente preenchida agora.',
    ],
  },
  en: {
    title: 'Component: Scroll Progress Indicator',
    intro: (
      <>
        A thin bar pinned to the top of a scrollable area, whose width
        reflects how much has been scrolled — common in long blog posts. The
        logic is plain arithmetic on the <Text code>onScroll</Text> event:{' '}
        <Text code>scrollTop / (scrollHeight - clientHeight)</Text>, no
        library, no <Text code>IntersectionObserver</Text>. The bar uses{' '}
        <Text code>position: sticky</Text> to stay pinned to the top of its
        own scrollable container, and a short <Text code>width</Text>{' '}
        transition smooths the fill.
      </>
    ),
    demoTitle: 'Demo',
    demoDesc: 'Scroll the box below — the bar at the top tracks progress in real time:',
    sourceTitle: 'Source code',
    paragraphs: [
      'Scroll this box to see the progress bar at the top react in real time.',
      'It is useful on long article pages, technical docs, or any long list where the user wants to know how much is left.',
      'The implementation has no external library dependency — just the onScroll event of an overflow: auto element and a bit of arithmetic.',
      'Unlike a full-window scroll indicator, this one is scoped to a specific container, so it works just as well inside a modal, side panel, or fixed-height card.',
      'Keep scrolling to see the bar get closer to 100%.',
      'Almost there...',
      'End of content — the bar should be fully filled now.',
    ],
  },
}

export default function ScrollProgressBarPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const containerRef = useRef(null)
  const [progress, setProgress] = useState(0)

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><LineChartOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Text type="secondary">{t.demoDesc}</Text>
        <div
          style={{
            marginTop: 12,
            height: 260,
            overflow: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
          }}
          ref={containerRef}
          onScroll={handleScroll}
        >
          <div style={{ position: 'sticky', top: 0, height: 4, width: '100%', background: 'rgba(0,0,0,0.08)', zIndex: 1 }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #1677ff, #722ed1)',
                transition: 'width 80ms linear',
              }}
            />
          </div>
          <div style={{ padding: '16px 20px' }}>
            {t.paragraphs.map((p, i) => (
              <Paragraph key={i}>{p}</Paragraph>
            ))}
          </div>
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
