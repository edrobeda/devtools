import React from 'react'
import { Typography } from 'antd'
import { SafetyOutlined, ReadOutlined } from '@ant-design/icons'
import CheatSheetShell from '../components/CheatSheetShell'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  labelOf,
  ITEMS,
} from '../utils/a11yCheatsheet'

const { Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de Acessibilidade Web (a11y)',
    intro: (
      <>
        Referência prática e pesquisável de acessibilidade web — landmarks,
        roles e estados ARIA, foco/teclado, formulários, mídia, contraste,
        semântica HTML e testes. Use junto com o{' '}
        <Text code>Checador de Contraste</Text> do devtools para validar a
        parte visual.
      </>
    ),
    search: 'Buscar snippet, conceito ou categoria...',
    all: 'Todas',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Acessibilidade primeiro',
    tipBody: (
      <>
        A primeira regra da ARIA é: se você pode usar um elemento HTML nativo,
        use. Roles e atributos ARIA são ferramentas de último recurço. Teste
        sempre com teclado e, quando possível, com um leitor de tela real.
      </>
    ),
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar snippet',
    copiedCode: 'Snippet copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Web Accessibility Cheat Sheet (a11y)',
    intro: (
      <>
        A practical, searchable accessibility reference — landmarks, ARIA
        roles and states, focus/keyboard, forms, media, contrast, HTML
        semantics, and testing. Use it alongside the devtools{' '}
        <Text code>Contrast Checker</Text> to validate the visual side.
      </>
    ),
    search: 'Search snippet, concept or category...',
    all: 'All',
    empty: 'No item found. Try a different search or category.',
    tipTitle: 'Accessibility first',
    tipBody: (
      <>
        The first rule of ARIA is: if you can use a native HTML element, do it.
        Roles and ARIA attributes are tools of last resort. Always test with a
        keyboard and, whenever possible, with a real screen reader.
      </>
    ),
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy snippet',
    copiedCode: 'Snippet copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function A11yCheatsheetPage() {
  return (
    <CheatSheetShell
      items={ITEMS}
      categories={CATEGORIES}
      categoryColors={CATEGORY_COLOR}
      categoryLabels={labelOf}
      translations={translations}
      titleIcon={<SafetyOutlined />}
      alertIcon={<ReadOutlined />}
      alertType="info"
      markdownHeader={'# Web Accessibility (a11y cheat sheet)\n\n'}
      markdownFence={'```'}
      codeWrapped
      codeColor={null}
      keyMode="codePrefix"
      matchCategoryLabel
    />
  )
}
