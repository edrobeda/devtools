import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Select, Button, message, Collapse,
  Row, Col, Input, Alert, Divider,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, UndoOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  COLOR_SPACES,
  DEFAULTS,
  PRESETS,
  isValidHex,
  buildColorMix,
  buildFullCss,
  buildHtmlExample,
} from '../utils/colorMixGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de color-mix() CSS',
    intro:
      'Experimente a função CSS color-mix() misturando duas cores em diferentes espaços de cor. Tudo acontece no navegador — a cor resultante é aplicada via CSS e você copia a regra pronta.',
    preview: 'Preview ao vivo',
    cssOutput: 'CSS gerado',
    htmlOutput: 'HTML de exemplo',
    copyCss: 'Copiar CSS',
    copyHtml: 'Copiar HTML',
    copiedCss: 'CSS copiado!',
    copiedHtml: 'HTML copiado!',
    reset: 'Restaurar padrões',
    presets: 'Presets rápidos',
    color1: 'Cor 1',
    color2: 'Cor 2',
    percent1: 'Proporção da cor 1',
    space: 'Espaço de cor',
    invalidHex: 'Hex inválido',
    supportTitle: 'Suporte nos navegadores',
    supportBody:
      'A função color-mix() é suportada no Chrome 111+, Edge 111+, Firefox 113+ e Safari 16.2+. Em navegadores mais antigos a regra é ignorada — inclua um fallback sólido quando necessário.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'A única lógica necessária é montar a string da função CSS. O navegador faz a interpolação real; este arquivo só valida os hexadecimais e gera a declaração.',
    tint: 'Tom claro (tint)',
    shade: 'Tom escuro (shade)',
    warm: 'Quente',
    cool: 'Frio',
    pastel: 'Pastel',
    contrast: 'Contraste',
  },
  en: {
    title: 'CSS color-mix() Generator',
    intro:
      'Play with the CSS color-mix() function by blending two colors in different color spaces. Everything runs in the browser — the resulting color is applied via CSS and you copy the ready-to-use declaration.',
    preview: 'Live preview',
    cssOutput: 'Generated CSS',
    htmlOutput: 'HTML example',
    copyCss: 'Copy CSS',
    copyHtml: 'Copy HTML',
    copiedCss: 'CSS copied!',
    copiedHtml: 'HTML copied!',
    reset: 'Reset defaults',
    presets: 'Quick presets',
    color1: 'Color 1',
    color2: 'Color 2',
    percent1: 'Color 1 ratio',
    space: 'Color space',
    invalidHex: 'Invalid hex',
    supportTitle: 'Browser support',
    supportBody:
      'The color-mix() function is supported in Chrome 111+, Edge 111+, Firefox 113+ and Safari 16.2+. Older browsers will ignore the rule — include a solid fallback when needed.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The only logic needed is to assemble the CSS function string. The browser performs the actual interpolation; this file only validates the hex values and generates the declaration.',
    tint: 'Tint',
    shade: 'Shade',
    warm: 'Warm',
    cool: 'Cool',
    pastel: 'Pastel',
    contrast: 'Contrast',
  },
}

export default function ColorMixGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [state, setState] = useState(DEFAULTS)

  const setField = (key, value) => setState((prev) => ({ ...prev, [key]: value }))

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setState((prev) => ({
      ...prev,
      space: preset.space,
      color1: preset.color1,
      percent1: preset.percent1,
      color2: preset.color2,
    }))
  }

  const reset = () => setState(DEFAULTS)

  const mixValue = useMemo(
    () => buildColorMix(state),
    [state.space, state.color1, state.percent1, state.color2]
  )
  const fullCss = useMemo(() => buildFullCss(state), [mixValue])
  const htmlExample = useMemo(() => buildHtmlExample(fullCss), [fullCss])

  const valid1 = isValidHex(state.color1)
  const valid2 = isValidHex(state.color2)

  const copyCss = () => {
    navigator.clipboard.writeText(fullCss)
    message.success(t.copiedCss)
  }

  const copyHtml = () => {
    navigator.clipboard.writeText(htmlExample)
    message.success(t.copiedHtml)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.supportTitle} description={t.supportBody} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.preview}>
            <div
              style={{
                width: '100%',
                height: 220,
                borderRadius: 12,
                background: valid1 && valid2 ? mixValue : 'transparent',
                border: '1px solid #d9d9d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {(!valid1 || !valid2) && (
                <Text type="danger">{t.invalidHex}</Text>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.cssOutput} extra={<Button size="small" icon={<CopyOutlined />} onClick={copyCss}>{t.copyCss}</Button>}>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{valid1 && valid2 ? fullCss : `/* ${t.invalidHex} */`}</code>
            </pre>
          </Card>

          <Card
            title={t.htmlOutput}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={copyHtml}>{t.copyHtml}</Button>}
            style={{ marginTop: 16 }}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{valid1 && valid2 ? htmlExample : `<!-- ${t.invalidHex} -->`}</code>
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
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.color1}</Text>
                <Space>
                  <input
                    type="color"
                    value={valid1 ? state.color1 : '#000000'}
                    onChange={(e) => setField('color1', e.target.value)}
                    style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <Input
                    value={state.color1}
                    onChange={(e) => setField('color1', e.target.value)}
                    status={valid1 ? '' : 'error'}
                    style={{ width: 120 }}
                    maxLength={7}
                  />
                </Space>
                {!valid1 && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidHex}</Text>}
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.color2}</Text>
                <Space>
                  <input
                    type="color"
                    value={valid2 ? state.color2 : '#000000'}
                    onChange={(e) => setField('color2', e.target.value)}
                    style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <Input
                    value={state.color2}
                    onChange={(e) => setField('color2', e.target.value)}
                    status={valid2 ? '' : 'error'}
                    style={{ width: 120 }}
                    maxLength={7}
                  />
                </Space>
                {!valid2 && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidHex}</Text>}
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0' }} />

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>{t.percent1}</Text>
                  <Text code>{state.percent1}%</Text>
                </Space>
                <Slider
                  min={0}
                  max={100}
                  value={state.percent1}
                  onChange={(v) => setField('percent1', v)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.space}</Text>
                <Select
                  value={state.space}
                  onChange={(v) => setField('space', v)}
                  options={COLOR_SPACES.map((s) => ({ value: s, label: s }))}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 360 }}>
                  <code>{`// src/utils/colorMixGenerator.js

export const COLOR_SPACES = ${JSON.stringify(COLOR_SPACES, null, 2)};

export const DEFAULTS = ${JSON.stringify(DEFAULTS, null, 2)};

export function isValidHex(value) {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(value);
}

export function buildColorMix({ space, color1, percent1, color2 }) {
  if (!space || !color1 || !color2) return '';
  return \`color-mix(in \${space}, \${color1} \${percent1}%, \${color2})\`;
}

export function buildFullCss({ space, color1, percent1, color2, property = 'background-color' }) {
  const mix = buildColorMix({ space, color1, percent1, color2 });
  return \`\${property}: \${mix};\`;
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
