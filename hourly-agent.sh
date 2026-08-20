#!/bin/bash
# Agente do devtools — disparado via cron do usuário devtools-bot, a cada 3
# horas. Só deve tocar em /home/devtools-bot/devtools (ver .agent-prompt.md /
# .agent-prompt-bugfix.md / .agent-prompt-housekeeping.md pro escopo
# completo). O organizer-agent.sh roda entre estas rodadas, só analisando e
# alimentando a fila de housekeeping — nunca edita nada.
#
# Roda `opencode run` com um modelo free (sem custo, sem sessão OAuth pra
# expirar). Cada rodada é UMA das três coisas, nunca mais de uma:
#   - se existe bug pendente (tabela `bugs`), corrige só esse bug
#     (.agent-prompt-bugfix.md) — prioridade máxima;
#   - senão, se existe achado de organização pendente (tabela
#     `housekeeping`, alimentada pelo organizer-agent.sh), resolve só esse
#     achado (.agent-prompt-housekeeping.md);
#   - senão, roda de conteúdo normal (.agent-prompt.md), no máximo 1 item.
set -uo pipefail

PROJECT_DIR="/home/devtools-bot/devtools"
OPENCODE_BIN="/home/devtools-bot/.local/bin/opencode"
MODEL="opencode/nemotron-3.5-lightning-free"

cd "$PROJECT_DIR" || exit 1

export HOME=/home/devtools-bot
export PATH="/home/devtools-bot/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

LOG_DIR="$PROJECT_DIR/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M-%S).log"

# Evita rodadas sobrepostas caso uma rodada demore mais que o intervalo do cron.
LOCK_FILE="$PROJECT_DIR/.hourly-agent.lock"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "$(date -Iseconds) — rodada anterior ainda rodando, pulando esta rodada" >> "$LOG_DIR/runs.log"
    exit 0
fi

# Manifest sempre fresco antes de montar qualquer prompt — barato (<1s),
# determinístico, sem chamada de modelo. Ver scripts/generate_manifest.py.
python3 "$PROJECT_DIR/scripts/generate_manifest.py" >> "$LOG_DIR/runs.log" 2>&1

# Checa bug pendente ANTES de decidir o prompt — ver scripts/pending_bug.py.
mapfile -t BUG_LINES < <(python3 "$PROJECT_DIR/scripts/pending_bug.py")
mapfile -t HOUSEKEEPING_LINES < <(python3 "$PROJECT_DIR/scripts/pending_housekeeping.py")

if [ "${BUG_LINES[0]:-NONE}" != "NONE" ]; then
    ROUND_KIND="bugfix"
    BUG_ID="${BUG_LINES[0]}"
    BUG_ITEM_KEY="${BUG_LINES[1]}"
    BUG_DESCRIPTION="$(printf '%s' "${BUG_LINES[2]}" | base64 -d)"

    PROMPT="$(ITEM_KEY="$BUG_ITEM_KEY" BUG_DESCRIPTION="$BUG_DESCRIPTION" python3 - "$PROJECT_DIR/.agent-prompt-bugfix.md" <<'PYEOF'
import os
import sys

with open(sys.argv[1], encoding="utf-8") as f:
    template = f.read()

print(
    template
    .replace("{{ITEM_KEY}}", os.environ["ITEM_KEY"])
    .replace("{{BUG_DESCRIPTION}}", os.environ["BUG_DESCRIPTION"])
)
PYEOF
)"
    echo "$(date -Iseconds) — rodada de bugfix (bug #$BUG_ID, $BUG_ITEM_KEY)" >> "$LOG_DIR/runs.log"
elif [ "${HOUSEKEEPING_LINES[0]:-NONE}" != "NONE" ]; then
    ROUND_KIND="housekeeping"
    HOUSEKEEPING_ID="${HOUSEKEEPING_LINES[0]}"
    HOUSEKEEPING_ROUTES="${HOUSEKEEPING_LINES[1]}"
    HOUSEKEEPING_DESCRIPTION="$(printf '%s' "${HOUSEKEEPING_LINES[2]}" | base64 -d)"

    PROMPT="$(ROUTES="$HOUSEKEEPING_ROUTES" HOUSEKEEPING_DESCRIPTION="$HOUSEKEEPING_DESCRIPTION" python3 - "$PROJECT_DIR/.agent-prompt-housekeeping.md" <<'PYEOF'
import os
import sys

with open(sys.argv[1], encoding="utf-8") as f:
    template = f.read()

print(
    template
    .replace("{{ROUTES}}", os.environ["ROUTES"])
    .replace("{{HOUSEKEEPING_DESCRIPTION}}", os.environ["HOUSEKEEPING_DESCRIPTION"])
)
PYEOF
)"
    echo "$(date -Iseconds) — rodada de housekeeping (achado #$HOUSEKEEPING_ID, $HOUSEKEEPING_ROUTES)" >> "$LOG_DIR/runs.log"
else
    ROUND_KIND="content"
    PROMPT="$(cat "$PROJECT_DIR/.agent-prompt.md")"
fi

HEAD_BEFORE="$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null)"

# O modelo free às vezes trava a chamada sem retornar nada (visto 2x em
# 2026-08-10: processo ficava horas parado, sem filhos, sem log novo,
# segurando o lock e travando toda rodada seguinte). Rodadas normais levam
# 15-40min — 45min de margem + SIGKILL depois de 30s se o TERM não bastar.
timeout --signal=TERM --kill-after=30s 45m \
    "$OPENCODE_BIN" run --auto --dir "$PROJECT_DIR" -m "$MODEL" --title "devtools-hourly-$(date +%Y%m%d-%H%M%S)" "$PROMPT" \
    > "$LOG_FILE" 2>&1
AGENT_EXIT=$?

HEAD_AFTER="$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null)"

echo "$(date -Iseconds) — rodada concluída ($ROUND_KIND, exit $AGENT_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

# Sem commit novo = sem prova de que a rodada terminou com sucesso, então
# qualquer mudança que tenha ficado no working tree é lixo de uma rodada
# incompleta. O prompt já pede pro agente se auto-limpar antes de terminar,
# mas o processo às vezes é cortado no meio por um erro do provider (visto
# 2026-08-20: "Streaming response failed: 502 Upstream error") sem chance
# de rodar esse passo — então o wrapper garante o reset de qualquer jeito,
# senão a rodada seguinte começa de um working tree sujo e alheio.
if [ "$HEAD_BEFORE" = "$HEAD_AFTER" ] && [ -n "$(git -C "$PROJECT_DIR" status --porcelain)" ]; then
    git -C "$PROJECT_DIR" checkout -- .
    git -C "$PROJECT_DIR" clean -fd
    echo "$(date -Iseconds) — rodada sem commit deixou o working tree sujo, resetado" >> "$LOG_DIR/runs.log"
fi

CONTAINER_UP=$(docker ps --filter "name=DK_DEVTOOLS" --filter "status=running" -q)

# Só apaga a flag de bug se: rodada era de bugfix, o opencode saiu com
# sucesso, o container está de pé, E rolou um commit novo (prova de que algo
# realmente mudou — o agente é instruído a não commitar se não conseguir
# corrigir com confiança). Sem isso, o bug continua pendente e a próxima
# rodada tenta de novo.
if [ "$ROUND_KIND" = "bugfix" ] && [ "$AGENT_EXIT" -eq 0 ] && [ -n "$CONTAINER_UP" ] && [ "$HEAD_BEFORE" != "$HEAD_AFTER" ]; then
    python3 "$PROJECT_DIR/scripts/resolve_bug.py" "$BUG_ID" >> "$LOG_DIR/runs.log" 2>&1
fi

# Mesma lógica acima, pro achado de organização: só marca resolvido com
# prova de commit real (senão a rodada seguinte tenta de novo).
if [ "$ROUND_KIND" = "housekeeping" ] && [ "$AGENT_EXIT" -eq 0 ] && [ -n "$CONTAINER_UP" ] && [ "$HEAD_BEFORE" != "$HEAD_AFTER" ]; then
    python3 "$PROJECT_DIR/scripts/resolve_housekeeping.py" "$HOUSEKEEPING_ID" >> "$LOG_DIR/runs.log" 2>&1
fi

# Avisa por WhatsApp só se algo real quebrou (comando falhou, ex.: erro do
# provider, ou o container caiu depois da rodada). O agente decidir não
# adicionar nada ou não conseguir corrigir o bug nesta rodada é normal, não
# dispara alerta.
if [ "$AGENT_EXIT" -ne 0 ] || [ -z "$CONTAINER_UP" ]; then
    # shellcheck disable=SC1091
    source /home/devtools-bot/.notify-secrets
    INSTANCE_URL_ENC="${EVOLUTION_INSTANCE//+/%2B}"
    export EVOLUTION_NUMBER
    export TEXTO="⚠️ Agente do devtools falhou (rodada $ROUND_KIND, exit $AGENT_EXIT, container up: $([ -n "$CONTAINER_UP" ] && echo sim || echo não)).

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
