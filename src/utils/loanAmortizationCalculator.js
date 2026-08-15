// Motor 100% client-side para calculo de amortizacao SAC e Price.
// Nenhum dado sai do navegador.

/**
 * Arredonda um numero para duas casas decimais (centavos).
 * @param {number} value
 * @returns {number}
 */
export function round2(value) {
  return Math.round(value * 100) / 100
}

/**
 * Formata um numero como moeda corrente.
 * @param {number} value
 * @param {string} locale
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(value, locale = 'pt-BR', currency = 'BRL') {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formata um numero decimal como percentual.
 * @param {number} value
 * @param {number} [fractionDigits=2]
 * @returns {string}
 */
export function formatPercent(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(fractionDigits).replace('.', ',')}%`
}

/**
 * Calcula a amortizacao de um financiamento pelo sistema SAC.
 *
 * @param {number} principal - valor financiado
 * @param {number} monthlyRate - taxa de juros mensal em decimal (ex.: 0.01 para 1%)
 * @param {number} months - prazo em meses
 * @returns {Array<{month: number, startBalance: number, amortization: number, interest: number, payment: number, endBalance: number}>}
 */
export function calculateSac(principal, monthlyRate, months) {
  if (!Number.isFinite(principal) || !Number.isFinite(monthlyRate) || !Number.isFinite(months) || months <= 0) {
    return []
  }

  const amortization = round2(principal / months)
  const rows = []
  let balance = principal

  for (let month = 1; month <= months; month++) {
    const startBalance = balance
    const interest = round2(startBalance * monthlyRate)
    let payment = round2(amortization + interest)

    // Ajusta o ultimo mes para zerar o saldo devedor sem diferenca de centavos.
    if (month === months) {
      const remaining = round2(startBalance - amortization)
      payment = round2(startBalance + interest)
      rows.push({
        month,
        startBalance: round2(startBalance),
        amortization: round2(startBalance - remaining),
        interest,
        payment,
        endBalance: 0,
      })
      balance = 0
    } else {
      balance = round2(startBalance - amortization)
      rows.push({
        month,
        startBalance: round2(startBalance),
        amortization,
        interest,
        payment,
        endBalance: round2(balance),
      })
    }
  }

  return rows
}

/**
 * Calcula a amortizacao de um financiamento pelo sistema Price.
 *
 * @param {number} principal - valor financiado
 * @param {number} monthlyRate - taxa de juros mensal em decimal (ex.: 0.01 para 1%)
 * @param {number} months - prazo em meses
 * @returns {Array<{month: number, startBalance: number, amortization: number, interest: number, payment: number, endBalance: number}>}
 */
export function calculatePrice(principal, monthlyRate, months) {
  if (!Number.isFinite(principal) || !Number.isFinite(monthlyRate) || !Number.isFinite(months) || months <= 0) {
    return []
  }

  // Prestacao constante (sem arredondamento ainda para evitar desvio).
  const factor = monthlyRate === 0 ? 1 / months : (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  const payment = principal * factor

  const rows = []
  let balance = principal

  for (let month = 1; month <= months; month++) {
    const startBalance = balance
    const interest = round2(startBalance * monthlyRate)
    let amortization

    if (month === months) {
      // Ultima prestacao absorve o saldo remanescente para zerar exatamente.
      amortization = round2(startBalance)
      rows.push({
        month,
        startBalance: round2(startBalance),
        amortization,
        interest,
        payment: round2(amortization + interest),
        endBalance: 0,
      })
      balance = 0
    } else {
      amortization = round2(payment - interest)
      // Garante que nao haja amortizacao negativa por arredondamento.
      if (amortization < 0) amortization = 0
      balance = round2(startBalance - amortization)
      rows.push({
        month,
        startBalance: round2(startBalance),
        amortization,
        interest,
        payment: round2(payment),
        endBalance: round2(balance),
      })
    }
  }

  return rows
}

/**
 * Calcula a tabela de amortizacao de acordo com o sistema escolhido.
 *
 * @param {number} principal
 * @param {number} annualRate - taxa anual em decimal
 * @param {number} months
 * @param {'SAC' | 'PRICE'} system
 * @returns {Array<{month: number, startBalance: number, amortization: number, interest: number, payment: number, endBalance: number}>}
 */
export function calculateAmortization(principal, annualRate, months, system = 'PRICE') {
  const monthlyRate = annualRate / 12
  if (system === 'SAC') {
    return calculateSac(principal, monthlyRate, months)
  }
  return calculatePrice(principal, monthlyRate, months)
}

/**
 * Retorna o resumo de uma tabela de amortizacao.
 *
 * @param {ReturnType<calculateAmortization>} rows
 * @returns {{firstPayment: number, lastPayment: number, averagePayment: number, totalPaid: number, totalInterest: number, totalAmortization: number}}
 */
export function getSummary(rows) {
  if (!rows.length) {
    return {
      firstPayment: 0,
      lastPayment: 0,
      averagePayment: 0,
      totalPaid: 0,
      totalInterest: 0,
      totalAmortization: 0,
    }
  }

  const totalPaid = round2(rows.reduce((sum, r) => sum + r.payment, 0))
  const totalInterest = round2(rows.reduce((sum, r) => sum + r.interest, 0))
  const totalAmortization = round2(rows.reduce((sum, r) => sum + r.amortization, 0))
  const averagePayment = round2(totalPaid / rows.length)

  return {
    firstPayment: rows[0].payment,
    lastPayment: rows[rows.length - 1].payment,
    averagePayment,
    totalPaid,
    totalInterest,
    totalAmortization,
  }
}

/**
 * Sistemas de amortizacao suportados.
 */
export const AMORTIZATION_SYSTEMS = [
  { key: 'PRICE', labelPt: 'Price (prestacoes fixas)', labelEn: 'Price (fixed installments)' },
  { key: 'SAC', labelPt: 'SAC (amortizacao constante)', labelEn: 'SAC (constant amortization)' },
]

/**
 * Exemplos rapidos de um clique.
 */
export const EXAMPLES = [
  {
    key: 'home',
    labelPt: 'Financiamento de imovel',
    labelEn: 'Home loan',
    principal: 300000,
    annualRate: 0.099,
    months: 360,
    system: 'PRICE',
  },
  {
    key: 'car',
    labelPt: 'Financiamento de carro',
    labelEn: 'Car loan',
    principal: 80000,
    annualRate: 0.18,
    months: 60,
    system: 'SAC',
  },
  {
    key: 'personal',
    labelPt: 'Emprestimo pessoal',
    labelEn: 'Personal loan',
    principal: 15000,
    annualRate: 0.24,
    months: 24,
    system: 'PRICE',
  },
]
