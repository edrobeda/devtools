import React, { useState } from 'react'
import { Typography, Card, Space, Segmented, Slider, Table, Button, message } from 'antd'
import { ColumnWidthOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const DIRECTIONS = ['row', 'row-reverse', 'column', 'column-reverse']
const JUSTIFY = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']
const ALIGN = ['stretch', 'flex-start', 'center', 'flex-end', 'baseline']
const WRAP = ['nowrap', 'wrap', 'wrap-reverse']
const BOX_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1']

const translations = {
  pt: {
    title: 'Cheat Sheet Interativo: Flexbox',
    intro: 'Ajuste as propriedades abaixo e veja o layout reagir ao vivo — bom pra lembrar rápido o que cada valor de flexbox faz, sem precisar abrir um CodePen.',
    playgroundTitle: 'Playground',
    direction: 'flex-direction',
    justify: 'justify-content',
    align: 'align-items',
    wrap: 'flex-wrap',
    gap: 'gap',
    boxCount: 'Nº de itens',
    css: 'CSS gerado',
    copy: 'Copiar CSS',
    copied: 'CSS copiado',
    refTitle: 'Referência rápida',
    col: { property: 'Propriedade', appliesTo: 'Aplica em', description: 'O que faz' },
    rows: [
      { property: 'display: flex', appliesTo: 'container', description: 'Ativa o modelo flexbox pros filhos diretos do elemento' },
      { property: 'flex-direction', appliesTo: 'container', description: 'Define o eixo principal: linha ou coluna, normal ou invertido' },
      { property: 'justify-content', appliesTo: 'container', description: 'Alinha os itens ao longo do eixo principal (distribuição de espaço)' },
      { property: 'align-items', appliesTo: 'container', description: 'Alinha os itens ao longo do eixo cruzado (perpendicular ao principal)' },
      { property: 'flex-wrap', appliesTo: 'container', description: 'Permite (ou não) que os itens quebrem linha quando não cabem' },
      { property: 'gap', appliesTo: 'container', description: 'Espaço fixo entre itens, sem precisar de margin manual' },
      { property: 'flex-grow', appliesTo: 'item', description: 'Quanto o item cresce pra ocupar espaço extra disponível, proporcional aos irmãos' },
      { property: 'flex-shrink', appliesTo: 'item', description: 'Quanto o item encolhe quando falta espaço, proporcional aos irmãos' },
      { property: 'flex-basis', appliesTo: 'item', description: 'Tamanho inicial do item antes de crescer/encolher' },
      { property: 'align-self', appliesTo: 'item', description: 'Sobrescreve o align-items do container só pra esse item' },
    ],
  },
  en: {
    title: 'Interactive Cheat Sheet: Flexbox',
    intro: 'Tweak the properties below and watch the layout react live — a quick way to remember what each flexbox value does, without opening a CodePen.',
    playgroundTitle: 'Playground',
    direction: 'flex-direction',
    justify: 'justify-content',
    align: 'align-items',
    wrap: 'flex-wrap',
    gap: 'gap',
    boxCount: 'Item count',
    css: 'Generated CSS',
    copy: 'Copy CSS',
    copied: 'CSS copied',
    refTitle: 'Quick reference',
    col: { property: 'Property', appliesTo: 'Applies to', description: 'What it does' },
    rows: [
      { property: 'display: flex', appliesTo: 'container', description: "Enables the flexbox model for the element's direct children" },
      { property: 'flex-direction', appliesTo: 'container', description: 'Sets the main axis: row or column, normal or reversed' },
      { property: 'justify-content', appliesTo: 'container', description: 'Aligns items along the main axis (space distribution)' },
      { property: 'align-items', appliesTo: 'container', description: 'Aligns items along the cross axis (perpendicular to the main one)' },
      { property: 'flex-wrap', appliesTo: 'container', description: "Allows (or not) items to wrap onto a new line when they don't fit" },
      { property: 'gap', appliesTo: 'container', description: 'Fixed spacing between items, no manual margin needed' },
      { property: 'flex-grow', appliesTo: 'item', description: 'How much the item grows to fill extra available space, relative to siblings' },
      { property: 'flex-shrink', appliesTo: 'item', description: 'How much the item shrinks when space is tight, relative to siblings' },
      { property: 'flex-basis', appliesTo: 'item', description: 'Initial size of the item before growing/shrinking' },
      { property: 'align-self', appliesTo: 'item', description: 'Overrides the container align-items just for this item' },
    ],
  },
}

export default function FlexboxCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [direction, setDirection] = useState('row')
  const [justify, setJustify] = useState('flex-start')
  const [align, setAlign] = useState('stretch')
  const [wrap, setWrap] = useState('nowrap')
  const [gap, setGap] = useState(8)
  const [boxCount, setBoxCount] = useState(5)

  const css = `.container {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  flex-wrap: ${wrap};
  gap: ${gap}px;
}`

  function copyCss() {
    navigator.clipboard.writeText(css)
    message.success(t.copied)
  }

  const columns = [
    { title: t.col.property, dataIndex: 'property', key: 'property', render: (v) => <Text code>{v}</Text> },
    { title: t.col.appliesTo, dataIndex: 'appliesTo', key: 'appliesTo' },
    { title: t.col.description, dataIndex: 'description', key: 'description' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ColumnWidthOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.playgroundTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space size="large" wrap>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.direction}</Text>
              <Segmented value={direction} onChange={setDirection} options={DIRECTIONS} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.justify}</Text>
              <Segmented value={justify} onChange={setJustify} options={JUSTIFY} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.align}</Text>
              <Segmented value={align} onChange={setAlign} options={ALIGN} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.wrap}</Text>
              <Segmented value={wrap} onChange={setWrap} options={WRAP} />
            </Space>
          </Space>

          <Space size="large" wrap align="start">
            <Space direction="vertical" size={4} style={{ width: 200 }}>
              <Text type="secondary">{t.gap}: {gap}px</Text>
              <Slider min={0} max={32} value={gap} onChange={setGap} />
            </Space>
            <Space direction="vertical" size={4} style={{ width: 200 }}>
              <Text type="secondary">{t.boxCount}: {boxCount}</Text>
              <Slider min={2} max={8} value={boxCount} onChange={setBoxCount} />
            </Space>
          </Space>

          <div
            style={{
              display: 'flex',
              flexDirection: direction,
              justifyContent: justify,
              alignItems: align,
              flexWrap: wrap,
              gap,
              minHeight: 220,
              padding: 16,
              background: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: 8,
            }}
          >
            {Array.from({ length: boxCount }, (_, i) => (
              <div
                key={i}
                style={{
                  width: align === 'stretch' && (direction === 'column' || direction === 'column-reverse') ? undefined : 56,
                  height: align === 'stretch' && (direction === 'row' || direction === 'row-reverse') ? undefined : 56,
                  minWidth: 56,
                  minHeight: 56,
                  borderRadius: 8,
                  background: BOX_COLORS[i % BOX_COLORS.length],
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>{t.css}</Text>
              <Button size="small" icon={<CopyOutlined />} onClick={copyCss}>{t.copy}</Button>
            </Space>
            <pre style={{ margin: 0, overflowX: 'auto', background: '#fafafa', padding: 12, borderRadius: 8 }}>
              <code>{css}</code>
            </pre>
          </Space>
        </Space>
      </Card>

      <Card title={t.refTitle}>
        <Table
          columns={columns}
          dataSource={t.rows.map((r, i) => ({ ...r, key: i }))}
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  )
}
