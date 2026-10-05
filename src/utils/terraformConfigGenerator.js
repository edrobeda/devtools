// ─────────────────────────────────────────────────────────────────────────────
// Gerador de configuração Terraform (HCL) — 100% client-side, sem dependências.
//
// Cada tipo de recurso declara (a) os campos do formulário (`fields`), (b) um
// emissor (`emit`) que escreve os blocos HCL do tipo e (c) os outputs
// automáticos que aquele tipo costuma expor. O builder monta os arquivos
// providers.tf / main.tf / variables.tf / outputs.tf / terraform.tfvars.example
// / backend.tf, e o validador cruza o texto gerado (variáveis referenciadas x
// declaradas, nomes de bucket, portas, 0.0.0.0/0 em ingress, segredo literal).
//
// REGRA IMPORTANTE (bug que já derrubou produção uma vez): as linhas de HCL são
// montadas com CONCATENAÇÃO e aspas simples, nunca com template literal. Assim
// `${aws_s3_bucket.dados.arn}` sai como texto puro e não é interpretado pelo JS.
// ─────────────────────────────────────────────────────────────────────────────

const INDENT = '  '

const L = (n) => INDENT.repeat(n)

const isStr = (v) => typeof v === 'string' && v.trim() !== ''

function nonEmptyLines(v) {
  return String(v == null ? '' : v)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

// JSON.stringify escapa só aspas, barra e controles — os mesmos escapes que o
// HCL aceita em string entre aspas duplas. `${...}` passa intacto.
const q = (v) => JSON.stringify(String(v))

// Referência (var./local./data./each./count./aws_...) ou literal solto (número,
// true/false) saem sem aspas; qualquer outra coisa vira string HCL.
function expr(v, fallback) {
  const s = String(v == null ? '' : v).trim()
  if (!s) return fallback == null ? '' : fallback
  if (/^(var|local|data|each|count|self|module|path|terraform)\./.test(s)) return s
  if (/^aws_/.test(s)) return s
  if (/^-?\d+(\.\d+)?$/.test(s)) return s
  if (s === 'true' || s === 'false' || s === 'null') return s
  return q(s)
}

// Valor de default em `default =` / no tfvars: lista e mapa saem literais,
// chamada de função sai crua, o resto vira string entre aspas.
function tfValue(v) {
  const s = String(v == null ? '' : v).trim()
  if (/^[\[{]/.test(s)) return s
  if (/^[A-Za-z_][A-Za-z0-9_.-]*\(.*\)$/.test(s)) return s
  return q(s)
}

function listExpr(items, fallback) {
  const vals = items.map((x) => expr(x, '')).filter((x) => x !== '')
  return vals.length ? '[' + vals.join(', ') + ']' : fallback == null ? '[]' : fallback
}

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/
const isIdent = (v) => IDENT_RE.test(String(v == null ? '' : v).trim())

const refsIn = (text) =>
  Array.from(new Set((String(text || '').match(/\bvar\.([A-Za-z0-9_]+)/g) || []).map((x) => x.slice(4)))).sort()

// ─── Emissor de linhas ───────────────────────────────────────────────────────
// Agrupa atributos consecutivos para alinhar o `=` (como o `terraform fmt`) e
// quebra o grupo sempre que entra uma linha solta ou um bloco aninhado.
//
// A INDENTAÇÃO DE FECHAMENTO É DERIVADA, não passada pelo chamador: `l()` só
// usa o `n` informado em linhas de conteúdo; uma linha que é só `}` sai na
// coluna do `{` que a abriu (via o contador `depth`). Assim nenhum bloco de
// nível superior pode fechar indentado por engano — o `terraform fmt` odia
// isso, mesmo sendo sintaticamente válido. O corpo do heredoc é inserido sem
// tocar no contador, porque bash com `${...}` falsearia o depth.
function mkOut() {
  const out = []
  let buf = []
  let depth = 0

  function flush() {
    if (!buf.length) return
    let w = 0
    buf.forEach((b) => {
      if (b[1].length > w) w = b[1].length
    })
    buf.forEach((b) => out.push(L(b[0]) + b[1].padEnd(w) + ' = ' + b[2]))
    buf = []
  }

  function push(line) {
    out.push(line)
  }

  return {
    a(n, k, v) {
      buf.push([n, k, v])
    },
    l(n, s) {
      flush()
      if (s === '') return
      if (s === '}') {
        // `depth` conta blocos ABERTOS, então a indentação da chave é a dos
        // blocos que a cercam: depth - 1.
        push(L(Math.max(depth - 1, 0)) + '}')
        depth -= 1
        if (depth < 0) depth = 0
        return
      }
      push(L(n) + s)
      const opens = (s.match(/\{/g) || []).length
      const closes = (s.match(/\}/g) || []).length
      depth += opens - closes
      if (depth < 0) depth = 0
    },
    blank() {
      flush()
      out.push('')
    },
    // Lista multilinha no estilo do fmt:
    //   actions = [
    //     "s3:GetObject",
    //   ]
    list(n, name, items) {
      flush()
      out.push(L(n) + name + ' = [')
      items.forEach((x, i) => out.push(L(n + 1) + x + (i < items.length - 1 ? ',' : '')))
      out.push(L(n) + ']')
    },
    // Heredoc HCL: atribuição, corpo indentado e terminador na mesma coluna da
    // atribuição (é o que `<<-` permite e o que o fmt produz).
    heredoc(n, name, body, marker) {
      flush()
      out.push(L(n) + name + ' = <<-' + marker)
      String(body).split('\n').forEach((line) => out.push(L(n + 1) + line))
      out.push(L(n) + marker)
    },
    text() {
      flush()
      return out.join('\n').replace(/[ \t]+$/gm, '').replace(/\s+$/, '')
    },
  }
}

// ─── Catálogo de recursos ────────────────────────────────────────────────────
// `fields`: k = chave do estado, kind = text | area | bool | select | number.
// `dv` é o valor inicial, `ph` o placeholder (só texto). Labels pt/en no mesmo
// formato usado pelos outros geradores da casa.
export const RESOURCE_TYPES = [
  {
    value: 's3',
    addr: 'aws_s3_bucket',
    pt: 'Bucket S3',
    en: 'S3 bucket',
    fields: [
      { k: 'bucketName', pt: 'Nome do bucket', en: 'Bucket name', dv: 'minha-app-dados', ph: 'meu-bucket-unico' },
      { k: 'forceDestroy', pt: 'force_destroy (apagar bucket com objetos)', en: 'force_destroy (delete bucket with objects)', kind: 'bool', dv: false },
      { k: 'versioning', pt: 'Versionamento habilitado', en: 'Versioning enabled', kind: 'bool', dv: true },
      { k: 'encryption', pt: 'Criptografia em repouso', en: 'Encryption at rest', kind: 'select', options: ['AES256', 'aws:kms'], dv: 'AES256' },
      { k: 'publicAccessBlock', pt: 'Public Access Block', en: 'Public Access Block', kind: 'bool', dv: true },
    ],
    outputs: (lb) => [
      [lb + '_arn', 'aws_s3_bucket.' + lb + '.arn'],
      [lb + '_bucket', 'aws_s3_bucket.' + lb + '.bucket'],
      [lb + '_domain', 'aws_s3_bucket_regional_domain_name.' + lb],
    ],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const base = 'aws_s3_bucket.' + lb

      o.l(0, 'resource "aws_s3_bucket" "' + lb + '" {')
      o.a(1, 'bucket', q(String(r.bucketName || '').trim() || lb))
      if (r.forceDestroy) o.a(1, 'force_destroy', 'true')
      if (ctx.tagsExpr) o.a(1, 'tags', ctx.tagsExpr)
      o.l(1, '}')

      if (r.publicAccessBlock) {
        o.blank()
        o.l(0, 'resource "aws_s3_bucket_public_access_block" "' + lb + '" {')
        o.a(1, 'bucket', base + '.id')
        o.a(1, 'block_public_acls', 'true')
        o.a(1, 'block_public_policy', 'true')
        o.a(1, 'ignore_public_acls', 'true')
        o.a(1, 'restrict_public_buckets', 'true')
        o.l(1, '}')
      }

      o.blank()
      o.l(0, 'resource "aws_s3_bucket_ownership_controls" "' + lb + '" {')
      o.a(1, 'bucket', base + '.id')
      o.blank()
      o.l(1, 'rule {')
      o.a(2, 'object_ownership', '"BucketOwnerEnforced"')
      o.l(1, '}')
      o.l(0, '}')

      if (r.versioning) {
        o.blank()
        o.l(0, 'resource "aws_s3_bucket_versioning" "' + lb + '" {')
        o.a(1, 'bucket', base + '.id')
        o.blank()
        o.l(1, 'versioning_configuration {')
        o.a(2, 'status', '"Enabled"')
        o.l(1, '}')
        o.l(0, '}')
      }

      if (r.encryption) {
        o.blank()
        o.l(0, 'resource "aws_s3_bucket_server_side_encryption_configuration" "' + lb + '" {')
        o.a(1, 'bucket', base + '.id')
        o.blank()
        o.l(1, 'rule {')
        o.l(2, 'apply_server_side_encryption_by_default {')
        o.a(3, 'sse_algorithm', q(r.encryption))
        if (r.encryption === 'aws:kms') o.a(3, 'kms_master_key_id', 'var.kms_key_id')
        o.l(2, '}')
        o.l(1, '}')
        o.l(0, '}')
      }

      o.blank()
      o.l(0, 'data "aws_s3_bucket_regional_domain_name" "' + lb + '" {')
      o.a(1, 'bucket', base + '.id')
      o.l(1, '}')
    },
  },

  {
    value: 'instance',
    addr: 'aws_instance',
    pt: 'Instância EC2',
    en: 'EC2 instance',
    fields: [
      { k: 'ami', pt: 'AMI ID', en: 'AMI ID', dv: 'ami-0c55b159cbfafe1f0', ph: 'ami-0c55b159cbfafe1f0' },
      { k: 'instanceType', pt: 'Tipo de instância', en: 'Instance type', kind: 'select', options: ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm6g.large', 'c7g.xlarge'], dv: 't3.micro' },
      { k: 'subnetId', pt: 'Subnet (ou var.)', en: 'Subnet (or var.)', dv: 'var.subnet_id', ph: 'var.subnet_id ou subnet-abc123' },
      { k: 'securityGroups', pt: 'Security groups (um por linha, vazio = padrão da VPC)', en: 'Security groups (one per line, empty = VPC default)', kind: 'area', dv: '', ph: 'aws_security_group.app.id' },
      { k: 'rootVolume', pt: 'Volume raiz (GB)', en: 'Root volume (GB)', kind: 'number', dv: '20' },
      { k: 'publicIp', pt: 'IP público (usa network_interfaces)', en: 'Public IP (uses network_interfaces)', kind: 'bool', dv: false },
      { k: 'detailedMonitoring', pt: 'Monitoring detalhado', en: 'Detailed monitoring', kind: 'bool', dv: false },
      { k: 'userData', pt: 'user_data (bash)', en: 'user_data (bash)', kind: 'area', dv: '', ph: '#!/bin/bash\necho "hello"' },
    ],
    outputs: (lb) => [
      [lb + '_id', 'aws_instance.' + lb + '.id'],
      [lb + '_private_ip', 'aws_instance.' + lb + '.private_ip'],
    ],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const sgs = nonEmptyLines(r.securityGroups)
      const subnet = expr(r.subnetId, 'var.subnet_id')

      o.l(0, 'resource "aws_instance" "' + lb + '" {')
      o.a(1, 'ami', expr(r.ami, q('ami-0c55b159cbfafe1f0')))
      o.a(1, 'instance_type', expr(r.instanceType, q('t3.micro')))
      o.a(1, 'monitoring', r.detailedMonitoring ? 'true' : 'false')

      if (r.publicIp) {
        // Com network_interfaces, subnet_id e security_groups vão DENTRO do
        // bloco — no topo eles são rejeitados pelo provider.
        o.blank()
        o.l(1, 'network_interfaces {')
        o.a(2, 'device_index', '0')
        o.a(2, 'subnet_id', subnet)
        o.a(2, 'associate_public_ip_address', 'true')
        if (sgs.length) o.a(2, 'security_groups', listExpr(sgs))
        o.l(1, '}')
      } else {
        if (isStr(r.subnetId)) o.a(1, 'subnet_id', subnet)
        if (sgs.length) o.a(1, 'vpc_security_group_ids', listExpr(sgs))
      }

      o.blank()
      o.l(1, 'root_block_device {')
      o.a(2, 'volume_size', String(Number(r.rootVolume) > 0 ? Number(r.rootVolume) : 20))
      o.a(2, 'volume_type', '"gp3"')
      o.a(2, 'encrypted', 'true')
      o.l(1, '}')

      o.blank()
      o.l(1, 'metadata_options {')
      o.a(2, 'http_tokens', '"required"')
      o.l(1, '}')

      if (isStr(r.userData)) {
        o.blank()
        o.heredoc(1, 'user_data', r.userData, 'EOF')
      }
      if (ctx.tagsExpr) {
        o.blank()
        o.a(1, 'tags', ctx.tagsExpr)
      }
      o.l(1, '}')
    },
  },

  {
    value: 'security_group',
    addr: 'aws_security_group',
    pt: 'Security Group',
    en: 'Security group',
    fields: [
      { k: 'sgName', pt: 'Nome', en: 'Name', dv: 'app-sg', ph: 'app-sg' },
      { k: 'description', pt: 'Descrição', en: 'Description', dv: 'HTTP/HTTPS', ph: 'Acesso publico da aplicacao' },
      { k: 'vpcId', pt: 'VPC (ou var.)', en: 'VPC (or var.)', dv: 'var.vpc_id', ph: 'var.vpc_id ou vpc-abc123' },
      { k: 'ingressPort', pt: 'Porta liberada (ou all)', en: 'Open port (or all)', dv: '443', ph: '443, 80, all' },
      { k: 'ingressCidr', pt: 'CIDR de origem', en: 'Source CIDR', dv: '0.0.0.0/0', ph: '0.0.0.0/0, 10.0.0.0/8' },
      { k: 'extraPorts', pt: 'Outras portas liberadas (uma por linha)', en: 'Other open ports (one per line)', kind: 'area', dv: '22', ph: '22\n8080' },
      { k: 'egressAll', pt: 'Egress liberado para tudo', en: 'Egress wide open', kind: 'bool', dv: true },
    ],
    outputs: (lb) => [[lb + '_id', 'aws_security_group.' + lb + '.id']],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const port = String(r.ingressPort || '').trim() || '443'
      const all = port.toLowerCase() === 'all'
      const cidrs = nonEmptyLines(r.ingressCidr)
      const cidrList = listExpr(cidrs.length ? cidrs : ['0.0.0.0/0'])

      o.l(0, 'resource "aws_security_group" "' + lb + '" {')
      o.a(1, 'name', q(String(r.sgName || '').trim() || lb))
      o.a(1, 'description', q(String(r.description || '').trim() || 'app'))
      if (isStr(r.vpcId)) o.a(1, 'vpc_id', expr(r.vpcId, 'var.vpc_id'))
      o.blank()
      o.l(1, 'ingress {')
      o.a(2, 'from_port', all ? '0' : String(Number(port) || 443))
      o.a(2, 'to_port', all ? '65535' : String(Number(port) || 443))
      o.a(2, 'protocol', all ? '"-1"' : '"tcp"')
      o.a(2, 'cidr_blocks', cidrList)
      o.l(1, '}')

      nonEmptyLines(r.extraPorts).forEach((p) => {
        if (p.toLowerCase() === 'all') return
        o.blank()
        o.l(1, 'ingress {')
        o.a(2, 'from_port', String(Number(p) || 80))
        o.a(2, 'to_port', String(Number(p) || 80))
        o.a(2, 'protocol', '"tcp"')
        o.a(2, 'cidr_blocks', cidrList)
        o.l(1, '}')
      })

      if (r.egressAll) {
        o.blank()
        o.l(1, 'egress {')
        o.a(2, 'from_port', '0')
        o.a(2, 'to_port', '0')
        o.a(2, 'protocol', '"-1"')
        o.a(2, 'cidr_blocks', '["0.0.0.0/0"]')
        o.l(1, '}')
      }
      if (ctx.tagsExpr) {
        o.blank()
        o.a(1, 'tags', ctx.tagsExpr)
      }
      o.l(1, '}')
    },
  },

  {
    value: 'lb',
    addr: 'aws_lb',
    pt: 'Load Balancer (ALB) + target group + listener',
    en: 'Load balancer (ALB) + target group + listener',
    fields: [
      { k: 'lbName', pt: 'Nome do ALB', en: 'ALB name', dv: 'app-alb', ph: 'app-alb' },
      { k: 'internal', pt: 'Interno (sem IP público)', en: 'Internal (no public IP)', kind: 'bool', dv: false },
      { k: 'port', pt: 'Porta do listener', en: 'Listener port', dv: '443' },
      { k: 'protocol', pt: 'Protocolo do listener', en: 'Listener protocol', kind: 'select', options: ['HTTPS', 'HTTP'], dv: 'HTTPS' },
      { k: 'certificateArn', pt: 'ARN do certificado (HTTPS)', en: 'Certificate ARN (HTTPS)', dv: 'var.certificate_arn', ph: 'var.certificate_arn ou arn:aws:acm:...' },
      { k: 'targetPort', pt: 'Porta do target group', en: 'Target group port', dv: '8080' },
      { k: 'targetProtocol', pt: 'Protocolo do target group', en: 'Target group protocol', kind: 'select', options: ['HTTP', 'HTTPS'], dv: 'HTTP' },
      { k: 'healthPath', pt: 'Health check path', en: 'Health check path', dv: '/healthz' },
      { k: 'healthMatcher', pt: 'Health check matcher', en: 'Health check matcher', dv: '200-399' },
      { k: 'subnets', pt: 'Subnets (uma por linha)', en: 'Subnets (one per line)', kind: 'area', dv: 'var.subnet_ids', ph: 'var.subnet_ids' },
      { k: 'vpcId', pt: 'VPC (ou var.)', en: 'VPC (or var.)', dv: 'var.vpc_id', ph: 'var.vpc_id' },
      { k: 'securityGroups', pt: 'Security groups do ALB (um por linha)', en: 'ALB security groups (one per line)', kind: 'area', dv: '', ph: 'aws_security_group.app.id' },
      { k: 'stickiness', pt: 'Sticky sessions (lb_cookie)', en: 'Sticky sessions (lb_cookie)', kind: 'bool', dv: false },
    ],
    outputs: (lb) => [[lb + '_dns', 'aws_lb.' + lb + '.dns_name']],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const name = String(r.lbName || '').trim() || lb
      const sgs = nonEmptyLines(r.securityGroups)
      const subnets = nonEmptyLines(r.subnets)
      const https = r.protocol !== 'HTTP'

      o.l(0, 'resource "aws_lb" "' + lb + '" {')
      o.a(1, 'name', q(name))
      o.a(1, 'internal', r.internal ? 'true' : 'false')
      o.a(1, 'load_balancer_type', '"application"')
      if (sgs.length) o.a(1, 'security_groups', listExpr(sgs))
      o.a(1, 'subnets', listExpr(subnets, 'var.subnet_ids'))
      if (ctx.tagsExpr) o.a(1, 'tags', ctx.tagsExpr)
      o.l(1, '}')

      o.blank()
      o.l(0, 'resource "aws_lb_target_group" "' + lb + '" {')
      o.a(1, 'name', q('/' + name + '/tg'))
      o.a(1, 'port', String(Number(r.targetPort) || 8080))
      o.a(1, 'protocol', q(r.targetProtocol || 'HTTP'))
      o.a(1, 'target_type', '"instance"')
      if (isStr(r.vpcId)) o.a(1, 'vpc_id', expr(r.vpcId, 'var.vpc_id'))
      o.blank()
      o.l(1, 'health_check {')
      o.a(2, 'path', expr(r.healthPath, q('/healthz')))
      o.a(2, 'matcher', expr(r.healthMatcher, q('200-399')))
      o.a(2, 'interval', '30')
      o.l(1, '}')
      if (r.stickiness) {
        o.blank()
        o.l(1, 'stickiness {')
        o.a(2, 'enabled', 'true')
        o.a(2, 'type', '"lb_cookie"')
        o.l(1, '}')
      }
      o.l(1, '}')

      o.blank()
      o.l(0, 'resource "aws_lb_listener" "' + lb + '" {')
      o.a(1, 'load_balancer_arn', 'aws_lb.' + lb + '.arn')
      o.a(1, 'port', String(Number(r.port) || 443))
      o.a(1, 'protocol', q(r.protocol || 'HTTPS'))
      if (https) {
        o.a(1, 'ssl_policy', '"ELBSecurityPolicy-TLS13-1-2-2021-06"')
        o.a(1, 'certificate_arn', expr(r.certificateArn, 'var.certificate_arn'))
      }
      o.blank()
      o.l(1, 'default_action {')
      o.a(2, 'type', '"forward"')
      o.a(2, 'target_group_arn', 'aws_lb_target_group.' + lb + '.arn')
      o.l(1, '}')
      o.l(1, '}')
    },
  },

  {
    value: 'rds',
    addr: 'aws_db_instance',
    pt: 'Instância RDS',
    en: 'RDS instance',
    fields: [
      { k: 'identifier', pt: 'Identifier', en: 'Identifier', dv: 'app-db', ph: 'app-db' },
      { k: 'engine', pt: 'Engine', en: 'Engine', kind: 'select', options: ['postgres', 'mysql', 'mariadb'], dv: 'postgres' },
      { k: 'instanceClass', pt: 'Instância', en: 'Instance class', kind: 'select', options: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.r6g.large'], dv: 'db.t3.micro' },
      { k: 'storage', pt: 'Armazenamento (GB)', en: 'Storage (GB)', kind: 'number', dv: '20' },
      { k: 'storageType', pt: 'Tipo de volume', en: 'Volume type', kind: 'select', options: ['gp3', 'gp2', 'io1'], dv: 'gp3' },
      { k: 'dbName', pt: 'Nome do banco', en: 'Database name', dv: 'appdb', ph: 'appdb' },
      { k: 'username', pt: 'Usuário master', en: 'Master username', dv: 'appuser', ph: 'appuser' },
      { k: 'multiAz', pt: 'Multi-AZ', en: 'Multi-AZ', kind: 'bool', dv: false },
      { k: 'publiclyAccessible', pt: 'Acessível publicamente', en: 'Publicly accessible', kind: 'bool', dv: false },
      { k: 'encrypted', pt: 'Storage criptografado', en: 'Encrypted storage', kind: 'bool', dv: true },
      { k: 'backupRetention', pt: 'Retenção de backup (dias)', en: 'Backup retention (days)', kind: 'number', dv: '7' },
      { k: 'skipFinalSnapshot', pt: 'skip_final_snapshot', en: 'skip_final_snapshot', kind: 'bool', dv: true },
    ],
    outputs: (lb) => [
      [lb + '_endpoint', 'aws_db_instance.' + lb + '.endpoint'],
      [lb + '_address', 'aws_db_instance.' + lb + '.address'],
      [lb + '_name', 'aws_db_instance.' + lb + '.db_name'],
    ],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const engine = r.engine || 'postgres'
      const port = engine === 'postgres' ? 5432 : 3306

      o.l(0, 'resource "aws_db_instance" "' + lb + '" {')
      o.a(1, 'identifier', q(String(r.identifier || '').trim() || lb))
      o.a(1, 'engine', q(engine))
      o.a(1, 'instance_class', expr(r.instanceClass, q('db.t3.micro')))
      o.blank()
      o.a(1, 'allocated_storage', String(Number(r.storage) || 20))
      o.a(1, 'storage_type', expr(r.storageType, q('gp3')))
      o.a(1, 'db_name', expr(r.dbName, q('appdb')))
      o.a(1, 'username', expr(r.username, q('appuser')))
      o.a(1, 'password', 'var.db_password')
      o.a(1, 'port', String(port))
      o.blank()
      o.a(1, 'multi_az', r.multiAz ? 'true' : 'false')
      o.a(1, 'publicly_accessible', r.publiclyAccessible ? 'true' : 'false')
      o.a(1, 'storage_encrypted', r.encrypted ? 'true' : 'false')
      o.a(1, 'backup_retention_period', String(Number(r.backupRetention) || 0))
      o.a(1, 'skip_final_snapshot', r.skipFinalSnapshot ? 'true' : 'false')
      o.a(1, 'copy_tags_to_snapshot', 'true')
      if (ctx.tagsExpr) {
        o.blank()
        o.a(1, 'tags', ctx.tagsExpr)
      }
      o.l(1, '}')
    },
  },

  {
    value: 'dynamodb',
    addr: 'aws_dynamodb_table',
    pt: 'Tabela DynamoDB',
    en: 'DynamoDB table',
    fields: [
      { k: 'tableName', pt: 'Nome da tabela', en: 'Table name', dv: 'app-table', ph: 'app-table' },
      { k: 'hashKey', pt: 'Hash key (partition key)', en: 'Hash key (partition key)', dv: 'id' },
      { k: 'hashType', pt: 'Tipo da hash key', en: 'Hash key type', kind: 'select', options: ['S', 'N', 'B'], dv: 'S' },
      { k: 'rangeKey', pt: 'Range key (vazio = não usar)', en: 'Range key (empty = none)', dv: '', ph: 'sk' },
      { k: 'rangeType', pt: 'Tipo da range key', en: 'Range key type', kind: 'select', options: ['S', 'N', 'B'], dv: 'S' },
      { k: 'ttlAttribute', pt: 'Atributo TTL (vazio = desativado)', en: 'TTL attribute (empty = off)', dv: '', ph: 'expires_at' },
      { k: 'billingMode', pt: 'Modo de cobrança', en: 'Billing mode', kind: 'select', options: ['PAY_PER_REQUEST', 'PROVISIONED'], dv: 'PAY_PER_REQUEST' },
      { k: 'readCapacity', pt: 'Read capacity (PROVISIONED)', en: 'Read capacity (PROVISIONED)', kind: 'number', dv: '5' },
      { k: 'writeCapacity', pt: 'Write capacity (PROVISIONED)', en: 'Write capacity (PROVISIONED)', kind: 'number', dv: '5' },
      { k: 'pitr', pt: 'Point-in-time recovery', en: 'Point-in-time recovery', kind: 'bool', dv: true },
      { k: 'sse', pt: 'Criptografia server-side', en: 'Server-side encryption', kind: 'bool', dv: true },
      { k: 'deletionProtection', pt: 'Deletion protection', en: 'Deletion protection', kind: 'bool', dv: false },
    ],
    outputs: (lb) => [
      [lb + '_name', 'aws_dynamodb_table.' + lb + '.name'],
      [lb + '_arn', 'aws_dynamodb_table.' + lb + '.arn'],
    ],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const provisioned = r.billingMode === 'PROVISIONED'

      o.l(0, 'resource "aws_dynamodb_table" "' + lb + '" {')
      o.a(1, 'name', q(String(r.tableName || '').trim() || lb))
      o.a(1, 'hash_key', expr(r.hashKey, q('id')))
      if (provisioned) {
        o.a(1, 'read_capacity', String(Number(r.readCapacity) || 5))
        o.a(1, 'write_capacity', String(Number(r.writeCapacity) || 5))
      } else {
        o.a(1, 'billing_mode', '"PAY_PER_REQUEST"')
      }
      o.blank()
      o.l(1, 'attribute {')
      o.a(2, 'name', expr(r.hashKey, q('id')))
      o.a(2, 'type', q(r.hashType || 'S'))
      o.l(1, '}')

      if (isStr(r.rangeKey)) {
        o.blank()
        o.a(1, 'range_key', expr(r.rangeKey, q('sk')))
        o.blank()
        o.l(1, 'attribute {')
        o.a(2, 'name', expr(r.rangeKey, q('sk')))
        o.a(2, 'type', q(r.rangeType || 'S'))
        o.l(1, '}')
      }

      if (isStr(pick(r, 'ttlAttribute'))) {
        o.blank()
        o.l(1, 'ttl {')
        o.a(2, 'attribute_name', expr(r.ttlAttribute, q('expires_at')))
        o.a(2, 'enabled', 'true')
        o.l(1, '}')
      }

      o.blank()
      o.l(1, 'point_in_time_recovery {')
      o.a(2, 'enabled', r.pitr ? 'true' : 'false')
      o.l(1, '}')

      if (r.sse) {
        o.blank()
        o.l(1, 'server_side_encryption {')
        o.a(2, 'enabled', 'true')
        o.l(1, '}')
      }

      o.blank()
      o.a(1, 'deletion_protection_enabled', r.deletionProtection ? 'true' : 'false')
      if (ctx.tagsExpr) {
        o.blank()
        o.a(1, 'tags', ctx.tagsExpr)
      }
      o.l(1, '}')
    },
  },

  {
    value: 'lambda',
    addr: 'aws_lambda_function',
    pt: 'Função Lambda',
    en: 'Lambda function',
    fields: [
      { k: 'functionName', pt: 'Nome da função', en: 'Function name', dv: 'minha-funcao', ph: 'minha-funcao' },
      { k: 'runtime', pt: 'Runtime', en: 'Runtime', kind: 'select', options: ['python3.12', 'nodejs20.x', 'nodejs22.x', 'java21', 'dotnet8', 'ruby3.3', 'provided.al2023'], dv: 'python3.12' },
      { k: 'handler', pt: 'Handler', en: 'Handler', dv: 'index.handler', ph: 'index.handler' },
      { k: 'filename', pt: 'Pacote (.zip)', en: 'Package (.zip)', dv: 'lambda.zip' },
      { k: 'memory', pt: 'Memória (MB)', en: 'Memory (MB)', kind: 'number', dv: '256' },
      { k: 'timeout', pt: 'Timeout (s)', en: 'Timeout (s)', kind: 'number', dv: '30' },
      { k: 'architectures', pt: 'Arquitetura', en: 'Architecture', kind: 'select', options: ['x86_64', 'arm64'], dv: 'arm64' },
      { k: 'roleArn', pt: 'Role ARN', en: 'Role ARN', dv: 'var.lambda_role_arn', ph: 'aws_iam_role.worker.arn' },
      { k: 'environment', pt: 'Variáveis de ambiente (KEY=VALOR, uma por linha)', en: 'Environment variables (KEY=VALUE, one per line)', kind: 'area', dv: 'LOG_LEVEL=info', ph: 'LOG_LEVEL=info\nTABLE_NAME=app-table' },
      { k: 'tracing', pt: 'X-Ray tracing ativo', en: 'X-Ray tracing active', kind: 'bool', dv: true },
    ],
    outputs: (lb) => [[lb + '_arn', 'aws_lambda_function.' + lb + '.arn']],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const env = nonEmptyLines(r.environment)

      o.l(0, 'resource "aws_lambda_function" "' + lb + '" {')
      o.a(1, 'function_name', q(String(r.functionName || '').trim() || lb))
      o.a(1, 'role', expr(r.roleArn, 'var.lambda_role_arn'))
      o.a(1, 'runtime', q(r.runtime || 'python3.12'))
      o.a(1, 'handler', expr(r.handler, q('index.handler')))
      o.a(1, 'architectures', listExpr([r.architectures || 'x86_64']))
      o.blank()
      o.a(1, 'filename', q(String(r.filename || '').trim() || 'lambda.zip'))
      o.a(1, 'memory_size', String(Number(r.memory) || 256))
      o.a(1, 'timeout', String(Number(r.timeout) || 30))
      o.a(1, 'publish', 'true')

      if (env.length) {
        const pairs = []
        env.forEach((line) => {
          const idx = line.indexOf('=')
          const k = (idx === -1 ? line : line.slice(0, idx)).trim()
          const v = idx === -1 ? '' : line.slice(idx + 1).trim()
          if (k) pairs.push([k, expr(v, q(''))])
        })
        const w = pairs.reduce((m, p) => Math.max(m, p[0].length), 0)
        o.blank()
        o.l(1, 'environment {')
        o.l(2, 'variables = {')
        pairs.forEach((p) => o.l(3, p[0].padEnd(w) + ' = ' + p[1]))
        o.l(2, '}')
        o.l(1, '}')
      }

      if (r.tracing) {
        o.blank()
        o.l(1, 'tracing_config {')
        o.a(2, 'mode', '"Active"')
        o.l(1, '}')
      }
      if (ctx.tagsExpr) {
        o.blank()
        o.a(1, 'tags', ctx.tagsExpr)
      }
      o.l(1, '}')
    },
  },

  {
    value: 'iam_role',
    addr: 'aws_iam_role',
    pt: 'IAM role',
    en: 'IAM role',
    fields: [
      { k: 'roleName', pt: 'Nome da role', en: 'Role name', dv: 'app-role', ph: 'app-role' },
      { k: 'description', pt: 'Descrição', en: 'Description', dv: '', ph: 'Role assumida pelas tasks' },
      { k: 'assumeService', pt: 'Service que assume a role', en: 'Service assuming the role', kind: 'select', options: ['ec2.amazonaws.com', 'lambda.amazonaws.com', 'ecs-tasks.amazonaws.com', 'rds.amazonaws.com'], dv: 'lambda.amazonaws.com' },
      { k: 'policyArns', pt: 'Managed policies anexadas (uma por linha)', en: 'Attached managed policies (one per line)', kind: 'area', dv: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess', ph: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess\nvar.extra_policies' },
      { k: 'maxSession', pt: 'max_session_duration (s)', en: 'max_session_duration (s)', kind: 'number', dv: '3600' },
      { k: 'permissionsBoundary', pt: 'Permissions boundary (vazio = nenhum)', en: 'Permissions boundary (empty = none)', dv: '' },
    ],
    outputs: (lb) => [[lb + '_arn', 'aws_iam_role.' + lb + '.arn']],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const policies = nonEmptyLines(r.policyArns)
      const dynamic = policies.some((x) => /^(var|local|data)\./.test(x))

      o.l(0, 'data "aws_iam_policy_document" "' + lb + '_assume" {')
      o.l(1, 'statement {')
      o.a(2, 'sid', '"AllowAssume"')
      o.a(2, 'effect', '"Allow"')
      o.a(2, 'actions', '["sts:AssumeRole"]')
      o.blank()
      o.l(2, 'principals {')
      o.a(3, 'type', '"Service"')
      o.a(3, 'identifiers', listExpr([r.assumeService || 'lambda.amazonaws.com']))
      o.l(2, '}')
      o.l(1, '}')
      o.l(1, '}')

      o.blank()
      o.l(0, 'resource "aws_iam_role" "' + lb + '" {')
      o.a(1, 'name', q(String(r.roleName || '').trim() || lb))
      if (isStr(r.description)) o.a(1, 'description', q(r.description.trim()))
      o.a(1, 'assume_role_policy', 'data.aws_iam_policy_document.' + lb + '_assume.json')
      o.a(1, 'max_session_duration', String(Number(r.maxSession) || 3600))
      if (isStr(r.permissionsBoundary)) o.a(1, 'permissions_boundary', expr(r.permissionsBoundary, ''))
      if (ctx.tagsExpr) o.a(1, 'tags', ctx.tagsExpr)
      o.l(1, '}')

      if (policies.length) {
        o.blank()
        o.l(0, 'resource "aws_iam_role_policy_attachment" "' + lb + '" {')
        if (dynamic) {
          // A lista veio de uma variável: count + count.index é o par canônico.
          o.a(1, 'count', 'length(var.managed_policy_arns)')
          o.a(1, 'role', 'aws_iam_role.' + lb + '.name')
          o.a(1, 'policy_arn', 'var.managed_policy_arns[count.index]')
        } else {
          o.l(1, 'for_each = toset([')
          policies.forEach((x, i) => o.l(2, q(x) + (i < policies.length - 1 ? ',' : '')))
          o.l(1, '])')
          o.blank()
          o.a(1, 'role', 'aws_iam_role.' + lb + '.name')
          o.a(1, 'policy_arn', 'each.value')
        }
        o.l(1, '}')
      }
    },
  },

  {
    value: 'iam_policy',
    addr: 'aws_iam_policy',
    pt: 'IAM policy',
    en: 'IAM policy',
    fields: [
      { k: 'policyName', pt: 'Nome da policy', en: 'Policy name', dv: 'app-policy', ph: 'app-policy' },
      { k: 'sid', pt: 'SID do statement', en: 'Statement SID', dv: 'AllowAppAccess', ph: 'AllowAppAccess' },
      { k: 'actions', pt: 'Actions (uma por linha)', en: 'Actions (one per line)', kind: 'area', dv: 's3:GetObject\ns3:ListBucket', ph: 's3:GetObject\ns3:ListBucket' },
      { k: 'resources', pt: 'Resources (um por linha)', en: 'Resources (one per line)', kind: 'area', dv: '${aws_s3_bucket.dados.arn}/*', ph: '${aws_s3_bucket.dados.arn}/*\n*' },
    ],
    outputs: (lb) => [[lb + '_arn', 'aws_iam_policy.' + lb + '.arn']],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const actions = nonEmptyLines(r.actions)
      const resources = nonEmptyLines(r.resources)

      o.l(0, 'data "aws_iam_policy_document" "' + lb + '" {')
      o.l(1, 'statement {')
      if (isStr(r.sid)) o.a(2, 'sid', q(r.sid.trim()))
      o.a(2, 'effect', '"Allow"')
      o.blank()
      o.list(2, 'actions', actions.map((x) => expr(x, q(x))))
      o.blank()
      o.list(2, 'resources', resources.map((x) => expr(x, q(x))))
      o.l(1, '}')
      o.l(1, '}')

      o.blank()
      o.l(0, 'resource "aws_iam_policy" "' + lb + '" {')
      o.a(1, 'name', q(String(r.policyName || '').trim() || lb))
      o.a(1, 'policy', 'data.aws_iam_policy_document.' + lb + '.json')
      if (ctx.tagsExpr) o.a(1, 'tags', ctx.tagsExpr)
      o.l(1, '}')
    },
  },

  {
    value: 'log_group',
    addr: 'aws_cloudwatch_log_group',
    pt: 'CloudWatch log group',
    en: 'CloudWatch log group',
    fields: [
      { k: 'logName', pt: 'Nome do grupo', en: 'Group name', dv: '/aws/lambda/minha-funcao', ph: '/aws/app/producao' },
      { k: 'retention', pt: 'retention_in_days (0 = nunca expira)', en: 'retention_in_days (0 = keep forever)', kind: 'select', options: ['0', '1', '3', '7', '14', '30', '60', '90', '180', '365', '400'], dv: '14' },
      { k: 'kms', pt: 'Criptografar com KMS', en: 'Encrypt with KMS', kind: 'bool', dv: false },
    ],
    outputs: (lb) => [[lb + '_name', 'aws_cloudwatch_log_group.' + lb + '.name']],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      o.l(0, 'resource "aws_cloudwatch_log_group" "' + lb + '" {')
      o.a(1, 'name', expr(r.logName, q('/aws/app')))
      o.a(1, 'retention_in_days', String(Number(r.retention) || 0))
      if (r.kms) o.a(1, 'kms_key_id', 'var.kms_key_id')
      if (ctx.tagsExpr) o.a(1, 'tags', ctx.tagsExpr)
      o.l(1, '}')
    },
  },

  {
    value: 'sqs',
    addr: 'aws_sqs_queue',
    pt: 'Fila SQS',
    en: 'SQS queue',
    fields: [
      { k: 'queueName', pt: 'Nome da fila', en: 'Queue name', dv: 'minha-fila', ph: 'minha-fila.fifo' },
      { k: 'fifo', pt: 'Fila FIFO', en: 'FIFO queue', kind: 'bool', dv: false },
      { k: 'visibilityTimeout', pt: 'visibility_timeout_seconds', en: 'visibility_timeout_seconds', kind: 'number', dv: '30' },
      { k: 'retention', pt: 'message_retention_seconds', en: 'message_retention_seconds', kind: 'number', dv: '345600' },
      { k: 'dlq', pt: 'Dead-letter queue (gera a fila acompanhante)', en: 'Dead-letter queue (generates the companion queue)', kind: 'bool', dv: true },
      { k: 'kms', pt: 'Criptografia SSE (KMS)', en: 'SSE encryption (KMS)', kind: 'bool', dv: false },
    ],
    outputs: (lb) => [[lb + '_url', 'aws_sqs_queue.' + lb + '.url']],
    emit(o, r, ctx) {
      const lb = r.label.trim()
      const name = String(r.queueName || '').trim() || lb

      if (r.dlq) {
        o.l(0, 'resource "aws_sqs_queue" "' + lb + '_dlq" {')
        o.a(1, 'name', q(name + '-dlq'))
        o.a(1, 'message_retention_seconds', '1209600')
        o.l(1, '}')
        o.blank()
      }

      o.l(0, 'resource "aws_sqs_queue" "' + lb + '" {')
      o.a(1, 'name', q(name))
      o.a(1, 'fifo_queue', r.fifo ? 'true' : 'false')
      o.a(1, 'visibility_timeout_seconds', String(Number(r.visibilityTimeout) || 30))
      o.a(1, 'message_retention_seconds', String(Number(r.retention) || 345600))
      if (r.dlq) {
        o.a(
          1,
          'redrive_policy',
          'jsonencode({ deadLetterTargetArn = aws_sqs_queue.' + lb + '_dlq.arn, maxReceiveCount = 4 })'
        )
      }
      if (r.kms) o.a(1, 'kms_master_key_id', '"alias/aws/sqs"')
      if (ctx.tagsExpr) o.a(1, 'tags', ctx.tagsExpr)
      o.l(1, '}')
    },
  },
]

// `pick` tolera recursos cujos params nãoForam inicializados (ex.: um preset
// antigo carregado do estado salvo) sem estourar no meio do emit.
function pick(r, k) {
  const v = r && r[k]
  return v === undefined || v === null ? '' : v
}

export const VAR_TYPES = ['string', 'number', 'bool', 'list(string)', 'set(string)', 'map(string)']

// Defaults plausíveis para as variáveis que o gerador auto-declara.
const AUTO_VAR_DEFAULTS = {
  aws_region: { default: 'us-east-1', description: 'Região da AWS.' },
  aws_account_id: { default: '000000000000', description: 'ID da conta AWS.' },
  vpc_id: { default: '', description: 'ID da VPC onde os recursos vivem.' },
  subnet_id: { default: '', description: 'Subnet da instância.' },
  subnet_ids: { default: '["subnet-00000000000000000"]', description: 'Subnets do load balancer (pelo menos duas AZs).' },
  certificate_arn: {
    default: 'arn:aws:acm:us-east-1:000000000000:certificate/00000000-0000-0000-0000-000000000000',
    description: 'ARN do certificado ACM usado no listener HTTPS.',
  },
  kms_key_id: { default: 'alias/aws/s3', description: 'Alias ou ARN da chave KMS.' },
  db_username: { default: 'appuser', description: 'Usuário master do banco.' },
  db_password: { sensitive: true, description: 'Senha do banco — informe via TF_VAR_db_password, nunca no tfvars do git.' },
  managed_policy_arns: { default: '["arn:aws:iam::aws:policy/ReadOnlyAccess"]', description: 'Managed policies anexadas na role.' },
  lambda_role_arn: { default: '', description: 'ARN da role executada pela Lambda.' },
  extra_policies: { default: '[]', description: 'Managed policies adicionais.' },
  table_name: { default: 'app-table', description: 'Nome da tabela DynamoDB.' },
  domain_name: { default: 'app.example.com', description: 'Domínio do serviço.' },
}

// ─── Defaults e presets ──────────────────────────────────────────────────────
export const DEFAULTS = {
  terraformVersion: '>= 1.5.0',
  awsVersion: '~> 5.0',
  region: 'var.aws_region',
  profile: '',
  defaultTags: true,
  autoVars: true,
  backend: false,
  backendBucket: 'meu-terraform-state',
  backendKey: 'minha-app/prod/terraform.tfstate',
  tags: { project: 'minha-app', environment: 'prod', owner: 'plataforma', extra: '' },
  variables: [],
  resources: [],
  autoOutputs: true,
  outputs: [],
}

let seq = 0
const uid = () => ++seq

export function defaultParams(type) {
  const def = RESOURCE_TYPES.find((x) => x.value === type)
  const out = {}
  if (def) def.fields.forEach((f) => { out[f.k] = f.dv })
  return out
}

// Nome lógico automático: `s3_1`, `rds_2`... Sem isso um recurso recém-adicionado
// sai como `resource "aws_s3_bucket" ""`, que nem o terraform fmt parseia.
const autoCount = {}
export function autoResName(type) {
  const n = (autoCount[type] = (autoCount[type] || 0) + 1)
  return String(type).replace(/^aws_/, '') + '_' + n
}

export function mkRes(type, label, extra) {
  const raw = String(label == null ? '' : label).trim()
  return {
    id: uid(),
    type,
    label: raw,
    auto: !raw,
    params: { ...defaultParams(type), ...(extra || {}) },
  }
}

export function mkVar(name, type, dv, description, sensitive) {
  return {
    id: uid(),
    name: name || '',
    type: type || 'string',
    dflt: dv == null ? '' : dv,
    description: description || '',
    sensitive: Boolean(sensitive),
  }
}

export function mkOutput(name, value, sensitive, description) {
  return {
    id: uid(),
    name: name || '',
    value: value || '',
    sensitive: Boolean(sensitive),
    description: description || '',
  }
}

export const PRESETS = {
  siteEstatico: {
    label: { pt: 'Bucket S3 + policy', en: 'S3 bucket + policy' },
    values: () => ({
      terraformVersion: '>= 1.5.0',
      awsVersion: '~> 5.0',
      region: 'var.aws_region',
      profile: '',
      defaultTags: true,
      autoVars: true,
      backend: true,
      backendBucket: 'meu-app-terraform-state',
      backendKey: 'site/prod/terraform.tfstate',
      tags: { project: 'site-estatico', environment: 'prod', owner: 'plataforma', extra: '' },
      variables: [mkVar('aws_region', 'string', 'us-east-1', 'Região da AWS.')],
      resources: [
        mkRes('s3', 'site', { bucketName: 'site-estatico-prod' }),
        mkRes('iam_policy', 'leitura_site', {
          policyName: 'leitura-site',
          sid: 'AllowAppRead',
          actions: 's3:GetObject\ns3:ListBucket',
          resources: '${aws_s3_bucket.site.arn}/*\n${aws_s3_bucket.site.arn}',
        }),
      ],
      autoOutputs: true,
      outputs: [],
    }),
  },
  apiCompleta: {
    label: { pt: 'API: ALB + EC2 + RDS', en: 'API: ALB + EC2 + RDS' },
    values: () => ({
      terraformVersion: '>= 1.5.0',
      awsVersion: '~> 5.0',
      region: 'var.aws_region',
      profile: '',
      defaultTags: true,
      autoVars: true,
      backend: true,
      backendBucket: 'meu-app-terraform-state',
      backendKey: 'api/prod/terraform.tfstate',
      tags: { project: 'api', environment: 'prod', owner: 'plataforma', extra: '' },
      variables: [
        mkVar('aws_region', 'string', 'us-east-1', 'Região da AWS.'),
        mkVar('db_username', 'string', 'appuser', 'Usuario master do Postgres.'),
        mkVar('db_password', 'string', '', 'Senha do Postgres.', true),
      ],
      resources: [
        mkRes('security_group', 'alb', { sgName: 'api-alb-sg', ingressPort: '443' }),
        mkRes('lb', 'api', {
          lbName: 'api-alb',
          targetPort: '8080',
          securityGroups: 'aws_security_group.alb.id',
        }),
        mkRes('security_group', 'app', { sgName: 'api-app-sg', ingressPort: '8080', extraPorts: '' }),
        mkRes('instance', 'app', {
          instanceType: 't3.small',
          subnetId: 'var.subnet_id',
          securityGroups: 'aws_security_group.app.id',
          rootVolume: '30',
          userData: '#!/bin/bash\nyum update -y\nsystemctl enable --now docker',
        }),
        mkRes('rds', 'db', {
          identifier: 'api-db',
          instanceClass: 'db.t3.micro',
          dbName: 'api',
          username: 'var.db_username',
          multiAz: true,
          backupRetention: '14',
        }),
      ],
      autoOutputs: true,
      outputs: [],
    }),
  },
  serverless: {
    label: { pt: 'Serverless: Lambda + SQS + IAM', en: 'Serverless: Lambda + SQS + IAM' },
    values: () => ({
      terraformVersion: '>= 1.5.0',
      awsVersion: '~> 5.0',
      region: 'var.aws_region',
      profile: '',
      defaultTags: true,
      autoVars: true,
      backend: false,
      backendBucket: 'meu-terraform-state',
      backendKey: 'worker/prod/terraform.tfstate',
      tags: { project: 'worker', environment: 'prod', owner: 'plataforma', extra: 'CostCenter=1234' },
      variables: [
        mkVar('aws_region', 'string', 'us-east-1', 'Região da AWS.'),
        mkVar('table_name', 'string', 'jobs', 'Tabela DynamoDB lida pela Lambda.'),
      ],
      resources: [
        mkRes('iam_role', 'worker', {
          roleName: 'worker-role',
          assumeService: 'lambda.amazonaws.com',
          policyArns: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole\narn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
        }),
        mkRes('sqs', 'jobs', { queueName: 'worker-jobs', kms: true }),
        mkRes('log_group', 'worker', { logName: '/aws/lambda/worker', retention: '30' }),
        mkRes('dynamodb', 'jobs_table', {
          tableName: 'jobs',
          hashKey: 'id',
          rangeKey: 'sk',
          ttlAttribute: 'expires_at',
          deletionProtection: true,
        }),
        mkRes('lambda', 'worker', {
          functionName: 'worker',
          roleArn: 'aws_iam_role.worker.arn',
          environment: 'LOG_LEVEL=info\nTABLE_NAME=var.table_name\nQUEUE_URL=aws_sqs_queue.jobs.url',
          memory: '512',
          timeout: '60',
        }),
      ],
      autoOutputs: true,
      outputs: [
        mkOutput('worker_invoke_arn', 'aws_lambda_function.worker.invoke_arn', false, 'ARN para invocar a Lambda.'),
      ],
    }),
  },
}

// ─── Montagem dos arquivos ───────────────────────────────────────────────────
function headerFor(lang, name) {
  return lang === 'en'
    ? '# ' + name + ' — generated by devtools (100% client-side)'
    : '# ' + name + ' — gerado pelo devtools (100% client-side)'
}

function buildProviders(cfg, lang) {
  const o = mkOut()
  o.l(0, headerFor(lang, 'providers.tf'))
  o.l(0, 'terraform {')
  o.a(1, 'required_version', q(cfg.terraformVersion || '>= 1.5.0'))
  o.blank()
  o.l(1, 'required_providers {')
  o.l(2, 'aws = {')
  o.a(3, 'source', '"hashicorp/aws"')
  o.a(3, 'version', q(cfg.awsVersion || '~> 5.0'))
  o.l(2, '}')
  o.l(1, '}')
  o.l(0, '}')
  o.blank()
  o.l(0, 'provider "aws" {')
  o.a(1, 'region', expr(cfg.region, 'var.aws_region'))
  if (isStr(cfg.profile)) o.a(1, 'profile', q(cfg.profile.trim()))
  if (cfg.defaultTags) {
    o.blank()
    o.l(1, 'default_tags {')
    o.a(2, 'tags', 'local.tags')
    o.l(1, '}')
  }
  o.l(0, '}')
  return o.text()
}

function buildBackend(cfg) {
  const o = mkOut()
  o.l(0, 'terraform {')
  o.l(1, 'backend "s3" {')
  o.a(2, 'bucket', q(String(cfg.backendBucket || '').trim()))
  o.a(2, 'key', q(String(cfg.backendKey || '').trim() || 'terraform.tfstate'))
  o.a(2, 'region', expr(cfg.region, 'var.aws_region'))
  o.a(2, 'encrypt', 'true')
  o.l(1, '}')
  o.l(0, '}')
  return o.text()
}

function buildLocals(cfg) {
  const t = cfg.tags || {}
  const extra = nonEmptyLines(t.extra)
  const pairs = [['Project', t.project || 'minha-app'], ['Environment', t.environment || 'prod']]
  if (isStr(t.owner)) pairs.push(['Owner', t.owner.trim()])
  extra.forEach((line) => {
    const idx = line.indexOf('=')
    const k = (idx === -1 ? line : line.slice(0, idx)).trim()
    const v = idx === -1 ? '' : line.slice(idx + 1).trim()
    if (k) pairs.push([k, v])
  })
  const w = pairs.reduce((m, p) => Math.max(m, p[0].length), 0)
  const o = mkOut()
  o.l(0, 'locals {')
  o.l(1, 'tags = {')
  pairs.forEach((p) => o.l(2, p[0].padEnd(w) + ' = ' + q(p[1])))
  o.l(1, '}')
  o.l(0, '}')
  return o.text()
}

function buildVariables(cfg, extraNames) {
  const all = cfg.variables.map((v) => ({ ...v }))
  if (extraNames && extraNames.length) {
    extraNames.forEach((name) => {
      if (all.some((v) => v.name.trim() === name)) return
      const hint = AUTO_VAR_DEFAULTS[name] || {}
      all.push(
        mkVar(
          name,
          'string',
          hint.default == null ? '' : hint.default,
          hint.description || 'Declarada automaticamente pelo gerador.',
          hint.sensitive
        )
      )
    })
  }
  if (!all.length) return ''
  const o = mkOut()
  all.forEach((v) => {
    o.l(0, 'variable "' + String(v.name || '').trim() + '" {')
    if (isStr(v.description)) o.a(1, 'description', q(v.description.trim()))
    o.a(1, 'type', v.type || 'string')
    const dv = String(v.dflt || '').trim()
    if (dv) {
      if (v.type === 'number') o.a(1, 'default', String(Number(dv) || 0))
      else if (v.type === 'bool') o.a(1, 'default', dv === 'true' ? 'true' : 'false')
      else o.a(1, 'default', tfValue(dv))
    }
    if (v.sensitive) o.a(1, 'sensitive', 'true')
    o.l(1, '}')
    o.blank()
  })
  return o.text()
}

function buildOutputs(cfg, chunks) {
  const o = mkOut()
  const seen = new Set()
  const push = (name, value, sensitive, description) => {
    const n = String(name || '').trim()
    if (!n || seen.has(n)) return
    seen.add(n)
    o.l(0, 'output "' + n + '" {')
    if (isStr(description)) o.a(1, 'description', q(String(description).trim()))
    o.a(1, 'value', expr(value, ''))
    if (sensitive) o.a(1, 'sensitive', 'true')
    o.l(1, '}')
    o.blank()
  }

  if (cfg.autoOutputs) {
    chunks.forEach(({ res, def }) => {
      if (def && def.outputs) def.outputs(String(res.label || '').trim()).forEach((pair) => push(pair[0], pair[1], false, ''))
    })
  }
  cfg.outputs.forEach((x) => push(x.name, x.value, x.sensitive, x.description))
  return o.text()
}

function tfvarsValue(v) {
  const dv = String(v.dflt || '').trim()
  if (!dv) {
    if (v.type === 'number') return '0'
    if (v.type === 'bool') return 'false'
    if (v.type.indexOf('(') !== -1) return '[]'
    return '""'
  }
  if (v.type === 'number') return String(Number(dv) || 0)
  if (v.type === 'bool') return dv === 'true' ? 'true' : 'false'
  return tfValue(dv)
}

function buildTfvars(cfg, declaredNames, lang) {
  const o = mkOut()
  if (lang === 'en') {
    o.l(0, '# terraform.tfvars — copy to terraform.tfvars and adjust the values.')
    o.l(0, '# Never commit the real tfvars: that is where account/passwords usually live.')
  } else {
    o.l(0, '# terraform.tfvars — copie para terraform.tfvars e ajuste os valores.')
    o.l(0, '# O arquivo real nao vai para o git: e ele que costuma ter conta/senha de verdade.')
  }
  cfg.variables.forEach((v) => {
    const name = String(v.name || '').trim()
    if (!name || !declaredNames.has(name)) return
    if (v.sensitive) {
      o.l(0, '# ' + name + ' = "<preencher via TF_VAR_' + name + ' no CI, fora do git>"')
      return
    }
    o.l(0, name + ' = ' + tfvarsValue(v))
  })
  return o.text()
}

export function buildTerraform(cfg, lang) {
  // Com default_tags ligado, a tag vai uma vez só no provider e os recursos
  // não repetem `tags`; com ele desligado, cada recurso recebe local.tags.
  const ctx = { tagsExpr: cfg.defaultTags ? null : 'local.tags' }

  // Nome em falta ou ilegível ainda precisa virar HCL válido: o validador segue
  // apontando o erro no formulário, mas o preview não pode sair com `""` ou
  // `aws_s3_bucket..id` dentro do arquivo.
  const usableLabel = (label, fallback) => {
    const l = String(label == null ? '' : label).trim()
    return isIdent(l) ? l : fallback
  }
  const resources = (cfg.resources || []).map((r, i) => {
    const label = usableLabel(r.label, 'unnamed_' + (i + 1))
    return label === String(r.label || '').trim() ? r : { ...r, label }
  })
  const variables = (cfg.variables || []).map((v, i) => {
    const name = usableLabel(v.name, 'unnamed_var_' + (i + 1))
    return name === String(v.name || '').trim() ? v : { ...v, name }
  })
  const form = { ...cfg, resources, variables }

  const chunks = resources.map((res) => {
    const def = RESOURCE_TYPES.find((x) => x.value === res.type) || RESOURCE_TYPES[0]
    const o = mkOut()
    try {
      def.emit(o, { ...res, ...(res.params || {}) }, ctx)
    } catch (err) {
      const msg = (err && err.message) || String(err)
      o.l(0, lang === 'en' ? '# failed to emit resource ' + res.type + ': ' + msg : '# erro ao gerar o recurso ' + res.type + ': ' + msg)
    }
    const text = o.text()
    return {
      res,
      def,
      text,
      blocks: (text.match(/^(resource|data) "/gm) || []).length,
      vars: refsIn(text),
    }
  })

  const parts = []
  parts.push(buildLocals(form))
  chunks.forEach((c) => {
    if (!c.text.trim()) return
    parts.push('# ' + c.def.addr + '.' + String(c.res.label || '').trim() + '\n' + c.text)
  })
  const mainText = parts.filter(Boolean).join('\n\n')

  const providersText = buildProviders(form, lang)
  const outputsText = buildOutputs(form, chunks)
  const referenced = refsIn([providersText, mainText, outputsText].join('\n'))

  const declaredNames = new Set(
    variables.map((v) => v.name).filter(Boolean)
  )
  const missing = referenced.filter((n) => !declaredNames.has(n))
  const autoVars = form.autoVars ? missing : []
  const fullDeclared = new Set([...declaredNames, ...autoVars])

  const files = [
    { name: 'providers.tf', text: providersText },
    { name: 'main.tf', text: mainText },
    { name: 'variables.tf', text: buildVariables(form, autoVars) },
    { name: 'outputs.tf', text: outputsText },
    { name: 'terraform.tfvars.example', text: buildTfvars(form, fullDeclared, lang) },
  ]
  if (form.backend) files.splice(1, 0, { name: 'backend.tf', text: buildBackend(form) })

  const summary = chunks.map((c) => ({
    type: c.def.value,
    addr: c.def.addr,
    label: String(c.res.label || '').trim(),
    blocks: c.blocks,
    vars: c.vars,
  }))

  return {
    files,
    summary,
    referenced,
    missing,
    autoVars,
    problems: validate(cfg, {
      referenced,
      missing,
      declaredNames: fullDeclared,
      autoDeclared: new Set(autoVars),
    }),
  }
}

// ─── Validação ───────────────────────────────────────────────────────────────
// Erros (e_*) quebram o `terraform plan`; avisos (w_*) não quebram, mas são o
// que costuma acordar alguém às 3h da manhã.
function bucketNameProblem(name) {
  const n = String(name || '').trim()
  if (!n) return 'empty'
  if (n.length < 3 || n.length > 63) return 'length'
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(n)) return 'chars'
  if (/[._]{2,}/.test(n) || /\.-\.|\.-/.test(n)) return 'dots'
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(n)) return 'ip'
  return null
}

export function validate(cfg, info) {
  const ctx = info || { referenced: [], declaredNames: new Set(), autoDeclared: new Set() }
  const errs = []
  const warns = []
  const push = (arr, key) => {
    if (arr.indexOf(key) === -1) arr.push(key)
  }

  if (!cfg.resources.length) push(warns, 'w_noResources')

  const seen = {}
  cfg.resources.forEach((r) => {
    const def = RESOURCE_TYPES.find((x) => x.value === r.type) || RESOURCE_TYPES[0]
    const label = String(r.label || '').trim()
    const key = r.type + '.' + label

    if (!label) push(errs, 'e_noLabel')
    else if (!isIdent(label)) push(errs, 'e_badLabel')
    else if (seen[key]) push(errs, 'e_dupResource')
    else seen[key] = true

    const p = r.params || {}

    if (r.type === 's3') {
      const why = bucketNameProblem(p.bucketName)
      if (why) push(errs, 'e_bucket_' + why)
      if (!p.encryption) push(warns, 'w_s3NoEncryption')
      if (!p.versioning) push(warns, 'w_s3NoVersioning')
    }

    if (r.type === 'instance') {
      const ami = String(p.ami || '').trim()
      if (ami && !/^ami-/.test(ami)) push(errs, 'e_amiFormat')
      if (/ami-(0c55b159cbfafe1f0|12345678|abcdef12)/.test(ami)) push(warns, 'w_amiExample')
      if (Number(p.rootVolume) < 8) push(warns, 'w_rootVolumeSmall')
    }

    if (r.type === 'security_group') {
      const port = String(p.ingressPort || '').trim()
      if (port && port.toLowerCase() !== 'all' && !/^\d+$/.test(port)) push(errs, 'e_portFormat')
      nonEmptyLines(p.ingressCidr).forEach((c) => {
        if (c === '0.0.0.0/0') push(warns, 'w_cidrAny')
      })
      nonEmptyLines(p.extraPorts).forEach((x) => {
        if (x.toLowerCase() !== 'all' && !/^\d+$/.test(x)) push(errs, 'e_portFormat')
      })
    }

    if (r.type === 'lb') {
      if (p.protocol !== 'HTTP' && !isStr(p.certificateArn)) push(errs, 'e_noCertificate')
      if (!nonEmptyLines(p.subnets).length) push(errs, 'e_noSubnets')
    }

    if (r.type === 'rds') {
      if (p.publiclyAccessible) push(warns, 'w_rdsPublic')
      if (!p.encrypted) push(warns, 'w_rdsNoEncryption')
      if (Number(p.backupRetention) === 0) push(warns, 'w_rdsNoBackup')
    }

    if (r.type === 'dynamodb') {
      if (!p.sse) push(warns, 'w_dynamoNoEncryption')
      if (!isStr(p.hashKey)) push(errs, 'e_noHashKey')
      if (p.billingMode === 'PROVISIONED' && !(Number(p.readCapacity) > 0)) push(warns, 'w_provisionedZero')
    }

    if (r.type === 'lambda' && !isStr(p.roleArn)) push(errs, 'e_noRoleArn')

    if (r.type === 'sqs') {
      const name = String(p.queueName || '').trim()
      const fifoName = /\.fifo$/.test(name)
      if (name && Boolean(p.fifo) !== fifoName) push(errs, 'e_fifoSuffix')
    }

    // Segredo literal dentro do recurso: o grep mais rentável do mundo.
    Object.keys(p).forEach((k) => {
      if (!/(pass|secret|token|private_key|access_key|credential)/i.test(k)) return
      const v = String(p[k] || '').trim()
      if (!v || /^(var|local|data)\./.test(v)) return
      push(warns, 'w_secretLiteral')
    })
  })

  const varNames = new Set()
  cfg.variables.forEach((v) => {
    const name = String(v.name || '').trim()
    if (!name) {
      push(errs, 'e_varNoName')
      return
    }
    if (!isIdent(name)) push(errs, 'e_varBadName')
    if (varNames.has(name)) push(errs, 'e_varDup')
    varNames.add(name)
    const dv = String(v.dflt || '').trim()
    if (dv && v.type === 'number' && !/^-?\d+(\.\d+)?$/.test(dv)) push(errs, 'e_varDefault')
    if (dv && v.type === 'bool' && !/^(true|false)$/i.test(dv)) push(errs, 'e_varDefault')
    if (dv && /^(var|local|data)\./.test(dv)) push(errs, 'e_varDefaultRef')
    if (v.sensitive && dv) push(warns, 'w_varSecretDefault')
  })

  const outNames = new Set()
  cfg.outputs.forEach((x) => {
    const name = String(x.name || '').trim()
    if (!name) {
      push(errs, 'e_outNoName')
      return
    }
    if (!isIdent(name)) push(errs, 'e_outBadName')
    if (outNames.has(name)) push(errs, 'e_outDup')
    outNames.add(name)
    if (!isStr(x.value)) push(errs, 'e_outNoValue')
  })

  // Cruzamento com o texto realmente gerado.
  if (ctx.missing && ctx.missing.length && !ctx.autoDeclared.size) push(warns, 'w_missingVar')
  ctx.declaredNames.forEach((name) => {
    if (ctx.referenced.indexOf(name) === -1) push(warns, 'w_unusedVar')
  })

  if (!isStr(cfg.region)) push(warns, 'w_noRegion')
  if (!cfg.backend) push(warns, 'w_noBackend')

  return { errors: errs, warnings: warns }
}
