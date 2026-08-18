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
  'arrays',
  'hashes',
  'control',
  'methods',
  'oop',
  'exceptions',
  'files',
  'idioms',
  'tooling',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  strings: 'magenta',
  arrays: 'green',
  hashes: 'orange',
  control: 'cyan',
  methods: 'lime',
  oop: 'volcano',
  exceptions: 'red',
  files: 'blue',
  idioms: 'gold',
  tooling: 'cyan',
}

const labelOf = {
  cli: { pt: 'CLI, Rubygems & Bundler', en: 'CLI, Rubygems & Bundler' },
  basics: { pt: 'Básicos & sintaxe', en: 'Basics & syntax' },
  types: { pt: 'Tipos & conversão', en: 'Types & conversion' },
  strings: { pt: 'Strings & símbolos', en: 'Strings & symbols' },
  arrays: { pt: 'Arrays & ranges', en: 'Arrays & ranges' },
  hashes: { pt: 'Hashes', en: 'Hashes' },
  control: { pt: 'Controle de fluxo', en: 'Control flow' },
  methods: { pt: 'Métodos, blocks & lambdas', en: 'Methods, blocks & lambdas' },
  oop: { pt: 'Classes, módulos & OOP', en: 'Classes, modules & OOP' },
  exceptions: { pt: 'Exceções', en: 'Exceptions' },
  files: { pt: 'Arquivos, IO & ENV', en: 'Files, IO & ENV' },
  idioms: { pt: 'Ruby idioms & boas práticas', en: 'Ruby idioms & good practices' },
  tooling: { pt: 'Gems & testes', en: 'Gems & testing' },
}

const COMMANDS = [
  // ─── CLI, Rubygems & Bundler ─────────────────────────────────────────────
  { cmd: 'ruby -v', cat: 'cli', pt: 'Versão do interpretador', en: 'Interpreter version' },
  { cmd: 'ruby script.rb', cat: 'cli', pt: 'Executa um arquivo', en: 'Runs a file' },
  { cmd: 'ruby -e \'puts 1 + 1\'', cat: 'cli', pt: 'Executa código inline sem arquivo', en: 'Runs inline code without a file' },
  { cmd: 'ruby -c script.rb', cat: 'cli', pt: 'Só checa a sintaxe (não executa)', en: 'Only checks syntax (does not run)' },
  { cmd: 'ruby -w script.rb', cat: 'cli', pt: 'Habilita warnings', en: 'Enables warnings' },
  { cmd: 'irb', cat: 'cli', pt: 'REPL interativo', en: 'Interactive REPL' },
  { cmd: 'gem list', cat: 'cli', pt: 'Lista as gems instaladas', en: 'Lists installed gems' },
  { cmd: 'gem search rspec', cat: 'cli', pt: 'Procura uma gem no índice remoto', en: 'Searches the remote index' },
  { cmd: 'gem install rails', cat: 'cli', pt: 'Instala uma gem (e dependências)', en: 'Installs a gem (and dependencies)' },
  { cmd: 'gem uninstall rails -v 7.0.0', cat: 'cli', pt: 'Remove uma versão específica', en: 'Removes a specific version' },
  { cmd: 'gem env', cat: 'cli', pt: 'Mostra o ambiente de gems (paths)', en: 'Shows the gem environment (paths)' },
  { cmd: 'bundle init', cat: 'cli', pt: 'Cria um Gemfile na pasta', en: 'Creates a Gemfile in the folder' },
  { cmd: 'bundle install', cat: 'cli', pt: 'Instala as gems declaradas no Gemfile', en: 'Installs gems declared in the Gemfile' },
  { cmd: 'bundle add rspec', cat: 'cli', pt: 'Adiciona ao Gemfile e instala', en: 'Adds to the Gemfile and installs' },
  { cmd: 'bundle update', cat: 'cli', pt: 'Atualiza as versões das gems', en: 'Updates gem versions' },
  { cmd: 'bundle exec rails s', cat: 'cli', pt: 'Roda usando as versões pinadas no Gemfile', en: 'Runs using the versions pinned in the Gemfile' },
  { cmd: 'bundle outdated', cat: 'cli', pt: 'Mostra quais gems estão desatualizadas', en: 'Shows which gems are outdated' },
  { cmd: 'bundle gem nome', cat: 'cli', pt: 'Gera um esqueleto de gem pronto', en: 'Generates a ready gem skeleton' },

  // ─── Básicos & sintaxe ──────────────────────────────────────────────────
  { cmd: 'puts "oi"', cat: 'basics', pt: 'Imprime com quebra de linha', en: 'Prints with a newline' },
  { cmd: 'print "oi"', cat: 'basics', pt: 'Imprime sem quebra de linha', en: 'Prints without a newline' },
  { cmd: 'p x', cat: 'basics', pt: 'Imprime a representação inspecionada (útil p/ debugar)', en: 'Prints the inspected representation (handy for debugging)' },
  { cmd: '# comentário', cat: 'basics', pt: 'Comentário de linha', en: 'Line comment' },
  { cmd: '=begin\n...\n=end', cat: 'basics', pt: 'Comentário de bloco', en: 'Block comment' },
  { cmd: 'nome = "Ana"', cat: 'basics', pt: 'Variável local — sem palavra-chave', en: 'Local variable — no keyword' },
  { cmd: 'NOME = "Ana"', cat: 'basics', pt: 'Constante (identificador começa com maiúscula)', en: 'Constant (identifier starts uppercase)' },
  { cmd: '@nome', cat: 'basics', pt: 'Variável de instância (atributo)', en: 'Instance variable (attribute)' },
  { cmd: '@@nome', cat: 'basics', pt: 'Variável de classe (compartilhada pelas instâncias)', en: 'Class variable (shared by instances)' },
  { cmd: '$nome', cat: 'basics', pt: 'Variável global (evite)', en: 'Global variable (avoid)' },
  { cmd: 'true / false / nil', cat: 'basics', pt: 'Booleanos e nulo — tudo objeto', en: 'Booleans and nil — everything is an object' },
  { cmd: 'if !x', cat: 'basics', pt: 'nil e false são os únicos falsy', en: 'nil and false are the only falsy values' },
  { cmd: 'puts "Oi #{nome}!"', cat: 'basics', pt: 'Interpolação dentro de aspas duplas', en: 'Interpolation inside double quotes' },
  { cmd: 'x = nil || 1', cat: 'basics', pt: '|| retorna o primeiro truthy', en: '|| returns the first truthy operand' },

  // ─── Tipos & conversão ──────────────────────────────────────────────────
  { cmd: '1.class', cat: 'types', pt: 'Todo valor é objeto — 1 é um Integer', en: 'Every value is an object — 1 is an Integer' },
  { cmd: '3.14', cat: 'types', pt: 'Float', en: 'Float' },
  { cmd: ':simbolo', cat: 'types', pt: 'Símbolo — imutável, comparado por identidade', en: 'Symbol — immutable, compared by identity' },
  { cmd: 'x.to_s', cat: 'types', pt: 'Converte para String', en: 'Converts to String' },
  { cmd: '"42".to_i', cat: 'types', pt: 'Converte para Integer', en: 'Converts to Integer' },
  { cmd: '"42".to_f', cat: 'types', pt: 'Converte para Float', en: 'Converts to Float' },
  { cmd: 'x.to_sym', cat: 'types', pt: 'Converte para símbolo', en: 'Converts to symbol' },
  { cmd: 'x.is_a?(Integer)', cat: 'types', pt: 'Testa o tipo (herança incluída)', en: 'Type test (inheritance included)' },
  { cmd: 'x.nil?', cat: 'types', pt: 'É nil? — método real, não operador', en: 'Is it nil? — a real method, not an operator' },
  { cmd: 'x.respond_to?(:upcase)', cat: 'types', pt: 'Responde ao método? (duck typing)', en: 'Does it respond to the method? (duck typing)' },
  { cmd: '1.eql?(1.0)', cat: 'types', pt: 'Comparação estrita — tipo e valor iguais (false)', en: 'Strict comparison — same type and value (false)' },
  { cmd: '1 == 1.0', cat: 'types', pt: 'Comparação por valor (true)', en: 'Value comparison (true)' },
  { cmd: '"1".to_i vs 1.to_s', cat: 'types', pt: 'Conversões entre string e número', en: 'Conversions between string and number' },

  // ─── Strings & símbolos ─────────────────────────────────────────────────
  { cmd: '"abc".length', cat: 'strings', pt: 'Comprimento (alias: size)', en: 'Length (alias: size)' },
  { cmd: '"abc".upcase', cat: 'strings', pt: 'Maiúsculas — não muta a original', en: 'Uppercase — does not mutate the original' },
  { cmd: '"ABC".downcase', cat: 'strings', pt: 'Minúsculas', en: 'Lowercase' },
  { cmd: '"hello".include?("ell")', cat: 'strings', pt: 'Contém a substring?', en: 'Does it include the substring?' },
  { cmd: '"photo.jpg".start_with?("pho")', cat: 'strings', pt: 'Começa com?', en: 'Starts with?' },
  { cmd: '"photo.jpg".end_with?(".jpg")', cat: 'strings', pt: 'Termina com?', en: 'Ends with?' },
  { cmd: '"a,b,c".split(",")', cat: 'strings', pt: 'Divide em array pelo separador', en: 'Splits into an array by separator' },
  { cmd: '["a", "b"].join(", ")', cat: 'strings', pt: 'Une o array em uma string', en: 'Joins the array into a string' },
  { cmd: '"  x  ".strip', cat: 'strings', pt: 'Remove espaços das pontas', en: 'Trims whitespace from the ends' },
  { cmd: '"banana".gsub("na", "NA")', cat: 'strings', pt: 'Substitui todas as ocorrências', en: 'Replaces every occurrence' },
  { cmd: '"banana".sub("na", "NA")', cat: 'strings', pt: 'Substitui só a primeira ocorrência', en: 'Replaces only the first occurrence' },
  { cmd: '"banana".delete("a")', cat: 'strings', pt: 'Remove os caracteres informados', en: 'Removes the given characters' },
  { cmd: '"abc".chars', cat: 'strings', pt: 'Array com os caracteres', en: 'Array of characters' },
  { cmd: '"abc"[1]', cat: 'strings', pt: 'Acessa por índice (retorna caractere)', en: 'Indexing (returns a character)' },
  { cmd: '"abc" * 3', cat: 'strings', pt: 'Repete a string N vezes', en: 'Repeats the string N times' },
  { cmd: '"a" + "b"', cat: 'strings', pt: 'Concatena', en: 'Concatenates' },

  // ─── Arrays & ranges ────────────────────────────────────────────────────
  { cmd: '[1, 2, 3]', cat: 'arrays', pt: 'Array literal', en: 'Array literal' },
  { cmd: '(1..5).to_a', cat: 'arrays', pt: 'Range inclusive → array', en: 'Inclusive range → array' },
  { cmd: 'a << 4', cat: 'arrays', pt: 'Adiciona no fim (alias: push)', en: 'Appends (alias: push)' },
  { cmd: 'a.pop', cat: 'arrays', pt: 'Remove e retorna o último', en: 'Removes and returns the last' },
  { cmd: 'a.shift', cat: 'arrays', pt: 'Remove e retorna o primeiro', en: 'Removes and returns the first' },
  { cmd: 'a.unshift(0)', cat: 'arrays', pt: 'Insere no início', en: 'Inserts at the front' },
  { cmd: 'a.first / a.last', cat: 'arrays', pt: 'Primeiro / último elemento', en: 'First / last element' },
  { cmd: 'a.length', cat: 'arrays', pt: 'Quantidade de elementos', en: 'Number of elements' },
  { cmd: 'a.include?(2)', cat: 'arrays', pt: 'Contém o valor?', en: 'Does it contain the value?' },
  { cmd: 'a.map { |x| x * 2 }', cat: 'arrays', pt: 'Transforma cada elemento (alias: collect)', en: 'Transforms each element (alias: collect)' },
  { cmd: 'a.select { |x| x > 1 }', cat: 'arrays', pt: 'Mantém os que passam (alias: filter)', en: 'Keeps matching elements (alias: filter)' },
  { cmd: 'a.reject { |x| x > 1 }', cat: 'arrays', pt: 'Remove os que passam', en: 'Removes matching elements' },
  { cmd: 'a.each { |x| puts x }', cat: 'arrays', pt: 'Itera cada elemento', en: 'Iterates each element' },
  { cmd: 'a.each_with_index { |x, i| puts i }', cat: 'arrays', pt: 'Itera com o índice', en: 'Iterates with the index' },
  { cmd: 'a.reduce(0) { |acc, x| acc + x }', cat: 'arrays', pt: 'Acumula um resultado (alias: inject)', en: 'Accumulates a result (alias: inject)' },
  { cmd: 'a.sort', cat: 'arrays', pt: 'Ordena — não muta a original', en: 'Sorts — does not mutate the original' },
  { cmd: 'a.sort!', cat: 'arrays', pt: 'Ordena in-place (o ! muta)', en: 'Sorts in place (bang mutates)' },
  { cmd: 'a.uniq', cat: 'arrays', pt: 'Remove duplicados', en: 'Removes duplicates' },
  { cmd: 'a.flatten', cat: 'arrays', pt: 'Achata arrays aninhados', en: 'Flattens nested arrays' },
  { cmd: 'a.compact', cat: 'arrays', pt: 'Remove os nil', en: 'Removes nil values' },
  { cmd: 'a.sample', cat: 'arrays', pt: 'Elemento aleatório', en: 'Random element' },
  { cmd: 'a.first(2)', cat: 'arrays', pt: 'Os N primeiros', en: 'The first N' },
  { cmd: 'a.reverse', cat: 'arrays', pt: 'Inverte a ordem', en: 'Reverses the order' },
  { cmd: 'a.index(2)', cat: 'arrays', pt: 'Índice da primeira ocorrência', en: 'Index of the first occurrence' },
  { cmd: 'a.max / a.min', cat: 'arrays', pt: 'Maior / menor valor', en: 'Max / min value' },
  { cmd: 'a.each_slice(2) { |grupo| }', cat: 'arrays', pt: 'Itera em grupos de N', en: 'Iterates in chunks of N' },

  // ─── Hashes ─────────────────────────────────────────────────────────────
  { cmd: 'h = { nome: "Ana", idade: 30 }', cat: 'hashes', pt: 'Hash com chaves símbolo', en: 'Hash with symbol keys' },
  { cmd: 'h[:nome]', cat: 'hashes', pt: 'Acessa pela chave', en: 'Accesses by key' },
  { cmd: 'h[:cidade]', cat: 'hashes', pt: 'Chave ausente retorna nil', en: 'Missing key returns nil' },
  { cmd: 'h.fetch(:cidade, "SP")', cat: 'hashes', pt: 'Com valor padrão se não existir', en: 'With a default value when missing' },
  { cmd: 'h.fetch(:cidade)', cat: 'hashes', pt: 'Lança KeyError se não existir', en: 'Raises KeyError when missing' },
  { cmd: 'h.key?(:nome)', cat: 'hashes', pt: 'Existe a chave? (alias: has_key?, include?)', en: 'Does the key exist? (alias: has_key?, include?)' },
  { cmd: 'h.keys / h.values', cat: 'hashes', pt: 'Array de chaves / valores', en: 'Array of keys / values' },
  { cmd: 'h.each { |k, v| puts k }', cat: 'hashes', pt: 'Itera os pares chave-valor', en: 'Iterates key-value pairs' },
  { cmd: 'h.delete(:idade)', cat: 'hashes', pt: 'Remove e retorna o valor', en: 'Deletes and returns the value' },
  { cmd: 'h.merge(b)', cat: 'hashes', pt: 'Une dois hashes — não muta', en: 'Merges two hashes — non-mutating' },
  { cmd: 'h[:nova] = 1', cat: 'hashes', pt: 'Adiciona ou sobrescreve', en: 'Adds or overwrites' },
  { cmd: 'h.transform_values { |v| v * 2 }', cat: 'hashes', pt: 'Transforma os valores', en: 'Transforms the values' },
  { cmd: 'h.dig(:a, :b)', cat: 'hashes', pt: 'Acesso aninhado que retorna nil em vez de quebrar', en: 'Nested access returning nil instead of erroring' },
  { cmd: 'Hash.new(0)', cat: 'hashes', pt: 'Hash com valor padrão 0', en: 'Hash with default value 0' },
  { cmd: 'Hash.new { |h, k| h[k] = [] }', cat: 'hashes', pt: 'Default calculado por bloco (auto-vetor)', en: 'Default computed by a block (auto-array)' },
  { cmd: 'h.sort_by { |_, v| v }', cat: 'hashes', pt: 'Ordena os pares pelo valor', en: 'Sorts pairs by value' },

  // ─── Controle de fluxo ──────────────────────────────────────────────────
  { cmd: 'if x > 0\n  ...\nelsif x < 0\n  ...\nelse\n  ...\nend', cat: 'control', pt: 'Condicional clássico', en: 'Classic conditional' },
  { cmd: 'unless x', cat: 'control', pt: 'Se NÃO for — inverso do if', en: 'If NOT — the inverse of if' },
  { cmd: 'x > 0 ? "pos" : "neg"', cat: 'control', pt: 'Operador ternário', en: 'Ternary operator' },
  { cmd: 'puts "oi" if x', cat: 'control', pt: 'Modificador inline — if no fim da linha', en: 'Inline modifier — if at the end of the line' },
  { cmd: 'case x\nwhen 1 then "um"\nwhen 2, 3 then "dois ou tres"\nelse "outro"\nend', cat: 'control', pt: 'Switch estilo Ruby (usando ===)', en: 'Ruby-style switch (uses ===)' },
  { cmd: 'case n\nwhen 1..10 then "baixo"\nend', cat: 'control', pt: 'Case com range', en: 'Case with a range' },
  { cmd: 'while x < 10\n  ...\nend', cat: 'control', pt: 'Loop com condição no topo', en: 'Loop with condition at the top' },
  { cmd: 'until x > 10\n  ...\nend', cat: 'control', pt: 'Loop até a condição ficar true', en: 'Loops until the condition is true' },
  { cmd: 'loop do\n  break if x > 10\nend', cat: 'control', pt: 'Loop infinito com break', en: 'Infinite loop with break' },
  { cmd: '10.times { |i| puts i }', cat: 'control', pt: 'Repete o bloco N vezes', en: 'Repeats the block N times' },
  { cmd: '(1..10).each { |n| puts n }', cat: 'control', pt: 'Itera sobre um range', en: 'Iterates over a range' },
  { cmd: '5.times do |i|\n  puts i\nend', cat: 'control', pt: 'Bloco multi-linha com do/end', en: 'Multi-line block with do/end' },
  { cmd: 'break', cat: 'control', pt: 'Sai do loop imediatamente', en: 'Exits the loop immediately' },
  { cmd: 'next', cat: 'control', pt: 'Pula para a próxima iteração', en: 'Skips to the next iteration' },
  { cmd: 'for i in 1..5\n  ...\nend', cat: 'control', pt: 'for — existe, mas prefira each', en: 'for — exists, but prefer each' },

  // ─── Métodos, blocks & lambdas ──────────────────────────────────────────
  { cmd: 'def soma(a, b)\n  a + b\nend', cat: 'methods', pt: 'Método — retorna a última expressão', en: 'Method — returns the last expression' },
  { cmd: 'def oi(nome = "mundo")\n  ...\nend', cat: 'methods', pt: 'Argumento com valor padrão', en: 'Argument with a default value' },
  { cmd: 'def f(*args)\n  ...\nend', cat: 'methods', pt: 'Splat — recebe N argumentos como array', en: 'Splat — collects N args into an array' },
  { cmd: 'def f(a, b: 1)\n  ...\nend', cat: 'methods', pt: 'Argumento nomeado com padrão (opcional)', en: 'Keyword argument with a default (optional)' },
  { cmd: 'def f(a, b:)\n  ...\nend', cat: 'methods', pt: 'Argumento nomeado obrigatório', en: 'Required keyword argument' },
  { cmd: 'def f(&bloco)\n  bloco.call\nend', cat: 'methods', pt: 'Recebe um bloco como argumento', en: 'Receives a block as an argument' },
  { cmd: 'def f\n  yield\nend', cat: 'methods', pt: 'Chama o bloco passado com yield', en: 'Calls the passed block with yield' },
  { cmd: '->(x) { x * 2 }', cat: 'methods', pt: 'Lambda — verifica aridade como método', en: 'Lambda — checks arity like a method' },
  { cmd: 'proc { |x| x * 2 }', cat: 'methods', pt: 'Proc — mais permissivo que lambda', en: 'Proc — more lenient than a lambda' },
  { cmd: '[1, "2"].map(&:to_i)', cat: 'methods', pt: 'Symbol-to-proc — converte símbolo em bloco', en: 'Symbol-to-proc — turns a symbol into a block' },
  { cmd: 'obj.send(:metodo, arg)', cat: 'methods', pt: 'Chama um método pelo nome em símbolo', en: 'Calls a method by its name as a symbol' },
  { cmd: 'return', cat: 'methods', pt: 'Retorno cedo — na prática raramente necessário', en: 'Early return — rarely needed in practice' },
  { cmd: 'def f(x) = x * 2', cat: 'methods', pt: 'Definição de uma linha (Ruby 3+)', en: 'One-line definition (Ruby 3+)' },

  // ─── Classes, módulos & OOP ─────────────────────────────────────────────
  { cmd: 'class Usuario\n  ...\nend', cat: 'oop', pt: 'Define uma classe (sempre maiúscula)', en: 'Defines a class (always uppercase)' },
  { cmd: 'def initialize(nome)\n  @nome = nome\nend', cat: 'oop', pt: 'Construtor chamado por new', en: 'Constructor called by new' },
  { cmd: 'attr_reader :nome', cat: 'oop', pt: 'Só leitura', en: 'Read only' },
  { cmd: 'attr_writer :nome', cat: 'oop', pt: 'Só escrita', en: 'Write only' },
  { cmd: 'attr_accessor :nome', cat: 'oop', pt: 'Leitura + escrita', en: 'Read + write' },
  { cmd: '@nome', cat: 'oop', pt: 'Variável de instância — cada objeto tem a sua', en: 'Instance variable — one per object' },
  { cmd: 'def self.contar\n  ...\nend', cat: 'oop', pt: 'Método de classe (chamado na classe)', en: 'Class method (called on the class)' },
  { cmd: 'class << self\n  ...\nend', cat: 'oop', pt: 'Bloco que define vários métodos de classe', en: 'Block that defines several class methods' },
  { cmd: 'class Admin < Usuario\n  ...\nend', cat: 'oop', pt: 'Herança', en: 'Inheritance' },
  { cmd: 'super', cat: 'oop', pt: 'Chama o mesmo método na classe pai', en: 'Calls the same method on the parent class' },
  { cmd: 'module Funcoes\n  ...\nend', cat: 'oop', pt: 'Módulo — agrupa métodos sem herança', en: 'Module — groups methods without inheritance' },
  { cmd: 'include Funcoes', cat: 'oop', pt: 'Mixin — vira métodos de instância', en: 'Mixin — becomes instance methods' },
  { cmd: 'extend Funcoes', cat: 'oop', pt: 'Mixin — vira métodos de classe', en: 'Mixin — becomes class methods' },
  { cmd: 'prepend Funcoes', cat: 'oop', pt: 'Mixin — roda antes da própria classe', en: 'Mixin — runs before the class itself' },
  { cmd: 'private', cat: 'oop', pt: 'A partir daqui os métodos ficam privados', en: 'From here on, methods are private' },
  { cmd: 'Usuario.new("Ana")', cat: 'oop', pt: 'Instancia e chama initialize', en: 'Instantiates and calls initialize' },
  { cmd: 'def to_s\n  @nome\nend', cat: 'oop', pt: 'Define a representação em string', en: 'Defines the string representation' },
  { cmd: 'include Comparable', cat: 'oop', pt: 'Inclua + defina <=> e ganhe <, >, ==', en: 'Include + define <=> and get <, >, ==' },
  { cmd: 'include Enumerable', cat: 'oop', pt: 'Inclua + defina each e ganhe map/select...', en: 'Include + define each and get map/select...' },

  // ─── Exceções ───────────────────────────────────────────────────────────
  { cmd: 'begin\n  ...\nrescue => e\n  ...\nend', cat: 'exceptions', pt: 'Captura a exceção', en: 'Rescues the exception' },
  { cmd: 'begin\n  ...\nrescue StandardError => e\n  ...\nend', cat: 'exceptions', pt: 'Captura só erros padrão', en: 'Rescues only standard errors' },
  { cmd: 'begin\n  ...\nensure\n  ...\nend', cat: 'exceptions', pt: 'Sempre executa (limpeza)', en: 'Always runs (cleanup)' },
  { cmd: 'raise "erro"', cat: 'exceptions', pt: 'Lança uma RuntimeError', en: 'Raises a RuntimeError' },
  { cmd: 'raise ArgumentError, "msg"', cat: 'exceptions', pt: 'Lança um tipo específico com mensagem', en: 'Raises a specific type with a message' },
  { cmd: 'class MeuErro < StandardError; end', cat: 'exceptions', pt: 'Exceção customizada', en: 'Custom exception' },
  { cmd: 'rescue MeuErro', cat: 'exceptions', pt: 'Captura só um tipo específico', en: 'Rescues only one specific type' },
  { cmd: 'e.message / e.backtrace', cat: 'exceptions', pt: 'Mensagem e stack trace da exceção', en: 'Exception message and backtrace' },
  { cmd: 'rescue => e; retry', cat: 'exceptions', pt: 'Tenta de novo após o rescue', en: 'Retries after the rescue' },

  // ─── Arquivos, IO & ENV ─────────────────────────────────────────────────
  { cmd: 'File.read("a.txt")', cat: 'files', pt: 'Lê o arquivo inteiro em uma string', en: 'Reads the whole file into a string' },
  { cmd: 'File.readlines("a.txt")', cat: 'files', pt: 'Lê como array de linhas', en: 'Reads as an array of lines' },
  { cmd: 'File.write("a.txt", "conteudo")', cat: 'files', pt: 'Escreve (sobrescreve)', en: 'Writes (overwrites)' },
  { cmd: 'File.open("a.txt", "a") { |f| f.puts "x" }', cat: 'files', pt: 'Append — fecha o arquivo ao fim do bloco', en: 'Append — closes the file when the block ends' },
  { cmd: 'File.exist?("a.txt")', cat: 'files', pt: 'Existe? (alias: File.exists?)', en: 'Does it exist? (alias: File.exists?)' },
  { cmd: 'File.size("a.txt")', cat: 'files', pt: 'Tamanho em bytes', en: 'Size in bytes' },
  { cmd: 'File.delete("a.txt")', cat: 'files', pt: 'Apaga o arquivo', en: 'Deletes the file' },
  { cmd: 'File.join("dir", "a.txt")', cat: 'files', pt: 'Junta caminhos com o separador certo', en: 'Joins paths with the right separator' },
  { cmd: 'Dir.glob("*.rb")', cat: 'files', pt: 'Lista arquivos por padrão', en: 'Lists files by pattern' },
  { cmd: 'Dir.mkdir("pasta")', cat: 'files', pt: 'Cria um diretório', en: 'Creates a directory' },
  { cmd: 'File.directory?("pasta")', cat: 'files', pt: 'É um diretório?', en: 'Is it a directory?' },
  { cmd: 'STDIN.gets', cat: 'files', pt: 'Lê uma linha do input', en: 'Reads a line from input' },
  { cmd: 'ARGV', cat: 'files', pt: 'Array com os argumentos da linha de comando', en: 'Array of command-line arguments' },
  { cmd: 'ENV["HOME"]', cat: 'files', pt: 'Variável de ambiente', en: 'Environment variable' },
  { cmd: 'require "json"', cat: 'files', pt: 'Carrega uma biblioteca (absolute)', en: 'Loads a library (absolute)' },
  { cmd: 'require_relative "outro"', cat: 'files', pt: 'Carrega relativo ao arquivo atual', en: 'Loads relative to the current file' },

  // ─── Ruby idioms & boas práticas ────────────────────────────────────────
  { cmd: 'a ||= []', cat: 'idioms', pt: 'Só atribui se a for nil/false (memoização)', en: 'Assigns only if a is nil/false (memoization)' },
  { cmd: 'user&.nome', cat: 'idioms', pt: 'Safe navigation — retorna nil se user for nil', en: 'Safe navigation — returns nil if user is nil' },
  { cmd: 'obj.tap { |o| o.nome = "x" }', cat: 'idioms', pt: 'Roda o bloco e devolve o próprio objeto', en: 'Yields the object and returns it' },
  { cmd: 'obj.then { |o| o.transform }', cat: 'idioms', pt: 'Encadeia transformações (alias: yield_self)', en: 'Chains transformations (alias: yield_self)' },
  { cmd: 'a.map! { |x| x * 2 }', cat: 'idioms', pt: 'Versões com ! mutam o objeto original', en: 'Bang versions mutate the original object' },
  { cmd: 'def method_missing(nome, *args)\n  ...\nend', cat: 'idioms', pt: 'Responde a métodos que não existem', en: 'Responds to methods that do not exist' },
  { cmd: 'n = 1_000_000', cat: 'idioms', pt: 'Separador de milhar para legibilidade', en: 'Thousand separator for readability' },
  { cmd: 's = %w[ana beto carla]', cat: 'idioms', pt: 'Array de palavras sem aspas', en: 'Array of words without quotes' },
  { cmd: 's = %i[a b c]', cat: 'idioms', pt: 'Array de símbolos', en: 'Array of symbols' },
  { cmd: 'puts "oi" if x > 0', cat: 'idioms', pt: 'If/unless no fim da linha para uma ação', en: 'Trailing if/unless for a single action' },
  { cmd: 'x = a.first(3).map(&:to_i)', cat: 'idioms', pt: 'Cadeia de métodos — pipeline limpo', en: 'Method chaining — a clean pipeline' },
  { cmd: 'ENV.fetch("PORT", 3000)', cat: 'idioms', pt: 'Env com valor padrão', en: 'Env with a default value' },
  { cmd: '"abc".frozen?', cat: 'idioms', pt: 'Checa se a string está congelada', en: 'Checks whether the string is frozen' },

  // ─── Gems & testes ──────────────────────────────────────────────────────
  { cmd: 'bundle exec rspec', cat: 'tooling', pt: 'Roda a suíte RSpec', en: 'Runs the RSpec suite' },
  { cmd: 'ruby -Itest arquivo_test.rb', cat: 'tooling', pt: 'Roda testes Minitest direto', en: 'Runs Minitest tests directly' },
  { cmd: 'describe "..." do\n  it "..." do\n    expect(x).to eq(1)\n  end\nend', cat: 'tooling', pt: 'Estrutura básica de um teste RSpec', en: 'Basic RSpec test structure' },
  { cmd: 'assert_equal 1, x', cat: 'tooling', pt: 'Assertiva básica do Minitest', en: 'Basic Minitest assertion' },
  { cmd: 'rake -T', cat: 'tooling', pt: 'Lista as tasks disponíveis do Rake', en: 'Lists the available Rake tasks' },
  { cmd: 'rubocop', cat: 'tooling', pt: 'Linter oficial de estilo (segue Style Guide)', en: 'Official style linter (follows the Style Guide)' },
  { cmd: 'gem build nome.gemspec', cat: 'tooling', pt: 'Gera o arquivo .gem a partir do gemspec', en: 'Builds the .gem file from the gemspec' },
  { cmd: 'gem push nome-0.1.0.gem', cat: 'tooling', pt: 'Publica a gem no Rubygems', en: 'Publishes the gem to Rubygems' },
  { cmd: 'source "https://rubygems.org"', cat: 'tooling', pt: 'Primeira linha típica de um Gemfile', en: 'Typical first line of a Gemfile' },
  { cmd: '# frozen_string_literal: true', cat: 'tooling', pt: 'Comentário mágico que congela strings (otimização)', en: 'Magic comment that freezes strings (optimization)' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Ruby',
    intro: (
      <>
        Referência pesquisável da linguagem Ruby — CLI, Rubygems e Bundler,
        básicos da sintaxe, tipos e conversões, strings e símbolos, arrays e
        ranges, hashes, controle de fluxo, métodos e blocks, classes e
        módulos, exceções, arquivos e IO, idioms e boas práticas e testes.
        Tudo 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Tudo é objeto e o retorno de um método é a última expressão — prefira
        isso a <Text code>return</Text> explícito. Os únicos valores falsy são{' '}
        <Text code>nil</Text> e <Text code>false</Text>. Prefira{' '}
        <Text code>each</Text>/<Text code>map</Text> a{' '}
        <Text code>for</Text>. Use <Text code>&amp;.</Text> (safe navigation)
        para encadeamentos que podem ser <Text code>nil</Text>,{' '}
        <Text code>||=</Text> para memoização, e lembre que os métodos com{' '}
        <Text code>!</Text> (como <Text code>sort!</Text>) mutam o objeto
        original.
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
    title: 'Ruby Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Ruby language — CLI, Rubygems and
        Bundler, syntax basics, types and conversions, strings and symbols,
        arrays and ranges, hashes, control flow, methods and blocks, classes
        and modules, exceptions, files and IO, idioms and good practices,
        and testing. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Everything is an object and a method returns its last expression —
        prefer that to an explicit <Text code>return</Text>. The only falsy
        values are <Text code>nil</Text> and <Text code>false</Text>. Prefer{' '}
        <Text code>each</Text>/<Text code>map</Text> over <Text code>for</Text>.
        Use <Text code>&amp;.</Text> (safe navigation) for chains that might
        be <Text code>nil</Text>, <Text code>||=</Text> for memoization, and
        remember that bang methods (like <Text code>sort!</Text>) mutate the
        original object.
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

export default function RubyCheatsheetPage() {
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
