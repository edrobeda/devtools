// Constantes e helpers compartilhados pelas páginas de regex
// (/tools/regex-explainer e /tools/regex-railroad).
//
// Cada página mantém o seu PRÓPRIO parser, de propósito: o explainer devolve
// tokens no vocabulário { type, text, depth, data } (pra traduzir token a
// token), enquanto o railroad devolve TOKEN_TYPES + raw/desc (pra desenhar o
// SVG). Unificar os dois exigiria reconciliar diferenças de cobertura e de
// forma de saída e arriscaria mudar o diagrama, então o que é genuinamente
// igual entre as páginas vive aqui: flags, valores iniciais e a renderização
// dos matches.

export const FLAG_OPTIONS = ['g', 'i', 'm', 's', 'u', 'y']

export const DEFAULT_REGEX_PATTERN = '^(\\d{4})-(\\d{2})-(\\d{2})$'
export const DEFAULT_REGEX_FLAGS = ['m']
export const DEFAULT_REGEX_TEST_TEXT = '2026-08-20\n2026-08-21\n2026-8-1'
