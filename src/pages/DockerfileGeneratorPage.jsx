import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, AutoComplete, Segmented, Switch,
  Button, Alert, Collapse, message, Divider,
} from 'antd'
import { ContainerOutlined, CopyOutlined, CheckOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Sugestões de imagem base (AutoComplete) ─────────────────────────────
const BASE_IMAGES = [
  'node:22-alpine', 'node:22-bookworm-slim', 'node:20-alpine', 'node:20-bookworm-slim',
  'python:3.12-slim', 'python:3.12-alpine', 'python:3.11-slim',
  'nginx:alpine', 'nginx:stable-alpine',
  'golang:1.22-alpine', 'golang:1.22',
  'ubuntu:24.04', 'debian:bookworm-slim', 'alpine:3.20',
  'openjdk:21-slim', 'eclipse-temurin:21-jre-alpine',
  'ruby:3.3-alpine', 'php:8.3-fpm-alpine', 'rust:1.80-alpine',
]

const COMMON_STEPS = ['npm ci', 'npm install', 'npm run build', 'pip install --no-cache-dir -r requirements.txt', 'apt-get update && apt-get install -y curl', 'go mod download', 'go build -o /server/app .']

// ─── Modelos de stack (um clique) ─────────────────────────────────────────
let cidSeq = 0
const cid = () => `c${++cidSeq}`

const STACKS = {
  node: {
    label: 'Node.js',
    base: 'node:22-alpine',
    workDir: '/app',
    env: 'NODE_ENV=production',
    ports: '3000',
    user: '',
    copies: [
      { src: 'package.json', dest: './' },
      { src: 'package-lock.json', dest: './' },
      { src: '.', dest: '.' },
    ],
    steps: 'npm ci --omit=dev',
    entryMode: 'none',
    entryValue: '',
    cmdMode: 'exec',
    cmdValue: 'npm start',
  },
  python: {
    label: 'Python',
    base: 'python:3.12-slim',
    workDir: '/app',
    env: 'PYTHONDONTWRITEBYTECODE=1\nPYTHONUNBUFFERED=1',
    ports: '5000',
    user: '',
    copies: [
      { src: 'requirements.txt', dest: './' },
      { src: '.', dest: '.' },
    ],
    steps: 'pip install --no-cache-dir -r requirements.txt',
    entryMode: 'none',
    entryValue: '',
    cmdMode: 'exec',
    cmdValue: 'gunicorn app:app --bind 0.0.0.0:5000',
  },
  nginx: {
    label: 'Nginx (estático)',
    base: 'nginx:alpine',
    workDir: '',
    env: '',
    ports: '80',
    user: '',
    copies: [{ src: 'dist', dest: '/usr/share/nginx/html' }],
    steps: '',
    entryMode: 'none',
    entryValue: '',
    cmdMode: 'none',
    cmdValue: '',
  },
  go: {
    label: 'Go',
    base: 'golang:1.22-alpine',
    workDir: '/app',
    env: 'CGO_ENABLED=0',
    ports: '8080',
    user: '',
    copies: [
      { src: 'go.mod', dest: './' },
      { src: 'go.sum', dest: './' },
      { src: '.', dest: '.' },
    ],
    steps: 'go mod download\ngo build -o /server/app .',
    entryMode: 'none',
    entryValue: '',
    cmdMode: 'exec',
    cmdValue: '/server/app',
  },
  blank: {
    label: 'Em branco',
    base: 'node:22-alpine',
    workDir: '/app',
    env: '',
    ports: '',
    user: '',
    copies: [],
    steps: '',
    entryMode: 'none',
    entryValue: '',
    cmdMode: 'none',
    cmdValue: '',
  },
}

const CMD_PRESETS = [
  { label: 'npm start', value: 'npm start' },
  { label: 'node server.js', value: 'node server.js' },
  { label: 'python app.py', value: 'python app.py' },
  { label: 'gunicorn app:app', value: 'gunicorn app:app' },
  { label: '/server/app', value: '/server/app' },
]

const ENTRY_PRESETS = [
  { label: 'node dist/index.js', value: 'node dist/index.js' },
  { label: 'python -m http.server 8000', value: 'python -m http.server 8000' },
]

// ─── Algoritmo-fonte exibido na própria página ────────────────────────────
const SOURCE = `
function buildDockerfile(o) {
  const lines = []
  const warnings = []
  const L = (s) => lines.push(s)

  L('FROM ' + (o.base || '<imagem>'))
  L('')

  if (o.label)   { L('LABEL maintainer="' + o.label + '"'); L('') }
  if (o.workDir) { L('WORKDIR ' + o.workDir); L('') }

  for (const env of linesOf(o.env)) L('ENV ' + env)
  L('')

  for (const { src, dest } of o.copies) L('COPY ' + src + ' ' + dest)
  L('')

  for (const step of o.steps) L('RUN ' + step)
  L('')

  if (o.ports) L('EXPOSE ' + o.ports)
  if (o.user)  L('USER ' + o.user)
  L('')

  if (o.entryMode === 'exec')  L('ENTRYPOINT ' + JSON.stringify(execArgs(o.entryValue)))
  if (o.entryMode === 'shell') L('ENTRYPOINT ' + o.entryValue)
  if (o.cmdMode  === 'exec')   L('CMD ' + JSON.stringify(execArgs(o.cmdValue)))
  if (o.cmdMode  === 'shell')  L('CMD ' + o.cmdValue)

  // modo exec: separa argumentos por espaço, respeitando aspas duplas
  function execArgs(v) {
    const args = []
    const re = /"([^"]*)"|(\\S+)/g
    let m
    while ((m = re.exec(v))) args.push(m[1] !== undefined ? '"' + m[1] + '"' : m[2])
    return args
  }

  return lines.join('\\n')
}
`.trim()

const translations = {
  pt: {
    title: 'Gerador de Dockerfile',
    intro: (
      <>
        Monta um <Text code>Dockerfile</Text> a partir de um formulário: imagem
        base, variáveis de ambiente, cópia de arquivos, comandos de build (
        <Text code>RUN</Text>), portas e o par{' '}
        <Text code>ENTRYPOINT</Text>/<Text code>CMD</Text> — tudo na ordem
        convencional das diretivas. Ponto de partida pra containerizar um app em
        segundos. 100% client-side, nada sai do navegador.
      </>
    ),
    stackTitle: 'Modelo (stack)',
    stackHint: 'Um clique aplica um modelo completo — depois é só ajustar.',
    configTitle: 'Configuração',
    baseLabel: 'Imagem base',
    basePlaceholder: 'node:22-alpine',
    workdirLabel: 'WORKDIR',
    workdirPlaceholder: '/app',
    labelLabel: 'LABEL (metadata, opcional)',
    labelPlaceholder: 'Time Web <web@example.com>',
    envLabel: 'ENV — uma KEY=VALUE por linha',
    envPlaceholder: 'NODE_ENV=production\nPORT=3000',
    portsLabel: 'EXPOSE — portas separadas por espaço ou vírgula',
    portsPlaceholder: '3000 8080',
    userLabel: 'USER (opcional)',
    userPlaceholder: 'node',
    copyLabel: 'COPY — linhas de origem → destino',
    copySrcPh: 'origem (ex.: package.json)',
    copyDestPh: 'destino (ex.: ./)',
    addCopy: 'Adicionar linha de COPY',
    stepsLabel: 'RUN — comandos de build/instalação (um por linha)',
    stepsPlaceholder: 'npm ci\nnpm run build',
    stepsQuick: 'Inserir comando comum:',
    entryLabel: 'ENTRYPOINT',
    cmdLabel: 'CMD',
    modeNone: 'nenhum',
    modeExec: 'exec',
    modeShell: 'shell',
    entryExecPlaceholder: 'node dist/index.js',
    cmdExecPlaceholder: 'npm start',
    entryShellPlaceholder: 'nginx -g "daemon off;"',
    cmdShellPlaceholder: 'npm start',
    execHint: 'No modo exec, cada argumento é separado por espaço; use aspas para um argumento que contenha espaço.',
    commentsLabel: 'Incluir comentários de seção',
    cmdPresets: 'Atalhos de CMD:',
    entryPresets: 'Atalhos de ENTRYPOINT:',
    outTitle: 'Dockerfile gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — o Dockerfile ainda é montado, mas confira:',
    warningsNone: 'Nenhum aviso — válido de bater o olho.',
    wBase: 'Imagem base vazia — o FROM vai quebrar.',
    wEnv: 'Linha de ENV sem "=" — o padrão esperado é KEY=VALUE.',
    wPorts: 'Porta em EXPOSE não é numérica (ex.: 3000).',
    wCmdExec: 'CMD no modo exec sem argumentos.',
    wEntryExec: 'ENTRYPOINT no modo exec sem argumentos.',
    wCmdShell: 'CMD no modo shell vazio.',
    wEntryShell: 'ENTRYPOINT no modo shell vazio.',
    wCopy: 'Linha de COPY sem origem ou destino.',
    noCmdAlert: 'Sem CMD nem ENTRYPOINT',
    noCmdAlertBody: (
      <>
        A imagem vai rodar o comando padrão da imagem base (o nginx, por
        exemplo, já inicia sozinho). Se a base não tem padrão, o container morre
        na hora do <Text code>docker run</Text>.
      </>
    ),
    tipTitle: 'Boas práticas & entendendo o resultado',
    tipBody: (
      <>
        Cada diretiva vira uma <b>camada</b> — o Docker reaproveita camadas
        prontas do cache. Por isso a ordem importa: o que muda pouco (instalar
        dependências) vem antes do que muda muito (copiar o código). Padrão de
        ouro pra um app Node:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'FROM node:22-alpine\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci --omit=dev\nCOPY . .\nCMD ["npm","start"]'}</pre>
        A camada <Text code>RUN npm ci</Text> só reconstroi quando o manifesto
        muda; o <Text code>COPY . .</Text> final pega cada mudança de código.
        Recomendações: rode com usuário não-root (<Text code>USER node</Text>),
        prefira imagens slim/alpine pra reduzir tamanho e considere{' '}
        <b>multi-stage</b> — builda a app numa imagem, copia só o artefato pra
        final. A ordem usada aqui (FROM → WORKDIR → ENV → COPY → RUN → EXPOSE →
        USER → ENTRYPOINT/CMD) é a convencional.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'O Dockerfile é montado linha a linha na ordem canônica das diretivas. O modo exec usa um mini tokenizer que separa argumentos por espaço respeitando aspas duplas — é isso que transforma "npm start" em ["npm","start"] no JSON do CMD.',
  },
  en: {
    title: 'Dockerfile Generator',
    intro: (
      <>
        Builds a <Text code>Dockerfile</Text> from a form: base image, env vars,
        file copies, build steps (<Text code>RUN</Text>), exposed ports and the{' '}
        <Text code>ENTRYPOINT</Text>/<Text code>CMD</Text> pair — in the
        conventional directive order. A starting point to containerize an app in
        seconds. 100% client-side, nothing leaves the browser.
      </>
    ),
    stackTitle: 'Template (stack)',
    stackHint: 'One click applies a complete template — tweak afterwards.',
    configTitle: 'Configuration',
    baseLabel: 'Base image',
    basePlaceholder: 'node:22-alpine',
    workdirLabel: 'WORKDIR',
    workdirPlaceholder: '/app',
    labelLabel: 'LABEL (metadata, optional)',
    labelPlaceholder: 'Web Team <web@example.com>',
    envLabel: 'ENV — one KEY=VALUE per line',
    envPlaceholder: 'NODE_ENV=production\nPORT=3000',
    portsLabel: 'EXPOSE (ports separated by space or comma)',
    portsPlaceholder: '3000 8080',
    userLabel: 'USER (optional)',
    userPlaceholder: 'node',
    copyLabel: 'COPY — source → destination rows',
    copySrcPh: 'source (e.g. package.json)',
    copyDestPh: 'dest (e.g. ./)',
    addCopy: 'Add COPY row',
    stepsLabel: 'RUN — build/install commands (one per line)',
    stepsPlaceholder: 'npm ci\nnpm run build',
    stepsQuick: 'Insert common command:',
    entryLabel: 'ENTRYPOINT',
    cmdLabel: 'CMD',
    modeNone: 'none',
    modeExec: 'exec',
    modeShell: 'shell',
    entryExecPlaceholder: 'node dist/index.js',
    cmdExecPlaceholder: 'npm start',
    entryShellPlaceholder: 'nginx -g "daemon off;"',
    cmdShellPlaceholder: 'npm start',
    execHint: 'In exec mode each argument is space-separated; use quotes for an argument containing spaces.',
    commentsLabel: 'Include section comments',
    cmdPresets: 'CMD shortcuts:',
    entryPresets: 'ENTRYPOINT shortcuts:',
    outTitle: 'Generated Dockerfile',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — the Dockerfile is still built, but double-check:',
    warningsNone: 'No warnings — valid at a glance.',
    wBase: 'Base image is empty — the FROM will break.',
    wEnv: 'ENV line without "=" — expected KEY=VALUE.',
    wPorts: 'Non-numeric port in EXPOSE (e.g. 3000).',
    wCmdExec: 'CMD in exec mode without arguments.',
    wEntryExec: 'ENTRYPOINT in exec mode without arguments.',
    wCmdShell: 'CMD in shell mode is empty.',
    wEntryShell: 'ENTRYPOINT in shell mode is empty.',
    wCopy: 'COPY row missing source or destination.',
    noCmdAlert: 'No CMD nor ENTRYPOINT',
    noCmdAlertBody: (
      <>
        The image will use the base image default command (e.g. nginx starts on
        its own). If the base has no default, the container dies on{' '}
        <Text code>docker run</Text>.
      </>
    ),
    tipTitle: 'Best practices & understand the result',
    tipBody: (
      <>
        Every directive becomes a <strong>layer</strong> — Docker reuses ready
        layers from the cache, so order matters: things that change rarely
        (installing deps) come before things that change often (copying code). A
        classic pattern for a Node app:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>{'FROM node:22-alpine\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci --omit=dev\nCOPY . .\nCMD ["npm","start"]'}</pre>
        The <Text code>RUN npm ci</Text> layer only rebuilds when the manifest
        changes; the final <Text code>COPY . .</Text> picks up every code
        change. Good habits: run as a non-root user (<Text code>USER node</Text>),
        prefer slim/alpine images for a smaller footprint and consider{' '}
        <strong>multi-stage</strong> builds — build the app in one image, copy
        only the artifact into the final one. The order used here (FROM →
        WORKDIR → ENV → COPY → RUN → EXPOSE → USER → ENTRYPOINT/CMD) is the
        conventional one.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'The Dockerfile is assembled line by line in canonical order. Exec mode uses a small tokenizer that splits arguments on whitespace while respecting double quotes — that is how "npm start" becomes ["npm", "start"] in the CMD JSON.',
  },
}

// tokeniza o valor do modo exec em argumentos (respeita aspas duplas)
function execArgs(value) {
  const out = []
  const re = /"([^"]*)"|(\S+)/g
  let m
  while ((m = re.exec(String(value || '')))) {
    if (m[1] !== undefined) out.push(`"${m[1]}"`)
    else out.push(m[2])
  }
  return out
}

function linesOf(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function buildDockerfile(o) {
  const lines = []
  const warnings = []
  const add = (s) => lines.push(s)
  const section = (s) => { if (o.comments) add(s) }

  const base = String(o.base || '').trim()
  if (!base) warnings.push('base')
  section('# ── Base image ──')
  add(`FROM ${base || '<imagem-base>'}`)
  add('')

  const label = String(o.label || '').trim()
  if (label) {
    add(`LABEL maintainer="${label.replace(/"/g, '\\"')}"`)
    add('')
  }

  const workDir = String(o.workDir || '').trim()
  if (workDir) {
    section('# ── Working directory ──')
    add(`WORKDIR ${workDir}`)
    add('')
  }

  const envs = linesOf(o.env)
  if (envs.length) {
    section('# ── Environment ──')
    for (const e of envs) {
      if (!e.includes('=')) warnings.push('env')
      add(`ENV ${e}`)
    }
    add('')
  }

  const copies = o.copies.filter((c) => c.src.trim() && c.dest.trim())
  if (o.copies.length > copies.length) warnings.push('copy')
  if (copies.length) {
    section('# ── Copy files ──')
    for (const c of copies) add(`COPY ${c.src.trim()} ${c.dest.trim()}`)
    add('')
  }

  const steps = linesOf(o.steps)
  if (steps.length) {
    section('# ── Build / install ──')
    for (const s of steps) add(`RUN ${s}`)
    add('')
  }

  const ports = String(o.ports || '')
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (ports.length) {
    if (ports.some((p) => !/^\d+$/.test(p))) warnings.push('ports')
    section('# ── Ports ──')
    add(`EXPOSE ${ports.join(' ')}`)
    add('')
  }

  const user = String(o.user || '').trim()
  if (user) {
    section('# ── Non-root user ──')
    add(`USER ${user}`)
    add('')
  }

  if (o.entryMode !== 'none') {
    const v = String(o.entryValue || '').trim()
    section('# ── ENTRYPOINT ──')
    if (o.entryMode === 'exec') {
      if (!v) warnings.push('entryExec')
      add(`ENTRYPOINT ${JSON.stringify(execArgs(v))}`)
    } else {
      if (!v) warnings.push('entryShell')
      add(`ENTRYPOINT ${v}`)
    }
    add('')
  }

  if (o.cmdMode !== 'none') {
    const v = String(o.cmdValue || '').trim()
    section('# ── CMD ──')
    if (o.cmdMode === 'exec') {
      if (!v) warnings.push('cmdExec')
      add(`CMD ${JSON.stringify(execArgs(v))}`)
    } else {
      if (!v) warnings.push('cmdShell')
      add(`CMD ${v}`)
    }
    add('')
  }

  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
  return { text, warnings }
}

export default function DockerfileGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [stack, setStack] = useState('node')
  const [fields, setFields] = useState(() => ({
    base: STACKS.node.base,
    workDir: STACKS.node.workDir,
    label: '',
    env: STACKS.node.env,
    ports: STACKS.node.ports,
    user: STACKS.node.user,
    copies: STACKS.node.copies.map((c) => ({ ...c, id: cid() })),
    steps: STACKS.node.steps,
    entryMode: STACKS.node.entryMode,
    entryValue: STACKS.node.entryValue,
    cmdMode: STACKS.node.cmdMode,
    cmdValue: STACKS.node.cmdValue,
    comments: true,
  }))
  const [copied, setCopied] = useState(false)

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const resetStack = (key) => {
    const m = STACKS[key]
    setStack(key)
    setFields((f) => ({
      ...f,
      base: m.base,
      workDir: m.workDir,
      label: '',
      env: m.env,
      ports: m.ports,
      user: m.user,
      copies: m.copies.map((c) => ({ ...c, id: cid() })),
      steps: m.steps,
      entryMode: m.entryMode,
      entryValue: m.entryValue,
      cmdMode: m.cmdMode,
      cmdValue: m.cmdValue,
    }))
  }

  const updateCopy = (id, field, value) =>
    setFields((f) => ({
      ...f,
      copies: f.copies.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }))

  const removeCopy = (id) =>
    setFields((f) => ({ ...f, copies: f.copies.filter((c) => c.id !== id) }))

  const addCopy = () =>
    setFields((f) => ({ ...f, copies: [...f.copies, { id: cid(), src: '', dest: '' }] }))

  const { text, warnings } = useMemo(() => buildDockerfile(fields), [fields])

  const uniqueWarnings = Array.from(new Set(warnings))
  const noStart = fields.cmdMode === 'none' && fields.entryMode === 'none'

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  const lineCount = text.split('\n').length
  const byteCount = new TextEncoder().encode(text).length

  const copyRowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }

  const warningLabel = (w) => {
    switch (w) {
      case 'base': return t.wBase
      case 'env': return t.wEnv
      case 'ports': return t.wPorts
      case 'cmdExec': return t.wCmdExec
      case 'entryExec': return t.wEntryExec
      case 'cmdShell': return t.wCmdShell
      case 'entryShell': return t.wEntryShell
      case 'copy': return t.wCopy
      default: return w
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.stackTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.stackHint}</Text>}>
        <Segmented
          value={stack}
          onChange={resetStack}
          options={Object.keys(STACKS).map((k) => ({ label: STACKS[k].label, value: k }))}
        />
      </Card>

      <Card title={t.configTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.baseLabel}</Text>
            <AutoComplete
              value={fields.base}
              onChange={(v) => setField('base', v)}
              options={BASE_IMAGES.map((img) => ({ value: img, label: img }))}
              placeholder={t.basePlaceholder}
              style={{ width: 240 }}
              allowClear
            />
            <Text type="secondary">{t.workdirLabel}</Text>
            <Input
              value={fields.workDir}
              onChange={(e) => setField('workDir', e.target.value)}
              placeholder={t.workdirPlaceholder}
              style={{ width: 200 }}
            />
          </Space>

          <Space wrap align="center">
            <Text type="secondary">{t.labelLabel}</Text>
            <Input
              value={fields.label}
              onChange={(e) => setField('label', e.target.value)}
              placeholder={t.labelPlaceholder}
              style={{ width: 320 }}
            />
            <Text type="secondary">{t.portsLabel}</Text>
            <Input
              value={fields.ports}
              onChange={(e) => setField('ports', e.target.value)}
              placeholder={t.portsPlaceholder}
              style={{ width: 200 }}
            />
          </Space>

          <Space wrap align="center">
            <Text type="secondary">{t.userLabel}</Text>
            <Input
              value={fields.user}
              onChange={(e) => setField('user', e.target.value)}
              placeholder={t.userPlaceholder}
              style={{ width: 200 }}
            />
          </Space>

          <Divider style={{ margin: '4px 0' }} />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">{t.envLabel}</Text>
            <TextArea
              value={fields.env}
              onChange={(e) => setField('env', e.target.value)}
              placeholder={t.envPlaceholder}
              rows={3}
              style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 460 }}
            />
          </Space>

          <Divider style={{ margin: '4px 0' }} />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">{t.copyLabel}</Text>
            {fields.copies.map((c) => (
              <div key={c.id} style={copyRowStyle}>
                <Input
                  value={c.src}
                  onChange={(e) => updateCopy(c.id, 'src', e.target.value)}
                  placeholder={t.copySrcPh}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <Input
                  value={c.dest}
                  onChange={(e) => updateCopy(c.id, 'dest', e.target.value)}
                  placeholder={t.copyDestPh}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <Button size="small" icon={<DeleteOutlined />} onClick={() => removeCopy(c.id)} danger />
              </div>
            ))}
            <Button size="small" icon={<PlusOutlined />} onClick={addCopy}>
              {t.addCopy}
            </Button>
          </Space>

          <Divider style={{ margin: '4px 0' }} />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">{t.stepsLabel}</Text>
            <TextArea
              value={fields.steps}
              onChange={(e) => setField('steps', e.target.value)}
              placeholder={t.stepsPlaceholder}
              rows={4}
              style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 520 }}
            />
            <Space wrap>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.stepsQuick}</Text>
              {COMMON_STEPS.map((s) => (
                <Button key={s} size="small" onClick={() => setField('steps', fields.steps ? fields.steps + '\n' + s : s)}>
                  {s}
                </Button>
              ))}
            </Space>
          </Space>
        </Space>
      </Card>

      <Card title={`${t.entryLabel} / ${t.cmdLabel}`}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text strong>{t.entryLabel}</Text>
            <Segmented
              value={fields.entryMode}
              onChange={(v) => setField('entryMode', v)}
              options={[
                { label: t.modeNone, value: 'none' },
                { label: t.modeExec, value: 'exec' },
                { label: t.modeShell, value: 'shell' },
              ]}
            />
            {fields.entryMode !== 'none' && (
              <Input
                value={fields.entryValue}
                onChange={(e) => setField('entryValue', e.target.value)}
                placeholder={fields.entryMode === 'exec' ? t.entryExecPlaceholder : t.entryShellPlaceholder}
                style={{ width: 320, fontFamily: 'monospace', fontSize: 12 }}
              />
            )}
          </Space>

          <Space wrap align="center">
            <Text strong>{t.cmdLabel}</Text>
            <Segmented
              value={fields.cmdMode}
              onChange={(v) => setField('cmdMode', v)}
              options={[
                { label: t.modeNone, value: 'none' },
                { label: t.modeExec, value: 'exec' },
                { label: t.modeShell, value: 'shell' },
              ]}
            />
            {fields.cmdMode !== 'none' && (
              <Input
                value={fields.cmdValue}
                onChange={(e) => setField('cmdValue', e.target.value)}
                placeholder={fields.cmdMode === 'exec' ? t.cmdExecPlaceholder : t.cmdShellPlaceholder}
                style={{ width: 320, fontFamily: 'monospace', fontSize: 12 }}
              />
            )}
          </Space>

          <Space wrap>
            <Text type="secondary">{t.cmdPresets}</Text>
            {CMD_PRESETS.map((p) => (
              <Button key={p.value} size="small" onClick={() => { setField('cmdMode', 'exec'); setField('cmdValue', p.value) }}>
                {p.label}
              </Button>
            ))}
          </Space>

          <Space wrap>
            <Text type="secondary">{t.entryPresets}</Text>
            {ENTRY_PRESETS.map((p) => (
              <Button key={p.value} size="small" onClick={() => { setField('entryMode', 'exec'); setField('entryValue', p.value) }}>
                {p.label}
              </Button>
            ))}
          </Space>

          <Space align="center">
            <Text type="secondary">{t.commentsLabel}</Text>
            <Switch checked={fields.comments} onChange={(v) => setField('comments', v)} />
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.execHint}</Text>
        </Space>
      </Card>

      <Card title={t.outTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.stats(lineCount, byteCount)}</Text>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, background: '#fafafa', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
            <code>{text}</code>
          </pre>
          <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
            {copied ? t.copied : t.copy}
          </Button>
          {noStart && (
            <Alert type="info" showIcon message={t.noCmdAlert} description={t.noCmdAlertBody} />
          )}
          <Alert
            type={uniqueWarnings.length ? 'warning' : 'success'}
            showIcon
            message={uniqueWarnings.length ? t.warningsTitle : t.warningsNone}
            description={
              uniqueWarnings.length ? (
                <Space direction="vertical" size={0}>
                  {uniqueWarnings.map((w) => (
                    <Text key={w} style={{ fontSize: 12 }}>· {warningLabel(w)}</Text>
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

      <Card title={t.howItWorks}>
        <Paragraph type="secondary">{t.howItWorksDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>dockerfile-builder.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}