import React, { useRef, useState } from 'react'
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
  Row,
  Col,
} from 'antd'
import { CodeOutlined, DragOutlined, ReloadOutlined } from '@ant-design/icons'
import useDraggable from '../hooks/useDraggable'
import sourceCode from '../hooks/useDraggable.js?raw'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Snippet: useDraggable',
    intro: (
      <>
        Hook que torna qualquer elemento <Text code>arrastável</Text> com
        Pointer Events — um único conjunto de eventos pra mouse, touch e
        caneta, sem duplicar lógica de <Text code>mousemove</Text> e{' '}
        <Text code>touchmove</Text>. A posição vira um{' '}
        <Text code>translate3d</Text> a partir do layout original (nada de{' '}
        <Text code>top</Text>/<Text code>left</Text>, os vizinhos não saltam),
        com eixo travado, snap em grade e limite dentro de um container — os
        três opcionais. Útil pra cartões que se reorganizam, modais que o
        usuário reposiciona, stickers, kanban e qualquer "arrasta pra cá".
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceExtra: 'src/hooks/useDraggable.js',
    demoTitle: 'Demonstração',
    demoDesc:
      'Arraste os dois cartões com o mouse ou o dedo. Os controles valem pros dois ao mesmo tempo e podem ser trocados em pleno arrasto.',
    axisLabel: 'Eixo',
    axisBoth: 'Livre (X+Y)',
    axisX: 'Só X',
    axisY: 'Só Y',
    snapLabel: 'Snap da grade (px)',
    snapOff: 'desligado',
    boundsLabel: 'Limitar dentro da área',
    reset: 'Resetar',
    usage: 'Chamada atual',
    cardA: 'Cartão A',
    cardB: 'Cartão B',
    dragging: 'arrastando',
    idle: 'parado',
    boundsHint:
      'Com o limite desligado os cartões podem escapar da área tracejada — é só pra mostrar que sem boundsRef o arrasto é livre.',
    howTitle: 'Como funciona',
    how: (
      <>
        No <Text code>pointerdown</Text> o hook mede o elemento e o container
        (limites ficam congelados até soltar), chama{' '}
        <Text code>setPointerCapture</Text> pra continuar recebendo{' '}
        <Text code>pointermove</Text> mesmo quando o cursor sai do elemento e
        só então liga listeners na janela. A posição é gravada num ref espelho
        <em> antes</em> do <Text code>setState</Text> — nenhum handler fica com
        closure velha — e as opções são lidas de um <Text code>optionsRef</Text>{' '}
        atualizado a cada render, por isso dá pra trocar eixo, grade ou limite
        em pleno arrasto sem reiniciar o gesto. O estado só muda quando a
        posição de fato muda (arrastar sem andar não renderiza), os listeners
        da janela saem no <Text code>pointerup</Text>, no{' '}
        <Text code>pointercancel</Text> e na desmontagem, e o{' '}
        <Text code>touch-action: none</Text> aplicado pelo próprio hook é o que
        deixa o arrasto funcionar no touch sem brigar com o scroll da página.
      </>
    ),
  },
  en: {
    title: 'Snippet: useDraggable',
    intro: (
      <>
        Hook that makes any element <Text code>draggable</Text> with Pointer
        Events — a single set of events for mouse, touch and pen, with no
        duplicated <Text code>mousemove</Text>/<Text code>touchmove</Text>{' '}
        logic. The position becomes a <Text code>translate3d</Text> on top of
        the original layout (no <Text code>top</Text>/
        <Text code>left</Text>, neighbors never jump), with optional axis
        lock, grid snapping and bounds inside a container. Great for
        re-sortable cards, user-repositioned modals, stickers, kanban boards
        and any drag-it-here interaction.
      </>
    ),
    sourceTitle: 'Source code',
    sourceExtra: 'src/hooks/useDraggable.js',
    demoTitle: 'Demo',
    demoDesc:
      'Drag both cards with the mouse or your finger. The controls apply to both cards at once and can be changed mid-drag.',
    axisLabel: 'Axis',
    axisBoth: 'Free (X+Y)',
    axisX: 'X only',
    axisY: 'Y only',
    snapLabel: 'Grid snap (px)',
    snapOff: 'off',
    boundsLabel: 'Keep inside the area',
    reset: 'Reset',
    usage: 'Current call',
    cardA: 'Card A',
    cardB: 'Card B',
    dragging: 'dragging',
    idle: 'idle',
    boundsHint:
      'With bounds off the cards can escape the dashed area — only there to show that without boundsRef the drag is unconstrained.',
    howTitle: 'How it works',
    how: (
      <>
        On <Text code>pointerdown</Text> the hook measures the element and the
        container (limits stay frozen until release), calls{' '}
        <Text code>setPointerCapture</Text> so{' '}
        <Text code>pointermove</Text> keeps arriving even when the cursor
        leaves the element, and only then attaches window listeners. The
        position is written to a mirror ref <em>before</em> the{' '}
        <Text code>setState</Text> — no handler ever holds a stale closure —
        and options are read from an <Text code>optionsRef</Text> refreshed on
        every render, which is why axis, grid or bounds can change mid-drag
        without restarting the gesture. State only changes when the position
        actually changes (dragging in place renders nothing), window
        listeners are removed on <Text code>pointerup</Text>,{' '}
        <Text code>pointercancel</Text> and unmount, and the{' '}
        <Text code>touch-action: none</Text> set by the hook itself is what
        makes touch dragging work without fighting the page scroll.
      </>
    ),
  },
}

const CARD_BASE = {
  position: 'absolute',
  width: 172,
  padding: '12px 14px',
  borderRadius: 10,
  background: '#fff',
  border: '1px solid #d9d9d9',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}

function DemoCard({ drag, name, cardKey, side, t }) {
  const anchor =
    side === 'a' ? { left: 24, top: 24 } : { left: 24, top: 150 }

  return (
    <div
      ref={drag.ref}
      data-drag-card={cardKey}
      style={{
        ...CARD_BASE,
        ...anchor,
        transform: `translate3d(${drag.x}px, ${drag.y}px, 0)`,
        cursor: drag.isDragging ? 'grabbing' : 'grab',
        boxShadow: drag.isDragging
          ? '0 14px 28px rgba(0, 0, 0, 0.2)'
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
        zIndex: drag.isDragging ? 2 : 1,
        transition: drag.isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space size={6}>
          <DragOutlined style={{ color: drag.isDragging ? '#1677ff' : '#8c8c8c' }} />
          <Text strong>{name}</Text>
        </Space>
        <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {`x: ${drag.x}  y: ${drag.y}`}
        </Text>
        <Tag color={drag.isDragging ? 'processing' : 'default'} style={{ margin: 0 }}>
          {drag.isDragging ? t.dragging : t.idle}
        </Tag>
      </Space>
    </div>
  )
}

function Demo({ t }) {
  const [axis, setAxis] = useState('both')
  const [grid, setGrid] = useState(0)
  const [bounded, setBounded] = useState(true)
  const areaRef = useRef(null)

  // Duas instâncias independentes do mesmo hook — cada cartão tem seu
  // ref, sua posição e seu isDragging.
  const cardA = useDraggable({ axis, grid, boundsRef: bounded ? areaRef : null })
  const cardB = useDraggable({ axis, grid, boundsRef: bounded ? areaRef : null })

  const usage = `useDraggable({ axis: '${axis}', grid: ${grid}${
    bounded ? ', boundsRef' : ''
  } })`

  const reset = () => {
    cardA.setPosition({ x: 0, y: 0 })
    cardB.setPosition({ x: 0, y: 0 })
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={8}>
          <Text strong>{t.axisLabel}</Text>
          <div style={{ marginTop: 4 }}>
            <Segmented
              value={axis}
              onChange={setAxis}
              options={[
                { label: t.axisBoth, value: 'both' },
                { label: t.axisX, value: 'x' },
                { label: t.axisY, value: 'y' },
              ]}
            />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Text strong>{t.snapLabel}</Text>
          <Slider
            min={0}
            max={32}
            step={8}
            value={grid}
            onChange={setGrid}
            marks={{ 0: t.snapOff, 8: '8', 16: '16', 32: '32' }}
          />
        </Col>
        <Col xs={24} md={8}>
          <Text strong>{t.boundsLabel}</Text>
          <Space style={{ marginTop: 4 }}>
            <Switch checked={bounded} onChange={setBounded} />
            <Button icon={<ReloadOutlined />} onClick={reset}>
              {t.reset}
            </Button>
          </Space>
        </Col>
      </Row>

      <Paragraph style={{ marginBottom: 0 }}>
        <Text type="secondary">{t.usage}: </Text>
        <Text code>{usage}</Text>
      </Paragraph>

      <div
        ref={areaRef}
        data-drag-area=""
        style={{
          position: 'relative',
          height: 320,
          borderRadius: 12,
          border: '2px dashed #bfbfbf',
          background:
            'linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <DemoCard drag={cardA} name={t.cardA} cardKey="a" side="a" t={t} />
        <DemoCard drag={cardB} name={t.cardB} cardKey="b" side="b" t={t} />
      </div>

      {!bounded && <Alert type="warning" showIcon message={t.boundsHint} />}
    </Space>
  )
}

export default function UseDraggableSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle} extra={<Text type="secondary">{t.sourceExtra}</Text>}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Demo t={t} />
      </Card>

      <Alert type="info" showIcon message={t.howTitle} description={t.how} />
    </Space>
  )
}
