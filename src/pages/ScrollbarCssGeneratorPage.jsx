import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Segmented, Col, Row, ColorPicker, Alert, Button, Collapse, message } from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildScrollbarCss, DEMO_CLASS } from '../utils/scrollbarCss'

const { Title, Paragraph, Text } = Typography

const DEMO_ITEMS = [
  { id: 1, text: 'primeiro item da lista' },
  { id: 2, text: 'segundo — a lista é só pro scrollbar ter o que rolar' },
  { id: 3, text: 'terceiro item' },
  { id: 4, text: 'quarto item' },
  { id: 5, text: 'quinto item' },
  { id: 6, text: 'sexto item' },
  { id: 7, text: 'sétimo item' },
  { id: 8, text: 'oitavo item' },
  { id: 9, text: 'nono item' },
  { id: 10, text: 'décimo item' },
  { id: 11, text: 'décimo primeiro — quase acabando' },
  { id: 12, text: 'décimo segundo — ultrapassou a altura do container' },
]

const translations = {
  pt: {
    title: 'Gerador de Scrollbar CSS',
    intro: (
      <>
        Monta a regra de scrollbar customizada para um container{' '}
        <Text code>overflow: auto/scroll</Text>: quebra de trilho/thumb do
        WebKit (<Text code>::-webkit-scrollbar*</Text>, usado no Chrome, Edge
        e Safari) e as propriedades padrão do Firefox ({' '}
        <Text code>scrollbar-width</Text>/<Text code>scrollbar-color</Text>).
        O preview aplica o CSS gerado a uma lista rolável e o bloco sai pronto
        pra copiar.
      </>
    ),
    tipTitle: 'Como o scrollbar funciona por engine',
    tipBody: (
      <>
        O WebKit estiliza com pseudo-elementos <Text code>::-webkit-scrollbar</Text>,{' '}
        <Text code>::-webkit-scrollbar-track</Text> (o rodapé/trilho),{' '}
        <Text code>::-webkit-scrollbar-thumb</Text> (a barra que arrasta) e{' '}
        <Text code>::-webkit-scrollbar-corner</Text> — e precisa, no mínimo,
        de uma <Text strong>largura/altura</Text> no <Text code>::-webkit-scrollbar</Text>{' '}
        pra aparecer. O Firefox não tem pseudo-elementos: usa as duas
        propriedades padrão <Text code>scrollbar-color: thumb track</Text>{' '}
        (e <Text code>scrollbar-width</Text>, <Text code>auto</Text>/<Text code>thin</Text>/<Text code>none</Text>),
        sem raio nem borda. As pegadinhas que mais aparecem: no macOS com
        overlay scrollbars o track/thumb customizado só aparece{' '}
        <Text strong>durante o scroll</Text> (o sistema esconde quando parado);
        e as pseudo-classes WebKit são <Text strong>não-padrão</Text> — a spec
        ainda não tem estilização de scrollbar, então cada engine segue seu
        jeito e o CSS precisa dos dois blocos juntos.
      </>
    ),
    settings: 'Configurações',
    preview: 'Pré-visualização ao vivo',
    width: 'Largura / altura',
    thumbRadius: 'Raio do thumb',
    trackRadius: 'Raio da trilha',
    thumbBorder: 'Borda do thumb',
    thumbColor: 'Cor do thumb',
    trackColor: 'Cor da trilha',
    cornerColor: 'Cor do canto',
    firefoxWidth: 'Firefox scrollbar-width',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS de scrollbar copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O coração é buildScrollbarCss(settings): monta o bloco na ordem canônica — ::-webkit-scrollbar (com width/height e a cor de fundo usada como fallback), track, thumb (com border-radius, e a borda de mesmo tom da trilha com background-clip: padding-box do truque do "thumb afundado"), corner — e fecha com o bloco Firefox (scrollbar-width + scrollbar-color). A classe de escopo vira a mesma do preview, então a pré-visualização usa o CSS exato que se copia.',
    reset: 'Restaurar padrão',
  },
  en: {
    title: 'CSS Scrollbar Generator',
    intro: (
      <>
        Builds the custom scrollbar rule for an{' '}
        <Text code>overflow: auto/scroll</Text> container: WebKit
        track/thumb styling (<Text code>::-webkit-scrollbar*</Text>, used in
        Chrome, Edge and Safari) plus the Firefox standard properties (
        <Text code>scrollbar-width</Text>/<Text code>scrollbar-color</Text>).
        The preview applies the generated CSS to a scrollable list and the
        block comes out ready to copy.
      </>
    ),
    tipTitle: 'How scrollbars work per engine',
    tipBody: (
      <>
        WebKit styles through pseudo-elements <Text code>::-webkit-scrollbar</Text>,{' '}
        <Text code>::-webkit-scrollbar-track</Text> (the gutter/track),{' '}
        <Text code>::-webkit-scrollbar-thumb</Text> (the draggable bar) and{' '}
        <Text code>::-webkit-scrollbar-corner</Text> — and it needs at least a{' '}
        <Text strong>width/height</Text> on <Text code>::-webkit-scrollbar</Text>{' '}
        to show up. Firefox has no pseudo-elements: it uses the two standard
        properties <Text code>scrollbar-color: thumb track</Text>{' '}
        (and <Text code>scrollbar-width</Text>, <Text code>auto</Text>/<Text code>thin</Text>/<Text code>none</Text>),
        with no radius or border. The common gotchas: on macOS with overlay
        scrollbars the custom track/thumb only shows{' '}
        <Text strong>while scrolling</Text> (the system hides it when idle);
        and the WebKit pseudo-classes are <Text strong>non-standard</Text> —
        the spec has no scrollbar styling yet, so each engine does its own
        thing and the CSS needs both blocks together.
      </>
    ),
    settings: 'Settings',
    preview: 'Live preview',
    width: 'Width / height',
    thumbRadius: 'Thumb radius',
    trackRadius: 'Track radius',
    thumbBorder: 'Thumb border',
    thumbColor: 'Thumb color',
    trackColor: 'Track color',
    cornerColor: 'Corner color',
    firefoxWidth: 'Firefox scrollbar-width',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'Scrollbar CSS copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The heart is buildScrollbarCss(settings): it assembles the block in canonical order — ::-webkit-scrollbar (with width/height and the background color as fallback), track, thumb (with border-radius, and the same-tone border as the track plus background-clip: padding-box, the "inset thumb" trick), corner — closing with the Firefox block (scrollbar-width + scrollbar-color). The scope class matches the preview, so the preview uses the exact CSS you copy.',
    reset: 'Reset',
  },
}

export default function ScrollbarCssGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [width, setWidth] = useState(12)
  const [thumbRadius, setThumbRadius] = useState(8)
  const [trackRadius, setTrackRadius] = useState(8)
  const [thumbBorder, setThumbBorder] = useState(0)
  const [thumbColor, setThumbColor] = useState('#1677ff')
  const [trackColor, setTrackColor] = useState('#e9edf3')
  const [cornerColor, setCornerColor] = useState('#e9edf3')
  const [firefoxWidth, setFirefoxWidth] = useState('thin')

  const settings = useMemo(
    () => ({
      width,
      thumbRadius,
      trackRadius,
      thumbBorder,
      thumbColor,
      trackColor,
      cornerColor,
      firefoxWidth,
    }),
    [width, thumbRadius, trackRadius, thumbBorder, thumbColor, trackColor, cornerColor, firefoxWidth]
  )

  const css = useMemo(() => buildScrollbarCss(settings), [settings])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const reset = () => {
    setWidth(12)
    setThumbRadius(8)
    setTrackRadius(8)
    setThumbBorder(0)
    setThumbColor('#1677ff')
    setTrackColor('#e9edf3')
    setCornerColor('#e9edf3')
    setFirefoxWidth('thin')
  }

  const swatch = (color) => ({
    backgroundColor: color,
    borderRadius: 4,
    width: 26,
    height: 26,
    display: 'inline-block',
    border: '1px solid #d9d9d9',
  })

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card
            title={t.settings}
            extra={<Button size="small" onClick={reset}>{t.reset}</Button>}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.width}</Text>
                <Text code>{width}px</Text>
              </Space>
              <Slider min={4} max={24} value={width} onChange={setWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.thumbRadius}</Text>
                <Text code>{thumbRadius}px</Text>
              </Space>
              <Slider min={0} max={24} value={thumbRadius} onChange={setThumbRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.trackRadius}</Text>
                <Text code>{trackRadius}px</Text>
              </Space>
              <Slider min={0} max={24} value={trackRadius} onChange={setTrackRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.thumbBorder}</Text>
                <Text code>{thumbBorder}px</Text>
              </Space>
              <Slider min={0} max={10} value={thumbBorder} onChange={setThumbBorder} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.thumbColor}</Text>
                <ColorPicker value={thumbColor} onChange={(c) => setThumbColor(c.toHexString())}>
                  <span style={swatch(thumbColor)} />
                </ColorPicker>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.trackColor}</Text>
                <ColorPicker value={trackColor} onChange={(c) => setTrackColor(c.toHexString())}>
                  <span style={swatch(trackColor)} />
                </ColorPicker>
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.cornerColor}</Text>
                <ColorPicker value={cornerColor} onChange={(c) => setCornerColor(c.toHexString())}>
                  <span style={swatch(cornerColor)} />
                </ColorPicker>
              </Space>

              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Text>{t.firefoxWidth}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={firefoxWidth}
                  onChange={setFirefoxWidth}
                  options={['auto', 'thin', 'none']}
                />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{css}</style>
            <div
              className={DEMO_CLASS}
              style={{
                maxHeight: 280,
                overflow: 'auto',
                borderRadius: 8,
                border: '1px solid #f0f0f0',
                background: trackColor,
              }}
            >
              <div style={{ padding: '8px 16px' }}>
                {DEMO_ITEMS.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 8,
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    {it.text}
                  </div>
                ))}
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {lang === 'pt'
                ? 'Role dentro da caixa acima pra ver o scrollbar com o CSS gerado aplicado.'
                : 'Scroll inside the box above to see the scrollbar with the generated CSS applied.'}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{css}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildScrollbarCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildScrollbarCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}