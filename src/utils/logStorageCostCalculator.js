/**
 * Calculadora de Custo de Armazenamento de Logs — 100% client-side.
 *
 * Estima o custo mensal/anual de armazenar logs considerando:
 *   - volume bruto ingerido por dia (GB)
 *   - retenção em dias
 *   - taxa de compressão (fração do original, ex.: 0.2 = 20%)
 *   - custo de ingestão por GB
 *   - custo de armazenamento por GB/mês
 *   - custo opcional de consulta (GB escaneados por dia)
 *
 * Cálculos:
 *   dailyCompressed = dailyRaw * compressionRatio
 *   storedGB        = dailyCompressed * retentionDays
 *   monthlyIngest   = dailyRaw * 30 * ingestCostPerGB
 *   monthlyStorage  = storedGB * storageCostPerGBMonth
 *   monthlyScan     = scannedGBPerDay * 30 * scanCostPerGB
 */

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatCurrency(value, digits = 2) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function calculateLogStorageCost({
  dailyRawGB,
  retentionDays,
  compressionRatio,
  ingestCostPerGB,
  storageCostPerGBMonth,
  scanCostPerGB,
  scannedGBPerDay,
}) {
  const raw = Math.max(0, Number(dailyRawGB) || 0)
  const retention = Math.max(0, Number(retentionDays) || 0)
  const compression = Math.max(0, Math.min(1, Number(compressionRatio || 0)))
  const ingest = Math.max(0, Number(ingestCostPerGB) || 0)
  const storage = Math.max(0, Number(storageCostPerGBMonth) || 0)
  const scan = Math.max(0, Number(scanCostPerGB) || 0)
  const scanned = Math.max(0, Number(scannedGBPerDay) || 0)

  const dailyCompressedGB = raw * compression
  const storedGB = dailyCompressedGB * retention
  const monthlyRawGB = raw * 30
  const monthlyIngestCost = monthlyRawGB * ingest
  const monthlyStorageCost = storedGB * storage
  const monthlyScanCost = scanned * 30 * scan
  const monthlyTotal = monthlyIngestCost + monthlyStorageCost + monthlyScanCost
  const yearlyTotal = monthlyTotal * 12
  const costPerDay = monthlyTotal / 30
  const costPerGBIngested = monthlyRawGB > 0 ? monthlyTotal / monthlyRawGB : 0

  return {
    dailyRawGB: raw,
    retentionDays: retention,
    compressionRatio: compression,
    ingestCostPerGB: ingest,
    storageCostPerGBMonth: storage,
    scanCostPerGB: scan,
    scannedGBPerDay: scanned,
    dailyCompressedGB,
    storedGB,
    monthlyRawGB,
    monthlyIngestCost,
    monthlyStorageCost,
    monthlyScanCost,
    monthlyTotal,
    yearlyTotal,
    costPerDay,
    costPerGBIngested,
  }
}

export function getPresets(lang = 'pt') {
  const data = [
    {
      key: 'cloudwatch',
      pt: {
        label: 'AWS CloudWatch Logs',
        desc: 'Ingestão $0.50/GB, armazenamento $0.03/GB/mês, scans $0.005/GB',
      },
      en: {
        label: 'AWS CloudWatch Logs',
        desc: 'Ingest $0.50/GB, storage $0.03/GB/mo, scans $0.005/GB',
      },
      dailyRawGB: 50,
      retentionDays: 30,
      compressionRatio: 0.18,
      ingestCostPerGB: 0.5,
      storageCostPerGBMonth: 0.03,
      scanCostPerGB: 0.005,
      scannedGBPerDay: 100,
    },
    {
      key: 'datadog',
      pt: {
        label: 'Datadog Logs',
        desc: 'Ingestão $1.70/GB, retenção 15 dias, compressão ~15%',
      },
      en: {
        label: 'Datadog Logs',
        desc: 'Ingest $1.70/GB, 15-day retention, ~15% compression',
      },
      dailyRawGB: 30,
      retentionDays: 15,
      compressionRatio: 0.15,
      ingestCostPerGB: 1.7,
      storageCostPerGBMonth: 0,
      scanCostPerGB: 0,
      scannedGBPerDay: 0,
    },
    {
      key: 'splunk',
      pt: {
        label: 'Splunk Cloud',
        desc: 'Ingestão $1.00/GB, armazenamento embutido, compressão ~25%',
      },
      en: {
        label: 'Splunk Cloud',
        desc: 'Ingest $1.00/GB, storage included, ~25% compression',
      },
      dailyRawGB: 40,
      retentionDays: 90,
      compressionRatio: 0.25,
      ingestCostPerGB: 1.0,
      storageCostPerGBMonth: 0,
      scanCostPerGB: 0,
      scannedGBPerDay: 0,
    },
    {
      key: 'elastic',
      pt: {
        label: 'Elastic Cloud',
        desc: 'Ingestão $0.02/GB (aprox.), armazenamento $0.10/GB/mês',
      },
      en: {
        label: 'Elastic Cloud',
        desc: 'Ingest ~$0.02/GB, storage $0.10/GB/mo',
      },
      dailyRawGB: 100,
      retentionDays: 14,
      compressionRatio: 0.5,
      ingestCostPerGB: 0.02,
      storageCostPerGBMonth: 0.1,
      scanCostPerGB: 0,
      scannedGBPerDay: 0,
    },
    {
      key: 'loki',
      pt: {
        label: 'Grafana Loki (auto-hospedado)',
        desc: 'Somente custo de storage S3 $0.023/GB/mês, compressão ~10%',
      },
      en: {
        label: 'Grafana Loki (self-hosted)',
        desc: 'S3 storage only $0.023/GB/mo, ~10% compression',
      },
      dailyRawGB: 200,
      retentionDays: 30,
      compressionRatio: 0.1,
      ingestCostPerGB: 0,
      storageCostPerGBMonth: 0.023,
      scanCostPerGB: 0,
      scannedGBPerDay: 0,
    },
    {
      key: 'custom',
      pt: {
        label: 'Customizado',
        desc: 'Valores genéricos para você ajustar',
      },
      en: {
        label: 'Custom',
        desc: 'Generic values for you to adjust',
      },
      dailyRawGB: 10,
      retentionDays: 30,
      compressionRatio: 0.2,
      ingestCostPerGB: 0.5,
      storageCostPerGBMonth: 0.03,
      scanCostPerGB: 0,
      scannedGBPerDay: 0,
    },
  ]

  return data.map((item) => ({
    key: item.key,
    label: item[lang].label,
    desc: item[lang].desc,
    dailyRawGB: item.dailyRawGB,
    retentionDays: item.retentionDays,
    compressionRatio: item.compressionRatio,
    ingestCostPerGB: item.ingestCostPerGB,
    storageCostPerGBMonth: item.storageCostPerGBMonth,
    scanCostPerGB: item.scanCostPerGB,
    scannedGBPerDay: item.scannedGBPerDay,
  }))
}

export function buildProjection(result, months = 12) {
  const rows = []
  for (let m = 1; m <= months; m++) {
    const ingest = result.monthlyIngestCost * m
    const storage = result.monthlyStorageCost * m
    const scan = result.monthlyScanCost * m
    rows.push({
      month: m,
      ingestCost: ingest,
      storageCost: storage,
      scanCost: scan,
      totalCost: ingest + storage + scan,
      cumulativeStorageGB: result.dailyCompressedGB * 30 * m,
    })
  }
  return rows
}

export function buildReport(result, lang = 'pt') {
  const t = {
    pt: {
      title: 'Relatório de Custo de Armazenamento de Logs',
      summary: 'Resumo',
      dailyRawGB: 'Volume bruto por dia',
      dailyCompressedGB: 'Volume comprimido por dia',
      retentionDays: 'Dias de retenção',
      storedGB: 'Volume armazenado no pico',
      monthlyIngestCost: 'Custo mensal de ingestão',
      monthlyStorageCost: 'Custo mensal de armazenamento',
      monthlyScanCost: 'Custo mensal de consulta',
      monthlyTotal: 'Custo total mensal',
      yearlyTotal: 'Custo total anual',
      costPerDay: 'Custo médio por dia',
      costPerGBIngested: 'Custo por GB ingerido',
      projection: 'Projeção mensal',
      month: 'Mês',
      ingest: 'Ingestão',
      storage: 'Armazenamento',
      scan: 'Consulta',
      total: 'Total',
      cumulativeStorage: 'Storage acumulado',
      notes: 'Notas',
      notesText:
        'Preços são estimativas aproximadas. Verifique as tabelas de preços oficiais do provedor para valores exatos e descontos por volume.',
    },
    en: {
      title: 'Log Storage Cost Report',
      summary: 'Summary',
      dailyRawGB: 'Daily raw volume',
      dailyCompressedGB: 'Daily compressed volume',
      retentionDays: 'Retention days',
      storedGB: 'Peak stored volume',
      monthlyIngestCost: 'Monthly ingest cost',
      monthlyStorageCost: 'Monthly storage cost',
      monthlyScanCost: 'Monthly query cost',
      monthlyTotal: 'Monthly total cost',
      yearlyTotal: 'Yearly total cost',
      costPerDay: 'Average daily cost',
      costPerGBIngested: 'Cost per GB ingested',
      projection: 'Monthly projection',
      month: 'Month',
      ingest: 'Ingest',
      storage: 'Storage',
      scan: 'Scan',
      total: 'Total',
      cumulativeStorage: 'Cumulative storage',
      notes: 'Notes',
      notesText:
        'Prices are rough estimates. Check the official provider pricing pages for exact values and volume discounts.',
    },
  }[lang]

  const lines = [
    `# ${t.title}`,
    '',
    `## ${t.summary}`,
    '',
    `- ${t.dailyRawGB}: ${formatNumber(result.dailyRawGB, 2)} GB`,
    `- ${t.dailyCompressedGB}: ${formatNumber(result.dailyCompressedGB, 2)} GB`,
    `- ${t.retentionDays}: ${formatNumber(result.retentionDays, 0)}`,
    `- ${t.storedGB}: ${formatNumber(result.storedGB, 2)} GB`,
    `- ${t.monthlyIngestCost}: ${formatCurrency(result.monthlyIngestCost)}`,
    `- ${t.monthlyStorageCost}: ${formatCurrency(result.monthlyStorageCost)}`,
    `- ${t.monthlyScanCost}: ${formatCurrency(result.monthlyScanCost)}`,
    `- ${t.monthlyTotal}: ${formatCurrency(result.monthlyTotal)}`,
    `- ${t.yearlyTotal}: ${formatCurrency(result.yearlyTotal)}`,
    `- ${t.costPerDay}: ${formatCurrency(result.costPerDay)}`,
    `- ${t.costPerGBIngested}: ${formatCurrency(result.costPerGBIngested)}`,
    '',
    `## ${t.projection}`,
    '',
    `| ${t.month} | ${t.ingest} | ${t.storage} | ${t.scan} | ${t.total} | ${t.cumulativeStorage} |`,
    '| --- | --- | --- | --- | --- | --- |',
  ]

  buildProjection(result, 12).forEach((row) => {
    lines.push(
      `| ${row.month} | ${formatCurrency(row.ingestCost)} | ${formatCurrency(row.storageCost)} | ${formatCurrency(row.scanCost)} | ${formatCurrency(row.totalCost)} | ${formatNumber(row.cumulativeStorageGB, 0)} GB |`
    )
  })

  lines.push('', `## ${t.notes}`, '', t.notesText)

  return lines.join('\n')
}
