import React from 'react'
import { Typography } from 'antd'
import { KeyOutlined, ReadOutlined } from '@ant-design/icons'
import CheatSheetShell from '../components/CheatSheetShell'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  labelOf,
  ITEMS,
} from '../utils/jwtClaimsCheatsheet'

const { Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de Claims JWT',
    intro: (
      <>
        Referência rápida das claims mais comuns de{' '}
        <Text code>JSON Web Tokens</Text>. Use junto com o{' '}
        <Text code>Decodificador JWT</Text>, o{' '}
        <Text code>Gerador de JWT</Text> e a{' '}
        <Text code>Timeline de Expiração do JWT</Text> do devtools.
      </>
    ),
    search: 'Buscar claim, conceito ou categoria...',
    all: 'Todas',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Lembrete de segurança',
    tipBody: (
      <>
        Um JWT assinado garante integridade, mas <strong>não garante
        confidencialidade</strong>. Nunca coloque segredos ou dados sensíveis no
        payload a menos que esteja criptografando como JWE.
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
    title: 'JWT Claims Cheat Sheet',
    intro: (
      <>
        Quick reference of the most common{' '}
        <Text code>JSON Web Token</Text> claims. Use it alongside the devtools{' '}
        <Text code>JWT Decoder</Text>, <Text code>JWT Generator</Text>, and{' '}
        <Text code>JWT Expiration Timeline</Text>.
      </>
    ),
    search: 'Search claim, concept or category...',
    all: 'All',
    empty: 'No item found. Try a different search or category.',
    tipTitle: 'Security reminder',
    tipBody: (
      <>
        A signed JWT ensures integrity, but <strong>does not ensure
        confidentiality</strong>. Never put secrets or sensitive data in the
        payload unless you are encrypting it as JWE.
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

export default function JwtClaimsCheatsheetPage() {
  return (
    <CheatSheetShell
      items={ITEMS}
      categories={CATEGORIES}
      categoryColors={CATEGORY_COLOR}
      categoryLabels={labelOf}
      translations={translations}
      titleIcon={<KeyOutlined />}
      alertIcon={<ReadOutlined />}
      alertType="warning"
      markdownHeader={'# JWT Claims Cheat Sheet\n\n'}
      markdownFence={'```'}
      codeWrapped
      codeColor={null}
      keyMode="codePrefix"
      matchCategoryLabel
    />
  )
}
