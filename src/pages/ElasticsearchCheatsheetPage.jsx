import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined, DatabaseOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['index', 'query', 'bool', 'fulltext', 'agg', 'map', 'bulk', 'mgmt']

const CATEGORY_COLOR = {
  index: 'blue',
  query: 'geekblue',
  bool: 'cyan',
  fulltext: 'purple',
  agg: 'magenta',
  map: 'gold',
  bulk: 'orange',
  mgmt: 'volcano',
}

const labelOf = {
  index: { pt: 'Índices & documentos (CRUD)', en: 'Indices & documents (CRUD)' },
  query: { pt: 'Query DSL: term & match', en: 'Query DSL: term & match' },
  bool: { pt: 'Bool & composição de queries', en: 'Bool & query composition' },
  fulltext: { pt: 'Full-text & análise de texto', en: 'Full-text & text analysis' },
  agg: { pt: 'Aggregations', en: 'Aggregations' },
  map: { pt: 'Mapping & análise', en: 'Mapping & analysis' },
  bulk: { pt: 'Bulk, paginação & scroll', en: 'Bulk, pagination & scroll' },
  mgmt: { pt: 'Admin & cluster', en: 'Admin & cluster' },
}

const ITEMS = [
  // ─── Índices & documentos (CRUD) ─────────────────────────────────────
  { code: `PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}`, cat: 'index',
    pt: 'Cria o índice com configurações próprias: `number_of_shards` distribui os dados entre os shards (não dá pra mudar depois) e `number_of_replicas` define as cópias de tolerância a falha.',
    en: 'Creates the index with its own settings: `number_of_shards` distributes data across shards (can\'t be changed later) and `number_of_replicas` defines the fault-tolerance copies.' },
  { code: `DELETE /products`, cat: 'index',
    pt: 'APAGA o índice inteiro — junto com todos os documentos e mapeamento. Não existe "lixeira" no Elasticsearch: é permanente.',
    en: 'DELETES the whole index — documents and mapping together. There is no "trash" in Elasticsearch: it is permanent.' },
  { code: `GET /_cat/indices?v`, cat: 'index',
    pt: 'Lista todos os índices com saúde, número de docs, tamanho e shards. O `?v` imprime o cabeçalho das colunas; `?format=json` retorna JSON em vez de tabela.',
    en: 'Lists all indices with health, doc count, size and shards. `?v` prints the column header; `?format=json` returns JSON instead of a table.' },
  { code: `POST /products/_doc
{
  "name": "Mouse sem fio",
  "price": 99.90,
  "in_stock": true
}`, cat: 'index',
    pt: 'Indexa um documento com `_id` gerado automaticamente. Retorna `_id`, `_index` e o `result: "created"`.',
    en: 'Indexes a document with an auto-generated `_id`. Returns `_id`, `_index` and `result: "created"`.' },
  { code: `PUT /products/_doc/1
{
  "name": "Teclado mecânico",
  "price": 399.00
}`, cat: 'index',
    pt: 'Indexa com `_id` explícito. Se o id já existir, SUBSTITUI o documento inteiro (sem mesclar campos) — equivalente a um "put" destrutivo.',
    en: 'Indexes with an explicit `_id`. If the id already exists, it REPLACES the whole document (no field merging) — a destructive "put".' },
  { code: `POST /products/_update/1
{
  "doc": { "price": 349.00 }
}`, cat: 'index',
    pt: 'Atualização PARCIAL via `doc`: só os campos passados mudam, o resto do documento permanece. Diferente do `PUT /_doc/1` que substitui.',
    en: 'PARTIAL update via `doc`: only the passed fields change, the rest of the document stays. Unlike `PUT /_doc/1`, which replaces.' },
  { code: `GET /products/_doc/1`, cat: 'index',
    pt: 'Busca o documento por `_id`. O `_source` traz o JSON original indexado; o `found: false` (HTTP 404) indica que não existe.',
    en: 'Fetches a document by `_id`. `_source` carries the original indexed JSON; `found: false` (HTTP 404) means it doesn\'t exist.' },
  { code: `DELETE /products/_doc/1`, cat: 'index',
    pt: 'Remove UM documento pelo `_id`. Remove apenas o doc, mantém índice e mapping.',
    en: 'Removes ONE document by `_id`. Only the doc is removed; index and mapping stay.' },
  { code: `POST /products/_bulk
{"index": {"_id": "2"}}
{"name": "Mousepad", "price": 49.90}
{"index": {"_id": "3"}}
{"name": "Webcam", "price": 299.00}
{"delete": {"_id": "1"}}`, cat: 'index',
    pt: 'Operações em LOTE num único request: uma linha de ação (`index`/`update`/`delete`) seguida da linha do documento. Formato NDJSON, cada linha termina com `\\n`.',
    en: 'BATCH operations in a single request: one action line (`index`/`update`/`delete`) followed by the document line. NDJSON format, each line ends with `\\n`.' },
  { code: `POST /products/_refresh`, cat: 'index',
    pt: 'Força o índice a ficar "visível" para busca agora. Por padrão os docs demoram ~1s (refresh interval) pra aparecer no `_search`.',
    en: 'Forces the index to become searchable now. By default docs take ~1s (refresh interval) to show up in `_search`.' },

  // ─── Query DSL: term & match ─────────────────────────────────────────
  { code: `GET /products/_search
{
  "query": { "match_all": {} },
  "size": 10
}`, cat: 'query',
    pt: 'A busca mais básica: devolve todos os documentos (padrão `size: 10`). Combinado com `sort` é o "SELECT * LIMIT 10" do ES.',
    en: 'The most basic search: returns all documents (default `size: 10`). Paired with `sort` it\'s the "SELECT * LIMIT 10" of ES.' },
  { code: `GET /products/_search
{
  "query": { "term": { "status": "active" } }
}`, cat: 'query',
    pt: '`term` casa um valor EXATO e não analisa a query — funciona com campos `keyword` ou numéricos. Em campo `text` quase nunca casa (veja as dicas).',
    en: '`term` matches an EXACT value and does not analyze the query — it works with `keyword` or numeric fields. On a `text` field it almost never matches (see tips).' },
  { code: `GET /products/_search
{
  "query": { "match": { "name": "mouse sem fio" } }
}`, cat: 'query',
    pt: '`match` ANALISA o texto da query e busca cada termo — é o "busca por relevância" em campos `text`. Cada termo vira uma OR ponderada por score.',
    en: '`match` ANALYZES the query text and searches each term — the "relevance search" for `text` fields. Each term becomes a scored OR.' },
  { code: `GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "teclado",
      "fields": ["name", "description"]
    }
  }
}`, cat: 'query',
    pt: 'Busca o mesmo texto em VÁRIOS campos ao mesmo tempo — o "procura em tudo" sem montar vários `match` manualmente.',
    en: 'Searches the same text across MULTIPLE fields at once — the "search everywhere" without hand-building several `match` clauses.' },
  { code: `GET /products/_search
{
  "query": { "range": { "price": { "gte": 50, "lt": 300 } } }
}`, cat: 'query',
    pt: 'Faixa de valores: `gt`/`gte`/`lt`/`lte` para numéricos, datas e strings. Também aceita `format` para datas ISO customizadas.',
    en: 'Value range: `gt`/`gte`/`lt`/`lte` for numerics, dates and strings. Also accepts `format` for custom ISO dates.' },
  { code: `GET /products/_search
{
  "query": { "exists": { "field": "description" } }
}`, cat: 'query',
    pt: '`exists` acha docs onde o campo EXISTE e não é `null` (ou array vazio). A negação (`!exists`) é um `bool.must_not` — útil pra soft-delete.',
    en: '`exists` finds docs where the field EXISTS and is not `null` (or an empty array). The negation (`!exists`) is a `bool.must_not` — handy for soft-delete.' },
  { code: `GET /products/_search
{
  "query": { "ids": { "values": ["1", "2", "3"] } }
}`, cat: 'query',
    pt: 'Busca por uma lista de `_id` de uma vez — o "WHERE id IN (...)" do Elasticsearch.',
    en: 'Searches by a list of `_id` at once — Elasticsearch\'s "WHERE id IN (...)".' },
  { code: `GET /products/_search
{
  "_source": ["name", "price"],
  "sort": [{ "price": "desc" }],
  "query": { "match_all": {} }
}`, cat: 'query',
    pt: 'Filtra quais campos do `_source` voltam na resposta e ordena por um campo. `sort` exige `fielddata`/`doc_values` — o motivo de não ordenar campo `text` puro.',
    en: 'Filters which `_source` fields come back and sorts by a field. `sort` requires `fielddata`/`doc_values` — the reason you can\'t sort a plain `text` field.' },

  // ─── Bool & composição ───────────────────────────────────────────────
  { code: `GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "mouse" } },
        { "range": { "price": { "gte": 50 } } }
      ]
    }
  }
}`, cat: 'bool',
    pt: '`must` é o AND: TODAS as cláusulas precisam casar e contribuem pro score. O bloco `bool` é a base de qualquer query composta.',
    en: '`must` is the AND: ALL clauses must match and they contribute to the score. The `bool` block is the base of any compound query.' },
  { code: `GET /products/_search
{
  "query": {
    "bool": {
      "must": [{ "match": { "name": "mouse" } }],
      "filter": [
        { "term": { "status": "active" } },
        { "range": { "price": { "lte": 200 } } }
      ]
    }
  }
}`, cat: 'bool',
    pt: '`filter` restringe o resultado SEM afetar o score (binário, só casa ou não) e é CACHEÁVEL pelo servidor — ponha aqui tudo que não é relevância.',
    en: '`filter` narrows results WITHOUT affecting the score (binary, match or not) and is cacheable by the server — put everything that isn\'t relevance here.' },
  { code: `GET /products/_search
{
  "query": {
    "bool": {
      "should": [
        { "match": { "name": "mouse" } },
        { "match": { "tags": "wireless" } }
      ],
      "minimum_should_match": 1
    }
  }
}`, cat: 'bool',
    pt: '`should` é o OR ponderado. Sozinho num `bool` ele exige `minimum_should_match: 1` pra casar; dentro de um `must` vira "bônus de relevância".',
    en: '`should` is the scored OR. Alone in a `bool` it requires `minimum_should_match: 1` to match; inside a `must` it becomes a "relevance bonus".' },
  { code: `GET /products/_search
{
  "query": {
    "bool": {
      "must": [{ "match_all": {} }],
      "must_not": [{ "term": { "status": "blocked" } }]
    }
  }
}`, cat: 'bool',
    pt: '`must_not` EXCLUI documentos (é um filtro com score 0). Tudo que não for `blocked` passa — o "NOT" do SQL.',
    en: '`must_not` EXCLUDES documents (it\'s a zero-score filter). Everything that isn\'t `blocked` passes — the SQL "NOT".' },
  { code: `GET /products/_search
{
  "query": {
    "bool": {
      "should": [
        { "match": { "name": { "query": "mouse", "boost": 3 } } },
        { "match": { "description": "mouse" } }
      ],
      "minimum_should_match": 1
    }
  }
}`, cat: 'bool',
    pt: '`boost` pondera cláusulas: um match no `name` com boost 3 vale mais que no `description`. O jeito de priorizar campo no score.',
    en: '`boost` weights clauses: a `name` match with boost 3 outweighs a `description` one. The way to prioritize a field in the score.' },

  // ─── Full-text & análise de texto ────────────────────────────────────
  { code: `GET /products/_search
{
  "query": { "match_phrase": { "description": "sem fio" } }
}`, cat: 'fulltext',
    pt: '`match_phrase` exige os termos NA ORDEM e adjacentes — busca por frase exata, não por termos soltos. Inclui `slop` pra tolerar distância entre eles.',
    en: '`match_phrase` requires the terms IN ORDER and adjacent — exact phrase search, not loose terms. Supports `slop` to tolerate distance between them.' },
  { code: `GET /products/_search
{
  "query": { "match_phrase_prefix": { "name": "tecla" } }
}`, cat: 'fulltext',
    pt: 'Frase com o ÚLTIMO termo como prefixo — o padrão clássico de autocomplete/typeahead por tipo de campo `text`.',
    en: 'Phrase with the LAST term as a prefix — the classic autocomplete/typeahead pattern for `text` fields.' },
  { code: `GET /products/_search
{
  "query": { "prefix": { "sku": "MOU" } }
}`, cat: 'fulltext',
    pt: '`prefix` casa por início do termo em campo `keyword` — busca prefixada que usa índice de forma eficiente (sem analisar).',
    en: '`prefix` matches the start of a term on a `keyword` field — an indexed prefix search (no analysis applied).' },
  { code: `GET /products/_search
{
  "query": { "wildcard": { "sku": "MOU-*" } }
}`, cat: 'fulltext',
    pt: '`wildcard` usa `*` e `?` em qualquer posição do termo. Cuidado: `*` no INÍCIO da string é lento (não consegue usar índice).',
    en: '`wildcard` uses `*` and `?` anywhere in the term. Caveat: `*` at the START of the string is slow (can\'t use the index).' },
  { code: `GET /products/_search
{
  "query": { "fuzzy": { "name": "tclado" } }
}`, cat: 'fulltext',
    pt: '`fuzzy` tolera erros de digitação (transposição/omissão de letras) com fuzziness implícito — "teclado" vs "tclado". Ótimo pra autocomplete tolerante.',
    en: '`fuzzy` tolerates typos (transposed/missing letters) with implicit fuzziness — "keybord" vs "keyboard". Great for tolerant autocomplete.' },
  { code: `GET /products/_search
{
  "query": {
    "query_string": {
      "query": "name:mouse AND price:[50 TO 200]",
      "default_field": "name"
    }
  }
}`, cat: 'fulltext',
    pt: '`query_string` parseia a sintaxe Lucene completa (`AND`, `OR`, `name:valor`, `[50 TO 200]`, `-termo`...). Poderoso, mas arriscado com input de usuário.',
    en: '`query_string` parses the full Lucene syntax (`AND`, `OR`, `field:value`, `[50 TO 200]`, `-term`...). Powerful, but risky with user input.' },
  { code: `GET /products/_search
{
  "query": {
    "simple_query_string": {
      "query": "mouse teclado -quebrado",
      "fields": ["name", "description"]
    }
  }
}`, cat: 'fulltext',
    pt: '`simple_query_string` é a versão "segura" do query_string: ignora erros de sintaxe em vez de lançar exceção — o certo pra barra de busca de usuário.',
    en: '`simple_query_string` is the "safe" version of query_string: it ignores syntax errors instead of throwing — the right choice for a user search bar.' },
  { code: `GET /products/_search
{
  "query": { "regexp": { "sku": "MOU-[0-9]{4}" } }
}`, cat: 'fulltext',
    pt: '`regexp` busca por expressão regular no termo indexado. Use com moderação: regex solto é caro e não escala igual a termo prefixado.',
    en: '`regexp` searches by regular expression over the indexed term. Use sparingly: loose regex is expensive and doesn\'t scale like a prefixed term.' },

  // ─── Aggregations ────────────────────────────────────────────────────
  { code: `GET /products/_search
{
  "size": 0,
  "aggs": {
    "por_categoria": {
      "terms": { "field": "category.keyword", "size": 10 }
    }
  }
}`, cat: 'agg',
    pt: 'Agregação `terms`: agrupa e conta por valor — o "GROUP BY" do ES. `size: 0` na busca descarta os hits e devolve só as agregações. Campo `text` exige o subcampo `.keyword`.',
    en: '`terms` aggregation: groups and counts by value — the ES "GROUP BY". `size: 0` drops hits and returns only aggregations. `text` fields need the `.keyword` subfield.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "preco_medio": { "avg": { "field": "total" } },
    "soma": { "sum": { "field": "total" } },
    "menor": { "min": { "field": "total" } },
    "maior": { "max": { "field": "total" } }
  }
}`, cat: 'agg',
    pt: 'Métricas simples: `avg`, `sum`, `min`, `max` — funções numéricas direto no campo. Várias agregações podem coexistir no mesmo request.',
    en: 'Simple metrics: `avg`, `sum`, `min`, `max` — numeric functions straight on the field. Multiple aggregations can coexist in one request.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "resumo": { "stats": { "field": "total" } }
  }
}`, cat: 'agg',
    pt: '`stats` devolve contagem, min, max, média e soma num único bloco — o resumo descritivo de uma tacada.',
    en: '`stats` returns count, min, max, avg and sum in a single block — the descriptive summary in one shot.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "por_dia": {
      "date_histogram": { "field": "created_at", "calendar_interval": "day" }
    }
  }
}`, cat: 'agg',
    pt: '`date_histogram` agrupa por intervalos de tempo (`day`, `month`, `week`...) — a base de "pedidos por dia" e de qualquer gráfico de série temporal.',
    en: '`date_histogram` buckets by time intervals (`day`, `month`, `week`...) — the basis of "orders per day" and any time-series chart.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "latencia": { "percentiles": { "field": "latency_ms", "percents": [50, 95, 99] } }
  }
}`, cat: 'agg',
    pt: '`percentiles` calcula percentis do campo (p50/p95/p99...) — o jeito de responder "e a latência do 99º percentil?" sem exportar nada.',
    en: '`percentiles` computes field percentiles (p50/p95/p99...) — the way to answer "what\'s the 99th-percentile latency?" without exporting anything.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "clientes_unicos": { "cardinality": { "field": "customer_id" } }
  }
}`, cat: 'agg',
    pt: '`cardinality` estima a contagem de valores DISTINTOS — o "COUNT DISTINCT" do ES, com aproximação (HyperLogLog) para escalar.',
    en: '`cardinality` estimates the count of DISTINCT values — the ES "COUNT DISTINCT", with approximation (HyperLogLog) for scalability.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "total_registros": { "value_count": { "field": "total" } }
  }
}`, cat: 'agg',
    pt: '`value_count` conta quantos documentos têm valor NÃO nulo no campo — o par perfeito pra `avg` quando você quer saber o denominador.',
    en: '`value_count` counts how many documents have a NON-NULL value in the field — the perfect pair for `avg` when you want to know the denominator.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "pedidos_altos": {
      "filter": { "range": { "total": { "gte": 1000 } } },
      "aggs": { "soma": { "sum": { "field": "total" } } }
    }
  }
}`, cat: 'agg',
    pt: 'Agregação `filter` restringe o escopo da sub-agregação — "soma só dos pedidos caros", sem sair do mundo das agregações.',
    en: '`filter` aggregation narrows the scope of a sub-aggregation — "sum only expensive orders", without leaving the aggregation world.' },
  { code: `GET /orders/_search
{
  "size": 0,
  "aggs": {
    "por_status": {
      "terms": { "field": "status" },
      "aggs": {
        "amostra": { "top_hits": { "size": 1, "_source": ["order_id", "total"] } }
      }
    }
  }
}`, cat: 'agg',
    pt: '`top_hits` anexa documentos de exemplo dentro de cada bucket — "o maior pedido de cada status" etc. Agregação aninhada dentro de outra.',
    en: '`top_hits` attaches sample documents inside each bucket — "the biggest order per status" etc. An aggregation nested inside another.' },

  // ─── Mapping & análise ───────────────────────────────────────────────
  { code: `GET /products/_mapping`, cat: 'map',
    pt: 'Mostra o mapeamento atual (tipos de cada campo). O ES cria o mapping AUTOMATICAMENTE (dynamic) no primeiro documento indexado — e corrigir depois exige reindex.',
    en: 'Shows the current mapping (types of each field). ES creates the mapping AUTOMATICALLY (dynamic) on the first indexed doc — fixing it later requires a reindex.' },
  { code: `PUT /products
{
  "mappings": {
    "properties": {
      "name": { "type": "text" },
      "sku": { "type": "keyword" },
      "price": { "type": "float" },
      "created_at": { "type": "date" }
    }
  }
}`, cat: 'map',
    pt: 'Mapping EXPLÍCITO: define o tipo de cada campo antes de indexar. `text` é analisado (busca por relevância); `keyword` guarda o termo exato pra `term`/`agg`/`sort`.',
    en: 'EXPLICIT mapping: defines each field\'s type before indexing. `text` is analyzed (relevance search); `keyword` stores the exact term for `term`/`agg`/`sort`.' },
  { code: `POST /_analyze
{
  "analyzer": "standard",
  "text": "Mouse sem Fio 2.4GHz"
}`, cat: 'map',
    pt: 'Testa como um texto será quebrado pelo analyzer: devolve os TOKENS gerados. O primeiro passo pra entender por que "não acho" um termo.',
    en: 'Tests how a text will be split by an analyzer: returns the generated TOKENS. The first step to understand why a term "isn\'t found".' },
  { code: `PUT /posts
{
  "settings": {
    "analysis": {
      "analyzer": {
        "meu_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "body": { "type": "text", "analyzer": "meu_analyzer" }
    }
  }
}`, cat: 'map',
    pt: 'Analyzer CUSTOM: encadeia tokenizer + filtros. `lowercase` normaliza maiúsculas e `asciifolding` converte acentos — o par que salva busca em português.',
    en: 'CUSTOM analyzer: chains a tokenizer + filters. `lowercase` normalizes case and `asciifolding` converts accents — the pair that saves Portuguese search.' },
  { code: `PUT /products/_mapping
{
  "properties": {
    "name": {
      "type": "text",
      "fields": {
        "keyword": { "type": "keyword", "ignore_above": 256 }
      }
    }
  }
}`, cat: 'map',
    pt: 'Multi-campo: o mesmo `name` vira `text` (pra busca) E `name.keyword` (pra term/agg/sort). `ignore_above` evita indexar strings gigantes no subcampo.',
    en: 'Multi-field: the same `name` becomes `text` (for search) AND `name.keyword` (for term/agg/sort). `ignore_above` skips huge strings in the subfield.' },
  { code: `PUT /products/_mapping
{
  "properties": {
    "internal_note": { "type": "text", "index": false },
    "last_seen": { "type": "date", "doc_values": false }
  }
}`, cat: 'map',
    pt: '`index: false` guarda o campo no `_source` mas NÃO o torna buscável (economia de disco/CPU). `doc_values: false` tira a capacidade de sort/agg — faça só se não precisar.',
    en: '`index: false` stores the field in `_source` but does NOT make it searchable (disk/CPU savings). `doc_values: false` disables sort/agg — only if you don\'t need them.' },
  { code: `PUT /index
{
  "mappings": { "dynamic": "strict" }
}`, cat: 'map',
    pt: '`dynamic: strict` REJEITA documentos com campos não mapeados (em vez de criar mapping sozinho). O guarda-costas de schemas que precisam ser explícitos.',
    en: '`dynamic: strict` REJECTS documents with unmapped fields (instead of auto-creating mapping). The guardrail for schemas that must stay explicit.' },

  // ─── Bulk, paginação & scroll ────────────────────────────────────────
  { code: `GET /logs/_search
{
  "from": 20,
  "size": 10,
  "query": { "match_all": {} }
}`, cat: 'bulk',
    pt: 'Paginação `from`/`size`. O limite é `from + size <= 10.000` por padrão — pra páginas profundas use `search_after` (abaixo).',
    en: '`from`/`size` pagination. The cap is `from + size <= 10,000` by default — for deep pages use `search_after` (below).' },
  { code: `GET /logs/_search
{
  "size": 100,
  "sort": [{ "@timestamp": "desc" }, { "_id": "asc" }],
  "search_after": ["2026-08-18T10:00:00.000Z", "abc123"]
}`, cat: 'bulk',
    pt: '`search_after` pagina para ALÉM dos 10.000: usa o último valor da `sort` como ponteiro. O `sort` precisa ser determinístico (adicionar `_id`).',
    en: '`search_after` pages BEYOND 10,000: it uses the last `sort` value as a pointer. The `sort` must be deterministic (add `_id`).' },
  { code: `POST /logs/_search?scroll=1m
{
  "size": 500,
  "query": { "match_all": {} }
}

POST /_search/scroll
{
  "scroll": "1m",
  "scroll_id": "SEU_SCROLL_ID"
}

DELETE /_search/scroll
{
  "scroll_id": ["SEU_SCROLL_ID"]
}`, cat: 'bulk',
    pt: '`scroll` mantém um SNAPSHOT do resultado pra varrer milhões de docs em lotes (export, reindex). Contexto caro — sempre feche com DELETE no fim.',
    en: '`scroll` keeps a SNAPSHOT of the result to sweep millions of docs in batches (export, reindex). Expensive context — always close with DELETE at the end.' },
  { code: `POST /logs/_delete_by_query
{
  "query": {
    "range": { "@timestamp": { "lt": "2025-01-01" } }
  }
}`, cat: 'bulk',
    pt: '`_delete_by_query` apaga todos os docs que casam a query — o "DELETE WHERE". Roda em lote no fundo; confirme o `deleted` no retorno.',
    en: '`_delete_by_query` deletes every doc matching the query — the "DELETE WHERE". Runs in background batches; check `deleted` in the response.' },
  { code: `POST /logs/_delete_by_query?conflicts=proceed
{
  "query": { "match_all": {} }
}`, cat: 'bulk',
    pt: 'Com escrita concorrente, o delete por query lança `version_conflict_engine_exception`. `?conflicts=proceed` pula os conflitos em vez de abortar o lote.',
    en: 'With concurrent writes, delete-by-query throws `version_conflict_engine_exception`. `?conflicts=proceed` skips conflicts instead of aborting the batch.' },
  { code: `POST /products/_update_by_query
{
  "query": { "term": { "in_stock": false } },
  "script": { "source": "ctx._source.price = ctx._source.price * 0.9" }
}`, cat: 'bulk',
    pt: '`_update_by_query` atualiza docs em massa com script Painless — o "UPDATE ... SET ... WHERE" do ES. O `ctx._source` dá acesso ao doc corrente.',
    en: '`_update_by_query` mass-updates docs with a Painless script — ES\'s "UPDATE ... SET ... WHERE". `ctx._source` accesses the current doc.' },
  { code: `POST /_reindex
{
  "source": { "index": "logs-2025" },
  "dest": { "index": "logs-2026" }
}`, cat: 'bulk',
    pt: '`_reindex` copia os dados de um índice pra outro — o caminho obrigatório pra mudar mapping/settings (não dá pra alterar tipo de campo no lugar).',
    en: '`_reindex` copies data from one index to another — the mandatory path to change mapping/settings (you can\'t alter a field type in place).' },

  // ─── Admin & cluster ─────────────────────────────────────────────────
  { code: `GET /_cluster/health?pretty`, cat: 'mgmt',
    pt: 'Saúde do cluster: `green` (tudo ok), `yellow` (shards primários ok, réplicas pendentes — ex.: single-node) e `red` (shards primários fora).',
    en: 'Cluster health: `green` (all good), `yellow` (primary shards ok, replicas pending — e.g. single-node) and `red` (primary shards missing).' },
  { code: `GET /_cat/nodes?v
GET /_cat/shards?v`, cat: 'mgmt',
    pt: '`_cat/nodes` mostra nós, carga e uso de disco; `_cat/shards` mostra onde cada shard está, tamanho e se está UNASSIGNED — o primeiro passo de investigação.',
    en: '`_cat/nodes` shows nodes, load and disk usage; `_cat/shards` shows where each shard lives, its size and whether it is UNASSIGNED — the first investigation step.' },
  { code: `POST /_aliases
{
  "actions": [
    { "add": { "index": "logs-2026.08", "alias": "logs-current" } }
  ]
}`, cat: 'mgmt',
    pt: 'Alias: um nome estável apontando pra um índice. A aplicação busca no alias e você troca o índice por trás sem downtime — essencial junto com reindex.',
    en: 'Alias: a stable name pointing to an index. The app queries the alias and you swap the underlying index with zero downtime — essential alongside reindex.' },
  { code: `PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": { "number_of_shards": 2 },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "message": { "type": "text" }
      }
    }
  }
}`, cat: 'mgmt',
    pt: 'Index Template aplica settings/mapping automaticamente a todo índice novo que casar o padrão (`logs-*`) — o jeito de padronizar índices diários.',
    en: 'Index Template auto-applies settings/mapping to every new index matching the pattern (`logs-*`) — the way to standardize daily indices.' },
  { code: `PUT /products/_settings
{
  "settings": {
    "number_of_replicas": 2,
    "refresh_interval": "30s"
  }
}`, cat: 'mgmt',
    pt: 'Ajusta settings "quentes" em tempo real: réplicas (que pode mudar) e `refresh_interval` — aumentar pra 30s-60s em rotina de bulk reduz I/O drasticamente.',
    en: 'Tunes "hot" settings in real time: replicas (which you can change) and `refresh_interval` — bumping to 30s-60s in bulk routines cuts I/O drastically.' },
  { code: `POST /logs-2026/_forcemerge?max_num_segments=1`, cat: 'mgmt',
    pt: '`_forcemerge` compacta os segments do shard num único (ou N) segmento — menos I/O de busca. Faça em índices antigos/pouco escritos, não em índice ativo.',
    en: '`_forcemerge` merges shard segments into one (or N) segment — less search I/O. Do it on old/low-write indices, never on an actively written one.' },
  { code: `GET /logs/_search?terminate_after=5
GET /products/_count`, cat: 'mgmt',
    pt: '`terminate_after` para a busca após N docs por shard (conta/preview rápido); `_count` devolve só a contagem de docs que casam a query.',
    en: '`terminate_after` stops the search after N docs per shard (fast count/preview); `_count` returns just the number of docs matching a query.' },
  { code: `GET /_cat/indices?v&health=yellow
GET /_cat/indices/logs-*?s=store.size:desc`, cat: 'mgmt',
    pt: 'Filtros e ordenação no `_cat`: `health=yellow` mostra só índices degradados; `s=store.size:desc` ordena pelos maiores. `_cat` aceita wildcard no índice.',
    en: 'Filters and sorting in `_cat`: `health=yellow` shows only degraded indices; `s=store.size:desc` sorts by the biggest. `_cat` accepts a wildcard index.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Elasticsearch',
    intro: (
      <>
        O <Text code>Elasticsearch</Text> — motor de busca sobre Lucene no
        coração da stack ELK. Do <Text code>Query DSL</Text> às{' '}
        <Text code>aggregations</Text>, passando por mapping, reindex e
        aliases: a referência pra não decorar sintaxe JSON na hora do
        incidente.
      </>
    ),
    search: 'Buscar por query ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no Elasticsearch',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>term</Text> não analisa;{' '}
            <Text code>match</Text> analisa.</Text> Num campo{' '}
          <Text code>text</Text>, <Text code>match</Text> quebra sua query em
          tokens; <Text code>term</Text> compara a string literal e quase
          nunca casa. Pro termo exato, use o subcampo{' '}
          <Text code>.keyword</Text> ou um campo <Text code>keyword</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Aggregation em <Text code>text</Text> falha.</Text>{' '}
          <Text code>terms</Text> (e <Text code>sort</Text>) exigem{' '}
          <Text code>doc_values</Text>, desabilitado em <Text code>text</Text>{' '}
          por padrão. Agregue/ordene no{' '}
          <Text code>name.keyword</Text>, não no <Text code>name</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Paginação profunda trava em 10.000.</Text>{' '}
          <Text code>from + size</Text> passa disso só com config (ruim).
          Use <Text code>search_after</Text> pra scroll infinito e{' '}
          <Text code>scroll</Text> pra varrer tudo de uma vez.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>O doc não aparece na hora.</Text> O refresh roda a cada
          ~1s (configurável) — indexou e não achou?{' '}
          <Text code>POST /_refresh</Text> ou aguarde um segundo. E{' '}
          <Text code>DELETE /indice</Text> é permanente, sem lixeira.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Não dá pra mudar tipo de campo no lugar.</Text> Alterar
          de <Text code>keyword</Text> pra <Text code>text</Text> (ou o
          analyzer) exige criar um índice novo,{' '}
          <Text code>_reindex</Text> e trocar o{' '}
          <Text code>alias</Text> — o padrão de migração com zero downtime.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Escrita concorrente derruba bulk de delete.</Text>{' '}
          <Text code>_delete_by_query</Text> pode lançar{' '}
          <Text code>version_conflict</Text> sob escrita paralela — use{' '}
          <Text code>?conflicts=proceed</Text> e wildcard com{' '}
          <Text code>*</Text> no início é lento demais pra usar em produção.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar snippet',
    copiedCode: 'Snippet copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Elasticsearch Cheat Sheet',
    intro: (
      <>
        <Text code>Elasticsearch</Text> — the Lucene-based search engine at
        the heart of the ELK stack. From the{' '}
        <Text code>Query DSL</Text> to <Text code>aggregations</Text>, plus
        mapping, reindex and aliases: the reference to avoid memorizing JSON
        syntax mid-incident.
      </>
    ),
    search: 'Search by query or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong><Text code>term</Text> doesn&apos;t analyze;{' '}
            <Text code>match</Text> does.</Text> On a{' '}
          <Text code>text</Text> field, <Text code>match</Text> tokenizes
          your query; <Text code>term</Text> compares the literal string and
          almost never matches. For exact terms use the{' '}
          <Text code>.keyword</Text> subfield or a <Text code>keyword</Text>{' '}
          field.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Aggregations on <Text code>text</Text> fail.</Text>{' '}
          <Text code>terms</Text> (and <Text code>sort</Text>) require{' '}
          <Text code>doc_values</Text>, disabled on <Text code>text</Text> by
          default. Aggregate/sort on <Text code>name.keyword</Text>, not{' '}
          <Text code>name</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Deep pagination hits a 10,000 wall.</Text> Beyond{' '}
          <Text code>from + size</Text> you need config changes (bad). Use{' '}
          <Text code>search_after</Text> for infinite scroll and{' '}
          <Text code>scroll</Text> to sweep everything at once.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>New docs aren&apos;t visible instantly.</Text> Refresh
          runs every ~1s (configurable) — indexed but not found?{' '}
          <Text code>POST /_refresh</Text> or wait a second. And{' '}
          <Text code>DELETE /index</Text> is permanent, no trash.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>You can&apos;t change a field type in place.</Text>{' '}
          Switching <Text code>keyword</Text> → <Text code>text</Text> (or
          the analyzer) requires a new index,{' '}
          <Text code>_reindex</Text> and an{' '}
          <Text code>alias</Text> swap — the zero-downtime migration pattern.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Concurrent writes kill bulk deletes.</Text>{' '}
          <Text code>_delete_by_query</Text> can throw{' '}
          <Text code>version_conflict</Text> under parallel writes — use{' '}
          <Text code>?conflicts=proceed</Text> and a leading{' '}
          <Text code>*</Text> wildcard is too slow for production.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy snippet',
    copiedCode: 'Snippet copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function ElasticsearchCheatsheetPage() {
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
    const header = '# Elasticsearch (cheat sheet)\n\n'
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
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
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
            <List.Item key={`${item.cat}-${item.code.slice(0, 40)}`}>
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
