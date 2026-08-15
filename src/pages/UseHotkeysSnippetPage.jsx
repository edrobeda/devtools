import React, { useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Tag, Input, Button, List, Alert } from 'antd'
import { CodeOutlined, ThunderboltOutlined } from '@ant-design/icons'
import useHotkeys from '../hooks/useHotkeys'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef } from 'react'

const KEY_ALIASES = {
  cmd: 'meta',
  command: 'meta',
  win: 'meta',
  option: 'alt',
  opt: 'alt',
  escape: 'escape',
  esc: 'escape',
  space: ' ',
  spacebar: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  enter: 'enter',
  return: 'enter',
  tab: 'tab',
}

function normalizeKey(key) {
  const k = key.trim().toLowerCase()
  return KEY_ALIASES[k] ?? k
}

function parseHotkey(hotkey) {
  const raw = hotkey.split('+').map((k) => normalizeKey(k))
  return {
    key: raw[raw.length - 1],
    ctrl: raw.includes('ctrl') || raw.includes('control'),
    alt: raw.includes('alt'),
    shift: raw.includes('shift'),
    meta: raw.includes('meta'),
  }
}

function eventMatches(event, combo) {
  if (normalizeKey(event.key) !== combo.key) return false
  if (event.ctrlKey !== combo.ctrl) return false
  if (event.altKey !== combo.alt) return false
  if (event.shiftKey !== combo.shift) return false
  if (event.metaKey !== combo.meta) return false
  return true
}

export default function useHotkeys(hotkeys, options = {}) {
  const { target, enabled = true } = options
  const hotkeysRef = useRef(hotkeys)

  useEffect(() => {
    hotkeysRef.current = hotkeys
  })

  useEffect(() => {
    if (!enabled) return undefined
    const element = target?.current ?? window

    function handleKeyDown(event) {
      for (const item of hotkeysRef.current) {
        const combo = parseHotkey(item.keys)
        if (eventMatches(event, combo)) {
          if (item.preventDefault !== false) event.preventDefault()
          item.callback(event)
          break
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [target, enabled])
}

// uso:
// useHotkeys([
//   { keys: 'ctrl+k', callback: () => setOpen(true) },
//   { keys: 'cmd+shift+s', callback: () => saveAll() },
//   { keys: 'esc', callback: () => setOpen(false), preventDefault: false },
// ])`

const translations = {
  pt: {
    title: 'Snippet: useHotkeys',
    intro: (
      <>
        Hook para registrar atalhos de teclado globais (ou dentro de um
        elemento) no React. Suporta combinações com <Text code>Ctrl</Text>,{' '}
        <Text code>Alt</Text>, <Text code>Shift</Text> e{' '}
        <Text code>Cmd/Meta</Text>, além de aliases como{' '}
        <Text code>cmd</Text> → <Text code>meta</Text>,{' '}
        <Text code>esc</Text> → <Text code>Escape</Text> e{' '}
        <Text code>space</Text> → espaço. Útil para menus de comando,
        modais, salvar com atalho, fechar com ESC, etc.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    hint: 'Com esta página em foco, teste os atalhos abaixo:',
    focusSearch: 'Focar busca',
    saveAll: 'Salvar tudo',
    submit: 'Enviar',
    close: 'Fechar modal',
    lastFired: 'Último atalho acionado',
    history: 'Histórico de acionamentos',
    clearHistory: 'Limpar histórico',
    emptyHistory: 'Nenhum atalho acionado ainda.',
    searchPlaceholder: 'Digite algo... (Ctrl+K para focar)',
    modalStatusOpen: 'Modal simulado: ABERTO',
    modalStatusClosed: 'Modal simulado: FECHADO',
    saveStatus: 'Estado salvo!',
    submitStatus: 'Enviado!',
    aliasNote: 'Use "cmd" ou "ctrl" no mesmo atalho — o hook normaliza ambos para as teclas reais do sistema.',
  },
  en: {
    title: 'Snippet: useHotkeys',
    intro: (
      <>
        A hook for registering global (or scoped) keyboard shortcuts in React.
        Supports combinations with <Text code>Ctrl</Text>,{' '}
        <Text code>Alt</Text>, <Text code>Shift</Text> and{' '}
        <Text code>Cmd/Meta</Text>, plus aliases such as{' '}
        <Text code>cmd</Text> → <Text code>meta</Text>,{' '}
        <Text code>esc</Text> → <Text code>Escape</Text> and{' '}
        <Text code>space</Text> → space. Great for command menus, modals,
        keyboard save, ESC to close, etc.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    hint: 'With this page focused, try the shortcuts below:',
    focusSearch: 'Focus search',
    saveAll: 'Save all',
    submit: 'Submit',
    close: 'Close modal',
    lastFired: 'Last fired shortcut',
    history: 'Fired shortcuts history',
    clearHistory: 'Clear history',
    emptyHistory: 'No shortcut fired yet.',
    searchPlaceholder: 'Type something... (Ctrl+K to focus)',
    modalStatusOpen: 'Simulated modal: OPEN',
    modalStatusClosed: 'Simulated modal: CLOSED',
    saveStatus: 'State saved!',
    submitStatus: 'Submitted!',
    aliasNote: 'Use "cmd" or "ctrl" in the same shortcut — the hook normalizes both to the real system keys.',
  },
}

function formatCombo(keys) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  return keys
    .split('+')
    .map((k) => {
      const lowered = k.trim().toLowerCase()
      if (lowered === 'meta') return isMac ? '⌘' : 'Win'
      if (lowered === 'alt') return isMac ? '⌥' : 'Alt'
      if (lowered === 'ctrl') return isMac ? '⌃' : 'Ctrl'
      if (lowered === 'shift') return isMac ? '⇧' : 'Shift'
      if (lowered === 'esc' || lowered === 'escape') return 'Esc'
      if (lowered === 'enter') return '↵'
      if (lowered === 'k') return 'K'
      if (lowered === 's') return 'S'
      return k.trim()
    })
    .join(isMac ? '' : ' + ')
}

function ShortcutTag({ keys }) {
  return (
    <Tag
      color="processing"
      style={{ fontFamily: 'monospace', fontSize: 13, padding: '2px 8px' }}
    >
      {formatCombo(keys)}
    </Tag>
  )
}

function DemoUsage({ t }) {
  const searchRef = useRef(null)
  const [lastFired, setLastFired] = useState(null)
  const [history, setHistory] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [savePulse, setSavePulse] = useState(false)
  const [submitPulse, setSubmitPulse] = useState(false)

  const addHistory = (label) => {
    const entry = { label, time: new Date().toLocaleTimeString() }
    setLastFired(entry)
    setHistory((prev) => [entry, ...prev].slice(0, 20))
  }

  const hotkeys = useMemo(
    () => [
      {
        keys: 'ctrl+k',
        callback: () => {
          addHistory(t.focusSearch)
          searchRef.current?.focus()
        },
      },
      {
        keys: 'cmd+shift+s',
        callback: () => {
          addHistory(t.saveAll)
          setSavePulse(true)
          setTimeout(() => setSavePulse(false), 600)
        },
      },
      {
        keys: 'ctrl+enter',
        callback: () => {
          addHistory(t.submit)
          setSubmitPulse(true)
          setTimeout(() => setSubmitPulse(false), 600)
        },
      },
      {
        keys: 'esc',
        callback: () => {
          if (modalOpen) {
            addHistory(t.close)
            setModalOpen(false)
            searchRef.current?.blur()
          }
        },
        preventDefault: false,
      },
    ],
    [t, modalOpen]
  )

  useHotkeys(hotkeys)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert message={t.aliasNote} type="info" showIcon />

      <Text type="secondary">{t.hint}</Text>
      <Space wrap size="middle">
        <Card size="small" bodyStyle={{ padding: 12 }}>
          <Space>
            <ShortcutTag keys="ctrl+k" />
            <Text>{t.focusSearch}</Text>
          </Space>
        </Card>
        <Card size="small" bodyStyle={{ padding: 12 }}>
          <Space>
            <ShortcutTag keys="cmd+shift+s" />
            <Text>{t.saveAll}</Text>
          </Space>
        </Card>
        <Card size="small" bodyStyle={{ padding: 12 }}>
          <Space>
            <ShortcutTag keys="ctrl+enter" />
            <Text>{t.submit}</Text>
          </Space>
        </Card>
        <Card size="small" bodyStyle={{ padding: 12 }}>
          <Space>
            <ShortcutTag keys="esc" />
            <Text>{t.close}</Text>
          </Space>
        </Card>
      </Space>

      <Space wrap>
        <Input
          ref={searchRef}
          placeholder={t.searchPlaceholder}
          style={{ width: 320 }}
        />
        <Button onClick={() => setModalOpen((v) => !v)}>
          {modalOpen ? t.modalStatusOpen : t.modalStatusClosed}
        </Button>
        <Tag color={savePulse ? 'success' : 'default'} icon={<ThunderboltOutlined />}>
          {savePulse ? t.saveStatus : '—'}
        </Tag>
        <Tag color={submitPulse ? 'success' : 'default'} icon={<ThunderboltOutlined />}>
          {submitPulse ? t.submitStatus : '—'}
        </Tag>
      </Space>

      <Card size="small" title={t.lastFired}>
        {lastFired ? (
          <Space>
            <Text strong>{lastFired.label}</Text>
            <Text type="secondary">@ {lastFired.time}</Text>
          </Space>
        ) : (
          <Text type="secondary">{t.emptyHistory}</Text>
        )}
      </Card>

      <Card
        size="small"
        title={t.history}
        extra={
          <Button size="small" onClick={() => { setHistory([]); setLastFired(null) }}>
            {t.clearHistory}
          </Button>
        }
      >
        {history.length === 0 ? (
          <Text type="secondary">{t.emptyHistory}</Text>
        ) : (
          <List
            size="small"
            dataSource={history}
            renderItem={(item) => (
              <List.Item>
                <Text strong>{item.label}</Text>
                <Text type="secondary" style={{ marginLeft: 12 }}>
                  @ {item.time}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  )
}

export default function UseHotkeysSnippetPage() {
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
