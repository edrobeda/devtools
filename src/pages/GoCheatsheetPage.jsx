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
  'funcs',
  'collections',
  'errors',
  'concurrency',
  'io',
  'testing',
  'tooling',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  control: 'cyan',
  funcs: 'magenta',
  collections: 'green',
  errors: 'red',
  concurrency: 'gold',
  io: 'orange',
  testing: 'lime',
  tooling: 'volcano',
}

const labelOf = {
  cli: { pt: 'CLI do go (comandos)', en: 'go CLI (commands)' },
  basics: { pt: 'Básicos da linguagem', en: 'Language basics' },
  types: { pt: 'Tipos, structs & interfaces', en: 'Types, structs & interfaces' },
  control: { pt: 'Controle de fluxo', en: 'Control flow' },
  funcs: { pt: 'Funções & métodos', en: 'Functions & methods' },
  collections: { pt: 'Arrays, slices & maps', en: 'Arrays, slices & maps' },
  errors: { pt: 'Tratamento de erros', en: 'Error handling' },
  concurrency: { pt: 'Concorrência & goroutines', en: 'Concurrency & goroutines' },
  io: { pt: 'I/O, strings & conversões', en: 'I/O, strings & conversions' },
  testing: { pt: 'Testes & benchmarks', en: 'Testing & benchmarks' },
  tooling: { pt: 'Build & ferramentas', en: 'Build & tooling' },
}

const COMMANDS = [
  // ─── go CLI ──────────────────────────────────────────────────────────────
  { cmd: 'go run main.go', cat: 'cli', pt: 'Compila e executa sem gerar binário', en: 'Compiles and runs without producing a binary' },
  { cmd: 'go build ./...', cat: 'cli', pt: 'Compila todos os pacotes do módulo', en: 'Builds every package in the module' },
  { cmd: 'go build -o app .', cat: 'cli', pt: 'Define o nome do binário de saída', en: 'Sets the output binary name' },
  { cmd: 'go build -ldflags "-X main.version=v1.2.0"', cat: 'cli', pt: 'Injeta valores em variáveis string na hora do build', en: 'Injects values into string variables at build time' },
  { cmd: 'go install cmd/app@latest', cat: 'cli', pt: 'Instala o binário em $GOBIN ($GOPATH/bin)', en: 'Installs the binary into $GOBIN ($GOPATH/bin)' },
  { cmd: 'go mod init github.com/user/mod', cat: 'cli', pt: 'Inicializa um novo módulo Go', en: 'Initializes a new Go module' },
  { cmd: 'go mod tidy', cat: 'cli', pt: 'Sincroniza go.mod/go.sum com os imports do código', en: 'Syncs go.mod/go.sum with the imports in your code' },
  { cmd: 'go get pkg@v1.2.3', cat: 'cli', pt: 'Adiciona ou atualiza uma dependência', en: 'Adds or updates a dependency' },
  { cmd: 'go test ./...', cat: 'cli', pt: 'Roda os testes de todos os pacotes', en: 'Runs the tests of every package' },
  { cmd: 'go test -run TestFoo -v', cat: 'cli', pt: 'Só os testes que casam com o padrão, verboso', en: 'Only tests matching the pattern, verbose' },
  { cmd: 'go test -race ./...', cat: 'cli', pt: 'Ativa o race detector (data races)', en: 'Enables the race detector (data races)' },
  { cmd: 'go test -cover ./...', cat: 'cli', pt: 'Mostra a cobertura por pacote', en: 'Shows coverage per package' },
  { cmd: 'go vet ./...', cat: 'cli', pt: 'Analisa o código em busca de construções suspeitas', en: 'Analyzes the code for suspicious constructs' },
  { cmd: 'go fmt ./...', cat: 'cli', pt: 'Formata todos os arquivos (mesmo estilo do gofmt)', en: 'Formats every file (same style as gofmt)' },
  { cmd: 'go doc fmt.Println', cat: 'cli', pt: 'Mostra a documentação de um símbolo no terminal', en: 'Shows the docs for a symbol in the terminal' },
  { cmd: 'go env GOPATH', cat: 'cli', pt: 'Mostra uma variável de ambiente do Go', en: 'Shows a Go environment variable' },
  { cmd: 'GOOS=linux GOARCH=arm64 go build', cat: 'cli', pt: 'Cross-compile para outro SO/arquitetura', en: 'Cross-compiles for another OS/architecture' },
  { cmd: 'CGO_ENABLED=0 go build', cat: 'cli', pt: 'Gera binário estático (ideal para containers)', en: 'Builds a static binary (great for containers)' },
  { cmd: 'go list -m all', cat: 'cli', pt: 'Lista todas as dependências do módulo atual', en: 'Lists every dependency of the current module' },
  { cmd: 'go work init . ./pkg', cat: 'cli', pt: 'Cria um workspace com múltiplos módulos locais', en: 'Creates a workspace with multiple local modules' },

  // ─── Básicos ─────────────────────────────────────────────────────────────
  { cmd: 'package main', cat: 'basics', pt: 'Pacote que gera um executável (com func main)', en: 'The package that produces an executable (with func main)' },
  { cmd: 'import ("fmt"; "os")', cat: 'basics', pt: 'Importa pacotes; cada import numa linha quando agrupado', en: 'Imports packages; one per line when grouped' },
  { cmd: 'func main() { }', cat: 'basics', pt: 'Ponto de entrada do programa', en: 'Entry point of the program' },
  { cmd: 'var x int = 42', cat: 'basics', pt: 'Declaração com tipo explícito', en: 'Declaration with an explicit type' },
  { cmd: 'x := 42', cat: 'basics', pt: 'Declaração com inferência de tipo (só dentro de função)', en: 'Declaration with type inference (inside functions only)' },
  { cmd: 'const MaxConn = 100', cat: 'basics', pt: 'Constante com tipo inferido no uso', en: 'Constant with type inferred on use' },
  { cmd: 'var s = "oi"', cat: 'basics', pt: 'Declaração com inferência fora de função', en: 'Declaration with inference outside a function' },
  { cmd: 'var a, b, c = 1, "x", true', cat: 'basics', pt: 'Declara várias variáveis de uma vez', en: 'Declares several variables at once' },
  { cmd: 'defer file.Close()', cat: 'basics', pt: 'Executa no fim da função, em ordem LIFO (limpeza padrão)', en: 'Runs at function end, LIFO order (idiomatic cleanup)' },
  { cmd: 'defer func() { if r := recover(); r != nil { log.Println(r) } }()', cat: 'basics', pt: 'Padrão para capturar panic e logar sem derrubar', en: 'Pattern to catch a panic and log it without crashing' },
  { cmd: '_ = f()', cat: 'basics', pt: 'Descarta um valor de retorno que não interessa', en: 'Discards a return value you do not care about' },
  { cmd: 'fmt.Println(42, "abc", 3.14)', cat: 'basics', pt: 'Imprime com espaços e newline automáticos', en: 'Prints with automatic spaces and a newline' },
  { cmd: '// comentário e /* bloco */', cat: 'basics', pt: 'Comentários de linha e de bloco', en: 'Line and block comments' },

  // ─── Tipos, structs & interfaces ─────────────────────────────────────────
  { cmd: 'string, bool, int, int64, float64', cat: 'types', pt: 'Tipos básicos (int = 64 bits na maioria das plataformas)', en: 'Basic types (int is 64-bit on most platforms)' },
  { cmd: 'byte // uint8,  rune // int32', cat: 'types', pt: 'Aliases: byte é uint8 e rune é um code point UTF-8', en: 'Aliases: byte is uint8, rune is a UTF-8 code point' },
  { cmd: 'var n float64 = 1e9', cat: 'types', pt: 'Notação científica para literais de ponto flutuante', en: 'Scientific notation for float literals' },
  { cmd: 'int64(x), float64(n)', cat: 'types', pt: 'Conversão explícita entre tipos numéricos', en: 'Explicit conversion between numeric types' },
  { cmd: 'v, err := strconv.Atoi(s)', cat: 'types', pt: 'Converte string para int (retorna erro se inválido)', en: 'Converts a string to int (returns an error if invalid)' },
  { cmd: 'type User struct { Name string; Age int }', cat: 'types', pt: 'Define um struct com campos', en: 'Defines a struct with fields' },
  { cmd: 'u := User{Name: "Ana", Age: 30}', cat: 'types', pt: 'Cria com campos nomeados (claras e resistentes a reorder)', en: 'Creates with named fields (clear and reorder-safe)' },
  { cmd: '&User{}', cat: 'types', pt: 'Ponteiro para struct — equivalente a um "new"', en: 'Pointer to a struct — the "new" equivalent' },
  { cmd: 'type Stringer interface { String() string }', cat: 'types', pt: 'Define uma interface (satisfeita implicitamente)', en: 'Defines an interface (satisfied implicitly)' },
  { cmd: 'v, ok := x.(string)', cat: 'types', pt: 'Type assertion segura (ok=false se o tipo não bater)', en: 'Safe type assertion (ok=false when the type does not match)' },
  { cmd: 'switch v := x.(type) { case int: ; default: }', cat: 'types', pt: 'Type switch — despacha pelo tipo dinâmico da interface', en: 'Type switch — switches on the dynamic type of an interface' },
  { cmd: 'func Map[T any](s []T, f func(T) T) []T', cat: 'types', pt: 'Função genérica (Go 1.18+); T pode ser usado em parâmetros e retornos', en: 'Generic function (Go 1.18+); T usable in params and returns' },
  { cmd: 'any', cat: 'types', pt: 'Alias de interface{} — valor de tipo desconhecido', en: 'Alias for interface{} — a value of unknown type' },
  { cmd: 'var p *int; p = &x; *p = 10', cat: 'types', pt: 'Ponteiros: endereço (&) e dereferência (*)', en: 'Pointers: addressing (&) and dereferencing (*)' },
  { cmd: 'nil', cat: 'types', pt: 'Valor zero de ponteiros, slices, maps, funções e interfaces', en: 'Zero value of pointers, slices, maps, funcs and interfaces' },

  // ─── Controle de fluxo ───────────────────────────────────────────────────
  { cmd: 'if x > 0 { } else { }', cat: 'control', pt: 'Condicional sem parênteses', en: 'Conditional without parentheses' },
  { cmd: 'if err := f(); err != nil { return err }', cat: 'control', pt: 'Declara a variável no próprio scopo do if', en: 'Declares the variable within the if scope' },
  { cmd: 'for i := 0; i < 10; i++ { }', cat: 'control', pt: 'Loop clássico com inicialização', en: 'Classic loop with init statement' },
  { cmd: 'for i, v := range xs { }', cat: 'control', pt: 'Itera slice/array com índice e valor', en: 'Iterates a slice/array with index and value' },
  { cmd: 'for k, v := range m { }', cat: 'control', pt: 'Itera um map (ordem aleatória!)', en: 'Iterates a map (random order!)' },
  { cmd: 'for v := range ch { }', cat: 'control', pt: 'Drena um canal até ele ser fechado', en: 'Drains a channel until it is closed' },
  { cmd: 'for { }', cat: 'control', pt: 'Loop infinito (saia com break/return)', en: 'Infinite loop (exit with break/return)' },
  { cmd: 'switch n { case 1: ; case 2: ; default: }', cat: 'control', pt: 'Switch sem "fallthrough" automático', en: 'Switch without automatic fallthrough' },
  { cmd: 'switch { case n < 0: ; default: }', cat: 'control', pt: 'Switch sem expressão — "if" encadeado mais legível', en: 'Expressionless switch — a nicer if/else chain' },
  { cmd: 'select { case v := <-ch: ; case <-time.After(1 * time.Second): }', cat: 'control', pt: 'Espera em múltiplos canais (com timeout)', en: 'Waits on multiple channels (with a timeout)' },
  { cmd: 'break, continue', cat: 'control', pt: 'Interrompe o loop ou pula para a próxima iteração', en: 'Breaks the loop or skips to the next iteration' },

  // ─── Funções & métodos ───────────────────────────────────────────────────
  { cmd: 'func add(a, b int) int { return a + b }', cat: 'funcs', pt: 'Função simples com parâmetros e retorno tipados', en: 'Simple function with typed params and return' },
  { cmd: 'func div(a, b int) (int, error)', cat: 'funcs', pt: 'Múltiplos retornos — convenção (valor, erro)', en: 'Multiple returns — the (value, error) convention' },
  { cmd: 'func f() (n int) { n = 42; return }', cat: 'funcs', pt: 'Retorno nomeado (return "nu" devolve os valores dos nomes)', en: 'Named returns (bare return yields the named values)' },
  { cmd: 'func sum(nums ...int) int', cat: 'funcs', pt: 'Parâmetro variádico — aceita N argumentos', en: 'Variadic parameter — accepts N arguments' },
  { cmd: 'func() { }()', cat: 'funcs', pt: 'Função anônima executada na hora (IIFE)', en: 'Anonymous function invoked immediately (IIFE)' },
  { cmd: 'func apply(fn func(int) int, v int) int { return fn(v) }', cat: 'funcs', pt: 'Função recebida como argumento (callback)', en: 'Function passed as an argument (callback)' },
  { cmd: 'func (u User) Greet() string { return "oi " + u.Name }', cat: 'funcs', pt: 'Método com receiver por valor (cópia)', en: 'Method with a value receiver (copy)' },
  { cmd: 'func (u *User) SetName(n string)', cat: 'funcs', pt: 'Método com receiver por ponteiro — pode mutar o struct', en: 'Method with a pointer receiver — can mutate the struct' },
  { cmd: 'type Handler func(w http.ResponseWriter, r *http.Request)', cat: 'funcs', pt: 'Tipo de função nomeado (usado para interfaces e callbacks)', en: 'Named function type (for interfaces and callbacks)' },
  { cmd: 'func makeAdder(n int) func(int) int', cat: 'funcs', pt: 'Closure que captura variáveis do escopo externo', en: 'Closure capturing variables from the outer scope' },

  // ─── Arrays, slices & maps ───────────────────────────────────────────────
  { cmd: 'var a [3]int', cat: 'collections', pt: 'Array de tamanho fixo (raro no dia a dia)', en: 'Fixed-size array (rare in daily code)' },
  { cmd: 's := []int{1, 2, 3}', cat: 'collections', pt: 'Slice literal — o tipo de lista padrão', en: 'Slice literal — the default list type' },
  { cmd: 's = append(s, 4)', cat: 'collections', pt: 'Adiciona no fim (pode alocar um array novo por baixo)', en: 'Appends at the end (may reallocate under the hood)' },
  { cmd: 'make([]int, 0, 10)', cat: 'collections', pt: 'Slice vazio com capacidade inicial (evita realocações)', en: 'Empty slice with initial capacity (avoids reallocs)' },
  { cmd: 's[1:3], s[:2], s[1:]', cat: 'collections', pt: 'Fatia um slice (subslices compartilham o array)', en: 'Slices a slice (subslices share the backing array)' },
  { cmd: 'copy(dst, src)', cat: 'collections', pt: 'Copia elementos (retorna quantos copiou)', en: 'Copies elements (returns how many it copied)' },
  { cmd: 'm := map[string]int{}', cat: 'collections', pt: 'Cria um map vazio (make na verdade)', en: 'Creates an empty map (make under the hood)' },
  { cmd: 'm["chave"] = 1', cat: 'collections', pt: 'Insere ou atualiza um valor', en: 'Inserts or updates a value' },
  { cmd: 'v, ok := m["chave"]', cat: 'collections', pt: 'Lê o valor e verifica se a chave existe', en: 'Reads the value and checks if the key exists' },
  { cmd: 'delete(m, "chave")', cat: 'collections', pt: 'Remove uma chave (sem erro se não existir)', en: 'Deletes a key (no-op if missing)' },
  { cmd: 's = append(s[:i], s[i+1:]...)', cat: 'collections', pt: 'Remove o elemento do meio (desspread do restante)', en: 'Removes the middle element (spreads the tail)' },

  // ─── Tratamento de erros ─────────────────────────────────────────────────
  { cmd: 'errors.New("mensagem")', cat: 'errors', pt: 'Cria um erro simples, sem wrapping', en: 'Creates a simple error, no wrapping' },
  { cmd: 'fmt.Errorf("user %v: %w", id, err)', cat: 'errors', pt: 'Embrulha com a causa original (%w já embrulha, %v não)', en: 'Wraps with the original cause (%w wraps, %v does not)' },
  { cmd: 'errors.Is(err, ErrNotFound)', cat: 'errors', pt: 'Verifica a cadeia inteira por um erro-alvo', en: 'Checks the whole chain for a target error' },
  { cmd: 'errors.As(err, &target)', cat: 'errors', pt: 'Extrai o primeiro erro que casa com o tipo apontado', en: 'Extracts the first error matching the pointed type' },
  { cmd: 'var ErrNotFound = errors.New("not found")', cat: 'errors', pt: 'Erro sentinela — comparado com errors.Is', en: 'Sentinel error — compared with errors.Is' },
  { cmd: 'if err != nil { return err }', cat: 'errors', pt: 'Convenção: checar e propagar o erro sempre', en: 'Convention: always check and propagate the error' },
  { cmd: 'panic("algo grave")', cat: 'errors', pt: 'Aborta com stack trace — use só para estados irrecuperáveis', en: 'Aborts with a stack trace — for unrecoverable states only' },
  { cmd: 'recover()', cat: 'errors', pt: 'Captura o panic dentro de um defer (retorna o valor do panic)', en: 'Catches the panic inside a defer (returns the panic value)' },

  // ─── Concorrência ────────────────────────────────────────────────────────
  { cmd: 'go f()', cat: 'concurrency', pt: 'Roda f em uma goroutine (leve, não esqueça de sincronizar)', en: 'Runs f in a goroutine (cheap, do not forget to sync)' },
  { cmd: 'ch := make(chan int)', cat: 'concurrency', pt: 'Canal unbuffered — envia e recebe se sincronizam', en: 'Unbuffered channel — send and receive synchronize' },
  { cmd: 'ch := make(chan int, 10)', cat: 'concurrency', pt: 'Canal com buffer; envia sem bloquear até encher', en: 'Buffered channel; send does not block until full' },
  { cmd: 'ch <- v', cat: 'concurrency', pt: 'Envia um valor para o canal', en: 'Sends a value to the channel' },
  { cmd: 'v := <-ch', cat: 'concurrency', pt: 'Recebe um valor do canal (bloqueia se vazio)', en: 'Receives a value from the channel (blocks if empty)' },
  { cmd: 'close(ch)', cat: 'concurrency', pt: 'Fecha o canal; receivers drenam o restante e depois recebem zero', en: 'Closes the channel; receivers drain then get zero value' },
  { cmd: 'v, ok := <-ch', cat: 'concurrency', pt: 'ok=false quando o canal está fechado e vazio', en: 'ok=false when the channel is closed and empty' },
  { cmd: 'var wg sync.WaitGroup', cat: 'concurrency', pt: 'Espera um grupo de goroutines terminar', en: 'Waits for a group of goroutines to finish' },
  { cmd: 'wg.Add(1); defer wg.Done()', cat: 'concurrency', pt: 'Incrementa ao iniciar e decrementa ao sair da goroutine', en: 'Increments on start and decrements when the goroutine ends' },
  { cmd: 'wg.Wait()', cat: 'concurrency', pt: 'Bloqueia até o contador chegar a zero', en: 'Blocks until the counter hits zero' },
  { cmd: 'var mu sync.Mutex; mu.Lock(); defer mu.Unlock()', cat: 'concurrency', pt: 'Protege uma seção crítica contra acesso concorrente', en: 'Protects a critical section from concurrent access' },
  { cmd: 'var rw sync.RWMutex', cat: 'concurrency', pt: 'RWMutex permite leituras simultâneas; escrita é exclusiva', en: 'RWMutex allows concurrent reads; writes are exclusive' },
  { cmd: 'var once sync.Once; once.Do(fn)', cat: 'concurrency', pt: 'Executa fn exatamente uma vez, mesmo com N goroutines', en: 'Runs fn exactly once, even across N goroutines' },
  { cmd: 'ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second); defer cancel()', cat: 'concurrency', pt: 'Contexto com timeout para propagar cancelamento', en: 'Context with a timeout to propagate cancellation' },
  { cmd: 'select { case <-ctx.Done(): return ctx.Err(); default: }', cat: 'concurrency', pt: 'Checa cancelamento sem bloquear', en: 'Checks cancellation without blocking' },
  { cmd: 'atomic.AddInt64(&counter, 1)', cat: 'concurrency', pt: 'Incremento atômico sem mutex (package sync/atomic)', en: 'Atomic increment without a mutex (sync/atomic)' },

  // ─── I/O, strings & conversões ───────────────────────────────────────────
  { cmd: 'fmt.Printf("%s %d %v\\n", s, n, x)', cat: 'io', pt: 'Verbs úteis: %v %+v %#v %q %T %d %f %s %t %x', en: 'Useful verbs: %v %+v %#v %q %T %d %f %s %t %x' },
  { cmd: 'var sb strings.Builder; sb.WriteString("oi")', cat: 'io', pt: 'Concatenação eficiente (evita criar strings novas)', en: 'Efficient concatenation (avoids creating new strings)' },
  { cmd: 'strings.Split(s, ","); strings.Join(parts, "-")', cat: 'io', pt: 'Divide e junta strings', en: 'Splits and joins strings' },
  { cmd: 'strings.TrimSpace(s)', cat: 'io', pt: 'Remove espaços das pontas', en: 'Strips leading/trailing whitespace' },
  { cmd: 'os.Getenv("HOME")', cat: 'io', pt: 'Lê uma variável de ambiente', en: 'Reads an environment variable' },
  { cmd: 'os.Args', cat: 'io', pt: 'Argumentos da linha de comando (os.Args[0] é o programa)', en: 'Command-line arguments (os.Args[0] is the program)' },
  { cmd: 'data, err := os.ReadFile("a.txt")', cat: 'io', pt: 'Lê o arquivo inteiro como []byte', en: 'Reads the whole file as []byte' },
  { cmd: 'os.WriteFile("b.txt", data, 0o644)', cat: 'io', pt: 'Escreve um arquivo (0o644 = permissões)', en: 'Writes a file (0o644 = permissions)' },
  { cmd: 'f, err := os.Open("a.txt"); defer f.Close()', cat: 'io', pt: 'Abre um arquivo e garante o fechamento com defer', en: 'Opens a file and ensures it is closed with defer' },
  { cmd: 'sc := bufio.NewScanner(f); for sc.Scan() { }', cat: 'io', pt: 'Lê um arquivo linha a linha (sc.Err() ao final)', en: 'Reads a file line by line (check sc.Err() at the end)' },
  { cmd: 'io.ReadAll(r)', cat: 'io', pt: 'Consome um io.Reader inteiro', en: 'Reads an entire io.Reader' },
  { cmd: 'n, err := io.Copy(dst, src)', cat: 'io', pt: 'Copia de um Reader para um Writer', en: 'Copies from a Reader to a Writer' },
  { cmd: 'strconv.Itoa(42); strconv.ParseFloat(s, 64)', cat: 'io', pt: 'Converte int→string e string→float', en: 'Converts int→string and string→float' },

  // ─── Testes & benchmarks ─────────────────────────────────────────────────
  { cmd: 'func TestAdd(t *testing.T) { }', cat: 'testing', pt: 'Teste unitário básico (arquivo termina em _test.go)', en: 'Basic unit test (file ends with _test.go)' },
  { cmd: 't.Errorf("esperava %v, veio %v", want, got)', cat: 'testing', pt: 'Registra falha e continua o teste', en: 'Reports a failure and keeps the test running' },
  { cmd: 't.Fatalf("falhou: %v", err)', cat: 'testing', pt: 'Registra falha e para o teste imediatamente', en: 'Reports a failure and stops the test immediately' },
  { cmd: 't.Helper()', cat: 'testing', pt: 'Marca a função como helper na stack trace da falha', en: 'Marks the function as a helper in the failure trace' },
  { cmd: 'cases := []struct{ name string; a, b, want int }{...}', cat: 'testing', pt: 'Teste table-driven: casos + esperado num único slice', en: 'Table-driven test: cases + wanted in one slice' },
  { cmd: 't.Run("sub", func(t *testing.T) { })', cat: 'testing', pt: 'Subtestes nomeados (rode um com -run TestX/sub)', en: 'Named subtests (run one with -run TestX/sub)' },
  { cmd: 'func BenchmarkX(b *testing.B) { for i := 0; i < b.N; i++ { } }', cat: 'testing', pt: 'Benchmark mede a operação com b.N iterações', en: 'Benchmark measures the op over b.N iterations' },
  { cmd: 'go test -bench=. -benchmem', cat: 'testing', pt: 'Roda benchmarks mostrando alocações/memória', en: 'Runs benchmarks showing allocations/memory' },
  { cmd: 'go test -coverprofile=cover.out && go tool cover -html=cover.out', cat: 'testing', pt: 'Gera o relatório de cobertura em HTML interativo', en: 'Generates the interactive HTML coverage report' },
  { cmd: 't.Skip("ambiente não suporta")', cat: 'testing', pt: 'Pula o teste com uma justificativa', en: 'Skips the test with a reason' },

  // ─── Build & ferramentas ─────────────────────────────────────────────────
  { cmd: '//go:build linux', cat: 'tooling', pt: 'Build tag — o arquivo só compila no SO marcado', en: 'Build tag — the file only builds on the marked OS' },
  { cmd: '//go:embed template.tmpl', cat: 'tooling', pt: 'Embute arquivos no binário (package embed)', en: 'Embeds files into the binary (package embed)' },
  { cmd: 'go test -fuzz=FuzzFoo', cat: 'tooling', pt: 'Fuzzing nativo — alimenta a função com entradas aleatórias', en: 'Native fuzzing — feeds the function random inputs' },
  { cmd: 'go mod vendor', cat: 'tooling', pt: 'Copia as dependências para a pasta vendor/ (build offline)', en: 'Copies dependencies to vendor/ (offline builds)' },
  { cmd: 'go run -race ./...', cat: 'tooling', pt: 'Executa também com o race detector ativo', en: 'Runs with the race detector active too' },
  { cmd: 'go list ./...', cat: 'tooling', pt: 'Lista todos os pacotes do módulo', en: 'Lists all the packages in the module' },
  { cmd: 'defer close(); defer m.Unlock()', cat: 'tooling', pt: 'Cleanup centralizado no topo da função, na ordem certa', en: 'Centralized cleanup at the top, in the right order' },
  { cmd: 'func init() { }', cat: 'tooling', pt: 'Roda na inicialização do pacote, antes do main', en: 'Runs at package init, before main' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Go',
    intro: (
      <>
        Referência pesquisável da linguagem Go — comandos do{' '}
        <Text code>go</Text> (build, mod, test, vet), básicos da sintaxe,
        tipos e structs, interfaces e generics, funções e closures, slices e
        maps, tratamento de erros no estilo Go (<Text code>errors.Is/As</Text>{' '}
        e <Text code>%w</Text>), concorrência (goroutines, canais,{' '}
        <Text code>sync</Text> e <Text code>context</Text>), I/O, testes e
        ferramentas. Tudo 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Use <Text code>x := ...</Text> dentro de funções e{' '}
        <Text code>var</Text> fora; nomes exportados começam com maiúscula.
        Interfaces são satisfeitas implicitamente — não é preciso declarar
        que um tipo implementa uma interface. Sempre cheque{' '}
        <Text code>err != nil</Text> e, ao propagar, use{' '}
        <Text code>%w</Text> com <Text code>errors.Is/As</Text> para
        preservar a cadeia. Rode <Text code>gofmt</Text>,{' '}
        <Text code>go vet</Text> e o race detector ({' '}
        <Text code>go test -race</Text>) no fluxo. Cuidado com data races:
        não compartilhe slices/maps entre goroutines sem sincronização.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'Go Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Go language — <Text code>go</Text>{' '}
        commands (build, mod, test, vet), syntax basics, types and structs,
        interfaces and generics, functions and closures, slices and maps,
        Go-style error handling (<Text code>errors.Is/As</Text> and{' '}
        <Text code>%w</Text>), concurrency (goroutines, channels,{' '}
        <Text code>sync</Text> and <Text code>context</Text>), I/O, testing
        and tooling. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Prefer <Text code>x := ...</Text> inside functions and{' '}
        <Text code>var</Text> outside; exported names start with an uppercase
        letter. Interfaces are satisfied implicitly — you never declare that
        a type implements one. Always check <Text code>err != nil</Text> and,
        when propagating, use <Text code>%w</Text> with{' '}
        <Text code>errors.Is/As</Text> to keep the chain. Make{' '}
        <Text code>gofmt</Text>, <Text code>go vet</Text> and the race
        detector (<Text code>go test -race</Text>) part of your workflow.
        Beware data races: do not share slices/maps across goroutines
        without synchronization.
      </>
    ),
    search: 'Search a command or description...',
    all: 'All',
    empty: 'No commands found. Try another search or category.',
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function GoCheatsheetPage() {
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
      `| \`${c.cmd.replace(/\\|/g, '\\\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\\|/g, '\\\\|')} |`
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