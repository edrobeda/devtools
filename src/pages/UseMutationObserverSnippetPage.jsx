import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Checkbox,
  Button,
  List,
  Tag,
  Alert,
  Row,
  Col,
} from 'antd'
import {
  CodeOutlined,
  PlusOutlined,
  MinusOutlined,
  BgColorsOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import useMutationObserver from '../hooks/useMutationObserver'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef, useState } from 'react'

export default function useMutationObserver(options = {}) {
  const [records, setRecords] = useState([])
  const observerRef = useRef(null)
  const nodeRef = useRef(null)
  const optionsRef = useRef(options)

  const connect = useCallback((node) => {
    if (
      typeof window === 'undefined' ||
      typeof MutationObserver === 'undefined' ||
      !node
    ) {
      return
    }

    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    observerRef.current = new MutationObserver((mutations) => {
      setRecords((prev) => [...mutations, ...prev].slice(0, 100))
    })

    observerRef.current.observe(node, optionsRef.current)
    nodeRef.current = node
  }, [])

  const ref = useCallback((node) => connect(node), [connect])

  // Atualiza as opções em tempo real e reconecta ao alvo atual.
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

  const clear = useCallback(() => setRecords([]), [])

  return [ref, records, clear]
}

// uso:
// const [ref, records, clear] = useMutationObserver({
//   childList: true,
//   attributes: true,
//   subtree: false,
// })
// return <div ref={ref}>{records.length} mutações</div>`

const translations = {
  pt: {
    title: 'Snippet: useMutationObserver',
    intro: (
      <>
        Hook que encapsula a <Text code>MutationObserver</Text> API para observar
        mudanças no DOM de um elemento React: filhos adicionados/removidos,{' '}
        <Text code>attributes</Text> alterados e mudanças de texto. Útil para
        sincronizar estado com conteúdo editável, detectar alterações externas em
        um componente ou debugar mutações. Implementação SSR-safe em{' '}
        <Text code>src/hooks/useMutationObserver.js</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração ao vivo',
    optionsTitle: 'Opções do observer',
    childList: 'childList (filhos adicionados/removidos)',
    attributes: 'attributes (atributos alterados)',
    characterData: 'characterData (texto alterado)',
    subtree: 'subtree (observar descendentes)',
    attributeOldValue: 'attributeOldValue (guardar valor anterior)',
    characterDataOldValue: 'characterDataOldValue (guardar texto anterior)',
    targetTitle: 'Elemento alvo',
    targetHint:
      'Edite o texto diretamente, adicione/remova itens ou altere atributos e veja as mutações aparecerem no histórico.',
    addItem: 'Adicionar item',
    removeItem: 'Remover último',
    toggleClass: 'Trocar cor de fundo',
    editText: 'Trocar título',
    clear: 'Limpar histórico',
    historyTitle: 'Histórico de mutações',
    historyEmpty: 'Nenhuma mutação registrada ainda.',
    type: 'Tipo',
    target: 'Alvo',
    oldValue: 'Anterior',
    time: 'Hora',
    unsupported: 'MutationObserver não está disponível neste ambiente.',
    childItemPrefix: 'Item ',
    titleText: 'Título editável',
  },
  en: {
    title: 'Snippet: useMutationObserver',
    intro: (
      <>
        A hook that wraps the <Text code>MutationObserver</Text> API to watch
        DOM changes inside a React element: added/removed children, changed{' '}
        <Text code>attributes</Text>, and text changes. Useful for syncing state
        with editable content, detecting external changes to a component, or
        debugging mutations. SSR-safe implementation in{' '}
        <Text code>src/hooks/useMutationObserver.js</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Live demo',
    optionsTitle: 'Observer options',
    childList: 'childList (added/removed children)',
    attributes: 'attributes (changed attributes)',
    characterData: 'characterData (changed text)',
    subtree: 'subtree (watch descendants)',
    attributeOldValue: 'attributeOldValue (keep previous value)',
    characterDataOldValue: 'characterDataOldValue (keep previous text)',
    targetTitle: 'Target element',
    targetHint:
      'Edit the text directly, add/remove items, change attributes, and watch mutations appear in the history.',
    addItem: 'Add item',
    removeItem: 'Remove last',
    toggleClass: 'Toggle background color',
    editText: 'Change title',
    clear: 'Clear history',
    historyTitle: 'Mutation history',
    historyEmpty: 'No mutations recorded yet.',
    type: 'Type',
    target: 'Target',
    oldValue: 'Previous',
    time: 'Time',
    unsupported: 'MutationObserver is not available in this environment.',
    childItemPrefix: 'Item ',
    titleText: 'Editable title',
  },
}

function getRecordTagColor(type) {
  switch (type) {
    case 'childList':
      return 'blue'
    case 'attributes':
      return 'purple'
    case 'characterData':
      return 'green'
    default:
      return 'default'
  }
}

function simplifyTarget(target) {
  if (!target) return '—'
  if (target.nodeType === Node.TEXT_NODE) {
    return `#text "${(target.textContent || '').slice(0, 24)}"`
  }
  const tag = target.tagName?.toLowerCase() || 'node'
  const id = target.id ? `#${target.id}` : ''
  const cls = target.className && typeof target.className === 'string'
    ? `.${target.className.split(' ')[0]}`
    : ''
  return `<${tag}${id}${cls}>`
}

function MutationDemo({ t }) {
  const [options, setOptions] = useState({
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true,
  })

  const stableOptions = useMemo(
    () => ({
      childList: options.childList,
      attributes: options.attributes,
      characterData: options.characterData,
      subtree: options.subtree,
      attributeOldValue: options.attributeOldValue,
      characterDataOldValue: options.characterDataOldValue,
    }),
    [
      options.childList,
      options.attributes,
      options.characterData,
      options.subtree,
      options.attributeOldValue,
      options.characterDataOldValue,
    ]
  )

  const targetRef = useRef(null)
  const [ref, records, clear] = useMutationObserver(stableOptions)
  const [titleIndex, setTitleIndex] = useState(0)
  const [bgIndex, setBgIndex] = useState(0)

  // Combina a ref do hook com uma ref interna para manipular o DOM na demo.
  const combinedRef = useCallback(
    (node) => {
      ref(node)
      targetRef.current = node
    },
    [ref]
  )

  const backgrounds = ['#f6ffed', '#e6fffb', '#fff0f6', '#fff7e6', '#f0f5ff']

  const handleAdd = () => {
    const node = targetRef.current
    if (!node) return
    const ul = node.querySelector('ul')
    if (!ul) return
    const li = document.createElement('li')
    li.textContent = `${t.childItemPrefix}${ul.children.length + 1}`
    ul.appendChild(li)
  }

  const handleRemove = () => {
    const node = targetRef.current
    if (!node) return
    const ul = node.querySelector('ul')
    if (!ul || ul.children.length === 0) return
    ul.removeChild(ul.lastElementChild)
  }

  const handleToggleClass = () => {
    const node = targetRef.current
    if (!node) return
    const next = (bgIndex + 1) % backgrounds.length
    setBgIndex(next)
    node.style.backgroundColor = backgrounds[next]
  }

  const handleEditText = () => {
    const node = targetRef.current
    if (!node) return
    const h4 = node.querySelector('h4')
    if (!h4) return
    const texts = [t.titleText, 'Hello world', 'MutationObserver', 'React hook']
    const next = (titleIndex + 1) % texts.length
    setTitleIndex(next)
    h4.textContent = texts[next]
  }

  if (typeof window !== 'undefined' && typeof MutationObserver === 'undefined') {
    return <Alert type="warning" showIcon message={t.unsupported} />
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert type="info" showIcon message={t.targetHint} />

      <Card size="small" title={t.optionsTitle}>
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <Checkbox
              checked={options.childList}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, childList: e.target.checked }))
              }
            >
              {t.childList}
            </Checkbox>
          </Col>
          <Col xs={24} sm={12}>
            <Checkbox
              checked={options.attributes}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, attributes: e.target.checked }))
              }
            >
              {t.attributes}
            </Checkbox>
          </Col>
          <Col xs={24} sm={12}>
            <Checkbox
              checked={options.characterData}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  characterData: e.target.checked,
                }))
              }
            >
              {t.characterData}
            </Checkbox>
          </Col>
          <Col xs={24} sm={12}>
            <Checkbox
              checked={options.subtree}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, subtree: e.target.checked }))
              }
            >
              {t.subtree}
            </Checkbox>
          </Col>
          <Col xs={24} sm={12}>
            <Checkbox
              checked={options.attributeOldValue}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  attributeOldValue: e.target.checked,
                }))
              }
            >
              {t.attributeOldValue}
            </Checkbox>
          </Col>
          <Col xs={24} sm={12}>
            <Checkbox
              checked={options.characterDataOldValue}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  characterDataOldValue: e.target.checked,
                }))
              }
            >
              {t.characterDataOldValue}
            </Checkbox>
          </Col>
        </Row>
      </Card>

      <Card size="small" title={t.targetTitle}>
        <div
          ref={combinedRef}
          style={{
            padding: 16,
            borderRadius: 8,
            border: '1px dashed #d9d9d9',
            backgroundColor: backgrounds[bgIndex],
            transition: 'background-color 200ms ease',
            minHeight: 120,
          }}
        >
          <h4
            style={{
              margin: '0 0 8px',
              fontSize: 16,
              fontWeight: 600,
              outline: 'none',
            }}
            contentEditable
            suppressContentEditableWarning
          >
            {t.titleText}
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>{`${t.childItemPrefix}1`}</li>
            <li>{`${t.childItemPrefix}2`}</li>
          </ul>
        </div>
      </Card>

      <Space wrap>
        <Button icon={<PlusOutlined />} onClick={handleAdd}>
          {t.addItem}
        </Button>
        <Button icon={<MinusOutlined />} onClick={handleRemove}>
          {t.removeItem}
        </Button>
        <Button icon={<BgColorsOutlined />} onClick={handleToggleClass}>
          {t.toggleClass}
        </Button>
        <Button icon={<EditOutlined />} onClick={handleEditText}>
          {t.editText}
        </Button>
        <Button icon={<DeleteOutlined />} onClick={clear}>
          {t.clear}
        </Button>
      </Space>

      <Card size="small" title={`${t.historyTitle} (${records.length})`}>
        {records.length === 0 ? (
          <Text type="secondary">{t.historyEmpty}</Text>
        ) : (
          <List
            size="small"
            dataSource={records}
            renderItem={(record) => (
              <List.Item>
                <Space wrap size="small" style={{ width: '100%' }}>
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                  <Tag color={getRecordTagColor(record.type)}>{record.type}</Tag>
                  <Text code style={{ fontSize: 12 }}>
                    {simplifyTarget(record.target)}
                  </Text>
                  {record.attributeName && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      attr={record.attributeName}
                    </Text>
                  )}
                  {record.oldValue !== undefined && record.oldValue !== null && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.oldValue}: "{(record.oldValue || '').slice(0, 30)}"
                    </Text>
                  )}
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
                    {new Date(record.timeStamp || Date.now()).toLocaleTimeString(undefined, {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
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

export default function UseMutationObserverSnippetPage() {
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
        <MutationDemo t={t} />
      </Card>
    </Space>
  )
}
