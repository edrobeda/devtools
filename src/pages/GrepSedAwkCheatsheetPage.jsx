import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ApartmentOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['grep', 'grep-flags', 'find', 'sed-sub', 'sed-range', 'awk-fields', 'awk-aggregate', 'recipes']

const CATEGORY_COLOR = {
  grep: 'blue',
  'grep-flags': 'cyan',
  find: 'geekblue',
  'sed-sub': 'purple',
  'sed-range': 'magenta',
  'awk-fields': 'green',
  'awk-aggregate': 'volcano',
  recipes: 'gold',
}

const labelOf = {
  grep: { pt: 'grep — busca básica', en: 'grep — basic search' },
  'grep-flags': { pt: 'grep — regex & flags', en: 'grep — regex & flags' },
  find: { pt: 'find & xargs', en: 'find & xargs' },
  'sed-sub': { pt: 'sed — substituição & edição', en: 'sed — substitution & editing' },
  'sed-range': { pt: 'sed — impressão & deleção', en: 'sed — printing & deletion' },
  'awk-fields': { pt: 'awk — campos & padrões', en: 'awk — fields & patterns' },
  'awk-aggregate': { pt: 'awk — agregação & formatação', en: 'awk — aggregation & formatting' },
  recipes: { pt: 'Pipelines & receitas', en: 'Pipelines & recipes' },
}

const ITEMS = [
  // ─── grep — busca básica ────────────────────────────────────────────────
  { code: 'grep "erro" app.log', cat: 'grep',
    pt: 'Imprime as linhas de app.log que contêm "erro". O casamento é em qualquer parte da linha — o padrão é tratado como regex, mas texto simples acha substring.',
    en: 'Prints the lines of app.log that contain "erro". Matching happens anywhere in the line — a plain pattern is treated as a regex that finds substrings.' },
  { code: 'grep -i "erro" app.log', cat: 'grep',
    pt: '-i ignora maiúsculas/minúsculas: acha "erro", "ERRO", "Erro" — qualquer mistura. O primeiro flag a tentar quando "não achou nada".',
    en: '-i ignores case: matches "erro", "ERRO", "Erro" — any mix. The first flag to try when "nothing was found".' },
  { code: 'grep -v "debug" app.log', cat: 'grep',
    pt: '-v inverte a seleção: imprime só as linhas que NÃO casam. O "filtra fora" do dia a dia (linhas de log sem barulho).',
    en: '-v inverts the match, printing only lines that don\'t match — the everyday filter-out (log lines without the noise).' },
  { code: 'grep -c "erro" app.log', cat: 'grep',
    pt: '-c conta e imprime só o número de LINHAS casadas, não de ocorrências — uma linha com 3 "erro" conta 1. Para ocorrências, "-o | wc -l".',
    en: '-c prints only the number of matching LINES, not occurrences — lines with 3 "erro" count as 1. For occurrences, use "-o | wc -l".' },
  { code: 'grep -n "erro" app.log', cat: 'grep',
    pt: '-n prefixa cada linha com o número dela no arquivo — o par preferido de editores para pular direto à linha do erro.',
    en: '-n prefixes each line with its line number — the best friend of editors when you want to jump straight to the error line.' },
  { code: 'grep -w "erro" app.log', cat: 'grep',
    pt: '-w casa palavra inteira: acha "erro" mas não "errado" nem "erro404". Repara entre palavras é ignorado.',
    en: '-w matches a whole word: finds "erro" but not "errado" or "erro404". Word boundaries are enforced.' },
  { code: 'grep -x "OK" app.log', cat: 'grep',
    pt: '-x exige que a LINHA INTEIRA case — não substring. Perfeito para checar respostas/status de uma linha só.',
    en: '-x requires the whole LINE to match — no substring. Perfect for checking single-line replies/status codes.' },
  { code: 'grep "erro" *.log', cat: 'grep',
    pt: 'O shell expande o glob e o grep varre vários arquivos, prefixando cada match com o nome do arquivo.',
    en: 'The shell expands the glob and grep scans many files, prefixing each match with its filename.' },
  { code: 'grep -r "erro" src/', cat: 'grep',
    pt: '-r desce recursivamente na árvore de pastas. Passe --include/--exclude-dir junto — sem eles -r passeia até dentro de .git.',
    en: '-r descends recursively into the folder tree. Pair it with --include/--exclude-dir — otherwise -r crawls all the way into .git.' },
  { code: 'grep -l "erro" src/*.js', cat: 'grep',
    pt: '-l lista só o NOME dos arquivos com pelo menos um match, uma vez cada. O inverso -L lista os que NÃO têm match.',
    en: '-l lists only the filenames with at least one match, once each. The inverse -L lists the ones with none.' },

  // ─── grep — regex & flags ───────────────────────────────────────────────
  { code: 'grep -E "erro|falha|warn" app.log', cat: 'grep-flags',
    pt: 'Regex estendida (ERE): | de alternância, +, ?, (), {n,m} sem escapar. O modo certo quando a expressão começa a ter cara de regex.',
    en: 'Extended regex (ERE): | alternation, +, ?, (), {n,m} with no escaping. The right mode once an expression starts looking like regex.' },
  { code: 'grep -E "^2026-08" app.log', cat: 'grep-flags',
    pt: '^ ancora o início da linha — "linhas que começam com...". $ ancora o fim. Ancorar é o que faz o padrão não casar no meio do texto.',
    en: '^ anchors the start of a line — "lines starting with...". $ anchors the end. Anchoring is what keeps a pattern from matching mid-text.' },
  { code: 'grep -o "[0-9]\\+" app.log', cat: 'grep-flags',
    pt: '-o imprime só o trecho QUE CASOU (uma por linha), não a linha toda. No modo BRE o + leva barra; no -E não.',
    en: '-o prints only the MATCHED portion, once per line, not the whole line. In BRE the + needs a backslash; in -E it doesn\'t.' },
  { code: 'grep -A 2 -B 1 "stack trace" app.log', cat: 'grep-flags',
    pt: '-A N imprime N linhas DEPOIS do match e -B N antes — o contexto de um erro/stack trace. -C N cobre os dois lados de uma vez.',
    en: '-A N prints N lines AFTER the match and -B N BEFORE — the stack-trace error context. -C N covers both sides in one flag.' },
  { code: 'grep -q "erro" app.log && echo "achou"', cat: 'grep-flags',
    pt: '-q é silencioso e só devolve exit status 0/1 — o teste de condicional em scripts: o && dispara apenas se achou.',
    en: '-q makes grep silent and exit 0/1 — a conditional for scripts: && fires only if something was found.' },
  { code: 'grep -P "\\d{4}-\\d{2}-\\d{2}" app.log', cat: 'grep-flags',
    pt: '-P liga o PCRE (estilo perl): \\d, \\w, lookahead... Não existe em todo lugar (macOS usa grep BSD) — lá volte a -E com [0-9].',
    en: '-P turns on PCRE (perl-style): \\d, \\w, lookaheads... Not everywhere (macOS ships BSD grep) — drop back to -E with [0-9] there.' },
  { code: 'zgrep "erro" app.log.gz', cat: 'grep-flags',
    pt: 'zgrep lê direto um gzip: a mesma interface do grep — inclusive -E/-i/-n — aplicada a arquivos comprimidos sem descompactar antes.',
    en: 'zgrep reads gzip files directly: the same grep interface — including -E/-i/-n — on compressed archives with no prior unzip.' },
  { code: 'grep -- "php--x" arquivo.txt', cat: 'grep-flags',
    pt: '-- termina o parsing de flags: o que vier depois é padrão ou arquivo, mesmo que comece com "-". Evita o erro "unknown option".',
    en: '-- ends option parsing: whatever follows is a pattern or file, even if it starts with a dash. Avoids "unknown option" errors.' },
  { code: 'grep -r --include="*.js" "TODO" .', cat: 'grep-flags',
    pt: '--include restringe quais arquivos a recursão varre (vários --include somam; --exclude= exclui por glob). O guard da varredura dirigida.',
    en: '--include restricts which files the recursion scans (multiple flagments add up; --exclude= drops files by glob). The targeted-scan guard.' },
  { code: 'grep -rn --exclude-dir={node_modules,.git} "erro" .', cat: 'grep-flags',
    pt: '--exclude-dir pula diretórios inteiros da recursão. Sem ele o -r habita node_modules e .git (e demora a vida toda).',
    en: '--exclude-dir skips whole directories during -r. Without it the scan lives inside node_modules and .git (and takes forever).' },

  // ─── find & xargs ──────────────────────────────────────────────────────
  { code: 'find . -name "*.log"', cat: 'find',
    pt: 'Acha arquivos por nome — o glob precisa de aspas para o shell não expandir antes. O . é a raiz da busca.',
    en: 'Finds files by name — quote the glob so the shell can\'t expand it first. The "." is the search root.' },
  { code: 'find . -type f -size +10M', cat: 'find',
    pt: '-type f restringe a arquivos (-type d a diretórios) e -size +N / -N significa maior / menor que o tamanho.',
    en: '-type f restricts to files (-type d to directories) and -size +N / -N means bigger / smaller than the size.' },
  { code: 'find . -name "node_modules" -type d', cat: 'find',
    pt: 'Localiza TODOS os diretórios node_modules (ou qualquer pasta) na árvore — do projeto pra fora, um por linha.',
    en: 'Locates every node_modules (or any folder) in the tree — outward from the project, one per line.' },
  { code: 'find . -mtime -1', cat: 'find',
    pt: '-mtime -1 = modificados nas últimas 24h; +1 = antes disso. Para minutos use -mmin -30 (últimos 30 min).',
    en: '-mtime -1 = modified within the last 24h; +1 = earlier than that. For minutes use -mmin -30 (last 30 min).' },
  { code: 'find . -name "*.tmp" -delete', cat: 'find',
    pt: '-delete remove cada item casado sem passar por xargs. Rode o find sem -delete antes para conferir o que será apagado.',
    en: '-delete removes each match with no xargs involved. Run the find without -delete first to confirm what would be wiped.' },
  { code: 'find . -name "*.log" | xargs rm', cat: 'find',
    pt: 'xargs transforma o stdout em ARGUMENTOS do próximo comando — o elo "acha + age" num pipeline. Quebra com caminhos que têm espaço: use -print0|-0.',
    en: 'xargs turns stdout into ARGUMENTS of the next command — the "find + act" link of a pipeline. It breaks on space-y paths: use -print0 | xargs -0.' },
  { code: 'find . -name "*.log" | xargs grep "erro"', cat: 'find',
    pt: 'O caso clássico: grepar um conjunto de arquivos descoberto dinamicamente. Para segurança com espaços, -print0 | xargs -0.',
    en: 'The classic case: grep a file set discovered at runtime. For safety on spaced paths, -print0 | xargs -0.' },
  { code: 'find . -name "*.mp4" -exec ls -lh {} \\;', cat: 'find',
    pt: '-exec roda o comando a cada item, substituindo {} pelo caminho e \\; fechando cada execução. Mais controle que xargs; também mais lento.',
    en: '-exec runs a command per item, {} holding the path and \\; closing each run. More control than xargs, and slower.' },
  { code: 'find . -name "*.js" -print0 | xargs -0 grep -l "TODO"', cat: 'find',
    pt: '-print0 separa os resultados com NUL em vez de newline, e -0 lê de volta: caminhos com espaço, aspa e acento saem intactos.',
    en: '-print0 separates results with NUL instead of newline, and -0 reads it back: paths with spaces, quotes and accents survive intact.' },
  { code: 'find . -name "*.jpg" | xargs -I {} mv {} /backup/', cat: 'find',
    pt: '-I {} declara {} como placeholder: o comando roda uma vez POR item, substituindo {} em quantas posições precisar.',
    en: '-I {} declares {} as a placeholder: the command runs once PER item, replacing {} wherever it appears.' },

  // ─── sed — substituição & edição ────────────────────────────────────────
  { code: 'sed "s/erro/FALHA/" arquivo', cat: 'sed-sub',
    pt: 'Substitui a PRIMEIRA ocorrência de cada linha e imprime o resultado. O arquivo em si não muda (escreva com -i).',
    en: 'Replaces the FIRST occurrence per line and prints the result. The file itself stays untouched (write with -i).' },
  { code: 'sed "s/erro/FALHA/g" arquivo', cat: 'sed-sub',
    pt: 'O g final troca TODAS as ocorrências de cada linha. Sem g, só a primeira — o esquecimento mais comum do sed.',
    en: 'The trailing g swaps EVERY occurrence per line. Without g, only the first — the most common sed mistake.' },
  { code: 'sed "s/erro/FALHA/2" arquivo', cat: 'sed-sub',
    pt: 'O número troca só a N-ésima ocorrência de cada linha — aqui a 2ª. Controle fino por posição, entre só-primeira e global.',
    en: 'The number replaces only the N-th occurrence per line — here the 2nd. Fine positional control between first-only and global.' },
  { code: 'sed -i "s/erro/FALHA/g" arquivo', cat: 'sed-sub',
    pt: '-i reescreve o arquivo já editado (GNU). No macOS/BSD precisa de -i "" (ou um sufixo de backup). SEMPRE teste sem -i antes.',
    en: '-i rewrites the file in place (GNU). On macOS/BSD you need -i "" (or a backup suffix). ALWAYS test without -i first.' },
  { code: 'sed -i.bak "s/erro/FALHA/g" arquivo', cat: 'sed-sub',
    pt: '.bak vira o sufixo do arquivo de backup: arquivo.bak guarda o original antes da edição. O jeito seguro de rodar sed -i.',
    en: '.bak becomes the backup suffix: arquivo.bak keeps the original before editing. The safe way to run sed -i.' },
  { code: 'sed -E "s/[0-9]+/<num>/g" arquivo', cat: 'sed-sub',
    pt: '-E liga a regex estendida: +, (), | sem escape, como no grep -E. O modo moderno; o BRE pede \\+ e \\( \\).',
    en: '-E enables extended regex: +, (), | with no escaping, like grep -E. The modern mode; BRE wants \\+ and \\( \\).' },
  { code: "sed 's|/home/user|/home/dev|g' arquivo", cat: 'sed-sub',
    pt: 'Troque o delimitador (|, :, # ...) quando o padrão ou a substituição tiver / — evita a escada de barras invertidas.',
    en: 'Swap the delimiter (|, :, # ...) when the pattern or replacement holds / — avoids a staircase of backslashes.' },
  { code: 'sed -E "s/(erro)/[\\1]/g" arquivo', cat: 'sed-sub',
    pt: '\\1 relembra o grupo capturado: cola colchetes em volta de todo "erro". Com -E os parênteses dispensam a barra; \\1 não.',
    en: '\\1 refers back to the captured group, bracketing every "erro". With -E the parentheses need no backslash; \\1 still does.' },
  { code: 'sed -n "s/^DATE=//p" arquivo', cat: 'sed-sub',
    pt: '-n silencia a impressão automática; o p no fim imprime só as linhas que MUDARAM — o jeito de extrair/limpar um campo da linha.',
    en: '-n silences the automatic output; the trailing p prints only lines that CHANGED — how to extract/clean a field from a line.' },
  { code: 'sed "s/\\t/ /g" arquivo', cat: 'sed-sub',
    pt: '\\t é o tab (no sed GNU, além do POSIX): troca tabs por espaço — o começo de uma correção de indentação em lote.',
    en: '\\t is the tab (in GNU sed, beyond POSIX): swaps tabs for spaces — the start of a batch indentation fix.' },

  // ─── sed — impressão & deleção ─────────────────────────────────────────
  { code: 'sed -n "10p" arquivo', cat: 'sed-range',
    pt: '-n + p viram uma impressão sob demanda: esta imprime só a linha 10 do arquivo — sem cat + head + tail.',
    en: '-n + p become on-demand printing: this one outputs only line 10 — no cat + head + tail needed.' },
  { code: 'sed -n "20,30p" arquivo', cat: 'sed-range',
    pt: 'Faixa por posição: imprime as linhas 20 a 30 — o "recortar um trecho do log" por número de linha, não por conteúdo.',
    en: 'A positional range: prints lines 20 through 30 — slicing a slice of a log by line number, not content.' },
  { code: 'sed "1d" arquivo', cat: 'sed-range',
    pt: 'd deleta — aqui a linha 1. O padrão que remove o cabeçalho (first line) de um CSV/exportação.',
    en: 'd deletes — line 1 here. The go-to pattern to drop the header line of a CSV/export.' },
  { code: 'sed "$d" arquivo', cat: 'sed-range',
    pt: '$ marca o fim do arquivo; $d remove a ÚLTIMA linha (rodapé de relatório). Use aspas simples: em aspas duplas o shell expandiria o $.',
    en: '$ marks end-of-file; $d strips the LAST line (a report footer). Use single quotes: in double quotes the shell would expand the $.' },
  { code: 'sed "2,10d" arquivo', cat: 'sed-range',
    pt: 'Deleta a faixa de 2 a 10 — cortar cabeçalhos multilinha, blocos de assinatura, linhas de banner.',
    en: 'Deletes lines 2 through 10 — trimming multi-line headers, signature blocks, banner lines.' },
  { code: 'sed "/^#/d" arquivo', cat: 'sed-range',
    pt: 'Deleção por PADRÃO: linhas começando com # (comentários de config). A receita /pattern/d é deleção dirigida por regex.',
    en: 'Pattern-driven deletion: lines starting with # (config comments). The /pattern/d recipe is regex-based deletion.' },
  { code: 'sed -n "/BEGIN/,/END/p" arquivo', cat: 'sed-range',
    pt: 'Imprime do primeiro match de BEGIN até o de END — uma faixa definida por conteúdo: bloco de config, trecho de log.',
    en: 'Prints from the first BEGIN match through the END match — a content-delimited range: config block, log section.' },
  { code: 'sed "5q" arquivo', cat: 'sed-range',
    pt: 'q abandona a leitura após a linha 5 — cortar o arquivo pela frente de forma barata (não lê o resto).',
    en: 'q quits after line 5 — slicing off the front cheaply (nothing else gets read).' },
  { code: 'sed "/^$/d" arquivo', cat: 'sed-range',
    pt: '/^$/ casa a linha vazia: remove todas — o "limpa linhas em branco" de arquivos exportados por ferramentas.',
    en: '/^$/ matches an empty line: drops them all — the blank-line cleaner for files exported by tools.' },
  { code: 'sed -n "1~2p" arquivo', cat: 'sed-range',
    pt: 'A notação ~N (GNU) imprime da linha inicial em diante, pulando N: 1~2 = linhas ímpares, 2~2 = pares.',
    en: 'The ~N notation (GNU) prints from a starting line, stepping N: 1~2 = odd lines, 2~2 = even ones.' },

  // ─── awk — campos & padrões ─────────────────────────────────────────────
  { code: "awk '{print $1}' arquivo", cat: 'awk-fields',
    pt: '$1 é o primeiro CAMPO de cada linha, quebrada por espaços/tabs; $0 é a linha inteira. O "pega a coluna 1" do awk.',
    en: '$1 is the first FIELD of each line, split on spaces/tabs; $0 is the whole line. awk\'s "grab column 1".' },
  { code: "awk '{print $1, $3}' arquivo", cat: 'awk-fields',
    pt: 'Vários campos numa saída, separados por vírgula. Envolva o programa inteiro em aspas simples — sempre.',
    en: 'Multiple fields in one output row, separated by commas. Single-quote the entire awk program — always.' },
  { code: 'awk -F: \'{print $1}\' /etc/passwd', cat: 'awk-fields',
    pt: '-F troca o separador: dois pontos aqui, a vírgula de um CSV com -F,. É o mesmo que BEGIN{FS=":"} dentro do programa.',
    en: '-F swaps the separator: colons here, a CSV comma as -F,. Same as BEGIN{FS=":"} inside the program.' },
  { code: "awk '{print NR, $0}' arquivo", cat: 'awk-fields',
    pt: 'NR é o número da LINHA atual (começa em 1) — o "numerador de documento": número + linha inteira.',
    en: 'NR is the current LINE number (1-based) — the document numberer: line number plus the whole line.' },
  { code: "awk '{print NF, $NF}' arquivo", cat: 'awk-fields',
    pt: 'NF = quantidade de campos da linha atual e $NF = o ÚLTIMO campo. O par que responde "quantas colunas / última coluna".',
    en: 'NF is the field count of the current line and $NF is the LAST field. The pair answering "how many columns / last column".' },
  { code: "awk -v ano=2026 '$1 == ano' arquivo", cat: 'awk-fields',
    pt: '-v injeta uma variável de fora no programa (aqui ano=2026): o $1 continua protegido pelas aspas, mas o valor vem do shell.',
    en: '-v injects an outside variable into the program (here ano=2026): $1 stays quoted while the value comes from the shell.' },
  { code: "awk '$3 > 1000' arquivo", cat: 'awk-fields',
    pt: 'Padrão sem bloco: quando a condição vale para a linha, o awk imprime a linha inteira — o filtro por coluna.',
    en: 'A pattern with no block: when the condition holds for a line, awk prints the whole line — column filtering.' },
  { code: "awk 'NR == 1 || /erro/' arquivo", cat: 'awk-fields',
    pt: '|| combina condições e /regex/ também vale como condição: aqui, a primeira linha (header) ou qualquer linha com "erro".',
    en: '|| chains conditions and /regex/ works as one too: here, the first line (the header) or any line holding "erro".' },
  { code: "awk 'length($0) > 80' arquivo", cat: 'awk-fields',
    pt: 'length() conta caracteres — achar linhas acima de 80 para refatorar. A linha aprovada imprime implicitamente.',
    en: 'length() counts characters — spotting the >80-char lines to refactor. Matching lines print implicitly.' },
  { code: "awk 'NR % 2 == 0' arquivo", cat: 'awk-fields',
    pt: 'Aritmética sobre NR: linhas pares. Quer linhas alternadas? Use NR % 2 == 1 para as ímpares.',
    en: 'Math on NR: even lines. Want alternating rows? Use NR % 2 == 1 for the odd ones.' },

  // ─── awk — agregação & formatação ───────────────────────────────────────
  { code: "awk '{s += $2} END {print s}' arquivo", cat: 'awk-aggregate',
    pt: 'O esqueleto de soma: acumule numa variável por linha e o bloco END roda depois de tudo — o total da coluna 2.',
    en: 'The summation skeleton: accumulate into a variable per line, and the END block runs after everything — the total of column 2.' },
  { code: "awk '{s += $2; c++} END {print s/c}' arquivo", cat: 'awk-aggregate',
    pt: 'Soma + contador da média: guarde a contagem ao lado e divida no fim. O c serve quando você filtra (aí NR não vale).',
    en: 'Sum plus a counter for the average: tally the count alongside and divide at the end. c works when you filter (NR wouldn\'t).' },
  { code: "awk '{a[$1]++} END {for (k in a) print k, a[k]}' arquivo", cat: 'awk-aggregate',
    pt: 'O contador por CHAVE: a[$1]++ acumula por primeiro campo — distribuição de ocorrências por categoria, com o sort/uniq embutido.',
    en: 'Per-key tally: a[$1]++ accumulates by the first field — an occurrence distribution by category, sort/uniq included.' },
  { code: "awk '!seen[$0]++' arquivo", cat: 'awk-aggregate',
    pt: 'Deduplica mantendo a ORDEM: a linha sai apenas quando a contagem dela vai de 0 para 1 — o "uniq da ordem original".',
    en: 'Deduplicates keeping the ORDER: a line prints only when its count goes 0→1 — "uniq of the original order".' },
  { code: "awk '{if ($1 > max) max = $1} END {print max}' arquivo", cat: 'awk-aggregate',
    pt: 'Máximo com um if: atualize a variável enquanto percorre. Troque o sinal e o mesmo esqueleto devolve o mínimo.',
    en: 'Max with an if: update the accumulator as you scan. Flip the comparison and the same skeleton yields the minimum.' },
  { code: 'awk \'BEGIN {FS = ","} {print $1}\' arquivo', cat: 'awk-aggregate',
    pt: 'BEGIN roda UMA vez antes de ler o arquivo — aqui prepara o separador de campos. Igual a -F, útil quando ele muda no meio do script.',
    en: 'BEGIN runs once before reading — here it prepares the field separator. Same as -F, handy when it changes mid-script.' },
  { code: "awk '{printf \"%8.2f\\n\", $2}' arquivo", cat: 'awk-aggregate',
    pt: 'printf formata com largura e precisão: %8.2f alinha em 8 caracteres com 2 casas decimais — o exportador de planilha.',
    en: 'printf formats with width and precision: %8.2f right-aligns to 8 chars with 2 decimals — awk\'s spreadsheet export.' },
  { code: "awk '{print toupper($1), tolower($2)}' arquivo", cat: 'awk-aggregate',
    pt: 'Funções de string embutidas — toupper/tolower/length/substr/index. Trocar a caixa de uma coluna sem sed por cima.',
    en: 'Built-in string functions — toupper/tolower/length/substr/index. Re-case a column with no extra sed layer.' },
  { code: "awk '{print substr($2, 1, 3)}' arquivo", cat: 'awk-aggregate',
    pt: 'substr(texto, início, tamanho) recorta um pedaço do campo — prefixos, códigos, iniciais e tokens resumidos.',
    en: 'substr(text, start, len) clips a chunk out of a field — prefixes, codes, initials and shortened tokens.' },
  { code: "awk 'NR >= 2 {linhas++} END {print linhas}' arquivo", cat: 'awk-aggregate',
    pt: 'Contar linhas de dados: pula o cabeçalho com NR >= 2 e soma no fim — NR puro só vale quando todas as linhas são dados.',
    en: 'Count data rows: skip the header with NR >= 2 and tally at the end — plain NR only when every line is data.' },

  // ─── Pipelines & receitas ───────────────────────────────────────────────
  { code: "grep -v '^#' config.conf | grep -v '^$'", cat: 'recipes',
    pt: 'Limpador de config: remove comentários (#) e linhas vazias — sobra só o que interessa para o olho ou para o próximo pipe.',
    en: 'Config cleaner: drop comment (#) and blank lines — only the relevant lines survive for your eyes or the next pipe.' },
  { code: 'ps aux | grep node | grep -v grep', cat: 'recipes',
    pt: 'Achar processos pelo comando. O próprio pipeline casa a linha do grep — por isso o -v grep extra (ou prefira pgrep -f node).',
    en: 'Find processes by command. The pipeline matches grep\'s own line — hence the extra -v grep (or just use pgrep -f node).' },
  { code: 'tail -f app.log | grep --line-buffered ERROR', cat: 'recipes',
    pt: '--line-buffered desliga o buffer de bloco do grep: cada nova linha do tail -f aparece na hora, em vez de sair em rajada.',
    en: '--line-buffered disables grep\'s block buffering: each fresh tail -f line shows up immediately, not in bursts.' },
  { code: 'grep -oE "status=[A-Z]+" app.log | sort | uniq -c | sort -rn', cat: 'recipes',
    pt: 'O pipeline de RANKING: -o extrai o campo, sort + uniq -c conta as ocorrências e o segundo sort -rn põe o maior no topo.',
    en: 'The ranking pipeline: -o extracts the field, sort | uniq -c counts, and the second sort -rn puts the biggest first.' },
  { code: 'cut -d: -f1 /etc/passwd', cat: 'recipes',
    pt: 'cut é a "awk rápida" para o caso simples: -d delimita e -f escolhe o campo. Sem expressões — só coluna.',
    en: 'cut is a quick-awk for simple cases: -d delimits and -f picks the field. No expressions — just columns.' },
  { code: 'cut -c1-80 arquivo', cat: 'recipes',
    pt: '-c1-80 mantém só os primeiros 80 CARACTERES de cada linha — truncar logs gigantes e largos em algo legível.',
    en: '-c1-80 keeps only the first 80 CHARACTERS per line — trimming giant wide logs into something readable.' },
  { code: "tr ',' ';' < dados.csv", cat: 'recipes',
    pt: 'tr traduz caracteres um-a-um: vírgula vira ponto-e-vírgula (o delimitador brasileiro). Faixas também: tr a-z A-Z, com < lendo do arquivo.',
    en: 'tr maps characters one-to-one: comma to semicolon (the pt-BR delimiter). Ranges too: tr a-z A-Z, with < reading from the file.' },
  { code: 'grep "erro" app.log 2>&1 | tee saida.txt', cat: 'recipes',
    pt: '2>&1 junta o stderr no stdout (senão o grep nunca vê o erro) e o tee salva E continua imprimindo — duplicar o fluxo para duas pontas.',
    en: '2>&1 merges stderr into stdout (otherwise grep never sees errors) while tee saves AND keeps printing — duplicating the stream.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de grep/sed/awk',
    intro: (
      <>
        Os três filtros do shell que você usa para espremer texto todo dia —
        procurar (<Text code>grep</Text>), reescrever (<Text code>sed</Text>) e
        calcular/agrupar (<Text code>awk</Text>), mais o <Text code>find</Text>/
        <Text code>xargs</Text> para varrer pastas. Cada entrada traz o comando
        pronto para colar e o que ele faz.
      </>
    ),
    search: 'Buscar por comando, opção ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Pegadinhas que pegam todo mundo',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>grep é BRE por padrão</Text> — no modo básico,{' '}
          <Text code>+</Text>, <Text code>|</Text>, <Text code>?</Text> e{' '}
          <Text code>(</Text> precisam de barra invertida. Prefira{' '}
          <Text code>-E</Text> (ERE); o <Text code>-P</Text> (PCRE) não existe em
          todo lugar (macOS usa o grep BSD). Uso sempre aspas simples em volta do
          padrão — em aspas duplas o shell expande <Text code>$var</Text> e{' '}
          <Text code>*</Text> antes do grep ver.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>grep -c</Text> conta LINHAS, não ocorrências — para contar
          de verdade use <Text code>grep -o ... | wc -l</Text>. E o grep só lê o{' '}
          <Text code>stdout</Text>; para procurar em erro redirecione{' '}
          <Text code>{'2>&1'}</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>O sed não escreve no arquivo sem</Text> <Text code>-i</Text>{' '}
          — e um <Text code>-i</Text> sem backup é destrutivo: teste sempre antes
          e use <Text code>-i.bak</Text> (no BSD/macOS, <Text code>-i ""</Text>).{' '}
          <Text code>s///</Text> troca só a primeira ocorrência por linha; o{' '}
          <Text code>g</Text> no fim é o que troca todas.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          No <Text strong>awk</Text>, <Text code>$1</Text> é campo e precisa ficar
          DENTRO do programa em aspas simples — fora, o shell o comeria.{' '}
          <Text code>NF</Text>/<Text code>NR</Text>/<Text code>$0</Text> são
          variáveis embutidas e <Text code>-F</Text> (ou{' '}
          <Text code>BEGIN&#123;FS=...&#125;</Text>) troca o separador. E{' '}
          <Text code>find | xargs</Text> quebra em caminhos com espaço — use{' '}
          <Text code>-print0 | xargs -0</Text>.
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
    title: 'grep/sed/awk Cheat Sheet',
    intro: (
      <>
        The three shell filters you use to squeeze text every day — searching (
        <Text code>grep</Text>), rewriting (<Text code>sed</Text>) and computing /
        grouping (<Text code>awk</Text>), plus <Text code>find</Text>/
        <Text code>xargs</Text> to comb folders. Each entry carries the copy-ready
        command and what it does.
      </>
    ),
    search: 'Search by command, option or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'Gotchas that catch everyone',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>grep is BRE by default</Text> — in basic mode{' '}
          <Text code>+</Text>, <Text code>|</Text>, <Text code>?</Text> and{' '}
          <Text code>(</Text> need a backslash. Prefer <Text code>-E</Text> (ERE);
          <Text code>-P</Text> (PCRE) is not everywhere (macOS ships BSD grep).
          Always wrap the pattern in single quotes — in double quotes the shell
          expands <Text code>$var</Text> and <Text code>*</Text> before grep sees
          them.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>grep -c</Text> counts LINES, not occurrences — for real
          counts use <Text code>grep -o ... | wc -l</Text>. And grep only reads{' '}
          <Text code>stdout</Text>; to search errors, redirect with{' '}
          <Text code>{'2>&1'}</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>sed won\'t write the file without</Text> <Text code>-i</Text>{' '}
          — and a bare <Text code>-i</Text> is destructive: always test first and
          use <Text code>-i.bak</Text> (BSD/macOS wants <Text code>-i ""</Text>).{' '}
          <Text code>s///</Text> replaces only the first occurrence per line; the
          trailing <Text code>g</Text> is what swaps them all.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          In <Text strong>awk</Text>, <Text code>$1</Text> is a field and must stay
          INSIDE the single-quoted program — outside, the shell eats it.{' '}
          <Text code>NF</Text>/<Text code>NR</Text>/<Text code>$0</Text> are
          built-in variables and <Text code>-F</Text> (or{' '}
          <Text code>BEGIN&#123;FS=...&#125;</Text>) changes the separator. And{' '}
          <Text code>find | xargs</Text> breaks on paths with spaces — use{' '}
          <Text code>-print0 | xargs -0</Text>.
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

export default function GrepSedAwkCheatsheetPage() {
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
    const header = '# grep/sed/awk (cheat sheet)\n\n'
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