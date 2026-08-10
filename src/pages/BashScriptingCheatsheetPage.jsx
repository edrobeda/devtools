import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['fund', 'vars', 'cond', 'loops', 'arr', 'func', 'heredoc', 'recipes']

const CATEGORY_COLOR = {
  fund: 'blue',
  vars: 'cyan',
  cond: 'geekblue',
  loops: 'purple',
  arr: 'magenta',
  func: 'green',
  heredoc: 'volcano',
  recipes: 'gold',
}

const labelOf = {
  fund: { pt: 'Fundamentos', en: 'Fundamentals' },
  vars: { pt: 'Variáveis & expansão', en: 'Variables & expansion' },
  cond: { pt: 'Condicionais', en: 'Conditionals' },
  loops: { pt: 'Loops', en: 'Loops' },
  arr: { pt: 'Arrays & strings', en: 'Arrays & strings' },
  func: { pt: 'Funções', en: 'Functions' },
  heredoc: { pt: 'Here-docs & pipes', en: 'Here-docs & pipes' },
  recipes: { pt: 'Receitas do dia a dia', en: 'Everyday recipes' },
}

const ITEMS = [
  // ─── Fundamentos ─────────────────────────────────────────────────────
  { code: '#!/usr/bin/env bash', cat: 'fund',
    pt: 'A primeira linha de todo script. o hardcode `/bin/bash` quebra em sistemas que instalam o bash em outro lugar; `env` acha o binário no PATH.',
    en: 'The first line of every script. Hardcoding `/bin/bash` breaks on systems where bash lives elsewhere; `env` finds the binary via PATH.' },
  { code: 'chmod +x script.sh && ./script.sh', cat: 'fund',
    pt: 'Deixa o script executável e roda do diretório atual. O `./` é obrigatório — o shell não procura no "." por padrão (segurança anti-trojan).',
    en: 'Makes the script executable and runs it from the current dir. The `./` is required — the shell does not search "." by default (anti-trojan).' },
  { code: 'set -euo pipefail', cat: 'fund',
    pt: 'O "modo seguro" que abre todo script: `-e` aborta no primeiro erro, `-u` reclama variável não definida e `pipefail` faz o pipeline falhar se qualquer etapa falhar.',
    en: 'The safety header of every script: `-e` aborts on the first error, `-u` complains about unset variables and `pipefail` makes the pipeline fail if any stage fails.' },
  { code: 'echo $?', cat: 'fund',
    pt: 'Código de saída do ÚLTIMO comando: 0 = sucesso, qualquer outra coisa = erro. `exit 5` encerra o script com o código que você escolher.',
    en: 'Exit code of the LAST command: 0 = success, anything else = error. `exit 5` ends the script with the code you choose.' },
  { code: 'cd build && npm ci && npm run build', cat: 'fund',
    pt: '`&&` só roda o próximo comando se o anterior deu certo (o `;` roda sempre). `||` roda o que vem depois quando o anterior FALHA.',
    en: '`&&` only runs the next command if the previous succeeded (`;` always runs). `||` runs what follows when the previous FAILS.' },
  { code: 'echo "script: $0, args: $#, primeiro: $1"', cat: 'fund',
    pt: 'Argumentos posicionais: `$1`…`$9` são os passados pela linha de comando (o resto com `${10}`), `$#` conta quantos são e `$0` é o nome do script.',
    en: 'Positional arguments: `$1`…`$9` are the ones passed on the command line (the rest as `${10}`), `$#` counts them and `$0` is the script name.' },
  { code: 'docker build -t app . || { echo "build falhou"; exit 1; }', cat: 'fund',
    pt: 'O fallback em grupo: se o comando falhar, imprima a mensagem e aborte — útil pra encadear uma checagem antes de seguir.',
    en: 'Grouped fallback: if the command fails, print the message and abort — handy to gate a check before proceeding.' },

  // ─── Variáveis & expansão ─────────────────────────────────────────────
  { code: 'nome="Mundo"', cat: 'vars',
    pt: 'Atribuição NUNCA tem espaço em volta do `=`: `nome = x` vira dois comandos e `nome= x` tenta rodar o comando x com a variável no ambiente.',
    en: 'Assignment NEVER has spaces around `=`: `nome = x` becomes two commands and `nome= x` tries to run command x with the var exported to it.' },
  { code: 'echo "Oi, $nome"  # Oi, Mundo\necho \'Oi, $nome\'  # Oi, $nome', cat: 'vars',
    pt: 'Aspas duplas EXPANDEM variáveis; aspas simples mantêm o literal — o inglês "double quotes interpolate, single quotes preserve".',
    en: 'Double quotes EXPAND variables; single quotes keep the literal — "double quotes interpolate, single quotes preserve".' },
  { code: 'echo "${nome:-visitante}"', cat: 'vars',
    pt: 'Expansão com default: usa `visitante` se a variável estiver vazia OU indefinida — ler configuração sem quebrar o script.',
    en: 'Default expansion: uses `visitante` if the variable is empty OR unset — reading a config without breaking the script.' },
  { code: 'echo "${nome:=default}"', cat: 'vars',
    pt: 'Igual ao `:-` mas AINDA atribui o default à variável — útil na primeira leitura de um valor que será reusado depois.',
    en: 'Same as `:-` but ALSO assigns the default to the variable — useful when the value is read once and reused later.' },
  { code: ': "${MODE:?exporte MODE}"', cat: 'vars',
    pt: 'Aborta com a mensagem se a variável estiver vazia ou indefinida — o "fail fast" de config obrigatória (o `:` descarta a saída).',
    en: 'Aborts with the message if the variable is empty or unset — fail-fast for required config (the `:` discards the output).' },
  { code: 'echo $(( 3 * 4 + 2 ))  # 14', cat: 'vars',
    pt: 'Aritmética de inteiros com `$(( ))` — sem `expr`, sem substring mágica. Suporta `+ - * / % **` e variáveis.',
    en: 'Integer arithmetic with `$(( ))` — no expr, no magic substrings. Supports `+ - * / % **` and variables.' },
  { code: 'echo "${#nome}"', cat: 'vars',
    pt: 'Tamanho da string em caracteres. Em array o mesmo operador dá o tamanho do PRIMEIRO elemento (o tamanho do array é `${#arr[@]}`).',
    en: 'String length in characters. On an array the same operator gives the FIRST element\'s length (the array length is `${#arr[@]}`).' },
  { code: 'echo "${nome:2:4}"  # 4 chars a partir do índice 2', cat: 'vars',
    pt: 'Fatia de string: `:inicio:comprimento` — aqui 4 caracteres a partir do índice 2 (base 0). Só `:2` pega do índice 2 até o fim.',
    en: 'String slice: `:start:length` — here 4 chars from index 2 (0-based). Plain `:2` takes index 2 to the end.' },
  { code: 'echo "${nome#prefixo}"  # remove prefixo\necho "${nome%sufixo}"  # remove sufixo', cat: 'vars',
    pt: 'Remove o MENOR prefixo (`#`) ou sufixo (`%`) que casar — os irmãos `##`/`%%` removem o MAIOR. A base de todo manipulação de nome de arquivo.',
    en: 'Removes the SHORTEST matching prefix (`#`) or suffix (`%`) — the siblings `##`/`%%` remove the LONGEST. The base of all filename munging.' },
  { code: 'echo "${var//a/b}"  # troca todas\necho "${var/a/b}"  # troca uma', cat: 'vars',
    pt: 'Substituição: `//` troca TODAS as ocorrências, uma `/` troca só a primeira — sanitizar texto ou nomes sem tocar no resto.',
    en: 'Replacement: `//` swaps ALL occurrences, a single `/` swaps only the first — sanitizing text or names without touching the rest.' },
  { code: 'for a in "$@"; do echo "arg: $a"; done', cat: 'vars',
    pt: '`"$@"` entrega cada argumento como um item PRÓPRIO, preservando espaços — o loop de argumentos correto. `shift` descarta o `$1` e empurra o resto.',
    en: '`"$@"` delivers each argument as its OWN item, preserving spaces — the correct argument loop. `shift` drops `$1` and shifts the rest.' },
  { code: 'agora=$(date +%F)', cat: 'vars',
    pt: 'Command substitution `$( )`: roda o comando e captura o stdout numa variável — o jeito moderno (aninha!), no lugar dos velhos backticks.',
    en: 'Command substitution `$( )`: runs the command and captures its stdout into a variable — the modern way (it nests!), replacing old backticks.' },

  // ─── Condicionais ────────────────────────────────────────────────────
  { code: 'if [[ -f "$arquivo" ]]; then\n  echo "existe"\nelif [[ -d "$arquivo" ]]; then\n  echo "é pasta"\nfi', cat: 'cond',
    pt: 'O teste clássico: `if` + condição + `then`, `elif` opcionais e `fi` fechando. O `[[ ... ]]` é a forma bash (veja o item seguinte).',
    en: 'The classic test: `if` + condition + `then`, optional `elif`s and `fi` closes it. `[[ ... ]]` is the bash form (see next entry).' },
  { code: '[[ "$a" == "b c" && -f x ]]', cat: 'cond',
    pt: 'O `[[ ]]` do bash é superior ao `[ ]` POSIX: não faz word-splitting nas variáveis, aceita `&&`/`||`/`=~`/`< >` por DENTRO e não precisa escapar parênteses.',
    en: 'Bash\'s `[[ ]]` beats POSIX `[ ]`: no word-splitting on variables, supports `&&`/`||`/`=~`/`< >` INSIDE it and needs no paren escaping.' },
  { code: 'if [[ -f f ]] || [[ -d d && -x e ]]; then :; fi', cat: 'cond',
    pt: 'Testes de arquivo do mais usado ao raro: `-f` arquivo regular, `-d` diretório, `-e` existe, `-x` executável, `-w` gravável, `-s` não-vazio.',
    en: 'File tests from most to least used: `-f` regular file, `-d` directory, `-e` exists, `-x` executable, `-w` writable, `-s` non-empty.' },
  { code: '[[ -z "$nome" ]] && echo "vazio"\n[[ "a" < "b" ]] && echo "ordem lex"', cat: 'cond',
    pt: 'Testes de string: `-z` vazia, `-n` não-vazia, `==`/`!=` igualdade e `<`/`>` comparação LEXICOGRÁFICA (só no `[[ ]]`; sempre com aspas).',
    en: 'String tests: `-z` empty, `-n` non-empty, `==`/`!=` equality and `<`/`>` LEXICOGRAPHIC order (only in `[[ ]]`; always quoted).' },
  { code: '[[ 10 -gt 5 ]] && echo "maior"', cat: 'cond',
    pt: 'Testes numéricos: `-eq -ne -lt -gt -le -ge` — o operador literal porque em `[[ ]]` um `<` ao lado de um número vira comparação de string.',
    en: 'Numeric tests: `-eq -ne -lt -gt -le -ge` — the spelled-out operators because in `[[ ]]` a literal `<` next to a number becomes string comparison.' },
  { code: 'if [[ "$email" =~ ^[a-z]+@ ]]', cat: 'cond',
    pt: '`=~` casa por regex (like grep -E): o operador que transforma o `if` num validador de formato — e-mail, URL, semáforo de semver.',
    en: '`=~` matches a regex (like grep -E): the operator that turns `if` into a format validator — email, URL, semantic-version gate.' },
  { code: '[[ -f "a" && -r "a" && -w "b" ]] || echo "sem permissão"', cat: 'cond',
    pt: '`!` nega um teste e `&&`/`||` encadeiam condições inteiras dentro do `[[ ]]` — negocia permissões antes de agir.',
    en: '`!` negates a test and `&&`/`||` chain whole conditions inside `[[ ]]` — negotiate permissions before acting.' },
  { code: 'case "$1" in\n  -v|--verbose) VERBOSE=1;;\n  -h|--help) print_help; exit 0;;\n  *) echo "uso: $0 [-v|-h]"; exit 1;;\nesac', cat: 'cond',
    pt: 'O switch do shell: casa o valor contra padrões em ordem até um `;;`; `*)` é o default. O jeito natural de parsear flags simples.',
    en: 'The shell switch: matches the value against patterns in order until `;;`; `*)` is the default. The natural way to parse simple flags.' },
  { code: '[[ "$a" == "$b" ]] && echo igual || echo diferente', cat: 'cond',
    pt: 'O ternário em uma linha: se a condição vale imprime `igual`, senão `diferente`. Cuidado: o `||` também dispara se o PRIMEIRO `echo` falhar.',
    en: 'The one-liner ternary: if the condition holds it prints `igual`, otherwise `diferente`. Caveat: `||` also fires if the FIRST `echo` fails.' },

  // ─── Loops ────────────────────────────────────────────────────────────
  { code: 'for f in *.txt; do echo "$f"; done', cat: 'loops',
    pt: 'Itera sobre cada item da lista após o `in` — globs, palavras, outputs. Aqui, um nome de arquivo .txt de cada vez.',
    en: 'Iterates over each item of the list after `in` — globs, words, command outputs. Here, one .txt filename at a time.' },
  { code: 'for i in {1..10}; do echo "passo $i"; done', cat: 'loops',
    pt: 'Faixa fixa com `{n..m}` (funciona com letras também). Para limites que vêm de variável use `$(seq 1 $n)`.',
    en: 'Fixed range with `{n..m}` (letters work too). For bounds coming from a variable use `$(seq 1 $n)`.' },
  { code: 'for ((i = 0; i < 10; i++)); do echo $i; done', cat: 'loops',
    pt: 'O for estilo C do bash: inicialização, condição e incremento em aritmética — bom quando os passos não são de 1 em 1.',
    en: 'Bash\'s C-style for: init, condition and increment in arithmetic — handy when the steps are not 1 by 1.' },
  { code: 'while IFS= read -r linha; do echo "-> $linha"; done < dados.txt', cat: 'loops',
    pt: 'Ler arquivo linha a linha SEM engasgar: `-r` preserva backslashes e `IFS=` evita cortar os espaços das pontas da linha.',
    en: 'Read a file line by line without choking: `-r` keeps backslashes and `IFS=` prevents stripping leading/trailing spaces.' },
  { code: 'until curl -sf https://api.exemplo/health >/dev/null; do\n  sleep 5\ndone\necho "serviço de pé"', cat: 'loops',
    pt: '`until` roda ENQUANTO a condição falhar — o clássico "espera o serviço subir": o loop só termina quando o curl der certo. O irmão `while` roda enquanto a condição valer.',
    en: '`until` runs WHILE the condition fails — the classic "wait for the service to come up": the loop ends only when curl succeeds. Its sibling `while` runs while its condition holds.' },
  { code: 'for i in {1..10}; do\n  [[ $i == 5 ]] && continue\n  [[ $i == 9 ]] && break\n  echo $i\ndone', cat: 'loops',
    pt: '`continue` pula para a próxima volta (aqui, o 5 não é impresso); `break` sai do loop (aqui, para no 9). Ambos aceitam `break 2` pra sair de loops aninhados.',
    en: '`continue` skips to the next iteration (here 5 is not printed); `break` leaves the loop (here it stops at 9). Both take `break 2` to exit nested loops.' },

  // ─── Arrays & strings ─────────────────────────────────────────────────
  { code: 'arr=(um dois tres)\necho "${arr[1]}"  # dois', cat: 'arr',
    pt: 'Cria o array com `( )` e acessa por índice a partir de 0 — `[1]` é o SEGUNDO elemento. Acessar fora da faixa devolve vazio, sem erro.',
    en: 'Create the array with `( )` and index starting at 0 — `[1]` is the SECOND element. Indexing out of range yields empty, not an error.' },
  { code: 'for x in "${arr[@]}"; do echo "$x"; done', cat: 'arr',
    pt: 'Iterar os ELEMENTOS intactos: o `"${arr[@]}"` com aspas preserva valores que tenham espaço — sem aspas, cada espaço quebra em pedaços.',
    en: 'Iterate the ELEMENTS intact: quoted `"${arr[@]}"` preserves values with spaces — unquoted, every space breaks into chunks.' },
  { code: 'arr+=(quatro)', cat: 'arr',
    pt: 'Adiciona um elemento no fim — o `+=`. Em bash antigo o equivalente era `arr[${#arr[@]}]=x`.',
    en: 'Appends an element — the `+=`. In old bash the equivalent was `arr[${#arr[@]}]=x`.' },
  { code: 'echo "${#arr[@]}"  # 3', cat: 'arr',
    pt: 'Número de elementos do array. Armadilha clássica: `${#arr}` dá o tamanho do PRIMEIRO elemento (não o do array).',
    en: 'Number of elements in the array. Classic trap: `${#arr}` gives the FIRST element\'s length (not the array\'s).' },
  { code: 'arr[1]=meio\nunset arr[2]', cat: 'arr',
    pt: 'Sobrescreve um índice e remove outro — os demais ficam nos seus lugares, SEM reindexar (o array não "compacta" os buracos).',
    en: 'Overwrites an index and removes another — the rest stay in place, with NO reindexing (the array does not compact holes).' },
  { code: 'declare -A mapa\nmapa["brasil"]="São Paulo"\necho "${mapa[brasil]}"', cat: 'arr',
    pt: 'Array associativo (bash 4+): o "dicionário" indexado por string — perfeito pra contagens por chave e lookup por nome.',
    en: 'Associative array (bash 4+): the string-indexed dictionary — perfect for per-key counts and lookups by name.' },
  { code: 'echo "${msg^^} ${msg,,}"', cat: 'arr',
    pt: 'Maiúsculas (`^^`) e minúsculas (`,,`) na string inteira — `^`/`,` só no primeiro caractere e `~` faz o case swap. Bash 4+ sem tools externos.',
    en: 'Uppercase (`^^`) and lowercase (`,,`) over the whole string — `^`/`,` for just the first char and `~` toggles case. Bash 4+, no external tools.' },

  // ─── Funções ──────────────────────────────────────────────────────────
  { code: 'saudar() {\n  echo "oi, $1"\n}\nsaudar Alice', cat: 'func',
    pt: 'Função com o primeiro argumento em `$1` — as mesmas regras dos args do script. Declare antes de chamar; o corpo não é um subprocesso.',
    en: 'A function with its first argument in `$1` — same rules as script args. Declare before you call; the body is not a subprocess.' },
  { code: 'funcao() {\n  local tmp="/tmp/x"\n  echo "dentro: $tmp"\n}\nfuncao\necho "fora: $tmp"  # vazio — local não vaza', cat: 'func',
    pt: '`local` declara a variável SÓ para o corpo da função — aqui `tmp` existe dentro de `funcao` mas não fora dela. Sem `local`, a variável vira global e vaza pro chamador.',
    en: '`local` declares the variable ONLY for the function body — here `tmp` exists inside `funcao` but not outside it. Without `local`, the variable becomes global and leaks to the caller.' },
  { code: 'tem_erro() { return 1; }\ntem_erro && echo ok || echo falhou', cat: 'func',
    pt: '`return N` seta o código de saída da função (`$?` no chamador) — o jeito de sinalizar sucesso/fracasso em condicional. O texto "de volta" vai pelo echo.',
    en: '`return N` sets the function\'s exit code (`$?` at the caller) — how to signal success/failure in a conditional. Returning TEXT goes via echo.' },
  { code: 'result=$(minha_funcao argumento)', cat: 'func',
    pt: 'Capturar o stdout da função como "retorno" — o jeito canônico de devolver dados: qualquer `echo` dentro da função vira o valor fora.',
    en: 'Capture the function\'s stdout as its "return" — the canonical way to return data: any `echo` inside the function becomes the value outside.' },
  { code: 'mostra() { local n="${1:-sem_nome}"; echo "oi, $n"; }\nmostra', cat: 'func',
    pt: 'Argumento com default: `$1` cai no fallback `sem_nome` quando nada é passado — evita o script quebrar com `set -u`.',
    en: 'Argument with a default: `$1` falls back to `sem_nome` when nothing is passed — avoids breaking the script under `set -u`.' },
  { code: 'export -f minha_funcao\nbash -c \'minha_funcao arg1\'', cat: 'func',
    pt: 'Exporta a função pra um shell filho — o truque pra usar funções com `xargs`, `env`, `su` ou `bash -c` fora do script.',
    en: 'Exports the function to a child shell — the trick for using functions with `xargs`, `env`, `su` or `bash -c` outside the script.' },

  // ─── Here-docs & pipes ───────────────────────────────────────────────
  { code: 'cat <<EOF\nOlá, $nome — hoje é $(date +%F)\nEOF', cat: 'heredoc',
    pt: 'Here-doc: entrega o bloco literal ao comando, mas EXPANDE variáveis e substituições dentro dele — montar e-mail, HTML, config.',
    en: 'Here-doc: feeds the literal block to the command, but EXPANDS variables and substitutions inside it — building email, HTML, config.' },
  { code: 'cat <<\'EOF\'\n$nao_expande nem $(isto)\nEOF', cat: 'heredoc',
    pt: 'O here-doc ASPADO: o delimitador entre aspas simples desliga TODAS as expansões — gere documentação/exemplos com `$`/backtick sem risco.',
    en: 'The QUOTED here-doc: a single-quoted delimiter disables ALL expansions — generate docs/examples containing `$`/backticks without risk.' },
  { code: 'cat <<EOF >> debug.log\n{ "status": "ok" }\nEOF', cat: 'heredoc',
    pt: 'Here-doc anexando ao fim de um arquivo com `>>` (ou `>` pra sobrescrever) — log estruturado sem abrir editor nem `echo` linha a linha.',
    en: 'Here-doc appending to a file with `>>` (or `>` to overwrite) — structured logs without opening an editor or echoing line by line.' },
  { code: 'grep -i apikey <<< "$CONFIG"', cat: 'heredoc',
    pt: 'Here-string `<<<`: alimenta a string direto no stdin do comando — sem `printf |` nem arquivo temporário pra um único valor.',
    en: 'Here-string `<<<`: feeds the string straight into the command\'s stdin — no `printf |` nor temp file for a single value.' },
  { code: 'diff <(ls dir1) <(ls dir2)', cat: 'heredoc',
    pt: 'Process substitution `<(...)`: o comando de dentro roda e o resultado é tratado COMO ARQUIVO — compare listas, passe pipe pra tools que exigem arquivo.',
    en: 'Process substitution `<(...)`: the inner command runs and its output becomes a FILE — compare listings, feed pipes to tools that demand a file.' },
  { code: 'cmd > saida.log 2>&1', cat: 'heredoc',
    pt: 'Stdout pro arquivo E stderr pro MESMO lugar. A ORDEM IMPORTA: `2>&1 > log` copia o stderr pro terminal antigo e NÃO pra log.',
    en: 'Stdout to file AND stderr to the SAME place. ORDER MATTERS: `2>&1 > log` copies stderr to the old terminal, not to the log.' },
  { code: '{ cmd1; cmd2; } 2>erros.log | tee geral.log', cat: 'heredoc',
    pt: '`{ }` agrupa comandos no shell ATUAL pra um redirecionamento/pipeline só — `( )` faria o mesmo num subshell (onde variáveis não vazam).',
    en: '`{ }` groups commands in the CURRENT shell for one redirection/pipeline — `( )` would do the same in a subshell (where variables don\'t leak).' },
  { code: './build 2>&1 | tee build.log', cat: 'heredoc',
    pt: '`tee` envia o pipeline pro arquivo E pra tela ao mesmo tempo — o log do deploy que você vê enquanto escreve. `|&` é a forma curta de `2>&1 |`.',
    en: '`tee` sends the pipeline to the file AND the screen at once — the deploy log you watch while it is written. `|&` is short for `2>&1 |`.' },

  // ─── Receitas do dia a dia ────────────────────────────────────────────
  { code: 'for f in *.JPG; do mv "$f" "${f%.JPG}.jpg"; done', cat: 'recipes',
    pt: 'Renomear em lote trocando a extensão: `%.JPG` corta o sufixo do nome antes de montar o novo — o padrão de qualquer batch de rename.',
    en: 'Batch rename swapping the extension: `%.JPG` strips the suffix from the name before building the new one — the pattern for any rename batch.' },
  { code: 'cp servidor.conf "servidor-$(date +%F).conf"', cat: 'recipes',
    pt: 'Backup com data no nome: o `$(date +%F)` vira `2026-08-10` no arquivo — nunca sobrescreve e a ordem cronológica aparece no `ls`.',
    en: 'Dated backup: `$(date +%F)` becomes `2026-08-10` in the filename — never overwrites and chronological order shows in `ls`.' },
  { code: 'mapfile -t linhas < dados.txt\necho "${linhas[0]}"', cat: 'recipes',
    pt: 'Joga o arquivo inteiro num array, uma linha por elemento — leitura instantânea pra depois iterar com `"${linhas[@]}"`.',
    en: 'Loads the whole file into an array, one line per element — instant read, later iterate with `"${linhas[@]}"`.' },
  { code: 'set -euo pipefail\ntrap \'echo "ERRO na linha $LINENO"\n\' ERR', cat: 'recipes',
    pt: 'A "stack trace" do bash: com o trap de `ERR`, quando um comando falha o script imprime APONTA a linha exata que quebrou antes de sair.',
    en: 'Bash\'s "stack trace": with an `ERR` trap, when a command fails the script prints the EXACT line that broke before exiting.' },
  { code: 'while IFS=: read -r user resto; do echo "user: $user"; done < /etc/passwd', cat: 'recipes',
    pt: 'Ler um CSV com separador custom: o `:` no `IFS=` diz ao `read` onde partir cada linha — listar usuários/colunas sem cut nem awk.',
    en: 'Read a CSV with a custom separator: the `:` in `IFS=` tells `read` where to split each line — listing users/columns without cut or awk.' },
  { code: 'for i in {1..10}; do\n  printf "tentativa %s... " "$i"\n  curl -sf "https://api.exemplo/health" >/dev/null && break\n  sleep 3\ndone', cat: 'recipes',
    pt: 'Retry com contagem visível: tenta até 10 vezes, mostra o nº da tentativa com `printf` (não use `echo`, que engole `%`) e `break` no primeiro sucesso.',
    en: 'Visible retry loop: tries up to 10 times, prints the attempt number with `printf` (not `echo`, which mangles `%`) and `break`s on the first success.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Shell Scripting',
    intro: (
      <>
        A programação de verdade do bash — variáveis e expansão, condicionais,
        loops, arrays, funções e here-docs. O irmão mais novo do{' '}
        <Text code>bash-shortcuts</Text> (atalhos de leitura) e do{' '}
        <Text code>grep/sed/awk</Text> (filtros de texto): aqui é o bash como
        linguagem de script, com o pedaço pronto pra colar.
      </>
    ),
    search: 'Buscar por código, opção ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Pegadinhas que pegam todo mundo',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Espaços matam.</Text> Atribuição é{' '}
          <Text code>nome="x"</Text> sem espaço no <Text code>=</Text>, e toda
          variável em comando vai entre aspas{' '}
          <Text code>"$var"</Text> — sem elas o shell faz word-splitting e
          expande globs (um arquivo chamado{' '}
          <Text code>Meu arquivo.txt</Text> vira dois).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Aspas duplas expandem, simples preservam o literal.</Text>{' '}
          <Text code>'$X'</Text> fica literal; <Text code>"$X"</Text> vira o
          valor. E prefira <Text code>$( )</Text> a backticks:{' '}
          <Text code>$( )</Text> aninha e é a forma moderna.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>set -euo pipefail</Text> no topo salva script: aborta no
          primeiro erro (<Text code>-e</Text>), reclama variável sem valor (
          <Text code>-u</Text>) e faz pipeline falhar se qualquer etapa falhar
          (<Text code>pipefail</Text>). Se um comando PODE falhar sem ser
          problema, o escape é <Text code>cmd || true</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          Arrays: itere com <Text code>{'${arr[@]}'}</Text> (as aspas são o que
          preserva os valores com espaço) e o tamanho é{' '}
          <Text code>{'${#arr[@]}'}</Text> — o <Text code>{'${#arr}'}</Text> dá o
          tamanho do primeiro elemento.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text code>2&gt;&amp;1 &gt; log</Text> está ERRADO: a ordem dos
          redirecionamentos importa (o certo é{' '}
          <Text code>&gt; log 2&gt;&amp;1</Text>). E here-doc{' '}
          <Text code>&lt;&lt;EOF</Text> expande variáveis — se você quer o
          conteúdo cru, <Text code>&lt;&lt;'EOF'</Text>.
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
    title: 'Bash Scripting Cheat Sheet',
    intro: (
      <>
        Bash as a real programming language — variables &amp; expansion,
        conditionals, loops, arrays, functions and here-docs. The younger
        sibling of <Text code>bash-shortcuts</Text> (editing shortcuts) and{' '}
        <Text code>grep/sed/awk</Text> (text filters): here it's bash as a
        scripting language, with the copy-ready snippet.
      </>
    ),
    search: 'Search by command, option or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'Gotchas that catch everyone',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Spaces kill.</Text> Assignment is{' '}
          <Text code>nome="x"</Text> with no space around <Text code>=</Text>,
          and every variable in a command goes quoted{' '}
          <Text code>"$var"</Text> — unquoted, the shell word-splits and
          expands globs (a file named <Text code>Meu arquivo.txt</Text>{' '}
          becomes two).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Double quotes interpolate, single quotes preserve.</Text>{' '}
          <Text code>'$X'</Text> stays literal; <Text code>"$X"</Text> becomes
          the value. Prefer <Text code>$( )</Text> over backticks:{' '}
          <Text code>$( )</Text> nests and is the modern form.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>set -euo pipefail</Text> at the top saves scripts: abort
          on the first error (<Text code>-e</Text>), complain about unset
          variables (<Text code>-u</Text>) and fail a pipeline when any stage
          fails (<Text code>pipefail</Text>). If a command MAY legitimately
          fail, the escape hatch is <Text code>cmd || true</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          Arrays: iterate with <Text code>{'${arr[@]}'}</Text> (the quotes are
          what keeps space-filled values intact) and the length is{' '}
          <Text code>{'${#arr[@]}'}</Text> — the <Text code>{'${#arr}'}</Text> gives
          the first element's length.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text code>2&gt;&amp;1 &gt; log</Text> is WRONG: redirection order matters
          (the correct form is <Text code>&gt; log 2&gt;&amp;1</Text>). And the
          here-doc <Text code>&lt;&lt;EOF</Text> expands variables — when you
          want raw content, use <Text code>&lt;&lt;'EOF'</Text>.
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

export default function BashScriptingCheatsheetPage() {
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
    const header = '# Bash scripting (cheat sheet)\n\n'
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