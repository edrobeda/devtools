import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, WindowsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['ps-cmdlet', 'ps-pipe', 'ps-var', 'cmd', 'wt', 'gotchas']

const CATEGORY_COLOR = {
  'ps-cmdlet': 'green',
  'ps-pipe': 'blue',
  'ps-var': 'gold',
  cmd: 'purple',
  wt: 'orange',
  gotchas: 'volcano',
}

const labelOf = {
  'ps-cmdlet': { pt: 'PowerShell — cmdlets essenciais', en: 'PowerShell — essential cmdlets' },
  'ps-pipe': { pt: 'PowerShell — pipeline & objetos', en: 'PowerShell — pipeline & objects' },
  'ps-var': { pt: 'PowerShell — variáveis, env & perfis', en: 'PowerShell — variables, env & profiles' },
  cmd: { pt: 'CMD (Prompt de Comando)', en: 'CMD (Command Prompt)' },
  wt: { pt: 'Windows Terminal', en: 'Windows Terminal' },
  gotchas: { pt: 'Pegadinhas', en: 'Gotchas' },
}

const ITEMS = [
  // ─── PowerShell — cmdlets essenciais ───────────────────────────────────
  { code: 'Get-ChildItem .',

    cat: 'ps-cmdlet',
    pt: 'Lista arquivos e pastas — o `ls` do PowerShell. Aceita glob `*.js`, `-Recurse` pra descer na árvore e `-Filter` pra filtrar por extensão.',
    en: 'Lists files and folders — the PowerShell `ls`. Accepts a glob like `*.js`, `-Recurse` to go down the tree and `-Filter` to narrow by extension.' },
  { code: 'Get-Content app.log -Tail 20',

    cat: 'ps-cmdlet',
    pt: 'Lê um arquivo linha a linha — o `cat`. `-Tail N` mostra as últimas N linhas (equivalente do `tail -n`) e `-Wait` segue o arquivo como `tail -f`.',
    en: 'Reads a file line by line — the `cat`. `-Tail N` shows the last N lines (like `tail -n`) and `-Wait` follows the file like `tail -f`.' },
  { code: 'Select-String -Path .\\*.log -Pattern "erro|erro"',

    cat: 'ps-cmdlet',
    pt: 'Busca um padrão em arquivos — o `grep`. Cada match é um objeto com `.Line`, `.LineNumber`, `.Filename`. Sem `-Path`, lê do pipeline (não do arquivo).',
    en: 'Searches a pattern in files — the `grep`. Each match is an object with `.Line`, `.LineNumber`, `.Filename`. Without `-Path` it reads from the pipeline, not the file.' },
  { code: 'Set-Content out.txt -Value "hello"',

    cat: 'ps-cmdlet',
    pt: 'Escreve/sobrescreve um arquivo de texto (o `echo >` do PowerShell). `Add-Content` anexa no fim (equivalente do `>>`).',
    en: 'Writes/overwrites a text file (PowerShell\'s `echo >`). `Add-Content` appends to the end (the `>>` equivalent).' },
  { code: 'Copy-Item file.txt backup\\file.txt',

    cat: 'ps-cmdlet',
    pt: 'Copia arquivos e pastas — o `cp`. `Move-Item` move/renomeia (`mv`) e `Remove-Item` apaga (`rm`). Renomear um arquivo é `Move-Item a b` ou `Rename-Item`.',
    en: 'Copies files and folders — the `cp`. `Move-Item` moves/renames (`mv`) and `Remove-Item` deletes (`rm`). Renaming a file is `Move-Item a b` (or `Rename-Item`).' },
  { code: 'Get-Process node',

    cat: 'ps-cmdlet',
    pt: 'Lista processos — o `ps`. Filtre pelo nome (`node`) ou veja tudo sem argumento. `Stop-Process -Name node` mata o processo (`Stop-Process -Id 1234` por PID).',
    en: 'Lists processes — the `ps`. Filter by name (`node`) or see everything with no argument. `Stop-Process -Name node` kills it (`Stop-Process -Id 1234` for a PID).' },
  { code: 'Get-Service spooler',

    cat: 'ps-cmdlet',
    pt: 'Lista serviços do Windows — estado, nome e status. `Start-Service`/`Stop-Service`/`Restart-Service` operam neles; rode o terminal como admin para mexer. Use `Get-Service | Where-Object Status -eq "Running"` para filtrar.',
    en: 'Lists Windows services — name and status. `Start-Service`/`Stop-Service`/`Restart-Service` operate on them; run the terminal as admin to change them. Filter with `Get-Service | Where-Object Status -eq "Running"`.' },
  { code: 'Get-Command Set-Content',

    cat: 'ps-cmdlet',
    pt: 'Descobre onde um comando está definido e sua assinatura — o `which`/`type` do PowerShell. `Get-Help` traz a documentação e `(Get-Command X).Parameters` lista os parâmetros.',
    en: 'Finds where a command is defined and its signature — the PowerShell `which`/`type`. `Get-Help` brings the docs and `(Get-Command X).Parameters` lists its parameters.' },
  { code: 'Get-Content app.log -Wait',

    cat: 'ps-cmdlet',
    pt: 'Segue um arquivo de log em tempo real — o `tail -f`. Combine com `Select-String` no pipeline para filtrar o que entra: `Get-Content -Wait app.log | Select-String "erro"`.',
    en: 'Follows a log file in real time — the `tail -f`. Combine with `Select-String` in the pipeline to filter as it flows: `Get-Content -Wait app.log | Select-String "erro"`.' },
  { code: 'Measure-Object -Line -Word -Character',

    cat: 'ps-cmdlet',
    pt: 'Calcula estatísticas de um pipeline — o `wc`. Com `-Property Length -Sum` em uma lista de objetos, soma/mede valores numéricos. Sem args, conta itens.',
    en: 'Computes statistics over a pipeline — the `wc`. With `-Property Length -Sum` on a list of objects it sums/averages numeric values. With no args it counts items.' },

  // ─── PowerShell — pipeline & objetos ────────────────────────────────────
  { code: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5',
    cat: 'ps-pipe',
    pt: 'O pipeline do PowerShell passa OBJETOS, não texto: pega todos os processos, ordena por CPU decrescente e fatia os 5 primeiros — tudo sem parsear colunas.',
    en: 'The PowerShell pipeline passes OBJECTS, not text: take all processes, sort by CPU descending and slice the top 5 — no column parsing involved.' },
  { code: 'Get-Process | Where-Object { $_.WorkingSet64 -gt 200MB }',
    cat: 'ps-pipe',
    pt: 'Filtra por propriedade — o `grep` de objetos. `$_` é o item atual do pipeline e `-gt` é o `>`. O resultado é um processo real, não uma linha de texto.',
    en: 'Filters by property — the object `grep`. `$_` is the current pipeline item and `-gt` is the `>`. The result is a real process object, not a text line.' },
  { code: 'Get-Process | Select-Object Name, Id, CPU',
    cat: 'ps-pipe',
    pt: 'Projeta só as propriedades que importam — o `cut` de objetos. `Select-Object -First 10` limita a quantidade e `-Unique` deduplica.',
    en: 'Projects just the properties that matter — the object `cut`. `Select-Object -First 10` limits the number and `-Unique` dedupes.' },
  { code: 'Get-Service | Where-Object Status -eq "Stopped" | Format-Table -AutoSize',
    cat: 'ps-pipe',
    pt: '`Format-Table -AutoSize` ajusta as colunas ao conteúdo (senão o table sai truncado). `Format-List` mostra cada objeto em bloco vertical, bom para poucas propriedades.',
    en: '`Format-Table -AutoSize` fits the columns to the content (otherwise the table ships truncated). `Format-List` shows each object as a vertical block, great for few properties.' },
  { code: 'Get-EventLog -LogName Application -Newest 20 | Where-Object { $_.EntryType -eq "Error" }',
    cat: 'ps-pipe',
    pt: 'Filtra os 20 eventos mais recentes do log do Windows e mantém só os de erro — o "grep + sort + head" de logs em um pipeline de objetos.',
    en: 'Takes the 20 most recent Windows event-log entries and keeps only the errors — the grep+sort+head of logs as an object pipeline.' },
  { code: 'Get-ChildItem -Recurse -Filter "*.js" | Select-String -Pattern "TODO"',
    cat: 'ps-pipe',
    pt: 'Varre a árvore, filtra `*.js` e procura `TODO` em cada arquivo — Find + grep em um pipeline. Adicione `| ForEach-Object { $_.Path }` para só os caminhos.',
    en: 'Walks the tree, filters `*.js` and searches for `TODO` in every file — find+grep as a pipeline. Add `| ForEach-Object { $_.Path }` for just the paths.' },
  { code: 'Get-ChildItem . | ForEach-Object { $_.Length }',
    cat: 'ps-pipe',
    pt: 'Roda um bloco para CADA item do pipeline — o loop da pipeline. Equivale ao `xargs`/`map` para objetos; `$_` é o item atual.',
    en: 'Runs a block for EACH pipeline item — the pipeline loop. It is the `xargs`/`map` for objects; `$_` is the current item.' },
  { code: 'Get-ChildItem .\\*.js | Out-File lista.txt',
    cat: 'ps-pipe',
    pt: '`Out-File` grava a saída formatada em arquivo de texto. Para JSON de verdade use `ConvertTo-Json | Out-File arquivo.json` (senão é a "tela impressa", não dados).',
    en: '`Out-File` writes the formatted output to a text file. For real JSON use `ConvertTo-Json | Out-File arquivo.json` (otherwise you get a screen dump, not data).' },
  { code: 'Get-Process | Export-Csv procs.csv -NoTypeInformation',
    cat: 'ps-pipe',
    pt: 'Exporta objetos para CSV — o jeito de gerar planilha a partir de um pipeline. `-NoTypeInformation` remove a linha `#TYPE` que polui o arquivo para outras ferramentas.',
    en: 'Exports objects to CSV — how to produce a spreadsheet from a pipeline. `-NoTypeInformation` drops the `#TYPE` line that pollutes the file for other tools.' },
  { code: 'Get-Content logs.json -Raw | ConvertFrom-Json',
    cat: 'ps-pipe',
    pt: 'Converte JSON em objetos reais (o parser tá embutido). O caminho inverso é `ConvertTo-Json`; com `-Depth 10` quando o objeto for aninhado, senão corta em 2 níveis.',
    en: 'Parses JSON into real objects (the parser is built in). The reverse is `ConvertTo-Json`; pass `-Depth 10` on nested objects or it cuts at 2 levels.' },

  // ─── PowerShell — variáveis, env & perfis ───────────────────────────────
  { code: '$env:USERNAME',
    cat: 'ps-var',
    pt: 'Lê uma variável de ambiente — prefixo `$env:`. Ligar o que já era `%PATH%`, `$USER` etc.: `$env:Path`, `$env:COMPUTERNAME`.',
    en: 'Reads an environment variable — the `$env:` prefix. Marries what used to be `%PATH%`, `$USER`, etc.: `$env:Path`, `$env:COMPUTERNAME`.' },
  { code: '$env:JAVA_HOME = "C:\\Program Files\\Java\\jdk-21"',
    cat: 'ps-var',
    pt: 'Seta uma variável de ambiente SÓ nesta sessão (o `export`). Para persistir para o sistema inteiro, use `[Environment]::SetEnvironmentVariable("JAVA_HOME", $v, "User")`.',
    en: 'Sets an env variable for THIS session only (the `export`). To make it stick system-wide, use `[Environment]::SetEnvironmentVariable("JAVA_HOME", $v, "User")`.' },
  { code: '$PATH_PARTS = $env:Path -split ";"',
    cat: 'ps-var',
    pt: 'Variáveis usam `$` (sem tipo): `$x = 5`, `$s = "texto"`. O ponto-e-vírgula também é o separador de comandos numa linha — e o do PATH do Windows.',
    en: 'Variables use `$` (untyped): `$x = 5`, `$s = "texto"`. The semicolon is also the command separator on one line — and the PATH separator on Windows.' },
  { code: 'Get-ChildItem Env:',
    cat: 'ps-var',
    pt: 'Lista TODAS as variáveis de ambiente — o `env` do PowerShell (mais azul: os drives do PowerShell são navegáveis, e os do ambiente são o `Env:`).',
    en: 'Lists ALL environment variables — PowerShell\'s `env` (upside: PowerShell drives are navigable, and the environment one is `Env:`).' },
  { code: 'Test-Path C:\\work\\project',
    cat: 'ps-var',
    pt: 'Testa se um caminho existe (arquivo ou pasta) sem explodir com erro — ideal para preâmbulos de scripts. `-PathType Container` exige que seja pasta.',
    en: 'Tests whether a path exists (file or folder) without blowing up — perfect for script preambles. `-PathType Container` requires a directory.' },
  { code: 'Join-Path "C:\\work" "project"',
    cat: 'ps-var',
    pt: 'Junta caminho de forma segura, cuidando das barras — melhor que concatenar com `\\` na mão. `Split-Path`/`Get-ChildItem | % FullName` complementam o trabalho de caminhos.',
    en: 'Joins a path safely handling the separators — better than hand-concatenating `\\`. `Split-Path`/`Get-ChildItem | % FullName` round out the path toolkit.' },
  { code: 'cd "C:\\work\\project"',
    cat: 'ps-var',
    pt: 'O `cd` funciona igual — e `cd ~`/`cd $HOME` voltam para o home do usuário. `cd C:\\` troca de drive na hora (no CMD precisaria do `cd /d`).',
    en: '`cd` works the same — and `cd ~`/`cd $HOME` returns to your home. `cd C:\\` switches drives right away (CMD would need `cd /d`).' },
  { code: 'notepad $PROFILE',
    cat: 'ps-var',
    pt: 'Edita o perfil do PowerShell — o `.bashrc` do Windows, executado a cada sessão nova. `$PROFILE` é o caminho do arquivo; descubra aliases padrões e funções próprias.',
    en: 'Edits the PowerShell profile — Windows\' `.bashrc`, run at every new session. `$PROFILE` is the file path; put custom aliases and functions there.' },
  { code: 'Set-Alias ll Get-ChildItem -Force',
    cat: 'ps-var',
    pt: 'Cria um alias de sessão. Para durar, vá para o `$PROFILE`. Muitos aliases do Bash já existem (`ls`, `cat`, `cp`, `mv`, `rm`) — mas conferir `Get-Alias ls` revela que apontam para os cmdlets de verdade.',
    en: 'Creates a session alias. To keep it, add it to your `$PROFILE`. Many bash aliases already exist (`ls`, `cat`, `cp`, `mv`, `rm`) — but `Get-Alias ls` shows they point at the real cmdlets.' },
  { code: 'Where.exe node',
    cat: 'ps-var',
    pt: 'Acha o executável que o PATH vai rodar — o `which` universal do Windows (é um .exe, funciona no CMD e no PowerShell). `Get-Command node` cobre o mesmo no PowerShell.',
    en: 'Finds which executable PATH will run — the universal Windows `which` (it is an .exe that works in CMD and PowerShell). `Get-Command node` covers the same ground in PowerShell.' },

  // ─── CMD (Prompt de Comando) ───────────────────────────────────────────
  { code: 'dir /B /O-D',
    cat: 'cmd',
    pt: 'Lista arquivos no CMD: `/B` = só os nomes (bare), `/O-D` = ordenado por data desc (mais recentes primeiro). `/S` desce nas subpastas. É o `ls -la` espartano.',
    en: 'Lists files in CMD: `/B` = names only (bare), `/O-D` = sorted by date desc (newest first). `/S` walks into subfolders. CMD\'s spartan `ls -la`.' },
  { code: 'cd /d D:\\projetos',
    cat: 'cmd',
    pt: 'No CMD, `cd` NÃO troca de letra de drive — o `/d` faz o `mudar de disco + pasta` num passo. Mesmo sintaxe que o PowerShell, mas no CMD esse flag é obrigatório para sair de `C:`.',
    en: 'In CMD, `cd` does NOT change drive letters — the `/d` does "switch drive + folder" in one move. Same shape as PowerShell, but in CMD that flag is required to leave `C:`.' },
  { code: 'type app.log | findstr "erro"',
    cat: 'cmd',
    pt: 'Lê um arquivo e filtra por texto — o grep do CMD. `findstr /I` ignora caixa, `/N` mostra o número da linha e `/V` inverte.',
    en: 'Reads a file and filters for text — CMD\'s grep. `findstr /I` is case-insensitive, `/N` shows the line number and `/V` inverts.' },
  { code: 'copy config.json config_backup.json',
    cat: 'cmd',
    pt: 'Copia arquivos no CMD (`copy`). `move` move/renomeia e `del`/`erase` apagam. Para pastas inteiras, `xcopy config\\ newconfig\\ /E /I /Y` (o `cp -r`).',
    en: 'Copies files in CMD (`copy`). `move` moves/renames and `del`/`erase` delete. For whole folders, `xcopy config\\ newconfig\\ /E /I /Y` (the `cp -r`).' },
  { code: 'set VAR=valor',
    cat: 'cmd',
    pt: 'Define variável de ambiente no CMD e usa com `%VAR%`. IMPORTANTE: a sintaxe é SEM espaços ao redor do `=` (`set K = v` cria a variável "K ").',
    en: 'Sets an env variable in CMD, used later as `%VAR%`. IMPORTANT: no spaces around the `=` (`set K = v` creates a variable literally named "K ").' },
  { code: 'ping 8.8.8.8',
    cat: 'cmd',
    pt: 'O ping do Windows, que por padrão para em 4 pacotes. `ipconfig /all` mostra a configuração de rede completa — o primeiro passo da maioria dos diagnósticos no Windows.',
    en: 'Windows\' ping, which stops after 4 packets by default. `ipconfig /all` shows the full network config — the first step of most Windows diagnostics.' },
  { code: 'tasklist | findstr node',
    cat: 'cmd',
    pt: 'Lista processos do Windows no CMD — o `ps | grep`. `taskkill /F /PID 1234` mata na força por PID (`/IM node.exe` por imagem). O gerenciador de tarefas da linha de comando.',
    en: 'Lists Windows processes in CMD — the `ps | grep`. `taskkill /F /PID 1234` force-kills by PID (`/IM node.exe` by image name). The command-line task manager.' },
  { code: 'tree /F C:\\work',
    cat: 'cmd',
    pt: 'Desenha a árvore de pastas e arquivos (`/A` troca as barras por caracteres ASCII, mais legível em textos). Útil para printar a estrutura de um projeto em docs.',
    en: 'Draws the folder (and with `/F`, file) tree. `/A` switches to plain ASCII lines, more readable in text docs. Handy for printing a project structure.' },
  { code: 'cls',
    cat: 'cmd',
    pt: 'Limpa a tela (o `clear`). `echo.` imprime linha em branco e `echo oi` imprime texto. Para ver o histórico de comandos da sessão atual, pressione F7.',
    en: 'Clears the screen (the `clear`). `echo.` prints a blank line and `echo oi` prints text. To see the current session history, press F7.' },
  { code: 'C:\\> where node',
    cat: 'cmd',
    pt: 'O `which` do CMD — mostra o caminho completo de cada executável no PATH. `where /r dir nome` procura recursivamente também. Melhor amigo do "por que subiu outra versão?".',
    en: 'CMD\'s `which` — prints the full path of every matching executable in PATH. `where /r dir name` searches recursively too. Your best friend for "why did the wrong version run?".' },

  // ─── Windows Terminal ──────────────────────────────────────────────────
  { code: 'Ctrl+Shift+T',
    cat: 'wt',
    pt: 'Abre uma aba nova no Windows Terminal. `Ctrl+Shift+N` abre uma janela nova e `Ctrl+Shift+P` abre a paleta de comandos (busca qualquer atalho).',
    en: 'Opens a new tab in Windows Terminal. `Ctrl+Shift+N` opens a new window and `Ctrl+Shift+P` opens the command palette (searchable everything).' },
  { code: 'Ctrl+Shift+D',
    cat: 'wt',
    pt: 'Divide a aba atual em dois painéis (vertical). `Alt+Shift+Mesmo` divide o painel na direção contrária (horizontal) — panes estilo tmux no Windows.',
    en: 'Splits the current tab into two panes (vertical). `Alt+Shift+the other arrow` splits the other way (horizontal) — tmux-style panes on Windows.' },
  { code: 'Alt+setas',
    cat: 'wt',
    pt: 'Move o foco entre os painéis do Windows Terminal — o "navegar entre panes" sem mouse. `Alt+Shift+setas` redimensiona um painel.',
    en: 'Moves focus between Windows Terminal panes — the mouse-free pane hop. `Alt+Shift+arrows` resizes a pane.' },
  { code: 'Ctrl+Tab',
    cat: 'wt',
    pt: 'Alterna entre as abas do Windows Terminal (Ctrl+Shift+Tab para a anterior). Cada aba pode rodar um perfil diferente — PowerShell, CMD, WSL, Git Bash.',
    en: 'Cycles between Windows Terminal tabs (`Ctrl+Shift+Tab` goes the other way). Each tab can run a different profile — PowerShell, CMD, WSL, Git Bash.' },
  { code: 'Ctrl+Shift+F',
    cat: 'wt',
    pt: 'Busca o texto digitado dentro do painel atual — scrola e marca. Salva quando o log passou e você precisa "grep a tela".',
    en: 'Searches the text you type inside the current pane — scrolls and highlights. Saves you when the log scrolled by and you need to "grep the screen".' },
  { code: 'Ctrl+Shift+W',
    cat: 'wt',
    pt: 'Fecha o painel atual (aba, se for o único). `Ctrl+Shift+T` reabre a última aba fechada — o COMBO de emergência de quem apagou a aba errada.',
    en: 'Closes the current pane (the tab if it is the only one). `Ctrl+Shift+T` reopens the last closed tab — the emergency combo for killing the wrong tab.' },

  // ─── Pegadinhas ────────────────────────────────────────────────────────
  { code: 'ls | Where-Object Length -gt 1kb',
    cat: 'gotchas',
    pt: 'Aliases enganosos DEVEM estar em mind: `ls` no PowerShell é `Get-ChildItem` (objetos), não a listagem em texto do bash — o pipeline SELECT-OBJECT funciona em cima. Teste sempre com `Get-Alias ls`.',
    en: 'Deceptive aliases MUST stay in mind: PowerShell\'s `ls` is `Get-ChildItem` (objects), not bash\'s text listing — the pipeline SELECT-OBJECT applies. Always double-check with `Get-Alias ls`.' },
  { code: 'Remove-Item *.log -WhatIf',
    cat: 'gotchas',
    pt: 'Sem `-WhatIf`, o `Remove-Item` apaga sem perguntar (e sem lixeira). O `-WhatIf` mostra o que seria feito. `-Recurse -Force` não pede nem com subpastas — teste sempre antes.',
    en: 'Without `-WhatIf`, `Remove-Item` deletes without asking (and without recycle bin). `-WhatIf` shows you what would run. `-Recurse -Force` does not even prompt on subfolders — test first, always.' },
  { code: 'Get-Content .\\script.ps1',
    cat: 'gotchas',
    pt: 'Caminhos com `\\` em strings precisam de escape: `".\\dir\\file"` (`"` + `\\`) geram o literal. Strings aspa simples não interpolam `$var` — aspas duplas sim, como `$env:VAR` ou `${var}`.',
    en: 'Paths with `\\` inside strings need escaping: `".\\dir\\file"` — the `"` + `\\` produce the real separator. Single-quoted strings do NOT interpolate `$var`; double-quoted ones do, like `$env:VAR` or `${var}`.' },
  { code: 'cmd /c "echo oi > out.txt"',
    cat: 'gotchas',
    pt: 'O `>` do PowerShell grava a "tela" do output (codificação UTF-16 por padrão), não bytes crus — para arquivos que outros programas consomem, use `Out-File -Encoding utf8` ou `Set-Content`. Prefira `[IO.File]::WriteAllText` para precisão binária.',
    en: 'PowerShell\'s `>` dumps the formatted screen output (UTF-16 by default), not raw bytes — for files other programs consume, use `Out-File -Encoding utf8` or `Set-Content`. Prefer `[IO.File]::WriteAllText` when bytes matter.' },
  { code: 'Get-Help about_Execution_Policies',
    cat: 'gotchas',
    pt: '`ExecutionPolicy` bloqueia scripts `.ps1` (não o console). `Set-ExecutionPolicy RemoteSigned` libera scripts locais, ou rode `-ExecutionPolicy Bypass` para um só. Segurança > comodidade: entenda o porquê antes de desligar.',
    en: '`ExecutionPolicy` blocks `.ps1` scripts, not the console. `Set-ExecutionPolicy RemoteSigned` allows local scripts, or use `-ExecutionPolicy Bypass` for a single run. Security over convenience: understand why before disabling it.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de PowerShell & CMD',
    intro: (
      <>
        O terminal do Windows sem internet: o <Text code>PowerShell</Text> moderno
        (cmdlets + objetos), o <Text code>CMD</Text> clássico, o{' '}
        <Text code>Windows Terminal</Text> como interface e as pegadinhas que
        mordem todo mundo. Complementa o <Text code>bash-to-powershell</Text>,
        que traduz comandos — aqui o foco é o que o PowerShell faz de diferente
        (pipeline de objetos) e o que o CMD sempre vai te exigir.
      </>
    ),
    search: 'Buscar por comando, opção ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que muda a cabeça de quem vem do Bash',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>O pipeline passa OBJETOS, não texto</Text> —{' '}
          <Text code>Get-Process | Where-Object {'{$_.CPU -gt 10}'}</Text> filtra
          por propriedade do processo, não por regex de linha. Filtros, ordenação
          e projeção viram <Text code>Where-Object</Text>,{' '}
          <Text code>Sort-Object</Text> e <Text code>Select-Object</Text> em vez
          de pipes de texto.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Variáveis e ENV</Text> usam <Text code>$</Text>:{' '}
          <Text code>$x = 5</Text> para local e <Text code>$env:PATH</Text> para
          ambiente. No <Text code>CMD</Text>, é <Text code>set VAR=valor</Text>{' '}
          e <Text code>%VAR%</Text> — e sem espaços ao redor do <Text code>=</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Case é irrelevante</Text> no PowerShell:{' '}
          <Text code>get-process</Text> idêntico a <Text code>Get-Process</Text>.
          Atalhos de Bash existem, mas apontam para cmdlets reais:{' '}
          <Text code>ls</Text> é <Text code>Get-ChildItem</Text>,{' '}
          <Text code>cat</Text> é <Text code>Get-Content</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>O CMD é outro mundo</Text> — <Text code>cd /d</Text> para
          trocar de drive, <Text code>findstr</Text> no lugar de grep,{' '}
          <Text code>tasklist</Text>/<Text code>taskkill</Text> para processos. E
          no <Text code>Windows Terminal</Text>, <Text code>Ctrl+Shift+T</Text> e{' '}
          <Text code>Ctrl+Shift+D</Text> valem o curso inteiro. Teste{' '}
          <Text code>-WhatIf</Text> antes de qualquer <Text code>Remove-Item</Text>.
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
    title: 'PowerShell & CMD Cheat Sheet',
    intro: (
      <>
        The Windows terminal without the internet: modern <Text code>PowerShell</Text>{' '}
        (cmdlets + objects), classic <Text code>CMD</Text>, the{' '}
        <Text code>Windows Terminal</Text> front-end and the gotchas that bite
        everyone. Complements <Text code>bash-to-powershell</Text>, which
        translates commands — here the focus is what PowerShell does differently
        (object pipelines) and what CMD will always demand of you.
      </>
    ),
    search: 'Search by command, option or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What changes if you come from Bash',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>The pipeline passes OBJECTS, not text</Text> —{' '}
          <Text code>Get-Process | Where-Object {'{$_.CPU -gt 10}'}</Text> filters
          by a process property, not a line regex. Filters, sorting and projection
          become <Text code>Where-Object</Text>, <Text code>Sort-Object</Text> and{' '}
          <Text code>Select-Object</Text> instead of text pipes.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Variables and ENV</Text> use <Text code>$</Text>:{' '}
          <Text code>$x = 5</Text> for locals and <Text code>$env:PATH</Text> for
          the environment. In <Text code>CMD</Text>, it is{' '}
          <Text code>set VAR=valor</Text> plus <Text code>%VAR%</Text> — and no
          spaces around the <Text code>=</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Case is irrelevant</Text> in PowerShell:{' '}
          <Text code>get-process</Text> is the same as{' '}
          <Text code>Get-Process</Text>. Bash aliases exist but point at real
          cmdlets: <Text code>ls</Text> is <Text code>Get-ChildItem</Text>,{' '}
          <Text code>cat</Text> is <Text code>Get-Content</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>CMD is a different world</Text> — <Text code>cd /d</Text> to
          switch drives, <Text code>findstr</Text> instead of grep,{' '}
          <Text code>tasklist</Text>/<Text code>taskkill</Text> for processes. And
          in <Text code>Windows Terminal</Text>, <Text code>Ctrl+Shift+T</Text> and{' '}
          <Text code>Ctrl+Shift+D</Text> alone are worth the course. Test{' '}
          <Text code>-WhatIf</Text> before any <Text code>Remove-Item</Text>.
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

export default function WindowsPowershellCheatsheetPage() {
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
    const header = '# PowerShell & CMD (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```powershell',
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
      <Title level={2}><WindowsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<ReadOutlined />}
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