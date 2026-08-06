#!/bin/bash
# Agente do devtools — disparado via cron do usuário devtools-bot, de hora
# em hora. Só deve tocar em /home/devtools-bot/devtools (ver
# .agent-prompt.md pro escopo completo).
#
# Trocou de `claude -p` (nightly-agent.sh, 1x/dia) para `opencode run` com
# um modelo free (sem custo, sem sessão OAuth pra expirar) rodando de hora
# em hora, no máximo 1 item por rodada — ver .agent-prompt.md.
set -uo pipefail

PROJECT_DIR="/home/devtools-bot/devtools"
OPENCODE_BIN="/home/devtools-bot/.local/bin/opencode"
MODEL="opencode/deepseek-v4-flash-free"

cd "$PROJECT_DIR" || exit 1

export HOME=/home/devtools-bot
export PATH="/home/devtools-bot/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

LOG_DIR="$PROJECT_DIR/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M-%S).log"

# Evita rodadas sobrepostas caso uma rodada demore mais que 1h.
LOCK_FILE="$PROJECT_DIR/.hourly-agent.lock"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "$(date -Iseconds) — rodada anterior ainda rodando, pulando esta hora" >> "$LOG_DIR/runs.log"
    exit 0
fi

# Zera o selo "Novo"/"New" uma vez por dia, na primeira rodada depois da
# meia-noite de Brasília — o agente só acrescenta ao array durante o dia,
# nunca decide sozinho quando resetar (ver .agent-prompt.md).
TODAY_BRT="$(TZ=America/Sao_Paulo date +%F)"
BADGE_DAY_FILE="$PROJECT_DIR/.new-badge-day"
LAST_BADGE_DAY="$(cat "$BADGE_DAY_FILE" 2>/dev/null || echo '')"
if [ "$TODAY_BRT" != "$LAST_BADGE_DAY" ]; then
    printf 'export const NEW_ITEM_KEYS = []\n' > "$PROJECT_DIR/src/newItems.js"
    echo "$TODAY_BRT" > "$BADGE_DAY_FILE"
    echo "$(date -Iseconds) — selo Novo/New zerado (novo dia BRT: $TODAY_BRT)" >> "$LOG_DIR/runs.log"
fi

PROMPT="$(cat "$PROJECT_DIR/.agent-prompt.md")"

"$OPENCODE_BIN" run --auto --dir "$PROJECT_DIR" -m "$MODEL" --title "devtools-hourly-$(date +%Y%m%d-%H%M%S)" "$PROMPT" \
    > "$LOG_FILE" 2>&1
AGENT_EXIT=$?

echo "$(date -Iseconds) — rodada concluída (exit $AGENT_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

# Avisa por WhatsApp só se algo real quebrou (comando falhou, ex.: erro do
# provider, ou o container caiu depois da rodada). O agente decidir não
# adicionar nada nessa rodada é normal, não dispara alerta.
CONTAINER_UP=$(docker ps --filter "name=DK_DEVTOOLS" --filter "status=running" -q)
if [ "$AGENT_EXIT" -ne 0 ] || [ -z "$CONTAINER_UP" ]; then
    # shellcheck disable=SC1091
    source /home/devtools-bot/.notify-secrets
    INSTANCE_URL_ENC="${EVOLUTION_INSTANCE//+/%2B}"
    export EVOLUTION_NUMBER
    export TEXTO="⚠️ Agente do devtools falhou (exit $AGENT_EXIT, container up: $([ -n "$CONTAINER_UP" ] && echo sim || echo não)).

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
