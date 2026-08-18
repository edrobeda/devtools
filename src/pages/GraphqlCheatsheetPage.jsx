import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined, ApiOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'schema',
  'query',
  'variables',
  'mutations',
  'subscriptions',
  'introspection',
  'directives',
  'server',
  'client',
  'tools',
]

const CATEGORY_COLOR = {
  schema: 'geekblue',
  query: 'green',
  variables: 'cyan',
  mutations: 'volcano',
  subscriptions: 'purple',
  introspection: 'gold',
  directives: 'orange',
  server: 'magenta',
  client: 'blue',
  tools: 'lime',
}

const labelOf = {
  schema: { pt: 'Esquema & tipos', en: 'Schema & types' },
  query: { pt: 'Consultas (Queries)', en: 'Queries' },
  variables: { pt: 'Variáveis', en: 'Variables' },
  mutations: { pt: 'Mutações', en: 'Mutations' },
  subscriptions: { pt: 'Assinaturas', en: 'Subscriptions' },
  introspection: { pt: 'Introspecção', en: 'Introspection' },
  directives: { pt: 'Diretivas', en: 'Directives' },
  server: { pt: 'Servidor & resolvers', en: 'Server & resolvers' },
  client: { pt: 'Cliente & boas práticas', en: 'Client & best practices' },
  tools: { pt: 'Ferramentas', en: 'Tooling' },
}

const COMMANDS = [
  // ─── Esquema & tipos ───────────────────────────────────────────────────────
  { cmd: 'type Query { user(id: ID!): User }', cat: 'schema', pt: 'Define um campo raiz de leitura no tipo Query', en: 'Defines a root read field on the Query type' },
  { cmd: 'type Mutation { createUser(name: String!): User }', cat: 'schema', pt: 'Define uma operação de escrita raiz', en: 'Defines a root write operation' },
  { cmd: 'type Subscription { messageAdded: Message }', cat: 'schema', pt: 'Operação de tempo real entregue via WebSocket', en: 'Real-time operation delivered over WebSocket' },
  { cmd: 'type User { id: ID! name: String! email: String }', cat: 'schema', pt: 'Objeto com campos tipados — ! significa obrigatório', en: 'Object with typed fields — ! means non-null' },
  { cmd: '[String]  [String!]!', cat: 'schema', pt: 'Lista opcional com itens opcionais vs lista não-nula com itens não-nulos', en: 'Nullable list with nullable items vs non-null list with non-null items' },
  { cmd: 'scalar DateTime', cat: 'schema', pt: 'Scalar customizado — você implementa a validação no servidor', en: 'Custom scalar — you implement the validation on the server' },
  { cmd: 'enum Role { ADMIN USER GUEST }', cat: 'schema', pt: 'Enum com conjunto fechado de valores', en: 'Enum with a closed set of values' },
  { cmd: 'input CreateUserInput { name: String! email: String }', cat: 'schema', pt: 'Tipo de entrada para argumentos complexos (só mutations/queries)', en: 'Input type for complex arguments (queries/mutations only)' },
  { cmd: 'interface Node { id: ID! }', cat: 'schema', pt: 'Contrato abstrato que os tipos podem implementar', en: 'Abstract contract that types can implement' },
  { cmd: 'type User implements Node { id: ID! name: String }', cat: 'schema', pt: 'Declara que o tipo implementa uma interface', en: 'Declares that a type implements an interface' },
  { cmd: 'union SearchResult = User | Post', cat: 'schema', pt: 'Union — o resultado é um dos tipos listados', en: 'Union — the result is one of the listed types' },
  { cmd: 'type User { id: ID! }  type Query { users: [User!]! }', cat: 'schema', pt: 'Um tipo só é exposto se for alcançável a partir de Query', en: 'A type is only exposed if reachable from Query' },
  { cmd: '"Descrição pública" type Query { user: User }', cat: 'schema', pt: 'Docstrings viram a descrição mostrada na IDE e no schema', en: 'Docstrings become the description shown in the IDE and schema' },
  { cmd: 'directive @auth(role: Role) on FIELD_DEFINITION', cat: 'schema', pt: 'Declara uma diretiva customizada do servidor', en: 'Declares a server-side custom directive' },

  // ─── Consultas ─────────────────────────────────────────────────────────────
  { cmd: '{ user(id: 1) { name } }', cat: 'query', pt: 'Consulta mínima — selecione exatamente os campos que quer', en: 'Minimal query — select exactly the fields you want' },
  { cmd: 'query GetUser { user(id: 1) { name email } }', cat: 'query', pt: 'Operação nomeada (palavra-chave query + nome)', en: 'Named operation (query keyword + name)' },
  { cmd: '{ me { name friends { name } } }', cat: 'query', pt: 'Campos aninhados — uma chamada resolve relações inteiras', en: 'Nested fields — one call resolves whole relations' },
  { cmd: '{ user(id: 1) { fullName: name } }', cat: 'query', pt: 'Alias — renomeia o campo na resposta', en: 'Alias — renames the field in the response' },
  { cmd: '{ users(role: ADMIN) { name } }', cat: 'query', pt: 'Argumentos por campo — não há verbos nem URLs por recurso', en: 'Arguments per field — no verbs or per-resource URLs' },
  { cmd: 'fragment UserFields on User { id name }', cat: 'query', pt: 'Fragmento reutilizável definido sobre um tipo', en: 'Reusable fragment defined over a type' },
  { cmd: '{ user(id: 1) { ...UserFields } }', cat: 'query', pt: 'Espalha o fragmento na consulta', en: 'Spreads the fragment into the query' },
  { cmd: '{ search(term: "graphql") { ... on User { name } ... on Post { title } } }', cat: 'query', pt: 'Union/interface — seleciona campos por tipo concreto com ... on', en: 'Union/interface — select per concrete type with ... on' },
  { cmd: '{ __typename user(id: 1) { __typename name } }', cat: 'query', pt: '__typename — descobre o tipo real retornado (útil em unions)', en: '__typename — reveals the real returned type (useful in unions)' },
  { cmd: '{ user(id: 1) { name } }  { user(id: 2) { name } }', cat: 'query', pt: 'Duas consultas em uma requisição só', en: 'Two queries in a single request' },
  { cmd: 'query GetUsers($role: Role, $limit: Int = 10) { users(role: $role, first: $limit) { name } }', cat: 'query', pt: 'Variáveis com default no mesmo comando — role opcional', en: 'Variables with defaults in the same operation — role optional' },

  // ─── Variáveis ─────────────────────────────────────────────────────────────
  { cmd: 'query GetUser($id: ID!) { user(id: $id) { name } }', cat: 'variables', pt: 'Define e usa uma variável obrigatória ($tipo)', en: 'Defines and uses a required variable ($type)' },
  { cmd: '{ "query": "query GetUser($id: ID!) { user(id: $id) { name } }", "variables": { "id": 1 } }', cat: 'variables', pt: 'Corpo da requisição HTTP com query e variables separadas', en: 'HTTP request body with query and variables separated' },
  { cmd: 'query GetUser($id: ID! = 1) { user(id: $id) { name } }', cat: 'variables', pt: 'Valor padrão — a variável passa a ser opcional', en: 'Default value — the variable becomes optional' },
  { cmd: 'query GetUsers($first: Int = 10, $cursor: String) { users(first: $first, after: $cursor) { name } }', cat: 'variables', pt: 'Múltiplas variáveis — cada uma com seu tipo', en: 'Multiple variables — each with its own type' },
  { cmd: 'query ($id: ID!) { user(id: $id) { name } }', cat: 'variables', pt: 'Variável sem nomear a operação', en: 'Variables without a named operation' },
  { cmd: '{ "query": "mutation($v: Int!) { bump(n: $v) }", "variables": { "v": 3 } }', cat: 'variables', pt: 'Variáveis funcionam igual em mutations', en: 'Variables work the same way in mutations' },

  // ─── Mutações ──────────────────────────────────────────────────────────────
  { cmd: 'mutation { createUser(name: "Ana") { id name } }', cat: 'mutations', pt: 'Mutation básica — sempre selecione os campos de retorno', en: 'Basic mutation — always select the return fields' },
  { cmd: 'mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id } }', cat: 'mutations', pt: 'Mutation com input type e variável obrigatória', en: 'Mutation with an input type and a required variable' },
  { cmd: 'mutation { updateUser(id: 1, name: "Bob") { id name } }', cat: 'mutations', pt: 'Argumentos inline direto no campo', en: 'Inline arguments straight on the field' },
  { cmd: 'mutation { a: createUser(name: "A") { id } b: createUser(name: "B") { id } }', cat: 'mutations', pt: 'Campos de mutation rodam em série — diferente das queries', en: 'Mutation fields run serially — unlike queries' },
  { cmd: 'mutation { deleteUser(id: 1) { success } }', cat: 'mutations', pt: 'Apagar um registro devolvendo um status', en: 'Delete a record returning a status' },

  // ─── Assinaturas ───────────────────────────────────────────────────────────
  { cmd: 'subscription { messageAdded { text from { name } } }', cat: 'subscriptions', pt: 'Assina eventos novos — servidor empurra quando acontecem', en: 'Subscribes to new events — the server pushes as they happen' },
  { cmd: 'subscription onNewMessage { messageAdded { id } }', cat: 'subscriptions', pt: 'Assinatura nomeada, útil para identificar no cliente', en: 'Named subscription, handy to identify on the client' },
  { cmd: 'subscription { onStock(priceGt: 100) { symbol price } }', cat: 'subscriptions', pt: 'Argumentos na assinatura filtram quais eventos receber', en: 'Arguments on the subscription filter which events you receive' },

  // ─── Introspecção ──────────────────────────────────────────────────────────
  { cmd: '{ __schema { types { name } } }', cat: 'introspection', pt: 'Lista todos os tipos expostos pelo schema', en: 'Lists every type exposed by the schema' },
  { cmd: '{ __type(name: "User") { name fields { name type { name kind } } } }', cat: 'introspection', pt: 'Detalhes de um tipo e seus campos', en: 'Details of a type and its fields' },
  { cmd: '{ __schema { queryType { name } mutationType { name } subscriptionType { name } } }', cat: 'introspection', pt: 'Confirma os tipos raiz (Query/Mutation/Subscription)', en: 'Reveals the root types (Query/Mutation/Subscription)' },
  { cmd: '{ __type(name: "Role") { enumValues { name } } }', cat: 'introspection', pt: 'Valores disponíveis de um enum', en: 'Available values of an enum' },
  { cmd: '{ __schema { types { name kind } } }', cat: 'introspection', pt: 'Tipos com o kind (OBJECT, SCALAR, ENUM, INPUT_OBJECT...)', en: 'Types with their kind (OBJECT, SCALAR, ENUM, INPUT_OBJECT...)' },
  { cmd: '{ __schema { types { name fields { name type { name kind ofType { name kind } } } } } }', cat: 'introspection', pt: 'Introspecção completa — usada para gerar o SDL do schema', en: 'Full introspection — used to regenerate the schema SDL' },

  // ─── Diretivas ─────────────────────────────────────────────────────────────
  { cmd: '{ user(id: 1) { name email @include(if: true) } }', cat: 'directives', pt: '@include — inclui o campo só quando a condição é true', en: '@include — includes the field only when the condition is true' },
  { cmd: '{ user(id: 1) { name email @skip(if: true) } }', cat: 'directives', pt: '@skip — pula o campo quando a condição é true', en: '@skip — skips the field when the condition is true' },
  { cmd: 'type User { id: ID! @deprecated(reason: "use uuid") }', cat: 'directives', pt: '@deprecated — marca campo como obsoleto no schema', en: '@deprecated — marks a field as obsolete in the schema' },
  { cmd: 'query GetUser($withEmail: Boolean!) { user(id: 1) { name email @include(if: $withEmail) } }', cat: 'directives', pt: 'Diretiva controlada por variável — evita campos condicionais', en: 'Directive driven by a variable — avoids conditional fields' },

  // ─── Servidor & resolvers ──────────────────────────────────────────────────
  { cmd: 'const resolver = (parent, args, context, info) => {}', cat: 'server', pt: 'Assinatura padrão de um resolver no servidor', en: 'Standard resolver signature on the server' },
  { cmd: 'Query: { user: (_, { id }) => db.findById(id) }', cat: 'server', pt: 'Resolver de Query — parent é sempre null (vem da raiz)', en: 'Query resolver — parent is always null (comes from the root)' },
  { cmd: 'User: { posts: (user, _, ctx) => ctx.db.postsByUser(user.id) }', cat: 'server', pt: 'Resolver de campo — recebe o objeto pai e resolve o filho', en: 'Field resolver — receives the parent and resolves the child' },
  { cmd: 'const server = new ApolloServer({ typeDefs, resolvers, context: ({ req }) => ({ user: req.user, db }) })', cat: 'server', pt: 'Contexto — compartilha autenticação e acesso a dados com todos os resolvers', en: 'Context — shares auth and data access with every resolver' },
  { cmd: 'Mutation: { createUser: (_, { input }, ctx) => ctx.db.createUser(input) }', cat: 'server', pt: 'Resolver de mutation — tipicamente recebe um input type', en: 'Mutation resolver — typically receives an input type' },
  { cmd: 'const userLoader = new DataLoader(ids => db.usersByIds(ids))', cat: 'server', pt: 'DataLoader — agrupa e cacheia, resolve o problema N+1', en: 'DataLoader — batches and caches, solves the N+1 problem' },
  { cmd: 'posts: (user, _, ctx) => ctx.loaders.postsByUser.load(user.id)', cat: 'server', pt: 'Usa o loader no resolver de campo em vez de uma query por item', en: 'Uses the loader in the field resolver instead of one query per item' },
  { cmd: 'throw new GraphQLError("sem permissao", { extensions: { code: "FORBIDDEN" } })', cat: 'server', pt: 'Erro estruturado com código — o cliente pode tratar por código', en: 'Structured error with a code — clients can react to the code' },
  { cmd: 'Query: { users: (_, { first, after }, ctx) => paginate(ctx.db.users, { first, after }) }', cat: 'server', pt: 'Paginação cursor-based no resolver (padrão Relay: first/after)', en: 'Cursor-based pagination in the resolver (Relay style: first/after)' },

  // ─── Cliente & boas práticas ───────────────────────────────────────────────
  { cmd: 'fetch("/graphql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "query GetUser($id: ID!) { user(id: $id) { name } }", variables: { id: 1 } }) })', cat: 'client', pt: 'Requisição via fetch — uma só URL, POST para tudo', en: 'Fetch request — a single URL, POST for everything' },
  { cmd: '{ "data": { "user": { "name": "Ana" } } }', cat: 'client', pt: 'Resposta de sucesso — data espelha a forma da query', en: 'Success response — data mirrors the query shape' },
  { cmd: '{ "errors": [{ "message": "Cannot query field \\"x\\"", "locations": [{ "line": 1 }] }] }', cat: 'client', pt: 'Erro de validação — o servidor responde 200 com errors', en: 'Validation error — the server replies 200 with errors' },
  { cmd: 'query GetUser($id: ID!) { user(id: $id) { ...UserFields } }  fragment UserFields on User { id name }', cat: 'client', pt: 'Fragmento reutilizado entre queries e mutations evita duplicação', en: 'Fragments reused across queries and mutations avoid duplication' },
  { cmd: 'client.query({ query: GET_USER, variables: { id: 1 } })', cat: 'client', pt: 'Apollo Client — query reativa com cache normalizado', en: 'Apollo Client — reactive query with a normalized cache' },
  { cmd: 'client.mutate({ mutation: CREATE_USER, variables: { input } })', cat: 'client', pt: 'Apollo Client — mutation seguida de atualização automática do cache', en: 'Apollo Client — mutation followed by automatic cache updates' },
  { cmd: 'query GetUser($id: ID!) { user(id: $id) { name } }', cat: 'client', pt: 'Busque só o que a tela usa — nada de SELECT * nem over-fetching', en: 'Fetch only what the screen uses — no SELECT * or over-fetching' },

  // ─── Ferramentas ───────────────────────────────────────────────────────────
  { cmd: "curl -X POST https://api.example.com/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{ user(id: 1) { name } }\"}'", cat: 'tools', pt: 'Testar a API direto do terminal com curl', en: 'Test the API straight from the terminal with curl' },
  { cmd: "curl -G https://api.example.com/graphql --data-urlencode 'query={ user(id: 1) { name } }'", cat: 'tools', pt: 'Consulta de leitura via GET passando a query na URL', en: 'Read-only query via GET passing the query in the URL' },
  { cmd: 'npx graphql-codegen --config codegen.yml', cat: 'tools', pt: 'Gera tipos TypeScript a partir do schema', en: 'Generates TypeScript types from the schema' },
  { cmd: 'npx graphql-schema-linter schema.graphql', cat: 'tools', pt: 'Linter de boas práticas do schema (naming, deprecations)', en: 'Schema best-practice linter (naming, deprecations)' },
  { cmd: 'npx apollo schema:download --endpoint=https://api.example.com/graphql', cat: 'tools', pt: 'Baixa o schema SDL do endpoint via introspecção', en: 'Downloads the schema SDL from the endpoint via introspection' },
  { cmd: 'GraphiQL / Apollo Sandbox', cat: 'tools', pt: 'IDE embutida para explorar schema, autocomplete e testar queries', en: 'Embedded IDE to explore the schema, autocomplete and test queries' },
  { cmd: 'npm i graphql-tag', cat: 'tools', pt: 'Pacote para escrever queries com a tag gql em JS', en: 'Package to write queries with the gql tag in JS' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de GraphQL',
    intro: (
      <>
        Referência pesquisável da linguagem GraphQL 100% no navegador —
        schema e tipos (scalars, enums, interfaces, unions, inputs),
        consultas com fragmentos e aliases, variáveis, mutations,
        assinaturas em tempo real, introspecção, diretivas (
        <Text code>@include</Text>/<Text code>@skip</Text>/
        <Text code>@deprecated</Text>), resolvers e padrões de servidor
        (context, DataLoader contra o problema N+1, paginação por cursor),
        boas práticas de cliente e ferramentas do ecossistema (codegen,
        schema linter, curl, Apollo). Só texto de referência — nada sai do
        navegador.
      </>
    ),
    gotchasTitle: 'Gotchas que mais pegam',
    gotchasBody: (
      <>
        Sempre selecione os campos de retorno — não existe &quot;SELECT
        *&quot; no GraphQL e mutation que não devolve nada não traz dados.
        Toda request é POST (GET só vale para query pura via URL). Campos de
        mutation executam em série; campos de query, em paralelo. O servidor
        responde HTTP 200 mesmo quando a resposta traz{' '}
        <Text code>errors</Text> — trate pela chave <Text code>errors</Text>,
        não pelo status HTTP. Lista não-nula é <Text code>[T!]!</Text> — a
        lista e cada item. Introspecção deveria ser desligada em produção se
        você não quer expor o schema. Resolvers aninhados um a um geram o
        problema N+1 — use DataLoader.
      </>
    ),
    search: 'Buscar snippet ou descrição...',
    all: 'Todos',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'GraphQL Cheat Sheet',
    intro: (
      <>
        A searchable reference for the GraphQL language, 100% in the browser —
        schema and types (scalars, enums, interfaces, unions, inputs),
        queries with fragments and aliases, variables, mutations,
        real-time subscriptions, introspection, directives (
        <Text code>@include</Text>/<Text code>@skip</Text>/
        <Text code>@deprecated</Text>), resolvers and server patterns
        (context, DataLoader against the N+1 problem, cursor pagination),
        client best practices and ecosystem tooling (codegen, schema linter,
        curl, Apollo). Reference text only — nothing leaves the browser.
      </>
    ),
    gotchasTitle: 'Gotchas that bite',
    gotchasBody: (
      <>
        Always select the return fields — there is no &quot;SELECT *&quot; in
        GraphQL, and a mutation that returns nothing gives you no data.
        Every request is POST (GET is only valid for a pure query via URL).
        Mutation fields run serially; query fields run in parallel. The
        server replies HTTP 200 even when the response carries{' '}
        <Text code>errors</Text> — handle the <Text code>errors</Text> key,
        not the HTTP status. A non-null list is <Text code>[T!]!</Text> —
        the list and each item. Introspection should be disabled in
        production if you do not want to expose the schema. One-by-one
        nested resolvers cause the N+1 problem — use DataLoader.
      </>
    ),
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

export default function GraphqlCheatsheetPage() {
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
      <Title level={2}><ApiOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="warning" showIcon icon={<CodeOutlined />} message={t.gotchasTitle} description={t.gotchasBody} />

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
