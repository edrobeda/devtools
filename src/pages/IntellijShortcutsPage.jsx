import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Alert } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const SHORTCUTS = [
  // ─── Geral ─────────────────────────────────────────────────────────
  { win: 'Shift Shift', mac: 'Shift Shift', pt: 'Buscar qualquer coisa no projeto (classe, arquivo, ação, símbolo, setting)', en: 'Search anything in the project (class, file, action, symbol, setting)', cat: 'general' },
  { win: 'Ctrl+Shift+A', mac: 'Cmd+Shift+A', pt: 'Executar qualquer ação pelo nome (abre tool window, muda setting)', en: 'Run any action by name (open a tool window, change a setting)', cat: 'general' },
  { win: 'Ctrl+Alt+S', mac: 'Cmd+,', pt: 'Abrir as configurações do IDE (Settings / Preferences)', en: 'Open the IDE settings (Settings / Preferences)', cat: 'general' },
  { win: 'Alt+Insert', mac: 'Cmd+N', pt: 'Gerar código: getters, setters, construtores, equals/hashCode, toString...', en: 'Generate code: getters, setters, constructors, equals/hashCode, toString...', cat: 'general' },
  { win: 'Alt+Enter', mac: 'Opt+Enter', pt: 'Mostrar ações de intenção e correções rápidas no cursor', en: 'Show intention actions and quick-fixes at the caret', cat: 'general' },
  { win: 'Esc', mac: 'Esc', pt: 'Voltar o foco para o editor a partir de qualquer janela', en: 'Return focus to the editor from any tool window', cat: 'general' },

  // ─── Navegação ─────────────────────────────────────────────────────
  { win: 'Ctrl+N', mac: 'Cmd+O', pt: 'Ir para uma classe pelo nome', en: 'Go to a class by name', cat: 'navigation' },
  { win: 'Ctrl+Shift+N', mac: 'Cmd+Shift+O', pt: 'Ir para um arquivo pelo nome', en: 'Go to a file by name', cat: 'navigation' },
  { win: 'Ctrl+Alt+Shift+N', mac: 'Opt+Cmd+O', pt: 'Ir para um símbolo (método/campo) pelo nome', en: 'Go to a symbol (method/field) by name', cat: 'navigation' },
  { win: 'Ctrl+G', mac: 'Cmd+L', pt: 'Ir para uma linha (e coluna) específica', en: 'Go to a specific line (and column)', cat: 'navigation' },
  { win: 'Ctrl+E', mac: 'Cmd+E', pt: 'Lista dos arquivos abertos recentemente', en: 'Recently opened files list', cat: 'navigation' },
  { win: 'Ctrl+Alt+← / Ctrl+Alt+→', mac: 'Cmd+[ / Cmd+]', pt: 'Voltar/avançar no histórico de navegação', en: 'Navigate back/forward in the navigation history', cat: 'navigation' },
  { win: 'Ctrl+B', mac: 'Cmd+B', pt: 'Ir para a declaração do símbolo no cursor', en: 'Go to the declaration of the symbol at the caret', cat: 'navigation' },
  { win: 'Ctrl+Alt+B', mac: 'Opt+Cmd+B', pt: 'Ir para as implementações (exceto a que está no cursor)', en: 'Go to the implementations (other than the current one)', cat: 'navigation' },
  { win: 'Ctrl+U', mac: 'Cmd+U', pt: 'Ir para o super-método / super-classe', en: 'Go to the super-method / super-class', cat: 'navigation' },
  { win: 'Ctrl+H', mac: 'Cmd+H', pt: 'Abrir a hierarquia de tipos', en: 'Open the type hierarchy', cat: 'navigation' },
  { win: 'Ctrl+F12', mac: 'Cmd+F12', pt: 'Ver a estrutura do arquivo atual (métodos e campos)', en: 'View the current file structure (methods and fields)', cat: 'navigation' },
  { win: 'F2 / Shift+F2', mac: 'F2 / Shift+F2', pt: 'Pular entre erros e avisos destacados', en: 'Jump between highlighted errors and warnings', cat: 'navigation' },
  { win: 'Ctrl+Shift+Backspace', mac: 'Cmd+Shift+Backspace', pt: 'Pular para o último local editado', en: 'Jump to the last edit location', cat: 'navigation' },

  // ─── Busca ─────────────────────────────────────────────────────────
  { win: 'Ctrl+F', mac: 'Cmd+F', pt: 'Buscar no arquivo atual', en: 'Find in the current file', cat: 'search' },
  { win: 'Ctrl+R', mac: 'Cmd+R', pt: 'Substituir no arquivo atual', en: 'Replace in the current file', cat: 'search' },
  { win: 'F3 / Shift+F3', mac: 'Cmd+G / Cmd+Shift+G', pt: 'Ir para a próxima/anterior ocorrência da busca', en: 'Jump to the next/previous search match', cat: 'search' },
  { win: 'Ctrl+Shift+F', mac: 'Cmd+Shift+F', pt: 'Buscar em todos os arquivos do projeto', en: 'Find in all project files', cat: 'search' },
  { win: 'Ctrl+Shift+R', mac: 'Cmd+Shift+R', pt: 'Substituir em todos os arquivos do projeto', en: 'Replace in all project files', cat: 'search' },
  { win: 'Alt+F7', mac: 'Opt+F7', pt: 'Encontrar todos os usos do símbolo', en: 'Find all usages of the symbol', cat: 'search' },
  { win: 'Ctrl+Alt+F7', mac: 'Opt+Cmd+F7', pt: 'Ver os usos do símbolo num popup', en: 'Show usages of the symbol in a popup', cat: 'search' },

  // ─── Edição ────────────────────────────────────────────────────────
  { win: 'Ctrl+D', mac: 'Cmd+D', pt: 'Duplicar a linha ou seleção atual', en: 'Duplicate the current line or selection', cat: 'editing' },
  { win: 'Ctrl+Y', mac: 'Cmd+Backspace', pt: 'Apagar a linha no cursor', en: 'Delete the line at the caret', cat: 'editing' },
  { win: 'Ctrl+/', mac: 'Cmd+/', pt: 'Comentar/descomentar com comentário de linha', en: 'Comment/uncomment with a line comment', cat: 'editing' },
  { win: 'Ctrl+Shift+/', mac: 'Cmd+Shift+/', pt: 'Comentar/descomentar como bloco', en: 'Comment/uncomment as a block', cat: 'editing' },
  { win: 'Alt+Shift+↑ / Alt+Shift+↓', mac: 'Opt+Shift+↑ / Opt+Shift+↓', pt: 'Mover a linha atual para cima/baixo', en: 'Move the current line up/down', cat: 'editing' },
  { win: 'Ctrl+W', mac: 'Opt+↑', pt: 'Selecionar blocos de código cada vez maiores', en: 'Select successively larger code blocks', cat: 'editing' },
  { win: 'Ctrl+Shift+W', mac: 'Opt+↓', pt: 'Diminuir a seleção até o nível anterior', en: 'Decrease the selection to the previous level', cat: 'editing' },
  { win: 'Shift+Enter', mac: 'Shift+Enter', pt: 'Iniciar uma nova linha abaixo (de qualquer posição)', en: 'Start a new line below (from any position)', cat: 'editing' },
  { win: 'Ctrl+Shift+Enter', mac: 'Cmd+Shift+Enter', pt: 'Completar a declaração atual (fecha parênteses/chaves e ponto e vírgula)', en: 'Complete the current statement (close parens/braces and semicolon)', cat: 'editing' },
  { win: 'Ctrl+Shift+J', mac: 'Ctrl+Shift+J', pt: 'Juntar linhas', en: 'Join lines', cat: 'editing' },
  { win: 'Ctrl+Alt+L', mac: 'Opt+Cmd+L', pt: 'Reformatar o código conforme o estilo do projeto', en: 'Reformat the code according to the project style', cat: 'editing' },
  { win: 'Ctrl+Alt+O', mac: 'Opt+Cmd+O', pt: 'Organizar e remover imports não usados', en: 'Organize and remove unused imports', cat: 'editing' },
  { win: 'Ctrl+Space', mac: 'Ctrl+Space', pt: 'Autocomplete básico', en: 'Basic code completion', cat: 'editing' },
  { win: 'Ctrl+Shift+Space', mac: 'Cmd+Shift+Space', pt: 'Autocomplete inteligente (filtra pelo tipo esperado)', en: 'Smart code completion (filters by the expected type)', cat: 'editing' },
  { win: 'Ctrl+P', mac: 'Cmd+P', pt: 'Ver os parâmetros esperados da chamada', en: 'View the expected parameters of the call', cat: 'editing' },
  { win: 'Ctrl+Q', mac: 'Ctrl+J', pt: 'Ver a documentação rápida do símbolo', en: 'View quick documentation of the symbol', cat: 'editing' },
  { win: 'Ctrl+Alt+T', mac: 'Opt+Cmd+T', pt: 'Envolver a seleção (if, try/catch, for, synchronized...)', en: 'Surround the selection (if, try/catch, for, synchronized...)', cat: 'editing' },

  // ─── Refatoração ───────────────────────────────────────────────────
  { win: 'Ctrl+Alt+Shift+T', mac: 'Ctrl+T', pt: 'Menu de refatorações disponíveis no contexto', en: 'Show the contextual refactoring menu', cat: 'refactoring' },
  { win: 'Shift+F6', mac: 'Shift+F6', pt: 'Renomear o símbolo em todas as ocorrências', en: 'Rename the symbol in all occurrences', cat: 'refactoring' },
  { win: 'Ctrl+Alt+M', mac: 'Opt+Cmd+M', pt: 'Extrair a seleção para um método', en: 'Extract the selection into a method', cat: 'refactoring' },
  { win: 'Ctrl+Alt+V', mac: 'Opt+Cmd+V', pt: 'Extrair a seleção para uma variável', en: 'Extract the selection into a variable', cat: 'refactoring' },
  { win: 'Ctrl+Alt+F', mac: 'Opt+Cmd+F', pt: 'Extrair a seleção para um campo de classe', en: 'Extract the selection into a class field', cat: 'refactoring' },
  { win: 'Ctrl+Alt+C', mac: 'Opt+Cmd+C', pt: 'Extrair a seleção para uma constante', en: 'Extract the selection into a constant', cat: 'refactoring' },
  { win: 'Ctrl+Alt+P', mac: 'Opt+Cmd+P', pt: 'Extrair a seleção para um parâmetro', en: 'Extract the selection into a parameter', cat: 'refactoring' },
  { win: 'Ctrl+Alt+N', mac: 'Opt+Cmd+N', pt: 'Inline (reverter uma extração anterior)', en: 'Inline the symbol (reverse a previous extraction)', cat: 'refactoring' },

  // ─── Execução / Depuração ──────────────────────────────────────────
  { win: 'Shift+F10', mac: 'Ctrl+R', pt: 'Executar a configuração atual', en: 'Run the current configuration', cat: 'run' },
  { win: 'Shift+F9', mac: 'Ctrl+D', pt: 'Depurar a configuração atual', en: 'Debug the current configuration', cat: 'run' },
  { win: 'F9', mac: 'Opt+Cmd+R', pt: 'Continuar a execução após um breakpoint', en: 'Resume the program after a breakpoint', cat: 'run' },
  { win: 'Ctrl+F2', mac: 'Cmd+F2', pt: 'Parar a execução/depuração', en: 'Stop the run/debug session', cat: 'run' },
  { win: 'F8', mac: 'F8', pt: 'Passar por cima da chamada (executa sem entrar)', en: 'Step over the call (execute without entering)', cat: 'run' },
  { win: 'F7', mac: 'F7', pt: 'Entrar na chamada', en: 'Step into the call', cat: 'run' },
  { win: 'Shift+F8', mac: 'Shift+F8', pt: 'Sair da chamada atual', en: 'Step out of the current call', cat: 'run' },
  { win: 'Ctrl+F8', mac: 'Cmd+F8', pt: 'Alternar um breakpoint na linha atual', en: 'Toggle a line breakpoint', cat: 'run' },
  { win: 'Ctrl+Shift+F8', mac: 'Cmd+Shift+F8', pt: 'Gerenciar todos os breakpoints', en: 'View and manage all breakpoints', cat: 'run' },

  // ─── Git / VCS ─────────────────────────────────────────────────────
  { win: 'Alt+`', mac: 'Ctrl+V', pt: 'Popup rápido de operações Git no arquivo/projeto', en: 'Quick Git operations popup for the file/project', cat: 'vcs' },
  { win: 'Ctrl+K', mac: 'Cmd+K', pt: 'Fazer commit das alterações', en: 'Commit the changes', cat: 'vcs' },
  { win: 'Ctrl+T', mac: 'Cmd+T', pt: 'Atualizar o projeto a partir do versionamento (pull)', en: 'Update the project from VCS (pull)', cat: 'vcs' },
  { win: 'Ctrl+Shift+K', mac: 'Cmd+Shift+K', pt: 'Enviar os commits para o remoto (push)', en: 'Push the commits to the remote', cat: 'vcs' },
  { win: 'Alt+9', mac: 'Cmd+9', pt: 'Abrir/focar a janela de Version Control', en: 'Open/focus the Version Control tool window', cat: 'vcs' },

  // ─── Janelas e ferramentas ─────────────────────────────────────────
  { win: 'Alt+1', mac: 'Cmd+1', pt: 'Abrir/focar a janela de Project (árvore de arquivos)', en: 'Open/focus the Project tool window (file tree)', cat: 'tools' },
  { win: 'Alt+F12', mac: 'Opt+F12', pt: 'Abrir o terminal integrado', en: 'Open the integrated terminal', cat: 'tools' },
  { win: 'Ctrl+Shift+F12', mac: 'Cmd+Shift+F12', pt: 'Maximizar o editor (esconde todas as janelas de ferramenta)', en: 'Maximize the editor (hide all tool windows)', cat: 'tools' },
  { win: 'Ctrl+Tab', mac: 'Ctrl+Tab', pt: 'Alternar entre janelas de ferramenta e arquivos recentes', en: 'Switch between tool windows and recent files', cat: 'tools' },
]

const CATEGORY_LABELS = {
  pt: {
    general: 'geral',
    navigation: 'navegação',
    search: 'busca',
    editing: 'edição',
    refactoring: 'refatoração',
    run: 'execução/depuração',
    vcs: 'git / vcs',
    tools: 'janelas',
  },
  en: {
    general: 'general',
    navigation: 'navigation',
    search: 'search',
    editing: 'editing',
    refactoring: 'refactoring',
    run: 'run / debug',
    vcs: 'git / vcs',
    tools: 'tool windows',
  },
}

const translations = {
  pt: {
    title: 'Atalhos de Teclado do IntelliJ IDEA',
    intro: 'Referência rápida e pesquisável dos atalhos de teclado mais usados no IntelliJ IDEA, com a combinação Windows/Linux e Mac lado a lado. Vale também para PyCharm, GoLand, WebStorm, PhpStorm e RubyMine — todos seguem o keymap padrão das IDEs JetBrains.',
    alert: 'Este é o keymap padrão (default) das IDEs JetBrains. Se o seu IDE foi configurado com outro esquema — Eclipse, Visual Studio ou NetBeans, por exemplo — os atalhos podem ser diferentes. Confira em Settings → Keymap.',
    search: 'Buscar atalho ou descrição...',
    empty: 'Nenhum atalho encontrado.',
    winCol: 'Windows/Linux',
    macCol: 'Mac',
    count: (n) => `${n} atalhos`,
  },
  en: {
    title: 'IntelliJ IDEA Keyboard Shortcuts',
    intro: 'A quick, searchable reference of the most commonly used IntelliJ IDEA keyboard shortcuts, with Windows/Linux and Mac bindings side by side. It also applies to PyCharm, GoLand, WebStorm, PhpStorm and RubyMine — these shortcuts follow the default JetBrains keymap.',
    alert: 'These are the default bindings of the JetBrains keymap. If your IDE was set up with another scheme — Eclipse, Visual Studio or NetBeans, for example — the shortcuts may differ. Check Settings → Keymap.',
    search: 'Search shortcut or description...',
    empty: 'No shortcut found.',
    winCol: 'Windows/Linux',
    macCol: 'Mac',
    count: (n) => `${n} shortcuts`,
  },
}

export default function IntellijShortcutsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SHORTCUTS
    return SHORTCUTS.filter(
      (s) =>
        s.win.toLowerCase().includes(q) ||
        s.mac.toLowerCase().includes(q) ||
        s[lang].toLowerCase().includes(q),
    )
  }, [query, lang])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alert} />

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
                  <Space size={4}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{t.winCol}</Text>
                    <Text code>{item.win}</Text>
                  </Space>
                  <Space size={4}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{t.macCol}</Text>
                    <Text code>{item.mac}</Text>
                  </Space>
                  <Tag>{CATEGORY_LABELS[lang][item.cat]}</Tag>
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Text type="secondary" style={{ fontSize: 12 }}>{t.count(SHORTCUTS.length)}</Text>
    </Space>
  )
}