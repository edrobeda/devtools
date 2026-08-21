#!/usr/bin/env python3
"""Imprime o achado de organização pendente mais antigo, ou 'NONE'.

Uso interno do hourly-agent.sh, pra decidir se a rodada vira uma rodada de
arrumação (depois de checar que não há bug pendente, que tem prioridade
maior). Não é chamado pelo agente IA.

Saída (3 linhas, só quando existe achado pendente): id / rotas / descrição
em base64 (mesma razão do pending_bug.py: sobreviver inteira, com qualquer
caractere, ao ser lida linha a linha do lado do bash).
"""
import base64
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "devtools.db")


def main():
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT id, routes, description FROM housekeeping WHERE status = 'pending' "
        "ORDER BY created_at ASC LIMIT 1"
    ).fetchone()
    conn.close()

    if row is None:
        print("NONE")
        return

    finding_id, routes, description = row
    print(finding_id)
    print(routes)
    print(base64.b64encode(description.encode()).decode())


if __name__ == "__main__":
    main()
