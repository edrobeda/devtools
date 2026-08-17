export function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value, decimals = 1) {
  if (!Number.isFinite(value)) return '—'
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`
}

export function calculateNps(detractors, neutrals, promoters) {
  const d = Math.max(0, Math.round(Number(detractors) || 0))
  const n = Math.max(0, Math.round(Number(neutrals) || 0))
  const p = Math.max(0, Math.round(Number(promoters) || 0))
  const total = d + n + p

  if (total === 0) {
    return {
      total: 0,
      nps: 0,
      promoterPct: 0,
      neutralPct: 0,
      detractorPct: 0,
      valid: false,
    }
  }

  const promoterPct = (p / total) * 100
  const neutralPct = (n / total) * 100
  const detractorPct = (d / total) * 100
  const nps = promoterPct - detractorPct

  return {
    total,
    nps,
    promoterPct,
    neutralPct,
    detractorPct,
    valid: true,
  }
}

export function classifyNps(nps, lang = 'pt') {
  const labels = {
    pt: {
      excellent: { label: 'Excelente', color: 'success', description: 'Clientes apaixonados; forte word-of-mouth.' },
      good: { label: 'Bom', color: 'green', description: 'Satisfação saudável, mas ainda há espaço para crescimento.' },
      average: { label: 'Regular', color: 'warning', description: 'Neutros dominam; risco de churn.' },
      poor: { label: 'Ruim', color: 'orange', description: 'Mais detratores do que promotores; investigar causas.' },
      terrible: { label: 'Crítico', color: 'error', description: 'Crise de satisfação; ação imediata necessária.' },
    },
    en: {
      excellent: { label: 'Excellent', color: 'success', description: 'Loyal enthusiasts; strong word-of-mouth.' },
      good: { label: 'Good', color: 'green', description: 'Healthy satisfaction, but room to grow.' },
      average: { label: 'Average', color: 'warning', description: 'Neutrals dominate; churn risk.' },
      poor: { label: 'Poor', color: 'orange', description: 'More detractors than promoters; investigate root causes.' },
      terrible: { label: 'Critical', color: 'error', description: 'Satisfaction crisis; immediate action required.' },
    },
  }

  const l = labels[lang] || labels.pt

  if (nps >= 50) return { ...l.excellent, range: '≥ 50' }
  if (nps >= 30) return { ...l.good, range: '30 – 49' }
  if (nps >= 0) return { ...l.average, range: '0 – 29' }
  if (nps >= -30) return { ...l.poor, range: '−30 – −1' }
  return { ...l.terrible, range: '< −30' }
}

export const PRESETS = {
  pt: {
    excellent: { label: 'NPS excelente', detractors: 20, neutrals: 50, promoters: 230 },
    good: { label: 'NPS bom', detractors: 60, neutrals: 120, promoters: 170 },
    average: { label: 'NPS regular', detractors: 100, neutrals: 150, promoters: 100 },
    poor: { label: 'NPS ruim', detractors: 160, neutrals: 80, promoters: 60 },
    critical: { label: 'NPS crítico', detractors: 200, neutrals: 60, promoters: 40 },
  },
  en: {
    excellent: { label: 'Excellent NPS', detractors: 20, neutrals: 50, promoters: 230 },
    good: { label: 'Good NPS', detractors: 60, neutrals: 120, promoters: 170 },
    average: { label: 'Average NPS', detractors: 100, neutrals: 150, promoters: 100 },
    poor: { label: 'Poor NPS', detractors: 160, neutrals: 80, promoters: 60 },
    critical: { label: 'Critical NPS', detractors: 200, neutrals: 60, promoters: 40 },
  },
}
