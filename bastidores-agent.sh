#!/bin/bash
# Agente de bastidores do devtools — disparado via cron do usuário
# devtools-bot, 1x por dia à meia-noite (horário de Brasília). Só lê o git
# log das últimas 24h e registra um resumo em texto na tabela
# bastidores_entries (via scripts/register_bastidor.py), pra alimentar a
# página pública /bastidores. Não edita código, não builda, não commita —
# ver .agent-prompt-bastidores.md pro escopo completo.
set -uo pipefail

PROJECT_DIR="/home/devtools-bot/devtools"
OPENCODE_BIN="/home/devtools-bot/.local/bin/opencode"
MODEL="opencode-go/glm-5.2"

cd "$PROJECT_DIR" || exit 1

export HOME=/home/devtools-bot
export PATH="/home/devtools-bot/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

LOG_DIR="$PROJECT_DIR/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/bastidores_$(date +%Y-%m-%d_%H-%M-%S).log"

# Lock próprio — não disputa com o hourly-agent.sh, mas evita duas rodadas
# de bastidores sobrepostas se uma travar.
LOCK_FILE="$PROJECT_DIR/.bastidores-agent.lock"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "$(date -Iseconds) — rodada anterior de bastidores ainda rodando, pulando" >> "$LOG_DIR/runs.log"
    exit 0
fi

PROMPT="$(cat "$PROJECT_DIR/.agent-prompt-bastidores.md")"

ENTRIES_BEFORE="$(sqlite3 "$PROJECT_DIR/data/devtools.db" 'SELECT COUNT(*) FROM bastidores_entries;' 2>/dev/null || echo 0)"

# Rodada é só leitura + 1 insert no sqlite — bem mais rápida que uma rodada
# de conteúdo, mas mantém a mesma margem de segurança contra travamento do
# modelo (ver hourly-agent.sh).
timeout --signal=TERM --kill-after=30s 20m \
    "$OPENCODE_BIN" run --auto --dir "$PROJECT_DIR" -m "$MODEL" --title "devtools-bastidores-$(date +%Y%m%d-%H%M%S)" "$PROMPT" \
    > "$LOG_FILE" 2>&1
AGENT_EXIT=$?

ENTRIES_AFTER="$(sqlite3 "$PROJECT_DIR/data/devtools.db" 'SELECT COUNT(*) FROM bastidores_entries;' 2>/dev/null || echo 0)"

echo "$(date -Iseconds) — rodada de bastidores concluída (exit $AGENT_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

# Avisa por WhatsApp só se o comando falhou ou nenhuma entrada nova foi
# registrada (prova de que o agente não chamou register_bastidor.py) —
# igual à filosofia do hourly-agent.sh, silencioso quando dá tudo certo.
if [ "$AGENT_EXIT" -ne 0 ] || [ "$ENTRIES_AFTER" = "$ENTRIES_BEFORE" ]; then
    # shellcheck disable=SC1091
    source /home/devtools-bot/.notify-secrets
    INSTANCE_URL_ENC="${EVOLUTION_INSTANCE//+/%2B}"
    export EVOLUTION_NUMBER
    export TEXTO="⚠️ Agente de bastidores do devtools falhou (exit $AGENT_EXIT, entradas antes: $ENTRIES_BEFORE, depois: $ENTRIES_AFTER).

Últimas linhas do log:
$(tail -c 500 "$LOG_FILE")"

    BODY=$(python3 -c "
import json, os
print(json.dumps({'number': os.environ['EVOLUTION_NUMBER'], 'text': os.environ['TEXTO']}))
")
    curl -s -X POST "https://evo.eventifylab.com/message/sendText/$INSTANCE_URL_ENC" \
        -H "apikey: $EVOLUTION_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$BODY" > /dev/null
fi
