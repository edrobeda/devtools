import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography, Card, Space, Switch, Button, List, Tag, Alert, Collapse, Input, Row, Col, message,
} from 'antd'
import { KeyOutlined, CopyOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  getLocationLabel, escapeKey, buildEventSnippet, formatEvent, keyDisplayName,
} from '../utils/keyboardEventTester'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const MODIFIERS = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey']

const MODIFIER_LABELS = {
  pt: { ctrlKey: 'Ctrl', altKey: 'Alt', shiftKey: 'Shift', metaKey: 'Meta / Cmd' },
  en: { ctrlKey: 'Ctrl', altKey: 'Alt', shiftKey: 'Shift', metaKey: 'Meta / Cmd' },
}

const translations = {
  pt: {
    title: 'Testador de Eventos de Teclado',
    intro: (
      <>
        Pressione qualquer tecla e veja os valores do evento{' '}
        <Text code>KeyboardEvent</Text> em tempo real: <Text code>key</Text>,{' '}
        <Text code>code</Text>, <Text code>keyCode</Text>/<Text code>which</Text>,{' '}
        localização e modificadores. Útil para depurar atalhos e inputs.
      </>
    ),
    tipTitle: 'Diferença entre key e code',
    tipBody: (
      <>
        <Text code>event.key</Text> representa o caractere gerado (ex.: <Text code>a</Text>,{' '}
        <Text code>A</Text>, <Text code>Enter</Text>), enquanto <Text code>event.code</Text>{' '}
        representa a posição física da tecla no teclado (ex.: <Text code>KeyA</Text>,{' '}
        <Text code>Enter</Text>, <Text code>Digit1</Text>). Use <Text code>code</Text> para
        atalhos que não mudam de layout (QWERTY vs AZERTY) e <Text code>key</Text> para ler o
        texto digitado.
      </>
    ),
    preventDefault: 'Chamar event.preventDefault()',
    preventDefaultWarn: 'Com esta opção ligada, atalhos do navegador (como F5 ou Ctrl+R) serão bloqueados enquanto a página estiver focada.',
    clearHistory: 'Limpar histórico',
    history: 'Histórico',
    emptyHistory: 'Nenhuma tecla pressionada ainda. Clique na área abaixo e use o teclado.',
    snippetTitle: 'Snippet de handler',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    fieldPlaceholder: 'Digite aqui para testar dentro de um campo de input...',
    liveAreaLabel: 'Área de captura ativa',
    liveAreaHint: 'A área de captura está ativa. Pressione qualquer tecla.',
    currentEvent: 'Evento atual',
    key: 'key',
    code: 'code',
    keyCode: 'keyCode',
    which: 'which',
    location: 'location',
    repeat: 'repeat',
    composed: 'composed',
    modifiers: 'Modificadores',
    sourceTitle: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/keyboardEventTester.js. getLocationLabel traduz a localização da tecla, escapeKey escapa caracteres especiais para o snippet e buildEventSnippet monta um listener de keydown de exemplo.',
    yes: 'sim',
    no: 'não',
  },
  en: {
    title: 'Keyboard Event Tester',
    intro: (
      <>
        Press any key and see the <Text code>KeyboardEvent</Text> values in real time:{" "}
        <Text code>key</Text>, <Text code>code</Text>, <Text code>keyCode</Text>/{" "}
        <Text code>which</Text>, location and modifiers. Useful for debugging shortcuts and
        inputs.
      </>
    ),
    tipTitle: 'key vs code',
    tipBody: (
      <>
        <Text code>event.key</Text> is the generated character (e.g. <Text code>a</Text>,{" "}
        <Text code>A</Text>, <Text code>Enter</Text>), while         <Text code>event.code</Text> is
        the physical key position on the keyboard (e.g. <Text code>KeyA</Text>,{" "}
        <Text code>Enter</Text>, <Text code>Digit1</Text>). Use <Text code>code</Text> for
        shortcuts that should not change with keyboard layout (QWERTY vs AZERTY) and{" "}
        <Text code>key</Text> to read typed text.
      </>
    ),
    preventDefault: 'Call event.preventDefault()',
    preventDefaultWarn: 'When enabled, browser shortcuts (like F5 or Ctrl+R) will be blocked while this page is focused.',
    clearHistory: 'Clear history',
    history: 'History',
    emptyHistory: 'No key pressed yet. Click the area below and use your keyboard.',
    snippetTitle: 'Handler snippet',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    fieldPlaceholder: 'Type here to test inside an input field...',
    liveAreaLabel: 'Active capture area',
    liveAreaHint: 'The capture area is active. Press any key.',
    currentEvent: 'Current event',
    key: 'key',
    code: 'code',
    keyCode: 'keyCode',
    which: 'which',
    location: 'location',
    repeat: 'repeat',
    composed: 'composed',
    modifiers: 'Modifiers',
    sourceTitle: 'Source code',
    sourceBody:
      'The core lives in src/utils/keyboardEventTester.js. getLocationLabel translates the key location, escapeKey escapes special characters for the snippet and buildEventSnippet builds a sample keydown listener.',
    yes: 'yes',
    no: 'no',
  },
}

export default function KeyboardEventTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [preventDefault, setPreventDefault] = useState(false)
  const [focused, setFocused] = useState(false)
  const preventDefaultRef = useRef(preventDefault)
  preventDefaultRef.current = preventDefault

  const handleKeyDown = useCallback((event) => {
    if (preventDefaultRef.current) {
      event.preventDefault()
    }
    const formatted = formatEvent(event)
    setCurrent(formatted)
    setHistory((prev) => [formatted, ...prev].slice(0, 20))
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrent(null)
  }, [])

  const snippet = useMemo(() => buildEventSnippet(current), [current])

  const copySnippet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [snippet, messageApi, t])

  const boolTag = (value) => (
    <Tag color={value ? 'blue' : 'default'}>{value ? t.yes : t.no}</Tag>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Card
        title={t.liveAreaLabel}
        extra={focused ? <Tag color="green">{t.liveAreaHint}</Tag> : <Tag>{t.liveAreaLabel}</Tag>}
        bodyStyle={{ padding: 0 }}
      >
        <div
          role="button"
          tabIndex={0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: focused ? '#e6f7ff' : '#fafafa',
            borderRadius: 8,
            cursor: 'pointer',
            outline: 'none',
            transition: 'background 0.2s',
          }}
        >
          <Text style={{ fontSize: 18, display: 'block', marginBottom: 16 }}>
            {current ? keyDisplayName(current.key) : '—'}
          </Text>
          <Text type="secondary">
            {current ? `${current.code}` : lang === 'pt' ? 'Pressione uma tecla' : 'Press a key'}
          </Text>
        </div>
      </Card>

      <Card title={t.currentEvent}>
        {current ? (
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <Card size="small">
                <Text type="secondary">{t.key}</Text>
                <div style={{ fontSize: 18, fontFamily: 'monospace' }}>
                  <Text code strong>{keyDisplayName(current.key)}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={8}>
              <Card size="small">
                <Text type="secondary">{t.code}</Text>
                <div style={{ fontSize: 18, fontFamily: 'monospace' }}>
                  <Text code strong>{current.code}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={8}>
              <Card size="small">
                <Text type="secondary">{t.location}</Text>
                <div style={{ fontSize: 16 }}>{getLocationLabel(current.location, lang)}</div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Text type="secondary">{t.keyCode}</Text>
                <div style={{ fontSize: 16, fontFamily: 'monospace' }}>{current.keyCode}</div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Text type="secondary">{t.which}</Text>
                <div style={{ fontSize: 16, fontFamily: 'monospace' }}>{current.which}</div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Text type="secondary">{t.repeat}</Text>
                <div>{boolTag(current.repeat)}</div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Text type="secondary">{t.composed}</Text>
                <div>{boolTag(current.composed)}</div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Text type="secondary">{t.emptyHistory}</Text>
        )}

        <div style={{ marginTop: 16 }}>
          <Text strong>{t.modifiers}</Text>
          <Space style={{ marginTop: 8 }} wrap>
            {MODIFIERS.map((m) => (
              <Tag key={m} color={current?.[m] ? 'processing' : 'default'}>
                {MODIFIER_LABELS[lang][m]}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Switch checked={preventDefault} onChange={setPreventDefault} />
              <Text>{t.preventDefault}</Text>
            </Space>
            <Button icon={<DeleteOutlined />} onClick={clearHistory}>{t.clearHistory}</Button>
          </Space>
          {preventDefault && <Alert type="warning" showIcon message={t.preventDefaultWarn} />}
          <Input placeholder={t.fieldPlaceholder} />
        </Space>
      </Card>

      <Card
        title={t.history}
        extra={<Text type="secondary">{history.length}</Text>}
      >
        {history.length === 0 ? (
          <Text type="secondary">{t.emptyHistory}</Text>
        ) : (
          <List
            size="small"
            dataSource={history}
            renderItem={(item) => (
              <List.Item>
                <Space wrap>
                  <Text code strong>{keyDisplayName(item.key)}</Text>
                  <Text type="secondary" code>{item.code}</Text>
                  <Tag color="blue">{getLocationLabel(item.location, lang)}</Tag>
                  {MODIFIERS.filter((m) => item[m]).map((m) => (
                    <Tag key={m} size="small">{MODIFIER_LABELS[lang][m]}</Tag>
                  ))}
                  {item.repeat && <Tag size="small" color="orange">repeat</Tag>}
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card
        title={t.snippetTitle}
        extra={(
          <Button size="small" icon={<CopyOutlined />} onClick={copySnippet} disabled={!current}>
            {t.copy}
          </Button>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 240 }}>
          <code>{snippet || (lang === 'pt' ? '// pressione uma tecla para gerar o snippet' : '// press a key to generate the snippet')}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceTitle} — keyboardEventTester.js`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{`${getLocationLabel.toString()}\n\n${escapeKey.toString()}\n\n${buildEventSnippet.toString()}\n\n${formatEvent.toString()}\n\n${keyDisplayName.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
