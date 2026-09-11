import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Space, Input, Segmented, Tag, Alert, Empty, Tooltip, message } from 'antd'
import { SearchOutlined, BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// [nome, hex] — 148 cores nomeadas do CSS (CSS Color Module Level 4), em ordem alfabética.
const NAMED_COLORS = [
  ['aliceblue', '#F0F8FF'], ['antiquewhite', '#FAEBD7'], ['aqua', '#00FFFF'], ['aquamarine', '#7FFFD4'],
  ['azure', '#F0FFFF'], ['beige', '#F5F5DC'], ['bisque', '#FFE4C4'], ['black', '#000000'],
  ['blanchedalmond', '#FFEBCD'], ['blue', '#0000FF'], ['blueviolet', '#8A2BE2'], ['brown', '#A52A2A'],
  ['burlywood', '#DEB887'], ['cadetblue', '#5F9EA0'], ['chartreuse', '#7FFF00'], ['chocolate', '#D2691E'],
  ['coral', '#FF7F50'], ['cornflowerblue', '#6495ED'], ['cornsilk', '#FFF8DC'], ['crimson', '#DC143C'],
  ['cyan', '#00FFFF'], ['darkblue', '#00008B'], ['darkcyan', '#008B8B'], ['darkgoldenrod', '#B8860B'],
  ['darkgray', '#A9A9A9'], ['darkgreen', '#006400'], ['darkgrey', '#A9A9A9'], ['darkkhaki', '#BDB76B'],
  ['darkmagenta', '#8B008B'], ['darkolivegreen', '#556B2F'], ['darkorange', '#FF8C00'], ['darkorchid', '#9932CC'],
  ['darkred', '#8B0000'], ['darksalmon', '#E9967A'], ['darkseagreen', '#8FBC8F'], ['darkslateblue', '#483D8B'],
  ['darkslategray', '#2F4F4F'], ['darkslategrey', '#2F4F4F'], ['darkturquoise', '#00CED1'], ['darkviolet', '#9400D3'],
  ['deeppink', '#FF1493'], ['deepskyblue', '#00BFFF'], ['dimgray', '#696969'], ['dimgrey', '#696969'],
  ['dodgerblue', '#1E90FF'], ['firebrick', '#B22222'], ['floralwhite', '#FFFAF0'], ['forestgreen', '#228B22'],
  ['fuchsia', '#FF00FF'], ['gainsboro', '#DCDCDC'], ['ghostwhite', '#F8F8FF'], ['gold', '#FFD700'],
  ['goldenrod', '#DAA520'], ['gray', '#808080'], ['green', '#008000'], ['greenyellow', '#ADFF2F'],
  ['grey', '#808080'], ['honeydew', '#F0FFF0'], ['hotpink', '#FF69B4'], ['indianred', '#CD5C5C'],
  ['indigo', '#4B0082'], ['ivory', '#FFFFF0'], ['khaki', '#F0E68C'], ['lavender', '#E6E6FA'],
  ['lavenderblush', '#FFF0F5'], ['lawngreen', '#7CFC00'], ['lemonchiffon', '#FFFACD'], ['lightblue', '#ADD8E6'],
  ['lightcoral', '#F08080'], ['lightcyan', '#E0FFFF'], ['lightgoldenrodyellow', '#FAFAD2'], ['lightgray', '#D3D3D3'],
  ['lightgreen', '#90EE90'], ['lightgrey', '#D3D3D3'], ['lightpink', '#FFB6C1'], ['lightsalmon', '#FFA07A'],
  ['lightseagreen', '#20B2AA'], ['lightskyblue', '#87CEFA'], ['lightslategray', '#778899'], ['lightslategrey', '#778899'],
  ['lightsteelblue', '#B0C4DE'], ['lightyellow', '#FFFFE0'], ['lime', '#00FF00'], ['limegreen', '#32CD32'],
  ['linen', '#FAF0E6'], ['magenta', '#FF00FF'], ['maroon', '#800000'], ['mediumaquamarine', '#66CDAA'],
  ['mediumblue', '#0000CD'], ['mediumorchid', '#BA55D3'], ['mediumpurple', '#9370DB'], ['mediumseagreen', '#3CB371'],
  ['mediumslateblue', '#7B68EE'], ['mediumspringgreen', '#00FA9A'], ['mediumturquoise', '#48D1CC'], ['mediumvioletred', '#C71585'],
  ['midnightblue', '#191970'], ['mintcream', '#F5FFFA'], ['mistyrose', '#FFE4E1'], ['moccasin', '#FFE4B5'],
  ['navajowhite', '#FFDEAD'], ['navy', '#000080'], ['oldlace', '#FDF5E6'], ['olive', '#808000'],
  ['olivedrab', '#6B8E23'], ['orange', '#FFA500'], ['orangered', '#FF4500'], ['orchid', '#DA70D6'],
  ['palegoldenrod', '#EEE8AA'], ['palegreen', '#98FB98'], ['paleturquoise', '#AFEEEE'], ['palevioletred', '#DB7093'],
  ['papayawhip', '#FFEFD5'], ['peachpuff', '#FFDAB9'], ['peru', '#CD853F'], ['pink', '#FFC0CB'],
  ['plum', '#DDA0DD'], ['powderblue', '#B0E0E6'], ['purple', '#800080'], ['rebeccapurple', '#663399'],
  ['red', '#FF0000'], ['rosybrown', '#BC8F8F'], ['royalblue', '#4169E1'], ['saddlebrown', '#8B4513'],
  ['salmon', '#FA8072'], ['sandybrown', '#F4A460'], ['seagreen', '#2E8B57'], ['seashell', '#FFF5EE'],
  ['sienna', '#A0522D'], ['silver', '#C0C0C0'], ['skyblue', '#87CEEB'], ['slateblue', '#6A5ACD'],
  ['slategray', '#708090'], ['slategrey', '#708090'], ['snow', '#FFFAFA'], ['springgreen', '#00FF7F'],
  ['steelblue', '#4682B4'], ['tan', '#D2B48C'], ['teal', '#008080'], ['thistle', '#D8BFD8'],
  ['tomato', '#FF6347'], ['turquoise', '#40E0D0'], ['violet', '#EE82EE'], ['wheat', '#F5DEB3'],
  ['white', '#FFFFFF'], ['whitesmoke', '#F5F5F5'], ['yellow', '#FFFF00'], ['yellowgreen', '#9ACD32'],
]

// Famílias de cor para o filtro. `all` aparece primeiro no Segmented.
const FAMILIES = [
  { key: 'all', pt: 'Todas', en: 'All' },
  { key: 'red', pt: 'Vermelhos', en: 'Reds' },
  { key: 'orange', pt: 'Laranjas', en: 'Oranges' },
  { key: 'yellow', pt: 'Amarelos', en: 'Yellows' },
  { key: 'green', pt: 'Verdes', en: 'Greens' },
  { key: 'cyan', pt: 'Ciano & Teal', en: 'Cyans & Teals' },
  { key: 'blue', pt: 'Azuis', en: 'Blues' },
  { key: 'purple', pt: 'Roxos', en: 'Purples' },
  { key: 'pink', pt: 'Rosa & Magenta', en: 'Pinks & Magentas' },
  { key: 'gray', pt: 'Cinzas & Neutros', en: 'Grays & Neutrals' },
]

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return { r, g, b }
}

// Converte RGB (0-255) para HSL (h 0-360, s/l 0-100). Fórmula direta da especificação.
function rgbToHsl(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

// Luminância relativa (WCAG 2.x) — usada pra decidir texto preto ou branco sobre o swatch.
function relativeLuminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Classifica a cor em uma família pelo matiz/saturação/luminosidade.
function classify(h, s, l) {
  if (l >= 96 || s <= 8) return 'gray'
  if (h >= 348 || h < 16) return 'red'
  if (h < 42) return 'orange'
  if (h < 70) return 'yellow'
  if (h < 165) return 'green'
  if (h < 200) return 'cyan'
  if (h < 262) return 'blue'
  if (h < 295) return 'purple'
  return 'pink'
}

const translations = {
  pt: {
    title: 'Cores Nomeadas do CSS',
    subtitle: 'Todas as 148 cores com nome do CSS (CSS Color Module Level 4) com HEX, RGB e HSL. Clique em uma cor para copiar o HEX — tudo calculado localmente, no navegador.',
    searchPlaceholder: 'Filtrar pelo nome… (ex.: sea, dark, gold)',
    familyLabel: 'Família',
    copied: 'copiado!',
    copyFailed: 'Não foi possível copiar',
    emptyNoMatch: 'Nenhuma cor encontrada para esse filtro.',
    resultsSuffix: ' cores',
    hexLabel: 'HEX',
    tip: 'Dica: o texto sobre cada amostra é preto ou branco de acordo com o contraste real (WCAG) da cor.',
  },
  en: {
    title: 'CSS Named Colors',
    subtitle: 'All 148 named CSS colors (CSS Color Module Level 4) with HEX, RGB and HSL. Click a color to copy its HEX — everything computed locally, in the browser.',
    searchPlaceholder: 'Filter by name… (e.g. sea, dark, gold)',
    familyLabel: 'Family',
    copied: 'copied!',
    copyFailed: 'Could not copy',
    emptyNoMatch: 'No colors found for this filter.',
    resultsSuffix: ' colors',
    hexLabel: 'HEX',
    tip: 'Tip: the text over each swatch is black or white based on the real (WCAG) contrast of the color.',
  },
}

export default function CssColorNamesPage() {
  const [messageApi, messageContextHolder] = message.useMessage()
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('all')

  // Dados enriquecidos (rgb, hsl, família, cor do texto) — computados uma vez.
  const colors = useMemo(() => {
    return NAMED_COLORS.map(([name, hex]) => {
      const rgb = hexToRgb(hex)
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      const lum = relativeLuminance(rgb)
      return {
        name,
        hex,
        rgb,
        hsl,
        family: classify(hsl.h, hsl.s, hsl.l),
        textColor: lum > 0.45 ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.92)',
      }
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return colors.filter((c) => {
      if (family !== 'all' && c.family !== family) return false
      if (q && !c.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [colors, query, family])

  const handleCopy = useCallback(async (hex) => {
    try {
      await navigator.clipboard.writeText(hex)
      messageApi.success(`${hex.toUpperCase()} ${t.copied}`)
    } catch {
      messageApi.error(t.copyFailed)
    }
  }, [messageApi, t])

  const familyName = useCallback((key) => {
    const f = FAMILIES.find((x) => x.key === key)
    return f ? f[lang] : key
  }, [lang])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 40px' }}>
      {messageContextHolder}
      <Title level={2} style={{ marginTop: 16, marginBottom: 4 }}>
        <BgColorsOutlined style={{ marginRight: 8 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: 8, maxWidth: 760 }}>
        {t.subtitle}
      </Paragraph>

      <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 8 }}>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 320 }}
          />
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.familyLabel}</Text>
            <Segmented
              value={family}
              onChange={(v) => setFamily(v)}
              options={FAMILIES.map((f) => ({ label: f[lang], value: f.key }))}
            />
          </Space>
        </Space>

        <Space size={8}>
          <Tag color="blue">{filtered.length} / {NAMED_COLORS.length}{t.resultsSuffix}</Tag>
          {family !== 'all' && (
            <Tag color="processing">{familyName(family)}</Tag>
          )}
        </Space>

        <Alert type="info" showIcon message={t.tip} style={{ maxWidth: 760 }} />
      </Space>

      {filtered.length === 0 ? (
        <Empty description={t.emptyNoMatch} style={{ marginTop: 48 }} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 12,
            marginTop: 20,
          }}
        >
          {filtered.map((c) => (
            <Tooltip key={c.name} title={`${c.name} · ${c.hex.toUpperCase()}`} mouseEnterDelay={0.4}>
              <div
                onClick={() => handleCopy(c.hex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCopy(c.hex)
                  }
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid rgba(128, 128, 128, 0.25)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  outline: 'none',
                }}
                className="css-color-card"
              >
                <div
                  style={{
                    height: 76,
                    background: c.hex,
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '8px 10px',
                  }}
                >
                  <Text
                    strong
                    style={{
                      color: c.textColor,
                      fontSize: 13,
                      textShadow: c.textColor.includes('255') ? '0 1px 3px rgba(0,0,0,0.35)' : '0 1px 2px rgba(255,255,255,0.25)',
                    }}
                  >
                    {c.name}
                  </Text>
                </div>
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text strong style={{ fontSize: 13 }}>{c.hex.toUpperCase()}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    rgb({c.rgb.r}, {c.rgb.g}, {c.rgb.b})
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    hsl({c.hsl.h}, {c.hsl.s}%, {c.hsl.l}%)
                  </Text>
                  <span style={{ marginTop: 4, fontSize: 12 }}>
                    <CopyOutlined style={{ marginRight: 4 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.hexLabel}</Text>
                  </span>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}