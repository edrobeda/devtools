import React from 'react'
import { Typography } from 'antd'
import { SelectOutlined, ReadOutlined } from '@ant-design/icons'
import CheatSheetShell from '../components/CheatSheetShell'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  labelOf,
  ITEMS,
} from '../utils/cssSelectorsCheatsheet'

const { Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de Seletores CSS',
    intro: (
      <>
        Referência pesquisável dos seletores CSS — da sintaxe básica a
        pseudo-classes e pseudo-elementos. Use junto com o{' '}
        <Text code>Testador de Seletores CSS</Text> e a{' '}
        <Text code>Calculadora de Especificidade</Text> do devtools para ir além
        da teoria e testar suas regras na prática.
      </>
    ),
    search: 'Buscar seletor, conceito ou descrição...',
    all: 'Todas',
    empty: 'Nenhum seletor encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Como usar este catálogo',
    tipBody: (
      <>
        Seletores CSS são case-insensitive em HTML (exceto nomes de atributo).
        A especificidade dos seletores influencia qual regra vence quando há
        conflito: <Text code>id</Text> vale mais que <Text code>classe</Text>,
        que vale mais que <Text code>elemento</Text>. Pseudo-classes como{' '}
        <Text code>:is()</Text> e <Text code>:not()</Text> herdam a
        especificidade do argumento mais específico, enquanto{' '}
        <Text code>:where()</Text> tem especificidade zero.
      </>
    ),
    resultsOne: 'seletor encontrado',
    resultsMany: 'seletores encontrados',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar seletor',
    copiedCode: 'Seletor copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'CSS Selectors Cheat Sheet',
    intro: (
      <>
        A searchable reference of CSS selectors — from basic syntax to
        pseudo-classes and pseudo-elements. Use it alongside the devtools{' '}
        <Text code>CSS Selector Tester</Text> and{' '}
        <Text code>Specificity Calculator</Text> to go beyond theory and test
        your rules in practice.
      </>
    ),
    search: 'Search selector, concept or description...',
    all: 'All',
    empty: 'No selector found. Try a different search or category.',
    tipTitle: 'How to use this catalog',
    tipBody: (
      <>
        CSS selectors are case-insensitive in HTML (except attribute names).
        Selector specificity determines which rule wins when there is a
        conflict: <Text code>id</Text> beats <Text code>class</Text>, which
        beats <Text code>element</Text>. Pseudo-classes like{' '}
        <Text code>:is()</Text> and <Text code>:not()</Text> inherit the
        specificity of their most specific argument, while{' '}
        <Text code>:where()</Text> has zero specificity.
      </>
    ),
    resultsOne: 'selector found',
    resultsMany: 'selectors found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy selector',
    copiedCode: 'Selector copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function CssSelectorsCheatsheetPage() {
  return (
    <CheatSheetShell
      items={ITEMS}
      categories={CATEGORIES}
      categoryColors={CATEGORY_COLOR}
      categoryLabels={labelOf}
      translations={translations}
      titleIcon={<SelectOutlined />}
      alertIcon={<ReadOutlined />}
      alertType="info"
      markdownHeader={'# CSS Selectors (cheat sheet)\n\n'}
      markdownFence={'```css'}
      codeWrapped
      codeColor={null}
      matchCategoryLabel
    />
  )
}
