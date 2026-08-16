export const KINDS = ['web', 'api', 'worker', 'stateful']

export const PRESETS = {
  web: {
    label: { pt: 'Aplicação web (Deployment + Service + Ingress)', en: 'Web app (Deployment + Service + Ingress)' },
    kind: 'web',
    name: 'my-app',
    namespace: 'default',
    image: 'myregistry/my-app',
    tag: 'latest',
    replicas: 2,
    port: 8080,
    serviceType: 'ClusterIP',
    exposeIngress: true,
    host: 'app.example.com',
    path: '/',
    tls: true,
    tlsSecret: 'app-tls',
    includeHpa: true,
    minReplicas: 2,
    maxReplicas: 10,
    targetCpu: 70,
    requestCpu: '100m',
    requestMemory: '128Mi',
    limitCpu: '500m',
    limitMemory: '512Mi',
    liveness: 'http',
    readiness: 'http',
    probePath: '/health',
    includeConfigMap: true,
    configMapName: 'my-app-config',
    configMapData: 'LOG_LEVEL=info\nFEATURE_FLAG=true',
    includeSecret: true,
    secretName: 'my-app-secrets',
    secretData: 'DATABASE_URL=postgresql://user:pass@db:5432/app',
    pvcSize: '5Gi',
    extraLabels: 'app.kubernetes.io/part-of: my-app',
    annotations: '',
  },
  api: {
    label: { pt: 'API (Deployment + Service interno)', en: 'API service (Deployment + internal Service)' },
    kind: 'api',
    name: 'my-api',
    namespace: 'api',
    image: 'myregistry/my-api',
    tag: 'v1.0.0',
    replicas: 3,
    port: 3000,
    serviceType: 'ClusterIP',
    exposeIngress: false,
    host: 'api.example.com',
    path: '/',
    tls: false,
    tlsSecret: 'api-tls',
    includeHpa: true,
    minReplicas: 3,
    maxReplicas: 20,
    targetCpu: 60,
    requestCpu: '200m',
    requestMemory: '256Mi',
    limitCpu: '1',
    limitMemory: '1Gi',
    liveness: 'http',
    readiness: 'http',
    probePath: '/healthz',
    includeConfigMap: true,
    configMapName: 'my-api-config',
    configMapData: 'NODE_ENV=production\nPORT=3000',
    includeSecret: true,
    secretName: 'my-api-secrets',
    secretData: 'API_KEY=change-me',
    pvcSize: '1Gi',
    extraLabels: '',
    annotations: '',
  },
  worker: {
    label: { pt: 'Worker/background (Deployment sem Service)', en: 'Background worker (Deployment without Service)' },
    kind: 'worker',
    name: 'my-worker',
    namespace: 'workers',
    image: 'myregistry/my-worker',
    tag: 'latest',
    replicas: 2,
    port: 0,
    serviceType: 'ClusterIP',
    exposeIngress: false,
    host: '',
    path: '/',
    tls: false,
    tlsSecret: '',
    includeHpa: false,
    minReplicas: 1,
    maxReplicas: 5,
    targetCpu: 70,
    requestCpu: '100m',
    requestMemory: '128Mi',
    limitCpu: '500m',
    limitMemory: '512Mi',
    liveness: 'none',
    readiness: 'none',
    probePath: '/health',
    includeConfigMap: true,
    configMapName: 'my-worker-config',
    configMapData: 'QUEUE_URL=amqp://rabbitmq',
    includeSecret: true,
    secretName: 'my-worker-secrets',
    secretData: 'REDIS_PASSWORD=change-me',
    pvcSize: '1Gi',
    extraLabels: '',
    annotations: '',
  },
  stateful: {
    label: { pt: 'Aplicação stateful (Deployment + PVC)', en: 'Stateful app (Deployment + PVC)' },
    kind: 'stateful',
    name: 'my-stateful',
    namespace: 'default',
    image: 'myregistry/my-stateful',
    tag: 'latest',
    replicas: 1,
    port: 8080,
    serviceType: 'ClusterIP',
    exposeIngress: true,
    host: 'stateful.example.com',
    path: '/',
    tls: true,
    tlsSecret: 'stateful-tls',
    includeHpa: false,
    minReplicas: 1,
    maxReplicas: 3,
    targetCpu: 70,
    requestCpu: '250m',
    requestMemory: '512Mi',
    limitCpu: '1',
    limitMemory: '2Gi',
    liveness: 'tcp',
    readiness: 'tcp',
    probePath: '/health',
    includeConfigMap: false,
    configMapName: 'my-stateful-config',
    configMapData: '',
    includeSecret: false,
    secretName: 'my-stateful-secrets',
    secretData: '',
    pvcSize: '10Gi',
    extraLabels: '',
    annotations: '',
  },
}

export const DEFAULTS = { ...PRESETS.web }

function escapeYamlString(s) {
  if (s == null) return ''
  const str = String(s)
  if (/[":{}[\],&*#?|\-<>=%!@'`]/.test(str) || str.startsWith(' ') || str.endsWith(' ')) {
    return `"${str.replace(/"/g, '\\"')}"`
  }
  return str
}

function parseKeyValuePairs(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf('=')
      if (idx === -1) return { key: line, value: '' }
      return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
    })
    .filter((entry) => entry.key)
}

function parseLabels(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':')
      if (idx === -1) return { key: line, value: '' }
      return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
    })
    .filter((entry) => entry.key)
}

function parseAnnotations(text) {
  return parseLabels(text)
}

function indent(level) {
  return '  '.repeat(level)
}

export function buildKubernetesManifests(o) {
  const docs = []
  const warnings = []

  const name = String(o.name || '').trim() || 'app'
  const namespace = String(o.namespace || '').trim() || 'default'
  const image = `${String(o.image || 'myregistry/app').trim()}:${String(o.tag || 'latest').trim()}`
  const replicas = Math.max(1, Number(o.replicas) || 1)
  const port = Math.max(0, Number(o.port) || 0)

  if (!String(o.name || '').trim()) warnings.push('name')
  if (!String(o.image || '').trim()) warnings.push('image')

  const labels = [
    { key: 'app.kubernetes.io/name', value: name },
    { key: 'app.kubernetes.io/instance', value: name },
    ...parseLabels(o.extraLabels),
  ]

  const selectorLabels = [
    { key: 'app.kubernetes.io/name', value: name },
  ]

  const annotations = parseAnnotations(o.annotations)

  const envEntries = []
  const configPairs = parseKeyValuePairs(o.configMapData)
  const secretPairs = parseKeyValuePairs(o.secretData)

  // Namespace
  docs.push([
    'apiVersion: v1',
    'kind: Namespace',
    'metadata:',
    `${indent(1)}name: ${namespace}`,
  ].join('\n'))

  // ConfigMap
  if (o.includeConfigMap && configPairs.length) {
    const lines = [
      'apiVersion: v1',
      'kind: ConfigMap',
      'metadata:',
      `${indent(1)}name: ${String(o.configMapName || `${name}-config`).trim()}`,
      `${indent(1)}namespace: ${namespace}`,
      'data:',
    ]
    configPairs.forEach((entry) => {
      lines.push(`${indent(1)}${entry.key}: ${escapeYamlString(entry.value)}`)
    })
    docs.push(lines.join('\n'))
    envEntries.push({ type: 'configMapRef', name: String(o.configMapName || `${name}-config`).trim() })
  }

  // Secret
  if (o.includeSecret && secretPairs.length) {
    const lines = [
      'apiVersion: v1',
      'kind: Secret',
      'metadata:',
      `${indent(1)}name: ${String(o.secretName || `${name}-secrets`).trim()}`,
      `${indent(1)}namespace: ${namespace}`,
      'type: Opaque',
      'stringData:',
    ]
    secretPairs.forEach((entry) => {
      lines.push(`${indent(1)}${entry.key}: ${escapeYamlString(entry.value)}`)
    })
    docs.push(lines.join('\n'))
    envEntries.push({ type: 'secretRef', name: String(o.secretName || `${name}-secrets`).trim() })
  }

  // PVC
  if (o.kind === 'stateful') {
    const pvcSize = String(o.pvcSize || '1Gi').trim() || '1Gi'
    docs.push([
      'apiVersion: v1',
      'kind: PersistentVolumeClaim',
      'metadata:',
      `${indent(1)}name: ${name}-data`,
      `${indent(1)}namespace: ${namespace}`,
      'spec:',
      `${indent(1)}accessModes:`,
      `${indent(2)}- ReadWriteOnce`,
      `${indent(1)}resources:`,
      `${indent(2)}requests:`,
      `${indent(3)}storage: ${pvcSize}`,
    ].join('\n'))
  }

  // Deployment
  const deploymentLines = [
    'apiVersion: apps/v1',
    'kind: Deployment',
    'metadata:',
    `${indent(1)}name: ${name}`,
    `${indent(1)}namespace: ${namespace}`,
    `${indent(1)}labels:`,
  ]
  labels.forEach((l) => deploymentLines.push(`${indent(2)}${l.key}: ${escapeYamlString(l.value)}`))
  if (annotations.length) {
    deploymentLines.push(`${indent(1)}annotations:`)
    annotations.forEach((a) => deploymentLines.push(`${indent(2)}${a.key}: ${escapeYamlString(a.value)}`))
  }
  deploymentLines.push('spec:')
  deploymentLines.push(`${indent(1)}replicas: ${replicas}`)
  deploymentLines.push(`${indent(1)}selector:`)
  deploymentLines.push(`${indent(2)}matchLabels:`)
  selectorLabels.forEach((l) => deploymentLines.push(`${indent(3)}${l.key}: ${escapeYamlString(l.value)}`))
  deploymentLines.push(`${indent(1)}template:`)
  deploymentLines.push(`${indent(2)}metadata:`)
  deploymentLines.push(`${indent(3)}labels:`)
  selectorLabels.forEach((l) => deploymentLines.push(`${indent(4)}${l.key}: ${escapeYamlString(l.value)}`))
  deploymentLines.push(`${indent(2)}spec:`)
  deploymentLines.push(`${indent(3)}containers:`)
  deploymentLines.push(`${indent(4)}- name: ${name}`)
  deploymentLines.push(`${indent(4)}  image: ${image}`)
  deploymentLines.push(`${indent(4)}  imagePullPolicy: IfNotPresent`)

  if (port) {
    deploymentLines.push(`${indent(4)}  ports:`)
    deploymentLines.push(`${indent(4)}  - containerPort: ${port}`)
    deploymentLines.push(`${indent(4)}    name: http`)
  }

  if (envEntries.length) {
    deploymentLines.push(`${indent(4)}  envFrom:`)
    envEntries.forEach((entry) => {
      if (entry.type === 'configMapRef') {
        deploymentLines.push(`${indent(4)}  - configMapRef:`)
        deploymentLines.push(`${indent(4)}      name: ${entry.name}`)
      } else {
        deploymentLines.push(`${indent(4)}  - secretRef:`)
        deploymentLines.push(`${indent(4)}      name: ${entry.name}`)
      }
    })
  }

  const hasResources =
    String(o.requestCpu || '').trim() ||
    String(o.requestMemory || '').trim() ||
    String(o.limitCpu || '').trim() ||
    String(o.limitMemory || '').trim()

  if (hasResources) {
    deploymentLines.push(`${indent(4)}  resources:`)
    const req = []
    if (String(o.requestCpu || '').trim()) req.push(`${indent(4)}    cpu: ${String(o.requestCpu).trim()}`)
    if (String(o.requestMemory || '').trim()) req.push(`${indent(4)}    memory: ${String(o.requestMemory).trim()}`)
    if (req.length) {
      deploymentLines.push(`${indent(4)}    requests:`)
      deploymentLines.push(...req)
    }
    const lim = []
    if (String(o.limitCpu || '').trim()) lim.push(`${indent(4)}    cpu: ${String(o.limitCpu).trim()}`)
    if (String(o.limitMemory || '').trim()) lim.push(`${indent(4)}    memory: ${String(o.limitMemory).trim()}`)
    if (lim.length) {
      deploymentLines.push(`${indent(4)}    limits:`)
      deploymentLines.push(...lim)
    }
  }

  const liveness = String(o.liveness || 'none').trim()
  const readiness = String(o.readiness || 'none').trim()
  const probePath = String(o.probePath || '/health').trim() || '/health'

  if (liveness !== 'none' && port) {
    deploymentLines.push(`${indent(4)}  livenessProbe:`)
    if (liveness === 'http') {
      deploymentLines.push(`${indent(4)}    httpGet:`)
      deploymentLines.push(`${indent(4)}      path: ${probePath}`)
      deploymentLines.push(`${indent(4)}      port: http`)
    } else {
      deploymentLines.push(`${indent(4)}    tcpSocket:`)
      deploymentLines.push(`${indent(4)}      port: http`)
    }
    deploymentLines.push(`${indent(4)}    initialDelaySeconds: 10`)
    deploymentLines.push(`${indent(4)}    periodSeconds: 10`)
  }

  if (readiness !== 'none' && port) {
    deploymentLines.push(`${indent(4)}  readinessProbe:`)
    if (readiness === 'http') {
      deploymentLines.push(`${indent(4)}    httpGet:`)
      deploymentLines.push(`${indent(4)}      path: ${probePath}`)
      deploymentLines.push(`${indent(4)}      port: http`)
    } else {
      deploymentLines.push(`${indent(4)}    tcpSocket:`)
      deploymentLines.push(`${indent(4)}      port: http`)
    }
    deploymentLines.push(`${indent(4)}    initialDelaySeconds: 5`)
    deploymentLines.push(`${indent(4)}    periodSeconds: 5`)
  }

  if (o.kind === 'stateful') {
    deploymentLines.push(`${indent(3)}volumes:`)
    deploymentLines.push(`${indent(4)}- name: data`)
    deploymentLines.push(`${indent(4)}  persistentVolumeClaim:`)
    deploymentLines.push(`${indent(4)}    claimName: ${name}-data`)
    deploymentLines.push(`${indent(4)}  volumeMounts:`)
    deploymentLines.push(`${indent(4)}  - name: data`)
    deploymentLines.push(`${indent(4)}    mountPath: /data`)
  }

  docs.push(deploymentLines.join('\n'))

  // Service (não para worker)
  if (o.kind !== 'worker' && port) {
    const serviceLines = [
      'apiVersion: v1',
      'kind: Service',
      'metadata:',
      `${indent(1)}name: ${name}`,
      `${indent(1)}namespace: ${namespace}`,
      `${indent(1)}labels:`,
    ]
    selectorLabels.forEach((l) => serviceLines.push(`${indent(2)}${l.key}: ${escapeYamlString(l.value)}`))
    serviceLines.push('spec:')
    serviceLines.push(`${indent(1)}type: ${String(o.serviceType || 'ClusterIP').trim()}`)
    serviceLines.push(`${indent(1)}selector:`)
    selectorLabels.forEach((l) => serviceLines.push(`${indent(2)}${l.key}: ${escapeYamlString(l.value)}`))
    serviceLines.push(`${indent(1)}ports:`)
    serviceLines.push(`${indent(2)}- port: ${port}`)
    serviceLines.push(`${indent(2)}  targetPort: http`)
    serviceLines.push(`${indent(2)}  name: http`)
    if (String(o.serviceType || '').trim() === 'NodePort') {
      serviceLines.push(`${indent(2)}  nodePort: 30080`)
    }
    docs.push(serviceLines.join('\n'))
  }

  // Ingress
  if (o.kind !== 'worker' && o.exposeIngress && port && String(o.host || '').trim()) {
    const host = String(o.host || '').trim()
    const path = String(o.path || '/').trim() || '/'
    const tls = Boolean(o.tls)
    const tlsSecret = String(o.tlsSecret || '').trim() || `${name}-tls`

    const ingressLines = [
      'apiVersion: networking.k8s.io/v1',
      'kind: Ingress',
      'metadata:',
      `${indent(1)}name: ${name}`,
      `${indent(1)}namespace: ${namespace}`,
      `${indent(1)}annotations:`,
      `${indent(2)}nginx.ingress.kubernetes.io/rewrite-target: /`,
    ]
    ingressLines.push('spec:')
    if (tls) {
      ingressLines.push(`${indent(1)}tls:`)
      ingressLines.push(`${indent(2)}- hosts:`)
      ingressLines.push(`${indent(3)}- ${host}`)
      ingressLines.push(`${indent(2)}  secretName: ${tlsSecret}`)
    }
    ingressLines.push(`${indent(1)}rules:`)
    ingressLines.push(`${indent(2)}- host: ${host}`)
    ingressLines.push(`${indent(2)}  http:`)
    ingressLines.push(`${indent(3)}    paths:`)
    ingressLines.push(`${indent(4)}- path: ${path}`)
    ingressLines.push(`${indent(4)}  pathType: Prefix`)
    ingressLines.push(`${indent(4)}  backend:`)
    ingressLines.push(`${indent(4)}    service:`)
    ingressLines.push(`${indent(4)}      name: ${name}`)
    ingressLines.push(`${indent(4)}      port:`)
    ingressLines.push(`${indent(4)}        number: ${port}`)
    docs.push(ingressLines.join('\n'))
  }

  // HPA
  if (o.includeHpa) {
    const min = Math.max(1, Number(o.minReplicas) || 1)
    const max = Math.max(min, Number(o.maxReplicas) || min)
    const targetCpu = Math.max(1, Number(o.targetCpu) || 50)
    const hpaLines = [
      'apiVersion: autoscaling/v2',
      'kind: HorizontalPodAutoscaler',
      'metadata:',
      `${indent(1)}name: ${name}`,
      `${indent(1)}namespace: ${namespace}`,
      'spec:',
      `${indent(1)}scaleTargetRef:`,
      `${indent(2)}apiVersion: apps/v1`,
      `${indent(2)}kind: Deployment`,
      `${indent(2)}name: ${name}`,
      `${indent(1)}minReplicas: ${min}`,
      `${indent(1)}maxReplicas: ${max}`,
      `${indent(1)}metrics:`,
      `${indent(2)}- type: Resource`,
      `${indent(2)}  resource:`,
      `${indent(2)}    name: cpu`,
      `${indent(2)}    target:`,
      `${indent(2)}      type: Utilization`,
      `${indent(2)}      averageUtilization: ${targetCpu}`,
    ]
    docs.push(hpaLines.join('\n'))
  }

  const text = docs.join('\n---\n')
  return { text, warnings }
}
