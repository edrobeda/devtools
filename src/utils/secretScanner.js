// Motor do Scanner de Segredos Expostos (/security/secret-scanner).
//
// 100% client-side: nada sai do navegador. A detecção tem duas camadas:
//   1. Assinaturas conhecidas (regex) de credenciais com formato próprio —
//      AWS, GitHub, GitLab, Slack, Stripe, Google, OpenAI, Anthropic, chaves
//      privadas PEM, JWT, etc. Alta precisão, pouco ruído.
//   2. Atribuições genéricas (api_key = "...", token: "...") cujo valor tem
//      alta entropia de Shannon — pega segredos sem formato conhecido.
//
// A saída é um LAUDO (tipo, severidade, linha, valor mascarado), não um
// texto redigido — mascarar o texto é o trabalho de /security/pii-redactor.

export const SEVERITIES = ['critical', 'high', 'medium', 'low']

export const SEVERITY_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

// Assinaturas conhecidas. `source` é compilado numa regex nova a cada scan
// para não carregar `lastIndex` entre chamadas.
export const SECRET_RULES = [
  {
    id: 'aws-access-key',
    severity: 'critical',
    label: { pt: 'AWS Access Key ID', en: 'AWS Access Key ID' },
    source: '\\b(?:AKIA|ASIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ABIA)[A-Z0-9]{16}\\b',
    advice: {
      pt: 'Chave de acesso da AWS. Desative a chave no IAM e crie outra imediatamente.',
      en: 'AWS access key. Deactivate the key in IAM and issue a new one immediately.',
    },
  },
  {
    id: 'github-token',
    severity: 'critical',
    label: { pt: 'Token do GitHub', en: 'GitHub token' },
    source: '\\bgh[pousr]_[A-Za-z0-9]{36,}\\b',
    advice: {
      pt: 'Token pessoal/instalação do GitHub. Revogue em Settings → Developer settings → Tokens.',
      en: 'GitHub personal/installation token. Revoke it in Settings → Developer settings → Tokens.',
    },
  },
  {
    id: 'github-fine-grained',
    severity: 'critical',
    label: { pt: 'GitHub PAT (fine-grained)', en: 'GitHub fine-grained PAT' },
    source: '\\bgithub_pat_[A-Za-z0-9_]{60,}\\b',
    advice: {
      pt: 'Token fine-grained do GitHub. Revogue em Settings → Developer settings.',
      en: 'GitHub fine-grained token. Revoke it in Settings → Developer settings.',
    },
  },
  {
    id: 'gitlab-token',
    severity: 'critical',
    label: { pt: 'Token do GitLab', en: 'GitLab token' },
    source: '\\bglpat-[A-Za-z0-9_-]{20,}\\b',
    advice: {
      pt: 'Token do GitLab. Revogue em Preferences → Access Tokens.',
      en: 'GitLab token. Revoke it in Preferences → Access Tokens.',
    },
  },
  {
    id: 'slack-token',
    severity: 'high',
    label: { pt: 'Token do Slack', en: 'Slack token' },
    source: '\\bxox[baprs]-[A-Za-z0-9-]{10,}\\b',
    advice: {
      pt: 'Token do Slack. Revogue o app/token no painel de apps do workspace.',
      en: 'Slack token. Revoke the app/token in the workspace app dashboard.',
    },
  },
  {
    id: 'slack-webhook',
    severity: 'high',
    label: { pt: 'Webhook do Slack', en: 'Slack webhook' },
    source: 'https://hooks\\.slack\\.com/services/[A-Za-z0-9/_+-]{20,}',
    advice: {
      pt: 'URL de webhook do Slack. Invalide o webhook e crie outro.',
      en: 'Slack webhook URL. Invalidate the webhook and create a new one.',
    },
  },
  {
    id: 'stripe-secret',
    severity: 'critical',
    label: { pt: 'Chave secreta do Stripe', en: 'Stripe secret key' },
    source: '\\bsk_(?:live|test)_[A-Za-z0-9]{16,}\\b',
    advice: {
      pt: 'Chave secreta do Stripe. Faça roll da chave no dashboard do Stripe.',
      en: 'Stripe secret key. Roll the key in the Stripe dashboard.',
    },
  },
  {
    id: 'stripe-restricted',
    severity: 'high',
    label: { pt: 'Chave restrita do Stripe', en: 'Stripe restricted key' },
    source: '\\brk_(?:live|test)_[A-Za-z0-9]{16,}\\b',
    advice: {
      pt: 'Chave restrita do Stripe. Faça roll da chave no dashboard.',
      en: 'Stripe restricted key. Roll the key in the dashboard.',
    },
  },
  {
    id: 'google-api-key',
    severity: 'high',
    label: { pt: 'Google API key', en: 'Google API key' },
    source: '\\bAIza[0-9A-Za-z_-]{35}\\b',
    advice: {
      pt: 'Chave de API do Google. Restrinja ou regenere no Google Cloud Console.',
      en: 'Google API key. Restrict or regenerate it in the Google Cloud Console.',
    },
  },
  {
    id: 'openai-key',
    severity: 'high',
    label: { pt: 'Chave da OpenAI', en: 'OpenAI key' },
    source: '\\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\\b',
    advice: {
      pt: 'Chave da OpenAI. Revogue em platform.openai.com/api-keys.',
      en: 'OpenAI key. Revoke it at platform.openai.com/api-keys.',
    },
  },
  {
    id: 'anthropic-key',
    severity: 'high',
    label: { pt: 'Chave da Anthropic', en: 'Anthropic key' },
    source: '\\bsk-ant-[A-Za-z0-9_-]{20,}\\b',
    advice: {
      pt: 'Chave da Anthropic. Revogue no console da Anthropic.',
      en: 'Anthropic key. Revoke it in the Anthropic console.',
    },
  },
  {
    id: 'sendgrid-key',
    severity: 'high',
    label: { pt: 'Chave do SendGrid', en: 'SendGrid key' },
    source: '\\bSG\\.[A-Za-z0-9_-]{22}\\.[A-Za-z0-9_-]{43}\\b',
    advice: {
      pt: 'Chave de API do SendGrid. Revogue e crie outra em Settings → API Keys.',
      en: 'SendGrid API key. Revoke it and create a new one in Settings → API Keys.',
    },
  },
  {
    id: 'twilio-key',
    severity: 'high',
    label: { pt: 'Chave do Twilio', en: 'Twilio key' },
    source: '\\bSK[0-9a-fA-F]{32}\\b',
    advice: {
      pt: 'Chave de API do Twilio. Revogue no console do Twilio.',
      en: 'Twilio API key. Revoke it in the Twilio console.',
    },
  },
  {
    id: 'npm-token',
    severity: 'high',
    label: { pt: 'Token do npm', en: 'npm token' },
    source: '\\bnpm_[A-Za-z0-9]{36}\\b',
    advice: {
      pt: 'Token do npm. Revogue em npmjs.com → Access Tokens.',
      en: 'npm token. Revoke it at npmjs.com → Access Tokens.',
    },
  },
  {
    id: 'pypi-token',
    severity: 'high',
    label: { pt: 'Token do PyPI', en: 'PyPI token' },
    source: '\\bpypi-AgEIcHlwaS5vcmc[A-Za-z0-9_-]{40,}\\b',
    advice: {
      pt: 'Token do PyPI. Revogue em pypi.org → Account settings.',
      en: 'PyPI token. Revoke it at pypi.org → Account settings.',
    },
  },
  {
    id: 'digitalocean-token',
    severity: 'high',
    label: { pt: 'Token da DigitalOcean', en: 'DigitalOcean token' },
    source: '\\bdop_v1_[a-f0-9]{64}\\b',
    advice: {
      pt: 'Token da DigitalOcean. Revogue em API → Tokens.',
      en: 'DigitalOcean token. Revoke it in API → Tokens.',
    },
  },
  {
    id: 'shopify-token',
    severity: 'high',
    label: { pt: 'Token de acesso do Shopify', en: 'Shopify access token' },
    source: '\\bshpat_[a-f0-9]{32}\\b',
    advice: {
      pt: 'Token de acesso do Shopify. Revogue o app no admin da loja.',
      en: 'Shopify access token. Revoke the app in the store admin.',
    },
  },
  {
    id: 'private-key',
    severity: 'critical',
    label: { pt: 'Chave privada (PEM)', en: 'Private key (PEM)' },
    source: '-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----',
    advice: {
      pt: 'Chave privada exposta. Gere um novo par e remova do histórico do Git.',
      en: 'Exposed private key. Generate a new pair and purge it from Git history.',
    },
  },
  {
    id: 'jwt',
    severity: 'medium',
    label: { pt: 'JWT', en: 'JWT' },
    source: '\\beyJ[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\b',
    advice: {
      pt: 'Token JWT. Se for de longa duração ou assinado com chave comprometida, invalide-o.',
      en: 'JWT token. If it is long-lived or signed with a compromised key, invalidate it.',
    },
  },
  {
    id: 'bearer-token',
    severity: 'medium',
    label: { pt: 'Token Bearer', en: 'Bearer token' },
    source: '\\bBearer\\s+[A-Za-z0-9._~+/=-]{16,}',
    advice: {
      pt: 'Token de autorização Bearer. Revogue a sessão/token correspondente.',
      en: 'Bearer authorization token. Revoke the matching session/token.',
    },
  },
  {
    id: 'connection-uri',
    severity: 'high',
    label: { pt: 'URI de conexão com senha', en: 'Connection URI with password' },
    source: '(?:postgres(?:ql)?|mysql|mongodb(?:\\+srv)?|redis|amqp|ftp|https?)://[^\\s:@/]+:[^\\s@/]{3,}@',
    advice: {
      pt: 'String de conexão com usuário e senha. Troque a senha e use um cofre de segredos.',
      en: 'Connection string with username and password. Rotate the password and use a secrets vault.',
    },
  },
]

// Valores que, mesmo tendo cara de segredo, são claramente placeholders —
// não valem a pena virar achado.
const PLACEHOLDER_HINTS = [
  'example', 'sample', 'dummy', 'placeholder', 'redacted', 'changeme',
  'your_api_key', 'yourapikey', 'your-key', 'your_key', 'xxxx', 'todo',
  'replace_me', 'replaceme', 'process.env', 'os.environ', 'getenv',
  'insert', 'foobar', 'lorem', 'abc123', 'notasecret', 'not_a_secret',
]

const ASSIGNMENT_RE = new RegExp(
  '(?:api[_-]?key|apikey|secret[_-]?key|secret|token|passwd|password|pwd|' +
    'access[_-]?key|client[_-]?secret|private[_-]?key|auth[_-]?token|bearer)' +
    '\\s*[:=]\\s*["\'`]?([A-Za-z0-9_./+~-]{12,})["\'`]?',
  'gi',
)

export function shannonEntropy(str) {
  if (!str) return 0
  const freq = Object.create(null)
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1
  const len = str.length
  let entropy = 0
  for (const ch in freq) {
    const p = freq[ch] / len
    entropy -= p * Math.log2(p)
  }
  return entropy
}

export function looksLikePlaceholder(value) {
  const v = String(value).toLowerCase()
  if (v.length < 12) return true
  if (PLACEHOLDER_HINTS.some((hint) => v.includes(hint))) return true
  if (v.includes('${') || v.includes('<') || v.includes('%s') || v.includes('{{')) return true
  if (/^(.)\1+$/.test(v)) return true
  if (/^0+$/.test(v) || /^1+$/.test(v)) return true
  return false
}

export function maskSecret(value) {
  const v = String(value)
  if (v.length <= 8) return '\u2022'.repeat(v.length)
  const head = v.slice(0, 4)
  const tail = v.slice(-4)
  return head + '\u2022'.repeat(Math.max(3, v.length - 8)) + tail
}

function buildLineIndex(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1)
  }
  return starts
}

function locate(starts, index) {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= index) lo = mid
    else hi = mid - 1
  }
  return { line: lo + 1, column: index - starts[lo] + 1 }
}

/**
 * Escaneia um texto e devolve um laudo de segredos encontrados.
 * @param {string} text
 * @param {{ includeGeneric?: boolean, entropyThreshold?: number, maxFindings?: number }} [options]
 * @returns {Array<{ id, ruleId, severity, label, line, column, value, masked, entropy }>}
 */
export function scanText(text, options = {}) {
  const {
    includeGeneric = true,
    entropyThreshold = 3.5,
    maxFindings = 1000,
  } = options

  const src = typeof text === 'string' ? text : ''
  if (!src) return []
  const input = src.length > 1_000_000 ? src.slice(0, 1_000_000) : src

  const lineStarts = buildLineIndex(input)
  const findings = []
  const seen = new Set()

  const push = (finding) => {
    const key = finding.line + '|' + finding.value
    if (seen.has(key)) return
    // Evita reportar o mesmo trecho duas vezes (ex.: "Bearer <jwt>" casa
    // também com a regra de JWT). Se um achado já contém este valor — ou é
    // contido por ele — na mesma linha, fica só o mais específico.
    const overlap = findings.some(
      (f) =>
        f.line === finding.line &&
        (f.value.includes(finding.value) || finding.value.includes(f.value)),
    )
    if (overlap) return
    seen.add(key)
    findings.push(finding)
  }

  for (const rule of SECRET_RULES) {
    if (findings.length >= maxFindings) break
    const re = new RegExp(rule.source, 'g')
    let match
    while ((match = re.exec(input)) !== null) {
      const value = match[0]
      const pos = locate(lineStarts, match.index)
      push({
        id: rule.id + ':' + pos.line + ':' + pos.column,
        ruleId: rule.id,
        severity: rule.severity,
        label: rule.label,
        line: pos.line,
        column: pos.column,
        value,
        masked: maskSecret(value),
        entropy: null,
      })
      if (match.index === re.lastIndex) re.lastIndex += 1
      if (findings.length >= maxFindings) break
    }
  }

  if (includeGeneric && findings.length < maxFindings) {
    ASSIGNMENT_RE.lastIndex = 0
    let match
    while ((match = ASSIGNMENT_RE.exec(input)) !== null) {
      const value = match[1]
      const valueIndex = match.index + match[0].length - value.length
      const entropy = shannonEntropy(value)
      if (!looksLikePlaceholder(value) && entropy >= entropyThreshold) {
        const pos = locate(lineStarts, valueIndex)
        push({
          id: 'generic-assignment:' + pos.line + ':' + pos.column,
          ruleId: 'generic-assignment',
          severity: value.length >= 32 && entropy >= 4 ? 'high' : 'medium',
          label: { pt: 'Segredo de alto entropia', en: 'High-entropy secret' },
          line: pos.line,
          column: pos.column,
          value,
          masked: maskSecret(value),
          entropy,
        })
      }
      if (match.index === ASSIGNMENT_RE.lastIndex) ASSIGNMENT_RE.lastIndex += 1
      if (findings.length >= maxFindings) break
    }
  }

  findings.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line
    return SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]
  })

  return findings
}

export function summarizeFindings(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const f of findings) {
    if (counts[f.severity] !== undefined) counts[f.severity] += 1
  }
  return counts
}
