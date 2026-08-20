import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'basics',
  'types',
  'strings',
  'tables',
  'control',
  'funcs',
  'oop',
  'modules',
  'coroutines',
  'stdlib',
  'gotchas',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  strings: 'magenta',
  tables: 'green',
  control: 'cyan',
  funcs: 'lime',
  oop: 'volcano',
  modules: 'gold',
  coroutines: 'orange',
  stdlib: 'processing',
  gotchas: 'red',
}

const labelOf = {
  cli: { pt: 'CLI & runtime', en: 'CLI & runtime' },
  basics: { pt: 'Básicos & tipos', en: 'Basics & types' },
  types: { pt: 'Valores & coerção', en: 'Values & coercion' },
  strings: { pt: 'Strings & biblioteca string', en: 'Strings & the string library' },
  tables: { pt: 'Tabelas', en: 'Tables' },
  control: { pt: 'Controle de fluxo', en: 'Control flow' },
  funcs: { pt: 'Funções & closures', en: 'Functions & closures' },
  oop: { pt: 'Metatables & OOP', en: 'Metatables & OOP' },
  modules: { pt: 'Módulos & packages', en: 'Modules & packages' },
  coroutines: { pt: 'Corrotinas', en: 'Coroutines' },
  stdlib: { pt: 'Biblioteca padrão', en: 'Standard library' },
  gotchas: { pt: 'Gotchas clássicos', en: 'Classic gotchas' },
}

const COMMANDS = [
  // ─── CLI & runtime ────────────────────────────────────────────────────────
  { cmd: 'lua -v', cat: 'cli', pt: 'Versão do interpretador (ex.: Lua 5.4.6)', en: 'Interpreter version (e.g. Lua 5.4.6)' },
  { cmd: 'lua main.lua', cat: 'cli', pt: 'Roda um script Lua', en: 'Runs a Lua script' },
  { cmd: 'lua -e \'print("oi")\'', cat: 'cli', pt: 'Executa código direto pela linha de comando', en: 'Runs code directly from the command line' },
  { cmd: 'luac -p main.lua', cat: 'cli', pt: 'Só checa a sintaxe sem gerar bytecode (lint)', en: 'Only checks the syntax without emitting bytecode (lint)' },
  { cmd: 'luac -o main.luac main.lua', cat: 'cli', pt: 'Compila para bytecode binário', en: 'Compiles to binary bytecode' },
  { cmd: 'lua main.luac', cat: 'cli', pt: 'Roda um bytecode pré-compilado', en: 'Runs a pre-compiled bytecode' },
  { cmd: 'lua -i main.lua', cat: 'cli', pt: 'Entra em modo interativo (REPL) depois de rodar', en: 'Enters interactive mode (REPL) after running' },
  { cmd: 'luarocks install <pkg>', cat: 'cli', pt: 'Instala um pacote (gerenciador de pacotes oficial)', en: 'Installs a package (the official package manager)' },
  { cmd: 'luarocks search <pkg>', cat: 'cli', pt: 'Busca pacotes no repositório', en: 'Searches packages in the repository' },
  { cmd: 'lua -e "package.path=package.path..\';/meu/path/?.lua\'"', cat: 'cli', pt: 'Adiciona um caminho de busca de módulos', en: 'Adds a module search path' },
  { cmd: '#!/usr/bin/env lua', cat: 'cli', pt: 'Shebang para rodar scripts direto no terminal (chmod +x)', en: 'Shebang to run scripts directly from the terminal (chmod +x)' },
  { cmd: 'LUA_INIT', cat: 'cli', pt: 'Env var com código que roda antes de qualquer script (tipo .bashrc)', en: 'Env var with code that runs before any script (like .bashrc)' },

  // ─── Básicos & tipos ─────────────────────────────────────────────────────
  { cmd: 'print("olá")', cat: 'basics', pt: 'Imprime no stdout com quebra de linha', en: 'Prints to stdout with a newline' },
  { cmd: 'io.write("sem quebra")', cat: 'basics', pt: 'Escreve sem adicionar nova linha', en: 'Writes without appending a newline' },
  { cmd: '-- comentário de linha\n--[[ bloco ]]', cat: 'basics', pt: 'Comentários de linha e de bloco', en: 'Line and block comments' },
  { cmd: 'x = 10', cat: 'basics', pt: 'Variável global por padrão — declare local sempre', en: 'Global by default — always declare local' },
  { cmd: 'local x = 10', cat: 'basics', pt: 'Variável local ao bloco atual — a escolha padrão', en: 'Local to the current block — the default choice' },
  { cmd: 'local a, b = 1, 2', cat: 'basics', pt: 'Multi-assignment em uma linha', en: 'Multi-assignment in one line' },
  { cmd: 'local x\nx = 5', cat: 'basics', pt: 'Declaração sem inicialização (vira nil)', en: 'Declaration without init (becomes nil)' },
  { cmd: 'a, b = b, a', cat: 'basics', pt: 'Troca de valores sem variável temporária', en: 'Value swap without a temporary variable' },
  { cmd: ';', cat: 'basics', pt: 'Ponto-e-vírgula é opcional — separa duas instruções na mesma linha', en: 'Semicolons are optional — separates two statements on one line' },
  { cmd: 'print(true)', cat: 'basics', pt: 'Booleano — true/false. Únicos falsy são false e nil', en: 'Boolean — true/false. The only falsy values are false and nil' },
  { cmd: 'type(x)', cat: 'basics', pt: 'Retorna a string do tipo: "nil", "number", "string"…', en: 'Returns the type string: "nil", "number", "string"…' },
  { cmd: 'assert(cond, "msg")', cat: 'basics', pt: 'Interrompe com erro se a condição for falsa', en: 'Halts with an error if the condition is falsy' },
  { cmd: 'error("msg")', cat: 'basics', pt: 'Lança um erro de runtime; pode receber nível do stack trace', en: 'Raises a runtime error; can take a stack-trace level' },

  // ─── Valores & coerção ────────────────────────────────────────────────────
  { cmd: 'x = 42 / x = 3.14', cat: 'types', pt: 'Só existe um tipo numérico: number (double 64-bit por padrão)', en: 'There is only one numeric type: number (64-bit double by default)' },
  { cmd: '1 == 1.0', cat: 'types', pt: 'Inteiros e floats são o mesmo tipo e se comparam igual', en: 'Integers and floats are the same type and compare equal' },
  { cmd: 'local s = "texto"', cat: 'types', pt: 'String — imutável; aspas simples ou duplas são iguais', en: 'String — immutable; single or double quotes are the same' },
  { cmd: 'local s = [[multilinha]]', cat: 'types', pt: 'String literal de longa forma — preserva quebras de linha', en: 'Long-bracket string literal — preserves line breaks' },
  { cmd: '"10" + 5', cat: 'types', pt: 'Aritmética coage string numérica automaticamente (vira 15)', en: 'Arithmetic coerces numeric strings automatically (becomes 15)' },
  { cmd: '10 .. "2"', cat: 'types', pt: '.. concatena e coage números em strings ("102")', en: '.. concatenates and coerces numbers to strings ("102")' },
  { cmd: 'tostring(x)', cat: 'types', pt: 'Converte explicitamente para string', en: 'Explicitly converts to string' },
  { cmd: 'tonumber("3.5")', cat: 'types', pt: 'Converte para número; retorna nil se não for numérico', en: 'Converts to number; returns nil when not numeric' },
  { cmd: 'math.floor(3.9)', cat: 'types', pt: 'Arredonda para baixo (uso comum pra "cast" pra int)', en: 'Rounds down (the common way to "cast" to int)' },
  { cmd: 'nil', cat: 'types', pt: 'Ausência de valor — variável não inicializada vale nil', en: 'Absence of value — an uninitialized variable is nil' },
  { cmd: 'x == nil', cat: 'types', pt: 'Comparação com nil para checar se algo existe', en: 'Compare against nil to check existence' },
  { cmd: 'function f() end', cat: 'types', pt: 'Funções são valores de primeira classe — cabem em variáveis', en: 'Functions are first-class values — they fit in variables' },

  // ─── Strings & biblioteca string ─────────────────────────────────────────
  { cmd: 's:upper() / s:lower()', cat: 'strings', pt: 'Tudo em maiúsculas/minúsculas (não muta a original)', en: 'Uppercase/lowercase (does not mutate the original)' },
  { cmd: 'string.len(s) ou #s', cat: 'strings', pt: 'Tamanho em bytes (não caracteres — acentos contam 2)', en: 'Length in bytes (not characters — accented chars count 2)' },
  { cmd: 'string.sub(s, 2, 4)', cat: 'strings', pt: 'Fatia — índices podem ser negativos (do fim)', en: 'Slice — indices can be negative (from the end)' },
  { cmd: 'string.rep("ab", 3)', cat: 'strings', pt: 'Repete a string N vezes', en: 'Repeats the string N times' },
  { cmd: 'string.format("%05d", 42)', cat: 'strings', pt: 'Formata estilo printf (zeros à esquerda etc.)', en: 'printf-style formatting (leading zeros etc.)' },
  { cmd: 'string.match(s, "(%d+)")', cat: 'strings', pt: 'Extrai a primeira captura do padrão', en: 'Extracts the first pattern capture' },
  { cmd: 'string.gmatch(s, "(%w+)")', cat: 'strings', pt: 'Itera cada captura do padrão com for genérico', en: 'Iterates each pattern capture with a generic for' },
  { cmd: 'string.gsub(s, "a", "b")', cat: 'strings', pt: 'Substitui e retorna (string nova, contagem)', en: 'Replaces and returns (new string, count)' },
  { cmd: 'string.find(s, "pad"); string.find(s, "pad", 5)', cat: 'strings', pt: 'Posição da primeira ocorrência (com início opcional)', en: 'Position of the first occurrence (with optional start)' },
  { cmd: 'string.char(65); string.byte("A")', cat: 'strings', pt: 'Número ↔ caractere', en: 'Number ↔ character' },
  { cmd: 'table.concat({"a","b"}, ", ")', cat: 'strings', pt: 'Junta uma lista em string com separador', en: 'Joins a list into a string with a separator' },
  { cmd: 'string.gsub(s, "^%s*(.-)%s*$", "%1")', cat: 'strings', pt: 'Trim de espaços nas pontas via padrões', en: 'Trim of leading/trailing whitespace via patterns' },

  // ─── Tabelas ─────────────────────────────────────────────────────────────
  { cmd: 'local t = { a = 1, b = 2 }', cat: 'tables', pt: 'Tabela estilo dict — chaves strings equivalentes a t.a', en: 'Dict-style table — string keys equivalent to t.a' },
  { cmd: 'local arr = { 10, 20, 30 }', cat: 'tables', pt: 'Tabela estilo array — a primeira posição é 1', en: 'Array-style table — the first position is 1' },
  { cmd: 'arr[1]', cat: 'tables', pt: 'Acesso — índices começam em 1, não 0', en: 'Access — indices start at 1, not 0' },
  { cmd: '#arr', cat: 'tables', pt: 'Comprimento da parte contígua (indefinido com buracos nil)', en: 'Length of the contiguous part (undefined with nil holes)' },
  { cmd: 'table.insert(arr, 40) / table.insert(arr, 2, 15)', cat: 'tables', pt: 'Insere no fim ou numa posição (empurra o resto)', en: 'Inserts at the end or at a position (pushes the rest)' },
  { cmd: 'table.remove(arr) / table.remove(arr, 2)', cat: 'tables', pt: 'Remove e retorna o último ou o da posição', en: 'Removes and returns the last, or the one at a position' },
  { cmd: 'table.sort(arr) / table.sort(arr, function(a,b) return a>b end)', cat: 'tables', pt: 'Ordena no lugar; comparador opcional', en: 'Sorts in place; optional comparator' },
  { cmd: 't.x = nil', cat: 'tables', pt: 'Remover uma chave é atribuir nil a ela', en: 'Removing a key is assigning nil to it' },
  { cmd: 't["chave com espaço"]', cat: 'tables', pt: 'Chaves não-identificadores usam colchetes', en: 'Non-identifier keys use brackets' },
  { cmd: 'local t = { [10] = "dez", [true] = "sim" }', cat: 'tables', pt: 'Chaves podem ser de qualquer tipo (num, bool, até table)', en: 'Keys can be of any type (number, boolean, even table)' },
  { cmd: 'for k, v in pairs(t) do end', cat: 'tables', pt: 'Itera todas as chaves/valores (ordem não garantida)', en: 'Iterates all keys/values (order not guaranteed)' },
  { cmd: 'for i, v in ipairs(arr) do end', cat: 'tables', pt: 'Itera a parte contígua 1..n em ordem', en: 'Iterates the contiguous 1..n part in order' },
  { cmd: 'rawget(t, "k") / rawget(t, "k", v)', cat: 'tables', pt: 'Acessa sem passar pelos metatables (raw access)', en: 'Accesses bypassing metatables (raw access)' },
  { cmd: 'local t = setmetatable({}, {})', cat: 'tables', pt: 'Toda tabela pode ter um metatable (veja Metatables)', en: 'Every table can have a metatable (see Metatables)' },

  // ─── Controle de fluxo ────────────────────────────────────────────────────
  { cmd: 'if x > 4 then\n  print("maior")\nelseif x > 2 then\n  print("médio")\nelse\n  print("menor")\nend', cat: 'control', pt: 'Condicional com elseif/else — termina sempre com end', en: 'Conditional with elseif/else — always ends with end' },
  { cmd: 'while x > 0 do x = x - 1 end', cat: 'control', pt: 'Loop enquanto a condição for verdadeira', en: 'Loops while the condition is truthy' },
  { cmd: 'repeat\n  print(x)\n  x = x - 1\nuntil x == 0', cat: 'control', pt: 'Repete ao menos uma vez; checa no fim', en: 'Runs at least once; checks at the end' },
  { cmd: 'for i = 1, 10 do print(i) end', cat: 'control', pt: 'For numérico inclusivo — aceita passo (1, 10, 2)', en: 'Numeric for — inclusive; accepts a step (1, 10, 2)' },
  { cmd: 'for i = 10, 1, -1 do print(i) end', cat: 'control', pt: 'Loop regressivo com passo negativo', en: 'Backward loop with a negative step' },
  { cmd: 'for k, v in pairs(t) do end', cat: 'control', pt: 'For genérico por iterador (pairs/ipairs/io.lines…)', en: 'Generic for over an iterator (pairs/ipairs/io.lines…)' },
  { cmd: 'break', cat: 'control', pt: 'Sai do loop — Lua não tem continue', en: 'Exits the loop — Lua has no continue' },
  { cmd: 'goto continua; ::continua::', cat: 'control', pt: 'goto/label truque pra simular continue', en: 'goto/label trick to simulate continue' },
  { cmd: 'and / or / not', cat: 'control', pt: 'and/or avaliam em curto-circuito e retornam o operando', en: 'and/or short-circuit and return an operand' },
  { cmd: 'x = x or 10', cat: 'control', pt: 'Idioma "default": 10 quando x é nil/false', en: 'The "default" idiom: 10 when x is nil/false' },
  { cmd: 'local ok = a and b or c', cat: 'control', pt: 'Ternário aproximado (cuidado: só se b nunca for falsy)', en: 'Approximate ternary (careful: only when b is never falsy)' },
  { cmd: 'if x and y then end', cat: 'control', pt: 'nil false é tratado como falso na condição', en: 'nil/false are treated as false in conditions' },

  // ─── Funções & closures ───────────────────────────────────────────────────
  { cmd: 'local function soma(a, b) return a + b end', cat: 'funcs', pt: 'Função local — retorna explicitamente com return', en: 'Local function — returns explicitly with return' },
  { cmd: 'function f.greet() end', cat: 'funcs', pt: 'Função como campo de tabela (método)', en: 'Function as a table field (method)' },
  { cmd: 'return 1, 2, 3', cat: 'funcs', pt: 'Retorna múltiplos valores (tupla implícita)', en: 'Returns multiple values (implicit tuple)' },
  { cmd: 'local a, b = f()', cat: 'funcs', pt: 'Captura todos os retornos numa atribuição', en: 'Captures all returns in one assignment' },
  { cmd: 'function f(...) end', cat: 'funcs', pt: 'Varargs — acesse com ... (pacote único)', en: 'Varargs — access via ... (the single pack)' },
  { cmd: 'local a, b = ...', cat: 'funcs', pt: 'Desempacota os varargs em variáveis nomeadas', en: 'Unpacks the varargs into named variables' },
  { cmd: 'local t = {...}', cat: 'funcs', pt: 'Empacota os varargs numa tabela', en: 'Packs the varargs into a table' },
  { cmd: 'f(1)(2)', cat: 'funcs', pt: 'Chamada encadeada: retorno de f é chamado com 2', en: 'Chained call: f\'s return is then called with 2' },
  { cmd: 'local function contador()\n  local n = 0\n  return function() n = n + 1 return n end\nend', cat: 'funcs', pt: 'Closure — a função interna captura o upvalue n', en: 'Closure — the inner function captures the upvalue n' },
  { cmd: 'anonymous: local f = function(x) return x end', cat: 'funcs', pt: 'Função anônima atribuída a variável', en: 'Anonymous function assigned to a variable' },
  { cmd: 'table.sort(list, function(a, b) return a.name < b.name end)', cat: 'funcs', pt: 'Closure passada como callback de ordenação', en: 'Closure passed as a sort callback' },
  { cmd: 'f = f or funcionPadrao()', cat: 'funcs', pt: 'Inicialização preguiçosa com memoização simples', en: 'Lazy init with simple memoization' },
  { cmd: 'local function f() end\nlocal g = f', cat: 'funcs', pt: 'Funções são valores — pode referenciar quantas vezes quiser', en: 'Functions are values — can be referenced as many times' },

  // ─── Metatables & OOP ─────────────────────────────────────────────────────
  { cmd: 'local m = setmetatable(t, met) / met = getmetatable(t)', cat: 'oop', pt: 'Define / consulta o metatable de uma tabela', en: 'Sets / reads a table\'s metatable' },
  { cmd: 'setmetatable({}, { __index = parent })', cat: 'oop', pt: '__index: lookup cai no parent quando a chave não existe (herança)', en: '__index: lookups fall through to parent when a key is missing (inheritance)' },
  { cmd: 'mt.__newindex = function(t, k, v) end', cat: 'oop', pt: 'Intercepta a escrita de chaves que não existem', en: 'Intercepts writes to keys that do not exist' },
  { cmd: 'function mt.__tostring(t) return "..." end', cat: 'oop', pt: 'Controla a saída de print/tostring', en: 'Controls print/tostring output' },
  { cmd: 'mt.__call = function(self, ...) end', cat: 'oop', pt: 'Permite chamar a tabela como função', en: 'Lets the table be called like a function' },
  { cmd: '__add / __sub / __mul / __concat', cat: 'oop', pt: 'Metamétodos aritméticos para sobrecarregar operadores', en: 'Arithmetic metamethods to overload operators' },
  { cmd: 'mt.__eq / mt.__lt / mt.__le', cat: 'oop', pt: 'Sobrecarga de comparação (só com metatable igual)', en: 'Comparison overloading (only with the same metatable)' },
  { cmd: 'self / :', cat: 'oop', pt: 'Dois-pontos injeta self automaticamente: t:f(x) == t.f(t,x)', en: 'Colon injects self automatically: t:f(x) == t.f(t, x)' },
  { cmd: 'function M:new(o) local t = setmetatable(o or {}, self) self.__index = self return t end', cat: 'oop', pt: 'Padrão de classe: new cria instância com __index = self', en: 'Class pattern: new builds an instance with __index = self' },
  { cmd: 'M:new({nome = "Ana"})', cat: 'oop', pt: 'Instancia passando campos iniciais', en: 'Instantiates passing initial fields' },
  { cmd: 'function M:metodo() end', cat: 'oop', pt: 'Método definido com dois-pontos — recebe self como primeiro arg', en: 'Method defined with a colon — self is the first argument' },
  { cmd: 'local x = protectedcall(f)', cat: 'oop', pt: 'Protege contra erro chamando via pcall (veja stdlib)', en: 'Guards against errors by calling through pcall (see stdlib)' },

  // ─── Módulos & packages ─────────────────────────────────────────────────
  { cmd: 'local m = require("modulo")', cat: 'modules', pt: 'Carrega e cacheia o módulo (só roda uma vez)', en: 'Loads and caches the module (runs only once)' },
  { cmd: 'return { saudar = function() end }', cat: 'modules', pt: 'Módulo = letra que retorna uma tabela de funções', en: 'A module = a chunk that returns a table of functions' },
  { cmd: 'local M = {} function M.f() end return M', cat: 'modules', pt: 'Padrão clássico de biblioteca', en: 'Classic library pattern' },
  { cmd: 'package.path / package.loaded', cat: 'modules', pt: 'Caminhos de busca de módulos / cache de modules já carregados', en: 'Module search paths / cache of already-loaded modules' },
  { cmd: 'package.loaded.m = nil', cat: 'modules', pt: 'Descacheia pra recarregar com require de novo', en: 'Uncaches so a later require reloads it' },
  { cmd: 'require("mod.nome")', cat: 'modules', pt: 'Submódulos com ponto no nome (modulo.nome.lua)', en: 'Submodules with a dot in the name (modulo.nome.lua)' },
  { cmd: 'pcall(require, "modulo")', cat: 'modules', pt: 'Faz require seguro (não quebra se o módulo faltar)', en: 'Safe require (does not blow up if the module is missing)' },
  { cmd: 'dofile("config.lua")', cat: 'modules', pt: 'Roda um arquivo sem cachear (mesma coisa que require sem cache)', en: 'Runs a file without caching (like require without the cache)' },

  // ─── Corrotinas ─────────────────────────────────────────────────────────
  { cmd: 'local co = coroutine.create(function() ... end)', cat: 'coroutines', pt: 'Cria uma corrotina (função suspensa)', en: 'Creates a coroutine (a suspendable function)' },
  { cmd: 'coroutine.resume(co)', cat: 'coroutines', pt: 'Roda/retoma a corrotina até yield ou fim', en: 'Runs/resumes the coroutine until yield or return' },
  { cmd: 'coroutine.yield(v)', cat: 'coroutines', pt: 'Pausa e devolve controle (e um valor) ao quem resume', en: 'Pauses and hands control (and a value) back to the resumer' },
  { cmd: 'coroutine.status(co)', cat: 'coroutines', pt: 'Status: suspended/running/normal/dead', en: 'Status: suspended/running/normal/dead' },
  { cmd: 'coroutine.wrap(f)', cat: 'coroutines', pt: 'Embrulho que retorna uma função com resume (lança erro na morte)', en: 'Wrapper returning a resume function (raises on dead)' },
  { cmd: 'co = coroutine.wrap(f); co()', cat: 'coroutines', pt: 'Chama parecido com uma função normal, do ponto de vista do caller', en: 'Call looks like a normal function from the caller\'s side' },
  { cmd: 'coroutine.resume(co, arg1)', cat: 'coroutines', pt: 'Valores passados no resume vêm do yield anterior', en: 'Values passed on resume come out of the previous yield' },
  { cmd: 'local ok, err = coroutine.resume(co)', cat: 'coroutines', pt: 'Erros dentro da corrotina voltam como retorno (não estouram)', en: 'Errors inside the coroutine come back as a return (not a raise)' },

  // ─── Biblioteca padrão ───────────────────────────────────────────────────
  { cmd: 'math.floor / math.ceil / math.abs', cat: 'stdlib', pt: 'Matemática básica em doubles', en: 'Basic math on doubles' },
  { cmd: 'math.max / math.min / math.random(a, b)', cat: 'stdlib', pt: 'Máximo, mínimo e aleatório inteiro no intervalo', en: 'Max, min, and random integer in the range' },
  { cmd: 'math.randomseed(os.time())', cat: 'stdlib', pt: 'Semeia o gerador de números aleatórios antes de usar', en: 'Seeds the RNG before any use of math.random' },
  { cmd: 'table.concat(arr, ",") / table.unpack(arr)', cat: 'stdlib', pt: 'Junta em string / expande tabela em múltiplos retornos', en: 'Joins into a string / expands a table into multiple returns' },
  { cmd: 'os.time() / os.date("%Y-%m-%d")', cat: 'stdlib', pt: 'Timestamp Unix e data formatada', en: 'Unix timestamp and formatted date' },
  { cmd: 'os.clock()', cat: 'stdlib', pt: 'Tempo de CPU usado pelo processo (benchmark simples)', en: 'CPU time used by the process (simple benchmarking)' },
  { cmd: 'io.open("x.txt", "r") --[[ "w" ]] :read("*a") / :lines()', cat: 'stdlib', pt: 'Abre arquivo e lê tudo ou linha a linha', en: 'Opens a file and reads all or line by line' },
  { cmd: 'local f = assert(io.open("x.txt", "w"))\nf:write("conteudo")\nf:close()', cat: 'stdlib', pt: 'Escrita segura de arquivo (assert garante o handle)', en: 'Safe file write (assert guards the handle)' },
  { cmd: 'local ok, err = pcall(f, ...)', cat: 'stdlib', pt: 'Chama protegido — devolve ok + retornos ou erro (não trava)', en: 'Protected call — returns ok + returns, or the error' },
  { cmd: 'local ok, r = xpcall(f, handler)', cat: 'stdlib', pt: 'Como pcall, mas com mensagem de erro transformada pelo handler', en: 'Like pcall, but with the error message transformed by the handler' },
  { cmd: 'utf8.char / utf8.codepoint / utf8.len("olá")', cat: 'stdlib', pt: 'Manipula por code point — utf8.len conta caracteres reais', en: 'Works per code point — utf8.len counts real characters' },
  { cmd: 'rawlen(s) / rawlen(t)', cat: 'stdlib', pt: 'Tamanho bruto sem disparar metamétodos __len', en: 'Raw length without triggering a __len metamethod' },

  // ─── Gotchas clássicos ───────────────────────────────────────────────────
  { cmd: 'arr[1], arr[2], ...', cat: 'gotchas', pt: 'Índices começam em 1 — o primeiro elemento é 1, não 0', en: 'Indices start at 1 — the first element is 1, not 0' },
  { cmd: 'local t = {1, nil, 3}  #t', cat: 'gotchas', pt: 'Comprimento de tabela com "buracos" nil é indefinido', en: 'Length on a table with nil "holes" is undefined' },
  { cmd: '0 e "" são true', cat: 'gotchas', pt: 'Só nil e false são falsy — 0 e string vazia contam como verdadeiro', en: 'Only nil and false are falsy — 0 and "" count as truthy' },
  { cmd: 'a == b (duas tabelas)', cat: 'gotchas', pt: 'Comparação de tabelas é por identidade, não por conteúdo', en: 'Table comparison is by identity, not by content' },
  { cmd: 'local t = {} \nlocal u = t \nu.x = 1 -- t.x também vira 1', cat: 'gotchas', pt: 'Tabelas são referências — atribuir copia a referência, não o valor', en: 'Tables are references — assignment copies the reference, not the value' },
  { cmd: 's = s .. "x"', cat: 'gotchas', pt: 'Strings são imutáveis — concatenação sempre cria string nova', en: 'Strings are immutable — concatenation always creates a new string' },
  { cmd: 'local i = 0.1 + 0.2', cat: 'gotchas', pt: 'Números são doubles — cuidado com aritmética de ponto flutuante', en: 'Numbers are doubles — watch out for floating-point arithmetic' },
  { cmd: 'global sem local', cat: 'gotchas', pt: 'Esquecer local cria variável global — polui o _G e buga', en: 'Forgetting local creates a global — pollutes _G and causes bugs' },
  { cmd: 'string.len("café")', cat: 'gotchas', pt: 'len/# contam bytes — "café" tem 5, não 4 (use utf8.len)', en: 'len/# count bytes — "café" is 5, not 4 (use utf8.len)' },
  { cmd: 'while true do ... end', cat: 'gotchas', pt: 'Loop infinito clássico — garanta uma condição de saída', en: 'The classic infinite loop — ensure an exit condition' },
  { cmd: 'for k in pairs(t) do t[k] = nil end', cat: 'gotchas', pt: 'Alterar a estrutura da tabela durante pairs é comportamento indefinido — colete as chaves antes', en: 'Mutating a table while iterating with pairs is undefined — collect keys first' },
  { cmd: 'select("#", ...)', cat: 'gotchas', pt: 'Para saber quantos elementos... use select("#", ...) — #não funciona', en: 'To know how many varargs there are, use select("#", ...) — # won\'t work' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Lua',
    intro: (
      <>
        Referência pesquisável da linguagem Lua 5.4 — CLI e runtime, tipos e
        coerção, strings e a biblioteca <Text code>string</Text>, tabelas,
        controle de fluxo, funções e closures, metatables e programação
        orientada a objetos, módulos e packages, corrotinas, biblioteca
        padrão e os gotchas que mais pegam. Lua é a linguagem de scripting
        do Redis (EVAL/EVALSHA), do Neovim, do nginx (OpenResty) e de dezenas
        de jogos e engines. Tudo 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Use <Text code>local</Text> sempre — variável sem <Text code>local</Text>{' '}
        é global e polui o ambiente. Índices de tabela começam em{' '}
        <Text code>1</Text>, nunca em 0. Tabelas são a base de tudo (dict,
        array, objeto). <Text code>false</Text> e <Text code>nil</Text> são os
        únicos falsy — <Text code>0</Text> e <Text code>""</Text> contam como
        verdadeiro. Saiba a diferença entre <Text code>"10"+5</Text> (aritmética)
        e <Text code>"10"..5</Text> (concatenação). Para OOP use o padrão com{' '}
        <Text code>setmetatable</Text> + <Text code>__index</Text>, e os{' '}
        <Text code>dois-pontos</Text> injetam <Text code>self</Text> sozinhos.
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
    title: 'Lua Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Lua 5.4 language — CLI and runtime,
        types and coercion, strings and the <Text code>string</Text> library,
        tables, control flow, functions and closures, metatables and
        object-oriented programming, modules and packages, coroutines, the
        standard library, and the classic gotchas. Lua is the scripting
        language behind Redis (EVAL/EVALSHA), Neovim, nginx (OpenResty) and
        plenty of games and engines. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Always use <Text code>local</Text> — a variable without{' '}
        <Text code>local</Text> is global and pollutes the environment. Table
        indices start at <Text code>1</Text>, never 0. Tables are the
        foundation of everything (dict, array, object).{' '}
        <Text code>false</Text> and <Text code>nil</Text> are the only falsy
        values — <Text code>0</Text> and <Text code>""</Text> count as truthy.
        Know the difference between <Text code>"10"+5</Text>{' '}
        (arithmetic) and <Text code>"10"..5</Text> (concatenation). For OOP,
        use the <Text code>setmetatable</Text> + <Text code>__index</Text>{' '}
        pattern, and colons inject <Text code>self</Text> automatically.
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

export default function LuaCheatsheetPage() {
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
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CodeOutlined />} message={t.tipTitle} description={t.tipBody} />

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
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
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