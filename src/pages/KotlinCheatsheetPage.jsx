import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'basics',
  'types',
  'null',
  'control',
  'functions',
  'collections',
  'oop',
  'coroutines',
  'exceptions',
  'files',
  'testing',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  null: 'magenta',
  control: 'cyan',
  functions: 'lime',
  collections: 'green',
  oop: 'volcano',
  coroutines: 'orange',
  exceptions: 'red',
  files: 'blue',
  testing: 'cyan',
}

const labelOf = {
  cli: { pt: 'CLI & build', en: 'CLI & build' },
  basics: { pt: 'Básicos & sintaxe', en: 'Basics & syntax' },
  types: { pt: 'Tipos & conversão', en: 'Types & conversion' },
  null: { pt: 'Null safety', en: 'Null safety' },
  control: { pt: 'Controle de fluxo', en: 'Control flow' },
  functions: { pt: 'Funções & lambdas', en: 'Functions & lambdas' },
  collections: { pt: 'Coleções & sequences', en: 'Collections & sequences' },
  oop: { pt: 'Classes & OOP', en: 'Classes & OOP' },
  coroutines: { pt: 'Corrotinas & async', en: 'Coroutines & async' },
  exceptions: { pt: 'Exceções & erros', en: 'Exceptions & errors' },
  files: { pt: 'I/O & arquivos', en: 'Files & I/O' },
  testing: { pt: 'Testes', en: 'Testing' },
}

const COMMANDS = [
  // ─── CLI & build ────────────────────────────────────────────────────────
  { cmd: 'kotlinc -version', cat: 'cli', pt: 'Mostra a versão do compilador Kotlin', en: 'Shows the Kotlin compiler version' },
  { cmd: 'kotlinc Main.kt -include-runtime -d app.jar', cat: 'cli', pt: 'Compila para um JAR executável', en: 'Compiles to a runnable JAR' },
  { cmd: 'java -jar app.jar', cat: 'cli', pt: 'Roda o JAR compilado (Kotlin/JVM)', en: 'Runs the compiled JAR (Kotlin/JVM)' },
  { cmd: 'kotlinc -script script.kts', cat: 'cli', pt: 'Executa um script Kotlin (.kts) direto, sem compilar', en: 'Runs a Kotlin script (.kts) directly, no compile step' },
  { cmd: 'kotlin -e \'println("oi")\'', cat: 'cli', pt: 'Avalia um trecho de código inline (avaliador)', en: 'Evaluates an inline code snippet (REPL one-off)' },
  { cmd: 'gradle init', cat: 'cli', pt: 'Cria um projeto Gradle interativamente (escolha Kotlin DSL)', en: 'Creates a Gradle project interactively (pick the Kotlin DSL)' },
  { cmd: 'gradle wrapper', cat: 'cli', pt: 'Gera o gradlew — versão fixa do Gradle pro projeto', en: 'Generates gradlew — a pinned Gradle version for the project' },
  { cmd: './gradlew build', cat: 'cli', pt: 'Compila e roda os testes', en: 'Compiles and runs the tests' },
  { cmd: './gradlew run', cat: 'cli', pt: 'Roda a aplicação via o plugin application', en: 'Runs the app via the application plugin' },
  { cmd: './gradlew test', cat: 'cli', pt: 'Roda só os testes', en: 'Runs only the tests' },
  { cmd: './gradlew --continuous build', cat: 'cli', pt: 'Modo watch — recompila a cada mudança', en: 'Watch mode — rebuilds on every change' },
  { cmd: "./gradlew -q dependencyInsight --dependency gson", cat: 'cli', pt: 'Mostra por que uma dependência entrou no grafo', en: 'Shows why a dependency is in the graph' },
  { cmd: 'mvn clean verify', cat: 'cli', pt: 'Build Maven completo (compila Q + testes)', en: 'Full Maven build (compiles + tests)' },
  { cmd: 'plugins { kotlin("jvm") version "2.0.0" }', cat: 'cli', pt: 'Plugin Kotlin JVM no build.gradle.kts', en: 'Kotlin JVM plugin in build.gradle.kts' },
  { cmd: 'kotlinOptions { jvmTarget = "17" }', cat: 'cli', pt: 'Fixa o JVM target (deve combinar com o sourceCompat do Java)', en: 'Pins the JVM target (must match the Java sourceCompat)' },

  // ─── Básicos & sintaxe ──────────────────────────────────────────────────
  { cmd: 'fun main() { println("oi") }', cat: 'basics', pt: 'Ponto de entrada padrão (função de nível top)', en: 'Standard entry point (top-level function)' },
  { cmd: 'println("x: $x")', cat: 'basics', pt: 'String template — interpola uma variável', en: 'String template — interpolates a variable' },
  { cmd: 'println("soma: ${a + b}")', cat: 'basics', pt: 'Template com expressão entre chaves', en: 'Template with a braced expression' },
  { cmd: "val msg = \"\\$literal\"", cat: 'basics', pt: 'Escapa o cifrão para mostrar "$" literal', en: 'Escapes the dollar sign for a literal "$"' },
  { cmd: 'val nome = "Ana"', cat: 'basics', pt: 'val — referência imutável (não pode reatribuir)', en: 'val — immutable reference (cannot be reassigned)' },
  { cmd: 'var idade = 30', cat: 'basics', pt: 'var — referência mutável', en: 'var — mutable reference' },
  { cmd: 'val x: Int = 10', cat: 'basics', pt: 'Declaração com tipo explícito', en: 'Declaration with explicit type' },
  { cmd: '// linha  /* bloco */  /** KDoc */', cat: 'basics', pt: 'Os três estilos de comentário', en: 'All three comment styles' },
  { cmd: 'fun main(args: Array<String>) {}', cat: 'basics', pt: 'Recebe os argumentos da linha de comando', en: 'Receives the command-line arguments' },
  { cmd: 'Unit', cat: 'basics', pt: 'Equivalente ao void — toda função retorna alguma coisa', en: 'The void equivalent — every function returns something' },
  { cmd: 'val pi = 3.14', cat: 'basics', pt: 'Inferência de tipo — compilador deduz Double', en: 'Type inference — the compiler deduces Double' },
  { cmd: "'A'", cat: 'basics', pt: 'Char usa aspas simples; String usa aspas duplas', en: 'Char uses single quotes; String uses double quotes' },
  { cmd: '{ "a" to 1 }', cat: 'basics', pt: 'to cria um par (Pair) — usado em mapOf', en: 'to creates a Pair — used in mapOf' },

  // ─── Tipos & conversão ──────────────────────────────────────────────────
  { cmd: 'Byte / Short / Int / Long / Float / Double', cat: 'types', pt: 'Tipos numéricos — Int é o padrão', en: 'Numeric types — Int is the default' },
  { cmd: 'Long: 1_000_000L   Double: 1.5   Float: 1.5f', cat: 'types', pt: 'Sufixos e separador de milhar com underscore', en: 'Suffixes and the underscore thousand separator' },
  { cmd: 'val c = a.toInt()', cat: 'types', pt: 'Conversão explícita — não existe cast implícito entre numéricos', en: 'Explicit conversion — no implicit numeric casts' },
  { cmd: 'val s = x.toString()', cat: 'types', pt: 'Número para string', en: 'Number to string' },
  { cmd: 'val n = "42".toIntOrNull() ?: 0', cat: 'types', pt: 'String para Int com fallback se falhar', en: 'String to Int with a fallback when it fails' },
  { cmd: '"3.14".toDouble()', cat: 'types', pt: 'String para Double', en: 'String to Double' },
  { cmd: '"A" + 1', cat: 'types', pt: 'Char somado a Int vira Char', en: 'Char + Int produces a Char' },
  { cmd: 'Any', cat: 'types', pt: 'Tipo raiz — como Object do Java, mas inclui primitivos', en: 'Root type — like Java Object, but includes primitives' },
  { cmd: 'Nothing', cat: 'types', pt: 'Tipo de funções que nunca retornam (ex.: throw)', en: 'Type of functions that never return (e.g. throw)' },
  { cmd: 'val x = value as String', cat: 'types', pt: 'Cast inseguro — lança ClassCastException se falhar', en: 'Unsafe cast — throws ClassCastException on failure' },
  { cmd: 'val x = value as? String', cat: 'types', pt: 'Cast seguro — retorna null se não for do tipo', en: 'Safe cast — returns null when not of that type' },
  { cmd: 'val t: String? = "oi"', cat: 'types', pt: 'Tipo anulável — pode conter null (String?)', en: 'Nullable type — may hold null (String?)' },
  { cmd: 'is / !is', cat: 'types', pt: 'Checagem de tipo — combinado com when vira smart cast', en: 'Type check — combined with when it smart-casts' },
  { cmd: 'if (x is String) x.length', cat: 'types', pt: 'Smart cast — após o is, o compilador garante o tipo', en: 'Smart cast — after is, the compiler guarantees the type' },
  { cmd: 'val k: ULong = 1u', cat: 'types', pt: 'Tipos sem sinal (UByte a ULong)', en: 'Unsigned types (UByte to ULong)' },

  // ─── Null safety ────────────────────────────────────────────────────────
  { cmd: 'val len = s?.length', cat: 'null', pt: 'Safe call — retorna null se s for null', en: 'Safe call — returns null when s is null' },
  { cmd: 'val len = s?.length ?: 0', cat: 'null', pt: 'Elvis — valor padrão quando o lado esquerdo é null', en: 'Elvis — default value when the left side is null' },
  { cmd: 'val len = s!!.length', cat: 'null', pt: 'Double bang — força não-null; lança NPE se for null', en: 'Double bang — asserts non-null; NPEs if null' },
  { cmd: 's?.let { println(it) }', cat: 'null', pt: 'Executa o bloco só quando s não é null', en: 'Runs the block only when s is not null' },
  { cmd: 'lateinit var conn: Connection', cat: 'null', pt: 'Deferred init — inicializa depois (sem nullable em memória)', en: 'Deferred init — initialized later (no nullable in memory)' },
  { cmd: 'val db by lazy { conecta() }', cat: 'null', pt: 'Inicialização preguiçosa e thread-safe na primeira vez', en: 'Lazy thread-safe initialization on first access' },
  { cmd: 'requireNotNull(x)', cat: 'null', pt: 'Falha com IllegalArgumentException se for null', en: 'Fails with IllegalArgumentException when null' },

  // ─── Controle de fluxo ──────────────────────────────────────────────────
  { cmd: 'if (x > 0) "pos" else "neg"', cat: 'control', pt: 'if/else é expressão — retorna valor', en: 'if/else is an expression — it returns a value' },
  { cmd: "when (x) { 1 -> \"um\"; in 2..5 -> \"poucos\"; else -> \"muitos\" }", cat: 'control', pt: 'when — expressão multi-branch (não precisa de break)', en: 'when — a multi-branch expression (no break needed)' },
  { cmd: "when { x < 0 -> \"neg\"; x == 0 -> \"zero\"; else -> \"pos\" }", cat: 'control', pt: 'when sem argumento — usa condições booleanas', en: 'Argumentless when — uses boolean conditions' },
  { cmd: 'for (i in 1..10) {}', cat: 'control', pt: 'Loop numa faixa inclusiva', en: 'Loop over an inclusive range' },
  { cmd: 'for (i in 1 until 10) {}', cat: 'control', pt: 'Faixa exclusiva — 1..9', en: 'Exclusive range — 1..9' },
  { cmd: 'for (i in 10 downTo 1 step 2) {}', cat: 'control', pt: 'Descendo com passo', en: 'Counting down with a step' },
  { cmd: 'for (ch in "abc") {}', cat: 'control', pt: 'Itera os caracteres de uma string', en: 'Iterates over a string\'s characters' },
  { cmd: 'while (x > 0) {} / do {} while (x > 0)', cat: 'control', pt: 'Loops while clássicos', en: 'Classic while loops' },
  { cmd: 'break@outer  continue@outer', cat: 'control', pt: 'Label — sai/pula de um loop aninhado específico', en: 'Label — break/continue a specific nested loop' },
  { cmd: 'repeat(3) { }', cat: 'control', pt: 'Repete N vezes (it é o índice)', en: 'Repeats N times (it is the index)' },
  { cmd: 'x in 1..9', cat: 'control', pt: 'Operador de pertinência a uma faixa/coleção', en: 'Membership operator for a range/collection' },

  // ─── Funções & lambdas ──────────────────────────────────────────────────
  { cmd: 'fun soma(a: Int, b: Int): Int = a + b', cat: 'functions', pt: 'Expressão única — retorno implícito', en: 'Single expression — implicit return' },
  { cmd: 'fun f(a: Int = 1, b: Int = 2) {}', cat: 'functions', pt: 'Parâmetros com valor padrão', en: 'Parameters with default values' },
  { cmd: 'f(b = 5)', cat: 'functions', pt: 'Argumentos nomeados — ordem livre', en: 'Named arguments — any order' },
  { cmd: 'fun f(vararg xs: Int) {}', cat: 'functions', pt: 'Variádico — recebe N argumentos', en: 'Variadic — accepts N arguments' },
  { cmd: 'fun f(x: Int, block: (Int) -> Int): Int = block(x)', cat: 'functions', pt: 'Função de ordem superior — recebe lambda', en: 'Higher-order function — takes a lambda' },
  { cmd: 'val sum = { a: Int, b: Int -> a + b }', cat: 'functions', pt: 'Lambda atribuída a uma variável', en: 'Lambda assigned to a variable' },
  { cmd: 'list.filter { it > 2 }', cat: 'functions', pt: 'it — parâmetro implícito da lambda de 1 arg', en: 'it — implicit parameter of a single-arg lambda' },
  { cmd: 'val result = doThing(1) { a -> a * 2 }', cat: 'functions', pt: 'Lambda após o parêntese — trailing lambda', en: 'Lambda outside the parens — trailing lambda' },
  { cmd: '{ x -> x * 2 }  { x, y -> x + y }  { _ -> 0 }', cat: 'functions', pt: 'Parâmetros explícitos, múltiplos, ou ignorados com _', en: 'Explicit, multiple, or ignored (_) parameters' },
  { cmd: 'fun Int.square() = this * this', cat: 'functions', pt: 'Extension function — método adicionado a um tipo existente', en: 'Extension function — a method added to an existing type' },
  { cmd: 'infix fun Int.pow(e: Int): Int = ...', cat: 'functions', pt: 'Função infix — chamada sem ponto nem parênteses', en: 'Infix function — called without a dot or parens' },
  { cmd: 'tailrec fun fat(n: Int, acc: Int = 1): Int', cat: 'functions', pt: 'Recursão de cauda otimizada para loop', en: 'Tail recursion optimized into a loop' },
  { cmd: 'inline fun f(block: () -> Unit)', cat: 'functions', pt: 'inline — evita allocation da lambda (perf)', en: 'inline — avoids lambda allocation (perf)' },
  { cmd: 'fun <T> first(list: List<T>): T = list[0]', cat: 'functions', pt: 'Função genérica com parâmetro de tipo T', en: 'Generic function with a T type parameter' },
  { cmd: 'operator fun Point.plus(o: Point) = Point(x + o.x, y + o.y)', cat: 'functions', pt: 'Sobrecarga de operador — faz p1 + p2 funcionar', en: 'Operator overloading — makes p1 + p2 work' },
  { cmd: '::funcao  Classe::metodo', cat: 'functions', pt: 'Referências de função/método como lambdas', en: 'Function/method references as lambdas' },

  // ─── Coleções & sequences ───────────────────────────────────────────────
  { cmd: 'val xs = listOf(1, 2, 3)  // imutável', cat: 'collections', pt: 'Lista pronta só para leitura', en: 'Read-only list' },
  { cmd: 'val xs = mutableListOf(1, 2)  // xs.add(3)', cat: 'collections', pt: 'Lista mutável', en: 'Mutable list' },
  { cmd: 'val m = mapOf("a" to 1, "b" to 2)  // m["a"]', cat: 'collections', pt: 'Map imutável com Pares', en: 'Immutable map from Pairs' },
  { cmd: 'val s = setOf(1, 2, 2)  // {1, 2}', cat: 'collections', pt: 'Set — remove duplicados', en: 'Set — de-duplicates' },
  { cmd: 'val xs = List(5) { it * it }', cat: 'collections', pt: 'Cria uma lista a partir de um lambda por índice', en: 'Builds a list from an index-based lambda' },
  { cmd: 'xs.filter { it % 2 == 0 }', cat: 'collections', pt: 'Mantém só os que passam no teste', en: 'Keeps only the matching items' },
  { cmd: 'xs.map { it * 2 }', cat: 'collections', pt: 'Transforma cada elemento', en: 'Transforms each element' },
  { cmd: 'xs.fold(0) { acc, x -> acc + x }', cat: 'collections', pt: 'Reduz a um valor acumulado (soma)', en: 'Reduces to an accumulated value (sum)' },
  { cmd: 'xs.sum()  xs.maxOrNull()  xs.average()', cat: 'collections', pt: 'Agregações comuns (OrNull para coleções vazias)', en: 'Common aggregates (OrNull for empty collections)' },
  { cmd: 'xs.groupBy { it / 10 }', cat: 'collections', pt: 'Agrupa em um Map pela chave derivada', en: 'Groups into a Map by a derived key' },
  { cmd: 'xs.take(2)  xs.drop(2)  xs.firstOrNull()', cat: 'collections', pt: 'Fatias e itens com segurança', en: 'Slices and safe item access' },
  { cmd: 'xs.zip(other)', cat: 'collections', pt: 'Junta dois arrays/coleções em Pares', en: 'Zips two arrays/collections into Pairs' },
  { cmd: 'xs.distinct()  xs.sorted()  xs.reversed()', cat: 'collections', pt: 'Sem duplicados, ordenada, invertida', en: 'Distinct, sorted, reversed' },
  { cmd: 'xs.forEach { print(it) }', cat: 'collections', pt: 'Itera aplicando a lambda (efeito colateral)', en: 'Iterates applying the lambda (side effect)' },
  { cmd: 'items.asSequence().filter { }.map { }.take(5)', cat: 'collections', pt: 'Sequence — avaliação lazzy, um pipeline (evita listas intermediárias)', en: 'Sequence — lazy evaluation, one pipeline (no intermediate lists)' },
  { cmd: 'xs.sumOf { it.price }', cat: 'collections', pt: 'Soma de uma propriedade selecionada', en: 'Sum of a selected property' },
  { cmd: 'm.getOrDefault("x", 0)  m["x"]', cat: 'collections', pt: 'Leitura de Map com default', en: 'Map read with a default' },

  // ─── Classes & OOP ──────────────────────────────────────────────────────
  { cmd: 'class User(val nome: String, var idade: Int)', cat: 'oop', pt: 'Propriedades declaradas no construtor', en: 'Properties declared in the constructor' },
  { cmd: 'val u = User("Ana", 30)', cat: 'oop', pt: 'Instancia sem a palavra-chave new', en: 'Instantiates without the new keyword' },
  { cmd: 'u.nome  u.idade', cat: 'oop', pt: 'Acesso direto — getters/setters gerados', en: 'Direct access — getters/setters generated' },
  { cmd: 'init { println("criado") }', cat: 'oop', pt: 'Bloco inicializador — roda na construção', en: 'Init block — runs at construction' },
  { cmd: 'class A { val x = 1  init { }  constructor(p: Int) : this() {} }', cat: 'oop', pt: 'Construtor secundário delega com : this()', en: 'Secondary constructor delegates with : this()' },
  { cmd: 'data class User(val id: Long, val nome: String)', cat: 'oop', pt: 'data class — gera equals/hashCode/toString/copy', en: 'data class — generates equals/hashCode/toString/copy' },
  { cmd: 'u.copy(nome = "Bia")', cat: 'oop', pt: 'Copia com campos trocados', en: 'Copies with swapped fields' },
  { cmd: 'val (id, nome) = u', cat: 'oop', pt: 'Destructuring de data class', en: 'Destructuring a data class' },
  { cmd: 'object Config { val url = "https://..." }', cat: 'oop', pt: 'object — singleton declarado direto', en: 'object — a straightforward singleton' },
  { cmd: 'companion object { const val MAX = 10 }', cat: 'oop', pt: 'Membros estáticos "companion"', en: 'Static-like members via companion' },
  { cmd: 'sealed class Result { data class Ok(val v: Int) : Result(); data class Err(val msg: String) : Result() }', cat: 'oop', pt: 'Hierarquia fechada — when fica exaustivo', en: 'Closed hierarchy — when becomes exhaustive' },
  { cmd: 'enum class Status { ATIVO, INATIVO }', cat: 'oop', pt: 'Enum com valores simples', en: 'Enum with simple values' },
  { cmd: 'enum class Level(val peso: Int)', cat: 'oop', pt: 'Enum com propriedade (e pode ter método)', en: 'Enum with a property (and can have methods)' },
  { cmd: 'interface Animal { fun fala(): String }', cat: 'oop', pt: 'Interface — contrato de métodos', en: 'Interface — a method contract' },
  { cmd: 'abstract class Shape { abstract fun area(): Double }', cat: 'oop', pt: 'Classe abstrata com membro abstrato', en: 'Abstract class with an abstract member' },
  { cmd: 'class Cachorro : Animal { override fun fala() = "au" }', cat: 'oop', pt: 'Implementa interface/herda — pública por padrão', en: 'Implements/inherits — open by default' },
  { cmd: 'open class Animal {}  class Cao : Animal() {}', cat: 'oop', pt: 'open permite herança de fora do módulo', en: 'open enables inheritance outside the module' },
  { cmd: 'override fun toString() = ...', cat: 'oop', pt: 'Sobrescreve — override é obrigatório', en: 'Overrides — override is mandatory' },
  { cmd: 'val x: Int get() = y * 2', cat: 'oop', pt: 'Getter calculado (sem campo de apoio)', en: 'Computed getter (no backing field)' },
  { cmd: 'var nome = "" set(value) { field = value.trim() }', cat: 'oop', pt: 'Setter customizado — usa field (campo de apoio)', en: 'Custom setter — uses field (the backing field)' },
  { cmd: 'private set', cat: 'oop', pt: 'Leitura pública, escrita privada', en: 'Public read, private write' },
  { cmd: 'class Box<T>(val item: T)', cat: 'oop', pt: 'Classe genérica', en: 'Generic class' },
  { cmd: 'data class Ponto(val x: Int, val y: Int)', cat: 'oop', pt: 'Exemplo compacto de data class', en: 'Compact data class example' },

  // ─── Corrotinas & async ─────────────────────────────────────────────────
  { cmd: 'runBlocking { }', cat: 'coroutines', pt: 'Bridge de corrotina pro mundo bloqueante (testes/main)', en: 'Coroutine bridge to the blocking world (tests/main)' },
  { cmd: 'GlobalScope.launch { } / lifecycleScope.launch { }', cat: 'coroutines', pt: 'Dispara uma corrotina sem bloquear a thread atual', en: 'Launches a coroutine without blocking the current thread' },
  { cmd: 'delay(1_000)', cat: 'coroutines', pt: 'Suspende sem bloquear a thread (não é Thread.sleep)', en: 'Suspends without blocking the thread (not Thread.sleep)' },
  { cmd: 'val result = async { compute() }.await()', cat: 'coroutines', pt: 'Concorrência: async retorna um Deferred, await pega o valor', en: 'Concurrency: async returns a Deferred, await gets the value' },
  { cmd: 'withContext(Dispatchers.IO) { }', cat: 'coroutines', pt: 'Troca o dispatcher (IO p/ ops de rede/arquivo)', en: 'Switches the dispatcher (IO for network/file work)' },
  { cmd: 'Dispatchers.Main / Dispatchers.Default / Dispatchers.IO', cat: 'coroutines', pt: 'Dispatchers: UI, CPU-bound e I/O', en: 'Dispatchers: UI, CPU-bound and I/O' },
  { cmd: 'suspend fun baixar(): String', cat: 'coroutines', pt: 'Função suspensa — só poder ser chamada em corrotina', en: 'Suspend function — callable only in a coroutine' },
  { cmd: 'coroutineScope { }', cat: 'coroutines', pt: 'Aguarda todas as filhas; falha em uma cancela as demais', en: 'Waits for all children; one failure cancels the rest' },
  { cmd: 'val flow = (1..10).asFlow()', cat: 'coroutines', pt: 'Fluxo frio de valores que emite sob demanda', en: 'Cold stream of values emitted on demand' },
  { cmd: 'flow { emit(1); emit(2) }.collect { }', cat: 'coroutines', pt: 'Injeta e consome valores de um Flow', en: 'Emits and collects values of a Flow' },
  { cmd: 'job.cancel()', cat: 'coroutines', pt: 'Cancela uma corrotina cooperativamente', en: 'Cancels a coroutine cooperatively' },
  { cmd: 'supervisorScope { }', cat: 'coroutines', pt: 'Contrário do coroutineScope — falha num filho não cancela os outros', en: 'Opposite of coroutineScope — a child\'s failure doesn\'t cancel the rest' },

  // ─── Exceções & erros ───────────────────────────────────────────────────
  { cmd: 'try { } catch (e: Exception) { } finally { }', cat: 'exceptions', pt: 'tratamento clássico', en: 'Classic handling' },
  { cmd: 'catch (e: IOException) {} catch (e: RuntimeException) {}', cat: 'exceptions', pt: 'Multi-catch por tipo (não há checked exceptions)', en: 'Multi-catch by type (no checked exceptions exist)' },
  { cmd: 'throw IllegalArgumentException("msg")', cat: 'exceptions', pt: 'Lança uma exceção', en: 'Throws an exception' },
  { cmd: 'class MinhaEx(msg: String) : Exception(msg)', cat: 'exceptions', pt: 'Exceção customizada — extends Exception', en: 'Custom exception — extends Exception' },
  { cmd: 'val r = runCatching { perigoso() }', cat: 'exceptions', pt: 'Captura resultado em Result em vez de lançar', en: 'Wraps the outcome in a Result instead of throwing' },
  { cmd: 'r.getOrElse { 0 }  r.getOrDefault(0)  r.exceptionOrNull()', cat: 'exceptions', pt: 'Extrai valor/erro de um Result', en: 'Extracts value/error from a Result' },
  { cmd: 'error("msg")', cat: 'exceptions', pt: 'Falha com IllegalStateException', en: 'Fails with IllegalStateException' },
  { cmd: 'check(x > 0)', cat: 'exceptions', pt: 'Valida estado — lança IllegalStateException', en: 'Validates state — throws IllegalStateException' },
  { cmd: 'require(x > 0)', cat: 'exceptions', pt: 'Valida argumentos — lança IllegalArgumentException', en: 'Validates arguments — throws IllegalArgumentException' },
  { cmd: 'e.stackTraceToString()', cat: 'exceptions', pt: 'Stack trace como string limpa (sem DeprecationWarning)', en: 'Stack trace as a clean string' },

  // ─── I/O & arquivos ─────────────────────────────────────────────────────
  { cmd: 'val txt = File("a.txt").readText()', cat: 'files', pt: 'Lê o arquivo inteiro como string', en: 'Reads the whole file as a string' },
  { cmd: 'File("b.txt").writeText("oi")', cat: 'files', pt: 'Escreve uma string (sobrescreve)', en: 'Writes a string (overwrites)' },
  { cmd: 'val lines = File("a.txt").readLines()', cat: 'files', pt: 'Lê em uma lista de linhas', en: 'Reads into a list of lines' },
  { cmd: 'File("c.txt").appendText("mais")', cat: 'files', pt: 'Acrescenta ao fim', en: 'Appends to the end' },
  { cmd: 'File("./dir").mkdirs()', cat: 'files', pt: 'Cria diretórios (recursivamente)', en: 'Creates directories (recursively)' },
  { cmd: 'File("a.txt").delete()  .renameTo(File("b.txt"))  .exists()', cat: 'files', pt: 'Apaga, renomeia e existe?', en: 'Delete, rename and exists?' },
  { cmd: 'File("./dir").walk().forEach { println(it.name) }', cat: 'files', pt: 'Caminha pela árvore de arquivos', en: 'Walks the file tree' },
  { cmd: 'val bytes = File("a.bin").readBytes()', cat: 'files', pt: 'Lê bytes crus', en: 'Reads raw bytes' },
  { cmd: 'readln()  println(...)', cat: 'files', pt: 'Entrada do console e saída padrão', en: 'Console input and standard output' },
  { cmd: 'System.getenv("PATH")  System.getProperty("user.dir")', cat: 'files', pt: 'Variáveis de ambiente e propriedades de sistema', en: 'Environment variables and system properties' },

  // ─── Testes ─────────────────────────────────────────────────────────────
  { cmd: 'import kotlin.test.*', cat: 'testing', pt: 'kotlin.test — conjunto comum p/ JUnit/TestNG', en: 'kotlin.test — common set for JUnit/TestNG' },
  { cmd: '@Test fun soma() { assertEquals(4, soma(2, 2)) }', cat: 'testing', pt: 'Teste JUnit5/kotlin.test básico', en: 'Basic JUnit5/kotlin.test test' },
  { cmd: 'assertTrue(x)  assertFalse(x)  assertNull(x)', cat: 'testing', pt: 'Asserts mais comuns', en: 'The most common asserts' },
  { cmd: 'assertContentEquals(listOf(1), listOf(1))', cat: 'testing', pt: 'Compara conteúdo de coleções (não a referência)', en: 'Compares collection content (not the reference)' },
  { cmd: 'assertThrows<IllegalArgumentException> { f() }', cat: 'testing', pt: 'Espera que uma exceção seja lançada', en: 'Expects an exception to be thrown' },
  { cmd: '@ParameterizedTest @ValueSource(ints = [1, 2, 3]) fun t(x: Int)', cat: 'testing', pt: 'Teste parametrizado do JUnit5 em Kotlin', en: 'JUnit5 parameterized test in Kotlin' },
  { cmd: 'fun main() = kotlin.test.assertFailsWith<Exception> { }', cat: 'testing', pt: 'assertFailsWith — versão top-level do assertThrows', en: 'assertFailsWith — the top-level assertThrows' },
  { cmd: 'assertEquals("A", "a", ignoreCase = true)', cat: 'testing', pt: 'Compara ignorando caixa', en: 'Compares ignoring case' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Kotlin',
    intro: (
      <>
        Referência pesquisável da linguagem Kotlin (2.x) — CLI e build com
        Gradle/Maven, básicos da sintaxe, tipos e conversões, null safety,
        controle de fluxo, funções e lambdas, coleções e sequences, classes e
        OOP, corrotinas, exceções, I/O de arquivos e testes. Tudo 100%
        client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Prefira <Text code>val</Text> a <Text code>var</Text>. Trate null
        com <Text code>?</Text>, <Text code>?:</Text> e{' '}
        <Text code>.let</Text> — sem <Text code>!!</Text> na pressa. Use{' '}
        <Text code>data class</Text> para modelos, <Text code>when</Text>{' '}
        ao invés de if encadeado e <Text code>sealed class</Text> para
        estados. Para listas grandes encadeie <Text code>asSequence()</Text>{' '}
        e evite criar coleções intermediárias. Banco de dados e rede vão
        dentro de <Text code>withContext(Dispatchers.IO)</Text>.
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
    title: 'Kotlin Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Kotlin language (2.x) — CLI and builds
        with Gradle/Maven, syntax basics, types and conversions, null safety,
        control flow, functions and lambdas, collections and sequences,
        classes and OOP, coroutines, exceptions, file I/O and testing. 100%
        client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Prefer <Text code>val</Text> over <Text code>var</Text>. Handle null
        with <Text code>?</Text>, <Text code>?:</Text> and{' '}
        <Text code>.let</Text> — no hurried <Text code>!!</Text>. Use{' '}
        <Text code>data class</Text> for models, <Text code>when</Text>{' '}
        instead of chained ifs, and <Text code>sealed class</Text> for
        states. For large lists, chain <Text code>asSequence()</Text> to
        avoid intermediate collections. Put DB and network work inside{' '}
        <Text code>withContext(Dispatchers.IO)</Text>.
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

export default function KotlinCheatsheetPage() {
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