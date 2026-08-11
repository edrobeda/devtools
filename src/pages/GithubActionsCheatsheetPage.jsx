import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined, GithubOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['structure', 'triggers', 'jobs', 'steps', 'expressions', 'actions', 'tips']

const CATEGORY_COLOR = {
  structure: 'blue',
  triggers: 'geekblue',
  jobs: 'purple',
  steps: 'cyan',
  expressions: 'green',
  actions: 'gold',
  tips: 'magenta',
}

const labelOf = {
  structure: { pt: 'Estrutura do workflow', en: 'Workflow structure' },
  triggers: { pt: 'Eventos de disparo (on:)', en: 'Trigger events (on:)' },
  jobs: { pt: 'Jobs & execução', en: 'Jobs & execution' },
  steps: { pt: 'Steps & comandos', en: 'Steps & commands' },
  expressions: { pt: 'Expressões & contexts', en: 'Expressions & contexts' },
  actions: { pt: 'Actions prontas', en: 'Ready-made actions' },
  tips: { pt: 'Deploy & dicas do dia a dia', en: 'Deploy & everyday tips' },
}

const ITEMS = [
  // ─── Estrutura do workflow ────────────────────────────────────────────
  { code: '.github/workflows/ci.yml', cat: 'structure',
    pt: 'O workflow mora aqui: qualquer `*.yml`/`*.yaml` dentro de `.github/workflows/` vira um pipeline ativo na aba Actions. O NOME DO ARQUIVO é a identidade técnica; o `name:` interno é só rótulo.',
    en: 'The workflow lives here: any `*.yml`/`*.yaml` inside `.github/workflows/` becomes an active pipeline in the Actions tab. The FILE NAME is the technical identity; the inner `name:` is just a label.' },
  { code: 'name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm test', cat: 'structure',
    pt: 'O esqueleto mínimo: `on:` declara quando dispara (aqui: todo push), `jobs:` roda em paralelo, cada job tem `runs-on` (o runner) e uma lista de `steps`. O arquivo inteiro é YAML — indentação de 2 espaços importa.',
    en: 'The minimal skeleton: `on:` declares when it fires (here: every push), `jobs:` run in parallel, each job has `runs-on` (the runner) and a `steps` list. The whole file is YAML — 2-space indentation matters.' },
  { code: 'name: CI', cat: 'structure',
    pt: 'Rótulo exibido na aba Actions (só exibição). Sem ele o GitHub usa o nome do arquivo. Não é usado como chave de busca nem no `workflow_run`.',
    en: 'Label shown in the Actions tab (display only). Without it GitHub uses the file name. It is not a lookup key and is not used by `workflow_run`.' },
  { code: 'run-name: "Deploy ${{ github.ref }}"', cat: 'structure',
    pt: 'Nome da EXECUÇÃO individual (a linha do histórico de runs) — diferente do `name:` do workflow. Com `github.event.inputs`, cada botão manual fica identificável.',
    en: 'Name of the individual RUN (the row in the run history) — unlike the workflow `name:`. With `github.event.inputs` each manual run becomes identifiable.' },
  { code: 'permissions:\n  contents: read\n  pull-requests: write', cat: 'structure',
    pt: 'Escopo do `GITHUB_TOKEN` automático: declare o MÍNIMO. Em repositório novo o padrão é só leitura; o bloco passa a ser a fonte da verdade — escrever release/PR exige subir o escopo aqui.',
    en: 'The automatic `GITHUB_TOKEN` scope: declare the LEAST. New repos default to read-only; this block becomes the source of truth — writing releases/PRs requires raising a scope here.' },
  { code: 'defaults:\n  run:\n    shell: bash\n    working-directory: services/api', cat: 'structure',
    pt: 'Defaults para TODOS os `run:` de todos os jobs (shell e diretório de trabalho). O mesmo bloco respeitado dentro de um job sobrescreve pra aquele job.',
    en: 'Defaults for ALL `run:` in every job (shell and working directory). An identical block inside one job overrides it for that job only.' },
  { code: 'on: push\n\non:\n  push:\n    branches:\n      - main\n\non: [push, pull_request]', cat: 'structure',
    pt: 'Três formas do `on:`: string (evento único), mapa (evento + filtros) e array (`[a, b]` = vai disparar em qualquer um dos dois).',
    en: 'Three shapes of `on:`: a string (single event), a map (event + filters) and an array (`[a, b]` = fires on either).' },

  // ─── Eventos de disparo (on:) ──────────────────────────────────────────
  { code: 'on: push', cat: 'triggers',
    pt: 'Todo push — na branch ou tag default apertada ou em qualquer branch, dependendo do repo. O evento do dia a dia de CI.',
    en: 'Every push — into the default branch or anything, depending on the repo. The everyday CI event.' },
  { code: 'on:\n  push:\n    branches: [main, develop]\n    branches-ignore: ["v*"]', cat: 'triggers',
    pt: 'Filtro por branch/tag. `branches` e `branches-ignore` são mutuamente exclusivos — use só um dos dois por evento.',
    en: 'Filter by branch/tag. `branches` and `branches-ignore` are mutually exclusive — use only one of them per event.' },
  { code: 'on:\n  push:\n    paths:\n      - "src/**"\n      - "!src/legacy/**"', cat: 'triggers',
    pt: 'Só quando ESSES arquivos mudam (`paths`; `paths-ignore` pra negar). Reduz o CI de monorepo a só o que foi tocado.',
    en: 'Only when THOSE files change (`paths`; `paths-ignore` to negate). Slims monorepo CI down to what was actually touched.' },
  { code: 'on:\n  push:\n    tags:\n      - "v*"', cat: 'triggers',
    pt: 'Empurrou tag `v...` → roda. É o gatilho clássico do release: tag → build → `gh release create` com um único pipeline.',
    en: 'A `v...` tag pushed → fires. The classic release trigger: tag → build → single pipeline calling `gh release create`.' },
  { code: 'on: pull_request', cat: 'triggers',
    pt: 'PR aberto/atualizado na branch-de-base do PR (alvo do merge). Em PR vindo de FORK o GitHub roda o workflow do merge ref com `GITHUB_TOKEN` read-only e SEM secrets — por isso segredo não cai aqui.',
    en: 'PR opened/updated against the PR\'s base branch (merge target). For PRs from FORKS GitHub runs the workflow from the merge ref with a read-only `GITHUB_TOKEN` and NO secrets — that is why secrets never land here.' },
  { code: 'on:\n  pull_request:\n    types: [opened, synchronize, reopened]', cat: 'triggers',
    pt: 'Filtra o PR `pull_request` por tipo de evento. `synchronize` = push novo na branch do PR — o gatilho padrão; `review_requested`/`labeled` são outros úteis.',
    en: 'Filters `pull_request` by event type. `synchronize` = a new push to the PR branch — the default trigger; `review_requested`/`labeled` are other handy ones.' },
  { code: 'on: workflow_dispatch', cat: 'triggers',
    pt: 'O BOTÃO manual na aba Actions: habilita "Run workflow" escolhendo branch. Com `inputs:` você define parâmetros que viram `github.event.inputs.nome`.',
    en: 'The MANUAL button in the Actions tab: enables "Run workflow" picking the branch. With `inputs:` you define parameters that become `github.event.inputs.name`.' },
  { code: 'on:\n  schedule:\n    - cron: "0 2 * * *"', cat: 'triggers',
    pt: 'Cron 5 campos. Roda na branch PADRÃO do repo somente — se o trabalho depende de outra branch, você não consegue programar pra ela.',
    en: '5-field cron. Runs against the DEFAULT branch only — if the work depends on another branch, you cannot schedule for it.' },
  { code: 'on:\n  workflow_run:\n    workflows: [Deploy]\n    types: [completed]', cat: 'triggers',
    pt: 'Encadeia workflows: dispara quando OUTRO pipeline termina. O contexto `github.event.workflow_run` guarda o id/status do run-pai — útil pra tirar artefato dele.',
    en: 'Chains workflows: fires when ANOTHER pipeline finishes. The `github.event.workflow_run` context holds the parent run id/status — handy to pull its artifacts.' },
  { code: 'on:\n  release:\n    types: [published]', cat: 'triggers',
    pt: 'Release publicado (ou draft/prereleased/edited...). Complementa o tag: release tem metadados (notes, assets), tag é só string.',
    en: 'Release published (or draft/prereleased/edited...). Complements the tag: releases carry metadata (notes, assets), a tag is just a string.' },
  { code: 'on:\n  push:\n    branches:\n      - main\n    paths:\n      - "services/**"', cat: 'triggers',
    pt: 'Filtros combinados: branch E caminhos devem casar ao mesmo tempo (AND entre eventos-filhos do mesmo mapa).',
    en: 'Combined filters: both branch AND paths must match (AND between the child events of the same map).' },

  // ─── Jobs & execução ───────────────────────────────────────────────────
  { code: 'jobs:\n  build:\n    runs-on: ubuntu-latest', cat: 'jobs',
    pt: 'Um job = um runner. `ubuntu-latest`/`windows-latest`/`macos-latest` são os runners hospedados; jobs rodam em paralelo por padrão.',
    en: 'A job = one runner. `ubuntu-latest`/`windows-latest`/`macos-latest` are the hosted runners; jobs run in parallel by default.' },
  { code: 'runs-on: [self-hosted, linux, x64]', cat: 'jobs',
    pt: 'Runner próprio — o GitHub escolhe um runner que tenha as três labels. O runner fica na máquina da empresa; o workflow não muda.',
    en: 'A custom runner — GitHub picks a runner bearing all three labels. The runner lives on company hardware; the workflow does not change.' },
  { code: 'jobs:\n  build:\n    needs: lint', cat: 'jobs',
    pt: 'Ordena: este job só começa quando o listado terminou (e FAILED se ele falhou). `needs: [lint, test]` espera por vários. Sem `needs` tudo é paralelo.',
    en: 'Orders: this job only starts after the listed one finishes (and FAILS if it failed). `needs: [lint, test]` waits for several. Without `needs` everything is parallel.' },
  { code: 'strategy:\n  fail-fast: false\n  matrix:\n    node: [18, 20, 22]\n    os: [ubuntu-latest, windows-latest]', cat: 'jobs',
    pt: 'Matrix: um COMBINATÓRIO de jobs (aqui 3×2=6). Cada combinação expõe `matrix.node`/`matrix.os` nos steps. `fail-fast: false` deixa as outras combinações continuarem quando uma falha.',
    en: 'Matrix: a combinatorial fan-out of jobs (here 3×2=6). Each combo exposes `matrix.node`/`matrix.os` in steps. `fail-fast: false` lets the other combos keep running when one fails.' },
  { code: 'runs-on: ubuntu-latest\ncontainer: node:20-bullseye', cat: 'jobs',
    pt: 'Roda todos os steps DESSE job dentro de um container (mesma image do deploy = menos "funciona aqui"). `container:` aceita image, `env:`, volumes e `options:`.',
    en: 'Runs every step of THIS job inside a container (same image as prod = fewer "works here" bugs). `container:` accepts an image, `env:`, volumes and `options:`.' },
  { code: 'if: github.ref == "refs/heads/main"', cat: 'jobs',
    pt: 'Condicional no nível do job: `if:` recebe uma expressão ou comparações — aqui o deploy só roda do main. Também existe por step e por step-job.',
    en: 'Conditional at job level: `if:` takes an expression or comparisons — here a deploy only runs from main. Also available per step.' },
  { code: 'continue-on-error: true', cat: 'jobs',
    pt: 'Job experimental: se falhar, marca ✱ no check (o pipeline segue verde). Ideal pra linters de aviso ou jobs de exploração.',
    en: 'Experimental job: on failure it marks ✱ in the check (the run stays green). Great for warning linters or exploratory jobs.' },
  { code: 'environment: production', cat: 'jobs',
    pt: 'Environment (Settings → Environments): protection rules (quem pode deployar, espera de aprovação) + secrets/vas scoped ao ambiente. É o "aprovador de deploy" nativo.',
    en: 'Environment (Settings → Environments): protection rules (who may deploy, required reviewers) plus environment-scoped secrets/variables. The native "deploy approver".' },
  { code: 'concurrency:\n  group: deploy-${{ github.ref }}\n  cancel-in-progress: true', cat: 'jobs',
    pt: 'Impõe uma MÁXIMA de uma execução do grupo por vez: a anterior do mesmo deploy morre (`cancel-in-progress: true`) em vez de duas subirem ao mesmo tempo.',
    en: 'Enforces AT MOST one run of the group at a time: the previous deploy is cancelled (`cancel-in-progress: true`) instead of two racing to ship.' },
  { code: 'timeout-minutes: 30', cat: 'jobs',
    pt: 'Tempo máximo do job (default: 360 min). Evita o job preso gastando minutos gratuitos a toa — botões de proteção de jobs de longa duração.',
    en: 'Max job time (default 360 min). Stops a stuck job burning minutes for free — protection for long-running jobs.' },
  { code: 'env:\n  NODE_ENV: test\n  API_URL: ${{ vars.API_BASE }}', cat: 'jobs',
    pt: 'Variáveis do job (e existem no nível workflow e no step). Valores ficam visíveis no log — segredo vai em `secrets`, nunca aqui.',
    en: 'Variables for the job (also available at workflow and step level). Values show up in logs — secrets go in `secrets`, never here.' },
  { code: 'outputs:\n  version: ${{ steps.version.outputs.v }}\n\nneeds: build\nrun: echo "version=${{ needs.build.outputs.version }}"', cat: 'jobs',
    pt: 'Passar dado entre jobs: o job de origem declara `outputs:` e o `needs` do destino lê com `needs.<job>.outputs.<nome>`. Arraste dados SEM artefato quando dá.',
    en: 'Passing data between jobs: the source job declares `outputs:` and the consumer reads `needs.<job>.outputs.<name>`. Move data between jobs without artifacts when possible.' },

  // ─── Steps & comandos ──────────────────────────────────────────────────
  { code: '- uses: actions/checkout@v4', cat: 'steps',
    pt: 'Clona o repo (e a branch reflex no ref do evento). É o primeiro step de 99% dos pipelines — sem ele `run:` não tem código local pra rodar.',
    en: 'Clones the repo (and the branch at the event ref). The first step of 99% of pipelines — without it `run:` has no code to execute.' },
  { code: '- run: npm ci', cat: 'steps',
    pt: 'Executa comando no shell do runner (bash no Linux/macOS, pwsh no Windows). `npm ci` é o instalador determinístico de CI (não toca o lockfile).',
    en: 'Runs a command in the runner\'s shell (bash on Linux/macOS, pwsh on Windows). `npm ci` is the deterministic CI installer (does not touch the lockfile).' },
  { code: '- run: |\n    npm ci\n    npm run build\n    npm test', cat: 'steps',
    pt: 'Várias linhas: o `|` do YAML e os comandos rodam no MESMO shell (mesmo cwd e variáveis). Cada step, porém, é um processo novo — variável não cruza steps sozinha.',
    en: 'Multi-line: the YAML `|` and every line run in the SAME shell (same cwd and vars). Each step, however, is a fresh process — variables do not cross steps by themselves.' },
  { code: '- uses: actions/setup-node@v4\n  with:\n    node-version: 20\n    cache: npm', cat: 'steps',
    pt: 'Funciona Node no runner e `cache: npm` aproveita o cache-deps do GitHub (com chave derivada do `package-lock.json`). `with:` é onde os inputs de uma action vão.',
    en: 'Sets up Node on the runner and `cache: npm` benefits from GitHub\'s dep cache (key derived from `package-lock.json`). `with:` is where an action\'s inputs go.' },
  { code: 'env:\n  FOO: bar\nrun: echo "$FOO"', cat: 'steps',
    pt: 'Variáveis do step: existem só durante ele (o `$GITHUB_ENV` é o que cruza steps). `env:` também aceita expressões `${{ }}`.',
    en: 'Step-level variables: only live during the step (crossing steps requires `$GITHUB_ENV`). `env:` also accepts `${{ }}` expressions.' },
  { code: 'working-directory: frontend\nrun: npm test', cat: 'steps',
    pt: '`cd` antes do comando — só do step. Para todos os steps de um job use `defaults.run.working-directory` ou o `defaults:` do job.',
    en: 'Changes directory before the command — step only. For every step use `defaults.run.working-directory` or the job-level `defaults:`.' },
  { code: '- run: echo "MY_VAR=hello" >> $GITHUB_ENV', cat: 'steps',
    pt: 'Persiste variável pros steps SEGUINTES do job (arquivo `GITHUB_ENV` append). O mesmo truque vale pra `GITHUB_OUTPUT` (saída do step) e `GITHUB_PATH` (PATH).',
    en: 'Persists a variable for the FOLLOWING steps of the job (appends to the `GITHUB_ENV` file). Same trick for `GITHUB_OUTPUT` (step output) and `GITHUB_PATH` (PATH).' },
  { code: '- id: version\n  run: echo "v=1.2.3" >> $GITHUB_OUTPUT', cat: 'steps',
    pt: '`id:` dá identidade pro step — aí `steps.version.outputs.v` lê o que o step escreveu no `GITHUB_OUTPUT`. O canal oficial de saída entre steps.',
    en: '`id:` gives the step an identity — then `steps.version.outputs.v` reads what the step wrote to `GITHUB_OUTPUT`. The official step-to-step output channel.' },
  { code: 'if: ${{ startsWith(github.ref, "refs/tags/") }}', cat: 'steps',
    pt: 'Step condicional por expressão. Formas do if: `env.NOME`, `startsWith(...)`, comparação... e funções de status (`success()`, `always()`).',
    en: 'Conditional step via expression. `if` forms: `env.NAME`, `startsWith(...)`, comparisons... and status functions (`success()`, `always()`).' },
  { code: 'shell: bash\nrun: |\n  set -euo pipefail\n  npm ci', cat: 'steps',
    pt: 'Troca o shell do step (bash/pwsh/python...). Em workflows `.yml` no Windows o runner pode não ter bash no PATH — `shell: bash` força com o bash do Git for Windows.',
    en: 'Swaps the step shell (bash/pwsh/python...). On Windows in a plain `.yml` the runner PATH may have no bash — `shell: bash` forces the Git for Windows bash.' },
  { code: '- name: Send failure report\n  if: failure()\n  run: echo "job falhou — toca o alerta"', cat: 'steps',
    pt: 'Step que roda SÓ quando o job falhou: `if: failure()` é o par do `if: success()` (disparado no fracasso). `always()` roda sempre, até cancelado.',
    en: 'A step that runs ONLY when the job failed: `if: failure()` is the counterpart of `if: success()` on failure. `always()` runs no matter what, even cancelled.' },
  { code: 'continue-on-error: true\nrun: npx tsc --noEmit', cat: 'steps',
    pt: 'Falha do step não derruba o job: útil pro type-check de aviso num job validation que não quer barrar o deploy.',
    en: 'A step failure does not fail the job: handy for a warning tsc check inside a validation job that must not block the deploy.' },

  // ─── Expressões & contexts ─────────────────────────────────────────────
  { code: '${{ github.ref }}', cat: 'expressions',
    pt: 'Branch/tag que disparou: `refs/heads/main`, `refs/tags/v1.0`... O contexto `github` é o mais consultado.',
    en: 'The branch/tag that fired: `refs/heads/main`, `refs/tags/v1.0`... The `github` context is the most-queried one.' },
  { code: '${{ github.sha }}', cat: 'expressions',
    pt: 'O commit exato do ref — a identificação "à prova de bala" de deploy: tagueie a imagem/artefato com o SHA pra saber na hora qual commit subiu.',
    en: 'The exact commit of the ref — the bulletproof deploy ID: tag your image/artifact with `github.sha` so you always know which commit went up.' },
  { code: '${{ github.head_ref }}\n${{ github.base_ref }}', cat: 'expressions',
    pt: 'Em PR: a branch-fonte (`head_ref`) e a branch-destino (`base_ref`). Fora de PR os dois são string vazia — o `github.event_name` desambigua.',
    en: 'On PRs: the source branch (`head_ref`) and the target branch (`base_ref`). Outside PRs both are empty strings — `github.event_name` disambiguates.' },
  { code: '${{ github.event_name }}', cat: 'expressions',
    pt: 'Qual evento disparou: `push`, `pull_request`, `schedule`, `workflow_dispatch`, `workflow_run`... O switch de um pipeline multi-gramática.',
    en: 'Which event fired: `push`, `pull_request`, `schedule`, `workflow_dispatch`, `workflow_run`... The switch of a multi-trigger pipeline.' },
  { code: '${{ github.actor }}', cat: 'expressions',
    pt: 'Quem disparou (push/PR/botão). Para autorização séria prefira `secrets`/environment rules — contexto é dado do evento, não prova de identidade.',
    en: 'Who fired it (push/PR/button). For real authorization prefer `secrets`/environment rules — a context value is event data, not proof of identity.' },
  { code: '${{ github.event.pull_request.number }}', cat: 'expressions',
    pt: 'Número do PR dentro do payload `github.event.*` — comentar/rotular o PR certo exige esse número.',
    en: 'The PR number inside the `github.event.*` payload — commenting/labeling the right PR needs this number.' },
  { code: '${{ github.workspace }}', cat: 'expressions',
    pt: 'Diretório default do repo no runner — o cwd do checkout. Equivale a `RUNNER_WORKSPACE/<nome-do-repo>` na prática.',
    en: 'The default repo directory on the runner — the checkout\'s cwd. In practice `RUNNER_WORKSPACE/<repo-name>`.' },
  { code: '${{ runner.os }}\n${{ runner.temp }}', cat: 'expressions',
    pt: 'Contexto `runner`: `os` (Linux/Windows/macOS) e `temp` (diretório temporário — o lugar certo pra arquivos intermediários que não ficam no repo).',
    en: 'The `runner` context: `os` (Linux/Windows/macOS) and `temp` (the temp dir — the right place for throwaway files that must not pollute the repo).' },
  { code: '${{ env.MINHA_VAR }}', cat: 'expressions',
    pt: 'Contexto `env` — variáveis definidas no workflow/job/step. Não confunda com `$MINHA_VAR` do shell, que existe só no processo do comando.',
    en: 'The `env` context — variables set at workflow/job/step level. Not to be confused with `$MINHA_VAR` of the shell, which only exists in the command\'s process.' },
  { code: '${{ vars.MINHA_VAR }}', cat: 'expressions',
    pt: 'Variables (aba Settings → Actions → Variables): configuração QUE NÃO É segredo — ambiente, alvo de deploy, feature-flags editáveis sem tocar no workflow.',
    en: 'Variables (Settings → Actions → Variables): NON-secret configuration — environment, deploy target, feature flags editable without touching the workflow.' },
  { code: '${{ secrets.MEU_TOKEN }}', cat: 'expressions',
    pt: 'Secrets (Settings → Secrets): valor DUPLO-censurado nos logs. Pra env-classe, prefira secrets de environment. Secret ausente vira string vazia — não explode.',
    en: 'Secrets (Settings → Secrets): value fully masked in logs. For environment-class values prefer environment-scoped secrets. A missing secret becomes an empty string — no crash.' },
  { code: '${{ needs.build.outputs.version }}', cat: 'expressions',
    pt: 'Outputs de OUTRO job, lido no job que declara `needs: build`. O jeito de enviar "o que build descobriu" (versão, hash) pros conseguintes.',
    en: 'Outputs of ANOTHER job, readable in a job that declares `needs: build`. The way to send what "build found out" (version, hash) downstream.' },
  { code: '${{ steps.build.outputs.version }}', cat: 'expressions',
    pt: 'Outputs de UM step do mesmo job — escrito no `GITHUB_OUTPUT` pela par com `id:`. O "retorno de função" da CI.',
    en: 'Outputs of ONE step in the same job — written to `GITHUB_OUTPUT` by the step with `id:`. The "function return" of CI.' },
  { code: '${{ matrix.node }}', cat: 'expressions',
    pt: 'Valor da combinação atual na matrix — cada combinação roda com sua fatia e `matrix` no contexto.',
    en: 'The value of the current matrix combo — each combo runs with its slice of `matrix` in context.' },
  { code: "if: ${{ !contains(github.ref, 'eventify/enhance-') }}", cat: 'expressions',
    pt: 'Operadores e funções: `!` nega, `contains(string, busca)` casa substring, `startsWith`/`endsWith` pelas bordas. Tudo dentro do `${{ }}`.',
    en: 'Operators and functions: `!` negates, `contains(string, needle)` matches a substring, `startsWith`/`endsWith` at the edges. All inside `${{ }}`.' },
  { code: '${{ fromJSON(secrets.MATRIX) }}\n${{ toJSON(github) }}', cat: 'expressions',
    pt: '`fromJSON()` desserializa JSON guardado (matriz complexa num secret/vars); `toJSON()` serializa — úteis pra `strategy.matrix` dinâmica e pra debugar o payload.',
    en: '`fromJSON()` parses JSON you stored (a complex matrix in a secret/vars); `toJSON()` serializes — handy for dynamic `strategy.matrix` and payload debugging.' },
  { code: 'if: ${{ success() }}\nif: ${{ failure() }}\nif: ${{ always() }}', cat: 'expressions',
    pt: 'Funções de coloração: `success()` (tudo verde), `failure()` (algo falhou), `always()` (rodou, falhou ou cancelou). O trio do step de notificação.',
    en: 'Status-tint functions: `success()` (all green), `failure()` (something failed), `always()` (ran, failed or cancelled). The trio behind notification steps.' },
  { code: "${{ format('release-{0}-{1}', github.sha, github.run_attempt) }}", cat: 'expressions',
    pt: '`format(str, ...)` é o printf do contexto — monta nomes de artefato/tag/cache sem concatenar fragments feios no meio do YAML.',
    en: '`format(str, ...)` is the context printf — builds artifact/tag/cache names without ugly concatenation in the middle of YAML.' },

  // ─── Actions prontas ───────────────────────────────────────────────────
  { code: 'uses: actions/checkout@v4', cat: 'actions',
    pt: 'Checkout do repo — a action mais usada do ecossistema. `@v4` é tag major (compatível); fixar `@<sha-40>` é o jeito supply-chain-safe.',
    en: 'Repo checkout — the most used action in the ecosystem. `@v4` is a major tag (compatible); pinning `@<sha-40>` is the supply-chain-safe way.' },
  { code: 'uses: actions/setup-node@v4\nwith:\n  node-version: 20\n  cache: npm', cat: 'actions',
    pt: 'Instala Node + cache automático do npm (chave derivada do lockfile). `node-version: "20.x"`/`20` ou `${{ matrix.node }}`.',
    en: 'Installs Node + automatic npm cache (key derived from the lockfile). `node-version: "20.x"`/`20` or `${{ matrix.node }}`.' },
  { code: 'uses: actions/setup-python@v5\nwith:\n  python-version: "3.12"\n  cache: pip', cat: 'actions',
    pt: 'Python com cache de pip (`cache-dependency-path` se o requirements morar fora do root). A mesma família (setup-java/setup-go...) existe pra cada runtime.',
    en: 'Python with pip cache (use `cache-dependency-path` if requirements live outside the root). The same family exists for every runtime (setup-java/setup-go...).' },
  { code: 'uses: actions/cache@v4\nwith:\n  path: ~/.pnpm-store\n  key: pnpm-${{ hashFiles("pnpm-lock.yaml") }}\n  restore-keys: |\n    pnpm-', cat: 'actions',
    pt: 'Cache arbitrário: `key` deve variar quando a entrada muda (hashFiles do lockfile); `restore-keys` é o fallback por prefixo (cache anterior serve de base parcial).',
    en: 'Arbitrary cache: the `key` must vary when its inputs change (hashFiles of the lockfile); `restore-keys` is the prefix fallback (a previous base cache serves as partial restore).' },
  { code: 'uses: actions/upload-artifact@v4\nwith:\n  name: build\n  path: dist/\n\nuses: actions/download-artifact@v4\nwith:\n  name: build', cat: 'actions',
    pt: 'Upload/download de artefatos entre JOBS. O download volta pro workspace do runner; artefatos expiram (default 90 dias, `retention-days` ajusta).',
    en: 'Upload/download artifacts between JOBS. The download lands back in the runner workspace; artifacts expire (default 90 days, tune with `retention-days`).' },
  { code: 'uses: docker/login-action@v3\nwith:\n  registry: ghcr.io\n  username: ${{ github.actor }}\n  password: ${{ secrets.GITHUB_TOKEN }}', cat: 'actions',
    pt: 'Login no registry via `GITHUB_TOKEN` — empurrar image de CI pra GHCR/ECR/etc. sem guardar credencial no repo (token automático resolve).',
    en: 'Login to a registry using `GITHUB_TOKEN` — pushing CI-built images to GHCR/ECR/etc. without a stored credential (the automatic token covers it).' },
  { code: 'uses: actions/github-script@v7\nwith:\n  script: |\n    const { data } = await github.rest.issues.addLabels({\n      issue_number: context.issue.number,\n      owner: context.repo.owner,\n      repo: context.repo.repo,\n      labels: ["ci"]\n    })', cat: 'actions',
    pt: 'Roda JavaScript no runner com `github` (octokit autenticado), `context` e `core` — a polyvalente: rotular PR, comentar, colar app de automação.',
    en: 'Runs JavaScript in the runner with `github` (authenticated octokit), `context` and `core` — the Swiss-army: label PRs, comment, drop a bit of automation.' },
  { code: 'gh release create v1.0.0 dist/*.zip --generate-notes', cat: 'actions',
    pt: 'O `gh` CLI já vem instalado e autenticado (com `GITHUB_TOKEN`) em todo runner — criar release, subir assets e gerar notas sem action de terceiros.',
    en: 'The `gh` CLI is preinstalled and authenticated (with `GITHUB_TOKEN`) on every runner — creating releases, uploading assets and generating notes without a third-party action.' },
  { code: 'gh pr review --approve\ngh pr merge --squash --delete-branch\ngh run list --workflow=ci.yml --status=failure', cat: 'actions',
    pt: 'Trindade do `gh` pra revisão automatizada: aprovar (com `--body` de regra de CI), mergear por squash e inspecionar runs — a mesma coisa que você faria na mão, agora dentro do run.',
    en: 'The `gh` triad for automated review: approve (with a `--body` CI-rule message), squash-merge and inspect runs — what you would otherwise do by hand, now in the run.' },

  // ─── Deploy & dicas do dia a dia ───────────────────────────────────────
  { code: 'uses: aws-actions/configure-aws-credentials@v4\nwith:\n  role-to-assume: arn:aws:iam::123456789012:role/gh-deploy\n  aws-region: us-east-1', cat: 'tips',
    pt: 'OIDC: o workflow troca o `GITHUB_TOKEN` por credenciais AWS TEMPORÁRIAS assumindo um role — exige `permissions: id-token: write` no job E o role confiando no issuer do GitHub. Fim do segredo estático de nuvem.',
    en: 'OIDC: the workflow trades the `GITHUB_TOKEN` for TEMPORARY AWS credentials by assuming a role — needs `permissions: id-token: write` and the role trusting GitHub\'s issuer. End of static cloud keys.' },
  { code: 'on: pull_request_target', cat: 'tips',
    pt: 'A exceção PERIGOSA: roda com o contexto da BASE (secrets disponíveis) mas com o CÓDIGO DO PR — um PR malicioso pode injetar step. Sozinho nunca; com `checkout` ancorado em ref fixo e no máx. o piso de `permissions:`.',
    en: 'The DANGEROUS exception: runs in the BASE context (secrets available) but executes THE PR\'S CODE — a malicious PR can inject steps. Never alone; only with a ref-pinned checkout and minimal `permissions:`.' },
  { code: 'jobs:\n  e2e_aws:\n    runs-on: ubuntu-latest\n    permissions:\n      id-token: write\n      contents: read', cat: 'tips',
    pt: 'Declare `permissions:` por job: o `id-token: write` necessário pro OIDC, e nada além. O princípio de least-privilege vale no YAML tanto quanto no IAM.',
    en: 'Declare `permissions:` per job: `id-token: write` for OIDC, nothing more. Least-privilege applies in YAML as much as in IAM.' },
  { code: "on:\n  schedule:\n    - cron: '0 3 * * *'", cat: 'tips',
    pt: 'Agendados rodam SÓ na default branch. E o disparo é aproximado: a fila escolhe um momento por perto do cron, não os minutos exatos dele.',
    en: 'Scheduled runs only fire on the default branch. And the trigger is approximate: the queue picks a moment near the cron, not its exact minutes.' },
  { code: 'run: npx tsx scripts/fail-fast.ts || exit 1', cat: 'tips',
    pt: 'Exit != 0 derruba o step (e o job). Cuidado: por padrão o `run:` roda bash SEM `set -e` — a falha de um `grep`/pipe pode passar em silêncio; use `set -euo pipefail` no comando quando um silêncio não é aceitável.',
    en: 'Non-zero exit fails the step (and the job). Beware: by default `run:` runs bash WITHOUT `set -e` — a failed `grep`/pipe may pass silently; put `set -euo pipefail` in the command when silence is not acceptable.' },
  { code: 'actions/upload-artifact@v4\nwith:\n  if-no-files-found: error\n  name: logs', cat: 'tips',
    pt: 'Artefato vazio = pipeline sem diagnóstico: troque o padrão `warn` por `error` e o job quebra alarde quando não há o que subir.',
    en: 'Empty artifact = a pipeline with no diagnosis: switch the default `warn` to `error` so the job screams when there is nothing to upload.' },
  { code: '${{ github.event.comment.body }}', cat: 'tips',
    pt: 'Payload cru do evento em `github.event` — a porta de entrada pra comandos por comentário (ex.: "/deploy staging"): leia o corpo no `if:` e roteie.',
    en: 'Raw event payload in `github.event` — the gateway to command-by-comment (e.g. "/deploy staging"): read the body in `if:` and route.' },
  { code: 'name: Deploy\n\n# arquivo B com o MESMO name: — workflow_run\n# (que indexa por name:) pode encaixar no arquivo errado', cat: 'tips',
    pt: '`workflow_run` se refere ao `name:` do pipeline-alvo — se dois arquivos têm o mesmo name nem é sabido qual responde. Dê nomes únicos e evite horas de debug.',
    en: '`workflow_run` refers to the target pipeline\'s `name:` — two files with the same name make it unclear which one answers. Give unique names and save hours of debugging.' },
  { code: 'uses: actions/checkout@d172bef3e4d25b34dac0d8a2adc6d0e4e1e94c4a', cat: 'tips',
    pt: 'Fixação supply-chain segura: pinar a ação ao SHA completo do commit (com comentário `# v4.3.0`) em vez do tag. Runners em orgs grandes monitoram isso automaticamente.',
    en: 'Supply-chain-safe pinning: pin the action to the full commit SHA (with a `# v4.3.0` comment) instead of the tag. Tight security in big orgs automated-checks for exactly this.' },
  { code: 'ACTIONS_STEP_DEBUG=true\nACTIONS_RUNNER_DEBUG=true', cat: 'tips',
    pt: 'Debug habilitado: `ACTIONS_STEP_DEBUG=true` adiciona o trace de cada step e `ACTIONS_RUNNER_DEBUG=true` o do runner. Seta via `env:` do job ou como secret no repo (e o secret pode ser sedo diferente de repo pra repo).',
    en: 'Debug on: `ACTIONS_STEP_DEBUG=true` adds the step trace and `ACTIONS_RUNNER_DEBUG=true` the runner trace. Set them via job `env:` or repo secrets (a repo secret can differ per repo).' },
  { code: 'retention-days: 30\npath: dist/', cat: 'tips',
    pt: 'Artefato com tempo de vida curto em pipelines de deploy frequente — o upload de build e download de deploy não precisam sobreviver 90 dias. Pense em custo de storage no fim.',
    en: 'Short-lived artifacts in frequent-deploy pipelines — the build upload / deploy download does not need 90 days of shelf life. Storage cost adds up at scale.' },
]

const translations = {
  pt: {
    title: 'GitHub Actions (workflows)',
    intro: (
      <>
        <Text code>.github/workflows/*.yml</Text> — CI/CD dentro do próprio
        GitHub: dispara em push/PR/tag/cron, roda em runners hospedados ou
        próprios e empurra pra produção sem servidor de CI externo. A peça
        que faltava ao lado dos cheat sheets de <Text code>git</Text>,{' '}
        <Text code>docker</Text>, <Text code>kubectl</Text> e{' '}
        <Text code>systemd</Text>: a automação que roda as suas pipelines.
      </>
    ),
    search: 'Buscar por trecho YAML, expressão ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega em GitHub Actions',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>jobs rodam em paralelo.</Text>{' '}
          <Text code>needs:</Text> serializa, <Text code>matrix:</Text> explode
          em combinações — e o dado entre jobs só trafega por{' '}
          <Text code>outputs</Text>/<Text code>needs.&lt;job&gt;.outputs</Text>{' '}
          ou por artefato (upload/download).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Secrets não vão pra PR de fork.</Text> Em PR vindo de
          fork o workflow roda com <Text code>GITHUB_TOKEN</Text> read-only e
          SEM secrets. A exceção <Text code>pull_request_target</Text> roda no
          contexto da base com os secrets — e executa o CÓDIGO do PR: é a porta
          de entrada de ataque favorita, use com checkout ancorado e{' '}
          <Text code>permissions:</Text> mínimas.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>GITHUB_TOKEN é o segredo automático.</Text> Declare{' '}
          <Text code>permissions:</Text> com o mínimo; para subir release/PR
          escreva o escopo e o OIDC pede <Text code>id-token: write</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Entre steps: GITHUB_ENV/GITHUB_OUTPUT.</Text> O 'a'
          pro próximo step é o arquivo do <Text code>$GITHUB_OUTPUT</Text>, a
          variável global é <Text code>$GITHUB_ENV</Text>; nunca o que você
          setou num <Text code>run:</Text> anterior (cada run é um shell
          novo).
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Pine actions e debuge com o gh CLI.</Text>{' '}
          <Text code>@v4</Text> (major tag) é ok no dia a dia; fixação por
          SHA é a prática supply-chain. E o <Text code>gh run view --log</Text>{' '}
          / <Text code>gh api</Text> valem ouro no debugar de uma pipeline que
          só falha em PROD.
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
    title: 'GitHub Actions (workflows)',
    intro: (
      <>
        <Text code>.github/workflows/*.yml</Text> — CI/CD inside GitHub itself:
        fires on push/PR/tag/cron, runs on hosted or self-hosted runners and
        ships to production with no external CI server. The piece missing next
        to the <Text code>git</Text>, <Text code>docker</Text>,{' '}
        <Text code>kubectl</Text> and <Text code>systemd</Text> cheat sheets:
        the automation that runs your pipelines.
      </>
    ),
    search: 'Search by YAML snippet, expression or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: "What trips people up the most",
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Jobs run in parallel.</Text>{' '}
          <Text code>needs:</Text> serializes, <Text code>matrix:</Text> fans
          out into combos — and data flows between jobs only through{' '}
          <Text code>outputs</Text>/<Text code>needs.&lt;job&gt;.outputs</Text>{' '}
          or artifacts (upload/download).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Secrets never reach fork PRs.</Text> On fork PRs the
          workflow runs with a read-only <Text code>GITHUB_TOKEN</Text> and no
          secrets. The <Text code>pull_request_target</Text> exception runs in
          the base context with secrets — and executes the PR&apos;s CODE: the
          favorite attack entry, only with a pinned checkout and minimal{' '}
          <Text code>permissions:</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>The GITHUB_TOKEN is the automatic secret.</Text> Declare{' '}
          <Text code>permissions:</Text> with the least; writing releases/PRs
          raises a scope and OIDC needs <Text code>id-token: write</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Between steps: GITHUB_ENV/GITHUB_OUTPUT.</Text> The 'a'
          for the next step is the <Text code>$GITHUB_OUTPUT</Text> file, the
          global variable is <Text code>$GITHUB_ENV</Text> — never what you set
          in an earlier <Text code>run:</Text> (each run is a fresh shell).
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Pin actions and debug with the gh CLI.</Text>{' '}
          <Text code>@v4</Text> (major tag) is fine daily; SHA pinning is the
          supply-chain practice. And <Text code>gh run view --log</Text> /{' '}
          <Text code>gh api</Text> are gold when a pipeline only fails in PROD.
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

export default function GithubActionsCheatsheetPage() {
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
    const header = '# GitHub Actions (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```yaml',
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
        icon={<GithubOutlined />}
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