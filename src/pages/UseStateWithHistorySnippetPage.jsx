import React, { useState } from 'react'
import {
  Typography, Card, Space, Button, Input, Slider, List, Tag, Switch, InputNumber,
} from 'antd'
import {
  CodeOutlined, UndoOutlined, RedoOutlined, HistoryOutlined, DeleteOutlined,
  StepBackwardOutlined, StepForwardOutlined,
} from '@ant-design/icons'
import useStateWithHistory from '../hooks/useStateWithHistory'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useRef, useState } from 'react'

const defaultCapacity = 50

function isEqual(a, b) {
  return Object.is(a, b)
}

export default function useStateWithHistory(initialValue, options = {}) {
  const { capacity = defaultCapacity, compare = isEqual } = options

  const [state, setState] = useState({
    history: [initialValue],
    pointer: 0,
  })

  const capacityRef = useRef(capacity)
  capacityRef.current = capacity

  const compareRef = useRef(compare)
  compareRef.current = compare

  const value = state.history[state.pointer]

  const set = useCallback((next, options = {}) => {
    const { overwrite = false, silent = false } = options
    setState((current) => {
      const resolved = typeof next === 'function'
        ? next(current.history[current.pointer])
        : next

      if (!silent && compareRef.current(current.history[current.pointer], resolved)) {
        return current
      }

      let nextHistory
      if (overwrite) {
        nextHistory = [...current.history.slice(0, current.pointer), resolved]
      } else {
        nextHistory = [...current.history.slice(0, current.pointer + 1), resolved]
      }

      if (capacityRef.current > 0 && nextHistory.length > capacityRef.current) {
        const overflow = nextHistory.length - capacityRef.current
        nextHistory = nextHistory.slice(overflow)
      }

      const nextPointer = nextHistory.length - 1
      return { history: nextHistory, pointer: nextPointer }
    })
  }, [])

  const go = useCallback((index) => {
    setState((current) => {
      const target = Math.min(Math.max(index, 0), current.history.length - 1)
      if (target === current.pointer) return current
      return { ...current, pointer: target }
    })
  }, [])

  const back = useCallback((steps = 1) => {
    setState((current) => {
      const target = Math.max(current.pointer - steps, 0)
      if (target === current.pointer) return current
      return { ...current, pointer: target }
    })
  }, [])

  const forward = useCallback((steps = 1) => {
    setState((current) => {
      const target = Math.min(current.pointer + steps, current.history.length - 1)
      if (target === current.pointer) return current
      return { ...current, pointer: target }
    })
  }, [])

  const undo = useCallback(() => back(1), [back])
  const redo = useCallback(() => forward(1), [forward])

  const reset = useCallback((newInitialValue, options = {}) => {
    const { keepHistory = false } = options
    if (keepHistory) {
      setState((current) => ({
        history: [...current.history.slice(0, current.pointer + 1), newInitialValue],
        pointer: current.pointer + 1,
      }))
    } else {
      setState({ history: [newInitialValue], pointer: 0 })
    }
  }, [])

  const clearHistory = useCallback((newValue) => {
    const nextValue = newValue !== undefined ? newValue : value
    setState({ history: [nextValue], pointer: 0 })
  }, [value])

  return {
    value,
    set,
    history: state.history,
    pointer: state.pointer,
    canUndo: state.pointer > 0,
    canRedo: state.pointer < state.history.length - 1,
    go,
    back,
    forward,
    undo,
    redo,
    reset,
    clearHistory,
  }
}`

const translations = {
  pt: {
    title: 'Snippet: useStateWithHistory',
    intro: (
      <>
        Hook que estende o <Text code>useState</Text> com um histórico navegável
        completo. Além de <Text code>value</Text> e <Text code>set</Text>, expõe{' '}
        <Text code>history</Text>, <Text code>pointer</Text>,{' '}
        <Text code>undo()</Text>, <Text code>redo()</Text>, <Text code>go(index)</Text>,
        {' '}<Text code>back(steps)</Text>, <Text code>forward(steps)</Text>,{' '}
        <Text code>reset()</Text> e <Text code>clearHistory()</Text>. Suporta
        capacidade máxima, função de comparação customizada e atualização por função,
        igual ao <Text code>setState</Text> nativo. Já está em{' '}
        <Text code>src/hooks/useStateWithHistory.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Edite o texto — cada mudança vira um novo ponto no histórico. Use os controles para navegar por qualquer estado anterior:',
    inputPlaceholder: 'Digite algo para criar histórico...',
    undo: 'Desfazer',
    redo: 'Refazer',
    reset: 'Resetar',
    clear: 'Limpar histórico',
    historyTitle: 'Pilha de estados',
    position: 'Posição',
    capacity: 'Capacidade máxima',
    overwrite: 'Modo overwrite',
    current: 'atual',
    emptyHistory: 'Nenhum histórico ainda',
  },
  en: {
    title: 'Snippet: useStateWithHistory',
    intro: (
      <>
        A hook that extends <Text code>useState</Text> with a full navigable
        history. Besides <Text code>value</Text> and <Text code>set</Text>, it
        exposes <Text code>history</Text>, <Text code>pointer</Text>,{' '}
        <Text code>undo()</Text>, <Text code>redo()</Text>, <Text code>go(index)</Text>,
        {' '}<Text code>back(steps)</Text>, <Text code>forward(steps)</Text>,{' '}
        <Text code>reset()</Text> and <Text code>clearHistory()</Text>. Supports
        max capacity, custom compare function and updater functions just like native
        {' '}<Text code>setState</Text>. It already lives in{' '}
        <Text code>src/hooks/useStateWithHistory.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Edit the text — every change becomes a new point in history. Use the controls to navigate to any previous state:',
    inputPlaceholder: 'Type something to build history...',
    undo: 'Undo',
    redo: 'Redo',
    reset: 'Reset',
    clear: 'Clear history',
    historyTitle: 'State stack',
    position: 'Position',
    capacity: 'Max capacity',
    overwrite: 'Overwrite mode',
    current: 'current',
    emptyHistory: 'No history yet',
  },
}

function DemoUsage({ t }) {
  const [capacity, setCapacity] = useState(10)
  const [overwrite, setOverwrite] = useState(false)
  const {
    value, set, history, pointer, canUndo, canRedo, undo, redo, go, back, forward, reset, clearHistory,
  } = useStateWithHistory('', { capacity })

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Input.TextArea
        rows={3}
        value={value}
        onChange={(e) => set(e.target.value, { overwrite })}
        placeholder={t.inputPlaceholder}
      />

      <Space wrap>
        <Button icon={<UndoOutlined />} onClick={undo} disabled={!canUndo}>{t.undo}</Button>
        <Button icon={<RedoOutlined />} onClick={redo} disabled={!canRedo}>{t.redo}</Button>
        <Button icon={<StepBackwardOutlined />} onClick={() => back(3)} disabled={pointer < 3}>−3</Button>
        <Button icon={<StepForwardOutlined />} onClick={() => forward(3)} disabled={pointer > history.length - 4}>+3</Button>
        <Button onClick={() => reset('', { keepHistory: false })}>{t.reset}</Button>
        <Button icon={<DeleteOutlined />} onClick={() => clearHistory('')} danger>{t.clear}</Button>
      </Space>

      <Space wrap align="center">
        <Text>{t.position}:</Text>
        <Slider
          min={0}
          max={history.length - 1}
          value={pointer}
          onChange={go}
          style={{ minWidth: 200 }}
          disabled={history.length <= 1}
        />
        <Tag color="blue">{pointer + 1} / {history.length}</Tag>
      </Space>

      <Space wrap>
        <Text>{t.capacity}:</Text>
        <InputNumber min={1} max={50} value={capacity} onChange={(v) => setCapacity(v ?? 10)} />
        <Switch checked={overwrite} onChange={setOverwrite} checkedChildren={t.overwrite} unCheckedChildren={t.overwrite} />
      </Space>

      <Card size="small" title={<><HistoryOutlined /> {t.historyTitle}</>}>
        {history.length === 0 ? (
          <Text type="secondary">{t.emptyHistory}</Text>
        ) : (
          <List
            size="small"
            dataSource={history}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: index === pointer ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                }}
                onClick={() => go(index)}
                actions={[
                  index === pointer ? <Tag color="blue" key="current">{t.current}</Tag> : null,
                ]}
              >
                <Text code style={{ fontFamily: 'monospace' }}>
                  {index}: {item === '' ? '（empty）' : item.length > 60 ? item.slice(0, 60) + '…' : item}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  )
}

export default function UseStateWithHistorySnippetPage() {
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
