import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse, message, Select, Tag, Row, Col } from 'antd'
import { FontSizeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildClamp, sizeAt, BASE_FONT_SIZE } from '../utils/fluidType'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PRESETS = [
  { key: 'hero', min: 34, max: 64, minVw: 375, maxVw: 1440 },
  { key: 'section', min: 24, max: 42, minVw: 375, maxVw: 1440 },
  { key: 'card', min: 18, max: 26, minVw: 375, maxVw: 1280 },
  { key: 'body', min: 14, max: 18, minVw: 375, maxVw: 1440 },
  { key: 'small', min: 12, max: 14, minVw: 375, maxVw: 1280 },
]

const PRESET_LABEL = {
  hero: { pt: 'Título hero (H1)', en: 'Hero title (H1)' },
  section: { pt: 'Título de seção', en: 'Section title' },
  card: { pt: 'Título de card', en: 'Card title' },
  body: { pt: 'Texto do corpo', en: 'Body text' },
  small: { pt: 'Texto pequeno / legenda', en: 'Small text / caption' },
}

const translations = {
  pt: {
    title: 'Gerador de Tipografia Fluida (clamp)',
    intro: (
      <>
        Monta o tamanho de fonte que escala com a tela em uma linha só —{' '}
        <Text code>font-size: clamp(min, Xvw + Ypx, max)</Text>. A reta entre os
        pontos <Text code>(minVw, min)</Text> e <Text code>(maxVw, max)</Text>{' '}
        vira o termo preferido, e o clamp congela o tamanho fora desse intervalo:
        mobile pequeno usa o mínimo, desktop largo usa o máximo, e entre eles o
        texto cresce proporcionalmente. Sem media queries, sem breakpoint.
      </>
    ),
    tipTitle: 'Como o clamp escala (e as pegadinhas)',
    tipBody: (
      <>
        O termo do meio <Text code>Xvw + Ypx</Text> é uma reta: entre{' '}
        <Text code>minVw</Text> e <Text code>maxVw</Text> a fonte cresce{' '}
        <Text strong>linearmente</Text> com a largura da tela — antes disso
        fica no mínimo, depois no máximo. Ponto de atenção: <Text code>vw</Text>{' '}
        olha o <Text strong>viewport inteiro</Text>, não o container — num layout
        com sidebar ou largura máxima (como este site), o texto cresce mais do
        que a coluna em que está. Se precisar que a escala siga o elemento
        container, o caminho são as unidades <Text code>cqw</Text> (container
        queries) ou um cálculo manual com <Text code>calc()</Text>. Também vale
        lembrar que <Text code>1rem = 16px</Text> (font-size da raiz): o output
        em <Text code>rem</Text> acompanha preferências de acessibilidade do
        usuário, o em <Text code>px</Text> não.
      </>
    ),
    settings: 'Configurações',
    preset: 'Preset (caso de uso)',
    minSize: 'Tamanho mínimo',
    maxSize: 'Tamanho máximo',
    minVw: 'Viewport mínimo (mobile)',
    maxVw: 'Viewport máximo (desktop)',
    unit: 'Unidade do output',
    preview: 'Pré-visualização',
    previewHint: 'Aumente ou diminua a janela do navegador pra ver a fonte acompanhar a largura da tela.',
    graphTitle: 'Curva tamanho × viewport',
    checkAt: 'Conferir tamanho em',
    computedAt: (w, s) => `Em ${w}px de largura, a fonte renderiza com ~${s}px`,
    output: 'CSS gerado',
    lineComment: '/* tipografia fluida */',
    copy: 'Copiar',
    copied: 'clamp() copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/fluidType.js. buildClamp normaliza as entradas (troca min/max se vierem invertidos e evita divisão por zero no intervalo de viewport), resolve a reta pelos dois pontos — slope = (max−min)/(maxVw−minVw) px por px de viewport, intercept = min − slope×minVw px no viewport 0 — e emite clamp(min, (slope×100)vw + intercept, max), convertendo pra rem dividindo por 16. sizeAt aplica o clamp a uma largura qualquer: congela no mínimo antes de minVw, no máximo depois de maxVw, e interpola linear entre os pontos — é o que alimenta o slider "conferir tamanho em" e a curva desenhada no SVG.',
    slope: 'crescimento',
    per100: 'por 100vw',
  },
  en: {
    title: 'Fluid Typography Generator (clamp)',
    intro: (
      <>
        Builds the screen-scaling font size in a single line —{' '}
        <Text code>font-size: clamp(min, Xvw + Ypx, max)</Text>. The line
        between <Text code>(minVw, min)</Text> and <Text code>(maxVw, max)</Text>{' '}
        becomes the preferred term, and clamp freezes the size outside that
        range: small phones get the minimum, wide desktops the maximum, and in
        between the text grows proportionally. No media queries, no breakpoints.
      </>
    ),
    tipTitle: 'How clamp scales (and the gotchas)',
    tipBody: (
      <>
        The middle term <Text code>Xvw + Ypx</Text> is a line: between{' '}
        <Text code>minVw</Text> and <Text code>maxVw</Text> the font grows{' '}
        <Text strong>linearly</Text> with the viewport width — below that it
        stays at the minimum, above at the maximum. Heads up: <Text code>vw</Text>{' '}
        looks at the <Text strong>whole viewport</Text>, not the container — in
        a layout with a sidebar or a max-width (like this very site), the text
        grows faster than the column holding it. If you need the scale to track
        an element container, the way is <Text code>cqw</Text> units (container
        queries) or a manual <Text code>calc()</Text>. Also note{' '}
        <Text code>1rem = 16px</Text> (root font-size): a <Text code>rem</Text>{' '}
        output follows the user accessibility preferences, a <Text code>px</Text>{' '}
        one does not.
      </>
    ),
    settings: 'Settings',
    preset: 'Preset (use case)',
    minSize: 'Min size',
    maxSize: 'Max size',
    minVw: 'Min viewport (mobile)',
    maxVw: 'Max viewport (desktop)',
    unit: 'Output unit',
    preview: 'Preview',
    previewHint: 'Resize the browser window to see the font follow the viewport width.',
    graphTitle: 'Size × viewport curve',
    checkAt: 'Check size at',
    computedAt: (w, s) => `At ${w}px wide, the font renders at ~${s}px`,
    output: 'Generated CSS',
    lineComment: '/* fluid typography */',
    copy: 'Copy',
    copied: 'clamp() copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/fluidType.js. buildClamp normalizes the inputs (swaps min/max if reversed and avoids division by zero on the viewport range), solves the line through both points — slope = (max−min)/(maxVw−minVw) px per viewport px, intercept = min − slope×minVw px at viewport 0 — and emits clamp(min, (slope×100)vw + intercept, max), converting to rem by dividing by 16. sizeAt applies the clamp at any width: freezes at the minimum before minVw, at the maximum after maxVw, and interpolates linearly in between — it feeds the "check size at" slider and the SVG curve.',
    slope: 'growth',
    per100: 'per 100vw',
  },
}

// Desenha a curva "tamanho × viewport" num SVG: reta entre os dois pontos de
// ancoragem, linhas de apoio tracejadas e um marcador móvel no width conferido.
function ClampGraph({ b, checkWidth }) {
  const W = 320
  const H = 150
  const ML = 46
  const MR = 8
  const MT = 10
  const MB = 20

  const spanVw = b.maxVw - b.minVw
  const xMin = b.minVw - spanVw * 0.12
  const xMax = b.maxVw + spanVw * 0.12
  const spanPx = b.max - b.min
  const yMin = spanPx === 0 ? b.min - 1 : b.min - spanPx * 0.25
  const yMax = spanPx === 0 ? b.max + 1 : b.max + spanPx * 0.25

  const xFor = (vw) => ML + ((vw - xMin) / (xMax - xMin)) * (W - ML - MR)
  const yFor = (px) => MT + (1 - (px - yMin) / (yMax - yMin)) * (H - MT - MB)

  const curve = [
    `${xFor(xMin).toFixed(1)},${yFor(b.min).toFixed(1)}`,
    `${xFor(b.minVw).toFixed(1)},${yFor(b.min).toFixed(1)}`,
    `${xFor(b.maxVw).toFixed(1)},${yFor(b.max).toFixed(1)}`,
    `${xFor(xMax).toFixed(1)},${yFor(b.max).toFixed(1)}`,
  ].join(' ')

  // O marcador de "conferir tamanho em" fica preso dentro do desenho mesmo
  // quando o valor escapa do intervalo exibido.
  const cw = Math.min(xMax, Math.max(xMin, checkWidth))
  const cSize = sizeAt(b, cw)
  const cwX = xFor(cw)
  const cwY = yFor(cSize)

  const fmt = (v) => Math.round(v * 10) / 10

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="clamp curve">
      {[b.min, b.max].map((v) => (
        <line key={`h-${v}`} x1={ML} x2={W - MR} y1={yFor(v)} y2={yFor(v)} stroke="#e6e6e6" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {[b.minVw, b.maxVw].map((v) => (
        <line key={`v-${v}`} x1={xFor(v)} x2={xFor(v)} y1={MT} y2={H - MB} stroke="#e6e6e6" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      <polyline points={curve} fill="none" stroke="#1677ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {[
        { x: xFor(b.minVw), y: yFor(b.min), label: `${fmt(b.min)}px` },
        { x: xFor(b.maxVw), y: yFor(b.max), label: `${fmt(b.max)}px` },
      ].map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#1677ff" strokeWidth="2" />
          <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fill="#595959">{p.label}</text>
        </g>
      ))}
      <text x={ML - 6} y={yFor(b.min) + 3} textAnchor="end" fontSize="9" fill="#bfbfbf">min</text>
      <text x={ML - 6} y={yFor(b.max) + 3} textAnchor="end" fontSize="9" fill="#bfbfbf">max</text>
      <text x={xFor(b.minVw)} y={H - 6} textAnchor="middle" fontSize="9" fill="#bfbfbf">{b.minVw}px</text>
      <text x={xFor(b.maxVw)} y={H - 6} textAnchor="middle" fontSize="9" fill="#bfbfbf">{b.maxVw}px</text>
      <line x1={cwX} x2={cwX} y1={MT} y2={H - MB} stroke="#fa8c16" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx={cwX} cy={cwY} r="4" fill="#fa8c16" />
      <text x={cwX} y={H - 6} textAnchor="middle" fontSize="9" fill="#fa8c16">check</text>
    </svg>
  )
}

export default function ClampGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [min, setMin] = useState(16)
  const [max, setMax] = useState(32)
  const [minVw, setMinVw] = useState(375)
  const [maxVw, setMaxVw] = useState(1440)
  const [unit, setUnit] = useState('px')
  const [checkWidth, setCheckWidth] = useState(375)

  const settings = useMemo(
    () => ({ min, max, minVw, maxVw, unit }),
    [min, max, minVw, maxVw, unit]
  )

  const b = useMemo(() => buildClamp(settings), [settings])
  const fullCss = useMemo(() => `${t.lineComment}\nfont-size: ${b.css};`, [t, b])

  const atCheck = sizeAt(settings, checkWidth)
  const atCheckRounded = Math.round(atCheck * 10) / 10

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (!p) return
    setMin(p.min)
    setMax(p.max)
    setMinVw(p.minVw)
    setMaxVw(p.maxVw)
    setCheckWidth(p.minVw)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullCss)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Select
                style={{ width: '100%' }}
                placeholder={t.preset}
                value={null}
                onChange={applyPreset}
                options={PRESETS.map((p) => ({
                  value: p.key,
                  label: `${PRESET_LABEL[p.key][lang]} — ${p.min}→${p.max}px`,
                }))}
              />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.minSize}</Text>
                <Text code>{min}px</Text>
              </Space>
              <Slider min={10} max={72} value={min} onChange={setMin} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.maxSize}</Text>
                <Text code>{max}px</Text>
              </Space>
              <Slider min={12} max={120} value={max} onChange={setMax} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.minVw}</Text>
                <Text code>{minVw}px</Text>
              </Space>
              <Slider min={320} max={800} value={minVw} onChange={setMinVw} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.maxVw}</Text>
                <Text code>{maxVw}px</Text>
              </Space>
              <Slider min={801} max={2560} value={maxVw} onChange={setMaxVw} />

              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Text>{t.unit}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={unit}
                  onChange={setUnit}
                  options={[
                    { label: 'px', value: 'px' },
                    { label: 'rem', value: 'rem' },
                  ]}
                />
              </Space>

              <Space wrap size={[8, 8]}>
                <Tag color="blue">{`${Math.round(b.vwCoeff * 100) / 100}vw`}</Tag>
                <Tag color="orange">{b.unit === 'rem' ? `${Math.round(b.intercept / BASE_FONT_SIZE * 100) / 100}rem` : `${Math.round(b.intercept * 100) / 100}px`}</Tag>
                <Tag color="green">{`+${Math.round(b.slope * 100) / 100}px ${t.slope}`}</Tag>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.preview}>
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: '28px 24px',
                  background: 'linear-gradient(135deg, #fafafa 0%, #f0f5ff 100%)',
                }}
              >
                <div style={{ fontSize: b.css, lineHeight: 1.1, fontWeight: 700, marginBottom: 12 }}>
                  Título fluido — Fluid title
                </div>
                <div style={{ fontSize: 'calc(clamp(0.72em, 0.4vw + 0.4em, 1em))', color: 'rgba(0,0,0,0.65)' }}>
                  Texto de apoio que acompanha o título, sem media queries.
                </div>
              </div>
              <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                {t.previewHint}
              </Paragraph>
            </Card>

            <Card title={t.graphTitle}>
              <ClampGraph b={b} checkWidth={checkWidth} />
              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.checkAt}</Text>
                  <Text code>{checkWidth}px</Text>
                </Space>
                <Slider min={320} max={2560} value={checkWidth} onChange={setCheckWidth} />
              </Space>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t.computedAt(checkWidth, atCheckRounded)}
              </Paragraph>
            </Card>
          </Space>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullCss}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildClamp / sizeAt`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildClamp.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}