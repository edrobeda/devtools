// Gerador de Makefile
// 100% client-side: monta um Makefile a partir de variáveis e targets
// editáveis, sem nenhuma chamada de rede.

function makeVariable(name = '', value = '', comment = '') {
  return { name, value, comment }
}

function makeTarget(name = '', depends = '', commands = [], comment = '', phony = false) {
  return { name, depends: typeof depends === 'string' ? depends : depends.join(' '), commands: [...commands], comment, phony }
}

export const PRESETS = {
  generic: {
    label: { pt: 'Genérico', en: 'Generic' },
    variables: [
      makeVariable('SHELL', '/bin/bash', 'Usa bash para rodar os comandos'),
      makeVariable('.PHONY', 'help install build test clean', 'Declara targets que não geram arquivos'),
    ],
    targets: [
      makeTarget('help', '', ['@echo "Comandos disponíveis:"', '@grep -E "^[a-zA-Z0-9_-]+:" Makefile | sed -e "s/:.*//" | sed -e "s/^/  - /"'], 'Lista os targets disponíveis', true),
      makeTarget('install', '', ['@echo "Instalando dependências..."'], '', true),
      makeTarget('build', 'install', ['@echo "Construindo..."'], '', true),
      makeTarget('test', 'build', ['@echo "Rodando testes..."'], '', true),
      makeTarget('clean', '', ['@echo "Limpando artefatos..."'], '', true),
    ],
  },
  nodejs: {
    label: { pt: 'Node.js', en: 'Node.js' },
    variables: [
      makeVariable('NODE', 'node', 'Interpretador Node'),
      makeVariable('NPM', 'npm', 'Gerenciador de pacotes'),
      makeVariable('SRC_DIR', 'src', 'Diretório de código-fonte'),
      makeVariable('DIST_DIR', 'dist', 'Diretório de saída da build'),
    ],
    targets: [
      makeTarget('help', '', ['@echo "Targets disponíveis:"', '@grep -E "^[a-zA-Z0-9_-]+:" Makefile | sed -e "s/:.*//" | sed -e "s/^/  - /"'], '', true),
      makeTarget('install', '', ['$(NPM) install'], 'Instala as dependências do projeto', true),
      makeTarget('dev', 'install', ['$(NPM) run dev'], 'Inicia o servidor de desenvolvimento', true),
      makeTarget('build', 'install', ['$(NPM) run build'], 'Gera a build de produção', true),
      makeTarget('test', 'install', ['$(NPM) test'], 'Roda a suíte de testes', true),
      makeTarget('lint', 'install', ['$(NPM) run lint'], 'Executa o linter', true),
      makeTarget('clean', '', ['rm -rf $(DIST_DIR) node_modules'], 'Remove build e dependências', true),
    ],
  },
  python: {
    label: { pt: 'Python', en: 'Python' },
    variables: [
      makeVariable('PYTHON', 'python3', 'Interpretador Python'),
      makeVariable('PIP', 'pip3', 'Instalador de pacotes'),
      makeVariable('VENV', '.venv', 'Nome do ambiente virtual'),
      makeVariable('SRC_DIR', 'src', 'Diretório de código-fonte'),
    ],
    targets: [
      makeTarget('help', '', ['@echo "Targets disponíveis:"', '@grep -E "^[a-zA-Z0-9_-]+:" Makefile | sed -e "s/:.*//" | sed -e "s/^/  - /"'], '', true),
      makeTarget('venv', '', ['$(PYTHON) -m venv $(VENV)', '$(VENV)/bin/$(PIP) install --upgrade pip'], 'Cria o ambiente virtual', true),
      makeTarget('install', 'venv', ['$(VENV)/bin/$(PIP) install -r requirements.txt'], 'Instala as dependências', true),
      makeTarget('test', 'install', ['$(VENV)/bin/$(PYTHON) -m pytest'], 'Roda os testes', true),
      makeTarget('lint', 'install', ['$(VENV)/bin/flake8 $(SRC_DIR)'], 'Executa o linter', true),
      makeTarget('format', 'install', ['$(VENV)/bin/black $(SRC_DIR)'], 'Formata o código', true),
      makeTarget('clean', '', ['rm -rf $(VENV) __pycache__ .pytest_cache'], 'Remove ambiente e caches', true),
    ],
  },
  go: {
    label: { pt: 'Go', en: 'Go' },
    variables: [
      makeVariable('GO', 'go', 'Toolchain Go'),
      makeVariable('BINARY', 'app', 'Nome do binário'),
      makeVariable('CMD_DIR', './cmd', 'Diretório do comando principal'),
    ],
    targets: [
      makeTarget('help', '', ['@echo "Targets disponíveis:"', '@grep -E "^[a-zA-Z0-9_-]+:" Makefile | sed -e "s/:.*//" | sed -e "s/^/  - /"'], '', true),
      makeTarget('build', '', ['$(GO) build -o $(BINARY) $(CMD_DIR)'], 'Compila o binário', true),
      makeTarget('test', '', ['$(GO) test ./...'], 'Roda os testes', true),
      makeTarget('run', 'build', ['./$(BINARY)'], 'Roda o binário localmente', true),
      makeTarget('fmt', '', ['$(GO) fmt ./...'], 'Formata o código Go', true),
      makeTarget('vet', '', ['$(GO) vet ./...'], 'Executa go vet', true),
      makeTarget('clean', '', ['rm -f $(BINARY)'], 'Remove o binário', true),
    ],
  },
  rust: {
    label: { pt: 'Rust', en: 'Rust' },
    variables: [
      makeVariable('CARGO', 'cargo', 'Cargo toolchain'),
      makeVariable('TARGET', 'release', 'Perfil de build: debug ou release'),
    ],
    targets: [
      makeTarget('help', '', ['@echo "Targets disponíveis:"', '@grep -E "^[a-zA-Z0-9_-]+:" Makefile | sed -e "s/:.*//" | sed -e "s/^/  - /"'], '', true),
      makeTarget('build', '', ['$(CARGO) build --$(TARGET)'], 'Compila o projeto', true),
      makeTarget('test', '', ['$(CARGO) test'], 'Roda os testes', true),
      makeTarget('run', '', ['$(CARGO) run'], 'Executa o projeto', true),
      makeTarget('check', '', ['$(CARGO) check'], 'Verifica se compila sem gerar binários', true),
      makeTarget('fmt', '', ['$(CARGO) fmt'], 'Formata o código Rust', true),
      makeTarget('clippy', '', ['$(CARGO) clippy -- -D warnings'], 'Executa o clippy', true),
      makeTarget('clean', '', ['$(CARGO) clean'], 'Limpa artefatos de build', true),
    ],
  },
  docker: {
    label: { pt: 'Docker', en: 'Docker' },
    variables: [
      makeVariable('IMAGE', 'my-app', 'Nome da imagem Docker'),
      makeVariable('TAG', 'latest', 'Tag da imagem'),
      makeVariable('DOCKERFILE', 'Dockerfile', 'Caminho do Dockerfile'),
      makeVariable('PORT', '8080', 'Porta exposta no host'),
    ],
    targets: [
      makeTarget('help', '', ['@echo "Targets disponíveis:"', '@grep -E "^[a-zA-Z0-9_-]+:" Makefile | sed -e "s/:.*//" | sed -e "s/^/  - /"'], '', true),
      makeTarget('build', '', ['docker build -t $(IMAGE):$(TAG) -f $(DOCKERFILE) .'], 'Constrói a imagem Docker', true),
      makeTarget('run', '', ['docker run --rm -p $(PORT):80 $(IMAGE):$(TAG)'], 'Roda o container', true),
      makeTarget('push', 'build', ['docker push $(IMAGE):$(TAG)'], 'Publica a imagem no registry', true),
      makeTarget('shell', '', ['docker run --rm -it --entrypoint /bin/sh $(IMAGE):$(TAG)'], 'Abre shell na imagem', true),
      makeTarget('clean', '', ['docker rmi $(IMAGE):$(TAG)'], 'Remove a imagem local', true),
    ],
  },
}

function indentCommand(command, indent) {
  const prefix = typeof indent === 'number' ? ' '.repeat(indent) : indent
  return command
    .split('\n')
    .map((line) => prefix + line)
    .join('\n')
}

function renderVariable(v) {
  const lines = []
  if (v.comment) lines.push(`# ${v.comment}`)
  lines.push(`${v.name} = ${v.value}`)
  return lines.join('\n')
}

function renderTarget(t, indent) {
  const lines = []
  if (t.comment) lines.push(`# ${t.comment}`)
  const deps = t.depends ? ` ${t.depends}` : ''
  lines.push(`${t.name}:${deps}`)
  if (t.commands && t.commands.length > 0) {
    lines.push(t.commands.map((cmd) => indentCommand(cmd, indent)).join('\n'))
  }
  return lines.join('\n')
}

export function buildMakefile(options) {
  const opts = {
    tabSize: 'tab',
    includePhony: true,
    includeHelp: true,
    sortTargets: false,
    header: '',
    variables: [],
    targets: [],
    ...options,
  }

  const indent = opts.tabSize === 'tab' ? '\t' : ' '.repeat(Number(opts.tabSize) || 2)

  let variables = (opts.variables || []).filter((v) => v.name.trim() !== '')
  let targets = (opts.targets || []).filter((t) => t.name.trim() !== '')

  if (opts.sortTargets) {
    targets = [...targets].sort((a, b) => a.name.localeCompare(b.name))
  }

  const out = []

  if (opts.header && opts.header.trim()) {
    out.push(opts.header.trim())
    out.push('')
  }

  if (variables.length > 0) {
    out.push(variables.map(renderVariable).join('\n\n'))
    out.push('')
  }

  const phonyNames = targets.filter((t) => t.phony).map((t) => t.name)
  if (opts.includePhony && phonyNames.length > 0) {
    out.push(`.PHONY: ${phonyNames.join(' ')}`)
    out.push('')
  }

  if (targets.length > 0) {
    out.push(targets.map((t) => renderTarget(t, indent)).join('\n\n'))
    out.push('')
  }

  return out.join('\n').trimEnd() + '\n'
}
