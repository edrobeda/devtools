import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'motion', 'editing', 'search', 'visual', 'windows', 'registers', 'config']

const CATEGORY_COLOR = {
  basics: 'blue',
  motion: 'green',
  editing: 'orange',
  search: 'purple',
  visual: 'cyan',
  windows: 'gold',
  registers: 'magenta',
  config: 'volcano',
}

const labelOf = {
  basics: { pt: 'Básico', en: 'Basics' },
  motion: { pt: 'Movimento', en: 'Motion' },
  editing: { pt: 'Edição', en: 'Editing' },
  search: { pt: 'Busca & substituição', en: 'Search & replace' },
  visual: { pt: 'Modo visual', en: 'Visual mode' },
  windows: { pt: 'Janelas & abas', en: 'Windows & tabs' },
  registers: { pt: 'Registradores & macros', en: 'Registers & macros' },
  config: { pt: 'Configuração', en: 'Configuration' },
}

const COMMANDS = [
  // ─── Básico ────────────────────────────────────────────────────────────────
  { cmd: 'vim arquivo.txt', cat: 'basics', pt: 'Abre o arquivo no editor (alias `vi`)', en: 'Opens the file in vim (alias `vi`)' },
  { cmd: 'vim -R arquivo.txt', cat: 'basics', pt: 'Abre em modo somente leitura (modo view)', en: 'Opens read-only (view mode)' },
  { cmd: 'i  /  I', cat: 'basics', pt: 'Entra no modo insert ANTES do cursor / no começo da linha', en: 'Enters insert mode BEFORE the cursor / at the start of the line' },
  { cmd: 'a  /  A', cat: 'basics', pt: 'Entra no modo insert DEPOIS do cursor / no fim da linha', en: 'Enters insert mode AFTER the cursor / at the end of the line' },
  { cmd: 'o  /  O', cat: 'basics', pt: 'Cria uma linha nova abaixo / acima e já entra em insert', en: 'Opens a new line below / above and enters insert' },
  { cmd: 'Esc  /  Ctrl-[', cat: 'basics', pt: 'Volta pro modo NORMAL a partir de qualquer modo', en: 'Returns to NORMAL mode from any other mode' },
  { cmd: ':w', cat: 'basics', pt: 'Salva o arquivo (write)', en: 'Saves the file (write)' },
  { cmd: ':wq  /  :x  /  ZZ', cat: 'basics', pt: 'Salva e fecha', en: 'Saves and quits' },
  { cmd: ':q', cat: 'basics', pt: 'Fecha — RECUSA se houver mudanças não salvas', en: 'Quits — REFUSES if there are unsaved changes' },
  { cmd: ':q!  /  ZQ', cat: 'basics', pt: 'Fecha descartando TODAS as mudanças', en: 'Quits discarding ALL changes' },

  // ─── Movimento ─────────────────────────────────────────────────────────────
  { cmd: 'h  j  k  l', cat: 'motion', pt: 'Esquerda / baixo / cima / direita', en: 'Left / down / up / right' },
  { cmd: 'w', cat: 'motion', pt: 'Pula pro começo da PRÓXIMA palavra', en: 'Jumps to the start of the NEXT word' },
  { cmd: 'b', cat: 'motion', pt: 'Pula pro começo da palavra ANTERIOR', en: 'Jumps to the start of the PREVIOUS word' },
  { cmd: 'e', cat: 'motion', pt: 'Pula pro FIM da palavra atual', en: 'Jumps to the END of the current word' },
  { cmd: '0', cat: 'motion', pt: 'Começo da linha (coluna 0)', en: 'Start of the line (column 0)' },
  { cmd: '^', cat: 'motion', pt: 'Primeiro caractere NÃO branco da linha', en: 'First NON-blank character of the line' },
  { cmd: '$', cat: 'motion', pt: 'Fim da linha', en: 'End of the line' },
  { cmd: 'gg  /  G', cat: 'motion', pt: 'Primeira linha / última linha do arquivo', en: 'First line / last line of the file' },
  { cmd: ':42  /  42G', cat: 'motion', pt: 'Vai direto pra linha 42', en: 'Goes straight to line 42' },
  { cmd: 'Ctrl-d  /  Ctrl-u', cat: 'motion', pt: 'Meia tela pra baixo / pra cima', en: 'Half screen down / up' },
  { cmd: 'Ctrl-f  /  Ctrl-b', cat: 'motion', pt: 'Tela inteira pra baixo / pra cima', en: 'Full screen down / up' },
  { cmd: '%', cat: 'motion', pt: 'Pula pro parêntese / chave / colchete correspondente', en: 'Jumps to the matching bracket / brace / paren' },
  { cmd: '{  /  }', cat: 'motion', pt: 'Bloco de parágrafo pra trás / pra frente (pula por linhas vazias)', en: 'Previous / next paragraph (jumps over blank lines)' },
  { cmd: 'fX', cat: 'motion', pt: 'Pula pro próximo caractere X na linha (f = find)', en: 'Jumps to the next X on the line (f = find)' },
  { cmd: 'tX', cat: 'motion', pt: 'Pula até um caractere ANTES do próximo X', en: 'Jumps until the char BEFORE the next X' },
  { cmd: ';  /  ,', cat: 'motion', pt: 'Repete o último f/t pra frente / pra trás', en: 'Repeats the last f/t forward / backward' },

  // ─── Edição ────────────────────────────────────────────────────────────────
  { cmd: 'x  /  X', cat: 'editing', pt: 'Apaga o caractere sob o cursor / o anterior', en: 'Deletes the char under / before the cursor' },
  { cmd: 'dd', cat: 'editing', pt: 'Apaga a linha INTEIRA', en: 'Deletes the WHOLE line' },
  { cmd: 'D', cat: 'editing', pt: 'Apaga do cursor até o fim da linha (como d$)', en: 'Deletes from cursor to end of line (like d$)' },
  { cmd: 'dw', cat: 'editing', pt: 'Apaga daqui até o fim da palavra', en: 'Deletes from here to the end of the word' },
  { cmd: 'daw', cat: 'editing', pt: 'Apaga a palavra INTEIRA, inclusive os espaços em volta', en: 'Deletes the whole word including surrounding spaces' },
  { cmd: 'cc', cat: 'editing', pt: 'Troca a linha inteira (apaga e entra em insert)', en: 'Changes the whole line (delete + insert)' },
  { cmd: 'cw', cat: 'editing', pt: 'Troca a palavra (apaga e entra em insert)', en: 'Changes the word (delete + insert)' },
  { cmd: 'rX', cat: 'editing', pt: 'Substitui o caractere sob o cursor por X', en: 'Replaces the char under the cursor with X' },
  { cmd: 'u  /  Ctrl-r', cat: 'editing', pt: 'Desfaz / refaz a última mudança', en: 'Undo / redo the last change' },
  { cmd: '.', cat: 'editing', pt: 'Repete a última mudança — o superpoder do vim', en: 'Repeats the last change — vim\'s superpower' },
  { cmd: 'yy', cat: 'editing', pt: 'Copia (yank) a linha inteira', en: 'Yanks the whole line' },
  { cmd: 'p  /  P', cat: 'editing', pt: 'Cola DEPOIS / ANTES do cursor', en: 'Pastes AFTER / BEFORE the cursor' },
  { cmd: 'J', cat: 'editing', pt: 'Junta a linha atual com a de baixo', en: 'Joins the current line with the one below' },
  { cmd: '~', cat: 'editing', pt: 'Alterna maiúscula/minúscula do caractere sob o cursor', en: 'Toggles case of the char under the cursor' },

  // ─── Busca & substituição ──────────────────────────────────────────────────
  { cmd: '/texto', cat: 'search', pt: 'Busca PRA FRENTE (aceita regex)', en: 'Searches FORWARD (regex allowed)' },
  { cmd: '?texto', cat: 'search', pt: 'Busca PRA TRÁS', en: 'Searches BACKWARD' },
  { cmd: 'n  /  N', cat: 'search', pt: 'Próxima ocorrência / ocorrência anterior', en: 'Next match / previous match' },
  { cmd: '*  /  #', cat: 'search', pt: 'Busca a palavra sob o cursor pra frente / pra trás', en: 'Searches the word under the cursor forward / backward' },
  { cmd: ':noh', cat: 'search', pt: 'Tira o destaque da última busca', en: 'Clears the search highlight' },
  { cmd: ':s/velho/novo', cat: 'search', pt: 'Substitui a PRIMEIRA ocorrência da linha', en: 'Replaces the FIRST match on the line' },
  { cmd: ':s/velho/novo/g', cat: 'search', pt: 'Substitui TODAS as ocorrências da linha', en: 'Replaces ALL matches on the line' },
  { cmd: ':%s/velho/novo/g', cat: 'search', pt: 'Substitui em TODO o arquivo', en: 'Replaces everywhere in the file' },
  { cmd: ':%s/velho/novo/gc', cat: 'search', pt: 'Como acima, mas pede confirmação a cada uma (c = confirm)', en: 'Same, but asks to confirm each one (c = confirm)' },
  { cmd: ':set hlsearch', cat: 'search', pt: 'Destaca as ocorrências da busca', en: 'Highlights search matches' },

  // ─── Modo visual ───────────────────────────────────────────────────────────
  { cmd: 'v', cat: 'visual', pt: 'Modo visual por caractere', en: 'Character-wise visual mode' },
  { cmd: 'V', cat: 'visual', pt: 'Modo visual por LINHA', en: 'Line-wise visual mode' },
  { cmd: 'Ctrl-v', cat: 'visual', pt: 'Modo visual em BLOCO (seleção retangular)', en: 'Block-wise visual mode (rectangle)' },
  { cmd: 'gv', cat: 'visual', pt: 'Re-seleciona a ÚLTIMA seleção visual', en: 'Re-selects the LAST visual selection' },
  { cmd: 'v: d / y', cat: 'visual', pt: 'Com a seleção ativa, d apaga e y copia', en: 'With an active selection, d deletes and y yanks' },
  { cmd: 'v: > / < / ~', cat: 'visual', pt: 'Com a seleção ativa, > e < indenta e ~ troca a caixa de todas as letras', en: 'With a selection, > and < indent and ~ swaps the case' },

  // ─── Janelas & abas ────────────────────────────────────────────────────────
  { cmd: ':sp [arquivo]', cat: 'windows', pt: 'Divide a janela horizontalmente (split)', en: 'Splits the window horizontally' },
  { cmd: ':vsp [arquivo]', cat: 'windows', pt: 'Divide a janela verticalmente', en: 'Splits the window vertically' },
  { cmd: 'Ctrl-w w', cat: 'windows', pt: 'Pula pra próxima janela', en: 'Jumps to the next window' },
  { cmd: 'Ctrl-w h/j/k/l', cat: 'windows', pt: 'Pula pra janela à esquerda / abaixo / acima / direita', en: 'Jumps to the window left / below / above / right' },
  { cmd: 'Ctrl-w =', cat: 'windows', pt: 'Iguala o tamanho das janelas', en: 'Equalizes the window sizes' },
  { cmd: ':tabnew [arquivo]', cat: 'windows', pt: 'Abre o arquivo numa aba nova', en: 'Opens the file in a new tab' },
  { cmd: 'gt  /  gT', cat: 'windows', pt: 'Próxima aba / aba anterior', en: 'Next tab / previous tab' },
  { cmd: ':ls', cat: 'windows', pt: 'Lista os buffers abertos (a noção de "arquivo" do vim)', en: 'Lists the open buffers (vim\'s notion of "file")' },
  { cmd: ':bn  /  :bp', cat: 'windows', pt: 'Próximo / anterior buffer', en: 'Next / previous buffer' },

  // ─── Registradores & macros ────────────────────────────────────────────────
  { cmd: '"a', cat: 'registers', pt: 'Prefixo de registrador nomeado: "ayy copia a linha no registrador a', en: 'Named register prefix: "ayy yanks the line into register a' },
  { cmd: '"ap', cat: 'registers', pt: 'Cola o conteúdo do registrador a', en: 'Pastes the contents of register a' },
  { cmd: '" (sem nome)', cat: 'registers', pt: 'Registrador sem nome: guarda o ÚLTIMO texto apagado/copiado (por isso p funciona após dd)', en: 'Unnamed register: holds the LAST deleted/yanked text (why p works after dd)' },
  { cmd: ':reg', cat: 'registers', pt: 'Lista o conteúdo de todos os registradores', en: 'Lists every register\'s contents' },
  { cmd: 'qa ... q', cat: 'registers', pt: 'GRAVA uma macro no registrador a (digite qa, as ações e q pra parar)', en: 'RECORDS a macro in register a (type qa, the actions, q to stop)' },
  { cmd: '@a', cat: 'registers', pt: 'EXECUTA a macro do registrador a', en: 'RUNS the macro in register a' },
  { cmd: '@@', cat: 'registers', pt: 'Repete a última macro', en: 'Repeats the last macro' },
  { cmd: ":'<,'>normal @a", cat: 'registers', pt: "Roda a macro uma vez por linha da seleção visual (o range '<,'> delimita a seleção)", en: "Runs the macro once per line of the visual selection (the '<,'> range marks the selection)" },

  // ─── Configuração ──────────────────────────────────────────────────────────
  { cmd: ':set number', cat: 'config', pt: 'Mostra o número das linhas', en: 'Shows line numbers' },
  { cmd: ':set relativenumber', cat: 'config', pt: 'Números RELATIVOS ao cursor (ótimo pro dd/yy com contagem)', en: 'Relative line numbers (great for counted dd/yy)' },
  { cmd: ':set paste', cat: 'config', pt: 'Modo paste: cola texto externo SEM reindentar sozinho', en: 'Paste mode: pastes external text WITHOUT auto-indenting' },
  { cmd: ':set mouse=a', cat: 'config', pt: 'Habilita o mouse em todos os modos', en: 'Enables the mouse in all modes' },
  { cmd: ':set tabstop=4', cat: 'config', pt: 'Um Tab ocupa 4 colunas', en: 'A tab fills 4 columns' },
  { cmd: ':set expandtab', cat: 'config', pt: 'Converte Tab em espaços', en: 'Converts tabs into spaces' },
  { cmd: ':set shiftwidth=4', cat: 'config', pt: 'Largura da indentação usada por > e < no normal', en: 'Width used by > and < for indenting' },
  { cmd: ':set ignorecase', cat: 'config', pt: 'Busca SEM diferenciar maiúscula de minúscula', en: 'Case-insensitive search' },
  { cmd: ':set smartcase', cat: 'config', pt: 'Se o padrão digitado tiver maiúscula, o ignorecase desliga sozinho', en: 'Turns ignorecase off if the pattern has an uppercase' },
  { cmd: ':syntax on', cat: 'config', pt: 'Ativa o destaque de sintaxe', en: 'Turns on syntax highlighting' },
  { cmd: ':source ~/.vimrc', cat: 'config', pt: 'Recarrega as configurações sem fechar o vim', en: 'Reloads the config without leaving vim' },
  { cmd: ':e arquivo', cat: 'config', pt: 'Abre outro arquivo no buffer atual', en: 'Opens another file in the current buffer' },
  { cmd: ':help COMANDO', cat: 'config', pt: 'Ajuda embutida — ex.: :help dd abre o manual do dd', en: 'Built-in help — e.g. :help dd opens the manual for dd' },
]

const translations = {
  pt: {
    title: 'Comandos Vim',
    intro: (
      <>
        Cheat sheet pesquisável do <Text code>vim</Text>, o editor de terminal
        que mora em todo Linux (mesmo nas boxes mais peladas, onde é o único
        editor disponível). A regra de ouro: quase tudo acontece no{' '}
        <Text code>modo NORMAL</Text>, com um comando = ação + alvo.{' '}
        Tudo client-side.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Modos e a gramática dos comandos',
    tipBody: (
      <>
        O vim tem 4 modos: <Text code>NORMAL</Text> (navegar/editar),{' '}
        <Text code>INSERT</Text> (digitar), <Text code>VISUAL</Text>{' '}
        (selecionar) e <Text code>COMANDO</Text> (a linha do{' '}
        <Text code>:</Text> — <Text code>:w</Text>, <Text code>:q</Text>).{' '}
        <Text code>Esc</Text> é a porta de saída de qualquer modo pra voltar
        pro NORMAL, e é lá que mora a força. Comandos seguem uma gramática:
        uma <Text code>ação</Text> (d apagar, c trocar, y copiar) + um{' '}
        <Text code>alvo</Text> (w palavra, $ fim da linha, G fim do arquivo),
        com contagem na frente: <Text code>3dd</Text> ou <Text code>d2w</Text>{' '}
        — e o <Text code>.</Text> repete a última mudança, virando "fazer uma
        vez, repetir pra sempre". As pegadinhas que mais pegam: <Text code>:q</Text>{' '}
        RECUSA a sair com alterações (use <Text code>:wq</Text> pra salvar ou{' '}
        <Text code>:q!</Text> pra descartar), <Text code>u</Text> desfaz e{' '}
        <Text code>Ctrl-r</Text> refaz, e o <Text code>~/.vimrc</Text> só é
        lido na abertura — depois de editar, rode{' '}
        <Text code>:source ~/.vimrc</Text>. E os movimentos não param no vim:
        aparecem no <Text code>tmux</Text> (modo copy), no VS Code (extensão
        Vim) e até no Chrome (Vimium).
      </>
    ),
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'Vim Commands',
    intro: (
      <>
        A searchable cheat sheet for <Text code>vim</Text>, the terminal
        editor that lives on every Linux box (even the most bare-bones ones,
        where it is the only editor available). The golden rule: almost
        everything happens in <Text code>NORMAL mode</Text>, and each command
        is action + target. All client-side.
      </>
    ),
    search: 'Search command or description...',
    all: 'All',
    empty: 'No command found. Try a different search or category.',
    tipTitle: 'Modes and the command grammar',
    tipBody: (
      <>
        Vim has 4 modes: <Text code>NORMAL</Text> (navigate/edit),{' '}
        <Text code>INSERT</Text> (typing), <Text code>VISUAL</Text>{' '}
        (selecting) and <Text code>COMMAND</Text> (the{' '}
        <Text code>:</Text> line — <Text code>:w</Text>, <Text code>:q</Text>).{' '}
        <Text code>Esc</Text> is the door out of any mode back to NORMAL, and
        NORMAL is where the power lives. Commands are grammatical: a{' '}
        <Text code>verb</Text> (d delete, c change, y yank) + a{' '}
        <Text code>motion</Text> (w word, $ end of line, G end of file), with
        counts in front: <Text code>3dd</Text> or <Text code>d2w</Text> — and{' '}
        <Text code>.</Text> repeats the last change, turning into "do it once,
        repeat forever". The gotchas that bite the most: <Text code>:q</Text>{' '}
        REFUSES to quit with unsaved changes (use <Text code>:wq</Text> to
        save or <Text code>:q!</Text> to discard), <Text code>u</Text> undoes
        and <Text code>Ctrl-r</Text> redoes, and <Text code>~/.vimrc</Text>{' '}
        is only read at startup — after editing it, run{' '}
        <Text code>:source ~/.vimrc</Text>. And the motions do not end at vim:
        they appear in <Text code>tmux</Text> (copy-mode), in VS Code (the Vim
        extension) and even in Chrome (Vimium).
      </>
    ),
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function VimCheatsheetPage() {
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
        messageApi.success(okMsg || t.copied)
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

      <Alert type="info" showIcon icon={<EditOutlined />} message={t.tipTitle} description={t.tipBody} />

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