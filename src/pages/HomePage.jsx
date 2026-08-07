import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Typography, Space, Input, Tag, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { LABELS, buildMenuItems } from '../components/AppLayout'
import { NEW_ITEM_KEYS } from '../newItems'
import { useNewItemKeys } from '../hooks/useNewItemKeys'

const { Title, Paragraph, Text } = Typography

// ─── Linha de montagem animada ──────────────────────────────────
// Caixas coloridas nascem à esquerda, andam pela esteira e "somem" à
// direita bem no instante em que a estrelinha pisca — sugerindo que uma
// ferramenta nova acabou de ser produzida e publicada.
const BOX_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1']

function AssemblyLine() {
  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
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
    searchPlaceholder: 'Buscar ferramenta, estilo, snippet...',
    whatsNew: 'Novidades de hoje',
    noResults: 'Nada encontrado',
    itemsCount: (n) => `${n} ${n === 1 ? 'item' : 'itens'}`,
    totalSummary: (tools, cats) => `${tools} itens em ${cats} categorias`,
  },
  en: {
    title: 'DevTools',
    tagline: "Something new ships every day — the belt never stops.",
    searchPlaceholder: 'Search tools, styles, snippets...',
    whatsNew: "What's new today",
    noResults: 'Nothing found',
    itemsCount: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
    totalSummary: (tools, cats) => `${tools} items across ${cats} categories`,
  },
}

// Slug é o último trecho da rota (ex.: '/tools/jwt-decoder' -> 'jwt-decoder'),
// mesma chave usada em LABELS — convenção já seguida em todas as rotas
// existentes e no prompt do agente noturno.
function slugOf(key) {
  return key.split('/').pop()
}

export default function HomePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const l = LABELS[lang]
  const [query, setQuery] = useState('')

  // NEW_ITEM_KEYS (importado acima) é mutado in-place por useNewItemKeys —
  // `newItemsVersion` muda quando os dados chegam e força os useMemo abaixo
  // a recalcular, senão eles ficariam presos no valor da primeira renderização
  // (array vazio, antes do fetch responder).
  const newItemsVersion = useNewItemKeys()

  const groups = useMemo(
    () => buildMenuItems(l).filter((g) => g.key !== '/'),
    [l]
  )

  const totalItems = useMemo(
    () => groups.reduce((sum, g) => sum + g.children.length, 0),
    [groups]
  )

  const q = query.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    return groups
      .map((g) => ({
        key: g.key,
        icon: g.icon,
        title: g.label,
        items: g.children
          .map((c) => ({
            key: c.key,
            label: l[slugOf(c.key)] || slugOf(c.key),
            isNew: NEW_ITEM_KEYS.includes(c.key),
          }))
          .filter((item) => !q || item.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, l, q, newItemsVersion])

  const newItems = useMemo(
    () =>
      NEW_ITEM_KEYS.map((key) => ({
        key,
        label: l[slugOf(key)] || slugOf(key),
      })),
    [l, newItemsVersion]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 640, margin: '0 auto' }} align="center">
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: 4 }}>{t.title}</Title>
          <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 0 }}>
            {t.tagline}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t.totalSummary(totalItems, groups.length)}
          </Text>
        </div>

        <AssemblyLine />

        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 480 }}
        />
      </Space>

      {!q && newItems.length > 0 && (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.whatsNew}</Text>
          <Space size={[8, 8]} wrap>
            {newItems.map((item) => (
              <Link key={item.key} to={item.key}>
                <Tag color="green" style={{ fontSize: 13, padding: '4px 10px', cursor: 'pointer' }}>
                  {item.label}
                </Tag>
              </Link>
            ))}
          </Space>
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <Empty description={t.noResults} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {filteredGroups.map((g) => (
            <div
              key={g.key}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: '12px 16px',
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#1677ff', fontSize: 16 }}>{g.icon}</span>
                <Text strong>{g.title}</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
                  {g.items.length}
                </Text>
              </div>
              {g.items.map((item) => (
                <Link
                  key={item.key}
                  to={item.key}
                  style={{
                    fontSize: 13,
                    lineHeight: '22px',
                    color: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {item.label}
                  {item.isNew && (
                    <Tag color="green" style={{ marginLeft: 0, lineHeight: '16px', fontSize: 10, padding: '0 4px' }}>
                      {lang === 'pt' ? 'Novo' : 'New'}
                    </Tag>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </Space>
  )
}
