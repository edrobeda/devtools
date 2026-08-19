import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'inventory',
  'playbooks',
  'modules',
  'vars',
  'templates',
  'roles',
  'vault',
  'debug',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  inventory: 'blue',
  playbooks: 'purple',
  modules: 'green',
  vars: 'orange',
  templates: 'cyan',
  roles: 'volcano',
  vault: 'gold',
  debug: 'red',
}

const labelOf = {
  cli: { pt: 'CLI, ansible.cfg & ad-hoc', en: 'CLI, ansible.cfg & ad-hoc' },
  inventory: { pt: 'Inventário & padrões', en: 'Inventory & patterns' },
  playbooks: { pt: 'Playbooks & tasks', en: 'Playbooks & tasks' },
  modules: { pt: 'Módulos essenciais', en: 'Essential modules' },
  vars: { pt: 'Variáveis & facts', en: 'Variables & facts' },
  templates: { pt: 'Templates Jinja2', en: 'Jinja2 templates' },
  roles: { pt: 'Roles & collections', en: 'Roles & collections' },
  vault: { pt: 'Ansible Vault', en: 'Ansible Vault' },
  debug: { pt: 'Debug & solução de problemas', en: 'Debug & troubleshooting' },
}

const COMMANDS = [
  // ─── CLI, ansible.cfg & ad-hoc ──────────────────────────────────────────
  { cmd: 'ansible --version', cat: 'cli', pt: 'Versão + versões de Python e módulos', en: 'Version + Python and module versions' },
  { cmd: 'ansible all -m ping', cat: 'cli', pt: 'Ad-hoc: testa conectividade de todos os hosts', en: 'Ad-hoc: tests connectivity on all hosts' },
  { cmd: 'ansible chess -m setup', cat: 'cli', pt: 'Coleta os facts de um grupo chamado chess', en: 'Gathers facts for a group named chess' },
  { cmd: 'ansible all -a "uptime"', cat: 'cli', pt: 'Ad-hoc com módulo padrão (command) sem -m', en: 'Ad-hoc with the default module (command) without -m' },
  { cmd: 'ansible all -m apt -a "name=nginx state=latest" -b', cat: 'cli', pt: '-b = become root (sudo)', en: '-b = become root (sudo)' },
  { cmd: 'ansible-playbook site.yml', cat: 'cli', pt: 'Executa um playbook', en: 'Runs a playbook' },
  { cmd: 'ansible-playbook site.yml --syntax-check', cat: 'cli', pt: 'Apenas valida a sintaxe', en: 'Only validates syntax' },
  { cmd: 'ansible-playbook site.yml --check', cat: 'cli', pt: 'Modo check (dry-run) — simula sem alterar', en: 'Check mode (dry-run) — simulates without changing' },
  { cmd: 'ansible-playbook site.yml --diff', cat: 'cli', pt: 'Mostra as diffs dos arquivos alterados', en: 'Shows diffs of changed files' },
  { cmd: 'ansible-playbook site.yml --tags deploy', cat: 'cli', pt: 'Executa só as tasks com a tag deploy', en: 'Runs only tasks tagged deploy' },
  { cmd: 'ansible-playbook site.yml --skip-tags lint', cat: 'cli', pt: 'Pula as tasks com a tag lint', en: 'Skips tasks tagged lint' },
  { cmd: 'ansible-playbook site.yml -l web1', cat: 'cli', pt: 'Limita a execução a um host/pattern', en: 'Limits execution to one host/pattern' },
  { cmd: 'ansible-playbook site.yml -v / -vvv', cat: 'cli', pt: 'Verbose — quanto mais v, mais detalhe', en: 'Verbosity — the more v, the more detail' },
  { cmd: 'ansible-inventory --list', cat: 'cli', pt: 'Exibe o inventário resolvido em JSON', en: 'Shows the resolved inventory as JSON' },
  { cmd: 'ansible-inventory --graph', cat: 'cli', pt: 'Árvore visual dos grupos e hosts', en: 'Visual tree of groups and hosts' },
  { cmd: 'ansible-doc apt', cat: 'cli', pt: 'Documentação de um módulo (com exemplos)', en: 'Module docs (with examples)' },
  { cmd: 'ansible-config dump', cat: 'cli', pt: 'Valores efetivos da configuração', en: 'Effective configuration values' },
  { cmd: 'ansible-config view', cat: 'cli', pt: 'Mostra o ansible.cfg em uso', en: 'Shows the ansible.cfg in use' },
  { cmd: 'ansible-console', cat: 'cli', pt: 'REPL interativo com módulos Tab-complete', en: 'Interactive REPL with Tab-complete modules' },
  { cmd: '[defaults]\ninventory = hosts.ini', cat: 'cli', pt: 'ansible.cfg — define o inventário padrão', en: 'ansible.cfg — sets the default inventory' },
  { cmd: 'roles_path = ~/.ansible/roles', cat: 'cli', pt: 'ansible.cfg — onde procurar roles', en: 'ansible.cfg — where to look for roles' },
  { cmd: 'host_key_checking = False', cat: 'cli', pt: 'ansible.cfg — ignora verificação de chave SSH', en: 'ansible.cfg — disables SSH host key checking' },
  { cmd: 'forks = 20', cat: 'cli', pt: 'ansible.cfg — hosts operados em paralelo', en: 'ansible.cfg — hosts operated in parallel' },
  { cmd: 'ANSIBLE_PIPELINING=1', cat: 'cli', pt: 'Ambiente: menos SSH round-trips (mais rápido)', en: 'Env: fewer SSH round-trips (faster)' },

  // ─── Inventário & padrões ───────────────────────────────────────────────
  { cmd: 'web1 ansible_host=10.0.0.5', cat: 'inventory', pt: 'INI: host com endereço override', en: 'INI: host with an overridden address' },
  { cmd: '[web]\nweb1\nweb2\n[db]\ndb1', cat: 'inventory', pt: 'INI: grupos web e db com seus hosts', en: 'INI: web and db groups with their hosts' },
  { cmd: '[web:vars]\nansible_user=ubuntu', cat: 'inventory', pt: 'INI: variáveis de um grupo', en: 'INI: variables for a group' },
  { cmd: '[prod:children]\nweb\ndb', cat: 'inventory', pt: 'INI: grupo de grupos (prod contém web+db)', en: 'INI: group of groups (prod contains web+db)' },
  { cmd: 'hosts.yml:\n  web:\n    hosts:\n      web1:\n        ansible_host: 10.0.0.5', cat: 'inventory', pt: 'Inventário YAML com sub-dicionários', en: 'YAML inventory with sub-dictionaries' },
  { cmd: 'ansible_host / ansible_port / ansible_user', cat: 'inventory', pt: 'Connection vars por host', en: 'Per-host connection vars' },
  { cmd: 'ansible_ssh_private_key_file', cat: 'inventory', pt: 'Chave SSH específica do host', en: 'Host-specific SSH key' },
  { cmd: 'ansible_connection=local', cat: 'inventory', pt: 'Roda no próprio host (sem SSH)', en: 'Runs on the host itself (no SSH)' },
  { cmd: 'ansible_become=yes\nansible_become_user=root', cat: 'inventory', pt: 'Privilégio padrão do host', en: 'Default privilege for the host' },
  { cmd: 'web1:web2', cat: 'inventory', pt: 'Pattern: união de dois hosts', en: 'Pattern: union of two hosts' },
  { cmd: 'web:!db', cat: 'inventory', pt: 'Pattern: tudo de web exceto db', en: 'Pattern: everything in web except db' },
  { cmd: 'web:&staging', cat: 'inventory', pt: 'Pattern: intersecção dos dois grupos', en: 'Pattern: intersection of both groups' },
  { cmd: 'web[0]', cat: 'inventory', pt: 'Pattern: primeiro host do grupo', en: 'Pattern: first host of the group' },
  { cmd: 'localhost', cat: 'inventory', pt: 'Pattern: o próprio host (delegation)', en: 'Pattern: the host itself (delegation)' },
  { cmd: 'all, ungrouped, "all:!prod"', cat: 'inventory', pt: 'Patterns mágicos: tudo, sem grupo, "tudo menos prod"', en: 'Magic patterns: all, ungrouped, "all:!prod"' },

  // ─── Playbooks & tasks ──────────────────────────────────────────────────
  { cmd: 'hosts: web\nbecome: yes\ntasks:\n  - name: instala nginx\n    apt:\n      name: nginx\n      state: present', cat: 'playbooks', pt: 'Playbook mínimo em YAML', en: 'Minimal YAML playbook' },
  { cmd: 'gather_facts: no', cat: 'playbooks', pt: 'Pula a coleta de facts (playbook mais rápido)', en: 'Skips fact gathering (faster playbook)' },
  { cmd: 'become: yes\nbecome_user: deploy', cat: 'playbooks', pt: 'Roda as tasks como outro usuário', en: 'Runs tasks as another user' },
  { cmd: 'serial: 5', cat: 'playbooks', pt: 'Roda em lotes de 5 hosts por vez (rolling)', en: 'Runs in batches of 5 hosts at a time (rolling)' },
  { cmd: 'delegate_to: localhost', cat: 'playbooks', pt: 'Executa a task no controller, não no alvo', en: 'Runs the task on the controller, not the target' },
  { cmd: 'run_once: true', cat: 'playbooks', pt: 'Executa a task em só um host do lote', en: 'Runs the task on only one host in the batch' },
  { cmd: 'when: ansible_facts.distribution == "Ubuntu"', cat: 'playbooks', pt: 'Só executa se a condição for verdadeira', en: 'Runs only if the condition is true' },
  { cmd: 'loop:\n  - "0.0.0.0"', cat: 'playbooks', pt: 'Loop com acesso à variável item', en: 'Loop with access to the item variable' },
  { cmd: 'with_items:\n  - nginx\n  - git', cat: 'playbooks', pt: 'Loop clássico (item em {{ item }})', en: 'Classic loop (item in {{ item }})' },
  { cmd: 'notify: restart nginx', cat: 'playbooks', pt: 'Dispara um handler ao mudar o estado', en: 'Fires a handler when the state changes' },
  { cmd: 'handlers:\n  - name: restart nginx\n    service:\n      name: nginx\n      state: restarted', cat: 'playbooks', pt: 'Handlers rodam no fim do play, só se notificados', en: 'Handlers run at the end of the play, only if notified' },
  { cmd: 'register: resultado', cat: 'playbooks', pt: 'Guarda o retorno da task em uma variável', en: 'Stores the task output in a variable' },
  { cmd: 'failed_when: resultado.rc != 0', cat: 'playbooks', pt: 'Decide a falha pela condição (não pelo rc padrão)', en: 'Decides failure by condition (not default rc)' },
  { cmd: 'changed_when: false', cat: 'playbooks', pt: 'Task nunca marca "changed"', en: 'Task never reports "changed"' },
  { cmd: 'ignore_errors: yes', cat: 'playbooks', pt: 'Continua mesmo se a task falhar', en: 'Continues even if the task fails' },
  { cmd: 'any_errors_fatal: true', cat: 'playbooks', pt: 'Para toda a execução no primeiro erro', en: 'Stops the whole run on the first error' },
  { cmd: 'tags:\n  - deploy', cat: 'playbooks', pt: 'Marca a task; filtre com --tags', en: 'Tags the task; filter with --tags' },
  { cmd: 'environment:\n  PATH: "{{ ansible_env.PATH }}"', cat: 'playbooks', pt: 'Define variáveis de ambiente da task', en: 'Sets env vars for the task' },
  { cmd: 'environment: "{{ proxy_env }}"', cat: 'playbooks', pt: 'Usa um dict de env de variável e reutiliza', en: 'Reuses an env dict from a variable' },
  { cmd: 'retries: 5\ndelay: 3\nuntil: resultado.rc == 0', cat: 'playbooks', pt: 'Tenta até N vezes até a condição passar', en: 'Retries until the condition passes' },
  { cmd: 'no_log: true', cat: 'playbooks', pt: 'Não imprime o output (ex.: senhas)', en: 'Does not log output (e.g., passwords)' },
  { cmd: 'block:\n  - ...\nrescue:\n  - ...\nalways:\n  - ...', cat: 'playbooks', pt: 'Bloco com rescue (tratamento de erro)', en: 'Block with rescue (error handling)' },

  // ─── Módulos essenciais ─────────────────────────────────────────────────
  { cmd: 'apt:\n  name: nginx\n  state: latest\n  update_cache: yes', cat: 'modules', pt: 'Instala/atualiza pacote Debian/Ubuntu', en: 'Installs/updates a Debian/Ubuntu package' },
  { cmd: 'dnf:\n  name: nginx\n  state: present', cat: 'modules', pt: 'Pacote em RHEL/Fedora (yum para os antigos)', en: 'RHEL/Fedora package (yum for older ones)' },
  { cmd: 'package:\n  name: nginx\n  state: present', cat: 'modules', pt: 'Genérico — usa o gerenciador do SO', en: 'Generic — uses the OS package manager' },
  { cmd: 'copy:\n  src: site.conf\n  dest: /etc/nginx/site.conf\n  mode: 0644', cat: 'modules', pt: 'Copia arquivo (com owner/mode)', en: 'Copies a file (with owner/mode)' },
  { cmd: 'copy:\n  content: "oi"\n  dest: /tmp/a.txt', cat: 'modules', pt: 'Cria arquivo a partir de uma string inline', en: 'Creates a file from an inline string' },
  { cmd: 'file:\n  path: /etc/nginx\n  state: directory\n  recurse: yes', cat: 'modules', pt: 'Garante diretório (idempotente)', en: 'Ensures a directory (idempotent)' },
  { cmd: 'file:\n  path: /tmp/a\n  state: absent', cat: 'modules', pt: 'Remove caminho', en: 'Removes a path' },
  { cmd: 'file:\n  src: /etc/nginx/sites-enabled-default\n  dest: /etc/nginx/sites-enabled/000\n  state: link', cat: 'modules', pt: 'Cria/remove symlink', en: 'Creates/removes a symlink' },
  { cmd: 'lineinfile:\n  path: /etc/hosts\n  regexp: "^10.0.0.5"\n  line: "10.0.0.5 web1"', cat: 'modules', pt: 'Garante uma linha que casa a regex', en: 'Ensures a line matching the regex' },
  { cmd: 'systemd:\n  name: nginx\n  state: started\n  enabled: yes', cat: 'modules', pt: 'Gerencia serviço systemd (started/stopped/restarted)', en: 'Manages a systemd service (started/stopped/restarted)' },
  { cmd: 'service:\n  name: nginx\n  state: restarted', cat: 'modules', pt: 'Serviço genérico (SysV/systemd)', en: 'Generic service (SysV/systemd)' },
  { cmd: 'command: node --version', cat: 'modules', pt: 'Executa comando sem shell (não atravessa pipes)', en: 'Runs a command without a shell (no pipes)' },
  { cmd: 'shell: ps aux | grep nginx', cat: 'modules', pt: 'Executa via /bin/sh (pipes/redireção)', en: 'Runs via /bin/sh (pipes/redirection)' },
  { cmd: 'user:\n  name: deploy\n  shell: /bin/bash\n  groups: sudo\n  append: yes', cat: 'modules', pt: 'Cria/gerencia usuário', en: 'Creates/manages a user' },
  { cmd: 'group:\n  name: web\n  state: present', cat: 'modules', pt: 'Cria/gerencia grupo', en: 'Creates/manages a group' },
  { cmd: 'get_url:\n  url: https://x\n  dest: /tmp/x\n  checksum: sha256:...', cat: 'modules', pt: 'Baixa arquivo verificando checksum', en: 'Downloads a file verifying checksum' },
  { cmd: 'fetch:\n  src: /var/log/nginx/access.log\n  dest: ./logs\n  flat: yes', cat: 'modules', pt: 'Traz arquivo dos hosts para o controller', en: 'Fetches files from hosts to the controller' },
  { cmd: 'unarchive:\n  src: app.tar.gz\n  dest: /opt/app\n  remote_src: yes', cat: 'modules', pt: 'Extrai pacote que já está no host', en: 'Extracts an archive already on the host' },
  { cmd: 'git:\n  repo: https://github.com/x/y.git\n  dest: /opt/y\n  version: v1.0.0', cat: 'modules', pt: 'Clona/atualiza repositório na versão', en: 'Clones/updates a repo at a version' },
  { cmd: 'cron:\n  name: backup\n  minute: "0"\n  hour: "2"\n  job: /opt/backup.sh', cat: 'modules', pt: 'Agenda um cron job idempotente', en: 'Schedules an idempotent cron job' },
  { cmd: 'template:\n  src: nginx.conf.j2\n  dest: /etc/nginx/nginx.conf\n  mode: 0644', cat: 'modules', pt: 'Renderiza template Jinja2 e copia', en: 'Renders a Jinja2 template and copies it' },
  { cmd: 'uri:\n  url: http://localhost/health\n  status_code: 200', cat: 'modules', pt: 'Faz requisição HTTP e valida resposta', en: 'Performs an HTTP request and validates the response' },
  { cmd: 'debug:\n  var: resultado', cat: 'modules', pt: 'Imprime o valor de uma variável', en: 'Prints the value of a variable' },

  // ─── Variáveis & facts ──────────────────────────────────────────────────
  { cmd: '{{ ansible_hostname }}', cat: 'vars', pt: 'Fact: hostname do alvo', en: 'Fact: target hostname' },
  { cmd: '{{ ansible_facts.distribution }}', cat: 'vars', pt: 'Fact: distribuição do SO', en: 'Fact: OS distribution' },
  { cmd: '{{ ansible_default_ipv4.address }}', cat: 'vars', pt: 'Fact: IP da interface padrão', en: 'Fact: default interface IP' },
  { cmd: '{{ ansible_env.HOME }}', cat: 'vars', pt: 'Variável de ambiente do alvo', en: 'Target environment variable' },
  { cmd: 'vars:\n  porta: 8080', cat: 'vars', pt: 'Variáveis no nível do play', en: 'Variables at the play level' },
  { cmd: 'vars_files:\n  - vars.yml', cat: 'vars', pt: 'Carrega variáveis de um arquivo', en: 'Loads variables from a file' },
  { cmd: '-e "porta=9090"', cat: 'vars', pt: 'Extra vars — maior precedência (sobre tudo)', en: 'Extra vars — highest precedence (overrides all)' },
  { cmd: 'hostvars["web1"]["ansible_hostname"]', cat: 'vars', pt: 'Acessa variável de outro host do inventário', en: 'Accesses a variable of another inventory host' },
  { cmd: 'groups["web"]', cat: 'vars', pt: 'Lista de hosts do grupo web (template/loop)', en: 'List of hosts in group web (template/loop)' },
  { cmd: '{{ group_names }}', cat: 'vars', pt: 'Grupos a que o host pertence', en: 'Groups to which the host belongs' },
  { cmd: '{{ inventory_hostname }}', cat: 'vars', pt: 'Nome do host atual no inventário', en: 'Name of the current inventory host' },
  { cmd: "{{ lookup('env', 'HOME') }}", cat: 'vars', pt: 'Lookup env — variável do controller', en: 'Env lookup — controller variable' },
  { cmd: "{{ lookup('file', '/etc/hostname') }}", cat: 'vars', pt: 'Lookup file — conteúdo de arquivo do controller', en: 'File lookup — controller file content' },
  { cmd: "{{ lookup('pipe', 'date') }}", cat: 'vars', pt: 'Lookup pipe — saída de um comando local', en: 'Pipe lookup — local command output' },
  { cmd: 'set_fact:\n  url: "http://{{ ansible_hostname }}"', cat: 'vars', pt: 'Cria variável persistente no host', en: 'Creates a host-persistent variable' },
  { cmd: 'group_vars/all.yml\nansible_facts: {x: 1}', cat: 'vars', pt: 'Variáveis por arquivo em group_vars/host_vars', en: 'Variables via group_vars/host_vars files' },
  { cmd: '{{ a if cond else b }}', cat: 'vars', pt: 'Condicional inline no template', en: 'Inline conditional in the template' },

  // ─── Templates Jinja2 ───────────────────────────────────────────────────
  { cmd: '{{ variavel }}', cat: 'templates', pt: 'Interpolação de variável', en: 'Variable interpolation' },
  { cmd: 'server {\n  listen {{ porta }};\n}', cat: 'templates', pt: 'Template típico de config com variável', en: 'Typical config template with a variable' },
  { cmd: '{% for host in groups["web"] %}\n{{ host }}\n{% endfor %}', cat: 'templates', pt: 'Loop gerando uma linha por host do grupo', en: 'Loop generating one line per group host' },
  { cmd: '{% if ansible_os_family == "Debian" %}\n...\n{% endif %}', cat: 'templates', pt: 'Condicional por SO no template', en: 'Conditional by OS in the template' },
  { cmd: "{{ var | default('valor') }}", cat: 'templates', pt: 'Filtro default — valor se a variável não existir', en: 'Default filter — value if the variable is missing' },
  { cmd: "{{ groups['web'] | join(', ') }}", cat: 'templates', pt: 'Filtro join — une uma lista em string', en: 'Join filter — joins a list into a string' },
  { cmd: '{{ list | first }} / {{ list | last }}', cat: 'templates', pt: 'Filtros first/last de uma lista', en: 'first/last filters of a list' },
  { cmd: '{{ list | length }}', cat: 'templates', pt: 'Filtro length — tamanho', en: 'Length filter — size' },
  { cmd: "{{ list | unique | join(', ') }}", cat: 'templates', pt: 'Remove duplicados e une (composição de filtros)', en: 'Deduplicates and joins (filter composition)' },
  { cmd: '{{ str | upper }} / {{ str | lower }}', cat: 'templates', pt: 'Filtros de maiúsculas/minúsculas', en: 'Uppercase/lowercase filters' },
  { cmd: '{{ dict | to_json }}', cat: 'templates', pt: 'Serializa para JSON', en: 'Serializes to JSON' },
  { cmd: '{{ path | basename }}', cat: 'templates', pt: 'Filtro basename do caminho', en: 'Path basename filter' },
  { cmd: "{{ 'sub/nome' | regex_replace('sub/', '') }}", cat: 'templates', pt: 'Filtro regex_replace', en: 'regex_replace filter' },
  { cmd: "{{ var | default('') | length }}", cat: 'templates', pt: 'Composição: default seguido de length (defensivo)', en: 'Composition: default then length (defensive)' },

  // ─── Roles & collections ────────────────────────────────────────────────
  { cmd: 'roles:\n  - common\n  - nginx', cat: 'roles', pt: 'Aplica roles a um play', en: 'Applies roles to a play' },
  { cmd: 'ansible-galaxy init role_comum', cat: 'roles', pt: 'Cria o esqueleto de uma role', en: 'Creates a role skeleton' },
  { cmd: 'ansible-galaxy install geerlingguy.nginx', cat: 'roles', pt: 'Instala role do Galaxy em roles_path', en: 'Installs a Galaxy role into roles_path' },
  { cmd: 'ansible-galaxy collection install community.general', cat: 'roles', pt: 'Instala uma collection (namespace.módulos)', en: 'Installs a collection (namespace.modules)' },
  { cmd: 'requirements.yml:\n  - name: geerlingguy.nginx', cat: 'roles', pt: 'Manifesto de roles + collections para instalar', en: 'Manifest of roles + collections to install' },
  { cmd: 'ansible-galaxy install -r requirements.yml', cat: 'roles', pt: 'Instala tudo do manifesto', en: 'Installs everything from the manifest' },
  { cmd: 'roles/role_comum/\n  tasks/  handlers/  templates/\n  files/  defaults/  vars/  meta/', cat: 'roles', pt: 'Estrutura de diretórios de uma role', en: 'Role directory structure' },
  { cmd: 'defaults/main.yml', cat: 'roles', pt: 'Padrões da role — menor precedência, sobrescrevíveis', en: 'Role defaults — lowest precedence, overridable' },
  { cmd: 'include_role:\n  name: common', cat: 'roles', pt: 'Inclui role em runtime (com when/loop)', en: 'Includes a role at runtime (with when/loop)' },
  { cmd: 'import_role:\n  name: common', cat: 'roles', pt: 'Importa role em parse time (em tarefas fixas)', en: 'Imports a role at parse time (for static tasks)' },

  // ─── Ansible Vault ──────────────────────────────────────────────────────
  { cmd: 'ansible-vault create secrets.yml', cat: 'vault', pt: 'Cria arquivo criptografado (pede senha)', en: 'Creates an encrypted file (prompts for password)' },
  { cmd: 'ansible-vault edit secrets.yml', cat: 'vault', pt: 'Edita o arquivo já criptografado', en: 'Edits the already-encrypted file' },
  { cmd: 'ansible-vault encrypt secrets.yml', cat: 'vault', pt: 'Criptografa um arquivo existente', en: 'Encrypts an existing file' },
  { cmd: 'ansible-vault decrypt secrets.yml', cat: 'vault', pt: 'Descriptografa (para versionar sem segredo)', en: 'Decrypts (to commit without the secret)' },
  { cmd: 'ansible-vault encrypt_string "s3cr3t"', cat: 'vault', pt: 'Gera variável criptografada para colar no YAML', en: 'Generates an encrypted variable to paste into YAML' },
  { cmd: 'ansible-vault rekey secrets.yml', cat: 'vault', pt: 'Troca a senha do arquivo', en: 'Changes the file password' },
  { cmd: 'ansible-playbook site.yml --ask-vault-pass', cat: 'vault', pt: 'Roda pedindo a senha do vault', en: 'Runs prompting for the vault password' },
  { cmd: 'vault_password_file = .vault_pass', cat: 'vault', pt: 'ansible.cfg com senha fora do control version', en: 'ansible.cfg with password outside version control' },
  { cmd: '${ANSIBLE_VAULT;1.1;AES256}', cat: 'vault', pt: 'Cabeçalho do arquivo criptografado (v1.1/AES256)', en: 'Header of the encrypted file (v1.1/AES256)' },
  { cmd: '{{ vault_db_password }}', cat: 'vault', pt: 'Usa a variável criptografada num template/task', en: 'Uses the encrypted variable in a template/task' },

  // ─── Debug & solução de problemas ───────────────────────────────────────
  { cmd: 'debug:\n  msg: "vars {{ ansible_hostname }}"', cat: 'debug', pt: 'Imprime mensagem formatada', en: 'Prints a formatted message' },
  { cmd: 'ansible-playbook site.yml --start-at-task "inicia nginx"', cat: 'debug', pt: 'Retoma a execução a partir de uma task nomeada', en: 'Resumes execution from a named task' },
  { cmd: 'ansible-playbook site.yml --step', cat: 'debug', pt: 'Pergunta antes de cada task (modo passo a passo)', en: 'Asks before each task (step-by-step mode)' },
  { cmd: 'ansible-playbook site.yml --list-hosts', cat: 'debug', pt: 'Mostra os hosts que o play vai atingir', en: 'Shows which hosts the play will target' },
  { cmd: '"msg":\n  "The conditional check failed"', cat: 'debug', pt: 'Erro comum: variável inexistente/undefined no when', en: 'Common error: undefined variable in when' },
  { cmd: 'assert:\n  that:\n    - ansible_facts.architecture == "x86_64"', cat: 'debug', pt: 'Valida premissas antes de prosseguir', en: 'Validates assumptions before proceeding' },
  { cmd: 'setup:   # módulo que coleta facts', cat: 'debug', pt: 'Coleta os facts manualmente', en: 'Manually gathers facts' },
  { cmd: '- ssh -o StrictHostKeyChecking=no ubuntu@host', cat: 'debug', pt: 'Testa conectividade manual antes do Ansible', en: 'Tests connectivity manually before Ansible' },
  { cmd: 'ansible-playbook site.yml --limit localhost', cat: 'debug', pt: 'Outputnível de ruído reduzido local para debug', en: 'Reduced-noise local run for debugging' },
  { cmd: 'ANSIBLE_LOG_PATH=/tmp/log ansible-playbook site.yml', cat: 'debug', pt: 'Log da execução em arquivo', en: 'Writes execution log to a file' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Ansible',
    intro: (
      <>
        Referência pesquisável do Ansible, a ferramenta de automação de
        infraestrutura agentless do Red Hat — CLI, ansible.cfg e comandos
        ad-hoc, inventário e padrões, playbooks e tasks, módulos essenciais,
        variáveis e facts, templates Jinja2, roles e collections, Ansible
        Vault e debug. Tudo 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Conceitos que valem ouro',
    tipBody: (
      <>
        Tudo parte de módulos idempotentes — rode o playbook duas vezes e o
        resultado não muda. Os facts são coletados por padrão no início de
        cada play (desligue com <Text code>gather_facts: no</Text> quando
        não precisar). Só os handlers notificados rodam, no fim do play.
        Precedência de variáveis (da menor pra maior): defaults da role →
        group_vars → play <Text code>vars</Text> → vars da role →
        block/task vars → <Text code>-e</Text> extra vars. Teste primeiro
        com <Text code>--check</Text> e <Text code>--diff</Text> — nunca
        rode um playbook novo direto em produção.
      </>
    ),
    search: 'Buscar snippet ou descrição...',
    all: 'Todos',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'Ansible Cheat Sheet',
    intro: (
      <>
        A searchable reference for Ansible, Red Hat&apos;s agentless
        infrastructure automation tool — CLI, ansible.cfg and ad-hoc
        commands, inventory and patterns, playbooks and tasks, essential
        modules, variables and facts, Jinja2 templates, roles and
        collections, Ansible Vault and debugging. 100% client-side (reference
        text only).
      </>
    ),
    tipTitle: 'Concepts that pay off',
    tipBody: (
      <>
        Everything rides on idempotent modules — run the playbook twice and
        the result does not change. Facts are gathered by default at the
        start of every play (turn off with <Text code>gather_facts: no</Text>{' '}
        when you do not need them). Only notified handlers run, at the end
        of the play. Variable precedence (lowest to highest): role defaults →
        group_vars → play <Text code>vars</Text> → role vars → block/task
        vars → <Text code>-e</Text> extra vars. Test first with{' '}
        <Text code>--check</Text> and <Text code>--diff</Text> — never run a
        brand-new playbook straight against production.
      </>
    ),
    search: 'Search a snippet or description...',
    all: 'All',
    empty: 'No matches found. Try another search or category.',
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function AnsibleCheatsheetPage() {
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
      `| \`${c.cmd.replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
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