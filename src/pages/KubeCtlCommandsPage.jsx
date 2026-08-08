import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ClusterOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['context', 'cluster', 'scope', 'pods', 'workload', 'logs', 'net', 'config', 'output', 'maint']

const CATEGORY_COLOR = {
  context: 'blue',
  cluster: 'geekblue',
  scope: 'cyan',
  pods: 'purple',
  workload: 'magenta',
  logs: 'orange',
  net: 'volcano',
  config: 'green',
  output: 'lime',
  maint: 'red',
}

const labelOf = {
  context: { pt: 'Contextos & kubeconfig', en: 'Contexts & kubeconfig' },
  cluster: { pt: 'Cluster & inspeção', en: 'Cluster & inspection' },
  scope: { pt: 'Namespaces & escopo', en: 'Namespaces & scope' },
  pods: { pt: 'Pods', en: 'Pods' },
  workload: { pt: 'Deployments & rollouts', en: 'Deployments & rollouts' },
  logs: { pt: 'Logs, exec & debug', en: 'Logs, exec & debug' },
  net: { pt: 'Services & rede', en: 'Services & networking' },
  config: { pt: 'ConfigMaps & Secrets', en: 'ConfigMaps & Secrets' },
  output: { pt: 'Filtros & saída', en: 'Filtering & output' },
  maint: { pt: 'Operação & manutenção', en: 'Operations & maintenance' },
}

const COMMANDS = [
  { cmd: 'kubectl config get-contexts', cat: 'context', pt: 'Lista os contextos do seu kubeconfig', en: 'Lists the contexts in your kubeconfig' },
  { cmd: 'kubectl config current-context', cat: 'context', pt: 'Mostra o contexto em uso no momento', en: 'Shows the currently selected context' },
  { cmd: 'kubectl config use-context <nome>', cat: 'context', pt: 'Troca pra outro contexto (outro cluster/nome de usuário)', en: 'Switches to another context (different cluster/user)' },
  { cmd: 'kubectl config view', cat: 'context', pt: 'Exibe o kubeconfig inteiro', en: 'Shows the whole kubeconfig' },
  { cmd: 'kubectl config set-context --current --namespace=<ns>', cat: 'context', pt: 'Fixa o namespace padrão do contexto atual', en: 'Pins the default namespace for the current context' },
  { cmd: 'kubectl cluster-info', cat: 'cluster', pt: 'Endereços dos serviços de controle do cluster (API, DNS, proxy)', en: 'Addresses of the cluster control services (API, DNS, proxy)' },
  { cmd: 'kubectl version', cat: 'cluster', pt: 'Versão do client e do servidor', en: 'Client and server versions' },
  { cmd: 'kubectl get nodes', cat: 'cluster', pt: 'Lista os nós do cluster', en: 'Lists the cluster nodes' },
  { cmd: 'kubectl top nodes', cat: 'cluster', pt: 'Uso de CPU/memória por nó', en: 'Per-node CPU/memory usage' },
  { cmd: 'kubectl api-resources', cat: 'cluster', pt: 'Lista todos os tipos de recurso disponíveis', en: 'Lists all available resource types' },
  { cmd: 'kubectl explain <recurso>', cat: 'cluster', pt: 'Documenta um recurso no terminal (campos, tipos, hierarquia)', en: 'Documents a resource in the terminal (fields, types, hierarchy)' },
  { cmd: 'kubectl get ns', cat: 'scope', pt: 'Lista os namespaces', en: 'Lists namespaces' },
  { cmd: 'kubectl create ns <nome>', cat: 'scope', pt: 'Cria um namespace', en: 'Creates a namespace' },
  { cmd: 'kubectl delete ns <nome>', cat: 'scope', pt: 'Remove um namespace e TUDO que está dentro dele', en: 'Deletes a namespace and EVERYTHING inside it' },
  { cmd: 'kubectl get pods -A', cat: 'scope', pt: 'Pods de todos os namespaces (`-A` = `--all-namespaces`)', en: 'Pods across every namespace (`-A` = `--all-namespaces`)' },
  { cmd: 'kubectl get pods -n <ns>', cat: 'scope', pt: 'Pods de um namespace específico', en: 'Pods in a specific namespace' },
  { cmd: 'kubectl get pods', cat: 'pods', pt: 'Lista os pods do namespace atual', en: 'Lists pods in the current namespace' },
  { cmd: 'kubectl get pods -o wide', cat: 'pods', pt: 'Pods com IP e nó onde cada um roda', en: 'Pods with their IPs and host nodes' },
  { cmd: 'kubectl describe pod <nome>', cat: 'pods', pt: 'Detalhes e eventos do pod — o primeiro lugar pra entender por que está pendente/crashando', en: 'Pod details and events — the first place to understand why it is pending/crashing' },
  { cmd: 'kubectl get pod <nome> -o yaml', cat: 'pods', pt: 'Spec do pod em YAML, a fonte da verdade do que está rodando', en: 'The pod spec in YAML, the source of truth of what is running' },
  { cmd: 'kubectl delete pod <nome>', cat: 'pods', pt: 'Apaga o pod — se houver ReplicaSet, outro nasce no lugar', en: 'Deletes the pod — a ReplicaSet will replace it' },
  { cmd: 'kubectl top pod', cat: 'pods', pt: 'Uso de CPU/memória por pod', en: 'Per-pod CPU/memory usage' },
  { cmd: 'kubectl get deployments', cat: 'workload', pt: 'Lista os deployments (e as réplicas prontas de cada um)', en: 'Lists deployments (with ready replicas for each)' },
  { cmd: 'kubectl create deployment <nome> --image=<imagem>', cat: 'workload', pt: 'Cria um deployment a partir de uma imagem', en: 'Creates a deployment from an image' },
  { cmd: 'kubectl scale deployment <nome> --replicas=5', cat: 'workload', pt: 'Escala o número de réplicas pra cima ou pra baixo', en: 'Scales the number of replicas up or down' },
  { cmd: 'kubectl rollout status deployment/<nome>', cat: 'workload', pt: 'Acompanha o status do rollout em andamento', en: 'Watches the status of an in-progress rollout' },
  { cmd: 'kubectl rollout restart deployment/<nome>', cat: 'workload', pt: 'Reinicia os pods sem trocar a imagem (pra pegar novas configs)', en: 'Restarts pods without changing the image (to pick up new configs)' },
  { cmd: 'kubectl rollout undo deployment/<nome>', cat: 'workload', pt: 'Volta o rollout pra revisão anterior (rollback)', en: 'Rolls the deployment back to the previous revision' },
  { cmd: 'kubectl rollout history deployment/<nome>', cat: 'workload', pt: 'Histórico de revisões do deployment', en: 'Deployment revision history' },
  { cmd: 'kubectl get statefulsets', cat: 'workload', pt: 'Lista os StatefulSets (bancos, apps com identidade estável)', en: 'Lists StatefulSets (databases, apps needing stable identity)' },
  { cmd: 'kubectl get daemonsets', cat: 'workload', pt: 'Lista os DaemonSets (um pod por nó: agentes, exporters)', en: 'Lists DaemonSets (one pod per node: agents, exporters)' },
  { cmd: 'kubectl get all', cat: 'workload', pt: 'Pods, services, deployments e afins do namespace', en: 'Pods, services, deployments and friends in the namespace' },
  { cmd: 'kubectl logs <pod>', cat: 'logs', pt: 'Logs do pod', en: 'Pod logs' },
  { cmd: 'kubectl logs -f <pod>', cat: 'logs', pt: 'Segue os logs em tempo real (stream)', en: 'Streams the logs live' },
  { cmd: 'kubectl logs <pod> -c <container>', cat: 'logs', pt: 'Logs de um container específico do pod', en: 'Logs of one specific container in the pod' },
  { cmd: 'kubectl logs --tail=100 <pod>', cat: 'logs', pt: 'Só as últimas N linhas', en: 'Only the last N lines' },
  { cmd: 'kubectl exec -it <pod> -- /bin/sh', cat: 'logs', pt: 'Abre um shell interativo dentro do container', en: 'Opens an interactive shell inside the container' },
  { cmd: 'kubectl exec <pod> -- env', cat: 'logs', pt: 'Roda um comando avulso no container e sai', en: 'Runs a one-off command in the container and exits' },
  { cmd: 'kubectl cp <pod>:<caminho> ./local', cat: 'logs', pt: 'Copia arquivos de dentro do pod pra máquina local', en: 'Copies files from inside the pod to your machine' },
  { cmd: 'kubectl debug <pod>', cat: 'logs', pt: 'Sobe um container efêmero no pod pra investigar sem tocar no app', en: 'Adds an ephemeral container to the pod to inspect without touching the app' },
  { cmd: 'kubectl get svc', cat: 'net', pt: 'Lista os services (e os IPs de cluster de cada um)', en: 'Lists services (with their cluster IPs)' },
  { cmd: 'kubectl expose deployment <nome> --port=80 --target-port=8080', cat: 'net', pt: 'Expõe um deployment como Service', en: 'Exposes a deployment as a Service' },
  { cmd: 'kubectl port-forward svc/<nome> 8080:80', cat: 'net', pt: 'Encaminha uma porta local até um service/pod (sem Ingress, pro dev)', en: 'Forwards a local port to a service/pod (no Ingress, for dev)' },
  { cmd: 'kubectl get endpoints', cat: 'net', pt: 'IPs reais atrás de cada service', en: 'Real IPs behind each service' },
  { cmd: 'kubectl get ingress', cat: 'net', pt: 'Lista os Ingress (rotas HTTP externas → service)', en: 'Lists ingresses (external HTTP routes → service)' },
  { cmd: 'kubectl describe svc <nome>', cat: 'net', pt: 'Detalhes do service: selector, porta, endpoints', en: 'Service details: selector, port, endpoints' },
  { cmd: 'kubectl get cm', cat: 'config', pt: 'Lista os ConfigMaps', en: 'Lists ConfigMaps' },
  { cmd: 'kubectl create cm <nome> --from-file=config.env', cat: 'config', pt: 'Cria um ConfigMap a partir de um arquivo', en: 'Creates a ConfigMap from a file' },
  { cmd: 'kubectl get secret', cat: 'config', pt: 'Lista os Secrets', en: 'Lists Secrets' },
  { cmd: 'kubectl create secret generic <nome> --from-literal=CHAVE=valor', cat: 'config', pt: 'Cria um Secret com chaves literais', en: 'Creates a Secret from literal keys' },
  { cmd: 'kubectl get secret <nome> -o jsonpath=\'{.data.CHAVE}\' | base64 -d', cat: 'config', pt: 'Lê o valor decodificado de um Secret (o valor cru é base64)', en: 'Reads a decoded Secret value (the raw value is base64)' },
  { cmd: 'kubectl get pods -l app=api,env=prod', cat: 'output', pt: 'Filtra por labels (selector de vários pares chave=valor)', en: 'Filters by labels (multi-key selector chave=valor)' },
  { cmd: 'kubectl get pods -o json', cat: 'output', pt: 'Saída em JSON pronta pra ser consumida por jq', en: 'JSON output ready for jq' },
  { cmd: 'kubectl get pods --sort-by=.metadata.creationTimestamp', cat: 'output', pt: 'Ordena a saída por um campo (ordem de criação, etc.)', en: 'Sorts the output by a field (creation order, etc.)' },
  { cmd: 'kubectl get pods -L app', cat: 'output', pt: 'Mostra o valor de uma label como coluna extra', en: 'Shows a label value as an extra column' },
  { cmd: 'kubectl get events --sort-by=.lastTimestamp', cat: 'output', pt: 'Eventos do namespace, mais recentes por último', en: 'Namespace events, most recent last' },
  { cmd: 'kubectl apply -f arquivo.yaml', cat: 'maint', pt: 'Aplica um manifesto (cria ou atualiza os recursos)', en: 'Applies a manifest (creates or updates the resources)' },
  { cmd: 'kubectl delete -f arquivo.yaml', cat: 'maint', pt: 'Apaga os recursos declarados no manifesto', en: 'Deletes the resources declared in a manifest' },
  { cmd: 'kubectl diff -f arquivo.yaml', cat: 'maint', pt: 'Mostra o que mudaria no cluster sem aplicar nada', en: 'Shows what would change in the cluster without applying' },
  { cmd: 'kubectl drain <nó>', cat: 'maint', pt: 'Drena um nó: move os pods dele e o deixa fora de serviço', en: 'Drains a node: evicts its pods and takes it out of service' },
  { cmd: 'kubectl autoscale deployment <nome> --min=2 --max=10 --cpu-percent=70', cat: 'maint', pt: 'Cria um HPA que escala por uso de CPU', en: 'Creates a CPU-based HorizontalPodAutoscaler' },
  { cmd: 'kubectl get cronjobs', cat: 'maint', pt: 'Lista os CronJobs (jobs agendados)', en: 'Lists CronJobs (scheduled jobs)' },
]

const translations = {
  pt: {
    title: 'Comandos kubectl',
    intro: (
      <>
        Cheat sheet pesquisável dos comandos <Text code>kubectl</Text> mais
        usados no dia a dia — do kubeconfig e namespaces a pods, rollouts,
        logs e debug. Todo comando segue o mesmo esqueleto, então se você
        entende a estrutura, você adivinha metade dos comandos. Tudo
        client-side.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    tipTitle: 'Como ler um comando kubectl',
    tipBody: (
      <>
        O padrão é <Text code>kubectl &lt;verbo&gt; &lt;tipo&gt; [nome] [-n namespace] [-o formato] [flags]</Text>:
        verbos comuns são <Text code>get</Text>/<Text code>describe</Text>/<Text code>create</Text>/
        <Text code>delete</Text>/<Text code>apply</Text>, os tipos têm alias curtos
        (<Text code>po</Text>=pods, <Text code>deploy</Text>=deployments, <Text code>svc</Text>=services) e
        <Text code>-n</Text> limita a um namespace (sem ele, vale o do contexto atual).
        Uma ressalva clássica: <Text code>kubectl get all</Text> é enganoso — não lista
        tudo (nada de events, nodes nem ingress). Pra descobrir os campos de
        qualquer recurso, use <Text code>kubectl explain &lt;tipo&gt;</Text>.
      </>
    ),
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copiedTitle: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'kubectl Commands',
    intro: (
      <>
        A searchable cheat sheet of the <Text code>kubectl</Text> commands you
        use most — from kubeconfig and namespaces to pods, rollouts, logs and
        debugging. Every command follows the same skeleton, so once you
        understand the structure you can guess half the commands. All
        client-side.
      </>
    ),
    search: 'Search command or description...',
    all: 'All',
    empty: 'No command found. Try a different search or category.',
    tipTitle: 'How to read a kubectl command',
    tipBody: (
      <>
        The pattern is <Text code>kubectl &lt;verb&gt; &lt;type&gt; [name] [-n namespace] [-o format] [flags]</Text>:
        common verbs are <Text code>get</Text>/<Text code>describe</Text>/<Text code>create</Text>/
        <Text code>delete</Text>/<Text code>apply</Text>, types have short aliases
        (<Text code>po</Text>=pods, <Text code>deploy</Text>=deployments, <Text code>svc</Text>=services) and
        <Text code>-n</Text> scopes to a namespace (without it, the current context's is used).
        A classic gotcha: <Text code>kubectl get all</Text> is misleading — it does not list
        everything (no events, nodes or ingresses). To explore the fields of
        any resource, use <Text code>kubectl explain &lt;type&gt;</Text>.
      </>
    ),
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copiedTitle: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function KubeCtlCommandsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered
      .map((c) => `| ${c.cmd.replace(/\|/g, '\\|')} | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`)
      .join('\n')
    return head + rows
  }, [filtered, lang])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(mdTable)
      messageApi.success(t.copiedTitle)
    } catch {
      messageApi.error(t.copiedError || 'Error')
    }
  }

  const copyCommand = async (cmd) => {
    try {
      await navigator.clipboard.writeText(cmd)
      messageApi.success(t.copiedTitle)
    } catch {
      messageApi.error(t.copiedError || 'Error')
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<ClusterOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyCommand(item.cmd)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
