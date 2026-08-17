// Gerador de políticas IAM da AWS.
// 100% client-side — nenhum dado sai do navegador.
// Gera apenas JSON válido no formato esperado pela AWS; a política ainda
// precisa ser revisada antes de ser aplicada em produção.

/** Versões válidas de uma política IAM. */
export const POLICY_VERSIONS = ['2012-10-17', '2008-10-17']

/** Efeitos possíveis de um statement. */
export const EFFECTS = ['Allow', 'Deny']

/** Operadores comuns de Condition (subset dos suportados pela AWS). */
export const CONDITION_OPERATORS = [
  'StringEquals',
  'StringNotEquals',
  'StringEqualsIgnoreCase',
  'StringLike',
  'StringNotLike',
  'NumericEquals',
  'NumericGreaterThan',
  'NumericLessThan',
  'DateEquals',
  'DateGreaterThan',
  'DateLessThan',
  'Bool',
  'IpAddress',
  'NotIpAddress',
  'ArnEquals',
  'ArnLike',
  'Null',
]

/** Efeitos visuais/rótulos bilíngues. */
export const labels = {
  pt: {
    version: 'Versão',
    effect: 'Efeito',
    sid: 'Sid',
    principal: 'Principal',
    actions: 'Action(s)',
    notActions: 'NotAction(s)',
    resources: 'Resource(s)',
    notResources: 'NotResource(s)',
    conditions: 'Condition(s)',
    operator: 'Operador',
    key: 'Key',
    values: 'Values',
    allow: 'Allow',
    deny: 'Deny',
  },
  en: {
    version: 'Version',
    effect: 'Effect',
    sid: 'Sid',
    principal: 'Principal',
    actions: 'Action(s)',
    notActions: 'NotAction(s)',
    resources: 'Resource(s)',
    notResources: 'NotResource(s)',
    conditions: 'Condition(s)',
    operator: 'Operator',
    key: 'Key',
    values: 'Values',
    allow: 'Allow',
    deny: 'Deny',
  },
}

/**
 * Cria um statement IAM vazio/padrão.
 * @returns {{ id: string, sid: string, effect: 'Allow', principal: string, actions: string[], notActions: string[], resources: string[], notResources: string[], conditions: Array }}
 */
export function createStatement() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sid: '',
    effect: 'Allow',
    principal: '',
    actions: [''],
    notActions: [],
    resources: [''],
    notResources: [],
    conditions: [],
  }
}

/**
 * Cria uma política IAM vazia.
 * @returns {{ version: string, statements: Array }}
 */
export function createPolicy() {
  return { version: '2012-10-17', statements: [createStatement()] }
}

/**
 * Cria uma condição IAM vazia.
 * @returns {{ id: string, operator: string, key: string, values: string[] }}
 */
export function createCondition() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    operator: 'StringEquals',
    key: '',
    values: [''],
  }
}

function compactList(list) {
  return Array.isArray(list) ? list.map((s) => String(s).trim()).filter(Boolean) : []
}

function buildConditionBlock(conditions) {
  const block = {}
  for (const c of conditions) {
    const op = c.operator?.trim()
    const key = c.key?.trim()
    const values = compactList(c.values)
    if (!op || !key || values.length === 0) continue
    if (!block[op]) block[op] = {}
    block[op][key] = values.length === 1 ? values[0] : values
  }
  return Object.keys(block).length > 0 ? block : null
}

function buildStatementPayload(statement) {
  const payload = {
    Effect: statement.effect === 'Deny' ? 'Deny' : 'Allow',
  }

  const sid = String(statement.sid || '').trim()
  if (sid) payload.Sid = sid

  const principal = String(statement.principal || '').trim()
  if (principal) payload.Principal = principal === '*' ? '*' : { AWS: principal }

  const actions = compactList(statement.actions)
  if (actions.length) payload.Action = actions.length === 1 ? actions[0] : actions

  const notActions = compactList(statement.notActions)
  if (notActions.length) payload.NotAction = notActions.length === 1 ? notActions[0] : notActions

  const resources = compactList(statement.resources)
  if (resources.length) payload.Resource = resources.length === 1 ? resources[0] : resources

  const notResources = compactList(statement.notResources)
  if (notResources.length) {
    payload.NotResource = notResources.length === 1 ? notResources[0] : notResources
  }

  const conditionBlock = buildConditionBlock(statement.conditions || [])
  if (conditionBlock) payload.Condition = conditionBlock

  return payload
}

/**
 * Gera o JSON final de uma política IAM a partir do estado interno.
 * @param {{ version: string, statements: Array }} policy
 * @param {number} indent
 * @returns {{ json: string, payload: object, valid: boolean, errors: string[] }}
 */
export function generatePolicy(policy, indent = 2) {
  const errors = []
  const statements = (policy.statements || []).map(buildStatementPayload)

  if (statements.length === 0) {
    errors.push('A política precisa de pelo menos um statement.')
  }

  statements.forEach((s, idx) => {
    const num = idx + 1
    if (!s.Action && !s.NotAction) {
      errors.push(`Statement ${num}: informe pelo menos uma Action ou NotAction.`)
    }
    if (!s.Resource && !s.NotResource) {
      errors.push(`Statement ${num}: informe pelo menos um Resource ou NotResource.`)
    }
    if (s.Effect === 'Allow' && s.Resource === '*') {
      errors.push(`Statement ${num}: Allow com Resource "*" é muito permissivo — revise antes de usar.`)
    }
  })

  const payload = {
    Version: policy.version || '2012-10-17',
    Statement: statements,
  }

  return {
    json: JSON.stringify(payload, null, indent),
    payload,
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valida o estado da política sem gerar o JSON.
 * @param {{ version: string, statements: Array }} policy
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePolicy(policy) {
  const { valid, errors } = generatePolicy(policy)
  return { valid, errors }
}

/**
 * Conta actions, resources e conditions úteis para estatísticas.
 * @param {{ statements: Array }} policy
 */
export function countPolicyStats(policy) {
  const statements = policy.statements || []
  let actions = 0
  let resources = 0
  let conditions = 0
  for (const s of statements) {
    actions += compactList(s.actions).length
    resources += compactList(s.resources).length
    conditions += (s.conditions || []).filter(
      (c) => c.operator?.trim() && c.key?.trim() && compactList(c.values).length > 0
    ).length
  }
  return { statements: statements.length, actions, resources, conditions }
}

/**
 * Presets rápidos de políticas IAM.
 * @param {string} lang - 'pt' | 'en'
 * @returns {Array<{ key: string, label: string, policy: object }>}
 */
export function getPresets(lang = 'pt') {
  const l = {
    pt: {
      s3ReadOnly: 'S3 read-only',
      s3Full: 'S3 acesso total',
      lambdaInvoke: 'Lambda invoke',
      ec2Admin: 'EC2 admin',
      dynamoReadWrite: 'DynamoDB leitura/escrita',
      cloudfrontInvalidate: 'CloudFront invalidation',
      crossAccountRead: 'Cross-account read-only',
      forceMfa: 'Forçar MFA',
      denyAll: 'Deny all',
    },
    en: {
      s3ReadOnly: 'S3 read-only',
      s3Full: 'S3 full access',
      lambdaInvoke: 'Lambda invoke',
      ec2Admin: 'EC2 admin',
      dynamoReadWrite: 'DynamoDB read/write',
      cloudfrontInvalidate: 'CloudFront invalidation',
      crossAccountRead: 'Cross-account read-only',
      forceMfa: 'Enforce MFA',
      denyAll: 'Deny all',
    },
  }[lang]

  return [
    {
      key: 's3ReadOnly',
      label: l.s3ReadOnly,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-s3-ro',
            sid: 'S3ReadOnly',
            effect: 'Allow',
            principal: '',
            actions: ['s3:GetObject', 's3:ListBucket'],
            notActions: [],
            resources: ['arn:aws:s3:::bucket-name', 'arn:aws:s3:::bucket-name/*'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
    {
      key: 's3Full',
      label: l.s3Full,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-s3-full',
            sid: 'S3FullAccess',
            effect: 'Allow',
            principal: '',
            actions: ['s3:*'],
            notActions: [],
            resources: ['arn:aws:s3:::bucket-name', 'arn:aws:s3:::bucket-name/*'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
    {
      key: 'lambdaInvoke',
      label: l.lambdaInvoke,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-lambda-invoke',
            sid: 'LambdaInvoke',
            effect: 'Allow',
            principal: '',
            actions: ['lambda:InvokeFunction'],
            notActions: [],
            resources: ['arn:aws:lambda:us-east-1:123456789012:function:my-function'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
    {
      key: 'ec2Admin',
      label: l.ec2Admin,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-ec2-admin',
            sid: 'EC2Admin',
            effect: 'Allow',
            principal: '',
            actions: ['ec2:*'],
            notActions: [],
            resources: ['*'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
    {
      key: 'dynamoReadWrite',
      label: l.dynamoReadWrite,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-dynamo',
            sid: 'DynamoDBReadWrite',
            effect: 'Allow',
            principal: '',
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:Query', 'dynamodb:Scan'],
            notActions: [],
            resources: ['arn:aws:dynamodb:us-east-1:123456789012:table/my-table'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
    {
      key: 'cloudfrontInvalidate',
      label: l.cloudfrontInvalidate,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-cf',
            sid: 'CloudFrontInvalidate',
            effect: 'Allow',
            principal: '',
            actions: ['cloudfront:CreateInvalidation'],
            notActions: [],
            resources: ['arn:aws:cloudfront::123456789012:distribution/DISTRIBUTION_ID'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
    {
      key: 'crossAccountRead',
      label: l.crossAccountRead,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-cross-account',
            sid: 'CrossAccountReadOnly',
            effect: 'Allow',
            principal: 'arn:aws:iam::123456789012:root',
            actions: ['s3:GetObject'],
            notActions: [],
            resources: ['arn:aws:s3:::bucket-name/*'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
    {
      key: 'forceMfa',
      label: l.forceMfa,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-mfa',
            sid: 'ForceMFA',
            effect: 'Deny',
            principal: '',
            actions: ['*'],
            notActions: [],
            resources: ['*'],
            notResources: [],
            conditions: [
              { id: 'preset-mfa-cond', operator: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['false'] },
            ],
          },
        ],
      },
    },
    {
      key: 'denyAll',
      label: l.denyAll,
      policy: {
        version: '2012-10-17',
        statements: [
          {
            id: 'preset-deny',
            sid: 'DenyAll',
            effect: 'Deny',
            principal: '',
            actions: ['*'],
            notActions: [],
            resources: ['*'],
            notResources: [],
            conditions: [],
          },
        ],
      },
    },
  ]
}

/**
 * Faz o download de um blob como arquivo.
 * @param {string} content
 * @param {string} filename
 */
export function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
