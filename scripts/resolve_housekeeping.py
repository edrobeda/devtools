#!/usr/bin/env python3
"""Marca um achado de organização como resolvido.

Uso: scripts/resolve_housekeeping.py <id>

Chamado pelo hourly-agent.sh só depois que a rodada de arrumação terminou
com sucesso (build limpo, container saudável, HEAD do git mudou) — se
falhar, o achado continua 'pending' e uma rodada futura tenta de novo.
"""
import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "devtools.db")


def main():
    if len(sys.argv) != 2:
        print("uso: resolve_housekeeping.py <id>", file=sys.stderr)
        sys.exit(1)

    finding_id = int(sys.argv[1])
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE housekeeping SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?",
        (finding_id,),
    )
    conn.commit()
    conn.close()
    print(f"achado {finding_id} marcado como resolvido")


if __name__ == "__main__":
    main()
