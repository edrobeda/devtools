import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['svc', 'boot', 'logs', 'unit', 'timer', 'misc']

const CATEGORY_COLOR = {
  svc: 'blue',
  boot: 'geekblue',
  logs: 'cyan',
  unit: 'purple',
  timer: 'green',
  misc: 'gold',
}

const labelOf = {
  svc: { pt: 'Serviços (systemctl)', en: 'Services (systemctl)' },
  boot: { pt: 'Alvos & boot', en: 'Targets & boot' },
  logs: { pt: 'Logs (journalctl)', en: 'Logs (journalctl)' },
  unit: { pt: 'Unit files', en: 'Unit files' },
  timer: { pt: 'Timers', en: 'Timers' },
  misc: { pt: 'Dicas do dia a dia', en: 'Everyday tips' },
}

const ITEMS = [
  // ─── Serviços (systemctl) ────────────────────────────────────────────
  { code: 'systemctl status nginx', cat: 'svc',
    pt: 'Status humano do serviço: se está active/inactive/failed, PID, memória, portas e as ÚLTIMAS linhas do log — o primeiro comando de qualquer investigação.',
    en: 'Human-readable service status: active/inactive/failed, PID, memory, ports and the LAST log lines — the first command of any investigation.' },
  { code: 'systemctl start nginx\nsystemctl stop nginx', cat: 'svc',
    pt: 'Inicia/para AGORA. Não vale pro boot — pra ligar no boot o verbo é `enable` (veja abaixo).',
    en: 'Starts/stops NOW. Does not persist to boot — the verb for boot is `enable` (see below).' },
  { code: 'systemctl restart nginx', cat: 'svc',
    pt: 'Para e sobe de novo. Usado quando o serviço muda configuração mas não tem suporte a `reload` (derruba as conexões ativas).',
    en: 'Stops then starts again. Used when the config changed but the service supports no `reload` (drops active connections).' },
  { code: 'systemctl reload nginx', cat: 'svc',
    pt: 'Recarrega a configuração SEM derrubar o processo — só funciona se o unit define `ExecReload=`. O nginx/web servers aceitam; apps comuns, não.',
    en: 'Reloads config WITHOUT killing the process — only works when the unit defines `ExecReload=`. nginx/web servers accept it; plain apps don\'t.' },
  { code: 'systemctl enable nginx', cat: 'svc',
    pt: 'Liga o serviço no BOOT: cria o symlink apontado por `WantedBy=` (ex.: `multi-user.target.wants/`). Não inicia nada agora.',
    en: 'Enables the service on BOOT: creates the symlink referenced by `WantedBy=` (e.g. `multi-user.target.wants/`). Starts nothing now.' },
  { code: 'systemctl disable nginx', cat: 'svc',
    pt: 'Remove o symlink do boot. Não para um serviço que está rodando — pra parar, `stop`.',
    en: 'Removes the boot symlink. Does NOT stop a running service — that is `stop`.' },
  { code: 'systemctl enable --now nginx', cat: 'svc',
    pt: 'O combo do dia a dia em máquina nova: `enable` (boot) + `start` (agora) numa coisa só. O `--now` também funciona em `disable` (que aí ainda faz `stop`).',
    en: 'The everyday combo on a fresh box: `enable` (boot) + `start` (now) in one go. `--now` also works with `disable` (which then also stops it).' },
  { code: 'systemctl daemon-reload', cat: 'svc',
    pt: 'REREAD dos arquivos de unit no disco — OBRIGATÓRIO depois de editar um `.service`/`.timer`, senão o systemd usa a versão antiga que tem na memória. Quase sempre seguido de `restart`.',
    en: 'REREAD of the unit files on disk — REQUIRED after editing a `.service`/`.timer`, otherwise systemd keeps the stale in-memory copy. Usually followed by `restart`.' },
  { code: 'systemctl is-active nginx', cat: 'svc',
    pt: 'Imprime `active`/`inactive`/`failed` e devolve exit 0 ou 3 — condicional perfeita de script (exit 0 = ativo).',
    en: 'Prints `active`/`inactive`/`failed` and returns exit 0 or 3 — a perfect script conditional (exit 0 = active).' },
  { code: 'systemctl is-enabled nginx', cat: 'svc',
    pt: 'Estado do boot: `enabled`/`disabled`/`static` (sem Install, enable não se aplica)/`masked`.',
    en: 'Boot state: `enabled`/`disabled`/`static` (no [Install], enable does not apply)/`masked`.' },
  { code: 'systemctl list-units --type=service --state=running', cat: 'svc',
    pt: 'Serviços carregados (e só os rodando com `--state=`). Sem filtro mostra tudo pronto pra caçar o que está `failed`.',
    en: 'Loaded services (only running ones with `--state=`). Unfiltered it shows everything, handy to hunt down what is `failed`.' },
  { code: 'systemctl --failed', cat: 'svc',
    pt: 'A primeira coisa de um servidor doente: lista todos os units que entraram em `failed` desde o boot.',
    en: 'The first thing on a sick server: lists every unit that has gone into `failed` since boot.' },
  { code: 'systemctl list-unit-files', cat: 'svc',
    pt: 'Todos os units que EXISTEM no disco com o estado de boot — o panorama completo entre o que existe e o que está ativo.',
    en: 'Every unit that EXISTS on disk with its boot state — the full map between what exists and what is active.' },
  { code: 'systemctl mask nginx\nsystemctl unmask nginx', cat: 'svc',
    pt: '`mask` liga o aliasing ao /dev/null: impossibilita `start` DIRETO e indireto (nem dependência sobe). `disable` só tira do boot, `mask` bloqueia tudo.',
    en: '`mask` symlinks the unit to /dev/null: it makes `start` impossible, directly and indirectly (even dependencies will not bring it up). `disable` only un-enables boot, `mask` blocks everything.' },
  { code: 'systemctl cat nginx', cat: 'svc',
    pt: 'Imprime o conteúdo EFETIVO do unit — com os drop-ins já aplicados. A fonte da verdade de como o serviço está configurado AGORA.',
    en: 'Prints the EFFECTIVE unit content — with drop-ins already applied. The source of truth for how the service is configured NOW.' },
  { code: 'systemctl edit nginx', cat: 'svc',
    pt: 'Abre um drop-in `override.conf` (systemd-style overlay): você configura por CIMA do original sem tocar no arquivo dele — e o daemon é recarregado sozinho ao fechar.',
    en: 'Opens an `override.conf` drop-in (systemd-style overlay): configure ON TOP of the original without touching its file — and the daemon reloads itself when you close.' },
  { code: 'systemctl show nginx -p MainPID', cat: 'svc',
    pt: 'Imprime um parâmetro EFETIVO (como ficou após processar defaults, overrides e drop-ins). `-p` seleciona a propriedade; sem ele, dump completo.',
    en: 'Prints one EFFECTIVE parameter (as it stands after defaults, overrides and drop-ins). `-p` picks the property; without it, full dump.' },
  { code: 'systemctl help nginx', cat: 'svc',
    pt: 'Manda pro man do unit (e dos diretórios de config dele). Rápido quando o `--help` do serviço não resolve.',
    en: 'Jumps to the unit\'s man page (and its config directories). Quick when the service\'s own `--help` is not enough.' },

  // ─── Alvos & boot ─────────────────────────────────────────────────────
  { code: 'systemctl get-default', cat: 'boot',
    pt: 'O alvo padrão do boot. `multi-user.target` = console de texto sem desktop, `graphical.target` = com GUI.',
    en: 'The default boot target. `multi-user.target` = text console, `graphical.target` = with a GUI.' },
  { code: 'systemctl set-default multi-user.target', cat: 'boot',
    pt: 'Troca o alvo padrão de boot — o "tirar o desktop pra economizar memória do servidor" de uma linha.',
    en: 'Changes the default boot target — the "drop the desktop to save a server\'s memory" one-liner.' },
  { code: 'systemctl isolate multi-user.target', cat: 'boot',
    pt: 'Troca pro alvo AGORA: derruba o que não está na dependência dele e sobe o que falta. Cuidado — é o equivalente a um reboot de units.',
    en: 'Switches to the target NOW: stops what is not in its dependency tree and starts what is missing. Careful — it is a reboot-in-units.' },
  { code: 'systemctl reboot\nsystemctl poweroff', cat: 'boot',
    pt: 'Reinicia/desliga respeitando o shutdown gracioso do systemd (para os serviços com `TimeoutStopSec` antes de matar).',
    en: 'Reboots/powers off through systemd\'s graceful shutdown (stops services within `TimeoutStopSec` before killing).' },
  { code: 'systemctl suspend\nsystemctl hibernate', cat: 'boot',
    pt: 'Suspende (RAM acordando rápido) ou hiberna (RAM no disco). O laptop sob systemd gerencia sozinho isso, mas o comando manual existe.',
    en: 'Suspend (RAM, quick wake) or hibernate (RAM to disk). Laptops manage this automatically, but the manual commands exist.' },
  { code: 'systemctl list-dependencies default.target', cat: 'boot',
    pt: 'A árvore de dependências que sobe no boot — enxerga a ordem e o que puxa o quê.',
    en: 'The dependency tree that boots up the machine — see the order and what pulls what.' },
  { code: 'systemctl list-jobs', cat: 'boot',
    pt: 'Operações pendentes — durante o boot mostra o que ainda está subindo e de onde trava.',
    en: 'Pending jobs — during boot it shows what is still starting and where it is stuck.' },
  { code: 'systemd-analyze blame', cat: 'boot',
    pt: 'O systemd mede o próprio boot: `blame` lista os services pelo TEMPO que cada um atrasou. Pra caçar o vagabundo que segura a inicialização.',
    en: 'systemd measures its own boot: `blame` lists services by how much time each one added. To hunt the bottleneck that holds up startup.' },
  { code: 'systemd-analyze critical-chain', cat: 'boot',
    pt: 'A cadeia crítica do boot com os tempos somados — mostra o caminho que, encurtado, encurta o boot inteiro.',
    en: 'The critical boot chain with cumulative timings — shows which path, when shortened, shortens the whole boot.' },
  { code: 'systemd-analyze verify /etc/systemd/system/meu-app.service', cat: 'boot',
    pt: 'Valida o unit ANTES de ativar: aponta pivot de sintaxe, caminho de `ExecStart=` sem absoluto e referências quebradas.',
    en: 'Validates the unit BEFORE activating: flags syntax slips, non-absolute `ExecStart=` paths and broken references.' },

  // ─── Logs (journalctl) ────────────────────────────────────────────────
  { code: 'journalctl -u nginx', cat: 'logs',
    pt: 'Logs do serviço — o comando mais usado do journal. `-u` filtra por NOME DO UNIT, não por binário.',
    en: 'Logs for the service — the most-used journalctl command. `-u` filters by UNIT NAME, not by binary.' },
  { code: 'journalctl -u nginx -f', cat: 'logs',
    pt: 'Follow: mostra o histórico e CONTINUA imprimindo em tempo real (o `tail -f` do journal).',
    en: 'Follow: prints history and KEEPS printing in real time (journal\'s `tail -f`).' },
  { code: 'journalctl -u nginx -n 50', cat: 'logs',
    pt: 'Só as últimas 50 linhas — o padrão de "o que houve agora" sem despejar o ano inteiro.',
    en: 'Only the last 50 lines — the "what just happened" pattern without dumping the whole year.' },
  { code: 'journalctl --since "10 min ago"', cat: 'logs',
    pt: 'A partir de um instante. Entende `today`, `yesterday`, `-2h`, `2026-08-01 09:00:00` e `now`. O parceiro `--until` corta o fim.',
    en: 'From a moment on. Understands `today`, `yesterday`, `-2h`, `2026-08-01 09:00:00` and `now`. Its partner `--until` cuts the end.' },
  { code: 'journalctl --since today --until "1 hour ago"', cat: 'logs',
    pt: 'Janela típica de incidente: a faixa exata em que você quer olhar, sem varrer o boot todo.',
    en: 'Typical incident window: the exact range you want to look at without scanning the whole boot.' },
  { code: 'journalctl -p err', cat: 'logs',
    pt: 'Só o que está no nível passado e acima. Escada: `emerg alert crit err warning notice info debug`.',
    en: 'Only entries at the given level and above. Ladder: `emerg alert crit err warning notice info debug`.' },
  { code: 'journalctl -b', cat: 'logs',
    pt: 'Desde o BOOT atual (limpa os reboots antigos do histórico). `-b -1` é o boot ANTERIOR e `--list-boots` lista todos.',
    en: 'Since the CURRENT boot (filters out old-reboot history). `-b -1` is the PREVIOUS boot and `--list-boots` lists them all.' },
  { code: 'journalctl -k', cat: 'logs',
    pt: 'Mensagens do kernel — o `dmesg` com histórico PERSISTENTE (o dmesg zera no reboot; o journal guarda).',
    en: 'Kernel messages — `dmesg` with PERSISTENT history (dmesg resets on reboot; the journal keeps it).' },
  { code: 'journalctl -r', cat: 'logs',
    pt: 'Ordem reversa: mais recente primeiro — quando o interessante está no fim mas você quer só a última página.',
    en: 'Reverse order: newest first — when the interesting part is at the end but you want just the last page.' },
  { code: 'journalctl -o json-pretty', cat: 'logs',
    pt: 'Saída estruturada JSON — a porta de entrada pro jq: `journalctl -o json -u nginx | jq ...`. `short-iso`/`cat` são outras formas úteis.',
    en: 'Structured JSON output — the gateway to jq: `journalctl -o json -u nginx | jq ...`. `short-iso` and `cat` are other handy formats.' },
  { code: 'journalctl -x', cat: 'logs',
    pt: 'Anexa as explicações do próprio systemd: quando o erro é conhecido, o journal mostra o texto que o explica embaixo da linha.',
    en: 'Appends systemd\'s own explanations: when the error is known, the journal prints the explaining text below the line.' },
  { code: 'journalctl --no-pager', cat: 'logs',
    pt: 'Sem paginação — pro script, pra pipe ou pra colar a saída inteira no bug report sem precisar rolar.',
    en: 'No pager — for scripts, for pipes or to paste the whole output into a bug report without scrolling.' },
  { code: 'journalctl _PID=1234', cat: 'logs',
    pt: 'Filtro por CAMPO além do `-u`: `_COMM=nginx`, `_UID=1000`, `_SYSTEMD_UNIT=`. O filtro mais fino do journal quando PID/uid é o que você tem.',
    en: 'FIELD filter beyond `-u`: `_COMM=nginx`, `_UID=1000`, `_SYSTEMD_UNIT=`. The finest journal filter when a PID/uid is what you have.' },
  { code: 'journalctl --vacuum-time=7d', cat: 'logs',
    pt: 'Corrige o disco de logs inchado: apaga entradas mais velhas que N (ou fixe tamanho com `--vacuum-size=500M`). Permanentemente: `JournalMaxUse` no `journald.conf`.',
    en: 'Fixes a bloated log disk: drops entries older than N (or cap size with `--vacuum-size=500M`). Permanently: `JournalMaxUse` in `journald.conf`.' },

  // ─── Unit files ───────────────────────────────────────────────────────
  { code: '[Unit]\nDescription=API de vendas\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nUser=appuser\nWorkingDirectory=/opt/app\nExecStart=/usr/bin/python3 server.py\nRestart=on-failure\nRestartSec=3\nEnvironment=PORT=8080\nLimitNOFILE=65535\n\n[Install]\nWantedBy=multi-user.target', cat: 'unit',
    pt: 'O esqueleto de um `.service`: `[Unit]` metadados e ordem, `[Service]` como roda, `[Install]` como liga no boot (só lido no `enable`).',
    en: 'A `.service` skeleton: `[Unit]` metadata and order, `[Service]` how it runs, `[Install]` how it boots (only read on `enable`).' },
  { code: 'Type=simple\nType=forking\nType=oneshot', cat: 'unit',
    pt: 'Como o systemd entende o processo: `simple` o `ExecStart` É o processo principal; `forking` o processo daemoniza sozinho (sshd); `oneshot` roda e sai (scripts/backups, precisa de `RemainAfterExit=yes` pra virar up).',
    en: 'How systemd understands the process: `simple` the `ExecStart` IS the main process; `forking` the process daemonizes itself (sshd); `oneshot` runs and exits (scripts/backups, needs `RemainAfterExit=yes` to stay up).' },
  { code: 'ExecStart=/usr/bin/python3 server.py', cat: 'unit',
    pt: 'O comando em CAMINHO ABSOLUTO + args. Múltiplos comandos entram via `ExecStartPre=`/`ExecStartPost=` em ordem de escrita.',
    en: 'The command as an ABSOLUTE PATH plus args. Extra commands go in via `ExecStartPre=`/`ExecStartPost=`, in written order.' },
  { code: 'WorkingDirectory=/opt/app', cat: 'unit',
    pt: 'O cwd do processo. Se o serviço lê arquivos relativos, o unit precisa apontar o diretório — o systemd não herda o cwd de quem chamou.',
    en: 'The process cwd. If the service reads relative paths, the unit must set it — systemd does not inherit the caller\'s cwd.' },
  { code: 'User=appuser', cat: 'unit',
    pt: 'Roda como esse usuário (e `Group=` pra grupo) — nunca rodar app como root quando dá pra usar um user dedicado.',
    en: 'Runs as this user (and `Group=` for the group) — never run an app as root when a dedicated user works.' },
  { code: 'Restart=on-failure\nRestart=always', cat: 'unit',
    pt: 'Política de reinício: `on-failure` só quando sai com erro (o padrão escolhido), `always` até em exit limpo. Cuidado com loop de crash — por isso existe a `RestartSec`.',
    en: 'Restart policy: `on-failure` only on error exit (the common choice), `always` even on clean exits. Beware crash-loops — that is what `RestartSec` is for.' },
  { code: 'RestartSec=2', cat: 'unit',
    pt: 'Espera entre reinícios. Com `Restart=on-failure` + `RestartSec=2` o systemd evita o loop "crash-reinicia-crash" em menos de um piscar.',
    en: 'Delay between restarts. With `Restart=on-failure` + `RestartSec=2` systemd avoids a "crash-restart-crash" loop in the blink of an eye.' },
  { code: 'Environment=PORT=8080\nEnvironmentFile=/etc/meu-app.env', cat: 'unit',
    pt: 'Variáveis de ambiente: direto no unit ou num arquivo `KEY=VAL` separado (usado quando há segredos que não moram no unit versionado).',
    en: 'Environment variables: inline in the unit or in a separate `KEY=VAL` file (used when secrets should not live in the committed unit).' },
  { code: 'LimitNOFILE=65535', cat: 'unit',
    pt: 'O sistema dos limites: o systemd (PID 1) aplica os rlimits dos software — o `ulimit` do seu shell NÃO vale pro serviço. `LimitNOFILE` é o clássico "too many open files".',
    en: 'Make sysadmin of limits: systemd (PID 1) applies the service rlimits — your shell\'s `ulimit` does NOT apply to services. `LimitNOFILE` is the classic "too many open files" fix.' },
  { code: 'After=network-online.target\nWants=network-online.target', cat: 'unit',
    pt: 'O par ordem+dependência: `After=` manda subir DEPOIS (não puxa nada, só ordena), `Wants=` puxa a dependência fraca (sobe junto, mas falha dela não derruba você).',
    en: 'The order+dependency pair: `After=` orders startup AFTER (pulls nothing, just sorts), `Wants=` weakly pulls the dependency (starts together, but its failure does not take you down).' },
  { code: 'Requires=postgres.service', cat: 'unit',
    pt: 'Dependência FORTE: se o requisito falhar, este serviço também falha (e vice-versa no stop). O API precisa do banco: `Requires` + `After` juntos.',
    en: 'STRONG dependency: if the requirement fails, so does this service (and vice-versa on stop). The API needs the DB: `Requires` plus `After` together.' },
  { code: 'OnFailure=alerta-email@.service', cat: 'unit',
    pt: 'Dispara um unit (notificação, script de rollback) quando ESTE falha — o "me avisa quando quebrar" nativo do systemd.',
    en: 'Fires a unit (notification, rollback script) when THIS one fails — systemd\'s native "tell me when it breaks".' },
  { code: 'TimeoutStopSec=30', cat: 'unit',
    pt: 'Quanto o systemd espera o processo morrer no stop antes de matar (SIGKILL). App que precisa flushear/graceful: deixe um valor que comporte isso.',
    en: 'How long systemd waits for the process to die on stop before SIGKILL. Apps that need flush/graceful: give a value that covers it.' },

  // ─── Timers ───────────────────────────────────────────────────────────
  { code: '[Unit]\nDescription=Backup diário\n\n[Timer]\nOnCalendar=*-*-* 03:00:00\nPersistent=true\n\n[Install]\nWantedBy=timers.target', cat: 'timer',
    pt: 'Timer = agendador nativo: "acordar o serviço X" em vez de cron. O unit do serviço pode ser `oneshot` que só roda quando o timer dispara.',
    en: 'Timer = native scheduler, "wake service X" instead of cron. The unit service can be `oneshot` and only run when the timer fires.' },
  { code: 'OnCalendar=daily\nOnCalendar=Mon..Fri *-*-* 09:00:00\nOnCalendar=*:0/15', cat: 'timer',
    pt: 'Formato do cron: `daily`/`hourly`/`weekly`/`monthly` (atalhos), ou `Dia-da-semana Ano-Mês-Dia Hora:Minuto` com `*:0/15` = a cada 15 min (o `/n` divide o campo).',
    en: 'cron-like format: `daily`/`hourly`/`weekly`/`monthly` (shortcuts), or `Weekday Year-Month-Day Hour:Minute` with `*:0/15` = every 15 min (the `/n` splits the field).' },
  { code: 'OnBootSec=5min', cat: 'timer',
    pt: 'Roda N após o boot — o jeito de "esperar a máquina acalmar antes de rodar a limpeza".',
    en: 'Runs N after boot — the way to "let the machine settle before running the cleanup".' },
  { code: 'OnUnitActiveSec=12h', cat: 'timer',
    pt: 'Roda N após a ÚLTIMA ativação do serviço — em vez de hora fixa, segue o ciclo (inspeção pós-deploy, etc).',
    en: 'Runs N after the LAST activation of the service — instead of a fixed clock, follows the cycle (post-deploy checks, etc.).' },
  { code: 'Persistent=true', cat: 'timer',
    pt: 'Se a máquina estava desligada/dormindo no disparo, roda quando voltar — o "backup perdido por laptop dormindo" não acontece mais.',
    en: 'If the machine was off/asleep at trigger time, run when it is back — the "backup missed because the laptop slept" never happens again.' },
  { code: 'AccuracySec=1h', cat: 'timer',
    pt: 'Margem de precisão: permite o systemd juntar despertados de vários timers e economizar energia. `0` força o disparo quase exato na marca.',
    en: 'Accuracy margin: lets systemd coalesce timer wake-ups to save power. `0` forces the firing almost exactly on the mark.' },
  { code: 'systemctl list-timers', cat: 'timer',
    pt: 'Todos os timers ativos, o que cada um vai rodar e o PRÓXIMO disparo (com atraso em vermelho quando passou da hora).',
    en: 'All active timers, what each will run and the NEXT fire time (with overdue marked in red).' },
  { code: 'systemctl start backup.timer', cat: 'timer',
    pt: 'Ativa um timer SEM esperar o boot (depois do `enable`). `status backup.timer` mostra o próximo disparo.',
    en: 'Activates a timer WITHOUT waiting for boot (after `enable`). `status backup.timer` shows the next fire time.' },

  // ─── Dicas do dia a dia ───────────────────────────────────────────────
  { code: 'systemctl is-active --quiet nginx && echo ok || systemctl restart nginx', cat: 'misc',
    pt: 'A linha de health-check/auto-cura: `--quiet` derruba o stdout, o exit code vira a condicional — ativo? segue; senão, reinicia.',
    en: 'The health-check/self-heal one-liner: `--quiet` silences stdout and the exit code drives the conditional — active? continue; otherwise restart.' },
  { code: 'grep -R "ExecStart" /lib/systemd/system /etc/systemd/system', cat: 'misc',
    pt: 'Achar ONDE um unit é definido: os pacotes colocam units em `/lib/systemd/system` e o admin sobrepõe em `/etc/systemd/system` (que VENCE).',
    en: 'Find WHERE a unit is defined: packages drop units in `/lib/systemd/system` and admins override in `/etc/systemd/system` (which WINS).' },
  { code: 'systemctl list-dependencies ssh --reverse', cat: 'misc',
    pt: 'Quem DEPENDE do serviço — `--reverse` inverte a árvore e mostra o que morre/reinicia junto (útil antes de recarregar um alvo).',
    en: 'What DEPENDS on the service — `--reverse` flips the tree and shows what dies/restarts alongside (handy before reloading a target).' },
  { code: 'journalctl -u nginx -f --since today\n# log de UMA sessão de debug', cat: 'misc',
    pt: 'Seguindo o serviço no aqui-e-agora do incidente: filtro por unit, janela de hoje e follow — a tríade de suporte do dia a dia.',
    en: 'Following the service in the here-and-now of an incident: unit filter, today window and follow — the everyday support triad.' },
  { code: 'systemctl list-dependencies --all | grep -E "●|failed"', cat: 'misc',
    pt: 'Andar pela árvore toda olhando o estado pintado no terminal: a seta aponta rodando/parado/falhou numa varredura só.',
    en: 'Walk the whole tree watching the state colors painted in the terminal: an arrow marks running/stopped/failed in one scan.' },
  { code: 'sudo -u appuser systemctl is-system-running', cat: 'misc',
    pt: 'O termômetro geral da máquina: `running`/`degraded` (algum unit falhou)/`starting`/`maintenance`. `degraded` é o estado normal de servidor que "segura mas manca".',
    en: 'The machine\'s general thermometer: `running`/`degraded` (some unit failed)/`starting`/`maintenance`. `degraded` is the normal state of a box that "holds but limps".' },
]

const translations = {
  pt: {
    title: 'Comandos systemd',
    intro: (
      <>
        <Text code>systemctl</Text>, <Text code>journalctl</Text> e os arquivos{' '}
        <Text code>.unit</Text> — o jeito systemd de gerenciar serviços em
        qualquer distro moderna (Ubuntu 16+, Debian 8+, Fedora, Arch...). O
        irmão que faltava ao lado dos cheat sheets de{' '}
        <Text code>docker</Text>/<Text code>kubectl</Text>: aqui é o init
        system e o log da própria máquina.
      </>
    ),
    search: 'Buscar por comando, opção ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no systemd',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>enable ≠ start.</Text>{' '}
          <Text code>enable</Text> liga no boot (cria o symlink de{' '}
          <Text code>WantedBy=</Text>), <Text code>start</Text> roda agora. O
          combo do dia a dia é <Text code>enable --now</Text>. E depois de
          mexer num <Text code>.service</Text>/<Text code>.timer</Text>:
          <Text code>daemon-reload</Text> pra memória do systemd atualizar.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>reload só se o unit tiver</Text>{' '}
          <Text code>ExecReload=</Text>. Nginx/webservers aceitam; app
          comum não — nesse caso é <Text code>restart</Text> mesmo, com o
          aviso de que cai a conexão.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>mask ≠ disable.</Text>{' '}
          <Text code>disable</Text> só tira do boot; <Text code>mask</Text>{' '}
          bloqueia até inicio por dependência. Para logs:{' '}
          <Text code>-u</Text> filtra por NOME DO UNIT, e janelas tipo{' '}
          <Text code>--since "10 min ago"</Text> valem ouro na investigação.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Timers:</Text> <Text code>Persistent=true</Text> roda
          o disparo perdido (máquina dormiu/desligada) e{' '}
          <Text code>AccuracySec</Text> deixa o systemd juntar os acordados —
          os dois mudam o comportamento de quem usa cron.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>O systemd é o PID 1:</Text> os rlimits que você seta
          no unit (<Text code>LimitNOFILE</Text>) valem pro serviço, seu{' '}
          <Text code>ulimit</Text> do shell não. E o boot-medido:{' '}
          <Text code>systemd-analyze blame</Text> acha na hora o que segura a
          inicialização.
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
    title: 'systemd Commands',
    intro: (
      <>
        <Text code>systemctl</Text>, <Text code>journalctl</Text> and{' '}
        <Text code>.unit</Text> files — the systemd way to manage services on
        any modern distro (Ubuntu 16+, Debian 8+, Fedora, Arch...). The
        sibling that was missing next to the <Text code>docker</Text>/{' '}
        <Text code>kubectl</Text> cheat sheets: here it's the init system and
        the machine's own logs.
      </>
    ),
    search: 'Search by command, option or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>enable ≠ start.</Text>{' '}
          <Text code>enable</Text> makes it boot (creates the{' '}
          <Text code>WantedBy=</Text> symlink), <Text code>start</Text> runs
          it now. The day-to-day combo is <Text code>enable --now</Text>. And
          after touching a <Text code>.service</Text>/<Text code>.timer</Text>:
          <Text code>daemon-reload</Text> so systemd's memory picks it up.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>reload only works when the unit has</Text>{' '}
          <Text code>ExecReload=</Text>. nginx/web servers accept it; a plain
          app does not — there it's <Text code>restart</Text>, dropping the
          connection.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>mask ≠ disable.</Text>{' '}
          <Text code>disable</Text> only un-enables boot; <Text code>mask</Text>{' '}
          blocks even dependency-driven starts. For logs:{' '}
          <Text code>-u</Text> filters by UNIT NAME, and windows like{' '}
          <Text code>--since "10 min ago"</Text> are gold during investigation.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Timers:</Text> <Text code>Persistent=true</Text> fires
          a missed trigger (machine slept/was off) and{' '}
          <Text code>AccuracySec</Text> lets systemd coalesce wake-ups — both
          change behavior in ways cron never did.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>systemd is PID 1:</Text> the rlimits you set in the
          unit (<Text code>LimitNOFILE</Text>) apply to the service, your
          shell's <Text code>ulimit</Text> does not. And measured boot:{' '}
          <Text code>systemd-analyze blame</Text> finds the startup bottleneck
          instantly.
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

export default function SystemdCheatsheetPage() {
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
    const header = '# systemd (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```bash',
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