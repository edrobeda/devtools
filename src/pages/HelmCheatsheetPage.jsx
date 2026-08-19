import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined, ContainerOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['cli', 'struct', 'tpl', 'flow', 'values', 'deps', 'hooks', 'deep', 'gotchas']

const CATEGORY_COLOR = {
  cli: 'blue',
  struct: 'cyan',
  tpl: 'geekblue',
  flow: 'purple',
  values: 'green',
  deps: 'gold',
  hooks: 'magenta',
  deep: 'volcano',
  gotchas: 'red',
}

const labelOf = {
  cli: { pt: 'CLI & ciclo de vida', en: 'CLI & lifecycle' },
  struct: { pt: 'Estrutura do chart', en: 'Chart structure' },
  tpl: { pt: 'Templating básico', en: 'Basic templating' },
  flow: { pt: 'Fluxo & funções Sprig', en: 'Flow & Sprig functions' },
  values: { pt: 'Values & precedência', en: 'Values & precedence' },
  deps: { pt: 'Dependências & subcharts', en: 'Dependencies & subcharts' },
  hooks: { pt: 'Hooks & testes', en: 'Hooks & tests' },
  deep: { pt: 'Templates avançados', en: 'Advanced templating' },
  gotchas: { pt: 'Gotchas', en: 'Gotchas' },
}

const ITEMS = [
  // ─── CLI & ciclo de vida ─────────────────────────────────────────────
  { code: 'helm version', cat: 'cli',
    pt: 'Mostra a versão do cliente (e a do servidor Tiller, nos tempos do Helm 2). No Helm 3 só existe cliente — o Tiller morreu.',
    en: 'Shows the client version (and the Tiller server, back in the Helm 2 days). In Helm 3 only the client exists — Tiller is dead.' },
  { code: 'helm repo add bitnami https://charts.bitnami.com/bitnami', cat: 'cli',
    pt: 'Adiciona um repositório de charts. O Bitnami é o mais usado pra dependências comuns (nginx, redis, postgres...).',
    en: 'Adds a chart repository. Bitnami is the most popular one for common dependencies (nginx, redis, postgres...).' },
  { code: 'helm repo update', cat: 'cli',
    pt: 'Atualiza o cache local de todos os repositórios — o passo que falta quando `helm search repo` não acha um chart recém-publicado.',
    en: 'Refreshes the local cache of all repositories — the missing step when `helm search repo` cannot find a freshly-published chart.' },
  { code: 'helm search repo bitnami/nginx --versions', cat: 'cli',
    pt: 'Busca charts nos repositórios adicionados. `--versions` lista todas as versões; `helm search hub` busca no Hub público.',
    en: 'Searches charts in your added repositories. `--versions` lists every version; `helm search hub` searches the public Hub.' },
  { code: 'helm create mychart', cat: 'cli',
    pt: 'Gera o esqueleto de um chart novo (Chart.yaml, values.yaml, templates/ com Deployment, Service, HPA, ingress e testes).',
    en: 'Scaffolds a new chart (Chart.yaml, values.yaml, templates/ with Deployment, Service, HPA, ingress and tests).' },
  { code: 'helm lint ./mychart', cat: 'cli',
    pt: 'Valida o chart: YAML, templates, valores obrigatórios e convenções. O passo antes do package/install pra não subir besteira.',
    en: 'Validates the chart: YAML, templates, required values and conventions. The step before package/install so you do not ship garbage.' },
  { code: 'helm template myrelease ./mychart', cat: 'cli',
    pt: 'Renderiza os templates LOCALMENTE, sem contato com o cluster — o jeito de revisar o YAML gerado no CI antes de instalar.',
    en: 'Renders the templates LOCALLY, without touching the cluster — the way to review generated YAML in CI before installing.' },
  { code: 'helm template --debug myrelease ./mychart', cat: 'cli',
    pt: 'Mesmo render local, mas mostra cada objeto com os comentários de origem (qual template/linha gerou aquele bloco).',
    en: 'Same local render, but shows every object with origin comments (which template/line produced that block).' },
  { code: 'helm install myrelease bitnami/nginx', cat: 'cli',
    pt: 'Instala um release (uma instância de um chart) no cluster. O release é nomeado — o `helm list` mostra releases, não charts.',
    en: 'Installs a release (an instance of a chart) into the cluster. The release is named — `helm list` shows releases, not charts.' },
  { code: 'helm install myrelease ./mychart -f values-prod.yaml', cat: 'cli',
    pt: 'Instala passando um arquivo de valores customizado. `-f` pode aparecer várias vezes; arquivos que vêm depois na linha ganham precedência.',
    en: 'Installs passing a custom values file. `-f` can appear multiple times; later files on the line win precedence.' },
  { code: 'helm install myrelease ./mychart --set replicaCount=3 --set image.tag=v2.0', cat: 'cli',
    pt: 'Overrides pontuais direto na CLI, sem arquivo. Bom pra valores simples e temporários (ex.: imagem nova num deploy).',
    en: 'Point overrides right on the CLI, no file needed. Good for simple, temporary values (e.g. a new image on a deploy).' },
  { code: 'helm install --dry-run --debug myrelease ./mychart', cat: 'cli',
    pt: 'Simula a instalação: renderiza os templates e envia pro API server com dry-run. É o mais próximo de testar de verdade sem criar nada.',
    en: 'Simulates the install: renders the templates and POSTs them to the API server with dry-run. Closest to really testing without creating anything.' },
  { code: 'helm upgrade --install myrelease ./mychart --atomic --timeout 5m30s', cat: 'cli',
    pt: 'Atualiza o release, criando se não existir. `--atomic` faz rollback automático se falhar; `--timeout` limita a espera (padrão 5m).',
    en: 'Upgrades the release, creating it if it does not exist. `--atomic` auto-rolls-back on failure; `--timeout` caps the wait (default 5m).' },
  { code: 'helm rollback myrelease 2', cat: 'cli',
    pt: 'Volta pro revision 2 do release (use `helm history` pra ver os números). Liberar uma versão ruim leva segundos.',
    en: 'Rolls back to revision 2 of the release (use `helm history` to see the numbers). Releasing a bad version takes seconds.' },
  { code: 'helm history myrelease', cat: 'cli',
    pt: 'Lista todos os revisions: qual upgrade/install gerou cada um, quando, por quem e o status (deployed, failed, superseded...).',
    en: 'Lists all revisions: which upgrade/install produced each, when, by whom, and its status (deployed, failed, superseded...).' },
  { code: 'helm list -A', cat: 'cli',
    pt: 'Lista releases de todos os namespaces (`-A` / `--all-namespaces`). Sem isso você só vê o namespace do kubeconfig atual.',
    en: 'Lists releases across all namespaces (`-A` / `--all-namespaces`). Without it you only see the current kubeconfig namespace.' },
  { code: 'helm uninstall myrelease', cat: 'cli',
    pt: 'Apaga o release e tudo que ele criou. Sem `--keep-history`, o release some do `helm list` (as notas continuam no audit log do cluster).',
    en: 'Deletes the release and everything it created. Without `--keep-history`, the release leaves `helm list` (the notes stay in the cluster audit log).' },
  { code: 'helm get manifest myrelease', cat: 'cli',
    pt: 'Mostra o YAML final dos recursos que estão no cluster — o que o `kubectl get` não mostra de forma agregada.',
    en: 'Shows the final YAML of the resources currently in the cluster — what `kubectl get` does not show in an aggregated way.' },

  // ─── Estrutura do chart ──────────────────────────────────────────────
  { code: 'mychart/\n├── Chart.yaml\n├── values.yaml\n├── .helmignore\n├── charts/          # dependências empacotadas (.tgz)\n├── crds/            # CustomResourceDefinitions\n├── templates/\n│   ├── _helpers.tpl # macros reutilizáveis\n│   ├── NOTES.txt    # instruções pós-instalação\n│   ├── deployment.yaml\n│   └── _tests/      # pods do helm test\n└── Chart.lock       # versões travadas das deps', cat: 'struct',
    pt: 'A estrutura canônica de um chart. Só `Chart.yaml` e `templates/` são obrigatórios; o resto é convenção.',
    en: 'The canonical chart layout. Only `Chart.yaml` and `templates/` are required; the rest is convention.' },
  { code: 'apiVersion: v2\nname: mychart\ndescription: Meu serviço\nversion: 0.1.0\nappVersion: "1.16.0"', cat: 'struct',
    pt: 'O Chart.yaml mínimo. `version` é a versão DO CHART (sobe a cada mudança de template/values); `appVersion` é a versão do app empacotado.',
    en: 'The minimal Chart.yaml. `version` is the CHART version (bumps on every template/values change); `appVersion` is the packaged app version.' },
  { code: 'replicaCount: 1\nimage:\n  repository: nginx\n  tag: "1.25"\nservice:\n  type: ClusterIP\n  port: 80', cat: 'struct',
    pt: 'values.yaml: os DEFAULTS do chart. Hierarquia por objetos aninhados; o usuário sobrescreve com -f/--set.',
    en: 'values.yaml: the chart DEFAULTS. Hierarchy via nested objects; the user overrides with -f/--set.' },
  { code: 'templates/deployment.yaml', cat: 'struct',
    pt: 'Os manifests do chart vivem em templates/, todos renderizados a partir de values + contexto. Cada arquivo vira um ou mais objetos (separe com `---`).',
    en: 'The chart manifests live in templates/, all rendered from values + context. Each file becomes one or more objects (separate with `---`).' },
  { code: 'templates/_helpers.tpl', cat: 'struct',
    pt: 'Arquivo de macros (define/include) reutilizáveis — não gera objeto nenhum por si só. O padrão do Helm pra nomes/labels consistentes.',
    en: 'A file of reusable macros (define/include) — generates no object by itself. The Helm pattern for consistent names/labels.' },
  { code: 'templates/NOTES.txt', cat: 'struct',
    pt: 'Renderizado e exibido no fim do install/upgrade — o "como usar agora" (URLs, secrets, comandos kubectl). Pode usar templates.',
    en: 'Rendered and shown at the end of install/upgrade — the "how to use it now" (URLs, secrets, kubectl commands). Can use templates.' },
  { code: 'charts/\nChart.lock', cat: 'struct',
    pt: '`charts/` guarda as dependências empacotadas (.tgz) e `Chart.lock` trava as versões exatas — ambos gerados pelo `helm dependency update`.',
    en: '`charts/` holds the packaged dependencies (.tgz) and `Chart.lock` pins exact versions — both generated by `helm dependency update`.' },
  { code: 'crds/', cat: 'struct',
    pt: 'CRDs são instaladas SÓ na primeira instalação do chart (não no upgrade). Pra sobreviverem, vão em `crds/` e não em `templates/`.',
    en: "CRDs are installed ONLY on the chart's first install (not on upgrade). To make them survive, put them in `crds/` and not in `templates/`." },
  { code: '.helmignore', cat: 'struct',
    pt: 'Igual ao .gitignore, mas pra empacotar: exclui testes, docs e segredos do `helm package` (reduz o tamanho e não vaza chaves).',
    en: 'Like .gitignore, but for packaging: excludes tests, docs and secrets from `helm package` (keeps the size down and keys from leaking).' },

  // ─── Templating básico ───────────────────────────────────────────────
  { code: '{{ .Release.Name }}', cat: 'tpl',
    pt: 'O nome do release. Variáveis de contexto começam em maiúscula: `.Release`, `.Chart`, `.Values`, `.Template`, `.Capabilities`.',
    en: 'The release name. Context variables start uppercase: `.Release`, `.Chart`, `.Values`, `.Template`, `.Capabilities`.' },
  { code: '{{ .Values.image.tag }}', cat: 'tpl',
    pt: 'Lê um valor do values.yaml. Valores inexistentes viram string vazia (ou falham com `required` — veja a seção avançada).',
    en: 'Reads a value from values.yaml. Missing values become an empty string (or fail with `required` — see the advanced section).' },
  { code: '{{ .Chart.Name }} / {{ .Chart.Version }}', cat: 'tpl',
    pt: 'Metadados do chart: nome e versão (do Chart.yaml). Úteis em labels e no image tag quando não há value próprio.',
    en: 'Chart metadata: name and version (from Chart.yaml). Handy in labels and image tags when there is no dedicated value.' },
  { code: '{{ .Release.Namespace }}', cat: 'tpl',
    pt: 'O namespace onde o release foi instalado — `--namespace` não existe no install; vem do kubeconfig ou de `-n`.',
    en: 'The namespace the release was installed into — `--namespace` is not an install flag; it comes from the kubeconfig or `-n`.' },
  { code: '{{ .Values.image.tag | quote }}', cat: 'tpl',
    pt: 'Pipelines: passa o valor por funções. `quote` garante string com aspas no YAML — essencial pra tags numéricas (1.0 → "1.0").',
    en: 'Pipelines: passes the value through functions. `quote` guarantees a quoted YAML string — essential for numeric tags (1.0 → "1.0").' },
  { code: '{{ .Values.image.tag | upper }}', cat: 'tpl',
    pt: '`upper`/`lower`/`title`/`trim`/`trimSuffix`/`replace`/`trunc` — as funções de string mais usadas em nomes e labels.',
    en: '`upper`/`lower`/`title`/`trim`/`trimSuffix`/`replace`/`trunc` — the string functions most used in names and labels.' },
  { code: '{{ .Values.externalPort | default 8080 }}', cat: 'tpl',
    pt: '`default` aplica o fallback quando o valor vem vazio/inexistente. O padrão pra valores opcionais.',
    en: '`default` applies the fallback when the value is empty/missing. The pattern for optional values.' },
  { code: '{{- .Release.Name }}', cat: 'tpl',
    pt: '`{{-` corta espaços/quebras de linha à ESQUERDA e `-}}` à direita. Sem isso o YAML renderizado ganha linhas em branco e indentação errada.',
    en: '`{{-` trims whitespace/newlines on the LEFT and `-}}` on the right. Without it the rendered YAML gains blank lines and wrong indentation.' },
  { code: '{{/* isto é um comentário */}}', cat: 'tpl',
    pt: 'Comentário no template: não vai pro YAML final. Use pros bastidores que ninguém precisa ver.',
    en: 'Template comment: does not reach the final YAML. Use it for backstory nobody needs to see.' },
  { code: '{{ .Values.appConfig | toYaml | nindent 4 }}', cat: 'tpl',
    pt: 'Dump de um bloco inteiro: `toYaml` serializa o objeto e `nindent 4` indenta cada linha (com quebra inicial). O jeito certo de colar maps/listas em ConfigMaps.',
    en: 'Dump of a whole block: `toYaml` serializes the object and `nindent 4` indents every line (with a leading newline). The right way to paste maps/lists into ConfigMaps.' },

  // ─── Fluxo & funções Sprig ───────────────────────────────────────────
  { code: '{{ if .Values.autoscaling.enabled }}\napiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\n{{ end }}', cat: 'flow',
    pt: 'Bloco condicional: inclui o objeto só quando o valor é truthy. Sem `else`, quando falso nada é emitido.',
    en: 'Conditional block: includes the object only when the value is truthy. Without `else`, nothing is emitted when false.' },
  { code: '{{- if .Values.ingress.enabled }}\n  ...ingress...\n{{- else }}\n  ...serviceNodePort...\n{{- end }}', cat: 'flow',
    pt: 'if/else clássico. Os `{{-` nas bordas mantêm o YAML limpo quando o bloco não é emitido.',
    en: 'Classic if/else. The edge `{{-` keep the YAML clean when the block is not emitted.' },
  { code: '{{ if and .Values.tls.enabled .Values.tls.cert }}...{{ end }}', cat: 'flow',
    pt: '`and`/`or`/`not` compõem condições. `and` é lazy — o `.Values.tls.cert` aqui só é checado se `enabled` for true.',
    en: '`and`/`or`/`not` compose conditions. `and` is lazy — `.Values.tls.cert` here is only checked if `enabled` is true.' },
  { code: '{{ with .Values.service }}\n  port: {{ .port }}\n  type: {{ .type }}\n{{ end }}', cat: 'flow',
    pt: '`with` troca o escopo pra `.Values.service` — dentro do bloco `.` é o objeto. Evita repetir o prefixo. (Objeto vazio → bloco some.)',
    en: '`with` shifts the scope to `.Values.service` — inside, `.` is that object. Avoids repeating the prefix. (Empty object → block disappears.)' },
  { code: '{{- range .Values.ports }}\n- port: {{ . }}\n{{- end }}', cat: 'flow',
    pt: '`range` itera sobre uma LISTA — dentro do loop `.` é cada item. Pra arrays em Service.ports, env, etc.',
    en: '`range` iterates over a LIST — inside the loop `.` is each item. For arrays like Service.ports, env, etc.' },
  { code: '{{- range $key, $val := .Values.labels }}\n{{ $key }}: {{ $val }}\n{{- end }}', cat: 'flow',
    pt: 'Iterando um MAP: a primeira variável é a chave, a segunda o valor. Sem as variáveis, `.` é o valor.',
    en: 'Iterating a MAP: the first variable is the key, the second the value. Without the variables, `.` is the value.' },
  { code: '{{- $fullname := .Release.Name }}\nname: {{ $fullname }}', cat: 'flow',
    pt: 'Variáveis de template com `:=` (declara) ou `=` (atribui). Escopo: do ponto de declaração até o fim do bloco.',
    en: 'Template variables with `:=` (declare) or `=` (assign). Scope: from the declaration point to the end of the block.' },
  { code: '{{ include "mychart.labels" . }}', cat: 'flow',
    pt: '`include` renderiza uma macro (definida em _helpers.tpl) e devolve como string. O `.` final passa o contexto — sem ele a macro não tem acesso.',
    en: '`include` renders a macro (defined in _helpers.tpl) and returns it as a string. The trailing `.` passes the context — without it the macro has no access.' },
  { code: '{{ list "a" "b" "c" | join "," }}', cat: 'flow',
    pt: 'Funções Sprig embutidas: `list` + `join` montam strings. Tem `split`, `first`/`last`, `rest`, `initial`, `append`, `concat`...',
    en: 'Built-in Sprig functions: `list` + `join` build strings. There is `split`, `first`/`last`, `rest`, `initial`, `append`, `concat`...' },
  { code: '{{ now | date "2006-01-02" }}', cat: 'flow',
    pt: '`now` (hora atual) + `date` formata usando a layout de referência do Go (2006-01-02 15:04:05) — NÃO é strftime.',
    en: "`now` (current time) + `date` formats using Go's reference layout (2006-01-02 15:04:05) — NOT strftime." },
  { code: '{{ .Values.replicas | int | add 1 }}', cat: 'flow',
    pt: 'Aritmética via funções: `add`, `sub`, `mul`, `div`, `mod`, `max`, `min`. Preceda de `int` quando o valor vem de string.',
    en: 'Arithmetic via functions: `add`, `sub`, `mul`, `div`, `mod`, `max`, `min`. Precede with `int` when the value comes from a string.' },

  // ─── Values & precedência ────────────────────────────────────────────
  { code: 'replicaCount: 3\nautoscaling:\n  enabled: true\n  minReplicas: 1\n  maxReplicas: 10', cat: 'values',
    pt: 'values.yaml é o ponto de partida (defaults). O usuário sobrescreve no install/upgrade — não edite o chart pra mudar a config de um deploy.',
    en: 'values.yaml is the starting point (defaults). The user overrides at install/upgrade — never edit the chart to change one deployment config.' },
  { code: 'helm upgrade myrelease ./mychart -f base.yaml -f prod.yaml', cat: 'values',
    pt: 'Vários `-f`: o merge é em cascata, arquivo a arquivo, e o ÚLTIMO vence. Maps são mesclados recursivamente; listas são substituídas inteiras.',
    en: 'Multiple `-f`: the merge cascades file by file and the LAST one wins. Maps merge recursively; lists are replaced wholesale.' },
  { code: 'helm install myrelease ./mychart --set image.tag=v2', cat: 'values',
    pt: '`--set` cria/sobrescreve um caminho pontual. Aninhamento com ponto; várias chaves separadas por vírgula.',
    en: '`--set` creates/overrides one pointed path. Nesting with dots; multiple keys separated by commas.' },
  { code: 'helm install myrelease ./mychart --set-string image.tag=v2.0', cat: 'values',
    pt: '`--set-string` força o valor como string. `--set` infere tipos (v2.0 viraria número → "2"), o que quebra tags/versões.',
    en: '`--set-string` forces the value as a string. `--set` infers types (v2.0 would become number → "2"), breaking tags/versions.' },
  { code: "--set-json 'autoscaling={\"enabled\":true,\"max\":10}'", cat: 'values',
    pt: '`--set-json` aceita JSON estruturado — o jeito de passar maps/listas aninhadas via CLI sem sofrer com escaping.',
    en: '`--set-json` accepts structured JSON — the way to pass nested maps/lists via CLI without escaping pain.' },
  { code: 'global:\n  imageRegistry: registry.internal:5000', cat: 'values',
    pt: 'Valores `global.*` são visíveis de subcharts e do chart pai ao mesmo tempo — o canal pra imagem/registry/domain compartilhados.',
    en: '`global.*` values are visible to subcharts and the parent chart alike — the channel for shared image/registry/domain.' },
  { code: 'helm upgrade myrelease ./mychart --reuse-values', cat: 'values',
    pt: '`--reuse-values` reaproveita os overrides do release anterior (e ignora os novos). CUIDADO: misturar com `-f`/`--set` pode dar resultado imprevisível.',
    en: "`--reuse-values` reuses the previous release's overrides (and ignores new ones). CAUTION: mixing with `-f`/`--set` can yield unpredictable results." },
  { code: '--set ingress.hosts[0].host=api.example.com', cat: 'values',
    pt: '`--set` suporta índices de lista: `[0]`, `[1]`... pra arrays. Combine com path aninhado pra alcançar qualquer ponto do values.',
    en: '`--set` supports list indexes: `[0]`, `[1]`... for arrays. Combine with nested paths to reach any point of the values.' },

  // ─── Dependências & subcharts ────────────────────────────────────────
  { code: 'dependencies:\n  - name: postgresql\n    version: "15.5.5"\n    repository: https://charts.bitnami.com/bitnami\n    condition: postgresql.enabled', cat: 'deps',
    pt: 'Declara dependências no Chart.yaml: nome, versão e repo. `condition` liga a instalação do subchart a um value (false → não instala).',
    en: 'Declares dependencies in Chart.yaml: name, version and repo. `condition` ties the subchart install to a value (false → skips it).' },
  { code: 'helm dependency update ./mychart', cat: 'deps',
    pt: 'Baixa as dependências pra `charts/` e grava as versões exatas no `Chart.lock`. Rode sempre que mudar as deps no Chart.yaml.',
    en: 'Downloads the dependencies into `charts/` and records exact versions in `Chart.lock`. Run it whenever you change the deps in Chart.yaml.' },
  { code: 'helm dependency build ./mychart', cat: 'deps',
    pt: 'Reinstala as dependências usando o `Chart.lock` — o comando do CI quando você quer exatamente o que já foi travado.',
    en: 'Re-installs the dependencies using `Chart.lock` — the CI command when you want exactly what was already pinned.' },
  { code: 'helm dependency list ./mychart', cat: 'deps',
    pt: 'Mostra as dependências declaradas vs as presentes em `charts/` — pra diagnosticar "por que meu subchart não subiu".',
    en: 'Shows declared dependencies vs what is actually in `charts/` — to diagnose "why did my subchart not get installed".' },
  { code: '{{ .Values.postgresql.auth.password }}', cat: 'deps',
    pt: 'Do chart pai, os valores de um subchart ficam num bloco com o NOME dele. Os defaults do subchart continuam valendo se você não sobrescrever.',
    en: "From the parent chart, a subchart's values live in a block named after it. The subchart defaults still apply unless you override them." },
  { code: 'type: library', cat: 'deps',
    pt: 'Library chart: não instala nada sozinho, só exporta helpers (`{{ include "common.labels" . }}`). O jeito de compartilhar lógica entre charts.',
    en: 'Library chart: installs nothing by itself, only exports helpers (`{{ include "common.labels" . }}`). The way to share logic across charts.' },
  { code: 'helm install myrelease ./mychart --dependency-update', cat: 'deps',
    pt: '`--dependency-update` roda o dependency update no install/upgrade automaticamente — mão na roda em deploys rápidos.',
    en: '`--dependency-update` runs the dependency update during install/upgrade automatically — handy in quick deploys.' },

  // ─── Hooks & testes ──────────────────────────────────────────────────
  { code: 'annotations:\n  "helm.sh/hook": pre-install\nkind: Job\n  ...', cat: 'hooks',
    pt: 'Hooks são objetos com a anotação `helm.sh/hook`. `pre-install` roda ANTES dos recursos normais — o clássico pra migração de banco ou seed.',
    en: 'Hooks are objects annotated with `helm.sh/hook`. `pre-install` runs BEFORE the regular resources — the classic for DB migrations or seeding.' },
  { code: 'annotations:\n  "helm.sh/hook": post-upgrade', cat: 'hooks',
    pt: 'Hooks disponíveis: pre/post-install, pre/post-upgrade, pre/post-rollback, pre/post-delete e `test`.',
    en: 'Available hooks: pre/post-install, pre/post-upgrade, pre/post-rollback, pre/post-delete and `test`.' },
  { code: 'annotations:\n  "helm.sh/hook": pre-install\n  "helm.sh/hook-weight": "-5"', cat: 'hooks',
    pt: '`hook-weight` ordena hooks do MESMO tipo (mais negativo primeiro). Sem ele, múltiplos hooks rodam em ordem arbitrária.',
    en: '`hook-weight` orders hooks of the SAME type (more negative runs first). Without it, multiple hooks run in arbitrary order.' },
  { code: 'annotations:\n  "helm.sh/hook": pre-install\n  "helm.sh/hook-delete-policy": before-hook-creation', cat: 'hooks',
    pt: '`hook-delete-policy` controla quando o recurso do hook é removido: `before-hook-creation`, `hook-succeeded` ou `hook-failed`.',
    en: '`hook-delete-policy` controls when the hook resource is deleted: `before-hook-creation`, `hook-succeeded` or `hook-failed`.' },
  { code: 'annotations:\n  "helm.sh/hook": post-install,post-upgrade', cat: 'hooks',
    pt: 'Vários hooks numa anotação separados por vírgula — um Job que roda tanto no install quanto no upgrade.',
    en: 'Multiple hooks in one annotation, comma-separated — a Job that runs on both install and upgrade.' },
  { code: 'helm test myrelease', cat: 'hooks',
    pt: 'Roda os pods com `helm.sh/hook: test` (ou em templates/_tests/). Cada pod que termina com exit 0 = teste passando.',
    en: 'Runs the pods annotated with `helm.sh/hook: test` (or under templates/_tests/). Each pod exiting 0 = passing test.' },

  // ─── Templates avançados ─────────────────────────────────────────────
  { code: '{{- define "mychart.fullname" -}}\n{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}\n{{- end }}', cat: 'deep',
    pt: 'Macro no _helpers.tpl: `define`+`end` com um NOME de função. O padrão `fullname` combina release+chart com limite de 63 chars.',
    en: 'Macro in _helpers.tpl: `define`+`end` with a function NAME. The `fullname` pattern combines release+chart capped at 63 chars.' },
  { code: '{{ include "mychart.fullname" . | indent 2 }}', cat: 'deep',
    pt: '`include` dentro de YAML: o resultado pode precisar de `indent` (ou `nindent`) pra cair na coluna certa.',
    en: '`include` inside YAML: the result may need `indent` (or `nindent`) to land in the right column.' },
  { code: '{{ required "A valid .Values.password is required!" .Values.password }}', cat: 'deep',
    pt: '`required` falha o render com a mensagem se o valor vier vazio — melhor que subir um deploy com valor em branco.',
    en: '`required` fails the render with the message if the value is empty — better than shipping a deployment with a blank value.' },
  { code: '{{ fail "cannot deploy to production" }}', cat: 'deep',
    pt: '`fail` aborta o render incondicionalmente. Combine com `if` pra validar combinações de valores antes de gerar YAML.',
    en: '`fail` aborts the render unconditionally. Combine with `if` to validate value combinations before emitting YAML.' },
  { code: 'helm get values --all myrelease', cat: 'deep',
    pt: 'Mostra o values MERGEADO final (defaults + overrides) do release no cluster — resolve 90% dos "mas eu configurei X".',
    en: 'Shows the final MERGED values (defaults + overrides) of the release in the cluster — solves 90% of "but I configured X".' },
  { code: '{{ .Values.spec | toYaml }}\n{{ .Values.spec | toJson }}\n{{ .Values.spec | toPrettyJson }}', cat: 'deep',
    pt: 'As três serializações: toYaml (pra embed em ConfigMap), toJson e toPrettyJson (quando o campo do k8s exige JSON).',
    en: 'The three serializers: toYaml (for embedding into a ConfigMap), toJson and toPrettyJson (when the k8s field requires JSON).' },

  // ─── Gotchas ─────────────────────────────────────────────────────────
  { code: 'helm upgrade myrelease ./mychart --set image.tag="1.25"', cat: 'gotchas',
    pt: '`--set` e o YAML fazem inferência de tipo: sem aspas, `--set image.tag=1.25` vira número e quebra o render. Nos valores: `tag: "1.25"`.',
    en: '`--set` and YAML infer types: unquoted, `--set image.tag=1.25` becomes a number and breaks the render. In values: `tag: "1.25"`.' },
  { code: '{{ .Values.foo }} # quando foo é um objeto', cat: 'gotchas',
    pt: 'Imprimir um MAP diretamente renderiza `map[chave:valor]` — inútil e às vezes inválido. Objetos sempre passam por `toYaml | nindent` antes.',
    en: 'Printing a MAP directly renders `map[key:value]` — useless and sometimes invalid. Objects always go through `toYaml | nindent` first.' },
  { code: '{{ .Release.Name | trunc 63 | trimSuffix "-" }}', cat: 'gotchas',
    pt: 'Nomes de recursos k8s (e labels) têm teto de 63 chars. O `fullname` padrão do Helm trunca e tira o `-` final pra nunca estourar.',
    en: 'k8s resource (and label) names are capped at 63 chars. The standard Helm `fullname` truncates and trims the trailing `-` so it never overflows.' },
  { code: 'helm install --dry-run myrelease ./mychart # vs helm template', cat: 'gotchas',
    pt: '`helm template` só renderiza (não fala com o cluster). `--dry-run` envia pro API server com dry-run — pega validação de schema e colisão de nomes.',
    en: '`helm template` only renders (no cluster contact). `--dry-run` POSTs to the API server with dry-run — catches schema validation and name collisions.' },
  { code: 'kubectl get secret -l owner=helm', cat: 'gotchas',
    pt: 'O Helm guarda o histórico de cada release num Secret com label `owner=helm`. É ESSE secret que permite rollback/upgrade — não o apague à toa.',
    en: "Helm stores each release's history in a Secret labeled `owner=helm`. THAT secret is what enables rollback/upgrade — do not delete it casually." },
  { code: 'helm upgrade --install myrelease ./mychart --atomic', cat: 'gotchas',
    pt: '`--atomic` + `--install` é o padrão do CI: se o deploy falhar, ele já faz rollback sozinho (e desfaz a instalação se for novo).',
    en: '`--atomic` + `--install` is the CI pattern: on failure it rolls back on its own (and uninstalls if it was a fresh install).' },
  { code: '--set autoscaling.enabled=false', cat: 'gotchas',
    pt: 'Booleano via `--set`: `false` é respeitado (não vira string "false"). Mas em YAML, `enabled: {{ .Values.x }}` pode precisar de `| quote`.',
    en: 'Boolean via `--set`: `false` is respected (not the string "false"). But in YAML, `enabled: {{ .Values.x }}` may need `| quote`.' },
  { code: '{{ include "subchart.template" . }} # de um subchart', cat: 'gotchas',
    pt: 'Helpers de subchart recebem o scope do PARENT quando chamadas com `.`. Esquecer o `.` final = variáveis vazias e template quebrado.',
    en: 'Subchart helpers receive the PARENT scope when called with `.`. Forgetting the trailing `.` = empty variables and a broken template.' },
  { code: 'kubectl delete job pre-install-migrate # após falha', cat: 'gotchas',
    pt: 'Hook que falha deixa o Job órfão (a menos que hook-delete-policy remova). Antes de tentar o install de novo, limpe o Job do hook que ficou pra trás.',
    en: 'A failed hook leaves its Job orphaned (unless hook-delete-policy removes it). Before retrying the install, clean up the leftover hook Job.' },
  { code: 'replicas: {{ .Values.replicaCount }} # int vs string', cat: 'gotchas',
    pt: 'Números renderizam como número, mas se o value veio de `--set-string` ou de aspas no YAML, vira string — `replicas: "3"` é rejeitado por muitos recursos.',
    en: 'Numbers render as numbers, but if the value came from `--set-string` or from quotes in YAML it becomes a string — `replicas: "3"` is rejected by many resources.' },
  { code: "--set 'ingress.annotations.nginx\\.ingress\\.kubernetes\\.io/rewrite-target=/'", cat: 'gotchas',
    pt: 'Chave com PONTO LITERAL no nome (como o nginx ingress) precisa do ponto escapado com `\\.` entre aspas simples — senão o Helm lê como aninhamento.',
    en: 'Keys with LITERAL DOTS in the name (like the nginx ingress) need the dots escaped as `\\.` inside single quotes — otherwise Helm reads them as nesting.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Helm',
    intro: (
      <>
        O gerenciador de pacotes do Kubernetes: do{' '}
        <Text code>helm install</Text>/<Text code>upgrade</Text>/
        <Text code>rollback</Text> à estrutura de chart, ao{' '}
        <Text code>templating</Text> (values, pipelines, <Text code>if</Text>/
        <Text code>range</Text>/<Text code>with</Text>, funções Sprig),
        dependências, hooks e os gotchas que derrubam deploy no meio da
        madrugada.
      </>
    ),
    search: 'Pesquisar por comando ou descrição...',
    all: 'Todos',
    empty: 'Nada encontrado. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega quem está começando',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Release ≠ chart ≠ revision.</Text> O chart é o
          pacote; o <Text code>release</Text> é uma instância instalada (com
          nome próprio); cada <Text code>upgrade</Text> cria uma{' '}
          <Text code>revision</Text> nova, e é pra ela que o{' '}
          <Text code>helm rollback</Text> volta.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Renderize antes de instalar.</Text>{' '}
          <Text code>helm template</Text> renderiza os templates SEM falar
          com o cluster — rode no CI pra revisar o YAML. O{' '}
          <Text code>--dry-run</Text> valida contra o API server e pega
          problemas de schema que o render local não vê.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Precedência de values.</Text> Do mais fraco pro mais
          forte: defaults do <Text code>values.yaml</Text> do chart →{' '}
          <Text code>-f</Text> (o último arquivo vence, maps mesclam) →{' '}
          <Text code>--set</Text>. Valor global?{' '}
          <Text code>global.*</Text> é visível dos subcharts.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Tipos inferidos quebram YAML.</Text>{' '}
          <Text code>--set image.tag=1.25</Text> vira número e o render
          falha. Use <Text code>| quote</Text> no template ou{' '}
          <Text code>--set-string</Text>/aspas no YAML pra forçar string.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Nomes estouram em 63 chars.</Text> Recurso/label do
          k8s não passa de 63 caracteres. O padrão{' '}
          <Text code>trunc 63 | trimSuffix "-"</Text> existe por isso.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>CI: sempre --atomic.</Text>{' '}
          <Text code>helm upgrade --install --atomic</Text> cria se não
          existe, e em caso de falha faz rollback sozinho — sem deixar o
          deploy pela metade.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar comando',
    copiedCode: 'Comando copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Helm Cheat Sheet',
    intro: (
      <>
        The Kubernetes package manager: from{' '}
        <Text code>helm install</Text>/<Text code>upgrade</Text>/
        <Text code>rollback</Text> to chart structure and{' '}
        <Text code>templating</Text> (values, pipelines, <Text code>if</Text>/
        <Text code>range</Text>/<Text code>with</Text>, Sprig functions),
        dependencies, hooks, and the gotchas that break deploys at 3 AM.
      </>
    ),
    search: 'Search by command or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Release ≠ chart ≠ revision.</Text> The chart is the
          package; the <Text code>release</Text> is an installed instance
          (with its own name); each <Text code>upgrade</Text> creates a new{' '}
          <Text code>revision</Text>, and that is what{' '}
          <Text code>helm rollback</Text> goes back to.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Render before you install.</Text>{' '}
          <Text code>helm template</Text> renders the templates WITHOUT
          touching the cluster — run it in CI to review the YAML.{' '}
          <Text code>--dry-run</Text> validates against the API server and
          catches schema issues the local render cannot see.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Values precedence.</Text> Weakest to strongest: chart{' '}
          <Text code>values.yaml</Text> defaults → <Text code>-f</Text> (the
          last file wins, maps merge) → <Text code>--set</Text>. Need shared
          config? <Text code>global.*</Text> is visible from subcharts.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Inferred types break YAML.</Text>{' '}
          <Text code>--set image.tag=1.25</Text> becomes a number and the
          render fails. Use <Text code>| quote</Text> in the template or{' '}
          <Text code>--set-string</Text>/quotes in YAML to force a string.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Names overflow at 63 chars.</Text> k8s resources/labels
          cannot exceed 63 characters. The{' '}
          <Text code>trunc 63 | trimSuffix "-"</Text> pattern exists for a
          reason.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>CI: always --atomic.</Text>{' '}
          <Text code>helm upgrade --install --atomic</Text> creates the
          release if missing and auto-rolls-back on failure — no half-done
          deploys.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy command',
    copiedCode: 'Command copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function HelmCheatsheetPage() {
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
    const header = '# Helm (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```',
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
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
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
          <Button size="small" icon={<ReadOutlined />} onClick={copyMarkdown}>
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
