import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { DatabaseOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'setup',
  'usequery',
  'states',
  'querykeys',
  'usemutation',
  'infinite',
  'optimization',
  'gotchas',
]

const CATEGORY_COLOR = {
  setup: 'geekblue',
  usequery: 'green',
  states: 'cyan',
  querykeys: 'purple',
  usemutation: 'volcano',
  infinite: 'orange',
  optimization: 'blue',
  gotchas: 'red',
}

const labelOf = {
  setup: { pt: 'Setup & Config', en: 'Setup & config' },
  usequery: { pt: 'useQuery', en: 'useQuery' },
  states: { pt: 'Estados & Retorno', en: 'States & return' },
  querykeys: { pt: 'Query Keys & Cache', en: 'Query keys & cache' },
  usemutation: { pt: 'useMutation', en: 'useMutation' },
  infinite: { pt: 'Infinite Queries', en: 'Infinite queries' },
  optimization: { pt: 'Paralelismo & Performance', en: 'Parallelism & performance' },
  gotchas: { pt: 'Gotchas & Boas Práticas', en: 'Gotchas & best practices' },
}

const COMMANDS = [
  // ─── Setup & Config ─────────────────────────────────────────────────────
  { cmd: 'npm install @tanstack/react-query', cat: 'setup', pt: 'Instala a lib (maior atual = v5; o devtools é pacote separado)', en: 'Installs the lib (current major = v5; devtools is a separate package)' },
  { cmd: "npm install -D @tanstack/react-query-devtools", cat: 'setup', pt: 'Painel de inspeção (qualidade de rede, status por query)', en: 'Debug panel (network quality, per-query status)' },
  { cmd: "new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } })", cat: 'setup', pt: 'Client com defaults: stale 60s, 1 retry (padrão é 0ms stale + 3 retries)', en: 'Client with defaults: 60 s stale, 1 retry (default is 0 ms stale + 3 retries)' },
  { cmd: "<QueryClientProvider client={queryClient}><App /></QueryClientProvider>", cat: 'setup', pt: 'Prover o client — tudo abaixo precisa estar neste provider', en: 'Provide the client — everything below must be under this provider' },
  { cmd: "<ReactQueryDevtools initialIsOpen={false} />", cat: 'setup', pt: 'Adiciona o painel flutuante (ícone no canto inferior; isOpen=false para fechado)', en: 'Adds the floating panel (corner icon; false = starts closed)' },
  { cmd: "queryClient.getQueryCache().subscribe(console.log)", cat: 'setup', pt: 'Inscreve em TODAS as mudanças de cache (debug/profiling)', en: 'Subscribes to ALL cache changes (debug / profiling)' },
  { cmd: "queryClient.getQueryDefaults(['posts'])", cat: 'setup', pt: 'Lê defaults configurados com setQueryDefaults', en: 'Reads defaults set via setQueryDefaults' },

  // ─── useQuery ────────────────────────────────────────────────────────────
  { cmd: "useQuery({\n  queryKey: ['posts'],\n  queryFn: () => fetch('/api/posts').then(r => r.json()),\n})", cat: 'usequery', pt: 'Query mínima: identificada por queryKey; o queryFn faz a busca', en: 'Minimal query: identified by queryKey; queryFn performs the fetch' },
  { cmd: "queryKey: ['post', postId]", cat: 'usequery', pt: 'Chave em array — objetos dentro são serializados/hasheados por valor', en: 'Array key — nested objects are serialized/hashed by value' },
  { cmd: "enabled: !!userId", cat: 'usequery', pt: 'Só dispara quando truthy (atrasa busca com dependência)', en: 'Only runs when truthy (defers fetch behind a dependency)' },
  { cmd: "staleTime: 60_000", cat: 'usequery', pt: 'Fica fresco por 60 s — refetchs só acontecem depois disso', en: 'Fresh for 60 s — refetches only happen after this window' },
  { cmd: "gcTime: 5 * 60_000  // v5 (antes cacheTime)", cat: 'usequery', pt: 'Aguarda 5 min sem inscrição antes de remover do cache', en: 'Waits 5 min with no subscribers before removing from cache' },
  { cmd: "retry: 2  // ou (count, err) => count < 3 && !err.response?.status", cat: 'usequery', pt: 'Tentativas em caso de falha;回调 recebe o erro para decidir', en: 'Failure retries; callback receives the error to decide' },
  { cmd: "retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000)", cat: 'usequery', pt: 'Backoff exponencial com teto de 30 s', en: 'Exponential backoff with 30 s cap' },
  { cmd: "select: (data) => data.items.filter(i => i.active)", cat: 'usequery', pt: 'Transforma o dado antes de chegar em data (evita re-render)', en: 'Transforms data before it reaches data (avoids re-render)' },
  { cmd: "placeholderData: (prev) => prev", cat: 'usequery', pt: 'Mantém o dado anterior durante refetch (v5 substitui keepPreviousData)', en: 'Keeps previous data during refetch (v5 replaces keepPreviousData)' },
  { cmd: "refetchOnWindowFocus: true  // padrão", cat: 'usequery', pt: 'Refetch automático ao focar a janela (desativar se busca barata)', en: 'Refetch on window focus (disable if fetch is cheap)' },
  { cmd: "refetchInterval: 30_000  // false = desativa", cat: 'usequery', pt: 'Polling: refetch a cada N ms (ativa desativar quando tab oculta)', en: 'Polling: refetch every N ms (disable when tab is hidden)' },

  // ─── Estados & Retorno ──────────────────────────────────────────────────
  { cmd: "status: 'pending' | 'success' | 'error'", cat: 'states', pt: 'Estado principal (isPending/isSuccess/isError) — só muda com dados', en: 'Main status (isPending/isSuccess/isError) — only changes with data' },
  { cmd: "fetchStatus: 'idle' | 'fetching' | 'paused'", cat: 'states', pt: 'Estado da rede — isFetching = fetchStatus === "fetching"', en: 'Network state — isFetching = fetchStatus === "fetching"' },
  { cmd: "data", cat: 'states', pt: 'Último dado bem-sucedido (permanece durante refetch em background)', en: 'Last successful data (persists during background refetch)' },
  { cmd: "isPending  // status === 'pending'", cat: 'states', pt: 'Nenhum dado carregado ainda (primeira busca, erro ou resetado)', en: 'No data loaded yet (first fetch, error, or reset)' },
  { cmd: "isFetching  // fetchStatus === 'fetching'", cat: 'states', pt: 'Busca em andamento (inclui revalidação de fundo!)', en: 'Fetch in flight (includes background refetch!)' },
  { cmd: "isStale", cat: 'states', pt: 'true se passou do staleTime (dado desatualizado, logo será revalidado)', en: 'true if past staleTime (data is stale, will be revalidated soon)' },
  { cmd: "error  // Error | null", cat: 'states', pt: 'Erro da última tentativa; verifique error.message para diagnóstico', en: 'Last error; check error.message for diagnosis' },
  { cmd: "refetch()", cat: 'states', pt: 'Dispara busca manual (devolve uma Promise): await refetch()', en: 'Triggers a manual fetch (returns a Promise): await refetch()' },
  { cmd: "remove()", cat: 'states', pt: 'Remove a query do cache e marca como "não existe mais"', en: 'Removes the query from cache, marking it as gone' },
  { cmd: "isPlaceholderData", cat: 'states', pt: 'true se data veio de placeholderData (evita mostrar dados velhos)', en: 'true if data came from placeholderData (avoids ghost data)' },

  // ─── Query Keys & Cache ────────────────────────────────────────────────
  { cmd: "['todos', { page: 1 }]", cat: 'querykeys', pt: 'A chave é serializada por valor; a ordem dos campos importa', en: 'Key is serialized by value; field order matters' },
  { cmd: "queryClient.invalidateQueries({\n  queryKey: ['posts'],\n})", cat: 'querykeys', pt: 'Marca stale + refetch de TODAS as queries com prefixo ["posts"]', en: 'Invalidates (stale + refetch) all queries prefixed with ["posts"]' },
  { cmd: "queryClient.invalidateQueries({\n  queryKey: ['post', postId],\n})", cat: 'querykeys', pt: 'Invalida só a query exata — queries relativas são ignoradas', en: 'Exact key only — no prefix matching' },
  { cmd: "queryClient.invalidateQueries({\n  queryKey: ['posts'],\n  type: 'inactive',\n})", cat: 'querykeys', pt: 'Só invalida queries que NÃO têm componentes inscritos', en: 'Only invalidates queries with NO active observers' },
  { cmd: "queryClient.setQueryData(\n  ['post', id],\n  (old) => ({ ...old, ...patch })\n)", cat: 'querykeys', pt: 'Escreve direto no cache (otimista; evita espera do servidor)', en: 'Writes directly to cache (optimistic; skips server round-trip)' },
  { cmd: "queryClient.getQueryData(['post', id])", cat: 'querykeys', pt: 'Lê do cache sem inscrever (serve pra otimista)', en: 'Reads from cache without subscribing (useful for optimistic updates)' },
  { cmd: "queryClient.cancelQueries({ queryKey: ['posts'] })", cat: 'querykeys', pt: 'Cancela buscas em voo (AbortSignal dispara no queryFn)', en: 'Cancels in-flight fetches (AbortSignal fires in queryFn)' },
  { cmd: "queryClient.resetQueries({ queryKey: ['posts'] })", cat: 'querykeys', pt: 'Limpa dados + erro e volta ao estado inicial (fetch automático)', en: 'Clears data + error, returns to initial state (auto refetch)' },
  { cmd: "queryClient.removeQueries({ queryKey: ['posts'] })", cat: 'querykeys', pt: 'Apaga do cache sem refetch (limpa memória)', en: 'Deletes from cache with no refetch (frees memory)' },
  { cmd: "queryClient.getQueryState(['post', id])", cat: 'querykeys', pt: 'Consulta o objeto { dataUpdatedAt, status, fetchStatus, error } sem componente', en: 'Returns { dataUpdatedAt, status, fetchStatus, error } without a component' },
  { cmd: "queryClient.setQueryDefaults(\n  ['posts'],\n  { staleTime: 30_000 }\n)", cat: 'querykeys', pt: 'Defaults por prefixo (vale pra todos os observers com essa chave)', en: 'Per-prefix defaults (applies to all observers with this key)' },
  { cmd: "queryClient.isFetching({ queryKey: ['posts'] })", cat: 'querykeys', pt: 'Verifica se há busca ativa (fora de componente, em utils)', en: 'Check if a fetch is active (outside React, in utils)' },

  // ─── useMutation ─────────────────────────────────────────────────────────
  { cmd: "const mutation = useMutation({\n  mutationFn: (post) => api.post('/posts', post),\n})", cat: 'usemutation', pt: 'Mutação mínima: mutationFn recebe os dados de mutate()', en: 'Minimal mutation: mutationFn receives the data from mutate()' },
  { cmd: "mutation.mutate({ title: 'Olá' })", cat: 'usemutation', pt: 'Dispara a mutação assíncrona (não retorna Promise)', en: 'Fires the mutation asynchronously (does not return a Promise)' },
  { cmd: "await mutation.mutateAsync({ title: 'Oi' })", cat: 'usemutation', pt: 'Versão async — dá pra try/catch no componente', en: 'Async version — can try/catch in the component' },
  { cmd: "mutation.isPending  // mutation está rodando", cat: 'usemutation', pt: 'true enquanto mutate() está em andamento', en: 'true while mutate() is in flight' },
  { cmd: "mutation.isSuccess / mutation.isError", cat: 'usemutation', pt: 'Resultado da última mutação', en: 'Result of the last mutation' },
  { cmd: "mutation.error", cat: 'usemutation', pt: 'Objeto Error da última mutação falhada', en: 'Error object from the last failed mutation' },
  { cmd: "mutation.variables", cat: 'usemutation', pt: 'Argumentos da última chamada a mutate()', en: 'Arguments from the last mutate() call' },
  { cmd: "onSuccess: (data, variables, context) => {\n  queryClient.invalidateQueries({ queryKey: ['posts'] })\n}", cat: 'usemutation', pt: 'Executa no sucesso (o context vem do onMutate)', en: 'Runs on success (context comes from onMutate)' },
  { cmd: "onError: (error, variables, context) => {\n  queryClient.setQueryData(['posts'], context.prev)\n}", cat: 'usemutation', pt: 'Executa no erro (context.prev guarda o dado anterior para rollback)', en: 'Runs on error (context.prev holds old data for rollback)' },
  { cmd: "onSettled: (data, error, variables, context) => {}", cat: 'usemutation', pt: 'Executa sempre — sucesso ou erro — o fetch foi encerrado', en: 'Always runs — success or error — fetch is done' },

  // ─── Infinite Queries ──────────────────────────────────────────────────
  { cmd: "useInfiniteQuery({\n  queryKey: ['items'],\n  initialPageParam: 0,\n  queryFn: ({ pageParam }) => api.get('/items?p=' + pageParam),\n  getNextPageParam: (last) => last.next ?? undefined,\n})", cat: 'infinite', pt: 'Infinite query: pageParam obrigatório na v5; getNextPageParam sinaliza o fim', en: 'Infinite query: pageParam required in v5; undefined signals the end' },
  { cmd: "data.pages  // array de respostas", cat: 'infinite', pt: 'Cada busca retorna uma página; data.pages acumula todas', en: 'Each fetch adds a page; data.pages accumulates them all' },
  { cmd: "data.pageParams", cat: 'infinite', pt: 'Parâmetros passados por getNextPageParam em cada chamada', en: 'Parameters passed via getNextPageParam for each fetch' },
  { cmd: "fetchNextPage()", cat: 'infinite', pt: 'Dispara a próxima página (padrão automático; isFetchingNextPage controla o botão)', en: 'Fetches the next page (manual; isFetchingNextPage controls the button)' },
  { cmd: "hasNextPage  // boolean", cat: 'infinite', pt: 'false quando getNextPageParam retorna undefined (fim dos dados)', en: 'false when getNextPageParam returns undefined (no more data)' },
  { cmd: "getPreviousPageParam / fetchPreviousPage", cat: 'infinite', pt: 'Paginação reversa (buscas passadas do bis récent au plus ancien)', en: 'Reverse pagination (fetches from newest to oldest)' },

  // ─── Paralelismo & Performance ─────────────────────────────────────────
  { cmd: "useQueries({\n  queries: [\n    { queryKey: ['a'], queryFn: fetchA },\n    { queryKey: ['b'], queryFn: fetchB },\n  ],\n})", cat: 'optimization', pt: 'Queries em paralelo — retorna array de resultados', en: 'Parallel queries — returns an array of results' },
  { cmd: "const queryClient = useQueryClient()", cat: 'optimization', pt: 'Acessa o client dentro de um componente (pra setQueryData/getQueryData)', en: 'Access the client inside a component (for get/setQueryData)' },
  { cmd: "queryFn: ({ signal }) => fetch(url, { signal })", cat: 'optimization', pt: 'Recebe AbortSignal — respeitar pra cancelar em cancelQueries', en: 'Receives AbortSignal — honor it for cancelQueries to work' },
  { cmd: "queries deduplicam fetch por queryKey", cat: 'optimization', pt: 'Se 2 componentes usam a mesma chave, só 1 fetch é feito (e o resultado compartilhado)', en: 'Two observers with the same key share 1 fetch (shared result)' },
  { cmd: "networkMode: 'offlineFirst'", cat: 'optimization', pt: 'Comportamento offline: tried network, fallback cache; false = não busca', en: 'Offline behavior: tried network, fallback cache; false = no fetch' },
  { cmd: "suspense: true (no QueryClient.defaults ou por observer)", cat: 'optimization', pt: 'Lança Promise que o <Suspense> captura; useQuery joga erro se não tem fallback', en: 'Throws Promise caught by <Suspense>; useQuery throws if no fallback' },

  // ─── Gotchas & Boas Práticas ────────────────────────────────────────────
  { cmd: "staleTime ≠ gcTime", cat: 'gotchas', pt: 'stale = quando revalidar; gc = quando apagar do cache. São assuntos completamente diferentes', en: 'stale = when to revalidate; gc = when to evict from cache. Completely different concerns' },
  { cmd: "isPending muda só SEM dados; isFetching muda SEMPRE", cat: 'gotchas', pt: 'No refetch em background, isPending não muda — só isFetching vira true', en: 'On background refetch, isPending stays put — only isFetching flips to true' },
  { cmd: "invalidateQueries é ASSÍNCRONO", cat: 'gotchas', pt: 'O refetch do invalidateQueries não acontece na hora — precisa await', en: 'The refetch from invalidateQueries doesn\'t happen immediately — needs await' },
  { cmd: "_callbacks no objeto de useQuery são ignorados (deprecated na v5)", cat: 'gotchas', pt: 'onSuccess/onError/onSettled no useQuery({}) não rodam no v5; use o QueryClient', en: 'onSuccess/onError/onSettled in useQuery({}) don\'t run in v5; use QueryClient' },
  { cmd: "Não mutate o objeto queryKey", cat: 'gotchas', pt: 'Keys são serializadas — se mutar um objeto, o cache fica inconsistente', en: 'Keys are serialized — mutating an object breaks cache consistency' },
  { cmd: "Seletores têm custo", cat: 'gotchas', pt: 'Um select funcional roda em CADA objeto de dado — memoize() quando caro', en: 'A selector function runs on EVERY data object — memoize when expensive' },
  { cmd: "PlaceholderData vaza pra data", cat: 'gotchas', pt: 'Se mostrar data sem checar isPlaceholderData, usuário pode ver dados antigos como se fossem atuais', en: 'If you show data without checking isPlaceholderData, users may see stale data as fresh' },
  { cmd: "Mutations NÃO deduplicam", cat: 'gotchas', pt: 'Cada mutate() dispara uma chamada; duas mutações simultâneas podem causar race condition', en: 'Each mutate() fires; two simultaneous mutations may race with each other' },
  { cmd: "refetchInterval continua rodando mesmo com erro", cat: 'gotchas', pt: 'Se a busca falhar, o polling continua — desativar com retryDelay ou onError', en: 'On failure, polling keeps going — disable with retryDelay or onError' },
  { cmd: "Os dados são protegidos por referência", cat: 'gotchas', pt: 'Mutar data diretamente não dispara re-render; mutate com a setter do QueryClient', en: 'Mutating data directly won\'t re-render; use the QueryClient setter' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de TanStack Query (React Query)',
    intro: 'Coleção pesquisável da API do TanStack Query v5 — o gerenciador de estado assíncrono que o próprio devtools usa: configuração global, useQuery, useMutation, paginação infinita, invalidação de cache e os gotchas que mais pegam em produção.',
    tipTitle: 'Por que esta referência existe',
    tipBody: <>O <Text strong>react-query</Text> oculta toda a complexidade de rede em um modelo declarativo: staleTime gerencia revalidação, gcTime gerencia memória, queryKey gerencia invalidação, e assinatura reativa garante que o UI sempre reflita o dado mais recente. Domine esses quatro conceitos e metade dos bugs de UI desaparece.</>,
    search: 'Buscar um snippet ou descrição...',
    all: 'Todos',
    empty: 'Nenhuma correspondência encontrada. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte dos dados (JSON)',
  },
  en: {
    title: 'TanStack Query (React Query) Cheat Sheet',
    intro: 'Searchable collection covering TanStack Query v5 API — the async state manager used by this very devtools: global setup, useQuery, useMutation, infinite queries, cache invalidation and the gotchas that bite most in production.',
    tipTitle: 'Why this reference exists',
    tipBody: <>The <Text strong>react-query</Text> library hides all network complexity behind a declarative model: staleTime manages revalidation, gcTime manages memory, queryKey manages invalidation, and reactive subscriptions keep the UI in sync with the latest data. Master those four concepts and half of UI bugs vanish.</>,
    search: 'Search a snippet or description...',
    all: 'All',
    empty: 'No matches found. Try another search or category.',
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function TanstackQueryCheatsheetPage() {
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
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<DatabaseOutlined />} message={t.tipTitle} description={t.tipBody} />

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
