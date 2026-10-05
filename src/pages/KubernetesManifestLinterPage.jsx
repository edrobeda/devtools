import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Segmented, Alert, Table, Tag,
  Statistic, Row, Col, Collapse, Empty, Tooltip, message,
} from 'antd'
import {
  SafetyCertificateOutlined, CopyOutlined, CheckOutlined, DownloadOutlined,
  FileTextOutlined, ThunderboltOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { lintManifest } from '../utils/kubernetesManifestLinter'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const SEV_COLOR = { error: 'red', warning: 'orange', info: 'blue' }

// ─── Manifestos de exemplo ─────────────────────────────────────

const SAMPLES = {
  problems: `apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: API_Frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
      tier: web
  template:
    metadata:
      labels:
        app: api
    spec:
      hostNetwork: true
      containers:
        - name: api
          image: acme/api:latest
          ports:
            - containerPort: 8080
          securityContext:
            privileged: true
        - name: sidecar
          image: acme/proxy:2.1
          ports:
            - containerPort: 70000
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: NodePort
  selector:
    app: outro
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 99999
    - port: 443
      targetPort: 8443
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
type: Opaque
data:
  DB_PASSWORD: trocadodesenha
  tls.crt: aGVsbG8=
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: relatorio-diario
spec:
  schedule: "0 25 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Always
          containers:
            - name: relatorio
              image: acme/relatorio:3.2
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
spec:
  rules:
    - host: api.exemplo.com
      http:
        paths:
          - path: /
            backend:
              service:
                name: api-web
                port:
                  number: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 5
  maxReplicas: 2
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: api-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: api-reader
`,

  good: `apiVersion: v1
kind: Namespace
metadata:
  name: loja
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api
  namespace: loja
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: loja
data:
  LOG_LEVEL: info
  FEATURE_CHECKOUT: "true"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: loja
  labels:
    app.kubernetes.io/name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: api
    spec:
      serviceAccountName: api
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: api
          image: ghcr.io/eventifylab/api:1.4.2
          imagePullPolicy: IfNotPresent
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          ports:
            - name: http
              containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          livenessProbe:
            httpGet: {path: /healthz, port: http}
            initialDelaySeconds: 10
          readinessProbe:
            httpGet: {path: /ready, port: http}
---
apiVersion: v1
kind: Secret
metadata:
  name: api-tls
  namespace: loja
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCmZpbw==
  tls.key: LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCmZpbw==
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: loja
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: api
  ports:
    - name: http
      port: 80
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  namespace: loja
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  ingressClassName: nginx
  tls:
    - secretName: api-tls
      hosts: [api.exemplo.com]
  rules:
    - host: api.exemplo.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  name: http
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
  namespace: loja
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 12
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
`,

  broken: `# Two problemas de sintaxe que o kubectl acusa antes de qualquer regra:
# 1) indentação com TAB no primeiro bloco
apiVersion: v1
kind: ConfigMap
metadata:
\tname: config
---
# 2) coleção de fluxo que nunca fecha (o [ abre e não fecha)
apiVersion: v1
kind: Secret
metadata:
  name: segredo
data:
  senhas: [a, b, c
---
# 3) schedule de CronJob que não existe no relógio
apiVersion: batch/v1
kind: CronJob
metadata:
  name: tarefa
spec:
  schedule: "*/0 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: c
              image: busybox:1.36
`,
}

// ─── Traduções ─────────────────────────────────────────────────

const translations = {
  pt: {
    title: 'Validador de Manifestos Kubernetes',
    intro: (
      <>
        Cola um manifesto — YAML multi-document (<Text code>---</Text> separado) ou JSON — e a
        página aponta o que o <Text code>kubectl</Text> recusaria, o que funciona mas é armadilha e o que só é boa prática. São mais de 100 regras cobrindo
        <Text code>Deployment</Text>, <Text code>StatefulSet</Text>, <Text code>Job</Text>,{' '}
        <Text code>CronJob</Text>, <Text code>Service</Text>, <Text code>Ingress</Text>,{' '}
        <Text code>ConfigMap</Text>, <Text code>Secret</Text>, <Text code>PVC</Text>,{' '}
        <Text code>RBAC</Text> e <Text code>HPA</Text>, incluindo as checagens que só aparecem
        quando o mesmo arquivo traz vários recursos: selector do Service contra as labels do
        Deployment, <Text code>targetPort</Text> contra <Text code>containerPort</Text>, backend
        do Ingress contra o Service, <Text code>roleRef</Text> contra a Role. Tudo roda no
        navegador: nada do seu manifesto sai daqui.
      </>
    ),
    inputTitle: 'Manifesto',
    inputHint: 'Aceita vários recursos separados por ---, comentários e JSON.',
    samples: {
      problems: 'Com problemas',
      good: 'Boas práticas',
      broken: 'YAML quebrado',
    },
    clear: 'Limpar',
    copyInput: 'Copiar YAML',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    downloadReport: 'Baixar relatório',
    stDocs: 'Documentos',
    stResources: 'Recursos',
    stError: 'Erros',
    stWarning: 'Avisos',
    stInfo: 'Infos',
    sevError: 'Erro',
    sevWarning: 'Aviso',
    sevInfo: 'Info',
    okTitle: 'Nenhum erro encontrado',
    okBody:
      'O apply passa e as regras de segurança e de boa prática deste manifesto estão em dia. As infos restantes são apenas sugestões — confira a lista de regras abaixo para ver o que ainda dá para melhorar.',
    warnTitle: (n) => `${n} ${n === 1 ? 'erro' : 'erros'} encontrado${n === 1 ? '' : 's'}`,
    warnBody:
      'O que está em vermelho o kubectl (ou o control plane) recusa; em laranja, o recurso entra no cluster mas com frequência é o que você vai querer revisar antes do apply.',
    filterAll: 'Tudo',
    findingsTitle: 'Achados',
    findingsEmpty: 'Nenhum achado com esse filtro.',
    noInputTitle: 'Cole um manifesto para começar',
    noInputBody:
      'Use um dos exemplos acima, arraste um kubectl get all -o yaml para cá, ou cole o conteúdo de um arquivo .yaml de qualquer repositório.',
    colSev: 'Sev.',
    colRes: 'Recurso',
    colField: 'Campo',
    colMsg: 'Problema',
    defaultNs: 'default',
    docsTitle: 'Recursos lidos',
    docsHint: 'Um documento por linha de --- — é assim que o próprio kubectl apply -f divide.',
    colDoc: 'Doc',
    colKind: 'Kind',
    colApi: 'apiVersion',
    colName: 'Nome',
    colNs: 'Namespace',
    colFound: 'Achados',
    docEmpty: 'nenhum',
    zero: '0',
    rulesTitle: 'O que esta página checa',
    rulesHint:
      'A lista é a documentação do código: cada regra tem severidade fixa e só aparece quando a condição é Verdadeira no seu texto.',
    rules: {
      estrutura: {
        title: 'Estrutura do documento',
        items:
          'Separação em documentos por ---, erro de sintaxe YAML com linha, apiVersion/kind/metadata obrigatórios, nome e namespace no formato RFC 1123, apiVersion deprecada ou desconhecida, kind fora do catálogo, spec faltando, o mesmo recurso declarado duas vezes.',
      },
      workloads: {
        title: 'Workloads (Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod)',
        items:
          'selector matchLabels dentro das labels do template, containers sem nome ou duplicados, image sem tag ou com :latest, imagePullPolicy incoerente, resources ausente ou incompleto (requests/limits), probes, securityContext (privileged, allowPrivilegeEscalation, runAsNonRoot), hostNetwork/hostPID/hostIPC, hostPath, token de ServiceAccount montado sem necessidade, volume sem nome, restartPolicy inválida, replicas ausente, serviceName do StatefulSet, backoffLimit, ttlSecondsAfterFinished, schedule do CronJob (validada campo a campo, com nomes, L, W e #) e concurrencyPolicy.',
      },
      service: {
        title: 'Service',
        items:
          'tipo válido, portas no intervalo 1-65535, porta duplicada com protocolo, nodePort na faixa do Service NodePort, protocolo, nome de porta quando há mais de uma, targetPort, Service sem selector (e a exceção do ExternalName).',
      },
      ingress: {
        title: 'Ingress',
        items:
          'rules ou defaultBackend, pathType obrigatório em networking.k8s.io/v1, backend com service.name e porta, secretName do tls, host de TLS sem regra correspondente.',
      },
      dados: {
        title: 'ConfigMap, Secret e PVC',
        items:
          'chave com caractere fora de [-._a-zA-Z0-9], segredo com cara de segredo dentro de ConfigMap, valor de Secret.data que não é base64 (o API server recusa), stringData tratado como texto, PVC sem resources.requests.storage, accessModes inválidos, storageClassName ausente.',
      },
      rbac: {
        title: 'RBAC (Role, ClusterRole, RoleBinding, ClusterRoleBinding)',
        items:
          'rules vazio, verbs em falta, resources em falta, wildcard em verbs/resources/apiGroups, roleRef com kind/name válidos, Role dentro de ClusterRoleBinding e o inverso, subjects vazio, subject sem kind ou name, ServiceAccount sem namespace, subject duplicado.',
      },
      hpa: {
        title: 'HorizontalPodAutoscaler',
        items:
          'scaleTargetRef completo, minReplicas acima de maxReplicas, metrics obrigatório, métrica do tipo Resource sem bloco resource.',
      },
      cruzadas: {
        title: 'Checagens entre recursos do mesmo arquivo',
        items:
          'selector de Service que não casa com as labels de nenhum workload presente; targetPort que não corresponde a nenhum containerPort; service do backend do Ingress inexistente; secretName do tls que não está no arquivo; roleRef apontando para Role/ClusterRole ausente; ServiceAccount do subject ausente; scaleTargetRef do HPA sem workload correspondente. Quando você cola só um pedaço do cluster, essas regras passam em silêncio — elas só acusam o que está no texto.',
      },
    },
    howTitle: 'Como funciona (e o que ele não é)',
    howBody: (
      <>
        <Text strong>O parser é o mesmo do formatador de YAML desta casa</Text>, então os
        objetos saem da mesma forma, com a mesma posição de linha. Nenhum <Text code>kubectl</Text>,
        nenhum cluster, nenhuma chamada de rede — o texto é lido uma vez a cada tecla e a análise é
        feita em memória.
        <br />
        <br />
        <Text strong>É análise estática, não é o API server.</Text> As regras aqui cobrem o que
        causa mais dor no dia a dia (selector que não bate, segredo em texto claro, tag{' '}
        <Text code>latest</Text>, pathType faltando, cron inválido), mas um cluster real ainda
        rejeita campos que dependem de CRDs, admission webhooks, quotas, RBAC do cluster e da
        versão instalada. Para isso: <Text code>kubectl apply --dry-run=server -f manifesto.yaml</Text>{' '}
        ou <Text code>kubeconform</Text>. As duas coisas se complementam.
        <br />
        <br />
        <Text strong>Severidade é sobre aapply, não sobre estilo.</Text> <Text code>erro</Text>{' '}
        significa que o recurso não entra (ou entra quebrado), <Text code>aviso</Text> significa que
        entra e provavelmente vai te morder, <Text code>info</Text> é sugestão. Por isso um
        Deployment sem probe não é erro: o cluster sobe o pod igual.
      </>
    ),
    copyReport: 'Copiar relatório',
    reportTitle: 'Relatório de validação de manifestos Kubernetes',
    reportEmpty: 'Nenhum achado.',
    reportFooter: 'Gerado localmente no devtools — nenhuma chamada de rede foi feita.',
  },

  en: {
    title: 'Kubernetes Manifest Linter',
    intro: (
      <>
        Paste a manifest — multi-document YAML (separated by <Text code>---</Text>) or JSON — and
        the page flags what <Text code>kubectl</Text> would reject, what works but is a trap, and
        what is merely best practice. Over 100 rules cover <Text code>Deployment</Text>,{' '}
        <Text code>StatefulSet</Text>, <Text code>Job</Text>, <Text code>CronJob</Text>,{' '}
        <Text code>Service</Text>, <Text code>Ingress</Text>, <Text code>ConfigMap</Text>,{' '}
        <Text code>Secret</Text>, <Text code>PVC</Text>, <Text code>RBAC</Text> and{' '}
        <Text code>HPA</Text> — including the checks that only show up when one file carries
        several resources: Service selector against Deployment labels, <Text code>targetPort</Text>{' '}
        against <Text code>containerPort</Text>, Ingress backend against the Service,{' '}
        <Text code>roleRef</Text> against the Role. Everything runs in the browser: nothing from
        your manifest leaves here.
      </>
    ),
    inputTitle: 'Manifest',
    inputHint: 'Accepts several resources separated by ---, comments and JSON.',
    samples: {
      problems: 'With problems',
      good: 'Best practice',
      broken: 'Broken YAML',
    },
    clear: 'Clear',
    copyInput: 'Copy YAML',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    downloadReport: 'Download report',
    stDocs: 'Documents',
    stResources: 'Resources',
    stError: 'Errors',
    stWarning: 'Warnings',
    stInfo: 'Infos',
    sevError: 'Error',
    sevWarning: 'Warning',
    sevInfo: 'Info',
    okTitle: 'No errors found',
    okBody:
      'The apply goes through and this manifest is clean on the security and best-practice rules. The remaining infos are only suggestions — see the rule list below for what can still be improved.',
    warnTitle: (n) => `${n} ${n === 1 ? 'error' : 'errors'} found`,
    warnBody:
      'What is in red is what kubectl (or the control plane) refuses; in orange, the resource enters the cluster but is often what you want to review before the apply.',
    filterAll: 'All',
    findingsTitle: 'Findings',
    findingsEmpty: 'No findings with this filter.',
    noInputTitle: 'Paste a manifest to get started',
    noInputBody:
      'Use one of the samples above, drop a kubectl get all -o yaml here, or paste the contents of any .yaml file from a repository.',
    colSev: 'Sev.',
    colRes: 'Resource',
    colField: 'Field',
    colMsg: 'Problem',
    defaultNs: 'default',
    docsTitle: 'Resources read',
    docsHint: 'One document per --- line — this is how kubectl apply -f splits it too.',
    colDoc: 'Doc',
    colKind: 'Kind',
    colApi: 'apiVersion',
    colName: 'Name',
    colNs: 'Namespace',
    colFound: 'Findings',
    docEmpty: 'none',
    zero: '0',
    rulesTitle: 'What this page checks',
    rulesHint:
      'The list is the documentation of the code: every rule has a fixed severity and only shows up when the condition is true on your text.',
    rules: {
      estrutura: {
        title: 'Document structure',
        items:
          'Splitting into documents on ---, YAML syntax error with line, required apiVersion/kind/metadata, name and namespace in RFC 1123 format, deprecated or unknown apiVersion, kind outside the catalog, missing spec, the same resource declared twice.',
      },
      workloads: {
        title: 'Workloads (Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod)',
        items:
          'selector matchLabels inside the template labels, containers without a name or duplicated, image without a tag or with :latest, incoherent imagePullPolicy, missing or incomplete resources (requests/limits), probes, securityContext (privileged, allowPrivilegeEscalation, runAsNonRoot), hostNetwork/hostPID/hostIPC, hostPath, a ServiceAccount token mounted for no reason, volume without a name, invalid restartPolicy, missing replicas, StatefulSet serviceName, backoffLimit, ttlSecondsAfterFinished, CronJob schedule (validated field by field, with names, L, W and #) and concurrencyPolicy.',
      },
      service: {
        title: 'Service',
        items:
          'valid type, ports within 1-65535, duplicated port with protocol, nodePort inside the Service NodePort range, protocol, port name when there is more than one, targetPort, Service without selector (and the ExternalName exception).',
      },
      ingress: {
        title: 'Ingress',
        items:
          'rules or defaultBackend, pathType mandatory in networking.k8s.io/v1, backend with service.name and port, tls secretName, TLS host with no matching rule.',
      },
      dados: {
        title: 'ConfigMap, Secret and PVC',
        items:
          'key with a character outside [-._a-zA-Z0-9], a secret-looking value inside a ConfigMap, a Secret.data value that is not base64 (the API server rejects it), stringData treated as text, PVC without resources.requests.storage, invalid accessModes, missing storageClassName.',
      },
      rbac: {
        title: 'RBAC (Role, ClusterRole, RoleBinding, ClusterRoleBinding)',
        items:
          'empty rules, missing verbs, missing resources, wildcard in verbs/resources/apiGroups, roleRef with valid kind/name, a Role inside a ClusterRoleBinding and vice versa, empty subjects, subject without kind or name, ServiceAccount without namespace, duplicated subject.',
      },
      hpa: {
        title: 'HorizontalPodAutoscaler',
        items:
          'complete scaleTargetRef, minReplicas above maxReplicas, mandatory metrics, Resource metric without a resource block.',
      },
      cruzadas: {
        title: 'Checks across resources in the same file',
        items:
          'a Service selector that matches no workload label in the file; a targetPort that matches no containerPort; a missing service in the Ingress backend; a tls secretName that is not in the file; a roleRef pointing to an absent Role/ClusterRole; a missing ServiceAccount subject; an HPA scaleTargetRef with no matching workload. When you paste only a fragment of a cluster, these rules stay quiet — they only flag what is in the text.',
      },
    },
    howTitle: 'How it works (and what it is not)',
    howBody: (
      <>
        <Text strong>The parser is the same one used by this project&apos;s YAML formatter</Text>, so
        the objects come out the same way, with the same line positions. No <Text code>kubectl</Text>,
        no cluster, no network call — the text is read once per keystroke and the analysis happens in
        memory.
        <br />
        <br />
        <Text strong>This is static analysis, not the API server.</Text> The rules here cover what
        hurts most in day-to-day work (mismatched selector, secret in clear text,{' '}
        <Text code>latest</Text> tag, missing pathType, invalid cron), but a real cluster still
        rejects fields that depend on CRDs, admission webhooks, quotas, cluster RBAC and the
        installed version. For that: <Text code>kubectl apply --dry-run=server -f manifest.yaml</Text>{' '}
        or <Text code>kubeconform</Text>. The two complement each other.
        <br />
        <br />
        <Text strong>Severity is about the apply, not about style.</Text> <Text code>error</Text>{' '}
        means the resource does not go in (or goes in broken), <Text code>warning</Text> means it
        goes in and will probably bite you, <Text code>info</Text> is a suggestion. That is why a
        Deployment without a probe is not an error: the cluster starts the pod just fine.
      </>
    ),
    copyReport: 'Copy report',
    reportTitle: 'Kubernetes manifest validation report',
    reportEmpty: 'No findings.',
    reportFooter: 'Generated locally in the devtools — no network call was made.',
  },
}

// ─── Mensagens por regra (o "código" devolvido pelo linter) ─────

const PROBLEMS = {
  // estrutura
  e_parse: {
    pt: 'Erro de sintaxe no YAML: o API server não consegue ler este documento.',
    en: 'YAML syntax error: the API server cannot read this document.',
  },
  e_notMapping: {
    pt: 'O documento não é um mapa — um recurso do Kubernetes precisa de chaves como apiVersion e kind.',
    en: 'The document is not a mapping — a Kubernetes resource needs keys like apiVersion and kind.',
  },
  e_noApiVersion: {
    pt: 'Faltou apiVersion — sem ele o kubectl não sabe qual versão da API usar.',
    en: 'Missing apiVersion — without it kubectl does not know which API version to use.',
  },
  e_badApiVersion: {
    pt: 'apiVersion fora do formato group/version (ou v1 para o grupo core).',
    en: 'apiVersion outside the group/version format (or v1 for the core group).',
  },
  w_apiVersionDeprecated: {
    pt: 'Esta apiVersion foi removida do Kubernetes. Migrar para a versão estável correspondente.',
    en: 'This apiVersion was removed from Kubernetes. Migrate to the matching stable version.',
  },
  w_apiVersionUnknown: {
    pt: 'apiVersion fora do catálogo desta página — se for uma CRD, as checagens específicas dela não são aplicadas aqui.',
    en: 'apiVersion outside this page catalog — if it is a CRD, its specific checks are not applied here.',
  },
  e_noKind: {
    pt: 'Faltou kind — é o kind que diz ao API server qual schema o documento tem que respeitar.',
    en: 'Missing kind — kind is what tells the API server which schema the document must respect.',
  },
  w_unknownKind: {
    pt: 'Kind fora do catálogo desta página, então só as checagens estruturais foram aplicadas.',
    en: 'Kind outside this page catalog, so only the structural checks were applied.',
  },
  e_noName: {
    pt: 'Faltou metadata.name (ou generateName) — é o nome com que o recurso aparece no cluster.',
    en: 'Missing metadata.name (or generateName) — it is the name the resource shows up under in the cluster.',
  },
  e_badName: {
    pt: 'Nome inválido: Kubernetes exige RFC 1123 (minúsculas, dígitos, - e ., sem começar ou terminar com separador, até 253 caracteres).',
    en: 'Invalid name: Kubernetes requires RFC 1123 (lowercase, digits, - and ., not starting or ending with a separator, up to 253 characters).',
  },
  e_badNamespace: {
    pt: 'Namespace inválido: mesmo formato de nome RFC 1123.',
    en: 'Invalid namespace: same RFC 1123 name format.',
  },
  w_noNamespace: {
    pt: 'Sem metadata.namespace: o recurso cai no namespace "default", que quase nunca é o que se quer em produção.',
    en: 'No metadata.namespace: the resource lands in the "default" namespace, which is rarely what you want in production.',
  },
  w_clusterScopedInNs: {
    pt: 'Este kind é cluster-scoped e ignora metadata.namespace — um namespace aqui é só ruído (e alguns validadores reclamam).',
    en: 'This kind is cluster-scoped and ignores metadata.namespace — a namespace here is just noise (and some validators complain).',
  },
  e_noSpec: {
    pt: 'Faltou spec — para este kind, spec é obrigatório.',
    en: 'Missing spec — for this kind, spec is mandatory.',
  },
  e_dupResource: {
    pt: 'Recurso duplicado no mesmo arquivo: o segundo apply sobrescreve o primeiro e o diff do review fica confuso.',
    en: 'Duplicate resource in the same file: the second apply overwrites the first and the review diff gets confusing.',
  },
  w_ruleFailed: {
    pt: 'Uma regra falhou ao avaliar este documento — o restante das checagens segue valendo.',
    en: 'One rule failed to evaluate this document — the remaining checks still hold.',
  },

  // workloads
  e_noTemplate: {
    pt: 'Faltou o template do pod (spec.template) — sem ele não existe workload para o ReplicaSet criar.',
    en: 'Missing the pod template (spec.template) — without it there is no workload for the ReplicaSet to create.',
  },
  e_noSelector: {
    pt: 'Faltou spec.selector.matchLabels — obrigatório neste kind, e é o que amarra o controller aos pods.',
    en: 'Missing spec.selector.matchLabels — mandatory on this kind, and it is what ties the controller to the pods.',
  },
  e_emptySelector: {
    pt: 'spec.selector.matchLabels vazio: o controller passa a casar com qualquer pod do namespace.',
    en: 'Empty spec.selector.matchLabels: the controller starts matching any pod in the namespace.',
  },
  e_selectorMismatch: {
    pt: 'O selector não bate com as labels do template. É o erro que trava um rollout: o Deployment cria pods que ele mesmo não gerencia (e o apply muda o selector é rejeitado).',
    en: 'The selector does not match the template labels. This is the error that stalls a rollout: the Deployment creates pods it does not manage (and changing an existing selector is rejected on apply).',
  },
  e_noTemplateLabels: {
    pt: 'O template do pod não tem metadata.labels, então não há como casar com o selector.',
    en: 'The pod template has no metadata.labels, so there is nothing to match the selector against.',
  },
  e_noContainers: {
    pt: 'spec.containers vazio: um pod sem container é rejeitado na criação.',
    en: 'Empty spec.containers: a pod with no container is rejected on creation.',
  },
  e_containerNoName: {
    pt: 'Container sem name — o nome é como o kubectl, os logs e as métricas referenciam o container.',
    en: 'Container without a name — the name is how kubectl, the logs and the metrics reference the container.',
  },
  e_dupContainerName: {
    pt: 'Dois containers com o mesmo nome: o segundo sobrescreve o primeiro e o processo vira um só.',
    en: 'Two containers with the same name: the second overwrites the first and you end up with a single process.',
  },
  e_containerPortRange: {
    pt: 'containerPort fora de 1-65535.',
    en: 'containerPort outside 1-65535.',
  },
  e_badProtocol: {
    pt: 'Protocolo inválido — são TCP, UDP ou SCTP.',
    en: 'Invalid protocol — it must be TCP, UDP or SCTP.',
  },
  e_badPortName: {
    pt: 'Nome de porta inválido: até 15 caracteres, minúsculas, dígitos e - (e é assim que o Service casa por targetPort).',
    en: 'Invalid port name: up to 15 characters, lowercase, digits and - (and this is how a Service matches by targetPort).',
  },
  e_noImage: {
    pt: 'Container sem image — o pod fica em ErrImagePull.',
    en: 'Container without image — the pod sits in ErrImagePull.',
  },
  w_imageNoTag: {
    pt: 'Image sem tag: o Docker assume :latest implicitamente, então um apply amanhã pode trazer uma imagem diferente da que você testou.',
    en: 'Image without a tag: Docker implicitly assumes :latest, so tomorrow\'s apply may bring a different image than the one you tested.',
  },
  w_imageLatest: {
    pt: 'Image na tag :latest — o rollout deixa de ser reproduzível. Vale fixar versão (ou digest).',
    en: 'Image on the :latest tag — the rollout stops being reproducible. Pin a version (or a digest).',
  },
  w_pullPolicyAlways: {
    pt: 'imagePullPolicy: Always com tag fixa — ele só vai buscar se a tag for diferente da que está no node; para tag mutável o default seria IfNotPresent.',
    en: 'imagePullPolicy: Always with a fixed tag — it only pulls when the tag differs from what the node has; for a mutable tag the default would be IfNotPresent.',
  },
  e_badPullPolicy: {
    pt: 'imagePullPolicy inválido — os valores aceitos são Always, IfNotPresent e Never.',
    en: 'Invalid imagePullPolicy — the accepted values are Always, IfNotPresent and Never.',
  },
  w_noResources: {
    pt: 'Container sem requests/limits: o scheduler não sabe o tamanho do pod e não há teto de CPU/memória — é o caminho curto para OOMKill e para node inchado.',
    en: 'Container without requests/limits: the scheduler does not know the pod size and there is no CPU/memory ceiling — the short path to OOMKill and a bloated node.',
  },
  w_noLimits: {
    pt: 'Sem limits: o container pode consumir a memória do node inteiro antes de ser morto.',
    en: 'No limits: the container can consume the whole node memory before being killed.',
  },
  w_limitsIncomplete: {
    pt: 'limits só com um dos dois: defina cpu e memória juntos, senão um dos recursos fica sem teto.',
    en: 'limits with only one of the two: set cpu and memory together, otherwise one resource has no ceiling.',
  },
  w_limitsNoRequests: {
    pt: 'limits sem requests: o scheduler continua estimando pelo default da namespace, e o limite passa a ser surpresa em vez de plano.',
    en: 'limits without requests: the scheduler still estimates from the namespace default, and the limit becomes a surprise instead of a plan.',
  },
  w_requestsIncomplete: {
    pt: 'requests sem cpu e/ou memória: sem os dois o scheduler não consegue posicionar o pod.',
    en: 'requests without cpu and/or memory: without both the scheduler cannot place the pod.',
  },
  w_noProbes: {
    pt: 'Sem livenessProbe nem readinessProbe: o pod entra no Service antes de estar pronto e ninguém reinicia o processo se ele travar.',
    en: 'No livenessProbe nor readinessProbe: the pod joins the Service before it is ready and nothing restarts the process if it hangs.',
  },
  w_privileged: {
    pt: 'privileged: true equivale a rodar como root no host com todos os devices — o que costuma interessar é um capability específica.',
    en: 'privileged: true is running as root on the host with every device — usually what you want is a specific capability.',
  },
  w_allowPrivEsc: {
    pt: 'allowPrivilegeEscalation: true é o default do container runtime. Com runAsNonRoot + readOnlyRootFilesystem ele pode ser desligado.',
    en: 'allowPrivilegeEscalation: true is the container runtime default. With runAsNonRoot + readOnlyRootFilesystem it can be turned off.',
  },
  w_podRunAsRoot: {
    pt: 'O pod declara runAsNonRoot: false ou privileged no nível do pod.',
    en: 'The pod declares runAsNonRoot: false or privileged at pod level.',
  },
  w_noSecurityContext: {
    pt: 'Container sem securityContext — vale declarar ao menos allowPrivilegeEscalation: false e runAsNonRoot: true no pod.',
    en: 'Container without securityContext — at least declare allowPrivilegeEscalation: false and runAsNonRoot: true on the pod.',
  },
  w_secretInEnv: {
    pt: 'Variável de ambiente com cara de segredo e valor literal: Secret em texto claro no manifesto, no ConfigMap da Pipeline e no /proc do container.',
    en: 'Environment variable that looks like a secret with a literal value: a clear-text Secret in the manifest, in the Pipeline ConfigMap and in the container /proc.',
  },
  w_hostNamespace: {
    pt: 'hostNetwork/hostPID/hostIPC: o pod compartilha o namespace do host, o que derruba boa parte do isolamento e costuma ser bloqueado pelo Pod Security Standards.',
    en: 'hostNetwork/hostPID/hostIPC: the pod shares a host namespace, which breaks much of the isolation and is usually blocked by Pod Security Standards.',
  },
  w_dnsPolicyUnused: {
    pt: 'dnsPolicy ClusterFirstWithHostNet sem hostNetwork: a configuração não tem efeito.',
    en: 'dnsPolicy ClusterFirstWithHostNet without hostNetwork: the setting has no effect.',
  },
  w_automountToken: {
    pt: 'automountServiceAccountToken não é false: o token do ServiceAccount é montado em todo pod. Se a API não é usada, desligue.',
    en: 'automountServiceAccountToken is not false: the ServiceAccount token is mounted in every pod. If the API is unused, turn it off.',
  },
  e_badRestartPolicy: {
    pt: 'restartPolicy inválida — os valores são Always, OnFailure e Never.',
    en: 'Invalid restartPolicy — the values are Always, OnFailure and Never.',
  },
  e_volumeNoName: {
    pt: 'Volume sem name: o name é o que faz spec.volumes e volumeMounts casarem.',
    en: 'Volume without a name: the name is what makes spec.volumes and volumeMounts match.',
  },
  w_hostPath: {
    pt: 'Volume hostPath amarra o pod ao nó onde ele está agendado — o mesmo manifesto deixa de ser portátil e some no drain.',
    en: 'A hostPath volume ties the pod to the node it landed on — the same manifest stops being portable and disappears on drain.',
  },
  w_replicasDefault: {
    pt: 'spec.replicas ausente: o default é 1, o que costuma ser diferente do que o time espera em produção.',
    en: 'spec.replicas missing: the default is 1, which is often not what the team expects in production.',
  },
  w_replicasHigh: {
    pt: 'Quantidade alta de réplicas num único Deployment: em clusters compartilhados isso costuma estourar quota e ficar difícil de achar no HPA.',
    en: 'High replica count on a single Deployment: on shared clusters this tends to blow the quota and is hard to reason about alongside the HPA.',
  },
  e_noServiceName: {
    pt: 'StatefulSet sem spec.serviceName: é o Service que dá o DNS estável (pod-0.svc) que o StatefulSet promete.',
    en: 'StatefulSet without spec.serviceName: it is the Service that provides the stable DNS (pod-0.svc) the StatefulSet promises.',
  },

  // CronJob / Job
  e_noSchedule: {
    pt: 'CronJob sem spec.schedule — é o campo que diz quando o Job é criado.',
    en: 'CronJob without spec.schedule — it is the field that says when the Job is created.',
  },
  e_badSchedule: {
    pt: 'Expressão cron inválida — o controller não cria o Job e o status fica sem informação do motivo.',
    en: 'Invalid cron expression — the controller never creates the Job and the status gives no reason.',
  },
  w_noTimezone: {
    pt: 'Sem timeZone, o CronJob roda no fuso do kubelet — o mesmo manifesto roda em horários diferentes em cada nó.',
    en: 'Without timeZone the CronJob runs in the kubelet timezone — the same manifest runs at different times on each node.',
  },
  w_noConcurrencyPolicy: {
    pt: 'Sem concurrencyPolicy, o default é Allow: um job que demora mais que o intervalo se acumula.',
    en: 'Without concurrencyPolicy the default is Allow: a job slower than its interval piles up.',
  },
  e_badConcurrencyPolicy: {
    pt: 'concurrencyPolicy inválido — são Allow, Forbid e Replace.',
    en: 'Invalid concurrencyPolicy — it must be Allow, Forbid or Replace.',
  },
  w_concurrencyAllow: {
    pt: 'concurrencyPolicy: Allow deixa jobs sobrepostos; Forbid ou Replace costumam ser o que se quer em job de relatório.',
    en: 'concurrencyPolicy: Allow lets jobs overlap; Forbid or Replace is usually what you want for a reporting job.',
  },
  w_noHistoryLimit: {
    pt: 'Limite de histórico ausente: o default guarda 3 jobs bem-sucedidos, o que custa um Job rodando sem parar.',
    en: 'History limit missing: the default keeps 3 successful jobs, which costs one permanently running Job.',
  },
  w_noDeadline: {
    pt: 'Sem startingDeadlineSeconds, uma janela perdida de execução (node fora, control plane ocupado) simplesmente não é recuperada.',
    en: 'Without startingDeadlineSeconds a missed window (node down, control plane busy) is simply not recovered.',
  },
  w_noBackoffLimit: {
    pt: 'Sem backoffLimit o Job só desiste depois de 6 tentativas, com backoff exponencial.',
    en: 'Without backoffLimit the Job only gives up after 6 attempts, with exponential backoff.',
  },
  w_noJobTtl: {
    pt: 'Sem ttlSecondsAfterFinished, o Job e o pod ficam no cluster para sempre depois de terminar.',
    en: 'Without ttlSecondsAfterFinished the Job and its pod stay in the cluster forever after finishing.',
  },
  w_jobRestartPolicy: {
    pt: 'restartPolicy: Always em Job — o Job só é concluído com Never ou OnFailure (Always deixa o pod em execução infinita).',
    en: 'restartPolicy: Always on a Job — a Job only completes with Never or OnFailure (Always leaves the pod running forever).',
  },

  // Service
  e_badServiceType: {
    pt: 'spec.type inválido — são ClusterIP, NodePort, LoadBalancer e ExternalName.',
    en: 'Invalid spec.type — it must be ClusterIP, NodePort, LoadBalancer or ExternalName.',
  },
  e_noPorts: {
    pt: 'Service sem spec.ports: não há nada para o kube-proxy programar.',
    en: 'Service without spec.ports: there is nothing for the kube-proxy to program.',
  },
  e_portRange: {
    pt: 'Porta fora do intervalo 1-65535.',
    en: 'Port outside the 1-65535 range.',
  },
  e_dupServicePort: {
    pt: 'Duas entradas com a mesma porta e protocolo.',
    en: 'Two entries with the same port and protocol.',
  },
  e_nodePortRange: {
    pt: 'nodePort fora da faixa 30000-32767.',
    en: 'nodePort outside the 30000-32767 range.',
  },
  w_noNodePort: {
    pt: 'Service NodePort sem nodePort explícito: o Kubernetes sorteia um, e a regra de firewall do time deixa de ter número fixo.',
    en: 'NodePort Service without an explicit nodePort: Kubernetes picks one, and your team firewall rule stops having a fixed number.',
  },
  w_noPortName: {
    pt: 'Mais de uma porta sem name: alguns controllers (Istio, gateway-api) exigem porta nomeada, e sem nome o Service fica ambíguo.',
    en: 'More than one port without a name: some controllers (Istio, gateway-api) require named ports, and without a name the Service is ambiguous.',
  },
  e_noExternalName: {
    pt: 'Service ExternalName sem spec.externalName: sem isso o Service fica sem endereço de destino.',
    en: 'ExternalName Service without spec.externalName: without it the Service has no destination address.',
  },
  w_selectorOnExternalName: {
    pt: 'ExternalName não faz seleção de pods — o selector aqui é ignorado.',
    en: 'ExternalName does not select pods — the selector here is ignored.',
  },
  w_serviceNoSelector: {
    pt: 'Service sem selector: ele não gerencia nenhum pod (normal quando quem aponta são Endpoints manuais).',
    en: 'Service without a selector: it manages no pods (normal when manual Endpoints point at it).',
  },

  // Ingress
  e_noIngressRules: {
    pt: 'Ingress sem rules e sem defaultBackend: nada é roteado.',
    en: 'Ingress with no rules and no defaultBackend: nothing gets routed.',
  },
  e_noPathType: {
    pt: 'Path sem pathType — em networking.k8s.io/v1 o campo é obrigatório e o apply é recusado.',
    en: 'Path without pathType — the field is mandatory in networking.k8s.io/v1 and the apply is rejected.',
  },
  e_badPathType: {
    pt: 'pathType inválido — em networking.k8s.io/v1 são Exact, Prefix e ImplementationSpecific.',
    en: 'Invalid pathType — in networking.k8s.io/v1 it must be Exact, Prefix or ImplementationSpecific.',
  },
  e_noIngressBackend: {
    pt: 'Path sem backend.service: é o campo que diz qual Service recebe o tráfego.',
    en: 'Path without backend.service: it is the field that says which Service receives the traffic.',
  },
  e_noIngressPort: {
    pt: 'backend.service.port precisa de number ou name.',
    en: 'backend.service.port needs number or name.',
  },
  w_ruleNoPaths: {
    pt: 'Regra de host com http.paths vazio: nada será roteado por esse host.',
    en: 'Host rule with empty http.paths: nothing will be routed through that host.',
  },
  w_noIngressClass: {
    pt: 'Sem ingressClassName: o controller é escolhido por um annotation legado ou pelo default do cluster, o que costuma dar no controller errado.',
    en: 'No ingressClassName: the controller is picked by a legacy annotation or by the cluster default, which usually means the wrong controller.',
  },
  e_noTlsSecret: {
    pt: 'Entrada tls sem secretName.',
    en: 'TLS entry without secretName.',
  },
  w_tlsNoHosts: {
    pt: 'tls sem hosts: o certificado vale para todos os hosts declarados no Ingress.',
    en: 'tls without hosts: the certificate covers every host declared in the Ingress.',
  },
  w_tlsHostNoRule: {
    pt: 'Host do TLS que não aparece em nenhuma rule — o certificado é emitido e o host não é roteado.',
    en: 'TLS host that does not appear in any rule — the certificate gets issued and the host is never routed.',
  },

  // ConfigMap / Secret / PVC
  w_emptyConfigMap: {
    pt: 'ConfigMap sem data nem binaryData.',
    en: 'ConfigMap without data or binaryData.',
  },
  e_configKeyCharset: {
    pt: 'Chave fora de [-._a-zA-Z0-9]: o API server recusa ConfigMap e Secret com essa chave.',
    en: 'Key outside [-._a-zA-Z0-9]: the API server rejects ConfigMaps and Secrets with that key.',
  },
  w_secretInConfigMap: {
    pt: 'Chave com cara de segredo dentro de ConfigMap — ConfigMap não tem criptografia nem RBAC próprio, então isso é texto puro para qualquer um com get no namespace.',
    en: 'Secret-looking key inside a ConfigMap — a ConfigMap has no encryption and no RBAC of its own, so this is plain text for anyone with get in the namespace.',
  },
  e_notBase64: {
    pt: 'Valor de Secret.data que não é base64: o API server recusa o Secret inteiro. Para texto puro, use stringData.',
    en: 'Secret.data value that is not base64: the API server rejects the whole Secret. For plain text, use stringData.',
  },
  w_emptySecret: {
    pt: 'Secret sem data e sem stringData.',
    en: 'Secret without data or stringData.',
  },
  e_noStorage: {
    pt: 'PVC sem spec.resources.requests.storage — é o tamanho do volume.',
    en: 'PVC without spec.resources.requests.storage — it is the size of the volume.',
  },
  w_storageFormat: {
    pt: 'Tamanho de volume fora do formato de quantity do Kubernetes (ex.: 10Gi, 500Mi, 1T).',
    en: 'Volume size outside the Kubernetes quantity format (e.g. 10Gi, 500Mi, 1T).',
  },
  e_noAccessMode: {
    pt: 'PVC sem accessModes: sem ele não há como decidir o modo de montagem.',
    en: 'PVC without accessModes: without it there is no way to decide the mount mode.',
  },
  e_badAccessMode: {
    pt: 'accessMode inválido — são ReadWriteOnce, ReadOnlyMany, ReadWriteMany e ReadWriteOncePod.',
    en: 'Invalid accessMode — it must be ReadWriteOnce, ReadOnlyMany, ReadWriteMany or ReadWriteOncePod.',
  },
  w_noStorageClass: {
    pt: 'Sem storageClassName o PVC usa a classe default do cluster (e um default deletado deixa o PVC preso em Pending).',
    en: 'Without storageClassName the PVC uses the cluster default class (and a deleted default leaves the PVC stuck Pending).',
  },

  // RBAC
  w_roleNoRules: {
    pt: 'Role sem rules: ela não concede nada.',
    en: 'Role without rules: it grants nothing.',
  },
  e_noVerbs: {
    pt: 'Regra sem verbs — é uma lista vazia, o que a API recusa.',
    en: 'Rule without verbs — that is an empty list, which the API rejects.',
  },
  e_noResourcesRule: {
    pt: 'Regra sem resources e sem nonResourceURLs: a regra não casa com nada.',
    en: 'Rule without resources and without nonResourceURLs: the rule matches nothing.',
  },
  w_wildcard: {
    pt: 'Wildcard: concede (ou permite listar) tudo no grupo. Funciona, mas é o que a revisão de segurança pede para ser justificado.',
    en: 'Wildcard: it grants (or allows listing) everything in the group. It works, but it is what security review will ask you to justify.',
  },
  e_noRoleRef: {
    pt: 'Binding sem roleRef: ele não se refere a nada.',
    en: 'Binding without roleRef: it refers to nothing.',
  },
  e_noRoleRefKind: {
    pt: 'roleRef.kind ausente — precisa ser Role ou ClusterRole.',
    en: 'roleRef.kind missing — it must be Role or ClusterRole.',
  },
  e_noRoleRefName: {
    pt: 'roleRef.name ausente — é o nome da Role/ClusterRole que está sendo vinculada.',
    en: 'roleRef.name missing — it is the name of the Role/ClusterRole being bound.',
  },
  e_badRoleRefKind: {
    pt: 'roleRef.kind inválido — só Role e ClusterRole.',
    en: 'Invalid roleRef.kind — only Role and ClusterRole.',
  },
  w_roleRefKind: {
    pt: 'Um ClusterRole em um RoleBinding (ou o inverso) funciona, mas costuma indicar que a intenção era outro objeto.',
    en: 'A ClusterRole in a RoleBinding (or the reverse) works, but it usually means another object was intended.',
  },
  e_noSubjects: {
    pt: 'Binding sem subjects: ele não se liga a ninguém e não dá acesso a nada.',
    en: 'Binding without subjects: it attaches to nobody and grants access to nobody.',
  },
  e_noSubjectKind: {
    pt: 'Subject sem kind — são User, Group ou ServiceAccount.',
    en: 'Subject without kind — it must be User, Group or ServiceAccount.',
  },
  e_badSubjectKind: {
    pt: 'subject.kind inválido — são User, Group e ServiceAccount.',
    en: 'Invalid subject.kind — it must be User, Group or ServiceAccount.',
  },
  e_noSubjectName: {
    pt: 'Subject sem name.',
    en: 'Subject without name.',
  },
  w_subjectNoNamespace: {
    pt: 'Subject ServiceAccount sem namespace: a API do RBAC exige o namespace explícito (o default é "default", não o namespace do binding).',
    en: 'ServiceAccount subject without namespace: the RBAC API requires it explicitly (the default is "default", not the binding namespace).',
  },
  w_dupSubject: {
    pt: 'Subject repetido na lista.',
    en: 'Duplicated subject in the list.',
  },
  w_roleNotFound: {
    pt: 'roleRef aponta para uma Role/ClusterRole que não está neste texto.',
    en: 'roleRef points at a Role/ClusterRole that is not in this text.',
  },
  w_subjectSaNotFound: {
    pt: 'ServiceAccount do subject não está neste texto.',
    en: 'The subject ServiceAccount is not in this text.',
  },

  // HPA
  e_noScaleTarget: {
    pt: 'HPA sem scaleTargetRef.kind e .name: não há workload para escalar.',
    en: 'HPA without scaleTargetRef.kind and .name: there is no workload to scale.',
  },
  e_badMaxReplicas: {
    pt: 'maxReplicas ausente ou menor que 1 — em autoscaling/v2 ele é obrigatório.',
    en: 'maxReplicas missing or below 1 — it is mandatory in autoscaling/v2.',
  },
  e_badMinReplicas: {
    pt: 'minReplicas precisa ser número.',
    en: 'minReplicas must be a number.',
  },
  e_minAboveMax: {
    pt: 'minReplicas acima de maxReplicas: o HPA é rejeitado na atualização.',
    en: 'minReplicas above maxReplicas: the HPA is rejected on update.',
  },
  e_noHpaMetrics: {
    pt: 'HPA sem metrics: em autoscaling/v2 o campo é obrigatório e o HPA nunca escala.',
    en: 'HPA without metrics: the field is mandatory in autoscaling/v2 and the HPA never scales.',
  },
  e_noMetricType: {
    pt: 'Métrica sem type — são Resource, Pods, Object, External ou ContainerResource.',
    en: 'Metric without type — it must be Resource, Pods, Object, External or ContainerResource.',
  },
  e_noMetricSpec: {
    pt: 'Métrica do tipo Resource sem o bloco resource (name e target).',
    en: 'Resource metric without the resource block (name and target).',
  },
  w_hpaTargetNotFound: {
    pt: 'scaleTargetRef aponta para um workload que não está neste texto.',
    en: 'scaleTargetRef points at a workload that is not in this text.',
  },

  // checagens cruzadas
  w_serviceSelectorNoMatch: {
    pt: 'Nenhum workload neste texto tem todas essas labels — o Service fica sem endpoint atrás.',
    en: 'No workload in this text has all of these labels — the Service ends up with no endpoints behind it.',
  },
  w_targetPortNoMatch: {
    pt: 'targetPort não corresponde a nenhum containerPort dos containers selecionados.',
    en: 'targetPort does not match any containerPort of the selected containers.',
  },
  w_ingressBackendNotFound: {
    pt: 'O Service deste backend não está neste texto (pode existir no cluster — aqui só dá para ver o que foi colado).',
    en: 'The Service of this backend is not in this text (it may exist in the cluster — here we can only see what was pasted).',
  },
  w_tlsSecretNotFound: {
    pt: 'O Secret de TLS não está neste texto (pode existir no cluster).',
    en: 'The TLS Secret is not in this text (it may exist in the cluster).',
  },
}

// ─── Grupos exibidos na referência de regras (a descrição de cada um
//     fica em translations.rules, em pt e en) ─────────────────

const RULE_GROUPS = [
  'estrutura',
  'workloads',
  'service',
  'ingress',
  'dados',
  'rbac',
  'hpa',
  'cruzadas',
]

// ─── Página ────────────────────────────────────────────────────

export default function KubernetesManifestLinterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState(() => SAMPLES.problems)
  const [sample, setSample] = useState('problems')
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState(null)

  const result = useMemo(() => lintManifest(text), [text])
  const { findings, docs, summary } = result

  const visible = useMemo(
    () => (filter === 'all' ? findings : findings.filter((f) => f.severity === filter)),
    [findings, filter],
  )

  const problemText = (code) => {
    const entry = PROBLEMS[code]
    if (!entry) return code
    return entry[lang]
  }

  const sevLabel = (sev) =>
    sev === 'error' ? t.sevError : sev === 'warning' ? t.sevWarning : t.sevInfo

  const docByIndex = useMemo(() => {
    const map = {}
    docs.forEach((d) => {
      map[d.index] = d
    })
    return map
  }, [docs])

  function loadSample(key) {
    setSample(key)
    setText(SAMPLES[key])
    setFilter('all')
  }

  const report = useMemo(() => {
    const lines = [`# ${t.reportTitle}`, '']
    lines.push(
      `${summary.documents} ${lang === 'pt' ? 'documentos' : 'documents'} · ` +
        `${summary.resources} ${lang === 'pt' ? 'recursos' : 'resources'} · ` +
        `${summary.error} ${lang === 'pt' ? 'erros' : 'errors'} · ` +
        `${summary.warning} ${lang === 'pt' ? 'avisos' : 'warnings'} · ` +
        `${summary.info} infos`,
      '',
    )
    if (findings.length === 0) {
      lines.push(t.reportEmpty, '')
    }
    findings.forEach((f) => {
      const res = f.kind ? `\`${f.kind}/${f.name || '-'}\`` : `\`#${f.doc}\``
      const ns = f.namespace ? ` (${f.namespace})` : ''
      const where = f.path ? ` \`${f.path}\`` : ''
      const ctx = f.ctx ? ` — ${f.ctx}` : ''
      lines.push(`- **[${sevLabel(f.severity).toLowerCase()}]** ${res}${ns}${where}: ${problemText(f.code)}${ctx}`)
    })
    lines.push('', `_${t.reportFooter}_`)
    return lines.join('\n')
  }, [findings, summary, lang, t, problemText])

  async function copy(which, value) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  function download() {
    const blob = new Blob([report + '\n'], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio-manifestos-k8s.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const findingColumns = [
    {
      title: t.colSev,
      dataIndex: 'severity',
      width: 92,
      render: (sev) => <Tag color={SEV_COLOR[sev]}>{sevLabel(sev)}</Tag>,
    },
    {
      title: t.colRes,
      dataIndex: 'kind',
      width: 230,
      render: (_, f) => {
        const d = docByIndex[f.doc]
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 12 }}>
              {f.kind || `#${f.doc}`}
              {f.name ? `/${f.name}` : ''}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {f.kind ? `#${f.doc} · ${f.namespace || t.defaultNs}` : `#${f.doc}`}
              {d && d.apiVersion ? ` · ${d.apiVersion}` : ''}
            </Text>
          </Space>
        )
      },
    },
    {
      title: t.colField,
      dataIndex: 'path',
      width: 260,
      render: (path, f) => (
        <Space direction="vertical" size={0}>
          <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
            {path || '—'}
          </Text>
          <Tooltip title={f.code}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {f.code}
            </Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t.colMsg,
      dataIndex: 'code',
      render: (code, f) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 13 }}>{problemText(code)}</Text>
          {f.ctx ? (
            <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
              {f.ctx}
            </Text>
          ) : null}
        </Space>
      ),
    },
  ]

  const docColumns = [
    { title: t.colDoc, dataIndex: 'index', width: 60 },
    {
      title: t.colKind,
      dataIndex: 'kind',
      width: 190,
      render: (v, d) => (d.status === 'ok' ? <Text strong>{v}</Text> : <Text type="secondary">{t.docEmpty}</Text>),
    },
    {
      title: t.colApi,
      dataIndex: 'apiVersion',
      width: 190,
      render: (v, d) => (d.status === 'ok' ? <Text code style={{ fontSize: 11 }}>{v}</Text> : d.error || '—'),
    },
    { title: t.colName, dataIndex: 'name', width: 180, render: (v, d) => v || '—' },
    {
      title: t.colNs,
      dataIndex: 'namespace',
      width: 130,
      render: (v, d) => (d.status === 'ok' ? v || <Text type="secondary">{t.defaultNs}</Text> : '—'),
    },
    {
      title: t.colFound,
      dataIndex: 'findingCount',
      width: 90,
      align: 'right',
      render: (v) =>
        v > 0 ? (
          <Tag color={v >= 3 ? 'red' : 'orange'} style={{ marginInlineEnd: 0 }}>
            {v}
          </Tag>
        ) : (
          <Text type="secondary">{t.zero}</Text>
        ),
    },
  ]

  const statCards = [
    { title: t.stDocs, value: summary.documents },
    { title: t.stResources, value: summary.resources },
    { title: t.stError, value: summary.error, color: summary.error > 0 ? '#cf1322' : undefined },
    { title: t.stWarning, value: summary.warning, color: summary.warning > 0 ? '#d46b08' : undefined },
    { title: t.stInfo, value: summary.info, color: summary.info > 0 ? '#1677ff' : undefined },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SafetyCertificateOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={<><FileTextOutlined /> {t.inputTitle}</>}
        extra={
          <Segmented
            value={sample}
            onChange={loadSample}
            options={Object.keys(SAMPLES).map((k) => ({ label: t.samples[k], value: k }))}
          />
        }
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.inputHint}</Text>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            spellCheck={false}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
          />
          <Space wrap>
            <Button
              icon={copied === 'yaml' ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => copy('yaml', text)}
              disabled={!text}
            >
              {copied === 'yaml' ? t.copied : t.copyInput}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setSample(''); setText(''); setFilter('all') }}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        {statCards.map((s) => (
          <Col xs={12} sm={8} md={Math.floor(24 / statCards.length)} key={s.title}>
            <Card size="small">
              <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontSize: 22 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {!text.trim() ? (
        <Alert type="info" showIcon message={t.noInputTitle} description={t.noInputBody} />
      ) : summary.error > 0 ? (
        <Alert type="error" showIcon message={t.warnTitle(summary.error)} description={t.warnBody} />
      ) : (
        <Alert type="success" showIcon message={t.okTitle} description={t.okBody} />
      )}

      <Card
        title={<><ThunderboltOutlined /> {t.findingsTitle}</>}
        extra={
          <Space wrap>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { label: `${t.filterAll} (${findings.length})`, value: 'all' },
                { label: `${t.sevError} (${summary.error})`, value: 'error' },
                { label: `${t.sevWarning} (${summary.warning})`, value: 'warning' },
                { label: `${t.sevInfo} (${summary.info})`, value: 'info' },
              ]}
            />
            <Button
              icon={copied === 'report' ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => copy('report', report)}
            >
              {copied === 'report' ? t.copied : t.copyReport}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={download}>
              {t.downloadReport}
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          rowKey={(f, i) => `${f.doc}-${f.code}-${f.path}-${i}`}
          dataSource={visible}
          columns={findingColumns}
          pagination={{ pageSize: 12, size: 'small', showSizeChanger: false }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.findingsEmpty} /> }}
        />
      </Card>

      <Card
        title={t.docsTitle}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.docsHint}</Text>}
      >
        <Table
          size="small"
          rowKey="index"
          dataSource={docs}
          columns={docColumns}
          pagination={false}
          scroll={{ y: 300 }}
        />
      </Card>

      <Card title={t.rulesTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.rulesHint}</Text>}>
        <Collapse
          items={RULE_GROUPS.map((key) => ({
            key,
            label: t.rules[key].title,
            children: <Text style={{ fontSize: 13 }}>{t.rules[key].items}</Text>,
          }))}
        />
      </Card>

      <Card title={t.howTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.howBody}</Paragraph>
      </Card>
    </Space>
  )
}
