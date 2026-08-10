import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ApartmentOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'select', 'map', 'builtins', 'strings', 'arrays', 'group', 'recipes']

const CATEGORY_COLOR = {
  basics: 'blue',
  select: 'cyan',
  map: 'geekblue',
  builtins: 'purple',
  strings: 'green',
  arrays: 'volcano',
  group: 'gold',
  recipes: 'magenta',
}

const labelOf = {
  basics: { pt: 'Selecionar campos', en: 'Selecting fields' },
  select: { pt: 'Filtrar com select', en: 'Filtering with select' },
  map: { pt: 'Transformar & construir', en: 'Mapping & building' },
  builtins: { pt: 'Funções embutidas', en: 'Built-in functions' },
  strings: { pt: 'Strings & números', en: 'Strings & numbers' },
  arrays: { pt: 'Arrays & fatias', en: 'Arrays & slices' },
  group: { pt: 'Agrupar & reduzir', en: 'Grouping & reducing' },
  recipes: { pt: 'Receitas do dia a dia', en: 'Everyday recipes' },
}

const ITEMS = [
  // ─── Selecionar campos ─────────────────────────────────────────────────
  { code: "jq '.name' dados.json", cat: 'basics',
    pt: 'Imprime o valor da chave name do objeto raiz — o "hello world" do jq. O ponto é o input atual; .campo puxa a chave dele.',
    en: 'Prints the value of the name key of the root object — jq\'s hello world. The dot is the current input; .field pulls its key.' },
  { code: "jq '.name, .id' dados.json", cat: 'basics',
    pt: 'Vários campos separados por vírgula saem um por linha, na ordem pedida. A vírgula é o "e também" do jq.',
    en: 'Comma-separated fields come out one per line, in the order asked. Comma is jq\'s "and also".' },
  { code: "jq '.a.b.c' dados.json", cat: 'basics',
    pt: 'Os pontos descem nos objetos: .a.b.c é o c dentro de b dentro de a. Descer de nível é o uso mais comum do jq.',
    en: 'Dots descend into objects: .a.b.c is the c inside b inside a. Descending through levels is jq\'s most common use.' },
  { code: 'jq \'.["a-b"]\' dados.json', cat: 'basics',
    pt: 'Chave com caractere especial (hífen, espaço, ponto) precisa de indexação por string — o "." não resolve um nome assim.',
    en: 'A key with special characters (hyphen, space, dot) needs string indexing — "." cannot reach a name like that.' },
  { code: "jq '.items[0]' dados.json", cat: 'basics',
    pt: 'Primeiro elemento do array items; [1] o segundo — os índices começam em 0. O resultado sai formatado (pretty).',
    en: 'First element of the items array; [1] the second — indices start at 0. The output comes out pretty-printed.' },
  { code: "jq '.items[-1]' dados.json", cat: 'basics',
    pt: 'Índice negativo conta do fim: -1 é o último elemento, -2 o penúltimo. Sem precisar saber o tamanho do array.',
    en: 'Negative index counts from the end: -1 is the last element, -2 the second-to-last. No need to know the array length.' },
  { code: "jq '.items[]' dados.json", cat: 'basics',
    pt: 'O [] "abre" o array: imprime um elemento por linha, sem as chaves do array. É assim que se itera no jq — tudo o que vem depois passa por cada elemento.',
    en: 'The [] "opens" the array: prints one element per line, no brackets. This is how you iterate in jq — everything after runs per element.' },
  { code: "jq '.' dados.json", cat: 'basics',
    pt: 'O ponto sozinho devolve o input inteiro já formatado — o validar/pretty-print de um JSON colado ou a resposta de uma API.',
    en: 'A lone dot returns the whole input, already formatted — validating/pretty-printing pasted JSON or an API response.' },
  { code: "jq -r '.items[].name' dados.json", cat: 'basics',
    pt: '-r (raw) tira as aspas das strings: sai texto puro, pronto pra variável de shell ou pipe pro próximo comando. O modo mais usado no dia a dia.',
    en: '-r (raw) strips the quotes around strings: raw text for a shell variable or a next pipe. The most-used flag in practice.' },
  { code: "jq -c '.items[]' dados.json", cat: 'basics',
    pt: '-c (compact) emite JSON numa linha só — a forma de gerar JSON Lines a partir de um array, pronto pra log ou outro pipe.',
    en: '-c (compact) emits JSON on a single line — how to produce JSON Lines from an array, ready for logs or another pipe.' },

  // ─── Filtrar com select ────────────────────────────────────────────────
  { code: 'jq \'.items[] | select(.status == "ok")\' dados.json', cat: 'select',
    pt: 'O filtro central do jq: select(.cond) mantém só os elementos em que a condição vale; os demais SOMEM do stream (não viram null).',
    en: 'jq\'s central filter: select(.cond) keeps only the elements where the condition holds; the rest quietly disappear from the stream.' },
  { code: 'jq \'.items[] | select(.price > 100)\' dados.json', cat: 'select',
    pt: 'Comparação numérica na condição: > < >= <= funcionam direto. O | liga o select ao array aberto.',
    en: 'Numeric comparison in the condition: > < >= <= work directly. The pipe connects the select to the opened array.' },
  { code: 'jq \'.items[] | select(.active == true)\' dados.json', cat: 'select',
    pt: 'Booleano explícito. Para testar existência use != null; para string, == "valor". O operador de igualdade é == (um só = é atribuição, que não existe no jq).',
    en: 'Explicit boolean. For existence test != null; for a string, == "value". Equality is == (single = is assignment and jq has none).' },
  { code: 'jq \'.items[] | select(.date > "2026-01-01")\' dados.json', cat: 'select',
    pt: 'Datas ISO-8601 são strings que comparam certo lexicograficamente — filtrar por data não precisa de conversão nenhuma.',
    en: 'ISO-8601 dates are strings that compare correctly lexicographically — filtering by date needs zero conversion.' },
  { code: 'jq \'.items[] | select(.qty >= 5 and .ok == true)\' dados.json', cat: 'select',
    pt: 'and/or/not combinam condições — o "e" entre dois campos é o filtro mais comum de todos. Use parênteses pra agrupar quando a linha complicar.',
    en: 'and/or/not combine conditions — the "and" across two fields is the most common filter of all. Use parentheses when a line gets complex.' },
  { code: "jq '.items | map(select(.ok))' dados.json", cat: 'select',
    pt: 'map(select(cond)) é o "filtrar mantendo o array": a mesma ideia do select, mas devolve o array inteiro de volta (não um stream).',
    en: 'map(select(cond)) is "filter while keeping the array": the same idea as select, but it returns the whole array (not a stream).' },
  { code: 'jq \'.items[] | select(.tags | index("urgente"))\' dados.json', cat: 'select',
    pt: 'Filtro por membro de array: .tags | index(x) devolve a posição (truthy) ou null (falsy) — o "tem este item na lista".',
    en: 'Array-membership filter: .tags | index(x) returns a position (truthy) or null (falsy) — "this list contains the item".' },
  { code: 'jq \'.items[] | select(.name | test("^api-"))\' dados.json', cat: 'select',
    pt: 'test(regex) casa por expressão regular — "começa com / parece com" sem depender de prefixo exato (igual ao grep -E).',
    en: 'test(regex) matches with a regular expression — "starts like / looks like", without exact prefixes (like grep -E).' },
  { code: 'jq \'.items[] | select(.name | contains("api"))\' dados.json', cat: 'select',
    pt: 'contains casa SUBSTRING — sem regex, sem escape: para "tem esse pedaço no nome", é a regra simples e segura.',
    en: 'contains matches a SUBSTRING — no regex, no escaping: for "this piece exists in the name", the simple safe rule.' },
  { code: 'jq \'.items[] | select(has("price"))\' dados.json', cat: 'select',
    pt: 'has("chave") testa apenas se o campo EXISTE — inclui os que existem com valor null. Para "tem valor de verdade", combine com != null.',
    en: 'has("key") tests only whether the field EXISTS — including ones present with a null value. For "has a real value", combine with != null.' },

  // ─── Transformar & construir ───────────────────────────────────────────
  { code: "jq '.items | map(.name)' dados.json", cat: 'map',
    pt: 'map aplica um filtro a CADA elemento e devolve um array do mesmo tamanho — o "projetar um campo" que vira uma lista de valores.',
    en: 'map applies a filter to EVERY element and returns a same-size array — projecting a field into a list of values.' },
  { code: "jq '.items | map(.price * .qty)' dados.json", cat: 'map',
    pt: 'map com expressão aritmética usa os campos de cada elemento — aqui, o valor total de cada linha do pedido.',
    en: 'map with an arithmetic expression uses each element\'s fields — here, each order line\'s total value.' },
  { code: "jq '.items | map({nome: .name, preco: .price})' dados.json", cat: 'map',
    pt: 'map com um objeto renomeia/reduz os campos: monta um objeto novo por elemento — a "projeção com shape próprio".',
    en: 'map with an object renames/slims the fields: builds a new object per element — a "projection with your own shape".' },
  { code: "jq '.items[] | {sku, nome: .name}' dados.json", cat: 'map',
    pt: 'Abreviação de objeto: {sku} puxa o campo sku com o mesmo nome; {nome: .name} renomeia. Os dois misturados num só filtro.',
    en: 'Object shorthand: {sku} pulls the same-named field; {nome: .name} renames. Both mix in one filter.' },
  { code: "jq 'del(.password)' dados.json", cat: 'map',
    pt: 'del(.chave) remove campos — a anonimização rápida antes de compartilhar um JSON (objetos são imutáveis: devolve uma cópia sem o campo).',
    en: 'del(.key) removes fields — the quick redaction before sharing JSON (objects are immutable: it returns a copy without the field).' },
  { code: 'jq \'. + {"fuso": "UTC"}\' dados.json', cat: 'map',
    pt: 'Objeto + objeto funde as chaves: acrescenta (ou sobrescreve) um campo novo ao input, mantendo os demais intactos.',
    en: 'Object + object merges the keys: appends (or overrides) a new field onto the input while keeping the rest intact.' },
  { code: "jq '.stats | map_values(. * 2)' dados.json", cat: 'map',
    pt: 'map_values transforma os VALORES sem tocar nas chaves — dobrar todos os números do objeto de uma vez (aplica também em arrays).',
    en: 'map_values transforms the VALUES without touching the keys — double every number in the object at once (works on arrays too).' },
  { code: "jq '.stats | with_entries(.value |= . * 10)' dados.json", cat: 'map',
    pt: 'with_entries abre o objeto em pares chave→valor, aplica o filtro ao .value (o |= atualiza no lugar) e remonta — agir em todas as chaves em massa.',
    en: 'with_entries opens the object into key→value pairs, applies the filter to .value (|= updates in place) and rebuilds — mass-editing every key.' },
  { code: 'jq \'{nome: "fixo", tags: ["a"]}\' dados.json', cat: 'map',
    pt: 'Objeto literal do nada — independente do input. Bom como "shape" fixo de saída no fim de um pipeline.',
    en: 'A literal object out of thin air — input-independent. Good as a fixed output shape at the end of a pipeline.' },

  // ─── Funções embutidas ─────────────────────────────────────────────────
  { code: "jq '.items | length' dados.json", cat: 'builtins',
    pt: 'length no array = número de elementos; em string = caracteres; em objeto = número de chaves. O sentido muda com o tipo.',
    en: 'length on an array = element count; on a string = characters; on an object = number of keys. Its meaning depends on the type.' },
  { code: "jq 'keys' dados.json", cat: 'builtins',
    pt: 'keys lista as chaves do objeto (ou os índices do array) em ordem alfabética — o "quais campos tem este JSON".',
    en: 'keys lists an object\'s keys (or an array\'s indices) in alphabetical order — "which fields does this JSON have".' },
  { code: "jq '.items | sort_by(.price)' dados.json", cat: 'builtins',
    pt: 'sort_by(campo) ordena o array pelo campo, crescente. O inverso é | reverse (ou sort_by(-.price) para números).',
    en: 'sort_by(field) sorts the array by that field, ascending. The inverse is | reverse (or sort_by(-.price) for numbers).' },
  { code: "jq '.items | sort_by(.price) | reverse' dados.json", cat: 'builtins',
    pt: '"Maior primeiro": sort crescente + reverse. O mesmo "sort -r" do shell, mas por um campo do JSON.',
    en: '\"Biggest first\": ascending sort plus reverse. The shell\'s "sort -r", but driven by a JSON field.' },
  { code: "jq '.nums | unique' dados.json", cat: 'builtins',
    pt: 'unique remove as duplicatas JÁ devolvendo em ordem — o "sort -u" do jq. E unique_by(.id) deduplica por um campo específico.',
    en: 'unique drops the duplicates AND returns them sorted — jq\'s "sort -u". And unique_by(.id) dedupes by a specific field.' },
  { code: "jq '.qtys | add' dados.json", cat: 'builtins',
    pt: 'add soma os números do array — a "soma da coluna". Sobre objetos, em vez disso funde as chaves.',
    en: 'add sums the array\'s numbers — the "column total". On objects, it merges the keys instead.' },
  { code: "jq '.items | map(.price) | add' dados.json", cat: 'builtins',
    pt: 'O combo soma-de-projeção: map projeta o campo e add soma — o "SUM(column)" do jq, em duas palavras.',
    en: 'The projection-sum combo: map projects the field, add sums it — jq\'s "SUM(column)" in two words.' },
  { code: "jq '.items | map(select(.ok)) | length' dados.json", cat: 'builtins',
    pt: 'Contagem após filtro: filtra com map+select e mede com length — quantos elementos passam na condição.',
    en: 'Count after filter: filter with map+select, then measure with length — how many elements pass the condition.' },
  { code: "jq '.precos | max, min' dados.json", cat: 'builtins',
    pt: 'max/min do array numérico — a vírgula pede os dois seguidos. Para escolher o ELEMENTO inteiro, use max_by/min_by.',
    en: 'max/min of a numeric array — the comma requests both in a row. To select the whole ELEMENT, use max_by/min_by.' },
  { code: "jq '.items | max_by(.price) | .name' dados.json", cat: 'builtins',
    pt: 'max_by/min_by devolvem o ELEMENTO inteiro (aqui o objeto com o maior price) — o | .name pega só o campo dele.',
    en: 'max_by/min_by return the whole ELEMENT (here the object with the highest price) — | .name grabs just its field.' },

  // ─── Strings & números ─────────────────────────────────────────────────
  { code: "jq '.texto | ascii_upcase' dados.json", cat: 'strings',
    pt: 'ascii_upcase/ascii_downcase trocam a caixa de strings — o UPPER/LOWER do shell, sem depender de extensões.',
    en: 'ascii_upcase/ascii_downcase change the case of strings — the shell\'s UPPER/LOWER with no extra tooling.' },
  { code: 'jq \'"nome: \\(.name)"\' dados.json', cat: 'strings',
    pt: 'Interpolação: \\(expressão) é injetada no texto entre aspas duplas — o "template string" do jq, lendo campos de dentro da string.',
    en: 'Interpolation: \\(expression) is injected into the double-quoted text — jq\'s "template string", reading fields from inside the string.' },
  { code: "jq '.n | tostring' dados.json", cat: 'strings',
    pt: 'tostring/tonumber convertem número ↔ string — a conversão que torna a concatenação de números com texto possível (+) porque o + só soma coisas do mesmo tipo.',
    en: 'tostring/tonumber convert number ↔ string — the conversions that make concatenating numbers with text possible (+ only combines likes).' },
  { code: "jq '.numero_em_string | tonumber' dados.json", cat: 'strings',
    pt: 'tonumber faz o caminho inverso: o "42" lido dum formulário/CSV volta a ser o número 42 para comparações e contas.',
    en: 'tonumber is the reverse direction: the "42" read from a form/CSV becomes the number 42 again for comparisons and math.' },
  { code: 'jq \'.csv | split(",")\' dados.json', cat: 'strings',
    pt: 'split(sep) quebra a string em array pelo separador — o primeiro passo para transformar CSV cru em JSON.',
    en: 'split(sep) breaks the string into an array on the separator — the first step to turning raw CSV into JSON.' },
  { code: 'jq \'[.a.b.c, .name] | join(" - ")\' dados.json', cat: 'strings',
    pt: 'join(sep) junta um array de strings numa string — para montar rótulos/identificadores a partir de campos (números precisam de tostring antes).',
    en: 'join(sep) merges a string array into one string — for building labels/IDs out of fields (numbers need tostring first).' },
  { code: "jq '.items[0].json | fromjson' dados.json", cat: 'strings',
    pt: 'fromjson converte uma string JSON embutida em valor de verdade — para consumir um objeto serializado dentro de um campo (o inverso é tojson).',
    en: 'fromjson turns an embedded JSON string into a real value — to consume an object serialized inside a field (the inverse is tojson).' },
  { code: 'jq \'.texto | startswith("api")\' dados.json', cat: 'strings',
    pt: 'startswith/endswith devolvem booleano de prefixo/sufixo — o teste simples, sem regex (para padrões, test("^api")).',
    en: 'startswith/endswith return prefix/suffix booleans — the simple test, no regex (for patterns, test("^api")).' },
  { code: "jq '.texto[0:5]' dados.json", cat: 'strings',
    pt: 'Índices também fatiam strings: [0:5] devolve os 5 primeiros caracteres (o fim é exclusivo) — o "pega o começo do campo".',
    en: 'Indices also slice strings: [0:5] returns the first 5 characters (end is exclusive) — "take the start of the field".' },

  // ─── Arrays & fatias ───────────────────────────────────────────────────
  { code: "jq '.items[1:3]' dados.json", cat: 'arrays',
    pt: 'Fatia do array: índices 1 e 2 (o 3 é EXCLUSIVO) — o subarray "do segundo até antes do quarto" (em string, corta caracteres).',
    en: 'Array slice: indices 1 and 2 (3 is EXCLUSIVE) — the subarray "from the second up to before the fourth" (on strings, it cuts characters).' },
  { code: "jq '.items[10:20]' dados.json", cat: 'arrays',
    pt: 'Paginação manual: elementos da posição 10 à 19. Limites fora da faixa não estouram — devolvem só o que existe.',
    en: 'Manual pagination: positions 10 through 19. Out-of-range bounds don\'t blow up — they return only what exists.' },
  { code: "jq '[.items[] | select(.ok)]' dados.json", cat: 'arrays',
    pt: 'Colchetes ao redor de um stream RECOLHE de volta num array — o inverso explícito de abrir com []. É exatamente o que map faz por baixo.',
    en: 'Brackets around a stream COLLECT it back into an array — the explicit inverse of opening with []. This is exactly what map does under the hood.' },
  { code: "jq '[range(1; 6)]' dados.json", cat: 'arrays',
    pt: 'range(inicio; fim) gera a sequência; dentro de [] vira [1,2,3,4,5]. Pra gerar listas de teste, séries de datas, ids.',
    en: 'range(start; end) generates the sequence; inside [] it becomes [1,2,3,4,5]. For test lists, date series, id runs.' },
  { code: "jq '.qtys + .nums' dados.json", cat: 'arrays',
    pt: 'Array + array CONCATENA os elementos; objeto + objeto funde as chaves. O que o + faz depende do tipo dos operandos.',
    en: 'Array + array CONCATENATES the elements; object + object merges the keys. What + does depends on the operand type.' },
  { code: "jq '.arr | unique_by(.id)' dados.json", cat: 'arrays',
    pt: 'unique_by(campo) deduplica por um campo específico, mantendo o primeiro de cada valor distinto — o "distinct on" do SQL.',
    en: 'unique_by(field) dedupes by a specific field, keeping the first of each distinct value — SQL\'s "distinct on".' },
  { code: "jq '.aninhado | flatten' dados.json", cat: 'arrays',
    pt: 'flatten achata arrays aninhados em um nível; flatten(2) achata até 2 níveis — para normalizar listas irregulares.',
    en: 'flatten flattens nested arrays one level; flatten(2) goes up to 2 levels — for normalizing irregular lists.' },
  { code: "jq '.items[0,1,2] | .name' dados.json", cat: 'arrays',
    pt: 'Vários índices numa sentada com vírgula — pega 0, 1 e 2 sem montar subarray; cada um vira input do restante do pipeline.',
    en: 'Several indices in one go with commas — grabs 0, 1 and 2 without building a subarray; each feeds the rest of the pipeline.' },

  // ─── Agrupar & reduzir ─────────────────────────────────────────────────
  { code: "jq '.items | group_by(.category)' dados.json", cat: 'group',
    pt: 'group_by(campo) divide o array em array de arrays — um grupo por valor da chave, ORDENADO pela chave do agrupamento.',
    en: 'group_by(field) splits the array into an array of arrays — one group per key value, SORTED by the grouping key.' },
  { code: "jq -s 'group_by(.category) | map({cat: .[0].category, count: length})' dados.json", cat: 'group',
    pt: '-s (slurp) lê TODO o input como um único array — o jeito de agrupar quando os objetos estão no topo, um por linha (JSON Lines).',
    en: '-s (slurp) reads the WHOLE input as one array — how to group when the objects sit at the top level, one per line (JSON Lines).' },
  { code: "jq '.items | group_by(.cat) | map({cat: .[0].cat, count: length})' dados.json", cat: 'group',
    pt: 'A tabela de frequência: para cada grupo, .[0].chave é a chave e length a contagem — "quantos itens por categoria".',
    en: 'The frequency table: for each group, .[0].key is the key and length the count — "how many items per category".' },
  { code: "jq '.items | group_by(.cat) | map({cat: .[0].cat, total: map(.price) | add})' dados.json", cat: 'group',
    pt: 'Agregação por grupo: o map de DENTRO soma a coluna de cada grupo — o "total por categoria" em duas linhas.',
    en: 'Per-group aggregation: the INNER map sums each group\'s column — the "total per category" in two lines.' },
  { code: "jq 'reduce .items[] as $i (0; . + $i.price)' dados.json", cat: 'group',
    pt: 'reduce é a soma explícita: acumulador 0, . é o acumulador, e cada item $i soma o .price — o "for" do jq quando add não basta.',
    en: 'reduce is the explicit sum: accumulator 0, . is the accumulator, and each item $i adds .price — jq\'s "for loop" when add isn\'t enough.' },
  { code: "jq '.user as $u | {nome: $u.name}' dados.json", cat: 'group',
    pt: 'as / as $var guarda um valor numa variável para reutilizar no pipeline — evita repetir o mesmo caminho várias vezes.',
    en: 'as / as $var stores a value in a variable for reuse in the pipeline — avoids repeating the same path over and over.' },
  { code: "jq '[.items[].price] | add / length' dados.json", cat: 'group',
    pt: 'Média: recolhe a coluna com [], soma com add e divide pelo length — a média de uma projeção, sem loop.',
    en: 'Average: collect the column with [], sum with add and divide by length — the mean of a projection, no loop.' },

  // ─── Receitas do dia a dia ─────────────────────────────────────────────
  { code: "curl -s https://api.github.com/repos/nodejs/node | jq '.stargazers_count'", cat: 'recipes',
    pt: 'A vida real: o pipe DE FORA é do shell e entrega a resposta da API pro jq — é o filtro a mais que transforma o curl em JSON utilizável.',
    en: 'Real life: the OUTER pipe belongs to the shell and feeds the API response to jq — the extra filter that turns curl output into usable JSON.' },
  { code: 'echo \'{"stars": 147000}\' | jq -r \'"repo tem \\(.stars) estrelas"\'', cat: 'recipes',
    pt: 'A saída formatada como texto: pipe do shell + interpolação + -r — monta uma frase legível a partir de um JSON (o shell NÃO expande \\( — fica pro jq).',
    en: 'Formatted text out of JSON: shell pipe + interpolation + -r — builds a readable sentence from JSON (the shell does NOT touch \\( — jq does).' },
  { code: 'jq -r \'.items[] | [.name, .price, .qty] | @tsv\' dados.json', cat: 'recipes',
    pt: '@tsv emite o array como linha TAB-separated (cada item vira coluna) — o exportador de planilha; com -r sai texto puro, pronto pra colar.',
    en: '@tsv emits the array as a TAB-separated line (each item a column) — the spreadsheet exporter; with -r the output is clean text.' },
  { code: 'jq -r \'.items[] | [.name, .id] | @csv\' dados.json', cat: 'recipes',
    pt: '@csv emite CSV com as aspas certas — o exportador pra importar em qualquer planilha (o par @tsv/@csv cobre as duas delimitadoras).',
    en: '@csv emits CSV with correct quoting — the exporter for any spreadsheet (the @tsv/@csv pair covers both delimiters).' },
  { code: 'jq --arg hoje "2026-08-10" \'.items[] | select(.date == $hoje)\' dados.json', cat: 'recipes',
    pt: '--arg cria uma variável a partir do shell SEM interpolar no programa — o jeito seguro de passar valores de fora (hoje="$(date +%F)" funciona igual).',
    en: '--arg creates a variable from the shell WITHOUT interpolating into the program — the safe way to pass outside values (hoje="$(date +%F)" works too).' },
  { code: 'jq -r \'.items[] | select(.stock < 10) | [.sku, .stock] | @tsv\' dados.json', cat: 'recipes',
    pt: 'Relatório de alerta: filtra a condição e exporta só as colunas que importam, em TSV que cruza com grep/sort/awk na sequência.',
    en: 'Alert report: filter the condition, export only the columns that matter, as TSV ready to cross with grep/sort/awk next.' },
  { code: "jq '.items | sort_by(.price) | reverse | .[0]' dados.json", cat: 'recipes',
    pt: 'O "--limit 1" do jq: ordena descendo e pega o topo do array — o mais caro, o maior, o mais recente.',
    en: 'jq\'s "--limit 1": sort descending and take the top of the array — the priciest, the biggest, the newest.' },
  { code: "tail -f app.log | jq -c 'select(.level == \"ERROR\")'", cat: 'recipes',
    pt: 'Streaming de logs JSON Lines: o jq consome o pipe linha a linha e emite só os eventos que casam — o grep de log estruturado.',
    en: 'Streaming JSON Lines logs: jq consumes the pipe line by line and emits only matching events — grep for structured logs.' },
  { code: "kubectl get pods -o json | jq -r '.items[].metadata.name'", cat: 'recipes',
    pt: 'A "coluna" de qualquer comando verboso com -o json (kubectl, docker inspect, gh api, aws) — um nome por linha, sem python nem sed.',
    en: 'The "column" of any verbose command with -o json (kubectl, docker inspect, gh api, aws) — one name per line, no python, no sed.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de jq',
    intro: (
      <>
        O processador de JSON do terminal — o jeito de filtrar, transformar e
        resumir <Text code>curl</Text>, <Text code>kubectl -o json</Text>,{' '}
        <Text code>docker inspect</Text> ou qualquer arquivo <Text code>.json</Text>{' '}
        sem escrever programa nenhum. Cada entrada traz o comando pronto para
        colar e o que ele faz.
      </>
    ),
    search: 'Buscar por comando, opção ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Pegadinhas que pegam todo mundo',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          O programa do jq vai <Text strong>sempre</Text> entre{' '}
          <Text code>aspas simples</Text>:{' '}
          <Text code>jq '.a | select(.x == "$v")' ...</Text>. Em aspas duplas o
          shell expande <Text code>$var</Text>, acentos graves e interpreta{' '}
          <Text code>|</Text>, <Text code>&gt;</Text> e <Text code>( )</Text>{' '}
          ANTES do jq ver — o erro mais comum ao copiar exemplos para o prompt.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          A saída é <Text strong>JSON de novo</Text> por padrão: strings saem
          entre aspas. O <Text code>-r</Text> (raw) remove essas aspas para
          texto puro, e o <Text code>-c</Text> compacta para uma linha. Para
          parâmetros vindo de fora, use <Text code>--arg nome valor</Text> em
          vez de concatenar a string.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>select(...)</Text> <Text strong>descarta</Text>: elementos
          que não casam SOMEM do stream — não viram <Text code>null</Text>. E{' '}
          <Text code>.items[]</Text> abre o array em um stream, enquanto{' '}
          <Text code>map(...)</Text> devolve o array de volta (é o mesmo que{' '}
          <Text code>[.items[] | ...]</Text>).
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text code>group_by(.x)</Text> entrega os grupos <Text strong>em
          ordem da chave</Text>. <Text code>sort_by</Text> é sempre crescente —{' '}
          <Text code>| reverse</Text> inverte. E <Text code>length</Text> muda
          de sentido conforme o tipo (array contagem, string caracteres,
          objeto chaves). Objetos do jq são imutáveis: cada filtro devolve uma
          cópia, nunca edita o original.
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
    title: 'jq Cheat Sheet',
    intro: (
      <>
        The terminal's JSON processor — the way to filter, transform and
        summarize <Text code>curl</Text>, <Text code>kubectl -o json</Text>,{' '}
        <Text code>docker inspect</Text> or any <Text code>.json</Text> file
        without writing a program. Each entry carries the copy-ready command
        and what it does.
      </>
    ),
    search: 'Search by command, option or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'Gotchas that catch everyone',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          The jq program always goes in <Text strong>single quotes</Text>:{' '}
          <Text code>jq '.a | select(.x == "$v")' ...</Text>. In double quotes
          the shell expands <Text code>$var</Text>, backticks and interprets{' '}
          <Text code>|</Text>, <Text code>&gt;</Text> and <Text code>( )</Text>{' '}
          BEFORE jq ever sees them — the most common mistake when pasting
          examples into a prompt.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          Output is <Text strong>JSON again</Text> by default: strings come out
          quoted. <Text code>-r</Text> (raw) strips those quotes to plain text,
          and <Text code>-c</Text> compacts to one line. For values from the
          outside, use <Text code>--arg name value</Text> instead of string
          concatenation.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>select(...)</Text> <Text strong>drops</Text>: elements that
          fail to match VANISH from the stream — they don't become{' '}
          <Text code>null</Text>. And <Text code>.items[]</Text> opens the array
          into a stream, while <Text code>map(...)</Text> returns the array (the
          same as <Text code>[.items[] | ...]</Text>).
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text code>group_by(.x)</Text> hands the groups back{' '}
          <Text strong>sorted by the key</Text>. <Text code>sort_by</Text> is
          always ascending — <Text code>| reverse</Text> flips it. And{' '}
          <Text code>length</Text> changes meaning by type (array count, string
          length, object keys). jq objects are immutable: every filter returns
          a copy, never edits the input.
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

export default function JqCheatsheetPage() {
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
    const header = '# jq (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```bash',
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
        icon={<ApartmentOutlined />}
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