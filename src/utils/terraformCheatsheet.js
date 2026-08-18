// Dados bilíngues (PT/EN) do Cheat Sheet de Terraform. Cada item é um comando
// de terminal ou um snippet HCL; `cat` mapeia para a categoria de exibição.
// Strings regulares (sem template literal) para preservar "${..." literal.

export const CATEGORIES = [
  'workflow',
  'plan',
  'apply',
  'destroy',
  'state',
  'import',
  'workspace',
  'variables',
  'outputs',
  'providers',
  'modules',
  'meta',
  'functions',
  'cli',
]

export const CATEGORY_LABEL = {
  workflow: { pt: 'Inicialização', en: 'Initialization' },
  plan: { pt: 'Plan', en: 'Plan' },
  apply: { pt: 'Apply', en: 'Apply' },
  destroy: { pt: 'Destroy', en: 'Destroy' },
  state: { pt: 'Gerenciar Estado', en: 'State management' },
  import: { pt: 'Import', en: 'Import' },
  workspace: { pt: 'Workspaces', en: 'Workspaces' },
  variables: { pt: 'Variáveis', en: 'Variables' },
  outputs: { pt: 'Outputs', en: 'Outputs' },
  providers: { pt: 'Providers & Backend', en: 'Providers & Backend' },
  modules: { pt: 'Módulos', en: 'Modules' },
  meta: { pt: 'Meta-argumentos HCL', en: 'HCL meta-arguments' },
  functions: { pt: 'Funções', en: 'Functions' },
  cli: { pt: 'Flags & Dicas de CLI', en: 'CLI flags & tips' },
}

export const CATEGORY_COLOR = {
  workflow: 'blue',
  plan: 'geekblue',
  apply: 'green',
  destroy: 'red',
  state: 'purple',
  import: 'magenta',
  workspace: 'cyan',
  variables: 'gold',
  outputs: 'volcano',
  providers: 'orange',
  modules: 'lime',
  meta: 'pink',
  functions: 'geekblue',
  cli: 'grey',
}

export const ITEMS = [
  // ─── workflow ─────────────────────────────────────────────────────────────
  { cmd: 'terraform init', cat: 'workflow', pt: 'Inicializa o diretório: baixa providers, inicializa o backend e prepara os módulos. Rode sempre que o config mudar de provider/backend.', en: 'Initializes the working directory: downloads providers, sets up backend state and prepares modules. Run whenever providers or backend change.' },
  { cmd: 'terraform init -upgrade', cat: 'workflow', pt: 'Atualiza todos os providers/módulos para a versão mais recente permitida pelas constraints.', en: 'Upgrades all providers/modules to the newest allowed version given the constraints.' },
  { cmd: 'terraform init -reconfigure', cat: 'workflow', pt: 'Ignora a configuração de backend em cache e reconfigura do zero (troca de backend).', en: 'Ignores cached backend config and reconfigures from scratch (when switching backends).' },
  { cmd: 'terraform init -lockfile=readonly', cat: 'workflow', pt: 'Não altera o .terraform.lock.hcl (útil em CI reprodutível).', en: 'Does not update .terraform.lock.hcl (useful for reproducible CI).' },

  // ─── plan ─────────────────────────────────────────────────────────────────
  { cmd: 'terraform plan', cat: 'plan', pt: 'Mostra o que seria criado/alterado/destruído, sem aplicar nada.', en: 'Shows what would be created/changed/destroyed without applying anything.' },
  { cmd: 'terraform plan -out=tfplan', cat: 'plan', pt: 'Salva o plano num arquivo binário para aplicar depois de forma idêntica.', en: 'Writes the plan to a binary file to apply it later identically.' },
  { cmd: 'terraform plan -refresh=false', cat: 'plan', pt: 'Não relê o estado atual dos recursos remotos (mais rápido, menos preciso).', en: 'Skips refreshing remote resource state (faster, less accurate).' },
  { cmd: 'terraform plan -target=aws_instance.web', cat: 'plan', pt: 'Limita o plano a um endereço de recurso e suas dependências.', en: 'Restricts the plan to one resource address and its dependencies.' },
  { cmd: 'terraform plan -var "region=us-east-1"', cat: 'plan', pt: 'Passa uma variável por linha de comando (também vale pra apply).', en: 'Passes a variable on the command line (also valid for apply).' },

  // ─── apply ────────────────────────────────────────────────────────────────
  { cmd: 'terraform apply', cat: 'apply', pt: 'Aplica o plano atual pedindo confirmação antes de mudar qualquer coisa.', en: 'Applies the current plan, prompting for confirmation before making changes.' },
  { cmd: 'terraform apply tfplan', cat: 'apply', pt: 'Aplica um plano salvo com -out, garantindo que nada mudou desde o plan.', en: 'Applies a plan saved with -out, guaranteeing nothing changed since planning.' },
  { cmd: 'terraform apply -auto-approve', cat: 'apply', pt: 'Aplica sem pedir confirmação (CI, demos).', en: 'Applies without prompting for confirmation (CI, demos).' },
  { cmd: 'terraform apply -replace=aws_instance.web', cat: 'apply', pt: 'Força a destruição e recriação de um recurso específico (substituiu o terraform taint).', en: 'Forces a specific resource to be destroyed and recreated (replaced terraform taint).' },
  { cmd: 'terraform apply -parallelism=10', cat: 'apply', pt: 'Controla quantos recursos são operados em paralelo (default 10).', en: 'Controls how many resources are operated on in parallel (default 10).' },

  // ─── destroy ──────────────────────────────────────────────────────────────
  { cmd: 'terraform destroy', cat: 'destroy', pt: 'Destrói todos os recursos gerenciados pelo estado, pedindo confirmação.', en: 'Destroys every resource tracked in state, prompting for confirmation.' },
  { cmd: 'terraform destroy -target=aws_instance.web', cat: 'destroy', pt: 'Destrói apenas um recurso específico e suas dependências.', en: 'Destroys only a specific resource and its dependencies.' },
  { cmd: 'terraform destroy -auto-approve', cat: 'destroy', pt: 'Destrói sem pedir confirmação.', en: 'Destroys without confirmation.' },

  // ─── state ────────────────────────────────────────────────────────────────
  { cmd: 'terraform state list', cat: 'state', pt: 'Lista todos os endereços de recursos presentes no estado.', en: 'Lists every resource address currently in state.' },
  { cmd: 'terraform state show aws_instance.web', cat: 'state', pt: 'Mostra o estado detalhado (todas as attributes) de um recurso.', en: 'Shows the full state (all attributes) of a single resource.' },
  { cmd: 'terraform state mv aws.old aws.new', cat: 'state', pt: 'Move/renomeia um recurso no estado — mão na roda ao renomear um resource', en: 'Moves/renames a resource in state — great when renaming a resource block' },
  { cmd: 'terraform state rm aws_instance.web', cat: 'state', pt: 'Remove o recurso do estado SEM destruir a infraestrutura real (cuidado!).', en: 'Removes the resource from state WITHOUT destroying the actual infrastructure (careful!).' },
  { cmd: 'terraform state pull', cat: 'state', pt: 'Baixa e imprime o estado atual em JSON (útil pra inspecionar).', en: 'Downloads and prints the current state as JSON (handy for inspecting).' },
  { cmd: 'terraform state push arquivo.tfstate', cat: 'state', pt: 'Sobrescreve o estado remoto com um arquivo local — perigoso, só pra recuperação.', en: 'Overwrites remote state with a local file — dangerous, for recovery only.' },
  { cmd: 'terraform state replace-provider registry.terraform.io/-/aws hashicorp/aws', cat: 'state', pt: 'Troca um provider no estado existente (ex.: migração de namespace).', en: 'Swaps a provider in existing state (e.g., namespace migration).' },
  { cmd: 'terraform apply -refresh-only', cat: 'state', pt: 'Atualiza apenas o estado com a realidade da infra, sem alterar recursos.', en: 'Reconciles state with real infrastructure only, without changing resources.' },
  { cmd: 'terraform apply -refresh=false', cat: 'state', pt: 'Aplica sem atualizar o estado a partir da infra existente.', en: 'Applies without syncing state from live infrastructure.' },

  // ─── import ───────────────────────────────────────────────────────────────
  { cmd: 'terraform import aws_instance.web i-0123456789abcdef0', cat: 'import', pt: 'Importa um recurso existente (criado fora do Terraform) para o estado.', en: 'Imports an existing resource (created outside Terraform) into state.' },
  { cmd: 'terraform import module.vpc.aws_subnet.main[0] subnet-0abc123', cat: 'import', pt: 'Import com índice de lista — necessário quando o recurso usa count/for_each.', en: 'Import with a list index — required when the resource uses count/for_each.' },
  { cmd: 'terraform plan -generate-config-out=generated.tf', cat: 'import', pt: 'Gera um rascunho de configuração (.import.tf) a partir de um bloco import declarativo.', en: 'Generates a draft configuration file from a declarative import block.' },

  // ─── workspace ────────────────────────────────────────────────────────────
  { cmd: 'terraform workspace list', cat: 'workspace', pt: 'Lista os workspaces disponíveis.', en: 'Lists available workspaces.' },
  { cmd: 'terraform workspace new dev', cat: 'workspace', pt: 'Cria um novo workspace (estado separado do default).', en: 'Creates a new workspace (a state separate from default).' },
  { cmd: 'terraform workspace select dev', cat: 'workspace', pt: 'Troca para o workspace informado; planeje/aplique nele a partir daí.', en: 'Switches to the given workspace; plan/apply target it from now on.' },
  { cmd: 'terraform workspace show', cat: 'workspace', pt: 'Mostra o workspace atual.', en: 'Prints the current workspace.' },
  { cmd: 'terraform workspace delete dev', cat: 'workspace', pt: 'Apaga um workspace vazio (destrua os recursos antes).', en: 'Deletes an empty workspace (destroy its resources first).' },

  // ─── variables ────────────────────────────────────────────────────────────
  { cmd: 'variable "regiao" {\n  type        = string\n  default     = "us-east-1"\n  description = "AWS region"\n}', cat: 'variables', pt: 'Declara uma variável de entrada com tipo, default e descrição.', en: 'Declares an input variable with type, default and description.' },
  { cmd: 'variable "segredo" {\n  type      = string\n  sensitive = true\n}', cat: 'variables', pt: 'sensitive=true esconde o valor do output/plan/logs.', en: 'sensitive = true hides the value from outputs/plans/logs.' },
  { cmd: 'variable "tipo" {\n  type = list(string)\n  validation {\n    condition     = length(var.tipo) > 0\n    error_message = "A lista não pode ser vazia."\n  }\n}', cat: 'variables', pt: 'Validação customizada falha em plan/apply quando não satisfeita.', en: 'Custom validation fails plan/apply when the condition is not satisfied.' },
  { cmd: 'terraform.tfvars', cat: 'variables', pt: 'Arquivo carregado automaticamente com valores das variáveis.', en: 'File auto-loaded with variable values.' },
  { cmd: 'prod.auto.tfvars', cat: 'variables', pt: 'Qualquer *.auto.tfvars também é carregado automaticamente.', en: 'Any *.auto.tfvars file is auto-loaded too.' },
  { cmd: 'terraform plan -var-file=prod.tfvars', cat: 'variables', pt: 'Carrega valores de um arquivo tfvars específico.', en: 'Loads values from a specific tfvars file.' },
  { cmd: 'export TF_VAR_regiao=sa-east-1', cat: 'variables', pt: 'Variável de ambiente TF_VAR_<nome> também vira a variável do Terraform.', en: 'The TF_VAR_<name> environment variable maps to a Terraform variable.' },
  { cmd: 'terraform.tfvars.json', cat: 'variables', pt: 'Variante em JSON do tfvars (HCL e JSON são suportados).', en: 'JSON variant of tfvars (both HCL and JSON are supported).' },

  // ─── outputs ──────────────────────────────────────────────────────────────
  { cmd: 'output "ip_publico" {\n  value = aws_instance.web.public_ip\n}', cat: 'outputs', pt: 'Expõe um valor calculado para consulta após o apply.', en: 'Exposes a computed value for querying after apply.' },
  { cmd: 'output "senha" {\n  value     = aws_db_instance.db.password\n  sensitive = true\n}', cat: 'outputs', pt: 'Output sensível exige -json ou fica mascarado no CLI.', en: 'Sensitive outputs are masked in the CLI unless queried via -json.' },
  { cmd: 'terraform output', cat: 'outputs', pt: 'Lista todos os outputs configurados.', en: 'Lists all configured outputs.' },
  { cmd: 'terraform output -json ip_publico', cat: 'outputs', pt: 'Pega um output específico em JSON (bom pra scripts).', en: 'Fetches a single output as JSON (great for scripts).' },

  // ─── providers & backend ──────────────────────────────────────────────────
  { cmd: 'terraform {\n  required_providers {\n    aws = { source = "hashicorp/aws", version = "~> 5.0" }\n  }\n  backend "s3" {\n    bucket = "meu-tfstate"\n    key    = "prod/terraform.tfstate"\n    region = "us-east-1"\n  }\n}', cat: 'providers', pt: 'Bloco terraform: versions dos providers (terraform >= 0.13) e backend remoto S3.', en: 'The terraform block: provider versions (terraform >= 0.13) and a remote S3 backend.' },
  { cmd: 'provider "aws" {\n  region = "us-east-1"\n}\n\nprovider "aws" {\n  alias  = "west"\n  region = "us-west-2"\n}', cat: 'providers', pt: 'Providers com alias — use provider = aws.west em um resource específico.', en: 'Aliased providers — use provider = aws.west on a specific resource.' },
  { cmd: 'resource "aws_instance" "web" {\n  provider = aws.west\n  # ...\n}', cat: 'providers', pt: 'Atribui o provider aliado a um recurso.', en: 'Assigns the aliased provider to a resource.' },
  { cmd: 'backend "s3" {\n  bucket         = "meu-tfstate"\n  key            = "prod/infra.tfstate"\n  region         = "us-east-1"\n  dynamodb_table = "terraform-locks"\n}', cat: 'providers', pt: 'Backend S3 com DynamoDB para lock — evita dois applies simultâneos.', en: 'S3 backend with a DynamoDB lock table — prevents concurrent applies.' },
  { cmd: '.terraform.lock.hcl', cat: 'providers', pt: 'Lockfile que fixa as versões exatas — COMMITE este arquivo.', en: 'Lockfile pinning exact versions — COMMIT this file.' },
  { cmd: 'terraform providers', cat: 'providers', pt: 'Lista os providers exigidos e as versões instaladas.', en: 'Lists required providers and installed versions.' },
  { cmd: 'terraform providers lock -platform=linux_amd64 -platform=darwin_arm64', cat: 'providers', pt: 'Gera o lockfile cobrindo múltiplas plataformas (CI etc.).', en: 'Generates the lockfile covering multiple platforms (CI, etc.).' },

  // ─── modules ──────────────────────────────────────────────────────────────
  { cmd: 'module "vpc" {\n  source  = "terraform-aws-modules/vpc/aws"\n  version = "5.0.0"\n  name    = "minha-vpc"\n  cidr    = "10.0.0.0/16"\n}', cat: 'modules', pt: 'Chama um módulo do Registry (source + version pinada).', en: 'Calls a module from the Registry (source + pinned version).' },
  { cmd: 'module "api" {\n  source = "git::https://github.com/org/repo.git?ref=v1.2.0"\n}', cat: 'modules', pt: 'Módulo vindo de repositório git com tag como ref (versions remota).', en: 'Module from a git repo with a tag as ref (remote versions).' },
  { cmd: 'module "local" {\n  source = "./modules/security-group"\n}', cat: 'modules', pt: 'Módulo local (caminho relativo) — sem version constraint.', en: 'Local module (relative path) — no version constraint.' },
  { cmd: 'terraform get -update', cat: 'modules', pt: 'Baixa/atualiza os módulos referenciados.', en: 'Downloads/updates referenced modules.' },

  // ─── meta-argumentos HCL ──────────────────────────────────────────────────
  { cmd: 'resource "aws_instance" "web" {\n  count = 3\n  # count.index\n}', cat: 'meta', pt: 'count cria N instâncias indexadas por count.index.', en: 'count creates N instances indexed by count.index.' },
  { cmd: 'resource "aws_iam_user" "u" {\n  for_each = toset(["ana", "bia", "caio"])\n  name     = each.key\n}', cat: 'meta', pt: 'for_each itera um set/map — referências ficam por chave (mais seguro que count).', en: 'for_each iterates a set/map — references become key-based (safer than count).' },
  { cmd: 'resource "aws_eip" "eip" {\n  depends_on = [aws_instance.web]\n}', cat: 'meta', pt: 'depends_on força a dependência explícita mesmo sem referência no config.', en: 'depends_on forces an explicit dependency even without a config reference.' },
  { cmd: 'lifecycle {\n  create_before_destroy = true\n}', cat: 'meta', pt: 'Cria o novo antes de destruir o antigo (indispensável p/ recursos interrompíveis).', en: 'Creates the new one before destroying the old (essential for interruptible resources).' },
  { cmd: 'lifecycle {\n  prevent_destroy = true\n}', cat: 'meta', pt: 'Bloqueia destroy deste recurso — protege bancos e dados críticos.', en: 'Blocks destroy of this resource — protects critical databases and data.' },
  { cmd: 'lifecycle {\n  ignore_changes = [tags, ami]\n}', cat: 'meta', pt: 'Ignora mudanças em attributes selecionados (ex.: tags editadas fora do TF).', en: 'Ignores changes to selected attributes (e.g., tags edited outside TF).' },
  { cmd: 'dynamic "ingress" {\n  for_each = var.portas\n  content {\n    from_port   = ingress.value\n    to_port     = ingress.value\n    protocol    = "tcp"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n}', cat: 'meta', pt: 'dynamic blocks repetem blocos aninhados a partir de listas/variáveis.', en: 'Dynamic blocks repeat nested blocks driven by lists/variables.' },

  // ─── funções ──────────────────────────────────────────────────────────────
  { cmd: 'cidrsubnet("10.0.0.0/16", 8, 1)', cat: 'functions', pt: 'Divide um CIDR em subredes (10.0.1.0/24 neste caso).', en: 'Splits a CIDR into subnets (10.0.1.0/24 here).' },
  { cmd: 'lookup(map, "chave", "default")', cat: 'functions', pt: 'Lê uma chave de um map com fallback se ausente.', en: 'Reads a map key with a fallback when absent.' },
  { cmd: 'merge(map1, map2, ...)', cat: 'functions', pt: 'Junta maps — chaves posteriores vencem.', en: 'Merges maps — later keys win.' },
  { cmd: 'element(["a", "b", "c"], 1)', cat: 'functions', pt: 'Retorna o item do índice (circular: volta ao 0 ao estourar).', en: 'Returns the item at an index (circular: wraps around after the end).' },
  { cmd: 'file("key.pem")', cat: 'functions', pt: 'Lê o conteúdo de um arquivo local como string.', en: 'Reads a local file as a string.' },
  { cmd: 'templatefile("user_data.sh.tftpl", { server = var.nome })', cat: 'functions', pt: 'Renderiza um template .tftpl com variáveis interpoladas.', en: 'Renders a .tftpl template with interpolated variables.' },
  { cmd: 'jsonencode({ a = 1, b = "x" })', cat: 'functions', pt: 'Converte um mapa HCL em JSON (policy IAM, payloads).', en: 'Encodes HCL data to JSON (IAM policies, payloads).' },
  { cmd: 'jsondecode(var.arquivo)', cat: 'functions', pt: 'Converte JSON em dados HCL para iterar com for_each.', en: 'Decodes JSON into HCL data to iterate with for_each.' },
  { cmd: 'yamlencode({ a = 1 }) / yamldecode(var.y)', cat: 'functions', pt: 'Codifica/decodifica YAML (k8s manifests, cloud-init).', en: 'Encodes/decodes YAML (k8s manifests, cloud-init).' },
  { cmd: 'coalesce(var.a, var.b, "fallback")', cat: 'functions', pt: 'Retorna o primeiro valor não nulo e não vazio.', en: 'Returns the first non-null, non-empty value.' },
  { cmd: 'format("%s-%s", var.ambiente, var.nome)', cat: 'functions', pt: 'Formata strings (printf-style).', en: 'Formats strings printf-style.' },
  { cmd: 'formatdate("YYYY-MM-DD", timestamp())', cat: 'functions', pt: 'Converte um timestamp RFC3339 em datas amigáveis.', en: 'Converts an RFC3339 timestamp into friendly dates.' },
  { cmd: 'try(valor.x, "default")', cat: 'functions', pt: 'Avalia e retorna fallback se qualquer passo der erro.', en: 'Evaluates and returns a fallback if any step errors out.' },
  { cmd: 'length(var.lista)', cat: 'functions', pt: 'Comprimento de listas/maps/strings.', en: 'Length of lists/maps/strings.' },

  // ─── flags & dicas de CLI ────────────────────────────────────────────────
  { cmd: 'TF_LOG=TRACE terraform plan', cat: 'cli', pt: 'Log detalhado do provider (DEBUG e TRACE são os mais usados).', en: 'Verbose provider logging (DEBUG and TRACE are the common ones).' },
  { cmd: 'export TF_LOG_PATH=./tf.log', cat: 'cli', pt: 'Escreve o log num arquivo em vez do stderr.', en: 'Writes the log to a file instead of stderr.' },
  { cmd: 'export TF_IN_AUTOMATION=true', cat: 'cli', pt: 'Indica execução automatizada — ajusta avisos/messages pra CI.', en: 'Signals automated runs — adjusts warnings/messages for CI.' },
  { cmd: 'terraform plan -lock-timeout=5m', cat: 'cli', pt: 'Tempo máximo de espera se o estado estiver travado por outra execução.', en: 'Maximum wait when state is locked by another run.' },
  { cmd: 'terraform apply -compact-warnings', cat: 'cli', pt: 'Mostra avisos condensados em vez da lista completa.', en: 'Shows warnings in compact form instead of the full list.' },
  { cmd: 'terraform fmt -recursive', cat: 'cli', pt: 'Formata todos os .tf de forma recursiva.', en: 'Formats all .tf files recursively.' },
  { cmd: 'terraform fmt -check -diff', cat: 'cli', pt: 'Em CI: falha se algo está mal formatado e mostra o diff.', en: 'In CI: fails if anything is mis-formatted and shows the diff.' },
  { cmd: 'terraform validate', cat: 'cli', pt: 'Valida sintaxe e consistência interna (rápido, não toca a cloud).', en: 'Validates syntax and internal consistency (fast, no cloud access).' },
  { cmd: 'terraform console', cat: 'cli', pt: 'REPL pra testar expressões e funções antes de commit.', en: 'REPL to test expressions and functions before committing.' },
  { cmd: 'terraform graph | dot -Tpng > dep.png', cat: 'cli', pt: 'Gera o grafo de dependências (requer o Graphviz instalado).', en: 'Renders the dependency graph (requires Graphviz installed).' },
  { cmd: '.gitignore:\n  .terraform/\n  *.tfstate\n  *.tfstate.*', cat: 'cli', pt: 'Nunca versionar o estado local nem o diretório do provider.', en: 'Never commit the local state or the provider cache directory.' },
  { cmd: 'terraform version', cat: 'cli', pt: 'Versão do cliente e dos providers em uso.', en: 'Client and provider versions in use.' },
]