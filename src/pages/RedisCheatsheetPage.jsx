import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, DatabaseOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['conn', 'strings', 'keys', 'lists', 'sets', 'hashes', 'zsets', 'streams', 'tx', 'admin']

const CATEGORY_COLOR = {
  conn: 'blue',
  strings: 'green',
  keys: 'gold',
  lists: 'cyan',
  sets: 'geekblue',
  hashes: 'purple',
  zsets: 'magenta',
  streams: 'orange',
  tx: 'volcano',
  admin: 'red',
}

const labelOf = {
  conn: { pt: 'Conexão & CLI', en: 'Connection & CLI' },
  strings: { pt: 'Strings', en: 'Strings' },
  keys: { pt: 'Chaves & expiração', en: 'Keys & expiry' },
  lists: { pt: 'Listas', en: 'Lists' },
  sets: { pt: 'Sets', en: 'Sets' },
  hashes: { pt: 'Hashes', en: 'Hashes' },
  zsets: { pt: 'Sorted Sets', en: 'Sorted Sets' },
  streams: { pt: 'Streams', en: 'Streams' },
  tx: { pt: 'Transações & scripts', en: 'Transactions & scripts' },
  admin: { pt: 'Administração', en: 'Admin' },
}

const ITEMS = [
  // ─── Conexão & CLI ─────────────────────────────────────────────────────
  { code: 'redis-cli -h 10.0.0.5 -p 6379 -a SENHA', cat: 'conn',
    pt: 'Conecta no servidor remoto: host, porta (default 6379) e senha via -a. Prefira a env REDISCLI_AUTH em vez de -a, pra senha não vazar no ps/histórico do shell.',
    en: 'Connects to a remote server: host, port (default 6379), password via -a. Prefer the REDISCLI_AUTH env var so the password does not leak into ps/shell history.' },
  { code: 'redis-cli --scan --pattern "user:*"', cat: 'conn',
    pt: 'A forma CERTA de varrer chaves em produção: o --scan caminha em lotes com cursor (sem travar o servidor), enquanto o KEYS varre tudo de uma vez e bloqueia.',
    en: 'The RIGHT way to scan keys in production: --scan walks in cursor batches (no server stall), while KEYS scans everything at once and blocks.' },
  { code: 'redis-cli --bigkeys', cat: 'conn',
    pt: 'Auditoria de memória: percorre as chaves e aponta as maiores de cada tipo. Primeiro passo quando a instância cresce sem explicação.',
    en: 'Memory audit: walks the keys and points out the largest of each type. The first step when the instance grows for no clear reason.' },
  { code: 'redis-cli -n 3 GET user:1', cat: 'conn',
    pt: 'Opera no banco lógico 3 (default são 16, indices 0–15). Não é um database real como SQL — é um namespace separado, sem relação entre eles.',
    en: 'Operates on logical database 3 (default 16, indexes 0–15). Not a real RDBMS database — just a separate namespace, with no relationship between them.' },
  { code: 'redis-cli --latency', cat: 'conn',
    pt: 'Mede a latência real de rede cliente→servidor em loop (min/avg/max). O jeito rápido de separar "rede lenta" de "comando lento".',
    en: 'Measures real client→server network latency in a loop (min/avg/max). The quick way to separate "slow network" from "slow command".' },
  { code: "redis-cli --eval script.lua COUNT1 {key1} 3", cat: 'conn',
    pt: 'Executa um script Lua de arquivo. O {key} na frente dos args é a convenção que ajuda o Redis cluster a rotear todos os KEYS pro mesmo slot.',
    en: 'Runs a Lua script from a file. The {key} prefix is the convention that helps Redis Cluster route all KEYS to the same slot.' },

  // ─── Strings ───────────────────────────────────────────────────────────
  { code: 'SET user:1:name "Ada"', cat: 'strings',
    pt: 'Grava uma string. É o tipo mais básico: qualquer valor serializado (JSON, contador, flag) vira string por debaixo.',
    en: 'Writes a string. The most basic type: any serialized value (JSON, counter, flag) ends up as a string underneath.' },
  { code: 'GET user:1:name', cat: 'strings',
    pt: 'Lê o valor. Chave inexistente devolve (nil) no CLI — o null de verdade, não string vazia como em outras stores.',
    en: 'Reads the value. A missing key returns (nil) in the CLI — a true null, not an empty string like some other stores.' },
  { code: 'SET visit:count 0\nINCR visit:count', cat: 'strings',
    pt: 'Contador atômico: o INCR roda no servidor em operação única — dois clients incrementando ao mesmo tempo nunca perdem contagem (sem race de read-modify-write).',
    en: 'Atomic counter: INCR runs as a single server-side operation — two clients incrementing together never lose a count (no read-modify-write race).' },
  { code: 'INCRBY visit:count 10\nDECRBY visit:count 3', cat: 'strings',
    pt: 'Soma/subtrai inteiro num passo. A base do rate-limit cru: INCR a cada request + EXPIRE pra abrir a janela de tempo.',
    en: 'Adds/subtracts an integer in one step. The base of a crude rate limit: INCR per request + EXPIRE to open the time window.' },
  { code: 'SETEX token:abc 3600 "valor"', cat: 'strings',
    pt: 'SET com TTL embutido (expira em 1h): atômico, substitui o SET+EXPIRE em dois comandos. O padrão pra cache-resposta, sessão e OTP.',
    en: 'SET with an inline TTL (expires in 1h): atomic, replaces the two-command SET+EXPIRE. The pattern for response cache, sessions and OTPs.' },
  { code: 'SET lock:report 1 NX EX 30', cat: 'strings',
    pt: 'O lock cru do Redis: NX só grava se a chave não existir (SET-if-not-exists), EX 30 garante expiração caso o dono morra. O mutation esperto por trás de "setnx".',
    en: 'The crude Redis lock: NX only writes if the key is absent (set-if-not-exists), EX 30 forces expiry in case the owner dies. The modern replacement for SETNX.' },
  { code: 'SET user:3 token "xyz" EX 60\nGETSET user:3 last-seen 1699999999', cat: 'strings',
    pt: 'O GETSET devolve o valor ANTIGO e grava o novo em uma operação — útil pra "ler e zerar" um contador sem janela de corrida.',
    en: 'GETSET returns the OLD value and writes the new one in one operation — handy for "read-and-zero" a counter with no race window.' },
  { code: 'MSET a 1 b 2 c 3\nMGET a b c', cat: 'strings',
    pt: 'Grava e lê várias chaves num só round-trip de rede. É a família dos M* (MSET/MGET/HMGET): reduzem N comandos a 1 ping.',
    en: 'Writes and reads several keys in a single network round-trip. The M* family (MSET/MGET/HMGET): turns N commands into 1 ping.' },
  { code: 'APPEND log:run "linha\n"\nSTRLEN log:run', cat: 'strings',
    pt: 'APPEND concatena no fim (cria se não existe) e STRLEN dá o tamanho em bytes. Strings aceitam bytes, então o "log" pode ser binário de verdade.',
    en: 'APPEND concatenates at the end (creates if missing) and STRLEN returns length in bytes. Strings hold bytes, so that "log" can be real binary.' },
  { code: 'GETRANGE text 0 14', cat: 'strings',
    pt: 'Fatia a string por índices de byte (negativo conta do fim). Pra ler um trecho de um valor grande sem baixar a string inteira.',
    en: 'Slices a string by byte index (negative counts from the end). To read a chunk of a large value without downloading the whole string.' },

  // ─── Chaves & expiração ────────────────────────────────────────────────
  { code: 'EXISTS user:100\nEXISTS user:1 user:2 user:3', cat: 'keys',
    pt: 'Conta quantas das chaves existem (aceita várias). O resultado number é o "boolean" do Redis: 0 = nenhuma existe.',
    en: 'Counts how many of the keys exist (accepts many). The integer is Redis "boolean": 0 = none exist.' },
  { code: 'TTL session:abc\nPTTL session:abc', cat: 'keys',
    pt: 'Tempo de vida restante de uma chave com TTL: TTL em segundos, PTTL em ms. -1 sem expiração, -2 chave não existe.',
    en: 'Remaining time-to-live of a key: TTL in seconds, PTTL in ms. -1 = no expiry, -2 = key missing.' },
  { code: 'EXPIRE session:abc 3600\nPEXPIRE session:abc 3600000', cat: 'keys',
    pt: 'Define a expiração de uma chave JÁ existente (segundos/ms). Dá pra "estender a sessão" só re-setando o TTL a cada atividade.',
    en: 'Sets expiry on an ALREADY existing key (seconds/ms). You can "extend a session" by re-setting the TTL on each activity.' },
  { code: 'PERSIST session:abc\nEXPIRETIME session:abc', cat: 'keys',
    pt: 'PERSIST remove a expiração (vira permanente); EXPIRETIME devolve o timestamp Unix absoluto da expiração (6.2+).',
    en: 'PERSIST clears the expiry (becomes permanent); EXPIRETIME returns the absolute Unix timestamp of expiry (6.2+).' },
  { code: 'RENAME old:key new:key\nCOPY old:key new:key', cat: 'keys',
    pt: 'RENAME troca o nome no lugar; COPY duplica o valor numa chave nova. Ambos aceitam o flag NX/XX depois do destino em versões novas.',
    en: 'RENAME renames in place; COPY duplicates the value into a new key. Both accept NX/XX flags after the destination in recent versions.' },
  { code: 'TYPE user:1\nOBJECT ENCODING user:1', cat: 'keys',
    pt: 'TYPE diz a estrutura (string/list/hash/set/zset/stream); OBJECT ENCODING revela a representação interna (int/embstr/raw/ziplist/intset...) — ouro pra diagnosticar memória.',
    en: 'TYPE reports the structure (string/list/hash/set/zset/stream); OBJECT ENCODING reveals the internal representation (int/embstr/raw/ziplist/intset...) — gold for memory diagnostics.' },
  { code: 'SORT list:ids ALPHA LIMIT 0 10', cat: 'keys',
    pt: 'Ordena os elementos de uma lista/set na volta (ou SWAP pro store). SORT é o comando "SQL-like" do Redis — cuidado com custo O(N) em listas grandes.',
    en: 'Sorts the elements of a list/set on return (or STOREs the result). SORT is the "SQL-like" command of Redis — mind the O(N) cost on large lists.' },
  { code: 'KEYS user:*', cat: 'keys',
    pt: 'Lista TODAS as chaves que casam o padrão, VARRENDO a base inteira — bloqueia o servidor single-thread em produção. Só use em debug/local; no ar é o --scan.',
    en: 'Lists EVERY key matching the pattern by scanning the whole dataset — it stalls the single-threaded server in production. Dev/local only; on prod use --scan.' },
  { code: 'SCAN 0 MATCH user:* COUNT 100', cat: 'keys',
    pt: 'O KEYS seguro: itera em lotes com cursor (o 0 inicial, devolve o próximo pra chamar de novo até voltar 0). Ever-ready pra paginação de chaves no ar.',
    en: 'The safe KEYS: iterates in batches with a cursor (0 to start, returns the next to call until it comes back 0). The production-ready way to page keys.' },

  // ─── Listas ────────────────────────────────────────────────────────────
  { code: 'LPUSH jobs "job-1001"', cat: 'lists',
    pt: 'Insere na CABEÇA da lista. Lista é a estrutura de fila/pilha/histórico: LPUSH+RPOP = fila FIFO, LPUSH+LPOP = pilha LIFO.',
    en: 'Pushes to the HEAD of the list. A list is the queue/stack/history structure: LPUSH+RPOP = FIFO queue, LPUSH+LPOP = LIFO stack.' },
  { code: 'RPUSH jobs "job-1002"\nLRANGE jobs 0 -1', cat: 'lists',
    pt: 'RPUSH insere na CAUDA; LRANGE 0 -1 devolve a lista inteira. LRANGE é o jeito de inspecionar/paginar sem remover os itens.',
    en: 'RPUSH inserts at the TAIL; LRANGE 0 -1 returns the whole list. LRANGE is how you inspect/page without removing items.' },
  { code: 'LPOP jobs\nRPOPLPUSH jobs backup', cat: 'lists',
    pt: 'LPOP remove da cabeça. O par RPOPLPUSH (ou BRPOPLPUSH) move o item pra uma fila de "processando" — o consumidor pode devolve-lo se der timeout: fila confiável.',
    en: 'LPOP removes from the head. RPOPLPUSH (or BRPOPLPUSH) moves the item into an "in-flight" list — the consumer can push it back on timeout: a reliable queue.' },
  { code: 'BLPOP jobs 5', cat: 'lists',
    pt: 'O pop que BLOQUEIA até 5s se a lista estiver vazia. É o que o worker usa em vez de polling: um push acorda um BLPOP na hora, sem loop de requisição.',
    en: 'The pop that BLOCKS up to 5s when the list is empty. The worker waits on this instead of polling: a push wakes a BLPOP instantly, no request loop.' },
  { code: 'LLEN jobs\nLINDEX jobs 0\nLSET jobs 0 "job-0"', cat: 'lists',
    pt: 'LLEN comprimento, LINDEX posição exata (negativo do fim), LSET sobrescreve uma posição. O trio de "ver e ajustar" sem tocar nas pontas.',
    en: 'LLEN length, LINDEX exact position (negative from the end), LSET overwrites one position. The "inspect-and-tweak" trio without touching the ends.' },
  { code: 'LTRIM jobs 0 99', cat: 'lists',
    pt: 'Corta a lista mantendo só a faixa. O padrão "últimos 100" (ou "keep N"): LPUSH e logo LTRIM pra nunca deixar a lista crescer sem limite.',
    en: 'Trims the list keeping only the range. The "last 100" (keep-N) pattern: LPUSH then LTRIM right away so the list never grows unbounded.' },

  // ─── Sets ──────────────────────────────────────────────────────────────
  { code: 'SADD tags:post:42 "redis" "database"', cat: 'sets',
    pt: 'Adiciona membros a um set — coleção SEM duplicata e sem ordem. Re-SADD do mesmo valor é no-op (idempotente).',
    en: 'Adds members to a set — a no-duplicate, unordered collection. Re-SADD of the same value is a no-op (idempotent).' },
  { code: 'SISMEMBER tags:post:42 "redis"\nSREM tags:post:42 "legacy"', cat: 'sets',
    pt: 'SISMEMBER testa pertinência O(1) (o de-amigos/sim-não); SREM remove. O par por trás de "é admin?", "já viu?" e tags.',
    en: 'SISMEMBER is an O(1) membership test (is-friend/yes-no); SREM removes. The pair behind "is admin?", "already seen?" and tags.' },
  { code: 'SUNION tags:a tags:b\nSINTER tags:a tags:b\nSDIFF tags:a tags:b', cat: 'sets',
    pt: 'Operações de conjunto entre sets: união, interseção e diferença. As versões SUNIONSTORE/SINTERSTORE/SDIFFSTORE gravam o resultado num set novo.',
    en: 'Set operations across sets: union, intersection, difference. The SUNIONSTORE/SINTERSTORE/SDIFFSTORE variants write the result into a new set.' },
  { code: 'SMEMBERS roles:admin\nSCARD roles:admin', cat: 'sets',
    pt: 'SMEMBERS lista todos (O(N), gaste à vontade em sets pequenos); SCARD é a contagem O(1). Pro "todos os membros do grupo".',
    en: 'SMEMBERS lists all (O(N), fine on small sets); SCARD is the O(1) count. For "everyone in the group".' },
  { code: 'SPOP prize:pool 1\nSRANDMEMBER prize:pool 1', cat: 'sets',
    pt: 'SPOP remove e devolve membros ALEATÓRIOS (o sorteio que consome); SRANDMEMBER devolve sem remover. No CLI, o trailing 1 mostra o valor dereferenciado.',
    en: 'SPOP removes and returns RANDOM members (the consuming raffle); SRANDMEMBER returns without removing. In the CLI the trailing 1 prints the dereferenced value.' },
  { code: 'SMOVE jobs:open jobs:claimed "job-7"', cat: 'sets',
    pt: 'Move um membro entre sets de uma vez (atômico): o equivalente de mudar de estado sem "DELETE + ADD" em duas operações.',
    en: 'Moves a member between sets atomically: the state-change equivalent without a "DELETE + ADD" pair.' },

  // ─── Hashes ────────────────────────────────────────────────────────────
  { code: 'HSET user:7 name "Ada" age 37 country "UK"', cat: 'hashes',
    pt: 'Grava um hash: mapa campo→valor sob uma chave só. A estrutura ideal pro "objeto" (perfil de usuário): todos os campos num lugar, sem N chaves.',
    en: 'Writes a hash: a field→value map under a single key. The ideal structure for an "object" (user profile): all fields in one place, no N keys.' },
  { code: 'HGET user:7 name\nHGETALL user:7', cat: 'hashes',
    pt: 'HGET lê um campo O(1); HGETALL devolve o hash inteiro. Pro objeto que você sempre lê inteiro, usando só uma chave.',
    en: 'HGET reads one field O(1); HGETALL returns the whole hash. For the object you always read whole, in a single key.' },
  { code: 'HMGET user:7 name age\nHEXISTS user:7 email', cat: 'hashes',
    pt: 'HMGET lê vários campos num round-trip; HEXISTS checa se um campo existe. OS M* existem justamente pra você não fazer N comandos.',
    en: 'HMGET reads several fields in one round-trip; HEXISTS checks a field exists. The M* variants exist so you do not fire N commands.' },
  { code: 'HINCRBY user:7 visits 1\nHDEL user:7 visits', cat: 'hashes',
    pt: 'HINCRBY incrementa um campo numérico atômico (contador por campo); HDEL remove campo(s). O hash é o contador por-entidade sem chave a mais.',
    en: 'HINCRBY atomically bumps a numeric field (per-field counter); HDEL removes field(s). A hash is a per-entity counter without extra keys.' },
  { code: 'HSETNX user:7 email "ada@x.com"', cat: 'hashes',
    pt: 'HSET-if-not-exists: só grava o campo se ele ainda não existir. Útil pra "primeira vez que acontece" dentro de um objeto (ex.: onboarding).',
    en: 'HSET-if-not-exists: writes the field only if it does not exist yet. Handy for "first time this happens" inside an object (e.g. onboarding).' },
  { code: 'HKEYS user:7\nHVALS user:7\nHLEN user:7', cat: 'hashes',
    pt: 'HKEYS só os nomes dos campos, HVALS só os valores, HLEN a contagem de campos. Pra inspecionar um objeto sem baixar o mapa todo.',
    en: 'HKEYS field names only, HVALS values only, HLEN field count. To inspect an object without downloading the whole map.' },

  // ─── Sorted Sets ───────────────────────────────────────────────────────
  { code: 'ZADD leaderboard 1000 "alice" 900 "bob"', cat: 'zsets',
    pt: 'Grava membros com um SCORE numérico; o set fica ordenado pelo score. O ranking: o score decide a posição automaticamente.',
    en: 'Writes members with a numeric SCORE; the set stays ordered by score. The leaderboard: the score decides the position automatically.' },
  { code: 'ZREVRANGE leaderboard 0 4 WITHSCORES', cat: 'zsets',
    pt: 'Top-N: ZREVRANGE devolve do MAIOR score pra baixo (o topo do ranking); ZRANGE faz o contrário. WITHSCORES traz o score junto.',
    en: 'Top-N: ZREVRANGE returns from the HIGHEST score down (the ranking top); ZRANGE does the opposite. WITHSCORES brings the score along.' },
  { code: 'ZADD leaderboard 1100 "alice"', cat: 'zsets',
    pt: 'Re-ZADD atualiza o score na hora (membro ganhou pontos): a posição do ranking se recalcula sozinha. UPPDATE do ranking em um comando.',
    en: 'Re-ZADD updates the score on the spot (member gained points): the ranking position re-computes itself. A ranking UPDATE in one command.' },
  { code: 'ZINCRBY leaderboard 10 "alice"', cat: 'zsets',
    pt: 'Incrementa o score existente de um membro (cria se não existe). O ZADD-por-diferença: "ganhou +10" sem precisar ler o score atual.',
    en: 'Bumps the existing score of a member (creates if missing). The differential ZADD: "+10" without having to read the current score.' },
  { code: 'ZRANGE leaderboard 0 -1 WITHSCORES\nZSCORE leaderboard "alice"', cat: 'zsets',
    pt: 'ZRANGE 0 -1 todo o ranking ordenado; ZSCORE devolve o score de um membro específico. O par "ver tudo / conferir um".',
    en: 'ZRANGE 0 -1 the whole ordered ranking; ZSCORE returns one member score. The "see all / check one" pair.' },
  { code: 'ZRANGEBYSCORE jobs 0 (100', cat: 'zsets',
    pt: 'Filtra por FAIXA de score: o ( exclui o limite, [ inclui. Excluse-score é o jeito avançado de intervalo — o "WHERE score BETWEEN" do Redis.',
    en: 'Filters by SCORE range: ( excludes the bound, [ includes. Exclusive-score is the advanced range — Redis "WHERE score BETWEEN".' },
  { code: 'ZRANK leaderboard "bob"\nZREMRANGEBYRANK leaderboard 0 0', cat: 'zsets',
    pt: 'ZRANK a posição (index) de um membro; ZREMRANGEBYRANK remove por faixa de posição — "tira os N menores" em um comando.',
    en: 'ZRANK the position (index) of a member; ZREMRANGEBYRANK removes by position range — "drop the N lowest" in one command.' },
  { code: 'ZREM leaderboard "bob"\nZCARD leaderboard', cat: 'zsets',
    pt: 'ZREM remove membros; ZCARD é a contagem (o SCARD do sorted set). Pro "expulsar do ranking" e "quantos rankeados".',
    en: 'ZREM removes members; ZCARD is the count (SCARD for sorted sets). For "kick out of the ranking" and "how many ranked".' },

  // ─── Streams ───────────────────────────────────────────────────────────
  { code: 'XADD sensor:1 "*" temp 21.5', cat: 'streams',
    pt: 'Apenda um evento a um stream: o "*" deixa o Redis gerar o ID auto-incremental (padrão timestamp-seq). O log de eventos ordenado e append-only.',
    en: 'Appends an event to a stream: "*" lets Redis generate the auto-increment ID (timestamp-seq pattern). The ordered, append-only event log.' },
  { code: 'XREAD COUNT 5 STREAMS sensor:1 0', cat: 'streams',
    pt: 'Lê do ID em diante (0 = desde o começo, $ = só eventos novos). Sem consumo destrutivo: dá pra reler o histórico quantas vezes quiser.',
    en: 'Reads from an ID onward (0 = from the start, $ = only new events). Non-destructive consumption: you can re-read history as often as you like.' },
  { code: 'XGROUP CREATE log:stream workers 0\nXREADGROUP GROUP workers w1 COUNT 10 STREAMS log:stream ">"', cat: 'streams',
    pt: 'Consumer groups: um grupo de workers divide o consumo do stream, cada evento vai pra UM worker, e o ">" lê só o que ninguém pegou. Fila persistente p/ jobs.',
    en: 'Consumer groups: a worker group splits stream consumption, each event goes to ONE worker, and ">" reads only what nobody claimed. Persistent job queue.' },
  { code: 'XACK log:stream workers 1699999999-0\nXPENDING log:stream workers', cat: 'streams',
    pt: 'XACK confirma (ack) o evento processado; XPENDING mostra os não-acknowledged — os que o consumidor pegou e "morreu" antes de terminar. A base da retry.',
    en: 'XACK acknowledges a processed event; XPENDING shows the unacked ones — claimed by a consumer that "died" mid-way. The base of retry.' },
  { code: 'XRANGE log:stream - + COUNT 10\nXLEN log:stream', cat: 'streams',
    pt: 'XRANGE fatia por faixa de ID (- e + = tudo) e XLEN dá o tamanho. Inspeção de verdade: os IDs são ordenáveis então "a partir de tal momento" é indexado.',
    en: 'XRANGE slices by ID range (- and + = everything) and XLEN gives the size. Real inspection: IDs sort so "from that moment on" is indexed.' },
  { code: 'XTRIM log:stream MAXLEN ~ 1000', cat: 'streams',
    pt: 'Corta o stream mantendo ~1000 eventos: o ~ abre a poda aproximada (mais barata, sem varrer tudo a cada append). O "não deixe crescer pra sempre".',
    en: 'Trims the stream keeping ~1000 events: the ~ enables approximate pruning (cheaper, does not scan everything on each append). "Do not grow forever".' },

  // ─── Transações & scripts ──────────────────────────────────────────────
  { code: 'MULTI\nINCR counter\nINCR counter\nEXEC', cat: 'tx',
    pt: 'MULTI/EXEC: enfileira comandos e executa TODOS de uma vez, sem ninguém intercalando entre eles. Não é rollback — é o "tudo ou nada em sequência".',
    en: 'MULTI/EXEC: queues commands and runs them ALL at once, with nothing interleaving in between. No rollback — it is "all-or-nothing in sequence".' },
  { code: 'WATCH balance\nGET balance\nMULTI\n...\nEXEC', cat: 'tx',
    pt: 'WATCH testa otimisticamente: se a chave mudar entre o WATCH e o EXEC, a transação ABORTA (devolve null) — você relê e tenta de novo. Caso de uso clássico do "compare-and-set".',
    en: 'WATCH is optimistic: if the key changes between WATCH and EXEC, the transaction ABORTS (returns null) — you re-read and retry. The classic compare-and-set.' },
  { code: 'EVAL "return redis.call(\'GET\', KEYS[1])" 1 user:1', cat: 'tx',
    pt: 'EVAL roda um script Lua inteiro no servidor, ATOMICO contra todo o resto (como um MULTI imortal). Dá pra fazer if/else e lógica por cima dos valores.',
    en: 'EVAL runs an entire Lua script on the server, ATOMIC against everything else (an immortal MULTI). You can branch and compute logic over values.' },
  { code: 'EVALSHA <sha1> 1 key\nSCRIPT LOAD "...lua..."', cat: 'tx',
    pt: 'SCRIPT LOAD compila o Lua uma vez e devolve um SHA1; EVALSHA roda pelo hash — evita reenviar o script inteiro a cada chamada. O jeito "produção" de rodar Lua.',
    en: 'SCRIPT LOAD compiles Lua once and returns a SHA1; EVALSHA runs by hash — avoids resending the whole script every call. The production way to run Lua.' },

  // ─── Administração ─────────────────────────────────────────────────────
  { code: 'INFO\nINFO memory\nINFO replication', cat: 'admin',
    pt: 'As estatísticas do servidor: INFO cru, ou INFO <seção> (server/clients/memory/stats/replication/keyspace...). O painel de status sem painel.',
    en: 'Server stats: bare INFO, or INFO <section> (server/clients/memory/stats/replication/keyspace...). A status panel without a panel.' },
  { code: 'CONFIG GET maxmemory\nCONFIG SET maxmemory 256mb\nCONFIG REWRITE', cat: 'admin',
    pt: 'Lê/altera configuração em runtime (sem restart) e só grava no redis.conf com CONFIG REWRITE. Ver o valor atual antes de chutar.',
    en: 'Gets/sets runtime config (no restart), only persisted to redis.conf via CONFIG REWRITE. Check the current value before guessing.' },
  { code: 'MEMORY USAGE user:7\nMEMORY STATS', cat: 'admin',
    pt: 'MEMORY USAGE estima os bytes de uma chave em específico (o custo real de um objeto). MEMORY STATS traz o balanço completo da memória.',
    en: 'MEMORY USAGE estimates the bytes a given key costs (an object real footprint). MEMORY STATS gives the full memory balance sheet.' },
  { code: 'DBSIZE\nFLUSHDB\nFLUSHALL', cat: 'admin',
    pt: 'DBSIZE conta as chaves do banco atual; FLUSHDB limpa o banco ATUAL; FLUSHALL limpa todos. Nem precisa dizer: cuidado em produção (existe FLUSHALL ASYNC).',
    en: 'DBSIZE counts keys in the current DB; FLUSHDB wipes the CURRENT database; FLUSHALL wipes them all. No need to say: careful in prod (FLUSHALL ASYNC exists).' },
  { code: 'CLIENT LIST\nCLIENT KILL ID 12345', cat: 'admin',
    pt: 'CLIENT LIST mostra as conexões ativas (endereço, db, o que está fazendo); CLIENT KILL derruba uma específica. O depurador de quem está segurando o servidor.',
    en: 'CLIENT LIST shows live connections (address, db, what they are doing); CLIENT KILL drops one specific client. Debug who is holding the server.' },
  { code: 'BGSAVE\nLASTSAVE\nSAVE', cat: 'admin',
    pt: 'BGSAVE dispara um snapshot RDB em background (o backup de rotina); LASTSAVE o horário do último snapshot; SAVE é a versão SÍNCRONA — bloqueia. Para backup, use BGSAVE.',
    en: 'BGSAVE fires an RDB snapshot in the background (routine backup); LASTSAVE the time of the last one; SAVE is the SYNCHRONOUS version — it blocks. For backups, use BGSAVE.' },
  { code: 'SLOWLOG GET 10\nSLOWLOG LEN', cat: 'admin',
    pt: 'Os comandos que passaram do tempo configurado em slowlog-log-slower-than: listados com duração e o comando. O jeito de achar o "gargalo single-thread".',
    en: 'The commands that exceeded slowlog-log-slower-than: listed with duration and the command, newest first. Find the single-thread bottleneck.' },
  { code: 'MONITOR', cat: 'admin',
    pt: 'Faz stream de TODOS os comandos que passam no servidor em tempo real. Ótimo pra debugar "quem está acessando a chave X" — mas nunca no ar sem necessidade (custo alto).',
    en: 'Streams EVERY command hitting the server in real time. Great to debug "who is touching key X" — but never in prod without a need (high cost).' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Redis',
    intro: (
      <>
        <Text code>redis-cli</Text>, os comandos e as estruturas de dados do{' '}
        <Text code>redis</Text> — o armazenamento em-memory que todo sistema
        usa pra cache, fila, sessão, ranking e lock distribuído. O primeiro
        item do projeto dedicado a um banco NoSQL: aqui é o banco de dados em
        memória que a sua app consulta a cada request.
      </>
    ),
    search: 'Buscar por comando ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no Redis',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Um servidor, um thread só.</Text> O Redis executa um
          comando por vez (single-threaded): a latência de um request é a soma
          de todos os clientes na fila. Comandos O(N) como{' '}
          <Text code>KEYS</Text> e <Text code>SMEMBERS</Text> em estruturas
          grandes travam TUDO durante a varredura — em produção use{' '}
          <Text code>SCAN</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>O tipo decide o comando.</Text> Não existe um{' '}
          <Text code>GET</Text> genérico: cada estrutura tem sua família
          (string, list, set, hash, zset, stream). A começar pelo{' '}
          <Text code>TYPE</Text> pra descobrir o que você fez — ou o que você{' '}
          <Text code>SET</Text>ou por engano.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Expiração é tempo de vida, não config.</Text> O TTL é
          por chave e usa segundos ou ms. Um{' '}
          <Text code>GET</Text> num cache expirado devolve{' '}
          <Text code>(nil)</Text> — o seu código precisa saber tratar isso
          (cache-aside) e repopular.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Operações atômicas de verdade.</Text> INCR, SADD, ZADD,
          EVAL e as transações MULTI/EXEC rodam sem ninguém intercalando no
          meio. É isso que torna o Redis a "mais simples fila/cache/lock" do
          mundo — mas a atomicidade cobre UMA operação; lógica multi-comando
          precisa de Lua ou de transaction.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Redis não é disco.</Text> É um cache/estado em memória;
          a persistência (RDB/AOF) é disparada por config e pode perder dados
          entre snapshots. Nunca trate o Redis como fonte da verdade única do
          seu dado crítico — banco SQL é, Redis acelera.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar comando',
    copiedCode: 'Comando copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Redis Cheat Sheet',
    intro: (
      <>
        <Text code>redis-cli</Text>, the commands and data structures of{' '}
        <Text code>redis</Text> — the in-memory store every system uses for
        cache, queue, session, ranking and distributed locks. The first item
        dedicated to a NoSQL database: here is the in-memory database your app
        hits on every request.
      </>
    ),
    search: 'Search by command or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>One server, one thread.</Text> Redis runs one command at
          a time (single-threaded): the latency of one request is the sum of
          everyone queued behind it. O(N) commands like{' '}
          <Text code>KEYS</Text> and <Text code>SMEMBERS</Text> on large
          structures stall EVERYTHING during the sweep — use{' '}
          <Text code>SCAN</Text> in production.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>The type decides the command.</Text> There is no generic{' '}
          <Text code>GET</Text>: each structure has its own family (string,
          list, set, hash, zset, stream). Start with{' '}
          <Text code>TYPE</Text> to find out what you created — or what you
          accidentally <Text code>SET</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Expiry is a lifetime, not a config.</Text> TTL is
          per-key, in seconds or ms. A <Text code>GET</Text> on an expired
          cache key returns <Text code>(nil)</Text> — your code must handle
          that (cache-aside) and repopulate it.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Truly atomic operations.</Text> INCR, SADD, ZADD, EVAL
          and MULTI/EXEC transactions run with nothing interleaving in between.
          That is what makes Redis the simplest queue/cache/lock on earth —
          but atomicity covers ONE command; multi-command logic needs Lua or a
          transaction.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Redis is not disk.</Text> It is an in-memory
          cache/state; persistence (RDB/AOF) is triggered by config and can
          lose data in between snapshots. Never treat Redis as the single
          source of truth for critical data — an SQL database is; Redis
          accelerates it.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy command',
    copiedCode: 'Command copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function RedisCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const catCounts = useMemo(() => {
    const counts = { all: ITEMS.length }
    for (const cat of CATEGORIES) {
      counts[cat] = ITEMS.filter((it) => it.cat === cat).length
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((it) => {
      if (category !== 'all' && it.cat !== category) return false
      if (!q) return true
      return (
        it.code.toLowerCase().includes(q) ||
        (it[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# redis (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```text',
          it.code,
          '```',
          '',
          it[lang],
        ].join('\n')
      )
      .join('\n\n---\n\n')
    return header + body
  }, [filtered, lang])

  const copyCode = useCallback(
    async (code) => {
      try {
        await navigator.clipboard.writeText(code)
        messageApi.success(t.copiedCode)
      } catch {
        messageApi.error(t.copyError)
      }
    },
    [messageApi, t]
  )

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mdList)
      messageApi.success(t.copiedList)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [mdList, messageApi, t])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<DatabaseOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({catCounts.all})</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>
              {labelOf[cat][lang]} ({catCounts[cat]})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={`${item.cat}-${item.code}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    title={t.copyCode}
                    onClick={() => copyCode(item.code)}
                  />
                </Space>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#262626',
                  }}
                >
                  {item.code}
                </pre>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}