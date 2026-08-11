import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['types', 'interfaces', 'unions', 'generics', 'utility', 'functions', 'classes', 'modules', 'tsconfig', 'gotchas']

const CATEGORY_COLOR = {
  types: 'blue',
  interfaces: 'cyan',
  unions: 'purple',
  generics: 'geekblue',
  utility: 'magenta',
  functions: 'gold',
  classes: 'green',
  modules: 'volcano',
  tsconfig: 'orange',
  gotchas: 'red',
}

const labelOf = {
  types: { pt: 'Tipos & anotações', en: 'Types & annotations' },
  interfaces: { pt: 'Interfaces & aliases', en: 'Interfaces & aliases' },
  unions: { pt: 'Unions, narrowing & assertions', en: 'Unions, narrowing & assertions' },
  generics: { pt: 'Generics', en: 'Generics' },
  utility: { pt: 'Utility types', en: 'Utility types' },
  functions: { pt: 'Funções & overloads', en: 'Functions & overloads' },
  classes: { pt: 'Classes & modificadores', en: 'Classes & modifiers' },
  modules: { pt: 'Módulos & .d.ts', en: 'Modules & .d.ts' },
  tsconfig: { pt: 'tsconfig & CLI', en: 'tsconfig & CLI' },
  gotchas: { pt: 'Pegadinhas & dicas', en: 'Gotchas & tips' },
}

const ITEMS = [
  // ─── Tipos & anotações ──────────────────────────────────────────────────
  { code: 'const port: number = 3000;', cat: 'types',
    pt: 'Anotação explícita de tipo. Na prática o TS infere sozinho a maioria dos casos — a anotação vale pra registrar a intenção e fixar o tipo de um `let` que vai mudar depois.',
    en: 'Explicit type annotation. In practice TS infers most of these by itself — annotate to record intent or to pin a `let` that will change later.' },
  { code: "const labels: string[] = ['hot', 'cold'];", cat: 'types',
    pt: 'Array de strings. `Array<string>` é a mesma coisa — a sintaxe `[]` é a usada no dia a dia.',
    en: 'Array of strings. `Array<string>` is the same thing — the `[]` syntax is the daily one.' },
  { code: "const pair: [string, number] = ['ada', 36];", cat: 'types',
    pt: 'Tupla: array de tamanho e tipos fixos por posição. Bom pra retornar "dois valores que só fazem sentido juntos" (ex.: [erro, dados]).',
    en: 'Tuple: fixed-length array with per-position types. Great for returning "two values that only make sense together" (e.g. [error, data]).' },
  { code: 'let raw: unknown = JSON.parse(text);', cat: 'types',
    pt: 'unknown: o "ainda não sei o tipo". Força um narrowing antes de usar — o oposto do `any`, que passa batido.',
    en: 'unknown: the "I do not know the type yet". Forces narrowing before use — the opposite of `any`, which slips through.' },
  { code: 'let anything: any = getResult();', cat: 'types',
    pt: '`any` desliga a checagem naquele valor (e em tudo que ele toca). Útil em migração/JS legado, mas vaza: prefira `unknown` + narrowing.',
    en: '`any` turns off checking on that value (and whatever it touches). Useful for migrations/legacy JS, but it leaks: prefer `unknown` + narrowing.' },
  { code: 'function log(message: string): void { console.log(message); }', cat: 'types',
    pt: '`void` como tipo de retorno: a função não devolve um valor utilizável. Comum em callbacks que executam efeito colateral.',
    en: '`void` as a return type: the function returns nothing usable. Common on callbacks that run side effects.' },
  { code: 'const maybe: string | null = load(false);', cat: 'types',
    pt: 'null (e undefined) entram na união explicitamente quando podem existir — é o que torna o código à prova de "Cannot read properties of null".',
    en: 'null (and undefined) join the union explicitly when they can occur — what makes code null-safe.' },
  { code: 'const ids: readonly number[] = [1, 2, 3];', cat: 'types',
    pt: 'Array `readonly`: não aceita push/splice — só criar um novo. Sinaliza "imutável" pra quem mexer depois.',
    en: '`readonly` array: no push/splice — you can only produce a new one. Signals "immutable" to the next person.' },

  // ─── Interfaces & aliases ───────────────────────────────────────────────
  { code: 'interface User { name: string; age: number }', cat: 'interfaces',
    pt: 'Interface: o contrato de um objeto. Define a forma que ele precisa ter pra ser um User — valendo tanto pra argumento quanto pra retorno.',
    en: 'Interface: the contract of an object. Defines the shape it must have to be a User — for arguments and returns alike.' },
  { code: 'type User = { name: string; age: number };', cat: 'interfaces',
    pt: 'type alias: o mesmo "shape" declarado como alias. Interpola com união e intersecção — onde a interface não alcança.',
    en: 'type alias: the same "shape" as an alias. Plays with unions and intersections — where interfaces do not reach.' },
  { code: 'interface Admin extends User { level: number }', cat: 'interfaces',
    pt: 'Herança de interface: Admin tem TUDO de User mais os campos novos. Mesma ideia do extends de classe, só que no nível de shape.',
    en: 'Interface inheritance: Admin has ALL of User plus the new fields. Same idea as class extends, but at the shape level.' },
  { code: 'type Full = { a: string } & { b: number };', cat: 'interfaces',
    pt: 'Intersecção: o objeto final precisa satisfazer os dois. O primo da união ("ou") — aqui é "e".',
    en: 'Intersection: the resulting object must satisfy both. The cousin of the union ("or") — here it is "and".' },
  { code: 'interface Token { readonly value: string }', cat: 'interfaces',
    pt: '`readonly`: propriedade que não pode ser reassignada depois de criada. Checagem em tempo de compilação, não em runtime.',
    en: '`readonly`: a property that cannot be reassigned after creation. Compile-time check, not runtime.' },
  { code: 'interface Config { title?: string; retries?: number }', cat: 'interfaces',
    pt: '`?` marca a propriedade como OPCIONAL: pode existir ou não. Ler/setar é seguro, mas você não pode assumir que ela está lá.',
    en: '`?` marks the property as OPTIONAL: it may exist or not. Safe to read/set, but you cannot assume it is there.' },
  { code: 'interface Dict { [key: string]: unknown }', cat: 'interfaces',
    pt: 'Index signature: um objeto aberto onde qualquer string serve de chave — o "Map str->value" do dia a dia.',
    en: 'Index signature: an open object where any string works as a key — the everyday str->value "Map".' },
  { code: 'interface MathFn { (a: number, b: number): number }', cat: 'interfaces',
    pt: 'Call signature: a interface descreve uma FUNÇÃO. `const add: MathFn = (a, b) => a + b;` cumpre o contrato.',
    en: 'Call signature: the interface describes a FUNCTION. `const add: MathFn = (a, b) => a + b;` satisfies the contract.' },

  // ─── Unions, narrowing & assertions ─────────────────────────────────────
  { code: "type Status = 'draft' | 'published' | 'archived';", cat: 'unions',
    pt: 'União de literais: as opções viram valores válidos em tempo de compilação — autocomplete e erro em qualquer typo de string mágica.',
    en: 'Literal union: the options become valid values at compile time — autocomplete and errors on any magic-string typo.' },
  { code: "function format(x: number | string): number {\n  if (typeof x === 'number') return x;\n  return Number(x);\n}",
    cat: 'unions',
    pt: 'typeof narrowing: dentro do if o TS rebaixa o tipo pra unidade certa — sem o check, nem o `Number(x)` compila no branch de baixo.',
    en: 'typeof narrowing: inside the if TS narrows to the right unit — without the check, even `Number(x)` fails to compile below.' },
  { code: "if ('width' in shape) { return shape.width; }", cat: 'unions',
    pt: 'narrowing por `in`: testa se a PROPRIEDADE existe no objeto. O jeito de distinguir objetos com formas diferentes.',
    en: '`in` narrowing: tests whether the PROPERTY exists on the object. How to tell apart differently-shaped objects.' },
  { code: "type Shape =\n  | { kind: 'circle'; radius: number }\n  | { kind: 'square'; side: number };",
    cat: 'unions',
    pt: 'Discriminated union: todas as variantes têm um campo comum (`kind`) que identifica qual é qual — a base do pattern mais usado em TS.',
    en: 'Discriminated union: every variant shares a tag field (`kind`) telling which is which — the basis of the most-used TS pattern.' },
  { code: "function area(s: Shape) {\n  switch (s.kind) {\n    case 'circle': return Math.PI * s.radius ** 2;\n    case 'square': return s.side * s.side;\n  }\n}",
    cat: 'unions',
    pt: 'No switch do discriminador, cada case estreita pro sub-tipo certo e o autocomplete mostra só os campos dele. Adicionar variante nova quebra no switch que esqueceu de tratar.',
    en: 'In the discriminator switch each case narrows to the right subtype and autocomplete shows only its fields. Adding a new variant breaks any switch that forgot it.' },
  { code: 'const n = value as number;', cat: 'unions',
    pt: 'Type assertion: VOCÊ garante o tipo pro compilador. É uma mentira consciente — se estiver errada, o erro aparece na execução, não na compilação.',
    en: 'Type assertion: YOU vouch for the type to the compiler. A conscious lie — if wrong, the error shows at runtime, not compile time.' },
  { code: "const isString = (x: unknown): x is string => typeof x === 'string';", cat: 'unions',
    pt: 'Type predicate: uma função que ESTREITA o tipo pra quem a usa. Dentro de `if (isString(v))`, `v` passa a ser tratado como string.',
    en: 'Type predicate: a function that NARROWS for its callers. Inside `if (isString(v))`, `v` is treated as a string.' },

  // ─── Generics ───────────────────────────────────────────────────────────
  { code: 'function identity<T>(value: T): T { return value; }', cat: 'generics',
    pt: 'Genérico: o tipo vira um parâmetro. `identity(1)` devolve number, `identity("x")` devolve string — mesma função, tipo derivado do argumento.',
    en: 'Generic: the type becomes a parameter. `identity(1)` returns number, `identity("x")` returns string — same function, type derived from the argument.' },
  { code: 'const first = <T,>(arr: T[]): T | undefined => arr[0];', cat: 'generics',
    pt: 'Arrow function genérica. Em arquivos .tsx o `<T,>` com vírgula final evita o parser de JSX ler a linha como uma TAG.',
    en: 'Generic arrow function. In .tsx files the trailing `<T,>` comma keeps the JSX parser from reading the line as a TAG.' },
  { code: 'interface Box<T> { value: T }', cat: 'generics',
    pt: 'Interface genérica: `Box<string>` instancia um tipo concreto. O jeito de reaproveitar um shape com o "tipo interno" trocável.',
    en: 'Generic interface: `Box<string>` instantiates to a concrete type. Reusing a shape with a swappable inner type.' },
  { code: 'type ApiResult<T> = { data: T; ok: true } | { error: string; ok: false };', cat: 'generics',
    pt: 'Genérico + discriminated union: o retorno de API mais comum em TS — sucesso carrega o dado tipado, falha carrega a mensagem.',
    en: 'Generic + discriminated union: the most common TS API return — success carries typed data, failure carries a message.' },
  { code: 'function makePair<A, B>(a: A, b: B): [A, B] { return [a, b]; }', cat: 'generics',
    pt: 'Múltiplos parâmetros de tipo, inferidos juntos a partir dos argumentos.',
    en: 'Multiple type params, inferred together from the arguments.' },
  { code: 'function getKey<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }', cat: 'generics',
    pt: 'Constraint `K extends keyof T`: a chave só pode ser uma das existentes — e o retorno `T[K]` é o tipo do VALOR daquela chave.',
    en: 'Constraint `K extends keyof T`: the key can only be an existing one — and the `T[K]` return is the type of that key VALUE.' },
  { code: 'class Stack<T> { items: T[] = []; push(v: T) { this.items.push(v); } pop() { return this.items.pop(); } }', cat: 'generics',
    pt: 'Classe genérica: o tipo é fixo por instância (`new Stack<number>()`) e vale pros métodos e campos.',
    en: 'Generic class: the type is fixed per instance (`new Stack<number>()`) and applies to methods and fields.' },

  // ─── Utility types ──────────────────────────────────────────────────────
  { code: 'type PartialUser = Partial<User>;', cat: 'utility',
    pt: 'Partial: todas as propriedades viram opcionais. O tipo de "form de edição" — só o que mudou é enviado.',
    en: 'Partial: every property becomes optional. The "edit form" type — only what changed gets sent.' },
  { code: "type PublicUser = Pick<User, 'name' | 'email'>;", cat: 'utility',
    pt: 'Pick: só as chaves listadas. O "livre-se da senha" numa API pública.',
    en: 'Pick: only the listed keys. The "drop the password" for a public API.' },
  { code: "type SafeUser = Omit<User, 'password' | 'token'>;", cat: 'utility',
    pt: 'Omit: remove as chaves listadas. O inverso do Pick, usado pra censura.',
    en: 'Omit: removes the listed keys. The inverse of Pick, used for redaction.' },
  { code: 'type AllRequired = Required<Config>;', cat: 'utility',
    pt: 'Required: tira o `?` de todas as propriedades (o inverso do Partial).',
    en: 'Required: strips `?` from every property (the inverse of Partial).' },
  { code: 'type Frozen = Readonly<User>;', cat: 'utility',
    pt: 'Readonly: todas as props vêm readonly — o objeto inteiro vira "config que não muda".',
    en: 'Readonly: every prop comes readonly — the whole object becomes "config that does not change".' },
  { code: 'type UserKeys = keyof User;', cat: 'utility',
    pt: 'keyof: a união das CHAVES do tipo (`"name" | "age" | ...`). O operador que transforma objeto em lista de chaves no nível de tipos.',
    en: 'keyof: the union of the type KEYS (`"name" | "age" | ...`). The operator that turns an object into its key list at type level.' },
  { code: "type Age = User['age'];", cat: 'utility',
    pt: 'Indexed access: acessa o tipo do VALOR de uma chave (aqui, number). Compõe: `T[K]` é o coringa do tipo dinâmico.',
    en: 'Indexed access: gets the type of a key VALUE (here, number). Composes: `T[K]` is the dynamic-type wildcard.' },
  { code: 'type Ret = ReturnType<typeof buildConfig>;', cat: 'utility',
    pt: 'ReturnType: extrai o tipo de retorno de uma função (com `typeof` na função real). `Parameters<>` faz o mesmo pros argumentos.',
    en: 'ReturnType: extracts the return type of a function (with `typeof` on the real function). `Parameters<>` does the same for the args.' },
  { code: 'type Config = Record<string, string | number>;', cat: 'utility',
    pt: 'Record<K, V>: um objeto tipado campo a campo — aqui, "qualquer string é chave com valor string|number". O "dicionário" tipado.',
    en: 'Record<K, V>: a field-by-field typed object — here "any string key holds a string|number value". The typed dictionary.' },

  // ─── Funções & overloads ────────────────────────────────────────────────
  { code: 'function add(a: number, b: number): number { return a + b; }', cat: 'functions',
    pt: 'Parâmetros anotados + tipo de retorno. Quando a função retorna algo, o TS infere; a anotação do retorno documenta a intenção.',
    en: 'Annotated params + return type. TS infers the return; annotating the return documents intent.' },
  { code: 'const multiply = (a: number, b: number): number => a * b;', cat: 'functions',
    pt: 'Arrow function com anotação nos parâmetros e no retorno. Tipagem idêntica à de function — a preferência é do time.',
    en: 'Arrow function annotated on params and return. Typing identical to a function — the team preference applies.' },
  { code: 'type ClickHandler = (event: MouseEvent) => void;', cat: 'functions',
    pt: 'Tipo de função como alias: callbacks ganham assinatura própria, reutilizável e clara na assinatura de quem recebe.',
    en: 'Function type as an alias: callbacks get their own signature, reusable and clear on the receiver signature.' },
  { code: 'function run(cb: (err: Error | null, data?: string) => void) {}', cat: 'functions',
    pt: 'Callback anotado inline na assinatura: quem chama a função já vê exatamente o que o callback recebe.',
    en: 'Callback annotated inline in the signature: callers see exactly what the callback receives.' },
  { code: "function greet(name: string, title = 'Sr(a).') { return title + ' ' + name; }", cat: 'functions',
    pt: 'Parâmetro com default: se não vier, usa o valor; o tipo é inferido do próprio default. Na prática fica após os obrigatórios.',
    en: 'Default param: used when not passed; the type is inferred from the default. In practice it follows the required ones.' },
  { code: 'function sum(...nums: number[]): number { return nums.reduce((a, b) => a + b, 0); }', cat: 'functions',
    pt: 'Rest params: os argumentos extras viram um array tipado — `sum(1, 2, 3)`.',
    en: 'Rest params: extra args become a typed array — `sum(1, 2, 3)`.' },
  { code: "function len(value: string): number;\nfunction len(value: unknown[]): number;\nfunction len(value: string | unknown[]) {\n  return value.length;\n}",
    cat: 'functions',
    pt: 'Overloads: várias assinaturas públicas (o que quem chama vê e o autocomplete mostra) + UMA implementação real que aceita todas. Retorno variando por argumento sem casting.',
    en: 'Overloads: several public signatures (what callers see and autocomplete shows) + ONE implementation accepting all. Returns varying by argument without casting.' },

  // ─── Classes & modificadores ────────────────────────────────────────────
  { code: 'class User { constructor(public name: string, private age: number) {} }', cat: 'classes',
    pt: 'Parameter properties: `public`/`private`/`readonly` no construtor declaram o campo E atribuem — corta o boilerplate inteiro.',
    en: 'Parameter properties: `public`/`private`/`readonly` in the constructor declare and assign the field in one go — kills the boilerplate.' },
  { code: 'class Wallet { private balance = 0; get total() { return this.balance; } }', cat: 'classes',
    pt: '`private` restringe o acesso à própria classe — o encapsulamento de verdade (em runtime é convenção; a checagem é só do compilador).',
    en: '`private` restricts access to the class itself — real encapsulation (at runtime it is a convention; only the compiler enforces).' },
  { code: 'class Base { protected secret = 1; }', cat: 'classes',
    pt: '`protected`: acessível na classe E nas subclasses, invisível fora — o nível do "uso interno que a herança quer ver".',
    en: '`protected`: accessible in the class AND subclasses, invisible outside — the "internal use the subclass needs" level.' },
  { code: 'class Widget { readonly id = crypto.randomUUID(); }', cat: 'classes',
    pt: '`readonly`: não pode ser reassignado depois do construtor — o "const do campo".',
    en: '`readonly`: cannot be reassigned after the constructor — the "const of a field".' },
  { code: 'abstract class Animal { abstract makeSound(): void; }', cat: 'classes',
    pt: 'Classe abstrata: não pode ser instanciada; serve de base. Método `abstract` não tem corpo — cada subclasse implementa o seu.',
    en: 'Abstract class: cannot be instantiated; a base only. `abstract` methods have no body — each subclass implements its own.' },
  { code: "class Dog extends Animal { override makeSound() { return 'Woof'; } }", cat: 'classes',
    pt: '`override` (TS 4.3+): explicita que o método SUBSTITUI um da base — errou o nome, o compilador reclama em vez de criar um método novo silenciosamente.',
    en: '`override` (TS 4.3+): states the method REPLACES a base one — a typo fails compile instead of silently creating a new method.' },
  { code: 'class Circle implements Shape { constructor(readonly radius: number) {} area() { return Math.PI * this.radius ** 2; } }', cat: 'classes',
    pt: '`implements`: a classe se compromete a satisfazer a interface — o compilador confere que todos os campos/métodos existem.',
    en: '`implements`: the class commits to satisfy the interface — the compiler verifies every field/method exists.' },
  { code: 'class Registry { static instances = 0; static register(c) { this.instances++; } }', cat: 'classes',
    pt: '`static`: membro da CLASSE, não da instância — `Registry.instances`. Contadores, factories e singletons vivem aqui.',
    en: '`static`: member of the CLASS, not the instance — `Registry.instances`. Counters, factories and singletons live here.' },

  // ─── Módulos & .d.ts ────────────────────────────────────────────────────
  { code: "export interface User { name: string }\nimport { User } from './types';",
    cat: 'modules',
    pt: 'Módulo padrão ES: `export` no definidor, `import` com o mesmo nome no consumidor.',
    en: 'Standard ES modules: `export` at the definition, `import` with the same name at the consumer.' },
  { code: 'export default function App() { return null; }', cat: 'modules',
    pt: 'Default export: um por arquivo; importa sem chaves — `import App from "./App"`. Usado pro "componente principal" do arquivo.',
    en: 'Default export: one per file; imported without braces — `import App from "./App"`. Used for the file main export.' },
  { code: "import type { Options } from './config';", cat: 'modules',
    pt: '`import type`: importa SÓ tipos — some no bundle, não existe no runtime. Com `verbatimModuleSyntax`, separar tipo de valor é obrigatório.',
    en: '`import type`: imports TYPES only — erased at build, not runtime. With `verbatimModuleSyntax`, separating types from values is mandatory.' },
  { code: "export { User } from './types';", cat: 'modules',
    pt: 'Re-export: repassa o que outro módulo exporta — o "índice" que expõe a API do pacote num ponto só.',
    en: 'Re-export: hands forward what another module exports — the "index" exposing a package API in one place.' },
  { code: "declare module '*.css' { const classes: Record<string, string>; export default classes; }",
    cat: 'modules',
    pt: 'Ambient declaration pra um formato sem tipos (aqui, CSS). Sem isso, `import "./x.css"` acusa "could not find a declaration file".',
    en: 'Ambient declaration for a typeless format (CSS here). Without it, `import "./x.css"` errors "could not find a declaration file".' },
  { code: 'declare global { interface Window { __appVersion: string } }', cat: 'modules',
    pt: 'Augmenta uma interface global existente: leva o window a "ter" uma prop nova, valendo em qualquer arquivo (num .d.ts sem imports).',
    en: 'Augments an existing global interface: makes window "have" a new prop, valid anywhere (in an import-free .d.ts).' },
  { code: 'export declare function parseAge(input: string): number;', cat: 'modules',
    pt: 'Declaração de função num arquivo `.d.ts`: só a assinatura, sem implementação. É o que um pacote sem tipos entrega pra você consumir.',
    en: 'Function declaration in a `.d.ts`: just the signature, no implementation. What a typeless package ships for you to consume.' },
  { code: '/// <reference types="vite/client" />', cat: 'modules',
    pt: 'Reference directive: ativa os tipos de um pacote sem import (aqui, as env vars do Vite). É assim que `.d.ts` soltos também se juntam com `<reference path>`.',
    en: 'Reference directive: pulls in a package types without importing (here, the Vite env vars). Loose `.d.ts` files also join via `<reference path>`.' },

  // ─── tsconfig & CLI ─────────────────────────────────────────────────────
  { code: 'npx tsc --init', cat: 'tsconfig',
    pt: 'Gera um tsconfig.json na pasta com todos os flags comentados e os padrões. O ponto de partida de qualquer projeto TS.',
    en: 'Generates a tsconfig.json with every flag commented out plus the defaults. The starting point of any TS project.' },
  { code: '"strict": true', cat: 'tsconfig',
    pt: 'O flag que importa de verdade: liga de uma vez strictNullChecks, noImplicitAny, strictFunctionTypes e cia. Um projeto TS novo deveria nascer com ele ligado.',
    en: 'The flag that matters: turns on strictNullChecks, noImplicitAny, strictFunctionTypes and friends at once. New TS projects should be born with it.' },
  { code: '"target": "ES2022"', cat: 'tsconfig',
    pt: 'Pra qual versão de JavaScript o tsc EMITE o código de saída. O bundler moderno roda com isso alto.',
    en: 'Which JavaScript version tsc EMITS output for. Modern bundlers run this high.' },
  { code: '"module": "ESNext", "moduleResolution": "bundler"', cat: 'tsconfig',
    pt: 'O par dos bundlers atuais (Vite/webpack): módulos ES padrão e resolução que entende package.json exports. É o padrão de projeto Vite.',
    en: 'The modern-bundler pair (Vite/webpack): standard ES modules and resolution that reads package.json exports. The default in Vite projects.' },
  { code: '"noEmit": true', cat: 'tsconfig',
    pt: 'Só checa tipos, não gera arquivo — o modo "lint de tipos". É o padrão quando o bundler (Vite/Babel) é quem transpila.',
    en: 'Type-check only, no files emitted — the "type lint" mode. The default when the bundler (Vite/Babel) does the transpiling.' },
  { code: '"jsx": "react-jsx"', cat: 'tsconfig',
    pt: 'Transformação JSX moderna: o runtime injeta sozinho, sem `import React` em todo arquivo .tsx.',
    en: 'Modern JSX transform: the runtime injects itself, no `import React` in every .tsx file.' },
  { code: '"paths": { "@/*": ["./src/*"] }', cat: 'tsconfig',
    pt: 'Aliases de import: `@/components` vira `./src/components`. O bundler precisa do mesmo mapeamento (vite resolve.alias); o tsc só checa.',
    en: 'Import aliases: `@/components` maps to `./src/components`. The bundler needs the same map (vite resolve.alias); tsc only type-checks.' },
  { code: 'npx tsc --noEmit --watch', cat: 'tsconfig',
    pt: 'Type-check contínuo: revalida a cada save. O "watch" do tsc — num terminal sempre aberto, evita o susto no build.',
    en: 'Continuous type-check: revalidates on every save. The tsc "watch" — in an always-open terminal, it avoids build-time surprises.' },

  // ─── Pegadinhas & dicas ─────────────────────────────────────────────────
  { code: 'const user = JSON.parse(text) as User;', cat: 'gotchas',
    pt: 'JSON.parse devolve `any`. O `as User` é um voto de confiança — campo faltando/errado quebra na execução. Pra segurança de verdade, valide.',
    en: 'JSON.parse returns `any`. `as User` is a trust vote — a wrong/missing field breaks at runtime. For real safety, validate.' },
  { code: 'const items: number[] = [];', cat: 'gotchas',
    pt: 'Array literal vazio infere `never[]` e depois reclama do push — anote o tipo quando o array começa vazio.',
    en: 'An empty array literal infers `never[]` and later complains on push — annotate the type when the array starts empty.' },
  { code: "const roles = ['admin', 'user'] as const;", cat: 'gotchas',
    pt: '`as const`: congela os literais — `roles[0]` vira o tipo `"admin"`, não `string`. O jeito de criar constantes que o type system respeita.',
    en: '`as const`: freezes literals — `roles[0]` becomes `"admin"` not `string`. How to make constants the type system respects.' },
  { code: "const STATUS = { DRAFT: 'draft', LIVE: 'live' } as const;\ntype Status = (typeof STATUS)[keyof typeof STATUS];",
    cat: 'gotchas',
    pt: 'O "enum sem enum": objeto `as const` + `keyof typeof` gera a união dos valores. É a recomendação moderna — enum numérico tem comportamento estranho com `===`.',
    en: 'The "enum without enum": `as const` object + `keyof typeof` yields the value union. The modern recommendation — numeric enums behave oddly with `===`.' },
  { code: "const keys = Object.keys(user) as (keyof User)[];", cat: 'gotchas',
    pt: 'Object.keys devolve `string[]` mesmo num objeto tipado — as chaves são strings pro runtime. O cast devolve a precisão (com a ressalva de props de prototype).',
    en: 'Object.keys returns `string[]` even on a typed object — keys are strings at runtime. The cast restores precision (mind prototype props).' },
  { code: 'const n = response?.data?.count ?? 0;', cat: 'gotchas',
    pt: '`?.` (optional chaining) + `??` (nullish): percorre um caminho que pode falhar em qualquer ponto e aplica default só pra null/undefined — sem "Cannot read impossible".',
    en: '`?.` (optional chaining) + `??` (nullish): walks a path that can fail anywhere and applies a default only to null/undefined — no "Cannot read impossible".' },
  { code: "type UserId = string & { readonly __brand: 'UserId' };\nconst toUserId = (id: string): UserId => id as UserId;",
    cat: 'gotchas',
    pt: 'Branding: marca de tipo invisível em runtime pra criar um tipo NOMINAL — `UserId` não se mistura com `string` onde `UserId` é esperado.',
    en: 'Branding: an invisible-in-runtime type marker to create a nominal type — `UserId` does not mix with plain `string` where `UserId` is expected.' },
  { code: "const config = { port: 3000, host: 'x' } satisfies Partial<Config>;", cat: 'gotchas',
    pt: '`satisfies` (TS 4.9): checa se a forma bate com o tipo SEM mudar o tipo inferido — `config.port` continua literal number, mas campo errado a mais acusa.',
    en: '`satisfies` (TS 4.9): checks the shape against a type WITHOUT replacing the inferred one — `config.port` stays a literal number, yet a wrong extra field errors.' },
  { code: 'const anything = data as unknown as string;', cat: 'gotchas',
    pt: 'Cast duplo `as unknown as T`: a fuga final pra tipos sem relação nenhuma. Funciona, mas admite que o type system perdeu o fio — documente o porquê.',
    en: 'Double cast `as unknown as T`: the final escape for unrelated types. It works, but it admits the type system lost the plot — document why.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de TypeScript',
    intro: (
      <>
        O JavaScript tipado: o superset que adiciona tipos, interfaces,{' '}
        genéricos e narrowing por cima do JS que já roda no browser —{' '}
        <Text code>tsc</Text> valida, o bundler transpila. Referência de{' '}
        <strong>linguagem de tipos</strong>, complementando o{' '}
        <Text code>javascript-cheatsheet</Text> (a linguagem base, sem tipos){' '}
        e o <Text code>python-cheatsheet</Text>, o "segundo idioma" que já vem{' '}
        com tipagem de graça.
      </>
    ),
    search: 'Buscar por trecho de código ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no TypeScript',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>strict é o produto.</Text> TypeScript bem configurado é a
          rede de segurança: <Text code>"strict": true</Text> liga o null-check
          e o <Text code>noImplicitAny</Text> que pegam a maioria dos bugs antes
          do deploy. Projeto novo nasce com strict ligado — "por que isso está
          vindo null?" quase sempre é um strict desligado em algum lugar.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Tipos são apagados.</Text> Não existem em runtime: o{' '}
          <Text code>typeof</Text> do código (JS de verdade) é diferente do{' '}
          <Text code>typeof</Text> do type-system, e <Text code>instanceof</Text>{' '}
          testa valores reais (classes), nunca <Text code>interface</Text>s. O
          que você escreve no nível de tipos some no bundle.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>any é contagioso.</Text>{' '}
          <Text code>JSON.parse</Text> devolve <Text code>any</Text> e tudo que
          toca nele "perde o tipo". A validação fica na fronteira (parse/fetch):
          anote ou valide ali, não espalhe <Text code>any</Text> pelo código.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Tipagem é estrutural.</Text> TS compara FORMAS, não
          nomes: dois objetos <Text code>{'{ name: string; age: number }'}</Text>{' '}
          são o mesmo <Text code>User</Text> mesmo sem herdar nada. Pra
          distinguir por identidade (ex.: <Text code>UserId</Text> ≠{' '}
          <Text code>string</Text>), os brand types entram em cena.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Interface vs type.</Text> Ambos funcionam; a convenção
          prática: <Text code>interface</Text> pra shapes públicos (herda e dá
          merge), <Text code>type</Text> pra unions, intersecções e mapped
          types — que interface não faz.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>tsc checa, o bundler constrói.</Text>{' '}
          <Text code>npx tsc --noEmit --watch</Text> num terminal sempre aberto
          é o type-checking contínuo — o erro aparece no save, não no deploy.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar trecho',
    copiedCode: 'Trecho copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'TypeScript Cheat Sheet',
    intro: (
      <>
        The typed JavaScript: the superset that adds types, interfaces, generics
        and narrowing on top of the JS that already runs in the browser —{' '}
        <Text code>tsc</Text> validates, the bundler transpiles. A{' '}
        <strong>type-level language</strong> reference, complementing the{' '}
        <Text code>javascript-cheatsheet</Text> (the base language, untyped) and
        the <Text code>python-cheatsheet</Text>, the "second language" that
        already ships with typing for free.
      </>
    ),
    search: 'Search by code snippet or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most in TypeScript',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>strict is the product.</Text> Well-configured TypeScript
          is the safety net: <Text code>"strict": true</Text> turns on the
          null-check and <Text code>noImplicitAny</Text> that catch most bugs
          before deploy. New projects are born strict — "why is this coming in
          as null?" is almost always a strict flag off somewhere.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Types are erased.</Text> They do not exist at runtime:
          the <Text code>typeof</Text> in code (real JS) differs from the{' '}
          <Text code>typeof</Text> of the type system, and{' '}
          <Text code>instanceof</Text> tests real values (classes), never{' '}
          <Text code>interface</Text>s. What you write at the type level
          disappears from the bundle.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>any is contagious.</Text>{' '}
          <Text code>JSON.parse</Text> returns <Text code>any</Text> and
          whatever touches it "loses type". Validation belongs at the boundary
          (parse/fetch): annotate or validate there, do not spread{' '}
          <Text code>any</Text> through the code.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Typing is structural.</Text> TS compares SHAPES, not
          names: two objects <Text code>{'{ name: string; age: number }'}</Text>{' '}
          are the same <Text code>User</Text> even without inheriting anything.
          To distinguish by identity (e.g. <Text code>UserId</Text> ≠{' '}
          <Text code>string</Text>), brand types come into play.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Interface vs type.</Text> Both work; the practical
          convention: <Text code>interface</Text> for public shapes (extends and
          merges), <Text code>type</Text> for unions, intersections and mapped
          types — which interfaces cannot do.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>tsc checks, the bundler builds.</Text>{' '}
          <Text code>npx tsc --noEmit --watch</Text> in an always-open terminal
          is continuous type-checking — the error shows on save, not at deploy.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy snippet',
    copiedCode: 'Snippet copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function TypescriptCheatsheetPage() {
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
    const header = '# TypeScript — cheat sheet\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```ts',
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
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<CodeOutlined />}
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