import React, { useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Tag,
  Alert,
  Slider,
  Button,
  Segmented,
  Switch,
  InputNumber,
  Row,
  Col,
  Statistic,
} from 'antd'
import { CodeOutlined, AimOutlined } from '@ant-design/icons'
import useVirtualList from '../hooks/useVirtualList'
import sourceCode from '../hooks/useVirtualList.js?raw'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const MAX_PLAIN_ROWS = 5000

const translations = {
  pt: {
    title: 'Snippet: useVirtualList',
    intro: (
      <>
        Hook de <Text code>virtualização</Text> (windowing) para listas de
        altura fixa: de N linhas ele mantém no DOM só a janela visível mais o{' '}
        <Text code>overscan</Text> de cada lado, então 100.000 itens custam os
        mesmos ~25 nós de DOM que 30 itens. O cálculo é O(1) por scroll — não
        mede nenhum filho, só faz aritmética com <Text code>scrollTop</Text>,{' '}
        <Text code>clientHeight</Text> e o tamanho da linha. Devolve{' '}
        <Text code>containerRef</Text>, a janela <Text code>start/end</Text>,{' '}
        <Text code>offsetY</Text>, <Text code>totalHeight</Text> e{' '}
        <Text code>scrollToIndex()</Text>. É a peça que falta entre{' '}
        <Text code>usePagination</Text> (pagina a lista) e{' '}
        <Text code>useOnScreen</Text> (observa um elemento): aqui a rolagem é
        que decide o que existe na tela. Implementação em{' '}
        <Text code>src/hooks/useVirtualList.js</Text>.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceExtra: 'src/hooks/useVirtualList.js',
    demoTitle: 'Demonstração ao vivo',
    demoDesc:
      'Rode a lista com 100.000 linhas e observe o contador de nós no DOM: a virtualização mantém a janela visível (com buffer) em vez de renderizar tudo. Desligue a virtualização pra ver o custo real — por isso o limite de 5.000 linhas nesse modo.',
    countLabel: 'Linhas na lista',
    heightLabel: 'Altura da linha',
    overscanLabel: 'Overscan (buffer)',
    virtualLabel: 'Virtualização',
    virtualOn: 'on',
    virtualOff: 'off',
    usage: 'Chamada atual',
    jumpLabel: 'Ir para o índice',
    jump: 'Ir',
    first: 'Início',
    last: 'Fim',
    statsTitle: 'Números',
    statTotal: 'Linhas nos dados',
    statDom: 'Nós no DOM',
    statShare: '% renderizado',
    statWindow: 'Janela renderizada',
    reduction: (dom, total) =>
      `${total.toLocaleString('pt-BR')} linhas → ${dom} nós de DOM (${(
        100 -
        (dom / Math.max(1, total)) * 100
      ).toFixed(2)}% a menos)`,
    clampAlert:
      'Virtualização desligada: a lista foi limitada a 5.000 linhas. Renderizar 100.000 nós de DOM de uma vez é o que trava a aba — exatamente o problema que este hook resolve.',
    rowText: 'linha',
    howTitle: 'Como funciona',
    how: (
      <>
        Com altura fixa não há nada a medir: a linha <Text code>i</Text>{' '}
        começa em <Text code>i × itemHeight</Text>, então{' '}
        <Text code>scrollTop / itemHeight</Text> já diz qual é a primeira
        visível e <Text code>clientHeight / itemHeight</Text> diz quantas
        cabem — a janela vai de <Text code>firstVisible − overscan</Text> até{' '}
        <Text code>firstVisible + visíveis + overscan</Text>, em O(1). O estado
        guarda <em>só</em> <Text code>{'{ start, end }'}</Text> e o{' '}
        <Text code>setRange</Text> devolve o <em>mesmo objeto</em> quando a
        janela não mudou: o React faz bail-out e rolar dentro da mesma janela
        não re-renderiza nada. O primeiro cálculo roda num{' '}
        <Text code>useLayoutEffect</Text> — antes da pintura, senão a lista
        abriria vazia por um frame. O listener de scroll é{' '}
        <Text code>passive</Text>, um <Text code>ResizeObserver</Text> no
        container refaz a conta quando a altura muda (com fallback pra{' '}
        <Text code>window.resize</Text>), e as dependências são só primitivos (
        <Text code>count</Text>, <Text code>itemHeight</Text>,{' '}
        <Text code>overscan</Text>) — por isso chamar o hook com o objeto
        literal direto na chamada não recria efeito em loop. O preço é a
        altura fixa: linha de tamanho variável exigiria medir (ou estimar)
        cada item, que é justamente o que este snippet deixa de fora.
      </>
    ),
  },
  en: {
    title: 'Snippet: useVirtualList',
    intro: (
      <>
        A <Text code>virtualization</Text> (windowing) hook for fixed-height
        lists: out of N rows it keeps only the visible window plus the{' '}
        <Text code>overscan</Text> buffer on each side in the DOM, so 100,000
        items cost the same ~25 DOM nodes as 30 items. The math is O(1) per
        scroll — it never measures a child, it just arithmetic on{' '}
        <Text code>scrollTop</Text>, <Text code>clientHeight</Text> and the
        row height. It returns <Text code>containerRef</Text>, the{' '}
        <Text code>start/end</Text> window, <Text code>offsetY</Text>,{' '}
        <Text code>totalHeight</Text> and <Text code>scrollToIndex()</Text>.
        It is the missing piece between <Text code>usePagination</Text> (pages
        the list) and <Text code>useOnScreen</Text> (watches one element):
        here the scroll decides what exists on screen. Implementation in{' '}
        <Text code>src/hooks/useVirtualList.js</Text>.
      </>
    ),
    sourceTitle: 'Source code',
    sourceExtra: 'src/hooks/useVirtualList.js',
    demoTitle: 'Live demo',
    demoDesc:
      'Run the list with 100,000 rows and watch the DOM node counter: virtualization keeps the visible window (plus buffer) instead of rendering everything. Turn it off to see the real cost — that is why this mode is capped at 5,000 rows.',
    countLabel: 'Rows in the list',
    heightLabel: 'Row height',
    overscanLabel: 'Overscan (buffer)',
    virtualLabel: 'Virtualization',
    virtualOn: 'on',
    virtualOff: 'off',
    usage: 'Current call',
    jumpLabel: 'Jump to index',
    jump: 'Go',
    first: 'Top',
    last: 'Bottom',
    statsTitle: 'Numbers',
    statTotal: 'Rows in data',
    statDom: 'DOM nodes',
    statShare: '% rendered',
    statWindow: 'Rendered window',
    reduction: (dom, total) =>
      `${total.toLocaleString('en-US')} rows → ${dom} DOM nodes (${(
        100 -
        (dom / Math.max(1, total)) * 100
      ).toFixed(2)}% fewer)`,
    clampAlert:
      'Virtualization off: the list was capped at 5,000 rows. Rendering 100,000 DOM nodes at once is what freezes the tab — exactly the problem this hook solves.',
    rowText: 'row',
    howTitle: 'How it works',
    how: (
      <>
        With a fixed height there is nothing to measure: row <Text code>i</Text>{' '}
        starts at <Text code>i × itemHeight</Text>, so{' '}
        <Text code>scrollTop / itemHeight</Text> already tells you the first
        visible row and <Text code>clientHeight / itemHeight</Text> how many
        fit — the window runs from <Text code>firstVisible − overscan</Text>{' '}
        to <Text code>firstVisible + visible + overscan</Text>, in O(1). State
        holds <em>only</em> <Text code>{'{ start, end }'}</Text> and{' '}
        <Text code>setRange</Text> returns the <em>same object</em> when the
        window did not change: React bails out and scrolling inside one window
        re-renders nothing. The first computation runs in a{' '}
        <Text code>useLayoutEffect</Text> — before paint, otherwise the list
        would open empty for one frame. The scroll listener is{' '}
        <Text code>passive</Text>, a <Text code>ResizeObserver</Text> on the
        container recomputes when the height changes (falling back to{' '}
        <Text code>window.resize</Text>), and the dependencies are primitives
        only (<Text code>count</Text>, <Text code>itemHeight</Text>,{' '}
        <Text code>overscan</Text>) — which is why passing the options object
        inline never re-creates the effect in a loop. The price is fixed
        height: variable-size rows would need measuring (or estimating) every
        item, which is exactly what this snippet leaves out.
      </>
    ),
  },
}

function VirtualRow({ index, height, label }) {
  const hue = (index * 47) % 360
  return (
    <div
      data-virtual-row=""
      data-index={index}
      style={{
        height,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px',
        borderBottom: '1px solid #f0f0f0',
        background: index % 2 ? '#ffffff' : '#fafafa',
      }}
    >
      <Text
        code
        style={{ color: '#8c8c8c', minWidth: 78, flexShrink: 0, fontSize: 12 }}
      >
        #{index}
      </Text>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          flexShrink: 0,
          background: `hsl(${hue}, 70%, 50%)`,
        }}
      />
      <Text
        style={{
          fontSize: 13,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label} {index}
      </Text>
      <Tag style={{ marginLeft: 'auto', flexShrink: 0, marginBottom: 0 }}>
        {(index * 2654435761) % 9973}
      </Tag>
    </div>
  )
}

function Demo({ t, lang }) {
  const [count, setCount] = useState(100000)
  const [itemHeight, setItemHeight] = useState(36)
  const [overscan, setOverscan] = useState(6)
  const [virtual, setVirtual] = useState(true)
  const [clamped, setClamped] = useState(false)
  const [target, setTarget] = useState(99999)

  const list = useVirtualList({ count, itemHeight, overscan })
  const { containerRef, start, end, offsetY, totalHeight, scrollToIndex } = list

  const fmt = (n) => n.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')

  const handleCount = (value) => {
    if (!virtual && value > MAX_PLAIN_ROWS) {
      setCount(MAX_PLAIN_ROWS)
      setClamped(true)
    } else {
      setCount(value)
      setClamped(false)
    }
    setTarget((prev) => Math.min(prev, value - 1))
  }

  const handleVirtual = (value) => {
    setVirtual(value)
    if (!value && count > MAX_PLAIN_ROWS) {
      setCount(MAX_PLAIN_ROWS)
      setClamped(true)
    } else if (value) {
      setClamped(false)
    }
  }

  const domCount = virtual ? list.renderedCount : count
  const indices = virtual
    ? Array.from({ length: Math.max(0, end - start) }, (_, k) => start + k)
    : Array.from({ length: count }, (_, k) => k)

  const usage = `useVirtualList({ count: ${count}, itemHeight: ${itemHeight}, overscan: ${overscan} })`

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={7}>
          <Text strong>{t.countLabel}</Text>
          <div style={{ marginTop: 4 }}>
            <Segmented
              value={count}
              onChange={handleCount}
              options={[
                { label: '1k', value: 1000 },
                { label: '5k', value: 5000 },
                { label: '20k', value: 20000 },
                { label: '100k', value: 100000 },
              ]}
            />
          </div>
        </Col>
        <Col xs={24} md={7}>
          <Text strong>
            {t.heightLabel}: {itemHeight}px
          </Text>
          <Slider
            min={24}
            max={64}
            step={4}
            value={itemHeight}
            onChange={setItemHeight}
          />
        </Col>
        <Col xs={24} md={6}>
          <Text strong>
            {t.overscanLabel}: {overscan}
          </Text>
          <Slider
            min={0}
            max={24}
            step={2}
            value={overscan}
            onChange={setOverscan}
          />
        </Col>
        <Col xs={24} md={4}>
          <Text strong>{t.virtualLabel}</Text>
          <div style={{ marginTop: 6 }}>
            <Switch
              checked={virtual}
              onChange={handleVirtual}
              checkedChildren={t.virtualOn}
              unCheckedChildren={t.virtualOff}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 12]} align="middle">
        <Col xs={24} md={14}>
          <Space wrap>
            <Text strong>{t.jumpLabel}:</Text>
            <InputNumber
              min={0}
              max={count - 1}
              value={target}
              onChange={(value) => {
                if (value !== null && value !== undefined) setTarget(value)
              }}
              style={{ width: 130 }}
            />
            <Button icon={<AimOutlined />} onClick={() => scrollToIndex(target)}>
              {t.jump}
            </Button>
            <Button onClick={() => scrollToIndex(0)}>{t.first}</Button>
            <Button onClick={() => scrollToIndex(count - 1)}>{t.last}</Button>
          </Space>
        </Col>
        <Col xs={24} md={10}>
          <Paragraph style={{ marginBottom: 0 }}>
            <Text type="secondary">{t.usage}: </Text>
            <Text code>{usage}</Text>
          </Paragraph>
        </Col>
      </Row>

      {clamped && <Alert type="warning" showIcon message={t.clampAlert} />}

      <div
        ref={containerRef}
        data-virtual-list=""
        style={{
          height: 420,
          overflowY: 'auto',
          borderRadius: 10,
          border: '1px solid #d9d9d9',
          background: '#fff',
        }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${virtual ? offsetY : 0}px)`,
              willChange: virtual ? 'transform' : 'auto',
            }}
          >
            {indices.map((i) => (
              <VirtualRow key={i} index={i} height={itemHeight} label={t.rowText} />
            ))}
          </div>
        </div>
      </div>

      <Card size="small" title={t.statsTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={5}>
            <Statistic title={t.statTotal} value={fmt(count)} />
          </Col>
          <Col xs={12} md={5}>
            <Statistic title={t.statDom} value={fmt(domCount)} />
          </Col>
          <Col xs={12} md={5}>
            <Statistic
              title={t.statShare}
              value={`${((domCount / Math.max(1, count)) * 100).toFixed(2)}%`}
            />
          </Col>
          <Col xs={12} md={9}>
            <Statistic
              title={t.statWindow}
              value={virtual ? `${start} → ${end}` : `0 → ${count - 1}`}
            />
          </Col>
        </Row>
        <div style={{ marginTop: 12 }}>
          <Tag color={domCount <= 60 ? 'green' : 'orange'}>
            {t.reduction(domCount, count)}
          </Tag>
        </div>
      </Card>
    </Space>
  )
}

export default function UseVirtualListSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.sourceTitle}
        extra={<Text type="secondary">{t.sourceExtra}</Text>}
      >
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Demo t={t} lang={lang} />
      </Card>

      <Alert type="info" showIcon message={t.howTitle} description={t.how} />
    </Space>
  )
}
