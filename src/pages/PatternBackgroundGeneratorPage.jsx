import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse, message, ColorPicker, Row, Col, Select } from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildPatternCss, PATTERN_KEYS } from '../utils/cssPatternBackground'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PATTERN_LABELS = {
  pt: {
    'stripes-horizontal': 'Listras horizontais',
    'stripes-vertical': 'Listras verticais',
    'stripes-diagonal': 'Listras diagonais',
    crosshatch: 'Xadrez / trama',
    dots: 'Pontos finos',
    'polka-dots': 'Bolões (polka)',
    checkerboard: 'Tabuleiro',
    grid: 'Grid',
    'graph-paper': 'Papel milimetrado',
    diamonds: 'Diamantes',
    chevron: 'Chevron',
  },
  en: {
    'stripes-horizontal': 'Horizontal stripes',
    'stripes-vertical': 'Vertical stripes',
    'stripes-diagonal': 'Diagonal stripes',
    crosshatch: 'Crosshatch',
    dots: 'Fine dots',
    'polka-dots': 'Polka dots',
    checkerboard: 'Checkerboard',
    grid: 'Grid',
    'graph-paper': 'Graph paper',
    diamonds: 'Diamonds',
    chevron: 'Chevron',
  },
}

const PRESETS = [
  { key: 'blue-stripes', pattern: 'stripes-horizontal', color1: '#e6f4ff', color2: '#1677ff', size: 40, angle: 45, opacity: 1 },
  { key: 'dark-grid', pattern: 'grid', color1: '#141414', color2: '#434343', size: 32, angle: 45, opacity: 1 },
  { key: 'polka', pattern: 'polka-dots', color1: '#fff0f6', color2: '#eb2f96', size: 48, angle: 45, opacity: 1 },
  { key: 'checker', pattern: 'checkerboard', color1: '#f6ffed', color2: '#52c41a', size: 56, angle: 45, opacity: 1 },
  { key: 'crosshatch', pattern: 'crosshatch', color1: '#ffffff', color2: '#595959', size: 24, angle: 45, opacity: 1 },
  { key: 'graph', pattern: 'graph-paper', color1: '#ffffff', color2: '#d9d9d9', size: 40, angle: 45, opacity: 1 },
]

const PRESET_LABELS = {
  pt: {
    'blue-stripes': 'Listras azuis',
    'dark-grid': 'Grid escuro',
    polka: 'Bolões rosas',
    checker: 'Tabuleiro verde',
    crosshatch: 'Trama cinza',
    graph: 'Papel milimetrado',
  },
  en: {
    'blue-stripes': 'Blue stripes',
    'dark-grid': 'Dark grid',
    polka: 'Pink polka dots',
    checker: 'Green checkerboard',
    crosshatch: 'Gray crosshatch',
    graph: 'Graph paper',
  },
}

const translations = {
  pt: {
    title: 'Gerador de Padrões de Fundo CSS',
    intro: (
      <>
        Crie texturas de fundo repetíveis usando apenas gradientes CSS — sem
        imagens, sem requisições e sem SVG. Escolha o padrão, ajuste as cores,
        o tamanho da repetição e o ângulo, copie a classe pronta e use como
        <Text code>background</Text> de qualquer elemento.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Cada padrão é montado com <Text code>linear-gradient</Text>,{' '}
        <Text code>radial-gradient</Text> ou <Text code>conic-gradient</Text>{' '}
        repetidos via <Text code>background-size</Text>. Isso gera arquivos
        infinitamente escaláveis e muito leves. Atenção: gradientes complexos
        podem custar mais GPU do que uma imagem pequena; em elementos muito
        grandes ou com animação, prefira testar a fluidez.{' '}
        <Text code>background-color</Text> sempre aparece como cor base —
        certifique-se de que ela casa com a primeira cor do padrão pra evitar
        bordas estranhas.
      </>
    ),
    settings: 'Configurações',
    preset: 'Preset (estilo)',
    pattern: 'Padrão',
    color1: 'Cor base',
    color2: 'Cor do detalhe',
    size: 'Tamanho da repetição',
    angle: 'Ângulo',
    opacity: 'Opacidade das cores',
    preview: 'Pré-visualização',
    previewHint: 'O bloco abaixo usa exatamente o CSS gerado.',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssPatternBackground.js. Cada padrão é uma função pura que recebe as cores parseadas (com opacidade aplicada quando necessário), o tamanho e o ângulo, e devolve backgroundColor/backgroundImage/backgroundSize/backgroundPosition. buildPatternCss junta essas peças numa classe pronta para colar.',
  },
  en: {
    title: 'CSS Pattern Background Generator',
    intro: (
      <>
        Build repeatable background textures using only CSS gradients — no
        images, no requests, no SVG. Pick a pattern, tweak colors, repeat size
        and angle, copy the ready-to-use class and apply it as the{' '}
        <Text code>background</Text> of any element.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        Every pattern is built with <Text code>linear-gradient</Text>,{' '}
        <Text code>radial-gradient</Text> or <Text code>conic-gradient</Text>{' '}
        repeated through <Text code>background-size</Text>. That yields
        infinitely scalable, very lightweight backgrounds. Watch out: complex
        gradients may cost more GPU than a tiny image; for very large or
        animated elements, test smoothness. The <Text code>background-color</Text>{' '}
        is always emitted as the base color — make sure it matches the first
        pattern color to avoid odd seams.
      </>
    ),
    settings: 'Settings',
    preset: 'Preset (style)',
    pattern: 'Pattern',
    color1: 'Base color',
    color2: 'Detail color',
    size: 'Repeat size',
    angle: 'Angle',
    opacity: 'Color opacity',
    preview: 'Preview',
    previewHint: 'The block below uses exactly the generated CSS.',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssPatternBackground.js. Each pattern is a pure function that receives the parsed colors (with opacity applied when needed), the size and the angle, and returns backgroundColor/backgroundImage/backgroundSize/backgroundPosition. buildPatternCss assembles those pieces into a paste-ready class.',
  },
}

export default function PatternBackgroundGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [pattern, setPattern] = useState('stripes-horizontal')
  const [color1, setColor1] = useState('#e6f4ff')
  const [color2, setColor2] = useState('#1677ff')
  const [size, setSize] = useState(40)
  const [angle, setAngle] = useState(45)
  const [opacity, setOpacity] = useState(1)

  const settings = useMemo(
    () => ({ pattern, color1, color2, size, angle, opacity }),
    [pattern, color1, color2, size, angle, opacity]
  )

  const result = useMemo(() => buildPatternCss(settings, 'pattern-bg'), [settings])
  const p = result.pattern

  const applyPreset = (key) => {
    const preset = PRESETS.find((x) => x.key === key)
    if (!preset) return
    setPattern(preset.pattern)
    setColor1(preset.color1)
    setColor2(preset.color2)
    setSize(preset.size)
    setAngle(preset.angle)
    setOpacity(preset.opacity)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.classCss)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const patternOptions = PATTERN_KEYS.map((key) => ({
    value: key,
    label: PATTERN_LABELS[lang][key] || key,
  }))

  const previewStyle = {
    width: '100%',
    minHeight: 220,
    borderRadius: 8,
    border: '1px solid #f0f0f0',
    backgroundColor: p.backgroundColor,
    backgroundImage: p.backgroundImage,
    backgroundSize: p.backgroundSize,
    backgroundPosition: p.backgroundPosition,
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESETS.map((preset) => ({
                  value: preset.key,
                  label: PRESET_LABELS[lang][preset.key] || preset.key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.pattern}</Text>
                <Select
                  value={pattern}
                  onChange={setPattern}
                  options={patternOptions}
                  style={{ width: '100%' }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color1}</Text>
                <ColorPicker value={color1} onChange={setColor1} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.color2}</Text>
                <ColorPicker value={color2} onChange={setColor2} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.size}</Text>
                <Text code>{size}px</Text>
              </Space>
              <Slider min={8} max={160} value={size} onChange={setSize} />

              {pattern === 'stripes-diagonal' && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.angle}</Text>
                    <Text code>{angle}°</Text>
                  </Space>
                  <Slider min={0} max={360} value={angle} onChange={setAngle} />
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.opacity}</Text>
                <Text code>{Math.round(opacity * 100)}%</Text>
              </Space>
              <Slider min={10} max={100} value={Math.round(opacity * 100)} onChange={(v) => setOpacity(v / 100)} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div style={previewStyle} />
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{result.classCss}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildPatternCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildPatternCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
