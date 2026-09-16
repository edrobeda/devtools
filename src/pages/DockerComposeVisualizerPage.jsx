import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Collapse, Tag, Table, Empty, message } from 'antd'
import {
  ContainerOutlined,
  CopyOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseYaml } from '../utils/yamlFormatter'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Constantes de desenho do grafo ─────────────────────────────
const NODE_W = 260
const NODE_H = 112
const COL_W = 340
const ROW_H = 150
const PAD = 40
const NODE_COLORS = ['#1677ff', '#722ed1', '#13c2c2', '#fa8c16', '#52c41a', '#eb2f96', '#faad14', '#2f54eb']

// ─── Helpers de normalização ────────────────────────────────────
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function fmtValue(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function toList(v) {
  if (v === null || v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

// Portas: string "8080:80", objeto {published,target} (compose v3) ou o
// quirk do parser "8080:80" → {"8080": 80}. Todos viram "host:container".
function toPortStrings(raw) {
  return toList(raw)
    .map((p) => {
      if (typeof p !== 'object' || p === null) return String(p)
      const keys = Object.keys(p)
      if (keys.length === 1) return `${keys[0]}:${fmtValue(p[keys[0]])}`
      const ext = p.published ?? p.host ?? p.external
      const int = p.target ?? p.container ?? p.internal
      if (ext !== undefined && int !== undefined) return `${ext}:${int}`
      return Object.entries(p).map(([k, val]) => `${k}=${fmtValue(val)}`).join(', ')
    })
    .filter(Boolean)
}

// Volumes: string, objeto {source,target,read_only} ou o quirk do parser
// "src:dest:mode" → {"src": "dest:mode"}. Reconstrução: {src} + ":" + valor.
function toVolumeStrings(raw) {
  return toList(raw)
    .map((v) => {
      if (typeof v !== 'object' || v === null) return String(v)
      const keys = Object.keys(v)
      if (keys.length === 1) return `${keys[0]}:${fmtValue(v[keys[0]])}`
      if (v.source !== undefined && v.target !== undefined) {
        return `${v.source}:${v.target}${v.read_only || v.readOnly ? ':ro' : ''}`
      }
      return Object.entries(v).map(([k, val]) => `${k}=${fmtValue(val)}`).join(', ')
    })
    .filter(Boolean)
}

// environment: mapa {KEY: valor} ou lista ["KEY=val", "KEY"]. O quirk do
// parser em "KEY=val:com:dois" → {"KEY=val": "com:dois"} — a junção com ":"
// reconstrói o valor original. Só dispara quando a chave contém "=".
function toEnvPairs(raw) {
  if (isPlainObject(raw)) {
    return Object.entries(raw).map(([k, v]) =>
      v === null || v === undefined ? k : `${k}=${fmtValue(v)}`
    )
  }
  return toList(raw)
    .map((e) => {
      if (typeof e !== 'object' || e === null) return String(e)
      const keys = Object.keys(e)
      if (keys.length === 1) return `${keys[0]}:${fmtValue(e[keys[0]])}`
      return Object.entries(e).map(([k, val]) => `${k}=${fmtValue(val)}`).join(', ')
    })
    .filter(Boolean)
}

// depends_on: lista ["db"] ou mapa {db: {condition}} — sempre vira array
// {name, condition}. `links` (legado) é tratado da mesma forma.
function toDependsOn(raw) {
  const deps = []
  if (isPlainObject(raw)) {
    for (const [name, cfg] of Object.entries(raw)) {
      deps.push({ name, condition: isPlainObject(cfg) && cfg.condition ? String(cfg.condition) : 'service_started' })
    }
  } else {
    for (const item of toList(raw)) {
      if (typeof item === 'string') {
        deps.push({ name: item, condition: 'service_started' })
      } else if (isPlainObject(item)) {
        for (const [name, cfg] of Object.entries(item)) {
          deps.push({ name, condition: isPlainObject(cfg) && cfg.condition ? String(cfg.condition) : 'service_started' })
        }
      } else if (item !== null && item !== undefined) {
        deps.push({ name: String(item), condition: 'service_started' })
      }
    }
  }
  return deps
}

function toNetworkList(raw) {
  if (isPlainObject(raw)) return Object.keys(raw)
  return toList(raw)
    .map((n) => (isPlainObject(n) ? Object.keys(n)[0] : String(n)))
    .filter(Boolean)
}

function countOf(v) {
  return isPlainObject(v) ? Object.keys(v).length : toList(v).length
}

function imageLabel(s) {
  if (s.imageRaw) return String(s.imageRaw)
  if (s.buildRaw) {
    if (typeof s.buildRaw === 'string') return `build: ${s.buildRaw}`
    const ctx = s.buildRaw.context || '.'
    const df = s.buildRaw.dockerfile ? ` (${s.buildRaw.dockerfile})` : ''
    return `build: ${ctx}${df}`
  }
  return ''
}

// ─── Análise do arquivo ─────────────────────────────────────────
function analyzeCompose(text) {
  if (!text.trim()) return { result: { services: [], warnings: [], networks: [], volumes: [] }, parseError: null }
  const parsed = parseYaml(text)
  if (!parsed.ok) return { result: { services: [], warnings: [], networks: [], volumes: [] }, parseError: { error: parsed.error, line: parsed.line, col: parsed.col } }

  const doc = parsed.value
  if (!doc || !isPlainObject(doc)) return { result: { services: [], warnings: [], networks: [], volumes: [] }, parseError: null }

  const rawServices = isPlainObject(doc.services) ? doc.services : {}
  const names = Object.keys(rawServices)

  const services = names
    .map((name) => {
      const s = rawServices[name]
      if (!isPlainObject(s)) return null
      const deps = toDependsOn(s.depends_on ?? s.links)
      const envFiles = toList(s.env_file).map(String)
      return {
        name,
        imageRaw: s.image,
        buildRaw: s.build,
        depends: deps,
        ports: toPortStrings(s.ports),
        expose: toList(s.expose).map(String),
        volumes: toVolumeStrings(s.volumes),
        networks: toNetworkList(s.networks),
        env: toEnvPairs(s.environment),
        envFiles,
        restart: s.restart ? String(s.restart) : '',
        containerName: s.container_name ? String(s.container_name) : '',
        command: s.command ? String(s.command) : '',
        profiles: toList(s.profiles).map(String),
        labels: countOf(s.labels),
        secrets: countOf(s.secrets),
        configs: countOf(s.configs),
        replicas: isPlainObject(s.deploy) && s.deploy.replicas != null ? s.deploy.replicas : null,
      }
    })
    .filter(Boolean)

  const nameSet = new Set(services.map((s) => s.name))

  const warnings = []
  for (const s of services) {
    if (!s.imageRaw && !s.buildRaw) warnings.push({ type: 'no-image', svc: s.name })
    for (const d of s.depends) {
      if (!nameSet.has(d.name)) warnings.push({ type: 'missing-dep', svc: s.name, target: d.name })
    }
  }
  const seenPorts = new Map()
  for (const s of services) {
    for (const p of s.ports) {
      const host = String(p).split('/')[0].split(':')[0]
      if (host && seenPorts.has(host)) {
        warnings.push({ type: 'port-conflict', svc: s.name, other: seenPorts.get(host), port: host })
      } else if (host) {
        seenPorts.set(host, s.name)
      }
    }
  }
  for (const cycle of findCycles(services)) {
    warnings.push({ type: 'cycle', path: cycle.join(' → ') })
  }

  const networks = isPlainObject(doc.networks) ? Object.keys(doc.networks) : []
  const volumes = isPlainObject(doc.volumes) ? Object.keys(doc.volumes) : []

  return {
    parseError: null,
    result: {
      services,
      warnings,
      networks,
      volumes,
      version: doc.version ? String(doc.version) : '',
      name: doc.name ? String(doc.name) : '',
    },
  }
}

// ─── Detecção de ciclos (DFS com cores, sem dependência externa) ─
function findCycles(services) {
  const adj = new Map(services.map((s) => [s.name, s.depends.filter((d) => d.name !== s.name).map((d) => d.name)]))
  const state = new Map()
  const stack = []
  const seen = new Set()
  const cycles = []

  function dfs(u) {
    state.set(u, 1)
    stack.push(u)
    for (const v of adj.get(u) || []) {
      if (!state.has(v)) dfs(v)
      else if (state.get(v) === 1) {
        const idx = stack.indexOf(v)
        if (idx >= 0) {
          const cycle = stack.slice(idx)
          const key = [...cycle].sort().join('|')
          if (!seen.has(key)) {
            seen.add(key)
            cycles.push([...cycle])
          }
        }
      }
    }
    stack.pop()
    state.set(u, 2)
  }

  for (const s of services) if (!state.has(s.name)) dfs(s.name)
  for (const s of services) {
    if (s.depends.some((d) => d.name === s.name)) cycles.push([s.name, s.name])
  }
  return cycles
}

// ─── Layout do grafo (layering por caminho mais longo + barycenter) ─
function layoutServices(services) {
  if (!services.length) return { nodes: [], edges: [], width: 0, height: 0 }

  const rankOf = new Map(services.map((s) => [s.name, 0]))
  for (let i = 0; i < services.length; i++) {
    let changed = false
    for (const s of services) {
      for (const d of s.depends) {
        const cand = (rankOf.get(d.name) ?? 0) + 1
        if (cand > (rankOf.get(s.name) ?? 0)) {
          rankOf.set(s.name, cand)
          changed = true
        }
      }
    }
    if (!changed) break
  }

  const groups = {}
  for (const s of services) {
    const r = rankOf.get(s.name)
    if (!groups[r]) groups[r] = []
    groups[r].push(s)
  }
  const ranks = Object.keys(groups).map(Number).sort((a, b) => a - b)

  const orderIndex = new Map()
  let cursor = 0
  for (const r of ranks) {
    groups[r].sort((a, b) => a.name.localeCompare(b.name))
    for (const s of groups[r]) orderIndex.set(s.name, cursor++)
  }

  // Reduz cruzamentos ordenando cada camada pela posição média das
  // dependências (serviços à esquerda que o nó segue).
  for (const r of ranks) {
    const avg = (s) => {
      const deps = s.depends.filter((d) => (rankOf.get(d.name) ?? 0) < r)
      if (!deps.length) return null
      return deps.reduce((acc, d) => acc + (orderIndex.get(d.name) ?? 0), 0) / deps.length
    }
    groups[r].sort((a, b) => {
      const aa = avg(a)
      const bb = avg(b)
      if (aa !== null && bb !== null && aa !== bb) return aa - bb
      return a.name.localeCompare(b.name)
    })
  }

  for (const r of ranks) {
    groups[r].forEach((s, idx) => orderIndex.set(s.name, r * 1000 + idx))
  }

  const maxRank = ranks[ranks.length - 1]
  const maxCount = Math.max(...ranks.map((r) => groups[r].length))
  const width = PAD * 2 + maxRank * COL_W + NODE_W
  const height = PAD * 2 + (maxCount - 1) * ROW_H + NODE_H

  const pos = new Map()
  for (const r of ranks) {
    groups[r].forEach((s, idx) => {
      pos.set(s.name, {
        x: PAD + r * COL_W + NODE_W / 2,
        y: PAD + idx * ROW_H + NODE_H / 2,
        rank: r,
      })
    })
  }

  const nodes = services.map((s, i) => ({
    ...s,
    index: i,
    color: NODE_COLORS[i % NODE_COLORS.length],
    x: pos.get(s.name).x,
    y: pos.get(s.name).y,
    rank: pos.get(s.name).rank,
  }))

  const edges = []
  for (const s of nodes) {
    for (const d of s.depends) {
      const target = pos.get(d.name)
      if (!target) continue
      const selfLoop = d.name === s.name
      const forward = s.rank > target.rank
      edges.push(applyEdgeGeometry(s, target, selfLoop, forward, d.condition))
    }
  }

  return { nodes, edges, width, height }
}

function applyEdgeGeometry(src, dst, selfLoop, forward, condition) {
  const sx = src.x + NODE_W / 2
  const sy = src.y
  const ex = dst.x - NODE_W / 2
  const ey = dst.y

  let d = ''
  let labelPos = null
  if (selfLoop) {
    d = `M ${sx} ${sy} Q ${sx + 44} ${sy - 26} ${sx + 44} ${sy} Q ${sx + 44} ${sy + 26} ${sx} ${sy}`
    labelPos = { x: sx + 52, y: sy - 8 }
  } else if (forward) {
    const mx = (sx + ex) / 2
    d = `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ey} L ${ex} ${ey}`
    labelPos = { x: mx - 4, y: (sy + ey) / 2 - 6 }
  } else {
    const cx = Math.max(sx, ex) + 44
    d = `M ${sx} ${sy} Q ${cx} ${(sy + ey) / 2} ${ex} ${ey}`
    labelPos = { x: Math.max(sx, ex) + 10, y: (sy + ey) / 2 - 8 }
  }
  return { src: src.name, dst: dst.name, d, condition, labelPos }
}

// ─── Presets ────────────────────────────────────────────────────
const SAMPLE_FULL = `version: "3.9"

name: demo

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    depends_on:
      api:
        condition: service_healthy
    networks:
      - frontend
      - backend
    restart: unless-stopped

  api:
    image: node:22-alpine
    env_file: .env
    environment:
      NODE_ENV: production
      DEBUG: "false"
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    labels:
      - "traefik.enable=true"
    networks:
      - backend

  worker:
    build: ./worker
    depends_on:
      - api
    environment:
      - QUEUE_URL=amqp://rabbit:5672
    networks:
      - backend

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:7-alpine
    networks:
      - backend

networks:
  frontend: {}
  backend: {}

volumes:
  pgdata: {}
`

const SAMPLE_CYCLE = `services:
  a:
    image: busybox:latest
    depends_on:
      - b
  b:
    image: busybox:latest
    depends_on:
      - c
  c:
    image: busybox:latest
    depends_on:
      - a
`

const SAMPLE_MINIMAL = `services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
`

const ENGINE_SOURCE = `// src/utils/yamlFormatter.js já exporta parseYaml()
// — a visualização reusa o parser existente.

// 1. Normalização tolerante às variações do Compose
function toPortStrings(raw) {
  return toList(raw).map((p) => {
    if (typeof p !== 'object') return String(p)
    // "8080:80" → { "8080": 80 } (quirk do parser)
    const keys = Object.keys(p)
    if (keys.length === 1) return keys[0] + ':' + fmtValue(p[keys[0]])
    // objeto canônico v3 { published, target }
    const ext = p.published ?? p.host
    const int = p.target ?? p.container
    if (ext !== undefined && int !== undefined) return ext + ':' + int
    ...
  })
}

// 2. Layers por caminho mais longo (dependência → rank maior)
function layoutServices(services) {
  const rankOf = new Map(services.map((s) => [s.name, 0]))
  for (let i = 0; i < services.length; i++) {
    let changed = false
    for (const s of services)
      for (const d of s.depends) {
        const cand = (rankOf.get(d.name) ?? 0) + 1
        if (cand > rankOf.get(s.name)) {
          rankOf.set(s.name, cand); changed = true
        }
      }
    if (!changed) break
  }
  ...
}

// 3. Ciclos detectados com DFS em 3 estados (0/1/2) — sem lib externa
function findCycles(services) { ... }`

const translations = {
  pt: {
    title: 'Visualizador de docker-compose',
    intro: (
      <>
        Cola um <Text code>docker-compose.yml</Text> e recebe o grafo de
        dependências da stack: cada serviço vira um nó com imagem/build,
        portas e redes; as setas mostram quem depende de quem (e a condição
        do <Text code>depends_on</Text>). A análise aponta ciclos,
        dependências ausentes, conflitos de porta e serviços sem imagem nem
        build. Tudo 100% no navegador — reusa o parser YAML da página
        <Text code>/tools/yaml-formatter</Text>.
      </>
    ),
    paste: 'Cole o docker-compose.yml',
    placeholder: 'Ex.: copie o docker-compose.yml de um projeto e cole aqui...',
    presets: 'Exemplos',
    presetFull: 'Stack completa',
    presetCycle: 'Ciclo (erro)',
    presetMinimal: 'Mínima',
    clear: 'Limpar',
    analyze: 'Visualizar',
    parseError: 'Falha ao interpretar o YAML',
    noServices: 'Nenhum serviço encontrado no arquivo. Verifique se existe uma chave "services:" com pelo menos um serviço.',
    graphTitle: 'Grafo de dependências',
    graphHint: 'A seta A → B significa "A depende de B" (B precisa iniciar antes de A).',
    legendBuild: 'build',
    legendImage: 'imagem',
    stats: 'Resumo',
    statServices: 'serviços',
    statNetworks: 'redes',
    statVolumes: 'volumes',
    statWarnings: 'alertas',
    warnings: 'Alertas',
    none: 'Nenhum achado — parece um arquivo saudável.',
    wNoImage: 'sem imagem nem build',
    wMissingDep: 'dependência que não existe no arquivo',
    wPortConflict: 'porta publicada mais de uma vez',
    wCycle: 'ciclo de dependência',
    servicesTable: 'Detalhes dos serviços',
    colService: 'Serviço',
    colStart: 'Imagem / Build',
    colDepends: 'Depende de',
    colPorts: 'Portas',
    colNetworks: 'Redes',
    colVolumes: 'Volumes',
    colEnv: 'Env',
    colRestart: 'Restart',
    defaultNetwork: 'default (implícita)',
    copySummary: 'Copiar resumo',
    copied: 'Resumo copiado!',
    envFiles: 'env_file',
    profiles: 'perfis',
    labels: 'labels',
    secrets: 'secrets',
    configs: 'configs',
    replicas: 'réplicas',
    networksDef: 'Redes declaradas',
    volumesDef: 'Volumes declarados',
    howItWorks: 'Como funciona',
    howItWorksBody: 'A página reusa o parser YAML do projeto (src/utils/yamlFormatter.js, o mesmo do /tools/yaml-formatter) e depois extrai cada serviço tolerando as variações de escrita do Compose: depends_on em lista ou mapa, environment em mapa ou lista, portas/volumes em string ou objeto. O grafo usa layering por caminho mais longo (serviço com mais dependências fica mais à direita) com passada de barycenter para reduzir cruzamentos; ciclos são detectados com DFS em estado visitando/visitado.',
    errLine: 'linha',
    errCol: 'coluna',
    sourceTitle: 'Motor (extração + layout)',
  },
  en: {
    title: 'docker-compose Visualizer',
    intro: (
      <>
        Paste a <Text code>docker-compose.yml</Text> and get the dependency
        graph of your stack: each service becomes a node with image/build,
        ports and networks; arrows show who depends on whom (including the
        <Text code>depends_on</Text> condition). The analysis flags cycles,
        missing dependencies, port conflicts and services with neither image
        nor build. 100% in the browser — it reuses the YAML parser from the
        <Text code>/tools/yaml-formatter</Text> page.
      </>
    ),
    paste: 'Paste your docker-compose.yml',
    placeholder: 'e.g. copy the docker-compose.yml from a project and paste here...',
    presets: 'Samples',
    presetFull: 'Full stack',
    presetCycle: 'Cycle (error)',
    presetMinimal: 'Minimal',
    clear: 'Clear',
    analyze: 'Visualize',
    parseError: 'Failed to parse the YAML',
    noServices: 'No services found in the file. Check that a "services:" key exists with at least one service.',
    graphTitle: 'Dependency graph',
    graphHint: 'Arrow A → B means "A depends on B" (B must start before A).',
    legendBuild: 'build',
    legendImage: 'image',
    stats: 'Summary',
    statServices: 'services',
    statNetworks: 'networks',
    statVolumes: 'volumes',
    statWarnings: 'warnings',
    warnings: 'Warnings',
    none: 'No findings — looks like a healthy file.',
    wNoImage: 'service with neither image nor build',
    wMissingDep: 'dependency not declared in the file',
    wPortConflict: 'published port used more than once',
    wCycle: 'dependency cycle',
    servicesTable: 'Service details',
    colService: 'Service',
    colStart: 'Image / Build',
    colDepends: 'Depends on',
    colPorts: 'Ports',
    colNetworks: 'Networks',
    colVolumes: 'Volumes',
    colEnv: 'Env',
    colRestart: 'Restart',
    defaultNetwork: 'default (implicit)',
    copySummary: 'Copy summary',
    copied: 'Summary copied!',
    envFiles: 'env_file',
    profiles: 'profiles',
    labels: 'labels',
    secrets: 'secrets',
    configs: 'configs',
    replicas: 'replicas',
    networksDef: 'Declared networks',
    volumesDef: 'Declared volumes',
    howItWorks: 'How it works',
    howItWorksBody: 'The page reuses the project YAML parser (src/utils/yamlFormatter.js, the same one used by /tools/yaml-formatter) and then extracts each service tolerating the Compose writing variations: depends_on as a list or a map, environment as a map or a list, ports/volumes as strings or objects. The graph uses longest-path layering (services with more dependencies sit further right) with a barycenter pass to reduce edge crossings; cycles are detected with a DFS visiting/visited state.',
    errLine: 'line',
    errCol: 'col',
    sourceTitle: 'Engine (extraction + layout)',
  },
}

export default function DockerComposeVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState(SAMPLE_FULL)

  const analysis = useMemo(() => analyzeCompose(text), [text])
  const layout = useMemo(
    () => (analysis.result ? layoutServices(analysis.result.services) : { nodes: [], edges: [], width: 0, height: 0 }),
    [analysis]
  )

  const typeLabel = (type, t2, w) => {
    switch (type) {
      case 'no-image':
        return t2.wNoImage + ` — ${w.svc}`
      case 'missing-dep':
        return `${w.svc} → ${w.target}: ${t2.wMissingDep}`
      case 'port-conflict':
        return `${w.svc} & ${w.other}: ${t2.wPortConflict} (:${w.port})`
      case 'cycle':
        return `${t2.wCycle}: ${w.path}`
      default:
        return ''
    }
  }

  const summaryText = useMemo(() => {
    const s = analysis.result.services
    if (!s.length) return ''
    const lines = s.map((svc) => {
      const start = imageLabel(svc) || '?'
      const deps = svc.depends.map((d) => d.name).join(', ')
      const ports = svc.ports.join(', ')
      const nets = (svc.networks.length ? svc.networks : ['default']).join(', ')
      return `- ${svc.name} (${start})${deps ? ` depends: ${deps}` : ''}${ports ? ` ports: ${ports}` : ''}${nets ? ` nets: ${nets}` : ''}`
    })
    return lines.join('\n')
  }, [analysis])

  const copySummary = () => {
    navigator.clipboard.writeText(summaryText).then(
      () => message.success(t.copied),
      () => message.error('Clipboard API unavailable')
    )
  }

  const columns = useMemo(
    () => [
      {
        title: t.colService,
        dataIndex: 'name',
        key: 'name',
        render: (name, row) => (
          <Space direction="vertical" size={2}>
            <Text strong>{name}</Text>
            {row.containerName && <Text type="secondary" style={{ fontSize: 12 }}>{row.containerName}</Text>}
            {row.replicas != null && <Tag color="volcano">{t.replicas}: {row.replicas}</Tag>}
          </Space>
        ),
      },
      {
        title: t.colStart,
        dataIndex: 'imageRaw',
        key: 'start',
        render: (_, row) => {
          const img = imageLabel(row)
          const isBuild = !row.imageRaw
          return (
            <Space direction="vertical" size={2}>
              <Text code>{img}</Text>
              {isBuild && <Text type="secondary" style={{ fontSize: 12 }}>{t.legendBuild}</Text>}
              {row.envFiles.length > 0 && <Text type="secondary" style={{ fontSize: 12 }}>{t.envFiles}: {row.envFiles.join(', ')}</Text>}
            </Space>
          )
        },
      },
      {
        title: t.colDepends,
        dataIndex: 'depends',
        key: 'depends',
        render: (deps) =>
          deps.length ? (
            <Space wrap size={2}>
              {deps.map((d, i) => (
                <Tag key={i} color={d.condition === 'service_healthy' ? 'green' : 'blue'}>{d.name}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: t.colPorts,
        dataIndex: 'ports',
        key: 'ports',
        render: (ports) =>
          ports.length ? (
            <Space wrap size={2}>
              {ports.map((p, i) => (
                <Tag key={i}>{p}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: t.colNetworks,
        dataIndex: 'networks',
        key: 'networks',
        render: (nets) => {
          const shown = nets.length ? nets : ['default']
          return (
            <Space wrap size={2}>
              {shown.map((n, i) => (
                <Tag key={i} color={nets.length ? 'purple' : 'default'}>{n}</Tag>
              ))}
              {!nets.length && <Text type="secondary" style={{ fontSize: 11 }}>{t.defaultNetwork}</Text>}
            </Space>
          )
        },
      },
      {
        title: t.colVolumes,
        dataIndex: 'volumes',
        key: 'volumes',
        render: (vols) =>
          vols.length ? (
            <Space wrap size={2}>
              {vols.map((v, i) => (
                <Tag key={i}>{v}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: t.colEnv,
        key: 'env',
        render: (_, row) => (
          <Space direction="vertical" size={2}>
            {row.env.length > 0 && <Tag color="geekblue">{row.env.length} env</Tag>}
            {row.labels > 0 && <Tag>{row.labels} {t.labels}</Tag>}
            {row.secrets > 0 && <Tag>{row.secrets} {t.secrets}</Tag>}
            {row.configs > 0 && <Tag>{row.configs} {t.configs}</Tag>}
            {row.profiles.length > 0 && <Tag>{t.profiles}: {row.profiles.join(', ')}</Tag>}
          </Space>
        ),
      },
      { title: t.colRestart, dataIndex: 'restart', key: 'restart', render: (r) => (r ? <Tag color={r === 'unless-stopped' ? 'cyan' : 'default'}>{r}</Tag> : <Text type="secondary">—</Text>) },
    ],
    [t]
  )

  const tableData = useMemo(
    () => analysis.result.services.map((s) => ({ ...s, key: s.name })),
    [analysis]
  )

  const graphSvg = useMemo(() => {
    if (!layout.nodes.length) return null
    const hasDefs = layout.edges.length > 0
    return (
      <svg
        width={layout.width}
        height={layout.height}
        style={{ minWidth: Math.min(layout.width, 1800), maxWidth: '100%', background: 'transparent' }}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="docker-compose dependency graph"
      >
        {hasDefs && (
          <defs>
            <marker id="arr" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4.5 L0,9 z" fill="#bfbfbf" />
            </marker>
          </defs>
        )}
        {layout.edges.map((e, i) => (
          <g key={`e${i}`}>
            <path d={e.d} fill="none" stroke={e.condition === 'service_healthy' ? '#73d13d' : '#bfbfbf'} strokeWidth={1.6} markerEnd="url(#arr)" />
            {e.labelPos && (
              <text x={e.labelPos.x} y={e.labelPos.y} fontSize={10} fill="#8c8c8c" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                {e.condition}
              </text>
            )}
          </g>
        ))}
        {layout.nodes.map((n) => {
          const lines = [n.name]
          const start = imageLabel(n)
          lines.push(start || '?')
          const portLine = [n.ports.join(', '), n.expose.map((x) => `${x}`).join(', ')].filter(Boolean).join(' · ')
          lines.push(portLine ? (portLine.length > 34 ? portLine.slice(0, 33) + '…' : portLine) : '')
          const meta = [
            n.env.length ? `${n.env.length} env` : '',
            n.volumes.length ? `${n.volumes.length} vol` : '',
            (n.networks.length ? n.networks : ['default']).length ? `${(n.networks.length ? n.networks : ['default']).length} net` : '',
            n.restart ? n.restart : '',
          ]
            .filter(Boolean)
            .join(' · ')
          lines.push(meta.length > 40 ? meta.slice(0, 39) + '…' : meta)
          return (
            <g key={n.name}>
              <rect
                x={n.x - NODE_W / 2}
                y={n.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill="#ffffff"
                stroke={n.color}
                strokeWidth={1.8}
              />
              {lines.map((ln, li) => (
                <text
                  key={li}
                  x={n.x - NODE_W / 2 + 14}
                  y={n.y - NODE_H / 2 + 22 + li * 22}
                  fontSize={li === 0 ? 14 : 11.5}
                  fontWeight={li === 0 ? 700 : 400}
                  fill={li === 0 ? n.color : li === 1 ? '#434343' : '#8c8c8c'}
                  fontFamily={li === 0 ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, monospace'}
                >
                  {ln}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
    )
  }, [layout, t])

  const services = analysis.result.services

  return (
    <div>
      <Title level={3}>{t.title}</Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Text strong>{t.presets}:</Text>
            <Button icon={<ThunderboltOutlined />} size="small" onClick={() => setText(SAMPLE_FULL)}>{t.presetFull}</Button>
            <Button icon={<WarningOutlined />} size="small" onClick={() => setText(SAMPLE_CYCLE)}>{t.presetCycle}</Button>
            <Button size="small" onClick={() => setText(SAMPLE_MINIMAL)}>{t.presetMinimal}</Button>
            <Button icon={<ClearOutlined />} size="small" danger onClick={() => setText('')}>{t.clear}</Button>
          </Space>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
            autoSize={{ minRows: 10, maxRows: 22 }}
            spellCheck={false}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
          />
          {analysis.parseError && (
            <Alert
              type="error"
              showIcon
              message={t.parseError}
              description={`${analysis.parseError.error}${analysis.parseError.line ? ` — ${t.errLine} ${analysis.parseError.line}` : ''}${analysis.parseError.col ? ` ${t.errCol} ${analysis.parseError.col}` : ''}`}
            />
          )}
        </Space>
      </Card>

      {services.length === 0 && !analysis.parseError ? (
        <Card style={{ marginTop: 16 }}>
          <Empty description={t.noServices} />
        </Card>
      ) : (
        services.length > 0 && (
          <>
            <Card
              style={{ marginTop: 16 }}
              title={
                <Space>
                  <ApartmentOutlined />
                  <span>{t.graphTitle}</span>
                </Space>
              }
              extra={<Button size="small" icon={<CopyOutlined />} onClick={copySummary}>{t.copySummary}</Button>}
            >
              <Paragraph type="secondary" style={{ marginTop: -8 }}>
                {t.graphHint}
              </Paragraph>
              <div style={{ overflowX: 'auto' }}>{graphSvg}</div>
            </Card>

            <Card style={{ marginTop: 16 }} title={t.stats}>
              <Space wrap size={24}>
                <Tag color="blue">{services.length} {t.statServices}</Tag>
                <Tag color="purple">{analysis.result.networks.length} {t.statNetworks}</Tag>
                <Tag color="cyan">{analysis.result.volumes.length} {t.statVolumes}</Tag>
                <Tag color={analysis.result.warnings.length ? 'orange' : 'green'}>
                  {analysis.result.warnings.length > 0 ? `${analysis.result.warnings.length} ${t.statWarnings}` : t.none}
                </Tag>
              </Space>
              {analysis.result.warnings.length > 0 && (
                <Alert
                  style={{ marginTop: 12 }}
                  type="warning"
                  showIcon
                  message={t.warnings}
                  description={
                    <Space direction="vertical" size={2}>
                      {analysis.result.warnings.map((w, i) => (
                        <div key={i}>• {typeLabel(w.type, t, w)}</div>
                      ))}
                    </Space>
                  }
                />
              )}
              <Space style={{ marginTop: 12 }} direction="vertical" size={2}>
                {analysis.result.networks.length > 0 && (
                  <div>
                    <Text strong>{t.networksDef}:</Text>{' '}
                    {analysis.result.networks.map((n) => (
                      <Tag key={n} color="purple">{n}</Tag>
                    ))}
                  </div>
                )}
                {analysis.result.volumes.length > 0 && (
                  <div>
                    <Text strong>{t.volumesDef}:</Text>{' '}
                    {analysis.result.volumes.map((v) => (
                      <Tag key={v}>{v}</Tag>
                    ))}
                  </div>
                )}
                {analysis.result.name && (
                  <div>
                    <Text strong>name:</Text> <Text code>{analysis.result.name}</Text>
                    {analysis.result.version && <Text type="secondary"> · version: {analysis.result.version}</Text>}
                  </div>
                )}
              </Space>
            </Card>

            <Card style={{ marginTop: 16 }} title={t.servicesTable}>
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="small"
                scroll={{ x: 1000 }}
              />
            </Card>

            <Collapse style={{ marginTop: 16 }} items={[
              {
                key: 'how',
                label: t.howItWorks,
                children: <Paragraph>{t.howItWorksBody}</Paragraph>,
              },
              {
                key: 'source',
                label: t.sourceTitle,
                children: (
                  <pre
                    style={{
                      margin: 0,
                      padding: 12,
                      background: '#fafafa',
                      borderRadius: 8,
                      overflow: 'auto',
                      fontSize: 12,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      lineHeight: 1.5,
                    }}
                  >
                    {ENGINE_SOURCE}
                  </pre>
                ),
              },
            ]} />

            <div style={{ height: 8 }} />
          </>
        )
      )}
    </div>
  )
}