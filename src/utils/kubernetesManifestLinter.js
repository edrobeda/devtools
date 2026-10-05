// ─────────────────────────────────────────────────────────────
// Linter de Manifestos Kubernetes — 100% client-side.
//
// Recebe o texto de um manifesto (YAML multi-document, ou JSON) e
// devolve uma lista de achados com severidade (error / warning / info).
// Nada sai do navegador: o parser é o mesmo do formatador de YAML
// do projeto (utils/yamlFormatter.js), dividido em documentos na
// linha `---`.
//
// Três camadas de checagem:
//   1. estrutura   — apiVersion/kind/metadata, nome RFC 1123,
//                    apiVersion depreciada, recursos duplicados
//   2. por kind    — Deployment, StatefulSet, DaemonSet, Job,
//                    CronJob, Pod, Service, Ingress, ConfigMap,
//                    Secret, PVC, Role/ClusterRole, RoleBinding,
//                    ServiceAccount, HPA
//   3. cruzada     — selector do Service vs. labels do workload,
//                    targetPort vs. containerPort, Ingress backend
//                    vs. Service, RoleBinding vs. Role/SA, HPA
//                    vs. workload
//
// Cada achado sai como { severity, code, doc, path, ctx } — a
// mensagem traduzida (pt/en) fica na página, em PROBLEMS[code].
// ─────────────────────────────────────────────────────────────

import { parseYaml } from './yamlFormatter.js'

// ─── Helpers ──────────────────────────────────────────────────

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function asArray(v) {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

function obj(o, k) {
  return isObj(o) && isObj(o[k]) ? o[k] : null
}

function getPath(o, path) {
  let cur = o
  for (const part of path.split('.')) {
    if (!isObj(cur)) return undefined
    cur = cur[part]
  }
  return cur
}

const NAME_RE = /^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/
const CONFIGMAP_KEY_RE = /^[._a-zA-Z0-9-]+$/
const SECRET_HINT_RE = /(senha|password|passwd|secret|token|api[_-]?key|private[_-]?key|credential|auth)/i

const SEVERITIES = ['error', 'warning', 'info']

// ─── Catálogo de apiVersion ─────────────────────────────────────
// O grupo core (v1) não tem prefixo; todo o resto é group/version.

const KNOWN_API = new Set([
  'v1',
  'apps/v1',
  'batch/v1',
  'batch/v1beta1',
  'networking.k8s.io/v1',
  'rbac.authorization.k8s.io/v1',
  'autoscaling/v1',
  'autoscaling/v2',
  'policy/v1',
  'apiextensions.k8s.io/v1',
  'admissionregistration.k8s.io/v1',
  'apiregistration.k8s.io/v1',
  'authentication.k8s.io/v1',
  'authorization.k8s.io/v1',
  'storage.k8s.io/v1',
  'scheduling.k8s.io/v1',
  'coordination.k8s.io/v1',
  'node.k8s.io/v1',
  'discovery.k8s.io/v1',
  'events.k8s.io/v1',
  'cert-manager.io/v1',
  'monitoring.coreos.com/v1',
  'networking.istio.io/v1',
  'external-secrets.io/v1',
  'keda.sh/v1alpha1',
])

const DEPRECATED_API = new Set([
  'extensions/v1beta1',
  'apps/v1beta1',
  'apps/v1beta2',
  'apps/v2alpha1',
  'networking.k8s.io/v1beta1',
  'rbac.authorization.k8s.io/v1beta1',
  'autoscaling/v2beta2',
  'autoscaling/v2beta1',
  'policy/v1beta1',
  'apiextensions.k8s.io/v1beta1',
  'batch/v1beta1',
  'storage.k8s.io/v1beta1',
  'node.k8s.io/v1beta1',
  'scheduling.k8s.io/v1beta1',
  'coordination.k8s.io/v1beta1',
  'discovery.k8s.io/v1beta1',
  'events.k8s.io/v1beta1',
])

// ─── Catálogo de kinds (o que a página sabe checar de verdade) ──

const KNOWN_KINDS = new Set([
  'Namespace', 'Pod', 'Service', 'ServiceAccount', 'ConfigMap', 'Secret',
  'PersistentVolumeClaim', 'Endpoints', 'ReplicationController',
  'Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet', 'Job', 'CronJob',
  'Ingress', 'IngressClass', 'NetworkPolicy', 'PodDisruptionBudget',
  'HorizontalPodAutoscaler', 'Role', 'ClusterRole', 'RoleBinding',
  'ClusterRoleBinding', 'LimitRange', 'ResourceQuota', 'PodSecurityPolicy',
])

const CLUSTER_SCOPED = new Set([
  'Namespace', 'Node', 'PersistentVolume', 'ClusterRole', 'ClusterRoleBinding',
  'StorageClass', 'IngressClass', 'CustomResourceDefinition', 'PriorityClass',
  'CSIDriver', 'APIService', 'MutatingWebhookConfiguration',
  'ValidatingWebhookConfiguration', 'VolumeAttachment', 'RuntimeClass',
])

// Workloads: onde mora o pod spec, o template e se o selector é obrigatório.
const WORKLOADS = {
  Deployment: { template: 'spec.template', podSpec: 'spec.template.spec', selectorRequired: true },
  StatefulSet: { template: 'spec.template', podSpec: 'spec.template.spec', selectorRequired: true },
  ReplicaSet: { template: 'spec.template', podSpec: 'spec.template.spec', selectorRequired: true },
  DaemonSet: { template: 'spec.template', podSpec: 'spec.template.spec', selectorRequired: false },
  Job: { template: 'spec.template', podSpec: 'spec.template.spec', selectorRequired: false },
  CronJob: {
    template: 'spec.jobTemplate.spec.template',
    podSpec: 'spec.jobTemplate.spec.template.spec',
    selectorRequired: false,
  },
  Pod: { template: 'metadata', podSpec: 'spec', selectorRequired: false, podDirect: true },
}

const SERVICE_TYPES = ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName']
const ACCESS_MODES = ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany', 'ReadWriteOncePod']
const DEFAULT_NAMESPACE = 'default'

// ─── Validação de expressão cron ───────────────────────────────

const CRON_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const CRON_DOWS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function cronValue(token, names) {
  const t = String(token).toLowerCase()
  if (/^\d+$/.test(t)) return Number(t)
  const idx = names.indexOf(t)
  return idx === -1 ? null : idx + 1
}

function checkCronPart(part, min, max, names, special) {
  if (part === '') return 'campo vazio'
  for (const piece of part.split(',')) {
    if (piece === '') return 'item vazio depois de vírgula'
    const slashes = piece.split('/')
    if (slashes.length > 2) return 'mais de um "/"'
    const body = slashes[0]
    const step = slashes.length === 2 ? slashes[1] : null

    if (step !== null) {
      if (!/^\d+$/.test(step)) return `passo inválido ("/${step}")`
      if (Number(step) === 0) return 'passo não pode ser 0'
    }

    if (body === '*') continue
    if (special === 'dom' && body === '?') continue
    if (special === 'dom' && (body === 'L' || /^\d+[LW]$/.test(body))) continue

    let lo = body
    let hi = null
    if (special === 'dow' && /#/.test(body)) {
      const parts = body.split('#')
      if (parts.length !== 2 || !/^\d+$/.test(parts[1])) return '"#" só vale com um número depois'
      lo = parts[0]
      if (lo === '*' || lo === '') continue
      lo = lo.split('-')[0]
    }

    const dashes = lo.split('-')
    if (dashes.length > 2) return 'mais de um "-"'
    lo = dashes[0]
    if (dashes.length === 2) hi = dashes[1]

    const loV = cronValue(lo, names)
    if (loV === null) return `valor inválido ("${lo}")`

    if (hi !== null) {
      const hiV = cronValue(hi, names)
      if (hiV === null) return `valor inválido ("${hi}")`
      if (hiV < loV) return `intervalo invertido ("${lo}-${hi}")`
      if (hiV > max || loV < min) return `fora do intervalo ${min}-${max} ("${lo}-${hi}")`
    } else if (loV < min || loV > max) {
      return `fora do intervalo ${min}-${max} ("${lo}")`
    }
  }
  return null
}

/**
 * Valida uma expressão cron do Kubernetes (5 campos ou 6 com segundos).
 * @returns {{ok: boolean, error: string|null, field: string|null}}
 */
export function validateCron(expr) {
  const raw = String(expr == null ? '' : expr).trim()
  if (!raw) return { ok: false, error: 'expressão vazia', field: null }

  const fields = raw.split(/\s+/)
  const parts = fields.length === 6
    ? [
        { v: fields[0], min: 0, max: 59, names: [], label: 'segundo' },
        { v: fields[1], min: 0, max: 59, names: [], label: 'minuto' },
        { v: fields[2], min: 0, max: 23, names: [], label: 'hora' },
        { v: fields[3], min: 1, max: 31, names: [], label: 'dia do mês', special: 'dom' },
        { v: fields[4], min: 1, max: 12, names: CRON_MONTHS, label: 'mês' },
        { v: fields[5], min: 0, max: 7, names: CRON_DOWS, label: 'dia da semana', special: 'dow' },
      ]
    : fields.length === 5
      ? [
          { v: fields[0], min: 0, max: 59, names: [], label: 'minuto' },
          { v: fields[1], min: 0, max: 23, names: [], label: 'hora' },
          { v: fields[2], min: 1, max: 31, names: [], label: 'dia do mês', special: 'dom' },
          { v: fields[3], min: 1, max: 12, names: CRON_MONTHS, label: 'mês' },
          { v: fields[4], min: 0, max: 7, names: CRON_DOWS, label: 'dia da semana', special: 'dow' },
        ]
      : null

  if (!parts) {
    return {
      ok: false,
      field: null,
      error: `${fields.length} campos — o Kubernetes usa 5 (min hora dia mês dia-da-semana) ou 6 (com segundos)`,
    }
  }

  for (const p of parts) {
    const err = checkCronPart(p.v, p.min, p.max, p.names, p.special || null)
    if (err) return { ok: false, error: `${p.label}: ${err}`, field: p.label }
  }
  return { ok: true, error: null, field: null }
}

// ─── Base64 ────────────────────────────────────────────────────

function isBase64(v) {
  if (typeof v !== 'string' || v.trim() === '') return false
  const t = v.trim()
  if (t.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]+={0,2}$/.test(t)
}

// ─── Divisão em documentos ─────────────────────────────────────

/**
 * Quebra o texto em documentos Kubernetes na linha `---` (coluna 0).
 * `...` também fecha um documento.
 */
export function splitDocuments(text) {
  const lines = String(text == null ? '' : text).split(/\r?\n/)
  const docs = []
  let cur = { startLine: 1, lines: [] }

  lines.forEach((raw, i) => {
    const trimmed = raw.trim()
    const indent = raw.search(/\S/)
    const isSep = indent === 0 && (trimmed === '---' || trimmed.startsWith('--- '))
    const isEnd = indent === 0 && (trimmed === '...' || trimmed.startsWith('... '))
    if (isSep) {
      docs.push(cur)
      cur = { startLine: i + 2, lines: [] }
      return
    }
    if (isEnd) {
      cur.lines.push(raw)
      docs.push(cur)
      cur = { startLine: i + 2, lines: [] }
      return
    }
    cur.lines.push(raw)
  })
  docs.push(cur)

  return docs.map((d, i) => ({
    index: i + 1,
    startLine: d.startLine,
    text: d.lines.join('\n'),
  }))
}

// ─── Parse de um documento ─────────────────────────────────────

function parseDocument(chunk) {
  const text = chunk.text
  const trimmed = text.trim()
  if (trimmed === '') return { status: 'empty' }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { status: 'ok', obj: JSON.parse(trimmed), format: 'json' }
    } catch (e) {
      // JSON inválido ainda pode ser YAML válido — tenta o parser de YAML.
    }
  }

  const res = parseYaml(text)
  if (!res.ok) {
    return { status: 'error', error: res.error, line: chunk.startLine + (res.line || 1) - 1 }
  }
  if (res.value === null || res.value === undefined) return { status: 'empty' }
  return { status: 'ok', obj: res.value, format: 'yaml' }
}

// ─── Checagem de um documento ──────────────────────────────────

function lintDocument(doc, add) {
  const kind = isObj(doc.apiVersion) ? '' : String(doc.apiVersion == null ? '' : doc.apiVersion)
  const kindStr = doc.kind == null ? '' : String(doc.kind)
  const meta = obj(doc, 'metadata')
  const name = meta && meta.name != null ? String(meta.name) : ''
  const namespace = meta && meta.namespace != null ? String(meta.namespace) : ''
  const ns = namespace || DEFAULT_NAMESPACE

  if (!kind) {
    add('error', 'e_noApiVersion', 'apiVersion')
  } else if (!/^v\d+[a-z0-9]*$/.test(kind) && !/^[a-z0-9.\-]+\/v\d+[a-z0-9]*$/.test(kind)) {
    add('error', 'e_badApiVersion', 'apiVersion', kind)
  } else if (DEPRECATED_API.has(kind)) {
    add('warning', 'w_apiVersionDeprecated', 'apiVersion', kind)
  } else if (!KNOWN_API.has(kind)) {
    add('info', 'w_apiVersionUnknown', 'apiVersion', kind)
  }

  if (!kindStr) {
    add('error', 'e_noKind', 'kind')
  } else if (!KNOWN_KINDS.has(kindStr)) {
    add('info', 'w_unknownKind', 'kind', kindStr)
  }

  if (meta) {
    if (!name && !meta.generateName) {
      add('error', 'e_noName', 'metadata.name')
    } else if (name) {
      if (!NAME_RE.test(name)) {
        add('error', 'e_badName', 'metadata.name', name)
      } else if (name.length > 253) {
        add('error', 'e_badName', 'metadata.name', name)
      }
    }
    if (namespace && !NAME_RE.test(namespace)) {
      add('error', 'e_badNamespace', 'metadata.namespace', namespace)
    }
    if (!namespace && !CLUSTER_SCOPED.has(kindStr)) {
      add('warning', 'w_noNamespace', 'metadata.namespace')
    }
    if (namespace && CLUSTER_SCOPED.has(kindStr)) {
      add('warning', 'w_clusterScopedInNs', 'metadata.namespace', kindStr)
    }
  }

  const spec = obj(doc, 'spec')
  if (!spec && (WORKLOADS[kindStr] || kindStr === 'Service' || kindStr === 'Ingress')) {
    // spec ausente em Deployment/Service/Ingress é erro do próprio kind.
    if (WORKLOADS[kindStr] || kindStr === 'Service' || kindStr === 'Ingress') {
      add('error', 'e_noSpec', 'spec', kindStr)
    }
  }

  if (WORKLOADS[kindStr]) lintWorkload(doc, spec, kindStr, add)
  if (kindStr === 'Service') lintService(doc, obj(doc, 'spec'), add)
  if (kindStr === 'Ingress') lintIngress(doc, obj(doc, 'spec'), add)
  if (kindStr === 'ConfigMap') lintConfigMap(doc, add)
  if (kindStr === 'Secret') lintSecret(doc, add)
  if (kindStr === 'PersistentVolumeClaim') lintPvc(doc, add)
  if (kindStr === 'Role' || kindStr === 'ClusterRole') lintRole(doc, add)
  if (kindStr === 'RoleBinding' || kindStr === 'ClusterRoleBinding') lintRoleBinding(doc, kindStr, add)
  if (kindStr === 'HorizontalPodAutoscaler') lintHpa(doc, add)
}

function lintWorkload(doc, spec, kind, add) {
  const cfg = WORKLOADS[kind]
  if (!cfg.podDirect && !isObj(spec)) return // e_noSpec já reportado
  const template = cfg.podDirect ? null : getPath(doc, cfg.template)
  const podSpec = cfg.podDirect ? obj(doc, 'spec') : getPath(doc, cfg.podSpec)

  // Pod solto não tem template — metadata.name é obrigatório.
  if (cfg.podDirect) {
    const meta = obj(doc, 'metadata')
    if (meta && !meta.name && !meta.generateName) add('error', 'e_noName', 'metadata.name')
  } else if (!isObj(template)) {
    add('error', 'e_noTemplate', cfg.template, kind)
  }

  const selector = obj(spec, 'selector')
  const matchLabels = obj(selector, 'matchLabels')
  if (cfg.selectorRequired && !matchLabels) {
    add('error', 'e_noSelector', 'spec.selector.matchLabels', kind)
  }

  const tmplLabels = obj(template, 'metadata')
  const labels = obj(tmplLabels, 'labels')
  if (isObj(matchLabels)) {
    const entries = Object.entries(matchLabels).filter(([, v]) => v !== undefined && v !== null)
    if (entries.length === 0) {
      add('error', 'e_emptySelector', 'spec.selector.matchLabels', kind)
    } else if (labels) {
      for (const [k, v] of entries) {
        const actual = labels[k]
        if (actual === undefined) {
          add('error', 'e_selectorMismatch', `${cfg.template}.metadata.labels`, `${k}=${v}`)
        } else if (String(actual) !== String(v)) {
          add('error', 'e_selectorMismatch', `${cfg.template}.metadata.labels`, `${k}=${v} (label: ${actual})`)
        }
      }
    } else {
      add('error', 'e_noTemplateLabels', `${cfg.template}.metadata.labels`, kind)
    }
  }

  if (!isObj(podSpec)) return

  lintPodSpec(podSpec, cfg.podSpec, add)

  if (kind === 'Deployment' && (spec.replicas === undefined || spec.replicas === null)) {
    add('info', 'w_replicasDefault', 'spec.replicas')
  }
  if (kind === 'Deployment' && typeof spec.replicas === 'number' && spec.replicas > 20) {
    add('info', 'w_replicasHigh', 'spec.replicas', String(spec.replicas))
  }
  if (kind === 'StatefulSet' && !isObj(spec.serviceName)) {
    add('error', 'e_noServiceName', 'spec.serviceName', kind)
  }
  if (kind === 'CronJob') lintCronJob(doc, spec, add)
  if (kind === 'Job' || kind === 'CronJob') lintJob(spec, podSpec, add)
}

function lintPodSpec(podSpec, path, add) {
  const containers = asArray(podSpec.containers).filter(isObj)
  const podSec = obj(podSpec, 'securityContext')
  if (!isObj(podSpec) || asArray(podSpec.containers).length === 0) {
    add('error', 'e_noContainers', `${path}.containers`)
  }

  const seen = new Set()
  containers.forEach((c, i) => {
    const cPath = `${path}.containers[${i}]`
    const cname = c.name == null ? '' : String(c.name)
    if (!cname) add('error', 'e_containerNoName', `${cPath}.name`)
    else if (seen.has(cname)) add('error', 'e_dupContainerName', `${cPath}.name`, cname)
    else seen.add(cname)

    const image = c.image == null ? '' : String(c.image)
    if (!image) {
      add('error', 'e_noImage', `${cPath}.image`, cname || `#${i + 1}`)
    } else {
      const slash = image.lastIndexOf('/')
      const tagPart = image.slice(slash + 1)
      const hasTag = tagPart.includes(':')
      const tag = hasTag ? tagPart.slice(tagPart.indexOf(':') + 1) : null
      if (!hasTag) add('warning', 'w_imageNoTag', `${cPath}.image`, image)
      else if (tag === 'latest') add('warning', 'w_imageLatest', `${cPath}.image`, image)
      if (c.imagePullPolicy === 'Always' && hasTag && tag !== 'latest') {
        add('warning', 'w_pullPolicyAlways', `${cPath}.imagePullPolicy`, image)
      }
      if (c.imagePullPolicy && !['Always', 'IfNotPresent', 'Never'].includes(String(c.imagePullPolicy))) {
        add('error', 'e_badPullPolicy', `${cPath}.imagePullPolicy`, String(c.imagePullPolicy))
      }
    }

    asArray(c.ports).forEach((p, j) => {
      if (!isObj(p)) return
      const cp = p.containerPort
      if (typeof cp !== 'number' || !Number.isInteger(cp) || cp < 1 || cp > 65535) {
        add('error', 'e_containerPortRange', `${cPath}.ports[${j}].containerPort`, String(cp))
      }
      const protocol = p.protocol == null ? 'TCP' : String(p.protocol)
      if (!['TCP', 'UDP', 'SCTP'].includes(protocol)) {
        add('error', 'e_badProtocol', `${cPath}.ports[${j}].protocol`, protocol)
      }
      if (p.name != null && !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(String(p.name))) {
        add('error', 'e_badPortName', `${cPath}.ports[${j}].name`, String(p.name))
      }
    })

    const res = obj(c, 'resources')
    if (!res) {
      add('warning', 'w_noResources', `${cPath}.resources`, cname || `#${i + 1}`)
    } else {
      const limits = obj(res, 'limits')
      const requests = obj(res, 'requests')
      if (!limits || Object.keys(limits).length === 0) {
        add('warning', 'w_noLimits', `${cPath}.resources.limits`, cname || `#${i + 1}`)
      } else if (!limits.cpu || !limits.memory) {
        add('warning', 'w_limitsIncomplete', `${cPath}.resources.limits`, cname || `#${i + 1}`)
      }
      if (limits && !requests) {
        add('warning', 'w_limitsNoRequests', `${cPath}.resources`, cname || `#${i + 1}`)
      } else if (requests && !requests.cpu && !requests.memory) {
        add('warning', 'w_requestsIncomplete', `${cPath}.resources.requests`, cname || `#${i + 1}`)
      }
    }

    if (!isObj(c.livenessProbe) && !isObj(c.readinessProbe) && !isObj(c.startupProbe)) {
      add('info', 'w_noProbes', cPath, cname || `#${i + 1}`)
    }

    const sec = obj(c, 'securityContext')
    if (sec) {
      if (sec.privileged === true) add('warning', 'w_privileged', `${cPath}.securityContext.privileged`, cname)
      if (sec.allowPrivilegeEscalation === true) {
        add('warning', 'w_allowPrivEsc', `${cPath}.securityContext.allowPrivilegeEscalation`, cname)
      }
    } else if (!podSec || podSec.runAsNonRoot === undefined) {
      add('info', 'w_noSecurityContext', cPath, cname || `#${i + 1}`)
    }

    // env var com cara de segredo em texto claro
    asArray(c.env).forEach((e, j) => {
      if (!isObj(e) || e.valueFrom) return
      const ename = String(e.name || '')
      const value = e.value == null ? '' : String(e.value)
      if (ename && SECRET_HINT_RE.test(ename) && value !== '') {
        add('warning', 'w_secretInEnv', `${cPath}.env[${j}]`, ename)
      }
    })
  })

  if (podSec && (podSec.runAsNonRoot === false || podSec.privileged === true)) {
    add('warning', 'w_podRunAsRoot', `${path}.securityContext`)
  }

  if (podSpec.hostNetwork === true || podSpec.hostPID === true || podSpec.hostIPC === true) {
    add('warning', 'w_hostNamespace', path)
  }
  if (podSpec.dnsPolicy === 'ClusterFirstWithHostNet' && !podSpec.hostNetwork) {
    add('info', 'w_dnsPolicyUnused', `${path}.dnsPolicy`, String(podSpec.dnsPolicy))
  }
  if (podSpec.automountServiceAccountToken !== false && podSpec.serviceAccountName) {
    add('info', 'w_automountToken', `${path}.automountServiceAccountToken`)
  }
  if (podSpec.restartPolicy && !['Always', 'OnFailure', 'Never'].includes(String(podSpec.restartPolicy))) {
    add('error', 'e_badRestartPolicy', `${path}.restartPolicy`, String(podSpec.restartPolicy))
  }

  asArray(podSpec.volumes).forEach((v, j) => {
    if (!isObj(v)) return
    if (!v.name) add('error', 'e_volumeNoName', `${path}.volumes[${j}]`)
    const hostPath = obj(v, 'hostPath')
    if (hostPath) add('warning', 'w_hostPath', `${path}.volumes[${j}].hostPath`, String(hostPath.path || v.name || ''))
  })
}

function lintCronJob(doc, spec, add) {
  if (!spec.schedule) {
    add('error', 'e_noSchedule', 'spec.schedule')
  } else {
    const res = validateCron(spec.schedule)
    if (!res.ok) add('error', 'e_badSchedule', 'spec.schedule', `${spec.schedule} — ${res.error}`)
    if (!spec.timeZone && spec.timeZone !== '') {
      add('info', 'w_noTimezone', 'spec.timeZone')
    }
  }
  const policy = spec.concurrencyPolicy == null ? null : String(spec.concurrencyPolicy)
  if (!policy) add('info', 'w_noConcurrencyPolicy', 'spec.concurrencyPolicy')
  else if (!['Allow', 'Forbid', 'Replace'].includes(policy)) {
    add('error', 'e_badConcurrencyPolicy', 'spec.concurrencyPolicy', policy)
  } else if (policy === 'Allow') {
    add('info', 'w_concurrencyAllow', 'spec.concurrencyPolicy')
  }
  if (spec.successfulJobsHistoryLimit == null) add('info', 'w_noHistoryLimit', 'spec.successfulJobsHistoryLimit')
  if (spec.failedJobsHistoryLimit == null) add('info', 'w_noHistoryLimit', 'spec.failedJobsHistoryLimit')
  if (spec.startingDeadlineSeconds == null) add('info', 'w_noDeadline', 'spec.startingDeadlineSeconds')
}

function lintJob(spec, podSpec, add) {
  if (spec.backoffLimit == null) add('info', 'w_noBackoffLimit', 'spec.backoffLimit')
  if (spec.ttlSecondsAfterFinished == null) add('info', 'w_noJobTtl', 'spec.ttlSecondsAfterFinished')
  if (isObj(podSpec) && podSpec.restartPolicy === 'Always') {
    add('warning', 'w_jobRestartPolicy', 'spec.template.spec.restartPolicy', 'Always')
  }
}

function lintService(doc, spec, add) {
  if (!isObj(spec)) return // e_noSpec já reportado
  const type = spec.type == null ? 'ClusterIP' : String(spec.type)
  if (!SERVICE_TYPES.includes(type)) {
    add('error', 'e_badServiceType', 'spec.type', type)
  }

  const ports = asArray(spec.ports).filter(isObj)
  if (ports.length === 0) {
    add('error', 'e_noPorts', 'spec.ports')
  }

  const seenPort = new Set()
  ports.forEach((p, i) => {
    const pPath = `spec.ports[${i}]`
    const port = p.port
    if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
      add('error', 'e_portRange', `${pPath}.port`, String(port))
    }
    const protocol = p.protocol == null ? 'TCP' : String(p.protocol)
    if (!['TCP', 'UDP', 'SCTP'].includes(protocol)) {
      add('error', 'e_badProtocol', `${pPath}.protocol`, protocol)
    }
    if (type === 'NodePort' || type === 'LoadBalancer') {
      const np = p.nodePort
      if (np !== undefined && np !== null) {
        if (typeof np !== 'number' || np < 30000 || np > 32767) {
          add('error', 'e_nodePortRange', `${pPath}.nodePort`, String(np))
        }
      } else if (type === 'NodePort') {
        add('info', 'w_noNodePort', `${pPath}.nodePort`)
      }
    }
    const key = `${port}/${protocol}`
    if (seenPort.has(key)) add('error', 'e_dupServicePort', `${pPath}.port`, String(port))
    else seenPort.add(key)

    if (p.name != null && !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(String(p.name))) {
      add('error', 'e_badPortName', `${pPath}.name`, String(p.name))
    }
    const tp = p.targetPort
    if (tp !== undefined && tp !== null && typeof tp === 'number' && (tp < 1 || tp > 65535)) {
      add('error', 'e_portRange', `${pPath}.targetPort`, String(tp))
    }
    if (p.targetPort !== undefined && p.targetPort !== null && typeof tp === 'string' &&
      !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(tp)) {
      add('error', 'e_badPortName', `${pPath}.targetPort`, tp)
    }
  })

  if (ports.length > 1 && ports.some((p) => !p.name)) {
    add('warning', 'w_noPortName', 'spec.ports')
  }

  const selector = obj(spec, 'selector')
  if (type === 'ExternalName') {
    if (!spec.externalName) add('error', 'e_noExternalName', 'spec.externalName')
    if (selector) add('info', 'w_selectorOnExternalName', 'spec.selector')
  } else if (!selector || Object.keys(selector).length === 0) {
    add('warning', 'w_serviceNoSelector', 'spec.selector', type)
  }
}

function lintIngress(doc, spec, add) {
  if (!isObj(spec)) return // e_noSpec já reportado
  const rules = asArray(spec.rules).filter(isObj)
  const hasDefault = isObj(spec.defaultBackend)
  if (rules.length === 0 && !hasDefault) {
    add('error', 'e_noIngressRules', 'spec.rules')
  }
  if (!spec.ingressClassName) add('info', 'w_noIngressClass', 'spec.ingressClassName')

  const hosts = new Set()
  rules.forEach((r, i) => {
    const rPath = `spec.rules[${i}]`
    const host = r.host == null ? null : String(r.host)
    if (host) hosts.add(host)
    const paths = asArray(r.http ? r.http.paths : null).filter(isObj)
    if (paths.length === 0 && isObj(r.http)) add('warning', 'w_ruleNoPaths', `${rPath}.http.paths`)
    paths.forEach((p, j) => {
      const pPath = `${rPath}.http.paths[${j}]`
      if (p.pathType == null) add('error', 'e_noPathType', `${pPath}.pathType`)
      else if (!['Exact', 'Prefix', 'ImplementationSpecific'].includes(String(p.pathType))) {
        add('error', 'e_badPathType', `${pPath}.pathType`, String(p.pathType))
      }
      const backend = obj(p, 'backend')
      if (!backend) {
        add('error', 'e_noIngressBackend', `${pPath}.backend`)
        return
      }
      const svc = obj(backend, 'service')
      if (!svc) {
        if (!obj(backend, 'resource')) add('error', 'e_noIngressBackend', `${pPath}.backend`)
        return
      }
      if (!svc.name) add('error', 'e_noIngressBackend', `${pPath}.backend.service.name`)
      const port = obj(svc, 'port')
      if (!port || (!port.number && !port.name)) {
        add('error', 'e_noIngressPort', `${pPath}.backend.service.port`)
      }
    })
  })

  asArray(spec.tls).forEach((t, i) => {
    if (!isObj(t)) return
    if (!t.secretName) {
      add('error', 'e_noTlsSecret', `spec.tls[${i}].secretName`)
      return
    }
    const tlshosts = asArray(t.hosts).map(String)
    if (tlshosts.length === 0) add('warning', 'w_tlsNoHosts', `spec.tls[${i}].hosts`)
    if (hosts.size > 0 && tlshosts.length > 0) {
      const uncovered = tlshosts.filter((h) => !hosts.has(h))
      if (uncovered.length > 0) {
        add('warning', 'w_tlsHostNoRule', `spec.tls[${i}].hosts`, uncovered.join(', '))
      }
    }
  })
}

function lintConfigMap(doc, add) {
  const data = isObj(doc.data) ? doc.data : null
  if (!data) {
    add('info', 'w_emptyConfigMap', 'data')
    return
  }
  Object.entries(data).forEach(([k, v]) => {
    if (!CONFIGMAP_KEY_RE.test(k)) add('error', 'e_configKeyCharset', `data.${k}`, k)
    if (SECRET_HINT_RE.test(k) && String(v).trim() !== '') {
      add('warning', 'w_secretInConfigMap', `data.${k}`, k)
    }
  })
  if (isObj(doc.binaryData)) {
    Object.keys(doc.binaryData).forEach((k) => {
      if (!CONFIGMAP_KEY_RE.test(k)) add('error', 'e_configKeyCharset', `binaryData.${k}`, k)
      if (!isBase64(doc.binaryData[k])) add('error', 'e_notBase64', `binaryData.${k}`, k)
    })
  }
}

function lintSecret(doc, add) {
  const data = isObj(doc.data) ? doc.data : null
  const stringData = isObj(doc.stringData) ? doc.stringData : null
  if (!data && !stringData) {
    add('info', 'w_emptySecret', 'data')
  }
  if (data) {
    Object.entries(data).forEach(([k, v]) => {
      if (!CONFIGMAP_KEY_RE.test(k)) add('error', 'e_configKeyCharset', `data.${k}`, k)
      if (!isBase64(v)) add('error', 'e_notBase64', `data.${k}`, k)
    })
  }
  if (stringData) {
    Object.keys(stringData).forEach((k) => {
      if (!CONFIGMAP_KEY_RE.test(k)) add('error', 'e_configKeyCharset', `stringData.${k}`, k)
    })
  }
}

function lintPvc(doc, add) {
  const spec = obj(doc, 'spec')
  if (!spec) return
  const requests = obj(obj(spec, 'resources'), 'requests')
  const storage = requests ? requests.storage : undefined
  if (storage === undefined || storage === null || storage === '') {
    add('error', 'e_noStorage', 'spec.resources.requests.storage')
  } else if (typeof storage === 'string' && !/^\d+(\.\d+)?(E|P|T|G|M|k|Ei|Pi|Ti|Gi|Mi|Ki)?$/.test(storage.trim())) {
    add('warning', 'w_storageFormat', 'spec.resources.requests.storage', String(storage))
  }
  const modes = asArray(spec.accessModes).map(String)
  if (modes.length === 0) {
    add('error', 'e_noAccessMode', 'spec.accessModes')
  }
  for (const m of modes) {
    if (!ACCESS_MODES.includes(m)) add('error', 'e_badAccessMode', 'spec.accessModes', m)
  }
  if (spec.storageClassName === '' || spec.storageClassName === undefined) {
    add('info', 'w_noStorageClass', 'spec.storageClassName')
  }
}

function lintRole(doc, add) {
  const rules = asArray(doc.rules).filter(isObj)
  if (rules.length === 0) add('warning', 'w_roleNoRules', 'rules')
  rules.forEach((r, i) => {
    const rPath = `rules[${i}]`
    const verbs = asArray(r.verbs).map(String)
    if (verbs.length === 0) add('error', 'e_noVerbs', `${rPath}.verbs`)
    if (verbs.includes('*')) add('warning', 'w_wildcard', `${rPath}.verbs`, 'verbs')
    const resources = asArray(r.resources).map(String)
    const nonResource = asArray(r.nonResourceURLs).map(String)
    if (resources.length === 0 && nonResource.length === 0) {
      add('error', 'e_noResourcesRule', `${rPath}.resources`)
    }
    if (resources.includes('*')) add('warning', 'w_wildcard', `${rPath}.resources`, 'resources')
    const groups = asArray(r.apiGroups).map(String)
    if (groups.includes('*')) add('warning', 'w_wildcard', `${rPath}.apiGroups`, 'apiGroups')
    resources.forEach((res, j) => {
      if (res.includes('*')) add('warning', 'w_wildcard', `${rPath}.resources[${j}]`, res)
    })
  })
}

function lintRoleBinding(doc, kind, add) {
  const roleRef = obj(doc, 'roleRef')
  if (!roleRef) {
    add('error', 'e_noRoleRef', 'roleRef')
  } else {
    if (!roleRef.kind) add('error', 'e_noRoleRefKind', 'roleRef.kind')
    if (!roleRef.name) add('error', 'e_noRoleRefName', 'roleRef.name')
    if (roleRef.kind && !['Role', 'ClusterRole'].includes(String(roleRef.kind))) {
      add('error', 'e_badRoleRefKind', 'roleRef.kind', String(roleRef.kind))
    }
    const expected = kind === 'ClusterRoleBinding' ? 'ClusterRole' : 'Role'
    if (roleRef.kind && String(roleRef.kind) !== expected) {
      add('warning', 'w_roleRefKind', 'roleRef.kind', `${roleRef.kind} em ${kind}`)
    }
  }

  const subjects = asArray(doc.subjects).filter(isObj)
  if (subjects.length === 0) {
    add('error', 'e_noSubjects', 'subjects')
  }
  const seen = new Set()
  subjects.forEach((s, i) => {
    const sPath = `subjects[${i}]`
    const kindS = s.kind == null ? '' : String(s.kind)
    if (!kindS) add('error', 'e_noSubjectKind', `${sPath}.kind`)
    else if (!['User', 'Group', 'ServiceAccount'].includes(kindS)) {
      add('error', 'e_badSubjectKind', `${sPath}.kind`, kindS)
    }
    if (!s.name) add('error', 'e_noSubjectName', `${sPath}.name`)
    if (kindS === 'ServiceAccount' && !s.namespace) {
      add('warning', 'w_subjectNoNamespace', `${sPath}.namespace`, 'default')
    }
    const key = `${kindS}:${s.namespace || DEFAULT_NAMESPACE}:${s.name || ''}`
    if (seen.has(key)) add('warning', 'w_dupSubject', sPath, String(s.name || ''))
    else seen.add(key)
  })
}

function lintHpa(doc, add) {
  // autoscaling/v1 usa campos no topo; v2 usa tudo dentro de spec.
  const spec = isObj(obj(doc, 'spec')) ? obj(doc, 'spec') : doc
  const p = (field) => `${obj(doc, 'spec') ? 'spec.' : ''}${field}`

  const target = obj(spec, 'scaleTargetRef')
  if (!target || !target.kind || !target.name) {
    add('error', 'e_noScaleTarget', p('scaleTargetRef'))
  }
  const min = spec.minReplicas
  const max = spec.maxReplicas
  if (typeof max !== 'number' || max < 1) {
    add('error', 'e_badMaxReplicas', p('maxReplicas'), String(max))
  }
  if (min !== undefined && min !== null && typeof min !== 'number') {
    add('error', 'e_badMinReplicas', p('minReplicas'), String(min))
  } else if (typeof min === 'number' && typeof max === 'number' && min > max) {
    add('error', 'e_minAboveMax', p('minReplicas'), `${min} > ${max}`)
  }
  const metrics = asArray(spec.metrics).filter(isObj)
  if (metrics.length === 0) {
    add('error', 'e_noHpaMetrics', p('metrics'))
  }
  metrics.forEach((m, i) => {
    if (!m.type) add('error', 'e_noMetricType', `${p('metrics')}[${i}].type`)
    if (m.type === 'Resource' && !obj(m, 'resource')) {
      add('error', 'e_noMetricSpec', `${p('metrics')}[${i}].resource`)
    }
  })
}

// ─── Checagens cruzadas entre documentos ───────────────────────

function collectIndex(docs) {
  const index = {
    workloads: [],
    services: [],
    configKeys: new Set(),
    serviceAccounts: new Set(),
    roles: new Set(),
  }

  docs.forEach(({ doc, ns, kind, name }) => {
    if (kind === 'ConfigMap' || kind === 'Secret') index.configKeys.add(`${kind}/${ns}/${name}`)
    if (kind === 'ServiceAccount') index.serviceAccounts.add(`${ns}/${name}`)
    if (kind === 'Role' || kind === 'ClusterRole') {
      index.roles.add(`${kind}/${kind === 'ClusterRole' ? '' : ns}/${name}`)
    }

    const cfg = WORKLOADS[kind]
    if (cfg) {
      const template = cfg.podDirect ? doc : getPath(doc, cfg.template)
      const labels = obj(obj(template, 'metadata'), 'labels')
      const podSpec = cfg.podDirect ? obj(doc, 'spec') : getPath(doc, cfg.podSpec)
      const ports = []
      asArray(isObj(podSpec) ? podSpec.containers : null).forEach((c) => {
        if (!isObj(c)) return
        asArray(c.ports).forEach((p) => {
          if (isObj(p)) ports.push({ name: p.name == null ? null : String(p.name), port: p.containerPort })
        })
      })
      index.workloads.push({ kind, name, namespace: ns, labels: isObj(labels) ? labels : {}, ports })
    }

    if (kind === 'Service') {
      const spec = obj(doc, 'spec')
      index.services.push({
        name,
        namespace: ns,
        selector: obj(spec, 'selector'),
        ports: asArray(isObj(spec) ? spec.ports : null).filter(isObj),
      })
    }
  })

  return index
}

function crossCheck(index, docs, addDoc) {
  index.services.forEach((svc) => {
    const selector = svc.selector
    if (!isObj(selector) || Object.keys(selector).length === 0) return

    const matched = index.workloads.filter((w) => {
      if (w.namespace !== svc.namespace) return false
      return Object.entries(selector).every(([k, v]) => String(w.labels[k] ?? '') === String(v))
    })

    const d = docs.find((x) => x.kind === 'Service' && x.name === svc.name && x.ns === svc.namespace)
    if (!d) return

    if (matched.length === 0) {
      addDoc(d, 'info', 'w_serviceSelectorNoMatch', 'spec.selector',
        Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(', '))
      return
    }

    const containerPorts = matched.flatMap((w) => w.ports)
    svc.ports.forEach((p, i) => {
      const tp = p.targetPort
      if (tp === undefined || tp === null || tp === '') return
      const ok =
        typeof tp === 'number'
          ? containerPorts.some((cp) => cp.port === tp)
          : containerPorts.some((cp) => cp.name === tp)
      if (containerPorts.length > 0 && !ok) {
        addDoc(
          d,
          'info',
          'w_targetPortNoMatch',
          `spec.ports[${i}].targetPort`,
          `${tp} (containers: ${containerPorts.map((c) => (c.name ? `${c.name}=${c.port}` : c.port)).join(', ')})`,
        )
      }
    })
  })

  docs.forEach((d) => {
    const { doc, kind, ns } = d

    if (kind === 'Ingress') {
      const spec = obj(doc, 'spec')
      asArray(spec ? spec.rules : null).forEach((r, i) => {
        if (!isObj(r) || !isObj(r.http)) return
        asArray(r.http.paths).forEach((p, j) => {
          const svc = obj(isObj(p) ? p.backend : null, 'service')
          if (!svc || !svc.name) return
          if (!index.services.some((s) => s.name === svc.name && s.namespace === ns)) {
            addDoc(d, 'info', 'w_ingressBackendNotFound',
              `spec.rules[${i}].http.paths[${j}].backend.service`, svc.name)
          }
        })
      })
      asArray(spec ? spec.tls : null).forEach((t, i) => {
        if (!isObj(t) || !t.secretName) return
        if (!index.configKeys.has(`Secret/${ns}/${t.secretName}`)) {
          addDoc(d, 'info', 'w_tlsSecretNotFound', `spec.tls[${i}].secretName`, String(t.secretName))
        }
      })
    }

    if (kind === 'RoleBinding' || kind === 'ClusterRoleBinding') {
      const roleRef = obj(doc, 'roleRef')
      if (roleRef && roleRef.kind && roleRef.name) {
        const refKind = String(roleRef.kind)
        const refNs = refKind === 'ClusterRole' ? '' : ns
        if (!index.roles.has(`${refKind}/${refNs}/${roleRef.name}`)) {
          addDoc(d, 'info', 'w_roleNotFound', 'roleRef.name', `${roleRef.kind}/${roleRef.name}`)
        }
      }
      asArray(doc.subjects).forEach((s, i) => {
        if (!isObj(s) || s.kind !== 'ServiceAccount' || !s.name) return
        if (!index.serviceAccounts.has(`${s.namespace || ns}/${s.name}`)) {
          addDoc(d, 'info', 'w_subjectSaNotFound', `subjects[${i}].name`,
            `${s.namespace || ns}/${s.name}`)
        }
      })
    }

    if (kind === 'HorizontalPodAutoscaler') {
      const hpaSpec = isObj(obj(doc, 'spec')) ? obj(doc, 'spec') : doc
      const target = obj(hpaSpec, 'scaleTargetRef')
      if (target && target.name && WORKLOADS[target.kind]) {
        const found = index.workloads.some(
          (w) => w.name === target.name && w.namespace === ns,
        )
        if (!found) addDoc(d, 'info', 'w_hpaTargetNotFound', 'scaleTargetRef.name', String(target.name))
      }
    }
  })
}

// ─── API pública ───────────────────────────────────────────────

/**
 * Roda o linter completo sobre o texto de um manifesto.
 * @param {string} text
 * @returns {{
 *   findings: Array<{severity: string, code: string, doc: number, path: string, ctx: string, kind: string, name: string, namespace: string}>,
 *   docs: Array<{index: number, startLine: number, status: string, kind: string, name: string, namespace: string, apiVersion: string, format: string, error: string, line: number, findingCount: number}>,
 *   summary: {documents: number, resources: number, error: number, warning: number, info: number, byKind: Array<{kind: string, count: number}>}
 * }}
 */
export function lintManifest(text) {
  const findings = []
  const docs = []
  const parsed = []

  splitDocuments(text).forEach((chunk) => {
    const res = parseDocument(chunk)
    if (res.status === 'empty') {
      docs.push({ index: chunk.index, startLine: chunk.startLine, status: 'empty', kind: '', name: '', namespace: '', apiVersion: '', format: '', error: '', line: 0, findingCount: 0 })
      return
    }
    if (res.status === 'error') {
      findings.push({
        severity: 'error',
        code: 'e_parse',
        doc: chunk.index,
        path: '',
        ctx: `${res.error} (linha ${res.line})`,
        kind: '',
        name: '',
        namespace: '',
      })
      docs.push({ index: chunk.index, startLine: chunk.startLine, status: 'error', kind: '', name: '', namespace: '', apiVersion: '', format: '', error: res.error, line: res.line, findingCount: 1 })
      return
    }

    const doc = res.obj
    if (!isObj(doc)) {
      findings.push({
        severity: 'error',
        code: 'e_notMapping',
        doc: chunk.index,
        path: '',
        ctx: Array.isArray(doc) ? 'lista' : typeof doc,
        kind: '',
        name: '',
        namespace: '',
      })
      docs.push({ index: chunk.index, startLine: chunk.startLine, status: 'error', kind: '', name: '', namespace: '', apiVersion: '', format: res.format, error: 'notMapping', line: chunk.startLine, findingCount: 1 })
      return
    }

    const meta = obj(doc, 'metadata')
    const entry = {
      index: chunk.index,
      startLine: chunk.startLine,
      status: 'ok',
      kind: doc.kind == null ? '' : String(doc.kind),
      name: meta && meta.name != null ? String(meta.name) : '',
      namespace: meta && meta.namespace != null ? String(meta.namespace) : '',
      apiVersion: doc.apiVersion == null ? '' : String(doc.apiVersion),
      format: res.format,
      error: '',
      line: 0,
      findingCount: 0,
    }
    docs.push(entry)
    parsed.push({
      index: chunk.index,
      doc,
      kind: entry.kind,
      name: entry.name,
      namespace: entry.namespace,
      ns: entry.namespace || DEFAULT_NAMESPACE,
      findingCount: 0,
    })
  })

  const addDoc = (target, severity, code, path, ctx) => {
    target.findingCount += 1
    findings.push({
      severity,
      code,
      doc: target.index,
      path,
      ctx: ctx === undefined || ctx === null ? '' : String(ctx),
      kind: target.kind,
      name: target.name,
      namespace: target.namespace,
    })
  }

  parsed.forEach((target) => {
    const add = (severity, code, path, ctx) => addDoc(target, severity, code, path, ctx)
    try {
      lintDocument(target.doc, add)
    } catch (e) {
      addDoc(target, 'info', 'w_ruleFailed', '', e && e.message ? e.message : String(e))
    }
  })

  try {
    crossCheck(collectIndex(parsed), parsed, addDoc)
  } catch (e) {
    // nunca derruba a página por causa de uma regra cruzada
  }

  const seen = new Set()
  parsed.forEach((t) => {
    if (!t.kind) return
    const key = `${t.kind}/${t.ns}/${t.name}`
    if (seen.has(key)) addDoc(t, 'error', 'e_dupResource', 'metadata.name', `${t.kind}/${t.name}`)
    else seen.add(key)
  })

  const order = { error: 0, warning: 1, info: 2 }
  findings.sort((a, b) => {
    if (a.doc !== b.doc) return a.doc - b.doc
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity]
    return a.code.localeCompare(b.code)
  })

  docs.forEach((d) => {
    d.findingCount = findings.filter((f) => f.doc === d.index).length
  })

  const byKind = {}
  parsed.forEach((p) => {
    if (!p.kind) return
    byKind[p.kind] = (byKind[p.kind] || 0) + 1
  })

  const summary = {
    documents: docs.length,
    resources: parsed.length,
    error: findings.filter((f) => f.severity === 'error').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    info: findings.filter((f) => f.severity === 'info').length,
    byKind: Object.entries(byKind)
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind)),
  }

  return { findings, docs, summary }
}

export { SEVERITIES, KNOWN_KINDS, KNOWN_API, DEPRECATED_API }
