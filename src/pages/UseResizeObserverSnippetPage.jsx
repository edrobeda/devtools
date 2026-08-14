import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Select,
  Button,
  List,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  CodeOutlined,
  DeleteOutlined,
  ColumnWidthOutlined,
  ColumnHeightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import useResizeObserver from '../hooks/useResizeObserver'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef, useState } from 'react'

export default function useResizeObserver(options = {}, onResize) {
  const [entry, setEntry] = useState(null)
  const observerRef = useRef(null)
  const nodeRef = useRef(null)
  const optionsRef = useRef(options)
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  const connect = useCallback((node) => {
    if (
      typeof window === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      !node
    ) {
      return
    }

    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    observerRef.current = new ResizeObserver((entries) => {
      const last = entries[entries.length - 1] || null
      setEntry(last)
      if (typeof onResizeRef.current === 'function') {
        onResizeRef.current(entries)
      }
    })

    observerRef.current.observe(node, optionsRef.current)
    nodeRef.current = node
  }, [])

  const ref = useCallback((node) => connect(node), [connect])

  useEffect(() => {
    optionsRef.current = options
    if (nodeRef.current) connect(nodeRef.current)
  }, [JSON.stringify(options), connect])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [])

  return [ref, entry]
}

// uso:
// const [ref, entry] = useResizeObserver({ box: 'content-box' })
// return (
//   <div ref={ref}>
//     {entry?.contentRect?.width.toFixed(0)} x {entry?.contentRect?.height.toFixed(0)}
//   </div>
// )`

const translations = {
  pt: {
    title: 'Snippet: useResizeObserver',
    intro: (
      <>
        Hook que encapsula a <Text code>ResizeObserver</Text> API para observar
        mudanças de tamanho de um elemento React em tempo real. Retorna uma
        callback ref e o último <Text code>ResizeObserverEntry</Text> capturado,
        incluindo dimensões de content-box, border-box ou device-pixel. Útil
        para layouts responsivos baseados no container, redimensionar canvas,
        gráficos e qualquer componente que precise reagir ao próprio tamanho.
        Implementação SSR-safe em{' '}
        <Text code>src/hooks/useResizeObserver.js</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração ao vivo',
    optionsTitle: 'Opções do observer',
    boxLabel: 'Box observado',
    boxContent: 'content-box',
    boxBorder: 'border-box',
    boxDevice: 'device-pixel-content-box',
    targetTitle: 'Elemento alvo',
    targetHint:
      'Arraste o canto inferior direito da caixa para redimensioná-la e veja as dimensões atualizarem instantaneamente.',
    currentTitle: 'Dimensões atuais',
    width: 'Largura',
    height: 'Altura',
    top: 'Top',
    left: 'Left',
    x: 'X',
    y: 'Y',
    historyTitle: 'Histórico de redimensionamentos',
    historyEmpty: 'Nenhuma mudança de tamanho registrada ainda.',
    clear: 'Limpar histórico',
    unsupported: 'ResizeObserver não está disponível neste ambiente.',
    borderBox: 'borderBox',
    contentBox: 'contentBox',
  },
  en: {
    title: 'Snippet: useResizeObserver',
    intro: (
      <>
        A hook that wraps the <Text code>ResizeObserver</Text> API to watch
        size changes of a React element in real time. It returns a callback ref
        and the latest <Text code>ResizeObserverEntry</Text>, including
        content-box, border-box or device-pixel dimensions. Useful for
        container-based responsive layouts, resizing canvas, charts and any
        component that needs to react to its own size. SSR-safe implementation
        in <Text code>src/hooks/useResizeObserver.js</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Live demo',
    optionsTitle: 'Observer options',
    boxLabel: 'Observed box',
    boxContent: 'content-box',
    boxBorder: 'border-box',
    boxDevice: 'device-pixel-content-box',
    targetTitle: 'Target element',
    targetHint:
      'Drag the bottom-right corner of the box to resize it and watch the dimensions update instantly.',
    currentTitle: 'Current dimensions',
    width: 'Width',
    height: 'Height',
    top: 'Top',
    left: 'Left',
    x: 'X',
    y: 'Y',
    historyTitle: 'Resize history',
    historyEmpty: 'No size changes recorded yet.',
    clear: 'Clear history',
    unsupported: 'ResizeObserver is not available in this environment.',
    borderBox: 'borderBox',
    contentBox: 'contentBox',
  },
}

function readDimensions(entry, box, t) {
  if (!entry) return null

  const rect = entry.contentRect || entry.target.getBoundingClientRect()
  let width = rect.width
  let height = rect.height

  if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
    if (box === 'border-box') {
      const size = entry.borderBoxSize[0]
      width = size.inlineSize
      height = size.blockSize
    } else if (entry.contentBoxSize && entry.contentBoxSize.length > 0) {
      const size = entry.contentBoxSize[0]
      width = size.inlineSize
      height = size.blockSize
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    x: Math.round(rect.x ?? rect.left),
    y: Math.round(rect.y ?? rect.top),
  }
}

function ResizeDemo({ t }) {
  const [box, setBox] = useState('content-box')
  const [history, setHistory] = useState([])

  const stableOptions = useMemo(() => ({ box }), [box])

  const targetRef = useRef(null)

  const handleResize = useCallback((entries) => {
    const last = entries[entries.length - 1]
    if (!last) return
    const dims = readDimensions(last, last.target?.dataset?.box || 'content-box', t)
    setHistory((prev) =>
      [
        {
          id: Date.now() + Math.random(),
          time: Date.now(),
          ...dims,
        },
        ...prev,
      ].slice(0, 50)
    )
  }, [t])

  const [ref, entry] = useResizeObserver(stableOptions, handleResize)

  const combinedRef = useCallback(
    (node) => {
      ref(node)
      targetRef.current = node
      if (node) node.dataset.box = box
    },
    [ref, box]
  )

  const dims = readDimensions(entry, box, t)

  if (typeof window !== 'undefined' && typeof ResizeObserver === 'undefined') {
    return <Alert type="warning" showIcon message={t.unsupported} />
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert type="info" showIcon message={t.targetHint} />

      <Card size="small" title={t.optionsTitle}>
        <Row gutter={[16, 8]} align="middle">
          <Col xs={24} sm={12}>
            <Text strong style={{ marginRight: 8 }}>{t.boxLabel}:</Text>
            <Select
              value={box}
              onChange={setBox}
              style={{ minWidth: 220 }}
              options={[
                { value: 'content-box', label: t.boxContent },
                { value: 'border-box', label: t.boxBorder },
                { value: 'device-pixel-content-box', label: t.boxDevice },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card size="small" title={t.targetTitle}>
        <div
          ref={combinedRef}
          style={{
            width: 280,
            height: 160,
            minWidth: 120,
            minHeight: 80,
            maxWidth: '100%',
            resize: 'both',
            overflow: 'auto',
            borderRadius: 8,
            border: '2px dashed #1677ff',
            backgroundColor: '#e6f4ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text type="secondary" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {dims ? `${dims.width} × ${dims.height}` : '...'}
          </Text>
        </div>
      </Card>

      <Card size="small" title={t.currentTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.width}
              value={dims?.width ?? 0}
              prefix={<ColumnWidthOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title={t.height}
              value={dims?.height ?? 0}
              prefix={<ColumnHeightOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.top} value={dims?.top ?? 0} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.left} value={dims?.left ?? 0} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.x} value={dims?.x ?? 0} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic title={t.y} value={dims?.y ?? 0} />
          </Col>
        </Row>
      </Card>

      <Button icon={<DeleteOutlined />} onClick={() => setHistory([])}>
        {t.clear}
      </Button>

      <Card size="small" title={`${t.historyTitle} (${history.length})`}>
        {history.length === 0 ? (
          <Text type="secondary">{t.historyEmpty}</Text>
        ) : (
          <List
            size="small"
            dataSource={history}
            renderItem={(item) => (
              <List.Item>
                <Space wrap size="small" style={{ width: '100%' }}>
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                  <Tag color="blue">{item.width} × {item.height}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t.x}: {item.x}, {t.y}: {item.y}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
                    {new Date(item.time).toLocaleTimeString(undefined, {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3,
                    })}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  )
}

export default function UseResizeObserverSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

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

      <Card title={t.demoTitle}>
        <ResizeDemo t={t} />
      </Card>
    </Space>
  )
}
