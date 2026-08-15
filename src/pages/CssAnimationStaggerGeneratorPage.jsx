import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Slider,
  Select,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Segmented,
  Tag,
  message,
} from 'antd'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  getDefaults,
  getPresets,
  ANIMATIONS,
  EASINGS,
  DIRECTIONS,
  STRATEGIES,
  ANIMATION_LABELS,
  DIRECTION_LABELS,
  STRATEGY_LABELS,
  buildStagger,
  computeTotalDuration,
  makeAnimationKey,
} from '../utils/cssAnimationStaggerGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { useMessage } = message
const { Panel } = Collapse

const SOURCE_SNIPPET = `// O motor vive em src/utils/cssAnimationStaggerGenerator.js.
//
// 1. computeDelay(index, count, stagger, initial, direction) calcula o delay
//    de cada item considerando forward, reverse, center e edges.
//
// 2. buildStagger(params) monta o CSS de duas formas:
//    - :nth-child — regras explícitas com animation-delay para cada item.
//    - custom-property — cada item recebe --i via :nth-child e o delay é
//      calculado com calc(var(--stagger-initial) + var(--i) * var(--stagger-delay)).
//
// 3. O preview da página injeta o CSS gerado numa tag <style scoped> e força
//    re-mount com uma key derivada dos parâmetros, permitindo clicar em
//    "Reanimar" sem recarregar a página.`

const translations = {
  pt: {
    title: 'Gerador de Stagger CSS',
    intro: (
      <>
        Crie animações escalonadas (stagger) sem escrever dezenas de regras{' '}
        <Text code>:nth-child</Text>. Configure o seletor, a direção do delay, o
        tipo de animação e a estratégia de geração — o preview roda com o CSS
        exato que será copiado.
      </>
    ),
    settings: 'Configurações',
    selector: 'Seletor base',
    selectorPlaceholder: 'Ex: .item, .card, li',
    count: 'Quantidade de itens',
    animation: 'Animação',
    duration: 'Duração (s)',
    easing: 'Easing',
    initialDelay: 'Delay inicial (s)',
    stagger: 'Delay entre itens (s)',
    direction: 'Direção do stagger',
    strategy: 'Estratégia CSS',
    fillMode: 'Fill mode',
    iterations: 'Iterações',
    customKeyframes: 'Keyframes personalizado',
    presets: 'Presets',
    preview: 'Preview',
    previewHint: 'CSS gerado aplicado em tempo real. Clique em Reanimar para repetir.',
    replay: 'Reanimar',
    output: 'Código gerado',
    cssTab: 'CSS',
    htmlTab: 'HTML',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    stats: (total, last) => `Duração total: ${total}s · último item inicia aos ${last}s`,
    tipTitle: 'Dicas',
    tipBody: (
      <>
        Use <Text code>animation-fill-mode: both</Text> para que os itens mantenham
        o estado inicial e final da animação. Prefira animar apenas{' '}
        <Text code>opacity</Text> e <Text code>transform</Text> para manter a
        composição acelerada. A estratégia com custom properties deixa o CSS
        mais enxuto quando o número de itens é grande.
      </>
    ),
    sourceTitle: 'Código-fonte do motor',
  },
  en: {
    title: 'CSS Stagger Animation Generator',
    intro: (
      <>
        Build staggered animations without hand-writing dozens of{' '}
        <Text code>:nth-child</Text> rules. Set the selector, delay direction,
        animation type and generation strategy — the preview runs with the exact
        CSS you will copy.
      </>
    ),
    settings: 'Settings',
    selector: 'Base selector',
    selectorPlaceholder: 'E.g. .item, .card, li',
    count: 'Number of items',
    animation: 'Animation',
    duration: 'Duration (s)',
    easing: 'Easing',
    initialDelay: 'Initial delay (s)',
    stagger: 'Stagger delay (s)',
    direction: 'Stagger direction',
    strategy: 'CSS strategy',
    fillMode: 'Fill mode',
    iterations: 'Iterations',
    customKeyframes: 'Custom keyframes',
    presets: 'Presets',
    preview: 'Preview',
    previewHint: 'Generated CSS applied live. Click Replay to run again.',
    replay: 'Replay',
    output: 'Generated code',
    cssTab: 'CSS',
    htmlTab: 'HTML',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    stats: (total, last) => `Total duration: ${total}s · last item starts at ${last}s`,
    tipTitle: 'Tips',
    tipBody: (
      <>
        Use <Text code>animation-fill-mode: both</Text> so items keep both the
        initial and final animation states. Animate only{' '}
        <Text code>opacity</Text> and <Text code>transform</Text> to stay on the
        compositor. The custom-property strategy keeps CSS compact when you have
        many items.
      </>
    ),
    sourceTitle: 'Engine source code',
  },
}

const FILL_MODES = ['none', 'forwards', 'backwards', 'both']
const ITERATION_OPTIONS = ['1', '2', '3', 'infinite']

export default function CssAnimationStaggerGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const animationLabels = ANIMATION_LABELS[lang]
  const directionLabels = DIRECTION_LABELS[lang]
  const strategyLabels = STRATEGY_LABELS[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const defaults = useMemo(() => getDefaults(), [])
  const presets = useMemo(() => getPresets(), [])

  const [selector, setSelector] = useState(defaults.selector)
  const [count, setCount] = useState(defaults.count)
  const [animation, setAnimation] = useState(defaults.animation)
  const [duration, setDuration] = useState(defaults.duration)
  const [easing, setEasing] = useState(defaults.easing)
  const [initialDelay, setInitialDelay] = useState(defaults.initialDelay)
  const [stagger, setStagger] = useState(defaults.stagger)
  const [direction, setDirection] = useState(defaults.direction)
  const [strategy, setStrategy] = useState(defaults.strategy)
  const [fillMode, setFillMode] = useState(defaults.fillMode)
  const [iterations, setIterations] = useState(defaults.iterations)
  const [customKeyframes, setCustomKeyframes] = useState(defaults.customKeyframes)
  const [replayKey, setReplayKey] = useState(0)

  const params = useMemo(
    () => ({
      selector,
      count,
      animation,
      duration,
      easing,
      initialDelay,
      stagger,
      direction,
      strategy,
      fillMode,
      iterations,
      customKeyframes,
    }),
    [selector, count, animation, duration, easing, initialDelay, stagger, direction, strategy, fillMode, iterations, customKeyframes]
  )

  const { css, html, delays } = useMemo(() => buildStagger(params), [params])
  const totalDuration = useMemo(() => computeTotalDuration(count, stagger, initialDelay, direction, duration), [count, stagger, initialDelay, direction, duration])
  const lastDelay = useMemo(() => Math.max(...delays), [delays])
  const animationKey = useMemo(() => makeAnimationKey(params), [params])

  // Sempre que os parâmetros mudarem, reinicia o preview automaticamente.
  useEffect(() => {
    setReplayKey((k) => k + 1)
  }, [animationKey])

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [messageApi, t])

  const applyPreset = useCallback((preset) => {
    const v = preset.values
    setSelector(v.selector)
    setCount(v.count)
    setAnimation(v.animation)
    setDuration(v.duration)
    setEasing(v.easing)
    setInitialDelay(v.initialDelay)
    setStagger(v.stagger)
    setDirection(v.direction)
    setStrategy(v.strategy)
    setFillMode(v.fillMode)
    setIterations(v.iterations)
  }, [])

  const previewClass = selector.trim().replace(/^[.#]/, '').split(/[ >+~]/)[0] || 'item'
  const previewItems = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}>{t.title}</Title>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={<><ThunderboltOutlined /> {t.settings}</>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.selector}</Text>
                <Input
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder={t.selectorPlaceholder}
                />
              </div>

              <div>
                <Text strong>{t.animation}</Text>
                <Select value={animation} onChange={setAnimation} style={{ width: '100%' }}>
                  {Object.keys(ANIMATIONS).map((key) => (
                    <Option key={key} value={key}>{animationLabels[key] || key}</Option>
                  ))}
                </Select>
              </div>

              {animation === 'custom' && (
                <div>
                  <Text strong>{t.customKeyframes}</Text>
                  <TextArea
                    value={customKeyframes}
                    onChange={(e) => setCustomKeyframes(e.target.value)}
                    rows={4}
                    monospace
                  />
                </div>
              )}

              <div>
                <Text strong>{t.count}</Text>
                <Slider value={count} onChange={setCount} min={1} max={24} marks={{ 1: '1', 12: '12', 24: '24' }} />
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>{t.duration}</Text>
                  <Slider value={duration} onChange={setDuration} min={0.1} max={2} step={0.05} />
                </Col>
                <Col span={12}>
                  <Text strong>{t.easing}</Text>
                  <Select value={easing} onChange={setEasing} style={{ width: '100%' }}>
                    {EASINGS.map((e) => (
                      <Option key={e} value={e}>{e}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>{t.initialDelay}</Text>
                  <Slider value={initialDelay} onChange={setInitialDelay} min={0} max={1} step={0.05} />
                </Col>
                <Col span={12}>
                  <Text strong>{t.stagger}</Text>
                  <Slider value={stagger} onChange={setStagger} min={0} max={0.5} step={0.01} />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>{t.direction}</Text>
                  <Select value={direction} onChange={setDirection} style={{ width: '100%' }}>
                    {DIRECTIONS.map((d) => (
                      <Option key={d} value={d}>{directionLabels[d]}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <Text strong>{t.strategy}</Text>
                  <Select value={strategy} onChange={setStrategy} style={{ width: '100%' }}>
                    {STRATEGIES.map((s) => (
                      <Option key={s} value={s}>{strategyLabels[s]}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>{t.fillMode}</Text>
                  <Select value={fillMode} onChange={setFillMode} style={{ width: '100%' }}>
                    {FILL_MODES.map((f) => (
                      <Option key={f} value={f}>{f}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <Text strong>{t.iterations}</Text>
                  <Select value={String(iterations)} onChange={setIterations} style={{ width: '100%' }}>
                    {ITERATION_OPTIONS.map((i) => (
                      <Option key={i} value={i}>{i}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <div>
                <Text strong>{t.presets}</Text>
                <Space wrap>
                  {presets.map((preset) => (
                    <Button key={preset.key} onClick={() => applyPreset(preset)}>
                      {preset.label[lang]}
                    </Button>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={<><PlayCircleOutlined /> {t.preview}</>}
            extra={
              <Button icon={<ReloadOutlined />} onClick={() => setReplayKey((k) => k + 1)}>
                {t.replay}
              </Button>
            }
          >
            <Paragraph type="secondary">{t.previewHint}</Paragraph>
            <div style={{ minHeight: 160, padding: 12, background: '#f6ffed', borderRadius: 8 }}>
              <style key={replayKey}>
                {css.replace(new RegExp(selector.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `.preview-${previewClass}`)}
              </style>
              <div className={`preview-${previewClass}s`} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {previewItems.map((i) => (
                  <div
                    key={i}
                    className={`preview-${previewClass}`}
                    style={{
                      width: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#1677ff',
                      color: '#fff',
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Tag color="blue">{t.stats(totalDuration.toFixed(2), lastDelay.toFixed(2))}</Tag>
            </div>
          </Card>

          <Card title={<><CodeOutlined /> {t.output}</>} style={{ marginTop: 16 }}>
            <Collapse defaultActiveKey={['css']}>
              <Panel header={t.cssTab} key="css">
                <pre style={{ margin: 0, overflow: 'auto', maxHeight: 360 }}><code>{css}</code></pre>
                <Button icon={<CopyOutlined />} onClick={() => handleCopy(css)} style={{ marginTop: 8 }}>
                  {t.copy}
                </Button>
              </Panel>
              <Panel header={t.htmlTab} key="html">
                <pre style={{ margin: 0, overflow: 'auto', maxHeight: 360 }}><code>{html}</code></pre>
                <Button icon={<CopyOutlined />} onClick={() => handleCopy(html)} style={{ marginTop: 8 }}>
                  {t.copy}
                </Button>
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <pre style={{ margin: 0 }}><code>{SOURCE_SNIPPET}</code></pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
