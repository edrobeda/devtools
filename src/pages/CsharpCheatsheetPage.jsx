import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'basics',
  'types',
  'flow',
  'string',
  'collections',
  'oop',
  'async',
  'exceptions',
  'datetime',
  'io',
  'tests',
  'gotchas',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  flow: 'cyan',
  string: 'magenta',
  collections: 'green',
  oop: 'gold',
  async: 'orange',
  exceptions: 'volcano',
  datetime: 'lime',
  io: 'red',
  tests: 'geekblue',
  gotchas: 'volcano',
}

const labelOf = {
  cli: { pt: 'CLI & build (dotnet)', en: 'CLI & build (dotnet)' },
  basics: { pt: 'Básicos & sintaxe', en: 'Basics & syntax' },
  types: { pt: 'Tipos & conversão', en: 'Types & conversion' },
  flow: { pt: 'Controle de fluxo', en: 'Control flow' },
  string: { pt: 'Strings & formatação', en: 'Strings & formatting' },
  collections: { pt: 'Coleções & LINQ', en: 'Collections & LINQ' },
  oop: { pt: 'Classes, objetos & OOP', en: 'Classes, objects & OOP' },
  async: { pt: 'Async & concorrência', en: 'Async & concurrency' },
  exceptions: { pt: 'Exceções', en: 'Exceptions' },
  datetime: { pt: 'Data & hora', en: 'Date & time' },
  io: { pt: 'I/O & arquivos', en: 'I/O & files' },
  tests: { pt: 'Testes (xUnit)', en: 'Testing (xUnit)' },
  gotchas: { pt: 'Gotchas & dicas', en: 'Gotchas & tips' },
}

const COMMANDS = [
  // ─── CLI & build (dotnet) ─────────────────────────────────────────────────
  { cmd: 'dotnet new console -n MeuApp', cat: 'cli', pt: 'Cria um projeto console novo', en: 'Creates a new console project' },
  { cmd: 'dotnet new webapi -n MinhaApi', cat: 'cli', pt: 'Cria uma API (ASP.NET Core minimal API)', en: 'Creates an API (ASP.NET Core minimal API)' },
  { cmd: 'dotnet run', cat: 'cli', pt: 'Compila e executa o projeto da pasta atual', en: 'Builds and runs the project in the current folder' },
  { cmd: 'dotnet run --project src/MeuApp/MeuApp.csproj', cat: 'cli', pt: 'Executa um projeto específico (solução grande)', en: 'Runs a specific project (large solutions)' },
  { cmd: 'dotnet build', cat: 'cli', pt: 'Compila em modo Debug', en: 'Builds in Debug mode' },
  { cmd: 'dotnet build -c Release', cat: 'cli', pt: 'Compila otimizado', en: 'Builds optimized' },
  { cmd: 'dotnet test', cat: 'cli', pt: 'Roda os testes do projeto', en: 'Runs the project tests' },
  { cmd: 'dotnet add package Newtonsoft.Json', cat: 'cli', pt: 'Instala um pacote NuGet', en: 'Installs a NuGet package' },
  { cmd: 'dotnet list package', cat: 'cli', pt: 'Lista os pacotes instalados', en: 'Lists the installed packages' },
  { cmd: 'dotnet format', cat: 'cli', pt: 'Formata o código no estilo oficial (dotnet-format)', en: 'Formats code to the official style (dotnet-format)' },
  { cmd: 'dotnet watch run', cat: 'cli', pt: 'Recompila e reinicia ao salvar (hot reload)', en: 'Rebuilds and restarts on save (hot reload)' },
  { cmd: 'dotnet publish -c Release -o ./out', cat: 'cli', pt: 'Publica para deploy (basta copiar a pasta)', en: 'Publishes for deployment (just copy the folder)' },
  { cmd: 'dotnet sln add src/MeuApp/MeuApp.csproj', cat: 'cli', pt: 'Adiciona um projeto à solução (.sln)', en: 'Adds a project to the solution (.sln)' },
  { cmd: 'dotnet ef migrations add Inicial', cat: 'cli', pt: 'Cria uma migration do EF Core (requer dotnet-ef global)', en: 'Creates an EF Core migration (needs global dotnet-ef)' },

  // ─── Básicos & sintaxe ────────────────────────────────────────────────────
  { cmd: 'Console.WriteLine("Olá, mundo!");', cat: 'basics', pt: 'Imprime com quebra de linha', en: 'Prints with a line break' },
  { cmd: 'int idade = 30;', cat: 'basics', pt: 'Tipo declarado explicitamente', en: 'Explicitly typed declaration' },
  { cmd: 'var nome = "Ana";', cat: 'basics', pt: 'Inferência de tipo com var (tipado em compile-time)', en: 'Type inference with var (typed at compile-time)' },
  { cmd: 'const double PI = 3.14159;', cat: 'basics', pt: 'Constante de compile-time', en: 'Compile-time constant' },
  { cmd: 'bool ativo = true;', cat: 'basics', pt: 'Booleanos: true / false', en: 'Booleans: true / false' },
  { cmd: '// comentário  /* bloco */  /// <summary>XML doc</summary>', cat: 'basics', pt: 'Três formas de comentário (/// gera docs)', en: 'Three comment styles (/// generates docs)' },
  { cmd: 'string nome = "Bruno"; Console.WriteLine($"Olá, {nome}!");', cat: 'basics', pt: 'Interpolação de string com $', en: 'String interpolation with $' },
  { cmd: 'var caminho = @"C:\\Users\\ana\\docs";', cat: 'basics', pt: 'String verbatim: não interpreta escapes', en: 'Verbatim string: no escape processing' },
  { cmd: 'var html = """<p>raw</p>""";', cat: 'basics', pt: 'Raw string literal (C# 11) — multilinha sem escapes', en: 'Raw string literal (C# 11) — multiline without escapes' },
  { cmd: 'int[] nums = [1, 2, 3];', cat: 'basics', pt: 'Collection expression (C# 12)', en: 'Collection expression (C# 12)' },
  { cmd: 'Console.WriteLine(Environment.OSVersion);', cat: 'basics', pt: 'Top-level statements: Program.cs sem class/main', en: 'Top-level statements: Program.cs without class/main' },

  // ─── Tipos & conversão ────────────────────────────────────────────────────
  { cmd: 'int, long, short, byte, float, double, decimal, bool, char, string', cat: 'types', pt: 'Tipos primitivos — use decimal para dinheiro, double para ciência', en: 'Primitive types — decimal for money, double for science' },
  { cmd: 'int? n = null;', cat: 'types', pt: 'Nullable: tipos de valor ganham ? e aceitam null', en: 'Nullable: value types gain ? and accept null' },
  { cmd: 'string? nome = null;', cat: 'types', pt: 'Nullable reference type — o compilador avisa se usar sem checar', en: 'Nullable reference type — the compiler warns on unguarded use' },
  { cmd: 'int n = int.Parse("42");', cat: 'types', pt: 'Parse — lança FormatException se falhar', en: 'Parse — throws FormatException on failure' },
  { cmd: 'if (int.TryParse(texto, out int n)) { ... }', cat: 'types', pt: 'Parse seguro: devolve bool e o valor em out', en: 'Safe parse: returns a bool and the value via out' },
  { cmd: 'double d = Convert.ToDouble("3.14");', cat: 'types', pt: 'Convert — conversões genéricas culturais', en: 'Convert — culture-aware generic conversions' },
  { cmd: 'int x = (int)3.9;', cat: 'types', pt: 'Cast explícito de double para int (trunca)', en: 'Explicit cast from double to int (truncates)' },
  { cmd: 'var txt = 42.ToString();', cat: 'types', pt: 'Qualquer tipo vira string com ToString()', en: 'Any type becomes a string with ToString()' },
  { cmd: 'decimal preco = 19.99m;', cat: 'types', pt: 'Sufixo m = decimal (precisão exata para valores monetários)', en: 'm suffix = decimal (exact precision for money)' },
  { cmd: 'var s = $"{valor:F2}";', cat: 'types', pt: 'Interpolação com formato de 2 casas decimais', en: 'Interpolation with 2-decimal format' },
  { cmd: 'if (x is int i) { ... }', cat: 'types', pt: 'Pattern matching + pattern variable', en: 'Pattern matching plus a pattern variable' },
  { cmd: 'var r = obj switch { int i => $"int {i}", string s => $"str {s.Length}", _ => "outro" };', cat: 'types', pt: 'Switch expression com type patterns', en: 'Switch expression with type patterns' },

  // ─── Controle de fluxo ────────────────────────────────────────────────────
  { cmd: 'if (x > 0) { ... } else { ... }', cat: 'flow', pt: 'Condicional clássico', en: 'Classic conditional' },
  { cmd: 'var r = cond ? "sim" : "não";', cat: 'flow', pt: 'Operador ternário', en: 'Ternary operator' },
  { cmd: 'switch (dia) { case 1: break; case 2: break; default: break; }', cat: 'flow', pt: 'Switch clássico com break por case', en: 'Classic switch with a break per case' },
  { cmd: 'var cat = x switch { > 10 => "grande", > 5 => "médio", _ => "pequeno" };', cat: 'flow', pt: 'Switch expression — expressão, não instrução', en: 'Switch expression — an expression, not a statement' },
  { cmd: 'for (int i = 0; i < 10; i++) { ... }', cat: 'flow', pt: 'Loop com índice/contador', en: 'Index/counter loop' },
  { cmd: 'foreach (var item in lista) { ... }', cat: 'flow', pt: 'Iteração sobre coleções (funciona com IEnumerable)', en: 'Iterates collections (works with IEnumerable)' },
  { cmd: 'while (cond) { ... }  do { ... } while (cond);', cat: 'flow', pt: 'Loops condicionais (do roda pelo menos 1x)', en: 'Conditional loops (do runs at least once)' },
  { cmd: 'break; continue;', cat: 'flow', pt: 'Sai do loop / pula para a próxima iteração', en: 'Exits the loop / jumps to the next iteration' },
  { cmd: 'for (int i = 0; i < arr.Length; i++)', cat: 'flow', pt: 'Varrer array pelo índice (Length, não Count)', en: 'Scanning an array by index (Length, not Count)' },

  // ─── Strings & formatação ─────────────────────────────────────────────────
  { cmd: 'nome.Length; nome.ToUpper(); nome.ToLower();', cat: 'string', pt: 'Tamanho e caixa', en: 'Length and case' },
  { cmd: '"abc".Substring(1, 2) // "bc"', cat: 'string', pt: 'Fatia a partir do índice com tamanho', en: 'Slices from an index with a length' },
  { cmd: '"abc".Contains("b")  .StartsWith("a")  .EndsWith("c")', cat: 'string', pt: 'Buscas booleanas', en: 'Boolean searches' },
  { cmd: '"banana".Replace("na", "X")', cat: 'string', pt: 'Troca todas as ocorrências (string é imutável)', en: 'Replaces all occurrences (strings are immutable)' },
  { cmd: "var partes = \"a,b,c\".Split(',');", cat: 'string', pt: 'Divide em array pelo separador', en: 'Splits into an array by the separator' },
  { cmd: 'var junta = string.Join(", ", arr);', cat: 'string', pt: 'Junta um array/lista com separador', en: 'Joins an array/list with a separator' },
  { cmd: '"  x  ".Trim(); .TrimStart(); .TrimEnd();', cat: 'string', pt: 'Remove espaços das pontas', en: 'Strips leading/trailing whitespace' },
  { cmd: 'string.IsNullOrEmpty(s); string.IsNullOrWhiteSpace(s);', cat: 'string', pt: 'Checagens de vazio/null (inclui espaços)', en: 'Empty/null checks (including whitespace)' },
  { cmd: 'var sb = new StringBuilder().Append("a").AppendLine("b");', cat: 'string', pt: 'Concatenação eficiente em loops', en: 'Efficient concatenation inside loops' },
  { cmd: '$"{nome,-10}|{valor,8:F2}"', cat: 'string', pt: 'Alinhamento e formato na interpolação', en: 'Alignment and format in interpolation' },
  { cmd: '$"{x:D4}"', cat: 'string', pt: 'Zero-pad para 4 dígitos (ex.: 0042)', en: 'Zero-pads to 4 digits (e.g. 0042)' },
  { cmd: 'a.Equals(b, StringComparison.OrdinalIgnoreCase)', cat: 'string', pt: 'Comparação insensível a caixa e cultura', en: 'Case- and culture-insensitive comparison' },
  { cmd: '"a;b".Split(\';\', StringSplitOptions.RemoveEmptyEntries)', cat: 'string', pt: 'Split ignorando vazios', en: 'Split ignoring empty entries' },

  // ─── Coleções & LINQ ──────────────────────────────────────────────────────
  { cmd: 'var lista = new List<int> { 1, 2, 3 };', cat: 'collections', pt: 'Lista crescente genérica', en: 'Generic growable list' },
  { cmd: 'lista.Add(4); lista.Remove(2);', cat: 'collections', pt: 'Adiciona e remove por valor', en: 'Adds and removes by value' },
  { cmd: 'lista.Count; lista[0]; lista.Contains(3);', cat: 'collections', pt: 'Quantidade, índice e busca', en: 'Count, index access and lookup' },
  { cmd: 'lista.RemoveAll(x => x % 2 == 0);', cat: 'collections', pt: 'Remove tudo que satisfizer o predicado', en: 'Removes everything matching the predicate' },
  { cmd: 'var dict = new Dictionary<string, int>();', cat: 'collections', pt: 'Mapa chave → valor', en: 'Key → value map' },
  { cmd: 'dict["chave"] = 42; dict.TryGetValue("chave", out var v);', cat: 'collections', pt: 'Escrita e leitura segura (evita KeyNotFoundException)', en: 'Writing and safe reading (avoids KeyNotFoundException)' },
  { cmd: 'var set = new HashSet<int>();', cat: 'collections', pt: 'Conjunto sem duplicatas (busca O(1))', en: 'Duplicate-free set (O(1) lookups)' },
  { cmd: 'var fila = new Queue<int>(); fila.Enqueue(1); var x = fila.Dequeue();', cat: 'collections', pt: 'FIFO: enfileira e desenfileira', en: 'FIFO: enqueue and dequeue' },
  { cmd: 'var pilha = new Stack<int>(); pilha.Push(1); var x = pilha.Pop();', cat: 'collections', pt: 'LIFO: empilha e desempilha', en: 'LIFO: push and pop' },
  { cmd: 'var nums = new[] { 5, 2, 8, 1 };', cat: 'collections', pt: 'Array (tamanho fixo)', en: 'Array (fixed size)' },
  { cmd: 'var pares = nums.Where(x => x % 2 == 0);', cat: 'collections', pt: 'LINQ Where — resultado é lazy (deferred)', en: 'LINQ Where — lazy (deferred) result' },
  { cmd: 'var ordem = nums.OrderBy(x => x).ThenByDescending(x => x);', cat: 'collections', pt: 'Ordenação com desempate', en: 'Sorting with a tiebreaker' },
  { cmd: 'var nomes = pessoas.Select(p => p.Nome);', cat: 'collections', pt: 'Projeta uma coleção em outra', en: 'Projects a collection into another' },
  { cmd: 'var grupos = pessoas.GroupBy(p => p.Cidade);', cat: 'collections', pt: 'Agrupa por chave (chave → IEnumerable)', en: 'Groups by key (key → IEnumerable)' },
  { cmd: 'var p = nums.FirstOrDefault(x => x > 3);', cat: 'collections', pt: 'Primeiro que casar, ou default (0) se nada', en: 'First match, or default (0) if none' },
  { cmd: 'bool algum = nums.Any(x => x > 3); bool todos = nums.All(x => x > 0);', cat: 'collections', pt: 'Testes de existência; 100% vazio = Any false / All true', en: 'Existence checks; empty = Any false / All true' },
  { cmd: 'var soma = nums.Sum(); var media = nums.Average();', cat: 'collections', pt: 'Agregações numéricas', en: 'Numeric aggregates' },
  { cmd: 'var unicos = nums.Distinct();', cat: 'collections', pt: 'Remove duplicatas', en: 'Deduplicates' },
  { cmd: 'var top3 = nums.OrderByDescending(x => x).Take(3);', cat: 'collections', pt: 'Top N de um ranking', en: 'Top N of a ranking' },
  { cmd: 'var pagina = nums.Skip(20).Take(10);', cat: 'collections', pt: 'Paginação com Skip/Take', en: 'Pagination with Skip/Take' },

  // ─── Classes, objetos & OOP ───────────────────────────────────────────────
  { cmd: 'class Carro { public string Modelo { get; set; } }', cat: 'oop', pt: 'Classe com property auto-implementada', en: 'Class with an auto-implemented property' },
  { cmd: 'var c = new Carro { Modelo = "X" };', cat: 'oop', pt: 'Object initializer após o construtor', en: 'Object initializer after the constructor' },
  { cmd: 'record Pessoa(string Nome, int Idade);', cat: 'oop', pt: 'Record: imutável, equality estrutural (ideal para DTOs)', en: 'Record: immutable, structural equality (great for DTOs)' },
  { cmd: 'enum Cor { Vermelho, Verde, Azul }', cat: 'oop', pt: 'Enumeração nomeada de inteiros', en: 'Named integer enumeration' },
  { cmd: 'class SUV : Carro { ... }', cat: 'oop', pt: 'Herança de classe', en: 'Class inheritance' },
  { cmd: 'interface ILogger { void Log(string msg); }', cat: 'oop', pt: 'Contrato (herança múltipla só por interfaces)', en: 'Contract (multiple inheritance only via interfaces)' },
  { cmd: 'class ConsoleLogger : ILogger { public void Log(string m) => Console.WriteLine(m); }', cat: 'oop', pt: 'Implementa a interface + expression-bodied member', en: 'Implements the interface + an expression-bodied member' },
  { cmd: 'abstract class Animal { public abstract void Falar(); }', cat: 'oop', pt: 'Classe abstrata: não instanciável, método sem corpo', en: 'Abstract class: not instantiable, bodyless method' },
  { cmd: 'static class Util { public static int Dobro(int x) => x * 2; }', cat: 'oop', pt: 'Membros estáticos sem instância', en: 'Static members without an instance' },
  { cmd: 'public int X { get; private set; } = 1;', cat: 'oop', pt: 'Property com setter privado e valor inicial', en: 'Property with a private setter and default value' },
  { cmd: 'public string Nome { get; init; }', cat: 'oop', pt: 'init-only: definida no construtor/initializer, imutável depois', en: 'init-only: set in ctor/initializer, immutable afterwards' },
  { cmd: 'List<int> lista = new();', cat: 'oop', pt: 'Target-typed new (C# 9): tipo vindo da esquerda', en: 'Target-typed new (C# 9): type from the left side' },
  { cmd: 'Func<int, int> dobro = x => x * 2;', cat: 'oop', pt: 'Lambda atribuída a um delegate Func/Action', en: 'Lambda assigned to a Func/Action delegate' },
  { cmd: 'class Carro { public Carro(string m) { Modelo = m; } }', cat: 'oop', pt: 'Construtor (invocado com new Carro("X"))', en: 'Constructor (called via new Carro("X"))' },
  { cmd: 'public Carro(string m) : base(m) { }', cat: 'oop', pt: 'Encadeia para o construtor da classe base', en: 'Chains to the base class constructor' },

  // ─── Async & concorrência ─────────────────────────────────────────────────
  { cmd: 'async Task<string> BuscarAsync() { await Task.Delay(100); return "ok"; }', cat: 'async', pt: 'Método async retornando Task<T>', en: 'Async method returning Task<T>' },
  { cmd: 'var r = await BuscarAsync();', cat: 'async', pt: 'await desbloqueia a thread enquanto espera', en: 'await frees the thread while waiting' },
  { cmd: 'await Task.WhenAll(t1, t2, t3);', cat: 'async', pt: 'Espera todas as tasks terminarem (em paralelo)', en: 'Waits for all tasks to finish (in parallel)' },
  { cmd: 'await Task.WhenAny(t1, t2);', cat: 'async', pt: 'Espera a primeira concluir (timeouts, race)', en: 'Waits for the first to complete (timeouts, races)' },
  { cmd: 'await Task.Run(() => TrabalhoPesado());', cat: 'async', pt: 'Offload de trabalho com bloqueio para o thread pool', en: 'Offloads blocking work to the thread pool' },
  { cmd: 'await Task.Delay(1000);', cat: 'async', pt: 'Pausa sem bloquear a thread', en: 'Pauses without blocking a thread' },
  { cmd: 'lock (obj) { ... }', cat: 'async', pt: 'Seção crítica (mutex) entre threads', en: 'Critical section (mutex) between threads' },
  { cmd: 'var semaforo = new SemaphoreSlim(n); await semaforo.WaitAsync();', cat: 'async', pt: 'Limita concorrência com semáforo async', en: 'Limits concurrency with an async semaphore' },
  { cmd: 'var dict = new ConcurrentDictionary<string, int>();', cat: 'async', pt: 'Coleção thread-safe para escrita concorrente', en: 'Thread-safe collection for concurrent writes' },
  { cmd: 'await waiter.ConfigureAwait(false);', cat: 'async', pt: 'Não retorna ao contexto (UI/Sync) — evita deadlock', en: 'Does not return to the sync/UI context — avoids deadlocks' },
  { cmd: 'Parallel.For(0, 100, i => { ... });', cat: 'async', pt: 'Loop paralelo para CPU-bound', en: 'Parallel loop for CPU-bound work' },

  // ─── Exceções ─────────────────────────────────────────────────────────────
  { cmd: 'try { ... } catch (Exception ex) { ... }', cat: 'exceptions', pt: 'Bloco básico de tratamento', en: 'Basic handling block' },
  { cmd: 'catch (InvalidOperationException) { ... }', cat: 'exceptions', pt: 'Captura de um tipo específico', en: 'Catches a specific type' },
  { cmd: 'try { ... } catch { ... } finally { ... }', cat: 'exceptions', pt: 'finally sempre executa (liberar recursos)', en: 'finally always runs (release resources)' },
  { cmd: 'throw new ArgumentException("msg", nameof(param));', cat: 'exceptions', pt: 'Lança exceção comum com nome do parâmetro', en: 'Throws a common exception with the param name' },
  { cmd: 'catch (Exception ex) { log(ex); throw; }', cat: 'exceptions', pt: 'Registra e relança preservando a stack trace', en: 'Logs and rethrows preserving the stack trace' },
  { cmd: 'catch (Exception ex) when (ex.Message.Contains("timeout")) { ... }', cat: 'exceptions', pt: 'Exception filter: só captura se o filtro passar', en: 'Exception filter: only catches if the filter matches' },
  { cmd: 'class MinhaException : Exception { public MinhaException(string m) : base(m) { } }', cat: 'exceptions', pt: 'Exceção customizada', en: 'Custom exception' },
  { cmd: 'using (var s = File.OpenRead("a.txt")) { ... }', cat: 'exceptions', pt: 'using garante Dispose() no fim (IDisposable)', en: 'using guarantees Dispose() at the end (IDisposable)' },
  { cmd: 'ArgumentNullException.ThrowIfNull(arg);', cat: 'exceptions', pt: 'Valida null de forma curta (.NET 6+)', en: 'Short null guard (.NET 6+)' },
  { cmd: 'ex.Message; ex.InnerException; ex.StackTrace;', cat: 'exceptions', pt: 'Propriedades úteis da exceção', en: 'Useful exception properties' },
  { cmd: 'await using (var s = new StreamReaderAsync()) { ... }', cat: 'exceptions', pt: 'await using para IAsyncDisposable', en: 'await using for IAsyncDisposable' },

  // ─── Data & hora ──────────────────────────────────────────────────────────
  { cmd: 'var agora = DateTime.Now;', cat: 'datetime', pt: 'Data/hora local', en: 'Local date/time' },
  { cmd: 'var utc = DateTime.UtcNow;', cat: 'datetime', pt: 'Data/hora UTC (prefira para armazenar)', en: 'UTC date/time (prefer for storage)' },
  { cmd: 'DateTime.Now.ToString("yyyy-MM-dd HH:mm");', cat: 'datetime', pt: 'Formatação customizada', en: 'Custom formatting' },
  { cmd: 'DateTime.Now.AddDays(7).AddHours(2);', cat: 'datetime', pt: 'Operações: AddDays/AddMonths/AddYears/AddHours/AddMinutes/AddSeconds', en: 'Operations: AddDays/AddMonths/AddYears/AddHours/AddMinutes/AddSeconds' },
  { cmd: 'var diff = fim - inicio; // TimeSpan', cat: 'datetime', pt: 'Diferença entre datas vira TimeSpan', en: 'Date difference becomes a TimeSpan' },
  { cmd: 'var ts = TimeSpan.FromMinutes(90);', cat: 'datetime', pt: 'Constrói um período de tempo', en: 'Builds a time span' },
  { cmd: 'var natal = new DateTime(2025, 12, 25);', cat: 'datetime', pt: 'Data específica', en: 'A specific date' },
  { cmd: 'if (DateTime.TryParse("2025-01-01", out var d)) { ... }', cat: 'datetime', pt: 'Parse seguro de strings de data', en: 'Safe parsing of date strings' },
  { cmd: 'var dia = DateOnly.Today; var hora = TimeOnly.FromDateTime(DateTime.Now);', cat: 'datetime', pt: 'DateOnly/TimeOnly (.NET 6): só data ou só hora', en: 'DateOnly/TimeOnly (.NET 6): date-only or time-only' },
  { cmd: 'var odt = DateTimeOffset.UtcNow;', cat: 'datetime', pt: 'Timestamp com offset de fuso (guarda o UTC+xx)', en: 'Timestamp with a timezone offset (remembers UTC+xx)' },
  { cmd: '$"{DateTime.Now:F}"', cat: 'datetime', pt: 'Formatos padrão: F = data + hora longas', en: 'Standard formats: F = long date + long time' },
  { cmd: 'DateTime.Now.DayOfWeek.ToString();', cat: 'datetime', pt: 'Dia da semana como enum/tempo', en: 'Day of the week as an enum/text' },

  // ─── I/O & arquivos ───────────────────────────────────────────────────────
  { cmd: 'var texto = File.ReadAllText("a.txt");', cat: 'io', pt: 'Lê o arquivo inteiro numa string', en: 'Reads the whole file into a string' },
  { cmd: 'var linhas = File.ReadAllLines("a.txt");', cat: 'io', pt: 'Lê linha a linha', en: 'Reads line by line' },
  { cmd: 'File.WriteAllText("b.txt", texto);', cat: 'io', pt: 'Escreve (sobrescreve) um arquivo', en: 'Writes (overwrites) a file' },
  { cmd: 'File.AppendAllText("log.txt", linha);', cat: 'io', pt: 'Adiciona ao final (log)', en: 'Appends to the end (logging)' },
  { cmd: 'if (File.Exists("a.txt")) { }  Directory.Exists("pasta");', cat: 'io', pt: 'Verifica existência', en: 'Existence checks' },
  { cmd: 'Directory.CreateDirectory("pasta");', cat: 'io', pt: 'Cria diretório (não falha se já existe)', en: 'Creates a directory (no error if it exists)' },
  { cmd: 'var p = Path.Combine("pasta", "a.txt");', cat: 'io', pt: 'Junta caminhos do jeito do SO', en: 'Joins paths the OS way' },
  { cmd: 'Path.GetFileName(p); Path.GetExtension(p); Path.GetDirectoryName(p);', cat: 'io', pt: 'Pedaços do caminho', en: 'Path pieces' },
  { cmd: 'using var reader = new StreamReader("a.txt");', cat: 'io', pt: 'Leitura de fluxo com using statement', en: 'Stream reading with a using statement' },
  { cmd: 'await File.WriteAllTextAsync("b.txt", texto);', cat: 'io', pt: 'I/O assíncrono (não bloqueia a thread)', en: 'Async I/O (does not block a thread)' },
  { cmd: 'var json = JsonSerializer.Serialize(objeto);', cat: 'io', pt: 'Serializa para JSON (System.Text.Json)', en: 'Serializes to JSON (System.Text.Json)' },
  { cmd: 'var obj = JsonSerializer.Deserialize<MeuTipo>(json);', cat: 'io', pt: 'Desserializa JSON (null se não casar)', en: 'Deserializes JSON (null if it does not match)' },
  { cmd: 'Environment.GetEnvironmentVariable("API_URL");', cat: 'io', pt: 'Variáveis de ambiente', en: 'Environment variables' },
  { cmd: 'var arquivos = Directory.GetFiles("pasta");', cat: 'io', pt: 'Lista os arquivos de uma pasta', en: 'Lists files in a folder' },

  // ─── Testes (xUnit) ───────────────────────────────────────────────────────
  { cmd: '[Fact] public void Somar_DeveRetornarSoma() { ... }', cat: 'tests', pt: 'Teste unitário simples (xUnit)', en: 'Plain unit test (xUnit)' },
  { cmd: '[Theory] [InlineData(2, 3, 5)] public void Somar(int a, int b, int esperado) { ... }', cat: 'tests', pt: 'Teste parametrizado com vários InlineData', en: 'Parameterized test with multiple InlineData' },
  { cmd: 'Assert.Equal(5, Somar(2, 3));', cat: 'tests', pt: 'Compara valor esperado com o real', en: 'Compares expected with actual' },
  { cmd: 'Assert.True(x > 0); Assert.False(x < 0);', cat: 'tests', pt: 'Asserts booleanos', en: 'Boolean asserts' },
  { cmd: 'Assert.Throws<DivideByZeroException>(() => Div(1, 0));', cat: 'tests', pt: 'Espera que uma exceção seja lançada', en: 'Expects an exception to be thrown' },
  { cmd: 'Assert.Contains("ana", nome); Assert.StartsWith("Olá", msg);', cat: 'tests', pt: 'Checagens de substring', en: 'Substring checks' },
  { cmd: 'Assert.Empty(lista); Assert.Single(pessoas);', cat: 'tests', pt: 'Coleções: vazia / com exatamente 1', en: 'Collections: empty / exactly one' },
  { cmd: 'Assert.All(numeros, n => Assert.True(n > 0));', cat: 'tests', pt: 'Valida cada elemento da coleção', en: 'Validates every element of a collection' },
  { cmd: 'Assert.Equal("ana", nome, ignoreCase: true);', cat: 'tests', pt: 'Comparação de string ignorando caixa', en: 'String comparison ignoring case' },
  { cmd: 'Assert.Null(x); Assert.NotNull(y);', cat: 'tests', pt: 'Checagens de null', en: 'Null checks' },
  { cmd: '// Arrange · Act · Assert', cat: 'tests', pt: 'A estrutura de todo teste unitário', en: 'The structure of every unit test' },
  { cmd: 'public class ContaTests { [Fact] public void Deposito_SomaSaldo() { ... } }', cat: 'tests', pt: 'Classe de teste: um arquivo .cs + dotnet test', en: 'Test class: one .cs file + dotnet test' },

  // ─── Gotchas & dicas ──────────────────────────────────────────────────────
  { cmd: 'string s = ""; for (...) s += x;', cat: 'gotchas', pt: 'string é imutável — concatenar em loop é O(n²); use StringBuilder', en: 'strings are immutable — loop concatenation is O(n²); use StringBuilder' },
  { cmd: 'decimal para dinheiro, double para medição', cat: 'gotchas', pt: 'double tem erro de arredondamento binário; nunca para valores monetários', en: 'decimal for money, double for measurement' },
  { cmd: 'async void FazerAlgo() { ... }', cat: 'gotchas', pt: 'async void só vale em event handlers — exceções ficam inpegraíveis', en: 'async void is only for event handlers — exceptions become unobservable' },
  { cmd: 'var q = nums.Where(x => x > 2);', cat: 'gotchas', pt: 'LINQ é lazy — iterar 2x re-executa; materialize com .ToList()/.ToArray()', en: 'LINQ is lazy — iterating twice re-executes; materialize with .ToList()/.ToArray()' },
  { cmd: 'list.Count vs array.Length vs str.Length', cat: 'gotchas', pt: 'List usa Count; array e string usam Length', en: 'List uses Count; array and string use Length' },
  { cmd: 'struct copia por valor; class copia a referência', cat: 'gotchas', pt: 'Passar um struct copia os dados; classes compartilham o objeto', en: 'structs copy by value; classes copy the reference' },
  { cmd: 'int.Parse(x);', cat: 'gotchas', pt: 'Lança em null/forma inválida — use TryParse para entrada externa', en: 'Throws on null/invalid input — use TryParse for user input' },
  { cmd: 'obj1 == obj2 vs obj1.Equals(obj2)', cat: 'gotchas', pt: '== compara valor em strings/records mas referência em classes; override Equals', en: '== is value-based for strings/records but reference-based for classes; override Equals' },
  { cmd: 'Task.Delay vs Thread.Sleep', cat: 'gotchas', pt: 'Delay suspende sem prender thread; Sleep bloqueia a thread inteira', en: 'Delay suspends without pinning a thread; Sleep blocks the whole thread' },
  { cmd: 'using var s = ...;', cat: 'gotchas', pt: 'using statement libera só no fim do escopo; use {} para liberar cedo', en: 'using statement disposes at scope end; use {} to dispose early' },
  { cmd: 'record Pessoa(...) vs class Pessoa', cat: 'gotchas', pt: 'record usa equality estrutural (valor a valor); class usa identidade de referência', en: 'records use structural equality; classes use reference identity' },
  { cmd: 'lista.Remove(item) no início em loop', cat: 'gotchas', pt: 'Remover do início de List<T> é O(n) por item — remova do fim ou use RemoveAll', en: 'Removing from the head of List<T> is O(n) per item — remove from the tail or use RemoveAll' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de C# (.NET)',
    intro: (
      <>
        Referência pesquisável do C# e do ecossistema .NET. Cobre o CLI do{' '}
        <Text code>dotnet</Text> (new/run/build/test/publish), a sintaxe da
        linguagem (<Text code>var</Text>, interpolação{' '}
        <Text code>$"..."</Text>, raw strings, collection expressions),
        tipos & conversão (nullable, parse, pattern matching), controle de
        fluxo (inclusive switch expressions), strings & formatação, coleções
        e LINQ (reduce a lazy), classes/objetos/OOP (records, interfaces,
        init-only), async/await & concorrência, exceções ({' '}
        <Text code>using</Text> e <Text code>throw;</Text>), data & hora,
        I/O & arquivos (System.Text.Json), testes com xUnit e os gotchas
        clássicos. Tudo 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Use <Text code>decimal</Text> para dinheiro e{' '}
        <Text code>Task.Delay</Text> em vez de{' '}
        <Text code>Thread.Sleep</Text> no async. Lembre que a maioria dos
        operadores é O(1) em coleções, então usar o{' '}
        <Text code>?.Count</Text>. A melhor forma de escrever JSON é usar{' '}
        <Text code>JsonSerializer</Text> nativo do .NET. Para testes, o{' '}
        <Text code>[Theory]</Text> com <Text code>[InlineData]</Text> é
        obrigatório para reduzir duplicação de testes.
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
    title: 'C# (.NET) Cheat Sheet',
    intro: (
      <>
        A searchable reference for C# and the .NET ecosystem. Covers the{' '}
        <Text code>dotnet</Text> CLI (new/run/build/test/publish), language
        syntax (<Text code>var</Text>, <Text code>$"..."</Text>
        interpolation, raw strings, collection expressions), types &
        conversion (nullable, parsing, pattern matching), control flow
        (including switch expressions), strings & formatting, collections
        & LINQ (with the lazy caveat), classes/objects/OOP (records,
        interfaces, init-only), async/await & concurrency, exceptions (
        <Text code>using</Text> and <Text code>throw;</Text>), date & time,
        I/O & files (System.Text.Json), xUnit testing and the classic
        gotchas. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Use <Text code>decimal</Text> for money and{' '}
        <Text code>Task.Delay</Text> instead of <Text code>Thread.Sleep</Text>
        when async. Remember strings are immutable — reach for{' '}
        <Text code>StringBuilder</Text> in loops. For JSON, the built-in{' '}
        <Text code>JsonSerializer</Text> is the way to go. For tests,
        <Text code>[Theory]</Text> with <Text code>[InlineData]</Text> kills
        test duplication.
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

export default function CsharpCheatsheetPage() {
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