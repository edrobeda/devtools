import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const SHORTCUTS = [
  { win: 'Ctrl+P', mac: 'Cmd+P', pt: 'Abrir arquivo rapidamente (Quick Open)', en: 'Quick Open a file', cat: 'general' },
  { win: 'Ctrl+Shift+P', mac: 'Cmd+Shift+P', pt: 'Abrir a paleta de comandos', en: 'Open the Command Palette', cat: 'general' },
  { win: 'Ctrl+,', mac: 'Cmd+,', pt: 'Abrir configurações (Settings)', en: 'Open Settings', cat: 'general' },
  { win: 'Ctrl+Shift+N', mac: 'Cmd+Shift+N', pt: 'Nova janela', en: 'New window', cat: 'general' },
  { win: 'Ctrl+Shift+W', mac: 'Cmd+Shift+W', pt: 'Fechar a janela', en: 'Close window', cat: 'general' },
  { win: 'Ctrl+K Ctrl+S', mac: 'Cmd+K Cmd+S', pt: 'Abrir editor de atalhos de teclado', en: 'Open Keyboard Shortcuts editor', cat: 'general' },
  { win: 'Ctrl+X', mac: 'Cmd+X', pt: 'Recortar linha (sem seleção, recorta a linha inteira)', en: 'Cut line (no selection cuts the whole line)', cat: 'editing' },
  { win: 'Ctrl+C', mac: 'Cmd+C', pt: 'Copiar linha (sem seleção, copia a linha inteira)', en: 'Copy line (no selection copies the whole line)', cat: 'editing' },
  { win: 'Alt+↑ / Alt+↓', mac: 'Opt+↑ / Opt+↓', pt: 'Mover a linha pra cima/baixo', en: 'Move line up/down', cat: 'editing' },
  { win: 'Shift+Alt+↑ / Shift+Alt+↓', mac: 'Shift+Opt+↑ / Shift+Opt+↓', pt: 'Copiar a linha pra cima/baixo', en: 'Copy line up/down', cat: 'editing' },
  { win: 'Ctrl+Shift+K', mac: 'Cmd+Shift+K', pt: 'Excluir a linha inteira', en: 'Delete the whole line', cat: 'editing' },
  { win: 'Ctrl+Enter', mac: 'Cmd+Enter', pt: 'Inserir linha abaixo (de qualquer posição no cursor)', en: 'Insert line below (from any cursor position)', cat: 'editing' },
  { win: 'Ctrl+Shift+Enter', mac: 'Cmd+Shift+Enter', pt: 'Inserir linha acima', en: 'Insert line above', cat: 'editing' },
  { win: 'Ctrl+/', mac: 'Cmd+/', pt: 'Comentar/descomentar linha', en: 'Toggle line comment', cat: 'editing' },
  { win: 'Shift+Alt+A', mac: 'Shift+Opt+A', pt: 'Comentar/descomentar bloco', en: 'Toggle block comment', cat: 'editing' },
  { win: 'Ctrl+D', mac: 'Cmd+D', pt: 'Selecionar a próxima ocorrência da palavra atual (multi-cursor)', en: 'Select the next occurrence of the current word (multi-cursor)', cat: 'editing' },
  { win: 'Ctrl+Shift+L', mac: 'Cmd+Shift+L', pt: 'Selecionar todas as ocorrências da palavra atual', en: 'Select all occurrences of the current word', cat: 'editing' },
  { win: 'Alt+Click', mac: 'Opt+Click', pt: 'Adicionar um cursor no ponto clicado', en: 'Add a cursor at the clicked point', cat: 'editing' },
  { win: 'Ctrl+Alt+↑ / Ctrl+Alt+↓', mac: 'Cmd+Opt+↑ / Cmd+Opt+↓', pt: 'Adicionar cursor acima/abaixo', en: 'Add cursor above/below', cat: 'editing' },
  { win: 'Tab / Shift+Tab', mac: 'Tab / Shift+Tab', pt: 'Aumentar/diminuir indentação da linha ou seleção', en: 'Indent/outdent line or selection', cat: 'editing' },
  { win: 'F2', mac: 'F2', pt: 'Renomear símbolo (todas as referências)', en: 'Rename symbol (all references)', cat: 'editing' },
  { win: 'Shift+Alt+F', mac: 'Shift+Opt+F', pt: 'Formatar o documento', en: 'Format document', cat: 'editing' },
  { win: 'Ctrl+.', mac: 'Cmd+.', pt: 'Mostrar ações rápidas/correções (Quick Fix)', en: 'Show Quick Fix actions', cat: 'editing' },
  { win: 'Ctrl+Space', mac: 'Ctrl+Space', pt: 'Disparar sugestão/autocomplete', en: 'Trigger suggestion/autocomplete', cat: 'editing' },
  { win: 'Ctrl+G', mac: 'Cmd+G', pt: 'Ir para uma linha específica', en: 'Go to a specific line', cat: 'navigation' },
  { win: 'Ctrl+T', mac: 'Cmd+T', pt: 'Ir para um símbolo em todo o workspace', en: 'Go to a symbol across the whole workspace', cat: 'navigation' },
  { win: 'Ctrl+Shift+O', mac: 'Cmd+Shift+O', pt: 'Ir para um símbolo no arquivo atual', en: 'Go to a symbol in the current file', cat: 'navigation' },
  { win: 'F12', mac: 'F12', pt: 'Ir para a definição', en: 'Go to Definition', cat: 'navigation' },
  { win: 'Alt+F12', mac: 'Opt+F12', pt: 'Ver definição num popup inline (Peek Definition)', en: 'Peek Definition inline popup', cat: 'navigation' },
  { win: 'Shift+F12', mac: 'Shift+F12', pt: 'Ver todas as referências', en: 'Show all references', cat: 'navigation' },
  { win: 'Alt+← / Alt+→', mac: 'Ctrl+- / Ctrl+Shift+-', pt: 'Voltar/avançar na navegação (histórico de cursor)', en: 'Navigate back/forward (cursor history)', cat: 'navigation' },
  { win: 'Ctrl+Tab', mac: 'Cmd+Tab (dentro do editor: Ctrl+Tab)', pt: 'Alternar entre os últimos arquivos abertos', en: 'Cycle through recently opened files', cat: 'navigation' },
  { win: 'Ctrl+Shift+Tab', mac: 'Cmd+Shift+Tab', pt: 'Alternar arquivos na ordem inversa', en: 'Cycle through files in reverse order', cat: 'navigation' },
  { win: 'Ctrl+F', mac: 'Cmd+F', pt: 'Buscar no arquivo atual', en: 'Find in current file', cat: 'search' },
  { win: 'Ctrl+H', mac: 'Cmd+Opt+F', pt: 'Buscar e substituir no arquivo atual', en: 'Find and replace in current file', cat: 'search' },
  { win: 'Ctrl+Shift+F', mac: 'Cmd+Shift+F', pt: 'Buscar em todo o workspace', en: 'Find across the whole workspace', cat: 'search' },
  { win: 'Ctrl+Shift+H', mac: 'Cmd+Shift+H', pt: 'Buscar e substituir em todo o workspace', en: 'Find and replace across the whole workspace', cat: 'search' },
  { win: 'Ctrl+Shift+E', mac: 'Cmd+Shift+E', pt: 'Abrir o Explorer (árvore de arquivos)', en: 'Open the Explorer (file tree)', cat: 'display' },
  { win: 'Ctrl+Shift+X', mac: 'Cmd+Shift+X', pt: 'Abrir a aba de Extensões', en: 'Open the Extensions tab', cat: 'display' },
  { win: 'Ctrl+Shift+G', mac: 'Ctrl+Shift+G', pt: 'Abrir a aba de Controle de Versão (Git)', en: 'Open the Source Control (Git) tab', cat: 'display' },
  { win: 'Ctrl+`', mac: 'Ctrl+`', pt: 'Abrir/fechar o terminal integrado', en: 'Toggle the integrated terminal', cat: 'display' },
  { win: 'Ctrl+B', mac: 'Cmd+B', pt: 'Abrir/fechar a barra lateral', en: 'Toggle the sidebar', cat: 'display' },
  { win: 'Ctrl+J', mac: 'Cmd+J', pt: 'Abrir/fechar o painel inferior (terminal/problemas/output)', en: 'Toggle the bottom panel (terminal/problems/output)', cat: 'display' },
  { win: 'Ctrl+\\', mac: 'Cmd+\\', pt: 'Dividir o editor', en: 'Split the editor', cat: 'display' },
  { win: 'Ctrl+1 / Ctrl+2 / Ctrl+3', mac: 'Cmd+1 / Cmd+2 / Cmd+3', pt: 'Focar no grupo de editor 1/2/3', en: 'Focus editor group 1/2/3', cat: 'display' },
  { win: 'Ctrl+K Z', mac: 'Cmd+K Z', pt: 'Modo Zen (tela cheia sem distrações)', en: 'Zen Mode (distraction-free fullscreen)', cat: 'display' },
]

const CATEGORY_LABELS = {
  pt: { general: 'geral', editing: 'edição', navigation: 'navegação', search: 'busca', display: 'exibição' },
  en: { general: 'general', editing: 'editing', navigation: 'navigation', search: 'search', display: 'display' },
}

const translations = {
  pt: {
    title: 'Atalhos de Teclado do VSCode',
    intro: 'Referência rápida e pesquisável dos atalhos de teclado mais usados no VSCode, com a combinação Windows/Linux e Mac lado a lado (os keybindings padrão podem variar um pouco por layout de teclado ou extensão instalada).',
    search: 'Buscar atalho ou descrição...',
    empty: 'Nenhum atalho encontrado.',
    winCol: 'Windows/Linux',
    macCol: 'Mac',
  },
  en: {
    title: 'VSCode Keyboard Shortcuts',
    intro: "A quick, searchable reference of the most commonly used VSCode keyboard shortcuts, with Windows/Linux and Mac bindings side by side (default keybindings may vary slightly by keyboard layout or installed extensions).",
    search: 'Search shortcut or description...',
    empty: 'No shortcut found.',
    winCol: 'Windows/Linux',
    macCol: 'Mac',
  },
}

export default function VscodeShortcutsPage() {
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
    </Space>
  )
}
