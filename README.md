# devtools

Espaço genérico pra ferramentas internas de desenvolvimento. Cresce sozinho:
um agente autônomo roda a cada 15 minutos adicionando/corrigindo ferramentas,
e outro resume o dia à meia-noite em [/bastidores](https://devtools.eventifylab.com/bastidores).

- **Stack**: React 18 + Vite + React Router v7 + Ant Design v5 + TanStack Query v5
- **URL**: https://devtools.eventifylab.com
- **API própria**: `api/` (Node/Express + SQLite via better-sqlite3), container `DK_DEVTOOLS_API`, proxiada em `/api/*` pelo nginx do container do frontend. Cuida do catálogo de itens, reports de bug, contagem de visitas e o feed de `/bastidores`.

## Rodando localmente

```bash
npm install
npm run dev
```

## Deploy

```bash
cd /home/devtools-bot/devtools
docker compose up -d --build
```

Container: `DK_DEVTOOLS` (porta 80 interna, só acessível via rede Docker — o Caddy expõe pra fora) + `DK_DEVTOOLS_API` (porta 3001 interna).

Config do Caddy: `/root/docker-base/caddy_config/sites/devtools.caddy`

## CI e sync com o GitHub

Todo PR contra `master` roda o workflow `.github/workflows/ci.yml` (build do
frontend + instalação/validação da API). Um sync diário (1h BRT) abre PR com
os commits do dia e só faz merge automático se esse check passar.
