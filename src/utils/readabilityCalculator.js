/**
 * Motor de análise de legibilidade de texto — 100% client-side.
 * Implementa as principais métricas clássicas de legibilidade em inglês:
 * Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog, Coleman-Liau,
 * SMOG e Automated Readability Index (ARI). Também conta palavras, frases,
 * sílabas, caracteres e palavras complexas.
 *
 * As fórmulas foram originalmente calibradas para textos em inglês, mas os
 * contadores funcionam para qualquer idioma usando regras heurísticas de
 * contagem de sílabas por vogais.
 */

export const DEFAULT_READING_WPM = 238
export const DEFAULT_SPEAKING_WPM = 130

const VOWELS = /[aeiouáéíóúàèìòùâêîôûäëïöüãõæœ]/i

/**
 * Conta o número aproximado de sílabas de uma palavra em inglês.
 * Heurística clássica: conta grupos de vogais, ignora 'e' final mudo e
 * garante pelo menos uma sílaba por palavra.
 */
export function countSyllables(word) {
  if (!word) return 0
  const w = word.toLowerCase().replace(/[^a-záéíóúàèìòùâêîôûäëïöüãõæœ]/g, '')
  if (!w) return 0

  const matches = w.match(/[aeiouáéíóúàèìòùâêîôûäëïöüãõæœ]+/gi)
  let count = matches ? matches.length : 0

  // 'e' final muito comum em inglês: subtrai uma sílaba se houver mais de uma
  if (w.endsWith('e') && count > 1 && !w.endsWith('le')) {
    count -= 1
  }

  return Math.max(1, count)
}

function tokenizeWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
}

function tokenizeSentences(text) {
  const trimmed = text.trim()
  if (!trimmed) return []
  // Divide por pontuação de fim de frase seguida de espaço/fim/string,
  // mas preserva abreviações simples (Mr., Mrs., Dr., etc.).
  return trimmed
    .replace(/(Mr|Mrs|Ms|Dr|Prof|Sr|Sra|Srta|Jr|Sr)\./gi, '$1\u0001')
    .split(/[.!?]+\s*/)
    .map((s) => s.replace(/\u0001/g, '.'))
    .filter((s) => s.trim().length > 0)
}

function countCharacters(text) {
  return text.replace(/\s/g, '').length
}

function countLetters(text) {
  return (text.match(/[a-z]/gi) || []).length
}

/**
 * Analisa o texto e retorna métricas de legibilidade.
 */
export function analyzeReadability(text, readingWpm = DEFAULT_READING_WPM, speakingWpm = DEFAULT_SPEAKING_WPM) {
  const trimmed = text.trim()
  const wordsArray = tokenizeWords(trimmed)
  const sentencesArray = tokenizeSentences(trimmed)

  const words = wordsArray.length
  const sentences = sentencesArray.length
  const characters = text.length
  const charactersNoSpaces = countCharacters(text)
  const letters = countLetters(text)
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0

  let syllables = 0
  let complexWords = 0
  let longWords = 0
  wordsArray.forEach((w) => {
    const clean = w.replace(/[^a-z0-9áéíóúàèìòùâêîôûäëïöüãõæœ'-]/gi, '')
    const syl = countSyllables(clean)
    syllables += syl
    if (syl >= 3) complexWords += 1
    if (clean.length >= 7) longWords += 1
  })

  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0
  const avgSyllablesPerWord = words > 0 ? syllables / words : 0
  const avgLettersPerWord = words > 0 ? letters / words : 0

  // Flesch Reading Ease
  const fleschReadingEase =
    words > 0 && sentences > 0
      ? 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
      : 0

  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade =
    words > 0 && sentences > 0
      ? 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
      : 0

  // Gunning Fog Index
  const fogIndex =
    words > 0 && sentences > 0
      ? 0.4 * (avgWordsPerSentence + 100 * (complexWords / words))
      : 0

  // SMOG Index
  const smogIndex =
    sentences > 0 ? 1.043 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291 : 0

  // Coleman-Liau Index
  const colemanLiau =
    words > 0
      ? 0.0588 * ((letters / words) * 100) - 0.296 * ((sentences / words) * 100) - 15.8
      : 0

  // Automated Readability Index (ARI)
  const ari =
    words > 0 && sentences > 0
      ? 4.71 * (charactersNoSpaces / words) + 0.5 * (words / sentences) - 21.43
      : 0

  const readingMinutes = words / readingWpm
  const speakingMinutes = words / speakingWpm

  return {
    words,
    sentences,
    paragraphs,
    characters,
    charactersNoSpaces,
    letters,
    syllables,
    complexWords,
    longWords,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    avgLettersPerWord,
    fleschReadingEase,
    fleschKincaidGrade,
    fogIndex,
    smogIndex,
    colemanLiau,
    ari,
    readingMinutes,
    speakingMinutes,
  }
}

/**
 * Classifica o nível de dificuldade do texto baseado no Flesch Reading Ease.
 */
export function classifyFlesch(score) {
  if (score >= 90) return 'veryEasy'
  if (score >= 80) return 'easy'
  if (score >= 70) return 'fairlyEasy'
  if (score >= 60) return 'standard'
  if (score >= 50) return 'fairlyDifficult'
  if (score >= 30) return 'difficult'
  return 'veryDifficult'
}

/**
 * Formata minutos em string legível (ex.: "1min 23s" ou "0min 12s").
 */
export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return '0min 0s'
  const totalSeconds = Math.round(minutes * 60)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}min ${s}s`
}

/**
 * Retorna a descrição do nível escolar aproximado para um grade level.
 */
export function describeGradeLevel(level) {
  if (!Number.isFinite(level) || level <= 0) return 'preschool'
  if (level <= 1) return 'grade1'
  if (level <= 2) return 'grade2'
  if (level <= 3) return 'grade3'
  if (level <= 4) return 'grade4'
  if (level <= 5) return 'grade5'
  if (level <= 6) return 'grade6'
  if (level <= 7) return 'grade7'
  if (level <= 8) return 'grade8'
  if (level <= 9) return 'grade9'
  if (level <= 10) return 'grade10'
  if (level <= 11) return 'grade11'
  if (level <= 12) return 'grade12'
  if (level <= 14) return 'college'
  return 'graduate'
}

export const readabilityLabels = {
  veryEasy: { pt: 'Muito fácil', en: 'Very easy' },
  easy: { pt: 'Fácil', en: 'Easy' },
  fairlyEasy: { pt: 'Relativamente fácil', en: 'Fairly easy' },
  standard: { pt: 'Padrão', en: 'Standard' },
  fairlyDifficult: { pt: 'Relativamente difícil', en: 'Fairly difficult' },
  difficult: { pt: 'Difícil', en: 'Difficult' },
  veryDifficult: { pt: 'Muito difícil', en: 'Very difficult' },
}

export const gradeLabels = {
  preschool: { pt: 'Pré-escolar', en: 'Preschool' },
  grade1: { pt: '1º ano', en: '1st grade' },
  grade2: { pt: '2º ano', en: '2nd grade' },
  grade3: { pt: '3º ano', en: '3rd grade' },
  grade4: { pt: '4º ano', en: '4th grade' },
  grade5: { pt: '5º ano', en: '5th grade' },
  grade6: { pt: '6º ano', en: '6th grade' },
  grade7: { pt: '7º ano', en: '7th grade' },
  grade8: { pt: '8º ano', en: '8th grade' },
  grade9: { pt: '9º ano', en: '9th grade' },
  grade10: { pt: '10º ano', en: '10th grade' },
  grade11: { pt: '11º ano', en: '11th grade' },
  grade12: { pt: '12º ano', en: '12th grade' },
  college: { pt: 'Universitário', en: 'College' },
  graduate: { pt: 'Pós-graduação', en: 'Graduate' },
}

/**
 * Presets de exemplo para demonstração das métricas.
 */
export const SAMPLE_TEXTS = {
  simple: {
    pt: 'O gato dorme no tapete. A menina corre no parque. O sol brilha forte hoje.',
    en: 'The cat sleeps on the mat. The girl runs in the park. The sun shines bright today.',
  },
  article: {
    pt: `A computação em nuvem transformou a forma como as empresas implantam software. Em vez de gerenciar servidores físicos, equipes de engenharia podem provisionar recursos sob demanda, pagando apenas pelo que utilizam. Essa elasticidade reduz custos fixos e acelera experimentação.

No entanto, a nuvem também introduz complexidade operacional. Monitoramento, segurança e controle de custos exigem disciplina. Organizações maduras adotam práticas como infraestrutura como código, pipelines de entrega contínua e políticas de governança bem definidas.`,
    en: `Cloud computing has transformed how companies deploy software. Instead of managing physical servers, engineering teams can provision resources on demand, paying only for what they use. This elasticity reduces fixed costs and accelerates experimentation.

However, the cloud also introduces operational complexity. Monitoring, security, and cost control require discipline. Mature organizations adopt practices such as infrastructure as code, continuous delivery pipelines, and well-defined governance policies.`,
  },
  technical: {
    pt: `A implementação de um algoritmo de consenso distribuído exige a coordenação de múltiplos nós tolerantes a falhas Byzantineas. Protocolos como Practical Byzantine Fault Tolerance (PBFT) empregam uma sequência de rodadas de voto, garantindo que réplicas corretas concordem sobre a ordenação total de requisições mesmo na presença de comportamento arbitrário de uma fração limitada de participantes.

A complexidade comunicacional é quadrática no número de réplicas, o que limita a escalabilidade vertical do esquema. Otimizações subsequentes, incluindo pipelines e agrupamento hierárquico, buscam reduzir a latência preservendo as garantias de segurança.`,
    en: `Implementing a distributed consensus algorithm requires coordinating multiple Byzantine-fault-tolerant nodes. Protocols such as Practical Byzantine Fault Tolerance (PBFT) employ a sequence of voting rounds, ensuring that correct replicas agree on the total order of requests even in the presence of arbitrary behavior by a limited fraction of participants.

The communication complexity is quadratic in the number of replicas, which limits the vertical scalability of the scheme. Subsequent optimizations, including pipelining and hierarchical grouping, aim to reduce latency while preserving safety guarantees.`,
  },
}
