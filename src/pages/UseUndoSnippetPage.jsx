import React from 'react'
import { Typography, Card, Space, Button, Input, Tag } from 'antd'
import { CodeOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons'
import useUndo from '../hooks/useUndo'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useUndo(initialValue) {
  const [state, setState] = useState({
    past: [],
    present: initialValue,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const set = useCallback((value) => {
    setState((s) => {
      const nextValue = typeof value === 'function' ? value(s.present) : value
      if (nextValue === s.present) return s
      return {
        past: [...s.past, s.present],
        present: nextValue,
        future: [],
      }
    })
  }, [])

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s
      const previous = s.past[s.past.length - 1]
      return {
        past: s.past.slice(0, -1),
        present: previous,
        future: [s.present, ...s.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      return {
        past: [...s.past, s.present],
        present: next,
        future: s.future.slice(1),
      }
    })
  }, [])

  const reset = useCallback((value) => {
    setState({ past: [], present: value, future: [] })
  }, [])

  return { value: state.present, set, undo, redo, canUndo, canRedo, reset }
}`

const translations = {
  pt: {
    title: 'Snippet: useUndo',
    intro: (
      <>
        Hook que dá histórico de undo/redo a qualquer valor de estado,
        guardando pilhas de <Text code>past</Text> e <Text code>future</Text>{' '}
        em volta do valor atual (<Text code>present</Text>). Chamar{' '}
        <Text code>set(novoValor)</Text> empilha o valor anterior em{' '}
        <Text code>past</Text> e limpa <Text code>future</Text> (uma nova
        edição descarta o redo pendente, igual editores de texto de verdade);{' '}
        <Text code>undo()</Text> e <Text code>redo()</Text> movem um item
        entre as pilhas. Aceita função de atualização, igual{' '}
        <Text code>setState</Text> nativo. Já está em{' '}
        <Text code>src/hooks/useUndo.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Digite no campo — cada mudança vira um ponto no histórico. Desfaça e refaça à vontade:',
    inputPlaceholder: 'Digite algo...',
    undo: 'Desfazer',
    redo: 'Refazer',
    reset: 'Limpar histórico',
    historyLabel: 'Histórico',
  },
  en: {
    title: 'Snippet: useUndo',
    intro: (
      <>
        A hook that gives any piece of state undo/redo history, keeping{' '}
        <Text code>past</Text> and <Text code>future</Text> stacks around
        the current value (<Text code>present</Text>). Calling{' '}
        <Text code>set(newValue)</Text> pushes the previous value onto{' '}
        <Text code>past</Text> and clears <Text code>future</Text> (a new
        edit discards any pending redo, just like real text editors);{' '}
        <Text code>undo()</Text> and <Text code>redo()</Text> move one item
        between the stacks. Accepts an updater function, just like native{' '}
        <Text code>setState</Text>. It already lives in{' '}
        <Text code>src/hooks/useUndo.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Type into the field — every change becomes a point in history. Undo and redo freely:',
    inputPlaceholder: 'Type something...',
    undo: 'Undo',
    redo: 'Redo',
    reset: 'Clear history',
    historyLabel: 'History',
  },
}

function DemoUsage({ t }) {
  const { value, set, undo, redo, canUndo, canRedo, reset } = useUndo('')

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={t.inputPlaceholder}
      />
      <Space wrap>
        <Button icon={<UndoOutlined />} onClick={undo} disabled={!canUndo}>{t.undo}</Button>
        <Button icon={<RedoOutlined />} onClick={redo} disabled={!canRedo}>{t.redo}</Button>
        <Button onClick={() => reset('')} disabled={!canUndo && !canRedo}>{t.reset}</Button>
      </Space>
      <Space>
        <Text type="secondary" style={{ fontSize: 12 }}>{t.historyLabel}:</Text>
        <Tag color={canUndo ? 'blue' : 'default'}>{t.undo}: {canUndo ? '✓' : '—'}</Tag>
        <Tag color={canRedo ? 'blue' : 'default'}>{t.redo}: {canRedo ? '✓' : '—'}</Tag>
      </Space>
    </Space>
  )
}

export default function UseUndoSnippetPage() {
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
