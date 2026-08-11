// Morse code core: encode/decode + playback timing, no dependencies.
// A tabela cobre A-Z, 0-9, pontuação comum e os acentuados não-ambíguos
// (ñ/ç) — os demais acentuados colidem com letras (í = I, ú = U) e são
// descartados no encode.

export const MORSE = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
  'ñ': '--.--',
  'ç': '-.-..',
}

const REVERSE = {}
for (const [ch, code] of Object.entries(MORSE)) REVERSE[code] = ch

// Converte texto em morse. Letras/palavras são separadas por " " e " / "
// (a convenção mais usada). Caracteres fora da tabela são descartados e
// contados no retorno (ignored).
export function textToMorse(text) {
  const result = []
  let ignored = 0
  const words = text.toUpperCase().split(/\s+/).filter((w) => w.length > 0)
  for (const word of words) {
    const letters = []
    for (const ch of word) {
      const code = MORSE[ch]
      if (code) letters.push(code)
      else ignored += 1
    }
    if (letters.length === 0) continue
    if (result.length > 0) result.push('/')
    result.push(letters.join(' '))
  }
  return { morse: result.join(' '), ignored }
}

// Converte morse em texto. Tolerante a "·" no lugar de ".",
// múltiplos espaços/quebras e qualquer separador de palavra (/, |).
// Token desconhecido vira "?" e é contado em unknown.
export function morseToText(morse) {
  const normalized = morse.replace(/[·◦]/g, '.')
  const words = normalized.split(/\s*\/\s*|\s*\|\s*/)
  const out = []
  let unknown = 0
  for (const word of words) {
    const letters = []
    for (const tok of word.trim().split(/\s+/)) {
      if (!tok) continue
      if (REVERSE[tok]) letters.push(REVERSE[tok])
      else {
        letters.push('?')
        unknown += 1
      }
    }
    out.push(letters.join(''))
  }
  return { text: out.join(' '), unknown }
}

// Duração padrão "PARIS": 1 palavra = 50 unidades de tempo, então a
// unidade (1 dit) vale 1200ms / WPM. 20 WPM -> 60ms por unidade.
export function unitMs(wpm) {
  return 1200 / wpm
}

// Constrói a linha do tempo de reprodução: lista de eventos {on, ms}.
// dit = 1 unidade ligado, dah = 3, gap intra-caractere = 1,
// gap entre letras = 3, entre palavras = 7.
export function buildPlaybackTimeline(morse, wpm) {
  const unit = unitMs(wpm)
  const events = []
  const words = morse.split('/').map((w) => w.trim())
  words.forEach((word, wi) => {
    if (!word) return
    const letters = word.split(' ')
    const isLastWord = wi === words.length - 1
    letters.forEach((letter, li) => {
      for (let ci = 0; ci < letter.length; ci += 1) {
        const ch = letter[ci]
        events.push({ on: ch !== '-', ms: unit * (ch === '-' ? 3 : 1) })
        if (ci < letter.length - 1) events.push({ on: false, ms: unit })
      }
      const isLastLetter = li === letters.length - 1
      if (isLastLetter) {
        if (!isLastWord) events.push({ on: false, ms: unit * 7 })
      } else {
        events.push({ on: false, ms: unit * 3 })
      }
    })
  })
  return events
}

export function timelineDurationMs(timeline) {
  return timeline.reduce((sum, e) => sum + e.ms, 0)
}