import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['topics', 'produce', 'consume', 'groups', 'configs', 'acls', 'tools', 'props', 'concepts']

const CATEGORY_COLOR = {
  topics: 'blue',
  produce: 'green',
  consume: 'cyan',
  groups: 'magenta',
  configs: 'gold',
  acls: 'volcano',
  tools: 'purple',
  props: 'geekblue',
  concepts: 'red',
}

const labelOf = {
  topics: { pt: 'Tópicos (kafka-topics)', en: 'Topics (kafka-topics)' },
  produce: { pt: 'Produzir mensagens', en: 'Producing messages' },
  consume: { pt: 'Consumir mensagens', en: 'Consuming messages' },
  groups: { pt: 'Consumer groups & offsets', en: 'Consumer groups & offsets' },
  configs: { pt: 'Configurações (kafka-configs)', en: 'Configs (kafka-configs)' },
  acls: { pt: 'Permissões (kafka-acls)', en: 'ACLs (kafka-acls)' },
  tools: { pt: 'Outras ferramentas', en: 'Other tools' },
  props: { pt: 'Propriedades producer/consumer', en: 'Producer/consumer properties' },
  concepts: { pt: 'Conceitos que importam', en: 'Concepts that matter' },
}

const ITEMS = [
  // ─── Tópicos (kafka-topics) ─────────────────────────────────────────
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --create --topic orders --partitions 12 --replication-factor 3', cat: 'topics',
    pt: 'Cria o tópico `orders` com 12 partições e 3 réplicas — o fator de replicação acompanha o tamanho do cluster (máx. nº de brokers) e o `--partitions` é quem define o paralelismo máximo de consumo.',
    en: 'Creates topic `orders` with 12 partitions and 3 replicas — the replication factor follows the cluster size (max. number of brokers) and `--partitions` is what sets the maximum consumption parallelism.' },
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --list', cat: 'topics',
    pt: 'Lista todos os tópicos — o inventário de "o que existe nesse cluster" em uma linha.',
    en: 'Lists all topics — the "what even exists on this cluster" inventory in one line.' },
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic orders', cat: 'topics',
    pt: 'Mostra líder, réplicas, ISR e configurações do tópico — a primeira parada quando uma partição está ficando para trás.',
    en: 'Shows leader, replicas, ISR and config of the topic — the first stop when a partition is falling behind.' },
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --describe --under-replicated-partitions', cat: 'topics',
    pt: 'Só partições com réplica em atraso — a triagem de "clusters doentes" sem varrer tópico por tópico.',
    en: 'Only partitions with a lagging replica — triaging "sick clusters" without scanning topic by topic.' },
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --describe --at-min-isr-partitions', cat: 'topics',
    pt: 'Partições cujo número de réplicas em sincronia está exatamente no mínimo (`min.insync.replicas`) — o alerta silencioso de que um broker a menos derruba o cluster.',
    en: 'Partitions whose in-sync replica count sits exactly at the minimum (`min.insync.replicas`) — the silent warning that one less broker takes the cluster down.' },
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic orders --partitions 24', cat: 'topics',
    pt: 'AUMENTA partições de 12 para 24. Só cresce — nunca encolhe. E cada aumento quebra a ordem por chave antiga e re-balanceia o tráfego.',
    en: 'INCREASES partitions from 12 to 24. It only grows — never shrinks. And each increase breaks old key-ordering and re-balances traffic.' },
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic orders', cat: 'topics',
    pt: 'Apaga o tópico (e todos os dados dele). Só funciona se `delete.topic.enable=true` no cluster — senão a operação é silenciosamente ignorada.',
    en: 'Deletes the topic (and all its data). Only works if `delete.topic.enable=true` on the cluster — otherwise the operation is silently ignored.' },
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --create --topic orders --partitions 6 --replication-factor 3 --if-not-exists', cat: 'topics',
    pt: '`--if-not-exists` transforma a criação em idempotente — essencial em scripts/playbooks que rodam mais de uma vez sem quebrar.',
    en: '`--if-not-exists` makes creation idempotent — essential in scripts/playbooks that run more than once without breaking.' },

  // ─── Produzir mensagens ─────────────────────────────────────────────
  { code: 'echo "hello kafka" | kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders', cat: 'produce',
    pt: 'Produz uma mensagem AVULSA via stdin — o ping de smoke test "o tópico aceita escrita?".',
    en: 'Produces a single message via stdin — the smoke-test ping "does the topic accept writes?".' },
  { code: 'kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders < events.txt', cat: 'produce',
    pt: 'Enfileira um arquivo inteiro de mensagens (uma por linha) — replay de batch ou migração manual de dados.',
    en: 'Feeds a whole file of messages (one per line) — batch replay or manual data migration.' },
  { code: 'kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders --property parse.key=true --property key.separator=:', cat: 'produce',
    pt: 'Ativa chave na entrada: cada linha `chave:valor` vira uma mensagem COM chave — e chave é o que decide a partição (mesma chave, mesma partição).',
    en: 'Enables keys on input: each `key:value` line becomes a message WITH a key — and the key is what decides the partition (same key, same partition).' },
  { code: 'echo "user42:{\\"order\\":\\"abc\\"}" | kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders --property parse.key=true --property key.separator=:', cat: 'produce',
    pt: 'Mensagem com chave `user42` e payload JSON — o mapa mental é "chave separada por `:` da primeira ocorrência".',
    en: 'Message with key `user42` and a JSON payload — the mental model is "key separated from value at the first `:`".' },
  { code: 'kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders --producer-property acks=all --producer-property enable.idempotence=true', cat: 'produce',
    pt: 'Garante escrita durável (`acks=all`) e sem duplicatas em retry (`enable.idempotence=true`). O padrão de produção de verdade — o console é o jeito mais rápido de testar as flags.',
    en: 'Ensures durable writes (`acks=all`) and no duplicates on retries (`enable.idempotence=true`). The real production default — the console is the fastest way to try the flags.' },
  { code: 'kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders --producer-property compression.type=lz4', cat: 'produce',
    pt: 'Comprime o lote em trânsito — reduz banda e disco para payloads repetitivos (JSON de logs, eventos...).',
    en: 'Compresses the batch in transit — cuts bandwidth and disk for repetitive payloads (log JSON, events...).' },

  // ─── Consumir mensagens ─────────────────────────────────────────────
  { code: 'kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --from-beginning', cat: 'consume',
    pt: 'Consome do INÍCIO do tópico — mas só vale para um grupo NOVO (sem offset commitado). Para replay de grupo existente, use `--reset-offsets`.',
    en: 'Consumes from the BEGINNING of the topic — but only applies to a NEW group (no committed offset). For replaying an existing group, use `--reset-offsets`.' },
  { code: 'kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --group billing', cat: 'consume',
    pt: 'Consome com grupo EXPLÍCITO nomeado `billing` — sem `--group`, o console cria um id aleatório por execução e só enxerga mensagens novas.',
    en: 'Consumes with an EXPLICIT group named `billing` — without `--group`, the console creates a random id per run and only sees new messages.' },
  { code: 'kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --property print.key=true --property print.value=true --property print.timestamp=true --property print.partition=true', cat: 'consume',
    pt: 'Imprime chave, valor, timestamp e partição em cada linha — o debug de "para qual partição minha chave caiu?" sem sair do terminal.',
    en: 'Prints key, value, timestamp and partition on each line — debugging "which partition did my key land on?" without leaving the terminal.' },
  { code: 'kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --partition 3 --offset 100', cat: 'consume',
    pt: 'Lê UMA partição específica a partir de um offset — inspeção cirúrgica sem consumidor de grupo no meio.',
    en: 'Reads ONE specific partition from an offset — surgical inspection without a group consumer in the way.' },
  { code: 'kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --max-messages 100', cat: 'consume',
    pt: 'Encerra sozinho após N mensagens — amostra controlada em vez de stream infinito de Ctrl+C.',
    en: 'Stops by itself after N messages — a controlled sample instead of an endless Ctrl+C stream.' },
  { code: 'kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --isolation-level read_committed', cat: 'consume',
    pt: 'Só enxerga mensagens de transações COMMITADAS — o único jeito de não ler dados descartados por aborts em prod.',
    en: 'Only sees COMMITTED transactional messages — the only way to avoid reading data discarded by aborts in prod.' },

  // ─── Consumer groups & offsets ──────────────────────────────────────
  { code: 'kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list', cat: 'groups',
    pt: 'Lista todos os consumer groups ativos e inativos — o censo de "quem está consumindo o quê".',
    en: 'Lists all active and inactive consumer groups — the census of "who is consuming what".' },
  { code: 'kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group billing', cat: 'groups',
    pt: 'Mostra por partição: o membro responsável, o offset atual e o LAG — lag crescendo = processamento atrasando, o métrica de saúde nº 1 do Kafka.',
    en: 'Shows per partition: the owning member, current offset and LAG — growing lag means processing is falling behind, the #1 Kafka health metric.' },
  { code: 'kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group billing --topic orders --reset-offsets --to-earliest --dry-run', cat: 'groups',
    pt: 'Prévia (sem executar) do reset dos offsets do grupo para o começo do tópico. O `--dry-run` é obrigatório quando o tópico é destino de decisões.',
    en: 'Preview (without executing) of resetting the group offsets to the beginning of the topic. `--dry-run` is mandatory when the topic is subject to decisions.' },
  { code: 'kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group billing --topic orders --reset-offsets --to-earliest --execute', cat: 'groups',
    pt: 'EXECUTA o replay do começo do tópico. O grupo precisa estar INATIVO (sem membro rodando) — senão o `--execute` falha.',
    en: 'EXECUTES the replay from the beginning of the topic. The group must be INACTIVE (no running member) — otherwise `--execute` fails.' },
  { code: 'kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group billing --reset-offsets --to-latest --execute', cat: 'groups',
    pt: 'Pula para o FIM — faz o grupo "esquecer" o histórico acumulado e começar só do que vier daqui pra frente.',
    en: 'Skips to the END — makes the group "forget" the accumulated history and start only from what comes next.' },
  { code: 'kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group billing --topic orders --reset-offsets --shift-by -1000 --execute', cat: 'groups',
    pt: 'Recua (ou avança com `+`) N offsets em cada partição — "reprocessa as últimas 1000" sem depender de datas.',
    en: 'Shifts back (or forward with `+`) N offsets per partition — "reprocess the last 1000" without depending on dates.' },
  { code: 'kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group billing --topic orders --reset-offsets --to-datetime 2026-08-18T00:00:00.000 --execute', cat: 'groups',
    pt: 'Rebobina para o ponto que a mensagem tinha aquele timestamp — replay "de quando eu quero" para janelas de incidente.',
    en: 'Rewinds to the point where messages had that timestamp — replay "from whenever I want" for incident windows.' },

  // ─── Configurações (kafka-configs) ──────────────────────────────────
  { code: 'kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name orders --describe', cat: 'configs',
    pt: 'Mostra as configurações EFETIVAS do tópico (defaults + overrides) — compare com `--list`/`--alter` para saber o que realmente está ativo.',
    en: 'Shows the topic EFFECTIVE configs (defaults + overrides) — compare with `--list`/`--alter` to know what is actually active.' },
  { code: 'kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name orders --alter --add-config retention.ms=86400000', cat: 'configs',
    pt: 'Altera a retenção por TEMPO (aqui, 1 dia). O `retention.ms` se aplica à mensagem por timestamp — o caso mais comum de mudança de config.',
    en: 'Changes TIME-based retention (here, 1 day). `retention.ms` applies to a message by timestamp — the most common config change of all.' },
  { code: 'kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name events --alter --add-config cleanup.policy=compact', cat: 'configs',
    pt: 'Liga log COMPACTION: mantém só o valor mais recente por chave — estado derivado (última posição, latest profile) em vez de história completa.',
    en: 'Turns on log COMPACTION: keeps only the most recent value per key — derived state (last position, latest profile) instead of full history.' },
  { code: 'kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name orders --alter --delete-config retention.ms', cat: 'configs',
    pt: 'Remove um override — volta ao default do cluster. O espelho do `--add-config`, para limpar tentativas.',
    en: 'Removes an override — returns to the cluster default. The mirror of `--add-config`, for cleaning up experiments.' },
  { code: 'kafka-configs.sh --bootstrap-server localhost:9092 --entity-type brokers --entity-name 0 --describe', cat: 'configs',
    pt: 'Inspeciona as configs dinâmicas de UM broker (ID 0) — sem precisar ir no arquivo `server.properties`.',
    en: 'Inspects the dynamic configs of ONE broker (ID 0) — without having to dig into `server.properties`.' },
  { code: 'kafka-configs.sh --bootstrap-server localhost:9092 --entity-type clients --entity-name myapp --alter --add-config producer.max.request.size=10485760', cat: 'configs',
    pt: 'Override por cliente (`client.id=myapp`) — limite maior de requisição só para aquele app, sem afetar o resto do cluster.',
    en: 'Per-client override (`client.id=myapp`) — bigger request limit only for that app, without affecting the rest of the cluster.' },

  // ─── Permissões (kafka-acls) ────────────────────────────────────────
  { code: 'kafka-acls.sh --bootstrap-server localhost:9092 --add --topic orders --producer --allow-principal User:svc-producer', cat: 'acls',
    pt: 'Concede papel PRODUCER (Read+Write describe sobre o tópico) ao principal `User:svc-producer` — o grant mínimo de escrita.',
    en: 'Grants the PRODUCER role (Read+Write describe on the topic) to principal `User:svc-producer` — the minimal write grant.' },
  { code: 'kafka-acls.sh --bootstrap-server localhost:9092 --add --topic orders --consumer --group billing --allow-principal User:svc-billing', cat: 'acls',
    pt: 'Papel CONSUMER com o grupo que o app usa — sem o `--group`, o consumidor até lê, mas não consegue commit de offsets.',
    en: 'CONSUMER role with the group the app uses — without `--group`, the consumer can read but can\'t commit offsets.' },
  { code: 'kafka-acls.sh --bootstrap-server localhost:9092 --add --topic orders --operation All --allow-principal User:data-eng', cat: 'acls',
    pt: 'Controle total de operações (All) sobre o tópico para um principal — grants "admin de dados" sem ser superusuário.',
    en: 'Full operation control (All) over the topic for one principal — "data admin" grants without being a superuser.' },
  { code: 'kafka-acls.sh --bootstrap-server localhost:9092 --list', cat: 'acls',
    pt: 'Lista todas as ACLs do cluster — a auditoria "quem tem o quê" antes de tocar em qualquer grant.',
    en: 'Lists all ACLs in the cluster — the "who has what" audit before touching any grant.' },
  { code: 'kafka-acls.sh --bootstrap-server localhost:9092 --remove --topic orders --producer --allow-principal User:svc-producer', cat: 'acls',
    pt: 'REVOGA o grant de producer — o contrário do `--add`. Sem ele, permissão concedida é permissão eterna.',
    en: 'REVOKES the producer grant — the reverse of `--add`. Without it, a granted permission is a forever permission.' },

  // ─── Outras ferramentas ─────────────────────────────────────────────
  { code: 'kafka-topics.sh --bootstrap-server localhost:9092 --describe --topics-with-overrides', cat: 'tools',
    pt: 'Só tópicos com config FORA do default — a triagem de "quem mexeu em quê" sem ler tópico por tópico.',
    en: 'Only topics with configs OFF the default — the "who touched what" triage without reading topic by topic.' },
  { code: 'kafka-reassign-partitions.sh --bootstrap-server localhost:9092 --generate --topics-to-move-json-file topics.json', cat: 'tools',
    pt: 'Gera um plano candidato de movimentação de partições (para o JSON de entrada). O primeiro passo antes de qualquer rebalanceamento de disco.',
    en: 'Generates a candidate partition-movement plan (from the input JSON). The first step before any disk rebalance.' },
  { code: 'kafka-reassign-partitions.sh --bootstrap-server localhost:9092 --reassignment-json-file reassign.json --execute\nkafka-reassign-partitions.sh --bootstrap-server localhost:9092 --reassignment-json-file reassign.json --verify', cat: 'tools',
    pt: 'EXECUTA a reassignação e depois a VERIFICA — mover partições entre brokers é assíncrono e só acaba quando o `--verify` diz que sim.',
    en: 'EXECUTES the reassignment and then VERIFIES it — moving partitions between brokers is async and only finishes when `--verify` says so.' },
  { code: 'kafka-dump-log.sh --print-data-log --files /var/lib/kafka/data/orders-0/00000000000000000000.log', cat: 'tools',
    pt: 'Despeja o conteúdo cru de um segmento de log — inspeção forense quando a mensagem "sumiu" ou o formato está suspeito.',
    en: 'Dumps the raw content of a log segment — forensic inspection when a message "disappeared" or the format looks suspicious.' },
  { code: 'kafka-delete-records.sh --bootstrap-server localhost:9092 --offset-json-file offsets.json', cat: 'tools',
    pt: 'Remove registros ABAIXO de um offset por partição (JSON de entrada) — "purga o lixo antes do offset X" sem apagar o tópico.',
    en: 'Removes records BELOW an offset per partition (input JSON) — "purge the garbage before offset X" without deleting the topic.' },
  { code: 'kafka-get-offsets.sh --bootstrap-server localhost:9092 --topic orders', cat: 'tools',
    pt: 'Mostra o offset de início E o fim lógico do log por partição — quanto dado existe, e até onde dá para reprocessar.',
    en: 'Shows the earliest AND latest valid offsets per partition — how much data exists, and how far back you can reprocess.' },
  { code: 'kafka-producer-perf-test.sh --topic orders --num-records 100000 --record-size 100 --throughput 10000 --producer-props bootstrap.servers=localhost:9092', cat: 'tools',
    pt: 'Benchmark de escrita: taxa, latência e throughput reais do producer — o baseline antes de comparar configs/compressão.',
    en: 'Write benchmark: real rate, latency and throughput of the producer — the baseline before comparing configs/compression.' },
  { code: 'kafka-consumer-perf-test.sh --topic orders --messages 100000 --bootstrap-server localhost:9092', cat: 'tools',
    pt: 'Benchmark de leitura: quanto esse consumer consegue drenar por segundo daquele tópico.',
    en: 'Read benchmark: how much this consumer can drain per second from that topic.' },

  // ─── Propriedades producer/consumer ─────────────────────────────────
  { code: 'acks=all', cat: 'props',
    pt: 'Producer só confirma depois que TODAS as réplicas em sincronia gravaram. `0` = disparou e esqueceu; `1` = líder gravou (pode perder em falha do líder).',
    en: 'Producer confirms only after ALL in-sync replicas have written. `0` = fire and forget; `1` = leader wrote (can lose on leader failure).' },
  { code: 'enable.idempotence=true', cat: 'props',
    pt: 'Com `acks=all`, elimina duplicatas em retries — o Kafka sequencia por producer e descarta reenvios. Ligar junto de `acks=all` é a dupla de produção.',
    en: 'With `acks=all`, eliminates duplicates on retries — Kafka sequences per producer and discards resends. Pairing it with `acks=all` is the production duo.' },
  { code: 'compression.type=lz4 (snappy | gzip | zstd)', cat: 'props',
    pt: 'Compressão do lote no producer — zstd é o de maior taxa, lz4 o de maior velocidade. Consumidor descomprime sozinho.',
    en: 'Producer batch compression — zstd gives the best ratio, lz4 the best speed. The consumer decompresses transparently.' },
  { code: 'linger.ms=5 / batch.size=16384', cat: 'props',
    pt: 'Producer junta mensagens por até 5 ms ou até 16 KB — mais throughput com um pouco de latência. Ajuste fino antes de culpar o cluster.',
    en: 'Producer accumulates messages for up to 5 ms or 16 KB — more throughput at a small latency cost. Fine-tune before blaming the cluster.' },
  { code: 'client.id=myapp', cat: 'props',
    pt: 'Identifica o app nos logs, métricas e "Throughput de protocolo" do broker — sem ele, todo debug de "quem está escrevendo?" fica no escuro.',
    en: 'Identifies the app in logs, metrics and broker protocol throughput — without it, every "who is writing?" debug goes dark.' },
  { code: 'auto.offset.reset=earliest (latest | none)', cat: 'props',
    pt: 'O que fazer quando NÃO há offset commitado: `earliest` lê do início, `latest` só mensagens novas, `none` falha. Não faz nada para grupos que já commitaram.',
    en: 'What to do when there\'s NO committed offset: `earliest` reads from the start, `latest` only new messages, `none` fails. Never applies to groups that already committed.' },
  { code: 'enable.auto.commit=false', cat: 'props',
    pt: 'Desliga o commit automático — o app commit explicitamente depois de PROCESSAR. Commit automático = risco de reprocessar a mesma mensagem após crash; desligado = risco de perder a posição se o processamento falhar antes do commit.',
    en: 'Turns off auto-commit — you commit explicitly after PROCESSING. Auto-commit with a crash = reprocessing; manual = possibly losing the acked-but-uncommitted window.' },
  { code: 'max.poll.records=500 / max.poll.interval.ms=300000', cat: 'props',
    pt: 'Quantos registros por poll e o tempo máximo entre polls antes do grupo remover o membro — processar devagar demais = ser expulso e rebalancear.',
    en: 'How many records per poll and the max time between polls before the group evicts the member — processing too slowly = being kicked and causing a rebalance.' },
  { code: 'isolation.level=read_committed', cat: 'props',
    pt: 'Consumer só lê transações commitadas (e mensagens não-transacionais). O modo read_uncommitted padrão lê também aborts.',
    en: 'Consumer only reads committed transactions (and non-transactional messages). The default read_uncommitted mode also reads aborts.' },
  { code: 'min.insync.replicas=2', cat: 'props',
    pt: 'Broker-level (ou por tópico): quantas réplicas em sync a escrita exige. Com `acks=all` e isso=2, perder 1 broker num RF3 ainda aceita escrita — perder 2, rejeita.',
    en: 'Broker-level (or per topic): how many in-sync replicas a write requires. With `acks=all` and this=2, losing 1 broker on an RF3 still accepts writes — losing 2 rejects.' },

  // ─── Conceitos que importam ─────────────────────────────────────────
  { code: 'Partições & ordem', cat: 'concepts',
    pt: 'Mensagens com a MESMA chave caem na mesma partição e só têm ordem garantida DENTRO dela. Ordem global não existe — quem precisa de ordem usa chave estável (ID, sessão).',
    en: 'Messages with the SAME key land on the same partition and are only ordered WITHIN it. Global order does not exist — whoever needs order uses a stable key (ID, session).' },
  { code: 'Consumer group', cat: 'concepts',
    pt: 'Cada partição é consumida por exatamente UM membro do grupo — o grupo escala o consumo em paralelo. Mais consumidores que partições = membros ociosos sem tráfego.',
    en: 'Each partition is consumed by exactly ONE member of the group — the group scales consumption in parallel. More consumers than partitions = idle members with no traffic.' },
  { code: 'Offsets & lag', cat: 'concepts',
    pt: 'O grupo commit o offset (posição) por partição. LAG = fim do log − offset atual. Lag estável alto é normal se a escrita é maior; lag CRESCENDO é o sintoma clássico de consumer atrasado.',
    en: 'The group commits an offset (position) per partition. LAG = log end − current offset. Stable high lag is fine if writes outpace; GROWING lag is the classic stuck-consumer symptom.' },
  { code: 'Aumentar partições quebra chaves', cat: 'concepts',
    pt: 'O hash chave→partição muda quando o número de partições muda — a ordem por chave histórica não sobrevive ao `--alter --partitions`. Para reordenar de verdade, tópico novo.',
    en: 'The key→partition hash changes when the partition count changes — historical per-key order does not survive `--alter --partitions`. For true reordering, a new topic.' },
  { code: 'Retenção: tempo + tamanho', cat: 'concepts',
    pt: 'O log é apagado por tempo (`retention.ms`, default 7 dias) OU por tamanho (`log.retention.bytes`), o que estourar primeiro. Compactação=`cleanup.policy=compact` guarda o último valor por chave.',
    en: 'The log is dropped by time (`retention.ms`, 7 days default) OR by size (`log.retention.bytes`), whichever hits first. Compaction=`cleanup.policy=compact` keeps the last value per key.' },
  { code: 'Schema Registry', cat: 'concepts',
    pt: 'Payloads Avro/JSON/Protobuf carregam o ID do schema nos primeiros 5 bytes — o consumidor baixa o schema do Registry e valida/evolui sem quebrar quem já está no tópico.',
    en: 'Avro/JSON/Protobuf payloads carry the schema ID in the first 5 bytes — the consumer fetches the schema from the Registry and evolves without breaking existing readers.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Kafka',
    intro: (
      <>
        Kafka — o barramento de eventos que segura metade da infra. Aqui estão
        os comandos e propriedades que você esquece na hora do incidente:{' '}
        <Text code>kafka-topics</Text>, <Text code>kafka-console-producer</Text>,{' '}
        <Text code>kafka-console-consumer</Text>, <Text code>kafka-consumer-groups</Text>{' '}
        (o reset de offsets que todo mundo erra),{' '}
        <Text code>kafka-configs</Text>, <Text code>kafka-acls</Text> e o
        resto das ferramentas do <Text code>$KAFKA_HOME/bin</Text>, mais as
        propriedades de producer/consumer e os conceitos que decidem ordem e
        durabilidade.
      </>
    ),
    search: 'Buscar por comando, flag ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no Kafka',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>--from-beginning</Text> não é "rebobinar".</Text>{' '}
          Ele só define o <Text code>auto.offset.reset=earliest</Text> para um
          grupo NOVO (sem offset commitado). Grupos que já commitaram ignoram:
          para replay de verdade use{' '}
          <Text code>kafka-consumer-groups --reset-offsets</Text> — sempre com{' '}
          <Text code>--dry-run</Text> antes do <Text code>--execute</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Consumer do console sem <Text code>--group</Text>.</Text>{' '}
          Sem grupo explícito ele sorteia um id aleatório por execução e só lê
          mensagens novas. Quando quiser controles de offset, diga qual grupo é
          (e verifique se ele já não está sendo consumido por outra aplicação).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Reset exige grupo INATIVO.</Text> O{' '}
          <Text code>--reset-offsets --execute</Text> falha se o grupo tiver
          membro ativo — pare o consumer primeiro (ou ele vai rebalancear e
          brigar pelo controle do offset).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Partição só aumenta, e quebra a ordem por chave.</Text>{' '}
          Não existe diminuir. E quando o hash muda, a garantia de "mesma chave,
          mesma partição" se perde para os dados antigos — planeje partições
          pensando no pico de consumo.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>acks=all</Text> não é mágica.</Text> Ele espera
          todas as réplicas EM SINCRONIA. Sem <Text code>min.insync.replicas</Text>{' '}
          definido, uma ISR com 1 réplica ainda confirma "durável" — ligue os
          dois juntos.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>ACL liga = todos negados.</Text> Habilitar autorização num
          cluster que vivia sem ela derruba todo mundo que não tem grant.
          Conceda antes de ligar, e confira com <Text code>--list</Text>.
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
    title: 'Kafka Cheat Sheet',
    intro: (
      <>
        Kafka — the event bus holding half the infra together. Here are the
        commands and properties you forget mid-incident:{' '}
        <Text code>kafka-topics</Text>, <Text code>kafka-console-producer</Text>,{' '}
        <Text code>kafka-console-consumer</Text>, <Text code>kafka-consumer-groups</Text>{' '}
        (the offset reset everyone gets wrong),{' '}
        <Text code>kafka-configs</Text>, <Text code>kafka-acls</Text> and the
        rest of the tools in <Text code>$KAFKA_HOME/bin</Text>, plus the
        producer/consumer properties and the concepts that decide ordering and
        durability.
      </>
    ),
    search: 'Search by command, flag or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most on Kafka',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>--from-beginning</Text> is not "rewind".</Text>{' '}
          It only sets <Text code>auto.offset.reset=earliest</Text> for a NEW
          group (no committed offset). Groups that already committed ignore it:
          for real replays use{' '}
          <Text code>kafka-consumer-groups --reset-offsets</Text> — always{' '}
          <Text code>--dry-run</Text> before <Text code>--execute</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Console consumer without <Text code>--group</Text>.</Text>{' '}
          Without an explicit group it draws a random id per run and only reads
          new messages. When you want offset control, say which group it is
          (and check it isn&apos;t already consumed by another application).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Offset reset needs an INACTIVE group.</Text>{' '}
          <Text code>--reset-offsets --execute</Text> fails if the group has an
          active member — stop the consumer first (or it will rebalance and
          fight over the offset).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Partitions only grow, and break key order.</Text>{' '}
          There is no shrinking. And when the hash changes, the "same key, same
          partition" guarantee is lost for existing data — plan partitions for
          the consumption peak.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>acks=all</Text> is not magic.</Text> It waits
          for all IN-SYNC replicas. Without{' '}
          <Text code>min.insync.replicas</Text>, an ISR of 1 replica still
          confirms "durable" — enable both together.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Enabling ACLs = everyone denied.</Text> Turning on
          authorization on a cluster that lived without it breaks every
          principal without a grant. Grant before enabling, and audit with{' '}
          <Text code>--list</Text>.
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

export default function KafkaCheatsheetPage() {
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
    const header = '# Kafka (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```',
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
        icon={<CodeOutlined />}
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