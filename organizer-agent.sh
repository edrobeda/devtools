#!/bin/bash
# Agente organizador do devtools — disparado via cron do usuário
# devtools-bot, a cada 3 horas, sempre entre duas rodadas do agente de
# conteúdo (hourly-agent.sh). Só analisa o catálogo (via manifest.xml,
# regenerado no início desta rodada) e registra achados de
# duplicação/desorganização na tabela `housekeeping` — nunca edita código,
# nunca builda, nunca commita. Ver .agent-prompt-organizer.md pro escopo
# completo. O hourly-agent.sh resolve os achados um de cada vez, com
# prioridade só abaixo de bug reportado.
set -uo pipefail

PROJECT_DIR="/home/devtools-bot/devtools"
OPENCODE_BIN="/home/devtools-bot/.local/bin/opencode"
MODEL="opencode-go/glm-5.2"

cd "$PROJECT_DIR" || exit 1

export HOME=/home/devtools-bot
export PATH="/home/devtools-bot/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

LOG_DIR="$PROJECT_DIR/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/organizer_$(date +%Y-%m-%d_%H-%M-%S).log"

# Lock próprio — não disputa com o hourly-agent.sh nem o bastidores-agent.sh,
# só evita duas rodadas de organizer sobrepostas se uma travar.
LOCK_FILE="$PROJECT_DIR/.organizer-agent.lock"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "$(date -Iseconds) — rodada anterior de organizer ainda rodando, pulando" >> "$LOG_DIR/runs.log"
    exit 0
fi

# Manifest sempre fresco antes da análise — barato (<1s), determinístico.
python3 "$PROJECT_DIR/scripts/generate_manifest.py" >> "$LOG_DIR/runs.log" 2>&1

PROMPT="$(cat "$PROJECT_DIR/.agent-prompt-organizer.md")"

FINDINGS_BEFORE="$(sqlite3 "$PROJECT_DIR/data/devtools.db" 'SELECT COUNT(*) FROM housekeeping;' 2>/dev/null || echo 0)"

# Rodada é só leitura + no máximo 1 insert no sqlite — mesma margem de
# segurança contra travamento do modelo que os outros agentes (ver
# hourly-agent.sh), mas com timeout menor por ser um trabalho mais leve.
timeout --signal=TERM --kill-after=30s 20m \
    "$OPENCODE_BIN" run --auto --dir "$PROJECT_DIR" -m "$MODEL" --title "devtools-organizer-$(date +%Y%m%d-%H%M%S)" "$PROMPT" \
    > "$LOG_FILE" 2>&1
AGENT_EXIT=$?

FINDINGS_AFTER="$(sqlite3 "$PROJECT_DIR/data/devtools.db" 'SELECT COUNT(*) FROM housekeeping;' 2>/dev/null || echo 0)"

echo "$(date -Iseconds) — rodada de organizer concluída (exit $AGENT_EXIT, achados antes: $FINDINGS_BEFORE, depois: $FINDINGS_AFTER), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

# Avisa por WhatsApp só se o comando falhou — diferente do bastidores-agent,
# aqui 0 achados novos é o resultado normal e esperado na maioria das
# rodadas (não é prova de falha), então não dispara alerta sozinho.
if [ "$AGENT_EXIT" -ne 0 ]; then
    # shellcheck disable=SC1091
    source /home/devtools-bot/.notify-secrets
    INSTANCE_URL_ENC="${EVOLUTION_INSTANCE//+/%2B}"
    export EVOLUTION_NUMBER
    export TEXTO="⚠️ Agente organizador do devtools falhou (exit $AGENT_EXIT).

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
