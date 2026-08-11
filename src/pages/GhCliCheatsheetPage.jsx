import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { GithubOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['auth', 'repos', 'pr', 'issues', 'releases', 'actions', 'api', 'codespaces']

const CATEGORY_COLOR = {
  auth: 'blue',
  repos: 'green',
  pr: 'geekblue',
  issues: 'purple',
  releases: 'magenta',
  actions: 'volcano',
  api: 'cyan',
  codespaces: 'orange',
}

const labelOf = {
  auth: { pt: 'Login & config', en: 'Auth & config' },
  repos: { pt: 'Repositórios', en: 'Repositories' },
  pr: { pt: 'Pull Requests', en: 'Pull Requests' },
  issues: { pt: 'Issues', en: 'Issues' },
  releases: { pt: 'Releases & tags', en: 'Releases & tags' },
  actions: { pt: 'Actions / CI', en: 'Actions / CI' },
  api: { pt: 'gh api & automação', en: 'gh api & automation' },
  codespaces: { pt: 'Codespaces & mais', en: 'Codespaces & more' },
}

const ITEMS = [
  // ─── Login & config ────────────────────────────────────────────────────
  { code: 'gh auth login', cat: 'auth',
    pt: 'Login interativo: aponta pro browser (ou cola um token). Autentica o gh com a sua conta GitHub e configura o transporte do git (HTTPS ou SSH).',
    en: 'Interactive login: opens the browser (or paste a token). Authenticates gh with your GitHub account and sets up git transport (HTTPS or SSH).' },
  { code: 'gh auth status', cat: 'auth',
    pt: 'Mostra a conta ativa, se o token é válido e qual host/transporte o gh está usando. Primeiro comando quando a API começa a responder 401.',
    en: 'Shows the active account, whether the token is valid and which host/transport gh is using. The first command when the API starts returning 401.' },
  { code: 'gh auth switch', cat: 'auth',
    pt: 'Troca a conta ativa entre as que já estão autenticadas (conta pessoal vs organizacional/CI). Não refaz login, só alterna o perfil.',
    en: 'Switches the active account among the already-authenticated ones (personal vs org/CI account). No re-login, just swaps the profile.' },
  { code: 'gh auth token', cat: 'auth',
    pt: 'Imprime o token atual. É uma credencial viva — trata como senha: não cole em log, screenshot nem em file compartilhado.',
    en: 'Prints the current token. It is a live credential — treat it like a password: do not paste into logs, screenshots or shared files.' },
  { code: 'gh auth login --with-token < token.txt', cat: 'auth',
    pt: 'Login em CI/headless: lê o token (ou o JSON com host/scopes) da stdin, sem interação. A alternativa é a env var GH_TOKEN, que o gh também lê sozinho.',
    en: 'CI/headless login: reads the token (or JSON with host/scopes) from stdin, no interaction. The alternative is the GH_TOKEN env var, which gh picks up on its own.' },
  { code: 'gh config set git_protocol ssh', cat: 'auth',
    pt: 'Configura o transporte que o gh usa pro git (https/ssh). GH_TOKEN/TLS e SSH coexistem: o git_protocol decide o clone/push wrapper do gh.',
    en: 'Sets the transport gh uses for git (https/ssh). Auth and TLS and SSH coexist: git_protocol decides gh clone/push wrapper.' },
  { code: 'gh alias set pc "pr create --fill"', cat: 'auth',
    pt: 'Cria um atalho de comando: vira "gh pc". Dá pra encadear com `!cmd` pra rodar qualquer shell. Guardado em ~/.config/gh/aliases.yml.',
    en: 'Creates a command shortcut: becomes "gh pc". Can pipe through `!cmd` to run any shell. Stored in ~/.config/gh/aliases.yml.' },
  { code: 'gh completion', cat: 'auth',
    pt: 'Gera o script de autocomplete/autocompleção pro seu shell (--shell bash/zsh/fish). A dica que empacota em produção é adicionar ao ~/.bashrc.',
    en: 'Generates the shell completion script (--shell bash/zsh/fish). The trick is hooking the output into your ~/.bashrc once.' },
  { code: 'gh version', cat: 'auth',
    pt: 'Versão instalada. Estrutura do gh: cada comando é independente (gh auth/*, gh pr/*, gh api...) — o help de cada um é o manual mais rápido (gh <sujeito> --help).',
    en: 'Installed version. gh is a collection of independent subcommands (gh auth/*, gh pr/*, gh api...) — each --help is the fastest manual (gh <subject> --help).' },

  // ─── Repositórios ──────────────────────────────────────────────────────
  { code: 'gh repo create my-app --public --clone', cat: 'repos',
    pt: 'Cria um repositório novo a partir da pasta atual (ou --source/--remote em repo existente) e já clona. Flags: --private, --add-readme, --license.',
    en: 'Creates a new repository from the current folder (or --source/--remote on an existing repo) and clones right away. Flags: --private, --add-readme, --license.' },
  { code: 'gh repo clone owner/name', cat: 'repos',
    pt: 'Clona usando o transporte autenticado do gh — também funciona pra forks e pra HTTPS sem digitar senha (usa o token do auth).',
    en: 'Clones using gh authenticated transport — also works for forks and HTTPS without typing a password (uses the auth token).' },
  { code: 'gh repo view owner/name --web', cat: 'repos',
    pt: 'Abre o repositório no browser no owner/name ou no do diretório atual. Sem --web, mostra um resumo em formato de texto no terminal.',
    en: 'Opens the repository in the browser for owner/name or the current directory one. Without --web, prints a text summary to the terminal.' },
  { code: 'gh repo list --limit 50 --json name,stargazerCount', cat: 'repos',
    pt: 'Lista repositórios do dono com campos em JSON — o ponto de partida pra alimentar jq ou um script (--limit default é 30).',
    en: 'Lists the owner repositories with JSON fields — the starting point to feed jq or a script (--limit defaults to 30).' },
  { code: 'gh repo fork owner/name --clone --remote', cat: 'repos',
    pt: 'Forka e clona; --remote adiciona o upstream como remote original já configurado. A forma rápida de ter o fork local com os dois remotes.',
    en: 'Forks and clones; --remote adds the upstream as ready remote. The fast way to have the fork locally with both remotes.' },
  { code: 'gh repo sync', cat: 'repos',
    pt: 'Sincroniza o fork com o upstream (default: branch atual). Pra manter um fork atualizado sem cherry-pick manual; --branch pra sincronizar outra.',
    en: 'Syncs the fork with upstream (default: current branch). To keep a fork up to date without manual cherry-picks; --branch to sync another.' },
  { code: 'gh repo set-default', cat: 'repos',
    pt: 'Define o repositório default dos comandos na pasta atual (salva em .git/config). Pro `gh` sempre saber onde atuar sem -R em todo comando.',
    en: 'Sets the default repository of commands in the current folder (stored in .git/config). So gh always knows where to act without -R on every command.' },
  { code: 'gh repo edit --description "..." --add-topic demo', cat: 'repos',
    pt: 'Edita os metadados do repo — descrição, homepage, topics, visibilidade e defaults de branch — sem sair do terminal.',
    en: 'Edits repo metadata — description, homepage, topics, visibility and branch defaults — without leaving the terminal.' },
  { code: 'gh repo rename new-name', cat: 'repos',
    pt: 'Renomeia o repositório pelo próprio GitHub (redireciona o antigo). O diretório local local está em oldname; o upstream do remote já aponta pro novo.',
    en: 'Renames the repository on GitHub itself (the old one is redirected). The local folder is still oldname; remote upstream already points to the new one.' },
  { code: 'gh repo delete owner/name --yes', cat: 'repos',
    pt: 'Apaga o repositório. Irreversível (GitHub não restaura) — os scopes de admin são bem graduados, então veja o que está apagando antes do --yes.',
    en: 'Deletes the repository. Irreversible (GitHub does not restore) — admin scopes are fine-grained, so check what you are deleting before --yes.' },
  { code: 'gh search repos "language:TypeScript archived:false"', cat: 'repos',
    pt: 'Busca de repositórios com os qualificadores de busca do GitHub (language:, stars:, created:, topic:...). gh search issues/commits também existem.',
    en: 'Repository search with GitHub qualifiers (language:, stars:, created:, topic:...). gh search issues/commits also exist.' },

  // ─── Pull Requests ─────────────────────────────────────────────────────
  { code: 'gh pr create --title "fix: timeout" --body "..."', cat: 'pr',
    pt: 'Cria o PR da branch atual. --draft abre como draft, --from-branch escolhe a branch de origem. O gh deriva base/head do seu git local.',
    en: 'Creates a PR from the current branch. --draft opens it as draft, --from-branch picks the source. gh derives base/head from your local git.' },
  { code: 'gh pr create --fill', cat: 'pr',
    pt: 'Preenche o título e o body a partir das mensagens dos commits. O atalho quando a branch já conta a história sozinha.',
    en: 'Fills title and body from the commit messages. The shortcut when the branch already tells the story by itself.' },
  { code: 'gh pr create --web', cat: 'pr',
    pt: 'Abre a página de "New pull request" do GitHub com a base/head da branch já preenchida — metade machine, metade human (pra descrever com calma).',
    en: 'Opens the "New pull request" page on GitHub with base/head already filled — half machine, half human (to describe at ease).' },
  { code: 'gh pr checkout 123', cat: 'pr',
    pt: 'Baixa e faz checkout da branch do PR na sua máquina. O gh configura o fetch de PRs do remote automaticamente (refs/pull/*) na primeira vez.',
    en: 'Fetches and checks out the PR branch locally. gh sets up the remote PR fetch refs (refs/pull/*) automatically the first time.' },
  { code: 'gh pr view 123', cat: 'pr',
    pt: 'Resumo do PR: título, branch, status de merge e checks. --comments lista os comentários; --json traz qualquer campo pra pipe com jq.',
    en: 'PR summary: title, branch, merge status and checks. --comments lists the comments; --json returns any field to pipe to jq.' },
  { code: 'gh pr list --search "review:required" --author @me -L 20', cat: 'pr',
    pt: 'Lista PRs com filtros — --search usa a mesma sintaxe de busca do GitHub, --author @me eu mesmo, -L limita linhas. --state open/closed/all.',
    en: 'Lists PRs with filters — --search uses the GitHub search syntax, --author @me for mine, -L limits lines. --state open/closed/all.' },
  { code: 'gh pr diff 123 --patch', cat: 'pr',
    pt: 'Mostra o diff completo do PR (como git diff); --patch emite o patch legível. Num pipeline: gh pr diff | git apply, ou | jq pra análise.',
    en: 'Shows the full PR diff (like git diff); --patch emits a readable patch. In a pipeline: gh pr diff | git apply, or | jq for analysis.' },
  { code: 'gh pr review 123 --approve', cat: 'pr',
    pt: 'Aprova o PR direto do CLI. --request-changes pede mudanças (com --body explicando), --comment só comenta sem dar veredito.',
    en: 'Approves the PR straight from the CLI. --request-changes asks for changes (with --body explaining), --comment just leaves a note without a verdict.' },
  { code: 'gh pr merge 123 --squash --delete-branch', cat: 'pr',
    pt: 'Faz o merge do PR (--squash/--rebase/--merge controlam a estratégia) e --delete-branch limpa a branch remota (e o checkout local some).',
    en: 'Merges the PR (--squash/--rebase/--merge choose the strategy) and --delete-branch cleans up the remote branch (and the local checkout is dropped).' },
  { code: 'gh pr merge 123 --auto', cat: 'pr',
    pt: 'Auto-merge: o PR entra na fila e o merge acontece sozinho quando os checks passam. O "merge merges itself" pra não ficar de babá de CI.',
    en: 'Auto-merge: the PR joins the queue and merges itself when checks pass. The "merge merges itself" so you are not babysitting CI.' },
  { code: 'gh pr checks 123 --watch', cat: 'pr',
    pt: 'Lista os checks do PR (status/name) e --watch fica seguindo até concluírem. O substituto de F5 no GitHub até os checks passarem.',
    en: 'Lists the PR checks (status/name) and --watch keeps polling until they finish. The Ctrl+R replacement while waiting for checks.' },
  { code: 'gh pr comment 123 --body "..."', cat: 'pr',
    pt: 'Comenta no PR. --edit-last sobreescreve o seu último comentário (o padrão quando você corrige uma revisão comentada).',
    en: 'Comments on the PR. --edit-last overwrites your last comment (the pattern when you address a review comment).' },
  { code: 'gh pr ready 123\ngh pr reopen 123', cat: 'pr',
    pt: 'gh pr ready tira o draft ("marca como pronto"); gh pr reopen reabre um PR fechado. O par que muda o estado sem N clicks no browser.',
    en: 'gh pr ready marks the draft as ready; gh pr reopen reopens a closed PR. The pair that flips the state without N clicks in the browser.' },
  { code: 'gh pr edit 123 --add-reviewer octocat --remove-label blocked', cat: 'pr',
    pt: 'Edita o PR: --add/--remove-reviewer (usuario ou owner/team), --title, --base, --add/--remove-label, --milestone.',
    en: 'Edits the PR: --add/--remove-reviewer (user or owner/team), --title, --base, --add/--remove-label, --milestone.' },

  // ─── Issues ────────────────────────────────────────────────────────────
  { code: 'gh issue create --title "Bug: crash" --body "..."', cat: 'issues',
    pt: 'Cria uma issue com título e corpo. --label/--assignee/--milestone já preenchem de cara; --web abre o form do browser.',
    en: 'Creates an issue with title and body. --label/--assignee/--milestone fill in on the spot; --web opens the browser form.' },
  { code: 'gh issue list --label "bug" --assignee @me', cat: 'issues',
    pt: 'Lista issues filtrando — --label repete pra múltiplas, --assignee @me é "as minhas", --search usa a sintaxe de busca do GitHub.',
    en: 'Lists issues filtering — --label repeats for multiple, --assignee @me is "mine", --search uses GitHub search syntax.' },
  { code: 'gh issue view 42 --comments', cat: 'issues',
    pt: 'Mostra a issue 42 (título, estado, labels e milestone) e --comments traz a conversa. --json pra extrair campo a campo com jq.',
    en: 'Shows issue 42 (title, state, labels and milestone) and --comments brings the conversation. --json to extract field by field with jq.' },
  { code: 'gh issue close 42 --reason "completed"', cat: 'issues',
    pt: 'Fecha a issue com o reason (completed | not planned | reopened). O reason alimenta os dashboards de insights do GitHub.',
    en: 'Closes the issue with the reason (completed | not planned | reopened). The reason feeds GitHub insights dashboards.' },
  { code: 'gh issue comment 42 --body "AED corrigido"', cat: 'issues',
    pt: 'Comenta na issue. Em automação, vai bem com --edit-last pra atualizar o mesmo comentário a cada rodada (status locker).',
    en: 'Comments on the issue. In automation it pairs well with --edit-last to update the same comment every run (status locker).' },
  { code: 'gh issue edit 42 --add-label "wontfix" --remove-label "bug"', cat: 'issues',
    pt: 'Edita a issue: --add/--remove-label, --title, --body, --milestone, --add-assignee. Tudo no terminal, sem abrir a página.',
    en: 'Edits the issue: --add/--remove-label, --title, --body, --milestone, --add-assignee. All in the terminal, without opening the page.' },
  { code: 'gh issue transfer 42 owner/outro-repo', cat: 'issues',
    pt: 'Move a issue pra outro repositório (e mantém os comentários). Quando ela foi aberta no repo errado por engano.',
    en: 'Moves the issue to another repository (comment history preserved). For when it was opened in the wrong repo by mistake.' },
  { code: 'gh issue develop 42 -c', cat: 'issues',
    pt: 'Cria (e dá checkout) de uma branch de trabalho vinculada à issue; -c faz checkout da branch nova, -n só cria junto ao upstream.',
    en: 'Creates (and checks out) a work branch linked to the issue; -c checks out the new branch, -n only creates it with the upstream.' },
  { code: 'gh issue delete 42', cat: 'issues',
    pt: 'Apaga a issue de verdade. Não confundir com close — delete remove do histórico, não dá pra desfazer.',
    en: 'Permanently deletes the issue. Not to be confused with close — delete removes it from history and cannot be undone.' },

  // ─── Releases & tags ───────────────────────────────────────────────────
  { code: 'gh release create v1.0.0 --generate-notes', cat: 'releases',
    pt: 'Cria a release a partir da tag (vai pra tag se não existir), gerando as notas automaticamente a partir dos PRs (--generate-notes).',
    en: 'Creates the release from the tag (creates the tag if missing), generating the notes from PRs automatically (--generate-notes).' },
  { code: 'gh release create v1.0.0 dist/*.tar.gz dist/*.zip --title "v1.0.0"', cat: 'releases',
    pt: 'Cria a release subindo os assets (glob dos arquivos). É assim que binários/artefatos de build vão pro "Downloads" da release.',
    en: 'Creates the release uploading the assets (file glob). That is how build binaries/artifacts go to the release "Downloads".' },
  { code: 'gh release list --limit 10', cat: 'releases',
    pt: 'Lista as releases do repo atual (--exclude-drafts/--exclude-pre-releases pra filtrar). --json mais jq pra extrair a tabela.',
    en: 'Lists the releases of the current repo (--exclude-drafts/--exclude-pre-releases to filter). --json plus jq to extract the table.' },
  { code: 'gh release view v1.0.0 --json assets,tagName', cat: 'releases',
    pt: 'Detalha uma release; o par --json + --jq extrai só o que o script precisa (urls de assets, tagName, publishedAt...).',
    en: 'Details a release; the --json + --jq pair extracts only what the script needs (asset urls, tagName, publishedAt...).' },
  { code: 'gh release download v1.0.0 --pattern "*.zip" --dir ./dist', cat: 'releases',
    pt: 'Baixa os assets da release na pasta --dir, filtrando por --pattern. O download de artefato sem abrir o browser.',
    en: 'Downloads release assets into --dir, filtered by --pattern. Downloading artifacts without opening the browser.' },
  { code: 'gh release delete v1.0.0 --cleanup-tag --yes', cat: 'releases',
    pt: 'Apaga a release; --cleanup-tag remove também a tag correspondente. Cuidado onde a tag já foi usada como ancoragem em pipelines.',
    en: 'Deletes the release; --cleanup-tag also removes the matching tag. Careful when the tag is already used as an anchor in pipelines.' },

  // ─── Actions / CI ──────────────────────────────────────────────────────
  { code: 'gh run list --status failure --limit 20', cat: 'actions',
    pt: 'Lista as execuções recentes; --status failure/queued/in_progress e --branch filtram. O "último deploy quebrou?" respondido em uma linha.',
    en: 'Lists recent runs; --status failure/queued/in_progress and --branch filter. "Did the last deploy break?" answered in one line.' },
  { code: 'gh run view --log-failed', cat: 'actions',
    pt: 'Mostra só os logs dos steps que falharam na última execução. Sem isso é caçada peneirando o log inteiro de 2h de módulo.',
    en: 'Shows only the logs of the failed steps in the last run. Without it you end up hunting through a 2h build log.' },
  { code: 'gh run watch', cat: 'actions',
    pt: 'Segue a execução em tempo real até o fim (spinner + conclusão no terminal). O "deploy subiu?" sem F5 no browser.',
    en: 'Follows the run live until it finishes (spinner + conclusion in the terminal). "Did the deploy go up?" without F5 in the browser.' },
  { code: 'gh run rerun --failed', cat: 'actions',
    pt: 'Reexecuta só os jobs que falharam (--failed) ou a run inteira sem flags. Primeira ação quando o erro é de CI flaky.',
    en: 'Re-runs only the failed jobs (--failed) or the whole run with no flags. The first action when the failure is flaky CI.' },
  { code: 'gh run download --name build-artifacts -D ./art', cat: 'actions',
    pt: 'Baixa os artefatos da última execução (--name filtra por artefato, -D pasta destino). Pra pegar o binário que o CI gerou.',
    en: 'Downloads the artifacts of the latest run (--name filters by artifact, -D destination folder). To grab the binary CI produced.' },
  { code: 'gh workflow list --all', cat: 'actions',
    pt: 'Lista os workflows do repo com estado (ativo/desativado). O inventário de "quais pipelines existem aqui" de uma olhada.',
    en: 'Lists the repo workflows with state (active/disabled). The "what pipelines live here" inventory at a glance.' },
  { code: 'gh workflow run build.yml -f env=prod', cat: 'actions',
    pt: 'Dispara um workflow com workflow_dispatch, passando os inputs do formulário com -f. Requer que o event exista no YAML.',
    en: 'Triggers a workflow_dispatch workflow, passing the form inputs with -f. Requires the event to exist in the YAML.' },
  { code: 'gh workflow disable build.yml\ngh workflow enable build.yml', cat: 'actions',
    pt: 'Desativa/ativa um workflow sem editar o YAML. O "pausa o pipeline" rápido durante um incidente.',
    en: 'Disables/enables a workflow without editing the YAML. The quick "pause the pipeline" during an incident.' },
  { code: 'gh run cancel\ngh run delete 123 --confirm', cat: 'actions',
    pt: 'gh run cancel para a última execução em andamento; gh run delete remove os logs antigos (log do GitHub expira e tem limite de armazenamento).',
    en: 'gh run cancel stops the latest in-flight run; gh run delete removes old logs (GitHub logs expire and have a storage cap).' },
  { code: "gh run list --json displayTitle,status --jq '.[] | \"\\(.displayTitle) -> \\(.status)\"'", cat: 'actions',
    pt: 'O par que resume as runs em texto plano. gh sempre oferece --json + --jq nas listagens — saída custom em uma linha, pronta pra grep.',
    en: 'The pair that summarizes runs as plain text. gh always offers --json + --jq on listings — custom one-line output, ready for grep.' },

  // ─── gh api & automação ────────────────────────────────────────────────
  { code: 'gh api repos/{owner}/{repo} --jq .stargazers_count', cat: 'api',
    pt: 'Chama a REST API do GitHub autenticada com o seu token, sem precisar de curl+token. {owner}/{repo} vira o que você escrever; --jq abrevia a resposta.',
    en: 'Calls the GitHub REST API authenticated with your token, no curl+token dance. {owner}/{repo} becomes what you write; --jq trims the response.' },
  { code: "gh api user --jq .login", cat: 'api',
    pt: 'O "quem sou eu" pela API (o mesmo do gh auth status, mas direto). Bom pra conferir em que conta o token resolveu.',
    en: 'The "who am I" via the API (same info as gh auth status, but direct). Good to confirm which account the token resolved to.' },
  { code: 'gh api user/repos?per_page=100 --paginate --jq ".[].name"', cat: 'api',
    pt: '--paginate percorre TODAS as páginas sozinho (o GitHub limita em 100 por página). O jeito de não perder itens em listas grandes.',
    en: '--paginate walks ALL pages by itself (GitHub caps 100 per page). The way to not lose items on large listings.' },
  { code: 'gh api -X PATCH repos/owner/repo -f description="novo resumo"', cat: 'api',
    pt: 'Método explícito (-X PATCH) com dados de formulário (-f chave=valor). O equivalente REST de um repo edit que a API só deixa via PATCH.',
    en: 'Explicit method (-X PATCH) with form data (-f key=value). The REST equivalent of a repo edit that the API only allows via PATCH.' },
  { code: 'gh api -X POST repos/owner/repo/labels -f name=chore -f color=ffffff', cat: 'api',
    pt: 'Cria um recurso com POST e -f. Labels/milestones/collaborators são os casos clássicos de "gerenciar o repo por script".',
    en: 'Creates a resource with POST and -f. Labels/milestones/collaborators are the classic "manage the repo by script" cases.' },
  { code: 'gh api -X DELETE repos/owner/repo/releases/123', cat: 'api',
    pt: 'Remove recurso com DELETE. Pra APIs de escrita, o gh api é o curl com o token e os headers certos já montados.',
    en: 'Removes a resource with DELETE. For write APIs, gh api is curl with the token and right headers already wired up.' },
  { code: "gh api graphql -f query='{ viewer { login } }'", cat: 'api',
    pt: 'Chama o endpoint GraphQL (POST /graphql) passando a query. Pro que a REST não faz em uma chamada — relações e campos aninhados.',
    en: 'Calls the GraphQL endpoint (POST /graphql) passing the query. For what REST cannot do in one call — relations and nested fields.' },
  { code: 'gh api repos/owner/repo/pulls/1 --jq .mergeable', cat: 'api',
    pt: 'Mergeável ou não em JSON booleano. Pra CI decidir se pode fazer auto-merge, ou pro script bloquear quando o PR está com conflito.',
    en: 'Mergeable or not as a JSON boolean. For CI to decide whether it can auto-merge, or to block the script when the PR is conflicted.' },
  { code: 'gh secret set TOKEN < secret.txt', cat: 'api',
    pt: 'Sobe um secret do repo atual (stdin ou -b valor). --repo/--org/--env escolhem o escopo. Nome maiúsculo recomendado pelo GitHub.',
    en: 'Uploads a secret to the current repo (stdin or -b value). --repo/--org/--env pick the scope. Uppercase names recommended by GitHub.' },
  { code: 'gh secret list\ngh variable list', cat: 'api',
    pt: 'Lista secrets (mascarados, não mostra valores) e variables do repo/ambiente. Pra auditar "que chaves existem aqui" sem abrir Settings.',
    en: 'Lists secrets (masked, never shows values) and variables of the repo/environment. To audit "what keys live here" without opening Settings.' },
  { code: 'gh variable set MY_VAR=value --env production', cat: 'api',
    pt: 'Define uma variable (que NÃO é segredo) por repo ou por ambiente. -f/--env escolhem o nível; funciona como o response de um dotenv versionado.',
    en: 'Sets a variable (which is NOT a secret) per repo or per environment. -f/--env choose the level; acts like a versioned dotenv response.' },
  { code: 'gh gist create -p my-script.py', cat: 'api',
    pt: 'Cria um gist (privado com -p) do arquivo. Clone: gh gist clone <id>. O micro-pastebin que fica no seu GitHub.',
    en: 'Creates a gist (private with -p) from a file. Clone: gh gist clone <id>. The micro-pastebin that lives on your GitHub.' },
  { code: 'gh ssh-key add ~/.ssh/id_ed25519.pub --title "laptop"', cat: 'api',
    pt: 'Adiciona uma chave SSH pela API (github/settings/ssh-equivalente). Útil no setup de uma máquina nova onde o browser não está aberto.',
    en: 'Adds an SSH key via the API (the github.com/settings/ssh equivalent). Handy when provisioning a new machine with no browser open.' },
  { code: 'gh api -f field=value -F number=42 -F flag=true', cat: 'api',
    pt: '-f envia string e -F envia os tipos numéricos/booleanos/aninhados. Pro GitHub interpretar o valor como o tipo certo (sem aspas perdidas).',
    en: '-f sends strings and -F sends numeric/boolean/nested types. So GitHub parses the value as the right type (no lost quotes).' },

  // ─── Codespaces & mais ─────────────────────────────────────────────────
  { code: 'gh codespace create --repo owner/name --branch main', cat: 'codespaces',
    pt: 'Sobe um Codespace na nuvem do GitHub (repo + branch). 1 minuto depois você tem um devcontainer rodando sem setup local.',
    en: 'Spins up a GitHub-cloud Codespace (repo + branch). A minute later you have a devcontainer running with zero local setup.' },
  { code: 'gh codespace list', cat: 'codespaces',
    pt: 'Lista os codespaces ativos do seu usuário com nome, repo, branch e estado. O primeiro passo antes de reaproveitar/derrubar um.',
    en: 'Lists your active codespaces with name, repo, branch and state. The first step before reusing/tearing one down.' },
  { code: 'gh codespace code -c my-codespace', cat: 'codespaces',
    pt: 'Abre o codespace no VSCode local conectado no remote da nuvem (-c ou seleciona na lista). O "SSH port forwarding" do GitHub com UI.',
    en: 'Opens the codespace in local VSCode attached to the cloud remote (-c or pick from the list). GitHub "SSH port-forwarding" with a UI.' },
  { code: 'gh codespace ssh', cat: 'codespaces',
    pt: 'Enter direto no shell do codespace via SSH. Pra roda um comando de uma vez: gh codespace ssh --command "make test".',
    en: 'Goes straight into the codespace shell over SSH. To run one-shot: gh codespace ssh --command "make test".' },
  { code: 'gh codespace stop -c my-codespace\ngh codespace delete -c my-codespace --force', cat: 'codespaces',
    pt: 'gh stops pausa (mantém state); gh delete derruba (libera cota). Codespace parado ainda custa storage — delete quando não for usar.',
    en: 'gh stops pauses (keeps state); gh delete tears down (frees quota). A stopped codespace still costs storage — delete when done.' },
  { code: 'gh browse 42', cat: 'codespaces',
    pt: 'Abre o PR/issue 42 do repo no browser (sem número, abre o repo). O navigation helper do terminal→web de um passo.',
    en: 'Opens PR/issue 42 of the repo in the browser (no number, opens the repo). The one-step terminal→web navigation helper.' },
  { code: 'gh label list\ngh label create bug --description "algo quebrado" --color B60205', cat: 'codespaces',
    pt: 'Lista/cria labels do repo e associa em issues/PRs. O conjunto de labeis é o vocabulário do rastreamento — gerencie por script, não por clique.',
    en: 'Lists/creates repo labels and attaches them to issues/PRs. The label set is the tracking vocabulary — manage it by script, not by click.' },
  { code: 'gh auth setup-git', cat: 'codespaces',
    pt: 'Configura o git pra usar as credenciais do gh (credential helper) em runners/containers onde o git ainda não conhece o token.',
    en: 'Configures git to use gh credentials (credential helper) on runners/containers where git does not know the token yet.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet do GitHub CLI (gh)',
    intro: (
      <>
        Os comandos do <Text code>gh</Text>, a CLI oficial do GitHub — o{' '}
        <Text code>git</Text> cuida do repositório local, o <Text code>gh</Text>{' '}
        cuida do GitHub (PRs, issues, releases, Actions e a API por cima
        dele). O irmão que faltava ao lado do <Text code>git-commands</Text>{' '}
        (git puro, sem GitHub) e do{' '}
        <Text code>github-actions-cheatsheet</Text> (o pipeline, não o CLI).
      </>
    ),
    search: 'Buscar por comando ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no gh',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>gh ≠ git.</Text> O <Text code>git</Text> trabalha no
          repositório local; o <Text code>gh</Text> fala com o GitHub através
          do token e enrola o git por baixo quando precisa (clone, push,
          checkout). Pense: <Text code>git</Text> versiona,{' '}
          <Text code>gh</Text> gerencia.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Autenticação é o setup que esquece.</Text>{' '}
          <Text code>gh auth login</Text> uma vez e o resto funciona — mas em
          CI/runner é a env <Text code>GH_TOKEN</Text> (ou o{' '}
          <Text code>gh auth login --with-token</Text>), e aí o token é a
          credencial do pipeline: scopes mínimos e nunca em texto em logs.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Token é segredo.</Text> O <Text code>gh auth token</Text>{' '}
          imprime uma credencial viva do GitHub. Não cole em chats, screenshots
          ou arquivos compartilhados — compromete a conta inteira.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Repo "default".</Text> Os comandos agem no repositório do
          diretório atual (detectado dos remotes). No de outro, use{' '}
          <Text code>-R owner/repo</Text> em qualquer subcomando — ou{' '}
          <Text code>gh repo set-default</Text> pra fixar o da pasta.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>gh api é o curl do GitHub.</Text> Com o seu token e os
          headers montados, vira shell script de automação — e o par{' '}
          <Text code>--json + --jq</Text> das listagens transforma qualquer
          resposta em texto plano. Complementa o{' '}
          <Text code>jq-cheatsheet</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Cuidados de escrita.</Text>{' '}
          <Text code>gh repo delete</Text>, <Text code>gh issue delete</Text> e{' '}
          <Text code>gh release delete</Text> são permanentes — o confirm é
          explícito de propósito. Sempre rode <Text code>--help</Text> antes de
          apagar algo (todo subcomando tem o dele; é livre e é o mais preciso).
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
    title: 'GitHub CLI (gh) Cheat Sheet',
    intro: (
      <>
        The commands of <Text code>gh</Text>, the official GitHub CLI —{' '}
        <Text code>git</Text> handles your local repository, <Text code>gh</Text>{' '}
        handles GitHub (PRs, issues, releases, Actions and the API on top of
        it). The missing sibling next to <Text code>git-commands</Text> (pure
        git, no GitHub) and <Text code>github-actions-cheatsheet</Text> (the
        pipeline, not the CLI).
      </>
    ),
    search: 'Search by command or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>gh ≠ git.</Text> <Text code>git</Text> works on the local
          repository; <Text code>gh</Text> talks to GitHub over the token and
          wraps git underneath when needed (clone, push, checkout). Think:{' '}
          <Text code>git</Text> versions, <Text code>gh</Text> manages.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Auth is the setup everyone skips.</Text>{' '}
          <Text code>gh auth login</Text> once and the rest just works — but on
          CI/runners it is the <Text code>GH_TOKEN</Text> env var (or{' '}
          <Text code>gh auth login --with-token</Text>), and there the token is
          the pipeline credential: least privilege and never printed to logs.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>A token is a secret.</Text> <Text code>gh auth token</Text>{' '}
          prints a live GitHub credential. Do not paste it into chats,
          screenshots or shared files — it compromises the whole account.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>The "default" repo.</Text> Commands act on the repository
          of the current directory (detected from remotes). For another one add{' '}
          <Text code>-R owner/repo</Text> to any subcommand — or{' '}
          <Text code>gh repo set-default</Text> to pin it for the folder.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>gh api is the GitHub curl.</Text> With your token and
          headers pre-assembled it turns into shell automation — and the{' '}
          <Text code>--json + --jq</Text> pair on listings turns any response
          into plain text. Complements the <Text code>jq-cheatsheet</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Write operations are permanent.</Text>{' '}
          <Text code>gh repo delete</Text>, <Text code>gh issue delete</Text>{' '}
          and <Text code>gh release delete</Text> are irreversible — the confirm
          is explicit on purpose. Always run <Text code>--help</Text> before
          deleting anything (every subcommand has one; it is free and it is the
          most accurate).
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

export default function GhCliCheatsheetPage() {
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
    const header = '# gh (github cli — cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```text',
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
      <Title level={2}><GithubOutlined /> {t.title}</Title>
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