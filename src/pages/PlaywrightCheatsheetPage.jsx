import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ExperimentOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'locators', 'actions', 'expect', 'structure', 'cli', 'config']

const CATEGORY_COLOR = {
  basics: 'blue',
  locators: 'green',
  actions: 'cyan',
  expect: 'purple',
  structure: 'gold',
  cli: 'magenta',
  config: 'volcano',
}

const labelOf = {
  basics: { pt: 'Instalação & primeiros passos', en: 'Install & getting started' },
  locators: { pt: 'Locators & seleção', en: 'Locators & selection' },
  actions: { pt: 'Ações', en: 'Actions' },
  expect: { pt: 'Assertions (expect)', en: 'Assertions (expect)' },
  structure: { pt: 'Estrutura & fixtures', en: 'Structure & fixtures' },
  cli: { pt: 'CLI & reports', en: 'CLI & reports' },
  config: { pt: 'Config & emulação', en: 'Config & emulation' },
}

const COMMANDS = [
  // ─── Instalação & primeiros passos ─────────────────────────────────────────
  { cmd: 'npm init playwright', cat: 'basics', pt: 'Cria um projeto novo: instala @playwright/test, gera playwright.config.js, um teste de exemplo e o pipeline de CI', en: 'Scaffolds a project: installs @playwright/test, generates playwright.config.js, a sample test and CI' },
  { cmd: 'npx playwright install', cat: 'basics', pt: 'Baixa os navegadores que os testes vão usar (Chromium, Firefox, WebKit)', en: 'Downloads the browsers tests will run on (Chromium, Firefox, WebKit)' },
  { cmd: 'npx playwright install --with-deps', cat: 'basics', pt: 'Instala também as dependências de sistema — essencial em Linux/CI', en: 'Also installs OS-level dependencies — required on Linux/CI' },
  { cmd: "import { test, expect } from '@playwright/test'", cat: 'basics', pt: 'O único import que você precisa: cada teste recebe as fixtures (page, request...) prontas', en: 'The only import you need: every test gets the fixtures (page, request...) ready' },
  { cmd: "test('login', async ({ page }) => { ... })", cat: 'basics', pt: 'Estrutura básica de um teste', en: 'Basic test structure' },
  { cmd: "await page.goto('/')", cat: 'basics', pt: 'Navega; caminhos relativos usam o baseURL definido na config', en: 'Navigates; relative paths use the config baseURL' },
  { cmd: 'npx playwright test', cat: 'basics', pt: 'Arquivos rodam em paralelo (workers); os testes dentro do mesmo arquivo rodam em ordem', en: 'Files run in parallel (workers); tests within a file run in order' },
  { cmd: 'test.slow()', cat: 'basics', pt: 'Dentro do teste: triplica o timeout daquele teste (3x o valor da config)', en: 'Inside the test: triples that test timeout (3x the config value)' },

  // ─── Locators & seleção ─────────────────────────────────────────────────────
  { cmd: "page.getByRole('button', { name: 'Enviar' })", cat: 'locators', pt: 'O jeito mais recomendado: papel + nome acessível — como um leitor de tela enxerga o elemento', en: 'The recommended way: role + accessible name — how a screen reader sees the element' },
  { cmd: "page.getByLabel('Usuário')", cat: 'locators', pt: 'Input associado a um <label> (também casa aria-label / aria-labelledby)', en: 'Input linked to a <label> (also matches aria-label / aria-labelledby)' },
  { cmd: "page.getByPlaceholder('seu@email.com')", cat: 'locators', pt: 'Pelo placeholder do input', en: 'By the input placeholder' },
  { cmd: "page.getByText('Olá, mundo')", cat: 'locators', pt: 'Por texto visível na página (aceita string ou regex)', en: 'By visible page text (string or regex)' },
  { cmd: "page.getByTestId('login-submit')", cat: 'locators', pt: "Por data-testid — salva-vidas para elementos sem papel semântico", en: 'By data-testid — a lifeline for elements with no semantic role' },
  { cmd: "page.locator('ul li')", cat: 'locators', pt: 'Seletor CSS puro quando nada mais serve', en: 'Plain CSS selector when nothing else fits' },
  { cmd: "locator.filter({ hasText: 'iPhone' })", cat: 'locators', pt: 'Restringe uma lista pelo texto do item', en: 'Narrows a list by its item text' },
  { cmd: "locator.filter({ has: page.getByRole('button') })", cat: 'locators', pt: 'Restringe a lista a itens que CONTÊM o elemento dado', en: 'Keeps only items CONTAINING the given element' },
  { cmd: 'locator.first() / .last() / .nth(2)', cat: 'locators', pt: 'Pega um item específico de uma lista de vários', en: 'Picks a specific item out of many' },
  { cmd: "page.getByRole('row', { name: /Ana/i })", cat: 'locators', pt: 'O nome acessível de uma linha de tabela concatena as células — ideal para filtrar por linha inteira', en: 'A table row accessible name concatenates cells — great for whole-row matching' },

  // ─── Ações ──────────────────────────────────────────────────────────────────
  { cmd: "await page.getByRole('button', { name: 'Salvar' }).click()", cat: 'actions', pt: 'Clique simples em um locator (rola até o elemento antes)', en: 'Simple click on a locator (scrolls to it first)' },
  { cmd: 'await locator.dblclick()', cat: 'actions', pt: 'Duplo clique', en: 'Double click' },
  { cmd: "await locator.click({ button: 'right' })", cat: 'actions', pt: 'Clique com o botão direito', en: 'Right-button click' },
  { cmd: "await page.getByLabel('Nome').fill('Ana')", cat: 'actions', pt: 'Preenche um input disparando os eventos certos — prefira fill a type', en: 'Fills an input firing the right events — prefer fill over type' },
  { cmd: "await page.getByLabel('Tags').pressSequentially('dev,teste')", cat: 'actions', pt: 'Digita caractere por caractere — útil com autocomplete e máscaras', en: 'Types character by character — handy with autocomplete and masks' },
  { cmd: "await locator.press('Enter')", cat: 'actions', pt: 'Tecla no elemento focado', en: 'Key on the focused element' },
  { cmd: "await page.keyboard.press('Control+a')", cat: 'actions', pt: 'Tecla no contexto da página', en: 'Page-level keyboard shortcut' },
  { cmd: "await page.getByLabel('País').selectOption({ label: 'Brasil' })", cat: 'actions', pt: 'Seleciona em um <select> por value, label ou índice', en: 'Selects in a <select> by value, label or index' },
  { cmd: 'await locator.check() / uncheck() / setChecked(true)', cat: 'actions', pt: 'Checkbox e radio', en: 'Checkboxes and radios' },
  { cmd: 'await locator.hover()', cat: 'actions', pt: 'Passa o mouse — menu e tooltips de hover', en: 'Hovers — hover menus and tooltips' },
  { cmd: "await locator.setInputFiles('foto.png')", cat: 'actions', pt: 'Upload de arquivo (use um array para múltiplos)', en: 'File upload (pass an array for several)' },
  { cmd: 'await locator.click({ position: { x: 10, y: 10 } })', cat: 'actions', pt: 'Clique em coordenadas relativas dentro do elemento', en: 'Click at coordinates inside the element' },
  { cmd: "await Promise.all([page.waitForEvent('popup'), page.getByRole('link', { name: 'Nova aba' }).click()])", cat: 'actions', pt: 'Ação que abre popup: dispara o clique e captura a popup juntos — evita corrida', en: 'Popup-open actions: start clicking and awaiting the popup together — avoids races' },

  // ─── Assertions (expect) ────────────────────────────────────────────────────
  { cmd: 'await expect(locator).toBeVisible()', cat: 'expect', pt: 'Espera até ficar visível — retry automático até o timeout', en: 'Waits until visible — auto-retried until timeout' },
  { cmd: "await expect(locator).toHaveText('Olá')", cat: 'expect', pt: 'Texto exato (whitespace normalizado)', en: 'Exact text (whitespace-normalized)' },
  { cmd: 'await expect(locator).toContainText(/Bem-vindo/)', cat: 'expect', pt: 'Substring ou regex', en: 'Substring or regex' },
  { cmd: "await expect(locator).toHaveValue('ana@x.com')", cat: 'expect', pt: 'Valor atual de um input', en: 'Current input value' },
  { cmd: "await expect(page).toHaveURL('/login/ok')", cat: 'expect', pt: 'URL da página (string ou regex)', en: 'Page URL (string or regex)' },
  { cmd: 'await expect(page).toHaveTitle(/Login/)', cat: 'expect', pt: 'Título da aba', en: 'Tab title' },
  { cmd: 'await expect(locator).toHaveCount(3)', cat: 'expect', pt: 'Quantidade de itens em uma lista', en: 'Item count in a list' },
  { cmd: 'await expect(locator).toBeEnabled() / toBeDisabled()', cat: 'expect', pt: 'Estado do controle (leve em conta requisitos, ex.: check)', en: 'Control state (understands requirements, e.g. checked)' },
  { cmd: 'await expect(locator).toBeHidden()', cat: 'expect', pt: 'Invisível — o oposto direto de toBeVisible', en: 'Hidden — the direct opposite of toBeVisible' },
  { cmd: 'await expect.soft(locator).toContainText("x")', cat: 'expect', pt: 'Soft assertion: em vez de falhar o teste na hora, segue e reporta a lista de falhas no final', en: 'Soft assertion: keeps going and reports all failures at the end' },
  { cmd: "await expect(page).toHaveScreenshot('home.png')", cat: 'expect', pt: 'Snapshot visual da página (maxDiffPixelRatio e threshold ajustáveis)', en: 'Visual snapshot of the page (tunable maxDiffPixelRatio and threshold)' },
  { cmd: 'nada de waitForTimeout', cat: 'expect', pt: 'Assertions já aguardam (auto-wait): não espalhe sleeps manuais no teste', en: 'Assertions already auto-wait: do not sprinkle manual sleeps around' },

  // ─── Estrutura & fixtures ───────────────────────────────────────────────────
  { cmd: "test.beforeEach(async ({ page }) => { await page.goto('/') })", cat: 'structure', pt: 'Hook que roda antes de cada teste do arquivo', en: 'Hook running before every test in the file' },
  { cmd: 'test.afterEach / test.beforeAll / test.afterAll', cat: 'structure', pt: 'Os demais hooks do arquivo de teste', en: 'The remaining file hooks' },
  { cmd: "test.describe('Carrinho', () => { ... })", cat: 'structure', pt: 'Agrupa testes; hooks declarados dentro só valem para o grupo', en: 'Groups tests; hooks declared inside only apply to the group' },
  { cmd: "test.describe.configure({ mode: 'serial' })", cat: 'structure', pt: 'Força os testes do bloco a rodarem em sequência no mesmo worker', en: 'Forces the block tests to run serially on one worker' },
  { cmd: 'test.extend({ minhaFixture: ... })', cat: 'structure', pt: 'Fixture customizada por teste — ex.: sessão de usuário logado', en: 'Custom per-test fixture — e.g. a logged-in session' },
  { cmd: "test.use({ storageState: 'auth.json' })", cat: 'structure', pt: 'Aplica options (storageState, testIdAttribute...) a todos os testes do arquivo', en: 'Applies options (storageState, testIdAttribute...) to every test in the file' },
  { cmd: "test.skip('só mobile') / test.skip(cond, 'motivo') / test.fixme()", cat: 'structure', pt: 'Pula testes condicionalmente ou marca como pendentes', en: 'Skips conditionally or marks as pending' },
  { cmd: "test('x', async ({ request }) => { ... })", cat: 'structure', pt: 'A fixture request dá uma API pronta (request.get/post) para preparar/validar dados', en: 'The request fixture provides a ready API (request.get/post) to seed and verify data' },
  { cmd: "test.setTimeout(60_000)", cat: 'structure', pt: 'Aumenta o timeout só daquele teste', en: 'Raises the timeout for that single test' },
  { cmd: "test('aceita login', { tag: '@smoke' }, async ({ page }) => {...})", cat: 'structure', pt: 'Anotação de tag — funciona com --grep e com os filtros do --ui', en: 'Tag annotation — works with --grep and --ui filters' },

  // ─── CLI & reports ──────────────────────────────────────────────────────────
  { cmd: 'npx playwright test login', cat: 'cli', pt: 'Filtra a suíte por título ou caminho do arquivo', en: 'Filters the suite by test title or file path' },
  { cmd: 'npx playwright test --grep "@smoke"', cat: 'cli', pt: 'Roda só os testes cuja anotação/título casa a regex', en: 'Runs only tests matching the regex against title/tag' },
  { cmd: 'npx playwright test --headed', cat: 'cli', pt: 'Roda com o navegador visível (não headless)', en: 'Runs with a visible (non-headless) browser' },
  { cmd: 'npx playwright test --debug', cat: 'cli', pt: 'Abre o Inspector: o teste pausa e você pode executar passo a passo e inspecionar locators', en: 'Opens the Inspector: the test pauses for stepping and locator inspection' },
  { cmd: 'npx playwright codegen', cat: 'cli', pt: 'Grava o teste enquanto você clica no navegador que abre', en: 'Records the test as you click in the browser that opens' },
  { cmd: 'npx playwright test --ui', cat: 'cli', pt: 'Modo UI: watch, replay, filtros por tag e retries com um clique', en: 'UI mode: watch, replay, tag filters and one-click retries' },
  { cmd: 'npx playwright test --project=firefox', cat: 'cli', pt: 'Roda apenas um dos projetos definidos na config', en: 'Runs only one of the projects defined in the config' },
  { cmd: 'npx playwright test --workers=4', cat: 'cli', pt: 'Controla o paralelismo entre arquivos', en: 'Controls parallelism across files' },
  { cmd: 'npx playwright test --retries=2', cat: 'cli', pt: 'Repete testes falhos (equivalente ao retries da config)', en: 'Retries failing tests (same as the config retries)' },
  { cmd: 'npx playwright test --update-snapshots', cat: 'cli', pt: 'Recria os snapshots visuais que não bateram', en: 'Regenerates visual snapshots that did not match' },
  { cmd: 'npx playwright show-report', cat: 'cli', pt: 'Abre o relatório HTML completo (exige reporter html na config)', en: 'Opens the full HTML report (needs the html reporter in config)' },
  { cmd: 'npx playwright show-trace trace.zip', cat: 'cli', pt: 'Visualiza um trace coletado (time line, snapshots, network, console)', en: 'Views a collected trace (time line, snapshots, network, console)' },

  // ─── Config & emulação ──────────────────────────────────────────────────────
  { cmd: "import { defineConfig, devices } from '@playwright/test'", cat: 'config', pt: 'Módulos típicos da playwright.config.js', en: 'Typical playwright.config.js imports' },
  { cmd: "use: { baseURL: 'http://localhost:3000' }", cat: 'config', pt: 'Base para todos os page.goto("/...") — testes migram entre ambientes sem editar', en: 'Base for every page.goto("/...") — tests move between environments without edits' },
  { cmd: "use: { trace: 'on-first-retry' }", cat: 'config', pt: 'Coleta trace automaticamente no primeiro retry — o diagnóstico mais valioso', en: 'Auto-collects a trace on the first retry — the most valuable diagnosis' },
  { cmd: "use: { video: 'retain-on-failure', screenshot: 'only-on-failure' }", cat: 'config', pt: 'Evidência visual só quando algo falha (economiza tempo de CI)', en: 'Visual evidence only when something fails (saves CI time)' },
  { cmd: "use: { locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', colorScheme: 'dark' }", cat: 'config', pt: 'Emula o ambiente além do viewport — idioma, fuso e tema do sistema', en: 'Emulates beyond the viewport — locale, timezone and color scheme' },
  { cmd: 'use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }', cat: 'config', pt: 'Emula a tela de um celular (touch e mobile viewport)', en: 'Emulates a phone screen (touch + mobile viewport)' },
  { cmd: "projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'iphone', use: { ...devices['iPhone 14'] } }]", cat: 'config', pt: 'Vários navegadores/dispositivos na mesma suíte — multiplique cobertura sem multiplicar código', en: 'Multiple browsers/devices in one suite — more coverage, no extra code' },
  { cmd: "webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true }", cat: 'config', pt: 'O Playwright sobe o app antes da suíte e o derruba depois', en: 'Playwright starts the app before the suite and stops it after' },
  { cmd: 'retries: 2\nworkers: 4\nfullyParallel: true\ntimeout: 60_000', cat: 'config', pt: 'O punhado de opções que define o comportamento em CI', en: 'The handful of options that define CI behavior' },
  { cmd: "use: { storageState: 'storageState.json' }", cat: 'config', pt: 'Reutiliza estado de sessão entre testes — economize o login!', en: 'Reuses session state across tests — skip repeated logins!' },
  { cmd: 'expect: { timeout: 8_000 }', cat: 'config', pt: 'Timeout padrão de todas as assertions', en: 'Default timeout for every assertion' },
  { cmd: "reporter: [['html', { open: 'never' }]]", cat: 'config', pt: 'Relatório HTML sem abrir automaticamente no final', en: 'HTML report without auto-opening after the run' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Playwright (E2E)',
    intro: (
      <>
        Referência pesquisável do <Text code>@playwright/test</Text> — a
        ferramenta padrão de testes end-to-end: locators acessíveis, ações
        com auto-wait, assertions que aguardam, fixtures, CLI, reports e a{' '}
        <Text code>playwright.config.js</Text>. E2E roda no navegador de
        verdade, com a página inteira — o irmão que faltava ao lado do{' '}
        <Text code>js-testing-cheatsheet</Text>, que cobre testes de unidade
        (Jest/Vitest). 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'As 3 ideias que mais mudam seu Playwright',
    tipBody: (
      <>
        <Text strong>Locator acessível deixa o teste estável:</Text> use{' '}
        <Text code>getByRole</Text> / <Text code>getByLabel</Text> em vez de
        CSS frágil — se um designer mudar a classe, o teste continua de pé.{' '}
        <Text strong>Auto-wait resolve 90% das corridas:</Text> ações esperam
        o elemento ficar estável e assertions fazem retry até o timeout — se
        você está enchendo o teste de{' '}
        <Text code>waitForTimeout</Text>, algo está errado.{' '}
        <Text strong>O trace decide o incidente:</Text> com{' '}
        <Text code>trace: 'on-first-retry'</Text> e{' '}
        <Text code>show-trace</Text>, todo teste que falhar no CI entrega o
        passo a passo (DOM, network, console) na hora. Para testes de API
        pura, a fixture <Text code>request</Text> cobre sem abrir navegador.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'Playwright (E2E) Cheat Sheet',
    intro: (
      <>
        A searchable <Text code>@playwright/test</Text> reference — the
        standard end-to-end testing tool: accessible locators, auto-waiting
        actions, retrying assertions, fixtures, CLI, reports and the{' '}
        <Text code>playwright.config.js</Text>. E2E runs in a real browser
        with the whole page — the counterpart to the{' '}
        <Text code>js-testing-cheatsheet</Text>, which covers unit tests
        (Jest/Vitest). 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'The 3 ideas that change your Playwright the most',
    tipBody: (
      <>
        <Text strong>Accessible locators keep tests stable:</Text> prefer{' '}
        <Text code>getByRole</Text> / <Text code>getByLabel</Text> over
        brittle CSS — a designer can rename a class and the test survives.{' '}
        <Text strong>Auto-wait solves most races:</Text> actions wait for the
        element to settle and assertions retry until the timeout — if you are
        sprinkling <Text code>waitForTimeout</Text> around, something is
        wrong. <Text strong>Traces decide incidents:</Text> with{' '}
        <Text code>trace: 'on-first-retry'</Text> and{' '}
        <Text code>show-trace</Text>, every CI failure ships a step-by-step
        replay (DOM, network, console). For pure API tests, the{' '}
        <Text code>request</Text> fixture covers it without opening a browser.
      </>
    ),
    search: 'Search a command or description...',
    all: 'All',
    empty: 'No commands found. Try another search or category.',
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function PlaywrightCheatsheetPage() {
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
      `| \`${c.cmd.replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
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
      <Title level={2}><ExperimentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<ExperimentOutlined />} message={t.tipTitle} description={t.tipBody} />

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
                  <Text code style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{item.cmd}</Text>
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