import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined, LineChartOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['setup', 'cfg', 'big', 'sel', 'ops', 'agg', 'fun', 'api', 'rules']

const CATEGORY_COLOR = {
  setup: 'geekblue',
  cfg: 'green',
  big: 'blue',
  sel: 'cyan',
  ops: 'purple',
  agg: 'magenta',
  fun: 'gold',
  api: 'volcano',
  rules: 'red',
}

const labelOf = {
  setup: { pt: 'Setup & promtool', en: 'Setup & promtool' },
  cfg: { pt: 'Config prometheus.yml', en: 'prometheus.yml config' },
  big: { pt: 'Básicos do PromQL', en: 'PromQL basics' },
  sel: { pt: 'Seletores & vetores', en: 'Selectors & vectors' },
  ops: { pt: 'Operações', en: 'Operations' },
  agg: { pt: 'Agregações', en: 'Aggregations' },
  fun: { pt: 'Funções', en: 'Functions' },
  api: { pt: 'HTTP API', en: 'HTTP API' },
  rules: { pt: 'Regras & Alerting', en: 'Rules & Alerting' },
}

const ITEMS = [
  // ─── Setup & promtool ───────────────────────────────────────────────
  { code: 'prometheus --config.file=prometheus.yml', cat: 'setup',
    pt: 'Sobe o Prometheus apontando pro arquivo de configuração. No container oficial, o config esperado é `/etc/prometheus/prometheus.yml`.',
    en: 'Starts Prometheus pointing at the config file. In the official container, the expected config is `/etc/prometheus/prometheus.yml`.' },
  { code: 'promtool check config prometheus.yml', cat: 'setup',
    pt: 'Valida a configuração (global, scrape_configs, rule_files, alerting) NA MÃO, sem subir o servidor — o passo antes de aplicar em produção.',
    en: 'Validates the config (global, scrape_configs, rule_files, alerting) BY HAND, without starting the server — the step before applying it in production.' },
  { code: 'promtool check rules rules.yml', cat: 'setup',
    pt: 'Checa a sintaxe dos arquivos de recording/alerting rules e resolve se os `expr` são válidos. Erro de yaml aqui derruba o reload do servidor.',
    en: 'Checks the syntax of recording/alerting rule files and resolves whether the `expr` are valid. A YAML error here breaks the server reload.' },
  { code: 'promtool query instant "http://localhost:9090" "up"', cat: 'setup',
    pt: 'Consulta instantânea via CLI: retorna o resultado como o `/api/v1/query`, sem precisar abrir o navegador.',
    en: 'Instant query via CLI: returns the result just like `/api/v1/query`, without opening the browser.' },
  { code: 'promtool query range "http://localhost:9090" "rate(http_requests_total[5m])" --start=1600000000 --end=1600003600 --step=60s', cat: 'setup',
    pt: 'Consulta por intervalo com passo fixo — útil pra inspecionar uma janela específica do histórico em script.',
    en: 'Range query with a fixed step — handy for inspecting a specific historical window in a script.' },
  { code: 'curl -s localhost:9090/metrics | head', cat: 'setup',
    pt: 'O formato de texto de exposição: cada linha `metric{labels} valor`, com `# HELP` e `# TYPE` no topo. É só um GET.',
    en: 'The text exposition format: each line `metric{labels} value`, with `# HELP` and `# TYPE` headers on top. It is just a GET.' },
  { code: "node_exporter --web.listen-address=':9100'", cat: 'setup',
    pt: 'O collector padrão de métricas do host (CPU, memória, disco, rede) — o alvo favorito do primeiro `scrape_configs`.',
    en: 'The standard host metrics collector (CPU, memory, disk, network) — the favorite target of your first `scrape_configs`.' },
  { code: 'docker run -d -p 9090:9090 -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml" prom/prometheus', cat: 'setup',
    pt: 'Rodar o Prometheus em container com seu config montado como volume. O `-v` posicional é o caminho do arquivo, não do diretório.',
    en: 'Run Prometheus in a container with your config mounted as a volume. The `-v` positional is the file path, not a directory.' },

  // ─── Config prometheus.yml ───────────────────────────────────────────
  { code: 'global:\n  scrape_interval: 15s\n  evaluation_interval: 30s', cat: 'cfg',
    pt: 'Intervalos globais: `scrape_interval` é o tempo entre cada coleta; `evaluation_interval` é a frequência das rules. Cada um pode ser sobrescrito por job.',
    en: 'Global intervals: `scrape_interval` is the time between scrapes; `evaluation_interval` is how often rules are evaluated. Each can be overridden per job.' },
  { code: 'scrape_configs:\n  - job_name: node\n    static_configs:\n      - targets: ["localhost:9100"]', cat: 'cfg',
    pt: 'O bloco mínimo de coleta: um `job_name` (vira o label `job`) e uma lista estática de alvos `host:port`.',
    en: 'The minimal scrape block: a `job_name` (becomes the `job` label) and a static list of `host:port` targets.' },
  { code: 'scrape_configs:\n  - job_name: api\n    metrics_path: /metrics/private\n    scrape_interval: 30s\n    scrape_timeout: 10s\n    static_configs:\n      - targets: ["api:8080"]', cat: 'cfg',
    pt: 'Ajustes por job: endpoint customizado de métricas, intervalo próprio e um `scrape_timeout` que nunca deve passar do intervalo.',
    en: 'Per-job tweaks: custom metrics endpoint, own interval, and a `scrape_timeout` that should never exceed the interval.' },
  { code: 'scrape_configs:\n  - job_name: service\n    relabel_configs:\n      - source_labels: [__meta_ec2_tag_Env]\n        regex: staging\n        action: drop', cat: 'cfg',
    pt: 'Relabeling: usa labels meta (`__meta_*`, ex.: descoberta EC2/Consul/K8s) pra reescrever ou DERRUBAR alvos antes de gravar — o filtro acontece no scrape, não na query.',
    en: 'Relabeling: uses meta labels (`__meta_*`, e.g. EC2/Consul/K8s discovery) to rewrite or DROP targets before storing — filtering happens at scrape time, not query time.' },
  { code: 'global:\n  external_labels:\n    cluster: prod-a\nrule_files:\n  - "rules/*.yml"', cat: 'cfg',
    pt: '`external_labels` é adicionada em TODA série (essencial pro remote_write/multi-tenant); `rule_files` carrega os arquivos de rules via glob.',
    en: '`external_labels` is added to EVERY series (essential for remote_write/multi-tenancy); `rule_files` loads rule files via glob.' },
  { code: 'alerting:\n  alertmanagers:\n    - static_configs:\n        - targets: ["alertmanager:9093"]', cat: 'cfg',
    pt: 'Conecta o Prometheus ao Alertmanager — sem esse bloco, as regras disparam mas ninguém é notificado.',
    en: 'Connects Prometheus to the Alertmanager — without this block, rules fire but nobody gets notified.' },
  { code: 'scrape_configs:\n  - job_name: secured\n    authorization:\n      credentials_file: /var/run/secrets/prom-token\n    static_configs:\n      - targets: ["app:9090"]', cat: 'cfg',
    pt: 'Scrape autenticado: `authorization` aceita `credentials` literal ou `credentials_file`. Há também `basic_auth`, `bearer_token` e `tls_config`.',
    en: 'Authenticated scrape: `authorization` accepts literal `credentials` or `credentials_file`. There is also `basic_auth`, `bearer_token` and `tls_config`.' },

  // ─── Básicos do PromQL ───────────────────────────────────────────────
  { code: 'up', cat: 'big',
    pt: 'A métrica-mãe do pessoal de plantão: `1` quando o scrape do alvo deu certo, `0` quando falhou. Tem os labels `job` e `instance`.',
    en: "The on-call person's mother metric: `1` when the target scrape succeeded, `0` when it failed. Carries the `job` and `instance` labels." },
  { code: 'node_memory_MemAvailable_bytes', cat: 'big',
    pt: 'Seleciona uma métrica do tipo gauge (mede um valor que sobe e desce). O resultado é um VETOR INSTANTÂNEO: uma série por combinação de labels.',
    en: 'Selects a gauge metric (measures a value that goes up and down). The result is an INSTANT VECTOR: one series per label combination.' },
  { code: 'http_requests_total', cat: 'big',
    pt: 'Um contador (counter): só cresce (ou reseta no restart). Pra ter vazão você SEMPRE passa por `rate()`/`increase()` — nunca mostre o contador cru.',
    en: 'A counter: only ever grows (or resets on restart). For throughput you ALWAYS go through `rate()`/`increase()` — never chart the raw counter.' },
  { code: '{__name__="http_requests_total"}', cat: 'big',
    pt: 'Escrever o nome da métrica como matcher de label dentro das chaves — equivalente e explícito. Só dá pra pensar em `__name__` desse jeito.',
    en: 'Writing the metric name as a label matcher inside the braces — equivalent and explicit. `__name__` is the only way to reference it.' },
  { code: 'http_requests_total{method="GET"}', cat: 'big',
    pt: 'Filtra por um label com matching EXATO: `=` igual, `!=` diferente. Remove as séries que não casam, não mostra "0".',
    en: 'Filters by a label with EXACT matching: `=` equals, `!=` not equals. Series that do not match are removed, not shown as "0".' },
  { code: 'http_requests_total[5m]', cat: 'big',
    pt: 'O `[5m]` transforma o vetor instantâneo em VETOR DE RANGE: uma lista de amostras dos últimos 5 minutos por série. É o insumo de `rate()` e amigos.',
    en: 'The `[5m]` turns the instant vector into a RANGE VECTOR: a list of samples from the last 5 minutes per series. It is the input for `rate()` and friends.' },
  { code: 'rate(http_requests_total[5m])', cat: 'big',
    pt: 'O padrão ouro: vazão média por segundo nos últimos 5 minutos, ignorando resets do contador. Combine com `sum()` pra ter o total do serviço.',
    en: 'The gold standard: average per-second throughput over the last 5 minutes, ignoring counter resets. Combine with `sum()` for the service total.' },
  { code: 'http_requests_total offset 5m', cat: 'big',
    pt: 'Avalia a query como se estivesse 5 minutos atrás — comparação "agora vs 5m atrás" sem precisar de range query.',
    en: 'Evaluates the query as if it were 5 minutes in the past — a "now vs 5m ago" comparison without a range query.' },
  { code: 'http_requests_total @ 1609746000', cat: 'big',
    pt: 'Avalia num timestamp UNIX fixo — útil pra reproduzir exatamente o estado no momento de um incidente.',
    en: 'Evaluates at a fixed UNIX timestamp — useful to reproduce exactly the state at the moment of an incident.' },

  // ─── Seletores & vetores ─────────────────────────────────────────────
  { code: 'http_requests_total{status!~"5.."}', cat: 'sel',
    pt: 'Os quatro matchers: `=`, `!=`, `=~` (regex) e `!~` (regex negativa). Aqui, tudo que NÃO começa com 5 (erro de servidor).',
    en: 'The four matchers: `=`, `!=`, `=~` (regex) and `!~` (negated regex). Here: everything NOT starting with 5 (server error).' },
  { code: 'http_requests_total{job=~"api-.*"}', cat: 'sel',
    pt: 'REGEX SEMPRE ANCORADO no PromQL: `=~"api-"` casa só a string exata `api-`, não `api-1`. A armadilha que faz a query "voltar vazia" sem aviso.',
    en: 'PromQL regex is ALWAYS fully anchored: `=~"api-"` only matches the exact string `api-`, not `api-1`. The silent trap that returns empty results.' },
  { code: 'http_requests_total{handler=""}', cat: 'sel',
    pt: 'Matcher de label VAZIO seleciona séries onde o label não existe OU está vazio — o jeito de pegar séries "anômalas" sem o label.',
    en: 'An EMPTY label matcher selects series where the label does not exist OR is empty — the way to catch "anomalous" series lacking the label.' },
  { code: 'count({__name__=~".+"})', cat: 'sel',
    pt: 'Conta quantas séries existem no total — o primeiro passo quando o cardinality está subindo e o servidor começa a travar.',
    en: 'Counts how many series exist in total — the first step when cardinality is climbing and the server starts to stall.' },
  { code: 'count by (job) ({__name__=~".+"})', cat: 'sel',
    pt: 'Cardinality por job: descobre qual aplicação está vazando séries (todo label único vira uma série nova).',
    en: 'Cardinality per job: finds which application is leaking series (every unique label becomes a new series).' },
  { code: '{__name__=~"node_memory.*"}', cat: 'sel',
    pt: 'Acha TODOS os nomes de métrica com um prefixo usando regex sobre `__name__` — o explorador de métricas disponíveis.',
    en: 'Finds ALL metric names with a prefix via a regex on `__name__` — the explorer of available metrics.' },

  // ─── Operações ───────────────────────────────────────────────────────
  { code: 'node_filesystem_size_bytes - node_filesystem_free_bytes', cat: 'ops',
    pt: 'Aritmética simples entre vetores: casa as séries pelo MESMO conjunto de labels e opera elemento a elemento.',
    en: 'Simple arithmetic between vectors: matches series by the SAME label set and operates element-wise.' },
  { code: 'node_filesystem_free_bytes < 5e9', cat: 'ops',
    pt: 'A comparação vira um FILTRO: devolve só as séries que satisfazem (aqui, menos de 5 GB livres). Instâncias diferentes não se misturam.',
    en: 'A comparison acts as a FILTER: returns only the series that satisfy it (here: less than 5 GB free). Different instances never mix.' },
  { code: 'http_requests_total > bool 500', cat: 'ops',
    pt: 'O modificador `bool` muda o comparador pra retornar `1`/`0` em vez de filtrar — o jeito de virar uma condição em métrica.',
    en: 'The `bool` modifier makes the comparator return `1`/`0` instead of filtering — the way to turn a condition into a metric.' },
  { code: 'up{job="api"} and on(instance) node_load1 > 4', cat: 'ops',
    pt: '`and` exige que os DOIS lados existam pra mesma série — aqui, instâncias do job `api` que estão de pé E com load alto. `on(label)` define o match.',
    en: '`and` requires BOTH sides to have the same series — here: `api` instances that are up AND have high load. `on(label)` defines the match.' },
  { code: 'up{job="api"} or on() vector(0)', cat: 'ops',
    pt: '`or` devolve séries da esquerda e completa com a direita onde faltar — o padrão pra status com "fallback 0" em vez de buraco no gráfico.',
    en: '`or` returns series from the left and fills gaps with the right — the pattern for "fallback to 0" status instead of chart holes.' },
  { code: 'metric_a unless metric_b', cat: 'ops',
    pt: '`unless` remove da esquerda toda série que também exista na direita — "métricas disso, exceto as que são aquilo".',
    en: '`unless` drops from the left any series that also exists on the right — "these metrics, except the ones that are those".' },
  { code: 'rate(node_cpu_seconds_total{mode="user"}[5m]) / ignoring(mode) sum by (instance, cpu) (rate(node_cpu_seconds_total[5m]))', cat: 'ops',
    pt: '`ignoring(mode)` casa vetores ignorando UM label — o clássico: fração de CPU do modo user por núcleo. `on(label)` é o espelho pra escolher o label.',
    en: '`ignoring(mode)` matches vectors ignoring ONE label — the classic: fraction of CPU in user mode per core. `on(label)` is the mirror that picks the label.' },
  { code: 'http_requests_total * on(instance) group_left(version) app_build_info', cat: 'ops',
    pt: '`group_left(extra)` adiciona labels do vetor da direita no resultado — juntar `version` da build_info com os contadores sem criar produto cartesiano.',
    en: '`group_left(extra)` brings labels from the right vector into the result — attaching `version` from build_info to counters without a cartesian product.' },

  // ─── Agregações ──────────────────────────────────────────────────────
  { code: 'sum(rate(http_requests_total[5m]))', cat: 'agg',
    pt: '`sum` colapsa todas as séries num só total. AGREGUE DEPOIS do `rate` — `rate(sum(...))` não existe e não faz sentido.',
    en: '`sum` collapses all series into a single total. AGGREGATE AFTER `rate` — `rate(sum(...))` does not exist nor make sense.' },
  { code: 'sum by (job) (rate(http_requests_total[5m]))', cat: 'agg',
    pt: '`by (labels)` agrupa e mantém APENAS os labels listados — o total por job. É o agregador mais usado em dashboards.',
    en: '`by (labels)` groups and keeps ONLY the listed labels — the total per job. The most used aggregator in dashboards.' },
  { code: 'sum without (instance) (rate(http_requests_total[5m]))', cat: 'agg',
    pt: '`without (labels)` agrupa mantendo TUDO menos os labels citados — a alternativa "destrutiva" que sobrevive a labels novos.',
    en: '`without (labels)` groups keeping EVERYTHING except the listed labels — the "destructive" alternative that survives new labels.' },
  { code: 'avg by (job) (rate(http_requests_total[5m]))', cat: 'agg',
    pt: '`avg` tira a média — o certo pra quando cada instância é um consumidor independente e o total engana.',
    en: '`avg` takes the mean — the right one when every instance is an independent consumer and the total lies.' },
  { code: 'topk(5, sum by (handler) (rate(http_requests_total[5m])))', cat: 'agg',
    pt: '`topk(N, ...)` devolve as N maiores séries (e `bottomk` as menores) — o "quem está consumindo mais" pro alerta certo.',
    en: '`topk(N, ...)` returns the N largest series (and `bottomk` the smallest) — "who is consuming the most" for the right alert.' },
  { code: 'count by (job) (up == 1)', cat: 'agg',
    pt: '`count` conta quantas séries satisfazem — aqui, instâncias saudáveis por job. Selecionar + comparador vira contagem condicional.',
    en: '`count` counts how many series satisfy — here: healthy instances per job. Selector + comparison becomes a conditional count.' },
  { code: 'count_values("version", app_build_info)', cat: 'agg',
    pt: 'Vira uma série por valor DISTINTO do label selecionado, com a contagem de cada um — distribuição por versão instalada.',
    en: 'Creates one series per DISTINCT value of the selected label, with the count of each — an installed-version distribution.' },
  { code: 'quantile(0.95, http_request_duration_seconds)', cat: 'agg',
    pt: 'Percentil sobre um summary/gauge. Pra precisão real com histogramas, prefira `histogram_quantile` sobre os buckets.',
    en: 'Quantile over a summary/gauge. For real precision with histograms, prefer `histogram_quantile` over the buckets.' },
  { code: 'stddev by (job) (rate(http_requests_total[5m]))', cat: 'agg',
    pt: '`stddev`/`stdvar` medem o espalhamento entre as séries — "as instâncias estão equilibradas?" vira uma linha só.',
    en: '`stddev`/`stdvar` measure the spread across series — "are my instances balanced?" becomes a single line.' },

  // ─── Funções ─────────────────────────────────────────────────────────
  { code: 'rate(http_requests_total[5m])', cat: 'fun',
    pt: 'Taxa média por segundo numa janela, corrigindo resets de contador. Suaviza; não reage ao último sample. O padrão pra contadores em dashboards.',
    en: 'Average per-second rate over a window, correcting counter resets. Smooths; does not react to the last sample. The default for counters in dashboards.' },
  { code: 'irate(http_requests_total[5m])', cat: 'fun',
    pt: '`irate` usa só os DOIS últimos samples — reage na hora, mas dança com gaps de scrape e resets. Bom pra investigar picos, ruim pra alertas longos.',
    en: '`irate` uses only the LAST TWO samples — reacts instantly, but dances with scrape gaps and resets. Good for spike forensics, bad for long alerts.' },
  { code: 'increase(http_requests_total[5m])', cat: 'fun',
    pt: 'Quanto o contador subiu na janela (rate × janela), corrigindo resets — "quantos eventos aconteceram nos últimos 5 minutos".',
    en: 'How much the counter grew over the window (rate × window), correcting resets — "how many events happened in the last 5 minutes".' },
  { code: 'delta(node_memory_MemFree_bytes[5m])', cat: 'fun',
    pt: 'Mudança entre o primeiro e o último valor de um GAUGE na janela. Em contador, use `increase`/`rate` — `delta` não trata reset.',
    en: 'Change between the first and last value of a GAUGE over the window. On a counter use `increase`/`rate` — `delta` does not handle resets.' },
  { code: '(node_filesystem_size_bytes - node_filesystem_free_bytes) - predict_linear(node_filesystem_free_bytes[1h], 3600 * 24)', cat: 'fun',
    pt: '`predict_linear(series[hist], segundos)` projeta a reta de regressão no futuro — o alerta clássico de "disco cheio amanhã".',
    en: '`predict_linear(series[hist], seconds)` projects the regression line into the future — the classic "disk full tomorrow" alert.' },
  { code: 'histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))', cat: 'fun',
    pt: 'Percentil por BUCKETS de histograma: precisa `sum by (le)` sobre o rate dos `_bucket` — o único jeito acurado de p95/p99 de latência.',
    en: 'Histogram-bucket quantile: requires `sum by (le)` over the rate of the `_bucket` series — the only accurate way to p95/p99 latency.' },
  { code: 'sum_over_time(rate(http_requests_total[5m])[1h:])', cat: 'fun',
    pt: 'Subquery: reavalia o `rate(...[5m])` a cada passo da janela (aqui 1h) e soma — o padrão pra "média da vazão na última hora".',
    en: 'Subquery: re-evaluates `rate(...[5m])` at every step of the window (here 1h) and sums — the pattern for "hourly throughput average".' },
  { code: 'changes(up[1h])', cat: 'fun',
    pt: 'Quantas vezes o valor mudou na janela — uma instância "ligando e desligando" mostra flapping alto mesmo com `up == 1` agora.',
    en: 'How many times the value changed over the window — a restart-looping instance shows high flapping even while `up == 1` now.' },
  { code: 'last_over_time(up[30m])', cat: 'fun',
    pt: 'Última amostra da janela — o `_over_time` mais banal, mas essencial pra ignorar buracos de coleta e ler o estado mais recente.',
    en: 'The last sample of the window — the most mundane `_over_time`, but essential to ignore scrape gaps and read the latest state.' },
  { code: 'quantile_over_time(0.95, http_request_latency_ms[5m])', cat: 'fun',
    pt: 'Percentil sobre os samples da janela (uma série só) — distribuição por período sem precisar de histograma/buckets.',
    en: 'Quantile over the window samples (a single series) — per-period distribution without needing histograms/buckets.' },
  { code: 'label_replace(up, "dc", "$1", "instance", "(.*):.*")', cat: 'fun',
    pt: 'Copia um label extraído por regex em outro — aqui, a parte antes dos `:` da `instance` vira `dc`. Regex é RE2, com grupos `$1`.',
    en: 'Copies a label extracted by regex into another — here, the part before `:` in `instance` becomes `dc`. Regex is RE2 with `$1` capture groups.' },
  { code: 'sort(sum by (job) (rate(http_requests_total[5m])))', cat: 'fun',
    pt: '`sort`/`sort_desc` ordenam o vetor pelo valor — o vizinho de toda tabela ordenada por consumo.',
    en: '`sort`/`sort_desc` order the vector by value — the friend of every table sorted by consumption.' },
  { code: 'ceil(rate(http_requests_total[5m]) * 60)', cat: 'fun',
    pt: 'Funções numéricas `abs`/`ceil`/`floor`/`round(v, 0.01)`/`clamp_max`/`clamp_min` — arredondar vazão pra "req/min" legível.',
    en: 'Numeric functions `abs`/`ceil`/`floor`/`round(v, 0.01)`/`clamp_max`/`clamp_min` — rounding throughput into readable "req/min".' },
  { code: 'time() - (1000 * node_time_seconds)', cat: 'fun',
    pt: '`time()` é o relógio do servidor (segundos UNIX) e `timestamp(series)` é o horário da última amostra — drift de clock vira métrica mensurável.',
    en: '`time()` is the server clock (UNIX seconds) and `timestamp(series)` is the time of the last sample — clock drift becomes measurable.' },
  { code: 'absent(up{job="worker"})', cat: 'fun',
    pt: '`absent(expr)` devolve `1` quando o vetor é vazio — "essa série deveria existir e não existe" em forma de alerta.',
    en: '`absent(expr)` returns `1` when the vector is empty — "this series should exist and does not" turned into an alert.' },

  // ─── HTTP API ────────────────────────────────────────────────────────
  { code: "curl 'http://localhost:9090/api/v1/query?query=up'", cat: 'api',
    pt: 'Consulta instantânea padrão: `query` é a PromQL urlencoded. Resposta JSON com `resultType: vector` e a lista de séries.',
    en: 'Standard instant query: `query` is the URL-encoded PromQL. JSON response with `resultType: vector` and the series list.' },
  { code: "curl 'http://localhost:9090/api/v1/query_range?query=rate(http_requests_total[5m])&start=1600000000&end=1600003600&step=60'", cat: 'api',
    pt: 'Consulta por intervalo: `start`/`end` em UNIX e `step` em segundos — o que o gráfico do UI pede por baixo dos panos.',
    en: 'Range query: `start`/`end` in UNIX and `step` in seconds — what the UI graph requests under the hood.' },
  { code: "curl -G http://localhost:9090/api/v1/query --data-urlencode 'query=sum by (job) (rate(http_requests_total[5m]))'", cat: 'api',
    pt: 'PromQL tem `{...}` e aspas que bagunçam a URL — o jeito certo é `-G` com `--data-urlencode`, nunca montar a URL na mão.',
    en: 'PromQL has `{...}` and quotes that break URLs — the right way is `-G` with `--data-urlencode`, never hand-building the URL.' },
  { code: "curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health}'", cat: 'api',
    pt: 'Estado de TODOS os alvos de scrape — quem está `up`, `down` ou `unknown`, último erro e horário do scrape, pra depurar descoberta.',
    en: 'State of EVERY scrape target — who is `up`, `down` or `unknown`, last error and scrape time — to debug discovery.' },
  { code: "curl -s http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | {name: .name, type}?'", cat: 'api',
    pt: 'Rules carregadas e avaliadas no momento — o `?` ignora regras sem nome, e o campo `health` diz se o expr quebrou.',
    en: 'Rules currently loaded and evaluated — `?` skips rules without a name, and the `health` field tells if an expr broke.' },
  { code: "curl -s http://localhost:9090/api/v1/status/config | jq '.data.yaml | fromjson'", cat: 'api',
    pt: 'O config ativo em formato YAML — resolver o "mas isso aqui eu já tinha configurado" sem SSH no arquivo.',
    en: 'The active config in YAML — settling "but I had already configured that" without SSHing into the file.' },
  { code: "curl -s http://localhost:9090/api/v1/label/__name__/values | jq '.data'", cat: 'api',
    pt: 'Lista todos os nomes de métrica existentes — e o ponto de partida de qualquer exploração guiada por API.',
    en: 'Lists every existing metric name — and the starting point of any API-driven exploration.' },
  { code: "echo 'publish_duration{kind=\"manual\"} 12.3' | curl --data-binary @- http://localhost:9091/metrics/job/cron/job_id/7", cat: 'api',
    pt: 'Pushgateway: empurra uma métrica manual via POST pro caminho `/metrics/job/<nome>[/label/<valor>]`. Só pra jobs efêmeros que não vivem até o scrape.',
    en: 'Pushgateway: POSTs a manual metric to `/metrics/job/<name>[/label/<value>]`. Only for ephemeral jobs that do not live until the next scrape.' },

  // ─── Regras & Alerting ───────────────────────────────────────────────
  { code: 'groups:\n  - name: cpu.rules\n    rules:\n      - record: instance:node_cpu_usage:rate5m\n        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)', cat: 'rules',
    pt: 'Recording rule: pré-calculam um `expr` caro num nome novo (`instance:node_cpu_usage:rate5m`), reavaliado a cada `evaluation_interval`. A convenção de nome é `<level>:<metric>:<op>`.',
    en: 'Recording rule: pre-compute an expensive `expr` under a new name (`instance:node_cpu_usage:rate5m`), re-evaluated every `evaluation_interval`. Name convention is `<level>:<metric>:<op>`.' },
  { code: "groups:\n  - name: alerts\n    rules:\n      - alert: InstanceDown\n        expr: up == 0\n        for: 5m\n        labels:\n          severity: critical\n        annotations:\n          summary: '{{ $labels.instance }} indisponível'\n          description: 'O alvo {{ $labels.job }}/{{ $labels.instance }} não responde há 5 minutos.'", cat: 'rules',
    pt: 'Alerting rule: `expr` condição, `for` exige que ela persista N minutos antes de virar alerta, `labels` e `annotations` carregam contexto com templates `{{ $labels... }}` e `{{ $value }}`.',
    en: 'Alerting rule: `expr` is the condition, `for` requires it to persist N minutes before firing, `labels` and `annotations` carry context templated with `{{ $labels... }}` and `{{ $value }}`.' },
  { code: "groups:\n  - name: errors\n    rules:\n      - alert: HighErrorRate\n        expr: 'rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) > 0.05'\n        for: 10m\n        annotations:\n          summary: 'Taxa de erro acima de 5%'", cat: 'rules',
    pt: 'Alerta SEMPRE em cima de `rate` (nunca do contador cru): percentual de 5xx sobre o total. O `for: 10m` segura o ruído de picos curtos.',
    en: 'Always alert on a `rate` (never the raw counter): a share of 5xx over the total. The `for: 10m` holds off short spike noise.' },
  { code: 'route:\n  receiver: default\n  group_by: [alertname]\nreceivers:\n  - name: default\n    email_configs:\n      - to: oncall@example.com', cat: 'rules',
    pt: 'Alertmanager mínimo: `route` decide pra onde cada alerta vai e `group_by` agrupa os mesmos alertas num silêncio/ticket só. `receivers` tem e-mail, webhook, Slack, PagerDuty etc.',
    en: 'Minimal Alertmanager: `route` decides where each alert goes and `group_by` groups identical alerts into one silence/ticket. `receivers` include e-mail, webhook, Slack, PagerDuty, etc.' },
  { code: "groups:\n  - name: capacity\n    rules:\n      - record: node:disk_free_percent:ratio\n        expr: '(1 - node_filesystem_free_bytes / node_filesystem_size_bytes) > 0.85'\n        labels:\n          instance: '{{ $labels.instance }}'", cat: 'rules',
    pt: 'Regra com `record` + filtro embutido: pré-filtra o que interessa (aqui, discos acima de 85%) pra gravar só as séries relevantes e poupar o servidor.',
    en: 'A rule with `record` + embedded filter: pre-filters what matters (here, disks above 85%) to store only the relevant series and spare the server.' },
  { code: 'promtool tsdb dump --metrics /var/lib/prometheus | head', cat: 'rules',
    pt: 'Bônus de manutenção: inspecionar o TSDB direto do disco — e `promtool tsdb list`/`analyze` ajudam a ver tamanho e cardinalidade por métrica.',
    en: 'Maintenance bonus: inspect the TSDB straight from disk — and `promtool tsdb list`/`analyze` help see size and cardinality per metric.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Prometheus / PromQL',
    intro: (
      <>
        O monitor que todo mundo consulta no meio do incidente — do{' '}
        <Text code>prometheus.yml</Text> e <Text code>promtool</Text> à{' '}
        <Text code>PromQL</Text> (seletores, agregações, <Text code>rate</Text>,
        histogramas), passando pela <Text code>HTTP API</Text> e pelas regras
        de alerta. Tudo que a memória falha na hora H.
      </>
    ),
    search: 'Pesquisar por comando ou descrição...',
    all: 'Todos',
    empty: 'Nada encontrado. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega quem está começando',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Regex do PromQL é sempre totalmente ancorado.</Text>{' '}
          <Text code>{'{job=~"api"}'}</Text> casa somente a string exata{' '}
          <Text code>api</Text> — nunca <Text code>api-1</Text>. Quer prefixo,
          escreva <Text code>api.*</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Agregue DEPOIS do rate.</Text>{' '}
          <Text code>sum(rate(x[5m]))</Text> é o correto;{' '}
          <Text code>rate(sum(x)[5m])</Text> não existe como operação sensata.
          E <Text code>rate()</Text> só existe pra contadores (counter) — em
          gauge você usa o valor cru ou <Text code>deriv()</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Contador reseta e tudo bem.</Text>{' '}
          <Text code>rate</Text>/<Text code>increase</Text> corrigem resets
          sozinhos (o contador zera no restart).{' '}
          <Text code>delta</Text> NÃO corrige — use-o só em gauges.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Operação binária casa pelos labels.</Text> Só opera em
          séries com o MESMO conjunto de labels; quando os conjuntos diferem
          você precisa de <Text code>on()</Text>/
          <Text code>ignoring()</Text> e, se um lado tem mais labels, de{' '}
          <Text code>group_left</Text>/<Text code>group_right</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Alerta sempre em cima de rate.</Text> Condição num
          contador cru dispara com qualquer incremento; normalize com{' '}
          <Text code>rate(x[5m])</Text> e use <Text code>for</Text> pra não
          apagar no meio da madrugada por um pico de 10 segundos.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Cardinality mata o servidor.</Text> Todo label com valor
          único vira uma série a mais. Agrupar por <Text code>uuid</Text>,{' '}
          <Text code>request.path</Text> ou <Text code>email</Text> em séries
          de alta frequência é o caminho mais rápido pra OOM. Confira sempre
          com <Text code>count by (job) ({'{__name__=~".+"}'})</Text>.
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
    title: 'Prometheus / PromQL Cheat Sheet',
    intro: (
      <>
        The monitoring stack everyone queries mid-incident — from the{' '}
        <Text code>prometheus.yml</Text> and <Text code>promtool</Text> to{' '}
        <Text code>PromQL</Text> (selectors, aggregations, <Text code>rate</Text>,
        histograms), plus the <Text code>HTTP API</Text> and alerting rules.
        Everything memory fails to recall at the critical moment.
      </>
    ),
    search: 'Search by command or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>PromQL regex is always fully anchored.</Text>{' '}
          <Text code>{'{job=~"api"}'}</Text> matches only the exact string{' '}
          <Text code>api</Text> — never <Text code>api-1</Text>. Want a prefix,
          write <Text code>api.*</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Aggregate AFTER the rate.</Text>{' '}
          <Text code>sum(rate(x[5m]))</Text> is correct;{' '}
          <Text code>rate(sum(x)[5m])</Text> is not a sensible operation. And{' '}
          <Text code>rate()</Text> only exists for counters — on a gauge use
          the raw value or <Text code>deriv()</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Counters reset and that is fine.</Text>{' '}
          <Text code>rate</Text>/<Text code>increase</Text> correct resets on
          their own (the counter zeroes on restart).{' '}
          <Text code>delta</Text> does NOT correct — use it on gauges only.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Binary ops match by labels.</Text> They only operate on
          series with the SAME label set; when the sets differ you need{' '}
          <Text code>on()</Text>/<Text code>ignoring()</Text> and, if one side
          carries extra labels,{' '}
          <Text code>group_left</Text>/<Text code>group_right</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Always alert on a rate.</Text> A condition on a raw
          counter fires on any increment; normalize with{' '}
          <Text code>rate(x[5m])</Text> and use <Text code>for</Text> so you
          are not paged at 3 AM by a 10-second spike.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Cardinality kills the server.</Text> Every label with a
          unique value becomes one more series. Grouping by <Text code>uuid</Text>,{' '}
          <Text code>request.path</Text> or <Text code>email</Text> on
          high-frequency series is the fastest road to OOM. Always confirm with{' '}
          <Text code>count by (job) ({'{__name__=~".+"}'})</Text>.
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

export default function PrometheusCheatsheetPage() {
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
    const header = '# Prometheus / PromQL (cheat sheet)\n\n'
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
      <Title level={2}><LineChartOutlined /> {t.title}</Title>
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
          <Button size="small" icon={<ReadOutlined />} onClick={copyMarkdown}>
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
