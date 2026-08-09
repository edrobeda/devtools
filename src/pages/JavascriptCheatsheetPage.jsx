import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ApartmentOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'strings', 'arrays', 'objects', 'functions', 'async', 'modules', 'collections', 'numbers']

const CATEGORY_COLOR = {
  basics: 'blue',
  strings: 'cyan',
  arrays: 'geekblue',
  objects: 'purple',
  functions: 'magenta',
  async: 'green',
  modules: 'volcano',
  collections: 'orange',
  numbers: 'gold',
}

const labelOf = {
  basics: { pt: 'Variáveis & Escopo', en: 'Variables & Scope' },
  strings: { pt: 'Strings & Templates', en: 'Strings & Templates' },
  arrays: { pt: 'Arrays', en: 'Arrays' },
  objects: { pt: 'Objetos', en: 'Objects' },
  functions: { pt: 'Funções & Arrow', en: 'Functions & Arrow' },
  async: { pt: 'Async & Promises', en: 'Async & Promises' },
  modules: { pt: 'Módulos & Import', en: 'Modules & Import' },
  collections: { pt: 'Coleções (Map/Set)', en: 'Collections (Map/Set)' },
  numbers: { pt: 'Números & Utilidades', en: 'Numbers & Utilities' },
}

const ITEMS = [
  // ─── Variáveis & Escopo ────────────────────────────────────────────────
  { code: 'const TAXA = 0.2;', cat: 'basics', pt: 'const: vínculo constante, jamais reatribuível. O objeto ao qual ele aponta continua mutável.', en: 'const: a constant binding that can never be reassigned. The object it points to stays mutable.' },
  { code: 'let score = 0;\nscore += 10;', cat: 'basics', pt: 'let: variável reatribuível com escopo de bloco ({}). É o substituto do var no dia a dia.', en: 'let: a reassignable, block-scoped variable. It is the everyday replacement for var.' },
  { code: 'const msg = value ?? "padrão";', cat: 'basics', pt: 'Coalescência nula (??): usa o padrão somente se a esquerda for null/undefined. 0, "" e false passam de verdade.', en: 'Nullish coalescing (??): uses the fallback only when the left side is null/undefined. 0, "" and false pass through.' },
  { code: 'const cidade = endereco?.cidade;', cat: 'basics', pt: 'Encadeamento opcional (?.): retorna undefined em vez de lançar erro quando algum passo do caminho é nulo.', en: 'Optional chaining (?.): returns undefined instead of throwing when any step in the path is null.' },
  { code: '[b, a] = [a, b];', cat: 'basics', pt: 'Troca duas variáveis sem variável temporária, usando destructuring na atribuição.', en: 'Swap two variables with no temporary variable, using destructuring assignment.' },
  { code: 'const ticket = qtd >= 5 ? "vip" : "comum";', cat: 'basics', pt: 'Operador ternário: expressão condicional em uma linha, que ainda devolve um valor.', en: 'Ternary: a one-line conditional expression that also yields a value.' },
  { code: 'const total = (a ?? 0) + (b ?? 0);', cat: 'basics', pt: '?? junto de aritmética: transforma um possível undefined em número sem a coerção de ==.', en: '?? inside a calculation: turns a possible undefined into a number without coercive ==.' },

  // ─── Strings & Templates ───────────────────────────────────────────────
  { code: 'const saudacao = `Olá, ${nome}!`;', cat: 'strings', pt: 'Template literal: interpolação direta de variáveis entre crases com ${...}.', en: 'Template literal: interpolate variables straight inside backticks with ${...}.' },
  { code: 'const bloco = `\n  linha 1\n  linha 2\n`;', cat: 'strings', pt: 'Template literal multilinha: o texto escrito entre as crases preserva as quebras de linha.', en: 'Multi-line template literal: everything written between the backticks keeps its line breaks.' },
  { code: '"banana".includes("ana"); // true', cat: 'strings', pt: 'includes: checagem direta de substring, sem truque de indexOf negativo nem regex.', en: 'includes: direct substring check, no indexOf === -1 tricks and no regex.' },
  { code: '"a-b-c".replaceAll("-", "/"); // "a/b/c"', cat: 'strings', pt: 'replaceAll troca todas as ocorrências; o replace antigo só trocava a primeira.', en: 'replaceAll replaces every occurrence. The old replace only replaced the first one.' },
  { code: '"7".padStart(3, "0"); // "007"', cat: 'strings', pt: 'padStart/padEnd alinham um texto a um tamanho mínimo, completando com um caractere.', en: 'padStart/padEnd pad a string to a minimum width with a filler character.' },
  { code: 'const partes = "a,b,c".split(",");', cat: 'strings', pt: 'split quebra a string em um array pelo separador; junte de volta com join.', en: 'split breaks a string on a separator into an array; join brings it back together.' },
  { code: 'texto.trim().toLowerCase();', cat: 'strings', pt: 'Combo padrão antes de comparar/validar: aparar os espaços das pontas e normalizar a caixa.', en: 'The standard pre-compare combo: trim edge whitespace and normalize the case.' },

  // ─── Arrays ────────────────────────────────────────────────────────────
  { code: 'nums.map((n) => n * 2); // [2, 4, 6]', cat: 'arrays', pt: 'map: cria um array novo do mesmo tamanho, transformando cada elemento.', en: 'map: builds a same-length array, transforming every element.' },
  { code: 'nums.filter((n) => n % 2 === 0); // só os pares', cat: 'arrays', pt: 'filter: mantém apenas os elementos que passam no teste, também em um array novo.', en: 'filter: keeps only the elements that pass the test, in a new array.' },
  { code: 'nums.reduce((acc, n) => acc + n, 0); // soma', cat: 'arrays', pt: 'reduce: reduz o array a um único valor acumulando elemento a elemento. Sem valor inicial usa o primeiro e falha em array vazio.', en: 'reduce: folds the array into one accumulated value. With no seed it uses the first element and throws on an empty array.' },
  { code: 'users.find((u) => u.id === 10);', cat: 'arrays', pt: 'find: retorna o PRIMEIRO elemento que casa, ou undefined se ninguém casa.', en: 'find: returns the FIRST matching element, or undefined if none matches.' },
  { code: 'nums.some((n) => n > 100); // true se ao menos 1', cat: 'arrays', pt: 'some: true se pelo menos um elemento passar no teste. every: true só se TODOS passarem.', en: 'some: true if at least one element passes. every: true only if ALL of them pass.' },
  { code: 'matrix.flat(Infinity); // achata em qualquer profundidade', cat: 'arrays', pt: 'flat achata um nível por padrão; Infinity achata tudo. flatMap mapeia e achata em um passo só.', en: 'flat flattens one level by default; Infinity flattens all. flatMap maps and flattens in one step.' },
  { code: '[...new Set(nums)]; // remove duplicatas', cat: 'arrays', pt: 'Espalhar um Set em um array novo elimina duplicatas preservando a ordem.', en: 'Spreading a Set into a fresh array drops duplicates while keeping order.' },
  { code: 'nums.sort((a, b) => a - b); // numérico crescente', cat: 'arrays', pt: 'sort sem comparador compara como STRING, então [10, 9] vira [10, 9]. O comparador numérico corrige.', en: 'sort without a comparator compares as strings, so [10, 9] becomes [10, 9]. The numeric comparator fixes it.' },
  { code: 'const copia = [...nums];', cat: 'arrays', pt: 'Spread (...) copia por nível. Arrays/objetos aninhados seguem compartilhados — veja o snippet deepClone.', en: 'Spread (...) copies shallowly. Nested arrays/objects are still shared — see the deepClone snippet.' },
  { code: 'Array.from({ length: 5 }, (_, i) => i); // [0, 1, 2, 3, 4]', cat: 'arrays', pt: 'Array.from com map embutido: cria sequências numéricas e converte iteráveis em array.', en: 'Array.from with a built-in map: generates numeric sequences and turns iterables into arrays.' },
  { code: 'arr.at(-1); // último elemento', cat: 'arrays', pt: 'at aceita índice negativo, dispensando o clássico arr[arr.length - 1].', en: 'at accepts negative indices, no more arr[arr.length - 1].' },

  // ─── Objetos ───────────────────────────────────────────────────────────
  { code: 'const { name, age } = user;', cat: 'objects', pt: 'Destructuring: extrai propriedades em variáveis de mesmo nome.', en: 'Destructuring: assigns properties to variables with the same name.' },
  { code: 'const { name: label } = user;', cat: 'objects', pt: 'Dá para renomear na desestruturação: nome original : novo nome.', en: 'You can rename during destructuring: original name : new name.' },
  { code: 'const merged = { ...a, ...b }; // b sobrescreve a', cat: 'objects', pt: 'Spread em objeto copia as propriedades; em conflito, o último spread vence.', en: 'Object spread copies properties; on conflict, the later spread wins.' },
  { code: 'const key = "email";\nconst o = { [key]: addr };', cat: 'objects', pt: 'Chave computada: o nome da propriedade pode vir de uma variável entre colchetes.', en: 'Computed keys: the property name can come from a variable in brackets.' },
  { code: 'Object.entries(user); // [["name", "Ada"], ...]', cat: 'objects', pt: 'entries devolve um array de pares [chave, valor]; keys/values devolvem só um lado.', en: 'entries returns [key, value] pairs; keys/values return just one side.' },
  { code: 'Object.fromEntries([["a", 1]]); // { a: 1 }', cat: 'objects', pt: 'fromEntries é o inverso de entries: pares de volta em objeto (ex.: a partir de um Map).', en: 'fromEntries is the reverse of entries: pairs back into an object (e.g. from a Map).' },
  { code: 'const user = { nome, email }; // shorthand', cat: 'objects', pt: 'Shorthand: quando a variável tem o mesmo nome da chave, escreve só o nome.', en: 'Shorthand: when the variable name matches the key, write just the name.' },
  { code: 'delete obj.cache;', cat: 'objects', pt: 'delete remove uma propriedade do objeto (não libera variável let/const).', en: 'delete removes a property from an object (it does not free a let/const variable).' },

  // ─── Funções & Arrow ───────────────────────────────────────────────────
  { code: 'const add = (a, b) => a + b; // retorno implícito', cat: 'functions', pt: 'Arrow: corpo de uma expressão só retorna o valor dela, sem return explícito.', en: 'Arrow: a single-expression body implicitly returns its value.' },
  { code: 'users.map((u) => ({ name: u.name }));', cat: 'functions', pt: 'Para retornar OBJETO de uma arrow de expressão única, embrulhe em parênteses: ({ ... }).', en: 'To return an OBJECT from a single-expression arrow, wrap it in parens: ({ ... }).' },
  { code: 'function f(a = 1, b = 2) { return a + b; }', cat: 'functions', pt: 'Parâmetros padrão entram em vigor quando o argumento é undefined ("" não conta).', en: 'Default parameters apply when the argument is undefined (" does not count).' },
  { code: 'function sum(...nums) { return nums.reduce((acc, n) => acc + n, 0); }', cat: 'functions', pt: 'Parâmetro rest (...) coleta os argumentos restantes em um array real, com métodos.', en: 'Rest parameters gather trailing arguments into a real array, with methods.' },
  { code: 'const store = { total: 0, add() { this.total += 1; } };', cat: 'functions', pt: 'Method shorthand: um membro vira uma função que preserva o this do objeto.', en: 'Method shorthand: an object member becomes a method that keeps the object as this.' },
  { code: 'setTimeout(() => { /* this herda o escopo de fora */ }, 1000);', cat: 'functions', pt: 'Arrow não tem this próprio: herda o do escopo onde nasceu, por isso é o this certo dentro do setTimeout.', en: 'Arrows have no own this: they inherit the enclosing scope, so the arrow inside setTimeout sees the correct this.' },

  // ─── Async & Promises ──────────────────────────────────────────────────
  { code: 'async function getUser(id) {\n  const res = await fetch("/api/users/" + id);\n  return res.json();\n}', cat: 'async', pt: 'async/await: código assíncrono com cara de síncrono, sequenciado com await.', en: 'async/await: asynchronous code that reads top to bottom, sequenced with await.' },
  { code: 'const [a, b] = await Promise.all([pa, pb]);', cat: 'async', pt: 'Promise.all dispara as duas em paralelo e espera ambas. Se uma rejeita, tudo rejeita.', en: 'Promise.all runs both in parallel and resolves with both. If one rejects, all rejects.' },
  { code: 'try {\n  await work();\n} catch (err) {\n  console.error(err);\n}', cat: 'async', pt: 'try/catch normal dentro de async/await captura a promise rejeitada.', en: 'Regular try/catch inside async/await catches a rejected promise.' },
  { code: 'const results = await Promise.allSettled(promises);', cat: 'async', pt: 'allSettled nunca rejeita: cada item vira {status: "fulfilled"|"rejected", value|reason}.', en: 'allSettled never rejects: each item becomes {status: "fulfilled"|"rejected", value|reason}.' },
  { code: 'const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));', cat: 'async', pt: 'Helper clássico para pausar a execução com await delay(500).', en: 'The classic helper to pause execution with await delay(500).' },

  // ─── Módulos & Import ──────────────────────────────────────────────────
  { code: 'import { format, date } from "./utils.js";', cat: 'modules', pt: 'Import nomeado: usa só o que precisa, o que ajuda o tree-shaking.', en: 'Named import: take only what you need, which helps tree-shaking.' },
  { code: 'import Card from "./Card.js";', cat: 'modules', pt: 'Import default: traz o export default daquele módulo.', en: 'Default import: the default export of that module.' },
  { code: 'export const VERSION = "1.0"; // export nomeado', cat: 'modules', pt: 'Export nomeado declarado inline com o valor.', en: 'A named export declared inline with the value.' },
  { code: 'const mod = await import("./heavy.js"); // baixado só ao usar', cat: 'modules', pt: 'Dynamic import: o módulo só é baixado no primeiro uso — code splitting automático.', en: 'Dynamic import: the module is fetched only when used — automatic code splitting.' },

  // ─── Coleções (Map/Set) ────────────────────────────────────────────────
  { code: 'const cache = new Map();\ncache.set("chave", 1);\ncache.get("chave"); // 1', cat: 'collections', pt: 'Map: chave-valor de verdade (qualquer tipo de chave), get/set O(1) e na ordem de inserção.', en: 'Map: a true key-value store (any key type), O(1) get/set, insertion-ordered.' },
  { code: 'const seen = new Set(ids);\nseen.has("abc"); // O(1)', cat: 'collections', pt: 'Set: conjunto sem duplicatas com has O(1), ótimo para checagem de ocorrência.', en: 'Set: a duplicate-free collection with O(1) membership checking.' },
  { code: '10n + 5n; // 15n — BigInt', cat: 'collections', pt: 'BigInt: inteiros arbitrariamente grandes, literal termina em n. Faça cast antes de misturar com Number.', en: 'BigInt: arbitrary precision integers, noted with a trailing n. Cast before mixing with Number.' },
  { code: 'crypto.randomUUID(); // uuid v4', cat: 'collections', pt: 'crypto.randomUUID gera um UUID v4 nativo, sem dependência nenhuma.', en: 'crypto.randomUUID produces a native v4 UUID, with no dependency at all.' },

  // ─── Números & Utilidades ──────────────────────────────────────────────
  { code: 'Number.isNaN(x); // não coage — isNaN global coage', cat: 'numbers', pt: 'isNaN global coage o valor (string "3" não é NaN pra ele); Number.isNaN só aceita NaN de verdade.', en: 'Global isNaN coerces the value (so the string "3" passes); Number.isNaN only matches a real NaN.' },
  { code: 'parseInt("0xFF", 16); // 255', cat: 'numbers', pt: 'parseInt/parseFloat aceitam um argumento de base; sem ele alguns formatos ficam ambíguos.', en: 'parseInt/parseFloat take a radix argument; without it some formats are ambiguous.' },
  { code: '(1.337).toFixed(2); // "1.34"', cat: 'numbers', pt: 'toFixed arredonda e devolve string — cuidado: arredonda o binário, não o decimal (1.005 vira "1.00").', en: 'toFixed rounds and returns a string. Note it rounds the binary value, not the decimal (1.005 becomes "1.00").' },
  { code: 'Math.floor(10.9); // 10', cat: 'numbers', pt: 'floor/ceil/round para baixo, para cima e para o mais próximo; Math.trunc corta a fração sem arredondar.', en: 'floor/ceil/round go down, up and to the nearest; Math.trunc chops the fraction without rounding.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de JavaScript (ES6+)',
    intro: (
      <>
        Referência pesquisável dos recursos modernos do JavaScript que você
        usa todo dia — destructuring, arrow, spread, async/await, Map/Set e
        os métodos modernos de string/array. Cada entrada traz o código
        pronto e a descrição.
      </>
    ),
    search: 'Buscar por código, nome ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Armadilhas que valem ouro',
    tipBody: (
      <>
        <Text code>sort()</Text> compara como string por padrão:{' '}
        <Text code>[10, 9].sort()</Text> devolve{' '}
        <Text code>[10, 9]</Text>, não <Text code>[9, 10]</Text> — passe o
        comparador numérico. Arrow function não tem <Text code>this</Text>{' '}
        próprio: herda do escopo onde é definida, então para método de objeto
        prefira <Text code>function</Text> normal. <Text code>==</Text> coage
        tipos (<Text code>null == undefined</Text>), use <Text code>===</Text>.
        <Text code>let</Text>/<Text code>const</Text> ficam em "zona morta
        temporal": usar antes da declaração estoura <Text code>ReferenceError</Text>.
        E spread ( <Text code>[...arr]</Text>, <Text code>{'{ ...obj }'}</Text> )
        é cópia rasa — objetos aninhados continuam compartilhados.
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar código',
    copiedCode: 'Código copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'JavaScript Cheat Sheet (ES6+)',
    intro: (
      <>
        A searchable reference of the JavaScript features you use every day —
        destructuring, arrow functions, spread, async/await, Map, Set and the
        modern string/array methods. Each entry has the code and the
        description.
      </>
    ),
    search: 'Search by code, feature name or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'Gotchas worth their weight in gold',
    tipBody: (
      <>
        <Text code>sort()</Text> compares as strings by default:{' '}
        <Text code>[10, 9].sort()</Text> returns <Text code>[10, 9]</Text>,
        not <Text code>[9, 10]</Text> — always pass a numeric comparator.
        Arrow functions have no own <Text code>this</Text>; they inherit the
        enclosing scope, so use a regular <Text code>function</Text> for
        object methods. <Text code>==</Text> coerces types (
        <Text code>null == undefined</Text>), prefer <Text code>===</Text>.
        <Text code>let</Text>/<Text code>const</Text> live in a "temporal dead
        zone" until declared <Text code>ReferenceError</Text>. And spread (
        <Text code>[...arr]</Text>, <Text code>{'{ ...obj }'}</Text>) only
        copies shallowly — nested values are still shared.
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy code',
    copiedCode: 'Code copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function JavascriptCheatsheetPage() {
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
    const header = '# JavaScript (ES6+)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```js',
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
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<ApartmentOutlined />}
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