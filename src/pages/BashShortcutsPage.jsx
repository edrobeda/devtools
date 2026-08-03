import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const SHORTCUTS = [
  { key: 'Ctrl+A', pt: 'Move o cursor para o início da linha', en: 'Move cursor to the beginning of the line', cat: 'movement' },
  { key: 'Ctrl+E', pt: 'Move o cursor para o final da linha', en: 'Move cursor to the end of the line', cat: 'movement' },
  { key: 'Alt+B', pt: 'Move o cursor uma palavra para trás', en: 'Move cursor back one word', cat: 'movement' },
  { key: 'Alt+F', pt: 'Move o cursor uma palavra para frente', en: 'Move cursor forward one word', cat: 'movement' },
  { key: 'Ctrl+←/→', pt: 'Pula uma palavra para trás/frente (em vários terminais)', en: 'Jump a word back/forward (in most terminals)', cat: 'movement' },
  { key: 'Ctrl+XX', pt: 'Alterna entre a posição atual e o início da linha', en: 'Toggle between current position and start of line', cat: 'movement' },
  { key: 'Ctrl+U', pt: 'Apaga da posição do cursor até o início da linha', en: 'Cut from cursor to the start of the line', cat: 'editing' },
  { key: 'Ctrl+K', pt: 'Apaga da posição do cursor até o final da linha', en: 'Cut from cursor to the end of the line', cat: 'editing' },
  { key: 'Ctrl+W', pt: 'Apaga a palavra antes do cursor', en: 'Cut the word before the cursor', cat: 'editing' },
  { key: 'Alt+D', pt: 'Apaga a palavra depois do cursor', en: 'Cut the word after the cursor', cat: 'editing' },
  { key: 'Ctrl+Y', pt: 'Cola o último texto apagado (yank)', en: 'Paste the last cut text (yank)', cat: 'editing' },
  { key: 'Ctrl+T', pt: 'Troca os dois caracteres antes do cursor de lugar', en: 'Swap the two characters before the cursor', cat: 'editing' },
  { key: 'Alt+T', pt: 'Troca as duas palavras antes do cursor de lugar', en: 'Swap the two words before the cursor', cat: 'editing' },
  { key: 'Alt+U', pt: 'Deixa a palavra atual em maiúsculas até o final', en: 'Uppercase the current word to its end', cat: 'editing' },
  { key: 'Alt+L', pt: 'Deixa a palavra atual em minúsculas até o final', en: 'Lowercase the current word to its end', cat: 'editing' },
  { key: 'Ctrl+_', pt: 'Desfaz a última edição na linha (undo)', en: 'Undo the last edit on the line', cat: 'editing' },
  { key: 'Ctrl+L', pt: 'Limpa a tela (equivalente ao comando `clear`)', en: 'Clear the screen (equivalent to `clear`)', cat: 'control' },
  { key: 'Ctrl+C', pt: 'Envia SIGINT, interrompe o processo em execução', en: 'Sends SIGINT, interrupts the running process', cat: 'control' },
  { key: 'Ctrl+D', pt: 'Envia EOF; fecha o shell se a linha estiver vazia', en: 'Sends EOF; closes the shell if the line is empty', cat: 'control' },
  { key: 'Ctrl+Z', pt: 'Suspende o processo em execução (retome com `fg`)', en: 'Suspends the running process (resume with `fg`)', cat: 'control' },
  { key: 'Ctrl+S', pt: 'Congela a saída do terminal (destrava com Ctrl+Q)', en: 'Freezes terminal output (unfreeze with Ctrl+Q)', cat: 'control' },
  { key: 'Ctrl+Q', pt: 'Destrava a saída congelada por Ctrl+S', en: 'Resumes output frozen by Ctrl+S', cat: 'control' },
  { key: 'Ctrl+R', pt: 'Busca reversa incremental no histórico de comandos', en: 'Incremental reverse search through command history', cat: 'history' },
  { key: 'Ctrl+G', pt: 'Sai da busca reversa sem executar nada', en: 'Exit reverse search without running anything', cat: 'history' },
  { key: '!!', pt: 'Repete o último comando executado', en: 'Repeats the last executed command', cat: 'history' },
  { key: '!$', pt: 'Repete o último argumento do comando anterior', en: 'Repeats the last argument of the previous command', cat: 'history' },
  { key: '!*', pt: 'Repete todos os argumentos do comando anterior', en: 'Repeats all arguments of the previous command', cat: 'history' },
  { key: '!n', pt: 'Executa o comando de número `n` no histórico (`history`)', en: 'Runs command number `n` from history (`history`)', cat: 'history' },
  { key: '!palavra', pt: 'Executa o último comando que começa com "palavra"', en: 'Runs the last command that started with "word"', cat: 'history' },
  { key: '^antigo^novo', pt: 'Repete o último comando substituindo "antigo" por "novo"', en: 'Repeats the last command replacing "old" with "new"', cat: 'history' },
  { key: 'Tab', pt: 'Autocompleta comando, caminho ou argumento', en: 'Autocompletes a command, path, or argument', cat: 'completion' },
  { key: 'Tab Tab', pt: 'Lista todas as opções possíveis de autocompletar', en: 'Lists all possible autocomplete options', cat: 'completion' },
  { key: 'cd -', pt: 'Volta para o diretório anterior', en: 'Goes back to the previous directory', cat: 'navigation' },
  { key: 'cd ~', pt: 'Vai direto para o diretório home', en: 'Goes straight to the home directory', cat: 'navigation' },
  { key: 'pushd/popd', pt: 'Empilha/desempilha diretórios pra alternar rapidamente entre eles', en: 'Push/pop directories to quickly jump between them', cat: 'navigation' },
  { key: 'comando &', pt: 'Roda o comando em segundo plano', en: 'Runs the command in the background', cat: 'jobs' },
  { key: 'jobs', pt: 'Lista os processos em segundo plano da sessão atual', en: 'Lists background jobs of the current session', cat: 'jobs' },
  { key: 'fg %n', pt: 'Traz o job número `n` de volta para primeiro plano', en: 'Brings job number `n` back to the foreground', cat: 'jobs' },
  { key: 'bg %n', pt: 'Continua o job número `n` pausado, mas em segundo plano', en: 'Resumes paused job number `n`, but in the background', cat: 'jobs' },
  { key: 'nohup comando &', pt: 'Roda o comando imune a hangup, sobrevive ao fechar o terminal', en: 'Runs the command immune to hangup, survives closing the terminal', cat: 'jobs' },
  { key: 'comando1 | comando2', pt: 'Pipe: manda a saída do primeiro comando pra entrada do segundo', en: 'Pipe: sends first command output into second command input', cat: 'redirection' },
  { key: 'comando > arquivo', pt: 'Redireciona a saída padrão para um arquivo, sobrescrevendo', en: 'Redirects stdout to a file, overwriting it', cat: 'redirection' },
  { key: 'comando >> arquivo', pt: 'Redireciona a saída padrão para um arquivo, adicionando ao final', en: 'Redirects stdout to a file, appending to it', cat: 'redirection' },
  { key: 'comando 2> arquivo', pt: 'Redireciona apenas a saída de erro (stderr) para um arquivo', en: 'Redirects only stderr to a file', cat: 'redirection' },
  { key: 'comando &> arquivo', pt: 'Redireciona stdout e stderr juntos para um arquivo', en: 'Redirects both stdout and stderr to a file', cat: 'redirection' },
  { key: 'comando < arquivo', pt: 'Usa um arquivo como entrada padrão do comando', en: 'Uses a file as the command\'s standard input', cat: 'redirection' },
]

const CATEGORY_LABELS = {
  pt: { movement: 'movimento', editing: 'edição de linha', control: 'controle', history: 'histórico', completion: 'autocomplete', navigation: 'navegação', jobs: 'jobs/background', redirection: 'pipes & redirecionamento' },
  en: { movement: 'movement', editing: 'line editing', control: 'control', history: 'history', completion: 'completion', navigation: 'navigation', jobs: 'jobs/background', redirection: 'pipes & redirection' },
}

const translations = {
  pt: {
    title: 'Atalhos de Terminal/Bash',
    intro: 'Referência rápida e pesquisável de atalhos de edição de linha (readline), controle de processos, histórico de comandos e truques de redirecionamento úteis no dia a dia em bash/zsh. A maioria também funciona em zsh por padrão, já que ambos usam readline/libedit.',
    search: 'Buscar atalho ou descrição...',
    empty: 'Nenhum atalho encontrado.',
  },
  en: {
    title: 'Terminal/Bash Shortcuts',
    intro: 'A quick, searchable reference of readline line-editing shortcuts, process control, command history, and redirection tricks useful day-to-day in bash/zsh. Most of these also work in zsh by default, since both build on readline/libedit.',
    search: 'Search shortcut or description...',
    empty: 'No shortcut found.',
  },
}

export default function BashShortcutsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SHORTCUTS
    return SHORTCUTS.filter(
      (s) =>
        s.key.toLowerCase().includes(q) ||
        s[lang].toLowerCase().includes(q),
    )
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
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space wrap size="middle">
                  <Text code>{item.key}</Text>
                  <Tag>{CATEGORY_LABELS[lang][item.cat]}</Tag>
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
