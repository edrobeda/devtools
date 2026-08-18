import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'basics',
  'types',
  'control',
  'strings',
  'collections',
  'streams',
  'oop',
  'generics',
  'exceptions',
  'concurrency',
  'datetime',
  'io',
  'testing',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  control: 'cyan',
  strings: 'magenta',
  collections: 'green',
  streams: 'lime',
  oop: 'volcano',
  generics: 'gold',
  exceptions: 'red',
  concurrency: 'orange',
  datetime: 'cyan',
  io: 'blue',
  testing: 'purple',
}

const labelOf = {
  cli: { pt: 'CLI & build (javac, Gradle, Maven)', en: 'CLI & build (javac, Gradle, Maven)' },
  basics: { pt: 'Básicos & sintaxe', en: 'Basics & syntax' },
  types: { pt: 'Tipos & conversão', en: 'Types & conversion' },
  control: { pt: 'Controle de fluxo', en: 'Control flow' },
  strings: { pt: 'Strings & formatação', en: 'Strings & formatting' },
  collections: { pt: 'Coleções (List, Set, Map)', en: 'Collections (List, Set, Map)' },
  streams: { pt: 'Streams & lambdas', en: 'Streams & lambdas' },
  oop: { pt: 'Classes, objetos & herança', en: 'Classes, objects & inheritance' },
  generics: { pt: 'Generics', en: 'Generics' },
  exceptions: { pt: 'Exceções', en: 'Exceptions' },
  concurrency: { pt: 'Concorrência & threads', en: 'Concurrency & threads' },
  datetime: { pt: 'Data & hora (java.time)', en: 'Date & time (java.time)' },
  io: { pt: 'I/O & arquivos', en: 'I/O & files' },
  testing: { pt: 'Testes (JUnit)', en: 'Testing (JUnit)' },
}

const COMMANDS = [
  // ─── CLI & build ──────────────────────────────────────────────────────────
  { cmd: 'javac Main.java', cat: 'cli', pt: 'Compila um arquivo .java (gera Main.class)', en: 'Compiles a .java file (produces Main.class)' },
  { cmd: 'javac -d out *.java', cat: 'cli', pt: 'Compila vários arquivos direcionando a saída para out/', en: 'Compiles several files targeting the output dir out/' },
  { cmd: 'java Main', cat: 'cli', pt: 'Roda uma classe compilada (precisa de public static void main)', en: 'Runs a compiled class (needs public static void main)' },
  { cmd: 'java -cp out Main', cat: 'cli', pt: 'Define o classpath (aceita * como wildcard)', en: 'Sets the classpath (accepts * as a wildcard)' },
  { cmd: 'java -jar app.jar', cat: 'cli', pt: 'Roda um JAR executável (com Main-Class no manifest)', en: 'Runs an executable JAR (Main-Class in the manifest)' },
  { cmd: 'java -Xmx2g -Xms256m Main', cat: 'cli', pt: 'Define o heap máximo e o inicial da JVM', en: 'Sets the max and initial JVM heap' },
  { cmd: 'jshell', cat: 'cli', pt: 'REPL interativo do Java (JDK 9+)', en: 'Interactive Java REPL (JDK 9+)' },
  { cmd: 'gradle init', cat: 'cli', pt: 'Inicializa um projeto Gradle novo', en: 'Initializes a new Gradle project' },
  { cmd: 'gradle build', cat: 'cli', pt: 'Compila, roda testes e gera o build', en: 'Compiles, runs tests and produces the build' },
  { cmd: 'gradle bootRun', cat: 'cli', pt: 'Roda uma aplicação Spring Boot em modo dev', en: 'Runs a Spring Boot app in dev mode' },
  { cmd: 'gradle tasks', cat: 'cli', pt: 'Lista as tasks disponíveis do projeto', en: 'Lists the available project tasks' },
  { cmd: 'mvn clean install', cat: 'cli', pt: 'Limpa, compila, testa e instala no repositório local', en: 'Cleans, compiles, tests and installs to the local repo' },
  { cmd: 'mvn package', cat: 'cli', pt: 'Gera o JAR (pule testes com -DskipTests)', en: 'Produces the JAR (skip tests with -DskipTests)' },
  { cmd: 'mvn test', cat: 'cli', pt: 'Roda os testes do Maven', en: 'Runs Maven tests' },
  { cmd: 'mvn dependency:tree', cat: 'cli', pt: 'Mostra a árvore de dependências', en: 'Shows the dependency tree' },

  // ─── Básicos & sintaxe ────────────────────────────────────────────────────
  { cmd: 'public static void main(String[] args)', cat: 'basics', pt: 'Assinatura obrigatória do ponto de entrada', en: 'Required entry-point signature' },
  { cmd: 'int x = 42;', cat: 'basics', pt: 'Declaração de variável local com tipo explícito', en: 'Local variable declaration with an explicit type' },
  { cmd: 'var x = "oi";', cat: 'basics', pt: 'Inferência de tipo local (Java 10+)', en: 'Local type inference (Java 10+)' },
  { cmd: 'final double PI = 3.14;', cat: 'basics', pt: 'Constante — final impede reatribuição', en: 'Constant — final prevents reassignment' },
  { cmd: 'boolean ok = true;', cat: 'basics', pt: 'Booleano (true/false)', en: 'Boolean (true/false)' },
  { cmd: 'long big = 10_000_000L;', cat: 'basics', pt: 'long com sufixo L e separador de milhar _', en: 'long with the L suffix and _ thousands separator' },
  { cmd: 'float f = 1.5f; double d = 2.5;', cat: 'basics', pt: 'Ponto flutuante (float exige o sufixo f)', en: 'Floating point (float requires the f suffix)' },
  { cmd: 'String nome = "Ana";', cat: 'basics', pt: 'String — objeto imutável', en: 'String — an immutable object' },
  { cmd: "char letra = 'a';", cat: 'basics', pt: 'Um único caractere (aspas simples)', en: 'A single character (single quotes)' },
  { cmd: 'int[] arr = {1, 2, 3};', cat: 'basics', pt: 'Array de inteiros de tamanho fixo', en: 'Fixed-size integer array' },
  { cmd: '// comentário  e  /* bloco */', cat: 'basics', pt: 'Comentários de linha e de bloco', en: 'Line and block comments' },

  // ─── Tipos & conversão ────────────────────────────────────────────────────
  { cmd: 'int i = (int) 3.9;', cat: 'types', pt: 'Cast explícito (trunca para 3)', en: 'Explicit cast (truncates to 3)' },
  { cmd: 'Integer.parseInt("42")', cat: 'types', pt: 'String → int (lança NumberFormatException se inválida)', en: 'String to int (throws NumberFormatException if invalid)' },
  { cmd: 'Double.parseDouble("3.14")', cat: 'types', pt: 'String → double', en: 'String to double' },
  { cmd: 'String.valueOf(42)', cat: 'types', pt: 'int → String', en: 'int to String' },
  { cmd: 'Integer n = 42;', cat: 'types', pt: 'Autoboxing — int vira Integer automaticamente', en: 'Autoboxing — int becomes Integer automatically' },
  { cmd: 'int x = n;', cat: 'types', pt: 'Unboxing — Integer volta a int implicitamente', en: 'Unboxing — Integer back to int implicitly' },
  { cmd: 'x instanceof String', cat: 'types', pt: 'Verifica o tipo em runtime', en: 'Runtime type check' },
  { cmd: 'if (x instanceof String s) { }', cat: 'types', pt: 'Pattern matching — já declara a variável s (Java 16+)', en: 'Pattern matching — also declares s (Java 16+)' },
  { cmd: 'switch (x) { case String s -> ...; default -> ...; }', cat: 'types', pt: 'Switch de padrões (Java 21)', en: 'Pattern switch (Java 21)' },

  // ─── Controle de fluxo ────────────────────────────────────────────────────
  { cmd: 'if (x > 0) { } else { }', cat: 'control', pt: 'Condicional', en: 'Conditional' },
  { cmd: 'if (x > 0 && ok) { /* || também */ }', cat: 'control', pt: 'Operadores booleanos && e ||', en: 'Boolean operators && and ||' },
  { cmd: 'switch (n) { case 1: break; default: }', cat: 'control', pt: 'Switch clássico (não esqueça o break)', en: 'Classic switch (do not forget the break)' },
  { cmd: 'switch (n) { case 1 -> "um"; default -> "outro"; }', cat: 'control', pt: 'Switch expression (Java 14+) — sem break', en: 'Switch expression (Java 14+) — no break needed' },
  { cmd: 'for (int i = 0; i < 10; i++) { }', cat: 'control', pt: 'Loop clássico com contador', en: 'Classic counter loop' },
  { cmd: 'for (String s : list) { }', cat: 'control', pt: 'For-each sobre coleções e arrays', en: 'For-each over collections and arrays' },
  { cmd: 'while (cond) { }', cat: 'control', pt: 'Loop com condição no início', en: 'Loop with the condition at the top' },
  { cmd: 'do { } while (cond);', cat: 'control', pt: 'Executa o corpo pelo menos uma vez', en: 'Runs the body at least once' },
  { cmd: 'break;  // ou continue;', cat: 'control', pt: 'Interrompe o loop ou pula para a próxima iteração', en: 'Breaks the loop or skips to the next iteration' },
  { cmd: 'int n = cond ? 1 : 2;', cat: 'control', pt: 'Operador ternário', en: 'Ternary operator' },

  // ─── Strings & formatação ──────────────────────────────────────────────────
  { cmd: '"a" + "b"', cat: 'strings', pt: 'Concatena (cria uma String nova a cada +)', en: 'Concatenates (creates a new String per +)' },
  { cmd: '"Olá %s, você tem %d anos".formatted(nome, idade)', cat: 'strings', pt: 'Formatação com placeholders (Java 15+)', en: 'Formatting with placeholders (Java 15+)' },
  { cmd: 'String.format("%.2f", pi)', cat: 'strings', pt: 'Formata sem encadear no literal', en: 'Formats without chaining on a literal' },
  { cmd: 's.length()', cat: 'strings', pt: 'Tamanho da string', en: 'Length of the string' },
  { cmd: 's.charAt(0)', cat: 'strings', pt: 'Caractere em um índice', en: 'Char at an index' },
  { cmd: 's.substring(1, 3)', cat: 'strings', pt: 'Substring — [início, fim)', en: 'Substring — [start, end)' },
  { cmd: 's.toUpperCase(); s.toLowerCase()', cat: 'strings', pt: 'Maiúsculas e minúsculas', en: 'Upper and lowercase' },
  { cmd: 's.trim(); s.strip()', cat: 'strings', pt: 'Remove espaços (strip é Java 11+ e entende Unicode)', en: 'Trims whitespace (strip is Java 11+ and Unicode-aware)' },
  { cmd: 's.replace("a", "b")', cat: 'strings', pt: 'Substitui todas as ocorrências', en: 'Replaces every occurrence' },
  { cmd: 's.split(",")', cat: 'strings', pt: 'Divide em um array de String', en: 'Splits into an array of String' },
  { cmd: 's.startsWith("x"); s.endsWith("y"); s.contains("z")', cat: 'strings', pt: 'Verifica prefixo, sufixo e conteúdo', en: 'Checks prefix, suffix and content' },
  { cmd: '"a".equals(b)', cat: 'strings', pt: 'Compara conteúdo (== compara referência!)', en: 'Compares content (== compares reference!)' },
  { cmd: 'String.join(", ", partes)', cat: 'strings', pt: 'Une um array/lista com separador', en: 'Joins an array/list with a separator' },
  { cmd: 's.isEmpty()', cat: 'strings', pt: 'É vazia?', en: 'Is it empty?' },
  { cmd: 'StringBuilder sb = new StringBuilder();', cat: 'strings', pt: 'Concatenação eficiente em loops (evita muitas strings novas)', en: 'Efficient concatenation in loops (avoids many new strings)' },
  { cmd: 'sb.append("x").append(1)', cat: 'strings', pt: 'Acrescenta e retorna this para encadeamento', en: 'Appends and returns this for chaining' },

  // ─── Coleções ─────────────────────────────────────────────────────────────
  { cmd: 'List<String> l = new ArrayList<>();', cat: 'collections', pt: 'Lista — interface + implementação', en: 'List — interface + implementation' },
  { cmd: 'l.add("a"); l.get(0); l.remove(0)', cat: 'collections', pt: 'Adiciona, lê e remove por índice', en: 'Adds, reads and removes by index' },
  { cmd: 'l.size()', cat: 'collections', pt: 'Quantidade de elementos', en: 'Number of elements' },
  { cmd: 'Set<String> s = new HashSet<>();', cat: 'collections', pt: 'Set — sem duplicatas', en: 'Set — no duplicates' },
  { cmd: 'Map<String, Integer> m = new HashMap<>();', cat: 'collections', pt: 'Mapa chave → valor', en: 'Key → value map' },
  { cmd: 'm.put("a", 1); m.get("a")', cat: 'collections', pt: 'Insere e lê por chave', en: 'Puts and gets by key' },
  { cmd: 'm.getOrDefault("k", 0)', cat: 'collections', pt: 'Valor default se a chave não existir', en: 'Default value if the key is missing' },
  { cmd: 'm.forEach((k, v) -> { })', cat: 'collections', pt: 'Itera os pares chave/valor', en: 'Iterates the key/value pairs' },
  { cmd: 'new ArrayList<>(existing)', cat: 'collections', pt: 'Copia uma coleção existente', en: 'Copies an existing collection' },
  { cmd: 'Collections.sort(l)', cat: 'collections', pt: 'Ordena a lista in-place', en: 'Sorts the list in place' },
  { cmd: 'l.sort(Comparator.comparing(Foo::getX))', cat: 'collections', pt: 'Ordena por uma propriedade (method reference)', en: 'Sorts by a property (method reference)' },
  { cmd: 'l.removeIf(x -> x < 0)', cat: 'collections', pt: 'Remove condicionalmente usando um predicado', en: 'Conditionally removes using a predicate' },

  // ─── Streams & lambdas ────────────────────────────────────────────────────
  { cmd: 'list.stream().filter(x -> x > 0)', cat: 'streams', pt: 'Filtra apenas os elementos que casam', en: 'Filters only the matching elements' },
  { cmd: 'list.stream().map(x -> x * 2)', cat: 'streams', pt: 'Transforma cada elemento', en: 'Transforms each element' },
  { cmd: 'list.stream().sorted()', cat: 'streams', pt: 'Ordena a stream', en: 'Sorts the stream' },
  { cmd: 'list.stream().collect(Collectors.toList())', cat: 'streams', pt: 'Coleta de volta em uma lista', en: 'Collects back into a list' },
  { cmd: 'list.stream().collect(Collectors.groupingBy(Foo::getTipo))', cat: 'streams', pt: 'Agrupa os elementos por uma chave', en: 'Groups the elements by a key' },
  { cmd: 'list.stream().count()', cat: 'streams', pt: 'Quantidade de elementos', en: 'Element count' },
  { cmd: 'list.stream().findFirst()', cat: 'streams', pt: 'Primeiro elemento (retorna Optional)', en: 'First element (returns an Optional)' },
  { cmd: 'list.stream().reduce(0, Integer::sum)', cat: 'streams', pt: 'Reduz a um único valor (soma)', en: 'Reduces to a single value (sum)' },
  { cmd: 'list.stream().anyMatch(x -> x > 10)', cat: 'streams', pt: 'Algum elemento casa?', en: 'Does any element match?' },
  { cmd: 'list.stream().allMatch(x -> x > 0)', cat: 'streams', pt: 'Todos os elementos casam?', en: 'Do all elements match?' },
  { cmd: 'list.stream().distinct()', cat: 'streams', pt: 'Remove duplicados', en: 'Removes duplicates' },
  { cmd: '(x) -> x + 1', cat: 'streams', pt: 'Lambda simples com um parâmetro', en: 'Simple lambda with one parameter' },

  // ─── Classes, objetos & herança ───────────────────────────────────────────
  { cmd: 'class Foo { }', cat: 'oop', pt: 'Declara uma classe', en: 'Declares a class' },
  { cmd: 'class Foo { int x; Foo(int x) { this.x = x; } }', cat: 'oop', pt: 'Construtor usando this para o campo', en: 'Constructor using this for the field' },
  { cmd: 'new Foo(1)', cat: 'oop', pt: 'Instancia um objeto', en: 'Instantiates an object' },
  { cmd: 'record Point(int x, int y) { }', cat: 'oop', pt: 'Record imutável com equals/hashCode/toString automáticos (Java 16+)', en: 'Immutable record with auto equals/hashCode/toString (Java 16+)' },
  { cmd: 'enum Color { RED, GREEN }', cat: 'oop', pt: 'Enum — conjunto fixo de valores', en: 'Enum — a fixed set of values' },
  { cmd: 'abstract class Shape { }', cat: 'oop', pt: 'Classe abstrata (não instanciável)', en: 'Abstract class (not instantiable)' },
  { cmd: 'interface Drawable { void draw(); }', cat: 'oop', pt: 'Interface — contrato a ser implementado', en: 'Interface — a contract to implement' },
  { cmd: 'class Circle implements Drawable { public void draw() { } }', cat: 'oop', pt: 'Implementa uma interface', en: 'Implements an interface' },
  { cmd: 'class B extends A { }', cat: 'oop', pt: 'Herança de classe (extends)', en: 'Class inheritance (extends)' },
  { cmd: '@Override public void draw() { }', cat: 'oop', pt: 'Sobrescreve um método do pai (respeite a assinatura)', en: 'Overrides a parent method (keep the signature)' },
  { cmd: 'super.metodo();', cat: 'oop', pt: 'Chama implementação da superclasse', en: 'Calls the superclass implementation' },
  { cmd: 'static int count;', cat: 'oop', pt: 'Membro de classe — compartilhado, sem instância', en: 'Class member — shared, no instance needed' },
  { cmd: 'static { }', cat: 'oop', pt: 'Bloco de inicialização estática (roda uma vez ao carregar a classe)', en: 'Static initializer (runs once when the class loads)' },

  // ─── Generics ─────────────────────────────────────────────────────────────
  { cmd: 'List<String> nomes;', cat: 'generics', pt: 'Parâmetro de tipo na prática', en: 'Type parameter in practice' },
  { cmd: 'Map<String, List<Integer>>', cat: 'generics', pt: 'Genéricos aninhados', en: 'Nested generics' },
  { cmd: '<T> T max(List<T> list)', cat: 'generics', pt: 'Método genérico com tipo inferido na chamada', en: 'Generic method with the type inferred on call' },
  { cmd: 'class Box<T> { T v; }', cat: 'generics', pt: 'Classe genérica', en: 'Generic class' },
  { cmd: 'List<? extends Number>', cat: 'generics', pt: 'Covariante — só leitura (Number e subtipos)', en: 'Covariant — read only (Number and subtypes)' },
  { cmd: 'List<? super Integer>', cat: 'generics', pt: 'Contravariante — foco em escrever (Integer e supertipos)', en: 'Contravariant — write-friendly (Integer and supertypes)' },
  { cmd: '<T extends Comparable<T>>', cat: 'generics', pt: 'Bound — T precisa ser comparável', en: 'Bound — T must be comparable' },

  // ─── Exceções ─────────────────────────────────────────────────────────────
  { cmd: 'try { } catch (IOException e) { }', cat: 'exceptions', pt: 'Captura uma exceção específica', en: 'Catches a specific exception' },
  { cmd: 'catch (IOException | SQLException e)', cat: 'exceptions', pt: 'Multi-catch de tipos não relacionados', en: 'Multi-catch of unrelated types' },
  { cmd: 'finally { }', cat: 'exceptions', pt: 'Executa sempre — cleanup garantido', en: 'Always runs — guaranteed cleanup' },
  { cmd: 'try (var r = open()) { }', cat: 'exceptions', pt: 'Try-with-resources fecha AutoCloseable automaticamente', en: 'Try-with-resources auto-closes AutoCloseable' },
  { cmd: 'throw new IllegalArgumentException("msg")', cat: 'exceptions', pt: 'Lança uma exceção', en: 'Throws an exception' },
  { cmd: 'void f() throws IOException { }', cat: 'exceptions', pt: 'Declara que o método pode lançar', en: 'Declares the method may throw' },
  { cmd: 'e.getMessage(); e.printStackTrace()', cat: 'exceptions', pt: 'Mensagem e stack trace da exceção', en: 'Exception message and stack trace' },
  { cmd: 'throw new RuntimeException("falhou");', cat: 'exceptions', pt: 'Exceção unchecked — não precisa declarar throws', en: 'Unchecked exception — no throws needed' },

  // ─── Concorrência & threads ───────────────────────────────────────────────
  { cmd: 'new Thread(() -> { }).start()', cat: 'concurrency', pt: 'Cria e inicia uma thread com uma lambda', en: 'Creates and starts a thread with a lambda' },
  { cmd: 't.join()', cat: 'concurrency', pt: 'Espera a thread terminar', en: 'Waits for the thread to finish' },
  { cmd: 'synchronized (obj) { }', cat: 'concurrency', pt: 'Bloco sincronizado — lock no objeto', en: 'Synchronized block — locks the object' },
  { cmd: 'public synchronized void m() { }', cat: 'concurrency', pt: 'Método sincronizado (lock no this)', en: 'Synchronized method (lock on this)' },
  { cmd: 'volatile boolean flag;', cat: 'concurrency', pt: 'Garante visibilidade da variável entre threads', en: 'Ensures visibility across threads' },
  { cmd: 'ExecutorService ex = Executors.newFixedThreadPool(4);', cat: 'concurrency', pt: 'Pool de threads com tamanho fixo', en: 'Thread pool with a fixed size' },
  { cmd: 'ex.submit(() -> doWork())', cat: 'concurrency', pt: 'Submete uma tarefa assíncrona', en: 'Submits an async task' },
  { cmd: 'Future<Integer> f = ex.submit(call);', cat: 'concurrency', pt: 'Future para coletar o resultado depois', en: 'Future to collect the result later' },
  { cmd: 'ex.shutdown()', cat: 'concurrency', pt: 'Para de aceitar novas tarefas', en: 'Stops accepting new tasks' },
  { cmd: 'CompletableFuture.supplyAsync(() -> f())', cat: 'concurrency', pt: 'Future encadeável que roda em outro thread (Java 8+)', en: 'Chainable future running on another thread (Java 8+)' },
  { cmd: 'f.thenApply(x -> x + 1)', cat: 'concurrency', pt: 'Encadeia uma transformação ao resultado', en: 'Chains a transformation on the result' },

  // ─── Data & hora (java.time) ──────────────────────────────────────────────
  { cmd: 'LocalDate.now()', cat: 'datetime', pt: 'Data de hoje (sem hora)', en: "Today's date (no time)" },
  { cmd: 'LocalTime.now()', cat: 'datetime', pt: 'Hora atual (sem data)', en: 'Current time (no date)' },
  { cmd: 'LocalDateTime.now()', cat: 'datetime', pt: 'Data + hora', en: 'Date + time' },
  { cmd: 'Instant.now()', cat: 'datetime', pt: 'Timestamp UTC absoluto', en: 'Absolute UTC timestamp' },
  { cmd: 'LocalDate.of(2024, 5, 20)', cat: 'datetime', pt: 'Cria uma data específica', en: 'Creates a specific date' },
  { cmd: 'd.plusDays(3); d.minusMonths(1)', cat: 'datetime', pt: 'Soma e subtrai unidades de tempo', en: 'Adds and subtracts time units' },
  { cmd: 'd.isAfter(outra); d.isBefore(outra)', cat: 'datetime', pt: 'Compara duas datas', en: 'Compares two dates' },
  { cmd: 'LocalDate.parse("2024-05-20")', cat: 'datetime', pt: 'Parses no padrão ISO 8601', en: 'Parses the ISO 8601 format' },
  { cmd: 'd.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))', cat: 'datetime', pt: 'Formata com um padrão customizado', en: 'Formats with a custom pattern' },
  { cmd: 'ChronoUnit.DAYS.between(a, b)', cat: 'datetime', pt: 'Diferença em dias entre duas datas', en: 'Difference in days between two dates' },
  { cmd: 'ZoneId.of("America/Sao_Paulo")', cat: 'datetime', pt: 'Representa um fuso horário', en: 'Represents a timezone' },

  // ─── I/O & arquivos ───────────────────────────────────────────────────────
  { cmd: 'Files.readString(Path.of("a.txt"))', cat: 'io', pt: 'Lê o arquivo inteiro como String (Java 11+)', en: 'Reads the whole file as a String (Java 11+)' },
  { cmd: 'Files.writeString(Path.of("b.txt"), "oi")', cat: 'io', pt: 'Escreve uma String no arquivo (Java 11+)', en: 'Writes a String to the file (Java 11+)' },
  { cmd: 'Files.readAllLines(path)', cat: 'io', pt: 'Lê as linhas em uma List<String>', en: 'Reads the lines into a List<String>' },
  { cmd: 'Files.lines(path)', cat: 'io', pt: 'Stream de linhas (feche com try-with-resources!)', en: 'Stream of lines (close it with try-with-resources!)' },
  { cmd: 'Path.of("a", "b.txt")', cat: 'io', pt: 'Cria um Path a partir de partes', en: 'Creates a Path from parts' },
  { cmd: 'Files.createDirectories(p)', cat: 'io', pt: 'Cria diretórios (incluindo os pais)', en: 'Creates directories (including parents)' },
  { cmd: 'Files.exists(p); Files.deleteIfExists(p)', cat: 'io', pt: 'Verifica existência e deleta sem erro se não existir', en: 'Checks existence and deletes without erroring if missing' },
  { cmd: 'Files.copy(src, dst)', cat: 'io', pt: 'Copia um arquivo', en: 'Copies a file' },
  { cmd: 'Files.move(src, dst)', cat: 'io', pt: 'Move ou renomeia um arquivo', en: 'Moves or renames a file' },
  { cmd: 'new BufferedReader(new FileReader("a.txt"))', cat: 'io', pt: 'Leitura clássica linha a linha (loop com readLine)', en: 'Classic line-by-line reading (loop with readLine)' },
  { cmd: 'Scanner sc = new Scanner(System.in); sc.nextLine()', cat: 'io', pt: 'Lê uma linha do terminal', en: 'Reads a line from the terminal' },
  { cmd: 'System.out.printf("%5d %s%n", 42, "x")', cat: 'io', pt: 'Printf — %n é o newline portátil', en: 'Printf — %n is the portable newline' },
  { cmd: 'System.err.println("erro")', cat: 'io', pt: 'Escreve no stderr', en: 'Writes to stderr' },

  // ─── Testes (JUnit) ───────────────────────────────────────────────────────
  { cmd: '@Test void shouldAdd() { }', cat: 'testing', pt: 'Teste unitário (JUnit 5)', en: 'Unit test (JUnit 5)' },
  { cmd: 'assertEquals(2, add(1, 1))', cat: 'testing', pt: 'Verifica igualdade entre esperado e real', en: 'Checks equality between expected and actual' },
  { cmd: 'assertTrue(x > 0); assertFalse(ok)', cat: 'testing', pt: 'Verifica uma condição', en: 'Checks a condition' },
  { cmd: 'assertEquals(3.14, pi, 0.001)', cat: 'testing', pt: 'Compara double com uma tolerância (delta)', en: 'Compares doubles with a tolerance (delta)' },
  { cmd: 'assertThrows(IllegalArgumentException.class, () -> f(-1))', cat: 'testing', pt: 'Espera que o código lance uma exceção', en: 'Expects the code to throw an exception' },
  { cmd: '@BeforeEach void setUp() { }', cat: 'testing', pt: 'Roda antes de cada teste do método', en: 'Runs before each test method' },
  { cmd: '@ParameterizedTest @ValueSource(ints = {1, 2, 3})', cat: 'testing', pt: 'Teste parametrizado executado várias vezes', en: 'Parameterized test run multiple times' },
  { cmd: 'assertNull(x); assertNotNull(x)', cat: 'testing', pt: 'Verifica null e não-null', en: 'Checks null and non-null' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Java',
    intro: (
      <>
        Referência pesquisável da linguagem Java — CLI e build (
        <Text code>javac</Text>, <Text code>java</Text>, Gradle e Maven),
        básicos da sintaxe, tipos e conversões, controle de fluxo, strings e
        formatação, coleções, streams e lambdas, classes e herança, generics,
        exceções, concorrência com threads e <Text code>CompletableFuture</Text>,
        datas com <Text code>java.time</Text>, I/O de arquivos com{' '}
        <Text code>java.nio.file</Text> e testes com JUnit. Tudo 100%
        client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        O arquivo precisa ter o mesmo nome da classe única pública (e{' '}
        <Text code>public static void main</Text> para executar com{' '}
        <Text code>java</Text>). Compare strings com{' '}
        <Text code>.equals()</Text>, nunca com <Text code>==</Text>. Use{' '}
        <Text code>try-with-resources</Text> para streams e arquivos. Prefira
        records/imutáveis a setters quando o objeto não muda, e streams
        com method references (<Text code>Foo::getX</Text>) no lugar de loops
        quando a leitura fica mais clara.
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
    title: 'Java Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Java language — CLI and build (
        <Text code>javac</Text>, <Text code>java</Text>, Gradle and Maven),
        syntax basics, types and conversions, control flow, strings and
        formatting, collections, streams and lambdas, classes and
        inheritance, generics, exceptions, threading and{' '}
        <Text code>CompletableFuture</Text>, dates with{' '}
        <Text code>java.time</Text>, file I/O with{' '}
        <Text code>java.nio.file</Text> and JUnit testing. 100% client-side
        (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        The file must be named after its single public class (and have{' '}
        <Text code>public static void main</Text> to run with{' '}
        <Text code>java</Text>). Compare strings with <Text code>.equals()</Text>,
        never <Text code>==</Text>. Use <Text code>try-with-resources</Text>{' '}
        for streams and files. Prefer immutables/records over setters when
        the object never changes, and streams with method references (
        <Text code>Foo::getX</Text>) over loops whenever that reads clearer.
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

export default function JavaCheatsheetPage() {
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