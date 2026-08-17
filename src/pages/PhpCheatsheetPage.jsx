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
  'control',
  'functions',
  'oop',
  'exceptions',
  'files',
  'database',
  'web',
  'datetime',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  strings: 'magenta',
  arrays: 'green',
  control: 'cyan',
  functions: 'lime',
  oop: 'volcano',
  exceptions: 'red',
  files: 'blue',
  database: 'orange',
  web: 'gold',
  datetime: 'cyan',
}

const labelOf = {
  cli: { pt: 'CLI & Composer', en: 'CLI & Composer' },
  basics: { pt: 'Básicos & sintaxe', en: 'Basics & syntax' },
  types: { pt: 'Tipos & conversão', en: 'Types & conversion' },
  strings: { pt: 'Strings & regex', en: 'Strings & regex' },
  arrays: { pt: 'Arrays & funções de array', en: 'Arrays & array functions' },
  control: { pt: 'Controle de fluxo', en: 'Control flow' },
  functions: { pt: 'Funções, closures & lambdas', en: 'Functions, closures & lambdas' },
  oop: { pt: 'OOP & enums', en: 'OOP & enums' },
  exceptions: { pt: 'Exceções & erros', en: 'Exceptions & errors' },
  files: { pt: 'Arquivos & JSON', en: 'Files & JSON' },
  database: { pt: 'PDO & banco de dados', en: 'PDO & databases' },
  web: { pt: 'Web & HTTP', en: 'Web & HTTP' },
  datetime: { pt: 'Data & hora', en: 'Date & time' },
}

const COMMANDS = [
  // ─── CLI & Composer ──────────────────────────────────────────────────────
  { cmd: 'php -v', cat: 'cli', pt: 'Mostra a versão do PHP', en: 'Shows the PHP version' },
  { cmd: 'php --ini', cat: 'cli', pt: 'Lista os arquivos php.ini carregados', en: 'Lists the loaded php.ini files' },
  { cmd: 'php -m', cat: 'cli', pt: 'Lista os módulos disponíveis', en: 'Lists the available modules' },
  { cmd: 'php -l arquivo.php', cat: 'cli', pt: 'Lint — apenas verifica a sintaxe (não executa)', en: 'Lint — only checks syntax (does not run)' },
  { cmd: 'php -r \'echo 1 + 1;\'', cat: 'cli', pt: 'Executa código inline sem criar arquivo', en: 'Runs inline code without a file' },
  { cmd: 'php -d memory_limit=1G script.php', cat: 'cli', pt: 'Sobrescreve uma diretiva do php.ini só pra essa execução', en: 'Overrides a php.ini directive just for this run' },
  { cmd: 'php -S localhost:8000', cat: 'cli', pt: 'Servidor de desenvolvimento embutido (PHP 5.4+)', en: 'Built-in development server (PHP 5.4+)' },
  { cmd: 'php -S 0.0.0.0:8080 -t public', cat: 'cli', pt: 'Dev server com document root em public/', en: 'Dev server with document root in public/' },
  { cmd: 'composer init', cat: 'cli', pt: 'Cria um composer.json interativamente', en: 'Creates a composer.json interactively' },
  { cmd: 'composer install', cat: 'cli', pt: 'Instala dependências a partir do composer.lock', en: 'Installs dependencies from composer.lock' },
  { cmd: 'composer require laravel/framework', cat: 'cli', pt: 'Adiciona uma dependência nova e instala', en: 'Adds a new dependency and installs it' },
  { cmd: 'composer update', cat: 'cli', pt: 'Atualiza as dependências e o lock file', en: 'Updates dependencies and the lock file' },
  { cmd: 'composer dump-autoload', cat: 'cli', pt: 'Regenera o autoloader (após mudar classes/namespaces)', en: 'Regenerates the autoloader (after class/namespace changes)' },
  { cmd: 'composer create-project laravel/laravel app', cat: 'cli', pt: 'Clona um projeto modelo em uma pasta nova', en: 'Clones a template project into a new folder' },
  { cmd: 'php artisan serve', cat: 'cli', pt: 'Dev server do Laravel (por cima do embutido)', en: 'Laravel dev server (on top of the built-in one)' },
  { cmd: 'php artisan tinker', cat: 'cli', pt: 'REPL interativo do Laravel (pode usar Eloquent)', en: 'Interactive Laravel REPL (Eloquent works)' },

  // ─── Básicos & sintaxe ──────────────────────────────────────────────────
  { cmd: '<?php ... ?>', cat: 'basics', pt: 'Tags de abertura/fechamento do PHP', en: 'PHP opening/closing tags' },
  { cmd: '<?= $nome ?>', cat: 'basics', pt: 'Atalho de echo dentro do HTML', en: 'Echo shortcut inside HTML' },
  { cmd: 'echo "ola";', cat: 'basics', pt: 'Exibe texto (não retorna valor)', en: 'Prints text (does not return a value)' },
  { cmd: 'print_r($arr);', cat: 'basics', pt: 'Imprime array/objeto de forma legível', en: 'Prints an array/object in a readable way' },
  { cmd: 'var_dump($x);', cat: 'basics', pt: 'Mostra o tipo e o valor da variável', en: 'Dumps the type and value of a variable' },
  { cmd: '$nome = \'Ana\';', cat: 'basics', pt: 'Variáveis começam com $ e são case-sensitive', en: 'Variables start with $ and are case-sensitive' },
  { cmd: 'define(\'MODE\', \'dev\');', cat: 'basics', pt: 'Constante definida em runtime', en: 'Constant defined at runtime' },
  { cmd: 'const PI = 3.14;', cat: 'basics', pt: 'Constante em tempo de compilação (nível top/class)', en: 'Compile-time constant (top/class level)' },
  { cmd: 'declare(strict_types=1);', cat: 'basics', pt: 'Habilita tipagem estrita (deve ser 1ª declaração do arquivo)', en: 'Enables strict typing (must be the first statement)' },
  { cmd: '// linha  /* bloco */  # linha', cat: 'basics', pt: 'Os três estilos de comentário', en: 'All three comment styles' },
  { cmd: 'true / false / null', cat: 'basics', pt: 'Literais booleanos e nulo (case-insensitive)', en: 'Boolean literals and null (case-insensitive)' },
  { cmd: '$x = $y = $z = 1;', cat: 'basics', pt: 'Atribuição encadeada', en: 'Chained assignment' },
  { cmd: ';', cat: 'basics', pt: 'Toda instrução termina com ponto-e-vírgula', en: 'Every statement ends with a semicolon' },

  // ─── Tipos & conversão ──────────────────────────────────────────────────
  { cmd: '(int) $str', cat: 'types', pt: 'Cast explícito para int (aceita float, string, bool...)', en: 'Explicit cast to int (accepts float, string, bool...)' },
  { cmd: 'intval(\'42\');', cat: 'types', pt: 'Converte para int com função', en: 'Converts to int with a function' },
  { cmd: '(float) / (string) / (bool) / (array)', cat: 'types', pt: 'Os demais casts mais comuns', en: 'The other common casts' },
  { cmd: 'strval(42);  boolval(0);  floatval(\'1.5\')', cat: 'types', pt: 'Conversões explícitas por função', en: 'Explicit conversions via functions' },
  { cmd: 'gettype($x);', cat: 'types', pt: 'Retorna o nome do tipo como string', en: 'Returns the type name as a string' },
  { cmd: 'is_int($x); is_string($x); is_array($x); is_null($x);', cat: 'types', pt: 'Verificações de tipo', en: 'Type checks' },
  { cmd: '$x === $y', cat: 'types', pt: 'Comparação estrita — tipo E valor iguais', en: 'Strict comparison — same type AND value' },
  { cmd: '$x == $y', cat: 'types', pt: 'Comparação solta — converte antes de comparar', en: 'Loose comparison — converts before comparing' },
  { cmd: '?int $n = null;', cat: 'types', pt: 'Tipo anulável (aceita int ou null)', en: 'Nullable type (accepts int or null)' },
  { cmd: 'int|string $v', cat: 'types', pt: 'Union type — PHP 8.0+', en: 'Union type — PHP 8.0+' },
  { cmd: 'intdiv(7, 2);', cat: 'types', pt: 'Divisão inteira (7/2 = 3)', en: 'Integer division (7/2 = 3)' },
  { cmd: '$n % 2', cat: 'types', pt: 'Resto da divisão (módulo)', en: 'Modulo (remainder)' },

  // ─── Strings & regex ────────────────────────────────────────────────────
  { cmd: 'strlen(\'abc\');', cat: 'strings', pt: 'Comprimento em bytes', en: 'Length in bytes' },
  { cmd: 'mb_strlen(\'café\');', cat: 'strings', pt: 'Comprimento em caracteres (multibyte)', en: 'Length in characters (multibyte)' },
  { cmd: 'str_replace(\'a\', \'o\', \'banana\');', cat: 'strings', pt: 'Substitui todas as ocorrências', en: 'Replaces every occurrence' },
  { cmd: 'substr(\'hello\', 1, 3);', cat: 'strings', pt: 'Fatia a string — [início, comprimento)', en: 'Slices the string — [start, length)' },
  { cmd: 'strpos(\'hello\', \'l\');', cat: 'strings', pt: 'Primeira posição (retorna false se não achar!)', en: 'First position (returns false if not found!)' },
  { cmd: 'str_contains(\'hello\', \'ell\');', cat: 'strings', pt: 'Contém? — PHP 8.0+', en: 'Does it contain? — PHP 8.0+' },
  { cmd: 'str_starts_with($s, \'http\');  str_ends_with($s, \'.pdf\');', cat: 'strings', pt: 'Prefixo e sufixo — PHP 8.0+', en: 'Prefix and suffix — PHP 8.0+' },
  { cmd: 'explode(\',\', \'a,b,c\');', cat: 'strings', pt: 'Divide em array por separador', en: 'Splits into an array by separator' },
  { cmd: 'implode(\', \', [\'a\', \'b\']);', cat: 'strings', pt: 'Une o array em string (alias: join)', en: 'Joins an array into a string (alias: join)' },
  { cmd: 'trim(\'  x  \');  ltrim();  rtrim();', cat: 'strings', pt: 'Remove espaços das pontas', en: 'Trims whitespace from the ends' },
  { cmd: 'strtolower($s); strtoupper($s); ucfirst($s); ucwords($s);', cat: 'strings', pt: 'Caixa baixa/alta e capitalização', en: 'Lowercase/uppercase and capitalization' },
  { cmd: 'str_pad(\'1\', 4, \'0\', STR_PAD_LEFT);', cat: 'strings', pt: 'Preenche até N chars → 0001', en: 'Pads up to N chars → 0001' },
  { cmd: '$s = "Olá $nome";', cat: 'strings', pt: 'Interpolação simples em aspas duplas', en: 'Simple interpolation inside double quotes' },
  { cmd: '$s = "Preço: {$preco} reais";', cat: 'strings', pt: 'Interpolação de expressões/arrays com chaves', en: 'Expression/array interpolation with braces' },
  { cmd: '$s = <<<EOT\nLivre...\nEOT;', cat: 'strings', pt: 'Heredoc — string multilinha que interpola', en: 'Heredoc — multiline string that interpolates' },
  { cmd: '$s = <<<\'EOT\'\nSem interpolação\nEOT;', cat: 'strings', pt: 'Nowdoc — multilinha literal, sem interpolação', en: 'Nowdoc — literal multiline, no interpolation' },
  { cmd: 'sprintf(\'%04d-%02d\', 2024, 5);', cat: 'strings', pt: 'Formata com placeholders (tipo printf do C)', en: 'Formats with placeholders (C-style printf)' },
  { cmd: 'str_repeat(\'ab\', 3);', cat: 'strings', pt: 'Repete a string N vezes', en: 'Repeats a string N times' },
  { cmd: 'htmlspecialchars($input, ENT_QUOTES);', cat: 'strings', pt: 'Escapa HTML (obrigatório antes de imprimir input!)', en: 'Escapes HTML (required before printing input!)' },
  { cmd: 'nl2br($txt);', cat: 'strings', pt: 'Transforma quebras de linha em <br>', en: 'Turns newlines into <br> tags' },
  { cmd: 'preg_match(\'/^\\d+$/\', $s);', cat: 'strings', pt: 'Testa se a regex casa (retorna 1 ou 0)', en: 'Tests whether the regex matches (1 or 0)' },
  { cmd: 'preg_replace(\'/[^a-z0-9]/\', \'-\', $s);', cat: 'strings', pt: 'Substitui por regex', en: 'Regex-based substitution' },
  { cmd: 'str_word_count($txt);', cat: 'strings', pt: 'Conta palavras', en: 'Counts words' },

  // ─── Arrays & funções de array ──────────────────────────────────────────
  { cmd: '$a = [1, 2, 3];', cat: 'arrays', pt: 'Sintaxe curta (PHP 5.4+)', en: 'Short syntax (PHP 5.4+)' },
  { cmd: '$a[] = 4;', cat: 'arrays', pt: 'Acrescenta no fim', en: 'Appends to the end' },
  { cmd: '$user = [\'nome\' => \'Ana\', \'idade\' => 30];', cat: 'arrays', pt: 'Array associativo chave => valor', en: 'Associative array key => value' },
  { cmd: 'count($a);', cat: 'arrays', pt: 'Quantidade de elementos', en: 'Number of elements' },
  { cmd: 'in_array(2, $a);', cat: 'arrays', pt: 'Existe o valor?', en: 'Does the value exist?' },
  { cmd: 'array_key_exists(\'nome\', $user);', cat: 'arrays', pt: 'Existe a chave? (use isset p/ valor não-nulo)', en: 'Does the key exist? (use isset for non-null value)' },
  { cmd: 'array_keys($user);  array_values($user);', cat: 'arrays', pt: 'Somente chaves / somente valores', en: 'Keys only / values only' },
  { cmd: 'array_merge($a, $b);', cat: 'arrays', pt: 'Junta dois arrays', en: 'Merges two arrays' },
  { cmd: 'array_map(fn($x) => $x * 2, $a);', cat: 'arrays', pt: 'Aplica função a cada elemento', en: 'Applies a function to each element' },
  { cmd: 'array_filter($a, fn($x) => $x > 1);', cat: 'arrays', pt: 'Mantém só os que passam no teste (preserva chaves!)', en: 'Keeps only matching items (keys are preserved!)' },
  { cmd: 'array_values(array_filter($a, fn($x) => $x > 1));', cat: 'arrays', pt: 'Reindexa as chaves após o filter', en: 'Re-indexes keys after filtering' },
  { cmd: 'array_reduce($a, fn($c, $x) => $c + $x, 0);', cat: 'arrays', pt: 'Reduz a um único valor (soma)', en: 'Reduces to a single value (sum)' },
  { cmd: 'sort($a);  rsort($a);', cat: 'arrays', pt: 'Ordena pelos valores (reindexa)', en: 'Sorts by values (re-indexes)' },
  { cmd: 'asort($a);  ksort($a);', cat: 'arrays', pt: 'Ordena mantendo chaves (asort) ou pelas chaves (ksort)', en: 'Sorts keeping keys (asort) or by keys (ksort)' },
  { cmd: 'array_unique($a);', cat: 'arrays', pt: 'Remove duplicados', en: 'Removes duplicates' },
  { cmd: 'array_column($rows, \'nome\');', cat: 'arrays', pt: 'Extrai uma coluna de um array de arrays', en: 'Extracts a column from an array of arrays' },
  { cmd: 'array_slice($a, 1, 2);', cat: 'arrays', pt: 'Fatia a partir de 1, com 2 elementos', en: 'Slices from index 1, taking 2 elements' },
  { cmd: 'array_chunk($a, 2);', cat: 'arrays', pt: 'Divide em grupos de N', en: 'Chunks into groups of N' },
  { cmd: 'array_sum($a);  array_product($a);', cat: 'arrays', pt: 'Soma e produto dos valores', en: 'Sum and product of values' },
  { cmd: 'min($a);  max($a);', cat: 'arrays', pt: 'Menor e maior valor', en: 'Smallest and largest value' },
  { cmd: 'array_search(\'z\', $a);', cat: 'arrays', pt: 'Retorna a chave do valor (ou false)', en: 'Returns the key of a value (or false)' },
  { cmd: 'array_flip($a);', cat: 'arrays', pt: 'Troca chaves com valores', en: 'Swaps keys and values' },
  { cmd: '$b = [...$a, ...$c];', cat: 'arrays', pt: 'Spread operator para unir/expandir', en: 'Spread operator to merge/expand' },
  { cmd: '[$x, $y] = [1, 2];  [\'nome\' => $n] = $user;', cat: 'arrays', pt: 'Desestruturação de listas e assoc', en: 'List and associative destructuring' },
  { cmd: 'unset($a[0]);', cat: 'arrays', pt: 'Remove um elemento pela chave', en: 'Removes an element by key' },
  { cmd: 'shuffle($a);', cat: 'arrays', pt: 'Embaralha os valores', en: 'Shuffles the values' },

  // ─── Controle de fluxo ──────────────────────────────────────────────────
  { cmd: 'if ($x > 0 && $ok) { } else { }', cat: 'control', pt: 'Condicional com operadores booleanos', en: 'Conditional with boolean operators' },
  { cmd: 'if ($a) { } elseif ($b) { } else { }', cat: 'control', pt: 'Cadeia if/elseif', en: 'If/elseif chain' },
  { cmd: '$msg = $x > 0 ? \'pos\' : \'neg\';', cat: 'control', pt: 'Operador ternário', en: 'Ternary operator' },
  { cmd: '$nome = $input ?? \'anonimo\';', cat: 'control', pt: 'Null coalescing — usa o default se for null', en: 'Null coalescing — defaults when null' },
  { cmd: '$x ??= 5;', cat: 'control', pt: 'Atribui somente se estiver null', en: 'Assigns only when null' },
  { cmd: '$user?->nome;', cat: 'control', pt: 'Nullsafe — retorna null sem erro se $user for null (PHP 8)', en: 'Nullsafe — returns null if $user is null instead of erroring (PHP 8)' },
  { cmd: 'switch ($x) { case 1: ...; break; default: ... }', cat: 'control', pt: 'Switch clássico com break (fall-through)', en: 'Classic switch with break (fall-through)' },
  { cmd: 'match ($x) { 1 => \'um\', 2, 3 => \'dois ou tres\', default => \'outro\' }', cat: 'control', pt: 'Match — expressão, comparação estrita, sem break (PHP 8)', en: 'Match — expression, strict comparison, no break (PHP 8)' },
  { cmd: 'for ($i = 0; $i < 10; $i++) { }', cat: 'control', pt: 'Loop clássico com contador', en: 'Classic counter loop' },
  { cmd: 'foreach ($arr as $v) { }', cat: 'control', pt: 'Itera os valores', en: 'Iterates the values' },
  { cmd: 'foreach ($arr as $k => $v) { }', cat: 'control', pt: 'Itera chaves e valores', en: 'Iterates keys and values' },
  { cmd: 'while ($cond) { }', cat: 'control', pt: 'Loop com condição no topo', en: 'Loop with condition at top' },
  { cmd: 'do { } while ($cond);', cat: 'control', pt: 'Executa pelo menos uma vez', en: 'Runs at least once' },
  { cmd: 'break;  continue;', cat: 'control', pt: 'Sai do loop / pula para a próxima iteração', en: 'Exits the loop / skips the iteration' },
  { cmd: 'break 2;', cat: 'control', pt: 'Sai de dois níveis de loop aninhado', en: 'Breaks out of two nested loops' },
  { cmd: 'if ($a): ... endif;  foreach ($x as $v): ... endforeach;', cat: 'control', pt: 'Sintaxe alternativa (útil em templates HTML)', en: 'Alternative syntax (handy in HTML templates)' },

  // ─── Funções, closures & lambdas ────────────────────────────────────────
  { cmd: 'function soma($a, $b) { return $a + $b; }', cat: 'functions', pt: 'Função simples', en: 'Simple function' },
  { cmd: 'function f(int $a, string $b): bool { }', cat: 'functions', pt: 'Parâmetros e retorno tipados', en: 'Typed parameters and return type' },
  { cmd: 'function f($x = 1) { }', cat: 'functions', pt: 'Parâmetro com valor padrão', en: 'Parameter with a default value' },
  { cmd: 'f(foo: 1, bar: 2);', cat: 'functions', pt: 'Argumentos nomeados (não precisa respeitar ordem) — PHP 8', en: 'Named arguments (order-independent) — PHP 8' },
  { cmd: 'function f(...$nums) { return array_sum($nums); }', cat: 'functions', pt: 'Variádico — recebe N argumentos como array', en: 'Variadic — collects N args into an array' },
  { cmd: 'fn($x) => $x * 2', cat: 'functions', pt: 'Arrow function (PHP 7.4+) — captura escopo automaticamente', en: 'Arrow function (PHP 7.4+) — auto-captures the scope' },
  { cmd: '$double = function ($x) { return $x * 2; };', cat: 'functions', pt: 'Closure anônima clássica', en: 'Classic anonymous closure' },
  { cmd: '$mul = function ($x) use ($n) { return $x * $n; };', cat: 'functions', pt: 'Closure capturando variável externa com use', en: 'Closure capturing outer vars with use' },
  { cmd: '$f(1);   call_user_func($f, 1);', cat: 'functions', pt: 'Chama uma função/clojure pela variável', en: 'Calls a function/closure via a variable' },
  { cmd: 'func_get_args();', cat: 'functions', pt: 'Todos os argumentos recebidos (sem assinatura fixa)', en: 'All received args (no fixed signature)' },
  { cmd: 'global $config;', cat: 'functions', pt: 'Acessa uma variável global dentro da função', en: 'Accesses a global variable inside a function' },

  // ─── OOP & enums ────────────────────────────────────────────────────────
  { cmd: 'class User { public string $nome; }', cat: 'oop', pt: 'Classe com propriedade tipada e pública', en: 'Class with a typed public property' },
  { cmd: 'public function __construct(private string $nome) {}', cat: 'oop', pt: 'Promoção de propriedade no construtor (PHP 8)', en: 'Constructor property promotion (PHP 8)' },
  { cmd: 'public readonly string $id;', cat: 'oop', pt: 'Propriedade somente leitura (PHP 8.1)', en: 'Read-only property (PHP 8.1)' },
  { cmd: '$obj = new User(\'Ana\');', cat: 'oop', pt: 'Instancia um objeto', en: 'Instantiates an object' },
  { cmd: '$obj->nome;  $obj->metodo();', cat: 'oop', pt: 'Acessa propriedade e chama método', en: 'Accesses property and calls method' },
  { cmd: 'class Admin extends User { }', cat: 'oop', pt: 'Herança — estende outra classe', en: 'Inheritance — extends another class' },
  { cmd: 'interface HasName { public function name(): string; }', cat: 'oop', pt: 'Interface — contrato de métodos públicos', en: 'Interface — a contract of public methods' },
  { cmd: 'class X implements HasName { }', cat: 'oop', pt: 'Implementa uma interface', en: 'Implements an interface' },
  { cmd: 'abstract class Shape { }', cat: 'oop', pt: 'Classe abstrata — não pode ser instanciada', en: 'Abstract class — cannot be instantiated' },
  { cmd: 'trait Loggable { }  class X { use Loggable; }', cat: 'oop', pt: 'Trait — reutiliza métodos em várias classes', en: 'Trait — reuses methods across classes' },
  { cmd: 'enum Status: string { case Active = \'active\'; }', cat: 'oop', pt: 'Enum com valor (PHP 8.1); Status::Active, $status->value', en: 'Backed enum (PHP 8.1); Status::Active, $status->value' },
  { cmd: 'Status::tryFrom(\'active\');', cat: 'oop', pt: 'Enum de volta a partir do valor (null se inválido)', en: 'Enum back from a value (null when invalid)' },
  { cmd: 'public static int $count = 0;   self::$count;', cat: 'oop', pt: 'Membro estático — compartilhado sem instância', en: 'Static member — shared without an instance' },
  { cmd: 'parent::metodo();', cat: 'oop', pt: 'Chama a implementação da classe pai', en: 'Calls the parent implementation' },
  { cmd: '$x instanceof User', cat: 'oop', pt: 'Verifica se o objeto é da classe (ou subtipo/interface)', en: 'Checks the object class (or subtype/interface)' },
  { cmd: 'public function __toString() { return $this->nome; }', cat: 'oop', pt: 'Magic method — usado quando convertido a string', en: 'Magic method — used when cast to string' },
  { cmd: 'clone $obj;', cat: 'oop', pt: 'Copia o objeto (shallow) em vez de referenciar', en: 'Copies the object (shallow) instead of referencing' },
  { cmd: 'get_class($obj);', cat: 'oop', pt: 'Nome completo da classe do objeto', en: 'Fully-qualified class name of an object' },

  // ─── Exceções & erros ───────────────────────────────────────────────────
  { cmd: 'try { } catch (Exception $e) { }', cat: 'exceptions', pt: 'Captura uma exceção', en: 'Catches an exception' },
  { cmd: 'catch (TypeError | ValueError $e)', cat: 'exceptions', pt: 'Multi-catch de tipos diferentes', en: 'Multi-catch of different types' },
  { cmd: 'catch (\\Throwable $e)', cat: 'exceptions', pt: 'Pega qualquer erro ou exceção (PHP 7+)', en: 'Catches any error or exception (PHP 7+)' },
  { cmd: 'finally { }', cat: 'exceptions', pt: 'Executa sempre — cleanup garantido', en: 'Always runs — guaranteed cleanup' },
  { cmd: 'throw new RuntimeException(\'msg\');', cat: 'exceptions', pt: 'Lança uma exceção', en: 'Throws an exception' },
  { cmd: 'class MinhaEx extends Exception { }', cat: 'exceptions', pt: 'Exceção customizada (herda Exception)', en: 'Custom exception (extends Exception)' },
  { cmd: '$e->getMessage();  $e->getCode();  $e->getTraceAsString();', cat: 'exceptions', pt: 'Informações da exceção', en: 'Exception information' },
  { cmd: 'throw $e;', cat: 'exceptions', pt: 'Relança a exceção capturada', en: 'Rethrows the caught exception' },
  { cmd: 'Error vs Exception', cat: 'exceptions', pt: 'Erros fatais (Error) e exceções web (Exception) — ambos são Throwable', en: 'Fatal errors (Error) and app exceptions (Exception) — both are Throwable' },
  { cmd: 'set_error_handler(fn($errno, $str) => throw new ErrorException($str));', cat: 'exceptions', pt: 'Converte warnings/notices em exceções', en: 'Converts warnings/notices into exceptions' },

  // ─── Arquivos & JSON ────────────────────────────────────────────────────
  { cmd: 'file_get_contents(\'a.txt\');', cat: 'files', pt: 'Lê o arquivo inteiro como string', en: 'Reads the whole file as a string' },
  { cmd: 'file_put_contents(\'b.txt\', \'oi\');', cat: 'files', pt: 'Escreve (retorna bytes escritos; FILE_APPEND para acrescentar)', en: 'Writes (returns bytes written; FILE_APPEND to append)' },
  { cmd: '{ $h = fopen(\'a.txt\', \'r\'); while (($l = fgets($h)) !== false) {} fclose($h); }', cat: 'files', pt: 'Leitura linha a linha com fopen/fgets', en: 'Line-by-line reading with fopen/fgets' },
  { cmd: 'readfile(\'x.txt\');', cat: 'files', pt: 'Imprime o conteúdo direto na saída', en: 'Outputs the file directly' },
  { cmd: 'file(\'x.txt\');', cat: 'files', pt: 'Lê em um array de linhas', en: 'Reads into an array of lines' },
  { cmd: 'file_exists($p);  is_file($p);  is_dir($p);', cat: 'files', pt: 'Verificações de existência/tipo', en: 'Existence/type checks' },
  { cmd: 'mkdir(\'pasta\', 0777, true);', cat: 'files', pt: 'Cria diretórios recursivamente', en: 'Creates directories recursively' },
  { cmd: 'unlink(\'a.txt\');  rename($a, $b);  copy($a, $b);', cat: 'files', pt: 'Apaga, renomeia/move e copia', en: 'Deletes, renames/moves and copies' },
  { cmd: 'scandir(\'.\');', cat: 'files', pt: 'Lista os arquivos de um diretório', en: 'Lists the files of a directory' },
  { cmd: 'filesize(\'a.txt\');', cat: 'files', pt: 'Tamanho em bytes', en: 'Size in bytes' },
  { cmd: 'basename(\'/a/b.txt\');  dirname(\'/a/b.txt\');', cat: 'files', pt: 'Nome do arquivo e do diretório', en: 'File name and directory name' },
  { cmd: 'json_encode($arr, JSON_PRETTY_PRINT);', cat: 'files', pt: 'Array/objeto → JSON', en: 'Array/object → JSON' },
  { cmd: 'json_decode($json, true);', cat: 'files', pt: 'JSON → array associativo (deixe true = true!)', en: 'JSON → associative array (keep true = true!)' },
  { cmd: 'json_last_error_msg();', cat: 'files', pt: 'Mensagem do último erro de JSON', en: 'Message of the last JSON error' },
  { cmd: 'require \'lib.php\';  require_once \'lib.php\';  include \'lib.php\';', cat: 'files', pt: 'Inclui outro arquivo (require falha fatal se não existir)', en: 'Includes another file (require fatals when missing)' },
  { cmd: 'serialize($x);  unserialize($str);', cat: 'files', pt: 'Converte valores em representação armazenável', en: 'Serializes values to a storable representation' },

  // ─── PDO & banco de dados ───────────────────────────────────────────────
  { cmd: 'new PDO(\'mysql:host=localhost;dbname=app\', $u, $p);', cat: 'database', pt: 'Conecta a MySQL via PDO', en: 'Connects to MySQL via PDO' },
  { cmd: 'new PDO(\'sqlite:/caminho/db.sqlite\');', cat: 'database', pt: 'Abre um banco SQLite embarcado', en: 'Opens an embedded SQLite database' },
  { cmd: '$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);', cat: 'database', pt: 'Lança exceções em vez de retornar false', en: 'Throws exceptions instead of returning false' },
  { cmd: '$st = $db->prepare(\'SELECT * FROM users WHERE id = ?\');  $st->execute([$id]);', cat: 'database', pt: 'Prepared statement com placeholder posicional', en: 'Prepared statement with a positional placeholder' },
  { cmd: '$st = $db->prepare(\'SELECT * FROM users WHERE id = :id\');  $st->execute([\'id\' => $id]);', cat: 'database', pt: 'Com placeholder nomeado', en: 'With a named placeholder' },
  { cmd: '$row = $st->fetch(PDO::FETCH_ASSOC);', cat: 'database', pt: 'Próxima linha como array associativo', en: 'Next row as an associative array' },
  { cmd: '$rows = $st->fetchAll(PDO::FETCH_ASSOC);  // ou FETCH_OBJ', cat: 'database', pt: 'Todas as linhas de uma vez', en: 'All rows at once' },
  { cmd: '$db->exec("DELETE FROM logs");', cat: 'database', pt: 'Executa sem resultado e retorna linhas afetadas', en: 'Runs without results, returns affected rows' },
  { cmd: '$db->lastInsertId();', cat: 'database', pt: 'ID gerado pelo último INSERT', en: 'ID from the last INSERT' },
  { cmd: '$db->beginTransaction();  $db->commit();  $db->rollBack();', cat: 'database', pt: 'Transações manuais', en: 'Manual transactions' },
  { cmd: '$st->rowCount();', cat: 'database', pt: 'Linhas afetadas pela última operação', en: 'Rows affected by the last operation' },
  { cmd: '{ $db = new PDO(...); $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); }', cat: 'database', pt: 'Padrão mínimo recomendado de conexão PDO', en: 'Recommended minimal PDO connection pattern' },

  // ─── Web & HTTP ─────────────────────────────────────────────────────────
  { cmd: '$_GET[\'q\'];  $_POST[\'nome\'];', cat: 'web', pt: 'Parâmetros de query string e corpo do POST', en: 'Query string and POST body parameters' },
  { cmd: '$_SERVER[\'REQUEST_METHOD\'];', cat: 'web', pt: 'Método HTTP da request (GET, POST...)', en: 'HTTP method of the request (GET, POST...)' },
  { cmd: '$_SERVER[\'REMOTE_ADDR\'];  $_SERVER[\'HTTP_USER_AGENT\'];', cat: 'web', pt: 'IP do cliente e User-Agent', en: 'Client IP and User-Agent' },
  { cmd: 'session_start();  $_SESSION[\'user_id\'] = 1;', cat: 'web', pt: 'Inicia a sessão (antes de qualquer saída!)', en: 'Starts the session (before any output!)' },
  { cmd: '$_COOKIE[\'pref\'];', cat: 'web', pt: 'Lê um cookie enviado pelo cliente', en: 'Reads a client-sent cookie' },
  { cmd: 'setcookie(\'pref\', \'dark\', time() + 3600, \'/\');', cat: 'web', pt: 'Envia um cookie (time() + N para expirar em N segundos)', en: 'Sends a cookie (time() + N to expire in N seconds)' },
  { cmd: 'header(\'Location: /login\');  exit;', cat: 'web', pt: 'Redireciona (sempre seguido de exit para evitar código extra)', en: 'Redirects (always followed by exit to stop extra code)' },
  { cmd: 'http_response_code(404);', cat: 'web', pt: 'Define o código de status da resposta', en: 'Sets the response status code' },
  { cmd: 'header(\'Content-Type: application/json\');  echo json_encode($data);', cat: 'web', pt: 'Resposta JSON de uma API simples', en: 'JSON response from a simple API' },
  { cmd: 'filter_input(INPUT_GET, \'email\', FILTER_VALIDATE_EMAIL);', cat: 'web', pt: 'Valida input diretamente (devolve false se inválido)', en: 'Validates input directly (false when invalid)' },
  { cmd: 'number_format(1234.5, 2, \',\', \'.\');', cat: 'web', pt: 'Formata número no padrão brasileiro → 1.234,50', en: 'Formats a number → 1,234.50' },
  { cmd: 'getenv(\'APP_ENV\');  putenv(\'APP_ENV=dev\');', cat: 'web', pt: 'Lê e define variáveis de ambiente', en: 'Reads and sets environment variables' },
  { cmd: 'error_log(\'algo deu errado\');', cat: 'web', pt: 'Escreve no log de erros do servidor', en: 'Writes to the server error log' },
  { cmd: 'phpinfo();', cat: 'web', pt: 'Página com toda a configuração (deixe fora de produção!)', en: 'Full config page (keep it out of production!)' },

  // ─── Data & hora ────────────────────────────────────────────────────────
  { cmd: 'date(\'Y-m-d H:i:s\');', cat: 'datetime', pt: 'Data/hora atual formatada', en: 'Current date/time formatted' },
  { cmd: 'time();', cat: 'datetime', pt: 'Timestamp Unix (segundos)', en: 'Unix timestamp (seconds)' },
  { cmd: 'new DateTime();  new DateTimeImmutable();', cat: 'datetime', pt: 'Data mutável (DateTime) ou imutável (recomendado)', en: 'Mutable (DateTime) or immutable (recommended) date' },
  { cmd: '$dt->format(\'d/m/Y\');', cat: 'datetime', pt: 'Formata a data com um padrão', en: 'Formats the date with a pattern' },
  { cmd: 'DateTime::createFromFormat(\'d/m/Y\', \'20/05/2024\');', cat: 'datetime', pt: 'Faz parse a partir de um formato (false se inválido)', en: 'Parses from a format (false when invalid)' },
  { cmd: '$dt->modify(\'+2 days\');', cat: 'datetime', pt: 'Ajusta a data por expressão', en: 'Adjusts the date by expression' },
  { cmd: '$dt1->diff($dt2);', cat: 'datetime', pt: 'Diferença entre datas (DateInterval com ->days)', en: 'Difference between dates (DateInterval with ->days)' },
  { cmd: '(new DateTimeImmutable())->add(new DateInterval(\'P1DT2H\'));', cat: 'datetime', pt: 'Soma intervalo (ISO 8601) sem mutar o original', en: 'Adds an ISO 8601 interval without mutating' },
  { cmd: '$dt->setTimezone(new DateTimeZone(\'America/Sao_Paulo\'));', cat: 'datetime', pt: 'Converte a data para outro fuso', en: 'Converts the date to another timezone' },
  { cmd: 'strtotime(\'next monday\');', cat: 'datetime', pt: 'Converte texto relativo em timestamp', en: 'Parses relative text into a timestamp' },
  { cmd: 'date_default_timezone_set(\'UTC\');', cat: 'datetime', pt: 'Define o fuso padrão do script', en: 'Sets the script default timezone' },
  { cmd: 'microtime(true);', cat: 'datetime', pt: 'Tempo com frações de segundo (benchmarks)', en: 'Time with fractional seconds (benchmarks)' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de PHP',
    intro: (
      <>
        Referência pesquisável da linguagem PHP (8.x) — CLI e Composer, básicos
        da sintaxe, tipos e conversões, strings e regex, funções de array,
        controle de fluxo, funções e closures, OOP e enums, exceções,
        arquivos e JSON, acesso a banco com PDO, web e HTTP e data/hora. Tudo
        100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Compare sempre com <Text code>===</Text> (estrito), raramente com{' '}
        <Text code>==</Text>. Use <Text code>declare(strict_types=1);</Text>{' '}
        no topo dos arquivos. Prefira <Text code>match</Text> ao{' '}
        <Text code>switch</Text>. Escape toda saída de input com{' '}
        <Text code>htmlspecialchars()</Text> e use PDO prepared statements na
        hora de montar SQL. Cheque <Text code>false</Text> com{' '}
        <Text code>===</Text> (ex.: <Text code>strpos()</Text> retorna 0, que
        é falsy).
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
    title: 'PHP Cheat Sheet',
    intro: (
      <>
        A searchable reference for PHP (8.x) — CLI and Composer, syntax
        basics, types and conversions, strings and regex, array functions,
        control flow, functions and closures, OOP and enums, exceptions,
        files and JSON, PDO database access, web and HTTP, and date/time.
        100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Prefer strict <Text code>===</Text> over loose <Text code>==</Text>.
        Put <Text code>declare(strict_types=1);</Text> at the top of files.
        Prefer <Text code>match</Text> over <Text code>switch</Text>. Escape
        any input printed to HTML with{' '}
        <Text code>htmlspecialchars()</Text> and use PDO prepared statements
        when building SQL. Check <Text code>false</Text> with{' '}
        <Text code>===</Text> (e.g. <Text code>strpos()</Text> returns 0,
        which is falsy).
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

export default function PhpCheatsheetPage() {
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