/**
 * Cálculo de CVSS v3.1 (Base, Temporal e Environmental) 100% client-side.
 *
 * Referência: FIRST — "CVSS v3.1 Specification Document", seção 7
 * (equações e valores das métricas) e "CVSS v3.1 User Guide".
 *
 * Nenhuma requisição é feita: o cálculo inteiro acontece em memória.
 */

// ---------------------------------------------------------------------------
// Definição das métricas (rótulo + valor numérico + descrição)
// ---------------------------------------------------------------------------

// Nomes/descrições bilíngues ficam no util porque as tabelas de referência
// (glossário) e o builder compartilham exatamente a mesma fonte.
const bi = (pt, en) => ({ pt, en })

const AV = {
  key: 'AV',
  name: bi('Vetor de Ataque', 'Attack Vector'),
  question: bi(
    'Como o atacante alcança o componente vulnerável?',
    'How does the attacker reach the vulnerable component?'
  ),
  values: [
    { v: 'N', w: 0.85, name: bi('Rede', 'Network'), desc: bi(
      'O componente está ligado à pilha de rede e o conjunto de atacantes possíveis vai até a Internet inteira — explorável a um ou mais saltos de rede.',
      'The component is bound to the network stack and the set of possible attackers extends beyond the other options up to and including the entire Internet — exploitable one or more network hops away.'
    ) },
    { v: 'A', w: 0.62, name: bi('Adjacente', 'Adjacent'), desc: bi(
      'Ligado à pilha de rede, mas o ataque fica limitado a uma topologia logicamente adjacente: mesma rede física (Bluetooth, Wi-Fi) ou mesma sub-rede / domínio administrativo (VPN, MPLS).',
      'Bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology: same shared physical (Bluetooth, IEEE 802.11) or logical (local subnet) network, or a secure administrative domain (MPLS, VPN).'
    ) },
    { v: 'L', w: 0.55, name: bi('Local', 'Local'), desc: bi(
      'O componente não está ligado à pilha de rede: o atacante precisa de acesso via capacidades de leitura/escrita/execução (console, SSH, sessão local).',
      'The component is not bound to the network stack and the attacker’s path is via read/write/execute capabilities — console, SSH, a local session.'
    ) },
    { v: 'P', w: 0.2, name: bi('Físico', 'Physical'), desc: bi(
      'O ataque exige que o atacante toque ou manipule fisicamente o componente (cold boot, acesso via USB/DMA).',
      'The attack requires the attacker to physically touch or manipulate the vulnerable component (cold boot, USB/DMA access).'
    ) },
  ],
}

const AC = {
  key: 'AC',
  name: bi('Complexidade do Ataque', 'Attack Complexity'),
  question: bi(
    'O ataque depende de condições fora do controle do atacante?',
    'Does the attack depend on conditions beyond the attacker’s control?'
  ),
  values: [
    { v: 'L', w: 0.77, name: bi('Baixa', 'Low'), desc: bi(
      'Não existem condições especiais de acesso: o atacante espera sucesso repetível.',
      'Specialized access conditions do not exist — the attacker can expect repeatable success.'
    ) },
    { v: 'H', w: 0.44, name: bi('Alta', 'High'), desc: bi(
      'O sucesso depende de esforço mensurável: coletar informações do alvo, vencer race condition, explorar mitigação avançada ou fazer man-in-the-middle.',
      'A successful attack depends on measurable effort: gathering target details, winning a race condition, defeating advanced mitigations, or man-in-the-middle.'
    ) },
  ],
}

const PR = {
  key: 'PR',
  name: bi('Privilégios Requeridos', 'Privileges Required'),
  question: bi(
    'Que privilégios o atacante precisa ter antes de explorar?',
    'Which privileges must the attacker hold before exploiting?'
  ),
  // O peso de Low/High muda conforme o escopo (U ou C) — ver weightOf().
  weights: { N: 0.85, L: { U: 0.62, C: 0.68 }, H: { U: 0.27, C: 0.5 } },
  values: [
    { v: 'N', name: bi('Nenhum', 'None'), desc: bi(
      'O atacante não é autorizado antes do ataque e não precisa de acesso a configurações ou arquivos do sistema.',
      'The attacker is unauthorized prior to the attack and needs no access to settings or files of the vulnerable system.'
    ) },
    { v: 'L', name: bi('Baixo', 'Low'), desc: bi(
      'Privilégios de usuário comum, que em geral só afetam arquivos/configurações do próprio usuário ou recursos não sensíveis.',
      'Basic user capabilities that could normally affect only settings and files owned by a user, or access to non-sensitive resources.'
    ) },
    { v: 'H', name: bi('Alto', 'High'), desc: bi(
      'Privilégios de controle significativo (administrativo) sobre o componente, com acesso a todas as suas configurações e arquivos.',
      'Significant (administrative) control over the vulnerable component, allowing access to component-wide settings and files.'
    ) },
  ],
}

const UI = {
  key: 'UI',
  name: bi('Interação do Usuário', 'User Interaction'),
  question: bi(
    'Alguma pessoa além do atacante precisa participar?',
    'Must a human other than the attacker participate in the compromise?'
  ),
  values: [
    { v: 'N', w: 0.85, name: bi('Nenhuma', 'None'), desc: bi(
      'O sistema pode ser explorado sem interação de nenhum usuário.',
      'The vulnerable system can be exploited without interaction from any user.'
    ) },
    { v: 'R', w: 0.62, name: bi('Obrigatória', 'Required'), desc: bi(
      'A exploração exige que um usuário execute alguma ação antes (abrir um documento, instalar um pacote, clicar num link).',
      'Successful exploitation requires a user to take some action first — opening a document, installing a package, clicking a link.'
    ) },
  ],
}

const S = {
  key: 'S',
  name: bi('Escopo', 'Scope'),
  question: bi(
    'O impacto ultrapassa a fronteira de segurança do componente?',
    'Does the impact cross the component’s security authority boundary?'
  ),
  values: [
    { v: 'U', name: bi('Inalterado', 'Unchanged'), desc: bi(
      'O impacto fica nos recursos geridos pela mesma autoridade de segurança (mesmo componente ou mesmo sandbox/SOA).',
      'The impact stays on resources managed by the same security authority — the vulnerable component and the impacted one share the same authority.'
    ) },
    { v: 'C', name: bi('Alterado', 'Changed'), desc: bi(
      'O impacto atinge recursos fora do escopo do componente — uma aplicação web que consegue ler arquivos do sistema operacional conta como mudança de escopo.',
      'The impact reaches resources beyond the component’s security scope — e.g. a web app that can read OS files is scored as a scope change.'
    ) },
  ],
}

const CIA = (key, namePt, nameEn, descPt, descEn) => ({
  key,
  name: bi(namePt, nameEn),
  question: bi(descPt, descEn),
  values: [
    { v: 'H', w: 0.56, name: bi('Alto', 'High') },
    { v: 'L', w: 0.22, name: bi('Baixo', 'Low') },
    { v: 'N', w: 0, name: bi('Nenhum', 'None') },
  ],
})

const C = CIA(
  'C', 'Confidencialidade', 'Confidentiality',
  'Quanto o atacante consegue ler de informação restrita?',
  'How much restricted information can the attacker read?'
)
C.values[0].desc = bi(
  'Perda total de confidencialidade: todos os recursos são revelados, ou o vazamento tem impacto direto e grave (senha de admin, chave privada).',
  'Total loss of confidentiality — all resources disclosed, or the leak has a direct, serious impact (admin password, private key).'
)
C.values[1].desc = bi(
  'Alguma perda de confidencialidade, sem controle sobre o que é obtido e sem consequência direta e grave.',
  'Some loss of confidentiality, without control over what is obtained and without a direct, serious consequence.'
)
C.values[2].desc = bi(
  'Nenhuma perda de confidencialidade no componente impactado.',
  'No loss of confidentiality within the impacted component.'
)

const I = CIA(
  'I', 'Integridade', 'Integrity',
  'O que o atacante consegue alterar no componente?',
  'What can the attacker modify in the component?'
)
I.values[0].desc = bi(
  'Perda total de integridade: o atacante modifica qualquer arquivo protegido, ou a modificação tem consequência direta e grave.',
  'Total loss of integrity — the attacker can modify any protected file, or the modification has a direct, serious consequence.'
)
I.values[1].desc = bi(
  'É possível modificar dados, mas sem controle sobre a consequência ou com volume limitado.',
  'Data can be modified, but without control over the consequence or with limited scope.'
)
I.values[2].desc = bi(
  'Nenhuma perda de integridade no componente impactado.',
  'No loss of integrity within the impacted component.'
)

const A = CIA(
  'A', 'Disponibilidade', 'Availability',
  'O que o atacante consegue tirar do ar?',
  'What can the attacker take down?'
)
A.values[0].desc = bi(
  'Perda total de disponibilidade: negação completa de serviço, sustentada ou persistente (ou negação parcial com impacto direto e grave).',
  'Total loss of availability — complete denial of service, sustained or persistent, or partial denial with a direct, serious consequence.'
)
A.values[1].desc = bi(
  'Desempenho reduzido ou interrupções: não há negação completa de serviço para usuários legítimos.',
  'Reduced performance or interruptions, without complete denial of service for legitimate users.'
)
A.values[2].desc = bi(
  'Nenhum impacto na disponibilidade do componente impactado.',
  'No impact on availability within the impacted component.'
)

export const BASE_METRICS = [AV, AC, PR, UI, S, C, I, A]
export const TEMPORAL_METRICS = [
  {
    key: 'E',
    name: bi('Maturidade do Exploit', 'Exploit Code Maturity'),
    question: bi(
      'Existe código de exploração disponível?',
      'Is exploit code available?'
    ),
    values: [
      { v: 'X', w: 1, name: bi('Não definido', 'Not Defined') },
      { v: 'U', w: 0.91, name: bi('Não comprovado', 'Unproven') },
      { v: 'P', w: 0.94, name: bi('Prova de conceito', 'Proof-of-Concept') },
      { v: 'F', w: 0.97, name: bi('Funcional', 'Functional') },
      { v: 'H', w: 1, name: bi('Alto', 'High') },
    ],
  },
  {
    key: 'RL',
    name: bi('Nível de Correção', 'Remediation Level'),
    question: bi(
      'Qual é a melhor correção disponível hoje?',
      'What is the best remediation available today?'
    ),
    values: [
      { v: 'X', w: 1, name: bi('Não definido', 'Not Defined') },
      { v: 'O', w: 0.95, name: bi('Correção oficial', 'Official Fix') },
      { v: 'T', w: 0.96, name: bi('Correção temporária', 'Temporary Fix') },
      { v: 'W', w: 0.97, name: bi('Workaround', 'Workaround') },
      { v: 'U', w: 1, name: bi('Indisponível', 'Unavailable') },
    ],
  },
  {
    key: 'RC',
    name: bi('Confiança no Relato', 'Report Confidence'),
    question: bi(
      'Quão confiável é a descrição da vulnerabilidade?',
      'How trustworthy is the vulnerability description?'
    ),
    values: [
      { v: 'X', w: 1, name: bi('Não definido', 'Not Defined') },
      { v: 'U', w: 0.92, name: bi('Desconhecida', 'Unknown') },
      { v: 'R', w: 0.96, name: bi('Razoável', 'Reasonable') },
      { v: 'C', w: 1, name: bi('Confirmada', 'Confirmed') },
    ],
  },
]

const REQUIREMENT = (key, namePt, nameEn) => ({
  key,
  name: bi(namePt, nameEn),
  values: [
    { v: 'X', w: 1, name: bi('Não definido', 'Not Defined') },
    { v: 'H', w: 1.5, name: bi('Alto', 'High') },
    { v: 'M', w: 1, name: bi('Médio', 'Medium') },
    { v: 'L', w: 0.5, name: bi('Baixo', 'Low') },
  ],
})

export const ENV_METRICS = [
  REQUIREMENT('CR', 'Requisito de Confidencialidade', 'Confidentiality Requirement'),
  REQUIREMENT('IR', 'Requisito de Integridade', 'Integrity Requirement'),
  REQUIREMENT('AR', 'Requisito de Disponibilidade', 'Availability Requirement'),
]

// Métricas "Modified": sobrescrevem as métricas Base do mesmo grupo.
// 'X' = não definido (usa o valor Base).
export const MODIFIED_METRICS = [
  { key: 'MAV', base: 'AV', name: bi('Vetor de Ataque Modificado', 'Modified Attack Vector') },
  { key: 'MAC', base: 'AC', name: bi('Complexidade Modificada', 'Modified Attack Complexity') },
  { key: 'MPR', base: 'PR', name: bi('Privilégios Modificados', 'Modified Privileges Required') },
  { key: 'MUI', base: 'UI', name: bi('Interação Modificada', 'Modified User Interaction') },
  { key: 'MS', base: 'S', name: bi('Escopo Modificado', 'Modified Scope') },
  { key: 'MC', base: 'C', name: bi('Confidencialidade Modificada', 'Modified Confidentiality') },
  { key: 'MI', base: 'I', name: bi('Integridade Modificada', 'Modified Integrity') },
  { key: 'MA', base: 'A', name: bi('Disponibilidade Modificada', 'Modified Availability') },
]

const BY_KEY = {}
for (const m of [...BASE_METRICS, ...TEMPORAL_METRICS, ...ENV_METRICS, ...MODIFIED_METRICS]) {
  BY_KEY[m.key] = m
}
for (const m of MODIFIED_METRICS) {
  const source = BY_KEY[m.base]
  BY_KEY[m.key] = { ...source, key: m.key, base: m.base, name: m.name }
}

export const ALL_METRIC_KEYS = Object.keys(BY_KEY)

export const DEFAULT_METRICS = {
  AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H',
  E: 'X', RL: 'X', RC: 'X',
  CR: 'X', IR: 'X', AR: 'X',
  MAV: 'X', MAC: 'X', MPR: 'X', MUI: 'X', MS: 'X', MC: 'X', MI: 'X', MA: 'X',
}

export function getMetric(key) {
  return BY_KEY[key]
}

export function isValidValue(key, value) {
  const metric = BY_KEY[key]
  return !!metric && metric.values.some((item) => item.v === value)
}

const prWeight = (value, scope) => {
  if (value === 'N') return 0.85
  return value === 'L'
    ? (scope === 'C' ? 0.68 : 0.62)
    : (scope === 'C' ? 0.5 : 0.27)
}

/**
 * Valor numérico de uma métrica, respeitando a dependência de PR/MPR no escopo.
 * 'X' (não definido) tem peso 1 nas métricas Temporais e de Requisito — no
 * grupo Modified quem resolve o 'X' é `resolve()`, usando o valor Base.
 */
export function weightOf(key, value, scope) {
  const metric = BY_KEY[key]
  const found = metric.values.find((item) => item.v === value)
  if (!found) return null
  if (found.w !== undefined) return found.w
  if (metric.weights) {
    const raw = metric.weights[value]
    return typeof raw === 'number' ? raw : prWeight(value, scope)
  }
  return null
}

/**
 * Roundup da spec (§7 / Appendix A): menor número com 1 casa decimal
 * maior ou igual à entrada, calculado com aritmética inteira para evitar
 * os desvios de ponto flutuante que separavam o v3.0 do v3.1.
 */
export function roundup(input) {
  if (!Number.isFinite(input)) return 0
  const intInput = Math.round(input * 100000)
  if (intInput % 10000 === 0) return intInput / 100000
  return (Math.floor(intInput / 10000) + 1) / 10
}

// ---------------------------------------------------------------------------
// Vetor
// ---------------------------------------------------------------------------

const ORDER = [
  'AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A',
  'E', 'RL', 'RC',
  'CR', 'IR', 'AR',
  'MAV', 'MAC', 'MPR', 'MUI', 'MS', 'MC', 'MI', 'MA',
]

/** Monta a string de vetor omitindo métricas não definidas (X). */
export function buildVector(metrics, version = '3.1') {
  const parts = ORDER
    .filter((key) => metrics[key] && metrics[key] !== 'X')
    .map((key) => `${key}:${metrics[key]}`)
  return `CVSS:${version}/${parts.join('/')}`
}

/**
 * Faz o parse de uma string de vetor CVSS v3.x. Em vez de falhar, devolve o
 * que deu pra interpretar + a lista de problemas (a página mostra ambos).
 * @returns {{ version: string, metrics: object, errors: string[], extensions: string[] }}
 */
export function parseVector(input) {
  const errors = []
  const extensions = []
  const metrics = { ...DEFAULT_METRICS }
  const raw = String(input || '').trim()
  if (!raw) {
    return { version: '3.1', metrics, errors: ['empty'], extensions }
  }

  let body = raw.replace(/^CVSS:/i, '')
  let version = '3.1'
  const versionMatch = body.match(/^(3\.[01])\//)
  if (versionMatch) {
    version = versionMatch[1]
    body = body.slice(versionMatch[0].length)
  } else if (/^\d+\.\d+\//.test(body)) {
    errors.push('version')
  }

  const seen = new Set()
  let template = false
  for (const chunk of body.split('/')) {
    const token = chunk.trim()
    if (!token) continue
    const [rawKey, rawValue] = token.split(':')
    const key = String(rawKey || '').toUpperCase()
    const value = String(rawValue || '').toUpperCase()

    // Blocos EXT:n.n de extensões (ex.: PRIV) não entram no cálculo padrão.
    if (key.startsWith('EXT')) {
      extensions.push(token)
      continue
    }
    if (!key || !value) {
      errors.push(`malformed:${token}`)
      continue
    }
    if (!BY_KEY[key]) {
      errors.push(`unknown:${key}`)
      continue
    }
    if (!isValidValue(key, value)) {
      // Metricas Base não têm "não definido" — X indica vetor-modelo.
      if (value === 'X') template = true
      errors.push(`invalid:${key}:${value}`)
      continue
    }
    if (seen.has(key)) errors.push(`duplicate:${key}`)
    seen.add(key)
    metrics[key] = value
  }

  if (template) errors.push('template')
  const missing = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'].filter((key) => !seen.has(key))
  if (missing.length) errors.push(`missing:${missing.join(',')}`)

  return { version, metrics, errors, extensions }
}

// ---------------------------------------------------------------------------
// Cálculo
// ---------------------------------------------------------------------------

const impactSubscore = (c, i, a) => 1 - (1 - c) * (1 - i) * (1 - a)

const impactOf = (scope, iss) => (
  scope === 'C'
    ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    : 6.42 * iss
)

// v3.1 mudou o termo exponencial do ModifiedImpact (expoente 13 e o fator
// 0.9731) — é exatamente o que corrigiu o comportamento contra-intuitivo do v3.0.
const modifiedImpactOf = (scope, miss) => (
  scope === 'C'
    ? 7.52 * (miss - 0.029) - 3.25 * Math.pow(miss * 0.9731 - 0.02, 13)
    : 6.42 * miss
)

const severityKey = (score) => {
  if (score <= 0) return 'none'
  if (score < 4) return 'low'
  if (score < 7) return 'medium'
  if (score < 9) return 'high'
  return 'critical'
}

export const SEVERITY_RATINGS = [
  { key: 'none', min: 0, max: 0, color: '#8c8c8c' },
  { key: 'low', min: 0.1, max: 3.9, color: '#52c41a' },
  { key: 'medium', min: 4, max: 6.9, color: '#faad14' },
  { key: 'high', min: 7, max: 8.9, color: '#fa8c16' },
  { key: 'critical', min: 9, max: 10, color: '#cf1322' },
]

export function severityRating(score) {
  const found = SEVERITY_RATINGS.find((band) => severityKey(score) === band.key)
  return found || SEVERITY_RATINGS[0]
}

const fmt = (value, digits = 4) => {
  if (!Number.isFinite(value)) return '0'
  const rounded = Number(value.toFixed(digits))
  return String(rounded)
}

// Aceita a base já formatada em texto — não formatar de novo, senão o
// Number.isFinite() do fmt() engoliria o valor e viraria "0".
const powText = (base, exponent) => `${base}^${exponent}`

/**
 * Calcula Base, Temporal e Environmental.
 * @param {object} metrics métricas no formato aceito por buildVector()
 */
export function computeCvss(metrics) {
  const m = { ...DEFAULT_METRICS, ...metrics }

  // --- Base (§7.1) ---
  const scope = m.S
  const av = weightOf('AV', m.AV, scope)
  const ac = weightOf('AC', m.AC, scope)
  const pr = weightOf('PR', m.PR, scope)
  const ui = weightOf('UI', m.UI, scope)
  const c = weightOf('C', m.C, scope)
  const i = weightOf('I', m.I, scope)
  const a = weightOf('A', m.A, scope)

  const iss = impactSubscore(c, i, a)
  const impact = impactOf(scope, iss)
  const exploitability = 8.22 * av * ac * pr * ui
  const baseRaw = Math.min(impact + exploitability, 10)
  const baseScore = impact <= 0 ? 0 : roundup(scope === 'C' ? Math.min(1.08 * baseRaw, 10) : baseRaw)

  const baseSteps = [
    {
      id: 'iss',
      formula: 'ISS = 1 − ((1−C) × (1−I) × (1−A))',
      substitution: `1 − ((1−${fmt(c)}) × (1−${fmt(i)}) × (1−${fmt(a)}))`,
      value: fmt(iss),
    },
    scope === 'C'
      ? {
        id: 'impact',
        formula: 'Impact = 7.52 × (ISS − 0.029) − 3.25 × (ISS − 0.02)^15',
        substitution: `7.52 × (${fmt(iss)} − 0.029) − 3.25 × ${powText(fmt(iss - 0.02), 15)}`,
        value: fmt(impact),
      }
      : {
        id: 'impact',
        formula: 'Impact = 6.42 × ISS',
        substitution: `6.42 × ${fmt(iss)}`,
        value: fmt(impact),
      },
    {
      id: 'exploitability',
      formula: 'Exploitability = 8.22 × AV × AC × PR × UI',
      substitution: `8.22 × ${fmt(av)} × ${fmt(ac)} × ${fmt(pr)} × ${fmt(ui)}`,
      value: fmt(exploitability),
    },
    {
      id: 'base',
      formula: scope === 'C'
        ? 'BaseScore = Roundup(Min(1.08 × (Impact + Exploitability), 10))'
        : 'BaseScore = Roundup(Min(Impact + Exploitability, 10))',
      substitution: `Roundup(Min(${fmt(scope === 'C' ? 1.08 * baseRaw : baseRaw)}, 10))`,
      value: baseScore.toFixed(1),
    },
  ]

  // --- Temporal (§7.2) ---
  const e = weightOf('E', m.E)
  const rl = weightOf('RL', m.RL)
  const rc = weightOf('RC', m.RC)
  const timeWeight = e * rl * rc
  const temporalScore = roundup(baseScore * timeWeight)

  // --- Environmental (§7.3) ---
  const resolved = {}
  for (const def of MODIFIED_METRICS) {
    resolved[def.key] = m[def.key] === 'X' ? m[def.base] : m[def.key]
  }
  const modifiedScope = resolved.MS
  const cr = weightOf('CR', m.CR)
  const ir = weightOf('IR', m.IR)
  const ar = weightOf('AR', m.AR)

  const miss = Math.min(
    1 - (1 - cr * weightOf('MC', resolved.MC)) * (1 - ir * weightOf('MI', resolved.MI)) * (1 - ar * weightOf('MA', resolved.MA)),
    0.915
  )
  const modifiedImpact = modifiedImpactOf(modifiedScope, miss)
  const modifiedExploitability = 8.22
    * weightOf('MAV', resolved.MAV, modifiedScope)
    * weightOf('MAC', resolved.MAC, modifiedScope)
    * weightOf('MPR', resolved.MPR, modifiedScope)
    * weightOf('MUI', resolved.MUI, modifiedScope)

  const envSum = modifiedImpact <= 0
    ? 0
    : (modifiedScope === 'C'
      ? Math.min(1.08 * (modifiedImpact + modifiedExploitability), 10)
      : Math.min(modifiedImpact + modifiedExploitability, 10))
  const environmentalBase = modifiedImpact <= 0 ? 0 : roundup(envSum)
  const environmentalScore = modifiedImpact <= 0
    ? 0
    : roundup(environmentalBase * timeWeight)

  const envSteps = [
    {
      id: 'miss',
      formula: 'MISS = Min(1 − ((1−CR×MC) × (1−IR×MI) × (1−AR×MA)), 0.915)',
      substitution: `Min(1 − ((1−${fmt(cr)}×${fmt(weightOf('MC', resolved.MC))}) × (1−${fmt(ir)}×${fmt(weightOf('MI', resolved.MI))}) × (1−${fmt(ar)}×${fmt(weightOf('MA', resolved.MA))})), 0.915)`,
      value: fmt(miss),
    },
    modifiedScope === 'C'
      ? {
        id: 'impact',
        formula: 'ModifiedImpact = 7.52 × (MISS − 0.029) − 3.25 × (MISS × 0.9731 − 0.02)^13',
        substitution: `7.52 × (${fmt(miss)} − 0.029) − 3.25 × ${powText(fmt(miss * 0.9731 - 0.02), 13)}`,
        value: fmt(modifiedImpact),
      }
      : {
        id: 'impact',
        formula: 'ModifiedImpact = 6.42 × MISS',
        substitution: `6.42 × ${fmt(miss)}`,
        value: fmt(modifiedImpact),
      },
    {
      id: 'exploitability',
      formula: 'ModifiedExploitability = 8.22 × MAV × MAC × MPR × MUI',
      substitution: `8.22 × ${fmt(weightOf('MAV', resolved.MAV, modifiedScope))} × ${fmt(weightOf('MAC', resolved.MAC, modifiedScope))} × ${fmt(weightOf('MPR', resolved.MPR, modifiedScope))} × ${fmt(weightOf('MUI', resolved.MUI, modifiedScope))}`,
      value: fmt(modifiedExploitability),
    },
    {
      id: 'env-base',
      formula: modifiedScope === 'C'
        ? 'EnvironmentalBase = Roundup(Roundup(Min(1.08 × (ModifiedImpact + ModifiedExploitability), 10)) × E × RL × RC)'
        : 'EnvironmentalBase = Roundup(Roundup(Min(ModifiedImpact + ModifiedExploitability, 10)) × E × RL × RC)',
      substitution: `Roundup(Roundup(Min(${fmt(modifiedScope === 'C' ? 1.08 * (modifiedImpact + modifiedExploitability) : modifiedImpact + modifiedExploitability)}, 10)) × ${fmt(e)} × ${fmt(rl)} × ${fmt(rc)})`,
      value: environmentalBase.toFixed(1),
    },
  ]

  const temporalSteps = [
    {
      id: 'time-weight',
      formula: 'TimeWeight = E × RL × RC',
      substitution: `${fmt(e)} × ${fmt(rl)} × ${fmt(rc)}`,
      value: fmt(timeWeight),
    },
    {
      id: 'temporal',
      formula: 'TemporalScore = Roundup(BaseScore × TimeWeight)',
      substitution: `Roundup(${baseScore.toFixed(1)} × ${fmt(timeWeight)})`,
      value: temporalScore.toFixed(1),
    },
  ]

  const environmentalDefined = m.CR !== 'X' || m.IR !== 'X' || m.AR !== 'X'
    || MODIFIED_METRICS.some((def) => m[def.key] !== 'X')
  const temporalDefined = m.E !== 'X' || m.RL !== 'X' || m.RC !== 'X'

  return {
    metrics: m,
    resolved,
    scores: {
      base: baseScore,
      temporal: temporalScore,
      environmental: environmentalScore,
    },
    severity: {
      base: severityRating(baseScore),
      temporal: severityRating(temporalScore),
      environmental: severityRating(environmentalScore),
    },
    base: { iss, impact, exploitability, score: baseScore, steps: baseSteps },
    temporal: { timeWeight, score: temporalScore, steps: temporalSteps, defined: temporalDefined },
    environmental: {
      miss,
      modifiedImpact,
      modifiedExploitability,
      score: environmentalScore,
      steps: envSteps,
      defined: environmentalDefined,
    },
  }
}

/** Exporta o resultado no formato JSON do schema de vetores do CVSS v3.1. */
export function toCvssJson(metrics, version = '3.1', result) {
  const computed = result || computeCvss(metrics)
  return JSON.stringify({
    version,
    vectorString: buildVector(metrics, version),
    baseScore: computed.scores.base,
    baseSeverity: computed.severity.base.key.toUpperCase(),
    ...(computed.temporal.defined
      ? { temporalScore: computed.scores.temporal, temporalSeverity: computed.severity.temporal.key.toUpperCase() }
      : {}),
    ...(computed.environmental.defined
      ? { environmentalScore: computed.scores.environmental, environmentalSeverity: computed.severity.environmental.key.toUpperCase() }
      : {}),
  }, null, 2)
}

/** Referência rápida das faixas de severidade (section 5 da spec). */
export function severityBands() {
  return SEVERITY_BANDS
}

const SEVERITY_BANDS = SEVERITY_RATINGS.map((band) => ({
  key: band.key,
  color: band.color,
  range: band.min === band.max
    ? `${band.min.toFixed(1)}`
    : `${band.min.toFixed(1)} – ${band.max.toFixed(1)}`,
}))