import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, RocketOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['components', 'state', 'refs', 'memo', 'context', 'forms', 'pitfalls']

const CATEGORY_COLOR = {
  components: 'blue',
  state: 'green',
  refs: 'cyan',
  memo: 'purple',
  context: 'magenta',
  forms: 'gold',
  pitfalls: 'red',
}

const labelOf = {
  components: { pt: 'Componentes & JSX', en: 'Components & JSX' },
  state: { pt: 'Estado & efeitos', en: 'State & effects' },
  refs: { pt: 'Refs & DOM', en: 'Refs & DOM' },
  memo: { pt: 'Memoização & performance', en: 'Memoization & performance' },
  context: { pt: 'Contexto & composição', en: 'Context & composition' },
  forms: { pt: 'Eventos & formulários', en: 'Events & forms' },
  pitfalls: { pt: 'Regras & armadilhas', en: 'Rules & pitfalls' },
}

const ITEMS = [
  // ─── Componentes & JSX ──────────────────────────────────────────────────
  { code: `function Greeting({ name }) {\n  return <h1>Olá, {name}!</h1>\n}`, cat: 'components',
    pt: 'Componentes são funções que recebem as props como objeto no primeiro argumento e retornam JSX. Nome em PascalCase para o JSX reconhecer como componente.',
    en: 'Components are functions that receive props as the first argument and return JSX. Name them in PascalCase so JSX treats them as components.' },
  { code: `export default function Card({ title, children }) {\n  return (\n    <div className="card">\n      <h3>{title}</h3>\n      {children}\n    </div>\n  )\n}`, cat: 'components',
    pt: 'export default permite importar sem chaves; children é o conteúdo digitado entre a tag de abertura e a de fechamento do componente.',
    en: 'export default lets you import without braces; children is the content typed between the component’s opening and closing tags.' },
  { code: `function Row() {\n  return (\n    <>\n      <td>Ana</td>\n      <td>27</td>\n    </>\n  )\n}`, cat: 'components',
    pt: 'Um componente precisa de UMA raiz; <>...</> (Fragment) agrupa filhos sem criar nó extra de DOM. Em lista, use <Fragment key=...>.',
    en: 'A component needs ONE root; <>...</> (Fragment) groups children without an extra DOM node. In lists, use <Fragment key=...>.' },
  { code: `const el = <p>{isAdmin ? 'Admin' : 'Usuário'}</p>`, cat: 'components',
    pt: 'JSX é açúcar de React.createElement — pode viver em variáveis, ternários, retornos e map, e ser composto à vontade.',
    en: 'JSX is sugar for React.createElement — it can live in variables, ternaries, returns and maps, and compose freely.' },
  { code: `<input type="text" value={name} disabled={isLoading} />`, cat: 'components',
    pt: 'Atributos JSX usam camelCase (className, htmlFor, onClick) e valores dinâmicos entre chaves; strings planas podem ir sem chaves.',
    en: 'JSX attributes use camelCase (className, htmlFor, onClick) and dynamic values in braces; plain strings can go without braces.' },
  { code: `{items.map((item) => (\n  <li key={item.id}>{item.name}</li>\n))}`, cat: 'components',
    pt: 'key é um identificador ESTÁVEL do item (id, não índice) usado pela reconciliação ao reordenar, inserir ou remover de listas.',
    en: 'key is a STABLE identifier of the item (id, not index) used by reconciliation when lists reorder, insert or remove.' },
  { code: `{isLoading ? <Spinner /> : <Content data={data} />}`, cat: 'components',
    pt: 'Renderização condicional inline com operador ternário; para "renderizar ou nada", prefira && com um booleano de verdade à esquerda.',
    en: 'Inline conditional rendering with the ternary operator; for "render or nothing", prefer && with a real boolean on the left.' },
  { code: `const style = { backgroundColor: '#fff', borderRadius: 8 }\n<div style={style}>...</div>`, cat: 'components',
    pt: 'A prop style recebe um objeto camelCase; números ganham px implícito (width: 8 vira 8px) para a maioria das propriedades.',
    en: 'The style prop takes a camelCase object; numbers get an implicit px (width: 8 becomes 8px) for most properties.' },

  // ─── Estado & efeitos ───────────────────────────────────────────────────
  { code: `const [count, setCount] = useState(0)`, cat: 'state',
    pt: 'O par [valor, setter] do estado local; o componente re-renderiza quando setCount muda o valor por referência.',
    en: 'The local state [value, setter] pair; the component re-renders when setCount changes the value by reference.' },
  { code: `setCount((prev) => prev + 1)`, cat: 'state',
    pt: 'Updater funcional quando o próximo valor depende do anterior — obrigatório dentro de intervalos e batches para não ler um valor velho.',
    en: 'Functional updater when the next value depends on the previous one — required inside intervals and batches to avoid stale reads.' },
  { code: `const [items] = useState(() => parseBig(localStorage.getItem('cart')))`, cat: 'state',
    pt: 'Inicialização preguiçosa: o initializer só roda na primeira renderização — ideal para parse/leitura caros.',
    en: 'Lazy initialization: the initializer only runs on the first render — great for expensive parsing/reads.' },
  { code: `useEffect(() => {\n  console.log('montou:', name)\n}, [name])`, cat: 'state',
    pt: 'Roda após o render quando as deps mudam; array vazio = apenas no mount. Todo valor usado dentro deve constar nas deps.',
    en: 'Runs after render when the deps change; an empty array = only on mount. Every value used inside must be listed in deps.' },
  { code: `useEffect(() => {\n  const id = setInterval(tick, 1000)\n  return () => clearInterval(id)\n}, [])`, cat: 'state',
    pt: 'O return é o cleanup: roda no unmount e antes do próximo efeito — é onde timers, listeners e subscriptions morrem.',
    en: 'The return is the cleanup: runs on unmount and before the next effect — where timers, listeners and subscriptions die.' },
  { code: `useEffect(() => {\n  let alive = true\n  fetch(url).then((r) => r.json()).then((d) => {\n    if (alive) setData(d)\n  })\n  return () => { alive = false }\n}, [url])`, cat: 'state',
    pt: 'Padrão de busca: a flag alive no cleanup evita setState num componente já desmontado quando a resposta chega atrasada.',
    en: 'Fetch pattern: the alive flag in cleanup prevents setState on an unmounted component when the response arrives late.' },
  { code: `const [state, dispatch] = useReducer(reducer, init)`, cat: 'state',
    pt: 'Estado com transições nomeadas por type — para máquinas de estado e lógica que você quer testar isolada do componente.',
    en: 'State with named transitions by type — for state machines and logic you want to test away from the component.' },
  { code: `useLayoutEffect(() => {\n  measureAndPosition()\n}, [])`, cat: 'state',
    pt: 'Igual ao useEffect, mas roda de forma SÍNCRONA antes do paint — para medir o DOM e evitar flicker (use raramente).',
    en: 'Like useEffect but runs SYNCHRONOUSLY before paint — for measuring the DOM and avoiding flicker (use rarely).' },

  // ─── Refs & DOM ─────────────────────────────────────────────────────────
  { code: `const inputRef = useRef(null)\n<input ref={inputRef} />\ninputRef.current.focus()`, cat: 'refs',
    pt: 'Contêiner mutável que NÃO dispara re-render; .current guarda o nó DOM quando usado como prop ref.',
    en: 'A mutable container that does NOT trigger re-renders; .current holds the DOM node when used as the ref prop.' },
  { code: `<input ref={(node) => { node?.focus() }} />`, cat: 'refs',
    pt: 'Ref como função recebe o nó no mount e null no unmount — útil quando a lógica precisa do nó imediatamente.',
    en: 'A ref as a function receives the node on mount and null on unmount — handy when logic needs the node right away.' },
  { code: `const Input = forwardRef((props, ref) => (\n  <input ref={ref} {...props} />\n))`, cat: 'refs',
    pt: 'Repassa o ref do pai para um nó interno — componentes de função precisam de forwardRef para receber ref (React 18).',
    en: 'Forwards the parent ref to an inner node — function components need forwardRef to accept a ref (React 18).' },
  { code: `useImperativeHandle(ref, () => ({\n  focus() { innerRef.current.focus() }\n}))`, cat: 'refs',
    pt: 'Expõe uma API controlada para o pai via ref — em vez de vazar o nó DOM inteiro.',
    en: 'Exposes one controlled API to the parent through the ref — instead of leaking the whole DOM node.' },
  { code: `const id = useId()\n<label htmlFor={id}>Nome</label>\n<input id={id} />`, cat: 'refs',
    pt: 'Gera um id único e estável (SSR-safe) — para vincular label/input e atributos aria-* sem colisão.',
    en: 'Generates a stable unique id (SSR-safe) — to link label/input and aria-* attributes without collisions.' },

  // ─── Memoização & performance ───────────────────────────────────────────
  { code: `const total = useMemo(\n  () => items.reduce((s, i) => s + i.price, 0),\n  [items]\n)`, cat: 'memo',
    pt: 'Guarda o RESULTADO de um cálculo caro e só recalcula quando as deps mudam; deps vazio calcula uma única vez.',
    en: 'Caches an expensive computation RESULT and only recomputes when deps change; empty deps compute once.' },
  { code: `const onSave = useCallback(() => save(draft), [draft])`, cat: 'memo',
    pt: 'Guarda uma FUNÇÃO estável — a mesma referência entre renders enquanto as deps não mudam; passe para filhos memoizados.',
    en: 'Caches a STABLE function — the same reference across renders while deps don’t change; pass it to memoized children.' },
  { code: `const Slow = memo(function Slow({ list }) {\n  return <ul>{list.map((x) => <li key={x}>{x}</li>)}</ul>\n})`, cat: 'memo',
    pt: 'Evita o re-render do componente quando as props (por referência) não mudam — combine com useCallback/useMemo nos props.',
    en: 'Skips the component re-render when its props (by reference) don’t change — pair it with useCallback/useMemo on props.' },
  { code: `const Dashboard = lazy(() => import('./Dashboard'))\n\n<Suspense fallback={<Spinner />}>\n  <Dashboard />\n</Suspense>`, cat: 'memo',
    pt: 'Code-splitting: o módulo só é baixado quando o componente renderiza pela primeira vez; fallback é o estado de loading.',
    en: 'Code-splitting: the module downloads only when the component first renders; fallback is the loading state.' },
  { code: `const q = useDeferredValue(query)`, cat: 'memo',
    pt: 'Mantém um valor um passo atrás da digitação — uma lista grande filtra em segundo plano sem travar o input.',
    en: 'Keeps a value one step behind typing — a big list filters in the background without freezing the input.' },
  { code: `const [isPending, startTransition] = useTransition()\nstartTransition(() => setTab('users'))`, cat: 'memo',
    pt: 'Marca a atualização como não urgente — a UI segue responsiva; isPending sinaliza o trabalho em andamento.',
    en: 'Marks an update as non-urgent — the UI stays responsive; isPending signals the ongoing work.' },

  // ─── Contexto & composição ──────────────────────────────────────────────
  { code: `const Theme = createContext('light')\n\n<Theme.Provider value={theme}>\n  <App />\n</Theme.Provider>\n\nconst theme = useContext(Theme)`, cat: 'context',
    pt: 'Estado "global" sem prop drilling: o Provider injeta o value e qualquer descendente lê com useContext.',
    en: '"Global" state without prop drilling: the Provider injects the value and any descendant reads it with useContext.' },
  { code: `const CounterCtx = createContext(null)\n\nfunction App() {\n  return (\n    <CounterCtx.Provider value={useState(0)}>\n      <Widget />\n    </CounterCtx.Provider>\n  )\n}`, cat: 'context',
    pt: 'O value pode ser o próprio par de useState — um único hook no provider serve a árvore inteira.',
    en: 'The value can be the useState pair itself — a single hook in the provider serves the whole tree.' },
  { code: `const value = useMemo(() => ({ theme, toggle }), [theme, toggle])\n\n<Theme.Provider value={value}>\n  <App />\n</Theme.Provider>`, cat: 'context',
    pt: 'Sem useMemo, um objeto novo a cada render re-renderiza TODOS os consumidores — o value precisa ser estável.',
    en: 'Without useMemo, a fresh object each render re-renders EVERY consumer — the value must be stable.' },
  { code: `function Layout({ children }) {\n  return <div className="shell">{children}</div>\n}`, cat: 'context',
    pt: 'Composição: o pai decide o conteúdo e os filhos recebem props — a forma mais simples e mais comum de compor componentes.',
    en: 'Composition: the parent decides the content and children receive props — the simplest, most common way to compose.' },
  { code: `const Item = ({ children }) => <li>{children}</li>\nList.Item = Item\n\n// uso: <List.Item>Pão</List.Item>`, cat: 'context',
    pt: 'Atribuir subcomponentes como propriedade do pai cria a API estilo Menu.Item / Card.Body usada pelo Ant Design.',
    en: 'Attaching subcomponents as parent properties creates the Menu.Item / Card.Body-style API used by Ant Design.' },
  { code: `import { createPortal } from 'react-dom'\n\ncreatePortal(<Modal />, document.body)`, cat: 'context',
    pt: 'Renderiza o JSX dentro de OUTRO nó do DOM (modais, tooltips) sem sair da árvore do React.',
    en: 'Renders the JSX inside ANOTHER DOM node (modals, tooltips) without leaving the React tree.' },
  { code: `class Boundary extends Component {\n  static getDerivedStateFromError() {\n    return { hasError: true }\n  }\n  render() {\n    return this.state.hasError ? <Fallback /> : this.props.children\n  }\n}`, cat: 'context',
    pt: 'Captura erros de render dos filhos e mostra um fallback — só funciona como class component (não existe hook).',
    en: 'Catches children render errors and shows a fallback — only works as a class component (no hook exists).' },

  // ─── Eventos & formulários ──────────────────────────────────────────────
  { code: `<button onClick={() => setCount((c) => c + 1)}>+1</button>`, cat: 'forms',
    pt: 'Handlers recebem o SyntheticEvent; para atualizar com base no valor anterior, use o updater funcional dentro do handler.',
    en: 'Handlers receive the SyntheticEvent; to update from a previous value, use the functional updater inside the handler.' },
  { code: `function onSubmit(e) {\n  e.preventDefault()\n  save(values)\n}\n\n<form onSubmit={onSubmit}>...</form>`, cat: 'forms',
    pt: 'O formulário HTML recarrega a página por padrão — o onSubmit precisa chamar e.preventDefault() antes de salvar.',
    en: 'An HTML form reloads the page by default — onSubmit must call e.preventDefault() before saving.' },
  { code: `const [name, setName] = useState('')\n<input value={name} onChange={(e) => setName(e.target.value)} />`, cat: 'forms',
    pt: 'O React é a fonte da verdade: value vem do estado e onChange devolve o novo texto.',
    en: 'React is the source of truth: value comes from state and onChange returns the new text.' },
  { code: `<input defaultValue="Ana" />`, cat: 'forms',
    pt: 'defaultValue define o valor INICIAL; depois o campo fica não controlado e o navegador guarda o texto.',
    en: 'defaultValue sets the INITIAL value; afterwards the field is uncontrolled and the browser keeps the text.' },
  { code: `<input type="checkbox" checked={isOn} onChange={(e) => setIsOn(e.target.checked)} />`, cat: 'forms',
    pt: 'Checkbox usa checked + e.target.checked (não value) — a mesma regra vale para radio.',
    en: 'Checkbox uses checked + e.target.checked (not value) — the same rule applies to radios.' },
  { code: `<select value={plan} onChange={(e) => setPlan(e.target.value)}>\n  <option value="free">Grátis</option>\n  <option value="pro">Pro</option>\n</select>`, cat: 'forms',
    pt: 'Select controlado: value é o option selecionado e onChange devolve o value do option clicado.',
    en: 'Controlled select: value is the selected option and onChange returns the clicked option’s value.' },
  { code: `<button onClick={(e) => {\n  e.stopPropagation()\n  doThing()\n}}>Ok</button>`, cat: 'forms',
    pt: 'e.stopPropagation() impede o evento de subir para os handlers dos pais — cliques no modal não vazam para o backdrop.',
    en: 'e.stopPropagation() stops the event from bubbling to parent handlers — modal clicks don’t leak to the backdrop.' },

  // ─── Regras & armadilhas ────────────────────────────────────────────────
  { code: `if (cond) {\n  useSomething() // hooks fora do topo\n}`, cat: 'pitfalls',
    pt: 'Hooks só no TOPO do componente — nunca dentro de if/loops/funções aninhadas; a ordem entre renders precisa ser idêntica.',
    en: 'Hooks only at the TOP of the component — never inside if/loops/nested functions; the order must be identical across renders.' },
  { code: `setUser({ ...user, name: 'Ana' })\n// user.name = 'Ana'; setUser(user)`, cat: 'pitfalls',
    pt: 'Estado é IMUTÁVEL — sempre crie objeto/array novo; mutar e setar a mesma referência não re-renderiza.',
    en: 'State is IMMUTABLE — always create a fresh object/array; mutating and setting the same reference won’t re-render.' },
  { code: `// const [isAdult, setIsAdult] = useState(false)\nconst isAdult = age >= 18`, cat: 'pitfalls',
    pt: 'Não duplique estado que dá para derivar — calcule na renderização; sincronizar com useEffect é anti-padrão.',
    en: 'Don’t duplicate state you can derive — compute during render; syncing it with useEffect is an anti-pattern.' },
  { code: `useEffect(() => {\n  setCount(count + 1) // sem deps: loop\n})`, cat: 'pitfalls',
    pt: 'Efeito que seta estado sem deps (ou com deps que mudam a cada render) entra em loop infinito — SEMPRE dê deps.',
    en: 'An effect that sets state without deps (or with deps that change every render) loops forever — ALWAYS give deps.' },
  { code: `useEffect(() => {\n  const id = setInterval(() => setCount((c) => c + 1), 1000)\n  return () => clearInterval(id)\n}, [])`, cat: 'pitfalls',
    pt: 'Intervalos capturam o valor ANTIGO da variável — leia o estado com o updater funcional em vez de dentro do timer.',
    en: 'Intervals capture the OLD variable value — read state with the functional updater instead of inside the timer.' },
  { code: `const [show, setShow] = useState(false)\n\nconst counter = useRef(0)`, cat: 'pitfalls',
    pt: 'useState re-renderiza quando muda; useRef não. Ref é para dados que o render não exibe.',
    en: 'useState re-renders when it changes; useRef doesn’t. Refs are for data the render doesn’t display.' },
  { code: `// options é objeto novo a cada render\nuseEffect(() => {\n  fetch(url, options)\n}, [options])`, cat: 'pitfalls',
    pt: 'Objeto/array criado no render quebra a comparação de deps — memoize com useMemo/useCallback ou dependa de primitivos.',
    en: 'An object/array created during render breaks the deps comparison — memoize with useMemo/useCallback or depend on primitives.' },
  { code: `setCount(0)\nconsole.log(count) // valor antigo!`, cat: 'pitfalls',
    pt: 'setState agenda (batches) — a variável só atualiza no próximo render; leia o valor real dentro do render.',
    en: 'setState schedules (batches) — the variable only updates on the next render; read the real value inside the render.' },
  { code: `<StrictMode>\n  <App />\n</StrictMode>`, cat: 'pitfalls',
    pt: 'Em dev, monta/desmonta componentes 2x para expor effects sem cleanup e código impuro — é o comportamento intencional.',
    en: 'In dev, it mounts/unmounts components 2x to expose effects without cleanup and impure code — that’s the intended behavior.' },
  { code: `{items.map((item, i) => (\n  <Row key={i} item={item} /> // índice\n))}`, cat: 'pitfalls',
    pt: 'Índice como key quebra quando a lista reordena ou insere no meio — o React reutiliza o estado do item errado.',
    en: 'Index as key breaks when the list reorders or inserts in the middle — React reuses the wrong item’s state.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de React 18',
    intro: (
      <>
        Referência pesquisável do <Text code>React</Text> 18 — a biblioteca em
        que o próprio devtools é construído. Cada entrada tem um snippet
        pronto pra colar e a explicação do que ele faz. Complementa o{' '}
        <Text code>/references/javascript-cheatsheet</Text> (a linguagem base)
        e o <Text code>/references/typescript-cheatsheet</Text> (a tipagem) —
        nenhum dos dois cobre a biblioteca em si — e o{' '}
        <Text code>/references/js-testing-cheatsheet</Text>, que testa
        componentes mas não ensina os hooks.
      </>
    ),
    search: 'Buscar por código, hook ou descrição...',
    all: 'Todos',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'As regras que evitam 90% dos bugs',
    tipBody: (
      <>
        <Text code>Rules of Hooks</Text>: hooks apenas no topo do componente,
        sempre na mesma ordem — nunca em if/loops/funções. <Text code>Deps</Text>:
        todo valor usado dentro do efeito deve estar no array de deps; um
        efeito que seta estado sem deps (ou com deps que mudam a cada render)
        vira loop infinito — o sintoma clássico de "feature travada" com build
        passando. <Text code>Imutabilidade</Text>: nunca mude o
        objeto/array do estado; crie um novo e setele. E as deps são
        comparadas por referência — um objeto criado a cada render quebra o
        efeito mesmo com o mesmo conteúdo (memoize com{' '}
        <Text code>useMemo</Text>/<Text code>useCallback</Text>).
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
    title: 'React 18 Cheat Sheet',
    intro: (
      <>
        A searchable reference for <Text code>React</Text> 18 — the library
        this very devtools is built on. Each entry has a ready-to-paste
        snippet and an explanation of what it does. It complements the{' '}
        <Text code>/references/javascript-cheatsheet</Text> (the base
        language) and <Text code>/references/typescript-cheatsheet</Text>{' '}
        (the types) — neither covers the library itself — and the{' '}
        <Text code>/references/js-testing-cheatsheet</Text>, which tests
        components but doesn’t teach the hooks.
      </>
    ),
    search: 'Search by code, hook or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'The rules that avoid 90% of the bugs',
    tipBody: (
      <>
        <Text code>Rules of Hooks</Text>: hooks only at the top of the
        component, always in the same order — never in if/loops/functions.{' '}
        <Text code>Deps</Text>: every value used inside the effect belongs in
        the deps array; an effect that sets state without deps (or with deps
        that change every render) becomes an infinite loop — the classic
        "feature looks frozen while the build passes" symptom.{' '}
        <Text code>Immutability</Text>: never mutate the state object/array;
        create a new one and set it. And deps compare by reference — an
        object created every render breaks the effect even with the same
        content (memoize with <Text code>useMemo</Text>/
        <Text code>useCallback</Text>).
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

export default function ReactCheatsheetPage() {
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
    const header = '# React 18 (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```jsx',
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
        icon={<RocketOutlined />}
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