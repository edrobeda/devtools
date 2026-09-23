import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'components',
  'controlflow',
  'binding',
  'signals',
  'forms',
  'routing',
  'http',
  'pipes',
  'di',
  'misc',
]

const CATEGORY_COLOR = {
  cli: 'cyan',
  components: 'blue',
  controlflow: 'geekblue',
  binding: 'green',
  signals: 'magenta',
  forms: 'purple',
  routing: 'orange',
  http: 'gold',
  pipes: 'volcano',
  di: 'lime',
  misc: 'default',
}

const labelOf = {
  cli: { pt: 'Angular CLI & projetos', en: 'Angular CLI & projects' },
  components: { pt: 'Componentes & template', en: 'Components & templates' },
  controlflow: { pt: 'Control flow', en: 'Control flow' },
  binding: { pt: 'Data binding & eventos', en: 'Data binding & events' },
  signals: { pt: 'Signals & reatividade', en: 'Signals & reactivity' },
  forms: { pt: 'Reactive forms & validação', en: 'Reactive forms & validation' },
  routing: { pt: 'Router & navegação', en: 'Router & navigation' },
  http: { pt: 'HttpClient & interceptors', en: 'HttpClient & interceptors' },
  pipes: { pt: 'Pipes', en: 'Pipes' },
  di: { pt: 'Injeção de dependência', en: 'Dependency injection' },
  misc: { pt: 'Gotchas & dicas', en: 'Gotchas & tips' },
}

const COMMANDS = [
  // ─── Angular CLI & projects ──────────────────────────────────────────────
  { cmd: 'npm install -g @angular/cli', cat: 'cli', pt: 'Instala o Angular CLI globalmente (ng está disponível em toda a máquina)', en: 'Installs the Angular CLI globally (ng becomes available everywhere)' },
  { cmd: 'npx @angular/cli new meu-app --routing --style=scss --ssr=false', cat: 'cli', pt: 'Cria um projeto standalone com roteador, SCSS e sem SSR (v17+)', en: 'Scaffolds a standalone project with routing, SCSS and no SSR (v17+)' },
  { cmd: 'ng new meu-app --defaults', cat: 'cli', pt: 'Cria sem prompts interativos usando as respostas padrão', en: 'Scaffolds without interactive prompts using default answers' },
  { cmd: 'ng serve --open', cat: 'cli', pt: 'Sobe o dev server com HMR em localhost:4200 e abre o navegador', en: 'Starts the dev server with HMR on localhost:4200 and opens the browser' },
  { cmd: 'ng serve --port 4300', cat: 'cli', pt: 'Troca a porta do dev server (útil com vários projetos ao mesmo tempo)', en: 'Changes the dev server port (handy with multiple projects at once)' },
  { cmd: 'ng generate component hero --standalone', cat: 'cli', pt: 'Gera um componente standalone pronto para importar (alias: ng g c hero)', en: 'Generates a ready-to-import standalone component (alias: ng g c hero)' },
  { cmd: 'ng g pipe title-case', cat: 'cli', pt: 'Gera um pipe novo (ng g p)', en: 'Generates a new pipe (ng g p)' },
  { cmd: 'ng g service api/user', cat: 'cli', pt: 'Gera um service injetável em um diretório (ng g s)', en: 'Generates an injectable service in a folder (ng g s)' },
  { cmd: 'ng g guard auth', cat: 'cli', pt: 'Gera um guard funcional para rotas (pergunta qual tipo)', en: 'Generates a functional route guard (asks which kind)' },
  { cmd: 'ng build', cat: 'cli', pt: 'Compila para produção em dist/ (otimizado e minificado)', en: 'Builds for production into dist/ (optimized and minified)' },
  { cmd: 'ng lint', cat: 'cli', pt: 'Roda o ESLint do projeto', en: 'Runs the project ESLint' },
  { cmd: 'ng test / ng e2e', cat: 'cli', pt: 'Roda os testes de unidade (Karma/Jest) e os E2E (Playwright/Cypress)', en: 'Runs unit tests (Karma/Jest) and E2E tests (Playwright/Cypress)' },
  { cmd: 'ng update @angular/core @angular/cli', cat: 'cli', pt: 'Atualiza o framework e o CLI em uma passada (leia o breaking changes de cada major)', en: 'Updates the framework and CLI in one pass (read the breaking changes for each major)' },
  { cmd: 'ng version', cat: 'cli', pt: 'Mostra as versões do projeto e do Angular no ecossistema', en: 'Prints the project and Angular ecosystem versions' },

  // ─── Components & templates ──────────────────────────────────────────────
  { cmd: '@Component({ selector: "app-hello", standalone: true, imports: [], template: "<p>{{ msg }}</p>" })', cat: 'components', pt: 'Define um componente standalone com seletor, imports explícitos e template inline', en: 'Defines a standalone component with selector, explicit imports and an inline template' },
  { cmd: '@Component({ templateUrl: "./hero.html", styleUrl: "./hero.css" })', cat: 'components', pt: 'Template e estilos em arquivos separados (styleUrls no plural = estilo antigo)', en: 'Template and styles in separate files (plural styleUrls = old style)' },
  { cmd: 'export class HeroComponent {}', cat: 'components', pt: 'A classe é a fonte de verdade do componente — campos viram dados e métodos viram ações do template', en: 'The class drives the component — fields become data and methods become template actions' },
  { cmd: 'ngOnInit / ngOnChanges / ngAfterViewInit / ngOnDestroy', cat: 'components', pt: 'Ciclo de vida: init, mudanças de input, view pronta e limpeza final', en: 'Lifecycle: init, input changes, view ready and final cleanup' },
  { cmd: 'ngOnChanges(changes: SimpleChanges) { changes.id.previousValue }', cat: 'components', pt: 'Roda antes do ngOnInit e a cada mudança de @Input; o map tem previousValue/currentValue', en: 'Runs before ngOnInit and on every @Input change; the map holds previousValue/currentValue' },
  { cmd: 'implements OnDestroy { ngOnDestroy() { this.sub.unsubscribe() } }', cat: 'components', pt: 'Cancela subscriptions e timers para não vazar memória', en: 'Unsubscribes and clears timers to avoid memory leaks' },
  { cmd: '@Input() hero: Hero; @Input({ alias: "heroId" }) id: string', cat: 'components', pt: 'Declara entradas do componente; alias muda o atributo usado no pai', en: 'Declares component inputs; alias changes the attribute used by the parent' },
  { cmd: '@Output() saved = new EventEmitter<Hero>()', cat: 'components', pt: 'Emite eventos para o pai escutar com (saved)="onSaved($event)"', en: 'Emits events for the parent to listen with (saved)="onSaved($event)"' },
  { cmd: 'public hero = signal<Hero | null>(null)', cat: 'components', pt: 'Campo público é acessível no template — o template acessa tudo sem this', en: 'Public fields are visible in the template — the template drops the this prefix' },
  { cmd: '@ViewChild("canvas") canvas?: ElementRef<HTMLCanvasElement>', cat: 'components', pt: 'Mapeia uma template reference #canvas para o elemento no código (pega a API nova depois)', en: 'Maps a #canvas template reference to the element in code (read it after view init)' },
  { cmd: '@ContentChild / @ContentChildren', cat: 'components', pt: 'Acessa conteúdo projetado do pai via <ng-content>', en: 'Accesses parent-projected content via <ng-content>' },
  { cmd: 'bootstrapApplication(App, { providers: [provideRouter(routes)] })', cat: 'components', pt: 'V17+: inicializa a aplicação standalone sem NgModule, registrando providers na raiz', en: 'v17+: bootstraps the standalone app without NgModule, registering root providers' },

  // ─── Control flow ────────────────────────────────────────────────────────
  { cmd: '@if (loggedIn) { <app-user /> } @else { <button>Login</button> }', cat: 'controlflow', pt: 'Novo control flow nativo (v17+): cria/destrói o bloco conforme a condição', en: 'New native control flow (v17+): creates/destroys the block based on the condition' },
  { cmd: '@for (item of items; track item.id) { {{ item.name }} } @empty { Nada aqui }', cat: 'controlflow', pt: 'Loop nativo com track obrigatório e bloco @empty quando a lista é vazia', en: 'Native loop with required track and an @empty block when the list is empty' },
  { cmd: '@for (item of items; track item.id; let i = $index) { ... }', cat: 'controlflow', pt: 'Captura o índice, o primeiro/último/par/ímpar via $index, $first, $last, $even, $odd', en: 'Captures the index, first/last/even/odd via $index, $first, $last, $even, $odd' },
  { cmd: '@switch (status) { @case ("ready") { Ok } @default { ... } }', cat: 'controlflow', pt: 'Switch nativo; @case suporta vários valores separados por |', en: 'Native switch; @case supports several values separated by |' },
  { cmd: '*ngIf="cond; else elseBlock"', cat: 'controlflow', pt: 'Diretiva estrutural clássica — ainda funciona, mas o @if é o padrão atual', en: 'Classic structural directive — still works, but @if is the current default' },
  { cmd: '<ng-template #elseBlock>...</ng-template>', cat: 'controlflow', pt: 'O bloco destino do else do *ngIf', en: 'The reference block used by the *ngIf else' },
  { cmd: '*ngFor="let item of items; trackBy: trackById"', cat: 'controlflow', pt: 'Loop clássico; o trackBy evita recriar o DOM a cada mudança', en: 'Classic loop; trackBy avoids recreating the DOM on every change' },
  { cmd: '*ngFor="let item of items; let i = index"', cat: 'controlflow', pt: 'No *ngFor o índice vem da variável index (e first/last/even/odd)', en: 'In *ngFor the index comes from the index variable (and first/last/even/odd)' },

  // ─── Data binding & events ───────────────────────────────────────────────
  { cmd: '{{ user.name }}', cat: 'binding', pt: 'Interpolação — renderiza a expressão e atualiza quando ela muda', en: 'Interpolation — renders the expression and updates when it changes' },
  { cmd: '[value]="hero.name"', cat: 'binding', pt: 'Property binding: leva do componente para o DOM (um sentido só)', en: 'Property binding: flows from the component to the DOM (one way only)' },
  { cmd: '([disabled]="busy" [src]="imgUrl")', cat: 'binding', pt: 'Parênteses são opcionais em bindings simples — [src] funciona igual', en: 'Parentheses are optional around property bindings — [src] works the same' },
  { cmd: '(click)="save()" (keyup.enter)="submit()"', cat: 'binding', pt: 'Event binding: (evento) chama um método; .enter é um filtro de tecla', en: 'Event binding: (event) fires a method; .enter is a key filter' },
  { cmd: '(change)="onChange($event.target.value)"', cat: 'binding', pt: 'Recebe o evento — acesse o valor via $event (depende do elemento)', en: 'Receives the event — read the value via $event (depends on the element)' },
  { cmd: '[(ngModel)]="hero.name"', cat: 'binding', pt: 'Two-way binding em formulários template-driven — exige FormsModule importado', en: 'Two-way binding in template-driven forms — requires FormsModule to be imported' },
  { cmd: '[class.active]="isActive"', cat: 'binding', pt: 'Adiciona/remove a classe conforme o valor booleano (classlector nativo do Angular)', en: 'Toggles the class based on the boolean value (built-in Angular class binding)' },
  { cmd: '[ngClass]="{ danger: hasError, big: size > 4 }"', cat: 'binding', pt: 'Diretiva para várias classes condicionais de uma vez (aceita objeto, array, string)', en: 'Directive for many conditional classes at once (takes object, array, string)' },
  { cmd: '[style.color]="color"', cat: 'binding', pt: 'Binding de estilo individual; [ngStyle] faz vários de uma vez', en: 'Single style binding; [ngStyle] handles several at once' },
  { cmd: '[attr.aria-label]="label"', cat: 'binding', pt: 'Binding de atributo DOM genérico com prefixo attr.', en: 'Generic DOM-attribute binding using the attr. prefix' },
  { cmd: '[routerLink]="[ \'/users\', id ]"', cat: 'binding', pt: 'Vincula a lista de segmentos ao link do router (com o parâmetro embutido)', en: 'Binds the segment array to the router link (with the param inline)' },
  { cmd: '[(value)]="inputModel"', cat: 'binding', pt: 'Two-way na mão: propriedade + evento com mesmo nome / -Change (quando o componente expõe)', en: 'Manual two-way: property + matching onChange-suffixed event (when the component exposes it)' },

  // ─── Signals & reactivity ────────────────────────────────────────────────
  { cmd: 'const count = signal(0); count.set(1); count.update(v => v + 1)', cat: 'signals', pt: 'Signal: valor reativo; set troca, update transforma o atual — o template lê com count()', en: 'Signal: a reactive value; set replaces, update transforms — the template reads count()' },
  { cmd: 'const doubled = computed(() => count() * 2)', cat: 'signals', pt: 'computed: valor derivado e preguiçoso, recalculado só quando as deps mudam', en: 'computed: a lazy derived value, recomputed only when deps change' },
  { cmd: 'effect(() => persist(count()))', cat: 'signals', pt: 'effect: roda de novo quando qualquer signal lido dentro dele muda (evite em templates)', en: 'effect: reruns whenever any signal read inside it changes (avoid in templates)' },
  { cmd: 'const name = input<string>(""); name.set("x")', cat: 'signals', pt: 'input() (v17+): entrada como signal, em vez de @Input() — leia códigos com name()', en: 'input() (v17+): a signal-based input instead of @Input() — read it as name()' },
  { cmd: 'const chosen = output<Hero>(); chosen.emit(hero)', cat: 'signals', pt: 'output() (v17+): substitui @Output EventEmitter com digitação limpa', en: 'output() (v17+): replaces @Output EventEmitter with clean typing' },
  { cmd: 'const val = model<string>(); val.set("novo")', cat: 'signals', pt: 'model() (v17.2+): two-way binding via signal com [(val)] no pai', en: 'model() (v17.2+): two-way binding via a signal with [(val)] in the parent' },
  { cmd: 'const btn = viewChild<ElementRef>("button")', cat: 'signals', pt: 'viewChild()/contentChild(): substituem @ViewChild/@ContentChild — lê em afterNextRender', en: 'viewChild()/contentChild(): replace @ViewChild/@ContentChild — read in afterNextRender' },
  { cmd: 'provideZonelessChangeDetection()', cat: 'signals', pt: 'V18+: modo sem Zone.js — mudanças baseadas em signals, sem detecção global', en: 'v18+: zoneless mode — change detection driven by signals, no global zone' },
  { cmd: 'declare readonly vm = { count: this.count, id: this.hero.id }', cat: 'signals', pt: 'Padrão vm/view-model: expõe signals como fluxo combinado usado no template', en: 'vm/view-model pattern: exposes signals as a combined stream used by the template' },
  { cmd: 'toObservable(count()) / toSignal(obs)', cat: 'signals', pt: 'Ponte com RxJS: transforma signal em Observable e vice-versa (para async lógica)', en: 'RxJS bridge: turns a signal into an Observable and back (for async logic)' },

  // ─── Reactive forms & validation ─────────────────────────────────────────
  { cmd: 'const form = new FormGroup({ name: new FormControl("", [Validators.required]) })', cat: 'forms', pt: 'Cria um form reativo com controle e validação desde o início', en: 'Creates a reactive form with control and validation from the start' },
  { cmd: 'private fb = inject(FormBuilder); const f = this.fb.group({ email: ["", [Validators.required, Validators.email]] })', cat: 'forms', pt: 'FormBuilder: grupo declarativo de campos com validators inline', en: 'FormBuilder: declarative group of fields with inline validators' },
  { cmd: 'f.valueChanges.subscribe(v => ...) / f.statusChanges', cat: 'forms', pt: 'Observáveis de mudança de valor e de status do form — incrível para UI reativa', en: 'Form/field change and status Observables — great for reactive UI' },
  { cmd: 'f.controls.name.setValue("x") / f.patchValue({ name: "x" })', cat: 'forms', pt: 'setValue exige o objeto inteiro; patchValue preenche só o que informar', en: 'setValue needs the full value; patchValue fills only what you pass' },
  { cmd: 'f.markAllAsTouched()', cat: 'forms', pt: 'Dispara a validação visual de todos os campos — o padrão ao apertar Salvar', en: 'Triggers visual validation on every field — the pattern when pressing Save' },
  { cmd: 'Validators.required, email, minLength(3), maxLength(20), pattern(/^[a-z]+$/), min/max', cat: 'forms', pt: 'Validators nativos mais comuns — aceitam composição em um array', en: 'The most common built-in validators — they compose into an array' },
  { cmd: 'f.get("address.zip")?.hasError("required")', cat: 'forms', pt: 'Checa um erro específico de um campo aninhado para mostrar a mensagem', en: 'Checks a specific error on a nested field to show the message' },
  { cmd: 'asyncValidator: myAsyncValidator as AsyncValidatorFn', cat: 'forms', pt: 'Validador assíncrono que retorna Promise/Observable (ex.: checar e-mail no servidor)', en: 'Async validator returning a Promise/Observable (e.g. check an e-mail on the server)' },
  { cmd: 'new FormArray([ ... ]) / this.fb.array([ ... ])', cat: 'forms', pt: 'Lista dinâmica de controles — o padrão para itens repetíveis de um form', en: 'Dynamic list of controls — the pattern for repeatable form items' },
  { cmd: 'formControl() na template: <input [formControl]="name" />', cat: 'forms', pt: 'V17+: função formControl() cria um controle reativo direto no template standalone', en: 'v17+: the formControl() function creates a reactive control directly in a standalone template' },
  { cmd: '@if (name.hasError("required")) { Obrigatório }', cat: 'forms', pt: 'Lê erros do formControl() no template sem navegar pelo objeto do form', en: 'Reads formControl() errors in the template without digging into the form object' },

  // ─── Router & navigation ─────────────────────────────────────────────────
  { cmd: 'provideRouter([{ path: "users/:id", component: UserComponent }])', cat: 'routing', pt: 'V17+: registra o router com a tabela de rotas na inicialização standalone', en: 'v17+: registers the router with the route table at standalone bootstrap' },
  { cmd: '[{ path: "", pathMatch: "full", redirectTo: "users" }]', cat: 'routing', pt: 'Redirect da rota vazia (pathMatch full evita casar prefixos)', en: 'Redirect from the empty path (pathMatch full avoids matching prefixes)' },
  { cmd: '<router-outlet />', cat: 'routing', pt: 'O ponto de renderização da rota atual — um por nível de aninhamento', en: 'The render point of the current route — one per nesting level' },
  { cmd: '<a routerLink="/users/1" routerLinkActive="active">', cat: 'routing', pt: 'Link do router com classe ativa automática na rota atual', en: 'Router link with an automatic active class on the current route' },
  { cmd: 'router.navigate(["/users", id], { queryParams: { tab: 1 } })', cat: 'routing', pt: 'Navegação programática; inject(Router) para o serviço', en: 'Programmatic navigation; inject(Router) to get the service' },
  { cmd: 'const route = inject(ActivatedRoute); route.snapshot.paramMap.get("id") / route.queryParams', cat: 'routing', pt: 'Lê parâmetros e query da rota; queryParams é um Observable', en: 'Reads route params and query; queryParams is an Observable' },
  { cmd: 'loadComponent: () => import("./user.component").then(m => m.UserComponent)', cat: 'routing', pt: 'Lazy loading da rota com loadComponent — vira um chunk separado no build', en: 'Route-level lazy loading with loadComponent — becomes a separate build chunk' },
  { cmd: 'loadChildren: () => import("./users.routes").then(m => m.routes)', cat: 'routing', pt: 'Lazy loading de um arquivo de rotas filhas inteiro', en: 'Lazy loads an entire child-routes file' },
  { cmd: 'canActivate: [authGuard] / canMatch: [modGuard]', cat: 'routing', pt: 'Guards funcionais: canActivate bloqueia o acesso; canMatch decide casa ou não a rota', en: 'Functional guards: canActivate blocks access; canMatch decides whether the route matches' },
  { cmd: 'export const authGuard: CanActivateFn = () => inject(Auth).isLoggedIn() || redirect("login")', cat: 'routing', pt: 'Guard como função pura — use inject() dentro da própria função', en: 'Guard as a pure function — use inject() inside the function itself' },
  { cmd: 'resolve: { hero: () => inject(HeroApi).get(route.paramMap.get("id")) }', cat: 'routing', pt: 'Resolve dados antes de ativar a rota (v17+: o paramMap vem no contexto)', en: 'Resolves data before activating the route (v17+: paramMap arrives in the context)' },
  { cmd: '{ path: "**", component: NotFoundComponent }', cat: 'routing', pt: 'Catch-all para rotas inexistentes — sempre a última rota da lista', en: 'Catch-all for unmatched routes — always the last route in the list' },

  // ─── HttpClient & interceptors ────────────────────────────────────────────
  { cmd: 'provideHttpClient(withFetch())', cat: 'http', pt: 'V17+: habilita o HttpClient no bootstrap com a API fetch do navegador', en: 'v17+: enables HttpClient at bootstrap using the browser fetch API' },
  { cmd: 'private http = inject(HttpClient); this.http.get<User>("/api/users/1").subscribe(u => ...)', cat: 'http', pt: 'GET tipado que devolve Observable; subscribe dispara a requisição', en: 'Typed GET returning an Observable; subscribe triggers the request' },
  { cmd: 'this.http.post("/api/users", body).subscribe(...) / .put(...) / .delete(...)', cat: 'http', pt: 'Demais verbos — o corpo é serializado como JSON automaticamente', en: 'The rest of the verbs — the body is JSON-serialized automatically' },
  { cmd: 'this.http.get("/api/search", { params: { q: "angular" } })', cat: 'http', pt: 'Query params no objeto de opções (também aceita HttpParams)', en: 'Query params in the options object (also accepts HttpParams)' },
  { cmd: 'this.http.get(..., { headers: { "X-App": "dev" } }).pipe(catchError(err => { return EMPTY }))', cat: 'http', pt: 'Headers por request e tratamento de erro com operadores RxJS', en: 'Per-request headers and error handling with RxJS operators' },
  { cmd: 'export const authInterceptor: HttpInterceptorFn = (req, next) => { const r = req.clone({ headers: req.headers.set("Authorization", "Bearer " + token) }); return next(r) }', cat: 'http', pt: 'Interceptor funcional (v17+): clona o request, injeta header e passa adiante', en: 'Functional interceptor (v17+): clones the request, injects the header, passes it on' },
  { cmd: 'provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))', cat: 'http', pt: 'Registra os interceptors na ordem — rodam na ordem declarada', en: 'Registers the interceptors in order — they run in declared order' },
  { cmd: 'provideHttpClient(withInterceptorsFromDi())', cat: 'http', pt: 'Registra interceptors antigos baseados em classe via DI, para migração', en: 'Registers legacy class-based interceptors via DI, for migrations' },
  { cmd: 'provideHttpClient(withInterceptorsFromDi(), withXsrfConfiguration({ ... }))', cat: 'http', pt: 'Toca na proteção XSRF quando o backend espera outro header/cookie', en: 'Tweaks XSRF protection when the backend expects another header/cookie' },

  // ─── Pipes ───────────────────────────────────────────────────────────────
  { cmd: '{{ createdAt | date: "short" }}', cat: 'pipes', pt: 'Pipe date com formato curto (e dezenas de formatos: "dd/MM/yyyy" etc.)', en: 'date pipe with a short format (and dozens of other presets: "dd/MM/yyyy" etc.)' },
  { cmd: '{{ price | currency: "BRL": "symbol": "1.2-2" }}', cat: 'pipes', pt: 'Moeda com locale, símbolo e casas decimais', en: 'Currency with locale, symbol and decimal digits' },
  { cmd: '{{ text | uppercase }}', cat: 'pipes', pt: 'Caixa alta direto no template (há também o lowercase e o titlecase)', en: 'Upper-case right in the template (lowercase and titlecase also exist)' },
  { cmd: '({{ signalValue() | json }})', cat: 'pipes', pt: 'Pipe json: debug bonito de qualquer valor no template', en: 'json pipe: pretty-print any value in the template for debugging' },
  { cmd: '{{ stream$ | async }}', cat: 'pipes', pt: 'async pipe: subscribe/unsuscribe automático no Observable e renderiza o valor', en: 'async pipe: subscribes/unsubscribes automatically to the Observable and renders the value' },
  { cmd: '@Pipe({ name: "shout" }) export class ShoutPipe implements PipeTransform { transform(v: string) { return v.toUpperCase() + "!" } }', cat: 'pipes', pt: 'Pipe customizado: implementa PipeTransform e importa no array de imports do componente', en: 'Custom pipe: implements PipeTransform and is imported into the component imports array' },
  { cmd: 'imports: [DatePipe, CommonModule]', cat: 'pipes', pt: 'Em componentes standalone, pipes e diretivas precisam ser importados explicitamente', en: 'In standalone components, pipes and directives must be imported explicitly' },
  { cmd: 'NgModule antigo: declarar o pipe em declarations e exportá-lo', cat: 'pipes', pt: 'No padrão NgModule (legado), o pipe entra em declarations e no exports do módulo', en: 'In the NgModule pattern (legacy), the pipe goes into declarations and the module exports' },
  { cmd: '{{ q | async }} com catchError', cat: 'pipes', pt: 'Trate o erro dentro do pipe (ex.: | async + catchError que devolve valor default)', en: 'Handle errors inside the pipe (e.g. | async with a catchError returning a default)' },

  // ─── Dependency injection ────────────────────────────────────────────────
  { cmd: '@Injectable({ providedIn: "root" })', cat: 'di', pt: 'Singleton automático da aplicação — basta o decorator, sem providers manuais', en: 'App-wide singleton for free — just the decorator, no manual providers' },
  { cmd: 'private auth = inject(AuthService)', cat: 'di', pt: 'inject(): a forma atual de obter dependência — funciona fora do construtor (v14+)', en: 'inject(): the modern way to get a dependency — works outside constructors (v14+)' },
  { cmd: 'constructor(private auth: AuthService) {}', cat: 'di', pt: 'Forma clássica via parâmetro do construtor — ainda válida e com types guardados', en: 'Classic constructor-injection form — still valid and less verbose' },
  { cmd: '@Injectable() export class UserService { }', cat: 'di', pt: 'Service puro; o provedor vai em providers: [UserService] de um componente ou módulo', en: 'Plain injectable; the provider goes into providers: [UserService] on a component or module' },
  { cmd: 'providers: [{ provide: Api, useClass: MockApi }, { provide: Config, useValue: {...} }]', cat: 'di', pt: 'Providers com useClass/useValue para trocar implementações e injetar objetos', en: 'Providers with useClass/useValue to swap implementations and inject objects' },
  { cmd: 'const TOKEN = new InjectionToken<string>("API_URL"); inject(TOKEN)', cat: 'di', pt: 'InjectionToken: chave tipada para injetar valores que não são classes', en: 'InjectionToken: a typed key for injecting values that are not classes' },
  { cmd: 'provideEnvironment: provideZonelessChangeDetection()/provideHttpClient()', cat: 'di', pt: 'Environment providers registrados no bootstrap valem para a árvore inteira', en: 'Environment providers registered at bootstrap apply to the whole tree' },
  { cmd: '@Optional() @SkipSelf() @Self() @Host()', cat: 'di', pt: 'Modificadores de resolução: opcional, pular o nível, só o nível, nível do host', en: 'Resolution modifiers: optional, skip a level, only this level, host level' },
  { cmd: 'provide(custom, withDependencies(...))', cat: 'di', pt: 'Com função fábrica que recebe deps próprias ao resolver', en: 'With a factory function that receives its own deps when resolved' },
  { cmd: 'const svc = inject(MyService)', cat: 'di', pt: 'inject() funciona em guards, interceptors, funções e providers — fora do construtor com segurança', en: 'inject() works in guards, interceptors, functions and providers — safely outside constructors' },

  // ─── Gotchas & tips ──────────────────────────────────────────────────────
  { cmd: 'Compilação em modo estrito: ng new --strict', cat: 'misc', pt: 'strict mode liga checagens, noUnusedLocals e template type checking fortes — deixe ligado', en: 'Strict mode turns on checks, noUnusedLocals and strong template type-checking — keep it on' },
  { cmd: 'changeDetection: ChangeDetectionStrategy.OnPush', cat: 'misc', pt: 'Só recalcula quando inputs/signals/EventEmitters mudam — a base da performance no Angular', en: 'Recomputes only when inputs/signals/EventEmitters change — the basis of Angular performance' },
  { cmd: 'Observable sem "| async" vaza', cat: 'misc', pt: 'subscribe() manual exige unsubscribe — prefira | async ou takeUntilDestroyed()', en: 'Manual subscribe() needs an unsubscribe — prefer | async or takeUntilDestroyed()' },
  { cmd: 'takeUntilDestroyed()', cat: 'misc', pt: 'V16+: cancela a subscription quando o componente é destruído — sem boilerplate', en: 'v16+: cancels the subscription when the component is destroyed — no boilerplate' },
  { cmd: 'isPlatformBrowser(PLATFORM_ID)', cat: 'misc', pt: 'Guard para código que só pode rodar no navegador (não-NoSSR/window em SSR)', en: 'Guard for code that can only run in the browser (no window in SSR)' },
  { cmd: 'ng-template com *ngIf / @if para snippets reutilizáveis', cat: 'misc', pt: 'ng-template não renderiza sozinho — combinado com diretivas vira bloco condicional', en: 'ng-template renders nothing on its own — combined with directives it becomes a conditional block' },
  { cmd: 'Track no @for é obrigatório desde o v17', cat: 'misc', pt: 'Sem track, o Angular reusa DOM errado e a UI dessincroniza; use um id estável', en: 'Without track Angular reuses the wrong DOM and the UI desyncs; use a stable id' },
  { cmd: 'Componentes standalone são o padrão desde o v17', cat: 'misc', pt: 'Nhã: NgModule virou opcional — imports direto no @Component', en: 'Standalone is the default since v17 — NgModule became optional, import directly in @Component' },
  { cmd: 'pegadinha do EventEmitter: type é seguro só na emissão', cat: 'misc', pt: 'O template não valida o tipo do $event no runtime — documente e tipifique o payload', en: 'The template does not runtime-check the $event type — document and type the payload' },
  { cmd: 'FormGroup e imutabilidade: patchValue muta o valor', cat: 'misc', pt: 'Formulários guardam o control por refência — compare com .valueChanges em vez de ===', en: 'Forms hold controls by reference — compare via .valueChanges instead of ===' },
  { cmd: 'console.log fora de effect não observa signals', cat: 'misc', pt: 'Signals só marcam leitores dentro de computed/effect/template/change detection', en: 'Signals only notify readers inside computed/effect/template/change detection' },
  { cmd: 'NG0203: inject() fora de contexto', cat: 'misc', pt: 'inject() só funciona em contexto de injeção (construtor, fields, guards, providers)', en: 'inject() only works in an injection context (constructors, fields, guards, providers)' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Angular',
    intro: (
      <>
        Referência pesquisável do Angular moderno — framework opinionado do
        Google que completa o trio React/Vue no frontend. Cobre o Angular
        CLI, componentes standalone, o novo control flow (
        <Text code>@if</Text>/<Text code>@for</Text>), signals e o modo sem
        Zone.js, reactive forms, router, HttpClient com interceptors
        funcionais, pipes e injeção de dependência — com foco no que mudou
        nas versões 17–19. Complementa o <Text code>react-cheatsheet</Text>{' '}
        e o <Text code>vue-cheatsheet</Text> do devtools. Tudo 100%
        client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Componentes <Text code>standalone</Text> são o padrão desde o 17:
        imports direto no <Text code>@Component</Text>, sem{' '}
        <Text code>NgModule</Text>. No template, prefira o control flow nativo{' '}
        <Text code>@if</Text>/<Text code>@for</Text> (com{' '}
        <Text code>track</Text> obrigatório) às diretivas antigas. Para
        estado, <Text code>signal()</Text> + <Text code>computed()</Text>{' '}
        substituem a parafernália de RxJS — e observables no template usam{' '}
        <Text code>| async</Text> ou <Text code>takeUntilDestroyed()</Text>{' '}
        para nunca vazar. Dependência sempre com <Text code>inject()</Text>.
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
    title: 'Angular Cheat Sheet',
    intro: (
      <>
        A searchable reference for modern Angular — Google&apos;s
        opinionated framework that completes the React/Vue trio on the
        frontend. Covers the Angular CLI, standalone components, the new
        control flow (<Text code>@if</Text>/<Text code>@for</Text>),
        signals and zoneless mode, reactive forms, the router, HttpClient
        with functional interceptors, pipes and dependency injection —
        focused on what changed in versions 17–19. Pairs with the devtools{' '}
        <Text code>react-cheatsheet</Text> and{' '}
        <Text code>vue-cheatsheet</Text>. 100% client-side (reference text
        only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Standalone components have been the default since v17: imports go
        straight into <Text code>@Component</Text>, no{' '}
        <Text code>NgModule</Text>. In templates prefer the native control
        flow <Text code>@if</Text>/<Text code>@for</Text> (with a required{' '}
        <Text code>track</Text>) over the old directives. For state,{' '}
        <Text code>signal()</Text> + <Text code>computed()</Text> replace
        most of the RxJS machinery — and Observables in templates use{' '}
        <Text code>| async</Text> or{' '}
        <Text code>takeUntilDestroyed()</Text> to never leak. Inject
        dependencies with <Text code>inject()</Text>.
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

export default function AngularCheatsheetPage() {
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