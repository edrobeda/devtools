import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ExperimentOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['setup', 'structure', 'expect', 'mock', 'async', 'react']

const CATEGORY_COLOR = {
  setup: 'blue',
  structure: 'green',
  expect: 'purple',
  mock: 'magenta',
  async: 'gold',
  react: 'cyan',
}

const labelOf = {
  setup: { pt: 'Setup & comandos', en: 'Setup & commands' },
  structure: { pt: 'Estrutura & hooks', en: 'Structure & hooks' },
  expect: { pt: 'Expect & matchers', en: 'Expect & matchers' },
  mock: { pt: 'Mocks & spies', en: 'Mocks & spies' },
  async: { pt: 'Testes assíncronos', en: 'Async tests' },
  react: { pt: 'React & Testing Library', en: 'React & Testing Library' },
}

const COMMANDS = [
  // ─── Setup & comandos ──────────────────────────────────────────────────────
  { cmd: "npm i -D vitest", cat: 'setup', pt: 'Instala o Vitest — o runner de testes nativo do Vite (reusa o tsconfig, aliases e plugins do Vite)', en: 'Installs Vitest — the Vite-native test runner (reuses Vite tsconfig, aliases and plugins)' },
  { cmd: "npm i -D jest", cat: 'setup', pt: 'Instala o Jest — o runner clássico, independente de bundler', en: 'Installs Jest — the classic, bundler-agnostic runner' },
  { cmd: "npm i -D jsdom", cat: 'setup', pt: 'Ambiente DOM mínimo pro Vitest — necessário pra testar componente que usa window/document', en: 'A DOM environment for Vitest — needed to test components touching window/document' },
  { cmd: "npm i -D @testing-library/react @testing-library/jest-dom", cat: 'setup', pt: 'A stack de teste de React: render/screen + matchers adicionais do jest-dom', en: 'The React testing stack: render/screen + the extra jest-dom matchers' },
  { cmd: "\"test\": \"vitest run\"", cat: 'setup', pt: 'Script do package.json: roda a suíte UMA vez e encerra — o padrão pro CI', en: 'package.json script: runs the suite ONCE and exits — the CI default' },
  { cmd: "vitest", cat: 'setup', pt: "Roda em modo watch — re-executa a cada save (padrão do dev, como o 'test' do CRA)", en: "Runs in watch mode — re-runs on every save (the dev default, like CRA's 'test')" },
  { cmd: "vitest run --coverage", cat: 'setup', pt: 'Gera relatório de cobertura (exige @vitest/coverage-v8 instalado)', en: 'Generates a coverage report (requires @vitest/coverage-v8 installed)' },
  { cmd: "vitest run -t \"soma dois\"", cat: 'setup', pt: 'Filtra os testes por NOME (substring) em vez de por arquivo — ótimo pra focar', en: 'Filters tests by NAME (substring) instead of by file — great for focusing' },
  { cmd: "// @vitest-environment jsdom", cat: 'setup', pt: 'Comentário mágico no topo do arquivo que escolhe o ambiente DOM daquele arquivo', en: 'Magic comment at the top of the file choosing that file’s DOM environment' },
  { cmd: "globals: true", cat: 'setup', pt: 'Config (vitest.config.ts / jest config): libera describe/it/expect/vi globais sem precisar de import', en: 'Config (vitest.config.ts / jest config): makes describe/it/expect/vi global, no imports needed' },

  // ─── Estrutura & hooks ─────────────────────────────────────────────────────
  { cmd: "describe('soma', () => { ... })", cat: 'structure', pt: 'Agrupa testes relacionados; blocos podem aninhar e ter hooks próprios', en: 'Groups related tests; blocks can nest and have their own hooks' },
  { cmd: "it('retorna 4', () => { ... })", cat: 'structure', pt: 'Define um teste — test é alias do it', en: 'Defines a test — test is an alias for it' },
  { cmd: "it.only('debug', () => { ... })", cat: 'structure', pt: 'Roda SÓ este teste do arquivo — mão na roda pra debug (não suba no CI!)', en: 'Runs ONLY this test in the file — a debug godsend (do not commit!)' },
  { cmd: "it.skip('pulado', () => { ... })", cat: 'structure', pt: 'Pula este teste sem rodar — xit também é alias', en: 'Skips this test; xit is an alias too' },
  { cmd: "it.todo('escrever teste')", cat: 'structure', pt: 'Marca um teste pendente — aparece como TODO e não falha', en: 'Marks a pending test — shows as TODO without failing' },
  { cmd: "beforeEach(() => { ... })", cat: 'structure', pt: 'Roda ANTES de cada teste do bloco — setup (criar mock, montar estado)', en: 'Runs BEFORE each test in the block — setup (create mocks, build state)' },
  { cmd: "afterEach(() => { ... })", cat: 'structure', pt: 'Roda DEPOIS de cada teste — teardown (limpar mocks, fechar conexão)', en: 'Runs AFTER each test — teardown (clear mocks, close connections)' },
  { cmd: "beforeAll(() => { ... }) / afterAll(() => { ... })", cat: 'structure', pt: 'Roda UMA vez antes/depois de todos os testes do bloco — setup caro', en: 'Runs ONCE before/after all tests in the block — expensive setup' },
  { cmd: "it.each([1, 2, 3])('caso %i', (v) => { ... })", cat: 'structure', pt: 'Data-driven: roda o MESMO teste pra cada valor da lista (o %i é o place holder da posição)', en: 'Data-driven: runs the SAME test for each value in the list (%i is the position placeholder)' },
  { cmd: "describe.each([[1, 2], [3, 4]])('com %i', ([a, b]) => { ... })", cat: 'structure', pt: 'A versão do it.each pro nível do bloco inteiro', en: 'The it.each version at the whole-block level' },
  { cmd: "expect.hasAssertions()", cat: 'structure', pt: 'No fim do teste, garante que pelo menos um expect rodou (pega teste sem assert)', en: 'By the end, ensures at least one expect ran (catches assert-free tests)' },

  // ─── Expect & matchers ─────────────────────────────────────────────────────
  { cmd: "expect(x).toBe(valor)", cat: 'expect', pt: 'Igualdade de REFERÊNCIA (Object.is) — pra números, strings, booleans', en: 'Reference equality (Object.is) — for numbers, strings, booleans' },
  { cmd: "expect(x).toEqual({ a: 1 })", cat: 'expect', pt: 'Igualdade PROFUNDA de objetos/arrays (recursiva) — o que você quer na maioria das vezes', en: 'DEEP equality for objects/arrays (recursive) — what you want most of the time' },
  { cmd: "expect(x).toStrictEqual({ a: 1 })", cat: 'expect', pt: 'Igual a toEqual, mas SEM tolerar campos undefined a mais nem tipos divergentes (1 vs "1")', en: 'Like toEqual but WITHOUT tolerating extra undefined fields or divergent types (1 vs "1")' },
  { cmd: "expect(x).toBeTruthy() / toBeFalsy()", cat: 'expect', pt: 'Converte pra contexto de if — 0, NaN, "" e null são falsy', en: 'Coerces like an if — 0, NaN, "" and null are falsy' },
  { cmd: "expect(x).toBeNull() / toBeUndefined() / toBeDefined()", cat: 'expect', pt: 'Checagens diretas de null / undefined / existência', en: 'Direct checks for null / undefined / existence' },
  { cmd: "expect(3).toBeGreaterThan(2) / toBeLessThan(4)", cat: 'expect', pt: 'Comparações numéricas — e as versões …OrEqual', en: 'Numeric comparisons — plus the …OrEqual variants' },
  { cmd: "expect(0.1 + 0.2).toBeCloseTo(0.3)", cat: 'expect', pt: 'Float com tolerância (default 2 casas) — NUNCA toBe direto em decimal', en: 'Float with tolerance (2 digits by default) — NEVER plain toBe on decimals' },
  { cmd: "expect(arr).toHaveLength(3)", cat: 'expect', pt: 'Comprimento de array ou string', en: 'Length of an array or string' },
  { cmd: "expect(arr).toContain(4)", cat: 'expect', pt: 'Array contém o valor; em string aceita substring', en: 'Array holds the value; strings accept a substring' },
  { cmd: "expect(obj).toHaveProperty('a.b', 1)", cat: 'expect', pt: 'Checa propriedade (até com caminho por ponto) e valor opcional', en: 'Checks a property (even a dot path) and an optional value' },
  { cmd: "expect(str).toMatch(/^começou/)", cat: 'expect', pt: 'String casa regex (ou substring literal) — útil pra âncora e grupo de captura', en: 'String matches a regex (or literal substring) — key for anchoring and capture groups' },
  { cmd: "expect(obj).toMatchObject({ a: 1 })", cat: 'expect', pt: 'Casa só o SUBCONJUNTO de campos — ignora o resto do objeto (diferente do toEqual)', en: 'Matches only the given SUBSET of fields — ignores the rest (unlike toEqual)' },
  { cmd: "expect(fn).toThrow('msg')", cat: 'expect', pt: 'A função DEVE lançar — aceita mensagem, regex ou classe de erro', en: 'The function MUST throw — accepts a message, regex or error class' },
  { cmd: "expect(fn).not.toThrow()", cat: 'expect', pt: '.not nega qualquer matcher — aqui garante que NÃO lança', en: '.not negates any matcher — here it asserts it does NOT throw' },
  { cmd: "expect(fn).toHaveBeenCalledWith(1, 'x')", cat: 'expect', pt: 'Mock foi chamado com estes argumentos (da última chamada)', en: 'Mock was called with these arguments (from the last call)' },
  { cmd: "expect(fn).toHaveBeenCalledTimes(2)", cat: 'expect', pt: 'Contagem exata de chamadas — ótimo pra frequência de polling/retry', en: 'Exact call count — great for polling/retry pacing' },
  { cmd: "expect.any(Number)", cat: 'expect', pt: "Placeholder de tipo: aceita QUALQUER número — companheiro de toHaveBeenCalledWith/toEqual", en: "Type placeholder: accepts ANY number — pairs with toHaveBeenCalledWith/toEqual" },
  { cmd: "expect.stringContaining('x') / expect.arrayContaining([2]) / expect.objectContaining({ a: 1 })", cat: 'expect', pt: 'Asserções parciais compostas — encaixam em toEqual/toHaveBeenCalledWith', en: 'Composed partial assertions — nest into toEqual/toHaveBeenCalledWith' },

  // ─── Mocks & spies ─────────────────────────────────────────────────────────
  { cmd: "const fn = vi.fn()", cat: 'mock', pt: 'Cria um spy vazio que registra chamadas (no Jest: jest.fn())', en: 'Creates an empty spy that records calls (in Jest: jest.fn())' },
  { cmd: "vi.fn((x) => x * 2)", cat: 'mock', pt: 'Mock já com implementação própria', en: 'A mock with your own implementation' },
  { cmd: "fn.mockReturnValue(42)", cat: 'mock', pt: 'Sempre retorna 42', en: 'Always returns 42' },
  { cmd: "fn.mockReturnValueOnce(1)", cat: 'mock', pt: 'Retorna 1 só na PRÓXIMA chamada — encadeável pra simular sequência', en: 'Returns 1 only on the NEXT call — chainable to simulate a sequence' },
  { cmd: "fn.mockResolvedValue({ ok: true })", cat: 'mock', pt: 'Retorna uma Promise resolvida — atalho pro retorno de async', en: 'Returns a resolved Promise — shorthand for async returns' },
  { cmd: "fn.mockRejectedValue(new Error('x'))", cat: 'mock', pt: 'Retorna uma Promise rejeitada — não esqueça o catch/await no teste', en: 'Returns a rejected Promise — don’t forget the catch/await in the test' },
  { cmd: "fn.mockImplementation(() => 7)", cat: 'mock', pt: 'Define uma implementação dinâmica (há mockReturnValue pra constante)', en: 'Sets a dynamic implementation (mockReturnValue covers constants)' },
  { cmd: "vi.spyOn(console, 'log')", cat: 'mock', pt: 'Espiona método existente de objeto — mockReturnValue sobrepõe, mockRestore devolve o original', en: 'Spies an existing object method — mockReturnValue overrides, mockRestore brings the original back' },
  { cmd: "fn.mockName('busca')", cat: 'mock', pt: 'Nomeia o mock pra aparecer legível nos erros do runner', en: 'Names the mock so it reads clearly in runner errors' },
  { cmd: "vi.mock('../api')", cat: 'mock', pt: 'Substitui o MÓDULO inteiro por mocks automáticos; com factory própria: vi.mock("../api", () => ({ get: vi.fn() }))', en: 'Replaces the WHOLE module with auto-mocks; with your own factory: vi.mock("../api", () => ({ get: vi.fn() }))' },
  { cmd: "vi.clearAllMocks()", cat: 'mock', pt: 'Zera as chamadas registradas ANTES de cada teste — o padrão do beforeEach', en: 'Clears recorded calls BEFORE each test — the beforeEach classic' },
  { cmd: "vi.resetAllMocks()", cat: 'mock', pt: 'Limpa as chamadas E zera implementações — mock volta a ser spy vazio', en: 'Clears calls AND resets implementations — the mock becomes an empty spy again' },
  { cmd: "vi.restoreAllMocks()", cat: 'mock', pt: 'Desfaz todos os spyOn, devolvendo os métodos originais (use em afterEach/afterAll)', en: 'Undoes every spyOn, restoring the original methods (use in afterEach/afterAll)' },
  { cmd: "vi.useFakeTimers()", cat: 'mock', pt: 'Troca setTimeout/Date/intervalos por um relógio controlável', en: 'Replaces setTimeout/Date/intervals with a controllable clock' },
  { cmd: "vi.advanceTimersByTime(1000)", cat: 'mock', pt: 'Avança o relógio fake em 1s — dispara os timers pendentes que devem vibrar', en: 'Advances the fake clock by 1s — fires the timers that were due' },
  { cmd: "vi.runAllTimers()", cat: 'mock', pt: 'Executa TODOS os timers pendentes de uma vez (não é bom pra setTimeout dentro de setTimeout)', en: 'Runs ALL pending timers at once (bad for setTimeout inside setTimeout)' },
  { cmd: "vi.useRealTimers()", cat: 'mock', pt: 'Devolve o relógio real — rode no afterEach pra não vazar pros outros testes', en: 'Restores the real clock — run in afterEach so it doesn’t leak into other tests' },

  // ─── Testes assíncronos ────────────────────────────────────────────────────
  { cmd: "it('async', async () => { const x = await get(); expect(x).toBe(1) })", cat: 'async', pt: 'Teste assíncrono: o callback é async e o runner ESPERA a promise resolver antes do veredito', en: 'Async test: the callback is async and the runner WAITS for the promise before the verdict' },
  { cmd: "await expect(promise).resolves.toBe(1)", cat: 'async', pt: 'Espera a promise RESOLVER e testa o valor — sem precisar de then/catch', en: 'Waits for the promise to RESOLVE and asserts the value — no then/catch needed' },
  { cmd: "await expect(promise).rejects.toThrow('erro')", cat: 'async', pt: 'Espera a promise REJEITAR com aquele erro — resolve o ".catch" de forma limpa', en: 'Waits for the promise to REJECT with that error — cleanly resolves the ".catch"' },
  { cmd: "expect.assertions(1)", cat: 'async', pt: "Garante que 1 expect rodou de verdade — pega promise 'órfã' que nunca resolveu", en: 'Asserts 1 expect actually ran — catches orphaned promises that never settled' },

  // ─── React & Testing Library ───────────────────────────────────────────────
  { cmd: "render(<Button>Salvar</Button>)", cat: 'react', pt: 'Monta o componente (import de @testing-library/react) e limpa sozinho após o teste', en: 'Mounts the component (imported from @testing-library/react) and auto-cleans after the test' },
  { cmd: "screen.getByText('Salvar')", cat: 'react', pt: 'Busca por texto visível; getBy lança ERRO se não achar (fail fast)', en: 'Looks up by visible text; getBy THROWS when missing (fail fast)' },
  { cmd: "screen.queryByText('x')", cat: 'react', pt: 'Igual getBy mas retorna null em vez de lançar — para asserções de AUSÊNCIA', en: 'Like getBy but returns null instead of throwing — for ABSENCE assertions' },
  { cmd: "await screen.findByText('Carregado')", cat: 'react', pt: "Variante ASSÍNCRONA da busca: espera o conteúdo aparecer (getBy + waitFor por baixo)", en: 'ASYNC lookup variant: waits for the content to appear (getBy + waitFor underneath)' },
  { cmd: "screen.getByRole('button', { name: 'Salvar' })", cat: 'react', pt: 'Busca SEMÂNTICA por papel + nome acessível — a PRIORIDADE do Testing Library', en: 'Semantic lookup by role + accessible name — Testing Library’s PRIORITY' },
  { cmd: "expect(el).toBeInTheDocument()", cat: 'react', pt: "Matchers do jest-dom ('@testing-library/jest-dom'): toBeInTheDocument, toBeDisabled, toHaveTextContent…", en: "jest-dom matchers ('@testing-library/jest-dom'): toBeInTheDocument, toBeDisabled, toHaveTextContent…" },
  { cmd: "await userEvent.click(btn)", cat: 'react', pt: 'Simula interação REAL (foco + eventos + async) — preferível ao fireEvent; importe de @testing-library/user-event', en: 'Simulates REAL interaction (focus + events + async) — preferred over fireEvent; import from @testing-library/user-event' },
  { cmd: "fireEvent.change(input, { target: { value: 'x' } })", cat: 'react', pt: 'Dispara um evento cru e síncrono — rápido, mas não cobre o comportamento completo do usuário', en: 'Fires a raw synchronous event — quick, but doesn’t cover the full user behavior' },
  { cmd: "screen.getByTestId('price')", cat: 'react', pt: 'Busca por data-testid — ÚLTIMO recurso quando não existe role/texto acessível', en: 'Looks up by data-testid — LAST resort when no accessible role/text exists' },
  { cmd: "await waitFor(() => expect(fn).toHaveBeenCalled())", cat: 'react', pt: 'Polling até uma condição assíncrona virar verdade — primo do findBy (retry até o timeout)', en: 'Polls until an async condition becomes true — cousin of findBy (retries until timeout)' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Testes JS (Jest & Vitest)',
    intro: (
      <>
        Cheat sheet pesquisável pra escrever testes de JavaScript com{' '}
        <Text code>Jest</Text> e <Text code>Vitest</Text> — os dois runners
        compartilham exatamente a mesma API de estrutura bem como os matchers do{' '}
        <Text code>expect</Text>; o que muda é só o objeto de mock (<Text code>jest.*</Text>{' '}
        vs <Text code>vi.*</Text>). A página cobre da instalação até o teste de
        componente com Testing Library. Tudo client-side.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    tipTitle: 'O modelo mental dos testes',
    tipBody: (
      <>
        Um teste é sempre <Text code>actuar</Text>: montar o cenário (setup),
        chamar o que você quer testar, e verificar com{' '}
        <Text code>expect(...)</Text>. Duas decisões que mais valem aqui:{' '}
        <Text code>toBe</Text> é igualdade por REFERÊNCIA (pra primitivos),{' '}
        <Text code>toEqual</Text>/<Text code>toStrictEqual</Text> é por valor
        (pra objetos/arrays — e o Strict veta tipos divergentes e fields
        undefined). Em async, o teste só passa de verdade se você{' '}
        <Text code>await</Text>/<Text code>return</Text> a promise — uma promise
        órfã "passa de mentira". E em React, a ordem de busca do Testing
        Library é <Text code>getByRole</Text> &gt; texto &gt;{' '}
        <Text code>getByTestId</Text> por último — role descreve o componente
        pela função dele, não pela implementação.
      </>
    ),
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'JS Testing Cheat Sheet (Jest & Vitest)',
    intro: (
      <>
        A searchable cheat sheet for writing JavaScript tests with{' '}
        <Text code>Jest</Text> and <Text code>Vitest</Text> — the two runners
        share exactly the same structuring API and the {' '}
        <Text code>expect</Text> matchers; only the mock object differs ({' '}
        <Text code>jest.*</Text> vs <Text code>vi.*</Text>). It goes from setup
        all the way to component tests with Testing Library. All client-side.
      </>
    ),
    search: 'Search command or description...',
    all: 'All',
    empty: 'No command found. Try a different search or category.',
    tipTitle: 'The mental model of tests',
    tipBody: (
      <>
        A test is always <Text code>act</Text>: set up the scene, call what you
        want to test, and assert with <Text code>expect(...)</Text>. The two
        decisions that matter most here: <Text code>toBe</Text> is equality by
        REFERENCE (for primitives), <Text code>toEqual</Text>/
        <Text code>toStrictEqual</Text> is by value (for objects/arrays — and
        Strict rejects divergent types and undefined fields). For async, a test
        only truly passes if you <Text code>await</Text>/<Text code>return</Text>{' '}
        the promise — an orphaned promise "passes by lying". And in React, the
        Testing Library lookup order is <Text code>getByRole</Text> &gt; text
        &gt; <Text code>getByTestId</Text> last — a role describes the component
        by its function, not its implementation.
      </>
    ),
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function JsTestingCheatsheetPage() {
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