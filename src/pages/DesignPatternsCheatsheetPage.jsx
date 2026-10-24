import React from 'react'
import { Typography } from 'antd'
import { ReadOutlined, BookOutlined } from '@ant-design/icons'
import CheatSheetShell from '../components/CheatSheetShell'
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL, ITEMS } from '../utils/designPatternsCheatsheet'

const { Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de Design Patterns',
    intro: (
      <>
        Referência rápida dos principais <Text code>Design Patterns</Text> —
        padrões criacionais, estruturais, comportamentais e arquiteturais — com
        snippets em JavaScript/TypeScript. Use para escolher o padrão certo,
        estudar ou explicar em code review.
      </>
    ),
    search: 'Buscar padrão, intenção ou categoria...',
    all: 'Todos',
    empty: 'Nenhum padrão encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Quando usar padrões',
    tipBody: (
      <>
        Padrões resolvem problemas recorrentes, não são bibliotecas. Comece com
        o código mais simples que funcione e introduza um padrão quando a
        complexidade justificar. Evite over-engineering — um pattern mal
        aplicado vira anti-pattern.
      </>
    ),
    resultsOne: 'padrão encontrado',
    resultsMany: 'padrões encontrados',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar código',
    copiedCode: 'Código copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Design Patterns Cheat Sheet',
    intro: (
      <>
        Quick reference of the main <Text code>Design Patterns</Text> —
        creational, structural, behavioral and architectural — with
        JavaScript/TypeScript snippets. Use it to pick the right pattern, study
        or explain during code reviews.
      </>
    ),
    search: 'Search pattern, intent or category...',
    all: 'All',
    empty: 'No pattern found. Try a different search or category.',
    tipTitle: 'When to use patterns',
    tipBody: (
      <>
        Patterns solve recurring problems; they are not libraries. Start with
        the simplest working code and introduce a pattern only when complexity
        justifies it. Avoid over-engineering — a poorly applied pattern becomes
        an anti-pattern.
      </>
    ),
    resultsOne: 'pattern found',
    resultsMany: 'patterns found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy code',
    copiedCode: 'Code copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function DesignPatternsCheatsheetPage() {
  return (
    <CheatSheetShell
      items={ITEMS}
      categories={CATEGORIES}
      categoryColors={CATEGORY_COLOR}
      categoryLabels={CATEGORY_LABEL}
      translations={translations}
      titleIcon={<ReadOutlined />}
      alertIcon={<BookOutlined />}
      alertType="info"
      markdownHeader={'# Design Patterns Cheat Sheet\n\n'}
      markdownFence={'```js'}
      codeWrapped
      codeColor={null}
      keyMode="name"
      matchCategoryLabel
      matchItemName
      showItemName
    />
  )
}
