// Gerador de .prettierrc
// 100% client-side: monta o arquivo de configuração do Prettier a partir
// de opções editáveis, sem nenhuma chamada de rede.

export const PRESETS = {
  default: {
    label: { pt: 'Padrão Prettier', en: 'Prettier default' },
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    trailingComma: 'es5',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'auto',
    singleAttributePerLine: false,
    includeSchema: false,
  },
  strict: {
    label: { pt: 'Estrito', en: 'Strict' },
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    trailingComma: 'all',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    jsxSingleQuote: true,
    quoteProps: 'as-needed',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'auto',
    singleAttributePerLine: false,
    includeSchema: false,
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    trailingComma: 'es5',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'auto',
    singleAttributePerLine: false,
    includeSchema: false,
  },
  node: {
    label: { pt: 'Node.js', en: 'Node.js' },
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    trailingComma: 'es5',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'auto',
    singleAttributePerLine: false,
    includeSchema: false,
  },
  react: {
    label: { pt: 'React/Vite', en: 'React/Vite' },
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    trailingComma: 'es5',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    jsxSingleQuote: true,
    quoteProps: 'as-needed',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'auto',
    singleAttributePerLine: true,
    includeSchema: false,
  },
  tabs: {
    label: { pt: 'Com Tabs', en: 'With Tabs' },
    semi: true,
    singleQuote: false,
    tabWidth: 4,
    useTabs: true,
    printWidth: 80,
    trailingComma: 'es5',
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'auto',
    singleAttributePerLine: false,
    includeSchema: false,
  },
}

const DEFAULT_PRESET = PRESETS.default

export function buildPrettierrc(options) {
  const opts = { ...DEFAULT_PRESET, ...options }
  const out = {}

  if (opts.includeSchema) {
    out.$schema = 'https://json.schemastore.org/prettierrc'
  }

  // Números
  if (opts.printWidth != null && opts.printWidth !== '') {
    out.printWidth = Number(opts.printWidth)
  }
  if (opts.tabWidth != null && opts.tabWidth !== '') {
    out.tabWidth = Number(opts.tabWidth)
  }

  // Booleanos
  if (typeof opts.semi === 'boolean') out.semi = opts.semi
  if (typeof opts.singleQuote === 'boolean') out.singleQuote = opts.singleQuote
  if (typeof opts.useTabs === 'boolean') out.useTabs = opts.useTabs
  if (typeof opts.bracketSpacing === 'boolean') out.bracketSpacing = opts.bracketSpacing
  if (typeof opts.bracketSameLine === 'boolean') out.bracketSameLine = opts.bracketSameLine
  if (typeof opts.jsxSingleQuote === 'boolean') out.jsxSingleQuote = opts.jsxSingleQuote
  if (typeof opts.singleAttributePerLine === 'boolean') {
    out.singleAttributePerLine = opts.singleAttributePerLine
  }

  // Enums
  if (opts.trailingComma) out.trailingComma = opts.trailingComma
  if (opts.arrowParens) out.arrowParens = opts.arrowParens
  if (opts.endOfLine) out.endOfLine = opts.endOfLine
  if (opts.quoteProps) out.quoteProps = opts.quoteProps
  if (opts.proseWrap) out.proseWrap = opts.proseWrap
  if (opts.htmlWhitespaceSensitivity) out.htmlWhitespaceSensitivity = opts.htmlWhitespaceSensitivity
  if (opts.embeddedLanguageFormatting) out.embeddedLanguageFormatting = opts.embeddedLanguageFormatting

  // Sempre emite pelo menos o básico para o arquivo não ficar vazio
  if (Object.keys(out).length === 0) {
    out.printWidth = 80
    out.tabWidth = 2
    out.semi = true
    out.singleQuote = false
  }

  return JSON.stringify(out, null, 2)
}
