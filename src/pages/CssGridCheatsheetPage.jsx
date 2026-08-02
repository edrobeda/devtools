import React, { useState } from 'react'
import { Typography, Card, Space, Segmented, Slider, Table, Button, message, Input } from 'antd'
import { TableOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const COLUMN_PRESETS = ['repeat(3, 1fr)', 'repeat(auto-fit, minmax(100px, 1fr))', '1fr 2fr 1fr', '100px 1fr 100px']
const JUSTIFY_CONTENT = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly']
const ALIGN_ITEMS = ['stretch', 'start', 'center', 'end']
const JUSTIFY_ITEMS = ['stretch', 'start', 'center', 'end']
const BOX_COLORS = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2']

const translations = {
  pt: {
    title: 'Cheat Sheet Interativo: CSS Grid',
    intro: 'Ajuste as propriedades abaixo e veja a grade reagir ao vivo — inclui também um exemplo de item ocupando várias colunas via grid-column.',
    playgroundTitle: 'Playground',
    columns: 'grid-template-columns',
    gap: 'gap',
    boxCount: 'Nº de itens',
    justifyContent: 'justify-content',
    alignItems: 'align-items',
    justifyItems: 'justify-items',
    spanLabel: 'Item 1 ocupa (grid-column: span N)',
    css: 'CSS gerado',
    copy: 'Copiar CSS',
    copied: 'CSS copiado',
    refTitle: 'Referência rápida',
    col: { property: 'Propriedade', appliesTo: 'Aplica em', description: 'O que faz' },
    rows: [
      { property: 'display: grid', appliesTo: 'container', description: 'Ativa o modelo de grade pros filhos diretos do elemento' },
      { property: 'grid-template-columns', appliesTo: 'container', description: 'Define o número e tamanho das colunas (aceita fr, px, %, repeat(), minmax(), auto-fit/auto-fill)' },
      { property: 'grid-template-rows', appliesTo: 'container', description: 'Define o número e tamanho das linhas, mesma sintaxe das colunas' },
      { property: 'gap', appliesTo: 'container', description: 'Espaço entre linhas e colunas (equivalente a row-gap + column-gap)' },
      { property: 'justify-content', appliesTo: 'container', description: 'Alinha a grade inteira no eixo horizontal, quando ela é menor que o container' },
      { property: 'align-content', appliesTo: 'container', description: 'Alinha a grade inteira no eixo vertical, quando ela é menor que o container' },
      { property: 'justify-items', appliesTo: 'container', description: 'Alinha cada item dentro da própria célula, no eixo horizontal' },
      { property: 'align-items', appliesTo: 'container', description: 'Alinha cada item dentro da própria célula, no eixo vertical' },
      { property: 'grid-column / grid-row', appliesTo: 'item', description: 'Faz o item ocupar mais de uma coluna/linha, ex.: span 2' },
      { property: 'grid-area', appliesTo: 'item', description: 'Posiciona o item numa área nomeada definida em grid-template-areas' },
    ],
  },
  en: {
    title: 'Interactive Cheat Sheet: CSS Grid',
    intro: 'Tweak the properties below and watch the grid react live — also includes an example of an item spanning multiple columns via grid-column.',
    playgroundTitle: 'Playground',
    columns: 'grid-template-columns',
    gap: 'gap',
    boxCount: 'Item count',
    justifyContent: 'justify-content',
    alignItems: 'align-items',
    justifyItems: 'justify-items',
    spanLabel: 'Item 1 spans (grid-column: span N)',
    css: 'Generated CSS',
    copy: 'Copy CSS',
    copied: 'CSS copied',
    refTitle: 'Quick reference',
    col: { property: 'Property', appliesTo: 'Applies to', description: 'What it does' },
    rows: [
      { property: 'display: grid', appliesTo: 'container', description: "Enables the grid model for the element's direct children" },
      { property: 'grid-template-columns', appliesTo: 'container', description: 'Defines the number and size of columns (accepts fr, px, %, repeat(), minmax(), auto-fit/auto-fill)' },
      { property: 'grid-template-rows', appliesTo: 'container', description: 'Defines the number and size of rows, same syntax as columns' },
      { property: 'gap', appliesTo: 'container', description: 'Spacing between rows and columns (shorthand for row-gap + column-gap)' },
      { property: 'justify-content', appliesTo: 'container', description: 'Aligns the whole grid on the horizontal axis, when smaller than the container' },
      { property: 'align-content', appliesTo: 'container', description: 'Aligns the whole grid on the vertical axis, when smaller than the container' },
      { property: 'justify-items', appliesTo: 'container', description: 'Aligns each item within its own cell, on the horizontal axis' },
      { property: 'align-items', appliesTo: 'container', description: 'Aligns each item within its own cell, on the vertical axis' },
      { property: 'grid-column / grid-row', appliesTo: 'item', description: 'Makes the item span multiple columns/rows, e.g. span 2' },
      { property: 'grid-area', appliesTo: 'item', description: 'Places the item in a named area defined in grid-template-areas' },
    ],
  },
}

export default function CssGridCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [columns, setColumns] = useState(COLUMN_PRESETS[0])
  const [gap, setGap] = useState(8)
  const [boxCount, setBoxCount] = useState(6)
  const [justifyContent, setJustifyContent] = useState('start')
  const [alignItems, setAlignItems] = useState('stretch')
  const [justifyItems, setJustifyItems] = useState('stretch')
  const [span, setSpan] = useState(1)

  const css = `.container {
  display: grid;
  grid-template-columns: ${columns};
  gap: ${gap}px;
  justify-content: ${justifyContent};
  align-items: ${alignItems};
  justify-items: ${justifyItems};
}
.item:first-child {
  grid-column: span ${span};
}`

  function copyCss() {
    navigator.clipboard.writeText(css)
    message.success(t.copied)
  }

  const columnsTable = [
    { title: t.col.property, dataIndex: 'property', key: 'property', render: (v) => <Text code>{v}</Text> },
    { title: t.col.appliesTo, dataIndex: 'appliesTo', key: 'appliesTo' },
    { title: t.col.description, dataIndex: 'description', key: 'description' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TableOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.playgroundTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space size="large" wrap align="start">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.columns}</Text>
              <Segmented value={columns} onChange={setColumns} options={COLUMN_PRESETS} />
              <Input value={columns} onChange={(e) => setColumns(e.target.value)} style={{ width: 280, fontFamily: 'monospace' }} />
            </Space>
          </Space>

          <Space size="large" wrap>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.justifyContent}</Text>
              <Segmented value={justifyContent} onChange={setJustifyContent} options={JUSTIFY_CONTENT} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.alignItems}</Text>
              <Segmented value={alignItems} onChange={setAlignItems} options={ALIGN_ITEMS} />
            </Space>
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.justifyItems}</Text>
              <Segmented value={justifyItems} onChange={setJustifyItems} options={JUSTIFY_ITEMS} />
            </Space>
          </Space>

          <Space size="large" wrap align="start">
            <Space direction="vertical" size={4} style={{ width: 200 }}>
              <Text type="secondary">{t.gap}: {gap}px</Text>
              <Slider min={0} max={32} value={gap} onChange={setGap} />
            </Space>
            <Space direction="vertical" size={4} style={{ width: 200 }}>
              <Text type="secondary">{t.boxCount}: {boxCount}</Text>
              <Slider min={3} max={9} value={boxCount} onChange={setBoxCount} />
            </Space>
            <Space direction="vertical" size={4} style={{ width: 200 }}>
              <Text type="secondary">{t.spanLabel}: {span}</Text>
              <Slider min={1} max={3} value={span} onChange={setSpan} />
            </Space>
          </Space>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: columns,
              gap,
              justifyContent,
              alignItems,
              justifyItems,
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
                  gridColumn: i === 0 ? `span ${span}` : undefined,
                  width: justifyItems === 'stretch' ? undefined : 56,
                  height: alignItems === 'stretch' ? undefined : 56,
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
          columns={columnsTable}
          dataSource={t.rows.map((r, i) => ({ ...r, key: i }))}
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  )
}
