import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Alert, Collapse, Segmented, message,
} from 'antd'
import { ContainerOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { dockerRunToCompose, buildComposeYaml, PRESETS } from '../utils/dockerRunToCompose'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE = `function dockerRunToCompose(input) {
  const result = {
    serviceName: 'app',
    service: {},
    networks: {},
    volumes: {},
    warnings: [],
    unsupported: [],
    usedSimpleDetach: false,
  }

  let cmd = String(input || '').trim()
  if (!cmd) return result

  const tokens = tokenize(cmd)
  let i = 0
  if (tokens[i] === 'docker') i++
  if (tokens[i] === 'run') i++

  const svc = result.service
  let image = null
  let commandArgs = []

  while (i < tokens.length) {
    const raw = tokens[i]
    if (raw[0] !== '-') {
      image = raw
      i++
      commandArgs = tokens.slice(i)
      break
    }
    i++

    // short flags inline (-p80:80) e combinadas (-it)
    if (raw.startsWith('-') && !raw.startsWith('--')) {
      const opt = raw[1]
      const rest = raw.slice(2)
      if (rest === '' || isCombinedNoArg(opt, rest)) {
        applyShortFlags([opt, ...rest], result, svc)
        continue
      }
      applyShortFlagWithValue(opt, rest, result, svc)
      continue
    }

    // long flags: --name api ou --name=api
    const [flag, inline] = splitLongFlag(raw)
    const value = inline !== null ? inline : consumeNext()

    switch (flag) {
      case '--name': result.serviceName = safeName(value); svc.container_name = value; break
      case '--hostname': svc.hostname = value; break
      case '--restart': svc.restart = value; break
      case '--network': svc.networks = [...(svc.networks||[]), value]; result.networks[value] = {}; break
      case '-p':
      case '--publish': svc.ports = [...(svc.ports||[]), value]; break
      case '--expose': svc.expose = [...(svc.expose||[]), value]; break
      case '-v':
      case '--volume': svc.volumes = [...(svc.volumes||[]), value]; break
      case '--mount': parseMount(value, svc, result); break
      case '-e':
      case '--env': parseEnv(value, svc); break
      case '--env-file': svc.env_file = [...(svc.env_file||[]), value]; break
      case '-l':
      case '--label': parseLabel(value, svc); break
      case '-u':
      case '--user': svc.user = value; break
      case '-w':
      case '--workdir': svc.working_dir = value; break
      case '--entrypoint': svc.entrypoint = value; break
      case '--privileged': svc.privileged = true; break
      case '--read-only': svc.read_only = true; break
      case '--init': svc.init = true; break
      case '--rm': warn('rm ignored'); break
      case '-d':
      case '--detach': result.usedSimpleDetach = true; break
      case '--pull': svc.pull_policy = value; break
      case '--platform': svc.platform = value; break
      case '--dns': svc.dns = [...(svc.dns||[]), value]; break
      case '--add-host': svc.extra_hosts = [...(svc.extra_hosts||[]), value]; break
      case '--mac-address': svc.mac_address = value; break
      case '--ip': svc.ipv4_address = value; break
      case '-m':
      case '--memory': svc.mem_limit = value; break
      case '--cpus': svc.cpus = parseFloat(value); break
      case '--cap-add': svc.cap_add = [...(svc.cap_add||[]), value]; break
      case '--cap-drop': svc.cap_drop = [...(svc.cap_drop||[]), value]; break
      case '--security-opt': svc.security_opt = [...(svc.security_opt||[]), value]; break
      case '--device': svc.devices = [...(svc.devices||[]), value]; break
      case '--tmpfs': svc.tmpfs = { ...svc.tmpfs, [value]: '' }; break
      case '--sysctl': parseKeyValue(value, ensureMap(svc, 'sysctls')); break
      case '--ulimit': parseUlimit(value, svc); break
      case '--health-cmd': svc.healthcheck = { ...svc.healthcheck, test: ['CMD-SHELL', value] }; break
      case '--health-interval': svc.healthcheck = { ...svc.healthcheck, interval: value }; break
      case '--health-retries': svc.healthcheck = { ...svc.healthcheck, retries: parseInt(value) }; break
      case '--no-healthcheck': svc.healthcheck = { ...svc.healthcheck, disable: true }; break
      case '--gpus': parseGpus(value, svc); break
      default: result.unsupported.push(flag)
    }
  }

  if (image) svc.image = image
  if (commandArgs.length) svc.command = commandArgs

  // networks com IP precisam do formato longo
  if (svc.ipv4_address) {
    const nets = {}
    ;(svc.networks || []).forEach(n => nets[n] = { ipv4_address: svc.ipv4_address })
    svc.networks = nets
    delete svc.ipv4_address
  }

  // volumes nomeados
  if (svc.volumes) {
    svc.volumes.forEach(v => {
      const src = String(v).split(':')[0]
      if (src && src[0] !== '.' && src[0] !== '/') result.volumes[src] = {}
    })
  }

  return result
}

function buildComposeYaml(result) {
  const out = ['services:', '  ' + result.serviceName + ':']
  Object.entries(result.service).forEach(([k, v]) => {
    out.push('    ' + k + ': ' + JSON.stringify(v))
  })
  if (Object.keys(result.volumes).length) {
    out.push('volumes:')
    Object.keys(result.volumes).forEach(k => out.push('  ' + k + ':'))
  }
  if (Object.keys(result.networks).length) {
    out.push('networks:')
    Object.keys(result.networks).forEach(k => out.push('  ' + k + ':'))
  }
  return out.join('\\n') + '\\n'
}`.trim()

const translations = {
  pt: {
    title: 'Docker run → Compose',
    intro: (
      <>
        Cole um comando <Text code>docker run</Text> e obtenha o serviço
        equivalente em <Text code>docker-compose.yml</Text>. Útil quando você
        já tem o comando perfeito e quer versionar a stack. O parser roda
        100% no navegador — nenhum dado sai daqui.
      </>
    ),
    presetTitle: 'Exemplos',
    presetHint: 'Um clique preenche o comando.',
    inputTitle: 'Comando docker run',
    inputPh: 'docker run -d --name app -p 3000:3000 ...',
    outputTitle: 'docker-compose.yml',
    copy: 'Copiar YAML',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos',
    unsupportedTitle: 'Flags não mapeadas',
    unsupportedNone: 'Todas as flags conhecidas foram convertidas.',
    detachInfo: 'A flag -d/--detach é implícita no docker compose up -d; ela foi ignorada na conversão.',
    limitationsTitle: 'Limitações conhecidas',
    limitationsBody: (
      <>
        O conversor cobre as flags mais comuns de <Text code>docker run</Text>.
        Algumas opções de runtime (ex.: <Text code>--runtime</Text>,{' '}
        <Text code>--storage-opt</Text>, <Text code>--volumes-from</Text>,{' '}
        <Text code>--device-*</Text>) não têm equivalente direto no Compose ou
        dependem da versão da especificação. Sempre revise o YAML gerado antes
        de subir em produção.
      </>
    ),
    howItWorks: 'Como funciona — algoritmo-fonte',
    howItWorksDesc:
      'O comando é tokenizado respeitando aspas, depois cada flag é mapeada para a chave equivalente do Compose. Ao final o objeto JavaScript é serializado em YAML com indentação de 2 espaços. O mesmo algoritmo exibido aqui é o que roda na página.',
    wPublishAll: 'Publicação de todas as portas (-P) não tem equivalente direto.',
    wRmIgnored: '--rm foi ignorado (use docker compose down).',
    wLegacyLink: '--link é legado; mapeado como depends_on.',
    wAliasWithoutNetwork: 'net-alias usado sem --network.',
    wIpWithoutNetwork: '--ip exige rede configurada.',
    wIp6WithoutNetwork: '--ip6 exige rede configurada.',
    wMissingValue: 'Flag sem valor.',
  },
  en: {
    title: 'Docker run → Compose',
    intro: (
      <>
        Paste a <Text code>docker run</Text> command and get the equivalent{' '}
        <Text code>docker-compose.yml</Text> service. Handy when you already
        have the perfect one-liner and want to version the stack. The parser
        runs 100% in the browser — no data leaves this page.
      </>
    ),
    presetTitle: 'Examples',
    presetHint: 'One click fills the command.',
    inputTitle: 'docker run command',
    inputPh: 'docker run -d --name app -p 3000:3000 ...',
    outputTitle: 'docker-compose.yml',
    copy: 'Copy YAML',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings',
    unsupportedTitle: 'Unmapped flags',
    unsupportedNone: 'All known flags were converted.',
    detachInfo: '-d/--detach is implicit in docker compose up -d; it was ignored during conversion.',
    limitationsTitle: 'Known limitations',
    limitationsBody: (
      <>
        The converter covers the most common <Text code>docker run</Text>{' '}
        flags. Some runtime options (e.g. <Text code>--runtime</Text>,{' '}
        <Text code>--storage-opt</Text>, <Text code>--volumes-from</Text>,{' '}
        <Text code>--device-*</Text>) have no direct Compose equivalent or
        depend on the spec version. Always review the generated YAML before
        deploying to production.
      </>
    ),
    howItWorks: 'How it works — source algorithm',
    howItWorksDesc:
      'The command is tokenized honoring quotes, then each flag is mapped to the equivalent Compose key. Finally the JavaScript object is serialized to YAML with 2-space indentation. The exact algorithm shown here is what runs on the page.',
    wPublishAll: 'Publish all ports (-P) has no direct equivalent.',
    wRmIgnored: '--rm was ignored (use docker compose down).',
    wLegacyLink: '--link is legacy; mapped as depends_on.',
    wAliasWithoutNetwork: 'net-alias used without --network.',
    wIpWithoutNetwork: '--ip requires a configured network.',
    wIp6WithoutNetwork: '--ip6 requires a configured network.',
    wMissingValue: 'Flag missing value.',
  },
}

const warningText = (w, t) => {
  switch (w.code) {
    case 'publishAll': return t.wPublishAll
    case 'rmIgnored': return t.wRmIgnored
    case 'legacyLink': return t.wLegacyLink
    case 'aliasWithoutNetwork': return t.wAliasWithoutNetwork
    case 'ipWithoutNetwork': return t.wIpWithoutNetwork
    case 'ip6WithoutNetwork': return t.wIp6WithoutNetwork
    case 'missingValue': return t.wMissingValue
    default: return w.detail || w.code
  }
}

export default function DockerRunToComposePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(PRESETS.node.cmd)
  const [copied, setCopied] = useState(false)
  const [presetKey, setPresetKey] = useState('node')

  const parsed = useMemo(() => dockerRunToCompose(input), [input])
  const yaml = useMemo(() => buildComposeYaml(parsed), [parsed])

  const lineCount = yaml.split('\n').length
  const byteCount = new TextEncoder().encode(yaml).length

  const applyPreset = (key) => {
    setPresetKey(key)
    setInput(PRESETS[key].cmd)
  }

  const presetOptions = Object.keys(PRESETS).map((k) => ({
    value: k,
    label: PRESETS[k][lang],
  }))

  async function copy() {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  const hasWarnings = parsed.warnings.length > 0
  const hasUnsupported = parsed.unsupported.length > 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetHint}</Text>}>
        <Segmented value={presetKey} onChange={applyPreset} options={presetOptions} />
      </Card>

      <Card title={t.inputTitle}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.inputPh}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Card>

      <Card
        title={t.outputTitle}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.stats(lineCount, byteCount)}</Text>}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, background: '#fafafa', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
            <code>{yaml}</code>
          </pre>
          <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
            {copied ? t.copied : t.copy}
          </Button>

          {parsed.usedSimpleDetach && (
            <Alert type="info" showIcon message={t.detachInfo} />
          )}

          {hasWarnings && (
            <Alert
              type="warning"
              showIcon
              message={t.warningsTitle}
              description={
                <Space direction="vertical" size={0}>
                  {parsed.warnings.map((w, idx) => (
                    <Text key={idx} style={{ fontSize: 12 }}>· {warningText(w, t)}</Text>
                  ))}
                </Space>
              }
            />
          )}

          {hasUnsupported ? (
            <Alert
              type="warning"
              showIcon
              message={t.unsupportedTitle}
              description={
                <Space direction="vertical" size={0}>
                  {parsed.unsupported.map((u, idx) => (
                    <Text key={idx} style={{ fontSize: 12 }}>· {u}</Text>
                  ))}
                </Space>
              }
            />
          ) : (
            <Alert type="success" showIcon message={t.unsupportedNone} />
          )}
        </Space>
      </Card>

      <Card title={t.limitationsTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.limitationsBody}</Paragraph>
      </Card>

      <Card title={t.howItWorks}>
        <Paragraph type="secondary">{t.howItWorksDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>dockerRunToCompose.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
