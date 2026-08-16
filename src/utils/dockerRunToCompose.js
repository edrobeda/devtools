// Converte um comando `docker run ...` em um serviço docker-compose.yml
// equivalente. Parser 100% client-side — nenhum dado sai do navegador.
//
// Suporte: name, hostname, restart, network, publish, expose, volume,
// mount, env, env-file, label, user, workdir, entrypoint, command,
// dns, extra-hosts, add-host, mac-address, ip, memory, cpus, healthcheck,
// log-driver, log-opt, cap-add/drop, security-opt, device, tmpfs, sysctl,
// ulimits, privileged, read-only, init, pull, platform e mais.

const NO_VALUE_SHORT = new Set(['d', 'i', 't', 'P'])
const VALUE_SHORT = new Set([
  'p', 'e', 'v', 'u', 'w', 'h', 'l', 'm', 'c', 'L',
])
const NO_VALUE_LONG = new Set([
  '--detach', '--interactive', '--tty', '--publish-all',
  '--rm', '--privileged', '--read-only', '--init', '--no-healthcheck',
  '--oom-kill-disable',
])

function tokenize(cmd) {
  const tokens = []
  let i = 0
  const len = cmd.length

  while (i < len) {
    while (i < len && /\s/.test(cmd[i])) i++
    if (i >= len) break

    if (cmd[i] === '"' || cmd[i] === "'") {
      const quote = cmd[i]
      let value = ''
      i++
      while (i < len && cmd[i] !== quote) {
        if (cmd[i] === '\\' && i + 1 < len && cmd[i + 1] === quote) {
          value += quote
          i += 2
        } else {
          value += cmd[i]
          i++
        }
      }
      if (i < len) i++ // fecha aspas
      tokens.push(value)
    } else {
      let value = ''
      while (i < len && !/\s/.test(cmd[i])) {
        if (cmd[i] === '\\' && i + 1 < len) {
          value += cmd[i + 1]
          i += 2
        } else {
          value += cmd[i]
          i++
        }
      }
      tokens.push(value)
    }
  }

  return tokens
}

function isFlag(t) {
  return t && t[0] === '-'
}

function splitLongFlag(t) {
  if (t.startsWith('--')) {
    const eq = t.indexOf('=')
    if (eq > 2) return [t.slice(0, eq), t.slice(eq + 1)]
    return [t, null]
  }
  return null
}

function ensureMap(obj, key) {
  if (!obj[key]) obj[key] = {}
  return obj[key]
}

function ensureArray(obj, key) {
  if (!obj[key]) obj[key] = []
  return obj[key]
}

function pushWarn(result, code, detail) {
  result.warnings.push({ code, detail })
}

export function dockerRunToCompose(input) {
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

  // remove prefixo "docker" e "run" se existirem
  const tokens = tokenize(cmd)
  let i = 0
  if (tokens[i] === 'docker') i++
  if (tokens[i] === 'run') i++
  if (i >= tokens.length) return result

  const svc = result.service
  let image = null
  let commandArgs = []

  const consumeValue = () => {
    if (i >= tokens.length) {
      pushWarn(result, 'missingValue', 'Flag esperava um valor')
      return null
    }
    return tokens[i++]
  }

  while (i < tokens.length) {
    const raw = tokens[i]

    if (!isFlag(raw)) {
      image = raw
      i++
      commandArgs = tokens.slice(i)
      break
    }

    i++

    // ── short flags --------------------------------------------------------
    if (raw.startsWith('-') && !raw.startsWith('--')) {
      const opt = raw[1]
      const rest = raw.slice(2)

      // flags booleanas combinadas: -it, -dP
      if (rest === '' || (NO_VALUE_SHORT.has(opt) && [...rest].every((c) => NO_VALUE_SHORT.has(c)))) {
        const chars = rest ? [opt, ...rest] : [opt]
        for (const c of chars) {
          switch (c) {
            case 'd':
              result.usedSimpleDetach = true
              break
            case 'i':
              svc.stdin_open = true
              break
            case 't':
              svc.tty = true
              break
            case 'P':
              pushWarn(result, 'publishAll', 'docker run -P publica todas as portas expostas; compose não tem equivalente direto.')
              break
            default:
              result.unsupported.push('-' + c)
          }
        }
        continue
      }

      // short flag com valor inline: -p80:80, -eKEY=VAL
      if (VALUE_SHORT.has(opt)) {
        const flag = {
          p: '--publish', e: '--env', v: '--volume', u: '--user',
          w: '--workdir', h: '--hostname', l: '--label', m: '--memory',
          c: '--cpu-shares', L: '--label',
        }[opt]
        i-- // devolve o token para o loop tratar como long flag inline
        tokens[i] = flag + '=' + rest
        continue
      }

      result.unsupported.push(raw)
      continue
    }

    // ── long flags ---------------------------------------------------------
    const long = splitLongFlag(raw)
    let flag = raw
    let inline = null
    if (long) {
      flag = long[0]
      inline = long[1]
    }

    const hasValue = !NO_VALUE_LONG.has(flag)
    let value = inline !== null ? inline : hasValue ? consumeValue() : true

    switch (flag) {
      case '--name':
        if (value) {
          result.serviceName = safeName(value)
          svc.container_name = value
        }
        break
      case '-h':
      case '--hostname':
        svc.hostname = value
        break
      case '--restart':
        svc.restart = value
        break
      case '--network':
        if (value) {
          ensureArray(svc, 'networks').push(value)
          result.networks[value] = {}
        }
        break
      case '--net-alias':
        if (value) {
          if (!svc.networks || svc.networks.length === 0) {
            pushWarn(result, 'aliasWithoutNetwork', 'net-alias sem --network definido')
          }
          ensureArray(svc, 'aliases').push(value)
        }
        break
      case '-p':
      case '--publish':
        if (value) ensureArray(svc, 'ports').push(value)
        break
      case '--expose':
        if (value) ensureArray(svc, 'expose').push(value)
        break
      case '-v':
      case '--volume':
        if (value) ensureArray(svc, 'volumes').push(value)
        break
      case '--mount':
        if (value) parseMount(value, svc, result)
        break
      case '-e':
      case '--env':
        if (value) parseEnv(value, svc)
        break
      case '--env-file':
        ensureArray(svc, 'env_file').push(value)
        break
      case '-l':
      case '--label':
        if (value) parseLabel(value, svc)
        break
      case '-u':
      case '--user':
        svc.user = value
        break
      case '-w':
      case '--workdir':
        svc.working_dir = value
        break
      case '--entrypoint':
        svc.entrypoint = value
        break
      case '--privileged':
        svc.privileged = true
        break
      case '--read-only':
        svc.read_only = true
        break
      case '--init':
        svc.init = true
        break
      case '--rm':
        pushWarn(result, 'rmIgnored', 'docker run --rm não tem equivalente em docker-compose.yml (o compose usa docker-compose down).')
        break
      case '-d':
      case '--detach':
        result.usedSimpleDetach = true
        break
      case '--pull':
        svc.pull_policy = value
        break
      case '--platform':
        svc.platform = value
        break
      case '--dns':
        if (value) ensureArray(svc, 'dns').push(value)
        break
      case '--dns-search':
        if (value) ensureArray(svc, 'dns_search').push(value)
        break
      case '--add-host':
      case '--extra-host':
        if (value) ensureArray(svc, 'extra_hosts').push(value)
        break
      case '--mac-address':
        svc.mac_address = value
        break
      case '--ip':
        if (!svc.networks || svc.networks.length === 0) {
          pushWarn(result, 'ipWithoutNetwork', '--ip exige que o serviço esteja em uma rede com configuração')
        }
        svc.ipv4_address = value
        break
      case '--ip6':
        if (!svc.networks || svc.networks.length === 0) {
          pushWarn(result, 'ip6WithoutNetwork', '--ip6 exige rede configurada')
        }
        svc.ipv6_address = value
        break
      case '--link':
        if (value) {
          ensureArray(svc, 'depends_on').push(value.split(':')[0])
          pushWarn(result, 'legacyLink', 'docker run --link é legado; mapeado como depends_on. Prefira networks.')
        }
        break
      case '-m':
      case '--memory':
        svc.mem_limit = value
        break
      case '--memory-swap':
        svc.memswap_limit = value
        break
      case '--memory-reservation':
        svc.mem_reservation = value
        break
      case '--cpus':
        svc.cpus = parseFloat(value)
        break
      case '--cpu-shares':
        svc.cpu_shares = parseInt(value, 10)
        break
      case '--cpu-quota':
        svc.cpu_quota = parseInt(value, 10)
        break
      case '--cpu-period':
        svc.cpu_period = parseInt(value, 10)
        break
      case '--blkio-weight':
        svc.blkio_weight = parseInt(value, 10)
        break
      case '--pids-limit':
        svc.pids_limit = parseInt(value, 10)
        break
      case '--shm-size':
        svc.shm_size = value
        break
      case '--log-driver':
        ensureMap(svc, 'logging').driver = value
        break
      case '--log-opt':
        if (value) {
          const log = ensureMap(svc, 'logging')
          if (!log.options) log.options = {}
          parseKeyValue(value, log.options)
        }
        break
      case '--cap-add':
        if (value) ensureArray(svc, 'cap_add').push(value)
        break
      case '--cap-drop':
        if (value) ensureArray(svc, 'cap_drop').push(value)
        break
      case '--security-opt':
        if (value) ensureArray(svc, 'security_opt').push(value)
        break
      case '--device':
        if (value) ensureArray(svc, 'devices').push(value)
        break
      case '--device-read-bps':
      case '--device-write-bps':
      case '--device-read-iops':
      case '--device-write-iops':
        result.unsupported.push(flag)
        break
      case '--tmpfs':
        if (value) {
          ensureMap(svc, 'tmpfs')[value] = ''
        }
        break
      case '--sysctl':
        if (value) {
          const sys = ensureMap(svc, 'sysctls')
          parseKeyValue(value, sys)
        }
        break
      case '--ulimit':
        if (value) parseUlimit(value, svc)
        break
      case '--health-cmd':
        ensureMap(svc, 'healthcheck').test = ['CMD-SHELL', value]
        break
      case '--health-interval':
        ensureMap(svc, 'healthcheck').interval = value
        break
      case '--health-timeout':
        ensureMap(svc, 'healthcheck').timeout = value
        break
      case '--health-retries':
        ensureMap(svc, 'healthcheck').retries = parseInt(value, 10)
        break
      case '--health-start-period':
        ensureMap(svc, 'healthcheck').start_period = value
        break
      case '--health-start-interval':
        ensureMap(svc, 'healthcheck').start_interval = value
        break
      case '--no-healthcheck':
        ensureMap(svc, 'healthcheck').disable = true
        break
      case '--gpus':
        parseGpus(value, svc)
        break
      case '--group-add':
        if (value) ensureArray(svc, 'group_add').push(value)
        break
      case '--publish-all':
        pushWarn(result, 'publishAll', 'docker run --publish-all publica todas as portas expostas; compose não tem equivalente direto.')
        break
      default:
        result.unsupported.push(flag)
    }
  }

  if (image) svc.image = image
  if (commandArgs.length) svc.command = commandArgs

  // Normaliza networks: se houver ip/aliases, precisamos do formato longo.
  if (svc.ipv4_address || svc.ipv6_address || svc.aliases) {
    const nets = {}
    ;(svc.networks || []).forEach((n) => {
      nets[n] = {}
      if (svc.ipv4_address) nets[n].ipv4_address = svc.ipv4_address
      if (svc.ipv6_address) nets[n].ipv6_address = svc.ipv6_address
      if (svc.aliases && svc.aliases.length) nets[n].aliases = svc.aliases
    })
    delete svc.ipv4_address
    delete svc.ipv6_address
    delete svc.aliases
    svc.networks = nets
  }

  // named volumes detectados em -v
  if (svc.volumes) {
    svc.volumes.forEach((v) => {
      const src = String(v).split(':')[0]
      if (src && src[0] !== '.' && src[0] !== '/' && src !== '\\') {
        result.volumes[src] = {}
      }
    })
  }

  if (!Object.keys(result.networks).length) delete result.networks
  if (!Object.keys(result.volumes).length) delete result.volumes

  return result
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '-')
}

function parseEnv(value, svc) {
  const eq = value.indexOf('=')
  const env = ensureMap(svc, 'environment')
  if (eq === -1) {
    env[value] = null
  } else {
    env[value.slice(0, eq)] = value.slice(eq + 1)
  }
}

function parseLabel(value, svc) {
  const eq = value.indexOf('=')
  const labels = ensureMap(svc, 'labels')
  if (eq === -1) labels[value] = ''
  else labels[value.slice(0, eq)] = value.slice(eq + 1)
}

function parseKeyValue(value, target) {
  const eq = value.indexOf('=')
  if (eq === -1) target[value] = ''
  else target[value.slice(0, eq)] = value.slice(eq + 1)
}

function parseMount(value, svc, result) {
  const parts = value.split(',')
  const opts = {}
  parts.forEach((p) => {
    const [k, v] = p.split('=')
    opts[k.trim()] = v === undefined ? true : v.trim()
  })

  const type = opts.type || 'bind'
  const source = opts.source || opts.src
  const target = opts.target || opts.destination || opts.dst
  const ro = opts.readonly ? ':ro' : ''

  if (type === 'bind' && source && target) {
    ensureArray(svc, 'volumes').push(source + ':' + target + ro)
  } else if (type === 'volume' && source && target) {
    ensureArray(svc, 'volumes').push(source + ':' + target + ro)
    result.volumes[source] = {}
  } else if (type === 'tmpfs') {
    ensureMap(svc, 'tmpfs')[target] = ''
  } else {
    result.unsupported.push('--mount=' + value)
  }
}

function parseUlimit(value, svc) {
  const eq = value.indexOf('=')
  if (eq === -1) return
  const key = value.slice(0, eq)
  const rest = value.slice(eq + 1)
  const ul = ensureMap(svc, 'ulimits')
  if (rest.indexOf(':') === -1) {
    ul[key] = parseInt(rest, 10)
  } else {
    const [soft, hard] = rest.split(':')
    ul[key] = { soft: parseInt(soft, 10), hard: parseInt(hard, 10) }
  }
}

function parseGpus(value, svc) {
  const deploy = ensureMap(svc, 'deploy')
  const res = ensureMap(deploy, 'resources')
  const reservations = ensureMap(res, 'reservations')
  if (!reservations.devices) reservations.devices = []
  const count = value === 'all' ? 'all' : parseInt(value, 10)
  reservations.devices.push({
    driver: 'nvidia',
    count: isNaN(count) ? 'all' : count,
    capabilities: ['gpu'],
  })
}

// ─── Serialização para YAML ─────────────────────────────────────────────────
function yamlScalar(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s === '') return '""'
  if (/^[A-Za-z0-9_./:@~+-]+$/.test(s)) return s
  return JSON.stringify(s)
}

function yamlKey(k) {
  return /^[A-Za-z0-9_.\-]+$/.test(k) ? k : JSON.stringify(k)
}

function indent(n) {
  return '  '.repeat(n)
}

function serializeValue(v, depth) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return yamlScalar(v)
  if (Array.isArray(v)) {
    if (!v.length) return '[]'
    return '\n' + v.map((item) => indent(depth) + '- ' + serializeValue(item, depth + 1).trimStart()).join('\n')
  }
  const entries = Object.entries(v)
  if (!entries.length) return '{}'
  return '\n' + entries
    .map(([k, val]) => {
      const scalar = serializeValue(val, depth + 1)
      if (scalar.startsWith('\n')) {
        return indent(depth) + yamlKey(k) + ':' + scalar
      }
      return indent(depth) + yamlKey(k) + ': ' + scalar
    })
    .join('\n')
}

export function buildComposeYaml(result) {
  const out = []
  out.push('services:')
  out.push(indent(1) + yamlKey(result.serviceName) + ':')

  const entries = Object.entries(result.service)
  if (!entries.length) {
    out.push(indent(2) + 'image: ""')
  } else {
    entries.forEach(([k, v]) => {
      const scalar = serializeValue(v, 2)
      if (scalar.startsWith('\n')) {
        out.push(indent(2) + yamlKey(k) + ':' + scalar)
      } else {
        out.push(indent(2) + yamlKey(k) + ': ' + scalar)
      }
    })
  }

  if (result.volumes && Object.keys(result.volumes).length) {
    out.push('')
    out.push('volumes:')
    Object.keys(result.volumes).forEach((k) => {
      out.push(indent(1) + yamlKey(k) + ':')
    })
  }

  if (result.networks && Object.keys(result.networks).length) {
    out.push('')
    out.push('networks:')
    Object.keys(result.networks).forEach((k) => {
      out.push(indent(1) + yamlKey(k) + ':')
    })
  }

  return out.join('\n') + '\n'
}

export const PRESETS = {
  node: {
    key: 'node',
    pt: 'App Node.js + Postgres',
    en: 'Node.js + Postgres app',
    cmd: 'docker run -d --name api --restart unless-stopped -p 3000:3000 -e NODE_ENV=production -e DATABASE_URL=postgres://app:app@db:5432/app --network appnet -v ./logs:/app/logs node:22-alpine npm start',
  },
  nginx: {
    key: 'nginx',
    pt: 'Nginx estático',
    en: 'Static Nginx',
    cmd: 'docker run -d --name web --hostname web -p 80:80 -v ./dist:/usr/share/nginx/html:ro nginx:alpine',
  },
  redis: {
    key: 'redis',
    pt: 'Redis com healthcheck',
    en: 'Redis with healthcheck',
    cmd: 'docker run -d --name cache --restart always --log-driver json-file --log-opt max-size=10m --memory 256m --cpus 0.5 --health-cmd="redis-cli ping" --health-interval 10s --health-retries 3 -p 6379:6379 redis:7-alpine',
  },
  advanced: {
    key: 'advanced',
    pt: 'Exemplo avançado',
    en: 'Advanced example',
    cmd: 'docker run -d --name worker --read-only --init --user 1000:1000 --workdir /app --dns 8.8.8.8 --add-host db:192.168.1.10 --cap-drop ALL --cap-add NET_BIND_SERVICE --tmpfs /tmp --ulimit nofile=1024:2048 --label app=batch --label env=prod ubuntu:24.04 ./worker',
  },
}
