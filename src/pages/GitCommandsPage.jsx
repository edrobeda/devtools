import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, List, Tag } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const COMMANDS = [
  { cmd: 'git init', pt: 'Inicializa um repositório novo no diretório atual', en: 'Initializes a new repository in the current directory', cat: 'setup' },
  { cmd: 'git clone <url>', pt: 'Clona um repositório remoto', en: 'Clones a remote repository', cat: 'setup' },
  { cmd: 'git status', pt: 'Mostra o estado do working tree (mudanças, staged, untracked)', en: 'Shows the working tree state (changes, staged, untracked)', cat: 'inspect' },
  { cmd: 'git diff', pt: 'Mostra as mudanças ainda não staged', en: 'Shows changes not yet staged', cat: 'inspect' },
  { cmd: 'git diff --staged', pt: 'Mostra as mudanças já staged', en: 'Shows changes already staged', cat: 'inspect' },
  { cmd: 'git log --oneline', pt: 'Histórico de commits, uma linha cada', en: 'Commit history, one line each', cat: 'inspect' },
  { cmd: 'git add <arquivo>', pt: 'Adiciona um arquivo à staging area', en: 'Adds a file to the staging area', cat: 'commit' },
  { cmd: 'git add -p', pt: 'Adiciona mudanças interativamente, por trecho (hunk)', en: 'Interactively stages changes, hunk by hunk', cat: 'commit' },
  { cmd: 'git commit -m "msg"', pt: 'Cria um commit com as mudanças staged', en: 'Creates a commit with the staged changes', cat: 'commit' },
  { cmd: 'git commit --amend', pt: 'Edita o commit mais recente (não empurrado ainda)', en: 'Edits the most recent commit (not yet pushed)', cat: 'commit' },
  { cmd: 'git branch', pt: 'Lista branches locais', en: 'Lists local branches', cat: 'branch' },
  { cmd: 'git branch <nome>', pt: 'Cria uma branch nova sem trocar pra ela', en: 'Creates a new branch without switching to it', cat: 'branch' },
  { cmd: 'git checkout -b <nome>', pt: 'Cria e troca para uma branch nova', en: 'Creates and switches to a new branch', cat: 'branch' },
  { cmd: 'git switch <branch>', pt: 'Troca para uma branch existente', en: 'Switches to an existing branch', cat: 'branch' },
  { cmd: 'git merge <branch>', pt: 'Mescla uma branch na branch atual', en: 'Merges a branch into the current branch', cat: 'branch' },
  { cmd: 'git rebase <branch>', pt: 'Reaplica os commits atuais sobre outra branch', en: 'Replays current commits on top of another branch', cat: 'branch' },
  { cmd: 'git push', pt: 'Envia commits locais para o remoto', en: 'Pushes local commits to the remote', cat: 'remote' },
  { cmd: 'git push -u origin <branch>', pt: 'Envia e configura o upstream da branch', en: 'Pushes and sets the branch upstream', cat: 'remote' },
  { cmd: 'git pull', pt: 'Busca e mescla mudanças do remoto', en: 'Fetches and merges changes from the remote', cat: 'remote' },
  { cmd: 'git fetch', pt: 'Busca mudanças do remoto sem mesclar', en: 'Fetches changes from the remote without merging', cat: 'remote' },
  { cmd: 'git stash', pt: 'Guarda mudanças não commitadas temporariamente', en: 'Temporarily shelves uncommitted changes', cat: 'undo' },
  { cmd: 'git stash pop', pt: 'Aplica e remove o stash mais recente', en: 'Applies and removes the most recent stash', cat: 'undo' },
  { cmd: 'git reset --soft HEAD~1', pt: 'Desfaz o último commit, mantendo as mudanças staged', en: 'Undoes the last commit, keeping changes staged', cat: 'undo' },
  { cmd: 'git reset --hard HEAD~1', pt: 'Desfaz o último commit e descarta as mudanças (destrutivo)', en: 'Undoes the last commit and discards changes (destructive)', cat: 'undo' },
  { cmd: 'git revert <commit>', pt: 'Cria um novo commit que desfaz outro (seguro para histórico compartilhado)', en: 'Creates a new commit that undoes another (safe for shared history)', cat: 'undo' },
  { cmd: 'git checkout -- <arquivo>', pt: 'Descarta mudanças não staged em um arquivo', en: 'Discards unstaged changes in a file', cat: 'undo' },
  { cmd: 'git tag <nome>', pt: 'Cria uma tag no commit atual', en: 'Creates a tag at the current commit', cat: 'misc' },
  { cmd: 'git cherry-pick <commit>', pt: 'Aplica um commit específico de outra branch', en: 'Applies a specific commit from another branch', cat: 'misc' },
  { cmd: 'git blame <arquivo>', pt: 'Mostra quem alterou cada linha de um arquivo por último', en: 'Shows who last changed each line of a file', cat: 'misc' },
]

const translations = {
  pt: {
    title: 'Comandos Git Essenciais',
    intro: 'Referência rápida e pesquisável dos comandos git mais usados no dia a dia, com uma descrição curta de cada um.',
    search: 'Buscar comando ou descrição...',
    empty: 'Nenhum comando encontrado.',
  },
  en: {
    title: 'Essential Git Commands',
    intro: 'A quick, searchable reference of the most commonly used git commands, each with a short description.',
    search: 'Search command or description...',
    empty: 'No command found.',
  },
}

export default function GitCommandsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter((c) => c.cmd.toLowerCase().includes(q) || c[lang].toLowerCase().includes(q))
  }, [query, lang])

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
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space>
                  <Text code style={{ fontSize: 14 }}>{item.cmd}</Text>
                  <Tag>{item.cat}</Tag>
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
