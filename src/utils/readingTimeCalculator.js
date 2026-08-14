// Motor 100% client-side para calculo de tempo de leitura e estatisticas de texto.
// Nao envia dados para lugar nenhum.

const DEFAULT_READING_WPM = 238
const DEFAULT_SPEAKING_WPM = 130
const SLOW_READING_WPM = 180
const FAST_READING_WPM = 300

/**
 * Conta palavras em um texto.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  if (!text || !text.trim()) return 0
  // Separa por espacos e remove tokens vazios.
  const matches = text.trim().split(/\s+/).filter(Boolean)
  return matches.length
}

/**
 * Conta caracteres com ou sem espacos.
 * @param {string} text
 * @param {boolean} withSpaces
 * @returns {number}
 */
export function countCharacters(text, withSpaces = true) {
  if (!text) return 0
  return withSpaces ? text.length : text.replace(/\s/g, '').length
}

/**
 * Conta frases de forma simples: pontos finais, interrogacao ou exclamacao.
 * @param {string} text
 * @returns {number}
 */
export function countSentences(text) {
  if (!text || !text.trim()) return 0
  const matches = text.match(/[^.!?]+[.!?]+/g)
  return matches ? matches.length : (text.trim() ? 1 : 0)
}

/**
 * Conta paragrafos (blocos separados por quebra de linha).
 * @param {string} text
 * @returns {number}
 */
export function countParagraphs(text) {
  if (!text || !text.trim()) return 0
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length
}

/**
 * Estima o numero de silabas de uma palavra.
 * Heuristica inglesa/portuguesa: conta grupos de vogais.
 * @param {string} word
 * @returns {number}
 */
function countSyllablesInWord(word) {
  if (!word) return 0
  const clean = word.toLowerCase().replace(/[^a-záéíóúâêîôûãõàèìòùäëïöüç]/g, '')
  if (!clean) return 0
  const groups = clean.match(/[aeiouáéíóúâêîôûãõàèìòùäëïöü]+/g)
  return groups ? groups.length : 1
}

/**
 * Estima silabas do texto inteiro.
 * @param {string} text
 * @returns {number}
 */
export function countSyllables(text) {
  if (!text || !text.trim()) return 0
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + countSyllablesInWord(word), 0)
}

/**
 * Calcula tempo de leitura em minutos.
 * @param {number} words
 * @param {number} wpm - palavras por minuto
 * @returns {number}
 */
export function estimateReadingTime(words, wpm = DEFAULT_READING_WPM) {
  if (wpm <= 0) return 0
  return words / wpm
}

/**
 * Calcula tempo de fala/apresentacao em minutos.
 * @param {number} words
 * @param {number} wpm - palavras por minuto
 * @returns {number}
 */
export function estimateSpeakingTime(words, wpm = DEFAULT_SPEAKING_WPM) {
  if (wpm <= 0) return 0
  return words / wpm
}

/**
 * Quebra uma duracao em minutos em horas, minutos e segundos.
 * @param {number} minutes
 * @returns {{totalMinutes: number, hours: number, minutes: number, seconds: number, totalSeconds: number}}
 */
export function splitDuration(minutes) {
  const totalSeconds = Math.max(0, Math.round(minutes * 60))
  const hours = Math.floor(totalSeconds / 3600)
  const remaining = totalSeconds % 3600
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return {
    totalMinutes: minutes,
    totalSeconds,
    hours,
    minutes: mins,
    seconds: secs,
  }
}

/**
 * Formata uma duracao em string amigavel (pt/en sao controlados pela UI).
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  const d = splitDuration(minutes)
  const parts = []
  if (d.hours > 0) parts.push(`${d.hours}h`)
  if (d.minutes > 0) parts.push(`${d.minutes}min`)
  if (d.seconds > 0 || parts.length === 0) parts.push(`${d.seconds}s`)
  return parts.join(' ')
}

/**
 * Nivel de legibilidade aproximado baseado em Flesch Reading Ease.
 * Nao e uma traducao literal, mas uma faixa util para referencia rapida.
 * @param {number} words
 * @param {number} sentences
 * @param {number} syllables
 * @returns {number}
 */
export function fleschReadingEase(words, sentences, syllables) {
  if (words <= 0 || sentences <= 0 || syllables <= 0) return 0
  // 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  // Ajustado levemente para portugues (heuristica geral).
  const asl = words / sentences
  const asw = syllables / words
  return 206.835 - 1.015 * asl - 84.6 * asw
}

/**
 * Retorna um rotulo de dificuldade baseado no Flesch Reading Ease.
 * @param {number} score
 */
export function readabilityLabel(score) {
  if (score >= 90) return 'veryEasy'
  if (score >= 80) return 'easy'
  if (score >= 70) return 'fairlyEasy'
  if (score >= 60) return 'standard'
  if (score >= 50) return 'fairlyDifficult'
  if (score >= 30) return 'difficult'
  return 'veryDifficult'
}

/**
 * Retorna metricas completas de um texto.
 * @param {string} text
 * @param {number} readingWpm
 * @param {number} speakingWpm
 * @returns {{
 *   words: number,
 *   characters: number,
 *   charactersNoSpaces: number,
 *   sentences: number,
 *   paragraphs: number,
 *   syllables: number,
 *   avgWordLength: number,
 *   avgSentenceLength: number,
 *   readingMinutes: number,
 *   speakingMinutes: number,
 *   flesch: number,
 *   readability: string
 * }}
 */
export function analyzeText(text, readingWpm = DEFAULT_READING_WPM, speakingWpm = DEFAULT_SPEAKING_WPM) {
  const words = countWords(text)
  const characters = countCharacters(text, true)
  const charactersNoSpaces = countCharacters(text, false)
  const sentences = countSentences(text)
  const paragraphs = countParagraphs(text)
  const syllables = countSyllables(text)

  const avgWordLength = words > 0 ? charactersNoSpaces / words : 0
  const avgSentenceLength = sentences > 0 ? words / sentences : 0

  const readingMinutes = estimateReadingTime(words, readingWpm)
  const speakingMinutes = estimateSpeakingTime(words, speakingWpm)

  const flesch = fleschReadingEase(words, sentences || 1, syllables)
  const readability = readabilityLabel(flesch)

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    syllables,
    avgWordLength,
    avgSentenceLength,
    readingMinutes,
    speakingMinutes,
    flesch,
    readability,
  }
}

/**
 * Comparativo com documentos conhecidos.
 * @param {number} wordCount
 * @returns {{name: string, words: number, pct: number}[]}
 */
export function compareToKnownWorks(wordCount) {
  const works = [
    { key: 'tweet', words: 280 },
    { key: 'page', words: 500 },
    { key: 'blogPost', words: 1500 },
    { key: 'shortStory', words: 7500 },
    { key: 'novel', words: 90000 },
  ]
  return works.map((w) => ({
    key: w.key,
    words: w.words,
    pct: w.words > 0 ? Math.min(100, Math.round((wordCount / w.words) * 100)) : 0,
  }))
}

export {
  DEFAULT_READING_WPM,
  DEFAULT_SPEAKING_WPM,
  SLOW_READING_WPM,
  FAST_READING_WPM,
}
