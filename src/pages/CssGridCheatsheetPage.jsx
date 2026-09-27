import React from 'react'
import { Typography, Card, Space, Table, Alert } from 'antd'
import { TableOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de CSS Grid',
    intro: 'Referência rápida das propriedades do CSS Grid: o que cada uma faz, em qual elemento se aplica e por que importa. Para consultar, é só rolar a tabela abaixo.',
    builderTitle: 'Quer montar o layout, não só consultar?',
    builderBody: 'O Gerador de Grid CSS monta o CSS de display:grid a partir de trilhas de coluna e linha (fr/px/%/auto), espaçamento, alinhamento, grid-auto-flow e presets de layout — com preview ao vivo, resumo das trilhas e o CSS + HTML prontos pra copiar.',
    builderLink: 'Abrir o Gerador de Grid CSS',
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
    title: 'CSS Grid Cheat Sheet',
    intro: 'Quick reference for the CSS Grid properties: what each one does, which element it applies to and why it matters. To look something up, just scroll to the table below.',
    builderTitle: 'Building a layout instead of looking one up?',
    builderBody: 'The CSS Grid Builder generates display: grid CSS from column and row tracks (fr/px/%/auto), spacing, alignment, grid-auto-flow and layout presets — with a live preview, a track summary and the CSS + HTML ready to copy.',
    builderLink: 'Open the CSS Grid Builder',
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

  const columnsTable = [
    { title: t.col.property, dataIndex: 'property', key: 'property', render: (v) => <Text code>{v}</Text> },
    { title: t.col.appliesTo, dataIndex: 'appliesTo', key: 'appliesTo' },
    { title: t.col.description, dataIndex: 'description', key: 'description' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TableOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        message={t.builderTitle}
        description={(
          <>
            {t.builderBody}{' '}
            <Link to="/frontend/grid-builder" style={{ color: '#1677ff', fontWeight: 600 }}>
              → {t.builderLink}
            </Link>
          </>
        )}
      />

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
