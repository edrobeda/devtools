import React, { useState } from 'react'
import { Typography, Card, Space, Tag, Alert, Slider, Button, Statistic, Row, Col } from 'antd'
import { CodeOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons'
import useLongPress from '../hooks/useLongPress'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useRef, useState } from 'react'

export default function useLongPress(options = {}) {
  const [isPressed, setIsPressed] = useState(false)
  const [wasLongPress, setWasLongPress] = useState(false)
  const timerRef = useRef(null)
  const triggeredRef = useRef(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const start = useCallback((e) => {
    const { threshold = 500, onPressStart } = optionsRef.current
    setIsPressed(true)
    setWasLongPress(false)
    triggeredRef.current = false
    onPressStart?.(e)

    timerRef.current = window.setTimeout(() => {
      triggeredRef.current = true
      setWasLongPress(true)
      optionsRef.current.onLongPress?.(e)
    }, threshold)
  }, [])

  const cancel = useCallback((e) => {
    const { onPressEnd, onCancel } = optionsRef.current
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPressed(false)
    onPressEnd?.(e)
    if (!triggeredRef.current) {
      onCancel?.(e)
    }
    triggeredRef.current = false
  }, [])

  const ref = useCallback((node) => {
    if (!node) return

    node.addEventListener('mousedown', start)
    node.addEventListener('touchstart', start, { passive: true })
    node.addEventListener('mouseup', cancel)
    node.addEventListener('mouseleave', cancel)
    node.addEventListener('touchend', cancel)

    return () => {
      node.removeEventListener('mousedown', start)
      node.removeEventListener('touchstart', start)
      node.removeEventListener('mouseup', cancel)
      node.removeEventListener('mouseleave', cancel)
      node.removeEventListener('touchend', cancel)
    }
  }, [start, cancel])

  return [ref, isPressed, wasLongPress]
}

// uso:
// const [ref, isPressed, wasLongPress] = useLongPress({
//   threshold: 600,
//   onLongPress: () => console.log('long press!'),
// })
// <button ref={ref}>Segure</button>`

const translations = {
  pt: {
    title: 'Snippet: useLongPress',
    intro: (
      <>
        Hook que detecta um <Text code>long press</Text> (pressionamento
        prolongado) em um elemento, funcionando com mouse e touch. Retorna uma
        callback <Text code>ref</Text>, um booleano <Text code>isPressed</Text>{' '}
        e outro <Text code>wasLongPress</Text>. Ideal para menus contextuais,
        ações secundárias, exclusão de itens e atalhos mobile.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    thresholdLabel: 'Threshold (ms)',
    demoDesc: 'Clique e segure a área abaixo. Solte antes do tempo para cancelar.',
    statePressed: 'Pressionado',
    stateLongPress: 'Long press detectado!',
    stateIdle: 'Solto',
    counterTitle: 'Long presses',
    lastEvent: 'Último evento',
    eventStart: 'início',
    eventEnd: 'fim',
    eventCancel: 'cancelado (curto)',
    eventLongPress: 'long press',
    reset: 'Reset',
    note: (
      <>
        Os eventos <Text code>touchstart</Text> são registrados com{' '}
        <Text code>{'{ passive: true }'}</Text> para não bloquear o scroll. A
        limpeza remove todos os listeners quando o elemento é desmontado ou
        trocado.
      </>
    ),
  },
  en: {
    title: 'Snippet: useLongPress',
    intro: (
      <>
        Hook that detects a <Text code>long press</Text> on an element, working
        with both mouse and touch. Returns a callback <Text code>ref</Text>, an{' '}
        <Text code>isPressed</Text> boolean and a{' '}
        <Text code>wasLongPress</Text> flag. Great for context menus, secondary
        actions, item deletion and mobile shortcuts.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    thresholdLabel: 'Threshold (ms)',
    demoDesc: 'Click and hold the area below. Release before the threshold to cancel.',
    statePressed: 'Pressed',
    stateLongPress: 'Long press detected!',
    stateIdle: 'Idle',
    counterTitle: 'Long presses',
    lastEvent: 'Last event',
    eventStart: 'start',
    eventEnd: 'end',
    eventCancel: 'canceled (short)',
    eventLongPress: 'long press',
    reset: 'Reset',
    note: (
      <>
        <Text code>touchstart</Text> events are registered with{' '}
        <Text code>{'{ passive: true }'}</Text> to avoid blocking scrolling.
        Cleanup removes every listener when the element is unmounted or swapped.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const [threshold, setThreshold] = useState(600)
  const [count, setCount] = useState(0)
  const [lastEvent, setLastEvent] = useState('idle')

  const [ref, isPressed, wasLongPress] = useLongPress({
    threshold,
    onPressStart: () => setLastEvent('start'),
    onLongPress: () => {
      setCount((c) => c + 1)
      setLastEvent('longPress')
    },
    onPressEnd: () => setLastEvent('end'),
    onCancel: () => setLastEvent('cancel'),
  })

  const eventLabel = {
    idle: t.stateIdle,
    start: t.eventStart,
    end: t.eventEnd,
    cancel: t.eventCancel,
    longPress: t.eventLongPress,
  }[lastEvent] || lastEvent

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12}>
          <Text strong>{t.thresholdLabel}</Text>
          <Slider
            min={200}
            max={1500}
            step={100}
            value={threshold}
            onChange={setThreshold}
            marks={{ 200: '200ms', 800: '800ms', 1500: '1500ms' }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Space size="large">
            <Statistic title={t.counterTitle} value={count} />
            <div>
              <Text type="secondary">{t.lastEvent}: </Text>
              <Tag color={lastEvent === 'longPress' ? 'green' : lastEvent === 'cancel' ? 'orange' : 'default'}>
                {eventLabel}
              </Tag>
            </div>
          </Space>
        </Col>
      </Row>

      <div
        ref={ref}
        role="button"
        tabIndex={0}
        style={{
          position: 'relative',
          padding: 32,
          borderRadius: 12,
          border: '2px solid',
          borderColor: isPressed ? '#1677ff' : '#d9d9d9',
          background: wasLongPress ? '#f6ffed' : isPressed ? '#e6f7ff' : '#fafafa',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overflow: 'hidden',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: wasLongPress ? '100%' : isPressed ? '100%' : '0%',
            background: 'rgba(22, 119, 255, 0.12)',
            transition: isPressed ? `width ${threshold}ms linear` : 'none',
            pointerEvents: 'none',
          }}
        />
        <Space direction="vertical" align="center" style={{ width: '100%', position: 'relative' }}>
          <ClockCircleOutlined style={{ fontSize: 28, color: isPressed ? '#1677ff' : '#8c8c8c' }} />
          <Text strong style={{ fontSize: 16 }}>
            {wasLongPress ? t.stateLongPress : isPressed ? t.statePressed : t.stateIdle}
          </Text>
          {wasLongPress && (
            <Tag color="success" style={{ margin: 0 }}>OK</Tag>
          )}
        </Space>
      </div>

      <Button icon={<ReloadOutlined />} onClick={() => { setCount(0); setLastEvent('idle') }}>
        {t.reset}
      </Button>

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseLongPressSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
