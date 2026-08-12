#!/usr/bin/env python3
"""Registra uma entrada no feed de /bastidores (tabela bastidores_entries).

Uso: scripts/register_bastidor.py '<resumo>'

Chamado pelo bastidores-agent.sh (rodada de 00:00 BRT) — o agente lê o que
mudou no dia (git log, CHANGELOG.md) e escreve UM resumo em texto corrido
pra registrar aqui. Não editar código nesta rodada, só chamar este script.
"""
import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "devtools.db")


def main():
    if len(sys.argv) != 2:
        print("uso: register_bastidor.py <resumo>", file=sys.stderr)
        sys.exit(1)

    summary = sys.argv[1].strip()
    if not summary:
        print("erro: resumo vazio", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO bastidores_entries (summary, created_at) VALUES (?, datetime('now'))",
        (summary,),
    )
    conn.commit()
    conn.close()
    print("registrado no feed de bastidores")


if __name__ == "__main__":
    main()
