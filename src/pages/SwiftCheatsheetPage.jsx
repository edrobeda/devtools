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
  'collections',
  'control',
  'funcs',
  'oop',
  'generics',
  'errors',
  'concurrency',
  'swiftui',
  'data',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  basics: 'blue',
  types: 'purple',
  strings: 'magenta',
  collections: 'green',
  control: 'cyan',
  funcs: 'lime',
  oop: 'volcano',
  generics: 'gold',
  errors: 'red',
  concurrency: 'orange',
  swiftui: 'processing',
  data: 'geekblue',
}

const labelOf = {
  cli: { pt: 'CLI & Swift Package Manager', en: 'CLI & Swift Package Manager' },
  basics: { pt: 'Básicos & sintaxe', en: 'Basics & syntax' },
  types: { pt: 'Tipos, optionals & conversão', en: 'Types, optionals & conversion' },
  strings: { pt: 'Strings & caracteres', en: 'Strings & characters' },
  collections: { pt: 'Coleções', en: 'Collections' },
  control: { pt: 'Controle de fluxo', en: 'Control flow' },
  funcs: { pt: 'Funções & closures', en: 'Functions & closures' },
  oop: { pt: 'Structs, classes, enums & protocolos', en: 'Structs, classes, enums & protocols' },
  generics: { pt: 'Generics & extensions', en: 'Generics & extensions' },
  errors: { pt: 'Tratamento de erros', en: 'Error handling' },
  concurrency: { pt: 'Concorrência & async/await', en: 'Concurrency & async/await' },
  swiftui: { pt: 'SwiftUI & UI', en: 'SwiftUI & UI' },
  data: { pt: 'Codable, JSON & arquivos', en: 'Codable, JSON & files' },
}

const COMMANDS = [
  // ─── CLI & Swift Package Manager ─────────────────────────────────────────
  { cmd: 'swift --version', cat: 'cli', pt: 'Versão do toolchain (compilador e runtime)', en: 'Toolchain version (compiler and runtime)' },
  { cmd: 'swiftc main.swift -o app', cat: 'cli', pt: 'Compila um ou mais arquivos em um executável', en: 'Compiles one or more files into an executable' },
  { cmd: 'swiftc -O main.swift -o app', cat: 'cli', pt: 'Compila com otimização (modo release)', en: 'Compiles with optimization (release mode)' },
  { cmd: 'swiftc -typecheck arquivo.swift', cat: 'cli', pt: 'Só checa a tipagem e a sintaxe, sem gerar binário', en: 'Only type-checks and parses, without emitting a binary' },
  { cmd: 'swift main.swift', cat: 'cli', pt: 'Roda um arquivo em modo script (interpretado)', en: 'Runs a file in script mode (interpreted)' },
  { cmd: 'swift repl', cat: 'cli', pt: 'REPL interativo para experimentar expressões', en: 'Interactive REPL for experimenting with expressions' },
  { cmd: 'swift package init --type executable', cat: 'cli', pt: 'Cria um pacote SwiftPM com alvo executável', en: 'Creates a SwiftPM package with an executable target' },
  { cmd: 'swift package init --type library', cat: 'cli', pt: 'Cria um pacote SwiftPM como biblioteca', en: 'Creates a SwiftPM package as a library' },
  { cmd: 'swift build', cat: 'cli', pt: 'Compila o pacote (e as dependências)', en: 'Builds the package (and its dependencies)' },
  { cmd: 'swift run', cat: 'cli', pt: 'Compila e executa o alvo executável do pacote', en: 'Builds and runs the package executable target' },
  { cmd: 'swift test', cat: 'cli', pt: 'Roda a suíte de testes (XCTest ou Testing)', en: 'Runs the test suite (XCTest or Testing)' },
  { cmd: 'swift package resolve', cat: 'cli', pt: 'Baixa e trava as versões das dependências sem atualizar', en: 'Fetches and pins dependency versions without upgrading' },
  { cmd: 'swift package update', cat: 'cli', pt: 'Atualiza as dependências para as versões mais novas permitidas', en: 'Upgrades dependencies to the newest allowed versions' },
  { cmd: 'xcodebuild -scheme App build', cat: 'cli', pt: 'Builda um projeto Xcode pela linha de comando', en: 'Builds an Xcode project from the command line' },
  { cmd: 'xcodebuild test -scheme App', cat: 'cli', pt: 'Roda os testes de um scheme no CI', en: 'Runs the tests of a scheme in CI' },
  { cmd: 'swift-format format -r -i App/Sources', cat: 'cli', pt: 'Formata o código com o formatador oficial', en: 'Formats code with the official formatter' },

  // ─── Básicos & sintaxe ─────────────────────────────────────────────────
  { cmd: 'let nome = "Ana"', cat: 'basics', pt: 'Constante — imutável depois de definida', en: 'Constant — immutable after being set' },
  { cmd: 'var idade = 30', cat: 'basics', pt: 'Variável — pode mudar depois', en: 'Variable — can change later' },
  { cmd: 'let x: Int = 5', cat: 'basics', pt: 'Anotação de tipo explícita (opcional)', en: 'Explicit type annotation (optional)' },
  { cmd: 'let x = Int("7") ?? 0', cat: 'basics', pt: '`??` dá um valor padrão quando vem nil', en: '`??` supplies a default when the value is nil' },
  { cmd: 'print("oi")', cat: 'basics', pt: 'Imprime no console com quebra de linha', en: 'Prints to the console with a newline' },
  { cmd: 'print("Olá, \\(nome)!")', cat: 'basics', pt: 'Interpolação de variáveis dentro da string', en: 'Variable interpolation inside a string' },
  { cmd: '// comentário\n/* bloco\n   de comentário */', cat: 'basics', pt: 'Comentários de linha e de bloco (aninháveis)', en: 'Line and block comments (nestable)' },
  { cmd: 'import Foundation', cat: 'basics', pt: 'Importa um framework — padrão em quase todo arquivo', en: 'Imports a framework — the default in almost every file' },
  { cmd: 'let ponto = (x: 2, y: 3)', cat: 'basics', pt: 'Tupla — agrupa valores; acesse com ponto.x', en: 'Tuple — groups values; access via ponto.x' },
  { cmd: 'let (a, b) = (1, 2)', cat: 'basics', pt: 'Decomposição de tupla em variáveis', en: 'Tuple decomposition into variables' },
  { cmd: 'type(of: x)', cat: 'basics', pt: 'Retorna o tipo dinâmico de um valor em runtime', en: 'Returns the dynamic type of a value at runtime' },
  { cmd: 'let texto = """\nlinha 1\nlinha 2\n"""', cat: 'basics', pt: 'String multilinha — sem precisar escapar quebras', en: 'Multi-line string — no need to escape the line breaks' },
  { cmd: '_ = 5', cat: 'basics', pt: 'O underscore descarta um valor não usado', en: 'The underscore discards an unused value' },

  // ─── Tipos, optionals & conversão ─────────────────────────────────────
  { cmd: 'let i = 42', cat: 'types', pt: 'Int é inferido para literais inteiros', en: 'Int is inferred for integer literals' },
  { cmd: 'let d = 3.14, f = Float(3.14)', cat: 'types', pt: 'Double para decimais por padrão; Float quando pedido', en: 'Double for decimals by default; Float when requested' },
  { cmd: 'let ok = true, let c: Character = "a"', cat: 'types', pt: 'Bool e Character — tipos por valor', en: 'Bool and Character — value types' },
  { cmd: 'Int(3.9)', cat: 'types', pt: 'Converte de Double truncando a parte decimal (3)', en: 'Converts from Double, truncating the decimal part (3)' },
  { cmd: 'Double("3.5")', cat: 'types', pt: 'Parseia de String — retorna Optional (nil se inválido)', en: 'Parses from String — returns an Optional (nil if invalid)' },
  { cmd: 'String(42)', cat: 'types', pt: 'Converte número em string', en: 'Converts a number to a string' },
  { cmd: 'var x: Int? = nil', cat: 'types', pt: 'Optional: Int? pode ter um Int ou nil', en: 'Optional: Int? holds either an Int or nil' },
  { cmd: 'x!', cat: 'types', pt: 'Force unwrap — extrai o valor; crasha se for nil (evite)', en: 'Force unwrap — extracts the value; crashes on nil (avoid)' },
  { cmd: 'if let v = x { ... }', cat: 'types', pt: 'Optional binding — desembrulha com segurança dentro do if', en: 'Optional binding — safely unwraps inside the if' },
  { cmd: 'guard let v = x else { return }', cat: 'types', pt: 'Binding com early return — o padrão pra validar no topo', en: 'Binding with early return — the standard top-of-function pattern' },
  { cmd: 'x ?? 10', cat: 'types', pt: 'Nil coalescing — usa 10 quando x é nil', en: 'Nil coalescing — uses 10 when x is nil' },
  { cmd: 'v as? String', cat: 'types', pt: 'Type cast opcional — devolve optional, não crasha', en: 'Optional type cast — returns an optional, never crashes' },
  { cmd: 'v as! String', cat: 'types', pt: 'Type cast forçado — crasha se o tipo não bater', en: 'Forced type cast — crashes if the type does not match' },
  { cmd: 'typealias ID = String', cat: 'types', pt: 'Alias: dá um nome alternativo a um tipo', en: 'Alias: an alternative name for a type' },
  { cmd: '1...5 / 1..<5', cat: 'types', pt: 'Range inclusive (1–5) e exclusivo (1–4) no fim', en: 'Closed range (1-5) and half-open range (1-4)' },

  // ─── Strings & caracteres ─────────────────────────────────────────────
  { cmd: '"dev".count', cat: 'strings', pt: 'Número de caracteres — conta grafemas Unicode', en: 'Number of characters — counts Unicode graphemes' },
  { cmd: 'str.isEmpty', cat: 'strings', pt: 'É vazia?', en: 'Is it empty?' },
  { cmd: 'str.uppercased()', cat: 'strings', pt: 'Maiúsculas — métodos não mutam a original', en: 'Uppercase — methods do not mutate the original' },
  { cmd: 'str.lowercased()', cat: 'strings', pt: 'Minúsculas', en: 'Lowercase' },
  { cmd: 'str.hasPrefix("dev")', cat: 'strings', pt: 'Começa com o prefixo?', en: 'Starts with the prefix?' },
  { cmd: 'str.hasSuffix("tools")', cat: 'strings', pt: 'Termina com o sufixo?', en: 'Ends with the suffix?' },
  { cmd: 'str.contains("e")', cat: 'strings', pt: 'Contém o caractere ou substring?', en: 'Does it contain the character or substring?' },
  { cmd: 'str.split(separator: ",")', cat: 'strings', pt: 'Divide em partes pelo separador', en: 'Splits into parts by the separator' },
  { cmd: 'str.replacingOccurrences(of: "a", with: "b")', cat: 'strings', pt: 'Substitui todas as ocorrências', en: 'Replaces every occurrence' },
  { cmd: 'str.trimmingCharacters(in: .whitespacesAndNewlines)', cat: 'strings', pt: 'Remove espaços e quebras das pontas', en: 'Trims whitespace and newlines from the ends' },
  { cmd: 'Array(str)', cat: 'strings', pt: 'Array de Character, caractere a caractere', en: 'Array of Characters, one per element' },
  { cmd: 'String(str.reversed())', cat: 'strings', pt: 'Inverte a string', en: 'Reverses the string' },
  { cmd: 'str.prefix(3)', cat: 'strings', pt: 'Os primeiros 3 caracteres (Substring)', en: 'The first 3 characters (Substring)' },
  { cmd: 'String(format: "%05d", 42)', cat: 'strings', pt: 'Formata com zeros à esquerda (precisa de Foundation)', en: 'Formats with leading zeros (needs Foundation)' },
  { cmd: 'String(repeating: "ab", count: 3)', cat: 'strings', pt: 'Repete a string N vezes', en: 'Repeats the string N times' },

  // ─── Coleções ──────────────────────────────────────────────────────────
  { cmd: 'let a = [1, 2, 3]', cat: 'collections', pt: 'Array literal — coleção ordenada', en: 'Array literal — an ordered collection' },
  { cmd: 'var a = [Int]()', cat: 'collections', pt: 'Array vazio com tipo explícito', en: 'Empty array with an explicit type' },
  { cmd: 'a.append(4)', cat: 'collections', pt: 'Adiciona um elemento ao fim (mutates in place)', en: 'Appends an element at the end (mutates in place)' },
  { cmd: 'a[0]', cat: 'collections', pt: 'Índice baseado em zero', en: 'Zero-based subscript' },
  { cmd: 'a.first / a.last', cat: 'collections', pt: 'Primeiro e último — retornam nil se vazios', en: 'First and last — nil when empty' },
  { cmd: 'a.count', cat: 'collections', pt: 'Quantidade de elementos', en: 'Number of elements' },
  { cmd: 'a.isEmpty', cat: 'collections', pt: 'Está vazio?', en: 'Is it empty?' },
  { cmd: 'a.contains(2)', cat: 'collections', pt: 'Contém o valor?', en: 'Does it contain the value?' },
  { cmd: 'a.sort()', cat: 'collections', pt: 'Ordena no lugar — use sorted() pra cópia', en: 'Sorts in place — use sorted() for a copy' },
  { cmd: 'a.sorted()', cat: 'collections', pt: 'Retorna uma cópia ordenada sem mutar', en: 'Returns a sorted copy without mutating' },
  { cmd: 'a.filter { $0 > 1 }', cat: 'collections', pt: 'Filtra mantendo os que satisfazem o predicado', en: 'Filters, keeping those that satisfy the predicate' },
  { cmd: 'a.map { $0 * 2 }', cat: 'collections', pt: 'Transforma cada elemento', en: 'Transforms each element' },
  { cmd: 'a.reduce(0) { $0 + $1 }', cat: 'collections', pt: 'Acumula um valor percorrendo o array', en: 'Accumulates a value by walking the array' },
  { cmd: 'a.first(where: { $0 > 1 })', cat: 'collections', pt: 'Primeiro elemento que satisfaz — optional', en: 'First element satisfying — optional' },
  { cmd: 'var d = [String: Int]()', cat: 'collections', pt: 'Dictionary: mapeia chave → valor com subscript e .keys/.values', en: 'Dictionary: maps key → value with subscript and .keys/.values' },
  { cmd: 'd["chave"] = 1', cat: 'collections', pt: 'Insere ou atualiza pela chave', en: 'Inserts or updates by key' },
  { cmd: 'd["x"] ?? 0', cat: 'collections', pt: 'Leitura com fallback quando a chave não existe', en: 'Read with a fallback when the key is missing' },
  { cmd: 'd.keys.sorted()', cat: 'collections', pt: 'Chaves como array, já ordenado', en: 'Keys as an array, already sorted' },
  { cmd: 'var s = Set([1, 2, 2])', cat: 'collections', pt: 'Set: sem duplicatas; suporta union/intersection', en: 'Set: no duplicates; supports union/intersection' },
  { cmd: 's.insert(3); s.remove(1)', cat: 'collections', pt: 'Insere e remove elementos sem duplicar', en: 'Inserts and removes elements without duplicates' },

  // ─── Controle de fluxo ─────────────────────────────────────────────────
  { cmd: 'if x > 0 { } else { }', cat: 'control', pt: 'Condicional — parênteses são opcionais', en: 'Conditional — parentheses are optional' },
  { cmd: 'else if', cat: 'control', pt: 'Encadeia mais condições', en: 'Chains additional conditions' },
  { cmd: 'switch x { case 0: break; default: break }', cat: 'control', pt: 'Switch — não precisa de break por case', en: 'Switch — no break needed per case' },
  { cmd: 'case 1...5:', cat: 'control', pt: 'Case com intervalo de valores', en: 'Case with a value range' },
  { cmd: 'case let n where n % 2 == 0:', cat: 'control', pt: 'Case com condição extra via where', en: 'Case with an extra condition via where' },
  { cmd: 'for i in 0..<10 { }', cat: 'control', pt: 'Loop sobre um range excluindo o fim', en: 'Loop over a range excluding the end' },
  { cmd: 'for c in "abc" { }', cat: 'control', pt: 'Itera sobre caracteres ou elementos de coleção', en: 'Iterates over characters or collection elements' },
  { cmd: 'for (k, v) in d { }', cat: 'control', pt: 'Itera um dictionary desempacotando chave/valor', en: 'Iterates a dictionary unpacking key/value' },
  { cmd: 'while condicao { }', cat: 'control', pt: 'Loop enquanto a condição for true', en: 'Loops while the condition is true' },
  { cmd: 'repeat { } while cond', cat: 'control', pt: 'do-while: executa ao menos uma vez', en: 'do-while: runs at least once' },
  { cmd: 'continue / break', cat: 'control', pt: 'Pula para a próxima iteração ou sai do loop', en: 'Jumps to the next iteration or exits the loop' },
  { cmd: 'guard x > 0 else { return }', cat: 'control', pt: 'Exige a condição ou sai cedo da função', en: 'Requires the condition or exits the function early' },

  // ─── Funções & closures ────────────────────────────────────────────────
  { cmd: 'func soma(_ a: Int, _ b: Int) -> Int { a + b }', cat: 'funcs', pt: 'Definição — _ omite o rótulo externo; `->` é o retorno', en: 'Definition — _ omits the external label; `->` is the return' },
  { cmd: 'soma(1, 2)', cat: 'funcs', pt: 'Chamada — sem rótulo por causa do _', en: 'Call — no label thanks to the _' },
  { cmd: 'func f(a b: Int) { }', cat: 'funcs', pt: 'Rótulo externo `a`, interno `b`', en: 'External label `a`, internal name `b`' },
  { cmd: 'func f(x: Int = 42) { }', cat: 'funcs', pt: 'Parâmetro com valor padrão', en: 'Parameter with a default value' },
  { cmd: 'func f(_ xs: Int...) { }', cat: 'funcs', pt: 'Variadic — aceita zero ou mais argumentos', en: 'Variadic — accepts zero or more arguments' },
  { cmd: 'inout &', cat: 'funcs', pt: 'Parâmetro que pode ser modificado e refletido fora', en: 'Parameter that can be mutated and reflected outside' },
  { cmd: '{ (a: Int, b: Int) -> Int in a + b }', cat: 'funcs', pt: 'Closure completa — `in` separa parâmetros do corpo', en: 'Full closure — `in` separates parameters from the body' },
  { cmd: '{ $0 + $1 }', cat: 'funcs', pt: 'Sintaxe curta com parâmetros posicionais $0, $1…', en: 'Shorthand syntax with positional params $0, $1…' },
  { cmd: 'a.sorted(by: >)', cat: 'funcs', pt: 'Passa operador como closure', en: 'Passes an operator as a closure' },
  { cmd: 'let f = { (x: Int) in x * 2 }', cat: 'funcs', pt: 'Closure guardada numa variável', en: 'Closure stored in a variable' },
  { cmd: 'trailing closure: f { ... }', cat: 'funcs', pt: 'Quando a closure é o último parâmetro, sai dos parênteses', en: 'When the closure is the last parameter, it escapes the parens' },
  { cmd: '[weak self] capture list', cat: 'funcs', pt: 'Evita ciclo de retenção em closures de classes', en: 'Prevents retain cycles in class closures' },
  { cmd: 'func f() -> (Int, Int) { (1, 2) }', cat: 'funcs', pt: 'Vários valores de retorno via tupla', en: 'Multiple return values via a tuple' },
  { cmd: 'func f(g: () -> Void) { g() }', cat: 'funcs', pt: 'Recebe uma closure como parâmetro', en: 'Takes a closure as a parameter' },
  { cmd: 'defer { }', cat: 'funcs', pt: 'Executa o bloco ao sair do escopo (limpeza)', en: 'Runs the block upon scope exit (cleanup)' },

  // ─── Structs, classes, enums & protocolos ──────────────────────────────
  { cmd: 'struct Ponto { var x: Int; var y: Int }', cat: 'oop', pt: 'Struct — tipo por valor, com init e métodos', en: 'Struct — a value type with an init and methods' },
  { cmd: 'Ponto(x: 1, y: 2)', cat: 'oop', pt: 'Memberwise init gerado automaticamente', en: 'Memberwise init generated automatically' },
  { cmd: 'class Conta { var saldo = 0 }', cat: 'oop', pt: 'Class — tipo por referência, com herança', en: 'Class — a reference type with inheritance' },
  { cmd: 'final class X { }', cat: 'oop', pt: 'Final: impede subclasses e permite dispatch direto', en: 'Final: blocks subclassing and enables direct dispatch' },
  { cmd: 'class Filho: Pai { }', cat: 'oop', pt: 'Herança de classe', en: 'Class inheritance' },
  { cmd: 'override func m() { }', cat: 'oop', pt: 'Sobrescreve método da superclasse', en: 'Overrides a superclass method' },
  { cmd: 'super.m()', cat: 'oop', pt: 'Chama a implementação da superclasse', en: 'Calls the superclass implementation' },
  { cmd: 'enum Direcao { case norte, sul }', cat: 'oop', pt: 'Enum — pode ter valores associados e raw values', en: 'Enum — can have associated values and raw values' },
  { cmd: 'enum C: String { case a = "A" }', cat: 'oop', pt: 'Raw value — dá pra obter e comparar com literal', en: 'Raw value — can be obtained and built from a literal' },
  { cmd: 'case .norte', cat: 'oop', pt: 'Dedução/omissão do enum quando o tipo é conhecido', en: 'Enum inference/omission when the type is known' },
  { cmd: 'enum Resultado { case ok(Int); case erro(String) }', cat: 'oop', pt: 'Associated values carregam dados por case', en: 'Associated values carry data per case' },
  { cmd: 'if case .ok(let n) = r { }', cat: 'oop', pt: 'Padrão para casa junto com o valor (if-let em enum)', en: 'Pattern to match a case together with its value (if-let for enums)' },
  { cmd: 'protocol Resumivel { func resumo() -> String }', cat: 'oop', pt: 'Protocolo — um contrato de API que tipos podem adotar', en: 'Protocol — an API contract that types can adopt' },
  { cmd: 'struct A: Resumivel { }', cat: 'oop', pt: 'Adota o protocolo e implementa os requisitos', en: 'Adopts the protocol and implements its requirements' },
  { cmd: 'extension Int { func dobro() -> Int { self * 2 } }', cat: 'oop', pt: 'Extension: adiciona métodos a tipos existentes', en: 'Extension: adds methods to existing types' },
  { cmd: 'extension Int: Equatable {}', cat: 'oop', pt: 'Estende conformidade no próprio arquivo', en: 'Extends conformance in its own file' },
  { cmd: 'static/class func', cat: 'oop', pt: 'Método de tipo — static para classes e value types', en: 'Type method — static for classes and value types' },
  { cmd: 'computed prop: var area: Int { w * h }', cat: 'oop', pt: 'Propriedade calculada — recalculada a cada acesso', en: 'Computed property — recalculated on every access' },
  { cmd: 'willSet / didSet', cat: 'oop', pt: 'Observadores executados antes/depois de mudar', en: 'Observers run before/after a change' },
  { cmd: 'private(set) var x', cat: 'oop', pt: 'Leitura pública, escrita privada', en: 'Public getter, private setter' },
  { cmd: 'private / fileprivate / internal / public / open', cat: 'oop', pt: 'Escalas de acesso — do mais restrito ao aberto', en: 'Access levels — from the most restrictive to open' },

  // ─── Generics & extensions ──────────────────────────────────────────────
  { cmd: 'func f<T>(_ x: T) -> T { x }', cat: 'generics', pt: 'Função genérica — T é um placeholder de tipo', en: 'Generic function — T is a type placeholder' },
  { cmd: 'struct Caixa<T> { var valor: T }', cat: 'generics', pt: 'Tipo genérico paramétrico', en: 'Parameterized generic type' },
  { cmd: 'func f<T: Comparable>(a: T, b: T) -> T { max(a, b) }', cat: 'generics', pt: 'Constraint: exige que T seja Comparable', en: 'Constraint: requires T to be Comparable' },
  { cmd: 'func f<A, B>(_ a: A) -> B { ... }', cat: 'generics', pt: 'Vários parâmetros de tipo', en: 'Multiple type parameters' },
  { cmd: 'func f<T>(_ x: T?) { }', cat: 'generics', pt: 'Generics também funcionam com optionals', en: 'Generics work with optionals too' },
  { cmd: 'extension Array where Element: Comparable { }', cat: 'generics', pt: 'onde: restringe a extensão a certos Element', en: 'where: scopes the extension to certain Element types' },
  { cmd: 'some View', cat: 'generics', pt: 'Opaque result type — esconde o tipo concreto no retorno', en: 'Opaque result type — hides the concrete return type' },
  { cmd: 'any Protocol', cat: 'generics', pt: 'Existential — apaga o tipo estático do valor', en: 'Existential — erases the concrete static type' },

  // ─── Tratamento de erros ────────────────────────────────────────────────
  { cmd: 'func f() throws -> Int { ... }', cat: 'errors', pt: 'Marca que a função pode lançar erro', en: 'Marks that the function can throw' },
  { cmd: 'try f() / try? f() / try! f()', cat: 'errors', pt: 'Lança para cima / devolve Optional / força sem propagar', en: 'Propagates / returns an Optional / forces without propagating' },
  { cmd: 'do { try f() } catch { }', cat: 'errors', pt: 'Captura o erro no escopo local', en: 'Catches the error locally' },
  { cmd: 'catch let e as MeuErro', cat: 'errors', pt: 'Captura apenas erros do tipo específico', en: 'Catches only errors of that specific type' },
  { cmd: 'enum E: Error { case invalido(String) }', cat: 'errors', pt: 'Cria seus próprios tipos de erro conforme Error', en: 'Creates your own error types conforming to Error' },
  { cmd: 'throw E.invalido("x")', cat: 'errors', pt: 'Lança um erro (dentro de função throws)', en: 'Throws an error (inside a throws function)' },
  { cmd: 'do { try f() } catch { print(error) }', cat: 'errors', pt: '`error` é a variável implícita, sem precisar criar let', en: '`error` is the implicit variable, no need to declare it' },
  { cmd: 'guard let ok = try? f() else { throw ... }', cat: 'errors', pt: 'Transforma throwing em optional e valida no guard', en: 'Turns a throw into an optional and validates in a guard' },
  { cmd: 'assert/ precondition / fatalError()', cat: 'errors', pt: 'Debug / debug+release / sempre interrompe', en: 'Debug-only / debug+release / always halts' },

  // ─── Concorrência & async/await ──────────────────────────────────────────
  { cmd: 'func busca() async -> Data { ... }', cat: 'concurrency', pt: 'Função assíncrona — roda em um task', en: 'Async function — runs inside a task' },
  { cmd: 'let d = try await busca()', cat: 'concurrency', pt: 'Aguarda o resultado — suspende sem travar a thread', en: 'Awaits the result — suspends without blocking a thread' },
  { cmd: 'Task { }', cat: 'concurrency', pt: 'Cria um bloco assíncrono a partir de contexto síncrono', en: 'Creates an async block from a synchronous context' },
  { cmd: 'Task.detached { }', cat: 'concurrency', pt: 'Task sem herdar o contexto do caller', en: 'Task that does not inherit the caller context' },
  { cmd: 'actor Conta { }', cat: 'concurrency', pt: 'Isola estado — protege contra corrida de dados', en: 'Isolates state — protects against data races' },
  { cmd: 'nonisolated func', cat: 'concurrency', pt: 'Método fora da zona de isolamento do actor', en: 'Method outside the actor isolation domain' },
  { cmd: 'let s = await conta.saldo', cat: 'concurrency', pt: 'Acessa propriedade de actor esperando a vez', en: 'Accesses an actor property, waiting its turn' },
  { cmd: 'async let a = f(); async let b = g(); await (a, b)', cat: 'concurrency', pt: 'Roda duas tarefas em paralelo e espera as duas', en: 'Runs two tasks in parallel and awaits both' },
  { cmd: 'func f() async throws -> T', cat: 'concurrency', pt: 'Async + throwing combinados', en: 'Async combined with throwing' },
  { cmd: 'Task.sleep(for: .seconds(1))', cat: 'concurrency', pt: 'Pausa sem bloquear a thread', en: 'Sleeps without blocking the thread' },

  // ─── SwiftUI & UI ────────────────────────────────────────────────────────
  { cmd: 'struct V: View { var body: some View { Text("oi") } }', cat: 'swiftui', pt: 'A View mínima — declaração do body', en: 'The minimal View — declaring the body' },
  { cmd: 'Text("Olá")', cat: 'swiftui', pt: 'Texto simples', en: 'Simple text' },
  { cmd: 'Image(systemName: "star")', cat: 'swiftui', pt: 'Ícone SF Symbol, pronto pra usar', en: 'SF Symbol icon, ready to use' },
  { cmd: 'VStack { } / HStack { } / ZStack { }', cat: 'swiftui', pt: 'Empilha verticalmente / horizontalmente / sobreposto', en: 'Stacks vertically / horizontally / overlapped' },
  { cmd: 'Spacer()', cat: 'swiftui', pt: 'Empurra os outros elementos para as pontas', en: 'Pushes the other elements to the edges' },
  { cmd: 'Text(x).font(.title).foregroundColor(.blue)', cat: 'swiftui', pt: 'Modificadores aplicados em cadeia', en: 'Modifiers chained together' },
  { cmd: '.padding()', cat: 'swiftui', pt: 'Adiciona respiro em volta do elemento', en: 'Adds breathing room around the element' },
  { cmd: '.frame(width: 100, height: 50)', cat: 'swiftui', pt: 'Define a moldura de tamanho', en: 'Sets a fixed frame size' },
  { cmd: '.background(Color.yellow)', cat: 'swiftui', pt: 'Fundo colorido', en: 'Colored background' },
  { cmd: '@State private var n = 0', cat: 'swiftui', pt: 'State mutável que redesenha a View', en: 'Mutable state that redraws the View' },
  { cmd: '@Binding var n: Int', cat: 'swiftui', pt: 'Referência de leitura/escrita para o dono', en: 'Read/write reference owned elsewhere' },
  { cmd: '@ObservedObject / @EnvironmentObject', cat: 'swiftui', pt: 'Observa objetos externos de estado', en: 'Observes external state objects' },
  { cmd: 'Button("Toca") { n += 1 }', cat: 'swiftui', pt: 'Botão com ação closure', en: 'Button with an action closure' },
  { cmd: 'List(items, id: \\.self) { }.onDelete { }', cat: 'swiftui', pt: 'Lista com suporte a deletar/ordenar', en: 'List with delete/move support' },
  { cmd: 'ForEach(items, id: \\.self) { item in }', cat: 'swiftui', pt: 'Itera dados gerando Views dinâmicas', en: 'Iterates data generating dynamic Views' },
  { cmd: 'NavigationStack { NavigationLink { } label: { } }', cat: 'swiftui', pt: 'Navegação empilhada com links', en: 'Stack navigation with links' },
  { cmd: 'Text(x).task { await carregar() }', cat: 'swiftui', pt: 'Dispara trabalho assíncrono quando a view aparece', en: 'Kicks off async work when the view appears' },
  { cmd: '.preferredColorScheme(.dark)', cat: 'swiftui', pt: 'Força o tema claro ou escuro', en: 'Forces light or dark appearance' },
  { cmd: 'PreviewProvider', cat: 'swiftui', pt: 'Bloco de preview no canvas/Xcode', en: 'Preview block in the canvas/Xcode' },

  // ─── Codable, JSON & arquivos ───────────────────────────────────────────
  { cmd: 'struct U: Codable { let id: Int; let nome: String }', cat: 'data', pt: 'Codable = Encodable + Decodable, de graça', en: 'Codable = Encodable + Decodable, for free' },
  { cmd: 'let d = try JSONEncoder().encode(u)', cat: 'data', pt: 'Codifica para Data (JSON bytes)', en: 'Encodes to Data (JSON bytes)' },
  { cmd: 'let u = try JSONDecoder().decode(U.self, from: d)', cat: 'data', pt: 'Decodifica Data de volta no tipo', en: 'Decodes Data back into the type' },
  { cmd: 'let s = String(data: d, encoding: .utf8)', cat: 'data', pt: 'Data → String legível', en: 'Data → human-readable String' },
  { cmd: 'enum Chave: String, CodingKey { case nome }', cat: 'data', pt: 'Mapeia nomes JSON diferentes dos do Swift', en: 'Maps JSON names that differ from the Swift ones' },
  { cmd: 'let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]', cat: 'data', pt: 'Diretório de documentos do app', en: 'App document directory' },
  { cmd: 'let url = dir.appendingPathComponent("u.json")', cat: 'data', pt: 'Monta caminho de arquivo', en: 'Builds a file path URL' },
  { cmd: 'try d.write(to: url)', cat: 'data', pt: 'Grava Data em arquivo (atômico com opções)', en: 'Writes Data to a file (atomic with options)' },
  { cmd: 'let d = try Data(contentsOf: url)', cat: 'data', pt: 'Lê o arquivo inteiro em Data', en: 'Reads the whole file into Data' },
  { cmd: 'try FileManager.default.removeItem(at: url)', cat: 'data', pt: 'Apaga o arquivo', en: 'Deletes the file' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Swift',
    intro: (
      <>
        Referência pesquisável da linguagem Swift — CLI e Swift Package Manager,
        básicos da sintaxe, tipos e optionals, strings e caracteres, coleções,
        controle de fluxo, funções e closures, structs/classes/enums e
        protocolos, generics e extensions, tratamento de erros, concorrência
        com async/await, SwiftUI e Codable/JSON. Tudo 100% client-side (só
        texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Em Swift tudo tem tipo inferido: deixe as anotações explícitas só
        quando ajudam a legibilidade. Prefira <Text code>struct</Text> a{' '}
        <Text code>class</Text> — structs são por valor, com mutação imutável
        por padrão. Use <Text code>let</Text> por padrão e{' '}
        <Text code>var</Text> só quando precisar mudar. Optionals são
        desembrulhados com <Text code>if let</Text>/<Text code>guard let</Text>.
        Martele o <Text code>??</Text> para fallbacks e evite o{' '}
        <Text code>!</Text> forçado.
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
    title: 'Swift Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Swift language — CLI and Swift Package
        Manager, syntax basics, types and optionals, strings and characters,
        collections, control flow, functions and closures, structs/classes/
        enums and protocols, generics and extensions, error handling,
        concurrency with async/await, SwiftUI, and Codable/JSON. 100%
        client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        In Swift everything is type-inferred — keep explicit annotations only
        when they help readability. Prefer <Text code>struct</Text> over{' '}
        <Text code>class</Text> — structs are value types with immutable-by-
        default mutation. Use <Text code>let</Text> by default and{' '}
        <Text code>var</Text> only when you need to change it. Unwrap
        optionals with <Text code>if let</Text>/<Text code>guard let</Text>.
        Reach for <Text code>??</Text> for fallbacks and avoid forced{' '}
        <Text code>!</Text> unwrapping.
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

export default function SwiftCheatsheetPage() {
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
