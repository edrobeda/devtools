// Calculadora de IMC (Índice de Massa Corporal / Body Mass Index)
// 100% client-side — nenhum dado de saúde sai do navegador.
//
// Referências:
// - OMS: https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight
// - CDC: https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html

export const CATEGORIES = {
  underweight: {
    key: 'underweight',
    max: 18.5,
    color: '#1890ff',
  },
  normal: {
    key: 'normal',
    min: 18.5,
    max: 24.9,
    color: '#52c41a',
  },
  overweight: {
    key: 'overweight',
    min: 25,
    max: 29.9,
    color: '#faad14',
  },
  obesity1: {
    key: 'obesity1',
    min: 30,
    max: 34.9,
    color: '#fa8c16',
  },
  obesity2: {
    key: 'obesity2',
    min: 35,
    max: 39.9,
    color: '#f5222d',
  },
  obesity3: {
    key: 'obesity3',
    min: 40,
    color: '#820014',
  },
}

export function classifyBmi(bmi) {
  if (bmi < 18.5) return CATEGORIES.underweight
  if (bmi < 25) return CATEGORIES.normal
  if (bmi < 30) return CATEGORIES.overweight
  if (bmi < 35) return CATEGORIES.obesity1
  if (bmi < 40) return CATEGORIES.obesity2
  return CATEGORIES.obesity3
}

export function calculateBmi(weightKg, heightM) {
  if (!weightKg || !heightM || weightKg <= 0 || heightM <= 0) {
    return { bmi: null, category: null }
  }
  const bmi = weightKg / heightM ** 2
  const category = classifyBmi(bmi)
  return { bmi, category }
}

// Peso ideal para uma altura, considerando a faixa Saudável da OMS (18.5 a 24.9).
export function idealWeightRange(heightM) {
  if (!heightM || heightM <= 0) return { min: null, max: null }
  const min = 18.5 * heightM ** 2
  const max = 24.9 * heightM ** 2
  return { min, max }
}

// Peso que levaria ao IMC-alvo para a altura informada.
export function weightForBmi(heightM, targetBmi) {
  if (!heightM || heightM <= 0 || targetBmi == null || targetBmi <= 0) return null
  return targetBmi * heightM ** 2
}

// Converte medidas imperiais para métricas.
export function imperialToMetric(weightLb, heightFt, heightIn) {
  const weightKg = weightLb * 0.45359237
  const totalInches = heightFt * 12 + heightIn
  const heightM = totalInches * 0.0254
  return { weightKg, heightM }
}

// Converte medidas métricas para imperiais.
export function metricToImperial(weightKg, heightM) {
  const weightLb = weightKg / 0.45359237
  const totalInches = heightM / 0.0254
  const heightFt = Math.floor(totalInches / 12)
  const heightIn = totalInches - heightFt * 12
  return { weightLb, heightFt, heightIn }
}

export function formatBmi(bmi, locale = 'pt-BR') {
  if (bmi == null || !Number.isFinite(bmi)) return '—'
  return bmi.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function formatWeight(v, locale = 'pt-BR') {
  if (v == null || !Number.isFinite(v)) return '—'
  return v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// Presets de exemplo (peso em kg, altura em m).
export const PRESETS = [
  { key: 'normal', weightKg: 70, heightM: 1.75, label: { pt: 'Peso saudável', en: 'Healthy weight' } },
  { key: 'underweight', weightKg: 52, heightM: 1.78, label: { pt: 'Abaixo do peso', en: 'Underweight' } },
  { key: 'overweight', weightKg: 85, heightM: 1.70, label: { pt: 'Sobrepeso', en: 'Overweight' } },
  { key: 'obesity1', weightKg: 95, heightM: 1.68, label: { pt: 'Obesidade grau I', en: 'Obesity class I' } },
]

// Tabela-resumo das classificações (para exibição).
export function getClassificationTable() {
  return [
    { key: 'underweight', range: '< 18.5' },
    { key: 'normal', range: '18.5 – 24.9' },
    { key: 'overweight', range: '25.0 – 29.9' },
    { key: 'obesity1', range: '30.0 – 34.9' },
    { key: 'obesity2', range: '35.0 – 39.9' },
    { key: 'obesity3', range: '≥ 40.0' },
  ]
}
