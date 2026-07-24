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

echo "$(date -Iseconds) — rodada concluída, log em $LOG_FILE" >> "$LOG_DIR/runs.log"
