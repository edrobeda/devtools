import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Segmented, Switch, Button, Alert, Collapse, message, Row, Col,
} from 'antd'
import { ClusterOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { PRESETS, DEFAULTS, KINDS, buildKubernetesManifests } from '../utils/kubernetesManifestGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE = `
function buildKubernetesManifests(o) {
  const docs = []
  const name = String(o.name || 'app').trim()
  const namespace = String(o.namespace || 'default').trim()
  const image = \`\${o.image}:\${o.tag}\`
  const replicas = Math.max(1, Number(o.replicas) || 1)
  const port = Math.max(0, Number(o.port) || 0)

  const labels = [
    { key: 'app.kubernetes.io/name', value: name },
    ...parseLabels(o.extraLabels),
  ]

  docs.push(\`apiVersion: v1\\nkind: Namespace\\nmetadata:\\n  name: \${namespace}\`)

  if (o.includeConfigMap) {
    docs.push(buildConfigMap(name, namespace, o.configMapData))
  }
  if (o.includeSecret) {
    docs.push(buildSecret(name, namespace, o.secretData))
  }
  if (o.kind === 'stateful') {
    docs.push(buildPvc(name, namespace, o.pvcSize))
  }

  docs.push(buildDeployment({ ...o, name, namespace, image, replicas, port, labels }))

  if (o.kind !== 'worker' && port) {
    docs.push(buildService(name, namespace, port, labels, o.serviceType))
  }
  if (o.kind !== 'worker' && o.exposeIngress && port && o.host) {
    docs.push(buildIngress(name, namespace, port, o.host, o.path, o.tls, o.tlsSecret))
  }
  if (o.includeHpa) {
    docs.push(buildHpa(name, namespace, o.minReplicas, o.maxReplicas, o.targetCpu))
  }

  return { text: docs.join('\\n---\\n'), warnings }
}
`.trim()

const translations = {
  pt: {
    title: 'Gerador de Manifestos Kubernetes',
    intro: (
      <>
        Monta manifestos YAML do Kubernetes 100% no navegador: <Text code>Namespace</Text>,{' '}
        <Text code>Deployment</Text>, <Text code>Service</Text>, <Text code>Ingress</Text>,{' '}
        <Text code>ConfigMap</Text>, <Text code>Secret</Text>, <Text code>HPA</Text> e{' '}
        <Text code>PVC</Text>. Escolha um preset, ajuste os campos e copie o YAML pronto para{' '}
        <Text code>kubectl apply -f</Text>.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Escolha um ponto de partida.',
    basicTitle: 'Básico',
    nameLabel: 'Nome da aplicação',
    nameHint: 'my-app',
    namespaceLabel: 'Namespace',
    namespaceHint: 'default',
    imageLabel: 'Imagem',
    imageHint: 'myregistry/my-app',
    tagLabel: 'Tag',
    tagHint: 'latest',
    replicasLabel: 'Réplicas',
    portLabel: 'Porta do container',
    resourcesTitle: 'Recursos',
    requestCpuLabel: 'CPU request',
    requestMemoryLabel: 'Memória request',
    limitCpuLabel: 'CPU limit',
    limitMemoryLabel: 'Memória limit',
    serviceTitle: 'Service',
    serviceTypeLabel: 'Tipo',
    serviceTypes: {
      ClusterIP: 'ClusterIP',
      NodePort: 'NodePort',
      LoadBalancer: 'LoadBalancer',
    },
    ingressTitle: 'Ingress',
    exposeIngressLabel: 'Criar Ingress',
    hostLabel: 'Host',
    hostHint: 'app.example.com',
    pathLabel: 'Path',
    pathHint: '/',
    tlsLabel: 'TLS',
    tlsSecretLabel: 'Secret TLS',
    hpaTitle: 'HPA',
    includeHpaLabel: 'Criar HorizontalPodAutoscaler',
    minReplicasLabel: 'Mínimo de réplicas',
    maxReplicasLabel: 'Máximo de réplicas',
    targetCpuLabel: 'CPU target (%)',
    probesTitle: 'Probes',
    livenessLabel: 'Liveness',
    readinessLabel: 'Readiness',
    probeOptions: {
      none: 'Nenhuma',
      http: 'HTTP',
      tcp: 'TCP',
    },
    probePathLabel: 'Caminho da probe',
    configTitle: 'ConfigMap & Secret',
    includeConfigMapLabel: 'Criar ConfigMap',
    configMapNameLabel: 'Nome do ConfigMap',
    configMapDataLabel: 'Dados (KEY=value por linha)',
    includeSecretLabel: 'Criar Secret',
    secretNameLabel: 'Nome do Secret',
    secretDataLabel: 'Dados (KEY=value por linha)',
    storageTitle: 'Storage',
    pvcSizeLabel: 'Tamanho do PVC',
    extraTitle: 'Metadados extras',
    extraLabelsLabel: 'Labels extras (chave: valor por linha)',
    annotationsLabel: 'Anotações do Deployment (chave: valor por linha)',
    outputTitle: 'YAML gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    stats: (docs, bytes) => `${docs} ${docs === 1 ? 'documento' : 'documentos'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — confira antes de aplicar:',
    warningsNone: 'Nenhum aviso. Sempre revise o YAML antes de aplicar no cluster.',
    wName: 'Nome da aplicação não informado.',
    wImage: 'Imagem do container não informada.',
    tipTitle: 'Dicas de uso',
    tipBody: (
      <>
        O YAML gerado é compatível com <Text code>kubectl apply -f manifest.yaml</Text>. Prefira
        declarar versões fixas de imagens em produção (ex.: <Text code>v1.2.3</Text>) em vez de{' '}
        <Text code>latest</Text>. Para TLS, crie o secret antes do ingress:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          kubectl create secret tls app-tls --cert=tls.crt --key=tls.key -n default
        </pre>
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc: 'O builder monta cada documento YAML separadamente e os une com ---, respeitando as regras de cada recurso do Kubernetes.',
  },
  en: {
    title: 'Kubernetes Manifest Generator',
    intro: (
      <>
        Builds Kubernetes YAML manifests 100% in the browser: <Text code>Namespace</Text>,{' '}
        <Text code>Deployment</Text>, <Text code>Service</Text>, <Text code>Ingress</Text>,{' '}
        <Text code>ConfigMap</Text>, <Text code>Secret</Text>, <Text code>HPA</Text> and{' '}
        <Text code>PVC</Text>. Pick a preset, tweak the fields and copy the YAML ready for{' '}
        <Text code>kubectl apply -f</Text>.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'Choose a starting point.',
    basicTitle: 'Basic',
    nameLabel: 'Application name',
    nameHint: 'my-app',
    namespaceLabel: 'Namespace',
    namespaceHint: 'default',
    imageLabel: 'Image',
    imageHint: 'myregistry/my-app',
    tagLabel: 'Tag',
    tagHint: 'latest',
    replicasLabel: 'Replicas',
    portLabel: 'Container port',
    resourcesTitle: 'Resources',
    requestCpuLabel: 'CPU request',
    requestMemoryLabel: 'Memory request',
    limitCpuLabel: 'CPU limit',
    limitMemoryLabel: 'Memory limit',
    serviceTitle: 'Service',
    serviceTypeLabel: 'Type',
    serviceTypes: {
      ClusterIP: 'ClusterIP',
      NodePort: 'NodePort',
      LoadBalancer: 'LoadBalancer',
    },
    ingressTitle: 'Ingress',
    exposeIngressLabel: 'Create Ingress',
    hostLabel: 'Host',
    hostHint: 'app.example.com',
    pathLabel: 'Path',
    pathHint: '/',
    tlsLabel: 'TLS',
    tlsSecretLabel: 'TLS secret',
    hpaTitle: 'HPA',
    includeHpaLabel: 'Create HorizontalPodAutoscaler',
    minReplicasLabel: 'Min replicas',
    maxReplicasLabel: 'Max replicas',
    targetCpuLabel: 'CPU target (%)',
    probesTitle: 'Probes',
    livenessLabel: 'Liveness',
    readinessLabel: 'Readiness',
    probeOptions: {
      none: 'None',
      http: 'HTTP',
      tcp: 'TCP',
    },
    probePathLabel: 'Probe path',
    configTitle: 'ConfigMap & Secret',
    includeConfigMapLabel: 'Create ConfigMap',
    configMapNameLabel: 'ConfigMap name',
    configMapDataLabel: 'Data (KEY=value per line)',
    includeSecretLabel: 'Create Secret',
    secretNameLabel: 'Secret name',
    secretDataLabel: 'Data (KEY=value per line)',
    storageTitle: 'Storage',
    pvcSizeLabel: 'PVC size',
    extraTitle: 'Extra metadata',
    extraLabelsLabel: 'Extra labels (key: value per line)',
    annotationsLabel: 'Deployment annotations (key: value per line)',
    outputTitle: 'Generated YAML',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    stats: (docs, bytes) => `${docs} ${docs === 1 ? 'document' : 'documents'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — review before applying:',
    warningsNone: 'No warnings. Always review the YAML before applying to a cluster.',
    wName: 'Application name is missing.',
    wImage: 'Container image is missing.',
    tipTitle: 'Usage tips',
    tipBody: (
      <>
        The generated YAML works with <Text code>kubectl apply -f manifest.yaml</Text>. Prefer
        fixed image versions in production (e.g. <Text code>v1.2.3</Text>) instead of{' '}
        <Text code>latest</Text>. For TLS, create the secret before the ingress:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          kubectl create secret tls app-tls --cert=tls.crt --key=tls.key -n default
        </pre>
      </>
    ),
    howTitle: 'How it works — source algorithm',
    howDesc: 'The builder assembles each YAML document separately and joins them with ---, respecting the rules of each Kubernetes resource.',
  },
}

export default function KubernetesManifestGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('web')
  const [fields, setFields] = useState(() => ({ ...DEFAULTS }))
  const [copied, setCopied] = useState(false)

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const applyPreset = (key) => {
    setPreset(key)
    setFields({ ...PRESETS[key] })
  }

  const result = useMemo(() => buildKubernetesManifests(fields), [fields])
  const { text, warnings } = result
  const uniqueWarnings = useMemo(() => Array.from(new Set(warnings)), [warnings])
  const docCount = text ? text.split('---').length : 0
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ClusterOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={preset}
          onChange={applyPreset}
          options={KINDS.map((k) => ({ label: PRESETS[k].label[lang], value: k }))}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.basicTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.nameLabel}</Text>
                  <Input
                    value={fields.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder={t.nameHint}
                    style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.namespaceLabel}</Text>
                  <Input
                    value={fields.namespace}
                    onChange={(e) => setField('namespace', e.target.value)}
                    placeholder={t.namespaceHint}
                    style={{ width: 180, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.imageLabel}</Text>
                  <Input
                    value={fields.image}
                    onChange={(e) => setField('image', e.target.value)}
                    placeholder={t.imageHint}
                    style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Text type="secondary">{t.tagLabel}</Text>
                  <Input
                    value={fields.tag}
                    onChange={(e) => setField('tag', e.target.value)}
                    placeholder={t.tagHint}
                    style={{ width: 120, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.replicasLabel}</Text>
                  <Input
                    type="number"
                    min={1}
                    value={fields.replicas}
                    onChange={(e) => setField('replicas', Number(e.target.value))}
                    style={{ width: 90, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Text type="secondary">{t.portLabel}</Text>
                  <Input
                    type="number"
                    min={0}
                    value={fields.port}
                    onChange={(e) => setField('port', Number(e.target.value))}
                    style={{ width: 90, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
              </Space>
            </Card>

            <Card title={t.resourcesTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.requestCpuLabel}</Text>
                  <Input
                    value={fields.requestCpu}
                    onChange={(e) => setField('requestCpu', e.target.value)}
                    placeholder="100m"
                    style={{ width: 100, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Text type="secondary">{t.requestMemoryLabel}</Text>
                  <Input
                    value={fields.requestMemory}
                    onChange={(e) => setField('requestMemory', e.target.value)}
                    placeholder="128Mi"
                    style={{ width: 100, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.limitCpuLabel}</Text>
                  <Input
                    value={fields.limitCpu}
                    onChange={(e) => setField('limitCpu', e.target.value)}
                    placeholder="500m"
                    style={{ width: 100, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Text type="secondary">{t.limitMemoryLabel}</Text>
                  <Input
                    value={fields.limitMemory}
                    onChange={(e) => setField('limitMemory', e.target.value)}
                    placeholder="512Mi"
                    style={{ width: 100, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
              </Space>
            </Card>

            <Card title={t.serviceTitle}>
              <Space wrap align="center">
                <Text type="secondary" style={{ minWidth: 120 }}>{t.serviceTypeLabel}</Text>
                <Segmented
                  value={fields.serviceType}
                  onChange={(v) => setField('serviceType', v)}
                  options={['ClusterIP', 'NodePort', 'LoadBalancer'].map((k) => ({ label: t.serviceTypes[k], value: k }))}
                />
              </Space>
            </Card>

            <Card title={t.ingressTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Text type="secondary">{t.exposeIngressLabel}</Text>
                  <Switch checked={fields.exposeIngress} onChange={(v) => setField('exposeIngress', v)} />
                </Space>
                {fields.exposeIngress && (
                  <>
                    <Space wrap align="center">
                      <Text type="secondary" style={{ minWidth: 120 }}>{t.hostLabel}</Text>
                      <Input
                        value={fields.host}
                        onChange={(e) => setField('host', e.target.value)}
                        placeholder={t.hostHint}
                        style={{ width: 240, fontFamily: 'monospace', fontSize: 12 }}
                      />
                      <Text type="secondary">{t.pathLabel}</Text>
                      <Input
                        value={fields.path}
                        onChange={(e) => setField('path', e.target.value)}
                        placeholder={t.pathHint}
                        style={{ width: 100, fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </Space>
                    <Space wrap align="center">
                      <Text type="secondary">{t.tlsLabel}</Text>
                      <Switch checked={fields.tls} onChange={(v) => setField('tls', v)} />
                      {fields.tls && (
                        <>
                          <Text type="secondary">{t.tlsSecretLabel}</Text>
                          <Input
                            value={fields.tlsSecret}
                            onChange={(e) => setField('tlsSecret', e.target.value)}
                            style={{ width: 160, fontFamily: 'monospace', fontSize: 12 }}
                          />
                        </>
                      )}
                    </Space>
                  </>
                )}
              </Space>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={12}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.hpaTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Text type="secondary">{t.includeHpaLabel}</Text>
                  <Switch checked={fields.includeHpa} onChange={(v) => setField('includeHpa', v)} />
                </Space>
                {fields.includeHpa && (
                  <Space wrap align="center">
                    <Text type="secondary">{t.minReplicasLabel}</Text>
                    <Input
                      type="number"
                      min={1}
                      value={fields.minReplicas}
                      onChange={(e) => setField('minReplicas', Number(e.target.value))}
                      style={{ width: 70, fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <Text type="secondary">{t.maxReplicasLabel}</Text>
                    <Input
                      type="number"
                      min={1}
                      value={fields.maxReplicas}
                      onChange={(e) => setField('maxReplicas', Number(e.target.value))}
                      style={{ width: 70, fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <Text type="secondary">{t.targetCpuLabel}</Text>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={fields.targetCpu}
                      onChange={(e) => setField('targetCpu', Number(e.target.value))}
                      style={{ width: 70, fontFamily: 'monospace', fontSize: 12 }}
                    />
                  </Space>
                )}
              </Space>
            </Card>

            <Card title={t.probesTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.livenessLabel}</Text>
                  <Segmented
                    value={fields.liveness}
                    onChange={(v) => setField('liveness', v)}
                    options={['none', 'http', 'tcp'].map((k) => ({ label: t.probeOptions[k], value: k }))}
                  />
                </Space>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.readinessLabel}</Text>
                  <Segmented
                    value={fields.readiness}
                    onChange={(v) => setField('readiness', v)}
                    options={['none', 'http', 'tcp'].map((k) => ({ label: t.probeOptions[k], value: k }))}
                  />
                </Space>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.probePathLabel}</Text>
                  <Input
                    value={fields.probePath}
                    onChange={(e) => setField('probePath', e.target.value)}
                    placeholder="/health"
                    style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
              </Space>
            </Card>

            <Card title={t.configTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Text type="secondary">{t.includeConfigMapLabel}</Text>
                  <Switch checked={fields.includeConfigMap} onChange={(v) => setField('includeConfigMap', v)} />
                </Space>
                {fields.includeConfigMap && (
                  <>
                    <Space wrap align="center">
                      <Text type="secondary" style={{ minWidth: 120 }}>{t.configMapNameLabel}</Text>
                      <Input
                        value={fields.configMapName}
                        onChange={(e) => setField('configMapName', e.target.value)}
                        style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </Space>
                    <TextArea
                      value={fields.configMapData}
                      onChange={(e) => setField('configMapData', e.target.value)}
                      placeholder={t.configMapDataLabel}
                      rows={3}
                      style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                  </>
                )}
                <Space wrap align="center">
                  <Text type="secondary">{t.includeSecretLabel}</Text>
                  <Switch checked={fields.includeSecret} onChange={(v) => setField('includeSecret', v)} />
                </Space>
                {fields.includeSecret && (
                  <>
                    <Space wrap align="center">
                      <Text type="secondary" style={{ minWidth: 120 }}>{t.secretNameLabel}</Text>
                      <Input
                        value={fields.secretName}
                        onChange={(e) => setField('secretName', e.target.value)}
                        style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </Space>
                    <TextArea
                      value={fields.secretData}
                      onChange={(e) => setField('secretData', e.target.value)}
                      placeholder={t.secretDataLabel}
                      rows={3}
                      style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                  </>
                )}
              </Space>
            </Card>

            {fields.kind === 'stateful' && (
              <Card title={t.storageTitle}>
                <Space wrap align="center">
                  <Text type="secondary" style={{ minWidth: 120 }}>{t.pvcSizeLabel}</Text>
                  <Input
                    value={fields.pvcSize}
                    onChange={(e) => setField('pvcSize', e.target.value)}
                    placeholder="10Gi"
                    style={{ width: 120, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </Space>
              </Card>
            )}

            <Card title={t.extraTitle}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <TextArea
                  value={fields.extraLabels}
                  onChange={(e) => setField('extraLabels', e.target.value)}
                  placeholder={t.extraLabelsLabel}
                  rows={2}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <TextArea
                  value={fields.annotations}
                  onChange={(e) => setField('annotations', e.target.value)}
                  placeholder={t.annotationsLabel}
                  rows={2}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <Card title={t.outputTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.stats(docCount, byteCount)}</Text>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, background: '#fafafa', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
            <code>{text}</code>
          </pre>
          <Button type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
            {copied ? t.copied : t.copy}
          </Button>
          <Alert
            type={uniqueWarnings.length ? 'warning' : 'success'}
            showIcon
            message={uniqueWarnings.length ? t.warningsTitle : t.warningsNone}
            description={
              uniqueWarnings.length ? (
                <Space direction="vertical" size={0}>
                  {uniqueWarnings.map((w) => (
                    <Text key={w} style={{ fontSize: 12 }}>
                      · {w === 'name' ? t.wName : t.wImage}
                    </Text>
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

      <Card title={t.howTitle}>
        <Paragraph type="secondary">{t.howDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>kubernetesManifestGenerator.js</Text>,
              children: <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>{SOURCE}</pre>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
