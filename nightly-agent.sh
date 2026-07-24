#!/bin/bash
# Agente noturno autônomo do devtools — disparado via cron do usuário
# devtools-bot às 00:00. Só deve tocar em /home/devtools-bot/devtools
# (ver .agent-prompt.md pro escopo completo).
set -uo pipefail

cd /home/devtools-bot/devtools || exit 1

LOG_DIR="/home/devtools-bot/devtools/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M-%S).log"

PROMPT="$(cat /home/devtools-bot/devtools/.agent-prompt.md)"

/home/devtools-bot/.local/bin/claude -p "$PROMPT" \
    --model claude-sonnet-5 \
    --effort high \
    --allow-dangerously-skip-permissions \
    --permission-mode bypassPermissions \
    > "$LOG_FILE" 2>&1
CLAUDE_EXIT=$?

echo "$(date -Iseconds) — rodada concluída (exit $CLAUDE_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

# Avisa por WhatsApp só se algo real quebrou (comando falhou, ex.: login
# expirado, ou o container caiu depois da rodada). O agente decidir não
# adicionar nada nessa rodada é normal, não dispara alerta.
CONTAINER_UP=$(docker ps --filter "name=DK_DEVTOOLS" --filter "status=running" -q)
if [ "$CLAUDE_EXIT" -ne 0 ] || [ -z "$CONTAINER_UP" ]; then
    # shellcheck disable=SC1091
    source /home/devtools-bot/.notify-secrets
    INSTANCE_URL_ENC="${EVOLUTION_INSTANCE//+/%2B}"
    export EVOLUTION_NUMBER
    export TEXTO="⚠️ Agente noturno do devtools falhou (exit $CLAUDE_EXIT, container up: $([ -n "$CONTAINER_UP" ] && echo sim || echo não)).

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
