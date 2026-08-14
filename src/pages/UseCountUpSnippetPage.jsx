import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Progress,
  Alert,
} from 'antd'
import {
  CodeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCountUp from '../hooks/useCountUp'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef, useState } from 'react'

const EASINGS = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
}

export function getEasing(name) {
  return EASINGS[name] || EASINGS.linear
}

export function formatCountUp(
  value,
  { decimals = 0, separator = '', prefix = '', suffix = '' } = {}
) {
  const fixed = Number(value).toFixed(Math.max(0, Math.min(20, decimals)))
  const [intPart, decPart] = fixed.split('.')
  const formattedInt = separator
    ? intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, separator)
    : intPart
  return \`\${prefix}\${formattedInt}\${decPart ? \`.\${decPart}\` : ''}\${suffix}\`
}

export default function useCountUp(end, options = {}) {
  const {
    start: startValue = 0,
    duration = 2000,
    delay = 0,
    easing = 'linear',
    decimals = 0,
    separator = '',
    prefix = '',
    suffix = '',
    startOnMount = true,
    onStart,
    onUpdate,
    onComplete,
    onReset,
  } = options

  const [value, setValue] = useState(startValue)
  const [isRunning, setIsRunning] = useState(false)

  const rafRef = useRef(null)
  const delayTimeoutRef = useRef(null)
  const startTimeRef = useRef(null)
  const elapsedBeforePauseRef = useRef(0)

  const onStartRef = useRef(onStart)
  const onUpdateRef = useRef(onUpdate)
  const onCompleteRef = useRef(onComplete)
  const onResetRef = useRef(onReset)

  useEffect(() => { onStartRef.current = onStart }, [onStart])
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { onResetRef.current = onReset }, [onReset])

  const clearTimers = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current)
      delayTimeoutRef.current = null
    }
  }, [])

  const tick = useCallback((timestamp) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp - elapsedBeforePauseRef.current
    }

    const elapsed = timestamp - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)
    const eased = getEasing(easing)(progress)
    const current = startValue + (end - startValue) * eased

    setValue(current)
    onUpdateRef.current?.(current)

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      setIsRunning(false)
      setValue(end)
      onCompleteRef.current?.(end)
    }
  }, [startValue, end, duration, easing])

  const start = useCallback(() => {
    clearTimers()
    elapsedBeforePauseRef.current = 0
    startTimeRef.current = null
    setValue(startValue)
    setIsRunning(true)
    onStartRef.current?.()

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick)
      }, delay)
    } else {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [clearTimers, delay, startValue, tick])

  const pause = useCallback(() => {
    clearTimers()
    if (startTimeRef.current !== null) {
      elapsedBeforePauseRef.current = performance.now() - startTimeRef.current
    }
    setIsRunning(false)
  }, [clearTimers])

  const resume = useCallback(() => {
    if (isRunning) return
    clearTimers()
    setIsRunning(true)
    startTimeRef.current = null
    rafRef.current = requestAnimationFrame(tick)
  }, [isRunning, clearTimers, tick])

  const reset = useCallback(() => {
    clearTimers()
    elapsedBeforePauseRef.current = 0
    startTimeRef.current = null
    setIsRunning(false)
    setValue(startValue)
    onResetRef.current?.(startValue)
  }, [clearTimers, startValue])

  useEffect(() => {
    if (startOnMount) start()
    return () => clearTimers()
  }, [])

  return {
    value,
    formatted: formatCountUp(value, { decimals, separator, prefix, suffix }),
    isRunning,
    start,
    pause,
    resume,
    reset,
  }
}`

const exampleCode = `const { formatted, isRunning, start, pause, resume, reset } = useCountUp(10000, {
  start: 0,
  duration: 2500,
  delay: 300,
  easing: 'easeOutQuad',
  decimals: 0,
  separator: ',',
  prefix: '',
  suffix: '',
})`

const translations = {
  pt: {
    title: 'Snippet: useCountUp',
    intro: (
      <>
        Hook que anima um número de um valor inicial até um valor final usando{' '}
        <Text code>requestAnimationFrame</Text>. Útil para dashboards,
        estatísticas, contadores de visualização e qualquer interface que precise
        de transições numéricas suaves. Suporta delay, easing, casas decimais,
        separador de milhar, prefixo/sufixo e controle programático
        (start/pause/resume/reset).
      </>
    ),
    sourceTitle: 'Código-fonte',
    exampleTitle: 'Exemplo de uso',
    demoTitle: 'Demonstração',
    controlsTitle: 'Configurações',
    applyButton: 'Aplicar e reiniciar',
    endLabel: 'Valor final',
    startLabel: 'Valor inicial',
    durationLabel: 'Duração (ms)',
    delayLabel: 'Delay (ms)',
    easingLabel: 'Easing',
    decimalsLabel: 'Casas decimais',
    separatorLabel: 'Separador de milhar',
    prefixLabel: 'Prefixo',
    suffixLabel: 'Sufixo',
    startButton: 'Iniciar',
    pauseButton: 'Pausar',
    resumeButton: 'Continuar',
    resetButton: 'Resetar',
    progressLabel: 'Progresso',
    alertTitle: 'Como funciona',
    alertDescription:
      'Altere os campos acima e clique em "Aplicar e reiniciar". O hook guarda o tempo decorrido quando pausado, então "Continuar" retoma exatamente de onde parou.',
  },
  en: {
    title: 'Snippet: useCountUp',
    intro: (
      <>
        A hook that animates a number from a start value to an end value using{' '}
        <Text code>requestAnimationFrame</Text>. Useful for dashboards, stats,
        view counters, and any UI that needs smooth numeric transitions.
        Supports delay, easing, decimals, thousands separator, prefix/suffix,
        and programmatic control (start/pause/resume/reset).
      </>
    ),
    sourceTitle: 'Source code',
    exampleTitle: 'Usage example',
    demoTitle: 'Demo',
    controlsTitle: 'Settings',
    applyButton: 'Apply & restart',
    endLabel: 'End value',
    startLabel: 'Start value',
    durationLabel: 'Duration (ms)',
    delayLabel: 'Delay (ms)',
    easingLabel: 'Easing',
    decimalsLabel: 'Decimal places',
    separatorLabel: 'Thousands separator',
    prefixLabel: 'Prefix',
    suffixLabel: 'Suffix',
    startButton: 'Start',
    pauseButton: 'Pause',
    resumeButton: 'Resume',
    resetButton: 'Reset',
    progressLabel: 'Progress',
    alertTitle: 'How it works',
    alertDescription:
      'Change the fields above and click "Apply & restart". The hook stores elapsed time when paused, so "Resume" continues exactly from where it stopped.',
  },
}

function clampDuration(n) {
  return Math.max(100, Math.min(60000, n || 0))
}

function clampDelay(n) {
  return Math.max(0, Math.min(10000, n || 0))
}

function clampDecimals(n) {
  return Math.max(0, Math.min(10, n || 0))
}

function DemoUsage({ t, config, onConfigChange }) {
  const [draft, setDraft] = useState(config)

  const countUpConfig = useMemo(
    () => ({
      start: draft.start,
      duration: clampDuration(draft.duration),
      delay: clampDelay(draft.delay),
      easing: draft.easing,
      decimals: clampDecimals(draft.decimals),
      separator: draft.separator,
      prefix: draft.prefix,
      suffix: draft.suffix,
      startOnMount: true,
    }),
    [draft]
  )

  const { formatted, value, isRunning, start, pause, resume, reset } = useCountUp(
    draft.end,
    countUpConfig
  )

  const progress =
    draft.end === draft.start
      ? 100
      : Math.min(100, Math.max(0, ((value - draft.start) / (draft.end - draft.start)) * 100))

  const apply = () => {
    onConfigChange({ ...draft })
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card size="small" title={t.controlsTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.startLabel}</Text>
            <InputNumber
              style={{ width: '100%' }}
              value={draft.start}
              onChange={(v) => setDraft((d) => ({ ...d, start: v ?? 0 }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.endLabel}</Text>
            <InputNumber
              style={{ width: '100%' }}
              value={draft.end}
              onChange={(v) => setDraft((d) => ({ ...d, end: v ?? 0 }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.durationLabel}</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={100}
              max={60000}
              step={100}
              value={draft.duration}
              onChange={(v) => setDraft((d) => ({ ...d, duration: v ?? 1000 }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.delayLabel}</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={10000}
              step={100}
              value={draft.delay}
              onChange={(v) => setDraft((d) => ({ ...d, delay: v ?? 0 }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.easingLabel}</Text>
            <Select
              style={{ width: '100%' }}
              value={draft.easing}
              onChange={(v) => setDraft((d) => ({ ...d, easing: v }))}
              options={[
                { label: 'linear', value: 'linear' },
                { label: 'easeInQuad', value: 'easeInQuad' },
                { label: 'easeOutQuad', value: 'easeOutQuad' },
                { label: 'easeInOutQuad', value: 'easeInOutQuad' },
                { label: 'easeInCubic', value: 'easeInCubic' },
                { label: 'easeOutCubic', value: 'easeOutCubic' },
                { label: 'easeInOutCubic', value: 'easeInOutCubic' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.decimalsLabel}</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={10}
              value={draft.decimals}
              onChange={(v) => setDraft((d) => ({ ...d, decimals: v ?? 0 }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.separatorLabel}</Text>
            <Input
              style={{ width: '100%' }}
              value={draft.separator}
              onChange={(e) => setDraft((d) => ({ ...d, separator: e.target.value }))}
              maxLength={1}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.prefixLabel}</Text>
            <Input
              style={{ width: '100%' }}
              value={draft.prefix}
              onChange={(e) => setDraft((d) => ({ ...d, prefix: e.target.value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t.suffixLabel}</Text>
            <Input
              style={{ width: '100%' }}
              value={draft.suffix}
              onChange={(e) => setDraft((d) => ({ ...d, suffix: e.target.value }))}
            />
          </Col>
        </Row>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={apply}
          style={{ marginTop: 16 }}
        >
          {t.applyButton}
        </Button>
      </Card>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: isRunning ? '#1677ff' : undefined,
                transition: 'color 0.2s',
              }}
            >
              {formatted}
            </div>
            <Text type="secondary">
              raw: {value.toFixed(Math.min(4, draft.decimals + 2))}
            </Text>
          </div>

          <Space wrap>
            <Button icon={<PlayCircleOutlined />} onClick={start}>
              {t.startButton}
            </Button>
            <Button icon={<PauseCircleOutlined />} onClick={pause}>
              {t.pauseButton}
            </Button>
            <Button icon={<RedoOutlined />} onClick={resume}>
              {t.resumeButton}
            </Button>
            <Button onClick={reset}>{t.resetButton}</Button>
          </Space>

          <div>
            <Text strong>{t.progressLabel}</Text>
            <Progress percent={Math.round(progress * 100) / 100} showInfo />
          </div>
        </Space>
      </Card>
    </Space>
  )
}

export default function UseCountUpSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [config, setConfig] = useState({
    start: 0,
    end: 10000,
    duration: 2500,
    delay: 300,
    easing: 'easeOutQuad',
    decimals: 0,
    separator: ',',
    prefix: '',
    suffix: '',
  })

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.exampleTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{exampleCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={t.alertTitle}
            description={t.alertDescription}
          />
          <DemoUsage t={t} config={config} onConfigChange={setConfig} />
        </Space>
      </Card>
    </Space>
  )
}
