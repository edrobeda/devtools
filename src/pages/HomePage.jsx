import React from 'react'
import { Typography, Space } from 'antd'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph } = Typography

// ─── Linha de montagem animada ──────────────────────────────────
// Caixas coloridas nascem à esquerda, andam pela esteira e "somem" à
// direita bem no instante em que a estrelinha pisca — sugerindo que uma
// ferramenta nova acabou de ser produzida e publicada.
const BOX_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1']

function AssemblyLine() {
  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      <style>{`
        @keyframes devtools-belt-move {
          to { stroke-dashoffset: -36; }
        }
        @keyframes devtools-box-travel {
          0%   { transform: translateX(-40px); opacity: 0; }
          8%   { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translateX(560px); opacity: 0; }
        }
        @keyframes devtools-gear-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes devtools-spark-pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
      <svg viewBox="0 0 600 150" width="100%" role="img" aria-label="assembly line">
        {/* trilho da esteira */}
        <line
          x1="20" y1="104" x2="580" y2="104"
          stroke="#d9d9d9" strokeWidth="4" strokeLinecap="round"
          strokeDasharray="18 18"
          style={{ animation: 'devtools-belt-move 0.8s linear infinite' }}
        />

        {/* engrenagens de apoio nas pontas */}
        {[36, 564].map((cx) => (
          <g key={cx} transform={`translate(${cx} 104)`} style={{ transformOrigin: `${cx}px 104px`, animation: 'devtools-gear-spin 3s linear infinite' }}>
            <circle r="14" fill="none" stroke="#bfbfbf" strokeWidth="4" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <rect key={deg} x="-2.5" y="-19" width="5" height="8" fill="#bfbfbf" transform={`rotate(${deg})`} />
            ))}
          </g>
        ))}

        {/* caixas viajando pela esteira, uma atrás da outra */}
        {BOX_COLORS.map((color, i) => (
          <rect
            key={color}
            x="0" y="82" width="34" height="26" rx="6"
            fill={color}
            style={{
              animation: 'devtools-box-travel 5s linear infinite',
              animationDelay: `${i * 1}s`,
            }}
          />
        ))}

        {/* estrelinha piscando no fim da esteira: "produto novo!" */}
        <g transform="translate(560 60)" style={{ animation: 'devtools-spark-pulse 1.25s ease-in-out infinite' }}>
          <path
            d="M0 -14 L3.2 -3.2 L14 0 L3.2 3.2 L0 14 L-3.2 3.2 L-14 0 L-3.2 -3.2 Z"
            fill="#faad14"
          />
        </g>
      </svg>
    </div>
  )
}

const translations = {
  pt: {
    title: 'DevTools',
    tagline: 'Todo dia sai algo novo daqui — a esteira nunca para.',
    body: (
      <>
        Espaço de ferramentas internas de desenvolvimento que cresce sozinho:
        todas as noites, um agente autônomo adiciona uma ferramenta, um
        componente de estilo ou um snippet novo — sem intervenção humana.
        Volte amanhã e vai ter coisa diferente. Quer contribuir manualmente?
        Adicione páginas em <code>src/pages/</code> e registre a rota em{' '}
        <code>src/routes.jsx</code> — se precisar de API, os endpoints
        entram no <code>manager-api</code> compartilhado, não aqui.
      </>
    ),
  },
  en: {
    title: 'DevTools',
    tagline: "Something new ships every day — the belt never stops.",
    body: (
      <>
        A space for internal dev tools that grows on its own: every night,
        an autonomous agent adds a new tool, style component, or snippet —
        with zero human intervention. Come back tomorrow and something will
        be different. Want to contribute by hand? Add pages under{' '}
        <code>src/pages/</code> and register the route in{' '}
        <code>src/routes.jsx</code> — if an API is ever needed, endpoints
        go in the shared <code>manager-api</code>, not here.
      </>
    ),
  },
}

export default function HomePage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }} align="center">
      <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: 4 }}>{t.title}</Title>
          <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 0 }}>
            {t.tagline}
          </Paragraph>
        </div>

        <AssemblyLine />

        <Paragraph style={{ textAlign: 'center' }}>{t.body}</Paragraph>
      </Space>
    </Space>
  )
}
