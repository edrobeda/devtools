import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, message, Select,
  Slider, InputNumber, Row, Col, Switch, Tag,
} from 'antd'
import { SwapOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PROPERTIES,
  TIMING_FUNCTIONS,
  STEP_POSITIONS,
  DEFAULT_SETTINGS,
  PRESETS,
  buildTransitionCss,
  buildDemoHtml,
  buildFullDemo,
  buildPreviewStyle,
  buildTimingValue,
} from '../utils/cssTransitionGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message
const { Option } = Select

const translations = {
  pt: {
    title: 'Gerador de CSS Transition',
    intro: (
      <>Monte a declaração <Text code>transition</Text> do CSS de forma visual: escolha as propriedades, duração, função de timing e delay, e veja o efeito ao vivo antes de copiar o código.</>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        <Text code>transition</Text> é o atalho para{' '}
        <Text code>transition-property</Text>,{' '}
        <Text code>transition-duration</Text>,{' '}
        <Text code>transition-timing-function</Text> e{' '}
        <Text code>transition-delay</Text>. A ordem importa: primeiro a propriedade, depois duração, depois timing e, por último, delay.{' '}
        <Text code>will-change</Text> ajuda o navegador a otimizar, mas use com moderação — deixá-los acumulados pode consumir memória. Se a propriedade que você anima não for a mesma que muda no estado (ex.: <Text code>:hover</Text>), a transição não acontece.
      </>
    ),
    preset: 'Preset',
    presetSmooth: 'Suave (padrão)',
    presetSnappy: 'Rápida e responsiva',
    presetBounce: 'Elástica',
    presetSteps: 'Stepped',
    presetSlowFade: 'Fade lento',
    properties: 'Propriedades',
    propertiesHint: 'Quais propriedades serão animadas',
    duration: 'Duração (ms)',
    timingFunction: 'Função de timing',
    cubicBezier: 'Curva cubic-bezier',
    steps: 'Passos',
    stepPosition: 'Posição do passo',
    delay: 'Delay (ms)',
    willChange: 'Ativar will-change',
    preview: 'Pré-visualização',
    previewHint: 'Clique no botão abaixo para simular a troca de estado e ver a transição.',
    trigger: 'Alternar estado',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    reset: 'Redefinir padrão',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssTransitionGenerator.js. buildTransitionCss monta o shorthand e a versão longa das propriedades; buildTimingValue formata a função de timing (incluindo cubic-bezier e steps); buildPreviewStyle devolve o objeto de estilo para o preview ao vivo.',
    tagsProperties: 'propriedades',
    tagsDuration: 'duração',
    tagsTiming: 'timing',
    tagsDelay: 'delay',
  },
  en: {
    title: 'CSS Transition Generator',
    intro: (
      <>Build the CSS <Text code>transition</Text> declaration visually: pick the properties, duration, timing function and delay, and preview the effect live before copying the code.</>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        <Text code>transition</Text> is the shorthand for{' '}
        <Text code>transition-property</Text>,{' '}
        <Text code>transition-duration</Text>,{' '}
        <Text code>transition-timing-function</Text> and{' '}
        <Text code>transition-delay</Text>. Order matters: property first, then duration, then timing, then delay.{' '}
        <Text code>will-change</Text> hints the browser to optimize, but use it sparingly — leaving many of them around can waste memory. If the property you animate is not the one that changes in the target state (e.g. <Text code>:hover</Text>), no transition will occur.
      </>
    ),
    preset: 'Preset',
    presetSmooth: 'Smooth (default)',
    presetSnappy: 'Snappy',
    presetBounce: 'Bouncy',
    presetSteps: 'Stepped',
    presetSlowFade: 'Slow fade',
    properties: 'Properties',
    propertiesHint: 'Which properties will be animated',
    duration: 'Duration (ms)',
    timingFunction: 'Timing function',
    cubicBezier: 'cubic-bezier curve',
    steps: 'Steps',
    stepPosition: 'Step position',
    delay: 'Delay (ms)',
    willChange: 'Enable will-change',
    preview: 'Preview',
    previewHint: 'Click the button below to simulate a state change and see the transition.',
    trigger: 'Toggle state',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    reset: 'Reset to default',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssTransitionGenerator.js. buildTransitionCss builds both the shorthand and the longhand version of the properties; buildTimingValue formats the timing function (including cubic-bezier and steps); buildPreviewStyle returns the style object for the live preview.',
    tagsProperties: 'properties',
    tagsDuration: 'duration',
    tagsTiming: 'timing',
    tagsDelay: 'delay',
  },
}

const PRESET_LABELS = {
  pt: {
    smooth: 'Suave (padrão)',
    snappy: 'Rápida e responsiva',
    bounce: 'Elástica',
    steps: 'Stepped',
    'slow-fade': 'Fade lento',
  },
  en: {
    smooth: 'Smooth (default)',
    snappy: 'Snappy',
    bounce: 'Bouncy',
    steps: 'Stepped',
    'slow-fade': 'Slow fade',
  },
}

export default function CssTransitionGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [active, setActive] = useState(false)

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }))

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (p) setSettings(p.settings)
  }

  const reset = () => setSettings(DEFAULT_SETTINGS)

  const cssOutput = useMemo(() => buildTransitionCss(settings), [settings])
  const htmlOutput = useMemo(() => buildDemoHtml(settings), [settings])
  const fullOutput = useMemo(() => buildFullDemo(settings), [settings])
  const previewStyle = useMemo(() => buildPreviewStyle(settings), [settings])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const isCubic = settings.timingFunction === 'cubic-bezier'
  const isSteps = settings.timingFunction === 'steps'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card size="small" title={t.preset}>
            <Select
              style={{ width: '100%' }}
              placeholder={t.preset}
              value={null}
              onChange={applyPreset}
              options={PRESETS.map((p) => ({
                value: p.key,
                label: PRESET_LABELS[lang][p.key],
              }))}
            />
          </Card>

          <Card title="Configurações" style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text>{t.properties}</Text>
                <Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 12 }}>
                  {t.propertiesHint}
                </Paragraph>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  value={settings.properties}
                  onChange={(v) => update({ properties: v.length ? v : ['all'] })}
                  options={PROPERTIES.map((p) => ({ value: p, label: p }))}
                />
              </div>

              <div>
                <Text>{t.duration}</Text>
                <Slider
                  min={0}
                  max={3000}
                  step={50}
                  value={settings.duration}
                  onChange={(v) => update({ duration: v })}
                />
              </div>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.duration}</Text>
                <InputNumber
                  min={0}
                  max={5000}
                  step={50}
                  value={settings.duration}
                  onChange={(v) => update({ duration: v ?? 0 })}
                  style={{ width: 90 }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.timingFunction}</Text>
                <Select
                  value={settings.timingFunction}
                  onChange={(v) => update({ timingFunction: v })}
                  style={{ width: 150 }}
                >
                  {TIMING_FUNCTIONS.map((o) => (
                    <Option key={o} value={o}>{o}</Option>
                  ))}
                </Select>
              </Space>

              {isCubic && (
                <Card size="small" title={t.cubicBezier}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {['x1', 'y1', 'x2', 'y2'].map((label, i) => (
                      <Space key={label} style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>{label}</Text>
                        <InputNumber
                          min={-2}
                          max={2}
                          step={0.05}
                          value={settings.cubicBezier[i]}
                          onChange={(v) => {
                            const next = [...settings.cubicBezier]
                            next[i] = v ?? 0
                            update({ cubicBezier: next })
                          }}
                          style={{ width: 90 }}
                        />
                      </Space>
                    ))}
                  </Space>
                </Card>
              )}

              {isSteps && (
                <Card size="small" title={t.steps}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{t.steps}</Text>
                      <InputNumber
                        min={1}
                        max={20}
                        value={settings.steps}
                        onChange={(v) => update({ steps: v ?? 1 })}
                        style={{ width: 80 }}
                      />
                    </Space>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{t.stepPosition}</Text>
                      <Select
                        value={settings.stepPosition}
                        onChange={(v) => update({ stepPosition: v })}
                        style={{ width: 120 }}
                      >
                        {STEP_POSITIONS.map((o) => (
                          <Option key={o} value={o}>{o}</Option>
                        ))}
                      </Select>
                    </Space>
                  </Space>
                </Card>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.delay}</Text>
                <InputNumber
                  min={0}
                  max={5000}
                  step={50}
                  value={settings.delay}
                  onChange={(v) => update({ delay: v ?? 0 })}
                  style={{ width: 90 }}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.willChange}</Text>
                <Switch checked={settings.willChange} onChange={(v) => update({ willChange: v })} />
              </Space>

              <Button icon={<ReloadOutlined />} onClick={reset} block>{t.reset}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 32,
                background: '#fafafa',
                minHeight: 240,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 160,
                  height: 100,
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  background: active ? '#1890ff' : '#e6f7ff',
                  color: active ? '#fff' : '#0958d9',
                  transform: active ? 'scale(1.1) rotate(3deg)' : 'scale(1) rotate(0deg)',
                  boxShadow: active ? '0 12px 24px rgba(0,0,0,0.18)' : '0 4px 12px rgba(0,0,0,0.08)',
                  ...previewStyle,
                }}
              >
                {active ? 'Ativo' : 'Inativo'}
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
            <Button
              type="primary"
              style={{ marginTop: 16 }}
              onClick={() => setActive((p) => !p)}
            >
              {t.trigger}
            </Button>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space wrap size={[8, 8]}>
              <Tag color="blue">{settings.properties.length} {t.tagsProperties}</Tag>
              <Tag color="green">{settings.duration}ms {t.tagsDuration}</Tag>
              <Tag color="orange">{buildTimingValue(settings)}</Tag>
              {settings.delay > 0 && (
                <Tag color="purple">{settings.delay}ms {t.tagsDelay}</Tag>
              )}
              {settings.willChange && <Tag color="volcano">will-change</Tag>}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={(
          <Space>
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>{t.copy}</Button>
          </Space>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
          <code>{cssOutput}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'full',
            label: 'CSS + HTML',
            children: (
              <Card
                title=""
                extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>{t.copy}</Button>}
              >
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{fullOutput}</code>
                </pre>
              </Card>
            ),
          },
          {
            key: 'source',
            label: `${t.sourceCol} — buildTransitionCss / buildTimingValue`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{`${buildTransitionCss.toString()}\n\n${buildTimingValue.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
