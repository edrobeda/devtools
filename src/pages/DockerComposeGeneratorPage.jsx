import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Select, Segmented, Button, Alert, Collapse, Tag, message } from 'antd'
import { ContainerOutlined, CopyOutlined, CheckOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── uid local (IDs de linha das listas dinâmicas) ──────────────────────────
let _uid = 0
const uid = () => `r${++_uid}`

// ─── Opções fixas ───────────────────────────────────────────────────────────
const RESTART_OPTIONS = ['no', 'always', 'on-failure', 'unless-stopped']
const DRIVER_OPTIONS = ['bridge', 'host', 'none', 'overlay']

const IMAGE_SUGGESTIONS = [
  'nginx:alpine',
  'node:22-alpine',
  'python:3.12-slim',
  'postgres:16-alpine',
  'redis:7-alpine',
  'mariadb:11',
  'mysql:8',
  'mongo:7',
  'golang:1.22-alpine',
  'prom/prometheus:latest',
  'grafana/grafana:latest',
]

// ─── Linhas vazias das listas dinâmicas ─────────────────────────────────────
const emptyPort = () => ({ id: uid(), port: '' })
const emptyEnv = () => ({ id: uid(), key: '', value: '' })
const emptyVolume = () => ({ id: uid(), spec: '' })

function emptyService(name = '') {
  return {
    id: uid(),
    name,
    source: 'image',
    image: '',
    build: '',
    containerName: '',
    restart: 'unless-stopped',
    command: '',
    ports: [],
    envs: [],
    volumes: [],
    dependsOn: [],
    networks: [],
  }
}

// ─── Presets de um clique ───────────────────────────────────────────────────
function presetNodePostgres() {
  return [
    {
      ...emptyService('api'),
      source: 'build',
      build: './api',
      envs: [
        { ...emptyEnv(), key: 'NODE_ENV', value: 'production' },
        { ...emptyEnv(), key: 'DATABASE_URL', value: 'postgres://app:app@db:5432/app' },
      ],
      ports: [{ ...emptyPort(), port: '3000:3000' }],
      dependsOn: ['db'],
      networks: ['appnet'],
    },
    {
      ...emptyService('db'),
      source: 'image',
      image: 'postgres:16-alpine',
      envs: [
        { ...emptyEnv(), key: 'POSTGRES_USER', value: 'app' },
        { ...emptyEnv(), key: 'POSTGRES_PASSWORD', value: 'app' },
        { ...emptyEnv(), key: 'POSTGRES_DB', value: 'app' },
      ],
      volumes: [{ ...emptyVolume(), spec: 'pgdata:/var/lib/postgresql/data' }],
      networks: ['appnet'],
    },
  ]
}

function presetFullStack() {
  return [
    {
      ...emptyService('web'),
      source: 'build',
      build: '.',
      ports: [{ ...emptyPort(), port: '8080:80' }],
      dependsOn: ['api'],
      networks: ['frontnet'],
    },
    {
      ...emptyService('api'),
      source: 'build',
      build: './server',
      ports: [{ ...emptyPort(), port: '3000:3000' }],
      dependsOn: ['db'],
      networks: ['frontnet', 'backnet'],
    },
    {
      ...emptyService('db'),
      source: 'image',
      image: 'postgres:16-alpine',
      envs: [
        { ...emptyEnv(), key: 'POSTGRES_USER', value: 'app' },
        { ...emptyEnv(), key: 'POSTGRES_PASSWORD', value: 'app' },
      ],
      volumes: [{ ...emptyVolume(), spec: 'pgdata:/var/lib/postgresql/data' }],
      networks: ['backnet'],
    },
  ]
}

function presetStatic() {
  return [
    {
      ...emptyService('web'),
      source: 'image',
      image: 'nginx:alpine',
      ports: [{ ...emptyPort(), port: '80:80' }],
      volumes: [{ ...emptyVolume(), spec: './dist:/usr/share/nginx/html:ro' }],
    },
  ]
}

const PRESETS = {
  nodePg: { key: 'nodePg', pt: 'API Node + Postgres', en: 'Node API + Postgres', build: presetNodePostgres, nets: ['appnet'] },
  fullstack: { key: 'fullstack', pt: 'Full-stack (web + api + db)', en: 'Full-stack (web + api + db)', build: presetFullStack, nets: ['frontnet', 'backnet'] },
  static: { key: 'static', pt: 'Estático (Nginx)', en: 'Static (Nginx)', build: presetStatic, nets: [] },
  blank: { key: 'blank', pt: 'Em branco', en: 'Blank', build: () => [emptyService()], nets: [] },
}

// ─── Scalars YAML ───────────────────────────────────────────────────────────
function yamlScalar(v) {
  const s = String(v ?? '')
  if (s === '') return '""'
  if (/^[A-Za-z0-9_./\-]+$/.test(s)) return s
  return JSON.stringify(s)
}

function yamlKey(k) {
  return /^[A-Za-z0-9_.\-]+$/.test(k) ? k : JSON.stringify(k)
}

// ─── O algoritmo real (também exibido na página) ────────────────────────────
function buildCompose(o) {
  const out = []
  const warnings = []
  const add = (t) => out.push(t)
  const indent = (n, t) => out.push('  '.repeat(n) + t)

  const svcs = o.services.filter((s) => s.name.trim())
  if (o.services.length && svcs.length !== o.services.length) warnings.push('nameless')
  if (!svcs.length) warnings.push('empty')

  add('services:')
  svcs.forEach((svc) => {
    add('')
    indent(1, yamlKey(svc.name.trim()) + ':')

    if (svc.source === 'build') {
      indent(2, 'build:')
      indent(3, 'context: ' + yamlScalar(svc.build.trim() || '.'))
      if (svc.image.trim()) indent(2, 'image: ' + yamlScalar(svc.image.trim()))
      else warnings.push('untagged')
    } else {
      if (!svc.image.trim()) warnings.push('noImage')
      indent(2, 'image: ' + yamlScalar(svc.image.trim() || '<imagem>'))
    }

    if (svc.containerName.trim()) indent(2, 'container_name: ' + yamlScalar(svc.containerName.trim()))
    if (svc.restart) indent(2, 'restart: ' + svc.restart)
    if (svc.command.trim()) indent(2, 'command: ' + yamlScalar(svc.command.trim()))

    const ports = svc.ports.map((p) => p.port.trim()).filter(Boolean)
    if (ports.length) {
      indent(2, 'ports:')
      ports.forEach((p) => {
        if (!/^(\d{1,5}|\d{1,5}:\d{1,5}|[^ ]+:\d{1,5}:\d{1,5})(\/(tcp|udp))?$/.test(p)) warnings.push('port')
        indent(3, '- ' + JSON.stringify(p))
      })
    }

    const envs = svc.envs.filter((e) => e.key.trim())
    if (envs.length) {
      indent(2, 'environment:')
      envs.forEach((e) => indent(3, yamlKey(e.key.trim()) + ': ' + yamlScalar(e.value)))
    }

    const vols = svc.volumes.map((v) => v.spec.trim()).filter(Boolean)
    if (vols.length) {
      indent(2, 'volumes:')
      vols.forEach((v) => {
        if (v.indexOf(':') === -1) warnings.push('volume')
        indent(3, '- ' + JSON.stringify(v))
      })
    }

    if (svc.dependsOn.length) {
      indent(2, 'depends_on:')
      svc.dependsOn.forEach((d) => {
        if (!svcs.some((s) => s.name.trim() === d)) warnings.push('dep')
        indent(3, '- ' + yamlScalar(d))
      })
    }

    const nets = svc.networks.filter(Boolean)
    if (nets.length) {
      indent(2, 'networks:')
      nets.forEach((n) => {
        if (!o.networks.some((x) => x.name.trim() === n)) warnings.push('net')
        indent(3, '- ' + yamlScalar(n))
      })
    }
  })

  // Volumes nomeados (origem não começa com . ou /) → bloco volumes declarado.
  const named = new Set()
  svcs.forEach((svc) =>
    svc.volumes.forEach((v) => {
      const spec = v.spec.trim()
      if (!spec) return
      const src = spec.split(':')[0]
      if (src && src[0] !== '.' && src[0] !== '/') named.add(src)
    })
  )
  if (named.size) {
    add('')
    add('volumes:')
    named.forEach((n) => add('  ' + yamlKey(n) + ':'))
  }

  const netsDef = o.networks.filter((n) => n.name.trim())
  if (netsDef.length) {
    add('')
    add('networks:')
    netsDef.forEach((n) => {
      indent(1, yamlKey(n.name.trim()) + ':')
      if (n.driver && n.driver !== 'bridge') indent(2, 'driver: ' + n.driver)
    })
  }

  return { text: out.join('\n') + '\n', warnings }
}

// ─── Algoritmo-fonte exibido na própria página ──────────────────────────────
const SOURCE = buildCompose.toString()

// ─── Traduções ──────────────────────────────────────────────────────────────
const translations = {
  pt: {
    title: 'Gerador de docker-compose.yml',
    intro: (
      <>
        Monta o <Text code>docker-compose.yml</Text> da sua stack a partir de um
        formulário: serviços com imagem ou build de context, portas, variáveis
        de ambiente, volumes, <Text code>depends_on</Text>, redes e política de
        restart. O YAML é gerado na própria página — client-side, nada sai do
        navegador.
      </>
    ),
    presetTitle: 'Modelo (preset)',
    presetHint: 'Um clique preenche a stack — depois é só ajustar.',
    servicesTitle: 'Serviços',
    addService: 'Adicionar serviço',
    emptyHint: 'Nenhum serviço ainda — adicione o primeiro acima.',
    svcNameLabel: 'Nome do serviço',
    svcNamePh: 'ex.: api',
    svcImage: 'Imagem',
    svcBuild: 'Build',
    imagePh: 'escolha ou digite a imagem',
    buildPh: 'contexto do build (ex.: ./api)',
    buildTagPh: 'tag da imagem (opcional)',
    containerNamePh: 'container_name (opcional)',
    commandLabel: 'Comando',
    commandPh: 'ex.: npm start',
    portsLabel: 'Portas — padrão host:container',
    addPort: 'Adicionar porta',
    portPh: 'ex.: 3000:3000',
    addPortBtn: 'Adicionar porta',
    hostPortPh: 'ex.: 3000:3000',
    envLabel: 'Variáveis de ambiente',
    addEnv: 'Adicionar variável',
    keyPh: 'CHAVE',
    valPh: 'valor',
    volumesLabel: 'Volumes — origem:destino',
    addVolume: 'Adicionar volume',
    volumePh: 'ex.: ./data:/app/data ou pgdata:/var/lib/postgresql/data',
    dependsLabel: 'Depende de (depends_on)',
    dependsPlaceholder: 'selecione serviços',
    networksLabel: 'Redes do serviço',
    networksPlaceholder: 'selecione redes',
    networksTitle: 'Redes (configuração)',
    addNetwork: 'Adicionar rede',
    netNamePh: 'nome da rede (ex.: appnet)',
    driverLabel: 'Driver',
    restartLabel: 'Restart',
    copy: 'Copiar YAML',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    outTitle: 'docker-compose.yml gerado',
    stats: (bytes) => `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — o arquivo é gerado mesmo assim:',
    warningsNone: 'Nenhum aviso — parece um compose válido.',
    wEmpty: 'Nenhum serviço definido.',
    wNameless: 'Há serviço(s) sem nome — foram pulados do YAML.',
    wNoImage: 'Serviço sem imagem nem build — precisa de um dos dois.',
    wUntagged: 'Serviço com build sem tag de image — rode com --build pra gerar a imagem.',
    wPort: 'Porta com formato inesperado (use ex.: 3000:3000).',
    wVolume: 'Volume sem ":" — o esperado é origem:destino.',
    wDep: 'depends_on aponta para um serviço que não existe.',
    wNet: 'Rede referenciada que não está no bloco networks.',
    tipTitle: 'Entendendo o resultado',
    tipBody: (
      <>
        <Text code>image</Text> puxa uma imagem pronta; <Text code>build</Text>{' '}
        compila o context (com os dois, o <Text code>build</Text> produz a
        imagem e a <Text code>image</Text> nomeia a tag).{' '}
        <Text code>depends_on</Text> apenas ordena o primeiro{' '}
        <Text code>up</Text> — não espera o serviço estar saudável; pra espera
        real, use <Text code>healthcheck</Text> no de cima e{' '}
        <Text code>condition: service_healthy</Text> no{' '}
        <Text code>depends_on</Text>. E a porta é sempre{' '}
        <Text code>host:container</Text> — o container escuta numa porta
        interna e o host mapeia pra fora.
      </>
    ),
    howTo: 'Como funciona — algoritmo-fonte',
    howToDesc:
      'O build monta o YAML linha a linha com indentação de 2 espaços: cada serviço vira um mapa aninhado, listas (ports, depends_on, networks) viram itens `- `, e scalars que o YAML leria como número/bool especial são envolvidos em aspas via JSON.stringify. O mesmo algoritmo exibido aqui é o que roda na página.',
  },
  en: {
    title: 'docker-compose.yml Generator',
    intro: (
      <>
        Builds the <Text code>docker-compose.yml</Text> for your stack from a
        form: services with image or build, ports, environment variables,
        volumes, networks, <Text code>depends_on</Text> and restart policy. The
        YAML is generated right in the page — fully client-side.
      </>
    ),
    presetTitle: 'Template (preset)',
    presetHint: 'One click fills the stack — adjust afterwards.',
    servicesTitle: 'Services',
    addService: 'Add service',
    emptyHint: 'No service yet — add the first one above.',
    svcNameLabel: 'Service name',
    svcNamePh: 'e.g. api',
    svcImage: 'Image',
    svcBuild: 'Build',
    imagePh: 'pick or type an image',
    buildPh: 'build context (e.g. ./api)',
    buildTagPh: 'image tag (optional)',
    containerNamePh: 'container_name (optional)',
    commandLabel: 'Command',
    commandPh: 'e.g. npm start',
    portsLabel: 'Ports — format host:container',
    addPort: 'Add port',
    portPh: 'e.g. 3000:3000',
    addPortBtn: 'Add port',
    hostPortPh: 'e.g. 3000:3000',
    envLabel: 'Environment variables',
    addEnv: 'Add variable',
    keyPh: 'KEY',
    valPh: 'value',
    volumesLabel: 'Volumes — source:destination',
    addVolume: 'Add volume',
    volumePh: 'e.g. ./data:/app/data or pgdata:/var/lib/postgresql/data',
    dependsLabel: 'Depends on (depends_on)',
    dependsPlaceholder: 'select services',
    networksLabel: 'Service networks',
    networksPlaceholder: 'select networks',
    networksTitle: 'Networks (config)',
    addNetwork: 'Add network',
    netNamePh: 'network name (e.g. appnet)',
    driverLabel: 'Driver',
    restartLabel: 'Restart',
    copy: 'Copy YAML',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    outTitle: 'Generated docker-compose.yml',
    stats: (bytes) => `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — the file is still generated:',
    warningsNone: 'No warnings — looks like a valid compose file.',
    wEmpty: 'No services defined.',
    wNameless: 'Service(s) without a name were skipped from the YAML.',
    wNoImage: 'Service with neither image nor build tag.',
    wUntagged: 'Build service without an image tag — run with --build to produce it.',
    wPort: 'Port with an unexpected format (use e.g. 3000:3000).',
    wVolume: 'Volume without ":" — expected source:destination.',
    wDep: 'depends_on points to a service that does not exist.',
    wNet: 'Network referenced but not listed in the networks block.',
    tipTitle: 'Understanding the output',
    tipBody: (
      <>
        <Text code>image</Text> pulls a ready image; <Text code>build</Text>{' '}
        compiles a context (you can keep both — <Text code>build</Text> produces
        the image and <Text code>image</Text> names the tag).{' '}
        <Text code>depends_on</Text> only orders the first <Text code>up</Text>,
        it does not wait for readiness — for real readiness add a{' '}
        <Text code>healthcheck</Text> upstream and{' '}
        <Text code>condition: service_healthy</Text> in{' '}
        <Text code>depends_on</Text>. And the port mapping is always{' '}
        <Text code>host:container</Text>.
      </>
    ),
    howTo: 'How it works — source algorithm',
    howToDesc:
      'The builder assembles YAML line by line with 2-space indentation: each service becomes a nested map, lists (ports, depends_on, networks) become `- ` items, and scalars the YAML parser would read as a number/special boolean are wrapped in quotes via JSON.stringify. The exact algorithm shown here is what runs on the page.',
  },
}

const warningLabel = (w, t) => {
  switch (w) {
    case 'empty': return t.wEmpty
    case 'nameless': return t.wNameless
    case 'noImage': return t.wNoImage
    case 'untagged': return t.wUntagged
    case 'port': return t.wPort
    case 'volume': return t.wVolume
    case 'dep': return t.wDep
    case 'net': return t.wNet
    default: return w
  }
}

// ─── Card de um serviço ──────────────────────────────────────────────────────
function ServiceCard({ index, svc, t, serviceNames, networkNames, onChange, onRemove }) {
  const set = (patch) => onChange(patch)

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <Text strong>#{index + 1}</Text>
          <Tag color="blue">{svc.name.trim() || '?'}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {svc.source === 'image' ? t.svcImage : t.svcBuild}
          </Text>
        </Space>
      }
      extra={
        <Button size="small" type="text" icon={<DeleteOutlined />} onClick={onRemove} danger />
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap align="center">
          <Text type="secondary">{t.svcNameLabel}</Text>
          <Input
            value={svc.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t.svcNamePh}
            style={{ width: 160, fontFamily: 'monospace', fontSize: 12 }}
          />
          <Input
            value={svc.containerName}
            onChange={(e) => set({ containerName: e.target.value })}
            placeholder={t.containerNamePh}
            style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
          />
        </Space>

        <Space wrap align="center">
          <Segmented
            value={svc.source}
            onChange={(v) => set({ source: v })}
            options={[
              { label: t.svcImage, value: 'image' },
              { label: t.svcBuild, value: 'build' },
            ]}
          />
          {svc.source === 'image' ? (
            <Select
              showSearch
              value={svc.image || undefined}
              onChange={(v) => set({ image: v })}
              options={IMAGE_SUGGESTIONS.map((img) => ({ value: img, label: img }))}
              placeholder={t.imagePh}
              style={{ width: 220 }}
              allowClear
            />
          ) : (
            <>
              <Input
                value={svc.build}
                onChange={(e) => set({ build: e.target.value })}
                placeholder={t.buildPh}
                style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Input
                value={svc.image}
                onChange={(e) => set({ image: e.target.value })}
                placeholder={t.buildTagPh}
                style={{ width: 180, fontFamily: 'monospace', fontSize: 12 }}
              />
            </>
          )}
        </Space>

        <div>
          <Text type="secondary">{t.portsLabel}</Text>
          {svc.ports.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input
                value={p.port}
                onChange={(e) =>
                  set({ ports: svc.ports.map((x) => (x.id === p.id ? { ...x, port: e.target.value } : x)) })
                }
                placeholder={t.portPh}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => set({ ports: svc.ports.filter((x) => x.id !== p.id) })}
                danger
              />
            </div>
          ))}
          <Button size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => set({ ports: [...svc.ports, emptyPort()] })}>
            {t.addPortBtn}
          </Button>
        </div>

        <div>
          <Text type="secondary">{t.envLabel}</Text>
          {svc.envs.map((e) => (
            <div key={e.id} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input
                value={e.key}
                onChange={(ev) =>
                  set({ envs: svc.envs.map((x) => (x.id === e.id ? { ...x, key: ev.target.value } : x)) })
                }
                placeholder={t.keyPh}
                style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Input
                value={e.value}
                onChange={(ev) =>
                  set({ envs: svc.envs.map((x) => (x.id === e.id ? { ...x, value: ev.target.value } : x)) })
                }
                placeholder={t.valPh}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => set({ envs: svc.envs.filter((x) => x.id !== e.id) })}
                danger
              />
            </div>
          ))}
          <Button size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => set({ envs: [...svc.envs, emptyEnv()] })}>
            {t.addEnv}
          </Button>
        </div>

        <div>
          <Text type="secondary">{t.volumesLabel}</Text>
          {svc.volumes.map((v) => (
            <div key={v.id} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input
                value={v.spec}
                onChange={(ev) =>
                  set({ volumes: svc.volumes.map((x) => (x.id === v.id ? { ...x, spec: ev.target.value } : x)) })
                }
                placeholder={t.volumePh}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => set({ volumes: svc.volumes.filter((x) => x.id !== v.id) })}
                danger
              />
            </div>
          ))}
          <Button size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => set({ volumes: [...svc.volumes, emptyVolume()] })}>
            {t.addVolume}
          </Button>
        </div>

        <Space wrap align="center">
          <Text type="secondary">{t.commandLabel}</Text>
          <Input
            value={svc.command}
            onChange={(e) => set({ command: e.target.value })}
            placeholder={t.commandPh}
            style={{ width: 180, fontFamily: 'monospace', fontSize: 12 }}
          />
          <Text type="secondary">{t.restartLabel}</Text>
          <Select
            value={svc.restart}
            onChange={(v) => set({ restart: v })}
            options={RESTART_OPTIONS.map((r) => ({ value: r, label: r }))}
            style={{ width: 160 }}
          />
          <Text type="secondary">{t.dependsLabel}</Text>
          <Select
            mode="multiple"
            value={svc.dependsOn}
            onChange={(v) => set({ dependsOn: v })}
            options={serviceNames.filter((n) => n !== svc.name).map((n) => ({ value: n, label: n }))}
            placeholder={t.dependsPlaceholder}
            style={{ minWidth: 160 }}
          />
          <Text type="secondary">{t.networksLabel}</Text>
          <Select
            mode="multiple"
            value={svc.networks}
            onChange={(v) => set({ networks: v })}
            options={networkNames.map((n) => ({ value: n, label: n }))}
            placeholder={t.networksPlaceholder}
            style={{ minWidth: 160 }}
          />
        </Space>
      </Space>
    </Card>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function DockerComposeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [copied, setCopied] = useState(false)
  const [presetKey, setPresetKey] = useState('node-pg')
  const [services, setServices] = useState(() => presetNodePostgres())
  const [networks, setNetworks] = useState([
    { id: uid(), name: 'appnet', driver: 'bridge' },
  ])

  const serviceNames = useMemo(
    () => services.map((s) => s.name.trim()).filter(Boolean),
    [services]
  )
  const networkNames = useMemo(
    () => networks.map((n) => n.name).filter(Boolean),
    [networks]
  )

  const setService = (id, patch) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const setNet = (id, patch) =>
    setNetworks((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  const pushService = () => setServices((prev) => [...prev, emptyService()])
  const removeService = (id) => setServices((prev) => prev.filter((s) => s.id !== id))

  const applyPreset = (key) => {
    const factory = PRESETS[key]
    const fresh = factory.build()
    setServices(fresh)
    setNetworks(factory.nets.map((name) => ({ id: uid(), name, driver: 'bridge' })))
    setPresetKey(key)
  }

  const { text, warnings } = useMemo(
    () => buildCompose({ services, networks }),
    [services, networks]
  )

  const uniqueWarnings = Array.from(new Set(warnings))
  const byteCount = new TextEncoder().encode(text).length

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  const presetOptions = Object.keys(PRESETS).map((k) => ({
    value: k,
    label: PRESETS[k][lang],
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetHint}</Text>}>
        <Segmented value={presetKey} onChange={applyPreset} options={presetOptions} />
      </Card>

      <Card
        title={`${t.servicesTitle} (${services.length})`}
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={pushService}>
            {t.addService}
          </Button>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {services.map((svc, idx) => (
            <ServiceCard
              key={svc.id}
              index={idx}
              svc={svc}
              t={t}
              serviceNames={serviceNames}
              networkNames={networkNames}
              onChange={(patch) => setService(svc.id, patch)}
              onRemove={() => removeService(svc.id)}
            />
          ))}
          {services.length === 0 && <Text type="secondary">{t.emptyHint}</Text>}
        </Space>
      </Card>

      <Card title={t.networksTitle}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {networks.map((n) => (
            <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 8 }}>
              <Input
                value={n.name}
                onChange={(e) => setNet(n.id, { name: e.target.value })}
                placeholder={t.netNamePh}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              <Select
                value={n.driver}
                onChange={(v) => setNet(n.id, { driver: v })}
                options={DRIVER_OPTIONS.map((d) => ({ value: d, label: d }))}
                placeholder={t.driverLabel}
              />
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => setNetworks((prev) => prev.filter((x) => x.id !== n.id))}
                danger
              />
            </div>
          ))}
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setNetworks((prev) => [...prev, { id: uid(), name: '', driver: 'bridge' }])}
          >
            {t.addNetwork}
          </Button>
        </Space>
      </Card>

      <Card
        title={t.outTitle}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {services.filter((s) => s.name.trim()).length} {t.servicesTitle.toLowerCase()} · {t.stats(byteCount)}
            </Text>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, background: '#fafafa', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
            <code>{text}</code>
          </pre>
          <Space>
            <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
              {copied ? t.copied : t.copy}
            </Button>
          </Space>
          <Alert
            type={uniqueWarnings.length ? 'warning' : 'success'}
            showIcon
            message={uniqueWarnings.length ? t.warningsTitle : t.warningsNone}
            description={
              uniqueWarnings.length ? (
                <Space direction="vertical" size={0}>
                  {uniqueWarnings.map((w) => (
                    <Text key={w} style={{ fontSize: 12 }}>· {warningLabel(w, t)}</Text>
                  ))}
                </Space>
              ) : null
            }
          />
        </Space>
      </Card>

      <Card title={t.tipTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipBody}</Paragraph>
      </Card>

      <Card title={t.howTo}>
        <Paragraph type="secondary">{t.howToDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>docker-compose-builder.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}