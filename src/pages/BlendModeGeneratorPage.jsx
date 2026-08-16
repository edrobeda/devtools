import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Select, Switch, Button, message,
  Collapse, Row, Col, Input, Alert, Segmented,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, UndoOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  BLEND_MODES,
  BLEND_MODE_TYPES,
  DEFAULTS,
  PRESETS,
  isValidHex,
  buildBackground,
  buildCss,
  buildHtmlExample,
} from '../utils/blendModeGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Blend Mode CSS',
    intro:
      'Experimente mix-blend-mode e background-blend-mode direto no navegador. Ajuste cores, texto e modo de blend para criar efeitos de sobreposição, duotone e texto knockout — tudo 100% client-side.',
    preview: 'Preview ao vivo',
    modeType: 'Tipo de blend',
    blendMode: 'Modo de blend',
    backColor: 'Cor de fundo',
    useGradient: 'Usar gradiente de fundo',
    gradientStart: 'Início do gradiente',
    gradientEnd: 'Fim do gradiente',
    gradientAngle: 'Ângulo do gradiente',
    frontColor: 'Cor da frente',
    frontOpacity: 'Opacidade da frente',
    previewText: 'Texto do preview',
    cssOutput: 'CSS gerado',
    htmlOutput: 'HTML de exemplo',
    copyCss: 'Copiar CSS',
    copyHtml: 'Copiar HTML',
    copiedCss: 'CSS copiado!',
    copiedHtml: 'HTML copiado!',
    reset: 'Restaurar padrões',
    presets: 'Presets rápidos',
    invalidHex: 'Hex inválido',
    supportTitle: 'Suporte nos navegadores',
    supportBody:
      'mix-blend-mode e background-blend-mode são suportados em todos os navegadores modernos. Os modos plus-darker e plus-lighter são mais recentes e podem não estar disponíveis em versões antigas.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'A lógica apenas monta as declarações CSS a partir do estado. O navegador faz a composição real das cores; não há cálculo de cores no JavaScript.',
    presetMultiply: 'Multiply sobre foto',
    presetScreen: 'Screen neon',
    presetOverlay: 'Overlay contraste',
    presetDifference: 'Difference knockout',
    presetBackgroundGradient: 'Background blend',
    mixMode: 'mix-blend-mode',
    bgMode: 'background-blend-mode',
    tipTitle: 'Diferença entre os dois tipos',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>mix-blend-mode</Text> define como o elemento em si se
          mistura com tudo o que está <em>atrás</em> dele (pai, imagens, outros
          elementos).
        </li>
        <li>
          <Text strong>background-blend-mode</Text> mistura as{' '}
          <em>camadas de background</em> do próprio elemento entre si.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'CSS Blend Mode Generator',
    intro:
      'Play with mix-blend-mode and background-blend-mode right in the browser. Adjust colors, text and blend mode to create overlays, duotones and knockout text — all 100% client-side.',
    preview: 'Live preview',
    modeType: 'Blend type',
    blendMode: 'Blend mode',
    backColor: 'Background color',
    useGradient: 'Use gradient background',
    gradientStart: 'Gradient start',
    gradientEnd: 'Gradient end',
    gradientAngle: 'Gradient angle',
    frontColor: 'Foreground color',
    frontOpacity: 'Foreground opacity',
    previewText: 'Preview text',
    cssOutput: 'Generated CSS',
    htmlOutput: 'HTML example',
    copyCss: 'Copy CSS',
    copyHtml: 'Copy HTML',
    copiedCss: 'CSS copied!',
    copiedHtml: 'HTML copied!',
    reset: 'Reset defaults',
    presets: 'Quick presets',
    invalidHex: 'Invalid hex',
    supportTitle: 'Browser support',
    supportBody:
      'mix-blend-mode and background-blend-mode are supported in all modern browsers. The plus-darker and plus-lighter modes are newer and may not be available in older versions.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The logic only assembles CSS declarations from the current state. The browser performs the actual color compositing; no color math runs in JavaScript.',
    presetMultiply: 'Multiply on photo',
    presetScreen: 'Neon screen',
    presetOverlay: 'Overlay contrast',
    presetDifference: 'Difference knockout',
    presetBackgroundGradient: 'Background blend',
    mixMode: 'mix-blend-mode',
    bgMode: 'background-blend-mode',
    tipTitle: 'Difference between the two types',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>mix-blend-mode</Text> defines how the element itself blends
          with everything <em>behind</em> it (parent, images, other elements).
        </li>
        <li>
          <Text strong>background-blend-mode</Text> blends the element&apos;s own{' '}
          <em>background layers</em> with each other.
        </li>
      </ul>
    ),
  },
}

export default function BlendModeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [state, setState] = useState(DEFAULTS)

  const setField = (key, value) => setState((prev) => ({ ...prev, [key]: value }))

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setState((prev) => ({ ...prev, ...preset.state }))
  }

  const reset = () => setState(DEFAULTS)

  const validBack = isValidHex(state.backColor)
  const validFront = isValidHex(state.frontColor)
  const validGradStart = isValidHex(state.gradientBackStart)
  const validGradEnd = isValidHex(state.gradientBackEnd)
  const validAll = validBack && validFront && validGradStart && validGradEnd

  const backgroundValue = useMemo(() => buildBackground(state), [state])
  const cssOutput = useMemo(() => buildCss(state), [state])
  const htmlOutput = useMemo(() => buildHtmlExample(state), [state])

  const copyCss = () => {
    navigator.clipboard.writeText(cssOutput)
    message.success(t.copiedCss)
  }

  const copyHtml = () => {
    navigator.clipboard.writeText(htmlOutput)
    message.success(t.copiedHtml)
  }

  const renderPreview = () => {
    if (state.type === 'background-blend-mode') {
      return (
        <div
          style={{
            width: '100%',
            height: 220,
            borderRadius: 12,
            backgroundBlendMode: state.mode,
            background: `${backgroundValue}, ${state.frontColor}`,
            border: '1px solid #d9d9d9',
          }}
        />
      )
    }

    return (
      <div
        style={{
          width: '100%',
          height: 220,
          borderRadius: 12,
          background: backgroundValue,
          border: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            mixBlendMode: state.mode,
            color: state.frontColor,
            opacity: state.frontOpacity / 100,
            fontSize: 'clamp(2rem, 8vw, 5rem)',
            fontWeight: 800,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {state.text}
        </span>
      </div>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.preview}>
            {!validAll ? (
              <div
                style={{
                  width: '100%',
                  height: 220,
                  borderRadius: 12,
                  border: '1px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="danger">{t.invalidHex}</Text>
              </div>
            ) : (
              renderPreview()
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.cssOutput} extra={<Button size="small" icon={<CopyOutlined />} onClick={copyCss}>{t.copyCss}</Button>}>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{validAll ? cssOutput : `/* ${t.invalidHex} */`}</code>
            </pre>
          </Card>

          <Card
            title={t.htmlOutput}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={copyHtml}>{t.copyHtml}</Button>}
            style={{ marginTop: 16 }}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{validAll ? htmlOutput : `<!-- ${t.invalidHex} -->`}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.presets}
        extra={<Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>}
      >
        <Space wrap>
          {PRESETS.map((p) => (
            <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>
              {t[p.labelKey]}
            </Button>
          ))}
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Text strong>{t.modeType}</Text>
            <Segmented
              value={state.type}
              onChange={(v) => setField('type', v)}
              options={[
                { value: 'mix-blend-mode', label: t.mixMode },
                { value: 'background-blend-mode', label: t.bgMode },
              ]}
            />
          </Space>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.blendMode}</Text>
                <Select
                  value={state.mode}
                  onChange={(v) => setField('mode', v)}
                  options={BLEND_MODES.map((m) => ({ value: m, label: m }))}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.previewText}</Text>
                <Input
                  value={state.text}
                  onChange={(e) => setField('text', e.target.value)}
                  disabled={state.type === 'background-blend-mode'}
                  maxLength={20}
                />
              </Space>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.backColor}</Text>
                <Space>
                  <input
                    type="color"
                    value={validBack ? state.backColor : '#000000'}
                    onChange={(e) => setField('backColor', e.target.value)}
                    style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <Input
                    value={state.backColor}
                    onChange={(e) => setField('backColor', e.target.value)}
                    status={validBack ? '' : 'error'}
                    style={{ width: 120 }}
                    maxLength={7}
                  />
                </Space>
                {!validBack && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidHex}</Text>}
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.frontColor}</Text>
                <Space>
                  <input
                    type="color"
                    value={validFront ? state.frontColor : '#000000'}
                    onChange={(e) => setField('frontColor', e.target.value)}
                    style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <Input
                    value={state.frontColor}
                    onChange={(e) => setField('frontColor', e.target.value)}
                    status={validFront ? '' : 'error'}
                    style={{ width: 120 }}
                    maxLength={7}
                  />
                </Space>
                {!validFront && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidHex}</Text>}
              </Space>
            </Col>
          </Row>

          <Space align="center">
            <Switch checked={state.useGradientBack} onChange={(v) => setField('useGradientBack', v)} />
            <Text>{t.useGradient}</Text>
          </Space>

          {state.useGradientBack && (
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.gradientStart}</Text>
                  <Space>
                    <input
                      type="color"
                      value={validGradStart ? state.gradientBackStart : '#000000'}
                      onChange={(e) => setField('gradientBackStart', e.target.value)}
                      style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                    />
                    <Input
                      value={state.gradientBackStart}
                      onChange={(e) => setField('gradientBackStart', e.target.value)}
                      status={validGradStart ? '' : 'error'}
                      style={{ width: 120 }}
                      maxLength={7}
                    />
                  </Space>
                  {!validGradStart && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidHex}</Text>}
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.gradientEnd}</Text>
                  <Space>
                    <input
                      type="color"
                      value={validGradEnd ? state.gradientBackEnd : '#000000'}
                      onChange={(e) => setField('gradientBackEnd', e.target.value)}
                      style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                    />
                    <Input
                      value={state.gradientBackEnd}
                      onChange={(e) => setField('gradientBackEnd', e.target.value)}
                      status={validGradEnd ? '' : 'error'}
                      style={{ width: 120 }}
                      maxLength={7}
                    />
                  </Space>
                  {!validGradEnd && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidHex}</Text>}
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{t.gradientAngle}</Text>
                    <Text code>{state.gradientAngle}°</Text>
                  </Space>
                  <Slider
                    min={0}
                    max={360}
                    value={state.gradientAngle}
                    onChange={(v) => setField('gradientAngle', v)}
                  />
                </Space>
              </Col>
            </Row>
          )}

          {state.type === 'mix-blend-mode' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text strong>{t.frontOpacity}</Text>
                <Text code>{state.frontOpacity}%</Text>
              </Space>
              <Slider
                min={0}
                max={100}
                value={state.frontOpacity}
                onChange={(v) => setField('frontOpacity', v)}
              />
            </Space>
          )}
        </Space>
      </Card>

      <Alert type="warning" showIcon message={t.supportTitle} description={t.supportBody} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 360 }}>
                  <code>{`// src/utils/blendModeGenerator.js

export const BLEND_MODES = ${JSON.stringify(BLEND_MODES, null, 2)};

export const DEFAULTS = ${JSON.stringify(DEFAULTS, null, 2)};

export function isValidHex(value) {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(value);
}

export function buildBackground(state) {
  if (state.useGradientBack) {
    return \`linear-gradient(\${state.gradientAngle}deg, \${state.gradientBackStart}, \${state.gradientBackEnd})\`;
  }
  return state.backColor;
}

export function buildCss(state) {
  const { type, mode } = state;
  if (type === 'background-blend-mode') {
    return \`background-blend-mode: \${mode};\\nbackground: \${buildBackground(state)}, \${state.frontColor};\`;
  }
  return \`mix-blend-mode: \${mode};\\nbackground: \${state.frontColor};\\nopacity: \${state.frontOpacity / 100};\`;
}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
