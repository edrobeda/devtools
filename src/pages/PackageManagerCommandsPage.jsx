import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Table } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const ROWS = [
  { pt: 'Instala todas as dependências do projeto', en: 'Installs all project dependencies', npm: 'npm install', yarn: 'yarn install', pnpm: 'pnpm install' },
  { pt: 'Adiciona uma dependência', en: 'Adds a dependency', npm: 'npm install pacote', yarn: 'yarn add pacote', pnpm: 'pnpm add pacote' },
  { pt: 'Adiciona uma dependência de desenvolvimento', en: 'Adds a dev dependency', npm: 'npm install -D pacote', yarn: 'yarn add -D pacote', pnpm: 'pnpm add -D pacote' },
  { pt: 'Adiciona um pacote global', en: 'Adds a global package', npm: 'npm install -g pacote', yarn: 'yarn global add pacote', pnpm: 'pnpm add -g pacote' },
  { pt: 'Instala uma versão exata (sem ^/~)', en: 'Installs an exact version (no ^/~)', npm: 'npm install pacote --save-exact', yarn: 'yarn add pacote --exact', pnpm: 'pnpm add pacote --save-exact' },
  { pt: 'Remove uma dependência', en: 'Removes a dependency', npm: 'npm uninstall pacote', yarn: 'yarn remove pacote', pnpm: 'pnpm remove pacote' },
  { pt: 'Atualiza um pacote específico', en: 'Updates a specific package', npm: 'npm update pacote', yarn: 'yarn upgrade pacote', pnpm: 'pnpm update pacote' },
  { pt: 'Atualiza todas as dependências (respeitando ranges do package.json)', en: 'Updates all dependencies (respecting package.json ranges)', npm: 'npm update', yarn: 'yarn upgrade', pnpm: 'pnpm update' },
  { pt: 'Lista pacotes desatualizados', en: 'Lists outdated packages', npm: 'npm outdated', yarn: 'yarn outdated', pnpm: 'pnpm outdated' },
  { pt: 'Roda um script definido no package.json', en: 'Runs a script defined in package.json', npm: 'npm run script', yarn: 'yarn script', pnpm: 'pnpm script' },
  { pt: 'Executa um binário sem instalar globalmente', en: 'Runs a binary without installing it globally', npm: 'npx pacote', yarn: 'yarn dlx pacote', pnpm: 'pnpm dlx pacote' },
  { pt: 'Instala exatamente o que está no lockfile (uso em CI)', en: 'Installs exactly what the lockfile says (CI use)', npm: 'npm ci', yarn: 'yarn install --immutable', pnpm: 'pnpm install --frozen-lockfile' },
  { pt: 'Inicializa um package.json novo', en: 'Initializes a new package.json', npm: 'npm init', yarn: 'yarn init', pnpm: 'pnpm init' },
  { pt: 'Limpa o cache local de pacotes', en: 'Clears the local package cache', npm: 'npm cache clean --force', yarn: 'yarn cache clean', pnpm: 'pnpm store prune' },
  { pt: 'Mostra a árvore de dependências instaladas', en: 'Shows the installed dependency tree', npm: 'npm ls', yarn: 'yarn list', pnpm: 'pnpm list' },
  { pt: 'Explica por que um pacote está instalado (quem depende dele)', en: 'Explains why a package is installed (who depends on it)', npm: 'npm why pacote', yarn: 'yarn why pacote', pnpm: 'pnpm why pacote' },
  { pt: 'Audita dependências por vulnerabilidades conhecidas', en: 'Audits dependencies for known vulnerabilities', npm: 'npm audit', yarn: 'yarn npm audit', pnpm: 'pnpm audit' },
  { pt: 'Executa um comando em todos os workspaces', en: 'Runs a command across all workspaces', npm: 'npm run script --workspaces', yarn: 'yarn workspaces run script', pnpm: 'pnpm -r run script' },
  { pt: 'Adiciona uma dependência a um workspace específico', en: 'Adds a dependency to a specific workspace', npm: 'npm install pacote -w nome', yarn: 'yarn workspace nome add pacote', pnpm: 'pnpm add pacote --filter nome' },
  { pt: 'Vincula um pacote local pra desenvolvimento (symlink)', en: 'Links a local package for development (symlink)', npm: 'npm link', yarn: 'yarn link', pnpm: 'pnpm link --global' },
  { pt: 'Mostra a versão instalada', en: 'Shows the installed version', npm: 'npm --version', yarn: 'yarn --version', pnpm: 'pnpm --version' },
]

const translations = {
  pt: {
    title: 'npm vs yarn vs pnpm',
    intro: 'Tabela comparativa dos comandos mais usados no dia a dia nos três gerenciadores de pacote mais comuns do ecossistema Node.js — útil pra quem transita entre projetos que usam gerenciadores diferentes.',
    search: 'Buscar ação ou comando...',
    action: 'Ação',
    empty: 'Nenhum comando encontrado.',
  },
  en: {
    title: 'npm vs yarn vs pnpm',
    intro: 'A comparison table of the most commonly used day-to-day commands across the three most common Node.js package managers — handy for anyone moving between projects that use different ones.',
    search: 'Search action or command...',
    action: 'Action',
    empty: 'No command found.',
  },
}

export default function PackageManagerCommandsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ROWS
    return ROWS.filter((r) =>
      r[lang].toLowerCase().includes(q) ||
      r.npm.toLowerCase().includes(q) ||
      r.yarn.toLowerCase().includes(q) ||
      r.pnpm.toLowerCase().includes(q))
  }, [query, lang])

  const columns = [
    { title: t.action, dataIndex: lang, key: 'action', width: '28%' },
    { title: 'npm', dataIndex: 'npm', key: 'npm', render: (v) => <Text code>{v}</Text> },
    { title: 'yarn', dataIndex: 'yarn', key: 'yarn', render: (v) => <Text code>{v}</Text> },
    { title: 'pnpm', dataIndex: 'pnpm', key: 'pnpm', render: (v) => <Text code>{v}</Text> },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Input
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search}
        allowClear
      />

      <Card>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey={(r) => r.en}
          pagination={false}
          size="small"
          scroll={{ x: true }}
          locale={{ emptyText: t.empty }}
        />
      </Card>
    </Space>
  )
}
