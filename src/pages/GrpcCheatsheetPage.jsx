import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined, ApiOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'proto',
  'rpc',
  'streams',
  'codegen',
  'servers',
  'clients',
  'errors',
  'interceptors',
  'deadlines',
  'tools',
]

const CATEGORY_COLOR = {
  proto: 'geekblue',
  rpc: 'green',
  streams: 'purple',
  codegen: 'cyan',
  servers: 'volcano',
  clients: 'blue',
  errors: 'red',
  interceptors: 'magenta',
  deadlines: 'gold',
  tools: 'lime',
}

const labelOf = {
  proto: { pt: 'Protocol Buffers (.proto)', en: 'Protocol Buffers (.proto)' },
  rpc: { pt: 'gRPC & métodos RPC', en: 'gRPC & RPC methods' },
  streams: { pt: 'Streams', en: 'Streams' },
  codegen: { pt: 'Codegen & arquivos gerados', en: 'Codegen & generated files' },
  servers: { pt: 'Servidor', en: 'Server' },
  clients: { pt: 'Cliente', en: 'Client' },
  errors: { pt: 'Erros & status', en: 'Errors & status' },
  interceptors: { pt: 'Interceptors & middlewares', en: 'Interceptors & middlewares' },
  deadlines: { pt: 'Deadlines & cancelamento', en: 'Deadlines & cancellation' },
  tools: { pt: 'Ferramentas', en: 'Tooling' },
}

const COMMANDS = [
  // ─── Protocol Buffers ──────────────────────────────────────────────────────
  { cmd: 'syntax = "proto3";', cat: 'proto', pt: 'Declara o dialeto da linguagem — proto3 é o padrão atual', en: 'Declares the language dialect — proto3 is the current default' },
  { cmd: 'package com.example.rpc;', cat: 'proto', pt: 'Namespace do pacote — vira o pacote/namespace no código gerado', en: 'Package namespace — becomes the package in the generated code' },
  { cmd: 'option go_package = "github.com/acme/pb";', cat: 'proto', pt: 'Caminho do pacote Go gerado', en: 'Go package path of the generated code' },
  { cmd: 'message User { string id = 1; string name = 2; }', cat: 'proto', pt: 'Define uma mensagem com campos — cada campo tem um número único', en: 'Defines a message with fields — each field has a unique number' },
  { cmd: 'int32  int64  uint32  uint64  sint32  sint64', cat: 'proto', pt: 'Tipos inteiros — sint* usam encodificação ZigZag (melhor para negativos)', en: 'Integer types — sint* use ZigZag encoding (better for negatives)' },
  { cmd: 'fixed32  fixed64  sfixed32  sfixed64', cat: 'proto', pt: 'Inteiros de largura fixa — mais rápidos de decodificar, maiores no fio', en: 'Fixed-width integers — faster to decode, larger on the wire' },
  { cmd: 'float  double  bool  string  bytes', cat: 'proto', pt: 'Tipos primitivos restantes', en: 'Remaining primitive types' },
  { cmd: 'enum Role { ROLE_UNSPECIFIED = 0; USER = 1; ADMIN = 2; }', cat: 'proto', pt: 'Enum — o primeiro valor deve ser 0 (zero por padrão)', en: 'Enum — the first value must be 0 (the default)' },
  { cmd: 'repeated string tags = 3;', cat: 'proto', pt: 'repeated — lista (array) de itens; em proto3 não existe required/optional explícito', en: 'repeated — a list (array) of items; proto3 has no explicit required/optional' },
  { cmd: 'map<string, string> labels = 4;', cat: 'proto', pt: 'Mapa chave/valor — as chaves sempre escalares', en: 'Key/value map — keys are always scalars' },
  { cmd: 'oneof contact { string email = 5; string phone = 6; }', cat: 'proto', pt: 'oneof — exatamente um dos campos pode ser preenchido por conjunto', en: 'oneof — exactly one of the fields can be set per message' },
  { cmd: 'import "common.proto";', cat: 'proto', pt: 'Importa outro arquivo .proto para reutilizar mensagens', en: 'Imports another .proto file to reuse messages' },
  { cmd: 'message Pagination { int32 page = 1; int32 size = 2; }', cat: 'proto', pt: 'Agrupa parâmetros repetidos numa mensagem (padrão comum em gRPC)', en: 'Groups repeated parameters into a message (common gRPC pattern)' },
  { cmd: 'message Timestamp { int64 seconds = 1; int32 nanos = 2; }', cat: 'proto', pt: 'Representação manual de tempo — use o well-known google.protobuf.Timestamp', en: 'Manual time representation — prefer the google.protobuf.Timestamp well-known type' },

  // ─── gRPC & métodos RPC ────────────────────────────────────────────────────
  { cmd: 'service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }', cat: 'rpc', pt: 'Declara um serviço com chamadas unárias (req→res)', en: 'Declares a service with unary calls (req→res)' },
  { cmd: 'rpc GetUsers (Empty) returns (stream User);', cat: 'rpc', pt: 'server streaming — o cliente manda um request e recebe um stream de respostas', en: 'server streaming — the client sends one request and receives a stream of responses' },
  { cmd: 'rpc Track (stream Point) returns (Summary);', cat: 'rpc', pt: 'client streaming — o cliente manda um stream e recebe uma resposta final', en: 'client streaming — the client sends a stream and gets one final response' },
  { cmd: 'rpc Chat (stream Message) returns (stream Message);', cat: 'rpc', pt: 'bidirectional streaming — ambos os lados enviam streams', en: 'bidirectional streaming — both sides send streams' },
  { cmd: 'option (google.api.http) = { post: "/v1/say" body: "*" };', cat: 'rpc', pt: 'gRPC-Gateway — expõe o mesmo RPC como REST', en: 'gRPC-Gateway — exposes the same RPC as REST' },
  { cmd: 'grpcurl -plaintext localhost:8080 list', cat: 'rpc', pt: 'Lista todos os serviços expostos num servidor gRPC', en: 'Lists every service exposed by a gRPC server' },
  { cmd: 'grpcurl -plaintext -d \'{"name":"Ana"}\' localhost:8080 greeter.Greeter/SayHello', cat: 'rpc', pt: 'Chama um RPC unário direto do terminal', en: 'Calls a unary RPC straight from the terminal' },
  { cmd: 'grpcurl -plaintext localhost:8080 describe greeter.Greeter', cat: 'rpc', pt: 'Descreve o contrato de um serviço (métodos e tipos)', en: 'Describes a service contract (methods and types)' },
  { cmd: 'grpcurl -plaintext -d \'{}\' localhost:8080 greeter.Greeter/SayHello -v', cat: 'rpc', pt: 'Modo verbose — mostra metadados de requisição/resposta', en: 'Verbose mode — shows request/response metadata' },

  // ─── Streams ───────────────────────────────────────────────────────────────
  { cmd: 'async for msg in stub.GetUsers(Empty()):', cat: 'streams', pt: 'Python — itera no server stream consumindo as mensagens', en: 'Python — iterates the server stream consuming messages' },
  { cmd: 'call = stub.Track(req_iter); summary = call.result()', cat: 'streams', pt: 'Python — envia um client stream e espera a resposta final', en: 'Python — sends a client stream and waits for the final response' },
  { cmd: 'for response in channel.invoke_stream(some_path, request):', cat: 'streams', pt: 'Node.js — consome um server stream', en: 'Node.js — consumes a server stream' },
  { cmd: 'client.chat(callback); channel.write({...}); await channel.end()', cat: 'streams', pt: 'Node.js — bidirecional: abre o canal, escreve e encerra com end()', en: 'Node.js — bidi: open the channel, write, and close with end()' },
  { cmd: 'stream.on(\'data\', (msg) => console.log(msg)); stream.on(\'end\', () => {})', cat: 'streams', pt: 'Escuta os eventos data / end do stream', en: 'Listens to the stream data / end events' },

  // ─── Codegen & arquivos gerados ────────────────────────────────────────────
  { cmd: 'protoc --go_out=. --go-grpc_out=. user.proto', cat: 'codegen', pt: 'Go — gera types (--go_out) e o stub gRPC (--go-grpc_out)', en: 'Go — generates types (--go_out) and the gRPC stub (--go-grpc_out)' },
  { cmd: 'protoc --python_out=. --grpc_python_out=. user.proto', cat: 'codegen', pt: 'Python — gera mensagens e o gRPC stub (legado grpc_tools)', en: 'Python — generates messages and the gRPC stub (legacy grpc_tools)' },
  { cmd: 'python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. user.proto', cat: 'codegen', pt: 'Python via pip — invoca o protoc do grpcio-tools', en: 'Python via pip — invokes the protoc from grpcio-tools' },
  { cmd: 'npx grpc_tools_node_protoc --js_out=import_style=commonjs,binary:. --grpc_out=. user.proto', cat: 'codegen', pt: 'Node.js — gera mensagens JS e stubs com o protoc do @grpc/grpc-js', en: 'Node.js — generates JS messages and stubs with the @grpc/grpc-js protoc' },
  { cmd: '--go_out=paths=source_relative:.', cat: 'codegen', pt: 'Gera os arquivos .pb.go lado a lado do .proto (evita GOPATH)', en: 'Generates the .pb.go files next to the .proto (avoids GOPATH)' },
  { cmd: 'buf generate', cat: 'codegen', pt: 'Buf — gera código a partir do buf.gen.yaml com plugins declarados', en: 'Buf — generates code from plugins declared in buf.gen.yaml' },
  { cmd: 'buf lint && buf breaking --against .git#branch=main', cat: 'codegen', pt: 'buf lint valida estilo; buf breaking detecta mudanças incompatíveis', en: 'buf lint validates style; buf breaking detects incompatible changes' },
  { cmd: 'protoc --go_out=. user.proto || go install google.golang.org/protobuf/cmd/protoc-gen-go@latest', cat: 'codegen', pt: 'Se o protoc-gen-go não existir, instale com go install', en: 'If protoc-gen-go is missing, install it with go install' },

  // ─── Servidor ──────────────────────────────────────────────────────────────
  { cmd: 's := grpc.NewServer()', cat: 'servers', pt: 'Cria um servidor gRPC vazio', en: 'Creates an empty gRPC server' },
  { cmd: 'pb.RegisterGreeterServer(s, &server{})', cat: 'servers', pt: 'Registra a implementação do serviço no servidor', en: 'Registers the service implementation on the server' },
  { cmd: 'reflection.Register(s)', cat: 'servers', pt: 'Habilita Server Reflection — deixa grpcurl descobrir os serviços', en: 'Enables Server Reflection — lets grpcurl discover the services' },
  { cmd: 'listener, _ := net.Listen("tcp", ":50051"); s.Serve(listener)', cat: 'servers', pt: 'Escuta numa porta TCP e atende requisições', en: 'Listens on a TCP port and serves requests' },
  { cmd: 'grpc.NewServer(grpc.Creds(credentials.NewServerTLSFromFile("cert.pem", "key.pem")))', cat: 'servers', pt: 'Servidor gRPC sobre TLS com certificado', en: 'gRPC server over TLS with a certificate' },
  { cmd: 'go run main.go', cat: 'servers', pt: 'Roda o servidor Go (porta default não é 80 — escolha uma explícita)', en: 'Runs the Go server (default port is not 80 — pick an explicit one)' },

  // ─── Cliente ───────────────────────────────────────────────────────────────
  { cmd: 'conn, _ := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))', cat: 'clients', pt: 'Go — conecta a um servidor sem TLS (dev)', en: 'Go — connects to a server without TLS (dev)' },
  { cmd: 'defer conn.Close()', cat: 'clients', pt: 'Fecha a conexão — o conn é thread-safe e reutilizável', en: 'Closes the connection — the conn is thread-safe and reusable' },
  { cmd: 'c := pb.NewGreeterClient(conn)', cat: 'clients', pt: 'Cria o client stub a partir da conexão', en: 'Creates the client stub from the connection' },
  { cmd: 'reply, err := c.SayHello(ctx, &pb.HelloRequest{Name: "Ana"})', cat: 'clients', pt: 'Chama um RPC unário passando contexto e request', en: 'Calls a unary RPC passing a context and request' },
  { cmd: 'stub = channel.insecure_channel(host)  channel = grpc.insecure_channel(\'localhost:50051\')', cat: 'clients', pt: 'Python — cria um canal inseguro (dev)', en: 'Python — creates an insecure channel (dev)' },
  { cmd: 'grpc-js: const client = new GreeterClient(addr, credentials.createInsecure())', cat: 'clients', pt: 'Node.js — instancia o client com credenciais', en: 'Node.js — instantiates the client with credentials' },
  { cmd: 'client.sayHello({name:\'Ana\'}, (err, reply) => {})', cat: 'clients', pt: 'Node.js — chamada unária com callback', en: 'Node.js — unary call with a callback' },
  { cmd: 'grpc.WithBlock()', cat: 'clients', pt: 'Faz o Dial bloquear até conectar (para pegar erro de startup)', en: 'Makes Dial block until connected (to catch a startup error)' },

  // ─── Erros & status ────────────────────────────────────────────────────────
  { cmd: 'status.Errorf(codes.NotFound, "user %d not found", id)', cat: 'errors', pt: 'Go — cria um erro com código gRPC e mensagem', en: 'Go — creates an error with a gRPC code and message' },
  { cmd: 'codes.OK  codes.NotFound  codes.InvalidArgument  codes.DeadlineExceeded', cat: 'errors', pt: 'Códigos mais comuns — OK, não encontrado, argumento inválido, prazo', en: 'Most common codes — OK, not found, invalid argument, deadline' },
  { cmd: 'codes.Internal  codes.Unavailable  codes.Unauthenticated  codes.Canceled', cat: 'errors', pt: 'Códigos de infra/credenciais — interno, indisponível, não autenticado, cancelado', en: 'Infra/credential codes — internal, unavailable, unauthenticated, canceled' },
  { cmd: 'status.FromError(err)  st.Code()  st.Message()', cat: 'errors', pt: 'Go — extrai o Status do erro para inspecionar código e mensagem', en: 'Go — extracts the Status from the error to inspect code and message' },
  { cmd: 'call.initial_metadata()  /  call.trailing_metadata()', cat: 'errors', pt: 'Python — acessa os metadados de erro (trailing metadata)', en: 'Python — accesses the error trailing metadata' },
  { cmd: 'e.code === grpc.status.INVALID_ARGUMENT  grpc.status[code]', cat: 'errors', pt: 'Node.js — compara o código do erro', en: 'Node.js — compare the error code' },
  { cmd: 'status-with-details / google.rpc.error_details', cat: 'errors', pt: 'Detalhes estruturados de erro — lista de violações, retry info, quotes', en: 'Structured error details — field violations, retry info, quotes' },

  // ─── Interceptors & middlewares ────────────────────────────────────────────
  { cmd: 'func unaryInterceptor(ctx context.Context, req interface{}, _ *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) { ctx = context.WithValue(ctx, "reqId", uuid.New()); return handler(ctx, req) }', cat: 'interceptors', pt: 'Go — interceptor unário do servidor: envolve cada chamada (ex.: corrige request ID)', en: 'Go — server unary interceptor: wraps every call (e.g. inject a request ID)' },
  { cmd: 'grpc.NewServer(grpc.UnaryInterceptor(unaryInterceptor))', cat: 'interceptors', pt: 'Registra o interceptor unário no servidor', en: 'Registers the unary interceptor on the server' },
  { cmd: 'grpc.WithUnaryInterceptor(clientInterceptor)', cat: 'interceptors', pt: 'Go — interceptor unário no cliente (ex.: logging, auth token)', en: 'Go — client unary interceptor (e.g. logging, auth token)' },
  { cmd: 'grpc.ChainUnaryInterceptor(a, b, c)', cat: 'interceptors', pt: 'Encadeia vários interceptors unários em ordem', en: 'Chains multiple unary interceptors in order' },
  { cmd: 'interceptor(..., next) { return next(req) }  /  def unary_unary_rpc_terminator', cat: 'interceptors', pt: 'Node.js / Python — padrão middleware: envolve a chamada e encaminha', en: 'Node.js / Python — middleware pattern: wrap the call and forward' },

  // ─── Deadlines & cancelamento ──────────────────────────────────────────────
  { cmd: 'ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second); defer cancel()', cat: 'deadlines', pt: 'Go — cria um deadline de 5s para a chamada', en: 'Go — creates a 5s deadline for the call' },
  { cmd: 'client, _ := context.WithCancel(context.Background())  /  timeout=(5, unit)', cat: 'deadlines', pt: 'Python — contexto com timeout de 5 unidades', en: 'Python — context with a timeout of 5 units' },
  { cmd: 'const deadline = Date.now() + 5000; const call = client.sayHello({}, {deadline})', cat: 'deadlines', pt: 'Node.js — define um deadline por chamada', en: 'Node.js — sets a per-call deadline' },
  { cmd: 'ctx = context.WithTimeout  +  select { case <-ctx.Done() }', cat: 'deadlines', pt: 'Sempre defina um deadline — senão a chamada pode travar para sempre', en: 'Always set a deadline — otherwise the call can hang forever' },

  // ─── Ferramentas ───────────────────────────────────────────────────────────
  { cmd: 'grpcurl -plaintext localhost:8080 list', cat: 'tools', pt: 'Cliente de terminal — requer Server Reflection no servidor', en: 'Terminal client — requires Server Reflection on the server' },
  { cmd: 'buf ls-files && buf build', cat: 'tools', pt: 'Buf — lista e compila os .proto do workspace', en: 'Buf — lists and compiles the .proto files in the workspace' },
  { cmd: 'kubectl port-forward svc/my-svc 50051:50051', cat: 'tools', pt: 'Expoe um serviço gRPC em um pod do Kubernetes para debug local', en: 'Exposes a gRPC service pod in Kubernetes for local debugging' },
  { cmd: 'grpc-health-probe -addr=:50051', cat: 'tools', pt: 'Probe de health check para k8s (usa o proto de health)', en: 'Health check probe for k8s (uses the health proto)' },
  { cmd: 'grpcui -plaintext localhost:8080', cat: 'tools', pt: 'Postman-like no browser para explorar e testar serviços gRPC', en: 'Browser Postman-like to explore and test gRPC services' },
  { cmd: 'evans -r  (evans repl)', cat: 'tools', pt: 'CLI REPL interativo para gRPC (autocomplete, discovery)', en: 'Interactive gRPC REPL CLI (autocomplete, discovery)' },
  { cmd: 'ghz --insecure --num=1000 --concurrency=50 localhost:50051/echo.Echo/Echo', cat: 'tools', pt: 'ghz — benchmark de carga com requests, concorrência e latências', en: 'ghz — load benchmark with requests, concurrency and latencies' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de gRPC & Protocol Buffers',
    intro: (
      <>
        Referência pesquisável de gRPC e Protocol Buffers 100% no navegador —
        a sintaxe .proto (mensagens, enum, oneof, map, repeated), métodos RPC
        e os quatro tipos de stream, geração de código (protoc , buf ),
        servidores e clientes em Go/Python/Node.js, códigos de status e erros,
        interceptors, deadlines e as ferramentas do ecossistema (grpcurl,
        grpcui, evans, ghz). O par moderno de REST para comunicação entre
        serviços. Só texto de referência — nada sai do navegador.
      </>
    ),
    gotchasTitle: 'Gotchas que mais pegam',
    gotchasBody: (
      <>
        Campos de uma mensagem nunca renumere — o número é o contrato no fio;
        renomear campos é seguro, reordenar números não. Em proto3 não existe
        <Text code>required</Text> nem <Text code>optional</Text>: tudo é
        opcional, e um valor não preenchido volta como zero do tipo. O primeiro
        valor de um enum deve ser 0. gRPC não fica atrás de um load balancer
        HTTP comum (a menos que use gRPC-aware LB, headless/gRPC-Proxy) —
        muitas vezes não atravessa proxies sem config específica. Sempre defina
        um deadline, senão a chamada pode travar para sempre. Habilite Server
        Reflection só se quiser que grpcurl/grpcui descubram seus serviços.
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
    title: 'gRPC & Protocol Buffers Cheat Sheet',
    intro: (
      <>
        A searchable reference for gRPC and Protocol Buffers, 100% in the
        browser — the .proto syntax (messages, enum, oneof, map, repeated),
        RPC methods and the four stream types, code generation ( protoc ,
        buf ), servers and clients in Go/Python/Node.js, status codes and
        errors, interceptors, deadlines and ecosystem tooling (grpcurl,
        grpcui, evans, ghz). The modern REST counterpart for service-to-service
        communication. Reference text only — nothing leaves the browser.
      </>
    ),
    gotchasTitle: 'Gotchas that bite',
    gotchasBody: (
      <>
        Never renumber a message's fields — the number is the contract on the
        wire; renaming fields is safe, reordering numbers is not. proto3 has no
        <Text code>required</Text> or <Text code>optional</Text>: everything is
        optional, and an unset value comes back as the type's zero value. The
        first enum value must be 0. gRPC does not sit behind a normal HTTP load
        balancer (unless you use gRPC-aware LB, headless/gRPC-Proxy) — it often
        fails to cross proxies without specific config. Always set a deadline,
        otherwise the call can hang forever. Enable Server Reflection only if
        you want grpcurl/grpcui to discover your services.
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

export default function GrpcCheatsheetPage() {
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
