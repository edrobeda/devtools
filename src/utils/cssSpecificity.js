// ─────────────────────────────────────────────────────────────
// Especificidade CSS compartilhada — 100% client-side, sem deps.
//
// Consumido por:
//   - src/pages/CssSpecificityCalculatorPage.jsx
//   - src/utils/cssPerformanceAnalyzer.js
//
// Especificidade = (a, b, c):
//   a = seletores de ID
//   b = classes, seletores de atributo e pseudo-classes
//   c = seletores de tipo (tag) e pseudo-elementos
// Referência: https://www.w3.org/TR/selectors-3/#specificity
//
// :where(...) sempre conta 0 (removido por completo). :is()/:not()/:has()
// contam a especificidade do conteúdo interno — aqui aproximada somando
// todos os tokens internos, já que o cálculo exato de "seletor mais
// específico entre os argumentos" exigiria um parser CSS completo.
// ─────────────────────────────────────────────────────────────

const PSEUDO_ELEMENTS = new Set([
  'before', 'after', 'first-line', 'first-letter', 'placeholder',
  'selection', 'marker', 'backdrop', 'file-selector-button', 'cue',
])

// Desembrulha pseudos funcionais mantendo o conteúdo interno de TODOS,
// inclusive :where. Serve pra achatar o seletor antes de medir a
// profundidade estrutural (o conteúdo de :where também representa um
// trecho da cadeia de matching). NÃO usar pra especificidade (:where = 0).
function flattenFunctionalPseudos(selector) {
  let s = selector
  for (let i = 0; i < 8; i++) {
    const next = s.replace(/:(?:where|is|not|matches|has)\(([^()]*)\)/gi, ' $1 ')
    if (next === s) break
    s = next
  }
  return s
}

function unwrapFunctionalPseudos(selector) {
  let s = selector
  // :where(...) contribui zero — remove por completo, mantendo espaço
  // pra não colar tokens vizinhos.
  for (let i = 0; i < 8; i++) {
    const next = s.replace(/:where\(([^()]*)\)/gi, ' ')
    if (next === s) break
    s = next
  }
  // :not(), :is()/:matches() e :has() — desembrulha mantendo o conteúdo
  // interno (o loop resolve funcionalidades aninhadas da esquerda pra
  // direita).
  return flattenFunctionalPseudos(s)
}

function computeSpecificity(rawSelector) {
  let s = unwrapFunctionalPseudos(rawSelector.trim())
  let a = 0
  let b = 0
  let c = 0

  // pseudo-elementos (:: sempre, ou : legado pra uma lista fixa) → c
  s = s.replace(/::?([a-zA-Z-]+)/g, (m, name) => {
    if (m.startsWith('::') || PSEUDO_ELEMENTS.has(name.toLowerCase())) {
      c += 1
      return ' '
    }
    return m // devolve pra próxima etapa contar como pseudo-classe
  })

  // IDs → a
  s = s.replace(/#[a-zA-Z_-][\w-]*/g, () => { a += 1; return ' ' })

  // atributos [foo="bar"] → b
  s = s.replace(/\[[^\]]*\]/g, () => { b += 1; return ' ' })

  // classes → b
  s = s.replace(/\.[a-zA-Z_-][\w-]*/g, () => { b += 1; return ' ' })

  // pseudo-classes restantes → b
  s = s.replace(/:[a-zA-Z-]+(\([^()]*\))?/g, () => { b += 1; return ' ' })

  // o que sobra: seletores de tipo (tag), exceto universal * e combinadores
  const rest = s.split(/[\s>+~,]+/).filter(Boolean)
  rest.forEach((token) => {
    if (token === '*' || token === '&') return
    if (/^[a-zA-Z][\w-]*$/.test(token)) c += 1
  })

  return { a, b, c }
}

function specificityNumber({ a, b, c }) {
  return a * 1_000_000 + b * 1_000 + c
}

function specificityLabel({ a, b, c }) {
  return `(${a},${b},${c})`
}

export {
  PSEUDO_ELEMENTS,
  unwrapFunctionalPseudos,
  flattenFunctionalPseudos,
  computeSpecificity,
  specificityNumber,
  specificityLabel,
}

export default computeSpecificity
