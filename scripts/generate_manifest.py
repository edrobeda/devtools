#!/usr/bin/env python3
"""Gera manifest.xml: catálogo de todas as páginas do devtools, com rota,
categoria e uma descrição curta do que cada uma faz.

Determinístico (regex sobre o código-fonte, nenhuma chamada de modelo) —
roda em menos de 1s, então tanto `hourly-agent.sh` quanto `organizer-agent.sh`
chamam isto de novo no início de cada rodada, antes de montar o prompt.
Substitui a releitura do `CHANGELOG.md` inteiro como fonte de verdade sobre
o que já existe: o changelog é histórico narrativo (pode ficar incompleto
ou repetitivo), o manifest é extraído direto de `routes.jsx`/`src/pages/`.

Uso: scripts/generate_manifest.py
Saída: manifest.xml na raiz do projeto (gitignored — é sempre regenerado).
"""
import os
import re
from datetime import datetime, timezone
from xml.sax.saxutils import escape

ROOT = os.path.join(os.path.dirname(__file__), "..")
ROUTES_FILE = os.path.join(ROOT, "src", "routes.jsx")
PAGES_DIR = os.path.join(ROOT, "src", "pages")
OUTPUT_FILE = os.path.join(ROOT, "manifest.xml")

ROUTE_RE = re.compile(r"\{\s*path:\s*['\"]([^'\"]+)['\"]\s*,\s*element:\s*<(\w+)\s*/>\s*\}")
TITLE_RE = re.compile(r"title:\s*['\"]([^'\"]+)['\"]")
INTRO_RE = re.compile(r"intro:\s*(.*?)(?=\n\s{4}\w[\w]*:|\n\s{2}\},)", re.DOTALL)


def extract_description(text):
    text = text.strip()
    text = re.sub(r"</?>", " ", text)  # fragmentos JSX (<>...</>)
    text = re.sub(r"<[^>]+>", " ", text)  # demais tags (<Text code>...)
    text = re.sub(r"\{'\s*'\}", " ", text)  # `{' '}` (espaço explícito em JSX)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.strip("(),")  # parênteses/vírgula de wrapper JSX sobrando nas bordas
    text = text.strip()
    if len(text) >= 2 and text[0] in "'\"" and text[-1] in "'\"":
        text = text[1:-1].strip()
    text = text.replace("\\'", "'").replace('\\"', '"')
    text = text.strip("(), ")
    if len(text) > 240:
        text = text[:237].rsplit(" ", 1)[0] + "..."
    return text


def main():
    with open(ROUTES_FILE, encoding="utf-8") as f:
        routes_src = f.read()

    entries = []
    missing_files = []
    for path, component in ROUTE_RE.findall(routes_src):
        if path in ("bastidores",) or path == "*" or component == "NotFoundPage":
            continue
        page_file = os.path.join(PAGES_DIR, f"{component}.jsx")
        if not os.path.isfile(page_file):
            missing_files.append(component)
            continue
        with open(page_file, encoding="utf-8") as f:
            page_src = f.read()

        title_match = TITLE_RE.search(page_src)
        title = title_match.group(1) if title_match else component

        intro_match = INTRO_RE.search(page_src)
        description = extract_description(intro_match.group(1)) if intro_match else ""

        category = path.split("/")[0] if "/" in path else path
        entries.append((path, category, title, description))

    entries.sort(key=lambda e: e[0])

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<!-- Gerado automaticamente por scripts/generate_manifest.py — NÃO editar à mão, é regerado a cada rodada de agente. -->",
        f'<pages generated_at="{now}" count="{len(entries)}">',
    ]
    for path, category, title, description in entries:
        lines.append(
            f'  <page route="/{escape(path)}" category="{escape(category)}" title="{escape(title)}">{escape(description)}</page>'
        )
    lines.append("</pages>")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"manifest.xml gerado: {len(entries)} páginas")
    if missing_files:
        print(f"aviso: {len(missing_files)} componente(s) em routes.jsx sem arquivo em src/pages/: {missing_files}")


if __name__ == "__main__":
    main()
