// Estimador de custo de nuvem (AWS / GCP / Azure).
// 100% client-side — nenhum dado sai do navegador.
// Preços são valores representativos em USD para comparação de ordem de
// grandeza; sempre confira a tabela oficial do provedor antes de orçar.

/** Mesmo que 30,42 dias × 24h. */
export const HOURS_PER_MONTH = 730

/** Catálogo de serviços e preços unitários em USD. */
export const CATALOG = {
  aws: {
    compute: {
      key: 'compute',
      pricePerHour: 0.05,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
    storage: {
      key: 'storage',
      pricePerGbMonth: 0.023,
      defaultQty: 1,
      defaultGb: 100,
      needsHours: false,
      needsGb: true,
    },
    database: {
      key: 'database',
      pricePerGbMonth: 0.15,
      defaultQty: 1,
      defaultGb: 50,
      needsHours: false,
      needsGb: true,
    },
    bandwidth: {
      key: 'bandwidth',
      pricePerGbMonth: 0.09,
      defaultQty: 1,
      defaultGb: 100,
      needsHours: false,
      needsGb: true,
    },
    loadBalancer: {
      key: 'loadBalancer',
      pricePerHour: 0.025,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
    staticIp: {
      key: 'staticIp',
      pricePerHour: 0.005,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
  },
  gcp: {
    compute: {
      key: 'compute',
      pricePerHour: 0.045,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
    storage: {
      key: 'storage',
      pricePerGbMonth: 0.020,
      defaultQty: 1,
      defaultGb: 100,
      needsHours: false,
      needsGb: true,
    },
    database: {
      key: 'database',
      pricePerGbMonth: 0.14,
      defaultQty: 1,
      defaultGb: 50,
      needsHours: false,
      needsGb: true,
    },
    bandwidth: {
      key: 'bandwidth',
      pricePerGbMonth: 0.12,
      defaultQty: 1,
      defaultGb: 100,
      needsHours: false,
      needsGb: true,
    },
    loadBalancer: {
      key: 'loadBalancer',
      pricePerHour: 0.025,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
    staticIp: {
      key: 'staticIp',
      pricePerHour: 0.004,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
  },
  azure: {
    compute: {
      key: 'compute',
      pricePerHour: 0.06,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
    storage: {
      key: 'storage',
      pricePerGbMonth: 0.021,
      defaultQty: 1,
      defaultGb: 100,
      needsHours: false,
      needsGb: true,
    },
    database: {
      key: 'database',
      pricePerGbMonth: 0.13,
      defaultQty: 1,
      defaultGb: 50,
      needsHours: false,
      needsGb: true,
    },
    bandwidth: {
      key: 'bandwidth',
      pricePerGbMonth: 0.087,
      defaultQty: 1,
      defaultGb: 100,
      needsHours: false,
      needsGb: true,
    },
    loadBalancer: {
      key: 'loadBalancer',
      pricePerHour: 0.03,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
    staticIp: {
      key: 'staticIp',
      pricePerHour: 0.005,
      defaultQty: 1,
      defaultHours: HOURS_PER_MONTH,
      needsHours: true,
      needsGb: false,
    },
  },
}

/**
 * Rótulos bilíngues dos provedores.
 * @param {string} lang - 'pt' | 'en'
 */
export function providerLabels(lang = 'pt') {
  return {
    pt: {
      aws: 'AWS',
      gcp: 'Google Cloud (GCP)',
      azure: 'Microsoft Azure',
    },
    en: {
      aws: 'AWS',
      gcp: 'Google Cloud (GCP)',
      azure: 'Microsoft Azure',
    },
  }[lang]
}

/**
 * Rótulos bilíngues dos serviços.
 * @param {string} lang - 'pt' | 'en'
 */
export function serviceLabels(lang = 'pt') {
  return {
    pt: {
      compute: 'Compute (máquinas virtuais)',
      storage: 'Armazenamento de objetos',
      database: 'Banco de dados gerenciado',
      bandwidth: 'Transferência de dados (egress)',
      loadBalancer: 'Load balancer',
      staticIp: 'IP estático / reservado',
    },
    en: {
      compute: 'Compute (virtual machines)',
      storage: 'Object storage',
      database: 'Managed database',
      bandwidth: 'Data transfer (egress)',
      loadBalancer: 'Load balancer',
      staticIp: 'Static / reserved IP',
    },
  }[lang]
}

/**
 * Cria uma linha de recurso com valores padrão do catálogo.
 * @param {string} provider - 'aws' | 'gcp' | 'azure'
 * @param {string} service - chave do serviço
 * @returns {{ id: string, provider: string, service: string, quantity: number, hours: number, gb: number }}
 */
export function createResource(provider, service) {
  const spec = CATALOG[provider][service]
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    provider,
    service,
    quantity: spec.defaultQty,
    hours: spec.needsHours ? spec.defaultHours : 0,
    gb: spec.needsGb ? spec.defaultGb : 0,
  }
}

/**
 * Calcula o custo mensal de uma única linha de recurso.
 * @param {{ provider: string, service: string, quantity: number, hours: number, gb: number }} resource
 * @returns {{ monthly: number, detail: string }}
 */
export function calculateLineCost(resource) {
  const spec = CATALOG[resource.provider]?.[resource.service]
  if (!spec) return { monthly: 0, detail: '' }

  const qty = Math.max(0, Number(resource.quantity) || 0)
  if (spec.needsHours) {
    const hours = Math.max(0, Number(resource.hours) || 0)
    const pricePerHour = spec.pricePerHour || 0
    const monthly = qty * hours * pricePerHour
    return { monthly, detail: `${qty} × ${hours}h × $${pricePerHour}/h` }
  }

  const gb = Math.max(0, Number(resource.gb) || 0)
  const pricePerGb = spec.pricePerGbMonth || 0
  const monthly = qty * gb * pricePerGb
  return { monthly, detail: `${qty} × ${gb}GB × $${pricePerGb}/GB/mês` }
}

/**
 * Calcula o custo total e os agrupamentos de uma lista de recursos.
 * @param {Array} resources
 * @returns {{
 *   total: number,
 *   lines: Array<{ id: string, monthly: number, detail: string }>,
 *   byProvider: Record<string, number>,
 *   byService: Record<string, number>
 * }}
 */
export function estimateCost(resources) {
  const lines = []
  const byProvider = { aws: 0, gcp: 0, azure: 0 }
  const byService = {}
  let total = 0

  for (const r of resources) {
    const { monthly, detail } = calculateLineCost(r)
    lines.push({ id: r.id, monthly, detail })
    total += monthly
    byProvider[r.provider] = (byProvider[r.provider] || 0) + monthly
    byService[r.service] = (byService[r.service] || 0) + monthly
  }

  return { total, lines, byProvider, byService }
}

/**
 * Formata um valor em dólares.
 * @param {number} value
 * @returns {string}
 */
export function formatUsd(value) {
  if (!Number.isFinite(value)) return '—'
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Cenários rápidos de um clique.
 * @param {string} lang - 'pt' | 'en'
 * @returns {Array<{ key: string, label: string, resources: Array }>}
 */
export function getPresets(lang = 'pt') {
  const labels = {
    pt: {
      smallWeb: 'Site pequeno (AWS)',
      mediumApi: 'API média (GCP)',
      ecommerce: 'E-commerce (Azure)',
      dataPipeline: 'Pipeline de dados (AWS)',
      minimal: 'Site estático mínimo (GCP)',
    },
    en: {
      smallWeb: 'Small website (AWS)',
      mediumApi: 'Medium API (GCP)',
      ecommerce: 'E-commerce (Azure)',
      dataPipeline: 'Data pipeline (AWS)',
      minimal: 'Minimal static site (GCP)',
    },
  }
  const l = labels[lang] || labels.en

  return [
    {
      key: 'smallWeb',
      label: l.smallWeb,
      resources: [
        { id: 'preset-small-1', provider: 'aws', service: 'compute', quantity: 1, hours: HOURS_PER_MONTH, gb: 0 },
        { id: 'preset-small-2', provider: 'aws', service: 'storage', quantity: 1, hours: 0, gb: 50 },
        { id: 'preset-small-3', provider: 'aws', service: 'bandwidth', quantity: 1, hours: 0, gb: 100 },
        { id: 'preset-small-4', provider: 'aws', service: 'loadBalancer', quantity: 1, hours: HOURS_PER_MONTH, gb: 0 },
      ],
    },
    {
      key: 'mediumApi',
      label: l.mediumApi,
      resources: [
        { id: 'preset-medium-1', provider: 'gcp', service: 'compute', quantity: 2, hours: HOURS_PER_MONTH, gb: 0 },
        { id: 'preset-medium-2', provider: 'gcp', service: 'storage', quantity: 1, hours: 0, gb: 200 },
        { id: 'preset-medium-3', provider: 'gcp', service: 'bandwidth', quantity: 1, hours: 0, gb: 500 },
        { id: 'preset-medium-4', provider: 'gcp', service: 'loadBalancer', quantity: 1, hours: HOURS_PER_MONTH, gb: 0 },
        { id: 'preset-medium-5', provider: 'gcp', service: 'database', quantity: 1, hours: 0, gb: 50 },
      ],
    },
    {
      key: 'ecommerce',
      label: l.ecommerce,
      resources: [
        { id: 'preset-ecom-1', provider: 'azure', service: 'compute', quantity: 4, hours: HOURS_PER_MONTH, gb: 0 },
        { id: 'preset-ecom-2', provider: 'azure', service: 'storage', quantity: 1, hours: 0, gb: 1024 },
        { id: 'preset-ecom-3', provider: 'azure', service: 'bandwidth', quantity: 1, hours: 0, gb: 2048 },
        { id: 'preset-ecom-4', provider: 'azure', service: 'loadBalancer', quantity: 2, hours: HOURS_PER_MONTH, gb: 0 },
        { id: 'preset-ecom-5', provider: 'azure', service: 'database', quantity: 1, hours: 0, gb: 200 },
        { id: 'preset-ecom-6', provider: 'azure', service: 'staticIp', quantity: 1, hours: HOURS_PER_MONTH, gb: 0 },
      ],
    },
    {
      key: 'dataPipeline',
      label: l.dataPipeline,
      resources: [
        { id: 'preset-data-1', provider: 'aws', service: 'compute', quantity: 2, hours: HOURS_PER_MONTH, gb: 0 },
        { id: 'preset-data-2', provider: 'aws', service: 'storage', quantity: 1, hours: 0, gb: 5120 },
        { id: 'preset-data-3', provider: 'aws', service: 'bandwidth', quantity: 1, hours: 0, gb: 3072 },
        { id: 'preset-data-4', provider: 'aws', service: 'database', quantity: 1, hours: 0, gb: 1024 },
      ],
    },
    {
      key: 'minimal',
      label: l.minimal,
      resources: [
        { id: 'preset-min-1', provider: 'gcp', service: 'compute', quantity: 1, hours: HOURS_PER_MONTH, gb: 0 },
        { id: 'preset-min-2', provider: 'gcp', service: 'storage', quantity: 1, hours: 0, gb: 10 },
        { id: 'preset-min-3', provider: 'gcp', service: 'bandwidth', quantity: 1, hours: 0, gb: 50 },
      ],
    },
  ]
}
