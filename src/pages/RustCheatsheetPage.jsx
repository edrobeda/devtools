import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cargo',
  'basics',
  'ownership',
  'types',
  'traits',
  'structs',
  'collections',
  'errors',
  'concurrency',
  'io',
  'testing',
  'tooling',
]

const CATEGORY_COLOR = {
  cargo: 'geekblue',
  basics: 'blue',
  ownership: 'gold',
  types: 'purple',
  traits: 'magenta',
  structs: 'cyan',
  collections: 'green',
  errors: 'red',
  concurrency: 'volcano',
  io: 'orange',
  testing: 'lime',
  tooling: 'geekblue',
}

const labelOf = {
  cargo: { pt: 'CLI do Cargo (comandos)', en: 'Cargo CLI (commands)' },
  basics: { pt: 'Básicos da linguagem', en: 'Language basics' },
  ownership: { pt: 'Ownership, borrowing & lifetimes', en: 'Ownership, borrowing & lifetimes' },
  types: { pt: 'Tipos, enums & pattern matching', en: 'Types, enums & pattern matching' },
  traits: { pt: 'Traits & generics', en: 'Traits & generics' },
  structs: { pt: 'Structs & métodos', en: 'Structs & methods' },
  collections: { pt: 'Coleções & iterators', en: 'Collections & iterators' },
  errors: { pt: 'Tratamento de erros', en: 'Error handling' },
  concurrency: { pt: 'Concorrência & async', en: 'Concurrency & async' },
  io: { pt: 'I/O, strings & conversões', en: 'I/O, strings & conversions' },
  testing: { pt: 'Testes & benchmarks', en: 'Testing & benchmarks' },
  tooling: { pt: 'Ferramentas & dicas', en: 'Tooling & tips' },
}

const COMMANDS = [
  // ─── CLI do Cargo ────────────────────────────────────────────────────────
  { cmd: 'cargo new app', cat: 'cargo', pt: 'Cria um novo crate binário em app/', en: 'Creates a new binary crate in app/' },
  { cmd: 'cargo new --lib mylib', cat: 'cargo', pt: 'Cria um crate de biblioteca (src/lib.rs)', en: 'Creates a library crate (src/lib.rs)' },
  { cmd: 'cargo init', cat: 'cargo', pt: 'Inicializa um crate no diretório atual', en: 'Initializes a crate in the current directory' },
  { cmd: 'cargo build', cat: 'cargo', pt: 'Compila em modo dev (target/debug/)', en: 'Compiles in dev mode (target/debug/)' },
  { cmd: 'cargo build --release', cat: 'cargo', pt: 'Compila com otimizações (target/release/)', en: 'Compiles with optimizations (target/release/)' },
  { cmd: 'cargo check', cat: 'cargo', pt: 'Type-check rápido, sem gerar binário', en: 'Fast type-check without emitting a binary' },
  { cmd: 'cargo run', cat: 'cargo', pt: 'Compila e executa o binário', en: 'Builds and runs the binary' },
  { cmd: 'cargo run -- --flag valor', cat: 'cargo', pt: 'Passa argumentos para o programa (após o --)', en: 'Passes arguments to the program (after --)' },
  { cmd: 'cargo test', cat: 'cargo', pt: 'Roda testes unitários, de integração e doc', en: 'Runs unit, integration and doc tests' },
  { cmd: 'cargo test modulo::teste', cat: 'cargo', pt: 'Só os testes que casam com caminho/nome', en: 'Only tests matching the path/name' },
  { cmd: 'cargo fmt', cat: 'cargo', pt: 'Formata todo o código com rustfmt', en: 'Formats all the code with rustfmt' },
  { cmd: 'cargo fmt --check', cat: 'cargo', pt: 'Só verifica se já está formatado (CI)', en: 'Only checks formatting is clean (CI)' },
  { cmd: 'cargo clippy', cat: 'cargo', pt: 'Linter oficial com dicas idiomáticas', en: 'Official linter with idiomatic hints' },
  { cmd: 'cargo clippy -- -W clippy::pedantic', cat: 'cargo', pt: 'Ativa os lints mais rigorosos', en: 'Enables the stricter (pedantic) lints' },
  { cmd: 'cargo add serde --features derive', cat: 'cargo', pt: 'Adiciona uma dependência ao Cargo.toml', en: 'Adds a dependency to Cargo.toml' },
  { cmd: 'cargo doc --open', cat: 'cargo', pt: 'Gera e abre a documentação (rustdoc)', en: 'Builds and opens the docs (rustdoc)' },
  { cmd: 'cargo tree', cat: 'cargo', pt: 'Mostra a árvore de dependências', en: 'Shows the dependency tree' },
  { cmd: 'cargo install ripgrep', cat: 'cargo', pt: 'Instala um binário publicado no crates.io', en: 'Installs a binary published to crates.io' },
  { cmd: 'cargo update', cat: 'cargo', pt: 'Atualiza dependências dentro do semver', en: 'Updates dependencies within semver' },
  { cmd: 'RUST_LOG=debug cargo run', cat: 'cargo', pt: 'Ativa os logs de env_logger/tracing no app', en: 'Enables env_logger/tracing logs in the app' },
  { cmd: 'cargo +nightly run', cat: 'cargo', pt: 'Usa a toolchain nightly só para esta execução', en: 'Uses the nightly toolchain just for this run' },

  // ─── Básicos ─────────────────────────────────────────────────────────────
  { cmd: 'fn main() { }', cat: 'basics', pt: 'Ponto de entrada do programa', en: 'Program entry point' },
  { cmd: '// linha  e  /* bloco */', cat: 'basics', pt: 'Comentários de linha e de bloco', en: 'Line and block comments' },
  { cmd: 'let x = 42;', cat: 'basics', pt: 'Vinculação imutável — o padrão em Rust', en: 'Immutable binding — the Rust default' },
  { cmd: 'let mut y = 42; y += 1;', cat: 'basics', pt: 'Vinculação mutável (único jeito de alterar)', en: 'Mutable binding (the only way to change it)' },
  { cmd: 'const MAX: u32 = 10_000;', cat: 'basics', pt: 'Constante avaliada em tempo de compilação', en: 'Compile-time constant' },
  { cmd: 'let x: u32 = 5;', cat: 'basics', pt: 'Anotação explícita de tipo', en: 'Explicit type annotation' },
  { cmd: 'let msg = format!("oi {}", nome);', cat: 'basics', pt: 'Concatenação formatada (não dá pra somar &str)', en: 'Formatted concatenation (you cannot add &str)' },
  { cmd: '{ let a = 2; a * 2 }', cat: 'basics', pt: 'Bloco como expressão — devolve o valor', en: 'Block as an expression — yields a value' },
  { cmd: 'fn soma(a: i32, b: i32) -> i32 { a + b }', cat: 'basics', pt: 'Última expressão é o retorno (sem return)', en: 'The last expression is the return (no return)' },
  { cmd: 'loop { break; }', cat: 'basics', pt: 'Loop infinito (break/continue)', en: 'Infinite loop (break/continue)' },
  { cmd: 'while n > 0 { n -= 1; }', cat: 'basics', pt: 'Loop com condição', en: 'Loop with a condition' },
  { cmd: 'for i in 0..5 { }', cat: 'basics', pt: 'Itera um range (exclusivo no fim)', en: 'Iterates a range (end-exclusive)' },
  { cmd: 'for (i, v) in xs.iter().enumerate() { }', cat: 'basics', pt: 'Itera com índice e valor ao mesmo tempo', en: 'Iterates with index and value at once' },
  { cmd: 'println!("{}", x);', cat: 'basics', pt: 'Imprime com quebra de linha', en: 'Prints with a newline' },
  { cmd: 'eprintln!("erro: {}", e);', cat: 'basics', pt: 'Imprime em stderr', en: 'Prints to stderr' },
  { cmd: 'dbg!(&x);', cat: 'basics', pt: 'Imprime arquivo/linha + valor em stderr', en: 'Prints file/line + value to stderr' },
  { cmd: '_', cat: 'basics', pt: 'Ignora um valor (ex.: let _ = f();)', en: 'Ignores a value (e.g. let _ = f();)' },

  // ─── Ownership, borrowing & lifetimes ────────────────────────────────────
  { cmd: 'let s = String::from("oi"); let t = s;', cat: 'ownership', pt: 'Move: o valor muda de dono — s fica inválido', en: 'Move: the value changes owner — s becomes invalid' },
  { cmd: 'let t = s.clone();', cat: 'ownership', pt: 'Cópia profunda quando precisa dos dois (cara)', en: 'Deep copy when you need both (expensive)' },
  { cmd: 'let a = 5; let b = a;', cat: 'ownership', pt: 'Tipos Copy (int, float, bool, char) copiam sozinhos', en: 'Copy types (int, float, bool, char) copy on their own' },
  { cmd: 'fn f(s: &String) { }', cat: 'ownership', pt: 'Empréstimo imutável — só lê o valor', en: 'Immutable borrow — read-only access' },
  { cmd: 'fn f(s: &mut String) { }', cat: 'ownership', pt: 'Empréstimo mutável — pode alterar o valor', en: 'Mutable borrow — can mutate the value' },
  { cmd: '1 mutável OU vários imutáveis', cat: 'ownership', pt: 'Regra de ouro do borrow checker: nunca os dois ao mesmo tempo', en: 'Borrow checker golden rule: never both at once' },
  { cmd: "fn foo<'a>(x: &'a str, y: &'a str) -> &'a str", cat: 'ownership', pt: 'Lifetime: amarra o retorno ao input de menor vida', en: 'Lifetime: ties the return to the shorter-lived input' },
  { cmd: "struct Pedido<'a> { nome: &'a str }", cat: 'ownership', pt: 'Struct pode guardar referências (com lifetime)', en: 'A struct can hold references (with a lifetime)' },
  { cmd: 'Rc::new(..) + Rc::clone(&rc)', cat: 'ownership', pt: 'Contagem de referência single-thread', en: 'Single-threaded reference counting' },
  { cmd: 'Arc::new(..) + Mutex::new(..)', cat: 'ownership', pt: 'Compartilhar entre threads: Arc<Mutex<T>>', en: 'Sharing across threads: Arc<Mutex<T>>' },
  { cmd: 'RefCell<T>', cat: 'ownership', pt: 'Mutabilidade interior; empréstimos checados em runtime', en: 'Interior mutability; borrows checked at runtime' },
  { cmd: 'fn len(s: &str) -> usize { s.len() }', cat: 'ownership', pt: 'Parâmetro &str aceita tanto &str quanto &String', en: 'A &str param accepts both &str and &String' },
  { cmd: 'let x = s.trim();', cat: 'ownership', pt: 'Referências não movem o valor — pode reutilizar s depois', en: 'Borrowing does not move the value — reuse s later' },

  // ─── Tipos, enums & pattern matching ─────────────────────────────────────
  { cmd: 'i8..i128, u8..u128, f32, f64, bool, char', cat: 'types', pt: 'Inteiros, floats, bool e char (char é 4 bytes)', en: 'Integers, floats, bool and char (char is 4 bytes)' },
  { cmd: 'usize / isize', cat: 'types', pt: 'Inteiro do tamanho do ponteiro (usado em índices)', en: 'Pointer-sized integer (used for indexing)' },
  { cmd: 'let t = (1, "a", true); t.0', cat: 'types', pt: 'Tupla com acesso por índice', en: 'Tuple accessed by index' },
  { cmd: 'let (a, b) = (1, 2);', cat: 'types', pt: 'Desestruturação de tupla', en: 'Tuple destructuring' },
  { cmd: 'let a = [1, 2, 3];', cat: 'types', pt: 'Array de tamanho fixo em stack', en: 'Fixed-size array on the stack' },
  { cmd: 'let v = &a[1..];', cat: 'types', pt: 'Slice: visão com tamanho dinâmico', en: 'Slice: a dynamically sized view' },
  { cmd: '5u32', cat: 'types', pt: 'Literal com sufixo de tipo embutido', en: 'Literal with a type suffix' },
  { cmd: 'x as u8', cat: 'types', pt: 'Cast explícito entre numéricos (pode truncar)', en: 'Explicit numeric cast (may truncate)' },
  {
    cmd: 'enum IpAddr {\n    V4(u8, u8, u8, u8),\n    V6(String),\n}',
    cat: 'types',
    pt: 'Enum pode carregar dados em cada variante',
    en: 'An enum can carry data on each variant',
  },
  { cmd: 'match x { Some(v) => v, _ => 0 }', cat: 'types', pt: 'Match é exaustivo — cubra todas as variantes', en: 'Match is exhaustive — cover every variant' },
  { cmd: 'match n { 0 => "zero", 1..=9 => "baixo", _ => "alto" }', cat: 'types', pt: 'Padrões com ranges e catch-all (_)', en: 'Patterns with ranges and a catch-all (_)' },
  { cmd: 'if let Some(v) = opt { } else { }', cat: 'types', pt: 'Caso único de match sem exaustividade', en: 'Single-case match without exhaustiveness' },
  { cmd: 'while let Some(v) = iter.next() { }', cat: 'types', pt: 'Loop enquanto o padrão casar', en: 'Loops while the pattern matches' },
  { cmd: 'let Some(v) = opt else { return };', cat: 'types', pt: 'let-else: sai cedo se o padrão não casar', en: 'let-else: early exit when the pattern fails' },
  { cmd: 'u8::MAX, i64::MIN', cat: 'types', pt: 'Constantes dos tipos numéricos', en: 'Numeric type constants' },
  { cmd: 'Option<T>', cat: 'types', pt: 'Presença/ausência de valor (None/Some)', en: 'Value presence (None/Some)' },
  { cmd: 'Result<T, E>', cat: 'types', pt: 'Sucesso ou erro (Ok/Err)', en: 'Success or error (Ok/Err)' },

  // ─── Traits & generics ───────────────────────────────────────────────────
  { cmd: 'trait Greet {\n    fn greet(&self) -> String;\n}', cat: 'traits', pt: 'Define um trait — contrato de métodos', en: 'Defines a trait — a method contract' },
  {
    cmd: 'impl Greet for Usuario {\n    fn greet(&self) -> String {\n        format!("oi {}", self.nome)\n    }\n}',
    cat: 'traits',
    pt: 'Implementa o trait para um tipo',
    en: 'Implements the trait for a type',
  },
  { cmd: 'fn f<T: Greet>(x: T) { }', cat: 'traits', pt: 'Generics com trait bound inline', en: 'Generics with an inline trait bound' },
  { cmd: 'fn f<T>(x: T) where T: Greet { }', cat: 'traits', pt: 'Mesmo com where — melhor com vários bounds', en: 'Same via where — better with several bounds' },
  { cmd: 'fn nova() -> impl Greet { }', cat: 'traits', pt: 'Retorna um tipo que implementa o trait (estático)', en: 'Returns a type implementing the trait (static)' },
  { cmd: 'let g: Box<dyn Greet> = Box::new(u);', cat: 'traits', pt: 'Trait object — dispatch dinâmico', en: 'Trait object — dynamic dispatch' },
  { cmd: 'trait TemNome {\n    fn nome(&self) -> &str { "anônimo" }\n}', cat: 'traits', pt: 'Método default que pode ser sobrescrito', en: 'Default method that can be overridden' },
  { cmd: '#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]', cat: 'traits', pt: 'Deriva implementações comuns automaticamente', en: 'Automatically derives common implementations' },
  { cmd: 'impl<T> Greet for Vec<T> where T: std::fmt::Debug { }', cat: 'traits', pt: 'Impl genérica condicionada', en: 'Conditional generic implementation' },
  { cmd: 'x.to_string()', cat: 'traits', pt: 'Exige o trait Display (ou ToString derivado de Display)', en: 'Requires Display (or ToString derived from it)' },
  { cmd: 'println!("{:?}", x)', cat: 'traits', pt: 'Precisa do trait Debug; {:?} é o format spec', en: 'Requires the Debug trait; {:?} is the format spec' },
  { cmd: 'impl From<&str> for Id { }', cat: 'traits', pt: 'Conversões com From/Into e TryFrom/TryInto', en: 'Conversions with From/Into and TryFrom/TryInto' },

  // ─── Structs & métodos ───────────────────────────────────────────────────
  { cmd: 'struct Usuario {\n    nome: String,\n    idade: u8,\n}', cat: 'structs', pt: 'Define um struct com campos', en: 'Defines a struct with fields' },
  { cmd: 'let u = Usuario { nome: String::from("Ana"), idade: 30 };', cat: 'structs', pt: 'Instancia com campos nomeados', en: 'Instantiates with named fields' },
  { cmd: 'let u2 = Usuario { idade: 31, ..u };', cat: 'structs', pt: 'Struct update: reaproveita o resto do outro', en: 'Struct update: reuses the rest from the other' },
  { cmd: 'struct Cor(u8, u8, u8);', cat: 'structs', pt: 'Tuple struct — campos por posição', en: 'Tuple struct — positional fields' },
  { cmd: 'struct Marker;', cat: 'structs', pt: 'Unit struct (usada como marcador)', en: 'Unit struct (used as a marker)' },
  { cmd: 'impl Usuario {\n    fn nome(&self) -> &str { &self.nome }\n}', cat: 'structs', pt: 'Método: recebe &self (só lê)', en: 'Method: takes &self (read-only)' },
  { cmd: 'fn atualizar(&mut self, i: u8) { self.idade = i; }', cat: 'structs', pt: 'Método mutável com &mut self', en: 'Mutable method with &mut self' },
  { cmd: 'Usuario::novo("Ana", 30)', cat: 'structs', pt: 'Associated function (sem self) — construtor', en: 'Associated function (no self) — constructor' },
  { cmd: 'u.nome().trim().to_lowercase()', cat: 'structs', pt: 'Method chaining funciona como esperado', en: 'Method chaining works as expected' },

  // ─── Coleções & iterators ────────────────────────────────────────────────
  { cmd: 'Vec::new()  e  vec![1, 2, 3]', cat: 'collections', pt: 'Vetor dinâmico — a lista padrão', en: 'Dynamic array — the default list' },
  { cmd: 'v.push(4);', cat: 'collections', pt: 'Adiciona no fim', en: 'Appends at the end' },
  { cmd: 'let ultimo = v.pop();', cat: 'collections', pt: 'Remove do fim (devolve Option)', en: 'Removes from the end (returns Option)' },
  { cmd: 'v[0]', cat: 'collections', pt: 'Indexação direta — panica se estiver fora do range', en: 'Direct indexing — panics when out of range' },
  { cmd: 'match v.get(3) { Some(x) => x, None => &0 }', cat: 'collections', pt: 'Acesso seguro (Option) — não panica', en: 'Safe access (Option) — does not panic' },
  { cmd: 'v.len()  e  v.is_empty()', cat: 'collections', pt: 'Tamanho e se está vazio', en: 'Length and emptiness' },
  { cmd: 'v.iter().map(|x| x * 2).collect::<Vec<_>>()', cat: 'collections', pt: 'Iterator: map -> collect', en: 'Iterator: map -> collect' },
  { cmd: 'v.iter().filter(|x| **x > 2)', cat: 'collections', pt: 'Filtro (repare no deref duplo do fecho)', en: 'Filter (mind the double deref in the closure)' },
  { cmd: 'v.iter().fold(0, |acc, x| acc + x)', cat: 'collections', pt: 'Acumula; v.iter().sum() também existe', en: 'Accumulates; v.iter().sum() exists too' },
  { cmd: 'v.iter().any(|x| x % 2 == 0)', cat: 'collections', pt: 'Algum atende? (any / all)', en: 'Does any satisfy? (any / all)' },
  { cmd: 'v.iter().take(3).skip(1).rev()', cat: 'collections', pt: 'Pipeline de iteração: take/skip/rev', en: 'Iteration pipeline: take/skip/rev' },
  { cmd: 'let mut m = HashMap::new();', cat: 'collections', pt: 'Map — importe de std::collections', en: 'Map — import from std::collections' },
  { cmd: 'm.insert("k", 1);  e  m.get(&"k")', cat: 'collections', pt: 'Insere e lê (get devolve Option<&V>)', en: 'Inserts and reads (get returns Option<&V>)' },
  { cmd: 'let e = m.entry("k").or_insert(0); *e += 1;', cat: 'collections', pt: 'Insere se ausente e atualiza no lugar', en: 'Insert-if-absent and update in place' },
  { cmd: 'let mut set = HashSet::new(); set.insert(1);', cat: 'collections', pt: 'Conjunto sem duplicatas', en: 'Set without duplicates' },
  { cmd: 's.chars().count()  vs  s.len()', cat: 'collections', pt: 'Número de chars vs número de bytes', en: 'Char count vs byte count' },
  { cmd: 'for c in "abc".chars() { s.push(c); }', cat: 'collections', pt: 'Adiciona cada char de outra string', en: 'Appends each char from another string' },
  { cmd: 'format!("{a}-{b}", a = 1, b = 2)', cat: 'collections', pt: 'Constrói uma String sem mutar nada', en: 'Builds a String without mutating anything' },

  // ─── Tratamento de erros ─────────────────────────────────────────────────
  { cmd: 'fn f() -> Result<T, E> { }', cat: 'errors', pt: 'Função que pode falhar devolve Result', en: 'Fallible functions return Result' },
  { cmd: '?', cat: 'errors', pt: 'Propaga o erro se houver (exige Result/Option na função)', en: 'Propagates the error if any (needs Result/Option return)' },
  { cmd: 'if let Err(e) = op() { return Err(e); }', cat: 'errors', pt: 'Equivalente manual do operador ?', en: 'Manual equivalent of the ? operator' },
  { cmd: 'x.ok()  /  Ok(v).ok_or("msg")', cat: 'errors', pt: 'Conversões entre Option e Result', en: 'Conversions between Option and Result' },
  { cmd: 'opt.expect("msg")', cat: 'errors', pt: 'Panica com mensagem se for None/Err', en: 'Panics with a message when None/Err' },
  { cmd: 'opt.unwrap_or(0)  /  unwrap_or_else(|| f())', cat: 'errors', pt: 'Defaults sem panic', en: 'Panic-free defaults' },
  { cmd: 'res.map_err(|e| MyError::from(e))', cat: 'errors', pt: 'Converte o tipo do erro', en: 'Maps the error type' },
  { cmd: 'res.and_then(|v| outra_que_falha(v))', cat: 'errors', pt: 'Encadeia operações que podem falhar', en: 'Chains fallible operations' },
  { cmd: 'panic!("estado irrecuperável")', cat: 'errors', pt: 'Aborta com stack trace — só casos irrecuperáveis', en: 'Aborts with a stack trace — unrecoverable only' },
  {
    cmd: '#[derive(Debug)]\nstruct MyErr;\n\nimpl std::fmt::Display for MyErr { ... }\nimpl std::error::Error for MyErr {}',
    cat: 'errors',
    pt: 'Erro customizado = enum/struct + Display + Error',
    en: 'Custom error = enum/struct + Display + Error',
  },
  { cmd: 'thiserror / anyhow', cat: 'errors', pt: 'Crates populares: derive de erro e contexto fácil', en: 'Popular crates: error derive and easy context' },
  { cmd: 'fn main() -> Result<(), Box<dyn std::error::Error>> { }', cat: 'errors', pt: 'main pode devolver Result e usar ? direto', en: 'main can return Result and use ? directly' },

  // ─── Concorrência & async ────────────────────────────────────────────────
  { cmd: 'thread::spawn(move || { 42 })', cat: 'concurrency', pt: 'Roda um closure em outra thread (move captura)', en: 'Runs a closure on another thread (move captures)' },
  { cmd: 'let h = thread::spawn(...); h.join().unwrap();', cat: 'concurrency', pt: 'Espera a thread e devolve o valor', en: 'Waits for the thread and returns the value' },
  { cmd: 'let (tx, rx) = std::sync::mpsc::channel();', cat: 'concurrency', pt: 'Canal mpsc: vários produtores, um consumidor', en: 'mpsc channel: many producers, one consumer' },
  { cmd: 'tx.send(v)', cat: 'concurrency', pt: 'Envia (Result — falha se o receiver caiu)', en: 'Sends (Result — fails if the receiver is gone)' },
  { cmd: 'rx.recv()  /  rx.try_recv()', cat: 'concurrency', pt: 'Recebe bloqueando ou sem bloquear', en: 'Receives blocking or non-blocking' },
  { cmd: 'let tx2 = tx.clone();', cat: 'concurrency', pt: 'Clona o remetente para mais produtores', en: 'Clones the sender for more producers' },
  { cmd: 'let c = Arc::new(Mutex::new(0));', cat: 'concurrency', pt: 'Estado compartilhado entre threads começa aqui', en: 'Shared state across threads starts here' },
  { cmd: '*c.lock().unwrap() += 1;', cat: 'concurrency', pt: 'Trava, acessa e destrava (guard no fim do escopo)', en: 'Locks, accesses, and unlocks (guard at scope end)' },
  { cmd: 'AtomicUsize::new(0); v.fetch_add(1, Ordering::SeqCst);', cat: 'concurrency', pt: 'Atômicos sem mutex (std::sync::atomic)', en: 'Atomics without a mutex (std::sync::atomic)' },
  { cmd: '#[tokio::main]\nasync fn main() { }', cat: 'concurrency', pt: 'Runtime async (tokio) para I/O concorrente', en: 'Async runtime (tokio) for concurrent I/O' },
  { cmd: 'let r = fut.await;', cat: 'concurrency', pt: 'Pausa e retoma quando a future resolver', en: 'Yields until the future resolves' },
  { cmd: 'tokio::spawn(async move { })', cat: 'concurrency', pt: 'Tarefas fire-and-forget no runtime', en: 'Fire-and-forget tasks on the runtime' },
  { cmd: 'Send / Sync', cat: 'concurrency', pt: 'Marker traits: seguro mover/compartilhar entre threads', en: 'Marker traits: safe to move/share across threads' },

  // ─── I/O, strings & conversões ───────────────────────────────────────────
  { cmd: 'let c = std::fs::read_to_string("a.txt")?;', cat: 'io', pt: 'Lê o arquivo inteiro como String', en: 'Reads the whole file as a String' },
  { cmd: 'std::fs::write("b.txt", conteudo)?', cat: 'io', pt: 'Escreve o arquivo (String ou &[u8])', en: 'Writes the file (String or &[u8])' },
  { cmd: 'let bytes = std::fs::read("b.bin")?;', cat: 'io', pt: 'Lê o arquivo como Vec<u8>', en: 'Reads the file as Vec<u8>' },
  { cmd: 'for l in BufReader::new(file).lines() { }', cat: 'io', pt: 'Processa linha a linha (use std::io::BufRead)', en: 'Processes line by line (use std::io::BufRead)' },
  { cmd: 'for e in std::fs::read_dir(".")? { }', cat: 'io', pt: 'Lista um diretório', en: 'Lists a directory' },
  { cmd: 'std::io::stdin().read_line(&mut line)?;', cat: 'io', pt: 'Lê uma linha do stdin', en: 'Reads a line from stdin' },
  { cmd: 'for arg in std::env::args() { }', cat: 'io', pt: 'Argumentos da linha de comando', en: 'Command-line arguments' },
  { cmd: 'std::env::var("HOME")', cat: 'io', pt: 'Lê uma variável de ambiente (Result)', en: 'Reads an env var (Result)' },
  { cmd: 's.trim()', cat: 'io', pt: 'Remove espaços e quebras das pontas', en: 'Trims whitespace from both ends' },
  { cmd: "s.split(\",\")  /  s.split_whitespace()", cat: 'io', pt: 'Divide a string em partes (iterator)', en: 'Splits the string into parts (iterator)' },
  { cmd: 'partes.join("-")', cat: 'io', pt: 'Junta um iterator de &str em uma String', en: 'Joins an iterator of &str into one String' },
  { cmd: 's.contains("x") / starts_with / replace("a", "b")', cat: 'io', pt: 'Busca e substituição', en: 'Search and replace' },
  { cmd: '"10".parse::<i32>()', cat: 'io', pt: 'String para número (sempre Result)', en: 'String to number (always Result)' },
  { cmd: 'n.to_string()', cat: 'io', pt: 'Número para String (via Display)', en: 'Number to String (via Display)' },
  { cmd: 'String::from("a")  /  "a".to_string()', cat: 'io', pt: '&str para String', en: '&str to String' },
  { cmd: 's.as_str()  /  &s[..]', cat: 'io', pt: 'String para &str', en: 'String to &str' },

  // ─── Testes & benchmarks ─────────────────────────────────────────────────
  { cmd: '#[test]\nfn it_works() { assert_eq!(2 + 2, 4); }', cat: 'testing', pt: 'Teste unitário simples (arquivo *_test.rs)', en: 'Simple unit test (file *_test.rs)' },
  {
    cmd: '#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[test]\n    fn ok() { /* ... */ }\n}',
    cat: 'testing',
    pt: 'Módulo de testes compilado só no cargo test',
    en: 'Test module compiled only under cargo test',
  },
  { cmd: 'assert!(cond, "msg"); assert_eq!(a, b); assert_ne!(a, b);', cat: 'testing', pt: 'Assertions (mensagem opcional)', en: 'Assertions (optional message)' },
  { cmd: '#[should_panic(expected = "index")]', cat: 'testing', pt: 'Espera um panic durante o teste', en: 'Expects a panic during the test' },
  { cmd: '#[ignore = "flaky"]', cat: 'testing', pt: 'Pula por padrão; rode com cargo test -- --ignored', en: 'Skipped by default; run with -- --ignored' },
  { cmd: 'cargo test -- --nocapture', cat: 'testing', pt: 'Mostra o println! no output dos testes', en: 'Shows println! in test output' },
  { cmd: 'cargo test -- --test-threads=1', cat: 'testing', pt: 'Roda os testes em série', en: 'Runs tests serially' },
  { cmd: 'tests/ (pasta na raiz)', cat: 'testing', pt: 'Testes de integração usam só a API pública', en: 'Integration tests use the public API only' },
  { cmd: 'criterion (crate)', cat: 'testing', pt: 'Benchmarks estáveis e com estatística', en: 'Stable benchmarks with statistics' },

  // ─── Ferramentas & dicas ─────────────────────────────────────────────────
  { cmd: 'rustup update', cat: 'tooling', pt: 'Atualiza as toolchains do Rust', en: 'Updates Rust toolchains' },
  { cmd: 'rustup component add clippy rustfmt', cat: 'tooling', pt: 'Instala o linter e o formatador oficial', en: 'Installs the official linter and formatter' },
  { cmd: 'rustup target add wasm32-unknown-unknown', cat: 'tooling', pt: 'Adiciona um target de compilação', en: 'Adds a build target' },
  { cmd: 'rustc --version  /  cargo --version', cat: 'tooling', pt: 'Versão do compilador e do gerenciador', en: 'Compiler and manager versions' },
  { cmd: 'rust-analyzer', cat: 'tooling', pt: 'LSP oficial — usado pelo VSCode/Neovim', en: 'The official LSP — used by VSCode/Neovim' },
  { cmd: '#![no_std]', cat: 'tooling', pt: 'Crate para bare metal / embarcado', en: 'Crate for bare-metal / embedded' },
  { cmd: '[workspace]\nmembers = ["crates/*"]\nresolver = "2"', cat: 'tooling', pt: 'Workspace com vários crates num repo', en: 'Workspace with several crates in one repo' },
  { cmd: '[dev-dependencies]\ncriterion = "0.5"', cat: 'tooling', pt: 'Dependências só para testes/bench', en: 'Test/bench-only dependencies' },
  { cmd: 'let x = 5; let x = x + 1;', cat: 'tooling', pt: 'Shadowing: nova variável com o mesmo nome', en: 'Shadowing: a new variable with the same name' },
  { cmd: 'mod somemod;', cat: 'tooling', pt: 'Declara um módulo em somemod.rs', en: 'Declares a module in somemod.rs' },
  { cmd: 'cargo watch -x test', cat: 'tooling', pt: 'Roda o comando a cada save (cargo-watch)', en: 'Runs the command on every save (cargo-watch)' },
  { cmd: 'cargo expand', cat: 'tooling', pt: 'Mostra o código após os macros (cargo-expand)', en: 'Shows the code after macros (cargo-expand)' },
  { cmd: 'cargo audit', cat: 'tooling', pt: 'Audita dependências por CVEs (cargo-audit)', en: 'Audits dependencies for CVEs (cargo-audit)' },
  { cmd: 'cargo bloat --release', cat: 'tooling', pt: 'Mostra o que infla o binário (cargo-bloat)', en: 'Shows what bloats the binary (cargo-bloat)' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Rust',
    intro: (
      <>
        Referência pesquisável da linguagem Rust — comandos do{' '}
        <Text code>cargo</Text> (new, build, test, clippy, fmt), basics da
        sintaxe, ownership &amp; borrowing (o borrow checker), types, enums e{' '}
        <Text code>match</Text>, traits &amp; generics, structs, coleções e
        iterators, tratamento de erros com <Text code>Result</Text>/{' '}
        <Text code>Option</Text> e o operador <Text code>?</Text>,
        concorrência (threads, canais, <Text code>Arc</Text>/<Text code>Mutex</Text>{' '}
        e async com tokio), I/O, testes e ferramentas (rustup,
        rust-analyzer, workspaces). Tudo 100% client-side (só texto de
        referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Use <Text code>let mut</Text> só quando for mutar — imutabilidade é o
        padrão. O compilador é seu amigo: siga as sugestões do borrow
        checker. O operador <Text code>?</Text> só funciona em funções que
        devolvem <Text code>Result</Text>/<Text code>Option</Text>. Prefira{' '}
        <Text code>&amp;str</Text> nos parâmetros para também aceitar{' '}
        <Text code>&amp;String</Text>. Rode <Text code>cargo fmt</Text> e{' '}
        <Text code>cargo clippy</Text> antes de commitar. Para compartilhar
        estado, use <Text code>Rc</Text>/<Text code>RefCell</Text> em
        single-thread e <Text code>Arc</Text>/<Text code>Mutex</Text> entre
        threads.
      </>
    ),
    search: 'Buscar comando, snippet ou descrição...',
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
    title: 'Rust Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Rust language —{' '}
        <Text code>cargo</Text> commands (new, build, test, clippy, fmt),
        syntax basics, ownership &amp; borrowing (the borrow checker),
        types, enums and <Text code>match</Text>, traits &amp; generics,
        structs, collections and iterators, error handling with{' '}
        <Text code>Result</Text>/<Text code>Option</Text> and the{' '}
        <Text code>?</Text> operator, concurrency (threads, channels,{' '}
        <Text code>Arc</Text>/<Text code>Mutex</Text> and async with tokio),
        I/O, testing and tooling (rustup, rust-analyzer, workspaces). 100%
        client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Use <Text code>let mut</Text> only when mutating — immutability is the
        default. The compiler is your friend: follow the borrow checker
        suggestions. The <Text code>?</Text> operator only works in
        functions returning <Text code>Result</Text>/
        <Text code>Option</Text>. Prefer <Text code>&amp;str</Text> params so
        they also accept <Text code>&amp;String</Text>. Run{' '}
        <Text code>cargo fmt</Text> and <Text code>cargo clippy</Text> before
        committing. For shared state use <Text code>Rc</Text>/
        <Text code>RefCell</Text> single-threaded and{' '}
        <Text code>Arc</Text>/<Text code>Mutex</Text> across threads.
      </>
    ),
    search: 'Search a command, snippet or description...',
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

export default function RustCheatsheetPage() {
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
                <Space wrap style={{ rowGap: 6, alignItems: 'flex-start' }}>
                  {item.cmd.includes('\n') ? (
                    <pre
                      style={{
                        margin: 0,
                        fontSize: 12,
                        lineHeight: 1.5,
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        maxWidth: '100%',
                        overflow: 'auto',
                      }}
                    >
                      <code>{item.cmd}</code>
                    </pre>
                  ) : (
                    <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  )}
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
