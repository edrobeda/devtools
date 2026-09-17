import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Switch, Segmented, Alert, Collapse, Row, Col, Button, message } from 'antd'
import { BgColorsOutlined, CopyOutlined, UndoOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildMaskImage, buildMaskCss } from '../utils/cssMaskGenerator'

const { Title, Paragraph, Text } = Typography

const DEFAULTS = {
  type: 'linear',
  direction: 'to right',
  shape: 'spotlight',
  width: 50,
  repeat: false,
  tileSize: 25,
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="300" viewBox="0 0 640 300">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3ea6ff"/>
      <stop offset="1" stop-color="#7fe0c8"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2f7fb8"/>
      <stop offset="1" stop-color="#1a4d73"/>
    </linearGradient>
  </defs>
  <rect width="640" height="300" fill="url(#sky)"/>
  <circle cx="480" cy="70" r="38" fill="#ffd166"/>
  <circle cx="110" cy="52" r="8" fill="#ffffff" opacity="0.85"/>
  <circle cx="150" cy="120" r="4" fill="#ffffff" opacity="0.5"/>
  <circle cx="560" cy="150" r="5" fill="#ffffff" opacity="0.4"/>
  <path d="M0 300 V175 C 120 130 240 200 360 175 C 470 152 560 120 640 150 V300 Z" fill="#3c8f4f"/>
  <path d="M0 300 V215 C 140 180 300 245 470 220 C 545 206 600 190 640 200 V300 Z" fill="#2b6e3a"/>
  <rect y="185" width="640" height="115" fill="url(#sea)"/>
  <path d="M260 210 h70 l-35 30 Z" fill="#ffffff" opacity="0.9"/>
  <path d="M290 212 L325 212" stroke="#c9a24b" stroke-width="5" stroke-linecap="round"/>
  <path d="M0 300 V262 C 140 240 300 280 470 262 C 545 252 600 268 640 258 V300 Z" fill="#123c5c" opacity="0.55"/>
</svg>`

const SAMPLE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG)}`

const LINEAR_DIRECTIONS = [
  { key: 'to right', label: '\u2192' },
  { key: 'to left', label: '\u2190' },
  { key: 'to top', label: '\u2191' },
  { key: 'to bottom', label: '\u2193' },
  { key: 'to top right', label: '\u2197' },
  { key: 'to top left', label: '\u2196' },
  { key: 'to bottom right', label: '\u2198' },
  { key: 'to bottom left', label: '\u2199' },
  { key: 'both-horizontal', label: '\u2194' },
  { key: 'both-vertical', label: '\u2195' },
]

const RADIAL_SHAPES = ['spotlight', 'vignette', 'ring']

const translations = {
  pt: {
    title: 'Gerador de CSS Mask',
    intro:
      'Monta a regra mask-image — em versão WebKit e padrão — pronta pra colar. Escolha fade linear ou radial, ajuste a largura da transição e veja ao vivo num SVG gerado na própria página. Nada sai do navegador.',
    tipTitle: 'O que máscaras fazem (e cuidados)',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Máscara ≠ clip-path</Text>: <Text code>clip-path</Text> corta a
          caixa geométrica do elemento; <Text code>mask-image</Text> usa o canal
          <em> alpha</em> (ou luminância) de uma imagem/gradiente para esconder
          partes com desfoque suave — o elemento continua inteiro no layout.
        </li>
        <li>
          <Text strong>Preto mostra, transparente esconde</Text>: trechos pretos do
          gradiente deixam o conteúdo visível; trechos transparentes o apagam; cinza
          = visível com opacidade parcial.
        </li>
        <li>
          <Text strong>Prefixo WebKit</Text>: em imagens/divs, Chrome, Edge e Safari
          exigem <Text code>-webkit-mask-image</Text> até hoje — por isso a página
          emite as duas versões.
        </li>
        <li>
          <Text strong>Escopo</Text>: a máscara vale pro elemento inteiro (border box
          por padrão) e não afeta o que está por trás — diferente de{' '}
          <Text code>backdrop-filter</Text>.
        </li>
        <li>
          <Text strong>Principais usos</Text>: fade de imagem pra virar um layout,
          encobrir bordas de banner, revelar texto por spotlight, "vignette" em
          fotos e listras de gradiente repetidas (até o modo repetir desta página).
        </li>
      </ul>
    ),
    preview: 'Pré-visualização ao vivo',
    demo: 'Conteúdo de exemplo',
    demoPhoto: 'Foto (SVG)',
    demoText: 'Texto',
    demoBody: 'Mask aplicada neste card — o gradiente decide o que aparece.',
    type: 'Tipo de máscara',
    linear: 'Linear',
    radial: 'Radial',
    direction: 'Direção do fade',
    shape: 'Formato radial',
    spotlight: 'Spotlight',
    vignette: 'Vignette',
    ring: 'Anel',
    width: 'Largura do efeito',
    widthHint: 'quanto menor, menor a faixa de transição (fim mais repentino)',
    repeat: 'Repetir (tiles)',
    tileSize: 'Tamanho do tile',
    output: 'CSS gerado',
    className: 'Classe',
    copy: 'Copiar',
    copied: 'CSS de mask copiado!',
    reset: 'Restaurar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O motor em src/utils/cssMaskGenerator.js resolve os stops do gradiente a partir da largura do efeito e emite o bloco — ordem WebKit + padrão.',
  },
  en: {
    title: 'CSS Mask Generator',
    intro: 'Build a mask-image rule — both WebKit and standard — ready to paste. Pick a linear or radial fade, tune the transition width and watch it live on an SVG generated right in the page. Nothing leaves the browser.',
    tipTitle: 'What masks do (and gotchas)',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Mask ≠ clip-path</Text>: <Text code>clip-path</Text> cuts the
          element&apos;s box; <Text code>mask-image</Text> uses the image&apos;s
          <em> alpha</em> (or luminance) channel to reveal/hide parts with a smooth
          gradient — the element keeps its full layout box.
        </li>
        <li>
          <Text strong>Black shows, transparent hides</Text>: black areas of the
          gradient keep the content visible; transparent ones erase it; gray = visible
          with partial opacity.
        </li>
        <li>
          <Text strong>WebKit prefix</Text>: for images/divs, Chrome, Edge and Safari
          still need <Text code>-webkit-mask-image</Text> — so the page outputs both
          versions.
        </li>
        <li>
          <Text strong>Scope</Text>: the mask applies to the whole element (border box
          by default) and does not affect what lies behind — unlike{' '}
          <Text code>backdrop-filter</Text>.
        </li>
        <li>
          <Text strong>Common uses</Text>: fading an image into the layout, softening
          banner edges, revealing text with a spotlight, photo vignettes and repeated
          gradient stripes (try the repeat mode on this page).
        </li>
      </ul>
    ),
    preview: 'Live preview',
    demo: 'Sample content',
    demoPhoto: 'Photo (SVG)',
    demoText: 'Text',
    demoBody: 'Mask applied to this card — the gradient decides what shows through.',
    type: 'Mask type',
    linear: 'Linear',
    radial: 'Radial',
    direction: 'Fade direction',
    shape: 'Radial shape',
    spotlight: 'Spotlight',
    vignette: 'Vignette',
    ring: 'Ring',
    width: 'Effect width',
    widthHint: 'the smaller, the narrower the transition band (sharper ending)',
    repeat: 'Repeat (tiles)',
    tileSize: 'Tile size',
    output: 'Generated CSS',
    className: 'Class',
    copy: 'Copy',
    copied: 'Mask CSS copied!',
    reset: 'Reset',
    sourceCol: 'Source code',
    sourceBody: 'The engine in src/utils/cssMaskGenerator.js resolves the gradient stops from the effect width and emits the block — WebKit + standard order.',
  },
}

export default function CssMaskGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [s, setS] = useState(DEFAULTS)
  const [demo, setDemo] = useState('photo')

  const apply = (patch) => setS((prev) => ({ ...prev, ...patch }))

  const reset = () => setS(DEFAULTS)

  const maskImage = useMemo(() => buildMaskImage(s), [s])
  const maskCss = useMemo(() => buildMaskCss(s), [s])

  const maskStyle = useMemo(
    () => ({
      WebkitMaskImage: maskImage,
      maskImage,
      WebkitMaskSize: s.repeat ? `${s.tileSize}%` : '100%',
      maskSize: s.repeat ? `${s.tileSize}%` : '100%',
      WebkitMaskRepeat: s.repeat ? 'repeat' : 'no-repeat',
      maskRepeat: s.repeat ? 'repeat' : 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
    }),
    [maskImage, s.repeat, s.tileSize]
  )

  const copy = () => {
    navigator.clipboard.writeText(maskCss)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.preview}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Text strong>{t.demo}:</Text>
            <Segmented
              value={demo}
              onChange={setDemo}
              options={[
                { label: t.demoPhoto, value: 'photo' },
                { label: t.demoText, value: 'text' },
              ]}
            />
          </Space>
          <div
            style={{
              padding: 8,
              borderRadius: 10,
              background: 'repeating-conic-gradient(#e7eaf0 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px',
              overflow: 'hidden',
            }}
          >
            {demo === 'photo' ? (
              <img
                src={SAMPLE_URI}
                alt="Sample"
                style={{ display: 'block', width: '100%', ...maskStyle }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '48px 40px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #5b8cff, #b45de0 60%, #ff8bcb)',
                  ...maskStyle,
                }}
              >
                <Text strong style={{ color: '#fff', fontSize: 34, display: 'block' }}>
                  DevTools
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15 }}>
                  {t.demoBody}
                </Text>
              </div>
            )}
          </div>
        </Space>
      </Card>

      <Card title={t.type}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Segmented
            value={s.type}
            onChange={(v) => apply({ type: v })}
            options={[
              { label: t.linear, value: 'linear' },
              { label: t.radial, value: 'radial' },
            ]}
          />

          {s.type === 'linear' ? (
            <>
              <Space direction="vertical" style={{ width: '100%' }} size={6}>
                <Text strong>{t.direction}</Text>
                <Space wrap>
                  {LINEAR_DIRECTIONS.map((d) => (
                    <Button
                      key={d.key}
                      size="small"
                      type={s.direction === d.key ? 'primary' : 'default'}
                      onClick={() => apply({ direction: d.key })}
                      title={d.key}
                    >
                      {d.label}
                    </Button>
                  ))}
                </Space>
              </Space>
            </>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              <Text strong>{t.shape}</Text>
              <Segmented
                value={s.shape}
                onChange={(v) => apply({ shape: v })}
                options={RADIAL_SHAPES.map((shape) => ({
                  label: t[shape],
                  value: shape,
                }))}
              />
            </Space>
          )}

          <Space direction="vertical" style={{ width: '100%' }} size={0}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>{t.width}</Text>
              <Text code>{s.width}%</Text>
            </Space>
            <Slider min={5} max={100} value={s.width} onChange={(v) => apply({ width: v })} />
            <Text type="secondary" style={{ fontSize: 12 }}>{t.widthHint}</Text>
          </Space>

          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space align="center">
              <Switch checked={s.repeat} onChange={(v) => apply({ repeat: v })} />
              <Text>{t.repeat}</Text>
            </Space>
            {s.repeat && (
              <Space direction="vertical" style={{ width: '100%' }} size={0}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.tileSize}</Text>
                  <Text code>{s.tileSize}%</Text>
                </Space>
                <Slider min={10} max={90} value={s.tileSize} onChange={(v) => apply({ tileSize: v })} />
              </Space>
            )}
          </Space>
        </Space>
      </Card>

      <Card
        title={t.output}
        extra={
          <Space>
            <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={6}>
          <Text type="secondary">{t.className}: <Text code>.mask-fade</Text></Text>
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{maskCss}</code>
          </pre>
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — src/utils/cssMaskGenerator.js`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildMaskCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}