# devtools

Espaço genérico pra ferramentas internas de desenvolvimento.

- **Stack**: React 18 + Vite + React Router v7 + Ant Design v5 + TanStack Query v5
- **URL**: https://devtools.eventifylab.com
- **API**: se alguma ferramenta aqui precisar de backend, o endpoint entra no `manager-api` compartilhado (`/root/manager-api`), não em um backend próprio deste projeto.

## Rodando localmente

```bash
npm install
npm run dev
```

## Deploy

```bash
cd /root/devtools
docker compose up -d --build
```

Container: `DK_DEVTOOLS` (porta 80 interna, só acessível via rede Docker — o Caddy expõe pra fora).

Config do Caddy: `/root/docker-base/caddy_config/sites/devtools.caddy`
