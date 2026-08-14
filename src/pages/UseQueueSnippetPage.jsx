import React, { useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Alert,
  Tag,
  Empty,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  CodeOutlined,
  PlusOutlined,
  MinusOutlined,
  ClearOutlined,
  RedoOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import useQueue from '../hooks/useQueue'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useState } from 'react'

export default function useQueue(initialValue = []) {
  const [queue, setQueue] = useState(() => Array.from(initialValue))

  const enqueue = useCallback((value) => {
    setQueue((prev) => [...prev, value])
  }, [])

  const dequeue = useCallback(() => {
    let removed
    setQueue((prev) => {
      if (prev.length === 0) return prev
      removed = prev[0]
      return prev.slice(1)
    })
    return removed
  }, [])

  const peek = useCallback(() => queue[0], [queue])

  const clear = useCallback(() => {
    setQueue((prev) => (prev.length === 0 ? prev : []))
  }, [])

  const reset = useCallback(() => {
    setQueue(Array.from(initialValue))
  }, [initialValue])

  return {
    queue,           // array atual (readonly)
    size: queue.length,
    isEmpty: queue.length === 0,
    first: queue[0],
    last: queue[queue.length - 1],
    enqueue,
    dequeue,
    peek,
    clear,
    reset,
  }
}

// uso:
// const { queue, enqueue, dequeue, peek, size, isEmpty, clear, reset } = useQueue(['a', 'b'])
// enqueue('c')   // ['a', 'b', 'c']
// dequeue()      // remove 'a' -> ['b', 'c']
// peek()         // 'b'`

const INITIAL_TASKS = {
  pt: ['Validar e-mail', 'Gerar relatório'],
  en: ['Validate e-mail', 'Generate report'],
}

const translations = {
  pt: {
    title: 'Snippet: useQueue',
    intro: (
      <>
        Hook utilitário que encapsula uma fila (FIFO —{' '}
        <em>First In, First Out</em>) como estado React. Útil para processar
        tarefas na ordem de chegada, animações enfileiradas, jobs de upload,
        notificações sequenciais etc. A API expõe{' '}
        <Text code>enqueue</Text>, <Text code>dequeue</Text>,{' '}
        <Text code>peek</Text>, <Text code>clear</Text>,{' '}
        <Text code>reset</Text> e leituras auxiliares como{' '}
        <Text code>first</Text>, <Text code>last</Text>,{' '}
        <Text code>size</Text> e <Text code>isEmpty</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Simule uma fila de processamento. Itens entram no fim e saem pela frente:',
    inputPlaceholder: 'Nova tarefa...',
    enqueue: 'Enfileirar',
    dequeue: 'Desenfileirar',
    clear: 'Limpar',
    reset: 'Reset',
    front: 'Frente',
    back: 'Fundo',
    emptyTitle: 'Fila vazia',
    emptyDesc: 'Adicione uma tarefa para começar.',
    stats: {
      size: 'Tamanho',
      first: 'Frente',
      last: 'Fundo',
      isEmpty: 'Vazia',
    },
    note: (
      <>
        <Text code>dequeue</Text> sempre remove o elemento mais antigo (índice 0)
        e devolve o valor removido, enquanto <Text code>peek</Text> só consulta
        sem alterar o estado. O hook preserva a referência do array quando a fila
        não muda.
      </>
    ),
  },
  en: {
    title: 'Snippet: useQueue',
    intro: (
      <>
        A utility hook that wraps a FIFO (First In, First Out) queue as React
        state. Handy for processing tasks in arrival order, queued animations,
        upload jobs, sequential notifications, etc. The API exposes{' '}
        <Text code>enqueue</Text>, <Text code>dequeue</Text>,{' '}
        <Text code>peek</Text>, <Text code>clear</Text>,{' '}
        <Text code>reset</Text> and helper reads like{' '}
        <Text code>first</Text>, <Text code>last</Text>,{' '}
        <Text code>size</Text> and <Text code>isEmpty</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Simulate a processing queue. Items enter at the back and leave from the front:',
    inputPlaceholder: 'New task...',
    enqueue: 'Enqueue',
    dequeue: 'Dequeue',
    clear: 'Clear',
    reset: 'Reset',
    front: 'Front',
    back: 'Back',
    emptyTitle: 'Queue is empty',
    emptyDesc: 'Add a task to get started.',
    stats: {
      size: 'Size',
      first: 'Front',
      last: 'Back',
      isEmpty: 'Empty',
    },
    note: (
      <>
        <Text code>dequeue</Text> always removes the oldest element (index 0) and
        returns the removed value, while <Text code>peek</Text> only reads the
        front without changing state. The hook keeps the array reference stable
        when the queue does not change.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const { lang } = useLanguage()
  const { queue, enqueue, dequeue, size, isEmpty, first, last, clear, reset } =
    useQueue(INITIAL_TASKS[lang])
  const [input, setInput] = useState('')

  const handleEnqueue = () => {
    const value = input.trim()
    if (!value) return
    enqueue(value)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleEnqueue()
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Space wrap>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.inputPlaceholder}
          style={{ width: 220 }}
        />
        <Button icon={<PlusOutlined />} type="primary" onClick={handleEnqueue}>
          {t.enqueue}
        </Button>
        <Button icon={<MinusOutlined />} onClick={dequeue} disabled={isEmpty}>
          {t.dequeue}
        </Button>
        <Button icon={<ClearOutlined />} onClick={clear} disabled={isEmpty}>
          {t.clear}
        </Button>
        <Button icon={<RedoOutlined />} onClick={reset}>
          {t.reset}
        </Button>
      </Space>

      {isEmpty ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.emptyTitle}>
          <Text type="secondary">{t.emptyDesc}</Text>
        </Empty>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            padding: 12,
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
          }}
        >
          <Tag color="blue">{t.front}</Tag>
          <ArrowRightOutlined style={{ color: '#bfbfbf' }} />
          {queue.map((item, index) => {
            const isFront = index === 0
            const isBack = index === queue.length - 1
            return (
              <Tag
                key={`${item}-${index}`}
                color={isFront ? 'green' : isBack ? 'orange' : 'default'}
                style={{
                  fontSize: 14,
                  padding: '4px 10px',
                  marginRight: 0,
                }}
              >
                {item}
              </Tag>
            )
          })}
          <ArrowRightOutlined style={{ color: '#bfbfbf' }} />
          <Tag color="orange">{t.back}</Tag>
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic title={t.stats.size} value={size} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={t.stats.first}
            value={first || '—'}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={t.stats.last}
            value={last || '—'}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title={t.stats.isEmpty}
            value={isEmpty ? 'Sim' : 'Não'}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
      </Row>

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UseQueueSnippetPage() {
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
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
