import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ColumnWidthOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['sessions', 'windows', 'panes', 'copy', 'config', 'status', 'script']

const CATEGORY_COLOR = {
  sessions: 'purple',
  windows: 'blue',
  panes: 'green',
  copy: 'orange',
  config: 'volcano',
  status: 'gold',
  script: 'magenta',
}

const labelOf = {
  sessions: { pt: 'Sessões', en: 'Sessions' },
  windows: { pt: 'Janelas', en: 'Windows' },
  panes: { pt: 'Panes', en: 'Panes' },
  copy: { pt: 'Copiar & colar', en: 'Copy & paste' },
  config: { pt: 'Configuração', en: 'Configuration' },
  status: { pt: 'Barra de status', en: 'Status bar' },
  script: { pt: 'Automação & scripts', en: 'Automation & scripts' },
}

const COMMANDS = [
  // ─── Sessões ────────────────────────────────────────────────────────────
  { cmd: 'tmux new -s nome', cat: 'sessions', pt: 'Cria uma nova sessão nomeada e anexa nela', en: 'Starts a new named session and attaches to it' },
  { cmd: 'tmux', cat: 'sessions', pt: 'Cria uma sessão sem nome (padrão = nome do terminal)', en: 'Starts an unnamed session (defaults to terminal name)' },
  { cmd: 'tmux new -A -s nome', cat: 'sessions', pt: 'Anexa à sessão `nome` ou cria se ela não existir — o jeito ideal de rodar reuniões persistentes', en: 'Attaches to a named session, or creates it if missing — the go-to for persistent work' },
  { cmd: 'tmux ls', cat: 'sessions', pt: 'Lista as sessões em execução', en: 'Lists running sessions' },
  { cmd: 'tmux attach -t nome', cat: 'sessions', pt: 'Re-anexa a uma sessão desanexada (alias `tmux a`)', en: 'Reconnects to a detached session (alias `tmux a`)' },
  { cmd: 'prefix d', cat: 'sessions', pt: 'Desanexa a sessão atual — ela CONTINUA rodando em background', en: 'Detaches the current session — it KEEPS running in the background' },
  { cmd: 'tmux switch -t nome', cat: 'sessions', pt: 'Troca pra outra sessão sem desanexar', en: 'Switches to another session without detaching' },
  { cmd: 'tmux kill-session -t nome', cat: 'sessions', pt: 'Encerra uma sessão de verdade (e todas as janelas dela)', en: 'Actually terminates a session (and all its windows)' },

  // ─── Janelas ─────────────────────────────────────────────────────────────
  { cmd: '^b c', cat: 'windows', pt: 'Cria uma janela nova', en: 'Creates a new window' },
  { cmd: '^b n  /  ^b p', cat: 'windows', pt: 'Vai pra próxima / anterior janela', en: 'Goes to the next / previous window' },
  { cmd: '^b 0..9', cat: 'windows', pt: 'Vai direto pra janela de número N', en: 'Jumps to window number N' },
  { cmd: '^b w', cat: 'windows', pt: 'Lista interativa de janelas (navega com as setas + Enter)', en: 'Interactive window picker (arrows + Enter)' },
  { cmd: '^b ,', cat: 'windows', pt: 'Renomeia a janela atual', en: 'Renames the current window' },
  { cmd: '^b &', cat: 'windows', pt: 'Fecha a janela atual (pede confirmação)', en: 'Closes the current window (asks for confirmation)' },
  { cmd: '^b l', cat: 'windows', pt: 'Volta pra última janela usada', en: 'Jumps to the last used window' },

  // ─── Panes ────────────────────────────────────────────────────────────────
  { cmd: '^b %', cat: 'panes', pt: 'Divide a pane verticalmente (lado a lado)', en: 'Splits the pane vertically (side by side)' },
  { cmd: '^b "', cat: 'panes', pt: 'Divide a pane horizontalmente (uma acima, outra abaixo)', en: 'Splits the pane horizontally (stacked)' },
  { cmd: '^b seta ←/→/↑/↓', cat: 'panes', pt: 'Move o cursor pra pane vizinha na direção indicada', en: 'Moves focus to the adjacent pane in that direction' },
  { cmd: '^b o', cat: 'panes', pt: 'Pula entre as panes em ordem', en: 'Cycles through panes in order' },
  { cmd: '^b q', cat: 'panes', pt: 'Mostra os números das panes (digite o número pra pular direto)', en: 'Shows pane numbers (type one to jump straight there)' },
  { cmd: '^b x', cat: 'panes', pt: 'Fecha a pane atual (pede confirmação)', en: 'Closes the current pane (asks for confirmation)' },
  { cmd: '^b z', cat: 'panes', pt: 'Alterna a pane atual entre maximizada e normal (zoom)', en: 'Toggles the current pane between zoomed and normal' },
  { cmd: '^b !', cat: 'panes', pt: 'Transforma a pane atual numa janela própria', en: 'Breaks the current pane into its own window' },
  { cmd: '^b }  /  ^b {', cat: 'panes', pt: 'Move a pane atual pra direita / esquerda na ordem', en: 'Moves the current pane right / left in the order' },
  { cmd: '^b ;', cat: 'panes', pt: 'Volta à última pane usada', en: 'Jumps to the last used pane' },
  { cmd: '^b Space', cat: 'panes', pt: 'Gira o layout das panes (next-layout)', en: 'Rotates the pane layout' },

  // ─── Copiar & colar ────────────────────────────────────────────────────────
  { cmd: '^b [', cat: 'copy', pt: 'Entra em copy-mode: permite rolar o scrollback e selecionar com mouse ou setas', en: 'Enters copy-mode: lets you scroll back and select with the mouse or arrows' },
  { cmd: 'copy-mode: v / Enter / q', cat: 'copy', pt: 'Dentro do modo copy: `v` (ou `Space`) inicia a seleção, `Enter` copia e sai, `q` sai sem copiar', en: 'Inside copy-mode: `v` (or `Space`) starts a selection, `Enter` copies and exits, `q` cancels' },
  { cmd: '^b ]', cat: 'copy', pt: 'Cola o buffer mais recente', en: 'Pastes the most recent buffer' },
  { cmd: '^b #', cat: 'copy', pt: 'Lista os buffers guardados', en: 'Lists the saved buffers' },
  { cmd: '^b =', cat: 'copy', pt: 'Abre o seletor visual de buffers pra escolher o que colar', en: 'Opens an interactive buffer picker to choose what to paste' },
  { cmd: '^b -', cat: 'copy', pt: 'Apaga um buffer específico', en: 'Deletes a specific buffer' },
  { cmd: 'bind -t copy-mode-vi Enter send-keys -X copy-pipe-and-cancel "pbcopy"', cat: 'copy', pt: 'No modo copy, enter copia direto pro clipboard do sistema (Linux: troque por `xclip -selection c`)', en: 'In copy-mode, Enter copies straight to the system clipboard (Linux: use `xclip -selection c`)' },

  // ─── Configuração ─────────────────────────────────────────────────────────
  { cmd: '~/.tmux.conf', cat: 'config', pt: 'Necessário de seedépolo: arquivo carregado na inicialização do tmux', en: 'Per-user config file, loaded when tmux starts' },
  { cmd: 'tmux source-file ~/.tmux.conf', cat: 'config', pt: 'Recarrega a config sem reiniciar o tmux (alias: `^b :` + `source-file ...`)', en: 'Reloads the config without restarting tmux (also via `^b :`)' },
  { cmd: '^b :', cat: 'config', pt: 'Abre o prompt de comando do tmux (digite um comando e Enter)', en: 'Opens the tmux command prompt (type a command + Enter)' },
  { cmd: 'set -g mouse on', cat: 'config', pt: 'Habilita mouse: clicar nas panes, selecionar, scroll', en: 'Enables mouse: click panes, select, scroll' },
  { cmd: 'set -g prefix C-a', cat: 'config', pt: 'Troca o prefixo padrão `^b` por `^a`', en: 'Swaps the default prefix `^b` for `^a`' },
  { cmd: 'set -g base-index 1', cat: 'config', pt: 'Janelas numeradas a partir de 1 (em vez de 0)', en: 'Numbers windows from 1 instead of 0' },
  { cmd: 'set -g window-size xlarge', cat: 'config', pt: 'Força panes remapeadas nunca ficarem menores que o terminal real', en: 'Keeps panes from ever being smaller than the real terminal' },
  { cmd: 'setw -g mode-keys vim', cat: 'config', pt: 'Usa teclas do vim (h/j/k/l, w/b, 0, $) no modo copy', en: 'Uses vim keys (h/j/k/l, w/b, 0, $) in copy-mode' },

  // ─── Barra de status ──────────────────────────────────────────────────────
  { cmd: 'set -g status-left "#[bg=green]#S"', cat: 'status', pt: 'Seção esquerda: nome da sessão realçado de verde', en: 'Left section: session name highlighted in green' },
  { cmd: 'set -g status-right "#[bg=blue] %H:%M"', cat: 'status', pt: 'Seção direita: relógio do modo status atualizável', en: 'Right section: a clock (updatable in status mode)' },
  { cmd: 'set -g status-interval 5', cat: 'status', pt: 'Atualiza a barra de status a cada 5s', en: 'Refreshes the status bar every 5s' },
  { cmd: '^b t', cat: 'status', pt: 'Mostra um relógio grande que some quando você digita qualquer tecla', en: 'Shows a big clock that vanishes on any keypress' },
  { cmd: 'set -g status-position top', cat: 'status', pt: 'Move a barra de status pro topo (padrão é embaixo)', en: 'Moves the status bar to the top (default is bottom)' },
  { cmd: 'set -g status-bg colour234', cat: 'status', pt: 'Cor de fundo da barra (usada as 256 cores ou hex `#232323`)', en: 'Status bar background (256-color or hex, e.g. `#232323`)' },

  // ─── Automação & scripts ─────────────────────────────────────────────────
  { cmd: "tmux new-session -d -s app -c ~/projeto 'npm run dev'", cat: 'script', pt: 'Sobe uma sessão DESANEXADA já rodando o comando — perfeita pra daemon/dev server', en: 'Starts a detached session already running a command — great as a daemon/dev server' },
  { cmd: "tmux send-keys -t app 'npm test' Enter", cat: 'script', pt: 'Digita texto e Enter numa sessão específica', en: 'Types text and Enter into a specific session' },
  { cmd: 'tmux new-window -t app', cat: 'script', pt: 'Cria janela que já herda o diretório da sessão', en: 'Creates a window that inherits the session working dir' },
  { cmd: 'tmux split-window -h -t app', cat: 'script', pt: 'Divide uma pane programaticamente', en: 'Splits a pane programmatically' },
  { cmd: 'tmux display-message -p "#{pane_pid}"', cat: 'script', pt: 'Imprime variáveis da pane (pid, path, título...)', en: 'Prints pane variables (pid, path, title...)' },
  { cmd: 'tmux capture-pane -t app -pS -20', cat: 'script', pt: 'Captura as últimas linha do buffer da pane p' , en: 'Dumps the last 20 lines of a pane buffer to stdout' },
  { cmd: 'tmux kill-server', cat: 'script', pt: 'Fecha o servidor: mata TODAS as sessões', en: 'Kills the server: terminates every session' },
]

const translations = {
  pt: {
    title: 'Comandos tmux',
    intro: (
      <>
        Cheat sheet pesquisável do <Text code>tmux</Text>, o terminal
        multiplexer que vive dentro do SSH e deixa o trabalho sobreviver à
        queda da conexão. Todo comando externo começa com <Text code>tmux
        ...</Text>; o que vem depois de <Text code>^b</Text> é a "prefix key"
        — o atalho que o tmux enxerga quando a tecla NÃO vai pro programa
        rodando na tela. Tudo client-side.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    tipTitle: 'O esqueleto mental',
    tipBody: (
      <>
        Três níveis: <Text code>servidor</Text> (tudo de uma máquina) →
        <Text code>sessão</Text> (um posto de trabalho) → <Text code>janela</Text>
        → <Text code>pane</Text> (o fragmento de tela). A sacada do tmux é o
        <Text code>^b</Text>: o prefixo "consome" o <Text code>^b</Text> e o
        próximo caractere é AÇÃO do tmux, não do programa. Comece com{' '}
        <Text code>tmux new -A -s main</Text> (com hora no SSH) +{' '}
        <Text code>^b d</Text> pra desanexar — a sessão fica viva, vem e viu.
        Dois pegadinhas de config: se o mouse não rola, adicione{' '}
        <Text code>set -g mouse on</Text> no <Text code>~/.tmux.conf</Text>
        (e recarregue com <Text code>tmux source-file ~/.tmux.conf</Text>), e{' '}
        o prefixo <Text code>^b</Text> briga com apps em modo insert
        (vim/shell) — por isso a maioria troca pra{' '}
        <Text code>C-a</Text>.
      </>
    ),
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copiedTitle: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'tmux Commands',
    intro: (
      <>
        A searchable cheat sheet for <Text code>tmux</Text>, the terminal
        multiplexer that makes your SSH sessions survive a dropped
        connection. Every command typed from the shell starts with{' '}
        <Text code>tmux ...</Text>; everything after <Text>^b</Text> is the
        "prefix key" — the keystroke tmux captures instead of the program
        running on screen. All client-side.
      </>
    ),
    search: 'Search command or description...',
    all: 'All',
    empty: 'No command found. Try a different search or category.',
    tipTitle: 'How to read it',
    tipBody: (
      <>
        Three circles: <Text code>server</Text> (everything on a machine) →
        <Text code>session</Text> (a workspace) → <Text code>window</Text>
        → <Text code>pane</Text> (a split of that window). The prefix is
        the elevator: <Text code>^b</Text> plus the next character is a tmux
        command, never the running program. Start with{' '}
        <Text code>tmux new -t main</Text> in SSH, then{' '}
        <Text code>^b d</Text> to detach — the session keeps running. Two
        config gotchas: if the mouse does not work add{' '}
        <Text code>set -g mouse on</Text> to <Text code>~/.tmux.conf</Text>{' '}
        and reload with <Text code>tmux source-file ~/.tmux.conf</Text>;&nbsp;
        and the default prefix <Text code>^b</Text> conflicts with insert
        mode in editors like vim — most people switch to{' '}
        <Text code>C-a</Text>.
      </>
    ),
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copiedTitle: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function TmuxCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\|/g, '\\|')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copiedTitle)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<ColumnWidthOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
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