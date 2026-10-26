import React from 'react'
import { Typography } from 'antd'
import { KeyOutlined, SafetyOutlined } from '@ant-design/icons'
import CheatSheetShell from '../components/CheatSheetShell'
import {
  CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  ITEMS,
} from '../utils/oauth2Cheatsheet'

const { Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Cheat Sheet de OAuth2 / OIDC',
    intro: (
      <>
        Referência rápida dos fluxos, endpoints, tokens e boas práticas de{' '}
        <Text code>OAuth 2.0</Text> e <Text code>OpenID Connect</Text>. Use junto
        com o <Text code>Gerador de PKCE / OAuth2</Text> e o{' '}
        <Text code>Cheat Sheet de Claims JWT</Text> do devtools.
      </>
    ),
    search: 'Buscar fluxo, endpoint, token, ataque...',
    all: 'Todas',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Lembrete de segurança',
    tipBody: (
      <>
        OAuth2 é um framework de <strong>delegação de autorização</strong>, não
        de autenticação. Use <Text code>Authorization Code + PKCE</Text> em
        SPAs/mobile, guarde segredos apenas em servidores e nunca confie em
        tokens sem validar assinatura, issuer e audience.
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
    title: 'OAuth2 / OIDC Cheat Sheet',
    intro: (
      <>
        Quick reference of <Text code>OAuth 2.0</Text> and{' '}
        <Text code>OpenID Connect</Text> flows, endpoints, tokens and best
        practices. Use it alongside the devtools{' '}
        <Text code>PKCE / OAuth2 Generator</Text> and{' '}
        <Text code>JWT Claims Cheat Sheet</Text>.
      </>
    ),
    search: 'Search flow, endpoint, token, attack...',
    all: 'All',
    empty: 'No item found. Try a different search or category.',
    tipTitle: 'Security reminder',
    tipBody: (
      <>
        OAuth2 is an <strong>authorization delegation</strong> framework, not an
        authentication mechanism. Use <Text code>Authorization Code + PKCE</Text>{' '}
        in SPAs/mobile, keep secrets on servers only, and never trust tokens
        without validating signature, issuer and audience.
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

export default function Oauth2CheatsheetPage() {
  return (
    <CheatSheetShell
      items={ITEMS}
      categories={CATEGORIES}
      categoryColors={CATEGORY_COLOR}
      categoryLabels={CATEGORY_LABEL}
      translations={translations}
      titleIcon={<KeyOutlined />}
      alertIcon={<SafetyOutlined />}
      alertType="warning"
      markdownHeader={'# OAuth2 / OIDC Cheat Sheet\n\n'}
      markdownFence={'```'}
      codeWrapped
      codeColor={null}
      keyMode="codePrefix"
      matchCategoryLabel
    />
  )
}
