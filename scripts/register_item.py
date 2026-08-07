#!/usr/bin/env python3
"""Registra um item novo no catálogo (tabela items do banco).

Uso: scripts/register_item.py '<rota>' '<titulo>'

Chame isto DEPOIS de confirmar que o item está no ar (build limpo, container
saudável, HTTP 200) — é o que faz o item aparecer no badge "Novo"/"New" (os
24 itens mais recentes por data de criação, ver src/hooks/useNewItemKeys.js).
"""
import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "devtools.db")


def main():
    if len(sys.argv) != 3:
        print("uso: register_item.py <rota> <titulo>", file=sys.stderr)
        sys.exit(1)

    route, title = sys.argv[1], sys.argv[2]
    if not route.startswith("/"):
        print(f"erro: rota deve começar com '/', recebi: {route!r}", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT OR IGNORE INTO items (key, title, created_at) VALUES (?, ?, datetime('now'))",
        (route, title),
    )
    conn.commit()
    conn.close()
    print(f"registrado: {route}")


if __name__ == "__main__":
    main()
