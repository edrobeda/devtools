import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { LinkOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'setup',
  'routing',
  'navigation',
  'hooks',
  'data',
  'forms',
  'nesting',
  'gotchas',
]

const CATEGORY_COLOR = {
  setup: 'geekblue',
  routing: 'green',
  navigation: 'cyan',
  hooks: 'purple',
  data: 'volcano',
  forms: 'orange',
  nesting: 'blue',
  gotchas: 'red',
}

const labelOf = {
  setup: { pt: 'Instalação & Setup', en: 'Setup & install' },
  routing: { pt: 'Rotas & Matching', en: 'Routes & matching' },
  navigation: { pt: 'Navegação & Links', en: 'Navigation & links' },
  hooks: { pt: 'Hooks de Leitura', en: 'Read hooks' },
  data: { pt: 'Loaders & Actions', en: 'Loaders & actions' },
  forms: { pt: 'Formulários & Fetchers', en: 'Forms & fetchers' },
  nesting: { pt: 'Layouts & Error Boundaries', en: 'Layouts & error boundaries' },
  gotchas: { pt: 'Gotchas & v7', en: 'Gotchas & v7' },
}

const COMMANDS = [
  // ─── Instalação & Setup ──────────────────────────────────────────────────
  { cmd: "npm install react-router", cat: 'setup', pt: 'Instala a lib (v7 é o router único — react-router-dom virou um alias deprecado)', en: 'Installs the lib (v7 is the single router — react-router-dom is now a deprecated alias)' },
  { cmd: "import { createBrowserRouter, RouterProvider } from 'react-router'", cat: 'setup', pt: 'v7: importe de react-router (não react-router-dom)', en: 'v7: import from react-router (not react-router-dom)' },
  { cmd: "const router = createBrowserRouter([{ path: '/', element: <HomePage /> }])", cat: 'setup', pt: 'Data router: o jeito recomendado — habilita loaders, actions e useFetcher', en: 'Data router: the recommended setup — enables loaders, actions, useFetcher' },
  { cmd: "<RouterProvider router={router} />", cat: 'setup', pt: 'Renderiza o router no topo da árvore (substitui BrowserRouter neste modo)', en: 'Renders the router at the top of the tree (replaces BrowserRouter in this mode)' },
  { cmd: "npx create-react-router@latest my-app", cat: 'setup', pt: 'Scaffold do modo framework (v7 = React Router + Remix unificados)', en: 'Framework-mode scaffold (v7 = React Router + Remix unified)' },
  { cmd: "npm i @react-router/node @react-router/express", cat: 'setup', pt: 'Adapters de servidor para o modo framework (SSR/estático)', en: 'Server adapters for framework mode (SSR/static)' },

  // ─── Rotas & Matching ───────────────────────────────────────────────────
  { cmd: "{ path: '/users/:userId', element: <UserPage /> }", cat: 'routing', pt: 'Segmento dinâmico — o valor chega via useParams()', en: 'Dynamic segment — value arrives via useParams()' },
  { cmd: "{ index: true, element: <HomePage /> }", cat: 'routing', pt: 'Index route: o filho padrão renderizado quando o pai casa exato', en: 'Index route: default child rendered when the parent matches exactly' },
  { cmd: "{ path: '*', element: <NotFoundPage /> }", cat: 'routing', pt: 'Splat / catch-all — pega tudo que não casou (página 404)', en: 'Splat / catch-all — matches everything else (404 page)' },
  { cmd: "lazy: () => import('./AdminPage')", cat: 'routing', pt: 'Lazy loading da rota — code-split automático do módulo', en: 'Lazy route — automatic code-splitting of the module' },
  { cmd: "{ path: 'dashboard', children: [...] }", cat: 'routing', pt: 'Paths relativos: filho monta sobre o pai (ex.: /dashboard/...)', en: 'Relative paths: child mounts under the parent (e.g. /dashboard/...)' },
  { cmd: "{ path: '/', element: <AppLayout />, children: [ { index: true, element: <Home /> } ] }", cat: 'routing', pt: 'O padrão deste devtools: rota raiz com children (layout) e index', en: 'This devtools pattern: root route with children (layout) and an index' },
  { cmd: "caseSensitive: true", cat: 'routing', pt: 'Só casa se a caixa da URL bater exatamente', en: 'Only matches if URL casing matches exactly' },
  { cmd: "{ id: 'root', ... }  // nomeia a rota", cat: 'routing', pt: 'Nomeia a rota para useRouteLoaderData(\"id\") e useMatches()', en: 'Names the route for useRouteLoaderData("id") and useMatches()' },
  { cmd: "<Routes><Route path=\"/a\" element={<A />} /></Routes>", cat: 'routing', pt: 'Modo declarativo ainda existe — mas não habilita loaders/actions', en: 'Declarative mode still exists — but it does not enable loaders/actions' },

  // ─── Navegação & Links ──────────────────────────────────────────────────
  { cmd: "<Link to=\"/users/42\">Usuário</Link>", cat: 'navigation', pt: 'Renderiza <a> com navegação client-side (sem reload)', en: 'Renders an <a> with client-side navigation (no reload)' },
  { cmd: "<NavLink to=\"/users\" className={({ isActive }) => isActive ? 'active' : ''}>", cat: 'navigation', pt: 'NavLink dá isActive/isPending pra estilizar o item atual', en: 'NavLink exposes isActive/isPending to style the current item' },
  { cmd: "const navigate = useNavigate()   navigate('/users')", cat: 'navigation', pt: 'Navega programaticamente (imperative)', en: 'Navigates programmatically (imperative)' },
  { cmd: "navigate(-1)  // voltar", cat: 'navigation', pt: 'Vai pra trás no histórico (como o botão back)', en: 'Goes back in history (like the back button)' },
  { cmd: "navigate('/login', { replace: true })", cat: 'navigation', pt: 'Substitui a entrada atual no histórico (não empilha)', en: 'Replaces the current history entry (does not stack)' },
  { cmd: "navigate('/checkout', { state: { from: 'cart' } })", cat: 'navigation', pt: 'Passa dados junto sem encher a URL (lê com useLocation().state)', en: 'Passes data along without polluting the URL (read with useLocation().state)' },
  { cmd: "const { state } = useLocation()", cat: 'navigation', pt: 'Lê o state passado na navegação (útil p/ mensagens/routes de origem)', en: 'Reads the state passed during navigation (useful for messages/source routes)' },
  { cmd: "<Navigate to=\"/login\" replace />", cat: 'navigation', pt: 'Redirect declarativo no render (SPA) — use redirect() em loaders', en: 'Declarative redirect in render (SPA) — use redirect() in loaders' },
  { cmd: "useNavigationType()  // 'POP' | 'PUSH' | 'REPLACE'", cat: 'navigation', pt: 'Como a navegação atual aconteceu (back, link ou replace)', en: 'How the current navigation happened (back, link or replace)' },

  // ─── Hooks de Leitura ───────────────────────────────────────────────────
  { cmd: "const { userId } = useParams()", cat: 'hooks', pt: 'Lê os parâmetros de :segments da rota atual', en: 'Reads the :segments parameters of the current route' },
  { cmd: "useParams()['*']", cat: 'hooks', pt: 'Valor do splat (tudo que casou com *)', en: 'The splat value (everything matched by *)' },
  { cmd: "const [searchParams, setSearchParams] = useSearchParams()", cat: 'hooks', pt: 'Lê/escreve a query string da URL de forma reativa', en: 'Read/write the URL query string reactively' },
  { cmd: "searchParams.get('q')  // valor único", cat: 'hooks', pt: 'Lê um parâmetro de query (null se não existe)', en: 'Reads a single query parameter (null if absent)' },
  { cmd: "setSearchParams({ q: 'hot' })", cat: 'hooks', pt: 'Define a query (navega relativo por padrão; adicione replace:true pra não empilhar)', en: 'Sets the query (navigates relatively by default; add replace: true to avoid stacking)' },
  { cmd: "setSearchParams(prev => ({ ...prev, page: '3' }), { replace: true })", cat: 'hooks', pt: 'Setter funcional + replace: atualiza um campo sem perder os outros', en: 'Functional setter + replace: updates one field without dropping the others' },
  { cmd: "const location = useLocation()", cat: 'hooks', pt: 'Objeto { pathname, search, hash, state, key } da rota atual', en: 'Current route object { pathname, search, hash, state, key }' },
  { cmd: "useMatches()", cat: 'hooks', pt: 'Array das rotas ativas do match (id, pathname, data de cada loader)', en: 'Array of active route matches (id, pathname, each loader data)' },
  { cmd: "useRouteLoaderData('root')", cat: 'hooks', pt: 'Lê o dado do loader de OUTRA rota ativa, usando o id dela', en: 'Reads the loader data of another active route, by its id' },
  { cmd: "const navigation = useNavigation()", cat: 'hooks', pt: 'Estado global da navegação: idle | loading | submitting', en: 'Global navigation state: idle | loading | submitting' },

  // ─── Loaders & Actions ──────────────────────────────────────────────────
  { cmd: "loader: async ({ params, request }) => {\n  return api.get('/users/' + params.userId)\n}", cat: 'data', pt: 'Roda ANTES de renderizar — o retorno vira o dado da rota (useLoaderData)', en: 'Runs BEFORE render — its return becomes the route data (useLoaderData)' },
  { cmd: "const data = useLoaderData()", cat: 'data', pt: 'Lê o retorno do loader da rota atual no componente', en: 'Reads the current route loader result in the component' },
  { cmd: "return redirect('/login')", cat: 'data', pt: 'De dentro de um loader/action — desvia a navegação', en: 'From inside a loader/action — diverts the navigation' },
  { cmd: "action: async ({ request, params }) => {\n  const form = await request.formData()\n  return api.post('/users', form.get('name'))\n}", cat: 'data', pt: 'Roda em submit de <Form> — retorno acessível via useActionData()', en: 'Runs on <Form> submit — return accessible via useActionData()' },
  { cmd: "const result = useActionData()", cat: 'data', pt: 'Lê o retorno da última action (mensagens de erro/validação)', en: 'Reads the last action result (error/validation messages)' },
  { cmd: "throw new Response(null, { status: 404 })", cat: 'data', pt: 'Erro de loader/action sobe pro errorElement da rota', en: 'A loader/action error bubbles up to the route errorElement' },
  { cmd: "defer({ stats: loadStats() })  +  <Await resolve={data.stats}>", cat: 'data', pt: 'Streaming: renderiza antes e resolva a promessa com <Await>', en: 'Streaming: render early and resolve the promise with <Await>' },
  { cmd: "async function loader({ request }) { request.url; request.headers }", cat: 'data', pt: 'O loader recebe o Request real (URL, headers, método)', en: 'The loader receives the real Request (URL, headers, method)' },

  // ─── Formulários & Fetchers ─────────────────────────────────────────────
  { cmd: "<Form method=\"post\" action=\"/users\">...</Form>", cat: 'forms', pt: 'Submit navega até a rota e dispara a action correspondente', en: 'Submitting navigates to the route and fires its action' },
  { cmd: "form.get('name')  // no action", cat: 'forms', pt: 'request.formData() devolve FormData — leia com .get(dot) por nome', en: 'request.formData() returns a FormData — read fields by name' },
  { cmd: "const submit = useSubmit()   submit(formRef.current)", cat: 'forms', pt: 'Submit programático de um <form> que não é o Form do router', en: 'Programmatic submit of a plain form element' },
  { cmd: "const fetcher = useFetcher()", cat: 'forms', pt: 'Loaders/actions sem navegação — atualiza parte da UI sem mudar a URL', en: 'Loaders/actions without navigation — updates part of the UI without changing the URL' },
  { cmd: "<fetcher.Form method=\"post\">...</fetcher.Form>", cat: 'forms', pt: 'Form vinculado ao fetcher (não navega)', en: 'A form tied to the fetcher (does not navigate)' },
  { cmd: "fetcher.submit(data, { method: 'post' })", cat: 'forms', pt: 'Enviar dados para a action do fetcher', en: 'Sends data to the fetcher action' },
  { cmd: "fetcher.state  fetcher.data", cat: 'forms', pt: 'Estados de upload (idle/submitting/loading) e o último retorno', en: 'Upload status (idle/submitting/loading) and the last return value' },
  { cmd: "<input type=\"hidden\" name=\"_method\" value=\"delete\" />", cat: 'forms', pt: 'FormAction suporta get/post; use _method (ou Form method) pros demais verbos', en: 'FormAction supports get/post; use _method (or Form method) for other verbs' },

  // ─── Layouts & Error Boundaries ─────────────────────────────────────────
  { cmd: "<Outlet />", cat: 'nesting', pt: 'Ponto onde o filho casado é renderizado dentro do layout pai', en: 'Where the matched child renders inside the parent layout' },
  { cmd: "// rotas aninhadas: pai é o layout, filhos preenchem o <Outlet>", cat: 'nesting', pt: 'Layout route: o pai sem path próprio só dá o molde (header/sidebar/footer)', en: 'Layout route: the parent with no path of its own provides the shell (header/sidebar/footer)' },
  { cmd: "{ path: '/users', element: <UsersPage />, errorElement: <RouteError /> }", cat: 'nesting', pt: 'errorElement captura erros do loader/action/render daquele ramo', en: 'errorElement catches errors from that branch loader/action/render' },
  { cmd: "const { message, status } = useRouteError()", cat: 'nesting', pt: 'Dentro do errorElement, lê o que foi lançado (Error ou Response)', en: 'Inside the errorElement, reads what was thrown (Error or Response)' },
  { cmd: "Component: ProfilePage  // vs  element: <ProfilePage />", cat: 'nesting', pt: 'Forma Component evita re-render/remount em todo match da rota', en: 'Component form avoids re-render/remount on every route match' },
  { cmd: "HydrateFallback: () => <PageSkeleton />", cat: 'nesting', pt: 'Modo framework: splash enquanto o bundle hidrata', en: 'Framework mode: splash while the bundle hydrates' },

  // ─── Gotchas & v7 ───────────────────────────────────────────────────────
  { cmd: "importe de 'react-router', não 'react-router-dom'", cat: 'gotchas', pt: 'No v7 o react-router-dom é alias deprecado — tudo mais é re-exportado do react-router', en: 'Import from react-router — react-router-dom is a deprecated alias in v7' },
  { cmd: "loaders/actions/fetchers exigem data router", cat: 'gotchas', pt: '<BrowserRouter> puro não roda loader()/action()/useFetcher — use createBrowserRouter + RouterProvider', en: 'Plain <BrowserRouter> does not run loader()/action()/useFetcher — use createBrowserRouter + RouterProvider' },
  { cmd: "loader tem queretornar dado serializável", cat: 'gotchas', pt: 'Sem funções/componentes no retorno — de error a data pelo fetch JSON, tudo precisa atravessar wire', en: 'No functions/components in the return — everything must cross the wire as serializable data' },
  { cmd: "useSearchParams navega relativo por padrão", cat: 'gotchas', pt: 'Cada setSearchParams empurra um histórico novo — passe { replace: true } pra não empilhar filtros', en: 'Each setSearchParams pushes a new history entry — pass { replace: true } to avoid filter stacks' },
  { cmd: "redirect() precisa ser retornado OU lançado", cat: 'gotchas', pt: 'return redirect(...) ou throw redirect(...) — sem isso a navegação não desvia', en: 'return redirect(...) or throw redirect(...) — otherwise the navigation does not divert' },
  { cmd: "useNavigate não funciona em loader/action", cat: 'gotchas', pt: 'Nesses contextos não há componente — desvie com redirect()', en: 'No component in those contexts — divert with redirect()' },
  { cmd: "componentes inline no element remontam", cat: 'gotchas', pt: 'element={<div Foo={x}/>} recria a árvore a cada match — hoist o componente para fora', en: 'element={<div Foo={x}/>} rebuilds the tree on every match — hoist the component out' },
  { cmd: "key no elemento força remount", cat: 'gotchas', pt: 'key={userId} no element reinicia o componente quando o param muda (reload de dados locais)', en: 'key={userId} on the element remounts it when the param changes (local data reload)' },
  { cmd: "state via useLocation é journey-only", cat: 'gotchas', pt: 'location.state some se a página for recarregada — não guarde dado crucial lá', en: 'location.state is lost on a full page reload — do not put critical data there' },
  { cmd: "no modo framework o loader roda no servidor também", cat: 'gotchas', pt: 'Use request para checar auth/token e mantenha acesso a DB no loader, não no componente', en: 'In framework mode the loader also runs on the server — check auth via request and keep DB access in loaders' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de React Router v7',
    intro: 'Coleção pesquisável do React Router v7 — o router que o próprio devtools usa (react-router ^7.1.0). Cobrindo o data router (createBrowserRouter), rotas aninhadas, loaders/actions, formulários com fetchers e os gotchas da migração do v7 (que unificou React Router com Remix).',
    tipTitle: 'Por que esta referência existe',
    tipBody: <>O <Text strong>v7</Text> fundiu o React Router clássico com o Remix: agora <Text code>loader()</Text>/<Text code>action()</Text>, <Text code>errorElement</Text> e <Text code>useFetcher</Text> fazem parte do router único, e <Text code>react-router-dom</Text> virou só um alias deprecado. A maior pegadinha: essas features só funcionam com o <Text code>createBrowserRouter</Text> + <Text code>RouterProvider</Text>, não com o <Text code>&lt;BrowserRouter&gt;</Text> puro.</>,
    search: 'Buscar um snippet ou descrição...',
    all: 'Todos',
    empty: 'Nenhuma correspondência encontrada. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte dos dados (JSON)',
    noteTitle: 'Modo framework vs modo biblioteca',
    noteBody: 'No v7, o modo framework (create-react-router, com SSR/loaders no servidor) e o modo biblioteca (SPA com data router) compartilham a mesma API. Todos os snippets aqui funcionam no modo biblioteca — o padrão deste projeto.',
  },
  en: {
    title: 'React Router v7 Cheat Sheet',
    intro: 'Searchable collection covering React Router v7 — the router used by this very devtools (react-router ^7.1.0). Covering the data router (createBrowserRouter), nested routes, loaders/actions, fetcher-powered forms and the v7 migration gotchas (v7 unified React Router with Remix).',
    tipTitle: 'Why this reference exists',
    tipBody: <>The <Text strong>v7</Text> merged classic React Router with Remix: <Text code>loader()</Text>/<Text code>action()</Text>, <Text code>errorElement</Text> and <Text code>useFetcher</Text> are now part of the single router, and <Text code>react-router-dom</Text> is only a deprecated alias. The biggest gotcha: these features only work with <Text code>createBrowserRouter</Text> + <Text code>RouterProvider</Text>, not with a plain <Text code>&lt;BrowserRouter&gt;</Text>.</>,
    search: 'Search a snippet or description...',
    all: 'All',
    empty: 'No matches found. Try another search or category.',
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
    noteTitle: 'Framework mode vs library mode',
    noteBody: 'In v7, framework mode (create-react-router, SSR/server loaders) and library mode (SPA with the data router) share the same API. Every snippet here works in library mode — the pattern used by this project.',
  },
}

export default function ReactRouterCheatsheetPage() {
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
        (c[lang] || '').toLowerCase().includes(q) ||
        labelOf[c.cat][lang].toLowerCase().includes(q)
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
      <Title level={2}><LinkOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<LinkOutlined />} message={t.tipTitle} description={t.tipBody} />
      <Alert type="success" showIcon message={t.noteTitle} description={t.noteBody} />

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

      <Collapse items={[
        {
          key: 'source',
          label: t.source,
          children: (
            <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
              <code>{JSON.stringify(COMMANDS, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}