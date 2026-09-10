import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'setup',
  'template',
  'directives',
  'reactivity',
  'props',
  'lifecycle',
  'components',
  'composables',
  'router',
  'pinia',
  'misc',
]

const CATEGORY_COLOR = {
  cli: 'cyan',
  setup: 'green',
  template: 'blue',
  directives: 'geekblue',
  reactivity: 'magenta',
  props: 'purple',
  lifecycle: 'orange',
  components: 'gold',
  composables: 'volcano',
  router: 'lime',
  pinia: 'cyan',
  misc: 'default',
}

const labelOf = {
  cli: { pt: 'CLI & scaffolding', en: 'CLI & scaffolding' },
  setup: { pt: 'script setup & API', en: 'script setup & API' },
  template: { pt: 'Sintaxe de template', en: 'Template syntax' },
  directives: { pt: 'Diretivas', en: 'Directives' },
  reactivity: { pt: 'Reatividade', en: 'Reactivity' },
  props: { pt: 'Props & emissões', en: 'Props & emits' },
  lifecycle: { pt: 'Ciclo de vida', en: 'Lifecycle' },
  components: { pt: 'Componentes & slots', en: 'Components & slots' },
  composables: { pt: 'Composables', en: 'Composables' },
  router: { pt: 'Vue Router', en: 'Vue Router' },
  pinia: { pt: 'Pinia', en: 'Pinia' },
  misc: { pt: 'Gotchas & utilidades', en: 'Gotchas & utilities' },
}

const COMMANDS = [
  // ─── CLI & scaffolding ────────────────────────────────────────────────────
  { cmd: 'npm create vue@latest', cat: 'cli', pt: 'Cria um projeto com create-vue (Vite + script setup + ferramentas opcionais)', en: 'Scaffolds a project with create-vue (Vite + script setup + optional tools)' },
  { cmd: 'npm create vite@latest meu-app -- --template vue', cat: 'cli', pt: 'Projeto mínimo Vue via Vite, sem respostas interativas', en: 'Minimal Vue project via Vite, no interactive prompts' },
  { cmd: 'npm run dev', cat: 'cli', pt: 'Sobe o servidor de desenvolvimento com HMR', en: 'Starts the dev server with HMR' },
  { cmd: 'npm run build', cat: 'cli', pt: 'Empacota para produção (npx preview para testar o build)', en: 'Builds for production (npx preview to test the build)' },
  { cmd: 'npx vue-tsc --noEmit', cat: 'cli', pt: 'Checagem de tipos de arquivos .vue (com vue-tsc instalado)', en: 'Type-checks .vue files (with vue-tsc installed)' },
  { cmd: 'vue --version / @vue/cli', cat: 'cli', pt: 'Vue CLI (legado) — projetos novos preferem Vite + create-vue', en: 'Vue CLI (legacy) — new projects prefer Vite + create-vue' },
  { cmd: 'npm install pinia vue-router', cat: 'cli', pt: 'Adiciona o state manager e o roteador oficiais', en: 'Adds the official store and router' },

  // ─── script setup & API ───────────────────────────────────────────────────
  { cmd: '<script setup>', cat: 'setup', pt: 'Modo recomendado: imports/top-level viram automaticamente disponíveis no template', en: 'Recommended mode: imports/top-level are automatically exposed to the template' },
  { cmd: 'const msg = ref("oi")', cat: 'setup', pt: 'No script setup, basta declarar — o template acessa msg direto (sem .value)', en: 'In script setup just declare it — the template uses msg directly (no .value)' },
  { cmd: '<script> export default { name: "App", data() {} }</script>', cat: 'setup', pt: 'Options API — ainda válido, mas o Composition API é o padrão atual', en: 'Options API — still valid, but Composition API is the current default' },
  { cmd: 'await fetch("/api")', cat: 'setup', pt: 'Top-level await é permitido dentro de script setup', en: 'Top-level await is allowed inside script setup' },
  { cmd: 'defineOptions({ inheritAttrs: false })', cat: 'setup', pt: 'Define opções do componente (ex.: desligar fallthrough de attrs) sem bloco <script> extra', en: 'Sets component options (e.g. turn off attrs fallthrough) without an extra <script> block' },

  // ─── Template syntax ──────────────────────────────────────────────────────
  { cmd: '{{ user.name }}', cat: 'template', pt: 'Interpolação de texto (engine de template, nada de HTML é interpretado)', en: 'Text interpolation (template engine — HTML is not interpreted)' },
  { cmd: '{{ n + 1 }}{{ ok ? "sim" : "não" }}', cat: 'template', pt: 'Só expressões JS (uma expressão por chave, sem statements)', en: 'JavaScript expressions only (one expression per tag, no statements)' },
  { cmd: 'v-text="msg"', cat: 'template', pt: 'Define o textContent do elemento', en: 'Sets the element textContent' },
  { cmd: 'v-html="html"', cat: 'template', pt: 'Renderiza HTML — cuidado: só use com dados confiáveis (XSS)', en: 'Renders HTML — use only with trusted data (XSS)' },
  { cmd: 'v-once', cat: 'template', pt: 'Renderiza só uma vez e ignora futuras atualizações', en: 'Renders once and ignores future updates' },
  { cmd: 'v-memo="[a, b]"', cat: 'template', pt: 'Simula memoização: só re-renderiza quando as dependências mudam', en: 'Memoizes a subtree: re-renders only when deps change' },
  { cmd: 'v-cloak', cat: 'template', pt: 'Esconde a template até a montagem (use com [v-cloak]{display:none} no CSS)', en: 'Hides the template until mount (pair with [v-cloak]{display:none} in CSS)' },

  // ─── Directives ───────────────────────────────────────────────────────────
  { cmd: 'v-if="cond"', cat: 'directives', pt: 'Cria/destrói o elemento conforme a condição', en: 'Creates/destroys the element based on the condition' },
  { cmd: 'v-else-if="c2" v-else', cat: 'directives', pt: 'Encadeia condições — precisam ser irmãos adjacentes', en: 'Chains conditions — must be adjacent siblings' },
  { cmd: 'v-show="show"', cat: 'directives', pt: 'Alterna display — mantém o elemento no DOM (custo de montar vs de toggle)', en: 'Toggles display — keeps the element in the DOM (mount cost vs toggle cost)' },
  { cmd: 'v-for="item in items" :key="item.id"', cat: 'directives', pt: 'Loop; sempre defina :key estável para reconciliar corretamente', en: 'Loop; always set a stable :key so the diff works correctly' },
  { cmd: 'v-for="(item, i) in items" v-for="(v, k) in obj"', cat: 'directives', pt: 'Deriva o índice do array ou a chave/valor do objeto', en: 'Destructures the array index or the object key/value' },
  { cmd: 'v-for="n in 10"', cat: 'directives', pt: 'Itera de 1 a 10 (range numérico)', en: 'Iterates 1..10 (numeric range)' },
  { cmd: 'v-bind="attrs"', cat: 'directives', pt: 'Espalha um objeto inteiro como atributos/props', en: 'Spreads an entire object as attrs/props' },
  { cmd: 'v-bind:[attrName]="val"', cat: 'directives', pt: 'Nome de argumento dinâmico (também vale para v-on)', en: 'Dynamic argument name (also applies to v-on)' },
  { cmd: 'v-on:click="handle" @click="handle"', cat: 'directives', pt: 'Escuta evento — @ é o atalho de v-on', en: 'Listens to an event — @ is the v-on shorthand' },
  { cmd: '@keyup.enter @keydown.esc', cat: 'directives', pt: 'Modificadores de tecla: .enter .esc .tab .delete .up .down .left .right .space', en: 'Key modifiers: .enter .esc .tab .delete .up .down .left .right .space' },
  { cmd: '@click.prevent.stop', cat: 'directives', pt: 'Chamada event.preventDefault() e event.stopPropagation()', en: 'Calls event.preventDefault() and event.stopPropagation()' },
  { cmd: '@click.once @click.capture @click.self', cat: 'directives', pt: 'Outros modificadores: dispara 1x, usa fase de captura, só se o alvo for o próprio el', en: 'More modifiers: fire once, use capture phase, only if the target is the element itself' },
  { cmd: '@click.ctrl @click.meta @click.exact', cat: 'directives', pt: 'Modificadores de modificadores de tecla: .ctrl .alt .shift .meta e .exact (só o combo exato)', en: 'System-key modifiers: .ctrl .alt .shift .meta and .exact (only that exact combo)' },
  { cmd: 'v-model="text"', cat: 'directives', pt: 'Two-way binding em inputs nativos (desfaz em input ou change)', en: 'Two-way binding on native inputs (resolves on input or change)' },
  { cmd: 'v-model.number="n" v-model.trim v-model.lazy', cat: 'directives', pt: 'Coage para número, faz trim, ou sincroniza no change em vez de input', en: 'Coerces to number, trims, or syncs on change instead of input' },
  { cmd: ':class="{ active: isActive }" :style="[base, extra]"', cat: 'directives', pt: ':class aceita objeto/array; :style aceita objeto (camelCase) ou array', en: ':class takes an object/array; :style takes an object (camelCase) or array' },

  // ─── Reactivity ───────────────────────────────────────────────────────────
  { cmd: 'const count = ref(0); count.value++', cat: 'reactivity', pt: 'ref: valor reativo acessado com .value no código (o template desempacota)', en: 'ref: reactive value accessed with .value in code (the template unwraps it)' },
  { cmd: 'const state = reactive({ n: 0 })', cat: 'reactivity', pt: 'reactive: reativo profundo para objetos; não pode ser trocado inteiro', en: 'reactive: deep-reactive proxy for objects; the whole object cannot be replaced' },
  { cmd: 'const done = computed(() => state.n > 10)', cat: 'reactivity', pt: 'computed: valor derivado e em cache, atualizado só quando as deps mudam', en: 'computed: cached derived value, re-evaluated only when deps change' },
  { cmd: 'watch(() => state.n, (n, prev) => {})', cat: 'reactivity', pt: 'watch: efeito dirigido (source + callback) — passe getter para ser reativo', en: 'watch: directed effect (source + callback) — pass a getter to be reactive' },
  { cmd: 'watch([a, () => b], ([na, nb], [pa, pb]) => {})', cat: 'reactivity', pt: 'Observa múltiplas fontes; callback recebe arrays de novo/antigo', en: 'Watches multiple sources; callback receives new/old arrays' },
  { cmd: 'watchEffect(() => persist(state))', cat: 'reactivity', pt: 'Roda imediatamente e re-executa quando qualquer dep acessada mudar', en: 'Runs immediately and re-runs whenever any accessed dep changes' },
  { cmd: 'watch(a, fn, { deep: true, flush: "post", immediate: true })', cat: 'reactivity', pt: 'Opções: deep (objeto inteiro), flush ("post" p/ DOM atualizado), immediate', en: 'Options: deep (whole object), flush ("post" for updated DOM), immediate' },
  { cmd: 'const { n } = toRefs(state)', cat: 'reactivity', pt: 'Converte props de um reactive em refs — útil ao desestruturar sem perder reatividade', en: 'Turns reactive props into refs — handy for destructuring without losing reactivity' },
  { cmd: 'shallowRef / shallowReactive / readonly()', cat: 'reactivity', pt: 'Variantes: apenas nível superficial ou proxy somente-leitura', en: 'Variants: top-level only, or a read-only proxy' },
  { cmd: 'provide("theme", themeObj); const t = inject("theme")', cat: 'reactivity', pt: 'Compartilha dado de ancestral a descendentes, com/ sem default (inject("chave", default))', en: 'Shares data from ancestors to descendants, with/without a default (inject("key", default))' },
  { cmd: 'const raw = toRaw(proxy)', cat: 'reactivity', pt: 'Requisita o objeto original por trás de um reactive', en: 'Returns the original object behind a reactive proxy' },

  // ─── Props & emits ────────────────────────────────────────────────────────
  { cmd: 'defineProps({ size: { type: Number, default: 16 } })', cat: 'props', pt: 'Declara e valida props (defineProps pode receber um array de nomes também)', en: 'Declares and validates props (defineProps can also take an array of names)' },
  { cmd: 'const props = defineProps(["title", "count"])', cat: 'props', pt: 'Forma resumida; use props.title e props.count no template', en: 'Shorthand form; use props.title and props.count in the template' },
  { cmd: 'const { title } = defineProps({ title: String })', cat: 'props', pt: 'Desestruturação de props no script setup — o valor perde a reatividade após extrair', en: 'Props destructuring in script setup — the value loses reactivity once extracted' },
  { cmd: 'defineEmits(["update", "submit"])', cat: 'props', pt: 'Declara os eventos emitidos (documenta e permite validação)', en: 'Declares the emitted events (documents them and enables validation)' },
  { cmd: 'const emit = defineEmits({ submit: (v) => v !== "" })', cat: 'props', pt: 'Com validação: o emitter recebe a função e a chama com os args', en: 'With validation: the emitter gets the function and calls it with the args' },
  { cmd: 'emit("update:modelValue", "x"); emit("click", e)', cat: 'props', pt: 'Dispara o evento com payload; update:modelValue alimenta v-model no pai', en: 'Fires the event with a payload; update:modelValue feeds v-model in the parent' },
  { cmd: 'const model = defineModel()', cat: 'props', pt: 'Vue 3.4+: ref two-way para v-model no componente — elimina o boilerplate update:modelValue', en: 'Vue 3.4+: two-way ref for v-model on a component — removes the update:modelValue boilerplate' },
  { cmd: 'defineModel({ type: String, default: "" })', cat: 'props', pt: 'v-model nomeado/multiplicado: defineModel("search") + <Comp v-model:search>' , en: 'Named/multiple v-model: defineModel("search") + <Comp v-model:search>' },
  { cmd: '<Child v-model="text" />', cat: 'props', pt: 'No pai, v-model em componente = prop modelValue + evento update:modelValue', en: 'In the parent, v-model on a component = modelValue prop + update:modelValue event' },
  { cmd: 'inheritAttrs: false; $attrs', cat: 'props', pt: 'Attrs sem prop correspondente caem no elemento raiz; desligue para redistribuir no Options API', en: 'Attrs with no matching prop fall through to the root element; turn off to redistribute (Options API)' },

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  { cmd: 'onMounted(() => {})', cat: 'lifecycle', pt: 'Após o componente ser inserido no DOM — ideal para fetch e listeners', en: 'After the component is inserted into the DOM — ideal for fetches and listeners' },
  { cmd: 'onBeforeUnmount(() => {})', cat: 'lifecycle', pt: 'Antes de remover — limpe timers, observers e listeners', en: 'Right before removal — clean up timers, observers and listeners' },
  { cmd: 'onBeforeMount / onUpdated / onBeforeUpdate', cat: 'lifecycle', pt: 'Outros hooks: antes de montar, e ao redor de cada atualização de DOM', en: 'More hooks: before mount, and around each DOM update' },
  { cmd: 'onActivated / onDeactivated (keep-alive)', cat: 'lifecycle', pt: 'Disparam quando o componente é ativado/desativado por <KeepAlive>', en: 'Fire when the component is activated/deactivated by <KeepAlive>' },
  { cmd: 'onErrorCaptured((err, inst, info) => {})', cat: 'lifecycle', pt: 'Captura erros dos componentes filhos — base para error boundaries', en: 'Catches errors thrown in child components — the basis for error boundaries' },
  { cmd: 'await nextTick(); then read DOM', cat: 'lifecycle', pt: 'Espera o DOM refletir a alteração de estado antes de ler', en: 'Waits for the DOM to reflect the state change before reading it' },
  { cmd: 'Array of lifecycle hooks order', cat: 'lifecycle', pt: 'setup → onBeforeMount → onMounted → onBeforeUpdate → onUpdated → onBeforeUnmount → onUnmounted', en: 'setup → onBeforeMount → onMounted → onBeforeUpdate → onUpdated → onBeforeUnmount → onUnmounted' },

  // ─── Components & slots ───────────────────────────────────────────────────
  { cmd: '<MyButton />', cat: 'components', pt: 'Componentes no kebab/pascal-case se resolvem entre si — imports bastam', en: 'kebab/pascal-case components resolve between each other — imports are enough' },
  { cmd: '<slot /> <slot name="header" />', cat: 'components', pt: 'Slots default e nomeados; o pai preenche com <template #header>', en: 'Default and named slots; the parent fills them with <template #header>' },
  { cmd: '<slot name="item" :item="it" />', cat: 'components', pt: 'Slot com escopo: passa dados ao pai (scoped slot)', en: 'Scoped slot: passes data up to the parent' },
  { cmd: '<template #default="{ item }">', cat: 'components', pt: 'Sintaxe recebe as props do scoped slot via destructuring', en: 'Short syntax receives the scoped-slot props via destructuring' },
  { cmd: '<KeepAlive include="A,B"> <component :is="c" /></KeepAlive>', cat: 'components', pt: 'Mantém vivos e alterna componentes dinâmicos pelo nome', en: 'Keeps alive and switches dynamic components by name' },
  { cmd: '<Teleport to="body"> <Modal /></Teleport>', cat: 'components', pt: 'Renderiza o conteúdo em outro lugar do DOM (ex.: modais no body)', en: 'Renders the content somewhere else in the DOM (e.g. modals into body)' },
  { cmd: '<Suspense><template #default>...<template #fallback>', cat: 'components', pt: 'Mostra um fallback enquanto dependências assíncronas (async components) resolvem', en: 'Shows a fallback while async dependencies (async components) resolve' },
  { cmd: 'const Async = defineAsyncComponent(() => import("./Heavy.vue"))', cat: 'components', pt: 'Carregamento preguiçoso do componente (faz o code-splitting no build)', en: 'Lazy-loads the component (splits the code at build time)' },
  { cmd: 'vue expose: defineExpose({ foo })', cat: 'components', pt: 'Expõe propriedades/métodos ao template ref do pai no script setup', en: 'Exposes props/methods to the parent template ref in script setup' },
  { cmd: 'defineSlots<{ default(props: any): any }>()', cat: 'components', pt: 'Tipa os slots recebidos (TypeScript; é só de tipos, sai no build)', en: 'Types the received slots (TypeScript; types-only, stripped at build)' },

  // ─── Composables ──────────────────────────────────────────────────────────
  { cmd: 'export function useCounter() { const n = ref(0); return { n, inc: () => n.value++ } }', cat: 'composables', pt: 'Padrão: função useX que encapsula estado + lógica, reutilizável entre componentes', en: 'Pattern: a useX function that encapsulates state + logic, reusable across components' },
  { cmd: 'const store = {}; export function useShared() { return store }', cat: 'composables', pt: 'Estado global: refs declaradas no nível do módulo são compartilhadas (mini-store)', en: 'Global state: module-scope refs are shared across components (mini-store)' },
  { cmd: 'onMounted in composable', cat: 'composables', pt: 'Hooks de ciclo de vida funcionam dentro de composables (obedecem ao caller)', en: 'Lifecycle hooks work inside composables (they bind to the caller)' },
  { cmd: 'onScopeDispose(cleanup)', cat: 'composables', pt: 'Limpeza automática quando o escopo do componente que usa o composable é descartado', en: 'Automatic cleanup when the caller component scope is disposed' },
  { cmd: 'Naming: composables use prefixo use + return refs desempacotáveis', cat: 'composables', pt: 'Convenção: useNome e, por padrão, coisas reativas retornadas em objeto (refs ficam no .value)', en: 'Convention: useName and, by default, reactives returned in an object (refs stay at .value)' },

  // ─── Vue Router ──────────────────────────────────────────────────────────
  { cmd: 'createRouter({ history: createWebHistory(), routes })', cat: 'router', pt: 'Cria o router com history HTML5 (createWebHashHistory usa #/)', en: 'Creates the router with HTML5 history (createWebHashHistory uses #/)' },
  { cmd: '<RouterView />', cat: 'router', pt: 'Renderiza o componente da rota atual — um por nível de nesting', en: 'Renders the current route component — one per nesting level' },
  { cmd: '<RouterLink to="/sobre" />', cat: 'router', pt: 'Link de navegação com classe .router-link-active/.router-link-exact-active', en: 'Navigation link with .router-link-active/.router-link-exact-active classes' },
  { cmd: 'useRouter() → router.push("/x") router.back()', cat: 'router', pt: 'Navegação programática nas opções de history', en: 'Programmatic navigation with history options' },
  { cmd: 'useRoute().params.id', cat: 'router', pt: 'Lê os parâmetros dinâmicos da rota (ex.: /user/:id)', en: 'Reads the dynamic route params (e.g. /user/:id)' },
  { cmd: 'useRoute().query.q', cat: 'router', pt: 'Lê a query string (use router.push({ query }) para atualizar)', en: 'Reads the query string (use router.push({ query }) to update)' },
  { cmd: 'routes: [{ path: "/u/:id", component: U }]', cat: 'router', pt: 'Rotas com segmento dinâmico :param', en: 'Routes with a dynamic :param segment' },
  { cmd: 'component: () => import("./views/Home.vue")', cat: 'router', pt: 'Lazy-loading da rota — vira chunk separado no build', en: 'Route-level lazy loading — becomes a separate chunk at build' },
  { cmd: 'beforeEach((to, from, next) => {})', cat: 'router', pt: 'Guarda global de navegação — tem versões per-route (beforeEnter) e in-component', en: 'Global navigation guard — also per-route (beforeEnter) and in-component versions' },
  { cmd: 'router.push({ name: "user", params: { id: 3 }, query: { t: 1 } })', cat: 'router', pt: 'Navegação por nome com params/query — params só funcionam com routes nomeadas', en: 'Navigation by name with params/query — params only work with named routes' },

  // ─── Pinia ────────────────────────────────────────────────────────────────
  { cmd: 'const useStore = defineStore("cart", { state, getters, actions })', cat: 'pinia', pt: 'Options store: estado + getters (síncronos/async) + actions', en: 'Options store: state + getters (sync/async) + actions' },
  { cmd: 'defineStore("counter", () => { const n = ref(0); return { n, inc: () => n.value++ } })', cat: 'pinia', pt: 'Setup store: um composable que devolve refs/computed/functions', en: 'Setup store: a composable that returns refs/computed/functions' },
  { cmd: 'storeToRefs(useStore())', cat: 'pinia', pt: 'Desestrutura preservando reatividade — essencial ao tirar n de dentro do store', en: 'Destructures while keeping reactivity — a must when pulling state out of the store' },
  { cmd: 'store.$patch({ n: 2 })', cat: 'pinia', pt: 'Aplica várias mudanças de uma vez', en: 'Applies multiple changes at once' },
  { cmd: 'store.$reset()', cat: 'pinia', pt: 'Volta o estado ao initial (disponível por padrão)', en: 'Resets state to the initial (available by default)' },
  { cmd: 'store.$subscribe((mutation, state) => {})', cat: 'pinia', pt: 'Observa mudanças (padrão: depois do patch; passe { detached } fora do setup)', en: 'Watches for changes (default: after patches; pass { detached } outside setup)' },
  { cmd: 'watch(store, fn) / watch(pinia.state, fn, { deep: true })', cat: 'pinia', pt: 'É possível dar watch direto no state do store', en: 'You can watch the store state directly' },
  { cmd: 'getters: { double: (s) => s.n * 2 }', cat: 'pinia', pt: 'Getters são computeds do store; assim como state, use storeToRefs para desestruturar', en: 'Getters are store computeds; like state, destructure them with storeToRefs' },

  // ─── Gotchas & utilities ──────────────────────────────────────────────────
  { cmd: 'ref() vs reactive(): use ref p/ primitivos e reactive para objetos c/ forma fixa', cat: 'misc', pt: 'Convenção: ref para todos (desempacota no template), reactive só para grupos de estado', en: 'Convention: use ref for everything (unwraps in templates), reactive only for state groups' },
  { cmd: '<template ref="el"> → el.value', cat: 'misc', pt: 'Template ref: acessa o elemento DOM / instância do componente filho', en: 'Template ref: access the DOM element / child component instance' },
  { cmd: 'v-for + ref: use função ref(el) => list.push(el)', cat: 'misc', pt: 'Não existe array mágico; guarde refs de v-for numa função', en: 'No magic array; collect v-for refs with a ref callback' },
  { cmd: 'const el = ref(null); onMounted(() => el.value.focus())', cat: 'misc', pt: 'Template refs só existem após onMounted', en: 'Template refs only exist after onMounted' },
  { cmd: 'smart camelCase: onUpdate → @update', cat: 'misc', pt: 'Eventos acomodam camelCase/pascal-case ao ouvi-los (onFooBar ≡ @foo-bar)' , en: 'Events are flexible on casing when listening (onFooBar ≡ @foo-bar)' },
  { cmd: 'key on v-for + componentes', cat: 'misc', pt: 'Sem :key estável em v-for, o Vue reusa estado e a UI quebra sutilmente', en: 'Without a stable :key in v-for, Vue reuses state and the UI subtly breaks' },
  { cmd: 'Async reactivity: não destrua refs na desestruturação de "reactive"', cat: 'misc', pt: 'ref dentro de reactive não é desempacotado na desestruturação — use toRefs', en: 'refs inside reactive are not unwrapped when destructured — use toRefs' },
  { cmd: 'The template has access only to top-level bindings', cat: 'misc', pt: 'Variáveis locais de funções (ex.: callback params) não vazam para o template', en: 'Local variables inside functions (e.g. callback params) do not leak into the template' },
  { cmd: '<Transition name="fade"><p v-if="ok" /></Transition>', cat: 'misc', pt: 'Anima entrada/saída com classes .fade-enter-active / .fade-leave-active', en: 'Animates enter/leave with .fade-enter-active / .fade-leave-active classes' },
  { cmd: 'Vue Devtools', cat: 'misc', pt: 'Extensão oficial: inspecione refs, components tree, timeline e Pinia', en: 'Official extension: inspect refs, component tree, timeline and Pinia' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Vue 3',
    intro: (
      <>
        Referência pesquisável do Vue 3 — o framework progressivo que rivaliza
        com React no frontend. Cobre o <Text code>script setup</Text> e a
        Composition API, sintaxe de template e diretivas (
        <Text code>v-if</Text>, <Text code>v-for</Text>,{' '}
        <Text code>v-model</Text>), reatividade, props/emits, ciclo de vida,
        slots, composables, Vue Router e Pinia. Complementa o{' '}
        <Text code>react-cheatsheet</Text> do devtools para quem transita
        entre as duas bibliotecas. Tudo 100% client-side (só texto de
        referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        No <Text code>script setup</Text>, declare tudo no topo: imports e
        <Text code>ref</Text> já ficam disponíveis no template sem prefixo.
        Prefira <Text code>ref()</Text> na maioria dos casos — ele desempacota
        no template — e use <Text code>reactive()</Text> só para grupos de
        estado. Para <Text code>v-model</Text> em componentes no Vue 3.4+,
        <Text code>defineModel()</Text> elimina o boilerplate. Sempre defina
        <Text code>:key</Text> estável em <Text code>v-for</Text> e coloque
        efeitos colaterais (fetch, listeners) em <Text code>onMounted</Text> .
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
    title: 'Vue 3 Cheat Sheet',
    intro: (
      <>
        A searchable reference for Vue 3 — the progressive framework that
        rivals React on the frontend. Covers <Text code>script setup</Text>{' '}
        and the Composition API, template syntax and directives (
        <Text code>v-if</Text>, <Text code>v-for</Text>,{' '}
        <Text code>v-model</Text>), reactivity, props/emits, the lifecycle,
        slots, composables, Vue Router and Pinia. Pairs with the devtools{' '}
        <Text code>react-cheatsheet</Text> for anyone moving between the two
        libraries. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        In <Text code>script setup</Text>, declare everything at the top:
        imports and <Text code>ref</Text>s are already exposed to the template
        with no prefix. Prefer <Text code>ref()</Text> in most cases — it
        unwraps in the template — and use <Text code>reactive()</Text> only
        for groups of state. For <Text code>v-model</Text> on components in
        Vue 3.4+, <Text code>defineModel()</Text> removes the boilerplate.
        Always set a stable <Text code>:key</Text> in{' '}
        <Text code>v-for</Text> and put side effects (fetch, listeners) in{' '}
        <Text code>onMounted</Text>.
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

export default function VueCheatsheetPage() {
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