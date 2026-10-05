import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Select, Switch, Alert, Collapse,
  Tabs, Table, Tag, Row, Col, Segmented, message,
} from 'antd'
import {
  CloudServerOutlined, CopyOutlined, CheckOutlined, DownloadOutlined,
  PlusOutlined, DeleteOutlined, PartitionOutlined, FileTextOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS, DEFAULTS, RESOURCE_TYPES, VAR_TYPES,
  buildTerraform, defaultParams, mkRes, mkVar, mkOutput, autoResName,
} from '../utils/terraformConfigGenerator'
import sourceCode from '../utils/terraformConfigGenerator.js?raw'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const typeDef = (value) => RESOURCE_TYPES.find((x) => x.value === value) || RESOURCE_TYPES[0]

const translations = {
  pt: {
    title: 'Gerador de Configuração Terraform',
    intro: (
      <>
        Monta uma base de <Text code>.tf</Text> completa — <Text code>providers</Text>,{' '}
        <Text code>variables</Text>, <Text code>main</Text>, <Text code>outputs</Text> e um{' '}
        <Text code>terraform.tfvars.example</Text> — a partir de um formulário com os
        recursos mais usados da AWS, já no estilo do <Text code>terraform fmt</Text>.
        Também cruza o HCL gerado para achar variável declarada e não usada,{' '}
        <Text code>var.</Text> referenciada sem existir, segredo literal dentro do
        recurso e nome de bucket inválido. Tudo no navegador — nenhum arquivo sai daqui.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Um clique aplica uma base completa — ajuste depois.',
    providerTitle: 'Provider e requisitos',
    terraformVersion: 'required_version',
    awsVersion: 'Versão do provider aws',
    region: 'Região',
    profile: 'Profile (opcional)',
    defaultTags: 'default_tags no provider',
    defaultTagsHint: 'Com ligado, as tags de locals.tags são aplicadas em todo recurso automaticamente.',
    autoVars: 'Declarar automaticamente as variáveis faltantes',
    autoVarsSwitchHint: 'O gerador lê o HCL gerado, acha todo var.x sem declaração e cria o variable no variables.tf.',
    backendTitle: 'Backend remoto (state no S3)',
    backendBucket: 'Bucket do state',
    backendKey: 'Key',
    backendHint: 'Sem backend, o state fica em terraform.tfstate na pasta local — e ele nunca deve ir para o git.',
    tagsTitle: 'Tags (locals.tags)',
    project: 'Project',
    environment: 'Environment',
    owner: 'Owner',
    extraTags: 'Tags extras (KEY=VALOR, uma por linha)',
    varsTitle: 'Variáveis',
    varsHint: 'O que muda por ambiente. Marcar como sensitive esconde o valor no output do plan.',
    addVar: 'Adicionar variável',
    varName: 'Nome',
    varType: 'Tipo',
    varDefault: 'default',
    varDescription: 'Descrição',
    varSensitive: 'sensitive',
    resTitle: 'Recursos',
    resHint: 'Cada item vira um bloco resource (e os blocos auxiliares que ele exige: versionamento, listener, DLQ...).',
    addRes: 'Adicionar recurso',
    resLabel: 'Label do bloco',
    resType: 'Tipo de recurso',
    outTitle: 'Outputs',
    outHint: 'Automáticos: cada recurso expõe o que costuma ser útil (arn, endpoint, dns_name). Manuais: o que você quiser.',
    autoOutputs: 'Gerar outputs automáticos',
    addOut: 'Adicionar output',
    outName: 'Nome',
    outValue: 'Valor',
    outDescription: 'Descrição',
    filesTitle: 'Arquivos gerados',
    filesHint: 'Uma aba por arquivo. Copie tudo para um diretório novo e rode terraform init.',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyAll: 'Copiar todos os arquivos',
    download: 'Baixar',
    copyErr: 'Não foi possível copiar',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    summaryTitle: 'O que cada recurso virou',
    summaryHint: 'Endereço HCL do bloco, quantos blocos ele emitiu e quais variáveis ele consome.',
    colAddr: 'Endereço',
    colBlocks: 'Blocos',
    colVars: 'Variáveis usadas',
    colNone: 'nenhuma',
    blocks: (n) => `${n} ${n === 1 ? 'bloco' : 'blocos'}`,
    autoVarsTitle: 'Variáveis criadas automaticamente',
    autoVarsHint: 'O gerador achou estas referências no HCL gerado e declarou o variable correspondente em variables.tf.',
    autoVarsNone: 'Nenhuma variável automática: tudo referenciado já está declarado.',
    problemsTitle: 'Problemas',
    errorsTitle: 'Erros — o terraform plan vai falhar:',
    warningsTitle: 'Avisos — o plano passa, mas confira:',
    allGood: 'Nenhum erro encontrado. Valide de verdade rodando terraform validate e terraform fmt antes do apply.',
    noWarn: 'Nenhum aviso.',
    errCount: (n) => `${n} ${n === 1 ? 'erro' : 'erros'}`,
    tipsTitle: 'Entendendo o resultado',
    tipsBody: (
      <>
        <Text strong>Por que vários arquivos e não um só?</Text> O Terraform não exige
        isso — é convenção, e ela vale porque o <Text code>main.tf</Text> fica
        pequeno, o <Text code>variables.tf</Text> vira o contrato entre quem roda e
        quem escreve, e o <Text code>outputs.tf</Text> é o que outros stacks
        consomem. Nada impede você juntar tudo num arquivo único.
        <br />
        <br />
        <Text strong>Address e o ponto e vírgula.</Text>{' '}
        <Text code>resource "aws_s3_bucket" "site"</Text> cria o endereço{' '}
        <Text code>aws_s3_bucket.site</Text>. É por isso que os argumentos que se
        referenciam a outros recursos usam essa forma, e é por isso que o label só
        aceita letras, dígitos, <Text code>_</Text> e <Text code>-</Text> — e não
        pode começar com dígito. O gerador valida isso antes de gerar.
        <br />
        <br />
        <Text strong> Interpolação: {'${'}</Text> dentro de uma string é avaliada pelo
        Terraform, não pelo shell. É assim que{' '}
        <Text code>policy = data.aws_iam_policy_document.x.json</Text> vira um objeto
        de verdade, e é por isso que um <Text code>$</Text> solto dentro de um
        heredoc precisa de <Text code>$${'{ }'}</Text> para escapar.
        <br />
        <br />
        <Text strong>Tags: uma vez só.</Text> Com <Text code>default_tags</Text> no
        provider ligado, o bloco <Text code>locals.tags</Text> é aplicado em todo
        recurso criado, e os recursos não repetem o argumento <Text code>tags</Text>.
        Desligado, cada recurso recebe <Text code>tags = local.tags</Text>{' '}
        explicitamente — mais verboso, mas é o que funciona quando o recurso é
        criado por um módulo que você não controla.
        <br />
        <br />
        <Text strong>State é o ponto que ninguém lê.</Text> O state guarda o
        mapeamento entre o que existe na AWS e o que está no seu código —{' '}
        <Text code>terraform.tfstate</Text> e o <Text code>.tfstate</Text> do backend
        contêm dados legíveis, às vezes segredo. Nunca commite, e configure lock de
        estado no S3 (o Terraform 1.10+ aceita <Text code>use_lockfile = true</Text>,
        antes disso era DynamoDB). Um state perdido não é só，显 um recurso órfão:
        o Terraform passa a tentar recriá-lo.
        <br />
        <br />
        <Text strong>Antes do apply de verdade:</Text> <Text code>terraform fmt</Text>{' '}
        (formata — inclusive o código gerado aqui, que já sai alinhado),{' '}
        <Text code>terraform validate</Text>, <Text code>terraform plan -out=tfplan</Text>{' '}
        e só então <Text code>terraform apply tfplan</Text>. O plano é o contrato: se
        ele não foi revisado, o apply não deve acontecer.
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc:
      'O módulo tem três camadas. O catálogo RESOURCE_TYPES descreve cada tipo de recurso (label, pt/en dos campos, kinds de input) e um emissor que escreve os blocos HCL daquele tipo; o builder percorre os recursos, monta o main.tf com um comentário antes de cada endereço e monta providers/variables/outputs/tfvars separadamente. O validador roda sobre o estado do formulário (nomes, portas, nomes de bucket, flags de segurança) e sobre o texto já gerado — é dele que saem as cruzamentos entre variável declarada e variável referenciada, porque só o texto final sabe o que cada recurso consumiu de verdade. O emitter alinha os atributos em blocos de linhas consecutivas, como o terraform fmt, e deriva a indentação de cada chave a partir do contador de blocos abertos, para nenhum bloco de nível superior fechar indentado por engano.',
  },
  en: {
    title: 'Terraform Config Generator',
    intro: (
      <>
        Builds a complete <Text code>.tf</Text> base — <Text code>providers</Text>,{' '}
        <Text code>variables</Text>, <Text code>main</Text>, <Text code>outputs</Text> and a{' '}
        <Text code>terraform.tfvars.example</Text> — from a form covering the most
        used AWS resources, already formatted the way <Text code>terraform fmt</Text>{' '}
        would. It also cross-checks the generated HCL to find declared-but-unused
        variables, a <Text code>var.</Text> reference with no declaration, a literal
        secret inside a resource and an invalid bucket name. Runs in the browser —
        nothing leaves this page.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'One click applies a full base — tweak afterwards.',
    providerTitle: 'Provider and requirements',
    terraformVersion: 'required_version',
    awsVersion: 'aws provider version',
    region: 'Region',
    profile: 'Profile (optional)',
    defaultTags: 'default_tags on the provider',
    defaultTagsHint: 'When on, the locals.tags map is applied to every resource automatically.',
    autoVars: 'Auto-declare the missing variables',
    autoVarsSwitchHint: 'The generator reads the generated HCL, finds every var.x without a declaration and writes the matching variable into variables.tf.',
    backendTitle: 'Remote backend (state on S3)',
    backendBucket: 'State bucket',
    backendKey: 'Key',
    backendHint: 'Without a backend the state stays in a local terraform.tfstate — and it must never be committed.',
    tagsTitle: 'Tags (locals.tags)',
    project: 'Project',
    environment: 'Environment',
    owner: 'Owner',
    extraTags: 'Extra tags (KEY=VALUE, one per line)',
    varsTitle: 'Variables',
    varsHint: 'What changes per environment. Marking a variable sensitive hides its value in the plan output.',
    addVar: 'Add variable',
    varName: 'Name',
    varType: 'Type',
    varDefault: 'default',
    varDescription: 'Description',
    varSensitive: 'sensitive',
    resTitle: 'Resources',
    resHint: 'Each item becomes a resource block (plus the companion blocks it needs: versioning, listener, DLQ...).',
    addRes: 'Add resource',
    resLabel: 'Block label',
    resType: 'Resource type',
    outTitle: 'Outputs',
    outHint: 'Automatic: every resource exposes what is usually useful (arn, endpoint, dns_name). Manual: anything you want.',
    autoOutputs: 'Generate automatic outputs',
    addOut: 'Add output',
    outName: 'Name',
    outValue: 'Value',
    outDescription: 'Description',
    filesTitle: 'Generated files',
    filesHint: 'One tab per file. Copy everything into an empty directory and run terraform init.',
    copy: 'Copy',
    copied: 'Copied!',
    copyAll: 'Copy all files',
    download: 'Download',
    copyErr: 'Could not copy',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    summaryTitle: 'What each resource became',
    summaryHint: 'The HCL address of the block, how many blocks it emitted and which variables it consumes.',
    colAddr: 'Address',
    colBlocks: 'Blocks',
    colVars: 'Variables used',
    colNone: 'none',
    blocks: (n) => `${n} ${n === 1 ? 'block' : 'blocks'}`,
    autoVarsTitle: 'Automatically created variables',
    autoVarsHint: 'The generator found these references in the generated HCL and declared the matching variable in variables.tf.',
    autoVarsNone: 'No automatic variable: everything referenced is already declared.',
    problemsTitle: 'Problems',
    errorsTitle: 'Errors — terraform plan will fail:',
    warningsTitle: 'Warnings — the plan passes, but check:',
    allGood: 'No errors found. Really validate it with terraform validate and terraform fmt before applying.',
    noWarn: 'No warnings.',
    errCount: (n) => `${n} ${n === 1 ? 'error' : 'errors'}`,
    tipsTitle: 'Understanding the result',
    tipsBody: (
      <>
        <Text strong>Why several files and not one?</Text> Terraform does not
        require it — it is convention, and it pays off because <Text code>main.tf</Text>{' '}
        stays small, <Text code>variables.tf</Text> becomes the contract between who
        runs and who writes, and <Text code>outputs.tf</Text> is what other stacks
        consume. Nothing stops you from putting it all in one file.
        <br />
        <br />
        <Text strong>Address and the semicolon.</Text>{' '}
        <Text code>resource "aws_s3_bucket" "site"</Text> creates the address{' '}
        <Text code>aws_s3_bucket.site</Text>. That is why arguments referencing other
        resources use that shape, and why the label only accepts letters, digits,{' '}
        <Text code>_</Text> and <Text code>-</Text> — and cannot start with a digit.
        The generator validates this before emitting.
        <br />
        <br />
        <Text strong>Interpolation: {'${'}</Text> inside a string is evaluated by
        Terraform, not by the shell. That is how{' '}
        <Text code>policy = data.aws_iam_policy_document.x.json</Text> becomes a real
        object, and why a lone <Text code>$</Text> inside a heredoc needs{' '}
        <Text code>$${'{ }'}</Text> to escape.
        <br />
        <br />
        <Text strong>Tags: declare once.</Text> With <Text code>default_tags</Text> on
        the provider enabled, the <Text code>locals.tags</Text> map is applied to
        every managed resource and the resources do not repeat the{' '}
        <Text code>tags</Text> argument. With it off, each resource gets{' '}
        <Text code>tags = local.tags</Text> explicitly — more verbose, but it is what
        works when the resource is created by a module you do not control.
        <br />
        <br />
        <Text strong>State is the part nobody reads.</Text> State holds the mapping
        between what exists in AWS and what is in your code —{' '}
        <Text code>terraform.tfstate</Text> and the backend <Text code>.tfstate</Text>{' '}
        are readable files, sometimes with secrets in them. Never commit them, and
        configure state locking on S3 (Terraform 1.10+ accepts{' '}
        <Text code>use_lockfile = true</Text>; before that it was DynamoDB). A lost
        state is not just an orphan resource: Terraform will try to recreate it.
        <br />
        <br />
        <Text strong>Before the real apply:</Text> <Text code>terraform fmt</Text>{' '}
        (formats — including the code generated here, which already comes aligned),{' '}
        <Text code>terraform validate</Text>, <Text code>terraform plan -out=tfplan</Text>{' '}
        and only then <Text code>terraform apply tfplan</Text>. The plan is the
        contract: if it was not reviewed, the apply should not happen.
      </>
    ),
    howTitle: 'How it works — source',
    howDesc:
      'The module has three layers. The RESOURCE_TYPES catalog describes each resource type (label, pt/en field labels, input kinds) plus an emitter that writes the HCL blocks for that type; the builder walks the resources, assembles main.tf with a comment before each address, and assembles providers/variables/outputs/tfvars separately. The validator runs over the form state (names, ports, bucket names, security flags) and over the text that was actually generated — the declared-vs-referenced variable cross-check comes from there, because only the final text knows what each resource really consumed. The emitter aligns attributes inside runs of consecutive lines, like terraform fmt, and derives each closing brace indent from the open-block counter so no top-level block can close indented by mistake.',
  },
}

// ─── Mensagens de erro/aviso ────────────────────────────────────────────────
const PROBLEMS = {
  e_noLabel: {
    pt: 'Recurso sem label: o Terraform usa o label como endereço, então precisa existir.',
    en: 'Resource without a label: Terraform uses the label as the address, so it has to exist.',
  },
  e_badLabel: {
    pt: 'Label inválido: só letras, dígitos, _ e -, e não pode começar com dígito.',
    en: 'Invalid label: letters, digits, _ and - only, and it cannot start with a digit.',
  },
  e_dupResource: {
    pt: 'Recurso duplicado: dois blocos com o mesmo endereço, o último sobrescreve o primeiro.',
    en: 'Duplicate resource: two blocks with the same address, the last one wins.',
  },
  e_bucket_empty: { pt: 'Nome de bucket vazio.', en: 'Empty bucket name.' },
  e_bucket_length: {
    pt: 'Nome de bucket precisa ter de 3 a 63 caracteres.',
    en: 'Bucket name must be between 3 and 63 characters.',
  },
  e_bucket_chars: {
    pt: 'Nome de bucket inválido: só minúsculas, dígitos, ponto e hífen (e não pode ter _ nem maiúscula).',
    en: 'Invalid bucket name: lowercase, digits, dots and dashes only (no underscores, no uppercase).',
  },
  e_bucket_dots: {
    pt: 'Nome de bucket inválido: não pode ter pontos/underlines seguidos nem ".-" / "-.".',
    en: 'Invalid bucket name: no consecutive dots/underscores and no ".-" / "-.".',
  },
  e_bucket_ip: {
    pt: 'Nome de bucket não pode parecer um endereço IP (192.168.0.1).',
    en: 'Bucket name cannot look like an IP address (192.168.0.1).',
  },
  e_amiFormat: {
    pt: 'AMI inválida: o formato é ami- seguido do hex, e a AMI muda por região.',
    en: 'Invalid AMI: the format is ami- followed by hex, and the AMI changes per region.',
  },
  e_portFormat: {
    pt: 'Porta inválida: use um número (80, 443) ou a palavra all.',
    en: 'Invalid port: use a number (80, 443) or the word all.',
  },
  e_noCertificate: {
    pt: 'Listener HTTPS sem certificado: informe o ARN (ou troque o protocolo para HTTP).',
    en: 'HTTPS listener without a certificate: provide the ARN (or switch the protocol to HTTP).',
  },
  e_noSubnets: {
    pt: 'Load balancer sem subnets: o ALB precisa de ao menos duas subnets em AZs diferentes.',
    en: 'Load balancer without subnets: an ALB needs at least two subnets in different AZs.',
  },
  e_noHashKey: {
    pt: 'Tabela DynamoDB sem hash key: é obrigatório declarar a partition key.',
    en: 'DynamoDB table without a hash key: the partition key is mandatory.',
  },
  e_noRoleArn: {
    pt: 'Lambda sem role: o role ARN é obrigatório (a role precisa existir).',
    en: 'Lambda without a role: the role ARN is mandatory (and the role must exist).',
  },
  e_fifoSuffix: {
    pt: 'Fila FIFO precisa do sufixo .fifo no nome — e só FIFO pode ter esse sufixo.',
    en: 'A FIFO queue needs the .fifo name suffix — and only a FIFO queue may have it.',
  },
  e_varNoName: { pt: 'Variável sem nome.', en: 'Variable without a name.' },
  e_varBadName: {
    pt: 'Nome de variável inválido (só letras, dígitos, _ e -).',
    en: 'Invalid variable name (letters, digits, _ and - only).',
  },
  e_varDup: {
    pt: 'Variável duplicada: dois variable com o mesmo nome.',
    en: 'Duplicate variable: two variable blocks with the same name.',
  },
  e_varDefault: {
    pt: 'Default incompatível com o tipo declarado (number quer número, bool quer true/false).',
    en: 'Default does not match the declared type (number wants a number, bool wants true/false).',
  },
  e_varDefaultRef: {
    pt: 'Default não pode ser uma referência (var.x) — no apply a variável ainda não tem valor.',
    en: 'A default cannot be a reference (var.x) — at apply time the variable has no value yet.',
  },
  e_outNoName: { pt: 'Output sem nome.', en: 'Output without a name.' },
  e_outBadName: {
    pt: 'Nome de output inválido (só letras, dígitos, _ e -).',
    en: 'Invalid output name (letters, digits, _ and - only).',
  },
  e_outDup: { pt: 'Output duplicado.', en: 'Duplicate output.' },
  e_outNoValue: { pt: 'Output sem valor.', en: 'Output without a value.' },
  w_noResources: {
    pt: 'Nenhum recurso definido ainda: o Terraform roda, mas não cria nada.',
    en: 'No resource defined yet: Terraform runs but creates nothing.',
  },
  w_s3NoEncryption: {
    pt: 'Bucket sem criptografia em repouso: todo objeto da AWS é criptografado por padrão, declare mesmo assim.',
    en: 'Bucket without encryption at rest: every AWS object is encrypted by default — declare it anyway.',
  },
  w_s3NoVersioning: {
    pt: 'Bucket sem versionamento: um DELETE acidental não tem como voltar atrás.',
    en: 'Bucket without versioning: an accidental DELETE cannot be undone.',
  },
  w_amiExample: {
    pt: 'AMI de exemplo:AMI não é global, cada região tem a sua. Troque por uma da sua conta/região.',
    en: 'Example AMI: AMIs are not global, each region has its own. Replace it with one for your account/region.',
  },
  w_rootVolumeSmall: {
    pt: 'Volume raiz abaixo de 8 GB: a AMI Linux não sobe sem espaço para swap.',
    en: 'Root volume below 8 GB: a Linux AMI will not boot without room for swap.',
  },
  w_cidrAny: {
    pt: 'Ingress aberto para 0.0.0.0/0: aceitável em 80/443,投入到 22 e bancos é o que todo bot varre.',
    en: 'Ingress open to 0.0.0.0/0: fine on 80/443, on 22 and databases it is what every bot scans.',
  },
  w_rdsPublic: {
    pt: 'RDS acessível publicamente: o banco fica na internet direta.',
    en: 'RDS publicly accessible: the database sits directly on the internet.',
  },
  w_rdsNoEncryption: {
    pt: 'RDS sem storage_encrypted: o dado fica em texto claro no volume.',
    en: 'RDS without storage_encrypted: the data sits in clear text on the volume.',
  },
  w_rdsNoBackup: {
    pt: 'backup_retention_period = 0: um erro de comando não tem como recuperar.',
    en: 'backup_retention_period = 0: a bad statement cannot be undone.',
  },
  w_dynamoNoEncryption: {
    pt: 'DynamoDB sem server_side_encryption: a AWS usa chave da conta, mas explicitar é o esperado.',
    en: 'DynamoDB without server_side_encryption: AWS uses an account key by default, but being explicit is expected.',
  },
  w_provisionedZero: {
    pt: 'DynamoDB PROVISIONED com read capacity 0 — defina um valor ou volte para PAY_PER_REQUEST.',
    en: 'DynamoDB PROVISIONED with read capacity 0 — set a value or switch back to PAY_PER_REQUEST.',
  },
  w_secretLiteral: {
    pt: 'Achei um campo com cara de segredo (senha/secret/token) preenchido com valor literal — mova para variable e marque sensitive = true.',
    en: 'Found a password/secret/token-looking field filled with a literal value — move it to a variable and mark sensitive = true.',
  },
  w_varSecretDefault: {
    pt: 'Variável sensitive com default preenchido: o valor fica no código (e no state).',
    en: 'Sensitive variable with a filled default: the value lives in the code (and in state).',
  },
  w_unusedVar: {
    pt: 'Variável declarada que nenhum recurso usa — pode ser sobra de copy/paste.',
    en: 'Declared variable that no resource uses — likely leftover from copy/paste.',
  },
  w_missingVar: {
    pt: 'O código referencia var.x que não está declarada: o plan vai pedir o valor interativamente.',
    en: 'The code references a var.x that is not declared: the plan will prompt for the value.',
  },
  w_noRegion: {
    pt: 'Sem região declarada — o provider herda da environment (AWS_REGION).',
    en: 'No region declared — the provider falls back to the environment (AWS_REGION).',
  },
  w_noBackend: {
    pt: 'Sem backend: o state fica em terraform.tfstate na pasta local. Ele guarda dado sensível e NÃO pode ir para o git.',
    en: 'No backend: state stays in a local terraform.tfstate. It holds sensitive data and must NOT be committed.',
  },
}

export default function TerraformConfigGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [preset, setPreset] = useState('apiCompleta')
  const [cfg, setCfg] = useState(() => ({ ...DEFAULTS, ...PRESETS.apiCompleta.values() }))
  const [copied, setCopied] = useState(null)

  const setField = (k, v) => setCfg((c) => ({ ...c, [k]: v }))
  const setTag = (k, v) => setCfg((c) => ({ ...c, tags: { ...c.tags, [k]: v } }))

  const applyPreset = (key) => {
    setPreset(key)
    setCfg({ ...DEFAULTS, ...PRESETS[key].values() })
    setCopied(null)
  }

  const updateRes = (id, patch) =>
    setCfg((c) => ({ ...c, resources: c.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  const updateResParam = (id, k, v) =>
    setCfg((c) => ({
      ...c,
      resources: c.resources.map((r) => (r.id === id ? { ...r, params: { ...r.params, [k]: v } } : r)),
    }))
  const removeRes = (id) => setCfg((c) => ({ ...c, resources: c.resources.filter((r) => r.id !== id) }))
  const addRes = () =>
    setCfg((c) => ({
      ...c,
      resources: [...c.resources, { ...mkRes('s3', autoResName('s3')), auto: true }],
    }))

  const updateVar = (id, patch) =>
    setCfg((c) => ({ ...c, variables: c.variables.map((v) => (v.id === id ? { ...v, ...patch } : v)) }))
  const removeVar = (id) => setCfg((c) => ({ ...c, variables: c.variables.filter((v) => v.id !== id) }))
  const addVar = () => setCfg((c) => ({ ...c, variables: [...c.variables, mkVar('', 'string', '', '')] }))

  const updateOut = (id, patch) =>
    setCfg((c) => ({ ...c, outputs: c.outputs.map((o) => (o.id === id ? { ...o, ...patch } : o)) }))
  const removeOut = (id) => setCfg((c) => ({ ...c, outputs: c.outputs.filter((o) => o.id !== id) }))
  const addOut = () => setCfg((c) => ({ ...c, outputs: [...c.outputs, mkOutput('', '')] }))

  const out = useMemo(() => buildTerraform(cfg, lang), [cfg, lang])
  const { files, summary, problems, autoVars } = out

  const allText = files.map((f) => '### ' + f.name + '\n' + f.text).join('\n\n')
  const meta = (text) => t.stats(text.split('\n').length, new TextEncoder().encode(text).length)

  async function copy(which, text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500)
    } catch {
      message.error(t.copyErr)
    }
  }

  function download(name, text) {
    const blob = new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyBtn(which, text) {
    return (
      <Button
        icon={copied === which ? <CheckOutlined /> : <CopyOutlined />}
        onClick={() => copy(which, text)}
      >
        {copied === which ? t.copied : t.copy}
      </Button>
    )
  }

  const preStyle = {
    margin: 0, fontSize: 12, lineHeight: 1.6, background: '#fafafa',
    padding: 12, borderRadius: 6, overflowX: 'auto', maxHeight: 460, overflowY: 'auto',
  }

  const problemText = (key) => {
    const entry = PROBLEMS[key]
    if (!entry) return key
    return entry[lang]
  }

  const fieldLabel = (f) => (lang === 'pt' ? f.pt : f.en)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CloudServerOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.presetsHint}</Text>}>
        <Segmented
          value={preset}
          onChange={applyPreset}
          options={Object.keys(PRESETS).map((k) => ({ label: PRESETS[k].label[lang], value: k }))}
        />
      </Card>

      <Card title={t.providerTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.terraformVersion}</Text>
                <Input
                  value={cfg.terraformVersion}
                  onChange={(e) => setField('terraformVersion', e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.awsVersion}</Text>
                <Input
                  value={cfg.awsVersion}
                  onChange={(e) => setField('awsVersion', e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.region}</Text>
                <Input
                  value={cfg.region}
                  onChange={(e) => setField('region', e.target.value)}
                  placeholder="var.aws_region"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Space>
            </Col>
          </Row>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.profile}</Text>
                <Input
                  value={cfg.profile}
                  onChange={(e) => setField('profile', e.target.value)}
                  placeholder="default"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Space>
            </Col>
            <Col xs={24} md={16}>
              <Space direction="vertical" size={0}>
                <Space size="small">
                  <Text type="secondary">{t.defaultTags}</Text>
                  <Switch checked={cfg.defaultTags} onChange={(v) => setField('defaultTags', v)} />
                  <Text type="secondary">{t.autoVars}</Text>
                  <Switch checked={cfg.autoVars} onChange={(v) => setField('autoVars', v)} />
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {cfg.defaultTags ? t.defaultTagsHint : ''}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {cfg.autoVars ? t.autoVarsSwitchHint : ''}
                </Text>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card
        title={t.backendTitle}
        extra={
          <Space size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>backend "s3"</Text>
            <Switch checked={cfg.backend} onChange={(v) => setField('backend', v)} />
          </Space>
        }
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {cfg.backend ? (
            <Space wrap size="small">
              <Text type="secondary">{t.backendBucket}</Text>
              <Input
                value={cfg.backendBucket}
                onChange={(e) => setField('backendBucket', e.target.value)}
                style={{ width: 230, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Text type="secondary">{t.backendKey}</Text>
              <Input
                value={cfg.backendKey}
                onChange={(e) => setField('backendKey', e.target.value)}
                style={{ width: 280, fontFamily: 'monospace', fontSize: 12 }}
              />
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>{t.backendHint}</Text>
          )}
        </Space>
      </Card>

      <Card title={t.tagsTitle}>
        <Space wrap size="small">
          <Text type="secondary">{t.project}</Text>
          <Input value={cfg.tags.project} onChange={(e) => setTag('project', e.target.value)} style={{ width: 160 }} />
          <Text type="secondary">{t.environment}</Text>
          <Select
            value={cfg.tags.environment}
            onChange={(v) => setTag('environment', v)}
            style={{ width: 120 }}
            options={['dev', 'staging', 'prod'].map((x) => ({ value: x, label: x }))}
          />
          <Text type="secondary">{t.owner}</Text>
          <Input value={cfg.tags.owner} onChange={(e) => setTag('owner', e.target.value)} style={{ width: 140 }} />
          <Text type="secondary">{t.extraTags}</Text>
          <Input
            value={cfg.tags.extra}
            onChange={(e) => setTag('extra', e.target.value)}
            placeholder="CostCenter=1234"
            style={{ width: 220, fontFamily: 'monospace', fontSize: 12 }}
          />
        </Space>
      </Card>

      <Card
        title={<><FileTextOutlined /> {t.varsTitle}</>}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.varsHint}</Text>}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {cfg.variables.map((v) => (
            <Card
              key={v.id}
              size="small"
              extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeVar(v.id)} />}
            >
              <Space wrap size="small">
                <Text type="secondary">{t.varName}</Text>
                <Input
                  value={v.name}
                  onChange={(e) => updateVar(v.id, { name: e.target.value })}
                  placeholder="db_password"
                  style={{ width: 170, fontFamily: 'monospace', fontSize: 12 }}
                />
                <Text type="secondary">{t.varType}</Text>
                <Select
                  value={v.type}
                  onChange={(val) => updateVar(v.id, { type: val })}
                  style={{ width: 130 }}
                  options={VAR_TYPES.map((x) => ({ value: x, label: x }))}
                />
                <Text type="secondary">{t.varDefault}</Text>
                <Input
                  value={v.dflt}
                  onChange={(e) => updateVar(v.id, { dflt: e.target.value })}
                  placeholder='"us-east-1"'
                  style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
                />
                <Text type="secondary">{t.varSensitive}</Text>
                <Switch size="small" checked={v.sensitive} onChange={(val) => updateVar(v.id, { sensitive: val })} />
                <Text type="secondary">{t.varDescription}</Text>
                <Input
                  value={v.description}
                  onChange={(e) => updateVar(v.id, { description: e.target.value })}
                  style={{ width: 260 }}
                />
              </Space>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={addVar}>
            {t.addVar}
          </Button>
        </Space>
      </Card>

      <Card
        title={<><PartitionOutlined /> {t.resTitle}</>}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.resHint}</Text>}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {cfg.resources.map((r) => {
            const def = typeDef(r.type)
            return (
              <Card
                key={r.id}
                size="small"
                title={<Text code>{def.addr + '.' + (r.label || '?')}</Text>}
                extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRes(r.id)} />}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space wrap size="small">
                    <Text type="secondary">{t.resType}</Text>
                    <Select
                      value={r.type}
                      onChange={(val) =>
                        updateRes(r.id, {
                          type: val,
                          params: defaultParams(val),
                          ...(r.auto ? { label: autoResName(val) } : {}),
                        })
                      }
                      style={{ minWidth: 280 }}
                      options={RESOURCE_TYPES.map((d) => ({ value: d.value, label: (lang === 'pt' ? d.pt : d.en) }))}
                    />
                    <Text type="secondary">{t.resLabel}</Text>
                    <Input
                      value={r.label}
                      onChange={(e) => updateRes(r.id, { label: e.target.value, auto: false })}
                      placeholder="app"
                      style={{ width: 130, fontFamily: 'monospace', fontSize: 12 }}
                    />
                  </Space>
                  <Space wrap size="small">
                    {def.fields.map((f) => {
                      const label = fieldLabel(f)
                      if (f.kind === 'bool') {
                        return (
                          <Space key={f.k} size="small">
                            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                            <Switch
                              size="small"
                              checked={Boolean(r.params[f.k])}
                              onChange={(v) => updateResParam(r.id, f.k, v)}
                            />
                          </Space>
                        )
                      }
                      if (f.kind === 'select') {
                        return (
                          <Space key={f.k} size="small">
                            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                            <Select
                              size="small"
                              value={r.params[f.k]}
                              onChange={(v) => updateResParam(r.id, f.k, v)}
                              style={{ width: 160 }}
                              options={f.options.map((x) => ({ value: x, label: x }))}
                            />
                          </Space>
                        )
                      }
                      if (f.kind === 'area') {
                        return (
                          <Space key={f.k} direction="vertical" size={0} style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                            <TextArea
                              value={r.params[f.k] || ''}
                              onChange={(e) => updateResParam(r.id, f.k, e.target.value)}
                              placeholder={f.ph}
                              rows={2}
                              style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 620 }}
                            />
                          </Space>
                        )
                      }
                      return (
                        <Space key={f.k} size="small">
                          <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                          <Input
                            size="small"
                            value={r.params[f.k] == null ? '' : String(r.params[f.k])}
                            onChange={(e) => updateResParam(r.id, f.k, e.target.value)}
                            placeholder={f.ph}
                            style={{ width: 200, fontFamily: 'monospace', fontSize: 12 }}
                          />
                        </Space>
                      )
                    })}
                  </Space>
                </Space>
              </Card>
            )
          })}
          <Button icon={<PlusOutlined />} onClick={addRes}>
            {t.addRes}
          </Button>
        </Space>
      </Card>

      <Card
        title={t.outTitle}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.outHint}</Text>}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space size="small">
            <Text type="secondary">{t.autoOutputs}</Text>
            <Switch checked={cfg.autoOutputs} onChange={(v) => setField('autoOutputs', v)} />
          </Space>
          {cfg.outputs.map((x) => (
            <Card
              key={x.id}
              size="small"
              extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeOut(x.id)} />}
            >
              <Space wrap size="small">
                <Text type="secondary">{t.outName}</Text>
                <Input
                  value={x.name}
                  onChange={(e) => updateOut(x.id, { name: e.target.value })}
                  placeholder="api_url"
                  style={{ width: 150, fontFamily: 'monospace', fontSize: 12 }}
                />
                <Text type="secondary">{t.outValue}</Text>
                <Input
                  value={x.value}
                  onChange={(e) => updateOut(x.id, { value: e.target.value })}
                  placeholder="aws_lb.api.dns_name"
                  style={{ width: 280, fontFamily: 'monospace', fontSize: 12 }}
                />
                <Text type="secondary">{t.varSensitive}</Text>
                <Switch size="small" checked={x.sensitive} onChange={(v) => updateOut(x.id, { sensitive: v })} />
                <Text type="secondary">{t.outDescription}</Text>
                <Input
                  value={x.description}
                  onChange={(e) => updateOut(x.id, { description: e.target.value })}
                  style={{ width: 240 }}
                />
              </Space>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={addOut}>
            {t.addOut}
          </Button>
        </Space>
      </Card>

      <Card
        title={t.filesTitle}
        extra={
          <Space size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>{meta(allText)}</Text>
            {copyBtn('all', allText)}
          </Space>
        }
      >
        <Tabs
          items={files.map((f) => ({
            key: f.name,
            label: f.name,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <pre style={preStyle}><code>{f.text}</code></pre>
                <Space wrap size="small">
                  {copyBtn(f.name, f.text)}
                  <Button icon={<DownloadOutlined />} onClick={() => download(f.name, f.text)}>
                    {t.download}
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>{meta(f.text)}</Text>
                </Space>
              </Space>
            ),
          }))}
        />
      </Card>

      <Card
        title={t.summaryTitle}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.summaryHint}</Text>}
      >
        <Table
          size="small"
          rowKey={(row) => row.addr + '.' + row.label}
          pagination={false}
          dataSource={summary}
          locale={{ emptyText: '—' }}
          columns={[
            {
              title: t.colAddr,
              dataIndex: 'addr',
              render: (addr, row) => <Text code>{addr + '.' + row.label}</Text>,
            },
            {
              title: t.colBlocks,
              dataIndex: 'blocks',
              width: 90,
              render: (n) => <Tag>{t.blocks(n)}</Tag>,
            },
            {
              title: t.colVars,
              dataIndex: 'vars',
              render: (vars) =>
                vars.length ? (
                  <Space wrap size={[4, 4]}>
                    {vars.map((v) => (
                      <Tag key={v} color="blue" style={{ fontFamily: 'monospace' }}>var.{v}</Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t.colNone}</Text>
                ),
            },
          ]}
        />
      </Card>

      <Card
        title={<><CloudServerOutlined /> {t.autoVarsTitle}</>}
        extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.autoVarsHint}</Text>}
      >
        {autoVars.length ? (
          <Space wrap size={[6, 6]}>
            {autoVars.map((v) => (
              <Tag key={v} color="purple" style={{ fontFamily: 'monospace' }}>variable &quot;{v}&quot;</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">{t.autoVarsNone}</Text>
        )}
      </Card>

      <Card title={t.problemsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type={problems.errors.length ? 'error' : 'success'}
            showIcon
            message={problems.errors.length ? t.errCount(problems.errors.length) : t.allGood}
            description={
              problems.errors.length ? (
                <Space direction="vertical" size={0}>
                  {problems.errors.map((k) => (
                    <Text key={k} style={{ fontSize: 12 }}>· {problemText(k)}</Text>
                  ))}
                </Space>
              ) : null
            }
          />
          <Alert
            type={problems.warnings.length ? 'warning' : 'info'}
            showIcon
            message={problems.warnings.length ? t.warningsTitle : t.noWarn}
            description={
              problems.warnings.length ? (
                <Space direction="vertical" size={0}>
                  {problems.warnings.map((k) => (
                    <Text key={k} style={{ fontSize: 12 }}>· {problemText(k)}</Text>
                  ))}
                </Space>
              ) : null
            }
          />
        </Space>
      </Card>

      <Card title={t.tipsTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipsBody}</Paragraph>
      </Card>

      <Collapse>
        <Panel header={t.howTitle} key="source">
          <Paragraph>{t.howDesc}</Paragraph>
          <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6, maxHeight: 520, overflowY: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
