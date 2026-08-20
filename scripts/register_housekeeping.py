#!/usr/bin/env python3
"""Registra um achado de organização (tabela housekeeping do banco).

Uso: scripts/register_housekeeping.py '<rota1,rota2,...>' '<descrição>'

Chamado pelo organizer-agent.sh quando encontra duplicação real ou
desorganização entre páginas — rotas separadas por vírgula (sem espaço) e
uma descrição do problema + o que sugere fazer (merge, mover de categoria,
renomear). Fica pendente até o hourly-agent.sh resolver numa rodada futura.
"""
import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "devtools.db")


def main():
    if len(sys.argv) != 3:
        print("uso: register_housekeeping.py <rota1,rota2,...> <descrição>", file=sys.stderr)
        sys.exit(1)

    routes, description = sys.argv[1].strip(), sys.argv[2].strip()
    if not routes or not all(r.strip().startswith("/") for r in routes.split(",")):
        print(f"erro: rotas devem começar com '/', recebi: {routes!r}", file=sys.stderr)
        sys.exit(1)
    if not description:
        print("erro: descrição vazia", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO housekeeping (routes, description) VALUES (?, ?)",
        (routes, description),
    )
    conn.commit()
    conn.close()
    print(f"registrado: {routes}")


if __name__ == "__main__":
    main()
