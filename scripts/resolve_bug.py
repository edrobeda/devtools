#!/usr/bin/env python3
"""Marca um bug como resolvido (apaga a flag de pendente).

Uso: scripts/resolve_bug.py <id>

Chamado pelo hourly-agent.sh só depois que a rodada de correção terminou
com sucesso (build limpo, container saudável) — se a correção falhar, o bug
continua 'pending' e a próxima rodada tenta de novo.
"""
import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "devtools.db")


def main():
    if len(sys.argv) != 2:
        print("uso: resolve_bug.py <id>", file=sys.stderr)
        sys.exit(1)

    bug_id = int(sys.argv[1])
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE bugs SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?",
        (bug_id,),
    )
    conn.commit()
    conn.close()
    print(f"bug {bug_id} marcado como resolvido")


if __name__ == "__main__":
    main()
