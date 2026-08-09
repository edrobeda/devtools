import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['open', 'global', 'elements', 'styles', 'sources', 'console', 'network', 'record']

const CATEGORY_COLOR = {
  open: 'blue',
  global: 'purple',
  elements: 'green',
  styles: 'gold',
  sources: 'magenta',
  console: 'cyan',
  network: 'orange',
  record: 'geekblue',
}

const labelOf = {
  open: { pt: 'Abrir o DevTools', en: 'Opening DevTools' },
  global: { pt: 'Globais', en: 'Global' },
  elements: { pt: 'Painel Elements', en: 'Elements panel' },
  styles: { pt: 'Painel Styles', en: 'Styles pane' },
  sources: { pt: 'Painel Sources', en: 'Sources panel' },
  console: { pt: 'Painel Console', en: 'Console panel' },
  network: { pt: 'Painel Network', en: 'Network panel' },
  record: { pt: 'Gravação & tabs de código', en: 'Recording & code tabs' },
}

const SHORTCUTS = [
  // ─── Abrir o DevTools ─────────────────────────────────────────────────────
  { cat: 'open', win: 'F12 ou Ctrl+Shift+I', mac: 'Cmd+Option+I', pt: 'Abre o DevTools no painel que você usou por último', en: 'Opens DevTools on the panel you last used' },
  { cat: 'open', win: 'Ctrl+Shift+J', mac: 'Cmd+Option+J', pt: 'Abre o DevTools direto no Console', en: 'Opens DevTools directly in the Console' },
  { cat: 'open', win: 'Ctrl+Shift+C', mac: 'Cmd+Shift+C ou Cmd+Option+C', pt: 'Abre no Elements com o modo Inspect ativo', en: 'Opens in Elements with Inspect mode on' },

  // ─── Globais ───────────────────────────────────────────────────────────────
  { cat: 'global', win: 'Ctrl+Shift+M', mac: 'Cmd+Shift+M', pt: 'Alterna o Device Mode (emulação de tela/mobile)', en: 'Toggles Device Mode (mobile emulation)' },
  { cat: 'global', win: 'Ctrl+Shift+D', mac: 'Cmd+Shift+D', pt: 'Alterna a posição do dock (fixo/flutuante)', en: 'Cycles the docking position (docked/undocked)' },
  { cat: 'global', win: 'Ctrl+]  /  Ctrl+[', mac: 'Cmd+]  /  Cmd+[', pt: 'Vai pro painel seguinte / anterior', en: 'Moves to the next / previous panel' },
  { cat: 'global', win: 'Ctrl+Shift+P', mac: 'Cmd+Shift+P', pt: 'Abre o Command Menu — paleta de comandos do DevTools', en: 'Opens the Command Menu — DevTools command palette' },
  { cat: 'global', win: '?  ou  F1', mac: '?  ou  F1', pt: 'Abre as Settings do DevTools', en: 'Opens DevTools Settings' },
  { cat: 'global', win: 'F5  ou  Ctrl+R', mac: 'Cmd+R', pt: 'Recarrega a página normalmente', en: 'Performs a normal page reload' },
  { cat: 'global', win: 'Ctrl+F5  ou  Ctrl+Shift+R', mac: 'Cmd+Shift+R', pt: 'Recarga completa ignorando o cache (hard reload)', en: 'Performs a hard reload (ignores the cache)' },
  { cat: 'global', win: 'Ctrl+F', mac: 'Cmd+F', pt: 'Busca texto no painel atual (Elements, Console, Sources...)', en: 'Searches for text within the current panel (Elements, Console, Sources...)' },
  { cat: 'global', win: 'Ctrl+Shift+F', mac: 'Cmd+Option+F', pt: 'Abre a aba Search — busca em todos os recursos carregados', en: 'Opens the Search tab to find text across all loaded resources' },
  { cat: 'global', win: 'Ctrl+O  ou  Ctrl+P', mac: 'Cmd+O  ou  Cmd+P', pt: 'Abre um arquivo no painel Sources', en: 'Opens a file in the Sources panel' },
  { cat: 'global', win: 'Ctrl++  /  Ctrl+-  /  Ctrl+0', mac: 'Cmd++  /  Cmd+-  /  Cmd+0', pt: 'Dar zoom dentro do DevTools (in/out/reset)', en: 'Zooms the DevTools UI in / out / reset' },
  { cat: 'global', win: 'Escape', mac: 'Escape', pt: 'Abre ou fecha o Drawer (dock inferior de abas)', en: 'Toggles the Drawer (bottom tab dock)' },

  // ─── Elements ──────────────────────────────────────────────────────────────
  { cat: 'elements', win: 'Seta ↑ / ↓', mac: 'Seta ↑ / ↓', pt: 'Seleciona o elemento acima / abaixo do selecionado', en: 'Selects the element above / below the current one' },
  { cat: 'elements', win: 'Seta →', mac: 'Seta →', pt: 'Expandir o nó (se já estiver expandido, seleciona o filho)', en: 'Expands the node (if expanded, selects the child below)' },
  { cat: 'elements', win: 'Seta ←', mac: 'Seta ←', pt: 'Recolher o nó (se já recolhido, seleciona o pai)', en: 'Collapses the node (if collapsed, selects the parent above)' },
  { cat: 'elements', win: 'H', mac: 'H', pt: 'Esconde (hide) o elemento selecionado', en: 'Hides the currently selected element' },
  { cat: 'elements', win: 'Enter', mac: 'Enter', pt: 'Entra em modo de edição de atributos do elemento', en: 'Edits attributes of the selected element' },
  { cat: 'elements', win: 'F2', mac: 'F2', pt: 'Edita o elemento como HTML (Edit as HTML)', en: 'Edits the element as HTML' },
  { cat: 'elements', win: 'Ctrl+Z  /  Ctrl+Shift+Z', mac: 'Cmd+Z  /  Cmd+Shift+Z', pt: 'Desfaz / refaz a última alteração no DOM/CSS', en: 'Undoes / redoes the last DOM/CSS change' },

  // ─── Styles ────────────────────────────────────────────────────────────────
  { cat: 'styles', win: 'Ctrl+clique no valor', mac: 'Cmd+clique no valor', pt: 'Vai pra linha onde o valor da propriedade foi declarado', en: 'Jumps to the line where the property value is declared' },
  { cat: 'styles', win: 'Shift+clique no swatch', mac: 'Shift+clique no swatch', pt: 'Altera o formato de exibição da cor (hex, rgb, hsl, oklch...)', en: 'Cycles the color representation (hex, rgb, hsl, oklch...)' },
  { cat: 'styles', win: '↑ / ↓ no valor', mac: '↑ / ↓ no valor', pt: 'Incrementa / decrementa o valor em 1', en: 'Increments / decrements the value by 1' },
  { cat: 'styles', win: 'Shift+↑ / Shift+↓', mac: 'Shift+↑ / Shift+↓', pt: 'Incrementa / decrementa o valor em 10', en: 'Increments / decrements the value by 10' },
  { cat: 'styles', win: 'Ctrl+↑ / Ctrl+↓', mac: 'Cmd+↑ / Cmd+↓', pt: 'Incrementa / decrementa o valor em 100', en: 'Increments / decrements the value by 100' },
  { cat: 'styles', win: 'Alt+↑ / Alt+↓', mac: 'Option+↑ / Option+↓', pt: 'Incrementa / decrementa o valor em 0.1', en: 'Increments / decrements the value by 0.1' },
  { cat: 'styles', win: 'Tab  /  Shift+Tab', mac: 'Tab  /  Shift+Tab', pt: 'Edita a próxima / anterior propriedade ou valor', en: 'Edits the next / previous property or value' },

  // ─── Sources ───────────────────────────────────────────────────────────────
  { cat: 'sources', win: 'F8  ou  Ctrl+\\', mac: 'F8  ou  Cmd+\\', pt: 'Pausa / retoma a execução do script', en: 'Pauses / resumes script execution' },
  { cat: 'sources', win: 'F10  ou  Ctrl+\'', mac: 'F10  ou  Cmd+\'', pt: 'Step over (avança sem entrar na função)', en: 'Steps over (skips into the function call)' },
  { cat: 'sources', win: 'F11  ou  Ctrl+;', mac: 'F11  ou  Cmd+;', pt: 'Step into (entra na função chamada)', en: 'Steps into the called function' },
  { cat: 'sources', win: 'Shift+F11', mac: 'Shift+F11  ou  Cmd+Shift+;', pt: 'Step out (sai da função atual)', en: 'Steps out of the current function' },
  { cat: 'sources', win: 'Ctrl+clique na linha (pausado)', mac: 'Cmd+clique na linha (pausado)', pt: 'Continua a execução até aquela linha', en: 'Continues to the clicked line while paused' },
  { cat: 'sources', win: 'Ctrl+.  /  Ctrl+,', mac: 'Ctrl+.  /  Ctrl+,', pt: 'Seleciona o call frame abaixo / acima (pilha de chamadas)', en: 'Selects the call frame below / above the current one' },
  { cat: 'sources', win: 'Ctrl+S', mac: 'Cmd+S', pt: 'Salva as alterações locais (local modifications)', en: 'Saves changes to local modifications' },
  { cat: 'sources', win: 'Ctrl+G', mac: 'Ctrl+G', pt: 'Vai pra uma linha específica do arquivo aberto', en: 'Goes to a specific line in the open file' },
  { cat: 'sources', win: 'Ctrl+Shift+O', mac: 'Cmd+Shift+O', pt: 'Vai pra uma declaração/função do arquivo atual', en: 'Jumps to a function declaration / rule set in the current file' },
  { cat: 'sources', win: 'Ctrl+B', mac: 'Cmd+B', pt: 'Adiciona / remove breakpoint na linha (de-code)', en: 'Adds / removes a line-of-code breakpoint' },
  { cat: 'sources', win: 'Ctrl+Alt+B', mac: 'Cmd+Alt+B', pt: 'Edita o breakpoint condicional ou logpoint da linha', en: 'Edits a conditional breakpoint or logpoint' },
  { cat: 'sources', win: 'Ctrl+M', mac: 'Ctrl+M', pt: 'Vai pro parêntese/chave correspondente', en: 'Goes to the matching bracket' },
  { cat: 'sources', win: 'Ctrl+U', mac: 'Cmd+U (Desselecionar: Cmd+D)', pt: 'Segue o padrão: Ctrl+D seleciona a próxima ocorrência da palavra; Ctrl+U des-seleciona', en: 'Ctrl+D selects the next occurrence of the word; Ctrl+U de-selects it' },
  { cat: 'sources', win: 'Ctrl+/', mac: 'Cmd+/', pt: 'Comenta / descomenta a linha (editor)', en: 'Toggles a single-line comment in the editor' },

  // ─── Console ───────────────────────────────────────────────────────────────
  { cat: 'console', win: 'Ctrl+`', mac: 'Ctrl+`', pt: 'Foca o Console', en: 'Focuses the Console' },
  { cat: 'console', win: 'Ctrl+L', mac: 'Cmd+K  ou  Option+L', pt: 'Limpa o Console', en: 'Clears the Console' },
  { cat: 'console', win: 'Enter', mac: 'Enter', pt: 'Executa a linha atual', en: 'Executes the current statement' },
  { cat: 'console', win: 'Shift+Enter', mac: 'Shift+Enter', pt: 'Força quebra de linha (continuação multi-line)', en: 'Forces a multi-line entry' },
  { cat: 'console', win: 'Seta ↑ / ↓', mac: 'Seta ↑ / ↓', pt: 'Navega pelo histórico de comandos', en: 'Brows the command history (previous / next statement)' },
  { cat: 'console', win: 'Tab  /  Escape', mac: 'Tab  /  Escape', pt: 'Aceita / rejeita a sugestão de autocomplete', en: 'Accepts / rejects the autocomplete suggestion' },
  { cat: 'console', win: 'Alt+clique em Expand', mac: 'Option+clique em Expand', pt: 'Expande todas as sub-propriedades de um objeto', en: 'Expands all sub-properties of a logged object' },

  // ─── Network ───────────────────────────────────────────────────────────────
  { cat: 'network', win: 'Ctrl+E', mac: 'Cmd+E', pt: 'Inicia / para a gravação de rede', en: 'Starts / stops network recording' },
  { cat: 'network', win: 'Ctrl+R', mac: 'Cmd+R', pt: 'Grava um reload da página (limpa e recaptura)', en: 'Records a page reload (clears and recaptures)' },
  { cat: 'network', win: 'R', mac: 'R', pt: 'Repete a requisição XHR selecionada', en: 'Replays the selected XHR request' },
  { cat: 'network', win: 'Escape', mac: 'Escape', pt: 'Fecha os detalhes da requisição selecionada', en: 'Hides the details of the selected request' },
  { cat: 'network', win: 'Ctrl+F', mac: 'Cmd+F', pt: 'Busca em headers, payloads e respostas', en: 'Searches headers, payloads and responses' },

  // ─── Gravação & tabs de código ──────────────────────────────────────────────
  { cat: 'record', win: 'Ctrl+E', mac: 'Cmd+E', pt: 'Inicia / para a gravação no Performance, Memory ou Recorder', en: 'Starts/stops recording in Performance, Memory or the Recorder' },
  { cat: 'record', win: 'Ctrl+S', mac: 'Cmd+S', pt: 'Salva a gravação de performance', en: 'Saves the current performance recording' },
  { cat: 'record', win: 'Ctrl+O', mac: 'Cmd+O', pt: 'Carrega uma gravação de performance', en: 'Loads a performance recording' },
  { cat: 'record', win: 'Ctrl+B', mac: 'Cmd+B', pt: 'No Recorder com o code view: alterna entre prévia e código', en: 'In the Recorder code view: toggles the preview / code' },
]

const translations = {
  pt: {
    title: 'Atalhos do DevTools do Navegador',
    intro: (
      <>
        Referência pesquisável dos atalhos de teclado mais usados do{' '}
        <Text code>Chrome DevTools</Text> (a maioria funciona igual no Edge e
        demais navegadores Chromium), com as combinações Windows/Linux e Mac
        lado a lado. O DevTools é a ferramenta mais subutilizada do dia a dia:
        com F12 + <Text code>Ctrl+Shift+C</Text> você inspeciona qualquer
        página, e o Command Menu (<Text code>Ctrl+Shift+P</Text>) roda até
        comando sem interface.
      </>
    ),
    search: 'Buscar atalho ou descrição...',
    empty: 'Nenhum atalho encontrado. Tente outra busca ou categoria.',
    all: 'Todos',
    winCol: 'Windows/Linux',
    macCol: 'Mac',
    tipTitle: 'Letra de custo alto no dia a dia',
    tipBody: (
      <>
        Comece pelos três de abertura: <Text code>F12</Text> (abrir onde estava),
        <Text code>Ctrl+Shift+J</Text> (ir direto pro Console) e{' '}
        <Text code>Ctrl+Shift+C</Text> (inspecionar elemento). Depois, o Command
        Menu <Text code>Ctrl+Shift+P</Text> é o "coringa": digite qualquer ação
        (buscar um arquivo, esconder Elemento, listar atalhos) e ele executa.
        No Elements, <Text code>H</Text> esconde um elemento sem editar o DOM, e{' '}
        no Styles, <Text code>Shift+clique no swatch</Text> percorre os formatos
        de cor. Na hora de debugar, <Text code>F8</Text>/<Text code>F10</Text>/
        <Text code>F11</Text> dirigem a execução; e <Text code>Ctrl+Shift+F</Text>{' '}
        varre o HTML/CSS/JS de todos os recursos de uma vez.
      </>
    ),
    resultsOne: 'atalho encontrado',
    resultsMany: 'atalhos encontrados',
    copy: 'Copiar como Markdown',
    copiedTitle: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'Browser DevTools Shortcuts',
    intro: (
      <>
        A quick reference of the most used{' '}
        <Text code>Chrome DevTools</Text> keyboard shortcuts (most apply to
        Edge and other Chromium browsers too), with Windows/Linux and Mac
        bindings side by side. F12 opens the last panel and{' '}
        <Text code>Ctrl+Shift+C</Text> inspects any element; the Command Menu
        (<Text code>Ctrl+Shift+P</Text>) runs even commands with no interface.
      </>
    ),
    search: 'Search shortcut or description...',
    empty: 'No shortcut found. Try a different search or category.',
    all: 'All',
    winCol: 'Windows/Linux',
    macCol: 'Mac',
    tipTitle: 'The daily driver set',
    tipBody: (
      <>
        Start with the three openers: <Text code>F12</Text> (last panel),
        <Text code>Ctrl+Shift+J</Text> (Console) and{' '}
        <Text code>Ctrl+Shift+C</Text> (inspect element). The Command Menu{' '}
        <Text code>Ctrl+Shift+P</Text> is the Swiss-army knife: type any
        command name and run it. In Elements, <Text code>H</Text> hides an
        element without editing the DOM, and{' '}
        <Text code>Shift+click</Text> a color swatch cycles its format. When
        debugging, <Text code>F8</Text>/<Text code>F10</Text>/<Text code>F11</Text>{' '}
        drive execution, and <Text code>Ctrl+Shift+F</Text> searches across all
        loaded resources at once.
      </>
    ),
    resultsOne: 'shortcut found',
    resultsMany: 'shortcuts found',
    copy: 'Copy as Markdown',
    copiedTitle: 'Markdown list copied',
    copiedError: 'Could not copy',
  },
}

export default function DevToolsShortcutsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return SHORTCUTS.filter((s) => {
      if (category !== 'all' && s.cat !== category) return false
      if (!q) return true
      return (
        s.win.toLowerCase().includes(q) ||
        s.mac.toLowerCase().includes(q) ||
        s[lang].toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdList = useMemo(() => {
    const head = '| Action | Windows/Linux | Mac | Category |\n|---|---|---|---|\n'
    const rows = filtered.map((s) => {
      const esc = (v) => String(v).replace(/\|/g, '\\|')
      return `| ${esc(s[lang])} | \`${esc(s.win)}\` | \`${esc(s.mac)}\` | ${esc(labelOf[s.cat][lang])} |`
    })
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
    [t, messageApi],
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CodeOutlined />} message={t.tipTitle} description={t.tipBody} />

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
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdList)}>
            {t.copy}
          </Button>
        )}
      </Space>

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
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
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