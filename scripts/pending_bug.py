#!/usr/bin/env python3
"""Imprime o bug pendente mais antigo, ou 'NONE' se não houver nenhum.

Uso interno do hourly-agent.sh, pra decidir se a rodada vira uma rodada de
correção de bug em vez de geração de conteúdo. Não é chamado pelo agente IA.

Saída (3 linhas, só quando existe bug pendente): id / item_key / description
em base64 — base64 pra description sobreviver inteira (pode ter quebra de
linha, aspas etc.) ao ser lida linha a linha do lado do bash.
"""
import base64
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "devtools.db")


def main():
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT id, item_key, description FROM bugs WHERE status = 'pending' "
        "ORDER BY created_at ASC LIMIT 1"
    ).fetchone()
    conn.close()

    if row is None:
        print("NONE")
        return

    bug_id, item_key, description = row
    print(bug_id)
    print(item_key)
    print(base64.b64encode(description.encode()).decode())


if __name__ == "__main__":
    main()
